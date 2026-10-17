# Scout — AG-BALL-LIVE-001-SCOUT-GITHUB-RELAY-V1

Realer Subagent: `/root/scout_github_relay_feasibility`  
Geprüft: 17.10.2026, 18:14–18:17 UTC. Keine Änderungen, Veröffentlichung oder Tokenverwendung.

Bewertung: GitHub-Kommentare in der vorgeschlagenen Form als autonomer Livepilot verwerfen.

- Anonymer GET mit `Origin: https://pahlborn.github.io`: HTTP 200 und `Access-Control-Allow-Origin: *`.
- Limit: 60 Requests/Stunde pro Ausgangs-IP. 1 Hz benötigt 3.600/Stunde.
- Ein unmittelbar folgender anonymer `If-None-Match`-GET ergab 304 und reduzierte das Restbudget erneut.
- Gemessene Antworten: `Cache-Control: public, max-age=60, s-maxage=60`.
- Ein Browser-Token ist kein neutraler Zusatz; eingebettet wäre er öffentlich, in `localStorage` durch gleichursprüngliches JavaScript/XSS lesbar.
- iOS kann Hintergrundtimer drosseln oder vollständig suspendieren.
- „Peter löst aus“ ist kein autonomes Startsignal; nachträgliches Lesen beweist keine Livebeobachtung.

GitHub-Kommentare bleiben höchstens ein kurzer, beaufsichtigter Vordergrund-Transporttest mit Restbudget-, Cache- und Zeitnachweis. Kein iPad-/Safari-PASS.

Primärquellen: [Limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) · [Best practices/304](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api) · [CORS](https://docs.github.com/en/rest/using-the-rest-api/using-cors-and-jsonp-to-make-cross-origin-requests) · [Credential security](https://docs.github.com/en/rest/authentication/keeping-your-api-credentials-secure) · [WebKit background behavior](https://webkit.org/blog/8970/how-web-content-can-affect-power-usage/)
