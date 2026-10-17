# AG-VISUAL-005-INTERFACE-V2.1 – unabhängiges Team-Review V1

Projekt: pahlborn/agentarium. Datum: 2026-10-15.
Task: AG-VISUAL-005-INTERFACE-V2-1-REVIEW.
Geprüfter Commit: 8feefe2a98eca444b5352c9c9c3f0d52069304e2.
Vertrag: specifications/AG-VISUAL-005-schnittstelle-v2.1-korrektur.md, Blob 515954d3b57cd75046bc8e5e7f8563af4d0c1968.
Schema: specifications/AG-VISUAL-005-schemas-v2/vertrag-v2-1.schema.json, Blob 26ace42824abd989ad318081efd326299ec6853a.
Reducer: tests/AG-VISUAL-005-referenz-reducer.py, Blob 03028c4882c77b30abdd164abef5490838a41f08.
Umfang: zehn registrierte Fixtures, drei Prüfdateien.
Rückmeldung: handoffs/AG-VISUAL-005-INTERFACE-v2-1-rueckmeldung-v1.md, Blob 5550e8a55bc5268607f33eb7b363aaebfad580c4.

## Echte Beteiligung und Ergebnis

Argus /root/argus_interface_rereview:
AG-VISUAL-005-INTERFACE-V2-1-REVIEW:RA:RA_REVIEW:V1, FAIL.

Sentinel /root/sentinel_interface_rereview:
AG-VISUAL-005-INTERFACE-V2-1-REVIEW:SENTINEL:QA_REPORT:V1, FAIL.

Atlas konsolidiert die tatsächlichen Antworten. Keine Simulation von Teambeiträgen. Die identifizierten technischen Restfehler werden nachfolgend abschließend konkretisiert; keine neue Vollspezifikation oder automatische weitere Vollreviewrunde.

## Tatsächliche QA-Ausführung

Sentinel rekonstruierte den registrierten Bestand isoliert und bestätigte alle Git-Blob-Hashes.
- python3 tests/AG-VISUAL-005-vertrag-v2-1-pruefen.py: 41 Formprüfungen, 66 Regelprüfungen, 13 Negativproben, Exit 0.
- python3 tests/AG-VISUAL-005-vertrag-v2-1-gegenprobe.py: 27/27 erkannt, jede über ihre benannte Prüfung, Exit 0.
- Die sieben gelieferten früheren Proben bestehen in ihrer übernommenen Form.
- Die übernommene minimal_work_event-Probe prüft jedoch handoff ohne recipient, nicht den ursprünglichen noop-Fall.

Unabhängige zusätzliche Ergebnisse:
- original_noop_with_required_shell: ACCEPTED.
- noop_state_pollution_schema: ACCEPTED.
- reducer_status: done.
- reducer_violations: [].
- done_findings: [].
- ownership_change_without_task_scope_basis: ACCEPTED.

Standardvalidator: jsonschema/ajv nicht vorhanden, keine Installation, NOT_RUN.
Kein Server, Browser, Laufzeit-SSE, Rechtevollzug oder Laufzeit-Nebenwirkungsnachweis. Verbraucherkompatibilität und reale vollständige Kostenerfassung weiterhin NOT_TESTED beziehungsweise unbestätigt.
Sentinels isolierter Prüfbestand wurde entfernt, keine externen Seiteneffekte.

## Delta und Konsolidierung

B1: geschlossen als Datenvertrag; Browser-Reconnect bleibt NOT_TESTED.
B2: offen, BLOCKER; siehe R1 und R2.
B3: Archiv-Reducer verbessert und unabhängig geprüft. Snapshot plus Tail bleibt offen, siehe R3. Sentinels CLOSED gilt dem Archiv-Prüfmittel; Argus beanstandet ergänzend den weiterhin nicht belegten Live-Einstieg.
B4: Quellfelder und Vokabular korrigiert. Sentinel beanstandet fehlende Pflichtfelder bei ownership_change; Argus bewertet die Quelltreue als geschlossen. Atlas trennt beides: Optionale Metadaten pauschal verpflichtend zu machen war kein ursprünglicher Auftrag. Erhaltene Quellfelder sind kein Nachweis allgemeiner Übergabevalidierung. Konkrete Mindestregel siehe R5.
B5: geschlossen auf Schema-/Datenebene. Sichtbares Kostenfeld bei unvollständiger Erfassung ausschließlich „Kosten nicht vollständig ermittelbar.“ Reale Gesamterfassung bleibt unbestätigt.
O1: Prosa leerer Aktionen und positives Betriebsfixture widersprechen sich, siehe R4.

## Begrenzte verbindliche Korrekturen

### R1 – Nur definierte Zustandsereignisse dürfen Status schreiben

Der Reducer schreibt bei jedem Ereignis mit item_revision und to. done_nachweise prüft nur kind=status_change. Ein schema-gültiges noop kann dadurch Done ohne Nachweis erzeugen.

Korrektur:
- R2 des Reducers ausschließlich bei kind=status_change ausführen.
- Unbekannte Arten entweder ablehnen oder explizit ohne Zustandswirkung behandeln; Zustandsfelder bei fremden Arten nicht durchlassen.
- Fachliche Titel nichtleer verlangen.
- Normale Statuswechsel und Done durch dieselbe vorgelagerte Validierung führen; ungültiges Ereignis verändert den Zustand nicht.
- Den ursprünglichen noop mit vollständiger formaler Hülle testen, zusätzlich zu handoff ohne recipient.

### R2 – Prüfnachweis genau an Aufgabe und Kriterienfassung binden

done_nachweise speichert Resultate nur für (artifact_id, version). task_id und criteria_ref fehlen im Schlüssel. Fixture05 W7b besteht AG-VISUAL-004-testability@v1, W8 setzt Done unter AG-PROC-REVIEW-001@v1; der Prüfer akzeptiert dies.

Korrektur:
- Nachweis mindestens an (task_id, artifact_id, version, criteria_ref) binden.
- Done nennt genau den maßgeblichen Nachweis beziehungsweise diese vollständige Referenz.
- Kein Pass einer anderen Aufgabe oder Kriterienfassung darf Done erlauben.
- Ein späteres Fail für dieselbe Nachweisreferenz sperrt Done ohne neuen gültigen Nachweis.
- Kriterien des positiven Fixtures konsistent korrigieren.
- Die ausdrücklich autorisierte Abweichung bleibt ein separater belegter Weg und keine bloße freie Namensbehauptung.

### R3 – Snapshot plus Tail tatsächlich fortschreiben

Reducer beginnt leer und setzt cursor=len(ereignisse); er kann Snapshotzustand plus Tail 412–414 nicht fortschreiben. Innere und äußere Cursor werden nicht abgeglichen.

Korrektur im begrenzten Referenz-Prüfmittel:
- Start mit initial_state und tatsächlichem Streamcursor unterstützen.
- Äußeren Snapshotcursor und zustand_am_cursor.cursor gleichsetzen/prüfen.
- Tail anhand tatsächlicher stream_sequence validieren; Anzahl importierter Ereignisse ist keine Transportsequenz.
- Mindestens einen Vergleich Vollhistorie bis N gegen Snapshot bei K plus Tail K+1 bis N berechnen, einschließlich Aufgaben, Prüfungen, Blockaden, Owner und Cursor.
- Doppeltes Ereignis oder Lücke darf keine unbemerkte doppelte Zustandsänderung erzeugen.
Keine Produktimplementierung oder Infrastruktur daraus ableiten.

### R4 – Aktuelles Befehlsprofil maschinenlesbar machen

supported_actions=[] steht nur in Prosa. Fixture08 enthält gleichzeitig eine erfolgreiche Ausführung von freigabe.erteilen.

Korrektur:
- supported_actions im betrieb-Dokument oder Snapshot aufnehmen, aktuelles Profil [].
- Keine bedienbaren Steueraktionen ausweisen.
- Aktuelle Betriebsfixtures enthalten keine angenommenen/ausgeführten Aktionen.
- Zukünftige generische Befehlsformen dürfen separat als nicht aktiviertes Schema-Beispiel bestehen; sie sind kein Nachweis unterstützter Befehle.

### R5 – Übergabevalidierung von Quelltreue unterscheiden

Keine pauschale neue Pflicht zu scope/basis allein zur Erfüllung einer Negativprobe einführen.

Für eine Verantwortungstransition muss die Zielaufgabe eindeutig aus ownership_change.task_id oder task_id des Ereignisses hervorgehen; widersprüchliche Angaben werden abgelehnt. to bezeichnet eine Rolle oder eine explizit dokumentierte Freigabe der Verantwortung. Vorhandene scope/basis und weitere zugelassene Quellangaben bleiben erhalten.

Eine Prüfung fehlender effektiver Aufgabe ist sinnvoll; das bloße Fehlen optionaler Metadaten ist kein Beweis für Datenverlust. Die Regel, dass Verantwortung nie aus recipient oder parent_task_id allein folgt, bleibt unverändert.

## Antworten auf die zwei Bitten

1. Ein vollständiger Standardvalidator ist in der vorhandenen Prüfumgebung nicht installiert. Nichts wurde nachgeladen. Dieser Nachweis bleibt NOT_RUN. Das Einheitsschema ist eine Definitionsbibliothek: beim späteren Standardvalidatorlauf muss der konkrete $defs-Einstiegspunkt validiert werden; Root allein prüft keine Nutzdaten.
2. Nein: minimal_work_event meinte nicht ausschließlich Kommunikation ohne Empfänger. Der ursprüngliche Befund war ein inhaltsarmes unbekanntes Ereignis, das fachliche Regeln umgehen kann. R1 enthält die entscheidende unabhängige Gegenprobe.

## Lieferung und Grenzen

Nur R1–R5 gezielt korrigieren und genau die zugehörigen positiven/negativen Fälle belegen; keine neue Volltestkampagne. B1/B5 nicht erneut aufrollen. Änderungen dürfen keine neuen Betriebs- oder Architekturentscheidungen aktivieren.

Rückmeldung: exakter Commit, Pfade/Blob-Hashes, Ergebnis je R1–R5 und ausgeführte Prüfungen mit Grenzen. Keine produktive Implementierung, keine Infrastruktur, keine kostenpflichtigen Läufe, kein Merge/Release/Deployment. Die Beurteilung ist keine Implementierungsfreigabe.
