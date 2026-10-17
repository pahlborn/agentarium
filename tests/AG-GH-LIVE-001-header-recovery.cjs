/* Sentinel QA04/QA06 synthetic adapter-only regression. No browser/live-transport claim.
 * Run: node sentinel-gh-live-regression.cjs /path/to/github-live.js
 * Adapter is executed unchanged in Node vm; DOM, clock, fetch and timers are fixtures.
 */
'use strict';
const vm = require('vm'), fs = require('fs'), assert = require('assert/strict');
const adapter = fs.readFileSync(process.argv[2], 'utf8');
const settle = () => new Promise(resolve => setImmediate(resolve));
function setup(respond) {
  const state = { now: Date.parse('2026-10-17T12:00:00Z'), ids: {}, timers: [], calls: [], shown: [] };
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [state.now])); } static now() { return state.now; } }
  function el() { return { style: {}, setAttribute(k,v) { this[k]=v; if(k==='id')state.ids[v]=this; }, appendChild() {}, addEventListener(k,f) { this[k]=f; } }; }
  const window = { __agGithubBruecke: { akteure: ['forge'], istLive: () => true },
    __agLauf: () => ({ angenommen: true }), __agEreignis(e) { state.shown.push(e.id); return { angenommen: true }; }, addEventListener() {} };
  const c = { window, URL, AbortController, Date: Clock, JSON, Math, Object, Array, String, Number, parseInt, isNaN,
    setTimeout(f,ms) { const t={ f,ms }; state.timers.push(t); return t; }, clearTimeout(t) { state.timers=state.timers.filter(x=>x!==t); },
    document: { head:el(),body:el(),hidden:false,createElement:el,getElementById(i) { return state.ids[i]||null; },addEventListener() {} },
    fetch:async(url) => { state.calls.push(url); return respond(url,state); } };
  vm.runInNewContext(adapter,c);
  state.connect = async() => { state.ids.agGhToken.value='ghp_SYNTHETIC0fake0token0for0tests0only00'; state.ids.agGhAn.click(); await settle(); };
  state.stand = () => window.__agGithub.stand();
  return state;
}
function response(status,headers={},items=[]) { return { status,headers:{get(k) { return headers[k.toLowerCase()]||null; }},json:async()=>items }; }
async function timing(name,status,headers,expected) {
  const s=setup(()=>response(status,headers)); await s.connect();
  const actual=s.timers.at(-1).ms;
  assert.equal(actual,expected,name);
  console.log(JSON.stringify({test:name,status:'passed',expectedMs:expected,actualMs:actual}));
}
async function recovery() {
  const event={schema:'agentarium.github-event.v1',id:'ARRIVAL-1',project_id:'agentarium',run_id:'RUN-1',task_id:'TASK-1',actor:'forge',kind:'progress',title:'Arrived during initial baseline',occurred_at:'2026-10-17T12:00:01Z',source_evidence:'runtime_stream',source_tool_id:'TOOL-1'};
  const page1=[{id:1,user:{login:'github-actions[bot]'},created_at:'2026-10-17T12:00:01Z',body:'<!-- AGENTARIUM_EVENT_V1 -->\n```json\n'+JSON.stringify(event)+'\n```'}];
  for(let i=2;i<=100;i++)page1.push({id:i,body:'old prose'});
  const s=setup((url,s)=>response(s.calls.length===2?500:200,{},url.includes('page=2')?[]:page1));
  await s.connect(); assert.equal(s.calls.length,2); assert.equal(s.shown.length,0);
  const initial=s.stand().schnitt; s.now+=10000;s.timers.pop().f();await settle();
  const result=s.stand();
  assert.equal(result.schnitt,initial);assert.equal(result.verbunden,true);assert.deepEqual(s.shown,['ARRIVAL-1']);
  assert.equal(result.zahl.basisMarkiert,0);assert.equal(result.zahl.waehrendAufbau,1);
  console.log(JSON.stringify({test:'bootstrap-error-recovery',status:'passed',initialCutoff:initial,finalCutoff:result.schnitt,shown:s.shown,requests:s.calls.length}));
}
(async()=>{
  await timing('X-Poll-Interval 600s',200,{'x-poll-interval':'600'},600000);
  await timing('Retry-After 7200s',429,{'retry-after':'7200'},7200000);
  await timing('Retry-After HTTP-date +120s',429,{'retry-after':'Sat, 17 Oct 2026 12:02:00 GMT'},120000);
  await recovery();
  console.log('4/4 passed — synthetic adapter behavior only');
})().catch(e=>{console.error(e);process.exitCode=1;});
