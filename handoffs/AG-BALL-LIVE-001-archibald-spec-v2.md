## AG-BALL-LIVE-001-ARCHIBALD-SPEC-V2 — RESULT_READY / STOPPED
```json
{
  "task_id": "AG-BALL-LIVE-001-ARCHIBALD-SPEC-V2",
  "request_commit": "c442412d00a3451788f4becc6bff18f161a822d2",
  "definition_blob": "ee21df45884c9f4fef3d493fca739e0e87c3cb55",
  "run": "https://github.com/pahlborn/agentarium/actions/runs/39014691783",
  "cli_version": "2.1.302 (Claude Code)",
  "requested_model": "opus",
  "requested_effort": "high",
  "actual_reasoning": "unconfirmed",
  "session_id": "1f8362e2-e474-480f-958e-9bd9091f1b02",
  "modelUsage": {
    "claude-opus-5-5": {
      "inputTokens": 18,
      "outputTokens": 47628,
      "cacheReadInputTokens": 421437,
      "cacheCreationInputTokens": 129952,
      "webSearchRequests": 0,
      "costUSD": 1.6866794,
      "contextWindow": 1000000,
      "maxOutputTokens": 128000,
      "thinkingTokens": 20489,
      "canonicalModel": "claude-opus-5-5",
      "provider": "firstParty",
      "costBasis": "list"
    }
  },
  "usage": {
    "input_tokens": 18,
    "cache_creation_input_tokens": 129952,
    "cache_read_input_tokens": 421437,
    "output_tokens": 47628,
    "output_tokens_details": {
      "thinking_tokens": 20489
    },
    "server_tool_use": {
      "web_search_requests": 0,
      "web_fetch_requests": 0
    },
    "service_tier": "standard",
    "cache_creation": {
      "ephemeral_1h_input_tokens": 0,
      "ephemeral_5m_input_tokens": 129952
    },
    "inference_geo": "global",
    "iterations": [
      {
        "input_tokens": 2,
        "output_tokens": 27665,
        "cache_read_input_tokens": 110186,
        "cache_creation_input_tokens": 19766,
        "cache_creation": {
          "ephemeral_5m_input_tokens": 19766,
          "ephemeral_1h_input_tokens": 0
        },
        "type": "message"
      }
    ],
    "speed": "standard",
    "fallback_credit": null
  },
  "num_turns": 28,
  "total_cost_usd": 1.6866794,
  "execution": {
    "kind": "SUCCESS",
    "detail": "SUCCESS",
    "returncode": 0,
    "elapsed_seconds": 483.646,
    "timeout_seconds": 1800,
    "stdout_bytes": 48826,
    "stderr_bytes": 0,
    "stdout_sha256": "1f2b0e9bd5014887c0551e8d27fd42d1186181f60bbaef8d47807e644984baae",
    "stderr_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "signals": []
  },
  "failure": null,
  "changed_paths": [],
  "unexpected_product_changes": [],
  "tests_run": false,
  "product_published": false
}
```
# SA_READY: AG-BALL-LIVE-001-ARCHIBALD-SPEC-V2

**Rolle:** Archibald / spec-agent. Nur gelesen. Keine Datei geändert, nichts veröffentlicht, nichts ausgeführt.
**Modell:** angefordert opus/high, tatsächlich unbestätigt.
**Ergebnis:** Spezifikation V2.0 liegt unten vor, einschließlich der ersten Testfälle. SA_READY heißt nur, dass das Dokument fertig ist. Es ist keine Abnahme durch Peter, keine Bauerlaubnis, kein QA-Bestehen und kein Release.

---

## 0. Ausgangslage und Grenzen der Quellen

| Baseline | Commit | Wofür sie gilt |
|---|---|---|
| Produkt (Original, Fassung 47) | `d111b062770e32dbef0f9bb618a4923d88ff20be` | **Einzige Basis für die Implementierung** von `feld/index.html` und `feld/sw.js` |
| Vertrag V2.1.2 und Referenz-Reducer | `da860fd19f38e9938ed201546f2a6e5b4cc765f8` | Nur als Referenz. Schema und Reducer werden **nicht** geändert |
| Lokaler Adapter | `800874ee1c6fd2ed3a806ba7774a19c2e11f3878` | Nur als Musterquelle (`activity-input.js`). Die Datei wird nicht unverändert ausgeliefert |
| Konzeptentwurf | `2b9e93e7c52807f54ed83b8d898265737ad59145` | Charter, Machbarkeitsstudie, Forge-ADR |

**Gelesen:**
- AGENTS.md, Rulebook 1.2, Prozess 1.2, Produktpraxis v1
- Charter, Team-Input, Machbarkeitsstudie, Forge-Handback
- AG-PILOT-001: Implementierungs-Handoff und Sentinel-QA
- Schnittstellenpapier V2.1.2 und `vertrag-v2-1.schema.json`, beide vollständig
- Reducer, Zeilen 1–160 (Regeln R1–R13)
- `activity-input.js` und `sw.js`, beide vollständig
- `feld/index.html` (d111), nur diese Abschnitte: Z. 2195–2294, 4355–4414, 4665–4829, 4855–4879, 4930–5189, 5560–5930

**Lücken:**
- `.claude/agent-protocol/spec-agent-output.md` **gibt es nicht** am Arbeitsort. Die Gliederung unten ist deshalb meine eigene, nicht die Vorlage.
- `feld/index.html` habe ich nicht vollständig gelesen. Ungeprüft sind vor allem `wirf()`, `kopfSetzen()`, `stopperAn()`/Stoppschild, `tunZeigen()` und `motorenZeigen()`. Was davon abhängt, ist unten als Pflicht für Forge oder als Testfall formuliert, nicht als Tatsache.

**Selbst im Code geprüfte Befunde (d111):**
- **B1:** `ARTEN` kennt 17 Arten (Z. 2209). Jede Art mit Gestalt `wurf` oder `sonne` ruft `auftragFertig` auf (Z. 4364–4365). `question` und `open_state` setzen einen Stopper (Z. 4381–4382). Eine Art ohne Nebenwirkung fehlt. Das bestätigt Forge F1.
- **B2:** `__agEreignis` (Z. 5040–5103) dedupliziert nicht. Es setzt `t: zeit` beim Eintreffen und reicht weder `task_id`, `source_evidence`, `platform` noch `recorded_at` weiter. Fehlt `id`, erfindet es `'L'+n`. Das bestätigt Forge F2.
- **B3:** Freier Text landet ohne Escaping in `innerHTML`:
  - `stromZeile`: `E.text`, `E.kommando`, `E.modell` (Z. 4680–4688)
  - `melden`: `text` (Z. 4868–4870)

  Das bestätigt Forge F3 und erweitert es um `E.modell`/`E.kommando`.
- **B4:** `__agStrom` trennt Verbindung und Lebenszeichen sauber (5 s Takt, 20 s „alt“, Z. 4967–4986). Das Feld erzeugt selbst kein Lebenszeichen.
- **B5:** Der Leser `?mvp=1` (Z. 5688–5756) ruft `modusSetzen('live')`, hält die Rückgaben der Hooks fest und zeigt sie mit `textContent`. Das ist das Muster für die Aktivierung.
- **B6:** `sw.js` v47 bedient Anfragen gleicher Herkunft zuerst aus dem Cache und erneuert im Hintergrund (stale-while-revalidate). Fremde Herkunft wird nicht angefasst (Z. 46). Folge: Nach einer Veröffentlichung kann die erste Seite noch die alte Fassung zeigen. Anfragen an das Relay laufen am Service Worker vorbei.
- **B7:** Das Vertragsfeld `arbeitsereignis.kind` ist freier Text. `progress` ist also **schon im Schema gültig**. Nur das Original muss es kennen. `arbeitsereignis` erlaubt keine Zusatzfelder (`additionalProperties: false`).

**Verbindliche Korrekturen aus dem Auftrag, übernommen:**
- Kein Browser-Polling, auch nicht Forges A0.
- Baseline ist d111, nicht die Fassung 46 im Konzeptbranch.
- Das gehostete Relay gehört ab Beginn zum Ziel.
- Work liefert einen gekennzeichneten Checkpoint über einen signierten `issue_comment`-Webhook.
- Verbindung, Laufzustand, Agentenaktivität und Fachfortschritt bleiben getrennt.

---

## 1. Epic EP-BL1: „BALL Live MVP: echter Zwischenstand zweier Anbieter im geöffneten Original“

**Ergebnis:** Peter öffnet vorab das versionierte ORIGINAL `https://pahlborn.github.io/agentarium/feld/` auf seinem iPad und lädt es danach nicht neu. Dann sieht er:
- je ein korreliertes, echtes `progress`-Ereignis eines **noch laufenden** Claude-Code-Laufs und eines **noch laufenden** ChatGPT-Work/Atlas-Laufs;
- mit sichtbarer Vertrauensart;
- über Relay → Journal → Lesestrom → Adapter → Feld.

Ein unterbrochener Viewer holt verpasste Ereignisse nach und wendet keines doppelt an. Derselbe Lauf lässt sich danach als gekennzeichnetes Archiv wiedergeben.

**Fehlschlag (zählt nicht als Bestehen):** nur ein Abschlussereignis, statische Datei, Fixture- oder Demo-Daten, Ersatzseite, manuelle Injektion, Browser-Polling, Reload während der Probe, Schweigen als „bereit“ angezeigt.

| Story | Inhalt |
|---|---|
| ST1 | Authentifizierter Eingang und dauerhaftes Journal (Relay) |
| ST2 | Claude-Code-Quelle aus dem kontrollierten Actions-Host |
| ST3 | ChatGPT-Work-Quelle als gekennzeichneter kooperativer Checkpoint |
| ST4 | Lesestrom mit Lebenszeichen, Wiederverbindung und Nachholen |
| ST5 | Original-Adapter und Wahrheitsanzeige (aktiv / veraltet / unbekannt / beendet) |
| ST6 | Archivexport und Wiedergabe als Archiv |

**Nicht im MVP:**
- lückenlose Telemetrie
- Rückkanal oder Befehle (`supported_actions: []` bleibt)
- automatisches Folgen über den Katalog
- Live-Garantie im Hintergrund oder bei gesperrtem iPad
- Kostenbeträge
- Prozentfortschritt
- Mehrmandantenbetrieb
- Remote-MCP (Variante B), SDK-Runtime (Variante C)

### 1.1 Wahrheitsmodell (gilt für alle Stories)

**Vier Achsen, die immer getrennt bleiben:**

| Achse | Quelle | Erlaubte Werte | Nie ableiten aus |
|---|---|---|---|
| Verbindung | Lebenszeichen und Fachereignisse des Stroms (`__agStrom`) | `keiner`, `lebt`, `alt` (> 20 s), dazu Adapterhinweis `getrennt · verbinde neu` | Agentenereignissen allein |
| Laufzustand | `run.state_changed` (Vertrag `laufzustand`) | `aktiv`, `abgeschlossen`, `fehlgeschlagen`, `abgebrochen`, `unbekannt` (kein Beleg) | Schweigen |
| Agentenaktivität | Ereignisse je Agent und Lauf | `aktiv (belegt)`, `blockiert`, `beendet`, `Stand unbekannt` | Lebenszeichen; Schweigen nie als `bereit` |
| Fachfortschritt | wird im MVP nicht angezeigt | – | Ereignisanzahl |

**Gültigkeit eines Aktivitätsbelegs je Vertrauensart** (Vorschlag; Atlas/Nova dürfen ihn ohne Peter justieren, weil das ein Produktdetail ist):
- `runtime_stream`, `runtime_hook`, `host_observed`: 60 s
- `reported_checkpoint`: 300 s

Danach wechselt der Agent auf „Stand unbekannt · letzter Beleg vor X“.

„Bereit/idle“ erscheint im MVP **nie**, weil keine MVP-Quelle Leerlauf bestätigt.

**Vertrauensarten** (Profilvokabular für `source_evidence`; Anzeigetext wörtlich):

| `source_evidence` | Erzeugt von | Anzeige |
|---|---|---|
| `runtime_stream` | Wrapper liest den Claude-Strom (`stream-json`) | „Claude Code · Laufzeitstrom“ |
| `runtime_hook` | Claude-Hook im Host (nur wenn E1 Hooks wählt) | „Claude Code · Hook“ |
| `host_observed` | Wrapper selbst (Start, Ergebnis, Fehler) | „Host beobachtet“ |
| `reported_checkpoint` | GitHub-Webhook-Eingang; das Relay **erzwingt** diesen Wert | „ChatGPT Work · selbst gemeldet (Checkpoint)“ |

Zusatzkennzeichen ohne `source_evidence`-Wert:
- „· nachgeholt“: Zustellung über das Nachholen, Ereignis älter als 15 s
- „Archiv · aufgezeichnet“: Wiedergabe

---

## 2. Stories, Anforderungen und Akzeptanzkriterien

### ST1: Authentifizierter Eingang und Journal

| ID | Anforderung |
|---|---|
| FR-1.1 | Zwei Schreibwege, sonst keiner: `POST /v1/ingest` (Producer `claude-actions`, HMAC) und `POST /v1/ingest/github` (Webhook-Signatur). Andere Methoden oder Pfade → 404/405. |
| FR-1.2 | HMAC-Prüfung: `X-Ball-Producer`, `X-Ball-Timestamp` (Unix-Sekunden), `X-Ball-Signature: sha256=hex(HMAC_SHA256(key, ts + "." + raw_body))`. Zeitfenster ±300 s. Vergleich in konstanter Zeit. Ein Schlüssel je Producer. |
| FR-1.3 | Webhook-Prüfung: `X-Hub-Signature-256` mit dem Webhook-Secret; `X-GitHub-Event == issue_comment`; `action == created`. `edited`/`deleted` → 202, wird protokolliert, ohne Wirkung. Repository, Issue-Nummer und Autor-Login müssen auf der jeweiligen Konfigurations-Allowlist stehen. Genau ein Block `<!-- ball-live:v1 -->` mit einem JSON-Codeblock. |
| FR-1.4 | Validierung gegen das Ingest-Schema v1 (§3.2) und das Profil:<br>• `project_id ∈ {agentarium}`<br>• `run_id` passt auf `^[A-Za-z0-9][A-Za-z0-9._-]{2,80}$`<br>• `kind` im freigegebenen Satz (§3.1), sonst 422 `kind_not_enabled`<br>• `actor` und `recipient` auf der Allowlist des Producers<br>• `fictional == false`<br>• `title`: 1–140 Zeichen, ohne Steuerzeichen und Zeilenumbrüche<br>• Body ≤ 8 KB<br>• grobe Secret-Muster (`ghp_`, `github_pat_`, `sk-`, `-----BEGIN`) → 422 `secret_suspected` |
| FR-1.5 | Actor-Allowlist je Producer:<br>• `claude-actions`: actor ∈ {forge, archibald, cadence}; `platform = claude-code`; `source_evidence` ∈ {runtime_stream, runtime_hook, host_observed}<br>• `github-webhook`: actor ∈ {atlas, nova, scout, argus, sentinel}; `platform = chatgpt-work`; das Relay **setzt** `source_evidence = reported_checkpoint`, ein abweichender Wert im Body → 422 |
| FR-1.6 | Event-ID:<br>• `claude-actions`: `id` muss auf `^cc-[0-9]+-[0-9]+-[0-9]+$` passen (gha_run_id, attempt, n)<br>• `github-webhook`: Das Relay vergibt `id = "gh-" + comment.id` und ignoriert eine Body-ID; sie bleibt als `source_ref` im Journal |
| FR-1.7 | Idempotenz über den Schlüssel (producer, id):<br>• gleicher Body-Hash → 200 `{duplicate:true, stream_sequence:<ursprünglich>}`, keine neue Sequenz<br>• anderer Hash → 409 `id_conflict`, ohne Wirkung<br>• Webhook-Neuzustellung mit gleicher comment.id ist ein Duplikat |
| FR-1.8 | Sequenz: Ein einziger Schreiber je Strom (`stream_id = <project_id>/<run_id>`) vergibt `stream_sequence` lückenlos ab 1. Bei gleichzeitigem Ingest gibt es weder Doppelvergabe noch Lücken. |
| FR-1.9 | Das Relay bestätigt erst nach dauerhaftem Append (201 `{stream_sequence, recorded_at}`). `recorded_at` ist die Relay-Uhr (M2). Scheitert die Speicherung → 503; es wurde nichts zugestellt. |
| FR-1.10 | Journal-Datensatz append-only (§3.3). Abgelehnte Anfragen landen in einem getrennten Ablehnungsprotokoll (Grund, Producer, Hash, max. 1 KB Auszug) und nie im Strom. |
| FR-1.11 | Rate-Limit: 60 Ereignisse pro Minute je Producer, danach 429. Lesepfad: 30 Verbindungsaufbauten pro Minute und IP. |
| FR-1.12 | Keine Befehls- oder Schreibschnittstelle für Browser. Schreibpfade antworten ohne CORS-Freigabe. |

**Akzeptanzkriterien ST1**
- **AC-1.1** (FR-1.2/1.3): *Given* das Relay läuft, *when* eine Anfrage mit falscher Signatur, abgelaufenem Zeitstempel (> 300 s), fremdem Login, fremdem Repository oder fremder Issue-Nummer eingeht, *then* lautet die Antwort 401/403, es entsteht kein Journaleintrag, die Strom-Sequenz bleibt gleich und das Ablehnungsprotokoll nennt den Grund.
- **AC-1.2** (FR-1.4/1.5): *Given* eine gültige Signatur, *when* der Body eine Art außerhalb des Satzes, einen fremden actor, `fictional:true`, Markup im Titel ab 141 Zeichen oder ein Secret-Muster enthält, *then* gibt es 4xx mit maschinenlesbarem Grund und keine Wirkung.
- **AC-1.3** (FR-1.7): *Given* ein angenommenes Ereignis X, *when* X erneut eintrifft (gleiche Bytes oder Webhook-Neuzustellung), *then* gibt es 200 mit `duplicate:true` und der ursprünglichen Sequenz, und die Anzahl im Journal ändert sich nicht. *When* dieselbe ID mit anderem Inhalt kommt, *then* 409.
- **AC-1.4** (FR-1.8/1.9): *Given* zwei Producer senden gleichzeitig je 20 Ereignisse, *then* hat das Journal 40 Einträge mit den Sequenzen 1..40, ohne Lücke und ohne Doppel. Nach einem Neustart des Relays bleiben alle 40 erhalten und lassen sich ab Cursor 0 nachholen.

### ST2: Claude-Code-Quelle

| ID | Anforderung |
|---|---|
| FR-2.1 | Neuer Wrapper `relay/ball_live_claude_stream.py`, als Kopie des bestehenden Wrapper-Musters. `relay/forge_live_thinking_once.py` bleibt **unverändert**. Er startet `claude … --output-format stream-json` (ob `--verbose` nötig ist, klärt E1) und liest die Zeilen, während der Lauf läuft. |
| FR-2.2 | Abbildung (Titel sind feste Vorlagen, keine Tool-Argumente, keine Inhalte):<br>• Init → `run.state_changed{zustand: aktiv}`, `host_observed`<br>• erstes `tool_use`, danach höchstens ein Ereignis je 20 s → `progress`, actor = Rolle, Titel „Zwischenstand: Werkzeug <Name> · Schritt <n>“, `runtime_stream`<br>• Ergebnis ok → `contribution` an atlas, Titel „Ergebnis zurückgegeben“, `verbrauch` nur aus der Ergebniszeile mit `belegt:true`, Tokenzahlen und `actual_model`, ohne Geldbetrag, `host_observed`; danach `run.state_changed{abgeschlossen}`<br>• Fehler oder Abbruch (`finally`) → `stop`, Titel mit kurzer Fehlerklasse; danach `run.state_changed{fehlgeschlagen \| abgebrochen}` |
| FR-2.3 | Korrelation: `run_id` = Workflow-Input `ball_run_id`, von Atlas beim Dispatch vergeben. `agent_id = "gha:<run_id>/<attempt>"`. `task_id` ist der Auftrag. `occurred_at` = M1, die Zeit, zu der der Wrapper die Zeile erfasst hat. Die Laufzeitzeit M0 ist unbekannt und wird nicht behauptet. |
| FR-2.4 | Der Ingest-Schlüssel lebt nur im Wrapper-Prozess (Actions-Secret). Die Umgebung des Claude-Subprozesses enthält weder Ingest-Schlüssel noch `GH_TOKEN`/`GITHUB_TOKEN`; das bestehende Muster bleibt. |
| FR-2.5 | Zustellung über eine eigene Warteschlange: Timeout 3 s, höchstens 5 Wiederholungen mit derselben ID, Backoff 1/2/4/8/8 s. Die Zustellung blockiert das Lesen des Claude-Stroms nicht. Jeder Versuch kommt ins Actions-Log: ID, HTTP-Status, Sequenz. Bleibt ein Ereignis endgültig unzustellbar, setzt das Archiv `vollstaendig:false`. |
| FR-2.6 | Kein `progress` nach einem Terminalereignis. Jedes Ereignis wird mit seiner `id` im Log protokolliert, damit Sentinel es zuordnen kann. |

- **AC-2.1** (FR-2.1–2.3, Kernkriterium): *Given* ein echter Claude-Actions-Lauf mit `ball_run_id = R`, *when* ein `progress` mit ID P angenommen wird, *then* (a) zeigt die GitHub-API den Job zum Zeitpunkt `recorded_at(P)` als `in_progress`, d. h. `completed_at` liegt später; (b) erscheint P im Actions-Log, im Journal, im Browser-Journal und sichtbar im Original; (c) folgt danach mindestens ein weiteres Ereignis desselben `agent_id`.
- **AC-2.2** (FR-2.4): *Given* die Lauf-Konfiguration, *then* zeigt ein env-Dump des Subprozesses im Harness-Lauf weder den Ingest-Schlüssel noch GitHub-Tokens. Der Dump ist als Harness gekennzeichnet und kein Live-Nachweis.
- **AC-2.3** (FR-2.5): *Given* das Relay ist 20 s unerreichbar, *then* läuft der Claude-Lauf weiter; danach werden die gespoolten Ereignisse mit unveränderter ID zugestellt, ohne Duplikat im Journal.

### ST3: ChatGPT-Work-Quelle (kooperativer Checkpoint)

| ID | Anforderung |
|---|---|
| FR-3.1 | Atlas oder ein zugelassenes Werkzeug schreibt **einen Kommentar pro Checkpoint** in das konfigurierte Live-Issue (D3). Format:<br>`<!-- ball-live:v1 -->` gefolgt von genau einem ```` ```json ```` -Block mit `{project_id, run_id, actor, kind, title, occurred_at\|null, task_id?, recipient?}`. Andere Felder → 422. |
| FR-3.2 | Freigegebene Arten für Work: `progress`, `handoff` (recipient Pflicht) und `contribution` (recipient Pflicht). |
| FR-3.3 | M1 für Work = `comment.created_at` (GitHub-Serverzeit), im Journal als `source_created_at`. `occurred_at` bleibt die Angabe des Agenten, oder `null`. |
| FR-3.4 | Ein Checkpoint, den Atlas für ein Work-Kind weiterreicht, trägt `actor = <Kindrolle>` und `agent_id = <Kindpfad>`. Die Anzeige lautet dann „selbst gemeldet · über Atlas“. Das Relay kann Atlas und Peter nicht unterscheiden, wenn beide dasselbe Login nutzen. Diese Grenze steht im Anzeigetext und im Nachweis. |
| FR-3.5 | Keine Behauptung vollständiger Work-Telemetrie, weder im Text noch in der Abdeckung. Ein Lauf mit Work-Quelle bekommt `abdeckung` = `partial`. |

- **AC-3.1** (Kernkriterium): *Given* ein laufender Work-Lauf mit `run_id = R`, *when* Atlas mitten im Auftrag ein `progress` P_W postet, danach mindestens eine weitere echte Arbeitsaktion ausführt und ein zweites Ereignis Q_W postet, *then* ist P_W im Original sichtbar mit „ChatGPT Work · selbst gemeldet (Checkpoint)“, und es gilt `comment.created_at(Q_W)` > M5(P_W), also nach dem Zeitpunkt der Sichtbarkeit. Das belegt die laufende Arbeit unabhängig vom Monitor.
- **AC-3.2** (FR-1.3/1.5): *Given* ein Kommentar mit Marker von einem fremden Login oder mit `source_evidence:"runtime_stream"`, *then* wird er abgelehnt, ohne Journaleintrag und ohne Anzeige.

### ST4: Lesestrom, Lebenszeichen, Nachholen

| ID | Anforderung |
|---|---|
| FR-4.1 | Endpunkte wie in §3.4: `betrieb`, `resume`, `events`, `snapshot`, `health`. Alle sind nur lesend. CORS erlaubt genau `https://pahlborn.github.io` (bei D3b zusätzlich `Authorization`). |
| FR-4.2 | `events` liefert `text/event-stream` über fetch-Streaming (Vertragsrahmen `header_fetch_streaming`). Pro Fachereignis: `id: <stream_sequence>`, `event: fach`, `data: <umschlag_fach V2.1>`. Lebenszeichen alle 5 s als `umschlag_herzschlag` mit `last_sequence`, ohne `id`, nicht im Journal. |
| FR-4.3 | Wiederaufnahme mit `?after=<cursor>` oder `Last-Event-ID`. Der Server liefert ab cursor+1 lückenlos. Bei `cursor > hoechste_sequenz` oder unterschrittener Replay-Grenze sendet er einen `strom.hinweis` und schließt (Vertragssemantik). |
| FR-4.4 | Der Server hält das Journal je Lauf für die gesamte Aufbewahrungszeit (D1). Im MVP ist die Replay-Grenze deshalb immer 1. Der Pfad für den Hinweis muss trotzdem implementiert und getestet sein. |

- **AC-4.1**: *Given* der Viewer hat Cursor n, *when* die Verbindung abbricht, k Ereignisse eintreffen und die Verbindung zurückkommt, *then* liefert der Server genau die Sequenzen n+1..n+k, jede einmal.
- **AC-4.2**: *Given* eine offene Verbindung ohne Fachereignisse, *then* kommt mindestens alle 5 s (+1 s Toleranz) ein Lebenszeichen mit korrektem `last_sequence`.

### ST5: Original-Adapter und Wahrheitsanzeige

| ID | Anforderung |
|---|---|
| FR-5.1 | Neue Datei `feld/live.js`. Aktivierung nur mit `?live=1&run=<run_id>`. Sie ruft `modusSetzen('live')` (Muster B5), dann `__agLauf({project_id:'agentarium', titel:<run_id>, ablage:'BALL Live · Relay'})` mit **festen** Strings aus dem Adapter. `?live` zusammen mit `?mvp` → sichtbarer Fehler, keiner von beiden startet. Ohne `run` → Hinweis „kein Lauf gewählt“, keine Verbindung. |
| FR-5.2 | Die Relay-Basis-URL ist eine **Konstante** in `live.js`, nie ein URL-Parameter. Sonst könnte ein Link auf ein fremdes Relay erfundene Aktivität einspielen. |
| FR-5.3 | Ablauf: zuerst `betrieb`, dann `resume`, dann `events`. Ein Generationszähler (Muster `activity-input.js`) verwirft verspätete Antworten. Backoff 1/2/4/8/15 s; sofortiger Neuversuch bei `online` und bei `visibilitychange → visible`. |
| FR-5.4 | Dedupe über die Event-`id` (Menge im Speicher, Sicherung in `sessionStorage`, wenn verfügbar). Ordnung nach `stream_sequence`. Bei einer Lücke wird gepuffert, der Cursor bleibt stehen und das Nachholen beginnt (Reducer-Regel R12/K2). Kein Ereignis wird zweimal an `__agEreignis` übergeben. |
| FR-5.5 | Hook-Anbindung:<br>• `herzschlag` → `__agStrom.lebenszeichen()`<br>• Verbindungsaufbau → `__agStrom.an()`<br>• Abbruch → `__agStrom.aus()` sowie Adapterhinweis „getrennt · verbinde neu“ ab dem ersten Fehler<br>• `fach/work.event` → `__agEreignis(payload, meta)`<br>• `run.state_changed` → Laufanzeige im Adapter<br>Jede Rückgabe der Hooks kommt ins Browser-Journal. |
| FR-5.6 | Änderungen in `feld/index.html`, in begrenzten Abschnitten (§4): `ARTEN.progress`, Erweiterung von `__agEreignis`, Escaping aller Senken, Kennzeichnung der Vertrauensart, Laden von `live.js`, `FASSUNG='48'`. |
| FR-5.7 | Anzeige je Agent auf dem Namensschild, nach dem Marker-Muster aus `activity-input.js` (`data-akt`, `title`, `aria-label`, ohne Hover; iPad-tauglich):<br>• `aktiv (belegt) · <Vertrauensart> · vor X s`<br>• `Stand unbekannt · letzter Beleg vor X`<br>• `beendet`<br>• `blockiert`<br>Agenten ohne Beleg im Lauf: `kein Beleg`. **Nie** `bereit`. Bei Verbindung `alt` zeigen alle Schilder zusätzlich „letzter bekannter Stand“. |
| FR-5.8 | Diagnose `window.__agLive.stand()`: Cursor, Generation, Verbindungsstatus, Zähler (empfangen, angenommen, abgewiesen, Duplikat, gepuffert), die letzten 50 Einträge mit `{id, seq, occurred_at, recorded_at, m3, m4, m5p, angenommen, grund, nachgeholt}` und die Schätzung des Uhrenversatzes. Sichtbar auch ohne Konsole über ein Diagnosefeld, das nur per Antippen öffnet und den Ereignistext nicht verdeckt. |
| FR-5.9 | Nachgeholt: Ein Ereignis gilt als nachgeholt, wenn seine Sequenz ≤ `hoechste_sequenz` beim (Wieder-)Aufbau ist oder M3 − `recorded_at` > 15 s (nach Versatzkorrektur). Es wird normal angewendet, aber mit „· nachgeholt · <Quellzeit hh:mm:ss>“ gekennzeichnet. |
| FR-5.10 | Hält `live.js` ein `index.html` ohne die erwartete `FASSUNG`, startet der Adapter nicht und zeigt „Fassung passt nicht · bitte einmal neu öffnen“. Das gehört vor die Probe, nicht in sie. |

- **AC-5.1** (Kernkriterium, gilt für AC-2.1 und AC-3.1): *Given* das Original ist mit `?live=1&run=R` geöffnet, „Fassung 48“ ist sichtbar und die Seite wird bis zum Ende nicht neu geladen, *when* P (Claude) und P_W (Work) angenommen werden, *then* erscheinen beide als Zeile im Original mit Actor, `progress` und Vertrauensart, sichtbar in der Bildschirmaufnahme. Die Rückgabe von `__agEreignis` ist für beide `angenommen:true` mit der Quell-ID.
- **AC-5.2**: *Given* `progress` von forge, *then* endet keine Arbeit (`auftragFertig` wird nicht aufgerufen), es entsteht kein Stopper, und der Ball eines offenen Handoffs bleibt bei forge.
- **AC-5.3** (Schweigen vs. Leerlauf): *Given* ein aktiver Lauf und Agent forge mit letztem `runtime_stream`-Beleg vor mehr als 60 s, *then* zeigt das Schild „Stand unbekannt · letzter Beleg vor …“, nicht „aktiv“ und nicht „bereit“. *Given* 20 s ohne Lebenszeichen, *then* gilt `body[data-strom="alt"]` und der Text nennt die Sekunden.
- **AC-5.4** (Injektion): *Given* Ereignisse mit `<img src=x onerror=…>` im `title`, im `actual_model` oder als Versuch in `titel`/`ablage` von `__agLauf`, *then* erscheint die Zeichenkette wörtlich als Text, es entsteht kein neues DOM-Element und kein Skript läuft.
- **AC-5.5** (Dedupe/Ordnung): *Given* der Strom liefert 104, 106, 106, 105, *then* wird 106 erst nach 105 angewendet, jede ID genau einmal, und der Cursor endet bei 106.
- **AC-5.6** (Unterbrechung): *Given* der Flugmodus ist 30 s an und in dieser Zeit treffen ≥ 3 echte Quellereignisse ein, *when* das Netz zurückkommt, *then* sind alle nachgeholt und als „nachgeholt“ gekennzeichnet, keines doppelt, ohne Reload. Die Zahl unterschiedlicher IDs in `liveListe` entspricht der Zahl der Journaleinträge.

### ST6: Archiv und Wiedergabe

| ID | Anforderung |
|---|---|
| FR-6.1 | `GET /v1/runs/{project}/{run}/archive` liefert für einen terminalen Lauf ein `archivmanifest` V2.1. Die `ereignisse` sind identisch mit dem Journal (IDs, Reihenfolge, Felder). `herkunft = {mode: OBSERVED_PROJECT_WORK, fictional: false}`. In `quellen` stehen die Producer. `kosten.erfassung = unvollstaendig` mit dem Pflichtsatz. `wiedergabe.nebenwirkungsfrei = true`. |
| FR-6.2 | `zeitachse` ist `complete` nur, wenn alle `occurred_at` gesetzt sind (Reducer-Regel R9), sonst `partial` oder `none`. `abdeckung.luecken` nennt bekannte Lücken (unzustellbare Spool-Einträge). `vollstaendig = false`, sobald eine Lücke bekannt ist oder eine Work-Quelle beteiligt war. |
| FR-6.3 | Der Workflow `ball-live-export.yml` (manueller Dispatch) schreibt das Manifest und `<run>.sha256` (SHA-256 über die exakten Bytes) nach `relay/ball-live/archive/` auf den Branch `agent/ball-live-archive`, nie nach `main`. Der Live-Beweis hängt nicht am Export. |
| FR-6.4 | `?archiv=1&run=<run_id>` lädt das Manifest vom Relay und übergibt es an den neuen Hook `__agArchiv(manifest)`. Der setzt `MODUS = 'archiv'`, zeigt im Kopf „Archiv · aufgezeichnet“, setzt nie `verbunden` oder Lebenszeichen und kennzeichnet jede Zeile als Archiv. |

- **AC-6.1**: *Given* Lauf R ist terminal, *then* besteht das Manifest die Validierung gegen `$defs.archivmanifest` mit einem Standard-Validator (ajv oder jsonschema; früher NOT_RUN, jetzt Pflicht). Anzahl und IDs stimmen mit dem Journal überein, der SHA-256 stimmt mit der exportierten Datei überein.
- **AC-6.2**: *Given* die Wiedergabe von R, *then* steht „Archiv“ sichtbar im Kopf, `data-strom` ist nie `lebt`, keine Zeile trägt eine Live-Vertrauensart ohne den Zusatz „Archiv“, und ein gleichzeitig offener Live-Viewer eines anderen Laufs bleibt unverändert.

### Nichtfunktionale Anforderungen

| ID | Anforderung | Prüfung |
|---|---|---|
| NFR-1 | Keine langlebigen Secrets im Browser oder in statischen Dateien. Bei D3b ist das Lesetoken nur lesend, widerrufbar und wird einmal auf dem Gerät eingegeben. | Code-Audit TC-SEC-03 |
| NFR-2 | Nur die Metadaten aus D4 laufen durch Relay und Archiv: keine Prompts, Gedanken, Tool-Argumente, Dateiinhalte, Kosten oder Tokens im Titel. | TC-SEC-04 |
| NFR-3 | TLS; CORS exakt eine Herkunft; CORS gilt nicht als Zugriffsschutz, Autorisierung serverseitig. | TC-SEC-01 |
| NFR-4 | Latenz wird gemessen, nicht zugesagt: M1→M2, M2→M3, M3→M4, M4→M5′ und M5 aus dem Video, je Ereignis. Zielwerte gelten nur, wenn Peter sie in D6 setzt. | TC-LAT-01 |
| NFR-5 | Kontrolle des Monitors: `GET /v1/health` mit letztem Ingest je Producer, Journalkopf, Zahl der Ablehnungen und Exportstatus. Ein Ausfall wird im Produkt als Verbindungszustand sichtbar, nie als Leerlauf eines Agenten. | TC-OPS-01 |
| NFR-6 | Demo- und Archivmodus und `?mvp=1` verhalten sich unverändert (Regression). | TC-REG-01 |
| NFR-7 | iPad: Vordergrund live. Hintergrund oder Sperre ohne Live-Zusage, aber mit vollständigem Nachholen bei Rückkehr. | TC-DEV-03 |
| NFR-8 | Der Fehlerweg ist sichtbar: Jede Ablehnung im Adapter steht mit Grund in der Diagnose, nichts geht still verloren. | TC-ADP-04 |

---

## 3. Schnittstellen-Delta (versioniert, V2.1 bleibt unverändert)

**Grundsatz:** Der Lesepfad zum Browser bleibt **reines V2.1**:
- `umschlag_fach`, `umschlag_herzschlag`, `umschlag_hinweis`, `betrieb`, `resume_antwort`, `schnappschuss`, `archivmanifest`
- `arbeitsereignis` mit den bestehenden Feldern `source_evidence`, `platform`, `agent_id`, `recorded_at`, `sequence`, `task_id`, `verbrauch`

Neu sind nur drei Dinge: das **Profil** „BALL-Live-Profil 1.0 auf V2.1“, das **Ingest-Schema** (Producer → Relay; V2.1 hatte dafür keine Definition) und das interne Journal-Format. Die Schema-Datei V2.1 und der Reducer werden nicht angefasst.

### 3.1 Profil 1.0 (neu: `specifications/AG-BALL-LIVE-001-profil-v1.md`)
- **Freigegebene `kind`:** `progress` (neu, ohne Nebenwirkung), `handoff`, `contribution`, `stop`. Alle anderen 16 Arten nimmt der MVP-Ingest nicht an; sie bleiben im Vertrag gültig.
- **`progress`:** keine Kommunikationsart, `recipient` optional; keine Zustandsfelder (Schema-Regel R1 greift schon). Im Original gilt: `{abgabe:0, nachhall:1.2, gestalt:'pfeil', kraft:0.4, tempo:1.2, was:'Zwischenstand – arbeitet noch'}`; kein `auftragFertig`, kein Stopper.
- **Vokabular:** `source_evidence` wie in §1.1. `platform` ∈ {claude-code, chatgpt-work}.
- **Feldbedeutungen:**
  - `arbeitsereignis.sequence` = Zähler des Producers (Claude: n; Work: null)
  - maßgeblich für die Ordnung ist `stream_sequence`
  - `recorded_at` = M2
- `fictional` ist im Live-Pfad immer `false`. `herkunft.mode` = `OBSERVED_PROJECT_WORK`.
- **`run.state_changed`:** im Strom `lauf` erlaubt, als `zustand` mit den Werten `aktiv`, `abgeschlossen`, `fehlgeschlagen` oder `abgebrochen`. `katalog` gehört nicht zum MVP.

### 3.2 Ingest-Schema v1 (neu: `specifications/AG-BALL-LIVE-001-schemas/ingest-v1.schema.json`)
```json
{ "schema": "agentarium.ball.ingest.v1",
  "type": "work.event | run.state_changed",
  "project_id": "agentarium", "run_id": "…",
  "event":       { "<arbeitsereignis V2.1 ohne recorded_at; fictional=false>" },
  "laufmeldung": { "<laufmeldung V2.1>" } }
```
Genau eines von `event` oder `laufmeldung`, passend zu `type`. `project_id` und `run_id` müssen mit dem inneren Objekt übereinstimmen. Der Webhook-Block (FR-3.1) wird vom Relay in diese Form übersetzt.

### 3.3 Journal-Datensatz (intern, als Datei-Export prüfbar)
`{stream_id, stream_sequence, recorded_at, producer, auth: "hmac|github_webhook", source_ref, source_created_at|null, body_sha256, type, event|laufmeldung}`

`source_ref`:
- Claude: `https://github.com/pahlborn/agentarium/actions/runs/<id>`
- Work: die `html_url` des Kommentars

### 3.4 Lesepfad-Endpunkte
| Endpunkt | Antwort (V2.1-Typ) |
|---|---|
| `GET /v1/betrieb` | `betrieb` mit `rahmen: header_fetch_streaming`, `heartbeat_takt_s: 5`, `veraltet_nach_s: 20`, `supported_actions: []` |
| `GET /v1/streams/{p}/{r}/resume?cursor=n` | `resume_antwort` |
| `GET /v1/streams/{p}/{r}/events?after=n` | `text/event-stream` (FR-4.2) |
| `GET /v1/streams/{p}/{r}/snapshot` | `schnappschuss` (`stream: lauf`, `rechte: ["read"]`, `kosten` mit Pflichtsatz) |
| `GET /v1/runs/{p}/{r}/archive` | `archivmanifest` (nur terminaler Lauf, sonst 409) |
| `GET /v1/health` | Betriebsdaten (NFR-5), keine Ereignisinhalte |

### 3.5 Original-Hooks (Delta, additiv)
- `__agEreignis(e, meta?)`:
  - Bisheriges Verhalten bleibt.
  - Zusätzlich: `task_id` → `E.aufgabe`; `source_evidence`, `platform` und `recorded_at` werden übernommen.
  - `meta` (nur vom Adapter, nicht aus dem Vertrag): `{nachgeholt: bool, archiv: bool}`.
  - Neue Ablehnung: `id` fehlt, wenn `meta` übergeben wurde. Dann wird keine `L<n>`-ID erfunden.
- `__agArchiv(manifest)` (neu, FR-6.4).
- `window.__agLive` (neu, in `live.js`, FR-5.8).
- `__agLauf`, `__agStrom`: Signatur unverändert. Freie Texte werden in den Senken escaped.

---

## 4. Rahmen für die Implementierung (für Forge verbindlich)

**Baseline-Prüfung vor der ersten Änderung:** Der Implementierungsbranch wird von `d111b062` abgezweigt, oder `feld/index.html` und `feld/sw.js` auf dem Branch müssen byteweise mit `git show d111b062:feld/index.html` übereinstimmen. Der Hash gehört in den Handback. Arbeiten auf der Fassung-46-Kopie des Konzeptbranchs ist **Stop**.

| Erlaubter Pfad | Änderung |
|---|---|
| `feld/index.html` | nur: `ARTEN.progress`; Delta von `__agEreignis` und `__agArchiv`; Escaping (`textContent` oder `esc()`) in **allen** Senken, die von Hook-Eingaben gespeist werden; Kennzeichnung der Vertrauensart in `stromZeile` und `melden`; `<script src="live.js">`; `FASSUNG='48'` und `GEBAUT` |
| `feld/live.js` | neu |
| `feld/sw.js` | `VORRAT='agentarium-v48'`, `live.js` in `STUECKE`; Relay-Anfragen bleiben fremde Herkunft und gehen am SW vorbei |
| `relay/ball-live/**` | Relay-Kern (anbieterneutral: Validierung, Signaturen, Journal-Semantik) plus dünne Anbieterbindung, Konfiguration ohne Secrets, Tests |
| `relay/ball_live_claude_stream.py` | neu (FR-2.1) |
| `.github/workflows/ball-live-claude.yml`, `ball-live-export.yml` | neu, erst nach D2 |
| `specifications/AG-BALL-LIVE-001-profil-v1.md`, `…-schemas/ingest-v1.schema.json` | neu |
| `tests/AG-BALL-LIVE-001-*` | neu; synthetische Fixtures nur dort, gekennzeichnet `fictional:true`, nie als Live-Nachweis |

**Verboten:**
- Änderungen an der Vertragsdatei V2.1, am Reducer, an anderen `feld/`-Assets oder an `relay/forge_live_thinking_once.py`
- Merge nach `main`, Pages-Veröffentlichung
- Webhook oder Secrets ohne D2

**Pflicht:** Forge liefert eine **Liste aller Senken**: jede `innerHTML`/`outerHTML`/`insertAdjacentHTML`-Stelle, die von `__agEreignis` oder `__agLauf` erreichbar ist, jeweils mit Zeile und Fix. Die von mir nicht gelesenen Funktionen (`kopfSetzen`, Stoppschild, `tunZeigen`, `motorenZeigen`, `wirf`) gehören ausdrücklich dazu.

**Wiederverwendung:**
- `__agStrom` unverändert (B4)
- Aktivierungsmuster von `?mvp=1` (B5)
- aus `activity-input.js`: Generationszähler, Ablauf der Gültigkeit → `unknown`, Marker auf Namensschildern mit `title`/`aria-label`, `esc()`, getrennte Zeilen für Transport, Quelle und Abdeckung, fester Kostensatz
- Vertragsregeln K2 (Lücke puffert) und R1 (Ordnung = Sequenz)

**Hosting** (anbieterneutral, Wahl nach D1). Muss können:
- TLS
- streamende HTTP-Antworten ≥ 10 min
- einen Schreiber je Strom mit stark konsistenter Speicherung
- Bestätigung nach dauerhaftem Schreiben
- EU-Region wählbar

Kandidatenklassen: Edge-Worker mit dauerhaftem Objekt, oder kleiner Container mit SQLite-Volume.

---

## 5. Erste ausführbare Testfälle

Ebenen: U = Unit, I = Relay lokal, B = gerendertes Original lokal (Chromium mit WebGL), H = gehostet, D = echtes iPad (Peter bedient, Sentinel protokolliert). Synthetische Daten sind nur in U, I und B zulässig und immer gekennzeichnet.

| TC | Ebene | Spur | Ablauf → erwartetes Ergebnis | Nachweis |
|---|---|---|---|---|
| **TC-E2E-01 Claude noch laufend** | D | AC-2.1, AC-5.1 | Original ist vorab mit `?live=1&run=R` offen. Atlas dispatcht `ball-live-claude.yml` (`ball_run_id=R`) für eine echte kleine Aufgabe von ≥ 2 min. → Erstes `progress` P ist sichtbar, während der Job `in_progress` ist; danach folgt ein weiteres Ereignis. | Actions-Log-Zeile P; GitHub-API Job `started_at`/`completed_at`; Journaleintrag P; `__agLive.stand()` P mit m3/m4/m5p; iPad-Bildschirmaufnahme mit sichtbarer Uhr |
| **TC-E2E-02 Work noch laufend** | D | AC-3.1, AC-5.1 | Derselbe Viewer. Atlas postet P_W, arbeitet weiter, postet Q_W. → P_W ist sichtbar mit „selbst gemeldet“, und `created_at(Q_W)` > M5(P_W). | Kommentar-URLs und -Zeiten; Webhook-Zustellprotokoll; Journal; Video |
| **TC-PIX-01 sichtbare Pixel** | D, B | AC-5.1 | Im Video steht in dem Frame, in dem Zeile P erscheint, die Live-Uhr des Originals. In B: Screenshot nach zwei rAF, inhaltlich von Sentinel persönlich geprüft. | Frame-Nummer, Uhrzeit, Screenshot-Hash |
| **TC-LAT-01 Latenz** | D | NFR-4 | Für ≥ 3 `progress` je Anbieter werden M1, M2, M3, M4, M5′ und M5 (Video, 1-s-Auflösung) erhoben. Der Versatz der iPad-Uhr wird aus min(M3_lokal − `herzschlag.sent_at`) geschätzt und mit Unsicherheit berichtet. → Tabelle je Ereignis. Bestehen = vollständig gemessen; Schwelle nur nach D6. | Messtabelle, Rohwerte |
| **TC-ORD-01 Dedupe Ingest** | I, H | AC-1.3 | Gleiches Ereignis 3× senden; Webhook-Neuzustellung über die GitHub-UI „Redeliver“; gleiche ID mit anderem Body. → 201/200 dup/200 dup/409; Journal +1. | HTTP-Protokoll, Journalanzahl |
| **TC-ORD-02 gleichzeitige Sequenz** | I | AC-1.4 | 2×20 parallele Ingests, danach Neustart des Relays, danach `events?after=0`. → Sequenzen 1..40 lückenlos, ohne Doppel. | Ausgabe des Testskripts |
| **TC-ORD-03 Lücke im Adapter** | B | AC-5.5 | Ein lokaler Test-Server liefert 104, 106, 106, 105. → Anwendungsreihenfolge 104, 105, 106; jede genau einmal; Cursor 106. | `__agLive.stand()` |
| **TC-REC-01 Funkloch** | D | AC-5.6, AC-4.1 | Während ein Claude-Lauf aktiv ist: Flugmodus 30 s, in dieser Zeit ≥ 3 Ereignisse. → Innerhalb von 20 s erscheint `data-strom=alt` (sofort „getrennt“); nach der Rückkehr alles nachgeholt, als „nachgeholt“ markiert, ohne Duplikat und ohne Reload. | Video, Diagnose, Journal-Diff |
| **TC-REC-02 Relay-Neustart** | H | AC-1.4, FR-5.3 | Relay wird während eines offenen Viewers neu gestartet. → Wiederverbindung mit Cursor, keine Doppelwirkung. | Diagnose |
| **TC-DEV-03 Hintergrund** | D | NFR-7 | Safari 2 min im Hintergrund, Ereignisse laufen weiter. → Bei Rückkehr vollständig nachgeholt. | Video, Diagnose |
| **TC-STA-01 Veraltet statt Leerlauf** | D, B | AC-5.3 | Echter Lauf mit einem Schritt > 60 s ohne `progress` (z. B. ein langer Build im Auftrag). → Das Forge-Schild wechselt zu „Stand unbekannt · letzter Beleg vor …“, nie zu „bereit“. Agenten ohne Ereignis: „kein Beleg“. | Video, `data-akt` |
| **TC-STA-02 Lebenszeichen weg** | B | AC-5.3, AC-4.2 | Der Test-Server sendet nach Ereignis X keine Lebenszeichen mehr. → Bei > 20 s `alt`; Schilder zeigen „letzter bekannter Stand“; kein Agent bekommt `beendet`. | DOM-Attribute |
| **TC-SEM-01 progress ohne Nebenwirkung** | B | AC-5.2 | `handoff` atlas→forge (task T), dann `progress` forge. → forge arbeitet weiter, kein Stopper, kein Tisch-Eintrag; `progress` ohne recipient wird angenommen (klärt `wirf()` ohne `an`). | Rückgaben, Zustand des Felds |
| **TC-SEC-01 Auth** | I, H | AC-1.1 | Falsche HMAC; ts −301 s; fremder Login; fremdes Issue; fremdes Repository; `edited`-Action; Browser-Origin auf Schreibpfad. → je 401/403/202 ohne Wirkung. | HTTP-Protokoll, Ablehnungsprotokoll |
| **TC-SEC-02 Injektion End-to-End** | H, B | AC-5.4, AC-1.2 | Ein Payload `<img src=x onerror=alert(1)>` (a) im Ingest-Titel → 422; (b) direkt am Hook für `title`, `verbrauch.actual_model`, `__agLauf.titel/ablage` → wird als Text angezeigt. → Kein Element `img`, kein `alert`, die Zeichenkette ist sichtbar. | DOM-Abfrage, Screenshot |
| **TC-SEC-03 Secrets** | U | NFR-1, AC-2.2 | grep über `feld/**` nach Schlüsseln und Token-Mustern; env-Dump des Claude-Subprozesses im Harness. → keine Treffer. | Ausgabe |
| **TC-SEC-04 Metadaten** | I | NFR-2 | Ingest mit Secret-Muster, mit Zusatzfeld, mit 141 Zeichen. → 422; das Journal enthält nur die Felder aus D4. | Journal-Export |
| **TC-SEC-05 Vertrauensart nicht fälschbar** | H | AC-3.2 | Webhook-Body mit `source_evidence:"runtime_stream"` und actor `forge`. → 422. | HTTP |
| **TC-CON-01 gleichzeitige Quellen** | D, H | AC-1.4, AC-5.1 | Claude-`progress` und Work-`progress` im selben 5-s-Fenster in Lauf R; parallel Ereignisse in Lauf R2. → Der Viewer R zeigt beide R-Ereignisse in der Reihenfolge der Sequenz, nichts aus R2; das Journal R ist lückenlos. | Journal R und R2, Video |
| **TC-ARC-01 Export** | H | AC-6.1 | R ist terminal → `archive` → Validierung mit ajv oder jsonschema → Export-Workflow. → Schema gültig; IDs und Anzahl gleich dem Journal; SHA stimmt; `vollstaendig:false` bei Work-Anteil. | Validator-Ausgabe, Commit auf dem Archivbranch |
| **TC-ARC-02 Wiedergabe** | B, D | AC-6.2 | `?archiv=1&run=R`. → Kopf „Archiv“, nie `data-strom=lebt`, Zeilen als Archiv markiert; ein paralleler Live-Tab bleibt unverändert. | Screenshot, DOM |
| **TC-ADP-04 Ablehnung sichtbar** | B | NFR-8 | Ereignis mit unbekanntem actor im Strom. → In der Diagnose steht `abgewiesen: actor unbekannt`; Zähler +1; keine Zeile im Feld. | Diagnose |
| **TC-OPS-01 Health** | H | NFR-5 | Ingest, danach `health`. → Zeit des letzten Ingest je Producer und Journalkopf sind aktuell. | JSON |
| **TC-REG-01 Regression** | B | NFR-6 | Demo, Archiv mit eingebettetem Stück und `?mvp=1` gegen d111 vergleichen. → Unverändert, abgesehen von Fassung und Escaping. | Screenshots |
| **TC-VER-01 Fassung** | D | FR-5.10 | Vor der Probe: Fassung 48 sichtbar und Hinweis von `live.js` ohne Fehler; gegebenenfalls einmal neu öffnen (B6). Der Reload liegt **vor** der Probe. | Foto oder Video |

---

## 6. Voraussetzungen, Entscheidungspaket, Stop-Regeln

### 6.1 Ein Entscheidungspaket für Peter vor der Implementierung (Gate G3)
| # | Entscheidung | Meine Empfehlung | Wenn sie fehlt |
|---|---|---|---|
| D1 | Betrieb des Relays: Anbieter, Kontoinhaber, Region, Aufbewahrung, Kostenobergrenze pro Monat | kleiner Edge-Worker mit dauerhaftem Einzelprojekt-Journal; Konto bei Peter; EU; Journal 30 Tage, danach nur Archiv; Atlas koordiniert den Betrieb | Kein P3/P4; nur lokale Stufen |
| D2 | Neue Zugangsdaten: Webhook-Secret, HMAC-Schlüssel `claude-actions` als Actions-Secret, Webhook am Repository, zwei neue Workflows | ja; kein Browser-Secret | ST2/ST3 nur lokal; kein Live-Nachweis |
| D3 | Work-Quelle und Sichtbarkeit: kooperativen, gekennzeichneten Checkpoint akzeptieren, **und** (a) öffentliches Live-Issue in `pahlborn/agentarium` mit öffentlichem Lesestrom, oder (b) privates Inbox-Repository mit Lesetoken auf dem iPad | (a) für das MVP, weil nur Metadaten aus D4 fließen; (b), falls Peter keine öffentlichen Aufgabentitel will | Work-Hälfte des MVP **BLOCKED** |
| D4 | Metadaten-Allowlist: project, run, actor, recipient, kind, Titel (≤ 140 Zeichen, Aufgabenebene), Zeiten, Vertrauensart, `task_id`, Tokenzahlen ohne Geld | so | Kein Ingest |
| D5 | Freigabe der begrenzten Änderungen am Original laut §4 (Fassung 48) | ja | Kein Weg ohne manuelle Injektion (G1) |
| D6 | Messprofil: konkretes iPad, iPadOS- und Safari-Version, Peter als Bediener; optional ein Latenzziel | Ziel offen lassen; MVP misst | Ohne Gerät kein D-Test → MVP **BLOCKED** |

**Gesondert und erst später:** Die Veröffentlichung des **konkret geprüften** Kandidaten (Fassung 48) auf Pages `feld/` ist eine eigene Release-Freigabe Peters. Erst danach laufen die D-Tests. D5 ist keine Veröffentlichungsfreigabe.

### 6.2 Stop- und Blocked-Regeln
- **Baseline:** Basis ist nicht d111 → Stop (Forge).
- **E1 negativ:** Weder Stream noch Hooks unter dem Host liefern ein Zwischenereignis vor dem Ende des Laufs → ST2 BLOCKED. Ein Lebenszeichen des Wrappers als `host_observed` ist als Ersatz **nicht** abnahmefähig für AC-2.1. Rückgabe an Atlas.
- **E2 negativ:** Atlas kann mitten im Auftrag nicht schreiben und danach weiterarbeiten → ST3 BLOCKED; Varianten B/C werden Peter vorgelegt.
- **E3 negativ:** fetch-Streaming über CORS in iPad-Safari ist nicht nutzbar → Stop. **Kein** Polling als Ersatz; Forge legt Alternativen vor.
- **Unklare Bestätigung:** Ein Ereignis gilt als bestätigt, ohne dass das Journal es dauerhaft enthält, oder Sequenzen fehlen bzw. sind doppelt → FAIL, Stop.
- **Schreibzugriff:** Ein Schreibpfad ist ohne Auth erreichbar → Stop, Deployment zurücknehmen.
- **Erfundener Zustand:** Ein angezeigter Zustand ist nicht aus einem Ereignis ableitbar (z. B. „bereit“, „beendet“ ohne Terminalereignis) → FAIL.
- **Anbieterfehler:** Kontingent, Guthaben oder Schlüsselfehler eines Anbieters → Lauf stoppen, Belege sichern, kein automatischer Neuversuch.
- **Material-Änderung:** jede Änderung außerhalb §4 oder jede neue Infrastruktur → zurück an Atlas und Peter.

### 6.3 Reihenfolge
1. **Argus:** Vorab-Review dieser Spezifikation (G2). **Sentinel:** Prüfung der Testbarkeit von §5. Beides parallel, an Atlas.
2. **Peter:** D1–D6.
3. **Forge F0:** Baseline-Prüfung; **E1** als Harness gegen ein lokales Ingest-Echo. Atlas führt **E2** echt aus (zwei Kommentare, Turn läuft weiter).
4. **Forge F1:** Relay-Kern und Tests (U/I: TC-ORD-01/02, TC-SEC-01/04/05). **F2:** Adapter und Delta in `index.html` (B: TC-ORD-03, TC-SEM-01, TC-STA-02, TC-SEC-02, TC-ADP-04, TC-REG-01). **F3:** Claude-Wrapper.
5. **Sentinel:** Komponentennachweis gegen feste Commits (U/I/B).
6. **Forge/Atlas F4:** gehostetes Deployment, Webhook, Secrets (nach D1/D2). **E3** iPad-Probe gegen das gehostete Relay auf einer Vorschau-Seite, gekennzeichnet als Harness.
7. **Peter:** Release-Freigabe des Kandidaten für `feld/`. Danach **Sentinel D-Tests** mit Peter am iPad (TC-E2E-01/02, PIX, LAT, REC, STA, CON, VER, ARC-02).
8. **Argus:** Review von Ergebnis und Belegkette. Atlas meldet. Merge und Release bleiben Peters Sache.

Autor (Forge), Ausführender (Actions oder Atlas), Veröffentlicher, Tester und Reviewer werden getrennt erfasst.

---

## 7. Roadmap nach dem MVP

| R | Ausbau | Auslöser |
|---|---|---|
| R1 | Katalogstrom (`project.created`, `run.started/finished`): Der Viewer folgt neuen Läufen ohne `run`-Parameter; Laufauswahl | nach der MVP-Abnahme |
| R2 | Work direkt über ein zugelassenes Werkzeug (Remote-MCP oder Action, Variante B) statt GitHub-Kommentar | Nachweis der Plan-Fähigkeit durch Scout |
| R3 | Producer-Auth über kurzlebige GitHub-Actions-OIDC-Tokens statt HMAC-Secret | Forge bestätigt die Machbarkeit |
| R4 | weitere Arten (`question`, `answer`, `block`/`unblock`, `test_result`/`review_result`) mit Prüfung nach den Vertragsregeln | Bedarf nach dem MVP |
| R5 | statistische Latenz-Stichprobe (≥ 30 Ereignisse je Anbieter über ≥ 3 Läufe) und SLA | Peters Ziel aus D6 |
| R6 | Monitoring mit Alarmweg, Backup, Incident-Prozess | vor dem Dauerbetrieb |
| R7 | kontrollierte Runtime (Variante C) für automatische GPT-Telemetrie | bewusste Entscheidung Peters |
| R8 | Darstellung „nachgeholt“ ohne Wurf-Burst, Feinschliff der Agentenanzeige (Nova) | Produktfeedback |

---

## 8. Offene Punkte und Dissens

1. **Technisch unbewiesen** (wird durch Experimente geklärt, keine Frage an Peter):
   - E1: Zwischenereignisse aus dem Claude-Strom unter dem Host
   - E2: Atlas schreibt mitten im Auftrag und arbeitet weiter
   - E3: fetch-Streaming über CORS in iPad-Safari
   - Verhalten von `wirf()` bei `progress` ohne recipient (TC-SEM-01)
2. **Autorenschaft unter einem gemeinsamen Login:** Teilen sich Atlas und Peter das GitHub-Login, ist der Work-Checkpoint „über Peters Konto übermittelt“. Das ist offengelegt und keine Authentizität einer Rolle.
3. **Schwelle für „veraltet“:** Der Vertrag verlangt 20 s. Die Studie schlug 10 s vor. Die Spezifikation behält 20 s und meldet einen Abbruch zusätzlich sofort. Eine kürzere Schwelle wäre eine Vertragsänderung und gehört nicht ins MVP.
4. **Dissens zu Forge bleibt erhalten:** Forge hielt A0-Polling für den kleinsten Beweis. Diese Spezifikation folgt der verbindlichen Korrektur: Polling ist kein MVP-Weg und auch kein Ersatz bei einem Fehlschlag (Stop-Regel E3).
5. **Rückmeldungen ausstehend:** Nova (Texte der Anzeige), Sentinel (Testbarkeit), Argus (Vorab-Review). Keine davon habe ich erhalten.

**Nächster Schritt (Atlas):**
- Spezifikation als `specifications/AG-BALL-LIVE-001-mvp-spezifikation-v2.md` ablegen; ich habe keine Schreibrechte.
- Argus und Sentinel für G2 beauftragen.
- Peter das Paket D1–D6 vorlegen.

**Tests:** NOT_RUN. **Implementiert:** nichts.