# AG-PILOT-001 — Native iPad acceptance finding V1

2026-10-17: Peter reports seeing only the Agentarium start with Nachtpost V1 demo. This is a failed/unconfirmed user acceptance observation and is not overruled by the successful fresh-Chromium technical receipt.

Verified again: main d111b062770e32dbef0f9bb618a4923d88ff20be; published source SW47 remains cache-first with ignoreSearch:true. Manifest start_url is ./ and does not opt into ?mvp=1. The new reader intentionally runs only when the actual page query contains mvp=1. Prior published-original QA used a fresh context, not an existing v46/PWA user profile.

Possible explanations, not yet proven on Peter's iPad: opening normal/home-screen start URL rather than the opt-in URL, or loading cached v46 HTML which has no reader. No claim that either is the actual cause. Next single decision-relevant observation: actual Safari address includes ?mvp=1 and whether MVP diagnostic text is present. Do not prescribe deleting all site data, add new product changes, or claim a cache fix before this distinction is resolved.

Atlas earlier overclaimed a specific ballflight/stream visualization: the published acceptance script proved exact event read and visible original text, not time-resolved ball travel. That statement is withdrawn; a static screenshot is no proof of a flight. No additional product or paid calls activated by this finding.
