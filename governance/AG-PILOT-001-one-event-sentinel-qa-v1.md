[AGENTARIUM:AG-PILOT-001-ONE-EVENT:QA:QA_REPORT:V1]

## 1. Header

Sentinel, actual collaboration subagent `/root/sentinel_one_real_event_mvp`, loaded `qa-agent-sentinel` and its QA contract. Checked 2026-10-17. Exact requirement: `handoffs/AG-PILOT-001-one-event-implementation-v1.md`, baseline `56059ef3d098594dc5a751aa96dfc6d31f4d252c`, repository `pahlborn/agentarium`, working branch `agent/mvp-one-event-20261017`.

Forge artifact: `handoffs/AG-PILOT-001-one-event-forge-v1.patch` at `8825c90e98e7a167b40d6162f42f386819731aa7`; SHA256 `69442975acc315f73b88190dc7f5dfb86ca494fc1cbb5dc65e88d974b9784f61`. Local patched source SHA256 `60c7ad317736f50412fad02132d03ad3b8a2fbaa29ba89640aea350f43bd794e`.

Real source: observed Argus handback export, baseline Git blob `01c3ed8ec7b7fbec6856987f732baca1ffc27f12`, SHA256 `a8ba94c8abc2540300240eb4ebc8229fee8ca2f95f808558096bb6c354c60197`. Its `kind` is `review_result`, actor `argus`, recipient `atlas`, event ID `AG-PILOT-RECOVERY-20261017-RA-REVIEW-V1`. This is an actual reviewer result manually exported from the running team environment, not an automatic collector or ongoing live stream. The source's substantive verdict is historical failure of the earlier claimed acceptance, not success of this implementation.

## 2. Verdict

**BLOCKED for the final published-original acceptance.** The exact isolated candidate passed all four required scoped CI integration cases using the original generator and its existing Pages/PWA packaging. This is real source → actual same-origin HTTP read → original event hooks → visible original field, in isolated CI Chromium/SwiftShader. It is not yet the published original or Peter’s iPad acceptance.

## 3–4. Coverage and acceptance matrix

| Criterion | Check | Status | Evidence |
|---|---|---|---|
| Correct source and exact artifact | Baseline Git blob and delivered patch SHA checks | passed | Hashes above; local hashes verified |
| Generator builds JavaScript | Python `bauen()` then Node `--check` for both generated inline scripts | passed | Both script blocks exit 0 |
| No opt-in means no new source read | Isolated browser, normal URL | passed | CI2 `normal-mode-no-read`: zero JSON requests; no MVP state |
| One real same-origin read and both hooks accepted | Isolated Chromium/SwiftShader, `?mvp=1` | passed | CI2 HTTP 200, exactly one JSON request, `abrufe:1`, both `angenommen:true`, exact event ID |
| Real review displayed in original event list | Exact returned event ID and visible source title, screenshot | passed | CI2 original `.agAuf` count 1, exact source title visible; Sentinel inspected image |
| Missing file/unknown kind fail honestly | 404 and explicitly mutated negative kind, separate contexts | passed | CI2 404 invokes neither hook; unknown kind explicitly rejected and no event list entry |
| Published original receives exact real source and displays it | Original GitHub Pages after Peter's publication approval | blocked | No publication authority in this task; no claim that isolated CI equals published acceptance |

## 5. Execution record

Local environment: executor Python and Node. Read current baseline `AGENTS.md`, Rulebook 1.2, Process 1.2 and product-development practice, plus baseline source/generator/template/data/service worker and existing `pages.py` packaging code.

Executed patch `git apply --check`, actual isolated patch apply, `bauen()` on existing template and v2 data, extraction of both inline JavaScript blocks followed by `node --check`. Both syntax checks exit 0. Source baseline and exact data blob identities verified. No browser binary installed or cloud-browser GPU policy retried.

QA preparation initially used an incorrect relative checksum path and stopped before patch application; corrected to `../mvp-dispatch/forge.patch`. Initial file export through patch transport added one terminal newline; baseline blob verification detected this. Export newline was removed and all exact baseline hashes reverified; build and syntax checks then repeated on exact input. Neither correction modified product source semantics; initial loose-identity output is not acceptance evidence.

V1 browser harness exercised bare generator output. Independent rebuild comparison found it lacked the existing five PWA head links and service-worker registration that the published original includes. V2 instead invokes the **existing unmodified `pages.py`**, preserving its real PWA package and generating SW47. V2 is not a new product implementation; it corrects QA build fidelity. Its output preserves the candidate bundle, report and screenshot for review. Any V1 result must retain its narrower scope.

V2 scratch harness: `qa-browser.cjs`, SHA256 `ce3f9023ef70047b1daa089cc12487609e960541d3c3646b7f1ea1e50c8a561c`, `node --check` exit 0. Build target inside disposable checkout only; no patch reapplication, no deployment. Fresh-context happy test permits existing service worker; normal and two negative cases block it explicitly to isolate the reader. CI2 ran the supplied harness with Chromium `156.0.8078.4` and software WebGL via SwiftShader. This is a different test environment from the Work cloud browser and from Peter's iPad.

### Independently inspected CI evidence

- CI1 `https://github.com/pahlborn/agentarium/actions/runs/39006917368`: four cases passed on bare generator output, no PWA packaging. Retained as narrower evidence, not overwritten. Report SHA256 `e8f41f9bcdf155ffa2ddcdc9c7c0902ef1f10856c59b344bfacfae28667fed06`; screenshot SHA256 `a70ceb729f17ab75a0bbe86028b40f7e0c8848305144a3ec5f536b9be6a0e24a`.
- CI2 `https://github.com/pahlborn/agentarium/actions/runs/39007084765`, trigger/source `d2c60ae78638580cd94f42fcb619756da97536c8`: four cases passed on existing generator + `pages.py` PWA bundle. Report timestamp `2026-10-17T05:40:30.882Z`; first recorded test request `05:40:21.755Z`. Exact runner setup/library versions beyond recorded Chromium are not in this report; run logs own those details. No product rerun was introduced by Sentinel after receipt.
- CI2 report SHA256 `7c049bd1c19bd720ee84d7bbb2e5a575401210826078d7f3860bdae7b42cf084`; screenshot SHA256 `d75da71674ddebebd4b87606ffb119a07732af47ece2f9602feb8d42789fd9a0`.
- Actual positive network trace: `/feld/?mvp=1` at `05:40:24.942Z`, `/feld/one-event.json` at `05:40:24.996Z`, existing SW/package requests afterward. Exactly one positive source-file request in the test window; no polling. Both original hooks returned accepted; exact Argus event ID matched. The actual WebGL machine reported present, no page errors accepted by the test. The original event-list text matched the true source title.
- Sentinel read both reports and personally inspected both screenshots. CI2 screenshot visibly contains the actual Argus failure-review title at Atlas; it does not depict a synthetic successful task. The temporary diagnostics overlaps the lower-left event list, while the central event label remains readable.

### Exact candidate bundle, not deployed

`publish-bundle/index.html`: 322044 bytes, SHA256 `23e8b503e1b623e798bef587f5775b932e44b9561178d58ca1ec3c4a6d3e68d4`. HTML contains Fassung47, exactly one existing SW registration and exactly one manifest link. `publish-bundle/one-event.json`: 1298 bytes, exact original source SHA256 `a8ba94c8abc2540300240eb4ebc8229fee8ca2f95f808558096bb6c354c60197`. `publish-bundle/sw.js`: SHA256 `08f4a20fef9d0f8d0f66adc19b0c1fb7f8f5bba9252d7891341384d6f7d935dd`, cache `agentarium-v47`. `manifest.webmanifest`: SHA256 `71c6a91ad67a1beef6473f75bf791cd6b96fdbd2a8503ca1234db787b4c6630e`. Existing five icon files are present. All hashes independently computed from downloaded CI2 artifacts by Sentinel.

## 6. Findings

**Cache/version acceptance risk:** existing service worker is cache-first with `ignoreSearch:true` for same-origin GET. A previously installed v46 worker can serve an older HTML page without the new reader. `fetch(...,{cache:'no-store'})` does not by itself bypass a service worker's Cache API. For the strictly bounded MVP the JSON path is new and its single real export is immutable, so no ongoing JSON-update mechanism or extra SW rewrite is required. Before published acceptance, demonstrate actually loaded Fassung47 and actual read of the exact file. Do not mistake a background HTML refresh for loaded new code.

**MINOR UI finding:** the opt-in MVP diagnostics panel at fixed bottom-left overlaps the original lower-left event list at CI viewport 1365×900. Source title is still visibly readable centrally by Atlas, so the agreed minimal display criterion passes; no iPad overlap result is claimed. Owner Forge/Atlas; optional cleanup after the MVP, do not expand acceptance or invent a responsive test.

**Existing run-identifier limitation:** source `run.run_id` is read and passed unchanged by the new reader, but existing `__agLauf` does not retain/display it; it sets project/title and returns project only. The new reader does not fabricate another ID. This does not block the expressly one-event visible MVP, but no run-ID display or traceability feature is accepted by these tests.

**Process evidence gap, reported not independently runtime-audited here:** Atlas reports Forge did not load Rulebook and reported unavailable Glob/Grep despite intended allowlist. A successful artifact would not erase that compliance discrepancy. Atlas should route it to Cadence without blocking unrelated objective artifact tests or pretending a definition was loaded.

## 7. Regression and compatibility

The one-event reader's minimal opt-in, positive, 404 and invalid-kind paths were executed in CI2, four cases passed. No SSE, polling, push, cursors, replay, cross-origin auth, reducers, continued operation or fabricated initialization event. No repeat/PWA-lifecycle guarantee. No Safari/iPad layout or native GPU compatibility claim.

## 8. Environment integrity

Tests use `sentinel-one-event-qa` scratch and disposable CI checkout. Sentinel has not changed product branches, commits, issues or deployed records. Generator runs and `pages.py` recreate files only inside the isolated test checkout. Temporary source snapshots, harness and evidence are intentionally retained for Atlas. Host owns any authorized persistence. No paid-model call initiated by Sentinel.

## 9. Evidence limits

The runtime provenance of Argus's export is recorded in the provided source and confirmed by Atlas; Sentinel did not impersonate or rerun Argus. Monetary/model metadata of that Argus execution remains unknown. Source-level reasoning, syntax, HTTP delivery, hook acceptance, DOM visibility and published product acceptance are different evidence classes. No required missing browser test will be relabelled PASS_WITH_LIMITS.

## 10. Next action

Atlas may present the exact CI2 candidate bundle for Peter's publication decision. No further component test is required by these observed results. After explicit publication approval, the receiving original must demonstrably load reviewed Fassung47, read the exact real JSON and visibly display its review result. Published-original acceptance remains BLOCKED until that evidence is obtained; Sentinel does not grant publication, merge or customer acceptance.
