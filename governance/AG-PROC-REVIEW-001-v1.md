# AG-PROC-REVIEW-001 — Prozessreview der ersten Agentarium-Arbeit

Version: 1.0 REVIEW  
Stand: 2026-10-13  
Verantwortung: Atlas  
Status: Review abgeschlossen; Empfehlungen noch nicht als Regel übernommen  
Bezug: Agentarium Rulebook V1.1 DRAFT, AG-PROC-MODEL-001 V0.2 APPROVED, AG-TEAM-001, visuelle Mock-Arbeit

## 1. Fragestellung und Ergebnis

Dieses Review beantwortet vier Fragen:

1. War Cadence als Prozessagent tatsächlich beteiligt?
2. Wo bestehen Verbesserungsmöglichkeiten in Prozess und Regelwerk?
3. Passen die vorhandenen Rollen, Skills und Fähigkeiten?
4. Welche Rückmeldungen stammen nachweislich von echten Agenten?

**Ergebnis:** Cadence war bei AG-TEAM-001 und bei der Prüfung von AG-PROC-MODEL-001 tatsächlich beteiligt. Für die spätere Mock-Erstellung und deren Korrekturschleife ist keine materielle Cadence-Beteiligung belegt. Im vorliegenden Prozessreview wurde Cadence erneut über eine echte, getrennte Claude-Code-Sitzung beteiligt. Die Abwesenheit bei den Mocks war kein automatischer Regelverstoß, weil Cadence kein Pflicht-Gate für jeden Auftrag ist. Nach den wiederholten Forge-Fehlschlägen und den Relay-Anpassungen wäre eine gezielte Prozesseinschaltung jedoch sinnvoll gewesen.

Der Prozess hat die Rollen grundsätzlich sauber getrennt und nach Fehlern belastbare Ergebnisse erzeugt. Die größten Lücken liegen in der Replay-Sicherheit des Relays, der Diagnose vor weiteren bezahlten Versuchen, der dauerhaften Ablage von QA-Harness und Testergebnissen sowie in einer kurzen, versionsgebundenen Kontext- und Abnahmedefinition.

Keine Empfehlung dieses Dokuments ändert bereits Regeln, Rollenrechte, Modellvorgaben, Architektur, Merge- oder Veröffentlichungsbefugnisse.

## 2. Nachweis der echten Beteiligung

| Rolle | Laufzeit | Nachweis dieses Reviews | Aussagegrenze |
|---|---|---|---|
| Atlas | ChatGPT | Orchestrierung und Konsolidierung dieses Dokuments | Hauptchat-Modell und Denkaufwand nicht separat bestätigt |
| Nova | echter ChatGPT-Subagent `/root/nova_team001` | Rollen-Skill `create-vision-with-nova`; informierte Folgeauswertung der vier Mock-Varianten | keine Browser-Pixelprüfung |
| Scout/RKA | echter ChatGPT-Subagent `/root/scout_process_review` | Rollen-Skill `build-research-knowledge`; Evidenz- und Kostenregister | tatsächliches ChatGPT-Modell und Denkaufwand nicht separat bestätigt |
| Argus | echter ChatGPT-Subagent `/root/argus_team001` | Rollen-Skill `review-agent-argus`; unabhängiger Prozess- und Codebefund | keine Implementierung |
| Sentinel | echter ChatGPT-Subagent `/root/sentinel_agentarium` | Rollen-Skill `qa-agent-sentinel`; QA-Prozessreview V2 | Browserdarstellung nicht getestet |
| Archibald | Claude Code, `spec-agent` | [Issue-Kommentar 6150728851](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6150728851), [Actions-Run 38434396686](https://github.com/pahlborn/agentarium/actions/runs/38434396686) | Review aus dem übergebenen Evidenzpaket; kein Repository-Lesezugriff in diesem Lauf |
| Forge | Claude Code, `coding-agent` | [Issue-Kommentar 6150740099](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6150740099), [Actions-Run 38434396686](https://github.com/pahlborn/agentarium/actions/runs/38434396686) | retrospektive Implementierungssicht; keine Tools im Reviewlauf |
| Cadence | Claude Code, `process-agent` | [Issue-Kommentar 6150760833](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6150760833), [Actions-Run 38434396686](https://github.com/pahlborn/agentarium/actions/runs/38434396686) | vollständige Konformitätsprüfung gegen das Rulebook nicht möglich, weil der Reviewlauf nur das Evidenzpaket erhielt |

Der gemeinsame Claude-Run endete für alle drei Rollen erfolgreich. Gemeldete Laufzeitdaten:

| Rolle | angefordert | tatsächlich gemeldet | tatsächlicher Denkaufwand | gemeldete Kosten USD |
|---|---|---|---|---:|
| Archibald | Rollen-Default Opus/High | `claude-opus-5-5` | unconfirmed | 0.092406 |
| Forge | Rollen-Default Sonnet/Medium | `claude-sonnet-5-5` | unconfirmed | 0.025463 |
| Cadence | Rollen-Default Opus/Medium | `claude-opus-5-5` | unconfirmed | 0.123781 |
| **Review gesamt** | | | | **0.241650** |

Die Texte wurden nicht von Atlas erzeugt oder als Agentenantwort simuliert. Für ChatGPT-Subagenten liegen echte Rollenläufe vor; die Plattform stellt in diesem Arbeitskontext jedoch keinen unabhängigen Modell- oder Kostennachweis pro Subagent bereit.

## 3. Was funktioniert hat

- Die Rollen blieben fachlich getrennt: Vision, Wissen, Spezifikation, Implementierung, Review, QA und Prozess wurden nicht als austauschbare Identitäten behandelt.
- Angefordertes und tatsächlich gemeldetes Claude-Modell wurden getrennt dokumentiert; der tatsächliche Denkaufwand blieb korrekt `unconfirmed`.
- Die Mock-Korrektur war eng begrenzt. Sentinel bestätigte die Entwicklung von 28 bestandenen und 5 fehlgeschlagenen Prüfungen zu 73 bestandenen Prüfungen mit der Einschränkung `PASS_WITH_LIMITS`.
- Browser- und mobile Pixelwirkung wurden nicht als getestet behauptet.
- Peter behielt Merge-, Freigabe- und Veröffentlichungsentscheidungen.
- Nach dem Relay-Problem wurde ein kleiner Forge-Test durchgeführt, bevor größere Folgearbeit fortgesetzt wurde.

## 4. Teamrückmeldungen

### Nova

Nova hält die getrennten Atlas- und Forge-Varianten für einen sinnvollen visuellen Suchraum. Die funktionale QA kann die visuelle Richtung nicht auswählen. Für den nächsten visuellen Schritt fehlen ein kurzer, von Peter bestätigter Vision-Anker, dieselbe Ereignisgeschichte für alle Vergleichsentwürfe und eine echte Browser-Sichtung vor der Richtungsentscheidung.

### Scout/RKA

Scout sieht keine fehlende Research-Fähigkeit. Es fehlt ein kanonisches, maschinenlesbares und fortschreibbares Evidenz- und Kostenregister. Das bestehende Rollenregister beschreibt vor allem AG-TEAM-001 und ersetzt kein aktuelles Ausführungsjournal. Außerdem sind tatsächliche ChatGPT-Modelle, Denkaufwände, Provider-Restsaldo und Kosten fehlgeschlagener Läufe unbekannt.

### Archibald

Archibald konnte aus dem Evidenzpaket keine eigene Beteiligung vor der Mock-Implementierung belegen. Er empfiehlt für nicht triviale oder sicherheitsrelevante Aufgaben eine kurze Mini-Spezifikation mit exaktem Ausgabeformat, beobachtbaren Kriterien und MUST-NOT-Grenzen. Zusätzlich fehlen ein kanonischer Handback-Vertrag und eine konsistente Agentarium-Kennung; sein Rollenprofil enthält noch eine projektfremde `GT40`-Präfixkonvention.

### Forge

Forge bewertet die Implementierungsrolle als passend. Die vorhandene Trennung erlaubt Forge zu schreiben, aber nicht selbst Tests als unabhängig ausgeführt zu behaupten. Testnachweise müssen Atlas oder Sentinel zugeordnet werden. Ausgabeformat, Zustandslebenszyklus, Fehlerklassen und Handback-Pflichtfelder sollten vor dem Lauf maschinenprüfbar beschrieben werden. Forge empfiehlt keine Erweiterung seiner Rechte.

### Argus

Argus bewertet die dauerhaften Prozesssicherungen derzeit als **FAIL**, ohne damit die erfolgreichen Forge-Ergebnisse zu verwerfen. Sein bestätigter Hauptbefund: `relay/forge_mock_once.py` und `relay/forge_mock_correction_once.py` prüfen nur die ersten 100 Issue-Kommentare. Nach mehr als 100 Kommentaren kann Replay-Erkennung ausfallen. Zusätzlich wurden nach dem ersten nicht diagnostizierten `EXECUTION_FAILED` zwei weitere bezahlte Varianten gestartet, bevor die Ursache belegt war. Die 73 QA-Assertions sind berichtet, aber Harness und vollständige Ergebnisse sind nicht dauerhaft im Repository abgelegt.

### Sentinel

Sentinel bewertet den Ablauf als **PASS_WITH_LIMITS**. Korrekturschleife, funktionale Assertions und offene Einschränkungen sind nachvollziehbar. Nicht getestet oder nicht ausreichend belegt sind die Testbarkeitsprüfung vor Implementierung, Browser-/Mobile-Wirkung und die unabhängig wiederholbare QA anhand eines persistierten Harness. Sentinel empfiehlt getrennte Gates für Logik und visuelle Abnahme.

### Cadence

Cadence bestätigt seine materielle Beteiligung an AG-TEAM-001 und AG-PROC-MODEL-001, aber nicht an der Mock-Erstellung. Die spätere Nichteinbindung war kein Pflichtverstoß. Die wiederholten Relay-Fehler wären jedoch ein legitimer Eskalationsgrund gewesen. Cadence empfiehlt ausdrücklich kein Prozess-Gate für jeden kleinen Auftrag und keine Vollteam-Runde für kleine Korrekturen.

## 5. Befunde und Priorität

### P0 — Replay-Sicherheit des Relays

Die beiden Mock-Wrapper durchsuchen nur die erste Seite mit 100 Issue-Kommentaren. Issue #2 hatte zum Reviewzeitpunkt 35 Kommentare; der Fehler ist deshalb aktuell latent und blockiert die vorhandenen 35 Einträge noch nicht. Er muss vor Überschreiten der Seitengrenze oder vor einem weiteren replay-abhängigen bezahlten Auftrag behoben werden.

Technische Korrektur:

- vollständige Pagination oder zentraler, vollständig paginierter Replay-Checker;
- bei unvollständigem Abruf explizit abbrechen;
- Offline-Regressionsprüfung mit mindestens 150 Kommentaren und Marker auf Seite 2.

### P1 — Diagnose vor bezahltem Retry

Nach einem unklassifizierten Relay- oder Ausführungsfehler folgt zuerst eine kostenlose Diagnose oder ein technischer Preflight. Ein weiterer bezahlter Versuch benötigt eine dokumentierte Fehlerklasse und eine begründete Korrektur. Guthaben-, Quota- oder Budgetfehler bleiben gemäß AG-PROC-MODEL-001 ohne automatischen Retry.

### P1 — Persistente QA-Evidenz

Quantifizierte Aussagen wie „73 Assertions bestanden“ brauchen:

- versioniertes Harness;
- Eingabestand oder Commit;
- maschinenlesbares Ergebnis;
- Hash beziehungsweise eindeutige Artefaktkennung;
- klare Kennzeichnung von `NOT_TESTED` und `PASS_WITH_LIMITS`.

### P1 — Drei getrennte Abnahmeebenen

Für visuelle Aufträge werden künftig separat ausgewiesen:

1. Transport und Relay,
2. Funktions- und Datenverhalten,
3. visuelle Browser-/Mobile-Abnahme.

Ein bestandener Relay-Test oder VM-Test darf keine visuelle Freigabe implizieren.

### P2 — Kurzer versionsgebundener Kontext

Für nicht triviale Aufträge genügt eine kurze Aufgabe mit Ziel, Version, beobachtbaren Kriterien, Ausgabeformat, MUST-NOT-Grenzen und Zuständigkeit für Testnachweise. Eine Vollspezifikation bleibt unnötig. Bei visuellen Aufträgen kommt ein kurzer, bestätigter Vision-Anker hinzu.

### P2 — Gemeinsames Evidenz- und Kostenjournal

Empfohlen ist ein append-only `task-evidence.jsonl` oder gleichwertiges Register mit mindestens:

- Aufgabe und Version;
- Rolle, Sitzung, Run und Definitionsstand;
- angefordertes und tatsächlich belegtes Modell;
- gemeldete Kosten und Kostenquelle;
- Fehlerklasse, QA-Status und offene `NOT_TESTED`-Bereiche;
- Ablösung eines früheren Ergebnisses.

Das Journal ersetzt weder Rollenregister noch Fachartefakte.

### P2 — Infrastruktur-Fallback von Atlas

Wenn Atlas wegen eines Relay-Defekts Infrastrukturcode ändert, werden Auslöser, begrenzter Umfang, Review und QA explizit dokumentiert. Daraus entsteht kein allgemeines Implementierungsrecht und keine Änderung der Rollenarchitektur.

## 6. Skills und Fähigkeiten

| Bereich | Bewertung | Fehlende Fähigkeit oder Artefakt |
|---|---|---|
| Atlas-Orchestrierung | passend | aktuelle, zentrale Evidenzsicht |
| Nova/Vision | passend | bestätigter Vision-Anker und echte Browser-Sichtung |
| Scout/RKA | passend | maschinenlesbares Evidenz-/Kostenjournal |
| Archibald/Spezifikation | passend | kanonische Handback-Schablone, Agentarium-Präfix, bei Review ausreichender Evidenzzugriff |
| Forge/Implementierung | passend | maschinenprüfbare Kriterien; keine zusätzlichen Rechte empfohlen |
| Argus/Review | passend | Replay-Regressionsschutz und persistierte Review-Grundlage |
| Sentinel/QA | passend | persistiertes Harness, Browser-/Mobile-Testfähigkeit |
| Cadence/Prozess | passend | vollständiges Regelwerk und konsolidierte Teamevidenz im Reviewpaket |

Es fehlt keine neue Fachrolle. Die Defizite sind überwiegend Artefakte und technische Prüffähigkeiten. Besonders fehlen eine echte Browser-/Mobile-Abnahme, dauerhaft reproduzierbare QA und ein zentrales Evidenzjournal.

## 7. Kostenlage

Die im Projekt bisher aus regulären, dokumentierten Claude-Läufen ableitbaren Kosten betragen nach Einbezug dieses Reviews mindestens **USD 0.6414599**. Davon entfallen USD 0.241650 auf dieses Prozessreview.

Dies ist kein vollständiger Projektsaldo. Nicht enthalten oder unbekannt sind insbesondere fehlgeschlagene frühere Aufrufe, ältere Identitätstests, ChatGPT-Subagenten-Kosten und der verbleibende Anthropic-Kontostand. Es wird keine Euro-Umrechnung und keine Restguthabenbehauptung vorgenommen.

## 8. Empfohlene Entscheidung

Atlas empfiehlt ein kleines Änderungspaket:

1. Replay-Pagination und Abbruch bei unvollständigem Abruf technisch korrigieren;
2. vor einem bezahlten Retry Fehlerklasse und Diagnose dokumentieren;
3. quantifizierte QA nur mit persistiertem Harness und Ergebnis führen;
4. Relay-, Funktions- und visuelle Abnahme getrennt ausweisen;
5. ein append-only Evidenz- und Kostenjournal einführen;
6. Atlas-Infrastruktur-Fallback als begrenzte Ausnahme dokumentieren.

Die Punkte 2 bis 6 ändern den verbindlichen Prozess und benötigen Peters gesonderte Freigabe. Punkt 1 ist ein technischer Fehlerbefund; seine Umsetzung bleibt ein eigener begrenzter Implementierungsauftrag mit Review und QA.

Nicht empfohlen werden ein Cadence-Pflichtgate für jeden Auftrag, ein Vollteam-Review für kleine Änderungen, ein Argus-Gate für jede Routinekorrektur oder ein universeller Browser-Test für nicht visuelle Aufgaben.
