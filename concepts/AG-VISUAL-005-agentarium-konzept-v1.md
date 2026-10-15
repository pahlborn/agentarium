# AGENTARIUM – Konzept des Feldes

AG-VISUAL-005, Konzeptversion 1 · 2026-10-15T14:12:55Z
Projekt: pahlborn/agentarium · Branch: claude/agentarium-visualisierung
Status: Entwurf zur Prüfung durch die Agenten der Gegenstelle. Keine
Produktspezifikation, keine Implementierungsfreigabe, keine Abnahme.
Vorgänger: keiner. Die bisherigen Festlegungen stehen verstreut in
`specifications/AG-MOCKS-PETER-REQUIREMENTS-v1.md` (Peters Dokument, hier
nicht verändert) und `previews/AG-VISUAL-005-funktionsmatrix-v1.md`.
Zugehörige Schnittstelle: `specifications/AG-VISUAL-005-schnittstelle-v1.md`.

> AGENTARIUM – See intelligence move. Powered by BALL
>
> **BALL — Bio-Agent & LLM Logistics.** Agentarium ist die sichtbare Welt
> des Teams; BALL die Orchestrierung dahinter: Aufgaben, Zustände und
> Übergaben zwischen Mensch und LLM-Agenten. Der sichtbare Ball greift
> zugleich die Frage auf: „Bei wem liegt gerade der Ball?"
> (Peter, 11. Oktober 2026.)

---

## 0. Die unbequeme Vorbemerkung

Ein Monitor, der nicht unterscheiden kann zwischen *„das Projekt ruht"* und
*„die Verbindung ist tot"*, ist schlimmer als kein Monitor. Beides sieht
identisch aus — niemand arbeitet, nichts kommt — und wer das verwechselt,
wartet auf etwas, das nie kommt. **Dieses Konzept steht und fällt mit einem
regelmäßigen Lebenszeichen der Gegenstelle**, nicht mit der Ästhetik.

Der zweite Satz derselben Art: Eine Darstellung, die Lücken glättet, ist
keine Darstellung, sondern eine Erzählung. Jede Faustregel, die in diesem
Feld greift, obwohl mehr als eine Möglichkeit offenstand, wird **gezählt**
und die Zahl ist sichtbar. Das ist unbequem und bleibt so.

---

## 1. Was das Feld ist

Ein Fenster auf die Kommunikation eines Teams aus Menschen und
LLM-Agenten. Es zeigt **Bewegung**, nicht Inhalt: wer wem was zuwirft, wer
wartet, wer blockiert ist, was davon liegen bleibt und was vergeht.

Ein Satz, der die Gestaltung entscheidet: **Die Frage ist nicht „was wurde
geschrieben", sondern „bei wem liegt gerade der Ball".**

### Was es nicht ist

| | |
|---|---|
| **kein Chatfenster** | Inhalte gehören nicht hinein. `text` ist eine Zeile, kein Dokument. |
| **kein Archiv** | Die Projektgeschichte liegt im Repository. Das Feld zeigt den Stand und die letzten Züge. |
| **kein Steuerpult** | Es sendet nichts. Es zeigt. Kein Rückkanal, keine Eingriffe. |
| **kein Fortschrittsbericht** | Es behauptet keinen Grad der Fertigstellung, den es nicht belegen kann. |
| **keine Bewertung** | Es sagt nicht, ob gute Arbeit geleistet wurde. Es sagt, dass gearbeitet wird. |

---

## 2. Für wen

| Zuseher | will wissen | sieht |
|---|---|---|
| **Auftraggeber** (Peter) | Geht es voran? Hängt etwas? | Ball, Stops, Fortschritt, Register |
| **Team / Orchestrierung** | Wer ist frei, wer blockiert? | Rufbereitschaft, offene Aufträge am Platz |
| **Rückblick** | Was ist damals geschehen? | Archivbetrieb, aufgezeichneter Verlauf |
| **Besucher** | Was tut dieses Team eigentlich? | das Ganze, ohne Erklärung nötig |

Der letzte ist der strengste Maßstab. Was einem Besucher nach zwanzig
Sekunden nicht einleuchtet, ist nicht einfach nur erklärungsbedürftig —
es ist falsch gebaut.

---

## 3. Fünf Grundsätze

### 3.1 Projektagnostisch (P03)

Das Feld kennt kein Projekt, keine Rollennamen, keine Aufgabentypen von
Haus aus. Alles kommt aus den Daten: Rollen, Arten, Projekttitel, Umfang.
**Nichts wird gebaut, was nicht von außen über die Schnittstelle bedient
werden kann.** Jede Funktion, die nur mit einem fest eingebauten Wissen
funktioniert, ist ein Fehler, auch wenn sie gut aussieht.

Prüffrage für jede neue Funktion: *Welches Feld im Strom schaltet sie?*
Gibt es keines, gehört sie nicht hinein.

### 3.2 Jeder Mechanismus nennt sein Datenfeld

Keine Wirkung ohne benannte Quelle. Diese Regel hat in der Entwicklung
mehr Fehler gefunden als alles andere — zuletzt einen, bei dem die
Aufgabenkennung in den Daten stand, beim Empfänger aber nie ankam. **Die
Felder waren da, die Übergabe fehlte.** Acht falsche Zuordnungen, lautlos.

### 3.3 Die Darstellung darf nicht wissen, was noch kommt

Ein Prototyp spielt ein abgeschlossenes Drehbuch und kann vorausblicken.
Ein Monitor kann das nicht. Vier Stellen setzen heute Vorausblick voraus;
sie sind in der Funktionsmatrix §1 einzeln benannt und drei davon sind
inzwischen umgebaut. Die vierte — die Flugdauer einer Nachricht — ist der
einzige echte Umbau, der noch aussteht.

Wer diesen Grundsatz verletzt, baut etwas, das in der Vorführung
überzeugt und im Betrieb lügt.

### 3.4 Fehlende Werte sind nicht null

Gilt für alles, besonders für Kosten (AG-COST-UI-001, K07):

- Fehlt eine Kostenangabe, heißt das **„keine Angabe"**, nicht null.
- Bei Lücken **keine numerische Gesamtsumme**, sondern der Status
  „Kosten noch nicht vollständig erfasst".
- Laufende Aufträge zählen **gegen** die Vollständigkeit — sie haben noch
  nichts gemeldet.
- Abonnementnutzung darf nicht als Nullverbrauch erscheinen.
- Fiktive Mockdaten sind keine tatsächlichen Kosten.
- **Die Anzeige verschwindet trotzdem nicht.** Ein leeres Feld liest sich
  wie ein Fehler; ein benannter Status liest sich wie ein Status.
  (Peter, zu K07: „wir dürfen nur die anzeige nicht verschwinden lassen,
  sonst denkt man eher an einen fehler.")

### 3.5 Der Zuseher soll ruhig werden, nicht angetrieben

Keine Punkte, keine Pokale, keine Streaks, kein Drängen. Ein Feld, auf das
man nebenbei schaut, darf nicht um Aufmerksamkeit kämpfen. Die Blöcke sind
dunkel und hellen erst beim Zeigen auf — nicht umgekehrt.

---

## 4. Das Modell dahinter

### 4.1 Vier Ausgänge, und sie sehen verschieden aus

Der Kern des Konzepts. Nicht jede Nachricht ist gleich viel wert, und das
muss man **sehen**, ohne zu lesen:

| Ausgang | was es heißt | im Bild |
|---|---|---|
| **bleibt** | Ein Ergebnis ist entstanden | schreibt in die Fläche, vergeht nicht |
| **verblasst** | Es wurde etwas übergeben | sichtbar da, dann fort — Geschichte |
| **nichts** | Es wurde gefragt, eingewendet, gemeldet | nur solange es fliegt |
| **verworfen** | Es ist eingestürzt | sichtbarer Einsturz |

Dazu ein fünfter, der kein Flug ist: **Zustand** (`stop` / `resume`) — ein
Schild am Platz, keine Bewegung.

Welche Art welchen Ausgang nimmt, steht in **einer einzigen Tabelle**, aus
der sowohl das Verhalten als auch die Legende gespeist wird. Eine Legende,
die man getrennt pflegt, läuft auseinander; das ist keine Theorie,
sondern die Lehre aus dem Vorgängermock.

**Eine unbekannte Art wird nicht erraten.** Sie erscheint als Verkehr ohne
Niederschlag und wird als unbekannt vermerkt.

### 4.2 Der Ball

Genau einer, immer sichtbar, immer bei jemandem. Eine Nachricht mit
`gross > 0,85` nimmt **ihn mit** — die Verantwortung wandert. Darunter
wird nur ein Stück abgeworfen; der Ball bleibt liegen.

Das ist der Grund, warum es ein Ball ist und keine Linie: Eine Linie zeigt
Verkehr. Ein Ball zeigt **Zuständigkeit**.

### 4.3 Stops mit Klasse

Ein Stop ohne Grund ist eine Beunruhigung ohne Handlungsanweisung. Fünf
Klassen, weil sich jede anders auflöst:

| Klasse | löst sich durch |
|---|---|
| `technisch` | Dienst wieder erreichbar |
| `budget` | Kanal wieder geöffnet, Kontingent erneuert |
| `abhaengigkeit` | eine **Antwort** von jemand anderem |
| `freigabe` | eine Entscheidung eines Menschen |
| `mensch` | Peter |

Fehlt die Klasse, gilt `unbekannt` — und das steht auch so da. Der Grund
ist auf Zeigen oder Antippen lesbar.

### 4.4 Fortschritt mit ehrlichem Nenner

Nicht „73 % fertig". Sondern **eröffnete gegen abgeschlossene Aufgaben**,
beide gezählt, beide benannt. Ein Nenner, der aus dem Drehbuch kommt, ist
im Betrieb nicht vorhanden; ein Nenner, der mitwächst, ist ehrlich und
unbequem — die Leiste kann zurückgehen, wenn neue Aufträge aufgehen. Das
ist nicht ein Mangel der Anzeige, das ist die Lage.

Dazu das **Register der Artefakte**: Kennung, Fassung, Zustand
(*prüfung · angenommen · ersetzt · verworfen*). Eine `v2` ist der sichtbare
Beweis einer Überarbeitung — die einzige Stelle, an der das Feld etwas über
Qualität sagt, und es sagt es durch Zählen, nicht durch Urteil.

### 4.5 Ausklang

Am Ende beruhigt sich alles und verblasst, gestaffelt über 18 Sekunden:
Arbeit, Tisch, Feld, Werk, Ruf, Liste. **Der Ball bleibt liegen, wo er
liegt** — beim Auftraggeber, wenn er dort liegt. Stopper bleiben stehen;
sie sind nicht erledigt, nur weil es still wurde. Das Produkt erstrahlt.
Und ab und zu kreuzt ein Komet die Bahn: er kommt aus dem Universum und
bleibt nicht.

---

## 5. Drei Betriebsarten

Weil ein Prototyp, eine Rückschau und ein Echtlauf nicht dasselbe Feld
sein können, es aber dasselbe Bild zeigen sollen:

| | `demo` | `archiv` | `live` |
|---|---|---|---|
| Startet selbst | ja | nein | nein |
| Beginnt von neuem | ja | nein | nein |
| „Von vorn" | ja | ja | **nein** |
| „Halt" | ja | ja | nur wenn verbunden |
| Uhr | Stückzeit | Stückzeit | **Uhrzeit** |
| Quelle | Drehbuch | Aufzeichnung | Strom |

Umgestellt wird im Projektnamen. Ohne Strom sagt der Livebetrieb das auch:

> *Es ist kein Strom angeschlossen. Dieses Feld zeigt nicht ein ruhiges
> Projekt, sondern gar keines.*

Dieser Satz ist der Grundsatz 0 in einer Zeile.

---

## 6. Was die Gegenstelle liefern muss

Vollständig in `specifications/AG-VISUAL-005-schnittstelle-v1.md`. Das
Konzept hängt an vier Dingen, und ohne sie wird das Feld ungenau oder
irreführend:

1. **Ein Lebenszeichen** in festem Takt, auch wenn nichts geschieht.
   Ohne das ist „ruhig" von „abgerissen" nicht zu unterscheiden.
2. **Einen Schnappschuss beim Verbinden.** Push allein lässt den Monitor
   leer: Wer um 14 Uhr aufmacht, was um 9 Uhr begann, sieht sonst „0 von 0".
3. **Eine lückenlose Folgenummer.** Daran erkennt das Feld Lücken,
   Doppelte und Nachzügler — ohne Absprache und ohne Raten.
4. **Die Bezüge** (`erledigt`, `prueft`, `antwortet_auf`). Gemessen an zwei
   Stücken waren ohne sie **33 % bzw. 60 %** aller Zuordnungen mehrdeutig,
   beim Review zu hundert Prozent. Mit ihnen: keine einzige.

---

## 7. Grenzen, offen benannt

- **Die Flugdauer** einer Nachricht wird heute aus dem künftigen Verlauf
  bestimmt. Im Livebetrieb muss sie aus Entfernung und Tempo kommen und
  ein zu langer Flug abgeschnitten werden, nicht geplant.
- **Kostenzuordnung** setzt voraus, dass der Verbrauch zum Zeitpunkt der
  Lieferung feststeht. Kommt er erst über eine Abrechnung, kann das Feld
  ihn keinem Auftrag zuordnen — dann bleibt es bei Summen je Rolle.
- **14 000 Teilchen** werden auf der CPU gerechnet. Auf schwacher Hardware
  ist das die Grenze, nicht die Gestaltung.
- **Die Arbeit an der Resonanz-Maschine bleibt minimal.** Sie ist
  Ideengeber, nicht Baustelle. (Peter: „Resonanz bleibt Resonanz.")
- **Nichts hiervon ist freigegeben.** Kein Merge und keine Veröffentlichung
  ohne Peter. Ein Rollenname ist kein Beweis eines geladenen Agenten.

---

## 8. Im Rückstand (Backlog)

| | Stand |
|---|---|
| **Partitur-Arbeitsprotokoll** | im Rückstand. Die Namen der Bezugsfelder bleiben vorläufig, bis ein echtes Beispiel vorliegt. |
| **Takt / musisches Bild** | im Rückstand. „Vielleicht später, wenn wir mal eine richtig funktionale erste Version haben." |
| **Funken an arbeitenden Agenten** | offen, nie entschieden. |
| **BALL in Peters Anforderungsdokument** | offen. Es ist sein Dokument; die Entscheidung liegt bei ihm. |

---

## 9. Fragen an die Prüfer

1. Welcher der fünf Grundsätze (§3) ist aus Ihrer Sicht der schwächste —
   und warum?
2. Ist der ehrliche Nenner (§4.4) zumutbar, oder ist eine Leiste, die
   zurückgehen kann, im Betrieb unbrauchbar?
3. Fehlt ein sechster Stop-Grund (§4.3), der bei Ihnen regelmäßig auftritt?
4. Ist ein Lebenszeichen alle fünf Sekunden bei Ihnen machbar? Falls nein:
   welcher Takt ist es?
