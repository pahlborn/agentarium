import test from 'node:test';
import assert from 'node:assert/strict';
import { SCHOOL_STANDARD_CATALOG } from '../../src/module/standardkatalog.mjs';
import {
  evUebTouched, evUebParseStandards, evUebLinkedFor, evUebProposalCode, evUebSuggestFor,
  evUebKnownMappings, evUebApplyNative, evUebRemapCandidates, evUebApplyCandidate,
} from '../../src/module/evaluation-uebernahme.mjs';

const row = (criterion, standard, rating = 'C') => ({ criterion, rating, evidence: '', standard });
const task = (evaluation, criteria, extra = {}) => ({
  title: 'Invented ' + evaluation, day: '2026-01-02',
  manual: { evaluation, revision: 'rev-' + evaluation, withdrawn: false, conflicts: [], history: [] },
  assessment: { area: 'maths', goal: '', instructions: '', feedback: '', criteria }, ...extra,
});
const FRACTION = { subject: 'maths', text: { de: 'Brüche an ganzen Formen', en: 'Fractions of whole shapes' }, questRanks: {}, quests: [] };
const GROWN = { ...SCHOOL_STANDARD_CATALOG, 'M-F1': FRACTION };

test('parser: reads per-criterion rows, ignores the global list, stops at the next real section', () => {
  const p = evUebParseStandards([
    'Learning goal', 'Invented goal', 'Standards',
    'Rounds to the nearest 10 -> M-N3',
    '- Writing: ideas in a logical order → E-W1; M-N1',
    'M-N1',
    'Criteria', 'Another -> M-N4',
  ].join('\n'));
  assert.equal(p.found, true);
  assert.deepEqual(p.rows, [
    { criterion: 'Rounds to the nearest 10', entries: ['M-N3'] },
    { criterion: 'Writing: ideas in a logical order', entries: ['E-W1', 'M-N1'] },
  ]);
  assert.equal(p.globalCount, 1);
  assert.deepEqual(evUebParseStandards('Standards\nA -> M-N1\nFeedback:\nB -> M-N3').rows.map(r => r.criterion), ['A']);
  assert.deepEqual(evUebParseStandards('Notes\nA -> M-N1'), { found: false, rows: [], globalCount: 0 });
  assert.equal(evUebParseStandards(null).found, false);
});

test('linked: only unambiguous per-criterion entries; never position, first code or global list', () => {
  const p = evUebParseStandards([
    'Standards',
    'Rounds to the nearest 10 -> M-N3',
    'Two codes -> E-W1; M-N1',
    'Unknown code -> Z-99',
    'Half known -> M-N1; Z-99',
    'Same -> M-N1', 'same  -> M-N3',
    'German text -> Runden auf Zehner, Hunderter und Tausender',
    'M-N2',
  ].join('\n'));
  assert.deepEqual(evUebLinkedFor(p, ' ROUNDS to the   nearest 10'), ['M-N3']);
  for (const c of ['Two codes', 'Unknown code', 'Half known', 'Same', 'M-N2', 'Not in source']) assert.deepEqual(evUebLinkedFor(p, c), [], c);
  assert.deepEqual(evUebLinkedFor(p, 'German text'), ['Runden auf Zehner, Hunderter und Tausender']);
  assert.equal(evUebProposalCode('Invented: no words', { linkedStandards: evUebLinkedFor(p, 'German text') }), 'M-N3');
  assert.equal(evUebProposalCode('Two codes'), 'none', 'unresolvable link falls to lower source, no false code');
});

test('proposal: real catalog, priority known over similarity, hard AI rejection', () => {
  assert.equal(evUebProposalCode('Rounds to the nearest 10, 100 and 1,000'), 'M-N3');
  assert.equal(evUebProposalCode('Invented: owns exact phrase zzz'), 'none');
  assert.equal(evUebProposalCode('Rounds to the nearest 10, 100 and 1,000', { knownMappings: [{ criterion: 'rounds to the nearest 10, 100 and 1,000', code: 'M-N1' }] }), 'M-N1');
  assert.equal(evUebProposalCode('Rounds to the nearest 10, 100 and 1,000', { aiProposal: 'BAD' }), 'none');
});

test('known mappings: only confirmed effective per-criterion pairs with catalog codes', () => {
  const tasks = [
    task('ok', [row('Alpha criterion', 'M-N1'), row('Beta', 'none'), row('Eta', 'X-1')]),
    task('withdrawn', [row('Gamma', 'M-N3')]), task('conflict', [row('Delta', 'M-N3')]),
    task('pending', [row('Eps', 'M-N3')], { pending: true }),
    task('legacy', [{ criterion: 'Zeta', rating: 'C', evidence: '' }]),
    { title: 'import', day: '2026-01-02', assessment: { criteria: [row('Theta', 'M-N3')] } },
  ];
  tasks[1].manual.withdrawn = true; tasks[2].manual.conflicts = ['other'];
  assert.deepEqual(evUebKnownMappings(tasks), [{ criterion: 'Alpha criterion', code: 'M-N1' }]);
  assert.deepEqual(evUebKnownMappings(null), []);
  assert.equal(evUebSuggestFor(tasks, '  ALPHA   criterion '), 'M-N1');
  assert.equal(evUebSuggestFor(tasks, 'Gamma'), 'none', 'withdrawn data is not learned');
  const clash = [task('a', [row('Alpha criterion', 'M-N1')]), task('b', [row('Alpha criterion', 'M-N2')])];
  assert.equal(evUebSuggestFor(clash, 'Alpha criterion'), 'none', 'conflicting known pairs propose nothing');
});

test('touched: unknown or existing rows count as touched; only explicit false is recalculated', () => {
  assert.equal(evUebTouched(undefined, 0), true);
  assert.equal(evUebTouched([false], 0), false);
  assert.equal(evUebTouched([true], 0), true);
  assert.equal(evUebTouched([], 3), true);
});

test('native result: touched parent choice incl. none is kept, others get proposals, bad AI hint is none', () => {
  const prev = [row('Invented: own', 'E-S2'), row('Invented: kept none', 'none')];
  const res = [
    { criterion: ' invented:  OWN', rating: 'C', evidence: 'e1', standard: 'M-N1' },
    { criterion: 'Invented: kept none', rating: 'M', evidence: 'e2', standard: 'M-N1' },
    { criterion: 'Invented: ai hint zzz', rating: '', evidence: 'e3', standard: 'M-N1' },
    { criterion: 'Invented: bad hint zzz', rating: '', evidence: 'e4', standard: 'BAD' },
    { criterion: 'Rounds to the nearest 10, 100 and 1,000', rating: 'C', evidence: 'e5' },
  ];
  const out = evUebApplyNative(prev, [true, true], res, {});
  assert.deepEqual(out.criteria.map(c => c.standard), ['E-S2', 'none', 'M-N1', 'none', 'M-N3']);
  assert.deepEqual(out.touched, [true, true, false, false, false]);
  assert.deepEqual(out.criteria.map(c => c.evidence), ['e1', 'e2', 'e3', 'e4', 'e5']);
  const linked = evUebApplyNative([], undefined, [{ criterion: 'Src row', rating: '', evidence: '' }], { parsed: evUebParseStandards('Standards\nSrc row -> E-W1') });
  assert.equal(linked.criteria[0].standard, 'E-W1');
});

test('remap: injected grown catalog gives a notice candidate, old catalog and unrelated rows give none', () => {
  const t = task('grow', [row('Fractions of whole shapes', 'none'), row('Fractions of whole shapes', 'M-N1'), row('Invented: unrelated', 'none')]);
  assert.deepEqual(evUebRemapCandidates([t]), [], 'no result, no notice');
  const out = evUebRemapCandidates([t], { catalog: GROWN });
  assert.equal(out.length, 1);
  assert.equal(out[0].evaluation, 'grow');
  assert.deepEqual(out[0].rows, [{ index: 0, criterion: 'Fractions of whole shapes', code: 'M-F1' }]);
});

test('remap: known private pair and skip rules (withdrawn, conflict, pending, legacy)', () => {
  const a = task('a', [row('Invented: own phrase qq', 'none')]), b = task('b', [row('invented: own  phrase QQ', 'E-S2')]);
  assert.deepEqual(evUebRemapCandidates([a, b]).map(c => [c.evaluation, c.rows[0].code]), [['a', 'E-S2']]);
  const mk = (id, extra, mutate) => { const x = task(id, [row('Fractions of whole shapes', 'none')], extra); mutate?.(x); return x; };
  const skipped = [
    mk('w', {}, x => { x.manual.withdrawn = true; }), mk('c', {}, x => { x.manual.conflicts = ['y']; }),
    mk('p', { pending: true }), mk('l', {}, x => { x.assessment.criteria = [{ criterion: 'Fractions of whole shapes', rating: 'C', evidence: '' }]; }),
  ];
  assert.deepEqual(evUebRemapCandidates(skipped, { catalog: GROWN }), []);
});

test('applyCandidate: only none rows with matching text change; input is not mutated', () => {
  const doc = { area: 'maths', goal: 'g', instructions: 'i', feedback: 'f', criteria: [row('Fractions of whole shapes', 'none', 'RS'), row('Fractions of whole shapes', 'M-N1', 'M'), row('Other', 'none')] };
  const before = JSON.stringify(doc);
  const out = evUebApplyCandidate(doc, [
    { index: 0, criterion: 'Fractions of whole shapes', code: 'M-F1' },
    { index: 1, criterion: 'Fractions of whole shapes', code: 'M-F1' },
    { index: 2, criterion: 'Changed text', code: 'M-F1' },
  ]);
  assert.deepEqual(out.criteria.map(c => c.standard), ['M-F1', 'M-N1', 'none']);
  assert.deepEqual(out.criteria.map(c => c.rating), ['RS', 'M', 'C']);
  assert.equal(JSON.stringify(doc), before);
});
