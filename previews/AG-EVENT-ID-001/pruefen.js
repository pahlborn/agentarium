/* AG-EVENT-ID-001 — Nachweisskript zum Empfängerkandidaten.
 * ==========================================================================
 *
 * STARTBEFEHL, aus der Wurzel des Repositorys:
 *
 *     node previews/AG-EVENT-ID-001/pruefen.js
 *
 * VORAUSSETZUNG — ausdrücklich genannt, weil sie nicht selbstverständlich ist:
 *   • Node.js
 *   • das npm-Paket `playwright` (nur die Bibliothek, KEINE Browser-Installation
 *     durch dieses Skript)
 *   • eine BEREITS VORHANDENE lokale Chromium-Laufzeit
 *
 * Der Pfad zur Chromium-Laufzeit wird in dieser Reihenfolge gesucht:
 *   1. Umgebungsvariable  AG_CHROMIUM=/pfad/zu/chromium
 *   2. $PLAYWRIGHT_BROWSERS_PATH/chromium
 *   3. /opt/pw-browsers/chromium
 * Fehlt sie, bricht das Skript mit einer Meldung ab und meldet Rückgabe 2 --
 * NICHT als bestanden und nicht als durchgefallen, sondern als ungeprüft.
 * Genau daran ist Sentinels Lauf gescheitert; das soll sichtbar bleiben.
 *
 * Das Skript lädt nichts herunter, schreibt nichts ins Repository und
 * veröffentlicht nichts. Es startet einen HTTP-Server auf 127.0.0.1.
 *
 * RÜCKGABE:  0 = alles wie vereinbart · 1 = Abweichung · 2 = ungeprüft
 * ========================================================================== */

const fs = require('fs'), path = require('path'), http = require('http');

const WURZEL = path.resolve(__dirname, '..', '..');
const PILOT  = path.join(WURZEL, 'pilot', 'github-live');
const PORT   = Number(process.env.AG_PORT || 8090);

function chromiumPfad() {
  const k = [process.env.AG_CHROMIUM,
             process.env.PLAYWRIGHT_BROWSERS_PATH
               ? path.join(process.env.PLAYWRIGHT_BROWSERS_PATH, 'chromium') : null,
             '/opt/pw-browsers/chromium'].filter(Boolean);
  for (const p of k) { try { if (fs.existsSync(p)) return p; } catch (e) {} }
  return null;
}

/* ---------------------------------------------------------------- Urteil */
let abweichungen = 0;
function zeile(name, ist, soll) {
  const ok = (ist === soll);
  if (!ok) abweichungen++;
  console.log('  ' + (ok ? 'ok  ' : 'FEHL') + '  ' + name.padEnd(30) +
              String(ist).padEnd(26) + (ok ? '' : 'erwartet: ' + soll));
  return ok;
}

/* ============ A — Kanonische Rückprobe, ohne Browser ====================== */
function holeKanonisch(datei) {
  const s = fs.readFileSync(datei, 'utf8');
  const m = s.match(/function kurzKanonisch\(s\) \{[\s\S]*?\n  \}/);
  if (!m) throw new Error('kurzKanonisch nicht gefunden in ' + datei);
  return new Function('return (' + m[0].replace('function kurzKanonisch', 'function') + ')')();
}

const KANONISCH = [
  ['ID0001', 'ID0001'], ['ID9999', 'ID9999'], ['ID10000', 'ID10000'],
  ['ID123456789012', 'ID123456789012'],
  ['ID00001', ''], ['ID0000', ''], ['ID1', ''], ['ID01', ''],
  ['id0001', ''], ['ID 0001', ''], ['IDx001', ''], ['', ''], ['ID', ''],
  ['ID1234567890123', '']
];

function teilA() {
  console.log('\nA — Kanonische Rückprobe in Adapter und Aufnahme (ohne Browser)');
  console.log('    erwartet: 14 von 14 richtig, beide Umsetzungen identisch\n');
  const a = holeKanonisch(path.join(PILOT, 'github-live.js'));
  const f = holeKanonisch(path.join(PILOT, 'index.html'));
  let gut = 0;
  for (const [ein, soll] of KANONISCH) {
    const ra = a(ein), rf = f(ein);
    if (ra === soll && rf === soll) gut++;
    else { abweichungen++;
      console.log('  FEHL  ' + JSON.stringify(ein) + '  Adapter=' + JSON.stringify(ra) +
                  '  Aufnahme=' + JSON.stringify(rf) + '  erwartet=' + JSON.stringify(soll)); }
  }
  zeile('richtig und identisch', gut + ' von ' + KANONISCH.length,
        KANONISCH.length + ' von ' + KANONISCH.length);
}

/* ============ B und C — im Browser ======================================= */
const GROESSEN = [['Schreibtisch', 1440, 900], ['Tablett quer', 1194, 834],
                  ['Tablett hoch', 834, 1194], ['Telefon quer', 844, 390]];

async function imBrowser(chromium, exe) {
  const TYP = {'.html':'text/html;charset=utf-8', '.js':'text/javascript;charset=utf-8',
               '.json':'application/json', '.webmanifest':'application/manifest+json',
               '.png':'image/png'};
  const srv = http.createServer((q, a) => {
    let u = q.url.split('?')[0]; if (u === '/') u = '/index.html';
    const f = path.join(PILOT, u.replace(/^\/+/, ''));
    if (!f.startsWith(PILOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
      a.writeHead(404); return a.end();
    }
    a.writeHead(200, {'Content-Type': TYP[path.extname(f)] || 'application/octet-stream'});
    fs.createReadStream(f).pipe(a);
  });
  await new Promise(r => srv.listen(PORT, '127.0.0.1', r));
  const b = await chromium.launch({ executablePath: exe,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

  /* ---- B: die elf Fälle am direkten Aufruf ---- */
  console.log('\nB — Direkter Aufruf von __agEreignis, Rückgabe');
  console.log('    erwartet: alle angenommen, ID erhalten, Hinweis NUR bei ungültiger');
  console.log('              Kurzreferenz\n');
  {
    const ctx = await b.newContext({ viewport: {width: 1194, height: 834} });
    const p = await ctx.newPage();
    const konsole = [];
    p.on('console', m => { if (m.type() === 'error') konsole.push(m.text()); });
    await p.goto('http://127.0.0.1:' + PORT + '/?live=github', {waitUntil: 'load'});
    await p.waitForTimeout(2300);
    await p.evaluate(() => { const e = document.querySelector('[data-modus="live"]'); if (e) e.click(); });
    await p.waitForTimeout(400);
    const r = await p.evaluate(() => {
      window.__agLauf({project_id: 'agentarium', titel: 'PRUEFLAUF'});
      const basis = {actor: 'forge', kind: 'progress', title: 'Prueffall', gh_beobachtet: true,
        source_evidence: 'runtime_stream', project_id: 'agentarium', run_id: 'R1',
        task_id: 'T1', source_tool_id: 'W1'};
      const f = [['ohne Feld', undefined, false], ['ID0001', 'ID0001', false],
        ['ID9999', 'ID9999', false], ['ID10000', 'ID10000', false],
        ['ID00001', 'ID00001', true], ['ID0000', 'ID0000', true], ['ID1', 'ID1', true],
        ['Zahl 4711', 4711, true], ['leer', '', true],
        ['Steuerzeichen', 'ID00\u000101', true], ['62 Zeichen', 'ID' + '9'.repeat(60), true]];
      return f.map(([n, v, soll], i) => {
        const ev = Object.assign({}, basis, {id: 'K-' + i,
          occurred_at: '2026-10-18T07:0' + (i % 10) + ':00Z'});
        if (typeof v !== 'undefined') ev.short_ref = v;
        const a = window.__agEreignis(ev);
        return {fall: n, angenommen: !!(a && a.angenommen), id: (a && a.id) || '',
                hinweis: (a && a.hinweis) || '', sollHinweis: soll};
      });
    });
    for (const x of r) {
      const ist = (x.angenommen ? 'angenommen' : 'ABGEWIESEN') +
                  ', ID ' + (x.id ? 'erhalten' : 'FEHLT') +
                  ', Hinweis ' + (x.hinweis ? 'ja' : 'nein');
      zeile(x.fall, ist, 'angenommen, ID erhalten, Hinweis ' + (x.sollHinweis ? 'ja' : 'nein'));
    }
    /* Begrenzung und Maskierung nachweisen */
    const lang = r.find(x => x.fall === '62 Zeichen');
    const steuer = r.find(x => x.fall === 'Steuerzeichen');
    const wert = (h) => h.replace('short_ref verworfen (nicht kanonisch): ', '');
    zeile('62 Zeichen gekürzt auf', wert(lang.hinweis).length + ' Zeichen', '24 Zeichen');
    zeile('Steuerzeichen maskiert', wert(steuer.hinweis), 'ID00.01');
    zeile('Konsolenfehler', konsole.length ? konsole[0].slice(0, 40) : 'keine', 'keine');
    await ctx.close();
  }

  /* ---- C: Anzeige über vier Größen ---- */
  console.log('\nC — Anzeige der Kurzreferenz, vier Bildschirmgrößen');
  console.log('    erwartet: sichtbar, kein Querlauf, keine Konsolenfehler\n');
  for (const [name, w, h] of GROESSEN) {
    const ctx = await b.newContext({ viewport: {width: w, height: h} });
    const p = await ctx.newPage();
    const konsole = [];
    p.on('console', m => { if (m.type() === 'error') konsole.push(m.text()); });
    await p.goto('http://127.0.0.1:' + PORT + '/?live=github', {waitUntil: 'load'});
    await p.waitForTimeout(2300);
    await p.evaluate(() => { const e = document.querySelector('[data-modus="live"]'); if (e) e.click(); });
    await p.waitForTimeout(400);
    await p.evaluate(() => {
      window.__agLauf({project_id: 'agentarium', titel: 'PRUEFLAUF'});
      const o = {actor: 'forge', kind: 'progress', gh_beobachtet: true,
        source_evidence: 'runtime_stream', project_id: 'agentarium', run_id: 'R1',
        task_id: 'T1', source_tool_id: 'W1', id: 'E-ANZ', short_ref: 'ID0042',
        occurred_at: '2026-10-18T07:20:00Z', title: 'Forge · Edit · Arbeitsschritt 7'};
      window.__agEreignis(o);
    });
    await p.waitForTimeout(3200);
    const r = await p.evaluate(() => {
      const z = [...document.querySelectorAll('.agAuf')].pop();
      return {kurz: z && z.querySelector('.agKurz') ? z.querySelector('.agKurz').textContent : '',
              quer: document.documentElement.scrollWidth > window.innerWidth};
    });
    zeile(name + ' ' + w + '×' + h,
          'Kurzref "' + r.kurz + '", Querlauf ' + (r.quer ? 'JA' : 'nein') +
          ', Fehler ' + (konsole.length ? 'JA' : 'nein'),
          'Kurzref "ID0042", Querlauf nein, Fehler nein');
    await ctx.close();
  }
  await b.close(); srv.close();
}

/* ============================================================== Hauptlauf */
(async () => {
  console.log('AG-EVENT-ID-001 — Nachweis des Empfängerkandidaten');
  console.log('Geprüft wird: ' + PILOT);

  let chromium, exe = chromiumPfad();
  try { chromium = require('playwright').chromium; }
  catch (e) {
    console.log('\nUNGEPRÜFT: Das npm-Paket `playwright` fehlt.');
    console.log('Teil A läuft trotzdem; B und C brauchen einen Browser.\n');
  }
  teilA();
  if (!chromium || !exe) {
    console.log('\nUNGEPRÜFT: ' + (!chromium ? 'playwright fehlt.' :
      'keine Chromium-Laufzeit gefunden. Mit AG_CHROMIUM=/pfad/zu/chromium angeben.'));
    console.log('Teil B und C wurden NICHT ausgeführt. Das ist kein Bestehen.');
    process.exit(2);
  }
  await imBrowser(chromium, exe);

  console.log('\n' + (abweichungen === 0
    ? 'ALLES WIE VEREINBART — keine Abweichung.'
    : abweichungen + ' ABWEICHUNG(EN).'));
  console.log('Alle Prüfungen sind synthetisch. Keine Kunden-Live-Abnahme.');
  process.exit(abweichungen === 0 ? 0 : 1);
})().catch(e => { console.error('\nFEHLER im Prüflauf: ' + e.message); process.exit(1); });
