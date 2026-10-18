'use strict';
const vm = require('vm'), fs = require('fs'), assert = require('assert/strict');
const source = fs.readFileSync(process.argv[2], 'utf8');
function open(now, saved) {
  const ids = {}, intervals = [], store = new Map(saved || []);
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  function el() { return { style: {}, value: '', setAttribute(k, v) { this[k] = v; if (k === 'id') ids[v] = this; },
    appendChild() {}, addEventListener(k, f) { this[k] = f; } }; }
  const window = { __agGithubBruecke: { akteure: ['forge'], istLive: () => true },
    __agLauf: () => ({angenommen:true}), __agEreignis: () => ({angenommen:true}), addEventListener() {} };
  vm.runInNewContext(source, { window, URL, AbortController, Date: Clock, JSON, Math, Object, Array, String, Number, parseInt, isNaN,
    localStorage: { getItem:k=>store.get(k)||null, setItem:(k,v)=>store.set(k,v), removeItem:k=>store.delete(k) },
    setInterval:f=>intervals.push(f), setTimeout:()=>1, clearTimeout() {},
    document: {head:el(),body:el(),hidden:false,createElement:el,getElementById:i=>ids[i]||null,addEventListener(){}},
    fetch:async()=>({status:200,headers:{get:()=>null},json:async()=>[]}) });
  return { ids, store, stand:window.__agGithub.stand };
}
const day = s => Date.parse(s+'T12:00:00Z');
const KEY = 'agentarium.github.tokenExpiry';
const shown = s => s.ids.agGhWarnung.style.display !== 'none' ? (s.ids.agGhWarnung.textContent || '') : '';
(async () => {
  // Absent: no automatic default, nothing stored, only an unconfirmed suggestion in text.
  const initial = open(day('2026-10-17'));
  assert.equal(initial.ids.agGhAblauf.value, '');
  assert.equal(initial.stand().ablaufDatum, '');
  assert.equal(initial.stand().ablaufTage, null);
  assert.equal(initial.store.size, 0);
  assert.match(initial.ids.agGhAblaufText.textContent, /fehlt.*unbestätigt, nicht gespeichert.*15\.01\.2027/);
  assert.equal(shown(initial), '');
  // Reload while absent stays absent; invalid stored value is not replaced by a default.
  assert.equal(open(day('2026-10-18'), initial.store).store.size, 0);
  const junk = open(day('2026-10-17'), [[KEY, 'kaputt']]);
  assert.equal(junk.stand().ablaufDatum, ''); assert.equal(junk.store.get(KEY), 'kaputt');
  // Existing saved date (e.g. from v1.1) preserved unchanged.
  const saved = [[KEY, '2027-01-15']];
  const legacy = open(day('2026-10-17'), saved);
  assert.equal(legacy.ids.agGhAblauf.value, '2027-01-15');
  assert.equal(legacy.store.get(KEY), '2027-01-15');
  assert.equal(legacy.stand().ablaufTage, 90);
  assert.match(legacy.ids.agGhAblaufText.textContent, /noch 90 Tage$/);
  // Boundary, today, overdue, singular.
  for (const [now, n, warn, text] of [
    ['2027-01-04', 11, '', /noch 11 Tage$/],
    ['2027-01-05', 10, 'Token läuft in 10 Tagen ab — bitte erneuern', /noch 10 Tage$/],
    ['2027-01-14', 1, 'Token läuft in 1 Tag ab — bitte erneuern', /noch 1 Tag$/],
    ['2027-01-15', 0, 'Token läuft heute ab — bitte erneuern', /läuft heute ab$/],
    ['2027-01-16', -1, 'Token laut Datum seit 1 Tag abgelaufen — bitte erneuern', /seit 1 Tag abgelaufen$/],
    ['2027-01-17', -2, 'Token laut Datum seit 2 Tagen abgelaufen — bitte erneuern', /seit 2 Tagen abgelaufen$/]]) {
    const s = open(day(now), saved);
    assert.equal(s.stand().ablaufTage, n, now);
    assert.equal(shown(s), warn, now);
    assert.match(s.ids.agGhAblaufText.textContent, text, now);
    assert.doesNotMatch(s.ids.agGhStatus.textContent, /bitte erneuern/, now);
  }
  // A status error does not replace or shorten the separate warning.
  const err = open(day('2027-01-14'), saved);
  err.ids.agGhToken.value = 'x'; err.ids.agGhAn.click();
  assert.match(err.ids.agGhStatus.textContent, /Token-Format nicht erkannt/);
  assert.equal(shown(err), 'Token läuft in 1 Tag ab — bitte erneuern');
  // Edit persists; clear removes and stays missing after reopen.
  initial.ids.agGhAblauf.value = '2027-02-01'; initial.ids.agGhAblauf.change();
  assert.equal(initial.store.get(KEY), '2027-02-01');
  assert.equal(open(day('2026-10-18'), initial.store).ids.agGhAblauf.value, '2027-02-01');
  initial.ids.agGhAblauf.value = ''; initial.ids.agGhAblauf.change();
  assert.equal(initial.store.has(KEY), false);
  const reopened = open(day('2026-10-19'), initial.store);
  assert.equal(reopened.ids.agGhAblauf.value, ''); assert.equal(reopened.stand().ablaufTage, null);
  assert.equal(reopened.store.size, 0);
  // Token: RAM only, never in storage, state or panel text.
  const TOKEN = 'ghp_' + 'A'.repeat(36);
  const live = open(day('2026-10-17'), saved);
  live.ids.agGhToken.value = TOKEN; live.ids.agGhAn.click();
  for (let i = 0; i < 10; i++) await new Promise(r => setImmediate(r));
  assert.equal(live.stand().hatToken, true);
  assert.equal(live.ids.agGhToken.value, '');
  assert.deepEqual([...live.store.keys()], [KEY]);
  assert.equal([...live.store.values()].some(v => String(v).includes(TOKEN)), false);
  assert.equal(JSON.stringify(live.stand()).includes(TOKEN), false);
  assert.equal(Object.values(live.ids).some(e => String(e.textContent || '').includes(TOKEN)), false);
  console.log('PASS: no default/no auto-store, clear+reopen missing, saved date preserved, 11 vs 10, 1 Tag singular, today, overdue, separate warning, token RAM only.');
})().catch(e => { console.error(e); process.exit(1); });
