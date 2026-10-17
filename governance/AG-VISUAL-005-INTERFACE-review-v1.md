# AG-VISUAL-005-INTERFACE – Prüfung der Anweisung V1

AG-VISUAL-005-INTERFACE-REVIEW, Prüfversion 1 · 2026-10-15T18:47:30Z
Projekt: pahlborn/agentarium · Branch: claude/agentarium-visualisierung
Prüfer: Claude-Code-Sitzung (Verfasser der geprüften Fassungen; **keine
unabhängige Prüfung**, keine dispatchte Agenteninstanz, keine `run_id`)
Gegenstand: Anweisung `AG-VISUAL-005-INTERFACE` V1 von Atlas an den
Schnittstellenagenten, Übergabe `agentarium.handoff.v0`, `status: PREPARED`
Status: Anmerkungen zur Anweisung. Keine Implementierung, kein Merge, keine
Freigabe. Peters Entscheidung liegt vor: **wir richten uns nach Atlas und
seinem Team.**

## Basis, nachgesehen

| | |
|---|---|
| Atlas' `reviewed_commit` | `a8d483a90eb5decab4f936cbd4b420b511bf93fd` |
| HEAD dieses Zweiges | `a8d483a90eb5decab4f936cbd4b420b511bf93fd` |
| `concept_blob` | `d07fccdc18432b10fa2fbb904409f9d945ae7ff3` ✓ |
| `interface_blob` | `e2eacd2fefd977cbe1637a1bf7123fb77e8556db` ✓ |

Zeichengenau dieselbe Fassung. Kein Auseinanderlaufen, keine Anmerkung ins
Leere. Die Blob-Bindung hat getragen.

**Vorbemerkung in eigener Sache:** Die Anweisung ist in jedem technischen
Punkt genauer als der Entwurf, den sie prüft. Die beiden Befunde unten sind
keine Verteidigung des Entwurfs — sie betreffen zwei Festlegungen, die *nach*
Atlas' Prüfbasis durch Peter entschieden wurden und die Atlas deshalb nicht
kennen konnte.

---

## 1. Was ohne Vorbehalt übernommen wird

Diese Punkte sind im geprüften Entwurf schlechter gelöst oder fehlen ganz.
Sie gelten ab sofort, der Entwurf wird daran angepasst, nicht umgekehrt:

| Anweisung | was sie im Entwurf ersetzt |
|---|---|
| §3 `observed-worklog.v1` als gemeinsame Grundlage | **sieben von mir erfundene Feldnamen.** Siehe §4 dieses Reviews. |
| §3 „Unbekannte Werte bleiben unbekannt", `occurred_at` ≠ `recorded_at` | der Entwurf hatte **ein** Zeitfeld und hätte Ablagezeit als Arbeitszeit gezeigt |
| §3 „Empfangsreihenfolge ist kein Beweis fachlicher Kausalität" | der Entwurf leitete Reihenfolge aus `folge` ab — das ist Transport, nicht Fachlichkeit |
| §4 „Ereignis-ID und Transportfolge sind unterschiedliche Größen" | der Entwurf setzte `Last-Event-ID` = `folge` gleich |
| §4 „Eine funktionierende Verbindung beweist keine aktive Agentenarbeit" | **besser formuliert als im Entwurf.** Trennt Verbindungszustand von Arbeitszustand. |
| §5 Befehlskanal mit Berechtigung, Idempotenz, Ausführungsnachweis | der Entwurf schloss einen Rückkanal aus. **Durch Peter entschieden: Atlas gilt.** |
| §6 keine Nebenwirkungen beim Replay | im Entwurf nicht genannt, weil er kein Replay echter Läufe kannte |
| §8 keine Heartbeats im Arbeitsprotokoll | der Entwurf steckte Transport und Fachlichkeit in dasselbe Schema |

---

## 2. Zwei Befunde: Festlegungen nach Atlas' Prüfbasis

### [BEFUND-01] §4 „ein Beobachtungsstrom je Projekt" ist mit Peters Anforderung technisch unvereinbar · **blocker**

**Belegt an:** Anweisung §4, Satz „Für V1 wird ein Beobachtungsstrom je
Projekt vorgesehen."

**Peters Anforderung, nach Atlas' Prüfbasis:** *„Die Schnittstelle muss so
aufgebaut sein, dass ein neues Projekt vom Team angelegt wird und Strom
beginnen kann."*

**Befund:** Ein Strom je Projekt setzt voraus, dass die Projektkennung beim
Verbinden bekannt ist. Ein Projekt, das das Team gerade anlegt, hat noch
keine — es kann seine eigene Entstehung nicht melden. Dasselbe gilt für
Peters zweite Anforderung, alle beendeten Läufe dauerhaft erreichbar zu
halten: Woher die Liste kommt, bleibt ohne teamweiten Kanal offen.

Derselbe Fehler stand im geprüften Entwurf (`GET /strom?projekt=…`); er ist
dort von Peter gefunden worden, nicht von mir.

**Vorschlag:** Ein Beobachtungsstrom **je Team**, der `projekt.angelegt` und
`lauf.beendet` als Ereignisse mitführt. `project_id` und `run_id` bleiben in
jedem Satz enthalten — was §4 ohnehin verlangt —, sodass ein Verbraucher,
der nur ein Projekt zeigen will, filtert statt eine eigene Verbindung zu
brauchen. Der Strom je Projekt bleibt als zusätzliche, engere Sicht möglich;
er darf aber nicht die einzige sein.

### [BEFUND-02] §2 Die drei Funktionen sind richtig — ihre Wahl durch den Betrachter ist es nicht · **wichtig**

**Belegt an:** Anweisung §2, „Drei klar getrennte Funktionen".

**Peters Befund, nach Atlas' Prüfbasis:** *„Die Steuerung mit live demo und
archiv ist unlogisch."* Dazu: *„V1 und V2 sind Projekte, wenn auch
prototypisch erarbeitet. Agentarium wird aber auch in Echtzeit angefeuert."*

**Befund:** Als Trennung von **Fähigkeiten** ist §2 richtig und wird
übernommen. Der geprüfte Entwurf machte daraus jedoch drei vom Betrachter
wählbare **Betriebsarten** — mit der Folge, dass sich „NACHTPOST V2" und
„Live" gleichzeitig wählen ließen, obwohl es für V2 keinen Strom gibt und
nie geben wird. Die Anweisung schließt das nicht aus; sie könnte so gelesen
werden, dass die drei Funktionen als Auswahl erscheinen.

Bemerkenswert: `observed-worklog.v1` hat die saubere Unterscheidung längst,
und sie ist eine andere als meine. Dort heißt `mode`
`OBSERVED_PROJECT_WORK` gegen Simulation, dazu `fictional: true|false` —
das ist **Herkunft**, nicht Anzeige. Ich habe einen Anzeigeschalter in ein
Feld verwandelt, das es schon gab und das etwas anderes bedeutet.

**Vorschlag:** In den Vertrag einen Satz aufnehmen, der die Zuordnung
festlegt statt sie dem Verbraucher zu überlassen: *Welche der drei
Funktionen gilt, ergibt sich aus dem Zustand des Laufs — ein laufender Lauf
wird beobachtet, ein beendeter wiedergegeben. Es ist keine Wahl des
Betrachters.* Herkunft (`mode`, `fictional`) bleibt davon unberührt und
muss zusätzlich sichtbar sein.

---

## 3. Vier Verbesserungsvorschläge

### [VORSCHLAG-01] §4 EventSource gegen Bearer-Header — konkreter Weg · **wichtig**

Die Anweisung nennt den Widerspruch, lässt die Auflösung aber offen. Zwei
Wege, beide gangbar:

| | native `EventSource` + Eintrittskarte | `fetch()` + `ReadableStream` |
|---|---|---|
| Anmeldung | kurzlebige, einmalige Karte in der Adresse, vorher per authentifiziertem POST geholt | Bearer-Header wie überall |
| Wiederaufnahme | **eingebaut**, mit `Last-Event-ID` | von Hand zu bauen |
| Risiko | Karte landet in Zugriffsprotokollen → Gültigkeit in Sekunden, einmalig, an die Verbindung gebunden | mehr eigener Code an der empfindlichsten Stelle |

**Empfehlung: Eintrittskarte.** Die Wiederaufnahme ist genau der Fall, der
im Betrieb zählt und den man nicht selbst schreiben will.

### [VORSCHLAG-02] Lebenszeichen als SSE-Kommentarzeile · **wichtig**

§8 verbietet Heartbeats im Arbeitsprotokoll — zu Recht. Gleichzeitig darf
der Punkt nicht verlorengehen, den der Entwurf an erster Stelle hatte: Ohne
regelmäßiges Signal lässt sich **„der Lauf ruht" nicht von „die Verbindung
ist tot" unterscheiden**, und beides sieht im Bild identisch aus.

**Vorschlag:** Reine SSE-Kommentarzeilen (`: ping`) in festem Takt. Sie
sind kein Ereignis, erreichen keinen Parser, werden nie protokolliert,
kosten keinen LLM-Aufruf — und halten die Unterscheidung trotzdem
verfügbar. Das erfüllt §8 wörtlich und löst den Fall. Takt bitte benennen.

### [VORSCHLAG-03] `occurred_at: null` bricht jede zeitbasierte Darstellung · **wichtig**

AG-REPORT-001 erlaubt `occurred_at: null`; §6 erlaubt die Wiedergabe nach
belegter Reihenfolge und verbietet, daraus Dauern zu behaupten. Beides
richtig — die Folge für die Darstellung steht aber nirgends:

Agentarium **bewegt sich in der Zeit**. Flugdauern, Pausen, Gleichzeitigkeit
sind Zeitgrößen. Fehlt `occurred_at`, gibt es keine Dauer, und jede
Animation, die trotzdem läuft, behauptet eine — genau das, was §6 verbietet.

**Vorschlag:** Der Vertrag soll je Lauf ausweisen, ob eine durchgehende
Zeitachse belegt ist (`zeitachse: belegt | teilweise | keine`). Bei
`keine` schaltet die Darstellung auf Schrittfolge statt Zeitfluss um und
sagt es sichtbar. Ohne dieses Feld muss jeder Verbraucher es selbst
erraten — oder er erfindet Dauern.

### [VORSCHLAG-04] „Projekt" gegen „Lauf" im Wortgebrauch festziehen · **anmerkung**

Peter sagt „alle beendeten **Projekte**", AG-REPORT-001 und §6 kennen
`run_id` und „Lauf". Das ist nicht dasselbe: Ein Projekt kann mehrere Läufe
haben, und archiviert wird ein Lauf.

**Vorschlag:** Einen Satz in §6, der das klarstellt, damit „alle beendeten
Projekte dauerhaft startbar" nicht auf Projektebene gebaut wird. Peters
Anforderung ist mit Läufen erfüllt, nicht gegen sie.

---

## 4. Rücknahme: sieben erfundene Feldnamen

Der geprüfte Entwurf fragte die Gegenstelle, wie seine Bezugsfelder bei ihr
heißen. **Die Antwort lag im Repository** —
`relay/events/AG-PARTITUR-001-worklog-v1.json`, Schema
`agentarium.observed-worklog.v1`, acht Ereignisse, `fictional: false`, im
Basis-Zweig des Pull Requests, der die Frage stellte. Die Namen werden
zurückgezogen:

| erfunden | tatsächlich |
|---|---|
| `von` / `an` | `actor` / `recipient` |
| `art` | `kind` |
| `zeit` | `occurred_at`, daneben `recorded_at` |
| `aufgabe` | `task_id`, dazu `parent_task_id` |
| `artefakt` / `version` | `artifact_id` / `version` |
| `antwortet_auf` | `caused_by` (Liste), `reply_to`, `question_id` |
| `ersetzt` | `supersedes` / `corrects` |
| `prueft` | Prüfereignis mit Zielversion, `criteria_ref`, `outcome` |
| `klasse` (Stop) | `block_id`, `resolving_event_id` |
| `quelle` | `mode`, `fictional`, `source_evidence` |

**`erledigt` wird nicht ersetzt, sondern gestrichen.** In
`observed-worklog.v1` schließt eine Lieferung nie eine Aufgabe; das tut nur
ein ausdrücklicher Statuswechsel mit monotoner `item_revision`. Wörtlich:
*„Ein Testpass, Reviewpass oder geliefertes Dokument setzt keine Story
automatisch auf Done."* Das erfundene Feld hätte genau das getan — und war
im Entwurf als Verbesserung ausgegeben, mit Messwerten belegt. Die Messung
war richtig, das Modell darunter falsch.

**`run_id` fehlte vollständig.** Siehe VORSCHLAG-04.

---

## 5. Folgen für Agentarium, zur Kenntnis

Aus der Übernahme von §5 (Befehlskanal) folgt etwas, das benannt sein will:
Ein Feld, das senden kann, braucht Anmeldung und Rechte und darf nicht
unbeaufsichtigt an einer Wand hängen. Falls ein solcher Aufstellort gewollt
ist, braucht es eine ausdrücklich **nur lesende** Variante.

§7: Die Kostenanzeige ist laut AG-REPORT-001 **pausiert**. Das ist ein
anderer Zustand als „unvollständig erfasst", den der Entwurf kennt. Die
Anzeige darf trotzdem nicht verschwinden — ein leeres Feld liest sich wie
ein Fehler (Peter zu K07). Bitte den Wortlaut für den pausierten Zustand
festlegen; AG-COST-UI-001 bleibt im Übrigen unberührt: unbekannte Kosten
sind nie null.

---

## 6. Geprüft, nachgesehen, nicht geprüft

**Geprüft:** Anweisung V1 in voller Länge gegen Peters Festlegungen vom
15.10.2026 und gegen `governance/AG-REPORT-001-minimal-worklog-v1.md`
(Fassung 1) sowie `relay/events/AG-PARTITUR-001-worklog-v1.json`, beide aus
`origin/feature/visual-stage-v0`.

**Nachgesehen:** Commit- und Blob-Gleichheit mit Atlas' Prüfbasis
(`git rev-parse`, `git hash-object`); Struktur und Feldnamen des echten
Arbeitsprotokolls; Vorhandensein der genannten Quellen im Zweig.

**Nicht geprüft:**
- `AG-VISUAL-005-REVIEW:RA:RA_REVIEW:V1` und `:SENTINEL:QA_REPORT:V1` —
  liegen dieser Sitzung nicht vor. Die Anweisung nennt sie als Signale; ihre
  Einzelbefunde sind hier also **nicht** gegengelesen. Möglich, dass ein
  Befund dieses Reviews dort schon steht.
- `relay/task-evidence.jsonl` und `AG-REPORT-001-worklog-v1.json` —
  nicht geöffnet.
- Die Report-Definitionen in AG-REPORT-001 §Reportdefinitionen V1 —
  gelesen, aber nicht gegen Agentariums Fortschrittsanzeige gehalten. Dort
  liegt vermutlich weitere Arbeit: der „ehrliche Nenner" des Entwurfs ist
  ein Burnup mit versioniertem Umfang, und das ist dort schon definiert.
- Nichts davon ist im Browser gelaufen. Es ist eine Dokumentenprüfung.

**Nicht unabhängig:** Dieses Review prüft Papiere desselben Verfassers.
Es ersetzt keine Prüfung durch Argus oder Sentinel.
