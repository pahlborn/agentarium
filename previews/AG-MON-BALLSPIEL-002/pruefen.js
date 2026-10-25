/* AG-MON-BALLSPIEL-002 — Schritt 2: Teilbaelle.

   Aufruf:            node previews/AG-MON-BALLSPIEL-002/pruefen.js
   Eigener Browser:   AG_CHROMIUM=/pfad/zur/datei node previews/...
   Aufnahmen ablegen: AG_AUFNAHMEN=/verzeichnis node previews/...
   Rueckgabe: 0 = bestanden, 1 = Abweichung, 2 = ungeprueft.

   PETER, 23.10.: "Das gilt auch fuer die Baelle, die Atlas wirft ... Ein
   Ballspiel, bei dem auch mit mehreren Baellen gespielt wird."
   Lots Grundsatz: Wer delegiert, gibt die Aufgabe nicht ab, er gibt Arbeit
   daran ab. Abnahme aus dem Konzept AG-MON-BALLSPIEL-001:

     A  beim Verbinden: der ganze Ball liegt bei atlas, offene Teilbaelle
        liegen bei den Agenten, zurueckgegebene nicht -- ohne Flug
     B  Peters Anstoss fliegt als GANZER Ball
     C  eine Weitergabe fliegt als Teilball (halb so gross) und bleibt beim
        Agenten liegen; der ganze Ball bleibt bei atlas
     D  die Rueckgabe fliegt ALS BALL zurueck (kein Schweif), der Teilball
        geht
     E  zwei parallele Weitergaben: zwei Teilbaelle an zwei Plaetzen; zwei
        bei einem Agenten liegen nebeneinander
     G  die Rueckgabe an Peter nimmt nur Peters Ball: ein nie
        zurueckgemeldeter Teilball BLEIBT liegen (der Monitor dient der
        Kontrolle)
     F  nach Neuladen und Verbinden liegen dieselben Baelle wieder, ohne Flug

   GRENZEN: Attrappe mit Scheintoken, Probekoerper. Keine Abnahme am iPad.  */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os');

const ZIEL = process.env.AG_ZIEL || 'pilot/github-live';
const WURZEL = path.resolve(__dirname, '..', '..', ...ZIEL.split('/'));
const AUFNAHMEN = process.env.AG_AUFNAHMEN ||
  fs.mkdtempSync(path.join(os.tmpdir(), 'ag-ballspiel-2-'));
const VERZEICHNIS = {
  schema: 'agentarium.projektverzeichnis.v1', gepflegt_von: 'atlas',
  projekte: [{ id: 'agentarium', kuerzel: 'AG', name: 'Agentarium', repo: 'pahlborn/agentarium' }]
};

let fehler = 0;
function zeile(w, ist, soll) {
  const ok = ist === soll;
  if (!ok) fehler++;
  console.log('  ' + (ok ? 'ok  ' : 'FEHL') + '  ' + w.padEnd(50) +
              String(ist).padEnd(30) + (ok ? '' : '(erwartet ' + soll + ')'));
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
function kommentar(zeit, ereignis) {
  nr++;
  const e = Object.assign({
    schema: 'agentarium.github-event.v1', id: 'AG-BALL2-EREIGNIS-' + nr,
    project_id: 'agentarium', run_id: 'AG-BALL2-L1', occurred_at: zeit, reporter: 'atlas',
    source_evidence: 'reported_checkpoint', source_tool_id: 'previews/AG-MON-BALLSPIEL-002'
  }, ereignis);
  return { id: 9940000000 + nr, created_at: zeit,
           user: { login: 'pahlborn', id: 277496791 },
           body: '<!-- AGENTARIUM_EVENT_V1 -->\n```json\n' + JSON.stringify(e, null, 2) +
                 '\n```\nProbe aus AG-MON-BALLSPIEL-002, kein echter Auftrag.' };
}
const vor = (min) => new Date(Date.now() - min * 60000).toISOString();
const jetzt = () => new Date().toISOString();
const stand = (s) => s.evaluate(() => (window.__agStand && window.__agStand()) || {});
/* "A1@atlas" fuer den ganzen Ball, "A1-N@nova·t" fuer einen Teilball. */
const liegendText = (st) => (st.liegend || [])
  .map(l => l.aufgabe + '@' + l.bei + (l.teil ? '·t' : '')).sort().join(',');

/* Einen Flug von..an abwarten und festhalten, wie er flog. */
async function flug(s, von, an, ms) {
  let gefunden = null;
  for (let t = 0; t < ms; t += 80) {
    const st = await stand(s);
    const f = (st.fliegend || []).find(x => x.von === von && x.an === an);
    if (f && !gefunden) gefunden = f;
    if (gefunden && !f) break;
    await s.waitForTimeout(80);
  }
  await s.waitForTimeout(500);
  return gefunden;
}

async function seite(b, tisch, antwortRef) {
  const q = await b.newContext({ viewport: { width: 1194, height: 834 } });
  const s = await q.newPage();
  const seitenFehler = [];
  s.on('pageerror', e => seitenFehler.push(String(e.message).slice(0, 110)));
  let abrufe = 0;
  await s.route('**/projekte/verzeichnis.json', r => r.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify(VERZEICHNIS) }));
  await s.route('**api.github.com/**', r => {
    abrufe++;
    r.fulfill({ status: 200, contentType: 'application/json',
                headers: { ETag: 'W/"ag-ball2-' + abrufe + '"' },
                body: JSON.stringify(antwortRef.liste) });
  });
  await s.goto(tisch.adr + '?live=github', { waitUntil: 'load' });
  await s.waitForTimeout(2200);
  if (!await s.evaluate(() => !!document.getElementById('agGhToken')))
    ungeprueft('kein Livefach — ohne WebGL kein Monitor');
  await s.fill('#agGhToken', 'AGBALLSPIEL002_Scheintoken_0123456789ab');
  await s.click('#agGhAn');
  await s.waitForTimeout(3500);
  await s.evaluate(() => { const d = document.getElementById('agGhAuf'); if (d) d.open = false; });
  return { q, s, seitenFehler };
}

(async () => {
  console.log('AG-MON-BALLSPIEL-002 — Schritt 2: Teilbälle\n');
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
  /* Vorgeschichte: Peters A1 liegt bei atlas. Atlas gab Arbeit an forge --
     mit DERSELBEN task_id wie Peters Auftrag, so wie die Meldeanweisung es
     vorsieht -- und an nova (A1-N). Forge hat zurueckgegeben, nova nicht. */
  const antwort = { liste: [
    kommentar(vor(30), { task_id: 'A1', kind: 'handoff', actor: 'peter', recipient: 'atlas',
                         title: 'Peter gibt Atlas A1.' }),
    kommentar(vor(29), { task_id: 'A1', kind: 'handoff', actor: 'atlas', recipient: 'forge',
                         title: 'Atlas gibt Forge Arbeit an A1.' }),
    kommentar(vor(28), { task_id: 'A1-N', kind: 'handoff', actor: 'atlas', recipient: 'nova',
                         title: 'Atlas gibt Nova A1-N.' }),
    kommentar(vor(27), { task_id: 'A1', kind: 'contribution', actor: 'forge', recipient: 'atlas',
                         reporter: 'forge', title: 'Forge gibt zurück.' })
  ] };
  try {
    const { q, s, seitenFehler } = await seite(b, tisch, antwort);

    console.log('A — Beim Verbinden');
    let st = await stand(s);
    zeile('ganzer Ball bei atlas, Teilball bei nova', liegendText(st), 'A1-N@nova·t,A1@atlas');
    zeile('kein Teilball bei forge (zurückgegeben)', /@forge/.test(liegendText(st)), false);
    zeile('ohne Flug', (st.fliegend || []).length, 0);

    console.log('\nB — Peters Anstoß fliegt als ganzer Ball');
    antwort.liste = antwort.liste.concat([kommentar(jetzt(), { run_id: 'AG-BALL2-L2',
      task_id: 'A2', kind: 'handoff', actor: 'peter', recipient: 'atlas', title: 'Peter gibt Atlas A2.' })]);
    let f = await flug(s, 'peter', 'atlas', 8000);
    zeile('Flug peter→atlas', !!f, true);
    zeile('als Ball', f && f.ball, true);
    zeile('ganze Größe', f && f.gross, 1);
    st = await stand(s);
    zeile('zwei ganze Bälle bei atlas', liegendText(st), 'A1-N@nova·t,A1@atlas,A2@atlas');

    console.log('\nC — Weitergabe: ein Teilball');
    antwort.liste = antwort.liste.concat([kommentar(jetzt(), { task_id: 'A1-S',
      kind: 'handoff', actor: 'atlas', recipient: 'scout', title: 'Atlas gibt Scout A1-S.' })]);
    f = await flug(s, 'atlas', 'scout', 8000);
    zeile('Flug atlas→scout', !!f, true);
    zeile('als Ball', f && f.ball, true);
    zeile('halbe Größe', f && f.gross, 0.48);
    st = await stand(s);
    zeile('Teilball liegt bei scout, ganzer Ball bleibt bei atlas', liegendText(st),
          'A1-N@nova·t,A1-S@scout·t,A1@atlas,A2@atlas');
    await s.screenshot({ path: path.join(AUFNAHMEN, '1-teilball-bei-scout.jpg'), type: 'jpeg', quality: 75 });

    console.log('\nD — Rückgabe fliegt als Ball');
    antwort.liste = antwort.liste.concat([kommentar(jetzt(), { task_id: 'A1-S',
      kind: 'contribution', actor: 'scout', recipient: 'atlas', reporter: 'scout',
      title: 'Scout gibt A1-S zurück.' })]);
    let bild = false;
    let gefunden = null;
    for (let t = 0; t < 8000; t += 80) {
      const x = await stand(s);
      const g = (x.fliegend || []).find(y => y.von === 'scout' && y.an === 'atlas');
      if (g && !gefunden) gefunden = g;
      if (g && !bild && g.u > 0.4) {
        await s.screenshot({ path: path.join(AUFNAHMEN, '2-rueckgabe-als-ball.jpg'), type: 'jpeg', quality: 75 });
        bild = true;
      }
      if (gefunden && !g) break;
      await s.waitForTimeout(80);
    }
    await s.waitForTimeout(500);
    zeile('Flug scout→atlas', !!gefunden, true);
    zeile('als Ball, nicht als Schweif', gefunden && gefunden.ball, true);
    zeile('halbe Größe', gefunden && gefunden.gross, 0.48);
    zeile('Aufnahme im Flug', bild, true);
    st = await stand(s);
    zeile('Teilball bei scout ist weg', liegendText(st), 'A1-N@nova·t,A1@atlas,A2@atlas');

    console.log('\nE — Mehrere Teilbälle');
    antwort.liste = antwort.liste.concat([
      kommentar(jetzt(), { run_id: 'AG-BALL2-L2', task_id: 'A2-F', kind: 'handoff',
        actor: 'atlas', recipient: 'forge', title: 'Atlas gibt Forge A2-F.' }),
      kommentar(jetzt(), { run_id: 'AG-BALL2-L2', task_id: 'A2-G', kind: 'handoff',
        actor: 'atlas', recipient: 'argus', title: 'Atlas gibt Argus A2-G.' }),
      kommentar(jetzt(), { run_id: 'AG-BALL2-L2', task_id: 'A2-N', kind: 'handoff',
        actor: 'atlas', recipient: 'nova', title: 'Atlas gibt Nova A2-N.' })
    ]);
    for (let t = 0; t < 12000; t += 150) {
      await s.waitForTimeout(150);
      st = await stand(s);
      if ((st.liegend || []).length >= 6 && !(st.fliegend || []).length) break;
    }
    await s.waitForTimeout(600);
    st = await stand(s);
    const soll = 'A1-N@nova·t,A1@atlas,A2-F@forge·t,A2-G@argus·t,A2-N@nova·t,A2@atlas';
    zeile('Teilbälle bei forge, argus und zwei bei nova', liegendText(st), soll);
    await s.screenshot({ path: path.join(AUFNAHMEN, '3-mehrere-teilbaelle.jpg'), type: 'jpeg', quality: 75 });

    /* G: Peters Ball A1 kommt zurueck. Der Teilball bei nova (A1-N) wurde
       nie zurueckgemeldet und BLEIBT liegen. Peter, 25.10.: Bei einigen
       Agenten blieben Auftraege liegen, weil sie nicht vollendet wurden; der
       Monitor hat geholfen, sie zu erkennen -- "dafuer ist der Monitor auch
       da: zur Kontrolle". */
    console.log('\nG — Rückgabe an Peter: Unerledigtes bleibt sichtbar');
    antwort.liste = antwort.liste.concat([kommentar(jetzt(), { task_id: 'A1',
      kind: 'contribution', actor: 'atlas', recipient: 'peter', title: 'Atlas gibt Peter A1.' })]);
    for (let t = 0; t < 10000; t += 150) {
      await s.waitForTimeout(150);
      st = await stand(s);
      if (!/A1@atlas/.test(liegendText(st))) break;
    }
    await s.waitForTimeout(400);
    st = await stand(s);
    const soll2 = 'A1-N@nova·t,A2-F@forge·t,A2-G@argus·t,A2-N@nova·t,A2@atlas';
    zeile('A1 zurück, der unerledigte Teilball bei nova bleibt', liegendText(st), soll2);
    zeile('keine Seitenfehler', seitenFehler.length, 0);
    await q.close();

    console.log('\nF — Neu laden und verbinden');
    const r2 = await seite(b, tisch, antwort);
    st = await stand(r2.s);
    zeile('dieselben Bälle liegen wieder', liegendText(st), soll2);
    zeile('ohne Flug', (st.fliegend || []).length, 0);
    await r2.s.screenshot({ path: path.join(AUFNAHMEN, '4-nach-neuladen.jpg'), type: 'jpeg', quality: 75 });
    zeile('keine Seitenfehler', r2.seitenFehler.length, 0);
    await r2.q.close();
  } finally {
    await b.close();
    tisch.s.close();
  }
  if (fehler) { console.log('\nABWEICHUNG in ' + fehler + ' Prüfung(en).'); process.exit(1); }
  console.log('\nALLES WIE VEREINBART — keine Abweichung.');
  console.log('Scheintoken, Probekörper. Keine Abnahme am iPad.');
})().catch(e => { console.log('\nUNGEPRÜFT: ' + (e && e.stack || e)); process.exit(2); });
