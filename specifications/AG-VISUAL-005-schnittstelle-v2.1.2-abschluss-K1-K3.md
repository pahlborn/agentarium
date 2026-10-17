# AGENTARIUM – V2.1.2, Abschlusskorrekturen K1–K3

AG-VISUAL-005, Korrekturfassung 2.1.2 · 2026-10-16T09:40:00Z
Projekt: pahlborn/agentarium · Branch: claude/agentarium-visualisierung
Status: gezielte Abschlusskorrektur **K1–K3** am vorhandenen Prüfmittel.
Keine neue Vollspezifikation, keine Volltestkampagne, keine neue
Authentifizierungs- oder Freigabeinfrastruktur, keine produktive
Implementierung, keine Infrastrukturaktivierung, keine kostenpflichtigen
Läufe, kein Merge, kein Release, kein Deployment. **R4, R5, B1 und B5
bleiben geschlossen und werden nicht erneut aufgerollt.**
Auftrag: `handoffs/AG-VISUAL-005-INTERFACE-v2-1-1-team-review-v1.json`
Basis: `governance/AG-VISUAL-005-INTERFACE-v2-1-1-team-review-v1.md`
Geprüft: Commit `903f7b57627b199e6a3eb69234388ad58ab1653f`

Argus: `FAIL`. Sentinel: `FAIL`. Beide zu Recht.

---

## Der maßgebliche Satz

> *Eine Beanstandung zu erkennen ist nicht gleichbedeutend damit, eine
> ungültige Zustandsänderung zu verhindern.*

Dreimal hat mein Prüfmittel denselben Fehler gemacht, und er ist derselbe
in allen drei Befunden: **Es hat gemeldet und trotzdem geschrieben.**

| | Fassung 2 tat |
|---|---|
| kaputte Revisionskette | melden — **und den Status überschreiben** |
| Sequenzlücke | melden — **und den Cursor auf 106 setzen, Wirkung anwenden** |
| freie Autorisierungsstrings | als Autorisierung **akzeptieren** |

Eine Diagnose neben einem bereits veränderten Zustand ist keine Prüfung,
sondern ein Kommentar. Das ist jetzt umgedreht: **erst prüfen, dann
übernehmen.**

---

## K1 – Statusänderung erst nach vollständiger Prüfung

Neu `pruefe_statuswechsel(e, aufgaben)` → `(kandidat, beanstandungen)`.
Sie **verändert nichts**. Nur wenn die Beanstandungsliste leer ist, wird
der Kandidat atomar übernommen.

| Lage | V2.1.1 | V2.1.2 |
|---|---|---|
| Revision nicht steigend | gemeldet, **Status überschrieben** | gemeldet, **Aufgabe unverändert** |
| falscher Vorgänger | gemeldet, Status überschrieben | gemeldet, Aufgabe unverändert |
| Vorgänger fehlt, obwohl einer existiert | gar nicht erkannt | gemeldet, Aufgabe unverändert |
| ungültige erste Transition | gemeldet, **Aufgabe angelegt** | gemeldet, **nicht angelegt** |

Gemessen an Fixture 12, Fall `revision_nicht_steigend`: der fachliche
Zustand nach dem ungültigen Ereignis ist **zeichengleich** dem bekannten —
`status: "offen"`, `item_revision: 1`, `letzte_transition_id: "A"` — und
**nirgends steht `done`**.

---

## K2 – Sequenzlücke sperrt die Fortschreibung

Ein Ereignis hinter einer Lücke wirkt nicht und setzt den Cursor nicht. Es
wartet im **Puffer**, bis die fehlende Sequenz nachkommt; dann wird der
Puffer in Reihenfolge abgearbeitet. Kein stilles Überspringen, aber auch
kein Verwerfen.

```
Tail 104, 106                 →  Cursor 104, Wirkung von 106 nicht eingetreten
Tail 104, 106, dann 105       →  Cursor 106, Zustand = geordnete Zustellung
```

Beides gemessen, beides in Fixture 11 als Soll-Zustand hinterlegt. Die
Meldung lautet jetzt vollständig: *„Lücke — stream_sequence 106 nach Cursor
104. Gepuffert, Cursor bleibt 104; es fehlt 105. Kein stilles
Überspringen."*

### Eine Abgrenzung, die ich entscheiden musste

**Darf der Cursor für ein inhaltlich ungültiges Ereignis weiterzählen?**
Meine Entscheidung: **ja — und nur dafür.**

Der Cursor ist der **Verbrauchsstand der Zustellung**, nicht eine
Bestätigung der Wirkung. Ein inhaltlich ungültiges Ereignis **wurde**
zugestellt; zählte man es nicht, stünde der Strom für immer, weil jedes
folgende Ereignis als Lücke gälte. Geschützt wird der **fachliche**
Zustand: Aufgaben, Artefakte, Blockaden, Abdeckung bleiben zeichengleich.

Bei einer **Lücke** ist es umgekehrt: dort fehlt die Zustellung, also darf
der Cursor nicht springen. Fixture 11 prüft das getrennt von Fixture 12.

**Offen für euch:** Wollt ihr, dass auch ein inhaltlich ungültiges Ereignis
den Cursor nicht weiterzählt, sagt es — dann braucht der Vertrag eine Regel,
wie ein solcher Strom wieder in Gang kommt. Die Abgrenzung steht im Fixture
unter `abgrenzung`.

---

## K3 – Unbelegter Abweichungsweg deaktiviert

```python
# K3: Im aktuellen Referenzprofil ist der Ausnahmeweg ABGESCHALTET. Es gibt
# keinen maschinenpruefbaren Autorisierungsnachweis, und zwei frei gesetzte
# Zeichenketten sind keiner. Wird einer definiert, wird hier eine Pruefung
# eingehaengt -- nicht ein Schalter umgelegt.
ABWEICHUNG_AKTIV = False
```

`abweichung_autorisiert_durch` + `abweichung_grund` schalten **kein** Done
frei. Die Kombination wird als Beanstandung gemeldet, mit Begründung. Die
Felder bleiben im Schema — sie sind Daten —, aber das Referenzprofil
erkennt sie nicht als Autorisierung.

**Vollschlüssel und normale Nachweisregeln sind unverändert.** Keine neue
Authentifizierungs- oder Freigabeinfrastruktur.

---

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

Euer Vorwurf an R28 und R42 war, dass sie nur auf Fehlertext prüften. Eine
Mutation an einem Erwartungswert beweist nur, dass verglichen wird — nicht,
dass ein **Rückfall des Prüfmittels** auffällt. Deshalb dreht die
Gegenprobe das geladene Reducer-Modul absichtlich auf das alte Verhalten
zurück und verlangt, dass die Prüfung rot wird:

| Rückfall | simuliert durch | Ergebnis |
|---|---|---|
| **K1** Reducer schreibt trotz fehlerhafter Kette | `pruefe_statuswechsel` gibt keine Beanstandungen zurück | **wird rot** |
| **K2** Lücke stillschweigend übersprungen | `stream_sequence` wird vor dem Lauf fortlaufend umnummeriert | **wird rot** |
| **K3** freie Strings schalten Done frei | `ABWEICHUNG_AKTIV = True` | **wird rot** |

---

## Zwei Fehler in meinem eigenen Prüfwerk

Beide gehören hierher, weil der zweite eine Wiederholung ist:

1. **`fall12` fehlte in der Fall-Liste der Gegenprobe.** Fünf Mutationen
   liefen ins Leere. **Denselben Fehler hatte ich eine Runde vorher mit
   `fall11` gemacht und euch gemeldet** — und dann wieder gemacht. Eine
   vergessene Prüfung ist schlimmer als eine fehlende: sie meldet Erfolg.
   Die Gegenprobe liest die Fälle jetzt mit `dir(modul)` **aus dem Modul**,
   statt sie von Hand aufzuzählen. Eine Handliste, die zweimal etwas
   vergessen hat, wird nicht ein drittes Mal gepflegt.
2. **Eine meiner Mutationen war selbst wertlos:** sie setzte einen
   Schlüssel, den niemand liest, und konnte nichts auslösen. Ersetzt durch
   eine, die den Soll-Zustand verbiegt.

---

## Status je Korrektur

| | Korrektur | Status |
|---|---|---|
| **K1** | Prüfung vor Übernahme; fachlicher Zustand bleibt bei Fehler zeichengleich; keine Anlage bei ungültiger erster Transition | **getestet (Daten)** |
| **K2** | Lücke sperrt Wirkung und Cursor; Nachlieferung erlaubt geordnete Fortsetzung | **getestet (Daten)** |
| **K3** | Abweichungsweg deaktiviert; freie Strings schalten kein Done frei | **getestet (Daten)** |

„getestet (Daten)" heißt: Der Prüflauf vergleicht **Zustand und Cursor**,
nicht Fehlertext; die Gegenprobe zeigt, dass die Prüfung fehlschlagen kann;
und ein Rückfall des Prüfmittels wird rot. Es heißt **nicht**, dass eine
Implementierung geprüft wurde — es gibt keine.

### Nicht ausgeführt, unverändert

| | |
|---|---|
| Standard-JSON-Schema-Validator | **NOT_RUN** — `jsonschema`, `fastjsonschema`, `referencing`, `ajv` fehlen; nichts nachinstalliert |
| SSE / Browser-Reconnect | **NOT_TESTED** |
| Serverseitige Rechtedurchsetzung | **NOT_TESTED** |
| Nebenwirkungsfreiheit der Wiedergabe | **NOT_TESTED** |
| Verbraucherkompatibilität Agentarium/Partitur | **NOT_TESTED** |
| Reale vollständige Kostenerfassung | **UNBESTÄTIGT** |
| Implementiert | **nichts** |

---

## Pfade und Blob-Hashes

| Pfad | Blob |
|---|---|
| `tests/AG-VISUAL-005-referenz-reducer.py` (Fassung 3) | `96354253d536f50329d806fa7d7b299f87fcc79a` |
| `tests/AG-VISUAL-005-vertrag-v2-1-pruefen.py` | `db5ceb0a0c7c70d7cb3c9cd4ba880e4fbd8c67e0` |
| `tests/AG-VISUAL-005-vertrag-v2-1-gegenprobe.py` | `9ac50039b33b257f1cbee8028ec7faaa5bee535f` |
| `fixtures/…-v2-1/11-snapshot-plus-tail.json` | `6a95306b2bdad9c6699b7890129fcd986b1c2124` |
| `fixtures/…-v2-1/12-zustandsschutz.json` **neu** | `258e982e32d0c30cf4d693beb4671ef3b8504033` |

Unverändert: Schema `8486c012…` und die Fixtures `01`–`10` — K1–K3 betrafen
das Prüfmittel und zwei Fixtures, nicht den Datenvertrag. Die Blobs aus
V2.1.1 bleiben über Commit `903f7b5` nachvollziehbar.

---

## Offen

Unverändert: **O2** Betriebsrahmen · **O3** Replaykapazität · **O4**
Zeitpunkt der Kostenfeststellung · **O6** `catalog.changed` bleibt entfernt
· **O7** Partitur-Kompatibilität NOT_TESTED · **Klassenfeld für Blockaden**
(Konzept §4.3) · **Gegenlesen mit einem Standardvalidator**.

Neu: die **Cursor-Abgrenzung** aus §K2 — ob ein inhaltlich ungültiges
Ereignis den Verbrauchsstand weiterzählen darf. Ich habe mit ja
entschieden und begründet; eine andere Entscheidung bräuchte eine Regel für
das Wiederanlaufen des Stroms.
