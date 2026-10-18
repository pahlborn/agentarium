# [AGENTARIUM:AG-EVENT-ID-001-PR17-REVIEW-V1:RA:RA_REVIEW:V1]

## Header

- Review: Empfängerkandidat PR #17, Commit `2a8fa7f16553fc8b9f5ff10dfbf6fb2327eef0d4`
- Baseline: `ea0e64fbc1c2d29a97117c51f298ada0e78a0593`
- Vorgabe: `AG-EVENT-ID-001-atlas-entscheidung-v1.md`, Blob `96666ae643b0e1e823ed6d73cf2522acd3fd6ae0`
- Repository/Zweig: `pahlborn/agentarium`, `claude/ag-event-id-001-kandidat`
- Geprüft: vollständiger PR-Diff und vollständige Fassungen von `pilot/github-live/index.html`, `pilot/github-live/github-live.js`; unverändertes `sw.js`; Kandidatenbericht; einschlägige Governance
- Zeitpunkt: 2026-10-18T06:19:01Z
- Reviewer: Argus, echter Subagent `/root/argus_event_id_review`; Auftrag `AG-EVENT-ID-001-PR17-REVIEW-V1`. Eine zusätzliche plattformseitige Lauf-ID wurde Argus nicht bereitgestellt.

## Verdict

**PASS_WITH_NOTES**, aber **noch nicht bereit für Veröffentlichung/Empfängerfreigabe**, solange F-01 offen ist. Kein BLOCKER; ein MAJOR und zwei NOTES. Signal: `RA_REVIEW`.

## Coverage

Geprüft wurden Vertrag und Rückwärtsverträglichkeit, vollständiger Diff, unbeabsichtigter Funktionsverlust im Quelltext, HTML/JS-Syntax, Maskierung der Kurzreferenz, kanonische Formatprüfung, gemischte Empfängerstände, Versionsführung, Fassung/Build/Service-Worker-Abhängigkeit und Source-/Build-Risiko. Nicht geprüft wurden veröffentlichter Browserstand, echtes GitHub-Live-Ereignis mit `short_ref`, reale Zwischenablage, reale Service-Worker-Aktualisierung und die berichteten Bildschirmmessungen; diese bleiben Sentinel/Kundenprobe.

## Findings

### F-01 — MAJOR · confirmed

- **Ort:** `pilot/github-live/index.html:5199-5206, 5251-5260, 5982-5994`
- **Kriterium:** Ungültiges `short_ref` muss auch in der Originalaufnahme verworfen werden, während das Ereignis weiterläuft, und die Diagnose muss zugänglich sein; Adapter und Originalaufnahme müssen eigenständig korrekt arbeiten.
- **Evidenz:** `kurzAbgewiesen` und `kurzLetzterGrund` werden in der Originalaufnahme nur lokal gesetzt. Im vollständigen Quellstand gibt es keine weitere Verwendung und keinen öffentlich lesbaren Diagnoseweg. Der Adapter stellt dagegen `kurzGrund` und `zahl.kurzUngueltig` über `window.__agGithub.stand()` bereit. Auf dem GitHub-Weg verdeckt der Adapter den Mangel, weil er ungültige Werte schon entfernt; ein direkter Aufruf von `window.__agEreignis()` verarbeitet das Ereignis still ohne zugängliche Diagnose.
- **Folge:** Der vereinbarte Empfängervertrag ist für die Originalaufnahme nur teilweise erfüllt; Fehleranalyse hängt unzulässig davon ab, dass derselbe Fehler zuvor im Adapter auftrat.
- **Erforderliche Korrektur:** Die bereits erfasste Originaldiagnose über eine bestehende, read-only Diagnoseoberfläche zugänglich machen oder eine gleichwertige kleinste Lösung liefern; keine neue Vergabelogik. Danach gezielte Regression: ungültiges `short_ref` direkt an `__agEreignis`, Ereignis angenommen, Kurz-ID nicht angezeigt, Diagnose lesbar.
- **Owner:** Agentarium-Agent; danach Sentinel.

### F-02 — NOTE · confirmed

- **Ort:** `pilot/github-live/github-live.js:66-78, 300-345, 603-606`; `pilot/github-live/index.html:5982-5994`
- **Kriterium:** Neue, alte und gemischte Empfängerstände müssen unterscheidbar sein.
- **Evidenz:** Die Teilfähigkeiten sind erkennbar (`B.kurzreferenz === 'short_ref-v1'` am Original, `__agGithub.kann === ['short_ref']` am Adapter), aber der Adapter berechnet daraus keine gemeinsame End-to-End-Fähigkeit. Bei neuem Adapter plus altem Original akzeptiert der Adapter `short_ref`; das alte Original ignoriert es, während `__agGithub.kann` weiterhin `short_ref` meldet. Bei altem Adapter plus neuem Original weist der alte Adapter das Feld vollständig ab.
- **Folge:** Die Kombination ist technisch unterscheidbar, aber nur durch gemeinsame Auswertung zweier Merkmale. `__agGithub.kann` allein darf nicht als Aussage verstanden werden, dass die geladene Gesamtkombination Kurzreferenzen darstellt.
- **Erforderliche Entscheidung:** Dokumentation/Test muss die kombinierte Bedingung festhalten; empfehlenswert ist eine eindeutig benannte End-to-End-Fähigkeit oder ein abgeleiteter Status. Das ist kein Veröffentlichungsblocker, solange die sichere Reihenfolge strikt befolgt wird und Produzenten noch kein `short_ref` senden.
- **Owner:** Atlas/Agentarium-Agent.

### F-03 — NOTE · confirmed

- **Ort:** `pilot/github-live/index.html:2232, 5995-5997`; `pilot/github-live/sw.js:15-17`; Kandidatenbericht Abschnitt „Source-/Build-Weg“
- **Kriterium:** Kein Verlust bestehender F51-Funktionen; sichere Ausrollung.
- **Evidenz:** Die direkte Änderung der F51-Dateien ist für diesen Kandidaten korrekt und der Diff enthält keinen Rückbau. Der Generator steht jedoch bei F46. Außerdem blieben `FASSUNG=51`, `GEBAUT` und `agentarium-v51` absichtlich unverändert.
- **Folge:** Der Kandidat darf so nicht veröffentlicht werden; ein späterer Generatorlauf kann die Änderung überschreiben. Beim autorisierten Veröffentlichen müssen Fassung, Bauzeit und Service-Worker-Vorrat gemeinsam steigen.
- **Erforderliche Aktion:** Veröffentlichungsschritt separat und nachvollziehbar ausführen; Issue #14/Source-of-truth-Risiko offen halten. Keine Änderung am Kandidatenzweig allein erforderlich.
- **Owner:** Publisher/Atlas; Source-of-truth später Forge/Agentarium-Agent.

## Acceptance matrix

| Kriterium | Status | Evidenz |
|---|---|---|
| `short_ref` optional, kanonisch, kein ID0000/Mehrfachformat | passed | Beide Implementierungen statisch geprüft; unabhängige 14-Fall-Rückprobe reproduziert |
| Ungültige Kurz-ID verwirft nur das Feld, Ereignis läuft weiter | passed | Adapter und Originalcode tun dies |
| Diagnose bei ungültiger Kurz-ID zugänglich | failed | Originaldiagnose ist lokal und unlesbar, F-01 |
| Keine clientseitige Vergabe/Sortierung/Umnummerierung | passed | Im vollständigen Diff nicht vorhanden |
| Anzeige aus maskierten Daten | passed | `esc(E.kurz)` in Liste und Blase |
| Technische ID/Quelle zugänglich und kopierbar | passed (code) | `spurWort(E)` enthält technische ID/Quelle; Listen-Handler kopiert die Herkunftszeile; Browserprobe nicht unabhängig wiederholt |
| Demo/Archiv/bisherige Ereignisse bewahrt | passed (static) | Änderungen sind optional und auf Live-Datenpfad begrenzt; beide vollständigen Skripte kompilieren |
| Versionierte Empfängerfähigkeit / Mischstände | passed with note | Zwei Teilmerkmale vorhanden; gemeinsame Aussage missverständlich, F-02 |
| Desktop/Tablet/kleiner Bildschirm | not tested | Nur Autorenbericht, keine unabhängige Browserausführung |
| Kein Doppelpatch, F47 unberührt | passed | PR ändert nur Bericht und zwei Pilotdateien |
| Fassung im Kandidaten unverändert | passed | Richtige Trennung Kandidat/Publikation; F-03 beachten |
| Adapterversion v1.4 | passed | Additive, rückwärtsverträgliche Empfängererweiterung gegenüber v1.3; Nummer ist sachgerecht |

## Evidence limits

Die Autorenprüfungen sind als synthetisch gekennzeichnet, aber keine Testartefakte sind Teil des PR. Argus hat die vollständigen Quellen und den Diff gelesen, beide vollständigen JavaScript-Skripte syntaktisch kompiliert und die 14 kanonischen Werte unabhängig nachgerechnet. Kein Browser, Zielgerät, Live-Kommentar, Service-Worker-Update oder Clipboard-Lauf wurde in diesem Review ausgeführt. Mergefähigkeit ist kein Qualitätsnachweis.

## Change impact

Betroffen sind nur der GitHub-Live-Adapter und die F51-Pilotdarstellung. Bestehende Ereignisse ohne `short_ref` bleiben im geprüften Code unverändert. Gespeicherte Daten und F47 werden nicht migriert. Produzenten, Archivleser und Kostenlogik sind nicht enthalten. Die spätere Produzentenaktivierung bleibt bis zur Empfänger-Veröffentlichung und realen Probe gesperrt.

## Open decisions

1. **Adapterversion:** `AG-GH-LIVE-001-v1.4` bestätigen. Empfehlung: bestätigen; additive Empfängerfähigkeit, keine Vertragsbrechung für Alt-Ereignisse.
2. **Publikationsfassung:** erst beim autorisierten Veröffentlichen vergeben. Empfehlung: Kandidat bleibt F51; Publisher erhöht anschließend `FASSUNG`, `GEBAUT` und `VORRAT` gemeinsam.
3. **Gemischte Fähigkeit:** entscheiden, ob Dokumentation der kombinierten Prüfung genügt oder ein abgeleiteter End-to-End-Status ergänzt wird. Empfehlung: kleinste eindeutige kombinierte Anzeige/Abfrage, weil sie Fehlersuche und sichere Produzentenfreigabe erleichtert.

## Next signal

`RA_REVIEW` für exakt `2a8fa7f16553fc8b9f5ff10dfbf6fb2327eef0d4`. Nächster Owner: Agentarium-Agent für F-01 und Disposition F-02; danach Sentinel gegen den korrigierten exakten Commit. Stop: kein Merge, keine Veröffentlichung und keine reguläre Produzentenausgabe aus diesem Review ableiten.
