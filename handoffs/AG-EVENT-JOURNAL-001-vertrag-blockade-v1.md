# AG-EVENT-JOURNAL-001 — Blockade und Auflösung im Ereignisvertrag

Für jede Rolle, die Lebenszyklusereignisse auf Vorgang #2 legt. Beschrieben
ist der Stand von Fassung 64 / Adapter `AG-GH-LIVE-001-v1.5`; maßgeblich ist
der Quelltext in `pilot/github-live/github-live.js`, nicht diese Datei.

## Das zwölfte Feld

Der Vertrag hatte elf Pflichtfelder und zwei wahlfreie (`recipient`,
`reporter`). Dazu kommt ein drittes wahlfreies:

| Feld | Form | Wann |
|---|---|---|
| `blocker_id` | wie die übrigen Kennungen (`^[A-Za-z0-9][A-Za-z0-9._:/-]{0,119}$`) | **Pflicht** bei `blocked` und `resolved`, bei jeder anderen Art **verboten** |

**Warum Pflicht und nicht wahlfrei.** Atlas' Auftrag vom 21.10. verlangt:
„Auflösung betrifft genau diese Blockade." Eine Aufgabe kann mehrere Klemmen
tragen; ohne eigene Kennung müsste eine Auflösung sich eine aussuchen — die
älteste, die erste, die nächstbeste. Das wäre eine Rateentscheidung über
einen Zustand, und davon trifft der Monitor keine mehr. Lieber ein
abgewiesenes Ereignis mit genanntem Grund als eine aufgelöste Klemme, die
niemand gemeint hat.

**Warum bei anderen Arten verboten.** Ein `started` mit `blocker_id`
behauptete einen Bezug zu einer Blockade, den die Art nicht hergibt. Eine
mitgeführte Angabe ohne Bedeutung ist später nicht von einer mit Bedeutung zu
unterscheiden.

## Was eine Blockade tut — und was nicht

Eine Blockade ist **kein Zustand der Aufgabe, sie liegt neben ihm.**

- `zugewiesen` bleibt `zugewiesen`, `begonnen` bleibt `begonnen`.
- Die Aufgabe bleibt liegen: nichts wird geschlossen, nichts gezählt als
  erledigt, kein Ball wandert.
- Eine Auflösung nimmt genau eine Klemme weg und **behauptet keinen
  Arbeitsbeginn und keinen Abschluss.** Eine Aufgabe, die zugewiesen war und
  geklemmt hat, ist danach wieder bloß zugewiesen.

Der Grund für diese Bauart ist nicht Geschmack: Hätte `blockiert` den Zustand
überschrieben, müsste die Auflösung ihn wiederherstellen — und dabei raten,
was vorher stand.

**Eine Blockade ist kein Abbruch.** Die Abbruchzahl kommt weiter allein aus
`aborted`. Eine Blockade wartet auf etwas und kann sich auflösen; ein Abbruch
ist gescheitert und endet. Beide stehen in derselben Zeile der Tafel, aber als
zwei Zahlen.

## Wer melden darf

Dieselbe Regel wie beim Beginn: **Wer klemmt, sagt es selbst**
(`reporter === actor`). Atlas über Forge bleibt Beobachtung und legt keine
Klemme. `assigned` ist weiterhin die einzige Ausnahme, weil eine Vergabe
naturgemäß der Vergebende meldet.

## Was abgewiesen oder gezählt wird

| Fall | Folge |
|---|---|
| `blocked`/`resolved` ohne `blocker_id` | abgewiesen, Grund genannt |
| `blocker_id` an einer anderen Art | abgewiesen, Grund genannt |
| `blocked` zu einer unbekannten Aufgabenkennung | **keine** Aufgabe wird angelegt, Lücke gezählt |
| `resolved` zu einer unbekannten Klemme | **nichts** wird aufgelöst, Lücke gezählt |
| dieselbe `blocker_id` zweimal | wirkungslos (Transportduplikat) |
| Lieferung, während etwas klemmt | die Aufgabe endet samt Klemme; das ist **keine** Auflösung und wird auch nicht als eine gezählt |

Die Klemmenkennung gehört zum Fingerabdruck. Ohne sie wären zwei
verschiedene Klemmen derselben Aufgabe mit gleichem Titel und gleichem
Zeitstempel ein Duplikat — die zweite fiele lautlos weg.

## Projekt und Lauf trennen auch Klemmen

Die Identität einer Aufgabe ist `project_id + run_id + task_id`, nicht
`task_id`. Eine Klemme in Projekt A lässt dieselbe Aufgabenkennung in Projekt
B unberührt, und eine Auflösung in A trifft B nicht.

## Wiederherstellung

Was beim Verbinden offen war und geklemmt hat, klemmt nach dem Verbinden
weiter — mit derselben Kennung, damit ein späteres `resolved` sie trifft.
Gefaltet wird nur vorwärts: Eine Klemme **nach** einem Abschluss ist ein
Widerspruch in den Daten und wird als solcher gezählt, nicht als
Wiedereröffnung.

## Was im Bild davon zu sehen ist

Peters Entwurf vom 21.10., wörtlich: „einen kleinen resonanz-effekt am
agenten selbst, damit man sehen kann, dass etwas 'klemmt'. nachsehen kann man
dann in der liste." Dazu: „es soll aber jetzt nicht alles zu unübersichtlich
werden."

Also keine neue Gestalt, keine neue Farbe, kein neuer Leuchtpunkt — nur die
Bewegung des Rings, den es schon gibt:

| Wo | Was |
|---|---|
| am Agenten | der Ring der geklemmten Aufgabe **stockt gegen seine Richtung** statt zu kreisen; der Herzschlag der Arbeit bleibt aus |
| am Schild | „arbeitet · 01:23 · 2 Aufträge · 1 klemmt" |
| im Block mit den Aufgaben | die Zeile „blockiert" zählt sie mit |
| in der Liste | die Zeile nennt **welche** Klemme, samt Aufgabe und Beleg |

Der Unterschied ist auch im Ruhefall sichtbar: `zugewiesen` steht still,
`zugewiesen und geklemmt` steht still **und** zuckt.

## Nachweis

`previews/AG-EVENT-JOURNAL-001/pruefen.js`, Teile A5 (Klemmen aus der
Historie), F (Blockade ist kein Abbruch), J/J2/J3 (am laufenden Strom, was
abgewiesen wird, Projekttrennung). Der Ringeffekt wird am Winkel gemessen,
mit Gegenprobe an einem laufenden Ring.

**Nicht belegt:** eine Abnahme am iPad. Das entscheidet Peter.
