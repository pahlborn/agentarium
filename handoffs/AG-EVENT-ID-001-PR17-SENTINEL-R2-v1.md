# [AGENTARIUM:AG-EVENT-ID-001-PR17-QA-R2-V1:QA:QA_REPORT:V1]

## 1. Header

- **Task:** `AG-EVENT-ID-001-PR17-QA-R2-V1`
- **QA role:** Sentinel, real subagent `/root/sentinel_event_id_rereview`; skill `qa-agent-sentinel`
- **Sender:** Atlas
- **Repository / PR:** `pahlborn/agentarium`, PR #17
- **Product correction:** `f2500c0cef648677401768dbe3190bc7c3ca518b`
- **Corrected baseline:** `2a8fa7f16553fc8b9f5ff10dfbf6fb2327eef0d4`
- **Current PR head additionally assessed:** `e4b2b9d121ea5035f89a82a579ea2ba5fb89e491`
- **Acceptance source:** Atlas review `9e7bc03dd787892c23ed0081318ecf032ed35a39`
- **Environment:** Linux container; Node `v24.19.0`; Git `2.51.1`; Playwright package `1.62.1`; Chromium executable unavailable
- **Checked at:** `2026-10-18T08:20:20Z`
- **Scope:** focused correction regression and committed proof-harness quality; no merge, publication, browser installation, live event or product mutation

## 2. Verdict

**FAIL for current PR head `e4b2b9d…`.**

The product correction at `f2500c0…` passes the focused independent receiver probe: 11/11 direct calls of the exact extracted `__agEreignis` implementation behaved as required, including exact preservation of the technical event ID. The former hidden-diagnostic defect is corrected.

The new committed proof harness at `e4b2b9d…` is not yet reliable enough to satisfy the requested reproducible evidence. Its browser part can falsely pass a changed technical event ID because it checks only whether an ID is truthy. Two documented fallback paths for Chromium can also resolve a directory as `executablePath`, causing a launch error rather than a clean `UNGEPRUEFT` result. These are defects in the evidence artifact, not observed defects in the product correction.

Browser rendering, clipboard, viewport, Demo/Archiv and customer-live behavior remain **blocked/not tested** in this environment. The implementer's browser result is a self-report and is not substituted for independent execution.

## 3. Coverage

### Executed

- Exact commit identity, parent chain, changed paths and clean worktree.
- Focused Node/VM execution of the exact `kurzKanonisch`, `kurzMaskiert` and `window.__agEreignis` source extracted from the candidate HTML.
- Eleven missing, valid, invalid, control-character and length-boundary cases.
- Exact technical-ID equality in return and stored event.
- Static removal check for `kurzAbgewiesen` and `kurzLetzterGrund`.
- F47, adapter and service-worker non-change checks across the correction.
- Official committed script syntax and non-browser part A.
- Adversarial check of the committed script's ID oracle.
- Controlled invalid Chromium-directory-path check.

### Blocked

- Parts B and C of the committed browser script: no Chromium executable is installed. The unmodified script returned 2 after part A, correctly stating that browser work was not executed.

### Out of scope

- Merge, publication, Fassung/cache bump, producer-side short-reference allocation, real GitHub events, customer acceptance and installation of a browser runtime.

## 4. Acceptance matrix

| Criterion | Test | Status | Evidence | Observed result |
|---|---|---:|---|---|
| Exact correction | R2-01 | passed | Git objects | `f2500c0…` has exact parent `2a8fa7f…`. |
| Former FAIL: invalid short reference | R2-02 | passed | independent extracted-source VM probe | Invalid values are accepted without `kurz`, keep the exact technical ID and return `hinweis`. |
| Missing/valid short reference | R2-03 | passed | same probe | Accepted; no warning property; valid value stored unchanged. |
| Diagnostic sanitizing | R2-04 | passed | same probe | `ID00\n01` becomes `ID00.01`; diagnostic value is limited to 24 characters. |
| Private diagnostic variables removed | R2-05 | passed | exact-source occurrence count | Zero occurrences of both former private names. |
| Protected files and versions | R2-06 | passed | Git diff/blob checks | F47, `github-live.js` and `sw.js` unchanged by `f2500c0`; F51, adapter v1.4 and cache v51 retained. |
| Current PR head product identity | R2-07 | passed | `f2500c0..e4b2b9d` diff | Later commit changes only report and adds proof script; product files unchanged. |
| Committed part A | R2-08 | passed | official script, exit 2 overall | Canonical comparison 14/14; browser parts explicitly not executed. |
| Technical ID assertion in committed part B | R2-09 | **failed** | lines 131–143 plus adversarial oracle | Returned ID is reduced to truthy/falsy. `FALSCHE-ID` produces the exact expected sentence and would pass. |
| Browser-path discovery | R2-10 | **failed** | lines 34–40 plus controlled directory run | A present `.../chromium` directory is returned as the executable and produces Playwright `spawn ... EACCES`, exit 1. Standard Playwright path is revisioned (`chromium-1234/.../chrome`) and is not discovered by these fallbacks. Explicit `AG_CHROMIUM` remains a viable route when it names the executable. |
| Independent browser/UI regression | R2-11 | blocked | official script output | No executable; no B/C browser case ran. |

## 5. Execution record

### Product correction probe

```sh
node /workspace/scratch/d750c8865a51/sentinel-event-id-r2-probe.cjs \
  pilot/github-live/index.html
```

- Preconditions: detached clean worktree at the assigned exact commit/current unchanged product blob; no browser required.
- Method: extracts the three exact production functions, evaluates them in a minimal VM context and calls the receiver with eleven synthetic observed-progress events.
- Expected: exact technical ID preserved; invalid reference accepted plus bounded/masked warning; valid/missing reference without warning.
- Actual: 11/11 passed; exit 0; no retry.
- Harness SHA-256: `a9d7d84ff8f9a5a1473d263df4e7026b7f28b032d1a951f0b3316de5139e5dde`
- Result SHA-256: `e03a95fae3eaff9de769dd43a0cad06425377246448c6d4a656a7852269ca523`

### Committed proof script

```sh
node --check previews/AG-EVENT-ID-001/pruefen.js
node previews/AG-EVENT-ID-001/pruefen.js
```

- Syntax: exit 0.
- Runtime: part A 14/14; overall exit 2 because no Chromium executable exists; B/C did not run.
- Output SHA-256: `38483de54aa96dfe674489313d6d152ef8260d1303b5aef1ab0d40294c11ca26`

### Adversarial ID oracle

The exact comparison logic from lines 139–143 was supplied `{angenommen:true,id:'FALSCHE-ID'}`. It produced `harnessWouldPass: true`. Result SHA-256: `86d54eb2726b9646152f1b6f93caff09106300c47563e5d51de63896f845818b`.

### Chromium-path behavior

A temporary existing directory was provided as `$PLAYWRIGHT_BROWSERS_PATH/chromium`. The script selected that directory as `executablePath`; Playwright failed with `spawn .../chromium EACCES`, exit 1. Result SHA-256: `f15d870354f2ed9469c49e8221d850ddc30345418e809377fb4cdbf108ff340e`. The temporary directory was removed after the check.

## 6. Failures

### QA-R2-F01 — technical event identity is not asserted

- **Severity:** major evidence defect
- **Smallest case:** receiver returns any nonempty wrong ID.
- **Expected:** `a.id === ev.id` for every case.
- **Actual:** the script records `(a && a.id) || ''`, then tests only whether it is nonempty.
- **Consequence:** regression of the durable technical event ID can receive a false PASS.
- **Owner:** Agentarium implementation agent, routed by Atlas.

### QA-R2-F02 — two documented Chromium fallbacks are not executable resolution

- **Severity:** moderate reproducibility defect
- **Smallest case:** `$PLAYWRIGHT_BROWSERS_PATH/chromium` exists as a directory.
- **Expected:** resolve an executable file or classify runtime unavailable with exit 2.
- **Actual:** directory is passed to Playwright as `executablePath`, producing exit 1. A normal revisioned Playwright path is not searched.
- **Consequence:** a valid environment can be misclassified or the documented fallback can fail unexpectedly.
- **Owner:** Agentarium implementation agent, routed by Atlas.

## 7. Regression and compatibility

- Focused receiver behavior is independently exercised at component level on the exact corrected product source.
- F47, adapter v1.4 and service worker are unchanged by the correction.
- The later evidence commit makes no product change.
- Linux Chromium, Windows Chrome, iPad/Safari, viewport layout, clipboard, Demo/Archiv and customer-live execution are not independently verified in this run.

## 8. Environment integrity

- Repository worktree was detached and clean before and after testing.
- No repository, branch, PR, issue, application, workflow or external service was mutated.
- No browser was installed and no networked event was emitted.
- QA harness/results exist only in local scratch. The controlled temporary browser-path directory was removed.

## 9. Evidence limits

- The VM probe executes exact receiver functions with minimal synthetic dependencies; it proves the focused return/store behavior, not full DOM rendering or browser integration.
- The committed script's reported prior 19-pass run was not independently repeated here.
- Missing Chromium remains an explicit environment blocker for browser evidence.
- No customer-live PASS follows from this report.

## 10. Next action

Return only the evidence-script findings to the Agentarium implementation agent on current head `e4b2b9d…`:

1. assert returned technical ID equals the supplied `K-i` for every part-B case;
2. make browser discovery return an executable file, with `AG_CHROMIUM` as the explicit reliable override, and classify absent/non-file/non-executable candidates consistently as exit 2;
3. rerun part A and Sentinel's focused non-browser probe; run B/C only where an actual browser executable exists.

Stop after one focused follow-up commit. Product code does not need another change from the evidence observed here. This report authorizes no merge or publication.
