/* AG-MON-TEXTE-001 — Texte im Feld: kurz · voll · aus.

   Aufruf:            node previews/AG-MON-TEXTE-001/pruefen.js
   Eigener Browser:   AG_CHROMIUM=/pfad/zur/datei node previews/...
   Aufnahmen ablegen: AG_AUFNAHMEN=/verzeichnis node previews/...
   Rueckgabe: 0 = bestanden, 1 = Abweichung, 2 = ungeprueft.

   PETER, 25.10.: Der Text am Ball ist dieselbe Meldung wie die Zeile in der
   Liste -- er soll reduzierter erscheinen, mit einem Schalter fuer ein, aus,
   reduziert. Vorschlag angenommen ("ja, das waere gut"):
     kurz  (Grundeinstellung) von -> an · Art auf Deutsch, darunter der Titel
     voll  wie bisher, mit der Herkunftszeile
     aus   kein Text im Feld; Baelle und Fluege bleiben
   Die Liste "Was geschieht" zeigt in jeder Stufe alles.

     A  Grundeinstellung kurz: zwei Zeilen, keine Herkunftszeile im Feld;
        die Liste nennt weiter Beleg und Herkunft
     B  "Texte" -> voll: die Herkunftszeile steht wieder im Feld
     C  "Texte" -> aus: kein Text im Feld, aber Flug und Listenzeile
     D  die Stufe bleibt nach Neuladen erhalten; noch einmal -> kurz
     E  der Text startet beim Absender, fliegt mit dem Ball und bleibt beim
        Empfaenger stehen, ohne auf einem Namen zu liegen (Peter, 31.10.)

   GRENZEN: Attrappe mit Scheintoken, Probekoerper. Keine Abnahme am iPad.  */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os');

const ZIEL = process.env.AG_ZIEL || 'pilot/github-live';
const WURZEL = path.resolve(__dirname, '..', '..', ...ZIEL.split('/'));
const AUFNAHMEN = process.env.AG_AUFNAHMEN ||
  fs.mkdtempSync(path.join(os.tmpdir(), 'ag-texte-'));
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
function kommentar(ereignis) {
  nr++;
  const zeit = new Date().toISOString();
  const e = Object.assign({
    schema: 'agentarium.github-event.v1', id: 'AG-TEXTE-EREIGNIS-' + nr,
    project_id: 'agentarium', run_id: 'AG-TEXTE-L1', occurred_at: zeit, reporter: 'atlas',
    source_evidence: 'reported_checkpoint', source_tool_id: 'previews/AG-MON-TEXTE-001'
  }, ereignis);
  return { id: 9980000000 + nr, created_at: zeit,
           user: { login: 'pahlborn', id: 277496791 },
           body: '<!-- AGENTARIUM_EVENT_V1 -->\n```json\n' + JSON.stringify(e, null, 2) +
                 '\n```\nProbe aus AG-MON-TEXTE-001, kein echter Auftrag.' };
}
const weitergabe = (A, an) => kommentar({ task_id: A, kind: 'handoff', actor: 'atlas',
  recipient: an, title: 'Atlas gibt ' + an + ' ' + A + '.' });

/* Wartet auf den Flug zu `an`, und darauf, dass die Meldung im Feld bzw.
   in der Liste steht (oder eben nicht). */
async function beobachten(s, titel, ms) {
  let flog = false, feld = null, liste = null;
  for (let t = 0; t < ms; t += 100) {
    const r = await s.evaluate(tt => {
      const f = [...document.querySelectorAll('.agRuf')].find(e => e.textContent.indexOf(tt) >= 0);
      const l = [...document.querySelectorAll('#agLaeuft .agAuf')].find(e => e.textContent.indexOf(tt) >= 0);
      const st = window.__agStand();
      return { flug: (st.fliegend || []).length > 0,
               feld: f ? { text: f.textContent, herkunft: !!f.querySelector('.agHerkunft'),
                           zeilen: f.querySelectorAll('br').length + 1 } : null,
               liste: l ? { text: l.textContent, herkunft: !!l.querySelector('.agHerkunft') } : null };
    }, titel);
    if (r.flug) flog = true;
    if (r.feld && !feld) feld = r.feld;
    if (r.liste && !liste) liste = r.liste;
    if (liste && (feld || t > 2500) && t > 600) break;
    await s.waitForTimeout(100);
  }
  return { flog, feld, liste };
}

(async () => {
  console.log('AG-MON-TEXTE-001 — Texte im Feld: kurz · voll · aus\n');
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
    const liste = [];
    let abrufe = 0;
    await s.route('**/projekte/verzeichnis.json', r => r.fulfill({
      status: 200, contentType: 'application/json', body: JSON.stringify(VERZEICHNIS) }));
    await s.route('**api.github.com/**', r => {
      abrufe++;
      r.fulfill({ status: 200, contentType: 'application/json',
                  headers: { ETag: 'W/"ag-texte-' + abrufe + '"' }, body: JSON.stringify(liste) });
    });
    const verbinden = async () => {
      await s.goto(tisch.adr + '?live=github', { waitUntil: 'load' });
      await s.waitForTimeout(2200);
      if (!await s.evaluate(() => !!document.getElementById('agGhToken')))
        ungeprueft('kein Livefach — ohne WebGL kein Monitor');
      await s.fill('#agGhToken', 'AGMONTEXTE001_Scheintoken_0123456789abc');
      await s.click('#agGhAn');
      await s.waitForTimeout(3500);
      await s.evaluate(() => { const d = document.getElementById('agGhAuf'); if (d) d.open = false; });
    };
    const knopf = () => s.evaluate(() => (document.getElementById('agTexte') || {}).textContent);
    const tippen = () => s.evaluate(() => document.getElementById('agTexte').click());
    await verbinden();

    console.log('A — Grundeinstellung: kurz');
    zeile('Knopf', await knopf(), 'Texte: kurz');
    liste.push(weitergabe('T1', 'forge'));
    let o = await beobachten(s, 'Atlas gibt forge T1.', 8000);
    zeile('Flug', o.flog, true);
    zeile('Text im Feld', !!o.feld, true);
    zeile('Feld: von → an · Übergabe', !!o.feld && /atlas → forge Übergabe/.test(o.feld.text), true);
    zeile('Feld: zwei Zeilen', o.feld && o.feld.zeilen, 2);
    zeile('Feld: keine Herkunftszeile', o.feld && o.feld.herkunft, false);
    zeile('Liste: Herkunft und Beleg stehen da', !!o.liste && o.liste.herkunft && /Beleg \d+/.test(o.liste.text), true);
    await s.screenshot({ path: path.join(AUFNAHMEN, '1-kurz.jpg'), type: 'jpeg', quality: 78 });

    console.log('\nB — voll');
    await tippen();
    zeile('Knopf', await knopf(), 'Texte: voll');
    liste.push(weitergabe('T2', 'nova'));
    o = await beobachten(s, 'Atlas gibt nova T2.', 8000);
    zeile('Feld: Herkunftszeile wieder da', o.feld && o.feld.herkunft, true);
    zeile('Feld: Beleg im Feld', !!o.feld && /Beleg \d+/.test(o.feld.text), true);
    await s.screenshot({ path: path.join(AUFNAHMEN, '2-voll.jpg'), type: 'jpeg', quality: 78 });

    console.log('\nC — aus');
    await tippen();
    zeile('Knopf', await knopf(), 'Texte: aus');
    zeile('was schwebte, ist weg', await s.evaluate(() => document.querySelectorAll('.agRuf').length), 0);
    liste.push(weitergabe('T3', 'scout'));
    o = await beobachten(s, 'Atlas gibt scout T3.', 8000);
    zeile('Flug bleibt', o.flog, true);
    zeile('kein Text im Feld', o.feld, null);
    zeile('Listenzeile bleibt', !!o.liste, true);

    console.log('\nD — Gespeichert');
    await verbinden();
    zeile('nach Neuladen weiter aus', await knopf(), 'Texte: aus');
    zeile('Stand nennt die Stufe', await s.evaluate(() => window.__agStand().feldText), 'aus');
    await tippen();
    zeile('noch einmal: zurück auf kurz', await knopf(), 'Texte: kurz');

    /* E: Peter, 31.10.: "die fliegenden Texte/Aufgaben starten nicht bei den
       jeweiligen Agenten, sie erscheinen irgendwie irgendwo." Bis Fassung 96
       stand der Text vom ersten Bild an beim Empfaenger und lag im Bild auch
       auf dessen Namen. */
    console.log('\nE — Der Text fliegt mit dem Ball');
    const namen = () => s.evaluate(() => {
      const r = {};
      document.querySelectorAll('#agRing .agName').forEach(e => {
        const k = e.getBoundingClientRect();
        r[e.getAttribute('data-wer')] = { x: k.left + k.width / 2, y: k.top + k.height / 2,
                                          l: k.left, r: k.right, o: k.top, u: k.bottom };
      });
      return r;
    });
    const N = await namen();
    liste.push(weitergabe('T4', 'forge'));
    const spur = [];
    let gelandet = null;
    for (let t = 0; t < 9000; t += 60) {
      const r = await s.evaluate(tt => {
        const f = [...document.querySelectorAll('.agRuf')].find(e => e.textContent.indexOf(tt) >= 0);
        const fl = (window.__agStand().fliegend || []).some(b => b.an === 'forge');
        if (!f) return { fl };
        const k = f.getBoundingClientRect();
        return { fl, x: k.left + k.width / 2, y: k.top + k.height / 2, l: k.left, r: k.right, o: k.top, u: k.bottom };
      }, 'Atlas gibt forge T4.');
      if (r.x != null && r.fl) spur.push(r);
      if (r.x != null && !r.fl && spur.length) { gelandet = r; break; }
      await s.waitForTimeout(60);
    }
    const d = (p, n) => Math.hypot(p.x - n.x, p.y - n.y);
    const erst = spur[0];
    console.log('        Text unterwegs gesehen: ' + spur.length + ' mal' +
                (erst ? '; zuerst ' + Math.round(d(erst, N.atlas)) + ' px von Atlas, ' + Math.round(d(erst, N.forge)) + ' px von Forge' : '') +
                (gelandet ? '; gelandet ' + Math.round(d(gelandet, N.forge)) + ' px von Forge' : ''));
    zeile('startet beim Absender (näher an Atlas)', !!erst && d(erst, N.atlas) < d(erst, N.forge), true);
    const weg = spur.length > 1 ? Math.hypot(spur[spur.length - 1].x - erst.x, spur[spur.length - 1].y - erst.y) : 0;
    zeile('fliegt mit (wandert > 100 px)', weg > 100, true);
    zeile('bleibt beim Empfänger (näher an Forge)', !!gelandet && d(gelandet, N.forge) < d(gelandet, N.atlas), true);
    const aufName = gelandet ? Object.keys(N).filter(n => {
      const m = N[n];
      return !(gelandet.r <= m.l || m.r <= gelandet.l || gelandet.u <= m.o || m.u <= gelandet.o);
    }) : ['?'];
    zeile('liegt auf keinem Namen', aufName.join(',') || '-', '-');
    await s.screenshot({ path: path.join(AUFNAHMEN, '3-gelandet.jpg'), type: 'jpeg', quality: 78 });
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
