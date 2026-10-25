/* AG-MON-ARCHIV-001 — das Archiv eines Projekts, nachgespielt durch denselben Eingang.

   Aufruf:            node previews/AG-MON-ARCHIV-001/pruefen.js
   Eigener Browser:   AG_CHROMIUM=/pfad/zur/datei node previews/...
   Aufnahmen ablegen: AG_AUFNAHMEN=/verzeichnis node previews/...
   Rueckgabe: 0 = bestanden, 1 = Abweichung, 2 = ungeprueft.

   PETER, 25.10.: Das Archiv eines Projekts ist seine Projektdoku in
   abspielbarer Form -- alle Laeufe mit dieser Projekt-ID, zeitlich geordnet,
   parallele gleichzeitig. Gewaehlt oben rechts: echte Projekte haben
   Archiv · Live, Demos Demo · Archiv. Tempo, Halt/Weiter, Von vorn.
   Fassung 79 hatte dafuer eine Zeile "Lauf nachspielen" in der GitHub-Tafel;
   seit AG-PROJEKTE-003 (Fassung 82) sitzt es an der Projektwahl.

     A  live nach dem Verbinden: offener Ball liegt; das Blatt bietet bei
        einem echten Projekt genau Archiv · Live
     B  Archiv "Alle Projekte": Neubeginn, Fluege in echter Reihenfolge,
        PARALLELE Laeufe verschraenkt wie damals, ein nicht verzeichnetes
        Projekt fehlt; Tempo und Von vorn sind zu sehen; ein echtes neues
        Ereignis wird nicht hineingemischt
     C  Halt haelt das Archiv an, Weiter setzt fort; Tempo 10x spielt
        messbar schneller (Von vorn); ein neuer Durchgang spielt auch, was
        inzwischen gemeldet wurde
     D  ein Projekt waehlen, waehrend das Archiv laeuft: nur dessen Archiv
     E  Live: der echte Stand, auch das Zurueckgestellte; Tempo und Von vorn
        wieder weg
     F  Trennen und wieder verbinden in derselben Sitzung: Baelle bleiben,
        nicht doppelt
     G  eine Demo antippen und zurueck zum Projekt: wieder der echte Stand

   GRENZEN: Attrappe mit Scheintoken, Probekoerper, Verzeichnis als
   Attrappe. Keine Abnahme am iPad.                                         */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os');

const ZIEL = process.env.AG_ZIEL || 'pilot/github-live';
const WURZEL = path.resolve(__dirname, '..', '..', ...ZIEL.split('/'));
const AUFNAHMEN = process.env.AG_AUFNAHMEN ||
  fs.mkdtempSync(path.join(os.tmpdir(), 'ag-mon-archiv-'));
const VERZEICHNIS = {
  schema: 'agentarium.projektverzeichnis.v1', gepflegt_von: 'atlas',
  projekte: [
    { id: 'agentarium', kuerzel: 'AG', name: 'Agentarium', repo: 'pahlborn/agentarium' },
    { id: 'gt40', kuerzel: 'GT', name: 'GT40 Baubuch', repo: null }
  ]
};

let fehler = 0;
function zeile(w, ist, soll) {
  const ok = ist === soll;
  if (!ok) fehler++;
  console.log('  ' + (ok ? 'ok  ' : 'FEHL') + '  ' + w.padEnd(52) +
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
/* Ein Kommentar wie auf #2. `zeit` ist die Ereigniszeit; der Kommentar ist
   zur selben Zeit angelegt, also vor dem Verbinden, wenn `zeit` vorbei ist. */
function kommentar(zeit, ereignis) {
  nr++;
  const e = Object.assign({
    schema: 'agentarium.github-event.v1', id: 'AG-ARCHIV-EREIGNIS-' + nr,
    occurred_at: zeit, reporter: 'atlas',
    source_evidence: 'reported_checkpoint', source_tool_id: 'previews/AG-MON-ARCHIV-001'
  }, ereignis);
  return { id: 9920000000 + nr, created_at: zeit,
           user: { login: 'pahlborn', id: 277496791 },
           body: '<!-- AGENTARIUM_EVENT_V1 -->\n```json\n' + JSON.stringify(e, null, 2) +
                 '\n```\nProbe aus AG-MON-ARCHIV-001, kein echter Auftrag.' };
}
const stand = (s) => s.evaluate(() => (window.__agStand && window.__agStand()) || {});
const gh = (s) => s.evaluate(() => (window.__agGithub && window.__agGithub.stand()) || {});
const liegendText = (st) => (st.liegend || []).map(l => l.aufgabe + '@' + l.bei).sort().join(',');
const vor = (min) => new Date(Date.now() - min * 60000).toISOString();
const kopf = (s) => s.evaluate(() => (document.getElementById('agProjekt') || {}).textContent || '');
const modi = (s) => s.evaluate(() => [...document.querySelectorAll('#agWas .wModi li')]
  .map(li => li.getAttribute('data-modus') + (li.classList.contains('hier') ? '*' : '')).join(' '));
const sichtbar = (s, id) => s.evaluate(i => { const e = document.getElementById(i);
  return !!e && getComputedStyle(e).display !== 'none'; }, id);
const tippen = (s, sel) => s.evaluate(q => { const e = document.querySelector(q);
  if (e) e.click(); return !!e; }, sel);

/* Bis das Archiv durch ist: alle Fluege in der Reihenfolge ihres ersten
   Auftretens, und wie lange es (echte Zeit) gedauert hat. */
async function archivVerfolgen(s, maxMs, beiJedem) {
  const folge = [], gesehen = new Set(), t0 = Date.now();
  let st = {}, g = {};
  for (let i = 0; i * 100 < maxMs; i++) {
    await s.waitForTimeout(100);
    st = await stand(s); g = await gh(s);
    for (const f of (st.fliegend || [])) {
      const k = f.von + '→' + f.an;
      if (!gesehen.has(k)) { gesehen.add(k); folge.push(k); }
    }
    if (beiJedem) await beiJedem(st, g);
    if (g.archiv && !g.archiv.laeuft && !(st.fliegend || []).length && i > 3) break;
  }
  return { folge, gesehen, ms: Date.now() - t0, st, g };
}

(async () => {
  console.log('AG-MON-ARCHIV-001 — das Archiv eines Projekts, durch denselben Eingang\n');
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
  try {
    const q = await b.newContext({ viewport: { width: 1194, height: 834 } });
    const s = await q.newPage();
    const seitenFehler = [];
    s.on('pageerror', e => seitenFehler.push(String(e.message).slice(0, 110)));
    /* Die Vorgeschichte: Lauf AG-L1 (agentarium) ist abgeschlossen; Lauf
       GT-L2 (gt40) lief PARALLEL dazu und ist offen (Ball bei nova); dazu
       ein Ereignis eines nicht verzeichneten Projekts mitten darin. */
    let antwort = [
      kommentar(vor(30), { project_id: 'agentarium', run_id: 'AG-L1', task_id: 'A1',
        kind: 'handoff', actor: 'peter', recipient: 'atlas', title: 'Peter gibt Atlas A1.' }),
      kommentar(vor(29), { project_id: 'agentarium', run_id: 'AG-L1', task_id: 'A1-F',
        kind: 'handoff', actor: 'atlas', recipient: 'forge', title: 'Atlas gibt Forge A1-F.' }),
      kommentar(vor(28.9), { project_id: 'agentarium', run_id: 'AG-L1', task_id: 'A1-F',
        kind: 'assigned', actor: 'atlas', recipient: 'forge', title: 'Atlas vergibt A1-F.' }),
      kommentar(vor(28.5), { project_id: 'gt40', run_id: 'GT-L2', task_id: 'B1',
        kind: 'handoff', actor: 'peter', recipient: 'nova', title: 'Peter gibt B1 (gt40).' }),
      kommentar(vor(28.2), { project_id: 'ballbrause', run_id: 'BB-1', task_id: 'X1',
        kind: 'handoff', actor: 'peter', recipient: 'lot', title: 'Nicht verzeichnet.' }),
      kommentar(vor(28), { project_id: 'agentarium', run_id: 'AG-L1', task_id: 'A1-F',
        kind: 'contribution', actor: 'forge', recipient: 'atlas', reporter: 'forge',
        title: 'Forge gibt A1-F zurück.' }),
      kommentar(vor(27), { project_id: 'agentarium', run_id: 'AG-L1', task_id: 'A1',
        kind: 'contribution', actor: 'atlas', recipient: 'peter', title: 'Atlas gibt Peter A1.' })
    ];
    let abrufe = 0;
    await s.route('**/projekte/verzeichnis.json', r => r.fulfill({
      status: 200, contentType: 'application/json', body: JSON.stringify(VERZEICHNIS) }));
    await s.route('**api.github.com/**', r => {
      abrufe++;
      r.fulfill({ status: 200, contentType: 'application/json',
                  headers: { ETag: 'W/"ag-mon-archiv-' + abrufe + '"' },
                  body: JSON.stringify(antwort) });
    });
    await s.goto(tisch.adr + '?live=github', { waitUntil: 'load' });
    await s.waitForTimeout(2200);
    if (!await s.evaluate(() => !!document.getElementById('agGhToken')))
      ungeprueft('kein Livefach — ohne WebGL kein Monitor');
    await s.fill('#agGhToken', 'AGMONARCHIV001_Scheintoken_0123456789ab');
    await s.click('#agGhAn');
    await s.waitForTimeout(3500);
    const tafelZu = () => s.evaluate(() => {
      const d = document.getElementById('agGhAuf'); if (d) d.open = false; });
    await tafelZu();

    console.log('A — Live nach dem Verbinden');
    let st = await stand(s), g = await gh(s);
    zeile('verbunden, alle Projekte', g.phase + '/' + (g.projekte && g.projekte.wahl), 'verbunden/*');
    zeile('offener Ball von GT-L2 liegt', liegendText(st), 'B1@nova');
    zeile('Blatt bietet Archiv · Live (Live gewählt)', await modi(s), 'archiv live*');
    zeile('keine Zeile „Lauf nachspielen" mehr in der Tafel',
          await s.evaluate(() => !!document.getElementById('agGhArchiv')), false);
    zeile('Tempo live nicht zu sehen', await sichtbar(s, 'agTempo'), false);

    console.log('\nB — Archiv „Alle Projekte"');
    zeile('Archiv antippen', await tippen(s, '#agWas li[data-modus="archiv"]'), true);
    await s.waitForTimeout(150);
    st = await stand(s);
    zeile('Neubeginn: nichts liegt', liegendText(st), '');
    zeile('oben rechts', await kopf(s), 'Alle Projekte · Archiv');
    zeile('Tempo zu sehen', await sichtbar(s, 'agTempo'), true);
    zeile('Von vorn zu sehen', await sichtbar(s, 'agVorn'), true);
    zeile('Blatt: Archiv gewählt', await modi(s), 'archiv* live');
    /* Ein echtes neues Ereignis (gt40) waehrend des Archivs. */
    antwort = antwort.concat([kommentar(new Date().toISOString(), {
      project_id: 'gt40', run_id: 'GT-L2', task_id: 'C1', kind: 'handoff',
      actor: 'peter', recipient: 'scout', title: 'Echt neu während des Archivs.' })]);
    let bild = false, lagBeiAtlas = false;
    let a = await archivVerfolgen(s, 25000, async (x) => {
      if (/A1@atlas/.test(liegendText(x))) lagBeiAtlas = true;
      if (!bild && (x.fliegend || []).some(f => f.von === 'peter' && f.an === 'nova' && f.u > 0.3)) {
        await s.screenshot({ path: path.join(AUFNAHMEN, '1-archiv-parallel.jpg'), type: 'jpeg', quality: 72 });
        bild = true;
      }
    });
    zeile('Flüge in echter Reihenfolge, parallel verschränkt', a.folge.join(' '),
          'peter→atlas atlas→forge peter→nova forge→atlas atlas→peter');
    zeile('nicht verzeichnetes Projekt fehlt (peter→lot)', a.gesehen.has('peter→lot'), false);
    zeile('echtes neues Ereignis nicht hineingemischt', a.gesehen.has('peter→scout'), false);
    zeile('Peters Ball lag bei atlas, solange A1 offen war', lagBeiAtlas, true);
    zeile('am Ende liegt nur der offene GT-Ball', liegendText(a.st), 'B1@nova');
    zeile('Aufnahme während des Archivs', bild, true);
    zeile('Archivansicht steht noch', a.g.archiv && a.g.archiv.ansicht, true);
    const dauer1 = a.ms;

    console.log('\nC — Halt, Weiter, Tempo');
    zeile('Von vorn', await tippen(s, '#agVorn'), true);
    await s.waitForTimeout(1200);
    zeile('Halt', await tippen(s, '#agHalt'), true);
    g = await gh(s);
    const vorHalt = g.archiv.gezeigt;
    await s.waitForTimeout(2500);
    g = await gh(s);
    zeile('angehalten: nichts Neues in 2,5 s', g.archiv.gezeigt, vorHalt);
    zeile('Weiter', await tippen(s, '#agHalt'), true);
    a = await archivVerfolgen(s, 25000);
    zeile('nach Weiter zu Ende gespielt', a.g.archiv.gezeigt, a.g.archiv.folge);
    await s.evaluate(() => { const r = document.getElementById('agSchnell');
      r.value = '3'; r.dispatchEvent(new Event('input')); });
    zeile('Tempo 10×', await s.evaluate(() =>
      (document.querySelector('#agTempo label b') || {}).textContent), '10×');
    await tippen(s, '#agVorn');
    a = await archivVerfolgen(s, 25000);
    console.log('        Dauer 1×: ' + dauer1 + ' ms, 10×: ' + a.ms + ' ms');
    /* Doppelt, nicht zehnmal: Abfragetakt und Nachlauf sind feste Anteile.
       Gemessen am 25.10.: 10,0 s gegen 3,0 s. */
    zeile('10× mindestens doppelt so schnell wie 1×', a.ms * 2 < dauer1, true);
    /* SECHS, nicht fuenf: Das in B zurueckgestellte Ereignis (C1, peter ->
       scout) gehoert inzwischen zur Geschichte. Zurueckgestellt heisst
       "nicht in einen laufenden Durchgang gemischt" -- ein neuer Durchgang
       ("Von vorn") spielt alles, was bis dahin gemeldet ist. */
    zeile('Von vorn spielt auch das inzwischen Gemeldete', a.folge.join(' '),
          'peter→atlas atlas→forge peter→nova forge→atlas atlas→peter peter→scout');

    console.log('\nD — Projekt wählen, während das Archiv steht');
    await tippen(s, '#agWas li[data-gh="gt40"]');
    a = await archivVerfolgen(s, 25000);
    zeile('oben rechts', await kopf(s), 'GT40 Baubuch · Archiv');
    zeile('nur die gt40-Flüge', a.folge.join(' '), 'peter→nova peter→scout');
    zeile('liegt: die beiden offenen gt40-Bälle', liegendText(a.st), 'B1@nova,C1@scout');

    console.log('\nE — Live');
    zeile('Live antippen', await tippen(s, '#agWas li[data-modus="live"]'), true);
    for (let i = 0; i < 80; i++) {
      await s.waitForTimeout(150);
      g = await gh(s); st = await stand(s);
      if (g.phase === 'verbunden' && !g.archiv.ansicht && liegendText(st)) break;
    }
    await tafelZu();
    await s.waitForTimeout(400);
    st = await stand(s); g = await gh(s);
    zeile('verbunden, keine Archivansicht', g.phase + '/' + g.archiv.ansicht, 'verbunden/false');
    zeile('echter Stand gt40, mit dem Zurückgestellten', liegendText(st), 'B1@nova,C1@scout');
    zeile('ohne Flug', (st.fliegend || []).length, 0);
    zeile('oben rechts', await kopf(s), 'GT40 Baubuch');
    zeile('Tempo wieder weg', await sichtbar(s, 'agTempo'), false);
    zeile('Von vorn wieder weg', await sichtbar(s, 'agVorn'), false);
    zeile('Tempo zurück auf 1×', await s.evaluate(() =>
      (document.querySelector('#agTempo label b') || {}).textContent), '1×');
    await s.screenshot({ path: path.join(AUFNAHMEN, '2-live-gt40.jpg'), type: 'jpeg', quality: 72 });

    console.log('\nF — Trennen und wieder verbinden in derselben Sitzung');
    await s.evaluate(() => { const d = document.getElementById('agGhAuf'); if (d) d.open = true; });
    await s.click('#agGhAus');
    await s.waitForTimeout(300);
    await s.fill('#agGhToken', 'AGMONARCHIV001_Scheintoken_0123456789ab');
    await s.click('#agGhAn');
    await s.waitForTimeout(3500);
    await tafelZu();
    st = await stand(s); g = await gh(s);
    zeile('verbunden, Wahl bleibt gt40', g.phase + '/' + g.projekte.wahl, 'verbunden/gt40');
    zeile('Bälle liegen weiter, nicht doppelt', liegendText(st), 'B1@nova,C1@scout');
    zeile('ohne Flug', (st.fliegend || []).length, 0);

    console.log('\nG — Eine Demo und zurück');
    await tippen(s, '#agWas li[data-nr="0"]');
    await s.waitForTimeout(600);
    zeile('Demo läuft', await s.evaluate(() => document.body.getAttribute('data-modus')), 'demo');
    zeile('Blatt bietet Demo · Archiv', await modi(s), 'demo* archiv');
    await tippen(s, '#agWas li[data-gh="gt40"]');
    for (let i = 0; i < 80; i++) {
      await s.waitForTimeout(150);
      g = await gh(s); st = await stand(s);
      if (g.phase === 'verbunden' && liegendText(st)) break;
    }
    await s.waitForTimeout(400);
    st = await stand(s);
    zeile('zurück live', await s.evaluate(() => document.body.getAttribute('data-modus')), 'live');
    zeile('echter Stand gt40 wieder da', liegendText(st), 'B1@nova,C1@scout');
    zeile('Blatt bietet wieder Archiv · Live', await modi(s), 'archiv live*');
    zeile('keine Seitenfehler', seitenFehler.length, 0);
    if (seitenFehler.length) console.log('        ' + seitenFehler.join('\n        '));
    await q.close();
  } finally {
    await b.close();
    tisch.s.close();
  }
  if (fehler) { console.log('\nABWEICHUNG in ' + fehler + ' Prüfung(en).'); process.exit(1); }
  console.log('\nALLES WIE VEREINBART — keine Abweichung.');
  console.log('Scheintoken, Probekörper, Verzeichnis als Attrappe. Keine Abnahme am iPad.');
})().catch(e => { console.log('\nUNGEPRÜFT: ' + (e && e.stack || e)); process.exit(2); });
