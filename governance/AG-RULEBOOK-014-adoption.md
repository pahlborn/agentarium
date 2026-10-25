# AG-RULEBOOK-014 — Integration and adoption evidence

Peter authorized the agreed Rulebook/Process 1.4 package and follow-up edits on 2026-10-25 in the Atlas chat. The original supplied draft and subsequent corrections are the source; Atlas assembled the repository changes. No specialist review or runtime adoption is claimed by this document.

## Change map 1.3 → 1.4

| Previous content | Destination / change |
|---|---|
| Rulebook §§1,10: authority and product ownership | §1; Peter's explicit merge and total-task cost decisions added |
| §2: roles | §2; Lot monitor-only, Peter-started; Forge owns other assigned technical work, including relay |
| §3: truthfulness | §3 preserved; every rule package includes it verbatim |
| §§4,11 and bounded-reading addendum | §4 and Process §§1–3; preserve running safe saves during splitting |
| §§5–6: requirements, review and QA | §§5–6 preserved; risk-proportionate checking in Process §3 |
| §7: learning | §7 and Process §5: five-task review, five event triggers, standing authorization, deduplication |
| §§8–9: continuity, enforcement, skills | §§8–9 and Process §§0,3,Adoption; independent-chat availability check retained |
| §12: monitor handoffs | §10; no historical flights; PR71 permits restoration of open balls without flight |
| Process 1.3 assignment, proof, return, closure, learning, value | Process 1.4 §§1–6; session start added as §0 |
| Full mandatory reads in AGENTS / Forge / Archibald | Assignment-based rule packages; Cadence alone reads both governance documents fully |
| Root CLAUDE.md | Short common instructions; full previous contents retained verbatim below historical header in LOT.md |
| Historical 1.2 and 1.3 files | Supersession notices only; originals retained below notices |

## Scope and limits

No product code, relay implementation, tool permissions, models, effort or maxTurns changed. Forge is technical owner of the later relay checkpoint/preflight change; Atlas may integrate Forge's patch on an isolated branch and CI executes tests. Code author, integrator and test executor must be reported separately.

The shared CLAUDE.md is intentionally the supplied nine-point text with the agreed Cadence exception and without the pointer inviting other roles to read LOT.md. It is not padded or shortened to an arbitrary byte target.

## Adoption checks

- Static integration checks: PASS — all three role frontmatters byte-identical; old CLAUDE.md retained verbatim in LOT.md; historical 1.2/1.3 bodies retained; no active 1.3 reading mandates in the three profiles; routing preserves other roles and historical runtime evidence. Common CLAUDE.md: 2,413 bytes versus 16,858 bytes before.
- Argus independent static review: /root/argus_rulebook14, RA_AGREED / PASS, no actionable findings; candidate bundle SHA256 `8da5f0c033ac8d9f204fc3f7f78053de8d292603e8449f7dc30af7dd72b90462`. Scope excludes remote runtime/behavior verification. This evidence append is subsequent to that reviewed bundle; normative files are unchanged.
- Actual CLAUDE.md loading in the relay: NOT_TESTED; verify on an authorized real invocation, without claiming that repository presence proves loading.
- Running Claude sessions reloaded: NOT_VERIFIED; existing sessions must reload before claiming 1.4 behavior.
- Atlas skill: validation PASS, saved by successful Skills Git push, commit `18397b3`. It checks main before treating 1.4 as integrated; independent-chat availability remains a separate evidence item, not implied by the push.
- Cadence known-case trial, relay abort/continuation proof and Ballbrause effectiveness rerun: NOT_RUN by this governance PR. Their later results must be linked, not inferred from changed text.
- Historical open-PR count is not a current count. PR age/size and branch commit dates must come from a fresh scoped snapshot; indications of mixed concerns require confirmation.
- #46 is already closed in the current open-PR snapshot; this package neither reopens nor merges it. Exact historical closure cause is not re-audited here.
