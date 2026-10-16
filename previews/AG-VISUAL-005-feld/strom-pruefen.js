const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
    args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport:{width:1194,height:834} })).newPage();
  const fehler = []; p.on('pageerror', e => fehler.push(String(e).slice(0,90)));
  await p.goto('file://' + process.cwd() + '/agentarium-fertig.html');
  await p.waitForTimeout(2500);

  const lies = async () => p.evaluate(() => ({
    strom: document.body.getAttribute('data-strom'),
    punktSichtbar: getComputedStyle(document.getElementById('agPuls')).display !== 'none',
    punktHohl: getComputedStyle(document.getElementById('agPuls')).backgroundColor === 'rgba(0, 0, 0, 0)',
    wort: document.getElementById('agStromWort').textContent,
    tafel: document.getElementById('agLive').classList.contains('auf'),
    stand: window.__agStrom.stand() }));

  const zeile = (was, s) => console.log(was.padEnd(34),
    String(s.strom).padEnd(7), 'Punkt:' + (s.punktSichtbar ? (s.punktHohl ? 'hohl ' : 'voll ') : 'keiner'),
    'Tafel:' + (s.tafel ? 'JA ' : 'nein'), s.wort ? '· "' + s.wort + '"' : '');

  console.log('Lage                               Strom   Punkt        Tafel     Wort');
  zeile('1 Demo, kein Strom', await lies());

  // Auf LIVE stellen -- ohne Verbindung.
  await p.evaluate(() => { window.__agModus && window.__agModus('live'); });
  let umgestellt = await p.evaluate(() => document.body.getAttribute('data-modus'));
  if (umgestellt !== 'live') {
    // Ueber die Projektwahl, wie ein Finger es taete.
    await p.click('#agKopf'); await p.waitForTimeout(500);
    const modi = await p.$$('#agWas .wModi li');
    for (const m of modi) { if ((await m.textContent()).trim().toLowerCase() === 'live') await m.click(); }
    await p.waitForTimeout(900);
  }
  await p.waitForTimeout(600);
  zeile('2 Live gewaehlt, nichts angeschlossen', await lies());
  await p.screenshot({ path: 'strom-2-ohne.png', clip:{x:600,y:0,width:594,height:240} });

  // Verbindung steht und liefert -- fuenf Lebenszeichen im Vertragstakt.
  for (let i = 0; i < 5; i++) {
    await p.evaluate(() => window.__agStrom.lebenszeichen());
    if (i === 0) { await p.waitForTimeout(500);
      zeile('3 erstes Lebenszeichen empfangen', await lies());
      await p.screenshot({ path: 'strom-3-lebt.png', clip:{x:600,y:0,width:594,height:240} }); }
    await p.waitForTimeout(5000);
  }
  zeile('4 nach 5 Lebenszeichen (25 s)', await lies());

  // Jetzt schweigt der Strom. Der Vertrag sagt: nach 20 s veraltet.
  for (const w of [10000, 11000, 6000]) {
    await p.waitForTimeout(w);
    const s = await lies();
    zeile('5 ' + Math.round(s.stand.her/1000) + ' s ohne Lebenszeichen', s);
  }
  await p.screenshot({ path: 'strom-5-alt.png', clip:{x:600,y:0,width:594,height:240} });

  // Und wenn er wiederkommt?
  await p.evaluate(() => window.__agStrom.lebenszeichen());
  await p.waitForTimeout(700);
  zeile('6 Strom kommt wieder', await lies());
  console.log('\nFehler in der Konsole:', fehler.length ? fehler.join(' | ') : 'keine');
  await b.close();
})();
