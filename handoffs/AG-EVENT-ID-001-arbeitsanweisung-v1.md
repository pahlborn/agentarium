# AG-EVENT-ID-001 — Kurze Ereignisreferenzen je Projekt
Version: V1 · 18.10.2026 · Auftraggeber Peter · Koordination Atlas
Status: Arbeitsanweisung zur technischen Abstimmung und Prüfung; noch keine Implementierung oder Veröffentlichung.

## Ziel und Anlass
Peter möchte Ereignisse im Monitor kurz und eindeutig zurückmelden können, etwa „Agentarium, ID1234“. Dieselbe Referenz soll Fehlersuche, Teamkommunikation und später den Archivvergleich erleichtern. Die kurze Referenz bezeichnet ein Ereignis, keine Aufgabe, keinen Agenten und keinen Lauf.

## Zuständigkeiten
- Atlas/Produzentenseite: dauerhafte projektweite Zuordnung und Vergabe, Parallelität und Wiederholungen absichern, Referenz mit echten Ereignissen liefern. Die technische Vergabe ist noch nicht implementiert; eine zentrale Vergabestelle ist ein zu prüfender Lösungsansatz, kein bereits vorhandener Dienst.
- Agentarium-Agent: bestehende Aufnahme und UI prüfen, Darstellung und Detailzugriff entwerfen, benötigte Anpassungen an Adapter/Consumer benennen. Keine eigene geräteabhängige Umnummerierung.
- Schnittstelle gemeinsam abstimmen: Feldname, Format und Kompatibilität vor beidseitiger Implementierung festhalten. Keine parallelen konkurrierenden Änderungen an der Agentarium-Oberfläche durch Atlas/Forge.
- Merge und Veröffentlichung bleiben bei Peter.

## Gewünschtes Verhalten
1. Kurze Anzeigeform beispielsweise ID0001, ID0002 …; führende Nullen sind Mindestbreite, nach ID9999 weiterzählen. Endgültiges Format noch abstimmen.
2. Eindeutigkeit im Namensraum project_id; Projektname/-kennung im Kontext anzeigen. Keine Rücksetzung je Lauf, Browser, Gerät oder Neustart.
3. Bestehende technische Ereignis-ID id unverändert erhalten. Dauerhafte Zuordnung (project_id, id) → Kurzreferenz. Erneuter Empfang desselben Ereignisses erhält dieselbe Kurzreferenz.
4. Zwei verschiedene Ereignisse desselben Projekts dürfen auch bei parallelen Produzenten keine gleiche Kurzreferenz erhalten. Lücken dürfen entstehen; die Nummer behauptet weder lückenlose Protokollierung noch zeitliche Reihenfolge des Geschehens. occurred_at bleibt die Zeitangabe.
5. Derselbe Datensatz zeigt live und im späteren Archiv dieselbe Referenz. Daraus folgt kein Archiv-Implementierungsauftrag.
6. Kurze Referenz gut lesbar in der Ereignisliste; vollständige technische ID und Quellbezug in den Details erreichbar/kopierbar. Darstellung in Bewegung bitte vorschlagen; keine pauschale Pflicht zu dauerhaftem Zusatztext auf der Bühne.
7. Altere Ereignisse ohne Kurzreferenz weiterhin verarbeiten. Ersatzweise vorhandene technische ID zugänglich machen; keine scheinbar verbindliche ID pro Browser errechnen. Nachträgliche Vergabe nur über dieselbe dauerhafte Zuordnung, nicht beiläufig im UI.
8. Keine Tokens, Zugangsdaten oder vollständigen vertraulichen Inhalte in die Referenz aufnehmen.

## Wichtiger Kompatibilitätspunkt
Der geprüfte Pilot Fassung51, Adapter AG-GH-LIVE-001-v1.3, hat eine strikte Feldliste. Ein zusätzliches unbekanntes JSON-Feld wird abgewiesen. Daher NICHT einfach ein neues Feld in laufende Ereignisse schreiben. Den Namen der zusätzlichen Kurzreferenz und die notwendige kompatible Adapter-/Vertragsänderung erst abstimmen und testen; id nicht zweckentfremden. Bestehende Ereignisse und Empfängerfelder müssen weiter funktionieren.

Geprüfte Basis des Piloten:
- Commit ea0e64fbc1c2d29a97117c51f298ada0e78a0593
- pilot/github-live/github-live.js
- pilot/github-live/index.html
Der Agentarium-Agent arbeitet parallel weiter: eigenen aktuellen Quellstand vor jedem Vorschlag angeben; diese Basis nicht ungeprüft über seine neuere Arbeit kopieren.

## Konkreter Auftrag an den Agentarium-Agenten
Bitte zunächst eine kurze technische Rückmeldung erstellen:
1. Wo und wie lässt sich die Kurzreferenz im bestehenden UI lesbar anzeigen, ohne den bisherigen Umfang zu beeinträchtigen?
2. Welches zusätzliche Feld/Format und welche Kompatibilitätsregel empfiehlt ihr? Welche Consumer-Dateien wären betroffen?
3. Gibt es einen Einwand gegen die Verantwortungsgrenze oder eine vorhandene ID-Lösung, die wir wiederverwenden sollten?

Bitte Ergebnis als handoffs/AG-EVENT-ID-001-agentarium-rueckmeldung-v1.md auf eurem Arbeitsbranch hinterlegen und Commit/Link nennen. Noch keine eigenständige Vergabelogik, neue Infrastruktur oder Veröffentlichung daraus ableiten. Atlas übernimmt danach die Produzentenabstimmung und den begrenzten Folgeauftrag. Das ist ein kleiner Schnittstellenauftrag, keine Vollspezifikation.

## Gemeinsame spätere Prüfpunkte
- Zwei parallele Ereignisse: unterschiedliche Kurzreferenzen.
- Dasselbe Ereignis erneut empfangen: unveränderte Kurzreferenz, kein Duplikat durch neue Nummer.
- Browser-/Gerätewechsel und Neustart: Referenz bleibt gleich.
- Unterschiedliche Projekte dürfen dieselbe Kurznummer haben; Projektkontext löst die Mehrdeutigkeit.
- Altformat ohne Zusatzfeld weiterhin angenommen; vereinbarte Erweiterung angenommen; ungültige Daten diagnostiziert.
- Live/Archiv-Zuordnung an identischem Datensatz prüfen, sobald ein echter Archivpfad vorhanden ist.
- Peter kann Projekt und kurze ID aus der Liste zurückmelden; wir lösen sie zum ursprünglichen Ereignis auf.
- Demo, Archiv und bestehende Live-Ereignisse bleiben funktionsfähig.

## Grenzen und Nachweisstand
Dokument erstellt; noch kein Kurz-ID-Verfahren in Betrieb, keine neue UI und keine Laufzeitabnahme. Kostenanzeige und andere Produktänderungen sind nicht Teil dieses Auftrags.
