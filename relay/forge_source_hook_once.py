#!/usr/bin/env python3
"""Task-specific Forge relay. Returns a patch, never publishes product files."""
import difflib
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile

from forge_one_shot import api, API
from claude_stream_diagnostics import run_stream
from claude_cli_diagnostics import ClaudeCliFailure, validate_handback

BASE = "22ee82b48239082eca89a533db4645a9dc16d523"
BRANCH = "feature/ag-interface-k3-final"
TASK = "AG-PILOT-001-SOURCE-HOOK-V1"
PROFILE = "0dcac59d22c27753f111fb1ad79f5a9be524052a"
ASSIGNMENT = "handoffs/AG-PILOT-001-source-hook-v1.json"
ALLOWED = ("relay/activity_capture.py", "relay/claude_stream_diagnostics.py", "pilot/AG-PILOT-001/SOURCE-CAPTURE.md")


def post(body):
    api(API + "/issues/2/comments", {"body": body})


def source(path):
    return subprocess.check_output(["git", "show", BASE + ":" + path])


def main():
    if os.environ.get("GITHUB_REPOSITORY") != "pahlborn/agentarium" or os.environ.get("GITHUB_REF_NAME") != BRANCH:
        raise RuntimeError("Wrong task context")
    if api(API).get("private") is not True:
        raise RuntimeError("Private repository required")
    comments = []
    for page in range(1, 101):
        batch = api(API + "/issues/2/comments?per_page=100&page=" + str(page))
        if not isinstance(batch, list):
            raise RuntimeError("Incomplete replay evidence")
        comments.extend(batch)
        if len(batch) < 100:
            break
    else:
        raise RuntimeError("Replay pagination limit")
    if any(TASK in str(c.get("body", "")) for c in comments):
        raise RuntimeError("Replay prevented: no automatic second paid call")
    package = json.loads(Path(ASSIGNMENT).read_text())
    if package.get("task_id") != TASK or package.get("base_commit") != BASE or package.get("status") != "AUTHORIZED" or package.get("allowed_paths") != list(ALLOWED):
        raise RuntimeError("Assignment mismatch")
    profile = source(".claude/agents/coding-agent.md")
    blob = hashlib.sha1(b"blob " + str(len(profile)).encode() + b"\0" + profile).hexdigest()
    if blob != PROFILE or b"model: sonnet\n" not in profile or b"effort: medium\n" not in profile:
        raise RuntimeError("Coding profile changed")
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise RuntimeError("No configured API key")
    run = "https://github.com/pahlborn/agentarium/actions/runs/" + os.environ["GITHUB_RUN_ID"]
    out = Path("forge-source-hook-output").resolve()
    out.mkdir(exist_ok=True)
    cli_version = subprocess.check_output(["claude", "--version"], text=True).strip()
    post("## " + TASK + " — HOST_RECEIVED\nRun: " + run + "\nOne bounded coding session, no automatic retry; requested sonnet/medium. No product publication.\nDefinition: `" + blob + "`\nCLI: " + cli_version)
    config = {"coding-agent": {"description": "Forge: bounded local transport prototype", "prompt": profile.decode(), "model": "sonnet", "tools": ["Read", "Glob", "Grep", "Edit", "Write"]}}
    cmd = ["claude", "--bare", "-p", json.dumps(package, ensure_ascii=False),
           "--agents", json.dumps(config), "--agent", "coding-agent",
           "--tools", "Read,Glob,Grep,Edit,Write", "--allowedTools", "Read,Glob,Grep,Edit,Write",
           "--disallowedTools", "Bash,Agent,mcp__*", "--permission-mode", "dontAsk",
           "--model", "sonnet", "--effort", "medium", "--max-turns", "8",
           "--no-session-persistence", "--output-format", "stream-json", "--verbose", "--include-partial-messages"]
    env = dict(os.environ)
    for key in ("GH_TOKEN", "GITHUB_TOKEN", "ACTIONS_RUNTIME_TOKEN"):
        env.pop(key, None)
    before = {}
    with tempfile.TemporaryDirectory(prefix="forge-k3-worker-") as tmp:
        work = Path(tmp)
        names = subprocess.check_output(["git", "ls-tree", "-r", "--name-only", BASE, "tests", "fixtures/AG-VISUAL-005-beispiele-v2-1", "pilot/AG-PILOT-001", "relay/claude_stream_diagnostics.py", "relay/claude_cli_diagnostics.py", "relay/test_claude_stream_diagnostics.py", "relay/test_claude_cli_diagnostics.py"], text=True).splitlines()
        for name in names:
            if "__pycache__" in name:
                continue
            raw = source(name)
            before[name] = raw
            p = work / name
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_bytes(raw)
        result, execution, failure = None, None, None
        try:
            result, execution = run_stream(cmd, cwd=str(work), env=env, timeout=900, checkpoint_dir=str(out),
                progress=lambda x: post("## " + TASK + " — EXECUTION_PROGRESS\nRun: " + run + "\n```json\n" + json.dumps(x) + "\n```"))
            response = validate_handback(result, execution, max_chars=24000)
            (out / "handback.txt").write_text(response)
        except ClaudeCliFailure as exc:
            failure = exc.evidence
        # Preserve even an interrupted worker's partial patch, without accepting it.
        after = {str(p.relative_to(work)): p.read_bytes() for p in work.rglob("*") if p.is_file() and ".claude" not in p.relative_to(work).parts}
        changed = sorted(n for n in set(before) | set(after) if before.get(n) != after.get(n))
        unauthorized = [n for n in changed if n not in ALLOWED]
        patch = ""
        if not unauthorized:
            for n in changed:
                patch += "".join(difflib.unified_diff(before.get(n, b"").decode().splitlines(True), after.get(n, b"").decode().splitlines(True), fromfile="a/" + n, tofile="b/" + n))
        (out / "forge.patch").write_text(patch)
        usage = result.get("modelUsage", {}) if isinstance(result, dict) else {}
        meta = {"task_id": TASK, "run": run, "source_commit": BASE, "definition_blob": blob,
                "requested_model": "sonnet", "requested_reasoning": "medium", "actual_reasoning": "unconfirmed",
                "cli_version": cli_version, "changed_paths": changed, "unauthorized_paths": unauthorized,
                "session_id": result.get("session_id") if isinstance(result, dict) else None,
                "total_cost_usd": result.get("total_cost_usd") if isinstance(result, dict) else None,
                "modelUsage": usage, "usage": result.get("usage") if isinstance(result, dict) else None,
                "execution": execution, "failure": failure,
                "patch_sha256": hashlib.sha256(patch.encode()).hexdigest(), "patch_chars": len(patch),
                "product_published": False, "tests_run_by_forge": False}
        (out / "result-metadata.json").write_text(json.dumps(meta, indent=2))
        state = "RESULT_READY / STOPPED" if failure is None and changed and not unauthorized else "BLOCKED / STOPPED"
        body = "## " + TASK + " — " + state + "\n```json\n" + json.dumps(meta, indent=2) + "\n```\n"
        if patch and len(body) + len(patch) < 60000:
            body += "\nUnaccepted Forge patch, no automatic product write:\n```diff\n" + patch + "\n```"
        else:
            body += "\nSee private workflow artifact forge-source-hook-output."
        post(body)
        if failure or unauthorized or not changed:
            raise RuntimeError("Bounded Forge handback not accepted; see saved evidence, no automatic retry")


if __name__ == "__main__":
    main()
