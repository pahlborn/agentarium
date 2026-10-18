/* AG-GH-LIVE-004 — Komponententest Adapter v1.3 (NodeVM, kein Browser, kein Netz).
   Ausfuehren: node tests/AG-GH-LIVE-004-forge.cjs
   Prueft: Arten progress/handoff/contribution, recipient-Regeln, Abweisungen
   (test_result, artifact, unbekanntes Feld, fremder Autor, fehlender/unbekannter
   recipient), Weitergabe voller Schluessel + Herkunft an __agEreignis, Token
   nie im weitergereichten Ereignis, Sperre ohne Bruecken-Zusage.
   Teil B: statische Quellpruefung der Original-Guards in schicht.py
   (ersetzt NICHT Sentinels Browser-/Bewegungs-/Zustandspruefung). */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const ADAPTER = fs.readFileSync(path.join(ROOT, 'previews/AG-VISUAL-005-feld/github-live.js'), 'utf8');
const SCHICHT = fs.readFileSync(path.join(ROOT, 'previews/AG-VISUAL-005-feld/schicht.py'), 'utf8');
const TOKEN = 'ghp_TESTTOKEN0123456789abcdefXYZ';
const MARKER = '<!-- AGENTARIUM_EVENT_V1 -->';
const AKTEURE = ['peter', 'nova', 'atlas', 'cadence', 'scout', 'forge', 'sentinel', 'archibald', 'argus'];

function kommentar(id, login, obj, createdAt) {
  return { id, user: { login }, created_at: createdAt || new Date(Date.now() + 60000).toISOString(),
           body: 'Text davor\n' + MARKER + '\n```json\n' + JSON.stringify(obj) + '\n```\n' };
}
function ereignis(over) {
  return Object.assign({ schema: 'agentarium.github-event.v1', id: 'ev-1', project_id: 'agentarium',
    run_id: 'run-A', task_id: 'AG-T1', actor: 'atlas', kind: 'progress', title: 'Schritt',
    occurred_at: '2026-10-18T05:40:00Z', source_evidence: 'runtime_stream',
    source_tool_id: 'toolu_01ABC' }, over);
}

function umgebung(mitZusage) {
  const reg = {}, timer = [];
  let versatz = 0;                              /* steuerbare Uhr: Takt ohne Warten */
  class FDate extends Date {
    constructor(...a) { if (a.length === 0) super(Date.now() + versatz); else super(...a); }
    static now() { return Date.now() + versatz; }
  }
  function El(tag) {
    return { tagName: tag, children: [], attrs: {}, style: {}, textContent: '', value: '',
      open: false, disabled: false, _l: {},
      setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'id') reg[v] = this; },
      getAttribute(k) { return this.attrs[k]; },
      appendChild(c) { this.children.push(c); return c; },
      addEventListener(n, f) { (this._l[n] = this._l[n] || []).push(f); } };
  }
  const document = { head: El('head'), body: El('body'), hidden: false,
    createElement: El, getElementById: (id) => reg[id] || null, addEventListener() {} };
  const lauf = [], ereig = [], antworten = [];
  const window = {
    document,
    __agGithubBruecke: Object.assign({ fassung: '51', akteure: AKTEURE.slice(),
      istLive: () => true }, mitZusage ? { kommunikation: 'beobachtet-v1' } : {}),
    __agLauf: (d) => { lauf.push(JSON.parse(JSON.stringify(d))); return { angenommen: true }; },
    __agEreignis: (e) => { ereig.push(JSON.parse(JSON.stringify(e))); return { angenommen: true, id: e.id }; },
    addEventListener() {},
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    setTimeout: (f) => { timer.push(f); return timer.length; },
    clearTimeout() {}, setInterval() { return 0; },
    fetch: async (url, opt) => {
      const a = antworten.shift() || { status: 304, items: null };
      return { status: a.status, headers: { get: (n) => (n === 'ETag' ? '"e' + Math.random() + '"' : null) },
               json: async () => a.items };
    },
    console, Date: FDate, JSON, Math, Object, Array, String, Number, RegExp, Promise, parseInt, isNaN, URL
  };
  window.window = window;
  vm.createContext(window);
  vm.runInContext(ADAPTER, window, { filename: 'github-live.js' });
  return { window, reg, timer, lauf, ereig, antworten, vor: (ms) => { versatz += ms; } };
}
const ruhe = () => new Promise((r) => setImmediate(r));
async function durchlauf(U, kommentare) {
  U.antworten.push({ status: 200, items: [] });                 /* Basis: leer */
  U.antworten.push({ status: 200, items: kommentare });         /* erster Live-Abruf */
  U.reg.agGhToken.value = TOKEN;
  U.reg.agGhAn._l.click[0]();
  for (let i = 0; i < 10; i++) await ruhe();
  const t = U.timer.pop(); assert.ok(t, 'naechster Abruf geplant');
  U.vor(5000);                                                  /* Takt (>= 2 s) verstrichen */
  t();
  for (let i = 0; i < 10; i++) await ruhe();
}

(async function () {
  let n = 0;
  /* ---------------- Teil A1: mit Zusage des Originals ---------------- */
  const U = umgebung(true);
  assert.strictEqual(U.window.__agGithub.version, 'AG-GH-LIVE-001-v1.3'); n++;
  const ks = [
    kommentar(1, 'github-actions[bot]', ereignis({ id: 'p-alt', source_evidence: 'reported_checkpoint' })),
    kommentar(2, 'github-actions[bot]', ereignis({ id: 'h-1', kind: 'handoff', actor: 'atlas',
      recipient: 'forge', task_id: 'AG-T1', title: 'Forge: Slice bauen' })),
    kommentar(3, 'pahlborn', ereignis({ id: 'c-1', kind: 'contribution', actor: 'sentinel',
      recipient: 'atlas', project_id: 'fremd', run_id: 'run-B', task_id: 'AG-T2',
      title: 'QA PASS (Bericht)', source_tool_id: 'toolu_02XYZ' })),
    kommentar(4, 'github-actions[bot]', ereignis({ id: 'x-1', kind: 'handoff' })),                    /* ohne recipient */
    kommentar(5, 'github-actions[bot]', ereignis({ id: 'x-2', kind: 'handoff', recipient: 'mallory' })),
    kommentar(6, 'github-actions[bot]', ereignis({ id: 'x-3', kind: 'test_result', recipient: 'atlas' })),
    kommentar(7, 'github-actions[bot]', ereignis({ id: 'x-4', kind: 'artifact', recipient: 'atlas' })),
    kommentar(8, 'github-actions[bot]', ereignis({ id: 'x-5', model: 'opus' })),                       /* unbekanntes Feld */
    kommentar(9, 'someone-else', ereignis({ id: 'x-6', kind: 'handoff', recipient: 'forge' })),
    kommentar(10, 'github-actions[bot]', ereignis({ id: 'x-7', kind: 'contribution', recipient: 7 })),
    kommentar(11, 'github-actions[bot]', ereignis({ id: 'x-8', kind: 'progress', recipient: 'nobody' }))
  ];
  await durchlauf(U, ks);
  const st = U.window.__agGithub.stand();
  assert.strictEqual(st.phase, 'verbunden'); n++;
  assert.deepStrictEqual(U.ereig.map((e) => e.id), ['p-alt', 'h-1', 'c-1'], 'nur gueltige weitergereicht'); n++;
  assert.strictEqual(st.zahl.abgewiesen, 8, 'acht Abweisungen'); n++;
  const [p, h, c] = U.ereig;
  assert.strictEqual(p.kind, 'progress'); assert.ok(!('recipient' in p), 'alter progress ohne recipient'); n++;
  assert.strictEqual(h.kind, 'handoff'); assert.strictEqual(h.recipient, 'forge'); n++;
  assert.strictEqual(c.kind, 'contribution'); assert.strictEqual(c.recipient, 'atlas'); n++;
  for (const e of U.ereig) {
    for (const f of ['id', 'actor', 'project_id', 'run_id', 'task_id', 'source_evidence', 'source_tool_id'])
      assert.ok(typeof e[f] === 'string' && e[f], e.id + ' traegt ' + f);
    assert.strictEqual(e.gh_beobachtet, true); assert.strictEqual(e.fictional, false);
    assert.ok(!('verbrauch' in e) && !('model' in e), 'kein Modell/Verbrauch erfunden');
  }
  n++;
  assert.deepStrictEqual([c.project_id, c.run_id, c.task_id, c.source_tool_id],
    ['fremd', 'run-B', 'AG-T2', 'toolu_02XYZ'], 'fremder Lauf vollstaendig'); n++;
  assert.strictEqual(p.source_evidence, 'reported_checkpoint'); n++;
  assert.ok(!JSON.stringify([U.ereig, U.lauf, st]).includes(TOKEN), 'Token nie weitergereicht'); n++;
  assert.deepStrictEqual(U.lauf.map((l) => l.project_id + '|' + l.titel),
    ['agentarium|run-A', 'fremd|run-B'], 'Laufwechsel je project|run'); n++;
  const zeile = U.reg.agGhLetztes.textContent;
  assert.ok(zeile.includes('contribution') && zeile.includes('sentinel → atlas') &&
    zeile.includes('fremd / run-B / AG-T2') && zeile.includes('toolu_02XYZ') &&
    zeile.includes('keine Annahme/Abnahme'), 'letzte Zeile mit Schluesseln: ' + zeile); n++;
  assert.ok(st.grund.includes('recipient unbekannt'), 'letzter Grund: progress mit unbekanntem recipient'); n++;

  /* ---------------- Teil A2: OHNE Zusage (altes Original) ---------------- */
  const V = umgebung(false);
  await durchlauf(V, [ks[0], ks[1], ks[2]]);
  assert.deepStrictEqual(V.ereig.map((e) => e.id), ['p-alt'], 'ohne Zusage nur progress'); n++;
  assert.ok(V.window.__agGithub.stand().grund.includes('Original kennt beobachtete Kommunikation nicht')); n++;

  /* ---------------- Teil B: statische Quellpruefung schicht.py ---------------- */
  assert.ok(SCHICHT.includes("var FASSUNG = '51'"), 'Fassung 51'); n++;
  assert.ok(SCHICHT.includes("kommunikation: 'beobachtet-v1'"), 'Bruecken-Zusage'); n++;
  const iBeob = SCHICHT.indexOf('if (E.beobachtet) {'), iFertig = SCHICHT.indexOf('auftragFertig(E.von, E.erledigt');
  assert.ok(iBeob > 0 && iFertig > iBeob, 'Beobachtet-Zweig vor auftragFertig'); n++;
  assert.ok(SCHICHT.includes('if (b.sonne && !b.beobachtet) arbeitAn('), 'kein arbeitAn'); n++;
  assert.ok(SCHICHT.includes('if (b.ganz && !b.beobachtet)'), 'kein derBall'); n++;
  assert.ok(SCHICHT.includes('if (!E.beobachtet && m.gestalt === \'sonne\' && derBall'), 'Ball unberuehrt'); n++;
  assert.ok(SCHICHT.includes("if (gh && !ghLive) return nein("), 'Marke nur im GitHub-Livebetrieb'); n++;
  assert.ok(SCHICHT.includes('var v = (fortschritt || gh) ? null : e.verbrauch;'), 'kein Modell aus GitHub'); n++;

  console.log('AG-GH-LIVE-004 forge component test: PASS (' + n + ' checks)');
})().catch((e) => { console.error('FAIL:', e && e.stack || e); process.exit(1); });
