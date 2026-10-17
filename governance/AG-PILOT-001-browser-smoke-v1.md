# AG-PILOT-001 — Browser smoke V1

Date: 2026-10-16. Owner: Atlas. Result: **BLOCKED AT BROWSER BOUNDARY / LOCAL BUILD AND HTTP PASSED**.

## Exact target

- Unmerged working commit: `800874ee1c6fd2ed3a806ba7774a19c2e11f3878`
- Field generator Git blob: `05c06aa80f817be781bfb50afd44827510bd1c93`
- Activity adapter Git blob: `02cb3f04641718a090b5e3fad434d8f3ead69211`
- Actual V3 observation source SHA256: `dd1a1344258397804cae761c91f95d6c7b886ae323a319ed211e44ee38706c59`

## Passed locally

The exact verified generator built `agentarium-field-v3.html` successfully from the existing field template and Nachtpost V2 fixture.

- Built size:282618 characters returned by `bauen`;284636 bytes on disk.
- Built HTML SHA256: `a9b90ff94daa09b289f719a081c7407b5169a48775e43b7b0a61dff46ff0eeb9`.
- Embedded adapter and exact cost fallback were present.
- Local loopback server returned `GET /field?activity=1` as HTTP200, `text/html; charset=utf-8`, content length284636, `Cache-Control:no-store`; response body hash matched the built file.
- `GET /activity` returned `mode=LIVE`, `data_kind=OBSERVED`, no source errors, and Forge session `065336d2-8af6-40c4-8a55-7135c70441f5` / task V3 as `stopped`, outcome `success`, problem false.
- Test server was stopped after the check.

The existing pre-change SyntaxWarning at schicht.py:2629 (embedded regex escape) appeared during build; it is outside the adapter change and did not stop the build.

## Browser attempt

Available browser inventory contained only the remote cloud Chrome/CDP browser. It could not connect to the execution host's `http://127.0.0.1:43989/field?activity=1` and returned `ERR_CONNECTION_REFUSED`. A direct `file://` attempt was rejected by the browser URL security policy; this policy explicitly forbids workaround or indirect execution. No alternate user-device/Opera browser was available in this runtime.

Therefore DOM, actual layout, marker/pulse appearance, accessibility interaction, responsive sizes and browser consumption of `/activity` remain **NOT_TESTED**. Static/Node QA from Sentinel remains PASS_WITH_LIMITS; this record does not upgrade it to browser PASS.

## Required next decision

Either:

1. run the exact commit locally on the viewer machine (recommended; preserves local-only architecture), or
2. separately authorize a temporary reachable test deployment, which would expand scope and exposure.

No deployment, merge, release, public test endpoint, browser installation or paid model call was performed for this smoke attempt.
