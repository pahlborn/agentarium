// Module lesen - the test build reads the synced values from events (S12, task 3b-2a; EP7 / US7.2).
// Test build only (module.json: bau "test"). No screen, no network: storage access, clock and the old stored values are
// passed in, so it runs in Node.
//
// What it does for index.html (the "switch" in store.get / kidRead):
//   lesenArt(key)          'kind' | 'person' | null - which values come from a log of events (and are no longer written
//                          to the old storage in the test build). 'kind': the child's log (bq2_<child>__events),
//                          'person': the log of the person acting (bq2_personEvents[<person>]).
//   evProtokoll({ laden, speichern, basis, now })
//                          one log with a cache: the list is read from the storage once, new events are appended in
//                          memory and stored; the derived state is carried forward per new event instead of replaying
//                          all events again (derive with "base"). neuLaden() drops the cache - after a sync, once.
//   altStand(werte)        the old stored values of a child as a base state for derive (until task 3c turns them into a
//                          snapshot event): read-only, the test build never writes them again.
//   grantsAblauf(st, heute) "expired" grants follow from "until" (task 3b-1c: no event, nobody acts): marks them and
//                          adds the log entry "abgelaufen" at the first day after "until".
//
// Names: helpers start with "le"/"LE" because all modules and index.html share one scope in the app.

import { derive } from './ableitung.mjs';
import { effectiveTime } from './ereignisse.mjs';

/* the child's values that come from its log (werkzeug/speicherstellen.json: bereich kind/eltern, abgleich protokoll,
   abgeleitet or letzte-gilt; tests/module/lesen.test.mjs compares both lists). Not here: treeStage (a device note:
   "the tree grew" is shown once per device - the tree itself follows the practice days), events. */
export const LESEN_KIND = Object.freeze(['attempts', 'ev', 'due', 'total', 'badges', 'tried', 'rankSeen', 'rankPolicy', 'name', 'lastName', 'birthday', 'mySchool', 'emoji',
  'bdayParty', 'sheets', 'sheetNo', 'focusMode', 'focusManual', 'unlocked', 'storyCap', 'greetDay', 'mysteryDone', 'storyRead',
  'treeLedger', 'starLedger', 'jokeSeen', 'contentFeedback', 'jokeRejected', 'kidLang', 'gaps', 'grants', 'grantlog', 'lastBackup']);
export const LESEN_KIND_PRAEFIX = Object.freeze(['best_', 'chk_', 'advent']);
/* a person's own values (area person:<id>); muted of a child is in the child's log (profile_set) */
export const LESEN_PERSON = Object.freeze(['parentLang', 'muted', 'conceptSeen', 'glance']);
/* the base of a log starts before every event */
export const LESEN_ANFANG = '1970-01-01T00:00:00.000Z';

const leList = (x) => (Array.isArray(x) ? x : []);
const leOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

export function lesenArt(key) {
  const k = String(key);
  if (LESEN_KIND.includes(k) || LESEN_KIND_PRAEFIX.some((p) => k.startsWith(p) && k.length > p.length)) return 'kind';
  if (LESEN_PERSON.includes(k)) return 'person';
  return null;
}

/* old stored values { key: value } -> base state for derive. The practice days (_days) are counted as the app counts
   them (index.html practiceDays: every day in ev, every sheet with an entry), so the tree grows on from there. */
export function altStand(werte) {
  const st = {};
  for (const [k, v] of Object.entries(werte || {})) if (lesenArt(k) === 'kind' && v !== undefined && v !== null) st[k] = v;
  if (!Object.keys(st).length) return null;
  const days = new Set();
  for (const l of Object.values(st.ev && typeof st.ev === 'object' ? st.ev : {})) for (const r of leList(l)) if (Array.isArray(r)) days.add(r[0]);
  for (const s of leList(st.sheets)) if (s && leList(s.items).some((i) => i && i.res)) days.add(s.day);
  st._days = [...days].filter((d) => typeof d === 'string').sort();
  return st;
}

/* the latest effective time in a list (ms) */
function leUpTo(list, now) {
  let t = -Infinity;
  for (const e of list) { const x = e && typeof e.at === 'string' ? effectiveTime(e.at, now) : NaN; if (x > t) t = x; }
  return t;
}

export function evProtokoll({ laden, speichern, basis = () => null, now } = {}) {
  for (const [n, f] of [['laden', laden], ['speichern', speichern], ['basis', basis], ['now', now]]) if (typeof f !== 'function') throw new Error('lesen: ' + n + ' fehlt.');
  let liste = null, stand = null, upTo = -Infinity, nr = 0;
  const zaehler = { voll: 0, weiter: 0 };
  function voll() {
    const t = now(), b = basis(), l = holeListe();
    stand = derive(l, b ? { now: t, base: { upTo: LESEN_ANFANG, state: b } } : { now: t });
    upTo = Math.max(leUpTo(l, t), Date.parse(LESEN_ANFANG));
    zaehler.voll++;
  }
  function holeListe() { if (!liste) liste = leList(laden()).slice(); return liste; }
  return {
    zaehler,
    /** the stored list (cached; do not change it - write with schreiben) */
    liste: holeListe,
    /** store a new list (the writer appends one event: list.concat([e])); only then is the state carried forward */
    schreiben(neu) {
      const alt = holeListe(), l = leList(neu);
      speichern(l);
      liste = l; nr++;
      if (!stand) return;
      const angehaengt = l.length === alt.length + 1 && (alt.length === 0 || l[alt.length - 1] === alt[alt.length - 1]);
      const e = angehaengt ? l[l.length - 1] : null, t = now();
      const et = e && typeof e.at === 'string' ? effectiveTime(e.at, t) : NaN;
      if (!(et > upTo)) { stand = null; return; }                              // not simply "later": compute anew when read
      stand = derive([e], { now: t, base: { upTo: new Date(upTo).toISOString(), state: stand } });
      upTo = et;
      zaehler.weiter++;
    },
    /** the derived state (today's storage format; see ableitung) */
    stand() { if (!stand) voll(); return stand; },
    /** value of one key: { da, wert } (da: false = the key is not stored) */
    wert(key) { const st = this.stand(); return leOwn(st, key) ? { da: true, wert: st[key] } : { da: false }; },
    /** after a sync (other devices' events arrived) or a change of the old values: read and compute anew, once */
    neuLaden() { liste = null; stand = null; upTo = -Infinity; nr++; },
    /** changes with every new list (for caches of the app that depend on the values, e.g. the focus topics) */
    version: () => nr
  };
}

/* grants of a derived state with "expired" (index.html grantsExpire / rechte expireGrants did this on the device):
   every grant not ended and past "until" gets expiredLogged, and the log gets "abgelaufen" at the first moment after the
   last day (until + 1 day, 00:00 UTC), in time order. Changes copies only; returns { grants, grantlog }. */
export function grantsAblauf(st, heute) {
  const gs = leList(st && st.grants).map((g) => Object.assign({}, g)), log = leList(st && st.grantlog).slice();
  for (const g of gs) {
    if (g.revokedAt || !(heute > g.until)) continue;
    g.expiredLogged = true;
    const at = new Date(Date.parse(g.until + 'T00:00:00.000Z') + 864e5).toISOString();
    let i = log.length; while (i > 0 && String(log[i - 1].at) > at) i--;
    log.splice(i, 0, { at, ev: 'abgelaufen', grant: g.id, grantee: g.grantee, scope: g.scope });
  }
  return { grants: gs, grantlog: log.slice(-200) };
}
