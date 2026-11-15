# AG-RELAY-MULTIREPO-001 · Projektübergreifende Claude-Arbeit mit begrenzten Schreibrechten

Auftragsfassung v1 · 15.11.2026 · Infrastrukturauftrag für Agentarium · Auftraggeber: Peter / zentraler Atlas-Steuerungschat.

## 1. Startsequenz

1. Lade und verwende `operate-as-atlas`. Lies diesen Auftrag vollständig. Der zentrale Big-Quest-Steuerungschat behält Priorisierung und Folgeaufträge; dieser neue Chat führt nur diesen Auftrag aus.
2. Lies aktuelles `AGENTS.md`, die geltende Agentarium-Process-Karte und die für die Änderung nötigen Rulebook-Abschnitte. Letzte geprüfte Regel-/Implementierungsbasis: `pahlborn/agentarium` main `9962810b895baf10f8d71dd9a1f7387cca049b77`, Rulebook/Process 1.4. Prüfe tatsächlichen aktuellen Stand, offene Änderungen, relevante offene PRs und vorhandene Nachweise, bevor du Änderungen oder doppelte Aufträge beginnst.
3. Nenne knapp: Regeln mit Commit, lokale/GitHub-Basis, tatsächliche technische Rollen und ihre Werkzeuge, Umfang und Kostenrahmen. Ein geladener Rollenname ist kein Agentenstart. Übernimm keine Statusbehauptung ohne Originalbeleg.
4. Projekt dieses Infrastrukturauftrags: `agentarium`, Lauf/Aufgabe `AG-RELAY-MULTIREPO-001`. Nutznießer ist `big-quest` / `BQ-EVAL-01`; diese Identitäten nicht im Journal vermischen. Kein Livebetrieb; Archivspur gemäß aktuellem Ereignisvertrag. Belege tatsächliche Übergaben, Host-/Workerstarts und Enden; Cursorlücken bleiben ausdrücklich unbekannt.
5. Forge ist der reguläre technische Owner. Argus prüft die entscheidende Berechtigungsgrenze unabhängig; Sentinel prüft die Ausführungsevidenz der benannten Abnahmekriterien. Archibald nur für eine echte verbleibende Vertragslücke, Cadence nur bei tatsächlichem Prozess-Trigger. Kein automatischer kompletter Rollenzyklus. Bounded rule packages und tatsächliche getrennte Rollenläufe nach geltenden Regeln verwenden.

## 2. Ziel und nachgewiesene Lücke

Der bestehende Relay soll gezielt autorisierte Dateien anderer registrierter Projekte lesen und Forge begrenzte Implementierungsarbeit im isolierten Projektpaket ermöglichen. Archibald und Cadence bleiben lesende Fachrollen mit eigener Rückgabedatei. Kein Claude-Worker erhält dadurch GitHub-Schreibrechte, unbeschränkten Shellzugriff oder allgemeine Veröffentlichungsbefugnis.

Am eingesehenen v2-Stand bestehen mehrere gleichzeitig wirksame Grenzen:

- Quellzugriff über `git show` ausschließlich auf das vorbereitende Agentarium-Repo.
- Aktivierungs-ID beginnt zwingend mit `AG-`; Projekt-/Journalwerte sind teilweise fest an Agentarium gebunden.
- `validate_request()` akzeptiert nur die Rückgabedatei als Schreibpfad.
- Vorbereitung erstellt ein schreibgeschütztes Paket mit einer beschreibbaren Rückgabedatei.
- Der Claude-Aufruf stellt nur `Read,Edit` bereit und erlaubt Edit nur an dieser Datei; `Write`, Shell, Web und Delegation fehlen.
- Nachprüfung verwirft jedes Ergebnis, dessen Änderungsmenge nicht exakt der Rückgabedatei entspricht.

Ein anders formulierter Auftrag oder das Aufnehmen eines ZIP-Links allein hebt keine dieser Grenzen auf. Nicht nur eine Schutzprüfung entfernen, sondern einen zusammenhängenden, überprüfbaren Berechtigungsvertrag implementieren.

## 3. Verbindliche Eingaben – alles selbst aus GitHub lesen

Kein Dateitransport durch Peter erforderlich. Nutze vorhandenen GitHub-Dateizugriff, Raw-HTTPS oder read-only Git. Diese Originalreferenzen sind auf die bekannte Basis festgelegt; neueren main vor Implementierung abgleichen:

- [Relay v2](https://github.com/pahlborn/agentarium/blob/9962810b895baf10f8d71dd9a1f7387cca049b77/relay/claude_public_relay_v2.py)
- [Workflow](https://github.com/pahlborn/agentarium/blob/9962810b895baf10f8d71dd9a1f7387cca049b77/.github/workflows/claude-public-relay-v2.yml)
- [Runtime-Ereignisse](https://github.com/pahlborn/agentarium/blob/9962810b895baf10f8d71dd9a1f7387cca049b77/relay/claude_runtime_events.py)
- [Forge-Profil](https://github.com/pahlborn/agentarium/blob/9962810b895baf10f8d71dd9a1f7387cca049b77/.claude/agents/coding-agent.md), [Archibald-Profil](https://github.com/pahlborn/agentarium/blob/9962810b895baf10f8d71dd9a1f7387cca049b77/.claude/agents/spec-agent.md), [Cadence-Profil](https://github.com/pahlborn/agentarium/blob/9962810b895baf10f8d71dd9a1f7387cca049b77/.claude/agents/process-agent.md)
- [Projektverzeichnis](https://github.com/pahlborn/agentarium/blob/9962810b895baf10f8d71dd9a1f7387cca049b77/projekte/verzeichnis.json), aktueller Ereignisvertrag `handoffs/AG-EVENT-JOURNAL-001-anstoss-v1.md` und einschlägige Runtime-Tests; nur benötigte zusätzliche Verträge gezielt lesen.
- [Nachfolgender Integrationsauftrag INT-01 v2](https://github.com/pahlborn/agentarium/blob/da4c7fac79c798a12e6253621f4a9b476b5879ac/handoffs/big-quest/BQ-EVAL-01-INT-01.md). Dieser beschreibt den Anwendungsbedarf, autorisiert aber selbst keine Relay-Änderung. Diese Befugnis entsteht aus dem vorliegenden separaten Infrastrukturauftrag.
- Erstes Zielrepo für den Nachweis: `pahlborn/bis-school-app_src`, bekannte Basis `7995d6968e3895b88f8ed2c3b0476683e5720c1a`. Nur den ausdrücklich freigegebenen kleinen Pfadsatz verwenden, keine ursprünglichen Konto-/Schuldateien in das Modellpaket aufnehmen. Die vollständige EP06-Wiederherstellung ist dafür nicht erforderlich und bleibt außerhalb dieses Auftrags.

## 4. Technischer Owner und ehrlicher Bootstrap

Prüfe zuerst den tatsächlichen Empfangs-/Ausführungsweg. Die bestehende v2-Route kann Forge Architektur und eng begrenzte Beratung aus bereits vorbereiteten Dateien liefern lassen. Sie kann noch keine Relay- oder Big-Quest-Quelldateien bearbeiten. Lade keine Dateien oder Toolrechte nur deshalb nach, weil die Modellantwort es fordert.

Forge soll die technische Route beurteilen: kritische Annahme, kleinster tragfähiger Eingriff, Alternativen und kleinster realer Nachweis. Für die lokale Implementierung der Bridge-Erweiterung darf ein vorhandener qualifizierter technischer Ausführer mit tatsächlich passenden Rechten eingesetzt werden. Falls dies ein separater Codex-Entwicklungsvertreter ist, gelten die bestehenden Vertretungsregeln; nenne ihn als tatsächlichen Implementierer und den konkreten bisherigen Werkzeugmangel, nicht als Forge oder als Beleg eines Claude-Ausfalls. Es gibt höchstens einen aktiven Implementierungshalter je Teilaufgabe. Keine erfundene Claude-Autorenschaft für einen lokalen Bootstrap.

Eine schmale Fortschreibung des bestehenden Relays hat Vorrang vor einer neuen Agentenplattform. Prüfe zuerst, ob aktuell bereits eine passende Erweiterung existiert. Keine parallel entwickelte zweite Bridge aus Gewohnheit.

## 5. Benötigte Fähigkeiten und Grenzen

### A. Unveränderliches Projektpaket

Ein Auftrag bindet mindestens kontrollierten Auftragsstand, registriertes Zielrepository, vollständigen Zielcommit, Rolle/Modus, erlaubte Lesepfade, erlaubte Änderungen, Modell-, Turn-, Budget- und Zeitgrenzen sowie Projekt-/Lauf-/Aufgaben-/Versuchsidentität. Quellstand, technische Steuerung und Ergebnis dürfen nicht verwechselt werden.

Der vorbereitende Host beschafft genau diese Dateien und prüft Ursprung und Integrität. Verwende zunächst ausschließlich freigegebene Repositories `pahlborn/agentarium` und `pahlborn/bis-school-app_src`; keine beliebige URL-/Repo-/Redirect-Weiterleitung aus dem Workerauftrag. Erweiterung auf weitere Projekte später über überprüfbare Freigabe, nicht pauschal.

Governance, Rollenprofil, Paketmanifest, Aktivierung und Executor-Steuerung sind vom bearbeitbaren Projektcode getrennt. Zielrepo-Dateien, README/AGENTS oder Modelltexte sind keine Autorisierung, Rechte nachzuladen. Fehlende Dateien oder zu kleine Leselisten konkret als Voraussetzung melden; keinen universellen Dateisystemzugriff öffnen. Download von Projektdateien benötigt im Worker weder GitHub-Token noch eigenen GitHub-/Netzzugang.

### B. Rollenabhängiger Schreibmodus

- Architektur/Analyse, Archibald und Cadence: Projektdateien lesen; ausschließlich eigene Rückgabe bearbeiten.
- Forge-Implementierung: nur ausdrücklich freigegebene existierende Quelldateien ändern und ausdrücklich freigegebene neue Dateien anlegen. `Write` nur soweit dafür nötig. Kein global beschreibbares Checkout.
- Löschen oder Umbenennen: standardmäßig verboten; nur bei einem ausdrücklich definierten, vom Host geprüften Vorgang. Für spätere Bereinigungsaufträge kann ein enger Löschvertrag nötig sein; entfernte Originalinhalte dürfen dabei nicht unkontrolliert als öffentlicher Diff erscheinen.
- `.git`, Secret-/Credential-Pfade, fremde Repositories, Steuerungsdateien und nicht freigegebene Workflows bleiben geschützt. Absolute Pfade, Traversal, Symlinks/Hardlinks, kodierte oder mehrdeutige Pfade und Dateitypwechsel dürfen die Grenze nicht umgehen.

Dateirechte, Claude-Werkzeugfreigaben und server-/hostseitige Prüfungen müssen denselben Vertrag durchsetzen. Ergebnisprüfung umfasst neue, geänderte, entfernte oder umbenannte Dateien und unveränderte geschützte Steuerung. Nur das Präparieren einer Allowlist ohne durchgesetzte Grenzen genügt nicht.

### C. Ergebnis, Tests und Veröffentlichung getrennt

Forge liefert tatsächliches Änderungsergebnis plus Handback. Der Host erzeugt/verifiziert daraus einen auf exakten Zielcommit bezogenen Patch oder gleichwertiges Ergebnis mit Änderungsmanifest, Datei-/Paketprüfsummen und nachvollziehbarer Wiederherstellung. Ergebnis nicht nur aus einer unkontrollierten Behauptung des Modells ableiten.

Shell-/Testrechte des Claude-Workers bleiben unverändert gesperrt. Benötigte lokale Tests führt ein gesondert autorisierter begrenzter Executor am tatsächlichen Ergebnis aus. Dessen Ausführung enthält keine Anthropic-/GitHub-Schreibcredentials und darf keine ungeprüften Modellbefehle als beliebige Shellbefehle übernehmen. Prüfer und Ausführer sowie beobachtete PASS/FAIL/NOT_RUN und Zeit-/Laufreferenzen getrennt nennen.

Keine automatischen Code-Pushes, PRs, Merges oder Deployments durch das Modellergebnis. Ergebnisartefakte und Journalmeldung bleiben von Integration und Kundenannahme getrennt. Bestehende Geheimnissuche, unveränderliche Steuerung, Replay-/Versuchsbindung, begrenzte Wiederholung, Start-/Endbelege und explizite Fehlerzustände erhalten. Ein Secret-Scan allein autorisiert keine Veröffentlichung. Keine Geheimniswerte in Testfixtures, Logs, öffentlichen Artefakten oder Übergaben.

### D. Kompatibilität und Identität

Bestehende v2-Aufträge müssen ihre engen Rechte behalten. Neue Fähigkeiten über ausdrücklich versionierten Vertrag/Modus freigeben; kein stilles Aufweiten alter Aktivierungen oder Rollenprofile. Die technische Lösung kann ein neuer Schemazweig oder eine rückwärtskompatible explizite Erweiterung sein; der technische Owner begründet die kleinste wirksame Variante.

Projektübergreifende Worker melden das echte Zielprojekt und den bestehenden fachlichen Lauf; dieser Infrastrukturauftrag selbst bleibt Agentarium zugeordnet. Aktuelle Monitor-/Runtime-Schemata einhalten, keine unvalidierten Zusatzfelder oder erfundenen Starts. Die AG-ID-Prüfung nicht blind entfernen: logische BQ-Aufgaben und technische Relay-IDs überprüfbar zuordnen. Derselbe Auftrag/Versuch darf nicht doppelt ausgeführt oder irrtümlich als neue Aufgabe gestartet werden.

## 6. Nachweisfolge und Abnahme

Offline-/lokale Prüfung zuerst; Liveaufruf erst am unabhängig geprüften begrenzten Kandidaten. Keine unnötigen bezahlten Negativläufe.

| Kriterium | Erforderlicher Nachweis |
|---|---|
| R1 · Quellenbindung | Freigegebene Big-Quest-Dateien am vollständigen Commit erreichen das Paket; falsches Repo, falscher/fehlender Commit und nicht freigegebene Pfade scheitern vor Modellausführung. |
| R2 · Echter Forge-Schreibpfad | Ein begrenzter realer Forge-Lauf liest den angegebenen Big-Quest-Quellstand und liefert eine erlaubte kleine Änderung plus neue Datei im isolierten Testpaket. Verwende harmlose synthetische Test-/Dokumentationsdateien; keine fachliche Big-Quest-Weiterentwicklung und kein Remote-Code-Push. |
| R3 · Ausbruchsschutz | Negative Tests belegen Abweisung nicht erlaubter Änderungen, Erzeugung, Löschung/Umbenennung, Pfad-/Linktricks und Steuerungsmanipulation. Keine Globalschreibrechte als Testabkürzung. |
| R4 · Rollentrennung | Archibald/Cadence bleiben read-only gegenüber Projektcode; nur Forge hat im autorisierten Modus den begrenzten Implementierungsweg. Offline-Konfigurations-/Enforcement-Nachweise statt unnötiger zusätzlicher Modellaufrufe verwenden. |
| R5 · Wiederherstellung | Tatsächliches Ergebnis auf exakter Basis reproduzierbar; Datei-/Paketprüfsummen und unerlaubte Abweichungen überprüft. Manipuliertes/veraltetes Resultat wird nicht angenommen. |
| R6 · Runtime und Fehler | Empfang, tatsächlicher Start, Ende/Abbruch, Ergebnis und Kosten soweit beobachtbar korrekt zugeordnet. Fehlende Werte bleiben unbekannt; keine unbegrenzten Retries oder doppelten Läufe. |
| R7 · Kompatibilität | Relevante bestehende v2-Sicherheits-/Runtime-Tests bestehen; alter Handback-only-Auftrag bekommt keine neuen Rechte. |
| R8 · Unabhängigkeit und Wirkung | Argus prüft das Sicherheitsmodell und den genauen Änderungssatz; Sentinel prüft den echten begrenzten Quellpaket→Forge→Ergebnis-Pfad. Keine Freigabe von Big Quest oder Produktionsbetrieb daraus ableiten. |

Der echte Lauf ist ausdrücklich erlaubt, aber nur als dieser bounded Nachweis mit bestehender Anthropic-Anbindung, benannten Pfaden und vorab gesetzten Grenzen. Weitere Live-Rollenaufrufe nur für eine benannte unverzichtbare Lücke innerhalb des Aufgabenbudgets. Kein neuer Machbarkeitspilot für Big Quest selbst.

## 7. Befugnisse, Kosten und Stoppgrenzen

Dieser Entwicklungsauftrag erlaubt lokale Relay-/Workflow-/Vertragsänderungen im nötigen Umfang, gezielte lokale Prüfungen, unabhängige Review/QA und die für diese Abnahme notwendigen begrenzten Relay-/Test-Actions. Vor jedem Push/PR konkrete Trigger und Berechtigungen prüfen. Ein separater Infrastrukturbranch und ein bereinigter Draft-PR im Agentarium-Repo sind als überprüfbare Lieferung erlaubt; keine unkontrollierten Folgeworkflows oder Veröffentlichungen. Wenn sich ein sicherer Lieferweg nicht herstellen lässt, lokal wiederherstellbar liefern und die konkrete Sperre benennen.

Kein Merge nach main, keine automatische Aktivierung als allgemeiner Standard, keine produktiven Big-Quest-Modellaufrufe, keine Bereitstellung der App und keine Änderung des Produkts. Kein allgemeines GitHub-Token für den Worker, kein unbeschränktes Bash/Web und keine automatische Agentendelegation. Keine neue Geheimnisanforderung, bevor vorhandene Bindungen und der konkrete Vorgang geprüft sind; niemals Secretwerte in Chat anfordern.

Geltende Kostenregel anwenden: Ganze Aufgabe über alle Versuche schätzen; unter USD5 sind benötigte Modellläufe durch den Task gedeckt. Ab USD5 vor Fortsetzung Freigabe mit Schätzung und Grundlage anfordern. Zusätzlich jeden Lauf konkret begrenzen. Eine Hardcap ist keine Verbrauchsschätzung; fehlende Verbrauchsdaten nicht als null ausgeben. Keine automatischen Schleifen zur Reparatur von API-, Sicherheits- oder Testfehlern.

Materielle Änderung an Rollen-/Sicherheitsmodell außerhalb dieses Vertrags: konkreten Befund und kleinste Alternative zurückgeben. Vorbereitete Arbeit sichern; keine parallel laufenden Halter und keine pauschale Wiederholung alter Prüfungen. Die laufende Aufgabe nicht eigenständig in weitere Plattform-, Produkt- oder Agentenprojekte erweitern.

## 8. Rückgabe und Ende

Die zentrale Steuerung erhält eine kopierbare Markdown-Rückgabe:

```markdown
# AG-RELAY-MULTIREPO-001 · Rückgabe v1
Status: DELIVERED / BLOCKED / NEEDS_DECISION
Auftrag v1 / unveränderlicher Link:
Regel-/Implementierungsbasis:
Technischer Owner, tatsächlicher Autor und Executor; echte Rollen-/Run-Referenzen:
Kandidaten-Commit/Baum, Branch/PR oder wiederherstellbares Artefakt mit SHA256:
Vertrag/Modi und erlaubte Repo-/Lese-/Schreibgrenzen:
R1–R8 jeweils PASS/FAIL/BLOCKED/NOT_RUN mit Originalbeleg:
Argus-/Sentinel-Befund und noch offene Grenzen:
Actions/Claude-Läufe, tatsächlicher Zweck, gesetzte Limits und beobachteter Verbrauch:
Bestehender v2-Betrieb unverändert / konkrete Kompatibilitätsabweichung:
Aktivierung/Deployment: nicht erfolgt; ggf. isolierter Nachweis exakt benannt:
Arbeitsstand und Archivbeleg oder konkreter Schreibblocker:
INT-01 jetzt technisch ausführbar: JA/NEIN, exakter geprüfter Aufrufweg:
Nächster nötiger Schritt, noch nicht begonnen:
```

Die Rückgabe muss ein verwendbares Auftragsbeispiel für Big-Quest-Lesen und Forge-Implementierung enthalten, mit exakten Versionen und benötigten Hostrechten ohne Geheimnisse. `DELIVERED` bedeutet geprüfter Kandidat, nicht Merge, allgemeine Aktivierung oder Freigabe von INT-01. Danach stoppen; nur der zentrale Steuerungschat beauftragt Integration/Aktivierung und Fortsetzung von INT-01.
