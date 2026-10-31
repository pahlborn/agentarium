/* #108: echte Kundenannahme schließt Atlas-Hauptaufgabe; eigener Abbruch entfernt exakt seinen Ball. Synthetische Offline- und Browserfälle, keine Produktivmutationen. */
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
    source_evidence: 'reported_checkpoint', source_tool_id: 'previews/AG-MON-ABSCHLUSS-108'
  }, ereignis);
  return { id: 9950000000 + nr, created_at: zeit,
           user: { login: 'pahlborn', id: 277496791 },
           body: '<!-- AGENTARIUM_EVENT_V1 -->\n```json\n' + JSON.stringify(e, null, 2) +
                 '\n```\nProbe aus AG-MON-ABSCHLUSS-108, kein echter Auftrag.' };
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
    r.fulfill({ status: 200, contentType: 'application/json',
                headers: { ETag: 'W/"ag-ball3-' + abrufe + '"' },
                body: JSON.stringify(antwortRef.liste) });
  });
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

// Synthetische Gegenbeispiele auf den unveränderten Produktfunktionen,
// keine echten Kundenannahmen oder Produktivjournal-Mutationen.
const adapter = fs.readFileSync(path.join(WURZEL,'github-live.js'),'utf8');
function original(name) {
  const start=adapter.indexOf('  function '+name+'(');
  if(start<0) throw Error('Originalfunktion fehlt: '+name);
  const end=adapter.indexOf('\n  function ',start+5);
  return adapter.slice(start,end<0?undefined:end);
}
const grenzen={fremdaussagen:0,selbstannahmen:0};
const fold=new Function('basisGrenzen','HALTERGEBUNDEN',"var BELEG_BASIS='https://github.com/pahlborn/agentarium/issues/2#issuecomment-';\n"+original('faltenZuZustand')+';return faltenZuZustand;')(grenzen,{received:1,started:1,delivered:1});
const balls=new Function(original('baelleFalten')+';return baelleFalten;')();
let seq=0;
function raw(kind,actor,reporter,extra={}) {
  const n=++seq;
  return {ev:{project_id:'agentarium',run_id:'AG-CLOSE108',task_id:'A',kind,actor,reporter,
    title:'synthetischer Test',occurred_at:String(n).padStart(5,'0'),selbstauskunft:actor===reporter,...extra},recorded_at:'',kommentar:n};
}
const base=()=>[raw('handoff','peter','atlas',{recipient:'atlas'}),raw('assigned','atlas','atlas',{recipient:'atlas'}),raw('contribution','atlas','atlas',{recipient:'peter'})];
for(const [name,event,tasks,bs] of [
  ['Peter nimmt Atlas an',()=>raw('accepted','peter','atlas'),0,0],
  ['Atlas-Selbstannahme wirkungslos',()=>raw('accepted','atlas','atlas'),1,1],
  ['Andere Fremdmeldung wirkungslos',()=>raw('accepted','peter','forge'),1,1],
  ['Wahrer eigener Abbruch',()=>raw('aborted','atlas','atlas'),0,0],
  ['Fremdgemeldeter Abbruch wirkungslos',()=>raw('aborted','atlas','forge'),1,1],
  ['Andere Aufgabe bleibt',()=>raw('aborted','atlas','atlas',{task_id:'B'}),1,1]
]) {
  const xs=base().concat(event());
  zeile(name+' / Aufgaben',fold(xs).offen?.length ?? fold(xs).length,tasks);
  zeile(name+' / Bälle',balls(xs).length,bs);
}
const child=[raw('assigned','atlas','atlas',{recipient:'atlas',parent_id:'PARENT'}),raw('accepted','peter','atlas')];
zeile('Peter-Ausnahme gilt nicht für Atlas-Teilaufgabe',fold(child).offen?.length ?? fold(child).length,1);
const other=base().concat(raw('handoff','peter','atlas',{task_id:'B',recipient:'scout'}),raw('aborted','atlas','atlas',{task_id:'B'}));
zeile('Fremder Auftragnehmer bleibt',balls(other).length,2);
if(process.argv.includes('--offline')) process.exit(fehler?1:0);

(async()=>{
  let chromium;try{chromium=require('playwright').chromium;}catch(e){}
  const br=chromiumPfad(chromium);if(br.grund)ungeprueft(br.grund);
  const b=await chromium.launch({executablePath:br.pfad,args:['--no-sandbox','--disable-dev-shm-usage']});
  const tisch=await tischen(WURZEL);
  function lifecycle(z,A,kind,actor,reporter,extra={}) {
    return kommentar(z,{run_id:'AG-C108-BROWSER',task_id:A,kind,actor,reporter,title:'Synthetischer Abschluss '+A,...extra});
  }
  const open=(A,min)=>[anstoss(vor(min),'AG-C108-BROWSER',A),lifecycle(vor(min-1),A,'assigned','atlas','atlas',{recipient:'atlas'}),abschluss(vor(min-2),'AG-C108-BROWSER',A)];
  try {
    for(const viewport of [{width:834,height:1194},{width:1194,height:834}]) {
      const response={liste:[...open('ACCEPT',50),annahme(vor(46),'AG-C108-BROWSER','ACCEPT'),...open('ABORT',40),lifecycle(vor(36),'ABORT','aborted','atlas','atlas'),...open('SELF',30),lifecycle(vor(26),'SELF','accepted','atlas','atlas'),...open('LIVE',20),...open('LIVEACCEPT',10)]};
      const a=await seite(b,tisch,response,viewport);let st=await stand(a.s);
      const taskIds=x=>(x.aufgaben||[]).map(t=>t.aufgabe).sort().join(',');
      zeile('Restore / Aufgaben '+viewport.width,taskIds(st),'LIVE,LIVEACCEPT,SELF');
      zeile('Restore / Bälle '+viewport.width,liegendText(st),'LIVE@peter,LIVEACCEPT@peter,SELF@peter');
      zeile('Restore ohne Flug '+viewport.width,(st.fliegend||[]).length,0);
      response.liste.push(lifecycle(jetzt(),'LIVE','aborted','atlas','atlas'),annahme(jetzt(),'AG-C108-BROWSER','LIVEACCEPT'));
      st=await bisLage(a.s,(x,y)=>!x.includes('LIVE@')&&!taskIds(y).includes('LIVE'),8000);
      zeile('Live / exakt eigener Abbruch '+viewport.width,liegendText(st),'SELF@peter');
      zeile('Live / Aufgabe weg '+viewport.width,taskIds(st),'SELF');
      // Reale Antippbedienung des Monitorfachs, kein Hover erforderlich.
      await a.s.click('#agGhAuf summary');
      zeile('Tippen ohne Seitenfehler '+viewport.width,a.seitenFehler.length,0);
      await a.s.screenshot({path:path.join(AUFNAHMEN,'abschluss-'+viewport.width+'.png')});
      await a.q.close();
      const reload=await seite(b,tisch,response,viewport);st=await stand(reload.s);
      zeile('Nach Wiederverbinden identisch '+viewport.width,liegendText(st),'SELF@peter');
      zeile('Nach Wiederverbinden Aufgaben '+viewport.width,taskIds(st),'SELF');
      zeile('Keine Seitenfehler '+viewport.width,reload.seitenFehler.length,0);
      await reload.s.click('#agKopf');
      await reload.s.click('#agWas li[data-modus="archiv"]');
      await reload.s.waitForFunction(()=>window.__agGithub.stand().archiv.leiste);
      const archived=await reload.s.evaluate(()=>{
        const el=document.getElementById('agLeiste'),r=el.getBoundingClientRect();
        const opt={bubbles:true,cancelable:true,pointerId:9,pointerType:'touch',isPrimary:true,clientX:r.right-1,clientY:r.top+r.height/2};
        el.dispatchEvent(new PointerEvent('pointerdown',opt));el.dispatchEvent(new PointerEvent('pointerup',opt));
        return window.__agStand();
      });
      zeile('Archivsprung / Bälle '+viewport.width,liegendText(archived),'SELF@peter');
      zeile('Archivsprung / Aufgaben '+viewport.width,taskIds(archived),'SELF');
      await reload.q.close();
    }
  } finally {await b.close();tisch.s.close();}
  process.exit(fehler?1:0);
})().catch(e=>{console.error(e);process.exit(2);});

