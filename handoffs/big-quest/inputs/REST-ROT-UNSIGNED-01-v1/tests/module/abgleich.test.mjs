// Modul abgleich ohne Browser (S12 P3a-2, US8.1 zweiter Teil; Erfolgskriterien E1, E4, E10 in der Simulation).
// Geprueft gegen lokalerSpeicher (Modul speicher) mit mehreren simulierten Geraeten.
//   node --test tests/module/abgleich.test.mjs

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ABGLEICH_BUENDEL_MAX, ABGLEICH_GRUENDE, abgleichStand, vormerken, senden, holen, abgleichen } from '../../src/module/abgleich.mjs';
import { lokalerSpeicher } from '../../src/module/speicher.mjs';
import { newPersonKeys, publicKeysOf, newAreaKey, sealEntry, entryAad, bytesToB64, b64ToBytes, createKeyring, rotateKeyring, addKeyHolder, keysForHolder } from '../../src/module/krypto.mjs';
import { newEvent } from '../../src/module/ereignisse.mjs';
import { signEvent } from '../../src/module/annahme.mjs';
import { derive } from '../../src/module/ableitung.mjs';

/* ---------- die Familie: Kind (iPad d_k1, d_k2), ein Elternteil (iPhone d_e1, Laptop d_e2, neues Geraet d_e3), Lehrkraft ---------- */
const AREA = 'kind:lern:p_k1', AREA2 = 'kind:lern:p_k2';      // since P3b: learning area (module bereiche)
const PERSONEN = { p_k1: ['child', ['d_k1', 'd_k2']], p_e1: ['parent', ['d_e1', 'd_e2', 'd_e3']], p_l1: ['teacher', ['d_l1']] };
const PERSON_VON = { d_k1: 'p_k1', d_k2: 'p_k1', d_e1: 'p_e1', d_e2: 'p_e1', d_e3: 'p_e1', d_l1: 'p_l1' };
const KEYS = {}, PUB = {};
let Z, K1, SCH, stranger;
before(async () => {
  const members = {};
  for (const [pid, [role, devices]] of Object.entries(PERSONEN)) {
    KEYS[pid] = await newPersonKeys();
    PUB[pid] = await publicKeysOf(KEYS[pid]);
    members[pid] = { role, pub: PUB[pid], devices };
  }
  Z = { area: AREA, members };
  stranger = await newPersonKeys();
  K1 = await newAreaKey();
  SCH = { aktuell: 1, keys: new Map([[1, K1]]) };
});

/* ---------- Ereignisse ---------- */
const TAG = '2026-11-02', T0 = Date.UTC(2026, 10, 2, 8, 0, 0), JETZT = Date.UTC(2026, 10, 3, 12, 0, 0);
let uhr = 0, qn = 0;
const at = () => new Date(T0 + (uhr += 1007)).toISOString();          // mit Millisekunden, jedes Ereignis spaeter
function nutzlast(type) {
  qn++;
  return {
    answer: { day: TAG, skill: 'round', level: 2, attempt: 1, ok: qn % 2 === 0, qid: 'q' + qn },
    round_done: { day: TAG, skill: 'round', stars: 5, count: 8 },
    profile_set: { field: 'name', value: 'Kim ' + qn },             // parents' event in the learning area
    sheet_created: { sheet: TAG + '-s' + qn, day: TAG, no: qn, writing: 'en', items: [] },
  }[type];
}
async function ereignis(geraet, type, { author = PERSON_VON[geraet], keys = KEYS[author], area = AREA } = {}) {
  return signEvent(newEvent({ type, author, device: geraet, at: at(), payload: nutzlast(type) }), area, keys);
}
const opts = (zugang, extra = {}) => ({ zugang, schluessel: SCH, zulassung: Z, now: JETZT, ...extra });
const ids = (st) => st.log.map((x) => x.event.id);
const zustand = (st) => derive(st.log.map((x) => x.event), { now: JETZT });
const json = (x) => JSON.parse(JSON.stringify(x));

test('E1/E4: drei Geraete ueben zehn Runden abwechselnd offline/online -> gleiches Protokoll und gleicher Stand', async () => {
  const s = lokalerSpeicher();
  const geraete = [['d_k1', ['answer', 'round_done']], ['d_e1', ['profile_set', 'sheet_created']], ['d_e2', ['sheet_created', 'profile_set']]]
    .map(([id, typen]) => ({ id, typen, z: s.geraet(id), st: abgleichStand(AREA, id) }));
  const alle = new Set();
  let antworten = 0, warOffline = 0;
  for (let runde = 0; runde < 10; runde++) {
    for (const [i, g] of geraete.entries()) {
      const offline = (runde + i) % 3 === 0;
      if (offline) { g.z.offline(); warOffline++; } else g.z.online();
      for (let k = 0; k <= (runde + i) % 3; k++) {
        const typ = g.typen[(runde + k) % 2], x = await ereignis(g.id, typ);
        if (typ === 'answer') antworten++;
        vormerken(g.st, x, { now: JETZT });
        alle.add(x.event.id);
        assert.ok(ids(g.st).includes(x.event.id), 'sofort im eigenen Protokoll');
      }
      const r = await abgleichen(g.st, opts(g.z));
      assert.equal(r.ok, !offline);
      assert.equal(r.fehler, offline ? 'offline' : null);
      assert.deepEqual(r.verworfen, []);
    }
  }
  assert.ok(warOffline >= 9);
  for (const g of geraete) g.z.online();
  for (let n = 0; n < 2; n++) for (const g of geraete) assert.equal((await abgleichen(g.st, opts(g.z))).ok, true);
  const erwartet = ids(geraete[0].st);
  assert.equal(erwartet.length, alle.size, 'kein Ereignis verloren');
  assert.deepEqual(new Set(erwartet), alle);
  const z0 = zustand(geraete[0].st);
  assert.equal(z0.attempts.length, antworten, 'jede Antwort genau einmal');
  for (const g of geraete) {
    assert.deepEqual(ids(g.st), erwartet, g.id + ': gleiches Protokoll, gleiche Reihenfolge');
    assert.equal(new Set(ids(g.st)).size, ids(g.st).length, g.id + ': nichts doppelt');
    assert.deepEqual(zustand(g.st), z0, g.id + ': gleicher Stand');
    assert.deepEqual([g.st.ausgang.length, g.st.unterwegs, g.st.wartend], [0, null, []]);
  }
});

test('Offline: 250 Ereignisse -> offline, nichts verloren; online -> Buendel 100/100/50, auf den anderen Geraeten genau einmal', async () => {
  const s = lokalerSpeicher();
  const a = s.geraet('d_e1'), b = s.geraet('d_k1'), c = s.geraet('d_e2');
  const sa = abgleichStand(AREA, 'd_e1');
  a.offline();
  for (let i = 0; i < 250; i++) vormerken(sa, await ereignis('d_e1', 'profile_set'), { now: JETZT });
  const r1 = await abgleichen(sa, opts(a));
  assert.deepEqual([r1.ok, r1.fehler, r1.gesendet], [false, 'offline', 0]);
  assert.deepEqual([sa.ausgang.length, sa.log.length, sa.naechsteNr], [250, 250, 1]);
  assert.deepEqual((await b.list(AREA)).kennungen, []);
  a.online();
  const r2 = await abgleichen(sa, opts(a));
  assert.deepEqual([r2.ok, r2.gesendet, sa.ausgang.length, sa.unterwegs, sa.naechsteNr], [true, 250, 0, null, 4]);
  const liste = (await b.list(AREA)).kennungen;
  assert.deepEqual(liste, ['d_e1/1', 'd_e1/2', 'd_e1/3']);
  const groessen = [];
  for (const k of liste) groessen.push((await b.get(AREA, k)).eintraege.length);
  assert.deepEqual(groessen, [100, 100, 50]);
  assert.equal(ABGLEICH_BUENDEL_MAX, 100);
  for (const [z, id] of [[b, 'd_k1'], [c, 'd_e2']]) {
    const st = abgleichStand(AREA, id);
    const h = await holen(st, opts(z));
    assert.deepEqual([h.neu, h.verworfen, h.wartend], [250, [], []]);
    assert.deepEqual(ids(st), ids(sa));
    assert.equal((await holen(st, opts(z))).neu, 0);
  }
});

test('Verlorene Antwort: put kam an, Antwort ging verloren -> Wiederholung schickt dasselbe Buendel, kein zweites', async () => {
  const s = lokalerSpeicher(), echt = s.geraet('d_k1');
  let verlieren = true;
  const pruef = { ...echt, put: async (...a) => { const r = await echt.put(...a); if (verlieren) { verlieren = false; const e = new Error('speicher: offline'); e.code = 'offline'; throw e; } return r; } };
  const st = abgleichStand(AREA, 'd_k1');
  for (let i = 0; i < 3; i++) vormerken(st, await ereignis('d_k1', 'answer'), { now: JETZT });
  const r1 = await abgleichen(st, opts(pruef));
  assert.deepEqual([r1.ok, r1.fehler, st.ausgang.length, st.unterwegs.nr], [false, 'offline', 3, 1]);
  const r2 = await abgleichen(json(st), opts(pruef));        // auch nach Speichern/Laden des Geraetestands
  const r3 = await abgleichen(st, opts(pruef));
  assert.deepEqual([r2.ok, r2.gesendet, r3.ok, r3.gesendet], [true, 3, true, 3]);
  assert.deepEqual([st.ausgang.length, st.unterwegs, st.naechsteNr], [0, null, 2]);
  assert.deepEqual((await echt.list(AREA)).kennungen, ['d_k1/1'], 'kein zweites Buendel');
  const anderes = abgleichStand(AREA, 'd_e1');
  assert.equal((await holen(anderes, opts(s.geraet('d_e1')))).neu, 3);
});

test('Alte Sicherung: keine Ueberschreibung, weiter mit freier Nummer, Protokoll ohne Doppelte', async () => {
  const s = lokalerSpeicher(), a = s.geraet('d_e1'), b = s.geraet('d_k1');
  let st = abgleichStand(AREA, 'd_e1');
  const e = [];
  const neu = async () => { const x = await ereignis('d_e1', 'profile_set'); e.push(x.event.id); vormerken(st, x, { now: JETZT }); };
  await neu(); await neu();
  assert.equal((await abgleichen(st, opts(a))).ok, true);
  const sicherung = JSON.stringify(st);
  await neu();
  assert.equal((await abgleichen(st, opts(a))).ok, true);
  const b1 = await a.get(AREA, 'd_e1/1'), b2 = await a.get(AREA, 'd_e1/2');

  st = JSON.parse(sicherung);                                  // Geraetestand aus der alten Sicherung
  await neu();
  const r = await abgleichen(st, opts(a));
  assert.deepEqual([r.ok, r.gesendet, r.verworfen], [true, 1, []]);
  assert.deepEqual((await a.list(AREA)).kennungen, ['d_e1/1', 'd_e1/2', 'd_e1/3'], 'freie Nummer');
  assert.deepEqual([await a.get(AREA, 'd_e1/1'), await a.get(AREA, 'd_e1/2')], [b1, b2], 'nichts ueberschrieben');
  assert.deepEqual([...ids(st)].sort(), [...e].sort(), 'alle vier, keins doppelt');
  assert.deepEqual([st.naechsteNr, st.wartend], [4, []]);
  const sb = abgleichStand(AREA, 'd_k1');
  await holen(sb, opts(b));
  assert.deepEqual(ids(sb), ids(st));

  st = JSON.parse(sicherung);                                  // noch einmal zurueck, diesmal ohne Neues: holen allein bringt alles
  const h = await holen(st, opts(a));
  assert.deepEqual([h.neu, ids(st).length, st.naechsteNr], [2, 4, 4]);
  await neu();
  assert.equal((await abgleichen(st, opts(a))).gesendet, 1);
  assert.deepEqual((await a.list(AREA)).kennungen, ['d_e1/1', 'd_e1/2', 'd_e1/3', 'd_e1/4']);
  assert.equal((await holen(sb, opts(b))).neu, 1);
  assert.deepEqual(ids(sb), ids(st));
  assert.equal(ids(sb).length, 5);
});

test('Faelschungen neben gueltigen Eintraegen: jeweils der richtige Grund, die gueltigen kommen an (E10)', async () => {
  const s = lokalerSpeicher(), angreifer = s.geraet('d_x1');
  const versiegeln = async (item, { bereich = AREA, id = item.event.id } = {}) => ({ id, ...(await sealEntry(K1, JSON.stringify(item), entryAad(bereich, 1, id))) });
  const gut1 = await ereignis('d_k1', 'answer'), gut2 = await ereignis('d_e1', 'profile_set');
  const kaputt = await versiegeln(await ereignis('d_k1', 'answer'));
  const bytes = b64ToBytes(kaputt.ct); bytes[3] ^= 1; kaputt.ct = bytesToB64(bytes);                 // ein Byte veraendert
  const falscheSig = await ereignis('d_k1', 'answer', { keys: stranger });                             // Kind, aber fremde Unterschrift
  const lehrkraft = await ereignis('d_l1', 'answer');                                                  // Lehrkraft schreibt eine Antwort
  const fremdesGeraet = await ereignis('d_k9', 'answer', { author: 'p_k1' });                          // Geraet gehoert nicht zum Kind
  const fremderAutor = await ereignis('d_k1', 'answer', { author: 'p_x9', keys: stranger });          // nicht zugelassen
  const x = await ereignis('d_k1', 'answer'), y = await ereignis('d_k1', 'answer');
  const vertauscht = await versiegeln(x, { id: y.event.id });                                         // Eintrag-Kennung != Ereignis
  const kopiert = await versiegeln(await ereignis('d_k1', 'answer', { area: AREA2 }), { bereich: AREA2 });   // aus anderem Bereich
  const keinJson = { id: 'e_' + 'f'.repeat(24), ...(await sealEntry(K1, 'kein json', entryAad(AREA, 1, 'e_' + 'f'.repeat(24)))) };
  const eintraege = [await versiegeln(gut1), kaputt, await versiegeln(falscheSig), await versiegeln(lehrkraft), await versiegeln(gut2),
    await versiegeln(fremdesGeraet), vertauscht, kopiert, await versiegeln(fremderAutor), keinJson, { id: 'e_' + 'a'.repeat(24), iv: 7 }];
  await angreifer.put(AREA, 'd_x1', { nr: 1, inhalt: { v: 1, kv: 1, eintraege } });
  await angreifer.put(AREA, 'd_x1', { nr: 2, inhalt: 'kein Buendel' });
  const ganzKopiert = await versiegeln(await ereignis('d_k1', 'answer', { area: AREA2 }), { bereich: AREA2 });
  await angreifer.put(AREA, 'd_x1', { nr: 3, inhalt: { v: 1, kv: 1, eintraege: [ganzKopiert] } });   // ganzes Buendel aus anderem Bereich
  // ein Buendel, das das Modul selbst im Bereich AREA2 abgelegt hat (gleicher Schluessel), wird nach AREA kopiert
  const s2 = lokalerSpeicher(), st2 = abgleichStand(AREA2, 'd_k1'), ausAREA2 = await ereignis('d_k1', 'answer', { area: AREA2 });
  vormerken(st2, ausAREA2, { now: JETZT });
  await senden(st2, { zugang: s2.geraet('d_k1'), schluessel: SCH });
  await angreifer.put(AREA, 'd_x1', { nr: 4, inhalt: await s2.geraet('d_k1').get(AREA2, 'd_k1/1') });

  const st = abgleichStand(AREA, 'd_e2');
  const h = await holen(st, opts(s.geraet('d_e2')));
  assert.deepEqual(ids(st), [gut1.event.id, gut2.event.id], 'die gueltigen kommen an, sonst nichts');
  assert.equal(h.neu, 2);
  const gruende = Object.fromEntries(h.verworfen.map((v) => [v.kennung + ' ' + v.id, v.grund]));
  assert.deepEqual(gruende, {
    ['d_x1/1 ' + kaputt.id]: 'entschluesseln',
    ['d_x1/1 ' + falscheSig.event.id]: 'unterschrift',
    ['d_x1/1 ' + lehrkraft.event.id]: 'rolle-darf-nicht',
    ['d_x1/1 ' + fremdesGeraet.event.id]: 'geraet-fremd',
    ['d_x1/1 ' + y.event.id]: 'eintrag-passt-nicht',
    ['d_x1/1 ' + kopiert.id]: 'entschluesseln',
    ['d_x1/1 ' + fremderAutor.event.id]: 'autor-unbekannt',
    ['d_x1/1 ' + keinJson.id]: 'format',
    ['d_x1/1 e_' + 'a'.repeat(24)]: 'format',
    'd_x1/2 null': 'format',
    ['d_x1/3 ' + ganzKopiert.id]: 'entschluesseln',
    ['d_x1/4 ' + ausAREA2.event.id]: 'entschluesseln',
  });
  assert.equal(h.verworfen.length, 12, 'jeder schlechte Eintrag genau einmal gemeldet');
  for (const v of h.verworfen) assert.ok(ABGLEICH_GRUENDE.includes(v.grund), v.grund);
  const nochmal = await holen(st, opts(s.geraet('d_e2')));
  assert.deepEqual([nochmal.neu, nochmal.verworfen, ids(st).length], [0, [], 2]);
});

test('Schluesselwechsel: Buendel mit Version 2, Geraet kennt nur 1 -> wartend; nach Uebergabe gelesen, nichts doppelt', async () => {
  const eltern = { id: 'p_e1', pub: PUB.p_e1 }, kind = { id: 'p_k1', pub: PUB.p_k1 };
  const kr = await createKeyring(AREA, [eltern, kind]);
  const { ring, key: key2 } = await rotateKeyring(kr.ring, [eltern]);
  const schE = { aktuell: 2, keys: await keysForHolder(ring, KEYS.p_e1, 'p_e1') };
  let schK = { aktuell: 1, keys: await keysForHolder(ring, KEYS.p_k1, 'p_k1') };
  assert.deepEqual([...schK.keys.keys()], [1]);
  const s = lokalerSpeicher(), e = s.geraet('d_e1'), k = s.geraet('d_k1');
  const sk = abgleichStand(AREA, 'd_k1'), se = abgleichStand(AREA, 'd_e1');
  for (let i = 0; i < 2; i++) vormerken(sk, await ereignis('d_k1', 'answer'), { now: JETZT });
  assert.equal((await abgleichen(sk, opts(k, { schluessel: schK }))).ok, true);          // altes Buendel mit Version 1
  for (let i = 0; i < 3; i++) vormerken(se, await ereignis('d_e1', 'profile_set'), { now: JETZT });
  const re = await abgleichen(se, opts(e, { schluessel: schE }));
  assert.deepEqual([re.ok, re.neu, (await e.get(AREA, 'd_e1/1')).kv], [true, 2, 2]);

  for (let n = 0; n < 2; n++) {
    const h = await holen(sk, opts(k, { schluessel: schK }));
    assert.deepEqual([h.neu, h.verworfen, h.wartend, sk.wartend], [0, [], ['d_e1/1'], ['d_e1/1']]);
    assert.deepEqual((await k.list(AREA, sk.merker)).kennungen, [], 'der Merker ist trotzdem weiter');
  }
  const gespeichert = json(sk);
  await addKeyHolder(ring, key2, kind);                                                    // Uebergabe von Version 2
  schK = { aktuell: 2, keys: await keysForHolder(ring, KEYS.p_k1, 'p_k1') };
  for (const st of [sk, gespeichert]) {
    const h = await holen(st, opts(k, { schluessel: schK }));
    assert.deepEqual([h.neu, h.verworfen, h.wartend, st.wartend], [3, [], [], []]);
    assert.deepEqual(ids(st), ids(se));
    assert.equal(new Set(ids(st)).size, 5);
    assert.equal((await holen(st, opts(k, { schluessel: schK }))).neu, 0);
  }
});

test('Geraetestand als JSON: nach jedem Schritt gespeichert und geladen -> gleiches Ergebnis; zweimal holen ohne Neues aendert nichts', async () => {
  const eintraege = { d_k1: [], d_e1: [] };
  for (let i = 0; i < 12; i++) { eintraege.d_k1.push(await ereignis('d_k1', i % 2 ? 'answer' : 'round_done')); eintraege.d_e1.push(await ereignis('d_e1', 'profile_set')); }
  async function ablauf(rund) {
    const r = (x) => (rund ? json(x) : x);
    const s = lokalerSpeicher(), z = { d_k1: s.geraet('d_k1'), d_e1: s.geraet('d_e1') };
    const st = { d_k1: abgleichStand(AREA, 'd_k1'), d_e1: abgleichStand(AREA, 'd_e1') };
    const ergebnisse = [];
    for (let runde = 0; runde < 4; runde++) {
      for (const id of ['d_k1', 'd_e1']) {
        if ((runde + (id === 'd_k1' ? 0 : 1)) % 3 === 0) z[id].offline(); else z[id].online();
        for (const x of eintraege[id].slice(runde * 3, runde * 3 + 3)) { vormerken(st[id], x, { now: JETZT }); st[id] = r(st[id]); }
        const e = await abgleichen(st[id], opts(z[id]));
        st[id] = r(st[id]);
        ergebnisse.push(e);
      }
    }
    for (const id of ['d_k1', 'd_e1']) { z[id].online(); ergebnisse.push(await abgleichen(st[id], opts(z[id]))); st[id] = r(st[id]); }
    ergebnisse.push(await abgleichen(st.d_k1, opts(z.d_k1)));
    return { st, z, ergebnisse };
  }
  const direkt = await ablauf(false), rund = await ablauf(true);
  assert.deepEqual(rund.ergebnisse, direkt.ergebnisse);
  for (const id of ['d_k1', 'd_e1']) {
    assert.deepEqual(ids(rund.st[id]), ids(direkt.st[id]));
    assert.deepEqual(zustand(rund.st[id]), zustand(direkt.st[id]));
    assert.equal(ids(rund.st[id]).length, 24);
    const vorher = JSON.stringify(rund.st[id]);
    for (let n = 0; n < 2; n++) {
      const h = await holen(rund.st[id], opts(rund.z[id]));
      assert.deepEqual(h, { neu: 0, verworfen: [], wartend: [] });
      assert.equal(JSON.stringify(rund.st[id]), vorher, 'unveraendert');
    }
  }
});

test('Neues Geraet desselben Elternteils bekommt alles, auch die alten Buendel der Person von deren anderen Geraeten', async () => {
  const s = lokalerSpeicher(), e1 = s.geraet('d_e1'), k1 = s.geraet('d_k1');
  const se = abgleichStand(AREA, 'd_e1'), sk = abgleichStand(AREA, 'd_k1');
  for (let runde = 0; runde < 3; runde++) {
    vormerken(se, await ereignis('d_e1', 'sheet_created'), { now: JETZT });
    vormerken(sk, await ereignis('d_k1', 'answer'), { now: JETZT });
    await abgleichen(se, opts(e1)); await abgleichen(sk, opts(k1));
  }
  await abgleichen(se, opts(e1));
  const laptop = abgleichStand(AREA, 'd_e3');
  const h = await holen(laptop, opts(s.geraet('d_e3')));
  assert.deepEqual([h.neu, h.verworfen], [6, []]);
  assert.deepEqual(ids(laptop), ids(se));
  assert.equal(laptop.log.filter((x) => x.event.author === 'p_e1').length, 3, 'die eigenen Ereignisse der Person');
  assert.deepEqual(zustand(laptop), zustand(se));

  const neuInstalliert = abgleichStand(AREA, 'd_e1');                                  // dasselbe Geraet, leerer Stand: liest auch die eigenen Buendel
  const h2 = await holen(neuInstalliert, opts(e1));
  assert.deepEqual([h2.neu, ids(neuInstalliert), neuInstalliert.naechsteNr], [6, ids(se), 4]);
  const alt = await e1.get(AREA, 'd_e1/3');
  vormerken(neuInstalliert, await ereignis('d_e1', 'profile_set'), { now: JETZT });
  assert.equal((await abgleichen(neuInstalliert, opts(e1))).gesendet, 1);
  assert.deepEqual((await e1.list(AREA)).kennungen.filter((k) => k.startsWith('d_e1/')), ['d_e1/1', 'd_e1/2', 'd_e1/3', 'd_e1/4']);
  assert.deepEqual(await e1.get(AREA, 'd_e1/3'), alt);
});

test('Netzabbruch mitten im Holen oder Senden: Stand unveraendert bis auf Bestaetigtes', async () => {
  const s = lokalerSpeicher(), a = s.geraet('d_e1'), echt = s.geraet('d_k1');
  const sa = abgleichStand(AREA, 'd_e1');
  for (let i = 0; i < 150; i++) vormerken(sa, await ereignis('d_e1', 'profile_set'), { now: JETZT });
  assert.equal((await abgleichen(sa, opts(a))).ok, true);                         // zwei Buendel liegen bereit
  let gets = 0;
  const wackelig = { ...echt, get: async (...x) => { if (++gets === 2) { const e = new Error('speicher: offline'); e.code = 'offline'; throw e; } return echt.get(...x); } };
  const st = abgleichStand(AREA, 'd_k1');
  vormerken(st, await ereignis('d_k1', 'answer'), { now: JETZT });
  const vorher = JSON.stringify(st);
  await assert.rejects(holen(st, opts(wackelig)), (e) => e.code === 'offline');
  assert.equal(JSON.stringify(st), vorher, 'holen: nichts halb geschrieben');
  const h = await holen(st, opts(wackelig));
  assert.deepEqual([h.neu, st.log.length], [150, 151]);
  // senden: das erste von zwei Buendeln geht durch, dann bricht das Netz -> nur das erste ist aus dem Ausgang
  let puts = 0;
  const halb = { ...echt, put: async (...x) => { if (++puts === 2) { const e = new Error('speicher: offline'); e.code = 'offline'; throw e; } return echt.put(...x); } };
  for (let i = 0; i < 150; i++) vormerken(st, await ereignis('d_k1', 'answer'), { now: JETZT });
  const r = await abgleichen(st, opts(halb));
  assert.deepEqual([r.ok, r.fehler, r.gesendet, st.ausgang.length, st.naechsteNr], [false, 'offline', 100, 51, 2]);
  const r2 = await abgleichen(st, opts(halb));
  assert.deepEqual([r2.ok, r2.gesendet, st.ausgang.length], [true, 51, 0]);
  const sa2 = abgleichStand(AREA, 'd_e2');
  await holen(sa2, opts(s.geraet('d_e2')));
  assert.deepEqual(ids(sa2), ids(st));
  assert.equal(ids(sa2).length, 301);
});

test('Eingaben: nur eigene, gueltige Eintraege vormerken; holen braucht now; senden braucht den aktuellen Schluessel', async () => {
  const st = abgleichStand(AREA, 'd_k1'), z = lokalerSpeicher().geraet('d_k1');
  const fremd = await ereignis('d_e1', 'profile_set');
  assert.throws(() => vormerken(st, fremd), /nur Ereignisse dieses Geraets/);
  assert.throws(() => vormerken(st, { event: fremd.event }), /Eintrag ungueltig/);
  assert.throws(() => vormerken({ ...st, extra: 1 }, fremd), /Geraetestand ungueltig/);
  const x = await ereignis('d_k1', 'answer');
  vormerken(st, x, { now: JETZT }); vormerken(st, x, { now: JETZT });
  assert.deepEqual([st.ausgang.length, st.log.length], [1, 1], 'dasselbe Ereignis zweimal -> einmal');
  await assert.rejects(holen(st, opts(z, { now: undefined })), /now/);
  await assert.rejects(senden(st, opts(z, { schluessel: { aktuell: 2, keys: new Map([[1, K1]]) } })), /aktueller Schluessel fehlt/);
  assert.deepEqual([st.ausgang.length, st.unterwegs], [1, null], 'nichts vorbereitet ohne Schluessel');
  assert.throws(() => abgleichStand('', 'd_k1'));
});

test('Reinheit: kein Netz, kein Browser-Speicher, kein Zufall ausser krypto; Importe nur aus Modulen; Hilfsnamen mit abg/ABG_', () => {
  const src = fs.readFileSync(new URL('../../src/module/abgleich.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /\bfetch\s*\(/);
  for (const w of ['XMLHttpRequest', 'localStorage', 'indexedDB', 'Math.random', 'api.github.com', 'setTimeout', 'setInterval']) assert.equal(src.includes(w), false, w);
  const importe = [...src.matchAll(/^import .* from '(.+)';$/gm)].map((m) => m[1]);
  assert.deepEqual(importe, ['./krypto.mjs', './ereignisse.mjs', './annahme.mjs']);
  const oben = [...src.matchAll(/^(?:export\s+)?(?:async\s+)?(?:function\s+([\w$]+)|(?:const|let|class)\s+([\w$]+))/gm)];
  for (const m of oben) {
    const name = m[1] || m[2];
    assert.ok(m[0].startsWith('export') || /^(abg|ABG_)/.test(name), name);
  }
});

test('a school cursor from an old build is replayed once, including own bundles, and retries after interruption', async () => {
  const area = 'schule:p_k1';
  const storage = lokalerSpeicher();
  const device = storage.geraet('d_e1');
  const writer = abgleichStand(area, 'd_e1');
  const assessment = {
    child: 'p_k1', evaluation: '7d97af5e-6e19-46b8-85c6-d3c950a77680', revision: '7d97af5e-6e19-46b8-85c6-d3c950a77681',
    title: 'Fiktive Evaluation', day: TAG, standard: 'M-N5', rating: 'C', focus: 'two-step',
  };
  const old = await signEvent(newEvent({ type: 'school_import', author: 'p_e1', device: 'd_e1', at: at(),
    payload: { asOf: TAG, data: { asOf: TAG, tasks: [] } } }), area, KEYS.p_e1);
  const current = await signEvent(newEvent({ type: 'school_evaluation', author: 'p_e1', device: 'd_e1', at: at(),
    payload: assessment }), area, KEYS.p_e1);
  for (const item of [old, current]) {
    vormerken(writer, item, { now: JETZT });
    await senden(writer, { zugang: device, schluessel: SCH });
  }

  const saved = { ...json(writer), log: [old], merker: (await device.list(area, null)).merker };
  const before = json(saved);
  const listed = [], read = [];
  let interrupt = true;
  const access = {
    ...device,
    list: (area, cursor) => { listed.push(cursor); return device.list(area, cursor); },
    get: (area, id) => {
      read.push(id);
      if (interrupt && id.endsWith('/2')) throw Object.assign(new Error('offline'), { code: 'offline' });
      return device.get(area, id);
    },
  };
  const setup = opts(access, { zulassung: { ...Z, area } });
  await assert.rejects(holen(saved, setup), { code: 'offline' });
  assert.deepEqual(saved, before);
  interrupt = false;
  assert.equal((await holen(saved, setup)).neu, 1);
  assert.deepEqual(ids(saved), [old.event.id, current.event.id]);
  assert.equal(saved.naechsteNr, before.naechsteNr);
  assert.deepEqual(saved.merker.stand, before.merker.stand);
  assert.equal((await holen(saved, setup)).neu, 0);
  assert.deepEqual(listed.slice(0, 2), [null, null]);
  assert.deepEqual(listed[2], saved.merker);
  assert.deepEqual(read, ['d_e1/1', 'd_e1/2', 'd_e1/1', 'd_e1/2']);
});
