# AG-ARCH-001 V1 — Gesamtarchitektur und Ein-Ereignis-MVP

Erstellt 2026-10-17 durch Atlas; Notationsrecherche durch realen Scout /root/scout_architecture_notation (RKA_READY); unabhängige Diagrammprüfung durch realen Argus /root/argus_pilot_recovery (RA_REVIEW V1 PASS_WITH_NOTES). Argus verlangte explizite GitHub-Leserichtung; zwei gerichtete Lese-/Schreibpfeile sind eingearbeitet. Keine Produktveröffentlichung oder Architekturentscheidung folgt aus der Zeichnung.

## Zwei Ansichten
- AG-ARCH-001-overview-v1.svg: C4-orientierte Verteilungsansicht, keine Behauptung eines reinen C4-Containerdiagramms. Ausführungsorte OpenAI Work, GitHub Runner, Anthropic API und Peters Browser getrennt. GitHub Pages ist statischer Host; das Feld wird im Browser gezeichnet. Rollen sind keine acht eigenständigen Services.
- AG-ARCH-001-mvp-v1.svg: dynamische Sequenz genau eines realen Argus-Reviewergebnisses. Atlas exportiert den Handback toolgestützt; kein automatischer allumfassender Collector. Ein fester Same-Origin-JSON-Abruf führt zu den bestehenden __agLauf/__agEreignis-Hooks. __agLauf übernimmt Projekt/Titel, zeigt die mitgelieferte run_id derzeit nicht an.

## Statuslegende
Durchgezogen: belegter Bestandteil/Schritt. Gestrichelt: offen/vorgesehen. M und violetter Rahmen: fachlicher MVP-Umfang, kein Erfolgsstatus. Separat grau: späteres Konzept (AG-DATA-001) mit unentschiedenem Betriebsort/Transport. Keine Wahl eines zentralen Servers, SSE, Cursors, Replay oder Dauerbetriebs für den MVP.

## Geprüfte Primärquellen
- https://c4model.com/diagrams/deployment — Verteilung von Softwareinstanzen auf Ausführungsumgebungen.
- https://c4model.com/diagrams/dynamic — gerichtete, geordnete Laufzeitinteraktion für einen konkreten Anwendungsfall.
- https://c4model.com/diagrams/notation — Titel, Legende, Elementtyp, Verantwortung/Technik und beschriftete gerichtete Beziehungen.
- https://c4model.com/diagrams/container — Softwareanwendung/Datenspeicher als Container; Rollen sind nicht automatisch Container.
Atlas hat diese offiziellen Quellen zusätzlich zu Scouts Recherche selbst geöffnet. Die gewählten Statusfarben sind unsere Konvention, nicht ein vorgeschriebenes C4-Farbschema. Keine kopierten Diagrammvorlagen.

## Projektbelege
Source baseline 407abc1ebd45476f261189a97dc261b3fc2b440c: AGENTS.md, relay/role-routing.json, feld/index.html, bestehender Generator/Pages-Bau und concepts/AG-DATA-001-live-archive-data-concept-v1.md (nur Entwurf).

Forge-Ausführung https://github.com/pahlborn/agentarium/actions/runs/39006658377; Session1392f06b-b18f-488b-aa2c-7ddda60fdad7; patch69442975acc315f73b88190dc7f5dfb86ca494fc1cbb5dc65e88d974b9784f61.

Sentinels unabhängiger Browserlauf https://github.com/pahlborn/agentarium/actions/runs/39007084765 hat vier Fälle am isolierten ORIGINAL-Generator plus bestehendem pages.py-PWA-Paket bestanden. Bericht governance/AG-PILOT-001-one-event-sentinel-qa-v1.md. Keine Abnahme der veröffentlichten Originalseite; diese wurde nicht verändert.

Pages-Konfiguration und konkret aktivierter Veröffentlichungsref konnten mit dem vorhandenen Connector nicht nachgelesen werden. Repo hat Pages und default branch main; daraus folgt NICHT, dass main als Pages-Quelle konfiguriert ist. Das bleibt ausdrücklich ungeprüft.

## Arbeitsvereinbarungen Peter, 2026-10-17
Am Abschluss eines Arbeitsabschnitts konkrete Frage zum Weitermachen stellen. Kosten gebündelt an sinnvollen Zwischenständen statt bei jeder Aktion; bei drohender wesentlicher Überschreitung frühzeitig melden. Retrospektiv Aufwand pro brauchbarem Ergebnis einschließlich Atlas-Umwegen/Nacharbeit bewerten. Keine pauschalen Ein-Zug/Kleinstdeckel als Arbeitsstandard. Aktueller Effektbeleg: Forge konnte den begrenzten Auftrag über22Züge abschließen; isolierte Integration danach geprüft. Dies beweist noch keinen dauerhaft verbesserten Gesamtprozess.
