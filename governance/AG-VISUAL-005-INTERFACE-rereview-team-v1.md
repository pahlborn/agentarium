# AG-VISUAL-005-INTERFACE – Team-Re-Review V1

Datum: 2026-10-15  
Projekt: pahlborn/agentarium  
Branch: claude/agentarium-visualisierung  
Geprüfter Commit: 54ab4785f993df7770c8dd35fd1a7d3749e20452  
Auftrag: AG-VISUAL-005-INTERFACE-REREVIEW  
Status: Dokumentenprüfung; keine Implementierungs-, Merge- oder Veröffentlichungsfreigabe

## Exakt geprüfte Artefakte

- handoffs/AG-VISUAL-005-INTERFACE-reply-v1.md, Blob 56fed8bda3768d42043be28e7f1f94e91d6d781d
- governance/AG-VISUAL-005-INTERFACE-review-v1.md, Blob 994cb2f89ef2c47418d6b232e8696305e5ee46ae
- relay/events/AG-PARTITUR-001-worklog-v1.json, Blob 957659ec0b2140473bb7a8a5da5d3ba264c10832
- governance/AG-REPORT-001-minimal-worklog-v1.md, Blob 5e495684ac6b3b4d06d2c9573cabde2c25917205

## Echte Teambeiträge

- Argus-Subagent /root/argus_interface_rereview  
  Signal: AG-VISUAL-005-INTERFACE-REREVIEW:RA:RA_REVIEW:V1  
  Verdict: PASS_WITH_NOTES
- Sentinel-Subagent /root/sentinel_interface_rereview  
  Signal: AG-VISUAL-005-INTERFACE-REREVIEW:SENTINEL:QA_REPORT:V1  
  Verdict: FAIL für Testbarkeit; keine Laufzeitprüfung

Die Verdicts widersprechen sich nicht: Argus hält die fachliche Richtung für tragfähig. Sentinel bestätigt, dass daraus noch kein ausführbarer und objektiv abnehmbarer Vertrag entstanden ist.

## Konsolidiertes Ergebnis

Die Antwort enthält wichtige Korrekturen und wird als Arbeitsgrundlage akzeptiert. Sie ist noch nicht der Schnittstellenvertrag V2. Vorschläge und offene Fragen müssen in eindeutige Anforderungen, Zustände, Schemas und Beispieldaten überführt werden.

### 1. Projektentdeckung und Ereignisströme

Die Lücke ist bestätigt: Ein ausschließlich projektbezogener Strom kann die Entstehung eines noch unbekannten Projekts nicht ankündigen.

Festlegung für V2:

- Ein kleiner Team-Lifecycle- beziehungsweise Katalogstrom meldet project.created, run.started, run.finished und relevante Katalogänderungen.
- Nach project.created existiert die project_id. Fachliche Arbeitsereignisse laufen anschließend im Strom des Projekts beziehungsweise Laufs.
- Jeder Strom besitzt seinen eigenen monotonen stream_sequence- und Replayraum.
- project_id und run_id stehen in jedem fachlichen Ereignis.
- Ein gemischter Gesamtstrom aller Arbeitsereignisse ist für V2 nicht erforderlich. Falls er später ergänzt wird, benötigt er eine eigene globale Teamsequenz.

Damit wird ein neues Projekt sichtbar, ohne alle Projektdaten und Cursor in einem einzigen Strom zu vermischen.

### 2. Live, Archiv, Simulation und Steuerung

Die Darstellung bietet keine frei kombinierbaren Betriebsart-Schalter.

- Ein nicht terminaler Lauf öffnet in aktueller Live-Beobachtung.
- Ein terminaler Lauf öffnet als Archivwiedergabe.
- Simulation beziehungsweise fictional beschreibt die Herkunft und bleibt unabhängig sichtbar.
- Aktive Steuerung ist eine Berechtigung, keine Darstellungsart.
- Ein Nutzer darf Projekt und Lauf auswählen; er darf einen archivierten Lauf nicht in angebliches Live umetikettieren.

V2 definiert mindestens geplant, aktiv, wartend, pausiert, blockiert, abgeschlossen, abgebrochen, fehlgeschlagen und wiedereröffnet sowie die zulässige Darstellung und Befehlsfähigkeit je Zustand.

### 3. Authentifizierung und Reconnect

Die empfohlene einmalige, an genau eine Verbindung gebundene URL-Eintrittskarte wird nicht übernommen. Native EventSource-Wiederverbindung verwendet dieselbe URL erneut; ein verbrauchtes Ticket könnte dadurch den Reconnect sperren. URL-Tokens können außerdem in Protokollen erscheinen.

Festlegung:

- Bei kontrolliertem gleichen Ursprung: sichere Sitzung über HttpOnly-, Secure- und geeignete SameSite-Cookies.
- Wenn dieser Betriebsrahmen nicht möglich ist: fetch-Streaming mit Authorization-Header und ausdrücklich implementiertem Cursor- und Reconnect-Verhalten.
- V2 beschreibt Last-Event-ID, SSE-id-Framing, Replaygrenzen, Fehlerantworten und Snapshot-Reconciliation vollständig.

### 4. Lebenszeichen

Zwei technische Zwecke werden getrennt:

- SSE-Kommentarzeilen dürfen als Transport-Keepalive verwendet werden.
- Die Oberfläche erhält zusätzlich ein flüchtiges heartbeat-Ereignis, damit sie den letzten tatsächlichen Empfang messen kann.

Festlegung für V2:

- heartbeat alle 5 Sekunden;
- nach 20 Sekunden ohne empfangenes Lebenszeichen Status veraltet beziehungsweise Verbindung unklar;
- keine Persistierung;
- keine Fachereignis-ID;
- keine Arbeits- oder Transportsequenz;
- kein LLM-Aufruf;
- kein Eintrag im Replaypuffer fachlicher Ereignisse.

### 5. Zeitachse historischer Läufe

Das Archivmanifest erhält zeitachse mit complete, partial oder none und einer belegten Ableitungsregel.

- complete: die für die Wiedergabe erforderlichen Ereigniszeitpunkte sind innerhalb der angegebenen Abdeckung vorhanden.
- partial: mindestens ein benötigter Ereigniszeitpunkt fehlt.
- none: keine belastbare Ereigniszeitachse ist verfügbar.

Bei partial und none darf keine proportional zeitbasierte Wiedergabe reale Dauer oder Parallelität behaupten. Die Darstellung wechselt in eine sichtbar bezeichnete Schrittfolge. Auch bei complete belegen Ereigniszeitpunkte verstrichene Zeit, nicht automatisch aktive Arbeitsdauer.

### 6. Projekt und Lauf

- project_id bezeichnet die dauerhafte Projektklammer.
- run_id bezeichnet eine einzelne Ausführung innerhalb des Projekts.
- Archiviert und wiedergegeben wird ein Lauf.
- Ein Projekt kann mehrere aktuelle und historische Läufe besitzen, soweit der Prozess dies zulässt.

### 7. Feldvokabular

Die Rücknahme des Feldes erledigt ist richtig. Eine Lieferung, ein Reviewpass oder ein Testpass setzt keine Aufgabe automatisch auf Done. Done entsteht nur durch einen expliziten, revisionsgebundenen Statuswechsel mit den erforderlichen Nachweisen.

Die Feldtabelle in V2 muss unterscheiden:

1. heute im geprüften observed-worklog tatsächlich vorhanden;
2. in AG-REPORT-001 additiv vorgeschlagen;
3. im neuen Schnittstellenvertrag verbindlich festgelegt.

Heute vorhanden sind unter anderem actor, recipient, kind, task_id, parent_task_id, caused_by, occurred_at, recorded_at, ownership_change, result_ref, mode, fictional und source_evidence.

Additiv vorgeschlagen, im geprüften Acht-Ereignis-Worklog aber noch nicht vorhanden, sind unter anderem run_id, artifact_id, version, question_id, reply_to, supersedes, corrects, block_id, resolving_event_id, criteria_ref und outcome.

### 8. Nur-Lesen und Steuerung

Eine Nur-Lesen-Berechtigung wird verbindlich aufgenommen.

- Beobachtung benötigt read.
- Befehle benötigen getrennt command sowie die bestehenden fachlichen Freigaben.
- Wand- und Präsentationsansichten sind nur lesend.
- Der Server lehnt einen Befehl ohne command eindeutig und ohne fachliche Nebenwirkung ab.
- Das Ausblenden einer Schaltfläche allein gilt nicht als Rechteprüfung.

### 9. Kosten

Peters jüngere Entscheidung gilt:

- keine Kostenwerte;
- keine Gesamtsumme;
- keine leere Kostenkachel;
- unbekannte Kosten niemals als null;
- vorhandene Nachweise bleiben intern erhalten.

Ein technischer Informationsbereich darf den Zustand mit folgendem Text benennen:

„Kostenanzeige pausiert – Gesamtkosten derzeit nicht vollständig ermittelbar.“

Dies ist keine Kostenanzeige im eigentlichen Agentarium-Bild.

## Testbarkeitsurteil

Noch keiner der sieben bisherigen Sentinel-Abnahmefälle ist vollständig ausführbar. V2 muss Schemas und zusammengehörige Beispieldaten liefern für:

1. Einstiegssnapshot mit anschließendem Live-Strom;
2. Heartbeat und Veraltet-Zustand;
3. Reconnect innerhalb und außerhalb des Replaypuffers;
4. zwei Projekte mit mehreren Läufen, getrennten Sequenzen, Duplikaten und Nachzüglern;
5. parallele Aufgaben sowie exakt versionierte Artefakte, Reviews und QA;
6. pausierte beziehungsweise unvollständige Kostenerfassung ohne irreführende Werte;
7. Altlogs mit fehlendem occurred_at ohne erfundene Zeiten oder Dauern;
8. Nur-Lesen gegen erlaubte und unerlaubte Befehle;
9. Archivwiedergabe und Zeitsprung ohne externe Nebenwirkung.

Jeder Nachweis wird als spezifiziert, implementiert, getestet oder blockiert gekennzeichnet. Dokumentenprüfung ist kein Laufzeitnachweis.

## Nächster Schritt

Der Schnittstellenagent erstellt einen exakt versionierten Vertrag V2 samt Schemas und Beispieldaten. Danach erfolgen Argus-Delta-Review und Sentinel-Testbarkeitsprüfung gegen genau diese Fassung. Erst eine spätere Implementierung ermöglicht Laufzeit-QA.

Keine Architektur, Implementierung, Bereitstellung, Merge- oder Veröffentlichungsentscheidung wurde mit diesem Re-Review freigegeben.
