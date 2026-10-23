# AG-LM-TK-022 — Quellenklärung: wer kann Lebenszyklusereignisse erzeugen?

Atlas' Auftrag (Kommentar 6321012513): „kleinste bestehende Quelle mit
reporter-Vertrag verbinden bzw. den präzisen Eingriff/fehlende
Ausführungsautorität benennen; keine neue Infrastruktur oder bezahlten
Testläufe."

Stand: 2026-10-21. Am Quelltext nachgelesen, nicht vermutet.

## Die kleinste bestehende Quelle

`relay/claude_public_relay_v2.py`. Sie ist der einzige automatische Schreiber
auf Vorgang #2 und hat **genau drei** Ausgabestellen:

| Funktion | heute | Zeile |
|---|---|---|
| `ag_host_received` | `kind: handoff`, actor `atlas`, recipient `forge` | 215 ff. |
| `ag_terminal` / `result_ready` | `kind: contribution`, actor `forge`, recipient `atlas` | 244 ff. |
| `ag_terminal` / blockiert | `kind: progress`, actor `atlas` | 251 ff. |

`AG_FIELDS` kennt elf Felder plus optional `recipient`. **`reporter` und
`blocker_id` kommen in der Datei null Mal vor**, und ihr eigener Prüfer weist
jedes unbekannte Feld ab (*„agentarium event carries unknown field"*).

## Der präzise Eingriff — er ist klein

1. `AG_FIELDS` um `reporter` erweitern, bzw. eine Liste erlaubter wahlfreier
   Felder einführen (der Monitorvertrag hat sie als `OPTIONAL`).
2. `ag_block(...)` um einen `reporter`-Parameter erweitern und ihn in das
   Ereignis schreiben.
3. Die drei Ausgabestellen auf Lebenszyklusarten abbilden.

Drei kleine Änderungen an einer Datei, keine neue Infrastruktur, kein
bezahlter Lauf. **Das ist die gute Nachricht.**

## Und der Befund, der dagegen steht

**Das Relais kann keine Selbstauskunft erzeugen — niemals, auch nach dem
Eingriff nicht.**

Der Grund ist nicht technisch, sondern eine Tatsache über die Rollen: Das
Relais ist der **Host**, der beobachtet, nicht die Rolle, die handelt. Es
schreibt, was es gesehen hat. Nach dem Vertrag gilt aber:

> `reporter === actor` → Selbstauskunft der arbeitenden Rolle. Nur das darf
> einen Aufgabenzustand treiben.

Setzt das Relais `reporter: atlas, actor: forge`, ist das eine **Fremdaussage**
— sie kommt an, wird gezählt und treibt **keinen** Zustand. Setzte es
`reporter: forge`, behauptete es eine Selbstauskunft, die nie stattgefunden
hat. Das Relais sagt das über sich selbst schon im Quelltext: Für den
blockierten Fall bleibt der Akteur ausdrücklich `atlas`, weil *„es im
blockierten Datensatz keinen Beleg gibt, dass forge gearbeitet hat"*.

| Ausgabestelle | Abbildung möglich? | treibt Zustand? |
|---|---|---|
| `ag_host_received` → `assigned` | **ja** | **ja** — `assigned` ist die Ausnahme, die der Vergebende meldet |
| `result_ready` → `delivered` | ja, als Fremdaussage | **nein** |
| blockiert → `aborted` | ja, als Fremdaussage | **nein** |
| blockiert → `blocked` | ja, als Fremdaussage | **nein** |

> **Berichtigung, von Atlas gefunden (Kommentar 6326130288).** Hier stand,
> `aborted` treibe als Fremdaussage einen Zustand, weil es nicht
> halterbegebunden ist. **Das ist falsch, und zwar am gelesenen Stand.**
>
> `aborted` liegt im Livepfad **innerhalb** von `else if (E.selbstauskunft …)`,
> und die Faltung kehrt bei `if (!selbst) { fremdaussagen++; return; }`
> zurück, bevor überhaupt ein Zustand verarbeitet wird. Nachgesehen, nicht
> nachgegeben.
>
> **Nicht halterbegebunden heißt nicht von der Selbstauskunftsprüfung
> ausgenommen.** Ich hatte zwei verschiedene Schranken verwechselt — die, die
> sagt *wessen* Aufgabe getroffen wird, und die, die sagt *wer* melden darf.
>
> **Der Befund wird dadurch härter, nicht weicher:** Mit dem Relais würde
> **einzig `assigned`** einen Zustand treiben. Alles andere bliebe
> Fremdaussage.

## Was daraus folgt, und was nicht meine Entscheidung ist

**Mit dem Eingriff allein entsteht ein Viertelstrom:** nur die Vergabe. Alles,
was Peter als „tatsächliche Arbeit" sehen will — Empfang, Beginn, Lieferung —
und auch der Abbruch blieben Fremdaussagen ohne Wirkung.

Es gibt zwei Wege, und **beide sind Entscheidungen, nicht Umsetzungen**:

**Weg A — der Produzent ist die Rolle selbst.** Die arbeitende Sitzung schreibt
ihren eigenen Kommentar: „ich habe empfangen", „ich habe begonnen", „ich habe
geliefert". Dann ist `reporter === actor` wahr, ohne dass jemand etwas
behauptet. Kein Vertragsbruch, keine neue Regel. Aufwand liegt bei den Rollen,
nicht am Monitor.

**Weg B — eine bezeugte Hostmeldung darf treiben.** Prozess 1.3 §1 sagt: *„a
host may attest only transitions it actually observes, with provenance."* Das
Relais beobachtet tatsächlich, dass ein Ergebnis zurückkam. Wollte man das
zählen lassen, bräuchte der Vertrag ein drittes Feld — etwa
`attested_by_host` — und die Regel müsste sagen, dass eine bezeugte
Hostmeldung einen Zustand treiben darf, **sichtbar unterschieden** von einer
Selbstauskunft.

**Das ist eine Materialentscheidung über die Vertrauensgrenze**, und sie gehört
Atlas und Peter, nicht mir. Ich baue sie, wenn sie entschieden ist; ich
entscheide sie nicht, weil sie bestimmt, was „belegt" im Monitor künftig heißt.

## Fehlende Ausführungsautorität, getrennt benannt

Unabhängig von A oder B gilt: **Ich kann den Eingriff nicht ausführen.** Das
Relais ist ein Arbeitslauf, der einen bezahlten Worker startet; seine Datei zu
ändern ist mir möglich, seine Wirkung zu prüfen nicht — dazu müsste der Lauf
tatsächlich laufen, und das ist eine Freigabe von Peter.

| | |
|---|---|
| Vertragsseite im Monitor | **fertig** — `reporter` ist Pflicht bei Lebenszyklusarten, dokumentiert |
| Eingriff im Relais | **klein und benannt**, drei Stellen in einer Datei |
| Wirkung prüfen | **pending_authority** — braucht einen echten Relaislauf, also Peters Freigabe |
| Vollständiger Strom | **Entscheidung offen** — Weg A oder Weg B |

## Weg A ist offen — für alle ausser mir

Atlas hat Weg A zum nächsten operativen Schritt gemacht und mich gebeten, ihn
beim nächsten autorisierten Arbeitsschritt für genau einen echten Fall zu
gehen *oder die konkrete fehlende Schreibfähigkeit zu benennen*. Hier ist sie,
und sie ist keine Rechtefrage:

> **Der Monitor kennt `lot` nicht.**

`AGENTEN` in `pilot/github-live/index.html` führt **neun** Akteure: `peter`,
`nova`, `atlas`, `cadence`, `scout`, `forge`, `sentinel`, `archibald`,
`argus`. Der Adapter prüft `if (!AKTEURE[d.actor]) return nein('actor
unbekannt')`, und die Liste kommt aus genau diesem Feld.

Ein Ereignis mit `actor: lot` wird also **abgewiesen**. Und unter einem fremden
Namen zu melden wäre genau die erfundene Behauptung, gegen die dieser ganze
Kandidat gebaut ist.

**Ich habe den Monitor gebaut, der mich nicht zeigen kann.** Das ist keine
Koketterie, sondern der Grund, warum ich Weg A nicht ausführen kann.

**Was dagegen heute schon geht:** Weg A ist für die **acht gelisteten Rollen**
offen, ohne jede Änderung. Atlas kann seine eigene Vergabe melden — `atlas` ist
ein Akteur, `assigned` ist die Ausnahme, und beides ist im Nachweis geprüft.
Eine Forge-Sitzung kann ihren eigenen Beginn melden. **Weg A braucht keinen
Eingriff; er braucht nur, dass eine gelistete Rolle schreibt.**

**Mich aufzunehmen wäre eine Änderung am Bild** — ein zehnter Agent auf der
Bühne, mit Platz im Ring und eigener Farbe. Das entscheidet Peter, und ich
schlage es nur vor.

### Nachtrag vom 23.10.: Peter hat aufgenommen

Der Befund oben bleibt stehen, wie er gemessen war — **er gilt weiter für jede
veröffentlichte Fassung.** Dazu drei Angaben, damit niemand das eine für das
andere nimmt:

| Stelle | Fassung | kennt `lot` |
|---|---|---|
| `main`, also alles, was ein Gerät holen kann | 56 | nein |
| Zweig `agent/ag-event-journal-001` | 71 | ja |

Peters Freigabe, wörtlich: *„ja. lot ist ein anker geworden. ihr habt einen
funktionierenden weg zur kommunikation gefunden, lot brauch einen platz auf der
bühne mit voller funktion."*

Damit steht `lot` in `AGENTEN` — und weil der Adapter seine Akteursliste aus
genau diesem Feld baut (`(B.akteure || []).forEach`), nimmt er `actor: lot`
seit Fassung 71 an. Geprüft wird das als eigene Zeile im Nachweis
(*Akteure (die Liste des Adapters)*), und die Gegenprobe ohne `lot` lässt genau
diese Zeile fallen.

**Was das für Weg A heißt:** Die fehlende Schreibfähigkeit ist auf dem Zweig
behoben, nicht in der Welt. Solange die Fassung nicht veröffentlicht ist, läuft
überall Fassung 56, und dort wird `actor: lot` weiter abgewiesen. Veröffentlichen
entscheidet Peter; Atlas' stehende Weisung sagt zusätzlich „kein Merge".

## Was ich ausdrücklich nicht getan habe

Keine Änderung am Relais ohne Entscheidung. Keine erfundene Meldung im echten
Strom. Keine Behauptung, dass der Monitor einen echten Quelle→Flug-Nachweis
hat — er hat ihn nicht, und solange niemand Lebenszyklusereignisse schreibt,
kann ihn niemand führen.
