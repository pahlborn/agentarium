const fs=require('fs'),vm=require('vm'),crypto=require('crypto');
const file=process.argv[2]||require('path').resolve(__dirname,'../index.html');
const html=fs.readFileSync(file,'utf8'),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const results=[];
function boot(raw=null,fail={}){const elements=new Map(),store={raw,writes:0};const c={document:{getElementById(id){if(!elements.has(id))elements.set(id,{textContent:'',value:''});return elements.get(id)},querySelectorAll(){return[]}},localStorage:{getItem(){if(fail.get)throw Error('get');return store.raw},setItem(k,v){if(fail.set)throw Error('set');store.raw=v;store.writes++},removeItem(){if(fail.remove)throw Error('remove');store.raw=null}},clearInterval(){},Date};vm.createContext(c);vm.runInContext(script.slice(0,script.indexOf('drawAgents();$("scrub")'))+'drawAgents=()=>{};drawTimeline=()=>{};setIndex(restoreState()??0);',c);return{c,elements,store,run:s=>vm.runInContext(s,c),owner:()=>elements.get('owner').textContent};}
function check(id,ok,observed){results.push({id,status:ok?'PASS':'FAIL',observed});}
function handoff(b,to){b.elements.get('target')?.value; b.run(`$('target').value=${JSON.stringify(to)};commitHandoff()`);}
let b=boot();b.run('setIndex(6)');handoff(b,'forge');let data=JSON.parse(b.store.raw);
check('handoff_atomic',b.owner()==='Forge'&&data.handoffs.length===1&&data.handoffs[0].from==='peter'&&data.handoffs[0].actor==='forge'&&data.index===7,data);
let restored=boot(b.store.raw);check('restore_no_duplicate',restored.owner()==='Forge'&&restored.run('demoEvents.length')===8&&restored.store.writes===0,{owner:restored.owner(),count:restored.run('demoEvents.length')});
handoff(restored,'sentinel');check('second_continuity',JSON.parse(restored.store.raw).handoffs[1].from==='forge'&&restored.owner()==='Sentinel',JSON.parse(restored.store.raw).handoffs[1]);
const valid=JSON.parse(b.store.raw);
for(const [id,mutate] of [['unknown-role',d=>d.handoffs[0].to='alien'],['version',d=>d.v=2],['index',d=>d.index=999],['data',d=>d.handoffs={}]] ){let d=structuredClone(valid);mutate(d);let x=boot(JSON.stringify(d));check('reject_'+id,x.owner()==='Peter'&&x.run('demoEvents.length')===7&&x.elements.get('status').textContent.length>0,x.elements.get('status').textContent);}
let corrupt=boot('{');check('reject_corrupt',corrupt.owner()==='Peter',corrupt.elements.get('status').textContent);
let get=boot(b.store.raw,{get:true});check('get_failure',get.owner()==='Peter',get.elements.get('status').textContent);
let set=boot(null,{set:true});set.run('setIndex(6)');handoff(set,'forge');check('set_failure_atomic',set.owner()==='Peter'&&set.run('demoEvents.length')===7&&set.store.raw===null,set.elements.get('status').textContent);
let remove=boot(b.store.raw,{remove:true});remove.run('resetState()');check('remove_failure_preserves',remove.owner()==='Forge'&&remove.store.raw===b.store.raw,remove.elements.get('status').textContent);
let nav=boot(b.store.raw);nav.run('setIndex(0)');handoff(nav,'nova');check('navigation_no_audit',nav.store.writes===0&&nav.store.raw===b.store.raw&&nav.run('demoEvents.length')===8,nav.elements.get('status').textContent);
check('local_labels',html.includes('Keine Verbindung zu GitHub, Claude oder Live-Agenten')&&data.handoffs[0].detail.includes('kein Live-Agent-Auftrag')&&b.elements.get('status').textContent.includes('kein Live-Agent'),'explicit offline/local labels');
let collision=structuredClone(valid);collision.handoffs[0].id='e1';let coll=boot(JSON.stringify(collision));check('fixture_collision_rejected',coll.owner()==='Peter'&&coll.elements.get('status').textContent.includes('inkonsistent'),{owner:coll.owner(),count:coll.run('demoEvents.length'),status:coll.elements.get('status').textContent});
let ancestry=structuredClone(valid);ancestry.handoffs[0].from='nova';let anc=boot(JSON.stringify(ancestry));check('first_ancestry_rejected',anc.owner()==='Peter', {owner:anc.owner(),status:anc.elements.get('status').textContent});
function boundary(n){let handoffs=[];for(let i=0;i<n;i++){let from=i%2?'forge':'peter',to=i%2?'peter':'forge';handoffs.push({...valid.handoffs[0],id:'boundary-'+i,from,to,actor:to});}return JSON.stringify({v:1,handoffs,index:6+n});}
let hundred=boot(boundary(100));check('restore_100',hundred.run('demoEvents.length')===107&&hundred.owner()==='Peter',{count:hundred.run('demoEvents.length'),owner:hundred.owner()});
let excess=boot(boundary(101));check('reject_101',excess.run('demoEvents.length')===7,excess.elements.get('status').textContent);
handoff(hundred,'forge');let after=boot(hundred.store.raw);check('100_to_101_preserves_recoverability',after.owner()==='Peter'&&after.run('demoEvents.length')===107&&JSON.parse(hundred.store.raw).handoffs.length===100&&hundred.store.writes===0&&hundred.owner()==='Peter',{saved:JSON.parse(hundred.store.raw).handoffs.length,reloadedCount:after.run('demoEvents.length'),owner:after.owner(),status:after.elements.get('status').textContent});
console.log(JSON.stringify({node:process.version,sha256:crypto.createHash('sha256').update(html).digest('hex'),results},null,2));

if(results.some(r=>r.status==='FAIL')) process.exitCode=1;
