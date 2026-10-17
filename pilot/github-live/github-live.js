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
*/
(function () {
  'use strict';
  var ADAPTER = 'AG-GH-LIVE-001-v1';
  var ENDPOINT = 'https://api.github.com/repos/pahlborn/agentarium/issues/2/comments?per_page=100';
  var MARKER = '<!-- AGENTARIUM_EVENT_V1 -->';
  var SCHEMA = 'agentarium.github-event.v1';
  var LOGINS = { 'pahlborn': true, 'github-actions[bot]': true };
  var TAKT = 2000, MAX_IDS = 5000, MAX_LOG = 20;
  var MAX_KOERPER = 65536, MAX_SEITEN = 100, MAX_TITEL = 200;
  var FELDER = ['schema', 'id', 'project_id', 'run_id', 'task_id', 'actor', 'kind',
                'title', 'occurred_at', 'source_evidence', 'source_tool_id'];
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
               waehrendAufbau: 0, gezeigt: 0, duplikate: 0, abgewiesen: 0, ohneMarker: 0 };
  var letztes = null, letzterGrund = '', log = [], aktuellerLauf = '';

  function vermerk(t) {
    log.push(new Date().toISOString().slice(11, 19) + ' ' + String(t).slice(0, 200));
    while (log.length > MAX_LOG) log.shift();
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
    '#agGithub summary{cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#agGithub .ghZ{display:flex;gap:4px;align-items:center;margin:4px 0;flex-wrap:wrap}' +
    '#agGithub input{font:inherit;width:12em;background:#0b1018;color:#e8f0ea;' +
    'border:1px solid #3a4658;border-radius:3px;padding:3px 4px}' +
    '#agGithub button{font:inherit;background:#18222f;color:#e8f0ea;' +
    'border:1px solid #3a4658;border-radius:3px;padding:3px 7px}' +
    '#agGithub div,#agGithub small{display:block;margin:2px 0;overflow-wrap:anywhere}' +
    '#agGithub small{opacity:.7}' +
    '#agGithub[data-phase="fehler"] summary{color:#f0a0a0}' +
    '.agName.agGhPuls{text-shadow:0 0 8px currentColor,0 0 18px currentColor}' +
    '#agRufe .agHerkunft{opacity:.75;font-size:10px}';
  document.head.appendChild(stil);

  var tafel = el('section', { id: 'agGithub', 'aria-label': 'GitHub-Live', 'data-phase': 'getrennt' });
  var auf = el('details'); auf.open = true;
  var kopf = el('summary');
  var statusEl = el('span', { id: 'agGhStatus', role: 'status', 'aria-live': 'polite' },
                    'GitHub-Live · getrennt');
  kopf.appendChild(statusEl);
  var zeile = el('div', { 'class': 'ghZ' });
  var lab = el('label', { 'for': 'agGhToken' }, 'Lesetoken');
  var feld = el('input', { id: 'agGhToken', type: 'password', autocomplete: 'off',
                           autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false' });
  var knAn = el('button', { id: 'agGhAn', type: 'button' }, 'Verbinden');
  var knAus = el('button', { id: 'agGhAus', type: 'button' }, 'Trennen');
  zeile.appendChild(lab); zeile.appendChild(feld); zeile.appendChild(knAn); zeile.appendChild(knAus);
  var letztesEl = el('div', { id: 'agGhLetztes' }, 'Noch kein neues Ereignis.');
  var zahlEl = el('div', { id: 'agGhZahlen' });
  var grundEl = el('div', { id: 'agGhGrund' });
  var fuss = el('small', {}, 'Token nur im Arbeitsspeicher dieser Seite, nur an api.github.com. ' +
                'Kosten: nicht verfügbar. Fortschritt ist kein Abschluss. ' + ADAPTER);
  [kopf, zeile, letztesEl, zahlEl, grundEl, fuss].forEach(function (x) { auf.appendChild(x); });
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
    statusEl.textContent = 'GitHub-Live · ' + p +
      (Z.pausiert && Z.phase === 'verbunden' ? ' · pausiert (Tab verborgen)' : '') +
      (Z.fehler ? ' · ' + Z.fehler : '');
    tafel.setAttribute('data-phase', Z.phase);
    zahlEl.textContent =
      (Z.schnittIso ? 'Basis bis ' + Z.schnittIso + ' (Geräteuhr): ' + zahl.basisKommentare +
        ' Kommentare, ' + zahl.basisMarkiert + ' markierte historisch, nicht abgespielt · ' : '') +
      'neu gezeigt ' + zahl.gezeigt + (zahl.waehrendAufbau ? ' (davon während Aufbau ' +
        zahl.waehrendAufbau + ')' : '') +
      ' · doppelt ' + zahl.duplikate + ' · abgewiesen ' + zahl.abgewiesen +
      ' · ohne Marker ' + zahl.ohneMarker + ' · Anfragen ' + zahl.anfragen +
      ' (304: ' + zahl.n304 + ') · Seite ' + Z.seite;
    grundEl.textContent = letzterGrund ? 'Zuletzt abgewiesen: ' + letzterGrund : '';
    knAus.disabled = !token;
  }
  anzeigen();

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
      if (FELDER.indexOf(ks[a]) < 0) return nein('unbekanntes Feld ' + ks[a].slice(0, 40));
    for (var b = 0; b < FELDER.length; b++)
      if (typeof d[FELDER[b]] !== 'string') return nein('Feld fehlt oder kein Text: ' + FELDER[b]);
    if (d.schema !== SCHEMA) return nein('schema falsch');
    if (d.kind !== 'progress') return nein('kind nicht unterstützt: ' + d.kind.slice(0, 40));
    var ids = ['id', 'project_id', 'run_id', 'task_id', 'source_tool_id'];
    for (var q = 0; q < ids.length; q++)
      if (!KENNUNG.test(d[ids[q]])) return nein(ids[q] + ' ungültig');
    if (!AKTEURE[d.actor]) return nein('actor unbekannt');
    var titel = d.title.trim();
    if (!titel || titel.length > MAX_TITEL) return nein('title leer oder länger als ' + MAX_TITEL);
    if (STEUER.test(titel)) return nein('title enthält Steuerzeichen');
    if (!ISO.test(d.occurred_at) || isNaN(Date.parse(d.occurred_at))) return nein('occurred_at ungültig');
    if (!HERKUNFT[d.source_evidence]) return nein('source_evidence nicht erlaubt');
    return { art: 'ok', ev: { id: d.id, project_id: d.project_id, run_id: d.run_id,
      task_id: d.task_id, actor: d.actor, title: titel, occurred_at: d.occurred_at,
      source_evidence: d.source_evidence, source_tool_id: d.source_tool_id,
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
    var r = window.__agEreignis({ id: ev.id, actor: ev.actor, kind: 'progress',
      title: ev.title, occurred_at: ev.occurred_at, source_evidence: ev.source_evidence,
      fictional: false });
    if (!r || !r.angenommen) { abweisen('Original wies ab: ' + (r ? r.grund : '?')); return; }
    zahl.gezeigt++;
    letztes = { id: ev.id, actor: ev.actor, title: ev.title, herkunft: ev.source_evidence,
                task_id: ev.task_id, wie: wie };
    letztesEl.textContent = 'Neu (' + wie + '): ' + ev.id + ' · ' + ev.actor + ' · ' +
      ev.title + ' · ' + (ev.source_evidence === 'reported_checkpoint'
        ? 'reported_checkpoint — gemeldet, kein Laufzeitbeleg' : 'runtime_stream') +
      ' · Aufgabe ' + ev.task_id;
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
      if (bekannte.hat(ev.id) || (basisIds && basisIds.hat(ev.id))) {
        zahl.duplikate++; vermerk('doppelt ' + ev.id); continue;
      }
      if (modus === 'basis') {
        basisIds.add(ev.id);
        var t = Date.parse(c.created_at);
        if (!isNaN(t) && t >= Z.schnitt) { spaeter.push(ev); continue; }
        zahl.basisMarkiert++;
        continue;
      }
      bekannte.add(ev.id);
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
    if (!spaeter.length) auf.open = false;   /* nach dem Verbinden: eine Zeile */
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
        seite: Z.seite, anzahl: Z.anzahl, schnitt: Z.schnittIso, intervall: Z.intervall,
        pausiert: Z.pausiert, fehler: Z.fehler, grund: letzterGrund, zahl: zahl,
        letztes: letztes, bekannteIds: bekannte.groesse(), log: log }));
    }
  });
})();
