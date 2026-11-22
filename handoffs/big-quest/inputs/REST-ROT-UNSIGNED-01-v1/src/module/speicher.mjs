// Module speicher - the storage interface (concept 11) and the simulated local storage (S12 P3a, US8.1).
// Test build only (module.json: bau "test"). No network, no browser storage: the simulation lives in memory.
//
// Every implementation (simulation now, GitHub in P4, iCloud in stage 3) hands out one access per device:
//   store.geraet(deviceId) -> access
// The access offers exactly these functions (all async; contents are opaque to the storage - encrypted bundles as JSON):
//   put(area, device, bundle)        bundle = { nr, inhalt }; id = device + "/" + nr. A device writes only its own bundles.
//                                     Numbers run 1, 2, 3 ... per device and area without gaps. A number that exists -> error
//                                     "vorhanden" (never overwritten; err.gleicherInhalt tells whether it was the same content).
//   list(area, seit)                 -> { kennungen, merker }: bundle ids after "seit" (the marker returned by the last list;
//                                     null = from the start). Order: device id, then number. Own bundles are listed too.
//                                     The marker is plain JSON (to be kept on the device) and belongs to one area.
//   get(area, id)                    -> exactly the stored content
//   keys(area) / putKey(area, holder, wrapped)   -> { holder: wrapped } / store; replaces the entry of this holder
//   directory(lookup) / putDirectory(entry)      account entry for a hash of the login name (entry.lookup); creating the
//                                     same lookup twice -> "vorhanden"; unknown lookup -> null
//   invite.put(id, content, options) / invite.get(id) / invite.delete(id)
//                                     an invitation is valid 7 days after put (Peter, 04.11.: not 10 minutes - the
//                                     fingerprint protects, not the time) - or options.gueltigMs (1 ms up to 7 days); get
//                                     hands it out once (second use -> "unbekannt"); expired -> "abgelaufen"; delete ->
//                                     gone (returns whether it existed): the issuer withdraws an invitation with it
//   exportFile(area)                 -> text of a file with all bundles of the area (format below, same for all implementations)
//   importFile(text)                 stores only what is missing -> { neu, gleich, abweichend }; nothing is overwritten;
//                                     a file that would leave a gap is refused as a whole ("ungueltig")
//   removeArea(area)                 deletes the whole area: every bundle of every device and every key entry
//                                     -> { buendel, schluessel } (counts; 0/0 when there was nothing). Task "Export und
//                                     Loeschen" (EP12, US12.2, E8): deleting a child or an account. Afterwards the area
//                                     is empty like one that never existed (a later put starts at number 1 again).
//   removeDirectory(lookup)          deletes one account entry -> true, or false when there was none
//   Deleting removes the current state only: a storage with a history (GitHub: git) keeps old, encrypted copies -
//   without the keys they cannot be read (docs/endgueltig-loeschen.md: how to remove them for good).
// Errors are Error objects with err.code (one of SPEICHER_FEHLER).
// The simulation adds access.offline() / access.online(): offline every call fails with "offline" and changes nothing.
//
// Names: every helper starts with "spk"/"SPK_" because all modules and index.html share one scope in the app.

/* the functions every implementation offers (dot = function of a group) */
export const SPEICHER_FUNKTIONEN = Object.freeze(['put', 'list', 'get', 'keys', 'putKey', 'directory', 'putDirectory', 'invite.put', 'invite.get', 'invite.delete', 'exportFile', 'importFile', 'removeArea', 'removeDirectory']);
/* error codes ("zugang" and "limit" only come from a real storage: module github, stage 3a) */
export const SPEICHER_FEHLER = Object.freeze(['offline', 'ungueltig', 'fremdes-geraet', 'vorhanden', 'luecke', 'unbekannt', 'abgelaufen', 'zugang', 'limit']);
/* an invitation is valid this long (Peter, 04.11.: 7 days, once, can be withdrawn - task "Einladungen"; before 10 minutes) */
export const SPEICHER_EINLADUNG_MS = 7 * 24 * 3600 * 1000;
/* the longest an invitation may be valid (invite.put options.gueltigMs): 7 days (concept 10.6, 12) */
export const SPEICHER_EINLADUNG_MAX_MS = 7 * 24 * 3600 * 1000;
/* options of invite.put -> validity in ms (shared by every implementation); wrong options -> null */
export function speicherEinladungGueltig(optionen) {
  if (optionen === undefined) return SPEICHER_EINLADUNG_MS;
  if (optionen === null || typeof optionen !== 'object' || Array.isArray(optionen) || Object.keys(optionen).some((k) => k !== 'gueltigMs')) return null;
  if (optionen.gueltigMs === undefined) return SPEICHER_EINLADUNG_MS;
  const g = optionen.gueltigMs;
  return Number.isInteger(g) && g >= 1 && g <= SPEICHER_EINLADUNG_MAX_MS ? g : null;
}
/* file format of exportFile / importFile */
export const SPEICHER_DATEI_FORMAT = 'bq-buendel-datei';

const SPK_ID = /^[A-Za-z][A-Za-z0-9_:-]{0,127}$/;          // area, device, holder, lookup, invitation: no "/", no "..", no "__proto__"
const SPK_KENNUNG = /^([A-Za-z][A-Za-z0-9_:-]{0,127})\/([1-9][0-9]{0,8})$/;

function spkFehler(code, extra) {
  const e = new Error('speicher: ' + code);
  e.code = code;
  if (extra) Object.assign(e, extra);
  return e;
}
const spkObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const spkNr = (n) => Number.isInteger(n) && n >= 1 && n <= 999999999;
function spkId(x) {
  if (typeof x !== 'string' || !SPK_ID.test(x)) throw spkFehler('ungueltig');
  return x;
}
/* content -> stored text (a copy: later changes of the caller do not reach the storage) */
function spkText(x) {
  let t;
  try { t = JSON.stringify(x); } catch { t = undefined; }
  if (typeof t !== 'string') throw spkFehler('ungueltig');
  return t;
}
const spkSortiert = (keys) => [...keys].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

/* ---------- the simulation ---------- */
/* now: clock in milliseconds (tests set it, nobody waits) */
export function lokalerSpeicher({ now = () => Date.now() } = {}) {
  const buendel = new Map();      // area -> Map(device -> [text of nr 1, nr 2, ...])
  const schluessel = new Map();   // area -> Map(holder -> text)
  const verzeichnis = new Map();  // lookup -> text
  const einladungen = new Map();  // id -> { text, angelegt, gueltig }

  const geraeteVon = (bereich) => buendel.get(bereich) || new Map();
  function reiheVon(bereich, geraet, anlegen) {
    if (!buendel.has(bereich)) { if (!anlegen) return []; buendel.set(bereich, new Map()); }
    const b = buendel.get(bereich);
    if (!b.has(geraet)) { if (!anlegen) return []; b.set(geraet, []); }
    return b.get(geraet);
  }

  function put(eigenes, bereich, geraet, b) {
    spkId(bereich); spkId(geraet);
    if (geraet !== eigenes) throw spkFehler('fremdes-geraet');
    if (!spkObj(b) || Object.keys(b).some((k) => k !== 'nr' && k !== 'inhalt') || !spkNr(b.nr)) throw spkFehler('ungueltig');
    const text = spkText(b.inhalt);
    const reihe = reiheVon(bereich, geraet, false);
    if (b.nr <= reihe.length) throw spkFehler('vorhanden', { gleicherInhalt: reihe[b.nr - 1] === text });
    if (b.nr !== reihe.length + 1) throw spkFehler('luecke');
    reiheVon(bereich, geraet, true).push(text);
    return geraet + '/' + b.nr;
  }

  function list(bereich, seit) {
    spkId(bereich);
    const stand = {};
    if (seit !== null && seit !== undefined) {
      if (!spkObj(seit) || seit.bereich !== bereich || !spkObj(seit.stand)) throw spkFehler('ungueltig');
      for (const [g, n] of Object.entries(seit.stand)) {
        if (!SPK_ID.test(g) || !Number.isInteger(n) || n < 0 || n > reiheVon(bereich, g, false).length) throw spkFehler('ungueltig');
        stand[g] = n;
      }
    }
    const kennungen = [], neu = {};
    const geraete = geraeteVon(bereich);
    for (const g of spkSortiert(geraete.keys())) {
      const anzahl = geraete.get(g).length;
      for (let nr = (stand[g] || 0) + 1; nr <= anzahl; nr++) kennungen.push(g + '/' + nr);
      neu[g] = anzahl;
    }
    return { kennungen, merker: { bereich, stand: neu } };
  }

  function get(bereich, kennung) {
    spkId(bereich);
    const m = typeof kennung === 'string' ? SPK_KENNUNG.exec(kennung) : null;
    if (!m) throw spkFehler('ungueltig');
    const reihe = reiheVon(bereich, m[1], false), nr = Number(m[2]);
    if (nr > reihe.length) throw spkFehler('unbekannt');
    return JSON.parse(reihe[nr - 1]);
  }

  function keys(bereich) {
    spkId(bereich);
    const s = schluessel.get(bereich) || new Map(), out = {};
    for (const h of spkSortiert(s.keys())) out[h] = JSON.parse(s.get(h));
    return out;
  }
  function putKey(bereich, halter, verpackt) {
    spkId(bereich); spkId(halter);
    const text = spkText(verpackt);
    if (!schluessel.has(bereich)) schluessel.set(bereich, new Map());
    schluessel.get(bereich).set(halter, text);
  }

  function directory(lookup) {
    spkId(lookup);
    return verzeichnis.has(lookup) ? JSON.parse(verzeichnis.get(lookup)) : null;
  }
  function putDirectory(eintrag) {
    if (!spkObj(eintrag)) throw spkFehler('ungueltig');
    spkId(eintrag.lookup);
    const text = spkText(eintrag);
    if (verzeichnis.has(eintrag.lookup)) throw spkFehler('vorhanden');
    verzeichnis.set(eintrag.lookup, text);
  }

  const invite = {
    put(kennung, inhalt, optionen) {
      spkId(kennung);
      const text = spkText(inhalt), gueltig = speicherEinladungGueltig(optionen);
      if (gueltig === null) throw spkFehler('ungueltig');
      if (einladungen.has(kennung)) throw spkFehler('vorhanden');
      einladungen.set(kennung, { text, angelegt: now(), gueltig });
    },
    get(kennung) {
      spkId(kennung);
      const e = einladungen.get(kennung);
      if (!e) throw spkFehler('unbekannt');
      if (now() - e.angelegt >= e.gueltig) throw spkFehler('abgelaufen');
      einladungen.delete(kennung);                // handed out once
      return JSON.parse(e.text);
    },
    delete(kennung) {
      spkId(kennung);
      return einladungen.delete(kennung);
    },
  };

  function exportFile(bereich) {
    spkId(bereich);
    const geraete = geraeteVon(bereich), liste = [];
    for (const g of spkSortiert(geraete.keys())) geraete.get(g).forEach((t, i) => liste.push({ geraet: g, nr: i + 1, inhalt: JSON.parse(t) }));
    return JSON.stringify({ format: SPEICHER_DATEI_FORMAT, v: 1, bereich, buendel: liste });
  }

  function importFile(datei) {
    let d;
    try { d = JSON.parse(datei); } catch { throw spkFehler('ungueltig'); }
    if (typeof datei !== 'string' || !spkObj(d) || d.format !== SPEICHER_DATEI_FORMAT || d.v !== 1 || !Array.isArray(d.buendel)) throw spkFehler('ungueltig');
    const bereich = spkId(d.bereich);
    // plan everything first, write afterwards: a refused file changes nothing
    const neu = new Map(), gesehen = new Set();
    let gleich = 0, abweichend = 0;
    for (const b of d.buendel) {
      if (!spkObj(b) || Object.keys(b).some((k) => k !== 'geraet' && k !== 'nr' && k !== 'inhalt') || !spkNr(b.nr)) throw spkFehler('ungueltig');
      spkId(b.geraet);
      const k = b.geraet + '/' + b.nr;
      if (gesehen.has(k)) throw spkFehler('ungueltig');
      gesehen.add(k);
      const text = spkText(b.inhalt), reihe = reiheVon(bereich, b.geraet, false);
      if (b.nr <= reihe.length) { if (reihe[b.nr - 1] === text) gleich++; else abweichend++; continue; }
      if (!neu.has(b.geraet)) neu.set(b.geraet, []);
      neu.get(b.geraet).push({ nr: b.nr, text });
    }
    for (const [g, liste] of neu) {
      liste.sort((a, b) => a.nr - b.nr);
      const start = reiheVon(bereich, g, false).length;
      if (liste.some((x, i) => x.nr !== start + i + 1)) throw spkFehler('ungueltig');
    }
    let n = 0;
    for (const [g, liste] of neu) for (const x of liste) { reiheVon(bereich, g, true).push(x.text); n++; }
    return { neu: n, gleich, abweichend };
  }

  function removeArea(bereich) {
    spkId(bereich);
    let n = 0;
    for (const reihe of geraeteVon(bereich).values()) n += reihe.length;
    const k = schluessel.has(bereich) ? schluessel.get(bereich).size : 0;
    buendel.delete(bereich);
    schluessel.delete(bereich);
    return { buendel: n, schluessel: k };
  }
  function removeDirectory(lookup) {
    spkId(lookup);
    return verzeichnis.delete(lookup);
  }

  function geraet(name) {
    spkId(name);
    let online = true;
    // every call: first the offline check, then the work in one step (no await in between -> nothing half written)
    const z = (fn) => async (...a) => { if (!online) throw spkFehler('offline'); return fn(...a); };
    return {
      geraet: name,
      put: z((bereich, g, b) => put(name, bereich, g, b)),
      list: z(list), get: z(get), keys: z(keys), putKey: z(putKey),
      directory: z(directory), putDirectory: z(putDirectory),
      invite: { put: z(invite.put), get: z(invite.get), delete: z(invite.delete) },
      exportFile: z(exportFile), importFile: z(importFile),
      removeArea: z(removeArea), removeDirectory: z(removeDirectory),
      offline() { online = false; },
      online() { online = true; },
    };
  }

  return { geraet };
}
