#!/usr/bin/env python3
"""One independent Forge motion-mock handback; no automatic publication."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

from claude_cli_diagnostics import ClaudeCliFailure, validate_handback
from claude_stream_diagnostics import run_stream
from forge_one_shot import api, API, classify_failure

BASE = "1e812fb0e5f9f9f76a753bb57acbbdc2bb6111c2"
DEFINITION = "0dcac59d22c27753f111fb1ad79f5a9be524052a"
VARIANT = sys.argv[1] if len(sys.argv) == 2 else ""
if VARIANT not in ("gewebe", "partitur"):
    raise RuntimeError("Invalid variant")
TASK_ID = "AG-NACHTPOST-003-" + VARIANT.upper()
MARKER = TASK_ID + "-V1"


def post(text):
    api(API + "/issues/2/comments", {"body": text})


def main():
    if os.environ.get("GITHUB_REPOSITORY") != "pahlborn/agentarium" or os.environ.get("GITHUB_REF_NAME") != "feature/visual-stage-v0":
        raise RuntimeError("Wrong project context")
    if api(API).get("private") is not True:
        raise RuntimeError("Private repository required")
    existing = []
    page = 1
    while True:
        batch = api(API + "/issues/2/comments?per_page=100&page=" + str(page))
        if not isinstance(batch, list):
            raise RuntimeError("Incomplete replay evidence")
        existing.extend(batch)
        if len(batch) < 100:
            break
        page += 1
        if page > 100:
            raise RuntimeError("Replay evidence pagination limit exceeded")
    if any(MARKER in str(item.get("body", "")) for item in existing):
        raise RuntimeError("Replay prevented")

    package = json.loads(Path("handoffs/AG-NACHTPOST-003-" + VARIANT + "-v1.json").read_text())
    fixture_raw = subprocess.check_output(["git", "show", BASE + ":fixtures/AG-FICTION-001-nachtpost-v1.json"])
    package["fictional_fixture"] = json.loads(fixture_raw)
    if (package.get("task_id") != TASK_ID or package.get("base_commit") != BASE or
            package.get("recipient") != "Forge/coding-agent" or package.get("status") != "AUTHORIZED" or
            package.get("budget_cap_usd") != 1.00 or package.get("variant") != VARIANT):
        raise RuntimeError("Assignment mismatch")

    profile = subprocess.check_output(["git", "show", BASE + ":.claude/agents/coding-agent.md"])
    sha = hashlib.sha1(b"blob " + str(len(profile)).encode() + b"\0" + profile).hexdigest()
    if sha != DEFINITION or b"model: sonnet\n" not in profile or b"effort: medium\n" not in profile:
        raise RuntimeError("Existing profile/default mismatch")
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise RuntimeError("No API key")

    run_url = "https://github.com/pahlborn/agentarium/actions/runs/" + os.environ["GITHUB_RUN_ID"]
    post("## " + MARKER + " — HOST_RECEIVED\n"
         "Independent " + VARIANT + " mock handback; no automatic publication, merge, release or deploy.\n"
         "Definition: `" + sha + "`\nSource: `" + BASE + "`\n"
         "Requested model: sonnet; requested effort: medium.\n"
         "Budget cap: USD 1.00; one turn; no retry/fallback.\nRun: " + run_url)

    config = {"coding-agent": {
        "description": "Forge, one independent moving Agentarium mock",
        "prompt": profile.decode(), "model": "sonnet", "tools": [],
    }}
    cmd = [
        "claude", "--bare", "-p", json.dumps(package, ensure_ascii=False),
        "--agents", json.dumps(config), "--agent", "coding-agent",
        "--tools", "", "--disallowedTools", "mcp__*", "--permission-mode", "dontAsk",
        "--model", "sonnet", "--effort", "medium", "--max-turns", "1",
        "--max-budget-usd", "1.00", "--no-session-persistence", "--output-format", "stream-json", "--verbose", "--include-partial-messages",
    ]
    env = dict(os.environ)
    env.pop("GH_TOKEN", None)
    try:
        with tempfile.TemporaryDirectory(prefix="forge-mock-") as work:
            result, execution = run_stream(cmd, cwd=work, env=env, timeout=900, checkpoint_dir=str(Path('forge-checkpoints').resolve() / VARIANT), progress=lambda state: post("## " + TASK_ID + " — EXECUTION_PROGRESS\nMetadata only; no model content.\n```json\n" + json.dumps(state) + "\n```"))
        response = validate_handback(result, execution, max_chars=55000)
        out = Path("forge-checkpoints") / VARIANT
        out.mkdir(parents=True, exist_ok=True)
        (out / "final-handback.txt").write_text(response)
        (out / "terminal-result-metadata.json").write_text(json.dumps({k: result.get(k) for k in ("session_id", "total_cost_usd", "modelUsage", "usage", "duration_ms", "duration_api_ms", "num_turns", "is_error")}, indent=2))
        usage = result.get("modelUsage", {})
        models = list(usage) if isinstance(usage, dict) else []
        actual = models[0] if len(models) == 1 else "unconfirmed"
        evidence = {
            "task_id": TASK_ID, "variant": VARIANT,
            "requested_model": "sonnet", "requested_reasoning": "medium",
            "actual_model": actual, "actual_reasoning": "unconfirmed",
            "model_evidence": {"source": "Claude CLI final JSON modelUsage keys" if models else "No runtime model usage metadata returned", "models": models},
            "cost_usd": result.get("total_cost_usd", "unconfirmed"),
            "session": result.get("session_id", "unconfirmed"),
            "definition_blob": sha, "source_commit": BASE, "fixture_sha256": hashlib.sha256(fixture_raw).hexdigest(), "run": run_url,
            "execution": execution,
            "response_sha256": hashlib.sha256(response.encode()).hexdigest(),
        }
        post("## " + TASK_ID + " — FORGE_RESULT / STOPPED\nRuntime evidence:\n```json\n" +
             json.dumps(evidence, ensure_ascii=False, indent=2) +
             "\n```\n\nUnchanged Forge handback; not yet accepted or published:\n\n" + response)
    except ClaudeCliFailure as exc:
        category = exc.evidence["detail"]
        post("## " + TASK_ID + " — BLOCKED / STOPPED\nCategory: " + category +
             "\nRun: " + run_url + "\nNo retry/upgrade.\nDiagnostic evidence:\n```json\n" +
             json.dumps(exc.evidence, ensure_ascii=False, indent=2) + "\n```")
        raise RuntimeError(category) from None
    except Exception as exc:
        category = classify_failure(str(exc))
        post("## " + TASK_ID + " — RELAY_INTERNAL_ERROR / STOPPED\nCategory: " + category +
             "\nException type: " + type(exc).__name__ + "\nRun: " + run_url +
             "\nNo retry/upgrade.")
        raise RuntimeError(category) from None


if __name__ == "__main__":
    main()

