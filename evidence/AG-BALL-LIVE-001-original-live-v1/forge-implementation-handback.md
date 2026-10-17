**CA_IMPLEMENTED: AG-BALL-LIVE-001-FORGE-ORIGINAL-V2, candidate `AG-BALL-LIVE-001-c1`.** The local live slice is written, but nothing has been run: no Python start, no syntax check, no browser test. All tests are NOT_RUN because I only had Read and Edit.

Baseline is `d111b062…` as stated in the handoff; I didn't check it myself. I changed only the five allowed paths. Code author: Forge. Test executor: none yet. Publisher: none. Reviewer: not assigned.

## What changed
**`feld/index.html`** (Original F47). All changes take effect only with `?ball_live=1`, except one unused label:
- **Version:** `BALL_LIVE_FASSUNG='AG-BALL-LIVE-001-c1'`, shown in the version line, as `body[data-ball-live]` and in the live panel.
- **New kind `progress`** (added only in this mode). It produces no flight, finishes no task and puts nothing on the table; it only adds a line to the "Was geschieht" list.
- **Startup:** switches to the existing live mode (the demo no longer starts by itself) and loads `live.js?v=c1`. If loading fails, a message appears on the page.
- **Pilot loader:** the old `?mvp=1` route that loads `one-event.json` is switched off in this mode.
- **Service worker:** not registered in this mode. `FASSUNG` stays `47`.
- **Unused label:** one `GESTALT.fortschritt` entry. No kind uses it outside this mode, so the normal legend should look the same.

**`feld/live.js`**:
- **Transport:** the browser opens a same-origin SSE stream (`/events`), receives events and passes them to the Original's existing `__agLauf`, `__agEreignis` and `__agStrom` hooks. No reload, no eval.
- **Refusals:** it won't start, and says so on screen, if the page and script versions differ, the server reports a different version, a service worker controls the page, or the Original's hooks are missing.
- **Panel:** bottom left (`#agBallLive`, text-only), showing the version, connection state, `event ID · title`, provenance (`runtime_stream`, or "SYNTHETISCH" for test fixtures) and any gaps.
- **Dedupe:** by event ID. A cursor carries across reconnects, with backoff when the browser gives up reconnecting.
- **Stale handling:** "veraltet" after 15 s without a message. It never shows idle or done.
- **Test hooks:** `window.__agBallLive` exposes `trennen()` and `verbinden({cursor})`, and records receive and approximate paint times.

**`pilot/AG-BALL-LIVE-001/local_server.py`** (Python 3.8+ stdlib, `ThreadingHTTPServer`, binds 127.0.0.1, port 0 supported):
- **Startup:** first stdout line is JSON `READY` (or `ERROR`, exit code 2). It refuses to start if `index.html` or `live.js` lacks the version marker, or if `BALL_INGEST_TOKEN` is missing or shorter than 16 characters.
- **Responses:** files are served `no-store`; `/sw.js` always returns 404. Requests whose Host header isn't the local address are refused.
- **Endpoints:**
  - `/health` reports the number of connected viewers.
  - `/events` sends `hello`, `ag`, a heartbeat every 5 s, and `gap`.
  - `/ingest` takes a Bearer token, compared in constant time, and accepts exactly the eight listed fields, with kind `progress` only. Any other field is rejected, so raw tool input or thinking can't be forwarded.
  - `/debug/drop-streams` is test-only and token-protected.
- **Dedupe:** a repeated ID returns 200 `duplicate:true` and isn't sent to viewers again.
- **Event log:** in memory only, capped by `BALL_RING_MAX`. Reconnects use `Last-Event-ID` or `?cursor=`. Evicted events, a server restart or an invalid cursor all produce an explicit gap. No durability claim.

**`tests/AG-BALL-LIVE-001-local-live.cjs`** (Playwright, CommonJS): every event it sends is labelled `synthetic_test_fixture` and the report calls the run a synthetic component test. It starts the server, opens the Original, waits for the connection, then checks:
- the version, live mode, demo off, and no service worker;
- that a progress event shows its ID and title in the panel and in the Original's list, with a screenshot;
- that progress finishes no task and launches no flight;
- 13 rejection cases, using a later valid event to prove the rejected ones never arrive;
- dedupe on both the server and the browser side;
- that markup in a title is shown as text, not run;
- catch-up after a manual disconnect, automatic reconnect after a server drop, and a gap shown when more events arrive than the log holds;
- no reload, and the token never reaches the page.

It uses only bounded waits, no fixed sleeps.

**`pilot/AG-BALL-LIVE-001/README.md`**: exact commands, endpoint contract, the real E1 procedure and the correlation steps.

## Commands
```sh
export BALL_INGEST_TOKEN="$(python3 -c 'import secrets; print(secrets.token_hex(24))')"
python3 pilot/AG-BALL-LIVE-001/local_server.py --port 0 [--log-file /tmp/ball-live.log]
node tests/AG-BALL-LIVE-001-local-live.cjs   # env: PYTHON, BALL_OUT_DIR, BALL_WAIT_MS
```

## Security finding in the Original
The Original inserts external text as raw HTML in several places: the event list (`stromZeile`), the in-field labels (`melden`) and the run header (`kopfSetzen`).
- **On this route:** `live.js` escapes titles before passing them in, `run_id` is limited to safe characters, and model names aren't forwarded.
- **Still open:** any other live route into these hooks (such as `?mvp=1`) is still exposed to injected markup. That needs a separate fix.

## Real E1 path (for Atlas)
1. Start a fresh server, with no test events in it, and open the page.
2. Wait for "Transport: verbunden" in the panel, or `/health` showing at least one viewer.
3. Start the worker. On the first tool-use start in its stream, the host POSTs `{id:"E1-<tool_use_id>", kind:"progress", actor:"forge", title:"Tool-Start: <name>", source_evidence:"runtime_stream", source_tool_id:<id>}` while the process is still running.
4. Check the process is alive, take the screenshot, check again, then let it exit.
5. Correlate by event ID and tool ID across the host log, the server `INGEST` log line, `__agBallLive.last` and the screenshot. The page doesn't change between fixture and real events; only the provenance label does.

## Residual risks and blockers
1. **WebGL in headless Chromium.** The Original stops before defining its hooks if WebGL is missing. The test uses software-rendering flags and fails with a clear message if WebGL is unavailable. Locally, the browser download is still broken, so the test has to run where Chromium is installed, such as GitHub Actions.
2. **Stream format.** I haven't seen the actual E1 stream lines; the field names in the README are assumed and need checking against the real E1 output.
3. **Server blocking.** If the host doesn't keep reading the server's stdout, the server can block. The README says so; `--log-file` avoids it.
4. **Timing.** The CLI's internal emit time and exit timing can't be observed; only the time the host reads each line is known. Browser times are linked by ID, not by comparing clocks.
5. **Leftover service worker.** If a service worker from an earlier visit already controls the same origin, the page refuses with a message rather than self-healing. With port 0 a fresh origin is likely.
6. **Small layout differences.** The legend in ball_live mode lists `progress`. The panel at the bottom left can cover part of the field.

**Next owner: Atlas.** First get an authorized test executor to run, in order:
1. `python3 -m py_compile pilot/AG-BALL-LIVE-001/local_server.py`
2. `node --check feld/live.js tests/AG-BALL-LIVE-001-local-live.cjs`
3. The Playwright test in an environment with Chromium installed.

Only after that, set up the separate paid real-source run.