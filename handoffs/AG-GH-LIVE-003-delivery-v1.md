# AG-GH-LIVE-003 — Ablaufanzeige im Live-Piloten

Status: begrenzte Korrekturen technisch geprüft, Sentinel PASS_WITH_LIMITS. Isolierter Pilot Fassung 50 / Adapter AG-GH-LIVE-001-v1.2. Kein Merge des Kandidaten und keine Änderung an regulärem feld/.

## Ergebnis

- Vollständige Ablaufwarnung in eigener umbrechender Zeile, auch bei geschlossener Steuerung und gleichzeitigem Netzwerkfehler.
- Warnung ab zehn Tagen, am Ablauftag und nach Ablauf; korrekter Singular „1 Tag“.
- Ein fehlendes oder gelöschtes Datum wird nicht mehr automatisch als neues Ablaufdatum gespeichert. Ein 90-Tage-Vorschlag ist ausdrücklich unbestätigt. Ein eingetragenes Datum bleibt gespeichert; der Token bleibt im Arbeitsspeicher.

## Verantwortung und Nachweis

Forge implementierte im echten Claude-Lauf https://github.com/pahlborn/agentarium/actions/runs/39092987541 (Session 22c7f7f5-5a61-4d4f-90f3-cf0cf59f797c, Laufzeitmodell claude-opus-5-5, 0.7021282 USD gemeldete API-Kosten dieses Laufs). Atlas baute den Kandidaten und veröffentlicht nur die Pilotdateien; Sentinel schrieb und prüfte unabhängig die zusätzlichen Browserfälle. Keine vollständig ermittelten Projektkosten; die App zeigt weiterhin keine Teilkosten.

Produktkandidat: 5b00fe269ea6a100706095e9c147bcd4e022057d. Testkorrektur c40b4cb5155b62bc31d0bb35a9d2ceb023530b17 ändert ausschließlich den Test, keine Produktdatei.

- 39/39 bestehende Browserregressionen und Ablauf-NodeVM-Test bestanden: https://github.com/pahlborn/agentarium/actions/runs/39093218740.
- Erster unabhängiger Lauf: 15 bestanden; ein Testbedienungsfehler (Trennen bei geschlossener Steuerung) bleibt im Nachweis erhalten. Sentinel ergänzte normales Aufklappen, ohne Forceclick und ohne schwächere Erwartungen.
- Nachtest 16/16 bestanden: https://github.com/pahlborn/agentarium/actions/runs/39093437217. Chromium headless, Playwright 1.62.1, synthetische GitHub-/Datums-Fixtures; kein physischer Safari-Test.
- QA-Bericht: handoffs/AG-GH-LIVE-003-sentinel-qa-v1.md; Rohmetadaten, Testergebnisse und Bilder: evidence/AG-GH-LIVE-003/.
- Peters bestätigter echter iPad-Live-Durchstich ist separat festgehalten: handoffs/AG-GH-LIVE-002-customer-acceptance-v1.md. Er ist kein Nachweis der neuen Ablaufwarnung auf dem Gerät.

## Offene Punkte

**AG-GH-LIVE-003-MOBILE-HEADER (offen, Owner Atlas → Forge):** Auf 320/375/390px überdeckt das Live-Panel Teile der Original-Kopfzeile. Warntext lesbar, Hauptbedienung erreichbar; bei 768px im geprüften Screenshot keine Überdeckung. Keine pauschale Telefonfreigabe. Dieser zusätzliche responsive Befund wird vor einer Ausweitung auf Handys behoben.

**Datumsübernahme aus v1.1:** Früher automatisch gespeicherte Daten lassen sich von bestätigten Einträgen nicht unterscheiden. Sie bleiben erhalten. Das Datum einmal mit dem tatsächlichen GitHub-Ablaufdatum abgleichen. Diese Änderung liest kein tatsächliches Token-Ablaufdatum von GitHub aus.

Nächster Schritt nach Peters Auftrag: weitere echte Teamaktivitäten gezielt anbinden; keinen flächendeckenden Live-Betrieb aus diesem begrenzten Piloten ableiten.
