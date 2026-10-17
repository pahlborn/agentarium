#!/usr/bin/env python3
"""One authorized Forge session; isolated workspace; patch only, never deployment."""
import difflib, hashlib, json, os, subprocess, tempfile
from pathlib import Path
from forge_one_shot import api, API
from claude_cli_diagnostics import run_json, validate_handback, ClaudeCliFailure

TASK = "AG-PILOT-002-TEN-LIVE-EVENTS-V1"
BASE = "903d7dc4273adbfd0a46f068ad22c069cae19ee0"
BRANCH = "agent/mvp-ten-events-20261017"
PROFILE = "38d9747018bd4bfc5299a2dd9aeded9659337e77"
ALLOWED = ["previews/AG-VISUAL-005-feld/schicht.py",
           "previews/AG-VISUAL-005-feld/pages.py"]
OUT = Path("forge-ten-live-events-output").resolve()

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
    auth = json.loads(Path("handoffs/AG-PILOT-002-ten-live-events-activate.json").read_text())
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
    packet = json.loads(r'''{
  "task_id": "AG-PILOT-002-TEN-LIVE-EVENTS-V1",
  "base_commit": "903d7dc4273adbfd0a46f068ad22c069cae19ee0",
  "mode": "architecture-first bounded implementation",
  "user_goal": "Peter requires10 real events that occur AFTER monitor connection. Team work runs independently; ORIGINAL open tab receives near-real-time information without per-event reload. Opening monitor must NEVER start team/model work. No playback of precollected ten events.",
  "required_reading": [
    "AGENTS.md",
    "governance/agentarium-rulebook-v1.2.md",
    "handoffs/AG-PILOT-002-ten-events-criteria-v1.md",
    "previews/AG-VISUAL-005-feld/schicht.py",
    "previews/AG-VISUAL-005-feld/pages.py",
    "feld/sw.js"
  ],
  "allowed_paths": [
    "previews/AG-VISUAL-005-feld/schicht.py",
    "previews/AG-VISUAL-005-feld/pages.py"
  ],
  "requirements": [
    "First give your own feasibility judgment; do not just execute Atlas plan. If viable within bounds, implement the smallest opt-in bounded proof in this same session. If not, CA_QUESTION with actual blocker/alternative instead of code.",
    "No new server/hosted backend/persistent daemon, secrets in client, private repo auth, permission changes or publication. Existing ChatGPT/GitHub control and original static field remain. No new dependencies.",
    "Candidate only, not mandated: browser reads fixed allowlisted PUBLIC GitHub REST Contents snapshot JSON on separate branch agent/live-pilot-data-20261017 and path agentarium/live/AG-PILOT-002-ten-events.json. Pages per-event deployments are too slow. Evaluate public API CORS, rate limits and caching. You may choose a simpler actually viable route; if architecture must materially expand, ask.",
    "Source initial envelope is {run:{project_id:'agentarium',run_id:'AG-PILOT-002',titel:'Zehn echte Teamereignisse'},events:[],closed:false}. Each event uses existing V2.1 fields actor,kind,title,recipient,id,fictional:false; wrapper is transport-only. The producer (Atlas/tools) appends ONLY observed events as work actually happens, independently of the monitor. No event simulation by client.",
    "Implement an explicit opt-in e.g. ?livepilot=1 independent of existing ?mvp=1. Original demo remains unchanged and no model/API work is triggered by monitor open. Consumer requests data only.",
    "Suggested near-live target <=5 seconds source-available-to-visible in bounded test; measure actual delay, no SLA claims.90second polling does not meet Peter goal. Source-capture/export-to-commit delay must remain separately visible, no invented runtime timestamps.",
    "GitHub unauth60req/hour/clientIP; must bound total request count/time, nonoverlapping fetches, respect response remaining/reset/retry headers, stop honestly on limit/unavailable transport. No automatic paid retry or hidden auth workaround; bounded polling only if technically defensible for this10-event experiment, NOT scalable always-on product.",
    "No burst replay of existing events presented as live. Start with empty actual source. Deduplicate IDs and never count rejected events; same ID different payload must report conflict. Accept max10 and stop; duplicates unchanged snapshots do not advance count. Incoming real events go unchanged through existing hooks.",
    "Make connection/waiting/received count/stopped/error legible on iPad. Avoid known bottom-left overlay over the list; reuse existing status surface or reserved margin, no visual redesign.",
    "Investigate existing SW cache-first ignoreSearch. Public API origin is different and known SW ignores foreign origin; verify rather than generalize. Existing old one-shot page requires one initial actual new-client load before experiment, then no reload. Source update must not depend on per-event Pages deploy.",
    "Only actual skill tools available may be used. Read specific named governance files via Read. If Glob/Grep absent report it; do not claim reading files not read. Bash unavailable, tests NOT_RUN by Forge; provide exact host test/build path, assumptions/limits.",
    "Preserve existing source/provider capabilities. Never publish, spawn agents, commit/push or test via unavailable tools. Return CA_IMPLEMENTED or CA_QUESTION with own architecture argument, changed paths and minimal required real experiment."
  ],
  "official_sources": [
    "https://docs.github.com/en/rest/repos/contents#get-repository-content",
    "https://docs.github.com/en/rest/using-the-rest-api/using-cors-and-jsonp-to-make-cross-origin-requests",
    "https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api",
    "https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api"
  ],
  "source_limits": "Host researched current official docs; you cannot browse these URLs. Current loaded source is live client47, real-event original already published. Historical single-event tests do not prove this new live behavior.",
  "expected_result": "One bounded complete session; no CLI turn or tiny-dollar cutoff; preserve partial patch if technical watchdog reached. Host arranges independent review and QA and Peter publication decision."
}''')
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
