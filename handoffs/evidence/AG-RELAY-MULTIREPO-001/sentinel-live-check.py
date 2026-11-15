import os,sys,json,pathlib,hashlib,subprocess,tempfile,zipfile,stat,copy,base64,shutil,datetime
sys.dont_write_bytecode=True
base=pathlib.Path('/workspace/work/multirepo-evidence/live');repo=pathlib.Path('/workspace/work/agentarium');out=base.parent
expected={'prepared':'2466dbeac2cfc28c05aef346d791bb89931cbf488948d5ff6e6a488ee654263d','result':'13df565eefd3e8ca021daae54e0ee219bf4f5b53cb1866a931bee492f093d93a','tests':'ac736479cc1010b8f9f249de87182617f4777a0c0e46578d8d837a06bde4e546','start':'0a8bfcba6d1a85a04a9b7504ba9a8b40395906b4cd69543f8677acce44e94fd1','end':'7eaa0e6f910f70b7c6eb88775f4d392f05f824aff20370714637d4aee8869075'}
checks=[]
def h(data):return hashlib.sha256(data).hexdigest()
def ok(value,label):
 if not value:raise AssertionError(label)
 checks.append(label)
def reject(fn,label):
 try:fn()
 except (ValueError,RuntimeError):checks.append(label);return
 raise AssertionError(label+' unexpectedly accepted')
original={p.relative_to(base).as_posix():h(p.read_bytes()) for p in base.rglob('*') if p.is_file()}
for name,value in expected.items():
 archive=base/(name+'.zip');ok(h(archive.read_bytes())==value,'ZIP SHA256 '+name)
 with zipfile.ZipFile(archive) as z:
  names=z.namelist();ok(len(names)==len(set(names)),'ZIP no duplicate '+name)
  for item in z.infolist():
   path=pathlib.PurePosixPath(item.filename)
   assert not path.is_absolute() and '..' not in path.parts and '\\' not in item.filename
   assert not stat.S_ISLNK(item.external_attr>>16)
   if not item.is_dir():assert (base/name/item.filename).read_bytes()==z.read(item)
 checks.append('ZIP inventory/payload safe and exact '+name)
sys.path.insert(0,str(base/'prepared'))
import relay_driver as d
import project_packet as pp
import claude_runtime_events as runtime
d.PREPARED=base/'prepared';d.RESULT=base/'result'
ctx=pp.verify_prepared(d)
source='d3e570ea13d1184b00aca46911ef74e7e539e8c5';head='9423c5eae3e5e0e1e757fd0d9f1e1531ebbe97b4'
ok(ctx['source_commit']==source and ctx['head']==head and ctx['run_id']=='43705367095' and ctx['run_attempt']=='1','context exact source/activation/run/attempt')
for dest,path in [('relay_driver.py','relay/claude_public_relay_v2.py'),('project_packet.py','relay/project_packet.py'),('claude_runtime_events.py','relay/claude_runtime_events.py')]:
 expected_source=subprocess.check_output(['git','show',source+':'+path],cwd=repo)
 ok((d.PREPARED/dest).read_bytes()==expected_source,'reviewed host module '+dest)
for p in (d.PREPARED/'workspace/trusted').rglob('*'):
 if p.is_file():
  relative=p.relative_to(d.PREPARED/'workspace/trusted').as_posix()
  ok(p.read_bytes()==subprocess.check_output(['git','show',source+':'+relative],cwd=repo),'trusted source '+relative)
c=ctx['activation']['contract'];src=(d.PREPARED/'workspace/target/package.json').read_bytes()
ok(c['target_commit']=='7995d6968e3895b88f8ed2c3b0476683e5720c1a','exact BQ commit')
ok(h(src)=='4c9fdfbb001276844836447cd9aa3134290354d56d966c5cc54e58cd76e35934','real package SHA256')
ok(hashlib.sha1(b'blob '+str(len(src)).encode()+b'\0'+src).hexdigest()=='fc40de702be7b75c3d07655f8ea8f08a013d9783','real package gitblob')
ok({p.relative_to(d.PREPARED/'workspace/target').as_posix() for p in (d.PREPARED/'workspace/target').rglob('*') if p.is_file()}=={'package.json','relay-proof/existing.md','relay-proof/new.md'},'only allowlisted source and synthetic slots')
ok((d.PREPARED/'workspace/target/relay-proof/new.md').read_bytes()==b'','logical new slot initially empty')
seed=c['synthetic_files'][0];ok((d.PREPARED/'workspace/target'/seed['path']).read_text()==seed['content'],'seed overlay explicit/exact')
meta=json.loads((d.RESULT/'metadata.json').read_bytes());pp.validate_result(meta,ctx,d.RESULT,d)
ok(meta['phase']=='result_ready' and meta['session_id']=='be27fb23-236d-48bf-9527-ac54d18422ff' and meta['total_cost_usd']==0.028974,'actual ready session/cost')
ok(ctx['activation']['max_turns']==8 and ctx['activation']['max_budget_usd']==1 and c['max_seconds']==180,'proof limits8turn1USD180sec')
observed=json.loads((d.RESULT/'tool-observations.json').read_bytes())
ok(observed==[{'path':'target/package.json','response':'success','tool':'Read'},{'path':'target/relay-proof/existing.md','response':'success','tool':'Read'},{'path':'target/relay-proof/existing.md','response':'success','tool':'Edit'},{'path':'target/relay-proof/new.md','response':'success','tool':'Edit'}],'actual Read/Read/Edit/Edit observed success; Write not exercised')
changes=json.loads((d.RESULT/'changes.json').read_bytes())
ok([(x['operation'],x['path']) for x in changes['changes']]==[('edit','relay-proof/existing.md'),('create','relay-proof/new.md')],'actual bounded edit and logical create')
with tempfile.TemporaryDirectory(prefix='sentinel-live-restore-') as tmp:
 destination=pathlib.Path(tmp)/'restored';inventory=pp.restore(changes,ctx,d,destination)
 official=json.loads((base/'tests/test-report.json').read_bytes())
 ok(inventory==official['restored_inventory'],'independent restore inventory equals official executor')
 ok((destination/'package.json').read_bytes()==src,'independent restored package unchanged')
 package=json.loads(src);version=package['name']+'@'+package['version']
 for p in ['relay-proof/existing.md','relay-proof/new.md']:
  text=(destination/p).read_text();ok('synthetic' in text.lower() and version in text,'actual restored content '+p)
 report=pp.execute_proof(d.RESULT,d.PREPARED,d)
 ok(report['status']=='PASS' and report['restored_inventory']==inventory and report['changes_sha256']==meta['changes_sha256'] and report['packet_binding']==meta['packet_binding'],'independent fixed executor PASS same exact result')
 bad=copy.deepcopy(changes);bad['packet_binding']='f'*64;reject(lambda:pp.restore(bad,ctx,d,pathlib.Path(tmp)/'stale'),'actualresult stale binding rejected')
 bad=copy.deepcopy(changes);bad['changes'][0]['content_base64']=base64.b64encode(b'tampered').decode();reject(lambda:pp.restore(bad,ctx,d,pathlib.Path(tmp)/'tampered'),'actualresult changed payload rejected')
 bad=copy.deepcopy(meta);bad['run_attempt']='2';reject(lambda:pp.validate_result(bad,ctx,d.RESULT,d),'actualresult different attempt rejected')
start=json.loads((base/'start/start.json').read_bytes());end=json.loads((base/'end/end.json').read_bytes())
runtime.validate(start,ctx,'start');runtime.validate(end,ctx,'end')
ok(start['execution_attempt']==end['execution_attempt'] and start['session_id']==end['session_id']==meta['session_id'],'same runtime attempt and session')
ok(start['start_observed_at']==end['start_observed_at'] and end['worker_state']=='stopped' and end['outcome']=='process_exited' and end['safety']=='passed','observed start and clean stopped end')
ok(start['project_id']=='agentarium' and start['run_id']=='AG-RELAY-MULTIREPO-001' and start['task_id']=='AG-RELAY-MULTIREPO-001-05','infrastructure identity preserved')
ok(end['total_cost_usd']==meta['total_cost_usd'] and meta['elapsed_seconds']<180,'runtime cost and bounded duration')
ok(original=={p.relative_to(base).as_posix():h(p.read_bytes()) for p in base.rglob('*') if p.is_file()},'all original live artifacts remain byte-identical')
output={'status':'PASS','at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source':source,'activation':head,'run_id':'43705367095','checks':checks,'count':len(checks),'environment_keys':list(os.environ),'write_live':'NOT_RUN; actual Edit successfully filled logical new slot','parent_permissions':'verified by reviewed host modes=True before/after worker; extracted ZIP POSIX modes do not attest runtime modes','original_artifact_sha256':expected}
(out/'sentinel-live-report.json').write_text(json.dumps(output,indent=2)+'\n')
print(json.dumps(output,indent=2))
