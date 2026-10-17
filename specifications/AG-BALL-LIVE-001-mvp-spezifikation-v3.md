# SA_READY: AG-BALL-LIVE-001-ARCHIBALD-SPEC-V3-RECOVERY-V1

**Rolle:** Archibald / spec-agent. Ich habe nur gelesen, keine Datei geändert, nichts veröffentlicht und nichts ausgeführt.
**Modell:** angefordert opus/high. Welches Modell tatsächlich lief, ist nicht bestätigt.
**Ergebnis:** Die Spezifikation **V3.0** steht unten. Sie ersetzt V2 vollständig. Gültige Entscheidungen aus V2 sind darin wiederholt, Forge braucht V2 also nicht mehr.
**Was SA_READY bedeutet:** Das Dokument ist fertig. Es ist keine Abnahme durch Peter, keine Bauerlaubnis, kein bestandener QA-Test und kein Release.
**Tests:** NOT_RUN. **Implementiert:** nichts.

---

## 0. Grundlage und Lücken

| Baseline | Commit | Zweck |
|---|---|---|
| Produkt Original, Fassung 47 | `d111b062770e32dbef0f9bb618a4923d88ff20be` | Einzige Basis für `feld/index.html` und `feld/sw.js` |
| Vertrag V2.1.2 und Reducer | `da860fd19f38e9938ed201546f2a6e5b4cc765f8` | Nur Referenz, wird nicht geändert |
| Adaptermuster | `800874ee1c6fd2ed3a806ba7774a19c2e11f3878` | Nur Muster aus `activity-input.js` |
| Geprüfter Spezifikationsstand | `06751872460d8bb27fb8308c9b76a879f44bfc33` | V2, Argus V1, Sentinel V2 |

**Gelesen:**
- AGENTS.md, Rulebook 1.2, Prozess 1.2, Produktpraxis v1
- Charter, Machbarkeitsstudie, Forge-Handback, Spezifikation V2 (vollständig), Argus-Review V1, Sentinel-Prüfung V2, Fehlerbericht zu V3
- `vertrag-v2-1.schema.json` und `activity-input.js` vollständig
- `sw.js` (d111) vollständig
- `feld/index.html` (d111) in Ausschnitten: Z. 2195–2294, 2940–3059, 4355–4930, 4930–5199 und 5680–5930

**Lücken:**
- `.claude/agent-protocol/spec-agent-output.md` fehlt am Arbeitsort. Die Gliederung unten ist deshalb meine eigene.
- In `index.html` habe ich `tunZeigen`, `bereitschaft`, `motorenZeigen`, `stoppZeigen`, `wirf` und `arbeitAn` **nicht** gelesen. Was davon abhängt, steht unten als Prüfpflicht für Forge (Inventare I-1 und I-2) und nicht als Tatsache.
- Den Reducer habe ich in diesem Lauf nicht gelesen.

**Neu im Code geprüft (d111):**
- **B8:** `modusSetzen`, `FASSUNG` und `STUECK` liegen in der IIFE, die bei Z. 5919 endet. Der `?mvp=1`-Block (Z. 5703–5756) liegt **innerhalb** dieser Closure. Ein externes `live.js` kommt also nicht an sie heran. Das bestätigt Argus ARG-BL-05.
- **B9:** `kopfSetzen` schreibt `STUECK.titel`, `STUECK.beschreibung` und die Stücknamen per `innerHTML` (Z. 4567–4575). Damit ist auch `__agLauf` ein XSS-Pfad.
- **B10:** `__agEreignis` setzt bei jedem angenommenen Ereignis `letztesLZ = Date.now()` (Z. 5097). Fachereignisse wirken also auch als Lebenszeichen.
- **B11:** `sw.js` antwortet mit `ignoreSearch: true` und „stale-while-revalidate“. `index.html` und `live.js` können deshalb aus verschiedenen Ständen kommen. Ein Fassungsabgleich ist nötig.
- **B12:** `stop` setzt einen Stopper auf `E.an || E.von` (Z. 4394). `wurf`- und `sonne`-Arten rufen `auftragFertig(E.von, E.erledigt || E.aufgabe)` auf (Z. 4365).

---

## 1. Korrekturledger

| Befund | Korrektur in V3 | AC | TC |
|---|---|---|---|
| **ARG-BL-01** Run-Ende ohne Eigentümer | §3.1–3.3:<br>• Gesamtlauf und Producer-Ausführung sind getrennt.<br>• Nur Atlas eröffnet und schließt den Lauf, über einen Lifecycle-Checkpoint.<br>• Claude sendet nur `execution.state`, das allein ins Auditjournal geht.<br>• Jede Ingest-Nachricht hat eine `envelope_id`.<br>FR-1.6, FR-1.13, FR-2.2 | AC-1.5, AC-1.6 | TC-LC-01…04 |
| **ARG-BL-02** Journal ≠ Archiv | §4.6/4.7:<br>• Auditjournal mit `audit_seq` und Strom mit `stream_sequence` getrennt.<br>• Deterministische Projektion nur von `work.event`.<br>• Die Bilanzdatei führt Lifecycle, Ausführungen und Lücken.<br>• Archivlesepfad nach Ablauf der Aufbewahrung festgelegt.<br>FR-6.1–6.5 | AC-6.1–6.3 | TC-ARC-01…03 |
| **ARG-BL-03** Webhookausfall | §9: ein Abgleich (Reconciler) auf dem Server über die Issue-Comments-API, mit Cursor, Abdeckungszeitstempel, Signal `quellstatus` und Dedupe über `comment.id`. FR-3.6–3.9 | AC-3.3, AC-3.4 | TC-WH-01…04 |
| **ARG-BL-04** Privatsphäre | §10:<br>• Zwei durchgängige Varianten; bei (b) kein Export ins öffentliche Repo.<br>• Ablehnungsprotokoll ohne jeden Rohauszug.<br>FR-1.10, NFR-2 | AC-1.7, AC-6.4 | TC-LOG-01, TC-PRIV-01 |
| **ARG-BL-05** Init-Hook und Wahrheit aller Aussagen | §7: Hook `window.__agOriginal` in der Closure, Fassungsabgleich, Wahrheitsinventar I-2 für alle sichtbaren Aussagen, Auftragsring und Bereitschaftspuls im Live-Modus angepasst. FR-5.1, FR-5.6, FR-5.10, FR-5.11 | AC-5.7, AC-5.8 | TC-ACT-01, TC-TRU-01…03 |
| **ARG-BL-06** Provenienz und „noch laufend“ | §4.2:<br>• `agent_path` wird zu `agent_id`.<br>• §8.2: Claude-Beleg ist das vom Wrapper gemessene Prozessende; ein laufender Actions-Job genügt nicht mehr.<br>• Work-Beleg ist eine korrelierte Arbeitsaktion mit Serverzeit.<br>FR-3.1, FR-3.4 | AC-2.1, AC-3.1 | TC-E2E-01/02, TC-ID-03 |
| **ARG-BL-07** Transportgrenzen | §6:<br>• `katalogstrom`-Text, Snapshot- und Cursor-Tabelle.<br>• Kein Browser-Storage für Cursor.<br>• Lese-Auth und CORS je Variante.<br>• Markup wird beim Ingest abgelehnt, Escaping bleibt trotzdem Pflicht.<br>• Beispiele in §4.5. | AC-4.3, AC-4.4 | TC-WIRE-01, TC-CUR-01…03, TC-CORS-01 |
| **ARG-BL-08** Erlebnis nicht bewertet | §2.2: Funktionsnachweis und Erlebnishypothese H-E1 getrennt, mit Regel Weiter / Ändern / Stopp. Peter entscheidet (§16). | AC-E1 | TC-LAT-01, TC-EXP-01 |
| **F1** Wire und Identität | §4.1–4.5: vollständige Beispiele, ID- und Empfängerregeln | AC-1.2, AC-1.5 | TC-WIRE-01, TC-ID-01…03, TC-LC-01 |
| **F2** „Laufend“ bei M5 | §8.2 mit 5-s-Abstand; zeitlich nicht unterscheidbar ergibt INCONCLUSIVE, kein Bestehen | AC-2.1, AC-3.1 | TC-E2E-01/02 |
| **F3** M0–M5 und Pixel | §8.1: Uhr, Einheit, Messstelle und Unsicherheit; M5′ ist nur ein Proxy; Frame-Orakel | AC-5.1 | TC-PIX-01, TC-LAT-01 |
| **F4** Fixtures | §11: getrennte Fixture-Instanz; ORD-03 ab Cursor 103; ORD-01 lokal ohne GitHub | — | TC-ORD-01/03 |
| **F5** Freshness und Ende | §3.3 Agententabelle mit Zeitanker und Vorrang des Terminalzustands; Claude-Ende schließt den Lauf nicht | AC-5.3, AC-5.8 | TC-TRU-01/03, TC-LC-02 |
| **F6** Recovery | §6.4–6.7:<br>• Grenze für `alt` vereinheitlicht.<br>• Spool, positives Lebenszeichen, Cursorfälle, Generation, Storage.<br>• Hook-Ablehnung, Speicherfehler und verlorenes Ack getrennt.<br>• Grenze H0 und Drosselung passend gesetzt. | AC-1.4, AC-2.3, AC-4.2, AC-5.6 | TC-HB-01/02, TC-SPO-01, TC-STO-01/02, TC-GEN-01, TC-STOR-01, TC-REJ-01, TC-REC-01 |
| **F7** Auth, XSS, Datenschutz | Je Negativtest genau eine Verletzung; Canary-Werte; CORS und Token getrennt; Senkeninventar I-1 | AC-1.1, AC-1.2, AC-5.4 | TC-AUTH-01, TC-VAL-01, TC-XSS-01, TC-CORS-01 |
| **F8** Projektion und Replay | §4.7 und TC-ARC-02 mit konkreten IDs, Reihenfolge und Endzustand | AC-6.1/6.2 | TC-ARC-01/02 |
| **F9** Abdeckung und Stopp | §13 Matrix, §14 Stop-Regeln; Sentinel bekommt kein Rollback-Recht | — | alle |

---

## 2. Epic EP-BL1 und Erfolgsbegriffe

### 2.1 Funktionsnachweis (Abnahme des Epics)
**Ziel:** Peter öffnet vorab `https://pahlborn.github.io/agentarium/feld/?live=1&run=R`. Sichtbar ist „Fassung 48“. Er lädt die Seite danach nicht neu. Dann sieht er:
- je ein korreliertes, echtes `progress` eines **noch laufenden** Claude-Code-Prozesses und eines **noch laufenden** Work-Laufs von Atlas;
- jeweils mit Vertrauensart;
- über die Kette Ingest → Journal → Lesestrom → Adapter → Original.

Ein unterbrochener Viewer holt verpasste Ereignisse ohne Doppelwirkung nach. Der terminale Lauf lässt sich als gekennzeichnetes Archiv wiedergeben.

**Zählt nicht als Bestehen:**
- nur ein Abschlussereignis
- eine statische Datei, Fixture- oder Demo-Daten
- eine Ersatzseite oder manuelle Injektion
- Polling im Browser
- ein Reload während der Probe
- Schweigen, das als „bereit“ angezeigt wird

**Stories:**
- ST1: Ingest und Journal
- ST2: Claude-Quelle
- ST3: Work-Quelle mit Abgleich
- ST4: Lesestrom
- ST5: Original-Adapter und Wahrheitsanzeige
- ST6: Archiv

**Nicht im MVP:**
- Katalogstrom
- Befehle (`supported_actions: []`)
- Live-Garantie im Hintergrund
- Geldbeträge und Prozentfortschritt
- Mehrmandantenbetrieb
- Varianten B und C

### 2.2 Erlebnishypothese H-E1 (Pilot; Schwellen entscheidet Peter in D-P3)
Der Funktionsnachweis kann bestehen, während H-E1 verfehlt wird. Beides wird getrennt berichtet.

**Vorschlag des Teams:** Gemessen wird `L = M5_oben − M1` (§8.1). Im Vordergrund und im normalen WLAN gilt:
- **Claude:** Median ≤ 5 s, Maximum ≤ 15 s
- **Work (Webhook):** Median ≤ 10 s, Maximum ≤ 30 s
- **Stichprobe:** ≥ 10 sichtbare `progress` je Anbieter aus ≥ 2 Läufen. Davon sind ≥ 3 je Anbieter per Video gemessen, der Rest über M5′ mit einer kalibrierten Abweichung (TC-EXP-01).
- **Zusatzfrage an Peter nach der Probe:** „Wirkt die Anzeige wie live?“ (ja/nein, Freitext)

**Entscheidungsregel:**
- **Weiter:** Funktionsnachweis bestanden, H-E1 erfüllt und Peters Urteil „ja“.
- **Ändern:** Funktionsnachweis bestanden, aber H-E1 verfehlt. Dann wird der dominante Abschnitt aus der Segmenttabelle bestimmt (Webhook-Zustellung → R2 direkter Ingest; Relay → Hosting; Gerät → Adapter). Es folgt höchstens ein Korrekturzyklus.
- **Stopp:** Funktionsnachweis nach einer Korrektur weiter FAIL, oder ein Median > 60 s bei einem Anbieter. Dann Rückgabe an Atlas und Peter.

---

## 3. Lauf, Ausführung, Zustände

### 3.1 Begriffe
| Begriff | Bedeutung | Eigentümer |
|---|---|---|
| **Lauf R** (`run_id`) | Gesamter Projektlauf eines Auftrags, in einem Strom `agentarium/R` | Atlas, nur über einen Work-Lifecycle-Checkpoint |
| **Ausführung** (`execution_id = "gha:<github_run_id>.<attempt>"`) | Ein Claude-Prozess in Actions. Ein Lauf kann 0..n Ausführungen haben, nacheinander oder gleichzeitig. | Wrapper |
| **Work-Agent** (`agent_id = "work:<agent_path>"`) | Atlas oder ein Work-Kind, das Atlas übermittelt | Atlas |

### 3.2 Laufzustand: Relay-Übergänge (deterministisch)
| Vorher | Meldung | Ergebnis |
|---|---|---|
| keiner | `aktiv` | angenommen, `zustand_vorher: null` |
| keiner | terminal (`abgeschlossen`, `abgebrochen`, `fehlgeschlagen`) | angenommen. Ein reiner Work-Lauf darf ohne Eröffnung geschlossen werden. |
| `aktiv` | `aktiv` | 409 `uebergang_ungueltig` |
| `aktiv` | terminal | angenommen. Offene Ausführungen ohne `execution.state beendet` landen in der Bilanz unter `offene_ausfuehrungen` und in `abdeckung.luecken`. |
| terminal | beliebig | 409 `lauf_beendet` |
| terminal | `work.event` oder `execution.state` | 409 `lauf_beendet`, keine Wirkung, wird im Ablehnungsprotokoll gezählt und in der Bilanz als `nach_laufende_abgewiesen` geführt |

Nur der Producer `github-webhook` darf `run.state_changed` senden, mit `actor: "atlas"` im Block. Sendet `claude-actions` diesen Typ, folgt 403 `lifecycle_nicht_erlaubt`. Ereignisse vor der ersten Laufmeldung werden angenommen. Der Laufzustand bleibt dann „unbekannt“.

### 3.3 Anzeige im Adapter (wird bei jeder Darstellung und mindestens 1× pro Sekunde neu berechnet)

**Lauf:**
| Zustand | Bedingung | Text in `#agLiveStand` |
|---|---|---|
| R0 | keine Laufmeldung empfangen | „Lauf: Stand unbekannt (keine Laufmeldung)“ |
| R1 | letzte Laufmeldung `aktiv` | „Lauf: aktiv · gemeldet von Atlas · hh:mm:ss“ |
| R2 | letzte Laufmeldung terminal | „Lauf beendet: <zustand> · hh:mm:ss“ |

Im Zustand R2 schließt das Relay den Strom nach `strom.hinweis{grund: strom_beendet}`, sobald der Cursor am Kopf steht. Der Adapter verbindet dann **nicht** neu.

**Agent** (Namensschild `data-akt`, `title`, `aria-label`; Muster aus `activity-input.js`). Grundlage ist das *eigene* letzte angenommene Ereignis, also das mit der höchsten `stream_sequence` und `actor` = Agent. Die Regeln gelten in dieser Reihenfolge:

| # | Bedingung | `data-akt` | Text |
|---|---|---|---|
| A1 | kein eigenes Ereignis im Lauf | `kein_beleg` | „kein Beleg“ |
| A2 | letztes ist `contribution` | `beendet` | „beendet · Ergebnis zurückgegeben · <Vertrauensart>“ |
| A3 | letztes ist `stop` | `gestoppt` | „gestoppt · <Fehlerklasse aus Titel>“ |
| A4 | letztes ist `progress` oder `handoff` und der Lauf ist in R2 | `unbekannt` | „Stand unbekannt · Lauf beendet ohne eigenes Ende“ |
| A5 | letztes ist `progress` oder `handoff`, Alter ≤ Fenster | `aktiv` | „aktiv (belegt) · <Vertrauensart> · vor X s“ |
| A6 | sonst | `unbekannt` | „Stand unbekannt · letzter Beleg vor X“ |

- **Alter** = `(Date.now() + θ̂) − anker`. `anker = min(occurred_at, recorded_at)`; beide Felder sind immer gesetzt (§4.3). θ̂ ist in §8.1 definiert.
- **Fenster:** 60 s für `runtime_stream`, `runtime_hook` und `host_observed`; 300 s für `reported_checkpoint`. Atlas darf das ohne Peter justieren.
- **Anzeige von X:** in Sekunden, abgerundet; ab 120 s in Minuten.
- **Überlagerung:** Ist `data-strom` gleich `alt` oder meldet der Adapter „getrennt“, kommt „· letzter bekannter Stand“ an den Text. `data-akt` ändert sich dadurch nicht.
- **„bereit“ oder „idle“** erscheint **nie**.
- **„blockiert“** kann im MVP nicht entstehen, weil keine freigegebene Art einen Blocker erzeugt.
- **Empfang eines `handoff`** ist kein Aktivitätsbeleg für den Empfänger. Das Original zeigt dann nur den Auftragsring (§7, I-2).
- **Ordnung:** Allein `stream_sequence` entscheidet. Wird im Nachholen `progress` (Sequenz 9) nach `contribution` (Sequenz 10) zugestellt, ändert das nichts, weil der Puffer nach Sequenz ordnet. Der Endzustand ist A2.

---

## 4. Draht-Vertrag

### 4.1 Producer und Allowlists
| Producer | Auth | Typen | actor | recipient | `source_evidence` | platform |
|---|---|---|---|---|---|---|
| `claude-actions` | HMAC | `work.event`, `execution.state` | Workflow-Input `rolle` ∈ {forge, archibald, cadence} | `progress`/`stop`: null; `contribution`: `atlas` | `runtime_stream`, `runtime_hook`, `host_observed` | `claude-code` |
| `github-webhook` | Webhook-Signatur + Abgleich | `work.event`, `run.state_changed` | {atlas, nova, scout, argus, sentinel}; bei Lifecycle nur `atlas` | `progress`: null oder Rolle; `handoff` und `contribution`: Pflicht, ∈ {peter, atlas, nova, scout, argus, sentinel, forge, archibald, cadence} \ {actor} | das Relay **setzt** `reported_checkpoint` | `chatgpt-work` |

**Freigegebene `kind`:**
- `claude-actions`: {progress, contribution, stop}
- `github-webhook`: {progress, handoff, contribution}
- Alles andere → 422 `kind_nicht_freigegeben`.

### 4.2 Identitäten
| Feld | Claude | Work |
|---|---|---|
| `envelope_id` (Idempotenzschlüssel zusammen mit dem Producer) | `work.event`: gleich `event.id`. `execution.state`: `cc-<gh_run>-<attempt>-x0` (Start) bzw. `-x1` (Ende) | `gh-<comment.id>`, vom Relay vergeben |
| `event.id` | `^cc-[0-9]+-[0-9]+-[0-9]+$` (gh_run, attempt, n); muss zu `agent_id` passen, sonst 422 `id_inkonsistent` | `gh-<comment.id>`. Der Block **darf kein** `id` enthalten, sonst 422 `feld_nicht_erlaubt`. |
| `agent_id` | `gha:<gh_run>.<attempt>` | `work:<agent_path>`. `agent_path` passt auf `^atlas(/(nova\|scout\|argus\|sentinel)(#[0-9]{1,3})?)?$`. Das letzte Element (ohne `#n`) muss gleich `actor` sein, sonst 422 `actor_pfad_widerspruch`. Fehlt `agent_path`, gilt `"atlas"` und `actor` muss `atlas` sein. |
| `sequence` | Zähler n des Producers | null |
| `source_ref` (nur Journal) | `https://github.com/pahlborn/agentarium/actions/runs/<gh_run>/attempts/<attempt>` | `comment.html_url` |

**Anzeige:** Ein Pfad mit „/“ zeigt „ChatGPT Work · selbst gemeldet · über Atlas“, sonst „ChatGPT Work · selbst gemeldet (Checkpoint)“. Teilen sich Atlas und Peter ein Login, kann das Relay sie nicht unterscheiden. Diese Grenze steht im `title` des Namensschilds.

### 4.3 Zeiten
| Feld | Claude | Work |
|---|---|---|
| `occurred_at` = M1 | Wrapper-Uhr beim Lesen der Stream-Zeile, in ms | `comment.created_at` (GitHub-Server, in s), vom Relay gesetzt. Die Zeitangabe des Agenten ist im Block **nicht erlaubt**. |
| `recorded_at` = M2 | Relay-Uhr beim dauerhaften Append | dasselbe |
| `source_created_at` (Journal) | null | `comment.created_at` |

### 4.4 Gemeinsame Validierung (je Verletzung genau ein Grund)

**Rahmenbedingungen:**
- Body ≤ 8192 Byte, sonst 413.
- `project_id` = `agentarium`. Eine Fixture-Instanz akzeptiert nur `agentarium-fixture` (§11).
- `run_id` passt auf `^[A-Za-z0-9][A-Za-z0-9._-]{2,80}$`.
- `fictional` muss `false` sein, sonst 422 `fictional_im_live`.

**`title`:**
- 1–140 Unicode-Codepunkte
- keine Steuerzeichen und keine Zeilenumbrüche
- **kein `<` und kein `>`**, sonst 422 `markup_nicht_erlaubt`

**Weitere Prüfungen:**
- Grobe Secret-Muster (`ghp_`, `github_pat_`, `sk-`, `-----BEGIN`, `xox`) führen zu 422 `secret_verdacht`.
- Unbekannte Felder führen zu 422 `feld_nicht_erlaubt`.
- `event.project_id` und `event.run_id` müssen gleich dem Umschlag sein, sonst 422 `bindung`.

### 4.5 Normalisierte Beispiele
Alle IDs und Zeiten sind Beispielwerte. TC-WIRE-01 validiert jedes dieser Beispiele.

**E1 Claude `progress` (HMAC-Body):**
```json
{"schema":"agentarium.ball.ingest.v1","type":"work.event","envelope_id":"cc-39100000001-1-3",
 "project_id":"agentarium","run_id":"R-20261018-01",
 "event":{"id":"cc-39100000001-1-3","project_id":"agentarium","run_id":"R-20261018-01",
  "sequence":3,"task_id":"AG-BALL-LIVE-001-E2E-01","actor":"forge","recipient":null,
  "kind":"progress","title":"Zwischenstand: Werkzeug Read · Schritt 3","caused_by":[],
  "occurred_at":"2026-10-18T09:00:12.345Z","fictional":false,
  "source_evidence":"runtime_stream","agent_id":"gha:39100000001.1","platform":"claude-code"}}
```

**E2 Claude `contribution`:**
Gleich wie E1, mit diesen Abweichungen:
- `id` `…-1-9`, `sequence` 9
- `kind` `contribution`, `recipient` `atlas`, `title` „Ergebnis zurückgegeben“, `source_evidence` `host_observed`
- `"verbrauch":{"belegt":true,"input_tokens":1200,"output_tokens":3400,"thinking_tokens":800,"actual_model":"claude-…","platform":"claude-code","agent_id":"gha:39100000001.1"}`
- Ohne belegte Zahlen: `"verbrauch":{"belegt":false}`

**E3 Claude `execution.state` (nur Audit, kommt nie in den Strom):**
```json
{"schema":"agentarium.ball.ingest.v1","type":"execution.state","envelope_id":"cc-39100000001-1-x1",
 "project_id":"agentarium","run_id":"R-20261018-01",
 "ausfuehrung":{"execution_id":"gha:39100000001.1","actor":"forge","zustand":"beendet",
  "ergebnis":"ok","exit_code":0,"process_started_at":"2026-10-18T08:59:58.120Z",
  "process_exited_at":"2026-10-18T09:03:40.512Z","nicht_zugestellt":[]}}
```
- `zustand`: `gestartet` oder `beendet`
- `ergebnis`: `ok`, `fehler`, `abbruch` oder null (bei `gestartet`)
- `process_exited_at`: null bei `gestartet`

**E4 Work-Kommentar `progress` von Atlas (genau so im Live-Issue):**
````
<!-- ball-live:v1 -->
```json
{"v":1,"type":"work.event","run_id":"R-20261018-01","actor":"atlas","agent_path":"atlas",
 "kind":"progress","title":"Zwischenstand: Spezifikation geprüft, starte Protokollabgleich",
 "task_id":"AG-BALL-LIVE-001-E2E-02","recipient":null}
```
````
Erlaubte Schlüssel:
- für `work.event`: genau {v, type, run_id, actor, agent_path, kind, title, task_id, recipient}
- für Lifecycle: {v, type, run_id, actor, zustand, grund}

Außer Leerraum steht nichts vor oder nach dem Block.

**Normalisierung durch das Relay** (`comment.id` = 2400000001):
```json
{"schema":"agentarium.ball.ingest.v1","type":"work.event","envelope_id":"gh-2400000001",
 "project_id":"agentarium","run_id":"R-20261018-01",
 "event":{"id":"gh-2400000001","project_id":"agentarium","run_id":"R-20261018-01","sequence":null,
  "task_id":"AG-BALL-LIVE-001-E2E-02","actor":"atlas","recipient":null,"kind":"progress",
  "title":"Zwischenstand: Spezifikation geprüft, starte Protokollabgleich","caused_by":[],
  "occurred_at":"2026-10-18T09:01:05Z","fictional":false,"source_evidence":"reported_checkpoint",
  "agent_id":"work:atlas","platform":"chatgpt-work"}}
```

**E5 Work-Kind:** `"actor":"sentinel","agent_path":"atlas/sentinel#1"` wird zu `"agent_id":"work:atlas/sentinel#1"`.

**E6 Lifecycle** als Kommentarblock `{"v":1,"type":"run.state_changed","run_id":"R-20261018-01","actor":"atlas","zustand":"aktiv","grund":"Lauf eröffnet"}`, normalisiert:
```json
{"schema":"agentarium.ball.ingest.v1","type":"run.state_changed","envelope_id":"gh-2400000000",
 "project_id":"agentarium","run_id":"R-20261018-01",
 "laufmeldung":{"project_id":"agentarium","run_id":"R-20261018-01","zustand":"aktiv",
  "zustand_vorher":null,"occurred_at":"2026-10-18T08:59:30Z","grund":"Lauf eröffnet","arbeitsstrom":null}}
```
`zustand_vorher` setzt das Relay aus §3.2. Ein Wert aus dem Block wird nicht übernommen.

**E7 Lesestrom (V2.1-Umschläge):**
```json
{"schema":"agentarium.strom.v2.1","stream":"lauf","stream_id":"agentarium/R-20261018-01",
 "stream_sequence":1,"kind":"run.state_changed","sent_at":"2026-10-18T08:59:31.020Z",
 "payload":{"project_id":"agentarium","run_id":"R-20261018-01","zustand":"aktiv","zustand_vorher":null,
  "occurred_at":"2026-10-18T08:59:30Z","grund":"Lauf eröffnet","arbeitsstrom":null}}
```
Für `work.event` gilt dieselbe Hülle mit `"kind":"work.event"`. `payload` ist das gespeicherte Ereignis plus `"recorded_at"`.

### 4.6 Auditjournal (append-only, ein Schreiber je Strom)
```json
{"stream_id":"agentarium/R-20261018-01","audit_seq":9,"stream_sequence":7,
 "recorded_at":"2026-10-18T09:00:12.901Z","producer":"claude-actions","auth":"hmac",
 "envelope_id":"cc-39100000001-1-3","type":"work.event",
 "source_ref":"https://github.com/pahlborn/agentarium/actions/runs/39100000001/attempts/1",
 "source_created_at":null,"delivery":"direct","delivery_id":null,
 "body_sha256":"<sha256(JCS(envelope ohne recorded_at))>","payload":{"…":"…"}}
```

- **Zwei Zähler, atomar im selben Schreibschritt:**
  - `audit_seq`: alle angenommenen Umschläge, lückenlos ab 1
  - `stream_sequence`: nur `work.event` und `run.state_changed`, lückenlos ab 1
  - `execution.state` hat `stream_sequence: null`.
- **Webhook-Einträge:**
  - `delivery` ∈ {`webhook`, `abgleich`}
  - `delivery_id` = `X-GitHub-Delivery`, nur zur Diagnose
  - `body_sha256` über das JCS (RFC 8785) des **geparsten Blocks**, nicht über die Webhook-Nutzlast. So erzeugen Webhook und Abgleich denselben Hash.
- **Dedupe über (producer, envelope_id):**
  - gleicher Hash → 200 `{duplicate:true, stream_sequence|audit_seq: ursprünglich}`
  - anderer Hash → 409 `id_konflikt`

### 4.7 Projektion Journal → V2.1-Archiv (deterministisch)
Gilt nur für einen terminalen Lauf. Die Ausgabe ist JCS-kodiert, die SHA-256 läuft über genau diese Bytes.

| Manifestfeld | Regel |
|---|---|
| `ereignisse` | Alle `work.event`-Payloads in `stream_sequence`-Reihenfolge, byte-gleich zum Stromeintrag (inkl. `recorded_at`). Leer → kein Manifest, 409 `archiv_leer`; die Bilanz wird trotzdem erzeugt. |
| `zustand` | letzte Laufmeldung (terminal) |
| `herkunft` | `{mode:"OBSERVED_PROJECT_WORK", fictional:false, source_evidence:null}` |
| `quellen` | die tatsächlich beteiligten Producer, alphabetisch |
| `abdeckung` | `ordering`: „stream_sequence (Relay, ein Schreiber)“; `timestamps`: „occurred_at = M1 (Wrapper bzw. GitHub created_at); recorded_at = M2 (Relay)“; `luecken`: sortierte Texte, siehe unten |
| `zeitachse` | `complete`, wenn alle `occurred_at` gesetzt sind; im Profil ist das immer der Fall |
| `vollstaendig` | `false`, sobald Work beteiligt ist oder irgendeine Lücke besteht |
| `kosten` | `{sichtbar:true, erfassung:"unvollstaendig", daten:"real", status_text:"Kosten nicht vollständig ermittelbar.", ohne_angabe:<Anzahl ereignisse ohne verbrauch.belegt=true>}` |
| `wiedergabe` | `{nebenwirkungsfrei:true, zeitsprung:false, einzelschritt:false, deterministisch:true}` |
| `archiv_version` / `schema_fassung` | `"1"` / `"V2.1.2"` |

**Mögliche Einträge in `luecken`:**
- `nicht_zugestellt:<id>` (aus `execution.state`)
- `offene_ausfuehrung:<execution_id>`
- `nach_laufende_abgewiesen:<n>`
- `work_abgleich_luecke:<von>/<bis>`
- `bearbeitet_vor_abgleich:gh-<id>`

**Bilanzdatei** `<run>.bilanz.json` (eigenes Schema `agentarium.ball.bilanz.v1`, nicht Teil des Manifests):
- Anzahlen je Typ: `work_event`, `lifecycle`, `execution_state`
- Ablehnungen je Grund
- Liste der Ausführungen mit Start und Ende
- `quellstatus`-Verlauf
- `manifest_sha256`

Regel: `ereignisse.length == bilanz.work_event`.

---

## 5. Anforderungen und Akzeptanzkriterien

### ST1 Ingest und Journal
| ID | Anforderung |
|---|---|
| FR-1.1 | Es gibt nur zwei Schreibwege: `POST /v1/ingest` (HMAC) und `POST /v1/ingest/github` (Webhook). Andere Pfade → 404, andere Methoden → 405. Für Schreibpfade gibt es keine CORS-Header; `OPTIONS` auf einen Schreibpfad → 405. |
| FR-1.2 | **HMAC:** Header `X-Ball-Producer`, `X-Ball-Timestamp` (Unix-Sekunden) und `X-Ball-Signature: sha256=hex(HMAC_SHA256(key, ts+"."+raw_body))`. Zeitfenster \|now−ts\| ≤ 300 s. Vergleich in konstanter Zeit. Ein Schlüssel je Producer. |
| FR-1.3 | **Webhook:**<br>• `X-Hub-Signature-256` prüfen.<br>• Nur `issue_comment` mit `action=created` wird verarbeitet; andere Events oder Actions → 202 `ignoriert`, ohne Wirkung.<br>• `repository.full_name`, `issue.number` und `comment.user.login` müssen auf der Allowlist der Variante stehen.<br>• Kommentar ohne Marker → 202 `kein_marker`, wird nur gezählt.<br>• Marker mit ungültigem Block → 422. |
| FR-1.4 | Validierung nach §4.1–4.4 |
| FR-1.5 | Identitäten nach §4.2 |
| FR-1.6 | Idempotenz nach §4.6, für **alle** Typen, auch Lifecycle und `execution.state` |
| FR-1.7 | Ein Schreiber je Strom. Gleichzeitige Ingests erzeugen weder doppelte Sequenzen noch Lücken. |
| FR-1.8 | Antwort 201 `{audit_seq, stream_sequence, recorded_at}` erst nach dauerhaftem Append. Schlägt die Speicherung fehl → 503 und keinerlei Wirkung. Die Antwort an GitHub muss innerhalb von 10 s erfolgen; was danach scheitert, deckt der Abgleich (§9). |
| FR-1.9 | Rate-Limits: 60 Ingests pro Minute je Producer, sonst 429 mit `Retry-After`. 30 Lese-Verbindungsaufbauten pro Minute je IP, sonst 429. |
| FR-1.10 | Das Ablehnungsprotokoll enthält nur `{ts, producer, grund, body_sha256, laenge, feld?, delivery_id?, comment_id?}`. **Nie** Rohinhalte, Auszüge oder Header-Werte. |
| FR-1.13 | Lifecycle-Regeln nach §3.2 |

**AC-1.1:** Eine Anfrage mit genau einer Auth-Verletzung erhält 401 oder 403. Dann:
- Journal und beide Zähler bleiben unverändert;
- das Ablehnungsprotokoll nennt den Grund.

**AC-1.2:** Jede einzelne Verletzung nach §4.4 ergibt den angegebenen Code und Grund und hat keine Wirkung. Der Grenzwert selbst wird angenommen (z. B. 140 Codepunkte, −299 s).

**AC-1.3:** Dieselbe `envelope_id` mit demselben Hash ergibt 200 dup mit der ursprünglichen Sequenz. Mit anderem Hash ergibt sie 409. Das Journal wächst in beiden Fällen nicht.

**AC-1.4:**
- 2×20 gleichzeitige Ingests ergeben `stream_sequence` 1..40.
- Nach einem Neustart liefert `events?after=0` genau 1..40.
- Ein Speicherfehler vor dem Append ergibt 503, die Wiederholung dann 201.
- Ein verlorenes Ack nach dem Append ergibt bei der Wiederholung 200 dup mit derselben Sequenz.

**AC-1.5:** Claude-`run.state_changed` ergibt 403. Die Übergänge aus §3.2 liefern exakt die angegebenen Codes.

**AC-1.6:** Das Ende einer Claude-Ausführung ändert den Laufzustand nicht.

**AC-1.7:** Nach allen Negativtests findet ein grep nach dem Canary-Wert in Relay-Logs, Journal, Ablehnungsprotokoll, Health-Ausgabe und Export null Treffer.

### ST2 Claude-Quelle
| ID | Anforderung |
|---|---|
| FR-2.1 | Neuer Wrapper `relay/ball_live_claude_stream.py`; `relay/forge_live_thinking_once.py` bleibt unverändert. Er startet `claude … --output-format stream-json` (`--verbose` nach E1) und liest stdout zeilenweise, während der Prozess läuft. |
| FR-2.2 | **Abbildung:**<br>• Init → `execution.state gestartet` und `progress` „Zwischenstand: Ausführung gestartet“ (`host_observed`).<br>• Jedes `tool_use` → `progress` „Zwischenstand: Werkzeug <Name> · Schritt <n>“ (`runtime_stream`), höchstens eines je **10 s**. `<Name>` stammt aus der Allowlist {Read, Grep, Glob, Edit, Write, Bash, WebFetch, Task}, sonst „Werkzeug“.<br>• Ergebnis ok → `contribution` an atlas (E2).<br>• Fehler oder Abbruch → `stop` „Ausführung beendet: <fehler\|abbruch\|budget\|zeit>“ (`host_observed`).<br>• Danach immer, im `finally`, `execution.state beendet` mit `process_exited_at` = Wrapper-Zeit direkt nach `wait()`.<br>• Kein Lifecycle. |
| FR-2.3 | **Korrelation:** `run_id` = Workflow-Input `ball_run_id`, `task_id` = Input `task_id` (gleich dem `task_id` von Atlas’ `handoff`), `actor` = Input `rolle`. |
| FR-2.4 | Ingest-Schlüssel nur im Wrapper. Die Umgebung des Subprozesses enthält weder ihn noch `GH_TOKEN`/`GITHUB_TOKEN`. |
| FR-2.5 | **Spool:**<br>• Eine eigene Warteschlange speichert die exakten Bytes je ID.<br>• 3 s Timeout, 5 Wiederholungen mit Backoff 1/2/4/8/8 s.<br>• Der Spool blockiert das Lesen nicht.<br>• Endgültig Unzustellbares → `nicht_zugestellt` in `execution.state beendet` und im Actions-Log.<br>• Das Actions-Log enthält nur `id, kind, HTTP, seq`, **keinen Titel**. |
| FR-2.6 | Nach einem Terminalereignis kein `progress` mehr. Das Relay lehnt `work.event` mit einer `agent_id` ab, deren `execution.state beendet` schon journalisiert ist: 409 `ausfuehrung_beendet`. |

**AC-2.1 (Kernkriterium):** Ein echter Lauf; ein `runtime_stream`-`progress` P wird angenommen und erscheint sichtbar (M5). Dann gelten:
- (a) Nach §8.2 liegt `M5_oben(P) + 5 s < process_exited_at` der Ausführung.
- (b) P steht im Actions-Log, im Journal, in `__agLive.stand()` und im Video.
- (c) Die Zeile `BALL exec end` im Actions-Log weicht um ≤ 2 s von `process_exited_at` ab.

**AC-2.2:** Ein Harness-env-Dump des Subprozesses zeigt keinen Schlüssel und kein Token. Das ist kein Live-Nachweis.

**AC-2.3:** Das Relay ist 20 s unerreichbar. Der Prozess liest weiter, und danach kommt alles mit unveränderter ID genau einmal im Journal an. Ist das Relay länger als das Retry-Budget weg, stehen die verlorenen IDs in `nicht_zugestellt` und in `abdeckung.luecken`.

### ST3 Work-Quelle
| ID | Anforderung |
|---|---|
| FR-3.1 | Ein Kommentar pro Checkpoint im konfigurierten Live-Issue, Format nach E4/E6 |
| FR-3.2 | Freigegebene Arten und Empfänger nach §4.1. Lifecycle nach §3.2. |
| FR-3.3 | Zeiten nach §4.3 |
| FR-3.4 | Provenienz nach §4.2 (`agent_path`) |
| FR-3.5 | Keine Behauptung vollständiger Work-Telemetrie. `zustand_am_cursor.abdeckung` = `partial`. |
| FR-3.6–3.9 | Abgleich, Lückensignal, Diagnose und Dedupe nach §9 |

**AC-3.1 (Kernkriterium):** Atlas postet mitten im Auftrag P_W und führt danach eine echte Arbeitsaktion A aus (§8.2). P_W ist sichtbar mit Work-Vertrauensart, und es gilt `t_A ≥ M5_oben(P_W) + 5 s`. A ist über `task_id` und Inhalt korreliert. Q_W folgt nach A und verweist auf A.

**AC-3.2:** Einzelfälle, je mit Ablehnung, ohne Journal und ohne Anzeige:
- fremdes Login
- `source_evidence` im Block
- `id` im Block
- fremdes `occurred_at` im Block

**AC-3.3:** Ein Kommentar, der während eines Relay-Ausfalls erstellt wurde, ist ≤ 120 s nach Ende des Ausfalls journalisiert, mit `delivery: abgleich`, genau einmal.

**AC-3.4:** Ist der Abgleich bei aktivem Lauf > 5 min gestört, zeigt das Original innerhalb eines Lebenszeichen-Takts „Work-Quelle: Abgleich gestört seit hh:mm – Checkpoints können fehlen“.

### ST4 Lesestrom
| ID | Anforderung |
|---|---|
| FR-4.1 | Endpunkte nach §6.1, nur lesend, CORS nach §6.3 |
| FR-4.2 | SSE über fetch-Streaming:<br>• Fachereignis: `id: <seq>` / `event: fach` / `data: <umschlag_fach>`<br>• `event: herzschlag` alle 5 s auf jeder offenen Verbindung, erstes ≤ 1 s nach Öffnen, mit `last_sequence` = Kopf (0, wenn leer)<br>• `event: hinweis`<br>• `event: quellstatus` (Profilerweiterung, §9) beim Öffnen und bei jeder Änderung |
| FR-4.3 | Wiederaufnahme **nur** über `?after=n`; der Browser sendet keinen `Last-Event-ID`-Header. Zustellung lückenlos ab n+1. Cursorfälle nach §6.2. |
| FR-4.4 | Das Relay schließt jede Verbindung nach 10 min ohne Hinweis; das ist Rotation. Bei terminalem Lauf und Cursor am Kopf: `hinweis strom_beendet`, danach Schluss. |

**AC-4.1:** Cursor n, Abbruch, k neue Ereignisse, Rückkehr: geliefert werden genau n+1..n+k, jedes einmal.

**AC-4.2:** Das erste Lebenszeichen kommt ≤ 1 s nach dem Öffnen. Über 60 s ist jeder Abstand ≤ 6 s. `last_sequence` ist jeweils gleich dem Kopf.

**AC-4.3:** Die Cursorfälle aus §6.2 liefern exakt die Tabellenwerte.

**AC-4.4:** Alle Beispiele aus §4.5 und §6.1 bestehen die Validierung gegen V2.1 bzw. gegen das Ingest-Schema.

### ST5 Original-Adapter und Wahrheitsanzeige
| ID | Anforderung |
|---|---|
| FR-5.1 | Aktivierung nur über `?live=1&run=<run_id>`, über `__agOriginal.live()` (§7). Fehlerfälle nach TC-ACT-01, jeweils mit sichtbarem Text und ohne Netzverbindung. |
| FR-5.2 | Die Relay-Basis ist eine Konstante in `live.js`. Ausnahme: `window.__AG_LIVE_BASIS` wird **nur** akzeptiert, wenn `location.origin` mit `http://127.0.0.1:` oder `http://localhost:` beginnt (§11). |
| FR-5.3 | Ablauf `betrieb` → `resume` → `events`. Generation, Backoff 1/2/4/8/15 s, sofortiger Neuversuch bei `online` und `visibilitychange→visible`. Watchdog: 25 s ohne Bytes → Abbruch, Generation +1, neu verbinden. |
| FR-5.4 | Dedupe und Ordnung nach §6.4 |
| FR-5.5 | Hooks:<br>• `herzschlag` → `__agStrom.lebenszeichen()`<br>• Verbindung offen → `__agStrom.an()`<br>• Fehler → `__agStrom.aus()` und „getrennt · verbinde neu“<br>• `work.event` → `__agEreignis(payload, meta)`<br>• `run.state_changed` → Laufzeile §3.3<br>• `quellstatus` → Statuszeile |
| FR-5.6 | Original-Delta nach §7 |
| FR-5.7 | Namensschilder nach §3.3, aktualisiert von einem eigenen 1-s-Takt in `live.js` über `__agOriginal.namensschilder()` |
| FR-5.8 | Diagnose `window.__agLive.stand()`:<br>• Cursor, H0, Generation, Verbindung<br>• Zähler: empfangen, angenommen, abgewiesen, duplikat, gepuffert, verworfen_generation<br>• die letzten 50 Einträge `{id, seq, occurred_at, recorded_at, m3, m4, m5p, angenommen, grund, nachgeholt}`<br>• θ̂, RTT_min<br>Antippen von `#agLiveStand` öffnet die Diagnose als Text. |
| FR-5.9 | „Nachgeholt“ heißt: `seq ≤ H0`, wobei H0 = `hoechste_sequenz` aus der `resume`-Antwort dieser Generation. Anzeige: „· nachgeholt · hh:mm:ss“ (`occurred_at` in Ortszeit). |
| FR-5.10 | Fassungsabgleich: Ist `__agOriginal.fassung` ≠ `ERWARTET` in `live.js`, bleibt der Adapter aus und zeigt „Fassung passt nicht (Seite X, Adapter Y) · bitte einmal neu öffnen“. |
| FR-5.11 | Jede sichtbare Aussage im Live-Modus folgt dem Inventar I-2 (§7) |

**AC-5.1 (Kernkriterium):** P (Claude) und P_W (Work) erscheinen als Zeile mit Actor, `progress` und Vertrauensart, bestätigt durch das Frame-Orakel aus §8.3. `__agEreignis` liefert für beide `angenommen:true` mit der Quell-ID.

**AC-5.2:** `progress` hat keine Nebenwirkung: kein `auftragFertig`, kein Stopper, der Ball bleibt, wo er war.

**AC-5.3:** Die Tabelle aus §3.3 gilt für alle Zeilen. Nach > 20 s ohne Lebenszeichen oder Ereignis gilt `data-strom="alt"`.

**AC-5.4:** Jede Senke aus I-1 zeigt Markup wörtlich als Text. Es entsteht kein neues Element, und kein Skript läuft.

**AC-5.5:** Bei Start mit Cursor 103 und dem Strom 104, 106, 106, 105 wird in der Reihenfolge 104, 105, 106 angewendet, `duplikat` = 1, Cursor endet bei 106.

**AC-5.6:** Nach einer Unterbrechung ist alles, was im Fenster lag, als nachgeholt markiert, nichts doppelt, kein Reload.

**AC-5.7:** Die Aktivierungs- und Fassungsfehler aus TC-ACT-01 erscheinen sichtbar, und es entsteht keine Netzverbindung.

**AC-5.8:** Kein sichtbarer Text im Live-Modus widerspricht §3.3 oder I-2.

### ST6 Archiv
| ID | Anforderung |
|---|---|
| FR-6.1 | Projektion nach §4.7, automatisch erzeugt, sobald der Lauf terminal ist. Das Manifest ist danach unveränderlich. |
| FR-6.2 | `GET /v1/runs/{p}/{r}/archive` liefert das Manifest; `/bilanz` liefert die Bilanz. Läuft der Lauf noch → 409. Nach Ablauf der Aufbewahrung → 410 `archiv_abgelaufen` mit `{export_ref}`. |
| FR-6.3 | Export-Workflow `ball-live-export.yml` (manuell) schreibt Manifest, Bilanz und `.sha256`:<br>• Variante (a): Branch `agent/ball-live-archive` in `pahlborn/agentarium`<br>• Variante (b): **nur** ins private Inbox-Repository |
| FR-6.4 | `?archiv=1&run=R` lädt vom Relay. Bei 410 versucht der Adapter dieselbe Herkunft `archiv/<run>.json`; die Datei gibt es nur nach einer gesonderten Release-Freigabe. Sonst sichtbar: „Archiv nicht mehr beim Relay · Export: <export_ref> · Veröffentlichung braucht Freigabe“. |
| FR-6.5 | Das Manifest geht an `__agOriginal.archiv(manifest)` (§7). Der Kopf zeigt „Archiv · aufgezeichnet“, `verbunden` wird nie gesetzt. |

**AC-6.1:**
- Zwei Projektionen desselben Laufs sind byte-gleich.
- Das Manifest ist gültig gegen `$defs.archivmanifest` (ajv oder jsonschema).
- `ereignisse` hat dieselben IDs und dieselbe Reihenfolge wie die `work.event`-Einträge im Journal.
- Die SHA stimmt.

**AC-6.2:** Die Wiedergabe spielt genau die IDs des Manifests in dessen Reihenfolge. Endzustand nach TC-ARC-02; nie `data-strom="lebt"`.

**AC-6.3:** Nach Ablauf der Aufbewahrung erscheint der Hinweis aus FR-6.4. Es gibt keine erfundene Wiedergabe.

**AC-6.4:** In Variante (b) existiert im öffentlichen Repository kein Archivartefakt.

### Nichtfunktionale Anforderungen
| ID | Anforderung | TC |
|---|---|---|
| NFR-1 | Keine langlebigen Producer- oder GitHub-Secrets im Browser. In (b) gibt es nur ein widerrufbares Lesetoken je Gerät, nie in der URL. | TC-SEC-03 |
| NFR-2 | Nur die D4-Metadaten aus §4 fließen. Ablehnungsprotokoll nach FR-1.10. | TC-VAL-01, TC-LOG-01 |
| NFR-3 | TLS. CORS ist kein Zugriffsschutz; die Autorisierung liegt auf dem Server. | TC-CORS-01 |
| NFR-4 | Latenz wird nach §8.1 gemessen; bewertet wird nur gegen H-E1. | TC-LAT-01, TC-EXP-01 |
| NFR-5 | `GET /v1/health` (§9.4). Ein Ausfall ist als Verbindungs- oder Quellstatus sichtbar, nie als Leerlauf. | TC-OPS-01 |
| NFR-6 | Demo, Archiv-Stücke und `?mvp=1` bleiben unverändert. | TC-REG-01 |
| NFR-7 | iPad: live im Vordergrund. Im Hintergrund oder bei Sperre gibt es keine Live-Zusage, aber vollständiges Nachholen. | TC-DEV-03 |
| NFR-8 | Jede Ablehnung im Adapter wird mit Grund gezählt. | TC-REJ-01 |

---

## 6. Lesepfad im Detail

### 6.1 Endpunkte und Beispiele
| Endpunkt | Antwort |
|---|---|
| `GET /v1/betrieb` | `{"schema":"agentarium.betrieb.v2.1","rahmen":"header_fetch_streaming","katalogstrom":"deaktiviert: BALL-Live-Profil 1.0 liefert keinen Katalogstrom","resume_pruefung":"/v1/streams/{project_id}/{run_id}/resume?cursor={cursor}","heartbeat_takt_s":5,"veraltet_nach_s":20,"supported_actions":[]}`. Der Adapter öffnet den Katalog nie. |
| `GET /v1/streams/{p}/{r}/resume?cursor=n` | `resume_antwort` (§6.2) |
| `GET /v1/streams/{p}/{r}/events?after=n` | SSE (FR-4.2) |
| `GET /v1/streams/{p}/{r}/snapshot` | Beispiel unten |
| `GET /v1/runs/{p}/{r}/archive` und `/bilanz` | FR-6.2 |
| `GET /v1/health` | §9.4 |

**Snapshot-Beispiel:**
```json
{"schema":"agentarium.schnappschuss.v2.1","stream":"lauf","stream_id":"agentarium/R-20261018-01",
 "cursor":9,"sent_at":"2026-10-18T09:02:00Z","replay_grenze":1,"hoechste_sequenz":9,"rechte":["read"],
 "supported_actions":[],
 "lauf":{"project_id":"agentarium","run_id":"R-20261018-01","zustand":"aktiv","terminal":false,
  "ansicht":"live","befehlsfaehig":false,
  "herkunft":{"mode":"OBSERVED_PROJECT_WORK","fictional":false,"source_evidence":null},
  "zeitachse":"complete",
  "zustand_am_cursor":{"cursor":9,"aufgaben":[],"artefakte":[],"blockaden":[],"abdeckung":"partial"},
  "letzte":[]},
 "kosten":{"sichtbar":true,"erfassung":"unvollstaendig","daten":"real",
  "status_text":"Kosten nicht vollständig ermittelbar.","ohne_angabe":0}}
```
Gibt es keine Laufmeldung, gilt `"lauf": null`. `letzte` enthält höchstens die letzten 10 `work.event`.

### 6.2 Cursor-Tabelle
Die Replay-Grenze ist im MVP immer 1; das Journal wird während der gesamten Aufbewahrung gehalten.

| Fall | `resume` | `events?after=n` | Adapter |
|---|---|---|---|
| n = 0, Strom leer | `fortsetzbar:true, grund:fortsetzbar, hoechste_sequenz:0` | Lebenszeichen, sonst nichts | H0 = 0 |
| 0 ≤ n ≤ Kopf | fortsetzbar | n+1..Kopf, danach live | H0 = Kopf |
| n > Kopf | `fortsetzbar:false, grund:cursor_zu_hoch, neuer_schnappschuss:"/v1/…/snapshot"` | `hinweis cursor_zu_hoch` + Schluss | **Anhalten**, sichtbar „Relay-Stand kleiner als Anzeige (Cursor n > m) · angehalten“. Kein Reset, keine Anwendung. Das gilt als FAIL-Signal (§14). |
| n + 1 < Grenze (im MVP unerreichbar, trotzdem implementiert) | `replay_grenze_unterschritten` + Snapshot | Hinweis + Schluss | Snapshot laden; nur die Laufzeile übernehmen; `letzte` **nicht** anwenden; Cursor = `snapshot.cursor`; sichtbar „Lücke: Sequenzen n+1..g−1 nicht nachholbar“ |
| n kein Integer oder negativ | 400 | 400 | wird vom Adapter nie erzeugt |
| Lauf terminal, n = Kopf | fortsetzbar | `hinweis strom_beendet` + Schluss | kein Reconnect |

### 6.3 Lese-Auth und CORS
**Variante (a), öffentlich:**
- Lesen ohne Auth.
- GET-Antworten tragen `Access-Control-Allow-Origin: https://pahlborn.github.io` und `Vary: Origin`.
- Andere Origins erhalten keinen ACAO-Header; der Server liefert trotzdem, denn die Daten sind öffentlich.
- Der Browser sendet keine eigenen Header und `credentials:'omit'`, es gibt also keinen Preflight.

**Variante (b), privat:**
- Alle Leseendpunkte inkl. `betrieb` und `health` verlangen `Authorization: Bearer <lesetoken>`, sonst 401.
- `OPTIONS` antwortet mit ACAO für die Origin, `Allow-Headers: Authorization`, `Allow-Methods: GET` und `Max-Age: 600`.
- Tokens werden beim Relay gehasht gespeichert, je Gerät eines, einzeln widerrufbar.
- Eingabe einmalig im Feld `#agLiveStand`; gespeichert in `localStorage['agentarium.ball.lesetoken']`, sofern erlaubt.
- Bei 401 erscheint „Lesezugang abgelehnt“, und es gibt keinen Retry-Sturm (Backoff, ab 15 s anhalten).

### 6.4 Dedupe, Ordnung, Generation, Storage
- **Kein Cursor im Speicher.** Das Original hält den Feldzustand nur im RAM. Jede neue Seite beginnt deshalb mit Cursor 0 und holt alles nach (als nachgeholt markiert).
  - Dedupe läuft über eine Menge `{id}` und `seq` im RAM, die so lange lebt wie die Seite.
  - Variante (a) nutzt keinerlei Storage.
  - Ein gesperrter Storage hat nur in (b) eine Folge: das Token muss bei jedem Laden neu eingegeben werden, mit sichtbarem Hinweis „Token nicht speicherbar“.
- **Ordnung:**
  - `seq == cursor+1` → anwenden, danach den Puffer leeren, solange er lückenlos ist.
  - `seq ≤ cursor` → `duplikat`+1, keine Wirkung.
  - `seq > cursor+1` → puffern (höchstens 50 Einträge oder 10 s), danach Verbindung schließen und mit `after=cursor` neu aufbauen (Generation+1).
- **Hook-Ablehnung** (`angenommen:false` oder Exception) → `abgewiesen`+1 mit Grund. Der Cursor **rückt trotzdem vor**, weil die Ablehnung deterministisch ist.
- **Generation:**
  - erhöht sich bei jedem Verbindungsversuch und bei jedem Stopp;
  - jede Antwort und jeder Chunk prüft `gen === aktuell`, sonst wird verworfen und `verworfen_generation` erhöht;
  - es gibt immer nur einen aktiven Reader.

### 6.5 Lebenszeichen und Veraltet
- „alt“ heißt: `Date.now() − letztesLZ > 20000 ms`. `letztesLZ` wird durch ein Lebenszeichen **oder** ein angenommenes Ereignis gesetzt (B10).
- Testorakel für den Wechsel auf `alt`: t ∈ (20,0 s ; 21,5 s].
- „getrennt · verbinde neu“ erscheint sofort beim ersten Fetch-Fehler oder Watchdog-Abbruch.

### 6.6 Speicher- und Ack-Fehler (Relay)
- **Speicherfehler vor dem Append:** 503, keine Wirkung.
- **Verlorene Antwort nach dem Append:** Eine Wiederholung derselben ID ergibt 200 dup mit derselben Sequenz.

### 6.7 Drosselung und Funkloch
Claude sendet höchstens ein `progress` je 10 s. Ein Offline-Fenster von 45 s enthält also nur dann ≥ 3 Ereignisse, wenn Werkzeuge fortlaufend genutzt werden. Bei < 3 Journal-Einträgen im Fenster ist TC-REC-01 INCONCLUSIVE und wird wiederholt; es ist dann weder Pass noch Fail.

---

## 7. Original-Delta (`feld/index.html`, Fassung 48)

**Erlaubte Änderungen:**

1. **`ARTEN.progress`:** `{abgabe:0, nachhall:1.2, gestalt:'pfeil', kraft:0.4, tempo:1.2, gross:0.5, was:'Zwischenstand – arbeitet noch'}`. Zusätzlich gilt: kein `auftragFertig`, kein Stopper. Braucht `wirf()` einen Empfänger, wird `progress` ohne `recipient` nur als Zeile und Meldung ohne Flug gezeigt; Forge belegt das per TC-SEM-01.

2. **Bootstrap-Hook in der IIFE,** neben dem `?mvp=1`-Block:
   ```js
   window.__agOriginal = Object.freeze({ fassung: FASSUNG, gebaut: GEBAUT,
     live: function () { modusSetzen('live'); return { ok: MODUS === 'live' }; },
     archiv: function (manifest) { /* FR-6.5 */ },
     namensschilder: function () { /* [{name, el}] der Agentenschilder */ } });
   ```
   - Sind `?live=1` und `?mvp=1` gleichzeitig gesetzt, startet keiner von beiden.
   - `?mvp=1` bleibt sonst unverändert.
   - `archiv()` setzt den Modus `archiv` und baut aus dem Manifest ein Stück:
     - `projekt`: `'agentarium'`, `titel`: `run_id`
     - Ereignisse über dieselbe Normalisierung wie `__agEreignis`
     - `t` = `occurred_at` − erstes `occurred_at` in s
     - `dauer` = letztes `t` + 5
     - Kennzeichen „Archiv · aufgezeichnet“
   - Den genauen Aufbau des Stück-Formats bestimmt Forge am Code.

3. **`__agEreignis(e, meta)`:**
   - Mit `meta` ist eine `id` Pflicht. Eine bereits bekannte `id` → `{angenommen:false, grund:'id doppelt'}`.
   - Übernommen werden: `task_id`→`E.aufgabe`, `source_evidence`, `platform`, `agent_id`, `recorded_at`, `meta.seq` und `meta.nachgeholt`.
   - Ohne `meta` bleibt das bisherige Verhalten (Regression).

4. **Escaping aller Senken nach Inventar I-1** (`textContent` oder `esc()`). Mindestens:
   - `stromZeile`: `E.kommando`, `E.an`, `E.modell`, `E.text`, `E.art`, `E.von`
   - `melden`: `von`, `art`, `text`
   - `kopfSetzen`: `STUECK.titel`, `STUECK.beschreibung`, Stücknamen
   - dazu jede Stelle in den nicht gelesenen Funktionen

5. **Vertrauensart-Tag** in `stromZeile` und `melden` (Texte aus §1.1 von V2, unverändert):
   - „Claude Code · Laufzeitstrom“, „Claude Code · Hook“, „Host beobachtet“
   - „ChatGPT Work · selbst gemeldet (Checkpoint)“ bzw. „· über Atlas“
   - Zusätze „· nachgeholt · hh:mm:ss“ und „Archiv“
   - bei `fictional:true` zusätzlich „synthetisch (Test)“

6. **Wahrheitsanpassung im Live-Modus** (nur bei `MODUS==='live'`):
   - Der Text des Arbeitsrings wird zu „Auftrag offen · mm:ss“ statt „arbeitet“.
   - Der Bereitschaftspuls (`bereitschaft()`) ist unterdrückt.

7. **`FASSUNG='48'`, `GEBAUT`** aus dem Build und `<script src="live.js"></script>` nach dem Hauptskript.

8. **`sw.js`:** `VORRAT='agentarium-v48'` und `live.js` in `STUECKE`. Relay-Anfragen haben eine fremde Herkunft und laufen deshalb ohnehin am Service Worker vorbei.

**I-1 Senkeninventar (Pflicht für Forge):** Jede Stelle mit `innerHTML`, `outerHTML` oder `insertAdjacentHTML`, die von `__agEreignis`, `__agLauf` oder `__agOriginal.archiv` aus erreichbar ist, kommt in die Liste:
- Zeile, Eingangsfeld, Fix, zugehöriger TC-XSS-01-Fall
- ausdrücklich auch `tunZeigen`, `motorenZeigen`, `stoppZeigen`, `wirf`, `arbeitAn` und `liveHinweis`

**I-2 Wahrheitsinventar (Pflicht für Forge):** Jede im Live-Modus sichtbare Aussage mit Quelle und Regel:

| Element | Quelle | Regel |
|---|---|---|
| Kopf Projekt/Titel | `__agLauf` mit festen Strings `{project_id:'agentarium', titel:<run_id>, ablage:'BALL Live · Relay'}` | Text, escaped |
| `data-strom`, `agStromWort`, Hinweis „keine Verbindung“ | `__agStrom` | §6.5 |
| `#agLiveStand` (neu, `live.js`) | Adapter, Lauf, `quellstatus`, Fassung | §3.3, §9 |
| Namensschild `data-akt` | `live.js` | §3.3 |
| Zeile und Meldung | Ereignis | Fakt + Vertrauensart |
| Arbeitsring | `handoff` empfangen | „Auftrag offen“, nie „arbeitet“ |
| Bereitschaftspuls | — | aus |
| Stopper | `stop` | „Stop: <Titel>“ |
| Kostenzeile | — | nur der Pflichtsatz |
| Uhr | `Date` | Ortszeit |
| sonstige Texte | Forge listet sie | Widerspruch zu §3.3 → FAIL |

**Verboten:**
- Änderungen an Schema und Reducer V2.1
- Änderungen an anderen `feld/`-Assets und an `forge_live_thinking_once.py`
- Merge, Pages
- Webhook oder Secrets vor D-P1

**Erlaubte Pfade zusätzlich:**
- `feld/live.js`
- `relay/ball-live/**` (Kern anbieterneutral, dünne Anbieterbindung, Abgleich, Tests)
- `relay/ball_live_claude_stream.py`
- `.github/workflows/ball-live-claude.yml` und `ball-live-export.yml` (erst nach D-P1)
- `specifications/AG-BALL-LIVE-001-profil-v1.md` und `…-schemas/{ingest-v1,bilanz-v1,quellstatus-v1}.schema.json`
- `tests/AG-BALL-LIVE-001-*`

**Baseline-Prüfung:** Der Branch zweigt von `d111b062` ab, oder `feld/index.html` und `feld/sw.js` stimmen byteweise damit überein. Der Hash kommt in den Handback; eine Abweichung ist ein Stopp.

---

## 8. Messung und Nachweis

### 8.1 Messpunkte
| Punkt | Definition | Uhr | Auflösung | Erhebung |
|---|---|---|---|---|
| M0 | tatsächliche Laufzeitaktivität | — | — | **unbekannt**, wird nicht behauptet |
| M1 | `occurred_at` (§4.3) | Runner bzw. GitHub | ms bzw. s | Journal |
| M2 | `recorded_at` | Relay | ms | Journal |
| M3 | Empfang des SSE-Chunks im Adapter | Gerät (`Date.now()`) | ms | Diagnose |
| M4 | Rückkehr von `__agEreignis` mit angenommen | Gerät | ms | Diagnose |
| M5′ | nach dem 2. `requestAnimationFrame` hinter M4; **nur Proxy** | Gerät | ms | Diagnose `m5p` |
| M5 | erster Videoframe mit vollständig lesbarer Zeile | Original-Uhr im Frame | 1 s + 1/fps | iPad-Bildschirmaufnahme |

**Uhrversatz Relay–Gerät:**
- Für jedes Lebenszeichen i ist dᵢ = `sent_at`ᵢ(Relay) − M3ᵢ(Gerät).
- Schätzwert: θ̂ = max(dᵢ) über die letzten 20.
- Der wahre Versatz liegt in [θ̂ ; θ̂ + RTT_min]. RTT_min ist die kleinste gemessene Laufzeit einer `resume`-Anfrage.
- Strecken über zwei Uhren (M1→M2, M2→M3) werden mit dieser Spanne berichtet.

**Weitere Annahme:** Der Versatz Runner/GitHub ↔ Relay ist ≤ 2 s (alle per NTP). Geprüft wird das über `recorded_at − occurred_at ≥ −2 s` für alle Ereignisse. Ein Verstoß macht die Probe INCONCLUSIVE.

### 8.2 „Noch laufend“ bei M5
- **Obergrenze:** `M5_oben = U_f + 1 s + θ̂ + RTT_min` in Relay-Zeit. U_f ist die Uhrangabe im ersten Frame f.
- **Konsistenzprüfung:** `m5p ∈ [U_{f−1} ; U_f + 1 s)`. Andernfalls INCONCLUSIVE.
- **Claude:** `M5_oben(P) + 5 s < process_exited_at` aus `execution.state beendet`. Gegenprobe: Die Zeile `BALL exec end` im Actions-Log liegt ≤ 2 s daneben. Der Jobstatus allein beweist **nichts**.
- **Work:**
  - Nach P_W führt Atlas eine echte Auftragsaktion A aus, ohne eigenes Datum. Beispiel: ein Commit des E2E-Protokolls über den Connector.
  - `t_A` ist der Push-Zeitstempel aus `GET /repos/{o}/{r}/activity`. Fallback, wenn die API nicht verfügbar ist: `committer.date` mit Kennzeichnung. Forge oder Scout bestätigt die Verfügbarkeit.
  - Bedingung: `t_A ≥ M5_oben(P_W) + 5 s`.
  - Danach Q_W mit Titel „… <sha7>“.
  - **Grenze:** Dass Atlas’ Turn zwischen P_W und Q_W ununterbrochen lief, ist eine Selbstauskunft. Sie ist als `reported_checkpoint` gekennzeichnet und durch D-P2 gedeckt.
  - Für ein **Kind** reicht im MVP der Transportnachweis (TC-ID-03). Den Nachweis, dass das Kind noch läuft, kann die Plattform nicht unabhängig liefern; das steht als Grenze im Bericht.
- **Abstand < 5 s** oder eine gescheiterte Konsistenzprüfung: INCONCLUSIVE, einmal wiederholen. Ist es danach wieder so: BLOCKED, Rückgabe an Atlas.

### 8.3 Pixel-Orakel
- Die Bildschirmaufnahme am iPad wird mit SHA-256 gesichert.
- Im Frame f müssen sichtbar sein: der Akteur, `progress`, die Vertrauensart, der eindeutige Titel („Schritt n“ bzw. der Work-Titel) und die Uhr.
- Zu protokollieren: Frame-Index, fps, U_f, U_{f−1}.
- Auf Ebene B: Screenshot nach 2× rAF, Sentinel prüft inhaltlich, Hash.

---

## 9. Webhook-Abgleich (genau ein Mechanismus)

### 9.1 Ablauf
- **Recht:** Lesezugriff auf Issues im Live-Repository, nur dieses Repo (fine-grained Token oder App). Das Token liegt nur beim Relay.
- **Takt:**
  - 60 s, solange ein Lauf `aktiv` ist oder seit < 6 h Ereignisse hatte;
  - zusätzlich einmal beim Start des Relays;
  - sonst ruht der Abgleich.
- **Abruf:** `GET /repos/{o}/{r}/issues/{n}/comments?since=<abgedeckt_bis − 10 s>&per_page=100`, höchstens 5 Seiten je Durchgang, Rückblick höchstens 24 h.
- **Verarbeitung:** Jeder Kommentar mit Marker läuft durch dieselbe Validierung wie ein Webhook (Login-Allowlist, Block).
  - Dedupe über `gh-<comment.id>`, Hash über das JCS des Blocks.
  - Neu → Append mit `delivery: abgleich`.
  - `updated_at > created_at` und noch nicht im Journal → Ablehnung `bearbeitet_vor_abgleich`, Eintrag in die Lückenliste.
- **Cursor:** `abgedeckt_bis` = Beginn des letzten vollständig erfolgreichen Durchgangs.
- **Ack an GitHub:** nur nach dem Append (FR-1.8). Eine gescheiterte Zustellung behebt ausschließlich der Abgleich. Browser-Polling bleibt verboten.

### 9.2 Signal `quellstatus` (Schema `agentarium.ball.quellstatus.v1`)
`{"schema":"agentarium.ball.quellstatus.v1","producer":"github-webhook","zustand":"ok|gestoert|luecke_unbehebbar","abgedeckt_bis":"…","seit":"…|null","wiederhergestellt":0,"sent_at":"…"}`

| Zustand | Bedingung |
|---|---|
| `ok` | `now − abgedeckt_bis ≤ 5 min` |
| `gestoert` | `now − abgedeckt_bis > 5 min` |
| `luecke_unbehebbar` | Das ungedeckte Intervall ist älter als 24 h. Endgültig; Eintrag `work_abgleich_luecke` in der Bilanz und in `luecken`. |

Ein reiner V2.1-Client ignoriert das unbekannte SSE-Event. Der Adapter zeigt es in `#agLiveStand`.

### 9.3 Diagnose
Je Zustellung im Journal: `delivery_id`, `delivery`, Ablehnungsgrund.

### 9.4 Health
`{schema:"agentarium.ball.health.v1"}` mit:
- je Producer: `letzter_ingest`
- Abgleich: `{zustand, abgedeckt_bis, letzter_durchgang, letzter_fehlercode}`
- Journalkopf je aktivem Lauf
- Ablehnungen der letzten 24 h je Grund
- Exportstatus

Keine Titel. In (b) nur mit Token.

---

## 10. Datenschutz: zwei durchgängige Varianten

| Strecke | (a) öffentliche kooperative Metadaten | (b) durchgängig privat |
|---|---|---|
| Work-Quelle | Live-Issue in `pahlborn/agentarium` (öffentlich) | Issue im **privaten** Repository `pahlborn/agentarium-ball-inbox` |
| Relay-Lesen | öffentlich, CORS exakt | Bearer-Lesetoken je Gerät |
| Health / Diagnose | öffentlich ohne Titel / Gerät | nur mit Token / Gerät |
| Claude-Actions-Log (öffentliches Repo) | nur `id, kind, HTTP, seq` | gleich; Claude-Titel sind feste Vorlagen ohne Inhalt |
| Export | Branch `agent/ball-live-archive` (öffentlich) | **nur** privates Inbox-Repository |
| Grenze | Ein Kommentar ist öffentlich, **bevor** ein Filter greift. Ein dort geleaktes Secret ist ein Vorfall an der Quelle: Kommentar löschen, Secret rotieren. | Ein Leak bleibt im privaten Repository. |

---

## 11. Fixture-Modell
- **Getrennte Instanz** mit `BALL_PROFIL=fixture`: eigener Speicher, eigene Schlüssel, `project_id = agentarium-fixture`. Sie nimmt **nur** `fictional:true` an.
- **Die Produktivinstanz** lehnt `agentarium-fixture` und `fictional:true` ab. Wird eine Fixture-Instanz unter dem Produktiv-Host erreichbar, ist das ein Stopp.
- **Fehlerinjektion** nur auf der Fixture-Instanz:
  - `FAULT=append_fail_once`
  - `FAULT=drop_response_after_append_once`
  - `FAULT=heartbeat_stop_after:<seq>`
  - `FAULT=delay_old_generation_ms:<n>`
  - `FAULT=sequence_script:<liste>`
  - ein simulierter GitHub-API-Server für den Abgleich
- **Browser (Ebene B):** lokaler Server auf 127.0.0.1 und `window.__AG_LIVE_BASIS` (FR-5.2). `window.__AG_LIVE_TESTUHR` (feste Uhr) gilt nur dort.
- **Webhook lokal:** signierte Nutzlast erneut posten, mit neuer `X-GitHub-Delivery`. Echtes „Redeliver“ gibt es nur auf Ebene H.
- **Canary für Secrets:** `ghp_CANARY0000000000000000000000000000000`. Er trifft das Muster, ist aber kein Geheimnis.

---

## 12. Testfälle
**Ebenen:**
- U: Unit
- I: Relay lokal
- B: gerendertes Original lokal (Chromium mit WebGL)
- H: gehostet
- D: echtes iPad (Peter bedient, Sentinel protokolliert)

**Regel:** Je Negativtest genau eine Verletzung.

| TC | Ebene | Ablauf → Orakel |
|---|---|---|
| WIRE-01 | U | Alle Beispiele aus §4.5, §6.1 und §9.2 gegen V2.1, `ingest-v1` und `quellstatus-v1` validieren → 0 Fehler |
| ID-01 | I | Claude-`id` passt nicht zu `agent_id` → 422 `id_inkonsistent`; passende → 201 |
| ID-02 | I | Work-Block mit `id` → 422; ohne `id` → `gh-<comment.id>` |
| ID-03 | I, B | `agent_path` `atlas/sentinel#1` → `agent_id` `work:atlas/sentinel#1`, Anzeige „über Atlas“; `actor` atlas mit diesem Pfad → 422 `actor_pfad_widerspruch` |
| LC-01 | I | Claude-Lifecycle → 403. Öffnen → seq 1. Gleicher Kommentar erneut → dup. Neues `aktiv` → 409. Schließen → angenommen. Danach `work.event` → 409 `lauf_beendet`. Weiteres Terminal → 409 |
| LC-02 | I | Claude `contribution` + `execution.state beendet` → Snapshot `lauf.zustand` = `aktiv` |
| LC-03 | I | Reiner Work-Lauf: öffnen, 2× `progress`, schließen → Manifest gültig, `quellen` = [`github-webhook`] |
| LC-04 | I | Zwei Ausführungen, eine überlappend → beide terminal, Lauf aktiv. Schließen mit einer offenen Ausführung → `offene_ausfuehrung` in `luecken` |
| AUTH-01 | I, H | Einzelfälle: falsche HMAC; ts −301 und +301 (abgelehnt), −299 (angenommen); unbekannter Producer; falsche Webhook-Signatur; fremdes Repository, Issue oder Login; `edited` → 202 ohne Wirkung; anderes Event → 202; `OPTIONS` auf Schreibpfad → 405 ohne ACAO |
| VAL-01 | I | Einzelfälle aus §4.4: Art, actor, recipient, fictional, 141/140 Codepunkte, Steuerzeichen, `<`, Canary, 8193 Byte → 413, Zusatzfeld, `source_evidence` im Block |
| LOG-01 | I | Nach VAL-01: grep nach Canary und `<img` in Logs, Journal, Ablehnungsprotokoll, Health und Export → 0 |
| DUP-01 | I | 3× derselbe Umschlag → 201 / 200 dup / 200 dup; gleiche ID mit anderem Inhalt → 409; Journal +1 |
| DUP-02 | I, H | I: Webhook-Wiederholung mit neuer Delivery-ID → dup. H: GitHub-„Redeliver“ → dup |
| SEQ-01 | I | 2×20 parallel → 1..40; Neustart; `after=0` → 40 Einträge |
| STO-01 / 02 | I | `append_fail_once` → 503, Journal unverändert, Wiederholung 201. `drop_response…` → Wiederholung 200 dup, gleiche seq |
| SPO-01 | I | Wrapper gegen Fixture-Relay: 20 s aus → Zustellung danach, keine Duplikate, das Lesen läuft weiter (Zeilenzähler steigt). 60 s aus → IDs in `nicht_zugestellt` und `luecken` |
| RL-01 | I | 61. Ingest innerhalb von 60 s → 429 mit `Retry-After`; 31. Leseaufbau → 429 |
| WH-01 | I, H | Relay aus, Kommentar erstellen, Relay an → ≤ 120 s journalisiert mit `delivery: abgleich`; im Viewer als nachgeholt |
| WH-02 | I | Simulierte API liefert 5 min lang 500 → `quellstatus gestoert`; Text in `#agLiveStand` erscheint innerhalb eines Lebenszeichens; nach Erholung `ok` |
| WH-03 | I | Kommentar vor dem Abgleich bearbeitet → `bearbeitet_vor_abgleich` und Lückeneintrag |
| WH-04 | I | 24 h nicht abgedeckt (feste Uhr) → `luecke_unbehebbar` und `luecken`-Eintrag |
| HB-01 | I, B | Erstes Lebenszeichen ≤ 1 s, alle Abstände ≤ 6 s über 60 s, `last_sequence` = Kopf |
| HB-02 | B | Lebenszeichen enden nach seq X → `alt` bei t ∈ (20,0 ; 21,5] s; kein Agent wird `beendet`; Zusatz „letzter bekannter Stand“ |
| CUR-01 | I | `resume` und `events` für jede Zeile aus §6.2, auch für den leeren Strom |
| CUR-02 | B | `cursor_zu_hoch` → angehalten, sichtbarer Text, `liveListe` unverändert |
| CUR-03 | I | Snapshot ohne Laufmeldung → `lauf: null`; mit Laufmeldung → gültiger `laufstand` |
| ORD-03 | B | Skript: zuerst 1..103 (angewendet), dann 104, 106, 106, 105 → Reihenfolge 104, 105, 106; `duplikat` 1; Cursor 106; `liveListe` +3 |
| GEN-01 | B | Alte Generation liefert verzögert → verworfen, `verworfen_generation` ≥ 1, keine Anwendung |
| STOR-01 | B | Storage-Zugriff wirft → (a) volle Funktion; (b) Hinweis „Token nicht speicherbar“ |
| REJ-01 | B | Ereignis mit unbekanntem actor im Strom → `abgewiesen` +1, Cursor rückt vor, keine Zeile; das Folgeereignis wird angewendet |
| CORS-01 | H | (a) ACAO exakt; fremde Origin ohne ACAO; kein Preflight. (b) ohne Token 401, mit Token 200, Preflight korrekt, widerrufenes Token → 401 und „Lesezugang abgelehnt“ |
| XSS-01 | B | Für jede Senke aus I-1 die Eingaben `<img src=x onerror="window.__xss=1">` und `"><svg onload="window.__xss=1">` → kein neues `img`/`svg`, `__xss` undefined, Text wörtlich sichtbar |
| SEC-03 | U | grep über `feld/**` nach Schlüsseln und Tokens → 0; Harness-env-Dump ohne Secrets; (b) Token nie in der URL |
| PRIV-01 | H | (b) Kein Archivartefakt im öffentlichen Repository; Actions-Log ohne Work-Titel |
| TRU-01 | B | Feste Uhr; Zeitlinie mit je einem Fall A1–A6 und R0–R2 → erwartetes `data-akt` und Text |
| TRU-02 | B | Live-Modus: kein sichtbarer Text enthält „bereit“, „idle“ oder „arbeitet“; Bereitschaftspuls fehlt; alle I-2-Zeilen erfüllt |
| TRU-03 | B | Lauf terminal → aktiver Agent wechselt auf A4; im Nachholen `progress` seq 9 nach `contribution` seq 10 geordnet → A2 |
| SEM-01 / 02 | B | `progress` ohne Nebenwirkung, auch ohne `recipient`. `handoff` atlas→forge (T) und dann `contribution` forge→atlas (T) → Auftragsring geschlossen |
| ACT-01 | B | Je ein Fall:<br>• ohne `run` → „kein Lauf gewählt“<br>• `live` und `mvp` → beide aus<br>• ungültige `run` → Text<br>• Fassung 47 mit Adapter 48 → „Fassung passt nicht“<br>• `__agOriginal` fehlt → „Original nicht bereit“<br>In jedem Fall 0 Netzanfragen |
| LONG-01 | H | 30 min Verbindung: Rotationen nach 10 min, Reconnect mit `after`, keine Duplikate, keine Lücke |
| REC-01 | D | 45 s Flugmodus während eines aktiven Laufs → sofort „getrennt“, `alt` nach > 20 s; nach der Rückkehr gilt Menge(nachgeholt im Fenster) = Menge der Journal-seq mit `recorded_at` im Fenster; keine Duplikate, kein Reload; < 3 → INCONCLUSIVE |
| REC-02 | H | Relay-Neustart bei offenem Viewer → Reconnect, keine Doppelwirkung |
| DEV-03 | D | 2 min Hintergrund und 2 min Sperre → vollständig nachgeholt, markiert |
| CON-01 | H, D | Claude- und Work-`progress` im selben 5-s-Fenster in R, parallel Ereignisse in R2 → Viewer R in seq-Ordnung, nichts aus R2 |
| ARC-01 | I, H | Zwei Projektionen byte-gleich; Validator grün; IDs und Reihenfolge = `work.event` im Journal; Bilanz stimmig; `ohne_angabe` und `luecken` korrekt |
| ARC-02 | B, D | Manifest mit IDs [a, b, c] → genau diese abgespielt, in dieser Reihenfolge; Endzustand: Auftragsringe gemäß Ereignissen; Kopf „Archiv“; nie `lebt`; paralleler Live-Tab unverändert |
| ARC-03 | B | Relay liefert 410 → Hinweis nach FR-6.4, keine Wiedergabe |
| REG-01 | B | Demo, Archiv-Stücke und `?mvp=1`: Folgen von `__agStand()` nach festen `__agSchritt(dt)`-Schritten gleich wie d111; Screenshot-Unterschied nur bei Fassung |
| OPS-01 | H | Ingest, danach `health` → Zeiten und Kopf aktuell, keine Titel |
| VER-01 | D | Vor der Probe: „Fassung 48“ sichtbar, Adapter ohne Fehler; ein eventueller Reload liegt **vor** der Probe |
| E2E-01 | D | Claude, AC-2.1 nach §8.2. Belege: Actions-Log, `execution.state`, Journal, Diagnose, Video |
| E2E-02 | D | Work, AC-3.1. Belege: Kommentar-URLs, Delivery-IDs, Activity-API `t_A`, Journal, Video |
| PIX-01 | D, B | §8.3 |
| LAT-01 | D | Je Ereignis M1, M2, M3, M4, M5′ und M5 mit Spannen (§8.1). Bestanden heißt vollständig erhoben |
| EXP-01 | D | Auswertung von H-E1: Stichprobe aus §2.2; Kalibrierung M5′ gegen M5 an ≥ 3 je Anbieter; Peters Urteil wird erfasst; Ergebnis Weiter/Ändern/Stopp |

---

## 13. Traceability-Matrix
| Anforderung | AC | TC |
|---|---|---|
| FR-1.1–1.3 | 1.1 | AUTH-01, CORS-01 |
| FR-1.4–1.5 | 1.2 | VAL-01, ID-01/02/03, WIRE-01 |
| FR-1.6 | 1.3 | DUP-01/02 |
| FR-1.7–1.8 | 1.4 | SEQ-01, STO-01/02 |
| FR-1.9 | — | RL-01 |
| FR-1.10 | 1.7 | LOG-01 |
| FR-1.13 | 1.5, 1.6 | LC-01…04 |
| FR-2.1–2.3 | 2.1 | E2E-01, PIX-01 |
| FR-2.4 | 2.2 | SEC-03 |
| FR-2.5–2.6 | 2.3 | SPO-01, LC-04 |
| FR-3.1–3.5 | 3.1, 3.2 | E2E-02, ID-02/03, VAL-01 |
| FR-3.6–3.9 | 3.3, 3.4 | WH-01…04, OPS-01 |
| FR-4.1–4.4 | 4.1–4.4 | CUR-01/03, HB-01, LONG-01, REC-02, WIRE-01 |
| FR-5.1, 5.10 | 5.7 | ACT-01, VER-01 |
| FR-5.2–5.4 | 5.5, 5.6 | ORD-03, GEN-01, STOR-01, REJ-01, CUR-02, REC-01, DEV-03 |
| FR-5.5, 5.7, 5.11 | 5.3, 5.8 | HB-02, TRU-01…03 |
| FR-5.6 | 5.2, 5.4 | SEM-01/02, XSS-01, REG-01 |
| FR-5.8–5.9 | 5.1 | LAT-01, REC-01 |
| FR-6.1–6.5 | 6.1–6.4 | ARC-01…03, PRIV-01 |
| NFR-1…8 | — | SEC-03, LOG-01, CORS-01, LAT-01/EXP-01, OPS-01, REG-01, DEV-03, REJ-01 |
| H-E1 | AC-E1 | EXP-01 |

---

## 14. Stop- und Blocked-Regeln
- **Baseline** nicht d111 → Stopp (Forge).
- **E1 negativ** (kein `runtime_stream`/Hook-Ereignis vor Prozessende) → ST2 BLOCKED. Ein `host_observed` ist dafür kein Ersatz.
- **E2 negativ** (Atlas kann mitten im Auftrag nicht posten und danach weiterarbeiten) → ST3 BLOCKED, Varianten B/C an Peter.
- **E3 negativ** (fetch-Streaming über CORS in iPad-Safari geht nicht) → Stopp. Kein Polling als Ersatz.
- **Unklare Bestätigung:** ein Ack ohne dauerhaften Eintrag, Sequenzlücken oder Doppel, `cursor_zu_hoch` im Betrieb → FAIL und Stopp.
- **Schreibpfad ohne Auth** oder eine Fixture-Instanz unter dem Produktiv-Host → Stopp. Atlas veranlasst die Rücknahme durch den Betreiber oder Forge. **Sentinel meldet nur und hat kein Rollback-Recht.**
- **Erfundener Zustand** (ein Verstoß gegen §3.3 oder I-2) → FAIL.
- **Rohinhalt oder Canary** in Logs oder Export → FAIL; der Pfad wird gesperrt.
- **Anbieterfehler** (Kontingent, Guthaben, Schlüssel) → Stopp, Belege sichern, kein automatischer Neuversuch.
- **Material-Änderung** außerhalb von §7 oder neue Infrastruktur → zurück an Atlas und Peter.
- **INCONCLUSIVE** (§8.2, REC-01) → eine Wiederholung. Ist es danach wieder INCONCLUSIVE: BLOCKED.

---

## 15. Reihenfolge und was vor der Hosting-Freigabe geht
**Lokal sofort möglich, ohne D-P1** (Kosten nur für LLM- und CI-Läufe, die Atlas freigibt):
1. F0 Baseline-Prüfung
2. Relay-Kern mit Fixture-Instanz und den Tests U/I: WIRE, ID, LC, AUTH, VAL, LOG, DUP-lokal, SEQ, STO, RL, WH-01…04 gegen die simulierte API, CUR, HB, ARC-01
3. `live.js` und das Original-Delta mit den Tests B: ORD-03, GEN, STOR, REJ, XSS, TRU, SEM, ACT, CUR-02, HB-02, ARC-02/03, REG
4. Wrapper gegen ein lokales Echo mit SPO-01. Das Experiment **E1** ist ein Claude-Lauf in Actions mit lokalem bzw. Harness-Echo und braucht nur Atlas’ Laufkosten-Freigabe.
5. **E2** braucht kein Relay: zwei Kommentare und eine Aktion A im Turn, Zeiten aus der GitHub-API.

**Erst nach D-P1:** Deployment, Webhook, Secrets, Abgleich-Token, E3 (iPad gegen das gehostete Relay, als Harness auf einer Vorschau-Seite), alle H-Tests.

**Erst nach der Release-Freigabe von Fassung 48:** D-Tests mit Peter am iPad, danach Argus-Ergebnisreview.

---

## 16. Entscheidungsbrief für Peter
Nur diese Punkte brauchen Peter. Alles Technische (HMAC, Felder, Schemas, Fenster) legt das Team fest.

| # | Entscheidung | Empfehlung des Teams | Ohne Entscheidung |
|---|---|---|---|
| **D-P1** | Gehosteter Pilot über 30 Tage | **Edge-Worker mit dauerhaftem Objekt** (Kandidat Cloudflare Workers + Durable Objects, EU-Jurisdiktion). Konto: Peter. Betrieb: Atlas, Deployment: Forge. Aufbewahrung: Journal 30 Tage, Manifest 180 Tage beim Relay, Export dauerhaft. Harte Obergrenze für Hosting: **≤ 10 EUR/Monat**. Danach Abschalten und Löschen, sofern nicht verlängert. Das umfasst die nötigen Secrets, den Webhook, das Lese-Token für den Abgleich und die zwei Workflows. Preis und EU-Option prüft Scout vor der Freigabe; **ich habe keinen Preis verifiziert.** Alternative: kleiner Container mit SQLite-Volume in der EU. | nur die lokalen Stufen aus §15 |
| **D-P2** | Sichtbarkeit: (a) öffentliche kooperative Metadaten oder (b) durchgängig privat (§10) | **(a)** für den Pilot. Nur Metadaten auf Aufgabenebene; das Repository und alle Handoffs sind ohnehin öffentlich; kein Token auf dem iPad. **(b)**, wenn Aufgabentitel nicht öffentlich werden dürfen. Beides schließt ein, dass Work-Checkpoints als gekennzeichnete Selbstauskunft gelten. | Work-Hälfte BLOCKED |
| **D-P3** | Erlebnishypothese H-E1 (§2.2) | Schwellen wie vorgeschlagen | Es wird nur der Funktionsnachweis berichtet, ohne Erlebnisurteil |
| **D-P4** (später) | Release von Fassung 48 auf Pages `feld/` | erst nach den Komponentennachweisen | keine D-Tests |

**Info statt Entscheidung:** das iPad-Modell und die iPadOS-Version am Testtag.

---

## 17. Offen, Dissens, Grenzen
1. **Unbewiesen**, wird durch Experimente geklärt: E1, E2, E3; die Activity-API für `t_A`; `wirf()` ohne Empfänger; Inhalt von I-1 und I-2 in den nicht gelesenen Funktionen; Preis und EU-Option des Pilot-Hostings.
2. **Dissens zu Forge bleibt erhalten:** Forge hielt A0-Polling für den kleinsten Beweis. Die Spezifikation folgt der verbindlichen Korrektur: Polling im Browser ist kein Weg. Der serverseitige Abgleich (§9) ist kein Browser-Polling.
3. **Dissens zu V2, offen gelegt:** `occurred_at` für Work ist jetzt die GitHub-Erstellzeit und nicht mehr die Angabe des Agenten. Begründung: ein überprüfbarer Zeitanker; dadurch ist die `zeitachse` immer `complete`.
4. **Die Schwelle für „veraltet“** bleibt bei 20 s laut Vertrag.
5. **Ausstehend:** Nova (Texte der Anzeige, besonders „Auftrag offen“ und „gestoppt“), Sentinel (Delta-Testbarkeit), Argus (Delta-Review). Ich habe keine dieser Rückmeldungen erhalten.

**Nächster Schritt (Atlas):**
- diese Fassung als `specifications/AG-BALL-LIVE-001-mvp-spezifikation-v3.md` ablegen; ich habe keine Schreibrechte;
- das Delta-Review bei Argus und Sentinel nur für die betroffenen Kriterien beauftragen;
- Scout die Preis- und EU-Prüfung für D-P1 geben;
- Peter den Brief aus §16 vorlegen;
- Forge die lokalen Stufen aus §15 freigeben, sobald Atlas entscheidet.

**Tests:** NOT_RUN. **Implementiert:** nichts.