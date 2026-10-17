# Direkter GitHub-Livepilot im Original

Auftrag: Peter, 17.10.2026, „Bitte so umsetzen und pilotieren“.

Kandidat: `4854f44d1bc2f38363fa4d40478c6c4cc84c47c0`, Branch `agent/github-live-pilot-v1`.

## Was bereitgestellt wird

Die aus den Originalquellen gebaute Fassung 48 unter `pilot/github-live/` auf Peters GitHub Pages. Die bestehende `feld/`-Veröffentlichung wird nicht geändert. Aufruf mit `?live=github` schaltet automatisch in Live und lädt den GitHub-Leser. Ohne diesen Parameter bleiben Demo und Archiv verfügbar.

Lesetoken persönlich auf dem iPad eingeben. Es bleibt im Arbeitsspeicher der Seite und geht ausschließlich im Authorization-Header an api.github.com. Beim Verlassen oder Trennen wird es entfernt. Kein Token an Atlas schicken.

Nach „verbunden“ werden ausschließlich neue strukturierte Kommentare aus Issue #2 angenommen. Bestehende Kommentare bilden die Basis und werden nicht als frische Arbeit abgespielt. Bei einem neuen gültigen Ereignis erscheint eine Zeile im Original und ein kurzer Impuls am Agenten. Fortschritt erzeugt keinen Aufgabenabschluss und keinen dauerhaften Arbeitszustand.

## Beteiligung und Nachweise

- Forge: echter Claude-Code-Lauf [39066853084](https://github.com/pahlborn/agentarium/actions/runs/39066853084), Session `b0d3a4be-4cbe-4121-b04f-242d09856c29`, tatsächliches Modell `claude-opus-5-5`, Kosten 3,7246666 USD. Tests durch Forge NOT_RUN.
- Während dieses Laufs wurden 24 beobachtete Read-/Edit-Ereignisse als markierte JSON-Kommentare veröffentlicht. Beispiel: [GH-39066853084-1](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6240528376). Ereignisse stammen aus dem CLI-Laufzeitstrom; keine Prosaübersetzung.
- Atlas: Host/Transport, Integration des tatsächlichen Absenders `github-actions[bot]`, Korrektur von GitHub-Wartezeiten und Aufbauschnitt nach unabhängigem QA-Befund. Forge-Originalartefakt bleibt unverändert erhalten.
- Sentinel: separate reale Subagentenprüfung; zwei Fehler reproduziert und nach Korrektur vier Regressionen erneut bestanden. VM-Regressionsprobe ist beigefügt.
- Browser-Komponententest: 39 synthetische Prüfungen, ausdrücklich keine echte GitHub-/iPad-Abnahme. Exakter letzter Kandidatenlauf: [39068386056](https://github.com/pahlborn/agentarium/actions/runs/39068386056).

## Datenformat

Kommentar von `pahlborn` oder `github-actions[bot]`, Marker `<!-- AGENTARIUM_EVENT_V1 -->`, danach JSON mit Schema `agentarium.github-event.v1`, eindeutiger id, project_id, run_id, task_id, actor, kind=progress, title, occurred_at, source_evidence und source_tool_id.

`runtime_stream` bezeichnet beobachtete Claude-Werkzeugereignisse. `reported_checkpoint` wird sichtbar als gemeldeter Checkpoint gekennzeichnet und ist kein automatischer Laufzeitbeleg. Unmarkierte Prosa und unzulässige Ereignisse erzeugen keine erfundene Aktivität.

## Pilotabnahme auf dem iPad

1. Pilot-URL mit `?live=github` in Safari öffnen; Fassung 48 und GitHub-Live müssen erkennbar sein.
2. Persönlichen Lesetoken eingeben und „Verbinden“ betätigen. Basis wird eingelesen; historische Ereignisse werden nicht abgespielt.
3. Nach sichtbarem „verbunden“ den echten neuen Teamauftrag ausführen. Event-ID in Kommentar und Originalansicht vergleichen. Seite bleibt geöffnet; kein Neuladen.
4. Verbindungs-/Tokenfehler müssen sichtbar sein. Safari im Vordergrund lassen; Hintergrundbetrieb ist keine Echtzeitgarantie.

Bis Schritt 3 auf Peters Gerät beobachtet wurde, bleibt der iPad-Ende-zu-Ende-Nachweis offen. Die Schlüsselmessung aus PR #12 belegt Browserzugriff und authentifiziertes Limit, aber nicht schon diesen gesamten Weg.

## Grenzen und offene Arbeit

- Reguläre `feld/`-Seite bleibt Fassung 47. Pilot hat eine eigene URL unter Peters Ursprung, kein fremder Nachbau und kein neuer Relay-Server.
- Keine vollständige automatische Telemetrie sämtlicher ChatGPT-Aufrufe. Ehrlich gekennzeichnete Checkpoints können über denselben Kommentarweg angezeigt werden.
- Keine Kostenanzeige aus Teilbeträgen. Vollständige Projektkosten sind weiterhin nicht verfügbar.
- Die alte `agentarium-ipad-test...chatgpt.site`-Fassung 41 wird für diesen Pilot nicht verwendet.
- Veröffentlichung des Piloten ist keine Abnahme und kein Merge des Kandidaten in die reguläre Produktfassung.
