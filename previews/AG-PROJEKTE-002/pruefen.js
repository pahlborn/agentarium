/* AG-PROJEKTE-002 — der Monitor liest das Projektverzeichnis.

   Aufruf:            node previews/AG-PROJEKTE-002/pruefen.js
   Eigener Browser:   AG_CHROMIUM=/pfad/zur/datei node previews/...
   Aufnahmen ablegen: AG_AUFNAHMEN=/verzeichnis node previews/...
   Rueckgabe: 0 = bestanden, 1 = Abweichung, 2 = ungeprueft.

   PETER, 25.10.: Nur Projekte aus dem Verzeichnis erscheinen. Live sind sie
   einzeln waehlbar, dazu "Alle Projekte" als Startansicht; dort traegt jede
   Meldung das Kuerzel. Oben rechts steht die Wahl.

     A  Start "Alle Projekte": offene Baelle verzeichneter Projekte liegen,
        ein NICHT verzeichnetes Projekt bleibt weg; das Blatt oben rechts
        nennt "Alle Projekte" und jedes Projekt mit Kuerzel
     B  live: ein Ball eines verzeichneten Projekts fliegt und traegt das
        Kuerzel; ein nicht verzeichnetes fliegt nicht
     C  ein Projekt waehlen: nur noch dessen offene Baelle, nur noch dessen
        Fluege, ohne Kuerzel; oben rechts steht der Projektname
     D  zurueck auf "Alle": alles Verzeichnete wieder da, auch was waehrend
        der Einzelansicht kam
     E  Verzeichnis nicht lesbar: alles wie bisher -- alle Projekte, keine
        Projektwahl

   GRENZEN: Attrappe mit Scheintoken, Probekoerper, Verzeichnis als
   Attrappe. Keine Abnahme am iPad.                                         */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os');

const ZIEL = process.env.AG_ZIEL || 'pilot/github-live';
const WURZEL = path.resolve(__dirname, '..', '..', ...ZIEL.split('/'));
const AUFNAHMEN = process.env.AG_AUFNAHMEN ||
  fs.mkdtempSync(path.join(os.tmpdir(), 'ag-projekte-'));
const VERZEICHNIS = {
  schema: 'agentarium.projektverzeichnis.v1', gepflegt_von: 'atlas',
  projekte: [
    { id: 'agentarium', kuerzel: 'AG', name: 'Agentarium', repo: 'pahlborn/agentarium' },
    { id: 'allgemein', kuerzel: 'ALLG', name: 'Allgemein', repo: null },
    { id: 'gt40', kuerzel: 'GT', name: 'GT40 Baubuch', repo: null }
  ]
};

let fehler = 0;
function zeile(w, ist, soll) {
  const ok = ist === soll;
  if (!ok) fehler++;
  console.log('  ' + (ok ? 'ok  ' : 'FEHL') + '  ' + w.padEnd(50) +
              String(ist).padEnd(30) + (ok ? '' : '(erwartet ' + soll + ')'));
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
      const rein = decodeURIComponent(q.url.split('?')[0]);
      const f = path.join(wurzel, rein === '/' ? 'index.html' : rein);
      if (!f.startsWith(wurzel)) { a.writeHead(403).end(); return; }
      fs.readFile(f, (e, d) => {
        if (e) { a.writeHead(404).end(); return; }
        a.writeHead(200, { 'Content-Type': TYPEN[path.extname(f)] || 'application/octet-stream' });
        a.end(d);
      });
    });
    s.listen(0, '127.0.0.1', () => r({ s, adr: 'http://127.0.0.1:' + s.address().port + '/' }));
  });
}

let nr = 0;
function kommentar(zeit, ereignis) {
  nr++;
  const e = Object.assign({
    schema: 'agentarium.github-event.v1', id: 'AG-PROJEKTE-EREIGNIS-' + nr,
    occurred_at: zeit, reporter: 'atlas',
    source_evidence: 'reported_checkpoint', source_tool_id: 'previews/AG-PROJEKTE-002'
  }, ereignis);
  return { id: 9930000000 + nr, created_at: zeit,
           user: { login: 'pahlborn', id: 277496791 },
           body: '<!-- AGENTARIUM_EVENT_V1 -->\n```json\n' + JSON.stringify(e, null, 2) +
                 '\n```\nProbe aus AG-PROJEKTE-002, kein echter Auftrag.' };
}
const vor = (min) => new Date(Date.now() - min * 60000).toISOString();
const jetzt = () => new Date().toISOString();
const stand = (s) => s.evaluate(() => (window.__agStand && window.__agStand()) || {});
const gh = (s) => s.evaluate(() => (window.__agGithub && window.__agGithub.stand()) || {});
const liegendText = (st) => (st.liegend || []).map(l => l.aufgabe + '@' + l.bei).sort().join(',');
const kopf = (s) => s.evaluate(() => (document.getElementById('agProjekt') || {}).textContent || '');
const steht = (s, text) => s.evaluate(t => [...document.querySelectorAll('.agRuf')]
  .some(e => (e.textContent || '').indexOf(t) >= 0), text);

/* Beobachtet bis zu `ms` die Fluege und die Zeilen am Ball. */
async function beobachten(s, ms, texte) {
  const fluege = new Set(), gesehen = {};
  for (let t = 0; t < ms; t += 100) {
    const st = await stand(s);
    for (const f of (st.fliegend || [])) fluege.add(f.von + '→' + f.an);
    for (const x of texte) if (!gesehen[x] && await steht(s, x)) gesehen[x] = true;
    await s.waitForTimeout(100);
  }
  return { fluege, gesehen };
}

async function seite(b, tisch, verzeichnis, antwortRef) {
  const q = await b.newContext({ viewport: { width: 1194, height: 834 } });
  const s = await q.newPage();
  const seitenFehler = [];
  s.on('pageerror', e => seitenFehler.push(String(e.message).slice(0, 110)));
  let abrufe = 0;
  await s.route('**/projekte/verzeichnis.json', r => verzeichnis
    ? r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(verzeichnis) })
    : r.fulfill({ status: 404, body: '' }));
  await s.route('**api.github.com/**', r => {
    abrufe++;
    r.fulfill({ status: 200, contentType: 'application/json',
                headers: { ETag: 'W/"ag-projekte-' + abrufe + '"' },
                body: JSON.stringify(antwortRef.liste) });
  });
  await s.goto(tisch.adr + '?live=github', { waitUntil: 'load' });
  await s.waitForTimeout(2200);
  if (!await s.evaluate(() => !!document.getElementById('agGhToken')))
    ungeprueft('kein Livefach — ohne WebGL kein Monitor');
  await s.fill('#agGhToken', 'AGPROJEKTE002_Scheintoken_0123456789abcd');
  await s.click('#agGhAn');
  await s.waitForTimeout(3500);
  await s.evaluate(() => { const d = document.getElementById('agGhAuf'); if (d) d.open = false; });
  return { q, s, seitenFehler };
}
async function waehlen(s, id) {
  await s.evaluate(i => {
    const li = document.querySelector('#agWas li[data-gh="' + i + '"]');
    if (li) li.click();
  }, id);
  for (let i = 0; i < 80; i++) {
    await s.waitForTimeout(150);
    const g = await gh(s);
    if (g.phase === 'verbunden' && g.projekte && g.projekte.wahl === id) break;
  }
  await s.waitForTimeout(600);
  await s.evaluate(() => { const d = document.getElementById('agGhAuf'); if (d) d.open = false; });
}

(async () => {
  console.log('AG-PROJEKTE-002 — der Monitor liest das Projektverzeichnis\n');
  let chromium = null;
  try { chromium = require('playwright').chromium; } catch (e) {}
  const br = chromiumPfad(chromium);
  if (br.grund) ungeprueft(br.grund);
  console.log('  Kandidat    : ' + WURZEL);
  console.log('  Aufnahmen   : ' + AUFNAHMEN + '\n');
  fs.mkdirSync(AUFNAHMEN, { recursive: true });
  const b = await chromium.launch({ executablePath: br.pfad,
                                    args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const tisch = await tischen(WURZEL);
  const historie = () => [
    kommentar(vor(20), { project_id: 'agentarium', run_id: 'AG-P-1', task_id: 'AG-T1',
      kind: 'handoff', actor: 'peter', recipient: 'nova', title: 'Peter gibt AG-T1 (Probe).' }),
    kommentar(vor(15), { project_id: 'gt40', run_id: 'GT-P-1', task_id: 'GT-T1',
      kind: 'handoff', actor: 'peter', recipient: 'scout', title: 'Peter gibt GT-T1 (Probe).' }),
    kommentar(vor(10), { project_id: 'ballbrause', run_id: 'BB-1', task_id: 'BB-T1',
      kind: 'handoff', actor: 'peter', recipient: 'lot', title: 'Nicht verzeichnet (Probe).' })
  ];
  try {
    const antwort = { liste: historie() };
    const { q, s, seitenFehler } = await seite(b, tisch, VERZEICHNIS, antwort);

    console.log('A — Start: Alle Projekte');
    let st = await stand(s), g = await gh(s);
    zeile('verbunden', g.phase, 'verbunden');
    zeile('Verzeichnis gelesen, Wahl „alle"',
          (g.projekte && g.projekte.verzeichnis) + '/' + (g.projekte && g.projekte.wahl), 'true/*');
    zeile('oben rechts', await kopf(s), 'Alle Projekte');
    zeile('Blatt: Alle + drei Projekte',
          await s.evaluate(() => document.querySelectorAll('#agWas li[data-gh]').length), 4);
    zeile('Blatt: Kürzel und Name',
          await s.evaluate(() => (document.querySelector('#agWas li[data-gh="gt40"]') || {}).textContent),
          'GTGT40 Baubuch');
    zeile('liegend: nur verzeichnete Projekte', liegendText(st), 'AG-T1@nova,GT-T1@scout');
    await s.evaluate(() => document.getElementById('agKopf').click());
    await s.waitForTimeout(500);
    await s.screenshot({ path: path.join(AUFNAHMEN, '1-blatt-projekte.jpg'), type: 'jpeg', quality: 75 });
    await s.evaluate(() => document.getElementById('agKopf').click());
    await s.waitForTimeout(300);

    console.log('\nB — Live in „Alle Projekte"');
    antwort.liste = antwort.liste.concat([
      kommentar(jetzt(), { project_id: 'gt40', run_id: 'GT-P-1', task_id: 'GT-T2',
        kind: 'handoff', actor: 'atlas', recipient: 'forge', title: 'Atlas gibt Forge GT-T2.' }),
      kommentar(jetzt(), { project_id: 'ballbrause', run_id: 'BB-1', task_id: 'BB-T2',
        kind: 'handoff', actor: 'atlas', recipient: 'argus', title: 'Nicht verzeichnet, live.' })
    ]);
    let o = await beobachten(s, 6000, ['GT · Atlas gibt Forge GT-T2.']);
    zeile('Flug atlas→forge (gt40)', o.fluege.has('atlas→forge'), true);
    zeile('Kürzel am Ball: „GT · …"', !!o.gesehen['GT · Atlas gibt Forge GT-T2.'], true);
    zeile('kein Flug atlas→argus (nicht verzeichnet)', o.fluege.has('atlas→argus'), false);
    g = await gh(s);
    zeile('ausgeblendet gezählt', (g.zahl && g.zahl.ausgeblendet) > 0, true);

    console.log('\nC — Projekt „GT40 Baubuch" gewählt');
    await waehlen(s, 'gt40');
    st = await stand(s); g = await gh(s);
    zeile('Wahl gt40, verbunden', g.projekte.wahl + '/' + g.phase, 'gt40/verbunden');
    zeile('oben rechts', await kopf(s), 'GT40 Baubuch');
    /* GT-T2@forge ist ein Teilball (Weitergabe atlas -> forge in B; seit
       AG-MON-BALLSPIEL-002 bleibt er liegen). */
    zeile('liegend: nur gt40', liegendText(st), 'GT-T1@scout,GT-T2@forge');
    zeile('kein Flug beim Wechsel', (st.fliegend || []).length, 0);
    antwort.liste = antwort.liste.concat([
      kommentar(jetzt(), { project_id: 'agentarium', run_id: 'AG-P-3', task_id: 'AG-T3',
        kind: 'handoff', actor: 'peter', recipient: 'argus', title: 'AG-T3 an argus.' }),
      kommentar(jetzt(), { project_id: 'gt40', run_id: 'GT-P-1', task_id: 'GT-T4',
        kind: 'handoff', actor: 'atlas', recipient: 'nova', title: 'Atlas gibt Nova GT-T4.' })
    ]);
    o = await beobachten(s, 6000, ['Atlas gibt Nova GT-T4.', 'GT · Atlas gibt Nova GT-T4.']);
    st = await stand(s);
    zeile('Flug atlas→nova (gt40)', o.fluege.has('atlas→nova'), true);
    /* Beides, sonst waere "ohne Kuerzel" auch gruen, wenn gar nichts am Ball stuende. */
    zeile('Meldung am Ball zu sehen', !!o.gesehen['Atlas gibt Nova GT-T4.'], true);
    zeile('ohne Kürzel in der Einzelansicht', !!o.gesehen['GT · Atlas gibt Nova GT-T4.'], false);
    zeile('kein Flug peter→argus (agentarium)', o.fluege.has('peter→argus'), false);
    zeile('kein Ball bei argus', /@argus/.test(liegendText(st)), false);
    await s.screenshot({ path: path.join(AUFNAHMEN, '2-nur-gt40.jpg'), type: 'jpeg', quality: 75 });

    console.log('\nD — Zurück auf „Alle Projekte"');
    await waehlen(s, '*');
    st = await stand(s); g = await gh(s);
    zeile('Wahl alle, verbunden', g.projekte.wahl + '/' + g.phase, '*/verbunden');
    zeile('oben rechts', await kopf(s), 'Alle Projekte');
    zeile('liegend: alles Verzeichnete, auch AG-T3',
          liegendText(st), 'AG-T1@nova,AG-T3@argus,GT-T1@scout,GT-T2@forge,GT-T4@nova');
    zeile('kein Flug beim Wechsel', (st.fliegend || []).length, 0);
    await s.screenshot({ path: path.join(AUFNAHMEN, '3-alle-projekte.jpg'), type: 'jpeg', quality: 75 });
    zeile('keine Seitenfehler', seitenFehler.length, 0);
    if (seitenFehler.length) console.log('        ' + seitenFehler.join('\n        '));
    await q.close();

    console.log('\nE — Verzeichnis nicht lesbar: alles wie bisher');
    const r2 = await seite(b, tisch, null, { liste: historie() });
    st = await stand(r2.s); g = await gh(r2.s);
    zeile('verbunden', g.phase, 'verbunden');
    zeile('kein Verzeichnis', g.projekte && g.projekte.verzeichnis, false);
    zeile('liegend: alle drei Projekte', liegendText(st), 'AG-T1@nova,BB-T1@lot,GT-T1@scout');
    zeile('keine Projektwahl im Blatt',
          await r2.s.evaluate(() => document.querySelectorAll('#agWas li[data-gh]').length), 0);
    zeile('oben rechts nicht „Alle Projekte"', (await kopf(r2.s)) !== 'Alle Projekte', true);
    zeile('keine Seitenfehler', r2.seitenFehler.length, 0);
    await r2.q.close();
  } finally {
    await b.close();
    tisch.s.close();
  }
  if (fehler) { console.log('\nABWEICHUNG in ' + fehler + ' Prüfung(en).'); process.exit(1); }
  console.log('\nALLES WIE VEREINBART — keine Abweichung.');
  console.log('Scheintoken, Probekörper, Verzeichnis als Attrappe. Keine Abnahme am iPad.');
})().catch(e => { console.log('\nUNGEPRÜFT: ' + (e && e.stack || e)); process.exit(2); });
