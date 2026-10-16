const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const TYP = {'.html':'text/html;charset=utf-8', '.js':'text/javascript;charset=utf-8',
  '.webmanifest':'application/manifest+json', '.png':'image/png'};
(async () => {
  const wurzel = path.join(process.cwd(), 'pages');
  const srv = http.createServer((q, a) => {
    let p = q.url.split('?')[0];
    if (p === '/' || p === '/feld/') p = '/index.html';
    const f = path.join(wurzel, p.replace(/^\/+/, ''));
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { a.writeHead(404); return a.end(); }
    /* Wie GitHub Pages: zehn Minuten HTTP-Vorrat. */
    a.writeHead(200, {'Content-Type': TYP[path.extname(f)] || 'application/octet-stream',
                      'Cache-Control': 'max-age=600'});
    fs.createReadStream(f).pipe(a);
  });
  await new Promise(r => srv.listen(8099, r));

  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
    args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 834, height: 1194 } });
  const p = await ctx.newPage();
  const fremd = [];
  p.on('request', r => { const u = new URL(r.url());
    if (u.hostname !== 'localhost' && u.protocol !== 'data:' && u.protocol !== 'blob:')
      fremd.push(r.url()); });

  await p.goto('http://localhost:8099/');
  await p.waitForTimeout(3000);
  const a1 = await p.evaluate(async () => {
    const r = await navigator.serviceWorker.ready.then(() => true).catch(() => false);
    const m = document.querySelector('link[rel=manifest]');
    const mj = m ? await fetch(m.href).then(x => x.json()).catch(() => null) : null;
    return { arbeiter: r, manifest: mj && mj.name, anzeige: mj && mj.display,
             symbole: mj ? mj.icons.length : 0,
             titel: document.title,
             appfaehig: !!document.querySelector('meta[name="apple-mobile-web-app-capable"]') };
  });
  const vorrat = await p.evaluate(async () => {
    const k = await caches.keys();
    const v = await caches.open(k[0]);
    return { namen: k, stuecke: (await v.keys()).length };
  });

  /* JETZT OFFLINE: Server aus, neu laden. */
  await new Promise(r => srv.close(r));
  await ctx.setOffline(true);
  let offlineOk = false, agenten = 0;
  try {
    await p.goto('http://localhost:8099/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await p.waitForTimeout(2500);
    agenten = await p.evaluate(() => document.querySelectorAll('.agName').length);
    offlineOk = agenten === 9;
  } catch (e) { offlineOk = false; }

  console.log('Arbeiter angemeldet :', a1.arbeiter);
  console.log('Manifest            :', a1.manifest, '·', a1.anzeige, '·', a1.symbole, 'Symbole');
  console.log('Vollbild-Kennung    :', a1.appfaehig);
  console.log('Vorrat              :', a1 && vorrat.namen.join(','), '·', vorrat.stuecke, 'Stücke');
  console.log('Abrufe nach draußen :', fremd.length ? fremd.join(', ') : 'keine');
  console.log('OFFLINE geladen     :', offlineOk ? 'ja, ' + agenten + ' Agenten im Bild' : 'NEIN');
  await b.close();
})();
