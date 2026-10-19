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
    if not isinstance(a["max_turns"], int) or not 1 <= a["max_turns"] <= 64:
        raise ValueError("max_turns outside 1..64")
    if not isinstance(a["max_budget_usd"], (int, float)) or not 0.05 <= float(a["max_budget_usd"]) <= 25:
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


def marker(task_id: str) -> str:
    return MARKER_PREFIX + task_id + " -->"


def history_contains(task_id: str) -> bool:
    page = 1
    while True:
        rows = api(f"/issues/2/comments?per_page=100&page={page}")
        if not isinstance(rows, list):
            raise RuntimeError("invalid comment history")
        if any(marker(task_id) in str(row.get("body", "")) for row in rows):
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
    if history_contains(a["task_id"]):
        raise RuntimeError("task already received")
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
    post_issue(marker(a["task_id"]) + f"\n## {a['task_id']} — HOST_RECEIVED\n{run_url}\n"
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


def run_model() -> None:
    verify_manifest(PREPARED)
    context = json.loads((PREPARED / "control/context.json").read_text())
    a = context["activation"]
    if RESULT.exists():
        shutil.rmtree(RESULT)
    RESULT.mkdir()
    meta = {"task_id": a["task_id"], "phase": "running", "started_at": now(),
            "session_id": None, "usage": None, "total_cost_usd": None,
            "failure": None, "changed_paths": [], "secret_scan": "pending"}
    (RESULT / "metadata.json").write_text(json.dumps(meta, indent=2))
    work = PREPARED / "workspace"
    handback = work / a["handback"]
    before = {str(p.relative_to(work)): p.read_bytes() for p in work.rglob("*") if p.is_file()}
    make_read_only(work, handback)
    command = claude_command(context, PREPARED / "control/settings.json")
    if "Read" in command[command.index("--allowedTools") + 1].split(","):
        raise RuntimeError("bare Read permission forbidden")
    api_key = os.environ.get("ANTHROPIC_API_KEY", "").encode()
    if not api_key:
        raise RuntimeError("Missing ANTHROPIC_API_KEY")
    start = time.monotonic()
    raw_tmp = RESULT / "stream.pending"
    err_tmp = RESULT / "stderr.pending"
    result = None
    blocked = None
    try:
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
        meta.update(phase="blocked", stopped_at=now(), failure=f"{type(exc).__name__}: {exc}",
                    secret_scan="blocked")
        (RESULT / "BLOCKED.txt").write_text("Result withheld by relay safety checks.\n")
        blocked = exc
    (RESULT / "metadata.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False))
    if blocked is not None:
        raise RuntimeError("relay blocked; sanitized evidence prepared") from blocked


def publish() -> None:
    meta = json.loads((RESULT / "metadata.json").read_text())
    task_id = meta["task_id"]
    body = marker(task_id) + f"\n## {task_id} — {meta['phase'].upper()} / STOPPED\n```json\n"
    body += json.dumps(meta, indent=2, ensure_ascii=False) + "\n```"
    handback = RESULT / "handback.md"
    if meta["phase"] == "result_ready" and handback.exists():
        data = handback.read_bytes()
        if secret_hit(data) or sha256(data) != meta.get("handback_sha256"):
            raise RuntimeError("publish integrity/secret check failed")
        body += "\n\n" + data.decode(errors="replace")[:4000]
    post_issue(body)


def self_test() -> None:
    parent = "a" * 40
    good = {"schema": "agentarium.relay-activation.v2", "task_id": "AG-TEST-0001",
            "authorized": True, "source_commit": parent, "role": "coding-agent",
            "request": "handoffs/request.json", "handback": "handoffs/result.md",
            "model": "sonnet", "max_turns": 8, "max_budget_usd": 5.0}
    validate_activation(dict(good), parent)
    for key, bad in (("source_commit", "b" * 40), ("request", "../secret"),
                     ("handback", "/tmp/out"), ("max_turns", 0)):
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
    print("SELF_TEST_OK: 12 security checks; no model/API call")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=("prepare", "run", "publish", "self-test"))
    args = parser.parse_args()
    {"prepare": prepare, "run": run_model, "publish": publish, "self-test": self_test}[args.mode]()


if __name__ == "__main__":
    main()
