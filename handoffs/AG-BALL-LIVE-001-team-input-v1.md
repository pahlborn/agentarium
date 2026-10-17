# AG-BALL-LIVE-001 — Team input for Forge V1

Status: ACTUAL SPECIALIST INPUT / NO IMPLEMENTATION. 2026-10-17.

## Goal and mandate

Peter requires a complete concept and feasibility study first, followed by a precise MVP definition and a real prototype on the ORIGINAL Agentarium. No late surprise may replace the live goal. The already-open iPad/browser monitor must receive real activity from work that starts independently of the viewer. Peter explicitly authorized the best appropriate LLM and rejects tiny caps that abort useful work.

The prototype mandate does not authorize a provider account, infrastructure activation, secrets, merge, release or publication. Identify the exact decision if one is unavoidable.

## Verified repository/product facts

- Public original: `https://pahlborn.github.io/agentarium/feld/`; published one-event candidate `d111b062770e32dbef0f9bb618a4923d88ff20be`.
- Existing in-page interfaces: `window.__agEreignis(...)` and `window.__agLauf(...)`. The prior one-event proof fetched a same-origin JSON once. It proves ingestion/display, not continuous live capture.
- Existing contract work V2.1 already discusses SSE/recovery, event identity, ordering and evidence. Do not redesign unrelated product architecture.
- Current concept branch: `agent/ball-live-concept-20261017`; charter `handoffs/AG-BALL-LIVE-001-charter-v1.md`.

## Actual Nova contribution

Nova recommends a truth-bound living Agentarium with an inspectable evidence journal. Connection health, agent state and project progress must remain separate. `active`, `idle`, `blocked`, `completed` and `unknown/stale` require distinct evidence; silence is not inactivity. iPad operation cannot depend on hover. Replay must never masquerade as current work.

## Actual Sentinel pre-test contribution

Sentinel's verdict is BLOCKED for a live success claim until both real runtime sources and the complete source-to-original route are named. The decisive MVP evidence is a genuine intermediate event that becomes visibly rendered while the same run is independently still active. Correlate one event/run ID at source, bridge, durable acceptance, browser reception, original UI and visible pixels. A DOM update, fixture, static file or terminal event is insufficient. Required robustness later includes reconnect/catch-up, order/duplicates, silence, auth, replay and concurrent providers.

## Actual Scout/RKA findings so far

- Current official ChatGPT hooks documentation must not be confused with availability in this Work Cloud chat. Work Cloud with local access uses managed remote MCP hooks only under admin-managed policy. Work Cloud without local access/personal accounts does not use those Enterprise hooks. Cloud orchestration excludes several local/plugin/environment hook scopes; SessionEnd MCP is unavailable. Official source: `https://learn.chatgpt.com/docs/hooks`.
- Official Enterprise guidance says hooks do not cover every internal subagent path and cloud orchestration events do not reach an existing OTel collector. Source: `https://learn.chatgpt.com/docs/enterprise/cloud-local-access`.
- Newly enabled local access applies only to newly created tasks, not this running chat. Source: `https://learn.chatgpt.com/docs/enterprise/chatgpt-work-overview`.
- Therefore local `hooks.json` is not proof of native observation of this Work chat. A real cooperative child checkpoint can be true activity, but does not prove complete automatic runtime telemetry.
- Claude Code officially supports lifecycle hooks and controlled CLI/SDK streams. Availability is not installation proof; this repository's GitHub Actions host is a controllable source candidate.
- GitHub Pages is static. A local sidecar is not reachable from an iPad by `localhost`; remote runtimes need a reachable relay. iPad background delivery may pause, so honest acceptance is foreground live plus reconnect/catch-up, with background behavior explicitly scoped.

Scout's full source register is still pending; treat these as reported findings requiring traceable citations in the final study.

## Architecture question for Forge

Design a complete, implementable target architecture and a smallest honest prototype path for BOTH sources. Cover:

1. exact source semantics and confidence for ChatGPT Work today, plus the path to stronger automatic coverage;
2. exact Claude Code source integration in the existing Actions/relay host;
3. authenticated ingest, validation/normalization, idempotency, sequencing, storage/retention and provenance;
4. one-way browser subscription, recovery/catch-up and archive export, feeding the existing hooks rather than replacing the original;
5. deployment variants (local sidecar, minimal managed relay, controlled observable runtime), iPad reachability and operational owner;
6. security/privacy, failure modes and monitoring of the observation path;
7. a staged proof plan that reaches the final goal, not just a convenient demo.

State which claims are verified, inferred, proposed or unknown. If the requested two-provider MVP is not currently possible without a material platform/provider decision, name that blocker and propose the smallest decisive experiment. Do not implement.

