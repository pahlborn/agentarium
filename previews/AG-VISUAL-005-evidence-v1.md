# AG-VISUAL-005 – Das Feld. Vorarbeit, keine Agentenlieferung.

> AGENTARIUM – See intelligence move. Powered by BALL

Eine Darstellung des Kommunikationsgeflechts: Wer wirft wem was zu, was davon
bleibt, was verblasst, was spurlos verschwindet — und was am Ende fertig ist.

## Was das hier NICHT ist

Das muss zuerst stehen, weil das Regelwerk es verlangt und weil die
Geschwisterdokumente in diesem Ordner etwas ganz anderes belegen als dieses.

- **Keine dispatchte Agentenarbeit.** Kein `technical_id`, keine `run_id`,
  keine `session_id`, keine Modellangabe, keine unabhängige Laufzeitevidenz.
  Es gab keinen Archibald, keinen Forge, keinen Sentinel, keinen Argus an
  dieser Sache. Ein Rollenname wäre hier kein Beleg für einen geladenen
  Agenten — es ist schlicht keiner gelaufen.
- **Keine Abnahme, keine Freigabe, kein Merge-Vorschlag.** Der Pull Request
  ist ein Entwurf. Peter entscheidet, ob daraus etwas wird und gegen welchen
  Zweig.
- **Keine Kostenevidenz.** Die Beträge, die das Stück anzeigt, sind
  **erfunden** — auf Peters ausdrückliche Erlaubnis für dieses Testprojekt.
  Nach AG-COST-UI-001 sind erfundene Mockdaten keine tatsächlichen Kosten.
  Das Stück zeigt deshalb an keiner Stelle eine Gesamtsumme, kennzeichnet
  jeden Betrag als geschätzt und unterscheidet sichtbar zwischen „keine
  Angabe" und null.

Was es ist: visionäre Vorarbeit zwischen Peter und einer Claude-Code-Sitzung,
bewusst agnostisch gehalten. Die Schnittstellen, über die das echte System
dieses Modell später füttern würde, sind noch nicht festgeschrieben.

## Woher die Daten stammen

| Datei | Herkunft |
|---|---|
| `AG-VISUAL-005-feld/ereignisse-v1.json` | abgeleitet aus `fixtures/AG-FICTION-001-nachtpost-v1.json`; Zeiten, Kausalität und Kostenfelder sind ergänzt |
| `AG-VISUAL-005-feld/ereignisse-v2.json` | **vollständig abgeleitet** aus `concepts/AG-FICTION-001-nachtpost-v2.md`. Das Papier hält ausdrücklich fest, dass es noch kein ausführbares Ereignisfixture gibt. Zeiten und Kausalität sind daher meine Konstruktion, nicht die des Teams. |
| Rollen, Plattformen, Kennungen | `relay/role-routing.json`, unverändert übernommen |

Beide Zweige liegen nur auf `feature/visual-stage-v0`; `main` kennt die
NACHTPOST-Konzepte nicht. Deshalb setzt dieser Zweig auf
`feature/visual-stage-v0` auf.

## Das Gesetz der Darstellung

Vier Ausgänge, und sie sehen verschieden aus, weil sie verschieden sind:

| | Niederschlag | Nachhall | Arten |
|---|---|---|---|
| **bleibt** | 4,0 | 2,4–2,6 s | artifact, decision, test_result, review_result |
| **verblasst** | 0 | 3,0–3,8 s | request, handoff, answer, contribution, proposal, recommendation |
| **nichts** | 0 | 0,8–1,1 s | question, objection, change_request, defect, open_state |
| **verworfen** | – | – | fährt von außen auf einen Punkt zu und ist dann fort |

Nachgemessen im Browser, in Helligkeitswerten von 255: `bleibt` liegt nach
dem Stück bei 154 bis 246 und vergeht nicht mehr. `verblasst` ist sichtbar
da und danach bei 0. `nichts` erreicht nie einen Wert über 0.

## Was gemessen wurde

Alles im echten Browser (Chromium, Playwright), nicht geschätzt.

- **V1 (120 s, 34 Ereignisse).** Vier Lücken ab sechs Sekunden, zusammen
  31 Sekunden = 26 % des Stücks. In **allen vieren** arbeitet jemand. Die
  Totzeit ist also keine Stille, sondern Wartezeit auf einen Arbeitenden.
- **V2 (480 s, 65 Ereignisse).** 213 Stichproben über t=0 bis 425: jemand
  arbeitet in 76 % der Zeit; Pausen über 4,5 Sekunden machen 43 % aus, und
  in **81 %** davon arbeitet jemand. Das restliche Fünftel war zum Teil eine
  Folge der Deckelung — siehe den eigenen Abschnitt weiter unten.
- V2 hat im Schnitt alle 7,4 Sekunden ein Ereignis, V1 alle 3,5. V2 ist zu
  drei Vierteln Warten. Das ist eine Eigenschaft der Daten, nicht der
  Darstellung.

## Die 28-Sekunden-Deckelung — entschieden und entfernt

`arbeitSchritt` beendete eine Arbeitssitzung nach 28 Sekunden. Nachgemessen,
bevor entschieden wurde, wie lange ein Auftrag wirklich dauert:

| | gelieferte Aufträge | kürzester | Mitte | längster | über 28 s |
|---|---|---|---|---|---|
| V1 | 9 | 3 s | 15 s | 70 s | 4 |
| V2 | 19 | 5 s | **40 s** | 352 s | 12 |

In V2 lag die mittlere Dauer über dem Deckel. Er war kein Riegel für
Ausnahmen, sondern traf den Normalfall — und er traf zweimal daneben:

- Er maß `S.t`, das Alter der **Sitzung**, nicht das des Auftrags. Wer um
  Sekunde 10 einen Auftrag bekam und um Sekunde 30 einen zweiten, verlor um
  Sekunde 38 beide.
- Nach dem Abräumen fand die spätere Lieferung keine offene Sitzung mehr vor
  und buchte nichts — weder Kosten noch Eintrag. In V1 traf das vier
  Lieferungen, in V2 neun. Forge wurde bei t=81 abgeräumt und lieferte bei
  t=82.

Der Schaden in Zahlen; Modellrechnung und Browser stimmen überein:

| | mit Deckel | ohne Deckel | in den Daten vorhanden |
|---|---|---|---|
| V1 | USD 1,0055 (6 Aufträge) | USD 4,0247 (9) | USD 4,9827 |
| V2 | USD 5,0892 (12 Aufträge) | USD 9,6087 (19) | USD 12,6253 |

Die Anzeige verschluckte 63 % der Kosten in V1 und 43 % in V2 — und sah
dabei aus, als wären die Daten lückenhaft. Genau die Verwechslung, gegen die
AG-COST-UI-001 geschrieben ist.

Peters Entscheidung: kein Zeitdeckel. Ein Auftrag endet, wenn er geliefert
wird, oder mit dem Stück. Was die Daten nie abschließen — vier Aufträge in
V1, sechs in V2 — läuft sichtbar weiter („arbeitet · 03:20"), statt
stillschweigend zu verschwinden.

Dieselbe stille Stelle gab es ein zweites Mal: `S.liste` warf den ältesten
Auftrag weg, sobald mehr als vier offen waren, mitsamt seiner Buchführung.
Jetzt bleiben alle in der Liste; gezeichnet werden höchstens vier Ringe.

## Das Produkt

Drei Versuche, es im Feld zu zeichnen — eine Spirale, eine Silhouette auf
einem Boden, ein eingerahmter Ort außerhalb des Kreises — und alle drei
verworfen. Jeder reparierte etwas und machte etwas Neues kaputt; der letzte
lag unleserlich unter einem Knäuel Fäden, weil alles daran aus Teilchen
gebaut war. Peters Entscheidung: nur Schrift und ein waagerechter
Fortschrittsbalken, beides HTML. Was aus Schrift besteht, kann nicht
fusseln.

## Vier Befunde, die beim Bauen herausfielen

**Eine Zahl, die zwei Dinge steuert, lässt sich für das eine nicht ändern,
ohne das andere mitzuverstellen.** Das Feld `abgabe` sagt, wieviel eine
Nachricht im Niederschlag hinterlässt. Dieselbe Zahl wurde ein zweites Mal
als Wirbelstärke benutzt. Als `abgabe` für `bleibt` von 1,0 auf 4,0 musste —
sonst verschwand ein Beschluss im Nichts, gemessen drei von 255 statt
zweihundert —, stieg die Wirbelstärke still von 0,92 auf 2,42 mit. Die
Wachheit des Feldes folgt dem größten Wirbel und multipliziert die Deckkraft
jedes einzelnen Fadens; nach jedem angenommenen Ergebnis stand deshalb das
halbe Bild in Strähnen. Behoben durch Deckelung, die beiden Verwendungen sind
wieder getrennt.

**Ein Strang wird als Linie von der alten zur neuen Lage gezeichnet.** Fäden
ohne Geschwindigkeit ergeben Linien der Länge null. Ein ganzer Rahmen war so
über eine Stunde lang vorhanden und unsichtbar.

**Eine Variable außerhalb ihres Bereichs fror das ganze Stück ein.** Zwei
Zeilen für den Ausklang griffen in `schritt` auf `K` zu — den Wirbel einer
einzelnen Nachricht, der nur in `wirf()` existiert. Vom ersten Bild des
Ausklangs an flog ein ReferenceError: Die Uhr blieb bei 123,0 stehen, das
Stück lief nie weiter, auch nicht zum Neubeginn. Dass es unentdeckt blieb,
lag am Prüflauf selbst — er gab die Fehlerliste erst am Ende aus, und ein
Ende gab es nicht mehr. Die Prüfung hing an derselben Stelle wie der Fehler,
den sie finden sollte. Seither wird jeder Fehler sofort mitgeschrieben, und
die Wachheit hält ein eigener Hahn in der Maschine (`__wachHalten`), dort wo
sie lebt.

**Das Feld wusste nichts davon, dass daneben etwas steht.** Der Kreis saß bei
einem festen Anteil der Breite; auf dem iPad überlagerten sich Liste und
Geschehen. Jetzt wird das freie Band zwischen den Tafeln gemessen und der
Radius daraus abgeleitet. Nachgeprüft mit Rechtecken auf drei Schirmgrößen,
keine Überlagerung.

## Stand

| | |
|---|---|
| `AG-VISUAL-005-feld-v1.html` | SHA256 `fc0b9094ed49ccfcd5406799a9981987d7c8c3e85117cce81f7c7c615d41698d` |
| Läuft | eigenständig, offline, ohne Abruf nach außen |
| Quellen | `AG-VISUAL-005-feld/` — `schicht.py` erzeugt die Darstellung, `resonanz-maschine.html` ist die Maschine darunter |

Die Maschine ist **Resonanz**, unverändert bis auf zwei Stellen, beide für
kurzlebige Teilchen: Korn war unbedingt weiß, jetzt hängt das Weiß an der
Hitze; und die Ein-/Ausblende war fest 0,6 s, jetzt ein Drittel der eigenen
Lebensdauer. Resonanz bleibt Resonanz — sie ist hier Ideengeber, nicht
Gegenstand.

## Offen

- Die letzten 12 % der V2-Messung (t=425 bis 480).
- Die Haare vorher/nachher mit Zahlen statt mit Augenmaß. Die erste Messung
  war unbrauchbar: Die Fläche läuft mit `preserveDrawingBuffer: false`, also
  liest `readPixels` nach dem Darstellen überall null — auch mitten im
  vollen Bild.
- Die Länge des Ausklangs (29 Sekunden). Wird getrennt besprochen.
- **K07 gegen die Kostenanzeige.** `AG-MOCK-COMPARE-001` hält fest: Bei
  unvollständiger Kostenbasis ist eine Kostenanzeige unerwünscht;
  Einzelwerte gehören ins interne Register. Diese Fassung zeigt Einzelkosten
  je Agent mit gekennzeichneten Lücken und verzichtet nur auf die
  Gesamtsumme — das geht über K07 hinaus und ist mit Peter zu klären.
- Die Schnittstellen und Parameter, über die das echte System das Modell
  füttern würde. Randbedingung von Peter: Es darf nichts gebaut werden, was
  sich nicht von außen über eine Schnittstelle bedienen lässt.
- Ein Takt für das Stück — auf dem Rückstand, nicht vor einer ersten
  funktionsfähigen Fassung.
- Ob diese Darstellung überhaupt der richtige Weg ist. Das entscheidet Peter.
