# AG-PROC-COST-001 – Kostenkontrolle, V0.1 PROPOSED
Stand: 2026-10-14. Owners: Peter/Atlas.
Anlass: Peters Auftrag, Anforderungen und alle zugehörigen Kosten zu protokollieren, Erfahrungswerte zu verwenden und verbrauchte Beträge jedes Mal zu nennen.

## Sofortiger Dokumentationsauftrag
Kostenregister: governance/costs/AG-COST-001-register-v1.json. Jeder zukünftige Auftrag/Versuch erhält Requirement-/Versionsbezug, Billing-Pfad, Modell-/Token-/Kostenbelege, Ergebnis, Wiederholungs-/Abbruchkosten. Unbekannte Kosten bleiben unbekannt. Summen zählen Sessions einmal. Pro-Requirement-Kosten werden bei gemeinsamer Ausführung nicht fiktiv aufgeteilt. API-Verbrauchspreis ist von tatsächlicher Abbuchung, Abo-Gebühr und verfügbaren Credits zu unterscheiden.
Nach jedem abgeschlossenen/beendeten externen Auftrag: Verbrauch dieser Ausführung, bekannter zugehöriger Gesamtverbrauch, offene Kostenlücken. Auch bei keinem neuen Anthropic-Aufruf diesen Umstand nennen; nicht sämtliche Teamarbeit als kostenlos bezeichnen.

## Vorschlag für Ausführungssteuerung – noch nicht aktiviert
1. Vor Start eine Spanne aus vergleichbaren beendeten Aufgaben nennen oder ausdrücklich keine belastbare Schätzung. Stichprobenumfang, Inputumfang, Rolle/Modell und Ergebnisstatus sichtbar halten. Aktuelle vier unterschiedlichen Aufrufe begründen noch keine verlässliche Prognose.
2. Autorisierten Auftrag-/Projektkostenrahmen separat von einer Warnschwelle führen. Der Preis einer einzelnen bereits laufenden Generierung ist vorab nicht exakt bekannt; aktuelle CLI-Grenze war kein harter Rechnungsdeckel.
3. Warnungen und Admission Control vor einem neuen Aufruf/Turn verwenden. Kleine Warnschwelle soll keine bereits angefallene Ausgabe verwerfen. Abschließende Ausgabe/Usage und Checkpoints sichern, auch bei Budget-/Prozessfehler.
4. Eine Überschreitung der Schätzspanne dokumentieren und nächsten Aufruf vor Entscheidung stoppen. Automatische Retries/Upgrades bleiben aus. Ressourcen-/Quota-/Guthabenfehler und explizite Notfallgrenzen bleiben Stopgründe.
5. Laufende Arbeit nicht als unbegrenzt freigegeben behandeln. Konkrete Reserve bzw. maximal akzeptiertes Risiko braucht Peter; keine erfundene Reservezahl aus vier heterogenen Calls.
6. Kosten pro akzeptiertem Ergebnis und verlorene/wiedergewonnene Ausgabe beobachten. Ein teurer Einzelaufruf kann wirtschaftlicher als mehrere abgebrochene sein; derzeit keine vergleichbare Erfolgsstichprobe für diesen Nachweis.

## Cadence – vorbereitete begrenzte Prüfung, nicht gestartet
Frage: Ist dieses Delta zu AG-PROC-MODEL-001 V0.2 §5 konsistent, und welche minimale Steuerung schützt Peters Autorität ohne unnötige Abbrüche? Maximal3 konkrete Punkte, vorhandene Modellvorgabe nicht überschreiben. Cadence muss real über Relay teilnehmen; keine simulierte Zustimmung. Wegen ausgeschöpfter Kostenautorisation kein bezahlter Review gestartet. Vor verbindlicher Runtime-Änderung konkretes Delta gemeinsam entscheiden. Bestehende Relays/Limits/Modelldefaults unverändert.

## Offiziell geprüfte Billing-Fakten, 2026-10-14
Abo und API sind unterschiedliche Produkte. Pro enthält keine Console-API-Nutzung. Max/Team können monatliche API-Credits beanspruchen; Anspruch/Verknüpfung von Peters Konto unbekannt.
ANTHROPIC_API_KEY wird im aktuellen Agentarium-Relay explizit verwendet; non-interactive Claude Code nutzt ihn gegenüber einer Subscription. Offizielle Docs erlauben CLAUDE_CODE_OAUTH_TOKEN für CI/Skripte und GitHub Actions. Eine Umstellung benötigt Prüfung unserer eigenen --bare CLI/Relay-Konfiguration, konkrete Kontozuordnung und sichere Secret-Einrichtung; nicht umgesetzt, keine Anmeldung/Testkosten.

Quellen:
- https://support.claude.com/en/articles/9876003-i-have-a-paid-claude-subscription-pro-max-team-or-enterprise-plans-why-is-claude-api-usage-billed-separately-from-my-paid-claude-plan
- https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan
- https://support.claude.com/en/articles/17154008-monthly-api-credits-for-max-and-team-plans
- https://code.claude.com/docs/en/authentication
- https://code.claude.com/docs/en/github-actions
Reale Recherche: /root/scout_process_review (build-research-knowledge); Atlas verifizierte die offiziellen Seiten selbst. Keine Änderung der Authentifizierung, kein API-Aufruf.
