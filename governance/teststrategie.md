# Teststrategie Agentarium — Nachschlagewerk

**Stand:** 30.10.2026. Beschlossen hat Peter die knappe Fassung in `agentarium-process-v1.4.md` §7 („Checks by moment“), nach Durchsicht durch Atlas und Sentinel in #103. **Diese Datei ist Nachschlagewerk, keine Regel.** Sie erläutert §7 mit Voreinstellungen, Kern, Gegenprobe und Richtwerten. Bei Widerspruch gilt §7.

## 1. Prüfstufen: jede beantwortet eine eigene Frage

| Stufe | Frage | Wer | Wann |
|---|---|---|---|
| **S1 Autor** | Tut die Änderung, was sie soll? Wird ein neuer Test beim gezielten Fehler rot? | Autor (Lot, Forge, Zuarbeit) | vor dem PR |
| **S2 PR-CI** | Bricht die Änderung die Hauptwege oder etwas, das sie direkt berührt? | GitHub: Auswahl, bei Monitor-Code der Kern | automatisch im PR |
| **S3 Unabhängige Sicht** | Prüft der Test das Richtige? Tragen Annahmen und Belege? | Sentinel (Verhalten, Testentwurf) oder Argus (Annahmen, Design, Belege), **nach Risiko** | vor dem Merge |
| **S4 Volllauf `main`** | Ist der gesamte Stand konsistent? | GitHub: alle Nachweise, je eigener Läufer (B4) | nach dem Merge |
| **S4b Veröffentlichung** | Wurde genau der geprüfte Stand veröffentlicht? | Ablauf „Veroeffentlichen“ mit Herkunftsbeleg (B1) | nach grünem Volllauf |
| **S5 Gerät** | Verhält es sich auf dem iPad und in Safari richtig? | **Peter** | nach der Veröffentlichung, wenn Gerätefähigkeiten berührt sind |

**Grundsätze:**
- Gültige Belege werden wiederverwendet. Eine Wiederholung braucht einen benannten Erkenntniszweck.
- Ein CI-Lauf trennt die **Ausführung** vom Autor, nicht den **Testentwurf**. Unabhängigkeit des Entwurfs gibt es nur über S3.
- Atlas, Sentinel und Argus dürfen eine benannte Lücke gezielt selbst prüfen oder prüfen lassen. Es gibt keine Rollenverbote; die Rollen aus dem Rulebook gelten unverändert.

## 2. Voreinstellung je Änderungsart (keine Ausschlussliste)

| Änderungsart | S2 PR-CI | S3, wenn das Risiko es verlangt | S5 Gerät |
|---|---|---|---|
| Doku, Governance, Handoffs | – | Bei wesentlichen Regeländerungen die betroffenen Rollen und Peter | – |
| Projektliste | Projekt-Nachweise | **Plausibilität:** ID, Repo, Duplikat, erwartete Quelle | – |
| Ein Test geändert | dieser Test | wenn der Prüfgedanke sich ändert | – |
| Adapter, Transport (`github-live.js`) | Kern + Adapter-Tests | Sentinel bei Vertrags- oder Transportänderung | bei Verbindung, Suspendierung oder Rückkehr |
| Darstellung, Bedienung (`index.html`) | Kern | nach Risiko | hoch, quer, ohne Hover |
| Service Worker, Cache, Offline (`sw.js`) | Kern + SW-Tests | nach Risiko | echtes Safari: Aktualisieren, Offline, Rückkehr |
| Prüfablauf, Veröffentlichung | alle | Argus: Grenze, Rechte, Rückweg | – |
| Sicherheit (Token, Relay, Rechte) | alle | Argus, mit ausdrücklichen Negativtests | nach Risiko |

Welche und wie viele Tests die Auswahl trifft, ist **Implementierung** (`.github/scripts/browsernachweise.sh`), keine Prozessregel.

## 3. Kern für PRs mit Monitor-Code

| Hauptweg | Nachweis |
|---|---|
| Verbinden, Bedienung | AG-CONNECT-UX-001 |
| Ereignis kommt an, Ball fliegt | AG-MON-BALLSPIEL-001 |
| Projekte und Läufe | AG-PROJEKTE-002 |
| echte Originalereignisse | AG-TK022-ECHT-001 |
| Vertrag, Ablehnung, Wiederherstellen | AG-EVENT-JOURNAL-001 |

Dazu kommen die Nachweise, die eine geänderte Datei außer `index.html` beim Namen nennen. Berührt ein neuer Nachweis einen Hauptweg, schlägt der Autor ihn für den Kern vor; Atlas entscheidet.

## 4. Gegenprobe für neue oder geänderte Nachweise

- **Was gilt:** Die **relevante Assertion** scheitert am gezielt eingebauten Fehler, am früheren fehlerhaften Stand oder an einem unabhängigen Gegenbeispiel. Ein Absturz beim Aufbau ist keine Gegenprobe.
- **Was festgehalten wird:** Mutation oder Vorherstand, Commit, Kommando, erwartetes und tatsächliches Signal.
- **Grenzen:** Keine Manipulation der Produktion. Wo eine Gegenprobe technisch nicht sinnvoll ist, wird die Lücke mit Grund und Alternative benannt.
- **Wiederverwendung:** Eine wirksame Gegenprobe darf wiederverwendet werden, solange sich der Prüfgedanke nicht ändert.

## 5. Richtwerte für Nachweise (Empfehlung, keine Pflicht)

- **Auf das Ereignis warten, nicht auf die Uhr.** Auf eine konkrete Kennung, nicht auf einen Zähler allein. Vorbild: #91, #97.
- **≤ 60 s je Nachweis.** Was länger dauert, begründet das im Kopf der Datei.
- **Zeitmessende Nachweise kennzeichnen** (`ZEITKRITISCH` im Skript).

## 6. Messwerte

| Datum | Volllauf `main` | Lauf |
|---|---|---|
| 26.10. | 18 Nachweise nacheinander, 718 s | 40362791830 |
| 29.10. | 22 Nachweise nacheinander, 1.002 s | 40895621368 |
| 30.10., B4 | 22 Nachweise je eigener Läufer, **223 s** | nach Merge von #102 |

- B4 verringert die Wartezeit, nicht die Summe der Läuferminuten.
- Bei ausgeschöpfter Gleichzeitigkeit (derzeit vermutlich 20 Jobs) wächst die Dauer wieder.
- **Ein Stabilitätslauf ist nicht eingerichtet.** Dreimal Grün beweist nur diese drei Läufe. Zufälliges Rot wertet Cadence bei ihren regulären Auslösern anhand vorhandener Läufe aus. Ein Fehler, dem später ein Grün folgt, bleibt mit Ursache, Owner und Nachprüfung erhalten.

## Quellen

- Konzept und Review: #89
- Durchsicht dieser Strategie: #103 (Atlas 6515723159, Sentinel 6515728495)
- B0 #87, Ereigniswarten #91/#97, B1 #99, B2 #101, B4 #102
