# Scout — AG-BALL-LIVE-001-SCOUT-IPAD-V1

Geprüft: 17.10.2026. Keine Implementierung oder Freigabe.

## Ergebnis

Ein zeitlich begrenzter Same-Origin-LAN-Pilot ist nur dann der kleinste Weg, wenn ein Rechner in Peters LAN sowohl den Kandidatenmonitor als auch das SSE-Relay bereitstellt **und** reale Prozessereignisse dieses Relay tatsächlich erreichen. Peter müsste den Monitor einmal unter einer neuen LAN-URL öffnen. Die bereits geöffnete HTTPS-GitHub-Pages-Seite erhält durch eine geänderte Bind-Adresse allein keinen nutzbaren Stream.

### A — LAN / gleiche Origin

- Safari unterstützt `EventSource`/SSE; iOS kann Hintergrund-Tabs suspendieren. Echtzeitabnahme deshalb mit sichtbarem Tab und separater Wiederaufnahmeprüfung.
- HTTPS-Seite zu HTTP-LAN-Endpunkt ist Mixed Content. Unterschiedliche Origin benötigt CORS; native `EventSource` kann keine frei gesetzten Auth-Header senden.
- Same-Origin-Monitor und SSE auf dem LAN-Rechner vermeiden diese Grenzen für den Pilot. Rechner, Feed und WLAN müssen laufen. HTTP im LAN ist unverschlüsselt; nur minimierte, nicht vertrauliche Felder und begrenzte LAN-Freigabe.
- Offen: Cloud-/GitHub-Actions-Prozesse können nicht ohne zusätzlichen Mechanismus in Peters privates LAN posten.

### B — temporärer HTTPS-Tunnel

- Cloudflare Quick Tunnels unterstützen ausdrücklich kein SSE.
- `tunnel.to` dokumentiert SSE, aber Preise, belastbare Laufzeitgrenzen und Datenschutzbedingungen konnten nicht ausreichend aus Primärseiten verifiziert werden.
- Ein öffentlich erreichbarer Einstieg braucht Authentifizierung vor Inbetriebnahme.

### C — gehostetes HTTPS-Relay

- Cloudflare Workers kann Antworten streamen; reguläre Bereitstellung benötigt Konto und Deployment.
- Schreib-/Leseberechtigungen, Zustand, CORS/Same-Origin, Logging und Löschung müssten entworfen werden.
- Für diesen Review nicht autorisiert.

## Primärquellen

- [HTML Standard — Server-sent events](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [W3C — Mixed Content](https://www.w3.org/TR/mixed-content/)
- [Fetch Standard — CORS protocol and credentials](https://fetch.spec.whatwg.org/#cors-protocol-and-credentials)
- [WebKit — How Web Content Can Affect Power Usage](https://webkit.org/blog/8970/how-web-content-can-affect-power-usage/)
- [WebKit — Full Third-Party Cookie Blocking](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)
- [Cloudflare Quick Tunnels — Limitations, 30.09.2026](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/)
- [tunnel.to — SSE connections](https://tunnel.to/sse-connections)
- [Cloudflare Workers limits, 12.10.2026](https://developers.cloudflare.com/workers/platform/limits/)
- [Cloudflare Workers getting started](https://developers.cloudflare.com/workers/get-started/guide/)
- [Cloudflare Workers pricing, 02.10.2026](https://developers.cloudflare.com/workers/platform/pricing/)

## Benötigte spätere Entscheidung

Erst nach dem Review: konkrete Laufumgebung, Netzweg, erlaubte Felder, Authentifizierung, einmaliges Öffnen der Pilot-URL und Abschalten danach. Ein erreichbarer SSE-Server allein beweist keinen Live-Agentenfeed.
