/* AG-MON-VERTRETUNG-001: eindeutige Übernahme, sichtbare Blockade und unabhängige Actionsanzeige. Synthetische Aufgaben; öffentliche Actionsquelle rein lesend. */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os');

const ZIEL = process.env.AG_ZIEL || 'pilot/github-live';
const WURZEL = path.resolve(__dirname, '..', '..', ...ZIEL.split('/'));
const AUFNAHMEN = process.env.AG_AUFNAHMEN ||
  fs.mkdtempSync(path.join(os.tmpdir(), 'ag-ballspiel-3-'));
const VERZEICHNIS = {
  schema: 'agentarium.projektverzeichnis.v1', gepflegt_von: 'atlas',
  projekte: [{ id: 'agentarium', kuerzel: 'AG', name: 'Agentarium', repo: 'pahlborn/agentarium' }]
};

let fehler = 0;
function zeile(w, ist, soll) {
  const ok = ist === soll;
  if (!ok) fehler++;
  console.log('  ' + (ok ? 'ok  ' : 'FEHL') + '  ' + w.padEnd(52) +
              String(ist).padEnd(30) + (ok ? '' : '(erwartet ' + soll + ')'));
}
function ungeprueft(grund) { console.log('\nUNGEPRÜFT: ' + grund); process.exit(2); }

function ausfuehrbareDatei(p) {
  if (!p) return false;
  try {
    const s = fs.statSync(p);
    if (!s.isFile()) return false;
    fs.accessSync(p, fs.constants.X_OK);
    return true;
  } catch (e) { return false; }
}
function chromiumPfad(chromium) {
  if (!chromium) return { grund: 'playwright fehlt, daher ist kein Browser zu starten' };
  const g = process.env.AG_CHROMIUM;
  if (g) return ausfuehrbareDatei(g) ? { pfad: g }
    : { grund: 'AG_CHROMIUM zeigt nicht auf eine ausfuehrbare Datei: ' + g };
  let p = null;
  try { p = chromium.executablePath(); } catch (e) {
    return { grund: 'playwright meldet keinen Browserpfad: ' + e.message };
  }
  return ausfuehrbareDatei(p) ? { pfad: p }
    : { grund: 'von playwright gemeldete Datei fehlt oder ist nicht ausfuehrbar: ' + p };
}

const TYPEN = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
                '.json': 'application/json', '.png': 'image/png',
                '.webmanifest': 'application/manifest+json' };
function tischen(wurzel) {
  return new Promise(r => {
    const s = http.createServer((q, a) => {
      const rein = decodeURIComponent(q.url.split('?')[0]);
      const f = path.join(wurzel, rein === '/' ? 'index.html' : rein);
      if (!f.startsWith(wurzel)) { a.writeHead(403).end(); return; }
      fs.readFile(f, (e, d) => {
        if (e) { a.writeHead(404).end(); return; }
        a.writeHead(200, { 'Content-Type': TYPEN[path.extname(f)] || 'application/octet-stream' });
        a.end(d);
      });
    });
    s.listen(0, '127.0.0.1', () => r({ s, adr: 'http://127.0.0.1:' + s.address().port + '/' }));
  });
}

let nr = 0;
function kommentar(zeit, ereignis) {
  nr++;
  const e = Object.assign({
    schema: 'agentarium.github-event.v1', id: 'AG-BALL3-EREIGNIS-' + nr,
    project_id: 'agentarium', occurred_at: zeit, reporter: 'atlas',
    source_evidence: 'reported_checkpoint', source_tool_id: 'previews/AG-MON-VERTRETUNG-001'
  }, ereignis);
  return { id: 9950000000 + nr, created_at: zeit,
           user: { login: 'pahlborn', id: 277496791 },
           body: '<!-- AGENTARIUM_EVENT_V1 -->\n```json\n' + JSON.stringify(e, null, 2) +
                 '\n```\nProbe aus AG-MON-VERTRETUNG-001, kein echter Auftrag.' };
}
/* Die Bausteine der Meldeanweisung, je Lauf eine Aufgabe. */
const anstoss = (z, L, A) => kommentar(z, { run_id: L, task_id: A, kind: 'handoff',
  actor: 'peter', recipient: 'atlas', title: 'Peter gibt Atlas ' + A + '.' });
const abschluss = (z, L, A, von) => kommentar(z, { run_id: L, task_id: A, kind: 'contribution',
  actor: von || 'atlas', recipient: 'peter', reporter: von || 'atlas',
  title: (von || 'atlas') + ' gibt Peter ' + A + '.' });
const annahme = (z, L, A, melder) => kommentar(z, { run_id: L, task_id: A, kind: 'accepted',
  actor: 'peter', reporter: melder || 'atlas', title: 'Peter nimmt ' + A + ' an.' });

const vor = (min) => new Date(Date.now() - min * 60000).toISOString();
const jetzt = () => new Date().toISOString();
const stand = (s) => s.evaluate(() => (window.__agStand && window.__agStand()) || {});
const gh = (s) => s.evaluate(() => (window.__agGithub && window.__agGithub.stand()) || {});
const liegendText = (st) => (st.liegend || [])
  .map(l => l.aufgabe + '@' + l.bei + (l.teil ? '·t' : '')).sort().join(',');

async function bisLage(s, pruef, ms) {
  let st = {};
  for (let t = 0; t < ms; t += 120) {
    st = await stand(s);
    if (pruef(liegendText(st), st)) break;
    await s.waitForTimeout(120);
  }
  await s.waitForTimeout(300);
  return await stand(s);
}
async function flug(s, von, an, ms) {
  let gefunden = null;
  for (let t = 0; t < ms; t += 80) {
    const st = await stand(s);
    const f = (st.fliegend || []).find(x => x.von === von && x.an === an);
    if (f && !gefunden) gefunden = f;
    if (gefunden && !f) break;
    await s.waitForTimeout(80);
  }
  await s.waitForTimeout(500);
  return gefunden;
}

async function seite(b, tisch, antwortRef, viewport) {
  const q = await b.newContext({ viewport: viewport || { width: 1194, height: 834 }, hasTouch: true });
  const s = await q.newPage();
  const seitenFehler = [];
  s.on('pageerror', e => seitenFehler.push(String(e.message).slice(0, 110)));
  let abrufe = 0;
  await s.route('**/projekte/verzeichnis.json', r => r.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify(VERZEICHNIS) }));
  await s.route('**api.github.com/**', r => {
    abrufe++;
    // Genau ein öffentlicher Actions-GET je Darstellung: ohne Testtoken, keine Modellaufrufe.
    if(r.request().url().includes('/actions/runs') && process.env.AG_REAL_ACTIONS !== '0')
      return r.continue({headers:{Accept:'application/vnd.github+json'}});
    r.fulfill({ status: 200, contentType: 'application/json',
                headers: { ETag: 'W/"ag-ball3-' + abrufe + '"' },
                body: JSON.stringify(r.request().url().includes('/actions/runs') ? antwortRef.actions : antwortRef.liste) });
  });
  s.on('response',async response=>{if(response.url().includes('/actions/runs')&&response.ok()){
    try{antwortRef.realActions=await response.json();}catch(e){} }});
  await s.goto(tisch.adr + '?live=github', { waitUntil: 'load' });
  await s.waitForTimeout(2200);
  if (!await s.evaluate(() => !!document.getElementById('agGhToken')))
    ungeprueft('kein Livefach — ohne WebGL kein Monitor');
  await s.fill('#agGhToken', 'AGBALLSPIEL003_Scheintoken_0123456789ab');
  await s.click('#agGhAn');
  await s.waitForTimeout(3500);
  await s.evaluate(() => { const d = document.getElementById('agGhAuf'); if (d) d.open = false; });
  return { q, s, seitenFehler };
}

// Getrennte Quellen: synthetische Journalfälle; echte Actions-Quellwerte aus gespeichertem Snapshot.
let api=require(path.join(WURZEL,'work-status.js'));
if(process.env.AG_MUTATE_TRANSFER==='1') {
  const code=fs.readFileSync(path.join(WURZEL,'work-status.js'),'utf8').replace('state.holder !== e.previous_holder ||','');
  const box={exports:{}};new Function('module',code)(box);api=box.exports;
}
const adapter=fs.readFileSync(path.join(WURZEL,'github-live.js'),'utf8');
function original(name){const a=adapter.indexOf('  function '+name+'('),b=adapter.indexOf('\n  function ',a+5);return adapter.slice(a,b<0?undefined:b);}
const limits={fremdaussagen:0,selbstannahmen:0,konflikte:0};
const fold=new Function('window','basisGrenzen','HALTERGEBUNDEN',"var BELEG_BASIS='https://api.github.com/repos/pahlborn/agentarium/issues/comments/';\n"+original('faltenZuZustand')+';return faltenZuZustand;')({__agWorkStatus:api},limits,{received:1,started:1,delivered:1});
const balls=new Function('window',original('baelleFalten')+';return baelleFalten;')({__agWorkStatus:api});
let seq=0;
const baseEvent=(kind,actor,reporter,extra={})=>({schema:'agentarium.github-event.v1',id:'AG-VERT-E'+(++seq),project_id:'agentarium',run_id:'AG-VERT-R',task_id:'AG-VERT-T',parent_id:'AG-VERT-MAIN',kind,actor,reporter,title:'Synthetischer Vertretungsfall',occurred_at:new Date(Date.now()-600000+seq*1000).toISOString(),source_evidence:'reported_checkpoint',source_tool_id:'AG-MON-VERTRETUNG-001',...extra});
const raw=e=>({ev:{...e,selbstauskunft:e.actor===e.reporter},recorded_at:e.occurred_at,kommentar:seq});
const start=()=>[baseEvent('handoff','atlas','atlas',{recipient:'forge'}),baseEvent('assigned','atlas','atlas',{recipient:'forge'}),baseEvent('started','forge','forge'),baseEvent('blocked','atlas','atlas',{recipient:'forge',blocker_id:'OFFLINE'})];
const move=extra=>baseEvent('reassigned','atlas','atlas',{recipient:'springer',previous_holder:'forge',checkpoint_ref:'no-checkpoint',stop_ref:'https://github.com/pahlborn/agentarium/actions/runs/41222672090',...extra});
const normal=start(), change=move();
zeile('Übernahme exakt gleichen Tasks',fold(normal.concat(change).map(raw))[0].wer,'springer');
zeile('Übernahme behauptet keinen Beginn',fold(normal.concat(change).map(raw))[0].zustand,'zugewiesen');
zeile('Aufgabe bleibt genau einmal',fold(normal.concat(change).map(raw)).length,1);
zeile('Teilball bleibt genau einmal',balls(normal.concat(change).map(raw)).length,1);
zeile('Teilball liegt beim Vertreter',balls(normal.concat(change).map(raw))[0].bei,'springer');
for(const [name,extra] of [['falscher alter Halter',{previous_holder:'scout'}],['Parentwechsel',{parent_id:'ANDERS'}],['Typwechsel',{item_type:'story'}],['Stop fehlt',{stop_ref:''}],['fremder Link',{stop_ref:'https://evil.example/stop'}],['falscher Melder',{reporter:'forge'}]])
 zeile(name+' wird abgewiesen',fold(normal.concat(move(extra)).map(raw))[0].wer,'forge');
const delayed=['blocked','resolved','received','started','delivered','aborted','assigned'].map(k=>baseEvent(k,k==='assigned'?'atlas':'forge',k==='assigned'?'atlas':'forge',{...(k==='assigned'?{recipient:'forge'}:{}),...(['blocked','resolved'].includes(k)?{blocker_id:'OFFLINE'}:{})}));
delayed.push(baseEvent('handoff','atlas','atlas',{recipient:'forge'}));
delayed.push(baseEvent('handoff','atlas','atlas',{recipient:'scout'}));
delayed.push(baseEvent('contribution','forge','forge',{recipient:'peter'}));
const final=normal.concat(change,...delayed);
zeile('Alte/fremde handoff-Empfänger erzeugen keinen zweiten Ball',balls(final.map(raw)).length,1);
zeile('Alte contribution zu Peter bewegt Vertreterball nicht',balls(final.map(raw))[0].bei,'springer');
zeile('Verspätete alte Meldungen ändern Halter nicht',fold(final.map(raw))[0].wer,'springer');
zeile('Verspäteter Abbruch schließt Vertreter nicht',fold(final.map(raw)).length,1);
zeile('Übernommene Sachblockade bleibt explizit',fold(final.map(raw))[0].klemmt.length,1);
zeile('Kein Transfer eines Peter-Hauptballs',api.transfer({holder:'atlas',parent:''},{...change,previous_holder:'atlas',parent_id:''}),null);
const snapshot=JSON.parse(fs.readFileSync(path.join(__dirname,'actions-source.json'),'utf8'));
zeile('Echter Actions-Snapshot enthält Fehler',snapshot.workflow_runs.some(r=>api.runView('pahlborn/agentarium',r)?.conclusion==='failure'),true);
zeile('Fremder html_url nicht anklickbar',api.runView('pahlborn/agentarium',{id:1,name:'X',status:'completed',html_url:'https://evil.example'}),null);
const timecheck=require('child_process').spawnSync(process.execPath,[path.join(__dirname,'timecheck.js')],{encoding:'utf8'});
if(timecheck.stdout)process.stdout.write(timecheck.stdout);if(timecheck.stderr)process.stderr.write(timecheck.stderr);
zeile('HTTP403-Anzeigezeit ist keine Backoff-Zukunft',timecheck.status,0);
if(process.argv.includes('--offline'))process.exit(fehler?1:0);
(async()=>{
 let chromium;try{chromium=require('playwright').chromium;}catch(e){}
 const br=chromiumPfad(chromium);if(br.grund)ungeprueft(br.grund);
 const b=await chromium.launch({executablePath:br.pfad,args:['--no-sandbox','--disable-dev-shm-usage']});
 const tisch=await tischen(WURZEL);
 const comment=e=>({id:9960000000+(++nr),created_at:e.occurred_at,user:{login:'pahlborn'},body:'<!-- AGENTARIUM_EVENT_V1 -->\n```json\n'+JSON.stringify(e)+'\n```'});
 try{for(const viewport of [{width:834,height:1194},{width:1194,height:834}]){
   const waiting=[baseEvent('handoff','atlas','atlas',{recipient:'scout',task_id:'AG-VERT-WAIT'}),baseEvent('assigned','atlas','atlas',{recipient:'scout',task_id:'AG-VERT-WAIT'})];
   const response={liste:normal.concat(waiting).map(comment),actions:snapshot};
   const a=await seite(b,tisch,response,viewport);
   await a.s.waitForFunction(()=>document.querySelector('.agWorkBadge.blocked'));
   zeile('Blockade sichtbar '+viewport.width,await a.s.locator('.agWorkBadge.blocked').count(),1);
   zeile('Zugewiesener Ball zeigt Warteuhr '+viewport.width,await a.s.locator('.agWorkBadge.waiting').count(),1);
   zeile('Warteuhr ist ohne Hover sichtbar '+viewport.width,await a.s.locator('.agWorkBadge.waiting').isVisible(),true);
   await a.s.click('.agWorkBadge.waiting');
   const waitingText=await a.s.locator('#agWorkDetail').innerText();
   zeile('Warten behauptet keinen Ausfall '+viewport.width,waitingText.includes('Start noch nicht gemeldet')&&waitingText.includes('Keine Ausfallbehauptung'),true);
   await a.s.click('.agWorkBadge.blocked');
   zeile('Tap zeigt Grund und Quelle '+viewport.width,(await a.s.locator('#agWorkDetail').innerText()).includes('OFFLINE'),true);
   await a.s.locator('#agRunStatus summary').click();
   if(process.env.AG_REAL_ACTIONS !== '0'){
     zeile('Echter öffentlicher Actions-GET '+viewport.width,!!response.realActions?.workflow_runs?.length,true);
     const actual=(response.realActions?.workflow_runs||[]).slice(0,5).map(r=>api.runView('pahlborn/agentarium',r)).filter(Boolean);
     zeile('Echte API-Läufe gerendert '+viewport.width,await a.s.locator('#agRunStatus a').count(),actual.length);
     const shown=await a.s.locator('#agRunStatus a').allTextContents();
     zeile('Konkreter echter Runlink sichtbar '+viewport.width,actual.length>0&&await a.s.locator('#agRunStatus a').first().isVisible(),true);
     zeile('Sichtbarer Status entspricht echtem API-Ergebnis '+viewport.width,actual.every(r=>shown.includes('pahlborn/agentarium · '+r.text)),true);
     console.log('  Quelle: öffentlicher Live-GET, Run-IDs '+actual.map(r=>r.id).join(',')+'; kein Agentenlauf ausgelöst.');
   } else zeile('Actions-Quellsnapshot gerendert '+viewport.width,await a.s.locator('#agRunStatus a').count(),snapshot.workflow_runs.length);
   // Kleiner Fehler-/Recoveryfall: echte HTTP403-Antwort im kontrollierten Actionskanal.
   // Disconnect/Reconnect hebt den Backoff nur durch die ausdrückliche Bedienhandlung auf.
   if(viewport.width===834){
     const actionsURL='https://api.github.com/repos/pahlborn/agentarium/actions/runs?per_page=5';
     const denied=r=>r.fulfill({status:403,contentType:'application/json',body:JSON.stringify({message:'Synthetic permission failure'})});
     const taskShape=async()=>a.s.evaluate(()=>window.__agStand().aufgaben.map(t=>[t.aufgabe,t.wer,t.zustand]).sort().join('|'));
     const before=await taskShape();
     async function reconnect(){
       await a.s.evaluate(()=>document.getElementById('agGhAuf').open=true);
       await a.s.click('#agGhAus');await a.s.fill('#agGhToken','AGVERTRETUNG_Scheintoken_0123456789ab');await a.s.click('#agGhAn');
     }
     await a.s.route(actionsURL,denied);await reconnect();
     await a.s.waitForFunction(()=>document.getElementById('agRunStatus').textContent.includes('Status unbekannt'));
     await a.s.evaluate(()=>document.getElementById('agRunStatus').open=true);
     zeile('HTTP403 wird sichtbar unbekannt',await a.s.locator('#agRunStatus').isVisible()&&(await a.s.locator('#agRunStatus').innerText()).includes('Status unbekannt'),true);
     zeile('HTTP403 schließt keine fachliche Aufgabe',await taskShape(),before);
     await a.s.unroute(actionsURL,denied);await reconnect();
     await a.s.waitForFunction(()=>document.querySelectorAll('#agRunStatus a').length>0);
     await a.s.evaluate(()=>document.getElementById('agRunStatus').open=true);
     zeile('Wiederverbinden ersetzt Lesefehler durch Quelle',await a.s.locator('#agRunStatus a').first().isVisible()&&!(await a.s.locator('#agRunStatus').innerText()).includes('Status unbekannt'),true);
     zeile('Erholter technischer Lauf schließt keine Aufgabe',await taskShape(),before);
     await a.s.evaluate(()=>document.getElementById('agGhAuf').open=false);
   }
   const live={...change,id:'AG-VERT-LIVE-'+viewport.width,occurred_at:new Date().toISOString()};response.liste.push(comment(live));
   await a.s.waitForFunction(()=>window.__agStand().aufgaben.some(t=>t.wer==='springer'));
   let st=await stand(a.s);zeile('Live atomarer Taskwechsel '+viewport.width,st.aufgaben.filter(x=>x.aufgabe==='AG-VERT-T').length,1);
   zeile('Live atomarer Ballwechsel '+viewport.width,st.liegend.filter(x=>x.aufgabe==='AG-VERT-T')[0]?.bei,'springer');
   response.liste.push(...delayed.map(e=>comment({...e,id:e.id+'-LIVE-'+viewport.width,occurred_at:new Date().toISOString()})));
   await a.s.waitForTimeout(2600);st=await stand(a.s);zeile('Alte Events wirkungslos '+viewport.width,st.aufgaben.find(x=>x.aufgabe==='AG-VERT-T')?.wer,'springer');
   zeile('Live alter handoff erzeugt keinen Zusatzball '+viewport.width,st.liegend.filter(x=>x.aufgabe==='AG-VERT-T').length,1);
   zeile('Keine Seitenfehler '+viewport.width,a.seitenFehler.length,0);
   await a.s.emulateMedia({reducedMotion:'reduce'});
   zeile('Reduced motion stoppt Puls '+viewport.width,await a.s.locator('.agWorkBadge.blocked').evaluate(e=>getComputedStyle(e,'::before').animationName),'none');
   await a.s.screenshot({path:path.join(AUFNAHMEN,'vertretung-'+viewport.width+'.png')});
   await a.q.close();
   const reload=await seite(b,tisch,response,viewport);st=await stand(reload.s);
   zeile('Restore identischer Halter '+viewport.width,st.aufgaben.find(x=>x.aufgabe==='AG-VERT-T')?.wer,'springer');
   zeile('Restore identischer Ball '+viewport.width,st.liegend.find(x=>x.aufgabe==='AG-VERT-T')?.bei,'springer');
   zeile('Restore identische Transferhistory '+viewport.width,st.aufgaben.find(x=>x.aufgabe==='AG-VERT-T')?.vertretungen?.length,1);
   if(viewport.width===834){
     await reload.s.click('#agKopf');await reload.s.click('#agWas li[data-modus="archiv"]');
     await reload.s.waitForFunction(()=>window.__agGithub.stand().archiv.leiste);
     const archived=await reload.s.evaluate(()=>{
       const el=document.getElementById('agLeiste'),r=el.getBoundingClientRect();
       const opt={bubbles:true,cancelable:true,pointerId:9,pointerType:'touch',isPrimary:true,clientX:r.right-1,clientY:r.top+r.height/2};
       el.dispatchEvent(new PointerEvent('pointerdown',opt));el.dispatchEvent(new PointerEvent('pointerup',opt));return window.__agStand();
     });
     zeile('Archivende behält Vertreter '+viewport.width,archived.aufgaben.find(x=>x.aufgabe==='AG-VERT-T')?.wer,'springer');
     zeile('Archivende hat genau einen Teilball '+viewport.width,archived.liegend.filter(x=>x.aufgabe==='AG-VERT-T').length,1);
   }
   await reload.q.close();
 }}finally{await b.close();tisch.s.close();}
 process.exit(fehler?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
