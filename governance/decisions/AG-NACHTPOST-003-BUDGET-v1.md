# AG-NACHTPOST-003 — Budgetfreigabe und Ausführung V1
Stand: 2026-10-13T22:12:26+02:00
Status: AUTHORIZED
Peter: „Ja klar, das ist ok“ auf Atlas' konkrete Frage nach bis zu USD2 insgesamt für beide Forge-Mocks.

Gilt ausschließlich für zwei lauffähige NACHTPOST-Demos, Gewebe und Partitur, von Forge umgesetzt.
Aufteilung: geschätzte CLI-Grenze USD1 jeVariante, Summe USD2. Grenzen sind keine Rechnungs- oder Restguthabengarantie.
Kein Modellupgrade; bestehendes Sonnet/Medium. Kein automatischer Retry bei Fehler/Guthaben/Quota/Budget.
Zwei unabhängige Aufträge können parallel laufen. Failfast stoppt die andere Ausführung bei Fehler, soweit GitHub-Cancellation den Job erreicht.
Endliche Frist900s proProvideraufruf, Workflow20Minuten.
Code-Ausgabetext wird fortlaufend gesichert; interne Thinking-/Signaturblöcke werden verworfen. Gesicherter Text ist noch kein validierter fertiger Mock.
Finaler Handback und Usage werden separat gesichert; bei Fehler bleiben verfügbare terminale Kosten/Token/Modellmetadaten im Diagnoseartefakt.
Keine Rohstreams in Artefakten oder Issue-Kommentaren; Artefakte enthalten nur Ausgabetext und bereinigte Metadaten.
Vorhandene Story-Fixture vom Baselinecommit1e812fb0e5f9f9f76a753bb57acbbdc2bb6111c2 wird exakt gelesen und gehasht.
Alte Timeout-/Budgetversuche und unbekannte Kosten werden beibehalten.
Atlas implementiert keine Ersatzmocks. Atlas darf den vorhandenen Relay begrenzt korrigieren und Forge-Rückgaben unverändert übernehmen.
Sentinel prüft gelieferte Dateien gegen handoffs/AG-NACHTPOST-001-acceptance-v1.json, mit offenen Browsergrenzen.
Keine Architekturänderung, Merge-, Release-, Deployment- oder öffentliche Veröffentlichung.
