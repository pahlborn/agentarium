/* AG-PROJEKTE-001 — Nachweis: das Projektverzeichnis ist gültig.

   Aufruf:  node previews/AG-PROJEKTE-001/pruefen.js
   Rückgabe 0 = gültig, 1 = Abweichung, 2 = ungeprüft (Datei fehlt/unlesbar).

   PETER, 25.10.: Projekt → Läufe → Aufgaben. Ein Projekt hat immer eine ID
   und einen Namen, ein Repo kann es haben. Atlas pflegt das Verzeichnis.
   Jedes Projekt hat ein Kürzel (2–5 Zeichen); Lauf-IDs beginnen damit, und
   der Monitor zeigt es an Bällen und Meldungen. Läufe ohne Projektbezug
   gehören ins Sammelprojekt „Allgemein“.

   Geprüft wird, was beim Pflegen von Hand schiefgehen kann: Form, doppelte
   IDs oder Kürzel, fehlende Pflichtfelder, fremde Felder (ein Tippfehler im
   Feldnamen wäre sonst ein stilles Nichts) und dass es die beiden
   Startprojekte gibt. Braucht keinen Browser.                             */
'use strict';
const fs = require('fs'), path = require('path');
const DATEI = path.resolve(__dirname, '..', '..', 'projekte', 'verzeichnis.json');

let fehler = 0;
function zeile(w, ist, soll) {
  const ok = ist === soll;
  if (!ok) fehler++;
  console.log('  ' + (ok ? 'ok  ' : 'FEHL') + '  ' + w.padEnd(46) + String(ist).padEnd(24) +
              (ok ? '' : '(erwartet ' + soll + ')'));
}

console.log('AG-PROJEKTE-001 — das Projektverzeichnis\n');
let v;
try { v = JSON.parse(fs.readFileSync(DATEI, 'utf8')); }
catch (e) { console.log('UNGEPRÜFT: ' + DATEI + ' nicht lesbar: ' + e.message); process.exit(2); }

const ID = /^[a-z0-9][a-z0-9-]{1,39}$/;
const KUERZEL = /^[A-Z0-9]{2,5}$/;
const REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const FELDER = { id: 1, kuerzel: 1, name: 1, repo: 1 };

zeile('Schema', v.schema, 'agentarium.projektverzeichnis.v1');
zeile('gepflegt von', v.gepflegt_von, 'atlas');
const P = Array.isArray(v.projekte) ? v.projekte : [];
zeile('Liste der Projekte vorhanden', Array.isArray(v.projekte) && P.length > 0, true);

const ids = new Set(), kz = new Set();
P.forEach((p, i) => {
  const wer = '#' + (i + 1) + ' ' + (p && p.id ? p.id : '?');
  const fremd = Object.keys(p || {}).filter(k => !FELDER[k]);
  zeile(wer + ': keine fremden Felder', fremd.join(',') || 'keine', 'keine');
  zeile(wer + ': ID gültig (klein, 2–40)', ID.test(p.id || ''), true);
  zeile(wer + ': Kürzel gültig (GROSS, 2–5)', KUERZEL.test(p.kuerzel || ''), true);
  zeile(wer + ': Name vorhanden',
        typeof p.name === 'string' && p.name.trim().length > 0 && p.name.length <= 60, true);
  zeile(wer + ': Repo leer oder besitzer/name', p.repo === null || REPO.test(p.repo || ''), true);
  zeile(wer + ': ID nicht doppelt', ids.has(p.id), false);
  zeile(wer + ': Kürzel nicht doppelt', kz.has(p.kuerzel), false);
  ids.add(p.id); kz.add(p.kuerzel);
});
zeile('Startprojekt agentarium vorhanden', ids.has('agentarium'), true);
zeile('Sammelprojekt allgemein vorhanden', ids.has('allgemein'), true);

if (fehler) { console.log('\n' + fehler + ' ABWEICHUNG(EN).'); process.exit(1); }
console.log('\nALLES WIE VEREINBART — ' + P.length + ' Projekte, keine Abweichung.');
