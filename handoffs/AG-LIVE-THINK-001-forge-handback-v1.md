# Forge original handback — AG-LIVE-THINK-001 V1

Saved unchanged by Atlas from https://github.com/pahlborn/agentarium/issues/2#issuecomment-6230703261. This is advice, not an implementation or an acceptance. Original comment created 2026-10-17T06:30:37Z.

## AG-LIVE-THINK-001-FORGE-V1 — RESULT_READY / STOPPED
```json
{
  "task_id": "AG-LIVE-THINK-001-FORGE-V1",
  "source_commit": "55bb6997503284cfb77c0a50bb4905240b3b13b4",
  "request_commit": "37ab240bc9ef3134eb95e84575ba99af9c49bf35",
  "definition_blob": "38d9747018bd4bfc5299a2dd9aeded9659337e77",
  "run": "https://github.com/pahlborn/agentarium/actions/runs/39010014333",
  "cli_version": "2.1.302 (Claude Code)",
  "requested_model": "best",
  "requested_effort": "xhigh",
  "actual_reasoning": "unconfirmed",
  "session_id": "5395c67d-c99c-48f1-9389-62a0fe6fe17a",
  "modelUsage": {
    "claude-fable-5-1": {
      "inputTokens": 10,
      "outputTokens": 9251,
      "cacheReadInputTokens": 36977,
      "cacheCreationInputTokens": 17519,
      "webSearchRequests": 0,
      "costUSD": 0.6908817500000001,
      "contextWindow": 1000000,
      "maxOutputTokens": 64000,
      "thinkingTokens": 4629,
      "canonicalModel": "claude-fable-5-1",
      "provider": "firstParty",
      "costBasis": "list"
    }
  },
  "usage": {
    "input_tokens": 10,
    "cache_creation_input_tokens": 17519,
    "cache_read_input_tokens": 36977,
    "output_tokens": 9251,
    "output_tokens_details": {
      "thinking_tokens": 4629
    },
    "server_tool_use": {
      "web_search_requests": 0,
      "web_fetch_requests": 0
    },
    "service_tier": "standard",
    "cache_creation": {
      "ephemeral_1h_input_tokens": 0,
      "ephemeral_5m_input_tokens": 17519
    },
    "inference_geo": "global",
    "iterations": [
      {
        "input_tokens": 2,
        "output_tokens": 7361,
        "cache_read_input_tokens": 16764,
        "cache_creation_input_tokens": 755,
        "cache_creation": {
          "ephemeral_5m_input_tokens": 755,
          "ephemeral_1h_input_tokens": 0
        },
        "type": "message"
      }
    ],
    "speed": "standard",
    "fallback_credit": null
  },
  "num_turns": 15,
  "total_cost_usd": 0.6908817500000001,
  "execution": {
    "kind": "SUCCESS",
    "detail": "SUCCESS",
    "returncode": 0,
    "elapsed_seconds": 135.776,
    "timeout_seconds": 900,
    "stdout_bytes": 8963,
    "stderr_bytes": 0,
    "stdout_sha256": "36395c2774c19c712f8cabe1e55a3538504b813e08f919ac15bc9599b1f07ef7",
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
**CA_ADVICE — AG-LIVE-THINK-001-FORGE-V1** (Baseline 55bb6997, read-only, keine Tests, kein Code)

**Quellenlage.** Gelesen: AGENTS.md, Rulebook 1.2, Process 1.2, Practice v1, team-input-v1. **Nicht gelesen:** Claude-Host (`run_json`), Pages-Monitor, Workflows – im Checkout `/tmp/forge-live-thinking-4g9dav99` nicht vorhanden (kein `.github/`, kein Glob/Grep verfügbar). Aussagen dazu stützen sich auf die Handoff-Fakten (= Bericht, nicht meine Beobachtung). Mein Laufzeitmodell ist mir nicht bekannt; Beweis nur über `modelUsage`.

## 1. Ziel, neu geschnitten

Peters Ziel ist nicht „schneller Kanal", sondern: **Arbeit erzeugt während ihres Laufs beobachtbare Ereignisse, die einen Weg nach draußen haben.** Drei getrennte Schichten: (a) *Entstehung* im Runtime, (b) *Publikation/Pfad* aus der Sandbox heraus, (c) *Darstellung inkl. Frische-Semantik* im Original. Das Team diskutiert überwiegend (b). **Lösen wir das falsche Problem?** Teilweise ja: Der entscheidende Engpass ist (a)+(b) auf der **ChatGPT-Seite** – dort ist bis heute weder Emission während der Arbeit noch Netzwerk-/Schreibzugriff demonstriert. Jede Transport-Diskussion davor ist verfrüht. Meine frühere Verengung „60 s oder neues Relay" ziehe ich zurück; Argus hat recht: ein Relay erzeugt keine Quelle.

Zur 60/h-Frage, sauber getrennt: **Fakt** – GitHub REST unauthentifiziert 60/h/IP, damit nachhaltiges 5-s-Polling ausgeschlossen. **Fakt** – authentifiziert 5000/h, 5-s-Polling (720/h) passt. **Zu prüfen** – statische Abrufe (Pages/raw) unterliegen nicht dem REST-Limit, aber CDN-Caching (Minuten), das Frische begrenzt. Keine Sekundenzusage ohne Messung.

## 2. Vier vollständige Routen

**Route A – Claude-Host als Quelle, GitHub als Pfad (heutige Mittel).**
Quelle: Host unter unserer Kontrolle; statt `capture_output` entweder Lifecycle-Hooks (PostToolUse/SubagentStart/Stop) oder Streaming-Ausgabe der CLI, die der Host **während** des Jobs liest. Publisher: derselbe Job via `GITHUB_TOKEN` (Append an Ereignisdatei/Issue-Kommentar). Transport: Viewer pollt GitHub. Monitor: vorhandenes `__agEreignis/__agLauf`. Voraussetzung: Host-Änderung (separat zu autorisieren). Blocker/Unbekannt: Pages-/raw-Cache-Latenz; deckt **nur** Claude-Jobs ab, zwischen Jobs Stille.

**Route B – Orchestrierung als Quelle (ChatGPT-Abdeckung).**
Atlas' spawn/followup/send_message/Returns und `list_agents`-Status sind heute die **einzigen** beobachtbaren ChatGPT-Fakten. Atlas schreibt jede Grenze **im Moment ihres Auftretens** über den Schreibweg, den er bereits für Dispatches nutzt (vermutlich GitHub-Connector – von mir nicht verifiziert). Publisher = Atlas-Runtime. Transport/Monitor wie A. Entscheidende Unbekannte: **Kann Atlas schreiben, während ein Kind noch läuft** (ist spawn blockierend?). Falls nein, kollabiert B auf „Auftrag/Ergebnis" – immer noch ehrlich, aber nicht live. Innenleben der Kinder bleibt dunkel; der Monitor muss „läuft seit T, keine Telemetrie" zeigen, nie „inaktiv".

**Route C – gemeinsamer Tool-/MCP-Endpunkt als Emitter.**
Ein identisches Tool `ag_report` für alle Runtimes; bei Claude zusätzlich automatisch über Hooks befeuert (echte Tool-Grenzen, kein Selbstbericht). Push-Semantik, Monitor per SSE/Abonnement, Archiv als getrennter Append-Log. Voraussetzungen: gehosteter Empfänger (neue Infrastruktur, Secrets, Auth), Netzausgang des Actions-Runners (vorhanden). Blocker: ChatGPT-Kinder haben laut Scout keinen dokumentierten Zugriff auf einen beliebigen Connector – C deckt dort nur die Atlas-Ebene. **Konkret für Claude, nicht demonstriert für ChatGPT.** C ist Konvergenzziel, nicht Bootstrap.

**Route D – radikal: Ausführung in einen beobachtbaren Kern.**
GPT-Rollen über Agents SDK, Claude-Rollen über Agent SDK, beide in einem von uns kontrollierten Prozess; Streaming/Tracing sind offiziell dokumentiert. Quelle, Publisher und Transport fallen zusammen; vollständige, einheitliche Beobachtbarkeit. Preis: Atlas ist nicht mehr „ChatGPT Work" (andere Tools, API-Kosten statt Abo, andere Interaktionsfläche für Peter), dauerhaft laufender Host nötig. Ich stelle D dar, empfehle es aber **nicht** als ersten Schritt – das wäre der Produktumbau, den Peter nicht vorgeschrieben haben will.

## 3. Antworten auf die Leitfragen

- **Hooks nötig?** Nein. Für Claude sind Hooks *oder* Stream-Parsing zwei unabhängige Wege; Hooks liefern Tool-Granularität ohne Parsen. Für ChatGPT existieren keine Hooks – dort sind Orchestrierungsgrenzen die Quelle.
- **Orchestrierung als Quelle?** Ja, und für ChatGPT Work derzeit die einzige. Es sind reale Grenzereignisse, aber keine Telemetrie.
- **Beobachtbarkeitsverlust** muss als eigener Zustand modelliert werden: *frisch* (Ereignis < Schwelle), *stale* (letzter Stand „läuft", nichts Neues), *unbekannt* (Pfad gestört, Fetch fehlgeschlagen), *beendet*. Drei Zeitstempel getrennt: erzeugt / publiziert / empfangen. Archiv = Append-Log (commit-basiert); Live = dessen Tail; nie dasselbe Artefakt umdefinieren.

## 4. Empfehlung

**A + B jetzt als ein Pfad, C als Konvergenz, D nur falls B strukturell scheitert.** Begründung: Beide Seiten nutzen denselben Append-Log, dasselbe Ereignisschema und den vorhandenen Monitor-Ingest; es entsteht keine Parallelinfrastruktur, und die Unterscheidung „beobachtete Tool-Grenze (Claude)" vs. „berichtete Orchestrierungsgrenze (ChatGPT)" wird im Schema explizit.

**Hauptnachteil:** Die ChatGPT-Innenaktivität bleibt dunkel, die Latenz ist durch Polling + GitHub-Propagation bestimmt (eher Zehner-Sekunden bis Minuten, ungemessen), und B hängt an einer unbestätigten Fähigkeit. Peter bekommt ehrliche Zustände, keine lückenlose Aktivität.

**Wiederverwendet:** `__agEreignis/__agLauf`-Ingest, Ereignisschema des Ein-Ereignis-Piloten, der Host (als Änderungsort), Sentinels Störungsprobe (öffnen → Arbeit unabhängig starten → Beobachtung unterbrechen → beenden → wiederherstellen), Scouts Toolvertrags-Fakten.

**Zum Team:** Nova/Argus/Sentinel konvergieren richtig auf „Quelle vor Kanal". Ich widerspreche Argus' Reihenfolge „Runner/Hooks zuerst": Das ist die *leichte* Seite und bereits am besten beobachtbar. Wird sie zuerst gebaut, droht erneut „Claude sichtbar, ChatGPT dunkel". Die billigste entscheidende Probe liegt auf der ChatGPT-Seite.

## 5. Kleinste diskriminierende Frage vor jedem Code

**Kann Atlas' ChatGPT-Runtime während eines noch laufenden Kind-Agenten (spawn nicht zurückgekehrt) einen beobachtbaren externen Write (z. B. GitHub-Kommentar mit Zeitstempel) ausführen – ja/nein?**
Ja → B ist tragfähig, A folgt als autorisierte Host-Änderung. Nein → ChatGPT ist nur an Auftrag/Ergebnis-Grenzen beobachtbar; dann ist C/D eine Peter-Entscheidung, kein Engineering-Detail. Sekundärfrage für A (erst danach): gemessene Zeit vom Host-Write bis zur Sichtbarkeit im offenen Original bei laufendem Job.

**Nächster Eigentümer:** Atlas – Probe arrangieren, keine Implementation durch mich. Status: CA_ADVICE, NOT_RUN, keine Produktänderung.
