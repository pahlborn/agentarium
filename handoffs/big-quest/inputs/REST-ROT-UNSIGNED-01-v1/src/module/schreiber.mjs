// Module schreiber - the test build writes every change of the child's data also as an event (S12, task 3b-1; EP7).
// index.html calls evHook(type, payload) at each place where it stores something that is synced later; in the test
// build evHook hands it to a writer made here. The live build has no stage-2 modules: there evHook does nothing.
// No screen, no network. Storage, clock, randomness and "who is acting" are passed in, so it runs in Node.
//
//   writer = evSchreiber({ read, write, device, who, now, rand })
//     read()       -> the stored event list of the current child (anything that is not a list counts as empty)
//     write(list)  stores the list
//     device       the device ID "d_..." (newDeviceId once per device)
//     who()        -> { person: "p_...", role: 'child' | 'parent' | 'teacher' | 'admin' } of the person acting now
//     now()        -> milliseconds
//   writer.write(type, payload) -> { ok: true, event } or { ok: false, grund, fehler? }
//   writer.problems: every refused event { type, grund, fehler? } - nothing is dropped silently
//
// Refused (and not stored): nobody known is acting (wer-unbekannt), the event is not well-formed (format), the role
// may not write this type (rolle-darf-nicht - the same rule as module annahme when reading).
// Times: each event of this device is at least 1 ms after the previous one of this device (UTC with milliseconds),
// so the order of one device never depends on the random event id. Events are not signed yet (keys: EP8/EP9).
//
// Names: helpers start with "sw"/"SW_" because all modules and index.html share one scope in the app.

import { newEvent, checkEvent } from './ereignisse.mjs';
import { roleMayWrite } from './annahme.mjs';
import {RANK_POLICY,RANK_MIGRATION,rankIdx} from './titel.mjs';

export const SCHREIBER_GRUENDE = ['wer-unbekannt', 'format', 'rolle-darf-nicht'];

const swRandom = (n) => globalThis.crypto.getRandomValues(new Uint8Array(n));
const SW_ALPHA = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const swList = (x) => (Array.isArray(x) ? x : []);

/* a new device ID: "d_" and 20 characters (100 bits) */
export function newDeviceId(rand = swRandom) {
  return 'd_' + Array.from(rand(20), (b) => SW_ALPHA[b & 31]).join('');
}

export function evSchreiber({ read, write, device, who, now, rand = swRandom, titlePolicy = () => null } = {}) {
  for (const [n, f] of [['read', read], ['write', write], ['who', who], ['now', now], ['titlePolicy',titlePolicy]]) if (typeof f !== 'function') throw new Error('schreiber: ' + n + ' fehlt.');
  const problems = [];
  const refuse = (type, grund, fehler) => {
    const p = fehler ? { type, grund, fehler } : { type, grund };
    problems.push(p);
    return { ok: false, ...p };
  };
  function writeOne(type, payload) {
    const w = who() || {};
    const list = swList(read());
    let last = -Infinity;
    for (const x of list) if (x && x.device === device) { const t = Date.parse(x.at); if (t > last) last = t; }
    const t = Math.max(Math.floor(now()), last + 1);
    if (typeof w.person !== 'string' || typeof w.role !== 'string') return refuse(type, 'wer-unbekannt');
    // EP03 only: a migration written after an already observed cutover is
    // causally later even when this device's clock sorts it before that cutover.
    if(type==='rank_seen' && payload?.policy===RANK_MIGRATION){
      const prior=list.find(x=>checkEvent(x).length===0 && (x.type==='rank_seen' && rankIdx(x.payload.rank)>=0 && [RANK_MIGRATION,RANK_POLICY].includes(x.payload.policy)
        || x.type==='snapshot' && x.payload.state?.rankPolicy===RANK_POLICY));
      const after=prior?.id || (titlePolicy()===RANK_POLICY?'base':null);
      if(after)payload={...payload,after};
    }
    const e = newEvent({ type, author: w.person, device, payload, at: new Date(t).toISOString() }, { rand });
    const fehler = checkEvent(e);
    if (fehler.length) return refuse(type, 'format', fehler);
    if (!roleMayWrite(w.role, e)) return refuse(type, 'rolle-darf-nicht');
    write(list.concat([e]));
    return { ok: true, event: e };
  }
  return { write: writeOne, problems };
}
