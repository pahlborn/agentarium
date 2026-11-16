#!/usr/bin/env node
'use strict';
// Native producer preflight. No network, tokens, or invented role observations.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const NATIVE=new Set(['atlas','nova','scout','argus','sentinel']);
const REPO='pahlborn/agentarium';
function fail(message){throw new Error(message);}
function object(value,label){if(!value||typeof value!=='object'||Array.isArray(value))fail(label+' must be an object');}
function canonical(v){if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';return JSON.stringify(v);}
function slice(source,first,last){const a=source.indexOf(first),b=source.indexOf(last,a+first.length);if(a<0||b<=a||source.indexOf(first,a+first.length)>=0)fail('consumer extraction changed: '+first);return source.slice(a,b);}
function consumer(root=path.resolve(__dirname,'../..')){
 const source=fs.readFileSync(path.join(root,'pilot/github-live/github-live.js'),'utf8');
 const html=fs.readFileSync(path.join(root,'pilot/github-live/index.html'),'utf8');
 const roles=html.match(/var AGENTEN = (\[[^\n]+\]);/);
 if(!roles)fail('consumer role source changed');
 const actors=JSON.parse(roles[1]).map(a=>a.name).concat('springer');
 const c={KANN_KOMM:true,KANN_LEBEN:true,AKTEURE:Object.fromEntries(actors.map(a=>[a,1])),
  window:{__agWorkStatus:require(path.join(root,'pilot/github-live/work-status.js'))},
  basisGrenzen:{fremdaussagen:0,selbstannahmen:0,konflikte:0}};
 vm.createContext(c);
 vm.runInContext(slice(source,'  var ADAPTER','  var B =')+
  slice(source,'  function nein(','  /* ============ AG-LAUFZEIT-001 TEIL 3')+
  slice(source,'  function baelleFalten(','  async function aufbau('),c,{timeout:1000});
 return c;
}
function prepare(input,options={}){
 object(input,'input');
 for(const k of Object.keys(input))if(!['phase','binding','events','history','note'].includes(k))fail('unknown input field '+k);
 const c=consumer(options.root),b=input.binding,events=input.events,history=input.history;
 object(b,'binding');
 if(Object.keys(b).sort().join(',')!==['parent_id','project_id','role','run_id','task_id'].join(','))fail('exact child binding required');
 if(!NATIVE.has(b.role))fail('role is outside the bounded native path');
 for(const k of Object.keys(b))if(typeof b[k]!=='string'||!b[k])fail('nonempty binding '+k+' required');
 if(!Array.isArray(events)||!Array.isArray(history))fail('events and actual read-back history arrays required');
 if(input.note!==undefined&&typeof input.note!=='string')fail('note must be text');
 const p=input.phase;
 const kinds=events.map(e=>e&&e.kind).join(',');
 if(!(p==='dispatch'&&kinds==='handoff,assigned')&&
    !(p==='start'&&kinds==='started')&&
    !(p==='final'&&(kinds==='delivered,contribution'||kinds==='aborted,contribution')))fail('invalid phase/order; final requires own terminal then contribution');
 const key=e=>['project_id','run_id','task_id'].every(k=>e[k]===b[k]);
 const bound=e=>key(e)&&e.parent_id===b.parent_id;
 const parsed=[],known=new Map();
 for(const h of history){
  object(h,'history comment');
  if(!Number.isSafeInteger(h.id)||h.id<=0||typeof h.created_at!=='string'||!c.ISO.test(h.created_at)||isNaN(Date.parse(h.created_at)))fail('history needs actual GitHub id/created_at');
  const r=c.pruefen(h);
  if(r.art!=='ok')continue; // Unrelated invalid legacy entries cannot establish a valid assignment.
  const match=h.body.match(/<!-- AGENTARIUM_EVENT_V1 -->\s*```json\s*([\s\S]*?)```/);
  if(!match)fail('validated consumer event extraction changed');
  const raw=JSON.parse(match[1]),previous=known.get(raw.id);
  if(previous&&canonical(previous)!==canonical(raw))fail('conflicting id already in history: '+raw.id);
  known.set(raw.id,raw);
  parsed.push({ev:r.ev,kommentar:h.id,recorded_at:h.created_at});
 }
 const batchIds=new Set(),comments=[],skipped=[];
 let previousTime=-Infinity;
 for(const e of events){
  object(e,'event');
  if(!bound(e))fail('event assignment binding mismatch');
  if(e.source_evidence!=='reported_checkpoint')fail('native status must remain reported_checkpoint');
  const own=p!=='dispatch',actor=own?b.role:'atlas';
  if(e.actor!==actor||e.reporter!==actor)fail('actual role must be actor and reporter');
  if(p==='dispatch'&&e.recipient!==b.role)fail('dispatch recipient mismatch');
  if(e.kind==='contribution'&&e.recipient!=='atlas')fail('final return recipient must be atlas');
  const comment=c.MARKER+'\n```json\n'+JSON.stringify(e,null,2)+'\n```\n\n'+(input.note||'');
  const r=c.pruefen({body:comment,user:{login:'pahlborn'}});
  if(r.art!=='ok')fail('consumer rejects '+(e.id||'?')+': '+r.grund);
  if(batchIds.has(e.id))fail('duplicate batch id');
  batchIds.add(e.id);
  const time=Date.parse(e.occurred_at);if(time<previousTime)fail('batch event times go backwards');previousTime=time;
  const old=known.get(e.id);
  if(old){if(canonical(old)!==canonical(e))fail('same id has different content: '+e.id);skipped.push(e.id);}
  else comments.push({repo_full_name:REPO,pr_number:2,comment});
 }
 const scope=parsed.filter(x=>key(x.ev));
 if(p==='dispatch'){
  if(scope.some(x=>!batchIds.has(x.ev.id)))fail('attempt already used; dispatch a fresh child task id');
 }else if(comments.length){
  const assignments=scope.filter(x=>x.ev.kind==='assigned'&&bound(x.ev)&&x.ev.actor==='atlas'&&x.ev.reporter==='atlas'&&x.ev.recipient===b.role);
  if(!assignments.length)fail('no valid published matching assignment in supplied history');
  const assignmentTime=Math.max(...assignments.map(x=>Date.parse(x.ev.occurred_at)));
  if(Date.parse(events[0].occurred_at)<assignmentTime)fail('status predates matching assignment');
  const rows=c.faltenZuZustand(scope.filter(x=>c.LEBEN[x.ev.kind]));
  const row=rows.find(x=>x.projekt===b.project_id&&x.lauf===b.run_id&&x.aufgabe===b.task_id);
  const ownTerminal=scope.filter(x=>bound(x.ev)&&['delivered','aborted'].includes(x.ev.kind)&&x.ev.actor===b.role&&x.ev.reporter===b.role);
  if(p==='start'){
   if(ownTerminal.length||!row||row.wer!==b.role||row.eEltern!==b.parent_id||!['zugewiesen','empfangen'].includes(row.zustand))fail('attempt is terminal, already started, closed or held elsewhere');
  }else{
   const terminalRecorded=known.has(events[0].id);
   if(row&&(row.wer!==b.role||row.eEltern!==b.parent_id))fail('final return held elsewhere');
   if(!terminalRecorded&&(!row||row.wer!==b.role||row.eEltern!==b.parent_id||!['zugewiesen','empfangen','begonnen'].includes(row.zustand)))fail('attempt is terminal, closed or held elsewhere');
   const latestStart=scope.filter(x=>bound(x.ev)&&x.ev.kind==='started'&&x.ev.actor===b.role&&x.ev.reporter===b.role).map(x=>Date.parse(x.ev.occurred_at));
   if(latestStart.length&&Date.parse(events[0].occurred_at)<Math.max(...latestStart))fail('terminal predates recorded start');
  }
 }
 const warnings=[];
 if(p==='final'&&!scope.some(x=>bound(x.ev)&&x.ev.kind==='started'&&x.ev.actor===b.role&&x.ev.reporter===b.role))warnings.push('No own start in supplied history; retain the evidence gap, never invent a start.');
 const result={comments,skipped,warnings};
 if(p==='dispatch')result.instruction='When you actually take up this assignment, send Atlas your OWN started V1 object before substantive work. Binding: '+JSON.stringify(b)+'. actor=reporter='+b.role+'; source_evidence=reported_checkpoint; actual ISO time with T/zone, unique event id, actual source_tool_id and title. On final handback send your own delivered (or actual aborted) followed by contribution to atlas with exactly this binding. Intermediate updates are progress. Do not publish GitHub, invent platform evidence, reuse another attempt id or claim PASS merely because execution ended. Atlas alone validates and publishes; missing messages must be reconciled, never fabricated.';
 return result;
}
module.exports={prepare,consumer};
if(require.main===module){
 try{if(process.argv.length!==3)fail('usage: node .github/scripts/native-journal.cjs input.json');
  const result=prepare(JSON.parse(fs.readFileSync(process.argv[2],'utf8')));
  process.stdout.write(JSON.stringify(result)+'\n');
 }catch(e){process.stderr.write('native-journal: '+e.message+'\n');process.exitCode=1;}
}
