/* AG-BALL-LIVE-001 — lokaler Livestrom fuer das ORIGINAL-Feld. Kandidat c1.

   Wird nur von index.html?ball_live=1 geladen. Verbindet per SSE (gleiche
   Herkunft, /events) und reicht jedes angenommene Ereignis an die
   vorhandenen Griffe des Originals: __agLauf, __agEreignis, __agStrom.
   Kein Neuladen, kein eval, keine fremde Adresse, kein Token im Browser.

   Ehrlich bleiben:
   - Verbindungsabbruch, Herzschlag und Veralten erfinden kein "fertig"
     und keinen Ruhezustand. Es steht da, was der Transport weiss.
   - Nachgeholt wird nur aus dem Speicherpuffer des laufenden lokalen
     Servers. Luecken werden ausdruecklich angezeigt. Kein Archiv.
   - Die Herkunft (source_evidence) wird angezeigt, wie sie geliefert wurde:
     runtime_stream oder synthetic_test_fixture. */
(function () {
  'use strict';
  var VERSION = 'AG-BALL-LIVE-001-c1';
  var AGENTEN = { peter: 1, nova: 1, atlas: 1, cadence: 1, scout: 1,
                  forge: 1, sentinel: 1, archibald: 1, argus: 1 };
  var KINDS = { progress: 1 };
  var HERKUNFT = { runtime_stream: 1, synthetic_test_fixture: 1 };
  var ID_RE = /^[A-Za-z0-9._:-]{1,80}$/;
  var TOOL_RE = /^[A-Za-z0-9_.:-]{1,128}$/;
  var TITEL_MAX = 160;
  var STALE_MS = 15000;
  var LISTE_MAX = 1000;

  /* Messsonde fuer Tests. Ersetzt NICHT den sichtbaren Beleg (Tafel). */
  var B = window.__agBallLive = {
    version: VERSION, transport: 'sse', state: 'start',
    accepted: [], rejected: [], duplicates: 0, gaps: [], diagnostics: [],
    cursor: null, instance: null, connects: 0, last: null, lastMessageAt: 0
  };

  /* ---------------- Sichtbare Tafel (nur textContent) ---------------- */
  var tafel = document.createElement('div');
  tafel.id = 'agBallLive';
  tafel.setAttribute('data-version', VERSION);
  tafel.setAttribute('data-state', 'start');
  tafel.style.cssText = 'position:fixed;left:8px;bottom:8px;' +
    'max-width:min(60vw,640px);z-index:50;font:12px/1.4 monospace;' +
    'color:#9fd6b5;background:rgba(0,0,0,.55);padding:6px 8px;' +
    'border-radius:4px;pointer-events:none;white-space:pre-wrap;' +
    'word-break:break-word';
  function zeile(id) {
    var d = document.createElement('div');
    d.id = id; tafel.appendChild(d); return d;
  }
  var zKopf = zeile('agBallLiveKopf'),
      zTransport = zeile('agBallLiveTransport'),
      zLetztes = zeile('agBallLiveLetztes'),
      zHerkunft = zeile('agBallLiveHerkunft'),
      zLuecke = zeile('agBallLiveLuecke'),
      zHinweis = zeile('agBallLiveHinweis');
  function setze(z, t) { if (z.textContent !== t) z.textContent = t; }
  setze(zKopf, 'BALL LIVE · ' + VERSION);
  setze(zLetztes, 'Noch kein Ereignis empfangen.');
  document.body.appendChild(tafel);

  function diag(t) {
    B.diagnostics.push(t);
    if (B.diagnostics.length > 20) B.diagnostics.shift();
    setze(zHinweis, t);
  }
  function zustand(s, text) {
    B.state = s;
    tafel.setAttribute('data-state', s);
    setze(zTransport, 'Transport: ' + text);
  }
  function verweigern(t) {
    zustand('verweigert', 'nicht aktiviert');
    diag('Nicht aktiviert: ' + t);
  }

  /* ---------------- Vorbedingungen: gemischte Fassungen verweigern ------ */
  if (window.__agBallLiveErwartet !== VERSION) {
    verweigern('Versionskonflikt — Seite erwartet ' +
               String(window.__agBallLiveErwartet) + ', live.js ist ' + VERSION);
    return;
  }
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    verweigern('ein Service Worker kontrolliert diese Seite (alte Dateien ' +
               'moeglich). Arbeiter abmelden, dann neu oeffnen.');
    return;
  }
  if (typeof window.__agLauf !== 'function' ||
      typeof window.__agEreignis !== 'function' ||
      !window.__agStrom || typeof window.__agStrom.an !== 'function') {
    verweigern('Griffe des Originals fehlen');
    return;
  }
  if (typeof EventSource !== 'function') {
    verweigern('EventSource fehlt in diesem Browser');
    return;
  }

  var strom = window.__agStrom;
  var es = null, wiederUhr = null, warte = 1000, manuell = false;
  var lauf = null, gesehen = Object.create(null);

  /* Alle bekannten Senken des Originals fuer `title` (stromZeile, melden)
     schreiben per innerHTML. Deshalb wird der Titel hier maskiert, bevor er
     an __agEreignis geht. Die eigene Tafel benutzt textContent mit dem
     unmaskierten Text. */
  function html(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function merke(liste, x) {
    liste.push(x);
    if (liste.length > LISTE_MAX) liste.shift();
  }
  function lebt() {
    B.lastMessageAt = Date.now();
    if (B.state === 'veraltet')
      zustand('verbunden', 'verbunden (SSE) · Cursor ' + B.cursor);
  }
  function json(ev) {
    try { return JSON.parse(ev.data); } catch (x) { return null; }
  }

  function pruefen(d) {
    if (!d || typeof d !== 'object') return 'kein Objekt';
    if (typeof d.id !== 'string' || !ID_RE.test(d.id)) return 'id ungueltig';
    if (typeof d.run_id !== 'string' || !ID_RE.test(d.run_id)) return 'run_id ungueltig';
    if (!AGENTEN[d.actor]) return 'actor unbekannt';
    if (!KINDS[d.kind]) return 'kind nicht erlaubt';
    if (typeof d.title !== 'string' || !d.title.trim() ||
        d.title.length > TITEL_MAX) return 'title ungueltig';
    if (d.recipient != null && !AGENTEN[d.recipient]) return 'recipient unbekannt';
    if (!HERKUNFT[d.source_evidence]) return 'source_evidence ungueltig';
    if (d.source_tool_id != null &&
        (typeof d.source_tool_id !== 'string' || !TOOL_RE.test(d.source_tool_id)))
      return 'source_tool_id ungueltig';
    return '';
  }

  function annehmen(d, seq) {
    var grund = pruefen(d);
    if (grund) {
      merke(B.rejected, { id: d && typeof d.id === 'string' ? d.id : null, grund: grund });
      diag('Ereignis abgewiesen: ' + grund);
      return;
    }
    if (gesehen[d.id]) { B.duplicates++; return; }   /* keine Doppelwirkung */

    if (d.run_id !== lauf) {
      /* run_id ist auf [A-Za-z0-9._:-] beschraenkt und damit fuer die
         innerHTML-Senken in kopfSetzen unschaedlich. */
      var rl = window.__agLauf({ project_id: d.run_id, kurz: d.run_id, titel: d.run_id });
      if (!rl || !rl.angenommen) {
        merke(B.rejected, { id: d.id, grund: 'Lauf: ' + (rl ? rl.grund : '?') });
        diag('Lauf abgewiesen: ' + (rl ? rl.grund : '?'));
        return;
      }
      lauf = d.run_id;
    }
    var r = window.__agEreignis({
      id: d.id, actor: d.actor, kind: d.kind,
      title: html(d.title.trim()), recipient: d.recipient || ''
    });
    if (!r || !r.angenommen) {
      merke(B.rejected, { id: d.id, grund: r ? r.grund : '?' });
      diag('Original wies ab: ' + (r ? r.grund : '?'));
      return;
    }
    gesehen[d.id] = true;
    merke(B.accepted, d.id);

    var t = {
      id: d.id, seq: seq, run_id: d.run_id, actor: d.actor, kind: d.kind,
      title: d.title.trim(), recipient: d.recipient || null,
      source_evidence: d.source_evidence, source_tool_id: d.source_tool_id || null,
      server_instance: d.server_instance || null,
      server_received_monotonic_ns: d.server_received_monotonic_ns || null,
      server_received_wall_ms: d.server_received_wall_ms || null,
      browser_received_wall_ms: Date.now(),
      browser_received_perf_ms: performance.now(),
      browser_time_origin_ms: performance.timeOrigin,
      browser_painted_wall_ms: null
    };
    B.last = t;
    var synth = d.source_evidence === 'synthetic_test_fixture';
    setze(zLetztes, 'Ereignis ' + d.id + ' · ' + t.title);
    setze(zHerkunft, 'Herkunft: ' +
      (synth ? 'SYNTHETISCH (synthetic_test_fixture, kein Beleg)' : 'runtime_stream') +
      (t.source_tool_id ? ' · tool ' + t.source_tool_id : '') +
      ' · ' + d.actor + ' · ' + d.kind + ' · #' + seq);
    tafel.setAttribute('data-provenance', d.source_evidence);
    tafel.setAttribute('data-event-id', d.id);
    /* Naeherung "nach dem Zeichnen": zwei Bilder spaeter. */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { t.browser_painted_wall_ms = Date.now(); });
    });
  }

  /* ---------------- Transport ---------------- */
  function onHello(ev) {
    lebt();
    var d = json(ev);
    if (!d || d.version !== VERSION) {
      trennenIntern(); manuell = true;
      verweigern('Server meldet Fassung ' + (d ? String(d.version) : '?') +
                 ', erwartet ' + VERSION);
      return;
    }
    if (B.instance && d.instance !== B.instance) {
      var g = { from: null, to: null, reason: 'server_restart' };
      merke(B.gaps, g);
      setze(zLuecke, 'Lücke: lokaler Server neu gestartet — frühere Ereignisse ' +
                     'nicht nachholbar.');
    }
    B.instance = d.instance;
    var c = parseInt(ev.lastEventId, 10);
    if (!isNaN(c)) B.cursor = c;
    B.connects++;
    warte = 1000;
    zustand('verbunden', 'verbunden (SSE) · Cursor ' + B.cursor);
    strom.lebenszeichen();
  }
  function onAg(ev) {
    lebt();
    var seq = parseInt(ev.lastEventId, 10);
    if (!isNaN(seq) && (B.cursor == null || seq > B.cursor)) B.cursor = seq;
    annehmen(json(ev), isNaN(seq) ? null : seq);
  }
  function onHeartbeat() {
    lebt();
    strom.lebenszeichen();
  }
  function onGap(ev) {
    lebt();
    var d = json(ev) || {};
    var g = { from: d.from == null ? null : d.from, to: d.to == null ? null : d.to,
              reason: String(d.reason || 'unbekannt') };
    merke(B.gaps, g);
    setze(zLuecke, (g.from != null)
      ? 'Lücke: Ereignisse #' + g.from + '–#' + g.to + ' nicht nachholbar (' + g.reason + ')'
      : 'Lücke: Nachholen nicht möglich (' + g.reason + ')');
  }
  function onError() {
    strom.aus();
    if (!es) return;
    if (es.readyState === 2) {               /* CLOSED: selbst neu verbinden */
      es.close(); es = null;
      zustand('getrennt', 'getrennt — neuer Versuch in ' + (warte / 1000) +
                          ' s · Cursor ' + B.cursor);
      planen();
    } else {                                 /* CONNECTING: Browser verbindet neu */
      zustand('verbinde', 'unterbrochen — verbinde neu · Cursor ' + B.cursor);
    }
  }
  function planen() {
    if (manuell) return;
    clearTimeout(wiederUhr);
    wiederUhr = setTimeout(function () { verbinden(); }, warte);
    warte = Math.min(warte * 2, 10000);
  }
  function trennenIntern() {
    clearTimeout(wiederUhr); wiederUhr = null;
    if (es) { es.close(); es = null; }
  }
  function verbinden(opt) {
    trennenIntern();
    manuell = false;
    var c = (opt && typeof opt.cursor === 'number') ? opt.cursor : B.cursor;
    var url = 'events' + (c != null ? '?cursor=' + encodeURIComponent(String(c)) : '');
    zustand('verbinde', 'verbinde (SSE) …');
    es = new EventSource(url);
    es.onopen = function () { strom.an(); };
    es.addEventListener('hello', onHello);
    es.addEventListener('ag', onAg);
    es.addEventListener('heartbeat', onHeartbeat);
    es.addEventListener('gap', onGap);
    es.onerror = onError;
  }

  /* Veraltet heisst veraltet -- nicht fertig, nicht ruhig. */
  setInterval(function () {
    if (B.state !== 'verbunden' || !B.lastMessageAt) return;
    var her = Date.now() - B.lastMessageAt;
    if (her > STALE_MS)
      zustand('veraltet', 'seit ' + Math.floor(her / 1000) +
              ' s keine Nachricht — veraltet (nicht „fertig“)');
  }, 1000);

  window.addEventListener('pagehide', trennenIntern);

  /* Testgriffe: Betrachter trennen / wieder verbinden (mit Cursor). */
  B.trennen = function () {
    trennenIntern(); manuell = true; strom.aus();
    zustand('getrennt', 'getrennt (manuell) · Cursor ' + B.cursor);
  };
  B.verbinden = function (opt) { verbinden(opt); };

  verbinden();
})();
