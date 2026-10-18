# AG-EVENT-ID-001 — Atlas Review von PR #17 V1

18.10.2026 · geprüfter Kandidat: Commit `2a8fa7f16553fc8b9f5ff10dfbf6fb2327eef0d4` · Basis `ea0e64fbc1c2d29a97117c51f298ada0e78a0593`

## Entscheidung

**Korrektur erforderlich; noch nicht veröffentlichungsbereit.** Der Kandidat ist fachlich weitgehend sauber begrenzt. Ein vereinbartes Pflichtkriterium fehlt.

### Einziger blockierender Befund

Bei einem direkten Aufruf von `window.__agEreignis(...)` mit ungültigem `short_ref` wird das Ereignis richtig angenommen und die Kurzreferenz verworfen. Die Originalaufnahme schreibt den Grund aber nur in die privaten Variablen `kurzAbgewiesen` und `kurzLetzterGrund`. Beide sind weder über Rückgabe, Getter, Bridge noch UI erreichbar.

Damit ist „ungültige Kurzreferenz nur verwerfen, Ereignis behalten, **Diagnose zugänglich machen**“ für die Originalaufnahme nicht erfüllt. Die Diagnose des GitHub-Adapters hilft bei einem direkten Originalaufruf nicht.

## Begrenzter Korrekturauftrag

1. Die erfolgreiche Rückgabe von `__agEreignis` muss bei einer ungültigen Kurzreferenz einen kurzen, stabilen Diagnosehinweis enthalten; `angenommen: true` und die technische Ereignis-ID bleiben erhalten.
2. Ohne `short_ref` sowie mit gültigem `short_ref` darf kein entsprechender Warnhinweis entstehen.
3. Das Ereignis darf wegen dieses einen Fehlers weiterhin nicht abgewiesen werden; Darstellung erfolgt ohne Kurzreferenz.
4. Die Diagnose begrenzen und maskiert behandeln; keine neue UI-Fläche, kein neuer Dienst.
5. Reproduzierbar prüfen: direkter Originalaufruf ungültig → angenommen plus Diagnose; gültig/fehlend → angenommen ohne Diagnose. Bestehende Adapterdiagnose und alte Ereignisse unverändert.
6. Exakten Folgecommit, Diff und wiederholbare Testschritte zurückmelden. Keine Veröffentlichung und kein Merge.

Keine weiteren Produktänderungen aus diesem Review ableiten.

## Versionsentscheidungen

- **Adapter `AG-GH-LIVE-001-v1.4`: bestätigt.** Die Änderung ist additiv und gehört zum Kandidaten.
- **Fassung 51 im Kandidaten unverändert: bestätigt.** Erst nach erfolgreichem Re-Review, unabhängiger QA und Peters Veröffentlichungsentscheidung würde der Publisher `FASSUNG`, `GEBAUT` und Service-Worker-`VORRAT` gemeinsam auf 52/aktuellen Bauzeitpunkt erhöhen. PR #17 soll diese Veröffentlichungsnummer nicht vorwegnehmen.

## Unabhängige Nachweise

- Argus: **PASS_WITH_NOTES, nicht veröffentlichungsbereit**, MAJOR-Befund bestätigt. Bericht `handoffs/AG-EVENT-ID-001-PR17-ARGUS-v1.md`.
- Sentinel: **FAIL** auf dem exakten Commit, derselbe Pflichtbefund unabhängig bestätigt. Kanonisierung 16/16 bestanden; F47 und Service Worker unverändert bestätigt. Browserregressionen konnten in Sentinels Umgebung wegen fehlender Chromium-Laufzeit nicht unabhängig wiederholt werden; daraus folgt kein Browser- oder Kunden-Live-PASS. Bericht `handoffs/AG-EVENT-ID-001-PR17-SENTINEL-v1.md`.

Keine Merge-, Release- oder Veröffentlichungsentscheidung.
