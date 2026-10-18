#!/usr/bin/env python3
"""One-shot public-repository Forge task host with auditable activation."""
import datetime
import hashlib
import json
import os
import stat
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

REPO = "pahlborn/agentarium"
API = "https://api.github.com/repos/" + REPO
BRANCH = "agent/ag-relay-public-001"
TASK = "AG-RELAY-PUBLIC-001-FORGE-V1"
ACTIVATION = "handoffs/AG-RELAY-PUBLIC-001-activate.json"
REQUEST = "handoffs/AG-RELAY-PUBLIC-001-forge-request-v1.json"
HANDBACK = "handoffs/AG-RELAY-PUBLIC-001-forge-handback-v1.md"
MARKER = "<!-- AG_RELAY_PUBLIC_001_FORGE_V1 -->"
PROFILE_SHA = "38d9747018bd4bfc5299a2dd9aeded9659337e77"
OUT = Path("forge-public-output").resolve()


def api(url, payload=None):
    token = os.environ.get("GH_TOKEN")
    if not token:
        raise RuntimeError("Missing GH_TOKEN")
    headers = {
        "Authorization": "Bearer " + token,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    data = json.dumps(payload).encode() if payload is not None else None
    if data is not None:
        headers["Content-Type"] = "application/json"
    request = urllib.request.Request(url, data=data, headers=headers,
                                     method="POST" if data is not None else "GET")
    with urllib.request.urlopen(request, timeout=20) as response:
        return json.load(response)


def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def git(*args, text=True):
    return subprocess.check_output(["git", *args], text=text).strip() if text else subprocess.check_output(["git", *args])


def src(ref, path):
    return subprocess.check_output(["git", "show", ref + ":" + path])


def post(body):
    return api(API + "/issues/2/comments", {"body": body})


def blob_sha(data):
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()


def validate_activation(value, parent):
    expected = {"task_id": TASK, "authorized": True, "source_commit": parent}
    if value != expected:
        raise RuntimeError("Activation mismatch")


def validate_request(packet):
    if packet.get("schema") != "agentarium.handoff.v0":
        raise RuntimeError("Request schema mismatch")
    if packet.get("task_id") != TASK:
        raise RuntimeError("Request task mismatch")
    if packet.get("allowed_paths") != [HANDBACK]:
        raise RuntimeError("Request path boundary mismatch")
    if not packet.get("monitor_run_id"):
        raise RuntimeError("Missing monitor run id")


def self_test():
    parent = "a" * 40
    validate_activation({"task_id": TASK, "authorized": True, "source_commit": parent}, parent)
    try:
        validate_activation({"task_id": TASK, "authorized": True, "source_commit": "b" * 40}, parent)
    except RuntimeError:
        pass
    else:
        raise AssertionError("source-commit negative test failed")
    validate_request({"schema": "agentarium.handoff.v0", "task_id": TASK,
                      "monitor_run_id": "test", "allowed_paths": [HANDBACK]})
    print("SELF_TEST_OK: no model or paid API used")


def write_meta(meta, **updates):
    meta.update(updates)
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "metadata.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False))


def history_has_marker():
    page = 1
    while True:
        rows = api(API + "/issues/2/comments?per_page=100&page=" + str(page))
        if not isinstance(rows, list):
            raise RuntimeError("Invalid history response")
        if any(MARKER in str(item.get("body", "")) for item in rows):
            return True
        if len(rows) < 100:
            return False
        page += 1
        if page > 10000:
            raise RuntimeError("History end not proven")


def make_read_only(work, writable_file):
    for path in sorted(work.rglob("*"), reverse=True):
        if path.is_file():
            path.chmod(stat.S_IRUSR | stat.S_IRGRP | stat.S_IROTH)
        elif path.is_dir():
            path.chmod(stat.S_IRUSR | stat.S_IXUSR | stat.S_IRGRP | stat.S_IXGRP | stat.S_IROTH | stat.S_IXOTH)
    writable_file.parent.chmod(stat.S_IRWXU | stat.S_IRGRP | stat.S_IXGRP | stat.S_IROTH | stat.S_IXOTH)
    writable_file.chmod(stat.S_IRUSR | stat.S_IWUSR | stat.S_IRGRP | stat.S_IROTH)


def run_task():
    OUT.mkdir(parents=True, exist_ok=True)
    run_id = os.environ.get("GITHUB_RUN_ID", "unknown")
    meta = {
        "task_id": TASK, "phase": "initializing", "run_id": run_id,
        "job": os.environ.get("GITHUB_JOB", "unknown"), "head": None,
        "source_commit": None, "cli_version": None, "session_id": None,
        "usage": None, "total_cost_usd": None, "failure": None,
        "changed_paths": [], "unauthorized_paths": [], "product_published": False
    }
    write_meta(meta)
    try:
        expected = {
            "GITHUB_REPOSITORY": REPO,
            "GITHUB_ACTOR_ID": "277496791",
            "GITHUB_EVENT_NAME": "push",
            "GITHUB_REF_NAME": BRANCH,
        }
        for key, value in expected.items():
            if os.environ.get(key) != value:
                raise RuntimeError("Unauthorized context " + key)
        head = git("rev-parse", "HEAD")
        parent = git("rev-parse", "HEAD^")
        changes = git("diff-tree", "--no-commit-id", "--name-status", "-r", "HEAD").splitlines()
        if changes != ["A\t" + ACTIVATION]:
            raise RuntimeError("Activation commit must add only " + ACTIVATION)
        activation = json.loads(src(head, ACTIVATION))
        validate_activation(activation, parent)
        write_meta(meta, phase="activation_verified", head=head, source_commit=parent)

        expected_cli = os.environ.get("AG_CLAUDE_CLI_VERSION", "")
        actual_cli = subprocess.check_output(["claude", "--version"], text=True).strip()
        if not expected_cli or expected_cli not in actual_cli:
            raise RuntimeError("Claude CLI version mismatch")
        write_meta(meta, phase="cli_verified", cli_version=actual_cli)

        if history_has_marker():
            raise RuntimeError("Task reservation or result already exists")
        run_url = "https://github.com/pahlborn/agentarium/actions/runs/" + run_id
        reservation = post(MARKER + "\n## " + TASK + " — HOST_RECEIVED\n" + run_url +
                           "\nGeprüfter Einmalauftrag; keine Produktänderung, kein Merge, keine Veröffentlichung.")
        write_meta(meta, phase="reserved", reservation_comment=reservation.get("html_url"))

        profile = src(parent, ".claude/agents/coding-agent.md")
        if blob_sha(profile) != PROFILE_SHA:
            raise RuntimeError("Forge role profile mismatch")
        packet = json.loads(src(parent, REQUEST))
        validate_request(packet)

        with tempfile.TemporaryDirectory(prefix="ag-relay-forge-") as tmp:
            work = Path(tmp)
            paths = [
                "AGENTS.md", "CLAUDE.md", ".claude/agents/coding-agent.md",
                "governance/agentarium-rulebook-v1.2.md",
                "governance/agentarium-process-v1.2.md",
                ".github/workflows/forge-relay.yml", "relay/forge_one_shot.py",
                ".github/workflows/forge-public-run-v1.yml",
                "relay/forge_public_task_once.py", REQUEST,
            ]
            before = {}
            for name in paths:
                data = src(parent, name)
                target = work / name
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(data)
                before[name] = data
            writable = work / HANDBACK
            writable.parent.mkdir(parents=True, exist_ok=True)
            writable.write_text("# Forge handback\n")
            before[HANDBACK] = writable.read_bytes()
            make_read_only(work, writable)

            config = {"coding-agent": {
                "description": "Forge architecture and feasibility review",
                "prompt": profile.decode() +
                          "\nTASK OVERRIDE: Architecture/advice only. Read the supplied current sources. "
                          "Write only the authorized handback. Do not implement, test, publish or claim approval.",
                "tools": ["Read", "Edit"],
            }}
            command = [
                "claude", "--bare", "-p", json.dumps(packet, ensure_ascii=False),
                "--agents", json.dumps(config), "--agent", "coding-agent",
                "--tools", "Read,Edit", "--allowedTools", "Read,Edit",
                "--disallowedTools", "Bash,Agent,WebFetch,WebSearch,mcp__*",
                "--permission-mode", "dontAsk", "--no-session-persistence",
                "--output-format", "stream-json", "--verbose",
            ]
            env = dict(os.environ)
            for key in ("GH_TOKEN", "GITHUB_TOKEN", "ACTIONS_RUNTIME_TOKEN"):
                env.pop(key, None)
            start = time.monotonic()
            result = None
            with (OUT / "stream.jsonl").open("w") as raw, (OUT / "stderr.txt").open("w") as errors:
                process = subprocess.Popen(command, cwd=tmp, env=env, stdout=subprocess.PIPE,
                                           stderr=errors, text=True, bufsize=1)
                for line in process.stdout:
                    raw.write(line)
                    raw.flush()
                    try:
                        item = json.loads(line)
                    except ValueError:
                        continue
                    if item.get("type") == "result":
                        result = item
                process.wait(timeout=30)
            if process.returncode or not result or result.get("is_error"):
                raise RuntimeError("Claude process failed or returned no valid result")

            after = {str(path.relative_to(work)): path.read_bytes()
                     for path in work.rglob("*") if path.is_file()}
            changed = sorted(name for name in set(before) | set(after)
                             if before.get(name) != after.get(name))
            unauthorized = [name for name in changed if name != HANDBACK]
            if unauthorized:
                raise RuntimeError("Unauthorized changed paths: " + ", ".join(unauthorized))
            handback = after[HANDBACK].decode()
            (OUT / "handback.md").write_text(handback)
            (OUT / "raw-result.json").write_text(json.dumps(result, indent=2, ensure_ascii=False))
            write_meta(
                meta, phase="result_ready", session_id=result.get("session_id"),
                usage=result.get("usage"), total_cost_usd=result.get("total_cost_usd"),
                elapsed_seconds=time.monotonic() - start, changed_paths=changed,
                unauthorized_paths=unauthorized,
                handback_sha256=hashlib.sha256(handback.encode()).hexdigest(),
            )
            post("## " + TASK + " — RESULT_READY / STOPPED\n```json\n" +
                 json.dumps(meta, indent=2, ensure_ascii=False) + "\n```\n" + handback[:4000])
    except Exception as exc:
        write_meta(meta, phase="blocked", failure=type(exc).__name__ + ": " + str(exc))
        raise


if __name__ == "__main__":
    if "--self-test" in sys.argv:
        self_test()
    else:
        run_task()
