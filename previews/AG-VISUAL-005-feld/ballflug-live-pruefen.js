const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium',
    args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport:{width:1194,height:834} })).newPage();
  const fehler = []; p.on('pageerror', e => fehler.push(String(e).split('\n')[0].slice(0,90)));
  await p.goto('file://' + process.cwd() + '/agentarium-fertig.html');
  await p.waitForTimeout(2500);
  await p.click('#agKopf'); await p.waitForTimeout(400);
  for (const m of await p.$$('#agWas .wModi li'))
    if ((await m.textContent()).trim().toLowerCase() === 'live') await m.click();
  await p.waitForTimeout(500); await p.mouse.click(600,620); await p.waitForTimeout(700);
  const schick = e => p.evaluate(x => window.__agEreignis(x), e);
  console.log('— Laufkennung —');
  console.log('  ', JSON.stringify(await p.evaluate(() => window.__agLauf({
    project_id:'AG-PILOT-001', run_id:'r-2026-10-16-1', kurz:'AG-PILOT-001',
    titel:'Erster echter Lauf des Teams', ablage:'pahlborn/agentarium' }))));
  const flug = () => p.evaluate(() => window.__agStand().fliegend);

  // Erst einen Ball ins Feld bringen, damit der naechste eine echte Strecke hat.
  await schick({ actor:'peter', kind:'request', recipient:'atlas', title:'Auftrag' });
  await p.waitForTimeout(3000);

  console.log('— ohne Gegenzug: wie lange fliegt ein handoff? —');
  await schick({ actor:'atlas', kind:'handoff', recipient:'archibald', title:'Konzept entfalten' });
  await p.waitForTimeout(150);
  const a1 = await flug();
  console.log('  ', JSON.stringify(a1));
  await p.waitForTimeout(4000);

  console.log('\n— mit Gegenzug: der Empfaenger handelt, waehrend es fliegt —');
  await schick({ actor:'atlas', kind:'handoff', recipient:'nova', title:'Vision schaerfen' });
  await p.waitForTimeout(150);
  const b1 = await flug();
  await schick({ actor:'nova', kind:'proposal', recipient:'atlas', title:'Leere Stellen erlaubt' });
  await p.waitForTimeout(120);
  const b2 = await flug();
  console.log('   vorher :', JSON.stringify(b1));
  console.log('   nachher:', JSON.stringify(b2));
  const alt = (b1[0]||{}).dauer, neu = (b2.find(x => x.an === 'nova')||{}).dauer;
  console.log('   Flugdauer zu nova:', alt, '->', neu,
              (neu && alt && neu < alt) ? '· eingeholt' : '· NICHT eingeholt');
  await p.waitForTimeout(3000);
  const s = await p.evaluate(() => window.__agStand());
  console.log('\n  Liveliste:', s.ereignisse, 'Ereignisse · Ball liegt bei:', s.ball);
  console.log('  Konsolenfehler:', fehler.length ? [...new Set(fehler)].join(' | ') : 'keine');
  await p.screenshot({ path:'live-ball-ende.png' });
  await b.close();
})();
