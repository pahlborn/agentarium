/* AG-GH-LIVE-001 — SYNTHETIC component test. NOT evidence of the real GitHub transport.
 *
 * api.github.com is answered by page.route() with synthetic fixtures; the token is a fake.
 * The actual GitHub pilot (real token, real issue #2, real iPad) is a separate, manual step.
 *
 * Usage (from repo root, after building):
 *   python3 previews/AG-VISUAL-005-feld/bauen.py /tmp/ag-gh-live --stuecke-aus feld/index.html \
 *           --gebaut 2026-10-17T12:00Z --icons feld
 *   node tests/AG-GH-LIVE-001.cjs /tmp/ag-gh-live
 * Requires: npm package `playwright` with Chromium installed. Exit code 1 on any FAIL.
 */
'use strict';
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIR = path.resolve(process.argv[2] || process.env.AG_BUILD_DIR || 'build-gh-live');
const TOKEN = 'ghp_SYNTHETIC0fake0token0for0tests0only00';
const PFAD = '/repos/pahlborn/agentarium/issues/2/comments';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
function check(name, ok, info) {
  results.push({ name, ok: !!ok });
  console.log((ok ? 'PASS' : 'FAIL') + ' [SYNTHETIC] ' + name + (info ? ' — ' + info : ''));
}

/* ---------- static server, Node stdlib only ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (p === '/') p = '/index.html';
      const f = path.join(DIR, path.normalize(p).replace(/^([/\\])+/, ''));
      if (!f.startsWith(DIR) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
        res.writeHead(404); return res.end('not found');
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream',
                           'Cache-Control': 'no-store' });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

/* ---------- synthetic GitHub ---------- */
function makeGitHub() {
  const st = { comments: [], nextId: 5000, mode: 'ok', requests: [], served: { 200: 0, 304: 0, 401: 0 },
               inflight: 0, maxInflight: 0 };
  const alt = new Date(Date.now() - 3600e3).toISOString();
  st.add = (login, body, created) => st.comments.push({ id: st.nextId++, user: { login, type: 'User' },
    body, created_at: created || new Date().toISOString(), updated_at: created || new Date().toISOString() });
  st.alt = alt;
  function etag(items, n) {
    let h = 2166136261;
    const s = n + '|' + items.map((c) => c.id + ':' + c.body.length).join(',');
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return 'W/"' + h.toString(16) + '"';
  }
  st.handle = async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const cors = { 'access-control-allow-origin': '*',
      'access-control-expose-headers': 'ETag, Link, Retry-After, X-Poll-Interval, X-RateLimit-Remaining, X-RateLimit-Reset' };
    if (req.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: Object.assign({}, cors, {
        'access-control-allow-headers': 'authorization, if-none-match, accept',
        'access-control-allow-methods': 'GET', 'access-control-max-age': '600' }) });
    }
    const h = await req.allHeaders();
    st.inflight++; st.maxInflight = Math.max(st.maxInflight, st.inflight);
    st.requests.push({ t: Date.now(), url: req.url(), auth: h.authorization || '',
                       inm: h['if-none-match'] || '', method: req.method() });
    await sleep(120);  /* makes overlapping requests detectable */
    st.inflight--;
    if (url.pathname !== PFAD) return route.fulfill({ status: 404, headers: cors, body: '{}' });
    if (st.mode === '401' || h.authorization !== 'Bearer ' + TOKEN) {
      st.served[401]++;
      return route.fulfill({ status: 401, headers: Object.assign({ 'content-type': 'application/json' }, cors),
                             body: '{"message":"Bad credentials"}' });
    }
    const n = parseInt(url.searchParams.get('page') || '1', 10);
    const items = st.comments.slice((n - 1) * 100, n * 100);
    const tag = etag(items, n);
    const last = Math.max(1, Math.ceil(st.comments.length / 100));
    const hdr = Object.assign({ 'content-type': 'application/json; charset=utf-8', etag: tag }, cors);
    if (n < last) {  /* GitHub-style Link using the /repositories/<id>/ form */
      hdr.link = '<https://api.github.com/repositories/987654/issues/2/comments?per_page=100&page=' + (n + 1) +
        '>; rel="next", <https://api.github.com/repositories/987654/issues/2/comments?per_page=100&page=' + last +
        '>; rel="last"';
    }
    if (h['if-none-match'] === tag) { st.served[304]++; return route.fulfill({ status: 304, headers: Object.assign({ etag: tag }, cors) }); }
    st.served[200]++;
    return route.fulfill({ status: 200, headers: hdr, body: JSON.stringify(items) });
  };
  return st;
}
function evBody(o) {
  const ev = Object.assign({ schema: 'agentarium.github-event.v1', id: 'EV-X', project_id: 'agentarium',
    run_id: 'AG-GH-LIVE-001-SYNTH', task_id: 'AG-GH-LIVE-001', actor: 'forge', kind: 'progress',
    title: 'Synthetic progress', occurred_at: new Date().toISOString(), source_evidence: 'runtime_stream',
    source_tool_id: 'synthetic-fixture' }, o);
  return 'SYNTHETIC fixture comment\n<!-- AGENTARIUM_EVENT_V1 -->\n```json\n' + JSON.stringify(ev, null, 2) + '\n```\n';
}
async function warte(page, fn, arg, ms) {
  try { await page.waitForFunction(fn, arg, { timeout: ms || 15000 }); return true; } catch (x) { return false; }
}
const stand = (page) => page.evaluate(() => window.__agGithub.stand());
const feld = (page) => page.evaluate(() => window.__agStand());

(async () => {
  if (!fs.existsSync(path.join(DIR, 'index.html')) || !fs.existsSync(path.join(DIR, 'github-live.js'))) {
    console.error('Build dir missing index.html/github-live.js: ' + DIR); process.exit(2);
  }
  const srv = await serve();
  const BASE = 'http://127.0.0.1:' + srv.address().port + '/index.html';
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1180, height: 820 } });
  const gh = makeGitHub();
  await ctx.route('https://api.github.com/**', gh.handle);
  const alleAnfragen = [], konsole = [];
  ctx.on('request', (r) => alleAnfragen.push({ url: r.url(), headers: r.headers() }));
  await ctx.addInitScript(() => {
    window.__fetchLog = [];
    const f = window.fetch;
    window.fetch = function (u, init) {
      try { if (String(u).indexOf('https://api.github.com/') === 0)
        window.__fetchLog.push({ cache: init && init.cache, credentials: init && init.credentials }); } catch (x) {}
      return f.apply(this, arguments);
    };
  });

  try {
    /* ===== A. demo / archive unchanged ===== */
    const p0 = await ctx.newPage();
    p0.on('console', (m) => konsole.push(m.text()));
    await p0.goto(BASE);
    const ok0 = await warte(p0, () => typeof window.__agStand === 'function', null, 20000);
    const hw = await p0.evaluate(() => (document.getElementById('hinweis') || {}).textContent || '');
    check('Original layer active (WebGL available)', ok0 && hw.indexOf('WebGL') < 0, hw);
    await sleep(1500);
    const d = await p0.evaluate(() => ({ modus: document.body.getAttribute('data-modus'),
      panel: !!document.getElementById('agGithub'), s: window.__agStand(),
      stuecke: Array.from(document.querySelectorAll('#agWas li[data-nr]')).map((l) => l.textContent),
      fassung: (document.getElementById('agFassung') || {}).textContent || '' }));
    check('demo: default mode demo, autostart running', d.modus === 'demo' && d.s.zeit > 0 && d.s.ereignisse > 0);
    check('demo: no GitHub panel', !d.panel);
    check('demo: both pieces in original order', JSON.stringify(d.stuecke) === '["NACHTPOST V1","NACHTPOST V2"]', JSON.stringify(d.stuecke));
    check('page version 49 shown', d.fassung.indexOf('Fassung 49') >= 0);
    await p0.evaluate(() => document.querySelector('#agWas li[data-modus="archiv"]').click());
    const ar = await p0.evaluate(() => ({ m: document.body.getAttribute('data-modus'), h: document.getElementById('agHalt').textContent }));
    check('archive: switchable, waits for start', ar.m === 'archiv' && ar.h === 'Starten', JSON.stringify(ar));
    check('demo/archive: no api.github.com request', !alleAnfragen.some((r) => r.url.indexOf('api.github.com') >= 0));
    await p0.close();

    /* ===== B. live: baseline of 140 comments ===== */
    for (let i = 0; i < 129; i++) gh.add(i % 3 ? 'pahlborn' : 'someone', 'Prose comment ' + i + ' mentions forge progress kind', gh.alt);
    for (let i = 1; i <= 10; i++) gh.add('pahlborn', evBody({ id: 'HIST-' + i, title: 'Historical ' + i }), gh.alt);
    gh.add('pahlborn', evBody({ id: 'BOOT-1', title: 'Arrived during bootstrap' }),
           new Date(Date.now() + 600e3).toISOString());   /* created after cutoff */
    const p = await ctx.newPage();
    p.on('console', (m) => konsole.push(m.text()));
    await p.goto(BASE + '?live=github');
    check('live: panel present', await warte(p, () => !!window.__agGithub && !!document.getElementById('agGhToken')));
    const l0 = await p.evaluate(() => ({ m: document.body.getAttribute('data-modus'), s: window.__agStand() }));
    check('live: original switched to live, no demo autostart', l0.m === 'live' && l0.s.ereignisse === 0);
    await p.evaluate(() => { window.__keinReload = 'gleiche-seite'; });
    await p.fill('#agGhToken', TOKEN);
    let geklickt = true;
    try { await p.click('#agGhAn', { timeout: 4000 }); } catch (e) { geklickt = false; }
    check('connect button reachable (not covered by Original layers)', geklickt);
    if (!geklickt) await p.evaluate(() => document.getElementById('agGhAn').click());
    check('connect: all baseline pages read before connected', await warte(p, () => window.__agGithub.stand().verbunden, null, 20000));
    let s = await stand(p);
    check('baseline: 140 comments, 10 historical marked not played', s.zahl.basisKommentare === 140 && s.zahl.basisMarkiert === 10, JSON.stringify(s.zahl));
    check('bootstrap arrival shown, labelled', s.zahl.waehrendAufbau === 1 &&
      await p.evaluate(() => !!document.querySelector('#agLaeuft [data-ereignis="BOOT-1"]')));
    check('no historical event played', await p.evaluate(() => !document.querySelector('#agLaeuft [data-ereignis^="HIST-"]')));
    const page2 = gh.requests.filter((r) => /page=2/.test(r.url));
    check('pagination via Link (/repositories/ form) to page 2', page2.length >= 1);
    const first = gh.requests[0];
    check('headers: Bearer token, no If-None-Match on first request', first.auth === 'Bearer ' + TOKEN && !first.inm);
    const fl = await p.evaluate(() => window.__fetchLog);
    check("fetch: cache 'no-cache', credentials 'omit'", fl.length > 0 && fl.every((x) => x.cache === 'no-cache' && x.credentials === 'omit'));
    check('input cleared after connect', (await p.inputValue('#agGhToken')) === '');

    /* ===== C. new event without reload through original hooks ===== */
    gh.add('github-actions[bot]', evBody({ id: 'LIVE-1', title: 'Forge baut den Adapter' }));
    check('new event rendered in Original list', await warte(p, () => !!document.querySelector('#agLaeuft [data-ereignis="LIVE-1"]')));
    const c = await p.evaluate(() => ({ r: document.getElementById('agRufe').textContent,
      l: document.getElementById('agLaeuft').textContent, k: window.__keinReload, s: window.__agStand() }));
    check('pulse label at actor with ID and provenance', c.r.indexOf('LIVE-1') >= 0 && c.r.indexOf('runtime_stream') >= 0);
    check('no reload', c.k === 'gleiche-seite');
    check('progress completes/opens no task', c.s.aufgabenZu === 0 && c.s.aufgabenAuf === 0 && c.s.arbeiten.length === 0);

    /* ===== D. duplicate ===== */
    gh.add('pahlborn', evBody({ id: 'LIVE-1', title: 'Duplicate' }));
    check('duplicate event id not replayed', await warte(p, () => window.__agGithub.stand().zahl.duplikate >= 1) &&
      (await feld(p)).ereignisse === 2);

    /* ===== E. 304 no replay, serial, >= 2 s ===== */
    const n304 = gh.served[304], e0 = (await feld(p)).ereignisse, r0 = gh.requests.length;
    await sleep(6000);
    const neu = gh.requests.slice(r0);
    check('304 served and nothing replayed', gh.served[304] > n304 && (await feld(p)).ereignisse === e0);
    check('conditional requests carry If-None-Match', neu.length > 0 && neu.every((r) => !!r.inm));
    check('requests never overlap', gh.maxInflight <= 1, 'max ' + gh.maxInflight);
    const abst = neu.slice(1).map((r, i) => r.t - neu[i].t).filter((x) => x > 400);
    check('poll spacing ~2 s or longer', abst.length > 0 && Math.min.apply(null, abst) >= 1800, JSON.stringify(abst));

    /* ===== F. page-100 boundary + new page ===== */
    while (gh.comments.length < 200) gh.add('someone', 'filler prose');
    await sleep(3500);
    gh.add('pahlborn', evBody({ id: 'LIVE-2', title: 'Comment 201 on page 3' }));
    check('event after page-100 boundary (new page 3) rendered', await warte(p, () => !!document.querySelector('#agLaeuft [data-ereignis="LIVE-2"]')));

    /* ===== G. unsafe author / invalid / H. unsafe title ===== */
    let a0 = (await stand(p)).zahl.abgewiesen;
    gh.add('mallory', evBody({ id: 'EVIL-1', title: 'Spoofed' }));
    gh.add('pahlborn', evBody({ id: 'BAD-KIND', kind: 'artifact' }));
    gh.add('pahlborn', evBody({ id: 'BAD-FIELD', verbrauch: { belegt: true, output_tokens: 9 } }));
    check('unsafe author + unsupported kind + extra field rejected visibly',
      await warte(p, (n) => window.__agGithub.stand().zahl.abgewiesen >= n + 3, a0) &&
      await p.evaluate(() => !document.querySelector('[data-ereignis="EVIL-1"],[data-ereignis="BAD-KIND"],[data-ereignis="BAD-FIELD"]') &&
        document.getElementById('agGhGrund').textContent.length > 0));
    gh.add('pahlborn', evBody({ id: 'XSS-1', title: '<img src=x onerror="window.__xss=1">' }));
    check('unsafe title rendered as text', await warte(p, () => !!document.querySelector('#agLaeuft [data-ereignis="XSS-1"]')));
    await sleep(500);
    const x = await p.evaluate(() => ({ img: document.querySelectorAll('#agLaeuft img, #agRufe img, #agGithub img, #agWas img').length,
      xss: window.__xss, t: document.getElementById('agLaeuft').textContent }));
    check('no HTML injection', x.img === 0 && x.xss === undefined && x.t.indexOf('<img') >= 0);
    gh.add('pahlborn', evBody({ id: 'CP-1', title: 'Checkpoint', source_evidence: 'reported_checkpoint' }));
    check('reported_checkpoint labelled as not runtime proof', await warte(p, () =>
      document.getElementById('agRufe').textContent.indexOf('kein Laufzeitbeleg') >= 0));

    /* ===== hidden tab pauses, resume catches up ===== */
    await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
                             document.dispatchEvent(new Event('visibilitychange')); });
    await sleep(2500);
    const h0 = gh.requests.length;
    gh.add('pahlborn', evBody({ id: 'HIDDEN-1', title: 'Arrived while hidden' }));
    await sleep(5000);
    check('hidden tab: polling paused', gh.requests.length - h0 <= 1, String(gh.requests.length - h0));
    await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
                             document.dispatchEvent(new Event('visibilitychange')); });
    check('resume: missed event caught up', await warte(p, () => !!document.querySelector('#agLaeuft [data-ereignis="HIDDEN-1"]')));

    /* ===== token never persisted / never sent elsewhere ===== */
    const leak = await p.evaluate(async (T) => {
      const st = [];
      for (const S of [localStorage, sessionStorage])
        for (let i = 0; i < S.length; i++) st.push(S.getItem(S.key(i)) || '');
      const dbs = indexedDB.databases ? await indexedDB.databases() : [];
      return { storage: st.some((v) => v.indexOf(T) >= 0), dbs: dbs.length,
               dom: document.documentElement.outerHTML.indexOf(T) >= 0, url: location.href.indexOf(T) >= 0,
               input: document.getElementById('agGhToken').value };
    }, TOKEN);
    check('token not in storage/IndexedDB/DOM/URL', !leak.storage && leak.dbs === 0 && !leak.dom && !leak.url && leak.input === '', JSON.stringify(leak));
    check('token only sent to api.github.com', alleAnfragen.every((r) =>
      r.url.indexOf(TOKEN) < 0 && (!(r.headers.authorization || '').includes(TOKEN) || r.url.indexOf('https://api.github.com/') === 0)));
    check('token not in console', konsole.every((t) => t.indexOf(TOKEN) < 0));

    /* ===== 401 visible, token cleared, polling stops ===== */
    gh.mode = '401';
    check('401 shown, token cleared', await warte(p, () => { const s2 = window.__agGithub.stand();
      return !s2.hatToken && document.getElementById('agGhStatus').textContent.indexOf('401') >= 0; }));
    const q0 = gh.requests.length;
    await sleep(4500);
    check('no requests after 401', gh.requests.length === q0);
  } catch (e) {
    check('test run without exception', false, String(e && e.stack || e));
  } finally {
    await browser.close();
    srv.close();
  }
  const fail = results.filter((r) => !r.ok).length;
  console.log('\nAG-GH-LIVE-001 SYNTHETIC: ' + (results.length - fail) + '/' + results.length +
              ' passed. Synthetic fixtures only — not evidence of the real GitHub transport.');
  process.exitCode = fail ? 1 : 0;
})();
