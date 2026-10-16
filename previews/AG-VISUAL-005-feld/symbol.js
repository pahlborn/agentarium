const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const n of [512, 192, 180, 152, 120]) {
    const p = await b.newPage({ viewport: { width: n, height: n }, deviceScaleFactor: 1 });
    await p.goto('file://' + process.cwd() + '/symbol.html');
    await p.evaluate(s => { const e = document.getElementById('s');
      e.setAttribute('width', s); e.setAttribute('height', s); }, n);
    await p.waitForTimeout(200);
    await p.screenshot({ path: 'icon-' + n + '.png', clip: {x:0,y:0,width:n,height:n} });
    await p.close();
    console.log('icon-' + n + '.png');
  }
  await b.close();
})();
