# AG-BALL-LIVE-001 — Argus RA_REVIEW V1

> Von Atlas dokumentierte echte Rückgabe des Subagenten `/root/argus_ball_live_spec_review`. Argus blieb gemäß Skill read-only und nahm selbst keine Projektänderung vor.

## Prüfkopf

- Auftrag: unabhängige Spezifikationsprüfung
- Geprüft: `pahlborn/agentarium`, Branch `agent/ball-live-concept-20261017`, Commit `06751872460d8bb27fb8308c9b76a879f44bfc33`
- Artefakte: Charter V1, Machbarkeitsstudie V1, Forge-Handback V1, Archibald-Spezifikation V2
- Baselines: Original `d111b062…`, Vertrag/Reducer `da860fd1…`, Adaptermuster `800874ee…`
- Ausführung: nur lesend; keine Tests, Änderungen, Freigaben oder Veröffentlichungen

## Verdict

**FAIL — gezielte Spezifikationskorrektur erforderlich. Peters Entscheidung allein macht V2 noch nicht baureif.**

Ein dauerhaft erreichbarer Pushdienst ist für den gewählten Weg ab MVP sinnvoll und erforderlich; ein bestimmter Hostinganbieter ist dadurch nicht vorgeschrieben. Das Relay allein genügt nicht. Quellenfähigkeit, zuverlässige Annahme, ehrliche Zustände, Originalintegration und iPad-Nachweis fehlen weiterhin als ausgeführte Beweise.

## Positive Befunde

- `d111…`/Fassung 47 ist korrekt als Implementierungsbasis fixiert.
- `progress` ist bereits schemakonform und als seiteneffektfreie sichtbare Zwischenmeldung erforderlich.
- Work-Selbstauskunft und Claude-Laufzeitbeobachtung werden getrennt; der gemeinsame GitHub-Login wird nicht als Rollenidentität ausgegeben.
- Producerrechte und Browserlesen sind getrennt; kein Producer-/GitHub-Dauerschlüssel gehört in das statische Original.
- XSS-Senkenprüfung, Dedupe, lückenloser Cursor und Nachholkennzeichnung sind verpflichtend.
- Browser-Polling von GitHub wurde zu Recht verworfen.

## Befunde

### ARG-BL-01 — Gemeinsames Run-Ende hat keinen gültigen Eigentümer

**BLOCKER · confirmed.** Claude und Work schreiben in denselben Run, aber der Claude-Wrapper kann den Gesamtlauf abschließen, während Work weiterarbeitet. Für Work-only und mehrere Claude-Ausführungen fehlt die Abschlussregel; `run.state_changed` besitzt außerdem keine ingestseitige Idempotenz-ID. Gesamt- und Producerlauf trennen, Abschlussbedingung und Lifecycle-ID definieren sowie verspätete Ereignisse, Abbruch und Wiederholungen testen.

### ARG-BL-02 — Journal, V2.1-Archiv und Abnahmezählung widersprechen sich

**BLOCKER · conflicting.** Das Journal enthält `work.event` und `run.state_changed`; das unveränderte V2.1-Archiv erlaubt ausschließlich Arbeitsereignisse. Die verlangte Identität und gleiche Anzahl sind daher nicht erfüllbar. Auditjournal und deterministische V2.1-Projektion trennen, Laufzustand separat bilanzieren und einen dauerhaften Archivlesepfad festlegen.

### ARG-BL-03 — Webhookausfall vor dem Journal bleibt unentdeckt und unrepariert

**BLOCKER · confirmed.** GitHub stellt fehlgeschlagene Webhooks nicht automatisch erneut zu. Browser-Catch-up kann nur bereits journalisierte Ereignisse nachholen. Vor dem gehosteten Pilot ist genau ein begrenzter automatischer Recovery-/Reconciliationweg mit Alarm, Cursor und Dedupe festzulegen; Test: Kommentar während Relayausfall.

### ARG-BL-04 — Die private Alternative veröffentlicht ihr Archiv trotzdem öffentlich

**BLOCKER · conflicting.** Eine private Inbox ist mit Export in einen Branch des öffentlichen Agentarium-Repos nicht privat. Relayfilter greifen zudem erst nach Veröffentlichung eines Kommentars. Sichtbarkeit muss durchgehend für Quelle, Relay, Diagnose, Export und Archiv gelten; bei Secretverdacht keine Rohpayload-Auszüge.

### ARG-BL-05 — Der erlaubte Originaländerungssatz reicht für Aktivierung nicht

**MAJOR · confirmed.** `modusSetzen` und `FASSUNG` liegen in einer IIFE und sind für `feld/live.js` nicht erreichbar. Ein kleiner Initialisierungs-/Versionshook bzw. Bootstrap innerhalb der Closure muss zum begrenzten Delta gehören. Alle sichtbaren Aussagen, nicht nur das Namensschild, müssen ehrlich zwischen aktiv, veraltet, unbekannt, blockiert und beendet unterscheiden.

### ARG-BL-06 — Provenienz und „noch laufend“-Beweis sind unvollständig

**MAJOR · confirmed.** FR-3.1 verbietet `agent_id`, FR-3.4 verlangt es. Ein späterer Work-Kommentar beweist nicht von selbst die dazwischenliegende Arbeit; ein laufender Actions-Job beweist nicht, dass der Claude-Prozess noch läuft. Kindpfad/Übermittler transportierbar machen und unabhängige Arbeits- bzw. Prozessendebelege fordern.

### ARG-BL-07 — Transportgrenzen dürfen nicht vom Implementierer erraten werden

**MAJOR · confirmed.** Es fehlen ehrliche Beispielnachrichten und Regeln für leeren Katalogstrom, Snapshot bei nicht fortsetzbarem Cursor, UI-Zustand versus Dedupe, privates Lesetoken/CORS sowie eine einheitliche Markup-Regel. Kleine validierte Beispiele und Fehler-/Resume-Tabelle ergänzen.

### ARG-BL-08 — „Nahezu Echtzeit“ wird gemessen, aber nicht bewertet

**MAJOR · confirmed.** Ein langsamer Durchstich könnte derzeit bestehen. Funktionsnachweis und Erlebnisziel trennen; für den Pilot eine überprüfbare Hypothese mit Weiter/Ändern/Stop-Kriterium vorschlagen. Peters Entscheidungen auf Infrastruktur, Öffentlichkeit/Datenschutz, Budget und spätere Veröffentlichung reduzieren.

## Entscheidungsempfehlung

Peter soll nicht HMAC-Details oder Feldlisten konstruieren. Das Team legt einen konkreten Betriebsvorschlag vor. Materiell bleiben: begrenzter gehosteter Pilot mit Budget/Region/Retention/Betreiber; öffentliche kooperative Work-Checkpoints oder durchgängig privater Weg; messbare Near-real-time-Pilothypothese am echten iPad; separate spätere Veröffentlichungsfreigabe.

## Nächste Aktion

Atlas routet ARG-BL-01–08 an Archibald; Forge baut noch nicht gegen V2. Danach genügt ein gezieltes Delta-Review. E1/E2 müssen vor breitem Ausbau die Quellenrisiken auflösen, E3 vor der Original-Pages-Abnahme.

