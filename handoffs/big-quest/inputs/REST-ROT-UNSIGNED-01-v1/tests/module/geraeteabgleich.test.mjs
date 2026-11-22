// Modul geraeteabgleich ohne App (S12 Aufgabe 3b-2b): die Bruecke zwischen dem Ereignis-Speicher eines Geraets und dem
// Abgleich. Der Beleg mit echten App-Instanzen (E1, E4, E6, E10) steht in tests/zwei-geraete.test.mjs.
//   node --test tests/module/geraeteabgleich.test.mjs

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { geraetAbgleichen, GERAETEABGLEICH_SPEICHER, GERAETEABGLEICH_VERWORFEN_MAX } from '../../src/module/geraeteabgleich.mjs';
import { newPersonKeys, publicKeysOf } from '../../src/module/krypto.mjs';
import { newEvent } from '../../src/module/ereignisse.mjs';
import { lokalerSpeicher } from '../../src/module/speicher.mjs';
import { derive } from '../../src/module/ableitung.mjs';
import { appLesen } from '../../werkzeug/module.mjs';

const P = {};
before(async () => { for (const [n, role] of [['p_e1', 'parent'], ['p_k1', 'child'], ['p_x1', 'parent']]) { const keys = await newPersonKeys(); P[n] = { role, keys, pub: await publicKeysOf(keys) }; } });
const T0 = Date.UTC(2026, 10, 4, 8, 0, 0), HEUTE = '2026-11-04';
const ablage = (m = new Map()) => ({ m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); } });
const KIND = () => ({ id: 'p_k1', pre: 'bq2_p_k1__', anker: { person: 'p_e1', role: 'parent', pub: P.p_e1.pub } });
const VZ = () => ({ p_e1: { role: 'parent', pub: P.p_e1.pub }, p_k1: { role: 'child', pub: P.p_k1.pub } });
/* ein Geraet ohne App: eigener Speicher (mit Kennung), Personen mit Schluesseln */
function geraet(welt, d, wer) {
  const a = ablage(); a.setItem('bq2_evDevice', JSON.stringify(d));
  const personen = Object.fromEntries(wer.map((p) => [p, P[p]]));
  let uhr = T0;
  return {
    a, d, z: welt.geraet(d),
    sync: (extra = {}) => geraetAbgleichen({ ablage: a, zugang: welt.geraet(d), personen, kinder: [KIND()], verzeichnis: VZ(), now: (uhr += 60000), heute: HEUTE, ...extra }),
    /* was die App schreibt: ein Ereignis in ihr Protokoll */
    schreibt: (author, type, payload, min) => { const k = 'bq2_p_k1__events', l = JSON.parse(a.getItem(k) || '[]'); const e = newEvent({ type, author, device: d, at: new Date(T0 + min * 60000).toISOString(), payload }); l.push(e); a.setItem(k, JSON.stringify(l)); return e; },
    log: () => JSON.parse(a.getItem('bq2_p_k1__events') || '[]'),
  };
}
const antwort = (q) => ({ day: HEUTE, skill: 'round', level: 2, attempt: 1, ok: true, qid: q });

test('Zwei Geraete ohne App: Eltern richten ein, Kind meldet sich an; Antworten und Einstellungen gehen in beide Richtungen, keine Zulassungs-Ereignisse in der App', async () => {
  const welt = lokalerSpeicher({ now: () => T0 });
  const E = geraet(welt, 'd_E1', ['p_e1']), K = geraet(welt, 'd_K1', ['p_k1']);
  const r0 = await E.sync();
  assert.equal(r0.bereiche['kind:lern:p_k1'].aktion, 'angelegt');
  assert.deepEqual(Object.keys(r0.bereiche), ['kind:lern:p_k1', 'kind:privat:p_k1', 'schule:p_k1', 'eltern:allg:p_k1', 'person:p_e1']);
  await K.sync();
  const a1 = K.schreibt('p_k1', 'answer', antwort('a'), 10), a2 = K.schreibt('p_k1', 'answer', antwort('b'), 11);
  const s1 = E.schreibt('p_e1', 'setting_set', { setting: 'focusMode', value: 'manual' }, 12);
  // ein Zulassungs-Ereignis im Protokoll der App (die App schreibt keine) geht nicht mit: die Zulassung macht nur dieses Modul
  const fremd = K.schreibt('p_k1', 'device_added', { device: 'd_K1' }, 13);
  const rk = await K.sync(), re = await E.sync(), rk2 = await K.sync();
  assert.equal(rk.bereiche['kind:lern:p_k1'].gesendet, 2);
  K.a.setItem('bq2_p_k1__events', JSON.stringify(K.log().filter((e) => e.id !== fremd.id)));
  assert.equal(re.inDieApp, 2); assert.equal(rk2.inDieApp, 1);
  assert.deepEqual(E.log().map((e) => e.id).sort(), [a1.id, a2.id, s1.id].sort());
  assert.deepEqual(K.log().map((e) => e.id).sort(), [a1.id, a2.id, s1.id].sort());
  assert.deepEqual(derive(E.log(), { now: T0 + 864e5 }), derive(K.log(), { now: T0 + 864e5 }));
  assert.equal(K.log().some((e) => /^(member|device|key)_/.test(e.type)), false, 'keine Zulassungs-Ereignisse in der App');
  assert.deepEqual([...rk.verworfen, ...re.verworfen, ...rk2.verworfen], []);
  // noch einmal: nichts Neues, nichts doppelt
  const r = await E.sync();
  assert.equal(r.inDieApp, 0); assert.equal(E.log().length, 3);
  // das Kind hat keinen Schluessel zu eltern:allg - es nimmt dort nichts teil
  assert.equal(rk.bereiche['eltern:allg:p_k1'].gesendet, 0);
  assert.ok(JSON.parse(K.a.getItem(GERAETEABGLEICH_SPEICHER.staende))['eltern:allg:p_k1'].log.length === 0);
});

test('Offline: nichts geht verloren - die Ereignisse bleiben in der App und gehen beim naechsten Abgleich raus', async () => {
  const welt = lokalerSpeicher({ now: () => T0 });
  const E = geraet(welt, 'd_E1', ['p_e1']), K = geraet(welt, 'd_K1', ['p_k1']);
  await E.sync(); await K.sync();
  K.z.offline();
  const a = K.schreibt('p_k1', 'answer', antwort('off'), 20);
  const r = await geraetAbgleichen({ ablage: K.a, zugang: K.z, personen: { p_k1: P.p_k1 }, kinder: [KIND()], verzeichnis: VZ(), now: T0 + 30 * 60000, heute: HEUTE });
  assert.ok(Object.values(r.bereiche).every((b) => b.ok === false && b.fehler === 'offline'));
  K.z.online();
  await K.sync(); const re = await E.sync();
  assert.equal(re.inDieApp, 1); assert.deepEqual(E.log().map((e) => e.id), [a.id]);
});

test('Abgleich in der App: inDieApp false haelt Neues zurueck (kommt beim naechsten Mal); limit - die uebrigen Bereiche werden ausgelassen, Wartezeit im Bericht', async () => {
  const welt = lokalerSpeicher({ now: () => T0 });
  const E = geraet(welt, 'd_E1', ['p_e1']), K = geraet(welt, 'd_K1', ['p_k1']);
  await E.sync(); await K.sync();
  const a = K.schreibt('p_k1', 'answer', antwort('r'), 10);
  const rk = await K.sync({ inDieApp: false });
  assert.equal(rk.bereiche['kind:lern:p_k1'].gesendet, 1, 'gesendet wird trotzdem');
  const r1 = await E.sync({ inDieApp: false });
  assert.equal(r1.inDieApp, 0); assert.equal(r1.zurueckgehalten, 1); assert.deepEqual(E.log(), [], 'nichts in der App');
  const r2 = await E.sync();
  assert.equal(r2.inDieApp, 1); assert.deepEqual(E.log().map((e) => e.id), [a.id], 'beim naechsten Mal da');
  // limit: der erste Bereich meldet es -> keine weitere Frage an den Speicher
  let n = 0;
  const z = welt.geraet('d_E1');
  const voll = { ...z, keys: async () => { n++; const e = new Error('speicher: limit'); e.code = 'limit'; e.wartezeit = 600000; throw e; } };
  const r3 = await geraetAbgleichen({ ablage: E.a, zugang: voll, personen: { p_e1: P.p_e1 }, kinder: [KIND()], verzeichnis: VZ(), now: T0 + 3600e3, heute: HEUTE });
  assert.equal(r3.limit, 600000);
  assert.equal(n, 1, 'nach dem Limit nicht weiter gefragt');
  assert.ok(Object.values(r3.bereiche).every((b) => b.fehler === 'limit'));
  assert.equal(Object.values(r3.bereiche).filter((b) => b.ausgelassen).length, 4);
  await assert.rejects(geraetAbgleichen({ ablage: E.a, zugang: z, personen: { p_e1: P.p_e1 }, kinder: [KIND()], verzeichnis: VZ(), now: T0, heute: HEUTE, inDieApp: 'nein' }), /inDieApp/);
});

test('Ohne Schluessel der Person: ein Ereignis einer Person, deren Schluessel nicht auf dem Geraet liegen, wird nicht gesendet (gezaehlt); niemand mit aktuellem Schluessel -> kein-schluessel', async () => {
  const welt = lokalerSpeicher({ now: () => T0 });
  const E = geraet(welt, 'd_E1', ['p_e1']), K = geraet(welt, 'd_K1', ['p_k1']);
  await E.sync(); await K.sync();
  K.schreibt('p_e1', 'setting_set', { setting: 'focusMode', value: 'manual' }, 20);     // Peter am iPad des Kindes, ohne seine Schluessel
  const r = await K.sync();
  assert.equal(r.bereiche['kind:privat:p_k1'].ohneSchluessel, 1);
  assert.equal(r.bereiche['kind:privat:p_k1'].gesendet, 0);
  // ein fremder Elternteil (nicht in der Familie) auf einem Geraet: keine Schluessel, nichts zu holen, sein Eintrag bleibt liegen
  const X = geraet(welt, 'd_X1', ['p_x1']);
  X.schreibt('p_x1', 'setting_set', { setting: 'focusMode', value: 'auto' }, 21);
  const rx = await X.sync();
  assert.equal(rx.bereiche['kind:privat:p_k1'].fehler, 'kein-schluessel');
  assert.equal(rx.inDieApp, 0);
});

test('Anmeldung des Geraets: nach der Aufnahme, auch wenn die Uhr des Kindergeraets nachgeht; ein entferntes Geraet meldet sich nicht selbst wieder an', async () => {
  const welt = lokalerSpeicher({ now: () => T0 });
  const E = geraet(welt, 'd_E1', ['p_e1']), K = geraet(welt, 'd_K1', ['p_k1']);
  await E.sync({ now: T0 + 3600e3 });
  // die Uhr des iPads geht eine Stunde nach: die Anmeldung liegt trotzdem nach der Aufnahme und zaehlt
  const rk = await K.sync({ now: T0 });
  const st = () => JSON.parse(K.a.getItem(GERAETEABGLEICH_SPEICHER.staende))['kind:lern:p_k1'];
  const anm = st().log.find((x) => x.event.type === 'device_added' && x.event.author === 'p_k1');
  assert.ok(Date.parse(anm.event.at) > T0 + 3600e3, anm.event.at);
  assert.deepEqual(rk.verworfen, []);
  await K.sync({ now: T0 + 60000 });
  assert.equal(st().log.filter((x) => x.event.type === 'device_added' && x.event.author === 'p_k1').length, 1, 'nur einmal angemeldet');
  // Peter entfernt das iPad (Ereignis device_removed im Bereich, unterschrieben) - es meldet sich nicht selbst wieder an
  const { signEvent } = await import('../../src/module/annahme.mjs'), { vormerken } = await import('../../src/module/abgleich.mjs');
  const alle = JSON.parse(E.a.getItem(GERAETEABGLEICH_SPEICHER.staende));
  vormerken(alle['kind:lern:p_k1'], await signEvent(newEvent({ type: 'device_removed', author: 'p_e1', device: 'd_E1', at: new Date(T0 + 2 * 3600e3).toISOString(), payload: { device: 'd_K1' } }), 'kind:lern:p_k1', P.p_e1.keys), { now: T0 + 2 * 3600e3 });
  E.a.setItem(GERAETEABGLEICH_SPEICHER.staende, JSON.stringify(alle));
  await E.sync({ now: T0 + 2 * 3600e3 + 1000 });
  await K.sync({ now: T0 + 3 * 3600e3 });
  const a = K.schreibt('p_k1', 'answer', antwort('nachher'), 4 * 60);
  await K.sync({ now: T0 + 5 * 3600e3 });
  assert.equal(st().log.filter((x) => x.event.type === 'device_added' && x.event.author === 'p_k1').length, 1, 'keine neue Anmeldung');
  const re = await E.sync({ now: T0 + 6 * 3600e3 });
  assert.deepEqual(re.verworfen.map((v) => [v.id, v.grund]), [[a.id, 'geraet-nicht-angemeldet']]);
  assert.equal(E.log().some((e) => e.id === a.id), false);
});

test('Verworfenes wird auf dem Geraet festgehalten (hoechstens GERAETEABGLEICH_VERWORFEN_MAX, die neuesten)', async () => {
  const a = ablage();
  a.setItem('bq2_evDevice', JSON.stringify('d_E1'));
  a.setItem(GERAETEABGLEICH_SPEICHER.verworfen, JSON.stringify(Array.from({ length: GERAETEABGLEICH_VERWORFEN_MAX }, (_, i) => ({ i }))));
  const welt = lokalerSpeicher({ now: () => T0 }), z = welt.geraet('d_ANGREIFER000000001');
  // ein Buendel, das sich nicht oeffnen laesst, im Bereich des Kindes - nachdem die Eltern ihn angelegt haben
  await geraetAbgleichen({ ablage: a, zugang: welt.geraet('d_E1'), personen: { p_e1: P.p_e1 }, kinder: [KIND()], verzeichnis: VZ(), now: T0, heute: HEUTE });
  await z.put('kind:lern:p_k1', 'd_ANGREIFER000000001', { nr: 1, inhalt: { v: 1, kv: 1, eintraege: [{ id: 'e_x', iv: 'AAAA', ct: 'AAAA' }] } });
  const r = await geraetAbgleichen({ ablage: a, zugang: welt.geraet('d_E1'), personen: { p_e1: P.p_e1 }, kinder: [KIND()], verzeichnis: VZ(), now: T0 + 1000, heute: HEUTE });
  assert.deepEqual(r.verworfen.map((v) => [v.bereich, v.kennung, v.grund]), [['kind:lern:p_k1', 'd_ANGREIFER000000001/1', 'entschluesseln']]);
  const v = JSON.parse(a.getItem(GERAETEABGLEICH_SPEICHER.verworfen));
  assert.equal(v.length, GERAETEABGLEICH_VERWORFEN_MAX);
  assert.deepEqual([v.at(-1).grund, v.at(-1).am, v[0].i], ['entschluesseln', new Date(T0 + 1000).toISOString(), 1]);
});

test('Eingaben: ablage, zugang, personen (mit role, keys, pub), kinder, now, heute und die Geraete-Kennung sind Pflicht', async () => {
  const welt = lokalerSpeicher(), a = ablage(); a.setItem('bq2_evDevice', JSON.stringify('d_E1'));
  const gut = { ablage: a, zugang: welt.geraet('d_E1'), personen: { p_e1: P.p_e1 }, kinder: [KIND()], verzeichnis: VZ(), now: T0, heute: HEUTE };
  for (const [feld, wert, text] of [['ablage', {}, /ablage/], ['zugang', null, /zugang/], ['personen', {}, /personen/], ['personen', { p_e1: { role: 'parent', keys: P.p_e1.keys } }, /pub/],
    ['personen', { x: P.p_e1 }, /Person/], ['personen', { p_e1: { ...P.p_e1, role: 'king' } }, /role/], ['kinder', [{ id: 'p_k1', pre: 'x_', anker: {} }], /kinder/], ['kinder', null, /kinder/],
    ['kinder', [{ ...KIND(), freigaben: 'g1' }], /freigaben/], ['kinder', [{ ...KIND(), freigaben: ['g 1'] }], /freigaben/], ['kinder', [{ ...KIND(), freigaben: [7] }], /freigaben/],
    ['verzeichnis', null, /verzeichnis/], ['now', undefined, /now/], ['heute', '4.11.2026', /heute/]]) {
    await assert.rejects(geraetAbgleichen({ ...gut, [feld]: wert }), text, feld + ' ' + JSON.stringify(wert));
  }
  const ohne = ablage();
  await assert.rejects(geraetAbgleichen({ ...gut, ablage: ohne }), /Kennung/);
  assert.equal(ohne.m.size, 0, 'bei einem Fehler in den Eingaben wird nichts geschrieben');
});

test('Reinheit: kein Netz, kein Browser-Speicher, keine Uhr, kein Zufall; Importe nur aus Modulen; Hilfsnamen gab/GAB_; nur im Testbau, nach lesen', () => {
  const src = fs.readFileSync(new URL('../../src/module/geraeteabgleich.mjs', import.meta.url), 'utf8');
  for (const w of ['fetch(', 'XMLHttpRequest', 'localStorage', 'indexedDB', 'Math.random', 'Date.now', 'new Date()', 'setTimeout', 'setInterval', 'document.', 'window.']) assert.equal(src.includes(w), false, w);
  assert.deepEqual([...src.matchAll(/^import .* from '(.+)';$/gm)].map((m) => m[1]), ['./ereignisse.mjs', './annahme.mjs', './bereiche.mjs', './abgleich.mjs', './zulassung.mjs']);
  for (const m of src.matchAll(/^(?:export\s+)?(?:async\s+)?(?:function\s+([\w$]+)|(?:const|let|class)\s+([\w$]+))/gm)) {
    const name = m[1] || m[2];
    assert.ok(m[0].startsWith('export') || /^(gab|GAB_)/.test(name), name);
  }
  const liste = JSON.parse(fs.readFileSync(new URL('../../src/module/module.json', import.meta.url), 'utf8')).module;
  const mod = liste.find((x) => x.name === 'geraeteabgleich');
  assert.equal(mod.bau, 'test');
  assert.ok(liste.indexOf(mod) > liste.findIndex((x) => x.name === 'lesen'), 'nach lesen');
  assert.equal(appLesen('utf8', { bauart: 'live' }).includes('geraetAbgleichen'), false, 'nicht im Live-Bau');
  assert.equal(appLesen('utf8', { bauart: 'test' }).includes('async function geraetAbgleichen('), true, 'im Testbau');
});
