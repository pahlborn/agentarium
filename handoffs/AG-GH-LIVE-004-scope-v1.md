# AG-GH-LIVE-004 — Nächster Live-Schritt

Peter beauftragte am 18.10.2026 um 05:33 Europe/Berlin einen echten Auftrag mit sichtbaren Übergaben zwischen Teammitgliedern. Seine spätere Windows-Frage ist ausdrücklich keine sofortige Anpassungsanforderung.

Basis: isolierter Pilot Fassung 50, main caebbbebd4b0a5a3c04bab97c0441ccb67f0b5fc; Quellkandidat c40b4cb5155b62bc31d0bb35a9d2ceb023530b17. Keine Architekturänderung und keine Änderung an regulärem feld/.

## Unabhängige Vorprüfung und Entscheidung

Argus (/root/argus_live_handoffs) prüfte den Entwurf gegen die exakten Originalquellen. Drei bestätigte Risiken: fehlende vollständige Aufgabenbindung; automatische Arbeits-, Abschluss- und Modellannahmen des Originals; Herkunft bisher nur bei progress sichtbar. Sentinel (/root/sentinel_expiry_fixes) fand unabhängig denselben Fallback auf den ältesten Auftrag und die fehlende Absenderdarstellung bei handoff.

Atlas entscheidet innerhalb des Auftrags: GitHub-handoff und contribution zeigen in diesem Slice ausschließlich beobachtete Kommunikation. Sie erzeugen keine automatischen Arbeitszustände, Erledigungen oder Artefaktabnahmen. Die bestehenden progress-Pulse bleiben Belege einzelner beobachteter Arbeitsschritte. Vollschlüssel (project_id, run_id, task_id), Sender, Empfänger, Ereignis-ID und Herkunft bleiben lesbar. Alte progress-Kommentare bleiben gültig; bei beiden Kommunikationsarten ist ein bekannter Empfänger Pflicht. test_result und artifact werden im Adapter weiterhin abgewiesen.

Forge wählt den kleinsten sicheren Weg und implementiert im Auftrag AG-GH-LIVE-004-FORGE-V1. Sentinel prüft den exakten Kandidaten im Originalbrowser. Keine simulierte Agentenantwort und keine synthetische Demonstration als Live-Nachweis.

## Reale Abnahme nach technischer Bereitschaft

Erst nach bestandenen Prüfungen erhält Peter den Link. Er öffnet den Monitor und bestätigt die Verbindung; danach startet Atlas einen neuen realen Fachauftrag. Vorherige Ereignisse des Implementierungslaufs sind beim späteren Verbinden historisch und werden nicht als frisch abgespielt. Der noch ausstehende Mehrrollen-Live-Nachweis auf dem Kundengerät wird nicht vorweggenommen.

Die Geräteentscheidung steht in governance/AG-DEVICE-001-policy-v1.md. Es ist noch keine numerische Ausschlussgrenze beschlossen und keine Anzeige abgeschaltet. Der Kostenausweis in der App bleibt pausiert.
