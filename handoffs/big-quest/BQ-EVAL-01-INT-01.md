# BQ-EVAL-01-INT-01 · Vollständigen bereinigten Entwicklungskandidaten herstellen

Auftragsfassung v2 · 15.11.2026 · Steuerung: Atlas im zentralen Big-Quest-Steuerungschat · Ausführung: Atlas in genau einem separaten Entwicklungs-Chat.

## 1. Startsequenz – vor der Ausführung

1. Lade und verwende `operate-as-atlas`. Lies diesen Auftrag vollständig sowie die beigefügte Gesamtübergabe zuerst über `Big-Quest-Atlas-Gesamtuebergabe.md`. Folge den relativen Links zum aktuellen Stand, Konzept, Backlog, Übergabevermerk und den für diesen Auftrag benötigten Nachweisen. Library-Zugriff ist dafür nicht erforderlich. Texte zu früheren nächsten Schritten sind keine erneute Freigabe alter Aufträge.
2. Lies das tatsächlich aktuelle `AGENTS.md` und die geltende Agentarium-Process-Karte, ergänzend relevante Rulebook-Abschnitte. Letzte hier geprüfte Basis: Rulebook/Process 1.4, Agentarium-main `9962810b895baf10f8d71dd9a1f7387cca049b77`. Überprüfe diese Basis; behaupte keine neuere Regeladoption allein aus Dokumenttiteln. Jüngste ausdrückliche Entscheidungen Peters gehen vor älteren Projekttexten.
3. Nenne knapp: geladene Regeln mit Commit, lokale Ausgangsbasis, aktuellen GitHub-main-Stand, tatsächlichen Auftrag und Grenzen, vorhandene Eingaben und technische Rollen-/Ausführungswege. Prüfe vorhandene lokale Änderungen, bevor du etwas überschreibst.
4. Projekt `big-quest`, Lauf `BQ-EVAL-01`, Task `BQ-EVAL-01-INT-01`. Monitor ausschließlich Archivmodus, kein Livebetrieb; diese Wahl ist bereits getroffen und nicht erneut zu erfragen. Vorhandene Ereignisfolge und aktuelle Cursor soweit zugänglich prüfen; Unbekanntes bleibt unbekannt. Nur tatsächliche Schritte, Rollen und Zustellungen journalisieren. Lokale Ereignisvorlagen sind keine veröffentlichte Archivspur. Keine erfundenen Workerstarts oder technischen Stoppbelege.
5. Rollen gezielt einsetzen: Forge ist regulärer technischer Owner; Argus prüft den entscheidenden Integrations-/Bereinigungsstand unabhängig; Sentinel ergänzt nur eine konkrete wesentliche Prüflücke. Archibald bei materieller Spezifikationslücke, Cadence bei einem tatsächlichen Prozess-Trigger, nicht als Routinezeremonie. Profile und regelkonformes begrenztes Auftragspaket verwenden. Rechte und separaten echten Lauf vor Behauptungen verifizieren.
6. Peter bestätigt die Claude-API und gestattet gezielt begrenzte Claude-Relay-Actions. Fehlender lokaler CLI/Connector allein ist kein Claude-Ausfall. Der bisher belegte Forge-Lauf gilt für Agentarium; Big-Quest-Zugriff/Mehr-Repo-Ausführung ist noch nicht nachgewiesen. Prüfe den konkreten aktuellen Relay-Vertrag und tatsächliche Rollenrechte. Keine eigenmächtige Relay-/Plattformentwicklung zur Erweiterung. Ersatz nur bei belegter konkreter Blockade, transparent nach geltenden Vertretungsregeln und ohne zwei aktive Halter derselben Aufgabe. Ein alter EP06-Worker wird nicht durch diesen neuen Integrationsauftrag wieder gestartet.

## 2. Mandat und Ziel

Dieser Auftrag autorisiert ausschließlich das technische Vorbereitungspaket aus EP-00/EP-09 (bestehende Basis-/Lieferstand-Stories US-001–004 und US-901–903). Er ist KEINE Wiederaufnahme der Produktentwicklung von EP-06/US-601–603 und kein neuer Epic. Ordne verwendete Story-IDs den Originalunterlagen zu; erfinde keine neue Bedeutung bestehender IDs.

Ergebnis: ein vollständiger, lokal baubarer, bereinigter und wiederherstellbarer Entwicklungskandidat aus dem jüngsten dokumentierten EP04/EP06-Code. Keine verlorene neuere Funktion, kein versehentliches Zurücksetzen des Test-11-Formulars. Ursprüngliche Konto-, Familien- und Schuldaten sind nicht mehr benötigt und werden weder migriert noch eigens neu gesichert. Die Repositories bleiben public.

Der zentrale Steuerungschat besitzt Priorisierung, nachfolgende Aufträge und konsolidierten Überblick. Du führst genau dieses Paket bis zum Ergebnis oder konkreten Blocker. Beginne keine weiteren Stories, Betriebsbereitstellung oder Releasearbeit aus eigener Initiative. Routineentscheidungen innerhalb dieses Pakets autonom treffen; materielle Produkt-, Architektur-, Historien-, Kosten- oder Veröffentlichungsänderungen mit konkretem Befund an den Steuerungschat zurückgeben.

## 3. Eingaben und exakte Referenzen

Beide Eingabepakete liegen jetzt in GitHub: [Eingabeindex](inputs/BQ-EVAL-01-INT-01/INPUTS.md) und [Manifest](inputs/BQ-EVAL-01-INT-01/manifest.json). Lade die Dateien selbst vom gleichen Commit wie diesen Auftrag; Peter muss nichts herunterladen oder erneut anhängen. Nutze den vorhandenen GitHub-Zugriff, Raw-HTTPS oder read-only Git-Fetch/git-show, prüfe SHA-256 vor Verwendung und lies PUBLICATION-NOTES.md. Lokale Pfade eines anderen Chats sind keine Eingaben. Kein Abruf vertraulicher Browsercookies oder Secretwerte zur Umgehung fehlender Dateizugriffe.

### A. Gesamtübergabe

- Öffentliche Eingabe: [gesamtuebergabe-public-v1.zip](inputs/BQ-EVAL-01-INT-01/gesamtuebergabe-public-v1.zip); Inhalt beginnt bei `Big-Quest-Atlas-Gesamtuebergabe.md`.
- ZIP-SHA256 `ae795684af186fd3fad29c7ff6ff1dd6e4c3e690474d67e37a47b87ab056d77e`.
- Ursprünglicher Anhang: `Big-Quest-Atlas-Gesamtuebergabe (1).zip`, SHA256 `f02a1227e9c53283935382a7e3d210ca4d2015adf0ca4ed01d4330042a3da7f9`. Seine 227 aufgeführten Dateiprüfsummen wurden bestätigt. Die öffentliche Variante ersetzt eine verbliebene alte Kontokennung in einer Testdatei, ergänzt den Änderungshinweis und aktualisiert die Prüfsummen. Die beiden Patches sind bytegleich zum Original; keine Anwendungstests für diese reine Publikationsänderung ausgeführt.
- Jüngster dokumentierter Originalcommit `0a2d92fd1df28bda46fa793cbc8309a63df185be`, Originalbaum `e0474ccb8681592f0ed88bcebc318ab87afd2c12`.
- Kumulative Patchbasis `7995d6968e3895b88f8ed2c3b0476683e5720c1a`, Basisbaum `ffdc932e6b7f2b4195f7b119d4ba445409512180`; zehn Patch-Commits.
- Inkrementelle EP06-Basis `9fbd987d4d3f02b1ac890bc0fe508f0bfa73a3e0`, Baum `7493d82b02769d7d0511c66b01f7fe1abc257f67`; vier Patch-Commits. Wähle EINEN passenden Wiederherstellungsweg, nicht beide aufeinander.
- Der Atlas-Arbeitsstand v15 endet früher bei `7ce56ab`; das ist nicht der jüngste Produktstand. Für den neueren Originalstand sind Übergabevermerk, Release-Dokumentation und beigefügte Protokolle maßgeblich; das Konzept v1.0 definiert den Produktumfang.
- `Quellstand-bereinigt/` hatte im Originalarchiv Baum `49a4594b0c61bb8620c1e1260f4a4e35979de5f7`; die zusätzliche Kennungsersetzung der öffentlichen Variante verändert diesen Baum. Er ist weder der Original-Prüfbaum noch die Wiederherstellungsbasis. Die Kopie hat 136 Ausschlüsse und Anonymisierungen in ursprünglich 42 Dateien. Unter anderem fehlen `index.html`, `tests/testinstanz.test.mjs`, die Schulfixture und Build-Konfigurationsdateien. Nicht als vollständigen oder abgenommenen Quellstand übernehmen.

### B. Bereits geprüfte lokale Bereinigung

- Öffentliche Eingabe: [cleanup-overlay-public-v1.zip](inputs/BQ-EVAL-01-INT-01/cleanup-overlay-public-v1.zip).
- ZIP-SHA256 `60bcfad3dfe341c21400a6450f8094bd3af3bf4c4c40562e6d3b81b74bd32ca6`.
- Ursprüngliches Review-Artefakt: `BQ-EVAL-01-cleanup-candidate-v1.zip`, SHA256 `f961223ef35a16ab059f7ad63303b394fa323030d574acda4887fa062115dcf7`. Die öffentliche Variante ersetzt verbliebene alte Kontokennungen und tokenähnliche Testwerte in zwei Dateien durch deterministische Dummy-Werte und aktualisiert das Payload-Manifest. Keine Anwendungstests für diese Publikationsänderungen ausgeführt; das frühere Review gilt weiterhin nur für seinen ursprünglichen genauen Stand. Die ohnehin geforderte Integration prüft den neuen Kandidaten.
- Wiederherstellbares Overlay auf Basis `7995d6968e3895b88f8ed2c3b0476683e5720c1a`, keine vollständige Git-Historie.
- Entfernt `werkzeug/konten.json` und `werkzeug/schuldaten.json`, ignoriert beide optionalen lokalen Pfade, führt eine neue synthetische Kontenfixture ein und stellt acht Tests auf explizit synthetische Daten um. Bestehende Werkzeuge unterstützen fehlende Konfiguration. Keine App-Logik-/Workflow-/Paket-/Lockdateiänderung.
- Technischer Bearbeiter war der getrennte Codex-Vertreter `/root/codex_bq_cleanup`; unabhängiges Review durch Argus `/root/argus_bq_cleanup`: PASS_WITH_NOTES für exakt diesen lokalen Kandidaten. Kein Forge-Lauf behauptet.
- Vorliegende kombinierte Regression: Erstlauf 88 Tests, 86 PASS/2 FAIL; nach Korrektur des synthetischen Schulszenarios gezielter Schul-/Kern-Nachlauf 15/15 PASS. Kein finaler Gesamttestlauf. Diese Nachweise gelten nicht automatisch für die nun entstehende Integration.
- Das Overlay enthält vollständige Testdateien vom älteren Basisstand. NICHT blind über die neueren EP04/EP06-Dateien kopieren; die Bereinigungsänderungen gezielt integrieren.

Fehlt ein Archiv oder ist seine Identität unklar, keine Inhalte erfinden oder ungesicherte Codeversion einsetzen. Unabhängige Bestandsaufnahme fortführen und die konkrete Eingabelücke melden. Keine erneute allgemeine Sammelübergabe anfordern, wenn nur ein bestimmtes Artefakt fehlt.

## 4. Arbeitsschritte und Nachweise

1. Ausgangslage sichern durch Referenz-/Änderungsinventar; bestehende Arbeit erhalten. Bestehende isolierte Checkouts verwenden, keinen zusätzlichen Git-Worktree ohne ausdrücklichen Auftrag anlegen. Keine neue vollständige Sicherung ursprünglicher personenbezogener Daten erzeugen.
2. Originalstand auf passender verfügbarer Basis lokal rekonstruieren. Dateibaum gegen `e0474ccb8681592f0ed88bcebc318ab87afd2c12` prüfen. Abweichende Commit-ID durch Wiederherstellungsmetadaten nicht mit inhaltlicher Änderung verwechseln. Bei Baumabweichung Diagnose statt Entwicklungsfortsetzung.
3. Aktuellen GitHub-main und relevante Entwicklungs-/PR-Referenzen read-only abgleichen. Neue Remote-Änderungen nicht überrollen; Integration und verbindlicher Verhaltensstand getrennt ausweisen. Das erprobte Formular aus #192/#198 und Konzeptentscheidungen D-01–D-06 bewahren. Kein neuer Machbarkeitspilot.
4. Originalcode und lokales Bereinigungs-Overlay in EINEN vollständigen Kandidaten zusammenführen. Benötigte Entwicklungs-/Testkonfiguration synthetisch und ausdrücklich als solche herstellen. Keine bloß vollständige anonymisierte Kopie behaupten, solange benötigte Dateien fehlen. Keine UI-Texte, Lernlogik oder Architektur nebenbei verändern. Wenn das Bereinigen einen echten Produktentscheid erfordert, Befund konkret zurückgeben.
5. Maßgeblich sind fehlende Original-Betriebsdaten, sinnvoll getrennte synthetische Fixtures und erhaltenes Verhalten. Sämtliche zur eventuellen späteren Veröffentlichung bestimmten Dateien auf Geheimnisse, ursprüngliche Daten und lokale Datenbanken prüfen; Treffer ohne Werte berichten. Ein Muster-Scan allein ist keine vollständige Freigabe.
6. Den vollständigen lokalen Testbuild und die durch die Integration betroffenen Prüfungen ausführen, Logs/Exitcodes erhalten. Vorhandene Nachweise am unveränderten Code begründet wiederverwenden; keine pauschale Wiederholung aller historischen Suiten. Keine produktiven Schlüssel oder echten Familiendaten verwenden. Argus prüft den konkreten Kandidaten unabhängig; gezielte Sentinel-Ausführung nur für eine benannte fehlende wesentliche Ebene. Kein allgemeiner EP06-Abschluss aus diesem Paket.
7. Wiederherstellbares bereinigtes Quellpaket oder geeignete Basis+Delta-Lieferung erstellen; Prüfsummen, vollständigen Kandidatenstand und Wiederherstellung angeben. Kein Löschpatch oder Git-Bundle veröffentlichen, das die entfernten personenbezogenen Inhalte wieder enthält. Ungeprüfte sensible Zwischenstände nicht in Archive/öffentliche Dokumentation kopieren.

## 5. Befugnisse und Ausschlüsse

Erlaubt: read-only GitHub-Abgleich; lokale Rekonstruktion, begrenzte Bereinigung, notwendige synthetische Fixtures und betroffene Tests; lokale Kandidaten-Commits ohne externe Nebenwirkung; gezielt benötigte echte Spezialisten; vorhandener und passender Claude-Relay mit konkretem Auftrag, Modell-/Rechte-/Budgetgrenze sowie echtem Laufbeleg. Vor Aufrufen geltende Kostenregel anwenden: Gesamtschätzung über alle Versuche unter USD5 durch Task gedeckt, ab USD5 vor Fortsetzung Freigabe mit Basis einholen. Keine erfundene Kostenschätzung und keine automatischen Wiederholungen ohne neue Diagnose.

Nicht erlaubt: Wiederaufnahme alter EP06-Aufträge; zusätzliche Produktfeatures; Fehlerbehebung #194/US202; Migration von Kathies Altdaten; Umstellung auf private Repositories; öffentliche Historienumschreibung/Force-Push; Branchlöschung; Einrichtung eines neuen Remote-Repos; Änderungen an Relay-Infrastruktur; Produktivbetrieb von Claude in Big Quest; Deployment; Versions-/Releasefreigabe; Merge nach main oder App-Veröffentlichung.

Keine Quellcode-Pushes oder PRs aus diesem ersten Integrationsauftrag. Keine allgemeinen CI-/Release-Actions. Ein Draft-PR ist kein Schutz vor Workflow-Ausführung. Die Erlaubnis gezielter Agentarium-Relay-Läufe ist keine Freigabe sämtlicher GitHub Actions. Geschützte Daten und Keys niemals in Chat, Git oder Logs ausgeben. Reguläre Rollen nicht allein wegen eines fehlenden lokalen Connectors ersetzen.

Arbeitsstand, Release-Zuordnung und Archivspur mit dem geprüften Transport fortführen, soweit tatsächlich möglich und innerhalb der Berechtigung. Keine unzugängliche Library-Datei als aktualisiert behaupten. Ist kanonisches Schreiben blockiert, konkrete lokale Ergänzung liefern und Veröffentlichung offen halten. Keine Empfangsbestätigung an den bisherigen Übergabeagenten erforderlich.

## 6. Abnahme dieses Pakets

- Original-Wiederherstellung mit erwartetem Baum belegt; danach jede wesentliche Kandidatenabweichung erklärt.
- Vollständiger Quellbestand und funktionierender lokaler Testbuild; keine fehlenden kritischen Quelldateien hinter einem Paketnamen versteckt.
- Alte Betriebsdaten fehlen im Kandidaten; Entwicklungs-/Testinputs sind synthetisch und explizit getrennt. Keine alten Identitäten/Salts/Hashes in neue Fixtures kopiert.
- EP04/EP06-Funktionen nicht durch ältere Test-/Quelldateien überschrieben. Relevante Integrationsregression am tatsächlichen Kandidaten nachgewiesen.
- Unabhängiger Befund nennt genau Kandidat, Umfang und Grenzen. FAIL/BLOCKED/NOT_TESTED bleiben sichtbar.
- Artefakt mit exakter Basis/Commit/Baum, Prüfsummen und nachvollziehbarem Wiederherstellungsweg vorhanden.
- Keine nicht erlaubte externe Wirkung. Historische öffentliche Kopien gelten durch lokale Bereinigung ausdrücklich NICHT als entfernt.

## 7. Rückgabe an den zentralen Steuerungschat

Liefere eine kurze kopierbare Markdown-Rückgabe und die nötigen herunterladbaren Artefakte. Format:

```markdown
# BQ-EVAL-01-INT-01 · Rückgabe v1
Status: DELIVERED / BLOCKED / NEEDS_DECISION
Auftragsfassung: v2, unveränderlicher Auftragslink
Ausführungs-Chat / tatsächliche Rollen- und Laufreferenzen:
Eingabebasis / Original-Rekonstruktionsbaum:
Kandidaten-Commit / Baum / Codepaket / SHA256:
Wesentliche Änderungen gegenüber dem Original und Begründung:
Prüfungen: Commit, Umgebung, tatsächliche PASS/FAIL/SKIP/NOT_TESTED, Logs
Unabhängiges Review: genauer Stand, Ergebnis, offene Befunde
Actions/Relay: tatsächliche Run-Links, Zweck, beobachteter Status, bekannte Kostengrenze
GitHub-/App-Veröffentlichung: nicht erfolgt / exakt benannte erlaubte Dokumentationswirkung
Offene Grenzen und konkrete Entscheidungsfrage, falls nötig:
Aktualisierte Arbeits-/Release-Doku und Archivnachweis oder exakter Schreibblocker:
Empfohlener nächster Schritt; nicht eigenständig begonnen:
```

Ein lokaler Kandidat ist keine Annahme, kein Release und keine Story-Gesamtabnahme. Die zentrale Steuerung prüft die Rückgabe und beauftragt den nächsten Schnitt. Bei Blockade bis zum letzten sicheren Ergebnis arbeiten; keine generischen Neustarts, keine weitere Agentenkaskade ohne konkret fehlende Leistung.
