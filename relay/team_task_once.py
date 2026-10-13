#!/usr/bin/env python3
"""Bounded AG-TEAM-001 V2: existing Actions/Claude/Issue transport, no retries."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

from forge_one_shot import api, API, classify_failure

BASE = "135979d5706977c84512f00bc412b5fae553fb02"
MARKER = "AG-TEAM-001-V2-TASK_RUN"
ROLES = [
    ("archibald", "spec-agent", "3d49a612a1b2ad8d353b2b5345053dca60d4c23c", "0.15"),
    ("forge", "coding-agent", "0dcac59d22c27753f111fb1ad79f5a9be524052a", "0.35"),
    ("cadence", "process-agent", "d0ad187637d5201024f9fe2a31d47221178fcf6b", "0.15"),
]

def blob_sha(data):
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()

def validate(task):
    expected = {"task_id": "AG-TEAM-001", "source_version": 2,
                "repository": "pahlborn/agentarium", "base_commit": BASE,
                "branch": "feature/visual-stage-v0", "allowed_paths": ["index.html"],
                "architecture_change": False, "merge": False, "publish": False,
                "paid_calls_max": 3, "auto_retry": False}
    for key, value in expected.items():
        if task.get(key) != value:
            raise RuntimeError("Invalid task field: " + key)

def post(body):
    return api(API + "/issues/2/comments", {"body": body})

def reject_replay(fetch=api):
    page = 1
    while True:
        comments = fetch(API + "/issues/2/comments?per_page=100&page=" + str(page))
        if any(MARKER in c.get("body", "") for c in comments):
            raise RuntimeError("Replay prevented: this task version already claimed")
        if len(comments) < 100:
            return
        page += 1

def main():
    task = json.loads(Path("handoffs/AG-TEAM-001-task-v2.json").read_text())
    validate(task)
    if os.environ.get("GITHUB_REPOSITORY") != task["repository"] or os.environ.get("GITHUB_REF_NAME") != task["branch"]:
        raise RuntimeError("Wrong repository or branch")
    if api(API).get("private") is not True:
        raise RuntimeError("Private repository required")
    reject_replay()
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise RuntimeError("Missing API key")
    source = subprocess.check_output(["git", "show", BASE + ":index.html"])
    if blob_sha(source) != "f3f0aa6a483e0a23d30cdbb5bdc27d2387cd1d06":
        raise RuntimeError("Source blob mismatch")
    run = os.environ["GITHUB_RUN_ID"]
    run_url = "https://github.com/pahlborn/agentarium/actions/runs/" + run
    post("## " + MARKER + " — HOST_RECEIVED\nTask AG-TEAM-001 V2; baseline `" + BASE + "`; run " + run_url +
         "\nTask SHA256: `" + hashlib.sha256(Path("handoffs/AG-TEAM-001-task-v2.json").read_bytes()).hexdigest() +
         "`\nOne claimed run, up to three separate Claude sessions; no retries. No merge or deployment.")
    prior = {}
    for role, technical, expected_sha, budget in ROLES:
        data = subprocess.check_output(["git", "show", BASE + ":.claude/agents/" + technical + ".md"])
        if blob_sha(data) != expected_sha:
            raise RuntimeError("Role definition mismatch: " + role)
        prompt = task["assignments"][role] + "\n\nVerified Scout knowledge and peer evidence:\n" + task["evidence"]
        prompt += "\n\nOriginal exact index.html:\n" + source.decode()
        if role == "forge":
            prompt += "\n\nArchibald returned:\n" + prior["archibald"]
        if role == "cadence":
            prompt += "\n\nObserved relay result: separate Archibald and Forge sessions completed. "
            prompt += "Their task-mode outputs are returned to Atlas, no implementation has been auto-published."
        config = json.dumps({technical: {"description": "Bounded " + role + " AG-TEAM-001 task contribution",
                             "prompt": data.decode(), "tools": [], "model": "haiku"}})
        env = dict(os.environ)
        env.pop("GH_TOKEN", None)
        cmd = ["claude", "--bare", "-p", prompt,
               "--agents", config, "--agent", technical,
               "--permission-mode", "dontAsk", "--tools", "",
               "--disallowedTools", "Bash,Read,Glob,Grep,Edit,Write,Agent,mcp__*",
               "--model", "haiku", "--max-turns", "1", "--max-budget-usd", budget,
               "--no-session-persistence", "--output-format", "json"]
        post("## AG-TEAM-001 V2 — DISPATCH_READY\nRole: " + role + " / " + technical +
             "\nDefinition blob: `" + expected_sha + "`\nSource: `" + BASE +
             "`\nEffective tools: none; exact source and evidence supplied inline. Separate CLI process. Run: " + run_url)
        try:
            with tempfile.TemporaryDirectory(prefix="ag-team-") as work:
                done = subprocess.run(cmd, cwd=work, env=env, capture_output=True, text=True, timeout=120)
            if done.returncode:
                raise RuntimeError(classify_failure(done.stdout + done.stderr))
            result = json.loads(done.stdout)
            response = str(result.get("result", "")).strip()
            if result.get("is_error") or not response or len(response) > 45000:
                raise RuntimeError(classify_failure(json.dumps(result)))
            prior[role] = response
            # No transcript or secrets; only bounded final response and runtime metadata.
            post("## AG-TEAM-001 V2 — WORKER_STARTED / RESULT_READY / STOPPED\nRole: " + role + " / " + technical +
                 "\nClaude session: `" + str(result.get("session_id", "unavailable")) +
                 "`\nDefinition blob: `" + expected_sha + "`\nSource: `" + BASE +
                 "`\nRun: " + run_url + "\nReported cost USD: " + str(result.get("total_cost_usd", "unavailable")) +
                 "\nResult SHA256: `" + hashlib.sha256(response.encode()).hexdigest() +
                 "`\nCLI exited successfully; tools disabled. Final response follows, not independent acceptance:\n\n" + response)
        except Exception as exc:
            category = classify_failure(str(exc))
            if str(exc) in ("CREDIT_EXHAUSTED", "KEY_INVALID_OR_EXPIRED"):
                category = str(exc)
            post("## AG-TEAM-001 V2 — BLOCKED / STOPPED\nRole: " + role +
                 "\nCategory: " + category + "\nRun: " + run_url + "\nNo automatic retry; later roles not dispatched.")
            raise RuntimeError(category) from None

def self_test():
    good = {"task_id":"AG-TEAM-001", "source_version":2, "repository":"pahlborn/agentarium",
            "base_commit":BASE, "branch":"feature/visual-stage-v0", "allowed_paths":["index.html"],
            "architecture_change":False, "merge":False, "publish":False, "paid_calls_max":3, "auto_retry":False}
    validate(good)
    for key, bad in [("merge",True),("auto_retry",True),("paid_calls_max",4),("allowed_paths",["*"])]:
        try:
            validate(dict(good, **{key:bad}))
        except RuntimeError:
            pass
        else:
            raise AssertionError(key)
    pages = [[{"body":"unrelated"}]*100, [{"body":MARKER}]]
    try:
        reject_replay(lambda url: pages.pop(0))
    except RuntimeError:
        assert not pages
    else:
        raise AssertionError("Claim after page 1 was missed")
    reject_replay(lambda url: [])
    print("SELF_TEST_OK — no model, no network")

if __name__ == "__main__":
    try:
        self_test() if "--self-test" in sys.argv else main()
    except Exception as exc:
        print("AG_TEAM_BLOCKED: " + str(exc), file=sys.stderr)
        sys.exit(1)
