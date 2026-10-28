# AG-MON-ARCHIV-002 — Archivpflege, Kapazität, Aufräumen und Timeline

Konzept für Lot (Monitor). Stand 28.10.2026, Peters Entscheidungen eingearbeitet.

Herkunft: Peter, 28.10., aus dem Konzept „Projekte, Läufe und Archiv" (Punkte L4 Grenzen und L8 Aufräumen):
- *„Wichtig ist, dass wir nicht an irgendwelche Grenzen kommen: Speicherplatz und evtl. andere Themen."*
- *„Startzeitpunkt kann der geneigte Zuseher eh nicht fassen, es sei denn, es gibt eine Timeline, welche eine Art Aktivitätsübersicht darstellt, zu der dann bei Bedarf gescrollt werden kann."*
- *„Zusätzlich brauchen wir einen Hinweis, wenn der Platz eng wird, und ein Angebot zum Löschen alter Archive."*

Bezug zu Peters früheren Entscheidungen (25.10.): Jedes Projekt hat eine Projektdoku, die im Monitor als **Archiv abspielbar** ist. Alle Läufe aller Projekte melden an **einem zentralen Ort** (Issue #2). Der Monitor dient auch der **Kontrolle**: Unerledigtes wird nie automatisch ausgeblendet.

## Problemstellung

| | |
|---|---|
| **Problem (mit Beleg)** | Alle Meldungen aller Projekte liegen als Kommentare auf **Issue #2**. Am 28.10.: **413 Kommentare** seit dem 13.10., also rund **28 pro Tag**. Der Monitor liest beim Verbinden **alle** Seiten und merkt sich höchstens **5.000** Meldungen (`MAX_IDS` in `pilot/github-live/github-live.js`), er liest höchstens **10.000** (`MAX_SEITEN` = 100 × 100). Das Archiv spielt immer das ganze Projekt ab: heute 219 Meldungen und 19 Läufe, **7,6 min** bei 1×, 46 s bei 10×. |
| **Ziel** | Der Monitor bleibt dauerhaft schnell und vollständig. Abgeschlossene Läufe bleiben als Projektdoku erhalten und abspielbar. Peter sieht rechtzeitig, wenn es eng wird, und kann Altes mit einer Handlung aufräumen. Im Archiv findet er die Stelle, die ihn interessiert, über eine Aktivitätsleiste. |
| **Erfolgskriterium** | (1) Issue #2 kommt nicht unbemerkt an die Grenze von 5.000 Meldungen; (2) Verbinden dauert am iPad unter 5 s; (3) Hinweise erscheinen bei 70 % und 90 % der Grenze; (4) kein abgeschlossener Lauf geht beim Aufräumen verloren, es sei denn, Peter löscht ihn ausdrücklich; (5) Unerledigtes (offene Bälle, nie zurückgemeldete Teilbälle) wird nie ausgelagert oder gelöscht. |
| **Folge des Nichtstuns** | Bei gleichem Tempo erreicht #2 in **5–6 Monaten** die eigene Grenze des Monitors von 5.000 Meldungen. Danach vergisst der Monitor die ältesten Meldungen still (Doppelprüfung, Wiederherstellung). Schon vorher wird das Verbinden spürbar langsamer, weil jedes Mal alles gelesen wird. |

## Was feststeht (Fakten, 28.10.)

| Mögliche Grenze | Stand |
|---|---|
| Speicherplatz am Gerät | Der Monitor speichert nur Einstellungen. Kein Thema. |
| GitHub-Abruflimit | 5.000 Anfragen/Stunde; ein Abruf mit `304 Not Modified` zählt laut GitHub-Doku **nicht** mit (docs.github.com, „Best practices for using the REST API" → „Use conditional requests"). Kein Thema. |
| Kommentare pro Issue (GitHub) | Eine offizielle Obergrenze ließ sich **nicht belegen**. Offen. |
| Eigene Grenzen des Monitors | 5.000 Meldungen im Gedächtnis, 10.000 lesbar. **Die eigentliche Grenze.** |

## Grundsatz

**Auslagern statt löschen. Unerledigtes bleibt immer.** Was nicht abgeschlossen ist, wird weder ausgelagert noch gelöscht.

**Kein Zwischenspeicher im Browser** (Peter, 28.10., nach Atlas' Befund W3): Der Monitor speichert weiterhin nur Einstellungen. Archivdateien und #2 werden beim Verbinden gelesen, nicht dauerhaft auf dem Gerät abgelegt.

**Der Monitor bleibt eine reine Anzeige.** Er bekommt kein Schreibrecht (Peter, 28.10.). Wo Peter etwas auslöst, öffnet der Monitor einen vorbereiteten Auftrag; ausgeführt wird er von Atlas' Team. Das Auslagerungswerkzeug liegt außerhalb des Monitors und gehört damit zu Forge (`AGENTS.md`: Lot baut nur den Monitor).

## Teil A — Auslagern abgeschlossener Läufe

- **Was:** Alle Meldungen eines **abgeschlossenen** Laufs. Abgeschlossen heißt: Peters Annahme ist gemeldet (`accepted`, `actor: peter`, `reporter: atlas`) **und** kein Teilball des Laufs liegt mehr.
- **Wann:** **nur auf Peters Auslösung** (Teil C), ohne Frist. **Nichts geschieht automatisch** — auch nicht, wenn der Platz eng wird; dann erscheint nur der Hinweis (Teil B). Peter, 28.10.: *„Ich weiß nicht, was in 14 Tagen passiert, vielleicht bin ich ja im Urlaub."* Ausgelagert werden dann **alle** abgeschlossenen Läufe des Projekts.
- **Wohin:** in eine Archivdatei je Projekt und Monat im Repo, z. B. `projekte/<id>/archiv/<JJJJ-MM>.jsonl`. Eine Zeile je Meldung, unverändert, dazu Kommentarnummer und `created_at` als Beleg.
- **Wie:** ein Werkzeug (GitHub-Action, manuell gestartet), das (1) die Meldungen kopiert, (2) nachprüft, dass sie vollständig und unverändert in der **veröffentlichten** Archivdatei stehen, (3) erst danach die Kommentare auf #2 löscht.
- **Bei Abbruch geht nichts verloren** (berichtigt 28.10. nach Atlas' Befund W2, AG-MON-LAST-001): Gelöscht wird nur, was nachweislich schon im veröffentlichten Archiv steht. Bricht das Werkzeug mitten im Löschen ab, steht jede Meldung an mindestens einer Stelle — im Archiv, auf #2 oder an beiden. Der Monitor führt beide Quellen ohne Doppelung zusammen (Beleg: Kommentarnummer). Ein neuer Lauf des Werkzeugs setzt dort fort.
- **Wer:** Peter löst aus (Teil C). Atlas beauftragt die Ausführung; das Werkzeug baut und pflegt Forge.
- **Monitor:** liest beim Verbinden die Archivdateien des gewählten Projekts von der eigenen Pages-Adresse (wie `projekte/verzeichnis.json`, ohne Token) und **zusätzlich** #2. Live liest er nur #2; das Archiv spielt beides.
- **Sichtbarkeit:** Archivdateien liegen im Repo und damit auf GitHub Pages; sie sind so öffentlich wie die Kommentare auf #2 heute. **Peter, 28.10.: in Ordnung.**

## Teil B — Hinweis, wenn der Platz eng wird

- **Maß:** Zahl der Kommentare auf #2 im Verhältnis zur Grenze des Monitors (5.000).
- **Stufen** (Peter, 28.10.): ab **70 %** (3.500) ein ruhiger Hinweis, ab **90 %** (4.500) ein deutlicher. Darunter nichts.
- **Wo:** im Blatt oben rechts (Projektwahl) und in der GitHub-Tafel, z. B. „Meldungen: 3.620 von 5.000 — Aufräumen empfohlen". Kein Dauerblinken im Feld.
- **Dazu:** die Verbindungsdauer messen und ab 5 s ebenfalls hinweisen.

## Teil C — Angebot zum Aufräumen und Löschen

Ein Menü **„Aufräumen …"** im Blatt oben rechts (je Projekt), nur bei echten Projekten:

| Wahl | Wirkung | Rückgängig? |
|---|---|---|
| **Abgeschlossene Läufe auslagern** (empfohlen) | Teil A für dieses Projekt | ja, die Archivdatei bleibt |
| **Archiv bis Datum … löschen** | löscht Archivdateien bis zum gewählten Monat | **nein** im Monitor; in der Git-Historie bleibt es, bis jemand sie umschreibt |
| **Abbrechen** | nichts | — |

- Der Monitor zeigt vorher genau, **was** betroffen ist (Projekt, Zeitraum, Zahl der Läufe und Meldungen) und dass Unerledigtes ausgenommen ist.
- Nach Bestätigung öffnet er einen **vorbereiteten Auftrag** in GitHub (neues Issue mit fertigem Text) in Peters eigenem Konto. Atlas nimmt ihn auf. Der Monitor selbst schreibt nichts.
- Löschen verlangt eine zweite, ausdrückliche Bestätigung.

## Teil D — Timeline (Aktivitätsleiste) im Archiv

- Eine schmale Leiste am unteren Rand, nur im Archiv: je Tag ein Balken, so hoch wie die Zahl der Meldungen an dem Tag; Läufe farblich nach Projekt in „Alle Projekte".
- Eine Marke zeigt, wo das Abspielen gerade steht.
- **Antippen/Ziehen springt** an diese Stelle: Der Monitor berechnet den Stand zu diesem Zeitpunkt (liegende Bälle, offene Aufgaben), genau wie beim Verbinden (`faltenZuZustand`, `baelleFalten`), und spielt von dort weiter. Tempo, Halt und Von vorn bleiben.
- Antippen eines Tages zeigt kurz Datum und die Läufe des Tages (Bezeichnung aus dem Anstoß).

## Reihenfolge

1. **Teil B — Hinweis** (klein, nur Monitor): sofort nützlich, schützt vor Überraschungen.
2. **Teil A — Auslagern** (Werkzeug + Monitor liest Archivdateien): löst die Grenze dauerhaft.
3. **Teil C — Aufräumen-Menü** (Monitor, auf Teil A aufbauend).
4. **Teil D — Timeline** (Monitor).

## Peters Entscheidungen (28.10.)

1. Der Monitor bekommt **kein Schreibrecht**; aufgeräumt wird über einen vorbereiteten GitHub-Auftrag.
2. **Keine Frist, nichts automatisch.** Nur auf Peters Auslösung; dann alle abgeschlossenen Läufe; Offenes bleibt auf #2.
3. Archivdateien dürfen **öffentlich** auf GitHub Pages liegen.
4. Hinweise bei **70 % und 90 %** (3.500 bzw. 4.500 Meldungen auf #2).
5. **Kein Zwischenspeicher im Browser**; bei Abbruch des Auslagerns **geht nichts verloren** (statt „alles bleibt auf #2"). Beides nach Atlas' Abgleich AG-MON-LAST-001 (W2, W3).

## Abnahme

Nachweise wie bisher (`previews/…/pruefen.js`) je Teil, dazu am iPad mit Peter:
- B: Bei 3.500 Probekommentaren erscheint der ruhige Hinweis, bei 4.500 der deutliche; bei 3.499 keiner.
- A: Nach dem Auslagern zeigt das Archiv dieselben Läufe in derselben Reihenfolge wie vorher; Live und liegende Bälle sind unverändert; Unerledigtes ist nicht ausgelagert. Abbruch mitten im Löschen: keine Meldung fehlt, keine ist doppelt.
- Ergänzende Prüffragen für Teil A: `handoffs/AG-MON-LAST-001-pruefliste-v1.md` (Atlas, 28.10.).
- C: Der vorbereitete Auftrag nennt genau Projekt, Zeitraum und Zahlen; Löschen verlangt zwei Bestätigungen; der Monitor sendet nichts selbst.
- D: Antippen eines Tages springt dorthin; der Stand entspricht dem beim Verbinden zu diesem Zeitpunkt.
