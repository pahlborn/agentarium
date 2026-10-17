## AG-BALL-LIVE-001-FORGE-ARCH-V1 — RESULT_READY / STOPPED
```json
{
  "task_id": "AG-BALL-LIVE-001-FORGE-ARCH-V1",
  "request_commit": "efc3c2c27929de86feb200357c6e8eac77058fa6",
  "definition_blob": "38d9747018bd4bfc5299a2dd9aeded9659337e77",
  "run": "https://github.com/pahlborn/agentarium/actions/runs/39013757286",
  "cli_version": "2.1.302 (Claude Code)",
  "requested_model": "best",
  "requested_effort": "xhigh",
  "actual_reasoning": "unconfirmed",
  "session_id": "ee08a6e9-782a-458c-aff6-3f79e1c507d0",
  "modelUsage": {
    "claude-fable-5-1": {
      "inputTokens": 20,
      "outputTokens": 37701,
      "cacheReadInputTokens": 479799,
      "cacheCreationInputTokens": 207785,
      "webSearchRequests": 0,
      "costUSD": 4.60251225,
      "contextWindow": 1000000,
      "maxOutputTokens": 64000,
      "thinkingTokens": 22806,
      "canonicalModel": "claude-fable-5-1",
      "provider": "firstParty",
      "costBasis": "list"
    }
  },
  "usage": {
    "input_tokens": 20,
    "cache_creation_input_tokens": 207785,
    "cache_read_input_tokens": 479799,
    "output_tokens": 37701,
    "output_tokens_details": {
      "thinking_tokens": 22806
    },
    "server_tool_use": {
      "web_search_requests": 0,
      "web_fetch_requests": 0
    },
    "service_tier": "standard",
    "cache_creation": {
      "ephemeral_1h_input_tokens": 0,
      "ephemeral_5m_input_tokens": 207785
    },
    "inference_geo": "global",
    "iterations": [
      {
        "input_tokens": 2,
        "output_tokens": 35871,
        "cache_read_input_tokens": 172837,
        "cache_creation_input_tokens": 34948,
        "cache_creation": {
          "ephemeral_5m_input_tokens": 34948,
          "ephemeral_1h_input_tokens": 0
        },
        "type": "message"
      }
    ],
    "speed": "standard",
    "fallback_credit": null
  },
  "num_turns": 16,
  "total_cost_usd": 4.60251225,
  "execution": {
    "kind": "SUCCESS",
    "detail": "SUCCESS",
    "returncode": 0,
    "elapsed_seconds": 561.083,
    "timeout_seconds": 1800,
    "stdout_bytes": 28965,
    "stderr_bytes": 0,
    "stdout_sha256": "7e1cb3453b97081e50a2f3cb202d5c24c5589d66711e8f357b0713b16866e0ff",
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
# CA_ADVICE — AG-BALL-LIVE-001-FORGE-ARCH-V1

**Rolle:** Forge / coding-agent, Modus read-only Architektur. Keine Edits, keine Tests, kein Netz.
**Baseline (beobachtet):** Arbeitsbaum des Branch `agent/ball-live-concept-20261017`; Commit-SHA in dieser Sitzung nicht ermittelbar (kein Bash/Git). Identitätsmarker der gelesenen Originaldatei: `feld/index.html` mit `FASSUNG = '46'`, `GEBAUT = '2026-10-16T19:16Z'` (Zeile 2225).
**Werkzeuglage:** Nur `Read` war in dieser Invocation verfügbar (Glob/Grep trotz Override nicht angeboten). Folge: Ich konnte den Vertrag V2.1, `sw.js`, `relay/forge_ten_live_events_once.py` und `previews/…/schicht.py` **nicht** lokalisieren/lesen. Alles dazu unten ist als *unbekannt* markiert, nicht als gelesen.
**Modell/Reasoning:** angefordert best/xhigh; tatsächlich: **unconfirmed** (kein unabhängiges Laufzeitfeld sichtbar; Selbstauskunft ist keine Attestierung).

Gelesen und ausgewertet: AGENTS.md, Rollendefinition, Rulebook 1.2, Prozess 1.2, Produktpraxis v1, Charter, Team-Input, AG-LIVE-THINK-001-Alternativen, AG-VISUAL-005-Re-Review, `feld/index.html` vollständig (5861 Zeilen), `relay/forge_live_thinking_once.py`.

---

## 0. Die drei entscheidenden Befunde aus dem Original (verifiziert durch Lesen)

| # | Befund | Fundstelle | Konsequenz |
|---|---|---|---|
| F1 | Das Original hat **keinen Ereignistyp für „arbeitet noch / Zwischenstand“**. `ARTEN` kennt 17 Arten; jede `wurf`/`sonne`-Art (`contribution`, `proposal`, `recommendation`, `artifact`, `decision`, `test_result`, `review_result`, `request`, `handoff`) **beendet** über `auftragFertig(E.von, …)` die Arbeit des Absenders; `question`/`open_state` setzen einen **Stopper** auf den Absender; `answer` löst Stopper beim Empfänger. | Z. 2209 (ARTEN), Z. 4363–4383 (`schritt`) | Ein echtes Zwischenereignis eines *noch laufenden* Agenten würde mit jeder vorhandenen Art **falsch** dargestellt (als fertig, als blockiert oder als Antwort). Das MVP braucht eine neue Art `progress` (gestalt `pfeil`, abgabe 0, kurzer Nachhall → „hinterlässt nichts“, kein Seiteneffekt). Das ist eine kleine, aber **notwendige Produktänderung** am Original. |
| F2 | `window.__agEreignis` **dedupliziert nicht** (`id` wird nur durchgereicht), ordnet nicht nach `occurred_at` (setzt `t: zeit` bei Eintreffen) und kennt weder `project_id/run_id/source_evidence` noch `aufgabe`. Es gibt im Original **keinen Fetch-/EventSource-Code**; der Hook wartet auf einen externen Aufrufer. Live-Modus nur per UI-Tipp (Kopf → Blatt → „Live“) oder `STUECK.modus`; `modusSetzen` ist nicht exponiert, kein URL-Parameter. | Z. 5040–5103, 4540–4550 | Idempotenz, Cursor, Reihenfolge, Provenienz und der eigentliche Empfang müssen in einem **Empfangsadapter** (`feld/live.js`) liegen, der in die Seite eingebunden wird. Ohne Einbindung in `feld/index.html` gibt es keinen „Original ohne Ersatzoberfläche“-Weg außer manueller Injektion (Bookmarklet/DevTools) — das wäre eine versteckte manuelle Transporthandlung (G1-Verstoß). |
| F3 | **Sicherheitslücke auf dem Live-Pfad:** `stromZeile` und `melden` schreiben `E.text` (= `title` aus dem Hook) **unescaped per `innerHTML`**. | Z. 4680–4688, 4868–4870 | Sobald fremde/öffentliche Quellen (z. B. Issue-Kommentare im öffentlichen Repo) Ereignisse liefern, ist das ein XSS-Vektor. Muss im MVP-Änderungssatz behoben werden (Escaping im Hook oder `textContent`). Zusätzlich braucht der Adapter eine **Autoren-Allowlist**. |

Weitere verifizierte Fakten: Strom-Semantik ist bereits richtig gebaut (`__agStrom.an/lebenszeichen/aus`, 5 s Takt / 20 s veraltet aus Vertrag, Feld erzeugt selbst **kein** Lebenszeichen, Z. 2279–2280, 4933–4986); `__agLauf` verlangt `project_id` und setzt Projekt/Titel (Z. 5024–5038); Live-Betrieb kennt keinen Ausklang/Selbststart (Z. 4406–4410); `arbeitAn` startet nur durch `sonne`-Arten (`request`/`handoff`, Z. 2954) — d. h. die Sequenz „`handoff` atlas→forge → `progress` forge → `contribution`/`artifact` forge→atlas“ ist die kanonische Live-Spur eines Laufs. Der Relay-Wrapper ruft `claude --bare -p … --output-format json` (nicht-streamend), entfernt `GH_TOKEN/GITHUB_TOKEN` aus der Claude-Umgebung und postet HOST_RECEIVED/RESULT per `GITHUB_TOKEN` in Issue #2 (`relay/forge_live_thinking_once.py` Z. 54, 58–67, 106).

---

## 1. Architecture Decision Record

### Variante A0 — „GitHub als Ereignisablage, Original pollt“ (relay-los, MVP-Vehikel)
**Weg:** Claude-Code-Host (Actions-Wrapper, `stream-json`) → strukturierte Ereignis-Kommentare in einem GitHub-Issue (bestehender `GITHUB_TOKEN`) · Atlas → derselbe Kommentartyp über den bereits belegten GitHub-Connector · `feld/live.js` im Original pollt `GET /repos/pahlborn/agentarium/issues/{n}/comments?since=…` mit `If-None-Match` alle 5–6 s, filtert Marker + Autoren-Allowlist, dedupliziert per Kommentar-ID, ruft `__agLauf`/`__agEreignis`/`__agStrom.lebenszeichen`.
**Vorteile:** keine neue Infrastruktur, kein neues Secret, kein Provider-Konto, kein Webhook; Server-Zeitstempel (`created_at`) von GitHub als `recorded_at`; Ablage = Archiv; CORS für api.github.com vorhanden (unauthentifiziert, zu verifizieren von iPad-Safari).
**Hauptnachteil:** Kein Push; Latenz = Pollintervall + API-Frische (Klasse 5–15 s, **gemessen, nicht zugesagt**); hängt an der GitHub-Ratenbegrenzung (unauthentifiziert 60/h; Hypothese: 304-Antworten zählen nicht — **muss belegt werden**, sonst Token auf dem iPad oder Variante A); öffentliche Issue-Kommentare = öffentliche Ereignisse; keine serverseitige Sequenz/Replay-Grenze; Kommentar-Rauschen im Issue. Architektonisch eine **Sackgasse für das Endziel**, aber der kleinste ehrliche Beweis beider Quellen.

### Variante A — „Minimal gehosteter Relay“ (Zielarchitektur, Richtung 1 des Denkpapiers)
**Weg:** Quellen wie A0, aber Claude-Host POSTet direkt (Bearer/HMAC) an `POST /ingest`; Atlas weiterhin über GitHub-Schreiben → **Repository-Webhook** (`issue_comment`, signiert) → `/ingest/github`. Relay: append-only Log je (project_id, run_id), monotone `stream_sequence`, Idempotenz per `producer+event_id`, Katalogstrom (`run.started/finished`), `GET …/events` als SSE/fetch-stream mit `Last-Event-ID`, Heartbeat-Event alle 5 s (nicht persistiert), Snapshot-Endpunkt, Retention + Archiv-Export (JSON + Manifest `zeitachse`). Browser: derselbe `live.js`, nur Quellmodul `sse-source` statt `poll-source`.
**Vorteile:** Push-Latenz (Klasse Sekunden), vollständige V2-Semantik (Sequenz, Replay, Snapshot, Heartbeat), Authentizität je Produzent, privater Lesepfad möglich, Archiv/Replay aus derselben Spur.
**Hauptnachteil:** Neue betriebene Komponente (Hosting-Konto, Ingest-Secret als Actions-Secret, Webhook-Konfiguration am Repo, Monitoring, Kosten) — alles **Peter-Entscheidungen**; Atlas-Quelle bleibt **kooperativer Selbstbericht**, nur mit Server-Zeitstempel; Browser-Auth cross-origin auf iPad Safari erzwingt fetch-streaming mit Authorization-Header (kein EventSource, kein Cookie wegen ITP) oder öffentliches Lesen.

### Variante B — „Direkter Werkzeuganschluss“ (Richtung 2)
Wie A, aber Atlas meldet über ein zugelassenes Tool (Remote-MCP `ball.report_event` oder HTTP-Action) direkt an den Relay; GitHub bleibt Archiv. Kürzester Weg, ein Produzentenschema für beide Plattformen.
**Hauptnachteil:** Verfügbarkeit eines benutzerdefinierten Remote-MCP/Actions in Peters ChatGPT-Work-Plan **nicht nachgewiesen** (Scout: Policy-gebunden); zusätzliche öffentliche Angriffsfläche (MCP-Server, Auth); weiterhin Selbstbericht. Bis zum Nachweis: blockiert, nicht geplant.

### Variante C — „Beobachtbarer Kern“ (Richtung 3)
Ausführende Rollen in SDK-Runs auf dem Host (OpenAI Agents SDK / Claude Agent SDK), Runner-Ereignisse automatisch → Relay. Einzige Variante mit gleichförmiger **Runtime-Telemetrie** für GPT-Rollen.
**Hauptnachteil:** Verlagert den Betrieb (API-Schlüssel/Kosten für GPT-Rollen, Skill-Reintegration, Hosting), beobachtet die heutige Work-Sitzung **nicht**, Komplexität XL. Bewusste spätere Entscheidung.

**Verworfen:** Lokaler Sidecar (Mac) — iPad erreicht kein `localhost`, entfernte Runtimes erreichen den Mac nur über Tunnel (= gehosteter Relay mit dem Mac als Single Point of Failure), HTTPS-Mixed-Content gegen die Pages-Seite.

### Empfehlung
**Zielarchitektur: Variante A** (mit B als späterem Austausch des Atlas-Produzenten, falls der Toolanschluss nachgewiesen wird). **MVP-Beweis: Variante A0**, weil er beide Quellen, die Normalisierung, den Hook-Anschluss, die Wahrheitssemantik und die iPad-Erreichbarkeit mit **null neuen Infrastruktur-/Secret-Entscheidungen** real prüft; der Adapter wird so geschnitten, dass nur das Quellmodul für A getauscht wird.
**Hauptnachteil der Empfehlung:** A0 ist zweimal gebautes Transportstück (Poll-Quelle wird später ersetzt) und birgt die Gefahr, als „gut genug“ stehen zu bleiben; außerdem öffentliche Ereignisse und Ratenlimit-Risiko.
**Offener Dissens zu Atlas, bewusst erhalten:** Atlas hat „GitHub-Pull mit ungeprüfter Minutenlatenz“ als Erfüllungsweg abgelehnt. Ich stimme für das **Endziel** zu (Push-Relay). Für den **MVP-Beweis** halte ich bounded Polling mit *gemessener* 5–15-s-Latenz für den kleinsten ehrlichen Weg; Peter hat keine 5-s-SLA gesetzt. Entscheidung gehört in G3.

---

## 2. Komponenten und Datenfluss

```
QUELLE Claude Code (GitHub-Actions-Host, bestehender Python-Wrapper)
  claude -p … --output-format stream-json [--verbose]      ← statt json
    system/init(session_id, model) ──► run.started  → kind=handoff  actor=atlas → rolle  prov=host_observed
    assistant.tool_use(name,input) ──► progress (gedrosselt ≥20 s)  actor=rolle          prov=runtime_stream
    Notification/Permission (Hook) ─► stop klasse=freigabe / resume                        prov=runtime_hook
    result(ok, usage, modelUsage) ──► contribution|artifact actor=rolle → atlas, verbrauch.belegt=true
    result(error)/CLI-Fehler/finally ► stop klasse=technisch|budget (Grund)               prov=host_observed
  Wrapper hält GITHUB_TOKEN/Ingest-Token NUR in sich; Claude-Subprozess bleibt ohne Secrets (wie heute).

QUELLE ChatGPT/Atlas (kooperativ, heutiger Toolvertrag)
  Atlas schreibt pro Checkpoint EIN strukturiertes Ereignis (JSON-Block mit Marker) per GitHub-Connector:
    handoff (delegiert) · progress (Zwischenstand) · question (an peter, blockiert) · contribution/artifact (fertig)
  provenance=self_report, recorded_at = GitHub created_at (serverseitig), run_id von Atlas beim Start vergeben.

BRÜCKE/INGEST
  A0: GitHub Issue-Kommentare (Ablage = Log).           A: Relay /ingest (Bearer/HMAC) + /ingest/github (Webhook-Signatur)
      Validierung: Schema, actor∈Allowlist des Produzenten, kind∈ARTEN+progress, title≤N Zeichen, kein Markup
      Idempotenz: producer+event_id (A0: Kommentar-ID)   Sequenz: A: stream_sequence je (project,run); A0: created_at,id

ABONNEMENT (nur lesend)
  A0: live.js poll-source: GET issues/{n}/comments?since=cursor, If-None-Match, 5–6 s, CORS, Autoren-Allowlist
  A : live.js sse-source: fetch-stream GET /streams/{p}/{r}/events, Authorization: Bearer <read>, Last-Event-ID, Heartbeat 5 s
  Beide: Dedupe-Set (sessionStorage), Cursor, Catch-up bei visibilitychange/online, Journal window.__agLiveStand()

ORIGINAL (feld/index.html, bounded Änderungen)
  __agLauf({project_id, run_id, titel, ablage: 'GitHub #n · Polling 6 s' | 'Relay …'})
  __agEreignis({id, actor, recipient, kind, title, occurred_at, verbrauch, caused_by, source_evidence, aufgabe=run_id})
  __agStrom.an()/lebenszeichen()/aus()   → Puls an der Uhr, 20 s → „veraltet“ (unverändert)

ARCHIV/REPLAY
  A0: Kommentare → Export per Actions-Job nach relay/events/<run>.json (Manifest zeitachse complete|partial|none) → Modus „archiv“
  A : Relay-Export derselben Spur; Replay nie als „live“ etikettiert (Re-Review §2)
```

**Schema-Minimum (Vorschlag, an V2.1 anzugleichen — V2.1-Datei von mir nicht gelesen):**
`schema, event_id, project_id, run_id, task_id, actor, recipient?, kind, title, occurred_at, recorded_at (von Brücke), source_evidence ∈ {runtime_hook, runtime_stream, host_observed, self_report, relay_derived, fictional}, producer, producer_sequence, caused_by?, verbrauch{belegt, input_tokens?, output_tokens?, thinking_tokens?, actual_model?}`. Kein Geldfeld (Hook und Peters Kostenregel).

---

## 3. Machbarkeitsmatrix

| Baustein | Status | Beleg / Lücke |
|---|---|---|
| Hooks `__agEreignis/__agLauf/__agStrom` vorhanden, Live-Gating, Stale-Anzeige | **verifiziert** | index.html Z. 4967–5103 |
| Ereignisart für Zwischenstand | **blockiert im Original** → kleine Produktänderung `progress` | F1 |
| Idempotenz/Cursor/Provenienz im Original | **fehlt** → Adapter | F2 |
| Escaping von `title` | **Bug** → Fix im Änderungssatz | F3 |
| Claude Code: Host existiert, postet mit GITHUB_TOKEN, hält Secrets vom Modell fern | **verifiziert** (Code gelesen; Lauf selbst historisch) | Wrapper Z. 16–17, 54, 64–67 |
| Claude Code: Zwischenereignis während laufendem Run (stream-json unter `--bare -p`, evtl. `--verbose` nötig; alternativ Hooks unter `--bare`) | **braucht Experiment** | nie ausgeführt; `--bare`-Verhalten unbekannt |
| ChatGPT Work: native Telemetrie/Hooks dieser Sitzung | **blockiert** (Scout, berichtet) | Policy/Plattform |
| Atlas: kooperativer Checkpoint per GitHub-Schreiben mitten im Turn, Turn läuft weiter | **plausibel, braucht Experiment** | Argus hat echte Zwischenmeldung geliefert (berichtet); Mid-Turn-Write+Fortsetzung nicht gemessen |
| iPad Safari: CORS-Poll gegen api.github.com, 304/ETag, Ratenlimit-Regel „304 zählt nicht“ | **braucht Experiment + Quellenbeleg (Scout)** | kritisch für A0 |
| iPad Safari: fetch-streaming SSE mit Authorization-Header, Hintergrund/Resume | **braucht Experiment** | für A |
| GitHub-Webhook-Zustelllatenz zu Relay | **braucht Experiment** | 10 s sind Antwortfrist, keine Zusage (Denkpapier) |
| Custom Remote-MCP/Action in Peters Work-Plan | **unbekannt/blockiert** | Variante B |
| `sw.js`-Cachestrategie (liefert iPad nach Update Fassung 47?) | **unbekannt** (nicht gelesen) | Vorprüfung nötig |
| V2.1-Feldnamen/Enum `source_evidence` | **unbekannt** (Datei nicht lokalisiert) | Atlas liefert Pfad/Version |
| Kostenanzeige, Variante C, Merge/Release | **außerhalb** | Charter |

---

## 4. Wahrheitssemantik

| Zustand | Evidenz, die ihn erzeugt | Was ihn beendet | Darstellung im Original | Grenze |
|---|---|---|---|---|
| **aktiv** | `handoff` (run.started) empfangen, kein beendendes Ereignis | `contribution/artifact` (Ergebnis) oder `stop` | „arbeitet · mm:ss“ + Ring | Bedeutet nur „angenommen, nicht als beendet gemeldet“. Stille ≠ inaktiv: Pro-Agent-Stale gibt es **nicht**; Kanal-Stale übernimmt der Puls. Für später: `tunZeigen` um „letzte Meldung vor X s“ erweitern (Archibald/Nova). |
| **wartend/idle** | kein offener Auftrag | — | Bereitschaftspuls | Nur aus Ereignislage, nie aus Schweigen abgeleitet (Original macht das bereits richtig). |
| **blockiert** | `stop` mit `klasse` (technisch/budget/freigabe/mensch/abhängigkeit) oder `question/open_state` | `resume`, `answer/decision` | Stopper-Ring + Schild mit Grund | Klasse muss aus Quelle kommen (Claude: Permission-Notification → freigabe; Credit-Fehler → budget). |
| **beendet** | `contribution/artifact` mit `verbrauch.belegt` | — | Wurf, Tisch, Kostenzeile ohne Geld | Fehlende Verbrauchsangabe bleibt „keine Kostenangabe“, nie null. |
| **veraltet/unbekannt (Kanal)** | >20 s kein empfangenes Lebenszeichen | neues Lebenszeichen | hohler Punkt + „seit X s“ | A0: Lebenszeichen = erfolgreiche Poll-Antwort (200/304) → sagt „Ablage erreichbar“, nicht „Agent lebt“; Beschriftung in `ablage` macht das sichtbar. |
| **unbekannt (Lauf)** | Host-Liveness fehlt ohne Abschluss | — | **nicht darstellbar** im Original | Lücke; `stop klasse=unbekannt` wäre falsche Aussage („angehalten“). Kandidat für V2.1/Nova. |
| **Provenienz** | `source_evidence` je Ereignis | — | **heute nicht sichtbar** | MVP: kleines Tag in `stromZeile` (z. B. „selbst gemeldet“ / „Laufzeit“); Replay/Fixtures tragen `fictional`/`archiv`. |

---

## 5. Sicherheit, Datenschutz, Ausfall, Beobachtbarkeit, iPad

**Authentizität/Autorisierung.** A0: Marker + **Autoren-Allowlist** (`github-actions[bot]`, Peters Login über den Connector); fremde Kommentare im öffentlichen Issue werden verworfen und im Journal protokolliert. Schwäche: Atlas- und Peter-Kommentare teilen das Login (Selbstbericht). A: Bearer/HMAC je Produzent, Webhook-Signatur, erlaubte `actor`-Menge je Produzent, Lesetoken getrennt von Schreibtoken, kein Befehlspfad (Re-Review §8: Beobachtung = read, Befehle gar nicht implementiert).
**Secrets.** Claude-Subprozess bleibt secretfrei (bestehendes Muster); Ingest-Token nur im Wrapper. Browser: in A0 kein Secret (sofern 304-Regel gilt), sonst fein-granulares Lese-PAT oder Relay-Lesetoken in `localStorage` (einmalige Eingabe über die Marke) — Peter-Entscheidung.
**Datenschutz.** Ereignistitel auf Aufgabenebene, keine Dateiinhalte, keine Tool-Argumente über Pfadkürzel hinaus, keine Tokens. A0 macht alles öffentlich (Issue). Privat erst mit A + Lesetoken.
**Injektion.** F3 beheben; Adapter lehnt Markup ab; `title`-Längenlimit.
**Ausfall/Recovery.** Browser: `visibilitychange`/`online` → Poll/Reconnect mit Cursor (`since` bzw. `Last-Event-ID`), Dedupe-Set, nachgeholte Ereignisse werden im Journal als „nachgeholt“ markiert (das Feld setzt sie auf seine Uhr → Burst; UI-Kennzeichnung später). Produzent: `finally` postet immer ein terminales Ereignis (`stop` mit Grund) — wie der Wrapper es heute für RESULT/BLOCKED tut. Relay: Snapshot + Replay-Puffer; außerhalb des Puffers Snapshot-Reconciliation. Stop-Bedingungen: Ratenlimit 403 → `__agStrom.aus()` + Journal; wiederholt gefälschte Ereignisse → Poll pausieren und melden; Relay nicht erreichbar → „veraltet“, Rückfall Archivmodus.
**Beobachtbarkeit („Monitor des Monitors“).** `window.__agLiveStand()`: letzte N Ereignisse mit `created_at/recorded_at/received_at/angenommen/grund`, Poll-Zähler (200/304/4xx), `X-RateLimit-Remaining`, gemessene Latenz. Relay zusätzlich: Zustellprotokoll, Sequenzlücken, Heartbeat-Ausfälle.
**iPad.** Kein Hover (gelöst); Hintergrund stoppt `requestAnimationFrame` und Netz → Catch-up Pflicht; Safari ITP blockiert Cross-Site-Cookies → in A Header-Auth statt Cookie; `sw.js` kann alte Fassung festhalten → vor der Probe einmalig Fassung ≥47 laden (die Probe selbst bleibt reload-frei); Bildschirmsperre/Guided Access ist Peters Geräteeinstellung; private Fenster ohne `localStorage` werden bereits abgefangen.

---

## 6. MVP-Grenze und gestufter Nachweisplan

**MVP-Kern (unverändert aus Charter):** Original (Fassung ≥47) auf dem iPad, Live gewählt, kein Reload: je ein `progress`-Ereignis von einem **noch laufenden** Claude-Code-Run und von Atlas erscheint sichtbar; Korrelation einer `run_id/event_id` über Quelle → Brücke → Empfang → Hook-Rückgabe → Pixel.

**Bounded Änderungssatz (erst nach Freigabe):**
1. `feld/index.html`: `ARTEN.progress` (gestalt `pfeil`, abgabe 0, nachhall ≈1.2, kraft ≈0.4, `was: 'Zwischenstand – arbeitet noch'`); `__agEreignis` reicht `aufgabe = run_id` und `source_evidence` durch; `stromZeile/melden` escapen `title`, kleines Provenienz-Tag; `<script src="live.js">`.
2. `feld/live.js`: Poll-Quelle, Allowlist, Dedupe, Cursor, Catch-up, Journal, Hook-Anbindung; Quellmodul austauschbar.
3. `relay/<neu>_stream_once.py`: Kopie des Wrappers mit `stream-json`, gedrosselten Ereignis-Kommentaren, terminalem Ereignis im `finally`. Keine Änderung am bestehenden Skript.
Was **nicht** ins MVP gehört: Relay, Webhook, Pro-Agent-Stale, UI-Kennzeichnung „nachgeholt“, Kosten, Mehr-Projekt-Katalog.

**Stufen:**
- **P0 Vorprüfung (ohne Bau):** Scout belegt die Ratenlimit-Regel für bedingte Anfragen und CORS von api.github.com; Atlas liefert V2.1-Datei/Version; jemand mit Lesezugriff prüft `sw.js`-Strategie.
- **P1 Experimente E1–E3** (Abschnitt 9), jeweils als Harness gekennzeichnet, nie als Live-Nachweis.
- **P2 Bau** des Änderungssatzes durch Forge (Autor), getrennte Ausführung/Publikation (Host/Publisher), Pages-Veröffentlichung von Fassung 47 ist eine **Release-Entscheidung** Peters. Zwischenschritt möglich: identischer Code unter `previews/…` publizieren und dort proben; die Abnahme zählt erst auf `feld/`.
- **P3 Sentinel-Nachweis**, Testbediener am iPad ist zwangsläufig Peter (keine Rolle hat iPad-Zugriff); Sentinel liefert Protokoll und verifiziert die Kette über Actions-Logs/GitHub-API/Journal. Kriterien (Vorschlag für Archibald): AC1 Claude-`progress` sichtbar, Actions-Run zu diesem Zeitpunkt `in_progress`, Quellzeile im Log mit derselben `event_id`; AC2 Atlas-`progress` sichtbar, späteres Ereignis derselben `run_id` mit `created_at` > Empfangszeit; AC3 Latenz `received_at − created_at` protokolliert (Klasse ≤15 s bei A0); AC4 Flugmodus 30 s → `data-strom="alt"`, danach Nachholen ohne Duplikate (`liveListe`-Länge = eindeutige IDs); AC5 Fremdkommentar wird verworfen; AC6 Markup im Titel erscheint als Text.
- **P4 Argus-Review** der Evidenzkette.
- **P5 Zielausbau Variante A:** Relay, Webhook, SSE-Quelle, Archiv-Export/Replay, Monitoring; danach ggf. B.

---

## 7. Entscheidungen, die Peter vor der Implementierung treffen muss

| # | Entscheidung | Konsequenz |
|---|---|---|
| D1 | Bounded Änderungen am Original (`progress`, Escaping, Provenienz-Tag, `live.js`) freigeben | Ohne D1 ist das MVP nicht ohne manuelle Injektion erreichbar (G1). |
| D2 | MVP-Transport: **A0** (kein Konto/Secret/Webhook, Latenzklasse 5–15 s, Ereignisse öffentlich) oder **A** sofort (Hosting-Konto, Ingest-Secret in Actions, Webhook am Repo, Push-Latenz) | A0 = schnellster Beweis, Sackgasse für Push; A = Zielweg, mehr Entscheidungen/Betrieb. |
| D3 | Sichtbarkeit: Ereignisse öffentlich (Issue/Relay public read) oder Lesetoken auf dem iPad | Öffentlich: null Secrets, aber jeder liest Aufgabentitel; Token: Secret auf Gerät. |
| D4 | „Original“ = Pages-URL (cross-origin → Header-Auth/öffentlich) oder identische Seite vom Relay-Origin (Cookie-Auth möglich, URL ändert sich) | Betrifft nur A/B. |
| D5 | Kooperative Atlas-Checkpoints (Selbstbericht, gekennzeichnet) als „echte Aktivität“ für das MVP akzeptieren | Ohne D5 ist die ChatGPT-Seite heute blockiert (keine Telemetrie); keine Vollabdeckung behauptet. |
| D6 | Ziel-Latenzklasse: „≤15 s typisch“ (A0) vs. „≤3 s typisch“ (A) — gemessen, nicht versprochen | Bestimmt, ob A0 abnahmefähig ist. |
| D7 | Release von Fassung 47 nach Pages (bzw. Preview-Zwischenschritt) | Ohne Veröffentlichung kein iPad-Nachweis am Original. |
| D8 | Bei A/B: Hosting-Klasse (Edge-Worker mit dauerhaftem Objekt vs. kleiner Container), Region EU, Kontoinhaber Peter, Betrieb koordiniert Atlas | Kosten-/Betriebsverantwortung. |

Technische Detailwahl (stream-json vs. Hooks unter `--bare`) trifft Forge nach E1, nicht Peter.

---

## 8. Schätzung nach Komplexitäts-/Kostenklasse (keine Projektkosten erfunden)

| Paket | Komplexität | Umfang (Code) | Kostenklasse |
|---|---|---|---|
| E1–E3 Experimente | S | Wrapper-Kopie ~50–80 Zeilen, Harness-Seite ~40 Zeilen | 1–3 reale Claude-Code-Läufe; einziger Datenpunkt bisher 0,69 USD für einen Beratungslauf — nicht übertragbar |
| MVP A0 (Änderungssatz + live.js + Wrapper) | S–M | index.html ~40–60 Zeilen Δ, live.js ~150–250, Wrapper ~60–100 | Implementierungs-/Review-Läufe; Hosting 0 |
| Sentinel-Nachweis + Argus-Review | S | Protokolle | LLM-Läufe; Peters iPad-Zeit |
| Variante A Relay (Ingest, Store, SSE, Heartbeat, Snapshot, Export, Webhook) | M–L | ~500–900 Zeilen + Konfiguration | Hosting null bis niedrig einstellig €/Monat (**zu verifizieren**), Betrieb laufend |
| Variante B (MCP-Server + Connector) | +M | ~200–400 | zusätzlich Nachweis der Plan-Fähigkeit |
| Variante C | XL | Neuaufbau Ausführungsschicht | API-Kosten GPT-Rollen laufend |

Forecast, keine Zusage; getrennt zu erfassen: Modellzeit vs. Warte-/Transport-/Reviewzeit.

---

## 9. Kleinstes entscheidendes Experiment je kritischer Unbekannter

| Unbekannte | Experiment | Erwartete Evidenz | Weiter/Ändern/Stopp |
|---|---|---|---|
| U1 Claude-Zwischenereignis unter `--bare -p` | E1: Wrapper-Kopie mit `--output-format stream-json` (ggf. `--verbose`) auf einer **realen** kleinen Aufgabe; bei erstem `tool_use` Kommentar posten | Kommentar `created_at` < Run-Ende; Actions-Log zeigt Zeile; Run `in_progress` zum Zeitpunkt | kein Stream → Hooks via `--settings` testen; beides nicht → Wrapper-Heartbeat als `host_observed` |
| U2 Atlas Mid-Turn-Write + Fortsetzung | E2: Atlas postet im laufenden Turn einen Checkpoint, führt dann mindestens eine weitere Aktion aus und postet Abschluss | zwei Kommentare derselben `run_id`, Zeitstempel geordnet, Turn nicht abgebrochen | scheitert → Atlas-Quelle nur Start/Ende; B/C prüfen |
| U3 iPad-CORS/304/Ratenlimit | E3: Harness-Seite (kein Produkt) auf dem iPad pollt 10 Minuten bedingt; Header `X-RateLimit-Remaining` protokollieren | Remaining sinkt nur bei 200 | sinkt bei 304 → Lesetoken (D3) oder A |
| U4 Hintergrund/Resume iPad | E3b: App 2 Minuten in Hintergrund, zurück | Catch-up ohne Duplikate, Stale-Anzeige währenddessen | — |
| U5 Webhook-Latenz (A) | Testempfänger (Harness) + echter Kommentar | Zustellzeit gemessen | >10 s regelmäßig → Ingest direkt vom Connector/B |
| U6 Visuelle Semantik `progress` | Lokal (Harness) `__agEreignis({kind:'progress',…})` ohne/mit `recipient` | kein `auftragFertig`, kein Stopper, Puls am Platz | sonst Gestalt anpassen |
| U7 `sw.js` liefert neue Fassung | Nach Deploy `agFassung` im iPad prüfen | „Fassung 47“ sichtbar | sonst Cache-Strategie anpassen (bounded) |

---

## Nächster Eigentümer und Status

- **Atlas:** Entscheidungsvorlage D1–D8 an Peter; Pfad/Version des V2.1-Vertrags nachliefern; Scout mit Quellenbeleg zu U3 und CORS beauftragen; Archibald für die MVP-Spezifikation aus Abschnitt 6 (AC1–AC6) und Nova für Provenienz-Tag/„nachgeholt“-Kennzeichnung einbinden; Sentinel für das Nachweisprotokoll inkl. Peters iPad-Rolle.
- **Forge:** bereit für E1 (Wrapper-Kopie) und den Änderungssatz **nach** D1/D2 und expliziter Bau-Instruktion. Keine Implementierung in dieser Sitzung.
- **Argus:** Delta-Review dieser ADR, insbesondere der Dissens zu Polling-MVP und der Einstufung kooperativer Checkpoints.

Nichts hier ist eine Laufzeitbeobachtung außer dem Lesen der genannten Dateien; alle Latenzen sind Klassen, keine Zusagen; Tests NOT_RUN.