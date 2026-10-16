# Agentarium – interne Kosten- und Tokenaufzeichnung

Stand: 2026-10-14T04:19:33.639Z. Kein vollständiger Projektkostennachweis; nicht als Gesamtsumme in der Produktanzeige verwenden.

## Anzeigeanforderung AG-COST-UI-001

Eine tatsächliche Projektgesamtsumme darf nur bei vollständiger belegter Erfassung des klar bezeichneten Kostenumfangs erscheinen. Bei Lücken: keine numerische Gesamtsumme; Status „Kosten noch nicht vollständig erfasst“. Diese Anforderung ist dokumentiert, die Produktoberfläche noch nicht durch Forge geändert. Fiktive Mockdaten sind keine tatsächlichen Kosten.

## Claude – getrennte Ausführungsversuche

Tokenfelder sind Providerangaben. Thinking separat ausgewiesen; nicht nochmals zu Output addieren. Fehlende Werte sind nicht null Tokens. Geldbeträge sind gemeldete USD-Verbrauchspreise, keine geprüfte Rechnung.

| Agent | Auftrag | Session | Input | Output | Cache gelesen | Cache geschrieben | Thinking | USD | Nachweis |
|---|---|---|---:|---:|---:|---:|---:|---:|---|
| forge | AG-NACHTPOST-003-PARTITUR | 01f5361d | 4 | 52746 | 1038 | 9087 | 35246 | 0.5502893 | [Runtime](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6154458959) |
| forge | AG-NACHTPOST-003-GEWEBE | 605bcf7d | 4 | 59236 | 0 | 10163 | 39643 | 0.6177755 | [Runtime](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6154469562) |
| archibald | AG-VISUAL-004-ARCHIBALD | 29a10afb | 4 | 6638 | 0 | 12005 | 3363 | 0.1928010 | [Runtime](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6155228186) |
| forge | AG-VISUAL-004-FORGE | 826e7cc3 | 4 | 77274 | 0 | 51780 | 64232 | 0.9021980 | [Runtime](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6155477716) |
| cadence | AG-PROC-MODEL-001 | 71163eaf | nicht verfügbar | nicht verfügbar | nicht verfügbar | nicht verfügbar | nicht verfügbar | 0.0828760 | [Runtime](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6148789041) |
| forge | AG-RELAY-DIAG-001 | 7c6f52f0 | nicht verfügbar | nicht verfügbar | nicht verfügbar | nicht verfügbar | nicht verfügbar | 0.0084480 | [Runtime](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6150187431) |
| forge | AG-MOCK-FORGE-001-GEWEBE | 7636a21f | nicht verfügbar | nicht verfügbar | nicht verfügbar | nicht verfügbar | nicht verfügbar | 0.1460955 | [Runtime](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6150369477) |
| forge | AG-MOCK-FORGE-001-PARTITUR | 0107db87 | nicht verfügbar | nicht verfügbar | nicht verfügbar | nicht verfügbar | nicht verfügbar | 0.1285068 | [Runtime](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6150401561) |
| forge | AG-MOCK-FORGE-001-CORRECTION | a2a381de | nicht verfügbar | nicht verfügbar | nicht verfügbar | nicht verfügbar | nicht verfügbar | 0.0176255 | [Runtime](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6150511876) |
| archibald | AG-PROC-REVIEW-001 | 724c22a4 | nicht verfügbar | nicht verfügbar | nicht verfügbar | nicht verfügbar | nicht verfügbar | 0.0924060 | [Runtime](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6150728851) |
| forge | AG-PROC-REVIEW-001 | 0bda9588 | nicht verfügbar | nicht verfügbar | nicht verfügbar | nicht verfügbar | nicht verfügbar | 0.0254630 | [Runtime](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6150740099) |
| cadence | AG-PROC-REVIEW-001 | 9024fd9e | nicht verfügbar | nicht verfügbar | nicht verfügbar | nicht verfügbar | nicht verfügbar | 0.1237810 | [Runtime](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6150760833) |
| forge | AG-VISUAL-005-K3-FORGE-FINAL-V1 | 1292d0c3 | 18 | 11131 | 141812 | 39559 | 2234 | 0.2244247 | [Runtime](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6212103126) |
| forge | AG-VISUAL-005-K1-COUNTERPROBE-V1 | a307250d | 14 | 3013 | 91457 | 36893 | 262 | 0.1315362 | [Runtime](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6213044280) |
| forge | AG-PILOT-001-LOCAL-TRANSPORT-V1 | f0f7d565 | 16 | 10277 | 72913 | 23516 | 2824 | 0.1688833 | [Runtime](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6213264341) |
| forge | AG-PILOT-001-LOCAL-TRANSPORT-V2 | fdace86d | 10 | 6459 | 30310 | 24403 | 760 | 0.1286485 | [Runtime](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6213328234) |
| forge | AG-PILOT-001-ACTIVITY-V1 | d9d5ef20 | 18 | 27697 | 105215 | 38732 | 6134 | 0.3843575 | [Runtime](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6213943285) |
| forge | AG-PILOT-001-ACTIVITY-V2 | 3ba53364 | 16 | 13026 | 86446 | 27953 | 2503 | 0.2088191 | [Runtime](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6214054273) |

| forge | AG-PILOT-001-SOURCE-HOOK-V1 | bf2aa07d | 16 | 20838 | 111997 | 34869 | 8202 | 0.3067842 | [Runtime](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6216191294) |
| forge | AG-PILOT-001-FIELD-ADAPTER-V1 | b7b2bb73 | 16 | 3097 | 59438 | 21732 | 635 | 0.0912758 | [Runtime](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6216323172) |

K3-Versuch: CLI-Turngrenze erreicht; Patch erhalten und unabhängig geprüft. Der anschließende begrenzte K1-Testauftrag ist erfolgreich geliefert und durch Sentinel bestätigt: beide Prüfer grün, K1/K2/K3-Rückfälle erkannt. Liefercommit da860fd19f38e9938ed201546f2a6e5b4cc765f8. Kein Merge oder Deployment. Aktuelles Kostenfeld bleibt sichtbar und zeigt bei unvollständiger Erfassung ausschließlich „Kosten nicht vollständig ermittelbar.“

## ChatGPT – Erfassungslücken

| Agent | Input | Output | Cache | Thinking | Individuelle Geldzuordnung |
|---|---|---|---|---|---|
| Atlas | nicht verfügbar | nicht verfügbar | nicht verfügbar | nicht verfügbar | nicht verfügbar |
| Nova | nicht verfügbar | nicht verfügbar | nicht verfügbar | nicht verfügbar | nicht verfügbar |
| Scout | nicht verfügbar | nicht verfügbar | nicht verfügbar | nicht verfügbar | nicht verfügbar |
| Argus | nicht verfügbar | nicht verfügbar | nicht verfügbar | nicht verfügbar | nicht verfügbar |
| Sentinel | nicht verfügbar | nicht verfügbar | nicht verfügbar | nicht verfügbar | nicht verfügbar |

Die Work-Laufzeit stellt hier keine belegten Tokenzähler pro Agent bereit. Abonnementnutzung darf nicht als Nullverbrauch dargestellt werden. Auch bei Claude/Cadence bleiben ältere Sitzungen ohne erhaltene Usage-Metadaten nicht verfügbar.

## Fehlgeschlagene Versuche mit unbekannten Kosten

- AG-NACHTPOST-001-GEWEBE: No terminal usage returned; failed call may have incurred costs; [Nachweis](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6153675820).
- AG-NACHTPOST-002-GEWEBE: Terminal CLI exits nonzero; exact cost not preserved in failure evidence; [Nachweis](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6153976527).

## Weitere Erfassung

Jeder neue Auftrag: genaue Anforderungsversion, Agent/Session, tatsächliches Modell, Billing-Pfad, Provider-Tokenfelder oder explizit nicht verfügbar, Kostenquelle, Abbruch-/Retry-Status und Ergebnis. Keine erfundene anteilige Kostenverteilung bei mehreren Anforderungen in einem Aufruf. Die Datenbasis liegt in [AG-COST-001-register-v1.json](AG-COST-001-register-v1.json).

Aktualisierung 16.10.2026: Der reguläre K3-Codingaufruf oben ist neu erfasst. Keine zusätzlichen Modellaufrufe für die Buchführung. ChatGPT-/GitHub-Abrechnung bleibt unzugänglich; keine vollständige Gesamtsumme.

Lokaler Transport: V1 Worker erfolgreich, Runtime-QA FAIL14/18; V2 gezielt korrigiert, unabhängige Runtime-QA PASS18/18. Arbeitscommit19463534defa6f9c6b48812eeebf56433fa28e89; kein Merge/Deployment/echter Pilot. Beide Aufrufe0.2975318USD, kein Projektgesamtbetrag.

Aktivitätsmonitor: V1 an Turn-Grenze beendet, Patch erhalten, QA zunächst FAIL 11/14. V2 Worker erfolgreich, Aktivität 14/14 und Transport 18/18; redaktionelle README-Korrektur separat bestätigt. Browser-DOM nicht getestet. Beide Aufrufe zusammen 0.5931766 USD, kein Projektgesamtbetrag. Keine weitere Anthropic-Ausführung für die Dokukorrektur.

Quellerfassung: Sentinel PASS (Stream9/9, Diagnostik8/8, Capture8/8). Feldadapter V1: CA_QUESTION, nur lokale /field-Route geliefert; unabhängige Teil-QA PASS (Transport18/18, Aktivität14/14, Route und echte Daten16/16), vollständige Feldanbindung INCOMPLETE. Diese zwei Claude-Aufrufe zusammen 0.3980600 USD; kein Projektgesamtbetrag. Feldadapter V2 wurde vom bestehenden Private-Repo-Guard übersprungen, keine Schritte/kein Modellaufruf. Keine geschätzte Nullbuchung für andere Kosten.
