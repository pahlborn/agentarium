# Bounded team-review transport repair — prepared, not activated

Cause verified 2026-10-16: repository is public while both the workflow job and script require private status. The script also pins the old task, source commit, packet path, result destination and branch. Removing only the workflow condition cannot deliver the requested new task.

This candidate extends the runner for exactly AG-REVIEW-20261016-TEAM, retaining the legacy path unchanged. New execution checks repository identity/owner, owner actor, exact branch, push event, explicit authorization marker, pinned definitions, source and task-specific packets. Comment history is paginated for replay protection. Three separate role invocations remain read-only, one turn/no retry, with the existing individual caps (Archibald 0.20, Forge 0.12, Cadence 0.25 USD; combined model caps 0.57 USD). These are limits, not predicted actual cost or a guarantee including runner charges. Source packets distinguish host-reported evidence from independently read originals; no personal memories or past involvement may be invented.

Workflow fires only when a separately authorized activation file is committed on the exact repair branch. That activation file is deliberately absent. Draft publication, unrelated commits and source preparation do not start it. No new recurring timer or changes to the other workflows.

Pending: owner authorization for the one-shot paid execution; then Atlas can publish the activation marker with the connected GitHub writer. That is a separate action from creating this reviewable repair. A real run/result must be checked before claiming receipt, worker start or success. No full connectivity claim follows from offline tests. No merge or production deployment is needed to use this isolated activation branch.

Offline checks: 7/7 pass, no network, no secret, no publication/model call. Public new-task preflight reaches the missing-key boundary; wrong owner/actor/event/branch, replay and legacy public mode reject. Python compiles; workflow YAML parses. Runtime tests remain pending. The standalone test uses mocks and cannot establish GitHub dispatch or Claude availability.
