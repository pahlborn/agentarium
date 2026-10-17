'use strict';
// Atlas test executor: already-open ORIGINAL -> real event -> visible pixels.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const OUT = process.env.BALL_REAL_OUT;
const save = (name, obj) => fs.writeFileSync(path.join(OUT, name), JSON.stringify(obj, null, 2));
(async () => {
  let browser;
  try {
    browser = await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
    const page = await browser.newPage({viewport:{width:1280,height:800}});
    let navigations = 0;
    const errors = [];
    page.on('framenavigated', f => {if(f === page.mainFrame()) navigations++;});
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(process.env.BALL_VIEW_URL,{waitUntil:'load',timeout:30000});
    await page.waitForFunction(() => window.__agBallLive?.state === 'verbunden',null,{timeout:30000});
    const marker = await page.evaluate(() => {
      window.__ballRealMarker = 'same-page';
      return {time_origin:performance.timeOrigin,accepted:window.__agBallLive.accepted.slice(),version:window.__agBallLive.version};
    });
    if(marker.accepted.length) throw Error('Fresh real-source page already contains events');
    save('browser-ready.json',{url:page.url(),navigations,marker,wall_ms:Date.now()});
    const id = process.env.BALL_REAL_EVENT_ID;
    await page.waitForFunction(i => window.__agBallLive.accepted.includes(i),id,{timeout:120000,polling:20});
    await page.waitForFunction(i => {
      const B = window.__agBallLive;
      return B.last?.id === i && B.last.browser_painted_wall_ms &&
        document.getElementById('agLaeuft')?.innerText.includes(B.last.title);
    },id,{timeout:15000});
    const before = await (await fetch(process.env.BALL_WITNESS_URL)).json();
    const visible = await page.evaluate(() => {
      const p=document.getElementById('agBallLive');
      const r=p.getBoundingClientRect();
      return {text:p.innerText,width:r.width,height:r.height,provenance:p.dataset.provenance,
        event_id:p.dataset.eventId,original_list:document.getElementById('agLaeuft').innerText,
        state:window.__agBallLive.last,accepted:window.__agBallLive.accepted.slice(),
        time_origin:performance.timeOrigin,marker:window.__ballRealMarker,
        navigation_entries:performance.getEntriesByType('navigation').length};
    });
    await page.screenshot({path:path.join(OUT,'real-original-full.png')});
    await page.locator('#agBallLive').screenshot({path:path.join(OUT,'real-original-event.png')});
    const after = await (await fetch(process.env.BALL_WITNESS_URL)).json();
    const passed = before.alive && after.alive && !before.terminal_seen && !after.terminal_seen &&
      visible.event_id === id && visible.provenance === 'runtime_stream' &&
      visible.text.includes(id) && visible.original_list.includes(visible.state.title) &&
      visible.width>0 && visible.height>0 && navigations===1 &&
      marker.time_origin===visible.time_origin && visible.marker==='same-page' &&
      visible.navigation_entries===1 && errors.length===0;
    save('browser-real-result.json',{verdict:passed?'PASS':'FAIL',browser:browser.version(),
      event_id:id,navigations,before,after,visible,errors,ready:marker,wall_ms:Date.now()});
    if(!passed) throw Error('Real-source browser criteria failed');
  } catch(e) {
    save('browser-error.json',{error:String(e.stack||e)});
    process.exitCode=1;
  } finally {
    if(browser) await browser.close();
  }
})();
