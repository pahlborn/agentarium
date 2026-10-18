# AG-GH-LIVE-004-FORGE-R1 — CA_IMPLEMENTED

- Baseline: 1d5293205aa65390673e72308558270d926418ab
- Changed paths: `previews/AG-VISUAL-005-feld/schicht.py` (wirf, ~L603), this file.
- Patch: `if (MODUS === 'live') baelleEinholen(E.von);` → `if (MODUS === 'live' && !E.beobachtet) baelleEinholen(E.von);` plus a two-line comment.
- Preserved: ordinary live/manual (beobachtet falsy) behaves exactly as before; demo/archive never reached this branch (MODUS !== 'live'). Fassung 51 and the adapter are unchanged.
- Tests: NOT_RUN (no Bash). Sentinel is adding the real-browser mixed-path regression. Argus's 4s→0.28s reproduction should be rerun against this patch.
- Assumption: the flag name `E.beobachtet` comes from the packet. In this pass I read only lines 580–629, so I did not check where the flag gets set.
- Risk/judgment: this is the smallest correction and it closes the confirmed side effect at its source. One gap remains: a later unmarked event from the same sender still triggers the catch-up as before. I think that is intended behavior.
- Next owner: Sentinel (regression), then Argus (re-review), then Atlas.
