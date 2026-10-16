#!/usr/bin/env python3
import copy,http.client,importlib.util,json,os,re,socket,subprocess,sys,tempfile,time
from pathlib import Path
ROOT=Path(__file__).resolve().parent
APP=ROOT/'pilot/AG-PILOT-001/local_transport.py'
FIX=ROOT/'fixtures/AG-VISUAL-005-beispiele-v2-1/11-snapshot-plus-tail.json'
spec=importlib.util.spec_from_file_location('redqa',ROOT/'tests/AG-VISUAL-005-referenz-reducer.py'); RED=importlib.util.module_from_spec(spec);spec.loader.exec_module(RED)
data=json.load(open(FIX,encoding='utf-8'))['daten']; SNAP=data['schnappschuss']
results=[]
def check(name,cond,detail=None): results.append((name,bool(cond),detail))
def write(path,obj):
 tmp=path.with_suffix('.tmp');tmp.write_text(json.dumps(obj,ensure_ascii=False),encoding='utf-8');os.replace(tmp,path)
def start(doc):
 td=tempfile.TemporaryDirectory();p=Path(td.name)/'probe.json';write(p,doc)
 proc=subprocess.Popen([sys.executable,str(APP),'--input',str(p),'--port','0'],cwd=ROOT,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
 line=proc.stdout.readline().strip();m=re.search(r'http://([^:]+):(\d+)',line)
 if not m:
  err=proc.stderr.read();proc.kill();td.cleanup();raise RuntimeError((line,err))
 return td,p,proc,m.group(1),int(m.group(2)),line
def stop(td,proc):
 proc.terminate()
 try: proc.wait(timeout=3)
 except subprocess.TimeoutExpired: proc.kill();proc.wait()
 td.cleanup()
def req(host,port,path,method='GET'):
 c=http.client.HTTPConnection(host,port,timeout=3);c.request(method,path);r=c.getresponse();body=r.read();c.close()
 try: val=json.loads(body)
 except Exception: val=body.decode('utf-8','replace')
 return r.status,val
def unpack(envs):
 out=[]
 for u in envs:
  e=copy.deepcopy(u['payload']);e['stream_sequence']=u['stream_sequence'];out.append(e)
 return out
# Canonical fixture input, exactly as required by handoff.
canon={'snapshot':copy.deepcopy(SNAP),'events':copy.deepcopy(data['tail_umschlaege'])}
td,p,proc,host,port,line=start(canon)
try:
 check('bind loopback',host=='127.0.0.1',line)
 s,h=req(host,port,'/health');check('health',s==200 and h.get('mode')=='local_probe' and h.get('supported_actions')==[],h)
 s,snap=req(host,port,'/snapshot')
 expected,_=RED.reduziere(unpack(data['tail_umschlaege']),initial_state=copy.deepcopy(SNAP['lauf']['zustand_am_cursor']),cursor=SNAP['cursor'])
 check('canonical snapshot state',s==200 and snap.get('state')==expected,{'got':snap,'expected':expected})
 costs=snap.get('kosten',{})
 check('cost wording/no amount',costs.get('status_text')=='Kosten nicht vollständig ermittelbar.' and not any(k in costs for k in ('gesamt','betrag','amount','total')),costs)
 s,st=req(host,port,'/state?cursor=104')
 exp104,_=RED.reduziere(unpack(data['tail_umschlaege'][:1]),initial_state=copy.deepcopy(SNAP['lauf']['zustand_am_cursor']),cursor=SNAP['cursor'])
 check('state cursor 104',s==200 and st.get('state')==exp104,{'got':st,'expected':exp104})
 s,a=req(host,port,'/archive');check('archive unmodified',s==200 and a.get('kind')=='LOCAL_TEST_BUNDLE' and a.get('snapshot')==canon['snapshot'] and a.get('events')==canon['events'],a)
 s,b=req(host,port,'/health',method='POST');check('POST rejected',s==405,b)
 for path in ['/state?cursor=102','/state?cursor=999','/events?cursor=102','/events?cursor=999']:
  s,b=req(host,port,path);check('resync '+path,s==409,b)
 # SSE resume: cursor 105 => only envelope 106, unmodified.
 conn=http.client.HTTPConnection(host,port,timeout=3);conn.request('GET','/events?cursor=105');r=conn.getresponse()
 lines=[]
 while True:
  q=r.fp.readline().decode()
  if q in ('\n',''): break
  lines.append(q.rstrip('\n'))
 conn.close(); joined='\n'.join(lines)
 check('SSE resume exact 106',r.status==200 and 'id: 106' in joined and 'event: agentarium' in joined and json.loads([x[6:] for x in lines if x.startswith('data: ')][0])==canon['events'][2],joined)
 # heartbeat at latest has no id
 conn=http.client.HTTPConnection(host,port,timeout=7);conn.request('GET','/events?cursor=106');r=conn.getresponse();hb=[]
 deadline=time.time()+6.5
 while time.time()<deadline:
  q=r.fp.readline().decode()
  if not q: break
  hb.append(q.rstrip('\n'))
  if q.startswith(': heartbeat'): break
 conn.close(); check('heartbeat no id',': heartbeat' in hb and not any(x.startswith('id:') for x in hb),hb)
 # malformed update retained
 p.write_text('{bad json',encoding='utf-8');time.sleep(.35)
 s,h=req(host,port,'/health');s2,snap2=req(host,port,'/snapshot')
 check('malformed retains prior valid',s==200 and bool(h.get('input_error')) and s2==200 and snap2.get('cursor')==snap.get('cursor'),{'health':h,'snapshot':snap2})
finally: stop(td,proc)
# Gap -> resync, then corrected file with missing 105 supplied -> resumed events 105,106.
base_doc={'snapshot':copy.deepcopy(SNAP),'events':copy.deepcopy(data['tail_umschlaege'][:1])}
td,p,proc,host,port,line=start(base_doc)
try:
 gap={'snapshot':copy.deepcopy(SNAP),'events':copy.deepcopy([data['tail_umschlaege'][0],data['tail_umschlaege'][2]])};write(p,gap);time.sleep(.35)
 s,h=req(host,port,'/health');check('gap rejected and prior retained',bool(h.get('input_error')),h)
 corrected={'snapshot':copy.deepcopy(SNAP),'events':copy.deepcopy(data['tail_umschlaege'])};write(p,corrected);time.sleep(.35)
 s,h=req(host,port,'/health');check('missing event delivery recovers',s==200 and h.get('input_error') is None,h)
 conn=http.client.HTTPConnection(host,port,timeout=3);conn.request('GET','/events?cursor=104');r=conn.getresponse();ids=[]
 while len(ids)<2:
  q=r.fp.readline().decode()
  if not q: break
  if q.startswith('id:'): ids.append(int(q.split(':',1)[1]))
 conn.close();check('reconnect delivers 105,106 once',ids==[105,106],ids)
finally: stop(td,proc)
# Invalid semantic Done must leave known task state untouched and diagnose.
bad_events=copy.deepcopy(data['tail_umschlaege'])
bad_events[2]['payload']['criteria_ref']='WRONG@v1'
bad={'snapshot':copy.deepcopy(SNAP),'events':bad_events}
td,p,proc,host,port,line=start(bad)
try:
 s,z=req(host,port,'/snapshot')
 exp,diag=RED.reduziere(unpack(bad_events),initial_state=copy.deepcopy(SNAP['lauf']['zustand_am_cursor']),cursor=SNAP['cursor'])
 check('invalid Done state+diagnostic',s==200 and z.get('state')==exp and z.get('diagnostics')==diag and exp['aufgaben'][0]['status']=='offen' and bool(diag),{'got':z,'expected':exp,'diag':diag})
finally: stop(td,proc)
for n,ok,d in results: print(('PASS' if ok else 'FAIL'),n,json.dumps(d,ensure_ascii=False,sort_keys=True) if d is not None else '')
print('SUMMARY',sum(x[1] for x in results),'/',len(results))
raise SystemExit(0 if all(x[1] for x in results) else 1)
