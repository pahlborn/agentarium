# AG-PARTITUR-001 – Vorbereitung V1
Stand: 2026-10-14T16:55:48.939Z
Backlog: https://github.com/pahlborn/agentarium/issues/5
Status: reale konzeptionelle Vorbereitung abgeschlossen; exakte bevorzugte Referenzfassung noch nicht verfügbar; keine Implementierung oder Abnahme.

## Nutzerauftrag
Peter möchte Partitur im Backlog und parallel bereits vorbereiten. Die musische, saubere erste Fassung des neu gezeigten Standes ist seine Referenz; sie wurde hier noch nicht gesehen. Alte AG-MOCK-/AG-VISUAL-Dateien werden nicht als diese neue Fassung ausgegeben. Gewebe und Partitur bleiben gleichberechtigt. Der helle Kern bei Atlas im gezeigten Gewebe ist BALL.
Peter fordert außerdem ausdrücklich das Protokollieren der realen Zusammenarbeit für spätere Darstellung in Partitur und Agentarium.

## Tatsächliche Aufträge und Rückgaben
Atlas beauftragte zwei reale Subagenten unabhängig: /root/nova_visual_probe_001 mit create-vision-with-nova und /root/scout_process_review mit build-research-knowledge. Beide lieferten ihre Ergebnisse tatsächlich zurück. Es gab keine Claude-Sitzung, Produktimplementierung, QA oder visuelle Abnahme. Die verwendeten tatsächlichen Modelle und Tokenzähler sind hier nicht verfügbar und werden nicht erfunden.

## Nova – drei Verhaltensideen

### 1. Unabhängige Stimmen, gemeinsame Bezugspunkte
Arbeitsphrasen können gleichzeitig beginnen und unterschiedlich lang dauern. Ein gemeinsamer Akzent entsteht nur bei einem belegten Zusammenhang, z.B. einem Rechercheergebnis, das zwei Aufgaben verändert.
Risiko: Gleichzeitigkeit allein darf keine Zusammenarbeit suggerieren.

### 2. Frage und Antwort als wiedererkennbares Motiv
Eine Frage bleibt als offenes Motiv sichtbar. Die dazugehörige Antwort greift es auf der antwortenden Stimme auf; ein zurückhaltender Bogen verbindet genau diese Ereignisse.
Risiko: Beziehungen müssen unterscheidbar bleiben, ohne ein Meer individueller Symbole zu erzeugen.

### 3. Review und Rückläufer als Gegenstimme und Wiederaufnahme
Review bezieht sich auf den geprüften Beitrag. Defekt verweist auf seinen Ursprung, Reparatur nimmt das Motiv verändert wieder auf. Vorherige Fassung bleibt gedämpft nachvollziehbar.
Risiko: Ein musikalischer Schluss darf weder ungeprüfte Teile noch Produktabnahme als abgeschlossen darstellen.

Keine zusätzliche Bedienpanel-Struktur vorgeschlagen. Dies sind vorbereitende Ideen zur späteren Prüfung an der bevorzugten ersten Fassung, keine festgelegte Neugestaltung.

## Scout – Primärquellen und Grenzen

### SRC-01 · OMG UML 2.5.1, Interactions
Quelle: https://www.omg.org/spec/UML/2.5.1/About-UML
Befund: Lifelines, Messages/Replies und Combined Fragments erlauben die Darstellung von Beteiligten, Kommunikation, Parallelität und Schleifen.
Übertragungsvorschlag: Stabile Agentenstimmen, gerichtete Motivpaare und verbundene Review-Rückläuferschleifen.
Grenze: Interaktionsordnung belegt nicht automatisch gemessene Dauer, musikalische Gewichtung oder fachliche Bedeutung.
Nachweisumfang: Scout-Primärrecherche; Atlas bestätigte die normative Landingpage. PDF-Aufruf durch Atlas fehlgeschlagen; Kapitel nicht unabhängig nachgelesen.

### SRC-02 · OpenTelemetry Traces
Quelle: https://opentelemetry.io/docs/concepts/signals/traces/
Befund: Spans enthalten u.a. Start-/Endzeit, Parent-ID, Ereignisse und Status; Span Links erlauben kausale Verknüpfung asynchroner Arbeit.
Übertragungsvorschlag: Gemessene Arbeit als Dauer, einzelne Nachrichten als Anschläge, explizite Links zu auslösenden Vorgängen.
Grenze: Nur instrumentierte Vorgänge sind abgedeckt; technische Links beweisen keine fachliche Begründung oder Aufgabenverantwortung.
Nachweisumfang: Scout-Primärrecherche; Atlas las die Abschnitte Spans, Span Events und Span Links unabhängig.

### SRC-03 · Liu et al., StoryFlow, IEEE TVCG 2013 / Microsoft Research
Quelle: https://www.microsoft.com/en-us/research/publication/storyflow-tracking-evolution-stories/
Befund: Storyline-Visualisierung dynamischer Beziehungen über Zeit mit Optimierung von Reihenfolge, Ausrichtung und Bündelung.
Übertragungsvorschlag: Stabile Agentenspuren, episodische Bündelung zusammengehöriger Vorgänge bei höherer Ereignisdichte.
Grenze: Richtung, Kausalität und Zuständigkeit müssen aus Protokolldaten kommen.
Nachweisumfang: Scout-Originalforschung; Atlas öffnete die Original-Publikationsseite, kein unabhängiger vollständiger Paperreview.

## Atlas – Konsolidierung
Die musikalische Idee braucht echte Beziehungen als Grundlage: identifizierte Frage/Antwort, geprüfte Artefaktversion, ausgelöster Rückläufer und ausdrücklich zugewiesene Aufgabe. Gleichzeitigkeit oder ein Telemetrie-Parent allein sind kein Verantwortungswechsel. Scouts Formulierung, BALL folge Parent-/Link-Beziehungen, wird deshalb nicht als Regel übernommen; Verantwortung wechselt nur bei dokumentierter Aufgabenübergabe.
Die bekannten 21 NACHTPOST-V2-Storyideen sind Szenarioumfang, keine 21 bereits ausgeführten Arbeiten.

## Protokoll für spätere Visualisierung
Maschinenlesbare Aufzeichnung: relay/events/AG-PARTITUR-001-worklog-v1.json. Sie enthält echte Aufträge/Rückgaben mit stabilen IDs, Beteiligten, Aufgabenbezug, Kausalverweisen und Quellen; fictional=false. Sie ist getrennt vom fiktiven NACHTPOST-Demoszenario.
Die genaue Zeit jedes Subagent-Aufrufs/Handbacks ist nicht im erhaltenen Werkzeugnachweis ausgewiesen. Deshalb bleiben occurred_at und echte Arbeitsdauern dort null. recorded_at ist nur der tatsächliche Ablagezeitpunkt. Die Reihenfolge ist bekannt; aus ihr wird keine gemessene Dauer erfunden. Zeitlich unbekannte Vorgänge können später als geordnete Ereignisse mit unbekannter Dauer gezeigt werden, nicht als präzise Zeitbalken.
Eine Konvertierung oder Live-Anbindung an den neuen Produktcode ist nicht umgesetzt. Dafür fehlen noch dessen Dateien und der bestehende Ereignisvertrag. Das Protokoll ist ein Datenartefakt, keine neue Laufzeit-/Telemetriearchitektur.

## Offener Übergang
Die konkrete erste Partiturfassung muss nach Bereitstellung identifiziert werden. Erst danach Abgleich der drei Ideen, Auswahl eines kleinen Änderungsumfangs und spezifizierte Umsetzung durch Forge mit passender Prüfung. Der Kostenstrang bleibt pausiert. Keine Architektur-, Merge-, Release- oder Veröffentlichungsentscheidung.
