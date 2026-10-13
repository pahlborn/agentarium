#!/usr/bin/env python3
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from claude_cli_diagnostics import ClaudeCliFailure, classify_detail, diagnostic, run_json, validate_handback


class DiagnosticTests(unittest.TestCase):
    def run_script(self, source, timeout=5):
        with tempfile.TemporaryDirectory() as work:
            script = Path(work, "fake.py")
            script.write_text(source)
            return run_json([sys.executable, str(script)], cwd=work, env=dict(os.environ), timeout=timeout)

    def test_success_metadata_has_no_payload_excerpt(self):
        result, evidence = self.run_script("import json; print(json.dumps({'result':'ok'}))")
        self.assertEqual(result["result"], "ok")
        self.assertEqual(evidence["kind"], "SUCCESS")
        self.assertEqual(evidence["detail"], "SUCCESS")
        self.assertNotIn("safe_excerpt", evidence)

    def test_timeout_is_distinct(self):
        with self.assertRaises(ClaudeCliFailure) as caught:
            self.run_script("import time; time.sleep(2)", timeout=1)
        self.assertEqual(caught.exception.evidence["detail"], "TIMEOUT")
        self.assertIsNone(caught.exception.evidence["returncode"])

    def test_nonzero_exit_preserves_safe_facts(self):
        with self.assertRaises(ClaudeCliFailure) as caught:
            self.run_script("import sys; print('budget exceeded', file=sys.stderr); raise SystemExit(7)")
        evidence = caught.exception.evidence
        self.assertEqual(evidence["kind"], "CLI_EXIT")
        self.assertEqual(evidence["detail"], "BUDGET_EXCEEDED")
        self.assertEqual(evidence["returncode"], 7)
        self.assertGreater(evidence["stderr_bytes"], 0)

    def test_invalid_json_is_distinct(self):
        with self.assertRaises(ClaudeCliFailure) as caught:
            self.run_script("print('not json')")
        self.assertEqual(caught.exception.evidence["kind"], "INVALID_JSON")

    def test_diagnostic_never_contains_provider_output(self):
        secret = "Authorization: Basic c2VjcmV0"
        evidence = diagnostic(kind="CLI_EXIT", stdout="", stderr="error "+secret,
                              elapsed_seconds=1, timeout_seconds=5, returncode=1)
        self.assertNotIn(secret, json.dumps(evidence))
        self.assertNotIn("c2VjcmV0", json.dumps(evidence))

    def test_known_categories(self):
        self.assertEqual(classify_detail("credit balance too low"), "CREDIT_EXHAUSTED")
        self.assertEqual(classify_detail("invalid api key"), "KEY_INVALID_OR_EXPIRED")
        self.assertEqual(classify_detail("rate limit reached"), "RATE_LIMITED")
        self.assertEqual(classify_detail("error_max_budget_usd"), "BUDGET_EXCEEDED")

    def test_null_handback_is_rejected(self):
        with self.assertRaises(ClaudeCliFailure) as caught:
            validate_handback({"result": None}, {"kind": "SUCCESS"})
        self.assertEqual(caught.exception.evidence["detail"], "INVALID_HANDOFF")
        self.assertEqual(caught.exception.evidence["response_type"], "NoneType")

    def test_structured_budget_error_is_preserved(self):
        with self.assertRaises(ClaudeCliFailure) as caught:
            validate_handback({"is_error": True, "subtype": "error_max_budget_usd"}, {"kind": "SUCCESS"})
        self.assertEqual(caught.exception.evidence["detail"], "BUDGET_EXCEEDED")


if __name__ == "__main__":
    unittest.main()
