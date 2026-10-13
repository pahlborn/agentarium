"""Bounded stream consumer; external evidence contains metadata only."""
import collections
import hashlib
import json
import os
import selectors
import subprocess
import time
from claude_cli_diagnostics import ClaudeCliFailure, diagnostic

def run_stream(cmd, *, cwd, env, timeout, progress=None):
    started=time.monotonic()
    proc=subprocess.Popen(cmd,cwd=cwd,env=env,stdin=subprocess.DEVNULL,
                          stdout=subprocess.PIPE,stderr=subprocess.PIPE,start_new_session=True)
    sel=selectors.DefaultSelector()
    sel.register(proc.stdout,selectors.EVENT_READ,'stdout')
    sel.register(proc.stderr,selectors.EVENT_READ,'stderr')
    chunks={'stdout':bytearray(),'stderr':bytearray()}
    buf=bytearray();result=None;counts=collections.Counter();first_byte=None;first_event=None;last_event=None;sent=started
    timed_out=False
    def evidence(kind):
        base=diagnostic(kind=kind,stdout=bytes(chunks['stdout']),stderr=bytes(chunks['stderr']),
                        elapsed_seconds=time.monotonic()-started,timeout_seconds=timeout,returncode=proc.poll())
        base['stream']={'first_byte_seconds':first_byte,'first_event_seconds':first_event,
                        'last_event_seconds':last_event,'event_counts':dict(counts)}
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
            if progress and time.monotonic()-sent>=60:
                progress({'elapsed_seconds':round(time.monotonic()-started,1),'first_byte_seconds':first_byte,
                          'last_event_seconds':last_event,'event_counts':dict(counts)})
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
        if proc.returncode:raise ClaudeCliFailure(evidence('CLI_EXIT'))
        if not isinstance(result,dict):raise ClaudeCliFailure(evidence('INVALID_JSON'))
        return result,evidence('SUCCESS')
    finally:
        if proc.poll() is None:
            os.killpg(proc.pid,9);proc.wait()
        sel.close()
        proc.stdout.close();proc.stderr.close()

