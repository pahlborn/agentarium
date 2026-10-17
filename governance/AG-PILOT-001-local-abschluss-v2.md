# AG-PILOT-001 – Lokaler Transport, Abschluss V2
2026-10-16 · Atlas · Status LOCAL_RUNTIME_VERIFIED, echter Pilot NICHT gestartet.
Arbeitsbranch feature/ag-interface-k3-final; Liefercommit 19463534defa6f9c6b48812eeebf56433fa28e89. Kein Merge, keine Bereitstellung.

## Echte Rollen und Runtime
- Argus /root/argus_data_access_concept: AG-PILOT-001-OPERATIONS-CHECK V1; vorhandenes Datenkonzept und Pilotgrenzen geprüft, konkreter lokaler Integrationsschritt empfohlen. Kein Betriebsnachweis.
- Forge V1: Run38885877232, Sitzungf0f7d565-326a-423e-960a-2cec7efe0990, WorkerSUCCESS; unabhängige Runtime-QA FAIL14/18, erhalten in governance/AG-PILOT-001-local-qa-v1.md.
- Forge V2-Korrektur: Run38886371918, Sitzungfdace86d-8201-4d5c-b69a-5c54b85e6848, WorkerSUCCESS. Quelle: https://github.com/pahlborn/agentarium/issues/2#issuecomment-6213328234
- Tatsächliches Modell beider Claude-Läufe laut CLI: claude-sonnet-5-5; tatsächliches Reasoning unbestätigt. Definition0dcac59d22c27753f111fb1ad79f5a9be524052a; CLI2.1.301.
- Sentinel /root/sentinel_interface_rereview: AG-PILOT-001-LOCAL-TRANSPORT-QA V2; Signal AG-PILOT-001-LOCAL-TRANSPORT-QA:V2:SENTINEL:QA_REPORT:V1.
- Atlas: exakte Quellen/Patche und QA-Ergebnisse übernommen; GitHub-Blobs gegen Sentinel-Ergebnisblobs bestätigt, keine eigene Produktimplementierung.

## Gelieferter Umfang
Python-stdlib-Testserver, ausschließlich127.0.0.1, explizite Eingabedatei, kein POST/Command, supported_actions=[].
Endpunkte /health, /snapshot, /events(SSE), /state?cursor=N, /archive(LOCAL_TEST_BUNDLE).
Kanonischer Eingabesnapshot mit lauf.zustand_am_cursor; unveränderte Stromumschläge für SSE/Testexport, Payloadkopie+Transportsequenz für bestehenden Referenzreducer.
Dateinachlieferung testet den Transport. Dies ist KEINE tatsächliche Runtimeerfassung aus ChatGPT/Claude.
Kein Feldadapter und kein Katalogdienst in diesem begrenzten Schritt.
Kostenfeld kanonisch unvollständig, sichtbar, ohne Beträge: „Kosten nicht vollständig ermittelbar.“

V1-Patch SHA256439236f2a2079aa3a59f9ec4ac909bd4b68abf43ef7d478dc3ac56b325d980fe
V2-Deltapatch SHA25632786f83c193399da7876a5b7a0b9b87c1404df1eff966bdbdec98179be24e05
Ergebnisblobs:
- pilot/AG-PILOT-001/README.md: 58c8babecde656690a6a8f7957b8d685229f5bdd
- pilot/AG-PILOT-001/local_transport.py: 18fea8e690664ec472ff613133310ea64aa0ad93
Referenzreducer unverändert aus geprüftem Basisstand da860fd19f38e9938ed201546f2a6e5b4cc765f8.

## Reale unabhängige Prüfungen
py_compile Exit0.
Sentinels Runtimeprobe Exit0:18/18.
- /snapshot entspricht kanonischem Fixture11-Referenzzustand bei Cursor106.
- /state?cursor=104 entspricht historischem Referenzzustand.
- Ungültiges Done lässt Aufgabe offen; fachlich richtige K3-Diagnose vorhanden.
- Fremde payload.project_id/run_id abgelehnt.
- SSE-Wiederaufnahme, Cursorgrenzen, Heartbeat ohne id, Lücke/fehlerhafte Eingabe mit Erhalt des vorherigen Stands, korrigierte Nachlieferung105/106 ohne Doppelzustellung.
- Nur Loopback, Health, POST405, unveränderter lokaler Testexport.
- Alle Testserverprozesse und temporären Eingaben bereinigt.

Ausgeführte Probe archiviert: governance/evidence/AG-PILOT-001-sentinel-runtime-probe-v2.py, SHA256dc06429df17db12e04978231b5e1769bb74c62bd5d28e93696ce4240ea1040b2.
Die Probe ist ein QA-Beleg; sie verwendet denselben synthetischen lokalen Testbestand, keine tatsächliche Agentenarbeit.
F01–F04: CLOSED_VERIFIED für den lokalen Prototyp.

## Verbrauch
V1:0.1688833USD; input16/output10277/cache-read72913/cache-creation23516/thinking2824.
V2:0.1286485USD; input10/output6459/cache-read30310/cache-creation24403/thinking760.
Diese beiden Aufrufe zusammen0.2975318USD laut CLI, nicht mit Rechnung abgeglichen. Thinking nicht nochmals addieren.
Kein vollständiger Projektbetrag; ChatGPT-Aufteilung/unbekannte externe Kosten nicht als0 verbucht.

## Echte verbleibende Pilotvoraussetzungen
1. Geprüften Transport mit dem vorhandenen Feld verbinden (I2), ohne Layoutänderung; bisher keine Browserabnahme.
2. Tatsächliche Producer an den Journalpfad anbinden; Coverage nennen, keine simulierten Teamantworten.
3. Benannten ausführbaren Host, dauerhafte Ablage und Diagnosewiederherstellung, autorisierte Producer-/Nutzerzugriffe festlegen und beweisen.
4. Finale Archivverpackung/Archivziel und Zugriff nach bestehendem Konzept konkretisieren; LOCAL_TEST_BUNDLE ist kein GitHub-Projektarchiv.
5. Erst danach einen echten Lauf starten und AG-PILOT-001 P1–P9 gegen genau diesen Betriebsstand prüfen.

Atlas kann Anbindungsdetails entscheiden. Einen vorhandenen Rechner/Server oder dessen Zugang darf er nicht erfinden. Eine neue Hostingbeschaffung mit wiederkehrenden Kosten oder öffentliche Bereitstellung ist durch diesen Testauftrag nicht aktiviert.
