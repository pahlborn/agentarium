[Agentarium:AG-GH-LIVE-003:QA:QA_REPORT:V1]

1. Header
- Sentinel: real ChatGPT QA subagent /root/sentinel_expiry_fixes; qa-agent-sentinel skill and QA contract loaded. Actual underlying model/effort unavailable to this agent.
- Task: independent acceptance of token-expiry UI corrections; acceptance scope supplied by Atlas on 2026-10-18, original Agentarium, no product implementation or external mutations by Sentinel.
- Repository pahlborn/agentarium, branch agent/github-live-pilot-v1. Product candidate 5b00fe269ea6a100706095e9c147bcd4e022057d; retest candidate c40b4cb5155b62bc31d0bb35a9d2ceb023530b17 changes only the QA harness. GitHub raw source for both commits independently compared equal.
- Build Fassung 50. Built adapter SHA256 28a034e589131286206e52496bca7c96af42f14a47ce0185f25009cd6321ea22. Built index SHA256 da67538abde21a12da32d0a2eeae2dcd7282ec1eae59837e6a7f566a8416d234 (first CI artifact).
- Checked 2026-10-18, final browser result timestamp 03:24:32.106Z. CI Ubuntu, Node v22.23.3, Playwright 1.62.1, Chromium 151.0.7922.34 headless. Synthetic GitHub responses/date, Europe/Berlin date calculations. Not Safari or physical iPad.

2. Verdict
PASS_WITH_LIMITS for this bounded expiry correction. All 16 required independent browser criteria passed on the retest; 39 original regression checks and the expiry component suite passed on the product-identical initial candidate. No blanket mobile layout, physical-iPad expiry rendering, renewed real-transport or deployment approval is implied. A phone-header overlap remains outside this bounded warning correction and is recorded below.

3. Coverage
- Executed: independent source inspection; browser warning geometry at 320, 375, 390, 768 px, connected and network-error states; expiry boundary 11/10/1/0/-1 days; date missing/deleted/preserved across reload; synthetic token RAM/clear checks; inspection of CI logs and preserved screenshots.
- Existing regression evidence independently read: 39/39 synthetic browser checks, including original demo/autostart/archive mode, no GitHub in demo/archive, real Original rendering layer, parser/dedupe/pagination/transport controls, no token storage/DOM/URL/console, 401 stop.
- Not tested: physical Safari/iPad, actual PAT/GitHub transport in this correction, page backgrounding over real calendar days, all screen sizes/orientations, production publication. Prior Peter-confirmed live breakthrough is separate evidence, not a result of these synthetic tests.

4. Acceptance matrix
| Criterion | Test | Status | Observed result |
|---|---|---|---|
| Complete warning when collapsed at 10 days, connected or network error | WARN-10-{320,375,390,768}-{success,network}, 8 cases | passed | Full warning text-node ranges inside viewport and nonclipping ancestors, summary remains visible; screenshot evidence |
| No premature warning at 11 days | BOUNDARY-11-no-warning | passed | No 11-day warning in summary |
| Correct singular at 1 day | SINGULAR-1 | passed | '1 Tag'; no '1 Tagen' or 'noch 1 Tage' |
| Missing date remains missing after reload; no automatic persistence | MISSING-not-confirmed-reload | passed | Empty date input/storage; explicit missing/unconfirmed message |
| Cleared date not recreated on reload | DELETED-not-recreated-on-reload | passed | Expiry storage key absent after reload |
| Existing valid date preserved | SAVED-date-preserved-reload | passed | Stored date 2026-10-28 retained exactly |
| Today and overdue remain visible | EXPIRY-2026-10-18 / EXPIRY-2026-10-17 | passed | Today/overdue warning visible collapsed; 'seit 1 Tag' |
| Token only RAM and clear on disconnect | TOKEN-RAM-only-and-cleared | passed | Input cleared; no token in storage/DOM/URL/debug/console; only fixed GitHub endpoint receives it; normal Summary click then Trennen clears token |
| Original demo/archive regression | existing AG-GH-LIVE-001 suite | passed | 39/39 synthetic checks on product-identical 5b00 candidate |

5. Execution record and evidence
- Exact harness: tests/AG-GH-LIVE-003-browser.cjs; local /workspace/scratch/d750c8865a51/sentinel-expiry-qa/AG-GH-LIVE-003-browser.cjs; final SHA256 ba9c6f92ef587b6c7b537cf32efbae662b0ea39b68bebe68a557c8d59e81ddef.
- Command: node tests/AG-GH-LIVE-003-browser.cjs /tmp/ag-gh-built c40b4cb5155b62bc31d0bb35a9d2ceb023530b17 artifacts/sentinel-expiry-results
- Preconditions: exact Original regenerated; local HTTP server, synthetic empty GitHub comment list or aborted fetch, synthetic date 2026-10-18, test-only token; service workers blocked in independent harness.
- Initial run https://github.com/pahlborn/agentarium/actions/runs/39093218740, job 117574164138. 39/39 regression + expiry VM passed; 15/16 independent cases passed. Final case invalid as designed: attempted Trennen inside automatically collapsed details without opening summary; timeout, not observed product failure. This failed run is preserved, not hidden.
- Harness correction only: ordinary user Summary.click() before Trennen.click(); no force click, application edits, acceptance weakening or expected-value changes. Retest https://github.com/pahlborn/agentarium/actions/runs/39093437217, job 117574819330. All 16 cases passed, browser step 03:23:54–03:24:32Z (~38 s), exit 0. Repeated only relevant independent suite; 39+VM evidence remains tied to product-identical 5b00 source.
- First artifact 12124110146 ZIP SHA256 06ca93699f62fa96451ba328a77f1aad874d75896f996067668b5b45304c4422; retest artifact 12123592467 ZIP SHA256 da89dc2467dd18e07a8d87635bcd9ca0f08d04b437a78867603b22516988fd7e.
- Initial screenshots/results independently inspected locally under sentinel-expiry-qa/ci-39093218740/home/runner/work/agentarium/agentarium/artifacts/sentinel-expiry-results/; warn-320-network.png, warn-375-success.png, warn-390-network.png, warn-768-success.png viewed directly. The retest logs were independently read via GitHub connector.

6. Findings (two)
F1, open UI nonfunctional, phone layouts: fixed top-center GitHub panel (z-index60) overlaps original left Agentarium brand/right run title (z-index7) at 320/375/390 px, visible in screenshots above. Warning itself is fully visible; bottom control buttons remain visible. 768px screenshot keeps top brand and run title separate. No physical iPad guarantee follows. Owner Atlas to route bounded phone layout correction; do not advertise unrestricted phone UI acceptance. This is not a blocker for bounded expiry functionality on the agreed tablet-sized acceptance viewport; no product edit by Sentinel.
F2, corrected test-design defect: initial TOKEN-RAM disconnect case omitted opening details after product auto-collapse. Classified invalid for the disconnect action in first run; harness amended and exact retest passed. Owner Sentinel, closed with retest, initial record retained.

7. Regression and compatibility
Chromium synthetic date/network only. Original demo/archive passed existing 39-case suite. No general phone responsiveness acceptance; no Safari-specific expiry test. Additional warning line does not replace or alter Original product modes. Product source comparison confirms no changes between accepted 39-case candidate and independent retest candidate.

8. Environment integrity
No application source edits, commits, issues, messages or deployments performed by Sentinel. Only local QA harness/report/extracted evidence created. QA source directory is loose files, not a Git checkout; tracked-file status unavailable and not asserted clean. Atlas performed authorized integration/CI activation. Extracted artifact contains only test/build output; preserved for evidence, no cleanup deleting records.

9. Evidence limits
Local Playwright module existed but browser executable was absent; initial direct launch blocked. Browser execution used the existing GitHub Actions route, whose exact logs and artifacts were independently checked. Synthetic transport proves UI/logic, not real GitHub networking, PAT validity or physical iPad behavior. A stored valid date from old versions cannot reveal whether it originated from a human or old auto-default; preserved values still need user checking.

10. Next action
Atlas: record bounded QA result, retain phone-header finding in backlog with screenshots, integrate/publish only within existing authority, verify deployed identity. Stop condition for this Sentinel assignment met: exact independent retest 16/16 plus original regression evidence. No QA authority to merge, publish, or accept on Peter's behalf.
