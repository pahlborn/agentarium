# Handback AG-LAUFZEIT-001-02 — CA_ADVICE / FEASIBLE_WITH_CHANGES (Teil BLOCKED, siehe 5)

Baseline 37f6a5e. Gelesen: Eingabedatei, relay/claude_public_relay_v2.py, Workflow. Selbst ausgeführte Tests: NOT_RUN (kein Shell). Alles zur CLI-Semantik ist Dokumentation/Annahme, kein Runtime-Nachweis; der Monitor wurde nicht gelesen.

## 1. Wo die CLI Arbeit beweist (Fakten: run_model)
- Kein Arbeitsnachweis: announce() (Host empfing), Workflowstart, Popen, system/init, session_id. init entsteht vor jedem Modellaufruf.
- Kleinste belastbare Startbedingung (Vorschlag, Annahme zu verifizieren): die erste vom Driver geparste stream-json-Zeile mit type=assistant. Sie bedeutet, dass die API tatsächlich geantwortet hat. Die Modellantwort ist zugleich der erste Kostenanfall. Start = Zeitpunkt, an dem der Driver diese Zeile liest (Monotonic und UTC), nicht die Zeit des Popen.
- Normales Ende: Zeile type=result mit is_error=false, Exitcode 0. Das Ende ist die Zeit, zu der der Driver diese Zeile liest. Heute prüft run_model das erst nach Secret-Scan und Pfadgrenze, die Ausgabe wird dann evtl. zu blocked.
- Fehlersignale, getrennt zu erfassen: result mit is_error=true oder Subtyp error_* (max_turns, Budget, during_execution – Namen laut Doku, per Probelauf zu bestätigen), Exitcode ≠ 0, EOF ohne result, Driver/Job-Timeout, Fehler vor dem ersten assistant (dann gab es keine Arbeit: kein Start). Fehlendes Ende = „unbekannt“, nie erfunden.
- Defekt heute: der Fehlerpfad setzt session_id/usage/cost auf None, und validate_result verlangt das für blocked sogar. Ein früher Start überlebt eine spätere Blockade also nicht. Außerdem überschreibt force_blocked (publish/fallback) das gesamte Ergebnisverzeichnis per rmtree.

## 2. Echtzeit aus dem token-losen run-Job
Fakt: publish braucht needs: run. Ein Echtzeitkanal zum Publisher existiert nicht. Artefakte werden erst mit dem Upload-Schritt sichtbar, und der kommt nach dem blockierenden Worker-Schritt. Ein paralleler Watcher-Job hätte keinen Kanal, außer einem Netzendpunkt oder Token im Worker. Das wäre neue Infrastruktur oder neue Rechte, und gleicher Benutzer plus bereinigte Environment isoliert nicht.
- Route A (empfohlen, ohne neue Rechte): Der Driver schreibt beobachtete Zeiten sofort und atomar (Write+Replace) in eine eigene Beobachtungsdatei, getrennt von RESULT, also relay-observation/. Der Upload-Schritt (if: always) lädt sie als zusätzliches Artefakt oder zusätzlichen Pfad hoch. Der Publisher veröffentlicht nach dem Lauf Start und Ende mit den ORIGINALZEITEN und trennt sie von der Empfangs-/Veröffentlichungszeit. Das Monitorbild erscheint verzögert (bis zum Laufende, max. 30 min Timeout). Diese Verzögerung muss Peter ausdrücklich akzeptieren. Sie ist kein Echtzeit.
- Alternative B: Echtzeit mit Zwischenpublikation. Sie erfordert einen externen Empfänger oder einen Schreibpfad außerhalb des Worker-Jobs. Das ist eine Infrastrukturentscheidung (STOP für mich, siehe 5). Ich empfehle B nicht für den ersten Schnitt.
- Zu prüfen im Realversuch: ob der Upload-Schritt mit always() bei Job-Timeout/Kill noch die Start-only-Datei hochlädt. Bis dahin: unbekannt.

## 3. ChatGPT-native Lücke
Bestehender Repositorycode kann dort nichts beweisen. Ein Comment, den Atlas über Argus' Spawn/Status/final-Ausgabe schreibt, ist eine berichtete Beobachtung (reported_checkpoint, Reporter atlas). Er darf nicht als runtime_stream des Arbeiters erscheinen und nicht Originalzeiten vortäuschen. Möglich im Repository ist nur, eine Aufnahmeschnittstelle für fremde Reporter zu definieren und deren Herkunft sichtbar zu halten. Eine echte Lösung braucht einen Plattformvertrag (automatischer Export/Callback mit Start-/Endzeit, Lauf-ID). Der ist laut Auftrag nicht nachgewiesen. Keine Migration von Rollen. Lot nur durch Peter gestartet, und der Relay erzeugt für Lot nichts.

## 4. Produzentenvertrag (Vorschlag, neu, nicht in den V1-Kanal schreiben)
Eigenes Schema agentarium.work-observation.v1, ein JSON-Objekt als Artefakt, alle Werte Text oder null:
- role (Arbeitsrolle, aus ROLES abgebildet: coding-agent→forge; spec-/process-agent bekommen ihre eigene Zuordnung. Das heutige feste „forge“ in ag_host_received/ag_terminal ist für spec-/process-agent falsch.)
- reporter = relay-driver mit Version/Blob, observer_kind = host_process_observation. Das ist eine Fremdbeobachtung der Rolle und nach außen ausdrücklich so deklariert, keine Eigenmeldung.
- project_id, task_id, parent_id, logical_run_id aus dem validierten Request-Packet (run_id/parent_id sind heute dort, aber von validate_request nicht verlangt: nachrüsten). Getrennt davon github_run_id, run_attempt (GITHUB_RUN_ATTEMPT) und attempt_id = task:github_run:attempt. Heute wird in ag_block die GitHub-Run-ID als logische run_id benutzt: das ist die zu korrigierende Verwechslung.
- session_id (aus dem ersten stream-Event, nur Zeichen-Whitelist), evidence_ref = Run-URL (prüfbar, vom Publisher gegen den realen Run abgleichbar, wie trusted_terminal_row es heute macht).
- start_observed_at (Originalzeit, UTC), end_observed_at oder null, outcome ∈ {completed, error, unknown}, error_class (feste Enum, kein freier Modelltext), received_at (vom Publisher gesetzt, nicht vom Worker).
- Genau ein Terminal: ids task:run:attempt:work_start und :work_end, je höchstens einmal. Fehlt end, wird kein Ende veröffentlicht, nicht „error“ geraten.
- Geheimnisschutz: nur Whitelist-Felder und Enums, kein Modelltext und keine Stream-Inhalte, der vorhandene secret_hit-Scan auf die serialisierte Datei, Größenlimit.
Wesentliche Lücke: Der V1-Monitorkanal hat genau elf Textfelder und kein reporter-/Laufbeleg-Feld. Ob runtime_stream plus Laufbezug dort darstellbar ist, ist eine Monitor-/Adapterentscheidung (Lot/Peter), die ich nicht treffen kann. Ich habe den Monitor nicht gelesen. Ohne Feldänderung wäre eine V1-Emission entweder ein falsch deklarierter Eigenbericht oder ein stillschweigend verworfenes Ereignis.

## 5. Minimaler Umsetzungsschnitt
Umfang (alles in Forge-Besitz, ein zusammenhängendes Paket):
1. relay/claude_public_relay_v2.py: Stream-Schleife in run_model schreibt Beobachtungsdatei (Start bei erstem assistant, Ende bei result/EOF, error_class). Beobachtung wird auch bei blocked erhalten (eigenes Verzeichnis, von force_blocked unberührt). Neue Funktion validate_observation. publish liest sie und erzeugt die Veröffentlichung getrennt vom Terminal-Ergebnis. Rollenabbildung ersetzt das feste forge. Request-Validierung verlangt logical run_id/parent_id. self-test erweitern.
2. .github/workflows/claude-public-relay-v2.yml: nur der Upload-Pfad der Beobachtung (Artefakt, always) und Download im publish-Job. Keine neuen Rechte, Secrets, Token oder Hosts. Offene Hostfrage: ob ich/der Host Workflowdateien ändern darf (workflows-Recht). Unbekannt, vor dem Start zu klären.
3. Die Aktivierung bleibt ein eigener Add-only-Commit. Atlas/Host-Executor muss ihn auslösen, ich kann nichts ausführen.
Kleinster realer Nachweis Quelle→Journal: ein bezahlter Lauf (Haiku/Sonnet, max_turns klein), danach das Beobachtungsartefakt mit Run-URL und das veröffentlichte Ereignis gegen die tatsächlichen Run-Logzeiten vergleichen.
Gezielte Gegenprüfungen (kostenlos, im self-test): fehlende Beobachtung → kein Ereignis; Start ohne Ende → nur Start; Blockade nach Start (Controlfolge im Handback) → Start bleibt, Terminal = blocked; Fehler vor erstem assistant → gar kein Start; doppelte Terminals abgewiesen; Geheimnis in error_class unmöglich (Enum). Ein bezahlter Fehlerlauf (z. B. max_turns 1, ca. 0,1–0,3 USD) bestätigt die error_*-Subtypnamen.
Was ich nicht entscheide: Monitorfeld/-adapter, Plattformvertrag für native Rollen, Echtzeit über neue Infrastruktur. Dort STOP, nicht mit einem Zwischenbehelf überbrücken.

## Kosten
Die Schätzung von 5–8 USD Gesamt bleibt plausibel, unter dem Limit von 10 USD, aber nur für Route A. Zwei bis drei bezahlte Läufe à ca. 0,3–1,5 USD plus Forge-Implementierungsläufe. Der größte Unsicherheitsfaktor sind Wiederholungen durch Fehlschläge bei Safety-Checks. Die Kosten bleiben unter 10 USD, solange kein Lauf wiederholt wird, der nur wegen unklarer Anforderungen scheitert. Route B und Plattformvertrag liegen nicht in dieser Schätzung.

## Gegenposition zu Atlas
„Echtzeit“ ist mit der heutigen Architektur nicht erreichbar; nur nachträgliche Veröffentlichung mit Originalzeiten ist ehrlich lieferbar. Und das Problem liegt nicht nur beim Relay: Solange der Monitor kein Reporter-/Laufbeleg-Feld kennt, lässt sich die Zielvorgabe „runtime_stream plus prüfbarer Laufbezug“ im V1-Kanal nicht tragen. Empfehlung: Peter entscheidet (a) verzögerte Route A akzeptiert, (b) Monitor-Vertragserweiterung beauftragt, bevor Forge implementiert.

Stopp. Keine Abnahme, keine Publikation, kein Folgelauf.
