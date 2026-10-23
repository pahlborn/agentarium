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
   `assigned` und `started`.
2. **Weitergabe.** Gibt Atlas eine Aufgabe an einen Agenten weiter, meldet er
   **zuerst** `handoff` von Atlas an den Agenten (der Ball) und **dann**
   `assigned` an den Agenten (legt die Aufgabe an).
3. **Ergebnis.** Der Agent gibt sein Ergebnis als `contribution` an Atlas
   zurück. Gemeldet wird es vom Agenten selbst oder, wie bisher, von Atlas
   für ihn.
4. **Abschluss.** Das Ergebnis geht als `contribution` von Atlas an Peter.
5. **Reihenfolge am Gerät.** Peter verbindet den Monitor, **bevor** er die
   Aufgabe schickt. Was beim Verbinden schon da liegt, wird bewusst nicht
   nachgespielt (Regel vom 21.10.).

Alle Ereignisse einer Aufgabe tragen dieselbe `project_id`, `run_id` und
`task_id`.

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

**1. Anstoß: Peter → Atlas** (Atlas meldet)

````
<!-- AGENTARIUM_EVENT_V1 -->
```json
{
  "schema": "agentarium.github-event.v1",
  "id": "<AUFGABE>-ANSTOSS-<zeitstempel>",
  "project_id": "agentarium",
  "run_id": "<LAUF>",
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
  "id": "<AUFGABE>-WEITER-<agent>-<zeitstempel>",
  "project_id": "agentarium",
  "run_id": "<LAUF>",
  "task_id": "<AUFGABE>",
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
  "id": "<AUFGABE>-VERGABE-<agent>-<zeitstempel>",
  "project_id": "agentarium",
  "run_id": "<LAUF>",
  "task_id": "<AUFGABE>",
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
  "id": "<AUFGABE>-ERGEBNIS-<agent>-<zeitstempel>",
  "project_id": "agentarium",
  "run_id": "<LAUF>",
  "task_id": "<AUFGABE>",
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
  "project_id": "agentarium",
  "run_id": "<LAUF>",
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
