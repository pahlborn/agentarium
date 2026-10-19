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

## Korrektur nach Argus V1

Argus meldete am Head `558eb9d` einen BLOCKER und einen MAJOR. Der Kandidat
wurde daraufhin ohne Aktivierung und ohne Modellaufruf nachgebessert:

- Vorprüfungen, Startfehler und Modelllauf liegen nun gemeinsam im fail-closed
  Ergebnisweg. Fehlt nach Abbruch oder Timeout ein verwertbares Resultat,
  erzeugt der getrennte Publisher aus dem unveränderten Prepare-Kontext einen
  festen `BLOCKED`-Datensatz.
- Der Result-Download ist fehlertolerant; erst danach wird der feste Fallback
  materialisiert. Ein fehlendes Artefakt verhindert damit nicht mehr die
  sichtbare Abschlussmeldung.
- Dedupliziert wird auf `(task_id, source_commit, RESULT_READY)`. Ein bloßes
  `HOST_RECEIVED` sperrt eine berechtigte Wiederholung nach `BLOCKED` nicht.
- Das Resultat besitzt ein striktes Schema und ist an Aufgabe, Quellcommit,
  Aktivierungscommit und Lauf-ID gebunden. Finale Metadaten, Handback und der
  vollständig serialisierte Kommentar werden vor Veröffentlichung erneut auf
  Secret-Muster geprüft.
- Verdächtige Metadaten werden nicht durchgereicht, sondern in einen neutralen
  `BLOCKED`-Datensatz ohne Sitzung, Nutzung, Kosten oder Handback verwandelt.

Kostenlose lokale Rückprüfung: Python-Syntax, `git diff --check` und
`SELF_TEST_OK: 17 security checks; no model/API call`.
