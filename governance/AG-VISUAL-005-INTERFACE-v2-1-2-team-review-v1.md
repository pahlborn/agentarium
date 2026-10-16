# AG-VISUAL-005-INTERFACE-V2.1.2 – Abschlussreview und Entscheidungsvorlage

Version 1 · 2026-10-16 · Atlas.
Geprüfter Commit: d2ceca168cbd2f4cacaf2311412622d968e2edb4.
Abschlusspapier Blob: f845709a052ad76e68c014b9260175c0a6498575.
Reducer Blob: 96354253d536f50329d806fa7d7b299f87fcc79a.
Rückmeldung Blob: eb9779c85b448400fddfd816dc02947e140d1cce.
Status: FAIL, Pilot noch nicht gestartet.

## Reale unabhängige Ergebnisse

Argus /root/argus_interface_rereview:
AG-VISUAL-005-INTERFACE-V2-1-2-REVIEW:RA:RA_REVIEW:V1, FAIL.

Sentinel /root/sentinel_interface_rereview:
AG-VISUAL-005-INTERFACE-V2-1-2-REVIEW:SENTINEL:QA_REPORT:V1, FAIL.

Sentinel bestätigte fünf registrierte Blob-Hashes.
Vertragsprüfer Exit 0: 57 Form-, 110 Regel-, 25 Proben.
Gegenprobe Exit 0: 52/52 Mutationen erkannt; drei Rückfallproben werden rot.
Unabhängige K1–K3-Probe Exit 1: 3/4 Prüfgruppen bestanden.

## K1 und K2 geschlossen

K1: Fehlerhafte Revision/Vorgänger verändern den Aufgabenstatus und die fachliche Revision nicht. Ungültiger Erstübergang legt keine Aufgabe an.
K2: Tail 104,106 bleibt bei Cursor104 ohne Wirkung106. Nachlieferung105 führt geordnet zu106 mit demselben Zustand wie104,105,106.

Die K2-Pufferung ist innerhalb eines Aufrufs belegt. Ein späterer Pilot muss nach Neustart entweder den Puffer wiederherstellen oder ab dem unveränderten Cursor erneut zustellen.

## K3 bleibt derselbe Blocker

done_nachweise beanstandet die freien Autorisierungsstrings, aber reduziere setzt dennoch status=done und liefert keinen entsprechenden Reducer-Verstoß. Fixture12/fall12 erwarten dieses Done sogar ausdrücklich.

Damit ist die Ausnahme diagnostiziert, aber nicht als akzeptierte fachliche Wirkung gesperrt. Das ist keine neue Anforderung und kein neuer Randfall, sondern die noch offene ursprüngliche K3-Regel.

## Cursorabgrenzung: Atlas-Empfehlung

Empfangscursor und fachliche Annahme werden getrennt:
- zugestelltes fachlich ungültiges Ereignis: Empfangscursor darf fortschreiten, Aufgaben-/Artefakt-/Blockadezustand bleibt unverändert;
- fehlende Sequenz: kein Fortschritt über die Lücke;
- Verwerfung bleibt am Cursor durch referenzierte persistente Diagnose/Validierungsstand nachweisbar, auch nach Snapshot/Neustart.

Wichtig: Die bisherige abdeckung im Referenzreducer zählt vorhandene Zeitstempel. Sie darf nicht still zur Fehler-/Validierungsabdeckung umgedeutet werden. Vollständige Zeitstempel können bei fachlicher Verwerfung weiter vollständig sein. Dauerhafter Verwerfungsnachweis ist eine getrennte Aussage und bisher nicht durch den separaten Rückgabewert verstoesse belegt.

Diese technische Präzisierung ersetzt keine Produkt-/Hostingfreigabe.

## Konkreter eng begrenzter Abschlussauftrag

1. Für einen Done-Kandidaten vor der Zustandsübernahme den gültigen vollständigen Nachweis aus dem akzeptierten Zustand/Ereignisstand prüfen.
2. Ungültiges Done weder anlegen noch übernehmen. Empfang quittieren, fachlichen Zustand unverändert lassen, konkrete Verwerfungsreferenz zurückgeben beziehungsweise im Snapshot-/Journalvertrag festhalten.
3. Freie Autorisierungsstrings schalten keine Ausnahme frei.
4. Fixture12/fall12 verlangen kein done im akzeptierten Zustand bei fehlendem Nachweis.
5. Ein normaler gültiger Done-Übergang funktioniert weiterhin.
6. Snapshot plus Tail muss dieselbe Nachweisentscheidung treffen; keine ausschließlich auf Vollhistorie begrenzte Diagnosefunktion als Acceptance-Gate verwenden.
7. K1/K2 und geschlossene R4/R5/B1/B5 nicht erneut umbauen.

Abschlussprüfung auf die ungültige und gültige Done-Entscheidung sowie ihren Snapshot-/Nachweisbezug begrenzen. Keine weitere Vollreviewrunde.

## Prozessentscheidung nach wiederholtem selben Fehler

Die Atlas-Governance verlangt nach zwei erfolglosen Korrekturzyklen desselben Befunds einen Stopp der Schleife und eine Entscheidungsvorlage. Dieser Punkt ist bei K3 erreicht.

Option A – Empfehlung Atlas:
Technische Abschlusskorrektur an Forge als Codingrolle übertragen. Exakter Auftrag oben; keine Neuspezifikation. Anschließend eine begrenzte unabhängige Zustandsprobe, keine neue Vollreviewkaskade. Ausführungskanal und eventuelle Kosten müssen vor Start konkret nachgewiesen sein.

Option B:
Bisheriger Schnittstellenverfasser führt denselben eng begrenzten technischen Fix aus. Weniger Übergabeaufwand, aber derselbe Fehlertyp wurde wiederholt nicht im maßgeblichen Zustand behoben.

K3 wird nicht als akzeptiertes Risiko durchgewinkt. Der volle Live-/Archivpilot startet erst nach gültigem Abschluss. Pilot auf bloße Kommunikation ohne Status-/Fortschrittsregeln zu reduzieren wäre ein anderer Scope und wird nicht still vorgenommen.

## Pilotvorbereitung

handoffs/AG-PILOT-001-agentarium-pilot-v1.md liegt vor, Status PREPARED_BLOCKED.
Read-only-Inventur fand statische Verbraucher, Referenzprüfmittel und begrenzte Actionsrelays, aber keinen nachgewiesenen dauerhaften Ingest-/SSE-Host.
Betriebsort, persistenter Speicher, Zugriffsrechte und konkreter Forge-Ausführungskanal müssen benannt werden. Kein bereitgestellter Dienst und kein Pilot-PASS.
Keine bezahlte Ausführung, kein Merge/Release/Deployment gestartet.
