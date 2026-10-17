# Verhandlung mit Atlas: Der Ballflug im Livebetrieb

AG-VISUAL-005-BALLFLUG-LIVE, Version 1 · 2026-10-16T19:50:00Z
Status: zum Weitergeben durch Peter.
Absender: Feldverfasser, Hauptsitzung. Gebaut und gemessen, nicht vorgeschlagen.

**Alles unterhalb der Linie ist zum Kopieren.**

---

Atlas — Peters Frage war: *„Gibt die Schnittstellendefinition her, dass der
Ball fliegen kann?"* Antwort nach dem Bauen: **ja, für den Wurf vollständig
— und das Feld kann es jetzt.** Fünf Fragen bleiben, bei denen eure Antwort
mein Verhalten ändert. Sie stehen unten als V-1 bis V-5.

## Was der Vertrag hergibt, und was daraus geworden ist

Ein `arbeitsereignis` trägt verpflichtend `actor`, `kind`, `title`,
`occurred_at`, `recorded_at`, `caused_by` — und `recipient` ist für die
neun Kommunikationsarten zwingend („eine Nachricht ohne Empfänger ist keine
Nachricht"). Das ist genau, was ein Ball braucht: wer wirft, wohin, welche
Gestalt, welcher Text, in welcher Reihenfolge.

Gebaut, in Feldfassung 46:

| Neu | Was es tut |
|---|---|
| `window.__agEreignis(e)` | nimmt ein Arbeitsereignis **in den Feldnamen des Vertrags** entgegen |
| `window.__agLauf(d)` | sagt dem Feld, **welcher Lauf** läuft (`project_id`, `run_id`, Titel) |
| eigene Liveliste | im Livebetrieb spielt das Feld **keine Aufzeichnung** mehr ab |
| Einholen statt Voraussehen | der Ball sieht live nicht mehr in die Zukunft |

**Gemessen, ohne jede Aufzeichnung, nur aus vier Ereignissen:** Ball fliegt,
landet, bleibt beim Empfänger liegen und atmet; Nachrichten erscheinen an
ihren Empfängern; zwei Agenten arbeiten; der Fortschritt rechts zählt
„1 von 3 Aufgaben erledigt"; der stille Punkt vor der Uhr atmet; die laute
Tafel schließt sich von selbst. Keine Konsolenfehler.

## Der eine echte Umbau: Einholen statt Voraussehen

`flugdauer()` suchte in der Ereignisliste nach dem **nächsten Zug des
Empfängers** und kürzte den Flug so, dass der Ball vorher ankommt. Das war
der letzte der vier Blicke in die Zukunft, die im Feld steckten. Live gibt
es kein Als-Nächstes.

Jetzt umgekehrt: Der Flug ist, was der Weg hergibt. Handelt der Empfänger
früher als gedacht, wird der Ball **eingeholt** — die Reststrecke wird auf
0,28 Sekunden gestaucht, statt dass er überholt wird oder verschwindet.

Nachgemessen: Flug zu `nova` 1,663 s; als `nova` handelte, 0,309 s. Reaktion
statt Vorhersage, dasselbe Bild, ehrlich zustande gekommen.

## Ein eigener Fehler, bevor ihr ihn findet

Mein erster Eingang las `verbrauch.kosten_usd`, `verbrauch.quelle` und
`verbrauch.cache_tokens`. **Keines dieser Felder gibt es.** Der Vertrag
kennt `belegt` (Pflicht), `input_tokens`, `output_tokens`,
`thinking_tokens`, `actual_model`, `platform`, `agent_id` — und **kein
Geld**. Das war derselbe Fehler wie in Schnittstelle V1 mit den sieben
erfundenen Namen; er ist korrigiert, bevor er in eine Fassung kam.

**Folge, und sie ist richtig so:** Aus einem echten Strom erscheint im Feld
nie ein Betrag. Es bleibt bei Peters Satz. `belegt: false` trägt keine
Zahlen — das ist etwas anderes als null, und das Feld zeigt dafür „keine
Kostenangabe".

## V-1 — Welche `kind`-Werte liefert der Arbeitsstrom wirklich?

Das Feld kennt siebzehn Gestalten: `request` `handoff` `answer` `question`
`objection` `change_request` `proposal` `recommendation` `contribution`
`decision` `artifact` `review_result` `test_result` `defect` `open_state`
`stop` `resume`.

**Eine Art, die das Feld nicht kennt, wird abgewiesen** — nicht mit einer
fremden Gestalt gezeigt. Lieber unsichtbar als falsch dargestellt.

*Was ich brauche:* die tatsächliche Liste aus `observed-worklog.v1`. Jede
Art, die ihr sendet und die oben fehlt, ist heute unsichtbar.

## V-2 — Wann gilt ein Ball als aufgenommen?

Heute bleibt der Ball beim Empfänger liegen, bis der nächste ganze Ball
woanders hinfliegt. Der Vertrag bietet mit `caused_by` etwas Besseres.

*Vorschlag:* Der Ball wird gehoben, wenn ein Ereignis eintrifft, dessen
`caused_by` die Kennung des Wurfs enthält **und** dessen `actor` der
Empfänger ist. Alles andere lässt ihn liegen.

*Was ich brauche:* Trägt eine Antwort verlässlich `caused_by` auf den
auslösenden Wurf? Wenn das Feld leer bleiben darf, bleibt es beim
heutigen Verhalten.

## V-3 — Was tun mit nachgelieferter Vergangenheit?

Nach einem Abriss liefert ihr Schnappschuss plus Nachlauf (`cursor`,
`replay_grenze`). Das Feld setzt den Ball heute auf die **eigene Uhr beim
Eintreffen**.

*Meine Haltung:* Eine Stunde Vergangenheit als Bewegung nachzuspielen wäre
eine Behauptung über etwas, das niemand gesehen hat. Richtig wäre: in den
**Zustand springen** und es sagen — „Stand übernommen, N Ereignisse nicht
als Bewegung gezeigt".

*Was ich brauche:* eure Entscheidung. Davon hängt ab, ob ich einen
zweiten Pfad baue oder nicht.

## V-4 — Wer nennt den Lauf?

Ohne Angabe stand im Livebild der Name des zuletzt gewählten
aufgezeichneten Stücks — „NACHTPOST V1" über einem fremden Lauf. Das ist
keine Unschönheit, das ist eine falsche Angabe, und sie ist behoben.

*Was ich brauche:* Tragen `project.created` und `run.started` einen
menschenlesbaren Titel? Wenn nicht, zeigt das Feld die Kennung — kein
Ersatzname.

## V-5 — Wohin mit Transport und Abdeckung?

Forges Aktivitäts-Adapter hängt seinen Status (Transport, Quelle,
Abdeckung) an die Tafel „Live — keine Verbindung". Seit Fassung 44
schließt sich diese Tafel, sobald ein Strom lebt — die beiden Entwürfe
schließen einander aus (siehe
`handoffs/AG-PILOT-001-field-adapter-v3-feldprobe-v1.md`, Befunde K-A und
K-B).

*Vorschlag:* Der Adapter ruft `window.__agStrom.lebenszeichen()`; der
Status zieht in die Marke links oben oder in die Fortschrittsspalte. Beide
klappen beim Lesen auf.

*Was ich brauche:* euer Ja, und wer es einbaut. Ich fasse Forges Datei
nicht an.

## Grenzen dieser Arbeit

- **Es gibt keine Gegenstelle.** Kein Server, kein SSE, kein `/activity`.
  Alles oben ist gegen selbst gestellte Ereignisse gemessen.
- **Der Reducer ist nicht angeschlossen.** Das Feld zählt Aufgaben aus
  seiner eigenen Mechanik, nicht aus `zustand_am_cursor`. Ob beide
  dasselbe sagen, ist ungeprüft — das ist O-7 in anderer Gestalt.
- **Kein iPad, kein Safari, keine Last.** Chromium, ein Fenstermaß,
  Handvoll Ereignisse.
- Keine Implementierung bei euch, kein Merge, kein kostenpflichtiger Lauf.
