# AGENTARIUM – Schnittstelle des Feldes

AG-VISUAL-005, Schnittstellenversion 1 · 2026-10-15T14:12:55Z
Projekt: pahlborn/agentarium · Branch: claude/agentarium-visualisierung
Status: Entwurf zur Prüfung durch die Agenten der Gegenstelle. Keine
Implementierungsfreigabe, keine Abnahme, nichts davon gebaut.
Vorgänger: keiner.
Zugehöriges Konzept: `concepts/AG-VISUAL-005-agentarium-konzept-v1.md`.
Zugehörige Funktionsmatrix: `previews/AG-VISUAL-005-funktionsmatrix-v1.md`.
Fassungsregister: `previews/AG-VISUAL-005-fassungen.md`.

> AGENTARIUM – See intelligence move. Powered by BALL
>
> **BALL — Bio-Agent & LLM Logistics**

Dieses Dokument beschreibt, was das Feld braucht, um aus einem laufenden
Projekt gespeist zu werden — und ebenso, was es **nicht** braucht. Das
Warum steht im Konzept daneben; hier stehen die Felder.

Die Form folgt einer Regel, die diese ganze Arbeit trägt: **Jeder Mechanismus
nennt das Datenfeld, das ihn speist.** Hier steht sie umgekehrt — jedes Feld
nennt, was es im Bild bewirkt. Was nichts bewirkt, gehört nicht hinein.

---

## 1. Was „Push" hier heißt, und was es nicht heißen kann

**Eine Browserseite kann man nicht anstoßen.** Sie hat keine Adresse, unter
der sie erreichbar wäre. Push bedeutet deshalb zwangsläufig:

> Das Feld **öffnet** eine Verbindung nach außen, und die Gegenstelle
> **schiebt** durch diese offene Verbindung.

Zwei Bauformen kommen in Frage:

| | WebSocket | Server-Sent Events (SSE) |
|---|---|---|
| Richtung | beidseitig | nur zum Feld hin |
| Wiederverbinden | selbst zu bauen | eingebaut, mit `Last-Event-ID` |
| Durch Proxys | gelegentlich blockiert | gewöhnliches HTTP |
| Aufwand bei euch | WebSocket-Server | ein langlebiger HTTP-Antwortstrom |

**Empfehlung: SSE.** Das Feld braucht keinen Rückkanal — es sendet nichts,
es zeigt. SSE bringt das Wiederaufnehmen nach einem Abriss von Haus aus mit
(`Last-Event-ID`), und genau daran hängt der Fall, der am meisten weh tut:
eine Verbindung, die stillschweigend abreißt. Ein Webhook ginge nur mit
einem Server zwischen euch und dem Feld; dann verschiebt sich die Frage
dorthin, löst sich aber nicht auf.

---

## 2. Push allein lässt den Monitor leer

Wer um 14 Uhr ein Projekt aufmacht, das um 9 Uhr begann, bekommt mit reinem
Push einen leeren Kreis, „0 von 0 Aufgaben" und ein Register ohne Einträge.
Die Darstellung wäre nicht falsch — sie wäre blind.

Deshalb drei Nachrichtenarten, nicht eine:

```
1  schnappschuss   einmal, direkt nach dem Verbinden: der Stand JETZT
2  ereignis        danach, fortlaufend: was geschieht
3  herzschlag      regelmäßig, auch wenn nichts geschieht
```

Der Herzschlag ist nicht Beiwerk. Ohne ihn lässt sich **„das Projekt ruht"**
nicht von **„die Verbindung ist tot"** unterscheiden, und beides sieht im
Bild identisch aus: niemand arbeitet, nichts kommt. Wer das verwechselt,
wartet auf etwas, das nicht kommt.

---

## 3. Der Umschlag

Jede Nachricht trägt denselben Rahmen:

```json
{
  "schema": "agentarium.strom.v1",
  "art": "ereignis",
  "folge": 1247,
  "gesendet": "2026-10-15T12:04:31.880Z",
  "projekt": "AG-NACHTPOST",
  "inhalt": { }
}
```

| Feld | Pflicht | wozu |
|---|---|---|
| `schema` | ja | Fassung des Protokolls. Kennt das Feld sie nicht, zeigt es das an, statt zu raten. |
| `art` | ja | `schnappschuss` · `ereignis` · `herzschlag` |
| `folge` | ja | **lückenlos aufsteigend je Projekt.** Daran erkennt das Feld Lücken, Doppelte und Nachzügler. |
| `gesendet` | ja | Zeitpunkt beim Absender, ISO 8601 mit Zeitzone. |
| `projekt` | ja | stabile Kennung des Projekts, nicht sein Anzeigename. |
| `inhalt` | ja | je nach `art` |

---

## 4. Das Ereignis

Das Herzstück. Jedes Feld nennt, was es bewirkt.

### 4.1 Pflichtfelder

| Feld | Typ | was es im Bild bewirkt |
|---|---|---|
| `id` | Text | Kennung des Ereignisses. Ziel von `antwortet_auf`. |
| `zeit` | ISO 8601 | **wann es geschah**, nicht wann es gesendet wurde. Treibt Uhr und Dauern. |
| `von` | Rollenkennung | Startpunkt der Bewegung |
| `art` | Aufzählung | entscheidet alles Weitere: Gestalt, Niederschlag, Nachhall |

### 4.2 Die Arten

Vier Ausgänge, und sie sehen verschieden aus, weil sie verschieden sind:

| Ausgang | Arten | im Bild |
|---|---|---|
| **bleibt** | `artifact` `decision` `test_result` `review_result` | schreibt in die Fläche, vergeht nicht |
| **verblasst** | `request` `handoff` `answer` `contribution` `proposal` `recommendation` | sichtbar da, dann fort — Geschichte |
| **nichts** | `question` `objection` `change_request` `defect` `open_state` | nur solange es fliegt |
| **Zustand** | `stop` `resume` | kein Flug; ein Schild am Platz |

Eine unbekannte Art wird **nicht erraten**. Sie erscheint als Verkehr ohne
Niederschlag und wird im „Gesetz" als unbekannt vermerkt.

### 4.3 Felder, die das Bild reicher machen

| Feld | Typ | was es bewirkt | fehlt es? |
|---|---|---|---|
| `an` | Rollenkennung | Ziel der Bewegung | die Nachricht geht ins Feld, nicht zu jemandem |
| `text` | Text | die Zeile in der Liste und am Empfänger | leere Zeile |
| `kommando` | Text | das Wort, das am Auftrag steht („BAUE", „PRÜFE") | kein Wort |
| `folgen` | Zahl | Aufspaltung: aus einer Nachricht werden mehrere | keine Aufspaltung |
| `gross` | 0…1 | Größe des Balls. **> 0,85 = der ganze Ball wandert**, darunter ein abgeworfenes Stück | Vorgabe je Art |
| `modell` | Text | welches Modell an diesem Auftrag saß | Vorgabe aus der Plattform der Rolle |

### 4.4 Die Bezüge — hier entscheidet sich die Zuverlässigkeit

Ohne sie entscheidet die Darstellung nach Faustregeln. Gemessen an zwei
Stücken: **33 % bzw. 60 % aller Entscheidungen waren mehrdeutig**, beim
Review zu hundert Prozent.

| Feld | Typ | was es bewirkt | ohne es |
|---|---|---|---|
| `aufgabe` | Kennung | stabile Aufgaben-ID über den ganzen Auftrag | — |
| `erledigt` | Kennung | **welche** Aufgabe diese Lieferung abschließt | der älteste offene Auftrag endet — geraten |
| `artefakt` | Kennung | Identität des Ergebnisses; Eintrag im Register | „ohne Kennung" |
| `version` | Text | seine Fassung. **Eine v2 ist der sichtbare Beweis einer Überarbeitung.** | keine Historie |
| `prueft` | Artefaktkennung | **welches** Ergebnis diese Prüfung bewertet | das älteste auf dem Tisch — geraten |
| `antwortet_auf` | Ereignis-ID | welche Frage beantwortet wird | die Blockade des Empfängers — geraten |
| `ersetzt` | Artefaktkennung | was abgelöst wird | — |

Jede Faustregel, die greift, obwohl mehr als eine Möglichkeit offen stand,
wird **gezählt**; die Zahl steht im „Gesetz" der laufenden Fassung. Damit ist
nachprüfbar, ob die Abläufe die Bezüge tatsächlich verwenden — nicht nur, ob
die Felder vorhanden sind.

> Belegt: Im ersten Versuch zeigte der Zähler 8 statt 0, obwohl in den Daten
> für jede Lieferung ein `erledigt` stand. Die Aufgaben-ID kam beim
> Empfänger nie an. **Die Felder waren da, die Übergabe fehlte.**

### 4.5 Stops

| Feld | Werte | was es bewirkt |
|---|---|---|
| `art` | `stop` / `resume` | Schild am Platz des Betroffenen |
| `an` | Rollenkennung | wen es trifft |
| `klasse` | `technisch` `budget` `abhaengigkeit` `freigabe` `mensch` | Wort, Farbe, Verhalten — und die Erklärung, was ihn auflöst |
| `text` | Text | der Grund, auf Zeigen oder Antippen lesbar |

Die Klassen sind nicht Geschmack: **Eine fachliche Blockade löst sich durch
eine Antwort, ein technischer Ausfall nicht.** Fehlt die Klasse, gilt
`unbekannt`, und das ist sichtbar.

### 4.6 Kosten und Verbrauch

| Feld | Typ | Regel |
|---|---|---|
| `kosten` | Zahl, USD | **Fehlt es, heißt das „keine Angabe", nicht null.** |
| `tokens` | `{aus, ein, denken, cache}` | dito |
| `quelle` | `gemessen` / `geschaetzt` | geschätzte Werte werden gekennzeichnet (`~`) |

Aus AG-COST-UI-001 und K07, und beides gilt unverändert:

- Bei Lücken **keine numerische Gesamtsumme**, sondern der Status
  „Kosten noch nicht vollständig erfasst".
- Laufende Aufträge zählen **gegen** die Vollständigkeit — sie haben noch
  nichts gemeldet.
- Abonnementnutzung darf nicht als Nullverbrauch erscheinen.

---

## 5. Der Schnappschuss

Einmal, direkt nach dem Verbinden. Er beantwortet: *Was ist jetzt?*

```json
{
  "schema": "agentarium.strom.v1",
  "art": "schnappschuss",
  "folge": 1246,
  "gesendet": "2026-10-15T12:04:30.000Z",
  "projekt": "AG-NACHTPOST",
  "inhalt": {
    "projekt":      { "kennung": "AG-NACHTPOST",
                      "name": "NACHTPOST V2",
                      "titel": "Die Stadt, die sich gemeinsam verändert",
                      "beschreibung": "…",
                      "ablage": "Repository",
                      "begonnen": "2026-10-15T09:02:11Z" },
    "rollen":       [ { "kennung": "coding-agent", "name": "Forge",
                        "rolle": "Entwicklung", "plattform": "claude" } ],
    "aufgaben":     { "eroeffnet": 25, "abgeschlossen": 19 },
    "offen":        [ { "aufgabe": "AG-V2-021", "an": "forge",
                        "seit": "2026-10-15T11:48:00Z", "text": "…" } ],
    "stops":        [ { "an": "nova", "klasse": "budget", "text": "…",
                        "seit": "2026-10-15T11:12:00Z" } ],
    "register":     [ { "artefakt": "ART-05", "version": "v2",
                        "zustand": "angenommen", "von": "forge" } ],
    "verbrauch":    [ { "rolle": "forge", "kosten": 2.0947,
                        "tokens": { "aus": 135800 }, "quelle": "gemessen",
                        "ohne_angabe": 2 } ],
    "letzte":       [ /* die letzten 10 Ereignisse, damit die Liste nicht leer ist */ ]
  }
}
```

**Nicht im Schnappschuss:** die ganze Projektgeschichte. Das Feld ist ein
Monitor, kein Archiv. Zehn Ereignisse reichen, um die Liste zu füllen; wer
mehr will, nimmt die Archivansicht.

---

## 6. Der Herzschlag

```json
{ "schema": "agentarium.strom.v1", "art": "herzschlag",
  "folge": 1248, "gesendet": "2026-10-15T12:04:36.000Z",
  "projekt": "AG-NACHTPOST" }
```

**Alle 5 Sekunden, auch wenn nichts geschieht.** Bleibt er länger als 20
Sekunden aus, wechselt das Feld in den Zustand *ohne Lebenszeichen* und sagt
das im Kopf — nicht „nichts passiert", sondern:

```
Verbindung seit 40 s ohne Lebenszeichen
```

Drei Zustände, die das Feld dann unterscheiden kann:

| Zustand | was man sieht | was es heißt |
|---|---|---|
| verbunden, Ereignisse | das Feld arbeitet | alles normal |
| verbunden, still | Rufbereitschaft, Puls schlägt | das Projekt ruht gerade |
| **ohne Lebenszeichen** | Puls aus, Hinweis im Kopf | **die Ansicht ist alt, nicht das Projekt** |

---

## 7. Reihenfolge, Lücken, Nachzügler

`folge` ist je Projekt **lückenlos aufsteigend**. Daraus folgt alles Weitere,
und zwar ohne Absprache:

| Fall | was das Feld tut |
|---|---|
| `folge` ist die erwartete | verarbeiten |
| `folge` ist kleiner | Doppelte oder Nachzügler — verwerfen |
| `folge` springt | **Lücke.** Das Feld meldet sie sichtbar und fordert über `Last-Event-ID` nach |
| Verbindung abgerissen | Wiederverbinden mit `Last-Event-ID`; bei zu großer Lücke neuer Schnappschuss |

**Was die Gegenstelle dafür vorhalten muss:** einen Ringpuffer der letzten
Ereignisse je Projekt (Vorschlag: 500 oder eine Stunde), damit ein kurzer
Abriss nachgeliefert werden kann. Ist der Rückstand größer, antwortet sie mit
einem neuen Schnappschuss statt mit Ereignissen.

**Was das Feld niemals tut:** eine Lücke stillschweigend überspringen. Eine
Darstellung, die Teile des Geschehens verschweigt, ist schlimmer als keine.

---

## 8. Was die Darstellung NICHT braucht

Genauso wichtig wie die Liste oben, weil jede zusätzliche Angabe eine
Angriffsfläche und eine Pflegelast ist:

- **Keine Inhalte.** Kein Code, keine Spezifikationstexte, keine
  Modellantworten. `text` ist eine Zeile, kein Dokument.
- **Keine Personendaten** außer den Rollennamen des Teams.
- **Keine Zugangsdaten**, keine Schlüssel, keine internen Adressen.
- **Keine Projektgeschichte** über den Schnappschuss hinaus.
- **Kein Rückkanal.** Das Feld sendet nichts. Es zeigt.

---

## 9. Betrieb

| | |
|---|---|
| Verbindung | `GET /agentarium/strom?projekt=AG-NACHTPOST`, `Accept: text/event-stream` |
| Anmeldung | Trägertoken im Kopf, kurzlebig; **nicht** in der Adresse |
| Wiederaufnahme | `Last-Event-ID` entspricht `folge` |
| Herkunft | eine feste Herkunft je Aufstellort (CORS) |
| Tempo | ein Ereignis je Vorgang, kein Stapeln. Bei mehr als 20 je Sekunde darf gebündelt werden |
| Verschlüsselung | TLS, immer |

---

## 10. Was im Feld dafür umgebaut werden muss

Ehrlich benannt, damit die Gegenstelle den Aufwand einschätzen kann. Vier
Stellen setzen heute ein **abgeschlossenes Drehbuch** voraus:

| Stelle | heute | live |
|---|---|---|
| `flugdauer()` | **durchsucht die restliche Ereignisliste** nach dem nächsten Zug des Empfängers | aus Entfernung und Tempo; ein zu langer Flug wird abgeschnitten, nicht geplant |
| Ausklang | braucht „alle Ereignisse gespielt" und eine bekannte Dauer | bei Leerlauf, ohne Neubeginn |
| Uhr | `min(zeit, dauer)` | Uhrzeit, ohne Deckel — **gebaut** |
| Fortschritt | Zähler gegen `umfang` | eröffnete gegen abgeschlossene Aufgaben — **gebaut** |

**Darstellung darf nicht wissen, was noch kommt.** `flugdauer()` ist der
einzige echte Umbau; die Betriebsarten (`demo` · `archiv` · `live`) und der
ehrliche Nenner sind bereits vorhanden.

---

## 11. Offene Fragen an die Gegenstelle

1. **Rollenkennungen:** Sind `coding-agent`, `spec-agent`, `operate-as-atlas`
   usw. aus `relay/role-routing.json` die Kennungen, die im Strom stehen
   werden — oder gibt es dafür eigene?
2. **Die Bezugsfelder** (`aufgabe`, `erledigt`, `artefakt`, `version`,
   `prueft`, `antwortet_auf`) sind von mir benannt. Das
   Partitur-Arbeitsprotokoll führt bereits Ereignis-IDs und Verweise auf
   auslösende Ereignisse. **Wie heißen sie dort?** Ich ziehe die Namen nach,
   bevor sie sich festsetzen.
3. **Zeitstempel:** Liefert ihr den Zeitpunkt des Geschehens (`zeit`) getrennt
   vom Zeitpunkt des Sendens? Ohne diese Trennung werden alle Dauern falsch,
   sobald etwas verzögert ankommt.
4. **Kosten:** Zu welchem Zeitpunkt steht der Verbrauch eines Auftrags fest —
   bei der Lieferung, oder erst später über eine Abrechnung? Davon hängt ab,
   ob das Feld ihn überhaupt einem Auftrag zuordnen kann.
5. **Herzschlag:** Ist ein leeres Signal alle fünf Sekunden machbar? Ohne ihn
   ist „ruhig" von „abgerissen" nicht zu unterscheiden — und das ist der
   einzige Punkt dieses Entwurfs, bei dem eine Lücke nicht nur die
   Darstellung ärmer macht, sondern **irreführend**.
6. **Mehrere Projekte** gleichzeitig: ein Strom je Projekt, oder einer für
   alle mit `projekt` als Unterscheidung?
