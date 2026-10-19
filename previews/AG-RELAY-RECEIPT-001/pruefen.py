#!/usr/bin/env python3
"""Offline regression: receipt ordering; no network, workflow or model call."""
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

import yaml

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("relay", ROOT / "relay/claude_public_relay_v2.py")
relay = importlib.util.module_from_spec(spec)
spec.loader.exec_module(relay)


class ReceiptTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="receipt-test-")
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.prepared = self.root / "prepared"
        self.result = self.root / "result"
        self.addCleanup(patch.stopall)
        patch.object(relay, "PREPARED", self.prepared).start()
        patch.object(relay, "RESULT", self.result).start()
        # Any unexpected API call fails rather than using real credentials.
        patch.object(relay, "api", side_effect=AssertionError("network forbidden")).start()
        self.posts = []
        patch.object(relay, "post_issue", side_effect=self.posts.append).start()
        patch.object(relay, "history_contains_terminal", return_value=False).start()
        self.repo = self.root / "repo"
        self.repo.mkdir()
        def git(*args):
            return subprocess.check_output(["git", "-C", str(self.repo), *args], text=True).strip()
        self.git = git
        git("init", "-q")
        git("config", "user.email", "test@example.invalid")
        git("config", "user.name", "Offline test")
        self.request = "handoffs/request.json"
        self.handback = "handoffs/result.md"
        inputs = ["AGENTS.md", "CLAUDE.md", relay.ROLES["coding-agent"], self.request]
        packet = {"schema": "agentarium.handoff.v0", "task_id": "AG-RECEIPT-TEST",
                  "allowed_paths": [self.handback], "readable_paths": inputs}
        for name in inputs:
            target = self.repo / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(json.dumps(packet) if name == self.request else "trusted fixture\n")
        git("add", ".")
        git("commit", "-qm", "source fixture")
        parent = git("rev-parse", "HEAD")
        activation = {"schema": "agentarium.relay-activation.v2", "task_id": "AG-RECEIPT-TEST",
                      "authorized": True, "source_commit": parent, "role": "coding-agent",
                      "request": self.request, "handback": self.handback,
                      "model": "test-only", "max_turns": 1, "max_budget_usd": 0.05}
        target = self.repo / relay.ACTIVATION
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(activation))
        git("add", ".")
        git("commit", "-qm", "activation fixture")
        patch.object(relay, "git", side_effect=git).start()
        patch.object(relay, "source", side_effect=lambda ref, path:
                     subprocess.check_output(["git", "-C", str(self.repo), "show", f"{ref}:{path}"])).start()
        patch.dict(os.environ, {"GITHUB_REPOSITORY": relay.REPO, "GITHUB_ACTOR_ID": "277496791",
                              "GITHUB_EVENT_NAME": "push", "GITHUB_RUN_ID": "42"}).start()

    def test_upload_failure_has_no_receipt(self):
        relay.prepare()
        # Workflow stops on failed upload, so announce is never called.
        self.assertEqual(self.posts, [])
        relay.verify_manifest(self.prepared)

    def test_uploaded_bundle_receipt_uses_immutable_identity(self):
        relay.prepare()
        with patch.dict(os.environ, {"GITHUB_RUN_ID": "999"}):
            relay.announce()
        self.assertEqual(len(self.posts), 1)
        self.assertIn(":HOST_RECEIVED:", self.posts[0])
        self.assertIn(":42 -->", self.posts[0].splitlines()[0])
        self.assertIn("/actions/runs/42", self.posts[0])

    def test_corrupt_bundle_does_not_announce(self):
        relay.prepare()
        (self.prepared / "workspace/AGENTS.md").write_text("tampered")
        with self.assertRaises(RuntimeError):
            relay.announce()
        self.assertEqual(self.posts, [])

    def test_missing_worker_result_produces_terminal_after_receipt(self):
        relay.prepare()
        relay.announce()
        relay.ensure_fallback()
        relay.publish()
        self.assertEqual(len(self.posts), 2)
        self.assertIn(":BLOCKED:", self.posts[-1])
        self.assertIn("RUN_JOB_NO_RESULT", self.posts[-1])

    def test_lost_receipt_http_ack_can_still_publish_terminal(self):
        relay.prepare()
        def lost_ack(body):
            self.posts.append(body)
            raise TimeoutError("simulated HTTP acknowledgement loss")
        with patch.object(relay, "post_issue", side_effect=lost_ack):
            with self.assertRaises(TimeoutError):
                relay.announce()
        relay.ensure_fallback()
        relay.publish()
        self.assertEqual(len(self.posts), 2)
        self.assertIn(":BLOCKED:", self.posts[-1])

    def test_workflow_upload_precedes_receipt_and_receipt_failure_is_nonfatal(self):
        workflow = yaml.safe_load((ROOT / ".github/workflows/claude-public-relay-v2.yml").read_text())
        steps = workflow["jobs"]["prepare"]["steps"]
        upload = next(i for i, step in enumerate(steps) if step.get("uses", "").startswith("actions/upload-artifact@"))
        receipt = next(i for i, step in enumerate(steps) if step.get("run", "").endswith(" announce"))
        self.assertGreater(receipt, upload)
        self.assertNotIn("continue-on-error", steps[upload])
        self.assertNotIn("if", steps[receipt])
        self.assertIs(steps[receipt]["continue-on-error"], True)
        self.assertEqual(workflow["jobs"]["publish"]["if"], "always() && needs.prepare.result == 'success'")


if __name__ == "__main__":
    unittest.main(verbosity=2)
