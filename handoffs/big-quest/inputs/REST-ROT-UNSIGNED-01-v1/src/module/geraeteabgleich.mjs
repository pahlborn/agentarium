// Module geraeteabgleich - one device syncs the app's events with the storage (S12 task 3b-2b, M3; concept 9.1, 11).
// Test build only (module.json: bau "test", after lesen). No screen, no timer, no clock: the app (later a button or
// every 30 s) or a test calls geraetAbgleichen; device storage, storage access, keys, time are passed in.
//
//   The app writes its events unsigned into its own logs: bq2_<child>__events (bq2_events without accounts) and
//   bq2_personEvents. For every area this device takes part in, geraetAbgleichen
//     1. fetches it (zulassung.bereichHolen: keys, admission built from the area's own events, anchored at the founding
//        parent) - with the key of a person on this device, if one has a key entry there
//     2. hands out the keys if a distributor is on this device (a parent who belongs to a child's area; the person
//        itself for person:<id>): holders = bereiche.halter with the grants found in the child's log; the events of
//        schluesselVerteilen (member_added, member_removed, key_rotated) are signed by him and queued
//     3. registers this device (device_added) for every person here who belongs to the area and holds its current key
//     4. signs the app's own new events of this area (written on this device; the author's keys are here) and queues them
//     5. sends them (abgleich.senden) with the current key
//     6. writes what other devices wrote - accepted by module annahme - into the app's log (never admission events);
//        the app reads it after evNeuLaden()
//   In the area of a grant (freigabe:<id>) the distributor also writes a copy of the grant (grant_set without the consent
//   text; grant_revoked once it was ended - sent BEFORE the key changes, with the key the recipient still holds), so the
//   recipient's app knows its grant, finds the child and learns that it ended (task "Lehrkraft sieht ihre Schueler").
//   Task "Neuer Schluessel" (US9.7): a person here who just renewed his key comes with alt = { keys, pub } (module konto).
//   In every area where the admission still has his old keys, this device first announces the new ones - member_added
//   about himself, signed with the OLD keys - and sends it at once (with the key version he holds); only then the keys
//   change (bereiche: new version for the holders, his entry wrapped for the new keys). The report says which areas are
//   still open (erneuerungOffen) - the app keeps alt until none is. His own area person:<id> is anchored at his first keys
//   (ursprung), so it keeps its history across renewals.
//   Device storage (plain JSON, technical, never synced): bq_abgleich = { <area>: device state of module abgleich },
//   bq_abgleichVerworfen = everything dropped, with reason (module abgleich reports it once, so it is kept here).
//   A storage error (err.code, e.g. "offline") ends only that area; its state stays as it was, nothing is lost.
//   Task "Export und Loeschen" (EP12): an area this device knew in the storage that has no key entry any more was deleted
//   -> fehler "geloescht", nothing is made anew or sent. A person the family took out (family_set removed, accepted in
//   familie:*) gets no key any more: the distributor changes the key without him.
//
// Names: every helper starts with "gab"/"GAB_" because all modules and index.html share one scope in the app.

import { newEvent, mergeLog, lastWins } from './ereignisse.mjs';
import { signEvent, acceptEvent } from './annahme.mjs';
import { BEREICH_AUCH, bereichName, bereichVonEreignis, passtZumBereich, halter, schluesselLesen, schluesselVerteilen } from './bereiche.mjs';
import { abgleichStand, vormerken, senden, buendelErneuern } from './abgleich.mjs';
import { zulassungAus, aktiveMitglieder, bereichHolen } from './zulassung.mjs';

/* keys in the device storage */
export const GERAETEABGLEICH_SPEICHER = Object.freeze({ staende: 'bq_abgleich', verworfen: 'bq_abgleichVerworfen', geraet: 'bq2_evDevice', personen: 'bq2_personEvents', familien: 'bq2_familyEvents', entfernen: 'bq_geraetEntfernen' });
/* at most this many dropped entries are kept on the device (the newest) */
export const GERAETEABGLEICH_VERWORFEN_MAX = 1000;

const GAB_KIND_ARTEN = ['kind:lern', 'kind:privat', 'schule', 'eltern:allg'];
const GAB_ROLLEN = ['parent', 'child', 'teacher', 'admin'];        // who reads first on a shared device
const gabObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const gabPid = (x) => typeof x === 'string' && /^p_[0-9A-Za-z]{1,40}$/.test(x);
const gabTag = (x) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);
const gabCmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
function gabFehler(text) { return new Error('geraeteabgleich: ' + text); }
function gabJson(ablage, k, d) {
  const v = ablage.getItem(k);
  if (v === null || v === undefined) return d;
  try { return JSON.parse(v); } catch (e) { return d; }
}
const gabListe = (x) => (Array.isArray(x) ? x : []);
const gabPub = (p) => gabObj(p) && typeof p.ecdh === 'string' && typeof p.ecdsa === 'string';
const gabGleichePub = (a, b) => gabPub(a) && gabPub(b) && a.ecdh === b.ecdh && a.ecdsa === b.ecdsa;
/* must this device be registered for this member now? -> null or { ab: earliest time } - when it never was, or when its
   registration ended with an earlier membership (after being added again a device registers anew). Not when it was
   removed during the current membership (device_removed): a removed device does not register itself again. The time is
   after the start of the membership, so the order is right whatever the clocks of the two devices say. */
function gabAnmelden(zul, pid, geraet) {
  const m = zul.members[pid], p = m && m.perioden[m.perioden.length - 1];
  if (!p || p.bis !== null) return null;
  const l = (m.geraete || {})[geraet], letzte = Array.isArray(l) && l.length ? l[l.length - 1] : null;
  if (letzte && (letzte.bis === null || p.von === null || letzte.bis > p.von)) return null;
  return { ab: p.von === null ? 0 : p.von + 1 };
}

function gabPruefen({ ablage, zugang, personen, kinder, familien, verzeichnis, now, heute }) {
  if (!gabObj(ablage) || typeof ablage.getItem !== 'function' || typeof ablage.setItem !== 'function') throw gabFehler('ablage (getItem/setItem) fehlt.');
  if (!gabObj(zugang) || typeof zugang.list !== 'function') throw gabFehler('zugang fehlt.');
  if (!gabObj(personen) || !Object.keys(personen).length) throw gabFehler('personen fehlen.');
  for (const [pid, p] of Object.entries(personen)) {
    if (!gabPid(pid) || !gabObj(p) || !GAB_ROLLEN.includes(p.role) || !gabObj(p.keys) || !gabPub(p.pub)) throw gabFehler('Person ' + pid + ' braucht role, keys und pub.');
    if ((p.ursprung !== undefined && !gabPub(p.ursprung)) || (p.alt !== undefined && !(gabObj(p.alt) && gabObj(p.alt.keys) && gabPub(p.alt.pub))) || (p.stand !== undefined && !(Number.isInteger(p.stand) && p.stand >= 1))) throw gabFehler('Person ' + pid + ': ursprung, alt oder stand ungueltig.');
  }
  if (!Array.isArray(kinder) || kinder.some((c) => !gabObj(c) || !gabPid(c.id) || typeof c.pre !== 'string' || !c.pre.startsWith('bq2_') || !gabObj(c.anker))) throw gabFehler('kinder: [{ id, pre, anker }] erwartet.');
  if (kinder.some((c) => c.freigaben !== undefined && (!Array.isArray(c.freigaben) || c.freigaben.some((g) => typeof g !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(g))))) throw gabFehler('kinder[].freigaben: Liste von Freigabe-Kennungen erwartet.');
  if (!Array.isArray(familien) || familien.some((f) => !gabObj(f) || !gabPid(f.id) || !gabObj(f.anker))) throw gabFehler('familien: [{ id, anker }] erwartet.');
  if (!gabObj(verzeichnis)) throw gabFehler('verzeichnis erwartet.');
  if (!Number.isFinite(now)) throw gabFehler('"now" fehlt.');
  if (!gabTag(heute)) throw gabFehler('"heute" (JJJJ-MM-TT) fehlt.');
}

/* the grants of a child, as module bereiche expects them, from the child's log in the app */
function gabFreigaben(log) {
  const g = new Map();
  for (const e of log) {
    if (!gabObj(e) || !gabObj(e.payload)) continue;
    if (e.type === 'grant_set') g.set(e.payload.grant, { grant: e.payload.grant, grantee: e.payload.grantee, scope: e.payload.scope, from: e.payload.from, until: e.payload.until, widerrufen: g.has(e.payload.grant) && g.get(e.payload.grant).widerrufen === true });
    else if (e.type === 'grant_revoked' && g.has(e.payload.grant)) g.get(e.payload.grant).widerrufen = true;
  }
  return [...g.values()];
}

/* task "Export und Loeschen": persons the family took out (newest family_set about them, accepted in an area familie:*
   this device holds, says removed) -> Set of person ids. Only accepted entries count (a parent wrote them). */
function gabAusgetreten(staende, now) {
  const ereignisse = [];
  for (const [area, st] of Object.entries(gabObj(staende) ? staende : {})) {
    if (!area.startsWith('familie:') || !gabObj(st) || !Array.isArray(st.log)) continue;
    for (const x of st.log) if (gabObj(x) && gabObj(x.event) && x.event.type === 'family_set' && gabObj(x.event.payload)) ereignisse.push(x.event);
  }
  return new Set(Object.values(lastWins(ereignisse, now)).filter((e) => e.payload.removed === true).map((e) => e.payload.person));
}

/* the app's log of a target: { lesen, schreiben } */
function gabZiel(ablage, ziel) {
  if (ziel.pre) {
    const k = ziel.pre + 'events';
    return { lesen: () => gabListe(gabJson(ablage, k, [])), schreiben: (l) => ablage.setItem(k, JSON.stringify(l)) };
  }
  // a person's own log or (task "Einladungen") the log of a family, both one JSON object with a list per id
  const [K, id] = ziel.familie ? [GERAETEABGLEICH_SPEICHER.familien, ziel.familie] : [GERAETEABGLEICH_SPEICHER.personen, ziel.person];
  return {
    lesen: () => gabListe(gabJson(ablage, K, {})[id]),
    schreiben: (l) => { const alle = gabJson(ablage, K, {}); alle[id] = l; ablage.setItem(K, JSON.stringify(alle)); },
  };
}

/* one area; changes "stand" (the caller stores it) and returns the report of this area */
async function gabBereich(o, area, ziel, anker, stand) {
  const { zugang, personen, geraet, now, heute, verzeichnis } = o;
  const bericht = { ok: true, fehler: null, aktion: null, gesendet: 0, neu: 0, verworfen: [], ohneSchluessel: 0, inDieApp: 0 };
  let t = now;                                                          // own new events: one millisecond apart, in order
  const zeit = (ab) => { t = Math.max(t, ab || 0); return new Date(t++).toISOString(); };
  // task "Neuer Schluessel": while the admission of this area still has a person's old keys (offen), he signs with them
  let zul = null;
  const offen = (pid) => { const p = personen[pid], m = p.alt && zul ? aktiveMitglieder(zul)[pid] : null; return !!(m && gabGleichePub(m.pub, p.alt.pub)); };
  const signier = (pid) => (offen(pid) ? personen[pid].alt.keys : personen[pid].keys);
  const schl = (pid) => { const p = personen[pid]; if (!p.alt) return { meineSchluessel: p.keys }; return offen(pid) ? { meineSchluessel: p.alt.keys, alteSchluessel: [p.keys] } : { meineSchluessel: p.keys, alteSchluessel: [p.alt.keys] }; };
  const neuBilden = async () => { zul = await zulassungAus(stand.log, { area, anker, now }); };
  const eintragen = async (pid, type, payload, ab) => vormerken(stand, await signEvent(newEvent({ type, author: pid, device: geraet, at: zeit(ab), payload }), area, signier(pid)), { now });
  const anmelden = async (pid) => { const a = gabAnmelden(zul, pid, geraet); if (a) await eintragen(pid, 'device_added', { device: geraet, ...(o.geraetName ? { label: o.geraetName } : {}) }, a.ab); return !!a; };
  const reihe = Object.keys(personen).sort((a, b) => (GAB_ROLLEN.indexOf(personen[a].role) - GAB_ROLLEN.indexOf(personen[b].role)) || gabCmp(a, b));
  try {
    // 1. fetch with the key of a person here
    const eintraege = await zugang.keys(area);
    // task "Export und Loeschen": an area this device knew in the storage (it sent a bundle or read one) has no key
    // entry at all any more - it was deleted (a child, an account). Never make it anew, never send into it.
    const kannte = stand.naechsteNr > 1 || (gabObj(stand.merker) && gabObj(stand.merker.stand) && Object.values(stand.merker.stand).some((n) => n > 0));
    if (kannte && gabObj(eintraege) && !Object.keys(eintraege).length) {
      bericht.ok = false; bericht.fehler = 'geloescht';
      return bericht;
    }
    const leser = reihe.find((pid) => gabObj(eintraege) && Object.prototype.hasOwnProperty.call(eintraege, pid));
    if (leser) {
      const h = await bereichHolen(stand, { zugang, ich: leser, ...schl(leser), anker, now });
      bericht.neu = h.neu;
      bericht.verworfen = h.verworfen.map((v) => ({ bereich: area, ...v }));
    }
    await neuBilden();
    const art = area.split(':').slice(0, -1).join(':');
    // task "Abgleich in der App": the own area of a person here has his key entry, but his keys open none of its versions
    // - his key was renewed on another device (the entry is now wrapped for the new keys). The app asks him to log in
    // again (a child: silent, its parents see it).
    const eigenePid = art === 'person' ? area.slice('person:'.length) : null;
    if (eigenePid && personen[eigenePid] && gabObj(eintraege) && Object.prototype.hasOwnProperty.call(eintraege, eigenePid)) {
      const s = await schluesselLesen(zugang, area, { ich: eigenePid, ...schl(eigenePid), mitglieder: aktiveMitglieder(zul) });
      if (!s.lesbar.size) bericht.veraltet = eigenePid;
    }
    // 1b. task "Neuer Schluessel": announce the new keys of a person here with his old ones and send that at once - before
    //     any key changes, so every device that meets the new version can also learn whose keys sign it
    for (const pid of reihe) {
      const p = personen[pid];
      if (!p.alt) continue;
      const ausstehend = stand.ausgang.some((x) => x.event.type === 'member_added' && x.event.author === pid && x.event.payload.person === pid);
      if (!offen(pid) && !ausstehend) continue;
      const s = await schluesselLesen(zugang, area, { ich: pid, ...schl(pid), mitglieder: aktiveMitglieder(zul) });
      if (!s.aktuell || !s.keys.has(s.aktuell)) continue;             // no key of this area here: nothing to announce it with
      if (offen(pid)) {
        if (await anmelden(pid)) await neuBilden();
        await eintragen(pid, 'member_added', { person: pid, role: p.role, pub: { ...p.pub }, ...(p.stand > 1 ? { stand: p.stand } : {}) });
        await neuBilden();
        bericht.erneuert = true;
      }
      bericht.gesendet += (await senden(stand, { zugang, schluessel: { aktuell: s.aktuell, keys: s.keys } })).gesendet;
    }
    // 2. hand out the keys
    const verteiler = reihe.find((pid) => (art === 'person' ? area === 'person:' + pid : personen[pid].role === 'parent' && Object.prototype.hasOwnProperty.call(aktiveMitglieder(zul), pid)));
    if (verteiler) {
      // his device first: what he writes counts only from a registered device (also for the anchor)
      if (await anmelden(verteiler)) await neuBilden();
      const mitglieder = {}, gabStand = (m) => (Number.isInteger(m.stand) && m.stand > 1 ? m.stand : 1);
      for (const [pid, m] of Object.entries(verzeichnis)) if (gabObj(m) && GAB_ROLLEN.includes(m.role) && gabPub(m.pub)) mitglieder[pid] = { role: m.role, pub: m.pub, ...(gabStand(m) > 1 ? { stand: gabStand(m) } : {}) };
      for (const [pid, p] of Object.entries(personen)) mitglieder[pid] = { role: p.role, pub: p.pub };
      // the area's own admission counts - except for keys from a newer directory entry (task "Einladungen": a child's new
      // keys after "new password", known from the family; an older device keeps the newer keys, see zulassung "stand").
      // Task "Neuer Schluessel": the keys the admission knows stay as "frueher" - the key entries signed with them count.
      for (const [pid, m] of Object.entries(aktiveMitglieder(zul))) {
        if (mitglieder[pid] && gabStand(mitglieder[pid]) > gabStand(m)) mitglieder[pid] = { ...mitglieder[pid], frueher: [m.pub, ...(m.frueher || [])] };
        else mitglieder[pid] = m;
      }
      const freigaben = ziel.pre ? gabFreigaben(gabZiel(o.ablage, ziel).lesen()) : [];
      // the area of a grant carries the grant itself, for its recipient (task "Lehrkraft sieht ihre Schueler"): a copy
      // by the distributor, without the consent text - the app's own grant_set was written before this area existed
      // (and maybe by the other parent), so it could never count here. The end goes out BEFORE the key changes, with the
      // key the recipient still holds, so his app learns it; an expired grant needs no entry (it follows from "until").
      const g = art === 'freigabe' ? freigaben.find((x) => x.grant === area.slice('freigabe:'.length)) : null;
      const kopien = async () => {
        const da = (type) => stand.log.some((x) => x.event.type === type && x.event.payload.grant === g.grant);
        if (!da('grant_set')) await eintragen(verteiler, 'grant_set', { grant: g.grant, grantee: g.grantee, scope: g.scope.slice(), from: g.from, until: g.until });
        if (g.widerrufen && !da('grant_revoked')) await eintragen(verteiler, 'grant_revoked', { grant: g.grant, grantee: g.grantee });
      };
      if (g && g.widerrufen) {
        const s = await schluesselLesen(zugang, area, { ich: verteiler, ...schl(verteiler), mitglieder: aktiveMitglieder(zul) });
        if (s.aktuell && s.keys.has(s.aktuell)) {
          await kopien();
          bericht.gesendet += (await senden(stand, { zugang, schluessel: { aktuell: s.aktuell, keys: s.keys } })).gesendet;
        }
      }
      // task "Meine Geraete": devices to remove (module geraete notes them on this device) that are still registered here
      // for a member - device_removed, then a new key version that names them
      const weg = [];
      for (const x of o.entfernen) {
        const m = zul.members[x.person], l = m && gabObj(m.geraete) ? m.geraete[x.geraet] : null;
        if (!Object.prototype.hasOwnProperty.call(aktiveMitglieder(zul), x.person) || !Array.isArray(l) || !l.length || l[l.length - 1].bis !== null || weg.includes(x.geraet)) continue;
        await eintragen(verteiler, 'device_removed', { device: x.geraet });
        weg.push(x.geraet);
      }
      if (weg.length) { await neuBilden(); bericht.entfernt = weg.slice(); }
      // task "Export und Loeschen": whoever left the family (family_set removed: a deleted child, a parent who deleted his
      // account) holds no key any more - the key changes without him (member_removed). Not the distributor himself: his
      // device still sends what it has (the removal itself); the other parent takes him out.
      const aus = gabAusgetreten(o.staende, now);
      const soll = halter(area, mitglieder, freigaben, heute).filter((h) => art === 'person' || h.id === verteiler || !aus.has(h.id));
      const r = await schluesselVerteilen(zugang, area, { soll, ich: verteiler, ...schl(verteiler), mitglieder, geraete: weg });
      bericht.aktion = r.aktion;
      // (a member_added the admission already has - a renewed person announced his new keys himself in step 1b - is not
      // written a second time)
      const schonDa = (e) => { const m = e.type === 'member_added' ? aktiveMitglieder(zul)[e.payload.person] : null; return !!(m && m.role === e.payload.role && gabGleichePub(m.pub, e.payload.pub) && (m.stand || 1) === (e.payload.stand || 1)); };
      for (const e of r.ereignisse) if (!schonDa(e)) await eintragen(verteiler, e.type, e.payload);
      if (r.ereignisse.length) await neuBilden();
      if (g) await kopien();
    }
    // 3. register this device for everybody here who belongs and holds the current key
    const aktiv = aktiveMitglieder(zul);
    let schreiber = null;
    for (const pid of reihe) {
      if (!Object.prototype.hasOwnProperty.call(aktiv, pid)) continue;
      const s = await schluesselLesen(zugang, area, { ich: pid, ...schl(pid), mitglieder: aktiv });
      if (!s.aktuell || !s.keys.has(s.aktuell)) continue;
      if (!schreiber) schreiber = { aktuell: s.aktuell, keys: s.keys };
      await anmelden(pid);
    }
    // 4. the app's own new events of this area
    const bekannt = new Set([...stand.log, ...stand.ausgang].map((x) => x.event.id));
    for (const e of gabZiel(o.ablage, ziel).lesen()) {
      // (admission events and snapshots fit every area - they are this module's and module bereiche's, never the app's;
      // the grant itself goes into the area of the grant only as the distributor's copy, see step 2)
      if (!gabObj(e) || e.device !== geraet || bekannt.has(e.id) || bereichVonEreignis(e) === '*' || !passtZumBereich(e, area)) continue;
      if (art === 'freigabe' && BEREICH_AUCH[e.type] === 'freigabe') continue;
      if (!Object.prototype.hasOwnProperty.call(personen, e.author)) { bericht.ohneSchluessel++; continue; }
      vormerken(stand, await signEvent(e, area, signier(e.author)), { now });
    }
    // 4b. a prepared, unconfirmed bundle sealed with an area key version that a key renewal of its entries' author has
    //     replaced since (the upload was interrupted, the author renewed his keys on another device, he is logged in
    //     here again): readers would drop it (module abgleich, holen: old key version beyond the stand of the change).
    //     Only the transport is made anew (module abgleich, buendelErneuern) - the entries stay byte for byte as they
    //     are. Only for an entry of an author whose keys are on this device NOW and whom the admission shows with exactly
    //     these keys, from a device registered for him now (no device_removed), that is no admission event and fits this
    //     area (child binding), and that the admission built here accepts (old signature valid in the period of its own
    //     time). Nobody else's entry, no removed author or device, nothing confirmed; no check of the readers is loosened.
    if (schreiber && stand.unterwegs) {
      const erlaubt = async (x) => {
        const e = x.event, p = personen[e.author], m = zul.members[e.author];
        if (!p || e.device !== geraet || bereichVonEreignis(e) === '*' || !passtZumBereich(e, area) || offen(e.author)) return false;
        const pe = m && m.perioden[m.perioden.length - 1], gl = m && gabObj(m.geraete) && Array.isArray(m.geraete[geraet]) ? m.geraete[geraet] : null;
        if (!pe || pe.bis !== null || !gabGleichePub(pe.pub, p.pub) || !gl || !gl.length || gl[gl.length - 1].bis !== null) return false;
        return (await acceptEvent(x, zul)).ok === true;
      };
      await buendelErneuern(stand, { schluessel: schreiber, erlaubt });
    }
    // 5. send
    if (stand.ausgang.length || stand.unterwegs) {
      if (schreiber) bericht.gesendet += (await senden(stand, { zugang, schluessel: schreiber })).gesendet;
      else { bericht.ok = false; bericht.fehler = 'kein-schluessel'; }
    }
    // 6. into the app: what others wrote and annahme accepted (no admission events - they are the area's, not the app's).
    //    Task "Abgleich in der App": inDieApp false (a child in the middle of a round) - nothing goes into the app now;
    //    it stays in the area's log and comes with the next sync (this step compares the whole log with the app's).
    const app = gabZiel(o.ablage, ziel);
    const da = new Set(app.lesen().map((e) => gabObj(e) && e.id));
    // A school replay can also restore a missing evaluation originally sent by this device.
    const neu = stand.log.map((x) => x.event).filter((e) =>
      (e.device !== geraet || e.type === 'school_evaluation') && !da.has(e.id) && bereichVonEreignis(e) !== '*');
    if (neu.length && o.inDieApp) {
      app.schreiben(mergeLog([app.lesen(), neu], now).events);
      bericht.inDieApp = neu.length;
    } else if (neu.length) bericht.zurueckgehalten = neu.length;
  } catch (err) {
    if (!err || typeof err.code !== 'string') throw err;
    bericht.ok = false; bericht.fehler = err.code;
    if (err.code === 'limit') bericht.wartezeit = Number.isFinite(err.wartezeit) && err.wartezeit >= 0 ? err.wartezeit : 60000;
  }
  // task "Neuer Schluessel": the admission of this area still has the old keys of a person here (or the area could not be
  // read) - the app must keep alt
  const angekuendigt = (pid) => !stand.ausgang.some((x) => x.event.type === 'member_added' && x.event.author === pid && x.event.payload.person === pid);
  if (Object.keys(personen).some((pid) => personen[pid].alt && (offen(pid) || !angekuendigt(pid) || (!bericht.ok && zul === null)))) bericht.erneuerungOffen = true;
  return bericht;
}

/* syncs every area this device takes part in.
   ablage:      { getItem, setItem } - the device's storage (in the app: the browser storage); the device id is bq2_evDevice
   zugang:      storage access of this device (module speicher: store.geraet(<device id>))
   personen:    { <personId>: { role, keys, pub } } - the persons whose keys are on this device (unlocked at login, EP9)
   kinder:      [{ id, pre, anker, freigaben? }] - children whose data this device holds: person id, prefix of the app's
                storage (bq2_<id>__; without accounts bq2_) and anker = the founding parent { person, role, pub };
                freigaben = ids of grants for this child this device was invited to (a teacher's or the admin's device;
                EP9: the invitation). A teacher's device finds its grant there (freigabe:<id>: grant_set, grant_revoked)
                and with it the child; parents' devices find the grants in the child's log.
   familien:    [{ id, anker }] - families this device takes part in (task "Einladungen"): id = the founding parent, anker
                = { person, role, pub } of him; their area familie:<id> is synced first, into the app's log bq2_familyEvents
   verzeichnis: { <personId>: { role, pub, stand? } } - public keys a parent knows (family, grant recipients; task
                "Einladungen": module einladung builds it from the family); stand above the admission's -> these keys count
   now (ms), heute ("YYYY-MM-DD", for the grants)
   personen[id] may carry (task "Neuer Schluessel", module konto kontoPersonen): ursprung (anchor of the own area), stand
                (directory entry of the keys), alt = { keys, pub } right after renewing
   geraetName:  name of this device (task "Meine Geraete"; label of device_added, shown in the list - optional)
   Devices to remove (task "Meine Geraete", device storage bq_geraetEntfernen, noted by module geraete): in every area
   where such a device is registered for a member, the distributor writes device_removed and changes the key
   (key_rotated.geraete) - report: bereiche[area].entfernt
   inDieApp:    false = write nothing into the app's logs this time (task "Abgleich in der App": a child in the middle of a
                round - fetching and sending go on; what came stays in the areas' logs and goes into the app with the next
                sync). Default true.
   -> { bereiche: { <area>: { ok, fehler, aktion, gesendet, neu, verworfen, ohneSchluessel, inDieApp, erneuert?, erneuerungOffen?, wartezeit?, zurueckgehalten? } },
        inDieApp: events written into the app's logs (the app then calls evNeuLaden), verworfen: [{ bereich, kennung, id, grund, typ? }],
        erneuerungOffen: areas that do not have the new key of a person with alt yet,
        limit?: wait time in ms (task "Abgleich in der App": the storage's hourly limit is reached - the remaining areas
                were left out, fehler "limit"; ask again only after this time), zurueckgehalten?: events held back (inDieApp false),
        veraltet?: [personId] - persons here whose keys no longer open their own area (renewed on another device) } */
export async function geraetAbgleichen({ ablage, zugang, personen, kinder = [], familien = [], verzeichnis = {}, now, heute, geraetName, inDieApp = true } = {}) {
  gabPruefen({ ablage, zugang, personen, kinder, familien, verzeichnis, now, heute });
  const geraet = gabJson(ablage, GERAETEABGLEICH_SPEICHER.geraet, null);
  if (typeof geraet !== 'string' || !/^d_[0-9A-Za-z]{1,40}$/.test(geraet)) throw gabFehler('Geraet ohne Kennung (bq2_evDevice).');
  if (geraetName !== undefined && geraetName !== null && typeof geraetName !== 'string') throw gabFehler('geraetName: Text erwartet.');
  if (typeof inDieApp !== 'boolean') throw gabFehler('inDieApp: true oder false erwartet.');
  const name = typeof geraetName === 'string' ? geraetName.trim().slice(0, 40) : '';
  // task "Meine Geraete": devices to remove, noted by module geraete ([{ person, geraet, am }])
  const entfernen = gabListe(gabJson(ablage, GERAETEABGLEICH_SPEICHER.entfernen, [])).filter((x) => gabObj(x) && gabPid(x.person) && typeof x.geraet === 'string' && /^d_[0-9A-Za-z]{1,40}$/.test(x.geraet) && x.geraet !== geraet);
  const staende = gabJson(ablage, GERAETEABGLEICH_SPEICHER.staende, {});
  // task "Abgleich in der App": a storage that offers a sitzung (module github) asks the same thing only once per sync
  const z = typeof zugang.sitzung === 'function' ? zugang.sitzung() : zugang;
  const o = { ablage, zugang: z, personen, geraet, now, heute, verzeichnis, geraetName: name, entfernen, inDieApp, staende };
  const plan = [];                                                      // [area, target, anchor]
  for (const f of familien) plan.push([bereichName('familie', f.id), { familie: f.id }, f.anker]);
  for (const c of kinder) {
    for (const art of GAB_KIND_ARTEN) plan.push([bereichName(art, c.id), { pre: c.pre }, c.anker]);
    // the grants of this child: those in its log (parents) and those this device was invited to (teacher, admin) - the
    // area of a grant is checked against THIS child's founding parent, so a grant of another family never counts here
    const grants = new Set(gabListe(gabZiel(ablage, { pre: c.pre }).lesen()).filter((e) => gabObj(e) && gabObj(e.payload) && /^grant_/.test(e.type)).map((e) => e.payload.grant));
    for (const g of c.freigaben || []) grants.add(g);
    for (const g of [...grants].sort(gabCmp)) plan.push([bereichName('freigabe', g), { pre: c.pre }, c.anker]);
  }
  // the own area is anchored at the person's first keys (task "Neuer Schluessel": later ones are announced in it)
  for (const pid of Object.keys(personen).sort(gabCmp)) plan.push([bereichName('person', pid), { person: pid }, { person: pid, role: personen[pid].role, pub: personen[pid].ursprung || personen[pid].pub }]);

  const out = { bereiche: {}, inDieApp: 0, verworfen: [], erneuerungOffen: [] };
  for (const [area, ziel, anker] of plan) {
    if (out.bereiche[area]) continue;
    // task "Abgleich in der App": the hourly limit is reached - wait instead of asking again (the other areas come with
    // the next sync, after the wait time)
    if (out.limit !== undefined) {
      out.bereiche[area] = { ok: false, fehler: 'limit', aktion: null, gesendet: 0, neu: 0, verworfen: [], ohneSchluessel: 0, inDieApp: 0, ausgelassen: true };
      if (Object.values(personen).some((p) => p.alt)) out.erneuerungOffen.push(area);
      continue;
    }
    // the state is kept also after a storage error: holen changes it in one step only, and what was queued (own
    // events, signed) stays queued for the next time - that is how offline works
    const stand = gabObj(staende[area]) ? staende[area] : abgleichStand(area, geraet);
    const b = await gabBereich(o, area, ziel, anker, stand);
    staende[area] = stand;
    ablage.setItem(GERAETEABGLEICH_SPEICHER.staende, JSON.stringify(staende));
    out.bereiche[area] = b;
    out.inDieApp += b.inDieApp;
    out.verworfen.push(...b.verworfen);
    if (b.erneuerungOffen) out.erneuerungOffen.push(area);
    if (b.fehler === 'limit') out.limit = b.wartezeit;
    if (b.zurueckgehalten) out.zurueckgehalten = (out.zurueckgehalten || 0) + b.zurueckgehalten;
    if (b.veraltet) (out.veraltet || (out.veraltet = [])).push(b.veraltet);
  }
  if (out.verworfen.length) {
    const alt = gabListe(gabJson(ablage, GERAETEABGLEICH_SPEICHER.verworfen, []));
    ablage.setItem(GERAETEABGLEICH_SPEICHER.verworfen, JSON.stringify(alt.concat(out.verworfen.map((v) => ({ ...v, am: new Date(now).toISOString() }))).slice(-GERAETEABGLEICH_VERWORFEN_MAX)));
  }
  return out;
}
