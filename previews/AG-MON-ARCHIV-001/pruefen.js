/* AG-MON-ARCHIV-001 — ein echter Lauf aus GitHub, nachgespielt durch denselben Eingang.

   Aufruf:            node previews/AG-MON-ARCHIV-001/pruefen.js
   Eigener Browser:   AG_CHROMIUM=/pfad/zur/datei node previews/...
   Aufnahmen ablegen: AG_AUFNAHMEN=/verzeichnis node previews/...
   Rueckgabe: 0 = bestanden, 1 = Abweichung, 2 = ungeprueft.

   PETER, 25.10.: Wenn das Archiv funktioniert, lassen sich Aenderungen am
   Monitor ansehen, OHNE dass Atlas' Team dafuer neue Aufgaben erledigt.
   Versprechen: Ein nachgespielter Lauf steuert den Monitor wie live, weil er
   denselben Eingang nimmt (`zeigen` -> `__agEreignis`).

     A  nach dem Verbinden: zwei Laeufe in der Auswahl; der offene Ball des
        zweiten Laufs liegt (Schritt 1b), nichts fliegt
     B  Lauf 1 abspielen: Neubeginn (der Ball von Lauf 2 ist weg), dann die
        vier Baelle in der echten Reihenfolge, Peters Ball LIEGT bei atlas,
        solange der Lauf offen ist, und geht mit der Rueckgabe
     C  waehrend des Nachspielens kommt ein ECHTES neues Ereignis: es wird
        nicht hineingemischt
     D  "Zurueck zu live": der echte Stand ist wieder da (Ball von Lauf 2 und
        der zurueckgestellte neue Ball), ohne Flug
     E  Trennen und wieder verbinden in derselben Sitzung: alle Laeufe zur
        Auswahl, die Baelle liegen weiter und nicht doppelt

   GRENZEN: Attrappe mit Scheintoken, Probekoerper. Belegt das Abspielen im
   Monitor, keine Abnahme am iPad.                                          */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os');

const ZIEL = process.env.AG_ZIEL || 'pilot/github-live';
const WURZEL = path.resolve(__dirname, '..', '..', ...ZIEL.split('/'));
const AUFNAHMEN = process.env.AG_AUFNAHMEN ||
  fs.mkdtempSync(path.join(os.tmpdir(), 'ag-mon-archiv-'));
const L1 = 'AG-ARCHIV-PROBE-1', L2 = 'AG-ARCHIV-PROBE-2', L3 = 'AG-ARCHIV-PROBE-3';

let fehler = 0;
function zeile(w, ist, soll) {
  const ok = ist === soll;
  if (!ok) fehler++;
  console.log('  ' + (ok ? 'ok  ' : 'FEHL') + '  ' + w.padEnd(48) +
              String(ist).padEnd(26) + (ok ? '' : '(erwartet ' + soll + ')'));
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
/* Ein Kommentar wie auf #2. `zeit` ist die Ereigniszeit; der Kommentar ist
   zur selben Zeit angelegt, also vor dem Verbinden, wenn `zeit` vorbei ist. */
function kommentar(zeit, ereignis) {
  nr++;
  const e = Object.assign({
    schema: 'agentarium.github-event.v1', id: 'AG-ARCHIV-EREIGNIS-' + nr,
    project_id: 'agentarium', occurred_at: zeit,
    source_evidence: 'reported_checkpoint', source_tool_id: 'previews/AG-MON-ARCHIV-001'
  }, ereignis);
  return { id: 9920000000 + nr, created_at: zeit,
           user: { login: 'pahlborn', id: 277496791 },
           body: '<!-- AGENTARIUM_EVENT_V1 -->\n```json\n' + JSON.stringify(e, null, 2) +
                 '\n```\nProbe aus AG-MON-ARCHIV-001, kein echter Auftrag.' };
}
const stand = (s) => s.evaluate(() => (window.__agStand && window.__agStand()) || {});
const gh = (s) => s.evaluate(() => (window.__agGithub && window.__agGithub.stand()) || {});
const liegendText = (st) => (st.liegend || []).map(l => l.aufgabe + '@' + l.bei).sort().join(',');
const vor = (min) => new Date(Date.now() - min * 60000).toISOString();

(async () => {
  console.log('AG-MON-ARCHIV-001 — ein echter Lauf, nachgespielt durch denselben Eingang\n');
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
  try {
    const q = await b.newContext({ viewport: { width: 1194, height: 834 } });
    const s = await q.newPage();
    const seitenFehler = [];
    s.on('pageerror', e => seitenFehler.push(String(e.message).slice(0, 110)));
    /* Die Vorgeschichte: Lauf 1 ist abgeschlossen (5 Ereignisse, je etwa eine
       Minute auseinander), Lauf 2 hat einen offenen Ball bei nova. */
    let antwort = [
      kommentar(vor(30), { run_id: L1, task_id: 'A1', kind: 'handoff', actor: 'peter',
        recipient: 'atlas', reporter: 'atlas', title: 'Peter gibt Atlas A1 (Probe).' }),
      kommentar(vor(29), { run_id: L1, task_id: 'A1-F', kind: 'handoff', actor: 'atlas',
        recipient: 'forge', reporter: 'atlas', title: 'Atlas gibt Forge Arbeit an A1 (Probe).' }),
      kommentar(vor(28.9), { run_id: L1, task_id: 'A1-F', kind: 'assigned', actor: 'atlas',
        recipient: 'forge', reporter: 'atlas', title: 'Atlas vergibt A1-F an Forge (Probe).' }),
      kommentar(vor(28), { run_id: L1, task_id: 'A1-F', kind: 'contribution', actor: 'forge',
        recipient: 'atlas', reporter: 'forge', title: 'Forge gibt A1-F zurück (Probe).' }),
      kommentar(vor(27), { run_id: L1, task_id: 'A1', kind: 'contribution', actor: 'atlas',
        recipient: 'peter', reporter: 'atlas', title: 'Atlas gibt Peter A1 (Probe).' }),
      kommentar(vor(10), { run_id: L2, task_id: 'B1', kind: 'handoff', actor: 'peter',
        recipient: 'nova', reporter: 'atlas', title: 'Peter gibt B1, liegt bei nova (Probe).' })
    ];
    let abrufe = 0;
    await s.route('**api.github.com/**', r => {
      abrufe++;
      r.fulfill({ status: 200, contentType: 'application/json',
                  headers: { ETag: 'W/"ag-mon-archiv-' + abrufe + '"' },
                  body: JSON.stringify(antwort) });
    });
    await s.goto(tisch.adr + '?live=github', { waitUntil: 'load' });
    await s.waitForTimeout(2200);
    if (!await s.evaluate(() => !!document.getElementById('agGhToken')))
      ungeprueft('kein Livefach — ohne WebGL kein Monitor');
    await s.fill('#agGhToken', 'AGMONARCHIV001_Scheintoken_0123456789ab');
    await s.click('#agGhAn');
    await s.waitForTimeout(3500);
    const tafel = (offen) => s.evaluate(o => {
      const d = document.getElementById('agGhAuf'); if (d) d.open = o; }, offen);

    console.log('A — Nach dem Verbinden');
    let st = await stand(s), g = await gh(s);
    zeile('verbunden', g.phase, 'verbunden');
    zeile('zwei Läufe zur Auswahl', g.archiv ? g.archiv.laeufe : null, 2);
    zeile('Auswahlliste hat zwei Einträge',
          await s.evaluate(() => document.querySelectorAll('#agGhArchivWahl option').length), 2);
    zeile('offener Ball von Lauf 2 liegt (1b)', liegendText(st), 'B1@nova');
    zeile('nichts fliegt', (st.fliegend || []).length, 0);

    console.log('\nB — Lauf 1 abspielen');
    await tafel(true);
    await s.selectOption('#agGhArchivWahl', 'agentarium\u0001' + L1);
    await s.click('#agGhArchivAn');
    await tafel(false);
    await s.waitForTimeout(150);
    st = await stand(s);
    zeile('Neubeginn: der Ball von Lauf 2 ist weg', liegendText(st), '');
    /* C: waehrend des Nachspielens kommt ein echtes neues Ereignis. */
    antwort = antwort.concat([kommentar(new Date().toISOString(),
      { run_id: L3, task_id: 'C1', kind: 'handoff', actor: 'peter', recipient: 'scout',
        reporter: 'atlas', title: 'Echt neu während des Nachspielens (Probe).' })]);
    const folge = [], gesehen = new Set();
    let lagBeiAtlas = false, bild = false;
    for (let i = 0; i < 220; i++) {
      await s.waitForTimeout(100);
      st = await stand(s); g = await gh(s);
      for (const f of (st.fliegend || [])) {
        const k = f.von + '→' + f.an;
        if (!gesehen.has(k)) { gesehen.add(k); folge.push(k); }
      }
      if (liegendText(st) === 'A1@atlas') {
        lagBeiAtlas = true;
        if (!bild && (st.fliegend || []).some(f => f.von === 'atlas' && f.an === 'forge' && f.u > 0.3)) {
          await s.screenshot({ path: path.join(AUFNAHMEN, '1-archiv-ball-liegt-bei-atlas.jpg'),
                               type: 'jpeg', quality: 72 });
          bild = true;
        }
      }
      if (g.archiv && !g.archiv.laeuft && !(st.fliegend || []).length && i > 20) break;
    }
    zeile('vier Bälle in der echten Reihenfolge', folge.join(' '),
          'peter→atlas atlas→forge forge→atlas atlas→peter');
    zeile('Peters Ball lag bei atlas, solange der Lauf offen war', lagBeiAtlas, true);
    zeile('nach der Rückgabe liegt nichts mehr', liegendText(st), '');
    zeile('Aufnahme während des Nachspielens', bild, true);
    zeile('Tafel nennt das Nachspielen',
          /Neu \(Archiv\)/.test(await s.evaluate(() =>
            (document.getElementById('agGhLetztes') || {}).textContent || '')), true);

    console.log('\nC — Ein echtes neues Ereignis wird nicht hineingemischt');
    zeile('kein Flug peter→scout im Nachspielen', gesehen.has('peter→scout'), false);
    zeile('kein Ball bei scout im Nachspielen', /@scout/.test(liegendText(st)), false);
    g = await gh(s);
    zeile('Archivansicht steht noch', g.archiv ? g.archiv.ansicht : null, true);

    console.log('\nD — Zurück zu live');
    await tafel(true);
    await s.click('#agGhArchivZurueck');
    for (let i = 0; i < 80; i++) {
      await s.waitForTimeout(150);
      g = await gh(s); st = await stand(s);
      if (g.phase === 'verbunden' && g.archiv && !g.archiv.ansicht && liegendText(st)) break;
    }
    await tafel(false);
    await s.waitForTimeout(400);
    st = await stand(s);
    zeile('wieder verbunden, keine Archivansicht',
          g.phase + '/' + (g.archiv && g.archiv.ansicht), 'verbunden/false');
    zeile('echter Stand: Ball von Lauf 2 und der neue Ball', liegendText(st), 'B1@nova,C1@scout');
    zeile('ohne Flug', (st.fliegend || []).length, 0);
    await s.screenshot({ path: path.join(AUFNAHMEN, '2-zurueck-zu-live.jpg'), type: 'jpeg', quality: 72 });

    /* E: Nebenbefund dieses Nachweises. `bekannte` lebt ueber Neuverbindungen;
       vorher fiel deshalb beim Trennen und Wiederverbinden in derselben
       Sitzung die ganze Vorgeschichte als "doppelt" weg -- keine Laeufe, keine
       liegenden Baelle. */
    console.log('\nE — Trennen und wieder verbinden in derselben Sitzung');
    await tafel(true);
    await s.click('#agGhAus');
    await s.waitForTimeout(300);
    await s.fill('#agGhToken', 'AGMONARCHIV001_Scheintoken_0123456789ab');
    await s.click('#agGhAn');
    await s.waitForTimeout(3500);
    await tafel(false);
    await s.waitForTimeout(300);
    st = await stand(s); g = await gh(s);
    zeile('verbunden', g.phase, 'verbunden');
    zeile('alle drei Läufe zur Auswahl', g.archiv ? g.archiv.laeufe : null, 3);
    zeile('Bälle liegen weiter, nicht doppelt', liegendText(st), 'B1@nova,C1@scout');
    zeile('ohne Flug', (st.fliegend || []).length, 0);
    zeile('keine Seitenfehler', seitenFehler.length, 0);
    if (seitenFehler.length) console.log('        ' + seitenFehler.join('\n        '));
    await q.close();
  } finally {
    await b.close();
    tisch.s.close();
  }
  if (fehler) { console.log('\nABWEICHUNG in ' + fehler + ' Prüfung(en).'); process.exit(1); }
  console.log('\nALLES WIE VEREINBART — keine Abweichung.');
  console.log('Scheintoken, Probekörper. Keine Abnahme am iPad.');
})().catch(e => { console.log('\nUNGEPRÜFT: ' + (e && e.stack || e)); process.exit(2); });
