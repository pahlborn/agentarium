# AG-PILOT-001 — Source and field integration, actual status V1

Date: 2026-10-16. Owner: Atlas. Overall: **INCOMPLETE / continuation blocked before execution**.

## Implemented and independently checked

- Source capture task AG-PILOT-001-SOURCE-HOOK-V1: actual Forge session bf2aa07d-a3cb-44f7-9d5e-9b032fa733fa; model claude-sonnet-5-5, reasoning unconfirmed. [Run](https://github.com/pahlborn/agentarium/actions/runs/38905283794), [terminal result](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6216191294). Accepted working commit 9ef5262d2a61dfaf4a3d29d9af0b49bfabb72f24. Sentinel source component PASS: stream9/9, CLI8/8, new capture8/8. No source QA model calls.
- Field task V1 actual session b7b2bb73-1510-49b8-9016-560fa910c2a6; model claude-sonnet-5-5, reasoning unconfirmed. [Run](https://github.com/pahlborn/agentarium/actions/runs/38906425847), [terminal metadata and patch](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6216323172).
- V1 handback is **CA_QUESTION, partial**, despite CLI SUCCESS and workflow success. Only README and local_transport.py changed. The field adapter and generator hook are absent. Success of a process does not mean completion of its task.
- Optional local /field route verified independently by real agent /root/sentinel_field_adapter with qa-agent-sentinel. Exact QA input patch SHA256 3e40b5b245e8eb01d4c9e47a2b491b3a0cfd5e8ac68de5db7852ef7522979e33. Transport18/18, activity14/14, route+actual evidence16/16; py_compile passed. Default404; explicitly selected HTML served exactly; no arbitrary route or query-controlled file; loopback127.0.0.1; no CORS; no-store; missing-file errors checked.
- This accepted **partial component** is preserved on feature/ag-interface-k3-final at 2b9c7150c20284103f00786dcaf34d0f2dc0f89b. No merge, release or deployment.

## Actual source-to-HTTP evidence

The V1 coding job was instrumented with the accepted recorder. It captured its own real metadata during work, without an additional paid test. Capture SHA256 887bf5f0c46851410d80c2630eed819425c2b20e96ae2bdbaf9090f7b35a75b2. All15 observations match the task/session above. Local HTTP witness:15 requests, zero errors, working_observed during actual execution, then stopped(success). Other7 agents remain unknown. The technical task snapshot used for this probe was explicitly synthetic; it is not project-progress evidence. Activity diagnostics are actual observations.

Archived metadata-only records:
- relay/events/AG-PILOT-001-field-v1-activity-observed.json
- relay/events/AG-PILOT-001-field-v1-http-witness.json

This proves CLI → capture JSON → local HTTP. It does **not** prove a browser received or rendered it, remote delivery, full team coverage, or persistent production history. The90s freshness window is test configuration, not an end-to-end latency promise. Process success never sets task Done.

## Why the field is still incomplete

Forge reported only Read/Edit available although the host requested Read/Glob/Grep/Edit/Write. This reported effective tool limitation is not independently proven by a tool inventory; configured permissions and actual available tools must not be conflated. Forge declined to create activity-input.js or edit the large generator without search. No credit exhaustion was reported.

Atlas prepared V2 to reuse all V1 edits, preseed an empty adapter file, explicitly authorize Edit with empty old_string, and provide exact Read offset/limit anchors. Existing role/model/permissions remain unchanged; no paid availability test or automatic rerun.

## Current concrete blocker

V2 dispatch 7a9b442a18fe06ef2c161e40ed8bea87c7e7a4ef reached GitHub Actions: [run38913485148](https://github.com/pahlborn/agentarium/actions/runs/38913485148).
Job forge concluded **skipped**, with no steps and no Claude invocation.

At verification GitHub GET /repos/pahlborn/agentarium reported private=false and visibility=public. The existing workflow requires github.event.repository.private == true; the wrapper independently requires private=true. Atlas has not changed visibility or bypassed this guard. Peter's stated repository context was private. A visibility/relay decision is required before starting another paid worker under changed exposure conditions.

## Independent Sentinel report and reproducibility

[AGENTARIUM:AG-PILOT-001-FIELD-ADAPTER-V1:QA:QA_REPORT:V1]
Verdict: PASS for delivered partial component; whole field integration INCOMPLETE.
Linux, Python3.12.14; own isolated copy sentinel-field-v1-qa.
Executed git apply --check; git apply; python3 sentinel_runtime_probe.py; python3 sentinel_activity_probe.py; python3 sentinel_field_route_probe.py; py_compile. All passed. No product fixes, external writes, paid calls or browser installation by QA. Test server processes terminated.
Additional probe SHA256 5223bd6c35c4e21808a76061a6d172970ec36e38a36275739dcf079440702ac7.
Original output artifact [12047683822](https://github.com/pahlborn/agentarium/actions/runs/38906425847/artifacts/12047683822), retention14days; not a permanent archive.
Browser/GPU/DOM: NOT_TESTED. Missing adapter: NOT_DELIVERED.

## Cost and remaining work

Source call0.3067842USD; partial field call0.0912758USD; these two reported Claude calls total0.3980600USD. Provider terminal usage, not invoice reconciled or project total. Thinking is a subset of output, not added again. V2 skipped before a model call; no provider usage returned. ChatGPT/GitHub and older coverage remain incomplete.

Product cost field stays visible with exactly **Kosten nicht vollständig ermittelbar.** No monetary total or partial amount in Agentarium UI.

After resolving the privacy guard: Forge completes the existing-field activity adapter and minimal generator hook on pinned current visual blob65dd50c836c306f971cfdbbe794d0994c0ba12a6, preserving design and demo/archive. Sentinel then checks the exact delivery, including freshness expiry, mode cleanup, session provenance, no fabricated work/done/flights. Browser reception remains a separate required proof. The whole pilot is not declared ready.
