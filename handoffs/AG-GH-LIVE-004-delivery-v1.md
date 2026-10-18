# AG-GH-LIVE-004 — Sichtbare echte Übergaben: Technik bereit

Status: Consumer technisch geprüft (PASS_WITH_LIMITS), realer Mehrrollen-Lauf auf Kundenmonitor noch ausstehend. Isolierter Pilot Fassung 51, Adapter AG-GH-LIVE-001-v1.3. Kein Merge und keine Änderung am regulären feld/.

## Was jetzt funktioniert

Der bestehende GitHub-Eingang akzeptiert neben progress die Arten handoff und contribution. Ein bekannter Empfänger ist bei beiden Kommunikationsarten Pflicht. Originale Ballflüge und Beschriftungen werden verwendet; Projekt-, Lauf-, Aufgaben-, Ereignis- und Quellreferenz sowie Sender und Empfänger bleiben erhalten. Herkunft reported_checkpoint wird ausdrücklich als gemeldet und nicht als Laufzeitbeleg bezeichnet.

Diese Kommunikation eröffnet oder beendet keine Aufgabe, bestätigt keine Abnahme und behauptet weder laufende Arbeit noch ein tatsächlich verwendetes Modell. Reale einzelne Arbeitsschritte bleiben die bisherigen progress-Pulse. Ältere bereits geöffnete Originalfassungen ohne neue Brückenfähigkeit lehnen die neuen Kommunikationsarten ab, statt sie mit früheren Aufgabenfolgen zu interpretieren. Demo und Archiv bleiben im geprüften Umfang erhalten.

## Echte Beiträge und Nachweise

- Forge implementierte auf Basis c40b4cb5155b62bc31d0bb35a9d2ceb023530b17: https://github.com/pahlborn/agentarium/actions/runs/39094257735, Session a600efdd-1b9c-449f-8d85-98ed3189a88a. Laufzeitmodell claude-opus-5-5; tatsächlicher Effort nicht bestätigt. Gemeldete API-Kosten 1.7862198 USD.
- Argus prüfte unabhängig (/root/argus_live_handoffs) und fand einen MAJOR-Mischpfad: Beobachtete Beiträge beschleunigten noch einen bereits fliegenden Aufgabenball. Atlas behandelte den Befund als vor Veröffentlichung zu korrigieren. Rohreview mit gezieltem Nachtrag: handoffs/AG-GH-LIVE-004-argus-review-v1.md.
- Forge korrigierte genau diesen Pfad: https://github.com/pahlborn/agentarium/actions/runs/39094760434, Session 1c7228a5-0cf4-452c-9b67-32ab17b6aab0; 0.0727258 USD. Argus bestätigte mit tatsächlichen Funktionskörpern: beobachtet bleibt 4s, Legacy-Catch-up bleibt 0.28s.
- Sentinel (/root/sentinel_expiry_fixes) prüfte den korrigierten exakten Kandidaten b5dcabb47802c6c9b401e6d429040979aaf9ffc5 unabhängig. 18/18 zusätzliche Browserfälle, 39/39 bestehende Browserregressionen, 24 Forge-Komponentenprüfungen und Ablauf-NodeVM bestanden: https://github.com/pahlborn/agentarium/actions/runs/39094881747.
- Umgebung: Playwright 1.62.1 / Chromium unter Linux, Desktop 1180×820 und Tablet 768×1024, synthetische GitHub-Fixtures. Kein physischer Windows-/Safari-Nachweis der neuen Kommunikation.
- Autor Produktcode: Forge. Review: Argus. QA-Harness und unabhängige Auswertung: Sentinel. Build und Pilot-Publikation: Atlas.
- Source und komponentenbezogene Tests liegen unverändert am exakten Kandidaten; main enthält den isolierten Pilot-Build. Kein vollständiger Kandidaten-Merge.

Die beiden bezahlten Claude-Aufrufe dieses Schritts meldeten zusammen 1.8589456 USD. Das ist keine vollständige Projektkostenrechnung; die App weist weiterhin keine Teilkosten aus.

## Grenzen und offene Befunde

- AG-GH-LIVE-004-LABEL-DENSITY: Die zusätzlichen Herkunfts-/ID-Texte überlagern stellenweise Rollenbeschriftungen. Funktionale Identifikation in den geprüften Bildern möglich, visueller Feinschliff offen. Owner Atlas → zuständiger Agentarium-Entwickler.
- AG-GH-LIVE-003-MOBILE-HEADER bleibt offen; keine pauschale Layout- oder Gerätefreigabe. governance/AG-DEVICE-001-policy-v1.md hält Peters Entscheidung zu begründeten Anzeigegrenzen und Dokumentation fest; aktuell wurde keine Anzeige gesperrt.
- Peters Windows-Beobachtung während der echten Forge-Arbeit wurde im Chat um 05:39/05:41 Europe/Berlin berichtet und gegen aktuelle Host-Ereignisse abgeglichen. Browser und genaue Empfangslatenz sind nicht instrumentiert; keine allgemeine Windows-Freigabe daraus.
- Der reine Eingangsnachweis und die echten früheren Arbeitspulse ersetzen nicht das noch ausstehende Abnahmekriterium für die neue Mehrrollen-Kette.

## Nächste konkrete Aktion

Der echte Fachauftrag ist auf dem Steuerungsbranch vorbereitet, NICHT gestartet: handoffs/AG-GH-LIVE-004-live-procedure-v1.md und handoffs/AG-GH-LIVE-004-probe-request-v1.json auf agent/ball-live-concept-20261017 (Vorbereitungscommit e368ea81a778fd4f1b14d5bf052fa2158589c91a, kein ausgelöster Workflow).

Nach Bereitstellung öffnet Peter den neuen Monitor und bestätigt Fassung 51 verbunden. Atlas startet danach erst die echte Folge Atlas → Forge → Atlas → Sentinel → Atlas. Der reale Fachauftrag betrifft verständliche Hinweise zum Gerätewechsel; tatsächliche Antworten werden weitergereicht. Keine erfundenen Antworten, kein Replay und keine bereits behauptete Endabnahme.
