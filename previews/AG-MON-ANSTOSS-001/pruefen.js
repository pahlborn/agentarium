/* AG-MON-ANSTOSS-001 — jede Weitergabe einer Aufgabe ist als Ball sichtbar.

   Aufruf:            node previews/AG-MON-ANSTOSS-001/pruefen.js
   Eigener Browser:   AG_CHROMIUM=/pfad/zur/datei node previews/...
   Aufnahmen ablegen: AG_AUFNAHMEN=/verzeichnis node previews/...
                      (sonst ein Verzeichnis im Temp-Ordner, das genannt wird)
   Rueckgabe: 0 = bestanden, 1 = Abweichung, 2 = ungeprueft.

   PETERS ZIEL: Gibt er Atlas eine Aufgabe, sieht er im verbundenen Monitor
   zuerst einen Ball von sich zu Atlas, und am Ende fliegt das Ergebnis
   zurueck. Dasselbe gilt, wenn Atlas eine Aufgabe an einen Agenten weitergibt
   und dieser liefert.

   AM MONITOR WIRD NICHTS GEAENDERT. Einen Ball werfen schon heute `handoff`
   und `contribution` (beobachtete Kommunikation, AG-GH-LIVE-004). `assigned`
   legt nur die Aufgabe an und wirft bewusst keinen. Es fehlte eine
   Meldepflicht; sie steht in `handoffs/AG-EVENT-JOURNAL-001-anstoss-v1.md`.
   Dieser Nachweis spielt genau die dort vorgeschriebene Folge ein:

     A  vor dem Verbinden liegt schon ein Anstoss -> wird NICHT nachgespielt
     1  handoff      peter -> atlas      (der Anstoss)
     2  handoff      atlas -> forge      (die Weitergabe, der Ball)
        assigned     atlas -> forge      (legt die Aufgabe an, kein Ball)
     3  contribution forge -> atlas      (das Ergebnis zurueck)
     4  contribution atlas -> peter      (das Ergebnis an Peter)

   Je Ball eine Bildschirmaufnahme, aufgenommen WAEHREND des Flugs. Zaehler
   allein reichen nicht (Auftrag): Gemessen wird beides -- dass der Ball als
   fliegender Koerper mit Absender und Empfaenger existiert, und das Bild, auf
   dem man ihn sieht.

   WAS DIE BILDER AM 23.10. ZEIGTEN, und das steht hier, weil der Zaehler es
   nicht sagt: Ball 1 und 2 (`handoff`, Gestalt "Sonne") sind deutlich zu
   sehen. Ball 3 und 4 (`contribution`, Gestalt "Wurf") erscheinen nur als
   feiner Schweif, auch verlustfrei und mitten im Flug aufgenommen. Peter hat
   entschieden, dass Rueckgaben als Ball erscheinen sollen; das ist eine
   eigene Bildaenderung (AG-MON-RUECKGABE-001), nicht Teil dieses Auftrags,
   der `index.html` nicht anfasst. Erste Fassung: Die aufgeklappte
   GitHub-Tafel verdeckte das Feld -- Zaehler gruen, kein Ball im Bild.
   Deshalb klappt der Nachweis sie nach dem Verbinden zu.

   GRENZEN: Der Abruf ist eine Attrappe mit Scheintoken, kein Netzverkehr
   nach aussen. Die Koerper sind Proben dieses Nachweises, keine echten
   Auftraege. Keine Abnahme auf Peters Geraet. Ob Atlas die Regel befolgt,
   belegt dieser Nachweis nicht; er belegt, dass der Monitor sie zeigt.     */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os');

const ZIEL = process.env.AG_ZIEL || 'pilot/github-live';
const WURZEL = path.resolve(__dirname, '..', '..', ...ZIEL.split('/'));
const AUFNAHMEN = process.env.AG_AUFNAHMEN ||
  fs.mkdtempSync(path.join(os.tmpdir(), 'ag-mon-anstoss-'));
const LAUF = 'AG-MON-ANSTOSS-001', AUFGABE = 'AG-MON-ANSTOSS-001-PROBE';

let fehler = 0;
function zeile(w, ist, soll) {
  const ok = ist === soll;
  if (!ok) fehler++;
  console.log('  ' + (ok ? 'ok  ' : 'FEHL') + '  ' + w.padEnd(46) +
              String(ist).padEnd(22) + (ok ? '' : '(erwartet ' + soll + ')'));
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

/* Ein Kommentar, wie er auf Issue #2 laege -- mit genau dem Ereignis, das die
   Vertragsbeschreibung als Baustein vorgibt. Kennungen im Bereich 99..., damit
   sie mit keinem echten Kommentar zusammenfallen. */
let nr = 0;
function kommentar(ereignis) {
  nr++;
  const e = Object.assign({
    schema: 'agentarium.github-event.v1',
    id: LAUF + '-' + nr,
    project_id: 'agentarium',
    run_id: LAUF,
    task_id: AUFGABE,
    occurred_at: new Date().toISOString(),
    source_evidence: 'reported_checkpoint',
    source_tool_id: 'previews/AG-MON-ANSTOSS-001'
  }, ereignis);
  return {
    id: 9900000000 + nr,
    created_at: new Date().toISOString(),
    user: { login: 'pahlborn', id: 277496791 },
    body: '<!-- AGENTARIUM_EVENT_V1 -->\n```json\n' + JSON.stringify(e, null, 2) +
          '\n```\nProbe aus AG-MON-ANSTOSS-001, kein echter Auftrag.'
  };
}

const stand = (s) => s.evaluate(() => (window.__agStand && window.__agStand()) || {});

/* Wartet, bis ein Ball von `von` nach `an` fliegt, und nimmt ihn auf, sobald er
   ein gutes Stueck unterwegs ist. Alle anderen Flugbahnen, die dabei
   auftauchen, werden mitgezaehlt -- so faellt auf, wenn ein Ereignis einen
   Ball wirft, das keinen werfen soll. */
async function ballAufnehmen(s, von, an, datei) {
  const gesehen = new Set();
  let treffer = null;
  for (let i = 0; i < 150 && !treffer; i++) {
    await s.waitForTimeout(100);
    const st = await stand(s);
    for (const b of (st.fliegend || [])) {
      gesehen.add(b.von + '→' + b.an);
      if (b.von === von && b.an === an && b.u >= 0.3) treffer = b;
    }
  }
  let bild = null;
  if (treffer) {
    bild = path.join(AUFNAHMEN, datei);
    await s.screenshot({ path: bild, type: 'jpeg', quality: 72 });
  }
  /* Landen lassen, damit der naechste Schritt nur seinen eigenen Ball sieht. */
  for (let i = 0; i < 100; i++) {
    const st = await stand(s);
    for (const b of (st.fliegend || [])) gesehen.add(b.von + '→' + b.an);
    if (!(st.fliegend || []).length) break;
    await s.waitForTimeout(100);
  }
  return { treffer, bild, gesehen: [...gesehen] };
}

(async () => {
  console.log('AG-MON-ANSTOSS-001 — jede Weitergabe einer Aufgabe ist als Ball sichtbar\n');

  let chromium = null;
  try { chromium = require('playwright').chromium; } catch (e) {}
  const br = chromiumPfad(chromium);
  if (br.grund) ungeprueft(br.grund);
  let pwFassung = '(unbekannt)';
  try { pwFassung = require('playwright/package.json').version; } catch (e) {}
  console.log('PRÜFUMGEBUNG');
  console.log('  Node        : ' + process.version);
  console.log('  Playwright  : ' + pwFassung);
  console.log('  Chromium    : ' + br.pfad);
  console.log('  Kandidat    : ' + WURZEL);
  console.log('  Aufnahmen   : ' + AUFNAHMEN);
  console.log('  Fenster     : 1194x834 (iPad quer)');
  console.log('  Abruf       : Attrappe auf **api.github.com/**, Scheintoken');
  console.log('');
  fs.mkdirSync(AUFNAHMEN, { recursive: true });

  const b = await chromium.launch({ executablePath: br.pfad,
                                    args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const tisch = await tischen(WURZEL);
  try {
    const q = await b.newContext({ viewport: { width: 1194, height: 834 } });
    const s = await q.newPage();
    const seitenFehler = [];
    s.on('pageerror', e => seitenFehler.push(String(e.message).slice(0, 110)));
    let abrufe = 0;
    /* Schon beim Verbinden liegt ein Anstoss da: Er ist Geschichte. */
    let antwort = [kommentar({ kind: 'handoff', actor: 'peter', recipient: 'atlas',
      reporter: 'atlas', title: 'Liegt schon vor dem Verbinden da (darf nicht fliegen).' })];
    await s.route('**api.github.com/**', r => {
      abrufe++;
      r.fulfill({ status: 200, contentType: 'application/json',
                  headers: { ETag: 'W/"ag-mon-anstoss-' + abrufe + '"' },
                  body: JSON.stringify(antwort) });
    });
    await s.goto(tisch.adr + '?live=github', { waitUntil: 'load' });
    await s.waitForTimeout(2200);
    if (!await s.evaluate(() => !!document.getElementById('agGhToken')))
      ungeprueft('kein Livefach — ohne WebGL kein Monitor');
    await s.fill('#agGhToken', 'AGMONANSTOSS001_Scheintoken_0123456789');
    await s.click('#agGhAn');
    await s.waitForTimeout(3500);
    /* DIE TAFEL ZUKLAPPEN, wie Peter es nach dem Verbinden tut. Aufgeklappt
       liegt sie mitten ueber dem Feld und verdeckt genau die Flugbahnen --
       gemessen am 23.10.: Zaehler "Ball fliegt", auf dem Bild kein Ball.
       Genau das Missverhaeltnis, vor dem der Auftrag warnt. */
    await s.evaluate(() => { const d = document.getElementById('agGhAuf'); if (d) d.open = false; });
    await s.waitForTimeout(300);

    /* ============================ A: ERST VERBINDEN, DANN SCHICKEN === */
    console.log('A — Was vor dem Verbinden da lag, wird nicht nachgespielt');
    console.log('    erwartet: kein Ball, nichts ausgegeben (Regel vom 21.10.)\n');
    const vor = await stand(s);
    zeile('GitHub-Tafel zugeklappt, Feld frei',
          await s.evaluate(() => { const d = document.getElementById('agGhAuf');
                                   return !!d && d.open === false; }), true);
    zeile('kein Ball aus der Zeit vor dem Verbinden', (vor.fliegend || []).length, 0);
    zeile('nichts davon ausgegeben', vor.ausgegeben || 0, 0);

    /* ======================================== B: DIE VIER BAELLE === */
    console.log('\nB — Anstoss, Weitergabe, Ergebnis, Abschluss: je ein Ball');
    console.log('    erwartet: vier Baelle in der Reihenfolge der Regel,');
    console.log('              `assigned` wirft keinen, je eine Aufnahme im Flug\n');
    const schritte = [
      { name: '1 Anstoß    peter → atlas', von: 'peter', an: 'atlas', datei: 'ball-1-peter-atlas.jpg',
        ereignisse: [{ kind: 'handoff', actor: 'peter', recipient: 'atlas', reporter: 'atlas',
                       title: 'Peter gibt Atlas die Aufgabe (Probe).' }] },
      { name: '2 Weitergabe atlas → forge', von: 'atlas', an: 'forge', datei: 'ball-2-atlas-forge.jpg',
        ereignisse: [{ kind: 'handoff', actor: 'atlas', recipient: 'forge', reporter: 'atlas',
                       title: 'Atlas gibt die Aufgabe an Forge weiter (Probe).' },
                     { kind: 'assigned', actor: 'atlas', recipient: 'forge', reporter: 'atlas',
                       item_type: 'task', title: 'Atlas vergibt die Aufgabe an Forge (Probe).' }] },
      { name: '3 Ergebnis   forge → atlas', von: 'forge', an: 'atlas', datei: 'ball-3-forge-atlas.jpg',
        ereignisse: [{ kind: 'contribution', actor: 'forge', recipient: 'atlas', reporter: 'forge',
                       title: 'Forge gibt das Ergebnis an Atlas zurück (Probe).' }] },
      { name: '4 Abschluss  atlas → peter', von: 'atlas', an: 'peter', datei: 'ball-4-atlas-peter.jpg',
        ereignisse: [{ kind: 'contribution', actor: 'atlas', recipient: 'peter', reporter: 'atlas',
                       title: 'Atlas gibt das Ergebnis an Peter (Probe).' }] }
    ];
    const bilder = [];
    for (const sch of schritte) {
      antwort = antwort.concat(sch.ereignisse.map(kommentar));
      const r = await ballAufnehmen(s, sch.von, sch.an, sch.datei);
      zeile(sch.name + ': Ball fliegt', !!r.treffer, true);
      zeile(sch.name + ': nur dieser Ball', r.gesehen.join(', '), sch.von + '→' + sch.an);
      zeile(sch.name + ': Aufnahme im Flug', !!(r.bild && fs.existsSync(r.bild)), true);
      if (r.bild) bilder.push(r.bild);
      if (sch.von === 'atlas' && sch.an === 'forge') {
        const st = await stand(s);
        const a = (st.aufgaben || []).filter(x => x.aufgabe === AUFGABE)[0] || null;
        zeile('  assigned legt die Aufgabe bei forge an', a ? a.wer : null, 'forge');
      }
    }

    /* ======================================= C: NICHTS VERLOREN === */
    console.log('\nC — Alles angekommen, nichts abgewiesen');
    console.log('    erwartet: fünf Ereignisse ausgegeben (4 Bälle + 1 assigned)\n');
    let fertig = await stand(s);
    for (let i = 0; i < 40 && (fertig.ausgegeben || 0) < 5; i++) {
      await s.waitForTimeout(250); fertig = await stand(s);
    }
    zeile('ausgegeben', fertig.ausgegeben || 0, 5);
    zeile('keine Seitenfehler', seitenFehler.length, 0);
    if (seitenFehler.length) console.log('        ' + seitenFehler.join('\n        '));
    console.log('\n  Aufnahmen:');
    for (const p of bilder) console.log('    ' + p);
    await q.close();
  } finally {
    await b.close();
    tisch.s.close();
  }

  if (fehler) { console.log('\nABWEICHUNG in ' + fehler + ' Prüfung(en).'); process.exit(1); }
  console.log('\nALLES WIE VEREINBART — keine Abweichung.');
  console.log('Scheintoken, kein Netz, Probekörper. Belegt, dass der Monitor die');
  console.log('Folge zeigt — nicht, dass Atlas sie meldet, und keine Abnahme am iPad.');
})().catch(e => { console.log('\nUNGEPRÜFT: ' + (e && e.stack || e)); process.exit(2); });
