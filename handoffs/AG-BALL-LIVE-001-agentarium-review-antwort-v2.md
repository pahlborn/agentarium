# AG-BALL-LIVE-001 — Review des Agentarium-Agenten, Version 2

Auftrag: `AG-BALL-LIVE-001-AGENTARIUM-REVIEW-V2-REQUEST` (Version 1),
`handoffs/AG-BALL-LIVE-001-agentarium-review-rereview-v1.{md,json}` auf
`agent/ball-live-concept-20261017` @ `122175887fd32d3ac8e0e6fdf8a06db4f4b72f6f`
Erstellt: 2026-10-17, Claude-Sitzung `session_01TdPruhwQJQmUhE6HguQ9D7`. Die
Uhrzeit dieser Fassung ist die Commit- bzw. Ablagezeit; im Text steht keine
selbst gesetzte Zeitangabe.
Status: **REVIEW_ONLY — nichts implementiert, kein Patch angewandt, kein
Produktzweig geändert, nichts gemergt, veröffentlicht oder deployt.**

Geprüfte Stände:

| Zweck | Commit |
|---|---|
| Produkt-Baseline (Original + c1) | `c7a8da04d9b06d83edcd110f210c0cf84d4aa8ba` |
| Produkt `main`, Fassung 47 ohne Live | `d111b062770e32dbef0f9bb618a4923d88ff20be` |
| Generator Fassung 47 | `61d0229` (`previews/AG-VISUAL-005-feld/schicht.py`) |
| Review V1 | `1dd40dfe7b7101f67bf682ceb689223aa9c47f0b` |
| Patch c2 | `forge-original-c2.patch`, SHA-256 `0abe225d…036bc` (nachgerechnet) |

**Wer schreibt:** V1 entstand in einer anderen Claude-Sitzung
(`session_01SvS2FzU7U5JmX6fr8JAfPo`). Diese Fassung prüft V1 neu, statt sie
fortzuschreiben, und widerruft ausdrücklich, was nicht trägt.

**Reihenfolge nach Prozesshinweis §6:** Zuerst Start- und Ereignisweg (§2),
erst danach Layout (§3) und iPad (§5).

---

## 0. Widerrufe und Korrekturen gegenüber V1

| # | Aussage in V1 | Befund V2 |
|---|---|---|
| K-1 | Eingabe `agentarium.html` | **Existiert nicht.** Die Eingabe ist `previews/AG-VISUAL-005-feld/resonanz-maschine.html`. |
| K-2 | `mess-spanne.js`, `mess-namen.js` als Prüfwerkzeuge | **Existieren an keinem gepinnten Commit.** Als Testvoraussetzung widerrufen; §3 definiert die Messprobe neu. |
| K-3 | „Generator 46, Produkt 47: bereits auseinandergelaufen“ | **Falscher Zweig.** 46 gilt nur für `claude/agentarium-visualisierung`. Der Generator auf `61d0229` steht bei 47 und erzeugt `main:feld/index.html` und `main:feld/sw.js` bitgleich (bis auf `GEBAUT`), siehe §1.2. Belegt ist die Divergenz der Live-Arbeit (c1/c2 nur in `feld/`), kein bereits erfolgter Löschvorgang. |
| K-4 | „Fassungsteilung c2/c1 korrekt, kein Befund“ | **Falsch, Blocker.** Der unveränderte Server startet mit c2 nicht, reproduziert in §2.1. |
| K-5 | Ringkollision als Tatsache | **Ungemessen.** Plausible Abhängigkeit, Wirkung offen (§3). Auch die Lösung `kopfUnten()` → `#agKopf` ist zurückgezogen. |
| K-6 | GitHub-Kommentar-Polling 1 Hz als Livepilot | **Verworfen** (§4). |
| K-7 | „Läufe dauern 8–24 s“ | **Falsch.** Der belegte Forge-c2-Lauf dauerte 350,419 s (`forge-metadata.json`). |
| K-8 | „Laufbeginn wird bemerkt, weil Peter ihn auslöst“ | **Unzulässig** als Liveerkennung autonomer Arbeit. |
| K-9 | Gehostetes Relay „etwa 4 €/Monat“ | **Unbelegt, widerrufen.** Kosten stehen unter Peters Entscheidungen, ohne erfundenen Betrag. |
| K-10 | Zeitstempel `2026-10-17T07:30:00Z` | **Ohne Beleg.** Der Commit ist um `16:18:42Z` entstanden. Woher 07:30Z stammt, ist in V1 nicht belegt und von hier nicht nachprüfbar. Maßgeblich ist die Commit-Zeit. |

---

## 1. Korrigierte Baukette

### 1.1 Tatsächliche Kette (nachgebaut, nicht nur gelesen)

```
previews/AG-VISUAL-005-feld/resonanz-maschine.html   CSS, DOM (u. a. #agRechts, #agKopf)
  + schicht.py  SKRIPT, AGENTEN, ARTEN, FASSUNG, kopfUnten(), __agEreignis …
  + Stücke: [ereignisse-v1.json, ereignisse-v2.json]
      └─ schicht.bauen(quelle, 'agentarium-fertig.html', stuecke)
             └─ pages.py <ZIEL>     (erwartet icon-{120,152,180,192,512}.png im Arbeitsverzeichnis)
                    → <ZIEL>/index.html, sw.js, manifest.webmanifest, icon-*.png
```

### 1.2 Nachweis

Isoliert im Scratchpad gebaut, ohne Repository-Änderung:
`schicht.py`, `resonanz-maschine.html` und `pages.py` von `61d0229`, Stücke =
die beiden `ereignisse-v*.json` (inhaltsgleich mit `STUECKE` im Produkt),
Icons aus `main:feld/`.

- `index.html`: identisch mit `main:feld/index.html`, nachdem `GEBAUT = '…'`
  normalisiert wurde.
- `sw.js`: bytegleich mit `main:feld/sw.js`.

Die Fassung 47 ist also **reproduzierbar**. Drei Lücken der Baukette:

| Lücke | Folge |
|---|---|
| L-1 Kein eingecheckter Aufruf von `bauen()`. Welche Stücke in welcher Reihenfolge eingebaut werden, steht nirgends im Repository. | Ein Neubau hängt vom Gedächtnis ab. |
| L-2 `pages.py` führt `shutil.rmtree(ZIEL)` aus. | Ein Bau nach `feld/` löscht **`feld/live.js` und `feld/one-event.json`**. Beide hat kein Generator erzeugt. |
| L-3 Generator und Produkt liegen auf verschiedenen Zweigen. `c7a8da04` enthält kein `previews/`, und `61d0229` enthält kein `feld/live.js` und keinen Server. | Keine Quelle der Wahrheit für die Live-Erweiterung. |

### 1.3 Vollständige dauerhafte Quellzuordnung (für die spätere Umsetzung)

Grundlage sind c1 in `c7a8da04:feld/index.html` und das c2-Delta.

| Bestandteil | Dauerhafte Quelle |
|---|---|
| CSS der Tafel und Impulsebene (`#agBallLive`, `#agImpulse`, `.agImpuls`) | `resonanz-maschine.html` (dort steht das übrige Feld-CSS) |
| DOM-Anker, falls statisch nötig | `resonanz-maschine.html` (`#agRechts` steht dort) |
| `BALL_LIVE`, `BALL_LIVE_FASSUNG`, Kandidatenkennung | `schicht.py` → `SKRIPT` |
| Aktivierungs- und Ladeblock `?ball_live=1` (`__agBallLiveErwartet`, `live.js?v=…`) | `schicht.py` → `SKRIPT` |
| `ARTEN.progress` | `schicht.py` → Python-Dict `ARTEN` (wird als `__ARTEN__` eingesetzt) |
| Namensanker `data-ag` | `schicht.py` → `SKRIPT` (Namensschild-Erzeugung) |
| `arbeitsImpuls()` und sein Aufruf im `progress`-Zweig | `schicht.py` → `SKRIPT` |
| Service-Worker-Ausnahme (`live.js` und der Livestrom nicht aus dem Vorrat; SSE-Pfad nie über `v.put`) | `pages.py` → `sw`-Vorlage |
| `live.js` | neu: `previews/AG-VISUAL-005-feld/live.js`; `pages.py` kopiert sie nach `<ZIEL>` |
| `one-event.json` | ebenfalls in `previews/…` ablegen und von `pages.py` kopieren, sonst löscht L-2 sie |
| Bauaufruf (L-1) | neu: `previews/AG-VISUAL-005-feld/bauen.py` mit fester Stückliste |

**Abnahme der Baukette:**

- (a) Ein Neubau ohne Live-Erweiterung ist gegen `main:feld/` bitgleich (bis auf `GEBAUT`).
- (b) Ein Neubau mit Live-Erweiterung ergibt ohne `?ball_live=1` dasselbe Verhalten wie (a). Peters Prämisse wird so gemessen.
- (c) `feld/live.js` und `feld/one-event.json` sind nach dem Bau vorhanden.
- (d) Fehlerprobe: eine absichtlich nur in `feld/` gesetzte Änderung verschwindet beim Neubau. Damit ist gezeigt, dass Prüfung (a) anschlägt.

---

## 2. Korrigierter Versionsvertrag

### 2.1 Blocker reproduziert

Beide Proben liefen auf Scratch-Kopien von `c7a8da04`.

- **Unverändertes c1:** Der Server läuft bis zum Abbruch durch `timeout` (Exit 124).
- **c2-Patch angewandt** (`git apply` sauber): Der Server bricht sofort ab, mit Exit 2 und
  `{"event":"ERROR","version":"AG-BALL-LIVE-001-c1","error":"version marker AG-BALL-LIVE-001-c1 missing in …/feld/index.html: refusing mixed versions"}`.
  Das geschieht vor `READY` und damit lange vor `hello`.
- Ursache: Der Guard (`local_server.py`, Z. 441–449) verlangt sein eigenes Literal in **beiden** Dateien. c2 enthält es nur noch in `live.js` (als `SERVER_VERSION`).

### 2.2 Drei explizite Versionen

| Version | Beispiel | Eigentümer | Wo deklariert | Wer prüft |
|---|---|---|---|---|
| **Seitenfassung** `PAGE` | `48` | Generator | `schicht.py` `FASSUNG`; `sw.js`-Vorrat `agentarium-v48` | Anzeige; SW-Vorrat |
| **Clientfassung** `CLIENT` | `AG-BALL-LIVE-001-c2` | Live-Erweiterung | Seite: `BALL_LIVE_FASSUNG`; `live.js`: `CLIENT_VERSION` | `live.js` gegen `__agBallLiveErwartet` (besteht) **und** Server beim Start |
| **Protokollfassung** `PROTO` | `ag-ball-live-proto-1` | Server | Server: `PROTOCOL`; `live.js`: `PROTOCOLS_ACCEPTED = [..]` | Server beim Start; `live.js` beim `hello` |

**Serverguard neu (statt Literalsuche):**

1. In `index.html` wird `BALL_LIVE_FASSUNG = '<CLIENT>'` gelesen, in `live.js` `CLIENT_VERSION = '<CLIENT>'`. Fehlt eines oder sind sie ungleich, folgt `ERROR client_mismatch` (Exit 2).
2. `PROTO` des Servers muss in `PROTOCOLS_ACCEPTED` aus `live.js` stehen, sonst `ERROR protocol_unsupported`.
3. `READY`, `/health`, `hello` und der Header melden alle drei Werte getrennt: `page`, `client`, `protocol`.
4. `live.js` vergleicht beim `hello` nur noch `protocol`, nicht mehr die Fassung des Servers.

### 2.3 Minimaler späterer Datei- und Testumfang

- **Dateien:**
  - `pilot/AG-BALL-LIVE-001/local_server.py` (Guard und Meldungen)
  - `previews/AG-VISUAL-005-feld/live.js` (Konstanten und `hello`-Prüfung)
  - `schicht.py` (eine Konstante)
  - `tests/AG-BALL-LIVE-001-local-live.cjs`
- **Tests:**
  - **T-V1** echter Serverstart auf der *gebauten* Fassung, Browserverbindung, `hello`, ein angenommenes `progress`.
  - **T-V2** `CLIENT` ungleich zwischen Seite und `live.js`: Der Server verweigert vor `READY` mit `client_mismatch`.
  - **T-V3** `PROTO` nicht akzeptiert: `live.js` verweigert sichtbar und verbindet nicht.
  - **T-V4** Regressionsfixture: c2-Seite mit c1-Server-Literal. Sie muss mit dem **alten** Guard rot und mit dem neuen grün sein. Das ist die Gegenprobe nach Regel 6.

---

## 3. Geometrie: ungemessen, Messprobe vor jeder Lösung

### 3.1 Was belegt ist

`ringR()` setzt den Ringradius auf `max(klein() ? 30 : 56, min(breit/2.34, hoch))`.
`kopfUnten()` (Unterkante `#agRechts`) geht **nur** bei `schmal()` (`W() < 560`)
in `hoch` ein. Ob ein höheres `#agRechts` den Ring verkleinert, hängt vom
Breitenlimit `breit/2.34` und vom Mindestwert ab. Eine Kollision ist **nicht
gemessen**, und keine Lösung ist gewählt.

### 3.2 Reproduzierbare Messprobe `MP-GEO-1`

Die Probe läuft vor der Lösungswahl, auf der gebauten Fassung, ohne Produktänderung.

| Punkt | Festlegung |
|---|---|
| Umgebung | Playwright mit dem vorhandenen Chromium. Lokaler Server T-V1 bzw. für den Zustand „ohne Live“ statisch. Chromium misst Layout, nicht Safari. |
| Größen | Peters tatsächliche Geräte und Fenster. Die Liste liefert Peter (iPad-Modell, Ausrichtung, Split View, ggf. Telefon). Bis dahin dienen 390×844, 1024×1366, 1280×800 aus Forges c2-Test als Platzhalter und werden als solche markiert. |
| Zustände | Z0 ohne `?ball_live=1`; Z1 Live, Tafel zu; Z2 Live, Tafel auf mit der höchsten erreichbaren Zeilenzahl |
| Messwerte je Größe und Zustand | `kopfUnten()`; effektiver Radius (Mittelpunktabstand der Namensschilder vom Feldmittelpunkt); paarweise Überdeckung der 9 Namensschilder; Überdeckung Tafel ↔ Liste, Ring und Knopfleiste; `scrollWidth > innerWidth` |
| Ausgabe | JSON je Lauf mit Commit, Größe, Zustand und Werten; Screenshot je Fall; SHA-256 |
| Fehlerprobe | Ein absichtlich verschobenes Namensschild muss als Überdeckung gemeldet werden, sonst ist die Probe wertlos (Regel 6). |
| Entscheidung danach | Erst mit den Messwerten wird die kleinste Korrektur gewählt (Tafel-Platz, `kopfUnten`-Bezug, Höhenbegrenzung). Eine Schwelle für zulässige Radiusabnahme lege ich nicht fest: Null Überdeckungen ist der bisherige Maßstab, eine Radiustoleranz entscheidet Atlas. |
| Grenze | Kein iPad-PASS aus Chromium. Echte Geräteprobe nur in §5 Schritt D. |

---

## 4. GitHub-Kommentar-Polling: als Livearchitektur verworfen

Gründe (Scout-Messung und Primärquellen):

- anonym 60 Requests pro Stunde und IP gegen 3.600 bei 1 Hz;
- auch `304` zählt;
- `max-age=60`;
- Token im Browser nicht vertretbar;
- iOS drosselt Hintergrund-Tabs;
- vor allem: Die Relays erzeugen nur `HOST_RECEIVED` und `RESULT_READY`, keinen Arbeitsstrom.

**Falls GitHub als enger Transportversuch bleibt** (Name: `TV-GH-1`, ausdrücklich kein Livepilot):

| | |
|---|---|
| Rate | höchstens 1 Abruf je 60 s, nur im Vordergrund, ein Gerät je IP. Ehrliche Auflösung: 60 bis 120 s. |
| Cache | `If-None-Match`/ETag. Die Anzeige nennt das Alter der Antwort (`Date` minus `max-age`). |
| Rate-Limit-Stopp | Bei `X-RateLimit-Remaining` ≤ 5 oder Status 403/429: Abrufe einstellen und „Abrufgrenze bis hh:mm“ anzeigen (`X-RateLimit-Reset`). |
| Felder | nur `comment.id`, `created_at`, Login-Allowlist, Signalkopf (`HOST_RECEIVED`/`RESULT_READY`/`BLOCKED`) und Task-ID. Kein Freitext, kein Titel, keine Kosten. |
| Auth | keine. Kein Token, auch nicht in `localStorage`. |
| Aussage | höchstens „Start/Ende eines Laufs wurde mit ≥ 60 s Verzug gesehen“, nie „Live“ |

---

## 5. Vollständige Kette für den eigentlichen Pilot

**Offen gesagt: Ohne ein kleines gehostetes Relay gibt es keinen
vollständigen Livepilot.** Die Spezifikation V3
(`specifications/AG-BALL-LIVE-001-mvp-spezifikation-v3.md`) beschreibt diese
Kette bereits mit ST1–ST5. Ich empfehle, darauf aufzusetzen, statt einen
dritten Weg zu erfinden.

### 5.1 Kette

```
A) Claude (Forge/Archibald/Cadence, GitHub Actions)
   claude -p … --output-format stream-json --verbose    (Spec FR-2.1; in relay/claude_stream_diagnostics.py
                                                         liest das Repo diesen Strom bereits zeilenweise)
   je tool_use-Zeile → progress "Werkzeug <Allowlist-Name> · Schritt n" (≤ 1 je 10 s)
   ─ Alternative: PostToolUse-Hook vom Typ "http" (Claude-Code-Hooks), gleicher Datensatz
B) ChatGPT-Subagent (Atlas/Nova/Scout/Argus/Sentinel)        → siehe 5.2, offene Lücke
        ↓
normalisierter V2.1-`arbeitsereignis` im `umschlag_fach`
  (id, project_id, run_id, actor, kind=progress, title, occurred_at=Wrapper-Uhr, recorded_at=Relay,
   fictional=false, caused_by, source_evidence ∈ {runtime_stream, runtime_hook, reported_checkpoint})
        ↓  HTTPS POST, HMAC je Producer (Spec FR-1.2), Spool mit Wiederholung (FR-2.5)
gehostetes Relay: Validierung, append-only Journal, Dedupe (Spec §4.4, §4.6)
        ↓  GET /v1/streams/{p}/{r}/events?after=n, SSE über fetch-Streaming, Herzschlag 5 s (FR-4.2)
bereits geöffneter Monitor auf dem iPad: https://pahlborn.github.io/agentarium/feld/?live=1&run=R
        ↓  live.js → __agEreignis → genau ein arbeitsImpuls am Namen, korrelierbar über id/seq
```

### 5.2 Die ChatGPT-Seite: eine exakte Belegsperre

- Für ChatGPT-Agenten in der ChatGPT-App habe ich **keinen dokumentierten
  ausgehenden Ereignisstrom einzelner Werkzeugaufrufe** gefunden. Die
  offizielle Workspace-Agents-API ist ein *eingehender* Auslöser, kein Export.
- Damit gibt es heute nur zwei ehrliche Produzenten:
  - **B-1 Selbstauskunft:** Atlas oder ein Work-Kind schreibt mitten im Auftrag einen Checkpoint als Issue-Kommentar. Ein GitHub-Webhook liefert ihn ans Relay (Spec ST3, `reported_checkpoint`).
    - Der Kommentar ist eine echte ChatGPT-Aktion, aber selbst gemeldet und keine Laufzeitbeobachtung.
    - GitHub-Webhooks: 10 s Antwortfenster, **keine automatische Neuzustellung**, deshalb der Abgleich nach Spec §9.
  - **B-2 Laufzeitbeobachtung:** nur für einen ChatGPT/OpenAI-Agenten, der über die API mit dem OpenAI Agents SDK unter unserer Kontrolle läuft.
    - Ein eigener `TracingProcessor` (`on_span_start`/`on_span_end`) kann Werkzeug-Spans beim Auftreten ans Relay senden.
    - Der eingebaute Batch-Export sendet nur „alle paar Sekunden“; für Live braucht es den eigenen Prozessor.
    - Ob Forge oder ein anderer Agent heute so betrieben wird, ist im Repository nicht belegt. Laut Peter wird Forge aus ChatGPT über eine API angesteuert; der Weg muss benannt werden, bevor B-2 geplant wird.
- **Folge:** Das geforderte „reale ChatGPT-Subagentenereignis“ lässt sich als
  *Laufzeitbeobachtung* derzeit nicht zusagen. Zulässig ist entweder B-1 mit
  sichtbarer Kennzeichnung „selbst gemeldet“, also eine Absenkung des
  Liveziels, über die Peter entscheidet, oder B-2 nach Klärung des
  API-Betriebs.

### 5.3 Rahmen

| Punkt | Festlegung / Stand |
|---|---|
| Latenzziel | Teamvorschlag aus Spec §2.2 (H-E1), gemessen als `M5 − M1`: Claude Median ≤ 5 s, Max ≤ 15 s; Work/Webhook Median ≤ 10 s, Max ≤ 30 s. Die Schwellen entscheidet Peter (D-P3), hier ist nichts neu erfunden. |
| Authentifizierung | Ingest: HMAC-SHA256 je Producer, Zeitfenster 300 s, Schlüssel nur im Wrapper, nicht in der Subprozess-Umgebung (FR-1.2, FR-2.4). Webhook: `X-Hub-Signature-256`. Lesen: Variante (a) öffentlich ohne Token **oder** (b) privat mit Lesezugang auf dem iPad (Risiko, s. u.). Nie ein GitHub-Token im Browser. |
| Betrieb | Das Relay läuft mindestens während der Läufe; Journal append-only; SSE-Rotation 10 min; Health-Endpunkt. Wer Hoster und Rufbereitschaft stellt, ist offen. |
| Datenschutz | Nur Allowlist-Felder: Rolle, Art, Werkzeugname aus der Allowlist, Schrittzähler, Zeiten, IDs. Kein Prompt, keine Dateipfade, keine Ausgaben. In Variante (a) sind Aufgabentitel öffentlich. |
| Kosten | Modellkosten unverändert. Hosting- und Webhook-Kosten hängen vom Hoster ab; **kein Betrag ohne Angebot**. |
| Abschaltung | (1) Ohne `?live=1`/`?ball_live=1` ist das Original unverändert; Demo und Archiv sind betroffen. (2) Ein Schalter im Relay sperrt den Ingest (503); Producer fallen auf Spool und dann `nicht_zugestellt` zurück, ohne den Agentenlauf zu stören. (3) HMAC-Schlüssel und Webhook löschen. (4) Journal nach festgelegter Frist löschen (Frist: Peter). |
| iOS | Live gilt nur im Vordergrund (Spec NFR-7). Hintergrund und Sperre heißt Nachholen über `?after=n`. Safari meldet einen abgebrochenen Strom teils als „fertig“ statt als Fehler (WebKit-Bug); der Adapter muss Herzschlag-Verlust als Abbruch werten. Fetch-Streaming über CORS in iPad-Safari ist erst nach Probe E3 gesichert (Spec §14: sonst Stopp, kein Polling als Ersatz). |
| Nachweis | Kein iPad-PASS und kein „nahezu Echtzeit“ ohne echten Gerätelauf mit Bildschirmaufnahme (Spec §8, M5). |

---

## 6. Wer entscheidet was

**Atlas (technisch, im bestehenden Ziel):**
- Ereignisfelder: Mindestsatz aus 5.1, V2.1-konform
- `kind`- und Werkzeugnamen-Allowlist
- Rate von höchstens 1 `progress` je 10 s
- Versionsvertrag nach §2
- Baukettenkorrektur nach §1.3
- Radiustoleranz in `MP-GEO-1`
- Wahl Stream-Wrapper oder HTTP-Hook für Claude

**Peter:**

| # | Entscheidung |
|---|---|
| P-1 | Hoster für das Relay und wer es betreibt |
| P-2 | laufende Kosten (nach konkretem Angebot) |
| P-3 | Sichtbarkeit: (a) öffentliche Metadaten oder (b) privat mit Lesezugang auf dem iPad, inklusive Credential-Risiko |
| P-4 | ChatGPT-Seite: B-1 Selbstauskunft als zulässig gekennzeichnet (= Absenkung des Liveziels) oder B-2 nach Klärung des API-Betriebs |
| P-5 | Latenzschwellen H-E1 (D-P3) |
| P-6 | Veröffentlichung/Release der späteren Fassung 48 und Aufbewahrungsfrist des Journals |
| P-7 | Liste der tatsächlich genutzten Geräte und Fenstergrößen für `MP-GEO-1` |
| P-8 | ob `TV-GH-1` überhaupt durchgeführt werden soll |

---

## 7. Gemeinsame Fehlleistung (zu §6 des Auftrags)

Der übersehene Serverguard war in V1 meine ausdrückliche Freigabe auf
Leseprüfung hin. Ich habe den Server nicht gestartet. Die Probe in §2.1
dauerte Sekunden. Für die nächste Fassung gilt: Ein Startweg wird
ausgeführt, nicht gelesen.

---

`Review V2 | korrigierte Baukette | korrigierter Versionsvertrag | Messprobe Geometrie | vollständiger Livepilot-Datenfluss (mit Belegsperre ChatGPT-Laufzeitereignis) | nötige Peter-Entscheidungen | keine Umsetzung erfolgt`

Primärquellen:
- [Claude Code Hooks](https://code.claude.com/docs/en/hooks)
- [Claude Code headless / stream-json](https://code.claude.com/docs/en/headless)
- [OpenAI Agents SDK Tracing](https://openai.github.io/openai-agents-python/tracing/)
- [TracingProcessor](https://openai.github.io/openai-agents-python/ja/ref/tracing/processor_interface/)
- [Workspace Agents API-Trigger](https://developers.openai.com/cookbook/examples/chatgpt/workspace_agents/workspace-agents-api-trigger)
- [GitHub: fehlgeschlagene Webhook-Zustellungen](https://docs.github.com/en/webhooks/using-webhooks/handling-failed-webhook-deliveries)
- [GitHub Webhook Best Practices](https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks)
- [GitHub REST Rate Limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)
- [caniuse Streams](https://caniuse.com/streams)
- [WebKit Bug 265331](https://onbugs.webkit.org/show_bug.cgi?id=265331)
- [WebKit Hintergrundverhalten](https://webkit.org/blog/8970/how-web-content-can-affect-power-usage/)
