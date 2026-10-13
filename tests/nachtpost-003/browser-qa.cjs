// Usage: node browser-qa.cjs <original-Forge.html> <output-directory>
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {chromium}=require('playwright');
const {PNG}=require('pngjs');
const input=path.resolve(process.argv[2]||path.join(__dirname,'forge-partitur.html'));
const out=path.resolve(process.argv[3]||path.join(__dirname,'browser-qa-output'));
const html=fs.readFileSync(input,'utf8');fs.mkdirSync(out,{recursive:true});
const report={artifact:input,sha256:crypto.createHash('sha256').update(html).digest('hex'),playwright:require('playwright/package.json').version,cases:[],limits:['Chromium mobile emulation is not real iPhone/Safari','Screenshots require human/Nova visual review; aesthetic acceptance not automated']};
let browser;
const check=(condition,message)=>{if(!condition)throw Error(message)};
// Gewebe defers seek/UI updates to RAF; two frames settle canvas and DOM.
const settle=target=>target.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
(async()=>{browser=await chromium.launch({headless:true});report.browser=browser.version();
for(const viewport of [{name:'desktop',width:1440,height:1000},{name:'mobile',width:390,height:844}])for(const mode of ['direct','sandbox-srcdoc']){
const record={viewport,mode,status:'RUNNING',consoleErrors:[],networkAttempts:[],screenshots:[]};report.cases.push(record);
const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},reducedMotion:'reduce',...(process.env.VISUAL004==='1'?{recordVideo:{dir:path.join(out,'videos'),size:{width:viewport.width,height:viewport.height}}}:{})});const page=await context.newPage();
page.on('pageerror',e=>record.consoleErrors.push(e.message));page.on('console',m=>{if(m.type()==='error')record.consoleErrors.push(m.text())});
await context.route('**/*',route=>{record.networkAttempts.push(route.request().url());return route.abort()});
try{
let target=page;
if(mode==='direct')await page.setContent(html,{waitUntil:'load'});
else{await page.setContent('<!doctype html><style>body{margin:0}iframe{border:0;width:100vw;height:100vh;display:block}</style><iframe sandbox="allow-scripts" title="Original Forge preview"></iframe>');await page.locator('iframe').evaluate((el,source)=>{el.srcdoc=source},html);await page.waitForFunction(()=>document.querySelector('iframe').contentWindow!==null);target=page.frames().find(f=>f!==page.mainFrame());}
await target.waitForFunction(()=>!!window.AG_NACHTPOST);record.initial=await target.evaluate(()=>window.AG_NACHTPOST.getState());check(!record.initial.playing,'reduced motion must start paused');
await target.evaluate(()=>window.AG_NACHTPOST.seek(108));await settle(target);await page.screenshot({path:path.join(out,viewport.name+'-'+mode+'-108.png'),fullPage:true});record.screenshots.push(viewport.name+'-'+mode+'-108.png');
// Inspect screenshot pixels, not merely the canvas backing buffer. The original
// Gewebe background stays below channel 90; its gold seals/cyan structures do not.
// This is a necessary blank-scene regression check, not proof of artistic quality.
if(/gewebe/i.test(input)){
record.canvasBeforeStageCapture=await target.evaluate(()=>{const c=document.querySelector('canvas'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let alpha=0;for(let i=3;i<d.length;i+=4)if(d[i])alpha++;return{width:c.width,height:c.height,alphaPixels:alpha}});
const stageShot=await target.locator('#stage').screenshot();const stageName=viewport.name+'-'+mode+'-stage108.png';fs.writeFileSync(path.join(out,stageName),stageShot);const png=PNG.sync.read(stageShot);let foreground=0;
for(let i=0;i<png.data.length;i+=4){const rgb=[png.data[i],png.data[i+1],png.data[i+2]];if(Math.max(...rgb)>90&&Math.max(...rgb)-Math.min(...rgb)>30)foreground++}
record.canvasAfterStageCapture=await target.evaluate(()=>{const c=document.querySelector('canvas'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let alpha=0;for(let i=3;i<d.length;i+=4)if(d[i])alpha++;return{width:c.width,height:c.height,alphaPixels:alpha}});
record.visibleScene={file:stageName,foregroundPixels:foreground,criterion:'more than 150 bright chromatic pixels; calibrated blank-scene safeguard only'};check(foreground>150,'screenshot contains no meaningful bright Gewebe foreground; canvas-alpha alone is insufficient');
}
record.pixels=await target.evaluate(()=>{const c=document.querySelector('canvas');if(!c)return{canvas:false};const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let alpha=0;for(let i=3;i<d.length;i+=4)if(d[i])alpha++;return{canvas:true,width:c.width,height:c.height,paintedPixels:alpha}});check(record.pixels.canvas&&record.pixels.paintedPixels>0,'canvas must contain painted pixels');
record.layout=await target.evaluate(()=>{const scene=document.querySelector('canvas').getBoundingClientRect(),dock=(document.getElementById('dock')||document.querySelector('aside#dk')).getBoundingClientRect();return{scene:{x:scene.x,y:scene.y,right:scene.right,bottom:scene.bottom},dock:{x:dock.x,y:dock.y,right:dock.right,bottom:dock.bottom},overlap:Math.min(scene.right,dock.right)>Math.max(scene.x,dock.x)&&Math.min(scene.bottom,dock.bottom)>Math.max(scene.y,dock.y),overflow:document.documentElement.scrollWidth>innerWidth+1,story:document.getElementById('story')?.innerText}});
check(!record.layout.overlap,'dock overlays canvas');check(!record.layout.overflow,'horizontal document overflow');check(record.layout.story?.trim().length>0,'visible story data missing');
// Real browser control clicks and animation frames, not VM execution.
await target.locator('#replay, #br').click();await page.waitForTimeout(350);record.afterReplay=await target.evaluate(()=>window.AG_NACHTPOST.getState());check(record.afterReplay.time>0&&record.afterReplay.playing,'replay must animate');
await target.locator('#play, #bp').click();const frozen=await target.evaluate(()=>window.AG_NACHTPOST.getState());await page.waitForTimeout(180);check((await target.evaluate(()=>window.AG_NACHTPOST.getState())).time===frozen.time,'pause must freeze');
await target.evaluate(()=>window.AG_NACHTPOST.seek(3));await settle(target);await target.locator('#next, #bn').click();await settle(target);check((await target.evaluate(()=>window.AG_NACHTPOST.getState())).time===8,'strict next timestamp');
await target.evaluate(()=>window.AG_NACHTPOST.seek(120));await settle(target);const endButton=target.locator('#next, #bn');record.endButtonDisabled=await endButton.isDisabled();
if(record.endButtonDisabled){await target.evaluate(()=>window.AG_NACHTPOST.step())}else{await endButton.click()}
await settle(target);record.end=await target.evaluate(()=>window.AG_NACHTPOST.getState());check(record.end.time===120&&!record.end.playing&&record.end.cost===.63,'end state mismatch');
if(process.env.VISUAL004==='1'){
record.canvas59=[];
for(let i=0;i<3;i++){if(i===2){await target.setContent(html,{waitUntil:'load'});await target.waitForFunction(()=>!!window.AG_NACHTPOST)}await target.evaluate(()=>{window.AG_NACHTPOST.pause();window.AG_NACHTPOST.seek(59)});await settle(target);const buffer=await target.locator('canvas').screenshot();const name=viewport.name+'-'+mode+'-canvas59-'+i+'.png';fs.writeFileSync(path.join(out,name),buffer);record.canvas59.push({file:name,sha256:crypto.createHash('sha256').update(buffer).digest('hex')})}
check(new Set(record.canvas59.map(x=>x.sha256)).size===1,'T09 canvas differs at paused t59 across seek/reload');
await target.evaluate(()=>{window.AG_NACHTPOST.seek(30);window.AG_NACHTPOST.play()});await page.waitForTimeout(10000);await target.evaluate(()=>window.AG_NACHTPOST.pause());await settle(target);record.motionInterval={from:30,to:(await target.evaluate(()=>window.AG_NACHTPOST.getState())).time};
}
await target.evaluate(()=>window.AG_NACHTPOST.seek(120));await settle(target);await page.screenshot({path:path.join(out,viewport.name+'-'+mode+'-120.png'),fullPage:true});record.screenshots.push(viewport.name+'-'+mode+'-120.png');check(!record.consoleErrors.length,'browser console/page errors');check(!record.networkAttempts.length,'unexpected network attempts');record.status='PASS';
}catch(e){record.status='FAIL';record.error=e.message;process.exitCode=1}finally{await context.close()}
}
})().catch(e=>{report.executionError=e.message;report.status='BLOCKED';process.exitCode=1}).finally(async()=>{if(browser)await browser.close();report.status??=report.cases.some(c=>c.status==='FAIL')?'FAIL':'PASS_WITH_LIMITS';fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2))});
