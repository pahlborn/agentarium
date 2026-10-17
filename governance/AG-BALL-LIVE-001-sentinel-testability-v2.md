# AG-BALL-LIVE-001 — Sentinel QA_REPORT V2 (strukturierte Kurzfassung)

> Von Atlas dokumentierte strukturierte Kurzfassung der echten Rückgabe des Subagenten `/root/sentinel_ball_live_evidence`. Sie ist kein wörtlicher Volltext. Sentinel blieb gemäß Skill read-only und nahm selbst keine Projektänderung vor. Sentinel bestätigte anschließend Pfad und Kernaussagen, beanstandete aber die ursprüngliche Bezeichnung als vollständige Erhaltung; diese Kennzeichnung korrigiert genau diesen Dokumentationsfehler.

## Prüfkopf

- Auftrag: unabhängige Vorab-Testbarkeitsprüfung; keine Testausführung oder Änderung
- Geprüfter Stand: Branch `agent/ball-live-concept-20261017`, Commit `06751872460d8bb27fb8308c9b76a879f44bfc33`
- Archibald-Spezifikation V2: Blob `aeacea6323f6ef5ba7773062f7e8f3bf961de9bc`
- Charter V1: Blob `5a3da646403aec1d6c57510a8c4bd5344aace2e5`
- Machbarkeitsstudie V1: Blob `de952b7ca3e3a20fc1a7d81446337f083b160cce`
- Forge-Handback V1: Blob `b579ad1de7120e43dd5348d321e1f0f49451779a`

## Verdict

**FAIL — die aktuelle Spezifikation ist noch nicht implementierungsreif.**

Die Gründe sind konkrete Widersprüche und unvollständige Testoracles, nicht nur offene Providerentscheidungen. Lokale U/I/B-Komponenten sind grundsätzlich prüfbar; der gehostete Weg und echte iPad-Nachweis bleiben bis zu Entscheidungen, Berechtigungen, Quellenexperimenten, Gerät und Veröffentlichung **BLOCKED**. Sämtliche Produkt-Testfälle sind `not tested`.

## Statische Akzeptanzmatrix

| Prüfung | Status | Befund |
|---|---|---|
| Ebenentrennung | passed | Komponenten, Hosting und echtes iPad getrennt |
| Vollständige Traceability | failed | u. a. AC-2.3 und positiver Heartbeat nicht geschlossen |
| Beide Anbieter bei M5 noch laufend | failed | Jobstatus/Kommentarfolge sind kein ausreichender Laufzeitbeweis |
| Pixels und Messbarkeit | failed | M5′ und Zeitfehler nicht operationalisiert |
| Ausführbare Fixtures | failed | `fictional:true` kollidiert mit Ingest-Ablehnung |
| Zustandswahrheit | failed | Altersanker, Terminalpriorität und Run-Zuständigkeit fehlen |
| Recovery/Grenzfälle | failed | 20-s-Widerspruch, Cursor/Generation/Spool unvollständig |
| Auth/XSS/Datenschutz | failed | Markup-Oracles widersprüchlich; Ablehnungslog kann Secrets enthalten |
| Archivprojektion/Replay | failed | Gemischtes Journal passt nicht in V2.1-Archiv |
| Entscheidungsstatus | passed | D1–D6 und Release klar als ausstehend markiert |

## Erforderliche Korrekturen

### F1 — Wire-Vertrag und Identität

`agent_id`, Body-ID, `source_ref`, Lifecycle-ID und Empfängerregeln widerspruchsfrei festlegen. Vollständige Beispielobjekte für beide Ereignistypen und Tests für Kindpfad, ID-Verhalten und Run-State-Duplikate ergänzen.

### F2 — Laufend-Nachweis auf sichtbare Anzeige beziehen

Bei Claude Prozess-/Ergebnisgrenze statt Actions-Jobstatus bei M5 belegen. Bei Work eine konkrete, korrelierte echte Arbeitsaktion zwischen Checkpoints nachweisen; bei Kindern muss genau das bezeichnete Kind die Aussage tragen. Sichtbarkeit muss sicher vor dem belegten Ende liegen; zeitlich ununterscheidbar ist kein Pass. Die Akzeptanz kooperativer Work-Selbstauskunft bleibt Peters Datenschutz-/Wahrheitsentscheidung.

### F3 — M0–M5 und Pixelbeweis operationalisieren

Messpunkt, Uhr, Einheit und Erhebungsstelle für M1→M5 definieren; M0 bleibt unbekannt. M5′ als Proxy kennzeichnen. Sichtbare Actor-/Art-/Vertrauensanzeige per korreliertem Videoframe belegen. Ohne gesicherte Zeitbasis nur Schätzwerte ausweisen; Übertragungszeit, Ein-Sekunden-Uhrauflösung und Frameunsicherheit berücksichtigen. Keine unbeschlossene Echtzeitschwelle als erfüllt ausgeben.

### F4 — Positive Fixtures ausführbar machen

Ein isoliertes Fixturemodell festlegen, ohne produktiven Fictional-Ausschluss zu lockern. Lokale und reale gehostete Fälle trennen; Cursor, IDs, Eingaben, Zustände und Zähler exakt definieren. ORD-03 startet bei Cursor **103**; lokaler ORD-01 darf kein echtes GitHub-Redeliver voraussetzen.

### F5 — Freshness, Agenten- und Run-Ende

Eine deterministische Transitionstabelle mit Zeitanker, Terminalpriorität und Run-/Agenten-Zuständigkeit liefern. Verzögerten Ingest, alten Catch-up und Terminal→altes Progress prüfen. Claude-Kindende darf den gemeinsamen Work-Lauf nicht beenden.

### F6 — Recovery und Fehlerpfade

`alt`-Grenze vereinheitlichen; Producer-Spool separat testen; positiven Heartbeat-Test (5 s + 1 s Toleranz) ergänzen. Cursor 0/letzter/zu hoher Cursor, Snapshot, verspätete alte Generation, verweigertes `sessionStorage` und Cursorfortsetzung bei Hook-Ablehnung prüfen. Speicherfehler vor Bestätigung und verlorene Bestätigungsantwort nach erfolgreichem Append getrennt testen. Catch-up endet am festgehaltenen Journalkopf. Funklochereignisse müssen zur Producer-Drosselung passen. Eine zeitliche SLA bleibt Peters Entscheidung.

### F7 — Auth/XSS/Datenschutz

Markup entweder als Text zulassen oder explizit ablehnen; Escaping bleibt Pflicht. Je Negativtest nur eine Bedingung verletzen. CORS, Herkunft und Read-Token getrennt prüfen. Keine Secrets oder Rohpayload-Auszüge in Ablehnungslogs/Export; nichtgeheime Canary-Werte verwenden. Alle von Hook-Eingaben erreichbaren Senken prüfen, nicht nur einen `img`-Fall oder Regex-Grep.

### F8 — Archivprojektion und Replay

Journal→Archiv-Projektion explizit und verlustbewusst definieren. Arbeitsereignisse und Run-State getrennt bilanzieren; `liveListe` nicht gegen gemischte Journaleinträge vergleichen. Replay muss konkrete IDs, Reihenfolge und Endzustand prüfen; Nullzeit, Teilabdeckung, bekannten Spool-Verlust und Work-only-Terminalisierung festlegen.

### F9 — Coverage und Stopregeln

Kompakte FR/NFR→AC/TC-Matrix ergänzen, mindestens für Rate-Limits, Auth-Zeitfenster, Größen-/Längengrenzen, Aktivierungsfehler, falsche Fassung, lange Verbindung, Sperre/Rückkehr und deterministische Regression. Sentinel erhält keine Rollback-Schreibbefugnis.

## Evidenzgrenzen und nächste Aktion

Keine Produktbefehle, Validatoren, Browserproben, Netzunterbrechungen, Fixtures, Anbieterläufe oder Sicherheitsversuche wurden ausgeführt. Das Ergebnis ist ein **FAIL der statischen Implementierungsreife**, kein beobachteter Produktfehler.

Atlas gibt Archibald genau eine begrenzte Korrekturrunde für F1–F9. Forge baut noch nicht auf widersprüchlichen V2-Oracles. Sentinel prüft anschließend nur die betroffenen Kriterien und ihre Regression erneut.

