# AG-EVENT-JOURNAL-001 — gemeinsamer Aufgabenstrom aller Rollen

Status: **AUTHORIZED / READY FOR FORGE**  
Baseline: `main@39279c99980972140dad101577b47401dea5fba3`  
Backlog: [Issue #7](https://github.com/pahlborn/agentarium/issues/7)  
Auftraggeber: Peter · Product Owner/Koordination: Atlas  
Arbeitszweig: `agent/ag-event-journal-001`

## Ergebnis

Der vorhandene Agentarium-Monitor zeigt für jedes Entwicklungsprojekt belastbar:

- welche Aufgabe bei welcher Rolle liegt;
- ob sie hinterlegt, empfangen, begonnen, geliefert, geprüft, akzeptiert, gemergt oder veröffentlicht ist;
- Blockade und Auflösung;
- Belegquelle und bekannte Erfassungslücken.

Alle vorhandenen Rollen müssen dieselbe Ereignisschnittstelle verwenden können: Peter, Atlas, Nova, Scout, Argus, Sentinel, Archibald, Forge und Cadence.

## Beobachteter Ausgangsstand

- Der Monitor kennt bereits alle neun Rollen.
- `pilot/github-live/github-live.js` akzeptiert derzeit nur `progress`, `handoff`, `contribution`.
- Das Claude-Public-Relay veröffentlicht derzeit nur `HOST_RECEIVED`, `RESULT_READY`, `BLOCKED`.
- Vor dem Verbindungszeitpunkt vorhandene GitHub-Ereignisse werden absichtlich nicht abgespielt.
- Archiv/Demo und Livebetrieb sind getrennt.
- AG-REPORT-001 beschreibt das Datenminimum, aber Collector/Adapter sind nicht implementiert.
- PR #45 ist ein separater Token-UX-Kandidat und darf nicht vermischt werden.

## Forge-Auftrag

1. Zuerst Architektur/Feasibility am aktuellen Code prüfen:
   - kleinster Weg ohne parallele zweite Ereignisarchitektur;
   - kanonische Quelle und append-only Ablage;
   - Produzenten für ChatGPT-Rollen, Claude-Relay und GitHub-native Zustände;
   - Trennung von beobachtetem Ereignis und abgeleitetem Aufgabenstatus.
2. Danach im selben Kandidaten den kleinsten echten End-to-End-Schnitt implementieren:
   - versionierter gemeinsamer Ereignisvertrag mit stabiler ID, `project_id`, `run_id`, `task_id`, actor/recipient, lifecycle state, occurred/recorded time, evidence reference;
   - Monitor zeigt die neun Statusstufen und Blockade/Auflösung, ohne `handoff` als Arbeitsbeginn oder Lieferung umzudeuten;
   - bestehendes Claude-Relay bleibt kompatibel;
   - mindestens je ein echtes Fixture für eine ChatGPT- und eine Claude-Rolle durch denselben Parser;
   - vorhandene Ereignisse bleiben lesbar oder Migration/Versionsgrenze wird ausdrücklich behandelt;
   - Erfassungslücken werden sichtbar als `complete | partial | unavailable`, niemals still vollständig behauptet.
3. Browsernachweis im bestehenden GitHub-Arbeitslauf ergänzen. Kein nur lokaler Parser-Doppeltest.
4. Ergebnis als normalen PR-Kandidaten mit exaktem Head, Prüfergebnissen, Grenzen und Rückrollweg liefern.

## Abnahmekriterien

- Alle neun Rollen können Aufgabenereignisse über denselben Vertrag liefern und werden im vorhandenen Monitor angezeigt.
- Statusfolge bleibt unterscheidbar: `recorded → received → started → delivered → reviewed → accepted → merged → published`.
- `blocked` und `resolved` sind ausdrücklich verknüpft.
- Deduplizierung über `project_id + event_id`; Konflikt bei gleicher ID und anderem Inhalt.
- Kein Status wird aus Rolle, Empfänger, PR-Zustand oder bloßem Review-PASS erfunden.
- Archivleser kann dieselben persistierten Ereignisse später projektbezogen wiedergeben; dieser Schnitt darf dafür keine Sackgasse bauen.
- Bestehende Demo/Archivaufzeichnungen werden nicht als echte Arbeit umetikettiert.
- Browsernachweise und relevante Regressionen laufen am exakten Kandidatenkopf.

## Grenzen

Kein Merge, keine Veröffentlichung und keine Kundenabnahme durch Forge. Keine Kostenanzeige. Keine neue externe Infrastruktur. Kein zweites UI und kein Ersatzmonitor. Keine historischen Ereignisse erfinden.

Forge darf begründet einen kleineren technischen Weg wählen, muss aber jede Abweichung vom Ergebnis und ihre Folge ausdrücklich nennen. Rückfragen nur bei einer echten Produkt-/Architekturentscheidung; Routineentscheidungen trifft Forge innerhalb dieses Auftrags.
