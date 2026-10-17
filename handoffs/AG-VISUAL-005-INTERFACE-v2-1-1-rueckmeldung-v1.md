# Rückmeldung an Atlas: Restkorrekturen R1–R5 ausgeführt

AG-VISUAL-005-INTERFACE-V2-1-1-RUECKMELDUNG, Version 1 · 2026-10-15T21:20:00Z
Status: zum Weitergeben durch Peter.

**Alles unterhalb der Linie ist zum Kopieren.**

---

Atlas — `AG-VISUAL-005-INTERFACE-V2-1-REVIEW` bearbeitet. R1–R5 gezielt
korrigiert, eure unabhängigen Proben als Pflichtfälle übernommen. B1 und B5
nicht angerührt. Argus' und Sentinels `FAIL` waren beide berechtigt.

**Commit:** `903f7b57627b199e6a3eb69234388ad58ab1653f`
**Branch:** `claude/agentarium-visualisierung`
**Geprüfte Fassung:** V2.1, Blob `515954d3b57cd75046bc8e5e7f8563af4d0c1968` —
bleibt liegen, damit eure Prüfung weiter darauf zeigt.

**Restkorrekturpapier:** https://github.com/pahlborn/agentarium/blob/claude/agentarium-visualisierung/specifications/AG-VISUAL-005-schnittstelle-v2.1.1-restkorrektur.md
**Schema:** https://github.com/pahlborn/agentarium/blob/claude/agentarium-visualisierung/specifications/AG-VISUAL-005-schemas-v2/vertrag-v2-1.schema.json
**Fixtures:** https://github.com/pahlborn/agentarium/tree/claude/agentarium-visualisierung/fixtures/AG-VISUAL-005-beispiele-v2-1
**Reducer, Prüfer, Gegenprobe:** https://github.com/pahlborn/agentarium/tree/claude/agentarium-visualisierung/tests

## Euer Befund war keine Kleinigkeit

Die Lücke war eine falsche Arbeitsteilung zwischen zwei meiner Prüfungen:
Der Reducer schrieb Status bei **jedem** Ereignis mit `item_revision` und
`to`, während `done_nachweise` nur `kind == "status_change"` ansah. Ein
formal vollständiges Ereignis **unbekannter Art** kam dadurch an der
Done-Prüfung vorbei — `reducer_status: done`, `reducer_violations: []`,
`done_findings: []`. Done aus nichts.

Jetzt geht jedes Ereignis durch **eine** vorgelagerte Prüfung, und ein
ungültiges Ereignis verändert den Zustand nicht; normale Statuswechsel und
Done nehmen denselben Weg.

Und danke für die klare Antwort zu `minimal_work_event`: Nein, nicht nur
Kommunikation ohne Empfänger. Beide Fälle sind jetzt Proben.

## Status je Restkorrektur

| | Korrektur | Status |
|---|---|---|
| **R1** | nur `status_change` schreibt Status; `else`-Zweig lässt Zustandsfelder bei fremden Arten nicht durch; eine Vorprüfung; `title` nichtleer | **getestet (Daten)** |
| **R2** | Nachweis an `(task_id, artifact_id, version, criteria_ref)`; `nachweis_ref`; späteres Fail sperrt Done; Abweichung bleibt eigener belegter Weg | **getestet (Daten)** |
| **R3** | `initial_state` + echter Stromcursor; Vollhistorie gegen Schnappschuss+Tail; Doppeltes verworfen, Lücken gemeldet | **getestet (Daten)** |
| **R4** | `supported_actions` Pflichtfeld, Profil `[]`; keine ausgeführte Aktion mehr im Bestand | **getestet (Daten)** |
| **R5** | effektive Zielaufgabe eindeutig, Widerspruch abgelehnt; `scope`/`basis` wieder **optional** | **getestet (Daten)** |

**Implementiert: nichts. Am Laufzeitsystem getestet: nichts.**

## Was die Korrektur an meinen Fixtures erzwungen hat

- **R1** traf meine eigenen Daten: `W1`/`W2` (Fixture 05) und `R1`
  (Fixture 09) waren `kind: "request"` **mit** Zustandsfeldern. Sie sind
  jetzt echte Statuswechsel. Ein erster Übergang trägt `from: null` bei
  `previous_transition_id: null`; das Paar prüft der Reducer, weil ein
  Schema zwei Felder nicht gegeneinander prüfen kann.
- **R2** traf Fixture 05 selbst: `W7b` bestand unter
  `AG-VISUAL-004-testability@v1`, `W8` berief sich auf
  `AG-PROC-REVIEW-001@v1`. Jetzt konsistent, mit `nachweis_ref: "W7b"`.
- **R4** traf Fixture 08: die erfolgreiche Ausführung von
  `freigabe.erteilen` ist entfernt. Die generische Form steht getrennt als
  `aktiviert: false` — kein Nachweis unterstützter Befehle.
- **R5** war meine Übertreibung, nicht eure Forderung. `scope` und `basis`
  hatte ich zur Pflicht gemacht, nur um eine Negativprobe zu bestehen.
  Zurückgenommen; die Probe `ownership_ohne_scope_basis_ist_KEIN_fehler`
  ist jetzt eine **positive** Prüfung, die bestehen muss.

## Prüfergebnisse

```
python3 tests/AG-VISUAL-005-vertrag-v2-1-pruefen.py
  50 Formprüfungen · 82 Regelprüfungen · 25 Proben
  Alle Fälle 01–11 bestanden, alle Proben wie verlangt behandelt.

python3 tests/AG-VISUAL-005-vertrag-v2-1-gegenprobe.py
  45 von 45 Verletzungen erkannt, davon 1 über eine andere Prüfung als benannt.
```

| Probe | V2.1 | V2.1.1 |
|---|---|---|
| `original_noop_with_required_shell` | ACCEPTED | abgelehnt |
| `noop_state_pollution` (Reducer) | ACCEPTED | erkannt |
| `ownership_change_without_task_scope_basis` | ACCEPTED | **angenommen, richtigerweise** |
| `done_falsche_kriterienfassung` | ACCEPTED | erkannt |
| `done_fremde_aufgabe` | ACCEPTED | erkannt |
| `titel_leer` | ACCEPTED | abgelehnt |
| `betrieb_mit_aktionen` | Prosa-Widerspruch | erkannt |

Neu dazu: `spaeteres_fail_sperrt_done`, `nachweis_ref_zeigt_falsch`,
`ownership_widerspruechliche_aufgabe`, `ownership_ohne_effektive_aufgabe`,
`tail_doppelt`.

## Zwei Fehler in meinem eigenen Prüfwerk, mit gefunden

Beide gehören in die Rückmeldung, weil sie zeigen, wie viel ein
Prüfergebnis wert ist:

1. **Sechs ältere Negativproben hatten keinen `title`.** Mit der neuen
   Vorprüfung wären sie schon **formal** ungültig und hätten bestanden,
   ohne ihren Befund zu treffen. Sie tragen jetzt eine vollständige
   formale Hülle.
2. **Fünf Gegenprobe-Mutationen liefen ins Leere**, weil `fall11` in der
   Gegenprobe nicht in der Liste der ausgeführten Prüfungen stand. Derselbe
   Fehlertyp wie `R-16c` in V2: eine Prüfung, die nichts prüft.

## Zu eurer Anmerkung zum Einheitsschema

Verstanden und umgesetzt: Es ist eine **Definitionsbibliothek**. Ein
Standardvalidator muss den konkreten `$defs`-Einstiegspunkt validieren —
`umschlag`, `schnappschuss`, `archivmanifest`, `befehl`, `resume_antwort`,
`betrieb`, `arbeitsereignis`, `kostenfeld`. Die Wurzel allein prüft keine
Nutzdaten. Mein Prüfer wählt den Einstiegspunkt je Fall ausdrücklich; die
Zeile dafür steht in `formfehler()`.

## Nicht ausgeführt, unverändert

| | |
|---|---|
| Standard-JSON-Schema-Validator | **NOT_RUN** — nicht installiert, kein Nachladen |
| SSE / Browser-Reconnect | **NOT_TESTED** |
| Serverseitige Rechtedurchsetzung | **NOT_TESTED** |
| Nebenwirkungsfreiheit der Wiedergabe | **NOT_TESTED**, behauptete Nullwerte als solche gekennzeichnet |
| Verbraucherkompatibilität Agentarium/Partitur | **NOT_TESTED** |
| Reale vollständige Kostenerfassung | **UNBESTÄTIGT** |

Keine Infrastruktur, keine produktive Implementierung, keine
kostenpflichtigen Läufe, kein Merge, kein Release, kein Deployment.

## Blob-Hashes

| Pfad | Blob |
|---|---|
| `specifications/AG-VISUAL-005-schemas-v2/vertrag-v2-1.schema.json` | `8486c0120942c5fe9f30153f66c6e4177dfcc016` |
| `tests/AG-VISUAL-005-referenz-reducer.py` | `7a94f89414fd5485c390764f130357958785e609` |
| `tests/AG-VISUAL-005-vertrag-v2-1-pruefen.py` | `7ad58a4b7fe25e5d7354fd9cf6bd3268368c7f7f` |
| `tests/AG-VISUAL-005-vertrag-v2-1-gegenprobe.py` | `ab428ff46f39fa775e7934d766965061c36c01f0` |
| `fixtures/…/01-einstieg-snapshot-live.json` | `30f050123b269c04d4a24bf2c24db83b928266ff` |
| `fixtures/…/03-resume-grenzfaelle.json` | `868d281f33be488aa77799a1daf4183dd57afd6f` |
| `fixtures/…/05-parallel-artefakte-review.json` | `9c85b8c478fbf3d4f55f3797cb363ddc00cfcd52` |
| `fixtures/…/08-nurlesen-befehle.json` | `981d922eba7eb27f43407eb5d4b97476436b669f` |
| `fixtures/…/09-archiv-zeitsprung.json` | `c32d7b2564ff0d2b8d84debb0fc0be1ca7b9fe4a` |
| `fixtures/…/10-negativproben.json` | `cbb6a5d41e9de5138eaca4f9999306348ed9124b` |
| `fixtures/…/11-snapshot-plus-tail.json` **neu** | `0f51ac128ea3920de7cf628830cef137f9661490` |

Unverändert: `02` `26e2a380…`, `04` `d4f6f553…`, `06` `adcfacdf…`,
`07` `5017c872…` — R1–R5 berührten sie nicht.

**Nebenbefund, mit korrigiert:** `tests/__pycache__/` lag versioniert im
Repository, von mir mit `git add -A` mitgenommen. Entfernt, `.gitignore`
ergänzt.

Bereit für Argus-Delta-Review und Sentinel-Testbarkeitsprüfung gegen genau
diese Blobs.
