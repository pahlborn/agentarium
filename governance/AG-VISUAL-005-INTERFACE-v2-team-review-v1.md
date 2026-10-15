# AG-VISUAL-005-INTERFACE-V2 – unabhängiges Team-Review V1

Datum: 2026-10-15. Auftrag: AG-VISUAL-005-INTERFACE-V2-REVIEW.
Geprüft: pahlborn/agentarium@b0a08c1cd54b21424837cf51dc6d8dda083699cb.
Vertrag: specifications/AG-VISUAL-005-schnittstelle-v2.md, Blob 8c86e3c6207030adcf0f1a2bb21194e3c3820f8b.
Umfang: vier Schemas, neun Fixtures und zwei Python-Prüfer aus §11.
Rückmeldung: handoffs/AG-VISUAL-005-INTERFACE-v2-rueckmeldung-v1.md, Blob d91d3862f325553dedca8425c4c2a7bdda415c25; auf späterem Branchstand, nicht Teil des geprüften Liefercommits.
Baseline: Korrekturauftrag 313f096d44c19e0fa3e71a1e9b6bb1fa0fbc5160.

## Echte unabhängige Beteiligung

- Argus: /root/argus_interface_rereview; AG-VISUAL-005-INTERFACE-V2-REVIEW:RA:RA_REVIEW:V1; FAIL.
- Sentinel: /root/sentinel_interface_rereview; AG-VISUAL-005-INTERFACE-V2-REVIEW:SENTINEL:QA_REPORT:V1; FAIL.
- Atlas konsolidiert die tatsächlichen Handbacks. Kein Server, Browser, SSE oder produktiver Verbraucher geprüft. Keine Implementierungsfreigabe.

## Positives Delta

Katalog und Arbeitsstrom sind getrennt. Sichtbares flüchtiges Heartbeat, Read-only und die korrigierte Kostenanzeige sind im Vertrag grundsätzlich richtig beschrieben. Herkunft wird von Ansicht getrennt. Implementiert ist weiterhin nichts.

## Befunde und begrenzter Korrekturauftrag V2.1

### B1 – BLOCKER: Wiederaufnahme
§3.3 definiert replay_grenze als niedrigste lieferbare Sequenz. Bei Grenze 120 muss Cursor 119 ab 120 fortsetzen können. Korrigiere die Grenzprüfung auf Cursor+1 >= replay_grenze; prüfe auch ungültige IDs und Cursor oberhalb des höchsten vorhandenen Werts.

Native EventSource bietet dem Anwendungscode keinen auslesbaren 409-JSON-Body; ein Nicht-200-Status lässt die Verbindung scheitern. Definiere für diesen Pfad ein auswertbares SSE-Steuerereignis oder eine vorgelagerte Resume-Prüfung. Beim fetch-Pfad kann HTTP409 mit JSON verwendet werden. Der Betriebsrahmen muss vor dem Verbindungsaufbau feststehen, nicht erst in dessen Antwort.

Normative Quelle, von Atlas ebenfalls geöffnet: https://html.spec.whatwg.org/multipage/server-sent-events.html (§9.2.2/§9.2.3).

### B2 – BLOCKER: Done und genaue Prüfnachweise
strom.schema.json verlangt nur das Vorhandensein von Status-/Reviewfeldern, erlaubt jedoch null für task_id, Revision, Zielversion, Kriterien und Ergebnis. previous_transition_id ist nicht Pflicht; Revisionskette und Erfüllungsnachweise werden nicht berechnet. Fixture05 W7 meldet Test fail für ART-11 v2, W8 setzt anschließend ohne späteren Erfüllungsnachweis Done.

Definiere nichtleere, ereignisabhängige Varianten; prüfe Vorgänger und monotone Revisionen über die Ereignisfolge. Done braucht versionsgebundene Erfüllungsnachweise oder eine ausdrücklich autorisierte Abweichungsentscheidung. Ergänze genau diese Negativfälle.

### B3 – MAJOR: Snapshot/Archiv und Selbsttestgrenzen
Snapshot enthält Zähler und untypisierte optionale Arrays statt eindeutig fortschreibbarer Aufgaben-, Revisions-, Artefakt- und Blockadezustände. Archivereignisse sind beliebige Objekte; selbst [{}] wird akzeptiert. Definiere den vollständigen, typisierten Zustand am Cursor und verwende dasselbe kanonische Ereignisschema im Archiv.

R16b vergleicht zwei bereits im Fixture eingetragene Zustände. Beide können identisch falsch sein. R16c prüft nur behauptete Nullwerte für Seiteneffekte. Das beweist weder Reducer noch Nebenwirkungsfreiheit. Kennzeichne es als Fixture-Konsistenz. Für einen Daten-Nachweis darf ein kleiner reiner Referenz-Reducer Zustände aus Ereignissen berechnen; er ist keine Produktimplementierung. Falls dies den begrenzten Auftrag erweitert, liefere zunächst präzise Reduktionsregeln und markiere Ausführung NOT_TESTED statt sie zu behaupten.

R21 prüft lediglich zwei task_ids mit Zeitpunkten, keine Überlappung. Entferne die unbelegte Parallelitätsbehauptung oder prüfe tatsächlich belegte Start-/Endintervalle. Zeiten allein beweisen keine aktive Arbeitsdauer.

### B4 – MAJOR: Altlog-Adapter und Zielvokabular
V2 weist project_id/run_id als ausschließlich neu aus, obwohl AG-REPORT-001 sie bereits additiv als Batchkontext vorschlägt. Ereignisfelder des echten Altlogs (agent_id, platform, actual_model, actual_reasoning, Tokenfelder) werden teils abgelehnt oder verlagert. ownership_change verliert task_id/scope/basis.

Liefere einen expliziten, quellenerhaltenden Adaptervertrag oder kompatible Felddefinitionen. Unterschiedliche Ablageebenen müssen dokumentiert sein. Definiere catalog.changed vollständig oder entferne den Platzhalter.

### B5 – MAJOR: Kostenregel muss auch im Archiv gelten
Snapshot-Kostenfeld und Text entsprechen Peters jüngster Entscheidung. Archivkosten sind jedoch nur ein beliebiges Objekt; unvollständige Kosten mit Gesamtsumme werden akzeptiert.

Verwende dieselbe Kostenfelddefinition in Snapshot und Archiv. Das Feld bleibt sichtbar, bei unvollständiger Gesamterfassung ausschließlich „Kosten nicht vollständig ermittelbar.“ Keine Beträge, Teil-/Gesamtsummen oder Nullersatzwerte.

Die fiktiven Beispiele dürfen keine real vollständig belegten Gesamtkosten suggerieren. Markiere synthetische Fixtures klar und erhalte deren Testnatur getrennt von realen Projektdaten. Produktiv bleibt vollständig belegte Gesamterfassung unbestätigt. Für eine spätere vollständige Anzeige sind Abdeckungsnachweis, keine fehlenden Angaben und belastbare Kostenquellen erforderlich.

## Ausführungsnachweis Sentinel

Umgebung: Python 3.12.14. 15 Dateien isoliert aus den dokumentierten Blobs rekonstruiert; alle Git-Blob-Hashes bestätigt.
- python3 tests/AG-VISUAL-005-vertrag-v2-pruefen.py: 38 Form-, 59 Regelprüfungen, Exit 0.
- python3 tests/AG-VISUAL-005-vertrag-v2-gegenprobe.py: 21/21 erkannt, Exit 0.

Unabhängige Proben:
- minimal_work_event: ACCEPTED.
- hollow_done: ACCEPTED.
- hollow_review: ACCEPTED.
- empty_archive_event: ACCEPTED.
- archive_incomplete_cost_with_total: ACCEPTED.
- R21_nonoverlap_detected: False.
- R16b_wrong_claimed_state_detected: False.

jsonschema war nicht installiert; kein Standardvalidator ausgeführt, keine Installation. Kein Laufzeit-SSE. Isolierter Prüfbestand nach Abschluss entfernt, keine externen Seiteneffekte durch QA.

## Abnahmestand

01 Snapshot/Cursor: Fixture bestanden, Zustandsvollständigkeit offen.
02 Heartbeat: Datenbasis verbessert, exakter 20-s-Rand und tatsächlicher 5-s-Takt nicht abgesichert.
03 Reconnect: failed.
04 getrennte Ströme: passed als Fixture-Prüfung.
05 Done/Prüfreferenzen: failed.
06 Kosten: failed im Archiv; Snapshot korrekt.
07 Altlog/Zeitachse: failed für vollständige Schema-/Adapterabsicherung.
08 Rechte/Befehle: Fixture bestanden; serverseitige Durchsetzung NOT_TESTED.
09 Archivrekonstruktion: failed als Zustandsnachweis.

## Antworten auf O1–O7

O1: supported_actions bleibt für die bestehende Schnittstelle []: Es wurde kein ausführbarer integrierter Befehl nachgewiesen. Keine bedienbaren Steueraktionen anbieten. Dies blockiert Live-Beobachtung/Archiv nicht; der Befehlskanal bleibt Erweiterungsrahmen.
O2: Betriebsrahmen vor Verbindung konfigurieren/abfragen. Hosting-/Betriebsfreigabe bleibt separat.
O3: Konkrete Kapazität später betrieblich bestimmen; die korrekte Randsemantik ist jetzt festzulegen.
O4: Kostenforschung nicht wieder starten. Erfassungszeitpunkt hängt von tatsächlicher Quelle ab; vollständige Gesamtkosten nicht behaupten.
O5: Mehrere Läufe datentechnisch eindeutig adressieren; keine neue Prozessfreigabe für parallele Ausführungen ableiten.
O6: catalog.changed definieren oder vorerst entfernen.
O7: Agentarium und Partitur sollen denselben fachlichen Vertrag verwenden. Tatsächliche Verbraucherkompatibilität ist NOT_TESTED.

## Lieferung und Stop

Nur die fünf benannten Defektgruppen gezielt in V2.1 korrigieren. Bestehende Nachweise und V2 bleiben über ihre Blobs nachvollziehbar. Liefere Schemas/Fixtures, eng begrenzte Datenprüfungen und Status pro Befund mit Commit/Blob-Hashes. Keine neue Vollspezifikation, keine Infrastruktur, keine produktive Implementierung, keine kostenpflichtigen Läufe, kein Merge/Release/Deployment.
