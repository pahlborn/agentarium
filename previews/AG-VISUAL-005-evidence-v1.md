# AGENTARIUM – Das Feld. Vorarbeit, keine Agentenlieferung.

AG-VISUAL-005, Belegversion 1 · 2026-10-15
Projekt: pahlborn/agentarium · Branch: claude/agentarium-visualisierung
Status: Belege und offene Punkte zum Feld. Keine Freigabe, keine Abnahme.
Vorgänger: keiner.
Fassungsregister: `previews/AG-VISUAL-005-fassungen.md`.

> AGENTARIUM – See intelligence move. Powered by BALL
>
> **BALL — Bio-Agent & LLM Logistics.** Agentarium ist die sichtbare Welt
> des Teams; BALL die Orchestrierung dahinter: Aufgaben, Zustände und
> Übergaben zwischen Mensch und LLM-Agenten. Der sichtbare Ball greift
> zugleich die Frage auf: „Bei wem liegt gerade der Ball?"
>
> Peter, 11. Oktober 2026. Die Auflösung stand bis heute an keiner Stelle
> im Vorrat — siebenmal BALL in den Anforderungen, einmal im Team-Brief,
> zweimal in alten Mustern, nie erklärt.

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
- **V2 (480 s, 70 Ereignisse), vollständig durchgemessen.** 430
  Stichproben über das ganze Stück, nach Entfernen der Deckelung: jemand
  arbeitet in **97 %** der Zeit; Pausen über 4,5 Sekunden machen 46 % aus,
  und in **96 %** davon arbeitet jemand. Längste Stille: 24,9 s.

  Die frühere Zahl war 81 %, gemessen mit der 28-Sekunden-Deckelung. Das
  „restliche Fünftel echte Leere" gab es nicht — es waren Agenten, die noch
  arbeiteten und vom Deckel abgeräumt worden waren. Peters Annahme, hinter
  jeder Pause stecke jemand, der arbeitet, trifft damit praktisch
  vollständig zu; die 4 % sind der Schwanz nach dem letzten Ereignis.
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

## Stops haben eine Klasse

Bisher kannte das Feld eine Sorte Stop: „wartet auf eine Antwort", ausgelöst
durch eine Frage, aufgelöst durch eine Antwort. Ein abgestürzter Agent und
ein geschlossener Kanal sind etwas anderes — sie lösen sich nicht dadurch,
dass jemand antwortet. Ein Stop trägt deshalb eine Klasse aus den Daten:

```
art:    stop | resume
an:     wen es trifft
klasse: technisch | budget | abhaengigkeit | freigabe | mensch
text:   der Grund im Klartext
```

Fehlt die Klasse, gilt `unbekannt`, und das ist sichtbar. Die alten Auslöser
(`question`, `open_state`) gelten weiter als `abhaengigkeit`, damit
bestehende Daten nicht umgestellt werden müssen. Ein Schild über dem Platz
nennt Klasse und Dauer; Zeigen oder Antippen öffnet den Grund samt der
Erklärung, was die Klasse bedeutet und was sie auflöst — antippen, weil es
auf einem iPad kein Mouseover gibt.

Zur Vorführung liegen erfundene Ereignisse mit dem Präfix `DEMO-` in beiden
Datensätzen; sie gehören nicht zum abgeleiteten Fixture.

## Durchgängige Bezüge — gemessen, was sie bringen

Peters Befund: Im Feld-Szenario haben die Ereignisse eigene IDs, aber keine
durchgängige Zuordnung zu Aufgabe, Ergebnis und geprüfter Version. Ohne die
entscheidet die Darstellung nach Faustregeln. Gezählt wurde, wie oft dabei
überhaupt etwas zu wählen war:

| Entscheidung | Faustregel | V1 | V2 |
|---|---|---|---|
| Welcher Auftrag endet? | der älteste offene | 1 von 9 (11 %) | 8 von 19 (42 %) |
| Welches Ergebnis nimmt das Review ab? | das älteste auf dem Tisch | 2 von 2 (**100 %**) | 4 von 4 (**100 %**) |
| Worauf bezieht sich ein Widerspruch? | das neueste auf dem Tisch | 3 von 4 (75 %) | 9 von 9 (**100 %**) |
| Welche Frage beantwortet die Antwort? | die des Empfängers | 0 von 3 | 0 von 3 |
| **zusammen** | | **6 von 18 (33 %)** | **21 von 35 (60 %)** |

Eingebaut sind deshalb sieben freiwillige Felder: `aufgabe`, `erledigt`,
`artefakt`, `version`, `prueft`, `antwortet_auf`, `ersetzt`. Fehlt eines,
gilt die bisherige Faustregel — bestehende Daten müssen nicht umgestellt
werden. Und jede Faustregel, die greift, obwohl mehr als eine Möglichkeit
offen stand, wird **gezählt**; die Zahl steht im „Gesetz" der laufenden
Fassung. Damit ist Peters Schlusssatz — die IDs allein machen die
Darstellung nicht zuverlässiger, entscheidend ist, dass die Abläufe sie
verwenden — nachprüfbar statt Absichtserklärung.

Gegenprobe im Browser, V2 mit konstruierten Bezügen (25 Aufgaben, 8
Artefakte mit Fassungen, 19 ausdrückliche Abschlüsse, 13 Prüfbezüge, 3
Antwortbezüge, 6 nie geschlossene Aufgaben):

| | geraten |
|---|---|
| V1, ohne Bezüge, ganzes Stück | 2 |
| V2, mit Bezügen, ganzes Stück | **0** |

Die Bezüge in V2 sind **konstruiert, nicht erhoben**. V2 ist ohnehin eine
Ableitung aus dem Konzeptpapier; die Struktur zeigt, was die Bezüge
bewirken, und behauptet nicht, dass das echte System sie so liefert.

Der erste Lauf zeigte 8 statt 0 — alle bei „welcher Auftrag endet", obwohl
in den Daten für jede Lieferung ein `erledigt` stand. Die Aufgaben-ID flog
nicht mit: `arbeitAn` liest sie vom Ball, und der trug sie nicht. Die
Felder waren da, die Übergabe fehlte. Genau der Fall, vor dem Peters
Schlusssatz warnt — und ohne diesen Zähler wäre er unbemerkt geblieben.

## Der Ausklang

Vorher war er ein Wecker: sechs Dinge im selben Bild und danach
sechsundzwanzig Sekunden, in denen nichts mehr geschah. Jetzt ein Ablauf mit
Reihenfolge, achtzehn Sekunden lang, nach Peters Vorgabe:

```
 0 s  die Arbeit hoert auf
 2 s  der Tisch raeumt sich, das aelteste zuerst
 4 s  das Feld beginnt zu vergehen
 6 s  das Fertige leuchtet auf
 9 s  alle treten in Rufbereitschaft
11 s  die Liste verblasst
18 s  von vorn
```

Zwei Behauptungen sind dabei weggefallen.

**Der Ball wird nicht mehr nach Hause geworfen.** In V1 heisst das letzte
Ereignis woertlich „Kein Abschluss", in V2 bleiben sechs Aufgaben offen. Ihn
trotzdem zurueckzuspielen haette eine Ablieferung behauptet, die nicht
stattgefunden hat. Er liegt jetzt, wo die Daten ihn gelassen haben — in V1
bei Peter, weil E30 ihn dorthin zurueckgibt, und das steht dann in den Daten
und nicht in der Regie.

**Die Stopper werden nicht mehr geloescht.** Was blockiert war, liegt im
Rueckstand und bleibt sichtbar stehen; dass danach neu begonnen wird, ist
genau das — sie werden aufgegriffen.

Dazu ein Komet, der gelegentlich den Schirm kreuzt. Er gehoert keinem
Agenten, traegt keine Nachricht und hinterlaesst nichts im Niederschlag — das
Einzige im Stueck, das von ausserhalb der Sache kommt. Er saet ueber die
zurueckgelegte Strecke statt einmal je Bild: Der erste Versuch ergab auf
einem langsamen Rechner eine Punktreihe und auf einem schnellen einen
dichten Strich, das Aussehen hing also an der Bildrate statt am Kometen.

Nachgemessen: jede Stufe greift in der vorgesehenen Reihenfolge, der Ball
bleibt liegen, beide Stopper stehen bis zum Schluss, die Liste verblasst,
der Balken leuchtet, Neubeginn nach 20 s statt nach 29. Keine Fehler.

## Das Produkt

Drei Versuche, es im Feld zu zeichnen — eine Spirale, eine Silhouette auf
einem Boden, ein eingerahmter Ort außerhalb des Kreises — und alle drei
verworfen. Jeder reparierte etwas und machte etwas Neues kaputt; der letzte
lag unleserlich unter einem Knäuel Fäden, weil alles daran aus Teilchen
gebaut war.

Der Grund für das Scheitern war nicht die Form. **Das Produkt ist das
einzige Ding in diesem Bild, das es woanders gibt.** Alles andere im
Agentarium ist ein Ereignis — eine Übergabe, eine Prüfung, ein Stop; das
passiert, und darum lässt es sich zeigen. Das Produkt passiert nicht, es
liegt: im Repository, auf einem Server, in einer Datei. Die Daten enthalten
nicht das Produkt, sondern Ereignisse ÜBER das Produkt.

### Der Nenner war falsch, nicht ungenau

Der Balken zeigte „4 von 21": vier ABNAHMEEREIGNISSE gegen einundzwanzig
STORYIDEEN. Zwei verschiedene Einheiten. Peters eigener Satz dazu:
„Fertig-Zähler steigen durch Ereignisse → Fortschritt entsteht aus
tatsächlich erfüllten Aufgaben und Abnahmekriterien."

Jetzt stehen auf beiden Seiten Aufgaben: eröffnete gegen abgeschlossene,
beide aus dem laufenden Geschehen gezählt. Jede Ankunft eines Balls eröffnet
eine, jede Lieferung schließt eine — das geht mit und ohne Aufgaben-IDs und
im laufenden Betrieb, weil der Nenner mitwächst. Dass er wächst, ist die
Wahrheit: Ein Projekt bekommt Arbeit dazu.

`umfang` bleibt sichtbar, aber als das, was es ist: „laut Konzept 21 · 7
Stränge · 21 Storyideen" — eine Angabe aus dem Papier, nicht der Stand der
Arbeit.

### Das Register

Durch die Artefakt-Bezüge ist das Produkt aufzählbar: Kennung, Fassung,
Zustand. Es zeigt etwas, das kein Zähler zeigen kann — **eine Fassung v2 ist
der sichtbare Beweis einer Überarbeitung.**

Gemessen im Browser:

| | Aufgaben | Register | geraten |
|---|---|---|---|
| V1 bei t=110 | 9 von 13 | 4 Einträge, alle „ohne Kennung" | 2 |
| V2 bei t=300 | 14 von 18 | ART-01 … ART-06, mit Fassung und Zustand | 0 |

Wo die Daten keine Kennung liefern, steht „ohne Kennung" statt einer
Erfindung. In meinen konstruierten V2-Daten kommt keine einzige
Überarbeitung vor — acht Artefakte, alle v1. Das ist ein Mangel meiner
Konstruktion, nicht der Wirklichkeit.

Peters Entscheidung zur Form: nur Schrift und ein waagerechter
Fortschrittsbalken, beides HTML. Was aus Schrift besteht, kann nicht
fusseln.

## Eine Berichtigung: die Deckelung war nicht die Ursache der Strähnen

Zwischendurch stand im Bild sehr viel stehendes Fadenwerk. Ich hatte die
Ursache benannt — `abgabe` steuerte zwei Dinge zugleich, Niederschlag UND
Wirbelstärke, und mit dem Sprung von 1,0 auf 4,0 war die Wirbelstärke still
von 0,92 auf 2,42 mitgestiegen. Die Rechnung stimmt. Der Schluss daraus
nicht.

Nachgemessen, drei Bauten mit festgenageltem Zufallskeim, gemessen als
Anteil sichtbarer Bildpunkte auf Schirmbildern (nicht mit `readPixels` —
die Fläche läuft mit `preserveDrawingBuffer: false` und liefert nach dem
Darstellen überall null; die erste Messung las deshalb ein volles Bild als
dunkel):

| | sichtbare Fläche | gegen A |
|---|---|---|
| A Produkt aus Teilchen, keine Deckelung | 6,3 % | — |
| B ohne Teilchen-Produkt, keine Deckelung | 5,1 % | −19,0 % |
| C ohne Teilchen-Produkt, mit Deckelung | 4,7 % | −25,7 % |

**74 % des Rückgangs entfallen auf das Teilchen-Produkt, 26 % auf die
Deckelung.** Die eigentliche Quelle der Strähnen war also der Umriss aus
Fäden — rund hundert Saataufrufe je Bild für Boden, Rahmen und Gebäude —,
nicht die Wirbelstärke. Die Deckelung bleibt richtig, weil zwei Bedeutungen
in einer Zahl eine Falle sind; als Erklärung für das, was Peter gesehen hat,
war sie zu drei Vierteln falsch.

Die Lehre ist dieselbe wie bei der Einfrierung: Eine Rechnung, die stimmt,
ist noch kein Beleg dafür, dass sie auch wirkt.

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
| `AG-VISUAL-005-feld-v1.html` | SHA256 `5dd24ad3ba1ff7d43d339a90217603e559503d3b3299b452ab65ef326e03843d` |
| Läuft | eigenständig, offline, ohne Abruf nach außen |
| Quellen | `AG-VISUAL-005-feld/` — `schicht.py` erzeugt die Darstellung, `resonanz-maschine.html` ist die Maschine darunter |

Die Maschine ist **Resonanz**, unverändert bis auf zwei Stellen, beide für
kurzlebige Teilchen: Korn war unbedingt weiß, jetzt hängt das Weiß an der
Hitze; und die Ein-/Ausblende war fest 0,6 s, jetzt ein Drittel der eigenen
Lebensdauer. Resonanz bleibt Resonanz — sie ist hier Ideengeber, nicht
Gegenstand.

## Offen

- Die letzten 12 % der V2-Messung (t=425 bis 480).
- Die Länge des Ausklangs (29 Sekunden). Wird getrennt besprochen.
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
