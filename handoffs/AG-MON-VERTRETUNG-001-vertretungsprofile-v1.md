# Echte Vertretung — Profile v1

Beschlossen: Peter, 01.11.2026 („Ok, bitte umsetzen“). Ergänzt Rulebook 1.4 §§2/8 und Process 1.4 §3. Ein Profil ist keine laufende Instanz und erteilt keine zusätzlichen Werkzeuge oder Ausgabenrechte.

| Vertretene Funktion | Echte Ausführung | Grenze |
|---|---|---|
| Archibald / Spezifikation | separater ChatGPT-Spezifikationsvertreter | Anforderungen und Abnahmekriterien; keine Implementierung oder eigene Abnahme |
| Forge / Entwicklung | separater Codex-Entwicklungsvertreter | technische Wahl, autorisierte Umsetzung und eigene Checks; unabhängiges Review/QA bleibt getrennt |
| Cadence / Prozessprüfung | separater ChatGPT-Prozessprüfer | prüft Atlas und Team unabhängig anhand Originalen; max. drei Korrekturen oder begründetes no-change; keine eigene Regeländerung |
| Lot / Monitor | nur nach gesonderter Zuweisung durch Peter | Lot bleibt ausschließlich durch Peter gestartet; dieser Auftrag gestattet ausdrücklich einen eigenen Codex-Monitorvertreter |

## Atlas startet einen Vertreter

1. Originalstatus einmal prüfen: bestätigter Fehler / Ausführungsgrenze, geplantes Warten oder unbekannt. Keine Ausfallbehauptung aus Schweigen. Ein von Peter ausdrücklich beauftragter Vertreter darf auch direkt starten; das beweist keinen vorangegangenen technischen Ausfall.
2. Letzten überprüfbaren Arbeitsstand benennen, ohne Checkpoint ausdrücklich `no-checkpoint`; Verlust und erforderliche Wiederholung offen nennen. Alten Worker nachweislich stoppen oder Auftrag wirksam entziehen. Unklarer Stopp blockiert die Übernahme.
3. Reale separate Instanz mit eigenem Runtime-Identifier starten. Bounded assignment: bestehende Task-/Projekt-/Lauf-/Elternkennung, vertretene Funktion, tatsächliche Plattform, genauer Inputstand, Ergebnis, Rechte, Grenzen und Stopkriterium. Passendes Fachprofil laden. Kein bloßes Umbenennen zu Forge/Archibald/Cadence.
4. `reassigned` nur für eine delegierte Teilaufgabe mit nichtleerem unverändertem `parent_id` nach technischem Ereignisvertrag melden; Peters Hauptauftrag und Hauptball bleiben bei Atlas. vorherigen Halter, konkreten Stopp-/Entzugsbeleg und Arbeitsstand mitgeben. Der Monitor prüft Zuordnung und Syntax; Atlas prüft den Beleginhalt. Im Monitor meldet sich der Vertreter als `springer`; der Aufgabenbeleg nennt Funktion und echte Runtime. Höchstens ein aktiver Halter pro Aufgabe.
5. Neue Instanz meldet tatsächlichen Empfang/Start und eigenes Ergebnis. Blockade wird erst nach belegter Auflösung mit derselben `blocker_id` aufgelöst; Übernahme allein beseitigt keine sachliche Blockade. Bei fehlenden Rechten/Fähigkeiten bleibt Atlas für die Klärung verantwortlich.

Die Wiederanlaufentscheidung erfolgt in aktiver Atlas-Sitzung oder durch einen ausdrücklich autorisierten Auslöser. Keine permanente Aktivierung, keine unbegrenzten Wiederholungen, keine neuen bezahlten Aufrufe ohne geltende Kostenfreigabe. Die 5-USD-Grenze zählt alle Versuche derselben Aufgabe. Ein gemeinsamer Claude-Ausfall wird nicht mit einer anderen Claude-Rolle umgangen.

## Darstellung und Belege

Technische GitHub-Läufe sind eine begrenzte, schreibgeschützte Sicht. Workflowerfolg ist kein Workerstart, Fachabschluss oder Kundenannahme. Syntaktisch gültige Referenzen sind keine automatische Inhaltsverifikation. Geplantes Warten/fehlende Startmeldung ist kein belegter Ausfall. Eine blockierte Aufgabe zeigt Grund, Zeitpunkt, Originalmeldung und nächsten Verantwortlichen auch ohne Farbe oder Hover; reduzierte Bewegung wird berücksichtigt.

## Stand der Einführung

Dieser Auftrag nutzt einen tatsächlichen Codex-Entwicklungsvertreter `/root/codex_springer` und eine davon unabhängige QA-Instanz `/root/sentinel_vertretung`. Das ist eine direkt freigegebene Vertretung, kein Nachweis eines heute erneut getesteten Claude-Kontingentausfalls. Spec-/Prozessvertretung sind als Profile integriert; ihre spätere echte Anwendung und Wirksamkeit sind gesondert nachzuweisen. Physisches iPad/Safari sowie Verfügbarkeit geänderter Regeln in einem unabhängigen neuen Chat werden dadurch nicht behauptet.
