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
from activity_capture import ActivityRecorder
import threading, time, urllib.request, re
from datetime import datetime, timezone
from claude_stream_diagnostics import run_stream
from claude_cli_diagnostics import ClaudeCliFailure, validate_handback

BASE = "2b9c7150c20284103f00786dcaf34d0f2dc0f89b"
BRANCH = "feature/ag-interface-k3-final"
TASK = "AG-PILOT-001-FIELD-ADAPTER-V3"
PROFILE = "0dcac59d22c27753f111fb1ad79f5a9be524052a"
ASSIGNMENT = "handoffs/AG-PILOT-001-field-adapter-v3.json"
ALLOWED = ("previews/AG-VISUAL-005-feld/schicht.py", "previews/AG-VISUAL-005-feld/activity-input.js")


def post(body):
    api(API + "/issues/2/comments", {"body": body})


def source(path):
    return subprocess.check_output(["git", "show", BASE + ":" + path])


class CaptureProbe:
    """Read-only loopback witness during the actual authorized worker, no provider calls."""
    def __init__(self, out):
        self.out = out
        self.rows = []
        self.requests = 0
        self.errors = 0
        self.stop = threading.Event()
        self.server = None
        self.thread = None
        self.url = None
    def start(self):
        d = json.loads(source("fixtures/AG-VISUAL-005-beispiele-v2-1/11-snapshot-plus-tail.json"))
        p = self.out / "probe-input.json"
        p.write_text(json.dumps({"snapshot": d["daten"]["schnappschuss"], "events": []}))
        env = dict(os.environ)
        for key in ("GH_TOKEN", "GITHUB_TOKEN", "ACTIONS_RUNTIME_TOKEN", "ANTHROPIC_API_KEY"):
            env.pop(key, None)
        self.server = subprocess.Popen(["python3", "pilot/AG-PILOT-001/local_transport.py",
            "--input", str(p), "--port", "0", "--activity-input", str(self.out / "activity.json"),
            "--activity-fresh-ms", "90000"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, env=env)
        import selectors
        sel = selectors.DefaultSelector()
        sel.register(self.server.stdout, selectors.EVENT_READ)
        try:
            if not sel.select(10):
                raise RuntimeError("Local probe start timeout")
            line = self.server.stdout.readline()
        finally:
            sel.close()
        found = re.search(r"http://127\.0\.0\.1:[0-9]+", line)
        if not found:
            raise RuntimeError("Local probe address missing")
        self.url = found.group(0)
        self.thread = threading.Thread(target=self.loop, daemon=True)
        self.thread.start()
    def sample(self):
        if not self.url:
            return
        try:
            with urllib.request.urlopen(self.url + "/activity", timeout=2) as r:
                d = json.load(r)
            self.requests += 1
            focus = [r for r in d.get("rows", []) if r.get("agent") == "forge" and r.get("task_id") == TASK]
            row = {"observed_at": datetime.now(timezone.utc).isoformat(), "mode": d.get("mode"),
                   "data_kind": d.get("data_kind"), "source_errors": d.get("source_errors"),
                   "forge": focus, "other_agents": [r for r in d.get("rows", []) if r.get("agent") != "forge"]}
            stamp = [(r.get("state"), r.get("last_evidence_at"), r.get("session_id")) for r in focus]
            previous = [(r.get("state"), r.get("last_evidence_at"), r.get("session_id")) for r in self.rows[-1]["forge"]] if self.rows else None
            if stamp != previous:
                self.rows.append(row)
                if len(self.rows) > 60:
                    self.rows = self.rows[:2] + self.rows[-58:]
        except Exception:
            self.errors += 1
    def loop(self):
        while not self.stop.wait(2):
            self.sample()
    def finish(self):
        self.stop.set()
        if self.thread:
            self.thread.join(timeout=4)
        self.sample()
        if self.server and self.server.poll() is None:
            self.server.terminate()
            try:
                self.server.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.server.kill()
                self.server.wait()
        if self.server:
            self.server.stdout.close()
            self.server.stderr.close()
        (self.out / "activity-http-witness.json").write_text(json.dumps(
            {"scope": "actual Claude CLI to local capture file to local HTTP API; no browser proof",
             "canonical_work_input": "SYNTHETIC technical baseline, independent of real activity diagnostics",
             "requests": self.requests, "errors": self.errors, "snapshots": self.rows}, indent=2))
        data = self.out / "activity.json"
        proof = {"captured": data.exists(), "http_requests": self.requests,
                 "working_observed_seen": any(x.get("state") == "working_observed" for s in self.rows for x in s["forge"]),
                 "stopped_seen": any(x.get("state") == "stopped" for s in self.rows for x in s["forge"]),
                 "browser_tested": False}
        if data.exists():
            raw = data.read_text()
            proof["sha256"] = hashlib.sha256(raw.encode()).hexdigest()
            # Publish the unchanged metadata document in bounded parts; Atlas can durably archive it.
            pieces = [raw[i:i+12000] for i in range(0, len(raw), 12000)]
            for i, piece in enumerate(pieces, 1):
                post("## " + TASK + " — ACTIVITY_DATA_PART\n```json\n" +
                     json.dumps({"part": i, "parts": len(pieces), "sha256": proof["sha256"], "payload": piece}) +
                     "\n```")
        if self.rows:
            post("## " + TASK + " — ACTIVITY_HTTP_WITNESS\n```json\n" +
                 json.dumps({"summary": proof, "first": self.rows[0], "last": self.rows[-1],
                             "working": next((s for s in self.rows if any(r.get("state") == "working_observed" for r in s["forge"])), None)}) +
                 "\n```")
        return proof


def main():
    if os.environ.get("GITHUB_REPOSITORY") != "pahlborn/agentarium" or os.environ.get("GITHUB_REF_NAME") != BRANCH:
        raise RuntimeError("Wrong task context")
    repo = api(API)
    if (repo.get("full_name") != "pahlborn/agentarium"
            or repo.get("visibility") != "public"
            or repo.get("private") is not False):
        raise RuntimeError("Exact authorized public repository required")
    if (os.environ.get("GITHUB_REPOSITORY_OWNER_ID") != "277496791"
            or os.environ.get("GITHUB_ACTOR_ID") != "277496791"
            or os.environ.get("GITHUB_EVENT_NAME") != "push"):
        raise RuntimeError("Unauthorized repository owner, actor or event")
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
    out = Path("forge-field-adapter-v3-output").resolve()
    out.mkdir(exist_ok=True)
    cli_version = subprocess.check_output(["claude", "--version"], text=True).strip()
    post("## " + TASK + " — HOST_RECEIVED\nRun: " + run + "\nOne bounded coding session, no automatic retry; requested sonnet/medium. No product publication.\nDefinition: `" + blob + "`\nCLI: " + cli_version)
    config = {"coding-agent": {"description": "Forge: bounded local transport prototype", "prompt": profile.decode(), "model": "sonnet", "tools": ["Read", "Glob", "Grep", "Edit", "Write"]}}
    cmd = ["claude", "--bare", "-p", json.dumps(package, ensure_ascii=False),
           "--agents", json.dumps(config), "--agent", "coding-agent",
           "--tools", "Read,Glob,Grep,Edit,Write", "--allowedTools", "Read,Glob,Grep,Edit,Write",
           "--disallowedTools", "Bash,Agent,mcp__*", "--permission-mode", "dontAsk",
           "--model", "sonnet", "--effort", "medium",
           "--no-session-persistence", "--output-format", "stream-json", "--verbose", "--include-partial-messages"]
    env = dict(os.environ)
    for key in ("GH_TOKEN", "GITHUB_TOKEN", "ACTIONS_RUNTIME_TOKEN"):
        env.pop(key, None)
    before = {}
    with tempfile.TemporaryDirectory(prefix="forge-field-v3-worker-") as tmp:
        work = Path(tmp)
        names = subprocess.check_output(["git", "ls-tree", "-r", "--name-only", BASE, "tests", "fixtures/AG-VISUAL-005-beispiele-v2-1", "pilot/AG-PILOT-001", "relay/claude_stream_diagnostics.py", "relay/claude_cli_diagnostics.py", "relay/test_claude_stream_diagnostics.py", "relay/test_claude_cli_diagnostics.py", "relay/activity_capture.py", "previews/AG-VISUAL-005-feld"], text=True).splitlines()
        for name in names:
            if "__pycache__" in name:
                continue
            raw = source(name)
            if name == "previews/AG-VISUAL-005-feld/schicht.py":
                raw = subprocess.check_output(["git", "show", "f741d59429dba6a74d1b5bbe10a8e7b76c2456e0:" + name])
                got = hashlib.sha1(b"blob " + str(len(raw)).encode() + b"\0" + raw).hexdigest()
                if got != "65dd50c836c306f971cfdbbe794d0994c0ba12a6":
                    raise RuntimeError("Current field blob mismatch")
            before[name] = raw
            p = work / name
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_bytes(raw)
        # The accepted V1 route is already in BASE. Seed only the still-missing adapter.
        adapter = "previews/AG-VISUAL-005-feld/activity-input.js"
        before[adapter] = b""
        (work / adapter).write_text("")
        recorder = ActivityRecorder(out / "activity.json", agent="forge", task_id=TASK,
                                    evidence_ref=run, sample_interval=2.0, max_observations=128)
        probe = CaptureProbe(out)
        probe.start()
        capture_proof = None
        result, execution, failure = None, None, None
        try:
            result, execution = run_stream(cmd, cwd=str(work), env=env, timeout=900, checkpoint_dir=str(out), activity_recorder=recorder,
                progress=lambda x: post("## " + TASK + " — EXECUTION_PROGRESS\nRun: " + run + "\n```json\n" + json.dumps(x) + "\n```"))
            response = validate_handback(result, execution, max_chars=24000)
            (out / "handback.txt").write_text(response)
        except ClaudeCliFailure as exc:
            failure = exc.evidence
        finally:
            capture_proof = probe.finish()
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
                "product_published": False, "tests_run_by_forge": False, "activity_capture": capture_proof,
                "field_base_ref": "f741d59429dba6a74d1b5bbe10a8e7b76c2456e0", "field_base_blob": "65dd50c836c306f971cfdbbe794d0994c0ba12a6"}
        (out / "result-metadata.json").write_text(json.dumps(meta, indent=2))
        implemented = failure is None and "CA_IMPLEMENTED" in response and "CA_QUESTION" not in response
        meta["handback_claims_implemented"] = implemented
        (out / "result-metadata.json").write_text(json.dumps(meta, indent=2))
        state = "RESULT_READY / STOPPED" if implemented and changed and not unauthorized else "PARTIAL_OR_BLOCKED / STOPPED"
        body = "## " + TASK + " — " + state + "\n```json\n" + json.dumps(meta, indent=2) + "\n```\n"
        if patch and len(body) + len(patch) < 60000:
            body += "\nUnaccepted Forge patch, no automatic product write:\n```diff\n" + patch + "\n```"
        else:
            body += "\nSee private workflow artifact forge-field-adapter-v3-output."
        post(body)
        if failure or unauthorized or not changed or not implemented:
            raise RuntimeError("Bounded Forge handback not accepted; see saved evidence, no automatic retry")


if __name__ == "__main__":
    main()
