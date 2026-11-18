// EV5.1/5.2/5.5 und EV6: Uebernahme-Logik fuer das gemeinsame Evaluationsformular.
// Rein: keine Persistenz, kein Netz, kein Browser-Speicher, keine UI-Texte.
// Alle Zuordnungsentscheidungen laufen ueber evaluationZuordnungVorschlag (unveraendert).
//
// Quelltext-Format (EV5.1, bewusst eng, das echte Toddle-Layout ist NICHT verifiziert):
// Ein Abschnitt "Standards" (eigene Zeile). Darin steht ein Kriterium je Zeile als
//   <Kriterium> -> <Standard>[; <Standard>]     (Trenner: ->, => oder Pfeil)
// Zeilen ohne diesen Trenner sind eine globale Liste und werden nie verteilt.
// Der Abschnitt endet an der naechsten echten Ueberschrift.
import { SCHOOL_STANDARD_CATALOG } from './standardkatalog.mjs';
import { evaluationZuordnungVorschlag, evaluationZuordnungNormalize, EVALUATION_ZUORDNUNG_NONE } from './evaluation-zuordnung.mjs';

const EV_UEB_STANDARDS_HEADING = /^(?:standards?|lernstandards?)\s*:?$/i;
const EV_UEB_HEADINGS = /^(?:learning goals?|lernziele?|instructions?|arbeitsanweisung(?:en)?|(?:teacher )?feedback|lehrkraft[- ]r(?:ü|ue)ckmeldung|r(?:ü|ue)ckmeldung|(?:assessment )?criteria|(?:bewertungs)?kriterien|rubric|evidence|belege?|title|titel|date|datum|subject|fach|summary|zusammenfassung|notes?|notizen)\s*:?$/i;
const EV_UEB_LINK = /\s*(?:→|->|=>)\s*/;

function evUebGenericHeading(line) {
  return line.length <= 60 && line.endsWith(':') && !EV_UEB_LINK.test(line) && !line.includes(';');
}

/** Liest alle Standards-Abschnitte; rows = Zeilen mit eindeutigem Kriterienbezug, globalCount = ignorierte globale Zeilen. */
export function evUebParseStandards(text) {
  const out = { found: false, rows: [], globalCount: 0 };
  if (typeof text !== 'string') return out;
  let inside = false;
  for (const raw of text.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (EV_UEB_STANDARDS_HEADING.test(line)) { inside = true; out.found = true; continue; }
    if (inside && (EV_UEB_HEADINGS.test(line) || evUebGenericHeading(line))) { inside = false; continue; }
    if (!inside) continue;
    const parts = line.replace(/^(?:[-*•]|\d+[.)])\s+/, '').split(EV_UEB_LINK);
    if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) { out.globalCount += 1; continue; }
    out.rows.push({
      criterion: parts[0].trim(),
      entries: parts[1].split(/\s*[;|]\s*/).map((s) => s.trim()).filter(Boolean),
    });
  }
  return out;
}

/** Eintraege fuer genau dieses Kriterium (Wortgleich nach Leerraum/Case) oder [] wenn nicht eindeutig aufloesbar. */
export function evUebLinkedFor(parsed, criterion, catalog = SCHOOL_STANDARD_CATALOG) {
  const wanted = evaluationZuordnungNormalize(criterion);
  if (!wanted || !parsed || !Array.isArray(parsed.rows)) return [];
  const rows = parsed.rows.filter((r) => evaluationZuordnungNormalize(r.criterion) === wanted);
  if (!rows.length) return [];
  const entries = rows.flatMap((r) => r.entries);
  const codes = new Set();
  for (const entry of entries) {
    const r = evaluationZuordnungVorschlag({ linkedStandards: [entry], catalog });
    if (r.source !== 'toddle' || r.code === EVALUATION_ZUORDNUNG_NONE) return [];
    codes.add(r.code);
  }
  return codes.size === 1 ? entries : [];
}

/** true = Eltern haben diese Zeile angefasst (oder Zeile stammt aus bestehender Fassung): nie neu berechnen. */
export function evUebTouched(touched, index) {
  return !Array.isArray(touched) || touched[index] !== false;
}

/** Vorschlagscode (oder 'none') fuer ein Kriterium. ctx: catalog, linkedStandards, knownMappings, aiProposal. */
export function evUebProposalCode(criterion, ctx = {}) {
  return evaluationZuordnungVorschlag({
    criterion, catalog: ctx.catalog, linkedStandards: ctx.linkedStandards,
    knownMappings: ctx.knownMappings, aiProposal: ctx.aiProposal,
  }).code;
}

function evUebEffective(task) {
  return !!task && !!task.manual && !task.pending && !task.manual.withdrawn
    && !(Array.isArray(task.manual.conflicts) && task.manual.conflicts.length)
    && Array.isArray(task.assessment?.criteria)
    && task.assessment.criteria.some((c) => c && Object.hasOwn(c, 'standard'));
}

/** Private bekannte Paare aus bestaetigten, wirksamen Evaluationen des einen autorisierten Kindes (tasks). */
export function evUebKnownMappings(tasks, catalog = SCHOOL_STANDARD_CATALOG) {
  const out = [];
  for (const task of Array.isArray(tasks) ? tasks : []) {
    if (!evUebEffective(task)) continue;
    for (const c of task.assessment.criteria) {
      if (!c || typeof c.criterion !== 'string' || typeof c.standard !== 'string'
        || c.standard === EVALUATION_ZUORDNUNG_NONE || !Object.hasOwn(catalog, c.standard)) continue;
      out.push({ criterion: c.criterion, code: c.standard });
    }
  }
  return out;
}

/** Vorschlag fuer ein neues Kriterium im Formular, bekannte Paare aus tasks (EV5.2). */
export function evUebSuggestFor(tasks, criterion, extra = {}) {
  return evUebProposalCode(criterion, { ...extra, knownMappings: evUebKnownMappings(tasks, extra.catalog) });
}

/** Nativ gelieferte Zeilen uebernehmen; angefasste Zeilen (gleicher Text) behalten ihre Elternwahl. */
export function evUebApplyNative(prev, prevTouched, results, ctx = {}) {
  const criteria = [], touched = [];
  (Array.isArray(results) ? results : []).forEach((c, i) => {
    const old = Array.isArray(prev) ? prev[i] : null;
    const text = evaluationZuordnungNormalize(c.criterion);
    const keep = !!old && Array.isArray(prevTouched) && prevTouched[i] === true && !!text
      && evaluationZuordnungNormalize(old.criterion) === text;
    const standard = keep ? old.standard : evUebProposalCode(c.criterion, {
      catalog: ctx.catalog, knownMappings: ctx.knownMappings,
      linkedStandards: evUebLinkedFor(ctx.parsed, c.criterion, ctx.catalog),
      aiProposal: Object.hasOwn(c, 'standard') ? c.standard : undefined,
    });
    criteria.push({ criterion: c.criterion, rating: c.rating, evidence: c.evidence, standard });
    touched.push(keep);
  });
  return { criteria, touched };
}

/** EV6.1: wirksame gespeicherte Zeilen mit standard 'none', fuer die es jetzt einen positiven Vorschlag gibt. */
export function evUebRemapCandidates(tasks, { catalog = SCHOOL_STANDARD_CATALOG, knownMappings } = {}) {
  const list = Array.isArray(tasks) ? tasks : [];
  const known = Array.isArray(knownMappings) ? knownMappings : evUebKnownMappings(list, catalog);
  const out = [];
  for (const task of list) {
    if (!evUebEffective(task)) continue;
    const rows = [];
    task.assessment.criteria.forEach((c, index) => {
      if (!c || c.standard !== EVALUATION_ZUORDNUNG_NONE || typeof c.criterion !== 'string') return;
      const r = evaluationZuordnungVorschlag({ criterion: c.criterion, knownMappings: known, catalog });
      if (r.code !== EVALUATION_ZUORDNUNG_NONE) rows.push({ index, criterion: c.criterion, code: r.code });
    });
    if (rows.length) out.push({ evaluation: task.manual.evaluation, revision: task.manual.revision, title: task.title, day: task.day, rows });
  }
  return out;
}

/** EV6.2: Kopie des Dokuments; nur noch-'none'-Zeilen mit passendem Text erhalten den Kandidaten. */
export function evUebApplyCandidate(assessment, rows) {
  const copy = JSON.parse(JSON.stringify(assessment));
  for (const r of Array.isArray(rows) ? rows : []) {
    const c = copy.criteria[r.index];
    if (c && c.standard === EVALUATION_ZUORDNUNG_NONE && c.criterion === r.criterion) c.standard = r.code;
  }
  return copy;
}
