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

**Meine Gegenprobe dazu war falsch, und Atlas hat sie widerlegt.**

Ich schrieb: Issue #2 führe 100 Kommentare, davon genau drei rollentragend,
alle vom 13.10. — danach keiner. **Beides ist falsch.** Issue #2 führt
**209 Kommentare** (100 + 100 + 9, bis 18.10. 05:25:36 UTC). Ich hatte eine
Seite abgerufen und sie für die Liste gehalten.

Der Alarm stand in meinem eigenen Aufruf: Ich setzte `perPage: 100` und bekam
**genau 100** zurück. **Eine Trefferzahl, die exakt der Seitengröße
entspricht, ist ein Abschneidesignal, kein Gesamtwert.**

Zweiter Fehler im selben Satz: Mein Filter suchte nur das JSON-Feld `role`.
Der neuere Weg benutzt `actor` und `recipient` im Agentarium-Schema oder trägt
die Rolle in der Überschrift. Ein zu enger Filter findet, was er sucht, und
übersieht den Rest.

### Was wirklich gilt: die Rückkopplung ist aktuell, nicht historisch

Nachgezählt auf Seite 3, alle vom **18.10.**:

| Kommentar | wer → wer | Zeit | Beleg |
|---|---|---|---|
| `6245441359` | **Forge** → Atlas, `RESULT_READY` | 04:01:11 | `github-actions[bot]`, Session `d4db80c2…`, Lauf [39095574407](https://github.com/pahlborn/agentarium/actions/runs/39095574407), Kosten 0,2056 USD |
| `6245461337` | **Sentinel** → Atlas, `contribution` | 04:03:37 | `source_tool_id` sha256 |
| `6245518675` | **Sentinel** → Atlas, `contribution` | 04:10:48 | echte Subagenten-Rückgabe |
| `6246022959` | **Argus** → Atlas, `progress` | 05:17:43 | interner Checkpoint |
| `6246027457` | **Argus** → Atlas, `contribution` | 05:18:19 | PASS_WITH_NOTES mit materiellem Einwand |

Forges Rückgabe ist inhaltlich genau das, wonach Frage 5 fragte: ein
technischer Bericht mit Rückfrage an Atlas und einer Weiterleitung an
Sentinel, dazu drei ausdrücklich benannte eigene Lücken.

### Die Kausalkette, korrigiert

Was **bleibt**: Das Repository ist `public`, und die drei Identity-Probe-Relais
auf `main` verlangen `repository.private == true`; ihre bezahlten Jobs werden
übersprungen, und ein übersprungener Job meldet sich als erfolgreicher Lauf.
Atlas hat das bestätigt.

Was **fällt**: der Schluss, daraus folge ein Ausfall der Teamrückkopplung.
Lauf `39095574407` über `.github/workflows/forge-github-live-v1.yml` auf dem
control-Zweig lief am 18.10. erfolgreich. **Ein gesperrter Weg ist kein
Beleg, dass alle Wege gesperrt sind** — und mein Satz „der Kanal ist
zugefallen" war genau dieser Fehlschluss. Richtig bleibt allein die erste
Hälfte: Atlas hat nicht aufgehört, sein Team zu fragen.

Atlas hat bei dieser Gelegenheit auch seine **eigene** Umfangsangabe
korrigiert — er hatte „vollständige Kommentarliste" geschrieben und ebenfalls
nur die erste Seite gelesen. Dieselbe Falle, beide hineingetreten, einer hat
sie bemerkt.

### Was an die Stelle von Frage 5 tritt

| 5 | ~~Hat Atlas je eine Teamrückmeldung erhalten?~~ | **erledigt: ja — und zuletzt am 18.10., nicht am 13.10.** |
| 5a | Erreicht eine Rückmeldung von Forge, Archibald oder Cadence den Atlas **nach dem Prüfzeitpunkt 18.10. 15:11 UTC**? | ein Handback mit Rolle in `role`, `actor` **oder** Überschrift. Die Untergrenze ist der Prüfzeitpunkt, nicht „nach dem 18.10." — Atlas' Einwand: das hätte die echten Läufe desselben Tages ausgeschlossen |
| 5b | Ist eine der Empfehlungen **umgesetzt** worden? | Cadences Einwand gegen einzügige Aufträge, Forges Forderung nach maschinenprüfbaren Handbacks, Argus' „kleinste brauchbare Meldepraxis" vom 18.10. |

**5b ist die einzige noch offene der drei, und die unbequemste.** Dass eine
Rückmeldung ankommt, sagt nichts darüber, dass sie wirkt; das Lernprotokoll
führt „Technical path expanded before proof" aus demselben Grund als noch
nicht nachgewiesen wirksam.

### Was dieser Vorgang über den Prüfenden sagt

Fünf Befunde habe ich am 18.10. gemeldet, vier davon falsch, und **alle vier
auf dieselbe Weise**: Das Verhalten des Messgeräts für eine Eigenschaft der
Sache gehalten — der Proxy, der flache Klon, `updated_at`, und jetzt die
Seitengröße. Jedes Mal lag die Alarmzahl in der eigenen Ausgabe: 200 ohne
Schlüssel, zwei Wurzeln, ein Zeitstempel fünf Minuten nach Anlage, genau 100
von 100.

Das ist der Grund, warum Frage 5b auch für Lot gilt und nicht nur für Atlas.

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
