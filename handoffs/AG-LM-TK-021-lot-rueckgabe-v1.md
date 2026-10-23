# Lots Rückgabe zu Archibalds Spezifikation V1 — AG-LM-TK-021

**Stand:** 23.10.2026 · Zweig `agent/ag-event-journal-001`, Fassung 71
**Betrifft:** Archibalds Punkt 6, letzte Zeile — *„Lot: prüfen, ob es einen
kleinsten technischen Weg für R2, R3, R5 und R6 gibt. Er sollte dabei auch den
Live-Pfad in `index.html` auf R5 prüfen."*

Keine Umsetzung, keine Freigabe, kein Merge. Was unten „entschieden" heißt,
heißt: von Peter oder Atlas entschieden, nicht von mir.

---

## 0. Zuerst das Unangenehme: R5 ist schlimmer, als Archibald es sehen konnte

Archibald hat `index.html` nicht gelesen und seinen Befund deshalb auf den
Adapter beschränkt, mit dem ausdrücklichen Zusatz, der Live-Pfad sei
ungeprüft. **Gemessen, in beiden Pfaden:**

| Pfad | Stelle | Prüft `actor ≠ halter`? |
|---|---|---|
| Wiederherstellung | `github-live.js` Z. 963 — `if ((e.kind === 'accepted' \|\| e.kind === 'aborted') && halter)` | **nein** |
| Laufender Strom | `index.html` Z. 5355 — innerhalb von `else if (E.selbstauskunft …)` | **nein** |

Die vorgelagerte Schranke prüft `reporter === actor`. Das ist eine **andere**
Schranke, und ich habe dieselben zwei schon einmal verwechselt — Atlas hat
mich am 21.10. dafür berichtigt. Sie sagt: *wer darf melden.* Sie sagt nicht:
*wer darf annehmen.*

**Die Verschärfung, die Archibald nicht sehen konnte:**

> Mein eigener Nachweis behauptet das falsche Verhalten als richtig.

Fixture **R2** in `previews/AG-EVENT-JOURNAL-001/pruefen.js`:

```js
hist({ id: 'R2:assigned',  task: 'AG-EVJ-R2', actor: 'atlas', reporter: 'atlas',
       recipient: 'forge', kind: 'assigned' }, …);
hist({ id: 'R2:accepted',  task: 'AG-EVJ-R2', actor: 'forge', reporter: 'forge',
       kind: 'accepted', title: 'R2 angenommen — erst das schließt' }, …);
```

`forge` hält R2 und nimmt R2 selbst an. Zeile 503 dazu:

```js
zeile('R2 ist zu — kein Ring', nachRestore.R2, null);
```

Das ist keine Lücke im Netz, das ist eine **Masche, die in die falsche
Richtung geknotet ist**. Eine Lücke fällt beim nächsten Fall auf; eine falsche
Behauptung verteidigt den Fehler gegen den nächsten, der ihn findet. Der
unabhängige Fall steht übrigens direkt daneben und ist richtig: R14 wird von
`atlas` angenommen, `forge` hält sie. Beide werden heute **gleich** behandelt,
und genau das ist der Fehler.

**Nebenbei veraltet:** Die Zustandstabelle über der Historie (Z. 174) sagt noch
`R2 vergeben, begonnen, geliefert -> ist zu`. R2 schließt seit Fassung 66 durch
die Annahme. Eine `console.log` zwei Zeilen weiter sagt es richtig, die Tabelle
nicht.

### Zwei Lesarten von R5, und sie sind nicht dasselbe

R5 sagt: *„zählt nicht als unabhängige Annahme und wird als Selbstannahme
kenntlich."* Daraus folgt nicht, was mit der Aufgabe passiert.

**Lesart A — sie schließt nicht.** Die Aufgabe bleibt offen, ihr Ring bleibt
stehen. Kein neues Zeichen, keine neue Farbe, keine neue Form: dieselbe
Grammatik, die eine Fremdaussage schon hat („stellt nichts weiter"). Die
Selbstannahme wird gezählt wie `fremdaussagen` und `konflikte` heute gezählt
werden.

**Lesart B — sie schließt, trägt aber einen Vermerk.** Dann braucht das Bild
ein neues Zeichen für „angenommen, aber nicht unabhängig" — und ein Zeichen im
Bild entscheidet Peter.

**Meine Empfehlung: A.** Sie ist die kleinere Änderung, sie kommt ohne neues
Zeichen aus, und sie passt zu R8 („kein Abschluss wird abgeleitet"). Dass eine
Aufgabe offen bleibt, die vorher zuging, ist eine sichtbare Folge — aber es ist
die *richtige* sichtbare Folge und keine neue Erfindung.

**Ich habe nichts geändert.** Beide Lesarten verändern, was auf dem Schirm
steht; im Zweifel gehört das Peter. Was ich geändert habe, ist nichts: der
Befund steht hier, der Nachweis behauptet weiter das Alte, und das ist
absichtlich so — ich schreibe keine Erwartung um, bevor entschieden ist, welche
richtig ist.

**Wird A entschieden**, ändert sich dreierlei, und zwar zusammen:
`github-live.js` Z. 963, `index.html` Z. 5355, und Fixture R2 im Nachweis — mit
einer Gegenprobe, die R14 (unabhängig) von R2 (selbst) unterscheidet. Ohne die
dritte Änderung fällt der Nachweis, und zwar zu Recht.

---

## 1. R2 — Elternkette und längere Zyklen

**Heute:** Abgewiesen wird nur `parent_id === task_id`. Ein Zyklus über zwei
Ebenen (A→B→A) kommt durch.

**Kleinster Weg:** Beim Zeichnen der Kette von unten nach oben laufen und die
besuchten Kennungen mitführen; trifft man eine zweimal, endet die Kette dort
mit „Zyklus". Kein neues Vertragsfeld, keine Prüfung beim Annehmen des
Ereignisses — denn beim Eintreffen des Kindes ist das Elternteil womöglich noch
nicht da (R7 verlangt ausdrücklich beide Reihenfolgen).

**Aufwand:** klein. **Berührt das Bild:** ja — „Zyklus" ist ein Wort, das jemand
liest. Das ist die kleinste mögliche Form, aber es ist eine Form.

## 2. R3 — widersprüchliche Vergabe

**Heute:** Jede neue Vergabe überschreibt Typ, Eltern und Fassung still
(`github-live.js` Z. 919–921; im Live-Pfad legt `arbeitZuweisen` entsprechend
neu auf).

**Kleinster Weg:** Beim Überschreiben vergleichen. Weicht Typ oder Eltern ab,
**nicht** überschreiben, sondern als Konflikt zählen — der Zähler `konflikte`
existiert, die Grammatik „gleiche Kennung, anderer Inhalt = Konflikt" existiert
für Ereignis-IDs schon.

**Aufwand:** klein. **Berührt das Bild:** nur die Zählzeile, die es schon gibt.
Das ist der sauberste der vier.

## 3. R6 — Wiedereröffnung

**Heute:** ein Widerspruch (Z. 895–902).

**Kleinster Weg:** Keiner, der ohne Entscheidung geht — und die Entscheidung
ist E3, nicht meine. Von den beiden Vorschlägen Archibalds ist **eine neue
Vergabe mit höherem `item_version`** technisch der kleinere Weg: kein
dreizehntes Vertragsfeld, keine neue Ereignisart, und das Feld `item_version`
liegt schon da. Eine eigene Art `reopened` wäre ehrlicher zu lesen, kostet aber
einen Vertragsschritt und damit ein neues Fähigkeitswort.

**Was dagegen spricht, und es ist ernst:** Eine „neue Episode" ist keine
Wiedereröffnung derselben Aufgabe. Wer nachsehen will, warum etwas zweimal
lief, findet zwei Einträge und keinen Bezug. Ich nenne das, statt es
wegzulassen, weil die kleinere Technik hier die schlechtere Auskunft gibt.

---

## 4. Was ich schon getan habe

**E4 ist entschieden.** Peter am 23.10., wörtlich: *„ja. lot ist ein anker
geworden. ihr habt einen funktionierenden weg zur kommunikation gefunden, lot
brauch einen platz auf der bühne mit voller funktion."*

Damit ist Archibalds **K5** erledigt: `lot` steht seit Fassung 71 in `AGENTEN`,
und weil der Adapter seine Akteursliste aus genau diesem Feld baut, nimmt er
`actor: lot` an. Geprüft als eigene Zeile, mit Gegenprobe. **Aber:** `main`
steht bei Fassung 56. Für jede veröffentlichte Fassung gilt K5 weiter.

**K1 ist berichtigt.** Der Kommentar in `github-live.js` Z. 75 ordnete die
Vertragsfelder TK-021 zu; jetzt TK-001/007/015, mit der Berichtigung als
solcher im Text.

## 5. Was ich nicht getan habe

- Kein Merge, keine Veröffentlichung.
- Keine Änderung an R2, R3, R5 oder R6 — alle vier berühren das Bild oder
  hängen an einer offenen Entscheidung.
- Kein neues Vertragsfeld.
- Keine Erwartung im Nachweis umgeschrieben, solange nicht entschieden ist,
  welche richtig ist.

## 6. Was ich brauche

| Von | Was |
|---|---|
| Atlas | R5: Lesart A oder B |
| Atlas | E3, damit R6 überhaupt einen Weg hat |
| Peter | R2: ob das Wort „Zyklus" ins Bild darf |
| Atlas | ob R3 als kleinster Schritt vorgezogen wird — er ist der einzige der vier ohne neue Form |
