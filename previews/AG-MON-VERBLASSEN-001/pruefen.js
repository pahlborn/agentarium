/* AG-MON-VERBLASSEN-001 — Alles verblasst, auch Beschlossenes.

   Aufruf:            node previews/AG-MON-VERBLASSEN-001/pruefen.js
   Eigener Browser:   AG_CHROMIUM=/pfad/zur/datei node previews/...
   Aufnahmen ablegen: AG_AUFNAHMEN=/verzeichnis node previews/...
   Rueckgabe: 0 = bestanden, 1 = Abweichung, 2 = ungeprueft.

   PETER, 31.10.: "eigentlich soll alles verblassen, bei grossen Projekten
   wird es sonst zu bunt." Bis Fassung 98 stand Beschlossenes auf "fuer
   immer". Gemessen wird in der Demo NACHTPOST an Peters Entscheidung an
   Nova (etwa Sekunde 19, sie schreibt kraeftig in den Niederschlag): die
   leuchtenden Feldpunkte um Nova bei Sekunde 25 und bei Sekunde 70. Nur das
   Feld zaehlt; Namen und Schilder sind dafuer ausgeblendet.
   Lokal 01.11.: Fassung 98 4814 -> 4307 (bleibt), Fassung 99 3462 -> 347.

   GRENZEN: Die Demo laeuft weiter; was spaeter in Novas Naehe geschrieben
   wird, zaehlt mit. Darum ist die Schwelle grosszuegig (hoechstens 40 %). */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os');

const ZIEL = process.env.AG_ZIEL || 'pilot/github-live';
const WURZEL = path.resolve(__dirname, '..', '..', ...ZIEL.split('/'));
const AUFNAHMEN = process.env.AG_AUFNAHMEN || fs.mkdtempSync(path.join(os.tmpdir(), 'ag-verblassen-'));
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
  try { const s = fs.statSync(p); if (!s.isFile()) return false; fs.accessSync(p, fs.constants.X_OK); return true; }
  catch (e) { return false; }
}
function chromiumPfad(chromium) {
  if (!chromium) return { grund: 'playwright fehlt, daher ist kein Browser zu starten' };
  const g = process.env.AG_CHROMIUM;
  if (g) return ausfuehrbareDatei(g) ? { pfad: g } : { grund: 'AG_CHROMIUM zeigt nicht auf eine ausfuehrbare Datei: ' + g };
  let p = null;
  try { p = chromium.executablePath(); } catch (e) { return { grund: 'playwright meldet keinen Browserpfad: ' + e.message }; }
  return ausfuehrbareDatei(p) ? { pfad: p } : { grund: 'von playwright gemeldete Datei fehlt oder ist nicht ausfuehrbar: ' + p };
}
const TYPEN = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
                '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
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

(async () => {
  console.log('AG-MON-VERBLASSEN-001 — Alles verblasst, auch Beschlossenes\n');
  let chromium = null;
  try { chromium = require('playwright').chromium; } catch (e) {}
  const br = chromiumPfad(chromium);
  if (br.grund) ungeprueft(br.grund);
  console.log('  Kandidat    : ' + WURZEL);
  console.log('  Aufnahmen   : ' + AUFNAHMEN + '\n');
  fs.mkdirSync(AUFNAHMEN, { recursive: true });
  const b = await chromium.launch({ executablePath: br.pfad, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const tisch = await tischen(WURZEL);
  try {
    /* Rechnen in eigenem Fenster; die Seite bleibt vorn, sonst drosselt der
       Browser ihre Bilder. */
    const rechner = await (await b.newContext()).newPage();
    const q = await b.newContext({ viewport: { width: 1194, height: 834 } });
    const s = await q.newPage();
    const seitenFehler = [];
    s.on('pageerror', e => seitenFehler.push(String(e.message).slice(0, 110)));
    await s.goto(tisch.adr, { waitUntil: 'load' });
    await s.bringToFront();
    if (!await s.evaluate(() => !!(window.__feld && document.querySelector('#agRing .agName[data-wer="nova"]'))))
      ungeprueft('kein Feld — ohne WebGL kein Monitor');
    const nova = await s.evaluate(() => {
      const k = document.querySelector('#agRing .agName[data-wer="nova"]').getBoundingClientRect();
      return [k.left + k.width / 2, k.top + k.height / 2];
    });
    /* Die Uhr des Stuecks, nicht die Wanduhr: Auf einem langsamen Rechner
       laeuft das Stueck langsamer. */
    const stueckZeit = () => s.evaluate(() => window.__agStand().zeit || 0);
    const leuchtend = async () => {
      const st = await s.addStyleTag({ content: 'body *:not(#feld){visibility:hidden !important}' });
      const roh = await s.screenshot();
      await st.evaluate(e => e.remove());
      return rechner.evaluate(async (a) => {
        const i = new Image(); await new Promise(r => { i.onload = r; i.src = a.u; });
        const c = document.createElement('canvas'); c.width = i.width; c.height = i.height;
        const g = c.getContext('2d'); g.drawImage(i, 0, 0);
        const d = g.getImageData(0, 0, c.width, c.height).data; let m = 0;
        for (let y = Math.max(0, Math.round(a.p[1]) - 70); y < Math.min(c.height, Math.round(a.p[1]) + 70); y++)
          for (let x = Math.max(0, Math.round(a.p[0]) - 90); x < Math.min(c.width, Math.round(a.p[0]) + 90); x++) {
            const k = (y * c.width + x) * 4; if (Math.max(d[k], d[k + 1], d[k + 2]) > 40) m++; }
        return m;
      }, { u: 'data:image/png;base64,' + roh.toString('base64'), p: nova });
    };
    const bis = async (sek) => { for (let i = 0; i < 1200 && (await stueckZeit()) < sek; i++) await s.waitForTimeout(250); };
    await bis(25);
    const frueh = await leuchtend();
    await s.screenshot({ path: path.join(AUFNAHMEN, '1-sekunde-25.jpg'), type: 'jpeg', quality: 78 });
    await bis(70);
    const spaet = await leuchtend();
    await s.screenshot({ path: path.join(AUFNAHMEN, '2-sekunde-70.jpg'), type: 'jpeg', quality: 78 });
    const anteil = frueh ? spaet / frueh : 1;
    console.log('        leuchtende Feldpunkte um Nova: Sekunde 25 ' + frueh + ', Sekunde 70 ' + spaet +
                ' (' + Math.round(anteil * 100) + ' %)');
    zeile('Novas Entscheidung hat Farbe hinterlassen', frueh > 500, true);
    zeile('… und sie verblasst (≤ 40 % nach 45 s)', anteil <= 0.40, true);
    zeile('keine Seitenfehler', seitenFehler.length, 0);
    await q.close();
  } finally {
    await b.close();
    tisch.s.close();
  }
  if (fehler) { console.log('\nABWEICHUNG in ' + fehler + ' Prüfung(en).'); process.exit(1); }
  console.log('\nALLES WIE VEREINBART — keine Abweichung.');
})().catch(e => { console.log('\nUNGEPRÜFT: ' + (e && e.stack || e)); process.exit(2); });
