# BQ-EVAL-01-CI-01 · Fehlende Belege wiederherstellen und vollständig liefern

Nachauftrag RECOVERY v1 · 15.11.2026 · Parent BQ-EVAL-01-CI-01 · Projekt big-quest · Lauf BQ-EVAL-01.

## Startsequenz und Zuständigkeit

Atlas, lade und verwende `operate-as-atlas`. Lies diesen Auftrag, aktuelle AGENTS-/Process-/Rulebook-Vorgaben und die unten verlinkten Rückgaben. Aktueller hier bestätigter Regelstand: Agentarium-main `6700bc2e581739b7b6d751fb9dfef2328b0cd32a`; vor Beginn aktualisieren. Nenne Regeln, Ausgangslage, tatsächlichen Ausführer und Grenzen.

Dieser Ausführungs-Chat erledigt die Arbeit. Der zentrale Chat bleibt Steuerung, prüft die Rückgabe und entscheidet über Annahme. Er soll nicht selbst fehlende Tabellen nacharbeiten. Historische Statusmeldungen sind keine fertige Beleglieferung. Keine pauschale Ablage als „ruhend“ oder „PARTIAL“ als Ersatz für den beauftragten Abschluss.

Archivmodus big-quest/BQ-EVAL-01, kein Livebetrieb. Arbeite direkt als Atlas an der Analyse-/Dokumentationsaufgabe; keine automatische Agenten- oder Vertretungskaskade. Vertretung ausschließlich bei belegtem technischem Problem UND Peters ausdrücklicher vorheriger Zustimmung zum konkreten Einsatz. Keine solche Zustimmung aus diesem Auftrag ableiten.

## Ausgangslage und vorhandene Referenzen

Die ursprüngliche Analyse wurde mit 47 Runs, 48 Attempts, 85 Jobdatensätzen und 75 ausgeführten Jobs berichtet. Gemeldete Jobzeit 3:11:11; zehn Startverweigerungen wurden nicht addiert. Kosten und Agentenzuordnung blieben unbekannt. Vollständige Tabellen, Quellen und Rechenskript wurden als vorbereitet bezeichnet, sind aber nicht gesichert zugänglich.

- [Ursprünglicher CI-01-Auftrag](https://github.com/pahlborn/agentarium/blob/7aba936af83b8b1212307ef5bff71bf2420da06f/handoffs/big-quest/BQ-EVAL-01-CI-01.md)
- [Konsolidierte Rückgabe, Summen und tatsächliche Beleglücke](https://github.com/pahlborn/agentarium/blob/92cd74deb317271ba8e202b3374486fea7a81c4e/handoffs/big-quest/returns/BQ-EVAL-01-CI-01-return-01.md)
- [Bereits konkretisierte Publikationsfreigabe](https://github.com/pahlborn/agentarium/blob/d601521412311704a6a9ab7a70db4e4e271357b4/handoffs/big-quest/BQ-EVAL-01-CI-01-PUBLISH.md)
- Repo https://github.com/pahlborn/bis-school-app_src, PR193 und PR198, Zeitraum 11.–14.11.2026 Europe/Berlin: Beginn 10.11.2026 23:00 UTC, Ende 14.11.2026 23:00 UTC exklusiv.
- Öffentliche Actions-Historie: https://github.com/pahlborn/bis-school-app_src/actions
- Referenzlauf https://github.com/pahlborn/bis-school-app_src/actions/runs/43561613512 mit Integration-Job 132346345942; berichtete Jobzeit 14:35, Workflowspanne 14:38.
- Verweigerter Lauf https://github.com/pahlborn/bis-school-app_src/actions/runs/43561866978 einschließlich gemeldetem zweitem Attempt; ein verweigerter Start ist keine tatsächlich ausgeführte Prüfung.

Alle notwendigen öffentlichen Quellen selbst abrufen. Peter muss keine Tabellen, ZIPs oder privaten Downloadlinks zwischen Chats übertragen. Fehlender Dateizugriff im aktuellen Workspace ist kein Grund, erneut dieselbe Veröffentlichungsfreigabe zu erfragen.

## Verbindliches Vorgehen

1. Einmal gezielt prüfen, ob die bereits erstellten Originaltabellen und das Skript im ursprünglichen Arbeitskontext, benannten Sicherungsstand oder einer tatsächlich zugänglichen Ablage liegen. Nicht nur nach einer bekannten Zusammenfassung suchen. Tatsächliche Fundstellen und Suchumfang nennen. Keine endlose Suche in fremden Chats behaupten und keinen unbekannten Sicherungsort erfinden.
2. Sind Originale vorhanden: Integrität und Zuordnung prüfen, vervollständigen und veröffentlichen. Sind sie nicht vorhanden: **eine neue, ausdrücklich als Rekonstruktion bezeichnete Belegfassung** aus den GitHub-Originaldaten erstellen. Diese gezielte erneute lesende Datenerhebung und Berechnung ist hier ausdrücklich autorisiert; die frühere Einschränkung „nur bestehende Dateien publizieren, keine neue Analyse/Skriptausführung“ steht diesem Nachauftrag nicht entgegen.
3. Relevante Runs vollständig paginiert erfassen, Attempts und Jobs eindeutig deduplizieren. Je Datensatz Quelle, Run-/Attempt-/Job-ID, PR, Head-SHA soweit lesbar, Workflow/Version, Status, Zeitdaten, Runner-/Stepnachweis, Klassifikation ausgeführt/verweigert/übersprungen und Aussagegrenzen sichern. API nutzen, soweit verfügbar; vorhandene Authentifizierung wiederverwenden. Fehlender API-Netzzugriff ist von fehlender Erlaubnis zu unterscheiden. Öffentliche GitHub-Web-/Jobansichten als dokumentierten alternativen Leseweg auswerten; kein Netz-/Zugangsschutz umgehen.
4. Reines lokales Erhebungs-/Rechenskript erstellen und ausführen. Es darf GitHub read-only lesen, Daten normalisieren und Summen berechnen. Keine Anwendungstests, Modell-/Relay-Aufrufe oder Actions/Reruns auslösen. Rechenweg, Befehle, Versionen und Datensnapshot dauerhaft mitliefern. Dateinamens-/URL-/Authwerte sicher behandeln; keine Secrets protokollieren.
5. Jobausführung und Warteschlange/Workflowspanne/Startverweigerung korrekt trennen. Wenn ein Web-Leseweg nur angezeigte Dauer statt API-Start-/Endzeit liefert, die Herkunft ausdrücklich markieren; fehlende Zeitstempel nicht als beobachtete API-Werte ausgeben. Abgeleitete Zeitwerte sind abgeleitet. Ausführungssumme, Abrechnungsannahmen und echte Rechnung bleiben getrennt.
6. Die neue Tabelle mit den gemeldeten 47/48/85/75 und 3:11:11 vergleichen. Nicht auf diese Zahlen hinbiegen. Bei anderem Datenstand Unterschiede nach IDs/Zeitraum/Attempts nachvollziehen und ausdrücklich erklären. Die frühere Rückgabe bleibt historisch erhalten. Eine Rekonstruktion ersetzt keine unbekannte Originaldatei mit angeblich gleicher Identität.
7. Die vorhandenen drei Verbesserungsvorschläge nur anhand der gesicherten Daten begründen oder korrigieren. Keine neue allgemeine Optimierungsstudie und keine Umsetzung. Kosten/privat-public-Historie sowie Agentenzuordnung dürfen unbekannt bleiben, wenn die technischen Ausführungsdaten und ihre Grenzen vollständig geliefert sind. Kein Billingzugriff ist dafür Voraussetzung.

## Konkrete Schreibfreigabe für den Abschluss

Dieser Auftrag ist read-only gegenüber den untersuchten Produkt-/Workflow-/Billing-Systemen. Davon ausdrücklich ausgenommen und erlaubt sind:

- Im Repo `pahlborn/agentarium` auf eigenem Dokumentationsbranch `docs/bq-eval-01-ci-01-recovery` ausschließlich neue Ergebnisdateien unter `handoffs/big-quest/results/BQ-EVAL-01-CI-01/` ablegen: Auswertung, Tabellen als CSV/JSON, Quellenindex, benötigte normalisierte Quelldaten, Skript/Anleitung und SHA256-Manifest. Keine privaten Ablagelinks, Credentials oder fremden personenbezogenen Inhalte veröffentlichen. Vor Push Trigger prüfen; kein PR/Main-Merge, keine Änderung an CONTROL.md oder anderen laufenden Aufgaben.
- Eine bereinigte Abschluss-Rückmeldung auf `pahlborn/agentarium` Issue #2 unter project_id big-quest, run_id BQ-EVAL-01 und task_id BQ-EVAL-01-CI-01 veröffentlichen; nicht Allgemein. Aktuellen Ereignisvertrag laden, keine erfundenen Runtime-Starts oder Annahme.
- Nach Veröffentlichung Links und Bytes/Prüfsummen tatsächlich zurücklesen und die Wiederverwendbarkeit der öffentlichen Ablage bestätigen.

Keine weitere pauschale Nachfrage an Peter für genau diese Operationen. Bei automatischer Ablehnung konkrete Aktion und wortgetreuen Grund festhalten, nicht umgehen. Eine einmalige dokumentierte Anpassung an den tatsächlichen erlaubten Ergebnisumfang ist zulässig; keine identische automatische Wiederholung. Bei unvermeidbarem externem Blocker die vollständigen fertigen Dateien in einem stabilen für Peter tatsächlich lesbaren Paket sichern und genau die eine nötige Entsperraktion benennen. Nicht nur sagen, dass Dateien irgendwo vorbereitet seien.

## Fertigkriterien

- Dauerhaft zugängliche Auswertung, Run-/Attempt-/Jobtabellen, Quellenbelege, ausführbares reines Rechenskript, Anleitung und Prüfsummen liegen tatsächlich vor.
- Skript und mitgelieferter Datenstand ergeben die publizierten Zahlen; Herkunft und Unterschiede zur alten Teilrückgabe sind erklärt.
- Nicht verfügbare Abrechnung/Agentenidentität wird nicht erfunden und nicht als Vorwand zum Weglassen verfügbarer technischer Belege genutzt.
- Kein neuer Actionsverbrauch, Workfloweingriff oder Produktauftrag wurde ausgelöst.
- Rückgabe enthält verifizierte konkrete Artefaktlinks, nicht nur eine Zusammenfassung oder eine erneut verschobene Ablageaufgabe.

## Rückgabe

```markdown
# BQ-EVAL-01-CI-01 · Recovery-Rückgabe v1
Status: DELIVERED / BLOCKED mit konkretem externem Hindernis
Originale wiedergefunden / neue Rekonstruktion, mit tatsächlichem Suchumfang:
Unveränderlicher öffentlicher Ergebniscommit und Dateilinks:
Run-/Attempt-/Jobanzahl, technische Zeit, Rechenweg und Datensnapshot:
Abgleich mit früheren 47/48/85/75 und 3:11:11; konkrete Differenzen:
Skript, Anleitung und tatsächlich zurückgelesene SHA256:
Quellenabdeckung und präzise nicht zugängliche Daten:
Kosten-/Agentenzuordnung: belegt / unbekannt:
Archivbeleg oder konkrete Meldesperre:
Tatsächliche Außenwirkungen; keine Actions/Tests/Modellaufrufe:
Falls BLOCKED: fertiger stabiler Sicherungsort, genaue Sperre und eine nötige Aktion:
```

Nach vollständiger Lieferung an die zentrale Steuerung stoppen. Keine Optimierung oder Folgeaufträge beginnen. Die zentrale Steuerung prüft die Rückgabe; der Ausführungs-Chat ersetzt diese Annahme nicht durch eine eigene Abschlussbehauptung.
