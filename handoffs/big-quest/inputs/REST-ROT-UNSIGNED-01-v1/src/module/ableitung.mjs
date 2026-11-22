// Module ableitung - the stored state (today's storage keys and formats) computed from events
// (S12 P2, task 3a; EP7 / US7.2; concept 7.2 and 9.2).
// Pure functions: no screen, no storage, no network; "now" is passed in. Test build only (module.json: bau "test").
//
// The result looks exactly like what index.html keeps today, so the app can later read it unchanged:
//   attempts, ev, due, total, best_<quest>, badges, tried, treeStage, rankSeen, sheets, sheetNo
//   and the "last wins" values name, lastName, birthday, mySchool, emoji, kidLang, focusMode, focusManual, unlocked, storyCap,
//   greetDay, mysteryDone, bdayParty, chk_<studio>; and gaps (task 3b-0: {closed, active, hold}, see abGaps);
//   grants, grantlog, lastBackup (task 3b-1c, see abGrant).
// From the log of a person (task 3b-1c, area person:<id>): parentLang, muted, conceptSeen (the day it was opened) and
//   glance ({ <childId>: state at the last visit }) - the values of THIS person (the app keeps them per device today).
// Not here: school data, recordings, everything that stays on the device.
//
// How: the events are merged (mergeLog: one id once, sorted by time) and then replayed one by one - each event does
// to the state what the matching place in index.html does today (rules copied from the code, see the comments).
// "Last wins" values come from lastWins. A base state (a snapshot, task 5) plus later events gives the same as
// all events together.
//
// Names: helpers start with "ab"/"AB" because all modules and index.html share one scope in the app.

import { mergeLog, lastWins, lastWinsOrder, effectiveTime, SCHOOL_EVALUATION_TARGETS, schoolEvaluationNeedsPractice } from './ereignisse.mjs';
import { schoolStandardInfo, schoolStandardsByQuest } from './standardkatalog.mjs';
import {gapSchoolRatings,gapObserve,gapUndo,gapProjectSource,gapRemember,gapForget,gapUse,gapConsumed} from './lueckenverlauf.mjs';
import {treeProjection} from './wissensbaum.mjs';
import {starProjection} from './sterne.mjs';
import {contentVoteState} from './inhaltsfeedback.mjs';
import {secureEvidence} from './wissen.mjs';
import {RANKS,RANK_POLICY,RANK_MIGRATION,higherRank} from './titel.mjs';
const AB_GAP_STANDARDS=schoolStandardsByQuest();

/* the limits of today's app (index.html: slice(-200) in attempts, EVIDENCE_MAX, DUE_MAX, GAPS, slice(-8) in sheets,
   TREE_AT, RANKS); the browser test compares them with the app */
export const DERIVE_LIMITS = { attempts: 200, evidence: 60, due: 40, sheets: 8, jokes: 200, grantlog: 200 };
export const DERIVE_GAPS = [1, 3, 7];
export const DERIVE_TREE_AT = [0, 1, 3, 6, 10, 15, 25];
export const DERIVE_RANKS = RANKS.map(r=>r[1]);

const abClone = (x) => JSON.parse(JSON.stringify(x));
const abOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);               // names come from events: never trust them as object keys
const abAddDays = (day, n) => new Date(Date.parse(day + 'T12:00:00Z') + n * 86400000).toISOString().slice(0, 10);   // calendar days
const abSameRow = (a, b) => !!a && !!b && a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
const abLevel = (q) => q.level || 2;                                           // index.html: levelOf
const abStage = (days) => DERIVE_TREE_AT.filter((x) => days >= x).length - 1;  // index.html: treeStage

/* ev: per skill the last answers as [day, level, ok] (index.html: recordAnswer); every row is a practice day */
function abPushEvidence(st, ctx, skill, row, originalLevel=row[1],sheet) {
  if (skill === '__proto__') return;
  const list = abOwn(st.ev, skill) ? st.ev[skill] : [];
  const standard=AB_GAP_STANDARDS[skill]?.[0], rating=ctx.gapSchool[standard];
  const before=secureEvidence(list), complete=!list.some(r=>rating&&r[0]>=rating.day);
  const previous=list.slice();
  list.push(row);
  let seq;
  if(standard){
    st.gaps ||= {closed:{},active:null,hold:{}};
    seq=gapRemember(st.gaps,skill,previous,row,originalLevel,sheet,ctx.gapClosed[standard]?.schoolDay>=rating?.day);
  }
  if(rating&&seq>gapConsumed(st.gaps,standard,skill,rating)){
    st.gaps ||= {closed:{},active:null,hold:{}};
    st.gaps.journey ||= {};
    gapObserve(st.gaps.journey,{standard,quest:skill,rating,row,originalLevel,secureBefore:before,secureAfter:secureEvidence(list),complete,previous,sheet,seq,used:st.gaps.used?.[standard],closed:ctx.gapClosed[standard]?.schoolDay>=rating.day});
  }
  st.ev[skill] = list.slice(-DERIVE_LIMITS.evidence);
  ctx.days.add(row[0]);
}
function abPushAttempt(st, row) {
  st.attempts.push(row);
  st.attempts = st.attempts.slice(-DERIVE_LIMITS.attempts);
}
/* a grown-up changes a sheet result: take the old entry back exactly (index.html: undoResult). The repeat entry
   ("due") is not touched here: it only follows "review" events. */
function abUndoSheetResult(st, it) {
  const r = it.rec;
  if (!r) return false;                                                         // an old result without a record stays locked
  if (it.q.world === '__proto__') return false;
  const list = abOwn(st.ev, it.q.world) ? st.ev[it.q.world] : [];
  for (let i = list.length - 1; i >= 0; i--) if (abSameRow(list[i], r.ev)) { list.splice(i, 1); break; }
  st.ev[it.q.world] = list;
  st.attempts = st.attempts.filter((a) => a.sheet !== r.key);
  if(st.gaps)gapForget(st.gaps,it.q.world,r.key);
  gapUndo(st.gaps?.journey,AB_GAP_STANDARDS[it.q.world]?.[0],it.q.world,r.key);
  return true;                                                                  // (the caller sets the new result and record)
}

function abApply(st, ctx, e) {
  const p = e.payload;
  switch (e.type) {
    case 'gap_state': {
      const s=p.standard;if(s==='__proto__')break;
      if(p.state==='closed'){
        if(p.by==='app'&&ctx.gapHold[s]?.schoolDay>=p.schoolDay)break;
        st.gaps ||= {closed:{},active:null,hold:{}};gapUse(st.gaps,s,p.schoolDay);if(p.schoolDay<ctx.gapSchool[s]?.day)gapProjectSource(st.gaps,ctx.gapSchool);
        ctx.gapClosed[s]={schoolDay:p.schoolDay};if(p.by==='parents')delete ctx.gapHold[s];
      }else{delete ctx.gapClosed[s];if(p.state==='hold')ctx.gapHold[s]={schoolDay:p.schoolDay};else delete ctx.gapHold[s];}
      break;
    }
    case 'answer' : {                                                            // index.html: observeAttempt, showHint, showExample, showWorked
      abPushAttempt(st, abClone(p));                                            // the event IS the stored attempt
      const shown = p.hintShown || p.exampleShown || p.solutionShown;
      if (!shown && p.attempt === 1) {
        const row=[p.day,p.help?1:p.level,p.ok?1:0];
        if(typeof p.help==='boolean')row.push(p.ok===true&&p.help===false&&!p.example);
        abPushEvidence(st,ctx,p.skill,row,p.level);
      } else if (p.solutionShown && p.beforeTry) abPushEvidence(st, ctx, p.skill, [p.day,1,0,false],p.level); // answer shown: support level
      break;
    }
    case 'tree_record': case 'tree_open': Object.assign(st,treeProjection(st,e.type,p));break;
    case 'reward_seen': case 'discovery_bonus': case 'round_reward': Object.assign(st,starProjection(st,e.type,p));break;
    case 'round_done': {                                                        // index.html: showResults
      st.total += p.stars;
      const key = 'best_' + p.skill;
      if (p.stars > (st[key] || 0)) st[key] = p.stars;
      break;
    }
    case 'badge': {                                                             // index.html: addBadge; "inquirer" also remembers the quest (tried)
      if (p.badge === '__proto__') break;
      st.badges[p.badge] = (abOwn(st.badges, p.badge) ? st.badges[p.badge] : 0) + 1;
      if (p.badge === 'inquirer' && p.skill && !st.tried.includes(p.skill)) st.tried.push(p.skill);
      break;
    }
    case 'review': {                                                            // index.html: rememberWrong (box 0), advanceDue (box 1, 2; 3 = done / taken back)
      const i = st.due.findIndex((d) => d.id === p.qid);
      if (p.box >= DERIVE_GAPS.length) { if (i >= 0) st.due.splice(i, 1); break; }
      const at = p.dueAt || abAddDays(p.day, DERIVE_GAPS[p.box]);
      if (p.box === 0) {
        if (!p.question) break;                                                 // nothing to repeat without the question
        if (i >= 0) st.due.splice(i, 1);
        st.due.push({ id: p.qid, box: 0, at, q: abClone(p.question) });
        st.due = st.due.slice(-DERIVE_LIMITS.due);
      } else if (i >= 0) { st.due[i].box = p.box; st.due[i].at = at; }
      break;
    }
    case 'practice_day': ctx.days.add(p.day); break;
    case 'rank_seen': {
      if (!DERIVE_RANKS.includes(p.rank)) break;
      // The first conversion was projected before replay; only explicitly
      // knowledge-earned titles can raise it. A late old client's clock cannot
      // backdate a star promotion into the already frozen legacy title.
      if (p.policy === RANK_POLICY || !ctx.rankConverted) st.rankSeen = higherRank(st.rankSeen,p.rank);
      break;
    }
    case 'sheet_created': {                                                     // index.html: buildSheet
      if (st.sheets.some((s) => s.id === p.sheet)) break;
      st.sheets.push({ id: p.sheet, day: p.day, no: p.no, items: abClone(p.items), writing: p.writing });
      st.sheets = st.sheets.slice(-DERIVE_LIMITS.sheets);
      st.sheetNo = Math.max(st.sheetNo || 0, p.no);
      break;
    }
    case 'sheet_result': {                                                      // index.html: enterResult
      const sh = st.sheets.find((s) => s.id === p.sheet), it = sh && sh.items[p.index];
      if (!it || !it.q || it.res === p.res) break;
      if (it.res && !abUndoSheetResult(st, it)) break;
      const q = it.q, key = p.sheet + ':' + p.index;
      const row = [p.day, p.res === 'help' ? 1 : (q.assisted ? 1 : abLevel(q)), p.res === 'no' ? 0 : 1, p.res === 'ok' && !q.assisted];
      if (q.world) abPushEvidence(st, ctx, q.world, row,abLevel(q),key);
      it.rec = { ev: q.world ? abClone(row) : null, key, due: p.res === 'no' ? p.qid : null };
      abPushAttempt(st, { day: p.day, skill: q.world, level: abLevel(q), attempt: 1, ok: p.res !== 'no', help: p.res === 'help', sheet: key });
      it.res = p.res;
      ctx.days.add(sh.day);                                                     // a sheet with an entry counts as a practice day (its own day)
      if (!sh.principled && sh.items.every((i) => i.res)) sh.principled = true; // once per sheet, also after a correction
      break;
    }
    case 'sheet_discarded': st.sheets = st.sheets.filter((s) => s.id !== p.sheet); break;
    case 'advent_open': {                                                       // index.html openDoor: the door is added once
      const key = 'advent' + p.year, list = Array.isArray(st[key]) ? st[key] : [];
      if (!list.includes(p.door)) list.push(p.door);
      st[key] = list;
      break;
    }
    case 'joke_seen': {                                                         // index.html jokeFor + witze.mjs jokeNext: drop "forget", the joke goes to the end, the last 200 stay
      const forget = Array.isArray(p.forget) ? p.forget : [];
      const list = (Array.isArray(st.jokeSeen) ? st.jokeSeen : []).filter((id) => id !== p.joke && !forget.includes(id));
      st.jokeSeen = list.concat([p.joke]).slice(-DERIVE_LIMITS.jokes);
      break;
    }
    case 'content_vote': {
      const next=contentVoteState(st.contentFeedback,st.jokeRejected,p);st.contentFeedback=next.votes;st.jokeRejected=next.rejected;break;
    }
    case 'story_read':                                                          // geschichten.mjs storyMarkRead: moves to the end
      st.storyRead = (Array.isArray(st.storyRead) ? st.storyRead : []).filter((id) => id !== p.story).concat([p.story]);
      break;
    case 'grant_set': case 'grant_revoked': case 'grant_opened': abGrant(st, e); break;
    default: break;                                                             // "last wins" types and everything else: see derive
  }
}

/* grants and their log (task 3b-1c; index.html bindGrants, grantOpened, grantLog). The log is the protocol: one entry per
   event, at = the event's time (the app stores the time of its event). "grants" follows from the log:
     grant_set      a new grant { id, grantee, scope, from, until, by } + log "erteilt" (with until, by, text)
     grant_revoked  revokedAt = the time; log "widerrufen" - only for a known grant that is not ended yet (as the app)
     grant_opened   log "geöffnet" (with scope)
   Not here (device notes, computed from "until" when reading - task 3b-2): expiredLogged and the log entry "abgelaufen". */
function abGrant(st, e) {
  const p = e.payload, gs = Array.isArray(st.grants) ? st.grants : [], log = Array.isArray(st.grantlog) ? st.grantlog : [];
  const add = (entry) => { log.push(entry); st.grantlog = log.slice(-DERIVE_LIMITS.grantlog); };
  if (e.type === 'grant_set') {
    if (gs.some((g) => g.id === p.grant)) return;
    gs.push({ id: p.grant, grantee: p.grantee, scope: p.scope.slice(), from: p.from, until: p.until, by: e.author });
    st.grants = gs;
    add(Object.assign({ at: e.at, ev: 'erteilt', grant: p.grant, grantee: p.grantee, scope: p.scope.slice(), until: p.until, by: e.author }, p.text === undefined ? {} : { text: p.text }));
  } else if (e.type === 'grant_revoked') {
    const g = gs.find((x) => x.id === p.grant);
    if (!g || g.revokedAt) return;
    g.revokedAt = e.at;
    add({ at: e.at, ev: 'widerrufen', grant: p.grant, grantee: p.grantee, by: e.author });
  } else {
    add(Object.assign({ at: e.at, ev: 'geöffnet', grant: p.grant, grantee: p.grantee }, p.scope === undefined ? {} : { scope: p.scope.slice() }));
  }
}

/* "last wins" values (concept 7.2): the winning event of each field */
function abSetField(st, key, value) {
  if (value === null) delete st[key]; else st[key] = abClone(value);            // a cleared profile field is no stored key
}
function abApplyWinner(st, e) {
  const p = e.payload;
  switch (e.type) {
    case 'profile_set': abSetField(st, p.field, p.value); break;
    case 'setting_set': abSetField(st, p.setting, p.value); break;
    case 'day_flag': st[p.flag] = p.day; break;
    case 'checklist_set': {                                                     // one tick; the list grows as far as the highest tick
      const key = 'chk_' + p.studio, a = Array.isArray(st[key]) ? st[key].slice() : [];
      while (a.length <= p.index) a.push(false);
      a[p.index] = p.value;
      st[key] = a;
      break;
    }
    // task 3b-1c: a person's own settings (its log, area person:<id>) and the parents' last backup
    case 'person_set': abSetField(st, p.field, p.value); break;               // parentLang, muted, conceptSeen (the day)
    case 'glance_set': st.glance = Object.assign({}, st.glance, { [p.child]: abClone(p.value) }); break;   // per child (a pid, never "__proto__")
    case 'backup_made': st.lastBackup = p.day; break;
    default: break;                                                             // rank_seen: the highest one counts (abApply)
  }
}

/* the app stores a checklist as a list as long as the studio has items (index.html openStudio: chk_<studio>);
   an event carries that number as "size" (task 3b-1b). The list is filled up with false to the largest size. */
function abChecklistSize(st, list) {
  for (const e of list) {
    if (e.type !== 'checklist_set' || !e.payload.size) continue;
    const key = 'chk_' + e.payload.studio;
    if (!Array.isArray(st[key])) continue;                                      // (every checklist event also sets a value: the list exists)
    while (st[key].length < e.payload.size) st[key].push(false);
  }
}

/* lists the app stores whole but that are synced per entry (task 3b-1b-2): unlocked, focusManual.
   The list_set events are replayed in "last wins" order (the same on every device): on = add at the end if missing,
   off = remove. That is what index.html does (concat / filter); the app writes only the entries that changed.
   Focus: index.html keeps focusManual exactly while focusMode is "manual" (setFocusMode stores and deletes both),
   so the list exists then (empty if nothing is chosen) and is gone otherwise. */
function abLists(st, list, now) {
  // task 3b-2a: while the focus is not manual, the replayed list is kept in _focusManual (like _days, no storage key), so a
  // base state plus later events gives the same as all events together (entries from another device stay counted)
  if (!Array.isArray(st.focusManual) && Array.isArray(st._focusManual)) st.focusManual = st._focusManual;
  delete st._focusManual;
  for (const e of lastWinsOrder(list, now)) {
    if (e.type !== 'list_set') continue;
    const p = e.payload, cur = Array.isArray(st[p.list]) ? st[p.list] : [];
    st[p.list] = p.on ? (cur.includes(p.item) ? cur : cur.concat([p.item])) : cur.filter((x) => x !== p.item);
  }
  if (st.focusMode === 'manual') { if (!Array.isArray(st.focusManual)) st.focusManual = []; }
  else { if (Array.isArray(st.focusManual) && st.focusManual.length) st._focusManual = st.focusManual; delete st.focusManual; }
}

/* gaps per school (concept "Elternbereich" 6; task 3b-0): today's key "gaps" =
     { closed: { <standard>: { at, by: 'app'|'parents', schoolDay, quest? } }, active: <standard>|null, hold: { <standard>: { at, schoolDay } } }
   One event per standard ("last wins" per standard, key gap_state:<standard>) and gap_active. The events are replayed
   in "last wins" order (lastWinsOrder: the same on every device), each one doing what index.html does today:
     closed by "app"     openGaps: closed[s] = {at, by:'app', schoolDay, quest}; an older hold stays as it is
     closed by "parents" gapAct 'close': closed[s] = {at, by:'parents', schoolDay}; hold[s] goes; active goes if it was s
     hold                gapAct 'hold': closed[s] goes; hold[s] = {at, schoolDay}; active = s
     open                (no button today) closed[s] and hold[s] go
     gap_active          gapAct 'go': active = standard (or null)
   So "close" and "hold" need no extra gap_active event, and a choice made on another phone is not undone by them.
   One rule beyond the order: an automatic close does not count while the parents keep the gap open for the same or a
   newer school rating (hold.schoolDay >= schoolDay) - index.html openGaps never closes a held gap; the event can only
   come from a device that did not know the hold yet. "Closed stays closed until a newer weak rating" is decided by the
   app when reading (schoolDay), not here. Without any gap event (and without gaps in the base) there is no key. */
function abGaps(st, list, now) {
  const order = lastWinsOrder(list, now).filter((e) => e.type === 'gap_state' || e.type === 'gap_active');
  if (!order.length) return;
  const b = st.gaps && typeof st.gaps === 'object' ? st.gaps : {};
  const copy = (o) => Object.fromEntries(Object.entries(o && typeof o === 'object' ? o : {}));   // own keys only, safe for any name
  const g = { ...b, closed: copy(b.closed), active: b.active === undefined ? null : b.active, hold: copy(b.hold) };
  for (const e of order) {
    const p = e.payload, s = p.standard;
    if (e.type === 'gap_active') { g.active = s; continue; }
    if (s === '__proto__') continue;                                            // a name from an event is never an object property
    const held = abOwn(g.hold, s) && g.hold[s] && g.hold[s].schoolDay >= p.schoolDay;
    if (p.state === 'closed' && p.by === 'app') {
      if (held) continue;
      g.closed[s] = p.quest === undefined ? { at: p.day, by: 'app', schoolDay: p.schoolDay } : { at: p.day, by: 'app', schoolDay: p.schoolDay, quest: p.quest };
    } else if (p.state === 'closed') {
      g.closed[s] = p.quest === undefined ? { at: p.day, by: 'parents', schoolDay: p.schoolDay } : { at: p.day, by: 'parents', schoolDay: p.schoolDay, quest: p.quest };
      delete g.hold[s];
      if (g.active === s) g.active = null;
    } else if (p.state === 'hold') {
      delete g.closed[s];
      g.hold[s] = { at: p.day, schoolDay: p.schoolDay };
      g.active = s;
    } else { delete g.closed[s]; delete g.hold[s]; }                            // open
  }
  st.gaps = g;
}

/* derive(events, { now, base }): the state in today's storage format.
   events: any list (any order, doubles are fine); invalid ones are ignored (see mergeLog for the report).
   now:    milliseconds / Date / UTC text - needed for the clock rule (a time more than 24 h ahead counts as "now").
   base:   optional { upTo, state } - a state (a result of derive, e.g. from a snapshot) as of the time upTo;
           only events after upTo are replayed on top of it.
   retainedTitle: optional known snapshot title/policy context for full fallback;
                  it seeds only these title fields, never a raw evidence/time base.
   The result has one extra key, _days (the practice days so far), that a later base needs; it is not a storage key.
   Likewise _focusManual (task 3b-2a): the focus list while the focus is not manual, only when it has entries. */
export function derive(events, { now, base, retainedTitle, retainedJokeRejections } = {}) {
  if (now === undefined || now === null) throw new Error('derive: "now" is missing');
  const st = Object.assign({ attempts: [], ev: {}, due: [], total: 0, badges: {}, tried: [], treeStage: 0, sheets: [], sheetNo: 0, _days: [] }, base ? abClone(base.state) : {});
  // A known snapshot policy must suppress old star titles before replay, even
  // when its remembered title is missing/unknown. No evidence or time filtering.
  if(retainedTitle?.rankPolicy===RANK_POLICY){
    st.rankPolicy=RANK_POLICY;
    if(DERIVE_RANKS.includes(retainedTitle.rankSeen))st.rankSeen=higherRank(st.rankSeen,retainedTitle.rankSeen);
  }
  if(Array.isArray(retainedJokeRejections))st.jokeRejected=[...new Set([...(Array.isArray(st.jokeRejected)?st.jokeRejected:[]),...retainedJokeRejections.filter(id=>typeof id==='string')])];
  const ctx = { days: new Set(st._days), gapSchool:{...(st.gaps?.school||{})},gapAsOf:st.gaps?.schoolAsOf||'',gapClosed:{...(st.gaps?.closed||{})},gapHold:{...(st.gaps?.hold||{})} };
  let list = mergeLog([Array.isArray(events) ? events : []], now).events;
  // A pre-fix snapshot may lack the criterion context. Hydrate only from
  // genuinely available school events, including roots before its answer cut.
  const schoolEvents=list.filter(e=>e.type==='school_import'||e.type==='school_evaluation');
  if (base) {
    const upTo = effectiveTime(base.upTo, now);
    if (Number.isNaN(upTo)) throw new Error('derive: base.upTo is not a UTC time');
    list = list.filter((e) => effectiveTime(e.at, now) > upTo);
  }
  // Freeze the legacy title actually observed at conversion, never re-read
  // stars here: a later round from a slower device can sort before this event.
  // Legacy rank history known to the converting app is already in its payload.
  // An `after` reference marks a later migration attempt, regardless of clocks.
  const rankEvents=list.filter(e=>e.type==='rank_seen' && DERIVE_RANKS.includes(e.payload.rank));
  ctx.rankConverted=st.rankPolicy===RANK_POLICY || rankEvents.some(e=>e.payload.policy===RANK_MIGRATION || e.payload.policy===RANK_POLICY);
  if(ctx.rankConverted){
    // Offline devices may independently protect different genuine old titles.
    // Merge those roots as a maximum; causally later attempts never add a root.
    for(const conversion of rankEvents.filter(e=>e.payload.policy===RANK_MIGRATION && !e.payload.after))st.rankSeen=higherRank(st.rankSeen,conversion.payload.rank);
    st.rankPolicy=RANK_POLICY;
  }
  // A received school's rating is applicable by assessment day, even when the
  // other device's event clock is ahead. No timestamps or wire data are changed.
  abGapSchool(st,ctx,schoolEvents);
  if(ctx.gapAsOf){st.gaps ||= {closed:{},active:null,hold:{}};st.gaps.school=ctx.gapSchool;st.gaps.schoolAsOf=ctx.gapAsOf;gapProjectSource(st.gaps,ctx.gapSchool);}
  for (const e of list) abApply(st, ctx, e);
  for (const e of Object.values(lastWins(list, now))) abApplyWinner(st, e);
  abChecklistSize(st, list);
  abLists(st, list, now);
  abGaps(st, list, now);
  if(ctx.gapAsOf&&st.gaps)gapProjectSource(st.gaps,ctx.gapSchool);
  st.treeStage = Math.max(st.treeStage || 0, abStage(ctx.days.size));         // the tree only grows (index.html keeps the highest stage)
  st._days = [...ctx.days].sort();
  return st;
}

/* A resolution names the competing siblings it supersedes. A sibling that
   arrives later remains a contender, as do two concurrent resolutions. */
function abSchoolContenders(siblings) {
  const known = new Set(siblings.filter(p => !p.resolves).map(p => p.revision));
  const superseded = new Set();
  let changed = true;
  while (changed) {
    changed = false;
    for (const p of siblings) {
      if (known.has(p.revision) || !p.resolves || !p.resolves.every(id => known.has(id))) continue;
      known.add(p.revision);
      for (const id of p.resolves) superseded.add(id);
      changed = true;
    }
  }
  return siblings.filter(p => known.has(p.revision) && !superseded.has(p.revision));
}

/* Shared with the confirmation preview (EV-4). The first grade in ratingOrder
   wins; changing that policy does not require changing any original criteria.
   Overrides are explicit confirmed parent decisions in the same revision. */
export function schoolEvaluationStandards(criteria, { ratingOrder = ['RS', 'C', 'M', 'E'], standardOverrides = {} } = {}) {
  if (!Array.isArray(ratingOrder) || ratingOrder.length !== 4 || !['RS', 'C', 'M', 'E'].every(r => ratingOrder.includes(r))) throw new Error('schoolEvaluationStandards: invalid ratingOrder');
  const ratings = new Map();
  for (const c of Array.isArray(criteria) ? criteria : []) {
    if (!c || c.standard === 'none' || schoolStandardInfo(c.standard) === null || !ratingOrder.includes(c.rating)) continue;
    if (!ratings.has(c.standard) || ratingOrder.indexOf(c.rating) < ratingOrder.indexOf(ratings.get(c.standard))) ratings.set(c.standard, c.rating);
  }
  if (!standardOverrides || typeof standardOverrides !== 'object' || Array.isArray(standardOverrides)
    || Object.entries(standardOverrides).some(([code, rating]) => !ratings.has(code) || !ratingOrder.includes(rating))) throw new Error('schoolEvaluationStandards: invalid standardOverrides');
  return Object.fromEntries([...ratings].map(([code, rating]) => [code, abOwn(standardOverrides, code) ? standardOverrides[code] : rating]));
}

function abSchoolSelection(revisions) {
  const root = [...revisions.values()].find(p => !p.base);
  if (!root) return null;
  const children = new Map();
  for (const p of revisions.values()) {
    if (!p.base) continue;
    if (!children.has(p.base)) children.set(p.base, []);
    children.get(p.base).push(p);
  }
  const history = [root];
  for (let i = 0; i < history.length; i++) {
    const parent = history[i];
    if (!parent.withdrawn) history.push(...(children.get(parent.revision) || []));
  }
  let active = root, contenders = [];
  while (!active.withdrawn) {
    contenders = abSchoolContenders(children.get(active.revision) || []);
    if (contenders.length !== 1) break;
    active = contenders[0];
    contenders = [];
  }
  return {active,history,contenders};
}

function abSchoolManual(revisions) {
  const selection=abSchoolSelection(revisions);
  if(!selection)return null;
  const {active,history,contenders}=selection;
  const { evaluation, revision, standard, focus, withdrawn } = active;
  const criteria = active.assessment?.criteria;
  const criterionFormat = criteria?.some(c => abOwn(c, 'standard'));
  const std = criterionFormat ? schoolEvaluationStandards(criteria, { standardOverrides: active.standardOverrides })
    : standard === 'unmapped' ? {} : { [standard]: active.rating };
  const focusNext = withdrawn ? [] : criterionFormat
    ? [...new Set(Object.entries(std).filter(([, rating]) => schoolEvaluationNeedsPractice(rating)).flatMap(([code]) => schoolStandardInfo(code).quests))]
    : focus === 'none' ? [] : [SCHOOL_EVALUATION_TARGETS[standard].world];
  return {
    title: active.title, day: active.day, area: active.assessment?.area || 'math', std,
    ...(active.assessment ? { assessment: abClone(active.assessment), rubric: active.assessment.criteria.map(c => ({ crit: c.criterion, teacher: c.rating, self: '' })) } : {}),
    quests: focusNext, focusNext,
    // focus:none prevents the old single-standard pilot from scheduling special
    // cards for the new format; catalog quest metadata above is available to EV-4/EV-7.
    manual: { evaluation, revision, ...(criterionFormat ? { focus: 'none' } : { standard, focus }),
      ...(active.standardOverrides ? { standardOverrides: abClone(active.standardOverrides) } : {}), withdrawn: !!withdrawn, history: abClone(history),
      conflicts: contenders.map(p => p.revision) },
  };
}

// Cache only the school inputs needed by the existing gap projection. This is
// derived snapshot/reader context, never another event or a school write path.
// Keep revision links so a later correction/withdrawal has the same meaning in
// a snapshot continuation as in a full deriveSchool replay.
function abGapSchool(st,ctx,list){
  if(!st.gaps?.schoolSource&&!list.some(e=>e.type==='school_evaluation')){
    for(const e of list)if(e.type==='school_import'&&e.payload.data.asOf===e.payload.asOf&&Array.isArray(e.payload.data.tasks)&&e.payload.asOf>=ctx.gapAsOf){ctx.gapAsOf=e.payload.asOf;ctx.gapSchool=gapSchoolRatings(e.payload.data);}
    return;
  }
  st.gaps ||= {closed:{},active:null,hold:{}};
  const source=st.gaps.schoolSource ||= {asOf:ctx.gapAsOf,imported:abClone(ctx.gapSchool),evaluations:{}};
  for(const e of list){
    const p=e.payload;
    if(e.type==='school_import'&&p.data.asOf===p.asOf&&Array.isArray(p.data.tasks)&&p.asOf>=source.asOf){
      source.asOf=p.asOf;source.imported=gapSchoolRatings(p.data);
    }else if(e.type==='school_evaluation'){
      const key=p.child+':'+p.evaluation,revisions=source.evaluations[key] ||= {};
      if(abOwn(revisions,p.revision))continue;
      const criteria=p.assessment?.criteria,criterion=!!criteria?.some(c=>abOwn(c,'standard'));
      revisions[p.revision]={revision:p.revision,day:p.day,criterion,
        ...(p.base?{base:p.base}:{}),...(p.resolves?{resolves:p.resolves.slice()}:{}),...(p.withdrawn?{withdrawn:true}:{}),
        std:criterion?schoolEvaluationStandards(criteria,{standardOverrides:p.standardOverrides}):{}};
    }
  }
  const tasks=Object.entries(source.imported).map(([s,r])=>({day:r.day,std:{[s]:r.st}}));
  ctx.gapAsOf=source.asOf;
  for(const revisions of Object.values(source.evaluations)){
    for(const p of Object.values(revisions))if(p.day>ctx.gapAsOf)ctx.gapAsOf=p.day;
    const selected=abSchoolSelection(new Map(Object.entries(revisions)));
    if(selected?.active.criterion&&!selected.active.withdrawn)tasks.push({day:selected.active.day,std:selected.active.std});
  }
  ctx.gapSchool=gapSchoolRatings({tasks});
}

/* deriveSchool(events, { now }): the school ratings of a child from its log (task "Schulbewertungen uebernehmen",
   preparation stage 4) - the object the app keeps per child today (werkzeug/schuldaten.json, kinder.<name> =
   { asOf, tasks }), or null without any school events. Manual evaluations are separate rows.
   Rule: the import with the newest asOf wins; on the same asOf the later one in the merged log (time, then id) - every
   device decides the same. An import whose data does not carry the same asOf, or has no list of tasks, never counts. */
export function deriveSchool(events, { now } = {}) {
  if (now === undefined || now === null) throw new Error('deriveSchool: "now" is missing');
  let best = null;
  let manualAsOf = '';
  const manual = new Map();
  for (const e of mergeLog([Array.isArray(events) ? events : []], now).events) {
    const p = e.payload;
    if (e.type === 'school_evaluation') {
      const key = p.child + ':' + p.evaluation;
      if (!manual.has(key)) manual.set(key, new Map());
      const revisions = manual.get(key);
      if (revisions.has(p.revision)) continue;
      revisions.set(p.revision, p);
      const date = new Date(effectiveTime(e.at, now)).toISOString().slice(0, 10);
      if (date > manualAsOf) manualAsOf = date;
    } else if (e.type === 'school_import' && p.data.asOf === p.asOf && Array.isArray(p.data.tasks)) {
      if (!best || p.asOf >= best.asOf) best = p;
    }
  }
  const tasks = [...manual.values()].map(abSchoolManual).filter(Boolean);
  if (!tasks.length) return best ? abClone(best.data) : null;
  const school = best ? abClone(best.data) : { asOf: '', tasks: [] };
  school.tasks.push(...tasks);
  if (manualAsOf > school.asOf) school.asOf = manualAsOf;
  return school;
}
