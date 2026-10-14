# Agentarium-Mocks – Peters Anforderungen, V1
Stand: 2026-10-14
Quelle: Peters Nachrichten im laufenden Projektchat bis einschließlich der Bitte um diese Zusammenfassung.
Status: konsolidierte Nutzeranforderungen und offene Nutzerideen; keine neue Implementierungsfreigabe und keine vollständige Archibald-Spezifikation.
Projekt: pahlborn/agentarium, feature/visual-stage-v0.
Leitmotiv: „AGENTARIUM – See intelligence move. Powered by BALL“.

## A. Ziel und Produktumfang
- P01: Eine phantastische, innovative, visuell beeindruckende Darstellung des Zusammenwirkens des KI-Teams. Peter ist mit lediglich funktionierenden, langweiligen oder schematischen Mocks nicht zufrieden.
- P02: Zusammenarbeit in Echtzeit UND retrospektiv anhand von Protokolldaten erleben können.
- P03: Agentarium ist projektagnostisch. Mehrere unterschiedliche Projekte sollen erzeugt und mit ihren Daten in Agentarium dargestellt werden können.
- P04: Gewebe UND Partitur als zwei gleichwertige, lauffähige Mocks weiterführen. Peter hat sich noch nicht für eine Ansicht entschieden.
- P05: Die Mocks müssen Daten und erkennbare Aktivität zeigen; eine leere Darstellung erfüllt den Auftrag nicht. Der bisherige Prototyp ist ein Ideengeber, dessen Tauglichkeit erst zu prüfen ist.

## B. Erscheinung und Zusammenarbeit
- V01: Keine personenartige Darstellung als Hauptidee. Peter bevorzugte eine eher matrixartige Richtung; später präzisierte er ausdrücklich ein organisches Gewebe.
- V02: Gewebe muss als richtiges, zusammenhängendes organisches Netz wabern und leben. Eine sequentielle Ballweitergabe oder ein schematisches Netz mit etwas Bewegung reicht nicht.
- V03: Wirkliche vielfältige Zusammenarbeit sichtbar machen: parallele Arbeit, Fragen, Antworten, Reviews, Rückläufer, Fehler, Fehlerbehebung und Change Requests. Kein ausschließlich linearer Weitergabeablauf.
- V04: Kommunikation und Bearbeitung sollen das Geschehen verständlich machen: Wer wirkt woran mit, was geschieht und wie entsteht die gemeinsame Lösung?
- V05: Metaphorische Darstellung ist ausdrücklich erwünscht. Die Metaphern sollen Zusammenarbeit und Transformation anschaulich machen.

## C. Agenten, Identität und Tätigkeiten
- A01: Jeder der acht Agenten erhält einen unterscheidbaren Avatar bzw. eine visuelle Identität, ohne zur unerwünschten Personenansicht zurückzukehren.
- A02: Zuschauer sollen erkennen, wer die Teammitglieder sind und welche Rollen sie haben: Atlas, Nova, Scout/RKA, Archibald, Forge/CA, Cadence, Argus, Sentinel.
- A03: Erkennbar machen, was ein Agent gerade tut, insbesondere wenn er den BALL bzw. eine Aufgabe hat.
- A04: Claude- und ChatGPT-Agenten unterscheiden können; außerdem die verwendeten LLM erkennen können. Tatsächliche Modellangaben brauchen Laufzeitnachweis.
- A05: Für jeden Agenten eine eigene Geschichte, Besonderheit und Welt entwickeln. Die phantastische Lösung entsteht erst durch ihr Zusammenwirken.
- A06: Atlas als Orchestrator/Konzertmeister und motivierender Verantwortlicher; alle Teammitglieder sollen Verantwortung übernehmen, aktiv Ideen beitragen, Rückfragen stellen und sich gegenseitig einbeziehen.
- A07: Nova und Atlas dürfen Scout aktiv auf Recherche schicken. Nova soll ihre Vision weiterentwickeln und den vorhandenen Stand kritisch beurteilen.

## D. BALL, Kommunikation und Bedienung
- I01: BALL und Kommunikationsbewegungen erhalten zuschaltbare IDs.
- I02: Ein einblendbares Sidepanel soll eine Kommunikationsübersicht bieten.
- I03: Das Sidepanel darf die Bühne bzw. den Bildschirm nicht überdecken.
- I04: Rollen, Aufgaben, Kommunikationsvorgänge und ihre Bearbeitung sollen visuell nachvollziehbar bleiben; technische Kennzeichnungen dürfen die gewünschte Wirkung nicht ersetzen.

## E. Recherche und Umgebung
- E01: Internetrecherche ist ein zentraler sichtbarer Teil der Projektarbeit; Fragen und gefundene Seiten/Informationen bewegen sich vielfältig zwischen Beteiligten.
- E02: GitHub als wiederkehrenden Ort für Ablage, Austausch und Informationen sichtbar einbeziehen. Peter beschrieb es auch als Informationsmarktplatz.
- E03: Claude-API und Verbindungskanäle sichtbar machen; der BALL kann sich metaphorisch durch einen Kanal zwängen.
- E04: Weitere relevante Komponenten wie v0 und Hilfsprogramme berücksichtigen; welche davon benötigt werden, ist noch offen.
- E05: Scout soll auf Wissensreise gehen: mit dem BALL durchs Wissensuniversum, heimkehren mit Schund und Gold.
- E06: Erkenntnisverarbeitung sichtbar machen: manches wird verworfen/verglüht; anderes aufgenommen, verarbeitet und veredelt.

## F. Kosten und Tokens – einschließlich jüngster Präzisierungen
- K01: Ziel ist, Kosten und Tokens einzelner Aktionen erkennen zu können.
- K02: Ziel ist eine eindrucksvolle Darstellung ansteigender Projektgesamtkosten.
- K03: Alle Anforderungen mit allen zugehörigen Kosten protokollieren, inklusive fehlgeschlagener/abgebrochener Versuche und Wiederholungen.
- K04: Tokens für ALLE acht Agenten in die interne Kostentabelle aufnehmen. Fehlende Runtime-Werte ausdrücklich als nicht verfügbar führen; nicht mit null gleichsetzen.
- K05: Verbrauchte Beträge jedes Mal nennen; bei ausreichender vergleichbarer Datenbasis vorab eine nachvollziehbare Kostenschätzung geben.
- K06: Kostenkontrolle überdenken: Abbrüche begonnener Arbeit können zusätzliche Kosten verursachen; Sichtbarkeit und Orientierung vor Beginn sind Peter wichtig. Dies ist kein Auftrag zu unbegrenztem Verbrauch.
- K07: Jüngste Vorrangregel: Bei unvollständiger Kostenbasis ist eine Kostenanzeige in Agentarium unerwünscht, weil sie falsche Information vermitteln würde. Keine vermeintlich vollständigen Kosten/Projektgesamtsummen anzeigen. Vollständigkeit ist Voraussetzung; das interne Register darf belegte Einzelwerte und gekennzeichnete Lücken enthalten.
- K08: Frühere fiktive Demo-Kosten sind keine tatsächlichen Team-/Projektkosten. Echtdaten und Konzeptdaten müssen nachvollziehbar getrennt bleiben.
- K09: Abo-/API-Abrechnung und mögliche Nutzung des Claude-Monatsplans klären; der konkrete Tarif und ein Authentifizierungswechsel sind noch offen.

## G. Noch offene Gestaltungsfragen und Nutzerideen
Diese Fragen sind ausdrücklich keine bereits entschiedenen technischen Lösungen:
- O01: Wie sieht ein Review aus? Kommen dafür alle zusammen, oder wie wird eine passende Review-Situation erkennbar?
- O02: Ist der BALL immer gleich groß und gleich hell? Kann seine Erscheinung Lösungsannäherung zeigen, oder braucht es dafür ein eigenes visuelles Element?
- O03: Wie wird Fortschritt zur Lösung verständlich, ohne einen unbelegten Fortschrittswert zu erfinden?
- O04: Wenn ein Konzept bei Archibald ankommt: entstehen daraus viele kleine Epic-/Story-Bälle, die Forge aufnimmt und zu einem Gebilde verarbeitet? Peter nannte dies als bildhafte Idee, noch nicht als verbindlichen Mechanismus.
- O05: Welche weiteren Werkzeuge/Umgebungskomponenten außer GitHub, Claude-API, v0, Hilfsprogrammen und Internetrecherche sind relevant?
- O06: Wie erzählen die noch auszugestaltenden acht Agentenwelten gemeinsam eine Geschichte? Scouts Wissensreise und Atlas als Konzertmeister sind Nutzeransätze; die übrigen Geschichten noch kein finaler Kanon.
- O07: Was macht die beiden Ansichten phantastisch und überraschend? Gewebe/Partitur sind Ansätze, keine bereits akzeptierte Endgestaltung.

## H. Demo-Szenario, echte Ausführung und Qualität
- Q01: Ein turbulentes Phantasieprojekt verwenden, in dem viel gearbeitet und kommuniziert werden muss, damit mehr als die schmale Aufgabenball-Sequenz sichtbar wird.
- Q02: Lauffähige Mocks mit der gemeinsamen Agentengeschichte erstellen.
- Q03: Forge setzt die Mocks um; Atlas soll die Implementierung nicht übernehmen, auch wenn Claude-Aufrufe Kosten verursachen.
- Q04: Echte Spezialisten/Subagenten mit ihren vorhandenen Skills einsetzen. Keine simulierten Agentenantworten oder erfundene Rückmeldungen.
- Q05: Echte Aufträge, Antworten, Laufzeitnachweise und Ergebnisse dokumentieren. Das fiktive Demo-Projekt nicht als Nachweis tatsächlicher Agentenkommunikation ausgeben.
- Q06: Archibald erstellt nachvollziehbare Entwicklungsvorgaben einschließlich Epics/User Stories, Akzeptanzkriterien und initial abgeleiteter Testfälle; Sentinel prüft Testbarkeit und tatsächlichen Lieferstand.
- Q07: Sentinel soll sichtbare eklatante Fehler wie leere Mocks finden; relevante Fähigkeiten und Testumfänge müssen überprüft werden. QA muss die tatsächlich ausgelieferte Darstellung erfassen.
- Q08: Ein unabhängiges Review ist erforderlich; im Chat wurde ausdrücklich „Review“ bestätigt und die korrigierte Vorgehensweise freigegeben.
- Q09: Testfälle, Befunde, Bereinigung und Retests müssen auf konkrete Vorgaben und Versionen zurückführbar sein.
- Q10: Prozessreview und Optimierung unter realer Beteiligung des Teams; Cadence ist der Prozessagent. Keine vorgetäuschte Beteiligung.
- Q11: Fehler sind tolerierbar, sollen aber gefunden und transparent benannt werden; ein technisch funktionierender Mock allein erfüllt die kreative Zielsetzung nicht.
- Q12: Nach begonnenen oder abgebrochenen Forge-Aufträgen wahrheitsgemäß Ausführungsstatus und konkrete Abbruchursache nennen.

## I. Fortbestehende Arbeitsgrenzen
- B01: Bestehenden Projektstand fortsetzen, erledigte Schritte nicht wiederholen.
- B02: Vorhandene Relay-Architektur verwenden. Identitäts-/Kommunikationstests sind keine allgemeine Implementierungsfreigabe.
- B03: Keine Architekturänderung, keine unnötigen Prozessrunden oder Vollspezifikationen.
- B04: Keine eigenmächtigen Merge-, Release- oder Veröffentlichungsentscheidungen.
- B05: Kosten minimieren; Guthabenmangel und konkrete technische Blocker offen benennen. Kein neuer unbeschränkter Kostenrahmen aus der Kritik am Abbruchmechanismus ableiten.
- B06: Nur Fragen an Peter stellen, wenn seine Entscheidung tatsächlich erforderlich ist.

## Lesart
Diese Sammlung hält Peters Zielsetzungen, Präzisierungen und offene Ideen fest. Sie behauptet keine Umsetzung oder Abnahme. Die spätere Kostenvollständigkeitsregel geht der früheren gewünschten Gesamtkostenvisualisierung bei der Auslieferung vor. Weitere technische Mittel aus Teamvorschlägen (z.B. konkrete Membrangeometrien) werden nicht nachträglich als Peters festgelegte Lösung ausgegeben.

## Quellenanker für jüngste Vorrangregeln und Prozessfreigabe
- K07: Peter, 2026-10-14 im Projektchat: „wenn wir nicht alle kosten haben, ist eine anzeige der kosten in der agentarium nicht wünschenswert. das wäre dann eine falsche information“.
- K04: Peter, 2026-10-14: „wir sollten alle token für alle agenten in die kostentabelle aufnehmen“.
- Q06/Q08: Peter fragte nach Epics/User Stories, daraus abgeleiteten Testcases, Sentinel-Fähigkeiten und fehlendem Review; präzisierte „Ja, Review“ und gab anschließend „Ok, so umsetzen bitte“. Nachweise zur konkretisierten Umsetzung: previews/AG-VISUAL-004-review-evidence-v1.md und governance/AG-NACHTPOST-003-qa-review-audit-v1.md. Diese Dokumente ersetzen nicht den ursprünglichen Nutzerentscheid.
- Im Chat verfügbare Originalnachrichten besitzen hier keine abrufbaren Message-IDs; solche IDs werden nicht erfunden.

## Tatsächliche Vollständigkeitsprüfung
Argus (/root/argus_team001, review-agent-argus), MOCK-REQUIREMENTS RA_REVIEW V2: PASS_WITH_NOTES, keine wesentliche Auslassung im begrenzten Abgleich. Nutzerziele und Teamkonkretisierung sauber getrennt; Kostenregel korrekt priorisiert. Hinweis auf genaue Quellenanker oben aufgenommen. Keine Behauptung einer Produkterfüllung oder Abnahme.
Zusätzliche Anthropic-API-Aufrufe für diese Zusammenstellung: keine; API-Zusatzverbrauch USD0. Verbrauch der ChatGPT-Agentsitzungen hier nicht als individuelle Token-/Geldwerte verfügbar.
