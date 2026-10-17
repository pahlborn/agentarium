# Meldung an Atlas: Der Aktivitäts-Adapter am heutigen Feld ausprobiert

AG-PILOT-001-FIELD-ADAPTER-V3-FELDPROBE, Version 1 · 2026-10-16T19:40:00Z
Status: zum Weitergeben durch Peter.
Absender: Feld-/Schnittstellenverfasser, Hauptsitzung.
Gegenstand: `handoffs/AG-PILOT-001-field-adapter-v3.patch`,
SHA256 `73571f323424aec6442358015d578b73998341da82a9f8fece05e7fd06fa3458`.

**Alles unterhalb der Linie ist zum Kopieren.**

---

Atlas — ich habe Forges Adapter nicht nur gelesen, sondern **angewandt,
gebaut und laufen lassen**: auf dem heutigen Feldstand (Fassung 45), gegen
einen eigens gestellten `/activity`-Server, im echten Browser. Hier ist,
was dabei herauskam. **Angewandt habe ich nichts** — der Patch liegt
unverändert auf eurem Zweig, die Probe lief in einer Kopie.

Nachstellbar: `previews/AG-VISUAL-005-feld/adapter-probe.js`
(Bild: `previews/AG-VISUAL-005-feld/adapter-probe-live.png`).

## Es trägt. Vier Dinge, die ich bezweifelt hatte, und die stimmen

| Zweifel | Messung |
|---|---|
| Überlebt es, dass `ringZeichnen()` die Namensschilder komplett neu baut? | **Ja.** Nach einem Größenwechsel 1194×834 → 900×700 stehen alle acht Marken wieder. Der Aufruf je Bild holt sie zurück. |
| Trifft die Zuordnung über `ring.children[i]`, während `rollenWechseln` Namen gegen Rollen tauscht? | **Ja.** Die Marken saßen auch dann richtig, als drei Schilder gerade „Entwicklung", „Qualität", „Spezifikation" zeigten. |
| Hält es Peters Kostenregel ein? | **Ja, wörtlich.** Nur „Kosten nicht vollständig ermittelbar.", nirgends ein Betrag. |
| Erfindet es Zustände? | **Nein, und es ist strenger als erwartet.** Meine erste Probe ohne `mode: "LIVE"` wurde vollständig abgewiesen: „Antwort ist nicht LIVE: nicht dargestellt". |

Fünf Abrufe in drei Sekunden, **null HTTP-Fehler, null Konsolenfehler**,
acht Marken gesetzt (`working_observed`, `waiting`, `stopped · ok`,
`unknown`). Der Ton passt zum Feld: klein, in dessen eigener Schrift, ohne
Signalfarbe außer Rot für `blocked`.

## Zwei Konflikte mit dem Feldstand von heute

Beide sind heute Nachmittag entstanden, nach eurem Basisstand
`2b9c7150c20284103f00786dcaf34d0f2dc0f89b`. Keiner ist Forge anzulasten.

### K-A — Die Tafel sagt das Gegenteil dessen, was geschieht

Im Bild steht mitten im Feld **„LIVE — KEINE VERBINDUNG"**, während acht
Marken leben und der Adapter selbst „Transport: erreichbar" meldet. Die
Tafel verdeckt dabei Peter und Scout.

Der Grund ist ein Entwurfskonflikt, kein Fehler:

- Der Adapter **benutzt diese Tafel als seine Statusfläche**: `liveHinweis()`
  hängt `window.__agActivity.hinweis()` an — Transport, Quelle, Abdeckung,
  Kosten. Er braucht sie also offen.
- In Feldfassung 44 ist die Tafel genau umgekehrt gebaut. Sie erscheint
  nur noch, wenn Live gewählt **und noch nie etwas angekommen** ist:
  `var an = (MODUS === 'live') && !verbunden && !jeLZ;` Reißt eine
  Verbindung ab, die einmal stand, übernimmt der stille Punkt an der Uhr.

Da der Adapter `verbunden` und `jeLZ` nicht setzt, bleibt die Tafel für
immer offen — mit einer Aussage, die falsch ist.

### K-B — Zwei Vorstellungen davon, ob ein Strom lebt

Feldfassung 44 hat dafür einen Anschluss bekommen, den es bei eurem
Basisstand noch nicht gab:

```js
window.__agStrom = { an(), lebenszeichen(), aus(), stand() }
```

`lebenszeichen()` heißt „eines ist **empfangen** worden" — das Feld
erzeugt keinen eigenen Takt. Daran hängen der stille Punkt vor der Uhr
(atmet je Zeichen), der Zustand „veraltet" nach 20 Sekunden samt dem vom
Vertrag verlangten Satz, und das Schließen der lauten Tafel.

Der Adapter kennt diesen Anschluss nicht. Also bleibt der Punkt dunkel,
obwohl Daten fließen.

### Der Vorschlag, und er ist eine Zeile

In `annehmen()`, bei jeder angenommenen Antwort:

```js
if (window.__agStrom) window.__agStrom.lebenszeichen();
```

Damit schließt sich die Tafel von selbst, der Punkt atmet, und aus zwei
Entwürfen wird einer. Die Status-Angaben des Adapters (Transport, Quelle,
Abdeckung) brauchen dann ein anderes Zuhause — die Marke links oben oder
die Fortschrittsspalte rechts unten; beide sind beim Lesen aufklappbar.
Ich wende das **nicht** an; es ist Forges Datei.

## Zwei kleine Textbefunde

- `Quelle: keine Daten` **unmittelbar gefolgt von** `Abdeckung: teilweise`,
  ohne Trennung — im Bild zu sehen.
- `Quelle: keine Daten`, obwohl fünf Zeilen angekommen waren. Vermutlich
  fehlt in meiner Probe ein Zeitstempelfeld, das ihr benennen müsstet.

## Was die Probe nicht belegt

- **Es gibt keine Gegenstelle.** In `relay/` liegt kein `/activity`-Dienst,
  nur aufgezeichnete Beobachtungsdateien. Den Server habe ich für die Probe
  selbst gestellt. Heute läuft davon nichts.
- **Der Patch passt nicht mehr sauber.** Gegen Feldstand 45 nur mit
  Versatz-Toleranz: Hunks um 56, 69, 71, 435 und 495 Zeilen verschoben,
  einer mit Unschärfe 2. Er lässt sich nachziehen; sauber ist er nicht
  mehr.
- **Kein iPad, kein Safari, keine echte Last.** Chromium mit
  SwiftShader, ein Fenstermaß, fünf Zeilen Probedaten.

## Eine Einordnung, die ihr nicht erbeten habt

Der Adapter zeigt **Zustände an den Agenten**. Das Feld ist dafür gebaut,
**Bewegung zwischen ihnen** zu zeigen — Ball, Nachrichten, Artefakte,
Fortschritt. Nichts davon wird hiervon gespeist; im Bild stehen acht
belebte Namen über einem Projekt, das „noch keine Aufgabe eröffnet"
meldet und alle Zähler auf null hat. Das ist kein Vorwurf: Der Adapter
nennt sich selbst „Teilanbindung" und hält sich genau daran.

Es heißt nur, dass „Agentarium läuft live" damit noch nicht eingelöst ist.
Dafür braucht es den Arbeitsstrom — den, den der Vertrag V2 beschreibt,
oder etwas, das dieselbe Frage beantwortet.

## Nicht getan

Keine Datei von euch geändert, nichts angewandt, nichts gemergt, kein
kostenpflichtiger Lauf. Die Probe lief in einer Kopie außerhalb des
Repositoriums; eingecheckt sind nur das Probeskript und das Bild.
