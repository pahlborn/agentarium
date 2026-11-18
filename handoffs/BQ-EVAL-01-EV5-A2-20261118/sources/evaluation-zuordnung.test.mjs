import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluationZuordnungVorschlag as propose,
  EVALUATION_ZUORDNUNG_SIMILARITY_THRESHOLD as THRESHOLD,
} from '../../src/module/evaluation-zuordnung.mjs';
import { SCHOOL_STANDARD_CATALOG } from '../../src/module/standardkatalog.mjs';

// Reale Mathe-Evaluation (Kriteriumstexte der Referenz).
const REF = [
  ['Reads and writes numbers up to 9999 using expanded form and understanding zero as a placeholder, identifying the value of each digit', 'M-N1', true],
  ['Compares, sorts and orders numbers up to 9999, including the use of > and < symbols', 'M-N2', false],
  ['Rounds whole numbers to 9999 to the nearest 10, 100 and 1000', 'M-N3', true],
  ['Selects appropriate mental and written strategies to solve real life addition problems to 9999, including two-step problems', 'M-N4', false],
  ['Selects appropriate mental and written strategies to solve real life subtraction problems to 9999, including two-step problems', 'M-N5', false],
  ['Estimates and uses a calculator to check answers to addition and subtraction problems', 'M-N6', false],
];
const ROUND = REF[2][0];

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
}

test('Referenz: Stellenwert -> M-N1, Runden -> M-N3, uebrige korrekt oder none, nie falsch', () => {
  for (const [text, expected, required] of REF) {
    const result = propose({ criterion: text });
    if (required) assert.equal(result.code, expected, text);
    else assert.ok(result.code === expected || result.code === 'none', `${text} -> ${result.code}`);
    assert.equal(result.source === 'similarity', true);
  }
});

test('Schwellenwert: richtige Treffer darueber, bester falscher Kandidat darunter', () => {
  for (const [text, expected] of REF) {
    const result = propose({ criterion: text });
    assert.equal(result.candidates[0].code, expected);
    assert.ok(result.candidates[0].score >= THRESHOLD);
    assert.ok(result.candidates[1].score < THRESHOLD, `${expected}: ${result.candidates[1].score}`);
  }
});

test('Wortaehnlichkeit DE und deutsche Umlaute', () => {
  const result = propose({ criterion: 'Rundet ganze Zahlen auf Zehner, Hunderter und Tausender' });
  assert.equal(result.code, 'M-N3');
  assert.equal(result.source, 'similarity');
});

test('Standard ohne Quest ist zulaessig', () => {
  const result = propose({ criterion: 'Thinks about the audience when speaking' });
  assert.equal(result.code, 'E-S1');
  assert.deepEqual(SCHOOL_STANDARD_CATALOG['E-S1'].quests, []);
});

test('Unverwandte, leere und unbrauchbare Eingaben -> none', () => {
  for (const input of [
    { criterion: 'Brings a water bottle to school' },
    { criterion: '' }, { criterion: '   ' }, { criterion: '9999 10 100' }, {}, undefined, null,
  ]) {
    const result = propose(input);
    assert.equal(result.code, 'none');
  }
});

test('Niedrige Punktzahl unter Schwelle -> none ohne Mehrdeutigkeit', () => {
  const result = propose({ criterion: 'Presents numbers neatly' });
  assert.equal(result.code, 'none');
  assert.equal(result.reason, 'below-threshold');
  assert.equal(result.ambiguous, false);
});

test('Gleichstand zweier Standards -> mehrdeutig, none', () => {
  const catalog = {
    'T-1': { text: { de: 'Bruchteile vergleichen', en: 'Comparing fractions' } },
    'T-2': { text: { de: 'Bruchteile vergleichen', en: 'Comparing fractions' } },
  };
  const result = propose({ criterion: 'Compares fractions', catalog });
  assert.equal(result.code, 'none');
  assert.equal(result.ambiguous, true);
});

test('Bekannt: wortgleich nach Leerraum und Case', () => {
  const knownMappings = [{ criterion: ROUND, code: 'M-N3' }];
  const result = propose({ criterion: `  ${ROUND.toUpperCase().replace(/ /g, '   ')} `, knownMappings });
  assert.equal(result.code, 'M-N3');
  assert.equal(result.source, 'known');
  assert.equal(result.confidence, 1);
});

test('Bekannt: anderes Wort ist kein Known-Treffer; Aehnlichkeit hat eigene Provenienz', () => {
  const knownMappings = [{ criterion: ROUND, code: 'M-N3' }];
  const result = propose({ criterion: ROUND.replace('whole', 'entire'), knownMappings });
  assert.notEqual(result.source, 'known');
  assert.equal(result.source, 'similarity');
  assert.equal(result.code, 'M-N3');
});

test('Bekannt hat Vorrang vor Wortaehnlichkeit', () => {
  const result = propose({ criterion: ROUND, knownMappings: [{ criterion: ROUND, code: 'M-N1' }] });
  assert.equal(result.code, 'M-N1');
  assert.equal(result.source, 'known');
});

test('Widerspruechliche bekannte Zuordnungen -> none, keine stille Wahl', () => {
  const result = propose({
    criterion: ROUND,
    knownMappings: [{ criterion: ROUND, code: 'M-N3' }, { criterion: ROUND.toLowerCase(), code: 'M-N6' }],
  });
  assert.equal(result.code, 'none');
  assert.equal(result.ambiguous, true);
  assert.equal(result.reason, 'known-conflict');
});

test('Bekannte Zuordnung mit ungueltigem Code wird ignoriert', () => {
  const result = propose({ criterion: ROUND, knownMappings: [{ criterion: ROUND, code: 'X-99' }, null, 'x'] });
  assert.equal(result.source, 'similarity');
  assert.equal(result.code, 'M-N3');
  assert.equal(result.diagnostics.invalidKnownMappings, 1);
});

test('Toddle: Code, DE-Text und EN-Text; Vorrang vor bekannt und KI', () => {
  const base = { criterion: ROUND, knownMappings: [{ criterion: ROUND, code: 'M-N1' }], aiProposal: 'M-N2' };
  for (const link of ['m-n6', SCHOOL_STANDARD_CATALOG['M-N6'].text.de, `  ${SCHOOL_STANDARD_CATALOG['M-N6'].text.en.toUpperCase()}  `]) {
    const result = propose({ ...base, linkedStandards: [link] });
    assert.equal(result.code, 'M-N6');
    assert.equal(result.source, 'toddle');
  }
});

test('Toddle: Standard ohne Quest, mehrere Codes, unbekannter Eintrag', () => {
  assert.equal(propose({ linkedStandards: ['E-S1'] }).code, 'E-S1');
  const conflict = propose({ criterion: ROUND, linkedStandards: ['M-N1', 'M-N3'] });
  assert.equal(conflict.code, 'none');
  assert.equal(conflict.ambiguous, true);
  const invalid = propose({ criterion: ROUND, linkedStandards: ['ZZ-9'] });
  assert.equal(invalid.code, 'none');
  assert.equal(invalid.reason, 'toddle-unresolved');
  const mixed = propose({ criterion: ROUND, linkedStandards: ['M-N3', 'ZZ-9'] });
  assert.equal(mixed.code, 'none');
});

test('Globale Standards-Liste ohne Kriteriumsbezug ordnet nie zu (weder Position noch erster Code)', () => {
  const unrelated = propose({ criterion: 'Brings a water bottle to school', globalStandards: ['M-N1', 'M-N3', 'M-N6'] });
  assert.equal(unrelated.code, 'none');
  assert.equal(unrelated.diagnostics.globalStandardsIgnored, 3);
  const single = propose({ criterion: 'Brings a water bottle to school', globalStandards: ['M-N3'] });
  assert.equal(single.code, 'none');
  // Auch bei passendem Kriterium kommt der Code aus Aehnlichkeit, nicht aus der Liste.
  const related = propose({ criterion: ROUND, globalStandards: ['M-N6', 'M-N1'] });
  assert.equal(related.source, 'similarity');
  assert.equal(related.code, 'M-N3');
});

test('KI: nach bekannt, vor Aehnlichkeit; Antwort ausserhalb des Katalogs abgelehnt', () => {
  assert.equal(propose({ criterion: ROUND, aiProposal: { code: 'M-N6' } }).source, 'ai');
  assert.equal(propose({ criterion: ROUND, aiProposal: 'M-N6' }).code, 'M-N6');
  const known = propose({ criterion: ROUND, aiProposal: 'M-N6', knownMappings: [{ criterion: ROUND, code: 'M-N1' }] });
  assert.equal(known.source, 'known');
  const rejected = propose({ criterion: ROUND, aiProposal: 'FAKE-1' });
  assert.equal(rejected.source, 'similarity');
  assert.equal(rejected.diagnostics.aiRejected, true);
  const noneAi = propose({ criterion: 'Brings a water bottle to school', aiProposal: 'none' });
  assert.equal(noneAi.code, 'none');
  assert.equal(noneAi.diagnostics.aiRejected, false);
});

test('Wachsender Katalog per Injektion; globaler Katalog bleibt unveraendert', () => {
  const grown = {
    ...SCHOOL_STANDARD_CATALOG,
    'M-X9': { text: { de: 'Brüche am Zahlenstrahl', en: 'Fractions on a number line' }, questRanks: {} },
  };
  const criterion = 'Places fractions on a number line';
  assert.equal(propose({ criterion, catalog: grown }).code, 'M-X9');
  assert.notEqual(propose({ criterion }).code, 'M-X9');
  assert.equal(propose({ linkedStandards: ['M-X9'] }).code, 'none');
  assert.equal(propose({ linkedStandards: ['m-x9'], catalog: grown }).code, 'M-X9');
  assert.equal(Object.hasOwn(SCHOOL_STANDARD_CATALOG, 'M-X9'), false);
});

test('Fehlerhafte Katalogeintraege werden uebersprungen', () => {
  const catalog = { bad: null, worse: { text: 'x' }, 'T-1': { text: { en: 'Comparing fractions' } } };
  assert.equal(propose({ criterion: 'Compares fractions', catalog }).code, 'T-1');
});

test('Eingaben werden nicht veraendert', () => {
  const input = deepFreeze({
    criterion: ROUND,
    linkedStandards: ['M-N3'],
    globalStandards: ['M-N1'],
    knownMappings: [{ criterion: ROUND, code: 'M-N3' }],
    aiProposal: { code: 'M-N3' },
  });
  const before = JSON.stringify(input);
  propose(input);
  propose({ ...input, linkedStandards: [] });
  assert.equal(JSON.stringify(input), before);
});
