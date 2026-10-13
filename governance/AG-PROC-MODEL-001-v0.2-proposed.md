# AG-PROC-MODEL-001 — Aufgabenabhängige Modellwahl
Version: 0.2 PROPOSED
Stand: 2026-10-13
Prozessverantwortliche: Peter und Atlas
Status: überprüfbarer Vorschlag, noch nicht verbindlich übernommen
Vorgänger: governance/AG-PROC-MODEL-001.md, V0.1, Blob 060a28295398d54490eb061e724d85621001784c
Bezug: Agentarium Rulebook V1.1 DRAFT, insbesondere §§1, 2.2, 3.1, 13.

## 1. Ziel und unveränderte Grenzen
Atlas wählt für jeden neuen Fachauftrag eine geeignete Modellfamilie und einen angemessenen Denkaufwand anhand von Schwierigkeit, Auswirkungsrisiko, belegter Verfügbarkeit und autorisiertem Kostenrahmen. Rollen, Werkzeuge, Berechtigungen, unabhängige Reviews und Peters Freigaben ändern sich dadurch nicht.

R (Routine): Luna/Haiku als Orientierung; F (Fachauftrag): Sol/Sonnet; K (kritisch): Astra/Opus. Diese Familien sind Orientierung, keine getestete Qualitätsgarantie, keine festen technischen IDs und kein Verfügbarkeitsnachweis. Die konkrete Wahl berücksichtigt die Aufgabe; weder ein günstiger noch ein teurer Aufruf ersetzt fachliche Prüfung.

## 2. Vorrang und bestehende Modellvorgaben
Plattformgrenzen, Peters konkrete Entscheidung und verbindliche auftrags-/rollenspezifische Vorgaben gehen einer Orientierung aus §1 vor.

Vor jedem Aufruf unterscheidet Atlas:
- verbindliche Modellvorgabe;
- technischen Default der Rolle;
- bevorzugte Modellfamilie für die Aufgabe;
- explizit angefordertes Modell und Reasoning;
- tatsächlich beobachtete Ausführung.

Die Orientierung überschreibt weder bestehende Aufträge noch `model:`-/Reasoning-Einträge. Die aktuelle Claude-Basis bleibt `spec-agent: opus/high`, `coding-agent: sonnet/medium`, `process-agent: opus/medium`.

Eine auftragsbezogene Default-Abweichung ist nur zulässig, wenn Atlas Kompatibilität mit Rollenvertrag und Runtime geprüft, die Wahl einschließlich Abweichung begründet und die Autorisierungs-/Budgetgrundlage dokumentiert hat. Ein verbindliches Rollenmodell verlangt eine ausdrückliche Ausnahmeentscheidung; ein persistenter Default wird ausschließlich durch einen getrennt geprüften Änderungsauftrag geändert. Eine neue Prozessentscheidung ist keine automatische Agentendefinitionsänderung.

## 3. Runtime-Fähigkeit statt Modellversprechen
Atlas prüft vor dem Start das tatsächlich verfügbare Aufrufschema. Ein Skill installiert kein Modell. Fehlende Auswahlmöglichkeit wird als `not_selectable` dokumentiert.

In dieser Work-Laufzeit sind explizite Subagent-Modell-/Reasoning-Parameter ausschließlich bei `fork_turns=none` vorgesehen; vollständige History-Forks übernehmen die Runtime und akzeptieren keine solchen Overrides. Eine Umstellung des laufenden Atlas-Hauptchats ist hier nicht als Werkzeug verfügbar. Sol/Medium bleibt deshalb eine Präferenz, keine Behauptung über den Hauptchat.

Bei Claude Code muss ein erlaubter Aufruf eine gewünschte Auswahl technisch übergeben; YAML im Prompt ist allein kein Beleg, dass ein Default angewandt wurde. Vorhandene einmalige Identitäts- und Aufgaben-Relays werden nicht zu allgemeinen, unbegrenzten Ausführungskanälen erklärt.

## 4. Nachweis pro Auftrag
```yaml
model_routing:
  task_complexity: R | F | K
  risk: low | medium | high
  target_platform:
  role_model_constraint_or_default:
  preferred_model_family:
  requested_model: # expliziter Parameter oder inherited/not_selectable
  requested_reasoning:
  actual_model: # unabhängige Laufzeitangabe oder unconfirmed
  actual_reasoning: # unabhängige Laufzeitangabe oder unconfirmed
  model_evidence:
  override_authorization_and_reason:
  budget_authorization:
  estimated_cost_limit:
  reported_actual_cost:
  fallback_decision:
```

Aufrufparameter belegen die Anforderung, nicht automatisch die ausgeführte Variante. Ein Modellname aus dem Agententext oder ein Rollen-/Sessionname ist kein unabhängiger Modellnachweis. Runtime-Usage/Logs werden nur dann als Beleg übernommen, wenn sie die konkret benannte Sitzung und tatsächliche Modellnutzung nachvollziehbar ausweisen. Mehrere Modelle werden getrennt genannt; ein einzelnes `actual_model` wird nicht erfunden. Nicht ausgewiesener tatsächlicher Denkaufwand bleibt `unconfirmed`, auch bei explizitem Reasoning-Parameter. Vergangene Aufrufe werden nicht nachträglich umetikettiert.

## 5. Kosten, Verfügbarkeit und Stop
Ein Aufruf braucht einen klaren autorisierten Kostenrahmen. Ohne Kostenautorisation oder bei nicht beurteilbarer zulässiger Kostengrenze stoppt der betroffene Aufruf.

Ein nicht lesbarer verbleibender Provider-Kontostand wird getrennt als unbekannt geführt. Er ersetzt keinen Budgetnachweis und begründet keine Verfügbarkeitsbehauptung. Ein ausdrücklich autorisierter, begrenzter Fachauftrag kann in diesem Rahmen ausgeführt werden; bei gemeldetem Guthabenmangel, Key-/Quota-Problem oder Budgetfehler endet er ohne automatischen Retry, Upgrade oder Modellwechsel.

CLI-Kostenlimits sind Schätzgrenzen und keine Garantie für die Rechnung. Atlas dokumentiert Kostenquelle und Grenzen. Keine bezahlten Modellproben allein zur Bestätigung einer Auswahl; bestehende Konfigurations-/Runtime-Belege und Metadaten regulärer Fachaufträge verwenden.

Fallbacks werden vorab mit Zweck, Kompatibilität und Kostenrahmen benannt. Ein Upgrade gegenüber dem bestehenden Rollen-Default, eine höhere Kosten-/Risikostufe oder ein Konflikt mit verbindlichen Vorgaben benötigt Peters Entscheidung. Ein nicht verfügbarer Beitrag ist keine Zustimmung; unabhängige Arbeit darf weiterlaufen.

## 6. Einführung und Entscheidungsumfang
Peter und Atlas entscheiden mit `PROCESS_DECISION` über diese exakte V0.2 und deren Einführung für neue Aufträge. Vor der Entscheidung bleibt der Status `proposed`.

Eine Annahme dieser Ergänzung aktiviert nicht das gesamte noch als DRAFT geführte Rulebook V1.1. Der Bezug und die begrenzte Geltung werden im Prozessregister dokumentiert; eine spätere zentrale Rulebook-Revision erfolgt gesondert. Laufende Aufträge behalten ihre bisherige Baseline; ein Wechsel braucht eine ausdrückliche, nachvollziehbare Rebaselining-Entscheidung.

Die dokumentierte technische Steuerbarkeit ist laufzeitspezifisch. Weder Modelldefaults noch Relay-Rechte werden mit dieser Aufnahme automatisch geändert.

## 7. Delta V0.1 → V0.2
- Vorrang von verbindlicher Vorgabe, technischem Default und Aufgabenpräferenz präzisiert; Override und persistente Änderung getrennt.
- Nicht auswählbare Hauptchat-Modelle und Anforderungen der tatsächlichen Subagent-Runtime ausdrücklich behandelt.
- Angefordert, ausgeführt und Reasoning-Nachweis getrennt; vergangene Calls nicht rückwirkend bestätigt.
- Unlesbarer Kontostand, fehlende Budgetautorisation und tatsächlicher Guthabenfehler getrennt; Kostenschätzgrenzen kenntlich gemacht.
- Begrenzte PROCESS_DECISION, neue Aufträge und nicht automatisch aktiviertes Rulebook DRAFT abgegrenzt.

## 8. Prüfung und noch ausstehende Entscheidung
Cadence / process-agent prüfte V0.1 in einer getrennten Claude-Sitzung `71163eaf-469d-4194-9c90-1a8c27a51069`, Run `38420199480`. Ergebnis: drei notwendige Präzisierungen (Override-Hierarchie, Budgetautorisation gegenüber unbekanntem Saldo, Präferenz/Request gegenüber tatsächlicher Runtime); keine zusätzlichen Blocker. Diese Punkte sind in V0.2 eingearbeitet. Der terminale CADENCE_REPORT ist in Issue #2, Kommentar `6148789041`, unverändert dokumentiert. Er ist keine Prozessfreigabe.

Unabhängige Runtime-Metadaten dieses einen Fachreviews: angefordert Opus/Medium, Modellnutzung laut CLI-JSON `claude-opus-5-5`, tatsächlicher Denkaufwand `unconfirmed`, CLI-gemeldete Kosten USD 0.082876. Kein Modellbenchmark, kein bezahlter Verfügbarkeitstest, kein Retry oder Fallback. Die Modellangabe ist auf diesen einen Lauf begrenzt.

Cadences Vorschlag, die nächsten fünf Aufträge als Wirkungskontrolle anzusehen, ist eine optionale Empfehlung; keine Automation oder gesonderte Pflicht-Gate wurde aktiviert.

Erbetene PROCESS_DECISION: genau diese AG-PROC-MODEL-001 V0.2 als eigenständige Ergänzung für neue Aufträge annehmen, bei unveränderten Rollen-/Toolrechten und Modelldefaults. Die Übernahme einer zentralen Rulebook-Revision und die technische Erweiterung der vorhandenen Aufrufpfade bleiben getrennte Schritte.
