/* AG-MON-ARCHIV-002 — Lieferung 1: Hinweis, wenn #2 voll wird (Teil B), und
   die Aktivitaetsleiste im Archiv (Teil D).

   Aufruf:            node previews/AG-MON-ARCHIV-002/pruefen.js
   Eigener Browser:   AG_CHROMIUM=/pfad/zur/datei node previews/...
   Aufnahmen ablegen: AG_AUFNAHMEN=/verzeichnis node previews/...
   Rueckgabe: 0 = bestanden, 1 = Abweichung, 2 = ungeprueft.

   PETER, 28.10. (handoffs/AG-MON-ARCHIV-002-archivpflege-konzept-v1.md):
     B  ab 70 % (3.500 Kommentare auf #2) ein ruhiger Hinweis, ab 90 %
        (4.500) ein deutlicher, darunter nichts -- im Blatt oben rechts und in
        der GitHub-Tafel; dazu die Verbindungsdauer, ab 5 s ein Hinweis.
        Kein Blinken im Feld.
     D  im Archiv eine Leiste am unteren Rand, je Tag ein Balken nach Zahl der
        Meldungen, eine Marke fuer die aktuelle Stelle. Antippen/Ziehen
        springt dorthin: Stand falten wie beim Verbinden, dann weiterspielen.
        Tempo, Halt, Von vorn bleiben. Antippen eines Tages zeigt kurz Datum
        und Laeufe (Bezeichnung aus dem Anstoss).

   Abnahme B: bei 3.500 der ruhige Hinweis, bei 4.500 der deutliche, bei
   3.499 keiner. Abnahme D: Antippen eines Tages springt dorthin; der Stand
   entspricht dem beim Verbinden zu diesem Zeitpunkt.

   WIE GEWARTET WIRD. Auf den Zustand, nicht auf feste Zeiten (Lehre aus
   AG-CI-NACHWEISE-003): `waitForFunction` bis die Verbindung steht, bis das
   Archiv eine bestimmte Stelle erreicht hat. Feste Pausen nur dort, wo
   gerade das Ausbleiben gemessen wird (Halt).

   BEDIENT OHNE HOVER. Die Leiste wird mit dem Touchscreen angetippt (Kontext
   mit `hasTouch`); das Ziehen mit Zeigerereignissen der Art `touch`.

   GRENZEN: Attrappe mit Scheintoken, Probekoerper, Verzeichnis als Attrappe.
   Keine Abnahme am iPad.                                                  */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os');

const ZIEL = process.env.AG_ZIEL || 'pilot/github-live';
const WURZEL = path.resolve(__dirname, '..', '..', ...ZIEL.split('/'));
const AUFNAHMEN = process.env.AG_AUFNAHMEN ||
  fs.mkdtempSync(path.join(os.tmpdir(), 'ag-mon-archiv-002-'));
const VERZEICHNIS = {
  schema: 'agentarium.projektverzeichnis.v1', gepflegt_von: 'atlas',
  projekte: [
    { id: 'agentarium', kuerzel: 'AG', name: 'Agentarium', repo: 'pahlborn/agentarium' },
    { id: 'gt40', kuerzel: 'GT', name: 'GT40 Baubuch', repo: null }
  ]
};
const QUER = { width: 1194, height: 834 }, HOCH = { width: 834, height: 1194 };

let fehler = 0;
function zeile(w, ist, soll) {
  const ok = ist === soll;
  if (!ok) fehler++;
  console.log('  ' + (ok ? 'ok  ' : 'FEHL') + '  ' + w.padEnd(56) +
              String(ist).slice(0, 60).padEnd(30) + (ok ? '' : '(erwartet ' + soll + ')'));
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

/* Prosa ohne Marker: belegt Platz auf #2 wie jeder Kommentar. */
function prosa(n) {
  const r = [];
  for (let i = 1; i <= n; i++)
    r.push({ id: 9930000000 + i, created_at: '2026-10-20T10:00:00Z',
             user: { login: 'pahlborn', id: 277496791 }, body: 'Probe ' + i + ' ohne Marker.' });
  return r;
}
let nr = 0;
function kommentar(zeit, ereignis) {
  nr++;
  const e = Object.assign({
    schema: 'agentarium.github-event.v1', id: 'AG-ARCHIV2-EREIGNIS-' + nr,
    occurred_at: zeit, reporter: 'atlas',
    source_evidence: 'reported_checkpoint', source_tool_id: 'previews/AG-MON-ARCHIV-002'
  }, ereignis);
  return { id: 9940000000 + nr, created_at: zeit,
           user: { login: 'pahlborn', id: 277496791 },
           body: '<!-- AGENTARIUM_EVENT_V1 -->\n```json\n' + JSON.stringify(e, null, 2) +
                 '\n```\nProbe aus AG-MON-ARCHIV-002, kein echter Auftrag.' };
}
/* Ortszeit dieses Rechners, wie die Leiste sie liest. */
function tagZeit(vorTagen, std, min) {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - vorTagen, std, min).toISOString();
}
function tagName(vorTagen) {
  const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - vorTagen);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' +
         String(d.getDate()).padStart(2, '0');
}

const stand = (s) => s.evaluate(() => (window.__agStand && window.__agStand()) || {});
const gh = (s) => s.evaluate(() => (window.__agGithub && window.__agGithub.stand()) || {});
const sichtbar = (s, sel) => s.evaluate(q => { const e = document.querySelector(q);
  return !!e && getComputedStyle(e).display !== 'none'; }, sel);
const tippen = (s, sel) => s.evaluate(q => { const e = document.querySelector(q);
  if (e) e.click(); return !!e; }, sel);
const text = (s, sel) => s.evaluate(q => { const e = document.querySelector(q);
  return e ? e.textContent : ''; }, sel);
/* Der Stand, den das Original zeigt: liegende Baelle und Aufgaben. */
function lage(st) {
  const b = (st.liegend || []).map(l => l.aufgabe + '@' + l.bei + (l.teil ? '(teil)' : '')).sort();
  const a = (st.aufgaben || []).map(x => x.wer + ':' + x.aufgabe + ':' + x.zustand).sort();
  return 'Bälle ' + b.join(',') + ' | Aufgaben ' + a.join(',');
}

async function oeffnen(b, tisch, opt) {
  const q = await b.newContext({ viewport: opt.viewport || QUER, hasTouch: !!opt.touch });
  const s = await q.newPage();
  const seitenFehler = [];
  s.on('pageerror', e => seitenFehler.push(String(e.message).slice(0, 110)));
  const daten = { liste: opt.kommentare, verzoegerung: opt.verzoegerung || 0 };
  await s.route('**/projekte/verzeichnis.json', r => r.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify(VERZEICHNIS) }));
  let abrufe = 0;
  await s.route('**api.github.com/**', async r => {
    abrufe++;
    const m = /[?&]page=(\d+)/.exec(r.request().url());
    const seite = m ? +m[1] : 1;
    if (daten.verzoegerung) await new Promise(x => setTimeout(x, daten.verzoegerung));
    r.fulfill({ status: 200, contentType: 'application/json',
                headers: { ETag: 'W/"ag-archiv2-' + abrufe + '"' },
                body: JSON.stringify(daten.liste.slice((seite - 1) * 100, seite * 100)) });
  });
  await s.goto(tisch.adr + '?live=github', { waitUntil: 'load' });
  try {
    await s.waitForFunction(() => !!document.getElementById('agGhToken'), null, { timeout: 15000 });
  } catch (e) { ungeprueft('kein Livefach — ohne WebGL kein Monitor'); }
  await s.fill('#agGhToken', 'AGMONARCHIV002_Scheintoken_0123456789ab');
  await s.click('#agGhAn');
  await s.waitForFunction(() => window.__agGithub && window.__agGithub.stand().phase === 'verbunden',
                          null, { timeout: 90000 });
  /* Die Wiederherstellung laeuft am Ende des Aufbaus; erst danach zaehlt. */
  await s.waitForFunction(() => window.__agGithub.stand().zahl.abdeckung !== '', null,
                          { timeout: 15000 });
  return { q, s, daten, seitenFehler };
}

(async () => {
  console.log('AG-MON-ARCHIV-002 — Hinweis bei vollem #2 und Aktivitätsleiste im Archiv\n');
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
  const alleFehler = [];
  try {
    /* ============================== TEIL B ============================== */
    /* Der Hinweis hat zwei Teile, je eine Regel: die Zahl der Meldungen und
       die Verbindungsdauer, verbunden mit " · ". Geprueft wird jeder Teil
       fuer sich -- schon 35 Seiten gegen die lokale Attrappe brauchten am
       28.10. 5,8 s, der Dauerhinweis darf also neben der Zahl stehen. */
    const teil = (t, w) => (t || '').split(' · ').filter(x => w === 'zahl'
      ? /^Meldungen:/.test(x) : /^Verbinden dauerte/.test(x)).join('');
    const platz = async (s) => ({
      tafel: await sichtbar(s, '#agGhPlatz') ? await text(s, '#agGhPlatz') : '',
      tafelStufe: await s.evaluate(() => (document.getElementById('agGhPlatz') || {}).getAttribute
        ? document.getElementById('agGhPlatz').getAttribute('data-stufe') : ''),
      blatt: await text(s, '#agWas .wPlatz'),
      blattStufe: await s.evaluate(() => { const e = document.querySelector('#agWas .wPlatz');
        return e ? e.getAttribute('data-stufe') : ''; })
    });
    const ruhe = (s) => s.evaluate(() => [document.getElementById('agGhPlatz'),
      document.querySelector('#agWas .wPlatz')].filter(Boolean).map(e => {
        const c = getComputedStyle(e); return c.animationName + '/' + c.transitionDuration; }).join(' '));

    console.log('B1 — 3.499 Kommentare: kein Hinweis');
    let o = await oeffnen(b, tisch, { kommentare: prosa(3499) });
    let g = await gh(o.s), p = await platz(o.s);
    zeile('gelesen', g.zahl.kommentareGesamt, 3499);
    console.log('        Verbindungsdauer gemessen: ' + g.zahl.verbindenMs + ' ms');
    zeile('Tafel: kein Hinweis zur Zahl', teil(p.tafel, 'zahl'), '');
    zeile('Blatt: kein Hinweis zur Zahl', teil(p.blatt, 'zahl'), '');
    zeile('Dauerhinweis genau dann, wenn ≥ 5 s', !!teil(p.tafel, 'dauer'), g.zahl.verbindenMs >= 5000);
    zeile('sonst nichts in der Tafel', p.tafel.replace(teil(p.tafel, 'dauer'), ''), '');

    console.log('\nB2 — derselbe Stand, ein neuer Kommentar kommt live dazu: 3.500');
    o.daten.liste = prosa(3500);
    await o.s.waitForFunction(() => window.__agGithub.stand().zahl.kommentareGesamt === 3500,
                              null, { timeout: 20000 });
    p = await platz(o.s);
    zeile('Tafel: ruhiger Hinweis', teil(p.tafel, 'zahl'), 'Meldungen: 3.500 von 5.000 — Aufräumen empfohlen');
    zeile('Tafel: Stufe', p.tafelStufe, 'ruhig');
    zeile('Blatt: derselbe Hinweis', teil(p.blatt, 'zahl'), 'Meldungen: 3.500 von 5.000 — Aufräumen empfohlen');
    zeile('Blatt: Stufe', p.blattStufe, 'ruhig');
    alleFehler.push(...o.seitenFehler); await o.q.close();

    for (const [vp, name] of [[QUER, 'quer'], [HOCH, 'hoch']]) {
      console.log('\nB3 — 4.500 Kommentare: deutlicher Hinweis (iPad ' + name + ')');
      o = await oeffnen(b, tisch, { kommentare: prosa(4500), viewport: vp, touch: true });
      p = await platz(o.s);
      zeile('Tafel: deutlicher Hinweis', teil(p.tafel, 'zahl'), 'Meldungen: 4.500 von 5.000 — fast voll, bitte aufräumen');
      zeile('Blatt: derselbe Hinweis', p.blatt, p.tafel);
      zeile('Tafel: Stufe', p.tafelStufe, 'deutlich');
      zeile('Blatt: Stufe', p.blattStufe, 'deutlich');
      zeile('Tafel zugeklappt, Hinweis trotzdem zu sehen',
            await o.s.evaluate(() => !document.getElementById('agGhAuf').open &&
              document.getElementById('agGhPlatz').getBoundingClientRect().height > 0), true);
      zeile('kein Blinken: keine Animation, kein Übergang', await ruhe(o.s), 'none/0s none/0s');
      /* Blatt oben rechts antippen -- mit dem Finger, nicht mit der Maus. */
      const k = await o.s.evaluate(() => { const r = document.getElementById('agKopf').getBoundingClientRect();
        return [r.left + r.width / 2, r.top + r.height / 2]; });
      await o.s.touchscreen.tap(k[0], k[1]);
      await o.s.waitForFunction(() => document.getElementById('agWas').classList.contains('auf'),
                                null, { timeout: 5000 });
      zeile('Blatt offen, Hinweis darin sichtbar',
            await o.s.evaluate(() => { const e = document.querySelector('#agWas .wPlatz');
              return !!e && e.getBoundingClientRect().height > 0; }), true);
      await o.s.screenshot({ path: path.join(AUFNAHMEN, 'B-deutlich-' + name + '.png') });
      alleFehler.push(...o.seitenFehler); await o.q.close();
    }

    console.log('\nB4 — langsames Verbinden (drei Seiten zu je 2 s)');
    o = await oeffnen(b, tisch, { kommentare: prosa(250), verzoegerung: 2000 });
    g = await gh(o.s); p = await platz(o.s);
    console.log('        Verbindungsdauer gemessen: ' + g.zahl.verbindenMs + ' ms');
    zeile('mindestens 5 s', g.zahl.verbindenMs >= 5000, true);
    zeile('Tafel: Hinweis auf die Dauer', /^Verbinden dauerte \d+,\d s — Aufräumen empfohlen$/.test(p.tafel), true);
    zeile('Tafel: ruhig', p.tafelStufe, 'ruhig');
    zeile('Blatt: derselbe Hinweis', p.blatt, p.tafel);
    zeile('keine Meldungszahl bei 250', /Meldungen/.test(p.tafel), false);
    alleFehler.push(...o.seitenFehler); await o.q.close();

    /* ============================== TEIL D ============================== */
    /* Vier Kalendertage, einer davon ohne Meldung. Zwei Laeufe, zwei Projekte. */
    const D = [
      kommentar(tagZeit(4, 9, 0), { project_id: 'agentarium', run_id: 'AG-L1', task_id: 'A1',
        kind: 'handoff', actor: 'peter', recipient: 'atlas', title: 'Peter gibt Atlas: Rückgaben abgleichen' }),
      kommentar(tagZeit(4, 9, 10), { project_id: 'agentarium', run_id: 'AG-L1', task_id: 'A1-F',
        kind: 'handoff', actor: 'atlas', recipient: 'forge', title: 'Atlas gibt Forge A1-F.' }),
      kommentar(tagZeit(4, 9, 11), { project_id: 'agentarium', run_id: 'AG-L1', task_id: 'A1-F',
        kind: 'assigned', actor: 'atlas', recipient: 'forge', title: 'Atlas vergibt A1-F.' }),
      kommentar(tagZeit(2, 8, 0), { project_id: 'agentarium', run_id: 'AG-L1', task_id: 'A1-F',
        kind: 'started', actor: 'forge', reporter: 'forge', title: 'Forge beginnt A1-F.' }),
      kommentar(tagZeit(2, 8, 30), { project_id: 'gt40', run_id: 'GT-L2', task_id: 'B1',
        kind: 'handoff', actor: 'peter', recipient: 'nova', title: 'Peter gibt Nova: Motorlauf prüfen' }),
      kommentar(tagZeit(2, 8, 31), { project_id: 'gt40', run_id: 'GT-L2', task_id: 'B1',
        kind: 'assigned', actor: 'atlas', recipient: 'nova', title: 'Atlas vergibt B1.' }),
      kommentar(tagZeit(1, 7, 0), { project_id: 'agentarium', run_id: 'AG-L1', task_id: 'A1-F',
        kind: 'contribution', actor: 'forge', recipient: 'atlas', reporter: 'forge',
        title: 'Forge gibt A1-F zurück.' }),
      kommentar(tagZeit(1, 7, 30), { project_id: 'agentarium', run_id: 'AG-L1', task_id: 'A1',
        kind: 'contribution', actor: 'atlas', recipient: 'peter', title: 'Atlas gibt Peter A1.' }),
      kommentar(tagZeit(1, 8, 0), { project_id: 'gt40', run_id: 'GT-L2', task_id: 'B1',
        kind: 'started', actor: 'nova', reporter: 'nova', title: 'Nova beginnt B1.' })
    ];

    /* Der Vergleich: Wie saehe das Bild aus, haette man nach den ersten
       `n` Meldungen verbunden? Eigene Seite, eigener Kontext. */
    const referenz = {};
    for (const n of [3, 6, 9]) {
      const r = await oeffnen(b, tisch, { kommentare: D.slice(0, n) });
      referenz[n] = lage(await stand(r.s));
      alleFehler.push(...r.seitenFehler); await r.q.close();
    }

    for (const [vp, name] of [[QUER, 'quer'], [HOCH, 'hoch']]) {
      console.log('\nD — Leiste im Archiv (iPad ' + name + ')');
      o = await oeffnen(b, tisch, { kommentare: D, viewport: vp, touch: true });
      const s = o.s;
      await s.evaluate(() => { const d = document.getElementById('agGhAuf'); if (d) d.open = false; });
      zeile('live: keine Leiste', await sichtbar(s, '#agLeiste'), false);
      zeile('Archiv antippen', await tippen(s, '#agWas li[data-modus="archiv"]'), true);
      await s.waitForFunction(() => window.__agGithub.stand().archiv.leiste, null, { timeout: 5000 });
      g = await gh(s);
      zeile('Leiste zu sehen', await sichtbar(s, '#agLeiste'), true);
      zeile('vier Tage, einer leer',
            g.archiv.tage.map(T => T.n).join(','), '3,0,3,3');
      zeile('Tage in Ortszeit', g.archiv.tage.map(T => T.tag).join(','),
            [4, 3, 2, 1].map(tagName).join(','));
      zeile('Balken: hoch nach Zahl, der leere als Strich',
            await s.evaluate(() => [...document.querySelectorAll('#agLeiste .lTag')]
              .map(e => e.classList.contains('leer') ? 'leer' : e.style.height).join(',')),
            '100%,leer,100%,100%');
      /* Nichts Unteres verdeckt: Liste, Knoepfe, Tempo stehen ueber der Leiste. */
      zeile('Knöpfe, Tempo, Liste stehen über der Leiste',
            await s.evaluate(() => { const l = document.getElementById('agLeiste').getBoundingClientRect();
              return ['agTasten', 'agTempo', 'agEcke'].map(id => {
                const e = document.getElementById(id); if (!e) return id + ':fehlt';
                const r = e.getBoundingClientRect();
                return (r.height === 0 || r.bottom <= l.top + 0.5) ? 'ok' : id + ':' + Math.round(r.bottom) + '>' + Math.round(l.top);
              }).join(','); }), 'ok,ok,ok');
      zeile('Leiste mindestens 44 px hoch (Finger)',
            await s.evaluate(() => document.getElementById('agLeiste').getBoundingClientRect().height >= 44), true);

      /* Die Marke wandert mit dem Abspielen. */
      await s.waitForFunction(() => window.__agGithub.stand().archiv.gezeigt >= 2, null, { timeout: 20000 });
      const marke1 = await s.evaluate(() => parseFloat(document.querySelector('#agLeiste .lMarke').style.left));
      zeile('Marke steht nach zwei Meldungen im ersten Tag', marke1 > 0 && marke1 <= 25, true);

      /* SPRUNG MIT DEM FINGER: mitten in den dritten Tag. */
      const tagMitte = (d) => s.evaluate(i => {
        const e = document.querySelectorAll('#agLeiste .lTag')[i].getBoundingClientRect();
        const l = document.getElementById('agLeiste').getBoundingClientRect();
        return [e.left + e.width / 2, l.top + l.height / 2]; }, d);
      let xy = await tagMitte(2);
      await s.touchscreen.tap(xy[0], xy[1]);
      g = await gh(s);
      zeile('Antippen springt (ein Sprung)', g.archiv.spruenge, 1);
      zeile('Stelle: Mitte des dritten Tages (ab Meldung 5 von 9)', g.archiv.gezeigt >= 5, true);
      const schild = await s.evaluate(() => { const e = document.getElementById('agLeisteSchild');
        return getComputedStyle(e).display !== 'none' ? e.innerText : ''; });
      const d2 = new Date(); d2.setDate(d2.getDate() - 2);
      zeile('Schild: Datum', schild.split('\n')[0].indexOf(String(d2.getDate()).padStart(2, '0') + '.' +
            String(d2.getMonth() + 1).padStart(2, '0') + '.') >= 0, true);
      zeile('Schild: drei Meldungen', /3 Meldungen/.test(schild), true);
      zeile('Schild: Läufe mit Bezeichnung aus dem Anstoß',
            /AG · Rückgaben abgleichen/.test(schild) && /GT · Motorlauf prüfen/.test(schild), true);
      await s.screenshot({ path: path.join(AUFNAHMEN, 'D-sprung-' + name + '.png') });
      /* ... und es geht von dort weiter. */
      await s.waitForFunction(() => window.__agGithub.stand().archiv.gezeigt >= 6, null, { timeout: 20000 });
      zeile('spielt nach dem Sprung weiter', true, true);
      await s.waitForFunction(() => getComputedStyle(document.getElementById('agLeisteSchild')).display === 'none',
                              null, { timeout: 8000 });
      zeile('Schild geht von selbst', true, true);

      /* DER STAND NACH DEM SPRUNG = DER STAND BEIM VERBINDEN. Gesprungen
         wird an den Tagesbeginn (Meldung 3 und 6) und ans Ende (9), und
         gelesen in DERSELBEN Aufgabe des Browsers, damit nichts dazwischen
         abgespielt sein kann. */
      for (const [tag, n] of [[2, 3], [3, 6], [3.999, 9]]) {
        const st = await s.evaluate((t) => {
          const tage = document.querySelectorAll('#agLeiste .lTag');
          const i = Math.floor(t), innen = t - i;
          const r = tage[i].getBoundingClientRect();
          const x = r.left + (innen ? r.width * innen : 0.5), y = r.top + r.height / 2;
          const leiste = document.getElementById('agLeiste');
          const o = { bubbles: true, cancelable: true, pointerId: 7, pointerType: 'touch',
                      isPrimary: true, clientX: x, clientY: y };
          leiste.dispatchEvent(new PointerEvent('pointerdown', o));
          leiste.dispatchEvent(new PointerEvent('pointerup', o));
          return { st: window.__agStand(), g: window.__agGithub.stand() };
        }, tag);
        zeile('Sprung zu Meldung ' + n + ': Stelle', st.g.archiv.gezeigt, n);
        zeile('Sprung zu Meldung ' + n + ': ohne Flug', (st.st.fliegend || []).length, 0);
        zeile('Sprung zu Meldung ' + n + ': Stand wie beim Verbinden', lage(st.st), referenz[n]);
      }
      console.log('        Stand bei 6: ' + referenz[6]);

      /* ZIEHEN: Die Marke folgt dem Finger, gesprungen wird erst beim Loslassen. */
      const zug = await s.evaluate(() => {
        const tage = document.querySelectorAll('#agLeiste .lTag');
        const leiste = document.getElementById('agLeiste');
        const at = (i) => { const r = tage[i].getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
        const ev = (typ, p) => leiste.dispatchEvent(new PointerEvent(typ, { bubbles: true,
          cancelable: true, pointerId: 9, pointerType: 'touch', isPrimary: true,
          clientX: p.x, clientY: p.y }));
        const vor = window.__agGithub.stand().archiv.spruenge;
        ev('pointerdown', at(0));
        ev('pointermove', at(1));
        ev('pointermove', at(2));
        const marke = parseFloat(document.querySelector('#agLeiste .lMarke').style.left);
        const waehrend = window.__agGithub.stand().archiv.spruenge;
        ev('pointerup', at(2));
        return { vor, waehrend, nach: window.__agGithub.stand().archiv.spruenge, marke,
                 gezeigt: window.__agGithub.stand().archiv.gezeigt };
      });
      zeile('Ziehen: Marke folgt (im dritten Tag)', zug.marke > 50 && zug.marke < 75, true);
      zeile('Ziehen: kein Sprung während des Ziehens', zug.waehrend, zug.vor);
      zeile('Ziehen: ein Sprung beim Loslassen', zug.nach, zug.vor + 1);
      zeile('Ziehen: Stelle Mitte dritter Tag', zug.gezeigt, 5);

      /* Halt haelt, auch nach einem Sprung; Tempo bleibt zu sehen. */
      zeile('Tempo zu sehen', await sichtbar(s, '#agTempo'), true);
      zeile('Von vorn zu sehen', await sichtbar(s, '#agVorn'), true);
      await tippen(s, '#agHalt');
      g = await gh(s);
      const vorHalt = g.archiv.gezeigt;
      await s.waitForTimeout(1500);
      g = await gh(s);
      zeile('Halt: nichts Neues in 1,5 s', g.archiv.gezeigt, vorHalt);
      await tippen(s, '#agHalt');
      await s.waitForFunction((v) => window.__agGithub.stand().archiv.gezeigt > v, vorHalt,
                              { timeout: 20000 });
      zeile('Weiter: spielt fort', true, true);
      /* Von vorn beginnt am Anfang, ohne Versatz; die Leiste bleibt. */
      await tippen(s, '#agVorn');
      g = await gh(s);
      zeile('Von vorn: am Anfang, kein Versatz', g.archiv.gezeigt + '/' + g.archiv.versatz, '0/0');
      zeile('Von vorn: Leiste bleibt', await sichtbar(s, '#agLeiste'), true);

      /* Live: Leiste weg, alles Untere wieder an seinem Platz. */
      await tippen(s, '#agWas li[data-modus="live"]');
      await s.waitForFunction(() => { const x = window.__agGithub.stand();
        return x.phase === 'verbunden' && !x.archiv.ansicht && x.zahl.abdeckung !== ''; },
        null, { timeout: 20000 });
      zeile('Live: keine Leiste', await sichtbar(s, '#agLeiste'), false);
      zeile('Live: Abstand der Leiste wieder 0',
            await s.evaluate(() => document.documentElement.style.getPropertyValue('--agLeisteH')), '0px');
      zeile('Live: Stand wie beim Verbinden mit allem', lage(await stand(s)), referenz[9]);
      alleFehler.push(...o.seitenFehler); await o.q.close();
    }
    zeile('keine Seitenfehler', alleFehler.length, 0);
    if (alleFehler.length) console.log('        ' + alleFehler.join('\n        '));
  } finally {
    await b.close();
    tisch.s.close();
  }
  if (fehler) { console.log('\nABWEICHUNG in ' + fehler + ' Prüfung(en).'); process.exit(1); }
  console.log('\nALLES WIE VEREINBART — keine Abweichung.');
  console.log('Scheintoken, Probekörper, Verzeichnis als Attrappe. Keine Abnahme am iPad.');
})().catch(e => { console.log('\nUNGEPRÜFT: ' + (e && e.stack || e)); process.exit(2); });
