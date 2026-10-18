/* AG-PLATZ-001 — Nachweis: Agenten lassen sich verschieben, und zwar so,
   dass es das Neuladen und das Drehen übersteht.

   Start:  node previews/AG-PLATZ-001/pruefen.js
   Eigener Browser:  AG_CHROMIUM=/pfad/zur/datei node previews/...

   Rückgabe 0 = alles wie vereinbart, 1 = Abweichung, 2 = ungeprüft. */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');

const WURZEL = path.resolve(__dirname, '..', '..', 'pilot', 'github-live');
let fehler = 0;
function zeile(w, ist, soll) {
  const ok = ist === soll;
  if (!ok) fehler++;
  console.log('  ' + (ok ? 'ok  ' : 'FEHL') + '  ' + w.padEnd(34) + String(ist).padEnd(26) +
              (ok ? '' : '(erwartet ' + soll + ')'));
}

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

(async () => {
  console.log('AG-PLATZ-001 — Nachweis des Verschiebens');
  console.log('Geprüft wird: ' + WURZEL + '\n');

  let chromium = null;
  try { chromium = require('playwright').chromium; } catch (e) {}
  const browser = chromiumPfad(chromium);
  if (browser.grund) {
    console.log('UNGEPRÜFT: ' + browser.grund);
    console.log('Mit AG_CHROMIUM=/pfad/zur/ausfuehrbaren/datei angeben.');
    process.exit(2);
  }
  console.log('Browser: ' + browser.pfad + '\n');

  const srv = http.createServer((q, a) => {
    const rein = decodeURIComponent(q.url.split('?')[0]);
    const f = path.join(WURZEL, rein === '/' ? 'index.html' : rein);
    if (!f.startsWith(WURZEL)) { a.writeHead(403).end(); return; }
    fs.readFile(f, (e, d) => {
      if (e) { a.writeHead(404).end(); return; }
      a.writeHead(200, { 'Content-Type': TYPEN[path.extname(f)] || 'application/octet-stream' });
      a.end(d);
    });
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const adr = 'http://127.0.0.1:' + srv.address().port + '/';

  const b = await chromium.launch({ executablePath: browser.pfad,
                                    args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  /* Die Schilder wechseln sich mit der Rolle ab (rolleUhr). Über den Text
     gewählt findet man sie deshalb nur in der Hälfte der Zeit. Gewählt wird
     über die Reihenfolge, in der AGENTEN sie anlegt:
     0 peter, 1 nova, 2 atlas, 3 cadence, 4 scout, 5 forge, 6 sentinel,
     7 archibald, 8 argus. */
  const WER = { peter: 0, nova: 1, atlas: 2, cadence: 3, scout: 4,
                forge: 5, sentinel: 6, archibald: 7, argus: 8 };
  async function mitte(seite, name) {
    const r = await seite.$$eval('.agName', (e, i) => {
      const k = e[i].getBoundingClientRect();
      return { x: Math.round(k.x + k.width / 2), y: Math.round(k.y + k.height / 2) };
    }, WER[name]);
    return r;
  }

  try {
    /* ---------------------------------------------------- A: Entkopplung */
    console.log('A — Ort und Bedeutung getrennt (ohne Zug)');
    console.log('    erwartet: nur peter ist „aussen", und das hängt nicht mehr an nah\n');
    const q = await b.newContext({ viewport: { width: 1194, height: 834 } });
    const s = await q.newPage();
    const konsole = [];
    s.on('console', m => { if (m.type() === 'error') konsole.push(m.text()); });
    s.on('pageerror', e => konsole.push(String(e)));
    await s.goto(adr, { waitUntil: 'load' });
    await s.waitForTimeout(900);

    const draussen = await s.$$eval('.agName.agDraussen', e => e.map(x => x.textContent));
    zeile('als draußen gezeichnet', draussen.join(',') || '(keine)', 'peter');
    const anzahl = await s.$$eval('.agName', e => e.length);
    zeile('Namen im Feld', anzahl, 9);
    const knopfVor = await s.$eval('#agPlatz', e => e.hidden);
    zeile('Knopf „Plätze zurück" verborgen', knopfVor, true);

    /* ------------------------------------------------------- B: Ziehen */
    console.log('\nB — Ziehen, Merken, Neuladen, Zurückstellen');
    console.log('    erwartet: Platz wandert, übersteht Neuladen, Knopf stellt ihn zurück\n');

    const vor = await mitte(s, 'forge');

    const ziel = { x: 620, y: 230 };
    await s.mouse.move(vor.x, vor.y);
    await s.mouse.down();
    for (let i = 1; i <= 12; i++) {
      await s.mouse.move(vor.x + (ziel.x - vor.x) * i / 12,
                         vor.y + (ziel.y - vor.y) * i / 12);
      await s.waitForTimeout(16);
    }
    await s.mouse.up();
    await s.waitForTimeout(400);

    const nach = await mitte(s, 'forge');
    const gewandert = Math.abs(nach.x - vor.x) + Math.abs(nach.y - vor.y);
    zeile('forge ist gewandert (px)', gewandert > 60 ? 'ja, ' + gewandert : 'nein, ' + gewandert,
          'ja, ' + gewandert);
    zeile('nahe am Ziel (px Abstand)',
          Math.abs(nach.x - ziel.x) + Math.abs(nach.y - ziel.y) < 40 ? 'ja' : 'nein', 'ja');

    const abl = await s.evaluate(() => localStorage.getItem('agentarium-plaetze-v1'));
    let gespeichert = null;
    try { gespeichert = JSON.parse(abl); } catch (e) {}
    zeile('im Gerät gemerkt', gespeichert && gespeichert.forge ? 'ja, nur forge' : 'nein',
          'ja, nur forge');
    zeile('nichts anderes gemerkt', gespeichert ? Object.keys(gespeichert).join(',') : '-', 'forge');
    const knopfNach = await s.$eval('#agPlatz', e => e.hidden);
    zeile('Knopf erscheint', knopfNach, false);

    /* Neuladen */
    await s.reload({ waitUntil: 'load' });
    await s.waitForTimeout(900);
    const nachLaden = await mitte(s, 'forge');
    zeile('übersteht Neuladen (px Abw.)',
          Math.abs(nachLaden.x - nach.x) + Math.abs(nachLaden.y - nach.y) < 20 ? 'ja' : 'nein', 'ja');

    /* Drehen: Hochformat. Der Platz ist polar, also bleibt er sinnvoll. */
    await s.setViewportSize({ width: 834, height: 1194 });
    await s.waitForTimeout(700);
    const imBild = await s.$$eval('.agName', (e, g) => e.every(x => {
      const r = x.getBoundingClientRect();
      return r.left >= -2 && r.top >= -2 && r.right <= g.w + 2 && r.bottom <= g.h + 2;
    }), { w: 834, h: 1194 });
    zeile('nach dem Drehen alle im Bild', imBild, true);
    await s.setViewportSize({ width: 1194, height: 834 });
    await s.waitForTimeout(700);

    /* Zurückstellen */
    await s.click('#agPlatz');
    await s.waitForTimeout(500);
    const zurueck = await mitte(s, 'forge');
    zeile('Platz wieder wie ab Werk',
          Math.abs(zurueck.x - vor.x) + Math.abs(zurueck.y - vor.y) < 20 ? 'ja' : 'nein', 'ja');
    const ablLeer = await s.evaluate(() => localStorage.getItem('agentarium-plaetze-v1'));
    zeile('Ablage wieder leer', ablLeer === null ? 'ja' : 'nein, ' + ablLeer, 'ja');
    const knopfWeg = await s.$eval('#agPlatz', e => e.hidden);
    zeile('Knopf verschwindet', knopfWeg, true);

    /* ------------------------------- B2: Ablegen AUSSERHALB des Bandes ----
       Peters Befund vom 18.10.: „der Agent bleibt nicht genau dort liegen,
       wo ich ihn ablege, manchmal sucht er sich einen anderen Ort."
       Zwei Ursachen, beide gemessen und behoben:
         - die Klemmung ins Band zog ein selbst hingelegtes Schild zurueck
           (abgelegt bei x=1130 landete es bei 822, bei x=90 bei 374)
         - die obere Grenze fuer `nah` war mit 2,2 geraten; die Ecken eines
           1194x834-Fensters brauchen bis 2,56 */
    console.log('\nB2 — Ablegen außerhalb des Bandes, und Ruhe danach');
    console.log('    erwartet: liegt genau dort, auch rechts in der Kopfspalte');
    console.log('              und links in der Liste; wandert danach nicht\n');

    async function ablegen(name, zx, zy) {
      const m = await mitte(s, name);
      await s.mouse.move(m.x, m.y); await s.mouse.down();
      for (let i = 1; i <= 12; i++) {
        await s.mouse.move(m.x + (zx - m.x) * i / 12, m.y + (zy - m.y) * i / 12);
        await s.waitForTimeout(16);
      }
      await s.mouse.up(); await s.waitForTimeout(400);
      const n2 = await mitte(s, name);
      return Math.abs(n2.x - zx) + Math.abs(n2.y - zy);
    }
    zeile('mitten im Band (Abw. px)', await ablegen('forge', 600, 420), 0);
    zeile('rechts in der Kopfspalte (Abw. px)', await ablegen('scout', 1130, 300), 0);
    zeile('links in der Liste (Abw. px)', await ablegen('nova', 90, 500), 0);

    /* Und bleibt es liegen, wenn das Schild zwischen Name und Rolle
       umschlaegt? Der Wechsel kommt je Agent alle 16 s, um 1,6 s versetzt;
       18 s treffen also mindestens einen. */
    const vorRuhe = await mitte(s, 'nova');
    await s.waitForTimeout(18000);
    const nachRuhe = await mitte(s, 'nova');
    zeile('nach 18 s unverändert (Abw. px)',
          Math.abs(nachRuhe.x - vorRuhe.x) + Math.abs(nachRuhe.y - vorRuhe.y), 0);

    /* Vor B3 zuruecksetzen -- SONST MISST DER TEST SICH SELBST.
       B2 legt `forge` auf (600,420). Legte B3 Peter auf (597,417), lagen
       zwei Schilder auf demselben Punkt, und der naechste Griff erwischte
       ueber elementFromPoint das obenaufliegende: gezogen wurde forge,
       Peter blieb liegen, gemeldet wurden 401 px Abweichung. Einzeln
       geprueft ist dieselbe Fahrt viermal fehlerfrei. Ein Messartefakt,
       kein Produktfehler -- und das fuenfte an diesem Tag. */
    await s.click('#agPlatz'); await s.waitForTimeout(400);

    /* ------------------------------------------- B3: PETER, der Sonderfall --
       Peter ist der einzige mit `agDraussen`: gesperrte Schrift, deutlich
       breiteres Schild (73 px quer gegen 40 px bei `forge`), und seit der
       Entkopplung behaelt er das an jedem Ort. Er war genau der Fall, den
       der erste Nachweis NICHT pruefte -- und der erste, den Peter am
       echten Geraet anfasste. Nachgeholt am 18.10.

       Am aeussersten Rand bleibt eine Abweichung, und sie ist gewollt: die
       Fensterklemmung holt ein breites Schild so weit herein, dass es ganz
       sichtbar bleibt. Geprueft wird deshalb die SICHTBARKEIT, nicht die
       Punktgleichheit -- und in der Mitte, oben und unten die Punktgleichheit. */
    console.log('\nB3 — Peter, das breiteste Schild');
    console.log('    erwartet: mittig/oben/unten genau; am Rand ganz im Bild\n');
    const bp = await s.evaluate(() => {
      const e = document.querySelectorAll('.agName')[0];
      return { w: Math.round(e.getBoundingClientRect().width), k: e.className };
    });
    zeile('Peter trägt agDraussen', /agDraussen/.test(bp.k), true);
    zeile('Mitte (Abw. px)', await ablegen('peter', 597, 417), 0);
    zeile('oben (Abw. px)', await ablegen('peter', 597, 16), 0);
    zeile('unten (Abw. px)', await ablegen('peter', 597, 818), 0);
    await ablegen('peter', 1164, 250);
    const randR = await s.evaluate(() => {
      const k = document.querySelectorAll('.agName')[0].getBoundingClientRect();
      return k.right <= innerWidth && k.left >= 0;
    });
    zeile('rechter Rand: ganz im Bild', randR, true);
    await ablegen('peter', 22, 584);
    const randL = await s.evaluate(() => {
      const k = document.querySelectorAll('.agName')[0].getBoundingClientRect();
      return k.left >= 0 && k.right <= innerWidth;
    });
    zeile('linker Rand: ganz im Bild', randL, true);

    /* Zuruecksetzen, damit Teil C von der Werksstellung ausgeht. */
    await s.click('#agPlatz'); await s.waitForTimeout(400);

    /* ------------------------------------------------- C: Tipp bleibt Tipp */
    console.log('\nC — Tippen öffnet weiter den Steckbrief');
    console.log('    erwartet: ein Tipp unter der Schwelle wird nicht als Zug gelesen\n');
    const t = await mitte(s, 'argus');
    await s.mouse.move(t.x, t.y);
    await s.mouse.down();
    await s.mouse.move(t.x + 2, t.y + 1);   /* unter der Schwelle von 6 */
    await s.mouse.up();
    await s.waitForTimeout(400);
    const steckAuf = await s.evaluate(() => {
      const e = document.querySelector('.agSteck, #agSteck');
      return !!(e && e.classList.contains('auf'));
    });
    zeile('Steckbrief offen nach Tipp', steckAuf, true);
    const nachTipp = await s.evaluate(() => localStorage.getItem('agentarium-plaetze-v1'));
    zeile('Tipp hat nichts verschoben', nachTipp === null ? 'ja' : 'nein', 'ja');

    zeile('Konsolenfehler', konsole.length ? konsole.slice(0, 2).join(' | ') : 'keine', 'keine');

    await q.close();
  } finally {
    await b.close();
    srv.close();
  }

  console.log('');
  if (fehler) { console.log('ABWEICHUNG in ' + fehler + ' Prüfung(en).'); process.exit(1); }
  console.log('ALLES WIE VEREINBART — keine Abweichung.');
  console.log('Synthetisch geprüft. Keine Abnahme auf Peters iPad.');
})().catch(e => { console.error('\nFEHLER im Prüflauf: ' + (e && e.message)); process.exit(1); });
