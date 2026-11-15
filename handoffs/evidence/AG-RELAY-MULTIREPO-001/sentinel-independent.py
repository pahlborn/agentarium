"""Independent scratch checks; source bytes local, no Claude/network evidence."""
import os,sys,pathlib,tempfile,json,copy,hashlib,shutil,stat
from unittest.mock import patch
repo=pathlib.Path('/workspace/work/agentarium')
sys.path.insert(0,str(repo/'relay'))
import project_packet as pp
import claude_public_relay_v2 as driver
passed=[]
def require(ok,label):
 if not ok: raise AssertionError(label)
 passed.append(label)
def reject(fn,label):
 try: fn()
 except (ValueError,PermissionError,RuntimeError): passed.append(label);return
 raise AssertionError('accepted '+label)
def cleanup(root):
 for cur,dirs,files in os.walk(root):
  pathlib.Path(cur).chmod(0o755)
  for name in files:
   p=pathlib.Path(cur)/name
   if not p.is_symlink():p.chmod(0o644)
source=pathlib.Path('/workspace/work/multirepo-evidence/bq-package.json').read_bytes()
require(hashlib.sha256(source).hexdigest()=='4c9fdfbb001276844836447cd9aa3134290354d56d966c5cc54e58cd76e35934','local source SHA256')
require(hashlib.sha1(b'blob '+str(len(source)).encode()+b'\0'+source).hexdigest()=='fc40de702be7b75c3d07655f8ea8f08a013d9783','local source git blob')
a=json.loads((repo/'handoffs/AG-RELAY-MULTIREPO-001-proof-activation-template-v1.json').read_text())
a['source_commit']='61769349fb6da5ebce48670ebc7e1c64cbce2723'
r=json.loads((repo/a['request']).read_text())
driver.validate_activation(a,a['source_commit'])
with tempfile.TemporaryDirectory(prefix='sentinel-packet-') as tmp:
 root=pathlib.Path(tmp);prepared=root/'prepared';result=root/'result'
 try:
  with patch.object(driver,'PREPARED',prepared),patch.object(driver,'RESULT',result),patch.dict(os.environ,{'GITHUB_RUN_ID':'424242','GITHUB_RUN_ATTEMPT':'1'}),patch.object(pp,'source_entry',return_value=None),patch.object(pp,'fetch_source',return_value=source):
   pp.prepare(driver,a,a['source_commit'],'d'*40,r)
   context=pp.verify_prepared(driver)
   original=root/'original';shutil.copytree(prepared,original)
   require((prepared/'workspace/target/package.json').read_bytes()==source,'package bytes preserved')
   require((prepared/'workspace/trusted/AGENTS.md').is_file(),'trusted governance separate')
   require(not (prepared/'workspace/target/AGENTS.md').exists(),'no target governance supplied')
   expected=json.loads(source);line='Synthetic independent QA: '+expected['name']+'@'+expected['version']+'\n'
   writes={'workspace/'+p for p in pp.writable_paths(context)}
   pp.seal(prepared,writes);pp.verify_prepared(driver,modes=True)
   require(all(stat.S_IMODE(pathlib.Path(cur).stat().st_mode)==0o555 for cur,_,_ in os.walk(prepared)),'every directory0555')
   doc=prepared/'workspace/target/relay-proof/existing.md';new=doc.with_name('new.md');extra=doc.with_name('sibling.md')
   old=doc.read_text();doc.write_text(old+line);new.write_text(line)
   pp.verify_prepared(driver,changed=True,modes=True)
   reject(lambda:extra.write_text('unauthorized'),'OS rejects sibling creation')
   reject(lambda:doc.unlink(),'OS rejects deletion')
   reject(lambda:doc.rename(doc.with_name('renamed.md')),'OS rejects rename')
   reject(lambda:(prepared/'workspace/target/package.json').write_text('unauthorized'),'OS rejects bound source edit')
   change=pp.changes_from_work(context,driver)
   require({(x['path'],x['operation']) for x in change['changes']}=={('relay-proof/existing.md','edit'),('relay-proof/new.md','create')},'actual two-operation delta')
   with patch.object(driver,'PREPARED',original):
    restored=root/'restored';inventory=pp.restore(change,context,driver,restored)
    require((restored/'package.json').read_bytes()==source,'restore source unchanged')
    require((restored/'relay-proof/existing.md').read_text()==old+line,'restore edit exact')
    require((restored/'relay-proof/new.md').read_text()==line,'restore new exact')
    bad=copy.deepcopy(change);bad['packet_binding']='e'*64;reject(lambda:pp.restore(bad,context,driver,root/'bad1'),'stale attempt rejected')
    bad=copy.deepcopy(change);bad['changes'][0]['content_base64']='dGFtcGVyZWQ=';reject(lambda:pp.restore(bad,context,driver,root/'bad2'),'tampered payload rejected')
    bad=copy.deepcopy(change);bad['changes'][0]['operation']='delete';reject(lambda:pp.restore(bad,context,driver,root/'bad3'),'delete result rejected')
   command=pp.command(context,driver);allow=command[command.index('--allowedTools')+1].split(',')
   require('Write(/target/relay-proof/new.md)' in allow and 'Write(/target/relay-proof/existing.md)' not in allow,'exact Write new slot only')
   # Meaningful counterexample: a writable parent would defeat the sibling guard.
   doc.parent.chmod(0o755);extra.write_text('counterexample only');require(extra.is_file(),'counterexample writable parent admits sibling')
   reject(lambda:pp.verify_prepared(driver,changed=True,modes=True),'counterexample caught by full inventory')
   # Read-only configurations: zero writable paths and only Read in all three roles.
   for role in ['coding-agent','spec-agent','process-agent']:
    c=copy.deepcopy(context);c['activation']['role']=role;c['activation']['contract']['mode']='analysis';c['activation']['contract']['edit_paths']=[];c['activation']['contract']['create_paths']=[]
    require(pp.writable_paths(c)==[],'readonly '+role+' zero paths')
 except Exception:
  cleanup(root);raise
 cleanup(root)
print(json.dumps({'status':'PASS','checks':passed,'count':len(passed),'source_fetch':'mocked exact local source bytes; NOT real R1','model':'NOT_RUN'},indent=2))
