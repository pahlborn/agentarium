// EV5.1-5.3: deterministischer Zuordnungsvorschlag Kriterium -> Standard.
// Rein: keine Persistenz, kein Netz, kein Browser-Speicher, keine UI-Texte.
// Betrifft ausschliesslich den Standard, nie Einstufung oder Belege.
import { SCHOOL_STANDARD_CATALOG } from './standardkatalog.mjs';

export const EVALUATION_ZUORDNUNG_NONE = 'none';

// Schwellenwert (einzige Stelle): Dice-Koeffizient auf 4-Buchstaben-Wortstaemmen.
// Echte Mathe-Evaluation (6 Zeilen): richtige Standards erreichen 0.533-0.889
// (Stellenwert 0.625, Vergleichen 0.889, Runden 0.667, Addition/Subtraktion
// 0.533, Ueberschlagen 0.60); der beste falsche Standard liegt bei <= 0.4
// (Addition vs. Subtraktionsstandard) und sonst <= 0.333. 0.45 trennt beide.
// Zu niedrig (z. B. 0.2) liefert falsche Vorschlaege fuer Zeilen mit nur einem
// gemeinsamen Wort; zu hoch (z. B. 0.6) verliert Addition/Subtraktion.
export const EVALUATION_ZUORDNUNG_SIMILARITY_THRESHOLD = 0.45;
// Konservative Mehrdeutigkeit: liegt der Zweite innerhalb dieses Abstands, kein Vorschlag.
export const EVALUATION_ZUORDNUNG_AMBIGUITY_MARGIN = 0.1;

const evZuoStopwords = new Set([
  'the', 'and', 'for', 'with', 'using', 'use', 'uses', 'including', 'appropriate', 'each',
  'from', 'that', 'into', 'are', 'two', 'all',
  'und', 'der', 'die', 'das', 'mit', 'bis', 'auf', 'aus', 'von', 'den', 'dem', 'ein', 'eine',
  'zur', 'zum', 'fur', 'bei', 'des', 'ist', 'sind', 'wie', 'als', 'oder', 'nach',
]);

/** Wortgleich-Normalisierung: nur Leerraum und Gross-/Kleinschreibung. */
export function evaluationZuordnungNormalize(text) {
  return typeof text === 'string' ? text.trim().replace(/\s+/g, ' ').toLowerCase() : '';
}

function evZuoStems(text) {
  if (typeof text !== 'string') return new Set();
  const plain = text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/ß/g, 'ss');
  const stems = new Set();
  for (const word of plain.split(/[^\p{L}]+/u)) {
    if (word.length >= 3 && !evZuoStopwords.has(word)) stems.add(word.slice(0, 4));
  }
  return stems;
}

function evZuoDice(a, b) {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const stem of a) if (b.has(stem)) shared += 1;
  return (2 * shared) / (a.size + b.size);
}

function evZuoEntries(catalog) {
  const source = catalog && typeof catalog === 'object' ? catalog : {};
  return Object.keys(source).filter((code) => {
    const entry = source[code];
    return entry && typeof entry === 'object' && entry.text && typeof entry.text === 'object';
  });
}

function evZuoResolveCode(catalog, value) {
  const wanted = evaluationZuordnungNormalize(value);
  if (!wanted) return null;
  const matches = evZuoEntries(catalog).filter((code) => code.toLowerCase() === wanted);
  return matches.length === 1 ? matches[0] : null;
}

function evZuoResolveLinked(catalog, value) {
  const byCode = evZuoResolveCode(catalog, value);
  if (byCode) return byCode;
  const wanted = evaluationZuordnungNormalize(value);
  if (!wanted) return null;
  const matches = evZuoEntries(catalog).filter((code) => Object.values(catalog[code].text)
    .some((text) => evaluationZuordnungNormalize(text) === wanted));
  return matches.length === 1 ? matches[0] : null;
}

function evZuoResult(code, source, confidence, ambiguous, reason, candidates, diagnostics) {
  return { code, source, confidence, ambiguous, reason, candidates: candidates || [], diagnostics };
}

/**
 * Liefert genau einen Standard-Vorschlag oder 'none'.
 * Eingabe (alles optional, nichts wird veraendert):
 *  criterion        Kriteriumstext
 *  linkedStandards  Standard-Eintraege, die der Aufrufer EINDEUTIG diesem Kriterium zugeordnet hat
 *  globalStandards  globale Standards-Liste ohne Kriteriumsbezug: wird nie zugeordnet (keine Position, kein erster Code)
 *  knownMappings    bestaetigte Liste [{criterion, code}]
 *  aiProposal       spaeteres Claude-Ergebnis (String oder {code}); hier kein KI-Aufruf
 *  catalog          Standardkatalog (Default: SCHOOL_STANDARD_CATALOG)
 */
export function evaluationZuordnungVorschlag(input) {
  const opts = input && typeof input === 'object' ? input : {};
  const catalog = opts.catalog && typeof opts.catalog === 'object' ? opts.catalog : SCHOOL_STANDARD_CATALOG;
  const none = EVALUATION_ZUORDNUNG_NONE;
  const diagnostics = {
    globalStandardsIgnored: Array.isArray(opts.globalStandards) ? opts.globalStandards.length : 0,
    invalidKnownMappings: 0,
    aiRejected: false,
  };

  // 1. Toddle: ausdruecklich verknuepfte Standards.
  const linked = (Array.isArray(opts.linkedStandards) ? opts.linkedStandards : [])
    .filter((entry) => typeof entry !== 'string' || entry.trim() !== '');
  if (linked.length) {
    const codes = new Set();
    let unresolved = 0;
    for (const entry of linked) {
      const code = typeof entry === 'string' ? evZuoResolveLinked(catalog, entry) : null;
      if (code) codes.add(code); else unresolved += 1;
    }
    if (codes.size === 1 && unresolved === 0) {
      return evZuoResult([...codes][0], 'toddle', 1, false, 'toddle-linked', [], diagnostics);
    }
    return evZuoResult(none, 'toddle', null, codes.size > 1, codes.size > 1 ? 'toddle-conflict' : 'toddle-unresolved', [], diagnostics);
  }

  const criterion = typeof opts.criterion === 'string' ? opts.criterion : '';
  const normalized = evaluationZuordnungNormalize(criterion);
  if (!normalized) return evZuoResult(none, 'none', null, false, 'empty-criterion', [], diagnostics);

  // 2. Bekannte, bestaetigte Zuordnungen: wortgleich nach Leerraum/Case.
  const codes = new Set();
  for (const mapping of Array.isArray(opts.knownMappings) ? opts.knownMappings : []) {
    if (!mapping || typeof mapping !== 'object') continue;
    if (evaluationZuordnungNormalize(mapping.criterion) !== normalized) continue;
    const code = evZuoResolveCode(catalog, mapping.code);
    if (code) codes.add(code); else diagnostics.invalidKnownMappings += 1;
  }
  if (codes.size > 1) return evZuoResult(none, 'known', null, true, 'known-conflict', [], diagnostics);
  if (codes.size === 1) return evZuoResult([...codes][0], 'known', 1, false, 'known-exact', [], diagnostics);

  // 3. Spaeter nativer Claude-Vorschlag (vom Aufrufer geliefert), nur Katalogcodes.
  if (opts.aiProposal !== undefined && opts.aiProposal !== null) {
    const raw = typeof opts.aiProposal === 'string' ? opts.aiProposal : opts.aiProposal.code;
    const code = evZuoResolveCode(catalog, raw);
    if (code) return evZuoResult(code, 'ai', null, false, 'ai-proposal', [], diagnostics);
    if (evaluationZuordnungNormalize(raw) !== none) diagnostics.aiRejected = true;
  }

  // 4. Wortaehnlichkeit.
  const stems = evZuoStems(criterion);
  if (!stems.size) return evZuoResult(none, 'none', null, false, 'no-comparable-words', [], diagnostics);
  const scored = evZuoEntries(catalog).map((code) => ({
    code,
    score: Math.max(0, ...Object.values(catalog[code].text).map((text) => evZuoDice(stems, evZuoStems(text)))),
  })).sort((a, b) => b.score - a.score || (a.code < b.code ? -1 : 1));
  const candidates = scored.filter((item) => item.score > 0).slice(0, 3);
  const top = scored[0];
  if (!top || top.score < EVALUATION_ZUORDNUNG_SIMILARITY_THRESHOLD) {
    return evZuoResult(none, 'similarity', top ? top.score : null, false, 'below-threshold', candidates, diagnostics);
  }
  const second = scored[1];
  if (second && second.score >= top.score - EVALUATION_ZUORDNUNG_AMBIGUITY_MARGIN) {
    return evZuoResult(none, 'similarity', top.score, true, 'ambiguous', candidates, diagnostics);
  }
  return evZuoResult(top.code, 'similarity', top.score, false, 'similarity', candidates, diagnostics);
}
