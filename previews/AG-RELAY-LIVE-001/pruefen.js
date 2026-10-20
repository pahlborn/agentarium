/* AG-RELAY-LIVE-001 — Nachweis: die Relais-Signale bestehen den ECHTEN Parser.

   Start:  node previews/AG-RELAY-LIVE-001/pruefen.js
   Eigener Browser:  AG_CHROMIUM=/pfad/zur/datei node previews/...

   Rückgabe 0 = alles wie vereinbart, 1 = Abweichung, 2 = ungeprüft.

   WAS HIER GEPRÜFT WIRD, UND WAS NICHT.
   Geprüft wird der Parser aus `pilot/github-live/github-live.js`, geladen von
   der echten Seite, mit Kommentarkörpern, die `relay/claude_public_relay_v2.py`
   selbst erzeugt hat (`koerper.py` fängt nur `post_issue` ab). Eine Nachbildung
   des Parsers oder der Körper würde beweisen, dass meine zwei Nachbildungen
   zueinander passen — nicht, dass Relais und Monitor zueinander passen.

   NICHT geprüft ist ein echter Live-Pilot: kein Arbeitslauf, kein Modell, keine
   Aktivierung, kein Netz. Dass ein Körper den Parser besteht, ist nicht
   dasselbe wie ein Lauf, den Peter im geöffneten Monitor sieht.               */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http'),
      os = require('os'), { execFileSync } = require('child_process');

const WURZEL = path.resolve(__dirname, '..', '..');
const ZIEL = path.join(WURZEL, 'pilot', 'github-live');
const ERZEUGER = path.join(__dirname, 'koerper.py');
let fehler = 0;
function zeile(w, ist, soll) {
  const ok = ist === soll;
  if (!ok) fehler++;
  console.log('  ' + (ok ? 'ok  ' : 'FEHL') + '  ' + w.padEnd(42) + String(ist).padEnd(26) +
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

(async () => {
  console.log('AG-RELAY-LIVE-001 — Relais-Signale gegen den echten Parser\n');

  let chromium = null;
  try { chromium = require('playwright').chromium; } catch (e) {}
  const br = chromiumPfad(chromium);
  if (br.grund) ungeprueft(br.grund);

  /* Die Körper vom echten Relaisprogramm holen. */
  const ablage = fs.mkdtempSync(path.join(os.tmpdir(), 'ag-relay-live-'));
  const datei = path.join(ablage, 'koerper.json');
  try {
    execFileSync('python3', ['-I', ERZEUGER, datei], { cwd: WURZEL, stdio: 'pipe' });
  } catch (e) {
    ungeprueft('koerper.py konnte die Körper nicht erzeugen: ' +
               String(e.stderr || e.message).split('\n').slice(-3).join(' '));
  }
  const koerper = JSON.parse(fs.readFileSync(datei, 'utf8'));
  const namen = ['HOST_RECEIVED', 'RESULT_READY', 'BLOCKED', 'BLOCKED_KONTROLLFOLGE',
                 'OHNE_SCHUTZ_ERWARTET_ABGEWIESEN'];
  for (const n of namen) if (!koerper[n]) ungeprueft('Körper fehlt: ' + n);

  const b = await chromium.launch({ executablePath: br.pfad,
                                    args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const n = await tischen(ZIEL);
  const q = await b.newContext({ viewport: { width: 1194, height: 834 } });
  const s = await q.newPage();
  const err = [];
  s.on('pageerror', e => err.push(String(e)));

  /* Kein Netz: die eine Adresse, die der Adapter kennt, wird hier bedient.

     DER BASISSCHNITT IST DER GRUND FUER DIESEN AUFBAU. Beim Verbinden liest
     der Adapter die ganze Historie und zaehlt sie ausdruecklich als
     "markierte historisch, nicht abgespielt". Alles, was beim Verbinden schon
     da liegt, wird also NICHT gezeigt -- und ein Nachweis, der die Koerper
     vorher hinlegt, misst eine leere Menge und nennt es Erfolg.
     Deshalb: erst leer verbinden, dann jeden Koerper einzeln nachliefern. Das
     prueft zugleich jedes Ereignis fuer sich statt nur die Summe. */
  let abrufe = 0;
  let antwort = [];
  await s.route('**api.github.com/**', route => {
    abrufe++;
    route.fulfill({ status: 200, contentType: 'application/json',
                    headers: { ETag: 'W/"ag-relay-live-' + abrufe + '"' },
                    body: JSON.stringify(antwort) });
  });
  async function nachliefern(name, id) {
    antwort = [{ id: id, body: koerper[name],
                 user: { login: 'github-actions[bot]', id: 41898282 } }];
    await s.waitForTimeout(2800);
    return await s.evaluate(() => ({
      letztes: (document.getElementById('agGhLetztes') || {}).textContent || '',
      zahlen: (document.getElementById('agGhZahlen') || {}).textContent || '',
      grund: (document.getElementById('agGhGrund') || {}).textContent || '',
    }));
  }

  /* `?live=github` ist der einzige Schalter, der den Adapter laedt -- und er
     schaltet das Original selbst in den Livebetrieb (`modusSetzen('live')`).
     Mit `?live=1` geschieht gar nichts, und zwar lautlos. */
  await s.goto(n.adr + '?live=github', { waitUntil: 'load' });
  await s.waitForTimeout(1500);

  console.log('A — Vorbereitung');
  const adapter = await s.evaluate(() => !!document.getElementById('agGhToken'));
  zeile('Adapter geladen', adapter, true);
  if (!adapter) ungeprueft('der Adapter hat sich nicht aufgebaut (?live=github)');

  /* Nicht annehmen, dass der Schalter den Livebetrieb wirklich gesetzt hat:
     ohne ihn zeigt `zeigen()` nichts, und zwar ohne Fehlermeldung. */
  const live = await s.evaluate(() =>
    !!(window.__agGithubBruecke && window.__agGithubBruecke.istLive()));
  zeile('Original im Livebetrieb', live, true);

  await s.evaluate(() => {
    document.getElementById('agGhToken').value = 'ghp_nurfuerdenpruefladen000000000000000000';
    document.getElementById('agGhAn').click();
  });
  await s.waitForTimeout(2500);
  zeile('mindestens ein Abruf bedient', abrufe > 0 ? 'ja, ' + abrufe : 'nein', 'ja, ' + abrufe);

  console.log('\nB — Jeder Körper einzeln, nach dem Verbinden nachgeliefert');
  console.log('    erwartet: der echte Parser nimmt ihn an und nennt ihn\n');
  const faelle = [
    ['HOST_RECEIVED', 'AG-RELAY-TASK-LIVE-001:39266581121:HOST_RECEIVED', 'handoff', 'atlas → forge'],
    ['RESULT_READY', 'AG-RELAY-TASK-LIVE-001:39266581121:RESULT_READY', 'contribution', 'forge → atlas'],
    ['BLOCKED', 'AG-RELAY-TASK-LIVE-001:39266581121:BLOCKED', 'progress', 'atlas'],
    ['BLOCKED_KONTROLLFOLGE', 'AG-RELAY-TASK-LIVE-001:39266581122:BLOCKED', 'progress', 'atlas'],
  ];
  let stand = null;
  let nr = 910000;
  for (const [name, id, art, wer] of faelle) {
    stand = await nachliefern(name, nr++);
    const kurz = id.replace('AG-RELAY-TASK-LIVE-001:', '');
    zeile(kurz + ' angenommen', stand.letztes.indexOf(id) >= 0 ? 'ja' : 'nein, ' + stand.letztes.slice(0, 50), 'ja');
    zeile(kurz + ' als ' + art, stand.letztes.indexOf('Neu (live): ' + art + ' ·') === 0 ? 'ja' : 'nein', 'ja');
    zeile(kurz + ' von ' + wer, stand.letztes.indexOf('· ' + wer + ' ·') > 0 ? 'ja' : 'nein', 'ja');
  }
  zeile('vier gezeigt, keiner mehr', /neu gezeigt 4\b/.test(stand.zahlen) ? 'ja' : 'nein, ' + stand.zahlen.slice(0, 70), 'ja');
  zeile('bis hierher nichts abgewiesen', /abgewiesen 0\b/.test(stand.zahlen) ? 'ja' : 'nein, ' + stand.zahlen.slice(0, 70), 'ja');

  console.log('\nC — Und der ungeschützte Körper, mit dem richtigen Grund');
  console.log('    erwartet: abgewiesen, „Marker mehrfach", nichts gezeigt\n');
  const vorher = stand.letztes;
  stand = await nachliefern('OHNE_SCHUTZ_ERWARTET_ABGEWIESEN', nr++);
  zeile('abgewiesen', /Marker mehrfach/.test(stand.grund) ? 'ja' : 'nein, ' + stand.grund.slice(0, 40), 'ja');
  zeile('genau eine Abweisung', /abgewiesen 1\b/.test(stand.zahlen) ? 'ja' : 'nein, ' + stand.zahlen.slice(0, 70), 'ja');
  zeile('kein fünftes Ereignis gezeigt', /neu gezeigt 4\b/.test(stand.zahlen) ? 'ja' : 'nein', 'ja');
  zeile('letzte Meldung unverändert', stand.letztes === vorher ? 'ja' : 'nein', 'ja');

  console.log('\nD — Was der Schutz bewirkt hat');
  console.log('    erwartet: statt des Rücklaufs eine Blockmeldung, ohne Handback\n');
  const schutz = koerper.BLOCKED_KONTROLLFOLGE;
  zeile('Handback nicht veröffentlicht', schutz.indexOf('so sieht ein Ereignis aus') < 0 ? 'ja' : 'nein', 'ja');
  zeile('Grund benannt', schutz.indexOf('CONTROL_SEQUENCE_IN_HANDBACK') > 0 ? 'ja' : 'nein', 'ja');
  zeile('keine zweite Erfolgsmeldung', schutz.indexOf('RESULT_READY') < 0 ? 'ja' : 'nein', 'ja');
  zeile('Marker genau einmal', (schutz.match(/<!-- AGENTARIUM_EVENT_V1 -->/g) || []).length, 1);
  zeile('ungeschützt trüge ihn zweimal',
        (koerper.OHNE_SCHUTZ_ERWARTET_ABGEWIESEN.match(/<!-- AGENTARIUM_EVENT_V1 -->/g) || []).length, 2);

  console.log('\nE — Keine Behauptung über forge in einer Blockmeldung\n');
  for (const name of ['BLOCKED', 'BLOCKED_KONTROLLFOLGE']) {
    const block = koerper[name].split('<!-- AGENTARIUM_EVENT_V1 -->').pop();
    const ev = JSON.parse(block.split('```json')[1].split('```')[0]);
    zeile(name + ': actor', ev.actor, 'atlas');
    zeile(name + ': kein recipient', 'recipient' in ev ? 'doch' : 'keiner', 'keiner');
    zeile(name + ': Titel nennt forge nicht als Täter',
          /über forge ist nichts/.test(ev.title) ? 'ja' : 'nein, ' + ev.title.slice(0, 40), 'ja');
  }

  zeile('Konsolenfehler', err.length ? err[0].slice(0, 40) : 'keine', 'keine');

  await q.close();
  await b.close();
  n.s.close();
  fs.rmSync(ablage, { recursive: true, force: true });
  console.log('');
  if (fehler) { console.log('ABWEICHUNG in ' + fehler + ' Prüfung(en).'); process.exit(1); }
  console.log('ALLES WIE VEREINBART — keine Abweichung.');
  console.log('Synthetischer Parsernachweis. Kein Lauf, kein Modell, keine Aktivierung,');
  console.log('kein Netz — und damit kein Beleg für einen echten Live-Piloten.');
})().catch(e => { console.error('FEHLER im Prüflauf: ' + e.message); process.exit(1); });
