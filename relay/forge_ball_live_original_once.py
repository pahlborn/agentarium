#!/usr/bin/env python3
"""Bounded Forge patch for a local live connection to the pinned Original."""
import difflib
import hashlib
import json
import os
import subprocess
import tempfile
from pathlib import Path
from forge_one_shot import api, API
from claude_cli_diagnostics import run_json, ClaudeCliFailure

TASK='AG-BALL-LIVE-001-FORGE-ORIGINAL-V2'
BRANCH='agent/ball-live-concept-20261017'
BASE='d111b062770e32dbef0f9bb618a4923d88ff20be'
PROFILE='38d9747018bd4bfc5299a2dd9aeded9659337e77'
ALLOWED={'feld/index.html','feld/live.js','pilot/AG-BALL-LIVE-001/local_server.py','tests/AG-BALL-LIVE-001-local-live.cjs','pilot/AG-BALL-LIVE-001/README.md'}
OUT=Path('forge-ball-live-original-v2-output').resolve()

def source(ref,path):
    return subprocess.check_output(['git','show',ref+':'+path])

def post(body):
    return api(API+'/issues/2/comments',{'body':body})

def main():
    expected={'GITHUB_REPOSITORY':'pahlborn/agentarium','GITHUB_REPOSITORY_OWNER_ID':'277496791','GITHUB_ACTOR_ID':'277496791','GITHUB_EVENT_NAME':'push','GITHUB_REF_NAME':BRANCH}
    for k,v in expected.items():
        if os.environ.get(k)!=v: raise RuntimeError('Unauthorized context: '+k)
    head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
    activation=json.loads(source(head,'handoffs/AG-BALL-LIVE-001-forge-original-activate.json'))
    if activation!={'task_id':TASK,'authorized':True,'mode':'bounded local Original live prototype'}: raise RuntimeError('Activation mismatch')
    for page in range(1,101):
        batch=api(API+'/issues/2/comments?per_page=100&page='+str(page))
        if not isinstance(batch,list): raise RuntimeError('History unavailable')
        if any(TASK in str(c.get('body','')) for c in batch): raise RuntimeError('Execution exists; no automatic repeat')
        if len(batch)<100: break
    else: raise RuntimeError('History incomplete')
    profile=source(head,'.claude/agents/coding-agent.md')
    if hashlib.sha1(b'blob '+str(len(profile)).encode()+b'\0'+profile).hexdigest()!=PROFILE: raise RuntimeError('Profile mismatch')
    packet=json.loads(source(head,'handoffs/AG-BALL-LIVE-001-forge-original-request-v2.json'))
    if packet['task_id']!=TASK: raise RuntimeError('Task mismatch')
    if not os.environ.get('ANTHROPIC_API_KEY'): raise RuntimeError('No API key')
    OUT.mkdir(exist_ok=True)
    run='https://github.com/pahlborn/agentarium/actions/runs/'+os.environ['GITHUB_RUN_ID']
    post('## '+TASK+' — HOST_RECEIVED\n'+run+'\nBounded Forge implementation against Original '+BASE+'. Role '+PROFILE+'. Requested opus/high; no automatic retry. No deployment or product publication.')
    config={'coding-agent':{'description':'Forge bounded local live integration on Original','prompt':profile.decode()+'\nTASK OVERRIDE: opus/high requested for this task under Peters best-model mandate. Effective tools Read/Edit only, matching observed runtime. Host prepared new allowed files with inert placeholders so Edit suffices. No tiny turn/cost cap; persistent defaults unchanged. Edit only explicitly allowed files.','model':'inherit','tools':['Read','Edit']}}
    cmd=['claude','--bare','-p',json.dumps(packet,ensure_ascii=False),'--agents',json.dumps(config),'--agent','coding-agent','--tools','Read,Edit','--allowedTools','Read,Edit','--disallowedTools','Bash,Agent,WebFetch,WebSearch,mcp__*','--permission-mode','dontAsk','--model','opus','--effort','high','--no-session-persistence','--output-format','json']
    env=dict(os.environ)
    for k in ('GH_TOKEN','GITHUB_TOKEN','ACTIONS_RUNTIME_TOKEN'): env.pop(k,None)
    result=execution=failure=None
    with tempfile.TemporaryDirectory(prefix='forge-ball-live-original-') as tmp:
        work=Path(tmp)
        names=subprocess.check_output(['git','ls-tree','-r','--name-only',BASE,'feld'],text=True).splitlines()
        before={}
        for name in names:
            raw=source(BASE,name);before[name]=raw
            dest=work/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(raw)
        for name in ('AGENTS.md','governance/agentarium-rulebook-v1.2.md','governance/agentarium-process-v1.2.md','governance/product-development-practice-v1.md','specifications/AG-BALL-LIVE-001-mvp-spezifikation-v3.md','handoffs/AG-BALL-LIVE-001-forge-e1-handback-v1.md','handoffs/AG-BALL-LIVE-001-forge-e1-abschluss-v1.md'):
            raw=source(head,name);before[name]=raw
            dest=work/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(raw)
        for name in sorted(ALLOWED-{'feld/index.html'}):
            dest=work/name;dest.parent.mkdir(parents=True,exist_ok=True)
            dest.write_text('# Forge implementation placeholder\n' if name.endswith(('.py','.md')) else '/* Forge implementation placeholder */\n')
        import re
        index=(work/'feld/index.html').read_text()
        markers=re.compile(r'__agLauf|__agEreignis|__agStrom|ARTEN|modusSetzen|FASSUNG|STUECK|serviceWorker|mvp=|agMvp|function wirf|function tunZeigen|function bereitschaft|function auftragFertig|requestAnimationFrame|function abspielen|function starten|MODUS')
        code_map='Read-only host index of ORIGINAL d111, exact source line numbers. Use Read with offsets on feld/index.html.\n'
        code_map+='\n'.join(str(i)+': '+line[:240] for i,line in enumerate(index.splitlines(),1) if markers.search(line))+'\n'
        (work/'HOST_CODE_MAP.txt').write_text(code_map)
        before['HOST_CODE_MAP.txt']=code_map.encode()
        try:
            result,execution=run_json(cmd,cwd=tmp,env=env,timeout=1800)
            (OUT/'raw-result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
            (OUT/'handback.md').write_text(str(result.get('result','')))
        except ClaudeCliFailure as exc:
            failure=exc.evidence
        finally:
            after={str(p.relative_to(work)):p.read_bytes() for p in work.rglob('*') if p.is_file() and '.claude' not in p.relative_to(work).parts}
            changed=sorted(n for n in set(before)|set(after) if before.get(n)!=after.get(n))
            unauthorized=[n for n in changed if n not in ALLOWED]
            patch=''
            for name in changed:
                if name not in ALLOWED: continue
                patch+=''.join(difflib.unified_diff(before.get(name,b'').decode().splitlines(True),after.get(name,b'').decode().splitlines(True),fromfile='a/'+name,tofile='b/'+name))
                dest=OUT/'files'/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(after.get(name,b''))
            (OUT/'forge.patch').write_text(patch)
            placeholders=any(b'Forge implementation placeholder' in after.get(n,b'') or not after.get(n,b'').strip() for n in ALLOWED-{'feld/index.html'})
            ok=bool(result and not result.get('is_error') and result.get('result') and not failure and not unauthorized and changed and not placeholders)
            meta={'task_id':TASK,'request_commit':head,'product_baseline':BASE,'role_blob':PROFILE,'run':run,'requested_model':'opus','requested_effort':'high','actual_reasoning':'unconfirmed','session_id':result.get('session_id') if result else None,'modelUsage':result.get('modelUsage') if result else None,'usage':result.get('usage') if result else None,'total_cost_usd':result.get('total_cost_usd') if result else None,'execution':execution,'failure':failure,'changed_paths':changed,'unauthorized_paths':unauthorized,'patch_sha256':hashlib.sha256(patch.encode()).hexdigest(),'tests_run':False,'product_published':False}
            (OUT/'metadata.json').write_text(json.dumps(meta,indent=2))
            post('## '+TASK+' — '+('RESULT_READY' if ok else 'BLOCKED')+' / STOPPED\n```json\n'+json.dumps(meta,indent=2)+'\n```\n'+str(result.get('result','') if result else '')[:5000]+'\nFull patch and raw result in workflow artifact forge-ball-live-original-output.')
            if not ok: raise RuntimeError('Inspect preserved result; no automatic retry')

if __name__=='__main__': main()
