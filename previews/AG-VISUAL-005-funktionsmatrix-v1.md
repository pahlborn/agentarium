# AG-VISUAL-005 – Funktionsmatrix

> AGENTARIUM – See intelligence move. Powered by BALL

Was das Feld heute kann, woraus es das nimmt, und was davon im Produktivbetrieb
anders sein muss. Entwurf zur Besprechung; nichts davon ist freigegeben.

---

## 1. Die vier Stellen, an denen das Stück in die Zukunft sieht

Das Wichtigste zuerst, weil es den Unterschied zwischen Prototyp und
Produktivbetrieb bestimmt. Die heutige Darstellung setzt ein **abgeschlossenes
Drehbuch** voraus — eine Liste von Ereignissen, deren Ende bekannt ist. Live
gibt es das nicht. Vier Stellen hängen daran:

| Stelle | was sie tut | warum sie live nicht geht |
|---|---|---|
| `flugdauer()` | kürzt den Flug einer Aufgabe, damit der Empfänger sie in der Hand hat, bevor er sie weitergibt | sie **durchsucht die restliche Ereignisliste** nach dem nächsten Zug des Empfängers |
| Ausklang-Auslöser | beginnt, wenn alle Ereignisse gespielt sind **und** `dauer + 3` vorbei ist | live ist nie „alles gespielt", und `dauer` ist unbekannt |
| Die Uhr | zeigt `min(zeit, dauer)` | live läuft die Uhr der Wirklichkeit, ohne Deckel |
| Fortschrittsbalken | füllt sich gegen `umfang` | live kommt der Umfang aus dem Rückstand und **ändert sich** |

`flugdauer()` ist der einzige echte Umbau. Live müsste die Flugzeit aus der
Entfernung und einer festen Geschwindigkeit kommen — und wenn der Empfänger
schneller weitergibt, als die Darstellung ihn ankommen lässt, muss sie den
Flug abschneiden statt ihn vorher zu planen. **Darstellung darf nicht wissen,
was noch kommt.**

---

## 2. Betriebsarten

| | **Prototyp** | **Produktiv V1** |
|---|---|---|
| Datenquelle | Datei mit abgeschlossener Ereignisliste | Strom aus dem laufenden Projekt |
| Zeit | Stückzeit, beschleunigt oder gerafft | Wirklichkeit, mit Verzögerung |
| Ende | nach `dauer`, dann Ausklang, dann von vorn | kein Ende; Ausklang bei Leerlauf, kein Neubeginn |
| „Von vorn" | ja — das Stück ist eine Aufführung | **nein** — es gäbe nichts, wohin zurück |
| „Halt" | ja — hält das Stück an | **ja, aber anders**: hält die *Ansicht* an, nicht das Projekt. Ereignisse laufen weiter auf und holen beim Fortsetzen auf |
| Projektwahl | zwischen mitgelieferten Stücken | zwischen laufenden Projekten |
| Rückblick | das ganze Stück ist Rückblick | braucht eine eigene Funktion (siehe 5) |

**Zur Frage nach den Knöpfen:** „Von vorn" fällt weg. „Halt" bleibt, bedeutet
aber etwas anderes und sollte dann auch anders heißen — **„Anhalten"** gegen
**„Weiter, und aufholen"**. Ein Betrachter, der etwas genauer ansehen will,
darf den Strom anhalten; das Projekt läuft derweil weiter, und das muss man
ihm ansehen (etwa: „3 Ereignisse warten").

---

## 3. Der Ablauf im Produktivbetrieb

Nach Peters Beschreibung:

```
Peter beauftragt Atlas          → der Ball wird eingeworfen
Atlas verteilt                  → Stücke vom Ball an die Fachagenten
Fachagenten liefern, fragen,
  widersprechen                 → hin und her, Ergebnisse auf den Tisch
Archibald schärft               → Spezifikation
Forge baut                      → ab hier läuft der Entwicklungsprozess
Sentinel prüft, Argus bewertet  → Abnahme oder Rückläufer
Peter entscheidet               → Freigabe oder neue Runde
```

Das deckt sich mit dem, was die Darstellung heute zeigt — mit einem
Unterschied: Im Prototyp ist das **eine** Runde mit bekanntem Ende. Produktiv
ist es eine Schleife ohne Ende, und der Ball wechselt die Hände, solange das
Projekt läuft.

---

## 4. Was das Feld heute zeigt

Jede Zeile nennt das Datenfeld, aus dem sie lebt. Was kein Feld hat, ist
geraten — und genau das zählt die Darstellung inzwischen mit.

### Nachrichten

| Funktion | Datenfeld | Prototyp | Produktiv |
|---|---|---|---|
| Nachricht fliegt von A nach B | `von`, `an`, `art` | ✓ | ✓ |
| Vier Ausgänge: bleibt · verblasst · nichts · verworfen | `art` → Mappingtabelle | ✓ | ✓ |
| Aufspaltung in mehrere Folgen | `folgen` | ✓ | ✓ |
| Größe der Aufgabe | `gross` | ✓ | ✓ |
| Kurzbefehl an der Nachricht | `kommando` | ✓ | ✓ |
| Flugdauer | **berechnet, blickt voraus** | ✓ | **Umbau nötig** |

### Der Ball

| Funktion | Datenfeld | Prototyp | Produktiv |
|---|---|---|---|
| Ein Ball, wandert | `art: request/handoff`, `gross > 0,85` | ✓ | ✓ |
| Stücke werden abgeworfen | `gross ≤ 0,85` | ✓ | ✓ |
| Ball bleibt am Ende liegen, wo er ist | — | ✓ | ✓ |

### Arbeit und Zeit

| Funktion | Datenfeld | Prototyp | Produktiv |
|---|---|---|---|
| Ringe je offenem Auftrag | Ankunft eines Balls | ✓ | ✓ |
| „arbeitet · mm:ss" | `t` der Vergabe | ✓ | ✓ |
| „die anderen warten" nach 4,5 s Stille | — | ✓ | ✓ |
| Dauer je erledigtem Auftrag | `t` Vergabe → `t` Lieferung | ✓ | ✓ |
| Acht Arbeitsweisen je Rolle | `weise` in der Rollentabelle | ✓ | ✓ |

### Stops

| Funktion | Datenfeld | Prototyp | Produktiv |
|---|---|---|---|
| Stop mit Klasse und Grund | `art: stop`, `klasse`, `text` | ✓ | ✓ |
| technisch · budget · abhaengigkeit · freigabe · mensch | `klasse` | ✓ | ✓ |
| Grund auf Zeigen oder Antippen | `text` | ✓ | ✓ |
| Stops bleiben als Rückstand stehen | — | ✓ | ✓ |
| Auflösung | `art: resume` oder `answer`/`decision` | ✓ | ✓ |

### Kosten und Modelle

| Funktion | Datenfeld | Prototyp | Produktiv |
|---|---|---|---|
| Modell je Auftrag | `modell`, sonst Plattform der Rolle | ✓ | ✓ |
| Kosten je Agent | `kosten`, `tokens`, `quelle` | erfunden | echt |
| Unterscheidung „keine Angabe" ≠ null | `kosten` fehlt | ✓ | ✓ |
| Status der Kostenbasis | gezählt | ✓ | ✓ |
| **Keine Gesamtsumme bei Lücken** | AG-COST-UI-001 / K07 | ✓ | ✓ |

### Bezüge

| Funktion | Datenfeld | Prototyp | Produktiv |
|---|---|---|---|
| Welcher Auftrag endet | `erledigt` / `aufgabe` | ✓ (V2) | ✓ |
| Welches Ergebnis wird geprüft | `prueft`, `version` | ✓ (V2) | ✓ |
| Worauf bezieht sich ein Widerspruch | `prueft` / `ersetzt` | ✓ (V2) | ✓ |
| Welche Frage wird beantwortet | `antwortet_auf` | ✓ (V2) | ✓ |
| **Zähler: wie oft wurde geraten** | — | ✓ | ✓ |

### Stand und Produkt

| Funktion | Datenfeld | Prototyp | Produktiv |
|---|---|---|---|
| offen · Prüfung · blockiert · fertig | laufend gezählt | ✓ | ✓ |
| Fortschrittsbalken | `umfang` | ✓ | **Umfang ändert sich** |
| Projektname, Beschreibung, Ablage | `projekt`, `titel`, `beschreibung`, `ablage` | ✓ | ✓ |

---

## 5. Was ein Zuschauer sich wünschen würde

Vorschläge, nicht gebaut. Geordnet danach, was ein Betrachter zuerst vermisst.

| | Funktion | warum | Aufwand |
|---|---|---|---|
| 1 | **Anhalten und genauer ansehen**, mit Hinweis, wieviel inzwischen aufgelaufen ist | live ist die einzige Möglichkeit, etwas zu lesen, bevor es weiterzieht | klein |
| 2 | **Zurückspulen** auf den Stand vor N Minuten | „was ist passiert, während ich weg war" | mittel — braucht ein Ereignisarchiv |
| 3 | **Einen Agenten anwählen** und nur seinen Strang sehen | neun gleichzeitig ist viel | mittel |
| 4 | **Einer Aufgabe folgen** — alles zu `AG-V2-007` hervorheben, der Rest verblasst | genau das, was die Bezüge erst möglich machen | mittel, setzt Abschnitt „Bezüge" voraus |
| 5 | **Warnung bei Stillstand** — niemand arbeitet, nichts kommt, seit X Minuten | im Produktivbetrieb der eigentliche Alarm | klein |
| 6 | **Budget im Blick** — was heute verbraucht wurde, gegen das, was gesetzt ist | hängt an K07: erst zeigen, wenn die Basis vollständig ist | klein, Daten fehlen |
| 7 | **Mehrere Projekte nebeneinander** | Atlas führt nicht nur eines | groß |
| 8 | **Ton** — ein leiser Anschlag bei Abnahme, ein anderer bei einem Stop | man sieht nicht hin, man hört hin | klein |
| 9 | **Ruhemodus** für den Dauerbetrieb am Monitor: dunkler, weniger Bewegung, Stops bleiben hell | ein Bild, das acht Stunden läuft, darf nicht acht Stunden zappeln | klein |
| 10 | **Vollbild ohne Bedienung** | es ist ein Monitor, kein Werkzeug | klein |

---

## 6. Was offen ist

- Ob die Feldnamen der Bezüge dem entsprechen, was das Partitur-Arbeitsprotokoll
  tatsächlich führt. Ohne ein echtes Beispiel sind sie geraten.
- Die Schnittstelle selbst: Push oder Abruf, Ereignis einzeln oder Stapel,
  Reihenfolge garantiert oder nicht, was bei Nachzüglern geschieht.
- Ob im Produktivbetrieb überhaupt ein Neubeginn vorkommt — oder ob das Feld
  einfach weiterläuft, bis jemand es schließt.
- Das Produkt. Getrennt zu besprechen.
