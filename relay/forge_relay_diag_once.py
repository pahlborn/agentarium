#!/usr/bin/env python3
"""One bounded Forge implementation handback for AG-RELAY-DIAG-001."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile

from claude_cli_diagnostics import ClaudeCliFailure, run_json, validate_handback
from forge_one_shot import api, API, classify_failure

BASE = "106dc05ab330401c0d4ec80768623926b7b66e8b"
DEFINITION = "0dcac59d22c27753f111fb1ad79f5a9be524052a"
MARKER = "AG-RELAY-DIAG-001-FORGE-V1"


def post(text):
    api(API + "/issues/2/comments", {"body": text})


def main():
    if os.environ.get("GITHUB_REPOSITORY") != "pahlborn/agentarium" or os.environ.get("GITHUB_REF_NAME") != "feature/visual-stage-v0":
        raise RuntimeError("Wrong project context")
    if api(API).get("private") is not True:
        raise RuntimeError("Private repository required")
    existing = api(API + "/issues/2/comments?per_page=100")
    if any(MARKER in str(item.get("body", "")) for item in existing):
        raise RuntimeError("Replay prevented")

    package = json.loads(Path("handoffs/AG-RELAY-DIAG-001-forge-v1.json").read_text())
    if (package.get("task_id") != "AG-RELAY-DIAG-001" or
            package.get("base_commit") != BASE or
            package.get("recipient") != "Forge/coding-agent" or
            package.get("status") != "AUTHORIZED" or
            package.get("budget_cap_usd") != 0.12):
        raise RuntimeError("Assignment mismatch")

    profile = subprocess.check_output(["git", "show", BASE + ":.claude/agents/coding-agent.md"])
    sha = hashlib.sha1(b"blob " + str(len(profile)).encode() + b"\0" + profile).hexdigest()
    if sha != DEFINITION or b"model: sonnet\n" not in profile or b"effort: medium\n" not in profile:
        raise RuntimeError("Existing profile/default mismatch")
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise RuntimeError("No API key")

    run_url = "https://github.com/pahlborn/agentarium/actions/runs/" + os.environ["GITHUB_RUN_ID"]
    post("## " + MARKER + " — HOST_RECEIVED\n"
         "One authorized bounded implementation handback; no repository write, merge, release or deploy.\n"
         "Definition: `" + sha + "`\nSource: `" + BASE + "`\n"
         "Requested model: sonnet; requested effort: medium.\n"
         "Budget cap: USD 0.12; one turn; no retry/fallback.\nRun: " + run_url)

    config = {"coding-agent": {
        "description": "Forge, one tiny Python implementation handback",
        "prompt": profile.decode(),
        "model": "sonnet",
        "tools": [],
    }}
    cmd = [
        "claude", "--bare", "-p", json.dumps(package, ensure_ascii=False),
        "--agents", json.dumps(config), "--agent", "coding-agent",
        "--tools", "", "--disallowedTools", "mcp__*",
        "--permission-mode", "dontAsk", "--model", "sonnet", "--effort", "medium",
        "--max-turns", "1", "--max-budget-usd", "0.12",
        "--no-session-persistence", "--output-format", "json",
    ]
    env = dict(os.environ)
    env.pop("GH_TOKEN", None)
    try:
        with tempfile.TemporaryDirectory(prefix="forge-relay-diag-") as work:
            result, execution = run_json(cmd, cwd=work, env=env, timeout=120)
        response = validate_handback(result, execution, max_chars=6000)
        usage = result.get("modelUsage", {})
        models = list(usage) if isinstance(usage, dict) else []
        actual = models[0] if len(models) == 1 else "unconfirmed"
        evidence = {
            "requested_model": "sonnet",
            "requested_reasoning": "medium",
            "actual_model": actual,
            "actual_reasoning": "unconfirmed",
            "model_evidence": {"source": "Claude CLI final JSON modelUsage keys" if models else "No runtime model usage metadata returned", "models": models},
            "cost_usd": result.get("total_cost_usd", "unconfirmed"),
            "session": result.get("session_id", "unconfirmed"),
            "definition_blob": sha,
            "source_commit": BASE,
            "run": run_url,
            "execution": execution,
            "response_sha256": hashlib.sha256(response.encode()).hexdigest(),
        }
        post("## AG-RELAY-DIAG-001 — FORGE_RESULT / STOPPED\nRuntime evidence:\n```json\n" +
             json.dumps(evidence, ensure_ascii=False, indent=2) +
             "\n```\n\nUnchanged Forge handback; not accepted or published:\n\n" + response)
    except ClaudeCliFailure as exc:
        category = exc.evidence["detail"]
        post("## AG-RELAY-DIAG-001 — BLOCKED / STOPPED\nCategory: " + category +
             "\nRun: " + run_url +
             "\nNo retry/upgrade.\nDiagnostic evidence:\n```json\n" +
             json.dumps(exc.evidence, ensure_ascii=False, indent=2) + "\n```")
        raise RuntimeError(category) from None
    except Exception as exc:
        category = classify_failure(str(exc))
        post("## AG-RELAY-DIAG-001 — RELAY_INTERNAL_ERROR / STOPPED\nCategory: " + category +
             "\nException type: " + type(exc).__name__ + "\nRun: " + run_url +
             "\nNo retry/upgrade.")
        raise RuntimeError(category) from None


if __name__ == "__main__":
    main()
