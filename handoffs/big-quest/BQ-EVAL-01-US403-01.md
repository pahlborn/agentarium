# BQ-EVAL-01-US403-01 · Verlorene Claude-Antwort verständlich und ohne automatischen Doppelaufruf behandeln

Auftragsfassung v1 · 15.11.2026 · Projekt big-quest · Lauf BQ-EVAL-01 · EP04 / US403. Dies ist ein konkreter Implementierungsauftrag, keine weitere Architektur-/Betriebsstudie.

## Startsequenz und Ziel

Atlas, lade und verwende `operate-as-atlas`. Lies aktuellen AGENTS-/Process-/Rulebook-Stand, diesen Auftrag und nur die nötigen vorhandenen Anforderungen. Nenne geladene Regeln/Commit, tatsächliche Quellbasis, vorhandenes Verhalten und technischen Halter. Letzte bekannte Governance: Agentarium Rulebook/Process1.4 an main `9962810b895baf10f8d71dd9a1f7387cca049b77`; aktuell prüfen.

Steuerung und Folgeaufträge bleiben im zentralen Chat. Archivmodus big-quest/BQ-EVAL-01, kein Livebetrieb. Forge ist reguläre Entwicklungsrolle; eine qualifizierte echte getrennte Vertretung ist ausdrücklich erlaubt, ohne auf Relay oder weiteren API-Nachweis zu warten. Ein aktiver technischer Halter; unabhängige Prüfung des entscheidenden Verhaltens durch Sentinel. Weitere Rollen nur für eine konkrete Lücke, keine vollständige Pipeline. Reale Autorenschaft/Läufe und Nachweise nennen; keine Rollen simulieren.

**Nutzerergebnis:** Hat der Anbieter eine Aufbereitung möglicherweise schon angenommen/verarbeitet, aber Big Quest erhält keine verlässliche Antwort, erscheint ein verständlicher unklarer Status. Eingefügter Text und manuelle Änderungen bleiben erhalten. Kein automatischer erneuter Modellaufruf – auch nicht durch Neuladen, Neustart oder dieselbe Request-ID. Manuelle Fertigstellung bleibt möglich. Eine vom Nutzer ausdrücklich gewählte neue Anfrage wird als neuer Versuch geführt; ursprüngliche Ungewissheit bleibt nachvollziehbar.

## Vorhandene Anforderungen und Eingaben

Alle Eingaben selbst aus GitHub beziehen, kein Dateitransport durch Peter:

- [Gesamtübergabe und SHA256](https://github.com/pahlborn/agentarium/blob/da4c7fac79c798a12e6253621f4a9b476b5879ac/handoffs/big-quest/inputs/BQ-EVAL-01-INT-01/INPUTS.md). Konzept v1.0 §3.2 Nr.4 und EP04/US403 sind die Anforderungsbasis. Die Entscheidungen D-01–D-06 nicht neu öffnen.
- [OPS-Matrix](https://github.com/pahlborn/agentarium/blob/7aeccb0e487819f57e87c8e79462b0744af5c6f6/handoffs/big-quest/results/BQ-EVAL-01-OPS-01/Betriebsmatrix-v1.md), insbesondere dauerhafte Limits/Deduplizierung und unklarer Anbieterstatus. Analyse ist Beleg für einen zu prüfenden Ausgangspunkt, nicht Ersatz der Codeprüfung.
- Relevanter Quellpfad: `services/school-ai/claude-draft.mjs`, `claude-routes.mjs`, `access-store.mjs`, zugehörige Tests und der unmittelbare Frontend-/Client-Fehlerpfad. Im dokumentierten Stand wird Timeout als `PROVIDER_UNAVAILABLE` geführt; der Store reserviert einen Request, zeigt aber keinen dauerhaften eindeutigen Ungewissheitsstatus.
- Dokumentierter Originalstand `0a2d92fd1df28bda46fa793cbc8309a63df185be`, Originalbaum `e0474ccb8681592f0ed88bcebc318ab87afd2c12`; kumulativer Patch im Paket auf öffentlicher Basis `7995d6968e3895b88f8ed2c3b0476683e5720c1a`. Vorhandene tatsächlich verfügbare angenommene neuere Basis prüfen. Unvollständige anonymisierte Kopie nicht als ganzen Originalstand ausgeben.

Ein eigenständiger Quellsubset mit genau den benötigten Diensten/Tests ist für die Implementierung zulässig, soweit Herkunft/Identität klar sind; ein isolierter Diensttest ersetzt den ebenfalls geforderten tatsächlichen Frontend-Verhaltensnachweis nicht. Originaldaten nicht rekonstruieren oder neu sichern. Fehlende Quellen selbst über dokumentierten Basis-/Patchweg beschaffen; keinen privaten Fremdchat-Pfad als verfügbar annehmen.

## Begrenzte Umsetzung

1. Bestehenden Anfrage-/Reservierungs-/Fehlerpfad lesen und die tatsächliche Lücke am genauen Stand festhalten. Keine erneute allgemeine Machbarkeitsstudie.
2. Den kleinsten zur vorhandenen Architektur passenden dauerhaften Versuchszustand implementieren. Request, Familie und erforderliche Bindungen eindeutig zuordnen. Vorübergehend laufend, endgültig fehlgeschlagen/abgeschlossen und unklar nicht fälschlich gleichsetzen. Nur nötige Statusmetadaten speichern; keine neuen Rohtext-/API-Key-Logs oder ungeschützten Bewertungsablagen.
3. Unklare Anbieterwirkung bei verlorenem Ergebnis konservativ behandeln, ohne jeden eindeutig abgewiesenen Fehler pauschal als verarbeitet zu erklären. Neustart und abgebrochener laufender Versuch dürfen keinen stillen automatischen Neuaufruf erzeugen. Vorhandene Limits und Deduplizierung erhalten.
4. Den vorhandenen Client-/Formular-Fehlerpfad minimal anschließen: verständliche Meldung und manuelle Fortsetzung. Bestehendes gemeinsames Formular, Texte/Layout außerhalb der notwendigen Statusmeldung, Kind-/Kontobindung und Bestätigung als einziger Schreibtrigger bleiben erhalten. Keine Evaluation allein wegen eines Modellversuchs speichern.
5. Ausdrückliches erneutes Aufbereiten klar von automatischer Wiederholung unterscheiden; neuer Versuch bleibt kosten-/requestseitig nachvollziehbar. Kein neuer Hintergrunddienst, keine allgemeine Queue-/Cachingplattform und keine neue Anmelde-/Schlüsselarchitektur.

Technische Implementierungsdetails innerhalb dieser Anforderungen selbst entscheiden. Nur bei materieller Produkt-/Architekturänderung oder unvermeidbarem Konflikt konkrete Entscheidung mit kleinster Alternative an die zentrale Steuerung geben. Nicht jede Datei, Fixture oder gezielte Wiederholungsprüfung erneut freigeben lassen.

## Abnahme am tatsächlichen Kandidaten

| ID | Erforderlicher beobachtbarer Nachweis |
|---|---|
| C1 | Simulierter Anbieter nimmt eine Anfrage an/verarbeitet sie, Antwort fällt weg: eindeutiger unklarer Status statt Erfolg oder gefahrlosem automatischem Retry. |
| C2 | Dieselbe Request-ID, konkurrierende Wiederholung und Wiederanlauf nach Prozess-/Speicherneustart erzeugen keinen zweiten Anbieteraufruf. Status bleibt nachvollziehbar. |
| C3 | Im vorhandenen Elternformular bleiben Quelltext und manuelle Änderungen nach dem Fehler erhalten; manuelle Fortsetzung ist bedienbar. Ein verspätetes Ergebnis überschreibt keine neueren Eingaben. |
| C4 | Vorschau/Fehler/Aufbereitung erzeugen kein Bewertungsereignis. Erst ausdrückliche Bestätigung speichert beim richtigen Kind; bestehender Kindwechsel-/Abbruchschutz bleibt wirksam. |
| C5 | Eindeutig abgelehnter Schlüssel, Limit und eindeutig vor Ausführung gescheiterter Vorgang werden sinnvoll vom unklaren Zustand unterschieden; keine interne Fehlermeldung/Secrets im UI. |
| C6 | Zwei Familien/Kindberechtigungen, Schlüsselwechsel/-löschung und Entzug umgehen die bestehenden Grenzen nicht. Statusabfrage oder Wiederholung liefert keine fremden Informationen. |
| C7 | Explizit gewählter neuer Versuch ist sichtbar und neu gebunden; alte Ungewissheit wird nicht als sicherer Erfolg umgeschrieben. Keine automatischen kostenpflichtigen Schleifen. |
| C8 | Unabhängiger Prüfer verifiziert den konkreten Fehler-/Wiederholungsfall und die entscheidende Frontendwirkung am genauen Kandidaten. Aussagekräftiger Vorher-/Gegenbeleg; betroffene Regression statt aller historischen Vollsuiten. |

Verwende ausschließlich simulierten Anbieter und synthetische Daten; ein echter Anthropic-Aufruf ist für diesen Fehlertest unnötig und nicht autorisiert. Kein neuer Server, Hoster, KMS oder produktiver Familienschlüssel ist Voraussetzung dieser lokalen Arbeit. Reale Anbieter-/Produktions-/Zielgeräteabnahme bleibt später getrennt, ohne die lokale Aufgabe künstlich daran zu blockieren.

## Parallelität und Befugnisse

Eigener abgegrenzter lokaler Kandidat; INT01-K1, US202-K1 und Relay-Auftrag nicht überschreiben oder deren Worker duplizieren. Primär Dienst-/Client-Fehlerpfad bearbeiten. Falls eine kleine Änderung an derselben index.html wie US202 nötig ist, separat als exaktes Delta liefern und die Überschneidung für die spätere Zusammenführung benennen. Kein gemeinsamer laufender Arbeitsbaum und keine stillschweigende Integration der anderen Aufgaben.

Erlaubt: nötige lokale Implementierung, synthetische Tests/Browsernachweise, lokale Kandidaten-Commits, begrenzte echte Fachrollen-/Vertretungsausführung und unabhängige Prüfung. Geltende Kosten-/Laufgrenzen über alle Versuche beachten. Keine zusätzlichen Live-Anbieter-/Identitätsproben oder automatischen Wiederholungen.

Nicht erlaubt: Code-Push/PR, Main-Merge, Releaseversion, App-/Dienstdeployment, Workflow-/Relayänderung, Produktionsaktivierung, Verarbeitung ursprünglicher Familien-/Schuldaten, neue Infrastruktur oder allgemeine CI. Sichere Dokumentations-/Artefaktübergabe im bestehenden Mandat bereitstellen; private Zugriffserlaubnis ist keine Veröffentlichung privater URLs. Bei Export-/Werkzeugblockade genaue Aktion/Grund und sichere vorhandene Alternative nennen, statt abgeschlossene Nutzerfreigaben erneut anzufordern.

## Rückgabe und Ende

```markdown
# BQ-EVAL-01-US403-01 · Rückgabe v1
Status: DELIVERED / BLOCKED / NEEDS_DECISION
Auftrag v1 / unveränderlicher Link:
Regelstand, exakte Eingabebasis und Kandidaten-Commit/Baum:
Umgesetzter sichtbarer Ablauf und Persistenzvertrag, tatsächliche Dateiliste:
C1–C8 jeweils Ergebnis, Befehl/Umgebung/Log/Exitcode:
Anbieter-Aufrufzähler vor/nach Wiederholung und Neustart:
Tatsächlicher Frontendnachweis, keine Evaluation vor Bestätigung:
Unabhängiger Befund am genauen Kandidaten und verbleibende Grenzen:
Wiederherstellbares bereinigtes Delta/Paket mit SHA256 und sicherem Zugang:
Überschneidungen mit anderen Aufgaben und späterer Integrationshinweis:
Reale Rollen-/Laufreferenzen, bekannte Kosten, externe Wirkungen:
Arbeits-/Release-/Archiv-Ergänzung oder konkreter Schreibblocker:
Nächster nötiger Schritt, nicht eigenständig begonnen:
```

Lieferung muss implementierten Code und reproduzierbare Produktwirkung enthalten; ein weiterer Bericht oder bloßer Testplan erfüllt diesen Auftrag nicht. Danach stoppen. Keine automatische Annahme von EP04, EP06 oder Release.
