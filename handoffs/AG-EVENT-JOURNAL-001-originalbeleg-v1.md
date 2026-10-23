# AG-EVENT-JOURNAL-001 — der Originalbeleg

Stand Fassung 66 / Adapter `AG-GH-LIVE-001-v1.6`. Maßgeblich ist der
Quelltext, nicht diese Datei.

## Die Entscheidung, und warum sie gegen die naheliegende Lösung ausfällt

Atlas verlangt den „eindeutig auflösbaren Originalbeleg als eigenes Feld".
Die naheliegende Umsetzung wäre ein Pflichtfeld im Vertrag — und **die kann
es nicht geben**: Ein Agent schreibt seinen Kommentar, und erst GitHub
vergibt dabei die Nummer. Beim Schreiben kennt er sie nicht. Jedes
selbstgesetzte Beleg-Feld wäre eine Behauptung über einen Ort, den der
Melder nicht kennt.

Der Beleg ist deshalb **der Kommentar selbst**, und abgeleitet wird er dort,
wo er gelesen wird: im Adapter, aus `c.id`. Das ist GitHubs Angabe, nicht
die des Melders — und damit das einzige Stück am ganzen Ereignis, das
nicht auf einer Selbstauskunft beruht.

## Zwei Angaben

| | |
|---|---|
| `source_comment` | die Nummer, wie GitHub sie vergeben hat |
| `source_ref` | `https://api.github.com/repos/pahlborn/agentarium/issues/comments/<nr>` |

Die Adresse wird aus `ENDPOINT` **gerechnet**, nicht zweimal hingeschrieben.
Sonst zeigte sie nach dem nächsten Umzug auf einen anderen Vorgang als den,
aus dem gelesen wurde.

Die API-Form ist gewählt, weil sie maschinell auflösbar ist und der
Kennungsform des Vertrags genügt. Die Web-Form
(`…/issues/2#issuecomment-<nr>`) enthält ein `#` und fiele durch dieselbe
Prüfung; für Menschen ist sie aus der Nummer trivial zu bilden.

## Geprüft wird der Zusammenhang, nicht nur die Form

Nummer und Adresse müssen zusammengehören: die Adresse muss auf **genau
diese** Nummer enden. Ein Paar aus Nummer A und Adresse B wäre ein Beleg,
der auf etwas anderes zeigt — schlimmer als keiner, weil er nachsehbar
aussieht. Passt es nicht, wird die Adresse fallen gelassen; die Nummer
bleibt, denn sie ist für sich genommen eine Angabe.

Das Original prüft das selbst, obwohl der Adapter die Adresse ableitet und
sie gar nicht falsch paaren könnte: Das Original ist auch ohne ihn aufrufbar.

## Wer den Beleg trägt

| Träger | Beleg |
|---|---|
| Ereignis | der Kommentar, in dem es stand |
| Aufgabe | der Kommentar, der sie **vergeben** hat |
| Klemme | der Kommentar, der sie **gemeldet** hat |

**Die Vergabe, nicht das letzte Ereignis** — und das ist keine Kleinigkeit.
Im Livebetrieb bekommt eine Aufgabe ihren Beleg beim `assigned`. Nähme die
Wiederherstellung den Beleg des zuletzt wirkenden Ereignisses, zeigte
dieselbe Lage je nach Weg auf zwei verschiedene Quellen. Genau das schließt
Atlas' Bedingung aus, dass Wiederherstellung und Live-Verarbeitung dieselbe
Lage ergeben. Der zuletzt wirkende Beleg geht als eigene Angabe mit
(`belegLetzte`), statt den ersten zu ersetzen.

## Wo er im Bild steht

- in der Tafel: `· Beleg Kommentar <nr>` an der Zeile des neuen Ereignisses
- in der Listenzeile: `· Beleg <nr>` hinter Projekt/Lauf/Aufgabe
- im Zustand abrufbar: `__agStand().aufgaben[].beleg` / `.belegRef` und
  `.klemmt[].beleg`

Das Letzte ist der Grund, warum eine **wiederhergestellte** Klemme ihren
Beleg braucht: Sie hat keine Listenzeile — ohne ihn gäbe es für sie keinen
Weg zurück zur Quelle.

## Was er nicht ist

`source_evidence` sagt die **Art** des Belegs (`runtime_stream` oder
`reported_checkpoint`), nicht seinen **Ort**. Die beiden Felder ersetzen
einander nicht.

Und: Ein auflösbarer Beleg macht aus einer Selbstauskunft keine verifizierte
Aussage. Er sagt, **wo** etwas behauptet wurde, nicht, **dass** es stimmt.
Alle Rollen schreiben weiter unter demselben GitHub-Login.

## Nachweis

`previews/AG-EVENT-JOURNAL-001/pruefen.js`, Teil K. Gegentest gelaufen: Ohne
die Weitergabe im Adapter fallen vier Zeilen durch.
