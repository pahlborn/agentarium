# AG-RELAY-PUBLIC-SEC-001 — Sicherheitsreparatur Claude-Relais

Status: Kandidat, nicht aktiviert. Keine Modellkosten, kein Merge, keine Veröffentlichung.

## Ziel

Ein Claude-Code-Auftrag in einem öffentlichen Repository darf weder GitHub-
Schlüssel lesen noch außerhalb eines isolierten Aufgabenpakets lesen oder
schreiben. Nur ein exakt benannter, vorab angelegter Handback ist beschreibbar.

## Sicherheitsgrenzen

1. `prepare` besitzt GitHub-Leserechte und darf den Empfang auf Issue #2 melden.
2. `run` erhält ausschließlich das geprüfte Artefakt und den Anthropic-Schlüssel;
   es besitzt keinen GitHub-Schlüssel und keinen Checkout.
3. Claude erhält nur `Read` und `Edit`. `Read` gilt durch
   `blockReadsOutsideWorkingDirectories` ausschließlich im isolierten
   Arbeitsverzeichnis. Erlaubt ist nur `Edit(/<exakter-handback>)`; eine nackte
   `Read`- oder `Edit`-Freigabe gibt es nicht.
4. Das Dateisystem ist zusätzlich schreibgeschützt; nur der vorhandene
   Handback ist beschreibbar.
5. Rohstrom, Fehlerausgabe und Handback werden vor Weitergabe auf den exakten
   Anthropic-Schlüssel sowie bekannte Tokenformen geprüft. Bei Treffer werden
   sie verworfen und nur ein neutraler BLOCKED-Nachweis veröffentlicht.
6. `publish` besitzt den GitHub-Schlüssel, aber keinen Anthropic-Schlüssel und
   veröffentlicht nur das geprüfte Ergebnis.

## Abnahme vor Aktivierung

- kostenloser Selbsttest und Syntaxprüfung erfolgreich;
- Argus prüft Berechtigungsmodell, Ausfallwege und Umgehbarkeit;
- Sentinel führt die reproduzierbaren Negativtests aus;
- erst danach darf Peter einen separaten, budgetierten Canary-Lauf freigeben.

Der Aktivierungspfad ist absichtlich noch nicht vorhanden:
`handoffs/activate/AG-RELAY-PUBLIC-SEC-001.json`.
