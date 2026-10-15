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
| Schnittstelle | `specifications/AG-VISUAL-005-schnittstelle-v1.md` | Schnittstellenversion 1 | 2026-10-15T14:12:55Z | `e2eacd2fefd977cbe1637a1bf7123fb77e8556db` |
| Funktionsmatrix | `previews/AG-VISUAL-005-funktionsmatrix-v1.md` | Matrixversion 1 | 2026-10-15T14:12:55Z | `261c4658fc252c8727c1db120cdac806be3c204b` |
| Belege | `previews/AG-VISUAL-005-evidence-v1.md` | Belegversion 1 | 2026-10-15T14:12:55Z | `aaf733814df1a1c07fd0687fd1434db7d82e6244` |
| Feld (gebaut) | `previews/AG-VISUAL-005-feld-v1.html` | Fassung 38 | 2026-10-15T19:35:00Z | `f3e01ffa32081a378422e6ace6b637133f72c401` |
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
| Rückmeldung an Atlas (V2) | `handoffs/AG-VISUAL-005-INTERFACE-v2-rueckmeldung-v1.md` | Version 1 | 2026-10-15T19:31:00Z | `d94f521fbb605ff1071fe580e176e28e3589e0c8` |

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
