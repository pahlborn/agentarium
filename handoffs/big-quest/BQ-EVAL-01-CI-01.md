# BQ-EVAL-01-CI-01 · GitHub-Actions-Verbrauch und vermeidbare Mehrarbeit prüfen

Auftragsfassung v1 · 15.11.2026 · Projekt `big-quest`, Lauf `BQ-EVAL-01`. Eigenständige lesende Betriebs-/Prozessanalyse zur ursprünglichen Verbrauchsfrage, keine Produktentwicklung und keine neue Epic.

## Startsequenz

Atlas, lade und verwende `operate-as-atlas`. Lies aktuelle AGENTS-/Process-/Rulebook-Vorgaben sowie diesen Auftrag. Letzte bekannte Regelbasis: Agentarium Rulebook/Process1.4 an main `9962810b895baf10f8d71dd9a1f7387cca049b77`; aktuellen Stand prüfen. Nenne Regeln, Untersuchungszeitpunkt, Umfang und tatsächliche Ausführung. Zentrale Steuerung und Folgeaufträge bleiben im bisherigen Chat.

Kein Livebetrieb; bestehendes Projekt `big-quest` / Lauf `BQ-EVAL-01` im Archivmodus. Direkte lesende Analyse bevorzugen; keine Rollenpipeline und kein zusätzlicher Claude-Identitätstest. Eine tatsächlich nötige qualifizierte Vertretung ist freigegeben. Rollen, Meldungen und Messungen nicht erfinden. Bereits bekannte Schlussfolgerungen als Hinweise wiederverwenden, aktuelle Originalbelege prüfen.

## Ziel und enger Umfang

Beantworte anhand der Original-Laufdaten: Welche Big-Quest-Actions verbrauchten im untersuchten Zeitraum Zeit, welche Wiederholungen/Überschneidungen waren nachweisbar vermeidbar, und welche höchstens drei Änderungen hätten den größten Nutzen ohne Testabdeckung zu schwächen?

Primärumfang: `pahlborn/bis-school-app_src`, PR193 und PR198, Zeitraum 11.11.2026 00:00 bis einschließlich 14.11.2026 23:59 Europe/Berlin. UTC-Grenzen korrekt umrechnen und im Bericht angeben. Andere PRs/Repos nur aufnehmen, wenn eine konkrete Verbrauchszuordnung dies zwingend erfordert; Erweiterung begründen. Keine Gesamtbilanz aller GitHub-Projekte daraus ableiten.

Alle Daten selbst aus vorhandenem GitHub-Zugriff, öffentlicher Webansicht und unveränderlichen Quellen beziehen. Keine Dateien von Peter hin- und hertragen lassen. API-Zugriff ist in manchen Umgebungen netzseitig gesperrt; vorhandenen GitHub-/Web-Leseweg prüfen und öffentlich erreichbare Belege weiter auswerten. Kein neuer Token nur wegen fehlender GH_TOKEN-/CLI-Anmeldung; vorhandene Authentifizierung nutzen, niemals Secretwerte ausgeben.

## Vorhandene Hinweise, keine vorweggenommenen Ergebnisse

- Quellmain war `7995d6968e3895b88f8ed2c3b0476683e5720c1a`; relevante aktuelle und historische Workflowstände jeweils an Run-SHA prüfen. Neuere Branch-Workflows unterscheiden sich erheblich von main.
- Einführung der Releaseprüfung `fafc53b`, sechs Test-Shards ab `4475df1`, am 11.11.2026. Sechs Shards sind nicht automatisch sechs komplette Testläufe. Summierte Joblaufzeit und wiederholte Vorbereitung sind die relevanten Größen, nicht nur Workflow-Wartezeit.
- [Erfolgreiche Integration 43561613512](https://github.com/pahlborn/bis-school-app_src/actions/runs/43561613512) zeigte 14m38s Workflow-/14m35s Jobdauer. Ein einzelner Lauf ist keine Kostenbilanz.
- [Lauf 43561866978](https://github.com/pahlborn/bis-school-app_src/actions/runs/43561866978) und [43561866948](https://github.com/pahlborn/bis-school-app_src/actions/runs/43561866948) meldeten Startverweigerung wegen Zahlungs-/Ausgabengrenzen. Nicht als tatsächlich ausgeführte Tests oder als belegter Minutenverbrauch aus ihrer kurzen Workflowdauer zählen.
- Am 15.11.2026 waren 235 Run-IDs in zehn Listenseiten sichtbar; das war ein damaliger Snapshot aller Workflows, keine vollständige Job-/Attemptauswertung und keine aktuelle Sollzahl.
- Peter hat die Repositories inzwischen öffentlich gestellt. Der genaue Sichtbarkeitswechsel und die historische Abrechnung sind nicht automatisch aus heutiger Public-Sichtbarkeit ableitbar. Standardrunner öffentlicher Repos und Speicher-/größere Runner getrennt behandeln.
- GitHub-Autor/Actor `pahlborn` identifiziert keinen bestimmten Agenten. Rolle, Codeautor, auslösender Host, Publisher und erneuter manueller Start können verschieden sein. Ohne belegte Zuordnung keine Schuldzuweisung.

## Arbeit und Ergebnis

1. Für den definierten Umfang relevante Runs vollständig paginiert erfassen und auf PR, Head-SHA, Ereignis, Workflow/Version und Attempt beziehen. Abbrüche, erneute Attempts, Jobstatus und vorgeschaltete Startverweigerungen getrennt ausweisen. Gelesene Seiten und nicht zugängliche Datensätze dokumentieren.
2. Eine maschinenlesbare Tabelle erstellen: Run-/Attempt-/Job-ID, öffentliche Quelle, PR/Head-SHA, Workflow, Runner soweit belegt, Start/Ende, tatsächliche Jobdauer, Status, erneuter Lauf/Überschneidung und Aussagegrenze. Fehlende Zeitwerte sind unbekannt; Workflowdauer nicht als Ersatz für die Summe der Jobzeiten verwenden. Gleiche Jobs nicht durch Run-/Attemptduplikate doppelt zählen.
3. Aus tatsächlich verfügbaren Jobdaten die erfasste Ausführungszeit berechnen und Rechenweg offenlegen. Warteschlange, abgelehnte Starts und bereits abgebrochene Jobs korrekt behandeln. Abrechnungsregeln/Rundung, Betriebssystem-/Runnerpreise und private/public-Nutzung gesondert prüfen. Eine technische Zeitsumme ist noch keine Rechnung. Ohne notwendige private Billingdaten höchstens ausdrücklich bezeichnete Teilbilanz/Szenarien liefern; keine erfundenen Euro-/Dollarkosten und keine globale Einspargarantie.
4. Konkrete mögliche Verschwendung prüfen: alte weiterhin laufende PR-Stände, identische Wiederholungen ohne neue Diagnose, überbreite Trigger, Draft-PRs, mehrfaches Browser-/Dependencysetup, unnötige Vollsuiten. Auch Gegenbelege suchen: neue Fehlerkorrektur, veränderter Kandidat oder erforderlicher Release-Nachweis kann einen weiteren Lauf rechtfertigen. Fehlgeschlagener Test ist nicht automatisch unsinnig.
5. Höchstens drei priorisierte Vorschläge mit betroffenen Workflowpfaden und beobachteten Fällen liefern, z.B. gezielte Concurrency/Abbruch älterer Kandidaten oder passende Prüfaufteilung/Caches. Testabdeckung erhalten, keine pauschale CI-Abschaltung oder Übernahme von skip-ci als universellen Schutz. Änderungen nur vorschlagen, nicht implementieren.

## Parallelität und Befugnisse

Read-only gegenüber Produktcode, Relay, Workflows und GitHub-Einstellungen. Keine Actions/Tests/Builds/Modell-/Relay-Aufrufe, bezahlte Recherchepipeline, Reruns, Abbrüche laufender Jobs, Cachelöschungen, Runnerinstallationen, Billingänderungen, Code-PRs, Merges oder Veröffentlichungen der App. Die Untersuchung selbst darf keinen neuen Actionsverbrauch als Funktionsbeweis erzeugen.

Keine Änderung anderer Aufgaben, ihrer Arbeitsbäume oder `CONTROL.md`. Ergebnisse ausschließlich in neuen Dateien unter `handoffs/big-quest/results/BQ-EVAL-01-CI-01/` in einem eigenen Dokumentationsbranch vorbereiten. Bereinigte Dokumentationsablage und Archivmeldung sind im bestehenden Mandat erlaubt; vor Veröffentlichung Trigger prüfen, keine privaten Billing-/Downloadadressen oder Secrets veröffentlichen. Konkrete technische/automatische Schreibblocker berichten, vorhandene Freigaben nicht erneut erfragen und Ablehnungen nicht umgehen. Fehlender Billingzugriff verhindert nicht die unabhängige öffentliche Laufanalyse.

## Abnahme und Rückgabe

Erwartet werden eine kurze Auswertung, die nachvollziehbare Run-/Jobtabelle, Rechenweg, Quellenindex und höchstens drei priorisierte Vorschläge. Vollständigkeit nur für tatsächlich vollständig gelesenen Umfang behaupten. Berichten, dokumentierte Angaben und Berechnung klar trennen; nicht belegbare Agenten-/Kosten-/Abrechnungszuordnung ausdrücklich offen lassen.

```markdown
# BQ-EVAL-01-CI-01 · Rückgabe v1
Status: DELIVERED / PARTIAL_WITH_LIMITS / BLOCKED
Auftrag v1 / unveränderlicher Link:
Prüfzeitpunkt, Zeitraum/Zeitzone, Repos/PRs, gelesene Seiten und Abdeckung:
Öffentliche Auswertung/Tabelle/Quellen oder konkreter Ablageblocker:
Ausführungszeit: erfasste Job-/Attemptsumme und Rechenweg; fehlende Daten:
Abrechnung: was ist belegt, abgeleitet, nicht zugänglich:
Konkrete vermeidbare Läufe/Überlappungen und Gegenbelege:
Höchstens drei Vorschläge mit Wirkung, Risiko und betroffenen Pfaden:
Agentenzuordnung belegt / unbekannt, keine Schlussfolgerung nur aus GitHub-Login:
Tatsächliche Ausführung und externe Wirkungen; keine Actions gestartet:
Empfohlener nächster Schritt; noch nicht selbst begonnen:
```

Nach Rückgabe stoppen. Ein Analysebefund ist keine Freigabe zur Workflow-/Budgetänderung. Zentrale Steuerung entscheidet über einen späteren begrenzten Umsetzungsschnitt; laufende Entwicklungsaufträge bleiben unberührt.
