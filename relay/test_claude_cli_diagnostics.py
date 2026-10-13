#!/usr/bin/env python3
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from claude_cli_diagnostics import ClaudeCliFailure, classify_detail, run_json, safe_excerpt


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

    def test_secret_redaction(self):
        excerpt = safe_excerpt("", "authentication_error api_key=sk-ant-abcdefghijklmnopqrstuvwxyz0123456789")
        self.assertNotIn("abcdefghijklmnopqrstuvwxyz", excerpt)
        self.assertIn("[REDACTED]", excerpt)

    def test_known_categories(self):
        self.assertEqual(classify_detail("credit balance too low"), "CREDIT_EXHAUSTED")
        self.assertEqual(classify_detail("invalid api key"), "KEY_INVALID_OR_EXPIRED")
        self.assertEqual(classify_detail("rate limit reached"), "RATE_LIMITED")


if __name__ == "__main__":
    unittest.main()
