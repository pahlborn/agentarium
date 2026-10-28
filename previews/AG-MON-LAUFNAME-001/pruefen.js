/* AG-MON-LAUFNAME-001 — die Bezeichnung eines Laufs.

   Aufruf:            node previews/AG-MON-LAUFNAME-001/pruefen.js
   Eigener Browser:   AG_CHROMIUM=/pfad/zur/datei node previews/...
   Rueckgabe: 0 = bestanden, 1 = Abweichung, 2 = ungeprueft.

   PETER, 26.10.: Als Bezeichnung eines Laufs dient der Titel des Anstosses
   (Atlas schreibt dort ohnehin, worum es geht). Kein neues Feld.

     A  "Peter gibt Atlas: X" und "Peter beauftragt Atlas: X" ergeben X; ein
        Titel ohne diesen Vorspann bleibt ganz; ein Lauf ohne Anstoss hat
        keine Bezeichnung
     B  das Schild am Ball nennt "Lauf <ID> · <Bezeichnung>", auch am Teilball
     C  oben rechts im Werkblock steht "<Lauf-ID> · <Bezeichnung>"

   GRENZEN: Attrappe mit Scheintoken, Probekoerper. Keine Abnahme am iPad.  */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');

const ZIEL = process.env.AG_ZIEL || 'pilot/github-live';
const WURZEL = path.resolve(__dirname, '..', '..', ...ZIEL.split('/'));
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
function kommentar(min, ereignis) {
  nr++;
  const zeit = new Date(Date.now() - min * 60000 + nr).toISOString();
  const e = Object.assign({
    schema: 'agentarium.github-event.v1', id: 'AG-LN-EREIGNIS-' + nr,
    project_id: 'agentarium', occurred_at: zeit, reporter: 'atlas',
    source_evidence: 'reported_checkpoint', source_tool_id: 'previews/AG-MON-LAUFNAME-001'
  }, ereignis);
  return { id: 9995000000 + nr, created_at: zeit,
           user: { login: 'pahlborn', id: 277496791 },
           body: '<!-- AGENTARIUM_EVENT_V1 -->\n```json\n' + JSON.stringify(e, null, 2) +
                 '\n```\nProbe aus AG-MON-LAUFNAME-001, kein echter Auftrag.' };
}
const stand = (s) => s.evaluate(() => (window.__agStand && window.__agStand()) || {});
const ort = (st, aufgabe, bei) => {
  const l = (st.liegend || []).find(x => x.aufgabe === aufgabe && x.bei === bei);
  return l && l.ort;
};
async function schildVon(s, p) {
  await s.mouse.click(p[0], p[1]);
  await s.waitForTimeout(200);
  return s.evaluate(() => {
    const e = document.getElementById('agBallInfo');
    return e && getComputedStyle(e).display !== 'none' ? e.textContent : '';
  });
}

(async () => {
  console.log('AG-MON-LAUFNAME-001 — die Bezeichnung eines Laufs\n');
  let chromium = null;
  try { chromium = require('playwright').chromium; } catch (e) {}
  const br = chromiumPfad(chromium);
  if (br.grund) ungeprueft(br.grund);
  console.log('  Kandidat    : ' + WURZEL + '\n');
  const b = await chromium.launch({ executablePath: br.pfad,
                                    args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const tisch = await tischen(WURZEL);
  const liste = [
    kommentar(30, { run_id: 'AG-LN-L1', task_id: 'A1', kind: 'handoff', actor: 'peter',
                    recipient: 'atlas', title: 'Peter gibt Atlas: Rückgaben abgleichen' }),
    kommentar(29, { run_id: 'AG-LN-L1', task_id: 'A1-01', parent_id: 'A1', kind: 'handoff',
                    actor: 'atlas', recipient: 'forge', title: 'Atlas gibt Forge A1-01.' }),
    kommentar(20, { run_id: 'AG-LN-L2', task_id: 'A2', kind: 'handoff', actor: 'peter',
                    recipient: 'atlas', title: 'Peter beauftragt Atlas: Punkt 4a anwenden' }),
    kommentar(15, { run_id: 'AG-LN-L3', task_id: 'B1', kind: 'handoff', actor: 'atlas',
                    recipient: 'lot', title: 'Atlas gibt Lot B1 (ohne Anstoß).' }),
    kommentar(10, { run_id: 'AG-LN-L4', task_id: 'C1', kind: 'handoff', actor: 'peter',
                    recipient: 'atlas', title: 'Bälle aufräumen' })
  ];
  try {
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
                  headers: { ETag: 'W/"ag-ln-' + abrufe + '"' }, body: JSON.stringify(liste) });
    });
    await s.goto(tisch.adr + '?live=github', { waitUntil: 'load' });
    await s.waitForTimeout(2200);
    if (!await s.evaluate(() => !!document.getElementById('agGhToken')))
      ungeprueft('kein Livefach — ohne WebGL kein Monitor');
    await s.fill('#agGhToken', 'AGMONLAUFNAME001_Scheintoken_0123456789');
    await s.click('#agGhAn');
    await s.waitForTimeout(3500);
    await s.evaluate(() => { const d = document.getElementById('agGhAuf'); if (d) d.open = false; });

    console.log('A — Bezeichnung aus dem Anstoß');
    const name = (lauf) => s.evaluate(l => window.__agGithub.laufName('agentarium', l), lauf);
    zeile('„Peter gibt Atlas: …"', await name('AG-LN-L1'), 'Rückgaben abgleichen');
    zeile('„Peter beauftragt Atlas: …"', await name('AG-LN-L2'), 'Punkt 4a anwenden');
    zeile('ohne Vorspann bleibt der Titel ganz', await name('AG-LN-L4'), 'Bälle aufräumen');
    zeile('ohne Anstoß keine Bezeichnung', await name('AG-LN-L3'), '');

    console.log('\nB — Das Schild am Ball');
    let st = await stand(s);
    let t = await schildVon(s, ort(st, 'A1', 'atlas'));
    zeile('Peters Ball: Lauf · Bezeichnung', /Lauf AG-LN-L1 · Rückgaben abgleichen/.test(t), true);
    t = await schildVon(s, ort(st, 'A1-01', 'forge'));
    zeile('Teilball: Lauf · Bezeichnung', /Lauf AG-LN-L1 · Rückgaben abgleichen/.test(t), true);
    t = await schildVon(s, ort(st, 'B1', 'lot'));
    zeile('Lauf ohne Anstoß: nur die ID', /Lauf AG-LN-L3$/.test(t), true);

    console.log('\nC — Oben rechts im Werkblock');
    liste.push(kommentar(0, { run_id: 'AG-LN-L2', task_id: 'A2-01', parent_id: 'A2', kind: 'handoff',
                              actor: 'atlas', recipient: 'nova', title: 'Atlas gibt Nova A2-01.' }));
    let kopfText = '';
    for (let i = 0; i < 60; i++) {
      await s.waitForTimeout(150);
      kopfText = await s.evaluate(() => {
        const e = document.querySelector('#agWerkName .wTitel'); return e ? e.textContent : ''; });
      if (/AG-LN-L2/.test(kopfText)) break;
    }
    zeile('„AG-LN-L2 · Punkt 4a anwenden"', kopfText, 'AG-LN-L2 · Punkt 4a anwenden');
    zeile('keine Seitenfehler', seitenFehler.length, 0);
    await q.close();
  } finally {
    await b.close();
    tisch.s.close();
  }
  if (fehler) { console.log('\nABWEICHUNG in ' + fehler + ' Prüfung(en).'); process.exit(1); }
  console.log('\nALLES WIE VEREINBART — keine Abweichung.');
  console.log('Scheintoken, Probekörper. Keine Abnahme am iPad.');
})().catch(e => { console.log('\nUNGEPRÜFT: ' + (e && e.stack || e)); process.exit(2); });