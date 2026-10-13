# AG-PROC-MODEL-001 — Konsistenzprüfung
Version: REVIEW V1
Stand: 2026-10-13
Owner: Atlas
Ergebnis: V0.1 grundsätzlich kompatibel; V0.2 zur ausdrücklichen PROCESS_DECISION vorbereitet.
Status: nicht aktiviert.

## Exakte Quellen
- Regel V0.1: pahlborn/agentarium, Commit a71e2ebfedb7ad241efd8d78cebfd72655d6521e, governance/AG-PROC-MODEL-001.md, Blob060a28295398d54490eb061e724d85621001784c.
- Rulebook V1.1 DRAFT: pahlborn/gt40-engine, Commit dc0dddc46def7925f610bf555693c0f936fa26ec, .claude/agent-protocol/agentarium-rulebook-v1-draft.md.
- Drei Claude-Profile am gleichen Agentarium-Commit; Defaults spec-agent opus/high, coding-agent sonnet/medium, process-agent opus/medium.
- Die vier installierten ChatGPT-Rollenskills enthalten keine Modell-/Reasoning-Vorgaben im SKILL.md.
- PR3 .codex/agents/*.toml am Commit e613d727611aa14048a47497397a4b985bf5aa18 enthält keine Modellwerte; dieser PR ist offen und seine Konfiguration nicht auf dem Entwicklungsbranch.
- Tatsächlich sichtbares spawn_agent-Schema: Modell-/Reasoning-Override mit fork_turns=none; voller History-Fork erbt und akzeptiert keine Overrides. Kein Werkzeug zum Umschalten des Atlas-Hauptchats.
- Bestehender AG-TEAM-001-Relay: dynamischer Agent und CLI fordern haiku an. Die veröffentlichten alten Handbacks nennen kein tatsächliches Modell/Reasoning. Diese Vergangenheit wird nicht nachträglich bestätigt.

## Vergleich mit dem Rulebook
| Punkt | Befund |
|---|---|
| §1 Versionsbindung | Keine rückwirkende Auftragsumstellung: kompatibel. |
| §2.2(5–7) Identität/Modell/Aufwand | Modell und Aufwand nur mit Nachweis, sonst unconfirmed: kompatibel. Konfiguration/Request getrennt vom tatsächlichen Ergebnis. |
| §3.1 Prozesshoheit | Gemeinsame Peter+Atlas-Entscheidung vor Inkraftsetzung: kompatibel. |
| §13 Cadence | Konkreter, begrenzter read-only Beitrag; kein Standard-Gate oder Selbstapproval: kompatibel. |
| §15 offener Draftstatus | Annahme einer Ergänzung darf nicht die gesamte Rulebook-Fassung aktivieren. V0.2 grenzt die Entscheidung ab. |

## Konkrete Korrekturen V0.2
1. Default, verbindliche Vorgabe, gewünschtes und beobachtetes Modell getrennt. Aufgabenpräferenz überschreibt keine bestehenden Vorgaben. Task-Override braucht technische Kompatibilität und dokumentierte Autorisation; Upgrades über Default benötigen Peters Entscheidung. Persistente Änderungen getrennt.
2. Budgetautorisation, Schätzgrenze, gemeldete Ist-Kosten und unlesbarer Kontostand getrennt. Fehlende Autorisation oder Credit-/Quota-Fehler stoppt den betroffenen Lauf; kein automatischer Retry/Upgrade.
3. Sol/Medium für Atlas bleibt Präferenz; nicht auswählbare Modelle werden nicht behauptet. Tatsächliche Steuerbarkeit bleibt laufzeitspezifisch, tatsächlicher Denkaufwand braucht eigenen Beleg.

## Cadence-Nachweis
Task: AG-PROC-MODEL-001/CADENCE-REVIEW V1
Session: 71163eaf-469d-4194-9c90-1a8c27a51069
Run: https://github.com/pahlborn/agentarium/actions/runs/38420199480
Antwort: https://github.com/pahlborn/agentarium/issues/2#issuecomment-6148789041
Definition: d0ad187637d5201024f9fe2a31d47221178fcf6b
Tools im Review: keine; exakt gepinnte Quellen inline geliefert.
Angefordert: opus/medium, unveränderter Rollen-Default.
Runtime-Modell: claude-opus-5-5 laut modelUsage im CLI-Ergebnis.
Runtime-Reasoning: unconfirmed.
Kosten: CLI berichtet USD0.082876; keine Rechnung oder Saldoauskunft.
Stop: CLI erfolgreich beendet; kein Retry, Upgrade, Benchmark oder Verfügbarkeitstest.

### Unveränderte Antwort/Runtime-Envelope
## AG-PROC-MODEL-001 — CADENCE_REPORT / STOPPED
Runtime evidence:
```json
{
  "requested_model": "opus",
  "requested_reasoning": "medium",
  "actual_model": "claude-opus-5-5",
  "actual_reasoning": "unconfirmed",
  "model_evidence": {
    "source": "Claude CLI final JSON modelUsage keys",
    "models": [
      "claude-opus-5-5"
    ]
  },
  "cost_usd": 0.082876,
  "session": "71163eaf-469d-4194-9c90-1a8c27a51069",
  "definition_blob": "d0ad187637d5201024f9fe2a31d47221178fcf6b",
  "source_commit": "a71e2ebfedb7ad241efd8d78cebfd72655d6521e",
  "run": "https://github.com/pahlborn/agentarium/actions/runs/38420199480",
  "stop_state": "CLI exited",
  "response_sha256": "a0b0ddfa0c96ddb28eeaaa213dfe1afd349d09f526fb40d57a52971e088e09a5"
}
```

Unchanged final Cadence contribution; not approval:

```yaml
role: Cadence / process-agent
classification: Konsistenzprüfung eines Prozessvorschlags; 3 Korrekturen nötig, keine Blocker
urgency: soon
confirmed_observations:
  - Bestehende Defaults (opus/high, sonnet/medium, opus/medium) bleiben wirksam. Das deckt sich mit der Konfiguration.
  - "unconfirmed statt Raten" entspricht Rulebook §2.2(7).
  - Die Unabhängigkeit der Gates entspricht §3.1(6).
  - Keine rückwirkende Umstellung entspricht §1.
  - Dieser Lauf: Default opus/medium entspricht dem Request. Das tatsächliche Modell ist unconfirmed.
uncertainties: Restguthaben beim Anbieter nicht lesbar. Kostendeckel sind nur Schätzungen.
affected_roles: Atlas, Forge (Relay-Machbarkeit)
proposal:
  - K1 Hierarchie: Ein Override pro Auftrag ist nur zulässig, wo die Laufzeit ihn erlaubt (fork_turns=none). Ein Upgrade über den Default braucht Freigabe. Dauerhafte Änderungen an der Definition laufen als separater Prozess.
  - K2 Budget: Ein autorisierter Rahmen und ein nicht lesbarer Saldo sind getrennt zu behandeln. Ein ausdrücklich autorisierter Deckel erlaubt den Lauf. Bei einem Credit-Fehler wird gestoppt, ohne Retry oder Upgrade. Überschreitungen der Schätzung werden protokolliert.
  - K3 Evidenz: Sol/Medium für Atlas gilt nur als Präferenz. Ist das Modell nicht wählbar, wird es als unconfirmed protokolliert. Das konfigurierte Relay-Modell haiku zählt als „requested“, nicht als „actual“.
expected_benefit: Kein Dauerblock. Default, Request und Ist bleiben klar getrennt.
expected_cost_and_delay: Gering, eine Textrevision v0.2.
alternatives_or_no_change: Ohne Änderung bleibt die Override-Befugnis unklar.
effectiveness_check: Die nächsten 5 Aufträge auf vollständiges model_routing und korrekt gesetzte unconfirmed-Status prüfen.
decision_needed_from_peter_and_atlas: PROCESS_DECISION nur für das eigenständige Addendum AG-PROC-MODEL-001 v0.2 mit K1 bis K3. Es gilt nur für neue Aufträge, lässt die Defaults unverändert und aktiviert Rulebook 1.1 nicht.
```

## Entscheidungsgrenze
V0.1 bleibt unverändert. governance/AG-PROC-MODEL-001-v0.2-proposed.md ist die konkrete Entscheidungsvorlage. Bis Peters PROCESS_DECISION wird sie nicht als geltende Routingregel verwendet. Keine Agentenmodelldefinition wurde verändert; keine allgemeine Relay-Modellwahl implementiert.

## Fortsetzung des Produkts
vision/AG-VISION-001-v0.1.md konsolidiert Peters erklärte Vision und Novas bereits gelieferte Richtungen. Ensemble bleibt Empfehlung, keine gewählte Lösung. Der Prototyp wird nicht vorausgesetzt. Projektagnostik, Avatare, Live/Replay und Kommunikationspanel bleiben Gegenstand der laufenden Richtungsdiskussion.
