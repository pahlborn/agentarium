# AGENTARIUM – Schnittstellenvertrag V2.1.1, Restkorrekturen R1–R5

AG-VISUAL-005, Korrekturfassung 2.1.1 · 2026-10-15T21:20:00Z
Projekt: pahlborn/agentarium · Branch: claude/agentarium-visualisierung
Status: gezielte Restkorrektur der fünf Punkte **R1–R5**. Keine neue
Vollspezifikation, keine Volltestkampagne, keine Infrastruktur, keine
produktive Implementierung, keine kostenpflichtigen Läufe, kein Merge, kein
Release, keine Veröffentlichung. B1 und B5 werden nicht erneut aufgerollt.
Auftrag: `handoffs/AG-VISUAL-005-INTERFACE-v2-1-team-review-v1.json`
(`AG-VISUAL-005-INTERFACE-V2-1-REVIEW`, Atlas, `REVISION_REQUIRED`)
Basis: `governance/AG-VISUAL-005-INTERFACE-v2-1-team-review-v1.md`
Geprüfte Fassung: V2.1, Blob `515954d3b57cd75046bc8e5e7f8563af4d0c1968`,
Commit `8feefe2a98eca444b5352c9c9c3f0d52069304e2` — **bleibt liegen** als
Nachweis, auf den Argus und Sentinel zeigen; dieses Papier tritt daneben.

Argus: `FAIL`. Sentinel: `FAIL`. Beide zu Recht.

---

## Die Lücke, die alles trug

Sentinels Probe `original_noop_with_required_shell` hat eine Stelle
gefunden, an der **zwei meiner Prüfungen aneinander vorbeiliefen**:

| | V2.1 |
|---|---|
| Der Reducer schrieb Status | bei **jedem** Ereignis mit `item_revision` und `to` |
| `done_nachweise` prüfte | nur `kind == "status_change"` |

Ein formal vollständiges Ereignis **unbekannter Art** mit Zustandsfeldern
schrieb damit Status — und kam an der Done-Prüfung vorbei. Ergebnis der
unabhängigen Probe: `reducer_status: done`, `reducer_violations: []`,
`done_findings: []`. Done aus nichts.

Das war nicht ein vergessener Randfall, sondern **eine falsche
Arbeitsteilung zwischen zwei Prüfungen**. Deshalb geht in V2.1.1 jedes
Ereignis durch **eine** vorgelagerte Prüfung, und ein ungültiges Ereignis
verändert den Zustand nicht — normale Statuswechsel und Done nehmen denselben
Weg.

**Dazu die Antwort auf meine eigene Frage:** Ich hatte
`minimal_work_event` als „Kommunikationsart ohne Empfänger" gelesen und
gefragt, ob das gemeint sei. Antwort: **nein.** Gemeint war das
inhaltsarme unbekannte Ereignis, das fachliche Regeln umgeht. Die Probe
ohne Empfänger bleibt, die eigentliche kommt dazu.

---

## R1 – Nur definierte Zustandsereignisse schreiben Status

| | |
|---|---|
| **Reducer R2** | läuft **ausschließlich** bei `kind == "status_change"` |
| **Fremde Arten** | dürfen `item_revision`, `from`, `to`, `previous_transition_id` und `nachweis_ref` **nicht tragen** — der `else`-Zweig im Schema lässt sie nicht durch, der Reducer meldet sie als Verstoß |
| **Titel** | `title` ist nichtleer, im Schema und in der Vorprüfung |
| **Ein Weg** | `pruefe_ereignis()` läuft vor jeder Zustandswirkung; ungültig heißt wirkungslos |
| **Probe** | `original_noop_with_required_shell` (Form) und `noop_state_pollution_reducer` (Zustand) |

Unbekannte Arten werden **nicht** abgelehnt — sie erscheinen als Verkehr
ohne Niederschlag, wie das Konzept §4.1 verlangt. Verboten ist nur, dass sie
Zustand schreiben.

**Folge, die mir die Korrektur aufgezwungen hat:** In V2.1 waren `W1`/`W2`
(Fixture 05) und `R1` (Fixture 09) `kind: "request"` **mit**
Zustandsfeldern. Genau das ist jetzt verboten, also sind sie echte
Statuswechsel. Ein erster Übergang trägt `from: null` bei
`previous_transition_id: null`; der Reducer prüft das Paar, weil ein Schema
zwei Felder nicht gegeneinander prüfen kann.

---

## R2 – Nachweis an der vollen Referenz

In V2.1 lautete der Schlüssel `(artifact_id, version)`. **Fixture 05 war
selbst der Beweis:** `W7b` bestand unter `AG-VISUAL-004-testability@v1`,
`W8` setzte Done unter `AG-PROC-REVIEW-001@v1` — einer Kriterienfassung,
unter der nie etwas bestanden hatte. Mein Prüfer ließ es durch.

| | V2.1.1 |
|---|---|
| **Schlüssel** | `(task_id, artifact_id, version, criteria_ref)` |
| **Done nennt den Nachweis** | `nachweis_ref` zeigt auf die Ereignis-ID; stimmt sie nicht mit dem maßgeblichen Nachweis, ist das ein Befund |
| **Fremde Aufgabe** | ein Pass unter anderer `task_id` erlaubt Done nicht |
| **Späteres Fail** | sperrt Done auf dieselbe Referenz, bis ein neuer gültiger Nachweis vorliegt |
| **Abweichung** | `abweichung_autorisiert_durch` **und** `abweichung_grund` bleiben ein eigener, belegter Weg — keine freie Namensbehauptung |
| **Zustand** | jeder Prüfungseintrag im `zustand_am_cursor` trägt `task_id` |

Fixture 05 ist konsistent korrigiert: `W8` beruft sich auf
`AG-VISUAL-004-testability@v1` und nennt `nachweis_ref: "W7b"`.

---

## R3 – Schnappschuss plus Tail wirklich fortschreiben

V2.1 begann leer und setzte `cursor = len(ereignisse)`. **Die Anzahl
importierter Ereignisse ist keine Transportsequenz** — damit konnte kein
Schnappschuss fortgeschrieben und kein Cursor abgeglichen werden.

| | V2.1.1 |
|---|---|
| `reduziere(..., initial_state=…, cursor=…)` | schreibt auf einem Schnappschuss fort |
| Cursor | ist die `stream_sequence` des letzten verarbeiteten Ereignisses |
| innen gegen außen | `zustand_am_cursor.cursor == schnappschuss.cursor`, geprüft |
| Doppeltes | `stream_sequence <= Cursor` wird erkannt und **verworfen**, ohne Zustandswirkung |
| Lücke | wird gemeldet, nicht übersprungen |

**Der Vergleich, den R3 verlangt**, steht als Fixture 11: eine Vollhistorie
`101…106`, ein Schnappschuss bei `103` (vom Reducer berechnet) und der Tail
`104…106`. Geprüft wird, dass **Vollhistorie bis 106 zeichengleich
denselben Zustand ergibt wie Schnappschuss bei 103 plus Tail** — in
Aufgaben, Prüfungen, Blockaden, Owner **und** Cursor.

`stream_sequence` steht dabei im **Umschlag**, nicht im Arbeitsereignis.
Transportfolge und Fachidentität bleiben getrennt; der Prüfer setzt die
Folge für den Reducer aus dem Umschlag ein.

---

## R4 – Befehlsprofil maschinenlesbar

`supported_actions = []` stand nur in Prosa, **während Fixture 08
gleichzeitig eine erfolgreiche Ausführung von `freigabe.erteilen`
enthielt.** Ein Widerspruch im eigenen Bestand.

| | V2.1.1 |
|---|---|
| `$defs.betrieb` | `supported_actions` ist **Pflichtfeld**, aktuelles Profil `[]` |
| `$defs.schnappschuss` | trägt es ebenfalls |
| Betriebsfixtures | enthalten **keine** angenommene oder ausgeführte Aktion; geprüft wird auch, dass nirgends `"ausgefuehrt"` vorkommt |
| generische Form | steht getrennt als `aktiviert: false`, ausdrücklich **kein** Nachweis unterstützter Befehle |
| Wiederholung | wird jetzt mit `nicht_unterstuetzt` abgelehnt, nicht mit `doppelt_ignoriert` — es gibt nichts, was doppelt ausgeführt werden könnte |

---

## R5 – Übergabevalidierung von Quelltreue unterscheiden

Hier hatte **ich** überschossen: Um Sentinels Probe
`ownership_change_without_task_scope_basis` zu bestehen, hatte V2.1
`scope` und `basis` zur Pflicht gemacht. Atlas trennt das zu Recht —
**optionale Metadaten pauschal verpflichtend zu machen war kein Auftrag,
und ihr Fehlen ist kein Beweis für Datenverlust.**

| | V2.1.1 |
|---|---|
| **effektive Zielaufgabe** | muss eindeutig aus `ownership_change.task_id` **oder** `task_id` des Ereignisses hervorgehen |
| **Widerspruch** | beide gesetzt und verschieden → abgelehnt |
| **keine Aufgabe** | weder innen noch außen → abgelehnt |
| `to` | Pflicht, nichtleer: eine Rolle oder eine ausdrücklich dokumentierte Freigabe |
| `scope`, `basis` | **optional**, bleiben aber erhalten, wenn sie da sind |
| unverändert | Verantwortung folgt nie aus `recipient` oder `parent_task_id` allein |

Die Probe `ownership_ohne_scope_basis_ist_KEIN_fehler` ist deshalb eine
**positive** Prüfung: sie **muss bestehen**. Mein Prüfer hatte sie
fälschlich erzwungen.

---

## Prüfergebnisse

```
python3 tests/AG-VISUAL-005-vertrag-v2-1-pruefen.py
  50 Formprüfungen · 82 Regelprüfungen · 25 Proben
  Alle Fälle 01–11 bestanden, alle Proben wie verlangt behandelt.

python3 tests/AG-VISUAL-005-vertrag-v2-1-gegenprobe.py
  45 von 45 Verletzungen erkannt, davon 1 über eine andere Prüfung als benannt.
```

### Die Proben aus dem V2.1-Review

| Probe | V2.1 | V2.1.1 |
|---|---|---|
| `original_noop_with_required_shell` | ACCEPTED | **abgelehnt** |
| `noop_state_pollution` (Reducer) | ACCEPTED | **erkannt** |
| `ownership_change_without_task_scope_basis` | ACCEPTED | **angenommen — richtigerweise** (R5) |
| `done_falsche_kriterienfassung` | ACCEPTED | **erkannt** |
| `done_fremde_aufgabe` | ACCEPTED | **erkannt** |
| `titel_leer` | ACCEPTED | **abgelehnt** |
| `betrieb_mit_aktionen` | Prosa-Widerspruch | **erkannt** |

Dazu neu: `spaeteres_fail_sperrt_done`, `nachweis_ref_zeigt_falsch`,
`ownership_widerspruechliche_aufgabe`, `ownership_ohne_effektive_aufgabe`,
`tail_doppelt`.

### Zwei Dinge über den Prüflauf selbst

- **Sechs ältere Proben prüften nicht, was ihr Name behauptet.**
  `done_ohne_pass`, `revisionskette_gebrochen` und vier weitere hatten
  keinen `title`. Mit der neuen Vorprüfung wären sie schon **formal**
  ungültig gewesen und hätten bestanden, ohne den Befund zu treffen. Sie
  tragen jetzt eine vollständige formale Hülle.
- **Eine Gegenprobe-Mutation griff ins Leere**, weil ich `fall11` in der
  Gegenprobe nicht in die Liste der ausgeführten Prüfungen aufgenommen
  hatte. Fünf Mutationen liefen gegen eine Prüfung, die nie lief. Behoben;
  derselbe Fehlertyp wie bei `R-16c` in V2.

### Grenzen, unverändert

| | |
|---|---|
| Standard-JSON-Schema-Validator | **NOT_RUN** — nicht installiert, kein Nachladen (Projektregel) |
| SSE / Browser-Reconnect | **NOT_TESTED** |
| Serverseitige Rechtedurchsetzung | **NOT_TESTED** |
| Nebenwirkungsfreiheit der Wiedergabe | **NOT_TESTED** (behauptete Nullwerte, als solche gekennzeichnet) |
| Verbraucherkompatibilität Agentarium/Partitur | **NOT_TESTED** |
| Reale vollständige Kostenerfassung | **UNBESTÄTIGT** |
| Implementiert | **nichts** |

Zur Anmerkung des Reviews: Das Einheitsschema ist eine
**Definitionsbibliothek**. Ein Standardvalidator muss den konkreten
`$defs`-Einstiegspunkt validieren — `umschlag`, `schnappschuss`,
`archivmanifest`, `befehl`, `resume_antwort`, `betrieb`, `arbeitsereignis`,
`kostenfeld`. Die Wurzel allein prüft keine Nutzdaten. Mein Prüfer wählt
den Einstiegspunkt je Fall ausdrücklich.

---

## Status je Restkorrektur

| | Korrektur | Status |
|---|---|---|
| **R1** | nur `status_change` schreibt Status; eine Vorprüfung; Titel nichtleer | **getestet (Daten)** |
| **R2** | Nachweis an `(task_id, artifact_id, version, criteria_ref)`; `nachweis_ref`; späteres Fail sperrt | **getestet (Daten)** |
| **R3** | `initial_state` + echter Stromcursor; Vollhistorie gegen Schnappschuss+Tail; Doppeltes und Lücken | **getestet (Daten)** |
| **R4** | `supported_actions` maschinenlesbar `[]`; keine ausgeführte Aktion im Bestand | **getestet (Daten)** |
| **R5** | effektive Zielaufgabe eindeutig; `scope`/`basis` bleiben optional | **getestet (Daten)** |

„getestet (Daten)" heißt: Der Prüflauf rechnet die Regel an den
Beispieldaten nach, und die Gegenprobe zeigt, dass sie fehlschlagen kann.
Es heißt **nicht**, dass eine Implementierung geprüft wurde — es gibt keine.

---

## Pfade und Blob-Hashes

| Pfad | Blob |
|---|---|
| `specifications/AG-VISUAL-005-schnittstelle-v2.1.1-restkorrektur.md` | siehe Fassungsregister |
| `specifications/AG-VISUAL-005-schemas-v2/vertrag-v2-1.schema.json` | `8486c0120942c5fe9f30153f66c6e4177dfcc016` |
| `tests/AG-VISUAL-005-referenz-reducer.py` | `7a94f89414fd5485c390764f130357958785e609` |
| `tests/AG-VISUAL-005-vertrag-v2-1-pruefen.py` | `7ad58a4b7fe25e5d7354fd9cf6bd3268368c7f7f` |
| `tests/AG-VISUAL-005-vertrag-v2-1-gegenprobe.py` | `ab428ff46f39fa775e7934d766965061c36c01f0` |
| `fixtures/…-v2-1/01-einstieg-snapshot-live.json` | `30f050123b269c04d4a24bf2c24db83b928266ff` |
| `fixtures/…-v2-1/02-heartbeat-veraltet.json` | `26e2a38035912c6466c1ce3fbde6614baf1fb983` |
| `fixtures/…-v2-1/03-resume-grenzfaelle.json` | `868d281f33be488aa77799a1daf4183dd57afd6f` |
| `fixtures/…-v2-1/04-zwei-projekte-laeufe.json` | `d4f6f5532990b310e70887ef11d19e78792312b2` |
| `fixtures/…-v2-1/05-parallel-artefakte-review.json` | `9c85b8c478fbf3d4f55f3797cb363ddc00cfcd52` |
| `fixtures/…-v2-1/06-kosten-sichtbar-ohne-betrag.json` | `adcfacdf263219092bb62faad2a07216e28a7de7` |
| `fixtures/…-v2-1/07-altlog-ohne-zeitpunkte.json` | `5017c87233766c95a9b01f2a24cae048a6ee251d` |
| `fixtures/…-v2-1/08-nurlesen-befehle.json` | `981d922eba7eb27f43407eb5d4b97476436b669f` |
| `fixtures/…-v2-1/09-archiv-zeitsprung.json` | `c32d7b2564ff0d2b8d84debb0fc0be1ca7b9fe4a` |
| `fixtures/…-v2-1/10-negativproben.json` | `cbb6a5d41e9de5138eaca4f9999306348ed9124b` |
| `fixtures/…-v2-1/11-snapshot-plus-tail.json` **neu** | `0f51ac128ea3920de7cf628830cef137f9661490` |

Unverändert geblieben sind `02`, `04`, `06`, `07` — R1–R5 berührten sie
nicht. Die Blobs aus V2.1 (Schema `26ace428…`, Reducer `03028c48…`,
Prüfer `90ae4595…`, Gegenprobe `d5f75b11…` und die zehn Fixtures) sind über
Commit `8feefe2` weiter nachvollziehbar.

**Nebenbefund, mit korrigiert:** `tests/__pycache__/` lag versioniert im
Repository — von mir mit `git add -A` versehentlich mitgenommen. Jetzt aus
der Versionierung entfernt, dazu eine `.gitignore`.

---

## Offen

Unverändert aus V2.1 §Offen: **O2** (Betriebsrahmen), **O3**
(Replaykapazität), **O4** (Zeitpunkt der Kostenfeststellung, Forschung soll
nicht neu beginnen), **O6** (`catalog.changed` bleibt entfernt), **O7**
(Partitur-Kompatibilität NOT_TESTED), dazu das **Klassenfeld für
Blockaden** aus Konzept §4.3 und das Gegenlesen der Schemas mit einem
Standardvalidator.
