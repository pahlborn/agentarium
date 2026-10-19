#!/usr/bin/env python3
"""Hardened public-repository Claude relay: prepare -> run -> publish.

The model job receives no GitHub token and can read only an isolated bundle.
It may edit exactly one pre-created handback file.  Publication happens in a
separate job after integrity and secret checks.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import math
import os
import re
import shutil
import stat
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path, PurePosixPath

REPO = "pahlborn/agentarium"
API = "https://api.github.com/repos/" + REPO
ACTIVATION = "handoffs/activate/AG-RELAY-PUBLIC-SEC-001.json"
PREPARED = Path("relay-prepared").resolve()
RESULT = Path("relay-result").resolve()
MARKER_PREFIX = "<!-- AG_RELAY_PUBLIC_V2:"
ROLES = {
    "coding-agent": ".claude/agents/coding-agent.md",
    "spec-agent": ".claude/agents/spec-agent.md",
    "process-agent": ".claude/agents/process-agent.md",
}
TOKEN_KEYS = (
    "GH_TOKEN", "GITHUB_TOKEN", "ACTIONS_RUNTIME_TOKEN",
    "ACTIONS_ID_TOKEN_REQUEST_TOKEN", "ACTIONS_CACHE_URL",
)
GITHUB_ACTIONS_BOT_ID = "41898282"
SUSPICIOUS = re.compile(rb"(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-ant-[A-Za-z0-9_-]{20,})")


def now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat()


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def git(*args: str, binary: bool = False):
    return subprocess.check_output(["git", *args], text=not binary).strip() if not binary else subprocess.check_output(["git", *args])


def source(ref: str, path: str) -> bytes:
    return subprocess.check_output(["git", "show", f"{ref}:{path}"])


def clean_path(value: object, *, prefix: str | None = None) -> str:
    if not isinstance(value, str) or not value or "\\" in value:
        raise ValueError("invalid repository path")
    p = PurePosixPath(value)
    if p.is_absolute() or ".." in p.parts or str(p) != value:
        raise ValueError("path traversal or non-canonical path")
    if prefix and not value.startswith(prefix):
        raise ValueError(f"path outside {prefix}")
    return value


def load_json_bytes(data: bytes, label: str) -> dict:
    try:
        value = json.loads(data)
    except Exception as exc:
        raise ValueError(f"invalid {label} JSON") from exc
    if not isinstance(value, dict):
        raise ValueError(f"invalid {label} object")
    return value


def validate_activation(a: dict, parent: str) -> dict:
    required = {
        "schema", "task_id", "authorized", "source_commit", "role",
        "request", "handback", "model", "max_turns", "max_budget_usd",
    }
    if set(a) != required or a["schema"] != "agentarium.relay-activation.v2":
        raise ValueError("activation schema mismatch")
    if a["authorized"] is not True or a["source_commit"] != parent:
        raise ValueError("activation authority/source mismatch")
    if not re.fullmatch(r"AG-[A-Z0-9-]{4,80}", str(a["task_id"])):
        raise ValueError("invalid task id")
    if a["role"] not in ROLES:
        raise ValueError("unknown role")
    a["request"] = clean_path(a["request"], prefix="handoffs/")
    a["handback"] = clean_path(a["handback"], prefix="handoffs/")
    if a["request"] == a["handback"]:
        raise ValueError("request and handback must differ")
    if not isinstance(a["model"], str) or not a["model"]:
        raise ValueError("model must be explicit")
    if isinstance(a["max_turns"], bool) or not isinstance(a["max_turns"], int) or not 1 <= a["max_turns"] <= 64:
        raise ValueError("max_turns outside 1..64")
    if (not finite_number(a["max_budget_usd"]) or
            not 0.05 <= float(a["max_budget_usd"]) <= 25):
        raise ValueError("max_budget_usd outside safety range")
    return a


def validate_request(packet: dict, a: dict) -> list[str]:
    if packet.get("schema") != "agentarium.handoff.v0" or packet.get("task_id") != a["task_id"]:
        raise ValueError("request identity mismatch")
    if packet.get("allowed_paths") != [a["handback"]]:
        raise ValueError("request write boundary mismatch")
    readable = packet.get("readable_paths")
    if not isinstance(readable, list) or not readable or len(readable) > 40:
        raise ValueError("readable_paths required (1..40)")
    paths = [clean_path(p) for p in readable]
    profile = ROLES[a["role"]]
    for required in ("AGENTS.md", "CLAUDE.md", profile, a["request"]):
        if required not in paths:
            raise ValueError(f"required readable path missing: {required}")
    if a["handback"] in paths:
        raise ValueError("handback must not be trusted input")
    if len(paths) != len(set(paths)):
        raise ValueError("duplicate readable path")
    return paths


def api(path: str, payload: dict | None = None):
    token = os.environ.get("GH_TOKEN")
    if not token:
        raise RuntimeError("Missing GH_TOKEN")
    headers = {"Authorization": "Bearer " + token, "Accept": "application/vnd.github+json",
               "X-GitHub-Api-Version": "2022-11-28"}
    data = json.dumps(payload).encode() if payload is not None else None
    if data is not None:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(API + path, data=data, headers=headers,
                                 method="POST" if data is not None else "GET")
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.load(response)


def post_issue(body: str):
    return api("/issues/2/comments", {"body": body})


def marker(task_id: str, source_commit: str, phase: str,
           activation_commit: str, run_id: str) -> str:
    return MARKER_PREFIX + ":".join(
        (task_id, source_commit, phase, activation_commit, run_id)) + " -->"


def trusted_terminal_row(row: object, task_id: str, source_commit: str) -> bool:
    if not isinstance(row, dict) or str((row.get("user") or {}).get("id")) != GITHUB_ACTIONS_BOT_ID:
        return False
    body = str(row.get("body", ""))
    first = body.splitlines()[0] if body else ""
    pattern = re.compile(
        r"^" + re.escape(MARKER_PREFIX + task_id + ":" + source_commit + ":RESULT_READY:") +
        r"([0-9a-f]{40}):([0-9]+) -->$")
    match = pattern.fullmatch(first)
    if not match:
        return False
    run_id = match.group(2)
    expected_run_url = f"https://github.com/{REPO}/actions/runs/{run_id}"
    return expected_run_url in body.splitlines()[1:]


def history_contains_terminal(task_id: str, source_commit: str) -> bool:
    page = 1
    while True:
        rows = api(f"/issues/2/comments?per_page=100&page={page}")
        if not isinstance(rows, list):
            raise RuntimeError("invalid comment history")
        if any(trusted_terminal_row(row, task_id, source_commit) for row in rows):
            return True
        if len(rows) < 100:
            return False
        page += 1
        if page > 10000:
            raise RuntimeError("history end not proven")


def manifest(root: Path) -> dict[str, str]:
    return {str(p.relative_to(root)): sha256(p.read_bytes())
            for p in sorted(root.rglob("*")) if p.is_file() and p.name != "manifest.json"}


def verify_manifest(root: Path) -> None:
    expected = json.loads((root / "manifest.json").read_text())
    actual = manifest(root)
    if actual != expected:
        raise RuntimeError("prepared bundle integrity mismatch")


def prepare() -> None:
    expected = {"GITHUB_REPOSITORY": REPO, "GITHUB_ACTOR_ID": "277496791", "GITHUB_EVENT_NAME": "push"}
    for key, value in expected.items():
        if os.environ.get(key) != value:
            raise RuntimeError("unauthorized context " + key)
    head, parent = git("rev-parse", "HEAD"), git("rev-parse", "HEAD^")
    changes = git("diff-tree", "--no-commit-id", "--name-status", "-r", "HEAD").splitlines()
    if changes != ["A\t" + ACTIVATION]:
        raise RuntimeError("activation commit must add only " + ACTIVATION)
    a = validate_activation(load_json_bytes(source(head, ACTIVATION), "activation"), parent)
    if history_contains_terminal(a["task_id"], parent):
        raise RuntimeError("task/source already completed")
    packet = load_json_bytes(source(parent, a["request"]), "request")
    paths = validate_request(packet, a)

    if PREPARED.exists():
        shutil.rmtree(PREPARED)
    workspace = PREPARED / "workspace"
    control = PREPARED / "control"
    workspace.mkdir(parents=True)
    control.mkdir()
    for name in paths:
        target = workspace / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(source(parent, name))
    handback = workspace / a["handback"]
    handback.parent.mkdir(parents=True, exist_ok=True)
    handback.write_text("# Handback\n")
    context = {"repository": REPO, "head": head, "source_commit": parent,
               "activation": a, "request": packet, "readable_paths": paths,
               "prepared_at": now(), "run_id": os.environ.get("GITHUB_RUN_ID")}
    (control / "context.json").write_text(json.dumps(context, indent=2, ensure_ascii=False))
    (control / "settings.json").write_text(json.dumps({"permissions": {
        "blockReadsOutsideWorkingDirectories": True,
        "allow": [f"Edit(/{a['handback']})"],
        "deny": ["Bash", "WebFetch", "WebSearch", "Agent", "mcp__*"],
    }}, indent=2))
    shutil.copy2(Path(__file__).resolve(), PREPARED / "relay_driver.py")
    (PREPARED / "manifest.json").write_text(json.dumps(manifest(PREPARED), indent=2))
    run_url = f"https://github.com/{REPO}/actions/runs/{os.environ.get('GITHUB_RUN_ID', '')}"
    run_id = str(os.environ.get("GITHUB_RUN_ID", "unknown"))
    post_issue(marker(a["task_id"], parent, "HOST_RECEIVED", head, run_id) +
               f"\n## {a['task_id']} — HOST_RECEIVED\n{run_url}\n"
               "Vorbereitung geprüft; der Claude-Lauf hat keinen GitHub-Schlüssel.")


def make_read_only(root: Path, writable: Path) -> None:
    for path in sorted(root.rglob("*"), reverse=True):
        if path.is_file():
            path.chmod(0o444)
        elif path.is_dir():
            path.chmod(0o555)
    root.chmod(0o555)
    writable.chmod(0o644)


def child_environment() -> dict[str, str]:
    allowed = ("PATH", "HOME", "TMPDIR", "LANG", "LC_ALL", "ANTHROPIC_API_KEY")
    return {key: os.environ[key] for key in allowed if key in os.environ}


def claude_command(context: dict, settings: Path) -> list[str]:
    a, packet = context["activation"], context["request"]
    profile = (PREPARED / "workspace" / ROLES[a["role"]]).read_text()
    config = {a["role"]: {"description": "Bounded Agentarium relay task",
                           "prompt": profile, "tools": ["Read", "Edit"]}}
    return [
        "claude", "--bare", "-p", json.dumps(packet, ensure_ascii=False),
        "--agents", json.dumps(config, ensure_ascii=False), "--agent", a["role"],
        "--tools", "Read,Edit", "--allowedTools", f"Edit(/{a['handback']})",
        "--disallowedTools", "Bash,WebFetch,WebSearch,Agent,mcp__*",
        "--permission-mode", "dontAsk", "--settings", str(settings),
        "--model", a["model"], "--max-turns", str(a["max_turns"]),
        "--max-budget-usd", str(a["max_budget_usd"]),
        "--no-session-persistence", "--output-format", "stream-json", "--verbose",
    ]


def secret_hit(data: bytes, exact: bytes | None = None) -> bool:
    return bool((exact and exact in data) or SUSPICIOUS.search(data))


RESULT_KEYS = {
    "schema", "task_id", "source_commit", "activation_commit", "run_id",
    "phase", "started_at", "stopped_at", "elapsed_seconds", "session_id",
    "usage", "total_cost_usd", "failure", "changed_paths", "secret_scan",
    "handback_sha256",
}


def base_metadata(context: dict, phase: str = "running") -> dict:
    a = context["activation"]
    return {
        "schema": "agentarium.relay-result.v2",
        "task_id": a["task_id"],
        "source_commit": context["source_commit"],
        "activation_commit": context["head"],
        "run_id": str(context.get("run_id") or "unknown"),
        "phase": phase,
        "started_at": now(),
        "stopped_at": None,
        "elapsed_seconds": None,
        "session_id": None,
        "usage": None,
        "total_cost_usd": None,
        "failure": None,
        "changed_paths": [],
        "secret_scan": "pending",
        "handback_sha256": None,
    }


def write_scanned_metadata(meta: dict, exact: bytes | None = None) -> None:
    encoded = json.dumps(meta, indent=2, ensure_ascii=False).encode()
    if secret_hit(encoded, exact):
        raise RuntimeError("secret scan blocked metadata")
    (RESULT / "metadata.json").write_bytes(encoded)


def run_model() -> None:
    if RESULT.exists():
        shutil.rmtree(RESULT)
    RESULT.mkdir()
    api_key = os.environ.get("ANTHROPIC_API_KEY", "").encode()
    start = time.monotonic()
    raw_tmp = RESULT / "stream.pending"
    err_tmp = RESULT / "stderr.pending"
    result = None
    blocked = None
    meta = None
    try:
        verify_manifest(PREPARED)
        context = json.loads((PREPARED / "control/context.json").read_text())
        a = context["activation"]
        meta = base_metadata(context)
        write_scanned_metadata(meta, api_key or None)
        work = PREPARED / "workspace"
        handback = work / a["handback"]
        before = {str(p.relative_to(work)): p.read_bytes() for p in work.rglob("*") if p.is_file()}
        make_read_only(work, handback)
        command = claude_command(context, PREPARED / "control/settings.json")
        if "Read" in command[command.index("--allowedTools") + 1].split(","):
            raise RuntimeError("bare Read permission forbidden")
        if not api_key:
            raise RuntimeError("Missing ANTHROPIC_API_KEY")
        with raw_tmp.open("w") as raw, err_tmp.open("w") as errors:
            proc = subprocess.Popen(command, cwd=work, env=child_environment(), stdout=subprocess.PIPE,
                                    stderr=errors, text=True, bufsize=1)
            assert proc.stdout is not None
            for line in proc.stdout:
                raw.write(line)
                try:
                    item = json.loads(line)
                    if item.get("type") == "result":
                        result = item
                except ValueError:
                    pass
            proc.wait()
        combined = raw_tmp.read_bytes() + err_tmp.read_bytes() + handback.read_bytes()
        if secret_hit(combined, api_key):
            raise RuntimeError("secret scan blocked result")
        after = {str(p.relative_to(work)): p.read_bytes() for p in work.rglob("*") if p.is_file()}
        changed = sorted(name for name in set(before) | set(after) if before.get(name) != after.get(name))
        if changed != [a["handback"]]:
            raise RuntimeError("changed-path boundary mismatch: " + ", ".join(changed))
        if proc.returncode or not result or result.get("is_error"):
            raise RuntimeError("Claude process failed or returned no valid result")
        shutil.copy2(handback, RESULT / "handback.md")
        raw_tmp.rename(RESULT / "stream.jsonl")
        err_tmp.rename(RESULT / "stderr.txt")
        meta.update(phase="result_ready", stopped_at=now(), elapsed_seconds=time.monotonic() - start,
                    session_id=result.get("session_id"), usage=result.get("usage"),
                    total_cost_usd=result.get("total_cost_usd"), changed_paths=changed,
                    handback_sha256=sha256(handback.read_bytes()), secret_scan="passed")
    except Exception as exc:
        raw_tmp.unlink(missing_ok=True)
        err_tmp.unlink(missing_ok=True)
        if meta is None:
            try:
                context = json.loads((PREPARED / "control/context.json").read_text())
                meta = base_metadata(context)
            except Exception:
                meta = {key: None for key in RESULT_KEYS}
                meta.update(schema="agentarium.relay-result.v2", task_id="AG-RELAY-INFRA",
                            source_commit="unknown", activation_commit="unknown",
                            run_id=str(os.environ.get("GITHUB_RUN_ID", "unknown")),
                            started_at=now(), changed_paths=[])
        meta.update(phase="blocked", stopped_at=now(), elapsed_seconds=time.monotonic() - start,
                    failure=type(exc).__name__, session_id=None, usage=None,
                    total_cost_usd=None, handback_sha256=None,
                    secret_scan="blocked")
        (RESULT / "BLOCKED.txt").write_text("Result withheld by relay safety checks.\n")
        blocked = exc
    try:
        write_scanned_metadata(meta, api_key or None)
    except RuntimeError as exc:
        for name in ("handback.md", "stream.jsonl", "stderr.txt"):
            (RESULT / name).unlink(missing_ok=True)
        meta.update(phase="blocked", stopped_at=now(), elapsed_seconds=time.monotonic() - start,
                    failure="MetadataSecretBlocked", session_id=None, usage=None,
                    total_cost_usd=None, changed_paths=[], handback_sha256=None,
                    secret_scan="blocked")
        (RESULT / "BLOCKED.txt").write_text("Result withheld by relay safety checks.\n")
        write_scanned_metadata(meta)
        blocked = exc
    if blocked is not None:
        raise RuntimeError("relay blocked; sanitized evidence prepared") from blocked


def ensure_fallback() -> None:
    """Create a fixed BLOCKED result after job timeout/crash or absent artifact."""
    verify_manifest(PREPARED)
    context = json.loads((PREPARED / "control/context.json").read_text())
    RESULT.mkdir(parents=True, exist_ok=True)
    existing = RESULT / "metadata.json"
    if existing.exists():
        try:
            current = json.loads(existing.read_text())
            validate_result(current, context, RESULT)
            return
        except Exception:
            pass
    for child in RESULT.iterdir():
        if child.is_file():
            child.unlink()
    meta = base_metadata(context, "blocked")
    meta.update(stopped_at=now(), failure="RUN_JOB_NO_RESULT", secret_scan="blocked")
    (RESULT / "BLOCKED.txt").write_text("Run job produced no publishable result.\n")
    write_scanned_metadata(meta)


def finite_number(value: object) -> bool:
    return not isinstance(value, bool) and isinstance(value, (int, float)) and math.isfinite(value)


def valid_usage(value: object) -> bool:
    if isinstance(value, bool):
        return False
    if isinstance(value, (int, float)):
        return finite_number(value) and value >= 0
    if isinstance(value, str) or value is None:
        return True
    if isinstance(value, list):
        return all(valid_usage(item) for item in value)
    if isinstance(value, dict):
        return all(isinstance(key, str) and valid_usage(item) for key, item in value.items())
    return False


def parse_time(value: object) -> dt.datetime:
    if not isinstance(value, str) or not value:
        raise RuntimeError("invalid timestamp")
    try:
        parsed = dt.datetime.fromisoformat(value)
    except ValueError as exc:
        raise RuntimeError("invalid timestamp") from exc
    if parsed.tzinfo is None:
        raise RuntimeError("timestamp lacks timezone")
    return parsed


def validate_result(meta: dict, context: dict, result_root: Path) -> None:
    if set(meta) != RESULT_KEYS or meta.get("schema") != "agentarium.relay-result.v2":
        raise RuntimeError("result schema mismatch")
    expected = {
        "task_id": context["activation"]["task_id"],
        "source_commit": context["source_commit"],
        "activation_commit": context["head"],
        "run_id": str(context.get("run_id") or "unknown"),
    }
    if any(meta.get(key) != value for key, value in expected.items()):
        raise RuntimeError("result/context binding mismatch")
    if meta.get("phase") not in ("result_ready", "blocked"):
        raise RuntimeError("invalid result phase")
    string_fields = ("task_id", "source_commit", "activation_commit", "run_id",
                     "started_at", "stopped_at", "secret_scan")
    if any(not isinstance(meta.get(key), str) or not meta[key] for key in string_fields):
        raise RuntimeError("invalid result string field")
    if not re.fullmatch(r"[0-9]+", meta["run_id"]):
        raise RuntimeError("invalid run id")
    started, stopped = parse_time(meta["started_at"]), parse_time(meta["stopped_at"])
    if stopped < started:
        raise RuntimeError("result timestamps reversed")
    if meta.get("elapsed_seconds") is not None and (
            not finite_number(meta["elapsed_seconds"]) or meta["elapsed_seconds"] < 0):
        raise RuntimeError("invalid elapsed_seconds")
    if meta.get("session_id") is not None and not isinstance(meta["session_id"], str):
        raise RuntimeError("invalid session_id")
    if meta.get("usage") is not None and not isinstance(meta["usage"], dict):
        raise RuntimeError("invalid usage")
    if meta.get("total_cost_usd") is not None and (
            not finite_number(meta["total_cost_usd"]) or meta["total_cost_usd"] < 0):
        raise RuntimeError("invalid total_cost_usd")
    if meta.get("failure") is not None and not isinstance(meta["failure"], str):
        raise RuntimeError("invalid failure")
    if not isinstance(meta.get("changed_paths"), list) or not all(
            isinstance(path, str) for path in meta["changed_paths"]):
        raise RuntimeError("invalid changed_paths")
    handback = context["activation"]["handback"]
    if meta["phase"] == "result_ready":
        digest = meta.get("handback_sha256")
        output = result_root / "handback.md"
        if meta["changed_paths"] != [handback] or not isinstance(digest, str) or not re.fullmatch(
                r"[0-9a-f]{64}", digest):
            raise RuntimeError("invalid ready result")
        if not output.is_file():
            raise RuntimeError("ready handback missing or mismatched")
        output_bytes = output.read_bytes()
        if sha256(output_bytes) != digest or secret_hit(output_bytes):
            raise RuntimeError("ready handback missing or mismatched")
        if meta.get("secret_scan") != "passed" or meta.get("failure") is not None:
            raise RuntimeError("ready result not clean")
        if not finite_number(meta.get("elapsed_seconds")) or meta["elapsed_seconds"] < 0:
            raise RuntimeError("ready result lacks valid elapsed time")
        if not isinstance(meta.get("session_id"), str) or not meta["session_id"].strip():
            raise RuntimeError("ready result lacks session id")
        if not isinstance(meta.get("usage"), dict) or not valid_usage(meta["usage"]):
            raise RuntimeError("ready result lacks valid usage")
        if not finite_number(meta.get("total_cost_usd")) or meta["total_cost_usd"] < 0:
            raise RuntimeError("ready result lacks valid cost")
    else:
        if (result_root / "handback.md").exists() or not (result_root / "BLOCKED.txt").is_file():
            raise RuntimeError("blocked result package inconsistent")
        if meta["changed_paths"] or meta.get("handback_sha256") is not None:
            raise RuntimeError("blocked result carries output")
        if not isinstance(meta.get("failure"), str) or not meta["failure"]:
            raise RuntimeError("blocked result lacks failure")
        if meta.get("secret_scan") != "blocked":
            raise RuntimeError("blocked result scan state invalid")
        if any(meta.get(key) is not None for key in ("session_id", "usage", "total_cost_usd")):
            raise RuntimeError("blocked result carries model metadata")


def publish() -> None:
    verify_manifest(PREPARED)
    context = json.loads((PREPARED / "control/context.json").read_text())
    meta = json.loads((RESULT / "metadata.json").read_text())
    validate_result(meta, context, RESULT)
    serialized = json.dumps(meta, indent=2, ensure_ascii=False)
    if secret_hit(serialized.encode()):
        raise RuntimeError("publish metadata secret check failed")
    task_id = meta["task_id"]
    phase_label = "RESULT_READY" if meta["phase"] == "result_ready" else "BLOCKED"
    body = marker(task_id, meta["source_commit"], phase_label,
                  meta["activation_commit"], meta["run_id"])
    run_url = f"https://github.com/{REPO}/actions/runs/{meta['run_id']}"
    body += f"\n## {task_id} — {phase_label} / STOPPED\n{run_url}\n```json\n{serialized}\n```"
    handback = RESULT / "handback.md"
    if meta["phase"] == "result_ready" and handback.exists():
        data = handback.read_bytes()
        if secret_hit(data) or sha256(data) != meta.get("handback_sha256"):
            raise RuntimeError("publish integrity/secret check failed")
        body += "\n\n" + data.decode(errors="replace")[:4000]
    if secret_hit(body.encode()):
        raise RuntimeError("final comment secret check failed")
    post_issue(body)


def self_test() -> None:
    parent = "a" * 40
    good = {"schema": "agentarium.relay-activation.v2", "task_id": "AG-TEST-0001",
            "authorized": True, "source_commit": parent, "role": "coding-agent",
            "request": "handoffs/request.json", "handback": "handoffs/result.md",
            "model": "sonnet", "max_turns": 8, "max_budget_usd": 5.0}
    validate_activation(dict(good), parent)
    for key, bad in (("source_commit", "b" * 40), ("request", "../secret"),
                     ("handback", "/tmp/out"), ("max_turns", 0),
                     ("max_turns", True), ("max_budget_usd", True),
                     ("max_budget_usd", float("nan"))):
        value = dict(good); value[key] = bad
        try:
            validate_activation(value, parent)
        except ValueError:
            pass
        else:
            raise AssertionError("negative activation test failed: " + key)
    packet = {"schema": "agentarium.handoff.v0", "task_id": good["task_id"],
              "allowed_paths": [good["handback"]],
              "readable_paths": ["AGENTS.md", "CLAUDE.md", ROLES["coding-agent"], good["request"]]}
    validate_request(packet, good)
    assert not any(key in child_environment() for key in TOKEN_KEYS)
    assert secret_hit(b"prefix github_pat_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 suffix")
    assert not secret_hit(b"ordinary handback")
    context = {"activation": good, "source_commit": parent, "head": "b" * 40, "run_id": "42"}
    with tempfile.TemporaryDirectory(prefix="relay-result-test-") as tmp:
        result_root = Path(tmp)
        payload = b"verified handback"
        (result_root / "handback.md").write_bytes(payload)
        ready = base_metadata(context, "result_ready")
        ready.update(stopped_at=now(), changed_paths=[good["handback"]],
                     handback_sha256=sha256(payload), secret_scan="passed",
                     elapsed_seconds=1.25, session_id="session-1",
                     usage={"input_tokens": 10, "output_tokens": 5}, total_cost_usd=0.01)
        validate_result(ready, context, result_root)
        wrong = dict(ready); wrong["source_commit"] = "d" * 40
        try:
            validate_result(wrong, context, result_root)
        except RuntimeError:
            pass
        else:
            raise AssertionError("result binding negative test failed")
        (result_root / "handback.md").unlink()
        try:
            validate_result(ready, context, result_root)
        except RuntimeError:
            pass
        else:
            raise AssertionError("missing handback negative test failed")
        blocked_meta = base_metadata(context, "blocked")
        blocked_meta.update(stopped_at=now(), failure="RUN_JOB_NO_RESULT", secret_scan="blocked")
        (result_root / "BLOCKED.txt").write_text("Run job produced no publishable result.\n")
        validate_result(blocked_meta, context, result_root)
        (result_root / "handback.md").write_text("stale output")
        try:
            validate_result(blocked_meta, context, result_root)
        except RuntimeError:
            pass
        else:
            raise AssertionError("blocked result with handback negative test failed")
        (result_root / "handback.md").unlink()
        blank_session = dict(ready); blank_session["session_id"] = "   "
        (result_root / "handback.md").write_bytes(payload)
        try:
            validate_result(blank_session, context, result_root)
        except RuntimeError:
            pass
        else:
            raise AssertionError("blank session negative test failed")
    assert secret_hit(json.dumps({"session_id": "sk-ant-ABCDEFGHIJKLMNOPQRSTUVWXYZ012345"}).encode())
    terminal = marker(good["task_id"], parent, "RESULT_READY", "b" * 40, "42")
    terminal_body = terminal + f"\nhttps://github.com/{REPO}/actions/runs/42"
    assert trusted_terminal_row({"body": terminal_body, "user": {"id": 41898282}},
                                good["task_id"], parent)
    assert not trusted_terminal_row({"body": terminal_body, "user": {"id": 277496791}},
                                    good["task_id"], parent)
    assert not trusted_terminal_row({"body": terminal_body.replace("runs/42", "runs/43"),
                                     "user": {"id": 41898282}}, good["task_id"], parent)
    assert not trusted_terminal_row({"body": terminal_body.replace("runs/42", "runs/420"),
                                     "user": {"id": 41898282}}, good["task_id"], parent)
    assert valid_usage({"input_tokens": 1, "cache": [0, "ephemeral"]})
    assert not valid_usage({"input_tokens": float("nan")})
    assert not valid_usage({"input_tokens": -1})
    assert not valid_usage({"input_tokens": True})
    with tempfile.TemporaryDirectory(prefix="relay-v2-test-") as tmp:
        root = Path(tmp); trusted = root / "input.txt"; trusted.write_text("trusted")
        out = root / "handoffs/result.md"; out.parent.mkdir(); out.write_text("empty")
        make_read_only(root, out)
        out.write_text("allowed")
        for operation in (lambda: trusted.write_text("bad"), lambda: (root / "new").write_text("bad")):
            try:
                operation()
            except PermissionError:
                pass
            else:
                raise AssertionError("write isolation negative test failed")
    print("SELF_TEST_OK: 32 security checks; no model/API call")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=("prepare", "run", "fallback", "publish", "self-test"))
    args = parser.parse_args()
    {"prepare": prepare, "run": run_model, "fallback": ensure_fallback,
     "publish": publish, "self-test": self_test}[args.mode]()


if __name__ == "__main__":
    main()
