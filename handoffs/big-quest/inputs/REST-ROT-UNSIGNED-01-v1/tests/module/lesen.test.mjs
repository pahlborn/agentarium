// Modul lesen ohne Browser (S12, Aufgabe 3b-2a; US7.2): der Testbau liest die abzugleichenden Werte aus Ereignissen.
// Zwischenstand je Protokoll: fortschreiben statt alles neu rechnen - immer gleich dem vollen derive; nach einem Abgleich
// (neuLaden) einmal neu. Dazu: welche Schluessel aus Ereignissen kommen (gegen werkzeug/speicherstellen.json), der alte
// Speicher als fester Ausgangsstand, "abgelaufen" aus dem Enddatum, Messwert bei 5 000 Ereignissen.
// Die App selbst (Weiche in store, Bedienwege) pruefen tests/testbau-lesen.test.mjs und tests/ableitung-vergleich.test.mjs.
//   node --test tests/module/lesen.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { performance } from 'node:perf_hooks';
import { newEvent } from '../../src/module/ereignisse.mjs';
import { derive } from '../../src/module/ableitung.mjs';
import { evSchreiber } from '../../src/module/schreiber.mjs';
import { lesenArt, altStand, evProtokoll, grantsAblauf, LESEN_KIND, LESEN_KIND_PRAEFIX, LESEN_PERSON, LESEN_ANFANG } from '../../src/module/lesen.mjs';

/* ---------- helpers ---------- */
function seeded(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const T0 = Date.parse('2026-11-04T07:00:00Z');
const dayOf = (ms) => new Date(ms).toISOString().slice(0, 10);
const SKILLS = ['round', 'numbers', 'units', 'graphs', 'words'];
/* a random event of the child's log at time ms (all kinds the app writes; payloads as in index.html) */
function zufallsEreignis(next, ms, ctx) {
  const pick = (a) => a[Math.floor(next() * a.length)], day = dayOf(ms), r = next();
  const skill = pick(SKILLS);
  let type, payload;
  if (r < 0.35) { type = 'answer'; payload = { day, skill, level: 1 + Math.floor(next() * 3), attempt: 1 + Math.floor(next() * 2), ok: next() < 0.7, qid: 'q' + Math.floor(next() * 40), help: next() < 0.2 }; }
  else if (r < 0.45) { type = 'review'; const box = Math.floor(next() * 4); payload = box === 0 ? { day, qid: 'q' + Math.floor(next() * 40), box: 0, question: { world: skill, kind: 'type', prompt: 'p', answer: '1' } } : { day, qid: 'q' + Math.floor(next() * 40), box }; }
  else if (r < 0.52) { type = 'round_done'; payload = { day, skill, stars: Math.floor(next() * 9), count: 8 }; }
  else if (r < 0.58) { type = 'badge'; payload = next() < 0.3 ? { day, badge: 'inquirer', skill } : { day, badge: pick(['thinker', 'riskTaker', 'balanced']) }; }
  else if (r < 0.61) { type = 'rank_seen'; payload = { rank: pick(['Explorer', 'Investigator', 'Scientist']) }; }
  else if (r < 0.64) { type = 'sheet_created'; ctx.sheet = (ctx.sheet || 0) + 1; payload = { sheet: 's' + ctx.sheet, day, no: ctx.sheet, writing: 'en', items: [{ q: { world: skill, kind: 'type', prompt: 'p', answer: '1' } }, { q: { world: skill, kind: 'type', prompt: 'p2', answer: '2', level: 3 } }] }; }
  else if (r < 0.68 && ctx.sheet) { type = 'sheet_result'; payload = { sheet: 's' + (1 + Math.floor(next() * ctx.sheet)), index: Math.floor(next() * 2), res: pick(['ok', 'no', 'help']), day, qid: 'x' }; }
  else if (r < 0.72) { type = 'profile_set'; payload = pick([{ field: 'name', value: pick(['Kathie', 'K', null]) }, { field: 'emoji', value: pick(['🦊', '🐼']) }, { field: 'kidLang', value: pick(['de', 'en']) }, { field: 'muted', value: next() < 0.5 }]); }
  else if (r < 0.76) { type = 'setting_set'; payload = pick([{ setting: 'focusMode', value: pick(['manual', 'auto']) }, { setting: 'storyCap', value: Math.floor(next() * 4) }]); }
  else if (r < 0.80) { type = 'list_set'; payload = { list: pick(['unlocked', 'focusManual']), item: pick(SKILLS), on: next() < 0.6 }; }
  else if (r < 0.83) { type = 'checklist_set'; payload = { studio: pick(['read', 'write']), index: Math.floor(next() * 5), value: next() < 0.5, size: 5 }; }
  else if (r < 0.86) { type = 'day_flag'; payload = { flag: pick(['greetDay', 'mysteryDone', 'bdayParty']), day }; }
  else if (r < 0.89) { type = 'gap_state'; payload = { standard: pick(['M1', 'M2']), state: pick(['closed', 'hold', 'open']), by: 'parents', schoolDay: '2026-10-20', day }; }
  else if (r < 0.91) { type = 'advent_open'; payload = { year: 2026, door: 1 + Math.floor(next() * 24) }; }
  else if (r < 0.94) { type = 'joke_seen'; payload = { joke: 'j' + Math.floor(next() * 30) }; }
  else if (r < 0.96) { type = 'story_read'; payload = { story: 's' + Math.floor(next() * 10) }; }
  else if (r < 0.98) { type = 'grant_set'; ctx.grant = (ctx.grant || 0) + 1; payload = { grant: 'g' + ctx.grant, grantee: 'p_l1', scope: ['learning'], from: day, until: day }; }
  else { type = 'backup_made'; payload = { day }; }
  return newEvent({ type, author: 'p_k1', device: 'd_A1', at: new Date(ms).toISOString(), payload }, { rand: (n) => Uint8Array.from({ length: n }, () => Math.floor(next() * 256)) });
}
/* a log in a fake storage: counts how often the whole list is read and written */
function ablage(start = []) {
  const a = { liste: start, gelesen: 0, gespeichert: 0, uhr: T0 + 365 * 864e5, alt: null };
  a.p = evProtokoll({ laden: () => { a.gelesen++; return a.liste; }, speichern: (l) => { a.gespeichert++; a.liste = l; }, basis: () => a.alt, now: () => a.uhr });
  return a;
}
const voll = (a) => derive(a.liste, a.alt ? { now: a.uhr, base: { upTo: LESEN_ANFANG, state: a.alt } } : { now: a.uhr });

/* ---------- which keys ---------- */
test('Weiche: genau die abzugleichenden Schluessel aus speicherstellen.json kommen aus Ereignissen - Kind, Person, sonst der alte Speicher', () => {
  const verz = JSON.parse(fs.readFileSync(new URL('../../werkzeug/speicherstellen.json', import.meta.url), 'utf8')).localStorage;
  const name = (e) => (e.praefix ? e.key + '2026' : e.key);
  for (const e of verz) {
    const soll = e.abgleich === 'lokal' || ['events', 'personEvents'].includes(e.key) ? null : e.bereich === 'person' || e.key === 'muted' ? 'person' : 'kind';
    assert.equal(lesenArt(name(e)), soll, e.key + ' (' + e.bereich + ', ' + e.abgleich + ')');
  }
  for (const k of [...LESEN_KIND, ...LESEN_PERSON]) assert.ok(verz.some((e) => e.key === k), 'im Verzeichnis: ' + k);
  for (const p of LESEN_KIND_PRAEFIX) assert.ok(verz.some((e) => e.key === p && e.praefix), 'Praefix im Verzeichnis: ' + p);
  assert.equal(lesenArt('best_'), null, 'nur ein Praefix ist kein Schluessel');
  assert.equal(lesenArt('treeStage'), null, 'treeStage: Geraetenotiz (Hinweis "Baum gewachsen" einmal je Geraet)');
  for (const k of ['session', 'evDevice', 'dayOffset', 'bridgeNext', 'focus', 'vorRueckspielen', 'kidsHere', '__proto__']) assert.equal(lesenArt(k), null, k);
});

/* ---------- carry forward ---------- */
test('Zwischenstand: 600 neue Ereignisse nacheinander - nach jedem gleich dem vollen derive; die Liste wird nur einmal gelesen', () => {
  const next = seeded(7), a = ablage(), ctx = {};
  let ms = T0;
  for (let i = 0; i < 600; i++) {
    ms += 1 + Math.floor(next() * 3 * 3600e3);
    const e = zufallsEreignis(next, ms, ctx);
    if (i === 0) a.p.stand();                                            // a state exists before the first event
    a.p.schreiben(a.p.liste().concat([e]));
    if (i % 25 === 0 || i > 590) assert.deepEqual(a.p.stand(), voll(a), 'nach Ereignis ' + (i + 1) + ' (' + e.type + ')');
  }
  assert.equal(a.gelesen, 1, 'die Liste wird einmal aus dem Speicher gelesen');
  assert.equal(a.gespeichert, 600);
  assert.equal(a.p.zaehler.voll, 1, 'nur einmal ganz gerechnet');
  assert.equal(a.p.zaehler.weiter, 600);
  assert.ok(a.p.stand().attempts.length > 100 && a.p.stand().total > 0 && Object.keys(a.p.stand().ev).length >= 3, 'echter Verlauf');
});

test('Zwischenstand: was nicht einfach "spaeter" ist (fruehere Zeit, ersetzte Liste, mehrere auf einmal), wird beim Lesen ganz neu gerechnet', () => {
  const next = seeded(11), ctx = {}, a = ablage();
  const l = []; let ms = T0;
  for (let i = 0; i < 50; i++) { ms += 60e3; l.push(zufallsEreignis(next, ms, ctx)); }
  for (const e of l.slice(0, 40)) a.p.schreiben(a.p.liste().concat([e]));
  a.p.stand();
  const frueh = zufallsEreignis(next, T0 + 30, ctx);                     // earlier than the last one (another device, late)
  a.p.schreiben(a.p.liste().concat([frueh]));
  assert.equal(a.p.zaehler.weiter, 0);
  assert.deepEqual(a.p.stand(), voll(a)); assert.equal(a.p.zaehler.voll, 2);
  a.p.schreiben(a.p.liste().concat(l.slice(40, 45)));                    // several at once
  assert.deepEqual(a.p.stand(), voll(a)); assert.equal(a.p.zaehler.voll, 3);
  a.p.schreiben(l.slice(0, 10));                                         // a replaced list
  assert.deepEqual(a.p.stand(), voll(a)); assert.equal(a.p.zaehler.voll, 4);
  const gleicheZeit = Object.assign({}, l[45], { at: a.p.liste()[9].at, id: l[45].id });   // same time as the last one: not "later"
  a.p.schreiben(a.p.liste().concat([gleicheZeit]));
  assert.deepEqual(a.p.stand(), voll(a)); assert.equal(a.p.zaehler.voll, 5);
  assert.equal(a.p.zaehler.weiter, 0);
});

test('Abgleich: neue Ereignisse eines anderen Geraets im Speicher - erst neuLaden liest sie, einmal; danach geht es weiter fort', () => {
  const next = seeded(3), ctx = {}, a = ablage();
  let ms = T0;
  for (let i = 0; i < 30; i++) { ms += 60e3; a.p.schreiben(a.p.liste().concat([zufallsEreignis(next, ms, ctx)])); }
  const vorher = a.p.stand();
  const fremd = []; for (let i = 0; i < 20; i++) fremd.push(zufallsEreignis(next, T0 + 30e3 + i * 60e3, ctx));   // between our own ones
  for (const e of fremd) e.device = 'd_B2';
  a.liste = a.liste.concat(fremd);                                       // the sync wrote them into the storage
  assert.deepEqual(a.p.stand(), vorher, 'ohne neuLaden: der alte Zwischenstand (deshalb ruft die App neuLaden nach dem Abgleich)');
  a.p.neuLaden();
  assert.deepEqual(a.p.stand(), voll(a), 'nach neuLaden: alles, eigene und fremde Ereignisse');
  assert.equal(a.gelesen, 2); assert.equal(a.p.zaehler.voll, 2);
  ms += 60e3; a.p.schreiben(a.p.liste().concat([zufallsEreignis(next, ms, ctx)]));
  assert.deepEqual(a.p.stand(), voll(a)); assert.equal(a.p.zaehler.voll, 2, 'danach wieder fortgeschrieben');
});

test('wert(): da/nicht da wie ein gespeicherter Schluessel; die Liste aus dem Speicher wird nie veraendert', () => {
  const a = ablage(), next = seeded(5), ctx = {};
  assert.deepEqual(a.p.wert('name'), { da: false });
  assert.deepEqual(a.p.wert('attempts'), { da: true, wert: [] });
  const e = newEvent({ type: 'profile_set', author: 'p_k1', device: 'd_A1', at: new Date(T0).toISOString(), payload: { field: 'name', value: 'Kathie' } });
  const start = a.p.liste(); a.p.schreiben(start.concat([e]));
  assert.deepEqual(a.p.wert('name'), { da: true, wert: 'Kathie' });
  assert.equal(start.length, 0, 'die alte Liste bleibt, wie sie war');
  void next; void ctx;
});

/* ---------- old values as base ---------- */
test('Alter Speicher als fester Ausgangsstand: alte Werte + neue Ereignisse; Uebungstage wie die App (Baum waechst weiter)', () => {
  const alt = { attempts: [{ day: '2026-10-01', skill: 'round', level: 2, attempt: 1, ok: true, qid: 'a' }], ev: { round: [['2026-10-01', 2, 1], ['2026-10-02', 2, 1]] }, total: 12, best_round: 6, name: 'Kathie',
    sheets: [{ id: 's0', day: '2026-10-03', no: 1, items: [{ q: { world: 'round' }, res: 'ok' }] }, { id: 's00', day: '2026-10-09', no: 2, items: [{ q: { world: 'round' } }] }], unlocked: ['units'], treeStage: 2, session: { user: 'x' }, events: [1] };
  const st = altStand(alt);
  assert.deepEqual(st._days, ['2026-10-01', '2026-10-02', '2026-10-03'], 'Tage aus ev und eingetragenen Blaettern');
  assert.equal('treeStage' in st || 'session' in st || 'events' in st, false, 'nur Werte aus Ereignissen');
  assert.equal(altStand({ session: 1, treeStage: 3 }), null, 'nichts Altes: kein Ausgangsstand');
  const a = ablage(); a.alt = st;
  const ev = (type, payload, min) => newEvent({ type, author: 'p_k1', device: 'd_A1', at: new Date(T0 + min * 60e3).toISOString(), payload });
  a.p.stand();
  a.p.schreiben(a.p.liste().concat([ev('answer', { day: '2026-11-04', skill: 'round', level: 2, attempt: 1, ok: true, qid: 'b' }, 1)]));
  a.p.schreiben(a.p.liste().concat([ev('round_done', { day: '2026-11-04', skill: 'round', stars: 8, count: 8 }, 2)]));
  a.p.schreiben(a.p.liste().concat([ev('list_set', { list: 'unlocked', item: 'graphs', on: true }, 3)]));
  a.p.schreiben(a.p.liste().concat([ev('profile_set', { field: 'name', value: null }, 4)]));
  const s = a.p.stand();
  assert.deepEqual(s, voll(a));
  assert.equal(s.attempts.length, 2); assert.equal(s.total, 20); assert.equal(s.best_round, 8);
  assert.deepEqual(s.ev.round.length, 3); assert.deepEqual(s.unlocked, ['units', 'graphs']); assert.equal('name' in s, false, 'geloescht');
  assert.equal(s.treeStage, 2, '4 Uebungstage -> Stufe 2 (ab 3 Tagen; der Baum waechst von den alten Tagen aus weiter)');
  assert.deepEqual(alt.unlocked, ['units'], 'der alte Wert wird nicht veraendert');
});

/* ---------- grants ---------- */
test('Freigaben: "abgelaufen" folgt aus dem Enddatum - einmal, am ersten Tag danach, in Zeitfolge im Protokoll; beendete laufen nicht ab', () => {
  const st = {
    grants: [{ id: 'g1', grantee: 'p_l1', scope: ['learning'], from: '2026-10-01', until: '2026-10-10', by: 'p_e1' },
      { id: 'g2', grantee: 'p_l2', scope: ['learning'], from: '2026-10-01', until: '2026-10-05', by: 'p_e1', revokedAt: '2026-10-03T09:00:00.000Z' },
      { id: 'g3', grantee: 'p_l1', scope: ['learning', 'school'], from: '2026-10-20', until: '2026-11-04', by: 'p_e1' }],
    grantlog: [{ at: '2026-10-01T08:00:00.000Z', ev: 'erteilt', grant: 'g1' }, { at: '2026-10-03T09:00:00.000Z', ev: 'widerrufen', grant: 'g2' }, { at: '2026-10-20T08:00:00.000Z', ev: 'erteilt', grant: 'g3' }]
  };
  const r = grantsAblauf(st, '2026-11-04');
  assert.deepEqual(r.grants.map((g) => !!g.expiredLogged), [true, false, false], 'g3 laeuft heute noch (bis einschliesslich until)');
  assert.deepEqual(r.grantlog.map((e) => e.ev + ':' + e.grant), ['erteilt:g1', 'widerrufen:g2', 'abgelaufen:g1', 'erteilt:g3']);
  assert.deepEqual(r.grantlog[2], { at: '2026-10-11T00:00:00.000Z', ev: 'abgelaufen', grant: 'g1', grantee: 'p_l1', scope: ['learning'] });
  assert.equal(grantsAblauf(st, '2026-11-05').grantlog.filter((e) => e.ev === 'abgelaufen').length, 2);
  assert.equal(st.grants[0].expiredLogged, undefined, 'der Stand selbst bleibt unveraendert (die App liest jedes Mal neu)');
  assert.deepEqual(grantsAblauf({}, '2026-11-04'), { grants: [], grantlog: [] });
});

/* ---------- measurement ---------- */
test('Messwert: 5 000 Ereignisse - ein neues Ereignis fortschreiben dauert Millisekunden, nicht ein ganzes Durchrechnen', (t) => {
  const next = seeded(42), ctx = {}, l = []; let ms = T0;
  for (let i = 0; i < 5000; i++) { ms += 1 + Math.floor(next() * 600e3); l.push(zufallsEreignis(next, ms, ctx)); }
  const a = ablage(l);
  let t0 = performance.now(); a.p.stand(); const ganz = performance.now() - t0;
  // the app's way: the writer appends (reads the cached list, stores the whole list as JSON), then the app reads values
  const speicher = new Map();
  const p = evProtokoll({ laden: () => l, speichern: (x) => speicher.set('events', JSON.stringify(x)), now: () => a.uhr });
  p.stand();
  const w = evSchreiber({ read: () => p.liste(), write: (x) => p.schreiben(x), device: 'd_A1', who: () => ({ person: 'p_k1', role: 'child' }), now: () => ms });
  const zeiten = [];
  for (let i = 0; i < 40; i++) {
    ms += 1000; t0 = performance.now();
    w.write('answer', { day: dayOf(ms), skill: 'round', level: 2, attempt: 1, ok: true, qid: 'm' + i });
    w.write('review', { day: dayOf(ms), qid: 'm' + i, box: 3 });
    for (const k of ['attempts', 'ev', 'due', 'total', 'badges']) p.wert(k);
    zeiten.push(performance.now() - t0);
  }
  zeiten.sort((x, y) => x - y);
  const median = zeiten[20], max = zeiten[39];
  t.diagnostic(`5000 Ereignisse: ganz durchrechnen ${ganz.toFixed(0)} ms; eine Antwort (2 Ereignisse schreiben + 5 Werte lesen) Median ${median.toFixed(1)} ms, hoechstens ${max.toFixed(1)} ms`);
  assert.equal(p.zaehler.voll, 1); assert.equal(p.zaehler.weiter, 80);
  assert.deepEqual(p.stand(), derive(p.liste(), { now: a.uhr }));
  assert.ok(median < 50, 'eine Antwort bleibt fluessig: ' + median.toFixed(1) + ' ms');
});

test('Reinheit: kein Netz, kein Speicher, keine Uhr, kein Zufall; Importe nur aus Modulen; Hilfsnamen mit le/LE', () => {
  const src = fs.readFileSync(new URL('../../src/module/lesen.mjs', import.meta.url), 'utf8');
  for (const w of ['fetch(', 'XMLHttpRequest', 'localStorage', 'indexedDB', 'Math.random', 'Date.now', 'new Date()', 'setTimeout', 'document.', 'window.']) assert.equal(src.includes(w), false, w);
  assert.deepEqual([...src.matchAll(/^import .* from '(.+)';$/gm)].map((m) => m[1]), ['./ableitung.mjs', './ereignisse.mjs']);
  for (const m of src.matchAll(/^(?:export\s+)?(?:async\s+)?(?:function\s+([\w$]+)|(?:const|let|class)\s+([\w$]+))/gm)) {
    const name = m[1] || m[2];
    assert.ok(m[0].startsWith('export') || /^(le|LE)/.test(name), name);
  }
  const liste = JSON.parse(fs.readFileSync(new URL('../../src/module/module.json', import.meta.url), 'utf8')).module;
  const ich = liste.find((x) => x.name === 'lesen');
  assert.equal(ich.bau, 'test', 'nur im Testbau');
  assert.ok(liste.indexOf(ich) > liste.findIndex((x) => x.name === 'ableitung'), 'nach ableitung');
});
