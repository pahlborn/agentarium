// Module krypto - keys and encryption for stage 2 (concept section 8; EP6, US6.1-US6.6).
// Web Crypto only (same API in the browser and in Node). No screen, no storage: everything that is stored
// is returned as plain JSON with base64 strings. Test build only (module.json: bau "test").
//
//   content:        AES-256-GCM, random 96-bit IV per entry, additional data (area, key version, entry id)
//   wrap a key:     ephemeral ECDH P-256 -> HKDF-SHA-256 -> AES-GCM (only the recipient can unwrap)
//   sign:           ECDSA P-256 with SHA-256
//   password:       PBKDF2-SHA-256, 600 000 rounds, 16-byte salt (rounds can be passed in for tests)
//   fingerprint:    6 words from the password word list (SHA-256 of both public keys)
//   key change:     every area has a keyring with versions; a removed holder keeps old versions only

import { PW_WORDS } from './passwort.mjs';

export const PBKDF2_ROUNDS = 600000;
const TE = new TextEncoder();
const subtle = () => globalThis.crypto.subtle;
const randomOf = (n) => globalThis.crypto.getRandomValues(new Uint8Array(n));
const FAIL_LOGIN = 'Anmeldung fehlgeschlagen';

export function bytesToB64(u8) { let s = ''; const b = new Uint8Array(u8); for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); }
export function b64ToBytes(s) { const t = atob(String(s)); const u = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) u[i] = t.charCodeAt(i); return u; }

/* additional data: binds a ciphertext to its area, key version and entry (swapping fails) */
export const entryAad = (area, version, entry) => TE.encode(`bq1|${area}|${version}|${entry}`);

/* ---------- content ---------- */
export async function newAreaKey() {
  return subtle().generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}
/* plain: Uint8Array or string; rand: (n) => Uint8Array (tests pass fixed values) */
export async function sealEntry(key, plain, aad, rand = randomOf) {
  const iv = rand(12);
  const data = typeof plain === 'string' ? TE.encode(plain) : plain;
  const ct = new Uint8Array(await subtle().encrypt({ name: 'AES-GCM', iv, additionalData: aad, tagLength: 128 }, key, data));
  return { iv: bytesToB64(iv), ct: bytesToB64(ct) };
}
/* throws if the key, the additional data or a single byte is wrong */
export async function openEntry(key, sealed, aad) {
  return new Uint8Array(await subtle().decrypt({ name: 'AES-GCM', iv: b64ToBytes(sealed.iv), additionalData: aad, tagLength: 128 }, key, b64ToBytes(sealed.ct)));
}
export const openEntryText = async (key, sealed, aad) => new TextDecoder().decode(await openEntry(key, sealed, aad));

/* ---------- password ---------- */
export async function pbkdf2Bits(password, salt, rounds = PBKDF2_ROUNDS, bits = 256) {
  const base = await subtle().importKey('raw', TE.encode(String(password).normalize('NFC')), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await subtle().deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: rounds }, base, bits));
}
/* the unlock key from a password (not extractable) */
export async function derivePasswordKey(password, salt, rounds = PBKDF2_ROUNDS) {
  return subtle().importKey('raw', await pbkdf2Bits(password, salt, rounds), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

/* ---------- person keys ---------- */
export async function newPersonKeys() {
  const ecdh = await subtle().generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const ecdsa = await subtle().generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  return { ecdh, ecdsa };
}
export async function publicKeysOf(keys) {
  return { ecdh: bytesToB64(new Uint8Array(await subtle().exportKey('spki', keys.ecdh.publicKey))), ecdsa: bytesToB64(new Uint8Array(await subtle().exportKey('spki', keys.ecdsa.publicKey))) };
}
const importEcdhPub = (b64) => subtle().importKey('spki', b64ToBytes(b64), { name: 'ECDH', namedCurve: 'P-256' }, true, []);
const importEcdsaPub = (b64) => subtle().importKey('spki', b64ToBytes(b64), { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify']);

/* locks the private keys with the password (and, for grown-ups, a second time with the recovery code).
   personId goes into the additional data: a locked key of one person cannot be passed off as another's. */
export async function lockPersonKeys(keys, personId, secrets, { rounds = PBKDF2_ROUNDS, rand = randomOf } = {}) {
  const priv = JSON.stringify({ ecdh: bytesToB64(new Uint8Array(await subtle().exportKey('pkcs8', keys.ecdh.privateKey))), ecdsa: bytesToB64(new Uint8Array(await subtle().exportKey('pkcs8', keys.ecdsa.privateKey))) });
  const locks = [];
  for (const s of secrets) {
    const salt = rand(16);
    const kek = await derivePasswordKey(s, salt, rounds);
    locks.push({ salt: bytesToB64(salt), rounds, box: await sealEntry(kek, priv, entryAad('person', 1, personId), rand) });
  }
  return { v: 1, person: personId, pub: await publicKeysOf(keys), locks };
}
/* opens with any of the secrets; the private keys come back NOT extractable. Wrong secret: one neutral error.
   exportierbar: true only to lock them again with a new secret (module konto: new password with the recovery code);
   such keys are dropped right afterwards, never kept on the device. */
export async function unlockPersonKeys(locked, personId, secret, { exportierbar = false } = {}) {
  for (const l of locked.locks || []) {
    try {
      const kek = await derivePasswordKey(secret, b64ToBytes(l.salt), l.rounds);
      const priv = JSON.parse(await openEntryText(kek, l.box, entryAad('person', 1, personId)));
      return {
        ecdh: { publicKey: await importEcdhPub(locked.pub.ecdh), privateKey: await subtle().importKey('pkcs8', b64ToBytes(priv.ecdh), { name: 'ECDH', namedCurve: 'P-256' }, exportierbar === true, ['deriveBits']) },
        ecdsa: { publicKey: await importEcdsaPub(locked.pub.ecdsa), privateKey: await subtle().importKey('pkcs8', b64ToBytes(priv.ecdsa), { name: 'ECDSA', namedCurve: 'P-256' }, exportierbar === true, ['sign']) },
      };
    } catch (e) { /* try the next lock */ }
  }
  throw new Error(FAIL_LOGIN);
}

/* ---------- fingerprint ---------- */
export async function keyFingerprint(pub) {
  const d = new Uint8Array(await subtle().digest('SHA-256', TE.encode(`bq-fp|${pub.ecdh}|${pub.ecdsa}`)));
  let n = 0n; for (const b of d) n = (n << 8n) | BigInt(b);
  const words = [], m = BigInt(PW_WORDS.length);
  for (let i = 0; i < 6; i++) { words.push(PW_WORDS[Number(n % m)]); n /= m; }
  return words.join('-');
}

/* ---------- wrap a key for one person ---------- */
const wrapInfo = (area, version, recipientId) => TE.encode(`bq-wrap|${area}|${version}|${recipientId}`);
async function wrapKey(salt, shared, info) {
  const hk = await subtle().importKey('raw', shared, 'HKDF', false, ['deriveKey']);
  return subtle().deriveKey({ name: 'HKDF', hash: 'SHA-256', salt, info }, hk, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
/* wraps areaKey for the recipient's public key. expectedFingerprint (from an invitation) must match, else
   nothing is wrapped (US6.5). */
export async function wrapKeyFor(areaKey, recipient, area, version, { expectedFingerprint, rand = randomOf } = {}) {
  if (expectedFingerprint !== undefined && expectedFingerprint !== await keyFingerprint(recipient.pub)) throw new Error('Fingerabdruck passt nicht – nichts verpackt.');
  const eph = await subtle().generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const shared = new Uint8Array(await subtle().deriveBits({ name: 'ECDH', public: await importEcdhPub(recipient.pub.ecdh) }, eph.privateKey, 256));
  const salt = rand(16);
  const k = await wrapKey(salt, shared, wrapInfo(area, version, recipient.id));
  const raw = new Uint8Array(await subtle().exportKey('raw', areaKey));
  return { epk: bytesToB64(new Uint8Array(await subtle().exportKey('spki', eph.publicKey))), salt: bytesToB64(salt), box: await sealEntry(k, raw, wrapInfo(area, version, recipient.id), rand) };
}
export async function unwrapKey(wrapped, myKeys, myId, area, version) {
  const shared = new Uint8Array(await subtle().deriveBits({ name: 'ECDH', public: await importEcdhPub(wrapped.epk) }, myKeys.ecdh.privateKey, 256));
  const k = await wrapKey(b64ToBytes(wrapped.salt), shared, wrapInfo(area, version, myId));
  const raw = await openEntry(k, wrapped.box, wrapInfo(area, version, myId));
  return subtle().importKey('raw', raw, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
}

/* ---------- signatures ---------- */
export async function signBytes(myKeys, bytes) {
  return bytesToB64(new Uint8Array(await subtle().sign({ name: 'ECDSA', hash: 'SHA-256' }, myKeys.ecdsa.privateKey, typeof bytes === 'string' ? TE.encode(bytes) : bytes)));
}
export async function verifyBytes(pub, bytes, sig) {
  try { return await subtle().verify({ name: 'ECDSA', hash: 'SHA-256' }, await importEcdsaPub(pub.ecdsa), b64ToBytes(sig), typeof bytes === 'string' ? TE.encode(bytes) : bytes); } catch (e) { return false; }
}

/* ---------- keyrings: versions of an area key, wrapped per holder ----------
   ring = { area, current, versions: { "<n>": { "<holderId>": wrapped } } }
   holders: [{ id, pub }] */
export async function createKeyring(area, holders, opts = {}) {
  const key = await newAreaKey(), ring = { area, current: 1, versions: { 1: {} } };
  for (const h of holders) ring.versions[1][h.id] = await wrapKeyFor(key, h, area, 1, opts);
  return { ring, key };
}
/* gives one more person the CURRENT key (e.g. a grant); key = the current area key */
export async function addKeyHolder(ring, key, holder, opts = {}) {
  ring.versions[ring.current][holder.id] = await wrapKeyFor(key, holder, ring.area, ring.current, opts);
  return ring;
}
/* key change (US6.6): a new version for the remaining holders only. Earlier versions stay as they are, so
   everybody keeps reading what they could read before - but nobody removed reads anything new. */
export async function rotateKeyring(ring, holders, opts = {}) {
  const key = await newAreaKey(), v = ring.current + 1;
  ring.versions[v] = {};
  for (const h of holders) ring.versions[v][h.id] = await wrapKeyFor(key, h, ring.area, v, opts);
  ring.current = v;
  return { ring, key };
}
/* all versions this holder can open: Map version -> key */
export async function keysForHolder(ring, myKeys, myId) {
  const out = new Map();
  for (const [v, holders] of Object.entries(ring.versions)) if (holders[myId]) out.set(Number(v), await unwrapKey(holders[myId], myKeys, myId, ring.area, Number(v)));
  return out;
}
