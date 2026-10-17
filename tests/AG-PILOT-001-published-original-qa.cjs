// Sentinel AG-PILOT-001-ONE-EVENT: deployed-original happy-path acceptance.
// No rebuild, localhost, event injection, interception, or synthetic data.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const url='https://pahlborn.github.io/agentarium/feld/?mvp=1';
const jsonUrl='https://pahlborn.github.io/agentarium/feld/one-event.json';
const htmlExpected='23e8b503e1b623e798bef587f5775b932e44b9561178d58ca1ec3c4a6d3e68d4';
const jsonExpected='a8ba94c8abc2540300240eb4ebc8229fee8ca2f95f808558096bb6c354c60197';
const idExpected='AG-PILOT-RECOVERY-20261017-RA-REVIEW-V1';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const out=path.resolve(process.env.QA_OUTPUT||'one-event-published-qa-output');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1365,height:900},serviceWorkers:'allow'}),page=await context.newPage();
 const report={task:'AG-PILOT-001-ONE-EVENT',scope:'published original happy path; fresh Chromium SwiftShader, native Safari/iPad not tested',started:new Date().toISOString(),url,browser:browser.version(),requests:[],errors:[],status:'blocked'};
 const eventResponses=[];page.on('request',r=>report.requests.push({url:r.url(),method:r.method(),at:new Date().toISOString()}));
 page.on('pageerror',e=>report.errors.push(String(e)));
 page.on('response',r=>{if(r.url()===jsonUrl)eventResponses.push(r);});
 try{
  const response=await page.goto(url,{waitUntil:'load'});assert(response,'no navigation response');
  const html=await response.body();report.navigation={url:response.url(),status:response.status(),sha256:sha(html)};
  report.seen47=/var FASSUNG = '47'/.test(html.toString('utf8'));
  assert.equal(report.seen47,true,'deployed response is not Fassung47; no automatic retry');
  assert.equal(response.status(),200);assert.equal(sha(html),htmlExpected,'published HTML differs from reviewed candidate');
  await page.waitForFunction(()=>window.__agMvp&&(window.__agMvp.ereignis||window.__agMvp.fehler),null,{timeout:15000});
  report.state=await page.evaluate(()=>window.__agMvp);
  assert.equal(report.state.abrufe,1);assert.equal(report.state.http,200);assert.equal(report.state.fehler,null);
  assert.equal(report.state.lauf.angenommen,true);assert.equal(report.state.ereignis.angenommen,true);assert.equal(report.state.ereignis.id,idExpected);
  assert.equal(eventResponses.length,1,'expected exactly one real event response');
  const er=eventResponses[0],body=await er.body(),source=JSON.parse(body.toString('utf8'));
  report.source={url:er.url(),status:er.status(),sha256:sha(body),id:source.event.id,actor:source.event.actor,kind:source.event.kind,recipient:source.event.recipient,title:source.event.title};
  assert.equal(er.status(),200);assert.equal(sha(body),jsonExpected,'published source differs from actual Argus export');
  assert.equal(source.event.id,idExpected);assert.equal(source.event.kind,'review_result');assert.equal(source.event.fictional,false);
  const row=page.locator('#agLaeuft .agAuf').filter({hasText:source.event.title});await row.waitFor({state:'visible',timeout:10000});
  assert.equal(await page.locator('#agLaeuft .agAuf').count(),1);report.visible=await row.innerText();
  report.webgl=await page.evaluate(()=>({machine:!!window.__feld,userAgent:navigator.userAgent}));assert.equal(report.webgl.machine,true);
  await page.waitForTimeout(1800);assert.equal(report.requests.filter(r=>r.url===jsonUrl).length,1,'more than one real event request');
  assert.deepEqual(report.errors,[]);report.status='passed';
 }catch(e){report.failure=String(e.stack||e);report.status=report.seen47===false?'blocked':'failed';process.exitCode=1;}
 finally{
  await page.screenshot({path:path.join(out,'published-original.png')}).catch(e=>report.screenshotError=String(e));
  report.finished=new Date().toISOString();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
