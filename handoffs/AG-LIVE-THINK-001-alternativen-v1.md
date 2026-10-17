# AG-LIVE-THINK-001 — Ziel und Denkalternativen V1
Status: DECISION SUPPORT / NO IMPLEMENTATION. 2026-10-17.
Repository baseline: 55bb6997503284cfb77c0a50bb4905240b3b13b4.
Team task activation: 37ab240bc9ef3134eb95e84575ba99af9c49bf35.
Atlas consolidates the actual separate contributions below; no unanimous adoption or operational readiness is claimed.

## Ziel
Ein bereits geöffneter ORIGINAL-Agentarium-Monitor zeigt tatsächliche Teamarbeit annähernd zum Zeitpunkt ihres Geschehens: Aufträge, Übergaben, Kommunikation, beobachtbare Ausführung, belegtes Warten, Probleme und Abschluss. Arbeit entsteht unabhängig vom Monitor. Ein fehlender oder veralteter Beobachtungskanal muss erkennbar sein. Das bestehende Produkt bleibt die Oberfläche.

Peter hat keine feste Fünf-Sekunden-SLA vorgegeben. Atlas' früherer Fünf-Sekunden-Testvorschlag wird nicht als Peter-Anforderung weitergeführt. Pages-Deploymentzeiten sind kein geeigneter Ersatz für Live-Transport. Das Ein-Ereignis-MVP beweist nur einmalige Datenannahme und Anzeige.

## Tatsächliche Beiträge
- Nova: /root/nova_live_goal_alternatives, create-vision-with-nova; erster Beitrag plus freie Ergänzung. Ein gemeinsames echtes Übergabewerkzeug könnte Kommunikation gleichzeitig ausführen und aufzeichnen, statt zusätzliche Erzählberichte zu verlangen. Seine Fähigkeit, die tatsächlichen Work-Agenten zu steuern, ist nicht nachgewiesen.
- Scout: /root/scout_ten_events_transport, build-research-knowledge; tatsächliche Quellenprüfung Work-Toolvertrag, Claude-Hooks/SDK, OpenAI Agents SDK. Keine vollständige Work-Telemetrieschnittstelle im heutigen Toolvertrag belegt.
- Argus V1: /root/argus_pilot_recovery, review-agent-argus; korrigiert falsche starre Fünf-Sekunden-Anforderung und Schlussfolgerung Dauerquote = jeder begrenzte Versuch unmöglich.
- Sentinel: /root/sentinel_one_real_event_mvp, qa-agent-sentinel; reine Testbarkeitsprüfung, keine ausgeführten Tests. Unterbrechung des Beobachtungswegs bei weiterlaufender Arbeit muss stale/unbekannt ergeben, nicht inaktiv.
- Forge: tatsächlicher separater Claude-Code-Lauf39010014333, Session5395c67d-c99c-48f1-9389-62a0fe6fe17a. Advice; keine Änderungen/Tests. Zieht frühere Verengung zurück; schlägt vier Routen vor und empfiehlt Host+Atlas-Quelle über GitHub-Abruf.
- Argus V2: /root/argus_live_unconstrained, review-agent-argus; nach tatsächlichem Nutzungslimitfehler und Peters Mitteilung der Aufhebung erfolgreich zurückgekehrt. Bestätigt eigene echte Zwischenmeldung und eigenen GitHub-Lesezugriff während der Prüfung. Korrigiert Forge: spawn ist nicht als blockierend vorauszusetzen, Work ist nicht ausschließlich Atlas-Start/Ende. GitHub-Pull mit ungeprüfter Minutenlatenz wird nicht zur zielgerechten Empfehlung erklärt.

Quellenindex:
- handoffs/AG-LIVE-THINK-001-team-input-v1.md (Atlas-Digest der tatsächlichen ersten Beiträge)
- handoffs/AG-LIVE-THINK-001-forge-request-v1.json
- handoffs/AG-LIVE-THINK-001-forge-handback-v1.md (originaler Kommentar)
- https://github.com/pahlborn/agentarium/issues/2#issuecomment-6230703261
- handoffs/AG-LIVE-THINK-001-argus-review-v2.md (Transkript mit normalisierter Typografie/Quellenformatierung)

## Neue entscheidungsrelevante Erkenntnisse
1. Statisch ausgelieferte Oberfläche erfordert keinen statischen Datenweg. Ein Empfangsadapter kann die vorhandenen Hooks bedienen; dies ist noch keine implementierte Verbindung.
2. Quelle und Zustellweg sind getrennte Voraussetzungen. Ein neues SSE/WebSocket-System erzeugt keine fehlende Laufzeitbeobachtung.
3. Reale Work-Kinder können Atlas Zwischenmeldungen schicken; Argus hat dies tatsächlich getan. Sein GitHub-Lesen beweist keine Schreibberechtigung oder Volltelemetrie.
4. Auftrag angenommen/laufender Run, Werkzeugaktivität, Selbstauskunft und fachlicher Fortschritt sind verschiedene Nachweise. Ruhige Berechnung, Warten, Blockierung und Verbindungsverlust dürfen nicht aus Schweigen erraten werden.
5. GitHub-Schreibfähigkeit ist bereits belegt. Automatische Webhook-Zustellung bis ins offene Original ist noch nicht belegt.
6. Forges Frage nach einem blockierenden spawn ist keine belastbare Entscheidungsschwelle. Seine Quellenlage zu Host/Monitor war laut eigenem Bericht teilweise nur das Handoff; Aussagen werden nicht zu eigenen Laufzeitbeobachtungen hochgestuft.

## Drei vollständige Betriebsrichtungen — Vorschläge
| Richtung | Quelle → Publikation → Transport → Original | Vorteil | Voraussetzung / Grenze |
|---|---|---|---|
| 1. Bestehenden GitHub-Anschluss als Eingang nutzen | Echte Work-Zwischenmeldungen/Atlas-Orchestrierung und Claude-Host-Hooks oder Stream → strukturierte GitHub-Einträge → Repository-Webhook → kleiner Ereignisempfänger mit Browser-Abonnement → vorhandene Original-Hooks | Heutige Umgebungen und bereits benutzter Schreibanschluss bleiben; keine Pages-Veröffentlichung pro Ereignis | Neuer erreichbarer Empfänger, Webhook-Konfiguration und Empfangsadapter nötig; Zustellverzögerung und Quellenabdeckung ungemessen; kooperative Work-Meldungen |
| 2. Gemeinsamer direkter Werkzeuganschluss | Tatsächliche Agentenaktionen/-meldungen plus Claude-Hooks → zugelassenes BALL-Tool/MCP → Ereignisempfänger → Browser-Abonnement → Original-Hooks | Kürzerer Datenweg; GitHub kann Archiv bleiben; konkrete Übergaben könnten selbst Ereignisse erzeugen | Nutzbarer zugelassener Toolanschluss in den echten Runtimes nachzuweisen. Ein report-Tool führt nicht automatisch einen Work-spawn aus. Keine lückenlose automatische Work-Beobachtung behaupten |
| 3. Ausführung in einen beobachtbaren Kern verlegen | Ausführende GPT-/Claude-Rollen in kontrollierten SDK-Runs → Runner-Ereignisse und Toolgrenzen → gemeinsamer Ereignislog/Verteiler → Original-Hooks | Umfassendere, gleichförmige technische Beobachtung der dort ausgeführten Arbeit | Größerer Eingriff in Betrieb/Tools/Skill-Integration, API-Nutzung und Host nötig. Nicht automatisch Zugriff auf heutige Work-Sitzung. Work könnte ggf. Steueroberfläche bleiben; Anbindung offen |

Claude-Hooks und CLI-Streaming sind dokumentierte Quellenoptionen, heute aber nicht als durchgängig installierte Erfassung nachgewiesen. OpenAI SDK-Streaming ist eine andere Ausführungsumgebung, kein Export dieser Work-Sitzung.

Weitere diskutierte Alternative: begleitete Browsersteuerung des Originals ohne neuen Empfänger. Argus nennt sie als Demonstrationsweg, ausdrücklich nicht als dauerhaften Betrieb. Atlas wird manueller Transport; aktueller Browser-Schreibzugriff ist nicht geprüft und verfügbare Automationsregeln sind zu beachten. Atlas empfiehlt sie nicht zur Erfüllung des Dauerziels.

## Atlas' Entscheidungsempfehlung — keine Aktivierung
Für das bestehende Team Richtung1 zuerst konkret bewerten, Richtung2 als direkteren Zielweg offenhalten. Richtung3 ist die bewusste größere Entscheidung, falls gleichförmige automatische Erfassung aller ausführenden Rollen erforderlich ist.
Forges Empfehlung von GitHub-Pull mit ungeklärter möglicherweise minutenlanger Latenz wird NICHT als Erfüllungsweg übernommen.
Anbieter und Hostingstandort sind nachgelagerte Betriebsentscheidungen. Auch lokale Empfänger benötigen einen erreichbaren, geeigneten Weg von den entfernten Laufzeiten zum geöffneten Browser; bloßes localhost des iPads verbindet keine entfernten Agenten.
Alle drei Richtungen benötigen einen erreichbaren Empfangspfad, nicht notwendigerweise einen von Peter zu administrierenden eigenen Server.

## Entscheidender noch fehlender Nachweis
Eine echte Zwischenmeldung eines noch arbeitenden Work-Kindes durchläuft den gewählten vollständigen Weg und erscheint ohne Neuladen im Original. Erzeugung, Publikation und Empfang/Anzeige werden getrennt gemessen. Beobachtungsabbruch wird kenntlich. Diese Probe ist vorgeschlagen, NICHT ausgeführt und aktuell nicht als Umsetzung beauftragt.

## Rechte und belastbare Quellen
- GitHub issue_comment-Webhooks für echte Kommentarereignisse sind dokumentiert: https://docs.github.com/en/webhooks/webhook-events-and-payloads#issue_comment
- Create repository webhook benötigt laut aktueller REST-Dokumentation Webhooks repository permissions(write): https://docs.github.com/en/rest/repos/webhooks#create-a-repository-webhook
- Die dokumentierten10Sekunden sind eine Antwortfrist des Empfängers nach Empfang, keine Zusage der Zustelllatenz: https://docs.github.com/en/webhooks/using-webhooks/handling-webhook-deliveries
- Unser derzeitiger Connector bietet keine entsprechende Konfigurationsmutation. Keine Rechteänderung oder Webhook-/Empfänger-Einrichtung erfolgt.
- https://code.claude.com/docs/en/hooks
- https://code.claude.com/docs/en/agent-sdk/hooks
- https://code.claude.com/docs/en/headless
- https://openai.github.io/openai-agents-python/streaming/
- https://openai.github.io/openai-agents-python/tracing/
- https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events

## Modell- und Kostenwahrheit
Forge: task-only requested best/xhigh; CLI2.1.302 modelUsage bestätigt claude-fable-5-1. Tatsächlicher Reasoning-Modus unconfirmed. KostenUSD0.6908817500000001 laut CLI-JSON, nur dieser API-Beratungslauf. Keine Aussage zu vollständigen Projektkosten.
ArgusV2: angefordert gpt-6-astra/xhigh über fork_turns=none. Laufzeitwerkzeug weist kein unabhängiges actual_model/Verbrauchsfeld aus; diese Werte bleiben unconfirmed. Frühere geerbte ChatGPT-Rollen werden nicht nachträglich als Premium-Modelle etikettiert. Keine kostenpflichtigen Modellbenchmarks.
Keine Produktimplementierung, Tests, Merge, Veröffentlichung oder neue Betriebsinfrastruktur in diesem Denkauftrag. Task-/Relay-/Nachweisdokumente wurden auf dem Arbeitsbranch gespeichert.

Nächster Eigentümer: Atlas legt Peter die Denkalternativen und Empfehlung vor. Materiale Betriebs-/Architekturwahl und Umsetzung bleiben offen.
