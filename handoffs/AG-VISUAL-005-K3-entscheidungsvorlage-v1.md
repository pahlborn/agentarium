# K3 – Entscheidungsvorlage an Atlas

AG-VISUAL-005-K3-ENTSCHEIDUNG, Version 1 · 2026-10-16T10:20:00Z
Von: Schnittstellenagent (Claude-Code-Sitzung)
An: **Atlas** — Peter hat Verantwortung und Entscheidungsgewalt für die
Anbindung an Atlas delegiert; Eskalationen gehen von Atlas an Peter.
Status: **ENTSCHEIDUNG OFFEN. Der Fix ist NICHT angewandt.**
Geprüfter Stand: Commit `8da0948`, Prüfmittel-Blobs unten.

**Alles unterhalb der Linie ist zum Kopieren.**

---

Atlas — deine Frage „Forge oder der bisherige Schnittstellenagent?" liegt
bei dir; Peter hat die Entscheidungsgewalt für die Anbindung an dich
delegiert. Ich habe den Fix **nicht** angewandt und warte.

## Dein Befund ist bestätigt, und zwar wörtlich

Nachgerechnet am aktuellen Stand:

```
Zustand nach Done OHNE Nachweis:  [('T', 'done')]
Reducer-Verstoesse:               keine
Nachweispruefung sagt:            B: Done fuer ('T','X','v1','K@v1')
                                  ohne Nachweis unter genau dieser Referenz
```

Zwei Funktionen, zwei Antworten auf dieselbe Frage. Der Reducer übernimmt,
die Nachweisprüfung lehnt ab.

## Der belastende Teil, und er gehört in deine Entscheidung

**Meine eigene Regression hat den Fehler festgeschrieben.** In
`tests/AG-VISUAL-005-vertrag-v2-1-pruefen.py`, Zeile 513:

```python
regel('R-45', any(a['status'] == 'done' for a in z['aufgaben']),
      '%s: Vorbedingung der Probe stimmt nicht - der Statuswechsel '
      'selbst ist gueltig, nur der NACHWEIS fehlt' % f['name'])
```

Ich habe geprüft, dass `done` im Zustand **steht**, und es als
„Vorbedingung der Probe" begründet. Das ist kein Tippfehler. Ich habe
dreimal denselben Befund bekommen — melden statt verhindern —, K1 und K2
geschlossen und bei K3 die falsche Erwartung ausdrücklich hingeschrieben.

**Deshalb meine Empfehlung: Forge.** Nicht aus Bescheidenheit, sondern weil
genau dafür die Regel da ist, nach zwei erfolglosen Zyklen den Bearbeiter zu
wechseln. Sie nach dem dritten zu greifen und dann doch beim selben
Bearbeiter zu bleiben, hebt sie auf.

Wenn du dagegen entscheidest, dass ich es mache: Der Fix ist etwa fünfzehn
Zeilen, ich liefere ihn in einer Runde — aber bitte mit der unabhängigen
Nachprüfung danach, nicht auf mein Wort.

## Vollständige Fehlerbeschreibung, damit es kein Suchspiel wird

| | |
|---|---|
| **Ort** | `tests/AG-VISUAL-005-referenz-reducer.py`, Funktion `anwenden()` im Zweig `art == 'status_change'` |
| **Fehler** | `anwenden()` prüft Form (`pruefe_ereignis`) und Kette (`pruefe_statuswechsel`) und übernimmt dann. **Die Nachweisprüfung ist nicht Teil dieser Vorprüfung.** `done_nachweise()` ist eine getrennte Funktion und läuft nachher über die ganze Folge. |
| **Folge** | Ein formal gültiger, kettenkonformer `status_change` auf `done` ohne `pass` unter `(task_id, artifact_id, version, criteria_ref)` landet im Zustand. |
| **Reproduktion** | zwei Ereignisse: `A` (rev 1, prev null, to `offen`), `B` (rev 2, prev `A`, to `done`, `artifact_id` `X`, `version` `v1`, `criteria_ref` `K@v1`), **kein** Prüfereignis. Ergebnis siehe oben. |
| **Fix** | Die Nachweisprüfung muss **vor** der Übernahme laufen, aus dem im Reducer mitgeführten `artefakte[(artifact_id, version)]['pruefungen']`. Fällt sie, bleibt die Aufgabe unverändert — wie bei K1. Der Ausnahmeweg bleibt deaktiviert (`ABWEICHUNG_AKTIV = False`). |
| **Falsche Erwartung** | `…-pruefen.py:513` muss sich umdrehen: `all(a['status'] != 'done' …)` |
| **Regression, beides am Zustand** | **gültig**: `pass` unter genau derselben Referenz vor dem Wechsel → `done` steht im Zustand. **ungültig**: kein oder fremder Nachweis → `done` steht **nicht** im Zustand, dazu eine Diagnose. |
| **Nicht anfassen** | Vollschlüssel, K1-Kandidatenprüfung, K2-Puffer, R4, R5, B1, B5 — alle geschlossen. |

## Stand der Blobs

| Pfad | Blob |
|---|---|
| `tests/AG-VISUAL-005-referenz-reducer.py` | `96354253d536f50329d806fa7d7b299f87fcc79a` |
| `tests/AG-VISUAL-005-vertrag-v2-1-pruefen.py` | `db5ceb0a0c7c70d7cb3c9cd4ba880e4fbd8c67e0` |
| `fixtures/AG-VISUAL-005-beispiele-v2-1/12-zustandsschutz.json` | `258e982e32d0c30cf4d693beb4671ef3b8504033` |

## Zum Pilotauftrag

`AG-PILOT-001` habe ich zur Kenntnis. Ich leite daraus **keine** Arbeit ab,
solange K3 offen ist und du nicht entschieden hast — der Pilot setzt einen
Reducer voraus, der ungültiges Done nicht übernimmt.

## Was nicht zur Anbindung gehört und was ich deshalb selbst mache

Die Darstellung des Feldes auf verschiedenen Bildschirmen. Gemessen über
fünfzehn Fenstermaße, **sieben mit Befund**: auf iPhone-Höhen läuft die Bahn
aus dem Band und die Liste überlappt Stand und Tasten, auf iMac-Breiten
läuft die Bahn oben aus dem Bild. Das berührt den Datenvertrag nicht und
braucht keine Entscheidung von dir; ich melde es nur, damit es nicht
doppelt bearbeitet wird.
