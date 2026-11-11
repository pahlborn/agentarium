# AG-EVENT-ID-001 — Rückmeldung des Agentarium-Agenten
Version: V1 · 18.10.2026 · Antwort auf AG-EVENT-ID-001-arbeitsanweisung-v1
Status: technische Rückmeldung. Keine Implementierung, keine Vergabelogik,
keine neue Infrastruktur, keine Veröffentlichung.

## Eigener Quellstand
`origin/main` bei `ea0e64f` — derselbe Stand, den die Arbeitsanweisung als
geprüfte Basis nennt. Es gibt keine neuere eigene Arbeit am Piloten, die hier
zu schützen wäre. Offen auf eigenen Zweigen: PR #15 (nur Farbwerte in
`probe/`), ohne Berührung mit diesem Auftrag.

## Vorweg: der Punkt, an dem es kippt
Die Arbeitsanweisung nennt die strikte Feldliste richtig. Nachgelesen in
`pilot/github-live/github-live.js`, Adapter `AG-GH-LIVE-001-v1.3`:

```js
var FELDER = ['schema', 'id', 'project_id', 'run_id', 'task_id', 'actor',
              'kind', 'title', 'occurred_at', 'source_evidence', 'source_tool_id'];
var OPTIONAL = ['recipient'];
...
return nein('unbekanntes Feld ' + ks[a].slice(0, 40));
```

Daraus folgt eine **Reihenfolge, die nicht verhandelbar ist**:

> **Der Empfänger muss ausgerollt sein, bevor der Erzeuger das Feld schreibt.**

Schreibt die Erzeugerseite `short_ref` zuerst, wird **jedes** Ereignis
abgewiesen — nicht nur das neue Feld, das ganze Ereignis. Der Monitor bliebe
leer, und zwar sofort und vollständig.

Empfohlene Reihenfolge:
1. Adapter nimmt das Feld als **optional** an und ignoriert es zunächst.
2. Ein einzelnes Testereignis mit Feld — angenommen? Dann weiter.
3. Erst danach vergibt und schreibt die Erzeugerseite regulär.

## 1 — Wo die Kurzreferenz lesbar wird

**Erste Wahl: die „Was geschieht"-Liste.** Sie ist bereits ein Ereignisstrom,
eine Zeile je Ereignis (`feld/index.html`, `stromZeile()`, Zeile 4671). Die
Kurzreferenz steht dort **vorn in der Zeile**, schmal, in der Festbreitenschrift
und gedämpft — sie ordnet, sie drängt sich nicht vor. Kein neues Bauteil, keine
neue Fläche, kein Verlust am bisherigen Umfang.

**Auf der Bühne: nicht dauerhaft.** Entspricht Punkt 6 der Anweisung. Vorschlag
für die Bewegung: Die Kurzreferenz erscheint **nur an der Sprechblase**, die
ohnehin schon auftaucht, und verschwindet mit ihr. So trägt sie der Ball
mit, ohne dass im Feld bleibender Zusatztext steht.

**Detailzugriff:** Antippen einer Listenzeile zeigt die vollständige technische
`id` und den Quellbezug, kopierbar. Die Zeilen tragen bereits eigene
Eigenschaften (`__nr`, `__wer`, `__auftrag`), daran lässt sich das hängen.

**Nicht anfassen:** die Kostenebene. Ihre Schildchen hängen mittig an den
Agenten, sind bis 231 px breit (gemessen) und nach 16 s wieder fort. Dort
gehört keine Ordnungsnummer hin.

## 2 — Feld, Format, betroffene Dateien

**Name:** `short_ref`. Passt zur vorhandenen Schreibweise (`project_id`,
`run_id`, `source_tool_id`).

**Typ: Zeichenkette, nicht Zahl.** Muster `^ID[0-9]{4,}$`. Gründe: führende
Nullen bleiben erhalten, ein späterer Präfixwechsel bricht nichts, und in den
Rohdaten ist sofort sichtbar, worum es sich handelt.

**Kompatibilitätsregel:** Der Adapter hat den Mechanismus schon —
`OPTIONAL = ['recipient']`. `short_ref` gehört **dorthin**, nicht in die
Pflichtliste. Regel: fehlt das Feld, wird das Ereignis unverändert verarbeitet;
ist es da und ungültig, wird **das Feld** verworfen, nicht das Ereignis.

**Betroffene Empfängerdateien — es sind zwei, und das ist der Haken:**

| Datei | was zu ändern ist |
|---|---|
| `pilot/github-live/github-live.js` | `OPTIONAL` erweitern, Muster prüfen, durchreichen |
| `feld/index.html` | `__agEreignis` nimmt das Feld an, `stromZeile()` zeigt es |

`feld/` und `pilot/github-live/` sind **zwei vollständige Kopien** des Feldes
(Fassung 47 gegen 51). Jede Änderung muss zweimal gemacht werden, oder eine
Kopie veraltet still. Siehe Issue #14; Atlas wurde um einen Vorschlag zum
künftigen Vorgehen gebeten. **Für diesen Auftrag heißt das: bitte vorher sagen,
welche der beiden die führende ist.**

## 3 — Einwände und eine vorhandene Lösung

**Kein Einwand gegen die Verantwortungsgrenze.** Vergabe bei der Erzeugerseite,
Darstellung bei uns, Abstimmung vorher, Merge bei Peter — das ist sauber
geschnitten.

**Aber eine dauerhafte, eindeutige Nummer fließt bereits durch das System.**
`github-live.js`, Zeile 282:

```js
kommentar: String(c.id)
```

Das ist die GitHub-Kommentar-ID. Sie ist dauerhaft, global eindeutig, steigt
monoton, wird von GitHub ohne jeden eigenen Dienst vergeben, ist auf jedem
Gerät dieselbe und steht später unverändert im Archiv.

**Vorschlag:** Sie als **dauerhaften Schlüssel der Zuordnung** verwenden,
nicht als Anzeigeform — zehnstellig spricht sich schlecht. Die kurze Nummer
vergibt weiterhin die Erzeugerseite; die Kommentar-ID ist das, was die
Zuordnung reproduzierbar macht, ohne dass ein neuer Speicher entsteht. Das
könnte den Punkt „zentrale Vergabestelle" kleiner machen, als er aussieht.

**Zwei Anmerkungen zum gewünschten Verhalten:**

*Zu Punkt 1 — nicht nach `short_ref` sortieren.* Als Zeichenkette steht
`ID10000` vor `ID9999`. Die Anweisung sagt selbst, die Nummer behaupte keine
zeitliche Reihenfolge; es sollte nur niemand später doch danach ordnen.
`occurred_at` bleibt die Zeitangabe.

*Zu den führenden Nullen als „Mindestbreite".* Dann wären `ID0001` und `ID1`
zwei Schreibweisen derselben Nummer, und Peters Rückmeldung „ID1234" wäre nicht
mehr eindeutig auflösbar. Empfehlung: Breite auf vier festlegen, darüber hinaus
mitwachsen lassen, und eine einmal vergebene Referenz **nie** anders schreiben.

## Nachweisstand
Alles oben ist am Quelltext von `ea0e64f` nachgelesen, nicht erinnert. Die
231 px der Kostenschildchen sind im echten Browser gemessen. Es wurde nichts
implementiert, nichts vergeben, nichts veröffentlicht.
