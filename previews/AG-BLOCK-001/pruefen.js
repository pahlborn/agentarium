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

  console.log('\nB — Die Griffe');
  console.log('    erwartet: jeder sichtbare Block hat einen Griff und er sitzt');
  console.log('              darauf; jeder unsichtbare hat keinen\n');
  const q = await b.newContext({ viewport: { width: 1194, height: 834 } });
  const s = await q.newPage();
  const err = [];
  s.on('pageerror', e => err.push(String(e)));
  await s.goto(n.adr, { waitUntil: 'load' });
  await s.waitForTimeout(1300);
  /* Nicht "sechs Griffe" pruefen -- die Bloecke erscheinen und verblassen,
     also waere jede feste Zahl beim naechsten Zustand falsch. Geprueft wird
     die Eigenschaft, nicht der Augenblick. */
  const griffe = await s.evaluate(ids => {
    let da = 0, fehlt = 0, falsch = 0, ueberzaehlig = 0;
    ids.forEach(id => {
      const e = document.getElementById(id);
      if (!e) return;
      const k = e.getBoundingClientRect();
      const sichtbar = k.width > 0 && k.height > 0 && !e.classList.contains('leise');
      const g = document.querySelector('#agGriffe [data-fuer="' + id + '"]');
      const gz = !!g && !g.hidden;
      if (sichtbar && !gz) fehlt++;
      else if (!sichtbar && gz) ueberzaehlig++;
      else if (sichtbar && gz) {
        da++;
        const gk = g.getBoundingClientRect();
        if (!(Math.abs(gk.left - k.left - 2) < 3 && Math.abs(gk.top - k.top - 2) < 3)) falsch++;
      }
    });
    return { da, fehlt, falsch, ueberzaehlig };
  }, BLOECKE);
  /* Die Erwartung steht hier als Zahl, nicht als Abschrift des Messwerts:
     eine Pruefung, die ihr Soll aus dem Ist baut, kann nicht fehlschlagen. */
  zeile('sichtbare Blöcke mit Griff (≥ 4)',
        griffe.da >= 4 ? 'ja, ' + griffe.da : 'nein, nur ' + griffe.da, 'ja, ' + griffe.da);
  zeile('sichtbar, aber ohne Griff', griffe.fehlt, 0);
  zeile('unsichtbar, aber mit Griff', griffe.ueberzaehlig, 0);
  zeile('Griff sitzt nicht auf dem Block', griffe.falsch, 0);

  console.log('\nC — Einen Block ziehen, und das Band folgt');
  console.log('    erwartet: „Was geschieht" liegt am Ziel, ist gemerkt, und');
  console.log('              der Ring nimmt den frei gewordenen Platz\n');
  const vorRing = await s.$$eval('.agName',
    e => Math.min.apply(null, e.map(x => x.getBoundingClientRect().left)));
  const g = await s.$('#agGriffe [data-fuer="agEcke"]');
  if (!g) ungeprueft('kein Griff für agEcke gefunden — Teil C nicht messbar');
  const gk = await g.boundingBox();
  const zx = 700, zy = 120;
  await s.mouse.move(gk.x + 11, gk.y + 11);
  await s.mouse.down();
  for (let i = 1; i <= 12; i++) {
    await s.mouse.move(gk.x + 11 + (zx - gk.x - 11) * i / 12,
                       gk.y + 11 + (zy - gk.y - 11) * i / 12);
    await s.waitForTimeout(16);
  }
  await s.mouse.up();
  await s.waitForTimeout(700);
  const ecke = await s.$eval('#agEcke', e => {
    const k = e.getBoundingClientRect();
    return { x: Math.round(k.left), y: Math.round(k.top) };
  });
  /* Der Griff sitzt 2 px innen, der Zug fasst ihn in der Mitte (11,11):
     der Block landet also rund 9 px links/oberhalb des Mauszeigers. 12 px
     Toleranz, damit die Klemmung am Fensterrand nicht als Fehler zaehlt. */
  const amZiel = Math.abs(ecke.x - (zx - 9)) <= 12 && Math.abs(ecke.y - (zy - 9)) <= 12;
  zeile('„Was geschieht" liegt am Ziel',
        amZiel ? 'ja, ' + ecke.x + ',' + ecke.y : 'nein, ' + ecke.x + ',' + ecke.y, 'ja, ' + ecke.x + ',' + ecke.y);
  const abl = await s.evaluate(k => localStorage.getItem(k), SCHLUESSEL);
  zeile('im Gerät gemerkt', abl && abl.indexOf('agEcke') > 0 ? 'ja' : 'nein', 'ja');
  const nachRing = await s.$$eval('.agName',
    e => Math.min.apply(null, e.map(x => x.getBoundingClientRect().left)));
  zeile('Ring nutzt den freigewordenen Platz',
        nachRing < vorRing - 10 ? 'ja, ' + Math.round(vorRing) + ' → ' + Math.round(nachRing)
                                : 'nein, ' + Math.round(vorRing) + ' → ' + Math.round(nachRing),
        'ja, ' + Math.round(vorRing) + ' → ' + Math.round(nachRing));
  zeile('Knopf „Plätze zurück" erscheint', await s.$eval('#agPlatz', e => e.hidden), false);

  console.log('\nD — Neuladen, Drehen, Zurückstellen');
  console.log('    erwartet: der Platz übersteht beides, und ein Knopf');
  console.log('              stellt alles wieder her\n');
  await s.reload({ waitUntil: 'load' });
  await s.waitForTimeout(1300);
  const nachLaden = await s.$eval('#agEcke', e => {
    const k = e.getBoundingClientRect();
    return { x: Math.round(k.left), y: Math.round(k.top) };
  });
  const bleibt = Math.abs(nachLaden.x - ecke.x) <= 2 && Math.abs(nachLaden.y - ecke.y) <= 2;
  zeile('übersteht Neuladen (Abw. px)',
        bleibt ? 'ja' : 'nein, ' + nachLaden.x + ',' + nachLaden.y + ' statt ' + ecke.x + ',' + ecke.y, 'ja');
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

  console.log('\nF — SICHTBAR OHNE HOVER (der Fehler vom 19.10.)');
  console.log('    Peter: „Ich kann nicht entdecken wo ich anfassen soll."');
  console.log('    Ein Finger hat kein :hover. Also messen, waehrend der');
  console.log('    Zeiger WOANDERS steht — und nicht auf dem Griff.\n');
  /* Der Zeiger muss weg von jedem Griff, sonst messe ich wieder den
     aufgeleuchteten Zustand, den es auf dem iPad nicht gibt. Mitte des
     Feldes, dort liegt kein Block. */
  await s.mouse.move(Math.round(1194/2), Math.round(834/2));
  await s.waitForTimeout(600);
  const sicht = await s.evaluate(() => {
    const g = document.querySelector('#agGriffe .agGriff:not([hidden])');
    if (!g) return { da: 0 };
    const cs = getComputedStyle(g);
    const schicht = getComputedStyle(document.getElementById('agGriffe'));
    const k = g.getBoundingClientRect();
    return { da: 1,
             deck: Math.round(parseFloat(cs.opacity) * 100),
             schichtDeck: Math.round(parseFloat(schicht.opacity) * 100),
             rand: cs.borderTopWidth,
             grund: cs.backgroundColor,
             kante: Math.round(k.width),
             unterZeiger: document.elementFromPoint(597, 417) === g };
  });
  zeile('ein Griff ist da', sicht.da ? 'ja' : 'nein', 'ja');
  zeile('Zeiger liegt NICHT auf dem Griff', sicht.unterZeiger === false ? 'ja' : 'nein', 'ja');
  zeile('Deckkraft des Griffs (≥ 90 %)', sicht.deck >= 90 ? 'ja, ' + sicht.deck + '%' : 'nein, nur ' + sicht.deck + '%', 'ja, ' + sicht.deck + '%');
  zeile('Deckkraft der Schicht (≥ 90 %)', sicht.schichtDeck >= 90 ? 'ja, ' + sicht.schichtDeck + '%' : 'nein, nur ' + sicht.schichtDeck + '%', 'ja, ' + sicht.schichtDeck + '%');
  zeile('trägt einen Rand', sicht.rand !== '0px' ? 'ja, ' + sicht.rand : 'nein', 'ja, ' + sicht.rand);
  zeile('trägt eine Platte, nicht nur Punkte',
        /rgba?\(/.test(sicht.grund) && !/, *0\)$/.test(sicht.grund) ? 'ja' : 'nein, ' + sicht.grund, 'ja');
  zeile('Kantenlänge (≥ 28 px)', sicht.kante >= 28 ? 'ja, ' + sicht.kante : 'nein, nur ' + sicht.kante, 'ja, ' + sicht.kante);
  /* Und die Kehrseite: nach langer Ruhe darf er verblassen -- der Monitor
     soll das Feld zeigen, nicht seine Bedienung. 12 s plus Luft. */
  await s.waitForTimeout(13000);
  const geruht = await s.evaluate(() =>
    document.getElementById('agGriffe').classList.contains('leise'));
  zeile('verblasst nach Ruhe', geruht, true);
  await s.mouse.move(600, 700);
  await s.waitForTimeout(500);
  const geweckt = await s.evaluate(() =>
    !document.getElementById('agGriffe').classList.contains('leise'));
  zeile('eine Berührung weckt ihn wieder', geweckt, true);

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
