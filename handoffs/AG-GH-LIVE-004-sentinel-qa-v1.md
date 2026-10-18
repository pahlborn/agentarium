[Agentarium:AG-GH-LIVE-004:QA:QA_REPORT:V1]

1. Header
Sentinel, real QA subagent /root/sentinel_expiry_fixes, qa-agent-sentinel skill and QA contract loaded. Actual underlying model/effort unavailable to this agent. QA phase: consumer candidate verification BEFORE isolated pilot publication. Input: Atlas communication-only slice decision and handoffs/AG-GH-LIVE-004-forge-v1.json on control 36a049aec84cbe957202052c8b3a494c6775672c. Baseline c40b4cb5155b62bc31d0bb35a9d2ceb023530b17 / Original F50. Exact tested candidate b5dcabb47802c6c9b401e6d429040979aaf9ffc5, branch agent/github-live-pilot-v1 / Original F51, adapter AG-GH-LIVE-001-v1.3. Checked 2026-10-18; final result 03:51:04.413Z.

2. Verdict
PASS_WITH_LIMITS for the bounded consumer candidate in Linux Chromium, 1180×820 desktop and 768×1024 tablet. All 18 independent focused browser cases passed; the same candidate passed 39 Original regression checks, Forge's 24 parser/component checks and the expiry VM suite.

This verdict is NOT the live end-to-end acceptance of the new multi-role cycle. C3 (real Atlas→Forge→Sentinel work and return into Peter's already-open monitor) is NOT TESTED/pending after deployment and user readiness. No successful new real multi-role run is claimed. No physical Windows, Safari/iPad or general phone acceptance is claimed. QA does not authorize publication/merge/customer acceptance.

3. Coverage
Executed: exact GitHub source inspection; actual Original browser application with synthetic GitHub response fixtures; original flight movement endpoints/u; communication-only state isolation including two pre-existing manual tasks and foreign task/run/project keys; legacy progress; metadata/provenance; rejection, title injection, dedupe, history and token-disconnect checks; independent CI log/result/screenshot inspection.
Not tested: actual PAT/network/producer for the new communications, physical Windows or Safari, device GPU compatibility, exhaustive 17-kind Original behavior, long-run/performance, arbitrary 120-character metadata layout. Phone-header overlap remains open from AG-GH-LIVE-003. Expiry screen geometry not repeated because panel/date logic unchanged; expiry component checks repeated.

4. Acceptance matrix
| Criterion | Independent cases / evidence | Status | Observed result |
|---|---|---|---|
| History not replayed | history-not-replayed, both viewports | passed | Historical handoff/contribution absent; zero shown before newly added fixture |
| Handoff uses Original flight, full identity, no work state | handoff-original-flight-identity-no-state, both | passed | __agEreignis receives exact fields; Original fliegend atlas→forge with u increasing; full event/project/run/task/source ID and provenance readable; no assignment/completion/product state change |
| Contribution return is communication only | contribution-original-return-no-state, both | passed | forge→sentinel Original flight and labelled QA FAIL report; no acceptance/work-state change |
| Legacy progress | legacy-progress-identities-no-flight, both | passed | Old envelope without recipient accepted; metadata preserved; pulse/no flight/state effect |
| Two outstanding tasks, foreign keys and QA PASS report | parallel-seed-and-foreign-returns-no-state, both | passed | Manual Original hooks still create two tasks; foreign task/run/project and valid B report leave tasks, completions, artifact register, product blocks and ball ownership unchanged |
| Recipient/kind validation | recipient-and-kind-rejects-no-state, both | passed | Missing/empty/wrong-type/unknown/__proto__ recipient and test_result/artifact/invented kinds rejected diagnostically with no state change |
| Safe content and dedupe | injection-dedupe-and-safe-display, both | passed | HTML title remains text, no injected image/script, duplicate ID not replayed |
| Mixed old/new path | mixed-unmarked-flight-not-captured-by-observed-return, both | passed | Existing unmarked request retains flight duration and stays in flight after observed contribution; no early work-start/ownership mutation |
| Token RAM + disconnect | token-ram-only-disconnect, both | passed | Input cleared, absent from storage/DOM/URL/debug, sent only to fixed GitHub endpoint; ordinary UI disconnect clears token |
| Original demo/archive + transport/privacy regression | existing 39-case suite on same SHA | passed | No GitHub panel/request in demo/archive; Original layer, parser/dedupe/headers/hidden/resume/401/privacy remain as checked |
| Real Atlas→Forge→Sentinel cycle | C3, after deployment/readiness | not tested | Required subsequent live-pilot evidence, not supplied by synthetic cases |

5. Execution record
- Command: node tests/AG-GH-LIVE-004-browser.cjs /tmp/ag-gh-built b5dcabb47802c6c9b401e6d429040979aaf9ffc5 artifacts/sentinel-communication-results
- Harness: /workspace/scratch/d750c8865a51/sentinel-communication-qa/AG-GH-LIVE-004-browser.cjs, SHA256 a6cc4b269174c08302e7862025c342a5d8a533a17fb64a5f84702b823e04e212. Original functions are called unchanged; an observation wrapper records __agEreignis arguments/results and calls through. Main transport tests use page.route synthetic comments; the mixed-path case uses existing manual Original hooks/__agSchritt to make the in-flight boundary deterministic. No fake DOM or replacement renderer.
- CI https://github.com/pahlborn/agentarium/actions/runs/39094881747, job 117579144059, control SHA cc78521c536672f60b88e72692d6737fbf5c2f93. Exact build checkout verified from logs. Independent suite ran 03:49:27–03:51:04Z (~97 s), exit 0, 18/18 passed. No browser retries on this candidate.
- Environment Ubuntu GitHub runner, Node v22.23.3, Playwright 1.62.1, Chromium 151.0.7922.34 headless, service workers blocked in focused suite, Europe/Berlin timezone. No physical Windows equivalence asserted.
- Artifact 12124222803, ZIP SHA256 a111fce8cc1f7767ccdbef0d19d11ce2502355ce832d030c04513ca9fe8ca4f2. Built index SHA256 edb254e6912374cb37b9ed64605120319b1c9829e757cca8a1d16a76a84d8971; built adapter SHA256 625bb3d814bf08cbfe81f2f8655696962dc9cef422a3a9fd1e148ecdf027b114, verified from extracted artifact.
- Results and screenshot files under /workspace/scratch/d750c8865a51/handoff-browser-evidence/home/runner/work/agentarium/agentarium/artifacts/sentinel-communication-results/. Independently read results.json, 1180-mixed-path.json and viewed 1180-NEW-H.png and 768-NEW-C.png directly.
- Mixed path measured at1180: pre-existing request atlas→forge duration2.610s before AND after observed return, u0→0.001; outstanding tasks2→2, completed0→0, forge:2 unchanged, ball ownership forge unchanged. Concurrent contribution appears as a separate flight; no capture/acceleration.

6. Findings and corrections
F1, corrected before tested candidate: Original generic wirf() called baelleEinholen(E.von) for observed communications. Argus identified resulting premature capture/acceleration of an unrelated unmarked pending assignment. Current source guard is MODUSlive && !E.beobachtet; independent mixed-path case passed both viewports. Prior known-bad candidate was not given a successful browser acceptance claim.
F2, QA design improved before execution: initial mixed-path draft checked only early u/state. Atlas correctly observed that shortening duration could evade that immediate check. Final harness additionally compares existing flight duration strictly before/after, preserving the same intended criterion. This change strengthens evidence, not application behavior or acceptance relaxation.
F3, visual limit (open/deferred): full metadata adds dense transient labels; in 768 screenshot the contribution text overlaps existing role labels. Endpoints/provenance remain identifiable in inspected fixtures, but this is not a polished layout or maximum-length-ID readability acceptance. Existing phone top-header overlap also remains open; no device feature was silently disabled. Owner Atlas for later UI prioritization, not part of this bounded transport correction.

7. Regression and compatibility
Original demo/archive smoke + transport/privacy checked in current 39-case suite. Legacy manual Original assignments still work (focused seed check), whereas marked GitHub communications leave their state unchanged. Progress remains a work-step pulse, not ongoing-busy or done proof. The adapter capability guard for older consumers is covered by Forge component tests and source inspection; independent actual-browser focus targets F51. No need to rerun all prior expiry geometry unless panel/date code changes.

8. Environment integrity
Sentinel made no product edits, GitHub mutations, deployments or paid model invocations. Created only local QA plan/harness/report and read shared extracted evidence. Source folders are loose files, so no Git tracked-clean assertion. CI activation/integration belongs to Atlas. Artifacts preserved; no destructive cleanup.

9. Evidence limits
Synthetic comments are visibly labelled fixtures and are not real team replies. CI success demonstrates the exact checks executed on b5dc only. Source/runtime metadata from Forge is not independently inferred by QA. A consumer-ready decision can precede a live producer exercise; the real-cycle acceptance stays pending, not silently marked passed. No raw thinking, PAT or sensitive inputs are present in this report.

10. Next owner/action
Atlas: persist bounded consumer QA, proceed only within existing isolated-pilot publication authority, verify deployed F51 identity; then obtain user's connected readiness and execute a new real work cycle. Record genuine Sentinel response as contribution only after response exists, clearly reported_checkpoint rather than runtime proof. Keep real-cycle acceptance pending until observed in the already-open customer monitor. No normal /feld/ merge/publication decision follows from QA.
