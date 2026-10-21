/* AG-CONNECT-UX-001 — Nachweis: der verbundene und der getrennte Zustand des
   Livefachs, und dass der Token nirgends auftaucht.

   Start:  node previews/AG-CONNECT-UX-001/pruefen.js
   Eigener Browser:  AG_CHROMIUM=/pfad/zur/datei node previews/...

   Rückgabe 0 = alles wie vereinbart, 1 = Abweichung, 2 = ungeprüft.

   WARUM ES DIESEN NACHWEIS GIBT. Sentinel hat am 21.10. zu Recht angemerkt,
   dass der grüne Arbeitslauf den neuen Token-Zustand gar nicht berührte: Die
   drei vorhandenen Nachweise laden das Livefach, aber keiner liest ab, was
   nach dem Verbinden am Feld steht. Eine Änderung, die nur von Hand gesehen
   wurde, ist beim nächsten Umbau wieder offen.

   WAS HIER GEPRÜFT WIRD. Der echte Adapter an der echten Seite, mit einem
   Scheintoken und ohne Netz: die eine Adresse, die der Adapter kennt, wird
   hier bedient. Geprüft werden die beiden vorgeschriebenen Wortlaute, der
   Übergang in beide Richtungen, und sechs Orte, an denen der Token NICHT
   stehen darf.

   WAS NICHT GEPRÜFT WIRD. Kein echter Token, kein Netz, kein Lauf — und
   keine Abnahme auf Peters iPad. Der Anlass war dort entstanden.           */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');

const WURZEL = path.resolve(__dirname, '..', '..');
const ZIEL = path.join(WURZEL, 'pilot', 'github-live');

/* Der Scheintoken muss dem Formatfilter des Adapters genügen
   (/^[A-Za-z0-9_]{20,255}$/) und unverwechselbar sein, damit die Suche nach
   ihm keine Zufallstreffer liefert. */
const SCHEIN = 'AGCONNECTUX001_Scheintoken_nur_fuer_den_Nachweis_0123456789';
const SATZ = 'Token ist sicher hinterlegt und wird nicht angezeigt.';

let fehler = 0;
function zeile(w, ist, soll) {
  const ok = ist === soll;
  if (!ok) fehler++;
  console.log('  ' + (ok ? 'ok  ' : 'FEHL') + '  ' + w.padEnd(44) +
              String(ist).padEnd(26) + (ok ? '' : '(erwartet ' + soll + ')'));
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
      const u = decodeURIComponent(q.url.split('?')[0]);
      const f = path.join(wurzel, u === '/' ? 'index.html' : u);
      fs.readFile(f, (e, d) => {
        if (e) { a.writeHead(404).end(); return; }
        a.writeHead(200, { 'Content-Type': TYPEN[path.extname(f)] || 'application/octet-stream' });
        a.end(d);
      });
    });
    s.listen(0, '127.0.0.1', () => r({ s, adr: 'http://127.0.0.1:' + s.address().port + '/' }));
  });
}

/* Alle Speicher des Fensters nach dem Scheintoken durchsuchen. IndexedDB
   wird mitgenommen, weil der Adapter sie zwar nicht benutzt, die Zusage im
   Fuß der Tafel aber umfassend ist -- und eine Zusage prüft man dort, wo sie
   gilt, nicht dort, wo man sie gemeint hat. */
async function speicherLesen(seite, schein) {
  return await seite.evaluate(async (s) => {
    const fund = { dom: false, localStorage: false, sessionStorage: false,
                   indexedDB: false, url: false, feldWert: false, attribute: false };
    try { fund.dom = document.documentElement.outerHTML.indexOf(s) >= 0; } catch (x) {}
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.indexOf(s) >= 0 || String(localStorage.getItem(k)).indexOf(s) >= 0) fund.localStorage = true;
      }
    } catch (x) {}
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k.indexOf(s) >= 0 || String(sessionStorage.getItem(k)).indexOf(s) >= 0) fund.sessionStorage = true;
      }
    } catch (x) {}
    try {
      if (indexedDB.databases) {
        const dbs = await indexedDB.databases();
        for (const d of dbs) {
          const db = await new Promise(r2 => {
            const q = indexedDB.open(d.name); q.onsuccess = () => r2(q.result); q.onerror = () => r2(null);
          });
          if (!db) continue;
          for (const laden of Array.from(db.objectStoreNames)) {
            const alles = await new Promise(r2 => {
              try {
                const q = db.transaction(laden, 'readonly').objectStore(laden).getAll();
                q.onsuccess = () => r2(q.result); q.onerror = () => r2([]);
              } catch (x) { r2([]); }
            });
            if (JSON.stringify(alles || []).indexOf(s) >= 0) fund.indexedDB = true;
          }
          db.close();
        }
      }
    } catch (x) {}
    try { fund.url = (location.href + location.hash).indexOf(s) >= 0; } catch (x) {}
    const f = document.getElementById('agGhToken');
    if (f) {
      fund.feldWert = String(f.value).indexOf(s) >= 0;
      for (const a of Array.from(f.attributes)) {
        if (String(a.value).indexOf(s) >= 0) fund.attribute = true;
      }
    }
    return fund;
  }, schein);
}

async function zustand(seite) {
  return await seite.evaluate(() => {
    const f = document.getElementById('agGhToken');
    const l = document.querySelector('label[for="agGhToken"]');
    const an = document.getElementById('agGhAn');
    const aus = document.getElementById('agGhAus');
    const satz = document.getElementById('agGhTokenSatz');
    const st = f ? getComputedStyle(f) : null;
    const k = f ? f.getBoundingClientRect() : null;
    let satzBreite = 0, feldInnen = 0, satzZeileBreite = 0;
    if (f && st && k) {
      const cv = document.createElement('canvas').getContext('2d');
      cv.font = st.fontWeight + ' ' + st.fontSize + ' ' + st.fontFamily;
      satzBreite = Math.round(cv.measureText(f.placeholder || '').width);
      feldInnen = Math.round(k.width - parseFloat(st.paddingLeft) - parseFloat(st.paddingRight)
                  - parseFloat(st.borderLeftWidth) - parseFloat(st.borderRightWidth));
    }
    if (satz) satzZeileBreite = Math.round(satz.getBoundingClientRect().width);
    return {
      da: !!f, gesperrt: f ? f.disabled : null, wert: f ? f.value : null,
      platzhalter: f ? f.placeholder : null, label: l ? l.textContent : null,
      anAus: an ? an.disabled : null, ausAus: aus ? aus.disabled : null,
      satzZeile: satz ? satz.textContent : null,
      satzBreite: satzBreite, feldInnen: feldInnen, satzZeileBreite: satzZeileBreite
    };
  });
}

(async () => {
  console.log('AG-CONNECT-UX-001 — Livefach: verbunden, getrennt, und wo der Token nicht steht\n');

  let chromium = null;
  try { chromium = require('playwright').chromium; } catch (e) {}
  const br = chromiumPfad(chromium);
  if (br.grund) ungeprueft(br.grund);

  const b = await chromium.launch({ executablePath: br.pfad,
                                    args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const n = await tischen(ZIEL);
  const q = await b.newContext({ viewport: { width: 1194, height: 834 } });
  const s = await q.newPage();

  /* Alles mitschreiben, was die Seite in die Konsole legt -- der Token darf
     dort nicht auftauchen, auch nicht in einer Fehlermeldung. */
  const konsole = [];
  s.on('console', m => konsole.push(m.text()));
  const pageErr = [];
  s.on('pageerror', e => pageErr.push(String(e)));

  /* Kein Netz. Und mitschreiben, was hinausgehen WOLLTE: Der Token gehört in
     den Kopf der Anfrage, aber niemals in Adresse oder Rumpf. */
  const anfragen = [];
  await s.route('**api.github.com/**', route => {
    const r = route.request();
    anfragen.push({ url: r.url(), rumpf: r.postData() || '' });
    route.fulfill({ status: 200, contentType: 'application/json',
                    headers: { ETag: 'W/"ag-connect-ux-' + anfragen.length + '"' },
                    body: '[]' });
  });

  await s.goto(n.adr + '?live=github', { waitUntil: 'load' });
  await s.waitForTimeout(2500);

  const a = await zustand(s);
  if (!a.da) {
    await b.close(); n.s.close();
    ungeprueft('Livefach nicht gefunden — ohne WebGL gibt es kein Tokenfeld');
  }

  console.log('A — Getrennt, wie die Seite aufgeht');
  console.log('    erwartet: Feld frei und beschreibbar, kein Satz, „Verbinden" bereit\n');
  zeile('Feld nicht gesperrt', a.gesperrt, false);
  zeile('Feld leer', a.wert, '');
  zeile('kein Platzhalter', a.platzhalter, '');
  zeile('Beschriftung', a.label, 'Lesetoken');
  zeile('„Verbinden" bereit', a.anAus, false);
  zeile('„Trennen" aus', a.ausAus, true);
  zeile('keine Satzzeile', a.satzZeile, '');

  await s.fill('#agGhToken', SCHEIN);
  await s.click('#agGhAn');
  await s.waitForTimeout(2500);

  /* DIE TAFEL KLAPPT NACH DEM VERBINDEN ZU, UND ZWAR ABSICHTLICH
     (`github-live.js`: `if (!spaeter.length) auf.open = false;` --
     "nach dem Verbinden: eine Zeile"). Das ist genau der Moment, aus dem
     Peters Beobachtung stammt: Er klappt die Tafel spaeter WIEDER AUF und
     sieht ein leeres Feld. Der Nachweis stellt das nach, statt daran
     vorbeizumessen -- erst pruefen, dass zugeklappt wurde, dann aufklappen
     wie ein Finger es tut, dann ablesen. */
  const klapp = await s.evaluate(() => {
    const d = document.getElementById('agGhAuf');
    /* Dasein und Art mitpruefen: Der erste Anlauf fragte `.open` an der
       aeusseren `div` ab. Die hat die Eigenschaft nicht, also kam
       `undefined` zurueck, also war `!undefined` wahr -- die Pruefung
       konnte nicht scheitern und meldete Erfolg, waehrend sie nichts
       gemessen hatte. */
    if (!d) return { da: false, istDetails: false, zu: null };
    return { da: true, istDetails: d.tagName === 'DETAILS',
             zu: d.open === false };
  });
  await s.evaluate(() => {
    const d = document.getElementById('agGhAuf');
    if (d) d.open = true;      /* aufklappen, wie ein Finger es tut */
  });
  await s.waitForTimeout(400);

  const v = await zustand(s);
  console.log('\nB — Verbunden, und die Tafel wieder aufgeklappt');
  console.log('    genau Peters Moment: zugeklappt, erneut geöffnet, was steht da?\n');
  zeile('Klapptafel vorhanden', klapp.da, true);
  zeile('und wirklich ein <details>', klapp.istDetails, true);
  zeile('nach dem Verbinden zugeklappt', klapp.zu, true);
  zeile('Platzhalter', v.platzhalter === SATZ, true);
  zeile('Beschriftung', v.label, 'Token gespeichert');
  zeile('Satz in eigener Zeile', v.satzZeile === SATZ, true);
  zeile('Feld gesperrt', v.gesperrt, true);
  zeile('Feld leer', v.wert, '');
  zeile('„Verbinden" aus', v.anAus, true);
  zeile('„Trennen" bereit', v.ausAus, false);
  zeile('mindestens ein Abruf', anfragen.length > 0, true);

  console.log('\nC — Warum der Satz nicht im Feld steht, nachgemessen');
  console.log('    das Feld fasst ihn nicht; die eigene Zeile schon\n');
  zeile('Satz braucht mehr als das Feld bietet', v.satzBreite > v.feldInnen, true);
  console.log('        Feld nutzbar ' + v.feldInnen + 'px, Satz ' + v.satzBreite + 'px, ' +
              'Satzzeile ' + v.satzZeileBreite + 'px');
  zeile('Satzzeile breiter als das Feld', v.satzZeileBreite > v.feldInnen, true);

  console.log('\nD — Wo der Token nicht stehen darf');
  console.log('    erwartet: sechs Mal nein, und auch nicht in der Konsole\n');
  const f1 = await speicherLesen(s, SCHEIN);
  zeile('nicht im DOM', f1.dom, false);
  zeile('nicht im Feldwert', f1.feldWert, false);
  zeile('nicht in einem Attribut des Felds', f1.attribute, false);
  zeile('nicht in localStorage', f1.localStorage, false);
  zeile('nicht in sessionStorage', f1.sessionStorage, false);
  zeile('nicht in IndexedDB', f1.indexedDB, false);
  zeile('nicht in der Adresse', f1.url, false);
  zeile('nicht in der Konsole', konsole.some(t => t.indexOf(SCHEIN) >= 0), false);
  zeile('nicht in einer Abruf-Adresse', anfragen.some(r => r.url.indexOf(SCHEIN) >= 0), false);
  zeile('nicht im Rumpf eines Abrufs', anfragen.some(r => r.rumpf.indexOf(SCHEIN) >= 0), false);

  await s.click('#agGhAus');
  await s.waitForTimeout(1200);

  const t = await zustand(s);
  console.log('\nE — Getrennt, und zwar vollständig zurück');
  console.log('    erwartet: derselbe Zustand wie in A, Satz und Platzhalter weg\n');
  zeile('Feld wieder frei', t.gesperrt, false);
  zeile('kein Platzhalter mehr', t.platzhalter, '');
  zeile('Beschriftung zurück', t.label, 'Lesetoken');
  zeile('Satzzeile weg', t.satzZeile, '');
  zeile('„Verbinden" wieder bereit', t.anAus, false);
  zeile('„Trennen" wieder aus', t.ausAus, true);
  const f2 = await speicherLesen(s, SCHEIN);
  zeile('nach dem Trennen nichts im DOM', f2.dom, false);
  zeile('nach dem Trennen nichts im Speicher',
        f2.localStorage || f2.sessionStorage || f2.indexedDB, false);
  zeile('keine Seitenfehler', pageErr.length, 0);

  await b.close();
  n.s.close();

  if (fehler) {
    console.log('\n' + fehler + ' ABWEICHUNG' + (fehler > 1 ? 'EN' : '') + '.');
    process.exit(1);
  }
  console.log('\nALLES WIE VEREINBART — keine Abweichung.');
  console.log('Scheintoken, kein Netz, kein Lauf. Keine Abnahme auf Peters iPad —');
  console.log('und dort ist die Verwirrung entstanden, die diese Fassung behebt.');
  process.exit(0);
})().catch(e => { ungeprueft('Nachweis abgebrochen: ' + (e && e.message)); });
