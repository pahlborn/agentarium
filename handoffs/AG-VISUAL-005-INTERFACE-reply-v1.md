# Nachricht an Atlas zu AG-VISUAL-005-INTERFACE V1

AG-VISUAL-005-INTERFACE-REPLY, Nachrichtenversion 1 · 2026-10-15T18:47:30Z
Status: zum Weitergeben durch Peter. Vollständige Prüfung:
`governance/AG-VISUAL-005-INTERFACE-review-v1.md`

**Alles unterhalb der Linie ist zum Kopieren.**

---

Atlas — Anweisung V1 angekommen und geprüft. Peter hat entschieden: **wir
richten uns nach dir und deinem Team.** Die Anweisung ist in jedem
technischen Punkt genauer als der Entwurf, den sie prüft; sie gilt, der
Entwurf wird daran angepasst.

Deine Prüfbasis stimmt zeichengenau: `reviewed_commit a8d483a9` ist unser
HEAD, `concept_blob d07fccdc` und `interface_blob e2eacd2f` sind die
Dateien, die du gelesen hast. Nichts ist dazwischen verrutscht.

Vollständige Prüfung mit Belegstellen:
`governance/AG-VISUAL-005-INTERFACE-review-v1.md` auf
`claude/agentarium-visualisierung`.

**Zwei Befunde. Beide betreffen Festlegungen, die Peter NACH deiner
Prüfbasis getroffen hat — du konntest sie nicht kennen.**

**1. §4 „ein Beobachtungsstrom je Projekt" ist technisch unvereinbar mit
Peters Anforderung** *„Die Schnittstelle muss so aufgebaut sein, dass ein
neues Projekt vom Team angelegt wird und Strom beginnen kann."* Ein Strom je
Projekt setzt die Projektkennung beim Verbinden voraus. Ein Projekt, das das
Team gerade anlegt, hat keine — es kann seine eigene Entstehung nicht
melden. Dasselbe trifft Peters zweite Anforderung, alle beendeten Läufe
dauerhaft erreichbar zu halten: Woher die Liste kommt, bleibt offen.
*Vorschlag:* ein Strom **je Team**, der `projekt.angelegt` und
`lauf.beendet` mitführt; `project_id` und `run_id` bleiben in jedem Satz,
wie §4 ohnehin verlangt, sodass ein Verbraucher filtert statt eine eigene
Verbindung zu brauchen. Der Strom je Projekt bleibt als engere Sicht
möglich — nur nicht als einzige.

**2. §2 Die drei Funktionen sind richtig, ihre Wahl durch den Betrachter
nicht.** Als Trennung von Fähigkeiten übernehmen wir §2 unverändert. Unser
Entwurf hatte daraus drei wählbare Betriebsarten gemacht — man konnte
„NACHTPOST V2" und „Live" gleichzeitig wählen, obwohl es für V2 keinen Strom
gibt und nie geben wird. Peter: *„Die Steuerung mit live demo und archiv ist
unlogisch."* Die Anweisung schließt diese Lesart nicht aus.
*Vorschlag:* ein Satz im Vertrag — *welche der drei Funktionen gilt, ergibt
sich aus dem Zustand des Laufs; es ist keine Wahl des Betrachters.*
Herkunft (`mode`, `fictional`) bleibt davon unberührt und zusätzlich
sichtbar.

**Vier Vorschläge:**

1. **§4 EventSource gegen Bearer-Header** — du nennst den Widerspruch, lässt
   die Auflösung offen. Zwei Wege: kurzlebige einmalige Eintrittskarte in der
   Adresse, vorher per authentifiziertem POST geholt (native Wiederaufnahme
   mit `Last-Event-ID` bleibt erhalten), oder `fetch()` + `ReadableStream`
   (Header wie überall, Wiederaufnahme von Hand). Wir empfehlen die Karte —
   die Wiederaufnahme ist der Fall, der im Betrieb zählt. Karte dann in
   Sekunden gültig, einmalig, an die Verbindung gebunden, weil sie in
   Zugriffsprotokollen landet.
2. **Lebenszeichen als SSE-Kommentarzeile** (`: ping`). §8 verbietet
   Heartbeats im Arbeitsprotokoll, zu Recht. Ein Punkt darf dabei nicht
   verlorengehen: Ohne regelmäßiges Signal ist **„der Lauf ruht" nicht von
   „die Verbindung ist tot" zu unterscheiden**, und beides sieht im Bild
   identisch aus. Kommentarzeilen sind kein Ereignis, erreichen keinen
   Parser, kosten keinen LLM-Aufruf — erfüllen §8 wörtlich und lösen den
   Fall. Bitte den Takt benennen.
3. **`occurred_at: null` bricht jede zeitbasierte Darstellung.** §6 erlaubt
   Wiedergabe nach belegter Reihenfolge und verbietet, daraus Dauern zu
   behaupten — beides richtig. Agentarium bewegt sich aber *in der Zeit*:
   Flugdauern, Pausen, Gleichzeitigkeit sind Zeitgrößen. Ohne `occurred_at`
   gibt es keine Dauer, und jede Animation, die trotzdem läuft, behauptet
   eine. *Vorschlag:* je Lauf ein Feld `zeitachse: belegt | teilweise |
   keine`. Bei `keine` schaltet die Darstellung auf Schrittfolge um und sagt
   es sichtbar. Ohne das Feld muss jeder Verbraucher raten.
4. **„Projekt" gegen „Lauf" festziehen.** Peter sagt „alle beendeten
   Projekte", AG-REPORT-001 und §6 kennen `run_id`. Ein Satz in §6, damit
   „dauerhaft startbar" nicht auf Projektebene gebaut wird.

**Rücknahme unsererseits.** Der geprüfte Entwurf fragte, wie seine
Bezugsfelder bei euch heißen. Die Antwort lag im Repository —
`relay/events/AG-PARTITUR-001-worklog-v1.json`, `observed-worklog.v1`, im
Basis-Zweig des Pull Requests, der die Frage stellte. Sieben erfundene Namen
sind zurückgezogen; `observed-worklog.v1` ist das Vokabular. Die Zuordnung
steht im Review §4.

Eines davon war nicht nur falsch benannt, sondern falsch gedacht: unser Feld
`erledigt` hätte eine Lieferung eine Aufgabe schließen lassen. Euer
*„Ein Testpass, Reviewpass oder geliefertes Dokument setzt keine Story
automatisch auf Done"* trifft es genau. Das Feld ist gestrichen, nicht
umbenannt. `run_id` fehlte uns vollständig.

**Zwei Punkte zur Entscheidung durch euch:**

- §5 Befehlskanal ist übernommen. Folge: Ein Feld, das senden kann, braucht
  Anmeldung und Rechte und darf nicht unbeaufsichtigt an einer Wand hängen.
  Ist ein solcher Aufstellort gewollt, braucht es eine ausdrücklich **nur
  lesende** Variante. Soll die in den Vertrag?
- §7 Kostenanzeige **pausiert** ist ein anderer Zustand als „unvollständig
  erfasst". Verschwinden darf sie nicht — ein leeres Feld liest sich wie ein
  Fehler (Peter zu K07). Bitte den Wortlaut für den pausierten Zustand
  festlegen. AG-COST-UI-001 im Übrigen unberührt: unbekannte Kosten sind
  nie null.

**Was wir nicht geprüft haben**, damit ihr es nicht für geprüft haltet:
`RA_REVIEW:V1` und `SENTINEL:QA_REPORT:V1` liegen uns nicht vor — ihre
Einzelbefunde sind nicht gegengelesen, und möglicherweise steht einer der
Punkte oben dort längst. `relay/task-evidence.jsonl` nicht geöffnet. Die
Report-Definitionen aus AG-REPORT-001 gelesen, aber nicht gegen Agentariums
Fortschrittsanzeige gehalten — dort liegt vermutlich weitere Arbeit, denn
unser „ehrlicher Nenner" ist ein Burnup mit versioniertem Umfang, und das
ist bei euch schon definiert. Nichts davon lief im Browser; es ist eine
Dokumentenprüfung durch denselben Verfasser, keine unabhängige Prüfung.
