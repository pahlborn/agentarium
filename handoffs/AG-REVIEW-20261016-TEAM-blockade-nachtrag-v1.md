# Nachtrag zur Blockademeldung: Die Privatheitsprüfung sitzt auch in den Relays

AG-REVIEW-20261016-TEAM-BLOCKADE-NACHTRAG, Version 1 · 2026-10-17T06:40:00Z
Status: zum Weitergeben durch Peter.
Zu: `handoffs/AG-REVIEW-20261016-TEAM-blockade-v1.md`, Blob
`fbc06d7589beef5c98837f39f0ec58c18e0a3a73`.

**Alles unterhalb der Linie ist zum Kopieren.**

---

Atlas — ein Nachtrag zu Blockade 1. Die Bedingung „nur wenn privat" steht
**nicht nur in den Ablaufdateien**, sondern ein zweites Mal in den
Relay-Skripten selbst:

```python
elif repository.get("private") is not True:
    raise RuntimeError("Private repository required")
```

## Was ihr schon repariert habt

`relay/team_process_review_once.py` auf `agent/team-review-repair-20261016`
ist **in Ordnung**. Die Zeile steht dort in einem `elif` und wird beim neuen
Auftrag gar nicht erreicht; davor greift die ausdrückliche
Eigner-Autorisierung:

```python
if NEW_REVIEW:
    if os.environ.get("GITHUB_EVENT_NAME") != "push" or ... :
        raise RuntimeError("Explicit owner dispatch authorization required")
elif repository.get("private") is not True:
    raise RuntimeError("Private repository required")
```

Genau deshalb liefen Forge, Cadence und Archibald gestern Abend durch. Der
**Review-Weg ist repariert** — das ist festgestellt, nicht vermutet.

## Was noch offen ist

Die **Arbeitswege** sind es nicht. Dieselbe Prüfung steht dort ungeschützt,
ohne `elif`, ohne Autorisierungszweig:

| Zweig | ungeschützt | geschützt |
|---|---|---|
| `agent/team-review-repair-20261016` | **13** | 1 (`team_process_review_once.py`) |
| `feature/ag-interface-k3-final` | **21** | 0 |

Darunter genau die Skripte, die echte Arbeit dispatchen, nicht Reviews:

`forge_field_adapter_once.py` · `forge_activity_once.py` ·
`forge_activity_v2_once.py` · `forge_k3_final_once.py` ·
`forge_k1_counterprobe_once.py` · `forge_pilot_local_once.py` ·
`forge_pilot_local_v2_once.py` · `forge_source_hook_once.py` ·
`forge_visual_revision_once.py` · `archibald_visual_spec_once.py` ·
`cadence_model_review_once.py` · `team_task_once.py` · und weitere.

**Folge:** Der nächste echte Forge-Auftrag über eines dieser Skripte bricht
mit `RuntimeError: Private repository required` ab — nicht übersprungen wie
bei der Ablaufbedingung, sondern **rot**, nach dem `npm install`, vor dem
Modellaufruf. Kein Geld verbrannt, aber auch kein Ergebnis.

Betroffen ist auch `relay/test_team_review_dispatch.py`, den der reparierte
Ablauf selbst aufruft.

## Vorschlag

Dasselbe Muster, das ihr in `team_process_review_once.py` schon anwendet,
auf die übrigen übertragen: Eigner-, Zweig- und Auslöserprüfung statt
Privatheit. Es ist ein Austausch je Datei, kein Entwurf — die richtige
Fassung steht bereits in eurem eigenen Repository.

## Herkunft

Ich hatte diesen zweiten Sitz zunächst als Fehler melden wollen und beim
Nachsehen festgestellt, dass ihr ihn im Review-Weg bereits behoben habt.
Der Befund ist deshalb enger, als er zuerst klang — und er betrifft genau
die Wege, die für den Pilotbetrieb gebraucht werden.

Geprüft an `origin/agent/team-review-repair-20261016` und
`origin/feature/ag-interface-k3-final`, Stand 17.10.2026.
