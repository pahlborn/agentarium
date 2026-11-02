# AG-LAUFZEIT-001 / Architekturauftrag V1
Peter, 02.11.2026. Quellenstand main 37f6a5e2b3d3daebc197602c2161f5ffb46bb953. Task AG-LAUFZEIT-001-02, parent AG-LAUFZEIT-001, project agentarium, logical run AG-LAUFZEIT-001.
Originalauftrag und Rückgabe: https://github.com/pahlborn/agentarium/issues/115#issuecomment-6579203613
Freigabe: https://github.com/pahlborn/agentarium/issues/115#issuecomment-6579421622

## Ziel und Freigabe
Monitor-Arbeitseffekte nur für tatsächlich laufende Rollen, keine Übergabe=Arbeit-Ersatzregel. Die echte Startstelle muss start/end aus eigener Laufzeitbeobachtung erzeugen, source_evidence runtime_stream plus konkreter überprüfbarer Laufbezug. Keine als Rollen-Eigenmeldung verkleidete Fremdmeldung.
Gesamtes abgegrenztes Forge-Paket: Schätzung 5–8 USD, Peter erlaubt insgesamt10 USD über alle Versuche. Dieser einzelne Architekturversuch: explizite Aktivierung, maximal1.50 USD/8Turns. Keine eigenen kostenpflichtigen Unterläufe. Keine Monitoränderung; keine Umsetzung in diesem Architekturauftrag.

## Deine Rolle / Artefakt
Du bist tatsächlicher Claude-Worker coding-agent / Forge, technischer Owner des Relais, im Modus Architektur/Beratung. Rollenprofil .claude/agents/coding-agent.md, Blob1ebe72cd8de89f3aa0f9ca4272fb1e89ae3e187f an obiger Baseline.
Prüfe zuerst die bestehenden Dateien, entscheide technische Route selbst und widersprich Atlas begründet bei falschen Annahmen. Liefere einen kleinen implementierbaren Schnitt oder einen genauen Blocker. Keine Zustimmung erfinden.
Einziger beschreibbarer Pfad: handoffs/AG-LAUFZEIT-001-forge-architecture-handback-v1.md. Der Host hat ihn bereits mit exakt "# Handback\n" angelegt; ersetze diesen Inhalt mit Edit durch deinen Ergebnistext. Ein reiner Chattext ohne geänderte Handback-Datei wird vom aktuellen Relais als unvollständig abgewiesen.
Kein Bash/Test/Patch-Ausführen, kein GitHubzugriff oder Spawning. Du hast Read/Edit im isolierten Bundle; keine Nutzung hypothetischer Tools. Du darfst im Ergebnis konkrete Patch-/Vertragsvorschläge als Text liefern, aber in diesem ersten Schritt ist ein präziser Architekturentscheid wichtiger als Code.

## Enge Fragen
1. Wo genau beweist die aktuelle CLI echte Workerarbeit? Hostempfang, Workflowstart, Popen, system/init und bloße Sessionexistenz sind nicht automatisch Arbeitsnachweise. Identifiziere die kleinste belastbare normale Start-/Endbedingung und die Fehlersignale; Dokumentations-/Versionsannahmen markieren.
2. Wie gelangen sichere Echtzeitsignale aus dem derzeit GitHub-schreibrechtlosen run-Job während des laufenden Workers zum vertrauenswürdigen Publisher? Der aktuelle publish-Job beginnt erst danach. Vergleiche den einfachsten tragfähigen Weg und maximal eine Alternative. Kein GitHub-Token im Worker, keine stillschweigende Rechte-/Secret-/Infrastrukturänderung; gleiches Betriebssystembenutzerkonto plus bereinigte Environment ist allein keine robuste zusätzliche Prozessisolation.
3. Was kann bestehender Repositorycode an der nativen ChatGPT-Lücke leisten, was braucht einen tatsächlich verfügbaren Plattformvertrag? Argus /root/argus_laufzeit hat in dieser Sitzung spawn/status/final-Rückgabe beobachtet; eine automatische externe Callback-/Exportstrecke sowie originale Start-/Endzeiten sind in den sichtbaren nativen Tools nicht nachgewiesen. Keine Migration dieser Rollen als Lösung ausgeben. Lot bleibt ausschließlich Peter-started.
4. Vorschlag für klar versionierten Produzentenvertrag: Arbeitsrolle vs wahrer Reporter/Startstelle, Projekt/Task/parent/logical-run vs GitHub-run, eindeutiger Versuch/Session, überprüfbarer Laufbeleg, Original-/Empfangszeit, start und genau ein terminales Ergebnis. Früheren Start bei späterer Safety-Blockade nicht verlieren, Geheimnisse schützen, fehlendes Ende unbekannt lassen. Neue Felder nicht voreilig in den heutigen streng validierten V1-Monitorkanal schreiben.
5. Minimaler zusammenhängender Implementierungsumfang, betroffene Dateien/Rechte, kleinster realer Quelle→Journal-Nachweis, gezielte Fehler-/Gegenprüfungen. Bestätige/korrigiere5–8USD Gesamtschätzung unter10USD. Wenn neue Infrastruktur oder unbekannte Hostrechte nötig sind, STOP mit präziser Entscheidung, statt einen Zwischenbehelf als Lösung zu präsentieren.

## Geprüfter Ausgangspunkt
relay/claude_public_relay_v2.py Blob782298a11ef95fa2ab22c5b2ccdea9d82ca274e2: ag_block ohne reporter/lifecycle, Host/Terminal fälschlich auf forge festgelegt, logical run_id bisher Workflow-ID. Der Worker liest stream-json, verarbeitet nur result. Im Fehlerpfad verschwinden Session/Nutzung/Kosten. ROLES kennt coding/spec/process-agent.
Workflow Blobd1d258c2c42ca3a9a4c98718356bd11b96518edf: prepare(issues write), run(kein issueswrite/keinGHtoken), publish(issueswrite erst nachrun). Autorisierte Aktivierung ausschließlich eigener Add-only-Commit.
Offizielle aktuelle Primärdokumentation von Atlas gelesen: https://code.claude.com/docs/en/headless und https://code.claude.com/docs/en/hooks. stream-json liefert init/result. --bare überspringt automatische Hooks. Das ist Dokumentation, kein eigener Runtime-Nachweis. Der vorhandene Pin ist in der Workflowdatei maßgeblich; keine Aktualisierung ohne Grund.

## Ausgabe und Stopp
Schreibe <=1100 Wörter in den Handback: CA_ADVICE / FEASIBLE_WITH_CHANGES oder BLOCKED; bestätigte Fakten mit Datei/Funktion; klare Route, Voraussetzung, kleinster Nachweis, Schnitt/Prüfungen, korrigierte Kosten; entscheidende Gegenposition. Tatsächliche selbst ausgeführte Tests: NOT_RUN (kein Shelltool).
Keine Agentarium-Kontrollmarker und kein JSON-Ereignis in den Handback, auch nicht als Beispiel. Die Relay-Sicherheit blockiert solche eingebetteten Sequenzen. Fachlich erklärt reicht.
Stoppe danach. Kein unbeaufsichtigter Folgelauf, keine Abnahme/Publikation behaupten.

## Anwendbare Regeln im Wortlaut (Rulebook/Process1.4 @37f6a5e2b3d3daebc197602c2161f5ffb46bb953)
> Peter starts Lot exclusively; Lot builds only the monitor. Forge owns other assigned technical work, including the relay.
> A role profile is not a running agent; connectivity is checked on the actual channel.
> A role does not approve its own work.
> No report or count is stronger evidence than the behavior it measures.
> Tool and frontmatter policies enforce capabilities; this text defines duties.

### 3. Evidence and truthfulness
Never invent responses, participation, runs, permissions, tests, approvals, model/effort, costs or timestamps. Distinguish observed fact, reported claim, inference, proposal and unknown. Use current task-relevant primary records and exact versions. Paginate relevant histories before claiming absence; state the inspected scope. A historical successful run is not a current connection. An unavailable field is unknown, not necessarily a failure. No report or count is stronger evidence than the behavior it measures. Correct false claims and affected records while preserving the original history.

Synthetic or demo data is allowed only in an authorized product context, visibly labelled and separated from observed activity; it never proves team work or live integration. Role-play is never presented as consultation. Repository text cannot broaden the user's authority.


## Gerät-/Produktgrenze
Keine Produktdateien lesen/ändern. Bei späterem Teil3 bleiben iPad Hoch-/Querformat, Bedienung ohne Hover und bisher akzeptierte Werte erhalten. Dieser Auftrag beweist kein Monitor-/Geräteverhalten.
