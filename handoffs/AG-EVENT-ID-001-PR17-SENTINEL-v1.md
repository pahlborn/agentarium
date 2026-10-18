# [AGENTARIUM:AG-EVENT-ID-001-PR17-QA-V1:QA:QA_REPORT:V1]

## 1. Header

- **Task:** `AG-EVENT-ID-001-PR17-QA-V1`
- **QA role:** Sentinel, real subagent `/root/sentinel_event_id_qa`; skill `qa-agent-sentinel`
- **Sender:** Atlas
- **Repository / PR:** `pahlborn/agentarium`, PR #17
- **Artifact:** `2a8fa7f16553fc8b9f5ff10dfbf6fb2327eef0d4`
- **Baseline:** `ea0e64fbc1c2d29a97117c51f298ada0e78a0593`
- **Specification / acceptance source:** `handoffs/AG-EVENT-ID-001-atlas-entscheidung-v1.md`, blob `96666ae643b0e1e823ed6d73cf2522acd3fd6ae0`
- **Candidate report:** `handoffs/AG-EVENT-ID-001-agentarium-kandidat-v1.md`, blob `1515465a33d152f7d8a58eea7d7b0308bfbe7782`
- **Checked at:** 2026-10-18T06:21:28Z
- **Environment:** Linux container; Node `v24.19.0`; Git `2.51.1`; Playwright package `1.62.1`; Chromium executable unavailable
- **Configuration:** detached isolated worktree at the exact candidate commit; synthetic/local checks only; no real GitHub event with `short_ref`, no customer device, no publication

## 2. Verdict

**FAIL**

Required criterion failed: the Original receiver detects and drops an invalid `short_ref`, but its diagnostic is not accessible. `kurzAbgewiesen` and `kurzLetzterGrund` are private variables that are only initialized and written. No getter, status surface, visible message, log entry or bridge field reads either value. This contradicts the accepted rule: if only `short_ref` is invalid, omit it, continue the otherwise valid event **and make the diagnostic accessible**.

The event-continuation behavior is present; the diagnostic half is missing. This is not a visual-polish issue because direct callers of `window.__agEreignis` can trigger the receiver's independent validation without passing through the adapter's separately accessible `kurzGrund`.

Browser execution was additionally blocked by the absent Chromium runtime. Because a required criterion already failed, the overall verdict remains `FAIL`, not `BLOCKED`.

## 3. Coverage

### Executed

- Pinned PR head/base and exact three-file diff.
- Verified protected unchanged files and deliberate non-publication version state.
- JavaScript syntax check for the adapter.
- Independently extracted and executed both canonicalization functions against 16 normal/boundary/error inputs each.
- Static data-flow inspection of optional `short_ref`, unchanged technical `id`, no client-side numbering, deduplication key, all three event kinds, escaping sinks, copy fallback, capability markers, and diagnostic exposure.
- Invoked the repository's existing AG-GH-LIVE-003 and AG-GH-LIVE-004 browser regressions against the exact commit.

### Blocked

- Browser execution, rendering, clipboard behavior, viewport measurement, Demo/Archiv runtime regression, and mixed-version runtime exercise: Playwright could not launch because Chromium was absent. One bounded `npx playwright install chromium` attempt failed because the environment returned an empty/truncated download.
- Customer live acceptance and physical Windows/iPad/Safari behavior were explicitly outside this candidate QA and were not claimed.

### Out of scope

- Producing or allocating short references.
- Merge, publication, service-worker/version bump, real GitHub comment, token use, live customer acceptance, costs and archive reader.

## 4. Acceptance matrix

| Criterion | Test | Status | Evidence | Observed result |
|---|---|---:|---|---|
| Exact candidate/base | QA-01 | passed | GitHub PR/compare plus `git rev-parse` | Head exactly `2a8fa7f…`; merge base exactly `ea0e64f…`; one commit ahead. |
| Scope: F51 receiver only | QA-02 | passed | `git diff --name-status` | Only candidate report, `pilot/github-live/github-live.js`, and `pilot/github-live/index.html` changed. |
| F47 and SW unchanged | QA-03 | passed | `git diff --exit-code … -- feld/index.html pilot/github-live/sw.js`; blob comparison | Both unchanged; `feld/index.html` blob `fa28a37…`, `sw.js` blob `d2f36d…`. |
| Candidate deliberately not published/version-bumped | QA-04 | passed | source inspection/blob diff | `FASSUNG='51'`, `GEBAUT='2026-10-18T03:45Z'`, `VORRAT='agentarium-v51'` unchanged; adapter changed to `AG-GH-LIVE-001-v1.4`. |
| Old event without `short_ref` | QA-05 | passed (source) | optional-field branch in adapter and Original | Field is optional; Original enters short-ref validation only when defined. No compulsory field or generated replacement exists. Runtime browser confirmation blocked. |
| Canonical valid/invalid values | QA-06 | passed | executable Node/VM probe on each of the two functions | 16/16 passed in adapter and 16/16 in Original. Valid: `ID0001`, `ID9999`, `ID10000`, `ID123456789012`; invalid cases include extra zero, zero, short/lowercase/space/non-digit/empty/13 digits/non-string. |
| Invalid `short_ref` does not reject otherwise valid event | QA-07 | passed (source) | adapter `pruefen()` and Original `__agEreignis()` control flow | Invalid value becomes empty/omitted; neither path returns rejection solely for this field. Runtime browser confirmation blocked. |
| Invalid `short_ref` diagnostic accessible in adapter | QA-08 | passed (source) | `__agGithub.stand().kurzGrund`, `zahl.kurzUngueltig`, adapter log | Adapter exposes reason/count. |
| Invalid `short_ref` diagnostic accessible in Original | QA-09 | **failed** | exact source references `index.html:5206, 5258-5260`; occurrence count | `kurzAbgewiesen` and `kurzLetzterGrund` are only initialized/written (two occurrences each), never read or exposed. Direct Original validation is silent. |
| Technical `id` unchanged | QA-10 | passed (source) | adapter constructs output with `id: ev.id`; Original preserves string `e.id` | No derivation from or replacement by `short_ref`. Runtime wrapper confirmation blocked. |
| No client allocation/renumbering | QA-11 | passed (source) | diff/source search | No counter or fallback creates `short_ref`; valid values are copied, invalid values omitted. |
| Duplicate event retains identity / no re-numbering | QA-12 | passed (source) | existing dedupe remains keyed on technical `ev.id`; no short-ref mutation | `short_ref` does not participate in dedupe and is never assigned. Browser confirmation blocked. |
| `progress`, `handoff`, `contribution` | QA-13 | passed (source) | unchanged `ARTEN`/`GH_ARTEN`; generic short-ref propagation before kind-specific display | All three accepted paths share the optional field handling. Browser movement/display blocked. |
| Old/mixed consumers distinguished | QA-14 | passed with deployment limit | adapter `__agGithub.kann=['short_ref']`; bridge `kurzreferenz='short_ref-v1'`; old adapter baseline lacks field | Capability is inspectable. An old adapter still rejects a comment containing `short_ref`; safe rollout must remain receiver-first and producer-last. Mixed runtime check blocked. |
| Text safety / XSS | QA-15 | passed (source) | short reference allows digits only; display uses `esc(E.kurz)`; existing title/source sinks use `esc` | No unescaped new data sink found in the diff. Browser injection confirmation blocked. |
| Full technical/source line accessible and copy fallback | QA-16 | passed (source) | `.agHerkunft` listener; Clipboard API success branch; DOM Range selection fallback | Mechanism exists and does not claim success on failure. Real clipboard/browser behavior blocked. |
| Desktop/tablet and small-screen presentation | QA-17 | blocked | existing browser suite invocation and failed launch record | No independent rendered measurement. Implementer's synthetic report is not substituted for QA evidence. Known phone layout boundary remains unaccepted. |
| Demo and archive regression | QA-18 | blocked | exact browser suite invocation and failed launch record | Static diff shows short-ref code guarded by live-event input, but actual Demo/Archiv behavior was not independently executed. |
| Existing AG-GH-LIVE-003/004 browser regressions | QA-19 | blocked | generated `results.json` files | Both stop at environment setup: Chromium executable missing. No test case ran. |

## 5. Execution record

### Repository identity and diff

```sh
git fetch --no-tags origin \
  2a8fa7f16553fc8b9f5ff10dfbf6fb2327eef0d4 \
  ea0e64fbc1c2d29a97117c51f298ada0e78a0593
git worktree add --detach <isolated-dir> 2a8fa7f16553fc8b9f5ff10dfbf6fb2327eef0d4
git rev-parse HEAD
git diff --name-status ea0e64fbc1c2d29a97117c51f298ada0e78a0593..HEAD
git diff --check ea0e64fbc1c2d29a97117c51f298ada0e78a0593..HEAD
```

Result: exit 0; exact head confirmed; three changed files; no whitespace errors.

### Protected paths and artifact hashes

```sh
git diff --exit-code ea0e64fbc1c2d29a97117c51f298ada0e78a0593..HEAD \
  -- feld/index.html pilot/github-live/sw.js
git ls-tree ea0e64f... pilot/github-live/index.html \
  pilot/github-live/github-live.js pilot/github-live/sw.js feld/index.html
git ls-tree HEAD pilot/github-live/index.html \
  pilot/github-live/github-live.js pilot/github-live/sw.js feld/index.html
```

Result: exit 0 for protected paths. Candidate blobs: index `9bb19855cecf2f88034c6fe9e2e01f8e0332024e`; adapter `f8826b52316b127c7dfe07efb7d11736a52db797`; SW unchanged `d2f36d2da00380cb276fdf1a0f76ae51ce40514f`; F47 unchanged `fa28a3730539cf4cca45704cb7f6483daf3e8bc9`.

### Syntax and canonical format

```sh
node --check pilot/github-live/github-live.js
node <VM probe extracting each exact kurzKanonisch function>
```

Result: exit 0. Adapter 16/16 passed; Original 16/16 passed. No retries.

### Diagnostic exposure reproduction

```sh
rg -n "kurzAbgewiesen|kurzLetzterGrund|kurzGrund|short_ref" \
  pilot/github-live/index.html pilot/github-live/github-live.js
rg -o "kurzAbgewiesen|kurzLetzterGrund" pilot/github-live/index.html | sort | uniq -c
```

Result: each Original diagnostic variable occurs exactly twice: declaration plus write. There is no read/exposure. The adapter's separate state exposes `kurzGrund`; this does not expose a direct Original rejection.

### Browser regressions

```sh
node tests/AG-GH-LIVE-004-browser.cjs pilot/github-live 2a8fa7f... <out-004>
node tests/AG-GH-LIVE-003-browser.cjs pilot/github-live 2a8fa7f... <out-003>
npx playwright install chromium
```

Results: both test commands exit 1 with one `ENVIRONMENT=blocked` record; no browser cases execute. Browser installation also exits nonzero after receiving a zero-length/truncated archive. No retry beyond the installer's own bounded mirrors.

## 6. Failure

### QA-F01 — Original receiver hides invalid-short-ref diagnosis

- **Severity:** major contract failure
- **Smallest failing case:** call candidate `window.__agEreignis` in GitHub live mode with an otherwise valid observed event and `short_ref: 'ID00001'`.
- **Expected:** event accepted without short reference; a count/reason for the invalid field is accessible.
- **Actual from exact source:** event is accepted and short reference omitted; `kurzAbgewiesen` increments and `kurzLetzterGrund` is assigned, but neither is ever read or exposed.
- **Consequence:** failures entering at the Original boundary cannot be diagnosed by Atlas, QA or the customer. Adapter diagnostics cover only the adapter path, while the specification explicitly requires independent Original validation.
- **Owner:** Agentarium implementation agent / Forge, routed by Atlas.
- **Required correction:** expose the Original count and latest reason through the smallest existing diagnostic surface without changing event acceptance or UI scope; then retest the exact corrected commit.
- **Evidence:** `pilot/github-live/index.html` around lines 5206 and 5258–5260 at commit `2a8fa7f…`.

## 7. Regression and compatibility

- Source compatibility for events without `short_ref` is preserved.
- Adapter v1.4 is additive for the new receiver; technical event identity remains unchanged.
- Old adapter behavior is intentionally incompatible with comments that already contain `short_ref`: it rejects the full event as an unknown field. Therefore producer enablement before confirmed receiver rollout remains prohibited.
- F47 and the F51 service worker are untouched in the candidate.
- Runtime compatibility on Linux Chromium, Windows Chrome, iPad/Safari, Demo, Archiv and old/mixed loaded clients is **not independently demonstrated in this QA run**.

## 8. Environment integrity

- GitHub repository/PR/branch were read only; no review, comment, merge, publish, workflow or real event was created.
- Candidate application/specification/tests were not edited.
- Isolated worktree remained clean after inspection and non-browser probes.
- QA result files and failed installer cache are local scratch artifacts only. No credentials or personal token were used.

## 9. Evidence limits

- The candidate author's 14/14 and browser claims are treated as a self-report, not independent QA evidence.
- The independent canonicalization result is executable Node evidence for those pure functions only.
- Source inspection proves the missing diagnostic exposure and is sufficient for the contract failure.
- Browser rendering, actual clipboard, WebGL visuals, Demo/Archiv runtime behavior, device layout and customer live behavior remain untested here.

## 10. Next action

Atlas should return **QA-F01** to the Agentarium implementation agent/Forge against exact commit `2a8fa7f…`. Stop condition: a new exact commit exposes the Original receiver's invalid-`short_ref` count/reason through a documented diagnostic surface while preserving acceptance of the otherwise valid event. Sentinel then reruns the focused source/behavior check and, in an environment with Chromium or on the target device, the relevant browser regressions. This report authorizes no merge or publication.
