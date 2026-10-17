# AG-PILOT-002 — Ten newly occurring team events in the open original monitor V1

Peter authorized 10 events, clarified 2026-10-17 08:08:19 Europe/Berlin: work starts independently of opening Agentarium. The already open monitor receives information about work happening now, in near real time. Opening must not trigger agent work. Ten stored historical items played on load are NOT acceptance.

## Outcome and bounded acceptance

After a new reader is actually loaded once and its connection is verified, perform a useful bounded real team task independently of the monitor. Capture exactly ten actual relevant request/assignment/question/answer/review/test/result events, preserving source identity and observation times. Do not add agent calls, invented objections, synthetic events or artificial replay delays to reach ten.

The SAME OPEN TAB must receive and show each subsequently captured event without further reload. Preserve stable IDs, do not duplicate counts on reread. Show actual coverage, connection problems and stale/no-data honestly. Measure capture/export, source availability, browser receive and render separately; do not call commit publication delay model work or omit it. Proposed engineering target for this proof: <=5 seconds from source availability to visible browser acceptance; end-to-end runtime-to-render delay must also be reported and is not yet measured/guaranteed. If this cannot carry, return a technical blocker/alternative before coding rather than relabelling 90-second intervals near-real-time.

The current Fassung47 one-shot client cannot gain a recurring reader simply by changing JSON. One initial client/version switch will be necessary, then no reload during the actual ten-event experiment. Do not claim that leaving today's old page open is sufficient.

## Architecture/implementation judgment before commitment

Forge must inspect the original current source and judge feasibility. No new central server, secrets in browser, grants/permissions, background daemon or material infrastructure activation within this task without Peter's decision. A bounded read of an explicitly allowlisted PUBLIC repository data source is a candidate, not Atlas's chosen architecture. Evaluate data-read path distinct from GitHubPages deploy path. Current Pages publication can take up to10minutes (official docs), so per-event Pages builds are not a valid seconds-live path. Public GitHubREST has CORS but unauth60requests/hour per client IP; conditional304 is not unconditionally free. Respect limits and show exhaustion; no authentication workaround.

Scout /root/scout_ten_events_transport supplied official sources: docs.github.com/en/rest/repos/contents, /en/rest/using-the-rest-api/using-cors-and-jsonp-to-make-cross-origin-requests, /en/rest/using-the-rest-api/rate-limits-for-the-rest-api, /en/rest/using-the-rest-api/best-practices-for-using-the-rest-api; MDN Request/cache and Cache/match. Scout suggested90second polling for economy; Atlas rejects it as not meeting Peter's near-live aim. Keep this substantive difference, not a fake consensus.

## Authority and reporting

Actual public original currently main d111b062770e32dbef0f9bb618a4923d88ff20be. Development source47 retained at source branch headc415525aae750b4a9a5da983f63248c257ac5ba2 (schicht blob3ff04f633b384144f1ca8ec79f45c45690e88add). Source includes existing single-event reader and current governance/profile; no rebuild of a lookalike. Existing approved MVP and historical tests stay separate.

No new product publication or merge authorized by this preparatory record. Atlas routes Forge a real bounded architecture/machability question first and retains its judgment. If a viable no-new-infrastructure route exists, implementation can proceed within Peter's approved 10-event scope with independent review/QA; material alternative goes to Peter. Cost checkpoints, not blanket small turn/budget caps. Ask Peter concrete continuation question at stage conclusion.
