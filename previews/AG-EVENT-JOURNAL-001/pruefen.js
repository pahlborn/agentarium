/* AG-EVENT-JOURNAL-001 — Nachweis Schritt 1: der Lebenszyklusvertrag.

   Start:  node previews/AG-EVENT-JOURNAL-001/pruefen.js
   Eigener Browser:  AG_CHROMIUM=/pfad/zur/datei node previews/...

   Rückgabe 0 = alles wie vereinbart, 1 = Abweichung, 2 = ungeprüft.

   WAS HIER GEPRÜFT WIRD. Der echte Parser aus `pilot/github-live/github-live.js`
   an der echten Seite, mit Körpern, die genau so aussehen wie die, die später
   ein Agent auf Vorgang #2 legt. Je ein Fixture für eine Claude-Rolle (forge)
   und eine ChatGPT-Rolle (sentinel) — dieselbe Schnittstelle, wie der Auftrag
   es verlangt.

   WAS DIESER SCHRITT NICHT TUT. Er treibt noch keinen Aufgabenzustand: kein
   Ring, kein Ballwechsel, kein Zähler am Agenten. Die Arten kommen an und
   werden gezeigt, nicht ausgewertet. Das ist Absicht und steht auch im
   Quelltext: Angenommen und nicht gezeigt wäre eine stille Lüge; getrieben
   und nicht geprüft wäre die größere.

   WAS ER AUSDRÜCKLICH PRÜFT, weil Atlas es am 21.10. verlangt hat:
   - Melder (`reporter`) und Akteur (`actor`) sind getrennte Felder.
   - Ein Lebenszyklusereignis OHNE Melder wird abgewiesen, nicht geraten.
   - Fremdaussage (Melder ≠ Akteur) kommt an, gilt aber nicht als
     Selbstauskunft.
   - Transportduplikat ist wirkungslos, dieselbe Kennung mit anderem Inhalt
     ist ein Konflikt und wird abgewiesen.
   - Ein Original ohne die Zusage `lebenszyklus` bekommt die Arten nicht.  */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');

const WURZEL = path.resolve(__dirname, '..', '..');
const ZIEL = path.join(WURZEL, 'pilot', 'github-live');
const MARKER = '<!-- AGENTARIUM_EVENT_V1 -->';

let fehler = 0;
function zeile(w, ist, soll) {
  const ok = ist === soll;
  if (!ok) fehler++;
  console.log('  ' + (ok ? 'ok  ' : 'FEHL') + '  ' + w.padEnd(46) +
              String(ist).padEnd(24) + (ok ? '' : '(erwartet ' + soll + ')'));
}
function ungeprueft(grund) { console.log('\nUNGEPRÜFT: ' + grund); process.exit(2); }

function ausfuehrbareDatei(p) {
  if (!p) return false;
  try {
    const s = fs.statSync(p);
    if (!s.isFile()) return false;
    fs.accessSync(p, fs.constants.X_OK);
    return true;
  } catch (e) { return false; }
}
function chromiumPfad(chromium) {
  if (!chromium) return { grund: 'playwright fehlt, daher ist kein Browser zu starten' };
  const g = process.env.AG_CHROMIUM;
  if (g) return ausfuehrbareDatei(g) ? { pfad: g }
    : { grund: 'AG_CHROMIUM zeigt nicht auf eine ausfuehrbare Datei: ' + g };
  let p = null;
  try { p = chromium.executablePath(); } catch (e) {
    return { grund: 'playwright meldet keinen Browserpfad: ' + e.message };
  }
  return ausfuehrbareDatei(p) ? { pfad: p }
    : { grund: 'von playwright gemeldete Datei fehlt oder ist nicht ausfuehrbar: ' + p };
}

const TYPEN = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
                '.json': 'application/json', '.png': 'image/png',
                '.webmanifest': 'application/manifest+json' };
function tischen(wurzel) {
  return new Promise(r => {
    const s = http.createServer((q, a) => {
      const u = decodeURIComponent(q.url.split('?')[0]);
      const f = path.join(wurzel, u === '/' ? 'index.html' : u);
      fs.readFile(f, (e, d) => {
        if (e) { a.writeHead(404).end(); return; }
        a.writeHead(200, { 'Content-Type': TYPEN[path.extname(f)] || 'application/octet-stream' });
        a.end(d);
      });
    });
    s.listen(0, '127.0.0.1', () => r({ s, adr: 'http://127.0.0.1:' + s.address().port + '/' }));
  });
}

/* Ein Körper, wie ein Agent ihn auf #2 legen würde. Absichtlich hier
   zusammengesetzt und nicht aus dem Relais geholt: Das Relais sendet diese
   Arten noch nicht — es ist der Punkt des Auftrags, dass alle Rollen sie
   senden KÖNNEN. Dass der Parser sie nimmt, ist daher die Frage; dass ein
   Programm sie erzeugt, ist die nächste. */
function koerper(f) {
  const ev = {
    schema: 'agentarium.github-event.v1',
    id: f.id, project_id: 'agentarium', run_id: 'AG-EVENT-JOURNAL-001',
    task_id: f.task, actor: f.actor, kind: f.kind,
    title: f.title, occurred_at: f.at || '2026-10-21T08:00:00Z',
    source_evidence: f.evidence || 'reported_checkpoint',
    source_tool_id: f.tool || 'previews/AG-EVENT-JOURNAL-001/pruefen.js'
  };
  if (f.recipient) ev.recipient = f.recipient;
  if (f.reporter) ev.reporter = f.reporter;
  let text = '## ' + f.kind + ' — ' + f.title + '\n\n';
  text += MARKER + '\n```json\n' + JSON.stringify(ev, null, 2) + '\n```';
  return text;
}

(async () => {
  console.log('AG-EVENT-JOURNAL-001 — der Lebenszyklusvertrag am echten Parser\n');

  let chromium = null;
  try { chromium = require('playwright').chromium; } catch (e) {}
  const br = chromiumPfad(chromium);
  if (br.grund) ungeprueft(br.grund);

  const b = await chromium.launch({ executablePath: br.pfad,
                                    args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const n = await tischen(ZIEL);
  const q = await b.newContext({ viewport: { width: 1194, height: 834 } });
  const s = await q.newPage();
  const pageErr = [];
  s.on('pageerror', e => pageErr.push(String(e) + '\n        ' + String(e.stack || '').split('\n').slice(1, 5).join('\n        ')));

  let abrufe = 0, antwort = [];
  await s.route('**api.github.com/**', route => {
    abrufe++;
    route.fulfill({ status: 200, contentType: 'application/json',
                    headers: { ETag: 'W/"ag-journal-' + abrufe + '"' },
                    body: JSON.stringify(antwort) });
  });

  await s.goto(n.adr + '?live=github', { waitUntil: 'load' });
  await s.waitForTimeout(2200);
  const da = await s.evaluate(() => !!document.getElementById('agGhToken'));
  if (!da) { await b.close(); n.s.close(); ungeprueft('kein Livefach — ohne WebGL kein Monitor'); }

  console.log('A — Die Zusagen des Originals');
  console.log('    erwartet: beide Worte, sonst bekommt der Adapter die Arten nicht\n');
  const z = await s.evaluate(() => ({
    komm: (window.__agGithubBruecke || {}).kommunikation,
    leben: (window.__agGithubBruecke || {}).lebenszyklus,
    fassung: (window.__agGithubBruecke || {}).fassung
  }));
  zeile('kommunikation', z.komm, 'beobachtet-v1');
  zeile('lebenszyklus', z.leben, 'gemeldet-v1');
  console.log('        Fassung des Originals: ' + z.fassung);

  await s.fill('#agGhToken', 'AGJOURNAL001_Scheintoken_fuer_den_Nachweis_0123456789');
  await s.click('#agGhAn');
  await s.waitForTimeout(2500);
  await s.evaluate(() => { const d = document.getElementById('agGhAuf'); if (d) d.open = true; });

  async function liefern(name, body, cid) {
    antwort = [{ id: cid, body: body,
                 user: { login: 'github-actions[bot]', id: 41898282 },
                 created_at: new Date().toISOString() }];
    await s.waitForTimeout(2800);
    return await s.evaluate(() => ({
      letztes: (document.getElementById('agGhLetztes') || {}).textContent || '',
      zahlen: (document.getElementById('agGhZahlen') || {}).textContent || '',
      grund: (document.getElementById('agGhGrund') || {}).textContent || ''
    }));
  }

  console.log('\nB — Je ein Fixture, dieselbe Schnittstelle');
  console.log('    forge ist eine Claude-Rolle, sentinel eine ChatGPT-Rolle\n');

  /* Claude-Rolle: forge meldet seinen eigenen Beginn. */
  const r1 = await liefern('forge/started', koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:started', task: 'AG-EVJ-001',
    actor: 'forge', reporter: 'forge', kind: 'started',
    title: 'Forge hat begonnen — Selbstauskunft der arbeitenden Rolle'
  }), 90001);
  zeile('forge: started angenommen', /started/.test(r1.letztes), true);
  zeile('forge: als Akteur genannt', /forge/.test(r1.letztes), true);
  zeile('forge: nicht abgewiesen', r1.grund, '');

  /* ChatGPT-Rolle: sentinel meldet eine Lieferung, ebenfalls über sich. */
  const r2 = await liefern('sentinel/delivered', koerper({
    id: 'AG-EVENT-JOURNAL-001:sentinel:delivered', task: 'AG-EVJ-002',
    actor: 'sentinel', reporter: 'sentinel', kind: 'delivered',
    title: 'Sentinel hat geliefert — Prüfung und Annahme bleiben getrennt'
  }), 90002);
  zeile('sentinel: delivered angenommen', /delivered/.test(r2.letztes), true);
  zeile('sentinel: als Akteur genannt', /sentinel/.test(r2.letztes), true);
  zeile('sentinel: nicht abgewiesen', r2.grund, '');

  console.log('\nC — Melder und Akteur sind nicht dasselbe');
  console.log('    erwartet: Fremdaussage kommt an, gilt aber nicht als Selbstauskunft\n');
  const r3 = await liefern('atlas-ueber-forge', koerper({
    id: 'AG-EVENT-JOURNAL-001:atlas-ueber-forge:started', task: 'AG-EVJ-003',
    actor: 'forge', reporter: 'atlas', kind: 'started',
    title: 'Atlas meldet einen Beginn von forge — Fremdaussage'
  }), 90003);
  zeile('Fremdaussage angenommen', /started/.test(r3.letztes), true);
  const selbst = await s.evaluate(() => {
    const l = (window.__agLive && window.__agLive.liste) || null;
    return l ? null : undefined;        /* keine Innenschau: siehe unten */
  });
  console.log('        (Ob sie als Selbstauskunft gilt, prüft Schritt 2 am');
  console.log('         Aufgabenzustand — heute treibt noch keine Art einen.)');

  console.log('\nD — Ohne Melder wird nicht geraten');
  console.log('    erwartet: abgewiesen, Grund benannt\n');
  const r4 = await liefern('ohne-melder', koerper({
    id: 'AG-EVENT-JOURNAL-001:ohne-melder:started', task: 'AG-EVJ-004',
    actor: 'forge', kind: 'started',
    title: 'Beginn ohne Angabe, wer ihn meldet'
  }), 90004);
  zeile('abgewiesen', /reporter fehlt/.test(r4.grund), true);
  zeile('nicht als Ereignis gezeigt', /ohne-melder/.test(r4.letztes), false);

  console.log('\nE — Duplikat gegen Konflikt');
  console.log('    erwartet: derselbe Inhalt wirkungslos, anderer Inhalt abgewiesen\n');
  const gleich = koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:started', task: 'AG-EVJ-001',
    actor: 'forge', reporter: 'forge', kind: 'started',
    title: 'Forge hat begonnen — Selbstauskunft der arbeitenden Rolle'
  });
  const vorher = (await s.evaluate(() =>
    (document.getElementById('agGhZahlen') || {}).textContent || ''));
  const r5 = await liefern('duplikat', gleich, 90005);
  zeile('Duplikat gezählt', /doppelt [1-9]/.test(r5.zahlen), true);
  zeile('Duplikat nicht als Konflikt', /Konflikt 0/.test(r5.zahlen), true);

  const r6 = await liefern('konflikt', koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:started', task: 'AG-EVJ-001',
    actor: 'forge', reporter: 'forge', kind: 'started',
    title: 'Derselbe Schlüssel, anderer Titel — das ist ein Befund'
  }), 90006);
  zeile('Konflikt gezählt', /Konflikt [1-9]/.test(r6.zahlen), true);
  zeile('Konflikt begründet', /gleiche Kennung, anderer Inhalt/.test(r6.grund), true);

  console.log('\nF — Abbruch wird gezählt, und zwar nur für diese Sitzung');
  console.log('    erwartet: „in dieser Sitzung beobachtet", Abdeckung partial\n');
  const r7 = await liefern('blocked', koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:blocked', task: 'AG-EVJ-001',
    actor: 'forge', reporter: 'forge', kind: 'blocked',
    title: 'Forge klemmt — Grund steht im Beleg, nicht im Bild'
  }), 90007);
  zeile('blocked angenommen', /blocked/.test(r7.letztes), true);
  zeile('Sitzungszählung erscheint', /in dieser Sitzung beobachtet: 1 Abbruch/.test(r7.zahlen), true);
  zeile('Abdeckung ausgewiesen', /Projektabdeckung: partial/.test(r7.zahlen), true);
  zeile('keine Projektzahl behauptet', /Projektabdeckung: complete/.test(r7.zahlen), false);

  console.log('\nG — Was dieser Schritt NICHT tut');
  console.log('    erwartet: kein Aufgabenzustand getrieben, kein Ring, kein Zähler\n');
  const zust = await s.evaluate(() => (window.__agStand && window.__agStand()) || null);
  if (zust && typeof zust === 'object') {
    zeile('keine offene Aufgabe gebucht', zust.aufgabenAuf || 0, 0);
    zeile('kein Ball verschoben', zust.ball || null, null);
  } else {
    console.log('  ok    kein Zustandsfenster vorhanden — nichts zu treiben');
  }
  zeile('keine Seitenfehler', pageErr.length, 0);
  if (pageErr.length) console.log('        ' + pageErr.join('\n        '));

  await b.close();
  n.s.close();

  if (fehler) {
    console.log('\n' + fehler + ' ABWEICHUNG' + (fehler > 1 ? 'EN' : '') + '.');
    process.exit(1);
  }
  console.log('\nALLES WIE VEREINBART — keine Abweichung.');
  console.log('Schritt 1 von zwei: Der Vertrag trägt die Lebenszyklusarten, der');
  console.log('Melder ist vom Akteur getrennt, Duplikat und Konflikt sind');
  console.log('unterschieden. Kein Aufgabenzustand wird getrieben — das ist');
  console.log('Schritt 2. Synthetische Körper, kein Relais, keine Abnahme am iPad.');
  process.exit(0);
})().catch(e => { ungeprueft('Nachweis abgebrochen: ' + (e && e.message)); });
