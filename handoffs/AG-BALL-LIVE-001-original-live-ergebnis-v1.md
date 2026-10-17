# AG-BALL-LIVE-001 — Lokaler Original-Live-Durchstich V1

Stand 17.10.2026. Enger technischer Prototyp bestanden mit UI-Grenzen, keine Produkt-/iPad-Abnahme.

## Beobachtetes Ergebnis

Ein laufender Forge-Prozess (Claude Code, tatsächliches Modell claude-opus-5-5) erzeugte eine reale Read-start-Meldung. Diese wurde aus stream-json gelesen, auf sichere Metadaten abgebildet, per authentifiziertem lokalen HTTP-Ingest empfangen und über SSE an die bereits geöffnete Originalseite weitergegeben. Kein Reload. Sichtbare ID REAL-39042768838-1 und Titel „Forge liest Kandidatcode · echte Laufzeitaktion“. Vor und nach beiden Screenshots lebte derselbe Prozess (PID3123), ohne beobachtetes Terminalresultat.

Das Ende des Screenshotintervalls liegt 44.138122720 Sekunden vor dem hostseitig beobachteten Terminalresultat. Capture→HTTP-Annahme auf derselben monotonen Hostuhr ca.1.51ms. Das ist keine allgemeine Latenzzusage; M5 wird als Screenshotintervall belegt.

## Versionen und Laufnachweise

- Originalbaseline d111b062770e32dbef0f9bb618a4923d88ff20be
- Unveröffentlichter Kandidat c7a8da04d9b06d83edcd110f210c0cf84d4aa8ba, Branch agent/ball-live-original-local-v1
- Forges Implementierungslauf https://github.com/pahlborn/agentarium/actions/runs/39041734240
- Prüfharness7c771012622a17c248f8c9fddad68ad00cf97fe9
- Komponenten+Echtquellenlauf https://github.com/pahlborn/agentarium/actions/runs/39042768838
- Komponenten:57 Checks bestanden, ausdrücklich synthetische Testdaten
- Sentinel:12 unabhängige Serverprüfpunkte + Code-/Artefakt-/Screenshotprüfung; PASS_WITH_LIMITS
- Rohartefakt12104319375, SHA256 b9e4fa67627be74088b369d6e7f8a0dd3800557ed10bc75652c7b5360501660f
- Dauerhafte Evidenzdateien: evidence/AG-BALL-LIVE-001-original-live-v1/
- Unveränderter Sentinel-Bericht: governance/AG-BALL-LIVE-001-original-live-sentinel-qa-v1.md

## Urheberschaft

Forge schrieb die fünf Kandidatdateien mit Edit. Atlas bereitete zuerst nur leere neue Dateien und ein Zeilenverzeichnis vor, integrierte den unveränderten Forge-Patch und schrieb den Prüfexecutor. Der erste V1-Lauf stoppte wegen tatsächlich fehlender Write/Glob/Grep-Tools und lieferte keinen Code. Nach Diagnose konnte Forge mit vorhandenen Read/Edit-Werkzeugen arbeiten. Keine Rechte wurden erweitert. Sentinel prüfte unabhängig, ohne Produktfix oder bezahlte Wiederholung.

## Offene Befunde

- AG-BL-UI-01: Technisches Panel überlagert Original-Ereignisliste teilweise. Owner Forge, offen. Vor visueller Produktabnahme platzsparend ohne Überdeckung integrieren.
- AG-BL-UI-02: progress erscheint als Ereignistext, erzeugt keine Ballbewegung/aktive Arbeitsanimation. Owner Forge mit gegebenenfalls Nova bei Produktgestaltung, offen. Vor Aktivitätsmonitor-Abnahme ehrliche Arbeitsdarstellung ergänzen.
- AG-BL-UI-03: Panel zeigt im Screenshot „Cursor0“, während Ereignis #1 empfangen wurde. Owner Forge, offen. Cursoranzeige muss mit letztem angenommenem Transportcursor übereinstimmen.
- Work/ChatGPT-Quelle und kooperativer Checkpointweg: noch nicht in diesem Durchstich nachgewiesen.
- Fernzugriff vom iPad, Hosted-Transport, Sicherheit im Fernbetrieb und echter Safari-Gerätetest: noch offen.
- Dauerhaftes Journal, Archiv, V3-Restbefunde: durch diesen lokalen In-Memory-Prototyp nicht geschlossen.

## Kostencheckpoint

Aktueller Implementierungs-/Prüfschritt: erster fehlgeschlagener Forge-Lauf USD0.1162898 + erfolgreiche Forge-Implementierung USD2.6617536 + reale Browserquellenprobe USD0.1952252 = USD2.9732686.
Bestätigte Claude-Summe dieser BALL-Live-Konzept-/Spezifikationsphase einschließlich vorherigem E1: USD15.72730145. ChatGPT-Kosten unvollständig, daher keine Gesamtkostenbehauptung und keine Kostenanzeige im Produkt.

## Nächster vollständiger Lieferweg

1. Die drei UI-Befunde im bestehenden Original beheben und die betroffenen Browserkriterien nachprüfen.
2. Work-Quellenfähigkeit mit gekennzeichnetem kooperativem Checkpoint konkret nachweisen; keine Volltelemetrie behaupten.
3. Einen erreichbaren Pilotdienst mit explizit freigegebenem Betreiber/Konto, Datenschutz und Kostenrahmen einrichten; der lokale 127.0.0.1-Dienst ist vom iPad nicht erreichbar.
4. Den gleichen Echtquellenlauf im geöffneten iPad-Safari am Original prüfen; erst danach nahezu-echtzeitliche Nutzung und Veröffentlichung zur Abnahme vorlegen.

Kein Merge, Pages-Release, Hostingkonto oder Dauerbetrieb wurde durch diesen Schritt eingerichtet.
