# AG-EVENT-JOURNAL-001 — die Kette der Aufgabenzustände

Stand Fassung 67 / Adapter `AG-GH-LIVE-001-v1.7` / Zusagewort `gemeldet-v3`.
Maßgeblich ist der Quelltext, nicht diese Datei.

## Die Kette

| Stufe | Zustand | gesetzt durch |
|---|---|---|
| 1 | `zugewiesen` | `assigned` (vom Vergebenden) |
| 2 | `empfangen` | `received` |
| 3 | `begonnen` | `started` |
| 4 | `geliefert` | `delivered` |
| 5 | `geprueft` | `reviewed` |
| — | **geschlossen** | `accepted` oder `aborted` |

**Nur vorwärts.** Ein Ereignis, das keine höhere Stufe bringt, ändert nichts
und ist keine Lücke: Ein zweites `delivered` ist ein Transportduplikat, kein
Rücksprung. Ein Rücksprung wäre eine Behauptung über eine Reihenfolge, die die
Daten nicht tragen.

## Die Materialentscheidung: `delivered` schließt nicht mehr

Bis Fassung 66 schloss `delivered` die Aufgabe. Das kann nicht bleiben, sobald
Prüfung und Annahme dazukommen — dann wäre die Aufgabe weg, bevor irgendjemand
sie angesehen hat, und „Prüfung" und „Annahme" hätten nichts mehr, woran sie
hängen.

> Geliefert heißt: der Arbeitende ist fertig.
> Erledigt heißt: jemand hat es **angenommen**.

Rulebook 1.3 §6 trennt das ausdrücklich: „Accepted requirement, passed test and
released product are distinct."

**Die Folge ist gewollt:** Eine gelieferte Aufgabe, die niemand annimmt, bleibt
sichtbar liegen. Vorher verschwand sie mit der Lieferung aus dem Bild und sah
damit aus wie erledigt, obwohl sie auf jemanden wartet. Genau das soll man
sehen.

**Das ist eine Änderung an schon abgenommenem Verhalten**, und sie ist hier
benannt statt beiläufig mitgenommen.

## Was `merged` und `published` nicht sind

Keine Zustände einer Aufgabe. Sie sagen etwas über ein **Ergebnis** — einen
Zweig, eine Fassung — und nicht darüber, was eine Rolle gerade tut. Der
Monitor hat dafür schon einen eigenen Ort: das Register, das führt, woraus das
Produkt besteht. Dort hängen sie an einer **Artefaktkennung**, und die trägt
der Livevertrag heute nicht.

Also kommen sie an, sind lesbar und treiben nichts. Das steht als offener Punkt
da, nicht als stillschweigende Lücke. Sie an die Aufgabe zu hängen wäre bequem
und falsch: Eine Aufgabe ist mit der **Annahme** erledigt, nicht mit dem Merge.

## Was man davon sieht

| Zustand | Ring | Wort am Schild |
|---|---|---|
| `zugewiesen`, `empfangen` | steht still | „liegt" |
| `begonnen` | kreist, Herzschlag | „arbeitet" |
| `begonnen` + Klemme | stockt gegen die Richtung | „klemmt" |
| `geliefert`, `geprueft` | steht still | „wartet" |

**Tätig ist nur, wer begonnen hat.** Vorher hieß „nicht zugewiesen" soviel wie
„arbeitet"; seit es `empfangen`, `geliefert` und `geprueft` gibt, wäre das
falsch — wer geliefert hat, produziert nichts mehr. Ein kreisender Ring
behauptete dort Arbeit, die niemand gemeldet hat.

Im aufgezeichneten Stück ist der Vorgabewert `begonnen`; dort ändert sich
nichts.

## Wiederherstellung

Dieselben Stufen, dieselbe Vorwärtsfaltung. Eine gelieferte oder geprüfte
Aufgabe aus der Historie kommt als `geliefert` bzw. `geprueft` zurück — vorher
fiel sie auf `zugewiesen` zurück, also auf einen Rückschritt gegenüber dem, was
die Daten sagen. Unbekanntes fällt auf `zugewiesen` zurück, denn das ist der
Zustand, den eine Vergabe allein belegt.

## Nachweis

`previews/AG-EVENT-JOURNAL-001/pruefen.js`: Teil A6 (R11 geliefert und nicht
angenommen, R12 geprüft und nicht angenommen, ein zweites `delivered` stellt
nichts zurück), Teil A4 (die Lieferung in Projekt B schließt nichts, erst die
Annahme), Teil H (Lieferung → Prüfung → Annahme einzeln, und `merged`/
`published` legen keine Aufgabe an).

**Gegentest gelaufen.** Mit dem alten Verhalten fallen sieben Zeilen durch.

*Anmerkung zum Gegentest selbst:* Der erste Versuch war wirkungslos. Er
stellte nur die schließende Verzweigung zurück — aber `delivered` steht in der
Tabelle davor und erreichte sie gar nicht. Drei Zeilen fielen durch statt
sieben, und das sah nach einem bestandenen Gegentest aus. Aufgefallen ist es,
weil die *erwartete* Fehlzeile fehlte. Ein Gegentest, der die Sache nicht
wirklich zurückstellt, belegt nichts — derselbe Fehler wie bei einem
Messgerät, das nichts ausgibt.
