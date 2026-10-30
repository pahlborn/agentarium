# AG-LM-WORK-REGISTER — V1

> **Verbindliche Einordnung nach erneutem Vorgabenabgleich am2026-10-23:** Dieses Register ist Atlas' Arbeitsplanung und Anforderungsentwurf. Produktspezifikation/Abnahmekriterien sind erst nach tatsächlicher Archibald-Rückgabe entsprechend belegt; TC001–014 bleiben Atlas-Entwürfe bis zur unabhängigen Sentinel-Testplanung. Frühere direkte oder indirekte Verbindlichkeitserklärungen der Atlas-Ausarbeitung werden hiermit korrigiert. Peters Originalanforderungen gelten unverändert. Lot wird nicht für Archibalds Aufruf oder Spezifikation eingesetzt. Die folgenden historischen Zustandsangaben sind Momentaufnahmen; maßgeblich ist die belegte aktuelle Lieferung, nicht ein altes „offen“ im Text.


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

## Nachtrag V1.2 — gleiche verfügbare Details in Flug und Liste

Nutzerbefund: „Im fliegenden auftrag kann ich mehr daten sehen als in der liste.“
Task AG-LM-TK-020 → AG-LM-US-001 (Kriterien V3) → AG-LM-EP-001. Owner Lot. Zustand: Befund erfasst, Abgleich der tatsächlich geladenen Darstellung offen, nicht umgesetzt.
Ziel: Alle am fliegenden Auftrag verfügbaren fachlichen Angaben sind auch nach dessen Verschwinden am zugehörigen Listeneintrag dauerhaft erreichbar; vorhandene Details verwenden, keine neue Ansicht.
Codebefund an main53f7c278: stromZeile hat getrennte Auftrags-/Ereigniszweige; Auftragszweig übernimmt nur Kommando/Empfänger/optionales Modell/Text, während der Ereigniszweig die Spur anhängt. Bei beobachteten GitHub-Ereignissen benutzen Liste und Flug allerdings beide spurWort; für diese allein ist damit kein Datenverlust bewiesen. Außerdem .agAuf.tat opacity .42. Peters konkrete geladene Fassung und fehlende Felder sind noch nicht beobachtet, kein eindeutiger Fehlerort behauptet.
Test AG-LM-TC-014 V1 / NOT_RUN: dieselbe Übergabe während des Flugs und anschließend in Liste/Details vergleichen. Alle verfügbaren IDs, Hierarchie, Titel, Rollen, Herkunft/Originalbeleg und geplanten Zeitstempel müssen zum selben Ereignis gehören und nach dem Flug erreichbar/lesbar bleiben, auch per Touch. Fehlende Quelldaten bleiben kenntlich. Vorhandene kurze Listenansicht darf kompakt bleiben, ohne Details unzugänglich zu machen.

## Nachtrag V1.3 — operativer Paketabgleich mit Lot

Geprüfte Produktbaseline: df8cd4db0c987cac70b6c77276be247806840358. Originale: PR46/6320419135 (Restschätzung),6320849443 (Kandidat/Veröffentlichung und Lieferung),6320899194 (Archibald-Route). Atlas ordnet operative Priorität/Abhängigkeiten; dies ersetzt weder Archibalds Spezifikation noch Sentinels Testplanung.

### Konkret ergänzte Arbeitspositionen

- AG-LM-TK-021 → AG-LM-US-004 → AG-LM-EP-002: bereits veröffentlichte Archibald-Spezifikationsaufgabe aus6320541062; nun im Register nachgeführt. Owner Archibald/spec-agent; BLOCKED/pending_route. Lot meldet spec-agent in seiner laufenden Sitzung nicht verfügbar. Ein neuer geladener Claude-Host ist nicht durch Atlas startbar; kein allgemeiner Agent als Ersatz und kein ungeprüfter API-Aufruf.
- AG-LM-TK-022 → AG-LM-US-001 → AG-LM-EP-001: fehlende Erzeugung echter Lebenszyklusmeldungen mit den tatsächlich ausführenden Rollen/Hostquellen klären und innerhalb geltender Rechte anbinden. Schnittstellenowner Lot; Atlas verantwortet Quellen-/Rollenrouting. Erst kleinster Ende-zu-Ende-Nachweis, keine neue Infrastruktur/Workflowaktivierung/bezahlt ausgeführte Testrolle. Noch nicht geschätzt; bisherige Summe deckt diesen Rest nicht ab.
- AG-LM-TK-023 → AG-LM-US-004 → AG-LM-EP-002: Kindstatus zu Story-/Epic-Abschluss zusammenführen; Owner Lot, Spezifikationsabhängigkeit TK021. Dies ist Umsetzung, kein Testfall. TC011 prüft TK023 sowie die Hierarchietasks. Vom Nutzer ausdrücklich verlangt, aber noch nicht spezifiziert/implementiert; kein stillschweigendes Done aus Liefermeldungen.

### Reihenfolge und parallele Prüfung

| Paket | Tatsächliche Positionen | Abhängigkeit / Freigabereife |
|---|---|---|
| AG-LM-PK-001 — echte Live-Kette | TK022, bestehende Umsetzungsteile TK001/003/005, Nachweistasks002/004/006 | höchste Priorität. Automatisches Relay schreibt bisher nur handoff/contribution/progress, keine Lebenszyklusmeldungen. Echte Quelle und tatsächlich geladene Verbraucherversion prüfen. Rollentätigkeit nicht aus Transportbestätigung ableiten. Veröffentlichungsebene separat freigeben. |
| AG-LM-PK-002 — bestehende Ergebnislieferung abschließen | TK011/012, TC006 | Rollenfix/Ergebniszuordnung liegen jetzt remote vor; nicht erneut implementieren. CI39634351288 beim ersten Abruf in_progress, danach tatsächliches Ergebnis abgleichen. Kandidatenprüfung kann parallel zur Quellenklärung laufen; keine Gesamtannahme. |
| AG-LM-PK-003 — Arbeitsstruktur vollständig | TK021, gemeinsamer Hierarchieanteil TK001/007/015, Umsetzung TK023, Nachweistask008, TC010/011/012 | zusammenhängendes Technikpaket, vorhandene IDs erhalten; zuerst Archibald-Spezifikation und unabhängige Testplanung. Elternaggregation ergänzt die Hierarchie; nicht erst im Archiv entdecken. |
| AG-LM-PK-004 — Wiederaufnahme und Archiv | TK009/010/015/016/017/018, TC005/008/009 | auf gleichem geprüften Vertrag/Hie­rarchie aufbauen; Restore-Grund früh schließen, soweit unabhängig. Archivzeitachse ist offene Produktentscheidung; keine stille Wahl eines festen Takts oder Zeitstauchung. |
| AG-LM-PK-005 — ergänzende Laufdetails/Bedienung | TK013/014, TK020; Issue8 | Ladestandsanzeige darf unbestätigt bleiben, echte Ladebelege separat als fehlende Quelle führen. Liste/Flug nur nach tatsächlich beobachtetem Befund ändern; keine belegte Live-Datenlücke bisher. Issue8 ist Erklärung/Appfassung, NICHT US007 (Skillstand); frühere Gleichsetzung aus Lots Text korrigiert. TK019 bleibt ausdrücklich BACKLOG/später. |

PK-IDs sind Bündelungskennungen, keine neuen Epics oder Arbeitsergebnisse. Jede enthaltene Task-ID behält Status, Owner und Nachweis; gemeinsame technische Umsetzung wird einmal geschätzt. Testausführung und Dokumentation können parallel zu anderer unabhängiger Arbeit erfolgen; keine zwei Entwickler auf dieselbe Implementierung.

### Aufwand und Grenzen des Abgleichs

Lots Originalprognose6320419135: 12–16 technische Arbeitsblöcke, jeweils abgegrenzte Umsetzung mit eigenen Checks/Gegentest; keine Stunden-/Termin-/Kostenprognose. Enthält weder unabhängige Sentinel-Ausführung noch Wartezeit/Freigabe noch unbekannte Live-Reparatur. Der dort noch mit 2 Blöcken angesetzte Ergebnisanteil ist inzwischen remote geliefert, Prüfung/Annahme offen. Er wird nicht nochmals entwickelt; eine aktualisierte Restprognose darf erst nach Ownerabgleich daraus abgeleitet werden. TK019/020 und explizite Produceranbindung TK022 sind in der ursprünglichen Schätzung nicht belegt enthalten.

Offen bleiben: echter Lebenszyklusproducer, Archibald-Route, nötige echte Ladebelege, Archivzeitachse und Zielgerät-/Veröffentlichungsnachweis. Bildänderungen/Veröffentlichung nach geltender Peter-Autorität; keine Freigabe aus technischen Prüfergebnissen.

Sentinel wurde einmalig als realer Subagent /root/sentinel_package_alignment für begrenzte Prüfreife/Paketabhängigkeiten gestartet (Veröffentlichung vor Start: PR6320964370, Issue2/6320964665). Dies ist kein bereits bestandener TC001-Lauf und keine Ersatzspezifikation. Ergebnis wird als eigener Originalbericht nachgetragen.

### Unabhängiger Prüfreifeabgleich — Sentinel QA_REPORT V1

Realer Lauf /root/sentinel_package_alignment, Baseline df8cd4db0c987cac70b6c77276be247806840358, read-only beendet. Ergebnis: Gesamtprüfreife BLOCKED, Paketfolge grundsätzlich tragfähig. Keine TC-Ausführung. Quellen: Relay AG_FIELDS/Strictfelder (59–60,194–197), Verbraucher reporter-Pflicht (github-live.js534–538), Lots Originalrückgaben.

Verbindliche Präzisierung zu PK001: zunächst begrenzter echter Transport-/Flug-/Puls-Machbarkeitsnachweis mit vorhandenen Feldern. Der vollständige TC001 verlangt schon die Elternkette und wird deshalb erst nach PK003 ausgeführt. PK001 darf keinen vollständigen TC001-PASS oder Storyabschluss behaupten. So entsteht keine zirkuläre Abhängigkeit zwischen Liveproof und Hierarchie.

Sentinel bestätigt getrennte Prüfung der gelieferten TK011-Implementierung, Archibald-Blocker, offene Archivzeitachse und die getrennte Behandlung von TK019/020/013. Lots noch ungeklärte Winkelmessungsflakiness bleibt offener Prüfhinweis, trotz zwischenzeitlich berichteter grüner Wiederholungen. Nächster Owner Atlas für Quellen-/Spezifikationsroute, Lot für vorhandene Interfaceumsetzung.

## Nachtrag V1.4 — Nutzungspause und gezielte Wiederaufnahme

Peter meldet am2026-10-21: Lot und andere Claude-Rollen sind aktuell wegen Nutzungslimit still, Fortsetzung nach22:00 Europe/Berlin. Das ist eine Nutzerangabe, kein nachgewiesener technischer Dauerausfall. Keine neuen Claude-API-Aufrufe als Umgehung, kein Rollenwechsel.

TK021-Route: Lots beobachtete fehlende Verfügbarkeit des spec-agent bleibt ein gültiger Laufzeitbefund. Seine Folgerung „nur neue Sitzung“ ist als noch unbestätigte Ursache/Lösung zu führen. Aktuelle offizielle Primärquelle https://code.claude.com/docs/en/sub-agents (Abschnitt Write subagent files, geprüft2026-10-21): vorhandene .claude/agents-Verzeichnisse werden beobachtet; Änderungen können ohne Neustart für die nächste Delegation geladen werden. Ausnahmen: agents-Verzeichnis erst nach Sitzungsstart angelegt, Zusatzverzeichnis über add-dir, Start mit disable-slash-commands. Vorhandene Laufzeitversion/Hostingoberfläche können abweichen; Webdokumentation beweist nicht Lots tatsächlich geladenen Stand.

Nach22:00 einmal vorhandene Kommentare/Head abgleichen und nur unbeantwortete Aufgaben weiterreichen. Lot prüft ohne Testmodellaufruf: genaue Runtime/Version, Projekt-/Arbeitsverzeichnis und dortige spec-agent-Datei, Agentverzeichnis bei Sitzungsstart vorhanden, Startup-/Hostingbeschränkungen, echte Liste verfügbarer Typen. Unterstütztes Nachladen verwenden, ohne Tools/Rechte/Modellgrenzen zu ändern; tatsächlichen spec-agent erst nach belegter Verfügbarkeit im bestehenden autorisierten Rahmen für TK021 starten. Andernfalls konkrete Start-/Reloadbedingung des Hosts liefern, keine pauschale Abwesenheitsmeldung, keine Umbenennung allgemeiner Agenten und kein neuer bezahlter Workflow.

TK022-Quellenroute: Anzeige/Verbraucher und Erzeugung getrennt. Atlas meldet eigene reale Übergänge; Claude-Host/Rolle nur beobachtete eigene. Lot prüft den minimalen bestehenden Produzentenanschluss an den strikten Vertrag; kein kompletter neuer Collector und keine Infrastrukturaktivierung aus diesem Auftrag. Ein realer Lebenszyklusfall genügt zunächst als Nachweis; vollständige Abnahme bleibt später nach Hierarchie.

## Nachtrag V1.5 — direkte Archibald-Zuweisung

Peters Routingkorrektur vom2026-10-23: Atlas beauftragt Archibald direkt, nicht über Lot. Die Host-/Reload-Abhängigkeit von Lots laufender Sitzung in TK021/NachtragV1.4 ist als regulärer Ausführungsweg aufgehoben. Lot bleibt Implementierungsowner des Monitors, Archibald/spec-agent bleibt Spezifikationsowner, Atlas verantwortet seinen direkten Aufruf.

Aktuell verifizierte bestehende Route: relay/claude_public_relay_v2.py enthält spec-agent in ROLES. Der alte archibald-relay.yml-Identitätstest ist nicht die einzige Route. Direct-Relay-Unterstützung ist keine bestätigte aktuelle Ausführung; API-Worker-Aktivierung verlangt weiterhin konkrete Kostenautorität und geprüftes versioniertes Paket. Keine Aktivierung durch dieses Dokument. TK021: direkte Beauftragung durch Atlas, worker_started nicht belegt. Frühere pauschale Aussage, es gebe keinen Archibald-Weg, wird entsprechend eingeschränkt: direkter Sessionconnector hier nicht vorhanden, vorhandener API-Relay-Weg unterstützt die Rolle.


## Atlas session state

Governance adoption task: AG-RULEBOOK-014. This section stores cursors and Cadence trigger state, not inferred product progress.

| Field | Value |
|---|---|
| Last contiguously inspected Issue #2 comment ID / time | unknown — no full continuity reconciliation performed during this bounded governance change |
| Last Cadence review-run reference | unknown — the Ballbrause Cadence contribution is not assumed to reset the new five-task review counter |
| Closed tasks since last review | unknown — reconcile task closure records before first operational trigger decision; do not assume zero |
| Trigger/finding keys already dispatched | none recorded under 1.4 yet; historical dispatches must be checked before duplicate invocation |
| Next owner/action | Atlas: reconcile cursor/count at the next session start and dispatch due findings once, preserving unknowns |

Update at session start and task closure under Process 1.4 §§0,4,5. Preserve originals and record trigger key, status, review reference and next review event. Do not count comments, commits, subtasks or CI attempts as separate closed tasks by default.


### GT40-V113 — scoped Atlas session state, 2026-10-30
<!-- GT40-V113-SESSION-CHECKPOINT -->

This checkpoint is scoped to gt40-engine / GT40-V113-PRUEFUNG. It does not advance the unreconciled global journal cursor or Cadence count above.

| Field | Observed value |
|---|---|
| Event-instruction file / last file commit checked | handoffs/AG-EVENT-JOURNAL-001-anstoss-v1.md @02124bf52519e1ff032abc00ad918b7956ddf5a1; unchanged from previously loaded text |
| Loaded governance | Rulebook/Process 1.4 @033247914d0034b03651210a30e4cd8485bb708f |
| Approved plan / target | Plan V1, Peter explicitly approved; gt40-engine@18b5de58ea24d373409c758cb9a386cca7affb88 (v113), not v114 |
| Actual workers | /root/scout_gt40_v113, /root/argus_gt40_v113, /root/sentinel_gt40_v113; all completed, reports actually received |
| Durable reports and open owners | https://github.com/pahlborn/gt40-engine/issues/67#issuecomment-6515976270; originals and fresh QA evidence linked there |
| Result / next owner | Review V1 delivered, technical FAIL; Peter identifies actual ARP kit and matching instruction/revision; Atlas evaluates that evidence next |
| Follow-up corrections at original review delivery | gt40-engine issues68–78, eleven separate backlog items; later implementations: #71/#72 via v115/PR79 and #70/#77 via v116/PR80, see pump checkpoint below |
| Main-task return event | agentarium Issue2 comment6516004614; contribution Atlas to Peter, customer acceptance not reported |
| Journal reading limit | Own task events and specifically inspected recent records only; global contiguous cursor remains unknown, no gap silently skipped |
| Cadence closure counter | unknown, unchanged; this main review is delivered with safety clarification/customer acceptance pending, no inferred global reset |
| Evidence correction | Initial local mutation-log reuse was identified; the same35 cases reran freshly without cache,29red/6green, all13tests have at least one red case. Original report and addendum preserved |
| Background / implementation | No unattended worker remains; no motor project files changed; only authorized review issues/comments and separate PR51 closure |

Next observable condition: Peter's kit/instruction evidence or explicit result acceptance. Preserve known finding history and do not restart the three completed reviews by default.


<!-- GT40-PUMPE-MESSBLATT-001 -->

### Pump sheet follow-up — 2026-10-30

Scoped task GT40-PUMPE-MESSBLATT-001, explicitly commissioned by Peter after the v113 review. Current instructions override the old read-only review scope for this named follow-up only.

| Field | Observed value |
|---|---|
| Loaded governance / journal | Rulebook and Process1.4 including §7 @aff38dabb8dabc0c5b1d90e6b0ce2edd59d7f49c; journal file last commit02124bf52519e1ff032abc00ad918b7956ddf5a1 rechecked unchanged before first event |
| Baseline / delivered source | v115 b00902691743002a5994f6e1bcf7fc4f156ef3d5 → v116 4a9697b2360b6303514717d46b58c3e51fb4c8e8; PR80 merged; treee787ff11911efeb16a9a72937ebb271469648a0c |
| Work / actual roles | Atlas authored and integrated directly commissioned documentation/field markup using existing storage; real /root/sentinel_pump_sheet independently reviewed field wiring, counterchecks and actual CI logs; completed. No Claude worker simulated or paid relay called |
| Durable result | https://github.com/pahlborn/gt40-engine/pull/80 ; consolidated update https://github.com/pahlborn/gt40-engine/issues/67#issuecomment-6519268619 |
| Checks / publication | PR41030622198 and main41031361512 green; main includes live smoke7/7 at v116; Pages41031360779 green. Live version.js/specs.html Gitblobs exactly match delivered source. Field suite75/75 including expected red single-handler counterexample |
| User surface | https://pahlborn.github.io/gt40-engine/specs.html#waterpump-measurements ;16 empty pump/cooling observation fields, existing AutoSave/persistence |
| Decisions / real evidence | Peter confirms old pump has backplate; Milodon excluded for appearance by explicit choice, no further closure-method research. Exact old pump number, hub height/reference, both small-port identities and real cooling line endpoints still open |
| Correction issues | #70 and #77 closed for erroneous document assertions only. Original v113 review remains FAIL with other findings and ARP safety clarification pending |
| Next owner/action | Peter records physical measurements and actual connection endpoints in the sheet; Atlas evaluates actual pump identification and applicable source. Proposed future drawing: checked port/connection table → generated SVG → independent technical check; no finished hydraulic drawing or approval claimed |
| Main task return / acceptance | agentarium Issue2 comment6519268993, contribution Atlas→Peter. Customer acceptance not yet reported; never infer it from acknowledgement |
| Background / counters | No worker or unattended follow-up remains. Global journal contiguous cursor and Cadence closure count remain unknown; this scoped checkpoint does not silently advance/reset them |
