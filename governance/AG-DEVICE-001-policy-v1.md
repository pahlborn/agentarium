# AG-DEVICE-001 — Geräteabhängige Darstellung und Freigabe

Kundenentscheidung: Peter, 18.10.2026, 05:33 Europe/Berlin. Gilt für Agentarium; keine neue Transportarchitektur oder pauschale Gerätebeschränkung.

1. Agentarium ist browserbasiert und nicht auf das iPad beschränkt. Nachweise gelten nur für die tatsächlich geprüfte Kombination aus Browser, Betriebssystem, Bildschirmmaßen und Funktionsumfang; ein Chromium-Test unter Linux ist kein Windows- oder Safari-Gerätetest.
2. Bei Darstellungsproblemen wird zuerst eine passende Lösung mit dem zuständigen Agentarium-Entwickler gesucht. Sie darf anders als die bisherige Darstellung aussehen, muss aber den fachlichen Zweck erhalten. Eine Bezeichnung wie „iPhone“ ersetzt keinen Messwert.
3. Trägt eine Funktion auf kleinen Bildschirmen nach einem angemessenen Lösungsversuch nicht, darf ihre Anzeige anhand einer nachvollziehbaren, geprüften Größen-/Fähigkeitsgrenze eingeschränkt werden. Keine willkürliche Schwelle festlegen. Die betroffene Funktion und der Grund müssen in Freigabekriterien und Anwenderdokumentation stehen; erforderliche Statusinformation nicht als vermeintlich defektes leeres Feld hinterlassen.
4. Eine Einschränkung einer einzelnen Anzeige ist keine Sperre der gesamten Anwendung. Demo und Archiv bleiben erhalten; keine stillschweigende Ausweitung auf andere Funktionen.
5. QA prüft die Grenze und unmittelbar benachbarte Maße sowie die Alternative/den erklärenden Hinweis. Status unterscheidet nachgewiesen, mit Einschränkung, ungeprüft und nicht unterstützt.
6. Die Kostenanzeige bleibt unabhängig hiervon pausiert: Solange keine vollständigen Kosten ermittelt werden, keine Teilbeträge als Projektkosten. Der vorgesehene Platz erklärt weiterhin die Nichtverfügbarkeit.

## Aktueller Stand

- Tatsächlicher Live-Durchstich in Safari auf Peters iPad für Fassung49 vom Kunden bestätigt; keine pauschale Freigabe aller Safari-/iPad-Funktionen.
- Fassung50: synthetische Chromium-Prüfungen unter Linux für Live/Demo/Archiv und Ablaufwarnung bestanden. Kein physischer Windows-Test daraus ableitbar.
- Bekannter offener UI-Befund AG-GH-LIVE-003-MOBILE-HEADER: Überdeckung der Kopfzeile bei 320/375/390px. Bei geprüften 768px-Screenshot nicht vorhanden. Noch keine Anzeige abgeschaltet und keine numerische Ausschlussgrenze beschlossen.
- Peters Windows-Frage am 18.10.2026 05:35 ist ausdrücklich keine sofortige Anpassungsanforderung.

Owner: Atlas; Darstellungsentwurf/-lösung über zuständigen Agentarium-Agenten, unabhängige Prüfung Sentinel.
