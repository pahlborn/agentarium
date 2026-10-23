# AG-EVENT-JOURNAL-001 — die Ergebniszuordnung

Stand Fassung 69 / Adapter `AG-GH-LIVE-001-v1.9` / Zusagewort `gemeldet-v4`.
Maßgeblich ist der Quelltext, nicht diese Datei.
Schließt AG-LM-TK-011, Teil Ergebniszuordnung.

## Warum nicht an die Aufgabe

Eine Aufgabe ist mit der **Annahme** erledigt. `merged` und `published` sagen
etwas über ein **Ergebnis** — einen Zweig, eine Fassung — und nicht darüber,
was eine Rolle gerade tut. Rulebook 1.3 §6 trennt das ausdrücklich.

Sie an die Aufgabe zu hängen wäre bequem und falsch. Also gehen sie an die
Stelle, die es schon gibt: **das Register**, das führt, woraus das Produkt
besteht. Kein neuer Block, keine zweite Liste.

## Zwei neue Vertragsfelder

| Feld | Form | Wann |
|---|---|---|
| `artifact_id` | wie die übrigen Kennungen | **Pflicht** bei `merged`/`published`, **erlaubt** bei `delivered`, sonst **verboten** |
| `artifact_version` | wie die übrigen Kennungen | nur zusammen mit `artifact_id` |

`delivered` darf eine tragen, **muss** aber nicht: Nicht jede Lieferung ist ein
Artefakt mit eigener Kennung. Bei anderen Arten verboten — ein `started` mit
Artefaktkennung behauptete einen Bezug, den die Art nicht hergibt. Eine Fassung
ohne Kennung ist eine Fassung von nichts und wird abgewiesen.

Beide gehören in den **Fingerabdruck**: ohne sie wären zwei Merges
verschiedener Artefakte mit gleichem Titel und Zeitstempel ein Duplikat.

## Die Stufenleiter des Registers

| Stufe | Zustand |
|---|---|
| 1 | `geliefert` |
| 2 | `prüfung` / `geprueft` |
| 3 | `angenommen` |
| 4 | `gemergt` |
| 5 | `veroeffentlicht` |

**Nur vorwärts**, wie bei der Aufgabenkette: Ein zweites `merged` nach der
Veröffentlichung stellt nichts zurück.

`ersetzt` und `verworfen` stehen **nicht** in der Leiter. Sie sind keine
Reifegrade, sondern Ausgänge: Eine ersetzte Fassung wird nicht durch ein
späteres `merged` wieder gültig.

## Wer erst beim Merge auftaucht, hat keine Lieferung

Ein `merged` zu einem Artefakt, das nie genannt wurde, legt den Eintrag an —
**mit dem gemeldeten Zustand**, nicht mit einem erfundenen früheren. Eine
Lieferung, die niemand belegt hat, wird nicht nachträglich behauptet.

## Was man davon sieht

Der Registerblock zeigt Kennung, Fassung und Zustand, wie bisher. `gemergt` und
`veroeffentlicht` stehen **heller** als die Prüfung — ein Ergebnis, das draußen
ist, ist das Weiteste, was dieses Register sagen kann. Dieselbe Sprache wie
`angenommen`, keine neue Farbe.

Jeder Eintrag trägt seinen **Originalbeleg** (die Kommentarnummer). Die
Listenzeile des Ereignisses nennt zusätzlich `· Werk <kennung> <fassung>`.

## Was das nicht ist

**Keine Freigabe.** Ein `published` im Register sagt, dass jemand eine
Veröffentlichung gemeldet hat — nicht, dass sie genehmigt war. Merge,
Veröffentlichung und Kundenannahme bleiben getrennte, freigabegebundene
Vorgänge, und aus einem Test-PASS folgt keiner von ihnen.

## Nachweis

`previews/AG-EVENT-JOURNAL-001/pruefen.js`, Teile M und M2.

**Gegentest gelaufen.** Mit abgeschaltetem Registerpfad fallen **neun** Zeilen
durch.

*Anmerkung zum Gegentest:* Der erste Durchgang brach mit einer Ausnahme ab —
Rückgabe 2, „ungeprüft". Das fällt im Lauf ebenfalls durch, sagt aber das
Falsche: Wer die Ausgabe liest, erfährt nicht, **welche** Zusagen verletzt
sind, sondern nur, dass der Nachweis gestorben ist. Die Zugriffe sind jetzt
nullsicher, und der Gegentest benennt seine neun Zeilen selbst.
