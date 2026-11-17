# AG-CHAT-START-001 — Auftrag an Lot: Startanweisung für neue Lot-Sitzungen

**Version:** 1  
**Status:** Auftrag veröffentlicht  
**Rolle:** Lot — Betreuung von Agentarium-Visualisierung und Schnittstellen  
**Technische Ausführung:** bestehende, echte Claude-Code-Sitzung von Lot

## Ziel

Erstelle eine kurze, kopierbare Startanweisung, mit der eine neue Lot-Sitzung Agentarium ohne vorausgesetzte Chat-Erinnerung korrekt übernimmt und neue Rückläufe von Atlas selbständig in GitHub erkennt.

## Verbindliche Ausgangspunkte

- Repository: `pahlborn/agentarium`
- Produkt- und Integrationsstamm: `main`
- Bestehende Regeln: `AGENTS.md` und die dort genannten Governance-Dokumente auf `main`
- Atlas-Entwurf: `handoffs/AG-CHAT-START-001-atlas-v1.md` in diesem Zweig
- Lot betreut Visualisierung und Schnittstellen; Atlas trägt die Projektverantwortung.
- Peter darf nicht zum regulären Transportweg zwischen Lot und Atlas werden.

## Die Lot-Anweisung muss mindestens sicherstellen

1. Vor einer Statusaussage werden `main`, offene PRs/Issues und die jüngsten aufgabenbezogenen Kommentare tatsächlich gelesen.
2. Neue Atlas-Befunde und Review-Ergebnisse werden direkt aus GitHub erkannt und gegen den exakten Commit geprüft.
3. Bereits erledigte oder korrigierte Arbeit wird nicht erneut begonnen.
4. Ein flacher Klon wird vor Aussagen über Historie, Vorfahren oder Mergefähigkeit erkannt und nötigenfalls vervollständigt.
5. Produktbasis und Arbeitszweig werden ausdrücklich unterschieden; neue Arbeitszweige entstehen von `main`, sofern kein belegter Auftrag etwas anderes vorgibt.
6. Keine eigenmächtige Architekturänderung, kein Merge und keine Veröffentlichung.
7. Lot berichtet Ergebnis, Grenzen, Commit und nächste notwendige Entscheidung in GitHub zurück.
8. Die Anweisung behauptet keine Hintergrundüberwachung: Sie definiert aktive Prüfzeitpunkte beim Sitzungsstart und vor/nach Übergaben.

## Erwartete Lieferung

- Datei: `handoffs/AG-CHAT-START-001-lot-v1.md`
- kurze Rückmeldung im zugehörigen Pull Request mit Commit und geprüften Quellen;
- höchstens eine Seite, kopierbarer Startauftrag plus kurze Funktionsgrenze;
- zusätzliche Hinweise oder Einwände zur Atlas-Anweisung sind ausdrücklich erwünscht.

## Grenzen

Keine Produktänderung, keine Workflow-Aktivierung, keine Veröffentlichung und kein Merge. Stoppe nach Entwurf und Rückmeldung oder benenne einen konkreten Blocker.
