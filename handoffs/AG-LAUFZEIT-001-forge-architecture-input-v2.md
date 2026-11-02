# AG-LAUFZEIT-001 — gezielte Architekturkorrektur V2
Task AG-LAUFZEIT-001-04, parent AG-LAUFZEIT-001, project/logical-run agentarium/AG-LAUFZEIT-001. Scope und Regeln deines ersten Auftrags gelten unverändert. Main-Baseline37f6a5e2b3d3daebc197602c2161f5ffb46bb953, Forge-Profil1ebe72cd8de89f3aa0f9ca4272fb1e89ae3e187f.
Lies deine originale V1-Rückgabe handoffs/AG-LAUFZEIT-001-forge-architecture-handback-v1.md und nur die dazu relevanten Workflow/Driverstellen. Keine erneute allgemeine Bestandsaufnahme.
Atlas verwirft RouteA: Peter verlangt ausdrücklich Live, keine Zwischenlösung mit erst nach Ende veröffentlichten Meldungen. Das ist keine offene Kundenentscheidung zugunsten verzögerter Ausgabe.

## Neue Primärevidenz widerlegt eine zu enge Prämisse
Atlas hat die README des exakt schon verwendeten actions/upload-artifact-Pins ea165f8d65b6e75b540449e92b4886f43607fa02 gelesen:
https://github.com/actions/upload-artifact/blob/ea165f8d65b6e75b540449e92b4886f43607fa02/README.md#L55
Dort steht sinngemäß: Sobald ein v4-Artefakt hochgeladen/finalisiert ist, ist es mit seiner ID in UI und REST API verfügbar; auf das Ende des gesamten Laufs muss nicht mehr gewartet werden.
Dies ist dokumentierte Fähigkeit des vorhandenen Artefaktdienstes, noch KEIN Echtzeitnachweis unseres Umbaus.

## Deine präzise Frage
Kann ein vertrauenswürdiger Driver/Supervisor im bestehenden run-Job den Worker laufen lassen, beim tatsächlich beobachteten Aktivitätssignal ein bereinigtes Startartefakt über die vorhandene Upload-Fähigkeit finalisieren und nach dem Ende separat ein Endartefakt finalisieren, während der schon heute actions:read/issues:write berechtigte Publisher parallel läuft (nicht erst needs:run abwartet) und diese Dateien liest/publiziert?
- Bewerte selbst die kleinste tragfähige Variante: laufender hostkontrollierter Worker über mehrere Jobschritte, oder Upload aus dem vertrauenswürdigen Host innerhalb desselben Schrittes mit dem schon verwendeten Artefakt-Client. Keine neue Infrastruktur/Secrets/Scopes. Kein GH-Schreibtoken im Worker. Keine Sicherheitsgarantie allein durch eine Environmentliste. Verbleibende Isolationseigenschaften ehrlich benennen.
- Prüfe insbesondere Lebensdauer/Überwachung des Workers, sichere Artefaktdaten vs manipulierbare Modellinhalte, Publisher/Start-Reihenfolge, Timeout/Jobverlust, bounded Reader (kein Dauerpoller) und keinen Start nach bereits bekanntem Ende als laufende Arbeit ausgeben.
- Ist dies mit bestehenden Mitteln tragfähig, liefere den genauen minimalen technischen Schnitt und den kleinsten NICHT-KOSTENPFLICHTIGEN Infrastrukturbeweis (klar synthetisch, keine echten Rollenstarts behaupten), dann den echten kleinen CLI-Streamnachweis. Andernfalls liefere den KONKRETEN fehlenden API-/Rechteschritt, keine pauschale Unmöglichkeit.
- Kein Codepatch in diesem Architekturauftrag. Du besitzt die technische Wahl; die obige Möglichkeit ist eine zu prüfende Hypothese, keine vorgeschriebene Implementierung.

## Weitere präzise Korrekturen
Ein erstes assistant-Event zeigt spätestens dann beobachtete Aktivität, nicht ihren exakten Beginn. Fehler vor erster Antwort bedeutet NICHT bewiesen keine Arbeit/keine Kosten. Trenne start_observed_at / actual_start_unknown; keine exakten Rechenzeitpunkte vortäuschen. Fehlende oder unterbrochene Beobachtung bleibt unbekannt.
Deine Aussage zum MonitorV1 ist nur auf die alte ag_block-Feldliste belegt: Die heutige Anstoß-Datei erlaubt reporter bereits. Du hast den Monitor absichtlich nicht gelesen; behaupte keine Abwesenheit im aktuellen Consumer. Kein Monitorlesen/-ändern in dieser Aufgabe. Neuer Vertrag wird separat mit Lot abgestimmt.
Native ChatGPT-Exportschnittstelle bleibt unabhängig offen; keine Migration.

## Ergebnis / Budget
Schreibe <=650Wörter als CA_ADVICE oder konkret BLOCKED ausschließlich in handoffs/AG-LAUFZEIT-001-forge-architecture-handback-v2.md; Hostvorlage exakt "# Handback\n" via Edit ersetzen. Keine Kontrollmarker/Ereignisblöcke im Handback. Tests NOT_RUN (keine Shell).
Beantworte: tragfähiger bestehender Kanal ja/nein mit Beleg/Vorbehalt; präzise Route; kleinster kritischer Beweis; erforderliche Rechteänderung falls überhaupt; verbleibende Gesamtschätzung. Gesamtfreigabe10USD. Erster Lauf gemeldet0.1661004USD. Dieser neue, korrigierte Architekturversuch höchstens1.50USD/8Turns; kein Replay oder Unterlauf. Stop danach.