#!/usr/bin/env python3
"""One-shot read-only Claude Code handoff for AG-RELAY-001; no poller."""
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

def main():
    repo = api(API)
    if repo.get("full_name") != REPO or repo.get("private") is not True:
        raise RuntimeError("Fail closed: repo must be private")
    raw_task, _ = fetch("handoffs/AG-RELAY-001-atlas-request.json")
    task = json.loads(raw_task)
    definition, sha = fetch(".claude/agents/process-agent.md")
    required = {
        "schema": "agentarium.handoff.v0",
        "task_id": "AG-RELAY-001",
        "worker_role": "process-agent",
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
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise RuntimeError("Missing ANTHROPIC_API_KEY")
    config = json.dumps({"process-agent": {
        "description": "Cadence: read-only process review / identity probe",
        "prompt": definition,
        "tools": ["Read", "Glob", "Grep"],
        "model": "opus"
    }})
    cmd = [
        "claude", "--bare", "-p",
        "Read-only identity probe AG-RELAY-001. You are Cadence. "
        "No writes, no agent dispatch. Return your role and a short acknowledgement.",
        "--agents", config, "--agent", "process-agent",
        "--permission-mode", "dontAsk", "--tools", "Read,Glob,Grep",
        "--disallowedTools", "Bash,Edit,Write,Agent,mcp__*",
        "--max-turns", "2", "--max-budget-usd", "0.50",
        "--no-session-persistence", "--output-format", "json"
    ]
    completed = subprocess.run(cmd, capture_output=True, text=True,
                               timeout=120, check=False)
    if completed.returncode:
        raise RuntimeError("Claude CLI returned exit " + str(completed.returncode))
    result = json.loads(completed.stdout)
    if result.get("is_error") or not str(result.get("result") or "").strip():
        raise RuntimeError("Claude did not produce a valid handback")
    response = str(result["result"])[:3000]
    body = "\n".join([
        "## AG-RELAY-001 — LIVE_CLAUDE_RUNTIME_HANDOFF",
        "Worker: process-agent (Cadence)",
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
        main()
    except Exception as exc:
        print("AGENTARIUM_RELAY_BLOCKED: " + str(exc), file=sys.stderr)
        sys.exit(1)
