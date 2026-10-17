# AG-PILOT-001 – Aktivitätsmonitor, Abschluss V2
2026-10-16 · Atlas.
Status COMPONENT_LOGIC_RUNTIME_PASS / BROWSER_NOT_TESTED / END_TO_END_NOT_READY.
Arbeitsbranch feature/ag-interface-k3-final, Liefercommit 22ee82b48239082eca89a533db4645a9dc16d523. Kein Merge, Release, Deployment oder gestarteter echter Pilot.

## Ergebnis und Umfang
Evidenzbasierte lokale Zustandsableitung und technische Monitorseite sind implementiert.
- working_observed nur bei Zuwachs relevanter stream_event/assistant/user-Zähler in derselben Agent/Session/Task-Kombination. System-/Timer-/Telemetriezähler und last_event_seconds allein reichen nicht.
- Auftrags-/Hostempfang oder Verbindung liefern keinen Arbeitsnachweis.
- Explizite aktuelle Waiting-/Blocked-Signale brauchen einen Grund. Silence/abgelaufene Belege=>unknown.
- Resume löscht alten Arbeitsbeleg; allein daraus wird keine Arbeit.
- Ausführungsende bleibt stopped(success/failed/aborted); kein fachlichesDone.
- Acht kanonische Rollen und getrennte Sessions; nicht angebundene Quellenunknown.
- remaining_valid_ms und lokale monotone Browser-Ablauflogik; auch ohne erfolgreichen Folgeabruf soll aktive Anzeige auslaufen. ARCHIVE verwendet Datenzeit stattWanduhr.
- Transporterreichbarkeit separat. Keine Beträge im Kostenfeld.
Die JS-Ablauflogik wurde statisch geprüft, NICHT in einem echten Browser ausgeführt. Daher keine durchgängige optische Zusage.

Neu: activity.py, activity.html; enger Anschluss an local_transport.py; README.
GET/activity und /monitor im vorhandenen Loopback-Testserver. Explizite optionale --activity-input und --activity-fresh-ms; Konfiguration ist KEINE Echtzeitgarantie.
Hauptfeld Gewebe/Partitur und tatsächliche Providerhooks wurden nicht verändert.

## Echte Rollenbeiträge
Nova /root/nova_activity_monitor, AG-PILOT-001-ACTIVITY-VISION V1, NOVA_READY: platzreservierter Statusbereich, einmalige Belegimpulse, Pause-/Warn-/Ende-/Fragezeichen, kein unbelegtes Dauerarbeiten.
Sentinel /root/sentinel_interface_rereview: AG-PILOT-001-ACTIVITY-TESTABILITY V1, anschließend unabhängige QA V1/V2 und QA_ADDENDUM V2.
Atlas: Auftrag/Abnahme/Quellen zusammengeführt; vollständiges Rollenregister im Korrekturinput ergänzt. Zwei rein redaktionelle README-Stellen msg→stream_event korrigiert, keine eigene Produktcodeänderung.

Forge V1:
- Run https://github.com/pahlborn/agentarium/actions/runs/38890028971
- Session d9d5ef20-4dfb-496c-8174-441a90af03f4
- Ergebnis https://github.com/pahlborn/agentarium/issues/2#issuecomment-6213943285
- error_max_turns, keine erfolgreiche Abschlussmeldung. Vier erlaubte Dateien/keine Fremdpfade; Patch erhalten.
- Originalpatch SHA256 ae90437d6be200bc139dee46164085e39697a46fa32387e56020c7af2f062a48
- Unabhängige V1-QA FAIL11/14 bei Transport18/18; Historie governance/AG-PILOT-001-activity-qa-v1.md.

Forge V2:
- Run https://github.com/pahlborn/agentarium/actions/runs/38890845816
- Session3ba53364-aa95-4ab7-990c-a23e77da4a99, WorkerSUCCESS.
- Ergebnis https://github.com/pahlborn/agentarium/issues/2#issuecomment-6214054273
- Deltapatch SHA25666786b8a121688e03bf71c0ac455a5f9e5b561de7588f9b58db6746090052e57
Beide tatsächlichen Modelle laut CLI claude-sonnet-5-5; tatsächlichesReasoning unbestätigt. Definition0dcac59d22c27753f111fb1ad79f5a9be524052a, CLI2.1.301.
Kein bezahlter Verfügbarkeitsprobeaufruf, keine automatische Wiederholung desselben Taskdatensatzes.

## Unabhängige Abnahme
Aktivitätsprobe14/14, Transportregression18/18, py_compile und HTTP/activity,/monitor,POST405 bestanden.
V2-Sonderproben ursprünglich5/6; einziger Fehler war README mit falschemmsg-Beispiel, Code selbstgrün.
Atlas korrigierte ausschließlich2Dokutextstellen. Sentinel las sie separat nach, bestätigte Codebytegleichheit und gab SENTINEL:QA_ADDENDUM:V2 PASS. Keine neue volle Testrunde.
Echte Browser-DOM-/DarstellungsprüfungNOT_TESTED: Playwright vorhanden, Browserbinary nicht vorhanden; keine Installation/öffentliche Bereitstellung. Keine Cloudbrowserprüfung ausgeführt.
Alle Testserverprozesse bereinigt.

## Reale Beobachtungsdaten
relay/events/AG-PILOT-001-activity-observations-v1.json enthält echte publizierteForge-Samples bei60/121s und terminales error_max_turns. Retrospektiv aus tatsächlichen Nachweisen zusammengestellt.
observed_at ist ausdrücklich GitHub-Publikationszeit, keine behauptete exakte Quellereigniszeit. Diese Erfassung belegt keine garantierte Liveverzögerung.
Sentinel: bei zweiter Publikation2026-10-16T10:54:15Z =>working_observed; nach terminaler Publikation10:54:59Z =>stopped/failed; übrige7Agentenunknown.
Keine simulierten Agentenantworten. Synthetische technische Fehlerproben sind davon getrennt.

## Fixierte Dateiblobs
- pilot/AG-PILOT-001/README.md: b8dff1bb1f0bf30c8fe3fb1c6db223c91dc4e709
- pilot/AG-PILOT-001/activity.html: 73db2b0fce92cd482712215ab7ebd07f3e2a0ca3
- pilot/AG-PILOT-001/activity.py: fac2c7831b89c5e09178fb3ef9664751f79c9b48
- pilot/AG-PILOT-001/local_transport.py: 77b2ca879133a40f299fd5e4450578bffa47860a
SHA256:
- activity.py5a5401593a2d8962449ba8cdd433716b5aabe37673c1e3a9a43a6d507d601aa8
- activity.htmlc9d17fbdef21972e247ddc781e6ecdc6375c6ba8fe61c8ab8b9ec1015f1173a2
- local_transport.pye88ef5b4696254debfaac3b3b6a2514b2108a33787adb2feaf8641fdcfebbc71
- README876083d4090d03564f338d0e070d754f91e9f6b030342feca80886d7005504ea

## Verbrauch
V1lautCLI0.3843575USD: input18/output27697/cache-read105215/cache-creation38732/thinking6134.
V2lautCLI0.2088191USD: input16/output13026/cache-read86446/cache-creation27953/thinking2503.
Diese2Aufrufe zusammen0.5931766USD. Nicht rechnungsabgeglichen, kein Projektgesamtbetrag; Thinking nicht nochmals zuOutput addieren. ChatGPT-/andere unbekannte Kosten nicht als0 angenommen.
Die redaktionelle Korrektur verursachte keinen weiteren Anthropic-Aufruf.

## Noch offen, maßgeblich für P10
AF1–AF4 für diese Komponente geschlossen; echte optische Endabnahme noch offen.
- Ausführbare Browserprüfung und Einbindung in vorhandenes Agentarium-Feld.
- Automatische belegte Start-/Aktivitäts-/Waiting-/Blocked-/End-Hooks je Runtime. Der vorhandene60sProgresscallback ist keine vollständige Erfassung; insbesondere ChatGPT und explizitesWaiting fehlen.
- Erfassungsabdeckung/Verzögerung im Monitor ehrlich zeigen; Aktualitätsziel messen statt behaupten.
- Dauerhafte Journalsicherung/Archivierung und private Zugriffe nachweisen; lokaler Testdatenträger ist keine Betriebsfreigabe.
Kein eigener zentraler Server wird vorausgesetzt. Die Browseranzeige läuft beim Betrachter; die Ereignisse müssen trotzdem aus den arbeitenden Umgebungen zuverlässig bereitgestellt werden.
P10 bleibt END_TO_END_NOT_TESTED und AG-PILOT-001 PREPARED_BLOCKED. KomponentenPASS ist keine Pilotbereitschaft.
