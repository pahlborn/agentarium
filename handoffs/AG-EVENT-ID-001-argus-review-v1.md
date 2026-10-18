# AG-EVENT-ID-001 — Argus Konsistenzcheck V1

[AGENTARIUM:AG-EVENT-ID-001:RA:RA_REVIEW:V1]

**PASS_WITH_NOTES für den begrenzten Atlas-Entscheidungsentwurf.** Review am 18.10.2026 durch echten Argus-Subagenten `/root/argus_live_handoffs`, vorhandener `review-agent-argus`-Skill. Kein Code, keine externen Mutationen, keine bezahlten Aufrufe oder Ausführungstests.

Geprüfte Primärunterlagen: Rückmeldung `handoffs/AG-EVENT-ID-001-agentarium-rueckmeldung-v1.md` am exakten Commit `42ffbdd5fffc8206c10619c2011ab89f767175d9`; Issue 14, Kommentar `6245395762`, API-Fassung erstellt und zuletzt geändert `2026-10-18T03:55:13Z`. Der Kommentar beschreibt historisch Pilot F50, die Rückmeldung F51. Seine Fassungsangabe darf nicht als neuer Gegenbeleg zum späteren F51-Stand übernommen werden. Dies ist ein Dokumenten-/Entwurfscheck; kein erneutes Vollquelltextaudit.

## Drei materielle Punkte

1. **MAJOR / confirmed: Empfänger zuerst reicht bei bereits offenen alten Clients nicht allein.** Der Rückmeldungsbefund zur strikten Allowlist trägt: Ein alter Adapter verwirft das gesamte neue Ereignis wegen `short_ref`. Eine neue Veröffentlichung aktualisiert einen bereits laufenden Tab nicht automatisch. Die vorgeschlagene echte Consumerprobe ist daher richtig, gilt aber nur für den tatsächlich geprüften Client. **Kleinste Korrektur der Übergabe:** Consumeränderung und ein klar abgegrenzter Test zuerst; reguläre Erzeugerausgabe bleibt ausdrücklich nicht beauftragt. Vor deren Aktivierung muss der konkrete unterstützte Clientstand nachgewiesen bzw. eine verständliche Neuverbinden-/Aktualisieren-Regel geklärt sein. Kein „vollständig rückwärtskompatibel“ aufgrund eines einzelnen neuen Clients behaupten. Owner: Atlas für die Betriebsgrenze, Agentarium-Agent für optionalen Empfang; Producerentscheidung später.

2. **MINOR / derived: Führende Integrationsbasis benennen und reproduzierbaren Quellpfad erhalten.** Für diese Kurz-ID-Erweiterung **`pilot/github-live/index.html` F51** plus zugehöriger Pilotadapter; **nicht** Pilotadapter mit `feld/index.html` F47 mischen. Die geschützte F47 bleibt unangetastet. Das löst den konkreten Blocker; es beschließt keine dauerhafte Live-/Archivspaltung. Ein wiederholbarer Generatorbau darf die Änderung später nicht still entfernen: Im Diff/Handback entweder den bestehenden zuständigen Generator mitführen oder die genaue reproduzierbare Herkunft samt noch offener Generatornachführung benennen. Kein neues Shared-Modul und kein Doppelpatch erforderlich. Den Integrationsstand im Auftrag zusätzlich mit exaktem Commit fixieren; F51 allein ist keine unveränderliche Quellenidentität. Owner: Atlas/Agentarium-Agent. Die langfristige Zusammenführung bleibt ein separater kleiner Entscheidungsvorschlag.

3. **MINOR / confirmed/derived: Kanonisches Format und Identität streng auseinanderhalten.** Das vorgeschlagene einfache Muster `^ID[0-9]{4,}$` erlaubt unter anderem `ID0000` und überbreite führende Nullen. Entscheidung daher ausdrücklich: `ID0001` bis `ID9999`, danach `ID10000`, `ID10001` usw., ohne zusätzliche führende Nullen. Zeichenkettenprüfung genügt; keine JS-Number-Konvertierung oberhalb SafeInteger. Ungültiges optionales `short_ref`: nur Feld verwerfen, Ereignis behalten, begrenzte Diagnose. Technische Ereignisidentität bleibt **`(project_id,id)`**; die Kommentar-ID bezeichnet einen konkreten Transportbeleg. Bei erneutem Posten desselben fachlichen Ereignisses kann eine neue Kommentar-ID entstehen; sie ersetzt weder Retry-/Deduplizierungsregeln noch die noch offene kollisionsfreie Kurznummernvergabe. Nicht nach Kurzreferenz sortieren und ohne Erzeugerregel keine dauerhafte Eindeutigkeit versprechen. Owner: Agentarium-Agent für Empfang, Atlas für späteren Producerauftrag.

## Ergänzung zur Quellenlage

Atlas meldet zusätzlich: `previews/AG-VISUAL-005-feld/schicht.py` liefert auf `main` Contents404, die Generatorquelle liegt in bisheriger Forge-Kandidatenarbeit `b5dcabb…`. Diesen Zusatz habe ich nicht eigenständig erneut abgerufen. Konsequenz für Punkt 2: **Keinen Neubau aus F47 anweisen.** Der Agentarium-Agent muss vor Umsetzung den verfügbaren Source-/Build-Weg für den fixierten F51-Integrationsstand benennen. Fehlende Generatorquelle im Zielzweig ist eine explizite Liefer-/Reproduzierbarkeitslücke, keine Erlaubnis, auf F47 zurückzufallen. Temporäre Pilotzuständigkeit erledigt den langfristigen Issue-14-Befund nicht.

## Abnahme und Grenzen

| Entwurfsziel | Ergebnis dieses Checks |
|---|---|
| Klare Basis für diese Erweiterung, F47 geschützt | passed mit Punkt 2 |
| Alte Ereignisse ohne Kurzreferenz unverändert | not tested; verbindliche QA-Eingabe |
| Ungültige Kurzreferenz beschädigt nicht das Ereignis | not tested; verbindliche QA-Eingabe |
| Tatsächlich geladener Consumer nimmt ein echtes neues Feld an | not tested; vor Produceraktivierung erforderlich |
| Nummernvergabe/Retry dauerhaft eindeutig | nicht Gegenstand dieser Implementierungsfreigabe; offen |

Keine Kundenfreigabe, Merge- oder Veröffentlichungsentscheidung durch diesen Review. Peter reviewed/entscheidet den Merge gemäß Auftrag. Für die GitHub-Antwort reicht eine klare Entblockung: **„Für AG-EVENT-ID-001 arbeite ausschließlich auf dem fixierten aktuellen F51-Piloten; F47 bleibt geschützt. Liefere Consumer-/Darstellungsdiff plus QA-Eingaben. Keine Produceraktivierung, kein Umschalten, keine Veröffentlichung. Dauerhafte Zusammenführung separat vorschlagen.“** Atlas ergänzt den exakten Integrationscommit und übermittelt selbst. Argus stoppt hier.
