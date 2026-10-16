# AG-PILOT-001 – local transport probe

**LOCAL TEST HARNESS. Not a production service, not a real pilot, NOT PILOT READY.**
Volatile, loopback only (`127.0.0.1`, not configurable), no auth, no TLS, no
persistence, GET only (`supported_actions: []`). All output is labelled
`SYNTHETIC_LOCAL_TEST_PROBE`; it never asserts observed real work.
State is computed only by `tests/AG-VISUAL-005-referenz-reducer.py`, imported by path.

## Start

    python3 pilot/AG-PILOT-001/local_transport.py --input /abs/path/probe.json --port 0

Port `0` picks a free port; the actual address is printed on the first line.

## Input

Canonical input is `{"snapshot": fixture.daten.schnappschuss, "events": fixture.daten.tail_umschlaege}`
from `fixtures/AG-VISUAL-005-beispiele-v2-1/11-snapshot-plus-tail.json`. Build it:

    python3 - <<'EOF'
    import json
    f = json.load(open('fixtures/AG-VISUAL-005-beispiele-v2-1/11-snapshot-plus-tail.json'))
    d = f['daten']
    json.dump({'snapshot': d['schnappschuss'], 'events': d['tail_umschlaege']},
              open('/abs/path/probe.json', 'w'), ensure_ascii=False)
    EOF

Initial state is `snapshot.lauf.zustand_am_cursor`; it and `snapshot.cursor` must agree.
Each envelope's `payload` is copied for the reducer with the envelope `stream_sequence`
added; the raw envelope is kept unchanged for SSE and `/archive`. The reducer is unchanged.

Costs: output is always the canonical `kosten` object (`sichtbar: true`,
`erfassung: "unvollstaendig"`, `daten: "synthetisch"`, `status_text: "Kosten nicht vollständig ermittelbar."`).
Supplied amounts or totals in `snapshot.kosten` are never passed through; `snapshot.kosten` must only be an object.

Rules: the snapshot is the pinned baseline; events need contiguous integer
`stream_sequence` from `snapshot.cursor + 1`; envelope `stream`/`stream_id` must equal the
snapshot's, and payload `project_id`/`run_id` must equal `snapshot.lauf`. The file is
append-only: a malformed, gapped, duplicated, wrong-identity or rewritten update is rejected,
the prior valid input is retained, and the error appears in `/health` (`input_error`).
A semantically invalid event (e.g. Done without K3 proof) still advances the cursor, but the
reducer keeps the old task state and reports its diagnostic. The file is never written by the server.

## Endpoints (GET)

- `/health` – `mode: local_probe`, `supported_actions: []`, input error if any.
- `/snapshot` – current reducer state at the latest accepted cursor, with costs and diagnostics.
- `/events` – SSE. No cursor: current snapshot first (`event: snapshot`), then new events as
  `id:<sequence>`, `event: agentarium`, `data:<original envelope>`. `Last-Event-ID` or
  `?cursor=N` resumes after N. A cursor in the future or below the baseline gets HTTP 409
  `resync_required`. Heartbeat `: heartbeat` every 5 s (no id). A rejected input update
  sends `event: resync` and closes the stream.
- `/state?cursor=N` – reducer state at cursor N (baseline ≤ N ≤ latest, else 409), plus
  `diagnostics` (reducer rejections, kept apart from accepted state).
- `/archive` – `LOCAL_TEST_BUNDLE`: unmodified input snapshot and events. Not the final
  GitHub archive packaging.

## Append an event (test producer)

Edit the file so `events` gets one more envelope with the next `stream_sequence`, e.g.:

    python3 - <<'EOF'
    import json; p='/abs/path/probe.json'; d=json.load(open(p))
    e = json.loads(json.dumps(d['events'][-1]))   # copy a canonical envelope, then adapt
    e['stream_sequence'] += 1; e['payload']['id'] = 'S7'   # adapt payload fields as needed
    d['events'].append(e)
    json.dump(d,open(p,'w'),ensure_ascii=False)
    EOF

## Activity monitor (partial connection, local only)

Optional, additive; the transport/reducer behaviour above is unchanged. Not complete
runtime capture and not an end-to-end guarantee. `/monitor` and `/activity` are GET only.

Start (both options together; `--activity-fresh-ms` is required with `--activity-input`):

    python3 pilot/AG-PILOT-001/local_transport.py --input /abs/path/probe.json --port 8765 \
      --activity-input /abs/path/activity.json --activity-fresh-ms 90000

Open `http://127.0.0.1:8765/monitor` (live) or `/monitor?at=2026-10-16T10:00:00Z` (archive
replay, never auto-advances). `GET /activity` returns the JSON; `?at=<ISO with zone>` selects
ARCHIVE (observations after that instant are ignored, no wall-clock ageing). Without
`--activity-input` all agents are `unknown`.

Input schema `agentarium.activity-observations.v1`:

    {"schema":"agentarium.activity-observations.v1","data_kind":"SYNTHETIC",
     "observations":[{"id":"o1","agent":"Forge","session_id":"s1","task_id":"t1",
       "observed_at":"2026-10-16T10:00:00Z","evidence_ref":"relay-log#1",
       "signal":"stream_sample","event_counts":{"stream_event":3},
       "last_event_seconds":10,"elapsed_seconds":12}]}

`data_kind` is `OBSERVED` or `SYNTHETIC`. Signals: `host_received`, `stream_sample`
(`event_counts`, `last_event_seconds`, `elapsed_seconds`), `source_waiting`/`source_blocked`
(nonempty `reason`), `source_resumed`, `execution_stopped` (`outcome` success|failed|aborted),
`transport_heartbeat`. `observed_at` is collector observation time (ISO-8601 with zone), not
guaranteed event time. Nonempty `evidence_ref` is required for any state claim.
`--activity-fresh-ms` is a test configuration, not a realtime/SLA guarantee.

Example marked **TEST (synthetic)**: two samples for Forge/s1/t1, counter `stream_event` 3 then 5, both within
the fresh window => `working_observed`.

Acceptance cases (to be verified independently; Forge ran none):
1. Genuine delta: two samples, same agent/session/task, increased `stream_event`/`assistant`/`user` counter, recent event => working_observed.
2. Heartbeat/host receipt or unchanged samples => no work (stays unknown).
3. Stale evidence (sample event age + observation age > fresh ms) => unknown, not waiting.
4. Waiting/blocked only from explicit source signal with reason; silence => unknown.
5. `execution_stopped` success => stopped, task is never set done; terminal for that session/task.

V2 corrections (Forge ran no tests; independent QA required):

- Roster (`activity.ROSTER`, canonical lowercase): atlas, nova, scout, archibald, forge, argus,
  sentinel, cadence. Known names are matched case-insensitively and normalized to the canonical id
  (no duplicate Forge/forge rows). Unknown names get their own row and never replace a default row.
- Work evidence: only a positive delta of `stream_event`, `assistant` or `user` counters proves
  `working_observed`. `system`, `progress_timer`, `telemetry_failure`, `invalid_line` and other
  counters are ignored, and `last_event_seconds` changing alone is not proof (the wrapper also
  updates it for metadata). First sample is a baseline; unchanged samples, heartbeat and host
  receipt never renew work. A positive delta still needs a fresh source event. No inference of
  thinking or continuous work.
- Explicit waiting/blocked is authoritative until explicit `source_resumed` or terminal. If the hold
  is stale the row is `unknown`; work accumulated while held is never used. `source_resumed` clears
  the hold AND old work evidence: resume alone is not working, a later positive work delta is needed.
  Terminal still absorbs later same-session progress.
- Every row has `remaining_valid_ms`: 0 for unknown, null for stopped, otherwise the conservative
  remaining freshness computed with the same `now` and event age as the state. It is a local display
  validity only: no SLA, no capture guarantee, never renewed by transport.
- Browser (LIVE): each response's `remaining_valid_ms` is tracked with `performance.now()`, reduced by
  the request duration. A local timer turns expired nonterminal cards into `unknown` (dashed, no pulse),
  even with Auto off or server unreachable. ARCHIVE is never aged by the client clock. Auto defaults
  ON (2 s) in LIVE; ARCHIVE has it disabled. Repeating the same work evidence after an expiry or failed
  request does not pulse again; only a changed evidence stamp does. Transport errors are shown apart
  from source errors. Terminal `stopped` stays conclusive; no end is fabricated from a disconnect.
- Browser binary NOT tested. Main Gewebe/Partitur and actual runtime hooks are still absent. The
  existing 60 s sample cadence is not instantaneous. This is a local component only, no product success claim.

Honest limits: the existing relay cadence is 60 s, so short freshness values will flap; ChatGPT
activity hooks are absent; no automatic capture, no end-to-end guarantee. No LLM calls for
telemetry, no per-token/frame logs. Costs stay "Kosten nicht vollständig ermittelbar." with no numbers.

## Limits

No real producer hooks, no field adapter, no hosting, no LLM calls, no writes or commands.
Forge ran no tests; independent runtime QA (Sentinel) is required.
