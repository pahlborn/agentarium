# AG-GH-LIVE-001 — Forge handback: CA_IMPLEMENTED (tests NOT_RUN)

Task: AG-GH-LIVE-001-FORGE-V1 · Adapter: `AG-GH-LIVE-001-v1` · Page version 47 → **48**
Baselines (host-supplied, not checked by Forge, no shell): product `eb73b5d07c99586cf9d8e2c46f694b2c4dbe9f5b`, generator `61d02292a6bd6c822980f91c36363b6601ecaf6f`.
Code author: Forge. Test executor: **none yet**. Publisher/reviewer: not Forge.

## Architecture judgment
- Direct polling from the page works with the existing Original: `?live=github` → `modusSetzen('live')` (empty live list, no autostart) → loads same-origin `github-live.js` → events go only through `__agLauf` / `__agEreignis`. Demo, archive and `?mvp=1` run on unchanged code paths.
- `progress` is **not** added to `ARTEN`. If it were, demo/archive would show it in the legend and any live mode would accept it. It is accepted only while `ghLive` is set. It shows a line in the list, a label at the actor (ID + provenance) and a short pulse with no deposit (`abgabe 0`). It skips `auftragFertig`, `arbeitAn` and stoppers, so it cannot complete a task or pretend that work is ongoing. It never forwards `verbrauch`/model data.
- All Original `innerHTML` text sinks now use `esc()`: list, actor label, accepted-work label, register, header/sheet, stop reason and model label. The two recorded pieces contain none of `& < > " '`, so their output is visually unchanged.

## Technical points worth challenging
1. **Link header form:** GitHub often sends `/repositories/<id>/issues/2/comments?...` in `Link`, not `/repos/pahlborn/agentarium/...`. A literal "same exact endpoint" check would reject real pagination. My choice: read only the **page number** from `rel="next"`, check host, path form, `per_page=100` and that the page is higher than the current one, then always build the URL from the fixed `ENDPOINT`. The token never goes to a Link-supplied URL.
2. **The baseline cutoff uses the device clock.** CORS does not expose GitHub's `Date` header to the page. Cutoff = device time when connecting. Marked comments seen during bootstrap with `created_at >= cutoff` play after bootstrap, labelled "während Aufbau". Older ones are counted as historical and not played. If the device clock is off, the boundary moves by that amount. The cutoff is shown in the panel.
3. **Page-100 boundary:** a full last page gives 304 forever. So after a 304 or 200 on a full page, the adapter also checks page N+1 (with an ETag, so normally 304). Authorized 304s should not count against the rate limit (GitHub documentation, not verified here).
4. **Version 48:** the service worker serves from cache first, using cache `agentarium-v<FASSUNG>`. Without the bump, an installed iPad could keep showing the v47 index with no adapter loader for a while. "Fassung 48" in the page also shows which build is running. `github-live.js` is precached.
5. **Inputs Forge could not find:** the two episode JSON files are not at any path I guessed, and I cannot list directories. `bauen.py` therefore supports `--stuecke-aus <built page>`, which copies the exact `STUECKE` array (both pieces, original order) from v47 `feld/index.html`, and `--vergleich`. Icon location unknown: `--icons` (e.g. `feld`).

## Changed paths
- `previews/AG-VISUAL-005-feld/schicht.py` — `esc()`, version 48, `FORTSCHRITT`/`herkunftWort`/`pulsAn`, progress branch in `schritt`, `__agEreignis` progress gating, optional `zusatz` for `melden`, `data-ereignis` on list lines (live only), `?live=github` loader + `__agGithubBruecke`, `bauen(..., gebaut=None)`.
- `previews/AG-VISUAL-005-feld/github-live.js` — new adapter.
- `previews/AG-VISUAL-005-feld/pages.py` — `buendel()` function (CLI unchanged). Copies `github-live.js`. Keeps `one-event.json` byte-for-byte: explicit > already in target > next to the source. Adds `github-live.js` to the SW precache.
- `previews/AG-VISUAL-005-feld/bauen.py` — new reproducible build.
- `tests/AG-GH-LIVE-001.cjs` — synthetic Playwright test.
- `resonanz-maschine.html` — **not changed** (the adapter injects its own CSS).
- Built `feld/index.html` — not touched.

## Adapter behaviour (summary)
- **Token:** input `type=password`, not inside a `<form>`. The field is cleared right after it is read. The value is kept in one closure variable only and is sent only to URLs starting with `ENDPOINT`. It is wiped on disconnect, 401 and `pagehide`. `window.__agGithub.stand()` never contains it.
- **Requests:** `cache:'no-cache'`, `credentials:'omit'`, `redirect:'error'`, `no-referrer`. One request at a time, guarded by a generation counter. Interval ≥ 2 s, or longer from `X-Poll-Interval`, `Retry-After` or `X-RateLimit-Reset`. Backoff on network/5xx up to 60 s; 403/404 retry after 60 s.
- **ETags:** one per page URL; a 304 means no data.
- **Hidden tab:** polling pauses. On return it resumes, still respecting any wait time.
- **Validation:** exactly one marker, author exactly `pahlborn`, fenced JSON, an exact allowlist of the 11 fields, all strings, schema, `kind:'progress'`, ID pattern ≤120, known actor, title 1–200 characters with no control/bidi characters, ISO time, `source_evidence` ∈ {`runtime_stream`, `reported_checkpoint`}. `reported_checkpoint` is labelled "gemeldet, kein Laufzeitbeleg". Prose is counted and ignored. Rejections are counted and the last reason is shown.
- **Dedupe:** by comment ID and by event ID (5000-entry FIFO each). Event IDs persist across reconnects. Bootstrap IDs are committed only after a complete bootstrap, so a retried bootstrap cannot lose events.
- **Panel:** compact, top centre, collapses to one line after connecting. Labels, `role=status`, `aria-live`. All text set via `textContent`.

## Commands (NOT_RUN by Forge)
```
python3 previews/AG-VISUAL-005-feld/bauen.py /tmp/ag-gh-live \
  --stuecke-aus feld/index.html --vergleich feld/index.html \
  --gebaut 2026-10-17T12:00Z --icons feld --one-event feld/one-event.json
node tests/AG-GH-LIVE-001.cjs /tmp/ag-gh-live
```
(or `--stueck <V1.json> --stueck <V2.json>` if the episode files are available). Running the build twice with the same `--gebaut` should give identical output (`diff -r`).

Test coverage (all **SYNTHETIC**, `page.route` fixtures, fake token):
- Demo/archive: unchanged, no GitHub request, two pieces in order, version 48.
- Live: switched with no autostart; 140-comment baseline across two pages via a `/repositories/` Link; 10 historical events not played; one event arriving during bootstrap is played and labelled.
- Request details: headers, `no-cache`/`omit`.
- New event rendered through the Original with no reload, with ID and provenance label; no task opened or completed.
- Duplicate not replayed; 304 with no replay; If-None-Match sent; no overlapping requests; ≥ 1.8 s spacing.
- Comment 201 on new page 3.
- Unsafe author, unsupported kind and extra `verbrauch` field rejected; `<img onerror>` title shown as text; `reported_checkpoint` labelled.
- Hidden-tab pause and catch-up.
- No token in storage/IndexedDB/DOM/URL/console, and sent only to api.github.com.
- 401 visible, token cleared, polling stops.

Results: **NOT_RUN**. Python/JS syntax not checked by any tool.

## Risks and limits
- The real CORS preflight for `Authorization` + `If-None-Match` is assumed from GitHub behaviour, not observed.
- WebGL in headless Chromium (SwiftShader flags) may not work in the executor's environment; the first check reports this.
- Panel position on phones may sit close to the header (the iPad is the pilot target).
- Edited comments are not re-evaluated (dedupe by comment ID).
- Costs stay unavailable. The user picks the token expiry; nothing is hardcoded.
- `liveListe` in the Original is unbounded (existing behaviour).

## Next
Atlas: arrange an authorized test executor to run the build and the test, and a review (Argus/Sentinel). Then a separate **real** pilot: Peter opens `?live=github` on the iPad, enters his own reader token (never shared), and a real structured comment is posted to issue #2. That pilot is the only live evidence. No merge or publication is part of this task.
