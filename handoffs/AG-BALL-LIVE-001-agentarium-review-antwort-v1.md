# AG-BALL-LIVE-001 — Review des Agentarium-Agenten

AG-BALL-LIVE-001-AGENTARIUM-REVIEW-V1, Antwort Version 1 · 2026-10-17T07:30:00Z
Status: **REVIEW_ONLY — nichts umgesetzt, nichts gemergt, nichts veröffentlicht.**
Auftrag: `handoffs/AG-BALL-LIVE-001-AGENTARIUM-REVIEW-v1.{md,json}` auf
`agent/ball-live-concept-20261017`
Geprüfte Baseline: `c7a8da04d9b06d83edcd110f210c0cf84d4aa8ba`
Geprüfter Patch: `forge-original-c2.patch`,
SHA-256 `0abe225d74e2814cde3b0deafcc4c9a6d17c1fb1bfdfeeb697b82f17e94036bc`

**Peters Prämisse, die über allem steht:** Der bestehende funktionale Umfang
im UI wird nicht verändert. Wenn alle Stricke reißen, müssen Archiv- und
Demo-Modus weiterhin funktionieren.

---

## Urteil A: CHANGES_REQUESTED

Zwei Befunde. Einer davon ist **blockierend und nicht Forge anzulasten** — er
betrifft etwas, das er nicht wissen konnte.

### Was der Patch richtig macht

Ich sage das zuerst, weil es substantiell ist und beim Lesen einer
Mängelliste sonst untergeht.

**Peters Prämisse ist strukturell erfüllt.** `BALL_LIVE = false`; die Live-Art
`progress`, das Laden von `live.js` und der Impuls existieren **nur** bei
`?ball_live=1`. Ohne den Parameter ist das Feld Zeichen für Zeichen das
bisherige. Demo und Archiv sind unberührt — nicht durch eine Zusicherung,
sondern durch die Bauform. Das ist der schwierigste Teil, und er stimmt.

Weiter belegt:

- **Keine Parallelwelt.** `live.js` benutzt die vorhandenen Griffe
  `__agLauf`, `__agEreignis`, `__agStrom`, statt einen zweiten Weg ins Feld
  zu bauen.
- **Strenge Annahme.** Bekannte Agenten, `KINDS = {progress:1}`,
  Herkunftsliste, Kennungs- und Werkzeugmuster, Titellänge. Was nicht passt,
  wird abgewiesen statt gebogen.
- **Ehrlich im Schweigen.** „Stille heißt: keine aktuelle Aktivität
  beobachtet — nicht untätig, nicht fertig." Lücken, Veralten und Herkunft
  werden benannt, nicht geglättet.
- **Die Fassungsteilung c2/c1 ist korrekt gelöst.** Ich habe sie gezielt
  geprüft, weil der Auftrag danach fragt: Der Patch führt `SERVER_VERSION`
  ein und vergleicht das `hello` des Servers dagegen, während Seite und
  `live.js` untereinander `VERSION` prüfen. Konsistent in Seite, `live.js`
  **und** Test. Kein Befund.
- **Der Impuls ist wahrheitsgemäß.** 1,4 s, `forwards`, klingt vollständig
  ab, genau einer je angenommenem Ereignis. Kein Dauerzustand „arbeitet".
  Novas Leitplanke ist eingehalten.
- Kein `eval`, kein Token im Browser, gleiche Herkunft.

### B-1 — blockierend · Der Patch ändert die GEBAUTE Datei

`feld/index.html` ist **kein Quelltext**. Sie wird erzeugt:

```
agentarium.html + schicht.py  →  agentarium-fertig.html
                              →  pages.py  →  feld/index.html
```

Meine Baukette kennt `live.js`, `BALL_LIVE`, `ARTEN.progress` und
`arbeitsImpuls` **nicht** — nachgesehen: null Treffer in `schicht.py` und
`pages.py`.

**Folge: Die nächste reguläre Fassung löscht die gesamte Livearbeit.**
Lautlos, ohne Konflikt, ohne Fehlermeldung. `pages.py` schreibt
`feld/index.html` neu, und alles Handgesetzte ist weg.

Das ist bereits geschehen: Die Baseline trägt `FASSUNG = '47'` in der
erzeugten Datei, während mein Generator bei 46 steht. Erzeugte und
handgepflegte Fassung sind auseinandergelaufen.

**Minimale Korrektur** (meine Arbeit, nicht Forges):

| Datei | was hinein muss |
|---|---|
| `previews/AG-VISUAL-005-feld/agentarium.html` | die CSS-Regeln und das DOM der Tafel |
| `previews/AG-VISUAL-005-feld/schicht.py` | `BALL_LIVE`, `ARTEN.progress`, `arbeitsImpuls()` |
| `previews/AG-VISUAL-005-feld/pages.py` | `live.js` ins Bündel kopieren |

Danach entsteht `feld/index.html` **mit** der Livefähigkeit und übersteht
jede weitere Fassung. Forge konnte das nicht wissen; die Baukette liegt in
meinem Zweig.

### B-2 — zu korrigieren · Die Tafel in `#agRechts` verkleinert den Ring

Nachgesehen, nicht vermutet:

```js
function kopfUnten() {
  var e = document.getElementById('agRechts');
  return e.getBoundingClientRect().bottom > 20 ? … : 150;
}
hoch = schmal() ? (H() * 0.48 - (kopfUnten() + 18)) / 0.92 : …
```

Der Patch hängt die Tafel in **genau dieses** Element:

```js
(document.getElementById('agRechts') || document.body).appendChild(tafel);
```

Die Tafel hat `max-height:38vh`. Aufgeklappt wächst `#agRechts` erheblich,
`kopfUnten()` steigt, und auf schmalen Schirmen **schrumpft der Ring**. Das
ist die Fehlerklasse, die am 16.10. über fünfzehn Fenstergrößen auf null
gebracht wurde (`mess-spanne.js`, `mess-namen.js`): zu kleiner Ring heißt,
dass sich neun Agentennamen gegenseitig decken.

AG-BL-UI-01 wäre damit behoben und eine neue Kollision eingeführt — genau
die Frage, die der Auftrag unter „Besonders zu prüfen 1" stellt.

**Minimale Korrektur, zwei Möglichkeiten:**

1. `kopfUnten()` misst `#agKopf` statt `#agRechts`. Ein Wort, und die
   Ringgeometrie hängt nicht mehr an einem aufklappbaren Element.
2. Oder die Tafel bekommt einen eigenen festen Platz mit **gemessenem**
   Abstand, wie ihn Liste, Fortschritt und Knopfleiste schon haben
   (`--agTastenH`).

Ich empfehle 1: kleiner, und sie beseitigt die Ursache statt des Symptoms.

**Belastbar wird das erst durch Messung**, nicht durch Argument:
`mess-spanne.js` und `mess-namen.js` müssen mit `?ball_live=1` laufen,
**zugeklappt und aufgeklappt**, und 0 von 15 Größen ergeben.

### Was ich NICHT geprüft habe

- **Keinen Browserlauf.** Ich habe gelesen und nachgerechnet, nicht
  ausgeführt. Forge hat ebenfalls nichts ausgeführt.
- **Kein iPad, kein Safari.** Entsprechend keine Aussage „iPad-tauglich".
- **Die 57 bestehenden Prüfungen** habe ich nicht laufen lassen; der Patch
  fasst den Test an, also müssen sie laufen.
- **Barrierefreiheit** nur oberflächlich: `details/summary` ohne Marker ist
  mit Tastatur bedienbar; ob die Tafel in der Vorlesereihenfolge an
  sinnvoller Stelle steht, ist ungeprüft.

---

## B — Der Pilotweg

### Der LAN-Weg scheidet als Ende-zu-Ende-Pilot aus

Der Auftrag verlangt ausdrücklich, ihn abzulehnen, falls der ausgehende
Mechanismus fehlt. **Er fehlt.**

Eure Rollen laufen in GitHub-gehosteten Runnern in der Cloud. Ein solcher
Runner kann eine private LAN-Adresse in Peters Wohnung nicht erreichen —
nicht wegen einer Einstellung, sondern weil es keinen Weg dorthin gibt.
Ohne Tunnel oder gehostetes Relay gibt es keinen Outbound-Pfad von Actions
ins Heimnetz.

Der LAN-Kandidat ist damit ein **lokaler** Pilot: wertvoll als Beweis der
Darstellungskette, untauglich als Ende-zu-Ende-Nachweis.

### Empfohlener Weg: GitHub selbst ist das Relay

Der einzige vollständige Weg, der **heute** und **ohne verbotene Mittel**
geht — kein Hoster, kein Tunnel, kein Konto, kein Server.

```
reale Agentenaktion
  → relay/*_once.py (läuft bereits im Job, macht bereits ausgehende HTTPS-Aufrufe)
  → GitHub-Kommentar mit strukturiertem JSON   ← geschieht heute schon
  → api.github.com  (Access-Control-Allow-Origin: *, gemessen)
  → bereits geöffneter Monitor auf dem iPad
  → __agEreignis → Ball, Namen, Fortschritt
```

| | |
|---|---|
| **Laufort** | kein neuer Prozess; der Relay im bestehenden Actions-Job |
| **Start/Stop** | lebt und stirbt mit dem Job; kein Dauerdienst |
| **Netzweg** | ausgehend HTTPS Runner → GitHub; Browser → `api.github.com` |
| **TLS** | durchgehend HTTPS, keine Mixed-Content-Grenze |
| **Authentifizierung** | keine nötig (öffentliches Repository), 60 Abrufe/Stunde. Optional ein nur-lesender Schlüssel im Gerätespeicher: 5000/Stunde |
| **Erlaubte Felder** | `role→actor`, Überschrift→`title`, `actual_model`/Token→`verbrauch`, Zeitstempel→Reihenfolge. Was nicht sicher lesbar ist, wird **abgewiesen und gezählt**, nicht geraten |
| **Ausfallbild** | Grenze erreicht → „Abrufgrenze, N Minuten"; kein Lauf → Stille plus der vorhandene hohle Punkt; nicht lesbar → abgewiesen, sichtbar gezählt |
| **Einmalige Handlung auf dem iPad** | die bestehende Seite mit `?live=github` öffnen. Sonst nichts |

**Ehrliche Einordnung der Geschwindigkeit:** Das ist kein Push. Während
eines Laufs wird sekündlich abgefragt — Auflösung eine Sekunde, und die
Läufe dauern 8 bis 24 Sekunden, werden also vollständig gesehen. Der
Laufbeginn wird sofort bemerkt, **weil Peter ihn selbst auslöst**. Zwischen
den Läufen geschieht nichts, was man verpassen könnte.

**Qualitätsgrenze:** Die Kommentare sind Prosa mit JSON darin. Sauber
herauszulesen sind Rolle, Modell, Kosten, Zeit und Reihenfolge. Der
Inhalt einer Übergabe bleibt eine Überschrift, kein Satz.

### Der bessere Weg, sobald er autorisiert ist

Fünf Zeilen im Relay, die das Ereignis **in Vertragsform** ausgeben, statt
dass der Monitor es aus Prosa zurückübersetzt — an ein gehostetes Relay
oder einen Nachrichtendienst, SSE zum Monitor. Das ist der Weg, für den
Vertrag V2 geschrieben wurde. Er braucht die Entscheidung über Hoster,
Datenschutz und Betrieb, die dieser Auftrag ausdrücklich ausschließt.

---

## Spätere Änderungsdateien

| Datei | Änderung |
|---|---|
| `previews/AG-VISUAL-005-feld/agentarium.html` | CSS und DOM der Tafel, Impulsebene |
| `previews/AG-VISUAL-005-feld/schicht.py` | `BALL_LIVE`, `ARTEN.progress`, `arbeitsImpuls()`, `kopfUnten()` auf `#agKopf` |
| `previews/AG-VISUAL-005-feld/pages.py` | `live.js` ins Bündel |
| `feld/live.js` | wie von Forge, plus Platzierung der Tafel |
| `tests/AG-BALL-LIVE-001-local-live.cjs` | wie von Forge |
| `previews/AG-VISUAL-005-feld/mess-spanne.js` | Lauf mit `?ball_live=1`, zu- und aufgeklappt |

**Nicht angefasst:** `feld/index.html` von Hand. Nie wieder.

## Testplan

1. **Rückfallprobe zuerst:** ohne `?ball_live=1` ist die gebaute Datei
   zeichengleich der vorigen Fassung. Demo und Archiv unverändert. Das ist
   Peters Prämisse, und sie wird gemessen, nicht zugesichert.
2. Die 57 bestehenden Prüfungen, unverändert grün.
3. `mess-spanne.js` über 15 Größen mit Tafel **zu** und **auf**: 0 Befunde.
4. `mess-namen.js`, 14 Stichproben, drei Geräte: 0 Überdeckungen.
5. Probe ohne WebGL: 0 Fehler.
6. PWA offline: lädt mit neun Agenten.
7. Der lokale Livetest, den Forge nicht ausgeführt hat.
8. Echtes iPad, Safari — ohne das keine Aussage zur iPad-Tauglichkeit.

## Kosten- und Betriebsrahmen

- **UI-Korrektur:** keine Modellkosten. Rechenzeit für die Messläufe.
- **GitHub-Weg:** kostenlos, kein Betrieb, keine Konten.
- **Gehostetes Relay (später):** Gratistarif oder etwa 4 €/Monat, dazu
  Betrieb, Authentifizierung und eine Datenschutzentscheidung.
- **Kostenanzeige im Produkt** bleibt deaktiviert; der Vertrag führt im
  Verbrauch ohnehin kein Geld.

## Offene Risiken und Entscheidungen

| | |
|---|---|
| **R-1** | Ohne B-1 löscht die nächste Fassung die Livearbeit. Lautlos. |
| **R-2** | B-2 ist argumentiert, nicht gemessen. Vor einer Umsetzung messen. |
| **R-3** | Niemand hat auf einem echten iPad geprüft — weder Forge noch ich. |
| **E-1** | Hoster/Tunnel: offen, hier nicht autorisiert. Peter entscheidet. |
| **E-2** | Lesender GitHub-Schlüssel im Gerät: ja oder nein. Ohne ihn zwei Läufe je Stunde. |
| **E-3** | Reicht „Rolle, Modell, Kosten, Zeit" als Live-Inhalt, oder braucht es die Relay-Ergänzung für echte Vertragsereignisse? |

**Es wurde nichts umgesetzt, nichts angewandt, nichts gemergt und nichts
veröffentlicht.** Der Patch liegt unverändert; geprüft wurde durch Lesen,
Nachrechnen und Vergleich gegen die Baseline.
