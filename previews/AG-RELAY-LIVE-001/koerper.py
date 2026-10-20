#!/usr/bin/env python3
"""AG-RELAY-LIVE-001 — echte Kommentarkoerper erzeugen, ohne Netz und ohne Modell.

Nicht nachgebaut: dieses Skript ruft `announce()` und `publish()` aus
`relay/claude_public_relay_v2.py` selbst auf und faengt nur den Netzaufruf ab.
Was hier herauskommt, ist Zeichen fuer Zeichen das, was das Relais auf Issue #2
schreiben wuerde. Ein nachgebauter Koerper wuerde beweisen, dass meine
Nachbildung zum Parser passt -- nicht, dass das Relais es tut.

    python3 previews/AG-RELAY-LIVE-001/koerper.py <ausgabe.json>
"""
import importlib.util
import json
import os
import shutil
import sys
import tempfile
from pathlib import Path

WURZEL = Path(__file__).resolve().parents[2]
QUELLE = WURZEL / "relay" / "claude_public_relay_v2.py"

TASK = "AG-RELAY-TASK-LIVE-001"
LAUF = "39266581121"
LAUF2 = "39266581122"   # eigener Lauf fuer den Kontrollfolgenfall: sonst truege
                        # er dieselbe Ereignis-Kennung wie der Fall davor und
                        # der Monitor haelte ihn zu Recht fuer eine Wiederholung.
HANDBACK = "handoffs/AG-RELAY-TASK-LIVE-001-handback.md"


def laden(arbeit: Path):
    """Das echte Modul laden, mit umgebogenen Verzeichnissen."""
    spec = importlib.util.spec_from_file_location("relay_echt", QUELLE)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    m.PREPARED = arbeit / "relay-prepared"
    m.RESULT = arbeit / "relay-result"
    return m


def buendel(m, arbeit: Path, lauf: str = LAUF) -> dict:
    """Ein gueltiges Vorbereitungsbuendel, wie `prepare()` es hinterlaesst."""
    if m.PREPARED.exists():
        shutil.rmtree(m.PREPARED)
    (m.PREPARED / "control").mkdir(parents=True)
    kontext = {
        "repository": m.REPO, "head": "b" * 40, "source_commit": "a" * 40,
        "activation": {"schema": "agentarium.relay-activation.v2", "task_id": TASK,
                       "authorized": True, "source_commit": "a" * 40,
                       "role": "coding-agent", "request": "handoffs/anfrage.json",
                       "handback": HANDBACK, "model": "platt", "max_turns": 4,
                       "max_budget_usd": 1.0},
        "request": {"schema": "agentarium.handoff.v0", "task_id": TASK},
        "readable_paths": ["AGENTS.md"], "prepared_at": m.now(), "run_id": lauf,
    }
    (m.PREPARED / "control/context.json").write_text(
        json.dumps(kontext, indent=2, ensure_ascii=False))
    (m.PREPARED / "manifest.json").write_text(json.dumps(m.manifest(m.PREPARED), indent=2))
    return kontext


def ergebnis_fertig(m, kontext: dict, handback_text: str) -> None:
    """Ein gueltiges RESULT_READY-Paket, wie `run_model()` es hinterlaesst."""
    if m.RESULT.exists():
        shutil.rmtree(m.RESULT)
    m.RESULT.mkdir(parents=True)
    rohdaten = handback_text.encode()
    (m.RESULT / "handback.md").write_bytes(rohdaten)
    meta = m.base_metadata(kontext, "result_ready")
    meta.update(stopped_at=m.now(), elapsed_seconds=35.358,
                session_id="s-0000-1111", usage={"input_tokens": 12, "output_tokens": 34},
                total_cost_usd=0.138052, changed_paths=[HANDBACK],
                handback_sha256=m.sha256(rohdaten), secret_scan="passed")
    m.write_scanned_metadata(meta)


def fangen(m):
    """`post_issue` abfangen -- kein Netz, kein Schluessel."""
    gefangen = []
    m.post_issue = lambda body: gefangen.append(body) or {"id": len(gefangen)}
    return gefangen


def main() -> int:
    ziel = Path(sys.argv[1] if len(sys.argv) > 1 else "koerper.json")
    arbeit = Path(tempfile.mkdtemp(prefix="ag-relay-live-"))
    try:
        m = laden(arbeit)
        kontext = buendel(m, arbeit)
        koerper = {}

        # 1 — der Empfang, aus announce()
        gefangen = fangen(m)
        m.announce()
        koerper["HOST_RECEIVED"] = gefangen[-1]

        # 2 — der Ruecklauf mit sauberem Handback, aus publish()
        ergebnis_fertig(m, kontext, "# Handback\nFertig. Nichts besonderes darin.\n")
        gefangen = fangen(m)
        m.publish()
        koerper["RESULT_READY"] = gefangen[-1]

        # 3 — der fehlende Lauf: fallback() und dann publish()
        shutil.rmtree(m.RESULT)
        m.ensure_fallback()
        gefangen = fangen(m)
        m.publish()
        koerper["BLOCKED"] = gefangen[-1]

        # 4 — der Handback traegt die Steuerfolge EINGEBETTET. publish() muss
        #     daraus eine Blockmeldung machen und den Handback weglassen.
        kontext2 = buendel(m, arbeit, LAUF2)
        ergebnis_fertig(m, kontext2,
                        "# Handback\nBeispiel: " + m.AG_MARKER +
                        " so sieht ein Ereignis aus.\n")
        gefangen = fangen(m)
        m.publish()
        koerper["BLOCKED_KONTROLLFOLGE"] = gefangen[-1]

        # 5 — die Gegenprobe: derselbe Fall OHNE Schutz, von Hand gebaut.
        #     Nur dieser eine Koerper ist nachgestellt, und er soll scheitern:
        #     er zeigt, wogegen Nummer 4 schuetzt.
        koerper["OHNE_SCHUTZ_ERWARTET_ABGEWIESEN"] = (
            koerper["RESULT_READY"].replace(
                "Fertig. Nichts besonderes darin.",
                "Beispiel: " + m.AG_MARKER + " so sieht ein Ereignis aus."))

        ziel.write_text(json.dumps(koerper, indent=2, ensure_ascii=False))
        for name, body in koerper.items():
            print(f"{name}: {len(body)} Zeichen, Marker {body.count(m.AG_MARKER)}x")
        print("geschrieben nach " + str(ziel))
        return 0
    finally:
        shutil.rmtree(arbeit, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main())
