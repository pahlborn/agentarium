# AG-PILOT-001 source capture (Claude CLI run_stream)

Status: implemented, **not tested by Forge** (TESTS_NOT_RUN_BY_FORGE).

## Opt-in
`run_stream(..., activity_recorder=None)`. Default: no capture, behavior, results,
exceptions and checkpoints unchanged. Capture only happens if a wrapper passes a recorder.

## Wrapper example
```python
from activity_capture import ActivityRecorder
rec = ActivityRecorder('/path/activity.json', agent='forge', task_id='TASK-ID',
                       evidence_ref='relay-run:TASK-ID', sample_interval=2.0, max_observations=2000)
result, evidence = run_stream(cmd, cwd=cwd, env=env, timeout=600, activity_recorder=rec)
```
The constructor raises `ValueError` on bad arguments (wrapper bug, before any worker starts).
Everything after that is guarded.

## Recorder calls (made by run_stream)
`on_start()` after successful Popen; `on_event(kind, relevant, session_id)` per parsed event
(session_id only passed for `system`/`result`); `on_tick()` each loop pass; `on_finish(outcome)`
exactly once in `finally`. Recorder exceptions are swallowed; run_stream counts them and, only
if non-zero, adds `activity_capture_failures` (int) to evidence. No exception text is kept.

## Identity rules
- session_id is taken only from a validated top-level `session_id` (hex/dash, <=80) of a
  provider `system` or `result` event. Never invented.
- Before it is known: no observations, only unbound process metadata in `capture`.
  If none ever appears: `coverage_gaps` contains `no_provider_session_established`.
- A later different id never replaces the first; it increments `session_conflicts` and is listed as a gap.
- Agent/task are fixed per recorder (agent lowercased, e.g. `forge`).

## Observations
- On session establishment: `stream_sample` baseline with current `assistant`/`user`/`stream_event`
  counts; `last_event_seconds` = last relevant event (0 if none yet), `elapsed_seconds` = monotonic
  seconds since `on_start`.
- Counted: `assistant`, `user`, and `stream_event` with `event.type == content_block_delta`.
  Not counted: ping, system, result, rate_limit, invalid lines.
- First relevant progress after baseline writes a sample immediately; later ones are coalesced to
  `sample_interval` (in-memory counts always update; `on_tick` flushes pending). A pending sample is
  flushed before the terminal one.
- Terminal: one `execution_stopped` for the established session. `success` = exit 0 with a result
  and `is_error` not true; `failed` = non-zero exit, no result, error result, unexpected exception;
  `aborted` = timeout or output limit. Success never means task done. Terminal is absorbing, idempotent.
- No `source_waiting`/`source_blocked` is ever inferred. Process running is not "working".
- `observed_at` = real UTC (ms, `Z`) at collection, clamped monotone; source clock is separate.

## Bounds, errors
- At most `max_observations`; the baseline is pinned, oldest middle samples are dropped, a slot is
  reserved for the terminal. `capture.truncated`/`observations_dropped`/`history_complete` and a gap
  entry report pruning.
- File is rewritten atomically (tmp + replace) only per emitted observation, not per token.
  Missing/unwritable path only increments `capture.failure_counters.write_failures`.
- Content (prompts, text, thinking, tool results, secrets) is never seen or stored.

## Consumer compatibility
Output `{schema:'agentarium.activity-observations.v1', data_kind:'OBSERVED', capture, observations}`
is read by `activity.load_observations` / `derive`. activity.py needs two samples to show
`working_observed`.

## Limits
`sample_interval` is local configuration, not an end-to-end latency guarantee or durable store.
There is **no automatic GitHub-to-browser live delivery** yet; the file is local to the worker host.
