# AG-GH-LIVE-004 — Vorbereiteter echter Mehrrollen-Pilot

Status: vorbereitet, NICHT gestartet. Aktivierung erst nach Peters Bestätigung, dass der neue Original-Monitor Fassung 51 geöffnet und verbunden ist.

Fachauftrag: Forge erstellt aus dem tatsächlichen Adapter zwei kurze Hinweise zum Gerätewechsel und einen prüfbaren Fehlfall. Sentinel prüft diese Hinweise unabhängig gegen Source und vorhandene Ablauf-QA; keine erfundene Windows-Freigabe.

Geplanter tatsächlicher Ablauf:
1. Atlas aktiviert den gesonderten Probeauftrag. Der Host prüft Berechtigung und Einmaligkeit und bestätigt den Empfang.
2. Ein Host-Checkpoint meldet die tatsächliche Übergabe Atlas → Forge; er behauptet keinen Laufzeitbeginn und trägt reported_checkpoint.
3. Reale Read/Edit-Aufrufe des separaten Claude-Prozesses werden wie bisher als runtime_stream gemeldet.
4. Erst nach tatsächlichem Handback meldet der Host den Bericht Forge → Atlas als contribution, ausdrücklich reported_checkpoint.
5. Atlas übergibt den tatsächlichen Bericht an einen echten Sentinel-Subagenten und protokolliert Atlas → Sentinel als gemeldeten Checkpoint.
6. Erst nach dessen tatsächlicher Antwort protokolliert Atlas die Rückgabe Sentinel → Atlas. Quelle und Abnahmelimit bleiben sichtbar; daraus folgt keine automatische Produktfreigabe.

Alle Ereignisse teilen monitor_run_id AG-GH-LIVE-004-PROBE-20261018. Projekt-, Lauf-, Aufgaben-, Ereignis- und Quellreferenz werden erhalten. Forge-Lauf und Sentinel-Auftrag erhalten jeweils ihren echten Ausführungsnachweis.

Es wird nichts abgespielt, erfunden oder durch Öffnen des Monitors als Arbeit ausgelöst. Die hier beschriebene Planung ist kein Ereignisnachweis. Arbeitsring, Done, Artefaktabnahme und tatsächliches Modell werden nicht aus diesen Kommunikationsmeldungen abgeleitet.

Host-Prüfung vor Aktivierung: Python-Syntax und tatsächlicher Checkpoint-Helper mit lokalen synthetischen Fixtures geprüft (Marker, echte Zeilenumbrüche, JSON, Herkunft und Empfangsbeleg); kein Netzwerk und kein bezahlter Probeaufruf dabei. Der reale Mehrrollen-Gerätenachweis bleibt bis zur Durchführung offen.
