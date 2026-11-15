# Big Quest · zentrales Auftragsregister

Stand 15.11.2026 · Projekt `big-quest` · Lauf `BQ-EVAL-01` · Steuerung im zentralen Chat bei Peter und Atlas.

Peter entscheidet: zentrale Übersicht bleibt im Steuerungschat; begrenzte Entwicklungsaufträge gehen an Atlas in jeweils separaten Chats. Kein eigenständiger Start der nächsten Stories im Ausführungs-Chat. Der Steuerungsatlas konsolidiert tatsächliche Rückgaben. Es gibt keine automatische Hintergrundausführung und keine behauptete chatübergreifende Erinnerung.

| Auftrag | Bestehender Backlog-Bezug | Zustand | Ergebnis / nächster Schritt |
|---|---|---|---|
| [AG-RELAY-MULTIREPO-001 v1](AG-RELAY-MULTIREPO-001.md) | Eigenständiger Agentarium-Infrastrukturauftrag; keine allgemeine Wartebedingung für Big Quest | PREPARED laut letztem hiesigen Stand; keine Ausführungsrückgabe hier vorhanden | Begrenzten Repo-Lesezugriff und Forge-Implementierungsmodus herstellen und unabhängig nachweisen; parallel zu beauftragter Arbeit mit echter Vertretung möglich. Kein Doppelstart bei unbekanntem externem Laufstatus. |
| [BQ-EVAL-01-INT-01 v2](BQ-EVAL-01-INT-01.md) | EP00/EP09, technische Vorbereitung der Basis-/Lieferstand-Stories | BLOCKED; erste Ausführungsrückgabe eingegangen, nicht angenommen | Kandidat d26af4a gemeldet; rote Regression und Upgrade-Nachweis offen. [Quellen und Disposition](returns/BQ-EVAL-01-INT-01-return-01.md). Relay-Abhängigkeit bleibt separat, kein Forge-Lauf daraus ableiten. |
| [BQ-EVAL-01-INT-01-K1 v1](BQ-EVAL-01-INT-01-K1.md) | Nachbesserung unter INT-01, keine neue Produktstory | PREPARED, nicht gestartet | Im bisherigen Ausführungs-Chat Ursache der roten Prüfung und Upgrade-Nachweis klären; nur belegte Testwartung, betroffene Prüfungen und unabhängiges Deltaurteil. |

## Autoritätsgrenzen

Repositories bleiben public. Ursprüngliche personenbezogene Daten werden nicht übernommen oder eigens neu gesichert. Reguläre Claude-Rollen gehören zum Team. Gezielte begrenzte Agentarium-Relay-Läufe sind erlaubt; allgemeine CI, Code-Push/PR, Main-Merge, Produktivaktivierung und App-Veröffentlichung sind aus dem ersten Integrationsauftrag nicht freigegeben. EP06 bleibt als alter Auftrag angehalten; INT-01 ist ausschließlich lokale technische Vorbereitung.

## Veröffentlichungsumfang dieses Registers

Nur bereinigte Auftrags-/Steuerungsdokumente auf separatem Dokumentationsbranch. Keine Familien-/Schuldaten, echten Tokens, Datenbanken oder Lösch-Deltas mit Originalwerten veröffentlichen. Die geprüften öffentlichen Eingabevarianten liegen unter handoffs/big-quest/inputs/BQ-EVAL-01-INT-01/ samt SHA256 und Publikationshinweisen. Atlas lädt sie ohne Dateitransport durch Peter selbst; fremde Workspace-Pfade sind keine Eingabe. Änderungen der öffentlichen Varianten sind nicht als bereits anwendungsgeprüft auszugeben.

Vor Veröffentlichung am Agentarium-main `9962810b895baf10f8d71dd9a1f7387cca049b77` die neun vorhandenen Workflow-Trigger geprüft: der Dokumentationsbranch `docs/bq-eval-01-control-int-01` mit ausschließlich Dokumenten und Eingabepaketen unter `handoffs/big-quest/` trifft keinen dieser Push-Trigger. Kein PR, keine Aktivierungsdatei und kein Workflow_dispatch. Dies ist eine Aussage über die geprüften Repository-Workflows, keine Behauptung einer Prüfung unbekannter externer Webhooks.

Dieses Register ersetzt weder das kanonische Ereignisjournal auf Issue #2 noch dessen tatsächliche Laufbelege. PREPARED/PUBLISHED eines Dokuments ist kein Agentenstart. Nach Rückgabe tatsächlichen Kandidaten, Review und verbleibende Entscheidung eintragen; alte Befunde erhalten.

## Änderung v2 – selbstständiger Eingabeabruf

Peter verlangt GitHub-Ablage der tatsächlichen Eingaben statt wiederholtem Dateitransport. Auftrag und Eingabeindex entsprechend aktualisiert. Es wurde keine neue Entwicklung oder Agenten-/Anwendungsprüfung ausgeführt. Review und Originalnachweise behalten ihre exakte ursprüngliche Gültigkeitsgrenze.

## Vorgelagerter Infrastrukturauftrag – 15.11.2026

Peter bittet nach Prüfung der tatsächlichen Relay-Grenzen um einen eigenen Auftrag für die Erweiterung. AG-RELAY-MULTIREPO-001 wird vor INT-01 eingeordnet. Die erweiterten Implementierungs-/Test-/Lieferbefugnisse gelten ausschließlich für diesen ausdrücklich benannten Infrastrukturauftrag; INT-01 und ältere Aktivierungen erhalten dadurch keine zusätzlichen Rechte. Auftragserstellung und GitHub-Ablage starten keine Ausführung.

**Reihenfolge durch neueren Entscheid ersetzt:** [Übergangsvertretung ausdrücklich freigegeben](DECISION-2026-11-15-VERTRETUNG.md). Big Quest wartet nicht auf die Relay-Erweiterung; geeignete echte Vertretung ist direkt autorisiert. Fachliche Blocker und die getrennten Veröffentlichungsgrenzen bleiben bestehen. Diese Ergänzung erzeugt keine neue oder doppelte Ausführung.
