# AGENTARIUM – Fassungsregister AG-VISUAL-005

Lebendes Dokument, **ohne** Versionsnummer im Namen: Es beschreibt die
Fassungen, es ist keine.
Projekt: pahlborn/agentarium · Branch: claude/agentarium-visualisierung
Stand: 2026-10-15

---

## 1. Warum Blob-Hashes und nicht nur Nummern

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

| Dokument | Pfad | Fassung | Blob |
|---|---|---|---|
| Konzept | `concepts/AG-VISUAL-005-agentarium-konzept-v1.md` | Konzeptversion 1 | `0c341ca194ae16f6396212be34811ce970a630dc` |
| Schnittstelle | `specifications/AG-VISUAL-005-schnittstelle-v1.md` | Schnittstellenversion 1 | `94bf0909040f2d2ee9d551795ec88cef38cf945f` |
| Funktionsmatrix | `previews/AG-VISUAL-005-funktionsmatrix-v1.md` | Matrixversion 1 | `e71ccc055245bce3e8db0b37306d797f6de06ec2` |
| Belege | `previews/AG-VISUAL-005-evidence-v1.md` | Belegversion 1 | `ad2df65e50a1462d24c92d2c164d662cbe556ec0` |
| Feld (gebaut) | `previews/AG-VISUAL-005-feld-v1.html` | Fassung 37 | `eb535284d226ee6d84467e1c44ec1ef981f2fb0d` |

Keines dieser Dokumente hat einen Vorgänger. Alle fünf sind Fassung 1 bzw.
die daraus gebaute Fassung 37 des Feldes.

---

## 3. Wie eine neue Fassung entsteht

1. **Der Dateiname trägt die Nummer** (`-v1`, `-v2`). Eine Fassung wird
   **nicht** überschrieben — sie bleibt liegen, damit eine Prüfanmerkung
   nicht ins Leere greift.
2. Der Kopf der neuen Datei nennt den Vorgänger **mit Pfad und Blob-Hash**.
3. Dieses Register bekommt eine Zeile in Abschnitt 4, mit dem Grund der
   Änderung in einem Satz.
4. Die Tabelle in Abschnitt 2 zeigt immer nur die **jeweils neueste**
   Fassung je Dokument.

Was dabei nicht geschieht: eine Fassung erhöhen, weil ein Tippfehler
verschwunden ist. Eine Fassung bekommt eine Nummer, wenn sich eine
**Aussage** ändert.

---

## 4. Geschichte

| Datum | Dokument | Fassung | Grund |
|---|---|---|---|
| 2026-10-15 | Konzept | 1 | erste Fassung. Grundsätze, Modell, Betriebsarten, Grenzen zur Prüfung durch die Gegenstelle. |
| 2026-10-15 | Schnittstelle | 1 | erste Fassung. Push als SSE, Schnappschuss, Lebenszeichen, Folgenummer, Felder mit Wirkung. |
| 2026-10-15 | Funktionsmatrix | 1 | Kopf nach Repository-Konvention ergänzt; Inhalt unverändert. |
| 2026-10-15 | Belege | 1 | Kopf nach Repository-Konvention ergänzt; Inhalt unverändert. |

---

## 5. Was nicht in diesem Register steht

`specifications/AG-MOCKS-PETER-REQUIREMENTS-v1.md` ist **Peters Dokument**.
Es wird hier nicht geführt und nicht verändert. Verweise darauf gehen in
eine Richtung.
