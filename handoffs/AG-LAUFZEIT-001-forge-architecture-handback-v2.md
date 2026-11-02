# Handback AG-LAUFZEIT-001-04 — CA_ADVICE (Route A zurückgenommen)

Baseline 37f6a5e. Gelesen: Input v2, mein V1-Handback und die Workflowdatei. Den Driver habe ich diesmal nicht erneut gelesen; Aussagen dazu stammen aus V1. Tests: NOT_RUN, keine Shell. Der Monitor wurde nicht gelesen.

## 1. Ist der bestehende Kanal tragfähig?
**Ja, unter Vorbehalt.** Belegt ist nur die Dokumentation: Ein finalisiertes v4-Artefakt ist mit seiner ID in UI und REST sichtbar. Das ist kein Echtzeitnachweis. Die Hypothese ist nicht in der geplanten Form umsetzbar:
- **Upload im selben Schritt scheidet aus.** upload-artifact ist eine JS-Action. Sie bekommt ihr Laufzeittoken vom Runner. Ein `run:`-Schritt hat dieses Token nach meinem Kenntnisstand nicht. Ein Hostupload aus Python bräuchte also etwas Neues. Das ist unverifiziert und ich schreibe es nicht vor.
- **Es geht mit mehreren Jobschritten.** Der Worker muss in einem losgelösten Supervisor laufen. Die Upload-Schritte gehören dem Workflow und nutzen den Pin, den es schon gibt.

## 2. Präzise Route (kleinster Schnitt)
Job `run`, Schritte:
1. **start-worker** (mit ANTHROPIC_API_KEY wie heute). Der Driver startet den Supervisor mit setsid, die Ausgabe geht in Dateien, der Schritt endet sofort. Der Supervisor startet den Worker mit bereinigtem Environment und liest den Stream. Beim ersten `assistant`-Event schreibt er atomar `obs/start.json`. Bei result, EOF oder Timeout schreibt er `obs/end.json` und das bereinigte RESULT. Er hat ein eigenes Gesamtlimit unter 30 min.
2. **await-start**: Der Driver wartet, bis start.json oder end.json existiert. Die Grenze ist das Supervisor-Limit. Der Schritt endet immer mit Exit 0.
3. upload-artifact `relay-start-<run_id>` (`if: always()`, `if-no-files-found: ignore`). Ab hier ist das Artefakt abrufbar, während der Worker weiterläuft.
4. **await-end**: wartet auf das Ende des Supervisors.
5. upload-artifact `relay-end-<run_id>` und `relay-result-<run_id>` (`always()`). v4-Namen sind pro Lauf eindeutig, daher getrennte Namen.

Job `publish-live`: `needs: prepare` und **nicht** `run`, gleiche Rechte (actions:read, issues:write). Er prüft per REST die Artefaktliste des Laufs. Das ist ein begrenzter Reader mit festem Intervall von etwa 15 s und einer Deadline von etwa 35 min, kein Dauerpoller. Er endet, sobald der `run`-Job laut API abgeschlossen ist und end.json gelesen wurde. Er veröffentlicht höchstens einmal je `task:run_attempt:work_start` und `:work_end`. Sein Timeout muss von 5 min auf etwa 40 min steigen. Das Endergebnis veröffentlicht er danach. Der heutige `publish`-Job mit `needs: run` und Fallback wird entweder dieser Job oder bleibt als Abschlussjob bestehen. Das ist die kleinere Änderung, und ich wähle sie.

## 3. Start-Semantik (Korrektur angenommen)
- Felder: `start_observed_at` ist die Zeit, zu der der Supervisor das erste assistant-Event las. `actual_start_unknown=true` gilt immer. Der tatsächliche Rechenbeginn liegt irgendwo zwischen Popen und diesem Event.
- Fehler oder Abbruch vor dem ersten assistant bedeutet **unbekannt**, nicht „keine Arbeit, keine Kosten“. Das Ergebnis lautet dann `outcome=unknown_no_activity_observed`, ohne Kostenaussage.
- Ende nur bei beobachtetem result/EOF. Fehlendes Ende bleibt `unknown`. Gerät end.json in den Reader, bevor start.json erschien, wird kein Start als laufende Arbeit veröffentlicht. Es erscheint nur das Ende mit dem Hinweis „Start nicht beobachtet“.

## 4. Sicherheit und verbleibende Isolation
- Die Artefaktdaten stammen vom Host, enthalten aber kein Modellmaterial. Es gibt nur Whitelist-Felder und Enums, keine Stream-Inhalte und ein Größenlimit. Der Publisher validiert streng und prüft die Secret-Muster auf der serialisierten Datei.
- **Restrisiko:** Supervisor, Worker und Upload-Action laufen unter demselben Linux-Benutzer. Ein kompromittierter Worker könnte Beobachtungsdateien verändern. Er könnte auch den Artefaktnamen vorab belegen und so den Upload blockieren (Verlust, dann „unbekannt“). Theoretisch könnte er sogar das Laufzeittoken eines Runner-Prozesses lesen. Das gilt für den heutigen Upload genauso. Ich behaupte hier keine Isolation.
- **Gegenmaßnahme:** Der Publisher gleicht gegen Plattformdaten ab. Er nimmt das `created_at` des Artefakts als obere Grenze für den Beobachtungszeitpunkt. Dazu kommt, falls abrufbar, der Schrittzeitstempel der Jobs-API. Beides ist **unverifiziert**. Widersprüche werden als `integrity_unverified` markiert statt als Wahrheit veröffentlicht.
- Das Token im Worker bleibt unverändert: kein GH-Schreibtoken. Der API-Key steht nur im Schritt start-worker.

## 5. Kleinster kritischer Beweis (nicht kostenpflichtig, synthetisch)
Ein Testbranch mit derselben Schrittfolge. Statt des Claude-Workers läuft ein Fake-Supervisor (sleep). Nach 20 s schreibt er start.json, nach 90 s end.json. Kein API-Key, kein Modellaufruf. Der Lauf ist als SYNTHETIC deklariert und gibt keine Rollenstarts vor. Der Parallel-Reader schreibt nur ins Log.
Zu belegen:
(a) Der Supervisor überlebt das Ende von Schritt 1.
(b) Das Startartefakt ist laut REST sichtbar, während `run` noch `in_progress` ist, und sein created_at liegt deutlich vor dem Ende.
(c) Der parallele Job sieht es.
(d) Variante mit Kill oder Timeout nach dem Start: Das Startartefakt bleibt und end fehlt, also „unbekannt“.
Erst danach folgt der echte kleine CLI-Streamlauf (Haiku, max_turns klein).

## 6. Rechte
- Keine neuen Token-Scopes oder Secrets.
- **Offen:** ob die Workflowdatei geändert werden darf (workflows-Recht oder Peter/Host als Committer). Unbekannt.
- Offen: Die Artefakt-Download-Route des REST-Readers unter actions:read ist ungetestet. Der Beweis in Abschnitt 5 prüft sie.

## 7. Schätzung
Der synthetische Beweis kostet 0 USD an Modell, nur Runnerzeit. Ein echter Streamlauf kostet etwa 0,1–0,5 USD. Ein Fehlerlauf kostet etwa 0,1–0,3 USD. Dazu kommt die Forge-Implementierung. Bleibt der Beweis (a)–(c) positiv, liegt die verbleibende Gesamtschätzung bei etwa 3–6 USD, unter 10 USD. Fällt (a) durch, ist die Route ohne neue Infrastruktur nicht tragfähig. Der fehlende Schritt wäre dann konkret ein Prozess, der Schrittgrenzen überlebt, oder ein Laufzeittoken im Host. Das ist neue Fähigkeit und eine Entscheidung für Atlas oder Peter.

Monitorvertrag und ChatGPT-Export bleiben getrennt und offen. Stopp.
