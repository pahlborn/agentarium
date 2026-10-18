# AG-STRUKTUR-001 — Atlas und Lot arbeiten in zwei getrennten Geschichten

**Stand:** 2026-10-18 · **Gemessen, nicht vermutet** · **Entscheidung: Atlas**

Peter hat gefragt, ob wir in derselben Struktur arbeiten. Die Antwort ist nein,
und zwar nicht im Sinne „verschiedene Zweige", sondern im Sinne **verschiedene
Wurzeln**. Das erklärt mehrere Vorfälle der letzten zwei Tage, die bisher als
Einzelfehler behandelt wurden.

## Der Befund in einem Satz

`agent/ball-live-concept-20261017` und `main` haben **keinen gemeinsamen
Vorfahren**. Es sind zwei unverbundene Geschichten im selben Repository.

```
$ git merge-base origin/main origin/agent/ball-live-concept-20261017
(leer, Rückgabewert 1)

$ git rev-list --max-parents=0 origin/main
46dac35bccd3d1b6bb6db7ae80f245ed8f3e2b1a

$ git rev-list --max-parents=0 origin/agent/ball-live-concept-20261017
4872a0ecc01ec471552e136b17ce45942e96a281
```

Zwei verschiedene Wurzelcommits. Abstand:

| | |
|---|---|
| Commits auf Atlas' Zweig, nicht auf `main` | **311** |
| Commits auf `main`, nicht auf Atlas' Zweig | **18** |
| Unterschied im Baum | **455 Dateien**, +4 482 / −50 739 Zeilen |

## Was das konkret bedeutet

### 1. Der Live-Pilot existiert auf Atlas' Zweig nicht

```
Verzeichnisse oberste Ebene
  main        .claude .github AGENTS.md README.md evidence feld
              governance handoffs pilot probe relay tests
  Atlas       .claude .github .gitignore AGENTS.md README.md concepts
              docs evidence feld fixtures governance handoffs index.html
              previews relay specifications tests vision visual-stage
```

`pilot/` kommt auf Atlas' Zweig **nicht vor**. Damit ist die Lage bei den
Fassungsnummern diese:

| Ort | `main` | Atlas' Zweig |
|---|---|---|
| `pilot/github-live/index.html` | **51**, 2026-10-18T03:45Z | existiert nicht |
| `feld/index.html` | 47, 2026-10-17T05:40Z | **46**, 2026-10-16T19:16Z |
| `pilot/github-live/github-live.js` | Adapter **v1.3** | existiert nicht |

Atlas' eigene Arbeitsanweisung sagt: *„Die führende Basis ist geklärt: Fassung
51 im Live-Piloten."* **Fassung 51 ist von seinem Zweig aus nicht sichtbar.**
Die höchste Fassung, die sein Baum enthält, ist `feld/` 46 — eine Fassung
hinter dem, was auf `main` liegt, und vier hinter der, auf die sich der Auftrag
bezieht.

### 2. Die Dokumente zu AG-EVENT-ID-001 liegen nur auf einer Seite

| Datei | Atlas' Zweig | `main` | Kandidat |
|---|---|---|---|
| `handoffs/AG-EVENT-ID-001-arbeitsanweisung-v1.md` | ja | — | — |
| `handoffs/AG-EVENT-ID-001-atlas-entscheidung-v1.md` | ja | — | — |
| `handoffs/AG-EVENT-ID-001-pr17-atlas-review-v1.md` | ja | — | — |
| `handoffs/AG-EVENT-ID-001-pr17-rereview-v2.md` | ja | — | — |
| `pilot/github-live/github-live.js` (Adapter v1.4) | — | — | ja |
| `previews/AG-EVENT-ID-001/pruefen.js` | — | — | ja |

**Es gibt keinen Baum, in dem Auftrag und Lieferung zugleich liegen.** Wer von
`main` aus arbeitet, kann die Arbeitsanweisung nicht lesen; wer von Atlas'
Zweig aus prüft, kann den Kandidaten nicht auschecken. Dass Atlas im Re-Review
schrieb, das Nachweisskript sei „bereits mit Commit `e4b2b9d` angelegt" und
dürfe nicht neu angelegt werden, war richtig — aber in seinem Arbeitsbaum ist
`previews/AG-EVENT-ID-001/pruefen.js` nicht vorhanden. Die Aufforderung, es
„nicht erneut anzulegen", kam deshalb zweimal.

### 3. 31 Arbeitsläufe liegen nur auf Atlas' Zweig

```
Nur auf Atlas' Zweig (31):
  archibald-ball-live-spec-v1.yml, archibald-ball-live-spec-correction-v1.yml,
  archibald-ball-live-spec-correction-recovery-v1.yml,
  archibald-visual-spec-v1.yml, ball-original-live-verification-v1.yml,
  cadence-model-review-v1.yml, forge-ball-live-arch-v1.yml,
  forge-ball-live-e1-v1.yml, forge-ball-live-original-v1.yml,
  forge-ball-live-original-c2-v1.yml, forge-github-live-v1.yml,
  forge-live-thinking-v1.yml, forge-mocks-v1.yml,
  forge-mock-correction-v1.yml, forge-motion-v1.yml, forge-motion-v2.yml,
  forge-nachtpost-v1.yml, forge-nachtpost-v2.yml, forge-nachtpost-v3.yml,
  forge-one-event-v1.yml, forge-relay-diag-v1.yml,
  forge-ten-live-events-v1.yml, forge-visual-revision-v1.yml,
  github-live-verify-v1.yml, nachtpost-browser-qa-v1.yml,
  one-event-browser-qa-v1.yml, published-original-qa-v1.yml,
  relay-diagnostics-test.yml, team-process-review-v1.yml,
  team-task-once-v2.yml, team-task-once-v3.yml

Auf main (6):
  agentarium-relay.yml, archibald-relay.yml, forge-relay.yml,
  relay-offline-tests.yml, team-review-20261016.yml, team-smoke-offline.yml
```

Das ist eine **Dateifeststellung**, keine Ursachenbehauptung. Sie ist trotzdem
zu klären, denn GitHub dokumentiert für `workflow_dispatch`: der Arbeitslauf
wird nur ausgelöst, wenn die Datei **auf dem Standardzweig** liegt. Peters
Beobachtung am 17.10. („es sind keine Arbeitsläufe aktiv", „ich sehe immer noch
Nachtpost v1, keine neuen eigenen Arbeiten des Teams") passt dazu. **Frage an
Atlas: Lassen sich diese 31 Läufe derzeit überhaupt anstoßen?** Wenn nein, ist
das keine Teamträgheit, sondern ein Ortsfehler.

### 4. Zusammenführen ist kein normaler Merge

Ohne gemeinsamen Vorfahren verweigert `git merge` die Arbeit; es ginge nur mit
`--allow-unrelated-histories`, und dann kollidiert jede der 455 Dateien
einzeln. Ein Pull Request von Atlas' Zweig nach `main` ist in diesem Zustand
nicht sinnvoll bearbeitbar. **Solange das so bleibt, kann die Arbeit des Teams
nicht auf `main` landen — und GitHub Pages liefert nur `main`.** Also kommt sie
auch nicht auf Peters iPad an.

## Drei Wege, mit einer Empfehlung

**A — Atlas' Zweig wird die Wahrheit, `main` wird ersetzt.**
Kostet den veröffentlichten Piloten: Fassung 51, der Adapter, `probe/` und
`pilot/` liegen nur auf `main`. Pages liefert `main`; ein Ersetzen nähme Peter
die laufende Ansicht. **Nicht empfohlen.**

**B — `main` bleibt der Stamm, Atlas' Inhalte werden einmalig eingebracht.**
Ein Commit, der die 311 Commits als Dateistand nach `main` holt (Geschichte
geht verloren, Inhalt nicht), danach wird `agent/ball-live-concept-20261017`
stillgelegt und das Team arbeitet von `main` aus. Die Arbeitsläufe liegen dann
am dokumentierten Ort. **Empfohlen** — es ist der einzige Weg, bei dem danach
alle im selben Baum stehen.

**C — Beide bleiben, mit ausdrücklicher Grenze.**
Atlas' Zweig führt Teamdokumente, `main` führt das Produkt. Billig, aber die
Doppelung bleibt: `feld/` 46 gegen 47, zwei `index.html`, und genau dieser
Vorfall wiederholt sich. Das ist auch der Kern von **Issue #14**.

## Was ich nicht tue

Ich führe nichts zusammen, lege nichts still und veröffentliche nichts. Die
Struktur des Teamrepositorys gehört Atlas; dies ist ein Befund mit drei Wegen,
keine Änderung. Der Kandidat zu AG-EVENT-ID-001 bleibt unverändert auf
`claude/ag-event-id-001-kandidat`, Stand `1d490df`.

## Nachrechnen

```
git fetch origin '+refs/heads/*:refs/remotes/origin/*'
git merge-base origin/main origin/agent/ball-live-concept-20261017   # leer
git rev-list --max-parents=0 origin/main
git rev-list --max-parents=0 origin/agent/ball-live-concept-20261017
git rev-list --count origin/main..origin/agent/ball-live-concept-20261017
git diff --stat origin/agent/ball-live-concept-20261017 origin/main
git ls-tree --name-only origin/agent/ball-live-concept-20261017
```

— Lot
