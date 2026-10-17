// Sentinel AG-PILOT-001-ONE-EVENT QA v1. Real source for positive path;
// explicitly mutated source is used only for negative tests. No publication.
const {chromium} = require('playwright');
const http=require('node:http'), fs=require('node:fs'), path=require('node:path'), crypto=require('node:crypto'), assert=require('node:assert/strict');
const root=path.resolve(process.env.QA_ROOT||process.cwd()), out=path.join(root,'one-event-browser-qa-output');fs.mkdirSync(out,{recursive:true});
const cp=require('node:child_process');
// Build the actual generator in this disposable checkout, already patched by CI.
cp.execFileSync('python3',['-c',`import importlib.util,json,pathlib,shutil,subprocess,sys
p=pathlib.Path('.').resolve();out=p/'one-event-browser-qa-output';work=out/'package-work';work.mkdir(parents=True,exist_ok=True)
s=importlib.util.spec_from_file_location('field_build',p/'previews/AG-VISUAL-005-feld/schicht.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
st=[json.loads((p/('previews/AG-VISUAL-005-feld/ereignisse-'+v+'.json')).read_text()) for v in ['v1','v2']]
m.bauen(str(p/'previews/AG-VISUAL-005-feld/resonanz-maschine.html'),str(work/'agentarium-fertig.html'),st)
for n in [120,152,180,192,512]:shutil.copyfile(p/('feld/icon-'+str(n)+'.png'),work/('icon-'+str(n)+'.png'))
source=(p/'handoffs/AG-PILOT-001-one-event-observed-v1.json').read_bytes()
subprocess.run([sys.executable,str(p/'previews/AG-VISUAL-005-feld/pages.py'),str(p/'feld')],cwd=work,check=True)
(p/'feld/one-event.json').write_bytes(source)
shutil.copytree(p/'feld',out/'publish-bundle',dirs_exist_ok=True)
`],{cwd:root,stdio:'inherit'});
const original=fs.readFileSync(path.join(root,'feld/one-event.json'));const source=JSON.parse(original);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const records=[], requests=[];let scenario='happy';
const server=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://localhost');requests.push({scenario,url:req.url,time:new Date().toISOString()});
  if(u.pathname==='/feld/one-event.json'){
    res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
    if(scenario==='404'){res.statusCode=404;return res.end('missing');}
    if(scenario==='bad-json')return res.end('not JSON');
    if(scenario==='unknown-kind'){let d=structuredClone(source);d.event.kind='SENTINEL_NEGATIVE_UNKNOWN';return res.end(JSON.stringify(d));}
    return res.end(original);
  }
  const rel=u.pathname==='/feld/'?'feld/index.html':u.pathname.replace(/^\//,'');
  const file=path.resolve(root,rel);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.statusCode=404;return res.end('not found');}
  res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.html')?'text/html':'application/octet-stream');
  res.setHeader('Cache-Control','no-store');res.end(fs.readFileSync(file));
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
 let failed=false;
 async function test(name,fn){try{await fn();records.push({name,status:'passed'});}catch(e){failed=true;records.push({name,status:'failed',error:String(e.stack||e)});}}
 async function open(name,query,sw='block',context=null){scenario=name;context=context||await browser.newContext({viewport:{width:1365,height:900},serviceWorkers:sw});let page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));let start=requests.length;await page.goto(origin+'/feld/'+query,{waitUntil:'load'});return {context,page,errors,start};}
 const eventReads=x=>requests.slice(x.start).filter(r=>r.url.split('?')[0]==='/feld/one-event.json');
 await test('normal-mode-no-read',async()=>{let x=await open('normal','');await x.page.waitForTimeout(1500);assert.equal(eventReads(x).length,0);assert.equal(await x.page.evaluate(()=>typeof window.__agMvp),'undefined');assert.deepEqual(x.errors,[]);await x.context.close();});
 await test('real-source-once-visible',async()=>{let x=await open('happy','?mvp=1','allow');await x.page.waitForFunction(()=>window.__agMvp&&(window.__agMvp.ereignis||window.__agMvp.fehler));const state=await x.page.evaluate(()=>window.__agMvp);assert.equal(state.http,200);assert.equal(state.abrufe,1);assert.equal(state.lauf.angenommen,true);assert.equal(state.ereignis.angenommen,true);assert.equal(state.ereignis.id,source.event.id);assert.equal(state.fehler,null);await x.page.locator('#agLaeuft .agAuf').filter({hasText:source.event.title}).waitFor({state:'visible',timeout:10000});assert.equal(await x.page.locator('#agLaeuft .agAuf').count(),1);assert.equal(eventReads(x).length,1);await x.page.waitForTimeout(1800);assert.equal(eventReads(x).length,1);assert.deepEqual(x.errors,[]);records.push({name:'happy-evidence',status:'passed',state,visible:await x.page.locator('#agLaeuft').innerText(),webgl:await x.page.evaluate(()=>({machine:!!window.__feld,ua:navigator.userAgent})),source_sha256:sha(original)});await x.page.screenshot({path:path.join(out,'real-event.png')});await x.context.close();});
 await test('http404-no-hooks',async()=>{let x=await open('404','?mvp=1');await x.page.waitForFunction(()=>window.__agMvp&&window.__agMvp.fehler);let s=await x.page.evaluate(()=>window.__agMvp);assert.equal(s.http,404);assert.equal(s.lauf,null);assert.equal(s.ereignis,null);assert.match(s.fehler,/HTTP 404/);assert.equal(eventReads(x).length,1);await x.context.close();});
 await test('unknown-kind-rejected',async()=>{let x=await open('unknown-kind','?mvp=1');await x.page.waitForFunction(()=>window.__agMvp&&window.__agMvp.ereignis);let s=await x.page.evaluate(()=>window.__agMvp);assert.equal(s.lauf.angenommen,true);assert.equal(s.ereignis.angenommen,false);assert.match(s.ereignis.grund,/kind unbekannt/);assert.equal(await x.page.locator('#agLaeuft .agAuf').count(),0);assert.equal(eventReads(x).length,1);await x.context.close();});
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({task:'AG-PILOT-001-ONE-EVENT',environment:'isolated CI Chromium + SwiftShader; existing generator and pages.py PWA package, first-visit happy path with SW allowed; not published original',time:new Date().toISOString(),browser:browser.version(),source_sha256:sha(original),html_sha256:sha(fs.readFileSync(path.join(root,'feld/index.html'))),records,requests},null,2));console.log(JSON.stringify(records,null,2));await browser.close();server.close();process.exitCode=failed?1:0;
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
