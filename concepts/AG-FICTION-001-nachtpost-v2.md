# NACHTPOST V2 – Die Stadt, die sich gemeinsam verändert
AG-FICTION-001, Konzeptversion 2 · 2026-10-14
Projekt: pahlborn/agentarium · Branch: feature/visual-stage-v0
Status: erweitertes Spielprojekt-Konzept; keine Produktspezifikation, Implementierung oder Abnahme.
V1 bleibt unverändert: fixtures/AG-FICTION-001-nachtpost-v1.json (Blob 8752451aab4c42ccf1806640db2ee62dd1ca536a).

## Die Idee
NACHTPOST bleibt eine Stadt aus ungesendeten Briefen. Besucher richten erfundene Nachrichten an unmögliche Empfänger. Aus Beiträgen entstehen Lichtgebäude, gemeinsame Entwürfe und Nachbarschaften. Jeder Beitrag muss zurückziehbar bleiben.

Die zentrale Spannung von V2: Wie kann etwas gemeinsam wachsen, wenn seine Ursprünge verschwinden dürfen? Zusammenarbeit, Wiederaufnahme und Rücknahme beeinflussen einander. Eine Änderung an einem Haus kann Fragen an mehreren anderen Stellen auslösen.

Dies ist ein ausdrücklich fiktiver Szenarioplan. Rollenaktionen, Recherchefunde, Fehler und Entscheidungen innerhalb der Demo sind erfundene Handlungselemente, keine ausgeführten Agentenantworten, echte Quellen oder Tests. Die reale Erstellung dieses Konzepts ist davon getrennt dokumentiert. Insbesondere fiktive Entscheidungen von Peter erteilen keine reale Freigabe.

## Umfang
| | V1 | V2-Konzept |
|---|---:|---:|
| Epics / Arbeitsstränge | 3 | 7 |
| Stories / Storyideen | 4 | 21, davon 3 offene Gartenideen |
| Change Requests | 1 | 2 |
| Strangübergreifende Konflikte | schmaler Rücknahmefall | 4 ausdrücklich ausgearbeitete Konflikte |
| Demolaufzeit | 120 Sekunden | vorgeschlagen: 480 Sekunden |
| Ereignisdaten | 34 ausgearbeitete Ereignisse | noch kein ausführbares Ereignisfixture |

Die acht Minuten sind komprimierte Demozeit, keine Aufwandsschätzung und kein erfundener Arbeitszeitnachweis. Die V1-Ereignisse werden nicht einfach verlängert oder vervielfältigt. V2 benötigt später eigene kausale Ereignisdaten aus dem hier beschriebenen Geschehen.

## Sieben Arbeitsstränge und 21 Storyideen
Die bisherigen Story-IDs US-01 bis US-04 bleiben ihren Kernideen zugeordnet. Neue Storyideen erhalten neue IDs. IDs und Inhalte sind Konzeptstruktur von Nova/Atlas; keine von Archibald fertig spezifizierten Stories oder Testfälle.

| Epic | Storyideen | Warum Arbeit und Kommunikation entstehen |
|---|---|---|
| EP-01 · Ein Brief wird bewohnbar | US-01: Brief als erkennbare Lichtgebäudeform; US-05: überarbeitete Fassung mit Ursprung verbinden; US-06: bewegungsarme Betrachtung | Nova fragt eigenständig nach wachsenden Häusern und stillen Höfen. Forge entwickelt zwei Formen parallel. Archibald fordert beobachtbare Unterschiede. |
| EP-02 · Nachbarschaft ohne Verrat | US-02: verwandte Beiträge verbinden; US-07: Herkunft gemeinsamer Formen nachvollziehen; US-08: Beziehungen nach Rücknahme neu bewerten | Scout bringt widersprüchliche Fundstücke; Argus liefert ein Gegenbeispiel. Eine zunächst brauchbare Regel muss eingegrenzt werden. |
| EP-03 · Zurückziehen heißt zurückziehen | US-03: Beitrag und betroffene Ableitungen entfernen; US-09: unabhängige Nachbarn erhalten; US-10: Rücknahme verständlich zeigen | Argus hinterfragt verräterische Leerstellen. Nova verändert ihre Zerfallsidee. Die Herkunftskette muss repariert werden; unabhängige Einzelhäuser laufen weiter. |
| EP-04 · Zwei Menschen, ein Brief | US-04: gemeinsamer Entwurf; US-11: Änderungen der Mitautoren unterscheiden; US-12: Rücknahme durch jeden Mitautor | CR-01 führt gemeinsame Autorschaft ein. Archibald fragt nach einseitiger Rücknahme. Die fiktive Entscheidung entsprechend V1: Jeder darf den ganzen gemeinsamen Beitrag zurückziehen. |
| EP-05 · Die unterbrochene Nacht | US-13: unterbrochenen Entwurf wiederfinden; US-14: inzwischen erfolgte Rücknahmen beachten; US-15: veraltete gemeinsame Fassungen als Konflikt behandeln | CR-02 fordert Wiederaufnahme nach Unterbrechung. Forge erkennt die Abhängigkeit zur Rücknahme. Sentinel prüft, ob alte Zustände entfernte Häuser zurückbringen. |
| EP-06 · Staunen verstehen können | US-16: eigenes Haus wiedererkennen; US-17: Rücknahme ohne Textwand verstehen; US-18: ruhige Ansicht derselben Stadt | Nova untersucht Verständlichkeit. Sentinel verlangt, Verschwinden, Fehler und fehlenden Verbindungsstand unterscheiden zu können. Ruhige Einzelbetrachtung entwickelt sich parallel. |
| EP-07 · Was darf nach einem Brief bleiben? | US-19: Garten aus unabhängigen neuen Beiträgen; US-20: verbleibende Formen auf Herkunft prüfen; US-21: unerlaubte Erinnerungsreste ausschließen | Nova öffnet die Gartenfrage erneut. Scout und Argus betrachten unterschiedliche Risiken. Alle drei bleiben offene Vorschläge; eine Studie mit neuen Beispielen erlaubt keine Nutzung tatsächlicher Rücknahmelücken. |

## Recherche: Schund, Gold und die nötige Revision
Drei erfundene Fundstücke gehören zur Dramaturgie:
1. Ein eindrucksvolles Rezept ohne nachvollziehbare Grundlage wird verworfen.
2. Ein Herkunftsmodell wird zunächst aufgenommen; nach Argus' Gegenbeispiel muss Scout es einschränken.
3. Eine nachvollziehbare Fallbeschreibung bleibt als Grundlage für Prüfideen erhalten.

Kein echtes Internetresultat wird behauptet. In einer späteren tatsächlichen Projektarbeit müssten Scout-Recherchen echte Quellen liefern. Im Spielprojekt erzeugt die unterschiedliche Beute Fragen, Revisionen und brauchbares Wissen.

## Vier Konfliktschleifen
**K1 · Nachbarschaft gegen Rücknahme — EP-02 / EP-03.**
Sentinel entdeckt und reproduziert die Brücke, die nach dem Haus bestehen bleibt. Forge fragt nach dem Umfang abhängiger Ableitungen; Scout prüft das bisherige Modell, Archibald präzisiert Kriterien. Eine neue Herkunftsreparatur geht in den gezielten Retest und anschließend ins unabhängige Review.

**K2 · Gemeinsamer Entwurf gegen Wiederaufnahme — EP-04 / EP-05.**
Eine alte Sitzung bringt einen inzwischen zurückgezogenen gemeinsamen Entwurf wieder hervor. Forge meldet die Abhängigkeit, Sentinel liefert die Wiederholungsfolge. Atlas hält diese Gemeinschaftsfunktion blockiert und legt die ungelöste Konfliktregel zur Entscheidung vor. Die einfache Einzelsitzung und unabhängige Gebäudeentwicklung laufen weiter. Die endgültige Konfliktregel bleibt offen.

**K3 · Verständliche Erinnerung gegen vollständige Entfernung — EP-03 / EP-06.**
Novas erkennbare Zerfallsspur kollidiert mit Argus' Einwand, dass sie den Ursprung verraten kann. Scout revidiert das zunächst hilfreiche Fundstück. Nova überarbeitet das Erlebnis; Archibald macht die veränderte Bedeutung prüfbar. Das Ergebnis ist keine bloße Farbänderung.

**K4 · Garten gegen Herkunft — EP-02 / EP-03 / EP-07.**
Eine scheinbar neutrale Gartenform übernimmt Beziehungen eines entfernten Briefes. Scout hinterfragt den Ursprung, Argus die Aussagekraft verbliebener Formen. Die Nutzung von Rücknahmelücken bleibt offen. Eine getrennte Studie mit ausschließlich neuen Beispielen darf weiterlaufen.

## Eigeninitiative aller acht Rollen im Szenario
| Rolle | Eigenständiger fachlicher Beitrag |
|---|---|
| Atlas | Abhängigkeiten offenlegen, blockierte Gemeinschaftsfunktionen von weiterlaufender Einzelarbeit trennen, ungelöste Entscheidungen zur richtigen Stelle bringen. |
| Nova | Stille Höfe vorschlagen, verständliche Rücknahme untersuchen und die Gartenidee wieder öffnen; Scout direkt um Recherche bitten. |
| Scout | Fundstücke aussortieren, Regeln anhand von Gegenbeispielen revidieren und unabhängige Gartenrisiken untersuchen. |
| Archibald | Unterscheidbare Formen und eine Konfliktentscheidung verlangen; gemeinsame Regeln und ihre Storybezüge präzisieren. |
| Forge | Technische Abhängigkeit zwischen Wiederaufnahme und Rücknahme selbst melden; unabhängige Gebäudeteile weiterbearbeiten. |
| Argus | Verräterische Lücken und scheinbar harmlose Gartenableitungen aktiv hinterfragen. |
| Sentinel | Konkrete Unterbrechungs-/Rücknahmefolge entwickeln, Defekt reproduzieren, betroffene Regressionen prüfen und Prüfgrenzen benennen. |
| Cadence | Doppelte Reparaturarbeit aufgrund zweier Rücknahmebegriffe erkennen und gemeinsame Begriffe/Verweise vorschlagen. Atlas und Archibald prüfen die Übernahme. |

Dies beschreibt Rolleninitiative im fiktiven Szenario; es behauptet keine tatsächliche Ausführung dieser Beiträge durch acht reale Sitzungen.

## Vorgeschlagene Dramaturgie
| Demozeit | Parallelität und Wendepunkte |
|---|---|
| 0:00–1:20 | Vision und Recherche starten gemeinsam; erste Funde werden verworfen, Häuserformen entstehen. |
| 1:20–2:40 | Kriterien verzweigen sich; Argus widerspricht, Forge bearbeitet unabhängige Teile weiter. |
| 2:40–4:00 | Brückenfehler, Reproduktion und lokale Reparatur; CR-01 öffnet gemeinsame Autorschaft. |
| 4:00–5:30 | Fiktive Entscheidung zur gemeinsamen Rücknahme; Cadence klärt Doppelarbeit; CR-02 eröffnet Wiederaufnahme. |
| 5:30–6:50 | Gezielter Retest und erneuter Rückläufer; ruhige Betrachtung entwickelt sich parallel. |
| 6:50–8:00 | Begrenzte Prüfergebnisse, Gartenkonflikt und offenes Ende; keine gespielte Produktabnahme. |

## Was daraus für Agentarium sichtbar werden soll
- Das Kommunikationsgeflecht entsteht aus dargestellten Beziehungen: Frage eröffnet einen Zweig; Antwort verbindet Arbeit; Einwand erzeugt einen Gegenstrang; Fehler und Reparatur führen zu ihrem Ursprung zurück.
- Überlagerungen stammen aus gleichzeitig relevanten Arbeitssträngen. Eine bloße zeitliche Nachbarschaft beweist keine fachliche Beziehung.
- Ohne Kommunikationsereignis entsteht kein neuer Kommunikationsfaden. Nachwirkung vorhandener Beziehungen darf sichtbar bleiben, muss aber zu ihrem Ursprung zurückführbar sein.
- Gewebe und Partitur erzählen dieselbe Geschichte räumlich beziehungsweise zeitlich. Keine der beiden Richtungen wird ausgewählt oder erneut implementiert.
- BALL kennzeichnet Verantwortung pro Aufgabe. Eine Antwort oder ein Review überträgt nicht automatisch Verantwortung; mehrere Aufgaben können gleichzeitig unterschiedliche Verantwortliche haben.
- GitHub, Recherchewelt und Claude-Kanal gehören zum dargestellten Arbeitsumfeld; die Demo behauptet keine echte Live-Anbindung.
- Kommunikation soll aus konkreten fachlichen Problemen notwendig werden. Es werden keine zusätzlichen Nachrichten allein für eine lebhafte Oberfläche erzeugt.

## Grenzen und nächster Übergang
V2 ist das erweiterte Spielprojekt-Konzept. Die Mocks werden hier nicht geändert. Kein tatsächlicher Produktbau von NACHTPOST, keine Architekturänderung, kein Merge, Release oder Veröffentlichung.
Der Kostenstrang bleibt pausiert: keine Kostenfeatures und keine erfundenen Kostendaten.
Offen sind konkrete Konfliktregeln für Wiederaufnahme/Garten, endgültige visuelle Mechanismen und später ausführbare V2-Ereignisdaten.
Ein anschließender Spezifikations-/Implementierungsauftrag muss diese Entscheidungen und die tatsächlich erlaubte Ausführung klären; dieser Konzeptauftrag ersetzt ihn nicht.

## Reale Erstellung und Nachweise
Nova: reale Subagentin /root/nova_visual_probe_001, create-vision-with-nova, AG-FICTION-001/NOVA V2, NOVA_READY. Nova lieferte sieben Arbeitsstränge, die vier Konflikte, Rolleninitiativen und die Dramaturgie.
Atlas: Konsolidierung, stabile Story-IDs und Abgrenzung zur bisherigen V1.
Argus: reale Subagent-Sitzung /root/argus_team001, review-agent-argus, RA_REVIEW V2 nach Lektüre der exakten Konzeptdatei: PASS_WITH_NOTES. Kohärent erhöhter Fachkommunikationsbedarf, keine zusätzliche Konzeptblockade. Vor einer späteren Fixture bleiben K2/K4 ausdrücklich offen; konkrete Aufgaben-/Entscheidungsverantwortliche müssen dann festgelegt werden. Die acht Minuten bleiben ein Dramaturgievorschlag. Diese Konzeptprüfung ist keine Produktabnahme und kein Test einer Visualisierung.
