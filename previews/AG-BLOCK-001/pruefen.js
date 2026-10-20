/* AG-BLOCK-001 — Nachweis: die Anzeigeblöcke lassen sich verschieben, und
   solange niemand zieht, ändert sich am Bild nichts.

   Start:  node previews/AG-BLOCK-001/pruefen.js
   Eigener Browser:   AG_CHROMIUM=/pfad/zur/datei node previews/...
   Andere Vergleichsfassung:  AG_VERGLEICH=origin/main node previews/...

   Rückgabe 0 = alles wie vereinbart, 1 = Abweichung, 2 = ungeprüft.

   Teil A ist das Versprechen an Peter: „Solange du keinen Block verschiebst,
   ändert sich am Bild gar nichts." Gemessen wird gegen die Fassung auf
   `origin/main` — nicht gegen eine Beschreibung davon. */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http'),
      os = require('os'), { execFileSync } = require('child_process');

const WURZEL = path.resolve(__dirname, '..', '..');
const ZIEL = path.join(WURZEL, 'pilot', 'github-live');
const VERGLEICH = process.env.AG_VERGLEICH || 'origin/main';
const SCHLUESSEL = 'agentarium-bloecke-v1';
const BLOECKE = ['agMarke', 'agEcke', 'agRechts', 'agWas', 'agWerkName', 'agTasten'];
let fehler = 0;
function zeile(w, ist, soll) {
  const ok = ist === soll;
  if (!ok) fehler++;
  console.log('  ' + (ok ? 'ok  ' : 'FEHL') + '  ' + w.padEnd(38) + String(ist).padEnd(22) +
              (ok ? '' : '(erwartet ' + soll + ')'));
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
  /* Erst der Starter, dann der Pfad -- ein eigener Browserpfad ersetzt den
     Pfad, nicht den Starter (AG-EVENT-ID-001, Argus R3). */
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

/* Die Vergleichsfassung kommt aus der Geschichte, nicht aus einer Kopie, die
   irgendwo liegt: nur `index.html` unterscheidet sich, alles andere wird vom
   Ziel uebernommen. Geht das nicht, ist Teil A ungeprueft -- und dann ist der
   ganze Lauf ungeprueft, denn Teil A ist das Versprechen. */
function vergleichsfassung() {
  const aus = fs.mkdtempSync(path.join(os.tmpdir(), 'ag-block-alt-'));
  fs.readdirSync(ZIEL).forEach(function (f) {
    const q = path.join(ZIEL, f);
    if (fs.statSync(q).isFile()) fs.copyFileSync(q, path.join(aus, f));
  });
  let alt;
  try {
    alt = execFileSync('git', ['show', VERGLEICH + ':pilot/github-live/index.html'],
                       { cwd: WURZEL, maxBuffer: 64 * 1024 * 1024 });
  } catch (e) {
    return { grund: 'Vergleichsfassung ' + VERGLEICH + ' nicht lesbar: ' +
                    String(e.message).split('\n')[0] };
  }
  fs.writeFileSync(path.join(aus, 'index.html'), alt);
  return { ort: aus };
}

(async () => {
  console.log('AG-BLOCK-001 — Nachweis des Blockverschiebens');
  console.log('Ziel: pilot/github-live   Vergleich: ' + VERGLEICH + '\n');

  let chromium = null;
  try { chromium = require('playwright').chromium; } catch (e) {}
  const br = chromiumPfad(chromium);
  if (br.grund) ungeprueft(br.grund);
  const alt = vergleichsfassung();
  if (alt.grund) ungeprueft(alt.grund);

  const b = await chromium.launch({ executablePath: br.pfad,
                                    args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const a = await tischen(alt.ort), n = await tischen(ZIEL);

  async function lage(adr, vp) {
    const q = await b.newContext({ viewport: vp });
    const s = await q.newPage();
    const err = [];
    s.on('pageerror', e => err.push(String(e)));
    await s.goto(adr, { waitUntil: 'load' });
    await s.waitForTimeout(1300);
    const r = await s.$$eval('.agName', e => e.map(x => {
      const k = x.getBoundingClientRect();
      return Math.round(k.x + k.width / 2) + ',' + Math.round(k.y + k.height / 2);
    }));
    await q.close();
    return { r, err };
  }

  console.log('A — OHNE ZUG darf sich nichts ändern (Versprechen an Peter)');
  console.log('    erwartet: dieselben Plätze wie ' + VERGLEICH + ', kein neuer Fehler\n');
  for (const vp of [{ width: 1194, height: 834 }, { width: 834, height: 1194 },
                    { width: 844, height: 390 }]) {
    const A = await lage(a.adr, vp), N = await lage(n.adr, vp);
    let abw = 0;
    A.r.forEach((v, i) => {
      const p = v.split(',').map(Number), q = (N.r[i] || '0,0').split(',').map(Number);
      abw = Math.max(abw, Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]));
    });
    const gleich = A.r.length === N.r.length && A.r.join('|') === N.r.join('|');
    zeile(vp.width + 'x' + vp.height + ': Namen gleiche Stelle',
          gleich ? 'ja' : 'NEIN, max ' + abw + ' px', 'ja');
    zeile(vp.width + 'x' + vp.height + ': Konsolenfehler neu',
          N.err.length ? N.err[0].slice(0, 34) : 'keine', 'keine');
  }

  const q = await b.newContext({ viewport: { width: 1194, height: 834 } });
  const s = await q.newPage();
  const err = [];
  s.on('pageerror', e => err.push(String(e)));
  await s.goto(n.adr, { waitUntil: 'load' });
  await s.waitForTimeout(1300);

  console.log('\nB — Die Griffe erscheinen NUR, wenn der Block dran ist');
  console.log('    erwartet: im Ruhezustand kein Griff zu sehen; angetippt');
  console.log('              erscheint das Dreieck in der Ecke des Blocks\n');
  /* Der Zeiger weg von allem, damit kein `:hover` einen Griff weckt. */
  await s.mouse.move(597, 417);
  await s.waitForTimeout(700);
  const ruhe = await s.evaluate(() => {
    let sichtbar = 0;
    document.querySelectorAll('#agGriffe .agGriff').forEach(g => {
      if (!g.hidden && parseFloat(getComputedStyle(g).opacity) > 0.05) sichtbar++;
    });
    return sichtbar;
  });
  zeile('im Ruhezustand sichtbare Griffe', ruhe, 0);

  /* Jeder Block, der sich lesen laesst, wird angetippt — das ist die Geste,
     die es auf dem iPad gibt. Danach MUSS sein Griff da sein, und zwar auch
     wenn der Zeiger danach woanders steht. */
  const antippbar = [['agMarke', 'agMarke'], ['agRechts', 'agKopf'], ['agWerkName', 'agWerkName']];
  for (const [block, wach] of antippbar) {
    await s.evaluate(id => document.getElementById(id).click(), wach);
    await s.mouse.move(597, 417);
    /* 800 ms, nicht 500: die Nachfuehrung laeuft im 250-ms-Takt und das
       Einblenden dauert 200 -- bei 500 ms erwischte die Messung einmal 79 %
       mitten im Verlauf. Das war mein Messfehler, nicht ein Fehler am Griff. */
    await s.waitForTimeout(800);
    const g = await s.evaluate(id => {
      const h = document.querySelector('#agGriffe [data-fuer="' + id + '"]');
      const e = document.getElementById(id);
      if (!h || h.hidden) return { da: 0 };
      const k = h.getBoundingClientRect(), b = e.getBoundingClientRect();
      const cs = getComputedStyle(h);
      return { da: 1, deck: Math.round(parseFloat(cs.opacity) * 100),
               ecke: Math.abs(k.left - b.left) < 3 && Math.abs(k.top - b.top) < 3,
               dreieck: (cs.clipPath || cs.webkitClipPath || '').indexOf('polygon') >= 0,
               kante: Math.round(k.width) };
    }, block);
    zeile(block + ': Griff erschienen', g.da ? 'ja' : 'nein', 'ja');
    zeile(block + ': sichtbar (≥ 80 %)', g.deck >= 80 ? 'ja, ' + g.deck + '%' : 'nein, ' + g.deck + '%',
          'ja, ' + g.deck + '%');
    zeile(block + ': in der Ecke des Blocks', g.ecke ? 'ja' : 'nein', 'ja');
    zeile(block + ': ist ein Dreieck', g.dreieck ? 'ja' : 'nein', 'ja');
  }
  /* Und die Gegenrichtung: der Lesezustand laeuft nach sechs Sekunden aus,
     danach ist das Bild wieder leer. */
  await s.waitForTimeout(6600);
  const wiederRuhe = await s.evaluate(() => {
    let sichtbar = 0;
    document.querySelectorAll('#agGriffe .agGriff').forEach(g => {
      if (!g.hidden && parseFloat(getComputedStyle(g).opacity) > 0.05) sichtbar++;
    });
    return sichtbar;
  });
  zeile('nach Ablauf wieder leer', wiederRuhe, 0);

  console.log('\nC — Einen Block ziehen, und das Band folgt');
  console.log('    erwartet: der Werkname liegt am Ziel, ist gemerkt, und');
  console.log('              der Ring nimmt den frei gewordenen Platz\n');
  const vorRing = await s.$$eval('.agName',
    e => Math.min.apply(null, e.map(x => x.getBoundingClientRect().left)));
  /* Erst wecken, dann fassen — genau die Reihenfolge, die ein Mensch geht. */
  await s.evaluate(() => document.getElementById('agWerkName').click());
  await s.waitForTimeout(400);
  const g = await s.$('#agGriffe [data-fuer="agWerkName"]');
  if (!g) ungeprueft('kein Griff für agWerkName gefunden — Teil C nicht messbar');
  const gk = await g.boundingBox();
  const fx = gk.x + gk.width / 4, fy = gk.y + gk.height / 4;   /* im Dreieck */
  const zx = 420, zy = 300;
  await s.mouse.move(fx, fy);
  await s.mouse.down();
  for (let i = 1; i <= 12; i++) {
    await s.mouse.move(fx + (zx - fx) * i / 12, fy + (fy > zy ? -1 : 1) * Math.abs(fy - zy) * i / 12);
    await s.waitForTimeout(16);
  }
  await s.mouse.up();
  await s.waitForTimeout(700);
  const ortC = await s.$eval('#agWerkName', e => {
    const k = e.getBoundingClientRect();
    return { x: Math.round(k.left), y: Math.round(k.top) };
  });
  const abw = Math.abs(ortC.x - (zx - gk.width / 4)) + Math.abs(ortC.y - (zy - gk.height / 4));
  zeile('Werkname liegt am Ziel (Abw. px)', abw <= 24 ? 'ja, ' + abw : 'nein, ' + abw, 'ja, ' + abw);
  const abl = await s.evaluate(k => localStorage.getItem(k), SCHLUESSEL);
  zeile('im Gerät gemerkt', abl && abl.indexOf('agWerkName') > 0 ? 'ja' : 'nein', 'ja');
  const nachRing = await s.$$eval('.agName',
    e => Math.min.apply(null, e.map(x => x.getBoundingClientRect().left)));
  zeile('Ring hat sich neu gerechnet',
        nachRing !== vorRing ? 'ja, ' + Math.round(vorRing) + ' → ' + Math.round(nachRing)
                             : 'nein, unverändert ' + Math.round(vorRing),
        'ja, ' + Math.round(vorRing) + ' → ' + Math.round(nachRing));
  zeile('Knopf „Plätze zurück" erscheint', await s.$eval('#agPlatz', e => e.hidden), false);

  console.log('\nD — Neuladen, Drehen, Zurückstellen');
  console.log('    erwartet: der Platz übersteht beides, und ein Knopf');
  console.log('              stellt alles wieder her\n');
  await s.reload({ waitUntil: 'load' });
  await s.waitForTimeout(1300);
  /* Geprueft wird der Block, der in Teil C gezogen wurde. Und zwar im
     RUHEZUSTAND: der Lesezustand vergroessert ihn (scale 1.28), ein Vergleich
     ueber das Neuladen hinweg misst sonst zwei verschiedene Maßstaebe. */
  const nachLaden = await s.$eval('#agWerkName', e => {
    const k = e.getBoundingClientRect();
    return { x: Math.round(k.left), y: Math.round(k.top) };
  });
  const bleibt = Math.abs(nachLaden.x - ortC.x) <= 3 && Math.abs(nachLaden.y - ortC.y) <= 3;
  zeile('übersteht Neuladen (Abw. px)',
        bleibt ? 'ja' : 'nein, ' + nachLaden.x + ',' + nachLaden.y + ' statt ' + ortC.x + ',' + ortC.y, 'ja');
  await s.setViewportSize({ width: 834, height: 1194 });
  await s.waitForTimeout(900);
  const imBild = await s.evaluate(ids => {
    let gut = 0, n = 0;
    ids.forEach(id => {
      const e = document.getElementById(id);
      if (!e) return;
      const k = e.getBoundingClientRect();
      if (!k.width) return;
      n++;
      if (k.left >= -2 && k.top >= -2 && k.right <= innerWidth + 2 && k.bottom <= innerHeight + 2) gut++;
    });
    return gut + '/' + n;
  }, BLOECKE);
  zeile('nach dem Drehen alle Blöcke im Bild', imBild, '6/6');
  await s.setViewportSize({ width: 1194, height: 834 });
  await s.waitForTimeout(900);
  /* Die Knoepfe verblassen nach einigen Sekunden und haben dann
     pointer-events:none. Erst aufwecken, dann klicken. */
  await s.mouse.move(600, 700);
  await s.waitForTimeout(500);
  await s.click('#agPlatz');
  await s.waitForTimeout(700);
  zeile('Zurückstellen leert die Ablage',
        (await s.evaluate(k => localStorage.getItem(k), SCHLUESSEL)) === null ? 'ja' : 'nein', 'ja');
  zeile('Knopf verschwindet', await s.$eval('#agPlatz', e => e.hidden), true);

  console.log('\nF — DER GRIFF WÄCHST MIT DEM FENSTER (Peters Befund vom 20.10.)');
  console.log('    „im Browser auf dem laptop sind die anfasser fast zu klein,');
  console.log('     im ipad jedoch zu groß. sie skalieren also nicht mit der');
  console.log('     anzeige." — also an zwei Fenstermaßen messen\n');
  async function kante(breite, hoehe) {
    await s.setViewportSize({ width: breite, height: hoehe });
    await s.waitForTimeout(600);
    await s.evaluate(() => document.getElementById('agMarke').click());
    await s.waitForTimeout(400);
    return await s.evaluate(() => {
      const h = document.querySelector('#agGriffe [data-fuer="agMarke"]');
      if (!h || h.hidden) return 0;
      return Math.round(h.getBoundingClientRect().width);
    });
  }
  const aufPad = await kante(1194, 834);
  const aufSchirm = await kante(1920, 1080);
  zeile('Kante bei 1194 (iPad quer)', aufPad > 0 ? 'ja, ' + aufPad : 'kein Griff', 'ja, ' + aufPad);
  zeile('Kante bei 1920 (Laptop)', aufSchirm > 0 ? 'ja, ' + aufSchirm : 'kein Griff', 'ja, ' + aufSchirm);
  zeile('wächst mit dem Fenster', aufSchirm > aufPad ? 'ja, +' + (aufSchirm - aufPad) + ' px'
                                                     : 'nein, ' + aufPad + ' → ' + aufSchirm,
        'ja, +' + (aufSchirm - aufPad) + ' px');
  /* Untergrenze: auf dem iPad muss genug zum Fassen bleiben. 20 px ist der
     Boden im Stylesheet; geprueft wird, dass er auch greift. */
  zeile('Untergrenze auf dem iPad (≥ 20 px)', aufPad >= 20 ? 'ja' : 'nein, ' + aufPad, 'ja');
  zeile('Obergrenze gehalten (≤ 34 px)', aufSchirm <= 34 ? 'ja' : 'nein, ' + aufSchirm, 'ja');
  await s.setViewportSize({ width: 1194, height: 834 });
  await s.waitForTimeout(500);

  console.log('\nE — Bedienen geht weiter');
  console.log('    erwartet: ein Griff nimmt dem Block nicht seinen Knopf\n');
  await s.mouse.move(600, 700);
  await s.waitForTimeout(400);
  await s.click('#agListe');
  await s.waitForTimeout(400);
  zeile('Knopf „Was geschieht" schaltet',
        await s.$eval('#agEcke', e => e.classList.contains('leise')), true);
  await s.click('#agListe');
  await s.waitForTimeout(400);
  zeile('Konsolenfehler', err.length ? err[0].slice(0, 40) : 'keine', 'keine');

  await q.close();
  await b.close();
  a.s.close();
  n.s.close();
  fs.rmSync(alt.ort, { recursive: true, force: true });
  console.log('');
  if (fehler) { console.log('ABWEICHUNG in ' + fehler + ' Prüfung(en).'); process.exit(1); }
  console.log('ALLES WIE VEREINBART — keine Abweichung.');
  console.log('Synthetisch geprüft. Keine Abnahme auf Peters iPad.');
})().catch(e => { console.error('FEHLER im Prüflauf: ' + e.message); process.exit(1); });
