'use strict';
// Independent synthetic CLI checks; no publication or source modifications.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process'),crypto=require('node:crypto');
const root=__dirname,gate=path.join(root,'.github/scripts/native-journal.cjs'),{consumer}=require(gate),c=consumer(root);
const binding={project_id:'agentarium',run_id:'AG-SENTINEL-FINAL-SYNTHETIC',task_id:'AG-SENTINEL-FINAL-SYNTHETIC-A1',parent_id:'AG-SENTINEL-FINAL-SYNTHETIC',role:'sentinel'};
const T=['2026-11-16T20:00:00Z','2026-11-16T20:00:01Z','2026-11-16T20:00:02Z','2026-11-16T20:00:03Z'];
let eid=0,cid=980000000000;const records=[];
function event(kind,patch={}){const dispatch=['handoff','assigned'].includes(kind),actor=dispatch?'atlas':'sentinel';return{schema:'agentarium.github-event.v1',id:'SYNTHETIC-INDEPENDENT-'+(++eid),project_id:binding.project_id,run_id:binding.run_id,task_id:binding.task_id,parent_id:binding.parent_id,actor,reporter:actor,kind,title:'Synthetic independent QA — no real task',occurred_at:kind==='started'?T[1]:['delivered','aborted'].includes(kind)?T[2]:kind==='contribution'?T[3]:T[0],source_evidence:'reported_checkpoint',source_tool_id:'sentinel.local.qa',...(dispatch?{recipient:'sentinel'}:kind==='contribution'?{recipient:'atlas'}:{}),...patch};}
function hist(es){return es.map(e=>({id:++cid,created_at:'2026-11-16T20:00:30Z',user:{login:'pahlborn'},body:'<!-- AGENTARIUM_EVENT_V1 -->\n```json\n'+JSON.stringify(e,null,2)+'\n```\nSynthetic history.'}));}
const d=[event('handoff'),event('assigned')],s=event('started'),h=hist(d),hs=h.concat(hist([s])),end=event('delivered'),ret=event('contribution');
function input(phase,events,history=h){return{phase,binding,events,history,note:'Synthetic independent CLI test. Not a real worker.'};}
function cli(name,inp,accept,verify=()=>{}){const file=path.join(root,'sentinel-causal-case-'+name+'.json');fs.writeFileSync(file,JSON.stringify(inp,null,2));const p=spawnSync(process.execPath,[gate,file],{encoding:'utf8',timeout:8000});const record={name,expected_accept:accept,status:p.status,stdout:p.stdout,stderr:p.stderr};try{if(accept){assert.equal(p.status,0);const out=JSON.parse(p.stdout);for(const a of out.comments){assert.deepEqual(Object.keys(a).sort(),['comment','pr_number','repo_full_name']);assert.equal(a.repo_full_name,'pahlborn/agentarium');assert.equal(a.pr_number,2);assert.equal(c.pruefen({body:a.comment,user:{login:'pahlborn'}}).art,'ok');}verify(out);record.result='passed';}else{assert.notEqual(p.status,0);assert.equal(p.stdout,'');record.result='passed';}}catch(e){record.result='failed';record.failure=e.message;}records.push(record);console.log(name+': '+record.result+'; exit='+p.status+' stdout_bytes='+Buffer.byteLength(p.stdout));return record;}
cli('real-shaped-dispatch',input('dispatch',d,[]),true,out=>{assert.equal(out.comments.length,2);const b=JSON.parse(out.instruction.match(/Binding: (\{.*?\})\./)[1]);assert.deepEqual(b,binding);for(const text of ['OWN started','delivered','aborted','contribution to atlas','progress','Do not publish GitHub','Atlas alone validates'])assert(out.instruction.includes(text),text);});
cli('real-shaped-own-start',input('start',[s]),true,out=>{assert.deepEqual(JSON.parse(out.comments[0].comment.match(/```json\n([\s\S]*?)\n```/)[1]),s);});
cli('real-shaped-final',input('final',[end,ret],hs),true,out=>{assert.equal(out.comments.length,2);assert.deepEqual(out.comments.map(x=>JSON.parse(x.comment.match(/```json\n([\s\S]*?)\n```/)[1]).kind),['delivered','contribution']);});
cli('bad-second-event-no-partial-stdout',input('final',[end,{...ret,unknown_field:'must reject'}],hs),false);
cli('bad-second-event-binding-no-partial-stdout',input('final',[end,{...ret,parent_id:'DIFFERENT-PARENT'}],hs),false);
cli('malformed-second-date-no-partial-stdout',input('final',[end,{...ret,occurred_at:'2026-11-16 13:52:24 UTC'}],hs),false);
cli('marker-injection-with-valid-pair',{...input('final',[end,ret],hs),note:'<!-- AGENTARIUM_EVENT_V1 -->\n```json\n{}\n```'},false);
const aborted=event('aborted'),abortedReturn=event('contribution');
cli('actual-shaped-aborted-final',input('final',[aborted,abortedReturn],hs),true,out=>{assert.equal(out.comments.length,2);const es=hs.concat(hist([aborted,abortedReturn])).map(x=>({ev:c.pruefen(x).ev,kommentar:x.id,recorded_at:x.created_at}));assert.equal(c.faltenZuZustand(es.filter(x=>c.LEBEN[x.ev.kind])).length,0);assert.equal(c.baelleFalten(es).length,0);});
const ht=hs.concat(hist([end]));
cli('partial-success-retry-exact-remaining',input('final',[end,ret],ht),true,out=>{assert.equal(out.comments.length,1);assert.deepEqual(out.skipped,[end.id]);assert.deepEqual(JSON.parse(out.comments[0].comment.match(/```json\n([\s\S]*?)\n```/)[1]),ret);});
cli('both-posted-idempotent-no-comments',input('final',[end,ret],ht.concat(hist([ret]))),true,out=>assert.equal(out.comments.length,0));
cli('retry-id-content-conflict',input('final',[{...end,title:'changed status claim'},ret],ht),false);
cli('late-new-start-after-aborted',input('start',[event('started')],hs.concat(hist([aborted]))),false);
const transfer=event('reassigned',{actor:'atlas',reporter:'atlas',recipient:'scout',previous_holder:'sentinel',stop_ref:'https://github.com/pahlborn/agentarium/issues/2#issuecomment-980000000000',checkpoint_ref:'no-checkpoint',occurred_at:T[3]});
cli('final-after-terminal-and-holder-transfer',input('final',[end,ret],ht.concat(hist([transfer]))),false);
cli('foreign-role-completion',input('final',[{...end,actor:'argus',reporter:'argus'},ret],hs),false);
cli('fabricated-runtime',input('final',[{...end,source_evidence:'runtime_stream'},ret],hs),false);
cli('wrong-published-parent',input('start',[s],hist(d.map(e=>({...e,parent_id:'OTHER-PARENT'})))),false);
// Causal-order adversarial probes: ISO syntax alone must not make impossible order valid.
cli('start-before-assignment',input('start',[{...s,id:'SYNTHETIC-OLD-START',occurred_at:'2026-11-16T19:59:00Z'}]),false);
cli('final-before-assignment-without-start',input('final',[{...end,id:'SYNTHETIC-OLD-END',occurred_at:'2026-11-16T19:59:00Z'},ret]),false);
const report={task:'AG-NATIVE-PUBLISH-GUARD-20261116-QA-A3',head:'d9a64603229a674cddb51979b6f69d4fd843efcc',synthetic:true,records};fs.writeFileSync(path.join(root,'sentinel-causal-report.json'),JSON.stringify(report,null,2));process.exit(records.some(x=>x.result!=='passed')?1:0);
