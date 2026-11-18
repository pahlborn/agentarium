// Module anmeldung - helpers of the login screens with accounts in the storage (stage 3b, task "Anmeldung im Testbau";
// concept 10.2, 10.3, 10.6). Test build only (module.json: bau "test", after konto). Pure functions: no screen, no
// browser storage, no clock. The screens are in index.html (KONTO_UI), the accounts themselves in module konto.
//
//   Start link (US9.2): <address>#start=<login name>/<start code>[/<fingerprint>]
//     start code = 22 characters base64url (module konto); fingerprint = the issuer's 6 words (krypto.keyFingerprint),
//     optional - the QR code of task "Einladungen" carries it. "/" never occurs in a name, a code or a fingerprint.
//     The app reads the link once and removes it from the address (browser history).
//   Recovery code in the password manager (concept 10.6): an own entry with the user name "<name> (Wiederherstellungscode)"
//     (EN "(recovery code)") - so it never replaces the login entry "<name>". When the password manager fills that entry
//     into "Forgot your password?", anmNameAusEintrag gives back the login name.
//   Recovery code as a file: anmCodeDatei (text for the share menu / download).
//   Device list: the accounts that logged in on this device [{ id, user, art }] (device data, never synced). The app
//     turns it into accounts v2 like konten.json (anmGeraetKonten -> rechte.normAccounts); children, parents and grants
//     come with task "Einladungen".
//   Guides: anmPunkteErsetzen swaps single points of a guide (<li><b>Label</b> ...</li>) for the login with accounts.
//   The way to the storage and the accounts: index.html calls only this module (anmZugang, anmVersuch, anmErstesMal,
//     anmWiederherstellen, anmName ...), never konto or github directly - so the live build, which has none of these
//     modules, does not even name their functions (search in tests/module/konto.test.mjs).
//
// Names: every helper starts with "anm"/"ANM_" because all modules and index.html share one scope in the app.

//   Task "Einladungen - Oberflaeche" (05.11.): the screens for invitations, devices and new keys call these helpers too
//     (anmAbgleich, anmKindAnlegen, anmElternEinladen, anmKindNeu, anmZurueckziehen, anmGeraete, anmGeraetEntfernen,
//     anmErneuern, anmKindBereit, anmQr ...) - thin wrappers of modules einladung, geraete, konto and qrcode.

//   Task "Erstanmeldung per QR-Code" (06.11.; Vorgabe Peter): the invitation (QR code and link, e-mail) carries the access
//     code of the device AND the start link: <address>#zugang=<access code>&start=<name>/<code>[/<fingerprint>]
//     (anmEinladungslink / anmEinladungLesen; "#start=..." alone and "#zugang=..." alone stay valid). Opening it: the app
//     removes both from the address at once, checks the access code with one request (anmZugangUebernehmen: it always
//     replaces an older one - only when it works), then looks at the start code without using it (anmLinkPruefen ->
//     register, log in because the account exists, or an error). "Connect this device" without a link: scan the QR code
//     in the app (module qrlesen) or paste the link or only the code (anmEingefuegt). Terms (B3): "Zugangscode" /
//     "access code" connects a device, "Passwort" belongs to a person.

import { KONTO_ARTEN, kontoName, kontoLookup, ersteAnmeldung, anmelden, wiederherstellen, schluesselErneuern, kontoFingerabdruck, startcodeAnsehen, kontoStand } from './konto.mjs';
import { githubSpeicher, githubTokenLesen, githubTokenSpeichern } from './github.mjs';
import { verbindungen, kindAnlegen, elternteilEinladen, adminElternEinladen, kindPasswortNeu, einladungZurueckziehen, abgleichMitVerbindungen, anmeldenameVorschlag, kindLokalEntfernen } from './einladung.mjs';
import { meineGeraete, geraetEntfernen } from './geraete.mjs';
import { GERAETEABGLEICH_SPEICHER } from './geraeteabgleich.mjs';
import { bereichName, schluesselLesen } from './bereiche.mjs';
import { zulassungAus, aktiveMitglieder } from './zulassung.mjs';
import { qrSvg } from './qrcode.mjs';
import { qrLesen, QRL_HINWEIS } from './qrlesen.mjs';
import { kindDatenExport, kindDatenLoeschen, kontoDatenLoeschen } from './kinddaten.mjs';
import { deriveSchool } from './ableitung.mjs';
import { mergeLog } from './ereignisse.mjs';

/** Merge the regular child log with the temporary first-start events. */
export function anmKindEreignisseVereinen(regulaer, vorgemerkt, now) {
  return mergeLog([regulaer, vorgemerkt], now).events;
}

/* a start code as module konto issues it: 16 random bytes, base64url */
export const ANM_STARTCODE = /^[A-Za-z0-9_-]{22}$/;
/* the second user name of the recovery code in the password manager (one entry per language) */
export const ANM_EINTRAG = Object.freeze({ de: ' (Wiederherstellungscode)', en: ' (recovery code)' });

const anmFp = (t) => (typeof t === 'string' && /^[a-z]+(-[a-z]+){5}$/i.test(t) ? t : null);
const anmPid = (x) => typeof x === 'string' && /^p_[0-9A-Za-z]{1,40}$/.test(x);
const anmPub = (x) => x && typeof x === 'object' && typeof x.ecdh === 'string' && typeof x.ecdsa === 'string';
const anmGleichePub = (a, b) => anmPub(a) && anmPub(b) && a.ecdh === b.ecdh && a.ecdsa === b.ecdsa;
const anmEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* is this typed text a start code (and not a password)? A start code is random; the form of the app's password suggestion
   ("Judo-Anchor-Key-2947": words, dashes, a number - 15 % of them have 22 characters) is never taken for one. */
export function anmIstStartcode(text) {
  if (typeof text !== 'string') return false;
  const t = text.trim();
  return ANM_STARTCODE.test(t) && !/^[A-Za-z]+(-[A-Za-z]+)*-\d+$/.test(t);
}

/* "#start=<name>/<code>[/<fingerprint>]" -> { anmeldename, code, fingerabdruck (or null) }; anything else -> null */
export function anmStartlinkLesen(hash) {
  const m = /^#start=([^/]+)\/([A-Za-z0-9_-]{22})(?:\/([^/]+))?$/.exec(String(hash === undefined || hash === null ? '' : hash));
  if (!m) return null;
  let name;
  try { name = decodeURIComponent(m[1]); } catch (e) { return null; }
  const n = kontoName(name);
  if (!n) return null;
  const fp = m[3] === undefined ? null : anmFp(m[3]);
  if (m[3] !== undefined && !fp) return null;
  return { anmeldename: n, code: m[2], fingerabdruck: fp };
}

/* the start link for a start code (tool, later the screen of task "Einladungen") */
export function anmStartlink(adresse, { anmeldename, code, fingerabdruck = null } = {}) {
  const n = kontoName(anmeldename);
  if (!n || typeof code !== 'string' || !ANM_STARTCODE.test(code)) throw new Error('anmeldung: Name oder Startcode ungueltig.');
  if (fingerabdruck !== null && !anmFp(fingerabdruck)) throw new Error('anmeldung: Fingerabdruck ungueltig.');
  return String(adresse || '').split('#')[0] + '#start=' + encodeURIComponent(n) + '/' + code + (fingerabdruck ? '/' + fingerabdruck : '');
}

/* ---------- invitation with access code (task "Erstanmeldung per QR-Code", 06.11.) ---------- */
/* an access code as the storage takes it (module github: printable characters, no space) */
export const ANM_ZUGANG = /^[\x21-\x7e]{8,255}$/;
/* "#zugang=<code>", "#start=<name>/<code>[/<fp>]" or both joined by "&" -> { zugang (or null), start (or null) };
   anything else (other parts, a part twice, a broken value) -> null */
export function anmEinladungLesen(hash) {
  const h = String(hash === undefined || hash === null ? '' : hash);
  if (!h.startsWith('#') || h.length < 2) return null;
  const werte = {};
  for (const teil of h.slice(1).split('&')) {
    const i = teil.indexOf('=');
    if (i <= 0) return null;
    const k = teil.slice(0, i);
    if ((k !== 'zugang' && k !== 'start') || Object.prototype.hasOwnProperty.call(werte, k)) return null;
    werte[k] = teil.slice(i + 1);
  }
  let zugang = null, start = null;
  if (werte.zugang !== undefined) {
    try { zugang = decodeURIComponent(werte.zugang); } catch (e) { return null; }
    if (!ANM_ZUGANG.test(zugang)) return null;
  }
  if (werte.start !== undefined) {
    start = anmStartlinkLesen('#start=' + werte.start);
    if (!start) return null;
  }
  return zugang || start ? { zugang, start } : null;
}
/* the link of an invitation: access code and/or start link (same start link format as anmStartlink) */
export function anmEinladungslink(adresse, { zugang = null, anmeldename, code = null, fingerabdruck = null } = {}) {
  const teile = [];
  if (zugang !== null && zugang !== undefined) {
    if (typeof zugang !== 'string' || !ANM_ZUGANG.test(zugang)) throw new Error('anmeldung: Zugangscode ungueltig.');
    teile.push('zugang=' + encodeURIComponent(zugang));
  }
  if (code !== null && code !== undefined) teile.push(anmStartlink('', { anmeldename, code, fingerabdruck }).slice(1));
  if (!teile.length) throw new Error('anmeldung: Zugangscode oder Startcode fehlt.');
  return String(adresse || '').split('#')[0] + '#' + teile.join('&');
}
/* the address of the app without "#...", "?..." and "index.html" (to compare links) */
const anmBasis = (a) => String(a || '').split('#')[0].split('?')[0].replace(/index\.html$/i, '').replace(/\/+$/, '').toLowerCase();
/* "Connect this device": a pasted text or a scanned QR code -> { zugang, start } (whole link, or only the access code),
   { fremd: true } for a link of another address (another version of the app: test, family), or null.
   Line breaks and spaces (a link wrapped by the mail program) do not count. */
export function anmEingefuegt(text, adresse) {
  const roh = String(text === undefined || text === null ? '' : text).trim(), t = roh.replace(/\s+/g, '');
  if (!t) return null;
  const i = t.indexOf('#');
  if (i >= 0) {
    if (i > 0 && adresse !== undefined && anmBasis(t.slice(0, i)) !== anmBasis(adresse)) return /^https?:\/\//i.test(t) ? { fremd: true } : null;
    return anmEinladungLesen(t.slice(i));
  }
  if (/^https?:\/\//i.test(t) || /[=&/]/.test(t) || /\s/.test(roh)) return null;          // only the code: one word
  return ANM_ZUGANG.test(t) ? { zugang: t, start: null } : null;
}
/* checks an access code with the storage - one request.
   -> 'ok' | 'falsch' (wrong or expired: GitHub does not tell which) | 'offline' | 'limit'.
   A storage without access code (tests: the simulation) -> 'ok'. */
export async function anmZugangPruefen({ speicher, token, fetch, geraet = 'd_Pruefen' } = {}) {
  if (speicher && typeof speicher.geraet === 'function') return 'ok';
  if (!speicher || speicher.art !== 'github') return 'falsch';
  let z;
  try {
    z = githubSpeicher({ repo: speicher.repo, token: String(token || '').trim(), wurzel: speicher.wurzel || '', ...(speicher.basis ? { basis: speicher.basis } : {}), ...(fetch ? { fetch } : {}) }).geraet(geraet);
  } catch (err) { return 'falsch'; }
  try { return (await z.verbunden()) ? 'ok' : 'falsch'; }
  catch (err) {
    const c = err && err.code;
    if (c === 'offline' || c === 'limit') return c;
    if (c === 'zugang' || c === 'ungueltig') return 'falsch';
    throw err;
  }
}
/* takes an access code: checked first; only one that works is stored - it then always replaces an older one. A code
   that does not work is not kept (an older one stays as it was). -> the result of anmZugangPruefen */
export async function anmZugangUebernehmen({ ablage, speicher, token, fetch, geraet } = {}) {
  const t = String(token === undefined || token === null ? '' : token).trim();
  if (!ANM_ZUGANG.test(t)) return 'falsch';
  const r = await anmZugangPruefen({ speicher, token: t, fetch, geraet });
  if (r === 'ok' && speicher && speicher.art === 'github') githubTokenSpeichern(ablage, t);
  return r;
}
/* the start link of an invitation, before anybody types a password (one look at the code, it stays valid):
   -> { art: 'registrieren', anmeldename, rolle, neu }  the code works: choose the own password (neu: a child's new one)
      { art: 'anmelden', anmeldename, rolle }          the code is used up or expired, the account exists: the same link
                                                        connects a device again (Safari forgets a page after ~7 days)
      { art: 'fehler', code }                          startcode-ungueltig / startcode-abgelaufen / fingerabdruck
   rolle = kind of account (admin, teacher, parent, child). Errors of the storage (offline, zugang, limit) are thrown. */
export async function anmLinkPruefen({ zugang, start, now } = {}) {
  try {
    const s = await startcodeAnsehen({ zugang, code: start.code, fingerabdruck: start.fingerabdruck || undefined, now });
    return { art: 'registrieren', anmeldename: s.anmeldename, rolle: s.art, neu: s.neu };
  } catch (err) {
    const c = err && err.code;
    if (c === 'startcode-ungueltig' || c === 'startcode-abgelaufen') {
      const st = await kontoStand({ zugang, anmeldename: start.anmeldename });
      return st ? { art: 'anmelden', anmeldename: start.anmeldename, rolle: st.art } : { art: 'fehler', code: c };
    }
    if (c === 'fingerabdruck') return { art: 'fehler', code: c };
    throw err;
  }
}
/* a name for this device in "Meine Geraete": browser and Home Screen app are two devices (own storage) -> "iPhone (Safari)"
   / "iPhone (App)"; ua = navigator.userAgent, touch = more than one touch point (iPad with a Mac user agent) */
export function anmGeraetName({ ua = '', touch = false, standalone = false } = {}) {
  const u = String(ua || '');
  const os = /iPad/.test(u) || (/Macintosh/.test(u) && touch) ? 'iPad' : /iPhone/.test(u) ? 'iPhone' : /Android/.test(u) ? 'Android' : /Macintosh|Mac OS X/.test(u) ? 'Mac' : /Windows/.test(u) ? 'Windows' : /CrOS/.test(u) ? 'Chromebook' : /Linux/.test(u) ? 'Linux' : '';
  const br = /Edg\//.test(u) ? 'Edge' : /CriOS|Chrome\//.test(u) ? 'Chrome' : /FxiOS|Firefox\//.test(u) ? 'Firefox' : /Safari\//.test(u) ? 'Safari' : '';
  const wie = standalone ? 'App' : br;
  return os && wie ? `${os} (${wie})` : os || wie;
}
/* the invitation as an e-mail draft (an HTML file the grown-up sends himself): QR code and link, valid 7 days, once.
   qr = the QR code as SVG (anmQr); bis = end of validity (ms); sprache 'de' | 'en'. -> { betreff, html, dateiname } */
export function anmEinladungMail({ link, qr, anmeldename, bis, sprache = 'de' } = {}) {
  const n = kontoName(anmeldename);
  if (!n || typeof link !== 'string' || !link || typeof qr !== 'string' || !qr || !Number.isFinite(bis)) throw new Error('anmeldung: Einladung unvollstaendig.');
  const de = sprache !== 'en', T = 'title';   // (the builds of the test instance and the family version look for the app's own <title> - only once)
  const x = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const d = new Date(bis), p = (z) => String(z).padStart(2, '0');
  const datum = de ? `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}, ${p(d.getHours())}:${p(d.getMinutes())} Uhr` : `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}, ${(d.getHours() % 12) || 12}:${p(d.getMinutes())} ${d.getHours() < 12 ? 'AM' : 'PM'}`;
  const betreff = de ? `Big Quest – Ihre Einladung (${n})` : `Big Quest – your invitation (${n})`;
  const absaetze = de ? [
    `Sie sind zu <b>Big Quest</b> eingeladen. Ihr Anmeldename: <b>${x(n)}</b>.`,
    '<b>Lesen Sie dies auf dem iPhone oder iPad selbst, tippen Sie auf den Link:</b>',
    `<a href="${x(link)}">Big Quest öffnen und anmelden</a><br><span style="font-size:.75rem;word-break:break-all;color:#556">${x(link)}</span>`,
    '<b>Sonst:</b> Den QR-Code mit der Kamera des Geräts scannen, auf dem Sie Big Quest nutzen möchten.',
    'Danach legen Sie Ihr eigenes Passwort fest – Ihr Gerät schlägt ein starkes vor und merkt es sich.',
    `Die Einladung gilt 7 Tage (bis ${x(datum)}) und nur für eine Anmeldung. Ein weiteres Gerät verbinden Sie später mit demselben Link oder QR-Code. Bitte nicht weitergeben.`
  ] : [
    `You are invited to <b>Big Quest</b>. Your login name: <b>${x(n)}</b>.`,
    '<b>If you are reading this on your iPhone or iPad, tap the link:</b>',
    `<a href="${x(link)}">Open Big Quest and log in</a><br><span style="font-size:.75rem;word-break:break-all;color:#556">${x(link)}</span>`,
    '<b>Otherwise:</b> scan the QR code with the camera of the device you want to use Big Quest on.',
    'Then you choose your own password – your device suggests a strong one and remembers it.',
    `The invitation works for 7 days (until ${x(datum)}) and for one sign-up. You can connect another device later with the same link or QR code. Please do not pass it on.`
  ];
  const html = `<!doctype html>\n<html lang="${de ? 'de' : 'en'}">\n<head><meta charset="utf-8"><${T}>${x(betreff)}</${T}></head>\n<body style="font-family:-apple-system,system-ui,sans-serif;max-width:34rem;margin:1.5rem auto;padding:0 1rem;color:#1d2433">\n<p style="font-size:.85rem;color:#556">${de ? 'Betreff' : 'Subject'}: ${x(betreff)}</p>\n${absaetze.slice(0, 3).map((a) => `<p>${a}</p>`).join('\n')}\n<div style="width:240px;margin:1rem 0">${qr}</div>\n${absaetze.slice(3).map((a) => `<p>${a}</p>`).join('\n')}\n</body>\n</html>\n`;
  return { betreff, html, dateiname: (de ? 'Big-Quest-Einladung-' : 'Big-Quest-invitation-') + n + '.html' };
}

/* user name of the recovery code's own entry in the password manager */
export function anmCodeEintrag(anmeldename, sprache = 'de') {
  return String(anmeldename) + (sprache === 'en' ? ANM_EINTRAG.en : ANM_EINTRAG.de);
}
/* typed or filled-in user name -> the login name (without the recovery entry's addition, trimmed, small letters) */
export function anmNameAusEintrag(text) {
  let t = String(text === undefined || text === null ? '' : text).trim();
  for (const z of Object.values(ANM_EINTRAG)) if (t.toLowerCase().endsWith(z.toLowerCase())) t = t.slice(0, t.length - z.length).trim();
  return t.toLowerCase();
}

/* the recovery code as a file to share or keep: { name, text } (datum: "YYYY-MM-DD") */
export function anmCodeDatei({ anmeldename, code, datum, sprache = 'de' } = {}) {
  const n = kontoName(anmeldename);
  if (!n || typeof code !== 'string' || !code) throw new Error('anmeldung: Name oder Code fehlt.');
  const de = sprache !== 'en';
  const text = de ? [
    'Big Quest - Wiederherstellungscode',
    '',
    'Anmeldename: ' + n,
    'Wiederherstellungscode: ' + code,
    'Erstellt am: ' + datum,
    '',
    'Wofuer: Passwort vergessen? Auf der Anmeldeseite "Passwort vergessen?" tippen, Anmeldename und diesen Code eingeben',
    'und ein neues Passwort waehlen. Danach zeigt die App einen neuen Code - dieser hier gilt dann nicht mehr.',
    'Sicher aufbewahren und nicht weitergeben.'
  ] : [
    'Big Quest - recovery code',
    '',
    'Login name: ' + n,
    'Recovery code: ' + code,
    'Created on: ' + datum,
    '',
    'What for: forgot your password? On the login page tap "Forgot your password?", enter your login name and this code',
    'and choose a new password. Then the app shows a new code - this one no longer works.',
    'Keep it safe and do not share it.'
  ];
  return { name: (de ? 'Big-Quest-Wiederherstellungscode-' : 'Big-Quest-recovery-code-') + n + '.txt', text: text.join('\n') + '\n' };
}

/* ---------- accounts on this device ---------- */
/* the entry of an opened account (module konto) for the device list */
export function anmEintragAus(konto) {
  return { id: konto.kennung, user: konto.anmeldename, art: konto.art };
}
/* checked device list: only well-formed entries, one per id and per name (the later one wins) */
export function anmListe(liste) {
  const out = [];
  for (const e of Array.isArray(liste) ? liste : []) {
    if (!e || typeof e !== 'object' || !anmPid(e.id) || kontoName(e.user) !== e.user || !KONTO_ARTEN.includes(e.art)) continue;
    for (let i = out.length - 1; i >= 0; i--) if (out[i].id === e.id || out[i].user === e.user) out.splice(i, 1);
    out.push({ id: e.id, user: e.user, art: e.art });
  }
  return out;
}
/* the device list with this entry (replaces an entry with the same id or name) */
export function anmListeMit(liste, eintrag) {
  return anmListe([...anmListe(liste), eintrag]);
}
/* device list -> accounts v2 as in konten.json (without start codes: they are in the storage); rechte.normAccounts
   derives role, admin and children. No guardians yet (task "Einladungen"). */
export function anmGeraetKonten(liste) {
  return {
    version: 2,
    users: anmListe(liste).map((e) => ({ id: e.id, user: e.user, kind: e.art === 'child' ? 'child' : 'adult', ...(e.art === 'teacher' ? { teacher: true } : {}), ...(e.art === 'admin' ? { admin: true } : {}) })),
    guardians: []
  };
}

/* ---------- storage and accounts (the only way of index.html to modules konto and github) ---------- */
/* the access of this device to the storage of the accounts.
   speicher: KONTO_SPEICHER of the app - a storage with geraet() (tests: the simulation) or { art: 'github', repo, wurzel,
   basis? } (test instance); ablage: the browser storage (access key: GITHUB_TOKEN_SCHLUESSEL); geraet: the device id; fetch: for GitHub.
   -> the access, or null (no storage; test instance without access key) */
export function anmZugang(speicher, { ablage, geraet, fetch } = {}) {
  if (speicher && typeof speicher.geraet === 'function') return speicher.geraet(geraet);
  if (speicher && speicher.art === 'github') {
    const token = githubTokenLesen(ablage);
    if (!token) return null;
    return githubSpeicher({ repo: speicher.repo, token, wurzel: speicher.wurzel || '', ...(speicher.basis ? { basis: speicher.basis } : {}), ...(fetch ? { fetch } : {}) }).geraet(geraet);
  }
  return null;
}
/* does this device still need the access key of the test storage? */
export function anmTokenNoetig(speicher, ablage) {
  return !!speicher && speicher.art === 'github' && !githubTokenLesen(ablage);
}
/* the access code of this device (for the QR code of an invitation and "Connect another device"); null without one */
export const anmZugangscode = (speicher, ablage) => (speicher && speicher.art === 'github' ? githubTokenLesen(ablage) : null);
/* stores the access key (trimmed); a broken one -> error (without the value) */
export function anmTokenSpeichern(ablage, token) {
  githubTokenSpeichern(ablage, token);
}
/* login name as module konto compares it, or null */
export const anmName = (text) => kontoName(text);
/* the login form: user name + password or start code.
   -> { erstesMal: { anmeldename, code } } when it is a start code for a name without an account (first login: the person
      chooses a password next), else { konto } (module konto: anmelden; wrong name or password -> error "anmeldung") */
export async function anmVersuch({ zugang, anmeldename, text }) {
  const n = kontoName(anmeldename), code = String(text === undefined || text === null ? '' : text).trim();
  if (n && anmIstStartcode(code) && (await zugang.directory(await kontoLookup(n))) === null) return { erstesMal: { anmeldename: n, code } };
  try {
    return { konto: await anmelden({ zugang, anmeldename, passwort: text }) };
  } catch (err) {
    // a child's "new password" (task "Einladungen"): its account exists, the start code is not its password - the start
    // code itself decides next (konto.ersteAnmeldung: a wrong one -> "startcode-ungueltig")
    if (err && err.code === 'anmeldung' && n && anmIstStartcode(code)) return { erstesMal: { anmeldename: n, code } };
    throw err;
  }
}
/* first login with the start code (module konto: ersteAnmeldung); fingerabdruck only if the QR code / link had one */
export function anmErstesMal({ zugang, code, passwort, fingerabdruck = null, now }) {
  return ersteAnmeldung({ zugang, code, passwort, now, ...(fingerabdruck ? { fingerabdruck } : {}) });
}
/* "Forgot your password?" (module konto: wiederherstellen) */
export function anmWiederherstellen({ zugang, anmeldename, code, neuesPasswort }) {
  return wiederherstellen({ zugang, anmeldename, code, neuesPasswort });
}

/* ---------- invitations, devices, new keys (task "Einladungen - Oberflaeche") ---------- */
/* one sync of this device with everything its opened accounts are connected to (module einladung) */
export function anmAbgleich({ ablage, zugang, konten, now, heute, geraetName, inDieApp = true }) {
  return abgleichMitVerbindungen({ ablage, zugang, konten, now, heute, inDieApp, ...(geraetName ? { geraetName } : {}) });
}
/* families, children, other parents, open invitations of an opened account (from the logs on this device) */
export const anmVerbindungen = ({ ablage, konto, now }) => verbindungen({ ablage, konto, now });
/* a free login name for a child's first name */
export const anmNameVorschlag = ({ zugang, anzeigename }) => anmeldenameVorschlag({ zugang, anzeigename });
/* start QR code for a new child / invitation of the second parent / invitation of a parent by the admin /
   new password of a child / withdraw */
export const anmKindAnlegen = ({ zugang, ablage, konto, anmeldename, anzeigename, now }) => kindAnlegen({ zugang, ablage, konto, anmeldename, anzeigename, now });
export const anmElternEinladen = ({ zugang, ablage, konto, anmeldename, now }) => elternteilEinladen({ zugang, ablage, konto, anmeldename, now });
export const anmAdminElternEinladen = ({ zugang, ablage, konto, anmeldename, anzeigename, now }) => adminElternEinladen({ zugang, ablage, konto, anmeldename, anzeigename, now });
export const anmKindNeu = ({ zugang, ablage, konto, kind, now }) => kindPasswortNeu({ zugang, ablage, konto, kind, now });
export const anmZurueckziehen = ({ zugang, ablage, konto, id, now }) => einladungZurueckziehen({ zugang, ablage, konto, id, now });
/* "Meine Geraete" and "Geraet entfernen" (module geraete) */
export const anmGeraete = ({ ablage, person, now }) => meineGeraete({ ablage, person, now });
export const anmGeraetEntfernen = (o) => geraetEntfernen(o);
/* "Schluessel erneuern" (grown-ups: current and a new password) */
export const anmErneuern = ({ zugang, anmeldename, passwort, neuesPasswort }) => schluesselErneuern({ zugang, anmeldename, passwort, neuesPasswort });
/* the 6 words of public keys (shown next to a QR code: the other side compares them) */
export const anmFingerabdruck = (pub) => kontoFingerabdruck(pub);
/* the QR code of a start link as SVG */
export const anmQr = (text, titel) => qrSvg(text, { ecc: 'M', rand: 4, titel });
/* a QR code in a camera picture (module qrlesen, jsQR) -> its text or null; the licence notice for "About the app" */
export const anmQrLesen = (rgba, breite, hoehe) => qrLesen(rgba, breite, hoehe);
export const ANM_QR_LESER = QRL_HINWEIS;
/* may a child practise on this device? Only once a parent's device took it in: the child holds the current key of its
   learning area (concept 10.3; before that its events would come before the device is registered there). Reads the key
   entries of that area once (one request). -> true / false; a storage error -> false (try again later) */
export async function anmKindBereit({ ablage, zugang, konto, now }) {
  if (!konto || konto.art !== 'child') return true;
  const k = verbindungen({ ablage, konto, now }).kinder.find((c) => c.id === konto.kennung);
  const logAnker = k && k.anker && k.anker.role === 'parent' && anmPid(k.anker.person) && anmPub(k.anker.pub) ? k.anker : null;
  const hatKontoAnker = Object.prototype.hasOwnProperty.call(konto, 'anker');
  const kontoAnker = konto.anker && konto.anker.role === 'parent' && anmPid(konto.anker.person) && anmPub(konto.anker.pub) ? konto.anker : null;
  // An explicit anchor on the account stays the bootstrap source; a remembered local anchor must still describe the same
  // parent, and only the remembered anchor (if present) may contradict that bootstrap source.
  const anker = hatKontoAnker ? kontoAnker : logAnker;
  if (!anker) return false;
  if (logAnker && logAnker.person !== anker.person) return false;
  const gleicherAnker = !!(logAnker && logAnker.person === anker.person && anmGleichePub(logAnker.pub, anker.pub));
  const ankerVertraut = hatKontoAnker ? (!logAnker || gleicherAnker) : !!logAnker;
  const area = bereichName('kind:lern', konto.kennung);
  let st = null;
  try { st = JSON.parse(ablage.getItem(GERAETEABGLEICH_SPEICHER.staende) || '{}')[area]; } catch (e) { st = null; }
  const log = st && Array.isArray(st.log) ? st.log : [];
  try {
    const zul = await zulassungAus(log, { area, anker, now });
    const s = await schluesselLesen(zugang, area, { ich: konto.kennung, meineSchluessel: konto.schluessel, mitglieder: aktiveMitglieder(zul) });
    return !!(s.aktuell && s.keys.has(s.aktuell)) || !!(ankerVertraut && !s.aktuell && s.lesbar.size);
  } catch (err) {
    if (err && typeof err.code === 'string') return false;
    throw err;
  }
}

/* ---------- the sync in the app (task "Abgleich in der App"; concept 9.1, 9.4) ---------- */
const anmStaende = (ablage) => { try { const s = JSON.parse(ablage.getItem(GERAETEABGLEICH_SPEICHER.staende) || '{}'); return s && typeof s === 'object' && !Array.isArray(s) ? s : {}; } catch (e) { return {}; } };
const anmEvents = (st) => (st && Array.isArray(st.log) ? st.log.map((x) => x && x.event).filter((e) => e && typeof e === 'object' && e.payload && typeof e.payload === 'object') : []);
/* A signed event enters the log before the upload. Only a confirmed put clears
   its outbox entry. Events received from other devices are already confirmed. */
export function anmSchuleAbgeglicheneRevisionen(ablage, child) {
  const area = 'schule:' + child, stand = anmStaende(ablage)[area];
  const synced=new Set();
  if(stand?.bereich!==area || !Array.isArray(stand.log) || !Array.isArray(stand.ausgang)) return synced;
  const bundle=stand.unterwegs?.inhalt?.eintraege;
  if(stand.unterwegs && !Array.isArray(bundle)) return synced;
  const pending=new Set(stand.ausgang.map(x=>x?.event?.id));
  for(const x of bundle||[]) pending.add(x?.id);
  for(const entry of stand.log){
    const e=entry?.event;
    if(e?.type==='school_evaluation' && e.payload?.child===child && typeof e.id==='string'
      && typeof entry.sig==='string' && entry.sig && !pending.has(e.id)) synced.add(e.payload.revision);
  }
  return synced;
}
/* entries this device dropped while syncing (kept once, module geraeteabgleich) that the grown-ups are told of as a
   number: only forgeries and entries without the right to write them (Peter, 05.11., from #139) - never the harmless
   ones of the order of things (an author or device whose admission comes later, e.g. right after "Schluessel erneuern";
   an older stand) or of a newer app version (a format this one does not know yet).
     forged:          unterschrift, eintrag-passt-nicht, entschluesseln, geraet-fremd
     without a right: nicht-mitglied, rolle-darf-nicht, bereich-falsch, nach-entfernung (a removed device, old keys),
                      geraet-nicht-angemeldet from a device that was removed (the bundle "<device>/<n>" of a device with a
                      device_removed this device knows - depending on the order the admission drops a removed device's
                      entry with this reason before the check for nach-entfernung; found in the full test run, 05.11.)
   -> count */
export const ANM_VERWORFEN_ZAEHLT = Object.freeze(['unterschrift', 'eintrag-passt-nicht', 'entschluesseln', 'geraet-fremd', 'nicht-mitglied', 'rolle-darf-nicht', 'bereich-falsch', 'nach-entfernung']);
export function anmVerworfen(ablage) {
  try {
    const l = JSON.parse(ablage.getItem(GERAETEABGLEICH_SPEICHER.verworfen) || '[]');
    if (!Array.isArray(l)) return 0;
    const entfernt = new Set();
    for (const st of Object.values(anmStaende(ablage))) for (const e of anmEvents(st)) if (e.type === 'device_removed' && typeof e.payload.device === 'string') entfernt.add(e.payload.device);
    const vomEntfernten = (v) => v.grund === 'geraet-nicht-angemeldet' && typeof v.kennung === 'string' && entfernt.has(v.kennung.split('/')[0]);
    return l.filter((v) => v && typeof v === 'object' && (ANM_VERWORFEN_ZAEHLT.includes(v.grund) || vomEntfernten(v))).length;
  } catch (e) { return 0; }
}
/* was this device removed (module geraete: device_removed with its id in an area it knows)? */
export function anmGeraetEntfernt({ ablage }) {
  let g = null;
  try { g = JSON.parse(ablage.getItem(GERAETEABGLEICH_SPEICHER.geraet) || 'null'); } catch (e) { g = null; }
  if (typeof g !== 'string') return false;
  return Object.values(anmStaende(ablage)).some((st) => anmEvents(st).some((e) => e.type === 'device_removed' && e.payload.device === g));
}
/* a removed device where somebody logs in again starts as a new device: the states of the sync belonged to the old
   device id (the app sets the new id itself) */
export function anmGeraetNeu({ ablage }) {
  ablage.setItem(GERAETEABGLEICH_SPEICHER.staende, '{}');
}
/* is the storage of this app version one with accounts at all? Only a storage that can tell (module github: verbunden)
   is asked - one request; an error of the storage -> not "foreign" (the normal messages say what is wrong) */
export async function anmSpeicherFremd(zugang) {
  if (!zugang || typeof zugang.verbunden !== 'function') return false;
  try { return !(await zugang.verbunden()); } catch (err) { if (err && typeof err.code === 'string') return false; throw err; }
}

/* ---------- task "Familienfassung bauen" (preparation of stage 4): export, deletion, school ratings ---------- */
/* all data of a child (module kinddaten, US12.1) -> { daten, json, html, dateiname: { json, html } } */
export const anmKindExport = ({ ablage, konto, kind, now, heute, sprache }) => kindDatenExport({ ablage, konto, kind, now, heute, sprache });
/* delete a child of the family (US12.2) - storage and this device; the app deletes its recordings itself */
export const anmKindLoeschen = ({ ablage, zugang, konto, kind, now, heute, geraetName }) => kindDatenLoeschen({ ablage, zugang, konto, kind, now, heute, ...(geraetName ? { geraetName } : {}) });
/* delete the own account of a parent, with his password (US12.2) */
export const anmKontoLoeschen = ({ ablage, zugang, konto, passwort, now, heute, geraetName }) => kontoDatenLoeschen({ ablage, zugang, konto, passwort, now, heute, ...(geraetName ? { geraetName } : {}) });
/* what this device holds of a child whose areas are gone from the storage (module einladung) */
export const anmKindLokalEntfernen = ({ ablage, kind }) => kindLokalEntfernen({ ablage, kind });
/* the school ratings of a child from its log (area schule, school_import; module ableitung) - or null. The family build
   has no SCHOOL_DATA: a child's ratings come into its account (werkzeug/schulbewertungen-uebernehmen.mjs). */
export const anmSchule = (events, now) => deriveSchool(events, { now });

/* ---------- guides ---------- */
/* replaces whole points "<li><b>Label</b> ...</li>" (or <p>) of a guide: ersatz = [[label, new text after the label]].
   A label that is missing is an error - a changed guide must not keep a wrong point silently. */
export function anmPunkteErsetzen(text, ersatz) {
  let t = String(text);
  for (const [label, neu] of ersatz) {
    const re = new RegExp('<(li|p)><b>' + anmEsc(label) + '</b>[\\s\\S]*?</\\1>');
    if (!re.test(t)) throw new Error('anmeldung: Punkt "' + label + '" nicht gefunden.');
    t = t.replace(re, (_, tag) => '<' + tag + '><b>' + label + '</b> ' + neu + '</' + tag + '>');
  }
  return t;
}
