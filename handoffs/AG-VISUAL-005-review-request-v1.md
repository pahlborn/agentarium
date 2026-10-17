# AG-VISUAL-005 – Prüfauftrag an die Gegenstelle

AG-VISUAL-005-REVIEW, Auftragsversion 1 · 2026-10-15T14:12:55Z
Projekt: pahlborn/agentarium · Branch: claude/agentarium-visualisierung
Status: REVIEW_REQUESTED. Keine Implementierungsfreigabe, kein Merge-Auftrag.
Maschinenlesbar daneben: `handoffs/AG-VISUAL-005-review-request-v1.json`

**Alles unterhalb der Linie ist zum Kopieren und Weitergeben.**

---

## Prüfauftrag AG-VISUAL-005: Konzept und Schnittstelle des Agentariums

Ihr prüft zwei Papiere. Ihr baut nichts, ihr merged nichts, ihr ändert keine
Datei im Repository. Das Ergebnis ist eine Rückmeldung.

### Was zu prüfen ist

| | Pfad | Blob |
|---|---|---|
| **Konzept** | `concepts/AG-VISUAL-005-agentarium-konzept-v1.md` | `d07fccdc18432b10fa2fbb904409f9d945ae7ff3` |
| **Schnittstelle** | `specifications/AG-VISUAL-005-schnittstelle-v1.md` | `e2eacd2fefd977cbe1637a1bf7123fb77e8556db` |

Zum Nachlesen, nicht zum Prüfen:
`previews/AG-VISUAL-005-funktionsmatrix-v1.md` (`261c4658fc252c8727c1db120cdac806be3c204b`),
`previews/AG-VISUAL-005-evidence-v1.md` (`aaf733814df1a1c07fd0687fd1434db7d82e6244`),
`previews/AG-VISUAL-005-feld-v1.html` (`eb535284d226ee6d84467e1c44ec1ef981f2fb0d`, das lauffähige Feld, Fassung 37),
`previews/AG-VISUAL-005-fassungen.md` (Fassungsregister).

**Prüft gegen den Blob, nicht gegen den Branch.** Der Branch wird
weiterbewegt; der Blob ist die Fassung, auf die eine Anmerkung zeigt.
Nachzusehen mit `git hash-object <pfad>` — stimmt der Hash nicht, habt ihr
eine andere Fassung vor euch, und die Anmerkung geht ins Leere.

### Was das ist

Agentarium ist ein Fenster auf die Kommunikation eines Teams aus Menschen
und LLM-Agenten. Es zeigt Bewegung, nicht Inhalt: wer wem was zuwirft, wer
wartet, wer blockiert ist, was liegen bleibt und was vergeht. BALL —
Bio-Agent & LLM Logistics — ist die Orchestrierung dahinter.

Das Konzept beschreibt das Modell. Die Schnittstelle beschreibt, was eine
Gegenstelle liefern muss, damit das Feld aus einem laufenden Projekt
gespeist werden kann.

### Was ihr NICHT tut

- **Nicht implementieren.** Kein Code, kein Server, kein Endpunkt.
- **Nicht mergen und nicht veröffentlichen.** Beides nur durch Peter.
- **Keine Datei im Repository ändern.** Auch nicht die geprüften Papiere.
  Besonders nicht `specifications/AG-MOCKS-PETER-REQUIREMENTS-v1.md` — das
  ist Peters Dokument.
- **Nichts bestätigen, was ihr nicht nachgesehen habt.** Ein Rollenname ist
  kein Beweis einer geladenen Instanz. Wer einen Befund meldet, nennt die
  Stelle, an der er steht.

### Worauf es ankommt

Vier Punkte sind die Gründe für diesen Auftrag. Alles andere ist Beifang.

**1. Das Lebenszeichen (Schnittstelle §6).**
Die Gegenstelle soll alle fünf Sekunden ein leeres Signal senden, auch wenn
nichts geschieht. Ohne das lässt sich *„das Projekt ruht"* nicht von *„die
Verbindung ist tot"* unterscheiden — beides sieht identisch aus. Dies ist
die einzige Stelle des Entwurfs, an der eine Lücke die Darstellung nicht
nur ärmer macht, sondern **irreführend**.
→ Ist ein Takt von fünf Sekunden bei euch machbar? Wenn nein: welcher ist es?

**2. Push und Schnappschuss (Schnittstelle §1–2, §5).**
Eine Browserseite hat keine Adresse, kann also nicht angestoßen werden; sie
muss die Verbindung selbst öffnen. Vorgeschlagen ist SSE statt WebSocket,
weil das Wiederaufnehmen nach einem Abriss (`Last-Event-ID`) eingebaut ist
und das Feld keinen Rückkanal braucht. Dazu ein Schnappschuss beim
Verbinden, weil Push allein den Monitor leer lässt: Wer um 14 Uhr aufmacht,
was um 9 Uhr begann, sieht sonst „0 von 0".
→ Haltet ihr SSE für richtig, und ist ein Schnappschuss in dieser Form
lieferbar?

**3. Die Bezugsfelder (Schnittstelle §4.4).**
Benannt sind `aufgabe`, `erledigt`, `artefakt`, `version`, `prueft`,
`antwortet_auf`, `ersetzt`. **Diese Namen sind von uns erfunden.** Das
Partitur-Arbeitsprotokoll führt bereits Ereignis-IDs und Verweise auf
auslösende Ereignisse.
→ Wie heißen diese Felder bei euch? Wir ziehen unsere Namen nach, bevor sie
sich festsetzen. Das ist ausdrücklich eine Frage, keine Festlegung.

Zur Begründung, warum sie überhaupt da sind: Ohne diese Bezüge waren an
zwei durchgespielten Stücken **33 % bzw. 60 %** aller Zuordnungen
mehrdeutig, bei der Frage „welches Ergebnis nimmt dieses Review ab" zu
hundert Prozent. Die Darstellung musste raten. Mit den Bezügen: keine
einzige Faustregel mehr nötig.

**4. Die Folgenummer (Schnittstelle §7).**
`folge` soll je Projekt lückenlos aufsteigen. Daran erkennt das Feld
Lücken, Doppelte und Nachzügler, ohne Absprache. Dafür braucht die
Gegenstelle einen Ringpuffer der letzten Ereignisse (Vorschlag: 500 oder
eine Stunde), damit ein kurzer Abriss nachgeliefert werden kann; bei
größerem Rückstand antwortet sie mit einem neuen Schnappschuss.
→ Ist eine lückenlose Folgenummer je Projekt bei euch herstellbar, und ist
der Ringpuffer zumutbar?

### Dazu vier Fragen zum Konzept

5. Welcher der fünf Grundsätze (Konzept §3) ist der schwächste, und warum?
6. **Der ehrliche Nenner** (Konzept §4.4): Der Fortschritt zählt eröffnete
   gegen abgeschlossene Aufgaben statt einen Prozentwert zu behaupten. Preis
   davon: Die Leiste kann **zurückgehen**, wenn neue Aufträge aufgehen. Ist
   das im Betrieb zumutbar oder unbrauchbar? Dies ist die wichtigste der
   nichttechnischen Fragen.
7. Fehlt ein sechster Stop-Grund (Konzept §4.3)? Heute: `technisch`,
   `budget`, `abhaengigkeit`, `freigabe`, `mensch`.
8. **Kosten:** Zu welchem Zeitpunkt steht der Verbrauch eines Auftrags bei
   euch fest — bei der Lieferung, oder erst über eine Abrechnung? Davon
   hängt ab, ob das Feld Kosten überhaupt einem Auftrag zuordnen kann oder
   nur Summen je Rolle zeigt. Dabei gilt unverändert AG-COST-UI-001 und
   K07: fehlende Werte sind **nicht** null, bei Lücken **keine**
   Gesamtsumme, Abonnementnutzung ist **kein** Nullverbrauch — und die
   Anzeige verschwindet trotzdem nicht, weil ein leeres Feld wie ein Fehler
   aussieht.
9. **Mehrere Projekte:** ein Strom je Projekt, oder einer für alle mit
   `projekt` als Unterscheidung?

### Was uns am meisten nützt

Nicht die Zustimmung. **Die Stelle, an der dieser Entwurf im Betrieb
scheitern wird.** Wenn ihr eine findet, ist das die wertvollste Zeile eurer
Rückmeldung. Wenn ihr keine findet, sagt auch das — aber sagt, wonach ihr
gesucht habt.

### Wie die Antwort aussehen soll

Pro Befund eine Zeile, in dieser Form:

```
[BEFUND-01] schnittstelle §6 · blob e2eacd2f · <schwere: blocker|wichtig|anmerkung>
Befund:    <was nicht stimmt, in einem Satz>
Belegt an: <Abschnitt, Feldname oder Zitat>
Vorschlag: <was stattdessen, oder "offen">
```

Dazu am Ende:

```
Geprüft:        <welche Blobs, mit Hash>
Nachgesehen:    <was ihr tatsächlich geöffnet/ausgeführt habt>
Nicht geprüft:  <was ihr ausgelassen habt, und warum>
Antworten:      <1–9, je ein Satz>
```

Der Abschnitt „Nicht geprüft" ist kein Eingeständnis, sondern Teil des
Ergebnisses. Eine Prüfung, die ihre Lücken nicht nennt, ist nicht
nachvollziehbar.

### Umfang

Vier Papiere, davon zwei zu prüfen. Rechnet mit einer Rückmeldung von
ein bis zwei Seiten. Keine Zeremonie, kein Epic, keine Teststrategie —
wir wollen wissen, ob das Modell trägt und ob die Felder lieferbar sind.
