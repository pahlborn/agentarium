# Measurement environment — finding, 2026-10-17

## What this is
Two things, both small: evidence for a ledger row that was waiting for it, and one
proposed sentence. Nothing here is adopted. Atlas decides what, if anything, changes.

## The rule was not missing
`agentarium-rulebook-v1.2.md` already requires that, before substantial technical
commitment, the critical assumption and the *smallest observable end-to-end proof*
are identified, and that the authorized proof is arranged before architecture,
specification or code expand. `team-learning-ledger-2026-10-16.md` already carries
the row **"Technical path expanded before proof"**, with its evidence of
effectiveness recorded as still outstanding: *"actual critical integration observed
before expansion"*.

On 2026-10-17 the path expanded again before the proof existed — relay machine,
certificate, tunnel and dedicated hardware were all designed and costed, and a
Raspberry Pi was recommended to the customer, before anyone measured the cheapest
route. The claim that a rule is missing would be wrong. The rule is written,
acknowledged and was not followed.

## The outstanding evidence now exists
Question under test: may a browser send an `Authorization` header to
`api.github.com`? On it hung whether continuous live display needs a relay machine
at all.

Measured on the target surface — Safari on the customer's iPad, page served from
the project's own origin, the customer's own fine-grained read-only key:

| | requests per hour |
|---|---|
| without key | 60 |
| with key | 5000 |
| 2-second interval would be | 1800 |

399 ms per request, five serial requests. Consequence: for data already held in
public GitHub comments, no relay machine and no certificate are required.

Related documented fact, relevant to any implementation: *"Making a conditional
request does not count against your primary rate limit if a `304` response is
returned."* With `ETag`/`If-None-Match` the 1800 figure is the worst case, not the
normal one. An `x-poll-interval` response header must be honoured.

## The one thing the rule does not cover
The rulebook says what must be proved and that a visual imitation does not count.
It does not say **where** the proof runs, and it does not treat the proving agent's
own runtime as a candidate source of falsification.

Measured, same question, inside the Claude Code container:

- `GET https://api.github.com/user` with **no** Authorization header returned
  HTTP 200 and real account data. Unauthenticated, that endpoint returns 401.
- The same endpoint with a deliberately invalid Bearer token also returned HTTP 200,
  rate limit 60 — not the expected 401.
- From a browser page in the same container, `access-control-allow-origin` read
  `null`, where GitHub sends `*`.

The session's egress proxy terminates TLS and substitutes GitHub credentials. Every
measurement of GitHub taken inside the container is therefore the proxy's answer,
not GitHub's, and nothing in the result says so. An agent measuring there satisfies
the rule as written and can still report a confident wrong answer.

## Proposed amendment
One sentence, after the existing "A visual imitation cannot prove the real transport
path.":

> A proof runs in the target environment, on the surface the user actually uses. An
> agent's own runtime is not that environment and may alter requests without
> disclosing it; a proof taken there states that limitation and does not settle the
> question until it is re-run outside the agent.

## Evidence
- `probe/index.html` — PR #12, merged, commit `e0b0d4f`
- https://pahlborn.github.io/agentarium/probe/
- The figures above are the customer's own run on his own device with his own key,
  not an agent's claim. Anyone can re-run it.

## Status
Proposed, not adopted. This file changes no rule and no ledger row. The ledger row
"Technical path expanded before proof" remains `changed_candidate`: one observed
instance of the correction working does not make it effective, and it followed a day
in which the same failure recurred.
