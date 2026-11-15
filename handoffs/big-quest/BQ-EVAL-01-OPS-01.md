# BQ-EVAL-01-OPS-01 · Bestehenden Betriebsvertrag und Aktivierungslücken klären

**Verbindliche Personalregel, Peter 15.11.2026:** Reguläre Rollen einsetzen. Vertretung nur bei konkret belegtem technischem Problem UND nach vorheriger ausdrücklicher Zustimmung Peters zum benannten Einsatz. Frühere pauschale Ersatzfreigaben sind widerrufen. Ohne Zustimmung keine neue Vertretung starten oder fachlich fortsetzen; sichere Checkpoints und unabhängige erlaubte Arbeiten bleiben möglich. [Aktuelle Regel](https://github.com/pahlborn/agentarium/blob/main/governance/vertretungen-freigabe-2026-11-15.md). Diese jüngste Nutzerentscheidung geht allen älteren Vertretungsformulierungen dieses Auftrags vor.

Auftragsfassung v2 · 15.11.2026 · Projekt `big-quest` · Lauf `BQ-EVAL-01`. Vorbereitung der offenen Betriebsanteile aus EP04/US401–403 und EP08/US801–803; keine neue Produktstory und kein zusätzlicher Machbarkeitspilot.

## Startsequenz und Auftrag

Atlas, lade und verwende `operate-as-atlas`. Lies aktuelle AGENTS-/Process-/Rulebook-Vorgaben und diesen Auftrag. Letzte bekannte Governance: Agentarium Rulebook/Process1.4 an main `9962810b895baf10f8d71dd9a1f7387cca049b77`; aktuellen Stand prüfen. Nenne Regeln/Commit, tatsächlich gelesene Codebasis, Ausführungsrollen und Grenzen. Historische Planung ist keine neue Entwicklungsfreigabe.

Zentrale Steuerung bleibt im bisherigen Chat. Monitor nur Archivmodus `big-quest` / `BQ-EVAL-01`; keine Live-Frage. Eine Vertretung benötigt ein belegtes technisches Problem und Peters vorherige ausdrückliche Zustimmung zum Einsatz. Tatsächliche Rolle/Plattform und Nachweise benennen; keine simulierten Konsultationen. Für diese überschaubare lesende Analyse direkt arbeiten oder genau einen nötigen technischen Analysten einsetzen, nicht eine vollständige Rollenpipeline.

**Ziel:** Aus dem beschlossenen Konzept und dem vorhandenen Dienstcode eine konkrete, belegte Betriebs- und Entscheidungsunterlage erstellen. Sie muss der zentralen Steuerung zeigen, welche Adapter und Betriebsparameter vorhanden sind, welche fehlen und welche konkrete Entscheidung vor ihrer späteren Umsetzung nötig ist. Keine Architektur neu entwerfen und keinen Anbieter auswählen/beauftragen.

## Vollständig verfügbare Eingaben

Lade Unterlagen selbst aus GitHub, kein Dateitransport durch Peter:

- [Eingabeindex](https://github.com/pahlborn/agentarium/blob/da4c7fac79c798a12e6253621f4a9b476b5879ac/handoffs/big-quest/inputs/BQ-EVAL-01-INT-01/INPUTS.md) und dortige öffentliche Gesamtübergabe mit SHA256. Zuerst Einstiegsdokument und Publikationshinweis lesen.
- Daraus vollständig benötigte Teile: Konzept v1.0 §§2,3,5; Übergabevermerk zu EP04/EP06 und Relay; Release-Dokumentation zu Betrieb und offenen Punkten. Konzeptentscheidungen D-01–D-06 sind verbindlich, nicht neu zu diskutieren.
- Für schmale Codebelege insbesondere `services/school-ai/server.mjs`, `run-access.mjs`, `access-store.mjs`, `session.mjs`, `claude-routes.mjs`, `claude-draft.mjs`, `claude-vault.mjs`, `evaluation-routes.mjs`, `evaluation-store.mjs` und unmittelbar nötige Aufrufer/Konfigurationsleser. Weitere Dateien nur für eine konkret benannte Abhängigkeit.
- Der dokumentierte Originalstand ist `0a2d92fd1df28bda46fa793cbc8309a63df185be`, Baum `e0474ccb8681592f0ed88bcebc318ab87afd2c12`. Die öffentliche anonymisierte Kopie ist NICHT dieser Originalbaum; ihren Herkunfts-/Änderungsumfang beachten. Für einen einzelnen Codebeleg nicht pauschal Identität mit dem Original behaupten. Keine Rekonstruktion, Patchanwendung oder Anwendungsausführung in diesem Auftrag.
- Die späteren INT01-/K1-Kandidaten sind keine notwendige Eingabe. Analyseergebnisse gelten für die tatsächlich untersuchten Dateien; gegen den später angenommenen Integrationsstand ist eine gezielte Aktualisierung vorzusehen.

## Arbeitsergebnis

Erstelle eine kompakte Matrix mit Spalten: Konzeptanforderung → tatsächliche Implementierung mit Dateireferenz → belegter Testumfang → offene Betriebslücke → kleinste nötige Umsetzung → benötigter Parameter oder konkrete Entscheidung → spätere Abnahme.

Mindestens folgende Punkte erfassen:

1. Web-Origin, Dienst-Origin, HTTPS/Proxy, CORS, kurzlebige Sitzungen, Gerätebindung und vorhandene Start-/Konfigurationspfade.
2. Verifizierter Familien-/Kontenanker, Betreiberimport, Gerätefreischaltung, aktuelle Rechte und Widerruf. Produktiv nötige Schritte vom lokalen Testaufbau unterscheiden.
3. Datenbank: aktuelle SQLite-/Einzelhost-Grenze gegenüber dem beschlossenen produktiven Datenbankvertrag, Persistenz, atomare Vorgänge und notwendige Migration/Adapter. Keine unbelegte Behauptung, SQLite sei grundsätzlich ungeeignet oder ein anderer Dienst bereits erforderlich.
4. KMS-/Secret-Vertrag für Familienschlüssel: Verschlüsselung, Familien-/Umgebungsbindung, Ersetzen/Löschen, Verhalten nach Backup/Restore, laufende Aufträge und fehlende produktive Adapter. Keine echten Schlüssel beschaffen oder ausgeben.
5. Claude-Zielmodell, tatsächlich vorhandene Anbieteranbindung, Mock-Nachweise, gespeicherte Limits/Deduplizierung und notwendiger späterer realer Anbieter-Nachweis. Produkt-Familienschlüssel und Agentarium-Agenten-API klar unterscheiden.
6. GitHub-App-/Installationszugriff des Bewertungsdiensts sowie noch separater Konto-/Familienspeicher. Repo-/Branch-/Rechtebedarf nur benennen; keine App installieren oder Tokenrechte ändern. Offene Altzugangsablösung nicht als erledigt ausweisen.
7. Release-/Rücksprungvertrag, kompatibler v2-Leser, Erhalt bestätigter Bewertungen und gezielte spätere Betriebskontrollen. Ein Deploymentziel noch nicht als beschlossen oder eingerichtet darstellen.

Ein bereits festgelegter Parameter wird nicht erneut zur Entscheidung vorgelegt. Fehlende reine Betriebsparameter getrennt von Produkt-/Architekturentscheidungen halten. Wenn mehrere Wege die bestehende Vorgabe erfüllen, die kleinste sinnvolle Auswahl und ihre konkreten Folgen nennen, ohne eine neue breite Anbieter-/Frameworkstudie zu starten.

## Parallelität und Grenzen

Dieser Auftrag ist **read-only gegenüber Quellcode und Infrastruktur**. Keine Änderung an INT01/K1, PR194/US202, Relay-Code, Workflows, Packages, Tests, Datenbanken oder Rollenprofilen. Keine Anwendungstests, Builds, Modell-/Relay-Aufrufe, Kamera-/Browserabnahme, Anbieteranfragen, Cloudressourcen, Secrets, Kostenbuchungen, Deployments oder Aktivierungen. Kein Zugriff auf produktive Familien-/Schuldaten. Keine private URL oder Geheimniswerte ins öffentliche Ergebnis übernehmen.

Damit bleibt die Arbeit unabhängig von INT01-K1, US202-01 und AG-RELAY-MULTIREPO-001. Die getrennten Ausführungs-Chats werden nicht von hier aus als informiert oder gestartet behauptet. Keine Bearbeitung von `CONTROL.md` durch diesen Ausführungs-Chat; dieses Register pflegt die zentrale Steuerung.

Erlaubt sind gezielte lesende Quelleninspektion und eigene neue Dokumentationsdateien. Für Resultate ausschließlich einen neuen kollisionsfreien Pfad unter `handoffs/big-quest/results/BQ-EVAL-01-OPS-01/` in einem eigenen Dokumentationsbranch verwenden. Vor Dokumentations-Push Trigger prüfen; kein PR/Main-Merge und keine automatische Folgeausführung. Falls Veröffentlichung nicht zulässig/technisch möglich ist, die Unterlage lokal liefern und den konkreten Blocker benennen. Keine pauschale Aufforderung an Peter zum Dateitransport. Eine zusätzliche kostenpflichtige Recherche-/Agentenkaskade gehört nicht zum Mandat; geltende Kostengrenzen beachten.

## Abnahme

- Jede wesentliche Behauptung ist auf tatsächlich gelesenen Code oder das beschlossene Konzept zurückgeführt; beobachtet, dokumentiert, abgeleitet und unbekannt sind getrennt.
- Vorhandene lokale Funktion und produktiv fehlender Adapter/Parameter nicht vermischt; kein historischer Mock-PASS als Produktionsnachweis.
- Konkrete Umsetzungslücken und Entscheidungen sind so begrenzt beschrieben, dass die zentrale Steuerung daraus spätere Aufgaben formulieren kann.
- Keine neue Produktarchitektur, kein Wiederholen geklärter Datenschutz-/Toddle-Entscheidungen und kein neuer Machbarkeitspilot.
- Keine gemeinsame Arbeitsdatei oder Infrastruktur verändert und keine Test-/Produktivbereitschaft behauptet.

## Rückgabe und Ende

```markdown
# BQ-EVAL-01-OPS-01 · Rückgabe v1
Status: DELIVERED / BLOCKED / NEEDS_DECISION
Auftragsfassung und unveränderlicher Link:
Tatsächlich untersuchte Quellen/Versionen und Herkunftsgrenzen:
Öffentlicher Ergebnislink oder konkreter Ablageblocker:
Betriebsmatrix: vorhanden / fehlt / spätere Abnahme:
Bereits feststehende Entscheidungen, nicht erneut zu öffnen:
Höchstens drei unmittelbar nötige konkrete Entscheidungen mit Folgen:
Empfohlene nächste Umsetzungspakete, noch nicht gestartet:
Tatsächliche Ausführung und Archivbeleg; keine Anwendungstests/Betriebsaktivierung:
```

Nach dieser Rückgabe stoppen. Keine daraus abgeleiteten Entwicklungs-, Betriebs- oder Releaseaufträge selbst beginnen. Die zentrale Steuerung ordnet sie nach den laufenden Ergebnissen ein.
