'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'pilot/github-live/github-live.js'),'utf8');
const constants=src.slice(src.indexOf('  var ADAPTER'),src.indexOf('  var B ='));
const validation=src.slice(src.indexOf('  function nein('),src.indexOf('  /* ============ AG-LAUFZEIT-001 TEIL 3'));
if(!constants||!validation) throw Error('consumer extraction failed');
const html=fs.readFileSync(path.join(__dirname,'pilot/github-live/index.html'),'utf8');
const m=html.match(/var AGENTEN = (\[[^\n]+\]);/);
if(!m)throw Error('role source unavailable');
const actors=JSON.parse(m[1]).map(a=>a.name).concat('springer');
const context={KANN_KOMM:true,KANN_LEBEN:true,AKTEURE:Object.fromEntries(actors.map(x=>[x,1]))};
vm.createContext(context);vm.runInContext(constants+validation,context,{timeout:1000});
const input=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const comment='<!-- AGENTARIUM_EVENT_V1 -->\n```json\n'+JSON.stringify(input.event,null,2)+'\n```\n\n'+(input.note||'');
const result=context.pruefen({body:comment,user:{login:'pahlborn'}});
if(result.art!=='ok')throw Error('consumer rejects: '+result.grund);
process.stdout.write(JSON.stringify({repo_full_name:'pahlborn/agentarium',pr_number:2,comment}));

