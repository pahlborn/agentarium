# AGENTARIUM – Fassungsregister AG-VISUAL-005

Lebendes Dokument, **ohne** Versionsnummer im Namen: Es beschreibt die
Fassungen, es ist keine.
Projekt: pahlborn/agentarium · Branch: claude/agentarium-visualisierung
Stand: 2026-10-15T14:12:55Z

---

## 1. Drei Angaben, drei Aufgaben

Eine Fassung wird hier mit drei Dingen geführt, und sie sind nicht
austauschbar:

| Angabe | Aufgabe | wofür sie **nicht** taugt |
|---|---|---|
| **Nummer** (`-v1`, `-v2`) | benennt die Fassung, ist im Dateinamen zitierbar | sie sagt nichts über den Inhalt |
| **Zeitstempel** | **ordnet** die Fassungen | er identifiziert nicht — zwei Dateien können denselben tragen |
| **Blob-Hash** | **identifiziert** sie, Zeichen für Zeichen | er ordnet nicht, er ist keine Reihenfolge |

### Warum der Zeitstempel die Uhrzeit trägt

Ein reines Datum reicht nicht: **an einem Tag können mehrere Fassungen
desselben Dokuments entstehen**, und bei dieser Arbeitsweise tun sie das
auch. Deshalb ISO 8601 mit Uhrzeit und Zone (`2026-10-15T14:12:55Z`), nicht
`2026-10-15`.

Der Stempel ist der Zeitpunkt, zu dem die Fassung geschrieben wurde.
Verbindlich geordnet wird über den **Commit**, in dem sie liegt; der Stempel
ist die lesbare Fassung davon und steht im Dokument selbst, wo man ihn ohne
Git sieht.

### Warum Blob-Hashes und nicht nur Nummern

Eine Nummer behauptet eine Fassung. Ein Blob-Hash **ist** sie: Er wird aus
dem Inhalt gerechnet, nicht vergeben. Zwei Dateien mit gleichem Hash sind
Zeichen für Zeichen dieselbe Datei; weicht ein Komma ab, weicht der Hash ab.
Damit lässt sich eine Prüfanmerkung der Gegenstelle einer Fassung eindeutig
zuordnen — auch dann, wenn inzwischen weitergearbeitet wurde.

Nachzusehen ist ein Hash mit `git hash-object <datei>`; er muss mit der
Zeile unten übereinstimmen. Das Verfahren ist aus
`concepts/AG-FICTION-001-nachtpost-v2.md` übernommen, nicht neu erfunden.

---

## 2. Stand heute

| Dokument | Pfad | Fassung | Zeitstempel | Blob |
|---|---|---|---|---|
| Konzept | `concepts/AG-VISUAL-005-agentarium-konzept-v1.md` | Konzeptversion 1 | 2026-10-15T14:12:55Z | `d07fccdc18432b10fa2fbb904409f9d945ae7ff3` |
| Konzept V2 | `concepts/AG-VISUAL-005-agentarium-konzept-v2.md` | Konzeptversion 2 | 2026-10-15T20:40:00Z | `5d118e98dcb53d6f6992420b599d151f34a16b1f` |
| Schnittstelle | `specifications/AG-VISUAL-005-schnittstelle-v1.md` | Schnittstellenversion 1 | 2026-10-15T14:12:55Z | `e2eacd2fefd977cbe1637a1bf7123fb77e8556db` |
| Funktionsmatrix | `previews/AG-VISUAL-005-funktionsmatrix-v1.md` | Matrixversion 1 | 2026-10-15T14:12:55Z | `261c4658fc252c8727c1db120cdac806be3c204b` |
| Belege | `previews/AG-VISUAL-005-evidence-v1.md` | Belegversion 1 | 2026-10-15T14:12:55Z | `aaf733814df1a1c07fd0687fd1434db7d82e6244` |
| Feld (gebaut) | `previews/AG-VISUAL-005-feld-v1.html` | Fassung 41 | 2026-10-16T13:40:00Z | wird mit dem naechsten Commit nachgetragen |
| Prüfauftrag | `handoffs/AG-VISUAL-005-review-request-v1.md` | Auftragsversion 1 | 2026-10-15T14:12:55Z | `3595028ea462cafb37ef3200a2677806fcc71d61` |
| Prüfauftrag (maschinenlesbar) | `handoffs/AG-VISUAL-005-review-request-v1.json` | Auftragsversion 1 | 2026-10-15T14:12:55Z | `fb98f597c1f5e49bc97fc630aef56723fb6ca86b` |
| Prüfung der Atlas-Anweisung | `governance/AG-VISUAL-005-INTERFACE-review-v1.md` | Prüfversion 1 | 2026-10-15T18:47:30Z | `994cb2f89ef2c47418d6b232e8696305e5ee46ae` |
| Nachricht an Atlas | `handoffs/AG-VISUAL-005-INTERFACE-reply-v1.md` | Nachrichtenversion 1 | 2026-10-15T18:47:30Z | `56fed8bda3768d42043be28e7f1f94e91d6d781d` |
| Schnittstelle V2 | `specifications/AG-VISUAL-005-schnittstelle-v2.md` | Schnittstellenversion 2 | 2026-10-15T19:24:00Z | `8c86e3c6207030adcf0f1a2bb21194e3c3820f8b` |
| Schema Strom | `specifications/AG-VISUAL-005-schemas-v2/strom.schema.json` | agentarium.strom.v2 | 2026-10-15T19:24:00Z | `7814828bf35ae60ab1ea4429f8e5502fd1f2ab85` |
| Schema Schnappschuss | `specifications/AG-VISUAL-005-schemas-v2/schnappschuss.schema.json` | agentarium.schnappschuss.v2 | 2026-10-15T19:24:00Z | `d5bcda382664adba0940ac2028b9d35ed1c5bd62` |
| Schema Archivmanifest | `specifications/AG-VISUAL-005-schemas-v2/archivmanifest.schema.json` | agentarium.archivmanifest.v2 | 2026-10-15T19:24:00Z | `98fe469ca4e83176fc2a11f6a6532b92cea5f3a0` |
| Schema Befehl | `specifications/AG-VISUAL-005-schemas-v2/befehl.schema.json` | agentarium.befehl.v2 | 2026-10-15T19:24:00Z | `79ce90a4c7b7f0e3f1cb10dfcdd602309bdcb223` |
| Prueflauf | `tests/AG-VISUAL-005-vertrag-v2-pruefen.py` | V2 | 2026-10-15T19:24:00Z | `24e6620542ad4866e71865282b1dc95e67eac18c` |
| Gegenprobe | `tests/AG-VISUAL-005-vertrag-v2-gegenprobe.py` | V2 | 2026-10-15T19:24:00Z | `0f5ea4ddccc72054d854079f98401b8dedc8d827` |
| Beispieldaten 01–09 | `fixtures/AG-VISUAL-005-beispiele-v2/` | V2 | 2026-10-15T19:24:00Z | je Datei in Vertrag V2 §11 |
| Rückmeldung an Atlas (V2) | `handoffs/AG-VISUAL-005-INTERFACE-v2-rueckmeldung-v1.md` | Version 1 | 2026-10-15T19:42:00Z | `d91d3862f325553dedca8425c4c2a7bdda415c25` |
| Korrektur V2.1 | `specifications/AG-VISUAL-005-schnittstelle-v2.1-korrektur.md` | Korrekturfassung 2.1 | 2026-10-15T20:05:00Z | `515954d3b57cd75046bc8e5e7f8563af4d0c1968` |
| Schema V2.1 (eine Datei) | `specifications/AG-VISUAL-005-schemas-v2/vertrag-v2-1.schema.json` | agentarium.vertrag.v2.1 | 2026-10-15T20:05:00Z | `26ace42824abd989ad318081efd326299ec6853a` |
| Referenz-Reducer | `tests/AG-VISUAL-005-referenz-reducer.py` | V2.1 | 2026-10-15T20:05:00Z | `03028c4882c77b30abdd164abef5490838a41f08` |
| Prueflauf V2.1 | `tests/AG-VISUAL-005-vertrag-v2-1-pruefen.py` | V2.1 | 2026-10-15T20:05:00Z | `90ae4595d28f4f33174d26053791764fbad6d1be` |
| Gegenprobe V2.1 | `tests/AG-VISUAL-005-vertrag-v2-1-gegenprobe.py` | V2.1 | 2026-10-15T20:05:00Z | `d5f75b11530fd37f3279846938c11c80f19ba69b` |
| Rückmeldung an Atlas (V2.1) | `handoffs/AG-VISUAL-005-INTERFACE-v2-1-rueckmeldung-v1.md` | Version 1 | 2026-10-15T20:05:00Z | `5550e8a55bc5268607f33eb7b363aaebfad580c4` |
| Restkorrektur V2.1.1 | `specifications/AG-VISUAL-005-schnittstelle-v2.1.1-restkorrektur.md` | Korrekturfassung 2.1.1 | 2026-10-15T21:20:00Z | `c3337913821230b38d5207053c2b7b39aafd1163` |
| Schema V2.1.1 | `specifications/AG-VISUAL-005-schemas-v2/vertrag-v2-1.schema.json` | agentarium.vertrag.v2.1 | 2026-10-15T21:20:00Z | `8486c0120942c5fe9f30153f66c6e4177dfcc016` |
| Referenz-Reducer V2.1.1 | `tests/AG-VISUAL-005-referenz-reducer.py` | Fassung 2 | 2026-10-15T21:20:00Z | `7a94f89414fd5485c390764f130357958785e609` |
| Prueflauf V2.1.1 | `tests/AG-VISUAL-005-vertrag-v2-1-pruefen.py` | V2.1.1 | 2026-10-15T21:20:00Z | `7ad58a4b7fe25e5d7354fd9cf6bd3268368c7f7f` |
| Gegenprobe V2.1.1 | `tests/AG-VISUAL-005-vertrag-v2-1-gegenprobe.py` | V2.1.1 | 2026-10-15T21:20:00Z | `ab428ff46f39fa775e7934d766965061c36c01f0` |
| Beispiel 11 Schnappschuss+Tail | `fixtures/AG-VISUAL-005-beispiele-v2-1/11-snapshot-plus-tail.json` | V2.1.1 | 2026-10-15T21:20:00Z | `0f51ac128ea3920de7cf628830cef137f9661490` |
| Rückmeldung an Atlas (V2.1.1) | `handoffs/AG-VISUAL-005-INTERFACE-v2-1-1-rueckmeldung-v1.md` | Version 1 | 2026-10-15T21:20:00Z | `580f7417512c9a191c990289d57c8104e89ff156` |
| Abschluss K1–K3 | `specifications/AG-VISUAL-005-schnittstelle-v2.1.2-abschluss-K1-K3.md` | Korrekturfassung 2.1.2 | 2026-10-16T09:40:00Z | `f845709a052ad76e68c014b9260175c0a6498575` |
| Referenz-Reducer V2.1.2 | `tests/AG-VISUAL-005-referenz-reducer.py` | Fassung 3 | 2026-10-16T09:40:00Z | `96354253d536f50329d806fa7d7b299f87fcc79a` |
| Prueflauf V2.1.2 | `tests/AG-VISUAL-005-vertrag-v2-1-pruefen.py` | V2.1.2 | 2026-10-16T09:40:00Z | `db5ceb0a0c7c70d7cb3c9cd4ba880e4fbd8c67e0` |
| Gegenprobe V2.1.2 | `tests/AG-VISUAL-005-vertrag-v2-1-gegenprobe.py` | V2.1.2 | 2026-10-16T09:40:00Z | `9ac50039b33b257f1cbee8028ec7faaa5bee535f` |
| Beispiel 12 Zustandsschutz | `fixtures/AG-VISUAL-005-beispiele-v2-1/12-zustandsschutz.json` | V2.1.2 | 2026-10-16T09:40:00Z | `258e982e32d0c30cf4d693beb4671ef3b8504033` |
| Rückmeldung an Atlas (V2.1.2) | `handoffs/AG-VISUAL-005-INTERFACE-v2-1-2-rueckmeldung-v1.md` | Version 1 | 2026-10-16T09:40:00Z | `eb9779c85b448400fddfd816dc02947e140d1cce` |
| K3-Entscheidungsvorlage an Atlas | `handoffs/AG-VISUAL-005-K3-entscheidungsvorlage-v1.md` | Version 1 | 2026-10-16T10:20:00Z | `8ed3f67d7122a184d606a0ea1f9cce6cbf2441dc` |
| Beispieldaten 01–10 (V2.1) | `fixtures/AG-VISUAL-005-beispiele-v2-1/` | V2.1 | 2026-10-15T20:05:00Z | je Datei im Korrekturpapier |

Keines dieser Dokumente hat einen Vorgänger. Alle Papiere sind Fassung 1;
das Feld ist die daraus gebaute Fassung 37.

Der Prüfauftrag zitiert die Blobs des Konzepts und der Schnittstelle. Ändert
sich eines der beiden, wird **auch der Prüfauftrag eine neue Fassung** — sonst
zeigt er auf etwas, das es nicht mehr gibt.

---

## 3. Wie eine neue Fassung entsteht

1. **Der Dateiname trägt die Nummer** (`-v1`, `-v2`). Eine Fassung wird
   **nicht** überschrieben — sie bleibt liegen, damit eine Prüfanmerkung
   nicht ins Leere greift.
2. Der Kopf der neuen Datei nennt Nummer und **Zeitstempel mit Uhrzeit**
   sowie den Vorgänger mit Pfad und Blob-Hash.
3. Dieses Register bekommt eine Zeile in Abschnitt 4, mit dem Grund der
   Änderung in einem Satz.
4. Die Tabelle in Abschnitt 2 zeigt immer nur die **jeweils neueste**
   Fassung je Dokument.

Was dabei nicht geschieht: eine Fassung erhöhen, weil ein Tippfehler
verschwunden ist. Eine Fassung bekommt eine Nummer, wenn sich eine
**Aussage** ändert.

---

## 4. Geschichte

| Zeitstempel | Dokument | Fassung | Grund |
|---|---|---|---|
| 2026-10-15T14:01:01Z | Konzept | 1 | erste Fassung. Grundsätze, Modell, Betriebsarten, Grenzen zur Prüfung durch die Gegenstelle. |
| 2026-10-15T14:01:01Z | Schnittstelle | 1 | erste Fassung. Push als SSE, Schnappschuss, Lebenszeichen, Folgenummer, Felder mit Wirkung. |
| 2026-10-15T14:01:01Z | Funktionsmatrix | 1 | Kopf nach Repository-Konvention ergänzt; Inhalt unverändert. |
| 2026-10-15T14:01:01Z | Belege | 1 | Kopf nach Repository-Konvention ergänzt; Inhalt unverändert. |
| 2026-10-15T14:12:55Z | alle vier | 1 | Zeitstempel von Tagesdatum auf ISO 8601 mit Uhrzeit umgestellt. **Peters Befund:** an einem Tag können mehrere Fassungen entstehen. Keine Nummernerhöhung, weil sich keine Aussage geändert hat — nur die Blobs, und die stehen oben neu. |
| 2026-10-15T18:47:30Z | Prüfung der Atlas-Anweisung | 1 | Atlas hat gegen `a8d483a9` geprüft und `AG-VISUAL-005-INTERFACE` V1 zurückgegeben. Prüfung dieser Anweisung: zwei Befunde, vier Vorschläge, Rücknahme von sieben erfundenen Feldnamen. |
| 2026-10-15T18:47:30Z | Nachricht an Atlas | 1 | Kopierbare Kurzfassung der Prüfung zum Weitergeben durch Peter. |
| 2026-10-15T19:24:00Z | Schnittstelle | **2** | Vertrag V2 nach Atlas' Korrekturauftrag `AG-VISUAL-005-INTERFACE-REREVIEW`. Zehn verbindliche Korrekturen umgesetzt: Katalogstrom getrennt, Projektanlage definiert, Live/Archiv aus dem Laufzustand (neun Zustände), SSE-Anmeldung ohne URL-Ticket, Keepalive und Herzschlag getrennt, `zeitachse` mit Ableitungsregel, Feldtabelle dreispaltig, `read`/`command` serverseitig, Kostenfeld sichtbar mit Statussatz. Dazu vier Schemas, neun Abnahmefälle, Prüflauf und Gegenprobe. |
| 2026-10-15T19:24:00Z | Prüflauf, Gegenprobe | V2 | Antwort auf Sentinels `FAIL_TESTABILITY_ONLY`: 38 Formprüfungen, 59 Regelprüfungen, 21 von 21 absichtlichen Verletzungen erkannt. Abhängigkeitsfrei, weil zur Laufzeit nichts von außen geholt wird. |
| 2026-10-15T19:35:00Z | Feld (gebaut) | Fassung 38 | Marke links, Lauf rechts. Peter: „Titel auf die linke Seite, Projektauswahl davon trennen und diese vermengen mit der Projektanzeige rechts oben." Rechts oben trugen vorher sechs Dinge in einem Block; jetzt links was gleich bleibt, rechts was gerade gilt, und die Projektanzeige **ist** die Auswahl. Nachgemessen auf 1194×834, 834×1194 und 1024×768, in Ruhe und beim Lesen jedes einzelnen Blocks. |
| 2026-10-15T20:05:00Z | Schnittstelle | **2.1** | Gezielte Korrektur der fünf Defektgruppen B1–B5 aus dem unabhängigen Team-Review (Argus FAIL, Sentinel FAIL). Schwerster Einzelfehler: die Grenzprüfung der Wiederaufnahme lautete `cursor >= replay_grenze` statt `cursor + 1 >= replay_grenze` und verwarf damit den Rand des Puffers. Dazu: nichtleere Status- und Prüffelder, berechnete Revisionskette, versionsgebundener Done-Nachweis, typisierter Zustand am Cursor, Referenz-Reducer statt Fixture-Vergleich, quellenerhaltender Altlog-Adapter, `catalog.changed` entfernt, **eine** Kostendefinition für Schnappschuss und Archiv. Sentinels sieben Negativproben als Pflichtfälle übernommen. V2 bleibt unverändert als Prüfnachweis. |
| 2026-10-15T20:40:00Z | Konzept | **2** | Nachgezogen auf den geprüften Schnittstellenstand. §5 „Drei Betriebsarten" entfällt vollständig: man wählt Projekt und Lauf, die Ansicht folgt dem Laufzustand, Herkunft steht unabhängig daneben, Steuerung ist ein Recht. Dazu Peters Kostenwortlaut, `block`/`unblock` statt `stop`/`resume`, die echten Feldnamen aus `observed-worklog.v1`, und §5.6 benennt, dass das gebaute Feld noch abweicht. Erfindet nichts neu; §10 listet jede Änderung. Konzept 1 bleibt liegen. |
| 2026-10-15T21:20:00Z | Schnittstelle | **2.1.1** | Restkorrekturen R1–R5 aus dem V2.1-Team-Review (Argus FAIL, Sentinel FAIL). Kern: Reducer und Done-Prüfung liefen aneinander vorbei — der Reducer schrieb Status bei jedem Ereignis mit `item_revision` und `to`, die Done-Prüfung sah nur `status_change`. Ein formal vollständiges Ereignis unbekannter Art erzeugte so Done aus nichts. Jetzt eine Vorprüfung für alle Wege, Nachweis an `(task_id, artifact_id, version, criteria_ref)`, Fortschreibung auf einem Schnappschuss mit echten Stromcursorn, `supported_actions` maschinenlesbar `[]`, und R5 nimmt meine überschießende Pflicht zu `scope`/`basis` zurück. |
| 2026-10-16T09:40:00Z | Prüfmittel | **2.1.2** | Abschlusskorrekturen K1–K3. Dreimal derselbe Fehler, in Atlas' Worten: eine Beanstandung zu erkennen ist nicht dasselbe wie eine ungültige Zustandsänderung zu verhindern. Der Reducer meldete eine kaputte Revisionskette und überschrieb den Status trotzdem; er meldete eine Sequenzlücke und setzte den Cursor trotzdem weiter; zwei freie Zeichenketten galten als Autorisierung. Jetzt: prüfen und dann atomar übernehmen, Lücke puffert und sperrt bis zur Nachlieferung, Abweichungsweg abgeschaltet. Die Gegenprobe dreht das Prüfmittel absichtlich zurück und verlangt, dass es rot wird. |
| 2026-10-16T05:08:00Z | Feld (gebaut) | Fassung 39 | Die Fassungszeile trug ein Tagesdatum statt eines Zeitstempels — derselbe Befund wie bei den Dokumenten, jetzt ISO 8601 mit Uhrzeit und Zone. Marke kleiner (11/9 statt 13/10,5) und beim Lesen nur 1,10 statt 1,28: Auf dem iPad setzt jede Berührung kurz `lesen`, also sprang die Marke bei jedem Antippen auf. Peter: „das muss nicht so überpräsent sein." Nachgemessen auf drei Größen. **Dazu der Befund, dass das Artifact seit Fassung 38 nie neu veröffentlicht war** — Repository und Artifact sind zwei Veröffentlichungen. |
| 2026-10-16T11:05:00Z | Feld (gebaut) | Fassung 40 | Eigene Aufteilung für Telefone. Über **fünfzehn** Fenstermaße gemessen statt über drei: iPad bis ultrabreit standen sauber, kaputt waren nur die Telefone. Dort nimmt der Ring jetzt die ganze Breite, die Liste rutscht über die Knöpfe und zeigt zwei Zeilen, der Stand unten rechts entfällt (er zeigte den Aufgabenzähler ohnehin zweimal). `Math.max(56, …)` ist raus — ein Mindestmaß darf nie gegen das gewinnen, was hineinpasst. Dazu eine Prüfung, die mir fehlte: ob sich **Beschriftungen gegenseitig** decken. Sie fand einen Fehler, der seit Wochen auf dem iPad hochkant stand — 10 von 14 Stichproben, immer die langen Rollenwörter. Die Schriftgröße hängt jetzt am Radius. Ergebnis: 0 von 15 Größen mit Befund, 0 von 14 Stichproben mit Überdeckung. |
| 2026-10-16T13:40:00Z | Feld (gebaut) | Fassung 41 | **Eine Zusammenfassung statt zweier fast gleicher Bloecke.** Peter: „ich wuensche mir eine zusammenfassung der informationen, welche wichtig ist um zu erkennen, wie weit das projekt gediehen ist.“ Rechts stand der Aufgabenstand zweimal — oben im Produkt, unten im Stand. Der Stand unten rechts entfaellt vollstaendig (DOM, Stylesheet, Schicht: null Vorkommen), und rechts oben steht jetzt EINE Spalte: Projekt (das Antippen oeffnet die Auswahl), Langtitel, Balken, „X von Y Aufgaben erledigt“, die Aufschluesselung offen/pruefung/blockiert/fertig als zaehlbare Striche, Ablage und Register. Das Schlussleuchten sitzt jetzt an dieser Aufschluesselung. Die Projektauswahl traegt das Format der Titelspalte (rechtsbuendig, gleiche Breite, Schreibmaschine) und schliesst sich bei der Wahl und beim Klick daneben. Auf dem Telefon zeigt die Spalte in Ruhe die drei Zeilen zur Frage „wie weit“, der Rest kommt beim Antippen — gemessen blieben dem Ring sonst 30 Pixel und neun Namen deckten sich. **Dazu zwei gemessene Fehler:** Die Knopfleiste war mit 407 Pixeln breiter als das iPhone SE (375) und schnitt „Was geschieht“ links ab; sie bricht jetzt um. Und die 52 Pixel, mit denen die Liste ueber den Knoepfen hing, waren fuer EINE Reihe gemessen — sie haengt jetzt an der zur Laufzeit gemessenen Hoehe der Leiste, nicht an einer Zahl im Stylesheet. Ergebnis: 0 von 15 Groessen mit Befund, 0 von 14 Stichproben mit Ueberdeckung, 5 von 5 Knoepfen auf jedem Mass im Bild. |
| 2026-10-15T18:47:30Z | Konzept, Schnittstelle | 1 | **Verlaufen, nicht abgelöst.** Peter: „Wir müssen das Konzept von vorne beginnen, wir haben uns schon verlaufen." Beide Fassungen bleiben liegen und sind weiter die Fassungen, auf die Atlas' Prüfung zeigt. Die Nachfolger entstehen nach `agentarium.observed-worklog.v1` und Atlas' Anweisung, nicht aus diesen Papieren heraus. |

---

## 5. Verlaufene Fassungen

Konzept 1 und Schnittstelle 1 sind **verlaufen**: Peter hat drei Befunde
gegen ihr Modell erhoben — Betriebsarten als Wahl, fehlendes Gedächtnis,
ein Strom auf eine Adresse, die es noch nicht gibt — und entschieden, das
Konzept von vorne zu beginnen.

Sie werden trotzdem **nicht gelöscht und nicht überschrieben**, und zwar aus
einem harten Grund: Atlas' Prüfung zeigt mit Blob-Hash auf genau diese
beiden Dateien. Verschwinden sie, zeigt seine Prüfung ins Leere. Eine
verlaufene Fassung ist Teil der Geschichte, kein Versehen.

Konzept 1 wartet noch auf seinen Nachfolger. Die Schnittstelle hat ihn:
Fassung 2 steht oben.

**Peters Kostenentscheidung vom 15.10.2026, 21:01:52 Europe/Berlin** gilt ab
Schnittstelle 2 und ersetzt die frühere Ausblendung: Das Kostenfeld bleibt
sichtbar und zeigt bei unvollständiger Erfassung ausschließlich „Kosten
nicht vollständig ermittelbar." — keine Beträge, keine Teilsummen, keine
Null-Ersatzwerte.

Das Vokabular der Nachfolger ist `agentarium.observed-worklog.v1`
(`governance/AG-REPORT-001-minimal-worklog-v1.md`,
`relay/events/AG-PARTITUR-001-worklog-v1.json`, beide in
`origin/feature/visual-stage-v0`) — nicht mehr die erfundenen Namen aus
Schnittstelle 1.

---

## 6. Was nicht in diesem Register steht

`specifications/AG-MOCKS-PETER-REQUIREMENTS-v1.md` ist **Peters Dokument**.
Es wird hier nicht geführt und nicht verändert. Verweise darauf gehen in
eine Richtung.
