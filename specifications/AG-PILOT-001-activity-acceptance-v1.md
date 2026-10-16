# AG-PILOT-001 – Aktivitätsnachweis V1
2026-10-16. Anforderung von Peter12:41/12:48 Europe/Berlin. Verbindliche Pilotabnahme im bestehenden Umfang, keine neue Architektur oder Betriebsfreigabe.
Statusanforderung verbindlich; Umsetzung/Quellenabdeckung noch nicht nachgewiesen.

## Fachliche Regel
Ein Auftrag beweist keine Ausführung. Prozess-alive, Transportheartbeat und ein unverändertes periodisches Progresssample beweisen keine Arbeitsaktivität.
Arbeit sichtbar machen heißt zunächst: beobachteten Streamfortschritt zeigen, nicht ununterbrochene Denkarbeit behaupten.
Zustände: working_observed/Aktivität beobachtet, waiting/Wartet, blocked/Blockiert, stopped/Ausführung beendet, unknown/Unbekannt.
Terminalfehler zeigt stopped mit outcome/problem; beendet bedeutet nicht angenommen/Done. Kanonische Aufgabenstatusänderungen bleiben ausschließlich beim bestehenden verifizierten Reducer.

## Belege und Grenzen
Echte separate Sentinel-Task AG-PILOT-001-ACTIVITY-TESTABILITY V1, /root/sentinel_interface_rereview: PASS_WITH_LIMITATIONS.
relay/claude_stream_diagnostics.py Progresscallback wird alle60s aufgerufen. Nur tatsächliche Änderungen in fachlich relevanten Streamzählern/last_event_seconds sind Aktivitätsbelege. Erstes Sample ohne Vergleichsbasis kann keinen Zuwachs beweisen.
Run38885877232: Progress bei60s, terminal nach69.621s; Run38886371918 endete nach43.174s ohne Zwischenmeldung. Dazwischen kein gesicherter Aktivitätsstatus aus öffentlich erhaltenen Metadaten.
ChatGPT-Subagenten haben beobachtbare Status-/Handbackgrenzen, aber hier keinen lückenlosen Streamaktivitätshook.
Explizites maschinenlesbares waiting/blocked fehlt als regelmäßiges Quellsignal. Ohne diesen Beleg unknown statt Warten erfinden.

## Nova – tatsächlicher visueller Beitrag
/root/nova_activity_monitor, AG-PILOT-001-ACTIVITY-VISION V1, NOVA_READY.
Empfohlen: zuschaltbarer platzreservierter Statusstreifen, keine Überdeckung. Kurzer Impuls je neuem Beleg; Warten mit Pausezeichen/Grund; Blocker mit Unterbrechung/Warnsymbol; Ende mit Schlussstrich/Zeit/Outcome; unknown mit unterbrochener Kontur/Fragezeichen/letztem Beleg. Farben nie alleinig. Replay nutzt Datenzeit.
Die erste technische lokale Statusseite ersetzt keinen Feldumbau; die spätere Feldintegration verwendet dieselben Zustandsregeln.

## Begrenztes Beobachtungsformat für lokalen Prototyp
Separate Quelldiagnostik, KEIN neues konkurrierendes Aufgaben-/Done-Modell:
{schema:agentarium.activity-observations.v1, observations:[...]}
Je Beobachtung: id, agent, session_id, task_id, observed_at(ISO8601 mit Zeitzone; tatsächliche Beobachtungszeit), evidence_ref, signal.
signal aus host_received, stream_sample, source_waiting, source_blocked, source_resumed, execution_stopped, transport_heartbeat.
stream_sample: elapsed_seconds,last_event_seconds,event_counts. Beobachtete Zählerentwicklung und Belegzeit separat speichern.
waiting/blocked brauchen reason. execution_stopped braucht outcome(success,failed,aborted) und bleibt für dieselbe Session terminal.
Nicht belegte Quellen bleiben unknown; keine geratenen Modelle/Zeiten/Kosten.

## Fünf Abnahmekriterien
A1 Zwei Samples derselben Session mit neuem Streamfortschritt => working_observed mit Quelldelta/Belegzeit.
A2 Nur Auftrag/Hostempfang/Alive/Heartbeat oder unveränderte Samples => kein neues working; nach Ablauf des letzten echten Belegs unknown. Heartbeat erneuert Arbeitsfreshness nicht.
A3 Nach explizit konfigurierter Aktualitätsgrenze ohne neuen Arbeitsbeleg => unknown, niemals automatisch waiting. Grenze ist Konfiguration, keine Echtzeitgarantie. 60s-Quellcadence muss sichtbar bleiben.
A4 Explizites aktuelles waiting/blocked mit Grund wird unterscheidbar; Funkstille bleibtunknown. Parallele Sessions getrennt; alte Session darf neue nicht färben.
A5 Ausführungsende success/failed/aborted stoppt Bewegung, Ergebnis bleibt sichtbar, Tasks werden nichtdone. Historische Wiedergabe bewertet Aktualität gegen gewählten Wiedergabezeitpunkt statt Wanduhr und löst keine Arbeit aus.

## Umfang des nächsten Forge-Schritts
Reine Ableitung und lokale Monitorseite im vorhandenen Python-Loopback-Prototyp. Normaler Seitenfluss ohne Overlay, Daten-/Verbindungszustand getrennt, alle nicht angebundenen Agentenunknown. Eingaben können echte archivierte Belege oder ausdrücklich synthetische technische Proben sein; Quelle sichtbar ausweisen. Keine automatische Runtimeerfassung behaupten.
Keine Änderung fachlicher Schemas/Reducer, Relays/Providerhooks oder Hauptfeldgestaltung. Keine Provideraufrufe aus Monitorbetrieb; keine Token-/Frame-Logs.
Ein echtes durchgängiges Live-Monitor-PASS bleibt bis zu Quellhooks und Feldintegration offen.
