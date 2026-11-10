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

### 10.11.2026 · Zweiter fachlicher Schnitt M-N3

M-N3 verwendet die vorhandene Rounding-Road-Aufgabe. Das Kind vergleicht die Abstände zu den benachbarten Hundertern und wählt die passende Begründung. Sind M-N3 und M-N5 zugleich als Fokus freigegeben, erhält jede Kompetenz einen Platz in derselben Tagesrunde. Hilfsaufgaben können reservierte Karten nicht mehr verdrängen.

112 gezielte Modul- und Regressionstests bestanden. Der getrennte Chromium-Lauf bestätigte beide Einträge nach Abgleich, beide Kartentypen in derselben Runde sowie zwei unabhängig nachgerechnete Rundungsvarianten und drei Subtraktionsvarianten. [Sentinel-Rücklauf](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6768499820) · [Entwurfs-PR #180](https://github.com/pahlborn/bis-school-app_src/pull/180) · [Quellcommit](https://github.com/pahlborn/bis-school-app_src/commit/f90271412eb336995183ef3b4e6cfe6cad6ec537)

Als Nächstes sind Korrektur und Rücknahme bestätigter Einträge vorgesehen. Upgrade-Abgleich und Systemabnahme auf Stufe 3c sind offen. Der Schreibweg bleibt auf den lokalen Testaufbau begrenzt.

### 10.11.2026 · Korrektur, Rücknahme und Konflikte

Eltern können bestätigte Bewertungen korrigieren oder zurücknehmen. Die Evaluations-ID bleibt erhalten. Frühere Fassungen sind unter Details sichtbar. Parallele Korrekturen behalten die gemeinsame Ausgangsfassung aktiv. Eine Elternbestätigung kann eine Fassung auswählen und den Konflikt auflösen. Die Rücknahme nimmt den zugehörigen Übungsfokus aus neuen Runden.

Der zusammengeführte Browserlauf bestätigte Vorschau, Korrektur, Abgleich, Rücknahme sowie die bestehenden Rundungs- und Subtraktionsvarianten. Sentinel prüfte zusätzlich den Einstufungswechsel von C zu RS. 115 gezielte Regressionstests bestanden. Zwei weitere Integrationstests belegten den Abgleich von Konflikt und Auflösung zwischen zwei Elternkonten und einem Kindkonto, in Simulation und über den lokalen GitHub-Protokollspeicher. [Sentinel-Rücklauf](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6768762515) · [Entwurfs-PR #180](https://github.com/pahlborn/bis-school-app_src/pull/180) · [Quellcommit](https://github.com/pahlborn/bis-school-app_src/commit/aad48d4abc30a81e7100855429a962f12d606529)

Upgrade-Abgleich mit einem Altprofil und Systemabnahme auf Stufe 3c stehen aus. Der Schreibweg ist auf den lokalen Testaufbau begrenzt.

### 10.11.2026 · Upgrade-Abgleich im bestehenden Profil

Peter nahm den lokalen Stand für Korrektur und Rücknahme an und gab den Upgrade-Abgleich frei.

Nach einem Upgrade liest Big Quest jeden bereits bekannten Schulbereich einmal vom Anfang. Der vorhandene Protokollstand und die Paketnummern bleiben erhalten. Die App übernimmt gültige, zuvor übersprungene Bewertungen genau einmal. Bei einem Abbruch bleibt der bisherige Cursor erhalten, sodass der nächste Abgleich erneut ansetzt. Andere Bereiche verwenden ihren vorhandenen Cursor weiter.

Der lokale Chromium-Test belegt den Formatabbruch am historischen App-Stand `eb354e31`, den weitergeschobenen Cursor und die Wiederherstellung derselben Bewertung im selben Browserprofil mit unveränderter Anmeldung und Gerätekennung. Die zugehörige Karte erschien einmal und wurde korrekt gelöst. Der reproduzierbare Browserlauf steht in `tests/evaluation-upgrade-browser.test.mjs`. 117 gezielte Regressionstests bestanden. [Sentinel-Rücklauf](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6769025390) · [Entwurfs-PR #180](https://github.com/pahlborn/bis-school-app_src/pull/180) · [Quellcommit](https://github.com/pahlborn/bis-school-app_src/commit/249e9779b2ddbb24f99f5acd98af2ba92155a2b2)

Der Schreibweg ist weiterhin auf den lokalen Testaufbau begrenzt. Die Systemabnahme auf Stufe 3c bleibt der nächste getrennte Schritt.

### 10.11.2026 · Vorbereitung der Systemabnahme auf Stufe 3c

Der Testbau setzt die Freischaltung für die offizielle HTTPS-Adresse und den privaten Testdatenspeicher. Eltern sehen je Fassung, ob sie lokal gespeichert oder vom App-Speicher bestätigt wurde. Der Status bleibt im Verlauf auch nach einem Neuladen erkennbar.

Der lokale Testbau bestand 18/18 Suchprüfungen mit synthetischen Daten. 36 gezielte Regressionstests bestanden. Sentinel prüfte die Aktivierungsgrenzen, den Eltern-Kind-Durchlauf mit M-N5 und M-N3 sowie zwei Unterbrechungen im Browser. Nach Wiederverbindung gab es jeweils genau eine wirksame Bewertung. Die offizielle HTTPS-Herkunft und der Speicherzugriff liefen in einem isolierten Browseraufbau mit lokalem GitHub-Nachbau. [Freischaltungsprüfung](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6769568601) · [Unterbrechungsprüfung](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6769606625) · [Entwurfs-PR #180](https://github.com/pahlborn/bis-school-app_src/pull/180) · [Quellcommit](https://github.com/pahlborn/bis-school-app_src/commit/7118b28a1d5410de75c4be392352a885a26813b5)

Auf der veröffentlichten Testadresse läuft weiterhin Beta 0.152 (`eb354e3`). Für den Testrelease braucht es Peters ausdrückliche Freigabe, Integration und Versionierung auf `main`, den vollständigen Test- und Suchlauf auf Peters Rechner und den Push ausschließlich ins Test-Pages-Repo. Die Systemabnahme folgt am bestätigten Live-Teststand mit fiktiven Familien, bestehendem Profil und zweitem Gerät.
