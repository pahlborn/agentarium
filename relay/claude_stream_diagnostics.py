"""Bounded stream consumer; external evidence contains metadata only."""
import collections
import hashlib
import json
import os
import selectors
import subprocess
import time
from pathlib import Path
from claude_cli_diagnostics import ClaudeCliFailure, diagnostic, classify_detail

def run_stream(cmd, *, cwd, env, timeout, progress=None, progress_interval=60, checkpoint_dir=None):
    checkpoint=Path(checkpoint_dir) if checkpoint_dir else None
    if checkpoint:checkpoint.mkdir(parents=True,exist_ok=True)
    started=time.monotonic()
    proc=subprocess.Popen(cmd,cwd=cwd,env=env,stdin=subprocess.DEVNULL,
                          stdout=subprocess.PIPE,stderr=subprocess.PIPE,start_new_session=True)
    sel=selectors.DefaultSelector()
    sel.register(proc.stdout,selectors.EVENT_READ,'stdout')
    sel.register(proc.stderr,selectors.EVENT_READ,'stderr')
    chunks={'stdout':bytearray(),'stderr':bytearray()}
    buf=bytearray();result=None;counts=collections.Counter();first_byte=None;first_event=None;last_event=None;sent=started
    timed_out=False
    partial=[]
    def save_text(value):
        if checkpoint:
            temp=checkpoint/'assistant-text.tmp'
            temp.write_text(value)
            temp.replace(checkpoint/'assistant-text.txt')
    def safe_terminal():
        if not isinstance(result,dict):return None
        safe={}
        for key in ('total_cost_usd','duration_ms','duration_api_ms','num_turns'):
            if isinstance(result.get(key),(int,float)):safe[key]=result[key]
        safe['is_error']=result.get('is_error') is True
        subtype=result.get('subtype')
        if subtype in ('success','error_max_budget_usd','error_max_turns','error_during_execution','error_max_structured_output_retries'):
            safe['subtype']=subtype
        usage=result.get('modelUsage',{})
        if isinstance(usage,dict):
            safe['model_usage']={name:{k:v for k,v in values.items() if isinstance(v,(int,float))} for name,values in usage.items() if isinstance(name,str) and name.startswith('claude-') and len(name)<80 and isinstance(values,dict)}
        sid=result.get('session_id')
        if isinstance(sid,str) and len(sid)<=80 and all(c in '0123456789abcdef-' for c in sid.lower()):safe['session']=sid
        return safe
    def evidence(kind):
        base=diagnostic(kind=kind,stdout=bytes(chunks['stdout']),stderr=bytes(chunks['stderr']),
                        elapsed_seconds=time.monotonic()-started,timeout_seconds=timeout,returncode=proc.poll())
        base['stream']={'first_byte_seconds':first_byte,'first_event_seconds':first_event,
                        'last_event_seconds':last_event,'event_counts':dict(counts)}
        base['partial_text_chars']=sum(map(len,partial))
        base['terminal_usage']=safe_terminal()
        if checkpoint:(checkpoint/'execution-metadata.json').write_text(json.dumps(base,indent=2))
        return base
    try:
        while sel.get_map():
            if time.monotonic()-started>=timeout:
                timed_out=True
                os.killpg(proc.pid,9)
                break
            for key,_ in sel.select(.2):
                data=os.read(key.fileobj.fileno(),65536)
                if not data:
                    sel.unregister(key.fileobj);continue
                chunks[key.data].extend(data)
                if sum(map(len,chunks.values()))>4_000_000:
                    os.killpg(proc.pid,9)
                    proc.wait()
                    raise ClaudeCliFailure(dict(evidence('CLI_EXIT'),detail='OUTPUT_LIMIT'))
                if key.data!='stdout':continue
                if first_byte is None:first_byte=round(time.monotonic()-started,3)
                buf.extend(data)
                while b'\n' in buf:
                    raw,_,tail=buf.partition(b'\n');buf=bytearray(tail)
                    try:item=json.loads(raw)
                    except (ValueError,UnicodeDecodeError):
                        counts['invalid_line']+=1;continue
                    if not isinstance(item,dict):counts['invalid_event']+=1;continue
                    kind=item.get('type','unknown')
                    # Whitelist labels so provider text cannot enter status evidence.
                    kind=kind if kind in ('system','assistant','user','result','stream_event','rate_limit_event') else 'other'
                    counts[kind]+=1
                    last_event=round(time.monotonic()-started,3)
                    if first_event is None:first_event=last_event
                    if kind=='result':result=item
                    if kind=='stream_event':
                        event=item.get('event',{})
                        if isinstance(event,dict):
                            delta=event.get('delta',{})
                            if isinstance(delta,dict) and delta.get('type')=='text_delta' and isinstance(delta.get('text'),str):
                                partial.append(delta['text']);save_text(''.join(partial))
                    if kind=='assistant':
                        message=item.get('message',{})
                        content=message.get('content',[]) if isinstance(message,dict) else []
                        texts=[b['text'] for b in content if isinstance(b,dict) and b.get('type')=='text' and isinstance(b.get('text'),str)] if isinstance(content,list) else []
                        if texts:
                            partial=[''.join(texts)];save_text(''.join(partial))
            if progress and time.monotonic()-sent>=progress_interval:
                try:
                    progress({'elapsed_seconds':round(time.monotonic()-started,1),'first_byte_seconds':first_byte,
                              'last_event_seconds':last_event,'event_counts':dict(counts)})
                except Exception:
                    counts['telemetry_failure']+=1
                sent=time.monotonic()
        if timed_out:
            proc.wait()
            raise ClaudeCliFailure(evidence('TIMEOUT'))
        proc.wait(timeout=5)
        if buf.strip():
            try:
                item=json.loads(buf)
                if isinstance(item,dict) and item.get('type')=='result':result=item
            except (ValueError,UnicodeDecodeError):counts['invalid_line']+=1
        if proc.returncode:
            ev=evidence('CLI_EXIT')
            if isinstance(result,dict):
                # Classify terminal errors rather than arbitrary streamed model text.
                detail=classify_detail(json.dumps({k:result.get(k) for k in ('subtype','errors','error')},ensure_ascii=False))
                if result.get('subtype')=='error_max_budget_usd':detail='BUDGET_EXCEEDED'
                ev['detail']=detail
                ev['signals']=[detail] if detail!='EXECUTION_FAILED' else []
                if checkpoint:(checkpoint/'execution-metadata.json').write_text(json.dumps(ev,indent=2))
            raise ClaudeCliFailure(ev)
        if not isinstance(result,dict):raise ClaudeCliFailure(evidence('INVALID_JSON'))
        return result,evidence('SUCCESS')
    finally:
        if proc.poll() is None:
            os.killpg(proc.pid,9);proc.wait()
        sel.close()
        proc.stdout.close();proc.stderr.close()

