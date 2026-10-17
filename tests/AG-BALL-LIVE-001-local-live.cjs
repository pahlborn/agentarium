'use strict';
/* AG-BALL-LIVE-001 local live verification, candidate AG-BALL-LIVE-001-c1.

   SYNTHETIC COMPONENT TEST. Every event this test ingests is an explicitly
   labelled SYNTHETIC_TEST_FIXTURE (source_evidence=synthetic_test_fixture).
   A PASS here is component evidence for server/transport/browser wiring.
   It is NEVER real-source evidence of a Claude worker stream.

   Run:  node tests/AG-BALL-LIVE-001-local-live.cjs
   Env:  PYTHON (default python3), BALL_OUT_DIR, BALL_WAIT_MS (default 15000)
   Needs: require('playwright') and an installed Chromium. */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const VERSION = 'AG-BALL-LIVE-001-c1';
const REPO = path.resolve(__dirname, '..');
const SERVER = path.join(REPO, 'pilot', 'AG-BALL-LIVE-001', 'local_server.py');
const OUT = process.env.BALL_OUT_DIR || path.join(REPO, 'artifacts', 'AG-BALL-LIVE-001');
const PY = process.env.PYTHON || 'python3';
const WAIT = Number(process.env.BALL_WAIT_MS || 15000);
const TOKEN = crypto.randomBytes(24).toString('hex');
const TAG = crypto.randomBytes(4).toString('hex');
const RUN = 'SYNTHETIC-RUN-' + TAG;
const LABEL = 'SYNTHETIC_TEST_FIXTURE';
const RING = 8;

const checks = [];
function check(name, ok, detail) {
  checks.push({ name, ok: !!ok, detail: detail === undefined ? null : detail });
  if (!ok) throw new Error('CHECK FAILED: ' + name + ' ' + JSON.stringify(detail === undefined ? null : detail));
}

function request(base, method, p, opt) {
  opt = opt || {};
  return new Promise((resolve, reject) => {
    const u = new URL(p, base);
    const data = opt.body === undefined ? null
      : (typeof opt.body === 'string' ? opt.body : JSON.stringify(opt.body));
    const h = Object.assign({}, opt.headers || {});
    if (data !== null) {
      if (!h['Content-Type']) h['Content-Type'] = 'application/json';
      h['Content-Length'] = Buffer.byteLength(data);
    }
    if (opt.token) h['Authorization'] = 'Bearer ' + opt.token;
    const req = http.request({ hostname: u.hostname, port: u.port, path: u.pathname + u.search,
                               method, headers: h, timeout: WAIT }, (res) => {
      let buf = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { buf += c; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(buf); } catch (e) { /* not JSON */ }
        resolve({ status: res.statusCode, json, text: buf });
      });
    });
    req.on('timeout', () => req.destroy(new Error('request timeout ' + p)));
    req.on('error', reject);
    if (data !== null) req.write(data);
    req.end();
  });
}

let n = 0;
function fixture(over) {
  n++;
  return Object.assign({
    id: 'SYN-' + TAG + '-' + n, run_id: RUN, actor: 'forge', kind: 'progress',
    title: LABEL + ' #' + n + ' – Forge progress (component test, not real evidence)',
    recipient: null, source_evidence: 'synthetic_test_fixture',
    source_tool_id: 'synthetic-tool-' + n
  }, over || {});
}

function startServer() {
  return new Promise((resolve, reject) => {
    const proc = spawn(PY, [SERVER, '--port', '0'], {
      env: Object.assign({}, process.env, { BALL_INGEST_TOKEN: TOKEN, BALL_RING_MAX: String(RING) }),
      stdio: ['ignore', 'pipe', 'pipe']
    });
    const lines = [], errs = [];
    let done = false;
    const timer = setTimeout(() => { if (!done) { done = true; reject(new Error('no READY within ' + WAIT + ' ms')); } }, WAIT);
    readline.createInterface({ input: proc.stdout }).on('line', (line) => {
      lines.push(line);                     /* keeps draining stdout */
      let o = null;
      try { o = JSON.parse(line); } catch (e) { /* ignore */ }
      if (done || !o) return;
      if (o.event === 'READY') { done = true; clearTimeout(timer); resolve({ proc, ready: o, lines }); }
      if (o.event === 'ERROR') { done = true; clearTimeout(timer); reject(new Error('server ERROR ' + line)); }
    });
    proc.stderr.on('data', (d) => errs.push(String(d)));
    proc.on('exit', (code) => {
      if (!done) { done = true; clearTimeout(timer); reject(new Error('server exited ' + code + ' ' + errs.join(''))); }
    });
  });
}

const waitFn = (page, fn, arg) => page.waitForFunction(fn, arg, { timeout: WAIT, polling: 50 });
const waitAccepted = (page, id) => waitFn(page, (i) => !!window.__agBallLive &&
  Array.isArray(window.__agBallLive.accepted) && window.__agBallLive.accepted.indexOf(i) >= 0, id);
const waitState = (page, s) => waitFn(page, (x) => !!window.__agBallLive && window.__agBallLive.state === x, s);
const live = (page) => page.evaluate(() => {
  const B = window.__agBallLive;
  return { state: B.state, accepted: B.accepted.slice(), duplicates: B.duplicates,
           gaps: B.gaps.slice(), connects: B.connects, cursor: B.cursor,
           rejected: B.rejected.slice(), last: B.last, version: B.version };
});
const stand = (page) => page.evaluate(() => {
  const s = window.__agStand();
  return { aufgabenAuf: s.aufgabenAuf, aufgabenZu: s.aufgabenZu, register: s.register,
           bausteine: s.bausteine, ball: s.ball, arbeiten: s.arbeiten,
           fliegend: s.fliegend.length, ereignisse: s.ereignisse };
});
const listCount = (page, text) => page.evaluate((t) => {
  return Array.from(document.querySelectorAll('#agLaeuft .agAuf'))
    .filter((e) => e.textContent.indexOf(t) >= 0).length;
}, text);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  let srv = null, browser = null, error = null;
  const pageErrors = [], consoleErrors = [];
  try {
    srv = await startServer();
    const base = srv.ready.base;
    check('ready_json', srv.ready.version === VERSION && srv.ready.port > 0 &&
          /^http:\/\/127\.0\.0\.1:\d+\/index\.html\?ball_live=1$/.test(srv.ready.url), srv.ready);
    const h0 = await request(base, 'GET', '/health');
    check('health_before_browser', h0.status === 200 && h0.json.ok === true && h0.json.clients === 0, h0.json);
    const swr = await request(base, 'GET', '/sw.js');
    check('sw_not_served', swr.status === 404, swr.status);

    browser = await chromium.launch({ headless: true,
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', (e) => pageErrors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    let navs = 0;
    page.on('framenavigated', (f) => { if (f === page.mainFrame()) navs++; });
    const urls = [];
    page.on('request', (r) => urls.push(r.url()));

    /* 1. Open the ORIGINAL first; transport must be ready before any event. */
    await page.goto(srv.ready.url, { waitUntil: 'load', timeout: WAIT });
    check('webgl_available', await page.evaluate(() => !!window.__feld),
          'ORIGINAL needs WebGL; without it the hooks are never defined');
    await page.evaluate(() => { window.__agNoReloadMarker = 'kept'; });
    const origin0 = await page.evaluate(() => performance.timeOrigin);
    await waitState(page, 'verbunden');
    const h1 = await request(base, 'GET', '/health');
    check('health_sees_viewer', h1.json.clients >= 1, h1.json);
    const boot = await page.evaluate(() => ({
      modus: document.body.getAttribute('data-modus'),
      ballLive: document.body.getAttribute('data-ball-live'),
      panel: document.getElementById('agBallLive').textContent,
      ereignisse: window.__agStand().ereignisse,
      swController: !!(navigator.serviceWorker && navigator.serviceWorker.controller)
    }));
    check('candidate_version_ui_js', boot.ballLive === VERSION && boot.panel.indexOf(VERSION) >= 0, boot);
    check('demo_disabled_live_mode', boot.modus === 'live' && boot.ereignisse === 0, boot);
    check('no_service_worker_controller', boot.swController === false, boot);
    const regs = await page.evaluate(() => navigator.serviceWorker
      ? navigator.serviceWorker.getRegistrations().then((r) => r.length) : 0);
    check('no_service_worker_registration', regs === 0, regs);

    /* 2. One synthetic progress event after the connection. */
    const before = await stand(page);
    const e1 = fixture();
    const r1 = await request(base, 'POST', '/ingest', { body: e1, token: TOKEN });
    check('ingest_e1_201', r1.status === 201 && r1.json.ok === true && r1.json.duplicate === false, r1.json);
    await waitAccepted(page, e1.id);
    await waitFn(page, (t) => { const l = document.getElementById('agLaeuft');
                                return !!l && l.textContent.indexOf(t) >= 0; }, e1.title);
    const vis = await page.evaluate(() => {
      const p = document.getElementById('agBallLive');
      const r = p.getBoundingClientRect(), cs = getComputedStyle(p);
      return { text: p.innerText, provenance: p.getAttribute('data-provenance'),
               eventId: p.getAttribute('data-event-id'),
               visible: r.width > 0 && r.height > 0 && cs.display !== 'none' &&
                        cs.visibility !== 'hidden' && Number(cs.opacity) > 0 };
    });
    check('panel_visible_id_title', vis.visible && vis.text.indexOf(e1.id) >= 0 &&
          vis.text.indexOf(e1.title) >= 0, vis);
    check('panel_provenance_is_synthetic', vis.provenance === 'synthetic_test_fixture' &&
          vis.text.indexOf('SYNTHETISCH') >= 0, vis);
    await page.screenshot({ path: path.join(OUT, 'synthetic-progress-full.png') });
    await page.locator('#agBallLive').screenshot({ path: path.join(OUT, 'synthetic-progress-panel.png') });
    const after = await stand(page);
    const row = await page.evaluate((t) => {
      const rows = Array.from(document.querySelectorAll('#agLaeuft .agAuf'))
        .filter((e) => e.textContent.indexOf(t) >= 0);
      return rows.length ? rows[rows.length - 1].className : null;
    }, e1.title);
    check('progress_no_completion', after.aufgabenZu === before.aufgabenZu &&
          after.aufgabenAuf === before.aufgabenAuf && after.register === before.register &&
          after.bausteine === before.bausteine && after.ball === before.ball &&
          JSON.stringify(after.arbeiten) === JSON.stringify(before.arbeiten) &&
          after.fliegend === 0 && after.ereignisse === before.ereignisse + 1 &&
          /\btat\b/.test(row || '') && !/\boffen\b/.test(row || ''), { before, after, row });

    /* 3. Rejections. Ordering proof: a later valid marker arrives, rejected ones never do. */
    const rejectedIds = [];
    const cases = [
      ['no_token', fixture(), null, 401],
      ['wrong_token', fixture(), 'x'.repeat(48), 401],
      ['kind_artifact', fixture({ kind: 'artifact' }), TOKEN, 400],
      ['kind_unknown', fixture({ kind: 'banana' }), TOKEN, 400],
      ['extra_field_raw_tool_input', Object.assign(fixture(), { raw_tool_input: { file_path: '/etc/passwd' } }), TOKEN, 400],
      ['bad_id', fixture({ id: 'bad id with spaces' }), TOKEN, 400],
      ['unknown_actor', fixture({ actor: 'mallory' }), TOKEN, 400],
      ['bad_evidence', fixture({ source_evidence: 'live' }), TOKEN, 400],
      ['empty_title', fixture({ title: '   ' }), TOKEN, 400],
      ['control_chars', fixture({ title: 'a\u0007b' }), TOKEN, 400]
    ];
    for (const [name, ev, tok, code] of cases) {
      const r = await request(base, 'POST', '/ingest', { body: ev, token: tok });
      check('reject_' + name, r.status === code, { status: r.status, body: r.json });
      rejectedIds.push(ev.id);
    }
    const rj1 = await request(base, 'POST', '/ingest', { body: 'not json', token: TOKEN });
    check('reject_invalid_json', rj1.status === 400, rj1.status);
    const rj2 = await request(base, 'POST', '/ingest', { body: '[1,2]', token: TOKEN });
    check('reject_non_object', rj2.status === 400, rj2.status);
    const rj3 = await request(base, 'POST', '/ingest', { body: JSON.stringify(fixture()), token: TOKEN,
                                                         headers: { 'Content-Type': 'text/plain' } });
    check('reject_content_type', rj3.status === 415, rj3.status);
    const m1 = fixture();
    check('ingest_m1_201', (await request(base, 'POST', '/ingest', { body: m1, token: TOKEN })).status === 201);
    await waitAccepted(page, m1.id);
    let L = await live(page);
    check('rejected_never_reach_ui', L.accepted.filter((i) => rejectedIds.indexOf(i) >= 0).length === 0, L.accepted);

    /* 4. Dedupe: server-side duplicate, then client-side replay duplicate. */
    const rd = await request(base, 'POST', '/ingest', { body: e1, token: TOKEN });
    check('server_duplicate_200', rd.status === 200 && rd.json.duplicate === true && rd.json.seq === r1.json.seq, rd.json);
    const m2 = fixture();
    check('ingest_m2_201', (await request(base, 'POST', '/ingest', { body: m2, token: TOKEN })).status === 201);
    await waitAccepted(page, m2.id);
    L = await live(page);
    check('dedupe_no_double_accept', L.accepted.filter((i) => i === e1.id).length === 1, L.accepted);
    check('dedupe_no_double_row', (await listCount(page, e1.title)) === 1);
    const pre = L;
    await page.evaluate(() => window.__agBallLive.verbinden({ cursor: 0 }));
    await waitFn(page, (c) => window.__agBallLive.connects > c && window.__agBallLive.state === 'verbunden', pre.connects);
    L = await live(page);
    check('replay_deduped_client_side', L.duplicates > pre.duplicates &&
          L.accepted.length === pre.accepted.length, { pre: pre.duplicates, now: L.duplicates });
    check('replay_no_double_row', (await listCount(page, e1.title)) === 1);

    /* 5. Escaping: markup in title must not become markup. */
    const x1 = fixture({ title: '<img src=x onerror="window.__agXss=1">' + LABEL + ' xss probe' });
    check('ingest_x1_201', (await request(base, 'POST', '/ingest', { body: x1, token: TOKEN })).status === 201);
    await waitAccepted(page, x1.id);
    await waitFn(page, (t) => { const l = document.getElementById('agLaeuft');
                                return !!l && l.textContent.indexOf(t) >= 0; }, x1.title);
    const xs = await page.evaluate(() => ({
      flag: window.__agXss, imgs: document.querySelectorAll('#agLaeuft img, #agBallLive img, #agRufe img').length,
      panel: document.getElementById('agBallLiveLetztes').textContent }));
    check('title_escaped', xs.flag === undefined && xs.imgs === 0 && xs.panel.indexOf('<img src=x') >= 0, xs);

    /* 6. Viewer disconnect -> catch-up by cursor. */
    await page.evaluate(() => window.__agBallLive.trennen());
    await waitState(page, 'getrennt');
    const gapsBefore = (await live(page)).gaps.length;
    const c1 = fixture();
    check('ingest_while_disconnected_201', (await request(base, 'POST', '/ingest', { body: c1, token: TOKEN })).status === 201);
    L = await live(page);
    check('not_delivered_while_disconnected', L.accepted.indexOf(c1.id) < 0, L.state);
    await page.evaluate(() => window.__agBallLive.verbinden());
    await waitAccepted(page, c1.id);
    L = await live(page);
    check('catch_up_without_gap', L.gaps.length === gapsBefore, L.gaps);

    /* 7. Server-side stream drop -> browser auto-reconnect with Last-Event-ID. */
    const preDrop = await live(page);
    const dr = await request(base, 'POST', '/debug/drop-streams', { body: '{}', token: TOKEN });
    check('drop_streams', dr.status === 200 && dr.json.dropped_streams >= 1, dr.json);
    await waitFn(page, (c) => window.__agBallLive.connects > c && window.__agBallLive.state === 'verbunden', preDrop.connects);
    const c2 = fixture();
    check('ingest_after_auto_reconnect_201', (await request(base, 'POST', '/ingest', { body: c2, token: TOKEN })).status === 201);
    await waitAccepted(page, c2.id);

    /* 8. Gap: more events than the ring holds while disconnected -> explicit gap. */
    await page.evaluate(() => window.__agBallLive.trennen());
    await waitState(page, 'getrennt');
    const burst = [];
    for (let i = 0; i < RING + 2; i++) {
      const g = fixture();
      burst.push(g);
      check('ingest_burst_' + i, (await request(base, 'POST', '/ingest', { body: g, token: TOKEN })).status === 201);
    }
    await page.evaluate(() => window.__agBallLive.verbinden());
    await waitAccepted(page, burst[burst.length - 1].id);
    L = await live(page);
    const lost = burst.filter((g) => L.accepted.indexOf(g.id) < 0).map((g) => g.id);
    const gapText = await page.evaluate(() => document.getElementById('agBallLiveLuecke').textContent);
    check('gap_explicit', L.gaps.length > gapsBefore && lost.length >= 1 &&
          L.gaps[L.gaps.length - 1].reason === 'ring_evicted' && gapText.indexOf('Lücke') >= 0,
          { gaps: L.gaps, lost, gapText });

    /* 9. Never reloaded; no token in page or requests. */
    const fin = await page.evaluate(() => ({ marker: window.__agNoReloadMarker,
      origin: performance.timeOrigin, xss: window.__agXss,
      navEntries: performance.getEntriesByType('navigation').length }));
    check('no_reload', navs === 1 && fin.marker === 'kept' && fin.origin === origin0 &&
          fin.navEntries === 1, { navs, fin });
    check('xss_flag_still_unset', fin.xss === undefined);
    const html = await page.content();
    check('token_not_in_browser', html.indexOf(TOKEN) < 0 && urls.every((u) => u.indexOf(TOKEN) < 0));
    check('no_live_js_page_errors', pageErrors.filter((e) => /live\.js|__agBallLive/.test(e)).length === 0, pageErrors);
    await page.screenshot({ path: path.join(OUT, 'synthetic-final-full.png') });
    const h2 = await request(base, 'GET', '/health');
    check('health_after', h2.status === 200 && h2.json.durable === false, h2.json);
  } catch (e) {
    error = String(e && e.stack || e);
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (srv) srv.proc.kill('SIGTERM');
    const report = {
      task: 'AG-BALL-LIVE-001', version: VERSION,
      evidence_class: 'SYNTHETIC_COMPONENT_TEST — not real-source evidence',
      result: error ? 'FAIL' : 'PASS', error, checks,
      page_errors: pageErrors, console_errors: consoleErrors,
      server_log: srv ? srv.lines : []
    };
    fs.writeFileSync(path.join(OUT, 'synthetic-result.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ result: report.result, evidence_class: report.evidence_class,
      passed: checks.filter((c) => c.ok).length, failed: checks.filter((c) => !c.ok).length,
      error, out: OUT }, null, 2));
    process.exit(error ? 1 : 0);
  }
})();
