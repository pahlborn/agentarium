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
const initial = open(day('2026-10-17'));
assert.equal(initial.ids.agGhAblauf.value, '2027-01-15');
assert.equal(initial.stand().ablaufTage, 90);
assert.equal(initial.store.size, 1);
assert.equal(initial.store.get('agentarium.github.tokenExpiry'), '2027-01-15');
for (const [now, expected, warn] of [['2027-01-04',11,false], ['2027-01-05',10,true], ['2027-01-15',0,true], ['2027-01-16',-1,true]]) {
  const s = open(day(now), initial.store);
  assert.equal(s.stand().ablaufTage, expected);
  assert.equal(/bitte erneuern/.test(s.ids.agGhStatus.textContent), warn);
}
initial.ids.agGhAblauf.value = '2027-02-01'; initial.ids.agGhAblauf.change();
assert.equal(initial.store.get('agentarium.github.tokenExpiry'), '2027-02-01');
assert.equal(open(day('2026-10-18'), initial.store).ids.agGhAblauf.value, '2027-02-01');
assert.equal(initial.stand().hatToken, false);
console.log('PASS: 90-day default, persisted date only, warning at 10 not 11 days, expiry day, overdue, editable date/reopen; no token stored.');
