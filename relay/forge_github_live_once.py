#!/usr/bin/env python3
"""Forge implementation host: safe observed tool events to GitHub during work."""
import datetime, difflib, hashlib, json, os, selectors, subprocess, tempfile, time
from pathlib import Path
from forge_one_shot import api, API

TASK='AG-GH-LIVE-004-PROBE-V1'
BRANCH='agent/ball-live-concept-20261017'
PRODUCT='caebbbebd4b0a5a3c04bab97c0441ccb67f0b5fc'
GENERATOR='b5dcabb47802c6c9b401e6d429040979aaf9ffc5'
PROFILE='38d9747018bd4bfc5299a2dd9aeded9659337e77'
OUT=Path('forge-github-live-output').resolve()

def src(ref,path): return subprocess.check_output(['git','show',ref+':'+path])
def post(body): return api(API+'/issues/2/comments',{'body':body})
def now(): return datetime.datetime.now(datetime.timezone.utc).isoformat()

def main():
    for k,v in {'GITHUB_REPOSITORY':'pahlborn/agentarium','GITHUB_ACTOR_ID':'277496791','GITHUB_EVENT_NAME':'push','GITHUB_REF_NAME':BRANCH}.items():
        if os.environ.get(k)!=v: raise RuntimeError('Unauthorized context '+k)
    head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
    a=json.loads(src(head,'handoffs/AG-GH-LIVE-001-activate.json'))
    if a!={'task_id':TASK,'authorized':True}: raise RuntimeError('Activation mismatch')
    for page in range(1,101):
        rows=api(API+'/issues/2/comments?per_page=100&page='+str(page))
        if not isinstance(rows,list): raise RuntimeError('Invalid history')
        if any(TASK in c.get('body','') for c in rows): raise RuntimeError('Task already executed')
        if len(rows)<100: break
    else: raise RuntimeError('Incomplete history')
    profile=src(head,'.claude/agents/coding-agent.md')
    if hashlib.sha1(b'blob '+str(len(profile)).encode()+b'\0'+profile).hexdigest()!=PROFILE: raise RuntimeError('Role mismatch')
    packet=json.loads(src(head,'handoffs/AG-GH-LIVE-004-probe-request-v1.json'))
    allowed=set(packet['allowed_paths']); OUT.mkdir(exist_ok=True)
    run=os.environ['GITHUB_RUN_ID']; monitor_run=packet['monitor_run_id']; runurl='https://github.com/pahlborn/agentarium/actions/runs/'+run
    post('## '+TASK+' — HOST_RECEIVED\n'+runurl+'\nAuthorized read-only device-switch guidance check for live handoff pilot. Real checkpoints and observed runtime steps follow. No implementation, merge or publication.')
    before={}; result=None; events=[]; last_post=0.; failure=None
    def checkpoint(kind,actor,recipient,title,ref):
        event={'schema':'agentarium.github-event.v1','id':'GH-'+run+'-'+kind,'project_id':'agentarium','run_id':monitor_run,'task_id':TASK,'actor':actor,'kind':kind,'recipient':recipient,'title':title,'occurred_at':now(),'source_evidence':'reported_checkpoint','source_tool_id':ref}
        captured=time.monotonic_ns()
        receipt=post('<!-- AGENTARIUM_EVENT_V1 -->\n```json\n'+json.dumps(event,ensure_ascii=False)+'\n```')
        events.append({'event':event,'comment_id':receipt['id'],'url':receipt['html_url'],'captured_ns':captured,'posted_ns':time.monotonic_ns(),'evidence_kind':'host_observed_checkpoint','process_alive_after_post':None})
        (OUT/'events.json').write_text(json.dumps(events,indent=2))

    with tempfile.TemporaryDirectory(prefix='ag-gh-forge-') as td:
        work=Path(td)
        def put(path,data):
            p=work/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data);before[path]=data
        for name in subprocess.check_output(['git','ls-tree','-r','--name-only',PRODUCT,'feld'],text=True).splitlines(): put(name,src(PRODUCT,name))
        for name in ('AGENTS.md','governance/agentarium-rulebook-v1.2.md','governance/agentarium-process-v1.2.md'):put(name,src(PRODUCT,name))
        for name in ('schicht.py','pages.py','resonanz-maschine.html','ereignisse-v1.json','ereignisse-v2.json','github-live.js'):
            path='previews/AG-VISUAL-005-feld/'+name;put(path,src(GENERATOR,path))
        for name in ('tests/AG-GH-LIVE-001-expiry.cjs','tests/AG-GH-LIVE-001.cjs'):
            put(name,src(GENERATOR,name))
        put('governance/AG-DEVICE-001-policy-v1.md',src(GENERATOR,'governance/AG-DEVICE-001-policy-v1.md'))
        for name in allowed:
            if name not in before: put(name,b'# Forge placeholder\n' if name.endswith(('.py','.md')) else b'/* Forge placeholder */\n')
        lines=[]
        import re
        for name in ('previews/AG-VISUAL-005-feld/schicht.py','previews/AG-VISUAL-005-feld/resonanz-maschine.html'):
            lines.append(name)
            lines.extend(str(i)+': '+line[:200] for i,line in enumerate(before[name].decode().splitlines(),1) if re.search(r'ARTEN|__agLauf|__agEreignis|__agStrom|FASSUNG|modusSetzen|function starten|requestAnimationFrame|STUECK|agKopf|agRechts|ringZeichnen|serviceWorker|function melden|stromZeile',line))
        put('HOST_CODE_MAP.txt',('\n'.join(lines)+'\n').encode())
        config={'coding-agent':{'description':'Forge read-only live handoff probe','prompt':profile.decode()+'\nTASK OVERRIDE: Peter requests best suitable model: opus/high. Effective Read/Edit only, placeholders exist. Read-only focused device-switch documentation check; edit only the handback file. No implementation. No tiny turn/cost limit. Edit only allowed paths.','model':'inherit','tools':['Read','Edit']}}
        cmd=['claude','--bare','-p',json.dumps(packet),'--agents',json.dumps(config),'--agent','coding-agent','--tools','Read,Edit','--allowedTools','Read,Edit','--disallowedTools','Bash,Agent,WebFetch,WebSearch,mcp__*','--permission-mode','dontAsk','--model','opus','--effort','high','--no-session-persistence','--output-format','stream-json','--verbose','--include-partial-messages']
        env=dict(os.environ)
        for k in ('GH_TOKEN','GITHUB_TOKEN','ACTIONS_RUNTIME_TOKEN'):env.pop(k,None)
        start=time.monotonic(); terminal=None
        checkpoint('handoff','atlas','forge','Atlas uebergibt den Fachauftrag an Forge (gemeldet)','dispatch:gha:'+run)
        proc=subprocess.Popen(cmd,cwd=td,env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,bufsize=1)
        try:
            with (OUT/'stream.jsonl').open('w') as raw:
                for line in proc.stdout:
                    raw.write(line);raw.flush()
                    try:d=json.loads(line)
                    except ValueError:continue
                    if d.get('type')=='result':result=d;terminal=time.monotonic_ns()
                    e=d.get('event',{});b=e.get('content_block',{})
                    if d.get('type')=='stream_event' and e.get('type')=='content_block_start' and b.get('type')=='tool_use' and b.get('name') in ('Read','Edit') and proc.poll() is None and time.monotonic()-last_post>=10 and len(events)<25:
                        last_post=time.monotonic(); seq=len(events)+1
                        event={'schema':'agentarium.github-event.v1','id':'GH-'+run+'-'+str(seq),'project_id':'agentarium','run_id':monitor_run,'task_id':TASK,'actor':'forge','kind':'progress','title':'Forge · '+b['name']+' · Arbeitsschritt '+str(seq),'occurred_at':now(),'source_evidence':'runtime_stream','source_tool_id':b.get('id')}
                        captured=time.monotonic_ns()
                        try:
                            receipt=post('<!-- AGENTARIUM_EVENT_V1 -->\n```json\n'+json.dumps(event,ensure_ascii=False)+'\n```')
                            events.append({'event':event,'comment_id':receipt['id'],'url':receipt['html_url'],'captured_ns':captured,'posted_ns':time.monotonic_ns(),'process_alive_after_post':proc.poll() is None})
                            (OUT/'events.json').write_text(json.dumps(events,indent=2))
                        except Exception as ex:
                            (OUT/'transport-errors.txt').open('a').write(type(ex).__name__+'\n')
            proc.wait(timeout=20)
            if proc.returncode or not result or result.get('is_error'):failure='Claude failed or result missing'
        finally:
            if proc.poll() is None:proc.terminate();proc.wait(timeout=20)
            (OUT/'stderr.txt').write_text(proc.stderr.read())
            if result:(OUT/'raw-result.json').write_text(json.dumps(result,indent=2));(OUT/'handback.md').write_text(str(result.get('result','')))
            after={str(p.relative_to(work)):p.read_bytes() for p in work.rglob('*') if p.is_file() and '.claude' not in p.parts}
            changed=sorted(n for n in set(before)|set(after) if before.get(n)!=after.get(n));unauthorized=[n for n in changed if n not in allowed];patch=''
            for name in changed:
                if name not in allowed:continue
                patch+=''.join(difflib.unified_diff(before.get(name,b'').decode().splitlines(True),after.get(name,b'').decode().splitlines(True),fromfile='a/'+name,tofile='b/'+name))
                p=OUT/'files'/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(after.get(name,b''))
            (OUT/'forge.patch').write_text(patch)
            if result and not failure and not unauthorized:
                try:
                    checkpoint('contribution','forge','atlas','Forge gibt seinen Fachbericht zurueck (gemeldet)','result:'+str(result.get('session_id','unknown')))
                except Exception as ex:
                    (OUT/'transport-errors.txt').open('a').write('contribution checkpoint: '+type(ex).__name__+'\n')
            meta={'task_id':TASK,'request_commit':head,'product_baseline':PRODUCT,'generator_baseline':GENERATOR,'run':runurl,'session_id':result.get('session_id') if result else None,'modelUsage':result.get('modelUsage') if result else None,'usage':result.get('usage') if result else None,'total_cost_usd':result.get('total_cost_usd') if result else None,'requested_model':'opus','requested_effort':'high','actual_effort':'unconfirmed','elapsed_seconds':time.monotonic()-start,'changed_paths':changed,'unauthorized_paths':unauthorized,'failure':failure,'source_returncode':proc.returncode,'terminal_observed_ns':terminal,'events_posted':len(events),'patch_sha256':hashlib.sha256(patch.encode()).hexdigest(),'tests_run':False,'product_published':False}
            (OUT/'metadata.json').write_text(json.dumps(meta,indent=2))
            post('## '+TASK+' — '+('RESULT_READY' if not failure and not unauthorized else 'BLOCKED')+' / STOPPED\n```json\n'+json.dumps(meta,indent=2)+'\n```\n'+str(result.get('result','') if result else '')[:4000])
            if failure or unauthorized:raise RuntimeError('Inspect preserved artifacts; no automatic repeat')

if __name__=='__main__':main()
