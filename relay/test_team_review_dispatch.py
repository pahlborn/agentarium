import os,sys,types,runpy,unittest
from pathlib import Path
from unittest.mock import patch
root=Path(__file__).resolve().parents[1];profile_root=root/'.claude/agents'
d=types.ModuleType('claude_cli_diagnostics');d.ClaudeCliFailure=type('ClaudeCliFailure',(Exception,),{});d.run_json=lambda *a,**k: (_ for _ in ()).throw(AssertionError('No paid execution'));d.validate_handback=lambda *a:None
f=types.ModuleType('forge_one_shot');f.api=lambda *a:None;f.API='https://api.github.com/repos/pahlborn/agentarium';f.classify_failure=lambda x:x
class Checks(unittest.TestCase):
 def run_case(self,extra=None,repo=None,comments=None,legacy=False,expect='No API key'):
  env={'GITHUB_REPOSITORY':'pahlborn/agentarium','GITHUB_REF_NAME':'agent/team-review-repair-20261016','GITHUB_EVENT_NAME':'push','GITHUB_ACTOR_ID':'277496791','REVIEW_TASK_ID':'AG-REVIEW-20261016-TEAM','REVIEW_EXECUTION_AUTHORIZED':'AG-REVIEW-20261016-TEAM'}
  if legacy:env.update(REVIEW_TASK_ID='AG-PROC-REVIEW-001',GITHUB_REF_NAME='feature/visual-stage-v0')
  env.update(extra or {})
  def api(url,*args):
   assert not args,'No publication allowed'
   return (comments or []) if '/comments?' in url else (repo or {'full_name':'pahlborn/agentarium','owner':{'id':277496791},'private':False})
  with patch.dict(sys.modules,{'claude_cli_diagnostics':d,'forge_one_shot':f}),patch.dict(os.environ,env,clear=True),patch.object(sys,'argv',['runner','archibald']),patch('subprocess.check_output',return_value=(profile_root/'spec-agent.md').read_bytes()):
   ns=runpy.run_path(str(root/'relay/team_process_review_once.py'));ns['main'].__globals__['api']=api
   old=Path.cwd();os.chdir(root)
   try:
    with self.assertRaisesRegex(RuntimeError,expect):ns['main']()
   finally:os.chdir(old)
 def test_public_new_preflight(self):self.run_case()
 def test_wrong_owner(self):self.run_case(repo={'full_name':'pahlborn/agentarium','owner':{'id':1}},expect='Wrong repository owner')
 def test_wrong_actor(self):self.run_case({'GITHUB_ACTOR_ID':'1'},expect='Explicit owner')
 def test_wrong_event(self):self.run_case({'GITHUB_EVENT_NAME':'pull_request'},expect='Explicit owner')
 def test_wrong_branch(self):self.run_case({'GITHUB_REF_NAME':'main'},expect='Wrong project context')
 def test_replay(self):self.run_case(comments=[{'body':'AG-REVIEW-20261016-TEAM-ARCHIBALD-V1'}],expect='Replay prevented')
 def test_legacy_still_private(self):self.run_case(legacy=True,expect='Private repository required')
if __name__ == '__main__':
 unittest.main()
