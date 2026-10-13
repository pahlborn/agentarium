#!/usr/bin/env python3
"""One-shot read-only Claude Code handoff for AG-RELAY-002; no poller."""
import base64
import json
import os
import subprocess
import sys
import urllib.request

REPO = "pahlborn/agentarium"
BRANCH = "feature/visual-stage-v0"
API = "https://api.github.com/repos/" + REPO

def api(url, payload=None):
    token = os.environ.get("GH_TOKEN")
    if not token:
        raise RuntimeError("Missing GH_TOKEN")
    headers = {
        "Authorization": "Bearer " + token,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
    }
    data = json.dumps(payload).encode() if payload is not None else None
    if data is not None:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers,
                                 method="POST" if payload is not None else "GET")
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.load(resp)

def fetch(path):
    item = api(API + "/contents/" + path + "?ref=" + BRANCH)
    return base64.b64decode(item["content"]).decode(), item["sha"]

def classify_failure(message):
    value = str(message).lower()
    if any(x in value for x in ("credit balance", "insufficient credits", "billing_error", "add funds", "balance too low")):
        return "CREDIT_EXHAUSTED"
    if any(x in value for x in ("authentication_error", "invalid api key", "expired api key")):
        return "KEY_INVALID_OR_EXPIRED"
    return "EXECUTION_FAILED"

def report_failure(category):
    if category in ("CREDIT_EXHAUSTED", "KEY_INVALID_OR_EXPIRED"):
        api(API + "/issues/2/comments", {"body": (
            "## AG-RELAY-002 - RELAY_BLOCKED\nCategory: " + category +
            "\nNo automatic retry; run: " + os.environ.get("GITHUB_RUN_ID", "manual")
        )})

def validate_task(task, sha):
    required = {
        "schema": "agentarium.handoff.v0",
        "task_id": "AG-RELAY-002",
        "worker_role": "spec-agent",
        "status": "AWAITING_RELAY",
        "expected_reply": "ROLE_IDENTITY_ACK",
        "allowed_actions": ["read"],
        "auto_execution": False,
        "return_target": "https://github.com/pahlborn/agentarium/issues/2"
    }
    for key, expected in required.items():
        if task.get(key) != expected:
            raise RuntimeError("Handoff field mismatch: " + key)
    if task.get("source_sha") and task["source_sha"] != sha:
        raise RuntimeError("Agent blob SHA mismatch")

def self_test():
    assert classify_failure("Credit balance too low") == "CREDIT_EXHAUSTED"
    assert classify_failure("invalid api key") == "KEY_INVALID_OR_EXPIRED"
    assert classify_failure("syntax error") == "EXECUTION_FAILED"
    valid = {"schema":"agentarium.handoff.v0", "task_id":"AG-RELAY-002",
             "worker_role":"spec-agent","status":"AWAITING_RELAY",
             "expected_reply":"ROLE_IDENTITY_ACK","allowed_actions":["read"],
             "auto_execution":False,"return_target":"https://github.com/pahlborn/agentarium/issues/2",
             "source_sha":"known-agent-sha"}
    validate_task(valid, "known-agent-sha")
    for mutation in ({"worker_role":"forge"}, {"allowed_actions":["read","write"]},
                     {"source_sha":"different-sha"}, {"auto_execution":True}):
        changed = dict(valid, **mutation)
        try:
            validate_task(changed, "known-agent-sha")
        except RuntimeError:
            pass
        else:
            raise AssertionError("Authorization negative test failed: " + str(mutation))
    print("SELF_TEST_OK: no model or external API used")

def main():
    repo = api(API)
    if repo.get("full_name") != REPO or repo.get("private") is not True:
        raise RuntimeError("Fail closed: repo must be private")
    raw_task, _ = fetch("handoffs/AG-RELAY-002-atlas-request.json")
    task = json.loads(raw_task)
    definition, sha = fetch(".claude/agents/spec-agent.md")
    validate_task(task, sha)
    existing = api(API + "/issues/2/comments?per_page=100")
    if any("AG-RELAY-002 — LIVE_CLAUDE_RUNTIME_HANDOFF" in str(item.get("body", "")) for item in existing):
        raise RuntimeError("Replay prevented: handback already recorded")
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise RuntimeError("Missing ANTHROPIC_API_KEY")
    config = json.dumps({"spec-agent": {
        "description": "Archibald: read-only specification agent / identity probe",
        "prompt": definition,
        "tools": ["Read", "Glob", "Grep"],
        "model": "haiku"
    }})
    cmd = [
        "claude", "--bare", "-p",
        "Read-only identity probe AG-RELAY-002. You are Archibald. "
        "No writes, no agent dispatch. Return your role and a short acknowledgement.",
        "--agents", config, "--agent", "spec-agent",
        "--permission-mode", "dontAsk", "--tools", "Read,Glob,Grep",
        "--disallowedTools", "Bash,Edit,Write,Agent,mcp__*",
        "--model", "haiku", "--max-turns", "2", "--max-budget-usd", "0.15",
        "--no-session-persistence", "--output-format", "json"
    ]
    completed = subprocess.run(cmd, capture_output=True, text=True,
                               timeout=120, check=False)
    if completed.returncode:
        category = classify_failure(completed.stderr + completed.stdout)
        report_failure(category)
        raise RuntimeError("Claude CLI returned " + category)
    result = json.loads(completed.stdout)
    if result.get("is_error") or not str(result.get("result") or "").strip():
        category = classify_failure(json.dumps(result))
        report_failure(category)
        raise RuntimeError("Claude did not produce a valid handback: " + category)
    response = str(result["result"])[:3000]
    body = "\n".join([
        "## AG-RELAY-002 — LIVE_CLAUDE_RUNTIME_HANDOFF",
        "Worker: spec-agent (Archibald)",
        "Definition Git blob SHA: " + sha,
        "Claude session ID: " + str(result.get("session_id", "unavailable")),
        "GitHub run ID: " + os.environ.get("GITHUB_RUN_ID", "manual"),
        "Response (the agent's assertions are not independent identity proof):",
        "    " + response.replace("\n", "\n    "),
        "Transport evidence: this comment was posted by the relay wrapper after a successful Claude CLI exit."
    ])
    api(API + "/issues/2/comments", {"body": body})
    print("LIVE_CLAUDE_RUNTIME_HANDOFF delivered to issue #2")

if __name__ == "__main__":
    try:
        self_test() if "--self-test" in sys.argv else main()
    except Exception as exc:
        print("AGENTARIUM_RELAY_BLOCKED: " + str(exc), file=sys.stderr)
        sys.exit(1)
