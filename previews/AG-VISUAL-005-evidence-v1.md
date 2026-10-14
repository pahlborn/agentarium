# AG-VISUAL-005 – Das Feld. Vorarbeit, keine Agentenlieferung.

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
- **V2 (480 s, 65 Ereignisse).** 213 Stichproben: jemand arbeitet in 76 %
  der Zeit; Pausen über 4,5 Sekunden machen 43 % aus, und in **81 %** davon
  arbeitet jemand. Das restliche Fünftel ist echte Leere — an diesen Stellen
  wartet niemand auf irgendwen. Ob das eine Lücke in der Kausalkette des V2-
  Papiers ist oder eine Folge der 28-Sekunden-Deckelung in der Darstellung,
  ist **noch nicht entschieden**.
- V2 hat im Schnitt alle 7,4 Sekunden ein Ereignis, V1 alle 3,5. V2 ist zu
  drei Vierteln Warten. Das ist eine Eigenschaft der Daten, nicht der
  Darstellung.

## Zwei Befunde, die beim Bauen herausfielen

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

## Stand

| | |
|---|---|
| `AG-VISUAL-005-feld-v1.html` | SHA256 `e8dc44e94b9436aab0f5ee5effeee983dfb74695017aacdd583adacd4ef196d9` |
| Läuft | eigenständig, offline, ohne Abruf nach außen |
| Quellen | `AG-VISUAL-005-feld/` — `schicht.py` erzeugt die Darstellung, `resonanz-maschine.html` ist die Maschine darunter |

Die Maschine ist **Resonanz**, unverändert bis auf zwei Stellen, beide für
kurzlebige Teilchen: Korn war unbedingt weiß, jetzt hängt das Weiß an der
Hitze; und die Ein-/Ausblende war fest 0,6 s, jetzt ein Drittel der eigenen
Lebensdauer. Resonanz bleibt Resonanz — sie ist hier Ideengeber, nicht
Gegenstand.

## Offen

- Ob die Leerstellen in V2 Daten- oder Darstellungssache sind.
- Die Schnittstellen und Parameter, über die das echte System das Modell
  füttern würde.
- Ob diese Darstellung überhaupt der richtige Weg ist. Das entscheidet Peter.
