# AG-BALL-LIVE-001 — Auftrag: Live-Aktivitaet im Original-Agentarium

Status: KONZEPT- UND MACHBARKEITSSTUDIE / KEINE IMPLEMENTIERUNG  
Datum: 2026-10-17  
Auftraggeber: Peter  
Verantwortung: Atlas  
Arbeitsbranch: `agent/ball-live-concept-20261017`

## Abnahmeziel

Ein vollstaendiges, unabhaengig geprueftes Zielkonzept beantwortet vor jeder Umsetzung, wie ein bereits geoeffnetes ORIGINAL-Agentarium auf Peters iPad reale Aktivitaeten laufender ChatGPT-/Atlas- und Claude-Code-Agenten nahezu in Echtzeit wahrheitsgetreu anzeigen kann.

Die Studie reicht vom Ereignisursprung bis zu Live-Anzeige, Ausfallbehandlung, Archiv-Replay und Betrieb. Sie trennt nachgewiesene Faehigkeit, technisch pruefbare Annahme, offene Plattformluecke und erforderliche Entscheidung.

## Verbindlicher Untersuchungsumfang

1. Reale Ereignisquellen fuer ChatGPT Work/Codex und Claude Code, einschliesslich mindestens eines Zwischenereignisses waehrend eines laufenden Auftrags.
2. Normalisierung auf den bestehenden Vertrag V2.1 und Anschluss an die vorhandenen Original-Hooks `window.__agEreignis` / `window.__agLauf`.
3. Erreichbarer Online-Transport zum bereits geoeffneten Browser/iPad; Vergleich lokaler Sidecar-, minimal gehosteter Relay- und beobachtbarer-Runtime-Varianten.
4. Identitaet, Authentizitaet, Autorisierung, Datenschutz, Idempotenz, Reihenfolge und Schutz gegen erfundene Aktivitaet.
5. Anzeige von aktiv, wartend, blockiert, beendet und unbekannt/veraltet ohne Schlussfolgerung aus blossem Schweigen.
6. Unterbrechung, Wiederverbindung, Catch-up und Uebergang derselben Ereignisspur in Archiv-/Replay-Betrieb.
7. Betrieb, Verantwortlichkeiten, Kostenklassen, Messwerte, Monitoring des Monitors und Rueckfall-/Stopbedingungen.
8. Umsetzungsreihenfolge mit kritischen Ende-zu-Ende-Proben, Akzeptanzkriterien und unabhaengigem Review.

## Nicht Teil dieses Auftrags

- keine Produktimplementierung;
- keine neue Infrastruktur oder Zugangsaenderung;
- kein Merge, Release oder Publishing;
- keine Demo als Ersatz fuer den echten Ende-zu-Ende-Nachweis;
- keine Kostenanzeige im Produkt, solange Gesamtkosten nicht vollstaendig ermittelbar sind.

## Rollen und echte Beitraege

- Nova: Nutzerwahrheit und Erlebnisziel.
- Scout/RKA: aktuelle technische Quellen und Machbarkeitsmatrix.
- Forge/Claude Code: technische Zielarchitektur und kritische Realisierbarkeitspruefung.
- Archibald/Claude Code: proportionale, umsetzbare Spezifikation und versionierte Akzeptanzkriterien.
- Sentinel: Vorab-Testbarkeitspruefung und Ende-zu-Ende-Nachweisplan.
- Argus: unabhaengige Architektur-, Evidenz- und Risikopruefung.
- Cadence: nur gezielte Prozesspruefung der Phasen-/Freigabelogik, falls das konsolidierte Konzept sie benoetigt.
- Atlas: Orchestrierung, Konfliktaufloesung, Entscheidungsvorlage und Nachweisregister.

## Modellrouting

Auftrag: K / hohes Produktrisiko. ChatGPT-Spezialisten werden auf starken, aufgabenpassenden Modellen angefordert; die tatsaechliche Ausfuehrung bleibt ohne unabhaengige Laufzeitangabe unconfirmed. Claude-Rollen behalten ihre bindenden Rollenvorgaben, sofern Peter keine Ausnahme freigibt. Reguläre Fachlaeufe statt Modelltests; kein kuenstlicher Ein-Zug- oder Mikro-Kostendeckel. Providerfehler oder Guthabenmangel stoppen den betroffenen Lauf und werden berichtet.

## Entscheidungs-Gates

G0 Quellenfaehigkeit beider Plattformen belegt oder als konkrete Luecke mit Alternative ausgewiesen.  
G1 Eine Zielarchitektur deckt den vollstaendigen Weg ab und besitzt keine versteckte manuelle Transporthandlung.  
G2 Archibalds Kriterien sind fuer Sentinel ausfuehrbar; Argus findet keinen unbehandelten kritischen Widerspruch.  
G3 Peter entscheidet ueber Architekturvariante, Betriebsform, Ziel-Latenz und die getrennte Pilot-/Implementierungsfreigabe.

Die Erstellung dieser Studie aktiviert keines dieser Umsetzungs-Gates automatisch.

## Erweiterter Lieferumfang: MVP und Prototyp

Peter hat am 2026-10-17 nach Start der Studie zusaetzlich eine verbindliche MVP-Definition und den anschliessenden Bau eines echten Prototyps beauftragt.

Reihenfolge: vollstaendige Machbarkeitsstudie -> technische Zielarchitektur -> versionierte MVP-Spezifikation und Nachweisplan -> unabhaengiges Vorab-Review -> nur notwendige Betriebsentscheidung durch Peter -> Forge-Implementierung -> Sentinel-Nachweis -> Argus-Ergebnisreview.

Vorlaeufiger, durch Archibald und die Reviews zu schaerfender MVP-Kern: Das bereits geoeffnete ORIGINAL-Agentarium zeigt ohne Reload mindestens ein eindeutig korreliertes, echtes Zwischenereignis eines noch laufenden ChatGPT/Atlas-Agenten und eines noch laufenden Claude-Code-Agenten. Quelle, Bridge, Transport, Original-UI und sichtbare Darstellung sind fuer dieselbe Run-/Event-ID nachgewiesen. Abschlussereignis, statische Datei, Demo-/Fixture-Verkehr oder eine Ersatzoberflaeche bestehen diese Abnahme nicht.

Der Prototyp darf erst gebaut werden, wenn keine unbekannte Plattformluecke als vorhandene Faehigkeit behandelt wird. Externe Infrastruktur, neue Zugangsdaten, veroeffentlichte Endpunkte, Merge und Release bleiben gesonderte Entscheidungen. Das Bau-Mandat ist keine pauschale Freigabe fuer diese Aktionen.
