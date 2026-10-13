# AG-NACHTPOST-001 — Abbruchdiagnose und korrigierter Forge-Auftrag
Stand: 2026-10-13
Status: LOCAL_RELAY_TIMEOUT; Providerursache unbekannt
Run: https://github.com/pahlborn/agentarium/actions/runs/38456137935
Gewebe Job: 115499231276, failure
Partitur Job: 115500734483, cancelled, keine Schritte ausgeführt

## Belegte Diagnose
- Checkout, Offline-Preflight, CLI-Installation und Versionsprüfung erfolgreich.
- Claude Code Version 2.1.296.
- Unser run_json nutzt subprocess.run(... timeout=180).
- TIMEOUT nach180.017 Sekunden; stdout0Bytes, stderr0Bytes.
- Der lokale Python-Relay beendete den Aufruf; kein terminales CLI-Ergebnis und keine Code-Rückgabe.
- Kein Nachweis für Guthabenmangel, Authentifizierungsfehler, Budgetüberschreitung oder Provider-Ausfall.
- Tatsächliches Modell, Tokens und Kosten des abgebrochenen Aufrufs unbekannt.
- Null-Ausgabe belegt nicht, dass keine Arbeit oder keine Kosten entstanden sind.

## Korrekturgrund
Der genaue Providergrund für die Laufzeit ist nicht rekonstruierbar. Die lokal belegte harte180s-Abbruchgrenze wird für den autorisierten neuen Implementierungsauftrag verlängert und der Aufruf um eine überprüfbare Streaming-Diagnose ergänzt. Fortschritt enthält ausschließlich Typzähler und Zeiten, keine Modelltexte oder internen Gedankengänge.

Quellen für das Aufrufschema: https://code.claude.com/docs/en/headless und https://code.claude.com/docs/en/cli-reference (2026-10-13 gelesen). Stream-JSON ermöglicht laufende Ereignisse; das finale Resultat bleibt erforderlich.

## Peters ausdrückliche Steuerung
„Nein. Forge soll umsetzen, nicht du. Auch wenn es kostet. Allerdings möchte ich wissen warum der Abbruch kam.“

Atlas' lokale Präsentationsrenderung wurde abgebrochen und nicht als Produktartefakt ins Repository übernommen. Neue lauffähige Gewebe-/Partitur-Mocks werden ausschließlich von Forge geschrieben. Atlas darf Relay-Infrastruktur korrigieren, Beiträge anwenden und Ergebnisse bereitstellen; keine eigenen Mockimplementierungen als Ersatz.

## Neuer begrenzter Auftrag
AG-NACHTPOST-002, je Variante eine eigenständige Forge-Sitzung.
Bestehender Sonnet/Medium-Default; kein Modellupgrade.
Endliche Frist600s je Aufruf, Workflow15Minuten.
CLI-Kostenschätzgrenze USD0.40 jeVariante, zusammen USD0.80; keine Rechnungsgarantie und kein Restguthabennachweis.
Kein automatischer Retry. Fehlgeschlagener erster Job verhindert den zweiten.
Streaming-Schutz offline geprüft (5Checks); Argus-Delta-Review vor Start.
Reproduzierbare Sentinel-QA nach Lieferung, Browser-Nachweis separat.
