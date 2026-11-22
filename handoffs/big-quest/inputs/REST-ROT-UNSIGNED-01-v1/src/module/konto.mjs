// Module konto - accounts without names in the storage (stage 3b, task "Konto-Modul"; concept 8.2, 10.2, 10.3, 10.6,
// 11, 12; US9.1-US9.4). Test build only (module.json: bau "test", after geraeteabgleich). No screen, no browser storage,
// no clock, no network of its own: it talks to the storage only through the access handed in (module speicher or github).
//
//   Directory (US9.1): an account lies under a hash of the login name with a fixed app salt (kontoLookup), never under
//   the name. Entry 1 is the account, created once - a second account with the same name -> "name-vergeben":
//     { v: 1, lookup, kennung, art, pub, gesperrt }
//   gesperrt = krypto.lockPersonKeys: the person keys locked with the password (locks[0]) and, for grown-ups, a second
//   time with the recovery code (locks[1]); 600 000 rounds in the app. A new password (US9.4) is one more entry
//   "<lookup>-<n>" (n = 2, 3, ...), also created once and signed by the person:
//     { v: 1, lookup: "<lookup>-<n>", stand: n, kennung, pub, gesperrt, sig }
//   The valid entry with the largest n counts; a broken or foreign one is skipped. The keys stay the same (same pub).
//   Start code (US9.2): one-time, 7 days. An invitation in the storage (invite) under a hash of the code; its content
//   (login name, person id, kind of account, issuer) is encrypted with a key from the code and signed by the issuer -
//   the admin for grown-ups, a parent for children (only the very first admin is issued without an issuer, by the tool).
//   Login on a new device (US9.3): directory -> newest entry -> open with the password -> keys checked against pub. A
//   wrong name and a wrong password give the same error after the same work (one PBKDF2). Registering the device
//   (device_added) and fetching the areas is the work of module geraeteabgleich (kontoPersonen hands it the person).
//   Recovery code (US9.4, grown-ups only): opens the keys, sets a new password, and there is a new code at once; the old
//   password and the old code no longer open the account in the app.
//
//   Task "Einladungen" (US9.5, US9.6, US6.5; module einladung uses this):
//   - Proof (beweis): every directory entry written with a start code carries beweis = HMAC over { lookup, kennung, pub }
//     with a key from the code (kontoBeweisPruefen). The issuer keeps that key (in his own area) and so recognises the
//     keys of the person he invited - someone with write access to the storage who swaps the entry cannot make one.
//   - Fingerprint: the start QR code carries the issuer's fingerprint; ersteAnmeldung({ fingerabdruck }) refuses a code
//     whose signed issuer has another one (nothing is created, the code stays valid).
//   - A parent invites the second parent (start code art "parent" with familie = the founding parent of his family) and
//     creates children (art "child"; the child's entry 1 notes its creating parent as anker).
//   - New password of a child (neustartAusstellen): a start code for the existing account. The child makes NEW keys; the
//     entry "<lookup>-<n>" carries the new keys, the signed start code (vollmacht) and is signed with the new keys:
//       { v: 1, lookup: "<lookup>-<n>", stand: n, kennung, pub (new), gesperrt, beweis, vollmacht: { inhalt, sig }, sig }
//     It counts only if the vollmacht is signed by the child's anker - or by another parent with a buergschaft: the
//     family_set about him signed by the anker (module einladung) - and if its start code was not used before.
//     ankerKette (task "Neuer Schluessel"): when the anker renewed his key, the vollmacht carries his announcements
//     (member_added about himself, each signed with the key before - module einladung takes them from the family area);
//     the anker's newest key along that chain may sign, and a buergschaft signed with any key of the chain counts.
//
//   Task "Neuer Schluessel" (US9.7, concept 8.4; grown-ups only): schluesselErneuern - and wiederherstellen, always -
//   make a NEW key pair, locked with the new password and a new recovery code. The entry "<lookup>-<n>" carries the new
//   keys, the announcement signed with the OLD keys (wechsel) and is signed with the new keys:
//       { v: 1, lookup: "<lookup>-<n>", stand: n, kennung, pub (new), gesperrt, wechsel, sig }
//   It counts only if "wechsel" verifies with the keys that counted up to there - nobody without the old keys can put
//   his own in. The old locks stay in the storage (write once): the old password still opens the OLD keys, but they
//   only open key versions from before (module bereiche wraps every new version for the new keys only).
//   The account carries "ursprung" (the keys of entry 1 - the anchor of the person's own area, whose later keys are
//   announced in the area itself) and, right after renewing, "alt" (the old keys: the device needs them until every
//   area has the new key - module geraeteabgleich).
//
// Errors: Error with err.code - one of KONTO_FEHLER, or a storage error passed on (offline, zugang, limit, ...).
// Wrong use (missing access, clock, ...) throws a plain Error without code.
// Names: every helper starts with "kto"/"KTO_" because all modules and index.html share one scope in the app.

import { PBKDF2_ROUNDS, bytesToB64, b64ToBytes, sealEntry, openEntryText, pbkdf2Bits, newPersonKeys, publicKeysOf, lockPersonKeys, unlockPersonKeys, keyFingerprint, signBytes, verifyBytes, newAreaKey, wrapKeyFor, unwrapKey } from './krypto.mjs';
import { canonicalBytes } from './annahme.mjs';
import { pwWeak } from './passwort.mjs';

/* kinds of account (the roles of the events) */
export const KONTO_ARTEN = Object.freeze(['child', 'parent', 'teacher', 'admin']);
/* who issues start codes for whom (concept 4, 10.6): the admin for grown-ups, a parent for its children and - task
   "Einladungen" - for the second parent of its family */
export const KONTO_AUSSTELLER = Object.freeze({ admin: Object.freeze(['parent', 'teacher', 'admin']), parent: Object.freeze(['child', 'parent']) });
/* error codes of this module (storage errors keep their own code) */
export const KONTO_FEHLER = Object.freeze(['anmeldung', 'name-ungueltig', 'name-vergeben', 'passwort-schwach', 'startcode-ungueltig', 'startcode-abgelaufen', 'nicht-erlaubt', 'konflikt', 'fingerabdruck', 'passwort-gleich']);
/* a start code is valid this long (concept 10.6) */
export const KONTO_STARTCODE_MS = 7 * 24 * 3600 * 1000;
/* fixed app salt of the directory hash (not secret; it only keeps the hashes apart from any other use) */
export const KONTO_SALZ = 'bq-verzeichnis-1|Yk3vQ8rT2mZp6wN4';
/* login names as in konten.json (werkzeug/konten.mjs NAME_RE) */
export const KONTO_NAME = /^[a-z0-9][a-z0-9.-]{2,19}$/;
/* at most this many directory entries of one account are read (new passwords) */
export const KONTO_STAENDE_MAX = 64;
/* a lock with more rounds than this is refused (it would freeze the app) */
export const KONTO_RUNDEN_MAX = 10 * PBKDF2_ROUNDS;

const KTO_TE = new TextEncoder();
const KTO_CODE = /^[A-Za-z0-9_-]{22}$/;                         // start code: 16 random bytes, base64url
const KTO_REC_ZEICHEN = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';        // recovery code: no 0/O, 1/I/L
const KTO_REC_LAENGE = 20;                                         // 5 groups of 4, about 99 bits
const KTO_CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ktoRand = (n) => globalThis.crypto.getRandomValues(new Uint8Array(n));
const ktoObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const ktoStr = (x) => typeof x === 'string' && x.length > 0;
const ktoPid = (x) => typeof x === 'string' && /^p_[0-9A-Za-z]{1,40}$/.test(x);
const ktoPub = (p) => ktoObj(p) && Object.keys(p).length === 2 && ktoStr(p.ecdh) && ktoStr(p.ecdsa);
const ktoGleichePub = (a, b) => ktoPub(a) && ktoPub(b) && a.ecdh === b.ecdh && a.ecdsa === b.ecdsa;

function ktoFehler(code) {
  const e = new Error('konto: ' + code);
  e.code = code;
  return e;
}
function ktoFalsch(text) { return new Error('konto: ' + text); }

/* canonical JSON (keys sorted): what is signed */
function ktoKanon(x) {
  if (x === null || typeof x !== 'object') return JSON.stringify(x);
  if (Array.isArray(x)) return '[' + x.map(ktoKanon).join(',') + ']';
  return '{' + Object.keys(x).sort().filter((k) => x[k] !== undefined).map((k) => JSON.stringify(k) + ':' + ktoKanon(x[k])).join(',') + '}';
}
async function ktoSha(text) { return new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', KTO_TE.encode(text))); }
const ktoHex = (u8) => Array.from(u8, (b) => b.toString(16).padStart(2, '0')).join('');
const ktoB64url = (u8) => bytesToB64(u8).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function ktoZugang(zugang) {
  if (!ktoObj(zugang) || typeof zugang.directory !== 'function' || typeof zugang.putDirectory !== 'function' || !ktoObj(zugang.invite) || typeof zugang.invite.get !== 'function' || typeof zugang.invite.put !== 'function' || typeof zugang.invite.delete !== 'function') throw ktoFalsch('zugang (directory, putDirectory, invite) fehlt.');
}
function ktoRunden(runden) {
  if (!Number.isInteger(runden) || runden < 1 || runden > KONTO_RUNDEN_MAX) throw ktoFalsch('runden ungueltig.');
}

/* ---------- names, ids, codes ---------- */
/* login name as it is compared (trimmed, small letters); null if it can never be a login name */
export function kontoName(anmeldename) {
  const n = String(anmeldename === undefined || anmeldename === null ? '' : anmeldename).normalize('NFC').trim().toLowerCase();
  return KONTO_NAME.test(n) ? n : null;
}
/* the directory key of a login name: "v" + SHA-256 (salt and name) as hex; the name itself is never stored */
export async function kontoLookup(anmeldename) {
  const n = kontoName(anmeldename);
  if (!n) throw ktoFehler('name-ungueltig');
  return 'v' + ktoHex(await ktoSha('bq-verzeichnis|' + KONTO_SALZ + '|' + n));
}
/* a new person id: "p_" + 26 Crockford characters from 128 random bits (like werkzeug/konten.mjs) */
export function kontoKennung(rand = ktoRand) {
  let n = 0n;
  for (const b of rand(16)) n = (n << 8n) | BigInt(b);
  let s = '';
  for (let i = 0; i < 26; i++) { s = KTO_CROCKFORD[Number(n & 31n)] + s; n >>= 5n; }
  return 'p_' + s;
}
/* a new recovery code "ABCD-EFGH-JKMN-PQRS-TUVW" (no 0/O, 1/I/L) */
function ktoNeuerCode(rand) {
  let s = '';
  while (s.length < KTO_REC_LAENGE) {
    for (const b of rand(KTO_REC_LAENGE)) if (b < 248 && s.length < KTO_REC_LAENGE) s += KTO_REC_ZEICHEN[b % 31];   // 248 = 8 x 31: no bias
  }
  return s.match(/.{4}/g).join('-');
}
/* a typed recovery code -> the form it was locked with; null if it cannot be one */
function ktoCodeForm(code) {
  const c = String(code === undefined || code === null ? '' : code).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (c.length !== KTO_REC_LAENGE || [...c].some((z) => !KTO_REC_ZEICHEN.includes(z))) return null;
  return c.match(/.{4}/g).join('-');
}
/* start code -> invitation id, key, and the key of the proof (beweis; base64) */
async function ktoStart(code) {
  const id = 's' + ktoHex(await ktoSha('bq-start-id|' + code));
  const key = await globalThis.crypto.subtle.importKey('raw', await ktoSha('bq-start-key|' + code), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  return { id, key, aad: KTO_TE.encode('bq-start|' + id), beweis: bytesToB64(await ktoSha('bq-beweis|' + code)) };
}

/* ---------- proof: whoever writes a directory entry with a start code shows he had the code ---------- */
const ktoBeweisText = (e) => 'bq-beweis|' + ktoKanon({ lookup: e.lookup, kennung: e.kennung, pub: e.pub });
async function ktoHmac(schluessel, text) {
  const k = await globalThis.crypto.subtle.importKey('raw', b64ToBytes(schluessel), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return bytesToB64(new Uint8Array(await globalThis.crypto.subtle.sign('HMAC', k, KTO_TE.encode(text))));
}
/* does this directory entry carry the proof for the start code whose proof key is "pruef" (startcodeAusstellen -> pruef)? */
export async function kontoBeweisPruefen(pruef, eintrag) {
  if (typeof pruef !== 'string' || !ktoObj(eintrag) || !ktoStr(eintrag.beweis) || typeof eintrag.lookup !== 'string' || !ktoPid(eintrag.kennung) || !ktoPub(eintrag.pub)) return false;
  let soll;
  try { soll = await ktoHmac(pruef, ktoBeweisText(eintrag)); } catch (e) { return false; }
  return soll.length === eintrag.beweis.length && soll === eintrag.beweis;
}
/* the fingerprint as typed or read from a QR code -> the form keyFingerprint gives (words joined by "-") */
const ktoFp = (x) => String(x === undefined || x === null ? '' : x).trim().toLowerCase().split(/[\s-]+/).filter(Boolean).join('-');

/* ---------- directory entries ---------- */
function ktoGesperrtOk(g, kennung, pub, art) {
  return ktoObj(g) && g.v === 1 && g.person === kennung && ktoGleichePub(g.pub, pub) && Array.isArray(g.locks) && g.locks.length === (art === 'child' ? 1 : 2)
    && g.locks.every((l) => ktoObj(l) && ktoStr(l.salt) && Number.isInteger(l.rounds) && ktoObj(l.box) && ktoStr(l.box.iv) && ktoStr(l.box.ct));
}
const ktoAnker = (a) => ktoObj(a) && Object.keys(a).length === 2 && ktoPid(a.kennung) && ktoPub(a.pub);
function ktoEintragOk(e, lookup) {
  return ktoObj(e) && e.v === 1 && e.lookup === lookup && ktoPid(e.kennung) && KONTO_ARTEN.includes(e.art) && ktoPub(e.pub) && ktoGesperrtOk(e.gesperrt, e.kennung, e.pub, e.art)
    && (e.anker === undefined || (e.art === 'child' && ktoAnker(e.anker))) && (e.beweis === undefined || ktoStr(e.beweis));
}
const ktoNachtragText = (e) => 'bq-konto-stand|' + ktoKanon({ lookup: e.lookup, stand: e.stand, kennung: e.kennung, pub: e.pub, gesperrt: e.gesperrt });
/* a new lock with the same keys (new password), signed with these keys (pub = the keys that count up to here) */
async function ktoNachtragOk(e, basis, n, pub) {
  if (!ktoObj(e) || e.v !== 1 || e.lookup !== basis.lookup + '-' + n || e.stand !== n || e.kennung !== basis.kennung || !ktoGleichePub(e.pub, pub) || e.vollmacht !== undefined) return false;
  if (!ktoGesperrtOk(e.gesperrt, basis.kennung, pub, basis.art) || !ktoStr(e.sig)) return false;
  return verifyBytes(pub, ktoNachtragText(e), e.sig);
}

/* ---------- new keys of a grown-up (task "Neuer Schluessel") ---------- */
const ktoWechselText = (e) => 'bq-konto-wechsel|' + ktoKanon({ lookup: e.lookup, stand: e.stand, kennung: e.kennung, pub: e.pub });
const ktoErneuertText = (e) => 'bq-konto-erneuert|' + ktoKanon({ ...e, sig: undefined });
/* an entry with new keys of a grown-up, announced with the keys that counted up to here ("alt") */
async function ktoErneuertOk(e, basis, n, alt) {
  if (basis.art === 'child' || !ktoObj(e) || e.v !== 1 || e.lookup !== basis.lookup + '-' + n || e.stand !== n || e.kennung !== basis.kennung || !ktoPub(e.pub) || ktoGleichePub(e.pub, alt)) return false;
  if (!ktoStr(e.wechsel) || !ktoStr(e.sig) || e.vollmacht !== undefined || e.beweis !== undefined || !ktoGesperrtOk(e.gesperrt, basis.kennung, e.pub, basis.art)) return false;
  return (await verifyBytes(alt, ktoWechselText(e), e.wechsel)) && (await verifyBytes(e.pub, ktoErneuertText(e), e.sig));
}

/* ---------- new keys of a child (task "Einladungen") ---------- */
const ktoNeuText = (e) => 'bq-konto-neu|' + ktoKanon({ ...e, sig: undefined });
/* the keys of a child's anchor along his announcements (task "Neuer Schluessel"): kette = [{ area, event, sig }] with
   event = member_added about himself, signed with his key before. A link that does not follow from the keys so far is
   skipped. -> [pub of the anchor, later pubs ...] (the last one is his newest key), or null if kette is malformed */
async function ktoAnkerKette(kette, anker) {
  const pubs = [{ ...anker.pub }];
  if (kette === undefined) return pubs;
  if (!Array.isArray(kette) || kette.length > KONTO_STAENDE_MAX) return null;
  for (const g of kette) {
    if (!ktoObj(g) || typeof g.area !== 'string' || !g.area || !ktoObj(g.event) || !ktoStr(g.sig)) return null;
    const e = g.event, p = ktoObj(e.payload) ? e.payload : {}, vorher = pubs[pubs.length - 1];
    if (e.type !== 'member_added' || e.author !== anker.kennung || p.person !== anker.kennung || p.role !== 'parent' || !ktoPub(p.pub) || ktoGleichePub(p.pub, vorher)) continue;
    let ok = false;
    try { ok = await verifyBytes(vorher, canonicalBytes(e, g.area), g.sig); } catch (err) { ok = false; }
    if (ok) pubs.push({ ...p.pub });
  }
  return pubs;
}
/* is "b" the anchor's word for this parent? b = { area, event, sig }: the family_set about him (module einladung),
   signed by the anchor in the area of the family (with one of his keys - ankerPubs, task "Neuer Schluessel") */
async function ktoBuergschaftOk(b, anker, aussteller, ankerPubs = [anker.pub]) {
  if (!ktoObj(b) || typeof b.area !== 'string' || !b.area.startsWith('familie:') || !ktoObj(b.event) || !ktoStr(b.sig)) return false;
  const e = b.event, p = ktoObj(e.payload) ? e.payload : {};
  if (e.type !== 'family_set' || e.author !== anker.kennung || p.person !== aussteller.kennung || p.role !== 'parent' || !ktoGleichePub(p.pub, aussteller.pub)) return false;
  for (const pub of ankerPubs) {
    try { if (await verifyBytes(pub, canonicalBytes(e, b.area), b.sig)) return true; } catch (err) { /* next key */ }
  }
  return false;
}
/* the signed start code of a "new password" for this child account -> its id, or null (wrong, foreign, not trusted) */
async function ktoVollmachtOk(v, basis) {
  if (!ktoObj(v) || !ktoObj(v.inhalt) || !ktoStr(v.sig) || basis.art !== 'child' || !ktoAnker(basis.anker)) return null;
  const i = v.inhalt, a = i.aussteller;
  if (i.v !== 1 || i.neu !== true || i.art !== 'child' || i.kennung !== basis.kennung || typeof i.id !== 'string' || !/^s[0-9a-f]{64}$/.test(i.id)) return null;
  if (!ktoObj(a) || a.art !== 'parent' || !ktoPid(a.kennung) || !ktoPub(a.pub) || !ktoAnker(i.anker) || i.anker.kennung !== basis.anker.kennung || !ktoGleichePub(i.anker.pub, basis.anker.pub)) return null;
  if (kontoName(i.anmeldename) !== i.anmeldename || (await kontoLookup(i.anmeldename)) !== basis.lookup) return null;
  if (!(await verifyBytes(a.pub, 'bq-start|' + ktoKanon(i), v.sig))) return null;
  const pubs = await ktoAnkerKette(i.ankerKette, basis.anker);
  if (!pubs) return null;
  const vertraut = (a.kennung === basis.anker.kennung && ktoGleichePub(a.pub, pubs[pubs.length - 1])) || (await ktoBuergschaftOk(i.buergschaft, basis.anker, a, pubs));
  return vertraut ? i.id : null;
}
/* an entry with new keys: vollmacht trusted, proof present, signed with the new keys -> the vollmacht's id or null */
async function ktoNeuOk(e, basis, n) {
  if (!ktoObj(e) || e.v !== 1 || e.lookup !== basis.lookup + '-' + n || e.stand !== n || e.kennung !== basis.kennung || !ktoPub(e.pub) || !ktoStr(e.beweis) || !ktoStr(e.sig)) return null;
  if (!ktoGesperrtOk(e.gesperrt, basis.kennung, e.pub, basis.art)) return null;
  const id = await ktoVollmachtOk(e.vollmacht, basis);
  return id && (await verifyBytes(e.pub, ktoNeuText(e), e.sig)) ? id : null;
}
/* the lock that counts now -> { stand, gesperrt, pub, naechster, neu } (naechster = first free entry number, null if none
   left; neu = { <vollmacht id>: stand } of the entries with new keys that count) */
async function ktoAktuell(zugang, basis) {
  let aktuell = { stand: 1, gesperrt: basis.gesperrt, pub: basis.pub }, n = 2;
  const neu = {};
  for (; n <= KONTO_STAENDE_MAX; n++) {
    const e = await zugang.directory(basis.lookup + '-' + n);
    if (e === null) break;
    if (await ktoNachtragOk(e, basis, n, aktuell.pub)) { aktuell = { stand: n, gesperrt: e.gesperrt, pub: aktuell.pub }; continue; }
    if (await ktoErneuertOk(e, basis, n, aktuell.pub)) { aktuell = { stand: n, gesperrt: e.gesperrt, pub: { ...e.pub } }; continue; }
    const id = basis.art === 'child' ? await ktoNeuOk(e, basis, n) : null;
    if (id && !Object.prototype.hasOwnProperty.call(neu, id)) { neu[id] = n; aktuell = { stand: n, gesperrt: e.gesperrt, pub: { ...e.pub } }; }   // a start code counts once
  }
  return { ...aktuell, naechster: n <= KONTO_STAENDE_MAX ? n : null, neu };
}

/* the same work as opening a lock, for a name that does not exist (same time for a wrong name and a wrong password) */
async function ktoBlind(geheimnis, runden) {
  await pbkdf2Bits(String(geheimnis === undefined || geheimnis === null ? '' : geheimnis), new Uint8Array(16), runden);
}
/* do the private keys belong to pub? (a lock someone put into the storage with other keys is refused) */
async function ktoPasst(keys, kennung, pub) {
  try {
    const sig = await signBytes(keys, 'bq-konto-probe|' + kennung);
    if (!(await verifyBytes(pub, 'bq-konto-probe|' + kennung, sig))) return false;
    const k = await newAreaKey();
    await unwrapKey(await wrapKeyFor(k, { id: kennung, pub }, 'konto-probe', 1), keys, kennung, 'konto-probe', 1);
    return true;
  } catch (e) { return false; }
}
/* opens lock number "nr" (0 = password, 1 = recovery code) -> keys or null. A lock below "runden" rounds or above
   KONTO_RUNDEN_MAX is refused (after the same work, so it takes the same time). */
async function ktoOeffnen(gesperrt, kennung, pub, nr, geheimnis, runden, exportierbar = false) {
  const l = gesperrt.locks[nr];
  if (!l || l.rounds < runden || l.rounds > KONTO_RUNDEN_MAX) { await ktoBlind(geheimnis, runden); return null; }
  let keys;
  try { keys = await unlockPersonKeys({ ...gesperrt, locks: [l] }, kennung, String(geheimnis), { exportierbar }); } catch (e) { return null; }
  return (await ktoPasst(keys, kennung, pub)) ? keys : null;
}
/* writes a new lock as entry "naechster", signed with the (open) keys whose public part is pub */
async function ktoNeuerStand(zugang, basis, naechster, gesperrt, keys, pub) {
  if (naechster === null) throw ktoFehler('konflikt');
  const e = { v: 1, lookup: basis.lookup + '-' + naechster, stand: naechster, kennung: basis.kennung, pub: { ...pub }, gesperrt };
  e.sig = await signBytes(keys, ktoNachtragText(e));
  try { await zugang.putDirectory(e); } catch (err) { throw err && err.code === 'vorhanden' ? ktoFehler('konflikt') : err; }
  return naechster;
}
/* ursprung: the keys the person's own area is anchored at - a grown-up's first keys (later ones are announced in the area,
   task "Neuer Schluessel"); a child's current keys (after a new password its own area starts anew - task "Einladungen") */
const ktoKonto = (e, n, schluessel, stand, pub = e.pub) => ({ kennung: e.kennung, art: e.art, anmeldename: n, pub: { ...pub }, schluessel, stand, ursprung: { ...(e.art === 'child' ? pub : e.pub) } });
/* new keys for a grown-up: locked with the new password and a new recovery code, announced with the old keys (opened,
   "alteSchluessel"; akt = ktoAktuell) -> { schluessel (new, not extractable), pub, stand, wcode } */
async function ktoErneuern(zugang, basis, akt, alteSchluessel, neuesPasswort, runden, rand) {
  if (akt.naechster === null) throw ktoFehler('konflikt');
  const keys = await newPersonKeys(), pub = await publicKeysOf(keys), n = akt.naechster, wcode = ktoNeuerCode(rand);
  const gesperrt = await lockPersonKeys(keys, basis.kennung, [neuesPasswort, wcode], { rounds: runden, rand });
  const e = { v: 1, lookup: basis.lookup + '-' + n, stand: n, kennung: basis.kennung, pub, gesperrt };
  e.wechsel = await signBytes(alteSchluessel, ktoWechselText(e));
  e.sig = await signBytes(keys, ktoErneuertText(e));
  try { await zugang.putDirectory(e); } catch (err) { throw err && err.code === 'vorhanden' ? ktoFehler('konflikt') : err; }
  // the device keeps a copy that cannot be exported: open the lock just written (this also proves it opens)
  const schluessel = await ktoOeffnen(gesperrt, basis.kennung, pub, 0, neuesPasswort, runden);
  if (!schluessel) throw ktoFalsch('Schloss laesst sich nicht oeffnen.');
  return { schluessel, pub, stand: n, wcode };
}

/* ---------- start code (US9.2) ---------- */
function ktoAussteller(aussteller) {
  if (aussteller !== null && (!ktoObj(aussteller) || !ktoPid(aussteller.kennung) || !ktoPub(aussteller.pub) || !ktoObj(aussteller.schluessel))) throw ktoFalsch('aussteller braucht kennung, art, pub, schluessel.');
}
/* signs the content (issuer), seals it with the code and puts it as invitation -> what the issuer gets back */
async function ktoAusgeben(zugang, aussteller, inhalt, code, s, rand) {
  const sig = aussteller === null ? null : await signBytes(aussteller.schluessel, 'bq-start|' + ktoKanon(inhalt));
  const sealed = await sealEntry(s.key, JSON.stringify({ inhalt, sig }), s.aad, rand);
  await zugang.invite.put(s.id, { v: 1, iv: sealed.iv, ct: sealed.ct }, { gueltigMs: KONTO_STARTCODE_MS });
  return { code, id: s.id, pruef: s.beweis, kennung: inhalt.kennung, anmeldename: inhalt.anmeldename, art: inhalt.art, gueltigBis: inhalt.gueltigBis, fingerabdruck: aussteller === null ? null : await keyFingerprint(aussteller.pub) };
}
/* issues a one-time start code for a new account.
   aussteller: the opened account of the issuer ({ kennung, art, pub, schluessel }, from anmelden / ersteAnmeldung);
               null only for the very first admin (issued by the tool)
   familie:    only when a parent invites the second parent: { person, pub } = the founding parent of his family
   -> { code, id, pruef, kennung, anmeldename, art, gueltigBis, fingerabdruck } - the code goes into the start link / QR
      code (with the issuer's fingerabdruck), never into the storage; id = the invitation (to withdraw it: invite.delete);
      pruef = key of the proof in the new account's directory entry (kontoBeweisPruefen), kept by the issuer */
export async function startcodeAusstellen({ zugang, aussteller = null, anmeldename, art, familie, now, rand = ktoRand } = {}) {
  ktoZugang(zugang);
  if (!Number.isFinite(now)) throw ktoFalsch('"now" fehlt.');
  if (!KONTO_ARTEN.includes(art)) throw ktoFehler('nicht-erlaubt');
  if (aussteller === null ? art !== 'admin' : !(ktoObj(aussteller) && (KONTO_AUSSTELLER[aussteller.art] || []).includes(art))) throw ktoFehler('nicht-erlaubt');
  ktoAussteller(aussteller);
  const zweiterElternteil = aussteller !== null && aussteller.art === 'parent' && art === 'parent';
  if (zweiterElternteil ? !(ktoObj(familie) && ktoPid(familie.person) && ktoPub(familie.pub)) : familie !== undefined) throw ktoFehler('nicht-erlaubt');
  const n = kontoName(anmeldename);
  if (!n) throw ktoFehler('name-ungueltig');
  if ((await zugang.directory(await kontoLookup(n))) !== null) throw ktoFehler('name-vergeben');
  const code = ktoB64url(rand(16)), kennung = kontoKennung(rand), gueltigBis = now + KONTO_STARTCODE_MS;
  const inhalt = { v: 1, anmeldename: n, kennung, art, ausgestellt: now, gueltigBis, aussteller: aussteller === null ? null : { kennung: aussteller.kennung, art: aussteller.art, pub: { ...aussteller.pub } } };
  if (zweiterElternteil) inhalt.familie = { person: familie.person, pub: { ...familie.pub } };
  return ktoAusgeben(zugang, aussteller, inhalt, code, await ktoStart(code), rand);
}

/* "new password" of a child (task "Einladungen", concept 8.2): a start code for the existing child account. The child
   makes new keys with it; the parents give it every area key again (module bereiche), nothing is lost.
   aussteller: an opened parent account; kennung, anker ({ kennung, pub }): what the parent knows of the child (family) -
   they must match the child's directory entry. buergschaft: needed when the issuer is not the child's anker (the family_set
   about the issuer, signed by the anker: { area, event, sig }). ankerKette: the anker's announcements of new keys, when
   he renewed his key (task "Neuer Schluessel"; [{ area, event, sig }], module einladung).
   -> like startcodeAusstellen */
export async function neustartAusstellen({ zugang, aussteller, anmeldename, kennung, anker, buergschaft, ankerKette, now, rand = ktoRand } = {}) {
  ktoZugang(zugang);
  if (!Number.isFinite(now)) throw ktoFalsch('"now" fehlt.');
  if (!ktoObj(aussteller) || aussteller.art !== 'parent') throw ktoFehler('nicht-erlaubt');
  ktoAussteller(aussteller);
  const n = kontoName(anmeldename);
  if (!n) throw ktoFehler('name-ungueltig');
  const lookup = await kontoLookup(n), basis = await zugang.directory(lookup);
  if (!ktoEintragOk(basis, lookup) || basis.art !== 'child' || basis.kennung !== kennung || !ktoAnker(basis.anker) || !ktoAnker(anker) || basis.anker.kennung !== anker.kennung || !ktoGleichePub(basis.anker.pub, anker.pub)) throw ktoFehler('nicht-erlaubt');
  const code = ktoB64url(rand(16)), s = await ktoStart(code), gueltigBis = now + KONTO_STARTCODE_MS;
  const inhalt = { v: 1, anmeldename: n, kennung, art: 'child', ausgestellt: now, gueltigBis, aussteller: { kennung: aussteller.kennung, art: 'parent', pub: { ...aussteller.pub } }, neu: true, id: s.id, anker: { kennung: anker.kennung, pub: { ...anker.pub } } };
  if (buergschaft !== undefined) inhalt.buergschaft = buergschaft;
  if (ankerKette !== undefined) inhalt.ankerKette = ankerKette;
  // the child's next device would refuse an entry made with it: do not hand out such a code
  if (!(await ktoVollmachtOk({ inhalt, sig: await signBytes(aussteller.schluessel, 'bq-start|' + ktoKanon(inhalt)) }, basis))) throw ktoFehler('nicht-erlaubt');
  return ktoAusgeben(zugang, aussteller, inhalt, code, s, rand);
}

/* opens the content of an invitation -> { inhalt, sig }; null if it is not a valid start code */
async function ktoStartLesen(s, gespeichert) {
  let x;
  try { x = JSON.parse(await openEntryText(s.key, gespeichert, s.aad)); } catch (e) { return null; }
  const i = ktoObj(x) ? x.inhalt : null;
  if (!ktoObj(i) || i.v !== 1 || kontoName(i.anmeldename) !== i.anmeldename || !ktoPid(i.kennung) || !KONTO_ARTEN.includes(i.art) || !Number.isFinite(i.ausgestellt) || i.gueltigBis !== i.ausgestellt + KONTO_STARTCODE_MS) return null;
  if (i.aussteller === null) return i.art === 'admin' && x.sig === null && i.familie === undefined && i.neu === undefined ? { inhalt: i, sig: null } : null;
  const a = i.aussteller;
  if (!ktoObj(a) || !ktoPid(a.kennung) || !ktoPub(a.pub) || !(KONTO_AUSSTELLER[a.art] || []).includes(i.art) || !ktoStr(x.sig)) return null;
  const zweiterElternteil = a.art === 'parent' && i.art === 'parent';
  if (zweiterElternteil ? !(ktoObj(i.familie) && ktoPid(i.familie.person) && ktoPub(i.familie.pub)) : i.familie !== undefined) return null;
  if (i.neu === undefined ? i.id !== undefined || i.anker !== undefined || i.buergschaft !== undefined || i.ankerKette !== undefined : !(i.neu === true && i.art === 'child' && a.art === 'parent' && i.id === s.id && ktoAnker(i.anker))) return null;
  return (await verifyBytes(a.pub, 'bq-start|' + ktoKanon(i), x.sig)) ? { inhalt: i, sig: x.sig } : null;
}

/* new keys for an existing child account with a "new password" start code -> the opened account */
async function ktoNeustart(zugang, s, inhalt, sig, passwort, runden, rand) {
  const lookup = await kontoLookup(inhalt.anmeldename), kennung = inhalt.kennung;
  const basis = await zugang.directory(lookup);
  if (!ktoEintragOk(basis, lookup) || basis.art !== 'child' || basis.kennung !== kennung || !(await ktoVollmachtOk({ inhalt, sig }, basis))) throw ktoFehler('startcode-ungueltig');
  const akt = await ktoAktuell(zugang, basis);
  if (Object.prototype.hasOwnProperty.call(akt.neu, inhalt.id)) {
    // an earlier try with this code wrote the entry, but the answer got lost: the same password opens it
    const n = akt.neu[inhalt.id], e = await zugang.directory(lookup + '-' + n);
    const schluessel = akt.stand === n ? await ktoOeffnen(e.gesperrt, kennung, e.pub, 0, passwort, runden) : null;
    if (!schluessel) throw ktoFehler('startcode-ungueltig');
    return ktoKonto(basis, inhalt.anmeldename, schluessel, n, e.pub);
  }
  if (akt.naechster === null) throw ktoFehler('konflikt');
  const keys = await newPersonKeys(), pub = await publicKeysOf(keys), n = akt.naechster;
  const gesperrt = await lockPersonKeys(keys, kennung, [passwort], { rounds: runden, rand });
  const e = { v: 1, lookup: lookup + '-' + n, stand: n, kennung, pub, gesperrt };
  e.beweis = await ktoHmac(s.beweis, ktoBeweisText(e));
  e.vollmacht = { inhalt, sig };
  e.sig = await signBytes(keys, ktoNeuText(e));
  try { await zugang.putDirectory(e); } catch (err) { throw err && err.code === 'vorhanden' ? ktoFehler('konflikt') : err; }
  const schluessel = await ktoOeffnen(gesperrt, kennung, pub, 0, passwort, runden);
  if (!schluessel) throw ktoFalsch('Schloss laesst sich nicht oeffnen.');
  return ktoKonto(basis, inhalt.anmeldename, schluessel, n, pub);
}

/* ---------- look at a start code without using it (task "Erstanmeldung per QR-Code", 06.11.) ----------
   Opening the link of an invitation shows at once what it is for: the login name and the kind of account (no role
   choice), a new account or a child's new password - or that the code is used up, withdrawn or expired, before anybody
   chooses a password. The storage hands out an invitation only once (invite.get), so it is put back right away with the
   validity it had left (like ersteAnmeldung does after a failed try).
   fingerabdruck: as in ersteAnmeldung - another issuer -> error "fingerabdruck" (the code stays valid).
   -> { anmeldename, art, gueltigBis, neu } or error startcode-ungueltig / startcode-abgelaufen / fingerabdruck (or a
   storage error: offline, zugang, limit) */
export async function startcodeAnsehen({ zugang, code, fingerabdruck, now } = {}) {
  ktoZugang(zugang);
  if (!Number.isFinite(now)) throw ktoFalsch('"now" fehlt.');
  if (typeof code !== 'string' || !KTO_CODE.test(code)) throw ktoFehler('startcode-ungueltig');
  const s = await ktoStart(code);
  let gespeichert;
  try {
    gespeichert = await zugang.invite.get(s.id);
  } catch (err) {
    if (err && err.code === 'unbekannt') throw ktoFehler('startcode-ungueltig');
    if (err && err.code === 'abgelaufen') throw ktoFehler('startcode-abgelaufen');
    throw err;
  }
  const gelesen = await ktoStartLesen(s, gespeichert);
  if (!gelesen) throw ktoFehler('startcode-ungueltig');      // not a start code of this app: not put back
  const inhalt = gelesen.inhalt;
  if (now >= inhalt.gueltigBis) throw ktoFehler('startcode-abgelaufen');
  await zugang.invite.put(s.id, gespeichert, { gueltigMs: Math.min(KONTO_STARTCODE_MS, inhalt.gueltigBis - now) });
  if (fingerabdruck !== undefined && fingerabdruck !== null) {
    const fp = inhalt.aussteller === null ? null : await keyFingerprint(inhalt.aussteller.pub);
    if (!fp || ktoFp(fingerabdruck) !== fp) throw ktoFehler('fingerabdruck');
  }
  return { anmeldename: inhalt.anmeldename, art: inhalt.art, gueltigBis: inhalt.gueltigBis, neu: inhalt.neu === true };
}

/* ---------- first login with the start code ---------- */
/* code + own password -> new person keys, account in the directory, the start code is used up.
   fingerabdruck: the issuer's fingerprint from the start QR code (task "Einladungen", US6.5) - if given and the signed
   issuer has another one: error "fingerabdruck", nothing is created, the code stays valid.
   runden: PBKDF2 rounds of the locks (the app: 600 000; tests pass fewer); rand: randomness (tests).
   -> { kennung, art, anmeldename, pub, schluessel (not extractable), stand, wiederherstellungscode (grown-ups; else null),
        aussteller: null | { kennung, art, pub, fingerabdruck },
        anker: a child's creating parent { person, role, pub } (else null), familie: the family a second parent joins
        { person, role, pub } (else null), neu: true for a child's "new password" (new keys, stand > 1) }
   If the storage fails after the code was fetched, the code is put back (still valid until its end). If an earlier try
   with this code created the account but the answer got lost, the same code and password finish it (with a new
   recovery code, since the first one was never shown). */
export async function ersteAnmeldung({ zugang, code, passwort, fingerabdruck, now, runden = PBKDF2_ROUNDS, rand = ktoRand } = {}) {
  ktoZugang(zugang); ktoRunden(runden);
  if (!Number.isFinite(now)) throw ktoFalsch('"now" fehlt.');
  if (typeof code !== 'string' || !KTO_CODE.test(code)) throw ktoFehler('startcode-ungueltig');
  if (typeof passwort !== 'string' || pwWeak(passwort)) throw ktoFehler('passwort-schwach');
  const s = await ktoStart(code);
  let gespeichert;
  try {
    gespeichert = await zugang.invite.get(s.id);
  } catch (err) {
    if (err && err.code === 'unbekannt') throw ktoFehler('startcode-ungueltig');
    if (err && err.code === 'abgelaufen') { try { await zugang.invite.delete(s.id); } catch (e) { /* stays until the next try */ } throw ktoFehler('startcode-abgelaufen'); }
    throw err;
  }
  const gelesen = await ktoStartLesen(s, gespeichert);
  if (!gelesen) throw ktoFehler('startcode-ungueltig');
  const inhalt = gelesen.inhalt;
  if (now >= inhalt.gueltigBis) throw ktoFehler('startcode-abgelaufen');
  // put the code back when this try ends without an account (password too weak, wrong fingerprint, storage gone)
  const zurueck = async () => { try { await zugang.invite.put(s.id, gespeichert, { gueltigMs: Math.min(KONTO_STARTCODE_MS, inhalt.gueltigBis - now) }); } catch (e) { /* then a new code is needed */ } };
  if (pwWeak(passwort, inhalt.anmeldename)) { await zurueck(); throw ktoFehler('passwort-schwach'); }
  const aussteller = inhalt.aussteller === null ? null : { ...inhalt.aussteller, fingerabdruck: await keyFingerprint(inhalt.aussteller.pub) };
  if (fingerabdruck !== undefined && fingerabdruck !== null && (!aussteller || ktoFp(fingerabdruck) !== aussteller.fingerabdruck)) { await zurueck(); throw ktoFehler('fingerabdruck'); }
  const ankerVon = (a) => ({ person: a.kennung, role: 'parent', pub: { ...a.pub } });
  const dazu = {
    aussteller,
    anker: inhalt.art !== 'child' ? null : ankerVon(inhalt.neu ? inhalt.anker : inhalt.aussteller),
    familie: inhalt.familie ? { person: inhalt.familie.person, role: 'parent', pub: { ...inhalt.familie.pub } } : null,
    neu: inhalt.neu === true,
  };
  try {
    if (inhalt.neu) return { ...(await ktoNeustart(zugang, s, inhalt, gelesen.sig, passwort, runden, rand)), wiederherstellungscode: null, ...dazu };
    const lookup = await kontoLookup(inhalt.anmeldename), kennung = inhalt.kennung, art = inhalt.art;
    const wcode = art === 'child' ? null : ktoNeuerCode(rand);
    const neu = await newPersonKeys(), pub = await publicKeysOf(neu);
    const gesperrt = await lockPersonKeys(neu, kennung, wcode ? [passwort, wcode] : [passwort], { rounds: runden, rand });
    const eintrag = { v: 1, lookup, kennung, art, pub, gesperrt };
    if (art === 'child') eintrag.anker = { kennung: aussteller.kennung, pub: { ...aussteller.pub } };
    eintrag.beweis = await ktoHmac(s.beweis, ktoBeweisText(eintrag));
    try {
      await zugang.putDirectory(eintrag);
    } catch (err) {
      if (!err || err.code !== 'vorhanden') throw err;
      // the name is taken: by an earlier try with this very code (same person id) - or by somebody else
      const da = await zugang.directory(lookup);
      if (!ktoEintragOk(da, lookup) || da.kennung !== kennung) throw ktoFehler('name-vergeben');
      const akt = await ktoAktuell(zugang, da);
      const offen = await ktoOeffnen(akt.gesperrt, kennung, akt.pub, 0, passwort, runden, true);
      if (!offen) throw ktoFehler('name-vergeben');
      const wneu = da.art === 'child' ? null : ktoNeuerCode(rand);
      const g2 = await lockPersonKeys(offen, kennung, wneu ? [passwort, wneu] : [passwort], { rounds: runden, rand });
      const stand = await ktoNeuerStand(zugang, da, akt.naechster, g2, offen, akt.pub);
      const schluessel = await ktoOeffnen(g2, kennung, akt.pub, 0, passwort, runden);
      return { ...ktoKonto(da, inhalt.anmeldename, schluessel, stand, akt.pub), wiederherstellungscode: wneu, ...dazu };
    }
    // the device keeps a copy that cannot be exported: open the lock just written (this also proves it opens)
    const schluessel = await ktoOeffnen(gesperrt, kennung, pub, 0, passwort, runden);
    if (!schluessel) throw ktoFalsch('Schloss laesst sich nicht oeffnen.');
    return { ...ktoKonto(eintrag, inhalt.anmeldename, schluessel, 1), wiederherstellungscode: wcode, ...dazu };
  } catch (err) {
    if (!err || err.code !== 'name-vergeben') await zurueck();
    throw err;
  }
}

/* ---------- login on a new device (US9.3) ---------- */
/* login name + password -> { kennung, art, anmeldename, pub, schluessel (not extractable), stand }.
   Wrong name and wrong password: the same error "anmeldung" after the same work. */
export async function anmelden({ zugang, anmeldename, passwort, runden = PBKDF2_ROUNDS } = {}) {
  ktoZugang(zugang); ktoRunden(runden);
  const n = kontoName(anmeldename);
  if (!n || typeof passwort !== 'string' || !passwort) throw ktoFehler('anmeldung');
  const lookup = await kontoLookup(n);
  const e = await zugang.directory(lookup);
  if (!ktoEintragOk(e, lookup)) {
    // the same requests and the same work as for a wrong password (the second directory read looks for a new password)
    await zugang.directory(lookup + '-2');
    await ktoBlind(passwort, runden);
    throw ktoFehler('anmeldung');
  }
  const akt = await ktoAktuell(zugang, e);
  const schluessel = await ktoOeffnen(akt.gesperrt, e.kennung, akt.pub, 0, passwort, runden);
  if (!schluessel) throw ktoFehler('anmeldung');
  return ktoKonto(e, n, schluessel, akt.stand, akt.pub);
}

/* ---------- recovery code (US9.4) ---------- */
/* grown-ups: login name + recovery code + new password -> the account with a NEW recovery code (show it at once).
   Task "Neuer Schluessel" (Peter's proposal, 04.11.): always with NEW keys - whoever had the old password and a copy of
   the storage then reads nothing new. -> like schluesselErneuern.
   A child has no recovery code (its parent gives a new start code - task "Einladungen"). */
export async function wiederherstellen({ zugang, anmeldename, code, neuesPasswort, runden = PBKDF2_ROUNDS, rand = ktoRand } = {}) {
  ktoZugang(zugang); ktoRunden(runden);
  const n = kontoName(anmeldename), form = ktoCodeForm(code);
  if (!n || !form) throw ktoFehler('anmeldung');
  if (typeof neuesPasswort !== 'string' || pwWeak(neuesPasswort, n)) throw ktoFehler('passwort-schwach');
  const lookup = await kontoLookup(n);
  const e = await zugang.directory(lookup);
  if (!ktoEintragOk(e, lookup) || e.art === 'child') { await zugang.directory(lookup + '-2'); await ktoBlind(form, runden); throw ktoFehler('anmeldung'); }
  const akt = await ktoAktuell(zugang, e);
  const offen = await ktoOeffnen(akt.gesperrt, e.kennung, akt.pub, 1, form, runden);
  if (!offen) throw ktoFehler('anmeldung');
  const neu = await ktoErneuern(zugang, e, akt, offen, neuesPasswort, runden, rand);
  return { ...ktoKonto(e, n, neu.schluessel, neu.stand, neu.pub), wiederherstellungscode: neu.wcode, fingerabdruck: await keyFingerprint(neu.pub), alt: { pub: { ...akt.pub }, schluessel: offen } };
}

/* ---------- new person key (task "Neuer Schluessel", US9.7, concept 8.4) ---------- */
/* grown-ups ("Schluessel erneuern" - after a suspicion, and when one of their devices is removed): login name + the
   current password + a new password -> NEW keys, locked with the new password and a new recovery code (show it at once),
   announced with the old keys. The current password is asked again, so a stolen device that is still logged in cannot
   renew the key and lock its owner out. The new password must differ from the current one ("passwort-gleich").
   -> { kennung, art, anmeldename, pub (new), schluessel (new, not extractable), stand, ursprung, wiederherstellungscode,
        fingerabdruck (of the new keys), alt: { pub, schluessel } } - alt goes with the account into the next sync
   (module einladung abgleichMitVerbindungen / geraeteabgleich): every area gets the announcement and a new key version;
   the app keeps alt only until the sync reports nothing open (erneuerungOffen), never stores it. */
export async function schluesselErneuern({ zugang, anmeldename, passwort, neuesPasswort, runden = PBKDF2_ROUNDS, rand = ktoRand } = {}) {
  ktoZugang(zugang); ktoRunden(runden);
  const n = kontoName(anmeldename);
  if (!n || typeof passwort !== 'string' || !passwort) throw ktoFehler('anmeldung');
  if (typeof neuesPasswort !== 'string' || pwWeak(neuesPasswort, n)) throw ktoFehler('passwort-schwach');
  const lookup = await kontoLookup(n);
  const e = await zugang.directory(lookup);
  if (!ktoEintragOk(e, lookup)) { await zugang.directory(lookup + '-2'); await ktoBlind(passwort, runden); throw ktoFehler('anmeldung'); }
  const akt = await ktoAktuell(zugang, e);
  const alt = await ktoOeffnen(akt.gesperrt, e.kennung, akt.pub, 0, passwort, runden);
  if (!alt) throw ktoFehler('anmeldung');
  if (e.art === 'child') throw ktoFehler('nicht-erlaubt');              // a child gets new keys from its parents (new password)
  if (neuesPasswort.normalize('NFC') === passwort.normalize('NFC')) throw ktoFehler('passwort-gleich');
  const neu = await ktoErneuern(zugang, e, akt, alt, neuesPasswort, runden, rand);
  return { ...ktoKonto(e, n, neu.schluessel, neu.stand, neu.pub), wiederherstellungscode: neu.wcode, fingerabdruck: await keyFingerprint(neu.pub), alt: { pub: { ...akt.pub }, schluessel: alt } };
}

/* ---------- for module einladung ---------- */
/* the public state of an account as every device sees it (no password needed) -> { kennung, art, pub, stand, neu } or null.
   pub = the keys of the entry that counts now; neu = { <invitation id>: stand } of the entries with new keys that count */
export async function kontoStand({ zugang, anmeldename } = {}) {
  ktoZugang(zugang);
  const n = kontoName(anmeldename);
  if (!n) return null;
  const lookup = await kontoLookup(n), e = await zugang.directory(lookup);
  if (!ktoEintragOk(e, lookup)) return null;
  const akt = await ktoAktuell(zugang, e);
  return { kennung: e.kennung, art: e.art, pub: { ...akt.pub }, stand: akt.stand, neu: { ...akt.neu } };
}

/* the fingerprint of public keys (6 words; module einladung shows it when a parent renewed his key) */
export async function kontoFingerabdruck(pub) {
  if (!ktoPub(pub)) throw ktoFalsch('pub erwartet.');
  return keyFingerprint(pub);
}

/* ---------- for module geraeteabgleich ---------- */
/* an opened account -> the "personen" entry of geraetAbgleichen: { <kennung>: { role, keys, pub, ursprung?, alt? } } (pub =
   the keys of the entry that counts now - for a child after "new password" the new ones; task "Neuer Schluessel":
   ursprung = anchor of the own area when it differs from pub, alt = { keys, pub } right after renewing) */
export function kontoPersonen(...konten) {
  const out = {};
  for (const k of konten) {
    if (!ktoObj(k) || !ktoPid(k.kennung) || !KONTO_ARTEN.includes(k.art) || !ktoObj(k.schluessel) || !ktoPub(k.pub)) throw ktoFalsch('geoeffnetes Konto erwartet.');
    if ((k.ursprung !== undefined && !ktoPub(k.ursprung)) || (k.alt !== undefined && k.alt !== null && !(ktoObj(k.alt) && ktoObj(k.alt.schluessel) && ktoPub(k.alt.pub)))) throw ktoFalsch('ursprung/alt ungueltig.');
    out[k.kennung] = {
      role: k.art, keys: k.schluessel, pub: { ...k.pub },
      ...(Number.isInteger(k.stand) && k.stand > 1 ? { stand: k.stand } : {}),
      ...(k.ursprung && !ktoGleichePub(k.ursprung, k.pub) ? { ursprung: { ...k.ursprung } } : {}),
      ...(k.alt ? { alt: { keys: k.alt.schluessel, pub: { ...k.alt.pub } } } : {}),
    };
  }
  return out;
}
