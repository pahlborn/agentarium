#!/usr/bin/env python3
"""One authorized Forge session; isolated workspace; patch only, never deployment."""
import difflib, hashlib, json, os, subprocess, tempfile
from pathlib import Path
from forge_one_shot import api, API
from claude_cli_diagnostics import run_json, validate_handback, ClaudeCliFailure

TASK = "AG-PILOT-001-ONE-EVENT-V1"
BASE = "56059ef3d098594dc5a751aa96dfc6d31f4d252c"
BRANCH = "agent/mvp-one-event-20261017"
PROFILE = "38d9747018bd4bfc5299a2dd9aeded9659337e77"
ALLOWED = ["previews/AG-VISUAL-005-feld/schicht.py",
           "previews/AG-VISUAL-005-feld/one-event-input.js"]
OUT = Path("forge-one-event-output").resolve()

def post(body):
    api(API + "/issues/2/comments", {"body": body})

def source(path):
    return subprocess.check_output(["git", "show", BASE + ":" + path])

def preflight():
    expected = {"GITHUB_REPOSITORY": "pahlborn/agentarium",
                "GITHUB_REPOSITORY_OWNER_ID": "277496791",
                "GITHUB_ACTOR_ID": "277496791", "GITHUB_EVENT_NAME": "push",
                "GITHUB_REF_NAME": BRANCH}
    for key, value in expected.items():
        if os.environ.get(key) != value:
            raise RuntimeError("Unauthorized context: " + key)
    auth = json.loads(Path("handoffs/AG-PILOT-001-one-event-activate.json").read_text())
    if auth != {"task_id": TASK, "base_commit": BASE, "authorized": True}:
        raise RuntimeError("Activation mismatch")
    repo = api(API)
    if repo.get("full_name") != "pahlborn/agentarium" or str(repo.get("owner", {}).get("id")) != "277496791":
        raise RuntimeError("Wrong repository")
    for page in range(1, 101):
        batch = api(API + "/issues/2/comments?per_page=100&page=" + str(page))
        if not isinstance(batch, list):
            raise RuntimeError("Replay history invalid")
        if any(TASK in str(c.get("body", "")) for c in batch):
            raise RuntimeError("Existing execution found; inspect before any continuation")
        if len(batch) < 100:
            break
    else:
        raise RuntimeError("Replay history incomplete")
    profile = source(".claude/agents/coding-agent.md")
    blob = hashlib.sha1(b"blob " + str(len(profile)).encode() + b"\0" + profile).hexdigest()
    if blob != PROFILE or b"model: sonnet\n" not in profile or b"effort: medium\n" not in profile:
        raise RuntimeError("Profile/model mismatch")
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise RuntimeError("API key unavailable")
    return profile

def main():
    profile = preflight()
    OUT.mkdir(exist_ok=True)
    run = "https://github.com/pahlborn/agentarium/actions/runs/" + os.environ["GITHUB_RUN_ID"]
    version = subprocess.check_output(["claude", "--version"], text=True).strip()
    post("## " + TASK + " — HOST_RECEIVED\nRun: " + run +
         "\nActual coding profile blob: " + PROFILE +
         "\nIsolated multi-turn coding session; no product write/push/merge/deploy. " +
         "No CLI turn/cost cutoff; 900s technical watchdog, partial work preserved. CLI: " + version)
    packet = {
        "task_id": TASK, "base_commit": BASE, "mode": "bounded implementation",
        "user_authority": "Peter explicitly instructed execution of the smallest real-event MVP in this session.",
        "goal": "Read exactly one actual Argus runtime event once, then pass run/event through the existing ORIGINAL field hooks. No mock or substitute UI.",
        "required_reading": ["AGENTS.md", "governance/agentarium-rulebook-v1.2.md",
            "handoffs/AG-PILOT-001-one-event-implementation-v1.md",
            "handoffs/AG-PILOT-001-one-event-observed-v1.json"],
        "allowed_paths": ALLOWED,
        "requirements": [
            "Inspect original schicht.py and field/index.html first. Challenge the technical route if needed before editing.",
            "Add the smallest explicit opt-in one-time same-origin JSON reader to the ORIGINAL field generator. Suggested query ?mvp=1 and fixed ./one-event.json; no arbitrary URLs.",
            "The JSON is already a genuine exported Argus final handback. Use its run and event fields unchanged. kind review_result, actor argus, recipient atlas. Do NOT create extra seed events.",
            "Integrate with existing live mode and hook readiness. It must work on page open on iPad without console actions. Report both hook rejection reasons honestly. Do not interpret an HTTP error page as an event.",
            "Stay one fetch attempt per opted-in page load, no polling/retry/timers for network, no SSE/push/cursor/replay/reducer/backend or cross-origin authentication.",
            "Do not alter default demo/archive behavior or visual design; no extra UI except minimal truthful failure/receipt information if needed.",
            "Inspect the existing service-worker path and identify stale-cache risk; do not redesign PWA or edit pages.py/sw.js without a CA_QUESTION if essential.",
            "Existing build pipeline remains host-owned. Explain exact build invocation/output and copying event JSON alongside built field after Peter publication approval.",
            "No Bash is available in your current profile: test execution must be NOT_RUN by Forge; host/Sentinel will build and execute QA.",
            "Return CA_IMPLEMENTED or CA_QUESTION, changed paths, own technical concerns, exact original baseline, and remaining published-original browser proof.",
            "Do not expand scope, start agents, install dependencies, publish, merge, or invent actual model/cost/test/role metadata. No automatic replay of failed paid runs."
        ],
        "cost_policy": "Outcome-focused session; Peter rejected blanket single-turn/tiny-dollar cutoff. Do not waste calls; ask a focused question if decisive info/authority missing."
    }
    config = {"coding-agent": {"description": "Forge single real event MVP",
        "prompt": profile.decode(), "model": "sonnet",
        "tools": ["Read", "Glob", "Grep", "Edit", "Write"]}}
    cmd = ["claude", "--bare", "-p", json.dumps(packet, ensure_ascii=False),
        "--agents", json.dumps(config), "--agent", "coding-agent",
        "--tools", "Read,Glob,Grep,Edit,Write", "--allowedTools", "Read,Glob,Grep,Edit,Write",
        "--disallowedTools", "Bash,Agent,mcp__*", "--permission-mode", "dontAsk",
        "--model", "sonnet", "--effort", "medium", "--no-session-persistence", "--output-format", "json"]
    env = dict(os.environ)
    for key in ("GH_TOKEN", "GITHUB_TOKEN", "ACTIONS_RUNTIME_TOKEN"):
        env.pop(key, None)
    result, execution, failure, response = None, None, None, ""
    with tempfile.TemporaryDirectory(prefix="forge-one-event-") as tmp:
        work = Path(tmp)
        names = subprocess.check_output(["git", "ls-tree", "-r", "--name-only", BASE,
            "AGENTS.md", "governance", "handoffs", "feld", "previews/AG-VISUAL-005-feld"], text=True).splitlines()
        before = {}
        for name in names:
            raw = source(name)
            before[name] = raw
            dest = work / name
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(raw)
        try:
            result, execution = run_json(cmd, cwd=tmp, env=env, timeout=900)
            response = validate_handback(result, execution, max_chars=24000)
        except ClaudeCliFailure as exc:
            failure = exc.evidence
        finally:
            after = {str(p.relative_to(work)): p.read_bytes() for p in work.rglob("*") if p.is_file()}
            changed = sorted(n for n in set(before) | set(after) if before.get(n) != after.get(n))
            unauthorized = [n for n in changed if n not in ALLOWED and not n.startswith(".claude/")]
            patch = ""
            if not unauthorized:
                for name in changed:
                    if name not in ALLOWED:
                        continue
                    patch += "".join(difflib.unified_diff(before.get(name,b"").decode().splitlines(True),
                        after.get(name,b"").decode().splitlines(True), fromfile="a/"+name, tofile="b/"+name))
            (OUT / "forge.patch").write_text(patch)
            (OUT / "handback.txt").write_text(response)
            meta = {"task_id": TASK, "source_commit": BASE, "definition_blob": PROFILE,
                "run": run, "cli_version": version, "requested_model": "sonnet",
                "requested_effort": "medium", "actual_reasoning": "unconfirmed",
                "session_id": result.get("session_id") if isinstance(result,dict) else None,
                "total_cost_usd": result.get("total_cost_usd") if isinstance(result,dict) else None,
                "modelUsage": result.get("modelUsage") if isinstance(result,dict) else None,
                "usage": result.get("usage") if isinstance(result,dict) else None,
                "num_turns": result.get("num_turns") if isinstance(result,dict) else None,
                "execution": execution, "failure": failure, "changed_paths": changed,
                "unauthorized_paths": unauthorized, "patch_sha256": hashlib.sha256(patch.encode()).hexdigest(),
                "product_published": False, "tests_run_by_forge": False}
            (OUT / "metadata.json").write_text(json.dumps(meta, indent=2))
            ok = not failure and not unauthorized and bool(patch) and "CA_IMPLEMENTED" in response and "CA_QUESTION" not in response
            body = "## " + TASK + (" — RESULT_READY / STOPPED" if ok else " — QUESTION_OR_PARTIAL / STOPPED") + "\n\x60\x60\x60json\n" + json.dumps(meta,indent=2) + "\n\x60\x60\x60\n" + response
            if patch and len(body) + len(patch) < 60000:
                body += "\nUnaccepted patch; no product publication:\n\x60\x60\x60diff\n" + patch + "\n\x60\x60\x60"
            post(body)
            if not ok:
                raise RuntimeError("Inspect preserved result/question before continuation")

if __name__ == "__main__":
    main()
