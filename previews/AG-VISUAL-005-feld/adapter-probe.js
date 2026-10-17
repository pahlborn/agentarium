const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
/* Ein Server, der GET /activity beantwortet -- so, wie der Adapter es
   erwartet. Nichts Erfundenes im Feld: Die Zeilen sind frei gewaehlte
   Probewerte, um zu sehen, OB es traegt. */
let stand = 'working';
const rows = () => ({ mode:'LIVE',
  provenance:{ source:'relay/agentarium_activity.py · Claude-CLI-Sitzungen' },
  coverage:{ status:'teilweise', note:'nur Rollen mit laufender Sitzung' },
  rows: [
  { agent:'atlas',     state:'working_observed', task_id:'AG-PILOT-001', session_id:'s1',
    last_evidence_at:new Date().toISOString(), evidence_ref:'run/1', remaining_valid_ms:8000 },
  { agent:'forge',     state: stand === 'working' ? 'working_observed' : 'blocked',
    task_id:'AG-PILOT-001', reason:'Guthaben', remaining_valid_ms:8000 },
  { agent:'sentinel',  state:'waiting',  task_id:'AG-PILOT-001', remaining_valid_ms:8000 },
  { agent:'archibald', state:'stopped',  outcome:'success' },
  { agent:'cadence',   state:'unknown' }
]});
(async () => {
  const wurzel = process.cwd();
  const srv = http.createServer((q,a) => {
    const u = q.url.split('?')[0];
    if (u === '/activity') { a.writeHead(200,{'Content-Type':'application/json'});
      return a.end(JSON.stringify(rows())); }
    const f = path.join(wurzel, u === '/' ? 'gebaut.html' : u.replace(/^\/+/,''));
    if (!fs.existsSync(f)) { a.writeHead(404); return a.end(); }
    a.writeHead(200,{'Content-Type': f.endsWith('.html')?'text/html;charset=utf-8':'application/octet-stream'});
    fs.createReadStream(f).pipe(a);
  });
  await new Promise(r => srv.listen(8111, r));

  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium',
    args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport:{width:1194,height:834} });
  const p = await ctx.newPage();
  const fehler = []; p.on('pageerror', e => fehler.push(String(e).split('\n')[0].slice(0,90)));
  let abrufe = 0; p.on('request', r => { if (r.url().includes('/activity')) abrufe++; });

  await p.goto('http://localhost:8111/?activity=1');
  await p.waitForTimeout(2500);
  // Auf LIVE stellen, wie ein Finger es taete.
  await p.click('#agKopf'); await p.waitForTimeout(400);
  for (const m of await p.$$('#agWas .wModi li'))
    if ((await m.textContent()).trim().toLowerCase() === 'live') await m.click();
  await p.waitForTimeout(600); await p.mouse.click(600,600); await p.waitForTimeout(3500);

  const lies = async () => p.evaluate(() => {
    const marken = [...document.querySelectorAll('.agName[data-akt]')].map(e => ({
      wer: e.textContent.trim(), zustand: e.getAttribute('data-akt'),
      text: e.getAttribute('data-akt-text'), titel: (e.getAttribute('title')||'').slice(0,60) }));
    return { marken, anzahl: marken.length,
             tafel: document.getElementById('agLive').classList.contains('auf'),
             tafelText: (document.getElementById('agLive').textContent||'').slice(-160) };
  });
  console.log('--- nach dem Umschalten auf live ---');
  const a1 = await lies();
  console.log('Abrufe /activity :', abrufe);
  console.log('Marken gesetzt   :', a1.anzahl);
  a1.marken.forEach(m => console.log('   ' + (m.wer+'').padEnd(11), (m.zustand+'').padEnd(18), JSON.stringify(m.text)));
  console.log('Tafel offen      :', a1.tafel);
  console.log('Tafelzusatz      :', JSON.stringify(a1.tafelText));
  await p.screenshot({ path:'probe-live.png' });

  // UEBERLEBT ES EIN NEUZEICHNEN DES RINGS? (Groessenwechsel)
  await p.setViewportSize({ width: 900, height: 700 }); await p.waitForTimeout(1600);
  const a2 = await lies();
  console.log('\nnach Groessenwechsel: Marken', a2.anzahl);

  // DECKEN SICH DIE NEUEN SCHILDER MIT ETWAS? Pseudo-Elemente sind nicht
  // messbar -- also messen wir, wie weit sie ueber den Namen hinausragen.
  const kollision = await p.evaluate(() => {
    const n = [...document.querySelectorAll('.agName')];
    const r = n.map(e => e.getBoundingClientRect());
    const treffer = [];
    /* Das Schild sitzt UEBER dem Namen, etwa 0,62em hoch plus 0,15em
       Abstand. Wir rechnen seinen Kasten und pruefen ihn gegen alle
       anderen Namen und gegen die Fussschilder. */
    n.forEach((e, i) => {
      if (!e.hasAttribute('data-akt')) return;
      const gr = parseFloat(getComputedStyle(e).fontSize);
      const h = gr * 0.62 * 1.2, abst = gr * 0.15;
      const txt = e.getAttribute('data-akt-text') || '';
      const br = txt.length * gr * 0.62 * 0.62;
      const k = { l: r[i].left + r[i].width/2 - br/2, r: r[i].left + r[i].width/2 + br/2,
                  t: r[i].top - abst - h, b: r[i].top - abst };
      n.forEach((f, j) => { if (i===j) return;
        if (!(k.r<=r[j].left || r[j].right<=k.l || k.b<=r[j].top || r[j].bottom<=k.t))
          treffer.push(txt + ' ueber ' + e.textContent.trim() + ' deckt Namen ' + f.textContent.trim()); });
      document.querySelectorAll('.agMot,.agTut,.agRuf').forEach(f => {
        const q = f.getBoundingClientRect();
        if (!(k.r<=q.left || q.right<=k.l || k.b<=q.top || q.bottom<=k.t))
          treffer.push(txt + ' ueber ' + e.textContent.trim() + ' deckt Schild "' + f.textContent.trim().slice(0,18) + '"'); });
    });
    return [...new Set(treffer)];
  });
  console.log('Ueberdeckungen   :', kollision.length ? kollision.join(' | ') : 'keine');
  console.log('Konsolenfehler   :', fehler.length ? [...new Set(fehler)].join(' | ') : 'keine');
  await b.close(); srv.close();
})();
