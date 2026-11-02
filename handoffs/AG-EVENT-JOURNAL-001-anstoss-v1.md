# AG-EVENT-JOURNAL-001 — Anstoß und Weitergabe: jede Übergabe ist ein Ball

Auftrag `AG-MON-ANSTOSS-001`, Peter, 23.10.2026. Ergänzt den Ereignisvertrag
`agentarium.github-event.v1`. **Am Monitor wird nichts geändert**, es fehlte
eine Meldepflicht.

## Ziel

Gibt Peter Atlas eine Aufgabe, sieht er im verbundenen Monitor zuerst einen
Ball von sich zu Atlas. Am Ende kommt das Ergebnis zurück. Dasselbe gilt,
wenn Atlas eine Aufgabe an einen Agenten weitergibt und dieser liefert.

## Was der Monitor heute zeigt (geprüft an Fassung 71)

| Ereignis | Im Bild | Aufgabe in der Liste |
|---|---|---|
| `handoff` | **Ball** („Sonne") vom `actor` zum `recipient` | nein |
| `contribution` | Wurf vom `actor` zum `recipient`, **heute nur ein feiner Schweif** | nein |
| `assigned` | **kein Ball**, eine Meldung mit Puls | **ja**, beim `recipient` |

Einen Ball werfen also nur `handoff` und `contribution`. Ein `assigned` allein
bleibt unsichtbar unterwegs. Darum braucht jede Weitergabe **beides**.

Dass eine Rückgabe als Ball erscheint, ist eine eigene, spätere Bildänderung
(`AG-MON-RUECKGABE-001`, Peter, 23.10.).

## Die Regel

1. **Anstoß.** Erhält Atlas eine Aufgabe von Peter, ist sein **erstes**
   Ereignis ein `handoff` mit `actor: peter`, `recipient: atlas`,
   `reporter: atlas` und der `task_id` der Aufgabe. Erst danach folgen
   `assigned`. `started` folgt nur aus einem belegten tatsächlichen
   Workerbeginn nach der Laufzeitregel unten; die Auftragsannahme reicht nicht.
2. **Weitergabe.** Gibt Atlas eine Aufgabe an einen Agenten weiter, meldet er
   **zuerst** `handoff` von Atlas an den Agenten (der Ball) und **dann**
   `assigned` an den Agenten (legt die Aufgabe an).
   **Jede Teilaufgabe hat ihre eigene `task_id`** (`<AUFGABE>-01`,
   `<AUFGABE>-02`, …) und trägt `parent_id: <AUFGABE>`, also die ID des
   Auftrags, zu dem sie gehört (Peter, 26.10.). Sonst fallen zwei Weitergaben
   an denselben Agenten im Monitor zu **einem** Teilball zusammen.
3. **Ergebnis.** Der Agent gibt sein Ergebnis als `contribution` an Atlas
   zurück, mit der `task_id` **seiner Teilaufgabe** und derselben
   `parent_id`. Gemeldet wird es vom Agenten selbst oder, wie bisher, von
   Atlas für ihn.
4. **Abschluss.** Das Ergebnis geht als `contribution` von Atlas an Peter.
   Im Monitor fliegt Peters Ball zu ihm und **liegt dort bis zur Annahme**.
4a. **Annahme durch Peter** (Peter, 24.10.). Sagt Peter Atlas, dass er das
   Ergebnis annimmt, meldet Atlas für ihn `accepted` mit `actor: peter`,
   `reporter: atlas` und derselben `task_id` wie der Anstoß (Baustein 5).
   Erst dann verschwindet Peters Ball. Das ist die **einzige** Meldung für
   einen anderen, die der Monitor gelten lässt, und sie wirkt nur auf den
   Ball.
5. **Reihenfolge am Gerät bei gewählter Live-Anzeige.** Peter verbindet den Monitor, **bevor** er die
   Aufgabe schickt. Ohne Live-Anzeige wird dieselbe Arbeit dauerhaft journalisiert.
   Was beim Verbinden schon da liegt, wird bewusst nicht
   nachgespielt (Regel vom 21.10.).

Alle Ereignisse einer Aufgabe tragen dieselbe `project_id`, `run_id` und
`task_id`. Anstoß, Abschluss und Annahme tragen die ID von Peters Auftrag,
Weitergabe, Vergabe und Ergebnis die ID der Teilaufgabe.

## Projekt und Lauf (Peter, 25.10.)

Projekt → Läufe → Aufgaben. Ein **Lauf** ist ein Auftrag von Peter, vom
Anstoß bis zur Rückgabe; er kann mehrere Aufgaben haben.

6. **Projekt-ID aus dem Verzeichnis.** `project_id` ist immer die `id` eines
   Projekts aus `projekte/verzeichnis.json`. Läufe ohne Projektbezug (Fragen)
   gehören zu `allgemein`.
7. **Lauf-ID mit Kürzel.** `run_id` beginnt mit dem `kuerzel` des Projekts,
   z. B. `AG-…` für `agentarium`, `ALLG-…` für `allgemein`.
8. **Neues Projekt zuerst eintragen.** Startet Peter ein neues Projekt, trägt
   Atlas es **vor der ersten Meldung** ins Verzeichnis ein: `id` (klein),
   `kuerzel` (2–5 Zeichen, groß), `name`, `repo` (`besitzer/name` oder
   `null`). Atlas meldet Peter ID und Kürzel. Das Repo legt Peter in der
   Regel selbst an. `previews/AG-PROJEKTE-001/pruefen.js` prüft das
   Verzeichnis bei jedem Prüflauf.

Der Monitor zeigt künftig nur Projekte aus dem Verzeichnis.

## So wird gemeldet

- **Ort:** ein Kommentar auf **Issue #2**. Nur dort liest der Monitor.
- **Ein Ereignis je Kommentar.** Zwei Marker in einem Kommentar verwirft der
  Adapter ganz („Marker mehrfach").
- Erste Zeile `<!-- AGENTARIUM_EVENT_V1 -->`, **direkt darunter** der
  JSON-Block. Danach darf Text folgen.
- Pflichtfelder: `schema`, `id`, `project_id`, `run_id`, `task_id`, `actor`,
  `kind`, `title` (höchstens 200 Zeichen), `occurred_at` (ISO-Zeit),
  `source_evidence` (`reported_checkpoint` oder `runtime_stream`),
  `source_tool_id`. Bei `handoff`, `contribution` und `assigned` zusätzlich
  `recipient`. Bei `assigned` zusätzlich `reporter`.
- Unbekannte Felder werden abgewiesen. Rollennamen sind klein geschrieben.

## Bausteine zum Ausfüllen

Zu ersetzen ist alles in `<…>`. Die `id` ist je Ereignis neu und eindeutig.
`<PROJEKT-ID>` und `<KÜRZEL>` stehen in `projekte/verzeichnis.json`.
`<AUFGABE>` ist die ID von Peters Auftrag, `<TEILAUFGABE>` die eigene ID
einer weitergegebenen Teilaufgabe (`<AUFGABE>-01`, `<AUFGABE>-02`, …).

**1. Anstoß: Peter → Atlas** (Atlas meldet)

````
<!-- AGENTARIUM_EVENT_V1 -->
```json
{
  "schema": "agentarium.github-event.v1",
  "id": "<AUFGABE>-ANSTOSS-<zeitstempel>",
  "project_id": "<PROJEKT-ID>",
  "run_id": "<KÜRZEL>-<LAUF>",
  "task_id": "<AUFGABE>",
  "actor": "peter",
  "recipient": "atlas",
  "reporter": "atlas",
  "kind": "handoff",
  "title": "Peter gibt Atlas: <kurz, was>",
  "occurred_at": "<ISO-Zeit, z. B. 2026-10-23T14:05:00Z>",
  "source_evidence": "reported_checkpoint",
  "source_tool_id": "atlas-current-chat"
}
```
````

**2a. Weitergabe: Atlas → Agent** (der Ball, zuerst)

````
<!-- AGENTARIUM_EVENT_V1 -->
```json
{
  "schema": "agentarium.github-event.v1",
  "id": "<TEILAUFGABE>-WEITER-<agent>-<zeitstempel>",
  "project_id": "<PROJEKT-ID>",
  "run_id": "<KÜRZEL>-<LAUF>",
  "task_id": "<TEILAUFGABE>",
  "parent_id": "<AUFGABE>",
  "actor": "atlas",
  "recipient": "<agent>",
  "reporter": "atlas",
  "kind": "handoff",
  "title": "Atlas gibt <agent>: <kurz, was>",
  "occurred_at": "<ISO-Zeit>",
  "source_evidence": "reported_checkpoint",
  "source_tool_id": "atlas-current-chat"
}
```
````

**2b. Vergabe: Atlas → Agent** (legt die Aufgabe an, danach, eigener Kommentar)

````
<!-- AGENTARIUM_EVENT_V1 -->
```json
{
  "schema": "agentarium.github-event.v1",
  "id": "<TEILAUFGABE>-VERGABE-<agent>-<zeitstempel>",
  "project_id": "<PROJEKT-ID>",
  "run_id": "<KÜRZEL>-<LAUF>",
  "task_id": "<TEILAUFGABE>",
  "parent_id": "<AUFGABE>",
  "actor": "atlas",
  "recipient": "<agent>",
  "reporter": "atlas",
  "kind": "assigned",
  "item_type": "task",
  "title": "Atlas vergibt an <agent>: <kurz, was>",
  "occurred_at": "<ISO-Zeit>",
  "source_evidence": "reported_checkpoint",
  "source_tool_id": "atlas-current-chat"
}
```
````

**3. Ergebnis: Agent → Atlas**

````
<!-- AGENTARIUM_EVENT_V1 -->
```json
{
  "schema": "agentarium.github-event.v1",
  "id": "<TEILAUFGABE>-ERGEBNIS-<agent>-<zeitstempel>",
  "project_id": "<PROJEKT-ID>",
  "run_id": "<KÜRZEL>-<LAUF>",
  "task_id": "<TEILAUFGABE>",
  "parent_id": "<AUFGABE>",
  "actor": "<agent>",
  "recipient": "atlas",
  "reporter": "<agent, oder atlas wenn Atlas für ihn meldet>",
  "kind": "contribution",
  "title": "<agent> gibt Atlas zurück: <kurz, was>",
  "occurred_at": "<ISO-Zeit>",
  "source_evidence": "reported_checkpoint",
  "source_tool_id": "<werkzeug des Meldenden>"
}
```
````

**4. Abschluss: Atlas → Peter**

````
<!-- AGENTARIUM_EVENT_V1 -->
```json
{
  "schema": "agentarium.github-event.v1",
  "id": "<AUFGABE>-ABSCHLUSS-<zeitstempel>",
  "project_id": "<PROJEKT-ID>",
  "run_id": "<KÜRZEL>-<LAUF>",
  "task_id": "<AUFGABE>",
  "actor": "atlas",
  "recipient": "peter",
  "reporter": "atlas",
  "kind": "contribution",
  "title": "Atlas gibt Peter das Ergebnis: <kurz, was>",
  "occurred_at": "<ISO-Zeit>",
  "source_evidence": "reported_checkpoint",
  "source_tool_id": "atlas-current-chat"
}
```
````

**5. Annahme durch Peter** (Atlas meldet für Peter, erst wenn Peter es sagt)

````
<!-- AGENTARIUM_EVENT_V1 -->
```json
{
  "schema": "agentarium.github-event.v1",
  "id": "<AUFGABE>-ANNAHME-<zeitstempel>",
  "project_id": "<PROJEKT-ID>",
  "run_id": "<KÜRZEL>-<LAUF>",
  "task_id": "<AUFGABE>",
  "actor": "peter",
  "reporter": "atlas",
  "kind": "accepted",
  "title": "Peter nimmt an: <kurz, was>",
  "occurred_at": "<ISO-Zeit>",
  "source_evidence": "reported_checkpoint",
  "source_tool_id": "atlas-current-chat"
}
```
````

## Laufzeitmeldungen aller Rollen — AG-LAUFZEIT-001 (Peter, 02.11.2026)

Die tatsächlich ausführende **Startstelle** meldet Beginn und Ende ihrer
Workerausführung. Die Sprachmodellrolle wird dafür nicht zum Selbstauskunftgeber.
Das gilt für alle maschinellen Rollen und echte Vertreter. Eine Hostmeldung
über ihren eigenen beobachteten Worker ist keine als Eigenmeldung der Rolle
verkleidete Fremdmeldung. Die oben beschriebene Ausnahme für Peters Annahme
betrifft Kundenautorität; sie ersetzt keinen Laufzeitbeleg.

### Pflichtbausteine der Startstelle

| Baustein | Auslöser und Aussage | Erforderliche Zuordnung |
|---|---|---|
| Beginn `started` | Beobachteter Beginn der beauftragten Workerarbeit; kein bloßer Empfang, Workflow-/Prozessstart oder Session-Init | Projekt, logischer Lauf, Aufgabe, Elternauftrag falls vorhanden, Arbeitsrolle, echte Startstelle und eindeutiger Ausführungsversuch; überprüfbarer konkreter Laufbeleg |
| Ende `delivered` | Der gleiche Worker hat seinen Ergebnislauf beendet; Ergebnis darf fachlich FAIL oder BLOCKED lauten | Dieselbe Versuchsbindung und originaler Endbeleg; keine Annahme oder Abnahme |
| Ende `aborted` | Der gleiche belegte Versuch wurde tatsächlich abgebrochen/fehlgeschlagen beendet | Dieselbe Versuchsbindung und beobachteter Abbruchbeleg; kein erfundener Stop bei Schweigen |

Alle drei tragen `source_evidence: runtime_stream`, **nur wenn** der Ursprung
geprüft und dem konkreten Lauf zugeordnet ist. Arbeitsrolle, meldende Startstelle
und technischer Publisher bleiben unterscheidbar. Der Reporter ist die wahre
Startstelle; Atlas setzt nicht den Rollennamen eines anderen als Reporter ein.
Ein frei gesetzter Name oder URL beweist nichts. Das konkrete, versionierte
Feldschema für Hostidentität, Versuchs- und Laufbeleg ist Teil des zu prüfenden
Produzentenvertrags; diese Tabelle behauptet keine bereits akzeptierten neuen
V1-Felder. Keine Platzhalter oder unbekannten Felder in den heutigen Kanal senden.

Die Startstelle hält Ereigniszeit und Empfangs-/Veröffentlichungszeit auseinander.
Die `run_id` des fachlichen Auftrags bleibt erhalten; GitHub-Workflowlauf und
Sitzung gehören zum konkreten Ausführungsbeleg. Wiederholungen/Fortsetzungen
bekommen eigene Versuche. Zustellwiederholung erhält dieselbe Ereigniskennung;
ein spätes Ende darf keinen anderen Versuch beenden. Ein späterer Fehler darf
einen früher sicher beobachteten Start nicht aus der Historie löschen.

Fehlt ein Start- oder Endbeleg, bleibt die entsprechende Aussage **unbekannt**.
Keine Ersatzregel aus Übergabe, Queue, Reporterliteral oder vermuteteter Arbeit.
Ohne gültigen aktuellen Arbeitsbeleg bleibt es beim Puls. Bei Quellenverlust
oder fehlendem Ende ist der aktuelle Zustand mit dem echten Host abzugleichen,
nicht aus einem alten `started` als heutige Arbeit zu behaupten.

Read-only-Rollen erhalten keine zusätzlichen Schreibrechte. Unverfügbare native
Hostanschlüsse werden mit Verantwortlichem und nächstem Nachweis als Lücke
geführt, nicht durch Rollenwechsel oder neue Secrets verdeckt. Dauerhafte,
bereinigte Belege und dasselbe append-only Journal dienen Live und Archiv,
auch wenn keine Live-Anzeige gewählt ist. Fehlende historische Ereignisse
werden nicht nachgebaut.

**Einführung:** Die bisherigen Kommunikationsbausteine bleiben bestehen.
Ein `contribution`, auch wahrheitsgemäß von Atlas veröffentlicht, ist weiterhin
kein Arbeitsbeleg. Neue Laufzeitbausteine werden erst mit geprüftem konkretem
Produzentenvertrag und kompatibler Konsumentenversion aktiviert. Keine Änderung
am Monitor vor den belegten Teilen 1 und 2; die Regeländerung allein beweist
keinen funktionierenden Anschluss und gibt keine Infrastruktur frei.

## Was das nicht ist

- Kein Arbeitsbeginn und keine Abnahme. `handoff` und `contribution` sind
  beobachtete Kommunikation (AG-GH-LIVE-004). Den Zustand einer Aufgabe
  treiben weiter nur die Lebenszyklus-Arten.
- Kein Beleg, dass Atlas die Regel befolgt. Atlas' Anweisungen liegen nicht
  in diesem Repository. **Wer die Regel dorthin überträgt, ist offen.**

## Nachweis

`previews/AG-MON-ANSTOSS-001/pruefen.js`. Er verbindet zuerst, spielt dann die
Folge 1 → 2a/2b → 3 → 4 ein und nimmt je Ball ein Bild im Flug auf.

- Ein Anstoß, der vor dem Verbinden da lag, wird nicht nachgespielt.
- Die vier Flüge laufen in der richtigen Reihenfolge, `assigned` wirft keinen.
- Die Aufgabe liegt nach 2b bei `forge`.
- Alle fünf Ereignisse sind ausgegeben, ohne Seitenfehler.

Lokal am 23.10.: 18 von 18 bestanden. Auf den Bildern sind Ball 1 und 2
deutlich zu sehen, 3 und 4 nur als Schweif (siehe oben).

## Abschlussabgleich #108 — Peter beauftragt, 31.10.2026

Die vorhandene Ausnahme `accepted`, actor `peter`, reporter `atlas` schließt zusätzlich die exakt zugehörige Atlas-Hauptaufgabe ohne parent_id. Sie wirkt weiterhin nicht als Selbstannahme, auf fremde Rollen oder Atlas-Teilaufgaben. Die echte Kundenannahme bleibt erforderlich; vorhandene Annahmen werden wieder gefaltet, nicht erfunden oder erneut als Flug abgespielt.

Ein tatsächlich eigener Abbruch `aborted`, actor `atlas`, reporter `atlas` beendet zusätzlich den zugehörigen Hauptball, wenn dessen ursprünglicher Auftragnehmer Atlas war. Projekt, Lauf und Aufgabe müssen exakt übereinstimmen. Fremde/fehlende Auftragnehmer, andere Aufgaben und Teilbälle bleiben erhalten. Das gilt live, beim Wiederverbinden und Archivsprung. Keine Annahme des verworfenen Ergebnisses wird fingiert.

Dieser begrenzte Nachtrag ersetzt für diese beiden Fälle frühere Aussagen „nur auf den Ball“ bzw. „nur accepted entfernt den Hauptball“. Übrige Regeln bleiben bestehen. Implementierung/Prüfung im Abschluss-PR zu #108, tatsächlicher Autor Atlas; Lot wurde nicht gestartet.

## Teilaufgaben-Vertretung — AG-MON-VERTRETUNG-001 (Peter, 01.11.2026)

`reassigned` ist eine eigene, atomare Übergabe derselben **delegierten Teilaufgabe**.
Peters Hauptauftrag und Hauptball bleiben bei Atlas. Ein `handoff` oder zweites
`assigned` ist kein Ersatz für eine Vertretungsübergabe. Ein zusätzlicher Ball
wird dabei nicht angelegt. Die ursprüngliche Vergabe und Übergabehistorie bleiben
nachvollziehbar.

Erlaubt ausschließlich mit `actor: atlas`, `reporter: atlas`, bekanntem
`recipient`, unverändertem `project_id`, `run_id`, `task_id` und nichtleerem,
unverändertem `parent_id`. Zusatzfelder (nur hier erlaubt):

- `previous_holder`: exakt bisheriger Halter;
- `stop_ref`: konkreter GitHub-Beleg des beendeten Laufs oder des wirksamen
  Entzugs seines Auftrags. Ein bloßer Timeout oder Schweigen reicht nicht;
- `checkpoint_ref`: konkreter GitHub-Beleg des geprüften Arbeitsstands;
  ausdrücklich `no-checkpoint`, wenn kein verwertbarer Stand vorhanden ist.
  Der Verlust ist dann in `title`/Begleittext zu nennen.

Atlas prüft den Inhalt der Originalbelege vor der Meldung. Der Monitor validiert
Form und Zuständigkeitsbezug; eine URL allein ist **kein** verifizierter Stop.
Ohne bestätigten Stop/Entzug bleibt die Übernahme blockiert. Vertreter werden
als eigene tatsächliche Identität/Plattform ausgewiesen (`springer`: ChatGPT/Codex),
nicht als vermeintlicher Claude-Lauf. `reassigned` bedeutet zugewiesen, nicht
empfangen/begonnen oder fachlich abgeschlossen. Späte Meldungen des abgelösten
Halters ändern den Nachfolger nicht. Ein Transfer des Hauptballs wird abgewiesen.
Offene Sachblockaden bleiben erhalten und werden als übernommene offene Blockaden
angezeigt; der Vertreter löst nur die konkret behobene Blockade mit `resolved`.

Ist ein Worker ausgefallen, darf Atlas eine **eigene Blockadefeststellung** melden:
`kind: blocked`, `actor: atlas`, `reporter: atlas`, `recipient: <aktueller Halter>`,
`blocker_id`, exakter Aufgabenschlüssel und belegter Grund. Das ist keine
Selbstauskunft des ausgefallenen Workers. Es wirkt nur auf dessen exakt passende
bestehende Aufgabe. Schweigen ohne Nachweis wird nicht zum Ausfall umgedeutet.

```json
{
  "schema": "agentarium.github-event.v1",
  "id": "AG-BEISPIEL-01-VERTRETUNG-1",
  "project_id": "agentarium",
  "run_id": "AG-BEISPIEL",
  "task_id": "AG-BEISPIEL-01",
  "parent_id": "AG-BEISPIEL",
  "actor": "atlas",
  "reporter": "atlas",
  "recipient": "springer",
  "kind": "reassigned",
  "previous_holder": "forge",
  "stop_ref": "https://github.com/pahlborn/agentarium/issues/2#issuecomment-123456789",
  "checkpoint_ref": "no-checkpoint",
  "title": "Synthetisches Muster: Vertreter übernimmt; kein verwertbarer Checkpoint",
  "occurred_at": "2026-11-01T06:00:00Z",
  "source_evidence": "reported_checkpoint",
  "source_tool_id": "atlas-current-chat"
}
```

Das Muster ist keine echte Übergabe und darf nicht als solche gemeldet werden.
Technische GitHub-Läufe erscheinen separat im Livefach (höchstens fünf neueste
je verzeichnetem Repository, frühestens alle 60 Sekunden bei sichtbarer,
verbundener Seite). Ein erfolgreicher Lauf beweist keinen Agentenstart und keinen
fachlichen Abschluss. Lesefehler bleiben unbekannt. Keine Hintergrund-Worker,
Modellaufrufe, automatische bezahlte Wiederholung oder automatische Vertreterwahl
werden dadurch aktiviert; Atlas führt die Übergabe im aktiven Auftrag aus.

