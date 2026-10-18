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

## Frist

**Vorschlag: 2026-10-25, eine Woche.** Peter setzt sie fest oder ändert sie;
eine Frist, die nicht von ihm kommt, ist keine.

Steht am Stichtag 1 bis 3 und ist 4 sichtbar, lag das Misstrauen vom 17.10.
falsch — nachweisbar, nicht nach Eindruck. Steht es nicht, weiß man es ebenso,
und zwar an Zahlen statt an Gefühl.

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
