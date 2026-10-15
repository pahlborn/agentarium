# AGENTARIUM – Schnittstellenvertrag V2.1, gezielte Korrektur

AG-VISUAL-005, Korrekturfassung 2.1 · 2026-10-15T20:05:00Z
Projekt: pahlborn/agentarium · Branch: claude/agentarium-visualisierung
Status: gezielte Korrektur der fünf Defektgruppen **B1–B5**. Keine neue
Vollspezifikation, keine Infrastruktur, keine produktive Implementierung,
keine kostenpflichtigen Läufe, kein Merge, kein Release, keine
Veröffentlichung.
Auftrag: `handoffs/AG-VISUAL-005-INTERFACE-v2-team-review-v1.json`
(`AG-VISUAL-005-INTERFACE-V2-REVIEW`, Atlas, `REVISION_REQUIRED`)
Basis: `governance/AG-VISUAL-005-INTERFACE-v2-team-review-v1.md`
Geprüfte Fassung: Vertrag V2, Blob `8c86e3c6207030adcf0f1a2bb21194e3c3820f8b`,
Commit `b0a08c1cd54b21424837cf51dc6d8dda083699cb` — **bleibt unverändert
liegen** als Nachweis, auf den Argus und Sentinel zeigen.

**Dieses Papier ersetzt V2 nicht.** Es korrigiert fünf benannte Stellen und
sagt für jede, was vorher falsch war. V2 gilt im Übrigen weiter.

Argus: `FAIL`. Sentinel: `FAIL`. Beide zu Recht.

---

## Der schwerste Einzelfehler, zuerst

`replay_grenze` ist die **niedrigste lieferbare** Sequenz, und fortgesetzt
wird bei `cursor + 1`. V2 prüfte:

```
cursor >= replay_grenze          # falsch
cursor + 1 >= replay_grenze      # richtig
```

Bei Grenze 120 und Cursor 119 heißt die falsche Form: ablehnen, neuen
Schnappschuss holen — obwohl 120 lieferbar ist. Ein Off-by-one, der jeden
Wiedereinstieg am Rand des Puffers unnötig verwirft. Er steht jetzt als
Negativprobe `resume_grenze_off_by_one` im Prüfbestand.

---

## B1 – Wiederaufnahme

### Grenzsemantik

| Lage | Antwort |
|---|---|
| `cursor > hoechste_sequenz` | `cursor_zu_hoch`, nicht fortsetzbar |
| `cursor + 1 >= replay_grenze` | **fortsetzbar**, erstes Ereignis `cursor + 1` |
| sonst | `replay_grenze_unterschritten`, neuer Schnappschuss |
| `Last-Event-ID` nicht als Zahl lesbar | `cursor_unbekannt`, neuer Schnappschuss |

Der Schnappschuss trägt jetzt zusätzlich `hoechste_sequenz`; ohne sie ist
ein zu hoher Cursor nicht erkennbar.

### Auswertbarer Pfad für natives EventSource

Natives `EventSource` gibt dem Anwendungscode **keinen auslesbaren
Nicht-200-Körper**: Ein anderer Status lässt die Verbindung scheitern
(HTML-Standard, Server-sent events §9.2.2/§9.2.3). Ein `409` mit JSON ist
auf diesem Pfad also unauswertbar — V2 hat genau das vorgesehen.

Korrektur, zwei Wege, beide im Vertrag:

| Pfad | Mechanik |
|---|---|
| **vorgelagerte Prüfung** | `GET /agentarium/resume?stream=…&cursor=N` als gewöhnliche JSON-Antwort, **vor** dem Öffnen des Stroms (`$defs.resume_antwort`) |
| **im Strom** | Der Server antwortet mit **200** und sendet `kind: "strom.hinweis"` mit `grund`, `replay_grenze`, `hoechste_sequenz`, `neuer_schnappschuss`; danach schließt er (`$defs.umschlag_hinweis`) |
| **fetch-Pfad** | zusätzlich `409` mit JSON zulässig, weil der Körper dort lesbar ist |

### Betriebsrahmen vor dem Verbindungsaufbau

`GET /agentarium/betrieb` (`$defs.betrieb`) nennt `rahmen` ∈
`cookie_gleicher_ursprung` | `header_fetch_streaming`, dazu
`katalogstrom`, `resume_pruefung`, `heartbeat_takt_s`, `veraltet_nach_s`.
**Er steht fest, bevor ein Strom geöffnet wird** — nicht erst in dessen
Antwort.

### Lebenszeichen: exakter Rand und tatsächlicher Takt

Veraltet gilt **nach** 20 s, also `abstand > 20`, nicht `>= 20`. Bei genau
20,000 s ist die Ansicht **frisch**, bei 20,001 s veraltet. Der Takt wird
aus den Abständen der Lebenszeichen **nachgerechnet** und muss 5 s
betragen; vorher war beides nur behauptet.

---

## B2 – Done und genaue Prüfnachweise

V2 forderte nur das **Vorhandensein** der Status- und Prüffelder und erlaubte
in der Basis `null`. Deshalb gingen Sentinels Proben `hollow_done` und
`hollow_review` durch.

### Nichtleere, ereignisabhängige Varianten

| `kind` | verlangt, nichtleer |
|---|---|
| `status_change` | `task_id`, `from`, `to`, `item_revision` ≥ 1, `previous_transition_id` vorhanden (Wert darf `null` sein) |
| `review_result` · `test_result` | `task_id`, `artifact_id`, `version`, `criteria_ref`, `outcome` ohne `null` |
| `artifact` | `artifact_id`, `version` |
| Kommunikationsarten | `recipient` — eine Nachricht ohne Empfänger ist keine Nachricht (Probe `minimal_work_event`) |
| `block` / `unblock` | `block_id`, `task_id` bzw. `resolving_event_id` |

### Revisionskette, berechnet

Je Aufgabe muss `item_revision` **streng steigen**, und
`previous_transition_id` muss auf die vorige schreibende Transition
derselben Aufgabe zeigen; beim ersten Mal `null`. Das rechnet der
Referenz-Reducer über die Ereignisfolge nach — V2 rechnete es nicht.

### Versionsgebundener Erfüllungsnachweis

Ein Statuswechsel auf Done ist nur zulässig, wenn

**(a)** er `artifact_id` **und** `version` nennt, auf genau dieses Paar ein
**früheres** `review_result`/`test_result` mit `outcome: "pass"` vorliegt,
und davor kein späteres nicht-`pass` auf dasselbe Paar steht, **oder**

**(b)** `abweichung_autorisiert_durch` und `abweichung_grund` gesetzt sind.

**Fixture 05 war selbst der Befund:** W7 meldete `fail` auf ART-11 v2, W8
setzte danach Done. Das Fixture trägt jetzt W7b — eine bestandene Prüfung
derselben Version vor dem Wechsel — und der ursprüngliche Zustand steht als
Negativprobe `done_ohne_pass` im Prüfbestand. Ein Pass auf `v1` erreicht
`v2` nie.

---

## B3 – Typisierter Zustand und Grenzen des Selbsttests

### Zustand am Cursor

Statt Zähler und untypisierter Arrays: `zustand_am_cursor` mit
`aufgaben` (task_id, Typ, Status, `item_revision`, `letzte_transition_id`,
owner), `artefakte` (artifact_id, version, supersedes, `pruefungen` je
genauer Version), `blockaden` (block_id, task_id, Grund, seit,
`resolving_event_id`) und `abdeckung`. Alles typisiert,
`additionalProperties: false`.

**Archivereignisse verwenden dasselbe kanonische Ereignisschema.** In V2
waren sie beliebige Objekte, sodass `[{}]` akzeptiert wurde.

### Der Referenz-Reducer

`tests/AG-VISUAL-005-referenz-reducer.py` rechnet den Zustand **aus den
Ereignissen**. Damit ist `R-16b` kein Vergleich zweier vorgeschriebener
Zustände mehr, die beide identisch falsch sein könnten. Er ist
**Prüfmittel, keine Produktimplementierung**: rein, ohne Netz, ohne Ein- und
Ausgabe, in `tests/`.

Die acht Reduktionsregeln R1–R8 stehen vollständig im Kopf der Datei. Kurz:
Ordnung ist die belegte Ereignisfolge; Aufgaben entstehen **nur** über ein
Ereignis mit `item_revision` und `to`, nie implizit aus einem Empfänger;
Prüfungen hängen an genau `(artifact_id, version)`; Verantwortung folgt
**nur** aus `ownership_change`.

### Zwei ehrliche Abstufungen

- **`R-16c` ist eingeschränkt.** Es prüft die **Konsistenz der behaupteten**
  Nullwerte, nicht die Nebenwirkungsfreiheit. Das Fixture sagt das selbst:
  `nebenwirkungen_nachweis: "NOT_TESTED"`. Ein echter Nachweis braucht eine
  Laufzeitumgebung.
- **`R-21` ist umbenannt und prüft jetzt wirklich.** Es sucht Aufgaben mit
  sich **schneidenden Zeitfenstern belegter Ereignisse** — nicht „Parallelität"
  und erst recht nicht aktive Arbeitszeit. V2 zählte nur zwei `task_id` mit
  Zeitpunkten und nannte das Parallelität.

---

## B4 – Altlog-Adapter und Zielvokabular

### Quellenerhaltend

Die flachen Felder des echten `observed-worklog.v1` — `agent_id`,
`platform`, `actual_model`, `actual_reasoning`, `input_tokens`,
`output_tokens`, `thinking_tokens` — sind **am Ereignis zulässig und bleiben
dort**. V2 hat sie teils abgelehnt, teils nach `verbrauch` verlagert.

| Ablageebene | Inhalt |
|---|---|
| **Ereignis, flach** | Quellform, wie im Altlog. Unverändert. |
| **`verbrauch`, gebündelt** | abgeleitet, mit `belegt` |

**Der Adapter ergänzt, er verlagert nicht.** Fehlt ein Wert, bleibt er
`null` und wird nicht 0. Beide Ebenen sind dokumentiert; das Fixture 07
führt sie und prüft `verlustfrei`.

`ownership_change` behält `task_id`, `scope` und `basis`. Verantwortung wird
nie aus Empfänger oder Parent allein abgeleitet.

### Zielvokabular richtiggestellt

`project_id` und `run_id` waren in V2 als **ausschließlich neu** ausgewiesen.
Falsch: AG-REPORT-001 schlägt sie bereits additiv als **Batchkontext** vor.
Richtig ist:

| Feld | AG-REPORT-001 | V2.1 |
|---|---|---|
| `project_id`, `run_id` | additiv, als **Batchkontext** | verbindlich **je Ereignis** |

### `catalog.changed` entfernt

Es war ein Platzhalter ohne Nutzdatendefinition. Nach O6 ist es **entfernt**,
nicht halb definiert. Eine Regel prüft, dass es nicht wiederkehrt.

---

## B5 – Kostenregel gilt auch im Archiv

V2 hatte die Kostendefinition **zweimal**: im Schnappschuss streng, im Archiv
als beliebiges Objekt. Deshalb ging `archive_incomplete_cost_with_total`
durch.

**Korrektur: ein Schema, eine Datei, eine Definition.**
`specifications/AG-VISUAL-005-schemas-v2/vertrag-v2-1.schema.json` enthält
`$defs.kostenfeld` genau einmal; Schnappschuss **und** Archivmanifest
verweisen darauf. Zwei Definitionen können so nicht mehr auseinanderlaufen.

**Peters Entscheidung vom 15.10.2026, 21:01:52 Europe/Berlin, unverändert:**

- Das Kostenfeld **bleibt sichtbar** (`sichtbar: true`, fest).
- Bei unvollständiger Gesamterfassung erscheint **ausschließlich**
  **„Kosten nicht vollständig ermittelbar."** — wörtlich festgeschrieben.
- **Keine** Beträge, Teilsummen, Gesamtsummen, 0-Ersatzwerte. Das Schema
  verbietet `gesamt` in diesem Zustand.
- `ohne_angabe` ist eine **Anzahl** von Ereignissen, kein Betrag.
- Erst bei vollständiger, belegter Gesamterfassung Kosten — und dann nur mit
  `abdeckung_beleg`, mindestens einer Kostenquelle und `ohne_angabe: 0`.

### Synthetische Daten gekennzeichnet

Jedes Kostenfeld nennt `daten` ∈ `real` | `synthetisch`. **Alle Beispiele
hier sind `synthetisch`** und dürfen keine real belegte Gesamterfassung
suggerieren. Produktiv ist eine vollständige Gesamterfassung
**unbestätigt**; das vollständige Beispiel zeigt die Schemaform, nicht einen
erreichten Zustand.

---

## Prüfergebnisse

```
python3 tests/AG-VISUAL-005-vertrag-v2-1-pruefen.py
  41 Formprüfungen · 66 Regelprüfungen · 13 Negativproben
  Alle Fälle 01–10 bestanden, alle Negativproben abgewiesen.

python3 tests/AG-VISUAL-005-vertrag-v2-1-gegenprobe.py
  27 von 27 Verletzungen erkannt, jede über ihre benannte Regel.
```

### Sentinels Proben, übernommen als Pflichtfälle

| Probe | V2 | V2.1 |
|---|---|---|
| `minimal_work_event` | ACCEPTED | **abgelehnt** |
| `hollow_done` | ACCEPTED | **abgelehnt** |
| `hollow_review` | ACCEPTED | **abgelehnt** |
| `empty_archive_event` | ACCEPTED | **abgelehnt** |
| `archive_incomplete_cost_with_total` | ACCEPTED | **abgelehnt** |
| `R21_nonoverlap_detected` | False | **erkannt** |
| `R16b_wrong_claimed_state_detected` | False | **erkannt** |

Dazu sechs eigene: `done_ohne_pass`, `revisionskette_gebrochen`,
`resume_grenze_off_by_one`, `heartbeat_mit_sequenz`,
`kosten_ohne_datenherkunft`, `vollstaendig_ohne_abdeckungsbeleg`.

### Was dieser Lauf nicht ist

- **Kein Standardvalidator.** `jsonschema` liegt nicht im Container, und die
  Projektregel verbietet das Nachladen zur Laufzeit. Der eingebaute Prüfer
  deckt nur die verwendeten Schlüsselwörter ab. Die Schemas sind nach JSON
  Schema 2020-12 für einen Standardprüfer geschrieben — **bitte einmal
  damit gegenlesen.**
- **Kein Laufzeitnachweis.** Kein Server, kein SSE, kein Browser.
- **Nicht unabhängig.** Derselbe Verfasser wie V1 und V2.

---

## Status je Befund

| Befund | Korrektur | Status |
|---|---|---|
| **B1** Grenzsemantik `cursor+1 >= grenze` | §B1 | **getestet (Daten)** |
| **B1** `strom.hinweis` bei 200, vorgelagerte Resume-Prüfung | §B1 | **spezifiziert**, Daten getestet · SSE-Verhalten NOT_TESTED |
| **B1** Betriebsrahmen vor Verbindung | §B1 | **spezifiziert**, Daten getestet |
| **B1** 20-s-Rand und 5-s-Takt | §B1 | **getestet (Daten)** |
| **B2** nichtleere Varianten | §B2 | **getestet (Daten)** |
| **B2** Revisionskette berechnet | §B2 | **getestet (Daten)** |
| **B2** versionsgebundener Done-Nachweis | §B2 | **getestet (Daten)** |
| **B3** typisierter Zustand, kanonische Archivereignisse | §B3 | **getestet (Daten)** |
| **B3** Referenz-Reducer statt Fixture-Vergleich | §B3 | **getestet (Daten)** |
| **B3** `R-16c` als Fixture-Konsistenz gekennzeichnet | §B3 | **NOT_TESTED**, ausdrücklich |
| **B3** `R-21` echte Intervallschnitte | §B3 | **getestet (Daten)** |
| **B4** quellenerhaltender Adapter | §B4 | **spezifiziert**, Daten getestet |
| **B4** Ist-/Zielfelder richtiggestellt | §B4 | **getestet (Daten)** |
| **B4** `catalog.changed` entfernt | §B4 | **getestet (Daten)** |
| **B5** eine Kostendefinition für beide | §B5 | **getestet (Daten)** |
| **B5** synthetische Daten gekennzeichnet | §B5 | **getestet (Daten)** |
| **O1** leere `supported_actions` → `nicht_unterstuetzt` | §B2-Tabelle | **getestet (Daten)** |

**Implementiert: nichts.** **Getestet am Laufzeitsystem: nichts.**
„getestet (Daten)" heißt: Der Prüflauf rechnet die Regel an den
Beispieldaten nach, und die Gegenprobe zeigt, dass sie fehlschlagen kann.

### Ausdrücklich nicht ausgeführt

| | |
|---|---|
| Standard-JSON-Schema-Validator | **NOT_RUN** — `jsonschema` nicht vorhanden, kein Nachladen |
| SSE-Verhalten im Browser | **NOT_TESTED** |
| Serverseitige Rechtedurchsetzung | **NOT_TESTED** |
| Nebenwirkungsfreiheit der Wiedergabe | **NOT_TESTED** (Nullwerte sind behauptet) |
| Verbraucherkompatibilität Agentarium/Partitur | **NOT_TESTED** (O7) |
| Reale vollständige Kostenerfassung | **UNBESTÄTIGT** (O4) |
| Tatsächliche Replaykapazität | **offen** (O3), nur die Randsemantik ist festgelegt |

---

## Pfade und Blob-Hashes

| Pfad | Blob |
|---|---|
| `specifications/AG-VISUAL-005-schemas-v2/vertrag-v2-1.schema.json` | `26ace42824abd989ad318081efd326299ec6853a` |
| `fixtures/AG-VISUAL-005-beispiele-v2-1/01-einstieg-snapshot-live.json` | `10e2ee8ce7df98e8af625d01264fd898e5c604e4` |
| `fixtures/AG-VISUAL-005-beispiele-v2-1/02-heartbeat-veraltet.json` | `26e2a38035912c6466c1ce3fbde6614baf1fb983` |
| `fixtures/AG-VISUAL-005-beispiele-v2-1/03-resume-grenzfaelle.json` | `f06f0129ff2b96eb982bfc38ebdc2cf33bf18761` |
| `fixtures/AG-VISUAL-005-beispiele-v2-1/04-zwei-projekte-laeufe.json` | `d4f6f5532990b310e70887ef11d19e78792312b2` |
| `fixtures/AG-VISUAL-005-beispiele-v2-1/05-parallel-artefakte-review.json` | `3884029faac7917ad4a4199dd6aada663aa4be1e` |
| `fixtures/AG-VISUAL-005-beispiele-v2-1/06-kosten-sichtbar-ohne-betrag.json` | `adcfacdf263219092bb62faad2a07216e28a7de7` |
| `fixtures/AG-VISUAL-005-beispiele-v2-1/07-altlog-ohne-zeitpunkte.json` | `5017c87233766c95a9b01f2a24cae048a6ee251d` |
| `fixtures/AG-VISUAL-005-beispiele-v2-1/08-nurlesen-befehle.json` | `b6b6d8eedcf5a5ec59e39eee13f88d1139573aa8` |
| `fixtures/AG-VISUAL-005-beispiele-v2-1/09-archiv-zeitsprung.json` | `1c17e08f193d379cffaac429f14c21c2e4cea59c` |
| `fixtures/AG-VISUAL-005-beispiele-v2-1/10-negativproben.json` | `481f60f353d3a62c9ebb47cbc61f7bae17df8426` |
| `tests/AG-VISUAL-005-referenz-reducer.py` | `03028c4882c77b30abdd164abef5490838a41f08` |
| `tests/AG-VISUAL-005-vertrag-v2-1-pruefen.py` | `90ae4595d28f4f33174d26053791764fbad6d1be` |
| `tests/AG-VISUAL-005-vertrag-v2-1-gegenprobe.py` | `d5f75b11530fd37f3279846938c11c80f19ba69b` |

V2 bleibt vollständig erhalten: Vertrag, vier Schemas, neun Fixtures und
zwei Prüfer unter ihren Blobs aus Commit `b0a08c1`.

---

## Offen

| | offen | bei wem |
|---|---|---|
| **O3** | Tatsächliche Replaykapazität je Strom. Die Randsemantik ist jetzt festgelegt; die Zahl bleibt betrieblich. | Team / Betrieb |
| **O2** | Welcher Betriebsrahmen gilt. Das Schema verlangt eine Antwort vor dem Verbindungsaufbau, nennt sie aber nicht. | Team / Betrieb |
| **O6** | Falls `catalog.changed` doch gebraucht wird: vollständige Nutzdaten. Bis dahin entfernt. | Team |
| **O7** | Verwendet Partitur denselben Vertrag? Verbraucherkompatibilität NOT_TESTED. | Atlas |
| neu | Ein Standard-JSON-Schema-Validator sollte die Schemas einmal gegenlesen. In diesem Container nicht möglich. | Team |
| neu | Ist meine Lesart von `minimal_work_event` die gemeinte? Ich habe sie als „Kommunikationsart ohne Empfänger" verstanden und entsprechend verboten. Falls anders gemeint, bitte sagen. | Sentinel |
