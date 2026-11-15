# BQ-EVAL-01-INT-01 · Eingaben in GitHub

Diese Dateien sind die Eingaben für Auftrag v2. Der ausführende Atlas lädt sie selbst. Peter muss keine Dateien erneut herunterladen, hochladen oder zwischen Chats verschieben.

| Paket | SHA-256 |
|---|---|
| [gesamtuebergabe-public-v1.zip](gesamtuebergabe-public-v1.zip) | `ae795684af186fd3fad29c7ff6ff1dd6e4c3e690474d67e37a47b87ab056d77e` |
| [cleanup-overlay-public-v1.zip](cleanup-overlay-public-v1.zip) | `60bcfad3dfe341c21400a6450f8094bd3af3bf4c4c40562e6d3b81b74bd32ca6` |

[Maschinenlesbares Manifest mit Herkunft und Änderungsliste](manifest.json).

## Abruf ohne Library oder Chat-Anhang

Die relativen Links beziehen sich auf denselben Repository-Commit wie dieses Dokument. Nutze eine verfügbare GitHub-Datei-Leseaktion oder die Raw-Datei-URL mit diesem Commit. Über read-only Git-Zugriff können dieselben Dateien mit `git show <COMMIT>:handoffs/big-quest/inputs/BQ-EVAL-01-INT-01/<DATEINAME>` gelesen werden. Ein Git-Read oder Fetch startet keinen Workflow. Ablage außerhalb getrackter Projektdateien, danach SHA-256 vergleichen und Archivpfade kontrollieren.

Im Gesamtpaket zuerst `Big-Quest-Atlas-Gesamtuebergabe.md` und `PUBLICATION-NOTES.md` lesen. Im Overlay `manifest.json`, `RECOVERY.md` und `PUBLICATION-NOTES.md` beachten. Historische nächste Schritte sind keine neuen Aufträge; es gilt die jeweils beauftragte Fassung von INT-01.

## Herkunft und Prüfumfang

Die ursprünglichen Übergaben wurden für öffentliche Ablage um wenige verbliebene alte Kennungen in Test-Fixtures bereinigt. Tokenähnliche Fixture-Werte wurden durch offensichtlich deterministische Dummy-Werte ersetzt; es werden keine Originalwerte oder Zuordnungstabellen veröffentlicht. Originalarchive bleiben unverändert im Steuerungsworkspace.

Die kumulativen und inkrementellen Entwicklungspatches sind unverändert. Die zusätzliche Änderung der anonymisierten Quellkopie ist keine Änderung des damit rekonstruierten Original-Prüfbaums. Die Quellkopie ist weiterhin unvollständig und darf nicht als alleinige Buildbasis eingesetzt werden.

Geprüft wurden ZIP-Integrität, alle neuen Dateiprüfsummen, Abwesenheit der bekannten ursprünglichen Kontokennungen und Unverändertheit der beiden Entwicklungspatches. Es gab keine neue Anwendungstest-Ausführung oder unabhängige Abnahme der Publikationsvarianten. Frühere Reviews und Sentinel-Protokolle beziehen sich auf ihre jeweils angegebenen Originalstände. Der Integrationsauftrag verlangt die Prüfung des tatsächlichen neuen Kandidaten.

Wenn ein Link nicht lesbar ist, zuerst den vorhandenen Git-/Raw-Leseweg versuchen und die konkrete Fehlermeldung prüfen. Nicht standardmäßig Peter zum Dateitransport auffordern und keine unpassende andere Quelle einsetzen.
