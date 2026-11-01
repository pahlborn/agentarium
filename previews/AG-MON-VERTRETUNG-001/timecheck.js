/* Produktmodul im minimalen DOM: HTTP403-Backoff darf keine Abrufzeit aus der Zukunft anzeigen. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
let source=fs.readFileSync(path.join(__dirname,'../../pilot/github-live/work-status.js'),'utf8');
if(process.env.AG_MUTATE_TIME==='1')source=source.replace('new Date(checkedAt)','new Date(last)');
const now=1793512800000;
class Clock extends Date {constructor(value){super(value===undefined?now:value);}static now(){return now;}}
const box={exports:{}};new Function('module','Date',source)(box,Clock);
const created=[];
function element(tag){const e={tag,children:[],style:{},textContent:'',hidden:false,appendChild(c){this.children.push(c);c.parentNode=this;},remove(){},setAttribute(){}};created.push(e);return e;}
const d={hidden:false,createElement:element,getElementById(){return null;},head:element('head'),body:element('body')};
const ui=box.exports.mount({document:d,setInterval(){}});
ui.connect(['pahlborn/agentarium'],async()=>{const e=Error('HTTP403');e.retryAt=now+300000;throw e;});
setImmediate(()=>{
 try{
   const panel=created.find(e=>e.id==='agRunStatus'),summary=panel.children[0];
   assert.equal(summary.textContent,'GitHub-Läufe · '+new Clock(now).toLocaleTimeString(),'Abrufzeit muss die beobachtete Zeit sein, nicht die zukünftige Backoffgrenze');
   assert.equal(ui.state()[0].error,'Status unbekannt / nicht abrufbar');
   console.log('PASS HTTP403 zeigt tatsächliche Abrufzeit und unbekannten Status');
 }catch(e){console.error(e.message);process.exitCode=1;}
});
