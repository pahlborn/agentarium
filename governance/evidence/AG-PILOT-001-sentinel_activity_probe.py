#!/usr/bin/env python3
import importlib.util
import json
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
AP = ROOT / 'pilot/AG-PILOT-001/activity.py'
LP = ROOT / 'pilot/AG-PILOT-001/local_transport.py'
FIX = ROOT / 'fixtures/AG-VISUAL-005-beispiele-v2-1/11-snapshot-plus-tail.json'
spec = importlib.util.spec_from_file_location('activity', AP)
activity = importlib.util.module_from_spec(spec); spec.loader.exec_module(activity)

passes = 0; fails = 0
def check(name, cond, detail=''):
    global passes, fails
    if cond:
        passes += 1; print('PASS', name, detail)
    else:
        fails += 1; print('FAIL', name, detail)

def obs(i, at, signal='stream_sample', agent='Forge', sid='s1', tid='t1', **kw):
    d = dict(id=i, agent=agent, session_id=sid, task_id=tid,
             observed_at=at, evidence_ref='ev#'+i, signal=signal)
    d.update(kw); return d

base = obs('o1','2026-10-16T10:00:00Z', event_counts={'stream_event':3}, last_event_seconds=10, elapsed_seconds=12)
inc = obs('o2','2026-10-16T10:00:01Z', event_counts={'stream_event':5}, last_event_seconds=11, elapsed_seconds=13)
rows = activity.derive([base,inc], now='2026-10-16T10:00:02Z', fresh_ms=5000)
r = next(x for x in rows if x['agent']=='forge' and x['session_id']=='s1')
check('A1 positive delta => working_observed', r['state']=='working_observed' and r['delta']['counters']=={'stream_event':2} and r['remaining_valid_ms']==2000, json.dumps(r,ensure_ascii=False))

same = obs('o3','2026-10-16T10:00:01Z', event_counts={'stream_event':3}, last_event_seconds=10, elapsed_seconds=13)
noise = [obs('h1','2026-10-16T10:00:02Z','host_received'), obs('h2','2026-10-16T10:00:03Z','transport_heartbeat')]
rows = activity.derive([base,same]+noise, now='2026-10-16T10:00:04Z', fresh_ms=5000)
r = next(x for x in rows if x['agent']=='forge' and x['session_id']=='s1')
check('A2 no delta/host/heartbeat => unknown', r['state']=='unknown', json.dumps(r,ensure_ascii=False))

timer1 = obs('tm1','2026-10-16T10:00:00Z', event_counts={'progress_timer':1}, last_event_seconds=0, elapsed_seconds=1)
timer2 = obs('tm2','2026-10-16T10:00:01Z', event_counts={'progress_timer':2}, last_event_seconds=0, elapsed_seconds=2)
rows = activity.derive([timer1,timer2], now='2026-10-16T10:00:01Z', fresh_ms=5000)
r = next(x for x in rows if x['agent']=='forge' and x['session_id']=='s1')
check('A2 telemetry-only counter must not prove work', r['state']=='unknown', json.dumps(r,ensure_ascii=False))

rows = activity.derive([base,inc], now='2026-10-16T10:00:20Z', fresh_ms=5000)
r = next(x for x in rows if x['agent']=='forge' and x['session_id']=='s1')
check('A3 stale work => unknown', r['state']=='unknown', json.dumps(r,ensure_ascii=False))
live = activity.build_response(None, None, now='2026-10-16T10:00:20Z')
archive_doc = activity.build_response(None, None, at='2026-10-16T10:00:05Z')
check('A3 LIVE vs ARCHIVE clock', live['mode']=='LIVE' and live['replay_at'] is None and archive_doc['mode']=='ARCHIVE' and archive_doc['now']=='2026-10-16T10:00:05Z' and archive_doc['provenance']['no_aging_by_wall_clock'] is True)

hold = obs('w1','2026-10-16T10:00:02Z','source_waiting',reason='review')
block = obs('b1','2026-10-16T10:00:02Z','source_blocked',sid='s2',reason='quota')
rows = activity.derive([hold,block], now='2026-10-16T10:00:03Z', fresh_ms=5000)
by = {(x['session_id'],x['state'],x['reason']) for x in rows if x['agent']=='forge'}
check('A4 explicit hold and session isolation', ('s1','waiting','review') in by and ('s2','blocked','quota') in by, repr(by))

rows = activity.derive([base,inc,hold], now='2026-10-16T10:00:10Z', fresh_ms=3000)
r = next(x for x in rows if x['agent']=='forge' and x['session_id']=='s1')
check('A4 stale hold does not revive old work', r['state']=='unknown', json.dumps(r,ensure_ascii=False))
resume = obs('rs1','2026-10-16T10:00:03Z','source_resumed')
rows = activity.derive([base,inc,hold,resume], now='2026-10-16T10:00:03Z', fresh_ms=5000)
r = next(x for x in rows if x['agent']=='forge' and x['session_id']=='s1')
check('A4 resume without new work stays unknown', r['state']=='unknown', json.dumps(r,ensure_ascii=False))

stop = obs('z1','2026-10-16T10:00:02Z','execution_stopped',outcome='success')
after = obs('o4','2026-10-16T10:00:03Z', event_counts={'msg':9}, last_event_seconds=12, elapsed_seconds=14)
rows = activity.derive([base,inc,stop,after], now='2026-10-16T10:00:04Z', fresh_ms=5000)
r = next(x for x in rows if x['agent']=='forge' and x['session_id']=='s1')
check('A5 terminal absorbing; no fachlich Done', r['state']=='stopped' and r['outcome']=='success' and 'erledigt' in r['reason'] and any('terminal' in d for d in r['diagnostics']), json.dumps(r,ensure_ascii=False))

future = obs('f1','2026-10-16T10:01:00Z','source_blocked',reason='future')
malformed = {'agent':'Forge'}
rows = activity.derive([future,malformed], now='2026-10-16T10:00:00Z', fresh_ms=5000)
r = next(x for x in rows if x['agent']=='forge')
check('edge future/malformed rejected', r['state']=='unknown' and len(r['diagnostics'])==2, json.dumps(r,ensure_ascii=False))

rows = activity.derive([], now='2026-10-16T10:00:00Z', fresh_ms=5000)
check('default eight agents unknown', [x['agent'] for x in rows]==list(activity.ROSTER) and all(x['state']=='unknown' and x['remaining_valid_ms']==0 for x in rows), repr([x['agent'] for x in rows]))

with tempfile.TemporaryDirectory() as td:
    td=Path(td)
    fixture=json.loads(FIX.read_text())['daten']
    inp=td/'probe.json'; inp.write_text(json.dumps({'snapshot':fixture['schnappschuss'],'events':fixture['tail_umschlaege']}))
    adoc={'schema':activity.SCHEMA,'data_kind':'SYNTHETIC','observations':[base,inc]}
    ain=td/'activity.json'; ain.write_text(json.dumps(adoc))
    p=subprocess.Popen(['python3',str(LP),'--input',str(inp),'--port','0','--activity-input',str(ain),'--activity-fresh-ms','5000'],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
    try:
        line=p.stdout.readline().strip(); port=int(line.rsplit(':',1)[1])
        def get(path, method='GET'):
            req=urllib.request.Request(f'http://127.0.0.1:{port}'+path,method=method)
            try:
                with urllib.request.urlopen(req,timeout=3) as res: return res.status,res.headers.get_content_type(),res.read()
            except urllib.error.HTTPError as e: return e.code,e.headers.get_content_type(),e.read()
        s,ct,b=get('/activity?at=2026-10-16T10:00:02Z'); d=json.loads(b)
        check('HTTP /activity archive', s==200 and d['mode']=='ARCHIVE' and d['data_kind']=='SYNTHETIC' and any(x['state']=='working_observed' for x in d['rows']))
        s,ct,b=get('/monitor'); check('HTTP /monitor HTML', s==200 and ct=='text/html' and b'Kosten nicht vollst' in b)
        s,ct,b=get('/activity',method='POST'); check('HTTP POST /activity => 405', s==405)
    finally:
        p.terminate()
        try: p.wait(timeout=3)
        except subprocess.TimeoutExpired: p.kill(); p.wait(timeout=3)

print('SUMMARY', passes, '/', passes+fails)
raise SystemExit(1 if fails else 0)
