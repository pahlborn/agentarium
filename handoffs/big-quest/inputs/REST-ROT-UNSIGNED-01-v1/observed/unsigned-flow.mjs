import assert from 'node:assert/strict';
import { verbindungen, kindAnlegen, elternteilEinladen, abgleichMitVerbindungen } from '/workspace/work/bq-rot-qa-20261122/src/module/einladung.mjs';
import { startcodeAusstellen, ersteAnmeldung, anmelden, schluesselErneuern } from '/workspace/work/bq-rot-qa-20261122/src/module/konto.mjs';
import { lokalerSpeicher } from '/workspace/work/bq-rot-qa-20261122/src/module/speicher.mjs';
import { newEvent, checkEvent } from '/workspace/work/bq-rot-qa-20261122/src/module/ereignisse.mjs';
import { GERAETEABGLEICH_SPEICHER } from '/workspace/work/bq-rot-qa-20261122/src/module/geraeteabgleich.mjs';
import { deriveSchool } from '/workspace/work/bq-rot-qa-20261122/src/module/ableitung.mjs';
const R=1000,T0=Date.UTC(2026,10,4,8),HEUTE='2026-11-04';
const PW={verwalter:'Tiger-Lamp-River-4271',peter:'Otter-Cake-Moss-1234',anna:'Koala-Bread-Cliff-5502',kathie:'Puffin-Jam-Lake-9876',neu:'Walrus-Taco-Pine-1357'};
const weiter=(W,ms=60000)=>(W.uhr.t+=ms);
const ablage = () => { const m = new Map(); return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); } }; };
function geraet(W, d, konto) {
  const a = ablage(); a.setItem('bq2_evDevice', JSON.stringify(d));
  const g = {
    a, d, konto,
    z: () => W.geraet(d),
    sync: () => abgleichMitVerbindungen({ ablage: a, zugang: W.geraet(d), konten: [g.konto], now: weiter(W), heute: HEUTE }),
    v: () => verbindungen({ ablage: a, konto: g.konto, now: W.uhr.t }),
    log: (kind) => JSON.parse(a.getItem('bq2_' + kind + '__events') || '[]'),
    antworten: (kind) => g.log(kind).filter((e) => e.type === 'answer').map((e) => e.id).sort(),
    name: (kind) => g.log(kind).filter((e) => e.type === 'profile_set' && e.payload.field === 'name').map((e) => e.payload.value).pop(),
    ueben: (n) => {
      const k = 'bq2_' + g.konto.kennung + '__events', l = JSON.parse(a.getItem(k) || '[]');
      for (let i = 0; i < n; i++) l.push(newEvent({ type: 'answer', author: g.konto.kennung, device: d, at: new Date(weiter(W, 1000)).toISOString(), payload: { day: HEUTE, skill: 'numbers', level: 2, attempt: 1, ok: true, qid: 'q' + l.length } }));
      a.setItem(k, JSON.stringify(l));
    },
    /* ein Elternteil schreibt in das Protokoll eines Kindes (wie die App, unsigniert) */
    schreibt: (kind, type, payload) => {
      const k = 'bq2_' + kind + '__events', l = JSON.parse(a.getItem(k) || '[]');
      l.push(newEvent({ type, author: g.konto.kennung, device: d, at: new Date(weiter(W, 1000)).toISOString(), payload }));
      a.setItem(k, JSON.stringify(l));
    },
    /* die App wirft "alt" weg, sobald nichts mehr offen ist */
    fertig: (r) => { assert.deepEqual(r.erneuerungOffen, [], 'alle Bereiche haben den neuen Schluessel'); if (g.konto.alt) { g.konto = { ...g.konto }; delete g.konto.alt; } },
  };
  return g;
}
async function einloesen(W, d, qr, passwort) {
  return geraet(W, d, await ersteAnmeldung({ zugang: W.geraet(d), code: qr.code, passwort, fingerabdruck: qr.fingerabdruck, now: W.uhr.t, runden: R }));
}
/* Admin, Peter (Gruender), Anna (zweiter Elternteil), Kathie (von Peter angelegt, uebt 3x) - alle abgeglichen */
async function familie(W) {
  const sa = await startcodeAusstellen({ zugang: W.geraet('d_A1'), aussteller: null, anmeldename: 'verwalter', art: 'admin', now: W.uhr.t });
  const admin = await ersteAnmeldung({ zugang: W.geraet('d_A1'), code: sa.code, passwort: PW.verwalter, now: W.uhr.t, runden: R });
  const sp = await startcodeAusstellen({ zugang: W.geraet('d_A1'), aussteller: admin, anmeldename: 'peter', art: 'parent', now: W.uhr.t });
  const P1 = await einloesen(W, 'd_P1', sp, PW.peter);
  await P1.sync();
  const e = await elternteilEinladen({ zugang: P1.z(), ablage: P1.a, konto: P1.konto, anmeldename: 'anna', now: weiter(W) });
  const P2 = await einloesen(W, 'd_P2', e, PW.anna);
  await P2.sync(); await P1.sync(); await P2.sync();
  const qr = await kindAnlegen({ zugang: P1.z(), ablage: P1.a, konto: P1.konto, anmeldename: 'kathie', anzeigename: 'Kathie', now: weiter(W) });
  const K = await einloesen(W, 'd_K1', qr, PW.kathie);
  await K.sync(); await P1.sync(); await K.sync(); await P2.sync(); await P1.sync();
  K.ueben(3); await K.sync(); await P1.sync(); await P2.sync();
  assert.equal(P2.antworten(K.konto.kennung).length, 3, 'Ausgangslage: Anna sieht 3 Antworten');
  return { admin, P1, P2, K };
}

// Synthetic one-case probe. Existing fixture helpers copied from pinned test source above.
const uhr={t:T0},storage=lokalerSpeicher({now:()=>uhr.t});
let blocked=null;
const W={uhr,geraet(d){const z=storage.geraet(d);return {...z,async put(area,...args){if(blocked?.device===d&&blocked.area===area){const e=new Error('Synthetic dropped upload');e.code='offline';throw e;}return z.put(area,...args);}};}};
const {P1,P2,K}=await familie(W),child=K.konto.kennung,area='schule:'+child;
const P1b=geraet(W,'d_P1b',await anmelden({zugang:W.geraet('d_P1b'),anmeldename:'peter',passwort:PW.peter,runden:R}));
await P1b.sync();
const evaluation='0a667a6c-8d8c-4520-a6ec-000000000001',revision='0a667a6c-8d8c-4520-a6ec-000000000002';
P1.schreibt(child,'school_evaluation',{child,evaluation,revision,title:'Synthetic REST rotation evaluation',day:HEUTE,assessment:{area:'maths',goal:'',instructions:'',feedback:'',criteria:[{criterion:'Synthetic place value criterion',rating:'C',standard:'M-N1',evidence:''}]}});
const event=P1.log(child).find(e=>e.payload?.evaluation===evaluation);assert.deepEqual(checkEvent(event),[]);
const pendingBefore=JSON.parse(P1.a.getItem(GERAETEABGLEICH_SPEICHER.staende)||'{}')[area];
assert.equal(!!pendingBefore?.ausgang?.some(x=>x.event?.id===event.id),false,'confirmed event not yet signed or queued');
assert.equal(P1.log(child).filter(e=>e.id===event.id).length,1,'confirmed only in local app log');
const beforePub=JSON.stringify(P1.konto.pub);
P1b.konto=await schluesselErneuern({zugang:P1b.z(),anmeldename:'peter',passwort:PW.peter,neuesPasswort:PW.neu,runden:R});
const rotated=await P1b.sync();P1b.fertig(rotated);
assert.notEqual(JSON.stringify(P1b.konto.pub),beforePub);
assert.equal(P1b.konto.kennung,P1.konto.kennung);
P1.konto=await anmelden({zugang:P1.z(),anmeldename:'peter',passwort:PW.neu,runden:R});
assert.equal(JSON.stringify(P1.konto.pub),JSON.stringify(P1b.konto.pub));
assert.equal(P1.konto.art,'parent');assert.ok(P1.v().kinder.some(x=>x.id===child),'same authorized child after relogin');
blocked=null;
const recovered=await P1.sync();const parentRead=await P2.sync();await P1b.sync();await K.sync();
const counts=Object.fromEntries([['origin',P1],['otherParent',P2],['renewingDevice',P1b],['child',K]].map(([name,g])=>[name,g.log(child).filter(e=>e.id===event.id).length]));
const rejections=Object.fromEntries([['origin',recovered],['otherParent',parentRead]].map(([name,r])=>[name,r.bericht.verworfen.map(x=>({grund:x.grund,bereich:x.bereich,type:x.type}))]));
const rounds=[];
for(let n=1;n<=3;n++){
 const rs=[];
 for(const [name,g] of [['origin',P1],['renewingDevice',P1b],['otherParent',P2],['child',K]]){
  const r=await g.sync(),st=JSON.parse(g.a.getItem(GERAETEABGLEICH_SPEICHER.staende)||'{}')[area];
  rs.push({name,areaReport:r.bericht.bereiche[area],rejections:r.bericht.verworfen.filter(x=>x.bereich===area).map(x=>({grund:x.grund,type:x.type})),eventCount:g.log(child).filter(e=>e.id===event.id).length,revisionCount:g.log(child).filter(e=>e.payload?.evaluation===evaluation&&e.payload?.revision===revision).length,stand:{pending:st?.ausgang?.filter(x=>x.event?.id===event.id).length,inFlight:!!st?.unterwegs,logCount:st?.log?.filter(x=>x.event?.id===event.id).length,waiting:st?.wartend}});
 }
 rounds.push({round:n,devices:rs});
}
const result={synthetic:true,scope:'module integration, not visible UI',commit:'7b44c49f77312e491476b71766bfc9c879dfeeeb',probe:'unsigned confirmed intent before key renewal',preparedSignedOutbox:false,preparedInFlight:false,rotationCompleted:true,currentAuthorizedSameParent:JSON.stringify(P1.konto.pub)===JSON.stringify(P1b.konto.pub)&&P1.konto.kennung===P1b.konto.kennung&&P1.konto.art==='parent',sameChild:P1.v().kinder.some(x=>x.id===child),originalEventIdentity:event.id,originalRevision:revision,initialCounts:counts,rounds};
console.log(JSON.stringify(result));
assert.equal(P2.log(child).filter(e=>e.id===event.id).length,1,'authorized original confirmed evaluation reaches other parent once after stable sync');
assert.equal(P2.log(child).filter(e=>e.payload?.evaluation===evaluation&&e.payload?.revision===revision).length,1,'same evaluation/revision exactly once');
