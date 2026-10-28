/* AG-GH-LIVE-001 — GitHub-Kommentare live ins Original. Adapter AG-GH-LIVE-001-v1.

   Wird NUR geladen, wenn die Seite mit ?live=github geoeffnet ist (siehe
   schicht.py). Liest https://api.github.com/repos/pahlborn/agentarium/issues/2/comments
   mit einem persoenlichen Lesetoken und reicht gepruefte, NEUE Ereignisse
   an window.__agLauf / window.__agEreignis.

   Token:   nur in der Variablen `token` dieses Abschlusses. Nie in
            localStorage/sessionStorage/IndexedDB/URL/Konsole/DOM-Attribut.
            Geht nur an die feste Adresse oben. Weg bei Trennen, 401 und pagehide.
   Basis:   Alles, was beim Verbinden schon da ist, ist Geschichte und wird
            NICHT abgespielt. Schnitt = Uhr DIESES Geraets beim Verbindungs-
            beginn. Markierte Kommentare mit created_at >= Schnitt, die beim
            Lesen der Basisseiten auftauchen, werden nach dem Aufbau als
            "waehrend Aufbau" gezeigt (Uhrabweichung Geraet/GitHub = Grenze).
   Abruf:   seriell, nie ueberlappend, 2 s oder laenger (X-Poll-Interval,
            Retry-After, Ratelimit-Reset), ETag je Seitenadresse, 304 = nichts.
            Versteckter Tab pausiert, Rueckkehr holt nach.
   Kosten:  nicht verfuegbar. Fortschritt schliesst nichts ab.
   v1.3 (AG-GH-LIVE-004): Arten progress | handoff | contribution. handoff
            und contribution verlangen `recipient` (bekannter Akteur) und
            sind BEOBACHTETE KOMMUNIKATION: kein Auftrag, kein Arbeitsbeginn,
            kein Abschluss, keine Abnahme. Weitergereicht nur, wenn das
            Original das ausdruecklich kann (Bruecke.kommunikation).
            Alte progress-Kommentare ohne recipient bleiben gueltig.
*/
(function () {
  'use strict';
  var ADAPTER = 'AG-GH-LIVE-001-v2.0';
  /* Wortlaut von Sentinel vorgeschrieben (AG-CONNECT-UX-001, 21.10.), Zeichen
     fuer Zeichen. Einmal benannt, damit Platzhalter und Zeile nicht
     auseinanderlaufen koennen. */
  var TOKEN_SATZ = 'Token ist sicher hinterlegt und wird nicht angezeigt.';
  var ENDPOINT = 'https://api.github.com/repos/pahlborn/agentarium/issues/2/comments?per_page=100';
  /* DER ORIGINALBELEG IST KEIN FELD DES SENDERS, UND ZWAR NICHT AUS
     BEQUEMLICHKEIT. Atlas verlangt den "eindeutig aufloesbaren Originalbeleg
     als eigenes Feld". Als Pflichtfeld im Vertrag kann es ihn nicht geben:
     Ein Agent schreibt seinen Kommentar, und erst GitHub vergibt dabei die
     Nummer -- er kann sie beim Schreiben nicht kennen. Jedes selbst
     gesetzte "Beleg"-Feld waere also eine Behauptung ueber einen Ort, den
     der Melder nicht kennt.
     Der Beleg ist deshalb der Kommentar SELBST, und abgeleitet wird er dort,
     wo er gelesen wird: hier. `c.id` kommt von GitHub, nicht vom Melder.
     Die Adresse wird aus ENDPOINT gerechnet statt zweimal hingeschrieben --
     sonst zeigt sie nach dem naechsten Umzug auf einen anderen Vorgang als
     der, aus dem gelesen wurde. */
  var BELEG_BASIS = ENDPOINT.replace(/\/issues\/\d+\/comments\b.*$/,
                                     '/issues/comments/');
  var MARKER = '<!-- AGENTARIUM_EVENT_V1 -->';
  var SCHEMA = 'agentarium.github-event.v1';
  var LOGINS = { 'pahlborn': true, 'github-actions[bot]': true };
  var TAKT = 2000, MAX_IDS = 5000, MAX_LOG = 20;
  var MAX_KOERPER = 65536, MAX_SEITEN = 100, MAX_TITEL = 200;
  var FELDER = ['schema', 'id', 'project_id', 'run_id', 'task_id', 'actor', 'kind',
                'title', 'occurred_at', 'source_evidence', 'source_tool_id'];
  /* AG-EVENT-JOURNAL-001: `reporter` ist WER MELDET, `actor` ist WER HANDELT.
     Bisher gab es nur `actor`, und damit war beides dasselbe Feld. Atlas hat
     am 21.10. den wunden Punkt genannt: Alle Rollen schreiben unter demselben
     GitHub-Login, also beweist kein Feld eine Identitaet. Daraus folgt nicht,
     dass die Trennung nutzlos ist -- sie macht aus einer Behauptung eine
     PRUEFBARE Behauptung: Faellt `reporter` mit `actor` zusammen, ist es eine
     Selbstauskunft der arbeitenden Rolle; sonst spricht einer ueber einen
     anderen. Nur das Erste darf spaeter einen Aufgabenzustand treiben.
     Verifiziert ist weiterhin allein der Login des Kommentars, und genau so
     steht es im Fuss der Tafel. */
  /* `blocker_id` benennt GENAU EINE Blockade. Atlas' Auftrag vom 21.10.:
     "Aufloesung betrifft genau diese Blockade." Ohne eigene Kennung liesse
     sich das nicht sagen -- eine Aufgabe kann mehrere Klemmen haben, und die
     aelteste zu nehmen waere wieder eine Rateentscheidung. Deshalb ist das
     Feld bei `blocked` und `resolved` PFLICHT und sonst verboten: Ein
     `started` mit Klemmenkennung behauptete einen Bezug, den es nicht hat.
     MATERIALENTSCHEIDUNG, und sie ist an Atlas gemeldet: Das ist das zwoelfte
     Feld des Vertrags. */
  /* ARBEITSELEMENT: TYP, ELTERNBEZUG, FASSUNG.
     Atlas' Auftrag (Kommentar 6320323499): "kleinste rueckwaertskompatible
     Ergaenzung von Arbeitselementtyp/ID/Elternbezug/Version im vorhandenen
     Monitorvertrag".

     ZUORDNUNG BERICHTIGT (Archibald, K1, 23.10.): Hier stand AG-LM-TK-021.
     Das ist der Spezifikationsauftrag an Archibald selbst; diese
     Vertragsfelder gehoeren zu TK-001/007/015. Dieselbe Verwechslung hatte
     Atlas schon in der Hierarchie-Notiz berichtigt -- im Code war sie
     stehen geblieben.

     RUECKWAERTSKOMPATIBEL HEISST: alle drei sind WAHLFREI. Ein Ereignis ohne
     sie verhaelt sich genau wie bisher -- Typ `task`, kein Elternbezug. Kein
     Produzent muss etwas aendern, um weiter angenommen zu werden.

     KEIN VIERTES FELD FUER DIE KENNUNG. `task_id` traegt die Identitaet des
     Elements schon, egal welcher Art es ist; ein zusaetzliches `item_id`
     waere dieselbe Angabe zweimal und koennte auseinanderlaufen. `item_type`
     sagt, WAS diese Kennung benennt. */
  var OPTIONAL = ['recipient', 'reporter', 'blocker_id',
                  'artifact_id', 'artifact_version',
                  'item_type', 'parent_id', 'item_version'];  /* nie Pflicht fuer progress */
  /* Genau die drei Arten aus Atlas' Register. Eine Aufzaehlung, kein freier
     Text: "Epic", "EPIC" oder "epik" waeren drei Dinge, die eines meinen. */
  var ELEMENTARTEN = { epic: 1, story: 1, task: 1 };
  var ARTEN = { progress: 1, handoff: 1, contribution: 1,
                assigned: 1, received: 1, started: 1, delivered: 1,
                reviewed: 1, accepted: 1, merged: 1, published: 1,
                blocked: 1, resolved: 1, aborted: 1 };
  var KOMM = { handoff: 1, contribution: 1 };    /* nur beobachtet, kein Zustand */
  /* Arten, die einen Aufgabenzustand treiben DUERFEN -- und nur bei
     Selbstauskunft. `assigned` ist dabei die Ausnahme: Die Vergabe meldet
     naturgemaess nicht der Empfaenger, sondern der Vergebende. Sie legt
     deshalb eine Aufgabe als ZUGEWIESEN an und behauptet keinen Beginn. */
  var LEBEN = { assigned: 1, received: 1, started: 1, delivered: 1,
                reviewed: 1, accepted: 1, merged: 1, published: 1,
                blocked: 1, resolved: 1, aborted: 1 };
  /* BLOCKADE IST KEIN ABBRUCH, UND DAS WAR MEIN FEHLER.
     Atlas hatte am 21.10. ausdruecklich entschieden: Die Abbruchzahl kommt
     aus typisierten Abbruchereignissen, "nicht aus Titeln und nicht aus
     BLOCKED". Ich habe trotzdem `blocked` gezaehlt -- und mein eigener
     Nachweis verlangte dieses falsche Soll, machte den Fehler also gruen.
     Gefunden von Argus. Der Unterschied ist nicht sprachlich: Eine Blockade
     wartet auf etwas und kann sich aufloesen (`resolved`), ein Abbruch ist
     gescheitert und endet. Wer beides zusammenzaehlt, misst nicht, was im
     Review bearbeitet werden soll. */
  var ABBRUCHARTEN = { aborted: 1 };
  var BRAUCHT_EMPF = { assigned: 1 };            /* an wen vergeben wurde */
  /* BLOCKADE IST KEIN ZUSTAND, SIE LIEGT NEBEN EINEM. Eine Blockade laesst
     die Aufgabe liegen: `zugewiesen` bleibt `zugewiesen`, `begonnen` bleibt
     `begonnen`. Eine Aufloesung nimmt genau eine Klemme weg und behauptet
     weder Beginn noch Abschluss. Darum braucht jede ihre Kennung. */
  var KLEMMARTEN = { blocked: 1, resolved: 1 };
  /* Arten, die nur der Aufgabenhalter selbst melden kann. Pruefung, Annahme
     und Abbruch sind NICHT dabei: Sie kommen notwendigerweise von einer
     anderen Rolle -- sonst waere es eine Selbstabnahme. Der Abbruch kommt
     nach Peters Festlegung vom Projekt, nicht vom Gescheiterten. */
  var HALTERGEBUNDEN = { received: 1, started: 1, delivered: 1 };
  /* DAS ERGEBNIS BRAUCHT EINE EIGENE KENNUNG. `merged`/`published` sagen
     etwas ueber ein Artefakt -- einen Zweig, eine Fassung --, nicht ueber
     eine Aufgabe. Ohne Kennung liesse sich nicht sagen, WELCHES. Pflicht
     dort, erlaubt bei `delivered` (die Lieferung bringt es hervor und darf
     es benennen), sonst verboten: Ein `started` mit Artefaktkennung
     behauptete einen Bezug, den die Art nicht hergibt. */
  var WERKARTEN = { merged: 1, published: 1 };
  var WERKDARF = { merged: 1, published: 1, delivered: 1 };
  /* GEMELDET-V2, UND DER SPRUNG IST NOETIG. In v1 kamen `blocked`/`resolved`
     an und trieben nichts; jetzt legen sie eine Klemme an die Aufgabe. Ein
     Original aus dem Vorrat, das nur v1 sagt, wuerde die beiden Arten also
     ANNEHMEN UND HALB ANZEIGEN -- genau der Zustand, gegen den die Zusage
     geschrieben ist ("lieber nichts als halb"). Mit dem neuen Wort weist es
     sie ausdruecklich ab, statt eine Blockade zu verschweigen. */
  /* v3: die ganze Kette. `delivered` schliesst eine Aufgabe nicht mehr --
     `accepted` tut es. Eine aeltere Fassung aus dem Vorrat wuerde
     `reviewed`/`accepted`/`merged`/`published` annehmen und nichts damit
     tun; schlimmer: Bei ihr haette `delivered` die Aufgabe schon
     geschlossen, und eine spaetere Annahme fiele ins Leere. Also bekommt
     sie die Arten gar nicht erst. */
  var KANN_LEBEN_WORT = 'gemeldet-v5';
  var KENNUNG = /^[A-Za-z0-9][A-Za-z0-9._:\/-]{0,119}$/;
  var ISO = /^\d{4}-\d\d-\d\dT\d\d:\d\d(:\d\d(\.\d{1,9})?)?(Z|[+-]\d\d:\d\d)$/;
  var STEUER = /[\u0000-\u001f\u007f-\u009f\u2028\u2029\u202a-\u202e\u2066-\u2069]/;
  var HERKUNFT = { runtime_stream: 1, reported_checkpoint: 1 };
  var ABBRUCH = { abbruch: true };

  var B = window.__agGithubBruecke;
  if (!B || typeof window.__agEreignis !== 'function' ||
      typeof window.__agLauf !== 'function') {
    var hw = document.getElementById('hinweis');
    if (hw) { hw.textContent = 'GitHub-Live: Griffe des Originals fehlen.'; hw.style.opacity = '1'; }
    return;
  }
  var AKTEURE = Object.create(null);
  (B.akteure || []).forEach(function (n) { AKTEURE[n] = 1; });
  /* Ein aelteres Original (Fassung <= 50) wuerde handoff/contribution als
     Auftrag/Abschluss behandeln. Ohne diese Zusage wird nichts davon
     weitergereicht. */
  var KANN_KOMM = B.kommunikation === 'beobachtet-v1';
  /* Dieselbe Bauart wie die Zusage fuer beobachtete Kommunikation: Ein
     Original, das den Lebenszyklus nicht kennt, verwirft die neuen Arten
     ausdruecklich, statt sie halb anzuzeigen. Eine aeltere Fassung sagt
     dieses Wort nicht und bekommt die Ereignisse deshalb gar nicht erst. */
  var KANN_LEBEN = B.lebenszyklus === KANN_LEBEN_WORT;

  function Menge(max) {
    var o = Object.create(null), q = [];
    return {
      hat: function (k) { return o[k] === 1; },
      add: function (k) { if (o[k] === 1) return; o[k] = 1; q.push(k);
                          while (q.length > max) delete o[q.shift()]; },
      leeren: function () { o = Object.create(null); q.length = 0; },
      alle: function () { return q.slice(); },
      groesse: function () { return q.length; }
    };
  }

  /* ---------------------------------------------------------- Zustand */
  var token = null;                 /* NUR hier */
  var gen = 0, ctrl = null, uhr = null, laufend = false;
  var bekannte = Menge(MAX_IDS);    /* Ereignis-IDs: Basis + gezeigt, ueber Neuverbindungen */
  var Z = { phase: 'getrennt', seite: 1, anzahl: 0, etags: {}, kommentare: Menge(MAX_IDS),
            schnitt: 0, schnittIso: '', intervall: TAKT, fehlerFolge: 0, nichtVor: 0,
            fehler: '', pausiert: false };
  var zahl = { anfragen: 0, n200: 0, n304: 0, basisKommentare: 0, basisMarkiert: 0,
               waehrendAufbau: 0, gezeigt: 0, duplikate: 0, abgewiesen: 0, ohneMarker: 0,
               konflikte: 0, abbrueche: 0, klemmen: 0,
               wieder: 0, wiederKlemmt: 0, abdeckung: '', ausgeblendet: 0 };

  /* ================= DAS PROJEKTVERZEICHNIS (AG-PROJEKTE-002) =================
     Peter, 25.10.: Projekt -> Laeufe -> Aufgaben. Nur Projekte aus dem
     Verzeichnis erscheinen; live sind sie einzeln waehlbar, dazu "Alle
     Projekte" als Startansicht, und dort traegt jede Meldung das Kuerzel.

     GELESEN VON DER EIGENEN ADRESSE, NICHT UEBER DIE SCHNITTSTELLE: GitHub
     Pages veroeffentlicht das ganze Repo, also liegt `projekte/verzeichnis.json`
     zwei Ebenen ueber dieser Seite. Kein Token, keine Anfrage an api.github.com
     -- das Abruflimit bleibt unberuehrt.

     RUECKFALL: Ist das Verzeichnis nicht lesbar oder ungueltig, gilt der
     bisherige Stand -- alles wird gezeigt, ohne Projektwahl. Lieber alles
     als still nichts. Das steht im Protokoll und im Stand. */
  var VERZ_URL = new URL('../../projekte/verzeichnis.json', location.href).href;
  var VERZ_ID = /^[a-z0-9][a-z0-9-]{1,39}$/, VERZ_KZ = /^[A-Z0-9]{2,5}$/;
  var verz = null, wahl = '*';
  async function verzeichnisLaden() {
    var r, d;
    try {
      r = await fetch(VERZ_URL, { method: 'GET', cache: 'no-store', credentials: 'omit',
                                  redirect: 'error', referrerPolicy: 'no-referrer' });
      if (!r.ok) { vermerk('Projektverzeichnis nicht lesbar (HTTP ' + r.status + ') — alle Projekte'); return null; }
      d = await r.json();
    } catch (x) { vermerk('Projektverzeichnis nicht lesbar — alle Projekte'); return null; }
    if (!d || d.schema !== 'agentarium.projektverzeichnis.v1' || !Array.isArray(d.projekte)) {
      vermerk('Projektverzeichnis ungültig — alle Projekte'); return null;
    }
    var liste = [], nach = Object.create(null), kz = Object.create(null);
    d.projekte.forEach(function (p) {
      if (!p || !VERZ_ID.test(p.id || '') || !VERZ_KZ.test(p.kuerzel || '') ||
          typeof p.name !== 'string' || !p.name.trim() || nach[p.id] || kz[p.kuerzel]) {
        vermerk('Verzeichniseintrag übergangen: ' + (p && p.id)); return;
      }
      var e = { id: p.id, kuerzel: p.kuerzel, name: p.name.trim().slice(0, 60) };
      nach[e.id] = e; kz[e.kuerzel] = 1; liste.push(e);
    });
    if (!liste.length) { vermerk('Projektverzeichnis leer — alle Projekte'); return null; }
    return { liste: liste, nach: nach };
  }
  /* Was gezeigt wird: ohne Verzeichnis alles; mit Verzeichnis nur
     verzeichnete Projekte, und davon das gewaehlte oder alle. */
  function sichtbar(ev) {
    if (!verz) return true;
    if (!verz.nach[ev.project_id]) return false;
    return wahl === '*' || ev.project_id === wahl;
  }
  /* ===================== DIE BEZEICHNUNG EINES LAUFS =====================
     Peter, 26.10.: Als Bezeichnung dient der Titel des Anstosses -- Atlas
     schreibt dort ohnehin, worum es geht ("Peter gibt Atlas: Rueckgaben
     abgleichen"). Kein neues Feld, keine neue Meldepflicht. Der Vorspann
     bis zum ersten Doppelpunkt ("Peter gibt Atlas:", "Peter beauftragt
     Atlas:") faellt weg, sofern er mit "Peter" beginnt. Gemerkt aus der
     Historie UND aus dem laufenden Strom; der erste Anstoss eines Laufs
     zaehlt. */
  var laufNamen = Object.create(null);
  function laufNameAus(titel) {
    var t = String(titel || '').trim();
    var m = /^Peter\b[^:]{0,40}:\s*(.+)$/.exec(t);
    return (m ? m[1] : t).slice(0, 80);
  }
  function laufNameMerken(ev) {
    if (!(ev && ev.kind === 'handoff' && ev.actor === 'peter')) return;
    var k = ev.project_id + '\u0001' + ev.run_id;
    if (!laufNamen[k]) laufNamen[k] = laufNameAus(ev.title);
  }
  function laufName(projekt, lauf) {
    return laufNamen[projekt + '\u0001' + lauf] || '';
  }

  function projekteMelden() {
    if (typeof B.projekte !== 'function') return;
    B.projekte(verz ? { liste: verz.liste, wahl: wahl, waehlen: projektWaehlen,
                        archiv: archivProjekt, live: archivZurueckLive,
                        stopp: archivStopp } : null);
  }
  /* Ein Projektwechsel baut den Stand neu auf -- wie "Zurueck zu live":
     Buehne leer, Gedaechtnis leer, Historie neu gelesen und gefiltert. So
     liegt nach dem Wechsel genau das, was im gewaehlten Projekt offen ist. */
  /* `erzwingen`: neu aufbauen, auch wenn dasselbe Projekt gewaehlt ist --
     das Original verlangt es, wenn es aus einer Demo zum Projekt
     zurueckkommt und das Bild deshalb leer ist. Laeuft gerade das Archiv,
     spielt ein Wechsel das Archiv des neuen Projekts. */
  function projektWaehlen(id, erzwingen) {
    if (!verz || (id !== '*' && !verz.nach[id])) return;
    if (id === wahl && !erzwingen) return;
    wahl = id;
    vermerk('Projektwahl: ' + (id === '*' ? 'alle Projekte' : id));
    projekteMelden();
    if (!token) return;
    if (archivAnsicht && !erzwingen) { archivProjekt(); return; }
    archivStopp();
    if (typeof B.neuBeginnen === 'function') B.neuBeginnen();
    bekannte.leeren();
    verbinden(token);
  }
  /* Fingerabdruck je Ereigniskennung, damit sich ein TRANSPORTDUPLIKAT von
     einem KONFLIKT unterscheiden laesst: dieselbe Kennung mit demselben
     Inhalt ist wirkungslos, dieselbe Kennung mit anderem Inhalt ist ein
     Befund und wird abgewiesen statt stillschweigend verworfen.
     Gedeckelt wie `bekannte`, damit eine lange Sitzung nicht waechst. */
  /* AG-EVENT-JOURNAL-001 Schritt 2b: WAS BEIM VERBINDEN SCHON OFFEN WAR.
     Bisher wurde die Historie gezaehlt und weggeworfen. Atlas hat am 21.10.
     den Punkt benannt, der daran falsch ist: "historische Ereignisse
     bedeuten nicht automatisch abgeschlossene Arbeit". Ein `handoff` von
     vor einer Stunde kann eine Aufgabe betreffen, die noch LIEGT -- und
     davon zeigte das Bild nichts.
     Gesammelt werden deshalb die Lebenszyklusereignisse der Basis, und
     zwar MIT BEIDEN ZEITEN: `occurred_at` ist die Angabe des Melders,
     `recorded_at` ist GitHubs `created_at` und damit die pruefbare. Dazu
     die Kommentarnummer, weil sie monoton ist und bei gleichen Zeiten
     entscheidet. Alle drei kommen aus den Daten; keine ist erfunden.
     ABGESPIELT WIRD NICHTS. Was daraus entsteht, ist ein Zustand, kein
     Ereignis: Ringe, die liegen, ohne Flug, ohne Meldung, ohne Puls. */
  var basisLeben = [];
  /* Ballspiel, Schritt 1b: Anstoesse von Peter und Rueckgaben an Peter aus
     der Historie. Daraus wird beim Verbinden gefaltet, welcher Ball noch wo
     liegt -- ohne Flug. Siehe `baelleFalten`. */
  var basisBall = [];
  /* AG-MON-ARCHIV-001: jedes angenommene Ereignis, aus der Historie UND aus
     dem laufenden Strom -- Stoff fuer das Archiv. Nur geprueft angenommene
     (nach Doppel- und Konfliktpruefung), nichts Erfundenes. */
  var archivAlle = [], archivLaeuft = false, archivAnsicht = false,
      archivStand = -1, archivTakt = null, archivFolge = [], archivIdx = 0, archivEnde = 0;
  /* In SEKUNDEN DER MONITORUHR (AG-PROJEKTE-003), nicht der echten Uhr:
     So beschleunigt das Tempo das Archiv, und Halt haelt es an. */
  var ARCHIV_START = 0.3, ARCHIV_MIN = 0.9, ARCHIV_MAX = 4, ARCHIV_RAFFUNG = 30,
      ARCHIV_NACHLAUF = 3;
  var basisGrenzen = { seitenDeckel: false, konflikte: 0, fremdaussagen: 0,
                       /* SELBSTANNAHME IST KEIN KONFLIKT UND KEINE
                          FREMDAUSSAGE, darum eine eigene Zahl. Ein
                          Konflikt heisst "zwei Angaben widersprechen";
                          eine Fremdaussage heisst "der Melder ist nicht
                          der Akteur". Hier stimmt beides, und die
                          Meldung zaehlt trotzdem nicht.
                          NICHT in der Wiederherstellungszeile ausgegeben:
                          Atlas am 23.10. ausdruecklich "kein neues Zeichen
                          noetig". Messbar ueber `grenzen`. */
                       selbstannahmen: 0 };

  var abdruck = Object.create(null), abdruckFolge = [];
  function abdruckLegen(id, fa) {
    if (abdruck[id] === undefined) {
      abdruckFolge.push(id);
      while (abdruckFolge.length > MAX_IDS) delete abdruck[abdruckFolge.shift()];
    }
    abdruck[id] = fa;
  }
  var letztes = null, letzterGrund = '', log = [], aktuellerLauf = '';

  function vermerk(t) {
    log.push(new Date().toISOString().slice(11, 19) + ' ' + String(t).slice(0, 200));
    while (log.length > MAX_LOG) log.shift();
  }

  /* Ablaufdatum ist Geraete-Metadatum, niemals der Lesetoken. */
  var ABLAUF_KEY = 'agentarium.github.tokenExpiry';
  function heuteUtcTag() {
    var d = new Date();
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  }
  function gueltigesDatum(s) {
    return /^\d{4}-\d\d-\d\d$/.test(s) &&
      !isNaN(Date.parse(s + 'T00:00:00Z')) &&
      new Date(s + 'T00:00:00Z').toISOString().slice(0, 10) === s;
  }
  function deutsch(iso) { return iso.slice(8, 10) + '.' + iso.slice(5, 7) + '.' + iso.slice(0, 4); }
  /* v1.2: KEINE automatische Vorgabe. Fehlt das Datum (oder wurde es
     geloescht), bleibt es fehlend -- auch nach Neuladen. Ein gespeichertes
     gueltiges Datum wird unveraendert uebernommen. Geschrieben wird nur,
     wenn der Mensch es im Datumsfeld eintraegt. */
  var ablaufDatum = '';
  try { ablaufDatum = localStorage.getItem(ABLAUF_KEY) || ''; } catch (x) {}
  if (!gueltigesDatum(ablaufDatum)) ablaufDatum = '';
  function ablaufStand() {
    if (!ablaufDatum) {
      var vorschlag = new Date(heuteUtcTag() + 90 * 86400000).toISOString().slice(0, 10);
      return { tage: null, warnung: '', text: 'Token-Ablaufdatum fehlt · Vorschlag (unbestätigt, ' +
        'nicht gespeichert): 90 Tage ab heute wäre ' + deutsch(vorschlag) +
        ' — tatsächliches Datum aus GitHub eintragen' };
    }
    var n = Math.round((Date.parse(ablaufDatum + 'T00:00:00Z') - heuteUtcTag()) / 86400000);
    var m = Math.abs(n), dat = m + (m === 1 ? ' Tag' : ' Tagen'), akk = m + (m === 1 ? ' Tag' : ' Tage');
    var warn = n < 0 ? 'Token laut Datum seit ' + dat + ' abgelaufen — bitte erneuern'
      : n === 0 ? 'Token läuft heute ab — bitte erneuern'
      : n <= 10 ? 'Token läuft in ' + dat + ' ab — bitte erneuern' : '';
    return { tage: n, text: 'Token gültig bis ' + deutsch(ablaufDatum) + ' · ' +
      (n < 0 ? 'seit ' + dat + ' abgelaufen' : n === 0 ? 'läuft heute ab' : 'noch ' + akk), warnung: warn };
  }

  /* ---------------------------------------------------------- Tafel */
  function el(tag, attr, text) {
    var e = document.createElement(tag);
    for (var k in attr) e.setAttribute(k, attr[k]);
    if (text) e.textContent = text;
    return e;
  }
  var stil = el('style');
  stil.textContent =
    '#agGithub{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 4px);' +
    'transform:translateX(-50%);z-index:60;max-width:min(92vw,380px);' +
    'font:11px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace;color:#cfe3d6;' +
    'background:rgba(5,7,12,.84);border:1px solid rgba(150,170,200,.25);' +
    'border-radius:6px;padding:3px 8px;pointer-events:auto}' +
    '#agGithub summary{cursor:pointer}' +
    /* Status darf gekuerzt werden, die Ablaufwarnung nie: eigene Zeile, bricht um. */
    '#agGhStatus{display:inline-block;max-width:calc(100% - 1.4em);vertical-align:bottom;' +
    'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#agGhWarnung{display:block;white-space:normal;overflow-wrap:anywhere;' +
    'color:#ffc58f;font-weight:bold;margin:1px 0}' +
    '#agGithub .ghZ{display:flex;gap:4px;align-items:center;margin:4px 0;flex-wrap:wrap}' +
    '#agGithub input{font:inherit;width:12em;background:#0b1018;color:#e8f0ea;' +
    'border:1px solid #3a4658;border-radius:3px;padding:3px 4px}' +
    /* Gesperrt heisst hier "schon erledigt", nicht "kaputt": lesbar bleiben,
       nicht ausgrauen. Der Platzhalter traegt die Auskunft. */
    '#agGithub input:disabled{opacity:1;color:#9fb4a6;border-color:#2b3442;' +
    'background:#080c13}' +
    /* Die Zusage steht in eigener Zeile, nicht im Feld: 132 bis 154
       Bildpunkte koennen keine 351 anzeigen. Gemessen, nicht geschaetzt. */
    '#agGithub #agGhTokenSatz{color:#9fb39f;margin:1px 0 3px}' +
    '#agGithub input:disabled::placeholder{color:#8fb39c;opacity:1}' +
    '#agGithub button:disabled{opacity:.45}' +
    '#agGithub button{font:inherit;background:#18222f;color:#e8f0ea;' +
    'border:1px solid #3a4658;border-radius:3px;padding:3px 7px}' +
    '#agGithub div,#agGithub small{display:block;margin:2px 0;overflow-wrap:anywhere}' +
    '#agGithub small{opacity:.7}' +
    '#agGithub[data-phase="fehler"] summary{color:#f0a0a0}' +
    '.agName.agGhPuls{text-shadow:0 0 8px currentColor,0 0 18px currentColor}' +
    '#agRufe .agHerkunft,#agLaeuft .agHerkunft{opacity:.75;font-size:10px;overflow-wrap:anywhere}';
  document.head.appendChild(stil);

  var tafel = el('section', { id: 'agGithub', 'aria-label': 'GitHub-Live', 'data-phase': 'getrennt' });
  /* Kennung, damit die Klapptafel greifbar ist. Ohne sie fragte der Nachweis
     `.open` an der aeusseren `div` ab -- eine Eigenschaft, die es dort nicht
     gibt, also `undefined`, also `!undefined === true`: eine Pruefung, die
     nicht scheitern KANN. Gefunden am 21.10., im eigenen Nachweis. */
  var auf = el('details', { id: 'agGhAuf' }); auf.open = true;
  var kopf = el('summary');
  var statusEl = el('span', { id: 'agGhStatus', role: 'status', 'aria-live': 'polite' },
                    'GitHub-Live · getrennt');
  var warnEl = el('span', { id: 'agGhWarnung', role: 'status', 'aria-live': 'polite' });
  warnEl.style.display = 'none';
  kopf.appendChild(statusEl);
  kopf.appendChild(warnEl);
  var zeile = el('div', { 'class': 'ghZ' });
  var lab = el('label', { 'for': 'agGhToken' }, 'Lesetoken');
  var feld = el('input', { id: 'agGhToken', type: 'password', autocomplete: 'off',
                           autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false' });
  var knAn = el('button', { id: 'agGhAn', type: 'button' }, 'Verbinden');
  var knAus = el('button', { id: 'agGhAus', type: 'button' }, 'Trennen');
  zeile.appendChild(lab); zeile.appendChild(feld); zeile.appendChild(knAn); zeile.appendChild(knAus);
  var satzEl = el('div', { id: 'agGhTokenSatz' });
  var ablaufZeile = el('div', { 'class': 'ghZ' });
  var ablaufLabel = el('label', { 'for': 'agGhAblauf' }, 'Token gültig bis');
  var ablaufInput = el('input', { id: 'agGhAblauf', type: 'date' });
  ablaufInput.value = ablaufDatum;
  var ablaufText = el('div', { id: 'agGhAblaufText' });
  var ablaufHilfe = el('small', {}, 'Nur das Datum wird auf diesem Gerät gespeichert, ' +
    'und erst wenn du es hier einträgst. Keine automatische Vorgabe.');
  ablaufZeile.appendChild(ablaufLabel); ablaufZeile.appendChild(ablaufInput);
  ablaufInput.addEventListener('change', function () {
    ablaufDatum = gueltigesDatum(ablaufInput.value) ? ablaufInput.value : '';
    try {
      if (ablaufDatum) localStorage.setItem(ABLAUF_KEY, ablaufDatum);
      else localStorage.removeItem(ABLAUF_KEY);
    } catch (x) {}
    anzeigen();
  });
  var letztesEl = el('div', { id: 'agGhLetztes' }, 'Noch kein neues Ereignis.');
  var zahlEl = el('div', { id: 'agGhZahlen' });
  var grundEl = el('div', { id: 'agGhGrund' });
  var fuss = el('small', {}, 'Token nur im Arbeitsspeicher dieser Seite, nur an api.github.com. ' +
                'Kosten: nicht verfügbar. Fortschritt ist kein Abschluss. ' +
                'Übergabe/Beitrag: beobachtete Kommunikation, keine Annahme, keine Abnahme. ' +
                /* Die Vertrauensgrenze steht da, wo die Zusagen stehen, und
                   zwar vollstaendig: Alle Rollen schreiben unter demselben
                   Login, also ist `actor` eine Angabe und kein Beweis. */
                'Zustände sind gemeldet, nicht verifiziert: Rollen schreiben unter ' +
                'demselben GitHub-Login, geprüft ist nur dieser. ' +
                /* Was eine Blockade NICHT ist, gehoert neben die Zusagen:
                   Sie beendet nichts und beginnt nichts. */
                'Blockade lässt die Aufgabe liegen; eine Auflösung betrifft genau ' +
                'diese Blockade und behauptet keinen Beginn und keinen Abschluss. ' + ADAPTER);
  /* Das Archiv wird NICHT hier gewaehlt, sondern oben rechts am Projekt
     (AG-PROJEKTE-003, Peter: "Anzeige und Auswahl sind dasselbe Ding").
     Die Zeile "Lauf nachspielen" aus AG-MON-ARCHIV-001 stand hier und war
     eine zweite Stelle fuer dieselbe Sache. */
  [kopf, zeile, satzEl, ablaufZeile, ablaufText, ablaufHilfe, letztesEl, zahlEl, grundEl,
   fuss].forEach(function (x) { auf.appendChild(x); });
  tafel.appendChild(auf);
  document.body.appendChild(tafel);
  /* Die Tafel ruehrt nicht im Feld und blendet keine Knoepfe ein. */
  ['pointerdown', 'pointermove', 'pointerup', 'click', 'touchstart', 'touchmove',
   'wheel'].forEach(function (n) {
    tafel.addEventListener(n, function (ev) { ev.stopPropagation(); }, { passive: true });
  });
  feld.addEventListener('keydown', function (ev) {
    ev.stopPropagation();
    if (ev.key === 'Enter') verbinden();
  });
  knAn.addEventListener('click', function () { verbinden(); });
  knAus.addEventListener('click', function () { trennen('getrennt — Token aus dem Speicher entfernt.'); });

  var PHASE = { getrennt: 'getrennt', aufbau: 'verbinde …', verbunden: 'verbunden',
                fehler: 'Fehler' };
  function anzeigen(text) {
    if (text != null) Z.fehler = text;
    var p = PHASE[Z.phase] || Z.phase;
    var ablauf = ablaufStand();
    ablaufText.textContent = ablauf.text;
    ablaufText.style.color = ablauf.warnung ? '#ffc58f' : '';
    statusEl.textContent = 'GitHub-Live · ' + p +
      (Z.pausiert && Z.phase === 'verbunden' ? ' · pausiert (Tab verborgen)' : '') +
      (Z.fehler ? ' · ' + Z.fehler : '');
    if (warnEl.textContent !== ablauf.warnung) warnEl.textContent = ablauf.warnung;
    warnEl.style.display = ablauf.warnung ? '' : 'none';
    tafel.setAttribute('data-phase', Z.phase);
    zahlEl.textContent =
      (Z.schnittIso ? 'Basis bis ' + Z.schnittIso + ' (Geräteuhr): ' + zahl.basisKommentare +
        ' Kommentare, ' + zahl.basisMarkiert + ' markierte historisch, nicht abgespielt · ' : '') +
      /* Wiederhergestellt heisst: aus der Historie gefaltet, nicht
         abgespielt. Die Abdeckung steht daneben, damit die Zahl nicht fuer
         vollstaendig genommen wird. */
      (zahl.abdeckung ? 'offen übernommen ' + zahl.wieder +
        ' (Abdeckung: ' + zahl.abdeckung + ')' +
        /* Eine uebernommene Aufgabe, die klemmt, ist keine laufende.
           Die Zahl steht deshalb an der Zahl, auf die sie sich
           bezieht, und nicht irgendwo weiter hinten. */
        (zahl.wiederKlemmt ? ', davon ' + zahl.wiederKlemmt +
          ' mit Klemme' : '') +
        (basisGrenzen.fremdaussagen ? ', ' + basisGrenzen.fremdaussagen +
          ' Fremdaussage(n) nicht gezählt' : '') +
        (basisGrenzen.konflikte ? ', ' + basisGrenzen.konflikte +
          ' Widerspruch/Widersprüche' : '') + ' · ' : '') +
      /* ANGENOMMEN, NICHT GEZEIGT. Hier stand "neu gezeigt", und das war
         zu dem Zeitpunkt nicht wahr: Gezaehlt wird, sobald das Original das
         Ereignis ANNIMMT -- gezeichnet wird es erst, wenn die
         Zeichenschleife es aus der Warteschlange nimmt. Benannt von
         Sentinel am 21.10. Die zweite Zahl kommt aus dem Original selbst
         und sagt, was dort wirklich angefasst wurde; stehen sie
         auseinander, ist etwas angenommen und nicht gezeichnet. */
      'angenommen ' + zahl.gezeigt + (zahl.waehrendAufbau ? ' (davon während Aufbau ' +
        zahl.waehrendAufbau + ')' : '') +
      (function () {
        try {
          var st = window.__agStand && window.__agStand();
          /* NICHT "gezeichnet": Das behauptete mehr, als gemessen wird.
             `verarbeitet` heisst "aus der Warteschlange genommen",
             `ausgegeben` heisst "Meldung oder Flug angelegt". Gezeichnete
             Bildpunkte beweist keine der beiden. Benannt von Atlas. */
          /* R3 IM LIVEPFAD SICHTBAR (Aufgabe 46-8): Das Original zaehlt
             widerspruechliche zweite Vergaben in `vergabekonflikte`, bisher
             nur ueber `__agStand` messbar. Es kommt hierher wie `verarbeitet`
             und `ausgegeben` -- dieselbe Zeile, dasselbe Wort wie bei der
             Wiederherstellung ("Widerspruch"), keine neue Anzeige. Nur wenn
             es einen gibt, damit die Zeile ruhig bleibt. */
          if (st && typeof st.verarbeitet === 'number')
            return ' · verarbeitet ' + st.verarbeitet +
                   (typeof st.ausgegeben === 'number'
                      ? ' · ausgegeben ' + st.ausgegeben : '') +
                   (typeof st.vergabekonflikte === 'number' && st.vergabekonflikte
                      ? ' · live ' + st.vergabekonflikte + ' Widerspruch/Widersprüche' : '');
        } catch (x) {}
        return '';
      })() +
      ' · doppelt ' + zahl.duplikate + ' · Konflikt ' + zahl.konflikte +
      (zahl.abbrueche || zahl.klemmen ? ' · in dieser Sitzung beobachtet: ' +
        [zahl.abbrueche ? zahl.abbrueche + ' Abbruch' +
           (zahl.abbrueche > 1 ? 'e' : '') : '',
         /* BLOCKADE UND ABBRUCH STEHEN GETRENNT, UND ZWAR WEITER.
            Eine Blockade wartet auf etwas und kann sich aufloesen,
            ein Abbruch ist gescheitert und endet. Zusammengezaehlt
            waere genau der Fehler, den Argus am 21.10. gefunden
            hat -- er bleibt behoben, auch jetzt, wo die Blockade
            eine eigene Zahl bekommt. */
         zahl.klemmen ? zahl.klemmen + ' Blockade' +
           (zahl.klemmen > 1 ? 'n' : '') : ''
        ].filter(function (x) { return x; }).join(', ') +
        ' (Projektabdeckung: partial)' : '') +
      ' · abgewiesen ' + zahl.abgewiesen +
      ' · ohne Marker ' + zahl.ohneMarker + ' · Anfragen ' + zahl.anfragen +
      ' (304: ' + zahl.n304 + ') · Seite ' + Z.seite;
    grundEl.textContent = letzterGrund ? 'Zuletzt abgewiesen: ' + letzterGrund : '';

    /* DAS LEERE FELD IST ABSICHT, UND MAN MUSS ES SEHEN KOENNEN.
       `verbinden()` loescht den Token in derselben Zeile, in der es ihn liest
       (`feld.value = ''`), damit ihn nichts mehr aus dem Eingabeelement
       auslesen kann. Nur steht danach ein leeres Feld da und sieht aus wie
       "nichts hinterlegt" -- obwohl die Statuszeile "verbunden" meldet. Genau
       dieser Widerspruch ist am 21.10. aufgefallen, nach dem ersten echten
       Live-Piloten: zwei Anzeigen, die sich zu widersprechen scheinen, und
       die beruhigende ist die unauffaellige.
       Das Feld sagt es jetzt selbst und nimmt keine Eingabe mehr an, die
       ohnehin nichts bewirkt haette. Am Token aendert das nichts: er liegt
       weiter allein in der Abschlussvariablen und nicht im DOM. */
    var hinterlegt = !!token;
    knAus.disabled = !hinterlegt;
    knAn.disabled = hinterlegt;
    feld.disabled = hinterlegt;
    /* WORTLAUT NICHT VERHANDELBAR, BREITE SCHON. Beide Texte sind von
       Sentinel als Akzeptanzkriterium vorgeschrieben (AG-CONNECT-UX-001,
       21.10.) und stehen deshalb hier Zeichen fuer Zeichen.
       Nur passten sie nicht: Das Feld ist 12em breit, also 132 Bildpunkte
       nutzbar bei 11px Monospace -- nachgemessen auf drei Schirmgroessen.
       Der Satz braucht 351. Mein eigener erster Platzhalter brauchte 232
       und war damit genauso abgeschnitten, nur hatte ich es nicht gemessen.
       Also bekommt das Feld im verbundenen Zustand die ganze Zeilenbreite:
       Es nimmt dort ohnehin keine Eingabe mehr an, der Platz ist frei, und
       der Satz steht vollstaendig da statt zur Haelfte. */
    feld.placeholder = hinterlegt ? TOKEN_SATZ : '';
    /* UND DERSELBE SATZ IN EIGENER ZEILE, WEIL DAS FELD IHN NICHT FASST.
       Nachgemessen auf fuenf Schirmgroessen: nutzbar sind 132 Bildpunkte
       (12em bei 11px Monospace), der Satz braucht 351. Mein erster Versuch
       gab dem Feld im verbundenen Zustand die ganze Zeilenbreite -- gemessen
       wurden daraus 154 statt der noetigen 351, der Einfall trug also nicht.
       Hier hat die Zeile die volle Breite der Tafel und bricht notfalls um.
       Der Platzhalter traegt den Wortlaut weiterhin unveraendert: Er ist das
       vorgeschriebene Kriterium und das, was Hilfsmittel vorlesen. */
    satzEl.textContent = hinterlegt ? TOKEN_SATZ : '';
    lab.textContent = hinterlegt ? 'Token gespeichert' : 'Lesetoken';
  }
  anzeigen();

  setInterval(function () { anzeigen(); }, 60000);
  document.addEventListener('visibilitychange', function () { anzeigen(); });

  /* ---------------------------------------------------------- Pruefen */
  function nein(g) { return { art: 'abgewiesen', grund: g }; }
  function pruefen(c) {
    var body = (c && typeof c.body === 'string') ? c.body : '';
    var i = body.indexOf(MARKER);
    if (i < 0) return { art: 'ohne' };                       /* Prosa: ignoriert */
    if (body.length > MAX_KOERPER) return nein('Kommentar zu gross');
    if (body.indexOf(MARKER, i + MARKER.length) >= 0) return nein('Marker mehrfach');
    var login = (c.user && typeof c.user.login === 'string') ? c.user.login : '';
    if (!Object.prototype.hasOwnProperty.call(LOGINS, login)) return nein('Autor nicht erlaubt');
    var m = /^\s*```(?:json)?[ \t]*\r?\n([\s\S]*?)\r?\n[ \t]*```/.exec(body.slice(i + MARKER.length));
    if (!m) return nein('kein JSON-Block direkt nach dem Marker');
    var d;
    try { d = JSON.parse(m[1]); } catch (x) { return nein('JSON ungültig'); }
    if (!d || typeof d !== 'object' || Array.isArray(d)) return nein('kein JSON-Objekt');
    var ks = Object.keys(d);
    for (var a = 0; a < ks.length; a++)
      if (FELDER.indexOf(ks[a]) < 0 && OPTIONAL.indexOf(ks[a]) < 0)
        return nein('unbekanntes Feld ' + ks[a].slice(0, 40));
    for (var b = 0; b < FELDER.length; b++)
      if (typeof d[FELDER[b]] !== 'string') return nein('Feld fehlt oder kein Text: ' + FELDER[b]);
    if (d.schema !== SCHEMA) return nein('schema falsch');
    if (!Object.prototype.hasOwnProperty.call(ARTEN, d.kind))
      return nein('kind nicht unterstützt: ' + d.kind.slice(0, 40));
    var hatEmpf = Object.prototype.hasOwnProperty.call(d, 'recipient');
    if (hatEmpf && typeof d.recipient !== 'string') return nein('recipient kein Text');
    if (KOMM[d.kind] && !hatEmpf) return nein('recipient fehlt bei ' + d.kind);
    if (BRAUCHT_EMPF[d.kind] && !hatEmpf) return nein('recipient fehlt bei ' + d.kind);
    var hatMeld = Object.prototype.hasOwnProperty.call(d, 'reporter');
    if (hatMeld && typeof d.reporter !== 'string') return nein('reporter kein Text');
    var hatKlemme = Object.prototype.hasOwnProperty.call(d, 'blocker_id');
    if (hatKlemme && typeof d.blocker_id !== 'string') return nein('blocker_id kein Text');
    if (KLEMMARTEN[d.kind] && !hatKlemme) return nein('blocker_id fehlt bei ' + d.kind);
    /* UND NUR DORT. Ein `blocker_id` an einem `started` behauptete einen
       Bezug zu einer Blockade, den die Art nicht hergibt. Lieber abweisen
       als eine Angabe mitfuehren, die nichts bedeutet. */
    if (hatKlemme && !KLEMMARTEN[d.kind])
      return nein('blocker_id nicht erlaubt bei ' + d.kind);
    var hatWerk = Object.prototype.hasOwnProperty.call(d, 'artifact_id');
    var hatWerkV = Object.prototype.hasOwnProperty.call(d, 'artifact_version');
    if (hatWerk && typeof d.artifact_id !== 'string') return nein('artifact_id kein Text');
    if (hatWerkV && typeof d.artifact_version !== 'string')
      return nein('artifact_version kein Text');
    if (WERKARTEN[d.kind] && !hatWerk) return nein('artifact_id fehlt bei ' + d.kind);
    if (hatWerk && !WERKDARF[d.kind])
      return nein('artifact_id nicht erlaubt bei ' + d.kind);
    /* Eine Fassung ohne Kennung ist eine Fassung von nichts. */
    if (hatWerkV && !hatWerk) return nein('artifact_version ohne artifact_id');
    var hatTyp = Object.prototype.hasOwnProperty.call(d, 'item_type');
    var hatEltern = Object.prototype.hasOwnProperty.call(d, 'parent_id');
    var hatEFass = Object.prototype.hasOwnProperty.call(d, 'item_version');
    if (hatTyp && typeof d.item_type !== 'string') return nein('item_type kein Text');
    if (hatTyp && !ELEMENTARTEN[d.item_type])
      return nein('item_type nicht erlaubt: ' + String(d.item_type).slice(0, 20));
    if (hatEltern && typeof d.parent_id !== 'string') return nein('parent_id kein Text');
    if (hatEFass && typeof d.item_version !== 'string')
      return nein('item_version kein Text');
    /* EIN ELEMENT IST NICHT SEIN EIGENES ELTERNTEIL. Das waere ein Zyklus
       aus einem einzigen Glied, und die Elternkette haette kein Ende. */
    if (hatEltern && d.parent_id === d.task_id)
      return nein('parent_id gleich task_id');
    var ids = ['id', 'project_id', 'run_id', 'task_id', 'source_tool_id'];
    for (var q = 0; q < ids.length; q++)
      if (!KENNUNG.test(d[ids[q]])) return nein(ids[q] + ' ungültig');
    if (hatKlemme && !KENNUNG.test(d.blocker_id)) return nein('blocker_id ungültig');
    if (hatWerk && !KENNUNG.test(d.artifact_id)) return nein('artifact_id ungültig');
    if (hatWerkV && !KENNUNG.test(d.artifact_version))
      return nein('artifact_version ungültig');
    if (hatEltern && !KENNUNG.test(d.parent_id)) return nein('parent_id ungültig');
    if (hatEFass && !KENNUNG.test(d.item_version)) return nein('item_version ungültig');
    if (!AKTEURE[d.actor]) return nein('actor unbekannt');
    if (hatEmpf && !AKTEURE[d.recipient]) return nein('recipient unbekannt');
    if (hatMeld && !AKTEURE[d.reporter]) return nein('reporter unbekannt');
    if (KOMM[d.kind] && !KANN_KOMM)
      return nein('Original kennt beobachtete Kommunikation nicht (' + d.kind + ')');
    if (LEBEN[d.kind] && !KANN_LEBEN)
      return nein('Original kennt den Lebenszyklus nicht (' + d.kind + ')');
    /* EIN LEBENSZYKLUSEREIGNIS MUSS SAGEN, WER ES MELDET. Ohne `reporter`
       liesse sich Selbstauskunft nicht von Fremdaussage unterscheiden -- und
       die Unterscheidung ist der ganze Zweck des Feldes. Lieber abweisen als
       raten; geraten wird in diesem Monitor nichts mehr. */
    if (LEBEN[d.kind] && !hatMeld) return nein('reporter fehlt bei ' + d.kind);
    var titel = d.title.trim();
    if (!titel || titel.length > MAX_TITEL) return nein('title leer oder länger als ' + MAX_TITEL);
    if (STEUER.test(titel)) return nein('title enthält Steuerzeichen');
    if (!ISO.test(d.occurred_at) || isNaN(Date.parse(d.occurred_at))) return nein('occurred_at ungültig');
    if (!HERKUNFT[d.source_evidence]) return nein('source_evidence nicht erlaubt');
    return { art: 'ok', ev: { id: d.id, project_id: d.project_id, run_id: d.run_id,
      task_id: d.task_id, actor: d.actor, kind: d.kind,
      recipient: hatEmpf ? d.recipient : '', title: titel, occurred_at: d.occurred_at,
      source_evidence: d.source_evidence, source_tool_id: d.source_tool_id,
      reporter: hatMeld ? d.reporter : '',
      blocker_id: hatKlemme ? d.blocker_id : '',
      artifact_id: hatWerk ? d.artifact_id : '',
      artifact_version: hatWerkV ? d.artifact_version : '',
      /* Vorgabe `task`, nicht leer: Ein Ereignis ohne Typangabe benennt eine
         Aufgabe -- das war bisher der einzige Fall und bleibt der Normalfall. */
      item_type: hatTyp ? d.item_type : 'task',
      parent_id: hatEltern ? d.parent_id : '',
      item_version: hatEFass ? d.item_version : '',
      /* Die PRUEFBARE Aussage, nicht die bewiesene: Melder und Akteur fallen
         zusammen. Verifiziert ist davon nichts ausser dem Login -- deshalb
         heisst das Feld nicht `verifiziert`. */
      selbstauskunft: !!(hatMeld && d.reporter === d.actor),
      login: login,
      kommentar: String(c.id) } };
  }

  function abweisen(grund, cid) {
    zahl.abgewiesen++;
    letzterGrund = grund + (cid ? ' (Kommentar ' + cid + ')' : '');
    vermerk('abgewiesen: ' + letzterGrund);
  }

  function zeigen(ev, wie) {
    if (!B.istLive()) {
      aktuellerLauf = '';
      abweisen('Original nicht im Live-Betrieb, ' + ev.id + ' nicht gezeigt');
      return;
    }
    /* AG-MON-ARCHIV-001: In der Archivansicht wird ein echtes neues Ereignis
       nicht in den nachgespielten Lauf gemischt. Es geht nicht verloren:
       "Zurueck zu live" baut den Stand aus GitHub neu auf, und dort steht es. */
    if (archivAnsicht && wie !== 'Archiv') {
      vermerk('während des Nachspielens zurückgestellt: ' + ev.id);
      return;
    }
    /* AG-PROJEKTE-002: nicht verzeichnet oder nicht gewaehlt -- nicht
       gezeigt, aber gezaehlt, und beim Wechsel auf "Alle" wieder da. */
    if (!sichtbar(ev)) {
      zahl.ausgeblendet++;
      vermerk('ausgeblendet (' + ev.project_id + '): ' + ev.id);
      return;
    }
    var lauf = ev.project_id + '|' + ev.run_id;
    if (lauf !== aktuellerLauf) {
      /* Lauf-ID und, wenn bekannt, die Bezeichnung aus dem Anstoss. */
      var ln = laufName(ev.project_id, ev.run_id);
      var r0 = window.__agLauf({ project_id: ev.project_id,
                                 titel: ev.run_id + (ln ? ' · ' + ln : ''),
                                 ablage: wie === 'Archiv'
                                   ? 'Archiv · nachgespielt aus GitHub #2'
                                   : 'GitHub · pahlborn/agentarium #2' });
      if (r0 && r0.angenommen) aktuellerLauf = lauf;
    }
    /* Volle Schluessel und Herkunft gehen mit; `gh_beobachtet` sagt dem
       Original: aus GitHub, nur beobachtet, keine Zustandsaenderung. */
    /* In "Alle Projekte" traegt jede Meldung das Kuerzel vorn: Am fliegenden
       Ball und in der Zeile ist so zu sehen, wozu sie gehoert. Gekuerzt auf
       die 200 Zeichen, die ein Titel haben darf. */
    var titel = (verz && wahl === '*' && verz.nach[ev.project_id])
      ? (verz.nach[ev.project_id].kuerzel + ' · ' + ev.title).slice(0, 200) : ev.title;
    var aus = { id: ev.id, actor: ev.actor, kind: ev.kind,
      title: titel, occurred_at: ev.occurred_at, source_evidence: ev.source_evidence,
      fictional: false, gh_beobachtet: true, project_id: ev.project_id,
      run_id: ev.run_id, task_id: ev.task_id, source_tool_id: ev.source_tool_id };
    if (ev.recipient) aus.recipient = ev.recipient;
    /* AG-EVENT-JOURNAL-001: Melder und die daraus abgeleitete, PRUEFBARE
       Aussage gehen mit. Das Original entscheidet selbst, was es damit tut
       -- hier wird nichts behauptet, nur weitergegeben. */
    if (ev.reporter) aus.reporter = ev.reporter;
    if (ev.blocker_id) aus.blocker_id = ev.blocker_id;
    if (ev.artifact_id) aus.artifact_id = ev.artifact_id;
    if (ev.artifact_version) aus.artifact_version = ev.artifact_version;
    if (ev.item_type) aus.item_type = ev.item_type;
    if (ev.parent_id) aus.parent_id = ev.parent_id;
    if (ev.item_version) aus.item_version = ev.item_version;
    /* Der Beleg geht mit: die Nummer, die GitHub vergeben hat, und die
       Adresse, unter der genau dieser Kommentar wieder auffindbar ist.
       Beides abgeleitet, nichts behauptet. */
    if (ev.kommentar) {
      aus.source_comment = ev.kommentar;
      aus.source_ref = BELEG_BASIS + ev.kommentar;
    }
    aus.gh_selbstauskunft = !!ev.selbstauskunft;
    var r = window.__agEreignis(aus);
    if (!r || !r.angenommen) { abweisen('Original wies ab: ' + (r ? r.grund : '?')); return; }
    zahl.gezeigt++;
    /* NACH DEM ZEICHNEN NOCHMAL ANZEIGEN. Die zweite Zahl ("gezeichnet")
       kommt aus dem Original und steigt erst, wenn die Zeichenschleife das
       Ereignis aus der Warteschlange nimmt -- ein paar Bilder spaeter. Ohne
       diese Auffrischung stand in der Tafel bis zum naechsten Abruf
       "angenommen 4 - gezeichnet 3", also ein Ereignis, das haengen zu
       bleiben SCHIEN. Gemessen: Zwei eigene Nachweise sind daran zufaellig
       durch- und zufaellig nicht durchgefallen, je nachdem, wann sie lasen.
       Eine Anzeige, die nach Glueck richtig ist, ist keine. */
    setTimeout(anzeigen, 400);
    letztes = { id: ev.id, kind: ev.kind, actor: ev.actor, recipient: ev.recipient,
                title: ev.title, herkunft: ev.source_evidence,
                project_id: ev.project_id, run_id: ev.run_id, task_id: ev.task_id,
                source_tool_id: ev.source_tool_id, wie: wie };
    letztesEl.textContent = 'Neu (' + wie + '): ' + ev.kind + ' · ' + ev.id + ' · ' +
      (ev.recipient ? ev.actor + ' → ' + ev.recipient : ev.actor) + ' · ' +
      ev.title + ' · ' + (ev.source_evidence === 'reported_checkpoint'
        ? 'reported_checkpoint — gemeldet, kein Laufzeitbeleg' : 'runtime_stream') +
      ' · ' + ev.project_id + ' / ' + ev.run_id + ' / ' + ev.task_id +
      ' · Werkzeug ' + ev.source_tool_id +
      (ev.blocker_id ? ' · Klemme ' + ev.blocker_id : '') +
      (ev.artifact_id ? ' · Werk ' + ev.artifact_id +
         (ev.artifact_version ? ' ' + ev.artifact_version : '') : '') +
      /* Typ, Fassung und Elternbezug des Arbeitselements. Ohne sie steht
         hier nichts -- `task` ist die Vorgabe und keine Meldung. */
      (ev.item_type && ev.item_type !== 'task' ? ' · ' + ev.item_type : '') +
      (ev.item_version ? ' · Fassung ' + ev.item_version : '') +
      (ev.parent_id ? ' · unter ' + ev.parent_id : '') +
      /* WO ES STEHT, NICHT NUR DASS ES STEHT. `source_evidence` sagt die
         ART des Belegs (Laufzeit oder gemeldet), nicht seinen ORT. Ohne
         die Nummer ist eine Angabe in dieser Tafel nicht nachzusehen. */
      (ev.kommentar ? ' · Beleg Kommentar ' + ev.kommentar : '') +
      (KOMM[ev.kind] ? ' · beobachtete Kommunikation, keine Annahme/Abnahme' : '');
    vermerk('gezeigt ' + ev.id + ' (' + wie + ')');
  }

  /* modus: 'basis' (Aufbau) oder 'live'. Im Aufbau landen IDs zuerst in
     `basisIds` und erst nach VOLLSTAENDIGEM Aufbau in `bekannte` -- sonst
     gingen bei einem abgebrochenen und wiederholten Aufbau die Ereignisse
     "waehrend Aufbau" als vermeintlich doppelt verloren. */
  function verarbeiten(liste, modus, spaeter, basisIds) {
    for (var i = 0; i < liste.length; i++) {
      var c = liste[i];
      var cid = (c && (typeof c.id === 'number' || typeof c.id === 'string')) ? String(c.id) : '';
      if (!cid) { abweisen('Kommentar ohne id'); continue; }
      if (Z.kommentare.hat(cid)) continue;            /* schon gesehen (Seiten, Neulesen) */
      Z.kommentare.add(cid);
      if (modus === 'basis') zahl.basisKommentare++;
      var p = pruefen(c);
      if (p.art === 'ohne') { zahl.ohneMarker++; continue; }
      if (p.art !== 'ok') { abweisen(p.grund, cid); continue; }
      var ev = p.ev;
      /* Der Fingerabdruck ist der Inhalt ohne die Kommentarnummer: Zweimal
         dasselbe Ereignis in zwei Kommentaren ist ein Transportduplikat und
         wirkungslos; dieselbe Kennung mit anderem Inhalt ist ein Konflikt
         und ein Befund. */
      /* `blocker_id` GEHOERT IN DEN FINGERABDRUCK. Ohne sie waeren zwei
         verschiedene Klemmen derselben Aufgabe mit gleichem Titel und
         gleichem Zeitstempel ein Transportduplikat -- die zweite fiele
         lautlos weg, und die Aufgabe klemmte einmal statt zweimal. */
      var fa = [ev.project_id, ev.run_id, ev.task_id, ev.actor, ev.kind,
                ev.recipient, ev.reporter, ev.blocker_id,
                ev.artifact_id, ev.artifact_version,
                ev.item_type, ev.parent_id, ev.item_version, ev.title,
                ev.occurred_at, ev.source_evidence, ev.source_tool_id].join('\u0001');
      if (bekannte.hat(ev.id) || (basisIds && basisIds.hat(ev.id))) {
        var frueher = abdruck[ev.id];
        if (frueher !== undefined && frueher !== fa) {
          zahl.konflikte++;
          abweisen('gleiche Kennung, anderer Inhalt: ' + ev.id, cid);
          continue;
        }
        /* AUS EINER FRUEHEREN VERBINDUNG BEKANNT (gefunden mit
           AG-MON-ARCHIV-001): `bekannte` lebt ueber Neuverbindungen, damit
           live Gesehenes nicht noch einmal fliegt. Beim Neuaufbau fiel damit
           aber die ganze Vorgeschichte als "doppelt" weg -- keine Laeufe zur
           Auswahl und keine liegenden Baelle nach Trennen/Verbinden. Gezeigt
           wird so ein Ereignis weiterhin nicht; es gehoert aber zur
           Vorgeschichte. Die Baelle duerfen mit: das Original fuehrt sie ueber
           ihren Schluessel zusammen, doppelt liegt nichts. */
        if (modus === 'basis' && !basisIds.hat(ev.id)) {
          basisIds.add(ev.id);
          archivAlle.push({ ev: ev, recorded_at: c.created_at || '', kommentar: Number(cid) || 0 });
          laufNameMerken(ev);
          if (ev.kind === 'handoff' || ev.kind === 'contribution' ||
              (ev.kind === 'accepted' && ev.actor === 'peter')) {
            basisBall.push({ ev: ev, recorded_at: c.created_at || '',
                             kommentar: Number(cid) || 0 });
          }
        }
        zahl.duplikate++; vermerk('doppelt ' + ev.id); continue;
      }
      abdruckLegen(ev.id, fa);
      archivAlle.push({ ev: ev, recorded_at: c.created_at || '', kommentar: Number(cid) || 0 });
      laufNameMerken(ev);
      if (modus === 'basis') {
        basisIds.add(ev.id);
        var t = Date.parse(c.created_at);
        if (!isNaN(t) && t >= Z.schnitt) { spaeter.push(ev); continue; }
        zahl.basisMarkiert++;
        /* Nur Lebenszyklusereignisse tragen einen Aufgabenzustand.
           `progress`, `handoff` und `contribution` sind beobachtete
           Kommunikation -- aus ihnen wird weiterhin kein Zustand
           abgeleitet, auch nicht rueckblickend. */
        if (LEBEN[ev.kind]) {
          basisLeben.push({ ev: ev, recorded_at: c.created_at || '',
                            kommentar: Number(cid) || 0 });
        }
        /* BALLSPIEL, Schritt 1b (AG-MON-BALLSPIEL-001): Peter am 25.10.:
           "Wenn der Ball liegen bleiben wuerde, waere es egal, ob ich zu
           spaet komme." Darum werden genau zwei Arten aus der Historie
           mitgenommen -- Uebergaben und Rueckgaben (seit Schritt 2 auch die
           zwischen Agenten, fuer die Teilbaelle). Sie treiben keinen
           AUFGABENZUSTAND (der Satz oben gilt weiter), nur die Frage, bei
           wem welcher Ball liegt. Seit Schritt 3 dazu Peters Annahme, die
           seinen Ball wegnimmt. */
        if (ev.kind === 'handoff' || ev.kind === 'contribution' ||
            (ev.kind === 'accepted' && ev.actor === 'peter')) {
          basisBall.push({ ev: ev, recorded_at: c.created_at || '',
                           kommentar: Number(cid) || 0 });
        }
        continue;
      }
      bekannte.add(ev.id);
      /* ERST HIER, NACH DER BASIS-/LIVE-TRENNUNG. Vorher stand diese Zeile
         ueber dem `basis`-Zweig und zaehlte damit auch die Historie -- also
         Ereignisse von vorgestern als "in dieser Sitzung beobachtet".
         Ebenfalls von Argus gefunden; derselbe Befund, zweite Haelfte. */
      if (ABBRUCHARTEN[ev.kind]) zahl.abbrueche++;
      /* Gezaehlt wird die MELDUNG einer Blockade, nicht die Zahl der gerade
         offenen -- dieselbe Lesart wie bei den Abbruechen, und sie steht
         auch so in der Zeile ("in dieser Sitzung beobachtet"). Wie viele
         gerade haengen, sagt der Block mit den Aufgaben. */
      if (ev.kind === 'blocked') zahl.klemmen++;
      zeigen(ev, 'live');
    }
  }

  /* ---------------------------------------------------------- Abruf */
  function seitenUrl(n) {
    if (!(n >= 1 && n <= 10000 && Math.floor(n) === n)) throw fehler('Seitennummer unzulässig', 'intern');
    return n === 1 ? ENDPOINT : ENDPOINT + '&page=' + n;
  }
  /* Link wird nur GELESEN, nie gefolgt: Die Seitenzahl wird uebernommen,
     die Adresse immer aus ENDPOINT gebaut. GitHub nennt in Link teils
     /repositories/<id>/... statt /repos/<owner>/<name>/... -- beides wird
     als dasselbe Issue anerkannt, alles andere verworfen. */
  function naechste(link, jetzt) {
    if (!link) return 0;
    var teile = link.split(',');
    for (var i = 0; i < teile.length; i++) {
      var m = /<([^>]+)>\s*;\s*rel="([^"]+)"/.exec(teile[i]);
      if (!m || m[2].split(/\s+/).indexOf('next') < 0) continue;
      var u;
      try { u = new URL(m[1]); } catch (x) { vermerk('Link unlesbar'); return 0; }
      if (u.protocol !== 'https:' || u.host !== 'api.github.com' ||
          !(/^\/repos\/pahlborn\/agentarium\/issues\/2\/comments$/.test(u.pathname) ||
            /^\/repositories\/\d+\/issues\/2\/comments$/.test(u.pathname)) ||
          u.searchParams.get('per_page') !== '100') {
        vermerk('fremder Link verworfen'); return 0;
      }
      var n = parseInt(u.searchParams.get('page'), 10);
      return (n > jetzt && n <= 10000) ? n : 0;
    }
    return 0;
  }

  function fehler(text, art, warten) { return { text: text, art: art, warten: warten || 0 }; }
  function zahlKopf(r, n) { var v = parseInt(r.headers.get(n), 10); return isNaN(v) ? 0 : v; }

  async function holen(seite, g) {
    if (!token) throw ABBRUCH;
    var url = seitenUrl(seite);
    if (url.indexOf(ENDPOINT) !== 0) throw fehler('Adresse unzulässig', 'intern');
    var kopf = { 'Accept': 'application/vnd.github+json', 'Authorization': 'Bearer ' + token };
    if (Z.etags[url]) kopf['If-None-Match'] = Z.etags[url];
    zahl.anfragen++;
    var r;
    try {
      r = await fetch(url, { method: 'GET', headers: kopf, cache: 'no-cache',
        credentials: 'omit', mode: 'cors', redirect: 'error', referrerPolicy: 'no-referrer',
        signal: ctrl ? ctrl.signal : undefined });
    } catch (x) {
      if (g !== gen) throw ABBRUCH;
      throw fehler('Netzwerkfehler', 'netz');
    }
    if (g !== gen) throw ABBRUCH;
    var pi = zahlKopf(r, 'X-Poll-Interval');
    Z.intervall = pi ? Math.max(TAKT, pi * 1000) : TAKT;
    if (r.status === 304) { zahl.n304++; return { status: 304 }; }
    if (r.status === 200) {
      var d;
      try { d = await r.json(); } catch (x) { throw fehler('Antwort ist kein JSON', 'netz'); }
      if (g !== gen) throw ABBRUCH;
      if (!Array.isArray(d)) throw fehler('Antwort ist keine Liste', 'netz');
      var et = r.headers.get('ETag');
      if (et) Z.etags[url] = et;
      zahl.n200++;
      return { status: 200, items: d, link: r.headers.get('Link') };
    }
    var retryHeader = r.headers.get('Retry-After') || '';
    var retryDate = Date.parse(retryHeader);
    var retryMs = /^\d+$/.test(retryHeader.trim()) ? Number(retryHeader.trim()) * 1000
      : (isNaN(retryDate) ? 0 : Math.max(0, retryDate - Date.now()));
    var s = r.status, ra = retryMs,
        rest = r.headers.get('X-RateLimit-Remaining'), reset = zahlKopf(r, 'X-RateLimit-Reset');
    if (s === 401) throw fehler('HTTP 401 — Token ungültig, abgelaufen oder widerrufen; bitte neues Token eingeben', 'auth');
    if (s === 403 || s === 429) {
      var w = ra ? ra : (rest === '0' && reset ? reset * 1000 - Date.now() + 1000 : 0);
      if (w > 0 || s === 429 || rest === '0')
        throw fehler('HTTP ' + s + ' — Abruflimit', 'limit', w > 0 ? w : 60000);
      throw fehler('HTTP 403 — Zugriff verweigert (Token-Berechtigung?)', 'verboten', 60000);
    }
    if (s === 404) throw fehler('HTTP 404 — Issue nicht lesbar (Token-Zugriff?)', 'verboten', 60000);
    throw fehler('HTTP ' + s, 'netz');
  }

  /* Ab `seite` vorwaerts, solange es Seiten gibt. */
  async function vorwaerts(seite, g, modus, spaeter, basisIds) {
    for (var n = 0; n < MAX_SEITEN; n++) {
      /* Letzte erlaubte Runde und es ginge weiter? Dann ist nicht alles
         gelesen, und das darf nicht stillschweigend als vollstaendig
         gelten -- die Abdeckung faellt dann auf `unavailable`. */
      if (n === MAX_SEITEN - 1 && modus === 'basis') basisGrenzen.seitenDeckel = true;
      var a = await holen(seite, g);
      if (a.status === 304 || !a.items.length) return;
      verarbeiten(a.items, modus, spaeter, basisIds);
      Z.seite = seite; Z.anzahl = a.items.length;
      var nx = naechste(a.link, seite);
      if (nx) { seite = nx; continue; }
      if (a.items.length >= 100) { seite++; continue; }   /* volle Seite: dahinter nachsehen */
      return;
    }
  }

  /* DIE HISTORIE ZU EINEM ZUSTAND FALTEN.

     STABILE ORDNUNG, und zwar aus drei Angaben statt aus einer: `occurred_at`
     allein reicht nicht, weil zwei Meldungen dieselbe Zeit tragen koennen und
     eine verspaetete Meldung eine aeltere Zeit hat. Also:
       1. occurred_at   was der Melder sagt
       2. recorded_at   wann GitHub es angenommen hat (pruefbar)
       3. Kommentarnummer  monoton, entscheidet den Rest
     Keine dieser drei ist erfunden. Bei genau gleichen Werten in allen drei
     bleibt die Lesereihenfolge -- `sort` ist in modernen Browsern stabil.

     KEINE UNBELEGTE RUECKNAHME: Gefaltet wird nur vorwaerts. Ein `delivered`
     schliesst; danach macht kein spaeteres `started` die Aufgabe wieder auf,
     denn das waere eine Behauptung ueber eine Reihenfolge, die die Daten
     nicht tragen. Ein solcher Fall wird als Widerspruch gezaehlt, nicht
     stillschweigend aufgeloest.

     DIESELBE SELBSTAUSKUNFTSREGEL WIE LIVE: `assigned` kommt vom Vergebenden,
     alles andere zaehlt nur, wenn Melder und Akteur zusammenfallen. Was
     rueckblickend gilt, muss dasselbe sein wie das, was live gilt -- sonst
     zeigte dieselbe Lage je nach Verbindungszeitpunkt zwei Wahrheiten. */
  /* BALLSPIEL, Schritt 1b: Welcher von Peters Baellen liegt noch, und wo?
     Dieselbe Ordnung wie bei der Aufgabenfaltung (Ereigniszeit, dann
     Erfassung, dann Kommentarnummer). Ein Anstoss legt den Ball beim
     Empfaenger hin; eine Rueckgabe des HALTERS an Peter legt ihn bei Peter
     hin (Schritt 3), und erst Peters Annahme (von Atlas gemeldet) nimmt ihn
     weg -- dieselbe Regel wie live (`ballspielGelandet`,
     `ballspielAngenommen` im Original). Was danach uebrig ist, liegt. */
  function baelleFalten(liste) {
    var s = liste.slice().sort(function (p, q) {
      if (p.ev.occurred_at !== q.ev.occurred_at)
        return p.ev.occurred_at < q.ev.occurred_at ? -1 : 1;
      if (p.recorded_at !== q.recorded_at)
        return p.recorded_at < q.recorded_at ? -1 : 1;
      return p.kommentar - q.kommentar;
    });
    var lage = Object.create(null), reihe = [];
    s.forEach(function (x) {
      var e = x.ev;
      var k = e.project_id + '\u0001' + e.run_id + '\u0001' + e.task_id;
      if (e.kind === 'handoff' && e.actor === 'peter' && e.recipient) {
        if (!(k in lage)) reihe.push(k);
        lage[k] = { project_id: e.project_id, run_id: e.run_id,
                    task_id: e.task_id, bei: e.recipient };
      } else if (e.kind === 'contribution' && e.recipient === 'peter') {
        /* Schritt 3: Der Ball liegt danach bei Peter, bis er annimmt.
           Teilbaelle bleiben, bis ihr Agent selbst zurueckgibt -- der
           Monitor dient der Kontrolle (Peter, 25.10.; siehe Original). */
        if (lage[k] && lage[k].bei === e.actor) lage[k].bei = 'peter';
      } else if (e.kind === 'accepted') {
        /* Schritt 3: Peters Annahme, von Atlas fuer ihn gemeldet -- die
           einzige Fremdaussage, die wirkt, und nur auf den Ball. */
        if (e.actor === 'peter' && e.reporter === 'atlas' &&
            lage[k] && lage[k].bei === 'peter') lage[k] = null;
      } else if (e.kind === 'handoff' && e.recipient && e.recipient !== 'peter') {
        /* Schritt 2: Teilball beim Empfaenger, Schluessel mit Empfaenger --
           dieselbe Regel wie live (`ballspielGelandet`). */
        var kt = k + '\u0001' + e.recipient;
        if (!(kt in lage)) reihe.push(kt);
        /* `von`: wer die Arbeit gegeben hat -- das Schild am Ball nennt es
           (AG-MON-BALLSPIEL-004). */
        if (!lage[kt]) lage[kt] = { project_id: e.project_id, run_id: e.run_id,
                                    task_id: e.task_id, bei: e.recipient, teil: true,
                                    von: e.actor, eltern: e.parent_id || '' };
      } else if (e.kind === 'contribution' && e.recipient) {
        /* Schritt 2: Rueckgabe an einen Agenten nimmt den Teilball des
           Absenders weg. */
        var kr = k + '\u0001' + e.actor;
        if (lage[kr]) lage[kr] = null;
      }
    });
    return reihe.filter(function (k) { return lage[k]; })
                .map(function (k) { return lage[k]; });
  }

  function faltenZuZustand(liste) {
    var nachAufgabe = Object.create(null), reihen = [];
    liste.forEach(function (x) {
      var k = x.ev.project_id + '\u0001' + x.ev.run_id + '\u0001' + x.ev.task_id;
      if (!nachAufgabe[k]) { nachAufgabe[k] = []; reihen.push(k); }
      nachAufgabe[k].push(x);
    });
    var offen = [], widersprueche = 0;
    reihen.forEach(function (k) {
      var g = nachAufgabe[k];
      g.sort(function (p, q) {
        if (p.ev.occurred_at !== q.ev.occurred_at)
          return p.ev.occurred_at < q.ev.occurred_at ? -1 : 1;
        if (p.recorded_at !== q.recorded_at)
          return p.recorded_at < q.recorded_at ? -1 : 1;
        return p.kommentar - q.kommentar;
      });
      /* DIESELBE KETTE WIE LIVE, mit denselben Stufen. Stuende hier eine
         andere Reihenfolge, zeigte dieselbe Lage je nach Weg zwei
         Wahrheiten -- Atlas' Bedingung. */
      var STUFE = { zugewiesen: 1, empfangen: 2, begonnen: 3,
                    geliefert: 4, geprueft: 5 };
      var ZU = { received: 'empfangen', started: 'begonnen',
                 delivered: 'geliefert', reviewed: 'geprueft' };
      var halter = '', zustand = '', titel = '', zu = false, letzte = null,
          klemmt = [], belegVergabe = 0,
          eTyp = 'task', eEltern = '', eFassung = '',
          /* R3: Ob schon EINE Vergabe gesprochen hat. Nicht `eTyp !== ''`
             pruefen -- der Vorgabewert ist `task`, also waere eine erste
             Vergabe ohne `item_type` nicht von "noch keine" zu
             unterscheiden. */
          eTypGesetzt = false;
      g.forEach(function (x) {
        var e = x.ev;
        var selbst = !!e.selbstauskunft;
        if (zu) {
          /* Nach dem Schliessen noch ein Zustandsereignis: Das ist ein
             Widerspruch in den Daten, keine Wiedereroeffnung. Eine Klemme
             nach dem Abschluss gehoert dazu: Sie behauptete, eine Aufgabe
             haenge, die laut denselben Daten vorbei ist. */
          if (ZU[e.kind] || e.kind === 'assigned' || e.kind === 'blocked')
            widersprueche++;
          return;
        }
        if (e.kind === 'assigned' && e.recipient) {
          /* ===== R3, NACHBESSERUNG (Aufgabe 46-8): ERST PRUEFEN, DANN AENDERN =====
             Atlas' Befund 6359816846 vom 23.10.: Hier liefen Halter, Stufe,
             Titel und `letzte` VOR dem Typ-/Elternvergleich. Ein
             widerspruechliches zweites `assigned` wurde zwar gezaehlt und
             behielt Typ und Eltern -- verschob aber schon den Halter und
             setzte die Stufe auf "zugewiesen" zurueck. Der Livepfad
             (`arbeitZuweisen`) kehrt dagegen VOR jeder Aenderung zurueck. Zwei
             Wege, zwei Lagen.
             Jetzt wie live: Widerspricht die Vergabe, wird sie gezaehlt und
             wirkt GAR NICHT -- Halter, Stufe, Titel, Beleg und Fassung bleiben
             die der ersten. Gegentest: R20 (Historie) und L20 (laufender Strom)
             im Nachweis AG-EVENT-JOURNAL-001. */
          var tPruef = e.item_type || 'task', pPruef = e.parent_id || '';
          if (eTypGesetzt && (eTyp !== tPruef || eEltern !== pPruef)) {
            widersprueche++;
            return;
          }
          halter = e.recipient; zustand = 'zugewiesen';
          titel = e.title; letzte = x;
          /* DER BELEG DER AUFGABE IST DER, DER SIE VERGEBEN HAT -- genau wie
             im Livepfad, wo `arbeitZuweisen` den Beleg des `assigned`
             mitbekommt. Hier stand zuerst der Beleg des ZULETZT wirkenden
             Ereignisses; damit haette dieselbe Lage je nach Weg (live oder
             wiederhergestellt) auf zwei verschiedene Kommentare gezeigt.
             Genau das schliesst Atlas' Bedingung aus. Der zuletzt wirkende
             Beleg geht als eigene Angabe mit, statt den ersten zu ersetzen. */
          if (!belegVergabe) belegVergabe = x.kommentar;
          /* Typ, Elternbezug und Fassung kommen von der VERGABE -- wie der
             Beleg. Live setzt `arbeitZuweisen` sie genau dort; naehme die
             Faltung sie von einem spaeteren Ereignis, zeigte dieselbe Lage
             je nach Weg zwei verschiedene Elternketten. */
          /* ===== R3: DAS ERSTE BLEIBT STEHEN =====
             Archibald R3, von Atlas am 23.10. zum Vorziehen freigegeben:
             "Eine weitere Vergabe desselben offenen Elements mit anderem Typ
             oder anderen Eltern wird als Konflikt gezeigt und ueberschreibt
             nicht still."

             Hier stand eine blanke Zuweisung, und die lief je Ereignis der
             Gruppe erneut durch -- die LETZTE Vergabe gewann, ohne ein Wort.
             Jetzt gewinnt die erste, und ein Widerspruch wird gezaehlt: Er
             erscheint in der vorhandenen Konfliktanzeige
             (`basisGrenzen.konflikte` -> "Konflikt" in der Zeile), genau wie
             Atlas es verlangt -- keine neue Anzeige.

             Gleiche Angaben zweimal sind KEIN Konflikt, sondern ein
             Transportduplikat. Derselbe Unterschied wie beim zweiten
             `delivered`.

             `item_version` BLEIBT wie bisher die letzte, und das ist
             Absicht: Eine neue Fassung desselben Elements kann eine
             rechtmaessige Meldung sein, und genau darueber ist E3/R6 noch
             offen. Sie hier mit einzufangen hiesse, eine offene Entscheidung
             im Vorbeigehen zu treffen. */
          /* Der Widerspruch ist oben schon abgefangen (Nachbesserung 46-8);
             hier kommt nur noch an, was zum Ersten passt oder das Erste ist. */
          eTyp = tPruef; eEltern = pPruef; eTypGesetzt = true;
          eFassung = e.item_version || '';
          return;
        }
        if (!selbst) { basisGrenzen.fremdaussagen++; return; }
        /* HALTERGEBUNDEN ODER NICHT -- dieselbe Unterscheidung wie live.
           Atlas' Befund vom 21.10.: Pruefung und Annahme waren hier an
           `e.actor === halter` gebunden, also konnte Argus' eigene Pruefung
           Forges Aufgabe nicht weiterstellen. Eine Selbstmeldung des
           Pruefers ist etwas anderes als eine Selbstabnahme des Lieferanten;
           `selbst` oben prueft schon, dass der Melder der Akteur ist. */
        /* ============ WER LIEFERT, NIMMT NICHT SELBST AB ============

           Archibalds Befund R5, von Atlas am 23.10. als Lesart A
           entschieden: "Selbstannahme schliesst nicht; Aufgabe bleibt
           offen." Dieselbe Regel hier wie live, denn Atlas' Bedingung
           lautet: Wiederherstellung und Livebetrieb muessen dieselbe Lage
           ergeben.

           ZWEI SCHRANKEN, NICHT EINE. `selbst` oben prueft, WER MELDEN
           DARF (Melder = Akteur). Diese prueft, WER ABNEHMEN DARF
           (Akteur != Halter). Ich hatte die beiden zweimal verwechselt --
           einmal in meiner TK-022-Notiz, einmal hier im Code, und beide
           Male hat es jemand anderes gefunden.

           `aborted` STEHT HIER NICHT, und das ist Atlas' eigener Zusatz:
           Wer abbricht, bricht seine eigene Arbeit ab -- eine Nachricht
           ueber sich selbst, kein Urteil ueber ein Ergebnis. Es faellt
           weiter in den Schliesszweig unten, auch vom Halter. */
        if ((e.kind === 'reviewed' || e.kind === 'accepted') &&
            halter && e.actor === halter) {
          basisGrenzen.selbstannahmen++;
          /* `letzte` bleibt, wo es war -- dieses Ereignis hat nicht
             gewirkt, also ist es auch nicht das zuletzt wirkende. */
          return;
        }
        if (ZU[e.kind] && halter && (!HALTERGEBUNDEN[e.kind] || e.actor === halter)) {
          /* Nur vorwaerts: Ein Ereignis, das keine hoehere Stufe bringt,
             aendert nichts. Ein zweites `delivered` ist ein Duplikat, kein
             Ruecksprung -- und als Widerspruch zaehlt es auch nicht. */
          if ((STUFE[ZU[e.kind]] || 0) > (STUFE[zustand] || 0))
            zustand = ZU[e.kind];
          letzte = x; return;
        }
        /* ======= DIE KLEMMEN WERDEN MITGEFALTET, NICHT UEBERSPRUNGEN =====
           Atlas' Bedingung: Wiederherstellung und Livebetrieb muessen
           dieselbe Lage ergeben. Dieselbe Regel also auch hier: Nur der
           Halter selbst meldet seine Klemme, der Zustand bleibt unberuehrt,
           und eine Aufloesung trifft GENAU die Klemme ihrer Kennung.
           Vorwaerts gefaltet wie alles andere: Eine Aufloesung ohne
           passende offene Klemme ist ein Widerspruch, keine stille
           Korrektur. */
        if (e.kind === 'blocked' && halter && e.actor === halter &&
            e.blocker_id) {
          for (var bz = 0; bz < klemmt.length; bz++)
            if (klemmt[bz].id === e.blocker_id) return;   /* Duplikat */
          /* Mit dem Beleg: WELCHER Kommentar die Klemme gemeldet hat. */
          klemmt.push({ id: e.blocker_id, grund: e.title, beleg: x.kommentar });
          letzte = x; return;
        }
        if (e.kind === 'resolved' && halter && e.actor === halter &&
            e.blocker_id) {
          for (var rz = 0; rz < klemmt.length; rz++)
            if (klemmt[rz].id === e.blocker_id) {
              klemmt.splice(rz, 1); letzte = x; return;
            }
          widersprueche++; return;
        }
        if ((e.kind === 'accepted' || e.kind === 'aborted') && halter) {
          /* ANGENOMMEN ODER ABGEBROCHEN SCHLIESST, GELIEFERT NICHT. Hier
             stand `delivered`; mit Pruefung und Annahme in der Kette waere
             die Aufgabe weg, bevor jemand sie angesehen hat.
             Klemmt noch etwas, geht es mit der Aufgabe weg. Das ist keine
             Aufloesung und wird auch nicht als eine gezaehlt -- es stand
             nur nie ein `resolved` dazu. */
          zu = true; letzte = x; return;
        }
      });
      if (!zu && halter && zustand) {
        offen.push({ projekt: g[0].ev.project_id, lauf: g[0].ev.run_id,
                     aufgabe: g[0].ev.task_id, wer: halter, zustand: zustand,
                     titel: titel, klemmt: klemmt,
                     occurred_at: letzte ? letzte.ev.occurred_at : '',
                     recorded_at: letzte ? letzte.recorded_at : '',
                     eTyp: eTyp, eEltern: eEltern, eFassung: eFassung,
                     beleg: belegVergabe,
                     belegRef: belegVergabe ? BELEG_BASIS + belegVergabe : '',
                     belegLetzte: letzte ? letzte.kommentar : 0 });
      }
    });
    basisGrenzen.konflikte += widersprueche;
    return offen;
  }

  async function aufbau(g) {
    Z.kommentare.leeren(); Z.etags = {}; Z.seite = 1; Z.anzahl = 0;
    zahl.basisKommentare = 0; zahl.basisMarkiert = 0;
    basisLeben.length = 0; basisBall.length = 0;
    archivAlle.length = 0; archivStand = -1;
    basisGrenzen = { seitenDeckel: false, konflikte: 0, fremdaussagen: 0,
                     selbstannahmen: 0 };
    zahl.wieder = 0; zahl.wiederKlemmt = 0; zahl.abdeckung = '';
    var spaeter = [], basisIds = Menge(MAX_IDS);
    /* AG-PROJEKTE-002: das Verzeichnis zuerst, denn es entscheidet, was aus
       der Historie wiederhergestellt wird. Bei jedem Aufbau neu gelesen,
       damit ein neues Projekt mit dem naechsten Verbinden erscheint. */
    anzeigen('lese das Projektverzeichnis …');
    verz = await verzeichnisLaden();
    if (g !== gen) throw ABBRUCH;
    if (verz && wahl !== '*' && !verz.nach[wahl]) wahl = '*';
    projekteMelden();
    anzeigen('lese alle Basisseiten …');
    await vorwaerts(1, g, 'basis', spaeter, basisIds);
    if (g !== gen) throw ABBRUCH;
    /* Erst jetzt, nach der letzten Basisseite, gilt die Verbindung. */
    basisIds.alle().forEach(function (id) { bekannte.add(id); });
    Z.phase = 'verbunden';
    vermerk('verbunden; Basis ' + zahl.basisKommentare + ' Kommentare bis ' + Z.schnittIso);
    if (window.__agStrom) { window.__agStrom.an(); window.__agStrom.lebenszeichen(); }
    for (var i = 0; i < spaeter.length; i++) {
      zahl.waehrendAufbau++; zeigen(spaeter[i], 'während Aufbau');
    }
    /* DIE STILLE ERKLAEREN, STATT SIE ZU ZEIGEN.
       Gemessen am 21.10. mit den drei echten Kommentaren von Atlas gegen
       die veroeffentlichte Fassung: Lagen sie beim Verbinden schon da,
       meldete das Fach "3 markierte historisch, nicht abgespielt", und die
       Buehne blieb leer -- genau Peters "kein ball, keine aktivitaet,
       totenstille". Kamen dieselben drei danach, standen drei Meldungen und
       ein Flug im Bild. Abgewiesen wurde in beiden Faellen nichts.
       Nachgespielt wird die Historie weiterhin NICHT -- das Bild wuerde
       sonst Arbeit zeigen, die vorbei ist. Aber es sagt jetzt, was geschehen
       ist, und zwar in der Zeile, die sonst "Noch kein neues Ereignis"
       trug: Die bisherige Fassung verschwieg die Einordnung genau dort, wo
       man nach ihr gesucht haette.
       Und das Fach bleibt OFFEN, wenn markierte Ereignisse in die Historie
       gefallen sind. Es klappte bisher ausgerechnet im einzigen Fall zu, in
       dem seine Erklaerung gebraucht wird. */
    /* WAS OFFEN WAR, WIRD WIEDERHERGESTELLT -- ALS ZUSTAND, NICHT ALS LAUF.
       Die Abdeckung ist dabei NIEMALS `complete`, und das ist keine
       Vorsicht, sondern eine Tatsache: Was nie gemeldet wurde, steht in
       keiner Quelle, also kann keine Zaehlung es finden. `unavailable` gilt,
       wenn schon das Lesen unvollstaendig war -- dann ist nicht einmal das
       Gemeldete ganz da. */
    /* AG-PROJEKTE-002: wiederhergestellt wird nur, was im gewaehlten
       Ausschnitt sichtbar ist -- dieselbe Regel wie live. */
    var nurSichtbar = function (x) { return sichtbar(x.ev); };
    var offen = faltenZuZustand(basisLeben.filter(nurSichtbar));
    zahl.abdeckung = basisGrenzen.seitenDeckel ? 'unavailable' : 'partial';
    if (typeof window.__agWiederherstellen === 'function') {
      try {
        var w = window.__agWiederherstellen({
          aufgaben: offen, abdeckung: zahl.abdeckung,
          gelesen: zahl.basisKommentare, markiert: zahl.basisMarkiert,
          grenzen: basisGrenzen, schnitt: Z.schnittIso,
          /* Ballspiel, Schritt 1b: Peters noch liegende Baelle. Ein
             aelteres Original kennt das Feld nicht und uebergeht es. */
          liegend: baelleFalten(basisBall.filter(nurSichtbar)) });
        zahl.wieder = (w && typeof w.angenommen === 'number') ? w.angenommen : 0;
        /* Aus dem RUECKGABEWERT, nicht aus der gefalteten Liste: Was das
           Original wirklich angelegt hat, weiss nur das Original. */
        zahl.wiederKlemmt = (w && typeof w.mitKlemme === 'number') ? w.mitKlemme : 0;
        vermerk('wiederhergestellt: ' + zahl.wieder + ' offene Aufgabe(n), ' +
                'Abdeckung ' + zahl.abdeckung);
      } catch (x) {
        vermerk('Wiederherstellen scheiterte: ' + (x && x.message));
        zahl.abdeckung = 'unavailable';
      }
    }
    if (zahl.basisMarkiert && !spaeter.length) {
      letztesEl.textContent =
        'Nichts Neues seit dem Verbinden. ' + zahl.basisMarkiert +
        ' markierte Ereignis' + (zahl.basisMarkiert > 1 ? 'se' : '') +
        ' lagen schon vor dem Schnitt (' + Z.schnittIso + ') und werden nicht ' +
        'nachgespielt — das Bild zeigt keine Arbeit, die vorbei ist.';
    }
    if (!spaeter.length && !zahl.basisMarkiert) auf.open = false;   /* nach dem Verbinden: eine Zeile */
  }

  async function abfrage(g) {
    var a = await holen(Z.seite, g);
    if (a.status === 304) {
      if (Z.anzahl >= 100) await vorwaerts(Z.seite + 1, g, 'live');
      return;
    }
    if (!a.items.length && Z.seite > 1) { Z.seite--; Z.anzahl = 100; return; }  /* geloescht */
    verarbeiten(a.items, 'live');
    Z.anzahl = a.items.length;
    var nx = naechste(a.link, Z.seite);
    if (nx) await vorwaerts(nx, g, 'live');
    else if (a.items.length >= 100) await vorwaerts(Z.seite + 1, g, 'live');
  }

  function planen(ms) {
    clearTimeout(uhr);
    ms = Math.max(0, ms);
    Z.nichtVor = Date.now() + ms;
    uhr = setTimeout(zyklus, Math.min(2147483647, ms));
  }

  async function zyklus() {
    uhr = null;
    if (!token || laufend) return;
    if (Z.nichtVor > Date.now()) {
      uhr = setTimeout(zyklus, Math.min(2147483647, Z.nichtVor - Date.now()));
      return;
    }
    if (document.hidden) { Z.pausiert = true; anzeigen(); return; }
    Z.pausiert = false;
    laufend = true;
    var g = gen, warte = TAKT;
    try {
      if (Z.phase === 'verbunden') await abfrage(g); else await aufbau(g);
      if (g !== gen) return;
      Z.fehlerFolge = 0; Z.fehler = '';
      if (window.__agStrom) window.__agStrom.lebenszeichen();
      warte = Z.intervall;
    } catch (x) {
      if (x === ABBRUCH || g !== gen) return;
      if (x && x.art === 'auth') { laufend = false; trennen(x.text); Z.phase = 'fehler'; anzeigen(); return; }
      if (x && x.warten) warte = x.warten;
      else { Z.fehlerFolge++; warte = Math.min(60000, TAKT * Math.pow(2, Z.fehlerFolge)); }
      Z.fehler = (x && x.text ? x.text : 'Fehler') + ' — nächster Versuch in ' +
                 Math.ceil(warte / 1000) + ' s';
      vermerk(Z.fehler);
    } finally {
      if (g === gen) laufend = false;
      anzeigen();
    }
    if (g === gen && token) planen(warte);
  }

  /* ================= LAUF NACHSPIELEN: Liste, Abspielen, Rueckkehr ================= */
  function archivOrdnung(p, q) {
    if (p.ev.occurred_at !== q.ev.occurred_at)
      return p.ev.occurred_at < q.ev.occurred_at ? -1 : 1;
    if (p.recorded_at !== q.recorded_at) return p.recorded_at < q.recorded_at ? -1 : 1;
    return p.kommentar - q.kommentar;
  }
  function archivLaeufe() {
    var nach = Object.create(null), r = [];
    archivAlle.forEach(function (x) {
      if (!sichtbar(x.ev)) return;   /* AG-PROJEKTE-002: nur der gewaehlte Ausschnitt */
      var k = x.ev.project_id + '\u0001' + x.ev.run_id;
      if (!nach[k]) { nach[k] = { k: k, projekt: x.ev.project_id, lauf: x.ev.run_id,
                                  n: 0, zuletzt: '' }; r.push(nach[k]); }
      nach[k].n++;
      if (x.ev.occurred_at > nach[k].zuletzt) nach[k].zuletzt = x.ev.occurred_at;
    });
    return r.sort(function (a, b) { return a.zuletzt < b.zuletzt ? 1 : -1; });
  }
  /* ================= ARCHIV JE PROJEKT (AG-PROJEKTE-003) =================
     Peter, 25.10.: Das Archiv eines Projekts ist seine Projektdoku in
     abspielbarer Form -- ALLE Laeufe mit dieser Projekt-ID, zeitlich
     geordnet, parallele Laeufe gleichzeitig. Gewaehlt oben rechts am Projekt
     (Archiv · Live), mit Tempo, Halt/Weiter und Von vorn.

     DERSELBE EINGANG WIE LIVE (`zeigen` -> `__agEreignis`): Darum steuert
     ein nachgespielter Lauf den Monitor genau wie ein echter.

     DIE MONITORUHR TAKTET, NICHT DIE ECHTE UHR. Jedes Ereignis bekommt eine
     Zeit in Sekunden der Monitoruhr (`B.uhr()`, das `zeit` des Originals);
     weitergegeben wird es, sobald die Uhr sie erreicht. Das Tempo laesst die
     Uhr schneller laufen, Halt haelt sie an -- beides wirkt also ohne eine
     Zeile Sonderlogik. Die Pausen werden gerafft: echte Luecke geteilt durch
     ARCHIV_RAFFUNG, nie unter ARCHIV_MIN (jeder Flug bleibt sichtbar), nie
     ueber ARCHIV_MAX (niemand wartet eine Nacht). Laeufe, die damals
     parallel liefen, wechseln sich dadurch so ab wie damals.

     Waehrend des Archivs werden echte neue Ereignisse zurueckgestellt, nicht
     vermischt; "Live" baut den echten Stand neu auf wie beim Verbinden. */
  function archivStopp() {
    if (archivTakt) { clearInterval(archivTakt); archivTakt = null; }
    var war = archivAnsicht;
    archivLaeuft = false; archivAnsicht = false; archivFolge = []; archivIdx = 0;
    if (war && typeof B.archivAnzeige === 'function') B.archivAnzeige(false);
  }
  function archivProjekt() {
    if (Z.phase !== 'verbunden') { vermerk('Archiv: erst verbinden'); return false; }
    if (typeof B.uhr !== 'function' || typeof B.abspielen !== 'function' ||
        typeof B.archivAnzeige !== 'function' || typeof B.neuBeginnen !== 'function') {
      vermerk('Archiv: das Original ist zu alt'); return false;
    }
    var liste = archivAlle.filter(function (x) { return sichtbar(x.ev); }).sort(archivOrdnung);
    var t = 0, vorher = NaN;
    archivFolge = liste.map(function (x, i) {
      var jetzt = Date.parse(x.ev.occurred_at);
      var luecke = (isNaN(vorher) || isNaN(jetzt)) ? 0 : Math.max(0, jetzt - vorher) / 1000;
      t += (i === 0) ? ARCHIV_START
                     : Math.min(ARCHIV_MAX, Math.max(ARCHIV_MIN, luecke / ARCHIV_RAFFUNG));
      if (!isNaN(jetzt)) vorher = jetzt;
      return { t: t, ev: x.ev };
    });
    if (archivTakt) { clearInterval(archivTakt); archivTakt = null; }
    B.neuBeginnen();
    archivAnsicht = true; archivLaeuft = archivFolge.length > 0;
    archivIdx = 0; aktuellerLauf = '';
    /* "Durchgespielt" erst, wenn der letzte Ball gelandet sein kann. */
    archivEnde = t + ARCHIV_NACHLAUF;
    B.archivAnzeige(true, function () { archivProjekt(); });
    B.abspielen();
    vermerk('Archiv: ' + archivFolge.length + ' Ereignisse, ' +
            (wahl === '*' ? 'alle Projekte' : wahl));
    archivTakt = setInterval(archivSchritt, 100);
    return true;
  }
  function archivSchritt() {
    if (!archivAnsicht) return;
    var u = B.uhr();
    while (archivIdx < archivFolge.length && archivFolge[archivIdx].t <= u)
      zeigen(archivFolge[archivIdx++].ev, 'Archiv');
    if (archivLaeuft && archivIdx >= archivFolge.length && u >= archivEnde) {
      archivLaeuft = false;
      vermerk('Archiv: durchgespielt');
      clearInterval(archivTakt); archivTakt = null;
    }
  }
  function archivZurueckLive() {
    var warAnsicht = archivAnsicht;
    archivStopp();
    if (!warAnsicht || !token) return;
    /* Die Buehne ist danach leer, also gibt es nichts mehr, das vor einem
       zweiten Flug zu schuetzen waere: Das Gedaechtnis wird mit geleert, und
       der Neuaufbau stellt ALLES Offene wieder her (Aufgaben und Baelle). */
    if (typeof B.neuBeginnen === 'function') B.neuBeginnen();
    bekannte.leeren();
    /* Dasselbe wie Verbinden, nur ohne erneute Eingabe: das Token geht als
       Wert weiter, nicht ueber das Eingabefeld. */
    verbinden(token);
  }

  function verbinden(tokenWeiter) {
    var t = (typeof tokenWeiter === 'string') ? tokenWeiter : feld.value.trim();
    tokenWeiter = null;
    feld.value = '';
    if (!/^[A-Za-z0-9_]{20,255}$/.test(t)) {
      anzeigen('Token-Format nicht erkannt — nichts gesendet');
      return;
    }
    trennen(null);
    token = t; t = null;
    gen++;
    ctrl = (typeof AbortController === 'function') ? new AbortController() : null;
    Z.schnitt = Date.now(); Z.schnittIso = new Date(Z.schnitt).toISOString();
    Z.nichtVor = 0;
    Z.phase = 'aufbau'; Z.fehler = ''; Z.fehlerFolge = 0; Z.intervall = TAKT;
    aktuellerLauf = '';
    anzeigen();
    zyklus();
  }

  function trennen(text) {
    gen++;
    token = null;
    /* Ein laufendes Archiv endet mit der Verbindung. */
    archivStopp();
    if (ctrl) { try { ctrl.abort(); } catch (x) {} }
    ctrl = null;
    clearTimeout(uhr); uhr = null;
    laufend = false;
    var war = Z.phase !== 'getrennt';
    Z.phase = 'getrennt';
    if (war && window.__agStrom) window.__agStrom.aus();
    if (text) { vermerk(text); anzeigen(text); } else anzeigen();
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden || !token || laufend) return;
    Z.pausiert = false;
    planen(Math.max(0, Z.nichtVor - Date.now()));     /* Limits gelten auch nach Rueckkehr */
  });
  window.addEventListener('pagehide', function () { trennen('Seite verlassen — Token entfernt'); });

  /* Nur zum Nachsehen (Tests, iPad ohne Konsole). Enthaelt nie das Token. */
  window.__agGithub = Object.freeze({
    version: ADAPTER,
    endpoint: ENDPOINT,
    /* Die Bezeichnung eines Laufs (Titel des Anstosses), fuer das Schild am
       Ball. Nur lesend; leer, wenn kein Anstoss gemeldet wurde. */
    laufName: function (projekt, lauf) { return laufName(String(projekt), String(lauf)); },
    stand: function () {
      return JSON.parse(JSON.stringify({
        phase: Z.phase, verbunden: Z.phase === 'verbunden', hatToken: !!token,
        ablaufDatum: ablaufDatum, ablaufTage: ablaufStand().tage,
        seite: Z.seite, anzahl: Z.anzahl, schnitt: Z.schnittIso, intervall: Z.intervall,
        pausiert: Z.pausiert, fehler: Z.fehler, grund: letzterGrund, zahl: zahl,
        letztes: letztes, bekannteIds: bekannte.groesse(), log: log,
        archiv: { laeuft: archivLaeuft, ansicht: archivAnsicht,
                  ereignisse: archivAlle.length, laeufe: archivLaeufe().length,
                  folge: archivFolge.length, gezeigt: archivIdx },
        projekte: { verzeichnis: !!verz, wahl: wahl,
                    liste: verz ? verz.liste.map(function (p) { return p.id; }) : [] } }));
    }
  });
})();
