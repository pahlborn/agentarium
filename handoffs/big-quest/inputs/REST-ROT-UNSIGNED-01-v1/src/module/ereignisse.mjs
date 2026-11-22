// Module ereignisse - event format v1 and merge rules for stage 2 (concept 9.1 and 9.2; EP7: US7.1, US7.3, US7.4).
// Pure functions: no screen, no storage, no network. Clock and randomness are passed in (now, rand).
// Test build only (module.json: bau "test"). Signing, encryption and the rights check come in later tasks.
//
//   event:       { id: "e_" + 24 hex characters, v: 1, type, at: UTC time, author: "p_...", device: "d_...", payload }
//   merge:       protocol events are united; the same id counts once; order by time, on a tie by id (E4)
//   last wins:   per field the youngest time; on a tie the larger device ID, then the larger event id
//   clock:       a time more than 24 hours ahead of "now" counts as "now" when merging (a wrong iPad clock)
//
// Names: every helper starts with "ev"/"EV_" because all modules and index.html share one scope in the app.

import { schoolStandardInfo } from './standardkatalog.mjs';

export const EVENT_VERSION = 1;
export const EVENT_FUTURE_MS = 24 * 3600 * 1000;
export const SCHOOL_EVALUATION_CRITERIA_MAX = 50;

export const SCHOOL_EVALUATION_TARGETS = Object.freeze({
  'M-N5': Object.freeze({ focus: 'two-step', world: 'wordprob' }),
  'M-N3': Object.freeze({ focus: 'round-distance', world: 'round' }),
});
export const schoolEvaluationNeedsPractice = (rating) => rating === 'RS' || rating === 'C';

/* ---------- field checks ---------- */
const evObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const evStr = (x) => typeof x === 'string' && x.length > 0;
const evEvalId = (x) => typeof x === 'string' && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(x);
const evCriterionRating = (x) => ['RS', 'C', 'M', 'E', ''].includes(x);
const evCriterionStandards = (x) => Array.isArray(x?.criteria) && x.criteria.some(c => evObj(c) && evOwn(c, 'standard'));
// Test-11 assessments without criterion standards remain readable. A new assessment
// maps every criterion explicitly, including "none"; partially mapped data is invalid.
function evEvalDocument(x) {
  if (!evObj(x) || !Object.keys(x).every(k => ['area', 'goal', 'instructions', 'feedback', 'criteria'].includes(k))) return false;
  if (!['area', 'goal', 'instructions', 'feedback'].every(k => typeof x[k] === 'string' && x[k].length <= 12000) || !x.area.length) return false;
  if (!Array.isArray(x.criteria) || !x.criteria.length || x.criteria.length > SCHOOL_EVALUATION_CRITERIA_MAX) return false;
  const mapped = evCriterionStandards(x);
  return x.criteria.every(c => evObj(c)
    && Object.keys(c).every(k => ['criterion', 'rating', 'evidence', ...(mapped ? ['standard'] : [])].includes(k))
    && typeof c.criterion === 'string' && c.criterion.trim().length > 0 && c.criterion.length <= 2000
    && evCriterionRating(c.rating)
    && (typeof c.evidence === 'string' && c.evidence.length <= 4000 || mapped && !evOwn(c, 'evidence'))
    && (!mapped || evOwn(c, 'standard') && typeof c.standard === 'string' && (c.standard === 'none' || schoolStandardInfo(c.standard) !== null)));
}
const evDayOk = (s) => { if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false; const t = Date.parse(s + 'T00:00:00Z'); return !Number.isNaN(t) && new Date(t).toISOString().slice(0, 10) === s; };
const evMs = (s) => {      // strict UTC time "YYYY-MM-DDTHH:MM:SS[.mmm]Z" -> milliseconds, else NaN
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(s)) return NaN;
  const t = Date.parse(s);
  return !Number.isNaN(t) && new Date(t).toISOString().slice(0, 19) === s.slice(0, 19) ? t : NaN;   // rejects 30 February, hour 24, ...
};
const evField = {
  day: evDayOk,
  evalId: evEvalId,
  rankRef: x=>x==='base' || typeof x==='string' && /^e_[0-9a-f]{24}$/.test(x),
  evalRevisions: (x) => Array.isArray(x) && x.length >= 2 && new Set(x).size === x.length && x.every(evEvalId),
  evalDocument: evEvalDocument,
  evalTitle: (x) => evStr(x) && x.length <= 160 && x === x.trim() && !/[\x00-\x1f\x7f]/.test(x),
  roundId: x=>typeof x==='string'&&/^r_[a-f0-9]{24}$/.test(x),
  quests: x=>Array.isArray(x)&&x.length<=100&&new Set(x).size===x.length&&x.every(k=>typeof k==='string'&&/^[a-z][a-z0-9_]{0,63}$/.test(k)),
  treeTokens: x=>Array.isArray(x)&&x.length<=300&&new Set(x).size===x.length&&x.every(t=>typeof t==='string'&&/^(leaf|fruit|flower):(maths|science|english|deutsch|reading):[1-9][0-9]?$/.test(t)),
  str: evStr, nstr: (x) => x === null || evStr(x), bool: (x) => typeof x === 'boolean', any: (x) => x !== undefined,
  int: (x) => Number.isInteger(x) && x >= 0, pos: (x) => Number.isInteger(x) && x >= 1, lvl: (x) => x === 1 || x === 2 || x === 3,
  arr: Array.isArray, obj: evObj, utc: (x) => !Number.isNaN(evMs(x)),
  sha: (x) => typeof x === 'string' && /^[0-9a-f]{64}$/.test(x),          // SHA-256 as 64 small hex characters
  pid: (x) => typeof x === 'string' && /^p_[0-9A-Za-z]{1,40}$/.test(x),
  did: (x) => typeof x === 'string' && /^d_[0-9A-Za-z]{1,40}$/.test(x),
  scope: (x) => Array.isArray(x) && x.length > 0 && new Set(x).size === x.length && x.every((s) => s === 'learning' || s === 'school'),
  // public keys of a person (krypto.publicKeysOf): exactly ecdh and ecdsa, both base64 text
  pub: (x) => evObj(x) && Object.keys(x).length === 2 && ['ecdh', 'ecdsa'].every((k) => typeof x[k] === 'string' && /^[A-Za-z0-9+/]+=*$/.test(x[k])),
  // list of different person IDs (may be empty)
  pids: (x) => Array.isArray(x) && new Set(x).size === x.length && x.every((p) => typeof p === 'string' && /^p_[0-9A-Za-z]{1,40}$/.test(p)),
  // list of different device IDs (task "Meine Geraete")
  dids: (x) => Array.isArray(x) && new Set(x).size === x.length && x.every((d) => typeof d === 'string' && /^d_[0-9A-Za-z]{1,40}$/.test(d)),
  // bundles per device at a key change (speicher.list merker.stand): device ID -> count
  stand: (x) => evObj(x) && Object.entries(x).every(([d, n]) => /^d_[0-9A-Za-z]{1,40}$/.test(d) && Number.isInteger(n) && n >= 0),
};

/* ---------- the types and their payloads ----------
   [required, optional]: "name:kind" separated by blanks; enum(a|b) = one of these words.
   answer follows what the app stores today for an attempt (index.html, "attempts"); the others are derived from
   the storage places in werkzeug/speicherstellen.json (concept 7.2) and kept short. */
const EV_SPEC = {
  answer: ['day:day skill:str level:lvl attempt:int ok:bool qid:str', 'family:nstr response:any help:bool example:bool hintShown:bool exampleShown:bool solutionShown:bool beforeTry:bool sheet:str'],
  tree_record: ['secure:quests extending:quests discovered:quests baseline:bool legacy:int tokens:treeTokens', ''],
  tree_open: ['ordinal:pos', ''],
  reward_seen: ['secure:quests solved:quests', ''],
  discovery_bonus: ['quest:str round:roundId', ''],
  round_reward: ['day:day round:roundId skill:str correct:int stars:int count:pos', ''],
  round_done: ['day:day skill:str stars:int count:pos', ''],
  badge: ['day:day badge:str', 'skill:str'],
  review: ['day:day qid:str box:int', 'dueAt:day question:obj'],
  practice_day: ['day:day', ''],
  profile_set: ['field:enum(name|lastName|birthday|emoji|kidLang|muted|mySchool) value:any', ''],   // muted: the child's sound switch (3b-1b-4); lastName: task "Name und Geburtsdatum" (04.11.); mySchool {grade, cls?, school?, year}: task "Schule und Klasse" (05.11.)
  rank_seen: ['rank:str', 'policy:enum(legacy.v1|knowledge.v1) after:rankRef'],
  sheet_created: ['sheet:str day:day no:pos writing:enum(de|en) items:arr', ''],
  sheet_result: ['sheet:str index:int res:enum(ok|no|help) day:day qid:str', ''],
  sheet_discarded: ['sheet:str', ''],
  setting_set: ['setting:enum(focusMode|storyCap) value:any', ''],   // the lists focusManual and unlocked: list_set (task 3b-1b-2)
  checklist_set: ['studio:str index:int value:bool', 'size:pos'],   // size: number of items (the app stores the whole list, task 3b-1b)
  day_flag: ['flag:enum(greetDay|mysteryDone|bdayParty) day:day', ''],
  school_import: ['asOf:day data:obj', 'source:str'],
  school_evaluation: ['child:pid evaluation:evalId revision:evalId title:evalTitle day:day', `standard:enum(${Object.keys(SCHOOL_EVALUATION_TARGETS).join('|')}|unmapped) rating:enum(RS|C|M|E|N) focus:enum(${Object.values(SCHOOL_EVALUATION_TARGETS).map((t) => t.focus).join('|')}|none) base:evalId withdrawn:bool resolves:evalRevisions assessment:evalDocument standardOverrides:obj`],
  grant_set: ['grant:str grantee:pid scope:scope from:day until:day', 'text:str'],
  grant_revoked: ['grant:str grantee:pid', ''],
  grant_opened: ['grant:str grantee:pid', 'scope:scope'],
  // admission of an area (task P3b-2): each area carries its own members, devices and key changes
  // stand (task "Einladungen"): the directory entry the keys come from (konto) - a child's new keys after "new password"
  // have a higher one, so an older device never puts the old keys back
  member_added: ['person:pid role:enum(child|parent|teacher|admin) pub:pub', 'stand:pos'],
  member_removed: ['person:pid', ''],
  device_added: ['device:did', 'label:str'],
  device_removed: ['device:did', ''],
  // erneuert (task "Neuer Schluessel"): persons with new keys since the last version (a grown-up renewed his key, a child
  // got a new password) - their bundles with an older version beyond "stand" no longer count, like those of the removed
  // geraete (task "Meine Geraete"): devices removed with this change - their bundles beyond "stand", and their events in
  // any other device's bundle, no longer count
  key_rotated: ['version:pos entfernt:pids stand:stand', 'erneuert:pids geraete:dids'],
  // snapshot (task 5, module schnappschuss): idsHash = checksum of the events it contains, so a late event is noticed
  snapshot: ['upTo:utc count:int idsHash:sha state:obj', ''],
  // gaps per school (index.html "gaps", task 3b-0): one standard per event; day = the app's day (index.html dayKey)
  gap_state: ['standard:str state:enum(closed|hold|open) by:enum(app|parents) schoolDay:day day:day', 'quest:str'],
  gap_active: ['standard:nstr', ''],
  // lists the app stores whole, synced per entry (task 3b-1b-2): one entry on or off ("last wins" per list and entry)
  list_set: ['list:enum(unlocked|focusManual) item:str on:bool', ''],
  // Advent calendar: a door is opened (only opening, never closing; index.html openDoor, key advent<year>)
  advent_open: ['year:pos door:pos', ''],
  // jokes shown and stories read (task 3b-1b-4; before only on the device). A joke goes to the end; forget = the ids the
  // app drops when every joke of the moment was shown and the round starts again (witze.mjs jokeNext)
  joke_seen: ['joke:str', 'forget:arr'],
  content_vote: ['kind:enum(joke|story|word) item:str value:enum(up|down)', ''],
  story_read: ['story:str', ''],                                       // the story moves to the end (geschichten.mjs storyMarkRead)
  // settings of one person (task 3b-1c; area person:<id>, before only on the device): language of the grown-ups' area,
  // sound switch of a grown-up, "How Big Quest works" opened (day). Written by the person itself, into its own area.
  person_set: ['field:enum(parentLang|muted|conceptSeen) value:any', ''],
  // "At a glance" (index.html glanceBase): the state at the last visit of a parent, per child ("last wins" per child)
  glance_set: ['child:pid value:obj', ''],
  // the last backup of the child's data (index.html makeBackup, key lastBackup; area eltern:allg)
  backup_made: ['day:day', ''],
  // invitations and connections (task "Einladungen", module einladung): where a person belongs, in its own area -
  // a parent: the family (its founding parent); a child: the parent who created it (anchor of its areas)
  anchor_set: ['kind:enum(family|child) person:pid pub:pub', ''],
  // a member of the family (area familie:<founding parent>), written by a parent who checked the keys: name = login name,
  // stand = directory entry the keys come from (konto), anchor/anchorPub = the parent who created a child;
  // removed = true (task "Export und Loeschen"): the child was deleted / the parent deleted his account - "last wins" per
  // person, so every device of the family drops him and nobody hands him keys or creates his areas again
  family_set: ['person:pid role:enum(child|parent) pub:pub stand:pos', 'name:str anchor:pid anchorPub:pub removed:bool'],
  // an invitation (start code) its issuer gave out, in his own area: check = key that tests the proof in the directory
  // entry of the invited person (konto.kontoBeweis), until = end of validity, display = display name of a new child
  invite_set: ['invite:str art:enum(child|parent|reset) person:pid name:str check:str until:utc state:enum(open|done|withdrawn|expired)', 'display:str'],
};
function evParse(text) {
  const out = {};
  for (const tok of text.split(' ').filter(Boolean)) {
    const [name, kind] = tok.split(':'), m = /^enum\((.+)\)$/.exec(kind);
    out[name] = m ? ((words) => (x) => words.includes(x))(m[1].split('|')) : evField[kind];
    if (!out[name]) throw new Error('ereignisse: unknown field kind in ' + tok);
  }
  return out;
}
const EV_PARSED = Object.fromEntries(Object.entries(EV_SPEC).map(([type, [req, opt]]) => [type, { req: evParse(req), opt: evParse(opt) }]));
export const EVENT_TYPES = Object.keys(EV_SPEC);
export const PAYLOAD_FIELDS = Object.fromEntries(EVENT_TYPES.map((t) => [t, Object.keys(EV_PARSED[t].req)]));
export const PAYLOAD_OPTIONAL = Object.fromEntries(EVENT_TYPES.map((t) => [t, Object.keys(EV_PARSED[t].opt)]));
const EV_KEYS = ['id', 'v', 'type', 'at', 'author', 'device', 'payload'];

const evOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const evHas = (o, k) => evOwn(o, k) && o[k] !== undefined;
const evRandom = (n) => globalThis.crypto.getRandomValues(new Uint8Array(n));
const evToMs = (x) => (typeof x === 'number' ? x : x instanceof Date ? x.getTime() : evMs(x));   // a time: UTC text, Date or milliseconds

/* ---------- build and check ---------- */
/* rand: (n) => Uint8Array (tests pass fixed values). The payload is copied, so the event is plain JSON. */
export function newEvent({ type, author, device, payload, at }, { rand = evRandom } = {}) {
  const hex = Array.from(rand(12), (b) => b.toString(16).padStart(2, '0')).join('');
  return { id: 'e_' + hex, v: EVENT_VERSION, type, at, author, device, payload: payload === undefined ? null : JSON.parse(JSON.stringify(payload)) };
}
/* list of problems (strings); empty = valid */
export function checkEvent(e) {
  if (!evObj(e)) return ['event: not an object'];
  const err = [];
  for (const k of Object.keys(e)) if (!EV_KEYS.includes(k)) err.push(`event.${k}: unknown field`);
  if (e.v !== EVENT_VERSION) err.push(`v: must be ${EVENT_VERSION}`);
  if (typeof e.id !== 'string' || !/^e_[0-9a-f]{24}$/.test(e.id)) err.push('id: must be "e_" and 24 hex characters');
  if (!evField.utc(e.at)) err.push('at: must be a UTC time like 2026-11-02T16:04:11Z');
  if (!evField.pid(e.author)) err.push('author: must be a person ID starting with p_');
  if (!evField.did(e.device)) err.push('device: must be a device ID starting with d_');
  const known = EVENT_TYPES.includes(e.type);
  if (!known) err.push('type: unknown');
  if (!evObj(e.payload)) err.push('payload: not an object');
  else if (known) {
    const { req, opt } = EV_PARSED[e.type];
    for (const [f, ok] of Object.entries(req)) { if (!evHas(e.payload, f)) err.push(`payload.${f}: missing`); else if (!ok(e.payload[f])) err.push(`payload.${f}: invalid`); }
    for (const [f, ok] of Object.entries(opt)) if (evHas(e.payload, f) && !ok(e.payload[f])) err.push(`payload.${f}: invalid`);
    if(e.type==='rank_seen' && evHas(e.payload,'after') && (e.payload.policy!=='legacy.v1' || e.payload.after===e.id))err.push('payload.after: requires a preceding title policy');
    if (e.type === 'school_evaluation') {
      const { standard, focus, rating, revision, base, withdrawn, resolves, assessment, standardOverrides } = e.payload;
      const mapped = evCriterionStandards(assessment);
      if (mapped) {
        // There is only one authoritative set of grades, never a second legacy
        // top-level grade beside the original criterion grades.
        if (['standard', 'rating', 'focus'].some(k => evHas(e.payload, k))) err.push('payload: criterion standards cannot be combined with legacy rating fields');
      } else {
        for (const k of ['standard', 'rating', 'focus']) if (!evHas(e.payload, k)) err.push(`payload.${k}: missing`);
        if (standard === 'unmapped' && (!assessment || rating !== 'N' || focus !== 'none')) err.push('payload: unmapped requires assessment and no focus');
        if (standard !== 'unmapped' && rating === 'N') err.push('payload.rating: invalid mapped rating');
        if (focus !== 'none') {
          if (typeof standard === 'string' && evOwn(SCHOOL_EVALUATION_TARGETS, standard) && focus !== SCHOOL_EVALUATION_TARGETS[standard].focus) err.push('payload.focus: incompatible with standard');
          if (!schoolEvaluationNeedsPractice(rating)) err.push('payload.focus: incompatible with rating');
        }
        if (withdrawn && focus !== 'none') err.push('payload.focus: withdrawn evaluation');
      }
      if (evHas(e.payload, 'standardOverrides')) {
        if (!mapped) err.push('payload.standardOverrides: requires criterion standards');
        const rated = new Set((Array.isArray(assessment?.criteria) ? assessment.criteria : []).filter(c => evObj(c) && c.standard !== 'none' && evCriterionRating(c.rating) && c.rating !== '').map(c => c.standard));
        if (!evObj(standardOverrides) || Object.entries(standardOverrides).some(([code, grade]) => !rated.has(code) || schoolStandardInfo(code) === null || !evCriterionRating(grade) || grade === '')) err.push('payload.standardOverrides: invalid');
      }
      if (base === revision || ((withdrawn || resolves) && !base)) err.push('payload.base: invalid revision base');
      if (Array.isArray(resolves) && (resolves.includes(revision) || resolves.includes(base))) err.push('payload.resolves: invalid conflict revisions');
    }
    if(e.type==='tree_record'&&(e.payload.legacy>6||e.payload.baseline&&e.payload.tokens?.length||!e.payload.baseline&&e.payload.legacy!==0))err.push('payload: invalid tree migration');
    if(e.type==='round_reward'&&(e.payload.correct>e.payload.count||e.payload.stars>e.payload.correct))err.push('payload: invalid reward counts');
    for (const k of Object.keys(e.payload)) if (!evOwn(req, k) && !evOwn(opt, k)) err.push(`payload.${k}: unknown field`);
  }
  return err;
}

/* ---------- time ---------- */
/* milliseconds; a time more than 24 hours after "now" counts as "now" (concept 9.2). NaN if a time cannot be read. */
export function effectiveTime(at, now) {
  const t = evToMs(at), n = evToMs(now);
  if (Number.isNaN(t) || Number.isNaN(n)) return NaN;
  return t > n + EVENT_FUTURE_MS ? n : t;
}

/* ---------- merge (protocol events) ---------- */
function evCanon(x) {
  if (x === null || typeof x !== 'object') return JSON.stringify(x);
  if (Array.isArray(x)) return '[' + x.map((v) => evCanon(v === undefined ? null : v)).join(',') + ']';
  return '{' + Object.keys(x).sort().filter((k) => x[k] !== undefined).map((k) => JSON.stringify(k) + ':' + evCanon(x[k])).join(',') + '}';
}
const evCmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
/* Unites lists of events (e.g. [own log, what the other device sent]); logs: array of arrays.
   - the same id counts once; the result does not depend on the order or on how often something is merged
   - sorted by effective time, on a tie by id
   - the same id with different content is a conflict: reported, never overwritten silently; the variant with the
     smaller canonical text stays, so every device keeps the same one
   - events that fail checkEvent are not merged but reported as invalid
   Returns { events, conflicts: [{ id, kept, rejected }], invalid: [{ event, errors }] }. Inputs are not changed. */
export function mergeLog(logs, now) {
  const byId = new Map(), invalid = [];
  for (const list of Array.isArray(logs) ? logs : []) {
    for (const e of Array.isArray(list) ? list : []) {
      const errors = checkEvent(e);
      if (errors.length) { invalid.push({ event: e, errors }); continue; }
      const variants = byId.get(e.id);
      if (!variants) byId.set(e.id, [e]);
      else if (!variants.some((x) => evCanon(x) === evCanon(e))) variants.push(e);
    }
  }
  const conflicts = [], rows = [];
  for (const variants of byId.values()) {
    variants.sort((a, b) => evCmp(evCanon(a), evCanon(b)));
    if (variants.length > 1) conflicts.push({ id: variants[0].id, kept: variants[0], rejected: variants.slice(1) });
    rows.push(variants[0]);
  }
  const timed = rows.map((e) => ({ e, t: effectiveTime(e.at, now) }));
  timed.sort((a, b) => (a.t - b.t) || evCmp(a.e.id, b.e.id));
  conflicts.sort((a, b) => evCmp(a.id, b.id));
  invalid.sort((a, b) => evCmp(evCanon(a.event), evCanon(b.event)));
  return { events: timed.map((x) => x.e), conflicts, invalid };
}

/* ---------- "last wins" fields ----------
   type -> payload fields that name the field. Everything else is a protocol event (not listed here). */
const EV_LAST_WINS = { profile_set: ['field'], setting_set: ['setting'], day_flag: ['flag'], checklist_set: ['studio', 'index'], rank_seen: [], gap_state: ['standard'], gap_active: [], list_set: ['list', 'item'], person_set: ['field'], glance_set: ['child'], backup_made: [], anchor_set: ['kind'], family_set: ['person'], invite_set: ['invite'] };
/* key of the field an event sets, e.g. "profile_set:name"; null for protocol events */
export function fieldKey(e) {
  if (!evObj(e) || !evObj(e.payload) || !evOwn(EV_LAST_WINS, e.type)) return null;
  const parts = EV_LAST_WINS[e.type].map((f) => e.payload[f]);
  return parts.some((p) => p === undefined || p === null) ? null : [e.type, ...parts].join(':');
}
/* per field the winning event: youngest effective time; tie -> larger device ID; then larger event id.
   Every device decides the same, whatever order it got the events in. Returns { fieldKey: event }. */
export function lastWins(events, now) {
  const best = new Map();
  for (const e of lastWinsOrder(events, now)) best.set(fieldKey(e), e);   // ascending: the last one per field wins
  return Object.fromEntries([...best.keys()].sort().map((k) => [k, best.get(k)]));
}
/* the valid "last wins" events (fieldKey not null) in the order "last wins" uses: effective time, then device ID,
   then event id - ascending, so the later one counts. The same id counts once. For values that are replayed
   step by step instead of taking only the winner (gaps, module ableitung): every device gets the same order. */
export function lastWinsOrder(events, now) {
  const rows = [], seen = new Set();
  for (const e of Array.isArray(events) ? events : []) {
    if (!fieldKey(e) || checkEvent(e).length) continue;          // invalid events never win
    const t = effectiveTime(e.at, now);
    if (Number.isNaN(t) || seen.has(e.id)) continue;
    seen.add(e.id);
    rows.push({ e, t });
  }
  rows.sort((a, b) => (a.t - b.t) || evCmp(a.e.device, b.e.device) || evCmp(a.e.id, b.e.id));
  return rows.map((x) => x.e);
}
