# AG-BALL-LIVE-001 — Entscheidungsbrief V1

Stand: 2026-10-17, nach Archibald V3, Argus G3, Sentinel G3 und Scout D-P1.

## Ergebnis

Die Zielarchitektur ist plausibel, die vollständige Spezifikation V3 ist dauerhaft gesichert, aber der Gesamtbau ist noch nicht freigegeben. V3 schließt wesentliche V2-Defekte. Argus und Sentinel bewerten die vollständige Implementierungsreife weiterhin mit FAIL. Nach zwei Korrekturzyklen wird keine dritte Vollspezifikationsrunde gestartet.

## Exakte Grundlage

- Spezifikation: `specifications/AG-BALL-LIVE-001-mvp-spezifikation-v3.md`
- Spec-Blob: `80ba7171b956d45885b096665cb0fecc770e8d1b`
- Spec-Commit/Prüfstand: `a31b9e7fbb4c1fa4fd58b193abe6799aa969d53d`
- Archibald-Run: https://github.com/pahlborn/agentarium/actions/runs/39030948445
- Archibald-Modell: `claude-opus-5-5`; angefordert opus/high; tatsächliches Reasoning unbestätigt
- Recoverykosten: USD 2.4083518
- Produktänderungen/Tests/Deployment: keine

## Geschlossen

- Gesamtlauf und Claude-Ausführung getrennt; nur Atlas schließt den Gesamtlauf.
- Idempotenz- und Provenienzidentitäten definiert.
- Auditjournal und V2.1-Archivprojektion getrennt.
- Öffentliche und private Datenwege durchgängig unterschieden.
- Original erhält einen kleinen Closure-internen Initialisierungs-/Versionshook statt Ersatzoberfläche.
- Claude-Prozessende ersetzt Actions-Jobstatus als Laufendbeleg.
- Cursor, Snapshot, Storage, Auth, Markup, XSS und Erlebnis-Hypothese sind weitgehend konkretisiert.

## Noch vor Gesamtbau zu schließen

1. **Reconciler:** Er muss auch den ersten verlorenen Webhook nach Ruhephase entdecken und Rückstände über 500 Kommentare mit persistierter Pagination fortsetzen.
2. **Archivfinalisierung:** Das Manifest darf erst nach definiertem Abgleichfinale eingefroren werden oder muss unveränderlich versioniert werden.
3. **Zeitbeweis:** Verzögerte SSE-Heartbeats und ein anderer Request-RTT ergeben keine sichere Uhrgrenze. Ohne gemeinsame Zeitbasis ist die Messung nur Schätzung und kein Laufendbeweis.
4. **Vertrags-/Testdetails:** identische Envelope-/Event-ID im Beispiel, vollständige CORS-Header, präzise Nachholkennzeichnung, TRU-02 nur auf Produktzustandsbehauptungen, vollständige Archiv-Golden-Fixture und ausdrücklicher FR-2.6-Negativfall.

## Arbeit, die Forge davor gefahrlos beginnen kann

- F0: Produktbaseline `d111…` und begrenzte Originalanschlusspunkte inventarisieren.
- Isolierter E1-Quellenspike: beweisen, dass ein echter Claude-Prozess vor seinem Ende ein Zwischenereignis an einen lokalen/Harness-Empfänger liefert.
- Anbieterneutraler Ingest-/Journal-Kern und lokale Tests, soweit sie nicht von Reconciler, Archivfinalisierung oder Zeitbeweis abhängen.
- Kein Deployment, kein Pages-Release, kein öffentlicher Work-Checkpoint und kein iPad-Abnahmetest.

## Hosting-Research

Cloudflare Workers + Durable Objects passt technisch, erfüllt aber weder eindeutig einen gesamten EU-Datenweg noch einen harten Bruttodeckel von 10 EUR. Ein deutsches Hetzner-CX23 mit Container und SQLite ist für EU-Verarbeitung klarer; erwarteter Grundpreis mit IPv4, täglichen Backups und 19 % USt etwa EUR 8.43/Monat. Zusatzverbrauch ist auch dort kein garantierter Spend-Cap.

Safari-Fetch-Streaming hatte 2026 einen inzwischen geschlossenen WebKit-Fehler; der Fixstand auf Peters iPad ist unbekannt. E3 auf dem echten Gerät bleibt zwingend.

## Entscheidungen Peter

1. **Vorgehen:** Forge darf jetzt F0, E1 und die unstrittigen lokalen Kernteile bauen; die vier Restpunkte werden dabei als bindende technische Constraints geschlossen und anschließend gezielt geprüft. Empfehlung: **Ja**, statt einer dritten Archibald-Vollrunde.
2. **Pilotbetrieb:** Empfehlung Hetzner Deutschland, maximal EUR 10 brutto/Monat als Betriebsziel; technische Abschaltung vor Zusatzkosten muss Forge nachweisen. Noch keine Kontoeröffnung oder Bestellung.
3. **Sichtbarkeit:** öffentlicher Pilot mit minimalen Aufgabenmetadaten oder durchgängig privat. Empfehlung für diesen öffentlichen Projektpilot: öffentlich, aber nur Actor, Art, kurzer nichtvertraulicher Titel, Run-/Event-ID und Zeit.
4. **Retention:** Empfehlung: Ingest nach 30 Tagen schließen, Rohjournal nach 30 Tagen löschen, minimiertes Archivmanifest bis Tag 180 lesbar halten und dann löschen.
5. **Erlebnishypothese:** Empfehlung: Claude Median <=5 s/Maximum <=15 s; Work Median <=10 s/Maximum <=30 s. Funktionsnachweis und Erlebnisurteil bleiben getrennt.
6. **Release:** Fassung 48 auf Pages bleibt eine spätere separate Freigabe.

## Kostenstand

Bestätigte Claude-Kosten dieser BALL-Live-Konzept-/Spezifikationsphase: USD 12.33620725. ChatGPT-Kosten sind nicht vollständig laufzeitbestätigt; daher keine Gesamtkostenbehauptung.

## Nächster Schritt nach Entscheidung

Atlas beauftragt Forge mit einem einzigen gestuften Implementierungsauftrag: zuerst F0 und E1 als Stop/Go-Beweis, danach nur bei Erfolg den lokalen Kern. Sentinel prüft die ausführbaren lokalen Kriterien; Argus prüft die vier Restconstraints. Hosting und öffentlicher Work-Weg beginnen erst nach den entsprechenden Entscheidungen.
