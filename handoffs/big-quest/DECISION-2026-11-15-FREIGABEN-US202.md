# Zentrale Klärung · Freigaben, Geräte-Link und Abnahmegrenzen

15.11.2026 · Peter verlangt die Auflösung unnötiger Freigabeblockaden. Gilt für die laufenden freigegebenen Aufgaben; keine neue Produkt-/Releasefreigabe und kein fingiertes PASS.

## Freigaben nicht wiederholt einholen

- Lesen und Nutzen der von Peter beschriebenen privaten US202-Rückgabeseite einschließlich ZIP, Delta und Nachweisen ist ausdrücklich erlaubt. Die Archivmeldung [6893314045](https://github.com/pahlborn/agentarium/issues/2#issuecomment-6893314045) bestätigt den hergestellten privaten Zugriff. Dieser Zugangsblocker ist nicht erneut Peter vorzulegen.
- Private Zugriffsfreigabe ist keine Veröffentlichung privater URLs. Benötigte private Eingaben intern verwenden; öffentliche Zusammenfassungen ohne private Links und Originaldatenwerte erstellen. Eine technische Zugriffslücke ist mit konkretem fehlenden Werkzeug/Referenz zu melden, nicht als erneut fehlende Zustimmung.
- Innerhalb bereits freigegebener Aufgaben sind notwendige lesende Quellzugriffe, synthetische Fixtures, erlaubte lokale Änderungen und gezielte Prüfungen durch das Mandat gedeckt. Nicht jede Datei und jeder Retest braucht neue Zustimmung. Werkzeuge und Hostpolicy müssen die Rechte tatsächlich bereitstellen; eine Textfreigabe erzeugt keine nicht vorhandene Fähigkeit.
- Echte qualifizierte Übergangsvertretung ist bereits direkt erlaubt. Nicht erneut einen API-Ausfall als Voraussetzung verlangen und keinen laufenden Halter duplizieren.
- Sichere Dokumentations-/Rückgabeablage ist bereits beauftragt. Bestehende aufgabenbezogene Quellen-/Publikationsgrenzen, Secret-Schutz, Modellbudgets, Main-Merge- und Releaseausschlüsse bleiben erhalten. Automatische Ablehnungen nicht umgehen; genaue Aktion, Grund und innerhalb vorhandener Rechte mögliche Alternative unterscheiden.

## US202: Anforderungen richtig zuordnen

Die zentrale Steuerung hat am öffentlichen PR194-Stand `268ccff87e240fc361bffa36fed61ba7085e0700` die zwei Wege getrennt:

1. `kontoGeraeteHTML()` bietet „Weiteres Gerät verbinden“. Der `verbinden`-Zweig erzeugt `anmEinladungslink(location.href, {zugang:z})`, ohne persönlichen Startcode. Er transportiert den Geräte-/Speicherzugang; die bestehende Anmeldung mit Passwort bleibt nötig. Mehrfache Benutzung ist hier nicht allein ein Fehlernachweis.
2. Der `qr`-Einladungszweig übergibt zusätzlich Anmeldename, Code und ggf. Fingerabdruck. Die UI nennt ausdrücklich „Gilt einmal, bis …“. Diese personenbezogene Konto-/Startcodeeinladung muss den bestehenden Ablauf-, Widerrufs- und Einmaligkeitsvertrag erfüllen.

Die pauschale G4-Formulierung im US202-Auftrag v1 war für den reinen Gerätezugangslink zu weit. Die zentrale Steuerung präzisiert sie: Verbrauchsabwehr nur für tatsächlich konsumierbare Einladungen/Startcodes; bei wiederverwendbarem Gerätezugang normale Authentifizierung, gültiger Speicherzugang und bestehende Berechtigungsprüfung nachweisen. Wiederverwendung darf keine Passwortumgehung oder unberechtigte Konto-/Geräteregistrierung bewirken.

Das ist eine Zuordnung zur vorhandenen Semantik, keine Freigabe einer neuen Einladungs-/Zugangsarchitektur oder eines neuen langfristigen Browser-Tokenmodells. Wenn der tatsächliche Kandidat oder ein verbindlicher Originalentscheid widerspricht, mit exaktem Beleg zurückmelden. Frühere FAIL-Berichte bleiben historisch erhalten. Sentinel muss den Kandidaten an der präzisierten Zuordnung erneut beurteilen; die Steuerung erklärt G4 nicht rückwirkend für bestanden.

G2 bleibt eine reale Nachweislücke: neue lokale Geräte-ID, Konto und Familie beweisen nicht die entfernte Registrierung derselben ID. Der direkte Nachweis am synthetischen entfernten Speicher und nach Abgleich ist innerhalb der vorhandenen lokalen Prüfbefugnis erlaubt; keine neue Grundsatzentscheidung erforderlich.

## Relay-Rückgabe

[Rückgabe v1](https://github.com/pahlborn/agentarium/blob/4417390f145d496edff3b611f0f603c45110f9eb/handoffs/AG-RELAY-MULTIREPO-001-rueckgabe-v1.md) und [Draft-PR130](https://github.com/pahlborn/agentarium/pull/130) liegen vor. Der begrenzte Kandidat hat dokumentierte unabhängige R1–R8-Nachweise; Original-Artefakte liegen dort. Der tatsächliche neue Dateislot wurde mit Edit befüllt; Write selbst ist NOT_TESTED. Das ist kein Anlass, denselben gelungenen Edit-Pfad aus Prinzip erneut zu testen.

Die Hostpolicy erlaubt bislang nur ausgewählte Beispieldateien, insbesondere Big-Quest-package.json. Der nötige Quellzugriff für den vollständigen INT01-Auftrag ist innerhalb dessen Inhaltsmandats nicht erneut pro Datei von Peter zu genehmigen. Der konkrete Pfadsatz und die tatsächliche Hostbereitstellung sind technische Arbeit; Secret-/Credential-/Steuerungspfade bleiben ausgenommen. Falls dies Änderungen am Sicherheitsvertrag außerhalb des vorhandenen Mandats verlangt, genaue Abweichung benennen. Kein pauschaler neuer API-Anbindungsauftrag.

Die Rückgabe ist ein überprüfbarer begrenzter Infrastrukturkandidat, nicht die allgemeine Aktivierung, vollständige INT01-Ausführbarkeit oder Main-Merge-Freigabe. Bestehende Vertretung kann unabhängig weiterarbeiten.
