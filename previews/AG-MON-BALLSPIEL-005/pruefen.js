/* AG-MON-BALLSPIEL-005 — eigene ID je Teilaufgabe, mit Verweis auf den Auftrag.

   Aufruf:            node previews/AG-MON-BALLSPIEL-005/pruefen.js
   Eigener Browser:   AG_CHROMIUM=/pfad/zur/datei node previews/...
   Aufnahmen ablegen: AG_AUFNAHMEN=/verzeichnis node previews/...
   Rueckgabe: 0 = bestanden, 1 = Abweichung, 2 = ungeprueft.

   PETER, 26.10.: Jede Teilaufgabe bekommt eine eigene task_id (A1-01, A1-02,
   ...) und `parent_id` = Peters Auftrag. Ohne das fielen zwei Weitergaben an
   denselben Agenten zu EINEM Teilball zusammen.

     A  zwei Weitergaben an forge mit eigenen IDs: zwei Teilbaelle bei forge
     B  das Schild am Teilball nennt "gehoert zu A1"
     C  die Rueckgabe von A1-01 nimmt nur A1-01 weg, A1-02 bleibt
     D  die Liste nennt die Zugehoerigkeit ("unter A1")
     E  nach Neuladen: dieselbe Lage, das Schild nennt weiter "gehoert zu A1"

   GRENZEN: Attrappe mit Scheintoken, Probekoerper. Keine Abnahme am iPad.  */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os');

const ZIEL = process.env.AG_ZIEL || 'pilot/github-live';
const WURZEL = path.resolve(__dirname, '..', '..', ...ZIEL.split('/'));
const AUFNAHMEN = process.env.AG_AUFNAHMEN ||
  fs.mkdtempSync(path.join(os.tmpdir(), 'ag-ballspiel-5-'));
const VERZEICHNIS = {
  schema: 'agentarium.projektverzeichnis.v1', gepflegt_von: 'atlas',
  projekte: [{ id: 'agentarium', kuerzel: 'AG', name: 'Agentarium', repo: 'pahlborn/agentarium' }]
};

let fehler = 0;
function zeile(w, ist, soll) {
  const ok = ist === soll;
  if (!ok) fehler++;
  console.log('  ' + (ok ? 'ok  ' : 'FEHL') + '  ' + w.padEnd(48) +
              String(ist).slice(0, 60).padEnd(34) + (ok ? '' : '(erwartet ' + soll + ')'));
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
function kommentar(ereignis) {
  nr++;
  const zeit = new Date(Date.now() + nr).toISOString();
  const e = Object.assign({
    schema: 'agentarium.github-event.v1', id: 'AG-BALL5-EREIGNIS-' + nr,
    project_id: 'agentarium', run_id: 'AG-B5-L1', occurred_at: zeit, reporter: 'atlas',
    source_evidence: 'reported_checkpoint', source_tool_id: 'previews/AG-MON-BALLSPIEL-005'
  }, ereignis);
  return { id: 9990000000 + nr, created_at: zeit,
           user: { login: 'pahlborn', id: 277496791 },
           body: '<!-- AGENTARIUM_EVENT_V1 -->\n```json\n' + JSON.stringify(e, null, 2) +
                 '\n```\nProbe aus AG-MON-BALLSPIEL-005, kein echter Auftrag.' };
}
const stand = (s) => s.evaluate(() => (window.__agStand && window.__agStand()) || {});
const liegendText = (st) => (st.liegend || [])
  .map(l => l.aufgabe + '@' + l.bei + (l.teil ? '·t' : '')).sort().join(',');
const ort = (st, aufgabe, bei) => {
  const l = (st.liegend || []).find(x => x.aufgabe === aufgabe && x.bei === bei);
  return l && l.ort;
};
async function bisLage(s, soll, ms) {
  let st = {};
  for (let t = 0; t < ms; t += 120) {
    st = await stand(s);
    if (liegendText(st) === soll && !(st.fliegend || []).length) break;
    await s.waitForTimeout(120);
  }
  await s.waitForTimeout(300);
  return await stand(s);
}
async function schildVon(s, p) {
  await s.mouse.click(p[0], p[1]);
  await s.waitForTimeout(200);
  return s.evaluate(() => {
    const e = document.getElementById('agBallInfo');
    return e && getComputedStyle(e).display !== 'none' ? e.textContent : '';
  });
}

(async () => {
  console.log('AG-MON-BALLSPIEL-005 — eigene ID je Teilaufgabe\n');
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
  const liste = [];
  const seite = async () => {
    const q = await b.newContext({ viewport: { width: 1194, height: 834 } });
    const s = await q.newPage();
    const seitenFehler = [];
    s.on('pageerror', e => seitenFehler.push(String(e.message).slice(0, 110)));
    let abrufe = 0;
    await s.route('**/projekte/verzeichnis.json', r => r.fulfill({
      status: 200, contentType: 'application/json', body: JSON.stringify(VERZEICHNIS) }));
    await s.route('**api.github.com/**', r => {
      abrufe++;
      r.fulfill({ status: 200, contentType: 'application/json',
                  headers: { ETag: 'W/"ag-ball5-' + abrufe + '"' }, body: JSON.stringify(liste) });
    });
    await s.goto(tisch.adr + '?live=github', { waitUntil: 'load' });
    await s.waitForTimeout(2200);
    if (!await s.evaluate(() => !!document.getElementById('agGhToken')))
      ungeprueft('kein Livefach — ohne WebGL kein Monitor');
    await s.fill('#agGhToken', 'AGBALLSPIEL005_Scheintoken_0123456789ab');
    await s.click('#agGhAn');
    await s.waitForTimeout(3500);
    await s.evaluate(() => { const d = document.getElementById('agGhAuf'); if (d) d.open = false; });
    return { q, s, seitenFehler };
  };
  try {
    const { q, s, seitenFehler } = await seite();

    console.log('A — Zwei Weitergaben an forge, eigene IDs');
    /* Genau die Bausteine der Meldeanweisung: 1, 2a, 2b, 2a, 2b. */
    liste.push(kommentar({ task_id: 'A1', kind: 'handoff', actor: 'peter', recipient: 'atlas',
                           title: 'Peter gibt Atlas A1.' }));
    liste.push(kommentar({ task_id: 'A1-01', parent_id: 'A1', kind: 'handoff', actor: 'atlas',
                           recipient: 'forge', title: 'Atlas gibt Forge A1-01.' }));
    liste.push(kommentar({ task_id: 'A1-01', parent_id: 'A1', kind: 'assigned', actor: 'atlas',
                           recipient: 'forge', item_type: 'task', title: 'Atlas vergibt A1-01.' }));
    liste.push(kommentar({ task_id: 'A1-02', parent_id: 'A1', kind: 'handoff', actor: 'atlas',
                           recipient: 'forge', title: 'Atlas gibt Forge A1-02.' }));
    liste.push(kommentar({ task_id: 'A1-02', parent_id: 'A1', kind: 'assigned', actor: 'atlas',
                           recipient: 'forge', item_type: 'task', title: 'Atlas vergibt A1-02.' }));
    let st = await bisLage(s, 'A1-01@forge·t,A1-02@forge·t,A1@atlas', 12000);
    zeile('A1 bei atlas, zwei Teilbälle bei forge', liegendText(st), 'A1-01@forge·t,A1-02@forge·t,A1@atlas');
    zeile('beide kennen ihren Auftrag', (st.liegend || []).filter(l => l.teil && l.eltern === 'A1').length, 2);
    const p1 = ort(st, 'A1-01', 'forge'), p2 = ort(st, 'A1-02', 'forge');
    zeile('zwei verschiedene Orte bei forge', !!(p1 && p2) && (p1[0] !== p2[0] || p1[1] !== p2[1]), true);

    console.log('\nB — Das Schild');
    let t = await schildVon(s, p1);
    zeile('AG · A1-01', t.indexOf('AG · A1-01') === 0, true);
    zeile('gehört zu A1', /gehört zu A1/.test(t), true);
    await s.screenshot({ path: path.join(AUFNAHMEN, '1-zwei-teilbaelle-schild.jpg'), type: 'jpeg', quality: 78 });

    console.log('\nC — Rückgabe von A1-01');
    liste.push(kommentar({ task_id: 'A1-01', parent_id: 'A1', kind: 'contribution', actor: 'forge',
                           recipient: 'atlas', reporter: 'forge', title: 'Forge gibt A1-01 zurück.' }));
    st = await bisLage(s, 'A1-02@forge·t,A1@atlas', 10000);
    zeile('nur A1-01 ist weg, A1-02 bleibt', liegendText(st), 'A1-02@forge·t,A1@atlas');

    console.log('\nD — Die Liste');
    const zeilen = await s.evaluate(() => [...document.querySelectorAll('#agLaeuft .agAuf')]
      .map(e => e.textContent).join(' | '));
    zeile('Liste nennt „unter A1"', /unter A1/.test(zeilen), true);
    zeile('keine Seitenfehler', seitenFehler.length, 0);
    await q.close();

    console.log('\nE — Neu laden und verbinden');
    const r2 = await seite();
    st = await stand(r2.s);
    zeile('dieselbe Lage', liegendText(st), 'A1-02@forge·t,A1@atlas');
    zeile('ohne Flug', (st.fliegend || []).length, 0);
    const p3 = ort(st, 'A1-02', 'forge');
    t = p3 ? await schildVon(r2.s, p3) : '';
    zeile('Schild nach Neuladen: gehört zu A1', /gehört zu A1/.test(t), true);
    zeile('keine Seitenfehler', r2.seitenFehler.length, 0);
    await r2.q.close();
  } finally {
    await b.close();
    tisch.s.close();
  }
  if (fehler) { console.log('\nABWEICHUNG in ' + fehler + ' Prüfung(en).'); process.exit(1); }
  console.log('\nALLES WIE VEREINBART — keine Abweichung.');
  console.log('Scheintoken, Probekörper. Keine Abnahme am iPad.');
})().catch(e => { console.log('\nUNGEPRÜFT: ' + (e && e.stack || e)); process.exit(2); });
