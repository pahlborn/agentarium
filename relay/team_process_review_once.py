#!/usr/bin/env python3
"""One bounded, read-only retrospective handback from a Claude team role."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

from claude_cli_diagnostics import ClaudeCliFailure, run_json, validate_handback
from forge_one_shot import api, API, classify_failure

BASE = "3a2dadb3680b8528aa194ac11c5300c25abf4115"
ROLE = sys.argv[1] if len(sys.argv) == 2 else ""
CONFIG = {
    "archibald": {"agent": "spec-agent", "recipient": "Archibald/spec-agent", "profile": ".claude/agents/spec-agent.md", "blob": "3d49a612a1b2ad8d353b2b5345053dca60d4c23c", "model": "opus", "effort": "high", "budget": 0.20},
    "forge": {"agent": "coding-agent", "recipient": "Forge/coding-agent", "profile": ".claude/agents/coding-agent.md", "blob": "0dcac59d22c27753f111fb1ad79f5a9be524052a", "model": "sonnet", "effort": "medium", "budget": 0.12},
    "cadence": {"agent": "process-agent", "recipient": "Cadence/process-agent", "profile": ".claude/agents/process-agent.md", "blob": "d0ad187637d5201024f9fe2a31d47221178fcf6b", "model": "opus", "effort": "medium", "budget": 0.25},
}
if ROLE not in CONFIG:
    raise RuntimeError("Invalid role")
C = CONFIG[ROLE]
MARKER = "AG-PROC-REVIEW-001-" + ROLE.upper() + "-V1"


def post(text):
    api(API + "/issues/2/comments", {"body": text})


def main():
    if os.environ.get("GITHUB_REPOSITORY") != "pahlborn/agentarium" or os.environ.get("GITHUB_REF_NAME") != "feature/visual-stage-v0":
        raise RuntimeError("Wrong project context")
    if api(API).get("private") is not True:
        raise RuntimeError("Private repository required")
    comments = api(API + "/issues/2/comments?per_page=100")
    if any(MARKER in str(item.get("body", "")) for item in comments):
        raise RuntimeError("Replay prevented")
    package = json.loads(Path("handoffs/AG-PROC-REVIEW-001-" + ROLE + "-v1.json").read_text())
    if (package.get("task_id") != "AG-PROC-REVIEW-001" or package.get("base_commit") != BASE or
            package.get("recipient") != C["recipient"] or package.get("status") != "AUTHORIZED" or
            package.get("requested_model") != C["model"] or package.get("requested_effort") != C["effort"] or
            package.get("budget_cap_usd") != C["budget"]):
        raise RuntimeError("Assignment mismatch")
    profile = subprocess.check_output(["git", "show", BASE + ":" + C["profile"]])
    sha = hashlib.sha1(b"blob " + str(len(profile)).encode() + b"\0" + profile).hexdigest()
    if sha != C["blob"] or ("model: " + C["model"] + "\n").encode() not in profile or ("effort: " + C["effort"] + "\n").encode() not in profile:
        raise RuntimeError("Existing profile/default mismatch")
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise RuntimeError("No API key")
    run_url = "https://github.com/pahlborn/agentarium/actions/runs/" + os.environ["GITHUB_RUN_ID"]
    post("## " + MARKER + " — HOST_RECEIVED\nReal bounded process-review handback; read-only, no rule activation or approval.\n"
         "Definition: `" + sha + "`\nSource: `" + BASE + "`\nRequested model: " + C["model"] +
         "; requested effort: " + C["effort"] + ".\nBudget cap: USD " + str(C["budget"]) +
         "; one turn; no retry/fallback.\nRun: " + run_url)
    agent_cfg = {C["agent"]: {"description": ROLE + " bounded process retrospective", "prompt": profile.decode(), "model": C["model"], "tools": []}}
    cmd = ["claude", "--bare", "-p", json.dumps(package, ensure_ascii=False), "--agents", json.dumps(agent_cfg),
           "--agent", C["agent"], "--tools", "", "--disallowedTools", "mcp__*", "--permission-mode", "dontAsk",
           "--model", C["model"], "--effort", C["effort"], "--max-turns", "1",
           "--max-budget-usd", str(C["budget"]), "--no-session-persistence", "--output-format", "json"]
    env = dict(os.environ)
    env.pop("GH_TOKEN", None)
    try:
        with tempfile.TemporaryDirectory(prefix="process-review-") as work:
            result, execution = run_json(cmd, cwd=work, env=env, timeout=180)
        response = validate_handback(result, execution, max_chars=12000)
        usage = result.get("modelUsage", {})
        models = list(usage) if isinstance(usage, dict) else []
        evidence = {"task_id": "AG-PROC-REVIEW-001", "role": ROLE,
                    "requested_model": C["model"], "requested_reasoning": C["effort"],
                    "actual_model": models[0] if len(models) == 1 else "unconfirmed", "actual_reasoning": "unconfirmed",
                    "model_evidence": {"source": "Claude CLI final JSON modelUsage keys" if models else "No runtime model usage metadata returned", "models": models},
                    "cost_usd": result.get("total_cost_usd", "unconfirmed"), "session": result.get("session_id", "unconfirmed"),
                    "definition_blob": sha, "source_commit": BASE, "run": run_url, "execution": execution,
                    "response_sha256": hashlib.sha256(response.encode()).hexdigest()}
        post("## AG-PROC-REVIEW-001 — " + ROLE.upper() + "_RESULT / STOPPED\nRuntime evidence:\n```json\n" +
             json.dumps(evidence, ensure_ascii=False, indent=2) + "\n```\n\nUnchanged real role handback:\n\n" + response)
    except ClaudeCliFailure as exc:
        category = exc.evidence["detail"]
        post("## AG-PROC-REVIEW-001 — " + ROLE.upper() + "_BLOCKED / STOPPED\nCategory: " + category +
             "\nRun: " + run_url + "\nNo retry/upgrade.\nDiagnostic evidence:\n```json\n" +
             json.dumps(exc.evidence, ensure_ascii=False, indent=2) + "\n```")
        raise RuntimeError(category) from None
    except Exception as exc:
        category = classify_failure(str(exc))
        post("## AG-PROC-REVIEW-001 — " + ROLE.upper() + "_INTERNAL_ERROR / STOPPED\nCategory: " + category +
             "\nException type: " + type(exc).__name__ + "\nRun: " + run_url + "\nNo retry/upgrade.")
        raise RuntimeError(category) from None


if __name__ == "__main__":
    main()
