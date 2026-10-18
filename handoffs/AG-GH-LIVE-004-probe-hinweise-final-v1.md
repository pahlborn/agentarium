# Gerätewechsel im Live-Piloten — geprüfte Hinweise

Aus Forges tatsächlichem Beitrag und Sentinels unabhängiger Dokumentenprüfung zusammengeführt. Keine neue Windows-/Safari-Funktionsfreigabe.

1. Auf dem neuen Gerät oder in einem anderen Browser den Live-Piloten öffnen, den Lesetoken dort eingeben und „Verbinden“ wählen. Der Token wird nicht synchronisiert und liegt nur im Arbeitsspeicher der Seite. Nach Neuladen oder Verlassen dieser Seite erneut eingeben. Ein bloßer App-/Tabwechsel pausiert den Abruf und trennt nicht automatisch.
2. Das tatsächliche Ablaufdatum aus GitHub in jedem verwendeten Browserprofil selbst eintragen und prüfen. Nur dieses Datum wird lokal für die Website gespeichert, sofern der Browser Speicherung zulässt. Es wird nicht auf andere Geräte übertragen und beweist weder Gültigkeit noch Berechtigungen des Tokens. Ein Fehler beim Anmelden/Abrufen ist gesondert zu beachten.

Prüfpunkt: In einem frischen Browserprofil ohne gespeicherten Schlüssel agentarium.github.tokenExpiry bleibt das Datumsfeld leer; die Anzeige meldet „Token-Ablaufdatum fehlt“ und einen unbestätigten, nicht gespeicherten Vorschlag. Ohne Datum gibt es keine berechnete Ablaufwarnung. Hat das Profil bereits ein gültig gespeichertes Datum, bleibt dieses erhalten.

Der Fehlfall ist die fehlende Voraussetzung für eine datumsbasierte Warnung, keine Behauptung eines neu beobachteten Produktfehlers. Bestehende QA prüfte die zugrunde liegenden Speicherfälle mit synthetischen Daten; die jetzige Prüfung vergleicht Anleitung und Quelltext.
