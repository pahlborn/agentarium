[AGENTARIUM:AG-PILOT-001-ONE-EVENT:QA:QA_REPORT:PUBLISHED-V1]

## 1. Header

Sentinel, actual collaboration subagent `/root/sentinel_one_real_event_mvp`, using `qa-agent-sentinel` and its QA contract. Task: published-original acceptance of the approved one-event MVP. Primary requirement: one actual Argus runtime-export event read over the real public path and visibly displayed in the ORIGINAL field. Checked 2026-10-17.

Atlas reports Peter approved the exact three-file publication, fast-forwarded main to `d111b062770e32dbef0f9bb618a4923d88ff20be` and deployed via run `39008018867`. Sentinel's acceptance proof below is the independently inspected actual public browser result, not merely that publication report.

Browser QA run: https://github.com/pahlborn/agentarium/actions/runs/39008087174 . Actual URL: `https://pahlborn.github.io/agentarium/feld/?mvp=1`. Environment: fresh Chromium `156.0.8078.4`, software WebGL via SwiftShader, service workers allowed. Native Safari/iPad is not tested. Harness SHA256 `12a9ae115a8d04e182a0a0bc1c873d462df52c9aeaf7aa7c1b70fd31a3ce8c67`.

## 2. Verdict

**PASS for the agreed technical public-original one-event acceptance on the exact artifact in this declared environment.**

The earlier BLOCKED verdict concerned missing publication/surface proof. This new actual public-path proof resolves that particular block; the older report is retained as historical evidence. No claim of automatic runtime collection, ongoing live operation or customer/native-iPad acceptance follows.

## 3. Coverage

One positive actual-public-path case executed. No localhost, rebuilding, network interception, event injection, substitute page or synthetic source used by this harness. Earlier isolated CI2 already covered opt-out, 404 and unknown-kind rejection; those cases were not unnecessarily repeated against production. Safari/iPad, pre-existing cached v46 installs, replay and continued operation remain not tested/out of scope.

## 4. Acceptance matrix

| Criterion | Status | Actual observation |
|---|---|---|
| Original reviewed HTML really loaded | passed | Public URL HTTP 200, Fassung47, exact candidate HTML hash |
| One true event read through actual path | passed | Exactly one public `GET /agentarium/feld/one-event.json`, HTTP 200, exact genuine-source hash |
| Both existing hooks accept true source | passed | `lauf.angenommen:true`; `ereignis.angenommen:true`, exact Argus event ID; no reader error |
| Event visible in original field | passed | Exactly one original `.agAuf` entry with true source title; screenshot personally inspected by Sentinel |
| Rendering environment actually works | passed | Existing WebGL machine present; no page errors |
| Peter's native Safari/iPad | not tested | No access or substituted claim |

## 5. Execution and evidence record

Actual browser report started `2026-10-17T05:57:14.509Z`, finished `05:57:18.029Z`. Observed interval 3.520 s; this is the recorded browser case, not total workflow/model duration. One navigation, no retries or reload. Reported requests:

1. `GET https://pahlborn.github.io/agentarium/feld/?mvp=1` at `05:57:14.516Z`.
2. `GET https://pahlborn.github.io/agentarium/feld/one-event.json` at `05:57:14.723Z`.

Actual HTML response SHA256: `23e8b503e1b623e798bef587f5775b932e44b9561178d58ca1ec3c4a6d3e68d4`, matching the reviewed CI2 candidate. Actual source-response SHA256: `a8ba94c8abc2540300240eb4ebc8229fee8ca2f95f808558096bb6c354c60197`, matching the exact true runtime-export JSON.

Event: `AG-PILOT-RECOVERY-20261017-RA-REVIEW-V1`, actor `argus`, kind `review_result`, recipient `atlas`. The source is the actual completed Argus review exported by Atlas; its title reports failure of an earlier claimed live acceptance. It does not invent success. Harness independently asserted `fictional:false` from the received body.

Observed reader state: `abrufe:1`, `http:200`, accepted project `agentarium`, accepted exact event ID, `fehler:null`. Original visible row:

> argus → ATLAS REVIEW_RESULT
> Argus: FAIL für eine behauptete Live-Abnahme; kein Einwand gegen den präzisierten Ein-Ereignis-Piloten.

Sentinel personally opened the downloaded report and screenshot, then independently computed evidence hashes:

- Report SHA256 `a47bbe983af8da043ccdc40a0b1876faa66cc7274f01c39a133e67bc68a7ecad`.
- Screenshot SHA256 `318e6d75f740778bd91a5eac8c22424e191aa51ec0138f793a0bf0e3de49933a`.

Local evidence directory: `mvp-dispatch/published-original-qa/`, files `report.json` and `published-original.png`. Test harness uses the normal navigation-triggered fetch and read-only observation of product state; it makes no direct hook call.

## 6. Findings

No required MVP criterion failed. Retained MINOR: temporary opt-in diagnostics overlaps the lower-left event list at 1365×900; the central event label is visibly readable, so the agreed display criterion passes. Existing `__agLauf` does not display/store `run_id`; the reader passes it unchanged. Neither is claimed as a delivered feature or silently added acceptance scope.

## 7. Regression and compatibility

Previous exact-patch isolated CI2 four cases passed; current public happy-path uses identical HTML/source bytes. Native Safari/iPad, installed-PWA cache migration and ongoing source updates are untested. No claim of a live collector, SSE/polling, cursor, replay, cross-origin authentication, reducer or service operation.

## 8. Environment integrity

Sentinel authored only isolated QA harness/report files. Atlas executed the authorized CI browser run. The browser read public product resources; normal application SW/cache side effects are possible inside its disposable fresh profile. No product writes, branch mutation, further deployment or paid model calls initiated by Sentinel. Evidence retained for authorized host persistence.

## 9. Evidence limits

Software-WebGL Chromium success is not native-device compatibility or Peter's customer acceptance. Genuine-source provenance is the documented actual Argus handback export; this MVP does not automatically capture future runtime messages. The passing technical scope is precisely one exported real event, actual public same-origin read, original hooks and original visible field.

## 10. Next action

Atlas reports the completed technical MVP and provides the exact original URL to Peter. Peter can inspect it on his iPad; that observation stays separate until actually received. Do not broaden the result into a full live-integration claim. No further test, implementation, publication or paid run is needed for the now-passed scoped technical proof.
