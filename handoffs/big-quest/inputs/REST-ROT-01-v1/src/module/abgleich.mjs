// Module abgleich - sync of one device and one area over the storage interface (S12 P3a-2, US8.1 second part;
// concept 9.1, 9.2, 9.4 and 11). Test build only (module.json: bau "test", after speicher).
// No screen, no browser storage, no timer: the app calls these functions and keeps the device state itself.
//
//   device state (plain JSON, one per area; the app stores it on the device):
//     { bereich, geraet, ausgang: [entry], unterwegs: null | { nr, inhalt, anzahl }, naechsteNr, merker, wartend: [id], log: [entry] }
//     entry = { event, sig } from annahme.signEvent
//     ausgang    own entries not yet confirmed by the storage
//     unterwegs  the bundle prepared (encrypted) for the next put - kept until the storage confirms it
//     naechsteNr number of the next own bundle (numbers per device and area run 1, 2, 3 ... without gaps)
//     merker     marker of the last list (null = nothing read yet)
//     wartend    bundle ids to read again on the next holen (key version not known yet, or own bundles this
//                state did not write itself, e.g. after restoring an old backup)
//     log        all accepted entries, ordered like mergeLog (time, then id); the same id once
//   bundle (content for put): { v: 1, kv: key version, eintraege: [{ id, iv, ct }] }; each entry is one { event, sig }
//     sealed with sealEntry, additional data entryAad(area, kv, id), id = the event id.
//   keys (input):      schluessel = { aktuell: version, keys: Map version -> area key } (krypto.keysForHolder)
//   admission (input): zulassung as in annahme ({ area, members }), or a function (log + candidates) -> zulassung
//                      (module zulassung builds it from the area's own events, task P3b-2)
//
// Names: every helper starts with "abg"/"ABG_" because all modules and index.html share one scope in the app.

import { sealEntry, openEntryText, entryAad } from './krypto.mjs';
import { checkEvent, mergeLog } from './ereignisse.mjs';
import { acceptAll, ANNAHME_GRUENDE } from './annahme.mjs';

/* at most this many events per bundle (file size on GitHub) */
export const ABGLEICH_BUENDEL_MAX = 100;
/* reasons for a rejected entry: the bundle or entry cannot be read, the entry does not match its event, or annahme */
export const ABGLEICH_GRUENDE = Object.freeze(['entschluesseln', 'eintrag-passt-nicht', ...ANNAHME_GRUENDE, 'nach-entfernung']);

// Older clients advanced their school cursor even after dropping unknown evaluation events.
const ABG_SCHULE_LESESTAND = 1;
const ABG_KEYS = ['bereich', 'geraet', 'ausgang', 'unterwegs', 'naechsteNr', 'merker', 'wartend', 'log'];
const abgObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const abgStr = (x) => typeof x === 'string' && x.length > 0;
const abgClone = (x) => JSON.parse(JSON.stringify(x));
const abgCmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
function abgCanon(x) {
  if (x === null || typeof x !== 'object') return JSON.stringify(x);
  if (Array.isArray(x)) return '[' + x.map((v) => abgCanon(v === undefined ? null : v)).join(',') + ']';
  return '{' + Object.keys(x).sort().filter((k) => x[k] !== undefined).map((k) => JSON.stringify(k) + ':' + abgCanon(x[k])).join(',') + '}';
}
/* "d_a1/7" -> 7 if the bundle belongs to this device, else 0 */
function abgEigeneNr(stand, kennung) {
  const p = stand.geraet + '/';
  return typeof kennung === 'string' && kennung.startsWith(p) && /^[1-9][0-9]*$/.test(kennung.slice(p.length)) ? Number(kennung.slice(p.length)) : 0;
}
function abgFehler(text) { return new Error('abgleich: ' + text); }

function abgPruefeStand(st) {
  if (!abgObj(st) || Object.keys(st).some((k) => !ABG_KEYS.includes(k)) || !abgStr(st.bereich) || !abgStr(st.geraet) ||
      !Array.isArray(st.ausgang) || !Array.isArray(st.wartend) || !Array.isArray(st.log) ||
      !Number.isInteger(st.naechsteNr) || st.naechsteNr < 1 || !(st.merker === null || abgObj(st.merker)) ||
      !(st.unterwegs === null || (abgObj(st.unterwegs) && Number.isInteger(st.unterwegs.nr) && Number.isInteger(st.unterwegs.anzahl) && abgObj(st.unterwegs.inhalt)))) throw abgFehler('Geraetestand ungueltig.');
}
function abgPruefeSchluessel(s) {
  if (!abgObj(s) || !(s.keys instanceof Map)) throw abgFehler('schluessel braucht keys (Map Version -> Schluessel).');
}
const abgEintragOk = (x) => abgObj(x) && Object.keys(x).length === 2 && abgStr(x.sig) && checkEvent(x.event).length === 0;

/* puts entries into the log: the same id once, order and choice of variant exactly like mergeLog (every device the
   same); for the same event with different signatures the smaller signature stays (again: every device the same) */
function abgEinordnen(log, eintraege, now) {
  const alle = [...log, ...eintraege], nachInhalt = new Map();
  for (const x of alle) {
    const k = abgCanon(x.event), da = nachInhalt.get(k);
    if (!da || abgCmp(x.sig, da.sig) < 0) nachInhalt.set(k, x);
  }
  return mergeLog([alle.map((x) => x.event)], now).events.map((e) => abgClone(nachInhalt.get(abgCanon(e))));
}

/* ---------- device state ---------- */
export function abgleichStand(bereich, geraet) {
  if (!abgStr(bereich) || !abgStr(geraet)) throw abgFehler('Bereich und Geraet noetig.');
  return { bereich, geraet, ausgang: [], unterwegs: null, naechsteNr: 1, merker: null, wartend: [], log: [] };
}

/* an own, signed event: into the outbox AND into the own log (the app shows it at once, also offline).
   The same event twice changes nothing. now: clock for the order of the log (default: the real time). */
export function vormerken(stand, eintrag, { now = Date.now() } = {}) {
  abgPruefeStand(stand);
  if (!abgEintragOk(eintrag)) throw abgFehler('Eintrag ungueltig (erwartet { event, sig } aus signEvent).');
  if (eintrag.event.device !== stand.geraet) throw abgFehler('nur Ereignisse dieses Geraets vormerken.');
  if (stand.log.some((x) => x.event.id === eintrag.event.id) || stand.ausgang.some((x) => x.event.id === eintrag.event.id)) return stand;
  const kopie = abgClone(eintrag);
  stand.ausgang.push(kopie);
  stand.log = abgEinordnen(stand.log, [kopie], now);
  return stand;
}

/* ---------- send ---------- */
async function abgBuendel(bereich, eintraege, schluessel) {
  const kv = schluessel.aktuell, key = schluessel.keys.get(kv);
  if (!Number.isInteger(kv) || kv < 1 || !key) throw abgFehler('aktueller Schluessel fehlt.');
  const out = [];
  for (const x of eintraege) out.push({ id: x.event.id, ...(await sealEntry(key, JSON.stringify(x), entryAad(bereich, kv, x.event.id))) });
  return { v: 1, kv, eintraege: out };
}
/* the number of the prepared bundle is taken (by another copy of this device state, e.g. an old backup):
   never overwrite - continue with the next free number. Own bundles this state did not write go to "wartend",
   so the next holen reads them (their events are not in this log yet). */
async function abgFreieNummer(stand, zugang) {
  const { kennungen } = await zugang.list(stand.bereich, null);
  const eigene = kennungen.map((k) => abgEigeneNr(stand, k)).filter((n) => n > 0);
  const max = eigene.length ? Math.max(...eigene) : 0;
  for (const n of eigene) {
    const k = stand.geraet + '/' + n;
    if (n >= stand.naechsteNr && !stand.wartend.includes(k)) stand.wartend.push(k);
  }
  stand.unterwegs.nr = max + 1;
  stand.naechsteNr = max + 1;
}

/* sends the outbox in bundles of at most ABGLEICH_BUENDEL_MAX. A bundle is prepared once and kept as "unterwegs";
   only a confirmed put removes its entries from the outbox. "vorhanden" with the same content = it arrived before
   (the answer got lost). Throws the storage error (e.g. code "offline"); what was confirmed stays confirmed.
   -> { gesendet: number of events } */
export async function senden(stand, { zugang, schluessel } = {}) {
  abgPruefeStand(stand); abgPruefeSchluessel(schluessel);
  let gesendet = 0, neuNummer = 0;
  while (stand.unterwegs || stand.ausgang.length) {
    if (!stand.unterwegs) {
      const teil = stand.ausgang.slice(0, ABGLEICH_BUENDEL_MAX);
      stand.unterwegs = { nr: stand.naechsteNr, inhalt: await abgBuendel(stand.bereich, teil, schluessel), anzahl: teil.length };
    }
    const u = stand.unterwegs;
    try {
      await zugang.put(stand.bereich, stand.geraet, { nr: u.nr, inhalt: u.inhalt });
    } catch (err) {
      const code = err && err.code;
      if (!(code === 'vorhanden' && err.gleicherInhalt === true)) {
        if ((code === 'vorhanden' || code === 'luecke') && neuNummer++ < 5) { await abgFreieNummer(stand, zugang); continue; }
        throw err;
      }
    }
    stand.ausgang.splice(0, u.anzahl);
    stand.naechsteNr = Math.max(stand.naechsteNr, u.nr + 1);
    stand.unterwegs = null;
    gesendet += u.anzahl;
  }
  return { gesendet };
}

/* ---------- fetch ---------- */
/* lists from the marker plus "wartend", reads, decrypts, checks with annahme and puts the accepted entries into the
   log. Nothing is dropped silently: every entry is either accepted or reported in "verworfen" with a reason; a bad
   entry never costs the other entries of its bundle. Bundles with an unknown key version go to "wartend" (the marker
   may move on). Everything is read first and written to the state in one step: an error (e.g. "offline") leaves
   the state unchanged. -> { neu, verworfen: [{ kennung, id, grund }], wartend: [kennung] } */
export async function holen(stand, { zugang, schluessel, zulassung, now } = {}) {
  abgPruefeStand(stand); abgPruefeSchluessel(schluessel);
  if (now === undefined || now === null) throw abgFehler('"now" fehlt.');
  const { bereich } = stand;
  const schule = bereich.startsWith('schule:');
  const neuLesen = schule && stand.merker !== null && stand.merker.schuleLesestand !== ABG_SCHULE_LESESTAND;
  const r = await zugang.list(bereich, neuLesen ? null : stand.merker);
  const ids = [];
  for (const k of [...stand.wartend, ...r.kennungen]) {
    const nr = abgEigeneNr(stand, k);
    if (!neuLesen && nr > 0 && nr < stand.naechsteNr && !stand.wartend.includes(k)) continue;   // own bundle, already in the log
    if (!ids.includes(k)) ids.push(k);
  }
  const gelesen = [];
  for (const k of ids) gelesen.push({ kennung: k, inhalt: await zugang.get(bereich, k) });

  const wartend = [], verworfen = [], kandidaten = new Map();   // item -> { kennung, id }
  for (const { kennung, inhalt } of gelesen) {
    const b = inhalt;
    if (!abgObj(b) || b.v !== 1 || !Number.isInteger(b.kv) || b.kv < 1 || !Array.isArray(b.eintraege)) { verworfen.push({ kennung, id: null, grund: 'format' }); continue; }
    const key = schluessel.keys.get(b.kv);
    if (!key) { wartend.push(kennung); continue; }
    for (const x of b.eintraege) {
      const id = abgObj(x) && abgStr(x.id) ? x.id : null;
      if (!id || !abgStr(x.iv) || !abgStr(x.ct)) { verworfen.push({ kennung, id, grund: 'format' }); continue; }
      let text;
      try { text = await openEntryText(key, { iv: x.iv, ct: x.ct }, entryAad(bereich, b.kv, id)); } catch (e) { verworfen.push({ kennung, id, grund: 'entschluesseln' }); continue; }
      let item;
      try { item = JSON.parse(text); } catch (e) { verworfen.push({ kennung, id, grund: 'format' }); continue; }
      if (abgObj(item) && abgObj(item.event) && item.event.id !== id) { verworfen.push({ kennung, id, grund: 'eintrag-passt-nicht' }); continue; }
      kandidaten.set(item, { kennung, id, kv: b.kv });
    }
  }
  // the admission may also be a function (module zulassung, task P3b-2): it gets the log and the decrypted, well-formed
  // candidates and builds the admission from the area's own events - members added in this very fetch count, too
  const z = typeof zulassung === 'function' ? await zulassung([...stand.log, ...[...kandidaten.keys()].filter((x) => abgEintragOk(x))]) : zulassung;
  const pruefung = await acceptAll([...kandidaten.keys()], z);
  const ohneKv = (m) => ({ kennung: m.kennung, id: m.id });
  // typ (task "Neuer Schluessel"): the type of a dropped, readable event - a forged key change (member_added) is shown
  // to the parents as a warning
  const typ = (item) => (abgObj(item) && abgObj(item.event) && typeof item.event.type === 'string' ? { typ: item.event.type } : {});
  for (const v of pruefung.verworfen) verworfen.push({ ...ohneKv(kandidaten.get(v.item)), grund: v.grund, ...typ(v.item) });
  // task P3b-2b: after a key change, a bundle of a person removed by it, with an older key version and a number beyond
  // the stand of the change (bundles per device when the key changed), is dropped - whatever time its events carry,
  // because a removed holder could backdate them. Later bundles with the new version (he was admitted again) count.
  // Task "Neuer Schluessel": the same for a person whose keys were renewed (erneuert) - his old keys may be in other hands.
  const wechsel = [...stand.log, ...pruefung.angenommen].filter((x) => abgObj(x) && abgObj(x.event) && x.event.type === 'key_rotated').map((x) => x.event.payload);
  const angenommen = [];
  for (const x of pruefung.angenommen) {
    const m = kandidaten.get(x), [dev, nrText] = m.kennung.split('/'), nr = Number(nrText);
    const betroffen = (w) => w.entfernt.includes(x.event.author) || (Array.isArray(w.erneuert) && w.erneuert.includes(x.event.author));
    const bis = (w, d) => (Object.prototype.hasOwnProperty.call(w.stand, d) ? w.stand[d] : 0);
    const zuSpaet = wechsel.some((w) => m.kv < w.version && betroffen(w) && nr > bis(w, dev));
    // task "Meine Geraete": an event of a removed device counts only from its own bundles up to the stand of the change -
    // the device may still hold the key (a child's device until the new password), so the version does not tell
    const vomEntfernten = wechsel.some((w) => Array.isArray(w.geraete) && w.geraete.includes(x.event.device) && (dev !== x.event.device || nr > bis(w, dev)));
    if (zuSpaet || vomEntfernten) verworfen.push({ ...ohneKv(m), grund: 'nach-entfernung', ...typ(x) });
    else if (abgEintragOk(x)) angenommen.push({ event: x.event, sig: x.sig });
  }

  // one step: from here on nothing can fail half-way
  const vorher = new Set(stand.log.map((x) => x.event.id));
  const neu = new Set(angenommen.map((x) => x.event.id).filter((id) => !vorher.has(id))).size;
  stand.log = abgEinordnen(stand.log, angenommen, now);
  stand.merker = abgClone(r.merker);
  if (schule) stand.merker.schuleLesestand = ABG_SCHULE_LESESTAND;
  stand.wartend = wartend;
  for (const k of r.kennungen) { const nr = abgEigeneNr(stand, k); if (nr >= stand.naechsteNr) stand.naechsteNr = nr + 1; }
  return { neu, verworfen, wartend: wartend.slice() };
}

/* ---------- both ---------- */
/* first senden, then holen - concept 9.1: read right after sending. A storage error (err.code, e.g. "offline") is
   not thrown but reported: { ok: false, fehler }. -> { ok, fehler, gesendet, neu, verworfen, wartend } */
export async function abgleichen(stand, opts = {}) {
  abgPruefeStand(stand);
  const vorher = stand.ausgang.length;
  try {
    await senden(stand, opts);
    const h = await holen(stand, opts);
    return { ok: true, fehler: null, gesendet: vorher - stand.ausgang.length, ...h };
  } catch (err) {
    if (!err || typeof err.code !== 'string') throw err;
    return { ok: false, fehler: err.code, gesendet: vorher - stand.ausgang.length, neu: 0, verworfen: [], wartend: stand.wartend.slice() };
  }
}
