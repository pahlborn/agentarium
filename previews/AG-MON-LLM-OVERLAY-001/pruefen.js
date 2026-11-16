/* AG-MON-LLM-OVERLAY-001 — die Kostenzeile unten in der Mitte ist weg.

   Aufruf:            node previews/AG-MON-LLM-OVERLAY-001/pruefen.js
   Eigener Browser:   AG_CHROMIUM=/pfad/zur/datei node previews/...
   Andere Kopie:      AG_ZIEL=pfad/relativ/zum/repo node previews/...
   Rueckgabe: 0 = bestanden, 1 = Abweichung, 2 = ungeprueft.

   PETER, 16.11.2026 (#136): "nur die anzeigen im unteren mittel sollen weg"
   -- die Zeile "Kosten noch nicht vollständig erfasst ..." bei "LLM &
   Kosten". Die Angaben an den Agenten bleiben, der Schalter bleibt.

   Je Lage (iPad quer 1194x834, hoch 834x1194), bedient per Antippen:
     A  "LLM & Kosten" an: keine Kostenzeile, kein Satz zur Kostenbasis
     B  die Schilder an den Agenten sind da (Modell je Agent, ChatGPT und
        Claude Code kommen vor)
     C  kein Schild an einem Agenten liegt in der Knopfleiste (die Leiste
        ist jetzt die Unterkante, die frueher die Kostenzeile war)
     D  wieder aus: alle Schilder weg, der Knopf bleibt
     E  keine Seitenfehler
     F  ruhige Schilder (AG-MON-FUSS-STABIL-001, Peter 16.11.2026: "die
        sekündliche einblendung ist in 105 immer noch da"): live, Springer
        unten in der Mitte mit vier vergebenen Auftraegen, "LLM & Kosten" an.
        Die Arbeitsanzeige wird wie beim Sekundenwechsel neu angestossen;
        Schild und Anzeige behalten ihren Platz, die Anzeige bleibt dasselbe
        Element (nur der Text aendert sich), und die Modellschilder werden
        nicht mehr in jedem Bild neu gebaut. Grenze: Chromium; das Flackern
        selbst sah Peter in Safari auf dem iPad.

   GRENZEN: Demostueck im Browser, keine echten Daten, keine Abnahme am
   iPad. Das Flackern ist hier nicht gemessen. C trifft im Demostueck
   keinen Grenzfall (kein Agent steht dort nahe der Leiste); den Fall
   unten in der Mitte hat Lot am nachgespielten echten Stand von #2
   (Springer) angesehen, nicht als Nachweis festgehalten.               */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');

const ZIEL = process.env.AG_ZIEL || 'pilot/github-live';
const WURZEL = path.resolve(__dirname, '..', '..', ...ZIEL.split('/'));

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
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ungeprueft('playwright fehlt'); }
function browserPfad() {
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

const VERZEICHNIS = {
  schema: 'agentarium.projektverzeichnis.v1', gepflegt_von: 'atlas',
  projekte: [{ id: 'agentarium', kuerzel: 'AG', name: 'Agentarium', repo: 'pahlborn/agentarium' }]
};
let nr = 0;
function kommentar(min, ereignis) {
  nr++;
  const zeit = new Date(Date.now() - min * 60000 + nr).toISOString();
  const e = Object.assign({
    schema: 'agentarium.github-event.v1', id: 'AG-OVERLAY-EREIGNIS-' + nr,
    project_id: 'agentarium', run_id: 'AG-OVERLAY-L1', occurred_at: zeit, reporter: 'atlas',
    source_evidence: 'reported_checkpoint', source_tool_id: 'previews/AG-MON-LLM-OVERLAY-001'
  }, ereignis);
  return { id: 9998000000 + nr, created_at: zeit, user: { login: 'pahlborn', id: 277496791 },
           body: '<!-- AGENTARIUM_EVENT_V1 -->\n```json\n' + JSON.stringify(e, null, 2) +
                 '\n```\nProbe aus AG-MON-LLM-OVERLAY-001, kein echter Auftrag.' };
}
async function teilF(b, tisch) {
  console.log('\nF — ruhige Schilder (live, Springer unten in der Mitte)');
  const liste = [1, 2, 3, 4].map(k => kommentar(10 - k, { task_id: 'AG-OV-0' + k, kind: 'assigned',
    actor: 'atlas', recipient: 'springer', item_type: 'task', title: 'Atlas vergibt AG-OV-0' + k + '.' }));
  const q = await b.newContext({ viewport: { width: 1194, height: 834 }, hasTouch: true });
  const s = await q.newPage();
  const seitenFehler = [];
  s.on('pageerror', e => seitenFehler.push(String(e.message).slice(0, 110)));
  await s.route('**/projekte/verzeichnis.json', r => r.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify(VERZEICHNIS) }));
  await s.route('**api.github.com/**', r => r.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify(liste) }));
  await s.goto(tisch.adr + '?live=github', { waitUntil: 'load' });
  await s.waitForFunction(() => !!document.getElementById('agGhToken'), null, { timeout: 20000 });
  await s.fill('#agGhToken', 'AGMONLLMOVERLAY001_Scheintoken_0123456789');
  await s.click('#agGhAn');
  await s.waitForFunction(() => window.__agGithub && window.__agGithub.stand().phase === 'verbunden',
                          null, { timeout: 30000 });
  await s.evaluate(() => { const d = document.getElementById('agGhAuf'); if (d) d.open = false; });
  await s.waitForFunction(() => !!document.querySelector('#agTun [data-wer="springer"]'),
                          null, { timeout: 15000 });
  await s.tap('#agMotor');
  await s.waitForTimeout(1500);
  const m = await s.evaluate(() => new Promise(fertig => {
    const motoren = document.getElementById('agMotoren'), tun = document.getElementById('agTun');
    let neuMot = 0, neuTun = 0, bilder = 0;
    const mo = new MutationObserver(l => l.forEach(x => {
      if (x.target === motoren) neuMot++; else neuTun++; }));
    mo.observe(motoren, { childList: true }); mo.observe(tun, { childList: true });
    const lagen = { mot: new Set(), tun: new Set() };
    const anzeige0 = document.querySelector('#agTun [data-wer="springer"]');
    let angestossen = 0;
    /* Wie beim Sekundenwechsel: die Arbeitsanzeige wird neu gebaut. */
    const uhr = setInterval(() => { tun.__h = null; angestossen++; }, 400);
    const t0 = performance.now();
    (function f() {
      bilder++;
      [['mot', '#agMotoren [data-wer="springer"]'], ['tun', '#agTun [data-wer="springer"]']].forEach(([k, sel]) => {
        const e = document.querySelector(sel);
        if (e) { const r = e.getBoundingClientRect(); lagen[k].add(Math.round(r.left) + ',' + Math.round(r.top)); }
      });
      if (performance.now() - t0 < 3000) requestAnimationFrame(f);
      else { clearInterval(uhr); mo.disconnect();
             fertig({ bilder, neuMot, neuTun, angestossen, mot: [...lagen.mot], tun: [...lagen.tun],
                      dasselbe: document.querySelector('#agTun [data-wer="springer"]') === anzeige0 }); }
    })();
  }));
  console.log('        ' + m.bilder + ' Bilder, ' + m.angestossen + '-mal angestossen, ' + m.neuTun +
              '-mal neu gebaut; Lagen Schild ' +
              m.mot.join(' ') + ' · Anzeige ' + m.tun.join(' '));
  zeile('F  Anzeige wurde angestossen (Probe greift)', m.angestossen >= 5, true);
  zeile('F  Arbeitsanzeige bleibt dasselbe Element', m.dasselbe, true);
  zeile('F  Modellschild behält seinen Platz', m.mot.length, 1);
  zeile('F  Arbeitsanzeige behält ihren Platz', m.tun.length, 1);
  zeile('F  Modellschilder nicht je Bild neu gebaut', m.neuMot < m.bilder / 4, true);
  zeile('F  keine Seitenfehler', seitenFehler.join(' | ') || 'keine', 'keine');
  await q.close();
}

(async () => {
  if (!fs.existsSync(path.join(WURZEL, 'index.html'))) ungeprueft('keine index.html in ' + WURZEL);
  const bp = browserPfad();
  if (!bp.pfad) ungeprueft(bp.grund);
  const tisch = await tischen(WURZEL);
  const b = await chromium.launch({ executablePath: bp.pfad });
  try {
    for (const [lage, vp] of [['quer', { width: 1194, height: 834 }],
                              ['hoch', { width: 834, height: 1194 }]]) {
      console.log('\n' + lage + ' ' + vp.width + 'x' + vp.height);
      const q = await b.newContext({ viewport: vp, hasTouch: true });
      const s = await q.newPage();
      const seitenFehler = [];
      s.on('pageerror', e => seitenFehler.push(String(e.message).slice(0, 110)));
      await s.route('**api.github.com/**', r => r.abort());
      await s.goto(tisch.adr, { waitUntil: 'load' });
      /* Das Demostueck braucht ein paar Sekunden, bis Agenten arbeiten. */
      await s.waitForFunction(() => document.querySelectorAll('#agTun [data-wer]').length > 0,
                              null, { timeout: 30000 });
      await s.tap('#agMotor');
      await s.waitForFunction(() => document.querySelectorAll('#agMotoren .agMot').length > 0,
                              null, { timeout: 10000 });
      await s.waitForTimeout(800);
      const an = await s.evaluate(() => {
        const m = document.getElementById('agMotoren');
        const t = document.getElementById('agTasten').getBoundingClientRect();
        const schilder = [...document.querySelectorAll('#agMotoren [data-wer], #agTun [data-wer]')];
        const inLeiste = schilder.filter(e => {
          const r = e.getBoundingClientRect();
          return !(r.right <= t.left || t.right <= r.left || r.bottom <= t.top || t.bottom <= r.top);
        }).map(e => e.getAttribute('data-wer'));
        return {
          basis: m.querySelectorAll('.agBasis').length,
          satz: /erfasst|erledigten Aufträge|erledigt belegt/.test(m.textContent),
          mot: m.querySelectorAll('.agMot[data-wer]').length,
          chatgpt: /ChatGPT/.test(m.textContent), claude: /Claude Code/.test(m.textContent),
          inLeiste: inLeiste.join(',') || 'keins',
          knopfAn: document.getElementById('agMotor').classList.contains('an')
        };
      });
      zeile('A  Knopf ist an', an.knopfAn, true);
      zeile('A  keine Kostenzeile (.agBasis)', an.basis, 0);
      zeile('A  kein Satz zur Kostenbasis', an.satz, false);
      zeile('B  Schilder an den Agenten (mind. 9)', an.mot >= 9, true);
      zeile('B  ChatGPT steht an Agenten', an.chatgpt, true);
      zeile('B  Claude Code steht an Agenten', an.claude, true);
      zeile('C  kein Agentenschild in der Knopfleiste', an.inLeiste, 'keins');
      await s.tap('#agMotor');
      await s.waitForTimeout(400);
      const aus = await s.evaluate(() => ({
        leer: document.getElementById('agMotoren').children.length,
        knopf: !!document.getElementById('agMotor'),
        knopfAn: document.getElementById('agMotor').classList.contains('an') }));
      zeile('D  aus: keine Schilder mehr', aus.leer, 0);
      zeile('D  Knopf bleibt, ist aus', aus.knopf && !aus.knopfAn, true);
      zeile('E  keine Seitenfehler', seitenFehler.join(' | ') || 'keine', 'keine');
      await q.close();
    }
    await teilF(b, tisch);
  } finally { await b.close(); tisch.s.close(); }
  console.log(fehler ? '\nABWEICHUNG: ' + fehler : '\nALLES WIE VEREINBART — keine Abweichung.');
  console.log('Demostueck im Browser. Keine Abnahme am iPad.');
  process.exit(fehler ? 1 : 0);
})().catch(e => { console.log('FEHLER ' + e.stack); process.exit(1); });
