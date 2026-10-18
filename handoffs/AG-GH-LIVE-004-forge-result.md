# AG-GH-LIVE-004-FORGE-V1 — CA_IMPLEMENTED (Forge / coding-agent)

Product baseline `caebbbebd4b0a5a3c04bab97c0441ccb67f0b5fc` · generator baseline `c40b4cb5155b62bc31d0bb35a9d2ceb023530b17` (I took these from the packet. I could not check them because I have no shell.)

## Architecture judgment
- **Critical assumption:** if a handoff or contribution goes through the normal Original path, it changes task state. Evidence from my source read: `schritt()` calls `auftragFertig`, which falls back to the oldest task. The arrival code in `ballSchritt` calls `arbeitAn` with the `MOTOR` default model and sets `derBall`. `wirf` can null out `derBall`. `stromZeile` marks the line "offen". One flag therefore has to cut every one of these paths, and only for marked GitHub ingress.
- **Simplest path (implemented):** the adapter marks events with `gh_beobachtet: true`. `__agEreignis` accepts the mark only when `ghLive` is set and only for progress, handoff or contribution. It sets `E.beobachtet` and `E.spur`. `schritt` sends these events straight to `wirf`, so the existing flight and labels are reused. `wirf` and `ballSchritt` skip the derBall, erwartung, `arbeitAn`, `auftragFertig`, tisch, abnehmen and stopper paths.
- **Alternative:** a separate renderer just for observed communication, outside `wirf`. It would be cleaner to isolate, but it duplicates the flight code and goes against "reuse Original rendering". I rejected it.
- **Contradiction challenged / extra guard:** the script URL uses `?v=FASSUNG`, but a static host may ignore the query. An old Original (Fassung 50) could then load the new adapter and give handoff its old task meaning. To prevent this, the bridge now advertises `kommunikation:'beobachtet-v1'`. Without that value the adapter rejects handoff and contribution. Progress still goes through.

## Changed paths
- `previews/AG-VISUAL-005-feld/github-live.js` (adapter `AG-GH-LIVE-001-v1.3`)
  - The allowed kind set is now {progress, handoff, contribution}. Any other kind, including test_result and artifact, is rejected.
  - `recipient` is optional overall but required for handoff and contribution. It must be a string and a known actor. Progress without a recipient is still valid.
  - Unchanged: the marker and author rules, the strict field and ID rules, the text and control-character checks, pagination, ETag, baseline and token handling.
  - The event passed on carries the full `project_id/run_id/task_id`, the `id`, `actor`, `recipient`, `source_evidence` and `source_tool_id`.
  - The panel line shows the kind, sender→recipient, the keys and the tool ID. `reported_checkpoint` is labelled "gemeldet, kein Laufzeitbeleg".
  - One CSS rule was added for provenance in `#agLaeuft`.
- `previews/AG-VISUAL-005-feld/schicht.py` (generator only; built `feld/index` not touched)
  - `FASSUNG = '51'`.
  - `GH_ARTEN`, `ghKenn` and `spurWort` added: an escaped provenance line, with "beobachtete Übergabe — keine Annahme, kein Arbeitsbeginn" or "beobachteter Bericht — keine Abnahme".
  - `__agEreignis`: the mark works only in `ghLive`. It requires valid keys and `source_evidence`. No model or usage is taken over. Observed communications fly at the size of a thrown-off piece, not a whole ball.
  - `schritt`: a `beobachtet` branch now comes before `auftragFertig`.
  - Guards added in `wirf`, `ballSchritt` and `stromZeile`. Progress lines and labels now also show the full keys.
  - The bridge advertises `kommunikation`.
- `tests/AG-GH-LIVE-004-forge.cjs`
  - NodeVM component test of the real adapter, using a fake DOM, fetch and clock.
  - It covers 3 accepted events (an old-style progress, a handoff atlas→forge on T1, and a contribution sentinel→atlas "QA PASS" with a different project/run/task T2). It covers 8 rejections. It checks that keys and provenance are passed on, that the token never appears, and that an Original without the bridge value receives no communications.
  - It also includes static source assertions on the Original guards. Those are only string checks, not behaviour.
- `handoffs/AG-GH-LIVE-004-forge-result.md` (this file).

## Tests
- `node tests/AG-GH-LIVE-004-forge.cjs`: **NOT_RUN** (I only have Read/Edit). I did not compile or build schicht.py either: **NOT_RUN**.
- Browser and movement checks are **NOT_RUN**. Sentinel should check, in a real browser on Fassung 51 with `?live=github`:
  - After the handoff, contribution and progress events, `__agStand()` still shows the same `aufgabenAuf`, `aufgabenZu`, `arbeiten`, `ball`, `register` and `geraten` as before.
  - No work ring appears and the "offen" counter does not change.
  - The flight and labels are visible, with sender→recipient and IDs.
  - Demo and archive behave as before.
  - `?mvp=1` still shows unchanged handoff semantics.

## Limits and risks
- If someone calls `__agEreignis` by hand without the mark during `?live=github`, the old task semantics still apply. That is deliberate: the packet says to preserve other hooks.
- `progress` with a valid recipient is accepted. The arrow is shown, but its meaning is unchanged (a pulse only).
- A message arriving does not show that work is ongoing, that it was accepted, which model was used, or that anything is done. The panel and labels say so.
- If the host rebuilds `feld/index`, it must use the new generator, or the bridge value is missing. Without the value, communications are rejected rather than mis-rendered.
- Device policy, the phone header and Windows are untouched.

## Next owner
Atlas: arrange an authorized test executor to run the .cjs test and the build. Then Sentinel does the independent browser, movement and state checks. After that, Peter and Atlas decide on isolated pilot publication and live proof. Author: Forge. Tester: not yet assigned. Publisher: not me.
