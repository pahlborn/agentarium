# AG-PILOT-001 – Agentarium als erster Datenpilot

Version 1 · 2026-10-16 · Atlas.
Status: PREPARED_BLOCKED. Kein gestarteter Pilot und keine Bereitstellung.
Peter hat die Reihenfolge bestätigt: erst Schnittstelle abschließen, danach Pilot.

## Konkretes Ziel

Ein einziger echter, begrenzter Teamauftrag in pahlborn/agentarium wird live beobachtet und anschließend aus derselben archivierten Ereignisfolge wiedergegeben. Agentarium ist erstes registriertes Projekt; keine anderen Repositories werden umgestellt.

Vorgesehener Fachauftrag: AG-PILOT-001-WORK – für den dann freigegebenen Datenvertrag die Beleglage eines ausgewählten Agentarium-Laufs prüfen und eine kurze Liste fehlender Nachweise erstellen. Atlas orchestriert, Scout liefert einen begrenzten Quellenbeitrag, Argus prüft das Ergebnis. Ein echter Klärungsbedarf wird erfasst, aber keine Frage künstlich erzeugt. Sentinel prüft separat die technische Beobachtungs-/Archivkette; seine Fehlerproben sind als technische Testdaten von echter Projektarbeit getrennt.

## Voraussetzungen vor WORKER_STARTED

1. Exakter akzeptierter Schnittstellen-/Referenzstand; K3 darf im akzeptierten Zustand kein unbelegtes Done erlauben.
2. Empfangscursor, akzeptierte Zustandsrevision und dauerhafter Verwerfungsnachweis eindeutig getrennt.
3. Benannter erreichbarer Host, bestätigte persistente Ablage und Wiederherstellung; keine flüchtige Scratchablage als dauerhafter Speicher.
4. Autorisierter Zugriff auf genau pahlborn/agentarium, vereinbarter Archivbranch und Nutzerleserechte. Keine Providersecrets im Browser.
5. Forge-Implementierungsauftrag mit exaktem Umfang/Branch und funktionierendem nachgewiesenem Ausführungskanal. Kein beliebiger Umbau eines alten bezahlten Relays.
6. Konkreter technischer Betriebs-/Kostenrahmen. Keine neuen Dienste oder kostenpflichtigen Aufrufe allein aus diesem Entwurf starten.

## Kleinster Integrationsumfang

Ein Projekt, ein Lauf, read-only. supported_actions bleibt [].
Runtime-Erfassung an echten Übergaben, Ergebnissen und Fehlern; ausgewiesene Coverage der angebundenen Umgebungen.
Dauerhafte idempotente Annahme mit Bestätigung; Katalog, Snapshot, Laufstrom; ungesicherte Daten als solche markieren.
Gebündelter Archivexport mit Manifest und fixiertem Commit/Blob.
Vorhandenes Agentarium-Feld als erster Verbraucher; keine neue Visualgestaltung.
Partitur nutzt dasselbe Archiv als nachfolgenden Kompatibilitätscheck; dieser Nachweis wird separat ausgewiesen und nicht vorausgesetzt.

## Begrenzte Abnahme

P1: Echt gestarteter Auftrag und echte Rollen-/Sitzungsbelege sichtbar; keine simulierten Agentenantworten.
P2: Später Browser-Einstieg ergibt den belegten Zustand am Cursor und verarbeitet den Tail ohne Doppelwirkung.
P3: Verbindungsabbruch und Wiederaufnahme liefern fehlende Ereignisse; Snapshot-Resync außerhalb des Puffers.
P4: Doppelsendung, fehlerhafter Statusübergang und Sequenzlücke: keine falsche Zustandswirkung; Verwerfung nach Neustart noch nachweisbar.
P5: Nach bestätigter Persistierung bleibt der Stand nach Prozessneustart rekonstruierbar.
P6: Archivmanifest/Blöcke am festgehaltenen Commit ergeben denselben fachlichen Endzustand wie der Live-Lauf.
P7: Replay/Zeitsprung startet keine Agenten, Schreibzugriffe oder Befehle.
P8: Nichtberechtigte Nutzer erhalten keine Projektdaten; Kostenfeld bleibt bei unvollständiger Erfassung ohne Beträge.
P9: Zusätzliche Requests, Payload, Erfassungs-/Schreibdauer und belegbare Kosten messen, keine unbelegte Performancegarantie.

Kein Standardvalidatornachweis wird vorausgetäuscht: er ist separat zu erbringen, wenn eine geeignete genehmigte Umgebung vorliegt.

## Vorbereitungsnachweis und aktueller Blocker

Read-only-Inventur am 16.10.2026: Repository enthält statische Visualisierungen, Daten-/Referenzprüfmittel und begrenzte GitHub-Actions-Relays. Im untersuchten Baum wurde kein lauffähiger dauerhafter SSE-/Ingestdienst oder benannter Betriebshost nachgewiesen. Dies beweist nicht, dass außerhalb des Repositories keine geeignete Infrastruktur existiert.

Ein bestehender Forge-Workflow ist auf eine frühere visuelle Revision zugeschnitten und nur durch eine Änderung seiner eigenen Workflowdatei auf feature/visual-stage-v0 auslösbar. Er wird nicht als beliebiger Pilotkanal umgedeutet oder ausgelöst. Kein direkter Claude-Sitzungskanal wurde in den verfügbaren Tools gefunden.

Offen für eine konkrete spätere Betriebsentscheidung: vorhandener Host mit dauerhaftem Speicher oder neue Hostingoption. Vor einer Einrichtung müssen Rechte, Aufwand und Erreichbarkeit konkret vorliegen.

## Grenzen

Keine neue Plattform, keine weiteren Projekte, kein Kosten-Dashboard, keine aktiven Steuerbefehle.
Keine Implementierung durch Atlas als Ersatz für Forge. Keine kostenpflichtigen Probeaufrufe.
Kein Merge, Release, Deployment oder Infrastrukturstart.
Kein Pilot-PASS aus Datenfixturetests ableiten.

## Aktualisierung nach K3/K1-Abschluss – 2026-10-16
Referenz-/Prüfmittelblocker auf isoliertem Arbeitsbranch behoben und unabhängig verifiziert: da860fd19f38e9938ed201546f2a6e5b4cc765f8. Beide Prüfer bestanden; kein Merge, Deployment oder Pilotstart. Siehe governance/AG-VISUAL-005-K3-K1-abschluss-v1.md. Noch erforderlich: Einbindung des geprüften Stands, Betriebs-/Speicher-/Zugriffsnachweise und dauerhafte Diagnoseablage. PREPARED_BLOCKED bleibt zutreffend; nicht mehr wegen offener K3-Testkorrektur.

## Lokaler Integrationsschritt – 2026-10-16
Forge hat einen nur auf127.0.0.1 gestarteten Transportprototyp gebaut und gezielt korrigiert. Sentinel bestätigt18/18 Laufzeitproben am synthetischen Testaufbau. Arbeitscommit19463534defa6f9c6b48812eeebf56433fa28e89; Nachweise governance/AG-PILOT-001-local-abschluss-v2.md. Keine Bereitstellung und kein echter Pilot. Weiterhin fehlen Feldadapter, tatsächliche Runtimeproduzenten, Host/dauerhafte Speicherung/Rechte und finale Archivverpackung. Testserver wurden beendet.
