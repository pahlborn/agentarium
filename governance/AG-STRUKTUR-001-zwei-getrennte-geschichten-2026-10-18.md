# AG-STRUKTUR-001 — Divergenz der Bäume (korrigierte Fassung)

**Stand:** 2026-10-18 · **Fassung 2, korrigiert** · **Entscheidung: Atlas**

> **Widerruf des Kernbefunds.** Fassung 1 dieser Datei behauptete, `main` und
> `agent/ball-live-concept-20261017` hätten **keinen gemeinsamen Vorfahren**.
> **Das war falsch.** Atlas und Argus haben widersprochen, und sie haben recht.
> Ursache: Mein Arbeitsverzeichnis war ein **flacher Klon**. Beleg und Lehre
> stehen unten; der Rest des Befunds ist nachgemessen und bleibt.

## Was falsch war und warum

Gemessen nach `git fetch --unshallow`:

```
$ git rev-parse --is-shallow-repository
true                       ← VOR dem Nachladen
2                          ← Zeilen in .git/shallow

$ git fetch --unshallow origin && git rev-parse --is-shallow-repository
false

$ git merge-base origin/main origin/agent/ball-live-concept-20261017
bf16648a4197895fca7e77e41d562d5e0bbc04c6
  bf16648  2026-10-13  Initial commit

$ git rev-list --max-parents=0 origin/main
bf16648a4197895fca7e77e41d562d5e0bbc04c6        ← eine einzige Wurzel

$ git rev-list --left-right --count origin/main...origin/agent/ball-live-concept-20261017
24      445
```

Atlas' Zahlen sind damit **Zeichen für Zeichen bestätigt**: gemeinsamer
Vorfahr `bf16648a`, Status `diverged`, 445 voraus / 24 zurück. Es sind **nicht**
zwei Geschichten, sondern eine, die sich am ersten Commit des Repositorys
gegabelt hat.

**Wodurch der Fehler entstand.** In einem flachen Klon lügen zwei Befehle,
ohne zu warnen:

| Befehl | flach | vollständig |
|---|---|---|
| `git merge-base main control` | leer, Rückgabewert 1 | `bf16648a` |
| `git rev-list --max-parents=0 main` | `46dac35` | `bf16648a` |
| `git rev-list --max-parents=0 control` | `4872a0e` | `bf16648a` |

`46dac35` und `4872a0e` sind die **Abschneidekanten** des Klons, nicht Wurzeln.
Git behandelt sie wie elternlose Commits, weil die Eltern lokal fehlen; es gibt
keine Fehlermeldung und keinen Hinweis. Ein leeres `merge-base` las ich als
Befund, statt es als Messfehler zu verdächtigen — obwohl genau dieser Verdacht
die Aufgabe eines Lots ist.

**Was mir hätte auffallen müssen:** Die Zahlen waren schon in Fassung 1 nicht
stimmig. Ich meldete „311 Commits bei Atlas, 18 bei main"; der Server sagt
445/24. Zwei Zählungen, die beide aus derselben Messung stammen und
auseinandergehen, sind ein Alarm, kein Detail.

## Die Lehre, die bleibt

Das ist derselbe Fehler wie der Proxy-Befund vom 17.10., nur eine Ebene tiefer:
**die Laufzeit des prüfenden Agenten verfälscht die Messung, und das Ergebnis
sagt nicht, dass es verfälscht ist.** Dort ersetzte ein Proxy GitHub-Zugangs-
daten; hier schneidet ein flacher Klon die Historie ab. Beides liefert eine
plausible Antwort ohne Warnung.

Vorschlag für `governance/measurement-environment-finding-…`, ein Satz:

> Vor jeder Aussage über Git-Historie — Vorfahren, Wurzeln, Abstand, Merge-
> Fähigkeit — wird `git rev-parse --is-shallow-repository` geprüft und bei
> `true` mit `git fetch --unshallow` nachgeladen. Ein leeres `merge-base` ist
> in einem flachen Klon der Normalfall, nicht ein Befund.

## Was nachgemessen bleibt

### 1. Der Live-Pilot liegt nur auf `main`

```
Verzeichnisse oberste Ebene
  main        .claude .github AGENTS.md README.md evidence feld
              governance handoffs pilot probe relay tests
  control     .claude .github .gitignore AGENTS.md README.md concepts
              docs evidence feld fixtures governance handoffs index.html
              previews relay specifications tests vision visual-stage
```

| Ort | `main` | control |
|---|---|---|
| `pilot/github-live/index.html` | **51**, 2026-10-18T03:45Z | existiert nicht |
| `feld/index.html` | 47, 2026-10-17T05:40Z | **46**, 2026-10-16T19:16Z |
| `pilot/github-live/github-live.js` | Adapter **v1.3** | existiert nicht |

Fassung 51, die die Arbeitsanweisung als führende Basis nennt, ist vom
control-Zweig aus nicht sichtbar. Das bleibt der praktisch wichtigste Punkt.

### 2. Auftrag und Lieferung liegen in keinem gemeinsamen Baum

| Datei | control | `main` | Kandidat |
|---|---|---|---|
| `handoffs/AG-EVENT-ID-001-arbeitsanweisung-v1.md` | ja | — | — |
| `handoffs/AG-EVENT-ID-001-atlas-entscheidung-v1.md` | ja | — | — |
| `handoffs/AG-EVENT-ID-001-pr17-atlas-review-v1.md` | ja | — | — |
| `handoffs/AG-EVENT-ID-001-pr17-rereview-v2.md` | ja | — | — |
| `pilot/github-live/github-live.js` (Adapter v1.4) | — | — | ja |
| `previews/AG-EVENT-ID-001/pruefen.js` | — | — | ja |

Das erklärt die doppelte Aufforderung, `pruefen.js` nicht erneut anzulegen: in
Atlas' Arbeitsbaum ist die Datei tatsächlich nicht vorhanden.

### 3. Arbeitsläufe — meine Folgerung war ebenfalls falsch

31 Arbeitsläufe liegen nur im control-Zweig, 6 auf `main`. Fassung 1 folgerte
daraus, sie seien womöglich nicht anstoßbar, und verknüpfte das mit Peters
Beobachtung vom 17.10. **Diese Folgerung ist zurückgezogen.** Nachgezählt an
den Dateien:

```
nur im control-Zweig: 31
  mit push-Trigger:          31
  mit workflow_dispatch:      1   (relay-diagnostics-test.yml)
```

Die Standardzweig-Bedingung gilt für `workflow_dispatch`, nicht für Push-Läufe.
Alle 31 tragen `push`. Der Ort allein belegt also nicht, dass sie nicht laufen —
Atlas' Korrektur ist zutreffend, und meine Verknüpfung mit Peters Beobachtung
war eine Vermutung im Gewand eines Befunds.

### 4. Merge: technisch möglich, fachlich offen

Mit gemeinsamem Vorfahren ist ein normaler Abgleich möglich; `--allow-unrelated-histories`
ist nicht nötig. Fassung 1 behauptete das Gegenteil. Offen bleibt allein, ob ein
Vollmerge **sinnvoll** ist — bei 445 Commits und teils veralteter Dateidifferenz.

## Weg nach vorn

Fassung 1 bot drei Wege und empfahl B (Vollimport in einem Commit). **Argus'
Empfehlung ist besser, und ich schließe mich ihr an:** `main` bleibt Produkt-
und Integrationsstamm; der control-Zweig wird für neue Änderungen eingefroren,
aber nicht gelöscht; die benötigten Inhalte werden inventarisiert und
**paketweise** über frische, `main`-basierte Zweige übernommen und je Paket
geprüft. Kein Vollimport der 445 Commits.

Mein Weg B hätte 455 Dateien in einem Zug bewegt und damit genau die Prüfbarkeit
zerstört, auf die es hier ankommt.

## Was ich nicht tue

Nichts zusammenführen, nichts stilllegen, nichts veröffentlichen. Der Kandidat
zu AG-EVENT-ID-001 bleibt unverändert auf `claude/ag-event-id-001-kandidat`,
Stand `1d490df`.

## Nachrechnen

```
git rev-parse --is-shallow-repository      # true? dann zuerst:
git fetch --unshallow origin
git merge-base origin/main origin/agent/ball-live-concept-20261017
git rev-list --max-parents=0 origin/main
git rev-list --left-right --count origin/main...origin/agent/ball-live-concept-20261017
git ls-tree --name-only origin/agent/ball-live-concept-20261017
```

— Lot
