import sys,pathlib,subprocess,types,json,copy
root=pathlib.Path('/workspace/work/agentarium');sys.path.insert(0,str(root/'relay'))
import project_packet as fixed
import claude_public_relay_v2 as driver
old=types.ModuleType('project_packet_beforefix');old.__file__='scratch-beforefix.py'
exec(compile(subprocess.check_output(['git','show','HEAD^:relay/project_packet.py'],cwd=root),'scratch-beforefix.py','exec'),old.__dict__)
a=json.loads((root/'handoffs/AG-RELAY-MULTIREPO-001-proof-activation-template-v1.json').read_text());a['source_commit']='97daafb86d1a0b638c0d4d265e8e19733b10db12'
c=a['contract'];c.update(edit_paths=[],create_paths=[],synthetic_files=[],test_profile='none');c['identity'].update(project_id='big-quest',run_id='BQ-EVAL-01',task_id='BQ-EVAL-01-INT-01-DEV',parent_id='BQ-EVAL-01-INT-01')
checks=[]
for name in ['.env.production','config/.env.local','relay-proof/.env.production']:
 case=copy.deepcopy(a);case['contract']['create_paths']=[name]
 old.validate_activation(case,case['source_commit'],driver)
 try: fixed.validate_activation(case,case['source_commit'],driver)
 except ValueError as e:
  assert str(e)=='protected project path';checks.append({'path':name,'before':'ACCEPTED','after':'REJECTED'})
 else: raise AssertionError('fixed activation accepted '+name)
for name in ['relay-proof/new.md','relay-proof/environment.md','relay-proof/env-notes.md']:
 case=copy.deepcopy(a);case['contract']['create_paths']=[name]
 fixed.validate_activation(case,case['source_commit'],driver);checks.append({'path':name,'after':'ACCEPTED expected'})
print(json.dumps({'status':'PASS','checks':checks,'no_network_or_model':True},indent=2))
