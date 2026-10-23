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
  if (f.werk) ev.artifact_id = f.werk;
  if (f.werkV) ev.artifact_version = f.werkV;
  if (f.typ) ev.item_type = f.typ;
  if (f.eltern) ev.parent_id = f.eltern;
  if (f.eFassung) ev.item_version = f.eFassung;
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
    fassung: (window.__agGithubBruecke || {}).fassung,
    akteure: ((window.__agGithubBruecke || {}).akteure || []).slice().sort()
  }));
  zeile('kommunikation', z.komm, 'beobachtet-v1');
  /* V3. Jede Stufe hat das Wort weitergestellt, weil jede etwas aendert,
     was eine aeltere Fassung falsch machen wuerde: v2 legte Klemmen an die
     Aufgabe, v3 hat die ganze Kette -- und bei v2 schloss `delivered` die
     Aufgabe noch, so dass eine spaetere Annahme ins Leere fiele. Ein
     Original aus dem Vorrat, das ein aelteres Wort sagt, bekommt die
     Lebenszyklusarten deshalb gar nicht erst. */
  zeile('lebenszyklus', z.leben, 'gemeldet-v5');
  console.log('        Fassung des Originals: ' + z.fassung);

  /* DIE AKTEURSLISTE IST DER TORWAeCHTER, nicht ein Beiwerk. Der Adapter
     baut `AKTEURE` aus genau diesem Feld (github-live.js: `(B.akteure ||
     []).forEach`) und weist jedes Ereignis ab, dessen actor nicht darin
     steht. Bis Fassung 70 fehlte `lot` -- der Monitor konnte den nicht
     zeigen, der ihn gebaut hat, und Weg A war fuer ihn verschlossen. Peter
     hat am 23.10. aufgenommen; geprueft wird deshalb die GANZE Liste, denn
     ein stiller Verlust eines anderen Namens waere dieselbe Sperre fuer
     den Betroffenen. */
  zeile('Akteure (die Liste des Adapters)', z.akteure.join(','),
        'archibald,argus,atlas,cadence,forge,lot,nova,peter,scout,sentinel');

  /* ===== SCHRITT 2b: WAS BEIM VERBINDEN SCHON OFFEN WAR =====
     Eine Historie mit drei Aufgaben, die sich unterscheiden MUESSEN:
       R1  vergeben und begonnen, nicht geliefert   -> bleibt offen, begonnen
       R2  vergeben, begonnen, geliefert, SELBST
           angenommen                               -> bleibt OFFEN, geliefert
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
  /* R2 SCHLIESST DURCH ANNAHME, NICHT DURCH LIEFERUNG. Bis Fassung 66
     schloss `delivered`; mit Pruefung und Annahme in der Kette waere die
     Aufgabe weg, bevor jemand sie angesehen hat. R2 traegt deshalb beides,
     und die Lieferung liegt absichtlich VOR der Antwort und mit derselben
     occurred_at wie der Beginn -- die Ordnung muss aus recorded_at und
     Kommentarnummer entstehen. */
  hist({ id: 'R2:delivered', task: 'AG-EVJ-R2', actor: 'forge', reporter: 'forge',
         kind: 'delivered', title: 'R2 geliefert' },
       '2026-10-20T09:00:00Z', '2026-10-20T09:00:30Z');
  hist({ id: 'R2:accepted', task: 'AG-EVJ-R2', actor: 'forge', reporter: 'forge',
         kind: 'accepted', title: 'R2 angenommen — erst das schließt' },
       '2026-10-20T09:10:00Z');
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

  /* R11: GELIEFERT UND NIEMAND HAT ES ANGENOMMEN.
     Das ist der Fall, den die neue Kette ueberhaupt erst sichtbar macht.
     Vorher verschwand so eine Aufgabe mit der Lieferung aus dem Bild --
     und sah damit aus wie erledigt, obwohl sie auf jemanden wartet. */
  hist({ id: 'R11:assigned', task: 'AG-EVJ-R11', actor: 'atlas', reporter: 'atlas',
         recipient: 'nova', kind: 'assigned', title: 'R11 an nova' },
       '2026-10-20T18:00:00Z');
  hist({ id: 'R11:received', task: 'AG-EVJ-R11', actor: 'nova', reporter: 'nova',
         kind: 'received', title: 'R11 empfangen' },
       '2026-10-20T18:01:00Z');
  hist({ id: 'R11:started', task: 'AG-EVJ-R11', actor: 'nova', reporter: 'nova',
         kind: 'started', title: 'R11 begonnen' },
       '2026-10-20T18:02:00Z');
  hist({ id: 'R11:delivered', task: 'AG-EVJ-R11', actor: 'nova', reporter: 'nova',
         kind: 'delivered', title: 'R11 geliefert — und dann nichts mehr' },
       '2026-10-20T18:03:00Z');

  /* R12: geliefert UND geprueft, aber nicht angenommen. Die Pruefung ist
     eine eigene Stufe und nicht die Annahme -- genau die Trennung, die das
     Regelwerk verlangt. */
  hist({ id: 'R12:assigned', task: 'AG-EVJ-R12', actor: 'atlas', reporter: 'atlas',
         recipient: 'cadence', kind: 'assigned', title: 'R12 an cadence' },
       '2026-10-20T19:00:00Z');
  hist({ id: 'R12:started', task: 'AG-EVJ-R12', actor: 'cadence', reporter: 'cadence',
         kind: 'started', title: 'R12 begonnen' },
       '2026-10-20T19:01:00Z');
  hist({ id: 'R12:delivered', task: 'AG-EVJ-R12', actor: 'cadence', reporter: 'cadence',
         kind: 'delivered', title: 'R12 geliefert' },
       '2026-10-20T19:02:00Z');
  /* GEPRUEFT VON ARGUS, nicht von cadence selbst. Hier stand
     `actor: 'cadence'` -- und cadence HAELT R12. Eine Selbstpruefung also,
     und sie stellte den Zustand weiter. Gemeint war: geprueft ist noch
     nicht angenommen. Dafuer muss die Pruefung zaehlen, also prueft die
     Rolle, die prueft. */
  hist({ id: 'R12:reviewed', task: 'AG-EVJ-R12', actor: 'argus', reporter: 'argus',
         kind: 'reviewed', title: 'R12 geprüft von Argus — aber nicht angenommen' },
       '2026-10-20T19:03:00Z');
  /* Und ein zweites `delivered` danach: ein Rueckschritt darf nicht
     geschehen, und als Widerspruch zaehlt ein Duplikat auch nicht. */
  hist({ id: 'R12:delivered-nochmal', task: 'AG-EVJ-R12', actor: 'cadence',
         reporter: 'cadence', kind: 'delivered', title: 'dieselbe Lieferung nochmal' },
       '2026-10-20T19:04:00Z');

  /* R13: DIE ECHTE ARBEITSTEILUNG, und genau der Fall, den meine bisherigen
     Fixtures VERDECKT haben. Atlas' Befund vom 21.10. (6319743049):
     Pruefung und Annahme waren an den Aufgabenhalter gebunden, und in R12
     prueft und annimmt dieselbe Rolle, die geliefert hat. Hier nicht:

       atlas  vergibt an forge
       forge  empfaengt, beginnt, liefert
       argus  meldet seine EIGENE Pruefung    (nicht Halter)
       atlas  meldet seine EIGENE Annahme     (nicht Halter)

     Eine Selbstmeldung des Pruefers ist etwas anderes als eine
     Selbstabnahme des Lieferanten. */
  hist({ id: 'R13:assigned', task: 'AG-EVJ-R13', actor: 'atlas', reporter: 'atlas',
         recipient: 'forge', kind: 'assigned', title: 'R13 an forge' },
       '2026-10-20T20:00:00Z');
  hist({ id: 'R13:received', task: 'AG-EVJ-R13', actor: 'forge', reporter: 'forge',
         kind: 'received', title: 'R13 empfangen' },
       '2026-10-20T20:01:00Z');
  hist({ id: 'R13:started', task: 'AG-EVJ-R13', actor: 'forge', reporter: 'forge',
         kind: 'started', title: 'R13 begonnen' },
       '2026-10-20T20:02:00Z');
  hist({ id: 'R13:delivered', task: 'AG-EVJ-R13', actor: 'forge', reporter: 'forge',
         kind: 'delivered', title: 'R13 geliefert' },
       '2026-10-20T20:03:00Z');
  hist({ id: 'R13:reviewed-argus', task: 'AG-EVJ-R13', actor: 'argus', reporter: 'argus',
         kind: 'reviewed', title: 'Argus prüft — nicht der Halter' },
       '2026-10-20T20:04:00Z');

  /* R14: dasselbe, aber bis zur Annahme durch atlas. Die Aufgabe muss danach
     ZU sein -- und zwar geschlossen von einem, der sie nie gehalten hat. */
  hist({ id: 'R14:assigned', task: 'AG-EVJ-R14', actor: 'atlas', reporter: 'atlas',
         recipient: 'forge', kind: 'assigned', title: 'R14 an forge' },
       '2026-10-20T21:00:00Z');
  hist({ id: 'R14:started', task: 'AG-EVJ-R14', actor: 'forge', reporter: 'forge',
         kind: 'started', title: 'R14 begonnen' },
       '2026-10-20T21:01:00Z');
  hist({ id: 'R14:delivered', task: 'AG-EVJ-R14', actor: 'forge', reporter: 'forge',
         kind: 'delivered', title: 'R14 geliefert' },
       '2026-10-20T21:02:00Z');
  hist({ id: 'R14:reviewed-sentinel', task: 'AG-EVJ-R14', actor: 'sentinel',
         reporter: 'sentinel', kind: 'reviewed', title: 'Sentinel prüft' },
       '2026-10-20T21:03:00Z');
  hist({ id: 'R14:accepted-atlas', task: 'AG-EVJ-R14', actor: 'atlas', reporter: 'atlas',
         kind: 'accepted', title: 'Atlas nimmt fachlich an — und schließt damit' },
       '2026-10-20T21:04:00Z');

  /* R15: die Gegenprobe zur Selbstauskunft. Atlas BEHAUPTET Argus' Pruefung.
     Das ist eine Fremdaussage und darf nichts weiterstellen -- sonst waere
     die Loesung des Halterproblems gleich die naechste Luecke. */
  hist({ id: 'R15:assigned', task: 'AG-EVJ-R15', actor: 'atlas', reporter: 'atlas',
         recipient: 'scout', kind: 'assigned', title: 'R15 an scout' },
       '2026-10-20T22:00:00Z');
  hist({ id: 'R15:delivered', task: 'AG-EVJ-R15', actor: 'scout', reporter: 'scout',
         kind: 'delivered', title: 'R15 geliefert' },
       '2026-10-20T22:01:00Z');
  hist({ id: 'R15:reviewed-fremd', task: 'AG-EVJ-R15', actor: 'argus', reporter: 'atlas',
         kind: 'reviewed', title: 'Atlas behauptet Argus hätte geprüft' },
       '2026-10-20T22:02:00Z');

  /* R16, R17, R18: EINE ELTERNKETTE IN DER HISTORIE.
     Atlas verlangt, dass Live und Restore dieselbe Lage ergeben. Teil N
     prueft die Kette am laufenden Strom; hier liegt sie VOR dem Verbinden.
     Absichtlich NICHT bei forge: Der Ringnachweis in Teil J misst eine
     Aufgabe von forge, und `arbeitSchritt` fasst nur die ersten vier Ringe
     je Rolle an. Eine fuenfte Aufgabe bei forge haette die Messung still
     eingefroren -- derselbe Fall, den die Voraussetzungszeile dort jetzt
     benennt. */
  hist({ id: 'R16:epic', task: 'AG-LM-EP-003', actor: 'atlas', reporter: 'atlas',
         recipient: 'sentinel', kind: 'assigned', typ: 'epic', eFassung: 'V1',
         title: 'Projektarbeit fortsetzen und nachvollziehen' },
       '2026-10-20T23:00:00Z');
  hist({ id: 'R17:story', task: 'AG-LM-US-009', actor: 'atlas', reporter: 'atlas',
         recipient: 'archibald', kind: 'assigned', typ: 'story',
         eltern: 'AG-LM-EP-003', eFassung: 'V1',
         title: 'Vergangene Arbeit nachvollziehen' },
       '2026-10-20T23:01:00Z');
  hist({ id: 'R18:task', task: 'AG-LM-TK-017', actor: 'atlas', reporter: 'atlas',
         recipient: 'cadence', kind: 'assigned',
         eltern: 'AG-LM-US-009',
         title: 'Archivmodus an dieselbe Quelle anschließen' },
       '2026-10-20T23:02:00Z');
  hist({ id: 'R18:started', task: 'AG-LM-TK-017', actor: 'cadence', reporter: 'cadence',
         kind: 'started', title: 'Cadence beginnt TK-017' },
       '2026-10-20T23:03:00Z');

  /* R19: ZWEI VERGABEN DERSELBEN KENNUNG, DIE SICH WIDERSPRECHEN.
     Archibald R3, von Atlas am 23.10. zum Vorziehen freigegeben. Bis
     Fassung 74 gewann in der Faltung die LETZTE Vergabe, und zwar ohne ein
     Wort: `eTyp`/`eEltern` wurden je Ereignis der Gruppe neu zugewiesen.
     Erwartet jetzt: Das ERSTE bleibt stehen, und der Widerspruch erscheint
     in der vorhandenen Konfliktanzeige -- keine neue Anzeige, so wie Atlas
     es verlangt hat.
     Absichtlich bei `nova`: forges erste vier Ringe werden in Teil J
     gemessen, und ein fuenfter dort haette die Messung still eingefroren.
     Und absichtlich mit EIGENEN Elternkennungen (EP-019/US-019): Beim
     ersten Anlauf hing R19 unter EP-003, und damit fiel eine ganz andere
     Zeile -- "unter der Epic steht genau das Gemeldete" zaehlte ploetzlich
     zwei Kinder. Die Zeile hatte recht; mein Fixture hatte eine fremde
     Behauptung mitbenutzt. */
  hist({ id: 'R19:assigned-1', task: 'AG-EVJ-R19', actor: 'atlas', reporter: 'atlas',
         recipient: 'nova', kind: 'assigned', typ: 'story',
         eltern: 'AG-LM-EP-019', eFassung: 'V1',
         title: 'R19 zuerst als story unter EP-019' },
       '2026-10-20T23:30:00Z');
  hist({ id: 'R19:assigned-2', task: 'AG-EVJ-R19', actor: 'atlas', reporter: 'atlas',
         recipient: 'nova', kind: 'assigned', typ: 'task',
         eltern: 'AG-LM-US-019', eFassung: 'V1',
         title: 'R19 danach als task unter US-019 — das widerspricht' },
       '2026-10-20T23:31:00Z');

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
  /* ANGENOMMEN VON ATLAS, nicht von sentinel selbst. Hier stand
     `actor: 'sentinel'` -- und sentinel HAELT R10. Das war eine
     Selbstannahme, und sie schloss, weil die Regel fehlte (Archibald R5,
     23.10.). Gepruefen wollte dieses Fixture etwas ganz anderes: dass eine
     Klemme NACH dem Abschluss ein Widerspruch ist. Dafuer muss es
     wirklich schliessen, also nimmt die Rolle an, die abnimmt. */
  hist({ id: 'R10:accepted', task: 'AG-EVJ-R10', actor: 'atlas', reporter: 'atlas',
         kind: 'accepted', title: 'R10 angenommen — von Atlas, nicht vom Halter' },
       '2026-10-20T17:02:30Z');
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
  console.log('    erwartet: R1 begonnen, R3 zugewiesen, R2 OFFEN (nur selbst');
  console.log('    angenommen), R4 nicht');
  console.log('    begonnen, R5 gar nicht — und kein Flug, keine Meldung\n');
  const nachRestore = await s.evaluate(() => {
    const st = (window.__agStand && window.__agStand()) || {};
    const f = (id) => (st.aufgaben || []).filter(a => a.aufgabe === id)[0] || null;
    return {
      wieder: st.wiederhergestellt, abdeckung: st.abdeckung,
      R1: f('AG-EVJ-R1'), R2: f('AG-EVJ-R2'), R3: f('AG-EVJ-R3'),
      R4: f('AG-EVJ-R4'), R5: f('AG-EVJ-R5'),
      R8: f('AG-EVJ-R8'), R9: f('AG-EVJ-R9'), R10: f('AG-EVJ-R10'),
      R11: f('AG-EVJ-R11'), R12: f('AG-EVJ-R12'),
      R13: f('AG-EVJ-R13'), R14: f('AG-EVJ-R14'), R15: f('AG-EVJ-R15'),
      R19: f('AG-EVJ-R19'),
      EP: f('AG-LM-EP-003'), US: f('AG-LM-US-009'), TK: f('AG-LM-TK-017'),
      kinderVonEP: (st.aufgaben || []).filter(
        a => a.eEltern === 'AG-LM-EP-003').length,
      klemmen: st.klemmen,
      /* Gemeldet vom Adapter, nicht vom Original gemessen -- siehe dort. */
      selbstGemeldet: st.selbstannahmenGemeldet,
      verarbeitet: st.verarbeitet, ausgegeben: st.ausgegeben,
      fliegend: (st.fliegend || []).length,
      meldungen: document.querySelectorAll('.agRuf').length,
      zahlen: (document.getElementById('agGhZahlen') || {}).textContent || ''
    };
  });
  /* FUENFZEHN, nicht vierzehn: R2 bleibt offen, seit eine Selbstannahme
     nicht mehr schliesst (Archibald R5, Atlas' Lesart A, 23.10.). Die Zahl
     steht hier als Zahl, damit eine stille Verschiebung auffaellt -- und
     dass sie sich um genau eine geaendert hat, ist der Beleg, dass die
     Regel genau einen Fall trifft und nicht mehr. */
  zeile('sechzehn offene Aufgaben übernommen', nachRestore.wieder, 16);
  zeile('R1 liegt bei scout', nachRestore.R1 ? nachRestore.R1.wer : null, 'scout');
  zeile('R1 ist begonnen', nachRestore.R1 ? nachRestore.R1.zustand : null, 'begonnen');
  zeile('R1 als wiederhergestellt gekennzeichnet',
        nachRestore.R1 ? nachRestore.R1.wieder : null, true);
  /* ====== R2 IST DER GEGENTEST, NICHT DER NORMALFALL ======
     Bis Fassung 73 stand hier "R2 ist zu -- kein Ring", und das war die
     Masche in die falsche Richtung: R2 ist an forge vergeben, und forge
     meldet `accepted` SELBST. Die Zeile behauptete also eine Selbstannahme
     als gueltigen Abschluss -- und verteidigte damit den Fehler gegen den,
     der ihn findet. Gefunden hat ihn Archibald (R5), entschieden hat Atlas
     (Lesart A, 23.10.).

     R2 bleibt mit Absicht eine Selbstannahme und ist jetzt der Gegentest.
     Der unabhaengige Fall steht daneben: R14, von atlas angenommen, und
     der schliesst. Zwei Faelle, zwei Ergebnisse -- vorher hatten sie
     dasselbe. */
  zeile('R2 bleibt OFFEN — forge nimmt sich selbst nicht ab',
        !!nachRestore.R2, true);
  zeile('und steht weiter auf geliefert',
        nachRestore.R2 ? nachRestore.R2.zustand : null, 'geliefert');
  zeile('R2 liegt weiter bei forge',
        nachRestore.R2 ? nachRestore.R2.wer : null, 'forge');
  zeile('genau eine Selbstannahme in der Historie gemeldet',
        nachRestore.selbstGemeldet, 1);
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

  console.log('\nA6 — Die ganze Kette, und wo sie stehen bleibt');
  console.log('    MATERIALENTSCHEIDUNG: `delivered` schließt eine Aufgabe');
  console.log('    nicht mehr — `accepted` tut es. Geliefert heißt, der');
  console.log('    Arbeitende ist fertig; erledigt heißt, jemand hat es');
  console.log('    angenommen. Rulebook 1.3 §6 trennt beides ausdrücklich.\n');
  zeile('R11 geliefert und nicht angenommen: bleibt offen',
        !!nachRestore.R11, true);
  zeile('und zwar als geliefert',
        nachRestore.R11 ? nachRestore.R11.zustand : null, 'geliefert');
  zeile('R11 liegt bei nova', nachRestore.R11 ? nachRestore.R11.wer : null, 'nova');
  zeile('R12 ist geprüft, nicht angenommen',
        nachRestore.R12 ? nachRestore.R12.zustand : null, 'geprueft');
  /* NUR VORWAERTS: Auf das `reviewed` folgte noch ein zweites `delivered`.
     Es darf den Zustand nicht zurueckstellen -- und als Widerspruch zaehlt
     es auch nicht, denn ein Duplikat ist kein Ruecksprung. */
  console.log('        (auf R12s Prüfung folgt ein zweites `delivered` —');
  console.log('         es stellt nichts zurück)');

  console.log('\nA7 — Prüfung und Annahme kommen von einer ANDEREN Rolle');
  console.log('    Atlas, 21.10.: „Eine Selbstmeldung des Prüfers/Annehmenden');
  console.log('    ist etwas anderes als eine Selbstabnahme des Lieferanten."');
  console.log('    Meine bisherigen Fixtures haben den Fall verdeckt, weil in');
  console.log('    ihnen dieselbe Rolle lieferte, prüfte und annahm.\n');
  zeile('R13 ist offen', !!nachRestore.R13, true);
  zeile('R13 liegt weiter bei forge',
        nachRestore.R13 ? nachRestore.R13.wer : null, 'forge');
  /* DIE ENTSCHEIDENDE ZEILE: Argus hat geprueft, nicht der Halter. */
  zeile('Argus’ Prüfung stellt forges Aufgabe weiter',
        nachRestore.R13 ? nachRestore.R13.zustand : null, 'geprueft');
  zeile('R14 ist zu — Atlas hat angenommen', nachRestore.R14, null);
  /* Und die Gegenprobe zur Selbstauskunft: Eine Fremdaussage stellt nichts
     weiter, auch nicht nach dieser Korrektur. */
  /* ===== R19: DAS ERSTE BLEIBT, DER WIDERSPRUCH WIRD GEZAEHLT ===== */
  zeile('R19 ist offen', !!nachRestore.R19, true);
  zeile('R19 behält den ERSTEN Typ', nachRestore.R19 ? nachRestore.R19.eTyp : null, 'story');
  zeile('und die ERSTEN Eltern',
        nachRestore.R19 ? nachRestore.R19.eEltern : null, 'AG-LM-EP-019');
  zeile('R19 liegt bei nova', nachRestore.R19 ? nachRestore.R19.wer : null, 'nova');

  zeile('R15 ist offen', !!nachRestore.R15, true);
  zeile('Fremdaussage über eine Prüfung stellt nichts weiter',
        nachRestore.R15 ? nachRestore.R15.zustand : null, 'geliefert');
  zeile('und wird als Fremdaussage ausgewiesen',
        /Fremdaussage/.test(nachRestore.zahlen), true);

  console.log('\nA8 — Die Elternkette aus der Historie: dieselbe Lage wie live');
  console.log('    Atlas verlangt Gleichheit von Live und Restore. Teil N');
  console.log('    prüft die Kette am Strom, hier lag sie vor dem Verbinden.\n');
  zeile('die Epic ist übernommen', !!nachRestore.EP, true);
  zeile('und zwar als epic', nachRestore.EP ? nachRestore.EP.eTyp : null, 'epic');
  zeile('mit ihrer Fassung', nachRestore.EP ? nachRestore.EP.eFassung : null, 'V1');
  zeile('ohne Elternteil', nachRestore.EP ? nachRestore.EP.eEltern : null, '');
  zeile('die Story trägt ihren Elternbezug',
        nachRestore.US ? nachRestore.US.eEltern : null, 'AG-LM-EP-003');
  zeile('und liegt bei archibald', nachRestore.US ? nachRestore.US.wer : null, 'archibald');
  /* Ohne Typangabe in der Historie: `task`, genau wie live. */
  zeile('die Aufgabe ohne Typangabe ist task',
        nachRestore.TK ? nachRestore.TK.eTyp : null, 'task');
  zeile('mit ihrem Elternbezug',
        nachRestore.TK ? nachRestore.TK.eEltern : null, 'AG-LM-US-009');
  zeile('ihr eigener Beginn ist übernommen',
        nachRestore.TK ? nachRestore.TK.zustand : null, 'begonnen');
  /* KEINE ERFUNDENEN KINDER, auch nicht rueckblickend: Nur was gemeldet
     wurde, steht da -- die Story, und nichts sonst unter der Epic. */
  zeile('unter der Epic steht genau das Gemeldete', nachRestore.kinderVonEP, 1);
  zeile('und die Epic selbst bleibt zugewiesen',
        nachRestore.EP ? nachRestore.EP.zustand : null, 'zugewiesen');

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

  /* Und die Gegenprobe im LIVEBETRIEB. Erst die Lieferung: Sie schliesst
     NICHTS mehr, auch nicht in B -- sie stellt B auf `geliefert`. */
  await liefern('delivered-projektB', koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:delivered:B', task: 'AG-EVJ-GLEICH',
    projekt: 'malstudio', lauf: 'LAUF-B',
    actor: 'forge', reporter: 'forge', kind: 'delivered',
    title: 'Projekt B liefert — und bleibt trotzdem stehen'
  }), 90201);
  const nachLieferung = await s.evaluate(() => {
    const st = (window.__agStand && window.__agStand()) || {};
    const g = (st.aufgaben || []).filter(a => a.aufgabe === 'AG-EVJ-GLEICH');
    return { anzahl: g.length,
             B: (g.filter(a => a.projekt === 'malstudio')[0] || {}).zustand };
  });
  zeile('die Lieferung schließt nichts', nachLieferung.anzahl, 2);
  zeile('B steht auf geliefert', nachLieferung.B, 'geliefert');
  /* Und erst die ANNAHME schliesst -- und zwar nur B. */
  await liefern('accepted-projektB', koerper({
    id: 'AG-EVENT-JOURNAL-001:atlas:accepted:B', task: 'AG-EVJ-GLEICH',
    projekt: 'malstudio', lauf: 'LAUF-B',
    /* ATLAS nimmt an, nicht forge. forge haelt die Aufgabe; hier stand
       `actor: 'forge'`, also eine Selbstannahme (Archibald R5). Dieses
       Fixture prueft die Projekttrennung und braucht dafuer einen
       wirklichen Abschluss. */
    actor: 'atlas', reporter: 'atlas', kind: 'accepted',
    title: 'Projekt B angenommen — Projekt A bleibt'
  }), 90202);
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

  /* Die richtige Lieferung stellt sie auf `geliefert` -- und schliesst sie
     NICHT. Das ist die Aenderung von Fassung 67. */
  await liefern('delivered-richtig', koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:delivered:H1', task: 'AG-EVJ-H1',
    actor: 'forge', reporter: 'forge', kind: 'delivered',
    title: 'Forge liefert H1 — Prüfung und Annahme bleiben getrennt'
  }), 90106);
  st = await stand();
  a1 = aufg(st, 'forge', 'AG-EVJ-H1');
  zeile('die Lieferung schließt nicht', !!a1, true);
  zeile('sie stellt auf geliefert', a1 ? a1.zustand : null, 'geliefert');
  /* Eine Pruefung ist eine eigene Stufe und keine Annahme -- UND SIE KOMMT
     VON ARGUS. Hier stand `actor: 'forge'`, und forge haelt H1: eine
     Selbstpruefung, die den Zustand weiterstellte (Archibald R5). */
  await liefern('reviewed-H1', koerper({
    id: 'AG-EVENT-JOURNAL-001:argus:reviewed:H1', task: 'AG-EVJ-H1',
    actor: 'argus', reporter: 'argus', kind: 'reviewed',
    title: 'H1 von Argus geprüft — das ist noch keine Annahme'
  }), 90107);
  st = await stand();
  a1 = aufg(st, 'forge', 'AG-EVJ-H1');
  zeile('die Prüfung schließt auch nicht', !!a1, true);
  zeile('sie stellt auf geprueft', a1 ? a1.zustand : null, 'geprueft');

  /* ===== DER GEGENTEST AM LAUFENDEN STROM: forge nimmt SICH SELBST ab ====
     Ohne diese Stelle waere die Regel nur in der Wiederherstellung
     gemessen (R2) und im Livepfad unbelegt -- und der Livepfad ist der,
     den Peter sieht. Atlas' Bedingung: beide Wege, dieselbe Lage.
     Erwartet: nichts geschieht. Kein Abschluss, kein Rueckschritt, keine
     Luecke -- die Kennung war ja bekannt -- und ein eigener Zaehler. */
  /* VORHER MERKEN, nicht gegen Null pruefen. Erster Anlauf verlangte
     `lueckenEinzeln.lieferung === 0` -- und fiel mit 1 durch, weil dieser
     Teil WEITER OBEN absichtlich eine Luecke erzeugt (Lieferung an eine
     unbekannte Kennung). Ein kumulativer Zaehler gegen Null geprueft misst
     die ganze Vorgeschichte mit. */
  const vorSelbst = await s.evaluate(() => {
    const st = (window.__agStand && window.__agStand()) || {};
    return { selbst: st.selbstannahmen || 0,
             luecke: st.lueckenEinzeln ? st.lueckenEinzeln.lieferung : -1 };
  });
  await liefern('accepted-H1-selbst', koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:accepted:H1-selbst', task: 'AG-EVJ-H1',
    actor: 'forge', reporter: 'forge', kind: 'accepted',
    title: 'Forge nimmt die eigene Arbeit ab — das zählt nicht'
  }), 90108);
  st = await stand();
  a1 = aufg(st, 'forge', 'AG-EVJ-H1');
  zeile('Selbstannahme schließt NICHT', !!a1, true);
  zeile('und stellt auch nichts zurück', a1 ? a1.zustand : null, 'geprueft');
  zeile('als Selbstannahme gezählt',
        (st.selbstannahmen || 0) - vorSelbst.selbst, 1);
  zeile('und keine neue Lücke dabei',
        (st.lueckenEinzeln ? st.lueckenEinzeln.lieferung : -1) - vorSelbst.luecke, 0);

  /* Und erst die Annahme DURCH EINEN ANDEREN schliesst. */
  await liefern('accepted-H1', koerper({
    id: 'AG-EVENT-JOURNAL-001:atlas:accepted:H1', task: 'AG-EVJ-H1',
    actor: 'atlas', reporter: 'atlas', kind: 'accepted',
    title: 'H1 von Atlas angenommen — erst das schließt'
  }), 90109);
  st = await stand();
  zeile('die unabhängige Annahme schließt genau diese Aufgabe',
        (st.aufgaben || []).filter(a => a.aufgabe === 'AG-EVJ-H1').length, 0);
  /* MERGE UND VEROEFFENTLICHUNG TREIBEN NICHTS. Sie sagen etwas ueber ein
     Ergebnis, nicht darueber, was eine Rolle tut -- und der Livevertrag
     traegt heute keine Artefaktkennung, an der sie haengen koennten. Das
     steht so im Quelltext und wird hier gemessen, nicht geglaubt. */
  const vorMerge = (await stand()).aufgaben.length;
  const rm = await liefern('merged', koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:merged:H1', task: 'AG-EVJ-H1',
    actor: 'forge', reporter: 'forge', kind: 'merged',
    /* SEIT FASSUNG 69 PFLICHT. Ohne Artefaktkennung weist der Vertrag ab --
       und genau das hat dieser Teil gefangen, als die Pflicht dazukam: Die
       beiden Zeilen fielen durch, weil hier noch die alte Form stand. */
    werk: 'previews/AG-EVENT-JOURNAL-001/H1',
    title: 'H1 gemergt — sagt etwas über ein Ergebnis, nicht über eine Aufgabe'
  }), 90111);
  st = await stand();
  zeile('merged wird angenommen', /merged/.test(rm.letztes), true);
  zeile('merged legt keine Aufgabe an', st.aufgaben.length, vorMerge);
  const rp = await liefern('published', koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:published:H1', task: 'AG-EVJ-H1',
    actor: 'forge', reporter: 'forge', kind: 'published',
    werk: 'previews/AG-EVENT-JOURNAL-001/H1',
    title: 'H1 veröffentlicht'
  }), 90112);
  st = await stand();
  zeile('published wird angenommen', /published/.test(rp.letztes), true);
  zeile('published legt keine Aufgabe an', st.aufgaben.length, vorMerge);

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
  /* WELCHE RINGE WERDEN UEBERHAUPT GESCHRITTEN? `arbeitSchritt` fasst nur
     die ersten VIER Auftraege je Rolle an (`Math.min(S.liste.length, 4)`) --
     ein fuenfter Ring wird nicht gezeichnet und sein Winkel nicht
     weitergestellt. Genau daran ist diese Messung einmal gescheitert: Sie
     las zweimal denselben Wert und meldete "laeuft nicht vorwaerts", also
     das richtige Ergebnis aus dem falschen Grund.
     Deshalb steht die Lage jetzt daneben, und die Messung nimmt eine
     Aufgabe, die wirklich geschritten wird. */
  const lage = await s.evaluate(() => {
    const st = (window.__agStand && window.__agStand()) || {};
    const r = {};
    (st.aufgaben || []).forEach(a => { (r[a.wer] = r[a.wer] || []).push(a.aufgabe); });
    return r;
  });
  console.log('        forge hält: ' + (lage.forge || []).join(', '));
  zeile('J1 liegt unter den ersten vier Ringen von forge',
        (lage.forge || []).indexOf('AG-EVJ-J1') >= 0 &&
        (lage.forge || []).indexOf('AG-EVJ-J1') < 4, true);
  /* ZWEI PROBEN WAREN ZU WENIG, und das ist am 23.10. aufgefallen --
     nicht durch Nachdenken, sondern weil EINE zusaetzliche `evaluate`
     weiter oben (die Akteursliste) den Messzeitpunkt um ein paar
     Millisekunden verschob und die Zeile damit umkippte. Gemessen hatte
     sie `geklemmt -0.8675 -> -0.8675`, also GAR KEINE Bewegung, und
     verlangt hatte sie eine echte Abnahme.

     BELEGT ist: Die Zeile haengt am Messzeitpunkt und kippte durch eine
     Aenderung, die mit ihr nichts zu tun hat. Zurueck geht es nur, solange
     `L.t % 1.15 < 0.17`, also in rund 15 von 100 Teilen der Zeit; zwei
     Proben sehen von dieser Flanke nur, was zufaellig dazwischen liegt.
     Die abgetastete Bahn zeigt es: 2 von 16 Schritten gehen zurueck.

     NICHT BELEGT ist, warum zwei Proben im Abstand von 1,4 s -- also
     ueber mehr als einen ganzen Takt -- auf vier Stellen GENAU denselben
     Wert lasen. Rein aus der Flanke folgt das nicht; dazu muesste `dt`
     in dieser Zeit nicht angekommen sein (gedrosselte Bilder im
     kopflosen Browser waere eine Vermutung, keine Messung). Das bleibt
     offen und steht hier, statt weggeschrieben zu werden. Die Zeile ist
     davon unabhaengig richtig geworden: Sie behauptet jetzt das, was im
     Produkt steht, und stellt ihre Voraussetzung selbst fest.

     Fehlerklasse wie `git push | tail`: Das Messgeraet wurde fuer den
     Gegenstand genommen.

     Jetzt wird die BAHN abgetastet -- 16 Proben ueber 1,6 s, also ueber
     mehr als einen ganzen Stocktakt -- und die Behauptung ist die, die im
     Produkt steht: Ein geklemmter Ring geht NIE vorwaerts und mindestens
     einmal zurueck. Und vorher wird die Voraussetzung festgestellt, statt
     sie anzunehmen: Klemmt J1 in diesem Augenblick ueberhaupt, und ist er
     `begonnen`? Ein aufgeloester oder nur zugewiesener Ring steht
     naemlich ebenfalls still -- er haette die alte Zeile bestanden, aus
     dem falschen Grund. */
  const probe = () => s.evaluate(() => {
    const st = (window.__agStand && window.__agStand()) || {};
    const g = (st.aufgaben || []);
    const f = (id) => (g.filter(a => a.aufgabe === id)[0] || {});
    const j = f('AG-EVJ-J1'), r = f('AG-EVJ-R1');
    return { j1: j.w, r1: r.w,
             klemmen: (j.klemmt || []).length, zustand: j.zustand };
  });
  const p0 = await probe();
  zeile('J1 klemmt im Augenblick der Messung', p0.klemmen > 0, true);
  zeile('J1 ist begonnen (ein ruhender Ring stünde ohnehin)',
        p0.zustand, 'begonnen');
  const bahn = [p0];
  for (let i = 0; i < 16; i++) { await s.waitForTimeout(100); bahn.push(await probe()); }
  let vor = 0, zurueck = 0, rVor = 0;
  for (let i = 1; i < bahn.length; i++) {
    const dj = bahn[i].j1 - bahn[i - 1].j1, dr = bahn[i].r1 - bahn[i - 1].r1;
    if (dj > 1e-9) vor++;
    if (dj < -1e-9) zurueck++;
    if (dr > 1e-9) rVor++;
  }
  zeile('der geklemmte Ring geht nie vorwärts', vor, 0);
  zeile('und zuckt im Stocktakt zurück', zurueck > 0, true);
  /* Die Gegenprobe prueft das MESSGERAeT: Ohne sie bestuende auch ein Ring,
     den ueberhaupt niemand mehr weiterstellt. R1 bei scout laeuft. */
  zeile('Gegenprobe: ein laufender Ring geht in jedem Schritt vorwärts',
        rVor, bahn.length - 1);
  console.log('        geklemmt ' + bahn[0].j1.toFixed(4) + ' → ' +
              bahn[bahn.length - 1].j1.toFixed(4) +
              ' (' + vor + '× vor, ' + zurueck + '× zurück)' +
              ' · laufend ' + bahn[0].r1.toFixed(4) + ' → ' +
              bahn[bahn.length - 1].r1.toFixed(4));

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

  console.log('\nL — Dieselbe Arbeitsteilung am laufenden Strom');
  console.log('    Atlas’ Prüffall, wörtlich: atlas vergibt an forge → forge');
  console.log('    empfängt/beginnt/liefert → Argus meldet eigene Prüfung →');
  console.log('    Atlas meldet eigene Annahme. Live und Restore müssen');
  console.log('    dasselbe ergeben.\n');

  /* Eine zweite, FREMDE Aufgabe daneben, die unberuehrt bleiben muss. */
  await liefern('L0:assigned-fremd', koerper({
    id: 'AG-EVENT-JOURNAL-001:atlas:assigned:L0', task: 'AG-EVJ-L0',
    actor: 'atlas', reporter: 'atlas', recipient: 'scout', kind: 'assigned',
    title: 'Eine fremde Aufgabe, die nichts davon mitbekommen darf'
  }), 90501);

  await liefern('L1:assigned', koerper({
    id: 'AG-EVENT-JOURNAL-001:atlas:assigned:L1', task: 'AG-EVJ-L1',
    actor: 'atlas', reporter: 'atlas', recipient: 'forge', kind: 'assigned',
    title: 'Atlas vergibt L1 an forge'
  }), 90502);
  await liefern('L1:received', koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:received:L1', task: 'AG-EVJ-L1',
    actor: 'forge', reporter: 'forge', kind: 'received',
    title: 'Forge empfängt L1'
  }), 90503);
  st = await stand();
  let L1 = (st.aufgaben || []).filter(a => a.aufgabe === 'AG-EVJ-L1')[0] || null;
  zeile('Empfang ist eine eigene Stufe', L1 ? L1.zustand : null, 'empfangen');
  await liefern('L1:started', koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:started:L1', task: 'AG-EVJ-L1',
    actor: 'forge', reporter: 'forge', kind: 'started', title: 'Forge beginnt L1'
  }), 90504);
  await liefern('L1:delivered', koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:delivered:L1', task: 'AG-EVJ-L1',
    actor: 'forge', reporter: 'forge', kind: 'delivered', title: 'Forge liefert L1'
  }), 90505);
  st = await stand();
  L1 = (st.aufgaben || []).filter(a => a.aufgabe === 'AG-EVJ-L1')[0] || null;
  zeile('nach der Lieferung: geliefert', L1 ? L1.zustand : null, 'geliefert');
  zeile('und die Aufgabe liegt bei forge', L1 ? L1.wer : null, 'forge');

  /* DER FALL. Argus prueft -- und argus haelt die Aufgabe nicht. */
  const vorStufe = st.lueckenEinzeln ? st.lueckenEinzeln.stufe : -1;
  await liefern('L1:reviewed-argus', koerper({
    id: 'AG-EVENT-JOURNAL-001:argus:reviewed:L1', task: 'AG-EVJ-L1',
    actor: 'argus', reporter: 'argus', kind: 'reviewed',
    title: 'Argus meldet seine eigene Prüfung von L1'
  }), 90506);
  st = await stand();
  L1 = (st.aufgaben || []).filter(a => a.aufgabe === 'AG-EVJ-L1')[0] || null;
  zeile('Argus’ Prüfung stellt forges Aufgabe weiter',
        L1 ? L1.zustand : null, 'geprueft');
  zeile('sie bleibt bei forge, nicht bei argus', L1 ? L1.wer : null, 'forge');
  zeile('keine Lücke dabei gezählt',
        (st.lueckenEinzeln ? st.lueckenEinzeln.stufe : -1), vorStufe);
  /* PRAEZISE, NICHT GROSSZUEGIG: argus HAELT eine Aufgabe -- R3 aus der
     Historie. Die Behauptung ist nicht "argus hat keine Aufgabe", sondern
     "argus hat durch seine Pruefung keine bekommen". Mein erstes Soll war
     zu grob und fiel zu Recht durch. */
  zeile('argus bekommt durch die Prüfung keine Aufgabe',
        (st.aufgaben || []).filter(a => a.wer === 'argus' &&
                                        a.aufgabe === 'AG-EVJ-L1').length, 0);
  /* Die fremde Aufgabe ist unberuehrt. */
  const L0 = (st.aufgaben || []).filter(a => a.aufgabe === 'AG-EVJ-L0')[0] || null;
  zeile('die fremde Aufgabe ist unberührt', L0 ? L0.zustand : null, 'zugewiesen');

  /* Und Atlas nimmt an -- und schliesst damit eine Aufgabe, die er nie
     gehalten hat. */
  await liefern('L1:accepted-atlas', koerper({
    id: 'AG-EVENT-JOURNAL-001:atlas:accepted:L1', task: 'AG-EVJ-L1',
    actor: 'atlas', reporter: 'atlas', kind: 'accepted',
    title: 'Atlas meldet seine eigene fachliche Annahme von L1'
  }), 90507);
  st = await stand();
  zeile('Atlas’ Annahme schließt forges Aufgabe',
        (st.aufgaben || []).filter(a => a.aufgabe === 'AG-EVJ-L1').length, 0);
  zeile('die fremde Aufgabe ist weiter da',
        (st.aufgaben || []).filter(a => a.aufgabe === 'AG-EVJ-L0').length, 1);
  zeile('atlas bekommt durch die Annahme keine Aufgabe',
        (st.aufgaben || []).filter(a => a.wer === 'atlas').length, 0);

  /* GEGENPROBEN. Erstens: eine Pruefung zu einer Kennung, die es nirgends
     gibt, erfindet keine Aufgabe und bleibt eine gezaehlte Luecke. */
  const vorStufe2 = st.lueckenEinzeln ? st.lueckenEinzeln.stufe : -1;
  await liefern('L2:reviewed-ohne', koerper({
    id: 'AG-EVENT-JOURNAL-001:argus:reviewed:NICHTS', task: 'AG-EVJ-GIBT-ES-NICHT-2',
    actor: 'argus', reporter: 'argus', kind: 'reviewed',
    title: 'Prüfung zu einer Kennung, die hier niemand kennt'
  }), 90508);
  st = await stand();
  zeile('Prüfung ohne Aufgabe legt keine an',
        (st.aufgaben || []).filter(a => a.aufgabe === 'AG-EVJ-GIBT-ES-NICHT-2').length, 0);
  zeile('und wird als Lücke gezählt',
        (st.lueckenEinzeln ? st.lueckenEinzeln.stufe : -1) > vorStufe2, true);

  /* Zweitens: eine FREMDAUSSAGE ueber eine Pruefung stellt nichts weiter.
     Die Selbstauskunftsregel gilt unveraendert -- sie sagt nur nichts mehr
     ueber den Halter. */
  const L3 = (st.aufgaben || []).filter(a => a.aufgabe === 'AG-EVJ-L0')[0];
  await liefern('L0:reviewed-fremd', koerper({
    id: 'AG-EVENT-JOURNAL-001:atlas-ueber-argus:reviewed:L0', task: 'AG-EVJ-L0',
    actor: 'argus', reporter: 'atlas', kind: 'reviewed',
    title: 'Atlas behauptet, Argus hätte L0 geprüft'
  }), 90509);
  st = await stand();
  const L0b = (st.aufgaben || []).filter(a => a.aufgabe === 'AG-EVJ-L0')[0] || null;
  zeile('Fremdaussage stellt nichts weiter',
        L0b ? L0b.zustand : null, 'zugewiesen');
  console.log('        (dieselbe Lage wie in A7 aus der Historie — so verlangt)');

  console.log('\nM — Das Ergebnis geht ins Register, nicht an die Aufgabe');
  console.log('    Atlas führt merged/published als offenes Restkriterium:');
  console.log('    lesbare Meldungen ohne persistente Ergebniszuordnung.');
  console.log('    Die Zuordnung geht an die Stelle, die es schon gibt.\n');

  async function werke() {
    return await s.evaluate(() => {
      const st = (window.__agStand && window.__agStand()) || {};
      return st.werke || [];
    });
  }
  /* NULLSICHER, UND DAS IST KEIN STILFRAGE. Der Gegentest zu diesem Teil
     (Registerpfad abgeschaltet) brach zuerst MIT EINER AUSNAHME ab --
     Rueckgabe 2, "ungeprueft". Das faellt im Lauf ebenfalls durch, sagt aber
     das Falsche: Wer die Ausgabe liest, erfaehrt nicht, WELCHE Zusagen
     verletzt sind, sondern nur, dass der Nachweis gestorben ist. Mit
     `zust()` fallen stattdessen fuenf Zeilen sauber durch und benennen sich
     selbst. */
  function werk(w, k) { return w.filter(x => x.kennung === k)[0] || null; }
  function zust(w, k) { const e = werk(w, k); return e ? e.zustand : null; }

  /* Eine Aufgabe, deren Lieferung ein Artefakt benennt. */
  await liefern('M1:assigned', koerper({
    id: 'AG-EVENT-JOURNAL-001:atlas:assigned:M1', task: 'AG-EVJ-M1',
    actor: 'atlas', reporter: 'atlas', recipient: 'forge', kind: 'assigned',
    title: 'Atlas vergibt M1 an forge'
  }), 90601);
  await liefern('M1:delivered', koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:delivered:M1', task: 'AG-EVJ-M1',
    actor: 'forge', reporter: 'forge', kind: 'delivered',
    werk: 'pilot/github-live/index.html', werkV: 'v69',
    title: 'Forge liefert M1 und benennt das Ergebnis'
  }), 90602);
  let W = await werke();
  let E1 = werk(W, 'pilot/github-live/index.html');
  zeile('die Lieferung legt den Registereintrag an', !!E1, true);
  zeile('mit ihrer Fassung', E1 ? E1.version : null, 'v69');
  zeile('und dem Zustand geliefert', E1 ? E1.zustand : null, 'geliefert');
  zeile('der Beleg haftet am Eintrag',
        E1 && /^\d+$/.test(E1.beleg), true);

  /* Merge und Veroeffentlichung stellen den Eintrag weiter -- und die
     Aufgabe beruehren sie NICHT. */
  const vorM = (await stand()).aufgaben.length;
  await liefern('M1:merged', koerper({
    id: 'AG-EVENT-JOURNAL-001:atlas:merged:M1', task: 'AG-EVJ-M1',
    actor: 'atlas', reporter: 'atlas', kind: 'merged',
    werk: 'pilot/github-live/index.html', werkV: 'v69',
    title: 'Atlas mergt das Ergebnis'
  }), 90603);
  W = await werke();
  E1 = werk(W, 'pilot/github-live/index.html');
  zeile('merged stellt das Register weiter', E1 ? E1.zustand : null, 'gemergt');
  st = await stand();
  zeile('und lässt die Aufgabe unberührt', st.aufgaben.length, vorM);
  zeile('die Aufgabe ist weiter offen',
        (st.aufgaben || []).filter(a => a.aufgabe === 'AG-EVJ-M1').length, 1);

  await liefern('M1:published', koerper({
    id: 'AG-EVENT-JOURNAL-001:atlas:published:M1', task: 'AG-EVJ-M1',
    actor: 'atlas', reporter: 'atlas', kind: 'published',
    werk: 'pilot/github-live/index.html', werkV: 'v69',
    title: 'Atlas veröffentlicht das Ergebnis'
  }), 90604);
  W = await werke();
  zeile('published stellt weiter',
        zust(W, 'pilot/github-live/index.html'), 'veroeffentlicht');

  /* NUR VORWAERTS: ein zweites `merged` danach stellt nichts zurueck. */
  await liefern('M1:merged-nochmal', koerper({
    id: 'AG-EVENT-JOURNAL-001:atlas:merged:M1b', task: 'AG-EVJ-M1',
    actor: 'atlas', reporter: 'atlas', kind: 'merged',
    werk: 'pilot/github-live/index.html', werkV: 'v69',
    title: 'dasselbe Merge ein zweites Mal'
  }), 90605);
  W = await werke();
  zeile('ein zweites merged stellt nichts zurück',
        zust(W, 'pilot/github-live/index.html'), 'veroeffentlicht');

  /* Ein Merge zu einem Artefakt, das noch nie genannt wurde: Der Eintrag
     entsteht mit dem GEMELDETEN Zustand, nicht mit einem erfundenen
     frueheren. Wer erst beim Merge auftaucht, hat keine belegte Lieferung. */
  await liefern('M2:merged-ohne-lieferung', koerper({
    id: 'AG-EVENT-JOURNAL-001:atlas:merged:M2', task: 'AG-EVJ-M1',
    actor: 'atlas', reporter: 'atlas', kind: 'merged',
    werk: 'docs/nie-geliefert.md',
    title: 'Merge eines Ergebnisses, das nie geliefert wurde'
  }), 90606);
  W = await werke();
  const E2 = werk(W, 'docs/nie-geliefert.md');
  zeile('ein unbekanntes Ergebnis wird angelegt', !!E2, true);
  zeile('und zwar mit dem gemeldeten Zustand',
        E2 ? E2.zustand : null, 'gemergt');
  console.log('        (keine erfundene Lieferung davor — wer erst beim');
  console.log('         Merge auftaucht, hat keine belegte Lieferung)');

  console.log('\nM2 — Was der Vertrag bei Ergebnissen abweist\n');
  const rw1 = await liefern('merged-ohne-werk', koerper({
    id: 'AG-EVENT-JOURNAL-001:atlas:merged:ohne', task: 'AG-EVJ-M1',
    actor: 'atlas', reporter: 'atlas', kind: 'merged',
    title: 'Merge ohne Artefaktkennung'
  }), 90607);
  zeile('merged ohne artifact_id abgewiesen',
        /artifact_id fehlt/.test(rw1.grund), true);
  const rw2 = await liefern('started-mit-werk', koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:started:mitWerk', task: 'AG-EVJ-M1',
    actor: 'forge', reporter: 'forge', kind: 'started',
    werk: 'pilot/github-live/index.html',
    title: 'Ein Beginn, der ein Artefakt benennt'
  }), 90608);
  zeile('artifact_id an fremder Art abgewiesen',
        /artifact_id nicht erlaubt/.test(rw2.grund), true);
  const rw3 = await liefern('werkV-ohne-werk', koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:delivered:nurFassung', task: 'AG-EVJ-M1',
    actor: 'forge', reporter: 'forge', kind: 'delivered',
    werkV: 'v70',
    title: 'Eine Fassung ohne Kennung'
  }), 90609);
  zeile('artifact_version ohne artifact_id abgewiesen',
        /artifact_version ohne artifact_id/.test(rw3.grund), true);

  console.log('\nN — Epic, Story, Aufgabe: Typ, Elternkette, Fassung');
  console.log('    Atlas, AG-LM-TK-021: die Übergabe soll GENAU das vergebene');
  console.log('    Objekt zeigen, mit richtiger Elternkette — und „keine');
  console.log('    erfundenen Kinderstarts oder Doppelaufträge".\n');

  function el(st, id) {
    return (st.aufgaben || []).filter(a => a.aufgabe === id)[0] || null;
  }

  /* Eine Epic wird vergeben. */
  const rn1 = await liefern('N:epic', koerper({
    id: 'AG-EVENT-JOURNAL-001:atlas:assigned:EP002', task: 'AG-LM-EP-002',
    actor: 'atlas', reporter: 'atlas', recipient: 'forge', kind: 'assigned',
    typ: 'epic', eFassung: 'V1',
    title: 'Aufgaben bis zum belegten Ergebnis steuern'
  }), 90701);
  st = await stand();
  let EP = el(st, 'AG-LM-EP-002');
  zeile('die Epic ist genau ein Eintrag', !!EP, true);
  zeile('und zwar als epic', EP ? EP.eTyp : null, 'epic');
  zeile('mit ihrer Fassung', EP ? EP.eFassung : null, 'V1');
  zeile('ohne Elternteil', EP ? EP.eEltern : null, '');
  zeile('die Tafel nennt den Typ', /· epic/.test(rn1.letztes), true);

  /* KEINE ERFUNDENEN KINDER. Nach der Vergabe der Epic darf nichts
     darunter entstanden sein. */
  zeile('die Epic erzeugt kein Kind',
        (st.aufgaben || []).filter(a => a.eEltern === 'AG-LM-EP-002').length, 0);

  /* ===== R3 AM LAUFENDEN STROM: ZWEITE VERGABE, ANDERER TYP =====
     Dieselbe Kennung kommt noch einmal, diesmal als `story` mit einem
     Elternteil. Bis Fassung 74 lief das in `arbeitZuweisen` ins Leere --
     die Funktion sah nur in der Liste des EMPFAENGERS nach und gab still
     `false` zurueck, ohne Vergleich und ohne Zaehlung. Erwartet jetzt: Das
     Erste bleibt stehen, und der Widerspruch ist gezaehlt. */
  const vorKonflikt = await s.evaluate(() =>
    ((window.__agStand && window.__agStand()) || {}).vergabekonflikte || 0);
  await liefern('N:epic-widerspruch', koerper({
    id: 'AG-EVENT-JOURNAL-001:atlas:assigned:EP002-wieder', task: 'AG-LM-EP-002',
    actor: 'atlas', reporter: 'atlas', recipient: 'forge', kind: 'assigned',
    typ: 'story', eltern: 'AG-LM-EP-003', eFassung: 'V1',
    title: 'dieselbe Kennung, diesmal als story unter EP-003'
  }), 90707);
  st = await stand();
  EP = el(st, 'AG-LM-EP-002');
  zeile('der Typ bleibt epic', EP ? EP.eTyp : null, 'epic');
  zeile('und es bleibt elternlos', EP ? EP.eEltern : null, '');
  zeile('es entsteht kein zweiter Eintrag',
        (st.aufgaben || []).filter(a => a.aufgabe === 'AG-LM-EP-002').length, 1);
  zeile('der Widerspruch ist gezählt',
        (st.vergabekonflikte || 0) - vorKonflikt, 1);

  /* UND DIE GEGENPROBE: DASSELBE ZWEIMAL IST KEIN WIDERSPRUCH.
     Ohne sie wuerde ein Zaehler bestehen, der bei JEDER zweiten Vergabe
     steigt -- und ein Transportduplikat ist kein Konflikt, derselbe
     Unterschied wie beim zweiten `delivered`. */
  await liefern('N:epic-duplikat', koerper({
    id: 'AG-EVENT-JOURNAL-001:atlas:assigned:EP002-gleich', task: 'AG-LM-EP-002',
    actor: 'atlas', reporter: 'atlas', recipient: 'forge', kind: 'assigned',
    typ: 'epic', eFassung: 'V1',
    title: 'dieselbe Kennung, dieselben Angaben — ein Duplikat'
  }), 90708);
  st = await stand();
  zeile('Gegenprobe: gleiche Angaben zählen NICHT als Widerspruch',
        (st.vergabekonflikte || 0) - vorKonflikt, 1);
  zeile('und auch hier kein zweiter Eintrag',
        (st.aufgaben || []).filter(a => a.aufgabe === 'AG-LM-EP-002').length, 1);

  /* Eine Story darunter, einzeln gemeldet. */
  const rn2 = await liefern('N:story', koerper({
    id: 'AG-EVENT-JOURNAL-001:atlas:assigned:US006', task: 'AG-LM-US-006',
    actor: 'atlas', reporter: 'atlas', recipient: 'argus', kind: 'assigned',
    typ: 'story', eltern: 'AG-LM-EP-002', eFassung: 'V1',
    title: 'Ergebnisreife beurteilen'
  }), 90702);
  st = await stand();
  const US = el(st, 'AG-LM-US-006');
  zeile('die Story liegt bei argus', US ? US.wer : null, 'argus');
  zeile('und ist eine story', US ? US.eTyp : null, 'story');
  zeile('mit ihrem Elternteil', US ? US.eEltern : null, 'AG-LM-EP-002');
  zeile('die Tafel nennt die Elternkette',
        /unter AG-LM-EP-002/.test(rn2.letztes), true);
  /* ZWEI getrennte Eintraege, keiner aus dem anderen abgeleitet. */
  zeile('Epic und Story stehen getrennt',
        (st.aufgaben || []).filter(a => a.aufgabe === 'AG-LM-EP-002' ||
                                        a.aufgabe === 'AG-LM-US-006').length, 2);
  zeile('die Epic ist davon unberührt', el(st, 'AG-LM-EP-002').zustand, 'zugewiesen');

  /* Eine Aufgabe unter der Story. Ohne Typangabe -- RUECKWAERTSKOMPATIBEL:
     es muss `task` herauskommen. */
  await liefern('N:task-ohne-typ', koerper({
    id: 'AG-EVENT-JOURNAL-001:atlas:assigned:TK011', task: 'AG-LM-TK-011',
    actor: 'atlas', reporter: 'atlas', recipient: 'forge', kind: 'assigned',
    eltern: 'AG-LM-US-006',
    title: 'Rollenbefund schließen und Ergebnis zuordnen'
  }), 90703);
  st = await stand();
  const TK = el(st, 'AG-LM-TK-011');
  zeile('ohne Typangabe kommt task heraus', TK ? TK.eTyp : null, 'task');
  zeile('der Elternbezug steht trotzdem', TK ? TK.eEltern : null, 'AG-LM-US-006');

  /* Der Beginn der Aufgabe beruehrt Story und Epic NICHT. Das ist die
     zweite Haelfte von "keine erfundenen Kinderstarts", von unten gelesen. */
  await liefern('N:task-started', koerper({
    id: 'AG-EVENT-JOURNAL-001:forge:started:TK011', task: 'AG-LM-TK-011',
    actor: 'forge', reporter: 'forge', kind: 'started',
    title: 'Forge beginnt TK-011'
  }), 90704);
  st = await stand();
  zeile('die Aufgabe ist begonnen', el(st, 'AG-LM-TK-011').zustand, 'begonnen');
  zeile('die Story bleibt zugewiesen', el(st, 'AG-LM-US-006').zustand, 'zugewiesen');
  zeile('die Epic bleibt zugewiesen', el(st, 'AG-LM-EP-002').zustand, 'zugewiesen');
  console.log('        (kein Abschluss nach oben — das ist offener Umfang,');
  console.log('         nicht eine stille Ableitung)');

  console.log('\nN2 — Was der Vertrag bei Arbeitselementen abweist\n');
  const rn3 = await liefern('N:typ-erfunden', koerper({
    id: 'AG-EVENT-JOURNAL-001:atlas:assigned:falschTyp', task: 'AG-LM-XX-001',
    actor: 'atlas', reporter: 'atlas', recipient: 'forge', kind: 'assigned',
    typ: 'Epic', title: 'Typ mit großem Anfangsbuchstaben'
  }), 90705);
  zeile('unbekannter item_type abgewiesen',
        /item_type nicht erlaubt/.test(rn3.grund), true);
  const rn4 = await liefern('N:eigenes-elternteil', koerper({
    id: 'AG-EVENT-JOURNAL-001:atlas:assigned:zyklus', task: 'AG-LM-US-009',
    actor: 'atlas', reporter: 'atlas', recipient: 'forge', kind: 'assigned',
    typ: 'story', eltern: 'AG-LM-US-009',
    title: 'Ein Element als sein eigenes Elternteil'
  }), 90706);
  zeile('eigenes Elternteil abgewiesen',
        /parent_id gleich task_id/.test(rn4.grund), true);

  /* ================================================ O: DIE LISTE LESEN ===
     Peters Befund vom 23.10., woertlich: "liste ist zu schwach, zudem
     sollte sie sich erhellen bei mouse over."

     Die Liste ist bis heute von KEINEM Nachweis angefasst worden -- sie
     ist das, was man am laufenden Strom liest, und sie war nicht gemessen.
     Darum steht das hier, obwohl dieser Nachweis vom Vertrag handelt: Die
     Zeilen entstehen durch die Ereignisse der Teile oben, es braucht also
     keinen zweiten Aufbau.

     Gemessen wird nicht "sieht besser aus", sondern zwei Bedingungen, die
     gegeneinander laufen:
       1. LESBAR: 4,5:1 gegen den dunkelsten Grund (AA, 12px).
       2. UNTERSCHEIDBAR: Was offen ist, muss heller stehen als was
          geschehen ist -- darauf ist die ganze Liste gebaut, und eine zu
          starke Blassstufe nimmt ihr genau diese Aussage.
     Das Licht des Feldes hinter der Liste wird NICHT mitgerechnet; es
     macht den Grund heller, also ist die Rechnung die unguenstigste. */
  console.log('\nO — Die Liste ist lesbar — und sagt live nur EINES');
  console.log('    erwartet: >= 4,5:1 gegen den Grund; keine offene Zeile im Live\n');
  const liste = await s.evaluate(() => {
    const t = document.querySelector('#agLaeuft .agAuf.tat');
    const o = document.querySelector('#agLaeuft .agAuf.offen');
    const sp = t && t.querySelector('span');
    const w = getComputedStyle(document.documentElement)
                .getPropertyValue('--grund').trim();
    return { zeilen: document.querySelectorAll('#agLaeuft .agAuf').length,
             opTat: t ? getComputedStyle(t).opacity : null,
             opOffen: o ? getComputedStyle(o).opacity : null,
             farbe: sp ? getComputedStyle(sp).color : null,
             grund: w };
  });
  console.log('        ' + liste.zeilen + ' Zeilen · Grund ' + liste.grund +
              ' · Text ' + liste.farbe);
  zeile('es gibt überhaupt eine Zeile', liste.zeilen > 0, true);
  zeile('Deckkraft einer geschehenen Zeile', liste.opTat, '0.62');
  /* Die Rechnung steht HIER, nicht in der Seite: ein Nachweis, der seine
     Schwelle in den Gegenstand hineinlegt, prueft sich selbst. */
  const rgb = (c) => (String(c).match(/[\d.]+/g) || []).slice(0, 3).map(Number);
  const hx = (c) => { const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i
                        .exec(String(c).trim());
                      return m ? m.slice(1).map(v => parseInt(v, 16)) : null; };
  const lum = (p) => { const f = (v) => { v /= 255;
                         return v <= 0.03928 ? v / 12.92
                                             : Math.pow((v + 0.055) / 1.055, 2.4); };
                       return 0.2126 * f(p[0]) + 0.7152 * f(p[1]) + 0.0722 * f(p[2]); };
  const kontrast = (a, b) => { const L = [lum(a), lum(b)].sort((x, y) => y - x);
                               return (L[0] + 0.05) / (L[1] + 0.05); };
  const vg = rgb(liste.farbe), gr = hx(liste.grund), al = Number(liste.opTat);
  const drauf = vg.map((v, i) => v * al + gr[i] * (1 - al));
  const k = kontrast(drauf, gr);
  console.log('        Kontrast bei ' + al + ': ' + k.toFixed(2) + ':1');
  zeile('Kontrast erreicht AA (>= 4,5:1)', k >= 4.5, true);
  /* DIE GEGENBEDINGUNG IST IM LIVEBETRIEB NICHT MESSBAR, und das ist der
     eigentliche Befund dieses Teils. Zuerst stand hier ein "nicht
     gemessen" -- ein stillschweigend ausgelassener Fall. Nachgesehen,
     warum: `auftrag` in `stromZeile` verlangt `!E.beobachtet`, und
     `beobachtet` tragen ALLE Live-Ereignisse (gesetzt in `__agEreignis`).
     Es kann live also keine `.offen`-Zeile geben.

     Damit sagt die Liste live nur EINES, nicht zweierlei -- und bis zu
     dieser Fassung stand sie dabei ganz auf .42, also unter AA. Das ist
     Peters Befund, vollstaendig. Behoben ist davon die Lesbarkeit; dass
     die zweite Aussage fehlt, ist eine Aenderung am Bild und steht als
     Befund. Gemessen wird deshalb die TATSACHE, nicht eine Hoffnung:
     keine offene Zeile im Livebetrieb. Faellt diese Zeile eines Tages,
     hat jemand das Bild geaendert -- und dann soll es auffallen. */
  zeile('live gibt es keine offene Zeile (Befund, nicht Wunsch)',
        liste.opOffen, null);

  /* DAS ERHELLEN BEI MOUSEOVER GIBT ES SCHON, und es ist kein Versehen,
     dass Peter es nicht gesehen hat: Die Regel steht unter
     `@media (hover:hover)`. Auf dem iPad gibt es keinen Zeiger, der nur
     zeigt -- und `#agEcke` traegt mit Absicht `pointer-events:none`, weil
     die Liste sonst jeden Tipp auf peter schluckt, der links bei 180 Grad
     steht. Geprueft wird hier, DASS die Regel existiert; ob sie greift,
     entscheidet das Geraet. */
  const heller = await s.evaluate(() => {
    let r = '';
    for (const bl of document.styleSheets) {
      let rs; try { rs = bl.cssRules; } catch (e) { continue; }
      for (const x of rs) {
        if (x.type !== CSSRule.MEDIA_RULE) continue;
        if (!/hover/.test(x.conditionText || '')) continue;
        for (const y of x.cssRules)
          if (/#agEcke:hover/.test(y.selectorText || '')) r = y.style.filter || '(ohne filter)';
      }
    }
    return r;
  });
  zeile('Erhellen am Zeigegerät ist angelegt', /brightness/.test(heller), true);
  console.log('        ' + (heller || '(keine Regel gefunden)') +
              ' — auf einem Tastgerät greift das nicht');

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
  /* DIESE DREI SAeTZE WAREN ZWEI DRITTEL FALSCH, und sie standen unter
     JEDEM gruenen Lauf. Am 23.10. gegen den Code gehalten: Die vier Arten
     sind gebaut (acht Fundstellen im Lebenszyklus-Zweig), und der
     Originalbeleg hat sein eigenes Feld (`beleg`/`belegRef`). Stehen
     geblieben waren sie, weil ein Schlusssatz nichts misst -- also faellt
     er auch nie auf. Was hier steht, ist jetzt am Code geprueft. */
  console.log('Offen und sichtbar offen: eine Archivwiedergabe aus derselben');
  console.log('Quelle fehlt, es gibt bis heute keinen ECHTEN Erzeuger der');
  console.log('Lebenszyklusarten (das Relais liefert keine davon), und');
  console.log('keine Abnahme auf Peters Gerät.');
  console.log('Synthetische Körper, kein Relais, keine Abnahme am iPad.');
  process.exit(0);
})().catch(e => { ungeprueft('Nachweis abgebrochen: ' + (e && e.message)); });
