#!/usr/bin/env python3
import importlib.util, json
from pathlib import Path

root=Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location('a',root/'pilot/AG-PILOT-001/activity.py')
a=importlib.util.module_from_spec(s); s.loader.exec_module(a)
ok=bad=0
def ck(name, cond, detail=''):
    global ok,bad
    if cond: ok+=1; print('PASS',name,detail)
    else: bad+=1; print('FAIL',name,detail)
def o(i,t,counts,last,elapsed,agent='Forge'):
    return {'id':i,'agent':agent,'session_id':'s','task_id':'t','observed_at':t,
            'evidence_ref':'e#'+i,'signal':'stream_sample','event_counts':counts,
            'last_event_seconds':last,'elapsed_seconds':elapsed}

b=o('b','2026-10-16T10:00:00Z',{'stream_event':1},1,2)
last=o('l','2026-10-16T10:00:01Z',{'stream_event':1},2,3)
r=next(x for x in a.derive([b,last],now='2026-10-16T10:00:01Z',fresh_ms=5000) if x['agent']=='forge')
ck('last_event alone is not work',r['state']=='unknown',json.dumps(r,ensure_ascii=False))

mix=o('m','2026-10-16T10:00:02Z',{'stream_event':2},3,4,agent='FoRgE')
rows=a.derive([b,mix],now='2026-10-16T10:00:02Z',fresh_ms=5000)
fr=[x for x in rows if x['agent']=='forge']
ck('case normalization no duplicate',len(fr)==1 and len(rows)==8 and fr[0]['state']=='working_observed',repr([(x['agent'],x['session_id']) for x in rows]))

real=root.parent/'activity-real-evidence.json'
d=a.build_response(str(real),90000,at='2026-10-16T10:54:15Z')
fr=[x for x in d['rows'] if x['agent']=='forge']
ck('real evidence at second publication => working',d['data_kind']=='OBSERVED' and len(d['rows'])==8 and len(fr)==1 and fr[0]['state']=='working_observed' and all(x['state']=='unknown' for x in d['rows'] if x['agent']!='forge'),json.dumps(fr,ensure_ascii=False))
d=a.build_response(str(real),90000,at='2026-10-16T10:54:59Z')
fr=next(x for x in d['rows'] if x['agent']=='forge')
ck('real evidence terminal => stopped failed',fr['state']=='stopped' and fr['outcome']=='failed' and fr['remaining_valid_ms'] is None,json.dumps(fr,ensure_ascii=False))

html=(root/'pilot/AG-PILOT-001/activity.html').read_text()
ck('JS static local expiry/live/archive logic',all(x in html for x in (
   'performance.now()', 'remaining_valid_ms', 'setTimeout(checkExpiry',
   'auto.checked = true', 'auto.disabled = true; auto.checked = false',
   'if (at) { return; }', 'draw(false)', 'if (allowPulse && stamp)')))
readme=(root/'pilot/AG-PILOT-001/README.md').read_text()
ck('README work example uses allowed counter', 'counter `msg` 3 then 5' not in readme)
print('SUMMARY',ok,'/',ok+bad)
raise SystemExit(1 if bad else 0)
