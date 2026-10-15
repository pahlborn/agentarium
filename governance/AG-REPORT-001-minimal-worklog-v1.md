# AG-REPORT-001 — Schlankes Arbeitsprotokoll und Lernboard
Version 1 · 2026-10-15 · Atlas · [Arbeitsboard #7](https://github.com/pahlborn/agentarium/issues/7)

## Auftrag und Umsetzungsstand
Peter: Beginn am 15.10.2026 bestätigt; Daten für Agentarium, Partitur und Reports geeignet halten, Erfassungsaufwand und Kosten minimieren.
Dieser Schnitt legt Datenminimum, Reportdefinitionen und ein echtes Vorbereitungsprotokoll ab. Kein implementierter Collector, Adapter oder automatisches Dashboard; keine behauptete Verbraucherkompatibilität. Kein neuer verbindlicher Vollprozess, keine Architekturänderung oder Änderung bestehender Modelle/Budgets. Kostenstrang bleibt pausiert. Forge ist für Umsetzung vorgesehen, nicht gestartet.

Geprüfte Basis: feature/visual-stage-v0@4608ae0479e328c301cdb1bebd056e91a706664e; relay/events/AG-PARTITUR-001-worklog-v1.json (observed-worklog.v1), relay/task-evidence.jsonl, AG-ENGAGEMENT-001-team-brief-v1.md und Nova-Dialog. Visualisierungsbranch beim Lesen: 074b5c234fa2c055d6e682da8d24275bb72064c3, unverändert gelassen.

## Einmal erfassen, mehrfach verwenden
Bestehendes observed-worklog.v1 bleibt unverändert. Nachfolgend additive Felder/Regeln als Implementierungsgrundlage, mit Schema-/Adapterprüfung vor produktiver Nutzung. Journalbelege bleiben erhalten; keine parallelen Nacherzählungen desselben Vorgangs.
Batch-Kontext einmal: schema/version, project_id, run_id, mode (observed/simulation), recorded_at, source_ref, capture_scope und coverage mit bekannten Lücken. Rollen-/Sitzungsdaten einmal je beteiligter Sitzung; tatsächliches Modell nur mit Laufzeitbeleg.
Ereignisminimum: stabile id, task_id, actor, kind, title, occurred_at (null erlaubt), evidence_ref; recipient und caused_by nur bei Kommunikation/kausalem Bezug. Optionale Nutzdaten nur wenn die Ereignisart sie benötigt:

| Ereignis | Zusätzlicher Mindestbezug |
|---|---|
| Arbeitsobjekt angelegt/Umfang geändert | work_item_type (story/task/defect/experiment), parent_task_id, scope_version, added/removed mit Grund |
| Statuswechsel / Wiedereröffnung | from/to, monotone item_revision, previous_transition_id (null beim ersten), Grund bei reopen |
| Übergabe / Verantwortung | ownership_change: from/to; Verantwortung nie aus Parent/Empfänger allein ableiten |
| Frage / Antwort | question_id; reply_to bzw. caused_by auf genaue Frage; Antwort ist nicht automatisch Aufgabenabschluss |
| Blockade / Auflösung | block_id, task_id, Grund bzw. resolving_event_id; Frage allein ist keine Blockade |
| Ergebnis / Revision | artifact_id, version oder Commit/Blob, result_ref; keine Vollinhalte kopieren |
| Test / Review | exakte Zielversion, criteria_ref/version, outcome (pass/fail/blocked/not_tested/partial), evidence_ref |
| Fachlich fertig / angenommen | ausdrücklicher Statuswechsel, Arbeitsobjekt, konkrete Ergebnisversion, Kriterienversion, Erfüllungsbelege und zuständige Rolle |
| Verbesserungsexperiment | Beobachtung, Hypothese, Maßnahme, Owner, Prüfanlass, Ergebnisbeleg |

Technisch fertig, geprüft, fachlich angenommen und Peters Projekt-/Releaseentscheidung bleiben unterscheidbar. Ein Testpass, Reviewpass oder geliefertes Dokument setzt keine Story automatisch auf Done. Produktarbeit verwendet ihre definierte Definition of Done; Peter muss nicht jeden internen Teilauftrag einzeln freigeben.

## Zuverlässigkeit bei minimalem Aufwand
- IDs bleiben bei Wiederholung gleich; Verbraucher deduplizieren nach project_id + id. Identische ID mit unterschiedlichem Inhalt ist ein Konflikt, kein zweites Ereignis.
- Statusreihenfolge folgt item_revision/previous_transition_id, nicht Ankunft oder recorded_at. Lücken und widersprüchliche Revisionen sperren die betroffene Zustandsableitung bis zur Klärung.
- occurred_at ist tatsächliche Ereigniszeit; recorded_at ist Ablagezeit. Keine nachträglich geschätzten Startzeiten. Gleiche Zeitstempel beweisen weder Reihenfolge noch Kausalität.
- Korrekturen ergänzen supersedes/corrects und Quelle, löschen keine Vorgeschichte. Verspätete Belege lösen deterministische Neuberechnung betroffener Auswertungen aus.
- Je Batch capture_scope und bekannte Lücken; keine globale Vollständigkeit aus bloßer Lückenfreiheit behaupten. Je Kennzahl complete/partial/unavailable einschließlich Nenner/Abdeckung und Auswertungsstand ausweisen.
- Fehlender Start sperrt die Durchlaufzeit des Objekts, nicht einen anderweitig belegten Fertigstatus. Bei unvollständiger Erfassung sind beobachtete Mengen als Teilmenge zu kennzeichnen.
- Simulation und echte Projektarbeit niemals vermischen. Rückwirkend rekonstruierte Baselines ausdrücklich kennzeichnen.

## Aufwand und Performance
Ereignisse an ohnehin vorhandenen Übergabe-/Ergebnis-/Fehlergrenzen sammeln. Keine separaten LLM-Aufrufe zum Protokollieren, keine Pflichtquittungen, Heartbeats, Token-/Frame-Ereignisse oder Tool-Volltranskripte. Fachlich relevante Recherchefunde kurz bündeln und Quellen verlinken; nicht jeden Seitenabruf einzeln erzählen. Tatsächliche Fragen/Einwände nicht für optische Ruhe herausfiltern.
Gebündelt bei Übergabe, Ergebnis, Fehler oder Abschluss ablegen; bestehende persistierte Relay-Ergebnisse bleiben Referenz. Implementierung muss unerfasste/ungespeicherte Batches als Lücke melden und bei Erfassungsfehlern ohne Wiederholungs- oder LLM-Schleife weiterarbeiten. Keine laufende vollständige Historie in jeden Prompt aufnehmen.
Reports deterministisch aus vorhandenen Ereignissen berechnen, nicht durch zusätzliche KI-Nacherzählung. Genau eine kurze Retro-Zusammenfassung pro Auswertung; Quellen-/QA-Artefakte verlinken.
Overhead ist bisher NICHT GEMESSEN. Forge soll im ohnehin notwendigen Integrationstest Erfassungs-/Schreibdauer, Payload-Größe und zusätzliche Requests erfassen, keine teure Benchmarkkampagne. Keine zahlenmäßig unbelegte Performancegarantie. Keine zusätzlichen Claude-Aufrufe zur Bestätigung dieses Entwurfs.

## Reportdefinitionen V1
Einheit vorab festlegen; Stories und interne Tasks getrennt, keine summierten Eltern+Kinder und keine Agentenrangliste. Zählwerte messen keine Aufwands- oder Wertprozente.

| Report | Minimaldefinition / Grenze |
|---|---|
| Burnup (primär) | Aktueller versionierter Storyumfang und aktuell Done-Stories über Zeit; hinzugefügte/gestrichene Stories und Reopens separat erkennbar. Kriterienversion und Done-Nachweise erforderlich. |
| Burndown (optional) | Derselbe aktuelle Umfang minus aktuelles Done; Scopeänderung separat markieren. Ideallinie nur Planannahme. |
| CFD / WIP | Gegenseitig ausschließende Workflowzustände aus Übergängen; blockiert als Zusatzmerkmal, nicht doppelt zählen. Bandwachstum zeigt mögliche Engpässe, keine Ursache. |
| Durchsatz | Erste Fertigstellung eindeutiger Arbeitsobjekte je Zeitraum und Arbeitsart; erneutes Done nach Reopen ist kein neuer gelieferter Gegenstand. Reopens separat berichten. |
| Durchlaufzeit / Alter | Start bis erstes Done bzw. bis Auswertungszeit; Reopen-bis-erneut-Done als Nacharbeitszyklus getrennt. Zeitbasis und Start-/Enddefinition konstant. Verstrichene Zeit ist nicht aktive Arbeitszeit. |
| Qualität | Fehler nach Schwere, Reopens und belegte Review-/QA-Rückläufe; kein pauschales Qualitätsurteil aus Testanzahl. |
| Produktergebnis | Ein überprüfbares Nutzerziel, Demonstrations-/Abnahmebeleg und Peters Feedback; Aktivitäten ersetzen den Nutzennachweis nicht. |
| Lernen | Beobachtung → Hypothese → begrenzte Änderung → Verantwortlicher → Prüfung → Wirkung. Pro Auswertung ein bis zwei priorisierte Versuche, keine Vollteam-Pflichtrunde. |

Projektübergreifend nur mit gleicher Messdefinition und nachvollziehbarem Kontext vergleichen; Arbeitsart, Umfang, Kriterien- und Prozessversion erhalten. Kleine Datenbasis zeigt Beobachtungen, keine belastbare Prognose. Historische Lücken nicht rückwirkend auffüllen. DORA-Metriken später nur für echte Produktionslieferungen, nicht als Ersatz für Recherche-/Konzeptfortschritt.

## Rückfragen
Keine Pflichtfrage und keine Kommunikationsquote. Bei Ziel-/Kriterienkonflikt, unbelegter Annahme, unklarer Verantwortung, Scope-/Kosten-/Rechtefolge fragt die Rolle Atlas; nur abhängige Arbeit pausiert. Atlas beantwortet oder routet; Peter entscheidet tatsächliche Produkt-/Prioritäts-/Risikofragen. Ein Einmal-Relay darf einen offenen Klärungsbedarf zurückgeben und stoppen; Frage ist kein Fehler und keine Freigabe zum bezahlten Wiederanlauf.
Historischer Nachweis: vision/AG-ENGAGEMENT-001-nova-dialogue-v1.md enthält Novas tatsächliche Rückfrage zu fachlichem Spielraum und Erfassung von Initiativen samt Atlas-Antwort. Kein Nachweis regelmäßiger Rückfragen aller Rollen. Frühere one-shot-Formate begrenzen den Dialog; kein stillschweigender Umbau.

## Review und spätere Abnahme
Argus /root/argus_reporting_minimum, AG-REPORT-001-REVIEW V1: PASS_WITH_NOTES als Konzeptreview, keine Laufzeitprüfung.
R1 Duplikate/Reihenfolge, R2 explizites versionsgebundenes Done, R3 kennzahlbezogene Abdeckung wurden oben präzisiert. Diese Revision wurde nicht erneut unabhängig geprüft; Performance und Kompatibilität bleiben NOT_TESTED.

Spätere gezielte QA: (1) wiederholter Batch zählt einmal; (2) verspäteter Übergang wird korrekt einsortiert/Lücke erkannt; (3) Reviewpass setzt kein Done; (4) geänderte Version übernimmt keinen alten Pass; (5) Reopen korrigiert Fortschritt ohne neuen Durchsatzgegenstand; (6) fehlender Start ergibt keine erfundene Dauer; (7) Simulation bleibt getrennt; (8) Logfehler wird sichtbar ohne bezahlte Retryschleife. Danach dieselbe belegte Historie in Agentarium, Partitur und Report gegenprüfen. Hier noch nicht ausgeführt.

## Recherchebasis
Scout /root/scout_agile_reports, AG-REPORT-RESEARCH-001, tatsächlicher RKA_READY-Handback am 15.10.2026; Atlas las Hauptquellen ebenfalls.
- Scrum Guide 2020, Review/Retrospektive/DoD: https://scrumguides.org/scrum-guide.html
- Kanban Guide Mai 2025, Definition of Workflow/Flow Metrics: https://kanbanguides.org/the-kanban-guide
- Burnup: https://support.atlassian.com/jira-software-cloud/docs/view-and-understand-the-burnup-chart/
- CFD: https://support.atlassian.com/jira-software-cloud/docs/view-and-understand-the-cumulative-flow-diagram/
- EBM Guide 2024, Nutzen/Experiment Loop: https://www.scrum.org/resources/online-evidence-based-management-guide
- DORA, aktuelles Fünf-Metriken-Modell und Grenzen: https://dora.dev/guides/dora-metrics/
