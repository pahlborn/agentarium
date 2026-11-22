// Module einladung - invitations and connections without a screen (stage 3b, task "Einladungen"; US9.5, US9.6, US8.3,
// US6.5; concept 4, 5.1, 8.2, 8.3). Test build only (module.json: bau "test", after konto). No screen, no timer, no clock,
// no network of its own: device storage, storage access, opened accounts and time are passed in.
//
//   Order (Peter, 04.11.): the first parent (start code from the admin) founds the family -> children (created by a parent)
//   and the second parent (invited by a parent) in any order. Every invitation is a start code (module konto): valid
//   7 days, once, can be withdrawn; its QR code carries the issuer's fingerprint.
//
//   Where it is kept (events, module ereignisse; synced by module geraeteabgleich):
//     person:<id>    anchor_set  where I belong: a parent -> the founding parent of his family ("family"), a child ->
//                                the parent who created it ("child", the anchor of its areas)
//                    invite_set  the invitations I gave out, with the key of their proof (konto.kontoBeweisPruefen)
//     familie:<id>   family_set  every child and parent of the family with checked keys (written by a parent) - so both
//                                parents see the same children, on every device
//   Checking keys (US6.5): an invited person's keys count only when their directory entry carries the proof of the
//   start code (beweis); a swapped entry -> warning, nothing is noted, so nothing is wrapped for it. A parent notes every
//   other parent of the family he knows (family_set): that note, signed by a child's anchor, is the buergschaft another
//   parent needs to give that child a new password (konto.neustartAusstellen).
//
//   abgleichMitVerbindungen = what the app calls instead of geraetAbgleichen: it builds families, children and directory
//   from the logs, syncs, checks open invitations, and syncs again while something new came (at most 4 rounds).
//   After writing into the app's logs the app calls evNeuLaden() (as after geraetAbgleichen).
//
// Errors: Error with err.code - one of EINLADUNG_FEHLER, or a code of module konto or of the storage.
// Names: every helper starts with "eld"/"ELD_" because all modules and index.html share one scope in the app.

import { newEvent, lastWins } from './ereignisse.mjs';
import { bereichName } from './bereiche.mjs';
import { geraetAbgleichen, GERAETEABGLEICH_SPEICHER } from './geraeteabgleich.mjs';
import { startcodeAusstellen, neustartAusstellen, kontoBeweisPruefen, kontoLookup, kontoName, kontoPersonen, kontoStand, kontoFingerabdruck } from './konto.mjs';

/* error codes of this module */
export const EINLADUNG_FEHLER = Object.freeze(['nicht-erlaubt', 'familie-fehlt', 'kind-unbekannt', 'buergschaft-fehlt', 'name-ungueltig']);
/* at most this many rounds of sync per call (sync -> new children/keys -> sync again) */
export const EINLADUNG_RUNDEN = 4;

const eldObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const eldPid = (x) => typeof x === 'string' && /^p_[0-9A-Za-z]{1,40}$/.test(x);
const eldGleichePub = (a, b) => eldObj(a) && eldObj(b) && a.ecdh === b.ecdh && a.ecdsa === b.ecdsa;
const eldRand = (n) => globalThis.crypto.getRandomValues(new Uint8Array(n));
function eldFehler(code) { const e = new Error('einladung: ' + code); e.code = code; return e; }
function eldFalsch(text) { return new Error('einladung: ' + text); }
function eldJson(ablage, k, d) {
  const v = ablage.getItem(k);
  if (v === null || v === undefined) return d;
  try { return JSON.parse(v); } catch (e) { return d; }
}
function eldPruefen({ ablage, konto, now }) {
  if (!eldObj(ablage) || typeof ablage.getItem !== 'function' || typeof ablage.setItem !== 'function') throw eldFalsch('ablage (getItem/setItem) fehlt.');
  if (!eldObj(konto) || !eldPid(konto.kennung) || typeof konto.art !== 'string' || !eldObj(konto.pub)) throw eldFalsch('geoeffnetes Konto erwartet.');
  if (!Number.isFinite(now)) throw eldFalsch('"now" fehlt.');
}
const eldPre = (kind) => 'bq2_' + kind + '__';

/* ---------- the app's logs ---------- */
/* a log of the app: { lesen, schreiben }; ziel = { person } | { familie } | { kind } */
function eldLog(ablage, ziel) {
  if (ziel.kind) {
    const k = eldPre(ziel.kind) + 'events';
    return { lesen: () => { const l = eldJson(ablage, k, []); return Array.isArray(l) ? l : []; }, schreiben: (l) => ablage.setItem(k, JSON.stringify(l)) };
  }
  const [K, id] = ziel.familie ? [GERAETEABGLEICH_SPEICHER.familien, ziel.familie] : [GERAETEABGLEICH_SPEICHER.personen, ziel.person];
  return {
    lesen: () => { const l = eldJson(ablage, K, {})[id]; return Array.isArray(l) ? l : []; },
    schreiben: (l) => { const alle = eldJson(ablage, K, {}); alle[id] = l; ablage.setItem(K, JSON.stringify(alle)); },
  };
}
/* appends an event of this person on this device; its time is after every event of that log (a later event of the
   same call never ties with an earlier one - "last wins" decides by time) */
function eldSchreiben(ablage, ziel, konto, type, payload, now) {
  const geraet = eldJson(ablage, GERAETEABGLEICH_SPEICHER.geraet, null);
  if (typeof geraet !== 'string' || !/^d_[0-9A-Za-z]{1,40}$/.test(geraet)) throw eldFalsch('Geraet ohne Kennung (bq2_evDevice).');
  const log = eldLog(ablage, ziel), l = log.lesen();
  let t = now;
  for (const e of l) { const x = eldObj(e) ? Date.parse(e.at) : NaN; if (Number.isFinite(x) && x >= t) t = x + 1; }
  const e = newEvent({ type, author: konto.kennung, device: geraet, at: new Date(t).toISOString(), payload });
  log.schreiben(l.concat([e]));
  return e;
}
/* the winning event per field of one type in a log */
function eldGewinner(log, type, now) {
  return Object.values(lastWins(log.filter((e) => eldObj(e) && e.type === type), now));
}

/* ---------- connections ---------- */
/* what this account is connected to, from its own log and the log of its family:
   -> { familien: [{ id, anker }], kinder: [{ id, pre, anker, name }], verzeichnis: { <pid>: { role, pub, stand? } },
        eltern: [pid], offen: [invite_set payload], familie: id | null, entfernt: [{ person, role }] } - familien, kinder
   and verzeichnis go into geraetAbgleichen as they are. Task "Export und Loeschen": a member whose newest family_set
   says removed (a deleted child, a parent who deleted his account) is left out everywhere and listed in "entfernt" -
   also the founding parent (the family keeps his id and his anchor: the history stays signed by him). */
export function verbindungen({ ablage, konto, now } = {}) {
  eldPruefen({ ablage, konto, now });
  const out = { familien: [], kinder: [], verzeichnis: {}, eltern: [], offen: [], familie: null, entfernt: [] };
  const eigen = eldLog(ablage, { person: konto.kennung }).lesen();
  const anker = Object.fromEntries(eldGewinner(eigen, 'anchor_set', now).filter((e) => e.author === konto.kennung).map((e) => [e.payload.kind, e.payload]));
  out.offen = eldGewinner(eigen, 'invite_set', now).filter((e) => e.author === konto.kennung && e.payload.state === 'open').map((e) => ({ ...e.payload }));
  if (konto.art === 'child' && anker.child) {
    out.kinder.push({ id: konto.kennung, pre: eldPre(konto.kennung), anker: { person: anker.child.person, role: 'parent', pub: { ...anker.child.pub } }, name: konto.anmeldename || null });
  }
  if (konto.art === 'parent' && anker.family) {
    const f = anker.family;
    out.familie = f.person;
    out.familien.push({ id: f.person, anker: { person: f.person, role: 'parent', pub: { ...f.pub } } });
    const gewinner = eldGewinner(eldLog(ablage, { familie: f.person }).lesen(), 'family_set', now);
    for (const e of gewinner) if (e.payload.removed === true) out.entfernt.push({ person: e.payload.person, role: e.payload.role });
    const weg = new Set(out.entfernt.map((x) => x.person));
    if (!weg.has(f.person)) out.verzeichnis[f.person] = { role: 'parent', pub: { ...f.pub } };
    for (const e of gewinner) {
      const p = e.payload;
      if (p.person === f.person || weg.has(p.person)) continue;          // the founding parent: his keys come with the anchor
      out.verzeichnis[p.person] = { role: p.role, pub: { ...p.pub }, ...(p.stand > 1 ? { stand: p.stand } : {}) };
      if (p.role === 'child' && eldPid(p.anchor) && eldObj(p.anchorPub)) out.kinder.push({ id: p.person, pre: eldPre(p.person), anker: { person: p.anchor, role: 'parent', pub: { ...p.anchorPub } }, name: p.name || null });
    }
    out.eltern = Object.keys(out.verzeichnis).filter((pid) => out.verzeichnis[pid].role === 'parent').sort();
    out.kinder.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    out.entfernt.sort((a, b) => (a.person < b.person ? -1 : a.person > b.person ? 1 : 0));
  }
  return out;
}

/* ---------- a deleted child on this device (task "Export und Loeschen", US12.2) ---------- */
/* removes what this device holds of a child: the device state of its areas (bq_abgleich: kind:*, schule, eltern:allg,
   the areas of its grants, person:<child>), what was dropped there (bq_abgleichVerworfen), devices noted for removal,
   and the app's data of the child (every key "bq2_<child>__..."; the storage handed in must offer key(i)/length and
   removeItem, like the browser storage - otherwise only the log is emptied).
   -> { bereiche: [area], schluessel: number of app keys removed } */
export function kindLokalEntfernen({ ablage, kind } = {}) {
  if (!eldObj(ablage) || typeof ablage.getItem !== 'function' || typeof ablage.setItem !== 'function') throw eldFalsch('ablage (getItem/setItem) fehlt.');
  if (!eldPid(kind)) throw eldFalsch('kind fehlt.');
  const pre = eldPre(kind);
  const log = eldLog(ablage, { kind });
  const grants = new Set(log.lesen().filter((e) => eldObj(e) && eldObj(e.payload) && /^grant_/.test(e.type) && typeof e.payload.grant === 'string').map((e) => e.payload.grant));
  const staende = eldJson(ablage, GERAETEABGLEICH_SPEICHER.staende, {});
  const st = eldObj(staende) ? staende : {};
  // the grants this device was told of, also from the device state (a parent's log may have lost them already)
  for (const [area, s] of Object.entries(st)) {
    if (!/^kind:lern:|^eltern:allg:/.test(area) || !area.endsWith(':' + kind) || !eldObj(s) || !Array.isArray(s.log)) continue;
    for (const x of s.log) if (eldObj(x) && eldObj(x.event) && eldObj(x.event.payload) && /^grant_/.test(x.event.type)) grants.add(x.event.payload.grant);
  }
  const bereiche = ['kind:lern', 'kind:privat', 'schule', 'eltern:allg', 'person'].map((a) => bereichName(a, kind));
  for (const g of grants) { try { bereiche.push(bereichName('freigabe', g)); } catch (e) { /* not a grant id */ } }
  const weg = bereiche.filter((a) => Object.prototype.hasOwnProperty.call(st, a));
  for (const a of weg) delete st[a];
  if (weg.length) ablage.setItem(GERAETEABGLEICH_SPEICHER.staende, JSON.stringify(st));
  const verworfen = eldJson(ablage, GERAETEABGLEICH_SPEICHER.verworfen, null);
  if (Array.isArray(verworfen)) ablage.setItem(GERAETEABGLEICH_SPEICHER.verworfen, JSON.stringify(verworfen.filter((v) => !(eldObj(v) && bereiche.includes(v.bereich)))));
  const entfernen = eldJson(ablage, GERAETEABGLEICH_SPEICHER.entfernen, null);
  if (Array.isArray(entfernen)) ablage.setItem(GERAETEABGLEICH_SPEICHER.entfernen, JSON.stringify(entfernen.filter((x) => !(eldObj(x) && x.person === kind))));
  let schluessel = 0;
  if (typeof ablage.removeItem === 'function' && typeof ablage.key === 'function' && Number.isInteger(ablage.length)) {
    const k = [];
    for (let i = 0; i < ablage.length; i++) { const n = ablage.key(i); if (typeof n === 'string' && n.startsWith(pre)) k.push(n); }
    for (const n of k) { ablage.removeItem(n); schluessel++; }
  } else if (ablage.getItem(pre + 'events') !== null) { log.schreiben([]); schluessel++; }
  return { bereiche: weg, schluessel };
}

/* ---------- a parent left the family (task "Konto loeschen - andere Geraete", follow-up of "Familienfassung bauen") ---------- */
/* did this parent take himself out of his family on ANOTHER device (kontoDatenLoeschen with another parent staying:
   family_set removed about himself, written by himself)? Only his own entry counts - another parent's entry about him
   does not make his devices drop the children. An entry of this very device does not count: that is the deleting call
   itself, which still has to send it (and may fail offline - then nothing leaves this device). A parent without a family
   here -> false. */
export function elternAusgetreten({ ablage, konto, now } = {}) {
  eldPruefen({ ablage, konto, now });
  if (konto.art !== 'parent') return false;
  const v = verbindungen({ ablage, konto, now });
  if (!v.familie) return false;
  const dieses = eldJson(ablage, GERAETEABGLEICH_SPEICHER.geraet, null);
  return eldGewinner(eldLog(ablage, { familie: v.familie }).lesen(), 'family_set', now)
    .some((e) => e.payload.removed === true && e.payload.person === konto.kennung && e.author === konto.kennung && e.device !== dieses);
}

/* what a parent who left the family keeps on this device - nothing: every child of the family (as kindLokalEntfernen:
   device state, what was dropped, the app's data of the child), the family area (device state, log, what was dropped) and
   his own area (device state, log, devices noted for removal). The account itself (key copy, device list, sessions,
   recordings) the app drops on its own (kontoLokalWeg). behalten = { kinder: [id], familien: [id] } - what another
   account on this device still needs stays (a child's own device with the parent logged in).
   -> { kinder: [id with something removed], familie: id | null, bereiche: [area] } */
export function elternLokalEntfernen({ ablage, konto, now, behalten = {} } = {}) {
  eldPruefen({ ablage, konto, now });
  const v = verbindungen({ ablage, konto, now });
  const bleibenK = new Set(Array.isArray(behalten.kinder) ? behalten.kinder : []), bleibenF = new Set(Array.isArray(behalten.familien) ? behalten.familien : []);
  // the children of the family and the ones taken out earlier (a child of another family on this device is not touched)
  const kinder = new Set([...v.kinder.map((c) => c.id), ...v.entfernt.filter((x) => x.role === 'child').map((x) => x.person)]);
  const out = { kinder: [], familie: null, bereiche: [] };
  for (const kind of [...kinder].sort()) {
    if (bleibenK.has(kind)) continue;
    const r = kindLokalEntfernen({ ablage, kind });
    if (r.bereiche.length || r.schluessel) { out.kinder.push(kind); out.bereiche.push(...r.bereiche); }
  }
  const alle = [bereichName('person', konto.kennung)];
  if (v.familie && !bleibenF.has(v.familie)) { out.familie = v.familie; alle.push(bereichName('familie', v.familie)); }
  const st = eldJson(ablage, GERAETEABGLEICH_SPEICHER.staende, {});
  if (eldObj(st)) {
    const weg = alle.filter((a) => Object.prototype.hasOwnProperty.call(st, a));
    for (const a of weg) delete st[a];
    if (weg.length) { ablage.setItem(GERAETEABGLEICH_SPEICHER.staende, JSON.stringify(st)); out.bereiche.push(...weg); }
  }
  const ohne = (k, id) => { const o = eldJson(ablage, k, null); if (eldObj(o) && Object.prototype.hasOwnProperty.call(o, id)) { delete o[id]; ablage.setItem(k, JSON.stringify(o)); } };
  ohne(GERAETEABGLEICH_SPEICHER.personen, konto.kennung);
  if (out.familie) ohne(GERAETEABGLEICH_SPEICHER.familien, out.familie);
  const verworfen = eldJson(ablage, GERAETEABGLEICH_SPEICHER.verworfen, null);
  if (Array.isArray(verworfen)) {
    const n = verworfen.filter((x) => !(eldObj(x) && alle.includes(x.bereich)));
    if (n.length !== verworfen.length) ablage.setItem(GERAETEABGLEICH_SPEICHER.verworfen, JSON.stringify(n));
  }
  const entfernen = eldJson(ablage, GERAETEABGLEICH_SPEICHER.entfernen, null);
  if (Array.isArray(entfernen)) ablage.setItem(GERAETEABGLEICH_SPEICHER.entfernen, JSON.stringify(entfernen.filter((x) => !(eldObj(x) && x.person === konto.kennung))));
  return out;
}

/* ---------- after the first login ---------- */
/* notes where a new account belongs - only for the result of konto.ersteAnmeldung (it carries anker/familie; an account
   from konto.anmelden finds this in its own area): a child -> its anchor; a parent invited by a parent -> that family;
   the first parent (start code from the admin) -> his own family. Teacher and admin: nothing. Called by
   abgleichMitVerbindungen after the device is registered in the person's own area (an event from before would not
   count on the person's other devices). -> the event written, or null */
function eldEinrichten(ablage, konto, now) {
  if (!Object.prototype.hasOwnProperty.call(konto, 'familie') || !Object.prototype.hasOwnProperty.call(konto, 'anker')) return null;
  let p = null;
  if (konto.art === 'child' && eldObj(konto.anker) && eldPid(konto.anker.person)) {
    p = { kind: 'child', person: konto.anker.person, pub: { ...konto.anker.pub } };
  } else if (konto.art === 'parent') {
    const f = eldObj(konto.familie) ? konto.familie : { person: konto.kennung, pub: konto.pub };
    p = { kind: 'family', person: f.person, pub: { ...f.pub } };
  }
  if (!p) return null;
  const da = eldGewinner(eldLog(ablage, { person: konto.kennung }).lesen(), 'anchor_set', now).find((e) => e.payload.kind === p.kind);
  if (da && da.payload.person === p.person && eldGleichePub(da.payload.pub, p.pub)) return null;
  return eldSchreiben(ablage, { person: konto.kennung }, konto, 'anchor_set', p, now);
}

/* ---------- invitations ---------- */
function eldElternteil(ablage, konto, now) {
  if (konto.art !== 'parent' || !eldObj(konto.schluessel)) throw eldFehler('nicht-erlaubt');
  const v = verbindungen({ ablage, konto, now });
  if (!v.familie) throw eldFehler('familie-fehlt');
  return v;
}
function eldMerken(ablage, konto, r, art, person, name, now, display) {
  const p = { invite: r.id, art, person, name, check: r.pruef, until: new Date(r.gueltigBis).toISOString(), state: 'open', ...(display ? { display } : {}) };
  eldSchreiben(ablage, { person: konto.kennung }, konto, 'invite_set', p, now);
  return { code: r.code, fingerabdruck: r.fingerabdruck, id: r.id, kennung: r.kennung, anmeldename: r.anmeldename, gueltigBis: r.gueltigBis };
}

/* US9.5: a parent creates a child: login name (anmeldenameVorschlag), display name, start QR code for the child.
   -> { code, fingerabdruck, id, kennung, anmeldename, gueltigBis } (code + fingerabdruck go into the QR code).
   The child belongs to the family once its keys are checked (einladungenPruefen, after it logged in). */
export async function kindAnlegen({ zugang, ablage, konto, anmeldename, anzeigename, now, rand = eldRand } = {}) {
  eldPruefen({ ablage, konto, now });
  eldElternteil(ablage, konto, now);
  const display = typeof anzeigename === 'string' && anzeigename.trim() ? anzeigename.trim().slice(0, 40) : '';
  const r = await startcodeAusstellen({ zugang, aussteller: konto, anmeldename, art: 'child', now, rand });
  return eldMerken(ablage, konto, r, 'child', r.kennung, r.anmeldename, now, display);
}

/* US9.6: a parent invites the second parent of his family. -> like kindAnlegen */
export async function elternteilEinladen({ zugang, ablage, konto, anmeldename, now, rand = eldRand } = {}) {
  eldPruefen({ ablage, konto, now });
  const v = eldElternteil(ablage, konto, now);
  const f = v.familien[0].anker;
  const r = await startcodeAusstellen({ zugang, aussteller: konto, anmeldename, art: 'parent', familie: { person: f.person, pub: f.pub }, now, rand });
  return eldMerken(ablage, konto, r, 'parent', r.kennung, r.anmeldename, now, '');
}

/* Admin -> parent: account only, no family binding in this path. */
export async function adminElternEinladen({ zugang, ablage, konto, anmeldename, anzeigename, now, rand = eldRand } = {}) {
  eldPruefen({ ablage, konto, now });
  if (konto.art !== 'admin' || !eldObj(konto.schluessel)) throw eldFehler('nicht-erlaubt');
  const display = typeof anzeigename === 'string' && anzeigename.trim() ? anzeigename.trim().slice(0, 40) : '';
  const r = await startcodeAusstellen({ zugang, aussteller: konto, anmeldename, art: 'parent', now, rand });
  return eldMerken(ablage, konto, r, 'parent', r.kennung, r.anmeldename, now, display);
}

/* the family_set about me, signed by "anker" in the area of the family -> { area, event, sig } or null */
function eldBuergschaft(ablage, familie, anker, konto) {
  const area = bereichName('familie', familie), st = eldJson(ablage, GERAETEABGLEICH_SPEICHER.staende, {})[area];
  const log = eldObj(st) && Array.isArray(st.log) ? st.log : [];
  const x = log.filter((y) => eldObj(y) && eldObj(y.event) && y.event.type === 'family_set' && y.event.author === anker && y.event.payload.person === konto.kennung
    && y.event.payload.role === 'parent' && eldGleichePub(y.event.payload.pub, konto.pub)).pop();
  return x ? { area, event: JSON.parse(JSON.stringify(x.event)), sig: x.sig } : null;
}

/* the signed entries of the family area this device holds (module geraeteabgleich keeps them) */
function eldFamilienLog(ablage, familie) {
  const st = eldJson(ablage, GERAETEABGLEICH_SPEICHER.staende, {})[bereichName('familie', familie)];
  return eldObj(st) && Array.isArray(st.log) ? st.log.filter((x) => eldObj(x) && eldObj(x.event) && eldObj(x.event.payload)) : [];
}
/* task "Neuer Schluessel": the announcements of new keys by the parent "anker" (member_added about himself, signed with
   his key before), from his first key on -> [{ area, event, sig }] (konto checks them link by link) */
function eldAnkerKette(ablage, familie, anker, pub) {
  const area = bereichName('familie', familie), out = [];
  let vorher = pub;
  for (const x of eldFamilienLog(ablage, familie)) {
    const e = x.event;
    if (e.type !== 'member_added' || e.author !== anker || e.payload.person !== anker || eldGleichePub(e.payload.pub, vorher)) continue;
    out.push({ area, event: JSON.parse(JSON.stringify(e)), sig: x.sig });
    vorher = e.payload.pub;
  }
  return out;
}

/* US9.5 "new password of the child" (concept 8.2): a new start QR code for the existing child; with it the child makes new
   keys, the parents give it every key again - nothing is lost. kind = the child's person id. -> like kindAnlegen
   Task "Neuer Schluessel": if the child's anchor renewed his key, his announcements go with the code (ankerKette). */
export async function kindPasswortNeu({ zugang, ablage, konto, kind, now, rand = eldRand } = {}) {
  eldPruefen({ ablage, konto, now });
  const v = eldElternteil(ablage, konto, now);
  const k = v.kinder.find((c) => c.id === kind);
  if (!k || !k.name) throw eldFehler('kind-unbekannt');
  let buergschaft;
  if (k.anker.person !== konto.kennung) {
    buergschaft = eldBuergschaft(ablage, v.familie, k.anker.person, konto);
    if (!buergschaft) throw eldFehler('buergschaft-fehlt');
  }
  const kette = eldAnkerKette(ablage, v.familie, k.anker.person, k.anker.pub);
  const r = await neustartAusstellen({ zugang, aussteller: konto, anmeldename: k.name, kennung: k.id, anker: { kennung: k.anker.person, pub: k.anker.pub }, buergschaft, ankerKette: kette.length ? kette : undefined, now, rand });
  return eldMerken(ablage, konto, r, 'reset', k.id, k.name, now, '');
}

/* US8.3: the issuer withdraws an open invitation (id from the result above or verbindungen().offen).
   -> { zurueckgezogen: true } - or false when it was already used or is gone (einladungenPruefen then finds out) */
export async function einladungZurueckziehen({ zugang, ablage, konto, id, now } = {}) {
  eldPruefen({ ablage, konto, now });
  const o = verbindungen({ ablage, konto, now }).offen.find((x) => x.invite === id);
  if (!o) throw eldFehler('nicht-erlaubt');
  if (!(await zugang.invite.delete(id))) return { zurueckgezogen: false };
  eldSchreiben(ablage, { person: konto.kennung }, konto, 'invite_set', { ...o, state: 'withdrawn' }, now);
  return { zurueckgezogen: true };
}

/* the directory entry the invited person wrote with this invitation, if its proof is right -> { pub, stand } or a reason */
async function eldEingeloest(zugang, o) {
  if (kontoName(o.name) !== o.name) return { grund: 'fingerabdruck' };
  const lookup = await kontoLookup(o.name);
  if (o.art !== 'reset') {
    const e = await zugang.directory(lookup);
    if (e === null) return { grund: null };
    // someone else's entry under this name, or the entry was swapped: no proof -> nothing is noted (US6.5)
    if (!eldObj(e) || e.kennung !== o.person || !(await kontoBeweisPruefen(o.check, e))) return { grund: 'fingerabdruck' };
    const s = await kontoStand({ zugang, anmeldename: o.name });
    if (!s || s.kennung !== o.person || !eldGleichePub(s.pub, e.pub)) return { grund: 'fingerabdruck' };
    return { pub: e.pub, stand: 1 };
  }
  // new password: the entry that counts now (konto) must be the one made with this invitation
  const s = await kontoStand({ zugang, anmeldename: o.name });
  if (!s || s.kennung !== o.person) return { grund: 'fingerabdruck' };
  if (!s.neu || s.neu[o.invite] === undefined) return { grund: null };
  const e = await zugang.directory(lookup + '-' + s.neu[o.invite]);
  if (s.neu[o.invite] !== s.stand || !(await kontoBeweisPruefen(o.check, e)) || !eldGleichePub(e.pub, s.pub)) return { grund: 'fingerabdruck' };
  return { pub: s.pub, stand: s.stand };
}

/* the issuer's device checks its open invitations (abgleichMitVerbindungen calls it):
   - used, with the right proof -> the invitation is "done"; a parent's device also writes the invited person into the
     family (family_set; a new child also gets its display name)
   - an entry without the right proof (swapped keys, US6.5) -> warning; nothing is noted, so no key is wrapped for it
   - not used and over -> "expired" (the invitation is deleted from the storage)
   -> { bestaetigt: [{ id, art, person, pub }], warnungen: [{ id, art, person, grund }], abgelaufen: [id] } */
export async function einladungenPruefen({ zugang, ablage, konto, now } = {}) {
  eldPruefen({ ablage, konto, now });
  const out = { bestaetigt: [], warnungen: [], abgelaufen: [] };
  if (konto.art !== 'parent' && konto.art !== 'admin') return out;
  const v = verbindungen({ ablage, konto, now });
  for (const o of v.offen) {
    const r = await eldEingeloest(zugang, o);
    if (r.grund) { out.warnungen.push({ id: o.invite, art: o.art, person: o.person, grund: r.grund }); continue; }
    if (!r.pub) {
      if (now >= Date.parse(o.until)) {
        try { await zugang.invite.delete(o.invite); } catch (e) { if (!e || typeof e.code !== 'string') throw e; continue; }
        eldSchreiben(ablage, { person: konto.kennung }, konto, 'invite_set', { ...o, state: 'expired' }, now);
        out.abgelaufen.push(o.invite);
      }
      continue;
    }
    if (konto.art === 'parent') {
      if (!v.familie) { out.warnungen.push({ id: o.invite, art: o.art, person: o.person, grund: 'familie-fehlt' }); continue; }
      const fam = { familie: v.familie };
      if (o.art === 'parent') {
        eldSchreiben(ablage, fam, konto, 'family_set', { person: o.person, role: 'parent', pub: r.pub, stand: r.stand, name: o.name }, now);
      } else {
        // a new child: its anchor is me; new password: the anchor stays (the family knows it)
        const k = v.kinder.find((c) => c.id === o.person);
        if (o.art === 'reset' && !k) { out.warnungen.push({ id: o.invite, art: o.art, person: o.person, grund: 'kind-unbekannt' }); continue; }
        const a = o.art === 'reset' ? k.anker : { person: konto.kennung, pub: konto.pub };
        eldSchreiben(ablage, fam, konto, 'family_set', { person: o.person, role: 'child', pub: r.pub, stand: r.stand, name: o.name, anchor: a.person, anchorPub: { ...a.pub } }, now);
        if (o.art === 'child' && o.display) eldSchreiben(ablage, { kind: o.person }, konto, 'profile_set', { field: 'name', value: o.display }, now);
      }
    }
    eldSchreiben(ablage, { person: konto.kennung }, konto, 'invite_set', { ...o, state: 'done' }, now);
    out.bestaetigt.push({ id: o.invite, art: o.art, person: o.person, pub: r.pub });
  }
  return out;
}

/* a parent notes every other parent of his family he does not have a note of his own about yet - once he belongs to the
   family area (his note must count there). That note is the buergschaft for a child he created. -> notes written */
function eldBuergen(ablage, konto, now) {
  if (konto.art !== 'parent') return 0;
  const v = verbindungen({ ablage, konto, now });
  if (!v.familie) return 0;
  const area = bereichName('familie', v.familie), st = eldJson(ablage, GERAETEABGLEICH_SPEICHER.staende, {})[area];
  const log = eldObj(st) && Array.isArray(st.log) ? st.log.map((x) => x && x.event).filter(eldObj) : [];
  const mitglied = v.familie === konto.kennung || log.some((e) => e.type === 'member_added' && e.payload.person === konto.kennung);
  if (!mitglied) return 0;
  const eigene = eldLog(ablage, { familie: v.familie }).lesen().concat(log).filter((e) => eldObj(e) && e.type === 'family_set' && e.author === konto.kennung);
  let n = 0;
  for (const pid of v.eltern) {
    if (pid === konto.kennung) continue;
    const m = v.verzeichnis[pid];
    if (eigene.some((e) => e.payload.person === pid && eldGleichePub(e.payload.pub, m.pub))) continue;
    eldSchreiben(ablage, { familie: v.familie }, konto, 'family_set', { person: pid, role: 'parent', pub: { ...m.pub }, stand: m.stand || 1 }, now);
    n++;
  }
  return n;
}

/* task "Neuer Schluessel" (US9.7): another parent of the family renewed his key. The family area holds his announcement
   (member_added about him with a higher stand; module annahme accepted it only with his old key's signature - a forgery
   never gets here). This parent notes the new keys (family_set: the family's directory, and the buergschaft for the
   children he anchors) and reports it once, with the new fingerprint ("Peter hat seinen Schluessel erneuert").
   -> [{ person, name, fingerabdruck, stand }] */
async function eldErneuert(ablage, konto, now) {
  if (konto.art !== 'parent') return [];
  const v = verbindungen({ ablage, konto, now });
  if (!v.familie) return [];
  const log = eldFamilienLog(ablage, v.familie);
  const mitglied = v.familie === konto.kennung || log.some((x) => x.event.type === 'member_added' && x.event.payload.person === konto.kennung);
  if (!mitglied) return [];
  const notizen = eldLog(ablage, { familie: v.familie }).lesen().concat(log.map((x) => x.event)).filter((e) => eldObj(e) && e.type === 'family_set' && eldObj(e.payload));
  const eigene = notizen.filter((e) => e.author === konto.kennung);
  const out = [];
  for (const pid of v.eltern) {
    if (pid === konto.kennung) continue;
    // his newest keys in the family area (highest stand, then the latest)
    let neu = null;
    for (const x of log) if (x.event.type === 'member_added' && x.event.payload.person === pid && x.event.payload.role === 'parent' && (!neu || (x.event.payload.stand || 1) >= (neu.stand || 1))) neu = x.event.payload;
    if (!neu || (neu.stand || 1) < 2) continue;
    // what I noted about him last (else what the family knows: the anchor's or another parent's note)
    const notiz = eigene.filter((e) => e.payload.person === pid).sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0)).pop();
    const bisher = notiz ? notiz.payload : v.verzeichnis[pid];
    if (bisher && eldGleichePub(bisher.pub, neu.pub)) continue;
    if (bisher && (bisher.stand || 1) >= neu.stand) continue;
    const mitName = notizen.filter((e) => e.payload.person === pid && typeof e.payload.name === 'string').pop();
    const name = mitName ? mitName.payload.name : null;
    eldSchreiben(ablage, { familie: v.familie }, konto, 'family_set', { person: pid, role: 'parent', pub: { ...neu.pub }, stand: neu.stand, ...(name ? { name } : {}) }, now);
    out.push({ person: pid, name, fingerabdruck: await kontoFingerabdruck(neu.pub), stand: neu.stand });
  }
  return out;
}
/* reasons for which a dropped member_added is shown as a warning (somebody tried to put keys in - US6.5) */
const ELD_WARNEN = ['autor-unbekannt', 'nicht-mitglied', 'geraet-fremd', 'geraet-nicht-angemeldet', 'unterschrift', 'rolle-darf-nicht', 'nach-entfernung'];

/* ---------- one call for the app ---------- */
/* syncs this device with everything its accounts are connected to (instead of geraeteabgleich.geraetAbgleichen):
   konten = the opened accounts on this device (usually one) - right after the first login pass the result of
   konto.ersteAnmeldung: it notes where the new account belongs. Builds families, children and directory from the logs,
   syncs, lets every parent check his open invitations and note the other parents, and syncs again while that changed
   something (at most EINLADUNG_RUNDEN rounds).
   Task "Neuer Schluessel": an account right after konto.schluesselErneuern carries alt - its areas get the new key here
   (erneuerungOffen: areas still to do; keep alt while it is not empty). erneuert: other parents who renewed their key
   (shown once, with the new fingerprint); a dropped key change (member_added a device refused) -> warning (art
   "schluessel", grund = the reason).
   Task "Abgleich in der App": inDieApp false (a child in the middle of a round) -> one round only, nothing written into
   the app's logs (geraetAbgleichen inDieApp); the hourly limit of the storage -> no further round, limit = wait time.
   -> { runden, bericht (of the last geraetAbgleichen), inDieApp (sum), bestaetigt, warnungen, abgelaufen, erneuert,
        erneuerungOffen, geloescht (children whose data this call removed from the device - task "Export und Loeschen"),
        kontoGeloescht (accounts of "konten" that no longer exist in the directory: not synced, the app logs them out),
        limit? } */
export async function abgleichMitVerbindungen({ ablage, zugang, konten: alleKonten, now, heute, geraetName, inDieApp = true } = {}) {
  if (!Array.isArray(alleKonten) || !alleKonten.length) throw eldFalsch('konten erwartet.');
  for (const k of alleKonten) eldPruefen({ ablage, konto: k, now });
  const out = { runden: 0, bericht: null, inDieApp: 0, bestaetigt: [], warnungen: [], abgelaufen: [], erneuert: [], erneuerungOffen: [], geloescht: [], kontoGeloescht: [] };
  // task "Export und Loeschen": a device that does not know the own area of an account yet (a new device - or one that
  // removed a deleted child's data) asks the directory first: a deleted account is not synced (its own area would be
  // made anew); the app logs it out. Costs one or two reads, only until the device knows the area.
  const bekannt = eldJson(ablage, GERAETEABGLEICH_SPEICHER.staende, {});
  let konten = [];
  for (const k of alleKonten) {
    if (!(eldObj(bekannt) && eldObj(bekannt[bereichName('person', k.kennung)])) && typeof k.anmeldename === 'string' && kontoName(k.anmeldename)) {
      const s = await kontoStand({ zugang, anmeldename: k.anmeldename });
      if (s === null || s.kennung !== k.kennung) { out.kontoGeloescht.push(k.kennung); continue; }
    }
    konten.push(k);
  }
  if (!konten.length) return out;
  let personen = kontoPersonen(...konten);
  // task "Konto loeschen - andere Geraete": a parent who took himself out of the family (family_set removed about himself,
  // written on the device where he deleted his account) or whose own area is gone from the storage: this device drops
  // everything of the family - the children, the family area, his own area - and reports him as deleted (the app logs him
  // out and forgets the account). The other accounts on this device stay and keep what they need. -> true: konten changed
  const austritte = () => {
    const raus = konten.filter((k) => k.art === 'parent'
      && ((out.bericht && out.bericht.bereiche[bereichName('person', k.kennung)] && out.bericht.bereiche[bereichName('person', k.kennung)].fehler === 'geloescht') || elternAusgetreten({ ablage, konto: k, now })));
    if (!raus.length) return false;
    const bleiben = konten.filter((k) => !raus.includes(k)), behalten = { kinder: [], familien: [] };
    for (const k of bleiben) {
      const v = verbindungen({ ablage, konto: k, now });
      behalten.kinder.push(...v.kinder.map((c) => c.id), ...(k.art === 'child' ? [k.kennung] : []));
      if (v.familie) behalten.familien.push(v.familie);
    }
    for (const k of raus) {
      const r = elternLokalEntfernen({ ablage, konto: k, now, behalten });
      for (const kind of r.kinder) if (!out.geloescht.includes(kind)) out.geloescht.push(kind);
      if (!out.kontoGeloescht.includes(k.kennung)) out.kontoGeloescht.push(k.kennung);
    }
    konten = bleiben;
    personen = konten.length ? kontoPersonen(...konten) : {};
    return true;
  };
  const sammeln = () => {
    const g = { familien: new Map(), kinder: new Map(), verzeichnis: {} };
    for (const k of konten) {
      const v = verbindungen({ ablage, konto: k, now });
      for (const f of v.familien) g.familien.set(f.id, f);
      for (const c of v.kinder) g.kinder.set(c.id, { id: c.id, pre: c.pre, anker: c.anker });
      Object.assign(g.verzeichnis, v.verzeichnis);
    }
    return { familien: [...g.familien.values()], kinder: [...g.kinder.values()], verzeichnis: g.verzeichnis };
  };
  // a parent already known to have left: not synced at all (nothing is sent in his name, nothing handed to him)
  if (austritte() && !konten.length) return out;
  let plan = sammeln();
  for (let i = 0; i < EINLADUNG_RUNDEN; i++) {
    out.bericht = await geraetAbgleichen({ ablage, zugang, personen, kinder: plan.kinder, familien: plan.familien, verzeichnis: plan.verzeichnis, now, heute, geraetName, inDieApp });
    out.runden++;
    out.inDieApp += out.bericht.inDieApp;
    out.erneuerungOffen = out.bericht.erneuerungOffen.slice();
    for (const v of out.bericht.verworfen) {
      if (v.typ === 'member_added' && ELD_WARNEN.includes(v.grund) && !out.warnungen.some((x) => x.id === v.id)) out.warnungen.push({ id: v.id, art: 'schluessel', person: null, grund: v.grund, bereich: v.bereich });
    }
    if (austritte()) { if (!konten.length) break; plan = sammeln(); continue; }
    if (out.bericht.limit !== undefined) { out.limit = out.bericht.limit; break; }
    if (!inDieApp) break;
    let geschrieben = 0;
    for (const k of konten) {
      if (eldEinrichten(ablage, k, now)) geschrieben++;
      const r = await einladungenPruefen({ zugang, ablage, konto: k, now });
      out.bestaetigt.push(...r.bestaetigt); out.abgelaufen.push(...r.abgelaufen);
      for (const w of r.warnungen) if (!out.warnungen.some((x) => x.id === w.id)) out.warnungen.push(w);
      const er = await eldErneuert(ablage, k, now);
      for (const x of er) if (!out.erneuert.some((y) => y.person === x.person && y.fingerabdruck === x.fingerabdruck)) out.erneuert.push(x);
      geschrieben += r.bestaetigt.length + er.length + eldBuergen(ablage, k, now);
    }
    const neu = sammeln();
    const neuIn = out.bericht.inDieApp > 0 || Object.values(out.bericht.bereiche).some((b) => b.aktion === 'angelegt' || b.aktion === 'ergaenzt' || b.aktion === 'gewechselt');
    if (!geschrieben && !neuIn && JSON.stringify(neu) === JSON.stringify(plan)) break;
    plan = neu;
  }
  // task "Export und Loeschen": a child the family deleted (family_set removed) - its data leaves this device, too; a
  // child's own device whose areas are gone from the storage (bereich fehler "geloescht") the same. The app then drops
  // the child from its lists (and logs a deleted child out). Not in the middle of a child's round (inDieApp false): the
  // next full sync does it.
  for (const k of inDieApp ? konten : []) {
    const weg = verbindungen({ ablage, konto: k, now }).entfernt.filter((x) => x.role === 'child').map((x) => x.person);
    const b = out.bericht && out.bericht.bereiche[bereichName('kind:lern', k.kennung)];
    if (k.art === 'child' && b && b.fehler === 'geloescht') weg.push(k.kennung);
    for (const kind of weg) {
      if (out.geloescht.includes(kind)) continue;
      const r = kindLokalEntfernen({ ablage, kind });
      if (r.bereiche.length || r.schluessel) out.geloescht.push(kind);
    }
  }
  return out;
}

/* ---------- login name suggestion ---------- */
const ELD_UMLAUT = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' };
/* a free login name from a display name ("Kathie Müller" -> "kathie.mueller", else with two digits) -> name */
export async function anmeldenameVorschlag({ zugang, anzeigename, rand = eldRand } = {}) {
  if (!eldObj(zugang) || typeof zugang.directory !== 'function') throw eldFalsch('zugang fehlt.');
  let b = String(anzeigename === undefined || anzeigename === null ? '' : anzeigename).toLowerCase().replace(/[äöüß]/g, (z) => ELD_UMLAUT[z])
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '').slice(0, 17).replace(/\.+$/, '');
  if (b.length < 3) b += 'kid';
  const frei = async (n) => kontoName(n) === n && (await zugang.directory(await kontoLookup(n))) === null;
  if (await frei(b)) return b;
  for (let i = 0; i < 40; i++) {
    const n = b + (10 + (rand(1)[0] % 90));
    if (await frei(n)) return n;
  }
  throw eldFehler('name-ungueltig');
}
