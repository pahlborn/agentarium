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

## Limits

No real producer hooks, no field adapter, no hosting, no LLM calls, no writes or commands.
Forge ran no tests; independent runtime QA (Sentinel) is required.
