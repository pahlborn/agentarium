# Agentarium Process 1.4

Status: Integration candidate approved for preparation by Peter, 2026-10-25; runtime adoption remains to be verified. Supersedes Process 1.3 when integrated; its content is preserved. Principles are in `agentarium-rulebook-v1.4.md`. This file says **what to do at which moment**. It grants no publication, permission expansion, infrastructure activation or paid call. Section 7 (checks by moment) added by Peter's decision on 2026-10-30 after review in #103.

### Who does the work
For a small, low-risk task, Atlas or the addressed role works directly. A task is small when it changes nothing on Peter's device, needs no merge and needs no second role.

For a technical task, appoint one qualified **technical owner** for inspection of the existing system, technical choice, implementation and own tests. Lot owns the monitor while his role lasts and works only when Peter starts him; Forge owns other assigned architecture and development, including the relay. Do not prescribe a second implementation or rename Lot as Forge. Atlas owns value, priority, coordination and closure.

Use **one independent checker** for the decisive risk when independence is needed: Sentinel for executable behavior, Argus for assumptions, design and evidence. Add Scout for a consequential factual gap, Nova for a material experience question, Archibald for material ambiguity — each only for a named gap. Keep required safety checks. No full specification, universal QA ceremony or team vote on a routine change. Everyone may challenge the plan; not every role joins every task.

### 0. At the start of every Atlas session
Atlas has no background execution; the session start is the moment his duties actually fire. Before new work, Atlas:
1. Names the loaded Rulebook and Process version (commit).
2. Reads new events on Issue #2 since his last session and open replies on PRs of his tasks.
3. States for each open task the next action and owner, or why it is blocked.
4. Takes up a Cadence report that arrived since the last session, and starts a due Cadence run (§5).

Persist the last read Issue #2 comment ID/time and the Cadence closure count in the “Atlas session state” section of `handoffs/AG-LM-WORK-REGISTER-v1.md`. Advance the cursor only through actually inspected events; do not silently skip gaps. An unestablished count remains unknown until reconciled, never assumed zero.

Four short lines are enough when nothing is open.

### 1. At assignment
Before reporting the first event of a new task, Atlas checks the last commit of `handoffs/AG-EVENT-JOURNAL-001-anstoss-v1.md`; if it is newer than the commit recorded in the “Atlas session state”, he rereads the file and records the new commit there (Peter, 2026-10-26: rule changes reach every Atlas session without being relayed).
Atlas reads the current original task, implementation state and outstanding replies. The technical owner confirms what exists, the exact missing connection and the cheapest valid proof of the critical assumption before expanding.

**Task record** — one, compact, reusing the existing issue/PR: outcome; exact baseline; technical owner; scope and authority; decisive acceptance evidence and environment; exclusions; bounded read list (exact files/versions or comment IDs, line ranges where practical); next action and owner. Unknowns stay explicit. A small fix fits in a few lines and needs no new Epic, story set or specification. Requirements cover applicable normal, failure and recovery behavior. New material scope returns to Peter.

**Cost:** Atlas estimates the task from comparable earlier runs. Below 5 USD the approval of the task covers its runs; at 5 USD or more Atlas requests approval before dispatch (Rulebook §1).

**Rule package:** include the three to five applicable rules in full text, Rulebook §3 in full, a reference to the applicable role profile and the exact Rulebook/Process version. Do not substitute a link to the whole work for these excerpts. Atlas works from this Process card; Cadence reads Rulebook and Process in full. Other roles load the full documents only when assigned. Technical contracts are loaded only as needed. For monitor tasks include iPad, portrait and landscape, operation without hover and any affected previously accepted values.

**Reading:** link earlier results instead of repeating transcripts; do not require rereading a growing branch or conversation. A necessary extra read is named narrowly before the read list grows. Avoid unrelated CI reruns; repeat checks only for changed behavior or an unresolved failure.

**Dispatch:** start each role as soon as its actual inputs exist, not in fixed rounds. Before dispatch, verify the receiving channel and that the input package contains the files the run requires. A subscribed PR, a worker call or a bridge receipt is evidence for its own context only. Report the transfer in the monitor (Rulebook §10) before the worker starts. Host receipt is not worker start. Workers report their own transitions as they happen, not in a final summary; a host attests only what it observed, with provenance. Read-only roles return only.

### 2. Prove the critical path early
For cross-system work, exercise one real source-to-product path before expanding status types, architecture or decoration. For Agentarium live work this means a real event reaching the intended consumer with the claimed visible effect. A queue counter or synthetic fixture is not a rendered or device result. State what the chosen environment can prove and what stays blocked.

When testability is a material risk, the independent checker defines the smallest decisive normal, failure and recovery checks early. A test must distinguish the feared failure from success; look at a counterexample or pre-fix behavior when feasible. No destructive production experiments. Reuse a proven browser runner instead of treating a missing local executable as absence of any test route.

### 3. On each material handback or blocker
Handbacks state result/head, decisive checks and limits, concisely. Atlas checks the exact result and independent evidence, reconciles remaining criteria and assigns the next permitted action in the same session — without waiting for Peter to repeat an instruction. Reuse the task/finding ID; keep dissent and failed history. Fix the issue and affected regressions, not the whole earlier pipeline.

**Depth of checking follows risk.** For a small, low-risk task Atlas checks the result and the agreed acceptance checks. Provenance checks — hashes, run metadata, evidence tables — are for tasks where an error is costly. For relay or security changes, safety limits and the binding of result, session and task always remain to be checked.

**Limits and continuation.** A run limit is an emergency brake set well above the estimate, not a steering tool; tasks are steered by their cut. Workers save checkpoints regularly in their handback where their permissions allow it; for read-only roles the relay captures checkpoints from run output without granting write access; a hard abort may still lose the last unsaved part, so "nothing is lost" is the aim, not a guarantee. Consumption is kept as far as it was delivered; missing values are `unknown`, never zero. After an abort, Atlas continues the task from the last verified checkpoint instead of starting over; safety checks remain. The 5 USD threshold counts across all attempts of a task; repeated aborts never trigger unlimited automatic follow-up runs. Resuming the same model session is examined only after checkpoint continuation is proven. *Applies once the relay supports checkpoints; until then an abort is reported as BLOCKED with the loss stated.*

**New input during a running task** — from Peter or any role — is checked by Atlas as Product Owner, every time, before anyone acts on it: does it fit the outcome of the current build? Fits: it joins the task. Does not fit: it goes into the backlog as a new task with its own ID, ordered by Atlas; its branch starts only when it is its turn. Atlas answers the sender in one line with the decision and the reason, e.g. "fits AG-…, included" or "backlog AG-…, after AG-…, because …". No reply means no check took place. Peter may raise anything at any time; keeping the cut is Atlas's job. Cadence looks at these decisions in her review run.

An unreceived assignment stays unreceived. Inspect the actual run/channel once before retrying; no busy-polling, no duplicate spawn. Continue unrelated safe work; keep an indispensable missing input blocked. Name a real execution or permission limit instead of hiding it behind a plan.

### 4. Before saying complete
Atlas reconciles outcome, result, required checks, open findings and applicable customer acceptance. Required failure → FAIL; required proof unavailable → BLOCKED. Acceptance is scoped to the exact artifact and environment; component PASS is not product PASS. Test evidence, accepted work, merge and publication are separate.

Integrate and verify an authorized governance or skill change; do not leave it as a draft only because a later effectiveness check is pending. Product integration and publication follow their own authority. Report result, limits and remaining owner/action. Promise no unattended follow-up unless an authorized trigger exists.

Close with one question: was there a process problem worth reporting? If yes, record it as a finding (§5); if no, nothing more. Count the closed task toward Cadence's review run (§5).

### 5. Learning — Cadence's triggers
Every member reports material process failures or repeatable improvements with original evidence. Atlas evaluates them at handback, blocker and closure — not only when Peter complains. A finding records: evidence; smallest correction; owner; status; next review event; effectiveness evidence. A deferred finding has a reason and a concrete next review event.

**Cadence runs on fixed triggers** through the relay (`process-agent`):
- **Review run after every fifth closed task** (accepted or aborted) since Cadence's last review run: reads the findings, ledger and task records of those tasks; checks a timestamped snapshot supplied by Atlas because the relay worker has no GitHub access (open PR numbers, titles, creation times/age, additions/deletions/changed-file counts and first description lines; branch names and head commits, with commit dates labelled as commit dates rather than branch creation dates). Age and size are facts; multiple concerns or questions without owner are only indications requiring confirmation from narrowly supplied originals; checks the effect of earlier corrections; compares value with friction (§6); returns at most three corrections or no-change. Atlas counts at closure (§4) and checks the count at session start (§0). Five is the starting value; Cadence may propose another.
- **Event run**, as soon as one of these occurs: second rework on the same task · Peter had to remind or carry a message · a reported rule conflict · a blocker older than one working day · a delivery PR open longer than two working days. The last trigger does not depend on closures: work that drifts and never closes would otherwise never reach the review run.

A working day is Monday through Friday in Europe/Berlin. Each finding triggers once; it triggers again only after a status change or when an agreed correction becomes due. Atlas records the finding/trigger key and review reference to avoid duplicate runs.

Peter has given a standing authorization for these relay runs (2026-10-23). Atlas starts them when a trigger occurs; no further approval is needed.

Cadence's report is the relay handback file. Atlas takes it up at the next session start (§0), decides small matters within his authority and brings material ones to Peter. Cadence challenges Atlas as well as the team. Applying Rulebook §7: not every event becomes a rule; an unapplied rule is fixed in application, not in text. Never simulate Cadence with another model; no permanent poller; no universal gate. Wording alone is not verified_effective.

### 6. Value and friction
After a bounded delivery — and in Cadence's review run — assess useful outcome and quality together with observed elapsed time, avoidable handoffs and questions, corrective iterations and Peter's required interventions. Use existing records only; no extra telemetry or model calls for bookkeeping. Unrecorded values stay unknown. Do not claim savings against an unmeasured baseline.

### 7. Checks by moment — Peter, 2026-10-30 (#103)
Adopted from Sentinel's proposal in #103 (reviewed with Atlas). The change type sets a default, not an exclusion; risk decides.

- **At assignment:** Atlas and the technical owner choose checks and environment by the risk of the change. For a decisive risk, involve Sentinel early for behavior or Argus for assumptions, design and evidence, and settle the smallest normal, failure and recovery cases before implementation.
- **Before merge:** The author supplies own checks and, for a new or materially changed test, a meaningful counter-check: the relevant assertion fails on the targeted fault, the earlier faulty state or an independent counterexample; a setup crash does not count; record mutation, commit, command and expected/actual signal, or state why it is not feasible. Atlas checks version-bound CI and, where needed, independent evidence; additional runs only for a named gap. A CI run is reproducible but does not make the author's test design independent.
- **After merge:** Confirm separately the full run on `main`, the actual publication and its source record. Device checks follow the affected iPad/Safari capabilities (display and interaction: portrait, landscape, without hover; cache, offline, service worker, connection, suspend/resume where touched) and record version and environment. Peter decides customer acceptance.
- **On failure or missing required evidence:** FAIL or BLOCKED with owner and next action. After correction repeat the affected check and relevant regression; keep the failure history. Never bypass the publication gate by hand.
- **At closure or a Cadence trigger:** evaluate existing evidence for duration, unstable red and unnecessary double checks. No automatic extra test series.

Reference, not rule: `governance/teststrategie.md` (stages, defaults per change type, core set, counter-check conventions, runtime guide).

### Adoption
Active task authority and safety limits take precedence. Running sessions must reload changed definitions; a commit does not reload a worker. A clean-context dry run tests decision behavior only; a later real task tests effectiveness. Claude tools, model and effort limits are unchanged by this file.

### Temporary
#46 was to be transferred as tasks 46-1 … 46-10 per Peter's Zuarbeit and closed without merge in 46-10. This historical instruction authorizes no reopening or merge; verify the actual current closure record before acting.
