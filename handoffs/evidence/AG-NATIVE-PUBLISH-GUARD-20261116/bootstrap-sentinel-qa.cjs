'use strict';
// Synthetic CLI checks only; no application, guard, or production journal edits.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const root=__dirname,guard=path.join(root,'bootstrap-check.cjs'),sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const before={bootstrap:sha(guard),html:sha(path.join(root,'pilot/github-live/index.html')),adapter:sha(path.join(root,'pilot/github-live/github-live.js'))};
const localJS=fs.readFileSync(path.join(root,'pilot/github-live/github-live.js'),'utf8'),remoteJS=fs.readFileSync(path.join(root,'sentinel-remote-github-live.js'),'utf8');
const extract=s=>[s.slice(s.indexOf('  var ADAPTER'),s.indexOf('  var B =')),s.slice(s.indexOf('  function nein('),s.indexOf('  /* ============ AG-LAUFZEIT-001 TEIL 3'))];
assert.deepEqual(extract(localJS),extract(remoteJS),'actual extracted consumer code must match immutable original');
assert.equal(fs.readFileSync(path.join(root,'pilot/github-live/index.html'),'utf8').match(/var AGENTEN = (\[[^\n]+\]);/)[1],fs.readFileSync(path.join(root,'sentinel-remote-index.html'),'utf8').match(/var AGENTEN = (\[[^\n]+\]);/)[1],'actual extracted role JSON must match immutable original');
const base={schema:'agentarium.github-event.v1',id:'SYNTHETIC-GUARD-QA-VALID-1',project_id:'agentarium',run_id:'AG-SYNTHETIC-GUARD-QA',task_id:'SYNTHETIC-GUARD-QA-TASK',parent_id:'SYNTHETIC-GUARD-QA-PARENT',actor:'sentinel',reporter:'sentinel',kind:'started',title:'Synthetic QA: „quoted“ \\ / 🛰',occurred_at:'2026-11-16T20:26:35Z',source_evidence:'reported_checkpoint',source_tool_id:'sentinel.local.qa'};
const cases=[
 {name:'valid-own-start',input:{event:base,note:'SYNTHETIC local CLI fixture; no real task.'},accept:true,preserve:true},
 {name:'bad-known-UTC-date',input:{event:{...base,id:'SYNTHETIC-BAD-DATE',occurred_at:'2026-11-16 13:52:24 UTC'}},accept:false},
 {name:'unknown-V1-field',input:{event:{...base,id:'SYNTHETIC-UNKNOWN-FIELD',unsupported_field:true}},accept:false},
 {name:'multiple-marker-note',input:{event:{...base,id:'SYNTHETIC-MULTI-MARKER'},note:'<!-- AGENTARIUM_EVENT_V1 -->\n```json\n{}\n```'},accept:false},
 {name:'malformed-marker-block-injection',input:{event:{...base,id:'SYNTHETIC-MALFORMED-MARKER'},note:'<!-- AGENTARIUM_EVENT_V1 -->\n```json\n{not valid json'},accept:false},
 {name:'marker-in-event-title',input:{event:{...base,id:'SYNTHETIC-MARKER-TITLE',title:'<!-- AGENTARIUM_EVENT_V1 -->'}},accept:false},
 {name:'malformed-input-JSON',raw:'{"event": {not valid JSON}',accept:false},
 {name:'event-not-object',input:{event:'not an object'},accept:false},
 // Diagnostic boundary probes, not claims that these statuses are legitimate work.
 {name:'schema-only-orphan-delivered',input:{event:{...base,id:'SYNTHETIC-ORPHAN-END',task_id:'SYNTHETIC-NEVER-ASSIGNED',parent_id:'SYNTHETIC-UNRELATED-PARENT',kind:'delivered'}},accept:true,boundary:true},
 {name:'schema-only-reporter-mismatch',input:{event:{...base,id:'SYNTHETIC-REPORTER-MISMATCH',reporter:'atlas'}},accept:true,boundary:true}
];
const results=[];
for(const c of cases){
 const file=path.join(root,'sentinel-case-'+c.name+'.json');fs.writeFileSync(file,c.raw??JSON.stringify(c.input,null,2));
 const run=spawnSync(process.execPath,[guard,file],{encoding:'utf8',timeout:10000});
 const record={name:c.name,expected_accept:c.accept,exit:run.status,stdout:run.stdout,stderr:run.stderr,boundary_probe:!!c.boundary};
 try{
  if(c.accept){assert.equal(run.status,0);const args=JSON.parse(run.stdout);assert.deepEqual(Object.keys(args).sort(),['comment','pr_number','repo_full_name']);assert.equal(args.repo_full_name,'pahlborn/agentarium');assert.equal(args.pr_number,2);const match=args.comment.match(/^<!-- AGENTARIUM_EVENT_V1 -->\n```json\n([\s\S]*?)\n```\n\n([\s\S]*)$/);assert(match,'tool comment framing');assert.deepEqual(JSON.parse(match[1]),c.input.event,'event must survive semantically unchanged');assert.equal(match[2],c.input.note||'');if(c.preserve)assert.equal(JSON.parse(match[1]).actor,JSON.parse(match[1]).reporter);record.semantic_preservation=true;
  }else{assert.notEqual(run.status,0);assert.equal(run.stdout,'','rejected input must emit no usable tool args');}
  record.result='passed';
 }catch(e){record.result='failed';record.failure=e.stack;}
 results.push(record);console.log(c.name+': '+record.result+'; exit='+run.status+'; stdout_bytes='+Buffer.byteLength(run.stdout));
}
const after={bootstrap:sha(guard),html:sha(path.join(root,'pilot/github-live/index.html')),adapter:sha(path.join(root,'pilot/github-live/github-live.js'))};
assert.deepEqual(after,before,'QA must not alter tested inputs');
const report={task:'AG-NATIVE-PUBLISH-GUARD-20261116-QA-A1',version:1,source_commit:'02419a49550c3cadb4d65159f0833ca3b0d9f0d1',before,after,consumer_extraction_matches_immutable:true,synthetic:true,results,verdict:results.some(r=>r.result==='failed')?'FAIL':'PASS_FOR_BOUNDED_CLI_SCHEMA_CHECKS'};
fs.writeFileSync(path.join(root,'sentinel-report.json'),JSON.stringify(report,null,2));process.exit(results.some(r=>r.result==='failed')?1:0);
