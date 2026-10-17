# AG-BALL-LIVE-001 — Re-Review der Agentarium-Antwort

Stand: 17.10.2026, 20:20 Uhr Europe/Berlin  
Bezug: `AG-BALL-LIVE-001-agentarium-review-antwort-v1.md` auf Commit `1dd40dfe7b7101f67bf682ceb689223aa9c47f0b`  
Status: **FAIL / KORREKTUR ERFORDERLICH — nichts umsetzen**

Die Antwort enthält einen wichtigen richtigen Befund: Die Live-Erweiterung darf nicht nur in der erzeugten `feld/index.html` stehen. Sie muss in die tatsächliche Bauquelle zurückgeführt werden. Der Review übersieht jedoch einen Server-Startblocker und empfiehlt einen GitHub-Pollingweg, der das Liveziel nicht erfüllt.

## 1. Bestätigt: Generatorverlust ist real, Zuordnung aber unvollständig

`previews/AG-VISUAL-005-feld/pages.py` löscht sein Zielverzeichnis und erzeugt `index.html` neu. `schicht.py` enthält die Live-Erweiterung nicht. Eine nur handgepflegte `feld/index.html` wäre beim nächsten regulären Bau gefährdet.

Korrekturen zum Review:

- Die im Diagramm genannte `agentarium.html` existiert im gepinnten Baum nicht. Die vorhandene Eingabe ist `previews/AG-VISUAL-005-feld/resonanz-maschine.html`; `schicht.py` erzeugt daraus `agentarium-fertig.html`, `pages.py` daraus das Pages-Bündel.
- Die genannten `mess-spanne.js` und `mess-namen.js` existieren am gepinnten Commit nicht. Ein Testplan darf sie nicht als vorhandene Werkzeuge behandeln.
- Die Rückführung muss vollständig benennen: CSS/DOM, `BALL_LIVE`, Kandidatenkennung, Aktivierungs- und Ladeblock, `ARTEN.progress`, Namensanker, `arbeitsImpuls()`, Service-Worker-Ausnahme und die dauerhafte Quelle von `live.js`.
- Fassung 46 im Generator und 47 im Produkt beweist Divergenz, nicht für sich allein einen bereits erfolgten Löschvorgang.

## 2. Blocker: c2 startet mit dem unveränderten Server nicht

Der Review erklärt die Aufteilung „Seite/live.js c2, Server c1“ ausdrücklich für korrekt. Das ist falsch.

`pilot/AG-BALL-LIVE-001/local_server.py` prüft vor dem Start, ob sein eigenes Literal `AG-BALL-LIVE-001-c1` sowohl in `index.html` als auch in `live.js` vorkommt. Forges Patch ersetzt das einzige c1-Literal der `index.html` durch c2. Ergebnis: Der Server verweigert den Start **vor** dem SSE-`hello`.

Die Trennung von Seiten- und Protokollversion kann sinnvoll sein, muss aber im Serverguard explizit modelliert werden. Der Server gehört deshalb in den späteren Korrekturumfang. Abnahme: echter Serverstart, Browserverbindung und ein angenommenes Ereignis auf der gebauten Fassung.

## 3. Geometriebefund: plausible Abhängigkeit, Wirkung noch ungemessen

Ein höheres `#agRechts` verkleinert die Höhenobergrenze des Rings nur bei `W() < 560`. Ob der Ring tatsächlich schrumpft oder Namen kollidieren, hängt zusätzlich vom Breitenlimit und Mindestwert ab. Der Review formuliert eine neue Kollision als Tatsache, obwohl kein Browserlauf stattfand.

Auch die vorgeschlagene Änderung von `kopfUnten()` auf `#agKopf` ist noch keine freigegebene Lösung: Die Tafel braucht weiterhin realen Platz. Zuerst müssen offene und geschlossene Tafel über die tatsächlich vorhandenen Geräte-/Fenstergrößen gemessen werden; danach ist die kleinste Geometriekorrektur zu wählen.

## 4. Blocker: GitHub-Kommentar-Polling ist kein vollständiger Livepilot

Scouts reale und dokumentierte Prüfung bestätigt zwar CORS (`Access-Control-Allow-Origin: *`), widerlegt aber die Betriebsannahme:

- anonymes GitHub-REST-Limit: 60 Requests pro Stunde und Ausgangs-IP;
- 1-Hz-Polling benötigt 3.600 Requests pro Stunde;
- ein gemessener anonymer `304 Not Modified` verbrauchte ebenfalls einen Request;
- die gemessenen Kommentarantworten tragen `Cache-Control: public, max-age=60, s-maxage=60`;
- ein Lesetoken im Browser oder `localStorage` wäre durch gleichursprüngliches JavaScript/XSS lesbar und braucht eine bewusste Risikoentscheidung;
- iOS kann Hintergrund-Tabs und Timer drosseln oder suspendieren.

Noch schwerer wiegt die fachliche Lücke: Der vorhandene Forge-Relay veröffentlicht `HOST_RECEIVED`, blockiert dann während der Claude-Ausführung und veröffentlicht erst danach `RESULT_READY`. Beim geprüften Lauf dauerte diese Ausführung 350,419 Sekunden, nicht 8–24 Sekunden. Dazwischen entstehen keine GitHub-Kommentare über tatsächliche Arbeitsschritte. Für ChatGPT-Subagenten ist gar kein Produzent benannt. Das ist Start-/Endestatus, keine laufende Teamaktivität.

„Peter löst den Lauf selbst aus“ ist für autonome Teamarbeit keine zulässige Liveerkennung. GitHub-Kommentare können als beaufsichtigter Transportversuch dienen, aber nicht als Beweis, dass ein bereits geöffneter Monitor autonome Arbeit nahezu in Echtzeit sieht.

Primärquellen:

- [GitHub REST API rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)
- [GitHub REST API best practices / conditional requests](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api)
- [GitHub CORS](https://docs.github.com/en/rest/using-the-rest-api/using-cors-and-jsonp-to-make-cross-origin-requests)
- [GitHub credential security](https://docs.github.com/en/rest/authentication/keeping-your-api-credentials-secure)
- [WebKit background behavior](https://webkit.org/blog/8970/how-web-content-can-affect-power-usage/)

## 5. Korrekturauftrag an den Agentarium-Agenten

Bitte antworte mit Version 2 des Reviews. Noch nichts implementieren.

1. Benenne die tatsächlich vorhandene Baukette und die vollständigen Quelländerungen, die einen Neubau überstehen. Verwende keine nicht vorhandenen Dateien als Testvoraussetzung.
2. Korrigiere den Versions-/Serverguard so, dass Page-, Client- und Protokollversion explizit sind. Nenne den minimalen späteren Datei- und Testumfang.
3. Formuliere den Geometriebefund als ungemessen und definiere eine reproduzierbare Messprobe, bevor eine Lösung gewählt wird.
4. Verwirf 1-Hz-GitHub-Kommentar-Polling ohne Token als Livearchitektur. Falls GitHub für einen engen Transportversuch verbleibt, beschreibe ehrliche Aktualisierungsrate, Cachekontrolle, Rate-Limit-Stopp und ausschließlich öffentlich zulässige Felder.
5. Lege für den eigentlichen Pilot **eine vollständige Kette** vor: reales `tool_use`-/Arbeitsereignis aus Claude sowie ein reales ChatGPT-Subagentenereignis → normalisierter V2.1-Datensatz → sicherer Transport → bereits geöffneter iPad-Monitor → sichtbarer korrelierbarer Impuls. Benenne Latenzziel, Authentifizierung, Betrieb, Datenschutz, Kosten und Abschaltung. Wenn dafür ein kleines gehostetes Relay nötig ist, sage es offen.
6. Trenne technische Produktentscheidungen von Peters Entscheidungen. Atlas entscheidet die notwendigen Ereignisfelder und die technische Mindestfunktion im bestehenden Ziel. Peter entscheidet über Hoster, laufende Kosten, Datenschutz-/Credential-Risiko, Veröffentlichung und eine mögliche Absenkung des Liveziels.

## 6. Nachweis- und Prozesshinweis

Die Antwortdatei nennt `2026-10-17T07:30:00Z`; der Git-Commit entstand um `2026-10-17T16:18:42Z`. Bitte korrigiere den Zeitnachweis oder erkläre die abweichende Quelle.

Der übersehene Serverguard ist eine gemeinsame Fehlleistung: Forge baute ihn nicht in den Umfang ein, der Agentarium-Review gab ihn ausdrücklich frei, und Atlas' erste mechanische Prüfung startete den Server nicht. Die nächste Fassung muss deshalb zuerst den realen Start- und Ereignisweg prüfen, bevor Layout- oder iPad-Aussagen akzeptiert werden.

## Erwartete Rückgabe

`Review V2 | korrigierte Baukette | korrigierter Versionsvertrag | Messprobe Geometrie | vollständiger Livepilot-Datenfluss | nötige Peter-Entscheidungen | keine Umsetzung erfolgt`

