# AG-GH-LIVE-004 — Argus delta review V1

[AGENTARIUM:AG-GH-LIVE-004:RA:RA_REVIEW:V1]

Review date: 2026-10-18. Reviewer: actual Argus ChatGPT subagent `/root/argus_live_handoffs`, using `review-agent-argus`. Sender: Atlas. Scope: bounded semantic postcheck of Forge's observed-communication implementation against the three prior risks. No implementation or external mutation.

## Exact basis

Baseline generator commit: `c40b4cb5155b62bc31d0bb35a9d2ceb023530b17`.
Reviewed local delivery: `/workspace/scratch/d750c8865a51/forge-handoffs-v1/files/`.
Candidate commit was not supplied at review time; hashes below identify the reviewed bytes.

| Artifact | SHA256 |
|---|---|
| previews/AG-VISUAL-005-feld/github-live.js | `625bb3d814bf08cbfe81f2f8655696962dc9cef422a3a9fd1e148ecdf027b114` |
| previews/AG-VISUAL-005-feld/schicht.py | `8843a5ae319752ac994dc8f75fef6feca1813908887f5334c66cd49db030d265` |
| forge.patch | `6ace38265870bfa78ba1b0c9f81d378f0aefb2addb50726883d3fd7c6960a472` |

## Verdict

**PASS_WITH_NOTES — one MAJOR correction before publication of this slice.** The principal guards close the original risks, but one indirect state path remains. This is not product acceptance, publication permission or a browser QA result.

## Finding R1 — MAJOR, confirmed: observed message accelerates an existing task ball

Location: `schicht.py`, `wirf()` around line 600, unconditional live call `baelleEinholen(E.von)`; helper around line 571. The call runs before the new `E.beobachtet` guards. It changes the duration of every unfinished ball arriving at that actor, including an unmarked ball with the preserved task semantics. Such a ball can subsequently execute `arbeitAn` and set `derBall` sooner than it would without the observed message.

Reproduction: executed the exact source bodies of `baelleEinholen()` and `wirf()` in an isolated Node VM with rendering dependencies stubbed. Existing ball: `{an:'forge',u:0,dauer:4,sonne:true,beobachtet:false}`. Incoming event: observed `contribution` forge→atlas, title `QA FAIL`. Actual existing duration changed **4 → 0.28 seconds**. This is direct helper/function execution, not a full browser or complete state test. Counter-evidence: the observed ball itself has the correct no-start/no-finish guards; the leak is the earlier mutation of another ball.

Affected criterion: marked observed communication must not affect task state, including when ordinary hooks coexist. Consequence: an unrelated preserved task starts earlier indirectly, contradicting the claim that every state path is cut.

Smallest correction: invoke `baelleEinholen` only for unobserved events, leaving its legacy behavior otherwise unchanged. Owner: Forge. Sentinel should include a mixed-path regression: ordinary in-flight task ball plus observed handoff/contribution from its recipient; the old ball's duration and early task state stay unchanged by the message.

## Closed risks / coverage

- Full project/run/task keys and source tool ID now reach `E.spur`, the adapter panel and escaped visible provenance. Marked communications deliberately do not bind to or close any task; therefore the oldest-task fallback is bypassed rather than patched globally.
- `schritt()` handles `E.beobachtet` before completion/table/acceptance/blocker logic. Arrival guards prevent observed `arbeitAn`, whole-ball ownership and recipient expectation. Marked events ignore usage/model payloads. `stromZeile` avoids an open-task label. R1 is the remaining indirect exception.
- Communication kinds require a known recipient; old progress records without recipient remain supported. The bridge capability rejects communications against an older Original, preserving progress compatibility. This is a useful additional compatibility guard from Forge.
- The diff confines changed semantics to marked GitHub ingress. Demo/archive/unmarked hooks retain their old branches, aside from the explicit Fassung increment and rendering provenance support. Runtime equivalence is not claimed from this static inspection.

## Acceptance matrix

| Criterion | Review result | Evidence |
|---|---|---|
| No automatic task/table/acceptance effects from marked communication | failed | R1; principal direct paths otherwise guarded |
| Full identity/provenance and no invented model | passed, static inspection | adapter handoff, E.spur, spurWort, usage guard |
| Safe old-Original/new-adapter combination | passed, static inspection | kommunikation capability gate |
| Old progress / demo / archive / unmarked hooks | not tested by Argus | scoped diff reviewed; Sentinel browser evidence pending |
| Actual live handoff chain on target device | not tested | separate acceptance surface |

## Limits, impact and next signal

No full browser, deployment, iPad, token, pagination or end-to-end live test executed by Argus. Atlas's reported component PASS is not counted as independent execution. Reviewed complete supplied diff and affected rendering/state functions; no broader architecture review.

Impact: GitHub adapter, Original generator and component tests only. No data migration, authorization expansion or user policy decision is required for R1. Existing device-layout limitation remains outside this slice.

Next owner: Atlas routes R1 to Forge, then Sentinel verifies the corrected exact candidate including mixed-path behavior and required compatibility checks. `RA_REVIEW` applies to the hashes above; a corrected hash needs bounded delta confirmation, not a new full specification.

## R1 delta confirmation — 2026-10-18

[AGENTARIUM:AG-GH-LIVE-004:RA:RA_AGREED:V2-R1]

Corrected actual delivery: `/workspace/scratch/d750c8865a51/forge-handoffs-r1/files/previews/AG-VISUAL-005-feld/schicht.py`.
SHA256: `939ae76328d84cdd4ee04499c2a06977ad6167d0c291e841cc6b3f2cf0a0fb2c`.
Atlas reports Forge run `39094760434`, session `1c7228a5-0cf4-452c-9b67-32ab17b6aab0`; this follow-up inspects the delivered local bytes, not independent API run metadata.

Executed the same isolated Node VM reproduction using the corrected actual `baelleEinholen()` and `wirf()` function bodies. **PASS:** the observed contribution now preserves the existing unmarked task ball's duration at **4 seconds**. Additional control: an unmarked legacy contribution still changes the duration **4 → 0.28 seconds**, preserving intentional catch-up behavior. Only the guard and explanatory comment changed in this delta.

R1 is **closed for these exact bytes**. No unresolved Argus finding remains in this bounded semantic review. This delta confirmation is not a full browser/state, deployment or target-device test; Sentinel retains the independent browser checks. No implementation or publication authorization is conveyed.
