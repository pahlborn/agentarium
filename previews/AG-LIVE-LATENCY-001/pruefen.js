/* AG-LIVE-LATENCY-001 — Nachweis: warum die Bühne stumm blieb, und dass sie
   es jetzt sagt.

   Start:  node previews/AG-LIVE-LATENCY-001/pruefen.js
   Eigener Browser:  AG_CHROMIUM=/pfad/zur/datei node previews/...

   Rückgabe 0 = alles wie vereinbart, 1 = Abweichung, 2 = ungeprüft.

   WAS DIESER NACHWEIS FESTHÄLT -- UND WAS NICHT.
   Peter sah am 21.10. „kein ball, keine aktivität. totenstille", während drei
   echte Ereignisse von Atlas auf Vorgang #2 lagen. Hier wird eine
   KONSTELLATION REPRODUZIERT, die diese Stille erzeugt. Das ist keine
   bewiesene Ursache auf seinem Gerät: Seine Schnitt- und Empfangsdaten
   fehlen, und solange sie fehlen, bleibt auch ein Transportproblem möglich.
   Von Atlas am 21.10. richtiggestellt, nachdem ich genau das behauptet
   hatte. Gemessen wurde zweimal dasselbe, mit DENSELBEN DREI ECHTEN
   Kommentaren (Fixture, Zeichen für Zeichen aus der Schnittstelle):

     A  lagen sie beim Verbinden schon da  ->  0 Meldungen, 0 Bälle
     B  kamen sie nach dem Verbinden       ->  3 Meldungen, 1 Flug

   In BEIDEN Fällen wurde nichts abgewiesen. In DIESER Konstellation liegt es
   also am Basisschnitt: Was beim Verbinden schon da liegt, gilt als
   Geschichte und wird absichtlich nicht nachgespielt. Für Peters Gerät ist
   damit eine Erklärung reproduziert, keine bewiesen.

   UND EIN ZWEITES, DAS DIESER NACHWEIS NICHT LEISTET: Historische Ereignisse
   heissen nicht, dass die Arbeit fertig ist. Ein `handoff`, der in der
   Historie liegt, kann eine Aufgabe betreffen, die noch offen ist -- und der
   Monitor zeigt davon nichts. Das Wiederherstellen offener Aufgaben bleibt
   deshalb erforderlich und ist der nächste Schnitt, nicht hiermit erledigt.

   WAS DIESER NACHWEIS NICHT VERLANGT: dass die Historie abgespielt wird. Das
   Bild würde dann Arbeit zeigen, die vorbei ist. Verlangt wird, dass der
   Monitor SAGT, was er getan hat.

   DREI ZAHLEN, DREI BEDEUTUNGEN -- benannt von Sentinel und von Atlas
   geschärft:
     angenommen   der Adapter hat es übergeben (liegt in `liveListe`)
     verarbeitet  die Zeichenschleife hat es aus der Warteschlange genommen
     ausgegeben   eine Meldung oder ein Flug wurde tatsächlich angelegt
   Sie kommen aus zwei verschiedenen Quellen (Adapter / `__agStand()`), und
   wo zwei auseinandergehen, steckt es dazwischen. Zuerst hiess die zweite
   Zahl „gezeichnet"; das behauptete mehr als sie misst, denn sie stand am
   ANFANG der Verarbeitung -- eine Ausnahme danach hätte mitgezählt.

   GRENZEN, die bleiben: Eine stehende Zeichenschleife ist nicht nachgestellt
   (von aussen nicht zuverlässig erzwingbar). GEZEICHNETE BILDPUNKTE beweist
   keine der drei Zahlen -- das wäre ein Bildvergleich und steht nicht hier. */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');

const WURZEL = path.resolve(__dirname, '..', '..');
const ZIEL = path.join(WURZEL, 'pilot', 'github-live');
const ECHT = JSON.parse(fs.readFileSync(path.join(__dirname, 'koerper-echt.json'), 'utf8'));

let fehler = 0;
function zeile(w, ist, soll) {
  const ok = ist === soll;
  if (!ok) fehler++;
  console.log('  ' + (ok ? 'ok  ' : 'FEHL') + '  ' + w.padEnd(46) +
              String(ist).padEnd(22) + (ok ? '' : '(erwartet ' + soll + ')'));
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

(async () => {
  console.log('AG-LIVE-LATENCY-001 — die stumme Bühne, mit den echten Körpern\n');
  console.log('Fixture: ' + ECHT.length + ' echte Kommentare — ' +
              ECHT.map(e => e.id).join(', ') + '\n');

  let chromium = null;
  try { chromium = require('playwright').chromium; } catch (e) {}
  const br = chromiumPfad(chromium);
  if (br.grund) ungeprueft(br.grund);

  const b = await chromium.launch({ executablePath: br.pfad,
                                    args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const n = await tischen(ZIEL);

  async function lauf(vorher) {
    const q = await b.newContext({ viewport: { width: 1194, height: 834 } });
    const s = await q.newPage();
    const pageErr = [];
    s.on('pageerror', e => pageErr.push(String(e.message).slice(0, 110)));
    let antwort = vorher ? ECHT : [];
    let abrufe = 0;
    await s.route('**api.github.com/**', r => {
      abrufe++;
      r.fulfill({ status: 200, contentType: 'application/json',
                  headers: { ETag: 'W/"lat' + abrufe + '"' },
                  body: JSON.stringify(antwort) });
    });
    await s.goto(n.adr + '?live=github', { waitUntil: 'load' });
    await s.waitForTimeout(2200);
    if (!await s.evaluate(() => !!document.getElementById('agGhToken'))) {
      await q.close();
      return null;      /* kein Livefach -> ungeprueft, oben behandelt */
    }
    await s.fill('#agGhToken', 'AGLIVELATENCY001_Scheintoken_0123456789');
    await s.click('#agGhAn');
    await s.waitForTimeout(3000);
    if (!vorher) {
      antwort = ECHT;
      /* WARTEN, BIS ES SICH GESETZT HAT -- nicht einfach lange warten.
         "angenommen" steigt bei der Annahme, "gezeichnet" ein paar Bilder
         spaeter. Wer sofort liest, misst das Rennen und nicht das Ergebnis;
         genau daran sind zwei Laeufe dieses Nachweises zufaellig
         durchgefallen und zufaellig durchgekommen. */
      for (let i = 0; i < 40; i++) {
        await s.waitForTimeout(250);
        const g = await s.evaluate(() => {
          const z = (document.getElementById('agGhZahlen') || {}).textContent || '';
          const a = z.match(/angenommen (\d+)/), b = z.match(/verarbeitet (\d+)/);
          return { a: a ? +a[1] : -1, b: b ? +b[1] : -1 };
        });
        if (g.a === 3 && g.b === 3) break;
      }
    }
    await s.evaluate(() => { const d = document.getElementById('agGhAuf'); if (d) d.open = true; });
    await s.waitForTimeout(300);
    const m = await s.evaluate(() => {
      const st = (window.__agStand && window.__agStand()) || {};
      const z = (document.getElementById('agGhZahlen') || {}).textContent || '';
      const zahl = (re) => { const x = z.match(re); return x ? +x[1] : -1; };
      return {
        offen: !!(document.getElementById('agGhAuf') || {}).open,
        zahlen: z,
        angenommen: zahl(/angenommen (\d+)/),
        verarbeitetAnzeige: zahl(/verarbeitet (\d+)/),
        ausgegebenAnzeige: zahl(/ausgegeben (\d+)/),
        historisch: zahl(/(\d+) markierte historisch/),
        abgewiesen: zahl(/abgewiesen (\d+)/),
        letztes: (document.getElementById('agGhLetztes') || {}).textContent || '',
        grund: (document.getElementById('agGhGrund') || {}).textContent || '',
        verarbeitet: typeof st.verarbeitet === 'number' ? st.verarbeitet : -1,
        ausgegeben: typeof st.ausgegeben === 'number' ? st.ausgegeben : -1,
        fliegend: (st.fliegend || []).length,
        meldungen: document.querySelectorAll('.agRuf').length,
        werk: (document.getElementById('agWerkName') || {}).textContent || ''
      };
    });
    m.pageErr = pageErr;
    /* Die Klapptafel NACH dem Verbinden, bevor der Nachweis sie aufmacht. */
    await q.close();
    return m;
  }

  /* Der Zustand der Klapptafel muss gemessen werden, BEVOR der Nachweis sie
     oeffnet -- sonst misst er sein eigenes Oeffnen. Dafuer ein eigener,
     kurzer Lauf ohne das Aufklappen. */
  async function klappstand(vorher) {
    const q = await b.newContext({ viewport: { width: 1194, height: 834 } });
    const s = await q.newPage();
    let antwort = vorher ? ECHT : [];
    let k = 0;
    await s.route('**api.github.com/**', r => {
      k++;
      r.fulfill({ status: 200, contentType: 'application/json',
                  headers: { ETag: 'W/"kl' + k + '"' }, body: JSON.stringify(antwort) });
    });
    await s.goto(n.adr + '?live=github', { waitUntil: 'load' });
    await s.waitForTimeout(2200);
    await s.fill('#agGhToken', 'AGLIVELATENCY001_Scheintoken_0123456789');
    await s.click('#agGhAn');
    await s.waitForTimeout(3200);
    const offen = await s.evaluate(() =>
      !!(document.getElementById('agGhAuf') || {}).open);
    await q.close();
    return offen;
  }

  const A = await lauf(true);
  if (!A) { await b.close(); n.s.close(); ungeprueft('kein Livefach — ohne WebGL kein Monitor'); }
  const B = await lauf(false);

  console.log('A — Reproduzierte Konstellation: die drei lagen beim Verbinden da');
  console.log('    erwartet: still, NICHTS abgewiesen, und die Stille erklärt sich');
  console.log('    KEINE Aussage über Peters Gerät — seine Schnittdaten fehlen\n');
  zeile('drei als historisch eingeordnet', A.historisch, 3);
  zeile('nichts angenommen', A.angenommen, 0);
  zeile('nichts verarbeitet', A.verarbeitet, 0);
  zeile('nichts ausgegeben', A.ausgegeben, 0);
  zeile('nichts abgewiesen', A.abgewiesen, 0);
  zeile('keine Meldung im Bild', A.meldungen, 0);
  zeile('kein Flug', A.fliegend, 0);
  zeile('die Stille ist erklärt',
        /markierte Ereignis(se)? lagen schon vor dem Schnitt/.test(A.letztes), true);
  zeile('und sagt, dass nicht nachgespielt wird',
        /nicht nachgespielt/.test(A.letztes), true);
  zeile('kein Demoprojekt im Kopf', /NACHTPOST/.test(A.werk), false);
  zeile('keine Seitenfehler', A.pageErr.length, 0);

  console.log('\nB — dieselben drei, nach dem Verbinden');
  console.log('    erwartet: angenommen UND gezeichnet, Meldung und Flug\n');
  zeile('drei angenommen', B.angenommen, 3);
  zeile('drei von der Zeichenschleife verarbeitet', B.verarbeitet, 3);
  zeile('mindestens drei ausgegeben', B.ausgegeben >= 3, true);
  zeile('Anzeige nennt verarbeitet', B.verarbeitetAnzeige, 3);
  zeile('Anzeige nennt ausgegeben', B.ausgegebenAnzeige >= 3, true);
  zeile('nichts abgewiesen', B.abgewiesen, 0);
  zeile('drei Meldungen im Bild', B.meldungen, 3);
  zeile('mindestens ein Flug aus dem handoff', B.fliegend >= 1, true);
  zeile('keine unbelegte Arbeit vorgetäuscht', (B.zahlen.indexOf('Arbeit') >= 0), false);
  zeile('keine Seitenfehler', B.pageErr.length, 0);

  console.log('\nC — Drei Zahlen, drei Bedeutungen, zwei Quellen');
  console.log('    angenommen → verarbeitet → ausgegeben; wo zwei auseinander-');
  console.log('    gehen, steckt es dazwischen\n');
  zeile('Adapterzähler lesbar', B.angenommen >= 0, true);
  zeile('Zählung der Schleife lesbar', B.verarbeitet >= 0, true);
  zeile('Zählung der Ausgabe lesbar', B.ausgegeben >= 0, true);
  zeile('angenommen == verarbeitet', B.angenommen === B.verarbeitet, true);
  zeile('ausgegeben nicht kleiner als verarbeitet',
        B.ausgegeben >= B.verarbeitet, true);
  console.log('        Eine STEHENDE Schleife ist nicht nachgestellt — von aussen');
  console.log('        nicht zuverlässig erzwingbar. Und GEZEICHNETE BILDPUNKTE');
  console.log('        beweist keine der drei Zahlen; das wäre ein Bildvergleich.');

  console.log('\nD — Die Klapptafel versteckt ihre Erklärung nicht mehr');
  console.log('    erwartet: offen, wenn etwas in die Historie fiel; sonst zu\n');
  const offenA = await klappstand(true);
  const offenB = await klappstand(false);
  zeile('offen im stillen Fall', offenA, true);
  zeile('zu, wenn nichts zu erklären ist', offenB, false);

  await b.close();
  n.s.close();

  if (fehler) {
    console.log('\n' + fehler + ' ABWEICHUNG' + (fehler > 1 ? 'EN' : '') + '.');
    process.exit(1);
  }
  console.log('\nALLES WIE VEREINBART — keine Abweichung.');
  console.log('Die Historie wird weiterhin NICHT nachgespielt. Neu ist, dass der');
  console.log('Monitor sagt, was er getan hat, und dass angenommen, verarbeitet');
  console.log('und ausgegeben getrennt zu lesen sind.');
  console.log('NICHT belegt: die Ursache auf Peters Gerät, gezeichnete Bildpunkte,');
  console.log('eine stehende Schleife — und dass historische Übergaben fertige');
  console.log('Arbeit bedeuten. Das Wiederherstellen offener Aufgaben steht aus.');
  process.exit(0);
})().catch(e => { ungeprueft('Nachweis abgebrochen: ' + (e && e.message)); });
