# Lesekarte `pilot/github-live/`

Gezielt lesen statt alles lesen. `index.html` hat auf `main` 6.632 Zeilen
(357 KB, rund 90.000 Token). Die meisten Fragen beantwortet ein Abschnitt
von 1–5 KB.

**Lesehilfe, kein Vertrag.** Bei Widerspruch gilt der Code.

## Die Adresse ist der Abschnittstitel, nicht die Zeilennummer

Jeder Abschnitt beginnt mit einem Kopf `/* ===== TITEL ===== */`. Die
aktuellen Zeilen liefert jederzeit:

```sh
git grep -n -E '^[[:space:]]*/\* =+' -- pilot/github-live/index.html
```

Ein Aufruf, 31 Zeilen Ausgabe, kein Lesen der Datei. Danach nur den
Bereich zwischen zwei Köpfen lesen. Die Zeilennummern unten sind **Stand
Fassung 56** (`main`, `aacf1b2`) und veralten mit jeder Änderung; die Titel
nicht.

## Dateien

| Datei | Größe | Inhalt |
|---|---|---|
| `index.html` | 357 KB | Stil, Feld, Agentarium-Logik |
| `github-live.js` | 33 KB | GitHub-Adapter, nur bei `?live=github` |
| `sw.js` | 2 KB | Vorrat `agentarium-vNN`, nennt die Dateien namentlich |

## Aufbau von `index.html`

| Block | Zeilen | Größe |
|---|---|---|
| CSS | 11–896 | 50 KB |
| SCRIPT-A, das Feld | 929–2245 | 60 KB |
| **SCRIPT-B, die Agentarium-Logik** | **2250–6622** | **236 KB (68 %)** |
| SCRIPT-C, ServiceWorker-Anmeldung | 6623–6630 | 260 B |

**SCRIPT-A und SCRIPT-B sind je eine IIFE** mit gemeinsamem Closure. Keine
Module, keine Exporte. Funktionen lassen sich nicht einzeln herauslösen,
ohne den geteilten Zustand (`AGENTEN`, `arbeit`, `tisch`, `nachName` …)
aufzulösen. Ein Datei-Split ist ein Architektureingriff, keine
Verschiebearbeit.

## Die Brückenpunkte

Die einzige Schnittstelle zwischen SCRIPT-B und `github-live.js`. Wer am
Ereignisvertrag arbeitet, braucht meist nur diese Stellen.

| Name | Zeile | Abschnitt |
|---|---|---|
| `window.__agEreignis` | 5554 | WELCHER LAUF HIER LAEUFT — enthält den Prüfer `nein(` |
| `window.__agLauf` | 5538 | WELCHER LAUF HIER LAEUFT |
| `window.__agStand` | 4912 | DIE ARBEIT (zweiter) — Zähler für Nachweise |
| `window.__agSchritt` | 4910 | DIE ARBEIT (zweiter) |
| `window.__agStrom` | 5421 | DER ANSCHLUSS FUER EINEN ECHTEN STROM |
| `window.__agMvp` | 6370 | AG-PILOT-001 |
| `window.__agGithubBruecke` | 6435 | AG-GH-LIVE-001: GITHUB-KOMMENTARE |
| `window.__agRing` | — | Ringgeometrie, neun Stellen |

## Abschnitte von SCRIPT-B

Bezeichner in Spalte 4 sind aus dem Code gezogen, nicht ausgewählt.

| Titel | Zeilen | KB | Bezeichner |
|---|---|---|---|
| (Präambel) | 2252–2323 | 8,5 | `AGENTEN`, `ARTEN`, `FASSUNG`, `esc`, `MODUS` |
| DER STROM | 2324–2359 | 1,6 | `liveListe`, `ereignisse`, `verbunden` |
| OHNE MASCHINE KEINE SCHICHT | 2360–2393 | 25,9 | `STUECKE`, `nachName` — fast nur Stückdaten |
| EIGENE BLÖCKE | 2394–2491 | 4,7 | `BLOECKE`, `bloeckeLage` |
| EIGENE PLÄTZE | 2492–2575 | 3,6 | `plaetzeLesen`, `platzKnopfSetzen` |
| DIE GRIFFE | 2576–2874 | 13,9 | `griffeBauen`, `ringR`, `bandL`, `schmal` — Layout |
| DIE ERWARTUNG | 2875–2928 | 2,2 | `erwartungSchritt`, `weiterSagen` |
| DIE SCHLEUSE | 2929–3454 | 25,8 | `schleuse`, `wirf`, `ballSchritt`, `flugdauer` |
| DER BALL | 3455–3498 | 2,0 | `derBall`, `ballOrt` |
| DER EINSTURZ | 3499–3528 | 1,4 | `einsturz` |
| DER TISCH | 3529–3592 | 3,0 | `tisch`, `TISCH_MAX` |
| DAS PRODUKT | 3593–3825 | 10,8 | `produkt`, `abnehmen` |
| DER STOPPER | 3826–3947 | 6,0 | `STOPPKLASSEN`, `ratVermerk` |
| DIE ARBEIT | 3948–4228 | 13,1 | `arbeit`, `verbrauch`, `arbeitAn`, `auftragFertig` |
| WER GERADE ARBEITET | 4229–4407 | 8,2 | `stoppZeigen`, `stoppGrund` |
| DIE WEISE DER ÜBRIGEN ROLLEN | 4408–4636 | 11,4 | eingerückt, innerhalb einer Funktion |
| DER AUSKLANG | 4637–4743 | 5,1 | `AUSKLANG_PLAN`, `ausklangStufen` |
| DIE ARBEIT (zweiter) | 4744–5381 | 30,2 | `schritt`, `knoepfeSetzen`, `__agStand` |
| DIE ANZEIGE DES STROMS | 5382–5411 | 1,1 | `stromZeigen` |
| DER ANSCHLUSS FUER EINEN ECHTEN STROM | 5412–5441 | 1,3 | `__agStrom` |
| DER EINGANG FUER EIN ARBEITSEREIGNIS | 5442–5467 | 1,3 | `KOMMUNIKATION` |
| AG-GH-LIVE-001: FORTSCHRITT | 5468–5485 | 0,9 | `ghLive`, `FORTSCHRITT` |
| AG-GH-LIVE-004: BEOBACHTETE KOMMUNIKATION | 5486–5527 | 2,0 | `GH_ARTEN`, `GH_KENNUNG`, `ghKenn` |
| WELCHER LAUF HIER LAEUFT | 5528–5987 | 23,5 | `__agLauf`, `__agEreignis`, `nein` |
| DER FUSS EINES AGENTEN | 5988–6349 | 16,6 | `fussOrdnen`, `motorenZeigen` |
| AG-PILOT-001: EIN EREIGNIS | 6350–6419 | 3,0 | `__agMvp` |
| AG-GH-LIVE-001: GITHUB-KOMMENTARE | 6420–6522 | 4,4 | `__agGithubBruecke` |
| DIE HELLIGKEIT | 6523–6621 | 4,3 | `SCHUB`, `ratenZeigen` |

Zwei Titel kommen doppelt vor (`DIE ARBEIT`). Mit `git grep` sind beide
sichtbar; gemeint ist meist der erste für das Arbeitsmodell, der zweite
für Schleife und Zähler.

## Wo fange ich an?

| Frage | Abschnitte | Zeilen statt 6.632 |
|---|---|---|
| Welche Felder hat ein Ereignis, warum wird es abgewiesen? | EINGANG + GH-LIVE-004 + WELCHER LAUF | ~530 |
| Nur die Abweisungsgründe | `git grep -n "nein('"` | 12 Treffer |
| Wer arbeitet woran, Aufträge, Verbrauch | DIE ARBEIT (erster) | ~280 |
| Zähler für Browsernachweise | `window.__agStand`, eine Stelle | ~30 ab Fundstelle |
| Layout, Ringgröße, Telefon | DIE GRIFFE | ~300 |
| GitHub-Abruf, Token, Seiten | `github-live.js`, nicht `index.html` | — |

## Bei Änderungen nicht vergessen

- **`FASSUNG`, `?v=' + FASSUNG` und `VORRAT` in `sw.js` steigen zusammen**
  oder gar nicht — sonst bekommt jedes Gerät den alten Stand aus dem Vorrat.
  Die Nummer gehört dem, der veröffentlicht (`CLAUDE.md`).
- **`feld/` und `pilot/github-live/` sind zwei getrennte Fassungen.** Vor
  einer Darstellungsänderung klären, welche führt (Issue #14).
- **Diese Karte ist nicht in `sw.js` gelistet** und gehört dort auch nicht
  hin: Sie ist Entwicklerhilfe, kein Seitenbestandteil.

## Pflege

Nach einem Merge, der Abschnitte hinzufügt oder verschiebt (etwa
`agent/ag-event-journal-001` mit R3, R5, Kette, Blockade, Faltung), die
Tabelle aus dem `git grep`-Aufruf oben neu erzeugen statt von Hand
nachzuziehen. Eine von Hand gepflegte Karte wird zur Behauptung über den
Code.
