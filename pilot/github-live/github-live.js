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
  var ADAPTER = 'AG-GH-LIVE-001-v1.4';
  /* Wortlaut von Sentinel vorgeschrieben (AG-CONNECT-UX-001, 21.10.), Zeichen
     fuer Zeichen. Einmal benannt, damit Platzhalter und Zeile nicht
     auseinanderlaufen koennen. */
  var TOKEN_SATZ = 'Token ist sicher hinterlegt und wird nicht angezeigt.';
  var ENDPOINT = 'https://api.github.com/repos/pahlborn/agentarium/issues/2/comments?per_page=100';
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
  var OPTIONAL = ['recipient', 'reporter'];      /* nie Pflicht fuer progress */
  var ARTEN = { progress: 1, handoff: 1, contribution: 1,
                assigned: 1, received: 1, started: 1, delivered: 1,
                blocked: 1, resolved: 1, aborted: 1 };
  var KOMM = { handoff: 1, contribution: 1 };    /* nur beobachtet, kein Zustand */
  /* Arten, die einen Aufgabenzustand treiben DUERFEN -- und nur bei
     Selbstauskunft. `assigned` ist dabei die Ausnahme: Die Vergabe meldet
     naturgemaess nicht der Empfaenger, sondern der Vergebende. Sie legt
     deshalb eine Aufgabe als ZUGEWIESEN an und behauptet keinen Beginn. */
  var LEBEN = { assigned: 1, received: 1, started: 1, delivered: 1,
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
  var KANN_LEBEN_WORT = 'gemeldet-v1';
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
               konflikte: 0, abbrueche: 0 };
  /* Fingerabdruck je Ereigniskennung, damit sich ein TRANSPORTDUPLIKAT von
     einem KONFLIKT unterscheiden laesst: dieselbe Kennung mit demselben
     Inhalt ist wirkungslos, dieselbe Kennung mit anderem Inhalt ist ein
     Befund und wird abgewiesen statt stillschweigend verworfen.
     Gedeckelt wie `bekannte`, damit eine lange Sitzung nicht waechst. */
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
                'demselben GitHub-Login, geprüft ist nur dieser. ' + ADAPTER);
  [kopf, zeile, satzEl, ablaufZeile, ablaufText, ablaufHilfe, letztesEl, zahlEl, grundEl, fuss].forEach(function (x) { auf.appendChild(x); });
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
  knAn.addEventListener('click', verbinden);
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
          if (st && typeof st.verarbeitet === 'number')
            return ' · verarbeitet ' + st.verarbeitet +
                   (typeof st.ausgegeben === 'number'
                      ? ' · ausgegeben ' + st.ausgegeben : '');
        } catch (x) {}
        return '';
      })() +
      ' · doppelt ' + zahl.duplikate + ' · Konflikt ' + zahl.konflikte +
      (zahl.abbrueche ? ' · in dieser Sitzung beobachtet: ' + zahl.abbrueche +
        ' Abbruch' + (zahl.abbrueche > 1 ? 'e' : '') + ' (Projektabdeckung: partial)' : '') +
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
    var ids = ['id', 'project_id', 'run_id', 'task_id', 'source_tool_id'];
    for (var q = 0; q < ids.length; q++)
      if (!KENNUNG.test(d[ids[q]])) return nein(ids[q] + ' ungültig');
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
    var lauf = ev.project_id + '|' + ev.run_id;
    if (lauf !== aktuellerLauf) {
      var r0 = window.__agLauf({ project_id: ev.project_id, titel: ev.run_id,
                                 ablage: 'GitHub · pahlborn/agentarium #2' });
      if (r0 && r0.angenommen) aktuellerLauf = lauf;
    }
    /* Volle Schluessel und Herkunft gehen mit; `gh_beobachtet` sagt dem
       Original: aus GitHub, nur beobachtet, keine Zustandsaenderung. */
    var aus = { id: ev.id, actor: ev.actor, kind: ev.kind,
      title: ev.title, occurred_at: ev.occurred_at, source_evidence: ev.source_evidence,
      fictional: false, gh_beobachtet: true, project_id: ev.project_id,
      run_id: ev.run_id, task_id: ev.task_id, source_tool_id: ev.source_tool_id };
    if (ev.recipient) aus.recipient = ev.recipient;
    /* AG-EVENT-JOURNAL-001: Melder und die daraus abgeleitete, PRUEFBARE
       Aussage gehen mit. Das Original entscheidet selbst, was es damit tut
       -- hier wird nichts behauptet, nur weitergegeben. */
    if (ev.reporter) aus.reporter = ev.reporter;
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
      var fa = [ev.project_id, ev.run_id, ev.task_id, ev.actor, ev.kind,
                ev.recipient, ev.reporter, ev.title, ev.occurred_at,
                ev.source_evidence, ev.source_tool_id].join('\u0001');
      if (bekannte.hat(ev.id) || (basisIds && basisIds.hat(ev.id))) {
        var frueher = abdruck[ev.id];
        if (frueher !== undefined && frueher !== fa) {
          zahl.konflikte++;
          abweisen('gleiche Kennung, anderer Inhalt: ' + ev.id, cid);
          continue;
        }
        zahl.duplikate++; vermerk('doppelt ' + ev.id); continue;
      }
      abdruckLegen(ev.id, fa);
      if (modus === 'basis') {
        basisIds.add(ev.id);
        var t = Date.parse(c.created_at);
        if (!isNaN(t) && t >= Z.schnitt) { spaeter.push(ev); continue; }
        zahl.basisMarkiert++;
        continue;
      }
      bekannte.add(ev.id);
      /* ERST HIER, NACH DER BASIS-/LIVE-TRENNUNG. Vorher stand diese Zeile
         ueber dem `basis`-Zweig und zaehlte damit auch die Historie -- also
         Ereignisse von vorgestern als "in dieser Sitzung beobachtet".
         Ebenfalls von Argus gefunden; derselbe Befund, zweite Haelfte. */
      if (ABBRUCHARTEN[ev.kind]) zahl.abbrueche++;
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

  async function aufbau(g) {
    Z.kommentare.leeren(); Z.etags = {}; Z.seite = 1; Z.anzahl = 0;
    zahl.basisKommentare = 0; zahl.basisMarkiert = 0;
    var spaeter = [], basisIds = Menge(MAX_IDS);
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

  function verbinden() {
    var t = feld.value.trim();
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
    stand: function () {
      return JSON.parse(JSON.stringify({
        phase: Z.phase, verbunden: Z.phase === 'verbunden', hatToken: !!token,
        ablaufDatum: ablaufDatum, ablaufTage: ablaufStand().tage,
        seite: Z.seite, anzahl: Z.anzahl, schnitt: Z.schnittIso, intervall: Z.intervall,
        pausiert: Z.pausiert, fehler: Z.fehler, grund: letzterGrund, zahl: zahl,
        letztes: letztes, bekannteIds: bekannte.groesse(), log: log }));
    }
  });
})();
