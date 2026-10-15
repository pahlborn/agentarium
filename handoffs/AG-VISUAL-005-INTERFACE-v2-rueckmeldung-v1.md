# Rückmeldung an Atlas: Schnittstellenvertrag V2 liegt vor

AG-VISUAL-005-INTERFACE-V2-RUECKMELDUNG, Version 1 · 2026-10-15T19:31:00Z
Status: zum Weitergeben durch Peter.

**Alles unterhalb der Linie ist zum Kopieren.**

---

Atlas — Korrekturauftrag `AG-VISUAL-005-INTERFACE-REREVIEW` ausgeführt.
Alle zehn verbindlichen Korrekturen sind eingearbeitet.

**Commit:** `b0a08c1cd54b21424837cf51dc6d8dda083699cb`
**Branch:** `claude/agentarium-visualisierung`
**Vorgängerstand, auf dem ich aufsetzte:** `313f096d` (euer Stand, zeichengenau)

## Pfade und Blob-Hashes

| Pfad | Blob |
|---|---|
| `specifications/AG-VISUAL-005-schnittstelle-v2.md` | `8c86e3c6207030adcf0f1a2bb21194e3c3820f8b` |
| `specifications/AG-VISUAL-005-schemas-v2/strom.schema.json` | `7814828bf35ae60ab1ea4429f8e5502fd1f2ab85` |
| `specifications/AG-VISUAL-005-schemas-v2/schnappschuss.schema.json` | `d5bcda382664adba0940ac2028b9d35ed1c5bd62` |
| `specifications/AG-VISUAL-005-schemas-v2/archivmanifest.schema.json` | `98fe469ca4e83176fc2a11f6a6532b92cea5f3a0` |
| `specifications/AG-VISUAL-005-schemas-v2/befehl.schema.json` | `79ce90a4c7b7f0e3f1cb10dfcdd602309bdcb223` |
| `tests/AG-VISUAL-005-vertrag-v2-pruefen.py` | `24e6620542ad4866e71865282b1dc95e67eac18c` |
| `tests/AG-VISUAL-005-vertrag-v2-gegenprobe.py` | `0f5ea4ddccc72054d854079f98401b8dedc8d827` |

Die neun Abnahmefälle liegen unter `fixtures/AG-VISUAL-005-beispiele-v2/`;
ihre Einzel-Blobs stehen in Vertrag V2 §11. Prüft gegen den Blob, nicht
gegen den Zweig.

## Status je Korrektur

| | Korrektur | Status |
|---|---|---|
| 1 | Katalogstrom getrennt, eigener Sequenzraum | getestet (Daten) |
| 2 | Projektanlage, `project_id` / `run_id` | getestet (Daten) |
| 3 | Live/Archiv aus dem Laufzustand, neun Zustände | getestet (Daten) |
| 4 | SSE-Anmeldung und Reconnect | **spezifiziert**, Reconnect-Daten getestet |
| 5 | Keepalive und `heartbeat` getrennt, 5 s / 20 s | getestet (Daten) |
| 6 | `zeitachse` mit Ableitungsregel | getestet (Daten) |
| 7 | Feldtabelle dreispaltig, `erledigt` entfällt, `run_id` additiv | getestet (Daten) |
| 8 | `read` / `command` serverseitig, Wand nur lesend | **spezifiziert**, Daten getestet |
| 9 | Kostenfeld sichtbar, nur Statussatz | getestet (Daten) |
| 10 | Vertrag, Schemas, Beispieldaten | getestet (Daten) |

**Implementiert: nichts.** 4 und 8 bleiben spezifiziert, weil ihr Kern —
Cookie- gegen Header-Betrieb, serverseitige Durchsetzung — ohne Server
nicht nachweisbar ist.

## Zu Sentinels FAIL_TESTABILITY_ONLY

Jeder Abnahmefall trägt seine Erwartung als benannte Regeln `R-01…R-23`
bei sich, und ein Prüflauf rechnet sie nach:

```
python3 tests/AG-VISUAL-005-vertrag-v2-pruefen.py
  38 Formprüfungen · 59 Regelprüfungen · Fälle 01–09 bestanden

python3 tests/AG-VISUAL-005-vertrag-v2-gegenprobe.py
  21 von 21 absichtlichen Verletzungen erkannt
```

Der zweite Lauf ist der wichtigere. Ein Prüfer, der beim ersten Mal
besteht, beweist nichts — er könnte nichts prüfen. Die Gegenprobe verletzt
jeden Fall absichtlich und verlangt, dass die zugehörige Regel anspringt.

**Drei Grenzen, damit niemand den Lauf für mehr nimmt, als er ist:**

1. Der Prüfer bringt einen **eigenen, kleinen** Schemaprüfer mit, weil kein
   `jsonschema` im Container liegt und die Projektregel das Nachladen zur
   Laufzeit verbietet. Er deckt nur die verwendeten Schlüsselwörter ab und
   ist **kein** vollständiger Prüfer; die Schemas sind nach JSON Schema
   2020-12 für einen Standardprüfer geschrieben. Bitte einmal mit einem
   solchen gegenlesen.
2. Eine der 21 Verletzungen (`R-15b`, fehlender `fehlercode`) wird von der
   **Form** gefangen, nicht von ihrer Regel. Erkannt, aber nicht durch das,
   was ihr Name behauptet.
3. **Datenprüfung, kein Laufzeitnachweis.** Kein Server, kein SSE, kein
   Browser.

## Euer Einwand zur Eintrittskarte war richtig

Mein Vorschlag ist gestrichen, und die Begründung ist genau die von euch
genannte: Natives `EventSource` verbindet mit **derselben** URL erneut — ein
verbrauchtes Ticket sperrte damit den Reconnect, für den es gedacht war.
Dazu erscheinen URL-Token in Zugriffsprotokollen. V2 §3.1 hat jetzt die
beiden Betriebsrahmen, und der Server muss nennen, welcher gilt; ein Client
darf nicht raten.

## Offene Entscheidungen

| | offen | bei wem |
|---|---|---|
| **O-1** | **Welche Aktionen die Orchestrierung tatsächlich unterstützt.** Ohne diese Liste bleibt der Befehlskanal ein Rahmen ohne Inhalt, und nicht unterstützte Aktionen dürfen nicht angeboten werden. Das ist der blockierende offene Punkt. | Atlas / Team |
| **O-2** | Gleicher Ursprung mit Cookie-Sitzung oder getrennter Ursprung mit `fetch`-Streaming? Davon hängt ab, ob der Reconnect eingebaut ist oder geschrieben werden muss. | Team / Betrieb |
| **O-3** | Tatsächliche Replaygrenze je Strom. Vorschlag im Vertrag: 500 Ereignisse oder eine Stunde. | Team |
| **O-4** | Wann der Verbrauch eines Auftrags feststeht — bei der Lieferung oder über eine Abrechnung. Entscheidet, ob Kosten je Auftrag oder nur je Rolle zuzuordnen sind. | Team |
| **O-5** | Dürfen mehrere Läufe eines Projekts gleichzeitig aktiv sein? Der Vertrag erlaubt es, der Prozess muss es zulassen. | Atlas / Prozess |
| **O-6** | `catalog.changed`: welche Änderungen es meldet. Im Vertrag als Platzhalter, Nutzdaten offen. | Team |
| **O-7** | Verwendet Partitur denselben Vertrag? §7.2 verlangt denselben fachlichen Zustand am selben Cursor; geprüft ist das nicht. | Atlas |

Bereit für Argus-Delta-Review und Sentinel-Testbarkeitsprüfung gegen genau
diese Blobs. Keine Implementierung, keine Infrastruktur, keine
kostenpflichtigen Läufe, kein Merge, keine Veröffentlichung. Schnittstelle
V1 bleibt unverändert als Prüfnachweis liegen.
