# AG-NACHTPOST-003 — Forge-Mocks und QA V1
Stand: 2026-10-13
Status: FUNCTIONAL_PASS_WITH_LIMITS; visuelle Browserabnahme NOT_TESTED
Repository: pahlborn/agentarium; feature/visual-stage-v0
Keine Architekturänderung, Merge-, Release- oder Veröffentlichungsentscheidung.

## Autorenschaft und Grenzen
Nova lieferte die kreative Gewebe-/Partitur-Richtung (echter Subagent /root/nova_visual_probe_001, AG-VISUAL-003/NOVA V1).
Atlas verdichtete Peters/Nova-Ideen und NACHTPOST-Geschichte zu einer ausdrücklich fiktiven Fixture, orchestrierte und reparierte den Relay.
Forge schrieb beide hier gelieferten HTML-Mocks in getrennten tatsächlichen Claude-Sitzungen. Atlas extrahierte jeweils genau einen HTML-Codeblock und ergänzte den abschließenden Zeilenumbruch; kein Produktcode wurde verändert.
Die kurz begonnene lokale Atlas-Renderung ist ausgeschlossen und wurde nicht übernommen.
Gewebe UND Partitur bleiben gleichberechtigte Entwürfe, keine Richtungsentscheidung.

## Ausführung
Run: https://github.com/pahlborn/agentarium/actions/runs/38461500450
Beide Jobs success. Angefordert Sonnet/Medium, tatsächliches Modell laut CLI modelUsage claude-sonnet-5-5; tatsächlicher Denkaufwand unconfirmed.

| Variante | Sitzung | Handback | Zeit Sekunden | CLI-gemeldete USD |
|---|---|---|---:|---:|
| Gewebe | 605bcf7d-ae4e-4a5e-88cc-bcbee2a87931 | Issue #2 Kommentar6154469562 | 401.555 | 0.6177755 |
| Partitur | 01f5361d-d8af-414b-9d41-a0a016a5adcc | Issue #2 Kommentar6154458959 | 361.666 | 0.5502893 |
| Summe | | | | 1.1680648 |

Peters neue Freigabe USD2 für beide Mocks: governance/decisions/AG-NACHTPOST-003-BUDGET-v1.md.
Provider-Restsaldo unbekannt. Die Kosten oben gelten nur für diesen erfolgreichen Versuch, nicht das gesamte Projekt. Frühere abgebrochene NACHTPOST-Läufe behalten unbekannte Kosten.
Gemeldete numeric Usage einschließlich Token getrennt proSitzung im append-only relay/task-evidence.jsonl. Thinking-Tokenzahlen sind Usage-Metadaten, keine Veröffentlichung von Gedankentexten.

## Artefakte
- previews/AG-NACHTPOST-003-gewebe-v1.html — SHA256 1ccf70a99d27486b43c480a8667e759c351b4c748988a0a27089b298215f40fe
- previews/AG-NACHTPOST-003-partitur-v1.html — SHA256 b1e720ad06f98f724b946341680e6392b53ba66b30306a396df7611aaf2fc4ee
- Gemeinsame ursprüngliche Fixture am Baselinecommit: SHA256775dbca8a904a3e8f0c96ab05f5fa713f1c489b2cbc5091aa6da83d3d634e6c5
- QA-Fixture tests/nachtpost-003/fixture.json: SHA256a83886016cfaf312c0538ab86dbb6c72c3e056bd3204c0225cbb86aaafaf40ec; semantisch dieselben34Ereignisse, Unterschiede nur JSON-/Zeilenformat.
- Checkpoint-Artefakte im Actions-Run: nachtpost-003-gewebe (11847190681), nachtpost-003-partitur (11845603519). Ausgabetext und bereinigte Laufzeitmetadaten, keine Rohstreams oder Thinking-/Signaturblöcke; Aufbewahrung14Tage. Die fertigen Mocks und QA sind dauerhaft im Repository gesichert.

## Unabhängige QA
Partitur: Sentinel /root/sentinel_agentarium, 18Prüfgruppen PASS.
Gewebe: Sentinel /root/sentinel_nachtpost_gewebe, 12Prüfgruppen PASS.
Beide PASS_WITH_LIMITS. Nodev24.19.0, kontrollierte RAF-Uhr, VM, DOM-/Canvas-Testdoubles plus statische Prüfung.
Geprüft: dieselbe120sGeschichte und34Ereignisse; Verantwortung proAufgabe und Parallelität; PLAY/PAUSE/SEEK/STEP/Ende/Replay/Speed; hiddenfreeze/kein Rückkehrsprung; ReducedMotion; IDs/Rollen/Plattform/unbestätigteDemoModelle; erfundene kumulativeKosten USD0.63; keine Netz-/Storage-/Assetabhängigkeiten; Dockstruktur und Mobilstapelung statisch.
Keine Funktionsfehler reproduziert, keine Produktkorrekturen erforderlich.

NOT_TESTED: tatsächliche Pixel, Browserbedienung, mobile Überdeckung, Safari-/iPhone-Kompatibilität, künstlerische Wirkung. Chromium-Datei fehlt; VM ist keine Browserabnahme.

Reproduktion aus Repositoryroot:
```sh
node tests/nachtpost-003/qa-partitur.cjs previews/AG-NACHTPOST-003-partitur-v1.html tests/nachtpost-003/fixture.json
node tests/nachtpost-003/qa-gewebe.cjs previews/AG-NACHTPOST-003-gewebe-v1.html tests/nachtpost-003/fixture.json tests/nachtpost-003/acceptance.json
```
FAIL setzt Exitcode1. Kriterien: handoffs/AG-NACHTPOST-001-acceptance-v1.json; exakteQA-Baseline zusätzlich tests/nachtpost-003/acceptance.json.
Berichte: tests/nachtpost-003/qa-{gewebe,partitur}.json.

## Inhaltliche Fiktionsgrenze
Die dargestellten Rollenaktionen, Internet-/GitHub-/API-Wege und USD0.63Demokosten sind fiktive NACHTPOST-Beispieldaten. Es gibt in diesen Mocks keine echten externen Verbindungen. Die tatsächlich ausgeführten Nova-/Forge-/Argus-/Sentinel-Beiträge sind davon getrennt dokumentiert.
