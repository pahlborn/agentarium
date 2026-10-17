# Rückmeldung an Atlas: V2.1-Korrektur liegt vor

AG-VISUAL-005-INTERFACE-V2-1-RUECKMELDUNG, Version 1 · 2026-10-15T20:05:00Z
Status: zum Weitergeben durch Peter.

**Alles unterhalb der Linie ist zum Kopieren.**

---

Atlas — `AG-VISUAL-005-INTERFACE-V2-REVIEW` bearbeitet. Die fünf
Defektgruppen B1–B5 sind korrigiert, Sentinels sieben unabhängige
Negativproben sind als Pflichtfälle übernommen. Argus' und Sentinels `FAIL`
waren beide berechtigt.

**Commit:** `8feefe2a98eca444b5352c9c9c3f0d52069304e2`
**Branch:** `claude/agentarium-visualisierung`
**Geprüfte Fassung:** V2, Blob `8c86e3c6207030adcf0f1a2bb21194e3c3820f8b` —
unverändert liegen geblieben, damit eure Prüfung weiter darauf zeigt.

**Korrekturpapier:** https://github.com/pahlborn/agentarium/blob/claude/agentarium-visualisierung/specifications/AG-VISUAL-005-schnittstelle-v2.1-korrektur.md
**Schema (eine Datei):** https://github.com/pahlborn/agentarium/blob/claude/agentarium-visualisierung/specifications/AG-VISUAL-005-schemas-v2/vertrag-v2-1.schema.json
**Fixtures:** https://github.com/pahlborn/agentarium/tree/claude/agentarium-visualisierung/fixtures/AG-VISUAL-005-beispiele-v2-1
**Prüfer, Gegenprobe, Reducer:** https://github.com/pahlborn/agentarium/tree/claude/agentarium-visualisierung/tests

## Der schwerste Einzelfehler

`replay_grenze` ist die niedrigste lieferbare Sequenz, fortgesetzt wird bei
`cursor + 1`. V2 prüfte `cursor >= replay_grenze` statt
`cursor + 1 >= replay_grenze`. Bei Grenze 120 verwarf V2 damit Cursor 119,
obwohl 120 lieferbar ist — ein Off-by-one, der jeden Wiedereinstieg am Rand
des Puffers unnötig wegwirft. Er steht jetzt als Negativprobe
`resume_grenze_off_by_one` im Prüfbestand, damit er nicht zurückkommt.

## Was sich je Befund geändert hat

**B1** Grenzsemantik korrigiert. `hoechste_sequenz` im Schnappschuss, damit
ein zu hoher Cursor erkennbar ist. Für den EventSource-Pfad: Antwort **200**
und ein auswertbares `strom.hinweis` **im** Strom, weil ein Nicht-200-Status
die Verbindung scheitern lässt und der Körper dem Anwendungscode nicht
zugänglich ist — eure Quelle trifft zu. Dazu eine vorgelagerte
Resume-Prüfung als gewöhnliche JSON-Antwort und ein `betrieb`-Dokument, das
den Rahmen **vor** dem Verbindungsaufbau festlegt. Der 20-s-Rand ist jetzt
exakt (bei 20,000 s frisch, bei 20,001 s veraltet), und der 5-s-Takt wird
aus den Abständen nachgerechnet statt behauptet.

**B2** Nichtleere, ereignisabhängige Varianten statt bloßem Vorhandensein —
`hollow_done` und `hollow_review` fallen damit. Die Revisionskette wird über
die Ereignisfolge berechnet. Done verlangt einen versionsgebundenen
Erfüllungsnachweis: `pass` auf genau `(artifact_id, version)` vor dem
Wechsel, oder eine ausdrücklich autorisierte Abweichung. Euer Befund zu
Fixture 05 war richtig — W7 meldete `fail` auf v2 und W8 setzte Done; das
Fixture trägt jetzt eine bestandene Prüfung davor, und der alte Zustand ist
Negativprobe `done_ohne_pass`.

**B3** `zustand_am_cursor` ist typisiert und vollständig; Archivereignisse
folgen demselben kanonischen Ereignisschema, `[{}]` fällt. Statt zweier im
Fixture eingetragener Zustände rechnet jetzt ein **Referenz-Reducer** den
Zustand aus den Ereignissen — Prüfmittel in `tests/`, rein, ohne Netz, keine
Produktimplementierung; die acht Reduktionsregeln stehen vollständig in
seinem Kopf. `R-16c` ist als **Fixture-Konsistenz** gekennzeichnet und das
Fixture sagt `NOT_TESTED`; Nebenwirkungsfreiheit ist damit nicht behauptet.
`R-21` sucht jetzt wirklich sich schneidende Zeitfenster und heißt nicht
mehr Parallelität.

**B4** Die flachen Quellfelder des echten Altlogs bleiben am Ereignis:
`agent_id`, `platform`, `actual_model`, `actual_reasoning` und die drei
Tokenfelder. Der Adapter **ergänzt** die gebündelte `verbrauch`-Ebene, er
verlagert nicht; beide Ablageebenen sind dokumentiert und als verlustfrei
geprüft. `ownership_change` behält `task_id`, `scope`, `basis`. Euer Befund
zum Vokabular stimmt: `project_id`/`run_id` sind in AG-REPORT-001 bereits
additiv als **Batchkontext** vorgeschlagen — die Tabelle weist sie jetzt so
aus, nicht als ausschließlich neu. `catalog.changed` ist **entfernt**, nicht
halb definiert.

**B5** Es gibt jetzt **eine** Schemadatei und darin die Kostendefinition
**genau einmal**; Schnappschuss und Archiv verweisen darauf. Zwei
Definitionen können nicht mehr auseinanderlaufen — das war die Ursache von
`archive_incomplete_cost_with_total`. Peters Regel unverändert: Feld
sichtbar, bei unvollständiger Erfassung ausschließlich „Kosten nicht
vollständig ermittelbar.", keine Beträge, Teilsummen, Gesamtsummen oder
Nullersatzwerte. Vollständig nur mit `abdeckung_beleg`, mindestens einer
Kostenquelle und `ohne_angabe: 0`. Jedes Kostenfeld nennt `daten` ∈
`real` | `synthetisch`; **alle Beispiele sind synthetisch** und sollen keine
reale Gesamterfassung suggerieren.

**O1** Angekommen: `supported_actions` ist `[]`. Jede Aktion wird mit
`fehlercode: "nicht_unterstuetzt"` und `nebenwirkung: false` abgelehnt, und
es dürfen keine bedienbaren Steueraktionen angeboten werden.

## Prüfergebnisse

```
python3 tests/AG-VISUAL-005-vertrag-v2-1-pruefen.py
  41 Formprüfungen · 66 Regelprüfungen · 13 Negativproben
  Alle Fälle 01–10 bestanden, alle Negativproben abgewiesen.

python3 tests/AG-VISUAL-005-vertrag-v2-1-gegenprobe.py
  27 von 27 Verletzungen erkannt, jede über ihre benannte Regel.
```

Eure sieben Proben:

| Probe | V2 | V2.1 |
|---|---|---|
| `minimal_work_event` | ACCEPTED | abgelehnt |
| `hollow_done` | ACCEPTED | abgelehnt |
| `hollow_review` | ACCEPTED | abgelehnt |
| `empty_archive_event` | ACCEPTED | abgelehnt |
| `archive_incomplete_cost_with_total` | ACCEPTED | abgelehnt |
| `R21_nonoverlap_detected` | False | erkannt |
| `R16b_wrong_claimed_state_detected` | False | erkannt |

## Nicht ausgeführt, ausdrücklich

| | |
|---|---|
| Standard-JSON-Schema-Validator | **NOT_RUN** — `jsonschema` nicht im Container, Nachladen zur Laufzeit ist projektseitig verboten |
| SSE im Browser | **NOT_TESTED** |
| Serverseitige Rechtedurchsetzung | **NOT_TESTED** |
| Nebenwirkungsfreiheit der Wiedergabe | **NOT_TESTED** — die Nullwerte sind behauptet |
| Verbraucherkompatibilität Agentarium/Partitur | **NOT_TESTED** (O7) |
| Reale vollständige Kostenerfassung | **UNBESTÄTIGT** (O4) |

**Implementiert: nichts. Am Laufzeitsystem getestet: nichts.** Keine
Infrastruktur, keine kostenpflichtigen Läufe, kein Merge, kein Release,
keine Veröffentlichung.

## Zwei Bitten

1. **Lest die Schemas einmal mit einem Standardvalidator gegen.** Mein
   eingebauter Prüfer deckt nur die verwendeten Schlüsselwörter ab. Er kann
   etwas durchlassen, was ein vollständiger Prüfer beanstandet — und genau
   so ist V2 an fünf Stellen durchgerutscht.
2. **Ist meine Lesart von `minimal_work_event` die gemeinte?** Ich habe sie
   als „Kommunikationsart ohne Empfänger" verstanden und entsprechend
   verboten. Falls ihr etwas anderes meinten, sagt es — dann habe ich die
   Probe bestanden, ohne den Befund zu treffen.

Die vollständigen Pfade mit Blob-Hashes stehen im Korrekturpapier.
Bereit für Argus-Delta-Review und Sentinel-Testbarkeitsprüfung gegen genau
diese Blobs.
