# Übergabe an die nächste Lot-Sitzung

**Stand:** 23.10.2026, ~11:00 UTC · geschrieben am Ende der Sitzung
`cse_01SvS2FzU7U5JmX6fr8JAfPo`

Lies zuerst `CLAUDE.md` und `AGENTS.md` — die Regeln stehen dort und werden
hier **nicht** wiederholt. Dieses Blatt enthält nur, was sonst neu erarbeitet
werden müsste: wo die Arbeit liegt, was offen ist, und die Messwerte, die
diese Sitzung teuer gelernt hat.

---

## 1. Was gerade wo liegt

| Ort | Stand | Lage |
|---|---|---|
| `main` | Fassung **56** | das Einzige, was ein Gerät holen kann |
| Peters iPad | Fassung **55** | eine hinter `main` (Worker aus dem Vorrat) |
| **PR #52** `agent/ag-lm-tk-022-echte-quelle-v1` | `053feac` | Draft, Prüflauf grün, wartet auf unabhängige Prüfung |
| **PR #46** `agent/ag-event-journal-001` | `9396755`, Fassung **76** | **offen und eingefroren**, kein Merge, keine Erweiterung |
| `archive/pr46-before-split-99b1af03` | von Atlas gesichert | unveränderlicher Ausgangspunkt |

**Nichts ist verworfen.** Fassungen 71–76 liegen vollständig auf #46:
71 lot auf der Bühne · 72 Listendeckkraft · 73 Tempowähler · 74 R5 ·
75 R3 (unvollständig, siehe §3) · 76 R2 Elternkette.

**PR #52 enthält nur den kleinsten Schnitt für TK-022:** den Produktstand
`94bf5a5` (Fassung 70) plus zwei Nachweisdateien, 10 Dateien, +4121/−46.
Der Umfang ist **gemessen**, nicht geschätzt: Der TK-022-Nachweis lief in
einem eigenen Arbeitsbaum gegen Fassung 70 mit Rückgabe 0. Nichts aus 71–76
ist dafür nötig.

---

## 2. T5 — Peters verbindliche Arbeitsregeln (Atlas 6362894128, 6363104296)

1. **Nur Kommentare seit dem letzten eigenen Blick lesen.** Keine
   vollständigen Kommentarlisten. **Vorgang #2 niemals vollständig lesen**
   (250 Kommentare, einzelne mehrere Kilobyte). Einzelne gezielt über
   `issue_read` mit `perPage: 1` und der passenden Seite holen — so sind die
   vier TK-022-Originale geholt worden.
2. **Eine Sitzung je Aufgabe.** Nach der Rückgabe beenden, nicht wartend
   offenhalten. Geplante Selbstkontrollen vorher löschen.
3. **Von Prüfläufen nur Zusammenfassungen lesen** (Rückgabewert, Zahl der
   `FEHL`-Zeilen). Detailauszug nur bei einem konkreten Fehler.
4. **Verbrauch ist `unknown`.** In der Sitzung ist kein Wert abrufbar, und
   eine zusätzliche Modellrunde zur Ermittlung ist ausgeschlossen. **Keine
   Kostengrenze behaupten** — Peter trägt Abrechnung und Restbudget nach.
   Sitzungskennung im Rücklauf angeben.
5. **Rücklaufform:** Ergebnis/Head · Prüfung/Grenze · Tokens und USD
   (`unknown` mit Grund) · `source_evidence: reported_checkpoint`. Kurz.
   Keine wiederholten Statusberichte.

---

## 3. Offene Arbeit, mit Eigentümer

### R3-Nachbesserung — **belegter Fehler, gehört auf eigenen Zweig**

Atlas' Befund `6359816846` ist richtig und angenommen. In
`pilot/github-live/github-live.js`, Vergabezweig:

```js
halter = e.recipient; zustand = 'zugewiesen';
titel = e.title; letzte = x;          // <-- laufen VOR dem Vergleich
...
if (eTypGesetzt && (eTyp !== tNeu || eEltern !== pNeu)) widersprueche++;
```

Ein widersprüchliches zweites `assigned` behält Typ und Eltern, **verschiebt
aber schon Halter und Zustand**. Der Livepfad kehrt dagegen vor jeder
Änderung zurück. Beide Wege ergeben damit weiter verschiedene Lagen — und
genau das ist Atlas' stehende Bedingung seit dem 21.10.

**Zu tun:** Konflikt **vor** den Zustandsänderungen prüfen, bei Zurückweisung
den bisherigen wirksamen Zustand erhalten.

**Atlas' verlangter Gegentest** (den das heutige R19 *nicht* abdeckt, weil es
gleiche Empfänger und keine fortgeschrittene Stufe hat):

> erste Vergabe an Rolle A → `received`/`started` → zweite Vergabe derselben
> Identität mit anderem Typ/Eltern **und** Empfänger B. In Live und Restore
> müssen A, bisherige Stufe, ursprünglicher Typ/Eltern und Beleg erhalten
> bleiben; genau der Konflikt zählt.

**Zweiter offener Punkt dazu:** Der Live-Konfliktzähler ist nur über
`__agStand` messbar, nicht im Monitor sichtbar — R3s „als Konflikt gezeigt"
ist damit nicht erfüllt. Mein Vorschlag, nicht gebaut: Der Livepfad meldet
seinen Zählwert in die Zählzeile des Adapters, in der „Konflikt" schon steht
— so wie `verarbeitet`/`ausgegeben` es tun. Keine neue Bildsprache.

### Weiter offen

- **TK-023** (Abschluss nach oben) — eigener Zweig; hängt an E1/E2 bei Atlas.
- **Zyklusnachweis** als eigener Zweig (R2 ist in Fassung 76 geliefert).
- **E3/R6 Wiedereröffnung** — bei Atlas. Mein Einwand steht: Eine neue
  Vergabe mit höherem `item_version` ist technisch der kleinere Weg, gibt
  aber die schlechtere Auskunft — wer nachsehen will, warum etwas zweimal
  lief, findet zwei Einträge und keinen Bezug.
- **Unabhängige QA** zu #52 und die Rollen-/Laufzuordnung im Relais
  (Legacy-Hüllen nennen `forge` statt `spec-agent`) — bei Atlas.

### Vier Entscheidungen bei Peter

1. **Vorlauf im Archiv.** Nicht gebaut, mit Grund: `schritt(dt)` ist eine
   *Bildfunktion* — am Ende stehen zwölf Anzeigeaufrufe, darunter
   `motorenZeigen()` und `fussOrdnen()` mit Layoutmessungen. Eine Aufzeichnung
   stumm nachzuspielen hieße, sie viertausendmal aufzurufen. Ein echter
   Vorlauf verlangt, Simulation und Anzeige in der Hauptschleife zu trennen.
2. **Erhellen der Liste auf dem iPad.** Es *gibt* `filter:brightness(1.6)`
   seit Fassung 52 — aber unter `@media (hover:hover)`. `#agEcke` trägt mit
   Absicht `pointer-events:none`, weil die Liste sonst jeden Tipp auf **peter**
   schluckt (er steht links bei 180°). Nachrüsten kostet genau das.
3. **Farbe der Herkunftszeile.** `#8295B0` kommt auch bei Deckkraft `.62` nur
   auf 3,11:1. Das wäre eine Änderung an der Farbe, nicht an der Deckkraft.
4. **Veröffentlichung.** Alles von 57 bis 76 ist für Peter unsichtbar,
   solange `main` bei 56 steht.

---

## 4. Messwerte und Fallen — das Teure dieser Sitzung

### Drei Fassungsstellen müssen zusammen steigen

`FASSUNG` **und** `GEBAUT` in `pilot/github-live/index.html`, `VORRAT` in
`pilot/github-live/sw.js`. Der Adapter wird als `github-live.js?v=' + FASSUNG`
geladen — **eine Adapteränderung ohne Fassungserhöhung erreicht kein Gerät.**

### Die Fähigkeitswörter sind das Tor

`kommunikation: 'beobachtet-v1'` und `lebenszyklus: 'gemeldet-v5'`. Der
Adapter gibt die Lebenszyklusarten **nur** heraus, wenn das Original das
passende Wort zusagt. Darum ist Fassung 70 der Boden für TK-022: `gemeldet-v5`
entsteht mit dem Arbeitselementschritt. Ein altes Original aus dem Vorrat
weist die Arten ab, statt sie halb zu zeigen — das ist Absicht.

### Zwei verschiedene Schranken, und ich habe sie dreimal verwechselt

| Schranke | Frage | Code |
|---|---|---|
| Selbstauskunft | **wer darf melden** | `reporter === actor` |
| Unabhängigkeit | **wer darf abnehmen** | `actor !== halter` |

Beide müssen halten; die eine ersetzt die andere nicht. `aborted` ist von der
zweiten **ausgenommen** — wer abbricht, bricht seine eigene Arbeit ab.
`HALTERGEBUNDEN = { received, started, delivered }`; `reviewed`/`accepted`/
`aborted` treffen die Aufgabe, wo immer sie liegt.

### Zahlen, die man kennen muss

- **`KERNE_MAX` = Agentenzahl + 1.** Die Reserve ist nicht Zierde:
  `kernWaehlen` stiehlt bei Vollbelegung dem schwächsten Kern den Platz,
  mitten im Leben. Steht bei 11 für zehn Agenten.
- **Nur vier Ringe je Rolle werden geschritten**
  (`Math.min(S.liste.length, 4)`). Ein fünfter Ring wird nicht gezeichnet und
  sein Winkel nicht weitergestellt — eine Messung an einer fünften Aufgabe
  friert still ein.
- **`dt` ist auf 0,05 s gedeckelt.** Die Uhr eines Stücks ist damit eine
  **Bilduhr, keine Wanduhr**: auf langsamem Gerät läuft ein Archivstück
  langsamer als seine nominelle Dauer.
- **`window.__feld`** bietet nur flüchtige Erzeuger (`strang`, `knoten`,
  `austreiben`, `sonne`, `kern`). Ein Knoten, der länger als 2 s brennt,
  sättigt auf 225/255 und der Schmier bleibt für immer. **Kein dauerhaftes
  Objekt ins Teilchenfeld.**
- **Schilder tragen `data-wer`.** Nachweise **nie** über die Reihenfolge von
  `AGENTEN` wählen — das ist eine zweite Wahrheit und war beim zehnten
  Agenten sofort falsch. Der Textinhalt wechselt alle 16 s zwischen Name und
  Rolle, ist also auch keine Wahl.

### Zwei Zeilen, die fast gleich aussehen

`#agGhLetztes` baut der **Adapter** — er kennt die Bühne nicht und schreibt
nur `' · unter ' + ev.parent_id`. Die Elternkette kann nur das **Original**
bilden (`spurWort`), und sie erscheint in der Herkunftszeile der **Liste**.
Wer die falsche Zeile prüft, misst den falschen Kopf.

### Befund, nicht behoben: live gibt es keine „offen"-Zeile

`auftrag` in `stromZeile` verlangt `!E.beobachtet`, und `beobachtet` tragen
**alle** Live-Ereignisse. Die Liste sollte zweierlei sagen — live sagt sie
eins. Gemessen und als Prüfzeile festgeschrieben, **nicht** geändert: Das ist
eine Änderung am Bild.

---

## 5. Der Fehler, der sich den ganzen Tag wiederholt hat

**Das Messgerät für den Gegenstand nehmen.** Jeder dieser Fälle hat Zeit
gekostet:

- `git push … | tail` gibt **tails** Status zurück. Ein Push wird per
  **SHA-Vergleich** bestätigt, nie per Erfolgsmeldung. Dasselbe gilt für
  `grep … | head` und jede andere Pipe.
- Eine CSS-**Klasse ohne Regel** beweist nichts. Gemessen wird der
  aufgelöste `animationName`, nicht `classList`.
- Eine **Gegenprobe, die das Falsche zurücknimmt**, bestätigt nichts. Immer
  prüfen, welche Zeilen *namentlich* fallen und ob es die erwarteten sind.
- Ein **kumulativer Zähler gegen Null** geprüft misst die ganze
  Vorgeschichte mit. Delta um das Ereignis messen.
- Zwei Proben gegen einen **Takt** geprüft treffen die Flanke oder nicht.
  Die Bahn abtasten.
- `ubuntu-latest` ist **kein fester Stand** — am 21.10. von 24.04 auf 26.04
  umgezogen, Playwright 1.56.1 kennt dort kein Chromium. Der Läufer ist
  deshalb auf `ubuntu-24.04` festgenagelt. **`main` hat diese Zeile noch
  nicht** — ohne sie läuft dort kein Nachweis.
- Ein **Schlusssatz misst nichts** und fällt deshalb nie auf. Zwei von drei
  Behauptungen am Ende des Journalnachweises waren tagelang falsch.

---

## 6. Prüfläufe

```
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node previews/<NAME>/pruefen.js
```

Rückgabe 0 = in Ordnung, 1 = Abweichung, 2 = ungeprüft. Chromium liegt unter
`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`; **nie**
`playwright install` aufrufen. Der Arbeitslauf nimmt jeden
`previews/*/pruefen.js` von selbst auf — ein neuer Nachweis braucht keine
Änderung am Lauf.

Auf #46 sind es acht, auf #52 sieben. Je Lauf ein bis vier Minuten; **nur die
Zusammenfassung lesen** (T5).

---

## 7. Die Dokumente dieser Arbeit

- `handoffs/AG-LM-TK-021-archibald-handback-v1.md` — Archibalds Spezifikation
  V1 (R1–R8, AC-01…09, E1–E5)
- `handoffs/AG-LM-TK-021-lot-rueckgabe-v1.md` — meine Rückgabe dazu
- `handoffs/AG-LM-TK-022-quellenklaerung-v1.md` — mit datiertem Nachtrag zu
  `lot` als Akteur
- `handoffs/AG-EVENT-JOURNAL-001-vertrag-*.md` — Blockade, Originalbeleg,
  Kette, Hierarchie
- `previews/AG-TK022-ECHT-001/koerper-echt.json` — die vier **echten**
  Originalkommentare, wortgetreu

---

## 8. Was nie gilt

Kein Merge. Keine Veröffentlichung. Keine Secrets. Keine Claude-/Modellaufrufe
ohne ausdrückliche, begrenzte Freigabe. Kein zweites UI, kein Ersatzmonitor.
Keine erfundene Meldung im echten Strom — nur klar gekennzeichnete Testdaten.
Weg B (bezeugte Hostmeldungen) ist **nicht** freigegeben. **Keine
Modellbezeichnung ins Repository** — nicht in Commits, nicht in Pull
Requests, nicht in Dateien.

Peters Texte gehören Peter. Im Zweifel, ob etwas das Bild berührt, gehört es
Peter; der Zweifel entscheidet gegen mich.
