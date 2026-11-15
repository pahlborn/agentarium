# Big Quest · zentrales Auftragsregister

Stand 15.11.2026 · Projekt `big-quest` · Lauf `BQ-EVAL-01` · Steuerung im zentralen Chat bei Peter und Atlas.

Peter entscheidet: zentrale Übersicht bleibt im Steuerungschat; begrenzte Entwicklungsaufträge gehen an Atlas in jeweils separaten Chats. Kein eigenständiger Start der nächsten Stories im Ausführungs-Chat. Der Steuerungsatlas konsolidiert tatsächliche Rückgaben. Es gibt keine automatische Hintergrundausführung und keine behauptete chatübergreifende Erinnerung.

| Auftrag | Bestehender Backlog-Bezug | Zustand | Ergebnis / nächster Schritt |
|---|---|---|---|
| [AG-RELAY-MULTIREPO-001 v2](AG-RELAY-MULTIREPO-001.md) | Eigenständiger Agentarium-Infrastrukturauftrag; keine allgemeine Wartebedingung für Big Quest | DELIVERED laut gelesener Rückgabe; begrenzter Infrastrukturkandidat, nicht allgemein aktiviert | [Rückgabe](https://github.com/pahlborn/agentarium/blob/4417390f145d496edff3b611f0f603c45110f9eb/handoffs/AG-RELAY-MULTIREPO-001-rueckgabe-v1.md), Draft-PR130; R1–R8 dokumentiert. Edit-Slot belegt, Write NOT_TESTED; konkrete INT01-Quellpolicy noch nicht bereitgestellt. Kein Main-Merge oder Gesamt-INT01-PASS. |
| [BQ-EVAL-01-INT-01 v3](BQ-EVAL-01-INT-01.md) | EP00/EP09, technische Vorbereitung der Basis-/Lieferstand-Stories | BLOCKED; erste Ausführungsrückgabe eingegangen, nicht angenommen | Kandidat d26af4a gemeldet; rote Regression und Upgrade-Nachweis offen. [Quellen und Disposition](returns/BQ-EVAL-01-INT-01-return-01.md). Relay-Abhängigkeit bleibt separat, kein Forge-Lauf daraus ableiten. |
| [BQ-EVAL-01-INT-01-K1 v2](BQ-EVAL-01-INT-01-K1.md) | Nachbesserung unter INT-01, keine neue Produktstory | PREPARED, nicht gestartet | Im bisherigen Ausführungs-Chat Ursache der roten Prüfung und Upgrade-Nachweis klären; nur belegte Testwartung, betroffene Prüfungen und unabhängiges Deltaurteil. |
| [BQ-EVAL-01-US202-01 v2](BQ-EVAL-01-US202-01.md) | EP02 / US202, bestehender Geräte-Verbindungslink #194 | NEEDS_DECISION/QA FAIL historisch geliefert; zentrale G4-Präzisierung erfolgt, noch keine neue Abnahme | Kandidat aab72dbd0585004fd61e4fae296a1fdbd51dadf0 gemeldet. G2-Nachweis offen; pauschale G4-Einmaligkeit war für Zugang-only-Link zu weit. Privater Zugang hergestellt, kein erneuter Freigabebedarf. [Klärung](DECISION-2026-11-15-FREIGABEN-US202.md). |
| [BQ-EVAL-01-US202-01-K1 v2](BQ-EVAL-01-US202-01-K1.md) | Nachprüfung unter US202-01, keine neue Produktstory | PREPARED, nicht gestartet | Im bisherigen Ausführungs-Chat G2 direkt nachweisen und G4 je Linkart neu unabhängig abnehmen; vorhandene Authentifizierung und alte FAIL-Historie erhalten. |
| [BQ-EVAL-01-OPS-01 v2](BQ-EVAL-01-OPS-01.md) | Betriebsanteile EP04/US401–403 und EP08/US801–803, nur Vorbereitung | DELIVERED_WITH_NOTES; Dokumentationslieferung angenommen | [Betriebsmatrix](results/BQ-EVAL-01-OPS-01/Betriebsmatrix-v1.md) und [Einordnung](returns/BQ-EVAL-01-OPS-01-return-01.md). Keine Betriebsfreigabe. Steuerung klärt Betriebsziel/Parameter vor providerabhängigen Folgeaufträgen. |
| [BQ-EVAL-01-CI-01 v2](BQ-EVAL-01-CI-01.md) | Ursprüngliche Actions-Verbrauchsfrage, nur lesende Analyse | PREPARED, nicht gestartet | PR193/198 im begrenzten Zeitraum anhand tatsächlicher Run-/Job-/Attemptdaten auswerten; höchstens drei begründete Vorschläge. Keine Workflowänderung und kein neuer Actions-Lauf. |
| [BQ-EVAL-01-US403-01 v2](BQ-EVAL-01-US403-01.md) | EP04 / US403, konkrete Funktionsentwicklung | PREPARED, nicht gestartet | Dauerhaften unklaren Claude-Anbieterstatus und sichtbaren manuellen Fortgang implementieren; kein automatischer Doppelaufruf. Lokaler Anbieter-Mock und echter Formularnachweis; keine neue Infrastruktur nötig. Vorrang vor weiterer optionaler Analyse. |

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

## Verbindliche Personalregel – jüngster Entscheid vom 15.11.2026

**Verbindliche Personalregel, Peter 15.11.2026:** Reguläre Rollen einsetzen. Vertretung nur bei konkret belegtem technischem Problem UND nach vorheriger ausdrücklicher Zustimmung Peters zum benannten Einsatz. Frühere pauschale Ersatzfreigaben sind widerrufen. Ohne Zustimmung keine neue Vertretung starten oder fachlich fortsetzen; sichere Checkpoints und unabhängige erlaubte Arbeiten bleiben möglich. [Aktuelle Regel](https://github.com/pahlborn/agentarium/blob/main/governance/vertretungen-freigabe-2026-11-15.md). Diese jüngste Nutzerentscheidung geht allen älteren Vertretungsformulierungen dieses Auftrags vor.

In Agentarium-main integriert: `6700bc2e581739b7b6d751fb9dfef2328b0cd32a`. AGENTS, Rulebook, Process und Vertretungsprofile sind konsistent aktualisiert. Unabhängiger regulärer Argus-Review am Regelcommit `52cf7b009d9658810bd919c1af4bd38202dd8352`: PASS_WITH_NOTES/RA_AGREED; der alte Cadence-Querverweis wurde anschließend redaktionell ausdrücklich auf beide Voraussetzungen präzisiert. Keine Vertretung für diese Redaktion gestartet.

Aktuelle Auftragsdateien erhalten wegen dieser Personaländerung eine neue Fassung; historische Rückgaben behalten ihre ursprüngliche Versionsbindung. Laufende fremde Chats/Worker sind dadurch nicht automatisch neu geladen oder gestoppt. Vor weiterer Zuweisung/Fortsetzung aktuelle Regel laden und konkreten Halterstatus prüfen.
