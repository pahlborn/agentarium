# AG-GH-LIVE-002 — Kundenabnahme des Live-Durchstichs

Status: kleinster Ende-zu-Ende-Live-Pilot vom Kunden bestätigt.

Peter bestätigte am 18.10.2026 um 05:14 Europe/Berlin im Projektchat: „ja, ich konnte beide sehen“. Beobachtung: Original-Agentarium auf Safari/iPad war bereits geöffnet und GitHub-Live verbunden; beide neu erzeugten Forge-Ereignisse erschienen ohne Neuladen.

## Reale technische Nachweise

- Pilot: https://pahlborn.github.io/agentarium/pilot/github-live/?live=github, Fassung 49 / Adapter AG-GH-LIVE-001-v1.1, Commit a6601b1fd2c6aa23d3e080ba585c8105835852cd.
- Auftrag AG-GH-LIVE-002-FORGE-CHECK-V1, Steuerungscommit 9fe76ee5933e09430a1076dda643051c53c8c51b.
- Claude-Lauf: https://github.com/pahlborn/agentarium/actions/runs/39069906271; Session f2637547-109d-49b2-a8d3-015717878df5, Laufzeitmodell claude-opus-5-5, angeforderter Effort high, tatsächlicher Effort nicht bestätigt.
- GH-39069906271-1, tatsächlicher Read-Tool-Aufruf, 17.10.2026 23:12:00 Europe/Berlin: https://github.com/pahlborn/agentarium/issues/2#issuecomment-6241176903.
- GH-39069906271-2, tatsächlicher Edit-Tool-Aufruf zum Prüfbericht, 23:12:18: https://github.com/pahlborn/agentarium/issues/2#issuecomment-6241181662.
- Ergebnis und Laufzeitmetadaten: https://github.com/pahlborn/agentarium/issues/2#issuecomment-6241185307. Worker erfolgreich, nur erlaubter Prüfbericht geändert; keine Produktveröffentlichung durch Forge.

## Umfang und Grenzen

Nachgewiesen ist dieser reale Weg: Claude-Tool-Aktivität → beobachtender Host → strukturierter GitHub-Kommentar → authentifiziertes Polling im bereits geöffneten Browser → Original-Feld. Keine Attrappe, kein Demo-Replay. Peters Sichtbestätigung ist der Gerätenachweis; Atlas hat das iPad nicht selbst instrumentiert. Es gibt keine gemessene Ende-zu-Ende-Latenz und keinen Nachweis für flächendeckende ChatGPT-Telemetrie, Dauerbetrieb oder alle Ereignisarten.

## Nacharbeit AG-GH-LIVE-003

Peter gab am 18.10.2026 um 05:14 die Fortsetzung frei: Abnahme festhalten, kleine Mängel beheben, anschließend gezielt erweitern. Forge soll Ablaufwarnung sichtbar halten, fehlendes/gelöschtes Datum nicht als bestätigtes neues Ablaufdatum ausgeben und Singular korrigieren. Sentinel prüft unabhängig den exakten Kandidaten. Demo/Archiv und reguläres feld/ bleiben erhalten. Keine Ausweitung auf neue Transportarchitektur.

## Kostenbeleg

Dieser Claude-Prüflauf meldete 0.1595546 USD, Eingang 8, Cache-Erstellung 19214, Cache-Lesen 20063, Ausgang 2972 Token (davon 1297 Thinking laut Metadaten; nicht zusätzlich addieren). Dies ist ein einzelner Lauf, keine vollständige Projektkostenrechnung. In Agentarium werden keine unvollständigen Kosten ausgewiesen.
