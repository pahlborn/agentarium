# AG-BALL-LIVE-001 — Archibald V3 correction failure evidence

## Verdict

**BLOCKED — model run completed successfully, but the relay rejected and failed to preserve the returned specification. No automatic retry.**

## Exact run

- Task: `AG-BALL-LIVE-001-ARCHIBALD-SPEC-V3-CORRECTION`
- Request commit: `2a7cba6fdf4904b57188e21f775823f7129df470`
- Run: https://github.com/pahlborn/agentarium/actions/runs/39015886222
- Artifact: `archibald-ball-live-spec-correction-output`, ID `12095232123`
- Artifact digest: `sha256:7b016b33090b5abba263a7707fdc8f014168dab77f4c74fbca2a0403799f4d33`
- Session: `c945cf25-8a1c-4d03-8a9b-84730a41bd34`
- Claude CLI: `2.1.302`
- Requested model/effort: `opus/high`
- Actual model: `claude-opus-5-5`
- Actual reasoning: unconfirmed
- Turns: 23
- Runtime: 938.618 s
- Cost: USD 3.6386638
- Product changes: none
- Tests: none
- Publication: none

## Exact failure

The Claude process returned successfully (`returncode: 0`, `execution.kind: SUCCESS`) with a string response of **75,127 characters**. The relay called:

`validate_handback(result, execution, max_chars=70000)`

The validator therefore raised `INVALID_HANDOFF`. The runner wrote metadata and an empty `handback.md`; it did not persist `result.result` before validation. The generated specification cannot be reconstructed from the artifact. Stdout identity: `sha256:c11224a2d14616d046cc70f7dccd05758c84a0656c9e38f5cfce0035a3fc6d7e`, 80,046 bytes.

## Impact

The bounded V3 correction is not available for review and cannot be claimed. Forge remains blocked from implementation against V2. No automatic retry was performed.

## Required relay correction before any authorized retry

1. Persist the raw model result and metadata before validation.
2. Treat an overlong but otherwise valid handback as a preserved review finding, not data loss.
3. Raise or remove the arbitrary 70,000-character cap for this bounded specification, while retaining artifact size and content checks.
4. Validate the preserved result and post only a bounded summary/link if an Issue comment limit applies.
5. Run exactly once only after Peter authorizes the additional paid call.
