/* AG-MON-LAUFZEIT-001 — Arbeit aus der Laufzeit (AG-LAUFZEIT-001, Teil 3).

   Aufruf:            node previews/AG-MON-LAUFZEIT-001/pruefen.js
   Eigener Browser:   AG_CHROMIUM=/pfad/zur/datei node previews/...
   Rueckgabe: 0 = bestanden, 1 = Abweichung, 2 = ungeprueft.

   PETER, 02.11.: tragfaehig statt Zwischenbehelf -- die Stelle, die eine Rolle
   tatsaechlich startet, meldet Start und Ende. Fuer die Claude-Rollen ist das
   das Relais (`relay-host`, `handoffs/AG-LAUFZEIT-001-runtime-contract-v1.md`).
   Der Monitor zeigt die Arbeit einer Rolle, solange ein LIVE beobachteter Lauf
   von ihr laeuft -- und nur dann. Keine Ableitung aus Uebergabe, Rueckgabe,
   Fortschritt oder Lieferung, kein erfundenes `started`, keine Aufgabe im
   V1-Vertrag.

     A  die sechs echten Laufzeitkommentare von #2 (Stand 10.11.): vier v2
        gelesen, zwei v1 laut Vertrag uebersprungen, keiner abgewiesen; alle
        Laeufe sind zu Ende, also arbeitet niemand
     B  live: ein neuer, live beobachteter Start von forge -> forge arbeitet
        (Arbeitsleuchten am Namen, Weise zeichnet); sein Ende -> vorbei
     C  beim Verbinden: ein offener Live-Start von vor 5 Minuten zeigt Arbeit,
        einer von vor 30 Minuten nicht (Hoechstdauer eines Laufs 23 Minuten)
     D  ein Start, der erst nach seinem Ende gelesen wurde (`archive`),
        aktiviert nie; ein spaeter Start nach dem Ende desselben Versuchs auch
        nicht
     E  abgewiesen statt umgedeutet: falscher Autor, Art widerspricht der
        Beobachtung, falsche Herkunft, Text neben dem Block
     F  der V1-Vertrag bleibt unberuehrt: keine Aufgabe entsteht, und
        Uebergabe plus Rueckgabe allein zeigen keine Arbeit

   Die Faelle in B bis F sind aus dem echten Forge-Datensatz abgeleitet: nur
   Versuch, Zeiten, Zustellung und bei E das jeweils verletzte Feld geaendert.

   GRENZEN: Attrappe mit Scheintoken. Nur die Relais-Rollen (forge, archibald,
   cadence) haben solche Belege; die ChatGPT-Rollen, Atlas und Lot nicht.
   Keine Abnahme am iPad.                                                  */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http'), crypto = require('crypto');

const ZIEL = process.env.AG_ZIEL || 'pilot/github-live';
const WURZEL = path.resolve(__dirname, '..', '..', ...ZIEL.split('/'));
const ECHT = JSON.parse(fs.readFileSync(path.join(__dirname, 'echte-laufzeit.json'), 'utf8'));
const VERZEICHNIS = {
  schema: 'agentarium.projektverzeichnis.v1', gepflegt_von: 'atlas',
  projekte: [{ id: 'agentarium', kuerzel: 'AG', name: 'Agentarium', repo: 'pahlborn/agentarium' }]
};
const MARKER_LZ = '<!-- AGENTARIUM_RUNTIME_V1 -->';

let fehler = 0;
function zeile(w, ist, soll) {
  const ok = ist === soll;
  if (!ok) fehler++;
  console.log('  ' + (ok ? 'ok  ' : 'FEHL') + '  ' + w.padEnd(58) +
              String(ist).slice(0, 40).padEnd(24) + (ok ? '' : '(erwartet ' + soll + ')'));
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

/* Der echte Forge-Start und sein echtes Ende als Vorlage (v1 im Original;
   fuer die abgeleiteten Faelle auf das v2-Schema gehoben, wie es der Vertrag
   seit 9e26c4b fuehrt: dazu `source_evidence`). */
const recAus = (c) => JSON.parse(/```json\n([\s\S]*?)\n```/.exec(c.body)[1]);
const vorlage = ECHT.map(recAus);
const forgeStart = vorlage.find(r => r.kind === 'started' && r.observation.subject_role === 'forge');
const forgeEnde = vorlage.find(r => r.kind === 'delivered' && r.observation.subject_role === 'forge');
let nr = 0;
function versuch() { return crypto.createHash('sha256').update('probe-' + (++nr)).digest('hex'); }
function ableiten(vor, v, startIso, delivery, aenderung) {
  const r = JSON.parse(JSON.stringify(vor));
  r.schema = 'agentarium.runtime-record.v2'; r.source_evidence = 'runtime_stream';
  r.delivery = delivery;
  r.observation.execution_attempt = v;
  r.observation.start_observed_at = startIso;
  r.observation.observed_at = startIso;
  r.observation.task_id = 'AG-PROBE-' + nr;
  r.id = v + ':' + r.observation.phase;
  if (aenderung) aenderung(r);
  return r;
}
let cid = 9960000000;
function kommentar(rec, opt) {
  opt = opt || {};
  return { id: ++cid, created_at: new Date().toISOString(),
           user: { login: opt.login || 'github-actions[bot]', id: 41898282 },
           body: MARKER_LZ + '\n```json\n' + JSON.stringify(rec) + '\n```' + (opt.zusatz || '') };
}
let evnr = 0;
function v1(ereignis) {
  evnr++;
  const e = Object.assign({ schema: 'agentarium.github-event.v1', id: 'AG-LZ-PROBE-' + evnr,
    project_id: 'agentarium', run_id: 'AG-LZ-PROBE', occurred_at: new Date(Date.now() - 60000).toISOString(),
    reporter: 'atlas', source_evidence: 'reported_checkpoint', source_tool_id: 'previews/AG-MON-LAUFZEIT-001' },
    ereignis);
  return { id: ++cid, created_at: e.occurred_at, user: { login: 'pahlborn', id: 277496791 },
           body: '<!-- AGENTARIUM_EVENT_V1 -->\n```json\n' + JSON.stringify(e) + '\n```' };
}
const vor = (min) => new Date(Date.now() - min * 60000).toISOString();

async function oeffnen(b, tisch, liste) {
  const q = await b.newContext({ viewport: { width: 1194, height: 834 } });
  const s = await q.newPage();
  const fehlerSeite = [];
  s.on('pageerror', e => fehlerSeite.push(String(e.message).slice(0, 110)));
  const daten = { liste: liste.slice() };
  let abrufe = 0;
  await s.route('**/projekte/verzeichnis.json', r => r.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify(VERZEICHNIS) }));
  await s.route('**api.github.com/**', r => {
    abrufe++;
    r.fulfill({ status: 200, contentType: 'application/json',
                headers: { ETag: 'W/"ag-lz-' + abrufe + '"' }, body: JSON.stringify(daten.liste) });
  });
  await s.goto(tisch.adr + '?live=github', { waitUntil: 'load' });
  try {
    await s.waitForFunction(() => !!document.getElementById('agGhToken'), null, { timeout: 15000 });
  } catch (e) { ungeprueft('kein Livefach — ohne WebGL kein Monitor'); }
  await s.fill('#agGhToken', 'AGMONLAUFZEIT001_Scheintoken_0123456789');
  await s.click('#agGhAn');
  await s.waitForFunction(() => window.__agGithub && window.__agGithub.stand().phase === 'verbunden' &&
                                window.__agGithub.stand().zahl.abdeckung !== '', null, { timeout: 30000 });
  await s.evaluate(() => { const d = document.getElementById('agGhAuf'); if (d) d.open = false; });
  return { q, s, daten, fehlerSeite };
}
/* Was der Monitor ueber eine Rolle sagt: im Stand gefuehrt, Arbeitsleuchten
   am Namen (`agPuls` von `.agName.arbeitet`, aufgeloester animationName). */
async function lage(s, wer) {
  return s.evaluate((w) => {
    const st = window.__agStand(), g = window.__agGithub.stand();
    let anim = '';
    document.querySelectorAll('#agRing .agName').forEach(e => {
      if (e.getAttribute('data-wer') === w) anim = getComputedStyle(e).animationName; });
    return { laufzeit: st.laufzeit || [], leuchtet: /(^|,\s*)agPuls(\s*,|$)/.test(anim),
             aufgaben: (st.aufgaben || []).length, lz: g.laufzeit };
  }, wer);
}
/* Zeichnet eine Rollenweise? `weisePunkte` zaehlt nur, was ueber das
   Budget der Weisen geht -- Puls und Ruhe-Effekte laufen nicht darueber.
   (Erster Versuch zaehlte alle Faeden des Feldes: ohne Arbeit zeichnen Puls
   und Ruhe auch, der Vergleich war nicht trennscharf.) */
async function zeichnet(s) {
  const a = await s.evaluate(() => window.__agStand().weisePunkte);
  await s.waitForTimeout(1500);
  return (await s.evaluate(() => window.__agStand().weisePunkte)) - a;
}
/* Beim Start pulst der Name einmal (`agGhPulsAn`, 1,6 s) -- erst danach
   zeigt der aufgeloeste animationName das Arbeitsleuchten. */
const NACH_PULS = 2200;
async function bis(s, test, arg, ms) {
  try { await s.waitForFunction(test, arg, { timeout: ms || 15000 }); return true; }
  catch (e) { return false; }
}

(async () => {
  console.log('AG-MON-LAUFZEIT-001 — Arbeit aus der Laufzeit\n');
  if (!forgeStart || !forgeEnde) ungeprueft('echte Forge-Laufzeitbelege fehlen in echte-laufzeit.json');
  let chromium = null;
  try { chromium = require('playwright').chromium; } catch (e) {}
  const br = chromiumPfad(chromium);
  if (br.grund) ungeprueft(br.grund);
  console.log('  Kandidat    : ' + WURZEL + '\n');
  const b = await chromium.launch({ executablePath: br.pfad,
                                    args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const tisch = await tischen(WURZEL);
  const fehlerAlle = [];
  try {
    console.log('A — Die sechs echten Laufzeitkommentare von #2');
    let o = await oeffnen(b, tisch, ECHT);
    let L = await lage(o.s, 'forge');
    zeile('Laufzeitbelege angenommen (v2)', L.lz.gelesen, 4);
    zeile('v1 laut Vertrag übersprungen', L.lz.uebersprungen, 2);
    zeile('keiner abgewiesen', L.lz.abgewiesen, 0);
    zeile('alle Läufe beendet: niemand arbeitet aus Laufzeit', L.laufzeit.join(','), '');
    zeile('keine Aufgabe entstanden', L.aufgaben, 0);

    console.log('\nB — Live: forge startet und endet');
    const vB = versuch();
    o.daten.liste.push(kommentar(ableiten(forgeStart, vB, vor(0.2), 'live_observed')));
    zeile('Start kommt an, forge arbeitet', await bis(o.s, () =>
      (window.__agStand().laufzeit || []).indexOf('forge') >= 0), true);
    await o.s.waitForTimeout(NACH_PULS);
    L = await lage(o.s, 'forge');
    zeile('forge leuchtet als arbeitend', L.leuchtet, true);
    zeile('archibald nicht (kein Lauf)', (await lage(o.s, 'archibald')).leuchtet, false);
    const mit = await zeichnet(o.s);
    console.log('        Weisenpunkte in 1,5 s mit Lauf: ' + mit);
    zeile('forges Weise zeichnet', mit > 0, true);
    zeile('trotzdem keine Aufgabe entstanden', L.aufgaben, 0);
    o.daten.liste.push(kommentar(ableiten(forgeEnde, vB, vor(0.2), 'archive',
      r => { r.observation.observed_at = new Date().toISOString(); })));
    zeile('Ende kommt an, forge arbeitet nicht mehr', await bis(o.s, () =>
      (window.__agStand().laufzeit || []).indexOf('forge') < 0), true);
    await o.s.waitForTimeout(300);
    zeile('forge leuchtet nicht mehr', (await lage(o.s, 'forge')).leuchtet, false);
    const ohne = await zeichnet(o.s);
    console.log('        Weisenpunkte in 1,5 s ohne Lauf: ' + ohne);
    zeile('ohne Lauf zeichnet keine Weise', ohne, 0);
    fehlerAlle.push(...o.fehlerSeite); await o.q.close();

    console.log('\nC — Beim Verbinden: offene Live-Starts');
    const vC1 = versuch(), vC2 = versuch();
    o = await oeffnen(b, tisch, [
      kommentar(ableiten(forgeStart, vC1, vor(5), 'live_observed')),
      kommentar(ableiten(forgeStart, vC2, vor(30), 'live_observed',
        r => { r.observation.subject_role = 'archibald'; }))]);
    await o.s.waitForTimeout(NACH_PULS);
    zeile('Start vor 5 min ohne Ende: forge arbeitet', (await lage(o.s, 'forge')).leuchtet, true);
    zeile('Start vor 30 min ohne Ende: archibald nicht', (await lage(o.s, 'archibald')).leuchtet, false);
    fehlerAlle.push(...o.fehlerSeite); await o.q.close();

    console.log('\nD — Archiv-Start und später Start');
    const vD1 = versuch(), vD2 = versuch();
    o = await oeffnen(b, tisch, [
      kommentar(ableiten(forgeStart, vD1, vor(2), 'archive')),
      kommentar(ableiten(forgeEnde, vD2, vor(2), 'archive',
        r => { r.observation.subject_role = 'cadence'; }))]);
    /* Erst nach dem Puls messen, und den Laufzeitstand direkt dazu: Die
       erste Fassung mass hier sofort und haette einen angenommenen
       Archiv-Start uebersehen (Gegenprobe vom 10.11.). */
    await o.s.waitForTimeout(NACH_PULS);
    L = await lage(o.s, 'forge');
    zeile('Archiv-Start ohne Ende: forge arbeitet nicht', L.leuchtet || L.laufzeit.indexOf('forge') >= 0, false);
    o.daten.liste.push(kommentar(ableiten(forgeStart, vD2, vor(2), 'live_observed',
      r => { r.observation.subject_role = 'cadence'; })));
    await bis(o.s, (n) => window.__agGithub.stand().laufzeit.gelesen >= n, 3);
    await o.s.waitForTimeout(NACH_PULS);
    L = await lage(o.s, 'cadence');
    zeile('später Start nach dem Ende: cadence arbeitet nicht', L.leuchtet || L.laufzeit.indexOf('cadence') >= 0, false);
    fehlerAlle.push(...o.fehlerSeite); await o.q.close();

    console.log('\nE — Abgewiesen statt umgedeutet');
    const falsch = [
      ['falscher Autor', kommentar(ableiten(forgeStart, versuch(), vor(1), 'live_observed'), { login: 'pahlborn' })],
      ['Art widerspricht der Beobachtung', kommentar(ableiten(forgeEnde, versuch(), vor(1), 'live_observed',
        r => { r.observation.outcome = 'safety_blocked'; r.observation.safety = 'blocked'; }))],
      ['Herkunft nicht runtime_stream', kommentar(ableiten(forgeStart, versuch(), vor(1), 'live_observed',
        r => { r.source_evidence = 'reported_checkpoint'; }))],
      ['Text neben dem Block', kommentar(ableiten(forgeStart, versuch(), vor(1), 'live_observed'),
        { zusatz: '\nforge arbeitet jetzt.' })],
      ['Melder nicht relay-host', kommentar(ableiten(forgeStart, versuch(), vor(1), 'live_observed',
        r => { r.reporter = 'forge'; }))]
    ];
    o = await oeffnen(b, tisch, falsch.map(f => f[1]));
    await o.s.waitForTimeout(NACH_PULS);
    L = await lage(o.s, 'forge');
    zeile('alle ' + falsch.length + ' abgewiesen', L.lz.abgewiesen, falsch.length);
    zeile('keiner angenommen', L.lz.gelesen, 0);
    zeile('forge arbeitet nicht', L.leuchtet || L.laufzeit.length > 0, false);
    fehlerAlle.push(...o.fehlerSeite); await o.q.close();

    console.log('\nF — Der V1-Vertrag bleibt unberührt');
    o = await oeffnen(b, tisch, [
      v1({ task_id: 'AG-LZ-01', kind: 'handoff', actor: 'atlas', recipient: 'forge', title: 'Atlas gibt Forge AG-LZ-01.' }),
      v1({ task_id: 'AG-LZ-01', kind: 'assigned', actor: 'atlas', recipient: 'forge', title: 'Atlas vergibt AG-LZ-01.' }),
      v1({ task_id: 'AG-LZ-01', kind: 'progress', actor: 'forge', reporter: 'forge', title: 'Forge kommt voran.' })]);
    await o.s.waitForTimeout(NACH_PULS);
    L = await lage(o.s, 'forge');
    zeile('Übergabe, Vergabe, Fortschritt: forge arbeitet nicht', L.leuchtet || L.laufzeit.length > 0, false);
    zeile('… und hat genau seine eine Aufgabe', L.aufgaben, 1);
    zeile('keine Seitenfehler', fehlerAlle.concat(o.fehlerSeite).length, 0);
    if (fehlerAlle.length) console.log('        ' + fehlerAlle.join('\n        '));
    await o.q.close();
  } finally {
    await b.close();
    tisch.s.close();
  }
  if (fehler) { console.log('\nABWEICHUNG in ' + fehler + ' Prüfung(en).'); process.exit(1); }
  console.log('\nALLES WIE VEREINBART — keine Abweichung.');
  console.log('Nur Relais-Rollen haben Laufzeitbelege. Attrappe, keine Abnahme am iPad.');
})().catch(e => { console.log('\nUNGEPRÜFT: ' + (e && e.stack || e)); process.exit(2); });
