/* AG-EVENT-JOURNAL-001 — Nachweis Schritt 1: der Lebenszyklusvertrag.

   Start:  node previews/AG-EVENT-JOURNAL-001/pruefen.js
   Eigener Browser:  AG_CHROMIUM=/pfad/zur/datei node previews/...

   Rückgabe 0 = alles wie vereinbart, 1 = Abweichung, 2 = ungeprüft.

   WAS HIER GEPRÜFT WIRD. Der echte Parser aus `pilot/github-live/github-live.js`
   an der echten Seite, mit Körpern, die genau so aussehen wie die, die später
   ein Agent auf Vorgang #2 legt. Je ein Fixture für eine Claude-Rolle (forge)
   und eine ChatGPT-Rolle (sentinel) — dieselbe Schnittstelle, wie der Auftrag
   es verlangt.

   WAS DIESER NACHWEIS INZWISCHEN MITPRÜFT. Die Aufgabenzustände selbst:
   Vergabe legt hin, Selbstauskunft beginnt, Lieferung schließt genau ihre
   Aufgabe — und seit dem 21.10. Blockade und Auflösung, die NEBEN dem
   Zustand liegen statt ihn zu ersetzen. Was weiter fehlt, steht am Ende der
   Ausgabe und nicht nur im Kommentar.

   WAS ER AUSDRÜCKLICH PRÜFT, weil Atlas es am 21.10. verlangt hat:
   - Melder (`reporter`) und Akteur (`actor`) sind getrennte Felder.
   - Ein Lebenszyklusereignis OHNE Melder wird abgewiesen, nicht geraten.
   - Fremdaussage (Melder ≠ Akteur) kommt an, gilt aber nicht als
     Selbstauskunft.
   - Transportduplikat ist wirkungslos, dieselbe Kennung mit anderem Inhalt
     ist ein Konflikt und wird abgewiesen.
   - Ein Original ohne die Zusage `lebenszyklus` bekommt die Arten nicht.  */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');

const WURZEL = path.resolve(__dirname, '..', '..');
const ZIEL = path.join(WURZEL, 'pilot', 'github-live');
const MARKER = '<!-- AGENTARIUM_EVENT_V1 -->';

let fehler = 0;
function zeile(w, ist, soll) {
  const ok = ist === soll;
  if (!ok) fehler++;
  console.log('  ' + (ok ? 'ok  ' : 'FEHL') + '  ' + w.padEnd(46) +
              String(ist).padEnd(24) + (ok ? '' : '(erwartet ' + soll + ')'));
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

/* Ein Körper, wie ein Agent ihn auf #2 legen würde. Absichtlich hier
   zusammengesetzt und nicht aus dem Relais geholt: Das Relais sendet diese
   Arten noch nicht — es ist der Punkt des Auftrags, dass alle Rollen sie
   senden KÖNNEN. Dass der Parser sie nimmt, ist daher die Frage; dass ein
   Programm sie erzeugt, ist die nächste. */
function koerper(f) {
  const ev = {
    schema: 'agentarium.github-event.v1',
    id: f.id,
    project_id: f.projekt || 'agentarium',
    run_id: f.lauf || 'AG-EVENT-JOURNAL-001',
    task_id: f.task, actor: f.actor, kind: f.kind,
    title: f.title, occurred_at: f.at || '2026-10-21T08:00:00Z',
    source_evidence: f.evidence || 'reported_checkpoint',
    source_tool_id: f.tool || 'previews/AG-EVENT-JOURNAL-001/pruefen.js'
  };
  if (f.recipient) ev.recipient = f.recipient;
  if (f.reporter) ev.reporter = f.reporter;
  if (f.blocker) ev.blocker_id = f.blocker;
  let text = '## ' + f.kind + ' — ' + f.title + '\n\n';
  text += MARKER + '\n```json\n' + JSON.stringify(ev, null, 2) + '\n```';
  return text;
}

(async () => {
  console.log('AG-EVENT-JOURNAL-001 — der Lebenszyklusvertrag am echten Parser\n');

  let chromium = null;
  try { chromium = require('playwright').chromium; } catch (e) {}
  const br = chromiumPfad(chromium);
  if (br.grund) ungeprueft(br.grund);

  const b = await chromium.launch({ executablePath: br.pfad,
                                    args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const n = await tischen(ZIEL);
  const q = await b.newContext({ viewport: { width: 1194, height: 834 } });
  const s = await q.newPage();
  const pageErr = [];
  s.on('pageerror', e => pageErr.push(String(e) + '\n        ' + String(e.stack || '').split('\n').slice(1, 5).join('\n        ')));

  let abrufe = 0, antwort = [];
  await s.route('**api.github.com/**', route => {
    abrufe++;
    route.fulfill({ status: 200, contentType: 'application/json',
                    headers: { ETag: 'W/"ag-journal-' + abrufe + '"' },
                    body: JSON.stringify(antwort) });
  });

  await s.goto(n.adr + '?live=github', { waitUntil: 'load' });
  await s.waitForTimeout(2200);
  const da = await s.evaluate(() => !!document.getElementById('agGhToken'));
  if (!da) { await b.close(); n.s.close(); ungeprueft('kein Livefach — ohne WebGL kein Monitor'); }

  console.log('A — Die Zusagen des Originals');
  console.log('    erwartet: beide Worte, sonst bekommt der Adapter die Arten nicht\n');
  const z = await s.evaluate(() => ({
    komm: (window.__agGithubBruecke || {}).kommunikation,
    leben: (window.__agGithubBruecke || {}).lebenszyklus,
    fassung: (window.__agGithubBruecke || {}).fassung
  }));
  zeile('kommunikation', z.komm, 'beobachtet-v1');
  /* V2, NICHT V1. In v1 kamen `blocked`/`resolved` an und trieben nichts;
     jetzt legen sie eine Klemme an die Aufgabe. Ein Original aus dem Vorrat,
     das nur v1 sagt, soll sie deshalb ABWEISEN statt halb anzuzeigen. */
  zeile('lebenszyklus', z.leben, 'gemeldet-v2');
  console.log('        Fassung des Originals: ' + z.fassung);

  /* ===== SCHRITT 2b: WAS BEIM VERBINDEN SCHON OFFEN WAR =====
     Eine Historie mit drei Aufgaben, die sich unterscheiden MUESSEN:
       R1  vergeben und begonnen, nicht geliefert   -> bleibt offen, begonnen
       R2  vergeben, begonnen, geliefert            -> ist zu, kein Ring
       R3  vergeben, nie begonnen                   -> bleibt offen, zugewiesen
     Dazu zwei Faelle, die NICHT zaehlen duerfen:
       R4  Beginn als Fremdaussage (atlas ueber forge)  -> bleibt zugewiesen
       R5  Beginn OHNE vorherige Vergabe                -> gar keine Aufgabe
     Absichtlich in verdrehter Reihenfolge hingelegt und mit teils gleichen
     `occurred_at`: Die Ordnung muss aus occurred_at, recorded_at und
     Kommentarnummer entstehen, nicht aus der Lesereihenfolge. */
  const H = [];
  let hid = 88000;
  function hist(f, occ, rec) {
    H.push({ id: ++hid, body: koerper(Object.assign({ at: occ }, f)),
             user: { login: 'github-actions[bot]', id: 41898282 },
             created_at: rec || occ });
  }
  /* R2 zuerst hinlegen, obwohl es spaeter geschah -- die Faltung muss das
     richten. Und die Lieferung traegt dieselbe occurred_at wie der Beginn;
     dann entscheidet recorded_at. */
  hist({ id: 'R2:delivered', task: 'AG-EVJ-R2', actor: 'forge', reporter: 'forge',
         kind: 'delivered', title: 'R2 geliefert' },
       '2026-10-20T09:00:00Z', '2026-10-20T09:00:30Z');
  hist({ id: 'R2:assigned', task: 'AG-EVJ-R2', actor: 'atlas', reporter: 'atlas',
         recipient: 'forge', kind: 'assigned', title: 'R2 vergeben' },
       '2026-10-20T08:00:00Z');
  hist({ id: 'R2:started', task: 'AG-EVJ-R2', actor: 'forge', reporter: 'forge',
         kind: 'started', title: 'R2 begonnen' },
       '2026-10-20T09:00:00Z', '2026-10-20T09:00:10Z');

  hist({ id: 'R1:assigned', task: 'AG-EVJ-R1', actor: 'atlas', reporter: 'atlas',
         recipient: 'scout', kind: 'assigned', title: 'R1 an scout vergeben' },
       '2026-10-20T10:00:00Z');
  hist({ id: 'R1:started', task: 'AG-EVJ-R1', actor: 'scout', reporter: 'scout',
         kind: 'started', title: 'R1 begonnen' },
       '2026-10-20T10:05:00Z');

  hist({ id: 'R3:assigned', task: 'AG-EVJ-R3', actor: 'atlas', reporter: 'atlas',
         recipient: 'argus', kind: 'assigned', title: 'R3 an argus vergeben' },
       '2026-10-20T11:00:00Z');

  hist({ id: 'R4:assigned', task: 'AG-EVJ-R4', actor: 'atlas', reporter: 'atlas',
         recipient: 'nova', kind: 'assigned', title: 'R4 an nova vergeben' },
       '2026-10-20T12:00:00Z');
  hist({ id: 'R4:started-fremd', task: 'AG-EVJ-R4', actor: 'nova', reporter: 'atlas',
         kind: 'started', title: 'Atlas behauptet Novas Beginn' },
       '2026-10-20T12:05:00Z');

  hist({ id: 'R5:started-ohne', task: 'AG-EVJ-R5', actor: 'cadence', reporter: 'cadence',
         kind: 'started', title: 'Beginn ohne Vergabe' },
       '2026-10-20T13:00:00Z');

  /* R6 UND R7: DIESELBE ROLLE, DIESELBE task_id, ZWEI PROJEKTE.
     Von Atlas am 21.10. als Befund gemeldet: `arbeitZuweisen` verglich nur
     die Aufgabenkennung, also fielen diese beiden zusammen -- der zweite
     Ring wurde abgewiesen, und ein spaeteres `started` haette die FALSCHE
     Aufgabe getroffen. Dieser Fall haelt die Trennung fest. */
  hist({ id: 'R6:assigned', task: 'AG-EVJ-GLEICH', projekt: 'agentarium',
         lauf: 'LAUF-A', actor: 'atlas', reporter: 'atlas',
         recipient: 'forge', kind: 'assigned', title: 'gleiche Kennung, Projekt A' },
       '2026-10-20T14:00:00Z');
  hist({ id: 'R7:assigned', task: 'AG-EVJ-GLEICH', projekt: 'malstudio',
         lauf: 'LAUF-B', actor: 'atlas', reporter: 'atlas',
         recipient: 'forge', kind: 'assigned', title: 'gleiche Kennung, Projekt B' },
       '2026-10-20T14:01:00Z');
  /* Nur EINE der beiden wird begonnen -- die andere darf das nicht merken. */
  hist({ id: 'R6:started', task: 'AG-EVJ-GLEICH', projekt: 'agentarium',
         lauf: 'LAUF-A', actor: 'forge', reporter: 'forge',
         kind: 'started', title: 'nur Projekt A beginnt' },
       '2026-10-20T14:02:00Z');

  /* R8, R9 UND R10: KLEMMEN IN DER HISTORIE.
     Atlas' Bedingung vom 21.10. woertlich: "Projekt-/Lauftrennung und
     Wiederherstellung muessen dabei dieselbe Lage ergeben wie
     Live-Verarbeitung." Also muss eine Klemme, die vor dem Verbinden lag
     und nie aufgeloest wurde, nach dem Verbinden wieder da sein -- mit
     derselben Kennung, damit ein spaeteres `resolved` sie trifft.
       R8   vergeben, begonnen, geklemmt            -> offen, begonnen, klemmt
       R9   vergeben, geklemmt, aufgeloest          -> offen, ohne Klemme
       R10  vergeben, begonnen, geliefert, geklemmt -> zu, Klemme = Widerspruch
     R10 ist der Fall, der nicht stillschweigend gutgehen darf: Eine Klemme
     nach dem Abschluss behauptet, eine Aufgabe haenge, die laut denselben
     Daten vorbei ist. */
  hist({ id: 'R8:assigned', task: 'AG-EVJ-R8', actor: 'atlas', reporter: 'atlas',
         recipient: 'archibald', kind: 'assigned', title: 'R8 an archibald' },
       '2026-10-20T15:00:00Z');
  hist({ id: 'R8:started', task: 'AG-EVJ-R8', actor: 'archibald', reporter: 'archibald',
         kind: 'started', title: 'R8 begonnen' },
       '2026-10-20T15:01:00Z');
  hist({ id: 'R8:blocked', task: 'AG-EVJ-R8', actor: 'archibald', reporter: 'archibald',
         kind: 'blocked', blocker: 'KLEMME-R8-WARTET-AUF-SCOUT',
         title: 'R8 klemmt — wartet auf eine Zuarbeit' },
       '2026-10-20T15:02:00Z');

  hist({ id: 'R9:assigned', task: 'AG-EVJ-R9', actor: 'atlas', reporter: 'atlas',
         recipient: 'cadence', kind: 'assigned', title: 'R9 an cadence' },
       '2026-10-20T16:00:00Z');
  hist({ id: 'R9:blocked', task: 'AG-EVJ-R9', actor: 'cadence', reporter: 'cadence',
         kind: 'blocked', blocker: 'KLEMME-R9', title: 'R9 klemmte' },
       '2026-10-20T16:01:00Z');
  hist({ id: 'R9:resolved', task: 'AG-EVJ-R9', actor: 'cadence', reporter: 'cadence',
         kind: 'resolved', blocker: 'KLEMME-R9', title: 'R9 wieder frei' },
       '2026-10-20T16:02:00Z');

  hist({ id: 'R10:assigned', task: 'AG-EVJ-R10', actor: 'atlas', reporter: 'atlas',
         recipient: 'sentinel', kind: 'assigned', title: 'R10 an sentinel' },
       '2026-10-20T17:00:00Z');
  hist({ id: 'R10:started', task: 'AG-EVJ-R10', actor: 'sentinel', reporter: 'sentinel',
         kind: 'started', title: 'R10 begonnen' },
       '2026-10-20T17:01:00Z');
  hist({ id: 'R10:delivered', task: 'AG-EVJ-R10', actor: 'sentinel', reporter: 'sentinel',
         kind: 'delivered', title: 'R10 geliefert' },
       '2026-10-20T17:02:00Z');
  hist({ id: 'R10:blocked-nach-zu', task: 'AG-EVJ-R10', actor: 'sentinel',
         reporter: 'sentinel', kind: 'blocked', blocker: 'KLEMME-R10',
         title: 'Klemme NACH dem Abschluss — Widerspruch' },
       '2026-10-20T17:03:00Z');

  /* EIN ABBRUCH, DER SCHON DALIEGT, BEVOR VERBUNDEN WIRD. Das ist die
     zweite Haelfte von Argus' Befund: Der Zaehler stand ueber dem
     `basis`-Zweig und zaehlte damit auch Ereignisse von vorgestern als
     "in dieser Sitzung beobachtet". Er liegt jetzt dahinter -- und das
     wird hier gemessen, nicht behauptet. */
  antwort = H.concat([{ id: 89001, body: koerper({
      id: 'AG-EVENT-JOURNAL-001:forge:aborted-historisch', task: 'AG-EVJ-ALT',
      actor: 'forge', reporter: 'forge', kind: 'aborted',
      at: '2026-10-19T12:00:00Z',
      title: 'Ein Abbruch von vorgestern — Historie, nicht diese Sitzung'
    }), user: { login: 'github-actions[bot]', id: 41898282 },
    created_at: '2026-10-19T12:00:00Z' }]);

  await s.fill('#agGhToken', 'AGJOURNAL001_Scheintoken_fuer_den_Nachweis_0123456789');
  await s.click('#agGhAn');
  await s.waitForTimeout(2500);

  console.log('\nA2 — Ein Abbruch in der Historie zählt nicht für diese Sitzung');
  console.log('    erwartet: als markiert-historisch gezählt, nicht als Abbruch\n');
  const nachBasis = await s.evaluate(() => ({
    zahlen: (document.getElementById('agGhZahlen') || {}).textContent || '',
    letztes: (document.getElementById('agGhLetztes') || {}).textContent || ''
  }));
  zeile('als historisch erkannt', /markierte historisch/.test(nachBasis.zahlen), true);
  zeile('nicht abgespielt', /aborted-historisch/.test(nachBasis.letztes), false);
  zeile('NICHT als Abbruch dieser Sitzung gezählt',
        /in dieser Sitzung beobachtet/.test(nachBasis.zahlen), false);
  await s.evaluate(() => { const d = document.getElementById('agGhAuf'); if (d) d.open = true; });

  /* DEN KOPF JETZT ABLESEN, VOR DEM ERSTEN EREIGNIS. Genau dieser Moment ist
     der beobachtete: verbunden, LIVE, noch kein Strom. Spaeter meldet der
     Adapter den Lauf und ersetzt den Namen zu Recht -- wer erst dann
     hinsieht, misst den Normalfall und nicht den Fehlerfall. */
  const kopfWartend = await s.evaluate(() => ({
    werk: (document.getElementById('agWerkName') || {}).textContent || '',
    markiert: document.querySelectorAll('.wProjekte li.hier').length
  }));

  async function liefern(name, body, cid) {
    antwort = [{ id: cid, body: body,
                 user: { login: 'github-actions[bot]', id: 41898282 },
                 created_at: new Date().toISOString() }];
    await s.waitForTimeout(2800);
    return await s.evaluate(() => ({
      letztes: (document.getElementById('agGhLetztes') || {}).textContent || '',
      zahlen: (document.getElementById('agGhZahlen') || {}).textContent || '',
      grund: (document.getElementById('agGhGrund') || {}).textContent || ''
    }));
  }

  console.log('\nA3 — Was beim Verbinden offen war, liegt wieder da');
  console.log('    erwartet: R1 begonnen, R3 zugewiesen, R2 zu, R4 nicht');
  console.log('    begonnen, R5 gar nicht — und kein Flug, keine Meldung\n');
  const nachRestore = await s.evaluate(() => {
    const st = (window.__agStand && window.__agStand()) || {};
    const f = (id) => (st.aufgaben || []).filter(a => a.aufgabe === id)[0] || null;
    return {
      wieder: st.wiederhergestellt, abdeckung: st.abdeckung,
      R1: f('AG-EVJ-R1'), R2: f('AG-EVJ-R2'), R3: f('AG-EVJ-R3'),
      R4: f('AG-EVJ-R4'), R5: f('AG-EVJ-R5'),
      R8: f('AG-EVJ-R8'), R9: f('AG-EVJ-R9'), R10: f('AG-EVJ-R10'),
      klemmen: st.klemmen,
      verarbeitet: st.verarbeitet, ausgegeben: st.ausgegeben,
      fliegend: (st.fliegend || []).length,
      meldungen: document.querySelectorAll('.agRuf').length,
      zahlen: (document.getElementById('agGhZahlen') || {}).textContent || ''
    };
  });
  zeile('sieben offene Aufgaben übernommen', nachRestore.wieder, 7);
  zeile('R1 liegt bei scout', nachRestore.R1 ? nachRestore.R1.wer : null, 'scout');
  zeile('R1 ist begonnen', nachRestore.R1 ? nachRestore.R1.zustand : null, 'begonnen');
  zeile('R1 als wiederhergestellt gekennzeichnet',
        nachRestore.R1 ? nachRestore.R1.wieder : null, true);
  zeile('R2 ist zu — kein Ring', nachRestore.R2, null);
  zeile('R3 liegt bei argus', nachRestore.R3 ? nachRestore.R3.wer : null, 'argus');
  zeile('R3 nur zugewiesen', nachRestore.R3 ? nachRestore.R3.zustand : null, 'zugewiesen');
  zeile('R4 trotz Fremdaussage nur zugewiesen',
        nachRestore.R4 ? nachRestore.R4.zustand : null, 'zugewiesen');
  zeile('R5 ohne Vergabe gar nicht angelegt', nachRestore.R5, null);
  zeile('kein Flug aus der Historie', nachRestore.fliegend, 0);
  zeile('keine Meldung aus der Historie', nachRestore.meldungen, 0);
  zeile('nichts verarbeitet', nachRestore.verarbeitet, 0);
  zeile('nichts ausgegeben', nachRestore.ausgegeben, 0);
  zeile('Abdeckung partial, nie complete', nachRestore.abdeckung, 'partial');
  zeile('Fremdaussage ausgewiesen',
        /Fremdaussage/.test(nachRestore.zahlen), true);

  console.log('\nA5 — Klemmen aus der Historie: dieselbe Lage wie live');
  console.log('    erwartet: R8 klemmt weiter, R9 nicht mehr, und eine Klemme');
  console.log('    nach dem Abschluss ist ein Widerspruch, kein Ring\n');
  zeile('R8 liegt bei archibald',
        nachRestore.R8 ? nachRestore.R8.wer : null, 'archibald');
  /* DER ZUSTAND BLEIBT, WAS ER WAR. Eine Blockade ist kein Zustand der
     Aufgabe, sondern liegt neben ihm -- sonst muesste die Aufloesung raten,
     was vorher war. */
  zeile('R8 bleibt begonnen, nicht "blockiert"',
        nachRestore.R8 ? nachRestore.R8.zustand : null, 'begonnen');
  zeile('R8 traegt genau eine Klemme',
        nachRestore.R8 ? nachRestore.R8.klemmt.length : -1, 1);
  zeile('und zwar mit ihrer Kennung',
        nachRestore.R8 ? nachRestore.R8.klemmt[0].id : null,
        'KLEMME-R8-WARTET-AUF-SCOUT');
  /* Und der Grund kommt mit -- sonst waere eine wiederhergestellte Klemme
     eine Klemme ohne Anlass. */
  zeile('und mit ihrem Grund',
        nachRestore.R8 ? nachRestore.R8.klemmt[0].grund : null,
        'R8 klemmt \u2014 wartet auf eine Zuarbeit');
  zeile('R9 ist offen', !!nachRestore.R9, true);
  zeile('R9 klemmt nicht mehr',
        nachRestore.R9 ? nachRestore.R9.klemmt.length : -1, 0);
  zeile('R9 blieb zugewiesen — kein Beginn behauptet',
        nachRestore.R9 ? nachRestore.R9.zustand : null, 'zugewiesen');
  zeile('R10 ist zu — die Klemme danach macht nichts auf',
        nachRestore.R10, null);
  zeile('Widerspruch ausgewiesen',
        /Widerspruch/.test(nachRestore.zahlen), true);
  zeile('genau eine Klemme insgesamt übernommen', nachRestore.klemmen, 1);
  zeile('und in der Tafel benannt',
        /davon 1 mit Klemme/.test(nachRestore.zahlen), true);

  /* DAS WORT AM SCHILD. Hier stand bisher in jedem Fall "arbeitet", auch
     bei einer bloss zugewiesenen und bei einer geklemmten Aufgabe -- der
     Ring sagte es richtig, das Wort darunter nicht. Drei Faelle, drei
     Worte, und der dritte ist die Gegenprobe. */
  const schilder = await s.evaluate(() => {
    const w = (n) => {
      const e = document.querySelector('#agTun [data-wer="' + n + '"]');
      return e ? e.textContent.split(' ·')[0] : null;
    };
    return { archibald: w('archibald'), argus: w('argus'), scout: w('scout') };
  });
  zeile('archibald: begonnen und geklemmt → klemmt', schilder.archibald, 'klemmt');
  zeile('argus: nur zugewiesen → liegt', schilder.argus, 'liegt');
  zeile('scout: begonnen und frei → arbeitet', schilder.scout, 'arbeitet');

  console.log('\nA4 — Gleiche Rolle, gleiche Aufgabenkennung, zwei Projekte');
  console.log('    erwartet: zwei getrennte Ringe, und der Beginn des einen');
  console.log('    lässt den anderen unberührt\n');
  const zwei = await s.evaluate(() => {
    const st = (window.__agStand && window.__agStand()) || {};
    const g = (st.aufgaben || []).filter(a => a.aufgabe === 'AG-EVJ-GLEICH');
    const f = (pr) => g.filter(a => a.projekt === pr)[0] || null;
    return { anzahl: g.length, A: f('agentarium'), B: f('malstudio') };
  });
  zeile('beide Aufgaben vorhanden', zwei.anzahl, 2);
  zeile('A liegt bei forge', zwei.A ? zwei.A.wer : null, 'forge');
  zeile('B liegt auch bei forge', zwei.B ? zwei.B.wer : null, 'forge');
  zeile('A ist begonnen', zwei.A ? zwei.A.zustand : null, 'begonnen');
  zeile('B ist davon unberührt', zwei.B ? zwei.B.zustand : null, 'zugewiesen');
  zeile('A trägt seinen Lauf', zwei.A ? zwei.A.lauf : null, 'LAUF-A');
  zeile('B trägt seinen Lauf', zwei.B ? zwei.B.lauf : null, 'LAUF-B');

  /* Und die Gegenprobe im LIVEBETRIEB: Eine Lieferung in Projekt B darf
     die Aufgabe in Projekt A nicht schliessen. */
  await liefern('delivered-projektB', koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:delivered:B', task: 'AG-EVJ-GLEICH',
    projekt: 'malstudio', lauf: 'LAUF-B',
    actor: 'forge', reporter: 'forge', kind: 'delivered',
    title: 'Projekt B liefert — Projekt A bleibt'
  }), 90201);
  const danach = await s.evaluate(() => {
    const st = (window.__agStand && window.__agStand()) || {};
    const g = (st.aufgaben || []).filter(a => a.aufgabe === 'AG-EVJ-GLEICH');
    return { anzahl: g.length, projekte: g.map(a => a.projekt).sort().join(','),
             luecken: st.lueckenEinzeln ? st.lueckenEinzeln.lieferung : -1 };
  });
  zeile('B geschlossen, A bleibt offen', danach.anzahl, 1);
  zeile('und zwar A', danach.projekte, 'agentarium');
  zeile('keine Lücke gezählt — die Kennung war bekannt', danach.luecken, 0);

  console.log('\nB — Je ein Fixture, dieselbe Schnittstelle');
  console.log('    forge ist eine Claude-Rolle, sentinel eine ChatGPT-Rolle\n');

  /* Claude-Rolle: forge meldet seinen eigenen Beginn. */
  const r1 = await liefern('forge/started', koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:started', task: 'AG-EVJ-001',
    actor: 'forge', reporter: 'forge', kind: 'started',
    title: 'Forge hat begonnen — Selbstauskunft der arbeitenden Rolle'
  }), 90001);
  zeile('forge: started angenommen', /started/.test(r1.letztes), true);
  zeile('forge: als Akteur genannt', /forge/.test(r1.letztes), true);
  zeile('forge: nicht abgewiesen', r1.grund, '');

  /* ChatGPT-Rolle: sentinel meldet eine Lieferung, ebenfalls über sich. */
  const r2 = await liefern('sentinel/delivered', koerper({
    id: 'AG-EVENT-JOURNAL-001:sentinel:delivered', task: 'AG-EVJ-002',
    actor: 'sentinel', reporter: 'sentinel', kind: 'delivered',
    title: 'Sentinel hat geliefert — Prüfung und Annahme bleiben getrennt'
  }), 90002);
  zeile('sentinel: delivered angenommen', /delivered/.test(r2.letztes), true);
  zeile('sentinel: als Akteur genannt', /sentinel/.test(r2.letztes), true);
  zeile('sentinel: nicht abgewiesen', r2.grund, '');

  console.log('\nC — Melder und Akteur sind nicht dasselbe');
  console.log('    erwartet: Fremdaussage kommt an, gilt aber nicht als Selbstauskunft\n');
  const r3 = await liefern('atlas-ueber-forge', koerper({
    id: 'AG-EVENT-JOURNAL-001:atlas-ueber-forge:started', task: 'AG-EVJ-003',
    actor: 'forge', reporter: 'atlas', kind: 'started',
    title: 'Atlas meldet einen Beginn von forge — Fremdaussage'
  }), 90003);
  zeile('Fremdaussage angenommen', /started/.test(r3.letztes), true);
  const selbst = await s.evaluate(() => {
    const l = (window.__agLive && window.__agLive.liste) || null;
    return l ? null : undefined;        /* keine Innenschau: siehe unten */
  });
  console.log('        (Ob sie als Selbstauskunft gilt, prüft Schritt 2 am');
  console.log('         Aufgabenzustand — heute treibt noch keine Art einen.)');

  console.log('\nD — Ohne Melder wird nicht geraten');
  console.log('    erwartet: abgewiesen, Grund benannt\n');
  const r4 = await liefern('ohne-melder', koerper({
    id: 'AG-EVENT-JOURNAL-001:ohne-melder:started', task: 'AG-EVJ-004',
    actor: 'forge', kind: 'started',
    title: 'Beginn ohne Angabe, wer ihn meldet'
  }), 90004);
  zeile('abgewiesen', /reporter fehlt/.test(r4.grund), true);
  zeile('nicht als Ereignis gezeigt', /ohne-melder/.test(r4.letztes), false);

  console.log('\nE — Duplikat gegen Konflikt');
  console.log('    erwartet: derselbe Inhalt wirkungslos, anderer Inhalt abgewiesen\n');
  const gleich = koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:started', task: 'AG-EVJ-001',
    actor: 'forge', reporter: 'forge', kind: 'started',
    title: 'Forge hat begonnen — Selbstauskunft der arbeitenden Rolle'
  });
  const vorher = (await s.evaluate(() =>
    (document.getElementById('agGhZahlen') || {}).textContent || ''));
  const r5 = await liefern('duplikat', gleich, 90005);
  zeile('Duplikat gezählt', /doppelt [1-9]/.test(r5.zahlen), true);
  zeile('Duplikat nicht als Konflikt', /Konflikt 0/.test(r5.zahlen), true);

  const r6 = await liefern('konflikt', koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:started', task: 'AG-EVJ-001',
    actor: 'forge', reporter: 'forge', kind: 'started',
    title: 'Derselbe Schlüssel, anderer Titel — das ist ein Befund'
  }), 90006);
  zeile('Konflikt gezählt', /Konflikt [1-9]/.test(r6.zahlen), true);
  zeile('Konflikt begründet', /gleiche Kennung, anderer Inhalt/.test(r6.grund), true);

  console.log('\nF — Blockade ist kein Abbruch');
  console.log('    DIESER TEIL VERLANGTE ZUERST DAS FALSCHE SOLL. Er prüfte,');
  console.log('    dass `blocked` als Abbruch gezählt wird — und machte damit');
  console.log('    genau den Fehler grün, den Atlas vorher ausgeschlossen');
  console.log('    hatte: Die Zahl kommt aus typisierten Abbruchereignissen,');
  console.log('    „nicht aus Titeln und nicht aus BLOCKED". Gefunden von');
  console.log('    Argus. Eine Blockade wartet und kann sich auflösen, ein');
  console.log('    Abbruch ist gescheitert und endet.\n');
  const vorKlemme = await s.evaluate(() => {
    const st = (window.__agStand && window.__agStand()) || {};
    return st.lueckenEinzeln ? st.lueckenEinzeln.klemme : -1;
  });
  const r7 = await liefern('blocked', koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:blocked', task: 'AG-EVJ-001',
    actor: 'forge', reporter: 'forge', kind: 'blocked',
    blocker: 'KLEMME-F-OHNE-AUFGABE',
    title: 'Forge klemmt — Grund steht im Beleg, nicht im Bild'
  }), 90007);
  zeile('blocked angenommen', /blocked/.test(r7.letztes), true);
  zeile('blocked zählt NICHT als Abbruch',
        /Abbruch/.test(r7.zahlen), false);
  /* ABER ES WIRD GEZAEHLT, und zwar getrennt. Peter will das tatsaechliche
     Geschehen sehen; eine Blockade, die nirgends auftaucht, waere genau das
     Verschweigen, gegen das dieser Kandidat gebaut ist. */
  zeile('blocked zählt als Blockade',
        /in dieser Sitzung beobachtet: 1 Blockade/.test(r7.zahlen), true);
  /* AG-EVJ-001 ist nie vergeben worden (Teil B meldete nur einen Beginn).
     Eine Klemme ohne Aufgabe legt deshalb KEINE an -- das waere eine
     erfundene Aufgabe -- und bleibt eine gezaehlte Luecke. */
  const nachKlemme = await s.evaluate(() => {
    const st = (window.__agStand && window.__agStand()) || {};
    return { luecke: st.lueckenEinzeln ? st.lueckenEinzeln.klemme : -1,
             aufgabe: (st.aufgaben || []).filter(
               a => a.aufgabe === 'AG-EVJ-001').length };
  });
  zeile('ohne Aufgabe wird keine angelegt', nachKlemme.aufgabe, 0);
  zeile('und die Lücke wird gezählt', nachKlemme.luecke > vorKlemme, true);

  const r8 = await liefern('aborted', koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:aborted', task: 'AG-EVJ-005',
    actor: 'forge', reporter: 'forge', kind: 'aborted',
    title: 'Forge ist gescheitert — die Aufgabe endet hier'
  }), 90008);
  zeile('aborted angenommen', /aborted/.test(r8.letztes), true);
  /* Beide stehen jetzt in derselben Zeile, aber als ZWEI Zahlen. Eine
     Summe waere wieder der Fehler, den Argus gefunden hat. */
  zeile('aborted zählt als Abbruch',
        /1 Abbruch(?!e)/.test(r8.zahlen), true);
  zeile('und die Blockade steht daneben, nicht darin',
        /1 Blockade/.test(r8.zahlen), true);
  zeile('Abdeckung ausgewiesen', /Projektabdeckung: partial/.test(r8.zahlen), true);
  zeile('keine Projektzahl behauptet', /Projektabdeckung: complete/.test(r8.zahlen), false);

  console.log('\nG2 — Der Kopf behauptet im Livebetrieb kein Demoprojekt');
  console.log('    Atlas hat es an Peters Schirm beobachtet: verbunden, LIVE,');
  console.log('    „Wartet auf einen Strom" — und darüber „NACHTPOST V1".\n');
  const kopfJetzt = await s.evaluate(() => ({
    werk: (document.getElementById('agWerkName') || {}).textContent || ''
  }));
  /* Der Stueckwaehler im Projektblatt NENNT die Demostuecke -- das ist sein
     Zweck und richtig. Falsch waere, eines davon als das aktuelle zu
     markieren oder seinen Titel als laufendes Werk auszugeben. */
  const demoNamen = ['NACHTPOST V1', 'NACHTPOST V2',
                     'eine Stadt aus ungesendeten Briefen',
                     'Die Stadt, die sich gemeinsam verändert'];
  zeile('wartend: kein Demotitel im Werknamen',
        demoNamen.some(d => kopfWartend.werk.indexOf(d) >= 0), false);
  zeile('wartend: kein Stück als aktuell markiert', kopfWartend.markiert, 0);
  zeile('wartend: Betriebsart als Platzhalter', /LIVE/.test(kopfWartend.werk), true);
  console.log('        wartend:  „' + kopfWartend.werk.trim().slice(0, 56) + '"');
  /* Und die Gegenprobe: Sobald ein Lauf gemeldet ist, steht er da. Ohne
     diese Zeile wuerde ein Monitor, der NIE einen Namen zeigt, ebenfalls
     bestehen -- der Platzhalter ist kein Selbstzweck. */
  zeile('nach dem Lauf: der echte Lauf steht da',
        kopfJetzt.werk.indexOf('AG-EVENT-JOURNAL-001') >= 0, true);
  console.log('        danach:   „' + kopfJetzt.werk.trim().slice(0, 56) + '"');

  console.log('\nH — Der Zustand folgt dem Beleg: Vergabe, Beginn, Lieferung');
  console.log('    erwartet: zugewiesen ≠ begonnen, Fremdaussage treibt nicht,');
  console.log('    unbekannte Kennung schließt NICHTS\n');

  async function stand() {
    return await s.evaluate(() => (window.__agStand && window.__agStand()) || null);
  }
  function aufg(st, wer, id) {
    return (st.aufgaben || []).filter(a => a.wer === wer && a.aufgabe === id)[0] || null;
  }

  /* Vergabe durch Atlas -- der Vergebende meldet, nicht der Empfaenger. */
  await liefern('assigned', koerper({
    id: 'AG-EVENT-JOURNAL-001:atlas:assigned:H1', task: 'AG-EVJ-H1',
    actor: 'atlas', reporter: 'atlas', recipient: 'forge', kind: 'assigned',
    title: 'Atlas vergibt H1 an forge'
  }), 90101);
  let st = await stand();
  let a1 = aufg(st, 'forge', 'AG-EVJ-H1');
  zeile('Vergabe legt eine Aufgabe an', !!a1, true);
  zeile('und zwar als zugewiesen', a1 ? a1.zustand : null, 'zugewiesen');

  /* Dieselbe Vergabe nochmal: ein Transportduplikat darf keinen zweiten
     Ring erzeugen. Eigene Ereigniskennung, damit der Adapter sie nicht als
     Duplikat abweist -- geprueft wird die Wirkung, nicht der Filter. */
  await liefern('assigned-doppelt', koerper({
    id: 'AG-EVENT-JOURNAL-001:atlas:assigned:H1b', task: 'AG-EVJ-H1',
    actor: 'atlas', reporter: 'atlas', recipient: 'forge', kind: 'assigned',
    title: 'Dieselbe Vergabe ein zweites Mal'
  }), 90102);
  st = await stand();
  zeile('kein zweiter Ring für dieselbe Aufgabe',
        (st.aufgaben || []).filter(a => a.aufgabe === 'AG-EVJ-H1').length, 1);

  /* Fremdaussage: Atlas meldet den Beginn von forge. Darf NICHT treiben. */
  await liefern('started-fremd', koerper({
    id: 'AG-EVENT-JOURNAL-001:atlas:started:H1', task: 'AG-EVJ-H1',
    actor: 'forge', reporter: 'atlas', kind: 'started',
    title: 'Atlas behauptet den Beginn von forge'
  }), 90103);
  st = await stand();
  a1 = aufg(st, 'forge', 'AG-EVJ-H1');
  zeile('Fremdaussage ändert den Zustand nicht',
        a1 ? a1.zustand : null, 'zugewiesen');

  /* Selbstauskunft: forge meldet seinen eigenen Beginn. */
  await liefern('started-selbst', koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:started:H1', task: 'AG-EVJ-H1',
    actor: 'forge', reporter: 'forge', kind: 'started',
    title: 'Forge meldet den eigenen Beginn'
  }), 90104);
  st = await stand();
  a1 = aufg(st, 'forge', 'AG-EVJ-H1');
  zeile('Selbstauskunft setzt auf begonnen', a1 ? a1.zustand : null, 'begonnen');

  /* Lieferung zu einer UNBEKANNTEN Kennung: darf nichts schliessen. */
  const vorLuecke = (await stand()).luecken || 0;
  await liefern('delivered-unbekannt', koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:delivered:FREMD', task: 'AG-EVJ-GIBT-ES-NICHT',
    actor: 'forge', reporter: 'forge', kind: 'delivered',
    title: 'Lieferung zu einer Kennung, die hier niemand kennt'
  }), 90105);
  st = await stand();
  zeile('unbekannte Kennung schließt nichts',
        (st.aufgaben || []).filter(a => a.aufgabe === 'AG-EVJ-H1').length, 1);
  zeile('und wird als Lücke gezählt', (st.luecken || 0) > vorLuecke, true);
  zeile('nicht als Rateentscheidung', st.ratEinzeln ? st.ratEinzeln.auftrag : -1, 0);

  /* Und die richtige Lieferung schliesst genau sie. */
  await liefern('delivered-richtig', koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:delivered:H1', task: 'AG-EVJ-H1',
    actor: 'forge', reporter: 'forge', kind: 'delivered',
    title: 'Forge liefert H1 — Prüfung und Annahme bleiben getrennt'
  }), 90106);
  st = await stand();
  zeile('Lieferung schließt genau diese Aufgabe',
        (st.aufgaben || []).filter(a => a.aufgabe === 'AG-EVJ-H1').length, 0);

  console.log('\nJ — Blockade und Auflösung am laufenden Strom');
  console.log('    Atlas, 21.10., wörtlich: „Blockade lässt die Aufgabe');
  console.log('    liegen, Auflösung betrifft genau diese Blockade und');
  console.log('    behauptet keinen neuen Arbeitsbeginn oder Abschluss."\n');

  /* Eine eigene Aufgabe, damit nichts aus Teil H hineinspielt. */
  await liefern('J1:assigned', koerper({
    id: 'AG-EVENT-JOURNAL-001:atlas:assigned:J1', task: 'AG-EVJ-J1',
    actor: 'atlas', reporter: 'atlas', recipient: 'forge', kind: 'assigned',
    title: 'Atlas vergibt J1 an forge'
  }), 90301);
  await liefern('J1:started', koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:started:J1', task: 'AG-EVJ-J1',
    actor: 'forge', reporter: 'forge', kind: 'started',
    title: 'Forge beginnt J1'
  }), 90302);

  function j1(st) {
    return (st.aufgaben || []).filter(a => a.aufgabe === 'AG-EVJ-J1')[0] || null;
  }
  const r9 = await liefern('J1:blocked:K1', koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:blocked:J1:K1', task: 'AG-EVJ-J1',
    actor: 'forge', reporter: 'forge', kind: 'blocked', blocker: 'KLEMME-J1-K1',
    title: 'J1 klemmt an einer Zuarbeit'
  }), 90303);
  st = await stand();
  let J = j1(st);
  zeile('die Aufgabe liegt weiter da', !!J, true);
  zeile('und bleibt begonnen', J ? J.zustand : null, 'begonnen');
  zeile('sie trägt die Klemme', J ? J.klemmt.length : -1, 1);
  zeile('und zwar genau diese', J ? J.klemmt[0].id : null, 'KLEMME-J1-K1');
  /* IN DER LISTE NACHSEHEN KOENNEN -- Peters Aufteilung: der Effekt am
     Agenten sagt DASS, die Liste sagt WELCHE. */
  zeile('die Klemme steht in der Tafel',
        /Klemme KLEMME-J1-K1/.test(r9.letztes), true);

  /* Dasselbe nochmal, eigene Ereigniskennung: ein Transportduplikat der
     Klemme darf keine zweite erzeugen. */
  await liefern('J1:blocked:K1b', koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:blocked:J1:K1b', task: 'AG-EVJ-J1',
    actor: 'forge', reporter: 'forge', kind: 'blocked', blocker: 'KLEMME-J1-K1',
    title: 'Dieselbe Klemme ein zweites Mal'
  }), 90304);
  st = await stand();
  zeile('dieselbe Klemme zweimal ist einmal', j1(st).klemmt.length, 1);

  await liefern('J1:blocked:K2', koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:blocked:J1:K2', task: 'AG-EVJ-J1',
    actor: 'forge', reporter: 'forge', kind: 'blocked', blocker: 'KLEMME-J1-K2',
    title: 'Eine zweite, andere Klemme'
  }), 90305);
  st = await stand();
  zeile('zwei verschiedene Klemmen bleiben zwei', j1(st).klemmt.length, 2);

  /* DAS BILD DAZU, GEMESSEN STATT BEHAUPTET. Peter am 21.10.: "du hast doch
     liste und den block mit den aufgaben. warum da nicht jeweils einfuegen
     und einen kleinen resonanz-effekt am agenten selbst". Also stehen hier
     drei Dinge: die Zahl im Block, das Wort am Agenten, und dass der Ring
     nicht mehr gleichmaessig dreht. */
  const bild = await s.evaluate(() => {
    const w = document.getElementById('agWerkName');
    let bl = null;
    if (w) Array.prototype.forEach.call(w.querySelectorAll('.wAufZ'), z => {
      const u = z.querySelector('u'), b = z.querySelector('b');
      if (u && b && u.textContent === 'blockiert') bl = b.textContent;
    });
    return { blockiert: bl,
             schild: (document.getElementById('agTun') || {}).textContent || '' };
  });
  /* DREI, NICHT ZWEI -- UND DAS IST DIE RICHTIGE ZAHL. Hier stand zuerst
     eine 2, weil ich nur an J1 gedacht habe. Die Klemme von R8 liegt aus
     der Historie noch dazu und ist genauso offen; dass der Block sie
     mitzaehlt, ist das Gegenteil eines Fehlers. Gefunden vom Nachweis
     selbst, und die Rechnung steht jetzt daneben statt im Kopf. */
  zeile('der Block zählt alle offenen Klemmen (2 × J1 + 1 × R8)',
        bild.blockiert, '3');
  zeile('das Schild am Agenten sagt es', /1 klemmt/.test(bild.schild), true);
  /* Mischfall: forge hat eine freie und eine geklemmte Aufgabe. Dann heisst
     das Wort weiter "arbeitet" -- denn es wird gearbeitet -- und die Klemme
     steht als Zahl daneben. */
  const schildForge = await s.evaluate(() => {
    const e = document.querySelector('#agTun [data-wer="forge"]');
    return e ? e.textContent : '';
  });
  zeile('Mischfall: das Wort bleibt "arbeitet"',
        /^arbeitet /.test(schildForge), true);
  zeile('und die Klemme steht als Zahl daneben',
        /1 klemmt/.test(schildForge), true);
  /* UND DER RING SELBST, GEMESSEN. Hier stand zuerst eine Zusicherung, die
     nicht fallen konnte ("Stand abrufbar") -- derselbe Fehler, den ich am
     21.10. schon einmal gemacht habe, als ein Nachweis `.open` an einem
     `div` las. Gemessen wird jetzt der Ringwinkel ueber 1,4 Sekunden, also
     ueber mehr als einen Stocktakt (1,15 s): Ein laufender Ring wird
     groesser, ein geklemmter zuckt zurueck.
     Die Gegenprobe steht daneben und ist der Teil, der das Messgeraet
     prueft: R1 bei scout laeuft weiter. Ohne sie wuerde ein Ring, der
     UEBERHAUPT nicht mehr bewegt wird, ebenfalls bestehen. */
  const wA = await s.evaluate(() => {
    const st = (window.__agStand && window.__agStand()) || {};
    const g = (st.aufgaben || []);
    const f = (id) => (g.filter(a => a.aufgabe === id)[0] || {}).w;
    return { j1: f('AG-EVJ-J1'), r1: f('AG-EVJ-R1') };
  });
  await s.waitForTimeout(1400);
  const wB = await s.evaluate(() => {
    const st = (window.__agStand && window.__agStand()) || {};
    const g = (st.aufgaben || []);
    const f = (id) => (g.filter(a => a.aufgabe === id)[0] || {}).w;
    return { j1: f('AG-EVJ-J1'), r1: f('AG-EVJ-R1') };
  });
  zeile('der geklemmte Ring läuft nicht vorwärts', wB.j1 < wA.j1, true);
  zeile('Gegenprobe: ein laufender Ring tut es', wB.r1 > wA.r1, true);
  console.log('        geklemmt ' + wA.j1 + ' → ' + wB.j1 +
              ' · laufend ' + wA.r1 + ' → ' + wB.r1);

  /* FREMDAUSSAGE KLEMMT NICHT. Dieselbe Regel wie beim Beginn: Wer klemmt,
     sagt es selbst. */
  await liefern('J1:blocked-fremd', koerper({
    id: 'AG-EVENT-JOURNAL-001:atlas:blocked:J1:K3', task: 'AG-EVJ-J1',
    actor: 'forge', reporter: 'atlas', kind: 'blocked', blocker: 'KLEMME-J1-K3',
    title: 'Atlas behauptet eine Klemme von forge'
  }), 90306);
  st = await stand();
  zeile('Fremdaussage legt keine Klemme', j1(st).klemmt.length, 2);

  /* GENAU DIESE BLOCKADE. K2 wird aufgeloest, K1 bleibt. */
  await liefern('J1:resolved:K2', koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:resolved:J1:K2', task: 'AG-EVJ-J1',
    actor: 'forge', reporter: 'forge', kind: 'resolved', blocker: 'KLEMME-J1-K2',
    title: 'Die zweite Klemme ist weg'
  }), 90307);
  st = await stand();
  J = j1(st);
  zeile('nach der Auflösung bleibt eine', J.klemmt.length, 1);
  zeile('und es ist die andere', J.klemmt[0].id, 'KLEMME-J1-K1');
  zeile('kein Beginn behauptet', J.zustand, 'begonnen');
  zeile('kein Abschluss behauptet', !!J, true);

  /* EINE AUFLOESUNG OHNE PASSENDE KLEMME LOEST NICHTS. Sonst waere die
     verbleibende K1 die "naechstbeste" -- genau die Rateentscheidung, die
     dieser Monitor nicht mehr trifft. */
  const vorLoesung = st.lueckenEinzeln ? st.lueckenEinzeln.loesung : -1;
  await liefern('J1:resolved-unbekannt', koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:resolved:J1:K9', task: 'AG-EVJ-J1',
    actor: 'forge', reporter: 'forge', kind: 'resolved', blocker: 'KLEMME-GIBT-ES-NICHT',
    title: 'Auflösung einer Klemme, die hier niemand kennt'
  }), 90308);
  st = await stand();
  J = j1(st);
  zeile('unbekannte Klemme löst nichts auf', J.klemmt.length, 1);
  zeile('die verbliebene ist unberührt', J.klemmt[0].id, 'KLEMME-J1-K1');
  zeile('und wird als Lücke gezählt',
        (st.lueckenEinzeln ? st.lueckenEinzeln.loesung : -1) > vorLoesung, true);

  /* Und die letzte Aufloesung: keine Klemme mehr, und der Zustand ist
     derselbe wie vorher -- weder begonnen noch fertig behauptet. */
  await liefern('J1:resolved:K1', koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:resolved:J1:K1', task: 'AG-EVJ-J1',
    actor: 'forge', reporter: 'forge', kind: 'resolved', blocker: 'KLEMME-J1-K1',
    title: 'J1 läuft wieder'
  }), 90309);
  st = await stand();
  J = j1(st);
  zeile('keine Klemme mehr', J.klemmt.length, 0);
  zeile('die Aufgabe ist weiter offen', !!J, true);
  zeile('und weiter begonnen, nicht neu begonnen', J.zustand, 'begonnen');

  console.log('\nJ2 — Was der Vertrag bei Klemmen abweist\n');
  const r10 = await liefern('blocked-ohne-kennung', koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:blocked:ohne', task: 'AG-EVJ-J1',
    actor: 'forge', reporter: 'forge', kind: 'blocked',
    title: 'Blockade ohne eigene Kennung'
  }), 90310);
  zeile('blocked ohne blocker_id abgewiesen',
        /blocker_id fehlt/.test(r10.grund), true);
  const r11 = await liefern('started-mit-kennung', koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:started:mitKlemme', task: 'AG-EVJ-J1',
    actor: 'forge', reporter: 'forge', kind: 'started', blocker: 'KLEMME-FALSCH',
    title: 'Ein Beginn, der eine Klemme nennt'
  }), 90311);
  zeile('blocker_id an fremder Art abgewiesen',
        /blocker_id nicht erlaubt/.test(r11.grund), true);

  console.log('\nJ3 — Klemmen folgen der Projekttrennung');
  console.log('    dieselbe Rolle, dieselbe Aufgabenkennung, zwei Projekte:');
  console.log('    eine Klemme in A lässt B unberührt\n');
  await liefern('J2:assigned:C', koerper({
    id: 'AG-EVENT-JOURNAL-001:atlas:assigned:J2C', task: 'AG-EVJ-J2',
    projekt: 'agentarium', lauf: 'LAUF-C',
    actor: 'atlas', reporter: 'atlas', recipient: 'nova', kind: 'assigned',
    title: 'J2 in Projekt C'
  }), 90321);
  await liefern('J2:assigned:D', koerper({
    id: 'AG-EVENT-JOURNAL-001:atlas:assigned:J2D', task: 'AG-EVJ-J2',
    projekt: 'malstudio', lauf: 'LAUF-D',
    actor: 'atlas', reporter: 'atlas', recipient: 'nova', kind: 'assigned',
    title: 'J2 in Projekt D'
  }), 90322);
  await liefern('J2:blocked:C', koerper({
    id: 'AG-EVENT-JOURNAL-001:nova:blocked:J2C', task: 'AG-EVJ-J2',
    projekt: 'agentarium', lauf: 'LAUF-C',
    actor: 'nova', reporter: 'nova', kind: 'blocked', blocker: 'KLEMME-J2-C',
    title: 'Nur Projekt C klemmt'
  }), 90323);
  st = await stand();
  const jc = (st.aufgaben || []).filter(
    a => a.aufgabe === 'AG-EVJ-J2' && a.lauf === 'LAUF-C')[0] || null;
  const jd = (st.aufgaben || []).filter(
    a => a.aufgabe === 'AG-EVJ-J2' && a.lauf === 'LAUF-D')[0] || null;
  zeile('beide Aufgaben vorhanden', !!(jc && jd), true);
  zeile('C klemmt', jc ? jc.klemmt.length : -1, 1);
  zeile('D klemmt nicht', jd ? jd.klemmt.length : -1, 0);
  /* Und die Aufloesung in C trifft nicht D -- auch nicht, wenn D irgendwann
     dieselbe Klemmenkennung tragen sollte. */
  await liefern('J2:resolved:C', koerper({
    id: 'AG-EVENT-JOURNAL-001:nova:resolved:J2C', task: 'AG-EVJ-J2',
    projekt: 'agentarium', lauf: 'LAUF-C',
    actor: 'nova', reporter: 'nova', kind: 'resolved', blocker: 'KLEMME-J2-C',
    title: 'C ist wieder frei'
  }), 90324);
  st = await stand();
  zeile('C aufgelöst', (st.aufgaben || []).filter(
    a => a.aufgabe === 'AG-EVJ-J2' && a.lauf === 'LAUF-C')[0].klemmt.length, 0);
  zeile('D unverändert offen', (st.aufgaben || []).filter(
    a => a.aufgabe === 'AG-EVJ-J2' && a.lauf === 'LAUF-D').length, 1);

  console.log('\nK — Der Originalbeleg: wo die Angabe steht, nicht nur dass sie steht');
  console.log('    Atlas verlangt den eindeutig auflösbaren Originalbeleg.');
  console.log('    Als PFLICHTFELD des Senders kann es ihn nicht geben: Die');
  console.log('    Kommentarnummer vergibt GitHub erst beim Schreiben, der');
  console.log('    Melder kennt sie also nicht. Abgeleitet wird sie dort, wo');
  console.log('    gelesen wird — und das ist nachprüfbar.\n');
  /* An der Vergabe von J1 (Kommentar 90301) haengt der Beleg. */
  st = await stand();
  const jb = (st.aufgaben || []).filter(a => a.aufgabe === 'AG-EVJ-J1')[0] || null;
  zeile('die Aufgabe trägt ihren Beleg', jb ? jb.beleg : null, '90301');
  zeile('und die auflösbare Adresse dazu',
        jb ? /^https:\/\/api\.github\.com\/repos\/pahlborn\/agentarium\/issues\/comments\/90301$/
               .test(jb.belegRef) : null, true);
  /* Die Adresse ist aus ENDPOINT gerechnet, nicht zweimal hingeschrieben:
     Sie zeigt auf denselben Vorgang, aus dem gelesen wurde. */
  zeile('Adresse endet genau auf diese Nummer',
        jb ? jb.belegRef.slice(-6) === '/90301' : null, true);

  /* IN DER TAFEL UND IN DER LISTE. Eine Nummer, die nur im Stand steht,
     hilft dem nicht, der hinsieht. */
  const belegBild = await s.evaluate(() => ({
    letztes: (document.getElementById('agGhLetztes') || {}).textContent || '',
    liste: Array.prototype.map.call(
      document.querySelectorAll('.agHerkunft'), e => e.textContent).join(' | ')
  }));
  zeile('die Tafel nennt den Beleg',
        /Beleg Kommentar \d+/.test(belegBild.letztes), true);
  zeile('die Listenzeile nennt ihn auch',
        /Beleg \d+/.test(belegBild.liste), true);

  /* EIN FALSCH GEPAARTER BELEG WIRD VERWORFEN, NICHT ANGEZEIGT. Nummer und
     Adresse muessen zusammengehoeren; sonst zeigte ein nachsehbar
     AUSSEHENDER Beleg auf etwas anderes -- schlimmer als keiner.
     Geprueft am Griff des Originals, denn der Adapter leitet die Adresse
     selbst ab und koennte sie gar nicht falsch paaren. Genau deshalb muss
     das Original es trotzdem pruefen: Es ist auch ohne ihn aufrufbar. */
  const falsch = await s.evaluate(() => {
    const r = window.__agEreignis({
      id: 'AG-EVENT-JOURNAL-001:beleg-falsch', actor: 'forge', kind: 'progress',
      title: 'Nummer und Adresse passen nicht zusammen',
      occurred_at: '2026-10-21T12:00:00Z', source_evidence: 'runtime_stream',
      gh_beobachtet: true, project_id: 'agentarium',
      run_id: 'AG-EVENT-JOURNAL-001', task_id: 'AG-EVJ-BELEG',
      source_tool_id: 'previews/AG-EVENT-JOURNAL-001/pruefen.js',
      reporter: 'forge', gh_selbstauskunft: true,
      source_comment: '90401',
      source_ref: 'https://api.github.com/repos/pahlborn/agentarium/issues/comments/90999'
    });
    return { angenommen: !!(r && r.angenommen) };
  });
  zeile('Ereignis selbst bleibt gültig', falsch.angenommen, true);
  await s.waitForTimeout(600);
  const falschBild = await s.evaluate(() => Array.prototype.map.call(
    document.querySelectorAll('.agHerkunft'), e => e.textContent).join(' | '));
  /* Die NUMMER bleibt -- sie ist fuer sich genommen eine Angabe. Die
     unpassende ADRESSE wird fallen gelassen, statt mitgeschleppt zu werden. */
  zeile('die Nummer wird gezeigt', /Beleg 90401/.test(falschBild), true);
  const refFalsch = await s.evaluate(() => {
    const st = (window.__agStand && window.__agStand()) || {};
    return (st.aufgaben || []).filter(a => a.aufgabe === 'AG-EVJ-BELEG').length;
  });
  zeile('und keine Aufgabe daraus erfunden', refFalsch, 0);

  /* UND DER RESTORE: R8s Klemme kam aus der Historie und hat keine
     Listenzeile. Ohne Beleg waere sie der einzige Teil der Anzeige, zu dem
     es keinen Weg zurueck gibt. */
  /* UND ZWAR DEN DER VERGABE, nicht den des letzten Ereignisses. R8 besteht
     aus drei Kommentaren (Vergabe, Beginn, Klemme); live haengt die Aufgabe
     am Kommentar der VERGABE. Wuerde der Restore den letzten nehmen, zeigte
     dieselbe Lage je nach Weg auf zwei verschiedene Quellen -- genau das,
     was Atlas ausschliesst. Die Nummern stehen in der Historie fest:
     R8:assigned ist der erste der drei. */
  zeile('R8 aus der Historie trägt ihren Beleg',
        nachRestore.R8 && nachRestore.R8.beleg ? /^\d+$/.test(nachRestore.R8.beleg) : null,
        true);
  zeile('und es ist der Beleg der VERGABE, nicht der letzte',
        (nachRestore.R8 && nachRestore.R8.klemmt[0])
          ? Number(nachRestore.R8.beleg) < Number(nachRestore.R8.klemmt[0].beleg)
          : null, true);
  zeile('und die Klemme von R8 auch',
        nachRestore.R8 && nachRestore.R8.klemmt[0]
          ? /^\d+$/.test(nachRestore.R8.klemmt[0].beleg) : null, true);

  console.log('\nI — Was auch jetzt noch NICHT geschieht');
  console.log('    erwartet: kein Ballwechsel aus Lebenszyklusereignissen,');
  console.log('    und reviewed/accepted/merged/published fehlen weiter\n');
  zeile('kein Ball verschoben', st.ball || null, null);
  zeile('keine Seitenfehler', pageErr.length, 0);
  if (pageErr.length) console.log('        ' + pageErr.join('\n        '));

  await b.close();
  n.s.close();

  if (fehler) {
    console.log('\n' + fehler + ' ABWEICHUNG' + (fehler > 1 ? 'EN' : '') + '.');
    process.exit(1);
  }
  console.log('\nALLES WIE VEREINBART — keine Abweichung.');
  console.log('Vertrag und Zustände: Vergabe legt hin, Selbstauskunft beginnt,');
  console.log('Lieferung schließt genau ihre Aufgabe — und eine unbekannte');
  console.log('Kennung schließt nichts, sondern bleibt eine gezählte Lücke.');
  console.log('Blockade und Auflösung liegen NEBEN dem Zustand: die Aufgabe');
  console.log('bleibt liegen, eine Auflösung trifft genau ihre Klemme und');
  console.log('behauptet keinen Beginn und keinen Abschluss — in der');
  console.log('Wiederherstellung dieselbe Lage wie am laufenden Strom.');
  console.log('Offen und sichtbar offen: reviewed/accepted/merged/published');
  console.log('fehlen, die Archivwiedergabe aus derselben Quelle fehlt, und');
  console.log('der Originalbeleg hat noch kein eigenes Feld.');
  console.log('Synthetische Körper, kein Relais, keine Abnahme am iPad.');
  process.exit(0);
})().catch(e => { ungeprueft('Nachweis abgebrochen: ' + (e && e.message)); });
