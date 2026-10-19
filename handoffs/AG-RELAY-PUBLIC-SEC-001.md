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

## Korrektur nach Argus V2 und Sentinel V2

Die unabhängige Gegenprobe fand am Head `034256e` ein unvollständiges
Erfolgspaket: formal gültige `RESULT_READY`-Metadaten konnten ohne Handback
bestehen bleiben. Außerdem konnte ein fremder Kommentar im öffentlichen
Repository einen terminalen Marker vortäuschen.

Die Nachbesserung behandelt Metadaten und Handback jetzt als untrennbares
Paket: reguläre Datei, 64-stelliger SHA-256, passender Inhaltshash und erneute
Secret-Prüfung sind Voraussetzung für `RESULT_READY`. Andernfalls ersetzt der
Fallback das Teilresultat vollständig durch `BLOCKED`. Terminale Historienmarker
werden nur vom erwarteten Repository-Eigentümerkonto berücksichtigt.

Zusätzlich erzwingt das Schema für `BLOCKED` einen nichtleeren Fehlergrund,
`secret_scan=blocked` und leere Sitzungs-, Nutzungs- und Kostenfelder. Zahlen
müssen endlich, nichtnegativ und echte Zahlen statt boolescher Werte sein.

Kostenlose Rückprüfung: `SELF_TEST_OK: 21 security checks; no model/API call`
sowie eine separate Paketprobe `FALLBACK_PACKAGE_TEST_OK`. Delta-Review und
Sentinel-Nachprüfung des neuen exakten Heads bleiben Voraussetzung.

## Korrektur nach Argus V3

Der dritte Review zeigte, dass Workflow-Kommentare nicht unter Peters
Benutzer-ID, sondern als `github-actions[bot]` (ID `41898282`) erscheinen. Der
Vertrauensanker wurde auf diesen tatsächlichen Publisher korrigiert. Ein
terminaler Marker muss nun die vollständige erste Zeile mit Aufgaben-ID,
Quellcommit, Phase, Aktivierungscommit und numerischer Lauf-ID bilden; dieselbe
Lauf-ID muss zusätzlich in der Actions-URL des Kommentars stehen. Fremde oder
nur teilweise passende Kommentare werden ignoriert.

Für `RESULT_READY` sind jetzt außerdem eine parsebare chronologische Start-/
Stoppzeit, endliche nichtnegative Laufdauer und Kosten, eine nichtleere
Sitzungs-ID sowie rekursiv geprüfte Nutzungsdaten Pflicht. Boolesche,
nichtendliche und negative Zahlen werden verworfen. Dieselbe Bool-/NaN-Lücke
ist auch für `max_turns` und `max_budget_usd` der Aktivierung geschlossen.

Kostenlose Rückprüfung: `SELF_TEST_OK: 29 security checks; no model/API call`.

## Korrektur nach Argus V4

Die vierte Gegenprobe zeigte zwei verbleibende Paket- und Bindungslücken. Die
Actions-URL wird nun als vollständige eigene Kommentarzeile verglichen; eine
Lauf-ID `42` passt daher nicht mehr irrtümlich auf `/actions/runs/420`.

Ein `BLOCKED`-Ergebnis ist nur noch gültig, wenn `BLOCKED.txt` als reguläre
Datei vorhanden und `handback.md` vollständig abwesend ist. Ein liegen
gebliebener Handback macht das Teilpaket ungültig, worauf `ensure_fallback()`
alle Dateien entfernt und den festen neutralen Fallback neu erzeugt. Für ein
Erfolgsergebnis muss die Sitzungskennung nach Entfernen von Leerraum nichtleer
sein.

Kostenlose Rückprüfung: Python-Syntax, `git diff --check` und
`SELF_TEST_OK: 32 security checks; no model/API call`. Ein echter Actions- oder
Claude-Lauf wurde weiterhin nicht gestartet.
