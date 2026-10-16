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

K3-Versuch: CLI-Turngrenze erreicht; Patch erhalten, QA ausstehend. Kein automatischer zweiter API-Aufruf. Aktuelles Kostenfeld bleibt sichtbar und zeigt bei unvollständiger Erfassung ausschließlich „Kosten nicht vollständig ermittelbar.“

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
