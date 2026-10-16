const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
    args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport:{width:1363,height:936} });
  /* GENAU DIE LAGE DES PRUEFERS: kein WebGL. Nicht nachgestellt durch
     Abschalten der Grafik, sondern an der Stelle, an der die Maschine es
     merkt -- getContext gibt nichts zurueck. */
  await ctx.addInitScript(() => {
    const echt = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (art, o) {
      if (String(art).indexOf('webgl') === 0) return null;
      return echt.call(this, art, o);
    };
  });
  const p = await ctx.newPage();
  const fehler = [];
  p.on('pageerror', e => fehler.push(String(e).split('\n')[0].slice(0,100)));
  p.on('console', m => { if (m.type() === 'error') fehler.push('console: ' + m.text().slice(0,90)); });
  await p.goto('file://' + process.cwd() + '/agentarium-fertig.html');
  await p.waitForTimeout(3000);
  const s = await p.evaluate(() => ({
    hinweis: (document.getElementById('hinweis')||{}).textContent,
    feldDa: !!window.__feld,
    namen: document.querySelectorAll('.agName').length }));
  console.log('Hinweistext :', JSON.stringify(s.hinweis));
  console.log('__feld da   :', s.feldDa);
  console.log('Namen       :', s.namen);
  console.log('Fehler      :', fehler.length);
  [...new Set(fehler)].slice(0,6).forEach(f => console.log('   ' + f));
  await b.close();
})();
