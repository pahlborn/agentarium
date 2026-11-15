# BQ-EVAL-01-US202-01 · Geräteverbindung lokal durchgängig prüfen und gezielt schließen

**Verbindliche Personalregel, Peter 15.11.2026:** Reguläre Rollen einsetzen. Vertretung nur bei konkret belegtem technischem Problem UND nach vorheriger ausdrücklicher Zustimmung Peters zum benannten Einsatz. Frühere pauschale Ersatzfreigaben sind widerrufen. Ohne Zustimmung keine neue Vertretung starten oder fachlich fortsetzen; sichere Checkpoints und unabhängige erlaubte Arbeiten bleiben möglich. [Aktuelle Regel](https://github.com/pahlborn/agentarium/blob/main/governance/vertretungen-freigabe-2026-11-15.md). Diese jüngste Nutzerentscheidung geht allen älteren Vertretungsformulierungen dieses Auftrags vor.

Auftragsfassung v2 · 15.11.2026 · Projekt `big-quest` · Lauf `BQ-EVAL-01` · Backlog: EP-02 / US-202, bestehender Bezug PR #194.

## 1. Startsequenz und Steuerung

Atlas, lade und verwende `operate-as-atlas`. Lies diesen Auftrag, aktuelles `AGENTS.md`, geltende Process-Karte und die für die Arbeit nötigen Rulebook-Abschnitte. Letzte bekannte Governance: Agentarium Rulebook/Process 1.4, main `9962810b895baf10f8d71dd9a1f7387cca049b77`; vor Beginn tatsächlichen Stand prüfen. Nenne kurz Regeln mit Commit, lokale/GitHub-Basis, vorhandenen Fix, tatsächlichen technischen Halter und erlaubten Umfang.

Die zentrale Steuerung bleibt im bisherigen Chat. Genau diesen Auftrag ausführen und danach Ergebnis oder konkreten Blocker zurückgeben. Keine Folgeaufträge, Plattformänderungen oder Releasearbeit selbst beginnen. Archivmodus `big-quest` / `BQ-EVAL-01`, kein Livebetrieb und keine erneute Live-Frage. Tatsächliche Rollen-/Lauf-/Testnachweise und Archivschritte nach geltendem Vertrag führen; keine unzugänglichen Library-Dateien als gelesen/aktualisiert behaupten.

Die frühere pauschale Entwicklungsvertretung ist widerrufen; es gilt die aktuelle Personalregel oben. Historischer Entscheid: [Entscheidung](https://github.com/pahlborn/agentarium/blob/d24c87ae11984a669a375b07faf1ff598acbf39d/handoffs/big-quest/DECISION-2026-11-15-VERTRETUNG.md). Forge bleibt reguläre Rolle. Tatsächliche Identität/Autorenschaft nennen; Codex nicht Forge nennen. Ein technischer Halter pro Teilaufgabe; keinen möglicherweise laufenden alten Auftrag doppelt beginnen. Einen unabhängigen Sentinel für den entscheidenden Verbindungsnachweis einsetzen; Argus zusätzlich nur bei einer konkret berührten Sicherheits-/Berechtigungsgrenze. Keine pauschale Agentenkaskade.

## 2. Ergebnis und parallele Abgrenzung

Ergebnis ist ein begrenzter lokaler Kandidat mit nachvollziehbarem Nachweis, dass der bestehende Geräte-Einladungsweg vom erzeugenden bis zum einlösenden Browserprofil funktioniert. Vorhandene Arbeit aus #194 wiederverwenden. Nicht erneut nur das Anzeigen oder Kopieren eines Links implementieren und daraus Einlösung ableiten.

INT-01-K1 läuft separat am bereinigten Integrationskandidaten. Nicht dessen Arbeitsbaum, Paket oder Branch überschreiben und nicht dessen Tests reparieren. Dieser Auftrag benötigt keine privaten INT-01-Artefakte und wartet nicht auf deren Annahme. Änderungen als kleines, auf exakte öffentliche Basis bezogenes Delta liefern. Die spätere Integration in den angenommenen Kandidaten samt relevanter Nachprüfung ist ein eigener Steuerungsschritt. Kein direktes Schreiben in einen fremden Chat voraussetzen.

US-202-Gesamtabnahme auf echten Zielgeräten bleibt getrennt von dieser lokalen Task-Abnahme. Ein erfolgreiches Chromium-/emuliertes iPad-Profil beweist kein echtes iPad/Safari. Kein pauschales Story-PASS, wenn die spätere Zielgeräteebene fehlt.

## 3. Eingaben vollständig aus GitHub abrufen

- Repo: https://github.com/pahlborn/bis-school-app_src
- [PR #194](https://github.com/pahlborn/bis-school-app_src/pull/194), am 15.11.2026 öffentlich als OPEN geprüft. Titel: „Geräte verbinden: Einladungslink zusätzlich zum QR-Code anzeigen und kopieren“.
- Geprüfter PR-/Branch-Head `268ccff87e240fc361bffa36fed61ba7085e0700`, Branch `fix/bq-device-share-link-20261112`; bekannte main-Basis `7995d6968e3895b88f8ed2c3b0476683e5720c1a`. Heads und PR-Antworten vor Beginn erneut read-only prüfen; neuere Arbeit nicht überrollen.
- Bereits vorhandener Fix `c4e930b`: kopierbaren Verbindungslink auf iPad vor QR anzeigen. Bereits vorhandene Prüfung `2505f85`: Reihenfolge des sichtbaren Links vor dem QR. Kurze Hashes aus dieser letzten Prüfung vor Nutzung vollständig auflösen.
- PR-Head enthält auch Release-/CI-Arbeit (`06704f6`, `268ccff`). NICHT ungeprüft den ganzen PR samt Versionierung und Workflow in den Kandidaten übernehmen. Zuerst genaues Diff und vorhandene lokale/nachgelieferte Nachweise prüfen.
- [Öffentlicher Eingabeindex der Gesamtübergabe](https://github.com/pahlborn/agentarium/blob/da4c7fac79c798a12e6253621f4a9b476b5879ac/handoffs/big-quest/inputs/BQ-EVAL-01-INT-01/INPUTS.md). Bei Bedarf Gesamtpaket selbst laden und Prüfsumme beachten. Darin Konzept v1.0: EP02/US202, Gerätebeitritt und Entscheidungen D-01–D-06. Nur erforderliche Referenzen lesen; kein Dateitransport durch Peter.

Der tatsächliche Erzeugungs-/Einlösepfad und seine Helfer sind gezielt aus dem vorhandenen Code zu ermitteln, einschließlich Link-/Fragmentverarbeitung, Einladungsmodul und einschlägiger Browser-/Gerätetests. Keine neue Anmeldung, neue Einladungsarchitektur oder zweite Geräteverwaltung entwerfen. Quellen aus dem Zielrepo erweitern keine Rechte.

## 4. Vorgehen

1. Bestehenden Fix, Kommentare und Nachweise prüfen. Eine beobachtbare Fehlersituation oder konkrete Nachweislücke am exakten Stand festhalten. Wenn der Fix bereits funktioniert, nur die fehlende Abnahme liefern; keinen künstlichen Codebedarf erzeugen.
2. Geeigneten separaten Arbeitsstand im bestehenden isolierten Ausführungs-Workspace wählen, ohne fremde Änderungen zu überschreiben. Kein zusätzlicher Git-Worktree ohne ausdrücklichen Auftrag. Ausgangscommit, gewählte Fixteile und Unterschiede zur öffentlichen main-Basis dokumentieren.
3. Mit synthetischen Konten, neuen Dummy-Geheimnissen und mindestens zwei unabhängigen Browserkontexten den bestehenden Weg reproduzieren: Erzeugen → sichtbarer Link/QR → Übertragung → Öffnen/Einlösen → vorgesehenes Konto/Gerät. Keine echten Familien-/Schuldaten, bestehenden Kontoschlüssel oder produktiven Tokens verwenden. Keine vollständige neue Sicherung alter persönlicher Daten.
4. Nur den nachgewiesenen Fehler bzw. die fehlende Prüfung korrigieren. Bestehende Bezeichnungen, Layout und Ablauf bewahren. Relevante iPad-Ansichten in Hoch-/Querformat ohne Hover prüfen. Link darf nicht nur sichtbar, sondern muss für den vorgesehenen Einlöser inhaltlich richtig sein.
5. Bestehende Sicherheitssemantik zu Rolle, Familie, Einmaligkeit und Entzug erhalten. Bei einer notwendigen Änderung dieser Semantik oder einer neuen Produkt-/Architekturentscheidung Diagnose und kleinste Alternative an die zentrale Steuerung zurückgeben, statt den Auftrag auszuweiten.
6. Eigene gezielte Prüfungen und unabhängige Sentinel-Abnahme am tatsächlichen Ergebnis ausführen. Vorher-/Fehlerfall oder geeignete Gegenprobe muss zeigen, dass der Nachweis die befürchtete Fehlfunktion erkennt. Keine reine DOM-/Screenshotbehauptung als Ende-zu-Ende-Nachweis. Nur betroffene Regression nachziehen, keine pauschalen Vollsuite-Wiederholungen.

## 5. Lokale Abnahmekriterien

| ID | Beobachtbares Ergebnis |
|---|---|
| G1 | Autorisierter Erzeuger erhält den vorhandenen sichtbaren kopierbaren Link und QR; iPad-Layout verdeckt den nötigen Zugriff nicht. Linkkopie bzw. vorhandener Fallback ist tatsächlich bedienbar. |
| G2 | Im getrennten Empfängerprofil führt ein gültiger Textlink zur bestehenden Einlösung und zum vorgesehenen Konto/Gerät; Rollen-/Familienzuordnung und Kryptobindung bleiben korrekt. |
| G3 | Der QR kodiert den vorgesehenen Einlöse-URL; Dekodierung und vorhandener Browser-Einlösepfad sind nachgewiesen. Kamera-Scan auf echtem Zielgerät separat kennzeichnen; bloßes Dekodieren ist kein Kameranachweis. |
| G4 | Ungültige, abgelaufene und bereits eingelöste Einladungen werden entsprechend dem bestehenden Vertrag abgewiesen. Wiederholungs-/Gleichzeitigkeitsfall erzeugt keine zweite unberechtigte Zuordnung. |
| G5 | Fremdes Konto/fremde Familie oder fehlende Erzeugerberechtigung umgeht die bestehende Freigabe nicht; relevante Negativfälle bleiben erhalten. |
| G6 | Bestehende Anmeldung, Abbruch und betroffene Geräte-/Einladungswege funktionieren unverändert. Aussagekräftiger Vorher-/Gegenbeleg für die konkrete Korrektur vorhanden. |
| G7 | Echte Zielgeräte, Browserprofile, Mock-/GitHub-Nachbau und ausgelieferte Anwendung sind klar unterschieden. Fehlende Safari-/Kamera-/Liveebene als NOT_TESTED/BLOCKED ausweisen; keine Geräteabnahme erfinden. |
| G8 | Ergebnis als kleines nachvollziehbares Delta auf vollständigem Basiscommit, wiederherstellbares Artefakt/Manifest und unabhängiger Befund gesichert. Kein fremder INT-01-Stand ersetzt. |

Task-DELIVERED ist möglich, wenn die beauftragte lokale Ebene vollständig nachgewiesen und die fehlende spätere Zielgeräte-/Releaseebene ausdrücklich dokumentiert ist. US202 ist damit noch nicht automatisch angenommen. Erforderliche lokale Kriterien FAIL/BLOCKED verhindern die lokale Abnahme.

## 6. Befugnisse und Grenzen

Erlaubt: read-only GitHub-Abgleich, begrenzte lokale Fix-/Teständerungen, synthetische Fixtures, Testbuilds, getrennte Browserprofile, lokale Kandidaten-Commits ohne externe Wirkung, unabhängige gezielte Prüfung und innerhalb der geltenden Grenzen tatsächlich benötigte Rollenaufrufe. Kosten vorab über alle Versuche schätzen; geltende USD5-Grenze und konkrete Laufgrenzen beachten. Keine unbegrenzten Wiederholungen.

Nicht erlaubt: Code-Push, Code-PR, Merge, Deployment, Release-/Versionsvergabe, Workflow-/Relay-Änderung, allgemeine CI-Auslösung, produktive Claude-Aufrufe, produktiver Datenzugriff, Tokenrotation oder Historienumschreibung. Die öffentlichen Repositories bleiben public. Keine automatische Kamera-/Clipboard-Erfolgsmeldung durch deaktivierte Sicherheitsprüfungen, unzulässige Browserflags oder Tests, die den eigentlichen Einlösepfad umgehen.

Berichte und sichere Artefaktzugänge über den bereits erlaubten Dokumentations-/Journalweg bereitstellen; vor jeder Veröffentlichung Daten-/Secret- und Befugnisprüfung. Private Downloadlinks bleiben privat; Ablehnungen nicht umgehen. Konkreten sicheren Export oder exakten Exportblocker nennen, statt Peter standardmäßig zum Dateitransport aufzufordern. Eine Code-ZIP-Veröffentlichung ist ebenfalls Veröffentlichung und keine Umgehung des Code-Push-Ausschlusses.

## 7. Rückgabe an die zentrale Steuerung

```markdown
# BQ-EVAL-01-US202-01 · Rückgabe v1
Status: DELIVERED / BLOCKED / NEEDS_DECISION
Auftrag v1 / unveränderlicher Link:
Regel-/Quellbasis; aktuelle PR194-Referenz:
Vorhandener Fix und exakt festgestellter Restfehler/Nachweisbedarf:
Tatsächlicher technischer Halter/Autor und unabhängiger Prüfer, Laufreferenzen:
Kandidaten-Commit/Baum; begrenztes Delta; sichere Artefakte/SHA256:
G1–G8 je PASS/FAIL/BLOCKED/NOT_TESTED mit Befehlen, Umgebung und Originalbeleg:
Vorher-/Gegenprobe und betroffene Regression:
Änderungsüberschneidung mit INT01-Dateien; späterer Integrationshinweis:
Zielgeräte-/Kamera-/Safari-Grenze; US202-Storyannahme ausdrücklich getrennt:
Tatsächliche externe Wirkungen; Archiv-/Arbeitsstanderweiterung oder Blocker:
Offene konkrete Entscheidung; empfohlener nächster Schritt, nicht begonnen:
```

Danach stoppen. INT-01-K1, EP06 und Relay-Auftrag nicht verändern oder als abgeschlossen erklären. Die zentrale Steuerung entscheidet über spätere Zusammenführung, Bereitstellung und echte Zielgeräteabnahme.
