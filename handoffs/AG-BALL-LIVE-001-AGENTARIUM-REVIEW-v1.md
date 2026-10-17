# AG-BALL-LIVE-001 — Reviewauftrag an den Agentarium-Agenten

Stand: 17.10.2026, 18:07 Uhr Europe/Berlin  
Status: **REVIEW_ONLY** — keine Umsetzung, kein Merge, keine Veröffentlichung

## Entscheidung von Peter

Falls Agentarium angepasst werden muss, werden die Anforderungen und technischen Vorschläge zuerst in GitHub abgelegt. Peters Agentarium-Agent prüft sie. Eine Umsetzung folgt erst nach Peters Sichtung des Reviews und einer gesonderten Beauftragung.

## Ziel

Prüfe zwei zusammenhängende Punkte vollständig bis zum späteren iPad-Ziel:

1. die drei sichtbaren Befunde des lokalen Original-Livekandidaten;
2. den kleinsten echten Ende-zu-Ende-Weg, auf dem ein bereits geöffneter Agentarium-Monitor auf Peters iPad nahezu in Echtzeit reale Teamaktivitäten empfängt.

Der vorhandene Forge-Patch ist **Prüfmaterial, keine angenommene Lösung**. Er wurde nicht auf einen Produktbranch angewandt.

## Exakte Ausgangslage

- Original-Livekandidat: `c7a8da04d9b06d83edcd110f210c0cf84d4aa8ba`
- Vorherige reale lokale Feldprobe: Actions-Lauf `39042768838`
- Forge-Vorschlag: Aufgabe `AG-BALL-LIVE-001-FORGE-ORIGINAL-C2-V1`, Lauf `39047436322`, Session `55c4b360-cdde-4114-8fc3-4bc45d925110`
- Tatsächliches Modell laut Laufzeitnachweis: `claude-opus-5-5`; tatsächlicher Aufwandmodus nicht bestätigt
- Patch: `evidence/AG-BALL-LIVE-001-agentarium-review-v1/forge-original-c2.patch`, SHA-256 `0abe225d74e2814cde3b0deafcc4c9a6d17c1fb1bfdfeeb697b82f17e94036bc`
- Actions-Artefakt: `12106457872`, ZIP-Digest `sha256:b267023cc03a729ad2f1801186f5bcd5009009bd07af3193e662b75a3012e381`
- Forge hat **keine Tests ausgeführt** und nichts veröffentlicht.

Atlas hat nur mechanisch geprüft: Der Patch ist auf der exakten Baseline anwendbar; `feld/live.js` und `tests/AG-BALL-LIVE-001-local-live.cjs` bestehen `node --check`. Das ist keine fachliche Prüfung und kein Browser-PASS.

## A — Sichtbare Befunde und vorgeschlagene Änderung

| ID | Ist-Befund | Erforderliches Ergebnis |
|---|---|---|
| `AG-BL-UI-01` | Das feste BALL-LIVE-Technikpanel überdeckt die Originalliste. | Status und Nachweis dürfen weder Originalliste noch Hauptfeld überdecken; technische Details bleiben erreichbar. |
| `AG-BL-UI-02` | Ein reales `progress`-Ereignis ist nur als Textzeile sichtbar. | Ein angenommener Impuls erzeugt genau einen kurzen sichtbaren Takt am betroffenen Agenten und klingt vollständig ab. Kein einzelner Impuls darf einen dauerhaften Zustand „arbeitet“ vortäuschen. |
| `AG-BL-UI-03` | Die sichtbare Cursoranzeige kann nach Sequenz 1 auf 0 bleiben. | Alle sichtbaren Cursorwerte stammen aus demselben aktuellen Cursorzustand. |

Novas Leitplanke: kurzer Helligkeitsanschlag direkt am Agentennamen; keine Dauerschleife; danach bleibt nur das letzte beobachtete Arbeitssignal lesbar. Schweigen bedeutet „keine aktuelle Aktivität beobachtet“, nicht „untätig“ oder „fertig“.

Forge schlägt dafür einen nicht schwebenden, aufklappbaren Status in `#agRechts`, einen 1,4-Sekunden-Impuls am Agentennamen und eine zentrale `anzeigen()`-Funktion für den Cursor vor. Der Vorschlag ändert `feld/index.html`, `feld/live.js` und den bestehenden Playwright-Test. Details stehen unverändert im Handback und Patch.

### Besonders zu prüfen

1. Behebt das Layout die Überdeckung tatsächlich auf iPad/Telefon/Desktop, ohne neue Kollisionen im Original zu erzeugen?
2. Bleibt das Signal wahrheitsgemäß: einmaliger beobachteter Impuls statt behaupteter Dauerarbeit?
3. Ist die Versionsteilung korrekt? Seite und `live.js` werden `c2`, der unveränderte lokale Server meldet weiter `c1`. Der Server enthält außerdem einen eigenen Marker-Guard. Forge hat dies bewusst getrennt, aber nicht ausgeführt.
4. Bleiben alle bisherigen 57 Prüfungen wirksam? Sind die neuen Prüfungen belastbar und frei von falschen Positiven?
5. Gibt es Sicherheits-, Barrierefreiheits-, Safari- oder Leistungsregressionen?

## B — iPad-Pilot: die noch offene Architekturfrage

Der lokale Kandidat bindet nur `127.0.0.1`. Das iPad kann ihn deshalb nicht erreichen. Die bestehende HTTPS-GitHub-Pages-Seite kann nicht einfach einen unverschlüsselten privaten LAN-SSE-Endpunkt lesen; Mixed Content, Origin- und Authentifizierungsgrenzen stehen dazwischen.

Scout hat drei Wege geprüft:

- **LAN / gleiche Origin:** kleinster lokaler Pilot, wenn Monitor und SSE vom gleichen Rechner im LAN bereitgestellt werden und Peter einmal diese LAN-URL öffnet. Ein sichtbarer Safari-Tab ist für die Echtzeitabnahme nötig. Vorteil: kein externer Hoster. Offene Kernfrage: Wie gelangen reale Ereignisse aus Cloud-/GitHub-Actions-Agenten in dieses private Relay?
- **Temporärer HTTPS-Tunnel:** grundsätzlich erreichbar, aber Cloudflare Quick Tunnels unterstützen laut Hersteller kein SSE. Andere Tunnel sind hinsichtlich Kosten, Datenschutz und belastbarer Laufzeit noch nicht freigabereif.
- **Gehostetes HTTPS-Relay:** technisch tragfähig, benötigt aber Konto/Deployment, Authentifizierung, Betrieb und Datenschutzentscheidung; in diesem Auftrag nicht autorisiert.

Wichtig: Ein erreichbarer SSE-Server allein ist noch kein Live-Agentenfeed. Für den Pilot muss die gesamte Kette benannt und geprüft werden:

`reale Agentenaktion → Ereigniserfassung → authentifizierter Transport → Relay → bereits geöffneter iPad-Monitor → sichtbarer, korrelierbarer Nachweis`

## Dein Reviewauftrag

1. Prüfe Patch, Baseline, Forge-Handback und die vorhandenen Tests unabhängig.
2. Gib für A ein Urteil `PASS`, `CHANGES_REQUESTED` oder `REJECT`, mit exakten Befunden und minimalen Korrekturen.
3. Empfiehl für B **einen** kleinsten vollständigen Pilotweg. Benenne für jeden Prozess: Laufort, Start/Stop, Netzweg, TLS, Authentifizierung, erlaubte Ereignisfelder, Ausfallbild und die konkrete einmalige Handlung auf Peters iPad.
4. Zeige ausdrücklich, wie ein reales Ereignis aus der derzeitigen ChatGPT-/Claude-/GitHub-Actions-Laufzeit das Relay erreicht. Falls dies im LAN-Weg nicht möglich ist, lehne ihn als Ende-zu-Ende-Pilot ab oder ergänze den fehlenden Outbound-Mechanismus.
5. Nenne die für eine spätere Umsetzung zu ändernden Dateien, die notwendigen Tests und eine grobe Kosten-/Betriebsabschätzung. Noch nichts implementieren.

## Grenzen

- Keine Änderung am Original oder Produktbranch in diesem Reviewauftrag.
- Kein Merge, keine Pages-Veröffentlichung, kein Deployment, kein Hoster-/Tunnelkonto.
- Kein Demoereignis als Livebeleg.
- Keine Aussage „iPad-tauglich“ ohne Test auf dem echten iPad.
- Kostenanzeige im Produkt bleibt ohne vollständige Datengrundlage deaktiviert.

## Erwartete Rückgabe

Kurzer Reviewbericht mit:

`Urteil A | Befunde A | gewählter Pilotweg B | vollständiger Datenfluss | offene Risiken/Entscheidungen | spätere Änderungsdateien | Testplan | Kostenrahmen | keine Umsetzung erfolgt`

