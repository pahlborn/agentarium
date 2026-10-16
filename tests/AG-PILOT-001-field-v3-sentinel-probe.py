import hashlib, importlib.util, inspect, json, os, re, shutil, tempfile
from pathlib import Path

ROOT=Path(__file__).resolve().parent
PATCH=ROOT.parent/'field-v3-evidence/forge.patch'
CAP=ROOT.parent/'field-v3-evidence/activity.json'
WIT=ROOT.parent/'field-v3-evidence/activity-http-witness.json'
checks=[]
def ck(name, value, detail=''):
    checks.append(bool(value)); print(('PASS' if value else 'FAIL'),name,detail)

ck('exact patch sha256', hashlib.sha256(PATCH.read_bytes()).hexdigest()=='73571f323424aec6442358015d578b73998341da82a9f8fece05e7fd06fa3458')
ck('exact capture sha256', hashlib.sha256(CAP.read_bytes()).hexdigest()=='dd1a1344258397804cae761c91f95d6c7b886ae323a319ed211e44ee38706c59')
ptext=PATCH.read_text()
paths=re.findall(r'^\+\+\+ b/(.+)$',ptext,re.M)
ck('patch scope exactly two', paths==['previews/AG-VISUAL-005-feld/activity-input.js','previews/AG-VISUAL-005-feld/schicht.py'],repr(paths))

sp=ROOT/'previews/AG-VISUAL-005-feld/schicht.py'; jp=sp.with_name('activity-input.js')
spec=importlib.util.spec_from_file_location('ag_schicht',sp); mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
ck('builder signature preserved',list(inspect.signature(mod.bauen).parameters)==['quelle','ziel','stueck'])
with tempfile.TemporaryDirectory() as td:
    td=Path(td); src=td/'in.html';out=td/'out.html';src.write_text('<!doctype html><body><main>QA</main></body>',encoding='utf-8')
    n=mod.bauen(src,out,{'projekt':'QA','titel':'QA','ereignisse':[]})
    built=out.read_text(encoding='utf-8')
    ck('builder output nonempty and length exact',n==len(built) and n>len(src.read_text()))
    ck('self-contained adapter embedded',jp.read_text() in built and 'src="activity-input.js"' not in built)
    ck('adapter before field engine',built.index('Agentarium Aktivitaets-Eingang')<built.index('var AGENTEN ='))
    ck('script-end escaping rule present',"replace('</script', '<\\\\/script')" in sp.read_text())
    # Independent empty-file copy checks the guard without touching the artifact.
    q=td/'copy';q.mkdir();shutil.copy2(sp,q/'schicht.py');(q/'activity-input.js').write_text('',encoding='utf-8')
    s2=importlib.util.spec_from_file_location('ag_empty',q/'schicht.py');m2=importlib.util.module_from_spec(s2);s2.loader.exec_module(m2)
    try: m2.bauen(src,td/'empty.html',{'projekt':'QA','titel':'QA','ereignisse':[]}); guarded=False
    except ValueError as e: guarded=str(e)=='activity-input.js ist leer'
    ck('empty adapter rejected',guarded)

js=jp.read_text()
ck('no product transition calls in adapter',not re.search(r'\b(arbeitAn|auftragFertig)\s*\(',js))
ck('no communication/domain mutation APIs in adapter',not re.search(r'\b(handoff|artifact|review|flight|nachricht|uebergabe|status_change)\s*\(',js,re.I))
ck('exact cost phrase, no amount',js.count("Kosten nicht vollständig ermittelbar.")==1 and not re.search(r'KOSTEN\s*=.*\d+[.,]\d+',js))

c=json.loads(CAP.read_text()); obs=c['observations']; sid='065336d2-8af6-40c4-8a55-7135c70441f5'; task='AG-PILOT-001-FIELD-ADAPTER-V3'
ck('capture exact binding',len(obs)>1 and all(o.get('session_id')==sid and o.get('task_id')==task for o in obs))
ck('capture terminal success, not task Done',obs[-1].get('signal')=='execution_stopped' and obs[-1].get('outcome')=='success' and not any(o.get('signal')=='status_change' for o in obs))
ck('capture contains real positive progress',any(o.get('signal')=='stream_sample' and sum(o.get('event_counts',{}).values())>0 for o in obs[1:]))
w=json.loads(WIT.read_text());sn=w['snapshots']
forge=[r for s in sn for r in s['forge']]
ck('HTTP witness work then stopped success',w['errors']==0 and w['requests']==96 and any(r['state']=='working_observed' for r in forge) and forge[-1]['state']=='stopped' and forge[-1]['outcome']=='success')
ck('HTTP witness exact binding',all(r.get('session_id')==sid and r.get('task_id')==task for r in forge))
ck('other agents remain unknown',all(r['state']=='unknown' for s in sn for r in s['other_agents']))
print('SUMMARY',sum(checks),'/',len(checks));raise SystemExit(0 if all(checks) else 1)
