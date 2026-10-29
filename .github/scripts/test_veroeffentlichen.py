#!/usr/bin/env python3
"""B1: echte Entscheidungs-/Beleglogik, lokaler Git-Verlauf, ersetzte GitHub-API.
Kein Netz, kein Modell, keine Pages-Aenderung. Gegenfaelle laufen im PR mit.
"""
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / ".github/scripts/veroeffentlichen.sh"
WORKFLOW = ROOT / ".github/workflows/veroeffentlichen.yml"
BROWSER = ROOT / ".github/workflows/browsernachweise.yml"
MOCK = r'''#!/usr/bin/env python3
import json, os, sys
from pathlib import Path
args = sys.argv[1:]
data = json.loads(Path(os.environ["B1_FIXTURE"]).read_text())
url = next(a for a in args if a.startswith("repos/"))
kind = ("pages" if url.endswith("/pages") else
        "runs" if "/runs?" in url else
        "statuses" if "/statuses?" in url else "deployments")
if data.get("failure") == kind:
    sys.exit(23)
if "--method" in args:
    body = json.load(sys.stdin) if "--input" in args else args
    with open(os.environ["B1_REQUESTS"], "a") as f:
        f.write(json.dumps({"url": url, "body": body}) + "\n")
    if kind == "deployments": print(17)
elif kind == "pages":
    print(data.get("pages", "workflow"))
elif kind == "runs":
    assert "--paginate" in args
    print("\n".join(data["green"]))
elif kind == "statuses":
    ident = url.split("/deployments/")[1].split("/")[0]
    print(next(r["state"] for r in data["records"] if str(r["id"]) == ident))
else:
    assert "--paginate" in args
    for r in data["records"]:
        print("\t".join(str(r.get(k, "")) for k in
            ["created_at", "id", "sha", "source_sha", "schema", "artifact_id", "run_id"]))
'''

class Decision(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.base = Path(cls.temp.name)
        cls.remote = cls.base / "origin.git"
        cls.repo = cls.base / "work"
        subprocess.run(["git", "init", "--bare", "-q", str(cls.remote)], check=True)
        cls.repo.mkdir()
        cls.git("init", "-q", "-b", "main")
        cls.git("config", "user.name", "B1 fixture")
        cls.git("config", "user.email", "fixture@example.invalid")
        (cls.repo / ".github/workflows").mkdir(parents=True)
        shutil.copyfile(BROWSER, cls.repo / ".github/workflows/browsernachweise.yml")
        (cls.repo / "pilot/github-live").mkdir(parents=True)
        (cls.repo / "pilot/github-live/index.html").write_text("A")
        cls.A = cls.commit("A")
        (cls.repo / "pilot/github-live/index.html").write_text("B")
        cls.B = cls.commit("B: protected change")
        (cls.repo / "note.md").write_text("C: outside tested paths")
        cls.C = cls.commit("C")
        cls.git("checkout", "-q", "-b", "side", cls.A)
        (cls.repo / "note.md").write_text("side")
        cls.side = cls.commit("not on main")
        cls.git("checkout", "-q", "main")
        cls.git("remote", "add", "origin", str(cls.remote))
        cls.git("push", "-q", "origin", "main", "side")
        cls.bin = cls.base / "bin"
        cls.bin.mkdir()
        (cls.bin / "gh").write_text(MOCK)
        (cls.bin / "gh").chmod(0o755)

    @classmethod
    def git(cls, *args):
        return subprocess.check_output(["git", *args], cwd=cls.repo,
                                       stderr=subprocess.DEVNULL, text=True).strip()

    @classmethod
    def commit(cls, message):
        cls.git("add", ".")
        cls.git("commit", "-qm", message)
        return cls.git("rev-parse", "HEAD")

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def setUp(self):
        self.case = tempfile.TemporaryDirectory(dir=self.base)
        self.here = Path(self.case.name)
        self.fixture = self.here / "fixture.json"
        self.requests = self.here / "requests.jsonl"
        self.env = dict(os.environ, PATH=str(self.bin) + os.pathsep + os.environ["PATH"],
                        B1_FIXTURE=str(self.fixture), B1_REQUESTS=str(self.requests),
                        REPO="fixture/repo", GITHUB_OUTPUT=str(self.here / "outputs"),
                        GITHUB_STEP_SUMMARY=str(self.here / "summary"),
                        RUNNER_TEMP=str(self.here), EREIGNIS="push")
        self.env.pop("PAGES_ART", None)
        self.data = {"green": [self.B], "records": [self.record(1, self.A)]}
        self.addCleanup(self.case.cleanup)

    def record(self, ident, sha, state="success"):
        return dict(id=ident, created_at=f"2026-10-{ident:02d}T00:00:00Z", sha=sha,
                    source_sha=sha, schema="agentarium.pages-source.v1",
                    artifact_id="123", run_id="456", state=state)

    def run_script(self, command="entscheiden", **env):
        self.fixture.write_text(json.dumps(self.data))
        output = Path(self.env["GITHUB_OUTPUT"])
        output.unlink(missing_ok=True)
        result = subprocess.run(["bash", str(SCRIPT), command], cwd=self.repo,
                                env=dict(self.env, **env), text=True, capture_output=True)
        fields = dict(line.split("=", 1) for line in output.read_text().splitlines()) if output.exists() else {}
        return result, fields

    def yes(self, sha=None, **env):
        r, out = self.run_script(**env)
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(out.get("los"), "ja", r.stdout + r.stderr)
        self.assertEqual(out["sha"], sha or self.C)
        self.assertIn(out["gruen"], self.data["green"])
        return out

    def no(self, **env):
        r, out = self.run_script(**env)
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(out.get("los"), "nein", r.stdout + r.stderr)

    def test_legacy_source_is_inert(self):
        self.data["pages"] = "legacy"
        self.no()

    def test_initial_automatic_requires_explicit_first_publish(self):
        self.data["records"] = []
        self.no()

    def test_initial_manual_uses_checked_source(self):
        self.data["records"] = []
        self.yes(EREIGNIS="workflow_dispatch", EINGABE_SHA=self.C)

    def test_newer_main_not_stale_event_is_selected(self):
        self.yes(GITHUB_SHA=self.A)

    def test_protected_drift_is_denied(self):
        self.data["green"] = [self.A]
        self.no()

    def test_non_main_green_is_denied(self):
        self.data["green"] = [self.side]
        self.no()

    def test_failed_attempt_does_not_suppress_retry(self):
        self.data["records"].insert(0, self.record(2, self.C, "failure"))
        self.yes()

    def test_pending_attempt_does_not_claim_publication(self):
        self.data["records"].insert(0, self.record(2, self.C, "pending"))
        self.yes()

    def test_successful_source_skips_duplicate(self):
        self.data["records"] = [self.record(2, self.C)]
        self.no()

    def test_rollback_is_checked_and_records_selected_not_event_sha(self):
        self.data["green"] = [self.A, self.B]
        self.data["records"] = [self.record(2, self.C)]
        self.yes(sha=self.A, EREIGNIS="workflow_dispatch", EINGABE_SHA=self.A,
                 GITHUB_SHA=self.C)
        r, _ = self.run_script(command="belegen", SHA=self.A, GRUEN_SHA=self.A,
                              EVENT_SHA=self.C, ARTEFAKT_ID="900", GITHUB_RUN_ID="901",
                              URL="https://example.invalid/", GITHUB_SERVER_URL="https://github.com")
        self.assertEqual(r.returncode, 0, r.stderr)
        calls = [json.loads(x) for x in self.requests.read_text().splitlines()]
        body = calls[0]["body"]
        self.assertEqual(body["ref"], self.A)
        self.assertEqual(body["payload"]["source_sha"], self.A)
        self.assertEqual(body["payload"]["event_sha"], self.C)
        self.assertEqual(body["payload"]["artifact_id"], "900")
        self.assertIn("state=success", calls[1]["body"])
        self.data["records"] = [self.record(3, self.A), self.record(2, self.C)]
        self.yes()  # next automatic run advances from actual rolled-back A

    def test_foreign_or_invalid_manual_input_is_denied(self):
        for candidate in [self.side, "not-a-commit"]:
            self.no(EREIGNIS="workflow_dispatch", EINGABE_SHA=candidate)

    def test_api_errors_are_errors_not_no_publication_claim(self):
        for failure in ["pages", "deployments", "statuses", "runs"]:
            self.data["failure"] = failure
            r, _ = self.run_script()
            self.assertNotEqual(r.returncode, 0, failure)

    def test_inconsistent_success_provenance_is_denied(self):
        self.data["records"][0]["source_sha"] = self.B
        r, _ = self.run_script()
        self.assertNotEqual(r.returncode, 0)

    def test_record_failure_is_not_success(self):
        self.data["failure"] = "deployments"
        r, _ = self.run_script(command="belegen", SHA=self.C, GRUEN_SHA=self.B,
                              EVENT_SHA=self.A, ARTEFAKT_ID="900", GITHUB_RUN_ID="901",
                              URL="https://example.invalid/", GITHUB_SERVER_URL="https://github.com")
        self.assertNotEqual(r.returncode, 0)
        self.assertFalse(self.requests.exists())

    def test_workflow_binds_artifact_control_and_source(self):
        text = WORKFLOW.read_text()
        self.assertIn("pull_request:", text)
        self.assertIn("python3 .github/scripts/test_veroeffentlichen.py", text)
        self.assertIn("ref: ${{ github.workflow_sha }}", text)
        self.assertIn("path: .b1-control", text)
        self.assertIn("path: .b1-site", text)
        self.assertIn("source: ./.b1-site", text)
        self.assertIn("ARTEFAKT_ID: ${{ steps.artefakt.outputs.artifact_id }}", text)
        self.assertLess(text.index("- id: bereitstellen"), text.index("bash .b1-control/"))
        self.assertIn("EVENT_SHA: ${{ github.sha }}", text)

if __name__ == "__main__":
    unittest.main(verbosity=2)

