/* AG-MON-BALLSPIEL-004 — Antippen zeigt Aufgabe und Halter.

   Aufruf:            node previews/AG-MON-BALLSPIEL-004/pruefen.js
   Eigener Browser:   AG_CHROMIUM=/pfad/zur/datei node previews/...
   Aufnahmen ablegen: AG_AUFNAHMEN=/verzeichnis node previews/...
   Rueckgabe: 0 = bestanden, 1 = Abweichung, 2 = ungeprueft.

   PETER, 24.10.: "Alle Baelle golden. Antippen zeigt Aufgabe und Halter."
   PETER, 25.10.: "eine id am ball wuerde helfen" / "eine id am ball waere
   super" -- ein Ball bei Atlas liess sich nicht erklaeren.

     A  Tippen auf Peters Ball bei atlas: Kuerzel und Aufgabe, "bei Atlas",
        der Lauf
     B  Tippen auf einen Teilball: "Teilball · bei Lot · von Atlas"
     C  Tippen auf den Ball bei Peter: "wartet auf Annahme"
     D  Tippen daneben schliesst; Ziehen ueber einen Ball (Ruehren) oeffnet
        nichts
     E  mit dem Finger (Beruehrung wie am iPad) dasselbe
     F  das Schild setzt Text, kein HTML aus Daten

   GRENZEN: Attrappe mit Scheintoken, Probekoerper. Keine Abnahme am iPad.  */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os');

const ZIEL = process.env.AG_ZIEL || 'pilot/github-live';
const WURZEL = path.resolve(__dirname, '..', '..', ...ZIEL.split('/'));
const AUFNAHMEN = process.env.AG_AUFNAHMEN ||
  fs.mkdtempSync(path.join(os.tmpdir(), 'ag-ballspiel-4-'));
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
function kommentar(zeit, ereignis) {
  nr++;
  const e = Object.assign({
    schema: 'agentarium.github-event.v1', id: 'AG-BALL4-EREIGNIS-' + nr,
    project_id: 'agentarium', occurred_at: zeit, reporter: 'atlas',
    source_evidence: 'reported_checkpoint', source_tool_id: 'previews/AG-MON-BALLSPIEL-004'
  }, ereignis);
  return { id: 9960000000 + nr, created_at: zeit,
           user: { login: 'pahlborn', id: 277496791 },
           body: '<!-- AGENTARIUM_EVENT_V1 -->\n```json\n' + JSON.stringify(e, null, 2) +
                 '\n```\nProbe aus AG-MON-BALLSPIEL-004, kein echter Auftrag.' };
}
const vor = (min) => new Date(Date.now() - min * 60000).toISOString();
const stand = (s) => s.evaluate(() => (window.__agStand && window.__agStand()) || {});
const ort = (st, aufgabe, bei) => {
  const l = (st.liegend || []).find(x => x.aufgabe === aufgabe && x.bei === bei);
  return l && l.ort;
};
const schild = (s) => s.evaluate(() => {
  const e = document.getElementById('agBallInfo');
  return { offen: !!e && getComputedStyle(e).display !== 'none', text: e ? e.textContent : '',
           html: e ? e.innerHTML : '' };
});

/* Vorgeschichte: Lauf AG-B4-L1 -- Peters A1 liegt bei atlas, Teilball A1-L
   bei lot. Lauf AG-B4-L2 -- A2 zurueck bei Peter, nicht angenommen. Der
   */
const historie = () => [
  kommentar(vor(30), { run_id: 'AG-B4-L1', task_id: 'A1', kind: 'handoff', actor: 'peter',
                       recipient: 'atlas', title: 'Peter gibt Atlas A1.' }),
  kommentar(vor(29), { run_id: 'AG-B4-L1', task_id: 'A1-L', kind: 'handoff', actor: 'atlas',
                       recipient: 'lot', title: 'Atlas gibt Lot A1-L.' }),
  kommentar(vor(20), { run_id: 'AG-B4-L2', task_id: 'A2', kind: 'handoff', actor: 'peter',
                       recipient: 'atlas', title: 'Peter gibt Atlas A2.' }),
  kommentar(vor(19), { run_id: 'AG-B4-L2', task_id: 'A2', kind: 'contribution', actor: 'atlas',
                       recipient: 'peter', title: 'Atlas gibt Peter A2.' })
];

async function seite(b, tisch, mitFinger) {
  const q = await b.newContext({ viewport: { width: 1194, height: 834 }, hasTouch: !!mitFinger });
  const s = await q.newPage();
  const seitenFehler = [];
  s.on('pageerror', e => seitenFehler.push(String(e.message).slice(0, 110)));
  const liste = historie();
  let abrufe = 0;
  await s.route('**/projekte/verzeichnis.json', r => r.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify(VERZEICHNIS) }));
  await s.route('**api.github.com/**', r => {
    abrufe++;
    r.fulfill({ status: 200, contentType: 'application/json',
                headers: { ETag: 'W/"ag-ball4-' + abrufe + '"' }, body: JSON.stringify(liste) });
  });
  await s.goto(tisch.adr + '?live=github', { waitUntil: 'load' });
  await s.waitForTimeout(2200);
  if (!await s.evaluate(() => !!document.getElementById('agGhToken')))
    ungeprueft('kein Livefach — ohne WebGL kein Monitor');
  await s.fill('#agGhToken', 'AGBALLSPIEL004_Scheintoken_0123456789ab');
  await s.click('#agGhAn');
  await s.waitForTimeout(3500);
  await s.evaluate(() => { const d = document.getElementById('agGhAuf'); if (d) d.open = false; });
  await s.waitForTimeout(400);
  return { q, s, seitenFehler };
}

(async () => {
  console.log('AG-MON-BALLSPIEL-004 — Antippen zeigt Aufgabe und Halter\n');
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
    const { q, s, seitenFehler } = await seite(b, tisch, false);
    let st = await stand(s);
    const pA1 = ort(st, 'A1', 'atlas'), pL = ort(st, 'A1-L', 'lot'), pA2 = ort(st, 'A2', 'peter');
    zeile('drei Bälle liegen und haben einen Ort', !!(pA1 && pL && pA2), true);
    if (!(pA1 && pL && pA2)) ungeprueft('Bälle ohne Ort: ' + JSON.stringify(st.liegend));

    console.log('\nA — Peters Ball bei atlas');
    await s.mouse.click(pA1[0], pA1[1]);
    await s.waitForTimeout(200);
    let sc = await schild(s);
    zeile('Schild offen', sc.offen, true);
    zeile('Kürzel und Aufgabe', sc.text.indexOf('AG · A1') === 0, true);
    zeile('bei Atlas', /Dein Auftrag · bei Atlas/.test(sc.text), true);
    zeile('Lauf', /Lauf AG-B4-L1/.test(sc.text), true);
    await s.screenshot({ path: path.join(AUFNAHMEN, '1-schild-bei-atlas.jpg'), type: 'jpeg', quality: 78 });

    console.log('\nB — Teilball bei lot');
    await s.mouse.click(pL[0], pL[1]);
    await s.waitForTimeout(200);
    sc = await schild(s);
    zeile('Teilball, bei Lot, von Atlas', /Teilball · bei Lot · von Atlas/.test(sc.text), true);
    zeile('Aufgabe A1-L', sc.text.indexOf('AG · A1-L') === 0, true);

    console.log('\nC — Ball bei Peter');
    await s.mouse.click(pA2[0], pA2[1]);
    await s.waitForTimeout(200);
    sc = await schild(s);
    zeile('wartet auf Annahme', /zurück bei dir · wartet auf Annahme/.test(sc.text), true);
    console.log('\nF — Text, kein HTML');
    /* IDs laesst der Adapter nur aus Buchstaben, Ziffern und ._:/- zu; das
       Schild setzt sie trotzdem als Text. Es besteht nur aus den drei
       eigenen Elementen. */
    zeile('Schild enthält nur b, span, small', await s.evaluate(() =>
      [...document.querySelectorAll('#agBallInfo *')].map(e => e.tagName).join(',')), 'B,SPAN,SMALL');

    console.log('\nD — Daneben tippen, rühren');
    await s.mouse.click(Math.round(1194 / 2), 60);
    await s.waitForTimeout(200);
    zeile('daneben tippen schließt', (await schild(s)).offen, false);
    await s.mouse.move(pA1[0] - 60, pA1[1]);
    await s.mouse.down();
    for (let i = 1; i <= 12; i++) { await s.mouse.move(pA1[0] - 60 + i * 10, pA1[1] + (i % 2) * 4); await s.waitForTimeout(16); }
    await s.mouse.up();
    await s.waitForTimeout(200);
    zeile('Ziehen über den Ball öffnet nichts', (await schild(s)).offen, false);
    await s.mouse.click(pA1[0], pA1[1]);
    await s.waitForTimeout(6400);
    zeile('… und zwar wirklich', (await schild(s)).offen, false);
    zeile('keine Seitenfehler', seitenFehler.length, 0);
    await q.close();

    console.log('\nE — Mit dem Finger (Berührung)');
    const r2 = await seite(b, tisch, true);
    st = await stand(r2.s);
    const pF = ort(st, 'A1-L', 'lot');
    await r2.s.touchscreen.tap(pF[0], pF[1]);
    await r2.s.waitForTimeout(250);
    sc = await schild(r2.s);
    zeile('Tippen mit dem Finger öffnet das Schild', sc.offen, true);
    zeile('… mit dem Teilball bei Lot', /Teilball · bei Lot/.test(sc.text), true);
    await r2.s.screenshot({ path: path.join(AUFNAHMEN, '2-schild-teilball-finger.jpg'), type: 'jpeg', quality: 78 });
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
