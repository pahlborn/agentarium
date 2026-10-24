# AG-SPASS-001 — Übungsprojekt „Ballbrause“

Übung, kein Produktauftrag. Jede Rolle bekommt einmal den Ball, damit Übergaben, parallele Bälle und Rückgaben im Monitor zu sehen sind. Lot nimmt nicht teil; er ist für den Monitor verantwortlich und beobachtet von dort.

**Ergebnis:** das Etikett einer erfundenen Limonade „Ballbrause“, als eine Datei `previews/AG-SPASS-001/etikett.md`.

**Vor dem Start:** Peter verbindet den Monitor (`?live=github`), dann geht der Auftrag an Atlas.

## Auftrag von Peter an Atlas

> Wir bringen eine Limonade auf den Markt: **Ballbrause**. Ich brauche nur ein Etikett. Jede Rolle steuert genau eine Kleinigkeit bei, keine länger als 2–3 Minuten. Das ist ein Übungsprojekt: Melde jede Übergabe im Monitor, sammle alles in `previews/AG-SPASS-001/etikett.md` und gib mir das Etikett zurück.

## Aufgaben

| Runde | Ball an | Aufgabe | Liefert |
|---|---|---|---|
| 1 | Nova | Ein Slogan für die Ballbrause, höchstens 8 Wörter | 1 Zeile |
| 1 | Scout | Ein **echter**, belegter Kurzfakt über Limonade, mit Quelle | 1 Satz und 1 Link |
| 1 | Archibald | Drei prüfbare Anforderungen an das Etikett (z. B. Name sichtbar, höchstens 5 Zutaten, ein Warnhinweis) | 3 Punkte |
| 2 | Forge | Das Etikett als Textkasten mit Name, Slogan, Zutaten (erfunden, höchstens 5), Fakt und Warnhinweis | Markdown-Block |
| 3 | Argus | Genau ein kritischer Einwand zum Etikett | 1 Satz |
| 3 | Sentinel | Archibalds drei Anforderungen am fertigen Etikett prüfen | PASS/FAIL je Punkt |
| 4 | Cadence | Ein Satz zur Rückschau: Was hätte diese Übung schneller gemacht? | 1 Satz |
| — | Atlas | Vergibt, sammelt, setzt zusammen und gibt das Etikett an Peter zurück | die fertige Datei |

**Reihenfolge der Bälle:** Peter → Atlas. Dann gleichzeitig Atlas → Nova, Scout und Archibald, alle drei zurück. Danach Atlas → Forge, zurück. Dann Atlas → Argus und Sentinel, beide zurück. Dann Atlas → Cadence, zurück. Zum Schluss Atlas → Peter. Im Monitor sind das 16 Bälle, davon zweimal mehrere gleichzeitig in der Luft. Jede Übergabe wird nach Rulebook §12 gemeldet (`handoff`, `assigned`, `contribution`).

## Spielregeln

- Jede Rolle liefert nur ihren Teil, ohne Ausschmückung und ohne Rückfrage-Schleife.
- Scouts Fakt muss echt sein. Alles andere darf erfunden sein und steht unter dem Vermerk „Übung“.
- Argus' Einwand wird nicht umgesetzt, nur ins Etikett unter „Einwand“ geschrieben.
- Kein Merge nötig; die Datei darf auf einem eigenen Zweig bleiben.

## Form des Ergebnisses (Beispiel, nicht vorgegeben)

```
┌──────────────────────────────┐
│        BALLBRAUSE            │
│  „<Slogan von Nova>“         │
│  Zutaten: <bis zu 5>         │
│  Wusstest du? <Scouts Fakt>  │
│  Achtung: <Warnhinweis>      │
└──────────────────────────────┘
Einwand: <Argus> · Prüfung: <Sentinel> · Rückschau: <Cadence>
```
