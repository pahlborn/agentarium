# AG-PILOT-001 — Source-to-field component status V3

Date: 2026-10-16. Owner: Atlas. Status: **IMPLEMENTED AND QA-SUPPORTED, BROWSER PROOF OPEN**.

Forge completed the focused adapter task without a turn cutoff. The actual run used `claude-sonnet-5-5`, session `065336d2-8af6-40c4-8a55-7135c70441f5`,24 turns and190.361s. Cost was0.4518881USD. [Run](https://github.com/pahlborn/agentarium/actions/runs/38934352513), [result](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6220343563).

The exact patch adds the same-origin opt-in `/activity` receiver and minimal hooks in the existing field generator. It does not create task or communication events. Sentinel independently returned PASS_WITH_LIMITS and the exact tested result was preserved at unmerged working commit `800874ee1c6fd2ed3a806ba7774a19c2e11f3878`.

Actual instrumentation of this implementation run observed work and terminal stopped/success through the local HTTP API. This does not prove browser receipt or rendering.

Remaining before an operational visual pilot claim:

1. Build and open the field through the local `/field?activity=1` route on a machine with a real browser.
2. Observe working, waiting/unknown/blocked where applicable, and stopped transitions without layout collision.
3. Record the exact browser/build/version evidence.
4. Only then start the broader project pilot. No merge/release/deployment decision is implied.

Cost context: source hook V1 + field V1 + failed V2 + successful V3 = **1.0039861USD** provider-reported runtime. This is not a complete Agentarium project total; product UI therefore continues to show only “Kosten nicht vollständig ermittelbar.”
