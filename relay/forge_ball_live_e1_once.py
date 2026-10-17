#!/usr/bin/env python3
"""One Forge source experiment: real CLI tool event -> loopback HTTP before exit."""
import hashlib
import json
import os
import selectors
import subprocess
import tempfile
import threading
import time
import urllib.request
from collections import Counter
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from forge_one_shot import api, API

TASK = 'AG-BALL-LIVE-001-FORGE-E1-V1'
BRANCH = 'agent/ball-live-concept-20261017'
PROFILE = '38d9747018bd4bfc5299a2dd9aeded9659337e77'
BASELINE = 'd111b062770e32dbef0f9bb618a4923d88ff20be'
OUT = Path('forge-ball-live-e1-output').resolve()

def source(ref, path):
    return subprocess.check_output(['git', 'show', ref + ':' + path])

def post(body):
    return api(API + '/issues/2/comments', {'body': body})

def main():
    for key, expected in {'GITHUB_REPOSITORY':'pahlborn/agentarium',
        'GITHUB_REPOSITORY_OWNER_ID':'277496791', 'GITHUB_ACTOR_ID':'277496791',
        'GITHUB_EVENT_NAME':'push', 'GITHUB_REF_NAME':BRANCH}.items():
        if os.environ.get(key) != expected:
            raise RuntimeError('Unauthorized context: ' + key)
    head = subprocess.check_output(['git','rev-parse','HEAD'], text=True).strip()
    activation = json.loads(source(head, 'handoffs/AG-BALL-LIVE-001-forge-e1-activate.json'))
    if activation != {'task_id':TASK, 'authorized':True, 'mode':'one real source experiment'}:
        raise RuntimeError('Activation mismatch')
    for page in range(1,101):
        comments = api(API + '/issues/2/comments?per_page=100&page=' + str(page))
        if not isinstance(comments,list):
            raise RuntimeError('History unavailable')
        if any(TASK in str(c.get('body','')) for c in comments):
            raise RuntimeError('Existing execution: inspect, never automatically repeat')
        if len(comments)<100:
            break
    else:
        raise RuntimeError('History incomplete')
    profile = source(head, '.claude/agents/coding-agent.md')
    if hashlib.sha1(b'blob '+str(len(profile)).encode()+b'\0'+profile).hexdigest()!=PROFILE:
        raise RuntimeError('Role mismatch')
    if not os.environ.get('ANTHROPIC_API_KEY'):
        raise RuntimeError('API key unavailable')
    OUT.mkdir(exist_ok=True)
    run = 'https://github.com/pahlborn/agentarium/actions/runs/' + os.environ['GITHUB_RUN_ID']
    post('## '+TASK+' — HOST_RECEIVED\nOne authorized real Forge source experiment.\n'+run+
         '\nRole blob '+PROFILE+'; product baseline '+BASELINE+
         '\nRequested opus/high (task override); real stream event -> loopback HTTP. No product edits or deployment.')
    received=[]
    proc=None
    class Receiver(BaseHTTPRequestHandler):
        def do_POST(self):
            body=json.loads(self.rfile.read(int(self.headers['Content-Length'])))
            body['received_monotonic_ns']=time.monotonic_ns()
            body['process_alive_at_receipt']=proc is not None and proc.poll() is None
            received.append(body)
            (OUT/'receiver-events.json').write_text(json.dumps(received,indent=2))
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'accepted')
        def log_message(self,*args):
            pass
    server=ThreadingHTTPServer(('127.0.0.1',0),Receiver)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    counts=Counter()
    result=None
    terminal_ns=None
    failure=None
    sent=False
    started=time.monotonic_ns()
    role_prompt=profile.decode()+'\nTASK OVERRIDE: Peter requested the best suitable LLM; use opus/high for this one source-feasibility proof. Read-only tools. No maxTurns=8 truncation for this task. Persistent profile remains unchanged.'
    cfg={'coding-agent':{'description':'Forge real live-source proof and F0 inspection',
        'prompt':role_prompt,'tools':['Read','Glob','Grep'],'model':'inherit'}}
    prompt=(TASK+'. You are Forge. Peter authorized one real source experiment. '
        'Use Read to inspect AGENTS.md and governance/agentarium-rulebook-v1.2.md, then use Read on '
        'external/published-d111/feld/index.html around __agEreignis, __agLauf and __agStrom, and external/published-d111/feld/sw.js. '
        'These are real architectural reconnaissance actions; the host observes your tool-use start from stream-json and forwards metadata to a local HTTP receiver while your process is alive. '
        'Do not manufacture progress text or sleep. Do not claim that you tested the host. '
        'Return a concise German CA_FEASIBILITY handback, maximum 600 words: exact baseline d111b062770e32dbef0f9bb618a4923d88ff20be, '
        'what existing hooks can be reused, the critical limitation of this isolated source proof versus full original/iPad live integration, '
        'and one next technical action. No edits, no implementation, no deployment. Read-only. Tests NOT_RUN by you.')
    cmd=['claude','--bare','-p',prompt,'--agents',json.dumps(cfg),'--agent','coding-agent',
        '--tools','Read,Glob,Grep','--allowedTools','Read,Glob,Grep',
        '--disallowedTools','Bash,Edit,Write,Agent,WebFetch,WebSearch,mcp__*',
        '--permission-mode','dontAsk','--model','opus','--effort','high',
        '--no-session-persistence','--output-format','stream-json','--verbose','--include-partial-messages']
    env=dict(os.environ)
    for key in ('GH_TOKEN','GITHUB_TOKEN','ACTIONS_RUNTIME_TOKEN'):
        env.pop(key,None)
    with tempfile.TemporaryDirectory(prefix='forge-ball-live-e1-') as tmp:
        work=Path(tmp)
        for name in ('AGENTS.md','governance/agentarium-rulebook-v1.2.md','governance/agentarium-process-v1.2.md'):
            dest=work/name
            dest.parent.mkdir(parents=True,exist_ok=True)
            dest.write_bytes(source(head,name))
        for name in ('feld/index.html','feld/sw.js'):
            dest=work/'external/published-d111'/name
            dest.parent.mkdir(parents=True,exist_ok=True)
            dest.write_bytes(source(BASELINE,name))
        before={str(p.relative_to(work)):hashlib.sha256(p.read_bytes()).hexdigest() for p in work.rglob('*') if p.is_file()}
        proc=subprocess.Popen(cmd,cwd=tmp,env=env,stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
        sel=selectors.DefaultSelector()
        sel.register(proc.stdout,selectors.EVENT_READ,'stdout')
        sel.register(proc.stderr,selectors.EVENT_READ,'stderr')
        buf=bytearray()
        stderr=bytearray()
        try:
            while sel.get_map():
                if time.monotonic_ns()-started>1800*1_000_000_000:
                    raise TimeoutError('Runtime experiment exceeded 30 minutes')
                for key,_ in sel.select(.2):
                    data=os.read(key.fileobj.fileno(),65536)
                    if not data:
                        sel.unregister(key.fileobj)
                        continue
                    if key.data=='stderr':
                        stderr.extend(data)
                        continue
                    buf.extend(data)
                    while b'\n' in buf:
                        raw,_,tail=buf.partition(b'\n')
                        buf=bytearray(tail)
                        try:
                            item=json.loads(raw)
                        except ValueError:
                            counts['invalid_line']+=1
                            continue
                        kind=item.get('type','unknown')
                        counts[kind if kind in ('system','assistant','user','result','stream_event','rate_limit_event') else 'other']+=1
                        if kind=='result':
                            terminal_ns=time.monotonic_ns()
                            result=item
                            # Persist the complete final model result before any validation.
                            (OUT/'raw-result.json').write_text(json.dumps(item,ensure_ascii=False,indent=2))
                            (OUT/'handback.md').write_text(str(item.get('result','')))
                        if kind=='stream_event' and not sent:
                            event=item.get('event',{})
                            block=event.get('content_block',{})
                            if event.get('type')=='content_block_start' and block.get('type')=='tool_use' and block.get('name') in ('Read','Glob','Grep'):
                                event_id=TASK+'-event-1'
                                evidence={'id':event_id,'run_id':'gha:'+os.environ['GITHUB_RUN_ID'],
                                    'actor':'forge','kind':'progress','recipient':None,
                                    'title':'Forge startet eine echte Quellenprüfung',
                                    'source_evidence':'runtime_stream',
                                    'source_type':'content_block_start.tool_use',
                                    'tool_name':block['name'], 'source_tool_id':block.get('id'),
                                    'captured_monotonic_ns':time.monotonic_ns()}
                                (OUT/'source-event.json').write_text(json.dumps(evidence,indent=2))
                                request=urllib.request.Request('http://127.0.0.1:'+str(server.server_port),
                                    data=json.dumps(evidence).encode(),headers={'Content-Type':'application/json'},method='POST')
                                with urllib.request.urlopen(request,timeout=5) as response:
                                    if response.status!=200:
                                        raise RuntimeError('Receiver failed')
                                sent=True
            proc.wait(timeout=10)
        except Exception as exc:
            failure=type(exc).__name__+': '+str(exc)
        finally:
            if proc.poll() is None:
                proc.terminate()
                try:
                    proc.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    proc.kill()
                    proc.wait()
            exit_ns=time.monotonic_ns()
            sel.close()
            server.shutdown()
            after={str(p.relative_to(work)):hashlib.sha256(p.read_bytes()).hexdigest() for p in work.rglob('*') if p.is_file()}
            changes=[p for p in set(before)|set(after) if before.get(p)!=after.get(p)]
            event=received[0] if received else None
            passed=bool(event and event['process_alive_at_receipt'] and terminal_ns and
                event['received_monotonic_ns']<terminal_ns<=exit_ns and result and not result.get('is_error') and proc.returncode==0 and not failure and not changes)
            meta={'task_id':TASK,'request_commit':head,'product_baseline':BASELINE,'role_blob':PROFILE,
                'run':run,'cli_version':subprocess.check_output(['claude','--version'],text=True).strip(),
                'requested_model':'opus','requested_effort':'high','actual_reasoning':'unconfirmed',
                'session_id':result.get('session_id') if result else None,
                'modelUsage':result.get('modelUsage') if result else None,'usage':result.get('usage') if result else None,
                'total_cost_usd':result.get('total_cost_usd') if result else None,
                'event_counts':dict(counts),'terminal_monotonic_ns':terminal_ns,'process_exit_observed_monotonic_ns':exit_ns,
                'receipt_before_terminal_seconds':(terminal_ns-event['received_monotonic_ns'])/1e9 if event and terminal_ns else None,
                'returncode':proc.returncode,'failure':failure,'changed_paths':changes,
                'stderr_bytes':len(stderr),'stderr_sha256':hashlib.sha256(stderr).hexdigest(),
                'E1_verdict':'PASS' if passed else 'BLOCKED','original_ui_tested':False,'ipad_tested':False,
                'product_published':False,'limits':'Observed tool-use start -> local loopback HTTP only; no hosted transport, rendered UI, full telemetry or tool success claim.'}
            (OUT/'metadata.json').write_text(json.dumps(meta,indent=2))
            post('## '+TASK+' — '+('E1_PASS' if passed else 'BLOCKED')+' / STOPPED\n```json\n'+json.dumps(meta,indent=2)+'\n```\n'+str(result.get('result','') if result else '')[:4500]+'\nFull evidence in workflow artifact forge-ball-live-e1-output.')
            if not passed:
                raise RuntimeError('E1 not proven; evidence preserved, no automatic retry')

if __name__=='__main__':
    main()
