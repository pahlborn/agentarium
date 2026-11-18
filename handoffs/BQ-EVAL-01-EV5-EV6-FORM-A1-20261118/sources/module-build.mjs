// Module der App (Peter, 02.11.: in abgeschlossenen Modulen entwickeln, einzeln ohne Browser testen).
//
// Logik liegt in src/module/*.mjs als normale ES-Module mit benannten Exporten. In Node werden sie direkt
// importiert und in Sekunden getestet (tests/module/). Fuer die App setzt dieses Werkzeug sie an der Marke
// /*BQ_MODULE*/ in index.html ein - ausgeliefert wird weiter EINE Datei.
//
// Regeln (werden geprueft, sonst Abbruch):
//  - nur benannte Exporte (export function|const|let|class|async function); kein export default, kein export { }
//  - Importe nur zwischen Modulen (import { … } from './x.mjs'); in der App teilen sie sich einen Bereich
//  - kein Name doppelt: weder zwischen Modulen noch zwischen Modul und index.html
//  - Reihenfolge und Bauart stehen in src/module/module.json

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const MODUL_ORDNER = path.join(WURZEL, 'src', 'module');
export const MARKE = '/*BQ_MODULE*/';

/** Modulliste aus module.json; bauart 'live' liefert nur Live-Module, 'test' alle. */
export function modulListe(bauart = 'live', ordner = MODUL_ORDNER) {
  const liste = JSON.parse(fs.readFileSync(path.join(ordner, 'module.json'), 'utf8')).module;
  return liste.filter((m) => bauart === 'test' || m.bau === 'live');
}

const EXPORT_RE = /^export\s+(async\s+function|function|const|let|class)\s+([A-Za-z_$][\w$]*)/gm;

/** Exportierte Namen eines Modultexts. */
export function exportNamen(text) {
  return [...text.matchAll(EXPORT_RE)].map((m) => m[2]);
}

/** Modultext -> Text fuer den gemeinsamen Bereich der App. */
export function modulUmwandeln(name, text) {
  const t = text.replace(/\r\n/g, '\n');
  if (/^export\s+default\b/m.test(t) || /^export\s*\{/m.test(t)) throw new Error(`Modul ${name}: nur benannte Exporte erlaubt.`);
  const fremd = [...t.matchAll(/^import\s.*?from\s+['"]([^'"]+)['"]/gm)].map((m) => m[1]).filter((q) => !/^\.\/[\w-]+\.mjs$/.test(q));
  if (fremd.length) throw new Error(`Modul ${name}: Importe nur zwischen Modulen erlaubt (${fremd.join(', ')}).`);
  const rumpf = t.replace(/^import\s[^;]*;[ \t]*\n/gm, '').replace(/^export\s+(?=(async\s+function|function|const|let|class)\s)/gm, '');
  if (/^\s*(import|export)\s/m.test(rumpf)) throw new Error(`Modul ${name}: import/export an unerwarteter Stelle.`);
  return `/* ---- Modul ${name} (src/module/${name}.mjs) ---- */\n${rumpf.trim()}\n`;
}

/** Namen, die index.html selbst auf oberster Ebene des App-Skripts anlegt (grob, reicht fuer die Kollisionspruefung). */
function appNamen(app) {
  return new Set([...app.matchAll(/^(?:async\s+)?(?:function\s+([A-Za-z_$][\w$]*)|(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=)/gm)].map((m) => m[1] || m[2]));
}

/** Setzt die Module in die App ein. app: Buffer oder Text; Ergebnis im selben Typ. */
export function moduleEinsetzen(app, { bauart = 'live', ordner = MODUL_ORDNER } = {}) {
  const istBuffer = Buffer.isBuffer(app);
  const text = istBuffer ? app.toString('utf8') : String(app);
  const n = text.split(MARKE).length - 1;
  if (n !== 1) throw new Error(`index.html: Marke ${MARKE} ${n}x statt 1x.`);
  const gesehen = new Map(), vorhanden = appNamen(text.replace(/\r\n/g, '\n'));
  const teile = modulListe(bauart, ordner).map((m) => {
    const quelle = fs.readFileSync(path.join(ordner, m.name + '.mjs'), 'utf8');
    for (const name of exportNamen(quelle)) {
      if (gesehen.has(name)) throw new Error(`Name ${name} doppelt: Modul ${gesehen.get(name)} und ${m.name}.`);
      if (vorhanden.has(name)) throw new Error(`Name ${name} aus Modul ${m.name} gibt es auch in index.html.`);
      gesehen.set(name, m.name);
    }
    return modulUmwandeln(m.name, quelle);
  });
  const crlf = text.includes('\r\n');
  let block = teile.join('\n');
  if (crlf) block = block.replace(/\n/g, '\r\n');
  const out = text.replace(MARKE, () => block);
  return istBuffer ? Buffer.from(out, 'utf8') : out;
}

/** index.html mit eingesetzten Modulen - so, wie Tests und Bau sie brauchen. */
export function appLesen(enc, { wurzel = WURZEL, bauart = 'live' } = {}) {
  const roh = fs.readFileSync(path.join(wurzel, 'index.html'));
  const app = moduleEinsetzen(roh, { bauart, ordner: path.join(wurzel, 'src', 'module') });
  return enc ? app.toString(enc) : app;
}
