# AG-VISUAL-005-INTERFACE – Korrekturauftrag nach Team-Re-Review

Version 1 · 2026-10-15  
Von: Atlas  
An: Schnittstellenagent  
Basis: governance/AG-VISUAL-005-INTERFACE-rereview-team-v1.md  
Status: READY_FOR_SPEC_REVISION

Erstelle den verbindlichen Schnittstellenvertrag V2. Die geprüften V1-Artefakte bleiben unverändert als Nachweis bestehen. Keine Implementierung aus diesem Auftrag ableiten.

## Verbindliche Korrekturen

1. Trenne Projektentdeckung von fachlichen Arbeitsströmen. Verwende einen kleinen Team-Lifecycle-/Katalogstrom für project.created, run.started und run.finished. Nach der Projektanlage laufen Fachereignisse im Projekt-/Laufstrom. Jeder Strom erhält einen eigenen monotonen stream_sequence- und Replayraum.

2. Definiere die Projektanlage: project_id erzeugen, dann project.created mit dieser ID veröffentlichen. Definiere project_id als dauerhafte Projektklammer und run_id als einzelne Ausführung und Archiv-/Replayeinheit.

3. Live und Archiv ergeben sich aus dem Laufzustand. Definiere mindestens geplant, aktiv, wartend, pausiert, blockiert, abgeschlossen, abgebrochen, fehlgeschlagen und wiedereröffnet. Simulation/fictional beschreibt die Herkunft. Steuerung ist eine Berechtigung. Widersprüchliche Betriebsarten dürfen nicht frei kombiniert werden.

4. Löse SSE-Authentifizierung und Reconnect widerspruchsfrei. Übernimm kein einmaliges, verbindungsgebundenes URL-Ticket. Bei gleichem kontrolliertem Ursprung ist eine sichere Cookie-Sitzung vorgesehen; andernfalls fetch-Streaming mit Authorization-Header und eigenem Reconnect. Definiere SSE-id, Last-Event-ID, Cursor, Replaygrenze, Fehlerantwort und Snapshot-Reconciliation.

5. Verwende Transport-Keepalive und ein für die Oberfläche empfangbares flüchtiges heartbeat-Ereignis getrennt. Sende heartbeat alle 5 Sekunden und markiere die Ansicht nach 20 Sekunden ohne Empfang als veraltet beziehungsweise Verbindung unklar. Heartbeats werden nicht persistiert, erhalten keine Fachereignis-ID und verändern keine Sequenz oder Replaydaten.

6. Definiere zeitachse: complete | partial | none mit objektiven Ableitungsregeln. Bei partial und none wird eine sichtbar bezeichnete Schrittfolge verwendet. Es dürfen keine Dauer, Parallelität oder aktive Arbeitszeit erfunden werden.

7. Trenne in der Feldtabelle:
   - heute im realen observed-worklog vorhandene Felder;
   - additive Zielfelder aus AG-REPORT-001;
   - im Vertrag V2 neu verbindlich festgelegte Felder.
   Das Feld erledigt entfällt. Done entsteht nur durch expliziten revisionsgebundenen Statuswechsel. run_id wird additiv aufgenommen.

8. Nimm serverseitig durchgesetzte Berechtigungen read und command auf. Wand- und Präsentationsansichten sind nur lesend. Unerlaubte Befehle werden ohne fachliche Nebenwirkung abgelehnt.

9. Aktualisierte Entscheidung von Peter (15.10.2026, 21:01:52 Europe/Berlin): Das Kostenfeld bleibt sichtbar. Solange die Gesamtkosten nicht vollständig ermittelt werden können, zeigt es ausschließlich „Kosten nicht vollständig ermittelbar.“ Keine Beträge, Teilsummen, Gesamtsumme oder 0-€-Ersatzwerte. Erst bei vollständiger belegter Gesamterfassung werden Kosten ausgewiesen. Diese Entscheidung ersetzt die frühere Ausblendung des Kostenfelds.

10. Liefere Prosa-Vertrag, maschinenprüfbare Schemas und zusammengehörige Beispieldaten für Einstiegssnapshot, Heartbeat/Stale, Reconnect und Replaygrenze, mehrere Projekte/Läufe, parallele Aufgaben und Artefaktversionen, Read-only, pausierte Kosten, Altlogs mit fehlenden Zeitpunkten sowie nebenwirkungsfreie Archivwiedergabe.

Kennzeichne jeden Punkt als spezifiziert, implementiert, getestet oder blockiert. Liefere die exakten Pfade, Versionen, Blob-Hashes und offenen Entscheidungen. Danach stoppen; keine Implementierung, kein Merge und keine Veröffentlichung.
