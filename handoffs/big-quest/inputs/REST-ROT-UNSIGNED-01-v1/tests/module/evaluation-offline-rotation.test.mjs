// REST-ROT-01: a confirmed school evaluation, signed and prepared for upload, then the upload is interrupted; the same
// parent renews the keys on another device and logs in again -> the original event reaches the other parent exactly once.
//   node --test tests/module/evaluation-offline-rotation.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verbindungen, kindAnlegen, elternteilEinladen, abgleichMitVerbindungen } from '../../src/module/einladung.mjs';
import { startcodeAusstellen, ersteAnmeldung, anmelden, schluesselErneuern } from '../../src/module/konto.mjs';
import { lokalerSpeicher } from '../../src/module/speicher.mjs';
import { newEvent, checkEvent } from '../../src/module/ereignisse.mjs';
import { GERAETEABGLEICH_SPEICHER } from '../../src/module/geraeteabgleich.mjs';
import { abgleichStand, buendelErneuern } from '../../src/module/abgleich.mjs';

const R = 1000, T0 = Date.UTC(2026, 10, 4, 8), HEUTE = '2026-11-04';
const PW = { verwalter: 'Tiger-Lamp-River-4271', peter: 'Otter-Cake-Moss-1234', anna: 'Koala-Bread-Cliff-5502', kathie: 'Puffin-Jam-Lake-9876', neu: 'Walrus-Taco-Pine-1357' };
const weiter = (W, ms = 60000) => (W.uhr.t += ms);
const ablage = () => { const m = new Map(); return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); } }; };
function geraet(W, d, konto) {
  const a = ablage(); a.setItem('bq2_evDevice', JSON.stringify(d));
  const g = {
    a, d, konto,
    z: () => W.geraet(d),
    sync: () => abgleichMitVerbindungen({ ablage: a, zugang: W.geraet(d), konten: [g.konto], now: weiter(W), heute: HEUTE }),
    v: () => verbindungen({ ablage: a, konto: g.konto, now: W.uhr.t }),
    log: (kind) => JSON.parse(a.getItem('bq2_' + kind + '__events') || '[]'),
    antworten: (kind) => g.log(kind).filter((e) => e.type === 'answer').map((e) => e.id).sort(),
    ueben: (n) => {
      const k = 'bq2_' + g.konto.kennung + '__events', l = JSON.parse(a.getItem(k) || '[]');
      for (let i = 0; i < n; i++) l.push(newEvent({ type: 'answer', author: g.konto.kennung, device: d, at: new Date(weiter(W, 1000)).toISOString(), payload: { day: HEUTE, skill: 'numbers', level: 2, attempt: 1, ok: true, qid: 'q' + l.length } }));
      a.setItem(k, JSON.stringify(l));
    },
    schreibt: (kind, type, payload) => {
      const k = 'bq2_' + kind + '__events', l = JSON.parse(a.getItem(k) || '[]');
      l.push(newEvent({ type, author: g.konto.kennung, device: d, at: new Date(weiter(W, 1000)).toISOString(), payload }));
      a.setItem(k, JSON.stringify(l));
    },
    fertig: (r) => { assert.deepEqual(r.erneuerungOffen, [], 'alle Bereiche haben den neuen Schluessel'); if (g.konto.alt) { g.konto = { ...g.konto }; delete g.konto.alt; } },
  };
  return g;
}
async function einloesen(W, d, qr, passwort) {
  return geraet(W, d, await ersteAnmeldung({ zugang: W.geraet(d), code: qr.code, passwort, fingerabdruck: qr.fingerabdruck, now: W.uhr.t, runden: R }));
}
async function familie(W) {
  const sa = await startcodeAusstellen({ zugang: W.geraet('d_A1'), aussteller: null, anmeldename: 'verwalter', art: 'admin', now: W.uhr.t });
  const admin = await ersteAnmeldung({ zugang: W.geraet('d_A1'), code: sa.code, passwort: PW.verwalter, now: W.uhr.t, runden: R });
  const sp = await startcodeAusstellen({ zugang: W.geraet('d_A1'), aussteller: admin, anmeldename: 'peter', art: 'parent', now: W.uhr.t });
  const P1 = await einloesen(W, 'd_P1', sp, PW.peter);
  await P1.sync();
  const e = await elternteilEinladen({ zugang: P1.z(), ablage: P1.a, konto: P1.konto, anmeldename: 'anna', now: weiter(W) });
  const P2 = await einloesen(W, 'd_P2', e, PW.anna);
  await P2.sync(); await P1.sync(); await P2.sync();
  const qr = await kindAnlegen({ zugang: P1.z(), ablage: P1.a, konto: P1.konto, anmeldename: 'kathie', anzeigename: 'Kathie', now: weiter(W) });
  const K = await einloesen(W, 'd_K1', qr, PW.kathie);
  await K.sync(); await P1.sync(); await K.sync(); await P2.sync(); await P1.sync();
  K.ueben(3); await K.sync(); await P1.sync(); await P2.sync();
  assert.equal(P2.antworten(K.konto.kennung).length, 3, 'Ausgangslage: Anna sieht 3 Antworten');
  return { admin, P1, P2, K };
}

test('REST-ROT-01: prepared in-flight (signed, bundle prepared, upload interrupted) -> the confirmed evaluation reaches the other parent once after the renewal, bytes unchanged', async () => {
  const uhr = { t: T0 }, storage = lokalerSpeicher({ now: () => uhr.t });
  let blocked = null;
  const W = { uhr, geraet(d) { const z = storage.geraet(d); return { ...z, async put(area, ...args) { if (blocked && blocked.device === d && blocked.area === area) { const e = new Error('Synthetic dropped upload'); e.code = 'offline'; throw e; } return z.put(area, ...args); } }; } };
  const { P1, P2, K } = await familie(W), child = K.konto.kennung, area = 'schule:' + child;
  const P1b = geraet(W, 'd_P1b', await anmelden({ zugang: W.geraet('d_P1b'), anmeldename: 'peter', passwort: PW.peter, runden: R }));
  await P1b.sync();
  const evaluation = '0a667a6c-8d8c-4520-a6ec-000000000001', revision = '0a667a6c-8d8c-4520-a6ec-000000000002';
  P1.schreibt(child, 'school_evaluation', { child, evaluation, revision, title: 'Synthetic REST rotation evaluation', day: HEUTE, assessment: { area: 'maths', goal: '', instructions: '', feedback: '', criteria: [{ criterion: 'Synthetic place value criterion', rating: 'C', standard: 'M-N1', evidence: '' }] } });
  const event = P1.log(child).find((e) => e.payload && e.payload.evaluation === evaluation);
  assert.deepEqual(checkEvent(event), []);
  blocked = { device: P1.d, area };
  await P1.sync();
  const st = JSON.parse(P1.a.getItem(GERAETEABGLEICH_SPEICHER.staende))[area];
  assert.ok(st.ausgang.some((x) => x.event.id === event.id && x.sig), 'signed outbox');
  assert.ok(st.unterwegs && st.unterwegs.inhalt && st.unterwegs.anzahl > 0, 'prepared in-flight');
  const signiert = st.ausgang.find((x) => x.event.id === event.id);
  await P2.sync(); assert.equal(P2.log(child).filter((e) => e.id === event.id).length, 0);
  const beforePub = JSON.stringify(P1.konto.pub);
  P1b.konto = await schluesselErneuern({ zugang: P1b.z(), anmeldename: 'peter', passwort: PW.peter, neuesPasswort: PW.neu, runden: R });
  P1b.fertig(await P1b.sync());
  assert.notEqual(JSON.stringify(P1b.konto.pub), beforePub);
  P1.konto = await anmelden({ zugang: P1.z(), anmeldename: 'peter', passwort: PW.neu, runden: R });
  assert.equal(JSON.stringify(P1.konto.pub), JSON.stringify(P1b.konto.pub));
  assert.ok(P1.v().kinder.some((x) => x.id === child), 'same child, still authorized');
  blocked = null;
  await P1.sync(); await P2.sync(); await P1b.sync(); await K.sync();
  for (let n = 0; n < 3; n++) for (const g of [P1, P1b, P2, K]) await g.sync();   // stable: no duplicate, no change
  for (const g of [P1, P2]) {
    const mine = g.log(child).filter((e) => e.id === event.id);
    assert.equal(mine.length, 1, g.d + ': the evaluation exactly once');
    assert.equal(mine[0].type, 'school_evaluation');
    assert.equal(mine[0].author, event.author);
    assert.equal(mine[0].at, event.at, g.d + ': same time (no new variant)');
    assert.deepEqual(mine[0].payload, event.payload, g.d + ': same child, evaluation, revision');
    assert.equal(g.log(child).filter((e) => e.payload && e.payload.evaluation === evaluation && e.payload.revision === revision).length, 1, g.d + ': same revision once');
  }
  assert.equal(P2.log(child).filter((e) => e.payload && e.payload.evaluation === evaluation).length, 1, 'no second evaluation');
  const st2 = JSON.parse(P1.a.getItem(GERAETEABGLEICH_SPEICHER.staende))[area];
  assert.equal(st2.ausgang.length, 0); assert.equal(st2.unterwegs, null);
  const imLog = st2.log.find((x) => x.event.id === event.id);
  assert.deepEqual(imLog, signiert, 'event and signature byte for byte as first signed');
});

/* unit tests of buendelErneuern: a made-up device state, only the fields the function reads */
function stand0({ kv = 1, nr = 5, autor = 'p_a', geraet = 'd_x', wechsel = {} } = {}) {
  const s = abgleichStand('schule:p_k', geraet);
  const ev = { id: 'e_1', type: 'school_evaluation', author: autor, device: geraet, at: '2026-11-04T08:00:00.000Z', payload: {} };
  s.ausgang.push({ event: ev, sig: 'x' });
  s.unterwegs = { nr, anzahl: 1, inhalt: { v: 1, kv, eintraege: [] } };
  s.naechsteNr = nr;
  s.log.push({ event: { id: 'e_k', type: 'key_rotated', author: 'p_b', device: 'd_b', at: '2026-11-04T09:00:00.000Z', payload: { version: 2, entfernt: [], stand: { [geraet]: 4 }, erneuert: ['p_a'], ...wechsel } }, sig: 'y' });
  return s;
}
const neuerSchluessel = { aktuell: 2, keys: new Map() };
const ja = async () => true, nein = async () => false;

test('buendelErneuern: a renewed author, bundle beyond the stand of the change, caller allows -> prepared bundle dropped, entries untouched', async () => {
  const s = stand0(), vorher = JSON.stringify(s.ausgang);
  assert.equal(await buendelErneuern(s, { schluessel: neuerSchluessel, erlaubt: ja }), true);
  assert.equal(s.unterwegs, null); assert.equal(JSON.stringify(s.ausgang), vorher); assert.equal(s.naechsteNr, 5);
});
test('buendelErneuern: the caller does not allow the entry (foreign device, unknown keys, ...) -> nothing changes', async () => {
  const s = stand0();
  assert.equal(await buendelErneuern(s, { schluessel: neuerSchluessel, erlaubt: nein }), false);
  assert.ok(s.unterwegs);
});
test('buendelErneuern: author removed by the key change -> stays as it is (still dropped by readers)', async () => {
  const s = stand0({ wechsel: { entfernt: ['p_a'], erneuert: [] } });
  assert.equal(await buendelErneuern(s, { schluessel: neuerSchluessel, erlaubt: ja }), false);
  assert.ok(s.unterwegs);
});
test('buendelErneuern: this device was removed by the key change -> stays as it is', async () => {
  const s = stand0({ wechsel: { geraete: ['d_x'] } });
  assert.equal(await buendelErneuern(s, { schluessel: neuerSchluessel, erlaubt: ja }), false);
  assert.ok(s.unterwegs);
});
test('buendelErneuern: bundle number within the stand of the change (readers accept it) -> not touched', async () => {
  const s = stand0({ nr: 4 });
  assert.equal(await buendelErneuern(s, { schluessel: neuerSchluessel, erlaubt: ja }), false);
  assert.ok(s.unterwegs);
});
test('buendelErneuern: no newer key version here, or an author who did not renew -> not touched', async () => {
  const s = stand0();
  assert.equal(await buendelErneuern(s, { schluessel: { aktuell: 1, keys: new Map() }, erlaubt: ja }), false);
  const t = stand0({ wechsel: { erneuert: ['p_other'] } });
  assert.equal(await buendelErneuern(t, { schluessel: neuerSchluessel, erlaubt: ja }), false);
  assert.ok(s.unterwegs && t.unterwegs);
});
