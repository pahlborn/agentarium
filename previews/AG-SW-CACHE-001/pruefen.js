/* AG-SW-CACHE-001 — Nachweis: Die beiden Monitore loeschen sich nicht mehr
   gegenseitig den Vorrat.

   `feld/` und `pilot/github-live/` liegen auf GitHub Pages unter DERSELBEN
   Herkunft und teilen sich damit einen Vorratsspeicher (Cache Storage). Bis
   Fassung 89 (Pilot) bzw. 47 (Feld) loeschte jeder Arbeiter beim Aktivieren
   jeden Namen `agentarium-v*` ausser dem eigenen -- also auch den aktuellen
   Vorrat der anderen Variante (Befund Atlas, #95).

   Gemessen wird mit echten Arbeitern in Chromium, beide Varianten an ihren
   echten Pfaden unter einer Herkunft, wie auf Pages:
     /agentarium/feld/               mit feld/sw.js
     /agentarium/pilot/github-live/  mit pilot/github-live/sw.js
   Eine reine Namenspruefung waere kein Nachweis (#95).

   A  Gegenprobe am bekannt-schlechten Fall: die ALTEN Arbeiter (Kopien unter
      alt/, unveraendert aus main 2161e8f). Der Fehler muss hier sichtbar
      werden -- sonst ist der Nachweis blind und B beweist nichts.
   B  Migration vom alten auf den neuen Stand, mit gepflanzten Altvorraeten:
      eigene alte werden geraeumt, fremde, gemischte und leere bleiben, ein
      fremder Kontrollvorrat bleibt immer.
   C  Wechselnde Aktivierung und Aktualisierung je einer Variante.
   D  Ohne Netz: beide Seiten kommen aus dem Vorrat. Gegenprobe: eine nicht
      vorgehaltene Datei kommt offline NICHT.
   E  Kein Neuladen einer offenen Seite, waehrend die andere Variante oder
      sie selbst aktualisiert wird.

   Nicht gemessen: das iPad (Safari, Hoch/Quer, ohne Hover). Chromium ist
   nicht WebKit; die Geraetepruefung bleibt offen.

   Start:  node previews/AG-SW-CACHE-001/pruefen.js
   Eigener Browser:  AG_CHROMIUM=/pfad/zur/datei node previews/...
   Rueckgabe 0 = alles wie vereinbart, 1 = Abweichung, 2 = ungeprueft. */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');

const WURZEL = path.resolve(__dirname, '..', '..');
const ALT = path.join(__dirname, 'alt');
const PFAD = { feld: '/agentarium/feld/', pilot: '/agentarium/pilot/github-live/' };
const QUELLE = { feld: path.join(WURZEL, 'feld'),
                 pilot: path.join(WURZEL, 'pilot', 'github-live') };

/* Die Namen werden AUS sw.js GELESEN, nicht hier wiederholt (dieselbe Lehre
   wie in AG-PLATZ-001/nebeneinander.js): Eine festgeschriebene 90 waere bei
   der naechsten Fassung falsch. */
function namen(datei) {
  const t = fs.readFileSync(datei, 'utf8');
  const e = /const EIGEN = '([^']+)';/.exec(t);
  const v = /const VORRAT = EIGEN \+ '(\d+)';/.exec(t);
  return (e && v) ? { text: t, eigen: e[1], nr: Number(v[1]), vorrat: e[1] + v[1] } : null;
}
const NEU = { feld: namen(path.join(QUELLE.feld, 'sw.js')),
              pilot: namen(path.join(QUELLE.pilot, 'sw.js')) };
/* Eine Folgefassung, nur fuer C: derselbe Arbeiter mit erhoehter Nummer. */
function folge(v) {
  return v.text.replace("const VORRAT = EIGEN + '" + v.nr + "';",
                        "const VORRAT = EIGEN + '" + (v.nr + 1) + "';");
}

let fehler = 0;
function zeile(w, ist, soll) {
  const ok = ist === soll;
  if (!ok) fehler++;
  console.log('  ' + (ok ? 'ok  ' : 'FEHL') + '  ' + w.padEnd(52) + String(ist).padEnd(10) +
              (ok ? '' : '(erwartet ' + soll + ')'));
}
function ungeprueft(grund) { console.log('\nUNGEPRÜFT: ' + grund); process.exit(2); }
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
  console.log('AG-SW-CACHE-001 — Die beiden Monitore und ihr gemeinsamer Vorratsspeicher\n');
  if (!NEU.feld || !NEU.pilot)
    ungeprueft('sw.js nennt kein `EIGEN` + `VORRAT` in der erwarteten Form');
  for (const d of ['feld-sw-v47.js', 'pilot-sw-v89.js'])
    if (!fs.existsSync(path.join(ALT, d))) ungeprueft('Vorlage fehlt: alt/' + d);
  let chromium = null;
  try { chromium = require('playwright').chromium; } catch (e) {}
  const br = chromiumPfad(chromium);
  if (br.grund) ungeprueft(br.grund);
  console.log('Browser: ' + br.pfad);
  console.log('Vorrat laut sw.js: ' + NEU.pilot.vorrat + ' · ' + NEU.feld.vorrat + '\n');

  /* ---- Der Server: eine Herkunft, zwei Varianten, umschaltbare Arbeiter ---- */
  const arbeiter = { feld: null, pilot: null };   /* Text von sw.js, null = aus dem Baum */
  let netz = true;
  const srv = http.createServer((q, a) => {
    if (!netz) { q.socket.destroy(); return; }
    const rein = decodeURIComponent(q.url.split('?')[0]);
    if (rein === '/agentarium/leer.html') {
      a.writeHead(200, { 'Content-Type': TYPEN['.html'], 'Cache-Control': 'no-store' });
      a.end('<!doctype html><title>leer</title>'); return;
    }
    for (const v of ['feld', 'pilot']) {
      if (!rein.startsWith(PFAD[v])) continue;
      const rest = rein.slice(PFAD[v].length) || 'index.html';
      if (rest === 'sw.js' && arbeiter[v] !== null) {
        a.writeHead(200, { 'Content-Type': TYPEN['.js'], 'Cache-Control': 'no-store' });
        a.end(arbeiter[v]); return;
      }
      const f = path.join(QUELLE[v], rest);
      if (!f.startsWith(QUELLE[v])) { a.writeHead(403).end(); return; }
      fs.readFile(f, (e, d) => {
        if (e) { a.writeHead(404).end(); return; }
        a.writeHead(200, { 'Content-Type': TYPEN[path.extname(f)] || 'application/octet-stream',
                           'Cache-Control': 'no-store' });
        a.end(d);
      });
      return;
    }
    a.writeHead(404).end();
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const basis = 'http://127.0.0.1:' + srv.address().port;

  const b = await chromium.launch({ executablePath: br.pfad,
                                    args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const err = [];
  try {
    /* Eine Hilfsseite AUSSERHALB beider Geltungsbereiche: Sie liest und
       pflanzt Vorraete, ohne selbst von einem Arbeiter bedient zu werden. */
    async function hilfe(q) {
      const s = await q.newPage();
      await s.goto(basis + '/agentarium/leer.html');
      return s;
    }
    const liste = (s) => s.evaluate(async () => (await caches.keys()).sort());
    async function eintraege(s, n) {
      return s.evaluate(async (n) => (await caches.has(n))
        ? (await (await caches.open(n)).keys()).length : -1, n);
    }
    /* Warten auf einen Zustand des Speichers, nicht auf die Uhr. Bleibt er
       aus, entscheiden die Zeilen danach (sie werden FEHL). */
    async function bis(s, test, ms) {
      const t0 = Date.now();
      while (Date.now() - t0 < (ms || 20000)) {
        if (test(await liste(s))) return true;
        await new Promise(r => setTimeout(r, 100));
      }
      return false;
    }
    async function pflanzen(s, name, urls) {
      await s.evaluate(async ([name, urls]) => {
        const c = await caches.open(name);
        for (const u of urls) await c.put(u, new Response('gepflanzt ' + u));
      }, [name, urls]);
    }
    /* Variante oeffnen und ihren Arbeiter zum Aktualisieren anstossen. Die
       Seite bleibt offen und wird zurueckgegeben (fuer E). */
    async function oeffnen(q, v) {
      const s = await q.newPage();
      s.on('pageerror', e => err.push(v + ': ' + String(e)));
      await s.goto(basis + PFAD[v], { waitUntil: 'load' });
      await s.evaluate(async () => {
        const r = await navigator.serviceWorker.getRegistration();
        if (r) await r.update().catch(() => {});
      });
      return s;
    }
    const u = (v, d) => basis + PFAD[v] + d;

    /* ================= A: der alte Fehler, sichtbar gemacht ================= */
    console.log('A — Gegenprobe: die alten Arbeiter (Vorlage aus main 2161e8f)');
    arbeiter.feld = fs.readFileSync(path.join(ALT, 'feld-sw-v47.js'), 'utf8');
    arbeiter.pilot = fs.readFileSync(path.join(ALT, 'pilot-sw-v89.js'), 'utf8');
    {
      const q = await b.newContext({ viewport: { width: 1194, height: 834 } });
      const h = await hilfe(q);
      const p = await oeffnen(q, 'pilot');
      zeile('alter Pilot legt agentarium-v89 an',
            await bis(h, l => l.includes('agentarium-v89')), true);
      await p.close();
      const f = await oeffnen(q, 'feld');
      zeile('alter Feld legt agentarium-v47 an',
            await bis(h, l => l.includes('agentarium-v47')), true);
      /* Der eigentliche Befund: Das Aktivieren von Feld nimmt Pilot den
         Vorrat. Kommt hier "noch da", sieht dieser Nachweis den Fehler nicht. */
      await bis(h, l => !l.includes('agentarium-v89'), 5000);
      zeile('Fehler reproduziert: agentarium-v89 nach Feld weg',
            !(await liste(h)).includes('agentarium-v89'), true);
      await f.close();
      await q.close();
    }

    /* ============ B: Migration vom alten auf den neuen Stand ============ */
    console.log('\nB — Migration: eigene Altvorraete weg, alles andere bleibt');
    const q = await b.newContext({ viewport: { width: 1194, height: 834 } });
    const h = await hilfe(q);
    {
      /* Ausgangslage wie auf einem Geraet mit beiden alten Monitoren. Die
         Reihenfolge Pilot -> Feld laesst nach A nur v47 stehen; v89 wird
         danach gepflanzt, als haette Pilot zuletzt geladen. */
      const p = await oeffnen(q, 'pilot');
      await bis(h, l => l.includes('agentarium-v89'));
      await p.close();
      const f = await oeffnen(q, 'feld');
      await bis(h, l => l.includes('agentarium-v47'));
      await f.close();
      await pflanzen(h, 'agentarium-v89', [u('pilot', 'index.html'), u('pilot', 'sw-alt.txt')]);
      await pflanzen(h, 'agentarium-v88', [u('pilot', 'index.html')]);
      await pflanzen(h, 'agentarium-v46', [u('feld', 'index.html')]);
      await pflanzen(h, 'agentarium-v12', [u('pilot', 'index.html'), u('feld', 'index.html')]);
      await pflanzen(h, 'agentarium-v13', []);
      await pflanzen(h, 'fremd-kontrolle', [basis + '/andere-app/bild.png']);
      await pflanzen(h, 'agentarium-vorlage', [u('pilot', 'x')]);
      console.log('    vorher: ' + (await liste(h)).join(', '));
    }
    arbeiter.feld = null; arbeiter.pilot = null;     /* ab hier der Baum */
    let pilotSeite = await oeffnen(q, 'pilot');
    zeile('neuer Pilot legt ' + NEU.pilot.vorrat + ' an',
          await bis(h, l => l.includes(NEU.pilot.vorrat) && !l.includes('agentarium-v88')), true);
    {
      const l = await liste(h);
      zeile('eigener Altvorrat agentarium-v89 geraeumt', l.includes('agentarium-v89'), false);
      zeile('eigener Altvorrat agentarium-v88 geraeumt', l.includes('agentarium-v88'), false);
      zeile('Feld-Altvorrat agentarium-v47 bleibt (Feld noch alt)', l.includes('agentarium-v47'), true);
      zeile('Feld-Altvorrat agentarium-v46 bleibt', l.includes('agentarium-v46'), true);
      zeile('gemischter Altvorrat agentarium-v12 bleibt', l.includes('agentarium-v12'), true);
      zeile('leerer Altvorrat agentarium-v13 bleibt', l.includes('agentarium-v13'), true);
      zeile('fremder Kontrollvorrat bleibt', l.includes('fremd-kontrolle'), true);
      zeile('Name ausserhalb des Musters bleibt', l.includes('agentarium-vorlage'), true);
    }
    /* Die offene Pilotseite bekommt eine Marke; wird sie neu geladen, ist
       die Marke fort (E). */
    await pilotSeite.evaluate(() => { window.__agMarke = 'pilot-offen'; });

    let feldSeite = await oeffnen(q, 'feld');
    zeile('neuer Feld legt ' + NEU.feld.vorrat + ' an',
          await bis(h, l => l.includes(NEU.feld.vorrat) && !l.includes('agentarium-v47')), true);
    {
      const l = await liste(h);
      zeile('Aktivierung Feld erhaelt ' + NEU.pilot.vorrat, l.includes(NEU.pilot.vorrat), true);
      zeile('eigener Altvorrat agentarium-v47 geraeumt', l.includes('agentarium-v47'), false);
      zeile('eigener Altvorrat agentarium-v46 geraeumt', l.includes('agentarium-v46'), false);
      zeile('gemischter Altvorrat agentarium-v12 bleibt', l.includes('agentarium-v12'), true);
      zeile('leerer Altvorrat agentarium-v13 bleibt', l.includes('agentarium-v13'), true);
      zeile('fremder Kontrollvorrat bleibt', l.includes('fremd-kontrolle'), true);
      /* Nicht nur der Name: Der Vorrat muss gefuellt sein, sonst gibt es
         offline nichts zu bedienen. */
      zeile('Pilot-Vorrat gefuellt (Eintraege >= 3)', (await eintraege(h, NEU.pilot.vorrat)) >= 3, true);
      zeile('Feld-Vorrat gefuellt (Eintraege >= 3)', (await eintraege(h, NEU.feld.vorrat)) >= 3, true);
    }
    await feldSeite.evaluate(() => { window.__agMarke = 'feld-offen'; });

    /* ============ C: wechselnde Aktivierung und Aktualisierung ============ */
    console.log('\nC — Wechselnd: Pilot neu, Feld neu, Pilot erneut');
    const P2 = NEU.pilot.eigen + (NEU.pilot.nr + 1), F2 = NEU.feld.eigen + (NEU.feld.nr + 1);
    arbeiter.pilot = folge(NEU.pilot);
    const p2 = await oeffnen(q, 'pilot');
    zeile('Pilot-Folgefassung legt ' + P2 + ' an',
          await bis(h, l => l.includes(P2) && !l.includes(NEU.pilot.vorrat)), true);
    {
      const l = await liste(h);
      zeile('Vorgaenger ' + NEU.pilot.vorrat + ' geraeumt', l.includes(NEU.pilot.vorrat), false);
      zeile('Aktualisierung Pilot erhaelt ' + NEU.feld.vorrat, l.includes(NEU.feld.vorrat), true);
    }
    arbeiter.feld = folge(NEU.feld);
    const f2 = await oeffnen(q, 'feld');
    zeile('Feld-Folgefassung legt ' + F2 + ' an',
          await bis(h, l => l.includes(F2) && !l.includes(NEU.feld.vorrat)), true);
    {
      const l = await liste(h);
      zeile('Vorgaenger ' + NEU.feld.vorrat + ' geraeumt', l.includes(NEU.feld.vorrat), false);
      zeile('Aktualisierung Feld erhaelt ' + P2, l.includes(P2), true);
    }
    /* Noch einmal Pilot (gleicher Arbeiter, nur Seitenaufruf + update): Es
       darf nichts mehr verschwinden. */
    const p3 = await oeffnen(q, 'pilot');
    await new Promise(r => setTimeout(r, 1500));
    {
      const l = await liste(h);
      zeile('erneutes Oeffnen Pilot: ' + F2 + ' bleibt', l.includes(F2), true);
      zeile('erneutes Oeffnen Pilot: ' + P2 + ' bleibt', l.includes(P2), true);
      zeile('fremder Kontrollvorrat bleibt bis zuletzt', l.includes('fremd-kontrolle'), true);
    }
    for (const s of [p2, f2, p3]) await s.close();

    /* ===================== D: ohne Netz ===================== */
    console.log('\nD — Ohne Netz: beide Seiten aus dem Vorrat');
    netz = false;
    {
      /* Gegenprobe zuerst: Ist das Netz wirklich weg? Eine nicht
         vorgehaltene Datei darf NICHT kommen. Kaeme sie, maesse D nichts. */
      /* Je Aufruf eine frische Seite: Nach einer gescheiterten Navigation
         steht die Seite auf einer Fehlerseite, und der naechste Aufruf wird
         davon unterbrochen -- das maesse den Browser, nicht den Vorrat. */
      const s0 = await q.newPage();
      const r0 = await s0.goto(u('feld', 'nicht-vorgehalten.txt')).catch(() => null);
      zeile('Gegenprobe: nicht vorgehaltene Datei kommt nicht', !!(r0 && r0.ok()), false);
      await s0.close();
      for (const v of ['pilot', 'feld']) {
        const s = await q.newPage();
        const r = await s.goto(basis + PFAD[v], { waitUntil: 'load' }).catch(e => {
          console.log('    ' + v + ': ' + String(e).split('\n')[0]); return null; });
        zeile(v + ' laedt offline (Status 200)', r ? r.status() : 0, 200);
        zeile(v + ' kommt vom Arbeiter', r ? r.fromServiceWorker() : false, true);
        await s.close();
      }
    }
    netz = true;

    /* ============ E: keine offene Seite neu geladen ============ */
    console.log('\nE — Offene Seiten ueberstehen die Aktualisierungen');
    zeile('offene Pilotseite nicht neu geladen',
          await pilotSeite.evaluate(() => window.__agMarke || 'neu geladen'), 'pilot-offen');
    zeile('offene Feldseite nicht neu geladen',
          await feldSeite.evaluate(() => window.__agMarke || 'neu geladen'), 'feld-offen');
    zeile('keine Seitenfehler', err.length, 0);
    err.forEach(e => console.log('    ' + e));
    await q.close();
  } finally {
    await b.close();
    srv.close();
  }

  console.log('\nNicht gemessen: iPad Safari (WebKit), Hoch/Quer, ohne Hover -- bleibt offen.');
  if (fehler) {
    console.log('\n' + fehler + ' ABWEICHUNG' + (fehler > 1 ? 'EN' : '') + '.');
    process.exit(1);
  }
  console.log('\nAlles wie vereinbart.');
  process.exit(0);
})().catch(e => { console.log('\nUNGEPRÜFT: ' + (e && e.stack || e)); process.exit(2); });
