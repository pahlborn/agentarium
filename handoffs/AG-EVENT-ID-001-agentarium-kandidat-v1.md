# AG-EVENT-ID-001 — Empfängerkandidat V1
18.10.2026 · Antwort auf `AG-EVENT-ID-001-atlas-entscheidung-v1`
Status: **Kandidat zur Prüfung.** Kein Merge, keine Veröffentlichung, keine
Vergabelogik, kein Produzent. Peter prüft vor Umsetzung in den Monitor.

## Source-/Build-Weg — vorab, weil ausdrücklich verlangt
Basis `ea0e64fbc1c2d29a97117c51f298ada0e78a0593`, Zweig
`claude/ag-event-id-001-kandidat`.

**Die beiden F51-Dateien wurden direkt bearbeitet.** Mein Generator
(`schicht.py`) steht bei Fassung 46 und kennt die geprüften F51-Funktionen
nicht; ein Neuaufbau daraus hätte sie verloren. Das war die Warnung in der
Entscheidung, und sie ist befolgt. `feld/index.html` F47 ist **unberührt**.

## Geändert
| Datei | was |
|---|---|
| `pilot/github-live/github-live.js` | `ADAPTER` v1.3 → v1.4, `OPTIONAL` um `short_ref`, kanonische Rückprobe, Zählung, Weitergabe, `__agGithub.kann` |
| `pilot/github-live/index.html` | Brücke `kurzreferenz`, Rückprobe in der Aufnahme, `E.kurz`, Anzeige in Liste und Blasenkopf, Herkunftszeile kopierbar, CSS |

**Nicht geändert: `FASSUNG` (51), `GEBAUT`, `sw.js` (`agentarium-v51`).** Dazu
unten mehr — das ist Absicht und zugleich die wichtigste Grenze.

## Kanonische Schreibweise — Rückprobe statt Muster
Das in meiner ersten Rückmeldung vorgeschlagene `^ID[0-9]{4,}$` war zu locker;
es ließ `ID00001` durch. Statt eines Musters prüft der Kandidat auf die
eigene kanonische Form zurück:

```js
function kurzKanonisch(s) {
  if (typeof s !== 'string' || !/^ID[0-9]{1,12}$/.test(s)) return '';
  var n = Number(s.slice(2));
  if (!(n >= 1)) return '';
  var soll = 'ID' + (n < 10000 ? ('000' + n).slice(-4) : String(n));
  return (soll === s) ? s : '';
}
```

Die Stellenzahl ist **vor** der Umwandlung begrenzt — keine ungesicherte
Ganzzahlkonvertierung. Dieselbe Funktion steht in Adapter **und** Aufnahme;
die Aufnahme verlässt sich nicht auf eine vorgelagerte Prüfung.

## Versionierte Empfängerfähigkeit
Die vorhandene Mechanik wurde benutzt, kein neuer Dienst:

- Brücke: `kurzreferenz: 'short_ref-v1'` neben dem schon vorhandenen
  `kommunikation: 'beobachtet-v1'`
- Adapter: `__agGithub.kann === ['short_ref']`, dazu `version` v1.4

Ein alter offener Tab hat beides nicht — und sein Adapter weist ein Ereignis
**mit** dem Feld vollständig ab. Daran ändert der Kandidat nichts; er macht
den Unterschied nur **erkennbar**.

## Ausgeführte Prüfungen — alle synthetisch
Keine Kunden-Live-Abnahme. Kein echtes Ereignis mit `short_ref` ist je durch
den GitHub-Weg gelaufen, weil es keinen Produzenten gibt.

**Rückprobe, beide Umsetzungen, 14 Fälle:** `ID0001`, `ID9999`, `ID10000`,
`ID123456789012` angenommen; `ID00001`, `ID0000`, `ID1`, `ID01`, `id0001`,
`ID 0001`, `IDx001`, `""`, `"ID"`, 13-stellig abgewiesen. 14 von 14 richtig,
Adapter und Aufnahme stimmen überein.

**Aufnahme im echten Browser**, neun Fälle, alle **angenommen** — auch die mit
ungültiger Kurzreferenz, wie der Vertrag verlangt: ohne Feld, `ID0001`,
`ID9999`, `ID10000`, `ID00001`, `ID0000`, `ID1`, Zahl statt Text, leer.
Doppelt geliefertes Ereignis: beide Male dieselbe Kurzreferenz, keine
Neunummerierung.

**Anzeige, vier Größen** — 1440×900, 1194×834, 834×1194, 844×390: Kurzreferenz
in der Liste sichtbar, Herkunftszeile vorhanden, **kein Querlauf**, keine
Konsolenfehler.

**Sprechblase, gemessen statt vermutet:** 210×109 px **mit und ohne**
Kurzreferenz — identisch. Sie steht in der kurzen Kopfzeile und lässt die
Blase nicht wachsen. Keine Überlagerung.

**Kopieren:** Antippen der Herkunftszeile legt sie in die Zwischenablage
(geprüft: Inhalt stimmt), meldet kurz „kopiert" und stellt den Text danach
wieder her. Schlägt das Kopieren fehl, wird markiert statt gelogen.

## Verbleibende Grenzen
1. **Die Fassungsnummer ist nicht gesetzt — mit Absicht.** `github-live.js`
   wird mit `?v=' + FASSUNG` geladen und `sw.js` hält `agentarium-v51` als
   **von Hand gepflegte Zweitschrift**. Daraus folgt: Der neue Adapter
   erreicht ein Gerät **nur**, wenn beim Veröffentlichen `FASSUNG`, `GEBAUT`
   und `VORRAT` **gemeinsam** erhöht werden. Welche Nummer das ist, gehört
   dem, der veröffentlicht — ein Kandidatenzweig darf sie nicht belegen,
   sonst greifen zwei Zweige nach derselben.
2. Keine Vergabelogik, kein Produzent, kein Archivleser, keine Kostenänderung.
3. Alte offene Tabs bleiben unverändert gefährdet; der Kandidat macht es
   sichtbar, nicht ungefährlich.
4. `ADAPTER` auf v1.4 gesetzt (additiv, rückwärtsverträglich) — bitte
   bestätigen, falls die Nummernvergabe woanders liegt.

---

# Nachtrag V2 — Korrektur nach Atlas-Review von PR #17
18.10.2026 · Review `9e7bc03` zu Kandidat `2a8fa7f`

## Der Befund war berechtigt
Die Aufnahme schrieb den Grund einer verworfenen Kurzreferenz in zwei
**private** Variablen, `kurzAbgewiesen` und `kurzLetzterGrund`. Geschrieben,
aber von außen unerreichbar — weder über Rückgabe, Getter, Brücke noch
Oberfläche. Argus und Sentinel haben das unabhängig bestätigt.

Eine Diagnose, die niemand lesen kann, ist keine. Ich hatte sie geschrieben
und die Tür dazu vergessen.

## Korrektur
Die beiden privaten Variablen sind **entfernt**. Der Hinweis geht jetzt mit
der **erfolgreichen Rückgabe** von `__agEreignis` zurück:

```js
return kurzHinweis ? { angenommen: true, id: E.id, hinweis: kurzHinweis }
                   : { angenommen: true, id: E.id };
```

Begrenzt und maskiert: höchstens 24 Zeichen, nur sichtbares ASCII.

```js
function kurzMaskiert(v) {
  return String(v).replace(/[^\x20-\x7E]/g, '.').slice(0, 24);
}
```

Keine neue Oberfläche, kein neuer Dienst, keine weitere Produktänderung.

## Prüfung — wiederholbar
`node test_hinweis.js` gegen den Piloten auf `127.0.0.1`, direkter Aufruf
von `window.__agEreignis`:

| Fall | angenommen | ID erhalten | Hinweis |
|---|---|---|---|
| ohne Feld | ja | ja | — |
| `ID0001` · `ID9999` · `ID10000` | ja | ja | — |
| `ID00001` · `ID0000` · `ID1` | ja | ja | ja |
| Zahl `4711` · leer | ja | ja | ja |
| mit Steuerzeichen | ja | ja | ja, maskiert zu `ID00.01` |
| 62 Zeichen lang | ja | ja | ja, auf 24 gekürzt |

**11 von 11 wie vereinbart**, keine Konsolenfehler.

**Unverändert nachgeprüft:** Rückprobe 14/14 in Adapter und Aufnahme
identisch; Anzeige auf vier Größen ohne Querlauf; `feld/` F47 und
`pilot/github-live/sw.js` ohne jede Änderung.

## Versionen
`ADAPTER` bleibt `AG-GH-LIVE-001-v1.4` (bestätigt). `FASSUNG` bleibt 51,
`GEBAUT` und `VORRAT` unverändert — die Veröffentlichungsnummer nimmt dieser
Zweig nicht vorweg.

## Grenze, die bestehen bleibt
Alles synthetisch. Sentinels Browserregression war mangels Chromium-Laufzeit
blockiert; meine Browserprüfungen sind damit **nicht unabhängig bestätigt**.
Es gibt weiterhin keinen Browser- oder Kunden-Live-PASS.

---

# Nachtrag V3 — Nachweisskript im Zweig
18.10.2026 · auf Anforderung von Atlas, PR #17

## Datei und Aufruf
```
previews/AG-EVENT-ID-001/pruefen.js
```

Startbefehl, aus der Wurzel des Repositorys:

```
node previews/AG-EVENT-ID-001/pruefen.js
```

## Voraussetzung — ausdrücklich genannt
Das Skript **installiert nichts** und lädt nichts herunter. Es setzt voraus:

- Node.js
- das npm-Paket `playwright` (nur die Bibliothek)
- eine **bereits vorhandene lokale Chromium-Laufzeit**

Der Pfad wird so bestimmt — **geraten wird nichts**:

1. `AG_CHROMIUM`, falls gesetzt. Muss eine vorhandene, **ausführbare Datei**
   sein. Ist sie es nicht, endet der Lauf mit Rückgabe 2; es wird *nicht*
   heimlich ein anderer Browser genommen.
2. sonst die von Playwright selbst gemeldete ausführbare Datei
   (`chromium.executablePath()`), ebenso geprüft.

**Fehlt die Laufzeit, endet das Skript mit Rückgabe 2 — „ungeprüft".** Nicht
bestanden und nicht durchgefallen. Genau daran ist Sentinels Lauf gescheitert,
und das soll sichtbar bleiben statt als Erfolg durchzugehen. Teil A läuft auch
ohne Browser.

## Rückgabewerte
| | |
|---|---|
| `0` | alles wie vereinbart |
| `1` | Abweichung |
| `2` | ungeprüft (Browser fehlt) |

## Erwartbare Ausgabe
19 Zeilen, alle mit `ok`, danach:

```
ALLES WIE VEREINBART — keine Abweichung.
Alle Prüfungen sind synthetisch. Keine Kunden-Live-Abnahme.
```

**Teil A** — kanonische Rückprobe in Adapter und Aufnahme, ohne Browser:
`14 von 14 richtig und identisch`.

**Teil B** — elf direkte `__agEreignis`-Aufrufe: alle angenommen, technische
ID erhalten, Hinweis nur bei ungültiger Kurzreferenz. Dazu zwei Messungen:
62 Zeichen werden auf **24** gekürzt, ein Steuerzeichen wird zu **`ID00.01`**
maskiert.

**Teil C** — Anzeige auf 1440×900, 1194×834, 834×1194, 844×390: Kurzreferenz
`ID0042` sichtbar, kein Querlauf, keine Konsolenfehler.

## Nachtrag V4 — zwei Korrekturen am Skript (Atlas-Re-Review `e4b2b9d`)

**1 — Teil B vergleicht die zurückgegebene ID jetzt exakt.** Vorher wurde nur
auf „nicht leer" geprüft; eine falsche ID wäre grün geblieben. Ein Test, der
milder ist als sein Gegenstand, ist keiner. Jede Zeile nennt nun die erwartete
ID (`K-0` … `K-10`), und die Ausgabe zeigt sie.

**2 — Die Browserauflösung übergibt kein Verzeichnis mehr.** Die erste Fassung
riet `$PLAYWRIGHT_BROWSERS_PATH/chromium` und `/opt/pw-browsers/chromium`.
Beides sind je nach Installation **Verzeichnisse** — als `executablePath`
ergibt das `EACCES` statt eines sauberen „ungeprüft". Jetzt wird auf
**Datei und Ausführbarkeit** geprüft (`statSync().isFile()` plus
`accessSync(X_OK)`), und bei Fehlschlag endet der Lauf mit Rückgabe 2.

Nachgemessen, Rückgabewerte ohne Pipe ermittelt:

| Fall | Rückgabe |
|---|---|
| `AG_CHROMIUM` zeigt auf ein Verzeichnis | **2** |
| `AG_CHROMIUM` zeigt ins Leere | **2** |
| `AG_CHROMIUM` zeigt auf eine nicht ausführbare Datei | **2** |
| ohne `AG_CHROMIUM`, Browser vorhanden | **0** |

In allen drei Fehlerfällen läuft Teil A weiter durch (14/14) und die Meldung
nennt den Grund. Kein `EACCES`.

## Keine Produktänderung
Das Skript liegt unter `previews/`, wird von nichts geladen und ändert weder
den Piloten noch `feld/` noch den Service Worker.
