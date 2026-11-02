# AG-LAUFZEIT-001 — Runtime producer contract v1

Task AG-LAUFZEIT-001-06 / parent and logical run AG-LAUFZEIT-001; project
agentarium. Clean implementation input: commit
4736262446fff9e403aef6b61822b4b619bd517d, source baseline
d74dc0b525b4c861ee03259c96fe377df2b61feb. Architecture: actual Forge V2
handback. Patch author: separate Codex development representative
`/root/springer_laufzeit`, not Forge. Author checks do not approve this work.
No monitor files or native Cloud exporters are implemented here.

## Explicit task binding

The existing `agentarium.handoff.v0` request may add this exact `runtime`
object (shown as task identity, not a journal event):

```json
{
  "schema": "agentarium.relay-runtime-identity.v1",
  "project_id": "agentarium",
  "run_id": "AG-LAUFZEIT-001",
  "task_id": "AG-LAUFZEIT-001-06",
  "parent_id": "AG-LAUFZEIT-001",
  "subject_role": "forge"
}
```

All six fields are required, with no extra fields. Logical IDs must match
`AG-[A-Z0-9-]{4,80}`. `task_id` must equal the activation task; parent is
nonempty. Role mapping is `coding-agent → forge`, `spec-agent → archibald`,
`process-agent → cadence`. Existing activation schema, Add-only activation
commit and readable/writeable path restrictions are unchanged. Runtime identity
is validated before dispatch. Absent identity means explicitly unsupported
legacy runtime reporting; the paid worker/result path still operates. Invalid
identity blocks dispatch. Logical run is never filled from the Actions run ID.

The host derives `execution_attempt` as SHA256 of the canonical JSON array
`[repository, activation_commit, github_run_id, github_run_attempt, runtime]`.
Together these distinguish logical project/run/task/parent, subject role,
Actions run/attempt, host execution attempt and CLI session UUID. A rerun needs
its own matching prepared artifact; an old bundle cannot silently bind a new
attempt.

For validated runtime requests, the existing V1 receipt/result communication
payloads also use that logical project/run/task identity. Their existing `id`
field remains unique per task, actual Actions run, attempt and phase; the outer
technical relay marker/run URL retain the Actions run for terminal dedup.
No V1 fields or lifecycle claims are added. Requests without runtime identity
retain the exact legacy payload/ID fallback and activation-based role mapping.

## Observations, not model self-reports

The existing pinned CLI gets `--include-partial-messages`. First nonempty
`text_delta`, `thinking_delta` or `input_json_delta` under a main-session
`stream_event/content_block_delta` is the earliest accepted activity signal.
Fallback: a non-error main-session `assistant` message with assistant role,
`msg_…` message ID and a nonempty text/thinking/tool-use block. The session must
be a UUID, stable after its first accepted event. Init, Popen, receipt, empty
messages and message_start do not prove assigned work and never emit start.

`start_observed_at` is host read time, never exact computation beginning:
`actual_start_unknown` is always true. Work/cost before a visible response stay
unknown. CLI result costs are reported estimates, not independently verified
billing. A repeated complete block with the same message ID does not double
count observed usage. Allowed numeric usage keys are input_tokens,
output_tokens, cache_read_input_tokens, cache_creation_input_tokens. Result
usage replaces partial snapshots. Other fields and model text are discarded.
Missing measurements are null, never fabricated zeros.

Observation schema is `agentarium.runtime-observation.v1`; its exact allowlist
is `FIELDS` in `relay/claude_runtime_events.py`. `phase` is start/end. Start
means observed activity. End records observation termination with signal
process_exit/supervisor_error/timeout, independently of task acceptance. Its
`worker_state` is stopped/not_launched/unknown. `outcome` distinguishes
process_exited, unknown_no_activity_observed, error_before_activity, error_after_activity,
safety_blocked, observation_lost. The original exit/cleanup observation time
is retained before later safety processing. Unknown child stop requires
observation_lost. Hard host loss yields no invented terminal. Safety rejection
removes legacy raw/result payload while keeping independently sanitized runtime
start/session/usage/cost. Safety state is pending/passed/blocked/unknown; a clean
observation does not grant permission to publish a blocked handback.

## Bounded supervisor and artifact route

Run-job commands, executed only by the host:

```text
python3 relay-prepared/relay_driver.py launch
python3 relay-prepared/relay_driver.py await-start
[existing pinned upload-artifact action: start.json]
python3 relay-prepared/relay_driver.py await-end
[existing pinned upload-artifact actions: end.json and result directory]
```

`launch` starts a detached `supervise` process outside the editable workspace,
with stdin/stdout/stderr detached from the launch step. `RUNNER_TRACKING_ID`
stays on supervisor and CLI child; neither receives a GitHub token. The child
retains the original Read/Edit and handback-only permission boundary. The
supervisor drains both streams without blocking, caps total stream at 64 MiB,
line at 2 MiB and child duration at 23 minutes. On error/timeout/normal exit it
signals only its owned child process group, applies TERM then KILL as needed,
and reaps the direct child. If cleanup throws, worker_state is explicitly
unknown and the surviving supervisor preserves an observation_lost end record;
this does not claim that the child terminated. Same-UID execution is not security isolation; a
compromised runtime could modify observations or suppress uploads. This patch
claims platform provenance and host observation, not protection against a
compromised same-UID host.

Coordination deadline is 25 minutes; run-job limit remains 30 minutes. No
tracking-cookie removal or escape from job cleanup. SIGTERM/INT routes through
cleanup; SIGKILL/runner loss leaves a documented observation gap. Actual Linux
process/step behavior requires CI; local container Popen/proc behavior is not
accepted evidence. Await steps verify every immutable prepared file, permitting
only the preexisting authorized handback to change. Bytecode writing is disabled
before importing the bundled host helper so the sealed manifest stays sealed.

Prepared and result artifact names now end with `<github_run_id>-<attempt>`.
Runtime artifacts are `relay-runtime-start-<github_run_id>-<attempt>` and
`relay-runtime-end-<github_run_id>-<attempt>`, each containing exactly its one
JSON file. Runtime files are separate from force_blocked/result cleanup. The
original pinned upload/download actions, permissions and secrets remain in use.

## Separate journal channel and parallel publisher

`publish-runtime` needs only prepare and runs concurrently with the worker. It
has actions:read and issues:write, no new scopes/services/secrets. It reads at
15-second intervals for at most 34 minutes (job cap 40). `publish` remains the
sole owner of the legacy paid-result publication and fallback. The runtime
publisher never downloads/replaces/publishes the paid result, so its failure
cannot discard it.

Each runtime comment on Issue 2 contains exactly ONE runtime record, begins
with `<!-- AGENTARIUM_RUNTIME_V1 -->`, immediately followed by one JSON fence,
and has no other text. New journal schema: `agentarium.runtime-record.v2`.
Top-level fields: schema, id, kind, reporter, publisher, received_at, delivery,
source_evidence, observation, evidence. Actor/reporter is `relay-host`, publisher github-actions,
subject role is separate. `source_evidence` is the fixed host-generated value
`runtime_stream`; neither the request nor the model chooses it. History
validation rejects a missing or different value. Existing published
`agentarium.runtime-record.v1` records retain their original contents and are
skipped by the v2 dedup reader; records from other execution attempts are also
skipped without blocking a matching current v2 record. The existing
`AGENTARIUM_RUNTIME_V1` marker remains the stable framing namespace; the JSON
schema explicitly versions the changed record fields. No historical rewrite
or migration is performed. Current V1 consumer ignores this marker; no unknown
fields or fake role-starts are inserted into V1. Both old and new markers in a
model handback trigger the existing withholding path. Final legacy comments
must contain no runtime marker.

The explicit host lifecycle field `kind` is derived and validated by
`lifecycle_kind`; consumers must use it rather than invent a phase heuristic:

| Verified observation | Runtime-record kind |
| --- | --- |
| Accepted start activity | started |
| End: stopped, process_exit, process_exited, safety passed | delivered |
| End: stopped/not_launched and error_before_activity, error_after_activity or safety_blocked | aborted |
| Unknown stop, observation_lost or otherwise unclassified end | observation_lost |

A missing end produces no terminal record and remains unknown. An error before
activity can be a known failed host attempt (`aborted`) while work and cost
before a response remain unknown. `delivered` means a normally ended technical
runtime, never task acceptance or a role self-report. `aborted` requires a
known stop or a known not-launched child; it cannot hide an unknown worker
stop. A journal record whose kind contradicts its nested observation is
rejected. These fields belong solely to the new namespace; the V1 schema is unchanged.

Journal ID is `<execution_attempt>:<phase>`. The nested observation retains
original time. received_at is publisher time. Evidence includes exact
repository, artifact ID/name/digest/created_at, job ID/URL, Actions attempt URL,
source-commit URL and activation-commit URL. Reader validates actual workflow
path, push event, repository, run/attempt/head SHA and source job; artifact
origin/run/head/name, SHA256 ZIP digest, 64 KiB archive limit, 16 KiB member
limit, exact ZIP entry/schema/types/enums and source-job/artifact time bounds.
Upper time bounds use the delivered timestamp resolution as a half-open
interval: a whole-second value includes that second's subseconds but excludes
the next second; fractional timestamps use their supplied 1–6 decimal digits.
No general observation-time tolerance is added.
It does not follow arbitrary artifact URLs. GitHub Authorization is removed
before an allowlisted HTTPS blob redirect; further redirects are rejected.
Suspect/invalid data is withheld, never echoed in errors.

Start/end share the exact execution attempt and start time. End is read first;
if already known from artifacts or bot journal, start delivery is archive.
A `live_observed` start additionally requires the actual source job still be
in_progress on a refreshed platform read; it describes observation at receipt,
not an eternal liveness assertion. Completed/missing source is archive. Late
starts cannot reactivate a known terminal. No receipt or missing end implies
worker inactivity, failure, task completion or acceptance.

Only GitHub Actions bot comments with the exact schema and binding deduplicate
runtime records. Histories/lists paginate or fail closed. There is one workflow
owner for these phases. An uncertain POST acknowledgement is reconciled from
bot history; that publisher never blindly resends a possibly committed record.
GitHub lacks a conditional insert/idempotency key here: exact delivery under
host loss is not promised; an unconfirmed record remains unknown. After source
completion the reader permits 60 seconds for final artifacts/receipts, then
reports the gap; it does not fabricate a terminal. Stored start/end records and
legacy history are untouched.

## Verification and remaining pilot

Free checks: Python compile, targeted unittest discovery and unchanged driver
self-test. Offline tests cover positive observations and numeric snapshots,
false start, errors before/after activity, safety rejection after activity,
missing end, unknown stop, role/attempt/source mismatches, malformed/suspicious
payload, wrong ZIP digest/forged attempt, late/duplicate records, blob token
stripping, both handback control-marker injections, immutable-file checks and
uncertain POST acknowledgement. Fixtures and mocks are synthetic, not CLI or
live evidence.

Required next proof: actual pinned 2.1.302 CLI on an unprivileged Actions Linux
runner, a small authorized clean role task with explicit runtime identity,
first start artifact downloaded and journal record received while the worker
is still running, then separately observed end/result of the same attempt.
Verify exact job/attempt/SHA/digests and the independent QA surface. Exercise
cleanup/timeout in CI without paid repeated runs where possible. Root-container
file permissions and local proc visibility do not prove runner behavior. Native
ChatGPT/Atlas/Lot hooks remain a separate blocked exporter. No all-role,
monitor, customer acceptance or product PASS follows from this patch.
