# Agentarium – Modellwahl und Aufwandssteuerung

**Kennung:** AG-PROC-MODEL-001  
**Version:** 0.1 (Vorschlag, zur Aufnahme ins zentrale Rulebook)  
**Stand:** 2026-10-13  
**Prozessverantwortliche:** Peter und Atlas  
**Geltung:** ChatGPT Work und Claude Code, alle Agentarium-Fachaufträge  
**Normativer Status:** Entwurf; keine stillschweigende Änderung bestehender Aufträge, Agentendefinitionen, Rechte oder Freigaben

## Ziel

Atlas weist **nicht jedem Agenten dauerhaft ein Leistungsmodell zu**. Atlas bestimmt das Modell und den Denkaufwand für **den konkreten Auftrag**, abhängig von Komplexität, Auswirkungsrisiko, Verfügbarkeit, Kosten und gegebenenfalls der Nutzerfreigabe. Die fachliche Rolle und ihre erlaubten Werkzeuge werden dadurch nicht verändert.

## Entscheidungsstufen (Orientierung, nicht unbesehen feste technische Modell-IDs)

| Klasse | Typische Aufgabe | ChatGPT-Work-Orientierung | Claude-Code-Orientierung |
| --- | --- | --- | --- |
| R – Routine | Status, knappe Identitätstests, formalisierte Klassifizierung | Luna | Haiku |
| F – Fachauftrag | Vision, Recherche, Spezifikation, Implementierung, Review, QA | Sol | Sonnet |
| K – Kritisch | Widersprüchliche Evidenz, kritische Architektur-/Sicherheitsfragen, schwerwiegende ungeklärte Befunde | Astra | Opus |

- Konkrete Modellbezeichnungen, Reasoning-Stufen und ihre Steuerbarkeit sind **zur Laufzeit zu ermitteln**; die Tabelle ist keine Zusage, dass das Modell im aktuellen ChatGPT-Work- oder Claude-Code-Lauf angeboten wird.
- Für **Atlas selbst** gilt Sol/Medium als bevorzugter Betriebswert, sofern im aktuellen Work-Auftrag verfügbar. Ansonsten eine verfügbare, geeignete Alternative mit dokumentierter Abweichung.
- Aufrufe von Claude Code verwenden nur ausdrücklich zugelassene Mittel. Die vorhandenen Identitätstest-Relays sind **nicht** für unbegrenzte Fachaufträge freigegeben.
- Bestehende `model:`-Einträge in Agentendefinitionen gelten bis zu einer separat geprüften Änderung als **wirksame technische Defaults**. Diese Regel ersetzt sie nicht automatisch.

## Verpflichtender Kurzcheck durch Atlas vor jedem Aufruf

1. **Schwierigkeit:** R, F oder K anhand der konkreten Aufgabe.
2. **Risikoprofil:** Folgen einer falschen Antwort, erwartete unabhängige Prüfung und erforderliche Denkstufe.
3. **Verfügbarkeit:** Ist das gewünschte Modell/Reasoning in der *tatsächlichen* Laufzeit technisch wählbar?
4. **Budget:** Ist der Aufruf im vorhandenen Kostenrahmen? Bei Claude-API-Guthabenmangel oder unklarem Budget: stoppen, kein automatischer Retry/Upgrade.
5. **Ausführung:** Gewähltes Modell und, soweit die Laufzeit ausweist, tatsächlich verwendetes Modell und Aufwand protokollieren. Nicht beobachtbare Angaben erhalten den Status `unconfirmed`, niemals einen geschätzten Modellnamen.
6. **Abweichung:** Bei nicht verfügbarem Zielmodell eine passende, dokumentierte Alternative wählen oder fachlichen Auftrag stoppen. Bei höherem Kosten- oder Risikoniveau Freigabe einholen.

## Minimale Auftragsfelder

```yaml
model_routing:
  task_complexity: R | F | K
  risk: low | medium | high
  target_platform: chatgpt-work | claude-code
  preferred_model_family:
  requested_model:  # optional; nur wenn nachweislich auswählbar
  requested_reasoning: # optional
  actual_model: # runtime evidence or unconfirmed
  actual_reasoning: # runtime evidence or unconfirmed
  model_evidence:
  budget_limit_or_authorization:
  fallback_decision:
```

## Abnahmeregel

Eine kurze Routineantwort ist nicht automatisch schlechter, weil sie mit einem günstigen Modell erzeugt wurde. Ein Fachauftrag gilt auch bei teurem Modell nicht automatisch als geprüft. **Evidenz, unabhängiges Review und Freigaben bleiben eigenständige Gates.**

## Einführung

1. Peter und Atlas prüfen diesen Vorschlag als Prozessänderung.
2. Nach Freigabe in das maßgebliche `Agentarium Rulebook & Process Manual` übernehmen und Prozessversion dokumentieren.
3. Technische Claude-Modell-Defaults und ChatGPT-Aufrufparameter **separat** prüfen und gegebenenfalls anpassen.
4. Neue Aufträge referenzieren die genehmigte Prozessversion; laufende Aufträge werden nicht rückwirkend umgestellt.

**Quellen-/Statushinweis:** Bei Erstellung enthielten die Claude-Agentendefinitionen die Defaults `spec-agent: opus/high`, `coding-agent: sonnet/medium`, `process-agent: opus/medium`, während die erfolgreichen Identitätstest-Relays Haiku nutzten. Für die ChatGPT-Agents war im geprüften Rulebook V1.1 DRAFT keine verbindliche Modellwahl beschrieben. Dies ist ein vorgeschlagenes Routing, kein Nachweis aufrufbezogener Modellsteuerung.
