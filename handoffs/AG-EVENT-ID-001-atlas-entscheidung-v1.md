# AG-EVENT-ID-001 — Atlas-Entscheidung und Folgeauftrag V1
18.10.2026 · Antwort auf PR #16, Commit 42ffbdd5fffc8206c10619c2011ab89f767175d9

## Entscheidung zum blockierenden Quellstand
Für AG-EVENT-ID-001 ist **pilot/github-live/index.html, Fassung 51**, zusammen mit pilot/github-live/github-live.js die führende Integrationsbasis. Basis: ea0e64fbc1c2d29a97117c51f298ada0e78a0593. Der Kunde nutzt diesen Piloten.

**feld/index.html Fassung47 bleibt in diesem Auftrag unverändert.** Kein Doppelpatch, kein Rückbau des Piloten auf47, kein Umkopieren und kein Umschalten der öffentlichen Adresse. Das ist eine befristete Zuständigkeitsentscheidung für diesen Auftrag, keine dauerhafte Aufteilung in Live- und Archivprodukte. Der Pilot selbst behält Demo und Archiv.

Issue #14 bleibt für die dauerhafte Zusammenführung offen. Ziel ist eine gemeinsame gepflegte Darstellung; Ort und Build-Weg müssen separat mit dem Agentarium-Agenten/Forge abgestimmt werden. Bitte in der Rückmeldung knapp den verwendeten Source-/Build-Weg nennen: kein Neuaufbau aus einem alten F47-Generator, der geprüfte F51-Funktionen verliert. Kein Architekturumbau ist durch diesen Auftrag freigegeben.

## Rückmeldung aufgenommen, zwei Präzisierungen
Der Hinweis zur strikten Feldliste ist richtig: jedes Ereignis MIT unbekanntem Zusatzfeld wird vollständig abgewiesen. Bestehende Ereignisse OHNE dieses Feld funktionieren weiter. Daher short_ref aktuell NICHT erzeugen.

Die GitHub-Kommentar-ID ist nützlich als zusätzliche Transport-/Quellreferenz. Sie ersetzt die fachliche Ereignisidentität (project_id,id) nicht: ein erneuter Kommentar zum selben Ereignis hat eine andere Kommentar-ID, andere Quellen haben keine GitHub-Kommentar-ID. Aus ihr allein folgt auch keine kurze projektweite kollisionsfreie Nummer. Eine dauerhafte Zuordnung/Vergabe bleibt Produzentenaufgabe und ist noch nicht implementiert.

## Vereinbarter Empfängervertrag für den Kandidaten
- Zusätzliches optionales Feld short_ref, Zeichenkette; technische id und alle Herkunftsangaben unverändert.
- Kanonische Schreibweise: ID0001 bis ID9999, dann ID10000 usw.; keine wechselnde Schreibweise, kein ID0000 und keine zusätzlichen führenden Nullen oberhalb vier Ziffern. Gemeinsame feste Formatprüfung statt bloß ^ID[0-9]{4,}$, das auch ID00001 zuließe. Keine ungesicherte große Ganzzahlkonvertierung.
- Fehlt short_ref: bisherige Verarbeitung. Ist NUR short_ref ungültig: Kurzreferenz weglassen und Diagnose zugänglich machen; ein ansonsten gültiges Ereignis weiter verarbeiten. Andere Vertragsverstöße weiterhin unverändert prüfen.
- Nach short_ref weder sortieren noch zeitliche Reihenfolge ableiten.
- Keine clientseitige Vergabe, keine Umnummerierung beim Empfang, keine Neunummerierung je Lauf.
- Umfang: Adapter UND Originalaufnahme im Pilot müssen das optionale Feld erhalten; Darstellung nur aus validierten Daten, keine sichere HTML-Einbettung durch unmaskierten Text ersetzen.

## Begrenzter Folgeauftrag an den Agentarium-Agenten
Bitte auf einem eigenen Branch einen reviewbaren Empfängerkandidaten erstellen:
1. short_ref optional annehmen, prüfen und durchreichen.
2. In der „Was geschieht“-Liste vorn kurz anzeigen; technische ID und Quellenbezug in den Details zugänglich/kopierbar. Sprechblase als zeitlich begrenzte Anzeige wie vorgeschlagen, soweit ohne Überlagerung umsetzbar.
3. Demo, Archiv und bisherige progress/handoff/contribution-Ereignisse bewahren. Keine Kostenänderung, kein neuer Archivleser, keine Vergabelogik.
4. Versionierte Empfängerfähigkeit nachprüfbar machen, sodass neue und alte/offene Clients unterschieden werden können. Kleinste vorhandene Mechanik nutzen; keinen neuen Dienst einführen.
5. Diff, exakten Commit, Source-/Build-Weg, ausgeführte Prüfungen und verbleibende Grenzen zurückliefern. Neue UI-Darstellung an Desktop und Tablet überprüfen; kleine Bildschirme mit Befund benennen statt ungeprüft freigeben.

Lokale/synthetische Tests klar kennzeichnen: ohne Feld, gültiges Feld inkl. ID9999/ID10000, ungültige Werte, doppelt geliefertes Ereignis, unveränderte technische ID, neue/alte bzw. gemischte Empfängerstände. Das ist keine Kunden-Live-Abnahme.

**Keine Veröffentlichung oder Merge daraus ableiten.** Peter prüft den Kandidaten vor Umsetzung in den laufenden Monitor. Diese Anweisung erteilt nur den begrenzten Kandidatenauftrag; Atlas/Forge ändern nicht parallel dessen UI.

## Sichere spätere Ausrollfolge
1. Empfängerkandidat prüfen; nach Peters Freigabe kompatiblen Adapter UND Originalaufnahme bereitstellen.
2. Tatsächlich geladene Kombination prüfen, nicht nur Repository-/Serverfassung: alte offene Tabs und Service-Worker-Caches sind gesondert zu beachten. Ein neuer Serverstand ist kein Beleg für aktualisierte Clients.
3. Auf einem bestätigten geeigneten Client ein neues reales Ereignis mit short_ref prüfen; keine alten Ereignisse als neue Arbeit vorspielen. Zuvor muss Atlas eine gültige dauerhafte Probezuordnung bereitgestellt haben.
4. Erst danach reguläre Produzentenausgabe aktivieren. Solange alte aktive Empfänger mitlesen oder ihre Fähigkeit unbekannt ist, im gemeinsamen Stream weiterhin ohne short_ref senden. Ein optionales Feld im neuen Adapter rettet alte Adapter nicht.
5. Rückfall: neue Produzentenausgabe stoppen, alte Ereignisse weiter verarbeiten; keine Rücknahme der UI aus diesem Dokument ableiten.

Atlas verantwortet den gesonderten Produzentenauftrag und eine dauerhafte, wiederholungs- und parallelitätssichere Zuordnung. Bis dahin existiert keine produktive Kurz-ID-Vergabe.

## Status
Dokumentenentscheidung und begrenzter Folgeauftrag. Kein Code geändert, kein Merge, keine Veröffentlichung, kein Kurz-ID-Live-PASS.

## Unabhängiger Entwurfscheck
Argus, echter Subagent /root/argus_live_handoffs, AG-EVENT-ID-001-REVIEW-V1: PASS_WITH_NOTES für den begrenzten Entscheidungsentwurf. Die Hinweise zu alten Clients, Build-Weg und kanonischer Identität sind oben aufgenommen. Das ist kein Review des noch nicht vorhandenen Codes. Vollbericht: handoffs/AG-EVENT-ID-001-argus-review-v1.md.
