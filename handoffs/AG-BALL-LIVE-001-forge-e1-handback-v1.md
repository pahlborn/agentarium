**CA_FEASIBILITY · AG-BALL-LIVE-001-FORGE-E1-V1 · Forge (coding-agent)**

**Ausgangsstand:** d111b062770e32dbef0f9bb618a4923d88ff20be, so wie es im Auftrag genannt ist. Ich habe ihn nicht überprüft: Ohne Shell konnte ich den Hash nicht bestätigen. Gelesen habe ich die Dateien unter `external/published-d111/`.

**Gelesen:** `AGENTS.md` und `governance/agentarium-rulebook-v1.2.md`, beide vollständig. Von `feld/index.html` (5931 Zeilen) die Zeilen 1–549, 700–1000, 4700–5138 und 5500–5930. Dazu `feld/sw.js` vollständig. Nicht gelesen habe ich die Tabelle `ARTEN`, `modusSetzen` und die Konstanten `LZ_TAKT`/`LZ_ALT`. Ihre Werte kenne ich also nicht.

**Was sich wiederverwenden lässt (aus dem Code gelesen):**
- **`window.__agEreignis(e)`** (Z. 5040): Das ist der richtige Eingang für ein Arbeitsereignis. Es prüft `actor` (muss ein bekannter Agent sein), `kind` (muss in `ARTEN` stehen), `title` sowie `recipient` bei den neun Kommunikationsarten. Bei Fehlern kommt `{angenommen:false, grund}` zurück, bei Erfolg `{angenommen:true, id}`. Verbrauch wird nur bei `belegt:true` übernommen, und zwar nur Token-Zahlen, nie Geld. Ein angenommenes Ereignis zählt auch als Lebenszeichen und startet den Ablauf. Für einen „Tool-Use-Start“ muss es eine passende Vertragsart in `ARTEN` geben. Ob es die gibt, weiß ich nicht.
- **`window.__agLauf(d)`** (Z. 5024): Setzt Projekt und Lauf. Pflicht ist nur `project_id`.
- **`window.__agStrom`** (Z. 4967): `an`, `lebenszeichen`, `aus` und `stand`. Die Seite erzeugt selbst kein Lebenszeichen, die Anzeige spiegelt also nur echte Eingänge.
- Alle drei Funktionen antworten nur, wenn `MODUS === 'live'`.
- **`?mvp=1`** (Z. 5703): Schaltet in den Live-Modus und holt genau einmal `one-event.json` von derselben Herkunft. Damit ruft es `__agLauf`/`__agEreignis` auf und zeigt beide Rückgaben in der Seite an, ohne Konsole. Das ist schon ein fertiger Prüfpfad.

**Die entscheidende Einschränkung:**
1. **Die Seite hat keinen Live-Transport.** Ich habe keinen EventSource-, WebSocket- oder Abfrage-Mechanismus gefunden. Ich habe aber nicht die ganze Datei gelesen und konnte nicht danach suchen; das ist also ein Befund aus den gelesenen Abschnitten. Die drei Funktionen sind nur auf `window` erreichbar. Ein lokaler HTTP-Empfänger auf dem Host kann nichts in die Seite schieben. Die veröffentlichte Seite läuft über HTTPS (GitHub Pages). Ein `http://`-Empfänger im lokalen Netz wäre dort gemischter Inhalt und würde blockiert. Und `localhost` auf dem iPad meint das iPad selbst.
2. **Der Service Worker liefert veraltete Daten (direkt aus `sw.js` abgeleitet, nicht getestet).** Er fängt jede GET-Anfrage derselben Herkunft ab, sucht im Cache mit `ignoreSearch:true`, liefert zuerst die Cache-Kopie und speichert jede erfolgreiche Antwort. `one-event.json` und jede spätere Live-Datei würden also ab dem zweiten Laden aus dem Cache kommen. Das `cache:'no-store'` der Seite schützt davor nicht. Abfragen über diesen Worker würden alte Ereignisse als neu zeigen.
3. **Was dieser Lesebeweis nicht zeigt:** Er belegt, dass sich die Ereignisform an die Funktionen anschließen lässt. Er belegt nicht den Weg Host → Empfänger → Seite, kein gerendertes Bild, keine Abweichungen zur Originalseite und kein iPad. Mein Lesen war echte Arbeit, aber kein Beweis, dass der Host oder Empfänger funktioniert. Die Weiterleitung habe ich weder beobachtet noch getestet.

**Nächster technischer Schritt (Verantwortlich: Atlas; muss von einem freigegebenen Testausführer laufen, nicht von mir):**
Ein lokaler Durchlauf mit einem echten Ereignis:
- Der Empfänger schreibt die weitergeleiteten Tool-Use-Metadaten, unverändert gemappt, als `{run, event}` in `one-event.json`.
- Er stellt diese Datei zusammen mit `feld/` von derselben Herkunft bereit.
- Die Seite wird mit `?mvp=1` in einem echten Browser geöffnet, ohne registrierten Service Worker oder mit frischem Profil.
- Festgehalten werden `window.__agMvp` mit `lauf` und `ereignis`, angenommen oder `grund`.

Bei Abweisung zeigt `grund` die Lücke im Mapping, zum Beispiel ein unbekanntes `kind`. Erst danach würde ich einen Transport entscheiden, etwa eine HTTPS-Abfrage oder SSE von derselben Herkunft. Dazu gehört dann eine Änderung am Worker, die Live-Pfade vom Cache ausnimmt. Beides wäre Umsetzung und braucht eine eigene Freigabe.

**Grenzen:** Tests: NOT_RUN durch mich. Nichts geändert, nichts umgesetzt, nichts veröffentlicht. Annahmen: Ich nehme an, dass der Pfad `published-d111` dem genannten Hash entspricht und dass die Zeilen, die ich nicht gelesen habe, keinen Transport enthalten.

**Nächster Verantwortlicher:** Atlas, um den Testausführer für den Durchlauf oben zu organisieren.