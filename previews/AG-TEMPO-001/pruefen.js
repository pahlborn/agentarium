/* AG-TEMPO-001 — Nachweis: der Tempowähler beschleunigt die WIEDERGABE,
   nicht die Anzeige eines Wortes.

   Start:  node previews/AG-TEMPO-001/pruefen.js
   Eigener Browser:  AG_CHROMIUM=/pfad/zur/datei node previews/...

   Rückgabe 0 = alles wie vereinbart, 1 = Abweichung, 2 = ungeprüft.

   WARUM ES DIESEN NACHWEIS GIBT, und warum er nicht am Schild misst:
   Der Regler setzt `tempo`, und `tempo` steht in `schritt` als Faktor an
   der Uhr (`zeit += dt * tempo`). Ein Nachweis, der nur die Aufschrift
   „10×" liest, belegt, dass ein Wort umgesprungen ist -- genau derselbe
   Fehler, der hier schon zweimal passiert ist: eine Klasse ohne Regel
   (agGhPuls, 21.10.) und `.open` an einem `div`. Gemessen wird deshalb
   `__agStand().zeit` gegen die WIRKLICHE Uhr.

   Peters Leiter: „2fach, 5 und 10?" -- dazu der Normalablauf. Vier
   Stufen, und die Stufen sind seine, nicht meine.                        */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');

const ZIEL = process.env.AG_ZIEL || path.join('pilot', 'github-live');
const WURZEL = path.resolve(__dirname, '..', '..', ...ZIEL.split('/'));
let fehler = 0;
function zeile(w, ist, soll) {
  const ok = ist === soll;
  if (!ok) fehler++;
  console.log('  ' + (ok ? 'ok  ' : 'FEHL') + '  ' + w.padEnd(40) + String(ist).padEnd(22) +
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
  console.log('AG-TEMPO-001 — Nachweis des Tempowählers');
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
  try {
    const q = await b.newContext({ viewport: { width: 1194, height: 834 } });
    const s = await q.newPage();
    const konsole = [];
    s.on('console', m => { if (m.type() === 'error') konsole.push(m.text()); });
    s.on('pageerror', e => konsole.push(String(e)));
    await s.goto(adr, { waitUntil: 'load' });
    await s.waitForTimeout(1200);

    if (!(await s.evaluate(() => typeof window.__agStand === 'function')))
      ungeprueft('kein __agStand — ohne WebGL läuft die Maschine nicht');

    /* ----------------------------------------------- A: Der Regler ist da */
    console.log('A — Der Wähler steht dort, wo es etwas zu beschleunigen gibt');
    console.log('    erwartet: sichtbar in der Demo, vier Stufen, Normalablauf ab Werk\n');
    const r = await s.evaluate(() => {
      const t = document.getElementById('agTempo');
      const i = document.getElementById('agSchnell');
      return { da: !!t, verborgen: t ? t.hidden : null,
               modus: document.body.getAttribute('data-modus'),
               min: i ? i.min : null, max: i ? i.max : null,
               wert: i ? i.value : null,
               wort: t ? (t.querySelector('label b') || {}).textContent : null };
    });
    zeile('Betriebsart ab Werk', r.modus, 'demo');
    zeile('die Zeile ist angelegt', r.da, true);
    zeile('und sichtbar', r.verborgen, false);
    zeile('vier Stufen (0 bis 3)', r.min + '..' + r.max, '0..3');
    zeile('ab Werk auf Normalablauf', r.wert, '0');
    zeile('und sagt das auch', r.wort, '1×');

    /* --------------------------------------- B: Die Uhr geht wirklich schneller

       ERSTER ANLAUF WAR FALSCH, und zwar meine Behauptung, nicht der
       Regler. Ich hatte die Stueckuhr gegen die Rechneruhr gemessen und
       bei Stufe 0 einen Faktor von 1,0 erwartet. Gemessen wurden 0,38 bis
       0,40 -- bei exakt richtigen Verhaeltnissen (1 : 1,97 : 4,2 : 8,4
       beim ersten, 1 : 2,15 : 4,8 : 9,1 beim zweiten Lauf).

       URSACHE, nachgelesen statt vermutet: `dt` ist in der Bildschleife
       auf 0,05 s gedeckelt (`index.html`: `Math.min(0.05, ...)`). Die Uhr
       des Stuecks ist damit eine BILDUHR, keine Wanduhr -- bei sieben bis
       acht Bildern je Sekunde im kopflosen Browser bleibt sie zurueck.
       Der Deckel ist Absicht: Ohne ihn sprang das Stueck nach jeder
       Stockung weit nach vorn.

       UND DIE VERHAELTNISSE SCHWANKEN, je nach Last der Maschine. Hier
       hatte ich erst "unter Last unterlinear" als Entwurfseigenschaft
       hingeschrieben -- aus EINEM Lauf (1 : 1,97 : 4,2 : 8,4) eine
       Eigenschaft gemacht. Der naechste Lauf ergab 1 : 2,11 : 5,06 : 9,94,
       also praktisch genau die Leiter, und damit war die Behauptung
       widerlegt. Die Leiter ist nominell exakt; was abweicht, ist die
       Messung, nicht der Entwurf.

       Darum steht hier eine Schwelle und keine Spanne: geprueft wird, dass
       jede Stufe deutlich ueber der vorigen liegt und die hoechste
       mindestens das Fuenffache der ersten -- Aussagen, die bei beiden
       Laeufen halten. Eine enge Spanne haette den ersten Lauf
       durchfallen lassen und den zweiten bestehen, und das waere ein
       Nachweis, der vom Wetter abhaengt.

       NEBENBEFUND FUER PETER: Auf einem langsamen Geraet laeuft ein
       Archivstueck langsamer als seine nominelle Dauer. "480 s bei 10x
       sind 48 s" gilt, solange das Geraet mitkommt. */
    console.log('\nB — Die Uhr des Stücks geht wirklich schneller');
    console.log('    erwartet: streng steigend, je Stufe mindestens das 1,5fache');
    console.log('              der vorigen, und die höchste mindestens 5× die erste\n');

    async function faktor(stufe) {
      await s.evaluate((n) => {
        const i = document.getElementById('agSchnell');
        i.value = String(n);
        i.dispatchEvent(new Event('input', { bubbles: true }));
      }, stufe);
      await s.waitForTimeout(300);            /* ein Bild im neuen Tempo */
      const a0 = await s.evaluate(() => ({ z: window.__agStand().zeit, w: performance.now() }));
      await s.waitForTimeout(1500);
      const a1 = await s.evaluate(() => ({ z: window.__agStand().zeit, w: performance.now() }));
      const echt = (a1.w - a0.w) / 1000;
      return { f: (a1.z - a0.z) / echt, echt: echt };
    }

    const STUFEN = [[0, 1], [1, 2], [2, 5], [3, 10]];
    const gemessen = [];
    for (const [stufe, soll] of STUFEN) {
      const m = await faktor(stufe);
      gemessen.push(m.f);
      const wort = await s.evaluate(() =>
        (document.querySelector('#agTempo label b') || {}).textContent);
      console.log('        Stufe ' + stufe + ' (' + soll + '×): ' +
                  m.f.toFixed(3) + ' Stücksekunden je Sekunde, über ' +
                  m.echt.toFixed(2) + ' s gemessen');
      zeile('das Schild sagt ' + soll + '×', wort, soll + '×');
    }
    /* Stufe 0 ist die eigene Grundlinie DIESER Maschine, nicht die Eins. */
    const grund = gemessen[0];
    zeile('Stufe 0 bewegt die Uhr überhaupt', grund > 0, true);
    console.log('        Verhältnisse gegen Stufe 0: ' +
                gemessen.map(f => (f / grund).toFixed(2) + '×').join(' · ') +
                '   (nominell 1 · 2 · 5 · 10)');
    for (let i = 1; i < gemessen.length; i++)
      zeile('Stufe ' + i + ' ist mindestens 1,5× Stufe ' + (i - 1),
            gemessen[i] >= gemessen[i - 1] * 1.5, true);
    zeile('die höchste Stufe ist mindestens 5× die erste',
          gemessen[3] >= grund * 5, true);
    /* Die Gegenprobe zum Messgerät: Wäre `tempo` ohne Wirkung, wären
       alle vier Zahlen gleich — dann fielen die Zeilen oben. Wäre die
       Ordnung verdreht, fällt diese. */
    zeile('streng steigend',
          gemessen.every((f, i) => i === 0 || f > gemessen[i - 1]), true);

    /* ------------------------------------- C: Nicht im Livebetrieb
       Dort kommen die Ereignisse von aussen. Eine schnellere Uhr
       beschleunigt nichts, sie behauptet es nur -- dieselbe Regel, nach der
       es "Von vorn" im Livebetrieb nicht gibt. Und der Wechsel muss das
       Tempo MITNEHMEN: Ein unsichtbarer Regler, der weiter auf 10x steht,
       waere eine gestellte Uhr ohne Zeiger.                                */
    console.log('\nC — Im Livebetrieb gibt es den Wähler nicht');
    console.log('    erwartet: verborgen, und das Tempo zurück auf Normalablauf\n');
    await s.evaluate(() => {
      const li = document.querySelector('#agWasModi [data-modus="live"], [data-modus="live"]');
      if (li && li.click) li.click();
    });
    await s.waitForTimeout(900);
    const l = await s.evaluate(() => ({
      modus: document.body.getAttribute('data-modus'),
      verborgen: (document.getElementById('agTempo') || {}).hidden,
      wert: (document.getElementById('agSchnell') || {}).value,
      wort: (document.querySelector('#agTempo label b') || {}).textContent
    }));
    if (l.modus !== 'live') {
      console.log('        Umschalten nicht gelungen (Betriebsart ' + l.modus +
                  ') — Teil C nicht gemessen');
      fehler++;
      console.log('  FEHL  Teil C messbar                      nein                  (erwartet ja)');
    } else {
      zeile('Betriebsart', l.modus, 'live');
      zeile('die Zeile ist verborgen', l.verborgen, true);
      zeile('der Regler steht wieder auf Normalablauf', l.wert, '0');
      zeile('und sagt das auch', l.wort, '1×');
      /* Und die Uhr darf dort nicht mehr mit 10x laufen. */
      const a0 = await s.evaluate(() => ({ z: window.__agStand().zeit, w: performance.now() }));
      await s.waitForTimeout(1200);
      const a1 = await s.evaluate(() => ({ z: window.__agStand().zeit, w: performance.now() }));
      const f = (a1.z - a0.z) / ((a1.w - a0.w) / 1000);
      console.log('        Uhr im Livebetrieb: ' + f.toFixed(2) + '×');
      zeile('die Uhr läuft dort nicht beschleunigt', f <= 1.25, true);
    }

    zeile('Konsolenfehler', konsole.length ? konsole.slice(0, 2).join(' | ') : 'keine', 'keine');
  } finally {
    await b.close();
    srv.close();
  }

  if (fehler) { console.log('\nABWEICHUNG in ' + fehler + ' Prüfung(en).'); process.exit(1); }
  console.log('\nALLES WIE VEREINBART — keine Abweichung.');
  console.log('Der Wähler setzt `tempo`, und `tempo` wirkt auf die Uhr des');
  console.log('Stücks — gemessen an der Uhr selbst, nicht am Schild.');
  console.log('NICHT belegt: Wanduhrzeit. Die Stückuhr ist eine Bilduhr — dt ist');
  console.log('auf 0,05 s gedeckelt —, also hängt die absolute Dauer am Gerät.');
  console.log('NICHT belegt: ein Vorlauf. Den gibt es nicht; `schritt` ist eine');
  console.log('Bildfunktion, und ihn zu bauen heißt, Simulation und Anzeige zu');
  console.log('trennen. Peter vorgelegt, nicht geraten.');
  console.log('Synthetisch geprüft. Keine Abnahme auf Peters iPad.');
})().catch(e => { console.log('\nUNGEPRÜFT: ' + (e && e.stack || e)); process.exit(2); });
