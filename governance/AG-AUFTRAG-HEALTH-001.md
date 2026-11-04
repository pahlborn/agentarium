# AG-AUFTRAG-HEALTH-001 — auftragsbezogene Laufzeitprüfung

Status: Implementierungsvorschlag; keine automatische Aktivierung durch dieses Dokument.
Datum: 2026-11-02. Eigentümer: Atlas (Prozess), Forge (Relay), Sentinel (unabhängige Prüfung).

## Ziel und Nichtziele
Bei einem konkreten Atlas-Auftrag den ohnehin erforderlichen ersten Claude-Modellaufruf zugleich als Authentifizierungs-/Guthaben- und Arbeitsfähigkeitsprobe verwenden. Kein gesondertes Hello World, kein täglicher API-Test, kein Agentenstart durch diesen Vorschlag. Der erste erfolgreiche Modell-Stream belegt nur den jeweiligen Ausführungsversuch, nicht die spätere Aufgabenerfüllung.

## Bestehender Vertrag
`relay/claude_public_relay_v2.py` trennt Prepare, Run, Publish und veröffentlicht HOST_RECEIVED sowie RESULT_READY/BLOCKED. Die Runtime-Beobachtung (AG-LAUFZEIT-001) meldet echte content_delta-Ereignisse. HOST_RECEIVED ist kein Modellstart; ein GitHub-Actions-Start ist kein Modellstart. Ein fehlender oder blockierter Handback kann auch nach tatsächlicher Modellarbeit auftreten (Issue #2, AG-LAUFZEIT-001-09).

## Ausführungsregel
1. Atlas nimmt den Auftrag an, prüft bekannte aktuelle Blocker, Limits und Autorisierung. Nur wenn ein Agent für die Aufgabe benötigt wird, erfolgt der ohnehin vorgesehene Relay-Dispatch.
2. Der Relay-Host bindet den Versuch an task_id, parent_id, role, host, run_id, attempt_id und, sofern vorhanden, session_id.
3. Beim ersten verifizierten Modell-Streamsignal (nicht bloß CLI-Start oder Hostempfang) wird `MODEL_RESPONSIVE` für genau diesen Versuch abgeleitet. Bestehende `started`-Runtime-Ereignisse dürfen nicht dupliziert oder umgedeutet werden.
4. Ohne Modellantwort wird keine Erreichbarkeit behauptet. Ein Fehler vor dem ersten Signal ist `BLOCKED_PRE_RESPONSE`; nach einem Signal `BLOCKED_AFTER_RESPONSE`. Der Status `RESULT_READY` bleibt vom fachlichen PASS getrennt.
5. Der Host klassifiziert Fehler nach strukturierten API-/CLI-Fehlerdaten, soweit tatsächlich vorhanden: `CREDIT_EXHAUSTED`, `KEY_INVALID_OR_EXPIRED`, `RATE_LIMITED`, `RELAY_INFRASTRUCTURE`, `SECURITY_BLOCK`, `UNKNOWN`. Freitext oder ein nacktes `RuntimeError` reichen nicht für die ersten beiden Klassen. Bei unzureichender Evidenz: UNKNOWN, Rohfehler nur redigiert.
6. Bei bestätigtem Blocker: keine automatische kostenpflichtige Wiederholung; Atlas meldet Ursache, Beleg, Zeitpunkt und nächste Aktion. Vor Vertretung den alten Versuch und letzten Checkpoint abgleichen und nachweisbar stoppen; eine unbekannte Laufzeit bleibt blockiert.
7. Bei Erfolg keine separate Gesundheitsmeldung an Peter. Benachrichtigung nur für neue bestätigte Blocker oder eine konkret erforderliche Entscheidung. Keine geplanten oder periodischen Tests.
8. Die API-Schlüssel-Ablauferinnerung ist eine getrennte Sicherheitsaufgabe; Erneuerung nur mit Nachweis behaupten.

## Implementierungsort
Die Klassifikation gehört an die tatsächliche CLI-Ausführung im Relay-Host, nicht in einen GitHub-Kommentar-Parser. Der bestehende `AGENTARIUM_RUNTIME_V1`-Transport wird verwendet; bestehende Felder/Verträge dürfen nicht stillschweigend verändert werden. Für neue Felder oder Status erst versionierten Vertrag und Consumer-Kompatibilität nachweisen. Die vorhandenen Secret-Scanner und Token-Isolation unverändert lassen.

## Abnahmekriterien
- Regulärer erfolgreicher Auftrag: genau ein verifizierter Modellstart je Versuch; kein zusätzlicher API-Call.
- HOST_RECEIVED ohne Modellantwort: kein falscher Erfolg.
- Auth-401/ungültiger Schlüssel und bestätigter Guthabenfehler: richtige Klasse, Blockade, keine Wiederholung.
- 429 wegen Rate-Limit nicht als Guthabenmangel klassifizieren.
- Secret-Scan nach Modellantwort blockiert: Arbeit war beobachtet, Ergebnis bleibt gesperrt.
- Timeout/CLI-Crash ohne strukturierte Ursache: UNKNOWN, keine erfundene Schlüsselursache.
- Doppelzustellung und verspätetes Terminal: idempotent, versuchsgebunden.
- Normal-/Fehler-/Recovery-Fälle offline getestet; unabhängiger Sentinel-Check; danach ein echter, ausdrücklich autorisierter Aufgabenlauf als Wirksamkeitsnachweis.

## Freigabegrenzen
Dieser PR ist ein Prozess-/Vertragsvorschlag, noch keine implementierte Runtime-Klassifikation. Kein Agent wird gestartet; keine Anthropic-API-Anfrage erfolgt. Vor Produktfreigabe sind der bestehende Host-Producer und seine Tests konkret anzupassen und zu prüfen.
