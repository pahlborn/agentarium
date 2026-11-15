# BQ-EVAL-01-INT-01-K1 · Rote Regression und offenen Upgrade-Nachweis klären

Auftragsfassung v1 · 15.11.2026 · Parent `BQ-EVAL-01-INT-01` · Projekt `big-quest` · Lauf `BQ-EVAL-01`.

## Start und Eingaben

Atlas, lade und verwende `operate-as-atlas`. Lies aktuelle AGENTS-/Process-/Rulebook-Vorgaben, den ursprünglichen INT-01-Auftrag v2 und diesen begrenzten Nachauftrag. Nenne Regeln mit Commit, Ausgangsstand, tatsächliche Rollen und Grenzen. Steuerung bleibt im zentralen Chat. Kein Livebetrieb, Archivspur mit tatsächlichen Nachweisen fortführen. Kein automatischer Start weiterer Stories oder Übernahme eines unbekannt laufenden Workers.

Dieser Auftrag ist im BISHERIGEN INT-01-Ausführungs-Chat auszuführen, der den Kandidaten und die privaten Ergebnisartefakte bereits besitzt. Verwende den dort gesicherten Kandidaten `d26af4a`, die vollständige Rückgabe, Logs und das tatsächliche Argus-Urteil. Löse vor Änderungen vollständigen Commit, Baum und Paketprüfsummen auf. Der kurze Hash und die Zusammenfassung allein reichen als Prüfgrundlage nicht. Keine Rekonstruktion aus älteren ZIPs und kein erneuter Dateitransport durch Peter. Sind der Kandidat oder Originalbefunde nicht verfügbar, diesen exakten Blocker melden und keine Ersatzbasis erfinden.

[Öffentlich verifizierte Rückgabe](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6892601640): Testbuild PASS; Neutral-/Altlastenprüfung 11/11 PASS; Testinstanz 10 PASS/1 FAIL; Argus FAIL wegen erforderlicher roter Regression; Paketidentität und Wiederherstellung unabhängig PASS. Ein Upgrade-Nachweis bleibt ausdrücklich offen. Dies ist kein Gesamt-PASS.

## Begrenztes Ziel

Kläre den konkreten roten Test und den verbliebenen Upgrade-Nachweis am gesicherten Kandidaten. Behebe nur nachgewiesene veraltete Testannahmen/Testaufbauten; erhalte die semantischen Sicherheits- und Integrationsprüfungen. Keine neue Produktfunktion, keine fachliche EP06-Fortsetzung und keine pauschale Regression aller früheren Stände.

## Diagnose vor Korrektur

1. Liefere für jeden offenen Argus-Befund und die rote Prüfung: Datei/Testname, Reproduktionsbefehl, Soll/Ist, konkrete Assertion, relevante kleine Codeänderung und Auswirkung auf das Abnahmekriterium. Keine Originaldaten oder Geheimniswerte ausgeben.
2. Prüfe, ob die Erwartung von zehn gegenüber fünf geänderten Zeilen tatsächlich nur historische Struktur zählt oder eine fehlende Bereinigung/Sicherheitswirkung entdeckt. Die Zahl NICHT allein zum Erreichen von Grün ändern. Keine Assertion löschen, keinen Test überspringen und keinen Grenzwert ohne inhaltlichen Nachweis lockern.
3. Für den historischen Upgrade-Testaufbau getrennt feststellen: benötigte Basis/Fixtures vorhanden, Prüfumgebung ausführbar, erwartetes Altformat und neuer Leser korrekt verbunden? Ein fehlender ausführbarer Aufbau ist BLOCKED, kein PASS. Verwende synthetische Daten und die ursprünglich geforderte Kompatibilität; Kathies Altdaten sind nicht erforderlich.

## Erlaubte Korrektur und Nachweise

Wenn ausschließlich ein veralteter Testaufbau bzw. eine zu enge Strukturannahme vorliegt, passe ihn minimal an. Bevorzuge einen beobachtbaren semantischen Nachweis der ursprünglichen Schutzwirkung. Zeige eine geeignete Gegenprobe, die bei Verletzung dieser Schutzwirkung fehlschlägt. Keine bloße Ersetzung 10→5 ohne diesen Nachweis.

Wird ein Produktfehler, eine Anforderungslücke, zusätzliche Architektur-/Betriebsarbeit oder notwendige Veränderung außerhalb dieses Testwartungsschnitts sichtbar, sichere die Diagnose und lege der zentralen Steuerung den konkreten Befund samt kleinster Alternative vor. Dafür keine eigenständige Entwicklung starten.

Prüfe danach die betroffene Testinstanz-Suite und die konkret betroffenen Upgrade-/Bereinigungsprüfungen am tatsächlichen neuen Kandidaten. Vorhandene unveränderte Nachweise begründet wiederverwenden. Fehlergeschichte erhalten; Erstlauf und Korrekturprüfungen mit Befehlen, Versionen und echten Exitcodes getrennt ausweisen. Argus soll den Delta-Stand sowie sämtliche noch offenen ursprünglichen Befunde unabhängig beurteilen. Nur gezielt nötige weitere Prüfausführung; keine automatische Agentenkaskade.

Reguläre Claude-Rollen gehören zum Team; der gesonderte Auftrag AG-RELAY-MULTIREPO-001 wird durch diese Rückgabe NICHT als umgesetzt erklärt. Tatsächliche Werkzeug-/Laufgrenzen prüfen. Einen vorhandenen Ausführer nicht falsch als Forge/Cadence benennen und keinen zweiten Halter parallel starten. Geltende Vertretungs-/Kostenregeln anwenden; bei Schwellenüberschreitung vor weiterer Ausführung konkret rückmelden. Keine zusätzlichen Relay-/Infrastrukturarbeiten in diesen Korrekturschnitt aufnehmen.

## Externe Wirkung und Artefaktzugriff

Lokal arbeiten. Keine Quellcode-Pushes, Code-PRs, Main-Merges, App-Deployments, allgemeinen CI-Läufe oder produktiven Modellaufrufe. Keine öffentliche Historienbereinigung oder neue Versionierung. Gezielte, bereits autorisierte Spezialistenaufrufe bleiben an aktuelle Rechte und gesetzte Grenzen gebunden.

Veröffentliche eine bereinigte Diagnose-/Ergebniszusammenfassung mit vollständigen technischen Referenzen, Testergebnissen und offenen Befunden über den bereits autorisierten Dokumentations-/Journalweg. Private Downloadlinks bleiben privat. Die berichtete automatische Ablehnung ihrer Veröffentlichung wird nicht durch Kopieren der URLs an anderer Stelle umgangen.

Für die zentrale Steuerung eine zulässige, inhaltlich geprüfte Übergabe des neuen Kandidaten vorbereiten: vollständiger Commit/Baum, sichere Quellen-/Delta-Lieferung, Manifeste, Prüfsummen und Review. Vor öffentlichem Export prüfen, ob er vom vorhandenen Veröffentlichungsmandat gedeckt ist und keine Geheimnisse oder ursprünglichen Daten enthält. Eine eigenständige geprüfte öffentliche Exportfassung ist nicht dasselbe wie das Öffentlichmachen eines privaten Links; frühere Prüfurteile gelten nur für ihre exakten Artefakte. Wird auch der sichere Export abgewiesen oder fehlt die Freigabe, genaue betroffene Aktion und Ablehnungsgrund melden; weder umgehen noch fälschlich eine öffentlich abrufbare Lieferung behaupten. Nicht pauschal Peter zum Dateitransport auffordern.

## Rückgabe und Ende

```markdown
# BQ-EVAL-01-INT-01-K1 · Rückgabe v1
Status: DELIVERED / BLOCKED / NEEDS_DECISION
Parent: BQ-EVAL-01-INT-01 v2
Vollständige Ausgangs-SHA/Baum; neuer Kandidat SHA/Baum:
Ursprüngliche FAIL-Assertion mit Datei/Testname, Soll/Ist und Ursache:
Korrektur und Nachweis erhaltener Schutzwirkung / Gegenprobe:
Upgrade-Nachweis: PASS/FAIL/BLOCKED/NOT_TESTED, genauer Beleg:
Betroffene Prüfungen mit tatsächlichen Ergebnissen und Exitcodes:
Argus-Deltaurteil und verbleibende ursprüngliche Befunde:
Paketidentität/Wiederherstellung am neuen Stand:
Tatsächliche Rollen-/Laufreferenzen, beobachtete externe Wirkungen:
Öffentlich lesbare sichere Belege / explizit private oder gesperrte Artefakte:
Arbeits-/Release-/Archiv-Ergänzung oder exakter Schreibblocker:
INT-01-Gesamtkriterien erfüllt: JA/NEIN mit verbleibender Grenze:
Nächste Entscheidung für die zentrale Steuerung; nicht selbst begonnen:
```

Kein Gesamtabschluss oder Produkt-PASS, solange ein erforderlicher Befund bzw. Nachweis offen ist. Nach der Rückgabe stoppen. Keine automatische Freigabe von INT-01, EP06 oder Release.
