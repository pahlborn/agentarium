// Module zulassung - the admission of an area, built from the area's own signed events (S12 P3b-2a; concept 6, 8.3,
// 9.1). Test build only (module.json: bau "test", after abgleich). No screen, no browser storage, no network.
//
//   Every area carries its own admission (module bereiche: member_*, device_*, key_rotated fit every area). Whoever
//   holds the key of an area can read and check it - also the child and a teacher, who cannot read eltern:allg.
//
//   anker:     { person, role, pub } - the parent who created the child (for person:<id>: the person). He is a member
//              from the start. His public keys come from outside (invitation / start code with fingerprint, EP9).
//   rules:     events in the order every device uses (effective time, then id); an admission event counts only if
//              module annahme accepts it against the admission at that moment:
//                member_added, member_removed, device_removed: a parent who is a member then, from a device of his
//                device_added: any member, for his own device (the device is registered by this very event)
//              member_added again with the same role and keys changes nothing; with others it starts a new period -
//              unless its "stand" (directory entry of the keys, task "Einladungen"; missing = 1) is lower than the
//              current period's: then it is dropped ("stand-alt"), so a late old device never puts old keys back.
//              Task "Neuer Schluessel": a member may announce his OWN new keys (same role; teacher and admin, too), signed
//              with the old ones - the new period starts one millisecond later, so the announcement is checked against
//              the old keys.
//              member_removed ends the membership and all devices of that person; device_removed ends the device
//              for everybody who had it (a shared iPad).
//   result:    { area, now, members: { <personId>: { role, pub, stand?, devices, perioden, geraete } }, verworfen: [{ id, grund }] }
//              role, pub, stand (only above 1): of the latest period; devices: every device ever registered; perioden:
//              [{ von, bis, role, pub, stand? }] and geraete: { <deviceId>: [{ von, bis }] } in milliseconds (von null = from the start, bis null
//              = still). Former members stay in the list, so what they wrote while they belonged keeps its signature.
//              Module annahme checks "at this time" with perioden and geraete (task P3b-2b; now = the clock used here).
//
// Names: every helper starts with "zul"/"ZUL_" because all modules and index.html share one scope in the app.

import { checkEvent, effectiveTime } from './ereignisse.mjs';
import { acceptEvent } from './annahme.mjs';
import { schluesselLesen } from './bereiche.mjs';
import { holen } from './abgleich.mjs';

/* the event types that change the admission */
export const ZULASSUNG_TYPEN = Object.freeze(['member_added', 'member_removed', 'device_added', 'device_removed']);

const ZUL_ROLLEN = ['child', 'parent', 'teacher', 'admin'];
const zulObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const zulCmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const zulGleichePub = (a, b) => zulObj(a) && zulObj(b) && a.ecdh === b.ecdh && a.ecdsa === b.ecdsa;
function zulFehler(text) { return new Error('zulassung: ' + text); }
function zulPruefeAnker(a) {
  if (!zulObj(a) || typeof a.person !== 'string' || !/^p_[0-9A-Za-z]{1,40}$/.test(a.person) || !ZUL_ROLLEN.includes(a.role) ||
      !zulObj(a.pub) || typeof a.pub.ecdh !== 'string' || typeof a.pub.ecdsa !== 'string') throw zulFehler('Anker braucht person, role und pub.');
}
const zulAktiv = (liste) => (liste.length && liste[liste.length - 1].bis === null ? liste[liste.length - 1] : null);

/* the admission at this moment, as module annahme expects it (members now, with their devices now) */
function zulJetzt(area, personen) {
  const members = {};
  for (const [pid, p] of personen) {
    const a = zulAktiv(p.perioden);
    if (a) members[pid] = { role: a.role, pub: a.pub, devices: [...p.geraete].filter(([, l]) => zulAktiv(l)).map(([d]) => d).sort(zulCmp) };
  }
  return { area, members };
}

/* builds the admission of the area from its entries ({ event, sig }; anything else is skipped) */
export async function zulassungAus(eintraege, { area, anker, now } = {}) {
  if (typeof area !== 'string' || !area) throw zulFehler('Bereich fehlt.');
  zulPruefeAnker(anker);
  if (now === undefined || now === null) throw zulFehler('"now" fehlt.');
  if (!Array.isArray(eintraege)) throw zulFehler('Liste erwartet.');
  const personen = new Map([[anker.person, { perioden: [{ von: null, bis: null, role: anker.role, pub: { ecdh: anker.pub.ecdh, ecdsa: anker.pub.ecdsa } }], geraete: new Map() }]]);
  const zeilen = [];
  for (const x of eintraege) {
    if (!zulObj(x) || !zulObj(x.event) || !ZULASSUNG_TYPEN.includes(x.event.type) || checkEvent(x.event).length) continue;
    zeilen.push({ x, t: effectiveTime(x.event.at, now) });
  }
  zeilen.sort((a, b) => (a.t - b.t) || zulCmp(a.x.event.id, b.x.event.id) || zulCmp(String(a.x.sig), String(b.x.sig)));
  const erledigt = new Set(), verworfen = [];
  for (const { x, t } of zeilen) {
    const e = x.event;
    if (erledigt.has(e.id)) continue;
    const z = zulJetzt(area, personen);
    if (e.type === 'device_added' && z.members[e.author]) z.members[e.author].devices = [...z.members[e.author].devices, e.device];
    const r = await acceptEvent(x, z);
    if (!r.ok) { verworfen.push({ id: e.id, grund: r.grund }); continue; }
    erledigt.add(e.id);
    const p = e.payload;
    if (e.type === 'member_added') {
      if (!personen.has(p.person)) personen.set(p.person, { perioden: [], geraete: new Map() });
      const pe = personen.get(p.person), a = zulAktiv(pe.perioden), stand = p.stand || 1;
      if (a && a.role === p.role && zulGleichePub(a.pub, p.pub)) continue;
      // task "Einladungen": keys of an older directory entry never replace newer ones (an old device writing late)
      if (a && stand < (a.stand || 1)) { verworfen.push({ id: e.id, grund: 'stand-alt' }); continue; }
      // task "Neuer Schluessel": a person announcing his own new keys signs that with the old ones - so the new keys count
      // from the next millisecond, and the announcement itself still belongs to the old period
      const ab = a && e.author === p.person && !zulGleichePub(a.pub, p.pub) ? t + 1 : t;
      if (a) a.bis = ab;
      pe.perioden.push({ von: ab, bis: null, role: p.role, pub: { ecdh: p.pub.ecdh, ecdsa: p.pub.ecdsa }, ...(stand > 1 ? { stand } : {}) });
    } else if (e.type === 'member_removed') {
      const pe = personen.get(p.person), a = pe && zulAktiv(pe.perioden);
      if (!a) continue;
      a.bis = t;
      for (const l of pe.geraete.values()) { const g = zulAktiv(l); if (g) g.bis = t; }
    } else if (e.type === 'device_added') {
      const pe = personen.get(e.author);
      if (!pe.geraete.has(p.device)) pe.geraete.set(p.device, []);
      if (!zulAktiv(pe.geraete.get(p.device))) pe.geraete.get(p.device).push({ von: t, bis: null });
    } else {
      for (const pe of personen.values()) { const l = pe.geraete.get(p.device), g = l && zulAktiv(l); if (g) g.bis = t; }
    }
  }
  const members = {};
  for (const pid of [...personen.keys()].sort(zulCmp)) {
    const pe = personen.get(pid);
    if (!pe.perioden.length) continue;
    const letzte = pe.perioden[pe.perioden.length - 1];
    members[pid] = {
      role: letzte.role, pub: { ...letzte.pub }, ...(letzte.stand ? { stand: letzte.stand } : {}), devices: [...pe.geraete.keys()].sort(zulCmp),
      perioden: pe.perioden.map((q) => ({ ...q, pub: { ...q.pub } })),
      geraete: Object.fromEntries([...pe.geraete.keys()].sort(zulCmp).map((d) => [d, pe.geraete.get(d).map((g) => ({ ...g }))])),
    };
  }
  return { area, now, members, verworfen };
}

/* members who belong now (for the check of key entries: a removed parent's signature no longer counts).
   frueher (task "Neuer Schluessel"): the earlier public keys of a member who renewed his key - key entries he signed
   before the change keep counting, so the history stays readable while the new version is handed out */
export function aktiveMitglieder(zulassung) {
  if (!zulObj(zulassung) || !zulObj(zulassung.members)) throw zulFehler('Zulassung erwartet.');
  const frueher = (m) => {
    const out = [];
    for (const p of m.perioden) if (zulObj(p.pub) && !zulGleichePub(p.pub, m.pub) && !out.some((x) => zulGleichePub(x, p.pub))) out.push({ ecdh: p.pub.ecdh, ecdsa: p.pub.ecdsa });
    return out.length ? { frueher: out } : {};
  };
  return Object.fromEntries(Object.entries(zulassung.members).filter(([, m]) => zulObj(m) && Array.isArray(m.perioden) && zulAktiv(m.perioden)).map(([pid, m]) => [pid, { role: m.role, pub: m.pub, devices: m.devices, ...(m.stand ? { stand: m.stand } : {}), ...frueher(m) }]));
}
const zulKennung = (z) => JSON.stringify(Object.entries(aktiveMitglieder(z)).map(([pid, m]) => [pid, m.role, m.pub.ecdh, m.pub.ecdsa]));

/* fetches one area with only the anchor known in advance: keys (entries signed by a parent who belongs now) -> holen
   with the admission built from the area itself (reading also with my own key entry from a distributor not known yet -
   module bereiche: lesbar; the events are checked against the admission anyway) -> if that brought new members, read the keys again (a key change
   signed by the second parent becomes usable once he is known) - at most "runden" times.
   -> { schluessel, zulassung, neu, verworfen, wartend } (neu and verworfen summed over all rounds) */
export async function bereichHolen(stand, { zugang, ich, meineSchluessel, alteSchluessel, anker, now, runden = 4 } = {}) {
  if (!zulObj(stand) || typeof stand.bereich !== 'string') throw zulFehler('Geraetestand erwartet.');
  zulPruefeAnker(anker);
  const area = stand.bereich, bilde = (eintraege) => zulassungAus(eintraege, { area, anker, now });
  let zul = await bilde(stand.log), neu = 0, h = null, schluessel = null;
  const verworfen = [];
  for (let i = 0; i < runden; i++) {
    schluessel = await schluesselLesen(zugang, area, { ich, meineSchluessel, alteSchluessel, mitglieder: aktiveMitglieder(zul) });
    h = await holen(stand, { zugang, schluessel: { aktuell: schluessel.aktuell, keys: schluessel.lesbar }, zulassung: bilde, now });
    neu += h.neu;
    verworfen.push(...h.verworfen);
    const danach = await bilde(stand.log), anders = zulKennung(danach) !== zulKennung(zul);
    zul = danach;
    if (!anders) break;
  }
  return { schluessel, zulassung: zul, neu, verworfen, wartend: h.wartend };
}
