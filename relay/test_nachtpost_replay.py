import ast
from pathlib import Path
import unittest

SOURCE = Path(__file__).with_name('forge_nachtpost_once.py').read_text()
MAIN = next(n for n in ast.parse(SOURCE).body if isinstance(n, ast.FunctionDef) and n.name == 'main')
START = next(i for i,n in enumerate(MAIN.body) if isinstance(n, ast.Assign) and any(isinstance(t,ast.Name) and t.id=='existing' for t in n.targets))
END = next(i for i,n in enumerate(MAIN.body) if isinstance(n, ast.Assign) and any(isinstance(t,ast.Name) and t.id=='package' for t in n.targets))
CHECK = compile(ast.fix_missing_locations(ast.Module(body=MAIN.body[START:END],type_ignores=[])), '<actual-replay-check>', 'exec')

class Replay(unittest.TestCase):
    def run_check(self, batches):
        calls=[]
        def api(url):
            calls.append(url)
            return batches[len(calls)-1]
        env={'api':api,'API':'api','MARKER':'NEW-TASK'}
        exec(CHECK,env)
        return calls,env['existing']
    def test_page_two_marker_blocks(self):
        with self.assertRaisesRegex(RuntimeError,'Replay prevented'):
            self.run_check([[{'body':'other'}]*100,[{'body':'NEW-TASK'}]+[{'body':'other'}]*49])
    def test_all_150_scanned(self):
        calls,items=self.run_check([[{'body':'other'}]*100,[{'body':'other'}]*50])
        self.assertEqual(len(items),150)
        self.assertEqual(len(calls),2)
        self.assertTrue(calls[1].endswith('page=2'))
    def test_invalid_page_aborts(self):
        with self.assertRaisesRegex(RuntimeError,'Incomplete replay evidence'):
            self.run_check([[{'body':'other'}]*100,{'error':'truncated'}])
    def test_exact_full_page_requests_empty_next(self):
        calls,_=self.run_check([[{'body':'other'}]*100,[]])
        self.assertEqual(len(calls),2)

if __name__=='__main__': unittest.main()
