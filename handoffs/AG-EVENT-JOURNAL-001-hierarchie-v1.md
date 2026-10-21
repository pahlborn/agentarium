# AG-EVENT-JOURNAL-001 — Arbeitselement: Typ, Elternbezug, Fassung

Stand Fassung 70 / Adapter `AG-GH-LIVE-001-v2.0` / Zusagewort `gemeldet-v5`.
Gehört zum gemeinsamen Hierarchieanteil **AG-LM-TK-001 / TK-007 / TK-015**,
Teil Vertrag und Anzeige.
Maßgeblich ist der Quelltext, nicht diese Datei.

> **Berichtigung, von Atlas verlangt (Kommentar 6321359599).** Hier stand
> „Schließt AG-LM-TK-021". Das war falsch: **TK-021 ist der
> Archibald-Spezifikationsauftrag**, und der bleibt `pending_route`. Ich hatte
> zwei Dinge aus Atlas' Kommentar 6320323499 verwechselt — er hat dort im
> selben Text die begrenzte Spezifikationsübergabe *und* die Vertragsarbeit an
> mich genannt. Diese Datei beschreibt nur die Vertragsarbeit. **Sie schließt
> TK-021 nicht und behauptet keine Archibald-Lieferung.**
>
> Ebenfalls offen und von dieser Lieferung **nicht** berührt: **AG-LM-TK-023 /
> TC-011**, der tatsächliche Elternabschluss.

## Drei wahlfreie Felder — und bewusst kein viertes

| Feld | Form | Vorgabe |
|---|---|---|
| `item_type` | Aufzählung: `epic` \| `story` \| `task` | `task` |
| `parent_id` | wie die übrigen Kennungen | leer |
| `item_version` | wie die übrigen Kennungen | leer |

**Rückwärtskompatibel heißt: alle drei sind wahlfrei.** Ein Ereignis ohne sie
verhält sich genau wie bisher — Typ `task`, kein Elternbezug. Kein Produzent
muss etwas ändern, um weiter angenommen zu werden. Das war Atlas' Bedingung
(„kleinste rückwärtskompatible Ergänzung"), und sie ist im Nachweis als eigene
Zeile gemessen: *ohne Typangabe kommt `task` heraus*.

**Kein viertes Feld für die Kennung.** `task_id` trägt die Identität des
Elements schon, egal welcher Art es ist. Ein zusätzliches `item_id` wäre
dieselbe Angabe zweimal — und zwei Angaben derselben Sache laufen auseinander.
`item_type` sagt, **was** diese Kennung benennt.

**Eine Aufzählung, kein freier Text.** `Epic`, `EPIC` und `epik` wären drei
Dinge, die eines meinen. Unbekanntes wird abgewiesen, nicht geraten.

**Ein Element ist nicht sein eigenes Elternteil.** Das wäre ein Zyklus aus
einem einzigen Glied, und die Elternkette hätte kein Ende. Wird abgewiesen.

## Keine erfundenen Kinderstarts, keine Doppelaufträge

Atlas' zweite Bedingung ist hier geschenkt — und wird trotzdem gemessen:

> **Dieser Monitor kennt keine Kinder.** Er legt an, was gemeldet wird, und
> leitet aus einer Epic nichts ab.

Die Vergabe einer Epic erzeugt **genau einen** Eintrag: den der Epic. Was
darunter läuft, muss einzeln gemeldet werden, und dann steht es einzeln da.
Beides ist im Nachweis festgehalten — nach der Epic-Vergabe steht unter ihr
**nichts**, und nach der Meldung einer Story stehen **zwei** getrennte
Einträge, keiner aus dem anderen abgeleitet.

Von unten gelesen gilt dasselbe: Der Beginn der Aufgabe lässt Story und Epic
auf `zugewiesen`. **Ein Abschluss nach oben findet nicht statt** — das ist
offener Umfang (**AG-LM-TK-023 / TC-011**), keine stille Ableitung. Er ist der
grössere Teil der Hierarchie und bewusst nicht mitgeliefert.

## Live und Restore ergeben dieselbe Lage

Typ, Elternbezug und Fassung kommen von der **Vergabe** — wie der Originalbeleg.
Nähme die Faltung sie von einem späteren Ereignis, zeigte dieselbe Lage je nach
Weg zwei verschiedene Elternketten. Das ist derselbe Fehler, den ich beim
Originalbeleg schon einmal gemacht hatte.

## Was man davon sieht

Die Listenzeile und die Tafel nennen `· epic` bzw. `· story`, `· Fassung V1`
und `· unter AG-LM-EP-002`. **Der Typ `task` steht nicht da** — er ist die
Vorgabe und keine Meldung.

## Nachweis

`previews/AG-EVENT-JOURNAL-001/pruefen.js`: Teil **N**/**N2** am laufenden
Strom, Teil **A8** aus der Historie. 205 Prüfungen.

**Gegentest gelaufen.** Ohne die Weitergabe fallen **zehn** Zeilen durch —
fünf aus der Historie, fünf live. Beide Wege sind also wirklich abgedeckt und
nicht nur einer.

Eine Nebenbemerkung zum Aufbau der Fixtures, weil sie eine Lehre trägt: Die
Elternkette der Historie liegt bewusst **nicht** bei `forge`. Der Ringnachweis
in Teil J misst eine Aufgabe von forge, und `arbeitSchritt` fasst nur die
ersten vier Ringe je Rolle an. Eine fünfte Aufgabe bei forge hätte die Messung
still eingefroren — derselbe Fall, den die Voraussetzungszeile dort jetzt
benennt.
