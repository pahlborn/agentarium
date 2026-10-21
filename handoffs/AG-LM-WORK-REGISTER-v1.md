# AG-LM-WORK-REGISTER — V1

Stand: 2026-10-21. Autor/Koordination: Atlas. Nutzerentscheidung: eindeutige IDs für Epics, User Stories, Tasks und Testfälle; vollständige Hierarchie, beleggebundene Übergaben und Abschluss erst nach erfolgreicher Arbeit und Prüfung. Ersetzt als führendes Strukturregister die losen E1/E2/E3- und LM-S-Bezeichnungen aus PR46-Kommentaren6320102814/6320171504. Historie bleibt erhalten.

Projekt: agentarium. Lauf unverändert: AG-EVENT-JOURNAL-001. Geprüfte Produktbaseline: ba9796294726a01d355ecfac59d26435984d5582. Produktzustand und Plan sind getrennt; dieses Register ist keine Implementierungs-/Abnahmebehauptung.

## Identität und Beziehungen

Stabile IDs: AG-LM-EP-nnn (Epic), AG-LM-US-nnn (Story), AG-LM-TK-nnn (Task), AG-LM-TC-nnn (Testfall). IDs werden nicht wiederverwendet. Elternzuordnung ist ein ausdrücklicher Verweis, nicht aus dem Titel erraten. Testfälle referenzieren Stories/Abnahmekriterien und betroffene Tasks; ein Testfall kann mehrere Tasks prüfen. Ein Testlauf hat eine zusätzliche eigene Ausführungskennung; ein Testfall ist kein bestandener Testlauf.

Jeder Arbeitseintrag führt mindestens ID, Typ, Titel/Ziel, parent_id, Version, Verantwortlichen, Status, Abnahmekriterien, Abhängigkeiten, Restschätzung und Belege. Unbekannte Schätzung bleibt unbekannt. Aufgaben haben genau einen aktuellen Ausführungsverantwortlichen; fachliche Gesamtverantwortung eines Elternobjekts ist getrennt.

## Epics

| ID | Nutzenergebnis | Zugehörige Stories | Zustand |
|---|---|---|---|
| AG-LM-EP-001 | Laufende Teamarbeit verlässlich verfolgen | AG-LM-US-001 bis 003 | offen |
| AG-LM-EP-002 | Aufgaben bis zum belegten Ergebnis steuern | AG-LM-US-004 bis 007 | offen |
| AG-LM-EP-003 | Projektarbeit fortsetzen und nachvollziehen | AG-LM-US-008 bis 009 | offen |

Dies gliedert bestehenden Umfang; Hierarchie/Übergabe-/Abschlussdarstellung ist durch Peters aktuelle Anweisung ergänzt. Keine pauschale Freigabe neuer Architektur, Kosten oder Veröffentlichung. #8 bleibt verknüpfte Bedienanforderung; #5 Partitur und #7 Reports bleiben außerhalb dieses Monitorabschlusses.

## Arbeitsablauf und Abschlussregeln

1. Atlas wählt eine konkrete freigegebene Epic, Story oder Task nach ID und Version und benennt Ergebnis, Grenzen, Abhängigkeiten und erwarteten Nachweis.
2. Die Vergabe wird vor Ausführungsbeginn persistent protokolliert. Der Monitor muss Typ/ID/Titel, Absender/Empfänger und Elternkette anzeigen. Vergabe ist weder Empfang noch Beginn.
3. Die ausführende Rolle bzw. tatsächlich beobachtende Hostroute belegt Empfang, Beginn, Fortschritt, Blockade und Lieferung mit Herkunft. Atlas erfindet keine fremden Übergänge.
4. Eine Epic-/Story-Übergabe beauftragt den vereinbarten Umfang. Sie erzeugt weder doppelte Unteraufträge noch automatisch Empfang/Beginn/Erledigung der Kinder. Die tatsächlich ausgeführten Kindaufgaben bleiben einzeln nachvollziehbar.
5. Lieferung referenziert die genaue Änderung/Version. Die vorgesehenen Tests werden am passenden Build ausgeführt. Prüfung und Annahme haben eigene Rollen und Belege.
6. Task done: beauftragtes Ergebnis geliefert und angenommen, alle zugeordneten erforderlichen Testfälle für die relevante Version/Umgebung PASS, kein offener erforderlicher Befund. Nicht jeder Dokumenttask braucht künstliche Automatisierung; Prüfart wird vorher festgelegt.
7. Story done: alle zugehörigen Tasks erfolgreich done UND sämtliche Story-Abnahmekriterien und erforderlichen Storytests erfüllt. Reine Taskzählung genügt nicht.
8. Epic done: ALLE Tasks ALLER zugehörigen Stories erfolgreich abgeschlossen/getestet, alle Stories done und Epic-Gesamtnachweis erfüllt. FAIL, BLOCKED, NOT_RUN, unbekannte Pflichtprüfung sowie cancelled/superseded zählen nicht als erfolgreicher Abschluss. Eine autorisierte Scopeänderung erzeugt eine neue belegte Version, keinen stillen Nennerwechsel.
9. Elternstatus wird aus Kindzuständen und eigenen Kriterien ermittelt; manuelles delivered/accepted darf kein offenes Kind verdecken. Wiedereröffnete erforderliche Arbeit macht den Abschluss des betroffenen Elternstands erneut offen.
10. Fortschritt zeigt getrennt: erfolgreich abgeschlossen, offen, blockiert sowie Teststatus. Merge, Veröffentlichung und Kundenabnahme bleiben getrennte freigabegebundene Vorgänge. 100 Prozent erledigte Programmierarbeit bedeutet keine Veröffentlichung.

## Stories, Tasks und Testfälle

Die folgenden technischen Tasks sind die initiale Restzerlegung, keine nachträgliche Behauptung, dass sie bereits gelaufen sind. Lot bestätigt nach Codeabgleich den Rest und nötige Unterteilung. Jede Story hat einen Umsetzungstask und einen separaten Nachweistask. Letzterer bedeutet keine bereits gestartete Sentinel-Ausführung.

### AG-LM-US-001 — Übergaben verfolgen

parent_id: AG-LM-EP-001. Version: V1. Fachlich verantwortlich: Atlas. Status: offen; Restschätzung: ausstehend.

Als Peter möchte ich bei einer realen Übergabe Absender, Empfänger und Aufgabe erkennen, um den Wechsel der Verantwortung zu verfolgen.

| Task-ID | Ergebnis | Ausführungsverantwortung / Zustand |
|---|---|---|
| AG-LM-TK-001 | Übergabe am vorhandenen Monitor mit Typ, ID, Titel, Elternbezug und Originalbeleg verbinden; echte Quelle bis sichtbarem Flug nachweisen. | Lot; Live-Nachweis offen; bestehender Fehler AG-LIVE-LATENCY-001. |
| AG-LM-TK-002 | Abnahmekriterien mit AG-LM-TC-001 an genauer Version prüfen und Ergebnis belegen | Prüferzuweisung durch Atlas; noch nicht neu gestartet |

**AG-LM-TC-001**, Version V1; prüft AG-LM-US-001, Tasks AG-LM-TK-001/002. Verbundenen Monitor und echte neue Übergabe beobachten. Erwartet: genau ein Flug zur richtigen Rolle, korrekte ID/Typ/Elternkette in Details; Wiederholung desselben Ereignisses erzeugt keinen zweiten Auftrag.

Ausführungsstatus dieses neu registrierten Testfalls: NOT_RUN. Bestehende Tests/Belege sind nachzuordnen, nicht neu als ausgeführt zu deklarieren. Erforderliche Umgebung: realer Browser; bei behauptetem Geräte-/Produktnachweis die tatsächlich vorgesehene Anwendung auf Peters Zielgerät. Lokale Fixtures beweisen ihre abgegrenzte Ebene.

### AG-LM-US-002 — Arbeit von Zuweisung unterscheiden

parent_id: AG-LM-EP-001. Version: V1. Fachlich verantwortlich: Atlas. Status: offen; Restschätzung: ausstehend.

Als Peter möchte ich tatsächlichen Beginn und Ende der Ausführung sehen, damit eine bloße Zuweisung keine Aktivität vortäuscht.

| Task-ID | Ergebnis | Ausführungsverantwortung / Zustand |
|---|---|---|
| AG-LM-TK-003 | Eigene Beginn-/Liefermeldungen auf vorhandene Aktivitätsdarstellung abbilden und echten Pulsnachweis erhalten. | Lot; Pulsfix laut Lot geliefert; Gesamtfall nicht angenommen. |
| AG-LM-TK-004 | Abnahmekriterien mit AG-LM-TC-002 an genauer Version prüfen und Ergebnis belegen | Prüferzuweisung durch Atlas; noch nicht neu gestartet |

**AG-LM-TC-002**, Version V1; prüft AG-LM-US-002, Tasks AG-LM-TK-003/004. Auftrag zuweisen, eigenen Beginn melden, liefern. Erwartet: vor Beginn keine behauptete Arbeit, danach richtige Rolle aktiv, nach Lieferung keine Ausführungsaktivität; Aufgabe wartet auf Prüfung/Annahme.

Ausführungsstatus dieses neu registrierten Testfalls: NOT_RUN. Bestehende Tests/Belege sind nachzuordnen, nicht neu als ausgeführt zu deklarieren. Erforderliche Umgebung: realer Browser; bei behauptetem Geräte-/Produktnachweis die tatsächlich vorgesehene Anwendung auf Peters Zielgerät. Lokale Fixtures beweisen ihre abgegrenzte Ebene.

### AG-LM-US-003 — Aktualität der Anzeige erkennen

parent_id: AG-LM-EP-001. Version: V1. Fachlich verantwortlich: Atlas. Status: offen; Restschätzung: ausstehend.

Als Peter möchte ich aktuelle Daten von unterbrochenem Empfang unterscheiden, um Stille richtig beurteilen zu können.

| Task-ID | Ergebnis | Ausführungsverantwortung / Zustand |
|---|---|---|
| AG-LM-TK-005 | Bestehende Transportdiagnose, Ereignis-/Empfangszeiten und Wiederaufnahme prüfen und notwendige Lücken schließen. | Lot; Prüfung offen; quantitative Latenzschwelle noch festzulegen. |
| AG-LM-TK-006 | Abnahmekriterien mit AG-LM-TC-003 an genauer Version prüfen und Ergebnis belegen | Prüferzuweisung durch Atlas; noch nicht neu gestartet |

**AG-LM-TC-003**, Version V1; prüft AG-LM-US-003, Tasks AG-LM-TK-005/006. Im vorgesehenen Prüfaufbau Empfang unterbrechen und wiederherstellen. Erwartet: gestörter/veralteter Empfang erkennbar; Daten anschließend korrekt, keine erfundene Tätigkeit. Ereignis- und Empfangszeiten nachvollziehbar.

Ausführungsstatus dieses neu registrierten Testfalls: NOT_RUN. Bestehende Tests/Belege sind nachzuordnen, nicht neu als ausgeführt zu deklarieren. Erforderliche Umgebung: realer Browser; bei behauptetem Geräte-/Produktnachweis die tatsächlich vorgesehene Anwendung auf Peters Zielgerät. Lokale Fixtures beweisen ihre abgegrenzte Ebene.

### AG-LM-US-004 — Offene Verantwortung erkennen

parent_id: AG-LM-EP-002. Version: V1. Fachlich verantwortlich: Atlas. Status: offen; Restschätzung: ausstehend.

Als Peter möchte ich zu jeder offenen Arbeit Halter und Stand sehen, damit keine Aufgabe zwischen Rollen verschwindet.

| Task-ID | Ergebnis | Ausführungsverantwortung / Zustand |
|---|---|---|
| AG-LM-TK-007 | Hierarchie und Zuständigkeit mit voller Projekt-/Lauf-/Elementidentität erhalten; mehrere parallele Aufgaben unterscheidbar halten. | Lot; Identitätsfix geliefert; Hierarchiebezug neu beauftragt, noch nicht implementiert. |
| AG-LM-TK-008 | Abnahmekriterien mit AG-LM-TC-004 an genauer Version prüfen und Ergebnis belegen | Prüferzuweisung durch Atlas; noch nicht neu gestartet |

**AG-LM-TC-004**, Version V1; prüft AG-LM-US-004, Tasks AG-LM-TK-007/008. Zwei gleich benannte Aufgaben mit verschiedenen Projekt-/Lauf-IDs zuweisen. Eine beginnen und liefern. Erwartet: beide getrennt, nur referenzierte verändert; Annahme schließt nur die richtige. Übergabe eines Elternobjekts führt nicht zum fiktiven Start seiner Kinder.

Ausführungsstatus dieses neu registrierten Testfalls: NOT_RUN. Bestehende Tests/Belege sind nachzuordnen, nicht neu als ausgeführt zu deklarieren. Erforderliche Umgebung: realer Browser; bei behauptetem Geräte-/Produktnachweis die tatsächlich vorgesehene Anwendung auf Peters Zielgerät. Lokale Fixtures beweisen ihre abgegrenzte Ebene.

### AG-LM-US-005 — Hindernisse gezielt auflösen

parent_id: AG-LM-EP-002. Version: V1. Fachlich verantwortlich: Atlas. Status: offen; Restschätzung: ausstehend.

Als Peter möchte ich Grund und Verantwortlichkeit einer Blockade sehen, damit ich gezielt helfen kann.

| Task-ID | Ergebnis | Ausführungsverantwortung / Zustand |
|---|---|---|
| AG-LM-TK-009 | Bekannte Blockadenlogik erhalten und Anzeige des wiederhergestellten Grunds schließen. | Lot; Blockaden geliefert; Anzeige des Restore-Grunds offen. |
| AG-LM-TK-010 | Abnahmekriterien mit AG-LM-TC-005 an genauer Version prüfen und Ergebnis belegen | Prüferzuweisung durch Atlas; noch nicht neu gestartet |

**AG-LM-TC-005**, Version V1; prüft AG-LM-US-005, Tasks AG-LM-TK-009/010. Zwei Blockaden derselben Aufgabe melden, eine exakt referenziert auflösen, wiederverbinden. Erwartet: verbleibende Blockade mit Grund sichtbar; unveränderter Arbeitsstand; unbekannte Auflösung verändert nichts und ist als Lücke erkennbar.

Ausführungsstatus dieses neu registrierten Testfalls: NOT_RUN. Bestehende Tests/Belege sind nachzuordnen, nicht neu als ausgeführt zu deklarieren. Erforderliche Umgebung: realer Browser; bei behauptetem Geräte-/Produktnachweis die tatsächlich vorgesehene Anwendung auf Peters Zielgerät. Lokale Fixtures beweisen ihre abgegrenzte Ebene.

### AG-LM-US-006 — Ergebnisreife beurteilen

parent_id: AG-LM-EP-002. Version: V1. Fachlich verantwortlich: Atlas. Status: offen; Restschätzung: ausstehend.

Als Peter möchte ich Lieferung, unabhängige Prüfung, Annahme und Veröffentlichung unterscheiden, um die Verwendbarkeit eines Ergebnisses zu beurteilen.

| Task-ID | Ergebnis | Ausführungsverantwortung / Zustand |
|---|---|---|
| AG-LM-TK-011 | Bestehenden Rollenbefund6319743049 schließen; Ergebnis/Artefakt und Originalbelege für Merge/Publikation zuordnen. | Lot; Rollenfix bereits an Lot vergeben; Ergebniszuordnung offen. |
| AG-LM-TK-012 | Abnahmekriterien mit AG-LM-TC-006 an genauer Version prüfen und Ergebnis belegen | Prüferzuweisung durch Atlas; noch nicht neu gestartet |

**AG-LM-TC-006**, Version V1; prüft AG-LM-US-006, Tasks AG-LM-TK-011/012. Atlas vergibt an Forge; Forge liefert; Argus prüft; Atlas nimmt innerhalb seiner Autorität an. Erwartet: verschiedene Rollen wirken auf dieselbe Aufgabe; keine Selbstabnahme erforderlich, keine fremde Aufgabe geändert. Merge und Publikation bleiben getrennt belegte Ergebnisereignisse.

Ausführungsstatus dieses neu registrierten Testfalls: NOT_RUN. Bestehende Tests/Belege sind nachzuordnen, nicht neu als ausgeführt zu deklarieren. Erforderliche Umgebung: realer Browser; bei behauptetem Geräte-/Produktnachweis die tatsächlich vorgesehene Anwendung auf Peters Zielgerät. Lokale Fixtures beweisen ihre abgegrenzte Ebene.

### AG-LM-US-007 — Geladenen Definitionsstand kennen

parent_id: AG-LM-EP-002. Version: V1. Fachlich verantwortlich: Atlas. Status: offen; Restschätzung: ausstehend.

Als Peter möchte ich den belegten geladenen Definitionsstand je Agent/Lauf erkennen, um Arbeit dem tatsächlichen Stand zuzuordnen.

| Task-ID | Ergebnis | Ausführungsverantwortung / Zustand |
|---|---|---|
| AG-LM-TK-013 | Anforderung #49 mit vorhandenen Details und gemeldeter Laufzeitquelle verbinden. | Lot; Anforderung erfasst, Umsetzung nicht begonnen belegt. |
| AG-LM-TK-014 | Abnahmekriterien mit AG-LM-TC-007 an genauer Version prüfen und Ergebnis belegen | Prüferzuweisung durch Atlas; noch nicht neu gestartet |

**AG-LM-TC-007**, Version V1; prüft AG-LM-US-007, Tasks AG-LM-TK-013/014. Bestätigten, unbekannten und gegenüber bekannt neuerem Stand veralteten Ladestand je eigenem Lauf zuführen. Erwartet: richtige Zuordnung und Beleg, unbekannt bleibt unbestätigt, alte Historie bleibt alt; App/Rulebook/Skill getrennt.

Ausführungsstatus dieses neu registrierten Testfalls: NOT_RUN. Bestehende Tests/Belege sind nachzuordnen, nicht neu als ausgeführt zu deklarieren. Erforderliche Umgebung: realer Browser; bei behauptetem Geräte-/Produktnachweis die tatsächlich vorgesehene Anwendung auf Peters Zielgerät. Lokale Fixtures beweisen ihre abgegrenzte Ebene.

### AG-LM-US-008 — Arbeit nach einer Pause fortsetzen

parent_id: AG-LM-EP-003. Version: V1. Fachlich verantwortlich: Atlas. Status: offen; Restschätzung: ausstehend.

Als Peter möchte ich nach Wiederverbindung offene Aufgaben und Hindernisse wiederfinden, um ohne Rekonstruktion fortzufahren.

| Task-ID | Ergebnis | Ausführungsverantwortung / Zustand |
|---|---|---|
| AG-LM-TK-015 | Vorhandenen Restore um dieselbe vollständige Hierarchie ergänzen und Gleichheit mit Live prüfen. | Lot; Restore geliefert; Hierarchie und Gesamtabgleich offen. |
| AG-LM-TK-016 | Abnahmekriterien mit AG-LM-TC-008 an genauer Version prüfen und Ergebnis belegen | Prüferzuweisung durch Atlas; noch nicht neu gestartet |

**AG-LM-TC-008**, Version V1; prüft AG-LM-US-008, Tasks AG-LM-TK-015/016. Referenzverlauf live verarbeiten, Verbindung neu aufbauen und Historie lesen. Erwartet: gleiche Aufgaben-/Hierarchielage und Blockaden, keine wiederholten Liveflüge; unvollständige/konfligierende Daten sichtbar.

Ausführungsstatus dieses neu registrierten Testfalls: NOT_RUN. Bestehende Tests/Belege sind nachzuordnen, nicht neu als ausgeführt zu deklarieren. Erforderliche Umgebung: realer Browser; bei behauptetem Geräte-/Produktnachweis die tatsächlich vorgesehene Anwendung auf Peters Zielgerät. Lokale Fixtures beweisen ihre abgegrenzte Ebene.

### AG-LM-US-009 — Vergangene Arbeit nachvollziehen

parent_id: AG-LM-EP-003. Version: V1. Fachlich verantwortlich: Atlas. Status: offen; Restschätzung: ausstehend.

Als Peter möchte ich vergangene Projektarbeit mit Originalbelegen ansehen, um Entscheidungen und Ergebnisse nachvollziehen zu können.

| Task-ID | Ergebnis | Ausführungsverantwortung / Zustand |
|---|---|---|
| AG-LM-TK-017 | Vorhandenen Archivmodus an dieselbe persistierte Quelle anschließen. | Lot; Archivanschluss offen. |
| AG-LM-TK-018 | Abnahmekriterien mit AG-LM-TC-009 an genauer Version prüfen und Ergebnis belegen | Prüferzuweisung durch Atlas; noch nicht neu gestartet |

**AG-LM-TC-009**, Version V1; prüft AG-LM-US-009, Tasks AG-LM-TK-017/018. Denselben Referenzverlauf im Archiv öffnen. Erwartet: gleiche IDs/Belege/Reihenfolge und historische Definitionsstände; Lücken bleiben sichtbar; keine Vermischung mit synthetischer Demo.

Ausführungsstatus dieses neu registrierten Testfalls: NOT_RUN. Bestehende Tests/Belege sind nachzuordnen, nicht neu als ausgeführt zu deklarieren. Erforderliche Umgebung: realer Browser; bei behauptetem Geräte-/Produktnachweis die tatsächlich vorgesehene Anwendung auf Peters Zielgerät. Lokale Fixtures beweisen ihre abgegrenzte Ebene.

## Anforderungen an den vorhandenen Ereignisvertrag / Monitor

Aktuell führt der Vertrag task_id; er belegt noch keine vollständige Epic/Story/Task-Hierarchie oder deren Darstellung. Diese Lücke bleibt offen. Lot prüft die kleinste rückwärtskompatible Ergänzung im vorhandenen Vertrag. Fachlich benötigt: Arbeitselement-ID und Typ, Elternbezug, Version und eindeutige Zuordnung zu Projekt/Lauf. Feldnamen/technischer Weg sind Lots Entscheidung. Bestehende historische IDs bleiben gültig, fehlende Eltern bleiben als unbekannt erkennbar; keine erfundene Rückzuordnung.

Der sichtbare Aufgabenflug referenziert das tatsächlich übergebene Objekt: Epic ODER Story ODER Task. Details zeigen Eltern und Kinderstatus. Offene Arbeit bleibt beim verantwortlichen Agenten sichtbar. Keine neue Oberflächenkonzeption; bestehende Ringe/Liste/Details und Archivquelle verwenden. Forge ist ein möglicher Empfänger, Lot bleibt der Owner der Agentarium-Umsetzung.

**AG-LM-TC-010 — Delegation auf allen Ebenen:** je eine klar markierte Testvergabe einer Epic, Story und Task zuführen. Erwartet: richtige ID/Typ/Version/Elternbeziehung, richtiger Empfänger; keine automatisch als begonnen markierten Kinder, keine doppelten Tasks. Reale Übergabe separat auf tatsächlichem Kanal prüfen. Zustand NOT_RUN.

**AG-LM-TC-011 — Abschluss nach oben:** unter einer Epic zwei Stories mit Tasks anlegen; ein erforderlicher Task offen bzw. ein erforderlicher Test FAIL/BLOCKED/NOT_RUN. Erwartet: Story/Epic nicht done. Danach alle Pflichtarbeiten erfolgreich annehmen/testen und Epic-Gesamtkriterium erfüllen: erst jetzt done. Wiedereröffnung einer erforderlichen Kindaufgabe macht den betroffenen Elternabschluss wieder offen. Zustand NOT_RUN.

**AG-LM-TC-012 — Testnachweis ist versionsgebunden:** PASS an alter Version/anderer Umgebung hinterlegen; materiell geänderte betroffene Version ohne gültige Prüfung vorlegen. Erwartet: kein unzulässiges Weiterverwenden des PASS; betroffene Prüfung offen. Unveränderte gültige Nachweise dürfen mit begründetem Bezug wiederverwendet werden. Zustand NOT_RUN.

TC010/011 gehören zu US004; TC012 gilt zusätzlich als Abschlussregel für alle Stories. Jedes Ausführungsergebnis enthält test_run_id, testcase_id/version, work_item_id/version, Build/Commit, Umgebung, Prüfer, Zeit, PASS/FAIL/BLOCKED/NOT_RUN, Beleg und ggf. Finding-ID. Fehlgeschlagene Historie bleibt erhalten.

## Bestehende IDs und Lieferungen erhalten

AG-LIVE-LATENCY-001 bleibt Fehler-ID für EP001, insbesondere US001–003. Der ursprüngliche AG-EVENT-JOURNAL-001-Auftrag und run_id bleiben erhalten. Befund6319743049 ist der bereits vergebene Rollenfix in AG-LM-TK-011 / US006; kein zweiter Auftrag. #49 entspricht US007; #8 ist querschnittliche Bedienanforderung. Bestehende Originalbelege6315811461/6319821044 sind berichtete Lieferungen und werden erst nach Prüfung zu konkreten Kriterien/Testläufen zugeordnet. Keine Rückdatierung neuer IDs.

## Nächster Schritt / Schätzung

Lot: vorhandenen Rollenfix weiterführen; Register gegen tatsächlichen Code/Lieferungen abgleichen, kleinste nötige Hierarchieergänzung und fehlende Produzenten benennen. Die bereits angefragte Schätzung auf Tasks beziehen (Umsetzung/eigene Prüfung, unabhängige Prüfung, Wartezeiten getrennt), auf Stories/Epics ohne Doppelzählung aggregieren. Gemeinsam genutzte Arbeiten einmal veranschlagen. Keine neue Spec-/Implementierungsrunde nur wegen dieses Registers. Atlas führt Belegzuordnung, Restkriterien und die nächste tatsächliche Vergabe unter den stabilen IDs.

Status der Anpassung: Arbeitsregister gespeichert; Datenvertrag/Monitor noch nicht als umgesetzt, getestet oder veröffentlicht bestätigt. Kein Merge, keine Veröffentlichung, kein bezahlter Lauf durch dieses Dokument.

## Nachtrag V1.1 — Zeitstempel für angezeigte Aufträge und Übergaben

Nutzerauftrag vom 2026-10-21: einplanen, nicht sofort umsetzen. Priorität nach aktueller Livefehlerbehebung. Keine zusätzliche Ausführung/Veröffentlichung hiermit.

- Epic: AG-LM-EP-001.
- User Story: AG-LM-US-001, Abnahmekriterien ergänzt auf V2; vorhandener Nutzerzweck bleibt unverändert.
- Task: AG-LM-TK-019 — Zeitstempel an angezeigten Aufträgen/Übergaben in vorhandener Liste bzw. Details ergänzen.
- parent_id des Tasks: AG-LM-US-001.
- Technischer Owner für spätere Umsetzung: Lot.
- Status: BACKLOG / Umsetzung zurückgestellt; Aufwand noch ungeschätzt.
- Testfall: AG-LM-TC-013 V1, noch NOT_RUN, prüft TK019/US001 V2.

Abnahmekriterien: Datum und Uhrzeit einschließlich Sekunden und erkennbarer Zeitzone an der jeweiligen Übergabe nachvollziehbar anzeigen; vorhandene Ereigniszeit verwenden, Erfassungs-/Empfangszeit davon klar unterscheiden, wenn mit angezeigt. Fehlende Ereigniszeit bleibt unbekannt, keine erfundene Uhrzeit. Gleicher Originalzeitpunkt im Livebetrieb und Archiv; verspäteter Empfang ändert die ursprüngliche Zeit nicht. Vorhandene Oberfläche nutzen, keine neue Ansicht.

TC013: zwei Ereignisse mit unterschiedlichen Ereigniszeiten und verspäteter Zustellung anzeigen, anschließend denselben Verlauf im Archiv prüfen. Erwartet: richtig zugeordnete Datum/Uhrzeit/Zeitzone, ursprünglicher Zeitpunkt bleibt erhalten; fehlende Zeit wird ausdrücklich kenntlich. Darstellung auf Zielgerät lesbar. Keine bestandene Prüfung behauptet.
