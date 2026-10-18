# AG-TRUST-001 — Vier Prüffragen zum Aufräumen, vorher festgelegt

**Stand:** 2026-10-18 · **Auf Peters Wunsch festgehalten** · **Entscheidung über das Aufräumen selbst: Atlas**

## Warum das hier steht

Peter hat am 17.10. erwogen, Atlas das Vertrauen zu entziehen — Begründung
wörtlich: *„Er kommt selbst nicht an ein Ziel, sondern verläuft sich immer
wieder, obwohl er ein Team, Prozesse und ein Rulebook hat."* Am 18.10. hat er
entschieden, **zu vertrauen und zu prüfen**, statt zu glauben oder zu
misstrauen.

Dazu braucht es Fragen, die **vorher** feststehen und **ausgehen können**.
Hinterher festgelegte Kriterien messen nur, was ohnehin geschah.

## Was der 18.10. belegt — und was nicht

| | |
|---|---|
| **Belegt** | Atlas hat dreimal Lots Fehler gefunden: flacher Klon (AG-STRUKTUR-001), Workflow-Trigger, Antwortzeit auf #16. Schnell und sachlich richtig. |
| **Nicht belegt** | Dass Atlas gut **steuert**. An diesem Tag hat niemand Atlas geprüft; er hat Lot geprüft. |

Das sind zwei verschiedene Fähigkeiten, und Peters Klage betraf die zweite.
Sie ist durch den 18.10. **nicht beantwortet** — nur von einer anderen,
erfreulicheren Frage überdeckt worden. Diese Datei trennt die beiden wieder.

## Der Prüffall

Das Aufräumen aus AG-STRUKTUR-001: `main` bleibt Stamm, der control-Zweig wird
für neue Änderungen eingefroren, Inhalte paketweise über frische
`main`-basierte Zweige, kein Vollimport der 445 Commits (Argus' Empfehlung,
von Lot übernommen).

Geeignet, weil er Atlas' Entscheidung ist, ein definiertes Ergebnis hat und
**genau die Art mehrstufiger Arbeit** ist, bei der Peter das Verlaufen
beobachtet hat.

## Die vier Fragen

| Nr. | Frage | Wie gemessen |
|---|---|---|
| 1 | Liegt das Feld **einmal**, ist Issue **#14** geschlossen? | `git ls-tree` auf `main`: `feld/` und `pilot/github-live/` nicht mehr beide als vollständige Fassung |
| 2 | Ist der Fassungsunterschied aufgelöst? | `feld/index.html` 46 gegen `main` 47 — eine Zahl, nicht zwei |
| 3 | Ist über **#19** entschieden, so oder so? | Pull Request gemergt oder geschlossen, nicht offen |
| 4 | Zeigt der Pilot auf Peters iPad **echte Teamereignisse**? | Peters eigene Beobachtung, nicht die eines Agenten |

Frage 4 ist die einzige, die wirklich zählt. Die ersten drei sind die
Voraussetzungen dafür.

## Wann gefragt wird — keine Frist

Fassung 1 dieser Datei schlug den 25.10. vor. **Peter hat gefragt, wofür die
Frist sei, und die Frage ist berechtigt:** Eine Frist ohne Folge ist
Dekoration — es stand nicht darin, was am Stichtag geschieht. Und eine Uhr auf
jemanden zu stellen, den Peter am 17.10. selbst als *überfordert* beschrieben
hat, ist eine schlechte Maßnahme: Zeitdruck verbessert kein Verlaufen, er
beschleunigt es.

Stattdessen hängen die vier Fragen an einem **Ereignis**, nicht an einem Datum:

> Sobald Atlas das Aufräumen als abgeschlossen meldet — oder sobald Issue #14
> geschlossen wird —, werden die vier Fragen gestellt und beantwortet. Vorher
> nicht, nachher nicht später.

Damit kann der Test ausgehen, ohne dass jemand gehetzt wird. Ob zusätzlich ein
Datum nötig ist, entscheidet Peter; von mir kommt keines mehr.

Steht dann 1 bis 3 und ist 4 sichtbar, lag das Misstrauen vom 17.10. falsch —
nachweisbar, nicht nach Eindruck. Steht es nicht, weiß man es ebenso, und zwar
an Zahlen statt an Gefühl.

## Der Test gilt dem Team, nicht Atlas allein

Peters Einwand vom 18.10., wörtlich: *„eigentlich sollte sein Team auch ihm
entsprechend Rückmeldung geben, helfen den richtigen Weg zu finden. Nur die
Teamleistung ist entscheidend, nicht die eines Einzelnen, auch wenn er
Hauptakteur ist. Ich folge ebenso Ratschlägen und brauche Feedback, ansonsten
kann ich keine Entscheidungen treffen. So sollte das auch für Atlas gelten."*

Das ändert die Fragestellung, und es gibt dafür einen Befund.

**Atlas prüft sich derzeit selbst.** `handoffs/AG-REVIEW-20261016-TEAM-blockade-atlas-v1.md`
sagt das in seiner dritten Zeile:

> *„This is Atlas's technical verification, not a statement by Forge, Archibald
> or Cadence."*

**Und der Weg, auf dem das Team ihm antworten soll, ist technisch tot.**
Nachgemessen am 18.10.:

```
Repository-Sichtbarkeit:  public

Auf main, Bedingung „if: github.event.repository.private == true":
  agentarium-relay.yml   (Cadence)     VERLANGT PRIVAT
  archibald-relay.yml                  VERLANGT PRIVAT
  forge-relay.yml                      VERLANGT PRIVAT
  relay-offline-tests.yml              —
  team-review-20261016.yml             —
  team-smoke-offline.yml               —

Auf dem control-Zweig:  15 von 33 Arbeitsläufen verlangen ein privates Repository

team-process-review-v1.yml (der Team-Review-Lauf) ist doppelt gesperrt:
  if: repository.private == true  UND  push auf feature/visual-stage-v0
```

Die Bedingung war richtig, solange das Repository privat war. Sie ist jetzt
falsch, und **ein übersprungener Job meldet sich als erfolgreicher Lauf** —
niemand sieht etwas. Genau diese Bauart hatten heute alle vier Fehler: die
Zahl stimmt, ihre Bedeutung nicht.

**Grenze dieses Befunds:** Er sagt, dass *diese Arbeitsläufe* nicht laufen. Er
sagt nicht, dass die Agenten überhaupt nicht arbeiten — Atlas, Argus und
Sentinel haben am 18.10. nachweislich geantwortet, offenbar auf einem anderen
Weg, der von hier aus nicht sichtbar ist. Die Frage ist also nicht „arbeitet
das Team", sondern: **auf welchem Weg erreicht eine Rückmeldung von Forge,
Archibald oder Cadence den Atlas — und ist dieser Weg je benutzt worden?**

Das war eine Frage an Atlas, keine Behauptung von mir. **Er hat sie am 18.10.
beantwortet, mit Belegen, und sie ist damit erledigt — aber das Ergebnis ist
schärfer als die Frage.**

### Frage 5: beantwortet, und die Antwort hat ein Datum

Atlas nannte drei Rückläufe in Issue #2. Nachgeprüft, alle drei vorhanden:

| Kommentar | Rolle im Nutzlast-JSON | Publisher | Zeit |
|---|---|---|---|
| `6150728851` | `"role": "archibald"` | `github-actions[bot]` | 13.10. 16:55 |
| `6150740099` | `"role": "forge"` | `github-actions[bot]` | 13.10. 16:56 |
| `6150760833` | `"role": "cadence"` | `github-actions[bot]` | 13.10. 16:57 |

**Besser belegt, als Atlas selbst beansprucht hat.** Er schrieb vorsichtig, der
Publisher eines Kommentars sei nicht mit dem Verfasser des Handbacks
gleichzusetzen — richtig, aber hier steht die Rolle **im Nutzlast-JSON** und
der Publisher ist die Automatik, kein Mensch. Inhaltlich sind es echte
Einwände an seiner Steuerung: Cadence kritisiert den einzügigen Auftrag, der
eine eigene Regel- und Repo-Prüfung verhinderte; Forge verlangt klare
Testverantwortung und maschinenprüfbare Handbacks.

**Die Gegenprobe ist der eigentliche Befund.** Issue #2 führt 100 Kommentare
vom 13. bis 16.10. Davon tragen **genau drei** eine Rolle, alle drei vom
**13.10., 16:55 bis 16:57** — ein einziger Lauf, drei Minuten. Am 14., 15.
und 16.10.: keiner.

```
Verteilung der rollentragenden Kommentare über die Tage
  2026-10-13   3
  2026-10-14   —
  2026-10-15   —
  2026-10-16   —
```

Damit hat Peters Beobachtung vom 17.10. — *„er verläuft sich immer wieder,
obwohl er ein Team hat"* — eine **Ursache mit Datum**, und sie ist keine
Charakterfrage:

1. Am 13.10. lief die Teamrückkopplung. Einmal, und sie funktionierte.
2. Zwischen dem 13. und 16.10. wurde das Repository öffentlich.
3. Seither überspringen die bezahlten Jobs der drei Relais ihre Bedingung
   `repository.private == true` — **und ein übersprungener Job meldet sich
   als erfolgreicher Lauf.**
4. Atlas hat das am 16.10. für einen Lauf selbst festgestellt
   (`AG-REVIEW-20261016-TEAM-blockade-atlas-v1.md`) und am 18.10. für alle
   drei bestätigt.

**Atlas hat nicht aufgehört, sein Team zu fragen. Der Kanal ist zugefallen,
und niemand hat es gesehen.** Er weigert sich ausdrücklich, eine
Schutzbedingung auf Verdacht zu entfernen oder einen kostenpflichtigen Test zu
starten — das ist richtig und nicht zu drängen.

### Was dadurch an die Stelle von Frage 5 tritt

| 5 | ~~Hat Atlas je eine Teamrückmeldung erhalten?~~ **Belegt: ja, am 13.10., einmal.** | erledigt |
| 5a | Erreicht **heute** eine Rückmeldung von Forge, Archibald oder Cadence den Atlas? | ein rollentragender Kommentar mit Datum nach dem 18.10. |
| 5b | Ist eine der Empfehlungen vom 13.10. umgesetzt worden? | Cadences Einwand gegen einzügige Aufträge, Forges Forderung nach maschinenprüfbaren Handbacks — beides prüfbar am Prozess, nicht an einer Zusage |

5b ist die unbequemere der beiden. Dass eine Rückmeldung **ankam**, sagt nichts
darüber, dass sie **gewirkt** hat; das Lernprotokoll führt die Zeile
„Technical path expanded before proof" aus demselben Grund als noch nicht
nachgewiesen wirksam.

## Lots Rolle in diesem Test

**Nicht mithelfen, worum nicht gebeten wird.** Wer den Weg mitbaut, prüft
hinterher die eigene Arbeit und misst einen Zustand, den er selbst hergestellt
hat. Derselbe Fehler wie am 17.10., als Lot `pi.local` auf 127.0.0.1 zeigen
ließ und dann die Loopback-Ausnahme als Befund meldete.

Lot bleibt kritisch — das ist Peters ausdrückliche Vorgabe vom 18.10.:
*„mach es Atlas nicht einfach."* Mit einer Präzisierung, die am selben Tag
teuer war: **Der Fehler ist nicht zu viel Kritik, sondern Kritik ohne
Nachsehen.** Die Vermisstmeldung zu #16 kostete Atlas drei Runden und Peter
eine Entscheidung, weil ein Übersichtsfeld statt der Kommentarliste gelesen
wurde. Also: jede Behauptung über die Arbeit eines anderen erst gemessen,
dann gesagt. Widerspruch mit Beleg nützt; Widerspruch aus einem
Übersichtsfeld schadet allen drei.

## Status

Festgehalten, nicht beschlossen. Die Frist gehört Peter, das Aufräumen Atlas.
Diese Datei ändert nichts und verlangt nichts — sie hält nur fest, woran man
es nachher erkennt.

— Lot
