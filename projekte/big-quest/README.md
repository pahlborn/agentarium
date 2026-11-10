# Big Quest · Projektarchiv

Stand 10. November 2026. Projekt-ID **big-quest**, Kürzel **BQ**.

## BQ-EVAL-01 · Manuelle Schulevaluationen

**Ziel.** Eltern übertragen eine Bewertung in Big Quest, nachdem die Lehrkraft sie über Toddle informiert hat. Big Quest speichert die bestätigte Evaluation beim gewählten Kind. Die Tagesrunde verwendet den fachlich bestätigten Fokus.

**Ausgangspunkt.** Der lokale Browsertest belegte die Zuordnung von M-N5 und das Lösen einer gezielt ausgewählten Zweischritt-Aufgabe. Für die Umsetzung wird der reguläre App-Code mit bestehender Anmeldung, Rollenprüfung, Speicherung, Synchronisation und Übungslogik verwendet. Die Entwicklungsdaten und die Konten für die Abnahme sind fiktiv.

**Erster Lieferumfang.** M-N5 durchgängig vom Elternformular bis zur gelösten Aufgabe. Bewertungen einzeln speichern und den Verlauf erhalten. Der nächste fachliche Fall ist M-N3. Korrekturen, gleichzeitige Änderungen, falsche Rollen, Wiederholung, Versionswechsel und Abgleich auf einem zweiten Gerät sind Abnahmefälle.

**Umgebungen.** Eigener Entwicklungszweig vom privaten Quellrepo, geprüfter Basisstand Beta 0.152. Lokaler regulärer Testbau für die Entwicklung. Systemabnahme im freigegebenen Build der bestehenden [Testinstanz Stufe 3c](https://big-quest-test.github.io/) mit dauerhaftem privatem Testdatenspeicher.

**Stand zur Einrichtung.** Umsetzungskonzept v1.0 mit sechs User Stories und zehn Abnahmefällen liegt vor. Der lokale Vorlauf ist fachlicher Nachweis. Die Systemabnahme steht aus. Die nächste Aktion ist, den M-N5-Durchlauf als erste echte Änderung im App-Quellrepo vorzubereiten und mit dem vorhandenen Testbau zu prüfen.

**Nachweisführung.** Live-Meldungen und Archivwiedergabe verwenden [Issue #2](https://github.com/pahlborn/agentarium/issues/2). Dieses Register verweist beim Handback auf die tatsächlichen Aufträge, Commits und Prüfnachweise. Der Abschluss wird mit Datum und Ergebnis ergänzt, sobald er belegt ist.

### 10.11.2026 · Erster Schnitt im Entwicklungszweig

Peter bestätigte die Sichtbarkeit im Monitor und gab die Umsetzung frei. M-N5 ist im regulären App-Code auf `feature/evaluation-eltern` implementiert. Der Entwurf bleibt bis zur Freigabe im Formular. Danach speichert Big Quest eine einzelne Evaluation im verschlüsselten Schulbereich. Der bestehende Aufgabenmotor erzeugt die zugeordnete Zweischritt-Aufgabe.

**Nachweis.** Sentinel prüfte getrennte Chromium-Profile mit fiktiven Konten und lokalem GitHub-Protokollspeicher. Vor der Freigabe gab es auf beiden Geräten kein Evaluationsereignis. Danach kam beim Kind genau ein Ereignis an. Zwei Zahlenvarianten wurden unabhängig nachgerechnet und über das App-Tastenfeld richtig gelöst. 70 gezielte Modul- und Importprüfungen bestanden. Die fünf zunächst wegen einer fehlenden Datei im lokalen Quellauszug ausgefallenen Prüfungen des erweiterten Laufs bestanden nach Ergänzung der Basisdatei.

**Artefakte.** [Entwurfs-PR #180](https://github.com/pahlborn/bis-school-app_src/pull/180) · [Quellcommit `2de079c4`](https://github.com/pahlborn/bis-school-app_src/commit/2de079c4095079eb978c4ecb09eef6174480c69b) · [Sentinel-Rücklauf im Journal](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6767821068).

**Nächster fachlicher Schnitt.** M-N3 ergänzt Runden mit Abstandsbegründung als zweiten Fall für die Zuordnung. Korrektur, Rücknahme, Upgrade-Abgleich und Systemabnahme auf Stufe 3c sind offen. Die Eingabe ist bis zum Upgrade-Nachweis auf den lokalen Testaufbau mit lokalem Speicher begrenzt.
