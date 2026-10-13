# AG-PROC-REVIEW-001 — PROCESS_DECISION V1

Stand: 2026-10-13T20:42:27+02:00  
Status: APPROVED  
Process Owners: Peter und Atlas  
Exakte Reviewvorlage: governance/AG-PROC-REVIEW-001-v1.md, Commit bed7f4c1aab95812f734db0e6bb43fa1ced978aa  
Peters Erklärung: „Ok, freigabe erteilt.“

## Entscheidung

Peter gibt das in Abschnitt 8 der Reviewvorlage empfohlene sechs Punkte umfassende Änderungspaket frei. Atlas stimmt der Einführung zu. Die folgenden Prozessanforderungen gelten ab dieser Entscheidung für neue Aufträge und neue Korrekturläufe:

1. Replay-Prüfungen müssen vollständig paginiert sein. Unvollständige Abrufe führen zum Abbruch. Die technische Korrektur der beiden betroffenen Forge-Wrapper ist autorisiert; Regression mit mindestens 150 Kommentaren und Marker auf Seite 2 erforderlich.
2. Vor einem weiteren bezahlten Versuch nach einem Fehler werden Fehlerklasse, Diagnose, Korrekturgrund und bestehende Kostenautorisation dokumentiert. Guthaben-/Quota-/Budgetfehler bleiben ohne automatischen Retry.
3. Quantifizierte QA-Ergebnisse benötigen persistiertes Harness, exakten Eingabestand, Ergebnis und Artefaktkennung. Nicht gesicherte ältere Ergebnisse bleiben historische Berichte und werden nicht nachträglich als reproduzierbar umetikettiert.
4. Relay-/Transportprüfung, funktionale Prüfung und visuelle Browser-/Mobile-Abnahme werden getrennt ausgewiesen. Offene Bereiche bleiben NOT_TESTED.
5. Ein append-only Evidenz- und Kostenjournal wird eingeführt. Unbekannte Kosten, Modelle, Denkaufwände und Provider-Restsalden bleiben explizit unbekannt.
6. Atlas-Infrastruktur-Fallbacks werden mit Auslöser, begrenztem Umfang, Review und QA dokumentiert. Die Entscheidung erweitert keine dauerhaften Rollen- oder Toolrechte.

Keine Architekturänderung, Modelldefaultänderung, allgemeine bezahlte Testautorisation, automatische Aktivierung des Rulebook V1.1 DRAFT, Merge-, Release- oder Veröffentlichungsfreigabe.

## Einführung und technische Umsetzung

Prozessanforderungen: ab dieser Entscheidung verbindlich.  
Technische Replay-Korrektur: autorisiert, in diesem Entscheidungsdokument nicht als ausgeführt behauptet.  
Nachsicherung alter Mock-QA-Harnesses: offen; keine erneute bezahlte Modellerprobung erforderlich.  
Evidenzjournal: initialisiert mit dieser Entscheidung; historische Daten werden ausschließlich mit Quellen und Unsicherheiten übernommen.
