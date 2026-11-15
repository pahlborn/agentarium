# AG-RELAY-MULTIREPO-001 · bounded project packet contract v1

Candidate only. Actual author: separately identified Codex development representative
`/root/codex_multirepo_bootstrap`, task03. This is not Forge authorship, merge,
activation, independent acceptance or permission to start INT-01.

## Technical decision and trust boundary

Extend the existing v2 driver with an explicit `agentarium.relay-activation.v3`
branch and `agentarium.project-packet.v1` contract. Old activation v2 and handoff
v0 retain their exact single-handback rights and tests. No role profile is changed.
The unmerged project-prefix work `27f6f840412f80e6308e09380cd0b5b9cedbb1eb`
and historical host-materialized read-only return `f2e9e65` were inspected.
Their concepts are used only in the explicit v3 branch; legacy execution is not
silently switched to an unmerged generic registry implementation.

Host-owned source policy initially permits only:

| Repository | Registered project / source alias | Readable source |
|---|---|---|
| pahlborn/agentarium | agentarium / AG | README.md |
| pahlborn/bis-school-app_src | big-quest / BQ, registered delivery repo pahlborn/bis-school-app | package.json |

Each activation additionally binds full source commit, Git blob and SHA256,
exact readable/edit/new paths, synthetic overlay with hashes, role/mode,
logical identity, model/turn/budget/time limits and artifact publication authority.
Changing this host source policy needs a separately reviewed allowlist change;
target README/AGENTS or a model response cannot authorize one. This initial
policy does not provide INT-01's full source set or authorize its execution.

Preparation resolves the exact public Git commit, traverses tree metadata and
retrieves only named regular blobs over fixed GitHub API routes with redirects
rejected. Wrong/missing commit, blob, digest, mode, path or registry alias fails
before model execution. Synthetic and new slots must not exist in the actual
source tree; this is checked using metadata only, without reading other contents.
No whole Big-Quest checkout or original account/school data is needed.

Trusted governance and profile live in `workspace/trusted/`; project data lives
in `workspace/target/`. The model sees neither mutable activation/control nor
GitHub credentials. Preparation and execution use the same immutable artifact.
The complete snapshot rejects links, nonregular types, missing/extra paths and
file/directory substitutions. Every directory is0555, immutable files0444;
only exact precreated implementation slots are0644. Empty new slots are logical
new files against the target commit, not existing repository files. No writable
parent directory, delete or rename permission exists. Exact Claude Read/Edit/Write
permissions match those slots; Bash/Web/Agent/MCP and other execution tools stay
absent. A real CLI proof is still needed to establish that Write works on a
precreated slot without parent-directory write permission. Do not widen the parent
if it fails.

Analysis mode, Archibald and Cadence have only Read, zero writable workspace files.
The trusted host materializes final response text in the result after verifying
zero unauthorized filesystem changes. Forge implementation has Edit for exact
edit/creation slots and Write only for exact new slots. Existing source edits
require inclusion in the pinned read set; proof edits may use a separately
labelled, hash-bound synthetic overlay. No shell/test command is accepted from
request text or model output.

## Identity, replay and reporting

Technical activation IDs retain the strict AG prefix. In v3 the activation's
`contract.identity` binds logical project/run/task/parent IDs and subject role;
the request must repeat it exactly. Product work uses BQ IDs under big-quest.
Only `AG-RELAY-MULTIREPO-001-*` synthetic proof work may report agentarium while
reading the BQ source. Runtime observations retain the current schema, with a
unique hash of activation/run/attempt/identity; no new consumer fields are added.
V3 journal delivery is explicitly archive. Source commit, activation commit,
workflow run/attempt, packet binding and logical identity are distinct.

The prepare host has Actions-read permission to verify that the current workflow
is the sole run for this activation commit, before any worker start. Attempts>1
and duplicate prior dispatch/terminal records for the same task/source are rejected;
missing/incomplete platform history fails closed. A failed task needs a newly
controlled source/activation, not an automatic retry. The run worker receives
no GitHub token. Existing host observations retain safely observed session,
usage and cost on a later safety failure. Missing result timing is unknown,
not zero. Neutral failure codes distinguish timeout, turn/budget limit, absent
handback, output/session and packet-boundary failures, without printing raw text.

## Result and separate fixed executor

Success artifact contains exactly metadata.json, handback.md, changes.json and
tool-observations.json. The latter records only host-observed CLI tool names,
approved paths and observed tool-response success/error/unknown, never source or
argument/result contents; calls alone are not a claim of successful tool effects.
Raw model stdout/stderr are scanned and removed before artifact upload. Journal
publication emits bounded host metadata/links only, no model text, target source
or code. The immutable activation must expressly authorize artifacts for the exact
paths before the run; a secret scan alone is not publication authority. No push,
PR, merge, deploy or product activation follows from any result.

changes.json binds packet hash, repository, target commit, declared synthetic
overlay, operation per path, before and after SHA256, and base64 after-bytes.
The host derives it from actual workspace bytes, checks the complete inventory
and modes, and verifies every change against the contract. Deletions/renames and
unlisted additions are unsupported. Restoration copies the exact verified source
subset plus the explicitly declared overlay and applies only validated edit/new
bytes. It is a restorable subset+delta, not a claim of a full project checkout.

The separate `test-result` job downloads the untouched prepared artifact and actual
result, then executes a fixed Python child with environment only PATH/LANG. No
Anthropic/GitHub credentials, inherited Python settings, or model-provided command
reach this child. `synthetic-doc-v1` reconstructs into a fresh temporary directory
and checks that both real operations occurred and each synthetic document includes
the name@version parsed from the bound source package.json. Other/legacy profiles
return NOT_RUN; worker claims never become test PASS. The test report contains
binding, exact result digest and restored file inventory, not source contents.

## Reproducible bounded example and host requirements

Files in this candidate:
- `handoffs/AG-RELAY-MULTIREPO-001-proof-request-v1.json`
- `handoffs/AG-RELAY-MULTIREPO-001-proof-activation-template-v1.json`

The activation template contains an all-zero source_commit and is deliberately
NOT an executable authorization. After the source candidate/request commit is
reviewed, Atlas binds source_commit to its exact40-character commit and adds ONLY
`handoffs/activate/AG-RELAY-PUBLIC-SEC-001.json` in a separate activation commit
on an authorized `agent/ag-relay-task-*` branch. Proof technical/logical task is
`AG-RELAY-MULTIREPO-001-05` (Sentinel separately owns task04). `prepare` checks that exact sole
addition against HEAD's parent. Before that push, inspect all workflow triggers.
No Main merge or general activation is permitted. Model limits for this one
proof: max8turns, max1USD, max180seconds. Estimated consumption is distinct from
those emergency caps; total task15USD authority is separate.

Source proof input: package.json@7995d6968e3895b88f8ed2c3b0476683e5720c1a,
Git blob fc40de702be7b75c3d07655f8ea8f08a013d9783,
SHA256 4c9fdfbb001276844836447cd9aa3134290354d56d966c5cc54e58cd76e35934.
It is read-only. Exact editable synthetic overlay:
`relay-proof/existing.md`. Exact logical new slot: `relay-proof/new.md`.
No product source file is modified. This proof belongs to agentarium /
AG-RELAY-MULTIREPO-001, not BQ-EVAL-01 or INT-01.

Host needs public read-only GitHub API access, immutable Agentarium source,
existing Anthropic binding only in the model job, and bounded filesystem writes
to prepare/result/test directories. Worker needs none of the GitHub bindings.
The existing separate publishers retain only their named Issue/Actions rights.

## Durable restoration after Actions retention expires

Persist the exact reviewed source commit and safe immutable prepared+result ZIPs
before their configured retention ends (prepared2days, results30days), with ZIP
SHA256 and file inventories. Prepared contains only this allowlisted package.json,
synthetic slots, trusted controls, request and host Python modules; no raw stream,
original account/school data or key. Persisting only a run URL is insufficient.
The exact downloaded original artifact digest authenticates the payload; inner
hashes are integrity bindings, not signatures against a malicious replacement host.

Extract the trusted prepared ZIP into relay-prepared/ and the result ZIP into
relay-result/ in a fresh directory. Verify external ZIP hashes before extraction;
use a safe ZIP extractor rejecting traversal/links/duplicate members. Then, with
no credentials in the environment, run this host-defined restoration:

```sh
PYTHONPATH=relay-prepared python3 - <<'PY'
import json
from pathlib import Path
import relay_driver as driver
import project_packet as packet
context = packet.verify_prepared(driver)
metadata = json.loads((driver.RESULT / 'metadata.json').read_bytes())
packet.validate_result(metadata, context, driver.RESULT, driver)
changes = json.loads((driver.RESULT / 'changes.json').read_bytes())
inventory = packet.restore(changes, context, driver, Path('restored-proof'))
print(json.dumps(inventory, sort_keys=True))
PY
python3 relay-prepared/relay_driver.py test-result
```

The restored target subset includes the unchanged source package.json, declared
synthetic existing document and actual new document. Compare the returned digest
inventory against the independent test report. Passing this infrastructure proof
is no release, production authorization or INT-01 source/access approval.
