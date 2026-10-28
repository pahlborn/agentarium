# AG-MON-LAST-001 — Ergänzende Prüfliste für Lot

Version: V1.1 · Stand: 28.10.2026 · Autor: Atlas  
Status: Prüfvorbereitung, **noch kein Auftrag an Lot**. Peter startet Lot ausschließlich selbst.

## Vorrang und Zweck

**Führende Grundlage ist [AG-MON-ARCHIV-002 — Archivpflege, Kapazität, Aufräumen und Timeline](AG-MON-ARCHIV-002-archivpflege-konzept-v1.md). Diese Liste prüft dagegen und ersetzt sie nicht.** Maßgeblicher abgeglichener Stand: main `21be56624660b9984e4e1c8f192a75a2bba4ea73` (PR #90).

Die frühere separate Markdown-Prüfliste V1.0 und die Chat-Diskussionsfassung V0.3 sind keine konkurrierenden Spezifikationen. Ihre technischen Vorschläge sind weder freigegeben noch implementiert. Diese bereinigte Fassung behält nur ergänzende Bewertungsfragen und Schnittstellenrisiken.

Peters aktuelle Anweisungen und Entscheidungen haben Vorrang. Unverändert gelten aus ARCHIV-002: reiner Lesemonitor; Auslagern nur auf Peters Auslösung; Schutz alles Unerledigten; öffentliche Archivdateien erlaubt; Hinweise bei 70/90 Prozent; Reihenfolge B → A → C → D. Definitionen, Bedienung und Abnahme stehen ausschließlich dort und werden hier nicht wiederholt. Eine lokale Cachepflege darf keine selbständige Auslagerung oder Löschung von Quelldaten auslösen.

## Grenze einer späteren Bewertung

Erst nach Peters gesondertem Start: relevante bestehende Umsetzung lesen und die Fragen unten bewerten. Keine Implementierung, Änderungen an Dateien/GitHub, Einrichtung, Tests, Machbarkeitsläufe oder kostenpflichtigen Unteraufträge aus dieser Liste ableiten. Nötige spätere Nachweise nur vorschlagen. Keine Epics oder Stories erstellen.

Lot bewertet den Monitor und dessen Leseschnittstelle. Das externe Auslagerungswerkzeug gehört Forge; Lot implementiert oder beauftragt es nicht. Seine notwendigen Eigenschaften sind Schnittstellenanforderungen, keine bereits eingeholte Forge-Bewertung.

## Enger Quellenrahmen

| Quelle | Bedarf |
| --- | --- |
| `AGENTS.md`, aktuelle Prozesskarte | Rollen und zulässiger Ablauf |
| Führendes ARCHIV-002-Dokument | vollständig, nur 94 Zeilen am abgeglichenen Stand |
| `pilot/github-live/github-live.js` | gezielt `verarbeiten`, `holen`, `vorwaerts`, `aufbau`, `abfrage`, `zyklus`, Archiv und Zustandsfaltung |
| Archiv-Lesevertrag und Manifest, falls inzwischen vorhanden | nur mit tatsächlichem Fund/Commit belegen |
| Aktuelle Ereignisvorlagen | nur vor tatsächlich erlaubten Monitorereignissen |

Vor der späteren Bewertung main-Commit prüfen; Änderungen seit `21be566` gezielt berücksichtigen. Keine vollständigen Kommentarhistorien oder großen Produktdateien ohne benannten Bedarf.

Atlas' Codebefunde stammen aus `95cfda23db30b403a1fa92a930ee5a348f82411b`: Aufbau leert ETags; Vorwärtspagination stoppt bei 304; Live-Abfrage prüft bei voller letzter Seite die Folgeseite; bereits bekannte Kommentar-IDs werden übersprungen; veränderte Inhalte derselben Ereignis-ID gelten als Konflikt. Das sind historische Codebefunde, keine aktuelle Geräteprüfung.

## Abgleich: gestrichen oder nachgeordnet

| Früherer Inhalt aus V1.0 | Bereinigung |
| --- | --- |
| Eigenständige Archiv-/Restore-Anforderungen und S6/S7 als parallele Abnahme | gestrichen; ARCHIV-002 führt. Unten nur zusätzliche Fehlerfälle und Integrationsfragen. |
| Eigene technische Umsetzungsreihenfolge „erst zwei Tabs, dann Cache“ | gestrichen; darf B → A → C → D nicht verdrängen. |
| Issue #2 als alleinige Wiederherstellungsquelle | verworfen; Lesepfad muss gemäß ARCHIV-002 Archivdateien und #2 zusammenführen. |
| Pauschaler Ausschluss von Tokenverzicht | präzisiert: öffentliche Archivabrufe ohne Token sind entschieden. Authentifizierung des verbleibenden GitHub-Live-Lesens bleibt davon getrennt. |
| Vollständiger Katalog Cache-/Sequenzregeln als Vorgabe | durch offene technische Bewertungsfragen ersetzt. Web Locks, BroadcastChannel und IndexedDB sind Optionen. |
| Messprotokoll, externe API-Erläuterungen und allgemeine Projektziele | aus der Prüfliste entfernt; kein erneuter Nachweis und kein zusätzlicher Auftrag. |

## Widersprüche und offene Schnittstellen

| ID | Befund | Behandlung / Frage |
| --- | --- | --- |
| W1 | V1.0 denkt in einer Quelle #2; ARCHIV-002 führt ausgelagerte Ereignisse auf Pages hinzu. | Vorrang bereits angewandt: beide Quellen lesen. Wie verhindert der Monitor Lücken, Doppelzählung und Wiederauftauchen aus ausdrücklich gelöschten Archiven? |
| W2 | ARCHIV-002 sagt „Bricht ein Schritt ab, bleibt alles auf #2“, beschreibt davor aber das Löschen einzelner Kommentare nach Kopie. Nach einem Teil der Löschungen kann ein Abbruch diese Zusage nicht ohne Weiteres erfüllen. | Führenden Text nicht stillschweigend umdeuten. Forge muss später Wiederaufnahme/Abbruchvertrag bestätigen; Lot benennt die erforderliche Leseschnittstelle. Peters Schutzentscheidung bleibt maßgeblich. |
| W3 | ARCHIV-002 behandelt lokalen Speicher als heutigen Nicht-Faktor; V1.0 schlägt dauerhaften IndexedDB-Speicher vor. | Kein Widerspruch im Istzustand, aber neue technische Folgewirkung. Cache nur als Option mit Kapazitäts-, Fehler- und Invalidierungskonzept bewerten; kein zweites maßgebliches Archiv. |
| W4 | Alte S4 nennt drei Sekunden als Versuchsziel; ARCHIV-002 verlangt Verbinden am iPad unter fünf Sekunden. | Verschiedene Messgrößen: Leserwechsel/Ereignisausgabe gegenüber Verbindungsaufbau. Drei Sekunden begründen keine Änderung des führenden Abnahmekriteriums und sind keine neue Abnahme. |

## Ergänzende technische Bewertungsfragen

| ID | Frage an Lot | Gewünschte knappe Aussage |
| --- | --- | --- |
| L1 | Was existiert am dann aktuellen main bereits? | Eng belegte Restlücke je betroffener Komponente; keine Doppelarbeit. |
| L2 | Wie erkennt der Monitor einen vollständigen, auf Pages tatsächlich lesbaren Archivstand, bevor zugehörige Kommentare auf #2 fehlen dürfen? | Erforderlicher Vertrag zu Manifest/Generation, Veröffentlichung, Vollständigkeit und Wiederaufnahme; nur Kopien zählen ist noch kein Nachweis identischer Inhalte. Teilübertragung, fehlende Datei und verzögerte Pages-Veröffentlichung berücksichtigen. Ausführung bleibt Forge. |
| L3 | Wie werden Archivdateien und #2 zusammengeführt? | Stabile Originalbelege, Reihenfolge und Deduplizierung; Übergangsduplikate bei Kopie vor Löschung; Änderungen während mehrseitigen Lesens; ausdrückliches Archivlöschen und veraltete lokale Kopien. Historische Migration erzeugt keine neuen Liveflüge. Keine unbelegte Snapshot-Garantie. |
| L4 | Schützen die heutigen Grenzen auch beim Laden vieler Monatsarchive? | Prüfen, auf welche Mengen MAX_IDS/MAX_SEITEN wirken und ob ausgelagerte Geschichte dieselben Grenzen erneut erreicht. Bedeutung der 3.500/4.500 Kommentare bleibt entschieden; Kommentare, gültige Ereignisse und deduplizierte IDs getrennt ausweisen. Offenes nie still verdrängen. |
| L5 | Liefert geteiltes Lesen einen sinnvollen Zusatznutzen nach Einführung der führenden Archivlösung? | Einfachsten Weg oder begründeten Verzicht nennen. Bei Empfehlung: Quelle/Zugriffskontext/Fassungen, versteckter bzw. suspendierter Safari-Tab mit Sperre, Leserwechsel und Einzelbetrieb bewerten. Keine Wirkung auf einem einzelnen Tab erfinden. |
| L6 | Falls ein gemeinsamer Cache empfohlen wird: Wie werden Stand, Livegrenze und Veröffentlichung gekoppelt? | Atomare Bestätigung vor Benachrichtigung; Generation/Leserepoche/Sequenz oder einfachere gleichwertige Lösung; Abbruch vor/nach Commit, verlorene letzte Nachricht, verspätete Antworten und Cacheverlust abdecken. ETag nur mit passendem Inhalt/Seitenverweisen; GitHub-Wartefristen über Leserwechsel erhalten. |
| L7 | Wie werden Korrekturen auf älteren Seiten und bewusstes Entfernen behandelt? | Kommentar-ID-Deduplizierung, Inhaltskonflikte, verschobene Seiten und belegte Auslagerung unterscheiden. Korrekturfrist und Lastwirkung vorschlagen, nicht als akzeptiert darstellen. Quellenänderungen müssen Zustand/Archiv berichtigen, ohne Historie live nachzuspielen. |

## Nur zusätzliche Nachweisfragen

Die Abnahme von ARCHIV-002 bleibt führend. Lot soll den kleinsten späteren Nachweis für die entscheidende offene Annahme benennen, nicht durchführen:

- Unterbrechung nach Archivkopie, vor Pages-Verfügbarkeit und mitten in der Kommentarbereinigung: keine unbezeichnete Lücke und kein Verlust des Originalbelegs.
- Gleicher Verlauf vor/nach Auslagerung, während beide Kopien vorliegen und nach ausdrücklich bestätigtem Archivlöschen: Zustand, Archiv und Timeline bleiben konsistent; lokale Kopien beleben gelöschte Archive nicht wieder.
- Datenumfang über bisherige Gedächtnisgrenzen, über mehrere Monatsdateien und Projekte: Unerledigtes bleibt erhalten, unvollständige Abdeckung ist sichtbar.
- Nur falls geteiltes Lesen empfohlen wird: ein gegenüber drei kompatiblen Tabs, Aufbau separat; Leserwechsel bei Ereigniseingang und Rückkehr eines suspendierten iPad-Tabs. HTTP-Anfragen, 200/304 und primären Kontingentverbrauch getrennt erfassen.
- iPad Hoch-/Querformat und Bedienung ohne Hover für betroffene Funktionen. Bestehende akzeptierte Werte aus ARCHIV-002 bleiben unverändert.

## Rückgabe und Stop

Maximal etwa eine Seite: geprüfter Commit; L1–L7 kurz mit Belegen; tragfähig/Änderung nötig/ungeklärt; höchstens drei entscheidende Risiken; einfachster Weg und kleinster späterer Nachweis; Aufwand/Kostenbasis oder ausdrücklich unbekannt.

**Noch nicht eingeholt:** Lots technische Bewertung, Forges Bewertung des Auslagerungs-/Abbruchvertrags und eine unabhängige Prüfung der entscheidenden Annahmen. Keine dieser Beteiligungen oder Tests wird behauptet.

STOP nach einer später gesondert beauftragten Bewertung. Dieses Dokument und sein PR starten Lot nicht, vergeben keine Umsetzung und ändern die führende Grundlage nicht.
