'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.join(__dirname,'pilot/github-live'),out=__dirname;
const task='AG-NATIVE-PUBLISH-GUARD-20261116-QA-A1',parent='AG-NATIVE-PUBLISH-GUARD-20261116';
const samples=[],polls=[],errors=[]; const wire=()=>JSON.parse(fs.readFileSync(path.join(out,'wire-comments.json'),'utf8'));
const parse=c=>JSON.parse(c.body.match(/<!-- AGENTARIUM_EVENT_V1 -->\s*```json\s*([\s\S]*?)```/)[1]);
(async()=>{
 const server=http.createServer((req,res)=>{const rel=decodeURIComponent(req.url.split('?')[0]),p=path.resolve(root,'.'+(rel==='/'?'/index.html':rel));if(!p.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(p,(e,data)=>{if(e){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':p.endsWith('.js')?'text/javascript':p.endsWith('.html')?'text/html':'application/json'});res.end(data);});});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1194,height:834}});
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/projekte/verzeichnis.json',r=>r.fulfill({status:200,contentType:'application/json',body:fs.readFileSync(path.join(out,'projekte/verzeichnis.json'),'utf8')}));
 await page.route('**api.github.com/**',r=>{
  const comments=wire();polls.push({at:new Date().toISOString(),ids:comments.map(c=>c.id)});
  return r.fulfill({status:200,contentType:'application/json',headers:{ETag:'"guard-'+polls.length+'"'},body:JSON.stringify(r.request().url().includes('/issues/2/comments')?comments:{workflow_runs:[]})});
 });
 await page.goto('http://127.0.0.1:'+server.address().port+'/?live=github',{waitUntil:'load'});
 await page.fill('#agGhToken','LOCAL_MIRROR_NO_CREDENTIAL');
 await page.click('#agGhAn');
 await page.waitForFunction(()=>window.__agGithub?.stand().verbunden);
 await page.locator('#agGhAuf').evaluate(el=>{el.open=false;});
 fs.writeFileSync(path.join(out,'ready.json'),JSON.stringify({at:new Date().toISOString(),task,html_sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'index.html'))).digest('hex')}));
 console.log('READY');
 let last=0,lastSig='',complete=false;
 const until=Date.now()+480000;
 while(Date.now()<until){
  const state=await page.evaluate(()=>({at:new Date().toISOString(),s:window.__agStand(),working:document.querySelector('#agRing .agName[data-wer="sentinel"]')?.classList.contains('arbeitet')||false,a:window.__agGithub.stand()}));
  const cs=wire(),events=cs.map(parse),as=cs.find(c=>parse(c).kind==='assigned');
  const st=events.some(e=>e.task_id===task&&e.kind==='started'),end=events.some(e=>e.task_id===task&&['delivered','aborted'].includes(e.kind)),ret=events.some(e=>e.task_id===task&&e.kind==='contribution');
  const row=state.s.aufgaben.find(t=>t.projekt==='agentarium'&&t.lauf===parent&&t.aufgabe===task&&t.eEltern===parent&&t.wer==='sentinel');
  const delta=state.s.weisePunkte-last;last=state.s.weisePunkte;
  const item={at:state.at,working:state.working,points:last,delta,hasStart:st,hasEnd:end,hasReturn:ret,row:row||null,assignment:as?.id,subballs:state.s.liegend.filter(b=>b.projekt==='agentarium'&&b.lauf===parent&&b.aufgabe===task&&b.bei==='sentinel'&&b.teil&&b.eltern===parent).length,rejected:state.a.zahl.abgewiesen,phase:state.a.phase};
  samples.push(item);
  const criteria={assignmentInactive:samples.some(x=>x.row?.zustand==='zugewiesen'&&String(x.row.beleg)===String(x.assignment)&&!x.hasStart&&!x.working),activeBeforeEnd:samples.some(x=>x.row?.zustand==='begonnen'&&String(x.row.beleg)===String(x.assignment)&&x.hasStart&&!x.hasEnd&&x.working&&x.delta>0),terminalStops:end&&ret&&row?.zustand==='geliefert'&&!state.working&&delta===0&&item.subballs===0,acceptedAll:samples.every(x=>x.rejected===0)};
  const sig=[item.working,st,end,ret,row?.zustand,item.subballs].join('|');
  if(sig!==lastSig){console.log(JSON.stringify(item));lastSig=sig;await page.screenshot({path:path.join(out,'proof-'+samples.length+'.png')});}
  const result={criteria,latest:item,errors,complete:Object.values(criteria).every(Boolean)&&errors.length===0};
  fs.writeFileSync(path.join(out,'status.json'),JSON.stringify(result,null,2));
  if(result.complete){complete=true;break;}
  await page.waitForTimeout(700);
 }
 fs.writeFileSync(path.join(out,'browser-report.json'),JSON.stringify({complete,errors,samples,polls,source:'02419a49550c3cadb4d65159f0833ca3b0d9f0d1',scope:'Unmodified Fassung106; actual production V1 GitHub objects through disclosed local API mirror; no marker/payload rewrite. This does not observe Peter browser or real Safari.'},null,2));
 await browser.close();await new Promise(r=>server.close(r));console.log('COMPLETE '+complete);process.exitCode=complete?0:1;
})().catch(e=>{fs.writeFileSync(path.join(out,'failure.txt'),String(e.stack));console.error(e);process.exit(2)});

