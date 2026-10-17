#!/usr/bin/env python3
"""One real Claude stream -> local SSE -> already-open Original browser proof."""
import hashlib,json,os,selectors,secrets,subprocess,tempfile,threading,time,urllib.request
from pathlib import Path
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from forge_one_shot import api,API

TASK='AG-BALL-LIVE-001-ORIGINAL-REAL-VERIFY-V1'
CANDIDATE='c7a8da04d9b06d83edcd110f210c0cf84d4aa8ba'
PROFILE='38d9747018bd4bfc5299a2dd9aeded9659337e77'
OUT=Path('ball-original-real-output').resolve()

def main():
    for k,v in {'GITHUB_REPOSITORY':'pahlborn/agentarium','GITHUB_REPOSITORY_OWNER_ID':'277496791','GITHUB_ACTOR_ID':'277496791','GITHUB_EVENT_NAME':'push','GITHUB_REF_NAME':'agent/ball-live-concept-20261017'}.items():
        if os.environ.get(k)!=v: raise RuntimeError('Unauthorized context '+k)
    for page in range(1,101):
        batch=api(API+'/issues/2/comments?per_page=100&page='+str(page))
        if any(TASK in str(c.get('body','')) for c in batch): raise RuntimeError('Already executed; no automatic repeat')
        if len(batch)<100: break
    else: raise RuntimeError('Incomplete history')
    root=Path.cwd()
    app=root/'app'
    actual=subprocess.check_output(['git','rev-parse','HEAD'],cwd=app,text=True).strip()
    if actual!=CANDIDATE: raise RuntimeError('Wrong candidate')
    profile=(root/'.claude/agents/coding-agent.md').read_bytes()
    if hashlib.sha1(b'blob '+str(len(profile)).encode()+b'\0'+profile).hexdigest()!=PROFILE: raise RuntimeError('Role mismatch')
    if not os.environ.get('ANTHROPIC_API_KEY'): raise RuntimeError('Missing API key')
    OUT.mkdir(exist_ok=True)
    run='https://github.com/pahlborn/agentarium/actions/runs/'+os.environ['GITHUB_RUN_ID']
    api(API+'/issues/2/comments',{'body':'## '+TASK+' — HOST_RECEIVED\n'+run+'\nOne authorized real-source verification after synthetic component test. Candidate '+CANDIDATE+'. Requested opus/high, role '+PROFILE+'. No deployment or publication.'})
    token=secrets.token_hex(24)
    clean=dict(os.environ)
    for k in ('GH_TOKEN','GITHUB_TOKEN','ACTIONS_RUNTIME_TOKEN','ANTHROPIC_API_KEY'): clean.pop(k,None)
    serverenv=dict(clean,BALL_INGEST_TOKEN=token)
    server=subprocess.Popen(['python3',str(app/'pilot/AG-BALL-LIVE-001/local_server.py'),'--port','0','--log-file',str(OUT/'server-events.jsonl')],env=serverenv,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
    proc=browser=None
    terminal_ns=None
    result=None
    source_event=None
    ingress=None
    failure=None
    class Witness(BaseHTTPRequestHandler):
        def do_GET(self):
            d={'monotonic_ns':time.monotonic_ns(),'alive':proc is not None and proc.poll() is None,'terminal_seen':terminal_ns is not None,'pid':proc.pid if proc else None}
            raw=json.dumps(d).encode();self.send_response(200);self.send_header('Content-Length',str(len(raw)));self.end_headers();self.wfile.write(raw)
        def log_message(self,*a): pass
    witness=ThreadingHTTPServer(('127.0.0.1',0),Witness)
    threading.Thread(target=witness.serve_forever,daemon=True).start()
    try:
        sel=selectors.DefaultSelector();sel.register(server.stdout,selectors.EVENT_READ)
        if not sel.select(15): raise RuntimeError('Local server READY timeout')
        ready=json.loads(server.stdout.readline());sel.close()
        if ready.get('event')!='READY': raise RuntimeError('Local server failed')
        (OUT/'server-ready.json').write_text(json.dumps(ready,indent=2))
        event_id='REAL-'+os.environ['GITHUB_RUN_ID']+'-1'
        benv=dict(clean,BALL_REAL_OUT=str(OUT),BALL_VIEW_URL=ready['url'],BALL_REAL_EVENT_ID=event_id,BALL_WITNESS_URL='http://127.0.0.1:'+str(witness.server_port))
        browser=subprocess.Popen(['node',str(root/'relay/ball_original_real_browser.cjs')],env=benv,stdout=(OUT/'browser-stdout.log').open('w'),stderr=(OUT/'browser-stderr.log').open('w'))
        until=time.monotonic()+45
        while not (OUT/'browser-ready.json').exists():
            if browser.poll() is not None or time.monotonic()>until: raise RuntimeError('Browser did not become ready')
            time.sleep(.05)
        browser_ready_ns=time.monotonic_ns()
        cfg={'coding-agent':{'description':'Forge real inspection of candidate source for E2E proof','prompt':profile.decode()+'\nTask override opus/high. Effective tools Read only. Inspect actual generated files, no edits or manufactured progress.','model':'inherit','tools':['Read']}}
        prompt='Read-only real inspection '+TASK+'. Read pilot/AG-BALL-LIVE-001/README.md, feld/live.js and pilot/AG-BALL-LIVE-001/local_server.py using Read. Examine how a real tool-use event is mapped and how same-origin SSE reconnects. Return maximum 350 words with one concrete residual integration risk and exact file reference. No edits, no tests by you, no delays, no manufactured activity messages.'
        cmd=['claude','--bare','-p',prompt,'--agents',json.dumps(cfg),'--agent','coding-agent','--tools','Read','--allowedTools','Read','--disallowedTools','Bash,Edit,Write,Agent,mcp__*','--permission-mode','dontAsk','--model','opus','--effort','high','--no-session-persistence','--output-format','stream-json','--verbose','--include-partial-messages']
        env=dict(os.environ)
        for k in ('GH_TOKEN','GITHUB_TOKEN','ACTIONS_RUNTIME_TOKEN','BALL_INGEST_TOKEN'):env.pop(k,None)
        proc=subprocess.Popen(cmd,cwd=app,env=env,stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=(OUT/'claude-stderr.log').open('wb'))
        source_start_ns=time.monotonic_ns()
        sel=selectors.DefaultSelector();sel.register(proc.stdout,selectors.EVENT_READ)
        buf=bytearray();deadline=time.monotonic()+900
        while sel.get_map():
            if time.monotonic()>deadline: raise RuntimeError('Real-source deadline')
            for key,_ in sel.select(.1):
                data=os.read(key.fileobj.fileno(),65536)
                if not data: sel.unregister(key.fileobj);continue
                buf.extend(data)
                while b'\n' in buf:
                    raw,_,tail=buf.partition(b'\n');buf=bytearray(tail)
                    try: item=json.loads(raw)
                    except ValueError:continue
                    if item.get('type')=='result':
                        terminal_ns=time.monotonic_ns();result=item
                        (OUT/'raw-result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
                    if source_event is not None or item.get('type')!='stream_event':continue
                    e=item.get('event',{});b=e.get('content_block',{})
                    if e.get('type')!='content_block_start' or b.get('type')!='tool_use' or b.get('name')!='Read':continue
                    capture_ns=time.monotonic_ns()
                    source_event={'type':'stream_event','event':{'type':'content_block_start','content_block':{'type':'tool_use','name':b['name'],'id':b.get('id')}}}
                    (OUT/'source-stream-metadata.json').write_text(json.dumps(source_event,indent=2))
                    body={'id':event_id,'run_id':'gha:'+os.environ['GITHUB_RUN_ID'],'actor':'forge','kind':'progress','title':'Forge liest Kandidatcode · echte Laufzeitaktion','recipient':None,'source_evidence':'runtime_stream','source_tool_id':b['id']}
                    req=urllib.request.Request(ready['base']+'/ingest',data=json.dumps(body).encode(),headers={'Content-Type':'application/json','Authorization':'Bearer '+token},method='POST')
                    with urllib.request.urlopen(req,timeout=10) as resp: ingress={'status':resp.status,'response':json.load(resp),'received_by_host_ns':time.monotonic_ns(),'source_captured_ns':capture_ns,'body':body,'process_alive_after_ingest':proc.poll() is None}
                    (OUT/'ingress.json').write_text(json.dumps(ingress,indent=2))
        proc.wait(timeout=10);exit_ns=time.monotonic_ns();sel.close()
        browser.wait(timeout=25)
        shot=json.loads((OUT/'browser-real-result.json').read_text()) if (OUT/'browser-real-result.json').exists() else {}
        passed=bool(shot.get('verdict')=='PASS' and result and not result.get('is_error') and proc.returncode==0 and browser.returncode==0 and ingress and ingress['process_alive_after_ingest'] and browser_ready_ns<source_start_ns<ingress['source_captured_ns']<shot['before']['monotonic_ns']<=shot['after']['monotonic_ns']<terminal_ns<=exit_ns)
        meta={'task_id':TASK,'candidate_commit':CANDIDATE,'run':run,'event_id':event_id,'browser_ready_monotonic_ns':browser_ready_ns,'source_start_monotonic_ns':source_start_ns,'terminal_observed_monotonic_ns':terminal_ns,'exit_observed_monotonic_ns':exit_ns,'session_id':result.get('session_id') if result else None,'modelUsage':result.get('modelUsage') if result else None,'usage':result.get('usage') if result else None,'total_cost_usd':result.get('total_cost_usd') if result else None,'requested_model':'opus','requested_effort':'high','actual_reasoning':'unconfirmed','source_returncode':proc.returncode,'browser_returncode':browser.returncode,'verdict':'PASS' if passed else 'FAIL','ipad_tested':False,'hosted_path_tested':False,'product_published':False}
        (OUT/'metadata.json').write_text(json.dumps(meta,indent=2))
        api(API+'/issues/2/comments',{'body':'## '+TASK+' — '+meta['verdict']+' / STOPPED\n```json\n'+json.dumps(meta,indent=2)+'\n```\nExact screenshot, source correlation and local Original evidence are in workflow artifact ball-original-live-verification. No iPad/hosted result.'})
        if not passed: raise RuntimeError('Real-source browser proof failed')
    except Exception as exc:
        (OUT/'failure.json').write_text(json.dumps({'task_id':TASK,'error':str(exc),'type':type(exc).__name__},indent=2))
        raise
    finally:
        for child in (browser,proc,server):
            if child is not None and child.poll() is None:
                child.terminate()
                try:child.wait(timeout=10)
                except subprocess.TimeoutExpired:child.kill();child.wait()
        witness.shutdown()

if __name__=='__main__':main()
