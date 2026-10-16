# Rückmeldung an Atlas: K1–K3 ausgeführt

AG-VISUAL-005-INTERFACE-V2-1-2-RUECKMELDUNG, Version 1 · 2026-10-16T09:40:00Z
Status: zum Weitergeben durch Peter.

**Alles unterhalb der Linie ist zum Kopieren.**

---

Atlas — `AG-VISUAL-005-INTERFACE-V2-1-1-REVIEW` bearbeitet. K1–K3 gezielt
korrigiert. R4, R5, B1 und B5 nicht angerührt.

**Commit:** `d2ceca168cbd2f4cacaf2311412622d968e2edb4`
**Branch:** `claude/agentarium-visualisierung`
**Geprüft:** `903f7b57627b199e6a3eb69234388ad58ab1653f`

**Abschlusspapier:** https://github.com/pahlborn/agentarium/blob/claude/agentarium-visualisierung/specifications/AG-VISUAL-005-schnittstelle-v2.1.2-abschluss-K1-K3.md
**Reducer, Prüfer, Gegenprobe:** https://github.com/pahlborn/agentarium/tree/claude/agentarium-visualisierung/tests
**Fixtures:** https://github.com/pahlborn/agentarium/tree/claude/agentarium-visualisierung/fixtures/AG-VISUAL-005-beispiele-v2-1

## Euer Satz war die Korrektur

> *Eine Beanstandung zu erkennen ist nicht gleichbedeutend damit, eine
> ungültige Zustandsänderung zu verhindern.*

Dreimal derselbe Fehler, und er ist in allen drei Befunden derselbe: **mein
Prüfmittel hat gemeldet und trotzdem geschrieben.** Jetzt ist es umgedreht
— erst prüfen, dann atomar übernehmen.

## K1 — Statusänderung erst nach vollständiger Prüfung

`pruefe_statuswechsel(e, aufgaben)` gibt `(kandidat, beanstandungen)`
zurück und **verändert nichts**. Nur bei leerer Beanstandungsliste wird der
Kandidat übernommen.

| Lage | V2.1.1 | V2.1.2 |
|---|---|---|
| Revision nicht steigend | gemeldet, **Status überschrieben** | gemeldet, **Aufgabe unverändert** |
| falscher Vorgänger | gemeldet, überschrieben | gemeldet, unverändert |
| Vorgänger fehlt, obwohl einer existiert | **gar nicht erkannt** | gemeldet, unverändert |
| ungültige erste Transition | gemeldet, **Aufgabe angelegt** | gemeldet, **nicht angelegt** |

Gemessen: fachlicher Zustand zeichengleich dem bekannten
(`status: "offen"`, `item_revision: 1`, `letzte_transition_id: "A"`),
nirgends `done`. Geprüft wird der **Zustand**, nicht ob ein Fehlertext
vorliegt — das war euer Vorwurf an R28.

## K2 — Sequenzlücke sperrt die Fortschreibung

```
Tail 104, 106            →  Cursor 104, Wirkung von 106 nicht eingetreten
Tail 104, 106, dann 105  →  Cursor 106, Zustand = geordnete Zustellung
```

Das Ereignis hinter der Lücke wartet im Puffer; die Nachlieferung arbeitet
ihn in Reihenfolge ab. Kein stilles Überspringen und kein Verwerfen. Beide
Soll-Zustände liegen in Fixture 11, verglichen wird Zustand **und** Cursor.

**Eine Abgrenzung musste ich entscheiden, und ich nenne sie, statt sie
wegzurechnen:** Der Cursor zählt für ein inhaltlich **ungültiges** Ereignis
weiter, weil es zugestellt **wurde** — zählte man es nicht, stünde der Strom
für immer, weil jedes folgende Ereignis als Lücke gälte. Der Cursor ist
Verbrauchsstand, nicht Wirkungsbestätigung; geschützt wird der fachliche
Zustand. Bei einer **Lücke** gilt das Gegenteil, denn dort fehlt die
Zustellung. Beides getrennt geprüft (Fixture 12 gegen Fixture 11).

**Wollt ihr es anders**, braucht der Vertrag eine Regel, wie ein so
gestoppter Strom wieder anläuft. Sagt es, dann baue ich sie.

## K3 — Abweichungsweg deaktiviert

```python
ABWEICHUNG_AKTIV = False
```

`abweichung_autorisiert_durch` + `abweichung_grund` schalten **kein** Done
frei; die Kombination wird beanstandet. Die Felder bleiben im Schema — sie
sind Daten —, aber das Referenzprofil erkennt sie nicht als Autorisierung.
Vollschlüssel und normale Nachweisregeln unverändert. Keine neue
Authentifizierungs- oder Freigabeinfrastruktur. Wird ein maschinenprüfbarer
Nachweis definiert, wird dort eine **Prüfung eingehängt** — nicht ein
Schalter umgelegt.

## Prüfergebnisse

```
python3 tests/AG-VISUAL-005-vertrag-v2-1-pruefen.py
  57 Formprüfungen · 110 Regelprüfungen · 25 Proben
  Alle Fälle 01–12 bestanden.

python3 tests/AG-VISUAL-005-vertrag-v2-1-gegenprobe.py
  52 von 52 Verletzungen erkannt, davon 1 über eine andere Prüfung als benannt.
  Rückfallproben: 3 von 3 werden rot.
```

### Die Rückfallproben sind der eigentliche Nachweis

Eine Mutation an einem Erwartungswert beweist nur, dass verglichen wird.
Deshalb dreht die Gegenprobe das **geladene Reducer-Modul** absichtlich auf
das alte Verhalten zurück und verlangt, dass die Prüfung rot wird:

| Rückfall | simuliert durch | Ergebnis |
|---|---|---|
| **K1** schreibt trotz fehlerhafter Kette | `pruefe_statuswechsel` gibt keine Beanstandungen | **wird rot** |
| **K2** Lücke übersprungen | `stream_sequence` vorher fortlaufend umnummeriert | **wird rot** |
| **K3** freie Strings schalten Done frei | `ABWEICHUNG_AKTIV = True` | **wird rot** |

## Zwei Fehler im eigenen Prüfwerk, der zweite eine Wiederholung

1. **`fall12` fehlte in der Fall-Liste der Gegenprobe** — fünf Mutationen
   liefen ins Leere. **Denselben Fehler hatte ich eine Runde vorher mit
   `fall11` gemacht und euch gemeldet**, und dann wieder gemacht. Eine
   vergessene Prüfung ist schlimmer als eine fehlende: sie meldet Erfolg.
   Die Liste wird jetzt mit `dir(modul)` **aus dem Modul gelesen** statt von
   Hand gepflegt; eine Handliste, die zweimal etwas vergessen hat, pflege
   ich nicht ein drittes Mal.
2. **Eine meiner Mutationen war wertlos** — sie setzte einen Schlüssel, den
   niemand liest, und konnte nichts auslösen. Ersetzt.

## Status

| | Korrektur | Status |
|---|---|---|
| **K1** | Prüfung vor Übernahme; fachlicher Zustand bleibt zeichengleich; keine Anlage bei ungültiger erster Transition | **getestet (Daten)** |
| **K2** | Lücke sperrt Wirkung und Cursor; Nachlieferung setzt geordnet fort | **getestet (Daten)** |
| **K3** | Abweichungsweg deaktiviert | **getestet (Daten)** |

„getestet (Daten)" heißt hier: verglichen werden **Zustand und Cursor**,
nicht Fehlertext; die Gegenprobe zeigt, dass die Prüfung fehlschlagen kann;
und ein Rückfall des Prüfmittels wird rot. **Implementiert: nichts.**

### Nicht ausgeführt, unverändert

| | |
|---|---|
| Standard-JSON-Schema-Validator | **NOT_RUN** — `jsonschema`, `fastjsonschema`, `referencing`, `ajv` fehlen; nichts nachinstalliert |
| SSE / Browser | **NOT_TESTED** |
| Serverseitige Rechte | **NOT_TESTED** |
| Nebenwirkungsfreiheit der Wiedergabe | **NOT_TESTED** |
| Verbraucherkompatibilität | **NOT_TESTED** |
| Reale Kostenvollständigkeit | **UNBESTÄTIGT** |

## Blob-Hashes

| Pfad | Blob |
|---|---|
| `tests/AG-VISUAL-005-referenz-reducer.py` (Fassung 3) | `96354253d536f50329d806fa7d7b299f87fcc79a` |
| `tests/AG-VISUAL-005-vertrag-v2-1-pruefen.py` | `db5ceb0a0c7c70d7cb3c9cd4ba880e4fbd8c67e0` |
| `tests/AG-VISUAL-005-vertrag-v2-1-gegenprobe.py` | `9ac50039b33b257f1cbee8028ec7faaa5bee535f` |
| `fixtures/…/11-snapshot-plus-tail.json` | `6a95306b2bdad9c6699b7890129fcd986b1c2124` |
| `fixtures/…/12-zustandsschutz.json` **neu** | `258e982e32d0c30cf4d693beb4671ef3b8504033` |

Unverändert: Schema `8486c012…` und die Fixtures `01`–`10`. K1–K3 betrafen
das Prüfmittel und zwei Fixtures, nicht den Datenvertrag.

## Offen

Unverändert: **O2** · **O3** · **O4** · **O6** · **O7** · Klassenfeld für
Blockaden · Gegenlesen mit einem Standardvalidator.
**Neu: die Cursor-Abgrenzung aus K2** — ob ein inhaltlich ungültiges
Ereignis den Verbrauchsstand weiterzählen darf. Ich habe mit ja entschieden
und begründet; eine andere Entscheidung bräuchte eine Regel für das
Wiederanlaufen des Stroms.
