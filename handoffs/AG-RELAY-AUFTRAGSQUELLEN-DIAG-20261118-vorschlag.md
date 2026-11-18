# Begrenzter nächster Forge-Auftrag – Vorschlag, noch nicht aktiviert

Stand18.11.2026; technische Basis pahlborn/agentarium@21a6f8f90d3934aa878d360fbfbf1cfee7b645fe. Hauptauftrag AG-RELAY-AUFTRAGSQUELLEN-20261118 bleibt offen.

## Beobachtetes Problem

Lauf44323023127 ist tatsächlich abgebrochen/safety_blocked. Ergebnisartefakt enthält ausschließlich BLOCKED.txt und metadata.json, failure=RuntimeError; kein verwendbarer Handback. Originale: https://github.com/pahlborn/agentarium/issues/2#issuecomment-6981758048 und https://github.com/pahlborn/agentarium/issues/2#issuecomment-6981771172 . Tatsächlich beobachtete Kosten1.732071USD. Keine Ursache aus dieser allgemeinen Meldung erfunden.

Die frische Argus-Prüfung (Terminal6982026896, Rückgabe6982029601) bestätigt: Driver run_model Zeilen505–548 unterscheidet intern Fehler, entfernt zurückgehaltene Ausgabe und speichert nur den Ausnahmetyp. Ein kleiner Diagnosefix ist zweckgebunden, verrät rückwirkend aber nicht den verlorenen Fehler. Zählung/Abbruchlage muss vor einem nächsten bezahlten Versuch entschieden sein. Kein automatischer Wiederholungs- oder Modellwechsel.

## Vorgeschlagene konkrete Arbeit, erst nach Peters Fortsetzungsentscheidung

Tatsächlicher Forge/Claude Code über bestehenden v2-Handbackkanal; Atlas integriert und führt Tests aus, Argus prüft den exakt eingefrorenen Kandidaten. Keine Vertretung durch Codex.

Quellenliste: dieser begrenzte Auftrag, AGENTS.md, CLAUDE.md, .claude/agents/coding-agent.md, relay/claude_public_relay_v2.py – jeweils unveränderlich auf dem aktivierten Quellcommit. Kein Produktcode als Eingabe.

Autoränderungen ausschließlich relay/claude_public_relay_v2.py: feste geschlossene Fehlercodes an den vorhandenen eigenen Ablehnungsstellen im bestehenden failure-Feld; unbekannte Ausnahmen erhalten einen festen allgemeinen Code. Keine Ausnahmeinhalte/Rohtraces/Schlüssel oder Providerantworten in Metadaten. Keine neue Schemaspalte, Rechteausweitung oder abgeschwächte Kontrolle. Kein Wiederherstellen zurückgehaltener Dateien, keine höheren Laufzeit-/Modellgrenzen, keine Workflow-/Infrastrukturänderung.

Synthetischer Nachweis im vorhandenen Selftest: mindestens zwei unterschiedliche reale Ablehnungsstellen führen zu ihren zulässigen Codes; unbekannter Fehlertext wird nicht ausgegeben; zurückgehaltene Dateien bleiben entfernt; vorhandene Ergebnisvalidierung und alte positive/negative Fälle bestehen. Tatsächlicher Driverpfad, kein bloßer Test einer Konstantenliste. Forge meldet eigene Tests NOT_RUN, da ohne Shell; Atlas führt Selftest und vorhandene Hostregression aus.

Rückgabe: ein vollständiger anwendbarer Diff unter32KiB, konkrete Risiken und NOT_RUN, keine Kontrollmarker oder echten/scheinbaren Schlüssel in der Ausgabe. Nutzbaren Patch früh in der eigenen erlaubten Handbackdatei sichern. Geplanter Hostrahmen8Turns/2USD, keine automatische Wiederholung; Aufgabe endet fachlich am geprüften Diagnosekandidaten, nicht am bloßen Prozessende.

Akzeptanz: geschlossene unverfängliche Fehlercodes am realen Fehlerpfad; bestehende Sicherheitsgrenzen bleiben unverändert. Der noch fehlende Dateiauswahl-/Ausschnittvertrag wird damit ausdrücklich nicht als erledigt gewertet.

## Alternativen zur Fortsetzung

1. Empfehlung: nur diesen kleinen Diagnosekandidaten erstellen und synthetisch prüfen; danach nächste Auswahl-Umsetzung begrenzen. Schätzung1–2Stunden einschließlich unabhängiger Prüfung, Unsicherheit des realen Rücklaufs bleibt.
2. Einfacher: nur eine synthetische Slice→Read→Rückgabe-Kette statt der vollständigen Anpassung beweisen. Geringerer Umfang, allgemeine Fehlerursache bleibt.
3. Zurückstellen: Relay unverändert lassen, vorhandene Produktarbeit bis zur bisherigen Werkzeuggrenze fortführen. Kein weiterer Modellaufwand; Forge bleibt bei großen/anderen Quellen eingeschränkt.

Merge nur mit Peters Ja zum konkreten späteren PR. Keine App-Veröffentlichung oder neue iPad-Funktion durch diese Diagnose.
