# AG-RELAY-ARCH-001 — Architektur- und Technologiecheck der Agentarium-Anbindung

**Prüfer:** Lot · **Datum:** 19.10.2026 · **Auftrag:** Peter — „sind sie auf dem
richtigen Weg, gibt es Fallstricke, nicht abgedeckte Risiken oder gar Fehler"

**Geprüfter Stand:** `main` bei `9b267a7`, zuzüglich der offenen Kandidaten
PR #33 (`544ab29`) und Auftrag #34.

**Gelesen** (vollständig, nicht in Auszügen): `relay/claude_public_relay_v2.py`
(669 Zeilen), `.github/workflows/claude-public-relay-v2.yml`,
`handoffs/AG-RELAY-PUBLIC-SEC-001.md`, `pilot/github-live/github-live.js`
(Parser und Blätterung), `pilot/github-live/index.html` (Brücke),
`relay/forge_one_shot.py`, alle sieben Dateien in `.github/workflows/`, der
Diff von PR #33.

**Nicht geprüft:** kein Lauf gestartet, kein Modellaufruf, keine Aktivierung.
Alles hier ist am Quelltext gelesen. Wo ich auf GitHubs Verhalten schließe,
steht es als Schluss da und nicht als Messung.

---

## Urteil in drei Sätzen

**Die Richtung ist richtig, und sie ist besser gebaut als das, was sie
ersetzt.** Die Jobtrennung prepare → run → publish mit einem Modelljob ohne
GitHub-Schlüssel ist die tragfähige Architektur für ein öffentliches
Repository; vier Argus-Runden haben echte Lücken geschlossen, und das sieht
man dem Programm an.

**Aber das Fail-closed-Versprechen hat genau an einer Stelle ein Loch, und
die Stelle ist die, an der schon ein Empfang sichtbar ist** (B1). Dazu kommt
ein Fallstrick, der den neuen Auftrag #34 unmittelbar betrifft und dort
mitgedacht werden muss (B2), und eine Architekturfrage, die niemand durch
Code lösen kann (B3).

**Nichts davon ist ein Rückbaugrund.** B1 und B2 sind kleine, lokale
Korrekturen; B3 bis B6 sind Risiken zum Benennen und Datieren, nicht zum
Sofort-Beheben.

---

## B1 — FEHLER, erreichbar: ein Empfang ohne Abschluss

**Befund.** `prepare()` veröffentlicht `HOST_RECEIVED` als **letzten Schritt
seiner Python-Funktion** (`relay/claude_public_relay_v2.py:238`). Im
Arbeitslauf folgt danach erst der Schritt, der das Bündel als Artefakt
hochlädt. Und `publish` ist bedingt auf
`if: always() && needs.prepare.result == 'success'`.

**Der Weg zum Schaden.** Scheitert der Upload-Schritt — Netz, Kontingent,
`if-no-files-found: error` —, dann gilt:

1. `HOST_RECEIVED` steht schon öffentlich auf Issue #2.
2. `prepare` ist `failure`, also wird `run` übersprungen.
3. `publish` wird **ebenfalls übersprungen**, weil es `prepare == success`
   verlangt.

Ergebnis: ein sichtbarer Empfang, zu dem **nie** eine Abschlussmeldung
kommt. Das ist genau das, was die Korrektur nach Argus V1 verhindern wollte
(„Fehlt nach Abbruch oder Timeout ein verwertbares Resultat, erzeugt der
getrennte Publisher … einen festen `BLOCKED`-Datensatz"). Die Zusage gilt
aber nur, solange `prepare` **erfolgreich** war.

**Warum es im Canary nicht auffiel.** Canary 001 scheiterte *vor* dem
Posten, an fehlenden versteckten Dateien — also ohne sichtbaren Empfang.
Der Fall „Empfang gepostet, danach gescheitert" ist noch nie eingetreten.

**Zwei saubere Korrekturen, beide klein.** Entweder den Empfang **nach** dem
Upload melden (eigener Schritt `relay_driver.py announce` hinter
`upload-artifact`) — dann ist ein Empfang nur sichtbar, wenn das Bündel
wirklich liegt. Oder `publish` auf `needs.prepare.result != 'cancelled'`
lockern und dort den Kontext aus dem Repository statt aus dem Artefakt
holen. **Ich empfehle die erste**, weil sie die Reihenfolge richtigstellt
statt eine zweite Quelle für den Kontext einzuführen.

**Für #34 bedeutet das:** Ein `handoff` atlas → forge wäre im Feld sichtbar,
ohne dass je ein `contribution` oder `progress` folgt. Der Ball bleibt
liegen, und niemand sieht, warum.

---

## B2 — FALLSTRICK, erreichbar, betrifft #34 unmittelbar: das Modell kann
seinen eigenen Lauf unsichtbar machen

**Befund.** `publish()` hängt den Handback **unverändert** an den
Kommentarkörper (`relay/claude_public_relay_v2.py:552`:
`body += "\n\n" + data.decode(errors="replace")[:4000]`). Geprüft wird er
vorher gegen Geheimnismuster (`secret_hit`) und gegen seinen SHA-256 — aber
**nicht** gegen Agentarium-Steuerzeichenfolgen.

Der Handback ist der einzige Text im ganzen Pfad, den **das Modell selbst
schreibt**.

**Der Weg zum Schaden, sobald #34 umgesetzt ist.** Der Monitor weist einen
Kommentar ab, wenn der Marker `<!-- AGENTARIUM_EVENT_V1 -->` **mehr als
einmal** vorkommt (`pilot/github-live/github-live.js:246`:
`if (body.indexOf(MARKER, i + MARKER.length) >= 0) return nein('Marker
mehrfach')`). Schreibt das Modell diese Zeichenfolge in seinen Handback —
versehentlich, etwa weil es über das Vertragsformat berichtet, oder
absichtlich —, dann trägt der Kommentar zwei Marker, und **das ganze
Ereignis wird verworfen**. Der Lauf hat stattgefunden, er ist bezahlt, und
im Feld erscheint nichts.

**Die Richtung ist richtig, die Sichtbarkeit nicht.** Es schlägt fehl, nicht
durch — ein gefälschtes Ereignis ist so nicht einzuschleusen, weil der
zweite Marker beide verwirft. Aber der Abweisungsgrund landet nur in der
Fußzeile des Monitors („Zuletzt abgewiesen: Marker mehrfach"), und dort sieht
niemand nach. Ein Ausfall, den nur der Verursacher auslösen kann und den
niemand bemerkt, ist schlechter als ein lauter Fehler.

**Gegenmaßnahme, und sie gehört in #34, nicht danach.** Den Agentarium-Marker
wie ein Geheimnis behandeln: vor der Veröffentlichung im Handback suchen und
bei Treffer entweder neutralisieren (Zeichenfolge brechen) oder den Handback
verwerfen und `BLOCKED` mit `failure="CONTROL_SEQUENCE_IN_HANDBACK"` melden.
Vier Zeilen neben dem bestehenden `secret_hit`.

**Allgemein, und das ist der eigentliche Satz:** Das Relais prüft Inhalte
gegen *Geheimnisse*, aber nicht gegen *Steuerzeichenfolgen des Empfängers*.
Sobald derselbe Kommentarkörper zwei Leser mit zwei Grammatiken hat — den
Relais-Marker und den Agentarium-Vertrag —, braucht jede Grammatik ihren
eigenen Schutz.

---

## B3 — ARCHITEKTUR: der Vertrauensanker ist eine geteilte Identität

**Befund.** Drei Stellen verankern Vertrauen in einer Kennung:

| Stelle | Anker |
|---|---|
| `claude-public-relay-v2.yml`, `prepare.if` | `github.actor_id == '277496791'` |
| `relay/claude_public_relay_v2.py:196` (`prepare`) | `GITHUB_ACTOR_ID == "277496791"` |
| `relay/claude_public_relay_v2.py:40,155` (`trusted_terminal_row`) | `github-actions[bot]`, ID `41898282` |
| `pilot/github-live/github-live.js:33` | `LOGINS = { pahlborn, github-actions[bot] }` |

Die ersten beiden sind Peters Konto — **unter dem alle Agenten handeln**. Die
dritte und vierte sind die Bot-Identität, die **jeder** Arbeitslauf des
Repositoriums trägt. Fünf der sieben Arbeitslaufdateien haben
`issues: write`, und sie sind namentlich: `claude-public-relay-v2.yml`,
`agentarium-relay.yml`, `archibald-relay.yml`, `forge-relay.yml` — und
**`team-review-20261016.yml`**, die mit dem Relais nichts zu tun hat. Damit
ist die Aussage nicht theoretisch: es gibt heute einen Arbeitslauf, der auf
Issue #2 schreiben darf und kein Relais ist.

**Was das heißt, und was nicht.** Die Prüfungen schließen **Fremde** wirksam
aus: ein Fork, ein anderer Nutzer, eine Fork-Pull-Anfrage kommen nicht durch,
und der Auslöser ist `push` statt `pull_request_target` — das ist richtig
gebaut. Sie trennen aber **keine Agenten voneinander** und **keine
Arbeitsläufe voneinander**. Zwei Folgen:

1. **Monitorseitig:** Der Monitor glaubt jedem vertragsgültigen Ereignis von
   `github-actions[bot]`. Ein beliebiger anderer Arbeitslauf könnte ein
   Ereignis mit `actor: forge` schreiben, und im Feld erschiene forge bei
   einer Arbeit, die forge nie getan hat. Es gibt keinen zweiten Faktor —
   keine Signatur, keine Laufbindung, keine Herkunftsprüfung über die
   Bot-Identität hinaus.
2. **Relaisseitig:** `trusted_terminal_row` kann von jedem Bot-Kommentar
   bedient werden, dessen erste Zeile das Marker-Muster bildet. Das sperrt
   eine berechtigte Aufgabe (Verfügbarkeit), es leckt nichts.

**Mein Rat: benennen, nicht sofort bauen.** Eine echte Trennung bräuchte je
Agent eine eigene App-Identität oder eine Signatur über den Ereigniskörper —
beides ist deutlich mehr Umfang als der heutige Nutzen rechtfertigt. Was ich
**jetzt** empfehle, ist eine Zeile im Vertrag: Der Monitor sollte zusätzlich
`source_tool_id` gegen eine kurze Erlaubnisliste prüfen, statt jedem Bot zu
glauben. Das kostet drei Zeilen und macht aus „irgendein Arbeitslauf" ein
benanntes Werkzeug. Es ersetzt keine Signatur und soll es nicht.

---

## B4 — FALLSTRICK, operativ: der zweite Auftrag geht nicht ohne Löschcommit

**Befund.** `ACTIVATION` ist ein **fester Pfad** für alle Aufträge:
`handoffs/activate/AG-RELAY-PUBLIC-SEC-001.json`
(`relay/claude_public_relay_v2.py:27`). Und `prepare()` verlangt
(`:201`):

```python
if changes != ["A\t" + ACTIVATION]:
    raise RuntimeError("activation commit must add only " + ACTIVATION)
```

`A` heißt **hinzugefügt**. Ein zweiter Auftrag, der dieselbe Datei erneut
schreibt, erzeugt `M` (geändert) und wird abgewiesen. Der Weg für Auftrag
zwei ist also: erst ein Commit, der die Datei **löscht**, dann ein Commit,
der sie neu anlegt. Das steht nirgends — nicht im Handoff, nicht im
Arbeitslauf, nicht im Programm.

**Dazu zwei kleinere Unstimmigkeiten in PR #33:**

- Die Beschreibung sagt, der Auslöser gelte für `agent/ag-relay-*`; die YAML
  sagt `agent/ag-relay-task-*`. Wer der Beschreibung folgt, legt einen Zweig
  an, der nicht auslöst — und sieht keinen Fehler, sondern **nichts**.
- Der Zweig des bewiesenen Canary 003, `agent/ag-relay-public-sec-001`, löst
  nach #33 **nicht mehr** aus. Das ist gewollt („frische Zweige"), aber es
  heißt: der einzige Weg, der nachweislich funktioniert hat, ist nach dem
  Merge kein gültiger Weg mehr. Der erste Lauf auf dem neuen Muster ist
  wieder ein Erstlauf.
- Der Pfadfilter nennt weiter nur die eine Aktivierungsdatei, während der
  Zweigname jetzt generisch ist. Name und Geltung laufen auseinander.

**Gegenmaßnahme, gering:** Entweder den Aktivierungspfad je Aufgabe
(`handoffs/activate/<task_id>.json`, Pfadfilter
`handoffs/activate/*.json`) und `changes` gegen genau **eine** hinzugefügte
Datei unter diesem Verzeichnis prüfen — das löst Umbenennung und Löschzwang
in einem. Oder, wenn es beim festen Pfad bleibt, den Löschcommit im Handoff
als Schritt 0 dokumentieren. Beides ist in Minuten getan; ungetan kostet es
beim zweiten Auftrag eine Stunde Ratlosigkeit.

---

## B5 — RISIKO, datiert: Issue #2 ist Kanal und Archiv zugleich

Beide Seiten lesen die **ganze** Historie eines Vorgangs, der nur wächst.

| Seite | Verhalten | Grenze |
|---|---|---|
| Monitor | liest beim Start **alle** Basisseiten, bevor die Verbindung als live gilt (`github-live.js:455 ff.`) | `MAX_SEITEN = 100` × `per_page=100` → oberhalb von **~10.000 Kommentaren** erreicht er die neuesten **nie mehr**, und zwar ohne Fehlermeldung: die Schleife endet einfach |
| Relais | `history_contains_terminal` blättert bei **jedem** `prepare` die ganze Historie | Abbruch erst bei Seite 10.000; praktisch unkritisch, aber linear wachsende Kosten je Lauf |

Heute sind das wenige Abrufe. Die Zahl, auf die es ankommt, ist **10.000
Kommentare** — danach ist der Monitor blind für Neues, während er „verbunden"
anzeigt. Das ist weit weg, aber es ist eine Zahl, und sie gehört
aufgeschrieben, bevor sie jemand überrascht.

**Gegenmaßnahme, wenn es soweit ist, nicht vorher:** der Monitor sollte von
**hinten** lesen (letzte Seite zuerst) statt von vorn, oder die Historie
nach `since` begrenzen. Beides ist eine Änderung am Adapter und damit eine
Fassungsänderung — kein Grund, sie heute zu machen.

---

## B6 — RISIKO: drei tote Relais, die sich wieder bewaffnen

`agentarium-relay.yml`, `archibald-relay.yml` und `forge-relay.yml` gaten
ihre bezahlten Jobs auf `github.event.repository.private == true`; auch
`relay/forge_one_shot.py:90` scheitert absichtlich, wenn das Repository nicht
privat ist. Das Repository **ist öffentlich** — diese drei Wege sind damit
toter Code. (Das ist derselbe Befund, der #30 ausgelöst hat; er ist hier nur
der Vollständigkeit wegen notiert.)

**Was daran ein Risiko bleibt:** Sie sind nicht entfernt, sondern
stillgelegt — und zwar durch eine **Repository-Einstellung**, nicht durch
Code. Würde das Repository je privat gestellt, wären sie sofort wieder
aktiv, und sie halten dabei:

- `issues: write` und `GH_TOKEN` **im selben Job** wie den Modelllauf,
- `ANTHROPIC_API_KEY` in einem Job mit GitHub-Schlüssel — genau die
  Vermischung, die v2 auflöst,
- `npm install --global @anthropic-ai/claude-code` **ohne Version** und
  `actions/checkout@v4` ohne Commit-Hash, also beides driftend.

**Mein Rat:** Wenn v2 der Weg ist, sollten die drei **entfernt** werden und
nicht stillgelegt bleiben. Eine Sicherheitsarchitektur, die von einem
Schalter in den Repository-Einstellungen abhängt, ist keine. Das ist eine
Entscheidung für Atlas und Peter, kein Befund.

---

## Was ausdrücklich richtig gebaut ist

Das gehört genauso in einen Check wie die Mängel, sonst liest er sich
schlechter als die Sache ist:

- **Die Jobtrennung trägt.** Der Modelljob hat `contents: none`, keinen
  Checkout und keinen GitHub-Schlüssel. Das ist die richtige Grenze, und sie
  ist nicht bloß behauptet, sondern an den `permissions`-Blöcken ablesbar.
- **Umgebung per Erlaubnisliste, nicht per Sperrliste.** `child_environment()`
  gibt genau sechs Variablen weiter. Eine Sperrliste hätte die nächste
  Tokenvariable übersehen; `TOKEN_KEYS` dient nur noch dem Selbsttest, und
  das ist die richtige Rolle dafür.
- **Auslöser `push` statt `pull_request_target`.** Damit ist der klassische
  Weg, auf dem fremder Code in einem öffentlichen Repository an Geheimnisse
  kommt, von vornherein zu.
- **Actions auf Commit-Hashes gepinnt**, CLI-Version im v2-Lauf exakt
  (`@2.1.302`). Beides im Gegensatz zu den alten Relais.
- **Paketgleichheit für `BLOCKED`.** `package_files != {"metadata.json",
  "BLOCKED.txt"}` schlägt fehl, wenn ein Handback liegen bleibt. Ein
  Teilergebnis kann nicht als neutraler Block durchgehen.
- **Bool- und NaN-Lücken geschlossen.** `finite_number()` schließt `bool`
  ausdrücklich aus — das ist die Art Detail, die man beim ersten Mal
  übersieht und die hier nach V3 steht.
- **Der Monitor liest den `Link`-Kopf, folgt ihm aber nicht.** Er übernimmt
  nur die Seitenzahl und baut die Adresse selbst
  (`github-live.js:363 ff.`). Genau richtig für Daten von außen.
- **Der Monitor blättert.** Mein erster Verdacht war, er lese nur die
  ältesten hundert Kommentare und sähe neue Ereignisse nie. Nachgesehen:
  falsch — er liest alle Basisseiten und verfolgt dann die letzte. Der
  Verdacht gehört hierher, damit niemand ihn ein zweites Mal hat.

---

## Empfehlung, nach Dringlichkeit

| | Was | Umfang | Wer |
|---|---|---|---|
| 1 | **B2** mitbauen, solange #34 offen ist: Agentarium-Marker im Handback wie ein Geheimnis prüfen | 4 Zeilen | Lot, in #34 |
| 2 | **B1** beheben: Empfang erst nach dem Artefakt-Upload melden | 1 Schritt im Arbeitslauf, 1 Unterbefehl | Atlas/Forge |
| 3 | **B4** entschärfen: Aktivierungspfad je Aufgabe, oder Löschcommit dokumentieren; Beschreibung von #33 auf `agent/ag-relay-task-*` richtigstellen | klein | Atlas |
| 4 | **B3** als Vertragszeile: `source_tool_id` gegen eine Erlaubnisliste im Monitor | 3 Zeilen | Lot, nach #34 |
| 5 | **B6** entscheiden: drei alte Relais entfernen statt stilllegen | Entscheidung | Atlas/Peter |
| 6 | **B5** notieren und datieren, nichts bauen | — | — |

## Nachtrag bei der Aufnahme, 19.10. abends

Zwischen dem Schreiben und der Aufnahme ist **PR #33 gemergt** (`3304625`).
Zwei Stellen oben sind damit überholt, und das gehört dazu, statt den Text
stillschweigend stimmig zu machen:

- Der Zweig des bewiesenen Canary 003 löst **jetzt tatsächlich** nicht mehr
  aus; in B4 stand es als Folge eines noch offenen Kandidaten.
- Vor dem Merge habe ich einen **Fehlalarm** fast gemeldet: Ein Zwei-Punkt-Diff
  (`git diff main zweig`) zeigte, dass #33 Fassung 54, den Hover-Fix der
  Griffe, Teil F des Blocknachweises und drei `CLAUDE.md`-Abschnitte löscht.
  Das war falsch — der Zweig lag nur hinter `main`, und ein Merge spielt nur
  die Änderungen ab der Merge-Basis ein. **Gemessen** per Probemerge vor dem
  Merge und erneut am gemergten `main` danach: Fassung 54, `agentarium-v54`,
  der 28-px-Griff, Teil F und alle drei Abschnitte sind unverändert da.
  Es war der zweite Fehlalarm des Tages in Richtung der dramatischeren
  Behauptung.

Das Instrument gehört in die Tabelle in `CLAUDE.md`, ist dort aber noch nicht
eingetragen: *Ein Zwei-Punkt-Diff auf einem Zweig, der hinter `main` liegt,
sagt „diese Zeilen würden gelöscht" — er sagt nur, dass der Zweig alt ist.
Drei Punkte nehmen, oder probemergen.*

**B1 bis B3, B5 und B6 sind von #33 unberührt** und stehen unverändert.

## Grenze dieses Checks

Gelesen, nicht gelaufen. Kein Arbeitslauf gestartet, kein Modell gerufen,
keine Aktivierung angelegt. B1, B2 und B4 sind aus dem Quelltext **ableitbar**
und sollten von Sentinel **nachgestellt** werden, bevor jemand sie als
bewiesen weitergibt — B1 durch ein erzwungenes Scheitern des Upload-Schritts,
B2 durch einen Handback, der die Markerzeichenfolge enthält, B4 durch einen
zweiten Aktivierungscommit auf dieselbe Datei. Erst dann sind es Messungen
und nicht Lesefrüchte.
