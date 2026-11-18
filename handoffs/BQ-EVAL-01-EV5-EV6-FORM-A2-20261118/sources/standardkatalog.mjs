// Bekannte Schulstandards: Texte, Fach der Elternansicht und vorhandene Questbezüge.
// questRanks ist die einzige gepflegte Questzuordnung: 0 = Hauptstandard, 1/2 = Nebenstandard.
// quests und STANDARDS werden daraus abgeleitet. Nur der Hauptstandard löst die bestehende Lückenregel aus.
export const SCHOOL_STANDARD_CATALOG = {
  'M-N1': { subject: 'maths', text: { de: 'Stellenwert, Zahlenschreibweise und Null als Platzhalter bis 9999', en: 'Place value and writing numbers to 9,999, zero as a placeholder' }, questRanks: { numbers: 0 } },
  'M-N2': { subject: 'maths', text: { de: 'Zahlen vergleichen, sortieren und ordnen bis 9999', en: 'Comparing, sorting and ordering numbers to 9,999 (< and >)' }, questRanks: { numbers: 1, detective: 0 } },
  'M-N3': { subject: 'maths', text: { de: 'Runden auf Zehner, Hunderter und Tausender', en: 'Rounding to the nearest 10, 100 and 1,000' }, questRanks: { round: 0, detective: 1 } },
  'M-N4': { subject: 'maths', text: { de: 'Additionsstrategien und zweischrittige Sachaufgaben', en: 'Addition strategies and two-step word problems' }, questRanks: { combos: 0, wordprob: 0 } },
  'M-N5': { subject: 'maths', text: { de: 'Subtraktionsstrategien und zweischrittige Sachaufgaben', en: 'Subtraction strategies and two-step word problems' }, questRanks: { wordprob: 1 } },
  'M-N6': { subject: 'maths', text: { de: 'Überschlagen und Ergebnisse kontrollieren', en: 'Estimating and checking answers' }, questRanks: { round: 1, combos: 1 } },
  'M-D1': { subject: 'maths', text: { de: 'Daten sammeln, Diagramme mit Skala und Beschriftung', en: 'Collecting data; bar and line graphs with scale and labels' }, questRanks: { detective: 2, graphs: 0 } },
  'M-M1': { subject: 'science', text: { de: 'Längen schätzen, vergleichen und messen in cm und m', en: 'Estimating, comparing and measuring length in cm and m' }, questRanks: { units: 0 } },
  'S-F1': { subject: 'science', text: { de: 'Kräfte und Anwendung naturwissenschaftlichen Verständnisses', en: 'Forces and applying scientific understanding' }, questRanks: { forces: 0 } },
  'E-W1': { subject: 'english', text: { de: 'Schreiben: logische Reihenfolge und verständliche Darstellung', en: 'Writing: ideas in a logical order' }, questRanks: { opinion: 0, sentences: 0, examples: 0 } },
  'E-W2': { subject: 'reading', text: { de: 'Informationen aus verlässlichen Quellen finden und darstellen', en: 'Finding and presenting information from reliable sources' }, questRanks: { library: 0 } },
  'E-R1': { subject: 'english', text: { de: 'Wortbildung und Textverständnis (Übungszuordnung)', en: 'Word building and reading comprehension (practice mapping)' }, questRanks: { words: 0 } },
  'D-W1': { subject: 'deutsch', text: { de: 'Anleitung schreiben (Lernziele aus der Unterrichtsaufgabe)', en: 'Writing instructions (German class)' }, questRanks: { anleitung: 0 } },
  'E-S1': { subject: 'english', text: { de: 'Sprechen und Zuhören: an das Publikum denken', en: 'Speaking and listening: thinking about the audience' }, questRanks: {} },
  'E-S2': { subject: 'english', text: { de: 'Sprechen und Zuhören: Meinungen äußern und besprechen', en: 'Speaking and listening: expressing and discussing opinions' }, questRanks: { opinion: 1 } },
};
for (const entry of Object.values(SCHOOL_STANDARD_CATALOG)) {
  entry.quests = Object.freeze(Object.keys(entry.questRanks));
  Object.freeze(entry.questRanks);
  Object.freeze(entry.text);
  Object.freeze(entry);
}
Object.freeze(SCHOOL_STANDARD_CATALOG);

/** Kompatible Quest -> geordnete Standards; keine zweite gepflegte Liste. */
export function schoolStandardsByQuest(catalog = SCHOOL_STANDARD_CATALOG) {
  const standards = {};
  for (const [code, entry] of Object.entries(catalog)) {
    for (const [quest, rank] of Object.entries(entry.questRanks)) {
      const codes = standards[quest] || (standards[quest] = []);
      if (!Number.isInteger(rank) || rank < 0 || codes[rank]) throw new Error(`Standardkatalog: Rang für ${quest} ungültig oder doppelt.`);
      codes[rank] = code;
    }
  }
  for (const [quest, codes] of Object.entries(standards)) {
    if (Object.keys(codes).length !== codes.length) throw new Error(`Standardkatalog: Rangfolge für ${quest} unvollständig.`);
  }
  return standards;
}

/** Exakter bekannter Code oder null; auch Standards ohne Quest sind gültig. */
export function schoolStandardInfo(code) {
  return typeof code === 'string' && Object.hasOwn(SCHOOL_STANDARD_CATALOG, code)
    ? SCHOOL_STANDARD_CATALOG[code] : null;
}
