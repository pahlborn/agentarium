/* AG-MON-RUHE-002/-003 — Ruhe mit den Vorfuehrungen des Mischpults.

   Aufruf:            node previews/AG-MON-RUHE-002/pruefen.js
   Eigener Browser:   AG_CHROMIUM=/pfad/zur/datei node previews/...
   Andere Kopie:      AG_ZIEL=pfad/relativ/zum/repo node previews/...
   Rueckgabe: 0 = bestanden, 1 = Abweichung, 2 = ungeprueft.

   PETER, 16.11.2026: "randomisierte effekte aus pult ... sofern wenig oder
   nichts los ist. die effekte sollen aber verblassen und nichts davon übrig
   bleiben." 17.11.2026: "es sind nicht die, die wir in pult haben, du hast
   neue erfunden die ich gar nicht mag ... bitte nehme welche aus pult".

     A  die Arten: die vier vom 31.10. und die Vorfuehrungen des Mischpults
        (`pult-…`), keine der in Fassung 107 nachgebauten; Sog und Umlauf
        nicht, weil das Feld hier ihre Wirkung nicht hat
     B  jede Vorfuehrung spielt die Geisterhand (Zeigerereignisse mit ihrer
        Kennung auf dem Feld), GENAU DIE vorgefuehrte Wirkung feuert im Feld
        (ihr Lebenszeichen in `PULS`, wie das Pult es anzeigt; bis 3 s nach
        dem Ende -- Funken springen, wenn ein Lichtpunkt vergeht), das Feld
        leuchtet sichtbar (mindestens 300 Punkte ueber dem Grund; Wurf und
        Umlauf sind vor allem Bewegung -- im Prueflauf kam der Wurf bei
        seltenen Bildern auf 436)
        und 20 s nach dem Ende ist nichts mehr da (hoechstens 1 % des
        Hoechststands, mindestens 300 Punkte Spielraum). Gemessen 17.11.:
        die Schleife, die kraeftigste, steht nach 10 s noch bei rund 8 %,
        nach 20 s bei 0.
     C  wenig los: arbeitet EINE Rolle, kommen Erscheinungen; arbeiten
        ZWEI, kommt keine
     D  die Geisterhand ist keine Hand: Sie holt die Knoepfe nicht hervor,
        und ein echter Finger beendet sie sofort
     E  keine Seitenfehler

   Gemessen werden leuchtende Feldpunkte (Namen und Schilder ausgeblendet)
   im ganzen Bild. GRENZEN: Chromium; ob es schoen und ruhig genug ist,
   entscheidet Peter am iPad.                                             */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');

const ZIEL = process.env.AG_ZIEL || 'pilot/github-live';
const WURZEL = path.resolve(__dirname, '..', '..', ...ZIEL.split('/'));

let fehler = 0;
function zeile(w, ist, soll) {
  const ok = ist === soll;
  if (!ok) fehler++;
  console.log('  ' + (ok ? 'ok  ' : 'FEHL') + '  ' + w.padEnd(58) +
              String(ist).slice(0, 40).padEnd(24) + (ok ? '' : '(erwartet ' + soll + ')'));
}
function ungeprueft(grund) { console.log('\nUNGEPRÜFT: ' + grund); process.exit(2); }
function ausfuehrbareDatei(p) {
  if (!p) return false;
  try { const s = fs.statSync(p); if (!s.isFile()) return false;
        fs.accessSync(p, fs.constants.X_OK); return true; } catch (e) { return false; }
}
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ungeprueft('playwright fehlt'); }
function browserPfad() {
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

const VERZEICHNIS = {
  schema: 'agentarium.projektverzeichnis.v1', gepflegt_von: 'atlas',
  projekte: [{ id: 'agentarium', kuerzel: 'AG', name: 'Agentarium', repo: 'pahlborn/agentarium' }]
};
let nr = 0;
function kommentar(min, ereignis) {
  nr++;
  const zeit = new Date(Date.now() - min * 60000 + nr).toISOString();
  const e = Object.assign({
    schema: 'agentarium.github-event.v1', id: 'AG-RUHE-EREIGNIS-' + nr,
    project_id: 'agentarium', run_id: 'AG-RUHE-L1', occurred_at: zeit, reporter: 'atlas',
    source_evidence: 'reported_checkpoint', source_tool_id: 'previews/AG-MON-RUHE-002'
  }, ereignis);
  return { id: 9998000000 + nr, created_at: zeit, user: { login: 'pahlborn', id: 277496791 },
           body: '<!-- AGENTARIUM_EVENT_V1 -->\n```json\n' + JSON.stringify(e, null, 2) +
                 '\n```\nProbe aus AG-MON-RUHE-002, kein echter Auftrag.' };
}

async function oeffnen(b, tisch, liste) {
  const q = await b.newContext({ viewport: { width: 1194, height: 834 } });
  const s = await q.newPage();
  const seitenFehler = [];
  s.on('pageerror', e => seitenFehler.push(String(e.message).slice(0, 110)));
  await s.route('**/projekte/verzeichnis.json', r => r.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify(VERZEICHNIS) }));
  await s.route('**api.github.com/**', r => r.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify(r.request().url().includes('/actions/') ? { workflow_runs: [] } : liste) }));
  await s.goto(tisch.adr + '?live=github', { waitUntil: 'load' });
  await s.waitForFunction(() => !!document.getElementById('agGhToken'), null, { timeout: 20000 });
  await s.fill('#agGhToken', 'AGMONRUHE002_Scheintoken_0123456789abcd');
  await s.click('#agGhAn');
  await s.waitForFunction(() => window.__agGithub && window.__agGithub.stand().phase === 'verbunden',
                          null, { timeout: 30000 });
  await s.evaluate(() => { const d = document.getElementById('agGhAuf'); if (d) d.open = false; });
  return { q, s, seitenFehler };
}
/* Leuchtende Feldpunkte im ganzen Bild, nur das Feld. */
async function leuchtend(s, rechner) {
  const st = await s.addStyleTag({ content: 'body *:not(#feld){visibility:hidden !important}' });
  const roh = await s.screenshot();
  await st.evaluate(e => e.remove());
  return rechner.evaluate(async (u) => {
    const i = new Image(); await new Promise(r => { i.onload = r; i.src = u; });
    const c = document.createElement('canvas'); c.width = i.width; c.height = i.height;
    const g = c.getContext('2d'); g.drawImage(i, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data; let m = 0;
    for (let k = 0; k < d.length; k += 4) if (Math.max(d[k], d[k + 1], d[k + 2]) > 40) m++;
    return m;
  }, 'data:image/png;base64,' + roh.toString('base64'));
}
const ALT = ['komet', 'wirbel', 'knoten', 'korn'];
const NACHGEBAUT = ['stroemung', 'schleife', 'sog', 'stoss', 'stimmen', 'strang'];

(async () => {
  console.log('AG-MON-RUHE-002/-003 — Ruhe mit den Vorführungen des Mischpults\n');
  if (!fs.existsSync(path.join(WURZEL, 'index.html'))) ungeprueft('keine index.html in ' + WURZEL);
  const bp = browserPfad();
  if (!bp.pfad) ungeprueft(bp.grund);
  const tisch = await tischen(WURZEL);
  const b = await chromium.launch({ executablePath: bp.pfad, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const fehlerAlle = [];
  try {
    const rechner = await (await b.newContext()).newPage();
    console.log('A — die Arten');
    let o = await oeffnen(b, tisch, []);
    await o.s.bringToFront();
    const arten = await o.s.evaluate(() => (window.__agRuhe && window.__agRuhe.arten) || []);
    const pult = arten.filter(a => a.indexOf('pult-') === 0);
    console.log('        ' + arten.join(', '));
    zeile('die vier vom 31.10. sind da', ALT.every(a => arten.indexOf(a) >= 0), true);
    zeile('Vorführungen des Mischpults (mind. 11)', pult.length >= 11, true);
    zeile('ohne Sog und Umlauf', pult.indexOf('pult-sog') < 0 && pult.indexOf('pult-umlauf') < 0, true);
    zeile('keine der nachgebauten aus Fassung 107', NACHGEBAUT.some(a => arten.indexOf(a) >= 0), false);

    console.log('\nB — jede Vorführung: Geisterhand, deutliche Antwort, nichts bleibt');
    /* Erscheinungen laufen erst nach 12 s Ruhe; die erste von selbst
       abwarten, bis sie vorbei und verklungen ist (sonst faellt sie in die
       Messung). Danach haelt `__agRuhe.still()` jede Erscheinung von selbst
       fern; `zeigen` spielt die gewuenschte sofort. Erster Lauf ohne das:
       Kurz vor einer Vorfuehrung begann eine von selbst und verfaelschte
       den Grund (bis 19 000 Punkte). */
    await o.s.evaluate(() => {
      window.__geistZeiger = 0;
      document.getElementById('feld').addEventListener('pointermove', e => {
        if (e.pointerId === window.__agGeistId) window.__geistZeiger++; }, true);
    });
    await o.s.waitForFunction(() => window.__agStand().leerlaufAnzahl > 0, null, { timeout: 40000 });
    await o.s.waitForFunction(() => !window.__agStand().leerlauf, null, { timeout: 40000 });
    await o.s.evaluate(() => window.__agRuhe.still());
    await o.s.waitForTimeout(10000);
    for (const art of pult) {
      const grund = await leuchtend(o.s, rechner);
      await o.s.evaluate(() => { window.__geistZeiger = 0; window.__t0 = performance.now(); });
      const ok = await o.s.evaluate((a) => !!window.__agRuhe.zeigen(a), art);
      let hoch = 0; const t0 = Date.now();
      while (await o.s.evaluate(() => !!window.__agStand().leerlauf) && Date.now() - t0 < 25000) {
        hoch = Math.max(hoch, await leuchtend(o.s, rechner));
        await o.s.waitForTimeout(250);
      }
      const zeiger = await o.s.evaluate(() => window.__geistZeiger);
      await o.s.evaluate(() => window.__agRuhe.still());
      await o.s.waitForTimeout(3000);
      const wirkung = art.slice(5);
      const feuert = await o.s.evaluate((k) => !!(window.PULS && window.PULS[k] > window.__t0), wirkung);
      await o.s.evaluate(() => window.__agRuhe.still());
      await o.s.waitForTimeout(17000);               /* zusammen 20 s nach dem Ende */
      const rest = await leuchtend(o.s, rechner);
      const auf = hoch - grund;
      console.log('        ' + art.padEnd(16) + ' Hand ' + zeiger + ' Züge · Grund ' + grund + ' · höchstens ' + hoch +
                  ' · 20 s nach dem Ende ' + rest);
      zeile(art + ': Geisterhand spielt', ok && zeiger > 5, true);
      zeile(art + ': Wirkung „' + wirkung + '" feuert im Feld', feuert, true);
      zeile(art + ': Feld leuchtet sichtbar (≥ 300)', auf >= 300, true);
      zeile(art + ': nach 20 s nichts mehr', rest <= Math.max(300, hoch * 0.01), true);
    }

    console.log('\nD — die Geisterhand ist keine Hand');
    await o.s.evaluate(() => window.__agRuhe.zeigen('pult-tempo'));
    await o.s.waitForTimeout(1200);
    zeile('Knöpfe bleiben leise, während sie spielt',
          await o.s.evaluate(() => document.getElementById('agTasten').classList.contains('leise')), true);
    await o.s.mouse.move(597, 300); await o.s.mouse.down(); await o.s.mouse.up();
    await o.s.waitForTimeout(150);
    const nach = await o.s.evaluate(() => { const z = window.__geistZeiger; return new Promise(r =>
      setTimeout(() => r({ leer: !window.__agStand().leerlauf, weiter: window.__geistZeiger - z }), 600)); });
    zeile('ein echter Finger beendet sie sofort', nach.leer && nach.weiter === 0, true);
    fehlerAlle.push(...o.seitenFehler); await o.q.close();

    console.log('\nC — wenig los');
    const arbeit = (wer) => [
      kommentar(5, { task_id: 'AG-RUHE-' + wer, kind: 'assigned', actor: 'atlas', recipient: wer,
                     item_type: 'task', title: 'Atlas vergibt an ' + wer + '.' }),
      kommentar(4.5, { task_id: 'AG-RUHE-' + wer, kind: 'started', actor: wer, reporter: wer,
                       title: wer + ' beginnt.' })];
    for (const [wer, soll] of [[['forge'], true], [['forge', 'argus'], false]]) {
      o = await oeffnen(b, tisch, [].concat(...wer.map(arbeit)));
      await o.s.bringToFront();
      const arbeitend = await o.s.evaluate(() => (window.__agStand().aufgaben || [])
        .filter(a => a.zustand === 'begonnen').length);
      await o.s.waitForTimeout(16000);
      const n = await o.s.evaluate(() => window.__agStand().leerlaufAnzahl);
      zeile(wer.length + ' arbeitend (' + wer.join('+') + ')', arbeitend, wer.length);
      zeile(wer.length + ' arbeitend: Erscheinungen kommen', n > 0, soll);
      fehlerAlle.push(...o.seitenFehler); await o.q.close();
    }
    zeile('E  keine Seitenfehler', fehlerAlle.join(' | ') || 'keine', 'keine');
  } finally { await b.close(); tisch.s.close(); }
  console.log(fehler ? '\nABWEICHUNG: ' + fehler : '\nALLES WIE VEREINBART — keine Abweichung.');
  console.log('Chromium. Ob es schön und ruhig genug ist, entscheidet Peter am iPad.');
  process.exit(fehler ? 1 : 0);
})().catch(e => { console.log('UNGEPRÜFT: ' + e.stack); process.exit(2); });
