# AG-GH-LIVE-004-PROBE-V1 — Forge (CA_ADVICE, read-only)

Baseline b5dcabb4 (given, not verified by me). Read: github-live.js, AG-DEVICE-001. Rulebook not read. Peter's Fassung51 confirmation not seen by me.

## Gerätewechsel
1. Neues Gerät: Seite mit `?live=github` öffnen, denselben Lesetoken einfügen, „Verbinden“. Er liegt nur im Arbeitsspeicher; nach Neuladen, Verlassen, „Trennen“ oder HTTP 401 neu eingeben (Z. 74, 509, 541–559).
2. „Token gültig bis“ auf jedem Gerät/Browser selbst aus GitHub eintragen. Das Datum bleibt nur dort (localStorage, Z. 90, 183), wird nicht übertragen und belegt keine Gültigkeit – Ablauf/Widerruf zeigt erst HTTP 401 (Z. 426).

## Prüfbarer Fehlerfall
Datum auf A eingetragen, B geöffnet: B zeigt „Token-Ablaufdatum fehlt · Vorschlag (unbestätigt, nicht gespeichert) …“, keine Warnung; `__agGithub.stand().ablaufDatum === ''`, `ablaufTage === null`.

## Mehrdeutigkeit
UI sagt „dieses Gerät“, gespeichert wird je Browser-Profil/Ursprung. Ältere Kommentare spielt B nicht ab (Basis-Schnitt = Geräteuhr, Z. 533).

Tests: NOT_RUN (kein Bash/Browser). Kein Windows-/Safari-Test behauptet.
Next owner: Atlas → bitte Sentinel prüfen lassen: Anleitung gegen Quelle und vorhandene Ablauf-QA (Fassung50, Chromium/Linux).
