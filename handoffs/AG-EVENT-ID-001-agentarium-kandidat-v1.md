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
