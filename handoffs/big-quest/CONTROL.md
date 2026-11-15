# Big Quest · zentrales Auftragsregister

Stand 15.11.2026 · Projekt `big-quest` · Lauf `BQ-EVAL-01` · Steuerung im zentralen Chat bei Peter und Atlas.

Peter entscheidet: zentrale Übersicht bleibt im Steuerungschat; begrenzte Entwicklungsaufträge gehen an Atlas in jeweils separaten Chats. Kein eigenständiger Start der nächsten Stories im Ausführungs-Chat. Der Steuerungsatlas konsolidiert tatsächliche Rückgaben. Es gibt keine automatische Hintergrundausführung und keine behauptete chatübergreifende Erinnerung.

| Auftrag | Bestehender Backlog-Bezug | Zustand | Ergebnis / nächster Schritt |
|---|---|---|---|
| [BQ-EVAL-01-INT-01 v2](BQ-EVAL-01-INT-01.md) | EP00/EP09, technische Vorbereitung der Basis-/Lieferstand-Stories | PREPARED, kein Worker für diesen neuen Auftrag gestartet | Vollständigen bereinigten Kandidaten aus Stand 06 und geprüftem Cleanup-Overlay herstellen; Peter eröffnet den separaten Ausführungs-Chat mit dem Auftragslink; Atlas lädt die beiden Eingabepakete selbst aus GitHub. |

## Autoritätsgrenzen

Repositories bleiben public. Ursprüngliche personenbezogene Daten werden nicht übernommen oder eigens neu gesichert. Reguläre Claude-Rollen gehören zum Team. Gezielte begrenzte Agentarium-Relay-Läufe sind erlaubt; allgemeine CI, Code-Push/PR, Main-Merge, Produktivaktivierung und App-Veröffentlichung sind aus dem ersten Integrationsauftrag nicht freigegeben. EP06 bleibt als alter Auftrag angehalten; INT-01 ist ausschließlich lokale technische Vorbereitung.

## Veröffentlichungsumfang dieses Registers

Nur bereinigte Auftrags-/Steuerungsdokumente auf separatem Dokumentationsbranch. Keine Familien-/Schuldaten, echten Tokens, Datenbanken oder Lösch-Deltas mit Originalwerten veröffentlichen. Die geprüften öffentlichen Eingabevarianten liegen unter handoffs/big-quest/inputs/BQ-EVAL-01-INT-01/ samt SHA256 und Publikationshinweisen. Atlas lädt sie ohne Dateitransport durch Peter selbst; fremde Workspace-Pfade sind keine Eingabe. Änderungen der öffentlichen Varianten sind nicht als bereits anwendungsgeprüft auszugeben.

Vor Veröffentlichung am Agentarium-main `9962810b895baf10f8d71dd9a1f7387cca049b77` die neun vorhandenen Workflow-Trigger geprüft: der Dokumentationsbranch `docs/bq-eval-01-control-int-01` mit ausschließlich Dokumenten und Eingabepaketen unter `handoffs/big-quest/` trifft keinen dieser Push-Trigger. Kein PR, keine Aktivierungsdatei und kein Workflow_dispatch. Dies ist eine Aussage über die geprüften Repository-Workflows, keine Behauptung einer Prüfung unbekannter externer Webhooks.

Dieses Register ersetzt weder das kanonische Ereignisjournal auf Issue #2 noch dessen tatsächliche Laufbelege. PREPARED/PUBLISHED eines Dokuments ist kein Agentenstart. Nach Rückgabe tatsächlichen Kandidaten, Review und verbleibende Entscheidung eintragen; alte Befunde erhalten.

## Änderung v2 – selbstständiger Eingabeabruf

Peter verlangt GitHub-Ablage der tatsächlichen Eingaben statt wiederholtem Dateitransport. Auftrag und Eingabeindex entsprechend aktualisiert. Es wurde keine neue Entwicklung oder Agenten-/Anwendungsprüfung ausgeführt. Review und Originalnachweise behalten ihre exakte ursprüngliche Gültigkeitsgrenze.
