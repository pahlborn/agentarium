**CA_IMPLEMENTED (not tested)**: AG-BALL-LIVE-001-FORGE-ORIGINAL-C2-V1, version 1. I fixed all three defects on the existing c1 candidate without rebuilding it. Tests have not been run, because I have no shell; nothing here is a PASS.

**Baseline:** c7a8da04d9b06d83edcd110f210c0cf84d4aa8ba, as given in the packet. I could not check which commit is actually checked out (workspace `/tmp/forge-ball-live-original-c2-cndh6hfj`).

**Changed files:** `feld/index.html`, `feld/live.js`, `tests/AG-BALL-LIVE-001-local-live.cjs`. No other files.

**Who did what:** I wrote the code. Nobody has run the tests, nothing is published, and nobody has reviewed it.

## One thing I changed from the packet: two version markers
The page and `live.js` are now marked `AG-BALL-LIVE-001-c2`. But `live.js` used to refuse to connect unless the server's opening message (`hello`) reported that same version. The server (`pilot/AG-BALL-LIVE-001/local_server.py`) isn't one of my allowed files and isn't in this workspace. Changing only the page marker would therefore have broken every connection.

So `live.js` now checks two things separately:
- **Page vs. `live.js`:** both must say c2. If they differ it still refuses to start, as required.
- **Server:** must report `AG-BALL-LIVE-001-c1`, a new constant `SERVER_VERSION`.

The test's `ready_json` check now compares against `SERVER_VERSION`. **Assumption:** the server still reports c1. I took this from the c1 test, which asserted it. I could not read the server to confirm.

## How each defect was fixed
**AG-BL-UI-01 (status covered the list):** The fixed panel in the bottom-left corner is gone. The status now sits in the normal layout of the existing top-right column (`#agRechts`), just under the header.
- It is a collapsible section (`<details id="agBallLive">`). The always-visible line reads "Live · state · Cursor N" (plus "· Lücke" if events were lost) and "Letztes Arbeitssignal: actor · vor N s".
- Tapping it opens the full detail: version, transport, event ID, title, provenance (marked synthetic where it is), gaps, a note that silence means "no current activity observed — not idle, not finished; connection and cursor are not proof of work", and any refusal reason. The detail is capped at 38% of screen height and scrolls.
- The fallback message shown when `live.js` can't load also moved into that column. All text still goes in via `textContent`.

**AG-BL-UI-02 (no visible impulse):**
- I added a function `arbeitsImpuls(E)` to `index.html`. It is called only from the Original's existing progress-event branch, i.e. after `live.js` has validated and de-duplicated the event and the Original has accepted it.
- Each call places one short glow at the actor's actual name label, measured on screen after the Original has shifted it into place. Each name label now carries a `data-ag` attribute so it can be found. If no label is found, it falls back to the actor's home position.
- The glow lasts 1.4 s, ends fully transparent and removes itself. A timer removes it anyway after 1.8 s if the end-of-animation signal never arrives. It never loops, never adds a "working" class and doesn't touch the Original's work, completion or stop state.
- For QA, `window.__agImpulse` exposes `{dauer_ms, grenze_ms, log[], aktiv()}`, with start and end times per event. This shows the glow happened and when; it says nothing about where the event really came from.

**AG-BL-UI-03 (cursor stuck at 0):** One function, `anzeigen()`, now writes every visible cursor value — the summary line, the transport line and a `data-cursor` attribute — always from the same stored cursor. It runs after `hello`, after every `ag` event (straight after the cursor advances, even if the event is then rejected or a duplicate), on gaps, on every state change, and once a second to keep the signal age current. The status texts no longer build their own cursor strings.

Everything else is unchanged: `?ball_live=1` opt-in, no demo autostart, same-origin SSE, the existing hooks, validation, escaping, de-duplication, reconnect and gap handling, service-worker bypass, and normal Original and demo behaviour.

## Test changes
All 57 previous checks are kept. Two were adjusted:
- `ready_json` now compares against `SERVER_VERSION` (see above).
- Before `panel_visible_id_title` reads the panel text, the test now opens the detail by clicking it, not via the console.

New checks:
- `cursor_display_boot_consistent`
- `actor_name_anchor_present`
- `cursor_visible_advances_to_1`: the event gets sequence 1 and every visible cursor shows 1.
- `impulse_once_at_actor`
- `impulse_decays_bounded`: gone within 1800 ms + 300 ms timer slack, with nothing left on screen.
- `impulse_no_persistent_busy`
- `replay_no_double_impulse`
- `no_overlap_390x844`, `no_overlap_1024x1366`, `no_overlap_1280x800`: open and closed, the status must not be fixed-position, must sit in `#agRechts`, must be on screen, and must not intersect `#agEcke`, any list row or any ring name. Each saves a screenshot `c2-layout-WxH.png`.

## Risks
1. **Server version:** if the server doesn't actually report c1, `live.js` refuses to connect. Either change the server (needs separate authorisation) or update the constant.
2. **Layout:** a taller top-right column could shift other Original elements if something measures that column's height; I didn't check. The detail could reach the progress block at the bottom right on small phones, but only when someone opens it. Whether ring names stay clear of the right column comes from the Original's own comments; the new overlap checks will show it.
3. **Blending:** the glow uses screen blending over the field; on some GPUs it may look weaker or different.
4. **Hidden tabs:** while the tab is hidden, animation frames stop and events queue up, so several glows may fire together when it becomes visible again. That's still one per event.
5. **Possible false failure:** `impulse_no_persistent_busy` compares the forge name's `arbeitet` class before and after. It would fail wrongly if the Original sets that class for its own reasons in between.
6. **Unchecked scope:** I assumed `hex`, `heimat` and `nachName` are reachable from where I put `arbeitsImpuls`, because the neighbouring function `stromZeile` uses them; I couldn't search to confirm. The glow layer is also not included in the brightness slider's filter.

This is a local candidate only; nothing is hosted, deployed or claimed for iPad.

**Next owner:** Atlas, to arrange an authorised test run of `node tests/AG-BALL-LIVE-001-local-live.cjs` and confirm the server reports c1. After that, review by someone other than me.