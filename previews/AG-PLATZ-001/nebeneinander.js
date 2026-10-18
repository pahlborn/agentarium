/* AG-PLATZ-001 — Nebeneinander: tut die Platz-Probe der INSTALLIERTEN App etwas an?

   Der Nachweis in pruefen.js lief in einem frischen Browser, in dem die echte
   App nie installiert war. Gemessen war damit „die Probe meldet keinen Worker
   an" — NICHT „die Probe stört einen bereits installierten Worker und seinen
   Vorrat nicht". Auf Peters iPad ist die echte App aber installiert, und das
   ist der Fall, der zählt.

   Beide Fassungen werden hier aus EINEM Ursprung geliefert, an ihren echten
   Pfaden, damit die Geltungsbereiche stimmen:
     /github-live/   die laufende App, mit Worker
     /platz-probe/   die Probe, ohne Worker

   Start:  node previews/AG-PLATZ-001/nebeneinander.js
   Rückgabe 0 = unberührt, 1 = Abweichung, 2 = ungeprüft. */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const PILOT = path.resolve(__dirname, '..', '..', 'pilot');
let fehler = 0;
function zeile(w, ist, soll) {
  const ok = ist === soll;
  if (!ok) fehler++;
  console.log('  ' + (ok ? 'ok  ' : 'FEHL') + '  ' + w.padEnd(40) + String(ist).padEnd(22) +
              (ok ? '' : '(erwartet ' + soll + ')'));
}
function ausfuehrbareDatei(p) {
  if (!p) return false;
  try { const s = fs.statSync(p); if (!s.isFile()) return false;
        fs.accessSync(p, fs.constants.X_OK); return true; } catch (e) { return false; }
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
  console.log('AG-PLATZ-001 — Nebeneinander: Probe gegen INSTALLIERTE App\n');
  let chromium = null;
  try { chromium = require('playwright').chromium; } catch (e) {}
  const br = chromiumPfad(chromium);
  if (br.grund) {
    console.log('UNGEPRÜFT: ' + br.grund);
    console.log('Mit AG_CHROMIUM=/pfad/zur/ausfuehrbaren/datei angeben.');
    process.exit(2);
  }
  console.log('Browser: ' + br.pfad + '\n');

  const srv = http.createServer((q, a) => {
    const rein = decodeURIComponent(q.url.split('?')[0]);
    let f = path.join(PILOT, rein);
    if (rein.endsWith('/')) f = path.join(f, 'index.html');
    if (!f.startsWith(PILOT)) { a.writeHead(403).end(); return; }
    fs.readFile(f, (e, d) => {
      if (e) { a.writeHead(404).end(); return; }
      a.writeHead(200, { 'Content-Type': TYPEN[path.extname(f)] || 'application/octet-stream',
                         'Cache-Control': 'no-store' });
      a.end(d);
    });
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const basis = 'http://127.0.0.1:' + srv.address().port;

  const b = await chromium.launch({ executablePath: br.pfad,
                                    args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const q = await b.newContext({ viewport: { width: 1194, height: 834 } });

    /* ---- 1: Die echte App installieren, wie auf dem iPad ---- */
    console.log('1 — Die laufende App installiert sich (Worker + Vorrat)\n');
    const echt = await q.newPage();
    await echt.goto(basis + '/github-live/', { waitUntil: 'load' });
    /* Dem Worker Zeit geben, sich anzumelden UND den Vorrat zu fuellen. */
    await echt.waitForFunction(() => navigator.serviceWorker &&
      navigator.serviceWorker.controller !== null, null, { timeout: 20000 })
      .catch(() => {});
    await echt.waitForTimeout(2500);
    const vorher = await echt.evaluate(async () => {
      const n = await caches.keys();
      const c = n.length ? await caches.open(n[0]) : null;
      const k = c ? await c.keys() : [];
      const r = await navigator.serviceWorker.getRegistrations();
      return { vorraete: n, stuecke: k.length, worker: r.length,
               bedient: navigator.serviceWorker.controller !== null };
    });
    zeile('Vorrat angelegt', vorher.vorraete.join(',') || '(keiner)', 'agentarium-v51');
    zeile('Worker angemeldet', vorher.worker, 1);
    zeile('Seite wird von ihm bedient', vorher.bedient, true);
    zeile('Stücke im Vorrat (> 0)', vorher.stuecke > 0 ? 'ja, ' + vorher.stuecke : 'nein',
          'ja, ' + vorher.stuecke);
    /* Etwas in den Speicher der echten App legen, damit man sieht, ob es bleibt. */
    await echt.evaluate(() => {
      localStorage.setItem('agentarium-plaetze-v1', JSON.stringify({ atlas: { w: 123, n: 1.5 } }));
      localStorage.setItem('agentarium.hell', '42');
    });

    /* ---- 2: Die Probe öffnen und benutzen ---- */
    console.log('\n2 — Die Platz-Probe wird daneben geöffnet und benutzt\n');
    const probe = await q.newPage();
    const konsole = [];
    probe.on('pageerror', e => konsole.push(String(e)));
    await probe.goto(basis + '/platz-probe/', { waitUntil: 'load' });
    await probe.waitForTimeout(1200);
    const bedientP = await probe.evaluate(() =>
      navigator.serviceWorker ? navigator.serviceWorker.controller !== null : false);
    zeile('Probe von einem Worker bedient', bedientP, false);
    /* Ziehen, damit die Probe wirklich schreibt. */
    const WER = { forge: 5 };
    const m = await probe.$$eval('.agName', (e, i) => {
      const k = e[i].getBoundingClientRect();
      return { x: Math.round(k.x + k.width / 2), y: Math.round(k.y + k.height / 2) };
    }, WER.forge);
    await probe.mouse.move(m.x, m.y); await probe.mouse.down();
    for (let i = 1; i <= 10; i++) {
      await probe.mouse.move(m.x + (560 - m.x) * i / 10, m.y + (250 - m.y) * i / 10);
      await probe.waitForTimeout(16);
    }
    await probe.mouse.up();
    await probe.waitForTimeout(500);
    const pSchreibt = await probe.evaluate(() =>
      localStorage.getItem('agentarium-PROBE-plaetze-v1'));
    zeile('Probe hat in IHREN Schlüssel geschrieben', pSchreibt ? 'ja' : 'nein', 'ja');
    await probe.reload({ waitUntil: 'load' });
    await probe.waitForTimeout(1200);
    zeile('Konsolenfehler in der Probe', konsole.length ? konsole[0].slice(0, 40) : 'keine', 'keine');

    /* ---- 3: Ist die echte App unversehrt? ---- */
    console.log('\n3 — Die laufende App danach: unversehrt?\n');
    const nachher = await echt.evaluate(async () => {
      const n = await caches.keys();
      const c = n.length ? await caches.open(n[0]) : null;
      const k = c ? await c.keys() : [];
      const r = await navigator.serviceWorker.getRegistrations();
      return { vorraete: n, stuecke: k.length, worker: r.length,
               bedient: navigator.serviceWorker.controller !== null,
               plaetze: localStorage.getItem('agentarium-plaetze-v1'),
               hell: localStorage.getItem('agentarium.hell') };
    });
    zeile('Vorrat noch da', nachher.vorraete.join(',') || '(GELÖSCHT)', 'agentarium-v51');
    zeile('Stücke unverändert', nachher.stuecke, vorher.stuecke);
    zeile('Worker noch angemeldet', nachher.worker, 1);
    zeile('Seite noch bedient', nachher.bedient, true);
    zeile('Plätze der echten App unberührt',
          nachher.plaetze === JSON.stringify({ atlas: { w: 123, n: 1.5 } }) ? 'ja' : 'NEIN',
          'ja');
    zeile('Helligkeit der echten App unberührt', nachher.hell, '42');
    /* Und die echte App laedt weiter aus ihrem Vorrat. */
    await echt.reload({ waitUntil: 'load' });
    await echt.waitForTimeout(1200);
    const laeuftNoch = await echt.$$eval('.agName', e => e.length);
    zeile('echte App lädt weiter (Namen im Feld)', laeuftNoch, 9);

    await q.close();
  } finally { await b.close(); srv.close(); }

  console.log('');
  if (fehler) { console.log('ABWEICHUNG in ' + fehler + ' Prüfung(en).'); process.exit(1); }
  console.log('DIE PROBE TUT DER INSTALLIERTEN APP NICHTS AN — keine Abweichung.');
  console.log('Synthetisch in Chromium. Keine Abnahme auf Peters iPad.');
})().catch(e => { console.error('\nFEHLER im Prüflauf: ' + (e && e.message)); process.exit(1); });
