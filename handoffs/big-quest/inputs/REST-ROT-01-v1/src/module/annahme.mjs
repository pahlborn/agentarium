// Module annahme - signature and rights check when reading (concept 6, 7.2, 8.5; EP7: US7.5; success criterion E10).
// Pure functions: no screen, no storage, no network. Test build only (module.json: bau "test").
//
//   sign:     the author signs a fixed byte sequence: "bq-sig1|" + area + "|" + the event with sorted keys.
//             The area is part of the signature, so an event cannot be copied into another area.
//   accept:   an event counts only if it is well-formed, its author is admitted, the device belongs to the author,
//             the signature is valid, its type (for profile_set: the field) belongs into this area (module bereiche,
//             task P3b) and the role may write this type. Checked in exactly this order; the first failing check is
//             the reason. An area name outside the scheme of module bereiche fits no event.
//   admission (input; module zulassung builds it from the area's own events, task P3b-2a):
//             { area, members: { <personId>: { role: 'child'|'parent'|'teacher'|'admin', pub: { ecdh, ecdsa }, devices: [<deviceId>] } } }
//   at this time (task P3b-2b): if a member carries perioden ([{ von, bis, role, pub }]) and geraete ({ <deviceId>:
//             [{ von, bis }] }), the admission must carry "now" and the event counts only in a period of its author
//             (von included, bis not: the moment of a change belongs to the new state; null = open) - signed with the
//             key of THAT period, with the role of that period - and only from a device registered at that time.
//             The time is the event's effective time (ereignisse.effectiveTime: more than 24 h ahead counts as now).
//             Reasons: nicht-mitglied (no period at that time), geraet-nicht-angemeldet (device known, not at that time).
//
// Names: every helper starts with "ann"/"ANN_" because all modules and index.html share one scope in the app.

import { signBytes, verifyBytes } from './krypto.mjs';
import { checkEvent, effectiveTime } from './ereignisse.mjs';
import { passtZumBereich } from './bereiche.mjs';

/* reasons, in the order they are checked */
export const ANNAHME_GRUENDE = ['format', 'autor-unbekannt', 'nicht-mitglied', 'geraet-fremd', 'geraet-nicht-angemeldet', 'unterschrift', 'bereich-falsch', 'rolle-darf-nicht'];

/* ---------- who may write which type (concept 6 "Schreiben", table 7.2, 5.2, 9.3) ----------
   child:   learning progress, profile, own sheets (create, enter the results), day hints, checklist; registers its own device
   parent:  profile (correct), sheets (create, discard), settings, school data, grants, members, devices,
            key change, snapshot - but no answers, rounds, sheet results or day hints of the child (concept 6: "Antwort ... Elternteil ❌").
            A9/A10 (02.11.): the child enters its sheet itself (index.html sheetResult); grown-ups only see the state.
            So "sheet_result" - and the review and the badge "principled" it causes - are the child's; the former
            exception for parents (review, badge "principled") is gone.
   gaps (task 3b-0, index.html openGaps/gapAct): parents choose, close, keep open; the child's device only does
            what the app does there today: close a gap automatically (state "closed", by "app"). The parents'
            devices close automatically, too, so parents may write by "app" as well.
   lists (task 3b-1b-2): unlocked quests and the manual focus are set by parents (list_set); an Advent door is opened
            by the child - or by a parent while the grown-ups' area is open (advent_open)
   jokes shown, stories read (task 3b-1b-4): the child - or a parent while the grown-ups' area is open
   teacher, admin: only the protocol entry "opened" for their own grant (5.2) and - since P3b-2, where every area carries its
            own admission - the registration of their own device; they never write into child data
   own settings (task 3b-1c): everybody writes person_set - into the own person area only (module bereiche checks
            the author against the area). "At a glance" (glance_set) and the last backup (backup_made) are the parents':
            a teacher's glance would keep the child's state in his own area after the grant ended.
   invitations (task "Einladungen"): a child notes the parent who created it (anchor_set, own area); a parent notes its
            family (anchor_set), the invitations it gave out (invite_set, own area) and the members of the family whose
            keys it checked (family_set) */
const ANN_RIGHTS = {
  child: ['tree_record', 'tree_open', 'answer', 'reward_seen', 'discovery_bonus', 'round_reward', 'round_done', 'badge', 'review', 'practice_day', 'profile_set', 'rank_seen', 'sheet_created', 'sheet_result', 'checklist_set', 'day_flag', 'device_added', 'gap_state', 'advent_open', 'joke_seen', 'story_read', 'content_vote', 'person_set', 'anchor_set'],
  parent: ['profile_set', 'sheet_created', 'sheet_discarded', 'setting_set', 'school_import', 'school_evaluation', 'grant_set', 'grant_revoked', 'member_added', 'member_removed', 'device_added', 'device_removed', 'key_rotated', 'snapshot', 'gap_state', 'gap_active', 'list_set', 'advent_open', 'joke_seen', 'story_read', 'person_set', 'glance_set', 'backup_made', 'anchor_set', 'family_set', 'invite_set'],
  teacher: ['grant_opened', 'device_added', 'person_set', 'member_added', 'key_rotated', 'device_removed'],
  admin: ['grant_opened', 'device_added', 'person_set', 'member_added', 'key_rotated', 'device_removed', 'invite_set'],
};
/* task "Meine Geraete": teacher and admin remove one of their devices in their own person area (and renew their key). */
/* task "Neuer Schluessel" (US9.7): a grown-up renews his person key. He announces the new public keys himself with
   member_added about himself, signed with the OLD key (that is the continuity: only the old key may name the new one) -
   so teacher and admin may write member_added, but only about themselves and with their own role. A key change in their
   own person area (they hand out its key) is theirs, too. Parents may write both anyway (they distribute the keys). */
export const ANNAHME_RECHTE = Object.freeze(Object.fromEntries(Object.entries(ANN_RIGHTS).map(([r, t]) => [r, Object.freeze(t.slice())])));

/* conditions beyond role and type (e = event, role = role of the author) */
const ANN_LIMITS = {
  device_added: (e) => e.payload.device === e.device,                         // a device registers itself, nobody adds a foreign device
  grant_opened: (e) => e.payload.grantee === e.author,                        // the recipient logs his own opening, nobody else's
  gap_state: (e, role) => role !== 'child' || (e.payload.state === 'closed' && e.payload.by === 'app'),   // the child: only the automatic close
  anchor_set: (e, role) => (role === 'child' ? e.payload.kind === 'child' : e.payload.kind === 'family'),   // a child has a creating parent, a parent a family
  member_added: (e, role) => role === 'parent' || (e.payload.person === e.author && e.payload.role === role),   // teacher, admin: only their own new key
  key_rotated: (e, role, area) => role === 'parent' || area === 'person:' + e.author,                         // teacher, admin: only in their own area
  device_removed: (e, role, area) => role === 'parent' || area === 'person:' + e.author,                      // task "Meine Geraete": the same
};

/* ---------- helpers ---------- */
const annObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const annOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const annEnc = new TextEncoder();
function annCanon(x) {
  if (x === null || typeof x !== 'object') return JSON.stringify(x);
  if (Array.isArray(x)) return '[' + x.map((v) => annCanon(v === undefined ? null : v)).join(',') + ']';
  return '{' + Object.keys(x).sort().filter((k) => x[k] !== undefined).map((k) => JSON.stringify(k) + ':' + annCanon(x[k])).join(',') + '}';
}
function annCheckAdmission(z) {
  if (!annObj(z) || typeof z.area !== 'string' || !z.area || !annObj(z.members)) throw new Error('annahme: Zulassung braucht area und members.');
}
/* the entry of a list of periods that holds at time t (von included, bis excluded; null = open) */
const annZur = (liste, t) => liste.find((p) => annObj(p) && (p.von === null || p.von <= t) && (p.bis === null || t < p.bis)) || null;
/* the member as it was at the time of the event -> { member } or { grund } (periods only if the admission has them) */
function annZuDerZeit(member, e, zulassung) {
  if (!Array.isArray(member.perioden)) return { member };
  if (zulassung.now === undefined || zulassung.now === null) throw new Error('annahme: Zulassung mit Zeitraeumen braucht now.');
  const t = effectiveTime(e.at, zulassung.now), p = annZur(member.perioden, t);
  if (!p) return { grund: 'nicht-mitglied' };
  const g = annObj(member.geraete) && annOwn(member.geraete, e.device) && Array.isArray(member.geraete[e.device]) ? member.geraete[e.device] : null;
  if (!g) return { grund: 'geraet-fremd' };
  if (!annZur(g, t)) return { grund: 'geraet-nicht-angemeldet' };
  return { member: { role: p.role, pub: p.pub, devices: [e.device] } };
}

/* ---------- sign ---------- */
/* the fixed byte sequence that is signed: area + event with sorted keys */
export function canonicalBytes(event, area) {
  if (typeof area !== 'string' || !area) throw new Error('annahme: Bereich fehlt.');
  return annEnc.encode('bq-sig1|' + area + '|' + annCanon(event));
}
/* -> { event, sig }; a malformed event is not signed */
export async function signEvent(event, area, myKeys) {
  const errors = checkEvent(event);
  if (errors.length) throw new Error('annahme: Ereignis ungueltig, nicht unterschrieben (' + errors.join('; ') + ')');
  const copy = JSON.parse(JSON.stringify(event));
  return { event: copy, sig: await signBytes(myKeys, canonicalBytes(copy, area)) };
}

/* ---------- accept ---------- */
/* item = { event, sig } -> { ok: true } or { ok: false, grund } (grund: one of ANNAHME_GRUENDE) */
export async function acceptEvent(item, zulassung) {
  annCheckAdmission(zulassung);
  if (!annObj(item) || Object.keys(item).some((k) => k !== 'event' && k !== 'sig') || checkEvent(item.event).length) return { ok: false, grund: 'format' };
  const e = item.event;
  const eintrag = annOwn(zulassung.members, e.author) ? zulassung.members[e.author] : null;
  if (!annObj(eintrag)) return { ok: false, grund: 'autor-unbekannt' };
  const zeit = annZuDerZeit(eintrag, e, zulassung);
  if (zeit.grund) return { ok: false, grund: zeit.grund };
  const member = zeit.member;
  if (!Array.isArray(member.devices) || !member.devices.includes(e.device)) return { ok: false, grund: 'geraet-fremd' };
  if (typeof item.sig !== 'string' || !item.sig || !annObj(member.pub) || !(await verifyBytes(member.pub, canonicalBytes(e, zulassung.area), item.sig))) return { ok: false, grund: 'unterschrift' };
  if (!passtZumBereich(e, zulassung.area)) return { ok: false, grund: 'bereich-falsch' };
  if (!roleMayWrite(member.role, e, zulassung.area)) return { ok: false, grund: 'rolle-darf-nicht' };
  return { ok: true };
}
/* may this role write this (well-formed) event? Type and the extra conditions; the same rule the writer
   (module schreiber) applies before it stores an event. Unknown roles may nothing. area: where it is written (some
   conditions need it; without it they say no) */
export function roleMayWrite(role, e, area) {
  const allowed = typeof role === 'string' && annOwn(ANN_RIGHTS, role) ? ANN_RIGHTS[role] : [];
  return !!e && allowed.includes(e.type) && !(annOwn(ANN_LIMITS, e.type) && !ANN_LIMITS[e.type](e, role, area));
}
/* checks every item; nothing is dropped silently: each item is either accepted or rejected with a reason.
   Order is kept. -> { angenommen: [item], verworfen: [{ item, grund }] } */
export async function acceptAll(items, zulassung) {
  annCheckAdmission(zulassung);
  if (!Array.isArray(items)) throw new Error('annahme: Liste erwartet.');
  const angenommen = [], verworfen = [];
  for (const item of items) {
    const r = await acceptEvent(item, zulassung);
    if (r.ok) angenommen.push(item); else verworfen.push({ item, grund: r.grund });
  }
  return { angenommen, verworfen };
}
