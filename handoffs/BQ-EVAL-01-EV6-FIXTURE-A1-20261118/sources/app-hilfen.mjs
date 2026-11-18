// Gemeinsame Werkzeuge fuer die Tests der Klartext-App (index.html).
//
// Zugang zu den Fragen: die App ruft an mehreren Stellen
// window.claude.hot.snapshot(() => state) auf (Rest aus der Claude-Vorschau).
// appOeffnen() setzt dort einen eigenen Empfaenger ein und bekommt so jede
// Runde samt Musterloesung, ohne dass die App dafuer geaendert werden muss.
//
// Klicks laufen direkt im Seitenkontext: Playwrights Wartelogik kostet je
// Klick mehrere hundert ms, bei ueber tausend Klicks pro Lauf zu viel. Ein
// gesperrter Knopf reagiert auf click() genauso wenig wie auf einen Finger.

import fs from 'node:fs/promises';
import { appLesen } from '../werkzeug/module.mjs';
import { testbauLeser } from './testbau-leser.mjs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { WURZEL, QUELLEN } from '../werkzeug/bauen.mjs';

// bauart 'test' = with the stage-2 modules; anpassen(text) changes the page (e.g. a test hook)
// bauart 'test': the test build; then tests read and prepare the storage through testbauLeser (3b-2a, see there)
export async function appServer({ bauart = process.env.BQ_BAUART || 'live', anpassen } = {}) {
  const leser = bauart === 'test' ? testbauLeser : null;
  const inhalt = anpassen || leser ? (leser || ((h) => h))(anpassen ? anpassen(appLesen('utf8', { bauart })) : appLesen('utf8', { bauart })) : appLesen(null, { bauart });
  const server = http.createServer(async (req, res) => {
    if (req.url.split('?')[0] !== '/') { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(inhalt);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  server.url = `http://127.0.0.1:${server.address().port}/`;
  return server;
}

// Loading a test page gets 90 s instead of 30 s (04.11.): with several sessions working on the same machine, page.goto
// sometimes took longer than 30 s and gave false red results. Real errors still show - only later.
export const LADEZEIT_MS = 90000;
// args: further Chromium switches (e.g. a fake camera for "Connect this device", task "Erstanmeldung per QR-Code")
export async function browserStarten({ args } = {}) {
  const pfad = process.env.CHROMIUM_PATH;
  const browser = await chromium.launch({ ...(pfad ? { executablePath: pfad } : {}), ...(args ? { args } : {}) });
  const neu = browser.newContext.bind(browser);
  browser.newContext = async (opts) => { const ctx = await neu(opts); ctx.setDefaultNavigationTimeout(LADEZEIT_MS); return ctx; };
  return browser;
}

export async function appOeffnen(browser, url, kontextMitZeit = {}) {
  // zeit: feste Uhrzeit fuer die Seite (Mottozeiten, Geburtstag, Adventskalender)
  const { zeit, fixture, ...kontext } = kontextMitZeit;
  const ctx = await browser.newContext(kontext);
  await ctx.route('**/*', (r) => (r.request().url().startsWith(url) ? r.continue() : r.abort()));
  await ctx.addInitScript((fixture) => {
    window.claude = { hot: { snapshot(fn) { try { window.__bq = JSON.parse(JSON.stringify(fn())); } catch (e) { /* egal */ } } } };
    if(fixture) window.claude.hot.ready=fn=>fn({screen:'play',world:fixture.world,round:fixture.round,idx:0,stars:0,streak:0,results:fixture.round.map(()=>null)});
    window.AudioContext = undefined; window.webkitAudioContext = undefined; // kein Ton im Test
  }, fixture);
  const page = await ctx.newPage();
  if (zeit) await page.clock.setFixedTime(new Date(zeit));
  const fehler = [];
  page.on('pageerror', (e) => fehler.push(e.message));
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector(fixture?'#play:not([hidden])':'#home h1');
  return { ctx, page, fehler };
}

export const zustand = (page) => page.evaluate(() => window.__bq);

export const klick = (page, sel) => page.evaluate((s) => {
  const e = document.querySelector(s);
  if (!e) throw new Error('nicht gefunden: ' + s);
  e.click();
}, sel);

export const sichtbar = (page, sel) => page.evaluate((s) => {
  const e = document.querySelector(s);
  return !!e && !e.hidden && !e.closest('[hidden]');
}, sel);

export const textAus = (html) => html.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/** Set up/unlock the parental UI with a deliberately non-secret test PIN. */
export async function elternOeffnen(page){
  await klick(page,'#aboutBtn');
  await klick(page,'#tabSheets');
  await page.fill('#parentPin','4826');
  if(await page.$('#parentPinAgain')) await page.fill('#parentPinAgain','4826');
  await page.locator('#parentForm button[type="submit"]').click();
  await page.waitForSelector('#parentClose');
}

/** Sections in ⚙ Settings (concept "Elternbereich" 5.5, B1); the guide ('app') is the ? help view (B2);
 *  all other chapters are on the overview. */
export const EINSTELLUNGEN = ['settings', 'backup', 'grants', 'accounts', 'aboutapp'];

/** Which view of the grown-ups area is open: 'settings' (⚙), 'help' (?) or null (overview / subject). */
export async function elternAnsicht(page) {
  if (await page.$('#pSetBack')) return 'settings';
  if (await page.$('#pHelpBack')) return 'help';
  return null;
}
/** Open a view of the grown-ups area with real clicks: 'settings', 'help' or null (overview). */
export async function elternAnsichtOeffnen(page, ziel) {
  const jetzt = await elternAnsicht(page);
  if (jetzt === ziel) return;
  if (jetzt) { const sel = jetzt === 'settings' ? '#pSetBack' : '#pHelpBack'; await page.locator(sel).click(); await page.waitForSelector(sel, { state: 'detached' }); }
  if (ziel) { await page.locator(ziel === 'settings' ? '#pSettings' : '#pHelp').click(); await page.waitForSelector(ziel === 'settings' ? '#pSetBack' : '#pHelpBack'); }
}

/** Grown-ups area: overview on top, chapters (school, sheets, support, concept) open in place; settings, backup,
 *  grants and "about the app" are in ⚙, the admin chapter stays on the overview; the guide ('app') is the ? help view. 'home' leaves a subject
 *  page or a view; every other chapter is opened with real clicks (⚙ first where needed, then its title). */
export async function elternSeite(page, seite) {
  if (seite === 'home') {
    await elternAnsichtOeffnen(page, null);
    if (await page.$('#pBack')) await page.locator('#pBack').click();
    return;
  }
  if (seite === 'app') { await elternAnsichtOeffnen(page, 'help'); return; }
  await elternAnsichtOeffnen(page, EINSTELLUNGEN.includes(seite) ? 'settings' : null);
  const d = page.locator(`#aboutBody details.psec[data-psec="${seite}"]`);
  if (!(await d.evaluate((e) => e.open))) await d.locator('summary').first().click();
  await page.waitForSelector(`#aboutBody details.psec[data-psec="${seite}"][open]`);
}

/** "So funktioniert Big Quest": open the topic whose title contains the text (real click). */
export async function aboutAbschnitt(page, text) {
  const d = page.locator('#aboutBody details.about-sec').filter({ has: page.locator('summary', { hasText: text }) }).first();
  if (!(await d.evaluate((e) => e.open))) await d.locator('summary').first().click();
  await page.waitForFunction((t) => [...document.querySelectorAll('#aboutBody details.about-sec[open] > summary')].some((s) => s.textContent.includes(t)), text);
  return d;
}

/** Zurueck zur Startseite, egal wo die App gerade steht. */
export async function zurStart(page) {
  for (let i = 0; i < 4; i++) {
    const wo = await page.evaluate(() => ['home', 'subject', 'play', 'results', 'studioScreen', 'about'].find((id) => !document.getElementById(id).hidden));
    if (wo === 'home') return;
    await klick(page, { subject: '#subjectBack', play: '#quitBtn', results: '#homeBtn', studioScreen: '#studioBack', about: '#aboutBack' }[wo]);
  }
  throw new Error('Startseite nicht erreicht');
}

/**
 * Alle Karten aller Faecher: [{ fach, karte, item, studio, text, archiv }]. item ist der Schluessel (numbers, studio:read, mix_maths). fach/karte sind
 * die Positionen fuer karteOeffnen(). Karten im (zugeklappten) Archiv zaehlen mit.
 */
export async function alleKarten(page) {
  await zurStart(page);
  const n = await page.evaluate(() => document.querySelectorAll('#subjects button.subject').length);
  const alle = [];
  for (let fach = 0; fach < n; fach++) {
    await page.evaluate((i) => document.querySelectorAll('#subjects button.subject')[i].click(), fach);
    const karten = await page.evaluate(() => [...document.querySelectorAll('#subjectBody button.world')].map((b) => ({ item: b.dataset.item, studio: b.dataset.item.startsWith('studio:'), text: b.querySelector('.name').textContent, archiv: !!b.closest('details') })));
    karten.forEach((k, karte) => alle.push({ fach, karte, ...k }));
    await zurStart(page);
  }
  return alle;
}

/** Oeffnet eine Karte (Quest oder Studio) ueber Startseite -> Fach -> Karte. */
export async function karteOeffnen(page, { fach, karte }) {
  await zurStart(page);
  await page.evaluate(([f, k]) => {
    document.querySelectorAll('#subjects button.subject')[f].click();
    document.querySelectorAll('#subjectBody button.world')[k].click();
  }, [fach, karte]);
}

/** Startet die Quest, deren Name den Text enthaelt. */
export async function questStarten(page, text) {
  const k = (await alleKarten(page)).find((x) => x.text.includes(text));
  if (!k) throw new Error('Quest nicht gefunden: ' + text);
  await karteOeffnen(page, k);
}

/** Beantwortet die angezeigte Frage richtig. */
export async function frageBeantworten(page, q) {
  // Practise Today bietet die letzte Frage als freiwillige Challenge an: annehmen
  if (await page.$('#takeChallenge')) await klick(page, '#takeChallenge');
  if (q.kind === 'mc') await klick(page, `#qAnswers .opt[data-i="${q.answer}"]`);
  else if (q.kind === 'type') {
    // A second attempt keeps the child's previous entry visible.
    const old = await page.textContent('#typedOut');
    for (const z of old) await klick(page, '#qAnswers .key[aria-label="Delete"]');
    for (const z of q.answer) await klick(page, `#qAnswers .key[aria-label="${z}"]`);
    await klick(page, '#qAnswers .key.go');
  } else {
    for (const k of q.correct) await klick(page, `#qAnswers .ord[data-i="${k}"]`);
    await klick(page, '#checkOrder');
  }
}
