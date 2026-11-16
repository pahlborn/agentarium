'use strict';
const assert=require('node:assert/strict');
const {prepare,consumer}=require('./native-journal.cjs');
const c=consumer(),b={project_id:'agentarium',run_id:'AG-GUARD-LOCAL-QA',task_id:'AG-GUARD-LOCAL-A1',parent_id:'AG-GUARD-LOCAL',role:'sentinel'};
let serial=0;
function event(kind,patch={}){
 const own=!['handoff','assigned'].includes(kind);
 return {schema:'agentarium.github-event.v1',id:'LOCAL-'+(++serial),project_id:b.project_id,run_id:b.run_id,task_id:b.task_id,parent_id:b.parent_id,actor:own?b.role:'atlas',reporter:own?b.role:'atlas',kind,title:'Synthetic local guard fixture',occurred_at:'2026-11-16T20:00:00Z',source_evidence:'reported_checkpoint',source_tool_id:'synthetic-local-test',...(['handoff','assigned'].includes(kind)?{recipient:b.role}:kind==='contribution'?{recipient:'atlas'}:{}),...patch};
}
let cid=900000;
function history(events){return events.map(e=>({id:++cid,created_at:'2026-11-16T20:00:01Z',user:{login:'pahlborn'},body:c.MARKER+'\n```json\n'+JSON.stringify(e)+'\n```'}));}
const dispatch=[event('handoff'),event('assigned')],h=history(dispatch);
let count=0;
function test(name,fn){fn();count++;console.log('PASS '+name);}
function reject(input,pattern){assert.throws(()=>prepare(input),pattern);}
const input=(phase,events,hist=h)=>({phase,binding:b,events,history:hist,note:'Synthetic local fixture; no real worker.'});
test('valid dispatch and required role instruction',()=>{const r=prepare(input('dispatch',dispatch,[]));assert.equal(r.comments.length,2);assert.match(r.instruction,/OWN started/);for(const args of r.comments){assert.deepEqual(Object.keys(args),['repo_full_name','pr_number','comment']);assert.equal(c.pruefen({body:args.comment,user:{login:'pahlborn'}}).art,'ok');}});
test('bad date rejects entire batch',()=>reject(input('dispatch',[dispatch[0],{...dispatch[1],occurred_at:'2026-11-16 13:52:24 UTC'}],[]),/occurred_at/));
test('unknown event field',()=>reject(input('start',[event('started',{extra:'forbidden'})]),/unbekannt|Feld|field/i));
test('note marker injection',()=>reject({...input('start',[event('started')]),note:c.MARKER},/Marker|marker/));
test('exact binding',()=>reject(input('start',[event('started',{parent_id:'OTHER'})]),/binding/));
test('own reporter',()=>reject(input('start',[event('started',{reporter:'atlas'})]),/actor and reporter/));
test('orphan start',()=>reject(input('start',[event('started')],[]),/assignment/));
test('invalid assignment cannot authorize start',()=>reject(input('start',[event('started')],history([{...dispatch[1],occurred_at:'2026-11-16 13:52:24 UTC'}])),/assignment/));
test('foreign login cannot authorize start',()=>reject(input('start',[event('started')],h.map(x=>({...x,user:{login:'other'}}))),/assignment/));
const start=event('started'),hs=h.concat(history([start]));
test('valid bound start preserves Unicode and quotes',()=>{const e={...start,title:'Prüfung „α“ "done"'};const r=prepare(input('start',[e]));const got=JSON.parse(r.comments[0].comment.match(/```json\s*([\s\S]*?)```/)[1]);assert.deepEqual(got,e);});
test('unpaired final rejected',()=>reject(input('final',[event('contribution')],hs),/order/));
const terminal=event('delivered'),contribution=event('contribution');
test('valid terminal then return',()=>assert.equal(prepare(input('final',[terminal,contribution],hs)).comments.length,2));
test('final times go backwards',()=>reject(input('final',[{...terminal,occurred_at:'2026-11-16T20:00:02Z'},contribution],hs),/backwards/));
const ht=hs.concat(history([terminal]));
test('new late start rejected',()=>reject(input('start',[event('started')],ht),/terminal/));
test('terminal POST succeeded and final return pending',()=>{const r=prepare(input('final',[terminal,contribution],ht));assert.equal(r.comments.length,1);assert.deepEqual(r.skipped,[terminal.id]);});
const hf=ht.concat(history([contribution]));
test('fully published final is idempotent',()=>assert.equal(prepare(input('final',[terminal,contribution],hf)).comments.length,0));
test('same id changed content rejected',()=>reject(input('final',[{...terminal,title:'different'},contribution],ht),/different content/));
test('existing attempt cannot be redispatched',()=>reject(input('dispatch',[event('handoff'),event('assigned')],h),/already used/));
test('Lot remains excluded',()=>reject({...input('start',[start]),binding:{...b,role:'lot'}},/outside/));
test('forged runtime evidence rejected',()=>reject(input('start',[event('started',{source_evidence:'runtime_stream'})]),/reported_checkpoint/));
test('unknown binding field rejected',()=>reject({...input('start',[start]),binding:{...b,attempt:'not-v1'}},/exact child binding/));
test('actual history metadata required',()=>reject(input('start',[start],[{...h[1],id:'not-a-GitHub-id'}]),/actual GitHub/));
test('missing start is an explicit gap while truthful final can return',()=>assert.equal(prepare(input('final',[event('delivered'),event('contribution')])).warnings.length,1));
test('partial final cannot finish another holder after transfer',()=>{const move=event('reassigned',{actor:'atlas',reporter:'atlas',recipient:'scout',previous_holder:'sentinel',checkpoint_ref:'https://github.com/pahlborn/agentarium/commit/'+'a'.repeat(40),stop_ref:'https://github.com/pahlborn/agentarium/issues/2#issuecomment-900001'});reject(input('final',[terminal,contribution],ht.concat(history([move]))),/elsewhere/);});
console.log(count+' guard checks passed; all fixtures local/synthetic.');
