/* AG-MON-BALLSPIEL-001, Schritt 1 — Peters Ball bleibt beim Empfaenger liegen.

   Aufruf:            node previews/AG-MON-BALLSPIEL-001/pruefen.js
   Eigener Browser:   AG_CHROMIUM=/pfad/zur/datei node previews/...
   Aufnahmen ablegen: AG_AUFNAHMEN=/verzeichnis node previews/...
   Rueckgabe: 0 = bestanden, 1 = Abweichung, 2 = ungeprueft.

   PETER, 23.10.: "Der Ball muesste bei Atlas liegen bleiben, damit man sieht,
   wer die Aufgabe gerade bearbeitet." Schritt 1 von drei:

     A  Demo-Modus: kein liegender Live-Ball (das Stueck bleibt unberuehrt)
     B  Anstoss peter -> atlas: der Ball LIEGT danach bei atlas, und bleibt
     C  ein zweiter Anstoss: zwei Baelle bei atlas, je Aufgabe einer
     D  Weitergabe atlas -> forge: Peters Ball bleibt bei atlas
        (Teilbaelle sind Schritt 2 -- hier wird nur belegt, dass nichts
        vorweggenommen ist)
     E  ein Fremder gibt Peter etwas: Peters Ball bleibt (nur der Halter
        gibt ihn zurueck)
     F  atlas gibt Peter das Ergebnis: genau dieser Ball geht, der andere
        bleibt (Zwischenstand; in Schritt 3 fliegt er zurueck und liegt bei
        Peter bis zur Annahme)

   Je Zustand ein Bild. Gemessen wird der liegende Ball als Datum UND als Bild.

     H  zu spaet verbunden (Schritt 1b): offene Baelle liegen sofort da,
        ohne Flug; zurueckgegebene nicht; Fremde geben nichts zurueck

   GRENZEN: Abruf ist eine Attrappe mit Scheintoken. Probekoerper. Keine
   Abnahme auf Peters Geraet.                                               */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os');

const ZIEL = process.env.AG_ZIEL || 'pilot/github-live';
const WURZEL = path.resolve(__dirname, '..', '..', ...ZIEL.split('/'));
const AUFNAHMEN = process.env.AG_AUFNAHMEN ||
  fs.mkdtempSync(path.join(os.tmpdir(), 'ag-mon-ballspiel-'));
const LAUF = 'AG-MON-BALLSPIEL-001';
const T1 = 'AG-MON-BALLSPIEL-001-A', T2 = 'AG-MON-BALLSPIEL-001-B';

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
function kommentar(ereignis) {
  nr++;
  const e = Object.assign({
    schema: 'agentarium.github-event.v1',
    id: LAUF + '-' + nr,
    project_id: 'agentarium',
    run_id: LAUF,
    occurred_at: new Date().toISOString(),
    source_evidence: 'reported_checkpoint',
    source_tool_id: 'previews/AG-MON-BALLSPIEL-001'
  }, ereignis);
  return {
    id: 9910000000 + nr,
    created_at: new Date().toISOString(),
    user: { login: 'pahlborn', id: 277496791 },
    body: '<!-- AGENTARIUM_EVENT_V1 -->\n```json\n' + JSON.stringify(e, null, 2) +
          '\n```\nProbe aus AG-MON-BALLSPIEL-001, kein echter Auftrag.'
  };
}

const stand = (s) => s.evaluate(() => (window.__agStand && window.__agStand()) || {});
const liegendText = (st) => (st.liegend || []).map(l => l.aufgabe.slice(-1) + '@' + l.bei).sort().join(',');

/* Wartet, bis alle Fluege gelandet sind UND `pruef(stand)` stimmt. */
async function warten(s, pruef, ms) {
  let st = await stand(s);
  for (let i = 0; i < (ms || 12000) / 100; i++) {
    if (!(st.fliegend || []).length && pruef(st)) return st;
    await s.waitForTimeout(100);
    st = await stand(s);
  }
  return st;
}

(async () => {
  console.log('AG-MON-BALLSPIEL-001 — Schritt 1: Peters Ball bleibt beim Empfänger liegen\n');
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
    /* ============================================ A: DEMO UNBERUEHRT === */
    console.log('A — Demo-Modus: kein liegender Live-Ball');
    {
      const q = await b.newContext({ viewport: { width: 1194, height: 834 } });
      const s = await q.newPage();
      await s.goto(tisch.adr, { waitUntil: 'load' });
      await s.waitForTimeout(6000);
      const st = await stand(s);
      zeile('Demo läuft (Zeit vergeht)', (st.zeit || 0) > 1, true);
      zeile('keine liegenden Live-Bälle im Demo-Modus', (st.liegend || []).length, 0);
      await q.close();
    }

    /* ============================================ B..F: LIVEBETRIEB === */
    const q = await b.newContext({ viewport: { width: 1194, height: 834 } });
    const s = await q.newPage();
    const seitenFehler = [];
    s.on('pageerror', e => seitenFehler.push(String(e.message).slice(0, 110)));
    let abrufe = 0, antwort = [];
    await s.route('**api.github.com/**', r => {
      abrufe++;
      r.fulfill({ status: 200, contentType: 'application/json',
                  headers: { ETag: 'W/"ag-mon-ballspiel-' + abrufe + '"' },
                  body: JSON.stringify(antwort) });
    });
    await s.goto(tisch.adr + '?live=github', { waitUntil: 'load' });
    await s.waitForTimeout(2200);
    if (!await s.evaluate(() => !!document.getElementById('agGhToken')))
      ungeprueft('kein Livefach — ohne WebGL kein Monitor');
    await s.fill('#agGhToken', 'AGMONBALLSPIEL001_Scheintoken_0123456789');
    await s.click('#agGhAn');
    await s.waitForTimeout(3500);
    /* Tafel zuklappen, sonst verdeckt sie das Feld (Lehre aus AG-MON-ANSTOSS-001). */
    await s.evaluate(() => { const d = document.getElementById('agGhAuf'); if (d) d.open = false; });
    const schicke = (...ev) => { antwort = antwort.concat(ev.map(kommentar)); };
    const bild = (n) => s.screenshot({ path: path.join(AUFNAHMEN, n), type: 'jpeg', quality: 72 })
                         .then(() => fs.existsSync(path.join(AUFNAHMEN, n)));

    console.log('\nB — Anstoß peter → atlas: der Ball liegt danach bei atlas');
    schicke({ task_id: T1, kind: 'handoff', actor: 'peter', recipient: 'atlas', reporter: 'atlas',
              title: 'Peter gibt Atlas Aufgabe A (Probe).' });
    let st = await warten(s, x => liegendText(x) === 'A@atlas');
    zeile('nach der Landung liegt ein Ball bei atlas', liegendText(st), 'A@atlas');
    await s.waitForTimeout(3000);
    st = await stand(s);
    zeile('und er bleibt liegen (3 s später)', liegendText(st), 'A@atlas');
    zeile('Aufnahme: ein Ball liegt bei atlas', await bild('1-ein-ball-bei-atlas.jpg'), true);

    console.log('\nC — Ein zweiter Anstoß: zwei Bälle bei atlas');
    schicke({ task_id: T2, kind: 'handoff', actor: 'peter', recipient: 'atlas', reporter: 'atlas',
              title: 'Peter gibt Atlas Aufgabe B (Probe).' });
    st = await warten(s, x => (x.liegend || []).length === 2);
    zeile('zwei Bälle, beide bei atlas', liegendText(st), 'A@atlas,B@atlas');
    zeile('Aufnahme: zwei Bälle bei atlas', await bild('2-zwei-baelle-bei-atlas.jpg'), true);

    console.log('\nD — Weitergabe atlas → forge: Peters Ball bleibt bei atlas');
    schicke({ task_id: T1, kind: 'handoff', actor: 'atlas', recipient: 'forge', reporter: 'atlas',
              title: 'Atlas gibt Forge Arbeit an A (Probe).' });
    /* Seit Schritt 2 (AG-MON-BALLSPIEL-002) legt die Weitergabe einen
       TEILBALL bei forge hin -- Peters Baelle bleiben trotzdem bei atlas.
       Gewartet wird deshalb auf drei liegende Baelle, nicht auf den Flug. */
    st = await warten(s, x => (x.liegend || []).length === 3);
    zeile('Peters Bälle liegen weiter bei atlas', liegendText(st), 'A@atlas,A@forge,B@atlas');

    console.log('\nE — Ein Fremder gibt Peter etwas: Peters Ball bleibt');
    schicke({ task_id: T2, kind: 'contribution', actor: 'forge', recipient: 'peter', reporter: 'forge',
              title: 'Forge schickt Peter etwas zu B (Probe).' });
    st = await warten(s, x => (x.ausgegeben || 0) >= 4);
    zeile('nur der Halter gibt den Ball zurück', liegendText(st), 'A@atlas,A@forge,B@atlas');

    console.log('\nF — atlas gibt Peter das Ergebnis zu A: genau dieser Ball geht');
    schicke({ task_id: T1, kind: 'contribution', actor: 'atlas', recipient: 'peter', reporter: 'atlas',
              title: 'Atlas gibt Peter das Ergebnis zu A (Probe).' });
    /* Seit Schritt 2 bleibt der Teilball bei forge liegen: Forge hat nie
       zurueckgegeben, und genau das soll man sehen (Peter, 25.10.: der
       Monitor dient der Kontrolle). */
    st = await warten(s, x => (x.liegend || []).length === 2);
    zeile('Ball A ist weg, Ball B liegt weiter', liegendText(st), 'A@forge,B@atlas');
    zeile('Aufnahme: ein Ball bleibt bei atlas', await bild('3-ein-ball-bleibt.jpg'), true);

    console.log('\nG — Nichts verloren');
    zeile('ausgegeben', st.ausgegeben || 0, 5);
    zeile('keine Seitenfehler', seitenFehler.length, 0);
    if (seitenFehler.length) console.log('        ' + seitenFehler.join('\n        '));
    await q.close();

    /* ================================ H: ZU SPAET VERBUNDEN (1b) ===
       Peter, 25.10.: "Wenn der Ball liegen bleiben wuerde, waere es egal, ob
       ich zu spaet komme." Alles liegt schon in der Historie, BEVOR
       verbunden wird. Erwartet: offene Baelle liegen sofort am richtigen
       Platz, ohne Flug, ohne Nachspielen; ein zurueckgegebener liegt nicht;
       eine "Rueckgabe" durch einen Fremden zaehlt nicht. */
    console.log('\nH — Zu spät verbunden: offene Bälle liegen sofort da, ohne Flug');
    {
      const T3 = 'AG-MON-BALLSPIEL-001-C', T4 = 'AG-MON-BALLSPIEL-001-D',
            T5 = 'AG-MON-BALLSPIEL-001-E';
      const q2 = await b.newContext({ viewport: { width: 1194, height: 834 } });
      const s2 = await q2.newPage();
      const fehler2 = [];
      s2.on('pageerror', e => fehler2.push(String(e.message).slice(0, 110)));
      let antwort2 = [
        kommentar({ task_id: T3, kind: 'handoff', actor: 'peter', recipient: 'atlas',
                    reporter: 'atlas', title: 'C liegt noch bei atlas (Probe).' }),
        kommentar({ task_id: T4, kind: 'handoff', actor: 'peter', recipient: 'atlas',
                    reporter: 'atlas', title: 'D Anstoß (Probe).' }),
        kommentar({ task_id: T4, kind: 'contribution', actor: 'atlas', recipient: 'peter',
                    reporter: 'atlas', title: 'D ist schon zurück (Probe).' }),
        kommentar({ task_id: T5, kind: 'handoff', actor: 'peter', recipient: 'nova',
                    reporter: 'atlas', title: 'E liegt bei nova (Probe).' }),
        kommentar({ task_id: T5, kind: 'contribution', actor: 'forge', recipient: 'peter',
                    reporter: 'forge', title: 'E: ein Fremder gibt zurück, zählt nicht (Probe).' })
      ];
      let abrufe2 = 0;
      await s2.route('**api.github.com/**', r => {
        abrufe2++;
        r.fulfill({ status: 200, contentType: 'application/json',
                    headers: { ETag: 'W/"ag-mon-ballspiel-h-' + abrufe2 + '"' },
                    body: JSON.stringify(antwort2) });
      });
      await s2.goto(tisch.adr + '?live=github', { waitUntil: 'load' });
      await s2.waitForTimeout(2200);
      await s2.fill('#agGhToken', 'AGMONBALLSPIEL001H_Scheintoken_0123456789');
      await s2.click('#agGhAn');
      await s2.waitForTimeout(3500);
      await s2.evaluate(() => { const d = document.getElementById('agGhAuf'); if (d) d.open = false; });
      let st2 = await stand(s2);
      zeile('offene Bälle liegen sofort am richtigen Platz', liegendText(st2), 'C@atlas,E@nova');
      zeile('ohne Flug', (st2.fliegend || []).length, 0);
      zeile('nichts nachgespielt', st2.ausgegeben || 0, 0);
      await s2.screenshot({ path: path.join(AUFNAHMEN, '4-zu-spaet-verbunden.jpg'), type: 'jpeg', quality: 72 });
      zeile('Aufnahme: Bälle liegen nach dem Verbinden',
            fs.existsSync(path.join(AUFNAHMEN, '4-zu-spaet-verbunden.jpg')), true);
      /* Und danach live weiter: Die Rueckgabe trifft den wiederhergestellten
         Ball genauso wie einen live gelandeten. */
      antwort2 = antwort2.concat([kommentar({ task_id: T3, kind: 'contribution', actor: 'atlas',
        recipient: 'peter', reporter: 'atlas', title: 'C: Ergebnis an Peter (Probe).' })]);
      st2 = await warten(s2, x => liegendText(x) === 'E@nova');
      zeile('Rückgabe nach dem Verbinden nimmt den Ball weg', liegendText(st2), 'E@nova');
      zeile('keine Seitenfehler', fehler2.length, 0);
      if (fehler2.length) console.log('        ' + fehler2.join('\n        '));
      await q2.close();
    }
  } finally {
    await b.close();
    tisch.s.close();
  }
  if (fehler) { console.log('\nABWEICHUNG in ' + fehler + ' Prüfung(en).'); process.exit(1); }
  console.log('\nALLES WIE VEREINBART — keine Abweichung.');
  console.log('Scheintoken, Probekörper. Schritt 1 von 3; keine Abnahme am iPad.');
})().catch(e => { console.log('\nUNGEPRÜFT: ' + (e && e.stack || e)); process.exit(2); });
