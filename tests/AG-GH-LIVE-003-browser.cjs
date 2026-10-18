/* Sentinel independent QA. Synthetic network/date fixtures; no real token or GitHub writes.
 * node AG-GH-LIVE-003-browser.cjs <built-original-directory> <exact-commit> [output-directory]
 * Requires Playwright + Chromium installed. Serves the exact supplied build on loopback.
 */
const {chromium}=require('playwright');
const fs=require('fs'), path=require('path'), http=require('http'), assert=require('assert/strict');
const root=path.resolve(process.argv[2]||''), commit=process.argv[3];
if(!commit||!fs.existsSync(path.join(root,'index.html')))throw Error('Supply built-original-directory and exact commit SHA');
const out=path.resolve(process.argv[4]||'sentinel-expiry-results');fs.mkdirSync(out,{recursive:true});
const KEY='agentarium.github.tokenExpiry', TODAY='2026-10-18T10:00:00+02:00', TOKEN='SENTINEL_SYNTHETIC_TOKEN_123456';
const results=[];
const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname)); if(!p.startsWith(root+path.sep)){res.writeHead(403);return res.end();}fs.readFile(p,(e,b)=>{if(e){res.writeHead(404);return res.end();}res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.html')?'text/html':'application/octet-stream');res.end(b);});});
(async()=>{
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`http://127.0.0.1:${server.address().port}/index.html?live=github`;
let browser;
try{browser=await chromium.launch({headless:true});
async function test(id,fn){const start=Date.now();try{await fn();results.push({id,status:'passed',ms:Date.now()-start});}catch(e){results.push({id,status:'failed',error:e.stack,ms:Date.now()-start});}}
async function session(width,date,mode='success'){
 const ctx=await browser.newContext({viewport:{width,height:width===390?844:1024},timezoneId:'Europe/Berlin',serviceWorkers:'block'});
 await ctx.addInitScript(({date,key,today})=>{const RealDate=Date;window.Date=class extends RealDate{constructor(...a){super(...(a.length?a:[today]));}static now(){return new RealDate(today).getTime();}};if(!sessionStorage.getItem('sentinelSeeded')){localStorage.clear();if(date!==null)localStorage.setItem(key,date);sessionStorage.setItem('sentinelSeeded','1');}},{date,key:KEY,today:TODAY});
 const page=await ctx.newPage(), requests=[], consoles=[];page.on('console',m=>consoles.push(m.text()));
 await page.route('https://api.github.com/**',async r=>{requests.push({url:r.request().url(),headers:r.request().headers()});if(mode==='network')return r.abort('failed');return r.fulfill({status:200,headers:{'content-type':'application/json',etag:'"sentinel"'},body:'[]'});});
 await page.goto(url);await page.waitForFunction(()=>!!window.__agGithub);
 return{ctx,page,requests,consoles};
}
async function connect(s){await s.page.locator('#agGhToken').fill(TOKEN);await s.page.locator('#agGhAn').click();}
async function collapsedWarning(page,needle){
 await page.locator('#agGithub details').evaluate(e=>e.open=false);
 const proof=await page.evaluate(needle=>{
 const found=[],walker=document.createTreeWalker(document.getElementById('agGithub'),NodeFilter.SHOW_TEXT);let n;
 while(n=walker.nextNode()){if(!n.textContent.includes(needle))continue;
 const range=document.createRange();range.selectNodeContents(n);const r=range.getBoundingClientRect();let ok=r.width>0&&r.height>0&&r.left>=-1&&r.right<=innerWidth+1&&r.top>=-1&&r.bottom<=innerHeight+1;
 for(let p=n.parentElement;p;p=p.parentElement){const s=getComputedStyle(p),b=p.getBoundingClientRect();if(s.display==='none'||s.visibility==='hidden'||s.opacity==='0')ok=false;if(p.tagName==='DETAILS'&&!p.open&&!p.querySelector('summary')?.contains(n))ok=false;if(['hidden','clip','scroll','auto'].includes(s.overflowX)&&(r.left<b.left-1||r.right>b.right+1))ok=false;if(['hidden','clip','scroll','auto'].includes(s.overflowY)&&(r.top<b.top-1||r.bottom>b.bottom+1))ok=false;}
 found.push({text:n.textContent,visibleUnclipped:ok,rect:{left:r.left,right:r.right,top:r.top,bottom:r.bottom}});}
 return found;},needle);
 assert(proof.some(p=>p.visibleUnclipped),`Warning not fully visible with details collapsed: ${JSON.stringify(proof)}`);return proof;
}
for(const width of [320,375,390,768])for(const mode of ['success','network'])await test(`WARN-10-${width}-${mode}`,async()=>{const s=await session(width,'2026-10-28',mode);try{await connect(s);await s.page.waitForFunction(mode=>{const v=window.__agGithub.stand();return mode==='success'?v.verbunden:v.fehler.includes('Netzwerkfehler');},mode);const proof=await collapsedWarning(s.page,'10 Tagen');await s.page.screenshot({path:path.join(out,`warn-${width}-${mode}.png`)});fs.writeFileSync(path.join(out,`warn-${width}-${mode}.json`),JSON.stringify(proof,null,2));}finally{await s.ctx.close();}});
await test('BOUNDARY-11-no-warning',async()=>{const s=await session(768,'2026-10-29');try{await connect(s);await s.page.waitForFunction(()=>window.__agGithub.stand().verbunden);await s.page.locator('#agGithub details').evaluate(e=>e.open=false);assert(!/Token läuft in 11 Tagen/.test(await s.page.locator('#agGithub summary').innerText()));}finally{await s.ctx.close();}});
await test('SINGULAR-1',async()=>{const s=await session(390,'2026-10-19');try{await connect(s);await s.page.waitForFunction(()=>window.__agGithub.stand().verbunden);await collapsedWarning(s.page,'1 Tag');const t=await s.page.locator('#agGithub').textContent();assert(!/1 Tagen|noch 1 Tage\b/.test(t),t);}finally{await s.ctx.close();}});
await test('MISSING-not-confirmed-reload',async()=>{const s=await session(768,null);try{for(let n=0;n<2;n++){const p=await s.page.evaluate(key=>({stored:localStorage.getItem(key),text:document.getElementById('agGithub').textContent}),KEY);assert(!p.stored,'Missing date silently persisted as confirmed expiry');assert.equal(await s.page.locator('#agGhAblauf').inputValue(),'','Missing date silently given a new date');assert(/fehlt|unbestätigt|nicht bestätigt|Vorschlag/i.test(p.text),'No visible distinction for missing/unconfirmed date');if(n===0)await s.page.reload();}}finally{await s.ctx.close();}});
await test('DELETED-not-recreated-on-reload',async()=>{const s=await session(768,'2026-10-28');try{await s.page.locator('#agGhAblauf').fill('');await s.page.locator('#agGhAblauf').dispatchEvent('change');await s.page.reload();assert.equal(await s.page.evaluate(k=>localStorage.getItem(k),KEY),null);assert(/fehlt|unbestätigt|nicht bestätigt|Vorschlag/i.test(await s.page.locator('#agGithub').textContent()));}finally{await s.ctx.close();}});
await test('SAVED-date-preserved-reload',async()=>{const s=await session(768,'2026-10-28');try{await s.page.reload();assert.equal(await s.page.locator('#agGhAblauf').inputValue(),'2026-10-28');assert.equal(await s.page.evaluate(k=>localStorage.getItem(k),KEY),'2026-10-28');}finally{await s.ctx.close();}});
for(const [date,needle]of [['2026-10-18','heute ab'],['2026-10-17','abgelaufen']])await test(`EXPIRY-${date}`,async()=>{const s=await session(390,date);try{await connect(s);await s.page.waitForFunction(()=>window.__agGithub.stand().verbunden);await collapsedWarning(s.page,needle);if(date==='2026-10-17'){const text=await s.page.locator('#agGithub').textContent();assert(!/seit 1 Tagen/.test(text),text);assert(/seit 1 Tag(?:\b|$)/.test(text),text);}}finally{await s.ctx.close();}});
await test('TOKEN-RAM-only-and-cleared',async()=>{const s=await session(768,'2026-10-28');try{await connect(s);await s.page.waitForFunction(()=>window.__agGithub.stand().verbunden);assert.equal(await s.page.locator('#agGhToken').inputValue(),'');const snapshot=await s.page.evaluate(()=>JSON.stringify({local:{...localStorage},session:{...sessionStorage},stand:window.__agGithub.stand(),url:location.href,html:document.documentElement.outerHTML}));assert(!snapshot.includes(TOKEN));assert(!s.consoles.join('\n').includes(TOKEN));assert(s.requests.length>0);assert(s.requests.every(r=>r.url.startsWith('https://api.github.com/repos/pahlborn/agentarium/issues/2/comments')&&r.headers.authorization===`Bearer ${TOKEN}`));await s.page.locator('#agGithub summary').click();await s.page.locator('#agGhAus').click();assert.equal(await s.page.evaluate(()=>window.__agGithub.stand().hatToken),false);}finally{await s.ctx.close();}});
}catch(e){results.push({id:'ENVIRONMENT',status:'blocked',error:e.message});}finally{if(browser)await browser.close();server.close();const report={task:'AG-GH-LIVE-003',commit,checkedAt:new Date().toISOString(),environment:{node:process.version,playwright:require('playwright/package.json').version,browser:'Chromium headless; synthetic date/network; not Safari/iPad'},results};fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));process.exitCode=results.some(x=>x.status!=='passed')?1:0;}
})();
