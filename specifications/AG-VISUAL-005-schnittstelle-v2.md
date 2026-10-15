# AGENTARIUM – Schnittstellenvertrag V2

AG-VISUAL-005, Schnittstellenversion 2 · 2026-10-15T19:24:00Z
Projekt: pahlborn/agentarium · Branch: claude/agentarium-visualisierung
Status: **verbindlicher Vertragsentwurf** zur Argus-Delta-Prüfung und
Sentinel-Testbarkeitsprüfung. Keine Implementierung, keine
Infrastrukturaktivierung, keine kostenpflichtigen Testläufe, kein Merge,
keine Veröffentlichung.
Auftrag: `handoffs/AG-VISUAL-005-INTERFACE-rereview-team-v1.md`
(`AG-VISUAL-005-INTERFACE-REREVIEW`, Atlas, `READY_FOR_SPEC_REVISION`)
Basis: `governance/AG-VISUAL-005-INTERFACE-rereview-team-v1.md`
Vorgänger: `specifications/AG-VISUAL-005-schnittstelle-v1.md`,
Blob `e2eacd2fefd977cbe1637a1bf7123fb77e8556db` — **verlaufen**, bleibt als
Prüfnachweis unverändert liegen.

> AGENTARIUM – See intelligence move. Powered by BALL
> **BALL — Bio-Agent & LLM Logistics**

Das Vokabular ist `agentarium.observed-worklog.v1`. V1 erfand sieben
Feldnamen, während ein echtes Protokoll im Basis-Zweig lag; die Namen sind
zurückgezogen. Dieser Vertrag erfindet nichts hinzu, was nicht in §7
Spalte 3 ausdrücklich als neu ausgewiesen ist.

---

## 1. Zwei Ströme, zwei Sequenzräume

Ein ausschließlich projektbezogener Strom kann die Entstehung eines noch
unbekannten Projekts nicht ankündigen. Deshalb zwei Ströme:

| | Katalogstrom | Arbeitsstrom |
|---|---|---|
| Adresse | `/agentarium/katalog` | `/agentarium/lauf/{project_id}/{run_id}` |
| `stream` | `katalog` | `lauf` |
| `stream_id` | `team/{team}` | `{project_id}/{run_id}` |
| Ereignisse | `project.created` `run.started` `run.finished` `catalog.changed` | `work.event` `run.state_changed` |
| Sequenzraum | eigener | eigener, je Lauf |

**Jeder Strom hat seinen eigenen monotonen `stream_sequence`- und
Replayraum.** Dieselbe Zahl in zwei Strömen ist kein Konflikt. `project_id`
und `run_id` stehen in **jedem** fachlichen Ereignis, damit ein Verbraucher
filtern kann, ohne eine eigene Verbindung zu brauchen.

Ein gemischter Gesamtstrom aller Arbeitsereignisse ist für V2 **nicht**
vorgesehen. Wird er später ergänzt, braucht er eine eigene globale
Teamsequenz.

### 1.1 Projektanlage

1. Das Team erzeugt die `project_id`.
2. Es veröffentlicht `project.created` mit **genau dieser** ID im
   Katalogstrom.
3. Erst danach existiert die ID; erst danach kann ein Lauf starten.

`project_id` ist die **dauerhafte Projektklammer**. `run_id` ist eine
**einzelne Ausführung** und die **Archiv- und Replayeinheit**. Ein Projekt
kann mehrere aktuelle und historische Läufe haben. Archiviert und
wiedergegeben wird ein Lauf, nicht ein Projekt.

---

## 2. Der Schnappschuss

Einmal beim Verbinden, je Strom. Push allein lässt den Monitor leer: Wer um
14 Uhr aufmacht, was um 9 Uhr begann, sähe sonst „0 von 0".

Er trägt **seinen eigenen Cursor**. Das erste danach gelieferte Ereignis hat
`cursor + 1`; `cursor: 0` heißt, der Strom hat noch nichts gesendet. Er
trägt außerdem die `replay_grenze` — die niedrigste `stream_sequence`, die
der Server noch nachliefern kann.

**Snapshot-Reconciliation.** Schnappschuss und anschließende Ereignisse
müssen ohne Verlust und ohne doppelte Zustandsänderung zusammenpassen. Der
Empfänger verwirft jedes Ereignis mit `stream_sequence ≤ cursor`. Der
Katalogschnappschuss führt die Projekte mit ihren Läufen; der
Laufschnappschuss führt den Laufstand und höchstens zehn letzte Ereignisse,
damit die Liste nicht leer ist. **Die Projektgeschichte gehört nicht in den
Schnappschuss** — das Feld ist ein Monitor, kein Archiv.

---

## 3. Transport, Anmeldung, Wiederaufnahme

SSE für die Beobachtung. Das Feld hat keinen Rückkanal im Strom; Befehle
laufen getrennt (§9).

### 3.1 Anmeldung — zwei Betriebsrahmen, kein URL-Ticket

Eine einmalige, an genau eine Verbindung gebundene Eintrittskarte in der
Adresse wird **nicht** verwendet. Begründung, übernommen aus dem
Re-Review: Natives `EventSource` verbindet mit **derselben** URL erneut; ein
verbrauchtes Ticket sperrte damit genau den Reconnect, für den es gedacht
war. URL-Token erscheinen außerdem in Zugriffsprotokollen.

| Betriebsrahmen | Anmeldung | Wiederaufnahme |
|---|---|---|
| **kontrollierter gleicher Ursprung** | Sitzung über Cookie, `HttpOnly`, `Secure`, `SameSite=Lax` oder strenger | natives `EventSource`, Wiederaufnahme eingebaut |
| **anderer Ursprung** | `fetch`-Streaming mit `Authorization`-Header | **ausdrücklich selbst implementiert**: Cursor halten, neu verbinden, `Last-Event-ID` mitsenden |

Der Server nennt in seiner Antwort, welcher Rahmen gilt. Ein Client darf
nicht raten.

### 3.2 SSE-Rahmung

```
id: 412
event: agentarium
data: {"schema":"agentarium.strom.v2","stream":"lauf", … ,"stream_sequence":412, …}

: ping
```

- `id:` trägt **ausschließlich** die `stream_sequence` des Stroms, als
  Dezimalzahl.
- `Last-Event-ID` beim Wiederverbinden ist derselbe Wert.
- **`id` ist nicht die Ereignis-ID.** Die fachliche `id` steht in
  `payload`. Transportfolge und Fachidentität sind verschiedene Größen;
  Empfangsreihenfolge ist kein Beweis fachlicher Kausalität — dafür gibt es
  `caused_by`.
- Kommentarzeilen (`: …`) sind Transport-Keepalive und tragen kein `id`.

### 3.3 Replaygrenze und Fehlerantworten

| Lage | Antwort |
|---|---|
| `Last-Event-ID ≥ replay_grenze` | `200`, Nachlieferung ab `Last-Event-ID + 1` |
| `Last-Event-ID < replay_grenze` | `409` mit `{code:"replay_grenze_unterschritten", replay_grenze, neuer_schnappschuss}` |
| kein `Last-Event-ID` | `200`, Schnappschuss zuerst |
| Anmeldung fehlt oder abgelaufen | `401` |
| `read` fehlt | `403` |
| Strom unbekannt | `404` |

**Eine Lücke wird nie stillschweigend übersprungen.** Springt die Folge,
meldet das Feld das sichtbar und fordert nach; ist die Grenze
unterschritten, holt es einen neuen Schnappschuss.

Vorhaltung beim Server: Ringpuffer je Strom, Vorschlag 500 Ereignisse oder
eine Stunde, je nachdem was größer ist. Die tatsächliche Grenze steht in
jedem Schnappschuss.

---

## 4. Lebenszeichen

Zwei technische Zwecke, ausdrücklich getrennt:

| | Transport-Keepalive | `heartbeat`-Ereignis |
|---|---|---|
| Form | SSE-Kommentarzeile `: ping` | Umschlag mit `kind: "heartbeat"` |
| Zweck | hält Verbindungen und Proxys offen | die Oberfläche **messt den letzten tatsächlichen Empfang** |
| Erreicht den Parser | nein | ja |

Für `heartbeat` gilt, ohne Ausnahme:

- Takt **5 Sekunden**, auch wenn nichts geschieht.
- Nach **20 Sekunden** ohne empfangenes Lebenszeichen gilt die Ansicht als
  **veraltet** beziehungsweise die Verbindung als unklar, und das Feld sagt
  es: *„Verbindung seit N s ohne Lebenszeichen"*.
- **keine** Persistierung, **keine** Fachereignis-ID, **keine**
  `stream_sequence`, **kein** Eintrag im Replaypuffer fachlicher
  Ereignisse, **kein** LLM-Aufruf, **kein** Eintrag im Arbeitsprotokoll.
- `last_sequence` ist rein nachrichtlich und verändert den Cursor des
  Empfängers nicht.

**Der Grund, und er ist der wichtigste Satz dieses Vertrags:** Ohne
regelmäßiges Lebenszeichen lässt sich *„der Lauf ruht"* nicht von *„die
Verbindung ist tot"* unterscheiden, und beides sieht im Bild identisch aus.
Umgekehrt gilt: **Eine funktionierende Verbindung beweist keine aktive
Agentenarbeit.** Verbindungszustand und Arbeitszustand sind getrennt.

---

## 5. Laufzustände, Ansicht, Herkunft, Steuerung

Vier Dinge, die nicht vermischt werden dürfen, und nur das erste ist eine
Wahl des Betrachters: **Projekt und Lauf.**

### 5.1 Zustände

| Zustand | terminal | Ansicht | befehlsfähig |
|---|---|---|---|
| `geplant` | nein | live | nein |
| `aktiv` | nein | live | ja |
| `wartend` | nein | live | ja |
| `pausiert` | nein | live | ja |
| `blockiert` | nein | live | ja |
| `wiedereroeffnet` | **nein** | live | ja |
| `abgeschlossen` | **ja** | archiv | nein |
| `abgebrochen` | **ja** | archiv | nein |
| `fehlgeschlagen` | **ja** | archiv | nein |

### 5.2 Die drei abgeleiteten Größen

- **Ansicht** folgt dem Zustand: nicht terminal → Live-Beobachtung,
  terminal → Archivwiedergabe. **Keine Betriebsart zur Wahl.** Ein Nutzer
  darf Projekt und Lauf wählen; er darf einen archivierten Lauf **nicht**
  als Live etikettieren. Widersprüchliche Betriebsarten sind nicht frei
  kombinierbar — es gibt sie nicht.
- **Herkunft** (`mode` ∈ `OBSERVED_PROJECT_WORK` | `SIMULATION`,
  `fictional`) beschreibt, woher die Daten stammen, und bleibt **unabhängig
  sichtbar**. Simulation und echte Projektarbeit werden niemals vermischt.
- **Steuerung** ist eine **Berechtigung** (§8), keine Darstellungsart.

---

## 6. Feldvokabular in drei Spalten

Getrennt, weil sonst ein Zielfeld wie ein vorhandenes gelesen wird.
Spalte 1 ist im geprüften Acht-Ereignis-Worklog
(`relay/events/AG-PARTITUR-001-worklog-v1.json`) **tatsächlich vorhanden**.

| Feld | 1 heute vorhanden | 2 additiv AG-REPORT-001 | 3 neu in V2 |
|---|---|---|---|
| `id` | ✓ | | |
| `sequence` | ✓ | | |
| `task_id` `parent_task_id` | ✓ | | |
| `actor` `recipient` | ✓ | | |
| `kind` `title` | ✓ | | |
| `caused_by` | ✓ | | |
| `occurred_at` `recorded_at` | ✓ | | |
| `fictional` `source_evidence` | ✓ | | |
| `ownership_change` | ✓ | | |
| `result_ref` | ✓ | | |
| `agent_id` `platform` `actual_model` | ✓ | | |
| `input_tokens` `output_tokens` `thinking_tokens` | ✓ | | |
| `artifact_id` `version` | | ✓ | |
| `question_id` `reply_to` | | ✓ | |
| `supersedes` `corrects` | | ✓ | |
| `block_id` `resolving_event_id` | | ✓ | |
| `criteria_ref` `outcome` | | ✓ | |
| `work_item_type` `scope_version` | | ✓ | |
| `item_revision` `previous_transition_id` `from` `to` | | ✓ | |
| **`run_id`** | | | **✓ additiv aufgenommen** |
| **`project_id`** im Arbeitsereignis | | | **✓** |
| **`verbrauch.belegt`** | | | **✓** |
| ~~`erledigt`~~ | | | **entfällt** |

**`erledigt` gibt es nicht.** Eine Lieferung, ein Reviewpass oder ein
Testpass setzt keine Aufgabe auf Done. Done entsteht **ausschließlich**
durch einen ausdrücklichen, revisionsgebundenen Statuswechsel:
`kind: "status_change"` mit `task_id`, `from`, `to` und monotoner
`item_revision`; `previous_transition_id` ist beim ersten Übergang `null`.
Ein Pass auf `v1` gilt nicht für `v2` — eine Prüfung nennt `artifact_id`,
`version`, `criteria_ref` und `outcome`.

Rollenschlüssel: `atlas` `nova` `scout` `archibald` `forge` `argus`
`sentinel` `cadence`. Plattform, technische Agentenkennung und
nachgewiesenes Modell sind **getrennte** Angaben; ein Modell gilt nur mit
Laufzeitbeleg.

**Unbekanntes bleibt unbekannt.** `occurred_at: null` ist zulässig und
bedeutet *unbekannt* — niemals der Importzeitpunkt. `recorded_at` ist
Ablagezeit, nie Ereigniszeit. Gleiche Zeitstempel beweisen weder Reihenfolge
noch Kausalität.

---

## 7. Zeitachse und Archiv

### 7.1 `zeitachse` mit objektiver Ableitungsregel

Im Archivmanifest, nachrechenbar aus den Ereignissen:

| Wert | Regel |
|---|---|
| `complete` | jedes Ereignis innerhalb der angegebenen Abdeckung hat `occurred_at ≠ null` |
| `partial` | mindestens ein benötigtes `occurred_at` fehlt, aber nicht alle |
| `none` | kein Ereignis hat `occurred_at`, oder die belegte Reihenfolge erlaubt keine Zeitachse |

Bei `partial` und `none` wechselt die Darstellung in eine **sichtbar
bezeichnete Schrittfolge**. Dauer, Parallelität und aktive Arbeitszeit
werden nicht behauptet. Auch bei `complete` belegen Ereigniszeitpunkte
**verstrichene** Zeit, nicht automatisch aktive Arbeitsdauer.

Der Grund, dass dieses Feld überhaupt im Vertrag steht: Agentarium bewegt
sich in der Zeit. Flugdauern, Pausen und Gleichzeitigkeit sind Zeitgrößen.
Ohne `occurred_at` gibt es keine Dauer, und eine trotzdem weiterlaufende
Animation behauptet eine.

### 7.2 Archiv

Das Manifest trägt Schemafassung, Projekt, Lauf, Quellen, `abdeckung` mit
benannten Lücken, unveränderliche `archiv_version`, `zeitachse` und die
Ereignisse. `vollstaendig: false` kennzeichnet einen ausdrücklich
unvollständigen Lauf.

Unterstützt: Laden, Start, Pause, Einzelschritt, Geschwindigkeit,
Zeitsprung, deterministische Zustandsrekonstruktion am gewählten Cursor,
derselbe fachliche Zustand in Agentarium und Partitur am selben Cursor,
sichtbare Lücken und historische Korrekturen.

**Die Wiedergabe hat keine Nebenwirkungen.** Keine Agenten, keine
GitHub-Aktionen, keine API-Aufrufe, keine erneut ausgeführten Befehle, keine
neuen fachlichen Projektereignisse. Korrekturen ergänzen
`supersedes`/`corrects` und löschen keine Vorgeschichte; der Import
verändert die Quelldaten nicht.

---

## 8. Berechtigungen

| Recht | erlaubt |
|---|---|
| `read` | Beobachten, Schnappschuss, Archivwiedergabe |
| `command` | **zusätzlich** zu `read`, dazu die bestehenden fachlichen Freigaben |

- Der Server setzt beides **serverseitig** durch und nennt die festgestellten
  Rechte im Schnappschuss.
- **Wand- und Präsentationsansichten erhalten ausschließlich `read`.**
- Ein Befehl ohne `command` wird eindeutig und **ohne fachliche
  Nebenwirkung** abgelehnt.
- **Das Ausblenden einer Schaltfläche gilt nicht als Rechteprüfung.** Der
  Client darf die Oberfläche daraus ableiten; die Prüfung bleibt beim
  Server.

---

## 9. Befehlskanal

Getrennt vom Ereignisstrom. **Der Strom führt keine Befehle aus.**

Je Befehl: `command_id` (eindeutig, Schutz gegen doppelte Ausführung),
`aktion`, `project_id`, `run_id`, wahlweise `task_id`, sowie
`erwartete_revision` zur Erkennung veralteter Befehle.

Vier **getrennte** Rückmeldungen: `empfangen` · `angenommen` · `abgelehnt` ·
`ausgefuehrt`. **Eine Empfangsbestätigung ist kein Ausführungsnachweis.**
`ausgefuehrt` nennt `folge_ereignisse` und verknüpft so Befehl und Wirkung.
`abgelehnt` trägt `nebenwirkung: false` und einen `fehlercode`:
`recht_fehlt` · `zustand_unzulaessig` · `revision_veraltet` ·
`doppelt_ignoriert` · `unbekannte_aktion`.

Bestehende Freigaben und Relay-Grenzen bleiben wirksam. **Die Schnittstelle
schafft keine zusätzlichen Befugnisse.** Welche Aktionen die Orchestrierung
tatsächlich unterstützt, ist **offen** (§12 O-1); nicht unterstützte
Aktionen dürfen nicht als bedienbar angeboten werden.

---

## 10. Kosten

**Peters Entscheidung vom 15.10.2026, 21:01:52 Europe/Berlin.** Sie ersetzt
die frühere Ausblendung des Kostenfelds.

- Das Kostenfeld **bleibt sichtbar**.
- Solange die Gesamtkosten nicht vollständig ermittelt werden können,
  erscheinen **keine** Beträge, **keine** Teilsummen, **keine**
  Gesamtsumme und **keine** 0-Ersatzwerte.
- Das sichtbare Feld zeigt stattdessen **ausschließlich**:
  **„Kosten nicht vollständig ermittelbar."**
- Erst bei **vollständiger, belegter** Gesamterfassung werden Kosten
  ausgewiesen.
- Vorhandene Verbrauchsnachweise bleiben erhalten (`verbrauch` je Ereignis
  mit `belegt`). **Unbekannte Werte sind niemals null.**
- `ohne_angabe` ist eine **Anzahl** von Ereignissen ohne Nachweis, kein
  Betrag und kein Ersatzwert.
- Laufende Aufträge zählen **gegen** die Vollständigkeit.
- Abonnementnutzung ist **kein** Nullverbrauch.
- Ein leeres Feld liest sich wie ein Fehler; ein benannter Status liest sich
  wie ein Status.

Protokolliert werden fachlich relevante Zustandsänderungen und Übergaben —
keine Animationsframes, keine Mausbewegungen, keine periodischen
Agentenmeldungen, keine Token- oder Frame-Ereignisse, keine
Tool-Volltranskripte. Kein separater LLM-Aufruf zum Protokollieren.

---

## 11. Schemas, Beispiele, Prüflauf

Alles auf `claude/agentarium-visualisierung`. Geprüft wird gegen den
**Blob**, nicht gegen den Zweig.

| Pfad | Blob |
|---|---|
| `specifications/AG-VISUAL-005-schemas-v2/strom.schema.json` | `7814828bf35ae60ab1ea4429f8e5502fd1f2ab85` |
| `specifications/AG-VISUAL-005-schemas-v2/schnappschuss.schema.json` | `d5bcda382664adba0940ac2028b9d35ed1c5bd62` |
| `specifications/AG-VISUAL-005-schemas-v2/archivmanifest.schema.json` | `98fe469ca4e83176fc2a11f6a6532b92cea5f3a0` |
| `specifications/AG-VISUAL-005-schemas-v2/befehl.schema.json` | `79ce90a4c7b7f0e3f1cb10dfcdd602309bdcb223` |
| `fixtures/AG-VISUAL-005-beispiele-v2/01-einstieg-snapshot-live.json` | `db5607cf11b54a0450b5cac9af80f9a67655eeff` |
| `fixtures/AG-VISUAL-005-beispiele-v2/02-heartbeat-veraltet.json` | `bca6a7f4920e4d5c6c591bc4f5749ef953d2749c` |
| `fixtures/AG-VISUAL-005-beispiele-v2/03-reconnect-replaygrenze.json` | `588a75da6b3b8ba30ee4a0a947b20970c5a505f5` |
| `fixtures/AG-VISUAL-005-beispiele-v2/04-zwei-projekte-laeufe.json` | `d700144a50d592dc57f629dcd1c9ab895e1a5885` |
| `fixtures/AG-VISUAL-005-beispiele-v2/05-parallel-artefakte-review.json` | `72e1ef1b425d01c866d654c84fa3efe37bd541d4` |
| `fixtures/AG-VISUAL-005-beispiele-v2/06-kosten-sichtbar-ohne-betrag.json` | `951a4a9cd06e4b8d3f6e025081131fea4d3ba3ad` |
| `fixtures/AG-VISUAL-005-beispiele-v2/07-altlog-ohne-zeitpunkte.json` | `49e697baab85f01eb43836d70400ad65a92a9b23` |
| `fixtures/AG-VISUAL-005-beispiele-v2/08-nurlesen-befehle.json` | `064b88bd380ccb0959e19349f9d64c94203b2858` |
| `fixtures/AG-VISUAL-005-beispiele-v2/09-archiv-zeitsprung.json` | `b205c2605a145f419574245f6b410221e94e010c` |
| `tests/AG-VISUAL-005-vertrag-v2-pruefen.py` | `24e6620542ad4866e71865282b1dc95e67eac18c` |
| `tests/AG-VISUAL-005-vertrag-v2-gegenprobe.py` | `0f5ea4ddccc72054d854079f98401b8dedc8d827` |

Jedes Beispiel trägt seine **Erwartung** als benannte Regeln `R-01…R-23`
bei sich. Der Prüflauf rechnet sie nach:

```
python3 tests/AG-VISUAL-005-vertrag-v2-pruefen.py
  Formpruefungen:  38
  Regelpruefungen: 59
  Alle Abnahmefaelle 01-09 bestanden.

python3 tests/AG-VISUAL-005-vertrag-v2-gegenprobe.py
  21 von 21 Verletzungen erkannt.
```

Die Gegenprobe verletzt jeden Fall absichtlich. Ein Prüfer, der beim ersten
Lauf besteht, beweist nichts — er könnte nichts prüfen.

**Grenzen des Prüflaufs, ausdrücklich:**

- Der eingebaute Schemaprüfer deckt nur den verwendeten Teil von JSON
  Schema 2020-12 ab (in `pruefen.py` aufgelistet). Er ist **kein**
  vollständiger Prüfer; die Schemas sind für einen Standardprüfer
  geschrieben. Kein `jsonschema` im Container, und die Projektregel verbietet
  das Nachladen zur Laufzeit.
- Eine der 21 Verletzungen (`R-15b`, fehlender `fehlercode`) wird von der
  **Form** gefangen, nicht von ihrer Regel. Erkannt ist sie, aber nicht
  durch das, was ihr Name behauptet.
- **Es ist eine Datenprüfung, kein Laufzeitnachweis.** Kein Server, kein
  SSE, kein Browser. Ein Entwurf gilt nicht als erfolgreich getestete
  Schnittstelle.

---

## 12. Status je Punkt des Korrekturauftrags

| | Korrektur | Status | Nachweis |
|---|---|---|---|
| 1 | Katalogstrom getrennt, eigener Sequenzraum | **getestet** (Daten) | §1, Fall 04, R-02 R-19 |
| 2 | Projektanlage, `project_id`/`run_id` | **getestet** (Daten) | §1.1, Fall 04, R-19 |
| 3 | Live/Archiv aus dem Laufzustand, 9 Zustände | **getestet** (Daten) | §5, Fall 01 04 09, R-17 |
| 4 | SSE-Anmeldung und Reconnect widerspruchsfrei | **spezifiziert**; Reconnect-Daten getestet | §3, Fall 03, R-06 R-06b |
| 5 | Keepalive und `heartbeat` getrennt, 5 s / 20 s | **getestet** (Daten) | §4, Fall 02, R-03 R-04 |
| 6 | `zeitachse` mit Ableitungsregel | **getestet** (Daten) | §7.1, Fall 07 09, R-10 R-18 |
| 7 | Feldtabelle dreispaltig, `erledigt` entfällt, `run_id` additiv | **getestet** (Daten) | §6, Fall 05, R-11 R-12 R-20 |
| 8 | `read`/`command` serverseitig, Wand nur lesend | **spezifiziert**; Daten getestet | §8, Fall 08, R-13 R-14 |
| 9 | Kostenfeld sichtbar, nur Statussatz | **getestet** (Daten) | §10, Fall 06, R-08 R-09 |
| 10 | Vertrag, Schemas, Beispieldaten | **getestet** (Daten) | §11 |

**„getestet (Daten)"** heißt: Der Prüflauf rechnet die Regel an den
Beispieldaten nach, und die Gegenprobe zeigt, dass sie fehlschlagen kann.
Es heißt **nicht**, dass eine Implementierung geprüft wurde — es gibt keine.
**Implementiert: nichts.** Punkte 4 und 8 sind nur **spezifiziert**, weil
ihr Kern (Cookie- gegen Header-Betrieb, serverseitige Durchsetzung) ohne
Server nicht nachweisbar ist.

---

## 13. Offene Entscheidungen

| | offen | wer entscheidet |
|---|---|---|
| **O-1** | Welche Aktionen die Orchestrierung tatsächlich unterstützt. Ohne diese Liste bleibt §9 ein Rahmen ohne Inhalt; nicht unterstützte Aktionen dürfen nicht angeboten werden. | Atlas / Team |
| **O-2** | Welcher Betriebsrahmen gilt: gleicher Ursprung mit Cookie-Sitzung oder getrennter Ursprung mit `fetch`-Streaming? Davon hängt ab, ob der Reconnect eingebaut ist oder selbst geschrieben werden muss. | Team / Betrieb |
| **O-3** | Tatsächliche Replaygrenze je Strom. Der Vertrag nennt 500 Ereignisse oder eine Stunde als Vorschlag. | Team |
| **O-4** | Wann der Verbrauch eines Auftrags feststeht — bei der Lieferung oder erst über eine Abrechnung. Davon hängt ab, ob Kosten je Auftrag zuzuordnen sind oder nur je Rolle. | Team |
| **O-5** | Ob mehrere Läufe eines Projekts gleichzeitig aktiv sein dürfen. Der Vertrag erlaubt es; der Prozess muss es zulassen. | Atlas / Prozess |
| **O-6** | `catalog.changed`: welche Änderungen es meldet. Im Vertrag als Platzhalter geführt, Nutzdaten noch nicht festgelegt. | Team |
| **O-7** | Ob Partitur denselben Vertrag verwendet. §7.2 verlangt denselben fachlichen Zustand am selben Cursor; geprüft ist das nicht. | Atlas |

---

## 14. Was dieser Vertrag nicht ist

- **Keine Implementierung.** Kein Server, kein Endpunkt, kein Client.
- **Keine Laufzeitprüfung.** Datenprüfung, Browser nicht beteiligt.
- **Keine unabhängige Prüfung.** Verfasst von derselben Sitzung, die V1
  verfasst hat. Argus-Delta-Review und Sentinel-Testbarkeitsprüfung stehen
  aus.
- **Keine Freigabe.** Kein Merge, keine Veröffentlichung, keine
  Architekturentscheidung. Kein Merge und keine Veröffentlichung ohne Peter.
