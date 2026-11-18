# EV5/EV6 Formular: Vorschlag, private bekannte Zuordnung, Neuzuordnung

Stand: Entwurf von Forge gegen 441ccad6 (Draft-PR 227). Nichts davon wurde von Forge ausgefuehrt.

## Anliegen
- Neue manuelle Kriterien im gemeinsamen EV4-Formular erhalten einen deterministischen Bereichsvorschlag aus dem einen Katalog. Die Elternkorrektur, auch ausdrueckliches "kein Bereich", bleibt ueber Eingabe, Neuzeichnen und Vorschau erhalten.
- EV5.1: Standards-Abschnitt eines Quelltexts lesen; nur eindeutig je Kriterium verknuepfte Eintraege zaehlen. EV5.2/5.5: private bekannte Paare nur aus bestaetigten wirksamen Evaluationen des autorisierten Kindes.
- EV6: gespeicherte Kriterien ohne Bereich pruefen, wenn Katalog oder bekannte Paare jetzt einen positiven Vorschlag liefern; ruhiger Hinweis, Vorschau, genau eine Korrektur derselben Evaluation.

## Umgesetzt
- src/module/evaluation-uebernahme.mjs (rein), zwei Eintraege in module.json (auch evaluation-zuordnung, fehlte), kleine Verbraucher in index.html (Schulbereich), neue Modultests, angehaengte Browsertests.
- Keine Aenderung an Ereignisschema, Katalog, Speicher, Backend, Swift. Kein zweiter Speicher, kein neuer Ereignistyp.

## Pruefung
- Forge: NOT_RUN (keine Shell).
- Integration, unabhaengige QA und CI: offen, Atlas ergaenzt.
- Geraete-/Swift-Abnahme (echtes Toddle-Layout, nativer Standards-Abschnitt): ausdruecklich offen.

## Gefunden
- module.json enthielt keinen Eintrag fuer evaluation-zuordnung.
- Hinweis erscheint erneut, wenn Eltern bewusst "kein Bereich" gelassen haben, obwohl ein Vorschlag existiert (kein Speicher fuer Ablehnung erlaubt).
- Offen: Test "Lehrkraft mit Freigabe sieht keinen Hinweis"; Test Kindwechsel im Neuzuordnungsentwurf.
- Kein Gesamt-Pass fuer Ziel1, EV5.4 oder EV7.
