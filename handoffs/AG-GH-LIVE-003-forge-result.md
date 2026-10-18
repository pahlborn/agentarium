# AG-GH-LIVE-003 — Forge result (CA_IMPLEMENTED)

Task: AG-GH-LIVE-003-FORGE-FIX-V1 · Author: Forge (coding-agent) · Baseline: the seeded files as read in this session (adapter `AG-GH-LIVE-001-v1.1`, `FASSUNG = '49'`). I have no commit hash.

## Changed paths
- `previews/AG-VISUAL-005-feld/github-live.js` — adapter v1.2
- `previews/AG-VISUAL-005-feld/schicht.py` — only `FASSUNG '49' → '50'` (sets `github-live.js?v=50` to force a cache refresh)
- `tests/AG-GH-LIVE-001-expiry.cjs` — rewritten NodeVM test
- this file

## Fixes
- **F1 warning hidden in folded summary:** the warning now has its own `<span id="agGhWarnung" role="status" aria-live="polite">` inside `<summary>`, displayed as a block that wraps and never gets an ellipsis. Only the status span (`#agGhStatus`) is still shortened with an ellipsis, so a long network error can only shorten the status, not the warning. The warning is no longer added to the status text. The span is hidden when there is no warning. Text is set via textContent.
- **F2 silent 90-day default:** there is no default and nothing is written to storage at startup. A missing, cleared or invalid stored value stays missing after reload; invalid values are left in storage unchanged and not replaced. When the date is missing, the panel text shows a suggestion marked "unbestätigt, nicht gespeichert". The date is only written when the user enters it in the date input. Valid saved dates are kept as they are. Token handling is unchanged: it lives only in page memory (a closure variable).
- **F3 singular:** "1 Tag" in all three texts (days left, days overdue, warning). "läuft heute ab" for 0 days. The warning rule is unchanged: it shows at ≤10 days and not at 11.

Transport, event contract, cost display and the demo/archive UI were not changed.

## Tests
- NodeVM test: **NOT_RUN**. I have no shell. Run with `node tests/AG-GH-LIVE-001-expiry.cjs previews/AG-VISUAL-005-feld/github-live.js`. It checks:
  - no date at start and nothing stored
  - an invalid stored value is not replaced by a default
  - a saved date is kept
  - 11 days → no warning, 10 days → warning
  - 1 day, 0 days and −1 day use the singular
  - a status error leaves the warning intact
  - edit → saved, clear → removed → still missing after reopen
  - the token never appears in storage, `stand()` or panel text
- Browser check at 320/375px and iPad widths: **NOT_RUN**. F1 was a hypothesis, and this layout fix is still unverified. Host/Sentinel needs to confirm on a real browser, including iOS Safari's `<summary>` rendering.
- The Python generator was not rebuilt or run.

## Concerns
1. **Older saved dates:** v1.1 automatically saved a 90-day default. Those values look exactly like dates the user confirmed, so v1.2 keeps them as instructed. A device that ran v1.1 may still show an unconfirmed date. The user should check the date once in the panel. Removing these dates selectively would need a marker that v1.1 never wrote.
2. **Missing date is quiet:** a missing date shows no urgent warning in the summary, by design, so the folded panel doesn't take up more space. After connecting, the "fehlt" hint is only visible inside the expanded panel.
3. **Taller panel:** when a warning shows, the folded panel gets one extra wrapped line at 320px. The browser check should confirm it covers nothing important.

Next owner: Atlas, to arrange a test run (host/Sentinel). No merge or publication.
