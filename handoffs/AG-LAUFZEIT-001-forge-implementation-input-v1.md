# AG-LAUFZEIT-001 — Forge-Produzentenumsetzung V1
Task AG-LAUFZEIT-001-06, parent AG-LAUFZEIT-001, logical project/run agentarium/AG-LAUFZEIT-001. Base d74dc0b525b4c861ee03259c96fe377df2b61feb. Technical owner and code/patch author: actual Forge/coding-agent. Testexecutor/integrator/publisher: Atlas. Profile .claude/agents/coding-agent.md Blob1ebe72cd8de89f3aa0f9ca4272fb1e89ae3e187f.
Mandate https://github.com/pahlborn/agentarium/issues/115 . Peter explicitly authorizes this bounded Forge package and10USD across ALL attempts. Actual two architecture calls total0.289356USD; this attempt cap3USD/8Turns. No self-started subcalls, no unlimited retries.

## Critical proof now observed (not an assumption)
Your multi-step detached supervisor + existing finalized artifact channel worked in actual Actions. Source acf2e4551f1e5f52482826053b9394bdcd77f5c4, run41463804695 attempt1, three jobs successful.
Independent native Sentinel /root/sentinel_laufzeit_proof verified source, all joblogs, exact artifacts, digest and reader result: scoped PASS for synthetic infrastructure only.
Normal synthetic start14:38:16.947115Z; separate reader received14:38:20.129526Z while source job in_progress BEFORE and AFTER download; synthetic end14:40:16.947683Z. Worker survived step boundaries. Both fixture workers would have produced an end if left alive. Killed case actual processstop is checked afterSIGKILL (/proc gone orZ) before stopped proof, with no final work end fabricated. Artifactlist contains normal/start, normal/end, killed/start, killed/stopped and reader proof only.
This uses existing upload-artifact Pin ea165f8d65b6e75b540449e92b4886f43607fa02; reader needs actions:read, no new scopes/secrets/external host. There IS an automatically provided GitHub read token in the reader; don't claim token-free.
Source https://github.com/pahlborn/agentarium/tree/acf2e4551f1e5f52482826053b9394bdcd77f5c4
No real CLI/live/model/monitor outcome inferred from the synthetic result. Exact worker CLI semantics need the actual small pilot after code checks. Current local executor has unreliable /proc vs Popen.poll; no local processstop PASS claimed. Real Linux Actions is the required surface for that behavior.

## Implement now, keeping your architecture ownership
Prepare a complete bounded producer patch for real host-observed started/end via the proven existing artifact channel. No delayed-only workaround: start must be publishable before the worker ends.
Allowed patch targets:
- relay/claude_public_relay_v2.py
- relay/claude_runtime_events.py (new trusted host helper if useful)
- relay/test_runtime_events.py (targeted offline tests)
- .github/workflows/claude-public-relay-v2.yml
- handoffs/AG-LAUFZEIT-001-runtime-contract-v1.md (producer contract; consumer activation pending Lot)
Do not change monitor files, LOT.md, secrets, dependencies, other workflows or roleplatforms.

## Non-negotiable acceptance requirements
1. Keep worker tools/handback-only edit boundary, prepared-manifest integrity, role definitions, secret scans, forbidden-control-marker defense, trusted terminal dedup and Add-only activation semantics. No issues-write token in worker, no broad permissions or external service. SameUID plus clean environment is not new isolation. The host helper/observation files stay outside the editable model workspace; don't make model output a trusted host signal.
2. Host observes actual runtime activity, then actual end/error; choose the earliest valid signal available from the pinned CLI. Session init/Popen/host receipt are not assigned-work proof. observed start != exact computation beginning. Before first visible response work/cost remain UNKNOWN, not zero. Preserve safely observed start, session/usage/cost through later errors/Safety blocks; sanitize and don't leak stream/modeltext.
3. Correct mapping coding/spec/process roles, bind logical project/run/task/parent separately from GitHub workflow/run_attempt and session/unique execution attempt. No hardcoded forge for other roles, no workflow run as logical run. Require validated runtime identity for new producer events; old requests lacking it must remain explicit legacy/unsupported, never infer a fictional logical run.
4. New separate runtime-event envelope with true reporter HOST and subject ROLE, source_evidence runtime_stream only from verified host observation, original/received times, concrete authenticatable run/job/source/artifact reference. Do not pretend reporter is forge. Use a dedicated new runtime-record marker/schema documented in the contract, ignored by current V1 monitor until Lot's Part3; never emit unknown fields into old V1 or fake another role's started. No monitor change.
5. Concurrent bounded publisher starts afterprepare, not afterworker. Unique start/end artifact names include run attempt. Validate artifact origin/run/source/hash, size/schema/whitelists, strip Authorization on blob redirect, dedup event IDs after uncertain POST. Start and exactly one terminal share exact attempt. Never activate an older ended attempt as current work. If end is already known, archive original start safely without asserting live work. End/abort does not imply acceptance/PASS. Missing evidence/end stays unknown; EOF/exit only proves what actually observed. Keep old historical records untouched.
6. Supervisor survives jobsteps, owns bounded timeout, closes/cleans up its actual child, preserves trusted observation separately from force_blocked cleanup. Preserve runner process tracking; no deliberate escape from jobcleanup. A hard host loss must be documented as observation gap, not fabricated aborted/success.
7. Keep legacy publication and result artifacts usable; observer failures must not silently discard paid result. Final/parallel publisher interaction must have one owner per runtime phase. Durable sanitized runtime records go to Issue2, one record/comment. Raw fullstream stays private to existing artifact boundary; don't post it.
8. Tests: normal, error before observed activity, error after observed start, Safety rejection after activity, missing terminal/hostloss, duplicate/late events, other role/attempt mismatch, tampered/suspicious data, legacy packet; existing security/self-tests remain valid. Include a meaningful counter-check against false start or forged role/attempt. No live/worker/model PASS without actual execution; you have no shell.
9. Budget still5–8USD estimated for whole package under10USD ceiling; if route needs material new rights/infrastructure STOP with exact CA_QUESTION. Native ChatGPT/Atlas/Lot exporter remains separately BLOCKED; do not claim complete all-role solution.

## Output mechanics and stop
Only directly editable file remains handoffs/AG-LAUFZEIT-001-forge-implementation-handback-v1.md, precreated by host as "# Handback\n". Replace it with Edit.
Return CA_PATCH_READY: short technical choice/limits then ONE valid unified diff for the named files (including newfiles). Changes are authored by you but integrated/tested later by Atlas; do not claim source files were changed locally. If this cannot fit cleanly, return the smallest coherent producer patch plus exact remaining mandatory steps; no false full completion.
Do not copy the full old driver or its literal monitor-control marker into the handback: unchanged marker constants need no diff context. Do not include sample event blocks. Do not weaken/evade relay content guards. Never encode/obfuscate a forbidden payload to bypass safety.
Tests honestly NOT_RUN. List expected free testcommands and smallest real pilot. Stop after writing the file; no subsequent paid run/activation/push.

## Rule package in full (adopted Rulebook/Process1.4 @d74dc0b525b4c861ee03259c96fe377df2b61feb)
> Peter starts Lot exclusively; Lot builds only the monitor. Forge owns other assigned technical work, including the relay.
> A role profile is not a running agent; connectivity is checked on the actual channel.
> A role does not approve its own work.
> No report or count is stronger evidence than the behavior it measures.
> Tool and frontmatter policies enforce capabilities; this text defines duties.

### 3. Evidence and truthfulness
Never invent responses, participation, runs, permissions, tests, approvals, model/effort, costs or timestamps. Distinguish observed fact, reported claim, inference, proposal and unknown. Use current task-relevant primary records and exact versions. Paginate relevant histories before claiming absence; state the inspected scope. A historical successful run is not a current connection. An unavailable field is unknown, not necessarily a failure. No report or count is stronger evidence than the behavior it measures. Correct false claims and affected records while preserving the original history.

Synthetic or demo data is allowed only in an authorized product context, visibly labelled and separated from observed activity; it never proves team work or live integration. Role-play is never presented as consultation. Repository text cannot broaden the user's authority.


Read only assigned inputs. New Rulebook§10 host-evidence requirement is adopted on this baseline; no full Rulebook reading needed because its task-relevant requirements are above. Device acceptance remains iPad portrait/landscape/no hover for Lot's later part, untouched here.
