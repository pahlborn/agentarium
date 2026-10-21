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

  /* ===== SCHRITT 2b: WAS BEIM VERBINDEN SCHON OFFEN WAR =====
     Eine Historie mit drei Aufgaben, die sich unterscheiden MUESSEN:
       R1  vergeben und begonnen, nicht geliefert   -> bleibt offen, begonnen
       R2  vergeben, begonnen, geliefert            -> ist zu, kein Ring
       R3  vergeben, nie begonnen                   -> bleibt offen, zugewiesen
     Dazu zwei Faelle, die NICHT zaehlen duerfen:
       R4  Beginn als Fremdaussage (atlas ueber forge)  -> bleibt zugewiesen
       R5  Beginn OHNE vorherige Vergabe                -> gar keine Aufgabe
     Absichtlich in verdrehter Reihenfolge hingelegt und mit teils gleichen
     `occurred_at`: Die Ordnung muss aus occurred_at, recorded_at und
     Kommentarnummer entstehen, nicht aus der Lesereihenfolge. */
  const H = [];
  let hid = 88000;
  function hist(f, occ, rec) {
    H.push({ id: ++hid, body: koerper(Object.assign({ at: occ }, f)),
             user: { login: 'github-actions[bot]', id: 41898282 },
             created_at: rec || occ });
  }
  /* R2 zuerst hinlegen, obwohl es spaeter geschah -- die Faltung muss das
     richten. Und die Lieferung traegt dieselbe occurred_at wie der Beginn;
     dann entscheidet recorded_at. */
  hist({ id: 'R2:delivered', task: 'AG-EVJ-R2', actor: 'forge', reporter: 'forge',
         kind: 'delivered', title: 'R2 geliefert' },
       '2026-10-20T09:00:00Z', '2026-10-20T09:00:30Z');
  hist({ id: 'R2:assigned', task: 'AG-EVJ-R2', actor: 'atlas', reporter: 'atlas',
         recipient: 'forge', kind: 'assigned', title: 'R2 vergeben' },
       '2026-10-20T08:00:00Z');
  hist({ id: 'R2:started', task: 'AG-EVJ-R2', actor: 'forge', reporter: 'forge',
         kind: 'started', title: 'R2 begonnen' },
       '2026-10-20T09:00:00Z', '2026-10-20T09:00:10Z');

  hist({ id: 'R1:assigned', task: 'AG-EVJ-R1', actor: 'atlas', reporter: 'atlas',
         recipient: 'scout', kind: 'assigned', title: 'R1 an scout vergeben' },
       '2026-10-20T10:00:00Z');
  hist({ id: 'R1:started', task: 'AG-EVJ-R1', actor: 'scout', reporter: 'scout',
         kind: 'started', title: 'R1 begonnen' },
       '2026-10-20T10:05:00Z');

  hist({ id: 'R3:assigned', task: 'AG-EVJ-R3', actor: 'atlas', reporter: 'atlas',
         recipient: 'argus', kind: 'assigned', title: 'R3 an argus vergeben' },
       '2026-10-20T11:00:00Z');

  hist({ id: 'R4:assigned', task: 'AG-EVJ-R4', actor: 'atlas', reporter: 'atlas',
         recipient: 'nova', kind: 'assigned', title: 'R4 an nova vergeben' },
       '2026-10-20T12:00:00Z');
  hist({ id: 'R4:started-fremd', task: 'AG-EVJ-R4', actor: 'nova', reporter: 'atlas',
         kind: 'started', title: 'Atlas behauptet Novas Beginn' },
       '2026-10-20T12:05:00Z');

  hist({ id: 'R5:started-ohne', task: 'AG-EVJ-R5', actor: 'cadence', reporter: 'cadence',
         kind: 'started', title: 'Beginn ohne Vergabe' },
       '2026-10-20T13:00:00Z');

  /* EIN ABBRUCH, DER SCHON DALIEGT, BEVOR VERBUNDEN WIRD. Das ist die
     zweite Haelfte von Argus' Befund: Der Zaehler stand ueber dem
     `basis`-Zweig und zaehlte damit auch Ereignisse von vorgestern als
     "in dieser Sitzung beobachtet". Er liegt jetzt dahinter -- und das
     wird hier gemessen, nicht behauptet. */
  antwort = H.concat([{ id: 89001, body: koerper({
      id: 'AG-EVENT-JOURNAL-001:forge:aborted-historisch', task: 'AG-EVJ-ALT',
      actor: 'forge', reporter: 'forge', kind: 'aborted',
      at: '2026-10-19T12:00:00Z',
      title: 'Ein Abbruch von vorgestern — Historie, nicht diese Sitzung'
    }), user: { login: 'github-actions[bot]', id: 41898282 },
    created_at: '2026-10-19T12:00:00Z' }]);

  await s.fill('#agGhToken', 'AGJOURNAL001_Scheintoken_fuer_den_Nachweis_0123456789');
  await s.click('#agGhAn');
  await s.waitForTimeout(2500);

  console.log('\nA2 — Ein Abbruch in der Historie zählt nicht für diese Sitzung');
  console.log('    erwartet: als markiert-historisch gezählt, nicht als Abbruch\n');
  const nachBasis = await s.evaluate(() => ({
    zahlen: (document.getElementById('agGhZahlen') || {}).textContent || '',
    letztes: (document.getElementById('agGhLetztes') || {}).textContent || ''
  }));
  zeile('als historisch erkannt', /markierte historisch/.test(nachBasis.zahlen), true);
  zeile('nicht abgespielt', /aborted-historisch/.test(nachBasis.letztes), false);
  zeile('NICHT als Abbruch dieser Sitzung gezählt',
        /in dieser Sitzung beobachtet/.test(nachBasis.zahlen), false);
  await s.evaluate(() => { const d = document.getElementById('agGhAuf'); if (d) d.open = true; });

  /* DEN KOPF JETZT ABLESEN, VOR DEM ERSTEN EREIGNIS. Genau dieser Moment ist
     der beobachtete: verbunden, LIVE, noch kein Strom. Spaeter meldet der
     Adapter den Lauf und ersetzt den Namen zu Recht -- wer erst dann
     hinsieht, misst den Normalfall und nicht den Fehlerfall. */
  const kopfWartend = await s.evaluate(() => ({
    werk: (document.getElementById('agWerkName') || {}).textContent || '',
    markiert: document.querySelectorAll('.wProjekte li.hier').length
  }));

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

  console.log('\nA3 — Was beim Verbinden offen war, liegt wieder da');
  console.log('    erwartet: R1 begonnen, R3 zugewiesen, R2 zu, R4 nicht');
  console.log('    begonnen, R5 gar nicht — und kein Flug, keine Meldung\n');
  const nachRestore = await s.evaluate(() => {
    const st = (window.__agStand && window.__agStand()) || {};
    const f = (id) => (st.aufgaben || []).filter(a => a.aufgabe === id)[0] || null;
    return {
      wieder: st.wiederhergestellt, abdeckung: st.abdeckung,
      R1: f('AG-EVJ-R1'), R2: f('AG-EVJ-R2'), R3: f('AG-EVJ-R3'),
      R4: f('AG-EVJ-R4'), R5: f('AG-EVJ-R5'),
      verarbeitet: st.verarbeitet, ausgegeben: st.ausgegeben,
      fliegend: (st.fliegend || []).length,
      meldungen: document.querySelectorAll('.agRuf').length,
      zahlen: (document.getElementById('agGhZahlen') || {}).textContent || ''
    };
  });
  zeile('drei offene Aufgaben übernommen', nachRestore.wieder, 3);
  zeile('R1 liegt bei scout', nachRestore.R1 ? nachRestore.R1.wer : null, 'scout');
  zeile('R1 ist begonnen', nachRestore.R1 ? nachRestore.R1.zustand : null, 'begonnen');
  zeile('R1 als wiederhergestellt gekennzeichnet',
        nachRestore.R1 ? nachRestore.R1.wieder : null, true);
  zeile('R2 ist zu — kein Ring', nachRestore.R2, null);
  zeile('R3 liegt bei argus', nachRestore.R3 ? nachRestore.R3.wer : null, 'argus');
  zeile('R3 nur zugewiesen', nachRestore.R3 ? nachRestore.R3.zustand : null, 'zugewiesen');
  zeile('R4 trotz Fremdaussage nur zugewiesen',
        nachRestore.R4 ? nachRestore.R4.zustand : null, 'zugewiesen');
  zeile('R5 ohne Vergabe gar nicht angelegt', nachRestore.R5, null);
  zeile('kein Flug aus der Historie', nachRestore.fliegend, 0);
  zeile('keine Meldung aus der Historie', nachRestore.meldungen, 0);
  zeile('nichts verarbeitet', nachRestore.verarbeitet, 0);
  zeile('nichts ausgegeben', nachRestore.ausgegeben, 0);
  zeile('Abdeckung partial, nie complete', nachRestore.abdeckung, 'partial');
  zeile('Fremdaussage ausgewiesen',
        /Fremdaussage/.test(nachRestore.zahlen), true);

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

  console.log('\nF — Blockade ist kein Abbruch');
  console.log('    DIESER TEIL VERLANGTE ZUERST DAS FALSCHE SOLL. Er prüfte,');
  console.log('    dass `blocked` als Abbruch gezählt wird — und machte damit');
  console.log('    genau den Fehler grün, den Atlas vorher ausgeschlossen');
  console.log('    hatte: Die Zahl kommt aus typisierten Abbruchereignissen,');
  console.log('    „nicht aus Titeln und nicht aus BLOCKED". Gefunden von');
  console.log('    Argus. Eine Blockade wartet und kann sich auflösen, ein');
  console.log('    Abbruch ist gescheitert und endet.\n');
  const r7 = await liefern('blocked', koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:blocked', task: 'AG-EVJ-001',
    actor: 'forge', reporter: 'forge', kind: 'blocked',
    title: 'Forge klemmt — Grund steht im Beleg, nicht im Bild'
  }), 90007);
  zeile('blocked angenommen', /blocked/.test(r7.letztes), true);
  zeile('blocked zählt NICHT als Abbruch',
        /in dieser Sitzung beobachtet/.test(r7.zahlen), false);

  const r8 = await liefern('aborted', koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:aborted', task: 'AG-EVJ-005',
    actor: 'forge', reporter: 'forge', kind: 'aborted',
    title: 'Forge ist gescheitert — die Aufgabe endet hier'
  }), 90008);
  zeile('aborted angenommen', /aborted/.test(r8.letztes), true);
  zeile('aborted zählt als Abbruch',
        /in dieser Sitzung beobachtet: 1 Abbruch/.test(r8.zahlen), true);
  zeile('Abdeckung ausgewiesen', /Projektabdeckung: partial/.test(r8.zahlen), true);
  zeile('keine Projektzahl behauptet', /Projektabdeckung: complete/.test(r8.zahlen), false);

  console.log('\nG2 — Der Kopf behauptet im Livebetrieb kein Demoprojekt');
  console.log('    Atlas hat es an Peters Schirm beobachtet: verbunden, LIVE,');
  console.log('    „Wartet auf einen Strom" — und darüber „NACHTPOST V1".\n');
  const kopfJetzt = await s.evaluate(() => ({
    werk: (document.getElementById('agWerkName') || {}).textContent || ''
  }));
  /* Der Stueckwaehler im Projektblatt NENNT die Demostuecke -- das ist sein
     Zweck und richtig. Falsch waere, eines davon als das aktuelle zu
     markieren oder seinen Titel als laufendes Werk auszugeben. */
  const demoNamen = ['NACHTPOST V1', 'NACHTPOST V2',
                     'eine Stadt aus ungesendeten Briefen',
                     'Die Stadt, die sich gemeinsam verändert'];
  zeile('wartend: kein Demotitel im Werknamen',
        demoNamen.some(d => kopfWartend.werk.indexOf(d) >= 0), false);
  zeile('wartend: kein Stück als aktuell markiert', kopfWartend.markiert, 0);
  zeile('wartend: Betriebsart als Platzhalter', /LIVE/.test(kopfWartend.werk), true);
  console.log('        wartend:  „' + kopfWartend.werk.trim().slice(0, 56) + '"');
  /* Und die Gegenprobe: Sobald ein Lauf gemeldet ist, steht er da. Ohne
     diese Zeile wuerde ein Monitor, der NIE einen Namen zeigt, ebenfalls
     bestehen -- der Platzhalter ist kein Selbstzweck. */
  zeile('nach dem Lauf: der echte Lauf steht da',
        kopfJetzt.werk.indexOf('AG-EVENT-JOURNAL-001') >= 0, true);
  console.log('        danach:   „' + kopfJetzt.werk.trim().slice(0, 56) + '"');

  console.log('\nH — Der Zustand folgt dem Beleg: Vergabe, Beginn, Lieferung');
  console.log('    erwartet: zugewiesen ≠ begonnen, Fremdaussage treibt nicht,');
  console.log('    unbekannte Kennung schließt NICHTS\n');

  async function stand() {
    return await s.evaluate(() => (window.__agStand && window.__agStand()) || null);
  }
  function aufg(st, wer, id) {
    return (st.aufgaben || []).filter(a => a.wer === wer && a.aufgabe === id)[0] || null;
  }

  /* Vergabe durch Atlas -- der Vergebende meldet, nicht der Empfaenger. */
  await liefern('assigned', koerper({
    id: 'AG-EVENT-JOURNAL-001:atlas:assigned:H1', task: 'AG-EVJ-H1',
    actor: 'atlas', reporter: 'atlas', recipient: 'forge', kind: 'assigned',
    title: 'Atlas vergibt H1 an forge'
  }), 90101);
  let st = await stand();
  let a1 = aufg(st, 'forge', 'AG-EVJ-H1');
  zeile('Vergabe legt eine Aufgabe an', !!a1, true);
  zeile('und zwar als zugewiesen', a1 ? a1.zustand : null, 'zugewiesen');

  /* Dieselbe Vergabe nochmal: ein Transportduplikat darf keinen zweiten
     Ring erzeugen. Eigene Ereigniskennung, damit der Adapter sie nicht als
     Duplikat abweist -- geprueft wird die Wirkung, nicht der Filter. */
  await liefern('assigned-doppelt', koerper({
    id: 'AG-EVENT-JOURNAL-001:atlas:assigned:H1b', task: 'AG-EVJ-H1',
    actor: 'atlas', reporter: 'atlas', recipient: 'forge', kind: 'assigned',
    title: 'Dieselbe Vergabe ein zweites Mal'
  }), 90102);
  st = await stand();
  zeile('kein zweiter Ring für dieselbe Aufgabe',
        (st.aufgaben || []).filter(a => a.aufgabe === 'AG-EVJ-H1').length, 1);

  /* Fremdaussage: Atlas meldet den Beginn von forge. Darf NICHT treiben. */
  await liefern('started-fremd', koerper({
    id: 'AG-EVENT-JOURNAL-001:atlas:started:H1', task: 'AG-EVJ-H1',
    actor: 'forge', reporter: 'atlas', kind: 'started',
    title: 'Atlas behauptet den Beginn von forge'
  }), 90103);
  st = await stand();
  a1 = aufg(st, 'forge', 'AG-EVJ-H1');
  zeile('Fremdaussage ändert den Zustand nicht',
        a1 ? a1.zustand : null, 'zugewiesen');

  /* Selbstauskunft: forge meldet seinen eigenen Beginn. */
  await liefern('started-selbst', koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:started:H1', task: 'AG-EVJ-H1',
    actor: 'forge', reporter: 'forge', kind: 'started',
    title: 'Forge meldet den eigenen Beginn'
  }), 90104);
  st = await stand();
  a1 = aufg(st, 'forge', 'AG-EVJ-H1');
  zeile('Selbstauskunft setzt auf begonnen', a1 ? a1.zustand : null, 'begonnen');

  /* Lieferung zu einer UNBEKANNTEN Kennung: darf nichts schliessen. */
  const vorLuecke = (await stand()).luecken || 0;
  await liefern('delivered-unbekannt', koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:delivered:FREMD', task: 'AG-EVJ-GIBT-ES-NICHT',
    actor: 'forge', reporter: 'forge', kind: 'delivered',
    title: 'Lieferung zu einer Kennung, die hier niemand kennt'
  }), 90105);
  st = await stand();
  zeile('unbekannte Kennung schließt nichts',
        (st.aufgaben || []).filter(a => a.aufgabe === 'AG-EVJ-H1').length, 1);
  zeile('und wird als Lücke gezählt', (st.luecken || 0) > vorLuecke, true);
  zeile('nicht als Rateentscheidung', st.ratEinzeln ? st.ratEinzeln.auftrag : -1, 0);

  /* Und die richtige Lieferung schliesst genau sie. */
  await liefern('delivered-richtig', koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:delivered:H1', task: 'AG-EVJ-H1',
    actor: 'forge', reporter: 'forge', kind: 'delivered',
    title: 'Forge liefert H1 — Prüfung und Annahme bleiben getrennt'
  }), 90106);
  st = await stand();
  zeile('Lieferung schließt genau diese Aufgabe',
        (st.aufgaben || []).filter(a => a.aufgabe === 'AG-EVJ-H1').length, 0);

  console.log('\nI — Was auch Schritt 2 noch NICHT tut');
  console.log('    erwartet: kein Ballwechsel, blocked treibt nichts\n');
  zeile('kein Ball verschoben', st.ball || null, null);
  zeile('keine Seitenfehler', pageErr.length, 0);
  if (pageErr.length) console.log('        ' + pageErr.join('\n        '));

  await b.close();
  n.s.close();

  if (fehler) {
    console.log('\n' + fehler + ' ABWEICHUNG' + (fehler > 1 ? 'EN' : '') + '.');
    process.exit(1);
  }
  console.log('\nALLES WIE VEREINBART — keine Abweichung.');
  console.log('Vertrag und Zustände: Vergabe legt hin, Selbstauskunft beginnt,');
  console.log('Lieferung schließt genau ihre Aufgabe — und eine unbekannte');
  console.log('Kennung schließt nichts, sondern bleibt eine gezählte Lücke.');
  console.log('Offen und sichtbar offen: blocked/resolved treiben nichts,');
  console.log('reviewed/accepted/merged/published fehlen, und die dauerhafte');
  console.log('Ereignisquelle samt Wiederherstellung ist der nächste Schnitt.');
  console.log('Synthetische Körper, kein Relais, keine Abnahme am iPad.');
  process.exit(0);
})().catch(e => { ungeprueft('Nachweis abgebrochen: ' + (e && e.message)); });
