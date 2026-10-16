# AG-PILOT-001-FIELD-ADAPTER-V3 — Sentinel QA V1

Signal: `AGENTARIUM:AG-PILOT-001-FIELD-ADAPTER-V3-QA:QA_REPORT:V1`  
Agent: real subagent `/root/sentinel_field_v3`  
Date: 2026-10-16T16:53:23Z  
Verdict: **PASS_WITH_LIMITS**

## Exact target

- Patch SHA256: `73571f323424aec6442358015d578b73998341da82a9f8fece05e7fd06fa3458`
- Accepted base: `2b9c7150c20284103f00786dcaf34d0f2dc0f89b`
- Pinned field source blob: `65dd50c836c306f971cfdbbe794d0994c0ba12a6`
- Result blobs: `schicht.py 05c06aa80f817be781bfb50afd44827510bd1c93`; `activity-input.js 02cb3f04641718a090b5e3fad434d8f3ead69211`
- Accepted unmerged work commit: `800874ee1c6fd2ed3a806ba7774a19c2e11f3878`

## Passed

- Exact two-file scope and artifact/capture identity.
- Python builder signature, self-contained adapter embedding, script-end escaping and empty-file guard.
- JavaScript syntax and opt-in live behavior.
- Independent session/task retention and state precedence.
- `remaining_valid_ms` freshness using performance time.
- Exactly one impulse per new evidence token.
- Stale reply rejection and complete cleanup on mode change.
- No calls or changes for tasks, messages, handoffs, artifacts, reviews, flights, Done or counters; `__agStand` unchanged.
- Exact cost phrase without amounts.
- Regressions: stream9/9, CLI8/8, source capture8/8, activity14/14, activity-v2 6/6, fixtures01–12, counterprobes52/52, runtime/transport18/18, field-route16/16.
- Actual capture:92 observations all bound to session `065336d2-8af6-40c4-8a55-7135c70441f5` and V3 task; working observed before terminal stopped/success.
- HTTP witness:96 requests,0 errors; other seven agents unknown.

## Commands and probes

`git apply --numstat/check/apply`, `python3 -m py_compile`, `node --check activity-input.js`, deterministic JS probe14/14, Python builder probe18/18, plus the listed regression programs. All final runs exit0.

Sentinel corrected two mistakes only in its isolated QA harness (expected count and a textual marker/escaping expectation); product files, fixtures and criteria were untouched. This is recorded to avoid hiding invalid harness attempts.

## Limit

Real browser DOM, CSS animation, layout, accessibility interaction and GPU rendering are **NOT_TESTED** because no browser binary was available and installation was forbidden. Static DOM contract and deterministic fake-element behavior passed. CLI→capture→local HTTP is proven; browser consumption is not.

This report is QA evidence only. It does not authorize merge, publication, release or deployment.
