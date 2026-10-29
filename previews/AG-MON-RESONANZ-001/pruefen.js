/* AG-MON-RESONANZ-001 — liegende Baelle lassen dem Feld seine Resonanz.

   Aufruf:            node previews/AG-MON-RESONANZ-001/pruefen.js
   Eigener Browser:   AG_CHROMIUM=/pfad/zur/datei node previews/...
   Aufnahmen ablegen: AG_AUFNAHMEN=/verzeichnis node previews/...
   Rueckgabe: 0 = bestanden, 1 = Abweichung, 2 = ungeprueft.

   PETER, 28.10.: "Man sieht jetzt zwar die Baelle, aber die Resonanzeffekte
   sind verschwunden. Das war etwas anregend Schoenes."
   Ursache: Das Feld hat einen Ring von 14.000 Punkten; jeder neue Punkt
   ueberschreibt den aeltesten, auch einen Faden des Mediums. Jeder liegende
   Ball setzte 98 Punkte je Bild -- mit acht Baellen ueber 40.000 je Sekunde.

   Gemessen wird am Feld selbst: Jeder Aufruf von `__feld.sonne` ohne
   Geschwindigkeit (gx = gy = 0) ist ein STILL liegender Ball; seine Punkte
   werden je Bild gezaehlt.

     A  ein liegender Ball: 98 Punkte je Bild, wie bisher
     B  acht liegende Baelle (einer ganz, sieben Teilbaelle): zusammen nicht
        mehr als ein Ball, 98 je Bild (+ Rundung)
     C  die Baelle bleiben alle sichtbar (liegend, mit Ort)

   GRENZEN: Gemessen wird der Verbrauch, nicht die Schoenheit. Ob die
   Resonanz wieder "anregend schoen" ist, entscheidet Peter am iPad.     */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os');

const ZIEL = process.env.AG_ZIEL || 'pilot/github-live';
const WURZEL = path.resolve(__dirname, '..', '..', ...ZIEL.split('/'));
const AUFNAHMEN = process.env.AG_AUFNAHMEN ||
  fs.mkdtempSync(path.join(os.tmpdir(), 'ag-resonanz-'));
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
    schema: 'agentarium.github-event.v1', id: 'AG-RES-EREIGNIS-' + nr,
    project_id: 'agentarium', run_id: 'AG-RES-L1', occurred_at: zeit, reporter: 'atlas',
    source_evidence: 'reported_checkpoint', source_tool_id: 'previews/AG-MON-RESONANZ-001'
  }, ereignis);
  return { id: 9996000000 + nr, created_at: zeit,
           user: { login: 'pahlborn', id: 277496791 },
           body: '<!-- AGENTARIUM_EVENT_V1 -->\n```json\n' + JSON.stringify(e, null, 2) +
                 '\n```\nProbe aus AG-MON-RESONANZ-001, kein echter Auftrag.' };
}
const AGENTEN = ['forge', 'nova', 'scout', 'argus', 'sentinel', 'archibald', 'lot'];

async function seite(b, tisch, liste) {
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
                headers: { ETag: 'W/"ag-res-' + abrufe + '"' }, body: JSON.stringify(liste) });
  });
  await s.goto(tisch.adr + '?live=github', { waitUntil: 'load' });
  await s.waitForTimeout(2200);
  if (!await s.evaluate(() => !!document.getElementById('agGhToken')))
    ungeprueft('kein Livefach — ohne WebGL kein Monitor');
  await s.fill('#agGhToken', 'AGMONRESONANZ001_Scheintoken_0123456789');
  await s.click('#agGhAn');
  await s.waitForTimeout(3500);
  await s.evaluate(() => { const d = document.getElementById('agGhAuf'); if (d) d.open = false; });
  await s.waitForTimeout(1500);
  return { q, s, seitenFehler };
}
/* Zaehlt drei Sekunden lang die Punkte still liegender Baelle je Bild. */
async function messen(s) {
  return s.evaluate(() => new Promise(fertig => {
    const f = window.__feld, alt = f.sonne;
    let punkte = 0, bilder = 0, aus = false;
    f.sonne = function (x, y, gx, gy, r, hitze, ton, abgabe, wieviele) {
      if (gx === 0 && gy === 0) punkte += wieviele;
      return alt.apply(this, arguments);
    };
    const takt = () => { if (aus) return; bilder++; requestAnimationFrame(takt); };
    requestAnimationFrame(takt);
    setTimeout(() => { aus = true; f.sonne = alt;
      fertig({ punkte, bilder, jeBild: bilder ? punkte / bilder : 0 }); }, 3000);
  }));
}

(async () => {
  console.log('AG-MON-RESONANZ-001 — liegende Bälle lassen dem Feld seine Resonanz\n');
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
  const anstoss = kommentar(30, { task_id: 'A1', kind: 'handoff', actor: 'peter',
                                  recipient: 'atlas', title: 'Peter gibt Atlas: A1' });
  try {
    console.log('A — Ein liegender Ball');
    let r = await seite(b, tisch, [anstoss]);
    let st = await r.s.evaluate(() => window.__agStand());
    zeile('ein Ball liegt', (st.liegend || []).length, 1);
    let m = await messen(r.s);
    console.log('        ' + m.punkte + ' Punkte in ' + m.bilder + ' Bildern');
    zeile('98 Punkte je Bild, wie bisher', Math.round(m.jeBild), 98);
    zeile('keine Seitenfehler', r.seitenFehler.length, 0);
    await r.q.close();

    console.log('\nB — Acht liegende Bälle');
    const liste = [anstoss].concat(AGENTEN.map((a, k) => kommentar(29 - k, {
      task_id: 'A1-0' + (k + 1), parent_id: 'A1', kind: 'handoff', actor: 'atlas',
      recipient: a, title: 'Atlas gibt ' + a + ' A1-0' + (k + 1) + '.' })));
    r = await seite(b, tisch, liste);
    st = await r.s.evaluate(() => window.__agStand());
    zeile('acht Bälle liegen', (st.liegend || []).length, 8);
    m = await messen(r.s);
    console.log('        ' + m.punkte + ' Punkte in ' + m.bilder + ' Bildern');
    zeile('zusammen höchstens ein Ball (≤ 110 je Bild)', m.jeBild <= 110, true);
    zeile('… und nicht leer (≥ 80 je Bild)', m.jeBild >= 80, true);

    console.log('\nC — Alle bleiben sichtbar');
    st = await r.s.evaluate(() => window.__agStand());
    zeile('alle acht haben einen Ort', (st.liegend || []).filter(l => l.ort).length, 8);
    await r.s.waitForTimeout(2000);
    await r.s.screenshot({ path: path.join(AUFNAHMEN, '1-acht-baelle.jpg'), type: 'jpeg', quality: 80 });
    zeile('keine Seitenfehler', r.seitenFehler.length, 0);
    await r.q.close();
  } finally {
    await b.close();
    tisch.s.close();
  }
  if (fehler) { console.log('\nABWEICHUNG in ' + fehler + ' Prüfung(en).'); process.exit(1); }
  console.log('\nALLES WIE VEREINBART — keine Abweichung.');
  console.log('Gemessen ist der Verbrauch, nicht die Schönheit. Abnahme am iPad durch Peter.');
})().catch(e => { console.log('\nUNGEPRÜFT: ' + (e && e.stack || e)); process.exit(2); });