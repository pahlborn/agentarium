#!/usr/bin/env python3
import json, subprocess, tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path

root=Path(__file__).resolve().parent
fix=json.loads((root/'fixtures/AG-VISUAL-005-beispiele-v2-1/11-snapshot-plus-tail.json').read_text())['daten']
with tempfile.TemporaryDirectory() as td:
    td=Path(td)
    (td/'probe.json').write_text(json.dumps({'snapshot':fix['schnappschuss'],'events':fix['tail_umschlaege']}))
    now=datetime.now(timezone.utc)
    def ob(i,at,n):
        return {'id':i,'agent':'Forge','session_id':'dom-s','task_id':'dom-t','observed_at':at.isoformat(),
                'evidence_ref':'dom#'+i,'signal':'stream_sample','event_counts':{'msg':n},
                'last_event_seconds':n,'elapsed_seconds':n}
    doc={'schema':'agentarium.activity-observations.v1','data_kind':'SYNTHETIC',
         'observations':[ob('d1',now-timedelta(milliseconds=300),1),ob('d2',now-timedelta(milliseconds=100),2)]}
    (td/'activity.json').write_text(json.dumps(doc))
    srv=subprocess.Popen(['python3',str(root/'pilot/AG-PILOT-001/local_transport.py'),'--input',str(td/'probe.json'),'--port','0',
                          '--activity-input',str(td/'activity.json'),'--activity-fresh-ms','1500'],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
    try:
        port=int(srv.stdout.readline().strip().rsplit(':',1)[1])
        js=r'''const {chromium}=require('playwright'); (async()=>{
          const b=await chromium.launch({headless:true}); const p=await b.newPage();
          await p.goto(process.argv[1]); await p.waitForSelector('.card.working_observed');
          const first={auto:await p.locator('#auto').isChecked(),coverage:await p.locator('#coverage').innerText(),
            state:await p.locator('.card.working_observed .state').innerText(),costs:await p.locator('#costs').innerText()};
          await p.waitForTimeout(2200);
          const staleStillWorking=await p.locator('.card.working_observed').count();
          await p.locator('#refresh').click(); await p.waitForSelector('.card.unknown');
          const after=await p.locator('.card.working_observed').count();
          console.log(JSON.stringify({first,staleStillWorking,after})); await b.close();
        })().catch(e=>{console.error(e);process.exit(1)})'''
        cp=subprocess.run(['node','-e',js,f'http://127.0.0.1:{port}/monitor'],capture_output=True,text=True,timeout=10)
        print(cp.stdout.strip()); print(cp.stderr.strip())
        raise SystemExit(cp.returncode)
    finally:
        srv.terminate()
        try: srv.wait(timeout=3)
        except subprocess.TimeoutExpired: srv.kill(); srv.wait(timeout=3)
