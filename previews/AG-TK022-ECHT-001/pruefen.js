/* AG-TK022-ECHT-001 — Nachweis: VIER ECHTE Originalmeldungen gehen durch den
   Browserpfad des Kandidaten, und dieselben vier werden von der
   veröffentlichten Fassung abgewiesen.

   Start:  node previews/AG-TK022-ECHT-001/pruefen.js
   Eigener Browser:  AG_CHROMIUM=/pfad/zur/datei node previews/...

   Rückgabe 0 = alles wie vereinbart, 1 = Abweichung, 2 = ungeprüft.

   WAS HIER ECHT IST, UND WAS NICHT.

   Echt sind die vier Körper in `koerper-echt.json`: Wort für Wort die
   Kommentare 6332374462, 6332384949, 6332385173 und 6332401658 auf Vorgang 2
   — Atlas' wirkliche Vergabe und drei wirkliche Selbstauskünfte des
   tatsächlich gestarteten Subagenten `/root/sentinel_real_source`, von Atlas
   unverändert veröffentlicht. Nichts daran ist erfunden, nichts umgeschrieben.

   NICHT echt ist der Abruf: Der Browser fragt hier eine Attrappe statt
   api.github.com, mit einem Scheintoken. Es geht also kein Netzverkehr nach
   außen, und dieser Nachweis belegt KEINE echte Verbindung — er belegt, was
   der Kandidat mit echten Körpern tut.

   WARUM ES IHN GIBT. Atlas am 22.10. (Kommentar 6332401854): Sentinel hatte
   diese vier Körper durch die isoliert ausgeführte `pruefen()`-Funktion
   geschickt — drei mal Art ok, `selbstauskunft` true am Kandidaten, alle drei
   von main abgewiesen. Sein Auftrag danach, wörtlich: "dieselben Originale
   (keine erfundene Arbeit) für den zulässigen Browserpfad am aktuellen
   Kandidaten verwenden, Aufnahme/Queue/Flug oder Aktivität prüfen und
   Prüfumgebung benennen; volle Elternkettenabnahme nicht durch Parser-PASS
   ersetzen."

   Der letzte Halbsatz ist der wichtigste, und er steht deshalb auch im
   Abschluss dieses Nachweises: Ein bestandener Parser ist kein abgenommener
   Elternbaum. Was hier NICHT belegt wird, ist eigens aufgeführt.           */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const { execFileSync } = require('child_process');

const ZIEL = process.env.AG_ZIEL || path.join('pilot', 'github-live');
const WURZEL = path.resolve(__dirname, '..', '..', ...ZIEL.split('/'));
const VERGLEICH = process.env.AG_VERGLEICH || 'origin/main';
const ECHT = JSON.parse(fs.readFileSync(path.join(__dirname, 'koerper-echt.json'), 'utf8'));

let fehler = 0;
function zeile(w, ist, soll) {
  const ok = ist === soll;
  if (!ok) fehler++;
  console.log('  ' + (ok ? 'ok  ' : 'FEHL') + '  ' + w.padEnd(44) +
              String(ist).padEnd(24) + (ok ? '' : '(erwartet ' + soll + ')'));
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

/* Tischt ein Verzeichnis auf 127.0.0.1 auf. Zweimal gebraucht: einmal fuer
   den Kandidaten, einmal fuer die veroeffentlichte Fassung. */
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

/* Die VERGLEICHSFASSUNG aus der Geschichte holen, nicht aus dem Baum. Ohne
   `git show` muesste jemand von Hand eine alte Fassung hinlegen -- und dann
   belegte dieser Teil, was dieser Jemand hingelegt hat. */
function veroeffentlichteFassung() {
  const ziel = fs.mkdtempSync(path.join(require('os').tmpdir(), 'ag-main-'));
  const dateien = ['index.html', 'github-live.js', 'sw.js', 'manifest.webmanifest'];
  for (const n of dateien) {
    try {
      const d = execFileSync('git', ['show', VERGLEICH + ':' + ZIEL + '/' + n],
                             { cwd: path.resolve(__dirname, '..', '..'),
                               maxBuffer: 64 * 1024 * 1024 });
      fs.writeFileSync(path.join(ziel, n), d);
    } catch (e) {
      if (n === 'index.html' || n === 'github-live.js')
        return { grund: 'Vergleichsfassung ' + VERGLEICH + ' nicht lesbar: ' +
                        String(e.message).slice(0, 90) };
    }
  }
  return { ziel: ziel };
}

/* EIN Durchgang. `wann` entscheidet, WELCHEN Aufnahmeweg er misst -- und
   das sind zwei verschiedene, was ich beim ersten Anlauf verwechselt habe.

     'historie'  Die vier liegen schon da, wenn verbunden wird. Dann gehen
                 sie durch die FALTUNG: der Adapter rechnet die Lage aus und
                 gibt sie als offene Aufgaben ans Original. Nichts wird
                 abgespielt, also steigen `verarbeitet` und `ausgegeben`
                 NICHT -- die zaehlen nur, was die Zeichenschleife aus der
                 Warteschlange nimmt.
     'strom'     Beim Verbinden ist nichts da; die vier kommen DANACH. Dann
                 gehen sie durch die Warteschlange, bekommen Meldung, Flug
                 und Puls, und beide Zahlen steigen.

   Atlas' Auftrag nennt "Aufnahme/Queue/Flug oder Aktivitaet" -- das ist
   genau diese Unterscheidung, und ein Nachweis, der nur einen der beiden
   Wege misst, beantwortet die Haelfte. */
async function durchgang(b, adr, wann) {
  const q = await b.newContext({ viewport: { width: 1194, height: 834 } });
  const s = await q.newPage();
  const fehlerSeite = [];
  s.on('pageerror', e => fehlerSeite.push(String(e.message).slice(0, 110)));
  let abrufe = 0;
  let antwort = (wann === 'historie') ? ECHT : [];
  await s.route('**api.github.com/**', r => {
    abrufe++;
    r.fulfill({ status: 200, contentType: 'application/json',
                headers: { ETag: 'W/"tk022-' + wann + '-' + abrufe + '"' },
                body: JSON.stringify(antwort) });
  });
  await s.goto(adr + '?live=github', { waitUntil: 'load' });
  await s.waitForTimeout(2200);
  if (!await s.evaluate(() => !!document.getElementById('agGhToken'))) {
    await q.close();
    return { kein: 'kein Livefach — ohne WebGL kein Monitor' };
  }
  await s.fill('#agGhToken', 'AGTK022ECHT001_Scheintoken_0123456789');
  await s.click('#agGhAn');
  await s.waitForTimeout(3000);
  if (wann !== 'historie') {
    /* Erst jetzt treffen sie ein -- also als laufender Strom. */
    antwort = ECHT;
    /* WARTEN, BIS ES SICH GESETZT HAT, nicht einfach lange warten.
       "angenommen" steigt beim Annehmen, "ausgegeben" ein paar Bilder
       spaeter. Wer sofort liest, misst das Rennen statt das Ergebnis --
       genau daran ist AG-LIVE-LATENCY-001 zweimal zufaellig durchgefallen
       und zufaellig durchgekommen. */
    for (let i = 0; i < 60; i++) {
      await s.waitForTimeout(250);
      const d = await s.evaluate(() =>
        ((window.__agStand && window.__agStand()) || {}).ausgegeben);
      if (d >= ECHT.length) break;
    }
  }
  return { q, s, fehlerSeite, abrufe: () => abrufe };
}

(async () => {
  console.log('AG-TK022-ECHT-001 — echte Originale durch den Browserpfad\n');

  let chromium = null;
  try { chromium = require('playwright').chromium; } catch (e) {}
  const br = chromiumPfad(chromium);
  if (br.grund) ungeprueft(br.grund);

  /* ---------------------------------------- DIE PRUEFUMGEBUNG, BENANNT
     Atlas hat sie ausdruecklich verlangt. Sie steht hier oben, damit man
     nicht erst im Code nachsehen muss, was gemessen wurde. */
  let pwFassung = '(unbekannt)';
  try { pwFassung = require('playwright/package.json').version; } catch (e) {}
  console.log('PRÜFUMGEBUNG');
  console.log('  Node        : ' + process.version);
  console.log('  Playwright  : ' + pwFassung);
  console.log('  Chromium    : ' + br.pfad);
  console.log('  Kandidat    : ' + WURZEL);
  console.log('  Vergleich   : ' + VERGLEICH + ':' + ZIEL);
  console.log('  Fenster     : 1194x834');
  console.log('  Abruf       : Attrappe auf **api.github.com/**, Scheintoken,');
  console.log('                kein Netzverkehr nach außen');
  console.log('  Körper      : ' + ECHT.length + ' echte Kommentare — ' +
              ECHT.map(e => e.id).join(', '));
  console.log('');

  const b = await chromium.launch({ executablePath: br.pfad,
                                    args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const kand = await tischen(WURZEL);
  let alt = null, altTisch = null;
  try {
    /* ===================== A: DIE HISTORIE (FALTUNG) ===================== */
    console.log('A — Die vier liegen schon da: der Weg über die Faltung');
    console.log('    erwartet: angenommen, zu EINER offenen Aufgabe gefaltet,');
    console.log('              und NICHTS abgespielt\n');
    const H = await durchgang(b, kand.adr, 'historie');
    if (H.kein) ungeprueft(H.kein);

    const fassung = await H.s.evaluate(() =>
      ((window.__agGithubBruecke || {}).fassung) || '(keine)');
    console.log('        Fassung der geprüften Seite: ' + fassung + '\n');

    const zh = await H.s.evaluate(() => ({
      zahlen: (document.getElementById('agGhZahlen') || {}).textContent || '',
      grund: (document.getElementById('agGhGrund') || {}).textContent || ''
    }));
    console.log('        ' + zh.zahlen.replace(/\s+/g, ' ').trim() + '\n');
    zeile('kein Grund gemeldet', zh.grund.trim(), '');
    zeile('vier Kommentare gelesen', /4 Kommentare/.test(zh.zahlen), true);
    zeile('vier als markiert erkannt', /4 markierte/.test(zh.zahlen), true);
    zeile('keine abgewiesen', /abgewiesen 0/.test(zh.zahlen), true);
    zeile('keine ohne Marker', /ohne Marker 0/.test(zh.zahlen), true);
    zeile('eine offene Aufgabe übernommen',
          /offen übernommen 1/.test(zh.zahlen), true);

    /* UND JETZT DIE ZAHL, DIE MICH BEIM ERSTEN ANLAUF ERWISCHT HAT.
       Ich hatte `verarbeitet`/`ausgegeben` auf vier erwartet und sie bei
       null gemessen. Das ist richtig so: Die vier lagen VOR dem Verbinden
       da, wurden also gefaltet und nicht abgespielt -- die Zaehlzeile sagt
       es wortwoertlich, "historisch, nicht abgespielt". Beide Zahlen
       zaehlen, was die ZEICHENSCHLEIFE aus der Warteschlange nimmt.
       Hier steht jetzt die Null als BEHAUPTUNG, nicht als Ueberraschung:
       Faellt sie eines Tages, spielt jemand Historie ab -- und das waere
       ein Haufen Fluege fuer Dinge, die lange vorbei sind. */
    const dh = await H.s.evaluate(() => (window.__agStand && window.__agStand()) || {});
    zeile('verarbeitet bleibt null — Historie wird nicht abgespielt',
          dh.verarbeitet, 0);
    zeile('ausgegeben bleibt null', dh.ausgegeben, 0);
    zeile('und genau eine wiederhergestellt', dh.wiederhergestellt, 1);

    /* ===================== B: DIE LAGE NACH DER FALTUNG ==================== */
    console.log('\nB — Was danach auf der Bühne liegt');
    console.log('    erwartet: EINE Aufgabe bei sentinel, geliefert, mit Typ,');
    console.log('              Elternbezug, Fassung und Beleg aus der VERGABE\n');
    const lage = await H.s.evaluate(() => {
      const st = (window.__agStand && window.__agStand()) || {};
      const a = (st.aufgaben || []).filter(x => x.aufgabe === 'AG-LM-TK-022')[0] || null;
      return { anzahl: (st.aufgaben || []).length, A: a,
               kinderVonUS: (st.aufgaben || []).filter(
                 x => x.eEltern === 'AG-LM-US-001').length,
               US: (st.aufgaben || []).filter(
                 x => x.aufgabe === 'AG-LM-US-001').length };
    });
    zeile('genau eine Aufgabe auf der Bühne', lage.anzahl, 1);
    zeile('sie liegt bei sentinel', lage.A ? lage.A.wer : null, 'sentinel');
    zeile('und zwar als geliefert', lage.A ? lage.A.zustand : null, 'geliefert');
    zeile('Typ aus der Vergabe', lage.A ? lage.A.eTyp : null, 'task');
    zeile('Elternbezug aus der Vergabe', lage.A ? lage.A.eEltern : null, 'AG-LM-US-001');
    zeile('Fassung aus der Vergabe', lage.A ? lage.A.eFassung : null, 'V1');
    zeile('Beleg zeigt auf die VERGABE', lage.A ? String(lage.A.beleg) : null, '6332374462');
    /* KEINE ERFUNDENEN ELTERN. US-001 ist im Strom nicht vergeben worden --
       also darf es auch nicht auf der Buehne stehen. Genau das meint Atlas
       mit "volle Elternkettenabnahme nicht durch Parser-PASS ersetzen": Der
       Bezug ist notiert, der Baum ist nicht abgenommen. */
    zeile('das Elternteil wird NICHT erfunden', lage.US, 0);
    zeile('und trotzdem ist der Bezug notiert', lage.kinderVonUS, 1);

    /* Die Aktivitaet in diesem Weg: sentinel haelt eine Aufgabe, also
       arbeitet sein Platz -- und zwar ANDERS als die der uebrigen neun.
       Gemessen am aufgeloesten `animationName`, nicht an einer Klasse: Am
       21.10. trug ein Schild die Klasse `agGhPuls` ohne jede CSS-Regel, der
       Nachweis war gruen und sichtbar war nichts. */
    const tiere = await H.s.evaluate(() => {
      const r = {};
      document.querySelectorAll('#agRing .agName').forEach(e => {
        r[e.getAttribute('data-wer')] = getComputedStyle(e).animationName;
      });
      return r;
    });
    console.log('        sentinel: ' + tiere.sentinel +
                '   ·   forge (ohne Aufgabe): ' + tiere.forge);
    zeile('sentinel bewegt sich anders als die ohne Aufgabe',
          tiere.sentinel !== tiere.forge, true);
    zeile('und es ist überhaupt eine Animation', !!tiere.sentinel &&
          tiere.sentinel !== 'none', true);
    zeile('keine Seitenfehler in der Faltung',
          H.fehlerSeite.length ? H.fehlerSeite[0] : 'keine', 'keine');
    await H.q.close();

    /* ================== C: DERSELBE STOFF ALS LAUFENDER STROM ================ */
    console.log('\nC — Dieselben vier, aber als laufender Strom');
    console.log('    erwartet: durch die Warteschlange, vier ausgegeben,');
    console.log('              dieselbe Lage am Ende, und ein sichtbarer Puls\n');
    const S = await durchgang(b, kand.adr, 'strom');
    if (S.kein) ungeprueft(S.kein);
    const zs = await S.s.evaluate(() => ({
      zahlen: (document.getElementById('agGhZahlen') || {}).textContent || '',
      grund: (document.getElementById('agGhGrund') || {}).textContent || ''
    }));
    console.log('        ' + zs.zahlen.replace(/\s+/g, ' ').trim() + '\n');
    const ds = await S.s.evaluate(() => (window.__agStand && window.__agStand()) || {});
    zeile('kein Grund gemeldet', zs.grund.trim(), '');
    zeile('verarbeitet', ds.verarbeitet, 4);
    zeile('ausgegeben', ds.ausgegeben, 4);
    console.log('        (Drei Zahlen, nicht eine: Sentinel am 21.10. — der');
    console.log('         Adapterzähler allein übersieht "angenommen, aber nie');
    console.log('         gezeichnet". Angenommen trennt Adapter von Schleife,');
    console.log('         verarbeitet gegen ausgegeben trennt Schleife von Ausgabe.)');

    /* DIESELBE LAGE WIE IN DER FALTUNG. Das ist Atlas' Bedingung, wortgleich
       seit dem 21.10.: "Projekt-/Lauftrennung und Wiederherstellung muessen
       dabei dieselbe Lage ergeben wie Live-Verarbeitung." Hier mit ECHTEN
       Koerpern, nicht mit Fixtures. */
    const lage2 = await S.s.evaluate(() => {
      const st = (window.__agStand && window.__agStand()) || {};
      const a = (st.aufgaben || []).filter(x => x.aufgabe === 'AG-LM-TK-022')[0] || null;
      return { anzahl: (st.aufgaben || []).length, A: a };
    });
    zeile('wieder genau eine Aufgabe', lage2.anzahl, 1);
    zeile('wieder bei sentinel', lage2.A ? lage2.A.wer : null, 'sentinel');
    zeile('wieder geliefert', lage2.A ? lage2.A.zustand : null, 'geliefert');
    zeile('wieder derselbe Elternbezug', lage2.A ? lage2.A.eEltern : null, 'AG-LM-US-001');
    zeile('wieder derselbe Beleg', lage2.A ? String(lage2.A.beleg) : null, '6332374462');

    /* ================== D: DER PULS, UND ZWAR AM RICHTIGEN ================== */
    console.log('\nD — Der Puls einer eingetroffenen Meldung');
    console.log('    erwartet: die Regel agGhPulsAn löst an einem der beiden');
    console.log('              beteiligten Namen aus — gemessen am animationName\n');
    /* Die Klasse lebt 1,6 Sekunden. Nach dem Warten oben ist sie womoeglich
       schon abgeklungen, also wird sie im Fenster beobachtet statt einmal
       gelesen -- derselbe Fehler, der AG-LIVE-LATENCY-001 zweimal zufaellig
       hat bestehen lassen. */
    let getroffen = null;
    for (let i = 0; i < 40; i++) {
      getroffen = await S.s.evaluate(() => {
        const r = { wer: [], regel: '' };
        document.querySelectorAll('#agRing .agName').forEach(e => {
          const n = getComputedStyle(e).animationName;
          if (/agGhPuls/.test(n || '')) { r.wer.push(e.getAttribute('data-wer')); r.regel = n; }
        });
        return r;
      });
      if (getroffen.wer.length) break;
      await S.s.waitForTimeout(150);
    }
    if (getroffen.wer.length) {
      console.log('        Puls an: ' + getroffen.wer.join(', ') +
                  '  (Regel ' + getroffen.regel + ')');
      zeile('die Pulsregel löst wirklich aus', true, true);
      zeile('und zwar an einem Beteiligten',
            getroffen.wer.every(w => w === 'atlas' || w === 'sentinel'), true);
    } else {
      /* NICHT STILL UEBERGEHEN. Ein nicht beobachteter Puls ist ein Befund,
         keine bestandene Pruefung -- der Puls ist genau das, dessen Fehlen
         Peter am 21.10. gemeldet hat. */
      console.log('        kein agGhPuls im Beobachtungsfenster gesehen.');
      console.log('        Das ist ein BEFUND, keine bestandene Prüfung:');
      console.log('        die Klasse lebt 1,6 s, das Fenster war 6 s.');
      zeile('die Pulsregel löst wirklich aus', false, true);
    }
    zeile('keine Seitenfehler im Strom',
          S.fehlerSeite.length ? S.fehlerSeite[0] : 'keine', 'keine');
    await S.q.close();

    /* ====================== E: DIE VEROEFFENTLICHTE FASSUNG ================== */
    console.log('\nE — Dieselben vier Körper gegen die veröffentlichte Fassung');
    console.log('    erwartet: dort entsteht KEINE Aufgabe — der Vertrag fehlt\n');
    alt = veroeffentlichteFassung();
    if (alt.grund) {
      console.log('        ' + alt.grund);
      console.log('        Teil E nicht gemessen.');
      fehler++;
      zeile('Vergleichsfassung lesbar', 'nein', 'ja');
    } else {
      altTisch = await tischen(alt.ziel);
      /* Als HISTORIE, denn das ist der unguenstigste Fall fuer die
         alte Fassung: Sie bekommt alle vier auf einmal und darf sich
         nicht einen davon herausnehmen. */
      const A = await durchgang(b, altTisch.adr, 'historie');
      if (A.kein) {
        console.log('        ' + A.kein + ' — Teil E nicht gemessen.');
        fehler++;
      } else {
        const af = await A.s.evaluate(() =>
          ((window.__agGithubBruecke || {}).fassung) || '(keine)');
        const al = await A.s.evaluate(() => {
          const st = (window.__agStand && window.__agStand()) || {};
          return { aufgaben: (st.aufgaben || []).length,
                   zahlen: (document.getElementById('agGhZahlen') || {}).textContent || '',
                   leben: (window.__agGithubBruecke || {}).lebenszyklus || '(keines)' };
        });
        console.log('        Fassung dort: ' + af + ' · Zusage lebenszyklus: ' + al.leben);
        console.log('        Zählzeile dort: ' + al.zahlen.replace(/\s+/g, ' ').trim());
        zeile('dort entsteht keine Aufgabe', al.aufgaben, 0);
        zeile('und die Zusage fehlt oder ist älter',
              al.leben !== 'gemeldet-v5', true);
        await A.q.close();
      }
    }

  } finally {
    await b.close();
    kand.s.close();
    if (altTisch) altTisch.s.close();
    if (alt && alt.ziel) { try { fs.rmSync(alt.ziel, { recursive: true, force: true }); } catch (e) {} }
  }

  if (fehler) { console.log('\nABWEICHUNG in ' + fehler + ' Prüfung(en).'); process.exit(1); }
  console.log('\nALLES WIE VEREINBART — keine Abweichung.');
  console.log('BELEGT: Vier ECHTE Originalmeldungen — Atlas\' Vergabe und drei');
  console.log('Selbstauskünfte des tatsächlich gestarteten Sentinel-Subagenten —');
  console.log('gehen unverändert durch den Browserpfad des Kandidaten, werden');
  console.log('angenommen, verarbeitet, ausgegeben, und ergeben genau eine');
  console.log('Aufgabe bei sentinel im Zustand geliefert, mit Typ, Elternbezug');
  console.log('und Fassung aus der Vergabe. Dieselben vier ergeben in der');
  console.log('veröffentlichten Fassung keine Aufgabe.');
  console.log('');
  console.log('NICHT BELEGT, und das ist Atlas\' eigene Bedingung:');
  console.log('  — keine Abnahme der ELTERNKETTE. Ein bestandener Vertrag ist');
  console.log('    kein abgenommener Elternbaum; US-001 steht hier gar nicht.');
  console.log('  — keine echte Verbindung. Der Abruf ist eine Attrappe, das');
  console.log('    Token ein Scheintoken, es geht nichts nach außen.');
  console.log('  — keine Geräteabnahme. Peters iPad hat Fassung 55, main 56.');
  console.log('  — kein Rendering im Sinne gezeichneter Bildpunkte. Gemessen');
  console.log('    sind Zustand, Zähler und der aufgelöste animationName.');
})().catch(e => { console.log('\nUNGEPRÜFT: ' + (e && e.stack || e)); process.exit(2); });
