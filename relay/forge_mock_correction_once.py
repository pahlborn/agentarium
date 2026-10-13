#!/usr/bin/env python3
"""One bounded Forge correction handback for two QA-confirmed mock defects."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile

from claude_cli_diagnostics import ClaudeCliFailure, run_json, validate_handback
from forge_one_shot import api, API, classify_failure

BASE = "698094ccb9a7bbe954ec36201f810b2b6dafd73f"
DEFINITION = "0dcac59d22c27753f111fb1ad79f5a9be524052a"
TASK_ID = "AG-MOCK-FORGE-001-CORRECTION"
MARKER = TASK_ID + "-V1"


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
    package = json.loads(Path("handoffs/AG-MOCK-FORGE-001-correction-v1.json").read_text())
    if (package.get("task_id") != TASK_ID or package.get("base_commit") != BASE or
            package.get("recipient") != "Forge/coding-agent" or package.get("status") != "AUTHORIZED" or
            package.get("budget_cap_usd") != 0.08):
        raise RuntimeError("Assignment mismatch")
    profile = subprocess.check_output(["git", "show", BASE + ":.claude/agents/coding-agent.md"])
    sha = hashlib.sha1(b"blob " + str(len(profile)).encode() + b"\0" + profile).hexdigest()
    if sha != DEFINITION or b"model: sonnet\n" not in profile or b"effort: medium\n" not in profile:
        raise RuntimeError("Existing profile/default mismatch")
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise RuntimeError("No API key")
    run_url = "https://github.com/pahlborn/agentarium/actions/runs/" + os.environ["GITHUB_RUN_ID"]
    post("## " + MARKER + " — HOST_RECEIVED\nOne bounded QA correction handback; no redesign, publication, merge, release or deploy.\n"
         "Definition: `" + sha + "`\nSource: `" + BASE + "`\nRequested model: sonnet; requested effort: medium.\n"
         "Budget cap: USD 0.08; one turn; no retry/fallback.\nRun: " + run_url)
    config = {"coding-agent": {"description": "Forge, three exact JavaScript lifecycle replacements", "prompt": profile.decode(), "model": "sonnet", "tools": []}}
    cmd = ["claude", "--bare", "-p", json.dumps(package, ensure_ascii=False),
           "--agents", json.dumps(config), "--agent", "coding-agent", "--tools", "",
           "--disallowedTools", "mcp__*", "--permission-mode", "dontAsk", "--model", "sonnet",
           "--effort", "medium", "--max-turns", "1", "--max-budget-usd", "0.08",
           "--no-session-persistence", "--output-format", "json"]
    env = dict(os.environ)
    env.pop("GH_TOKEN", None)
    try:
        with tempfile.TemporaryDirectory(prefix="forge-mock-correction-") as work:
            result, execution = run_json(cmd, cwd=work, env=env, timeout=120)
        response = validate_handback(result, execution, max_chars=6000)
        usage = result.get("modelUsage", {})
        models = list(usage) if isinstance(usage, dict) else []
        evidence = {"task_id": TASK_ID, "requested_model": "sonnet", "requested_reasoning": "medium",
                    "actual_model": models[0] if len(models) == 1 else "unconfirmed", "actual_reasoning": "unconfirmed",
                    "model_evidence": {"source": "Claude CLI final JSON modelUsage keys" if models else "No runtime model usage metadata returned", "models": models},
                    "cost_usd": result.get("total_cost_usd", "unconfirmed"), "session": result.get("session_id", "unconfirmed"),
                    "definition_blob": sha, "source_commit": BASE, "run": run_url, "execution": execution,
                    "response_sha256": hashlib.sha256(response.encode()).hexdigest()}
        post("## " + TASK_ID + " — FORGE_RESULT / STOPPED\nRuntime evidence:\n```json\n" + json.dumps(evidence, ensure_ascii=False, indent=2) +
             "\n```\n\nUnchanged correction handback; not yet applied:\n\n```json\n" + response + "\n```")
    except ClaudeCliFailure as exc:
        category = exc.evidence["detail"]
        post("## " + TASK_ID + " — BLOCKED / STOPPED\nCategory: " + category + "\nRun: " + run_url +
             "\nNo retry/upgrade.\nDiagnostic evidence:\n```json\n" + json.dumps(exc.evidence, ensure_ascii=False, indent=2) + "\n```")
        raise RuntimeError(category) from None
    except Exception as exc:
        category = classify_failure(str(exc))
        post("## " + TASK_ID + " — RELAY_INTERNAL_ERROR / STOPPED\nCategory: " + category +
             "\nException type: " + type(exc).__name__ + "\nRun: " + run_url + "\nNo retry/upgrade.")
        raise RuntimeError(category) from None


if __name__ == "__main__":
    main()
