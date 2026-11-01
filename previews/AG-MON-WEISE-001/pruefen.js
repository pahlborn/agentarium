/* AG-MON-WEISE-001 — Effekte je Agent, je Aufgabe und im Leerlauf.

   Aufruf:            node previews/AG-MON-WEISE-001/pruefen.js
   Eigener Browser:   AG_CHROMIUM=/pfad/zur/datei node previews/...
   Aufnahmen ablegen: AG_AUFNAHMEN=/verzeichnis node previews/...
   Rueckgabe: 0 = bestanden, 1 = Abweichung, 2 = ungeprueft.

   PETER, 29.10.: Vorschlag AG-MON-WEISE-001 "gut, lass uns es versuchen".
   Gemessen wird am Feld (`__feld.strang/knoten/austreiben/sonne`) und an
   der Messsonde (`weisePunkte`, `leerlauf`).

     A  alle neun Rollen arbeiten zugleich: ihre Weisen bleiben zusammen im
        Budget eines Balls (98 je Bild)
     B  die neuen Weisen zeichnen: Atlas (dirigieren), Lot (zeichnen),
        Argus ohne Stueck (Blick)
     C  Arbeitseffekte nur, wer wirklich arbeitet: bei bloss vergebener
        Aufgabe keine Weise und kein Arbeitsleuchten am Namen
     D  Aufgabenart: Peters Annahme hinterlaesst goldenen Niederschlag
        (Knoten mit Abgabe bei Peter), Blockade einen Stoss mit Funken
     E  Ruhe (niemand arbeitet): nach einer Weile einzeln Komet, Wirbel,
        Knoten oder Korn mit Funken, mit Pausen, nie zweimal dasselbe;
        ein Finger beendet sie; arbeitet jemand, bleibt sie aus
     F  liegende Baelle sind kleiner (70 %), der Flug bleibt
     G  liegende Baelle funken ab und zu, jeder in seinem Takt -- vorbei-
        ziehende Faeden lassen sie nicht mehr dauernd zerspringen

   GRENZEN: Attrappe, Probekoerper. Ob es "anregend schoen" ist und die
   Rollen erkennbar sind, entscheidet Peter am iPad.                      */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os');

const ZIEL = process.env.AG_ZIEL || 'pilot/github-live';
const WURZEL = path.resolve(__dirname, '..', '..', ...ZIEL.split('/'));
const AUFNAHMEN = process.env.AG_AUFNAHMEN ||
  fs.mkdtempSync(path.join(os.tmpdir(), 'ag-weise-'));
const VERZEICHNIS = {
  schema: 'agentarium.projektverzeichnis.v1', gepflegt_von: 'atlas',
  projekte: [{ id: 'agentarium', kuerzel: 'AG', name: 'Agentarium', repo: 'pahlborn/agentarium' }]
};
let fehler = 0;
function zeile(w, ist, soll) {
  const ok = ist === soll;
  if (!ok) fehler++;
  console.log('  ' + (ok ? 'ok  ' : 'FEHL') + '  ' + w.padEnd(48) +
              String(ist).slice(0, 60).padEnd(34) + (ok ? '' : '(erwartet ' + soll + ')'));
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
function kommentar(min, ereignis) {
  nr++;
  const zeit = new Date(Date.now() - min * 60000 + nr).toISOString();
  const e = Object.assign({
    schema: 'agentarium.github-event.v1', id: 'AG-WEISE-EREIGNIS-' + nr,
    project_id: 'agentarium', run_id: 'AG-WEISE-L1', occurred_at: zeit, reporter: 'atlas',
    source_evidence: 'reported_checkpoint', source_tool_id: 'previews/AG-MON-WEISE-001'
  }, ereignis);
  return { id: 9999000000 + nr, created_at: zeit,
           user: { login: 'pahlborn', id: 277496791 },
           body: '<!-- AGENTARIUM_EVENT_V1 -->\n```json\n' + JSON.stringify(e, null, 2) +
                 '\n```\nProbe aus AG-MON-WEISE-001, kein echter Auftrag.' };
}
/* Vergeben (von atlas gemeldet) und, wenn verlangt, begonnen (Selbstauskunft). */
function arbeit(wer, begonnen, min) {
  const t = 'T-' + wer;
  const r = [kommentar(min || 30, { task_id: t, kind: 'assigned', actor: 'atlas', recipient: wer,
                                    item_type: 'task', title: 'Atlas vergibt an ' + wer + '.' })];
  if (begonnen) r.push(kommentar((min || 30) - 0.5, { task_id: t, kind: 'started', actor: wer,
                                    reporter: wer, title: wer + ' beginnt.' }));
  return r;
}
const ALLE = ['nova', 'scout', 'archibald', 'forge', 'argus', 'sentinel', 'cadence', 'atlas', 'lot'];

async function seite(b, tisch, liste, funkenZaehlen) {
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
                headers: { ETag: 'W/"ag-weise-' + abrufe + '"' }, body: JSON.stringify(liste) });
  });
  /* Fuer G: jeden Funkenausbruch zaehlen. Das Feld schreibt `PULS.funken`
     bei jedem Ausbruch neu; `window.PULS` wird vor der Seite angelegt und
     von ihr uebernommen (`window.PULS || ...`). */
  if (funkenZaehlen) await s.addInitScript(() => {
    window.__funkenAusbrueche = 0;
    window.PULS = new Proxy({}, { set(t, k, v) {
      if (k === 'funken') window.__funkenAusbrueche++;
      t[k] = v; return true; } });
  });
  await s.goto(tisch.adr + '?live=github', { waitUntil: 'load' });
  await s.waitForTimeout(2200);
  if (!await s.evaluate(() => !!document.getElementById('agGhToken')))
    ungeprueft('kein Livefach — ohne WebGL kein Monitor');
  await s.fill('#agGhToken', 'AGMONWEISE001_Scheintoken_0123456789abc');
  await s.click('#agGhAn');
  await s.waitForTimeout(3500);
  await s.evaluate(() => { const d = document.getElementById('agGhAuf'); if (d) d.open = false; });
  await s.waitForTimeout(800);
  return { q, s, seitenFehler };
}
/* Weisepunkte je Bild ueber `ms` Millisekunden. */
async function weiseJeBild(s, ms) {
  return s.evaluate((dauer) => new Promise(fertig => {
    const a = window.__agStand().weisePunkte; let bilder = 0, aus = false;
    const takt = () => { if (aus) return; bilder++; requestAnimationFrame(takt); };
    requestAnimationFrame(takt);
    setTimeout(() => { aus = true; fertig((window.__agStand().weisePunkte - a) / Math.max(1, bilder)); }, dauer);
  }), ms);
}

(async () => {
  console.log('AG-MON-WEISE-001 — Effekte je Agent, je Aufgabe und im Leerlauf\n');
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
    console.log('A — Alle neun Rollen arbeiten zugleich');
    let r = await seite(b, tisch, [].concat(...ALLE.map(w => arbeit(w, true))));
    let st = await r.s.evaluate(() => window.__agStand());
    zeile('neun arbeiten', (st.arbeiten || []).length, 9);
    let jeBild = await weiseJeBild(r.s, 3000);
    console.log('        ' + jeBild.toFixed(1) + ' Weisepunkte je Bild');
    zeile('zusammen höchstens ein Ball (≤ 100 je Bild)', jeBild <= 100, true);
    zeile('… und nicht still (> 20 je Bild)', jeBild > 20, true);
    await r.s.screenshot({ path: path.join(AUFNAHMEN, '1-alle-arbeiten.jpg'), type: 'jpeg', quality: 80 });
    zeile('keine Seitenfehler', r.seitenFehler.length, 0);
    await r.q.close();

    console.log('\nB — Die neuen Weisen zeichnen');
    for (const w of ['atlas', 'lot', 'argus']) {
      r = await seite(b, tisch, arbeit(w, true));
      jeBild = await weiseJeBild(r.s, 2600);
      zeile(w + ' zeichnet seine Weise', jeBild > 0, true);
      if (w === 'atlas') await r.s.screenshot({ path: path.join(AUFNAHMEN, '2-atlas-dirigiert.jpg'), type: 'jpeg', quality: 80 });
      await r.q.close();
    }

    /* C: Peter, 31.10.: "Arbeitseffekte sollten bei allen Agenten nur
       erscheinen, sobald sie arbeiten. Ansonsten Puls." Bis Fassung 98 lief
       die Weise bei bloss vergebener Aufgabe leise mit (bei Scout stroemte
       es dadurch dauernd). */
    console.log('\nC — Nur vergeben: keine Weise, kein Arbeitsleuchten');
    r = await seite(b, tisch, arbeit('scout', true));
    const voll = await weiseJeBild(r.s, 3000);
    const lichtVoll = await r.s.evaluate(() => document.querySelector('#agRing .agName[data-wer="scout"]').classList.contains('arbeitet'));
    await r.q.close();
    r = await seite(b, tisch, arbeit('scout', false));
    const leise = await weiseJeBild(r.s, 3000);
    const lichtLeise = await r.s.evaluate(() => document.querySelector('#agRing .agName[data-wer="scout"]').classList.contains('arbeitet'));
    await r.q.close();
    console.log('        Scout begonnen ' + voll.toFixed(1) + ', nur vergeben ' + leise.toFixed(1) + ' Weisepunkte je Bild');
    zeile('begonnen: Weise läuft', voll > 0, true);
    zeile('nur vergeben: keine Weise', leise, 0);
    zeile('begonnen: Name leuchtet als arbeitend', lichtVoll, true);
    zeile('nur vergeben: Name nicht als arbeitend', lichtLeise, false);
    console.log('\nD — Ausdruck der Aufgabenart');
    const liste = [kommentar(30, { run_id: 'AG-WEISE-L9', task_id: 'P1', kind: 'handoff', actor: 'peter',
                                   recipient: 'atlas', title: 'Peter gibt Atlas: P1' }),
                   kommentar(29, { run_id: 'AG-WEISE-L9', task_id: 'P1', kind: 'contribution', actor: 'atlas',
                                   recipient: 'peter', title: 'zurück' })];
    r = await seite(b, tisch, liste);
    await r.s.evaluate(() => {
      window.__aufruf = [];
      const F = window.__feld, k = F.knoten, a = F.austreiben;
      F.knoten = function (x, y, h, ton, abgabe, n, d) { window.__aufruf.push({ f: 'knoten', x, y, ton, abgabe, n }); return k.apply(this, arguments); };
      F.austreiben = function () { window.__aufruf.push({ f: 'austreiben' }); return a.apply(this, arguments); };
    });
    liste.push(kommentar(0, { run_id: 'AG-WEISE-L9', task_id: 'P1', kind: 'accepted', actor: 'peter',
                              title: 'Peter nimmt an: P1' }));
    for (let i = 0; i < 40; i++) {
      await r.s.waitForTimeout(150);
      if (await r.s.evaluate(() => window.__aufruf.some(c => c.f === 'knoten' && c.abgabe > 0))) break;
    }
    const nieder = await r.s.evaluate(() => {
      const P = window.__aufruf.find(c => c.f === 'knoten' && c.abgabe > 0);
      const st = window.__agStand();
      return P ? { gold: Math.abs(P.ton - 0.115) < 0.01, n: P.n } : null;
    });
    zeile('Annahme: Niederschlag (Knoten mit Abgabe)', !!nieder, true);
    zeile('… golden, kräftig', !!nieder && nieder.gold && nieder.n >= 100, true);
    liste.push(kommentar(0, { run_id: 'AG-WEISE-L9', task_id: 'T-forge', kind: 'assigned', actor: 'atlas',
                              recipient: 'forge', item_type: 'task', title: 'Atlas vergibt an forge.' }),
               kommentar(0, { run_id: 'AG-WEISE-L9', task_id: 'T-forge', kind: 'started', actor: 'forge',
                              reporter: 'forge', title: 'forge beginnt.' }),
               kommentar(0, { run_id: 'AG-WEISE-L9', task_id: 'T-forge', kind: 'blocked', actor: 'forge',
                              reporter: 'forge', blocker_id: 'K1', title: 'forge klemmt.' }));
    for (let i = 0; i < 40; i++) {
      await r.s.waitForTimeout(150);
      if (await r.s.evaluate(() => window.__aufruf.some(c => c.f === 'austreiben'))) break;
    }
    zeile('Blockade: Stoß mit Funken', await r.s.evaluate(() => window.__aufruf.some(c => c.f === 'austreiben')), true);
    zeile('keine Seitenfehler', r.seitenFehler.length, 0);
    await r.q.close();

    /* E: DIE RUHE. Peter, 31.10.: Meine Linien aus Fassung 96/97 waren
       "schrecklich, ja unbedingt weg". Stattdessen, wenn niemand arbeitet:
       ab und zu ein Komet, ein Wirbel, ein Knoten, Korn und Funken -- "aber
       bitte nicht zu unruhig und zu schnell hintereinander". */
    console.log('\nE — Ruhe: Komet, Wirbel, Knoten, Korn — einzeln, mit Pausen');
    r = await seite(b, tisch, [kommentar(30, { task_id: 'Z', kind: 'progress', actor: 'scout',
                                               reporter: 'scout', title: 'Scout meldet etwas.' })]);
    await r.s.bringToFront();
    /* Was die Ruhe ins Feld setzt: Aufrufe an das Feld, waehrend sie laeuft.
       Die Markierung setzt die Abfrage unten (billig fuer die Haken). */
    await r.s.evaluate(() => {
      window.__ruheAn = false; window.__ruheAufrufe = 0;
      const F = window.__feld;
      ['strang', 'knoten', 'sonne', 'kern'].forEach(n => {
        const o = F[n];
        F[n] = function () { if (window.__ruheAn) window.__ruheAufrufe++; return o.apply(this, arguments); };
      });
    });
    const t0 = Date.now(), starts = [];
    let vorher = '';
    while (starts.length < 2 && Date.now() - t0 < 70000) {
      const x = await r.s.evaluate(() => { const n = window.__agStand().leerlauf; window.__ruheAn = !!n; return { n, t: performance.now() / 1000 }; });
      /* Seitenuhr: Sekunden seit dem Laden -- die Ruhe zaehlt ab dort bzw.
         ab dem letzten Ereignis, nicht ab dem Ende dieses Aufbaus. */
      if (x.n && !vorher) starts.push({ art: x.n, t: x.t });
      if (x.n && starts.length === 1 && !fs.existsSync(path.join(AUFNAHMEN, '3-ruhe.png'))) {
        await r.s.waitForTimeout(900);
        await r.s.screenshot({ path: path.join(AUFNAHMEN, '3-ruhe.png') });
      }
      vorher = x.n;
      await r.s.waitForTimeout(200);
    }
    const aufrufe = await r.s.evaluate(() => window.__ruheAufrufe);
    console.log('        Ruhe: ' + starts.map(z => z.art + ' bei ' + z.t.toFixed(1) + ' s').join(', ') +
                '; ' + aufrufe + ' Aufrufe ans Feld');
    zeile('Ruhe beginnt erst nach einer Weile (≥ 11 s nach dem Laden)', !!starts[0] && starts[0].t >= 11, true);
    zeile('… mit einem Resonanz-Effekt', starts.length > 0 &&
          starts.every(z => ['komet', 'wirbel', 'knoten', 'korn'].includes(z.art)), true);
    zeile('… der im Feld erscheint', aufrufe > 0, true);
    zeile('nicht zu schnell hintereinander (≥ 12 s Abstand)',
          starts.length === 2 && starts[1].t - starts[0].t >= 12, true);
    zeile('nie zweimal dasselbe hintereinander', starts.length === 2 && starts[0].art !== starts[1].art, true);
    for (let i = 0; i < 150 && !(await r.s.evaluate(() => window.__agStand().leerlauf)); i++)
      await r.s.waitForTimeout(200);
    await r.s.mouse.move(100, 400); await r.s.mouse.down(); await r.s.mouse.up();
    await r.s.waitForTimeout(150);
    zeile('ein Finger beendet die Ruhe sofort', await r.s.evaluate(() => window.__agStand().leerlauf), '');
    zeile('keine Seitenfehler', r.seitenFehler.length, 0);
    await r.q.close();
    /* Arbeitet jemand, gibt es keine Ruhe-Effekte. */
    r = await seite(b, tisch, arbeit('forge', true));
    await r.s.bringToFront();
    await r.s.waitForTimeout(16000);
    zeile('arbeitet jemand, bleibt die Ruhe aus', await r.s.evaluate(() => window.__agStand().leerlaufAnzahl), 0);
    await r.q.close();
    console.log('\nF — Liegende Bälle kleiner, Flug bleibt');
    r = await seite(b, tisch, [kommentar(30, { task_id: 'B1', kind: 'handoff', actor: 'peter',
                                               recipient: 'atlas', title: 'Peter gibt Atlas: B1' })]);
    const rMax = await r.s.evaluate(() => new Promise(fertig => {
      const F = window.__feld, alt = F.sonne; let m = 0;
      F.sonne = function (x, y, gx, gy, rr) { if (gx === 0 && gy === 0 && rr > m) m = rr; return alt.apply(this, arguments); };
      setTimeout(() => { F.sonne = alt; fertig(m); }, 1500);
    }));
    const soll = Math.min(1194, 834) * 0.021 * 0.7 * 1.75 * 1.1;
    console.log('        größter Radius eines liegenden Balls: ' + rMax.toFixed(1) + ' px (Grenze ' + soll.toFixed(1) + ')');
    zeile('liegender Ball höchstens 70 % (mit Atmen)', rMax > 0 && rMax <= soll, true);
    await r.q.close();

    /* G: Peter, 31.10.: "die Bälle bei Peter müssten nicht so immens im
       Millisekunden-Takt explodieren. Bei jedem Ball ab und zu ist ok."
       Gezählt werden Funkenausbrüche (nicht Bilder: der Prüfrechner zeichnet
       nur etwa 11 je Sekunde, dort hat fast jedes Bild Funken vom Finger).
       Dieselben Fingerzüge laufen einmal mit drei Bällen bei Peter und
       einmal ohne Ball; was die Bälle auslösen, ist der Unterschied. */
    console.log('\nG — Funken an liegenden Bällen: ab und zu, nicht dauernd');
    const drei = [];
    for (const L of ['1', '2', '3']) {
      drei.push(kommentar(40 - +L, { run_id: 'AG-WEISE-F' + L, task_id: 'F' + L, kind: 'handoff', actor: 'peter',
                                     recipient: 'atlas', title: 'Peter gibt Atlas: F' + L }));
      drei.push(kommentar(30 - +L, { run_id: 'AG-WEISE-F' + L, task_id: 'F' + L, kind: 'contribution', actor: 'atlas',
                                     recipient: 'peter', title: 'zurück F' + L }));
    }
    const ausbrueche = (s) => s.evaluate(() => window.__funkenAusbrueche || 0);
    const fingerZuege = async (s) => {
      const a = await ausbrueche(s);
      for (let k = 0; k < 14; k++) {
        await s.mouse.move(150, 150); await s.mouse.down();
        await s.mouse.move(700, 700, { steps: 6 }); await s.mouse.up();
        await s.waitForTimeout(700);
      }
      return (await ausbrueche(s)) - a;
    };
    r = await seite(b, tisch, drei, true);
    await r.s.bringToFront();
    let a0 = await ausbrueche(r.s);
    await r.s.waitForTimeout(20000);
    const still = (await ausbrueche(r.s)) - a0;
    const mitBaellen = await fingerZuege(r.s);
    const fehlerG = r.seitenFehler.length;
    await r.q.close();
    r = await seite(b, tisch, [kommentar(30, { task_id: 'Z', kind: 'progress', actor: 'scout',
                                               reporter: 'scout', title: 'Scout meldet etwas.' })], true);
    await r.s.bringToFront();
    const ohneBall = await fingerZuege(r.s);
    await r.q.close();
    const durchBaelle = mitBaellen - ohneBall;
    console.log('        Funkenausbrüche: ohne Finger ' + still + ' in 20 s (drei Bälle); Fingerzüge mit Bällen ' +
                mitBaellen + ', ohne Ball ' + ohneBall + ' -> durch die Bälle ' + durchBaelle);
    /* Ein Funke von selbst sind drei Ausbrueche (`__funkeAn`). */
    zeile('ab und zu ein Funke (3–45 Ausbrüche in 20 s)', still >= 3 && still <= 45, true);
    /* Lokal 31.10.: Fassung 97 21 (fast nur die eigenen Funken der Baelle),
       Fassung 95 15.202. */
    zeile('Fäden lassen Bälle nicht zerspringen (≤ 150)', durchBaelle <= 150, true);
    zeile('keine Seitenfehler', fehlerG, 0);
  } finally {
    await b.close();
    tisch.s.close();
  }
  if (fehler) { console.log('\nABWEICHUNG in ' + fehler + ' Prüfung(en).'); process.exit(1); }
  console.log('\nALLES WIE VEREINBART — keine Abweichung.');
  console.log('Erkennbarkeit und Schönheit entscheidet Peter am iPad.');
})().catch(e => { console.log('\nUNGEPRÜFT: ' + (e && e.stack || e)); process.exit(2); });