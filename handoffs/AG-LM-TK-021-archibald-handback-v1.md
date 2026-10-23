SA_READY — AG-LM-TK-021 · Spezifikation V1 · Archibald/spec-agent → Atlas

**Kurzfassung:** Die Hierarchie ist im Adapter grundsätzlich schon vorhanden. Es fehlen vor allem der Abschluss nach oben (TK-023), eine echte Unabhängigkeitsprüfung bei der Annahme und ein Weg zum Wiedereröffnen. Vier offene Entscheidungen blockieren noch Teile von TK-023, nicht aber diese Rückgabe.

**Grenzen dieses Laufs:**
- **Stand:** Ich habe den Arbeitsstand unter `relay-prepared/workspace` gelesen. Dass er dem Commit `8cd1f16c…` entspricht, kann ich nicht prüfen, weil ich keine Shell habe.
- **Gelesen:** Auftrag v1, Arbeitsregister V1–V1.5, Forge-Auftrag, Hierarchie-Notiz, TK-022-Quellenklärung, Process 1.3, Rulebook 1.3 und `github-live.js` vollständig (1163 Zeilen).
- **Nicht gelesen:**
  - `pilot/github-live/index.html`: Live-Faltung, `arbeitZuweisen` und Darstellung. Aussagen zum Live-Pfad stützen sich auf Lots Notiz, nicht auf den Code.
  - `AGENTS.md` und `CLAUDE.md`.
  - Die Kommentare in PR 46 (`source_refs`): Ich hatte in diesem Lauf kein GitHub-Werkzeug.
- **Schablone:** `.claude/agent-protocol/spec-agent-output.md` fehlt. Ich verwende nur die passenden Abschnitte.
- **Rollen:** Die Testfälle bleiben Atlas-Entwürfe, Sentinels Testplanung steht aus. Das hier ist keine Annahme, kein Testlauf und keine Freigabe.

## 1. Was schon geliefert ist (wird nicht neu spezifiziert, nur geprüft)
- **Optionale Felder:** `item_type` (nur `epic`, `story` oder `task`, sonst Abweisung; ohne Angabe gilt `task`), `parent_id` und `item_version`. Ein Element mit sich selbst als Eltern wird abgewiesen (`github-live.js` Z. 87–92, 537–558).
- **Herkunft der Angaben:** Typ, Eltern und Fassung werden aus der Vergabe übernommen, sowohl beim Wiederherstellen (Z. 915–921) als auch laut Notiz im Live-Pfad.
- **Keine erfundenen Kinder:** Eine vergebene Epic erzeugt genau einen Eintrag, daraus werden keine Kinder abgeleitet (Notiz, Nachweis N/N2/A8).
- **Kette und Abschluss:** `accepted` oder `aborted` schließen ein Element, `delivered` schließt nicht (Z. 963–970). Blockaden werden genau über ihre Kennung (`blocker_id`) gesetzt und aufgelöst (Z. 947–962). Meldungen über eine andere Rolle (Fremdaussagen) ändern keinen Zustand (Z. 924).
- **Noch nicht vorhanden:** Abschluss nach oben (TK-023) und Wiedereröffnung. Beim Wiederherstellen zählt ein späteres Ereignis nach dem Schließen nur als Widerspruch (Z. 895–902).

## 2. Korrekturen am Register (alle IDs bleiben)
| # | Befund (Beleg) | Vorgeschlagene Korrektur |
|---|---|---|
| K1 | Der Code-Kommentar in Z. 75 ordnet die Vertragsfelder TK-021 zu. Die Hierarchie-Notiz hat das bereits berichtigt: Sie gehören zu TK-001/007/015. | Kommentar ändern auf „TK-001/007/015“ (Lot). |
| K2 | TK-008 nennt nur TC-004. TC-010 und TC-011 gehören zwar zu US-004, haben aber keinen Nachweistask. TK-023 hat keinen eigenen. | TK-008 auf TC-004, TC-010, TC-011 und TC-012 erweitern, ohne neue ID. Alternative entscheidet Atlas. |
| K3 | US-001 steht im Kopf noch auf V1, die Nachträge nennen V2 und V3. TC-001 V1 bezieht sich auf V1. Für TC-013 und TC-014 gibt es keinen Nachweistask, TK-002 nennt nur TC-001. | US-001-Kopf auf V3 setzen. Ausdrücklich festhalten, ob TC-001 V1 für V3 noch gilt (Regel aus TC-012). TC-013/014 einem Nachweistask zuordnen: TK-002 erweitern oder eine neue ID. |
| K4 | TC-010 und TC-011 prüfen laut Register „Hierarchietasks“, ohne sie zu nennen. | TC-010 → TK-007 und TK-001 (Anzeige), TK-015 (Wiederherstellung), TK-008. TC-011 → TK-023, TK-008. |
| K5 | Alle Umsetzungstasks gehören Lot, aber `lot` ist kein bekannter Akteur. `assigned` an `lot` wird deshalb abgewiesen (Z. 559–561, TK-022-Notiz). | Als Einschränkung für TC-010 („richtiger Empfänger“) führen. Lot ins Bild aufzunehmen entscheidet Peter (E4). |
| K6 | TK-022 hängt unter US-001, betrifft aber auch Beginn und Lieferung (US-002) sowie Annahme (US-006). | Nicht umhängen. Als Abhängigkeit von TC-001, TC-002 und TC-006 eintragen. |

## 3. Anforderungen (R) für TK-001/007/015 (Rest) und TK-023
- **R1 Identität:** Ein Element ist eindeutig durch `project_id`, `run_id` und `task_id`. *Annahme A1:* Das Elternelement liegt im selben Projekt und Lauf. Lässt es sich nicht auflösen, zeigt der Monitor „Eltern unbekannt“ und erfindet keine Zuordnung.
- **R2 Elternkette:** Die Details zeigen die Kette bis zur Wurzel. Längere Zyklen (A→B→A) werden als Konflikt sichtbar und enden nicht in einer Schleife. Das ist eine Lücke: Heute wird nur der Fall „eigenes Elternteil“ abgewiesen.
- **R3 Widersprüchliche Vergabe:** Eine weitere Vergabe desselben offenen Elements mit anderem Typ oder anderen Eltern wird als Konflikt gezeigt und überschreibt nicht still. Heute überschreibt jede neue Vergabe (Z. 919–921).
- **R4 Abschluss nach oben (TK-023):** Der Elternstatus wird abgeleitet und erscheint getrennt als *offen*, *blockiert durch Kind (Kind-ID und Grund)* oder *done*.
  - *done* setzt voraus: Das Element ist selbst angenommen (`accepted`), alle erforderlichen Kinder sind angenommen, ihre Vollständigkeit ist belegt (E1) und die Testbedingung ist erfüllt (E2).
  - `aborted`, ein offenes Kind, ein unbekanntes Kind oder eine Leseabdeckung `unavailable` verhindern *done*.
  - Wird ein Elternteil angenommen, obwohl ein bekanntes Kind offen ist, zeigt der Monitor „Annahme verdeckt offenes Kind“ statt *done*.
- **R5 Unabhängige Annahme:** Meldet der Halter selbst `accepted` oder `reviewed` für seine eigene Aufgabe, zählt das nicht als unabhängige Annahme und wird als Selbstannahme kenntlich. *Neuer Befund:* Beim Wiederherstellen (Z. 963) fehlt die Prüfung, dass Akteur und Halter verschieden sind. Für den Live-Pfad ist das ungeprüft.
- **R6 Wiedereröffnung:** Wird ein erforderliches Kind wiedereröffnet, verliert das betroffene Elternteil seinen *done*-Status und zeigt den Grund. Wie das technisch geht, entscheidet Lot (E3). Heute ist es ein Widerspruch.
- **R7 Gleichheit:** Live, Wiederherstellung und Archiv ergeben dieselbe Hierarchie- und Abschlusslage, unabhängig von der Eingangsreihenfolge (Kind vor Eltern oder umgekehrt).
- **R8 Ausgeschlossen:** Merge und Veröffentlichung bleiben getrennte Ereignisse für ein Artefakt. Kein Abschluss wird aus `delivered`, `handoff`/`contribution`, Fremdaussagen, Rolle oder Empfänger abgeleitet.

## 4. Abnahmekriterien für Sentinels Testplanung (Entwürfe, nicht ausgeführt)
| AC | Kriterium | Beleg/Testfall |
|---|---|---|
| AC-01 | Je eine Vergabe von Epic, Story und Task ergibt genau einen Eintrag mit richtigem Typ, Fassung, Eltern und Empfänger. Keine Kinder entstehen oder gelten als begonnen. | TC-010 |
| AC-02 | Eltern unbekannt bzw. ein Zyklus über zwei Ebenen: wird sichtbar markiert, nichts wird erfunden, keine Schleife. | TC-010 (neu ergänzen) |
| AC-03 | Ein erforderlicher Task ist offen oder nur geliefert, oder sein Pflichttest steht auf FAIL, BLOCKED oder NOT_RUN: Story und Epic sind nicht *done*. | TC-011 |
| AC-04 | Ein Elternteil wird angenommen, während ein Kind offen ist: Der Monitor zeigt den Konflikt, nicht *done*. | TC-011 |
| AC-05 | Alle Pflichtkinder sind unabhängig angenommen und die Bedingungen aus E1/E2 erfüllt: erst jetzt *done*. Wird danach ein Kind wiedereröffnet, ist der Elternabschluss wieder offen. | TC-011 |
| AC-06 | Der Halter nimmt seine eigene Aufgabe an: kein Abschluss, Selbstannahme kenntlich. | TC-006 / TC-011 |
| AC-07 | Gleiche Lage live, nach Neuverbindung und im Archiv, auch wenn das Kind vor den Eltern eintrifft. | TC-008 / TC-009 |
| AC-08 | Ein PASS an einer alten Fassung oder in einer anderen Umgebung gilt nicht für eine geänderte Fassung. | TC-012 |
| AC-09 | Doppelt gemeldetes Ereignis ohne Wirkung. Gleiche Ereignis-ID mit anderem Inhalt ist ein Konflikt, und keine Elternlage ändert sich. | TC-010 |

Umgebung: echter Browser. Fixtures belegen nur die Adapter-Ebene. Ein echter Kanal ist erst prüfbar, wenn E5 entschieden ist.

## 5. Offene Entscheidungen (blockieren Teile von TK-023, nicht diese Rückgabe)
- **E1 Welche Kinder sind erforderlich?** Der Monitor kennt nur gemeldete Kinder.
  - **Empfehlung (kleinster Schritt):** gemeldete Kinder plus Abdeckungsangabe. Dann erscheint nie ein unbeschränktes *done*, sondern „alle N gemeldeten Kinder angenommen, Vollständigkeit unbelegt“.
  - **Alternative:** eine deklarierte Kinderliste als Vertragsfeld.
  - Entscheidung: Atlas, Technik: Lot.
- **E2 Woher kommt der Teststatus?** Der Vertrag kennt weder `test_run_id` noch ein Ergebnisfeld.
  - **Empfehlung:** Der Monitor rechnet keinen PASS aus. Wer annimmt, verweist auf den Testlauf. Den Teststatus führen Register bzw. QA-Bericht, bis ein Vertragsfeld entschieden ist.
  - Entscheidung: Atlas, Technik: Lot.
- **E3 Wie wird wiedereröffnet bzw. eine neue Fassung vergeben?** Möglich wäre eine neue Vergabe mit höherem `item_version` als neue Episode oder eine eigene Ereignisart. Technik: Lot.
- **E4 `lot` als Akteur:** Das ist eine Änderung am Bild. Entscheidung: Peter.
- **E5 Weg A oder B aus TK-022:** Davon hängt ab, ob jemand überhaupt echte `accepted`- und Beginn-Meldungen schreibt. Entscheidung: Atlas/Peter.

## 6. Nächste Schritte
- **Atlas:** K1–K6 ins Register übernehmen, E1–E3 mit Lot entscheiden, E4/E5 Peter vorlegen.
- **Atlas, danach:** Sentinel für die unabhängige Testplanung zu AC-01 bis AC-09 beauftragen.
- **Lot:** prüfen, ob es einen kleinsten technischen Weg für R2, R3, R5 und R6 gibt. Er sollte dabei auch den Live-Pfad in `index.html` auf R5 prüfen.

Ich überarbeite nichts weiter, solange keine neue Entscheidung oder kein neuer Beleg vorliegt.