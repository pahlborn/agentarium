/* AG-MON-BALLSPIEL-003 — Schritt 3: Rueckgabe an Peter und Annahme.

   Aufruf:            node previews/AG-MON-BALLSPIEL-003/pruefen.js
   Eigener Browser:   AG_CHROMIUM=/pfad/zur/datei node previews/...
   Aufnahmen ablegen: AG_AUFNAHMEN=/verzeichnis node previews/...
   Rueckgabe: 0 = bestanden, 1 = Abweichung, 2 = ungeprueft.

   PETER, 24.10.: Der Ball bei Peter liegt bis zur Annahme. Peters Annahme
   meldet Atlas fuer ihn: `accepted` mit `actor: peter`, `reporter: atlas`
   -- die einzige Fremdaussage, die der Monitor gelten laesst, und nur fuer
   den Ball. Peter, 25.10.: "passt. bitte umsetzen."

     A  beim Verbinden: zurueckgegeben und nicht angenommen -> liegt bei
        peter; angenommen -> weg; Annahme mit falschem Melder -> wirkt nicht
     B  live: die Rueckgabe des Halters fliegt als GANZER Ball zu peter und
        bleibt dort liegen
     C  gibt ein anderer als der Halter Peter etwas, fliegt kein Ball und
        Peters Ball bleibt, wo er ist
     D  Annahme mit falschem Melder oder fuer einen Ball, der nicht bei
        peter liegt: wirkt nicht; Annahme durch atlas: der Ball geht
     F  Anstoss, Rueckgabe und Annahme in DERSELBEN Abfrage (wie der echte
        Lauf AG-RETURN-AUDIT-001): verbucht in Meldungsreihenfolge, nicht in
        Landungsreihenfolge -- kein Ball bleibt bei atlas haengen
     E  nach Neuladen und Verbinden dieselbe Lage, ohne Flug

   GRENZEN: Attrappe mit Scheintoken, Probekoerper. Keine Abnahme am iPad.  */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os');

const ZIEL = process.env.AG_ZIEL || 'pilot/github-live';
const WURZEL = path.resolve(__dirname, '..', '..', ...ZIEL.split('/'));
const AUFNAHMEN = process.env.AG_AUFNAHMEN ||
  fs.mkdtempSync(path.join(os.tmpdir(), 'ag-ballspiel-3-'));
const VERZEICHNIS = {
  schema: 'agentarium.projektverzeichnis.v1', gepflegt_von: 'atlas',
  projekte: [{ id: 'agentarium', kuerzel: 'AG', name: 'Agentarium', repo: 'pahlborn/agentarium' }]
};

let fehler = 0;
function zeile(w, ist, soll) {
  const ok = ist === soll;
  if (!ok) fehler++;
  console.log('  ' + (ok ? 'ok  ' : 'FEHL') + '  ' + w.padEnd(52) +
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
    schema: 'agentarium.github-event.v1', id: 'AG-BALL3-EREIGNIS-' + nr,
    project_id: 'agentarium', occurred_at: zeit, reporter: 'atlas',
    source_evidence: 'reported_checkpoint', source_tool_id: 'previews/AG-MON-BALLSPIEL-003'
  }, ereignis);
  return { id: 9950000000 + nr, created_at: zeit,
           user: { login: 'pahlborn', id: 277496791 },
           body: '<!-- AGENTARIUM_EVENT_V1 -->\n```json\n' + JSON.stringify(e, null, 2) +
                 '\n```\nProbe aus AG-MON-BALLSPIEL-003, kein echter Auftrag.' };
}
/* Die Bausteine der Meldeanweisung, je Lauf eine Aufgabe. */
const anstoss = (z, L, A) => kommentar(z, { run_id: L, task_id: A, kind: 'handoff',
  actor: 'peter', recipient: 'atlas', title: 'Peter gibt Atlas ' + A + '.' });
const abschluss = (z, L, A, von) => kommentar(z, { run_id: L, task_id: A, kind: 'contribution',
  actor: von || 'atlas', recipient: 'peter', reporter: von || 'atlas',
  title: (von || 'atlas') + ' gibt Peter ' + A + '.' });
const annahme = (z, L, A, melder) => kommentar(z, { run_id: L, task_id: A, kind: 'accepted',
  actor: 'peter', reporter: melder || 'atlas', title: 'Peter nimmt ' + A + ' an.' });

const vor = (min) => new Date(Date.now() - min * 60000).toISOString();
const jetzt = () => new Date().toISOString();
const stand = (s) => s.evaluate(() => (window.__agStand && window.__agStand()) || {});
const gh = (s) => s.evaluate(() => (window.__agGithub && window.__agGithub.stand()) || {});
const liegendText = (st) => (st.liegend || [])
  .map(l => l.aufgabe + '@' + l.bei + (l.teil ? '·t' : '')).sort().join(',');

async function bisLage(s, pruef, ms) {
  let st = {};
  for (let t = 0; t < ms; t += 120) {
    st = await stand(s);
    if (pruef(liegendText(st), st)) break;
    await s.waitForTimeout(120);
  }
  await s.waitForTimeout(300);
  return await stand(s);
}
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
                headers: { ETag: 'W/"ag-ball3-' + abrufe + '"' },
                body: JSON.stringify(antwortRef.liste) });
  });
  await s.goto(tisch.adr + '?live=github', { waitUntil: 'load' });
  await s.waitForTimeout(2200);
  if (!await s.evaluate(() => !!document.getElementById('agGhToken')))
    ungeprueft('kein Livefach — ohne WebGL kein Monitor');
  await s.fill('#agGhToken', 'AGBALLSPIEL003_Scheintoken_0123456789ab');
  await s.click('#agGhAn');
  await s.waitForTimeout(3500);
  await s.evaluate(() => { const d = document.getElementById('agGhAuf'); if (d) d.open = false; });
  return { q, s, seitenFehler };
}

(async () => {
  console.log('AG-MON-BALLSPIEL-003 — Schritt 3: Rückgabe an Peter und Annahme\n');
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
  /* Vorgeschichte, drei Laeufe:
       L1  zurueckgegeben, nicht angenommen           -> liegt bei peter
       L2  zurueckgegeben und von atlas angenommen    -> weg
       L3  zurueckgegeben, "Annahme" von forge gemeldet -> wirkt nicht, liegt */
  const antwort = { liste: [
    anstoss(vor(40), 'AG-B3-L1', 'A1'), abschluss(vor(39), 'AG-B3-L1', 'A1'),
    anstoss(vor(38), 'AG-B3-L2', 'A2'), abschluss(vor(37), 'AG-B3-L2', 'A2'),
    annahme(vor(36), 'AG-B3-L2', 'A2'),
    anstoss(vor(35), 'AG-B3-L3', 'A3'), abschluss(vor(34), 'AG-B3-L3', 'A3'),
    annahme(vor(33), 'AG-B3-L3', 'A3', 'forge')
  ] };
  try {
    const { q, s, seitenFehler } = await seite(b, tisch, antwort);

    console.log('A — Beim Verbinden');
    let st = await stand(s);
    zeile('nicht angenommen und falsch gemeldet liegen bei peter', liegendText(st), 'A1@peter,A3@peter');
    zeile('ohne Flug', (st.fliegend || []).length, 0);

    console.log('\nB — Rückgabe des Halters: der ganze Ball fliegt zu Peter');
    antwort.liste = antwort.liste.concat([anstoss(jetzt(), 'AG-B3-L4', 'A4')]);
    st = await bisLage(s, x => /A4@atlas/.test(x), 8000);
    zeile('A4 liegt bei atlas', /A4@atlas/.test(liegendText(st)), true);
    antwort.liste = antwort.liste.concat([abschluss(jetzt(), 'AG-B3-L4', 'A4')]);
    let bild = false, gefunden = null;
    for (let t = 0; t < 8000; t += 80) {
      const x = await stand(s);
      const f = (x.fliegend || []).find(y => y.von === 'atlas' && y.an === 'peter');
      if (f && !gefunden) gefunden = f;
      if (f && !bild && f.u > 0.45) {
        await s.screenshot({ path: path.join(AUFNAHMEN, '1-rueckgabe-zu-peter.jpg'), type: 'jpeg', quality: 75 });
        bild = true;
      }
      if (gefunden && !f) break;
      await s.waitForTimeout(80);
    }
    zeile('Flug atlas→peter', !!gefunden, true);
    zeile('als Ball', gefunden && gefunden.ball, true);
    zeile('ganze Größe', gefunden && gefunden.gross, 1);
    zeile('Aufnahme im Flug', bild, true);
    st = await bisLage(s, x => /A4@peter/.test(x), 4000);
    zeile('A4 liegt jetzt bei peter', liegendText(st), 'A1@peter,A3@peter,A4@peter');
    await s.screenshot({ path: path.join(AUFNAHMEN, '2-drei-baelle-bei-peter.jpg'), type: 'jpeg', quality: 75 });

    console.log('\nC — Ein anderer als der Halter gibt Peter etwas');
    antwort.liste = antwort.liste.concat([anstoss(jetzt(), 'AG-B3-L5', 'A5')]);
    st = await bisLage(s, x => /A5@atlas/.test(x), 8000);
    antwort.liste = antwort.liste.concat([abschluss(jetzt(), 'AG-B3-L5', 'A5', 'forge')]);
    gefunden = await flug(s, 'forge', 'peter', 8000);
    zeile('Flug forge→peter', !!gefunden, true);
    zeile('kein Ball, nur ein Wurf', gefunden && gefunden.ball, false);
    st = await stand(s);
    zeile('A5 bleibt bei atlas', liegendText(st), 'A1@peter,A3@peter,A4@peter,A5@atlas');

    console.log('\nD — Annahmen');
    antwort.liste = antwort.liste.concat([
      annahme(jetzt(), 'AG-B3-L1', 'A1', 'nova'),     /* falscher Melder */
      annahme(jetzt(), 'AG-B3-L5', 'A5'),             /* Ball liegt nicht bei peter */
      annahme(jetzt(), 'AG-B3-L4', 'A4')              /* richtig */
    ]);
    st = await bisLage(s, x => !/A4@peter/.test(x), 8000);
    await s.waitForTimeout(1500);
    st = await stand(s);
    zeile('A4 angenommen: weg; A1 und A5 unverändert', liegendText(st), 'A1@peter,A3@peter,A5@atlas');
    const g = await gh(s);
    zeile('keine Meldung abgewiesen', g.zahl && g.zahl.abgewiesen, 0);
    antwort.liste = antwort.liste.concat([annahme(jetzt(), 'AG-B3-L1', 'A1')]);
    st = await bisLage(s, x => !/A1@peter/.test(x), 8000);
    zeile('A1 von atlas angenommen: weg', liegendText(st), 'A3@peter,A5@atlas');
    await s.screenshot({ path: path.join(AUFNAHMEN, '3-nach-annahme.jpg'), type: 'jpeg', quality: 75 });

    /* F: GEFUNDEN AM ECHTEN LAUF AG-RETURN-AUDIT-001 (Peter, 25.10.: "es
       liegt dennoch ein unerklaerbarer Ball bei Atlas"). Anstoss und
       Rueckgabe kamen in derselben Abfrage; live landete die Rueckgabe vor
       dem Anstoss, und der Ball blieb bei atlas liegen. Verbucht wird jetzt
       in Meldungsreihenfolge. */
    console.log('\nF — Alles in derselben Abfrage (wie AG-RETURN-AUDIT-001)');
    antwort.liste = antwort.liste.concat([
      anstoss(jetzt(), 'AG-B3-L6', 'A6'), abschluss(jetzt(), 'AG-B3-L6', 'A6'),
      annahme(jetzt(), 'AG-B3-L6', 'A6'),
      anstoss(jetzt(), 'AG-B3-L7', 'A7'), abschluss(jetzt(), 'AG-B3-L7', 'A7')
    ]);
    st = await bisLage(s, (x, y) => /A7@peter/.test(x) && !(y.fliegend || []).length &&
                                    !(y.liegend || []).some(l => l.fliegt), 12000);
    await s.waitForTimeout(1500);
    st = await stand(s);
    zeile('A6 angenommen: liegt nirgends', /A6@/.test(liegendText(st)), false);
    zeile('A7 zurück: liegt bei Peter, nicht bei atlas', liegendText(st), 'A3@peter,A5@atlas,A7@peter');
    zeile('kein Ball mehr unterwegs', (st.liegend || []).some(l => l.fliegt), false);
    zeile('keine Seitenfehler', seitenFehler.length, 0);
    await q.close();

    console.log('\nE — Neu laden und verbinden');
    const r2 = await seite(b, tisch, antwort);
    st = await stand(r2.s);
    zeile('dieselbe Lage', liegendText(st), 'A3@peter,A5@atlas,A7@peter');
    zeile('ohne Flug', (st.fliegend || []).length, 0);
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
