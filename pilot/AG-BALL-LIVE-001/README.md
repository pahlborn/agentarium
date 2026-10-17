# AG-BALL-LIVE-001 — local live slice for the ORIGINAL field (candidate `AG-BALL-LIVE-001-c1`)

LOCAL EXPERIMENT ONLY. No hosting, no deployment, no durability. The event log
is an in-memory ring that lives only as long as the server process does.

## What it is

- `feld/index.html` (Original F47 + flag-gated bootstrap): `?ball_live=1` switches
  to live mode (no demo autostart), does not register the service worker, adds
  the kind `progress` (no flight, never ends a task, never puts anything on the
  table), and loads `feld/live.js`. Without the flag the Original behaves as before.
- `feld/live.js`: same-origin SSE client that feeds `__agLauf`, `__agEreignis` and
  `__agStrom`. A visible panel at the bottom left (`#agBallLive`, textContent only)
  shows the candidate version, transport state, `event id · title`, provenance,
  and gaps. `window.__agBallLive` is a debug probe for tests only.
- `local_server.py`: Python stdlib `ThreadingHTTPServer` on `127.0.0.1`.

## Launch (exact)

```sh
cd <repo root>
export BALL_INGEST_TOKEN="$(python3 -c 'import secrets; print(secrets.token_hex(24))')"
python3 pilot/AG-BALL-LIVE-001/local_server.py --port 0 [--log-file /tmp/ball-live.log]
```

The first stdout line is JSON, e.g.
`{"event":"READY","version":"AG-BALL-LIVE-001-c1","base":"http://127.0.0.1:PORT","url":"http://127.0.0.1:PORT/index.html?ball_live=1","port":PORT,"pid":…,"instance":…,"monotonic_ns":"…"}`
or `{"event":"ERROR",…}` with exit code 2. If index.html or live.js does not carry
the candidate marker, the server refuses to start (no mixed versions).
Later lines (INGEST, INGEST_REJECTED, SSE_OPEN, SSE_CLOSE) go to stdout unless
`--log-file` is set. **The host must keep draining stdout or use `--log-file`.**
A full pipe blocks the server.

Env: `BALL_INGEST_TOKEN` (required, ≥16 chars, never sent to the browser),
`BALL_RING_MAX` (default 1000).

## Endpoints

| Path | Purpose |
|---|---|
| `GET /index.html?ball_live=1`, `/live.js`, icons | pinned feld files, `Cache-Control: no-store` |
| `GET /sw.js` | always 404 (the service worker would intercept the stream and old assets) |
| `GET /health` | `{ok, version, instance, seq, oldest_seq, ring_max, clients, durable:false}` |
| `GET /events` | SSE. Events: `hello` (id = current seq), `ag` (id = seq), `heartbeat` every 5 s, `gap`. Cursor via `Last-Event-ID` or `?cursor=` |
| `POST /ingest` | `Authorization: Bearer $BALL_INGEST_TOKEN`, `Content-Type: application/json`. 201 new, 200 `duplicate:true` (no rebroadcast), 400 invalid, 401 token, 415 type |
| `POST /debug/drop-streams` | test-only, token-protected. Closes all SSE streams |

The ingest body takes exactly these fields. Unknown fields are rejected, so raw tool
input, thinking and text cannot ride along:
`{id, run_id, actor, kind, title, recipient?, source_evidence, source_tool_id?}`.
`id`/`run_id` must match `[A-Za-z0-9._:-]{1,80}`. `actor`/`recipient` must be a known agent.
`kind` must be `progress`. `title` must be 1–160 chars with no control or format characters.
`source_evidence` must be `runtime_stream` or `synthetic_test_fixture`.

Reconnect: the browser auto-reconnects with `Last-Event-ID`. A first connection
starts at "now" (no replay). Missing events still in the ring are replayed. Evicted
ones produce an explicit `gap` shown in the panel. A server restart also shows
as a gap. Duplicates are dropped by id on the server and in the browser.
Losing the connection shows "getrennt"/"veraltet", never idle or done.

## Synthetic component test (NOT real-source evidence)

```sh
npx playwright install chromium   # if no browser is installed
node tests/AG-BALL-LIVE-001-local-live.cjs
# env: PYTHON, BALL_OUT_DIR (default artifacts/AG-BALL-LIVE-001), BALL_WAIT_MS
```

Writes `synthetic-result.json` and screenshots. Every event in it is labelled
`synthetic_test_fixture`, and the panel shows it as SYNTHETISCH.

## Real E1-type verification (Atlas arranges; paid run)

1. Start a **fresh** server and keep its READY line. Never ingest synthetic events into it.
2. Open `READY.url` in the browser and leave it open. Proceed only when the panel shows
   `Transport: verbunden` (or `/health` shows `clients >= 1`).
3. Start the real Claude worker with streaming JSON output (as in E1, e.g.
   `--output-format stream-json --verbose --include-partial-messages`). The host
   reads stdout line by line. On the first `stream_event` with
   `content_block_start` whose `content_block.type == "tool_use"`, it records host
   `time.monotonic_ns()` plus the tool id and name, then **while the process is still
   running** POSTs:

```json
{"id":"E1-<tool_use_id>","run_id":"<run id>","actor":"forge","kind":"progress",
 "title":"Tool-Start: <tool name>","recipient":null,
 "source_evidence":"runtime_stream","source_tool_id":"<tool_use_id>"}
```

```sh
curl -sS -X POST "$BASE/ingest" -H "Authorization: Bearer $BALL_INGEST_TOKEN" \
     -H 'Content-Type: application/json' --data @event.json
```

   Forward only the tool id and the tool name. Never forward the tool input,
   thinking or text.
4. Wait until `__agBallLive.accepted` contains the id and the panel shows it. Check
   `proc.poll() is None` (or equivalent), take the screenshot, check again that the
   process is alive, then let the worker exit and record the exit time.
5. Correlate by event id and `source_tool_id` across four records:
   - the host log line (stream line read time),
   - the server `INGEST` line (`monotonic_ns`, `seq`),
   - `__agBallLive.last` (`server_received_monotonic_ns` echoed, browser
     received/painted wall times),
   - the screenshot time and the CLI exit time.

   Host and server share the same host monotonic clock. Browser times are
   wall/performance clocks, so link them by id and the echoed server ns, not by
   comparing clocks.

Known uncertainty: the CLI's internal emission time is not observable. The host
only sees when it reads the line. CLI termination timing relative to its last
internal work also stays unknown.

## Not done here (deferred)

Hosted V3, reconciler, 180-day archive, hosted privacy choices, durable log,
CSP header (the Original uses inline scripts).
