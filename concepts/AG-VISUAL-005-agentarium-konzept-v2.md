# AGENTARIUM – Konzept des Feldes

AG-VISUAL-005, Konzeptversion 2 · 2026-10-15T20:40:00Z
Projekt: pahlborn/agentarium · Branch: claude/agentarium-visualisierung
Status: Konzept, nachgezogen auf den geprüften Schnittstellenstand. Keine
Produktspezifikation, keine Implementierungsfreigabe, keine Abnahme.
Vorgänger: `concepts/AG-VISUAL-005-agentarium-konzept-v1.md`,
Blob `d07fccdc18432b10fa2fbb904409f9d945ae7ff3` — bleibt unverändert liegen.
Zugehörige Schnittstelle: `specifications/AG-VISUAL-005-schnittstelle-v2.md`
mit `specifications/AG-VISUAL-005-schnittstelle-v2.1-korrektur.md`.

**Warum Fassung 2.** Fassung 1 beschrieb drei wählbare Betriebsarten
(demo · archiv · live). Peter: *„Die Steuerung mit live demo und archiv ist
unlogisch, diese haben nichts bzw nur bedingt mit nachtpost zu tun."* Er hat
recht, und die Schnittstelle ist seitdem dreimal überarbeitet und von Atlas'
Team zweimal geprüft worden. Das Konzept war von vor dieser Einsicht und
widersprach dem Vertrag.

Diese Fassung **erfindet nichts neu.** Sie zieht nach, was inzwischen
entschieden und geprüft ist, und lässt jeden Abschnitt stehen, den das nicht
berührt. Was sich geändert hat, steht in §10.

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
| **heute kein Steuerpult** | Steuerung ist ein **Recht**, keine Eigenschaft des Feldes (§5.3). Heute ist `supported_actions` leer: kein ausführbarer Befehl ist nachgewiesen, also bietet das Feld keinen an. |
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
Ein Monitor kann das nicht. Vier Stellen setzten Vorausblick voraus; sie
sind in der Funktionsmatrix §1 einzeln benannt. Drei sind umgebaut. Die
vierte — **die Flugdauer einer Nachricht**, die heute die restliche
Ereignisliste nach dem nächsten Zug des Empfängers durchsucht — ist der
einzige echte Umbau, der noch aussteht. Im Livebetrieb muss sie aus
Entfernung und Tempo kommen; ein zu langer Flug wird abgeschnitten, nicht
geplant.

Wer diesen Grundsatz verletzt, baut etwas, das in der Vorführung
überzeugt und im Betrieb lügt.

### 3.4 Fehlende Werte sind nicht null

Gilt für alles, besonders für Kosten (AG-COST-UI-001, K07).

**Peters Entscheidung vom 15.10.2026, 21:01:52 Europe/Berlin** ersetzt die
früheren Formulierungen und steht wörtlich im Vertrag:

- Das Kostenfeld **bleibt sichtbar**.
- Solange die Gesamtkosten nicht vollständig ermittelt werden können, zeigt
  es **ausschließlich**: **„Kosten nicht vollständig ermittelbar."**
- **Keine** Beträge, Teilsummen, Gesamtsummen oder 0-Ersatzwerte.
- Erst bei vollständiger, **belegter** Gesamterfassung werden Kosten
  ausgewiesen — und dann nur mit Abdeckungsnachweis und Kostenquellen.

Das Übrige gilt unverändert:

- Fehlt eine Kostenangabe, heißt das **„keine Angabe"**, nicht null.
- Laufende Aufträge zählen **gegen** die Vollständigkeit — sie haben noch
  nichts gemeldet.
- Abonnementnutzung darf nicht als Nullverbrauch erscheinen.
- Fiktive Mockdaten sind keine tatsächlichen Kosten; jedes Kostenfeld nennt
  `daten` ∈ `real` | `synthetisch`.
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

Dazu ein fünfter, der kein Flug ist: **Zustand** — ein Schild am Platz,
keine Bewegung. Im Vertrag sind das `block` und `unblock` mit `block_id`,
`task_id` und `resolving_event_id`; `stop`/`resume` waren meine Namen aus
der Prototypzeit.

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

**Offene Stelle, ausdrücklich:** Diese fünf Klassen sind eine Gruppierung
der Anzeige. Der Vertrag kennt `block_id`, `task_id`, einen Grund als Text
und `resolving_event_id` — **aber kein Klassenfeld**. Solange es keines
gibt, müsste das Feld die Klasse aus dem Text raten, und Raten ist nach
§3.2 verboten. Also gilt bis dahin `unbekannt` für alle. Ein Feld dafür ist
bei Atlas zu erbitten; es steht in §9 als offener Punkt.

### 4.4 Fortschritt mit ehrlichem Nenner

Nicht „73 % fertig". Sondern **eröffnete gegen abgeschlossene Aufgaben**,
beide gezählt, beide benannt — und „abgeschlossen" heißt nach Vertrag
**ausschließlich**: ein ausdrücklicher `status_change` mit monotoner
`item_revision` und einem versionsgebundenen Erfüllungsnachweis. Eine
Lieferung, ein Reviewpass oder ein Testpass setzt **nichts** auf Done. Das
war mein Fehler in der ersten Fassung der Schnittstelle: ein Feld
`erledigt`, das genau das getan hätte. Es ist gestrichen.

Ein Nenner, der aus dem Drehbuch kommt, ist im Betrieb nicht vorhanden; ein
Nenner, der mitwächst, ist ehrlich und unbequem — die Leiste kann
zurückgehen, wenn neue Aufträge aufgehen. Das ist nicht ein Mangel der
Anzeige, das ist die Lage.

Dazu das **Register der Artefakte**: Kennung, Fassung, Zustand
(*prüfung · angenommen · ersetzt · verworfen*), gespeist aus
`artifact_id`, `version`, `supersedes` und den Prüfungen, die an **genau**
dieser Version hängen — ein Pass auf `v1` erreicht `v2` nie.

Eine `v2` ist der sichtbare Beweis einer Überarbeitung — die einzige Stelle,
an der das Feld etwas über Qualität sagt, und es sagt es durch Zählen, nicht
durch Urteil.

### 4.5 Ausklang

Am Ende beruhigt sich alles und verblasst, gestaffelt über 18 Sekunden:
Arbeit, Tisch, Feld, Werk, Ruf, Liste. **Der Ball bleibt liegen, wo er
liegt** — beim Auftraggeber, wenn er dort liegt. Stopper bleiben stehen;
sie sind nicht erledigt, nur weil es still wurde. Das Produkt erstrahlt.
Und ab und zu kreuzt ein Komet die Bahn: er kommt aus dem Universum und
bleibt nicht.

---

## 5. Keine Betriebsarten. Vier getrennte Dinge.

Fassung 1 hatte hier drei wählbare Betriebsarten. Das war der Fehler, den
Peter gefunden hat: **aus einer Eigenschaft der Quelle wurde eine Wahl.**
Man konnte „NACHTPOST V2" und „Live" gleichzeitig wählen, obwohl es für V2
keinen Strom gibt und nie geben wird.

Richtig ist: Es gibt **vier** Dinge, und nur das erste wählt der Betrachter.

### 5.1 Was man wählt: Projekt und Lauf

| | |
|---|---|
| `project_id` | die **dauerhafte Projektklammer** |
| `run_id` | eine **einzelne Ausführung**, und die Archiv- und Replayeinheit |

Ein Projekt kann mehrere Läufe haben, aktuelle und historische.
**Archiviert und wiedergegeben wird ein Lauf, nicht ein Projekt.** Peters
Satz *„Alle beendeten projekte sollen nachhaltig im archiv Modus gestartet
werden können"* heißt in dieser Sprache: alle beendeten **Läufe**.

Ein Projekt entsteht beim Team: es erzeugt die `project_id` und
veröffentlicht `project.created` im Katalogstrom. Erst danach existiert sie.
Das Feld erfindet nie eine.

### 5.2 Was sich ergibt: die Ansicht

**Die Ansicht ist keine Wahl.** Sie folgt dem Zustand des Laufs:

| Zustand | terminal | Ansicht |
|---|---|---|
| `geplant` `aktiv` `wartend` `pausiert` `blockiert` `wiedereroeffnet` | nein | **Live-Beobachtung** |
| `abgeschlossen` `abgebrochen` `fehlgeschlagen` | **ja** | **Archivwiedergabe** |

Ein Betrachter darf Projekt und Lauf wählen. Er darf einen archivierten
Lauf **nicht** als Live etikettieren. Widersprüchliche Betriebsarten sind
nicht frei kombinierbar — es gibt sie nicht mehr.

Daraus folgt auch, was an Knöpfen übrig bleibt: „Von vorn" hat nur bei einer
Aufzeichnung einen Sinn, die Uhr zeigt bei einem Strom die Uhrzeit und bei
einer Aufzeichnung die Stückzeit. Das ist abgeleitet, nicht eingestellt.
Peter dazu: *„Dazu brauchen wir aber keinen knopf"* — ein Lauf aus der Liste
zu wählen startet ihn; ein zusätzlicher Knopf entsteht nicht.

### 5.3 Was unabhängig daneben steht: Herkunft

`mode` ∈ `OBSERVED_PROJECT_WORK` | `SIMULATION`, dazu `fictional`.

Das ist **Herkunft, nicht Anzeige**, und es bleibt unabhängig sichtbar.
Simulation und echte Projektarbeit werden niemals vermischt. Dieses Feld
existierte im echten Arbeitsprotokoll des Teams längst — ich hatte einen
Anzeigeschalter in ein Feld verwandelt, das es schon gab und das etwas
anderes bedeutet.

### 5.4 Was ein Recht ist: Steuerung

| Recht | erlaubt |
|---|---|
| `read` | Beobachten, Schnappschuss, Archivwiedergabe |
| `command` | **zusätzlich**, dazu die bestehenden fachlichen Freigaben |

Serverseitig durchgesetzt. **Wand- und Präsentationsansichten erhalten
ausschließlich `read`.** Das Ausblenden einer Schaltfläche gilt nicht als
Rechteprüfung.

**Heute ist `supported_actions` leer.** Atlas' Team hat nachgesehen: kein
ausführbarer integrierter Befehl ist nachgewiesen. Also bietet das Feld
keine bedienbare Steueraktion an, und jede Anfrage wird mit
`nicht_unterstuetzt` und ohne fachliche Nebenwirkung abgelehnt. Der
Befehlskanal bleibt Erweiterungsrahmen.

### 5.5 Was das Feld sagt, wenn nichts anliegt

Unverändert aus Fassung 1, weil es Grundsatz 0 in einer Zeile ist:

> *Es ist kein Strom angeschlossen. Dieses Feld zeigt nicht ein ruhiges
> Projekt, sondern gar keines.*

### 5.6 Das gebaute Feld weicht hier noch ab

**Ehrlich benannt:** Das lauffähige Stück (Fassung 38) trägt im Projektblatt
noch die alte Liste `Demo · Archiv · Live`. Sie steht dort, weil ohne sie
Archiv und Live gar nicht erreichbar wären, solange es keinen Strom gibt.
Sie fällt mit der Umsetzung dieses Abschnitts, nicht vorher. Bis dahin ist
das Feld **nicht** auf dem Stand dieses Konzepts, und das ist kein
Versehen, sondern aufgeschoben.

---

## 6. Was die Gegenstelle liefern muss

Vollständig in `specifications/AG-VISUAL-005-schnittstelle-v2.md` mit
`…-v2.1-korrektur.md`. Das Konzept hängt an fünf Dingen:

1. **Zwei getrennte Ströme.** Ein Katalogstrom meldet `project.created`,
   `run.started`, `run.finished`; die Arbeit läuft je Lauf in einem eigenen
   Strom. Jeder hat seinen **eigenen** Sequenz- und Replayraum. Ein Strom,
   der nur ein Projekt kennt, kann die Entstehung eines Projekts nicht
   ankündigen, das es noch nicht gibt.
2. **Ein Lebenszeichen** alle 5 s, auch wenn nichts geschieht; nach 20 s
   ohne Empfang gilt die Ansicht als veraltet. Flüchtig: keine
   Persistierung, keine Fachereignis-ID, keine Sequenzwirkung. Ohne das ist
   „ruhig" von „abgerissen" nicht zu unterscheiden — und umgekehrt beweist
   eine funktionierende Verbindung **keine** aktive Agentenarbeit.
3. **Einen Schnappschuss beim Verbinden**, mit eigenem `cursor`,
   `replay_grenze` und `hoechste_sequenz`, dazu dem **typisierten** Zustand
   am Cursor: Aufgaben mit Revision, Artefakte mit Prüfungen je genauer
   Version, Blockaden. Push allein lässt den Monitor leer: Wer um 14 Uhr
   aufmacht, was um 9 Uhr begann, sieht sonst „0 von 0".
4. **Eine lückenlose Folgenummer je Strom.** Daran erkennt das Feld Lücken,
   Doppelte und Nachzügler — ohne Absprache und ohne Raten. Fortgesetzt wird
   bei `cursor + 1`; fortsetzbar ist also `cursor + 1 >= replay_grenze`.
5. **Die Bezüge**, in den Namen des echten Arbeitsprotokolls
   `agentarium.observed-worklog.v1`: `caused_by`, `reply_to`,
   `question_id`, `artifact_id`, `version`, `criteria_ref`, `outcome`,
   `supersedes`, `corrects`, `block_id`, `resolving_event_id`,
   `item_revision`, `previous_transition_id`.

   Gemessen an zwei Stücken waren ohne solche Bezüge **33 % bzw. 60 %**
   aller Zuordnungen mehrdeutig, bei der Frage „welches Ergebnis nimmt
   dieses Review ab" zu hundert Prozent. Mit ihnen: keine einzige.

   **Die Namen sind nicht meine.** Fassung 1 erfand sieben eigene, während
   ein echtes Protokoll im Basis-Zweig lag —
   `relay/events/AG-PARTITUR-001-worklog-v1.json`. Sie sind zurückgezogen.

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

## 8. Im Rückstand

| | Stand |
|---|---|
| **Partitur-Arbeitsprotokoll** | Das echte Beispiel **liegt vor**: `relay/events/AG-PARTITUR-001-worklog-v1.json`, Schema `agentarium.observed-worklog.v1`, acht Ereignisse. Die Feldnamen sind damit nicht mehr vorläufig. Offen bleibt, ob Partitur denselben Vertrag verwendet — Verbraucherkompatibilität ist NOT_TESTED (O7). |
| **Flugdauer ohne Vorausblick** | der letzte der vier Blicke in die Zukunft (§3.3). Für den Livebetrieb nötig. |
| **Klassenfeld für Blockaden** | bei Atlas zu erbitten (§4.3). Ohne es gilt für alle `unbekannt`. |
| **Das gebaute Feld auf §5 bringen** | die alte Betriebsartenliste entfernen, sobald der Strom erreichbar ist (§5.6). |
| **Takt / musisches Bild** | im Rückstand. „Vielleicht später, wenn wir mal eine richtig funktionale erste Version haben." |
| **Funken an arbeitenden Agenten** | offen, nie entschieden. |
| **BALL in Peters Anforderungsdokument** | offen. Es ist sein Dokument; die Entscheidung liegt bei ihm. |

---

## 9. Was die Prüfung entschieden hat

Fassung 1 endete mit vier Fragen an die Prüfer. Sie sind beantwortet —
Argus und Sentinel haben zweimal geprüft, beim zweiten Mal beide mit
`FAIL`, und beides war berechtigt.

| Frage aus Fassung 1 | Antwort |
|---|---|
| Welcher Grundsatz ist der schwächste? | Keiner wurde verworfen. Beanstandet wurde die **Umsetzung**: fünf Dinge, die mein Schema akzeptierte und nicht durfte, und zwei Regeln, die ihren eigenen Fall nicht erkannten. |
| Ist der ehrliche Nenner zumutbar? | Ja — mit der Verschärfung, dass „abgeschlossen" nur ein ausdrücklicher, revisionsgebundener Statuswechsel mit versionsgebundenem Nachweis ist. |
| Fehlt ein sechster Stop-Grund? | Nicht beantwortet. Es gibt bis heute **kein Klassenfeld** im Vertrag (§4.3). |
| Lebenszeichen alle fünf Sekunden machbar? | Ja. Takt 5 s, veraltet **nach** 20 s, und als flüchtiges Ereignis getrennt vom Transport-Keepalive. |

**Offen, und bei Atlas:**

| | |
|---|---|
| **O2** | Welcher Betriebsrahmen gilt — gleicher Ursprung mit Cookie-Sitzung oder getrennter Ursprung mit `fetch`-Streaming. Er muss **vor** dem Verbindungsaufbau feststehen. |
| **O3** | Tatsächliche Replaykapazität je Strom. Die Randsemantik ist festgelegt, die Zahl ist betrieblich. |
| **O4** | Wann der Verbrauch eines Auftrags feststeht. Entscheidet, ob Kosten je Auftrag oder nur je Rolle zuzuordnen sind. Kostenforschung soll nicht neu beginnen. |
| **O6** | `catalog.changed` ist entfernt, weil nie definiert. Falls gebraucht: vollständige Nutzdaten. |
| **O7** | Verwendet Partitur denselben Vertrag? NOT_TESTED. |
| neu | Ein **Klassenfeld für Blockaden** (§4.3). |
| neu | Ein Standard-JSON-Schema-Validator sollte die Schemas gegenlesen. In diesem Container nicht möglich. |

---

## 10. Was sich gegenüber Fassung 1 geändert hat

| § | Fassung 1 | Fassung 2 |
|---|---|---|
| **5** | drei wählbare Betriebsarten `demo · archiv · live` | **entfallen.** Man wählt Projekt und Lauf; die Ansicht folgt dem Laufzustand (neun Zustände), Herkunft steht unabhängig daneben, Steuerung ist ein Recht |
| 1 | „kein Steuerpult, es sendet nichts" | Steuerung ist ein Recht; heute ist `supported_actions` leer, also bietet das Feld keine Aktion an |
| 3.4 | Status „Kosten noch nicht vollständig erfasst" | Peters Wortlaut vom 15.10.2026, 21:01:52: **„Kosten nicht vollständig ermittelbar."**, keine Beträge, dazu `daten` real/synthetisch |
| 4.1 | `stop` / `resume` | `block` / `unblock` mit `block_id`, `task_id`, `resolving_event_id` |
| 4.3 | fünf Stopklassen als gegeben | fünf Klassen als Anzeige-Gruppierung, **ohne Datenfeld im Vertrag** — offene Stelle |
| 4.4 | „eröffnete gegen abgeschlossene Aufgaben" | dasselbe, aber „abgeschlossen" nur über `status_change` mit `item_revision` und versionsgebundenem Nachweis; `erledigt` gestrichen |
| 6 | vier Punkte, Bezugsfelder mit **meinen erfundenen Namen** | fünf Punkte, Namen aus `agentarium.observed-worklog.v1`; zwei getrennte Ströme; typisierter Zustand im Schnappschuss; Grenzsemantik `cursor + 1 >= replay_grenze` |
| 8 | „Partitur: Namen vorläufig, bis ein echtes Beispiel vorliegt" | das Beispiel lag die ganze Zeit im Basis-Zweig; Namen sind nicht mehr vorläufig |
| 9 | vier Fragen an die Prüfer | die Antworten, dazu sieben offene Punkte bei Atlas |
| neu **5.6** | — | das gebaute Feld weicht noch ab, und das steht so da |

**Unverändert:** §0, §2, §3.1, §3.2, §3.5, §4.1 (die vier Ausgänge),
§4.2 (der Ball), §4.5 (Ausklang), §7 (Grenzen). Peters Zitate stehen
wörtlich, wie sie gefallen sind.
