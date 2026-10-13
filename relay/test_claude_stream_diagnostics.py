import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
sys.path.insert(0,str(Path(__file__).parent))
sys.path.insert(0,str(Path(__file__).parent.parent/'relay-work'))
from claude_stream_diagnostics import run_stream
from claude_cli_diagnostics import ClaudeCliFailure

class Stream(unittest.TestCase):
    def call(self,code,timeout=2):
        with tempfile.TemporaryDirectory() as d:
            return run_stream([sys.executable,'-u','-c',code],cwd=d,env=dict(os.environ),timeout=timeout)
    def test_final_result_and_redaction(self):
        r,e=self.call('import json; print(json.dumps({"type":"system","secret":"DO-NOT-EXPOSE"})); print(json.dumps({"type":"stream_event","thinking":"DO-NOT-EXPOSE"})); print(json.dumps({"type":"result","result":"code","total_cost_usd":0.1}))')
        self.assertEqual(r['result'],'code')
        self.assertEqual(e['stream']['event_counts']['result'],1)
        self.assertNotIn('DO-NOT-EXPOSE',json.dumps(e))
        self.assertIsNotNone(e['stream']['first_event_seconds'])
    def test_timeout_has_activity_evidence(self):
        with self.assertRaises(ClaudeCliFailure) as c:
            self.call('import json,time; print(json.dumps({"type":"system"})); time.sleep(2)',.1)
        self.assertEqual(c.exception.evidence['kind'],'TIMEOUT')
        self.assertEqual(c.exception.evidence['stream']['event_counts']['system'],1)
    def test_no_result_rejected(self):
        with self.assertRaises(ClaudeCliFailure) as c:self.call('print("{}")')
        self.assertEqual(c.exception.evidence['kind'],'INVALID_JSON')
    def test_nonzero_exit(self):
        with self.assertRaises(ClaudeCliFailure) as c:self.call('import sys;sys.exit(2)')
        self.assertEqual(c.exception.evidence['kind'],'CLI_EXIT')
    def test_unknown_type_not_leaked(self):
        r,e=self.call('import json; print(json.dumps({"type":"DO-NOT-EXPOSE"})); print(json.dumps({"type":"result","result":"x"}))')
        self.assertNotIn('DO-NOT-EXPOSE',json.dumps(e))
    def test_telemetry_failure_does_not_kill_worker(self):
        def fail(_):raise RuntimeError('DO-NOT-EXPOSE')
        with tempfile.TemporaryDirectory() as d:
            r,e=run_stream([sys.executable,'-u','-c','import json,time;print(json.dumps({"type":"system"}));time.sleep(.06);print(json.dumps({"type":"result","result":"done"}))'],cwd=d,env=dict(os.environ),timeout=2,progress=fail,progress_interval=.001)
        self.assertEqual(r['result'],'done')
        self.assertGreater(e['stream']['event_counts']['telemetry_failure'],0)
        self.assertNotIn('DO-NOT-EXPOSE',json.dumps(e))
    def test_output_limit(self):
        with self.assertRaises(ClaudeCliFailure) as c:self.call('print("x"*4100000)')
        self.assertEqual(c.exception.evidence['detail'],'OUTPUT_LIMIT')

if __name__=='__main__':unittest.main()
