const fs = require('fs');
const vm = require('vm');
const src = fs.readFileSync('previews/AG-VISUAL-005-feld/activity-input.js', 'utf8');
let checks = 0;
function ok(name, value) {
  if (!value) { console.error('FAIL', name); process.exitCode = 1; }
  else { checks++; console.log('PASS', name); }
}
function element() {
  const attrs = {}, classes = new Set();
  return {
    attrs, classes, addCount: 0, offsetWidth: 1,
    getAttribute(k) { return Object.prototype.hasOwnProperty.call(attrs,k) ? attrs[k] : null; },
    setAttribute(k,v) { attrs[k]=String(v); },
    removeAttribute(k) { delete attrs[k]; },
    classList: {
      add(k) { classes.add(k); if (k === 'agAktImpuls') this.owner.addCount++; },
      remove(k) { classes.delete(k); }, owner: null
    }
  };
}
function env(opts={}) {
  const styles = {};
  const doc = {
    getElementById(id) { return styles[id] || null; },
    createElement(tag) { return {id:'',textContent:'',tag}; },
    head: {appendChild(e) { if (e.id) styles[e.id]=e; }}, documentElement: {appendChild(e) { if(e.id) styles[e.id]=e; }}
  };
  const perf = {now: () => opts.now == null ? 0 : opts.now};
  const win = {performance:perf};
  const context = {window:win, document:doc, performance:perf,
    location:{search:opts.search || '', protocol:'http:'}, console,
    setTimeout, clearTimeout, AbortController, Date, isFinite,
    fetch:opts.fetch || (() => Promise.reject(new Error('unexpected fetch')))};
  vm.createContext(context); vm.runInContext(src, context, {filename:'activity-input.js'});
  return {api:win.__agActivity, context};
}
function row(state, session, task, rest, evidence='e1') {
  return {agent:'forge',session_id:session,task_id:task,state,
    reason:'r-'+state,last_evidence_at:'2026-10-16T16:00:00Z',evidence_ref:evidence,
    remaining_valid_ms:rest,outcome:state==='stopped'?'success':null,diagnostics:[]};
}
function doc(rows) { return {mode:'LIVE',data_kind:'OBSERVED',rows,coverage:{status:'partial',note:'qa'},provenance:{source:'qa'}}; }

// Explicit opt-in and mode gate.
{
  const {api}=env();
  api.modus('live');
  ok('live alone is not active', api.state(0).aktiv === false);
  api.enable({poll:false});
  ok('explicit opt-in activates live', api.state(0).aktiv === true);
  api.modus('demo');
  ok('demo mode disables and clears', api.state(0).aktiv === false && api.state(0).zeilen === 0);
}

// Session/task separation, precedence, monotonic expiry, exact cost phrase.
{
  const {api}=env(); api.enable({poll:false}); api.modus('live');
  api.ingest(doc([row('stopped','s1','t1',null),row('working_observed','s2','t2',500),row('blocked','s3','t3',100)]),1000);
  let v=api.view(1099).forge;
  ok('three sessions/tasks retained', v.anzahl===3 && new Set(v.zeilen.map(x=>x.session+'|'+x.task)).size===3);
  ok('blocked precedence', v.state==='blocked');
  v=api.view(1100).forge;
  ok('remaining_valid_ms expires on performance time', v.state==='working_observed' && v.zeilen.some(x=>x.session==='s3'&&x.state==='unknown'&&x.expired));
  ok('exact incomplete cost phrase', api.state(1100).kosten==='Kosten nicht vollständig ermittelbar.');
}

// One pulse for one evidence token; a new token creates exactly one further pulse.
{
  const {api}=env(); api.enable({poll:false}); api.modus('live');
  const el=element(); el.classList.owner=el;
  api.ingest(doc([row('working_observed','s','t',500,'e1')]),1000);
  api.render(1001,[el],['Forge']); api.render(1050,[el],['Forge']);
  ok('one-shot pulse for unchanged evidence', el.addCount===1);
  api.ingest(doc([row('working_observed','s','t',500,'e1')]),1100); api.render(1101,[el],['Forge']);
  ok('same evidence not replayed', el.addCount===1);
  api.ingest(doc([row('working_observed','s','t',500,'e2')]),1200); api.render(1201,[el],['Forge']);
  ok('new evidence produces one new pulse', el.addCount===2);
  ok('activity marker attached only to name element', el.attrs['data-akt']==='working_observed');
  api.modus('archive');
  ok('mode cleanup restores marker state', !('data-akt' in el.attrs) && !el.classes.has('agAktImpuls') && api.state(1300).zeilen===0);
}

// Delayed fetch from an old generation must not repopulate after mode switch.
(async function () {
  let resolveFetch;
  const pending = new Promise(r => { resolveFetch=r; });
  const {api}=env({fetch:()=>pending});
  api.modus('live'); api.enable();
  ok('polling request activated', api.state(0).transport==='verbinde');
  api.modus('demo');
  resolveFetch({ok:true,json:()=>Promise.resolve(doc([row('working_observed','late','late',999,'late')]))});
  await Promise.resolve(); await Promise.resolve(); await new Promise(r=>setImmediate(r));
  ok('stale inflight response discarded', api.state(999).aktiv===false && api.state(999).zeilen===0 && api.state(999).transport==='aus');
  console.log('SUMMARY', checks, '/', 14);
  if (checks !== 14) process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
