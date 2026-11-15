# CI-01 · Eingang und fachliche Einordnung der Rückgabe

15.11.2026 · Quelle: Peters in den Steuerungschat eingefügte Rückgabe zu CI-01 v1. Die vollständigen Roh-/Tabellendateien und das Rechenskript liegen hier noch nicht vor; keine Behauptung ihrer unabhängigen Vollprüfung.

## Ergebnis im angegebenen Umfang

Status **PARTIAL_WITH_LIMITS** übernommen. Untersucht laut Rückgabe: PR193/198, 11.–14.11.2026 Europe/Berlin, also 10.11.2026 23:00 UTC bis 14.11.2026 23:00 UTC exklusiv. Vier vollständig gelesene API-Seiten mit 219 Runs, daraus 47 Runs, 48 Attempts und 85 eindeutige Jobdatensätze im Umfang. Die Seiten-/Datenvollständigkeit wird hier als berichteter Befund geführt.

| PR/Workflow | Ausgeführte Jobs | Summierte Jobzeit |
|---|---:|---:|
| 193 Releaseprüfung | 44 | 1:33:58 |
| 198 Evaluation-Integration | 7 | 1:30:34 |
| 198 Toddle-Reader | 7 | 0:02:45 |
| 198 iPad-Build | 7 | 0:02:41 |
| 198 Playgrounds-Paket | 7 | 0:00:48 |
| 198 Review-Build | 3 | 0:00:25 |
| Gesamt | 75 | 3:11:11 |

Die zentrale Steuerung bestätigt nur die innere Addition dieser gemeldeten Zahlen: 75 ausgeführte Jobs und 11.471 Sekunden. Zehn vor Ausführung abgewiesene Datensätze erklären zusammen 85 Datensätze, ihre gemeldeten 27 Sekunden wurden nicht addiert. Original-Jobidentitäten, Zeitstempel und Attempts erst anhand der vollständigen Tabelle prüfen.

Technische Zeit ist keine Kostenabrechnung. Historische Sichtbarkeit, Guthaben, Billing-SKU und Speicherwerte bleiben unbekannt. Keine tatsächlichen Euro-/Dollarkosten oder individuelle Agentenverantwortung belegt. Frühere Vermutung „unsinniger Verbrauch durch einen bestimmten Agenten“ durch diese Rückgabe nicht bestätigt.

## Relevante Befunde laut Rückgabe

- 92:52 Jobminuten lagen nach Erstellung eines neueren Kandidaten. Das ist Überlappung, keine zugesicherte Einsparung. Bei abgewiesenem Nachfolger kann der Vorgänger noch benötigt werden.
- Keine identischen ausgeführten Reruns ohne neue SHA nachgewiesen; reale Fehlerkorrekturen sind dokumentiert. Sechs Release-Shards waren Teile einer Suite, keine sechs Vollkopien.
- Elternbrowser-/Schulevaluationstests liefen explizit und nochmals über npm test. Dokumentationsänderung löste fünf Workflows mit 15:26 Jobzeit aus, wobei die damalige Freigaberegel Nachweise am letzten Commit verlangte.
- Höchstens drei Vorschläge: gezielt alte Kandidaten zusammenfassen; geprüfte Inputidentität statt pauschaler letzter SHA für Wiederverwendung; doppelte Testdateiaufrufe entflechten. Kein Automatismus, keine Testabdeckung entfernen und keine Umsetzung begonnen.

## Disposition und Abschluss

Analyse liefert brauchbare begrenzte Ergebnisse; keine weitere allgemeine Untersuchung beauftragt. Die vollständige sichere Belegablage wird mit [konkretisierter vorhandener Schreibfreigabe](../BQ-EVAL-01-CI-01-PUBLISH.md) abgeschlossen. Archiv gehört zu big-quest/BQ-EVAL-01, nicht Allgemein. Bisher gemeldete automatische Ablehnung des Ausführungs-Chats wird nicht umgangen oder als fehlende fachliche Lieferung missverstanden.

Der wiederholte Konflikt zwischen lesender Analyse und ausdrücklich erlaubtem Dokumentationsschreiben ist ein Prozessbefund. Atlas präzisiert hier die operative Aufgabenabgrenzung; keine neue Regelpipeline und keine Cadence-Vertretung aus diesem Eingang starten. Ein späterer tatsächlicher Cadence-Auftrag benötigt eigenen nachprüfbaren Empfang/Start/Ergebnis; nicht behauptet.

Priorität bleibt konkrete Big-Quest-Funktionsentwicklung und das Schließen laufender Abnahmebefunde. Eventuelle CI-Optimierung erst als eigener begrenzter Auftrag nach sicherer Belegablage; keine Workflowänderung aus dieser Rückgabe freigegeben.
