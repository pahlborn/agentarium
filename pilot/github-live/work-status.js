/* AG-MON-VERTRETUNG-001: technische Läufe sind keine fachlichen Abschlüsse. */
(function (root, factory) {
  'use strict'; var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) { root.__agWorkStatus = api; api.mount(root); }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  function githubRef(s) { return typeof s === 'string' && /^https:\/\/github\.com\/pahlborn\/[A-Za-z0-9_.-]+\/(?:issues|pull|actions\/runs|commit|blob)\/[A-Za-z0-9_./#-]+$/.test(s); }
  function transfer(state, e) {
    if (!state || !state.parent || state.closed || e.kind !== 'reassigned' || e.actor !== 'atlas' || e.reporter !== 'atlas' ||
        !e.recipient || e.recipient === e.previous_holder || state.holder !== e.previous_holder ||
        state.parent !== (e.parent_id || '') || (e.item_type && state.type && e.item_type !== state.type) || !githubRef(e.stop_ref) ||
        !(e.checkpoint_ref === 'no-checkpoint' || githubRef(e.checkpoint_ref))) return null;
    return { holder: e.recipient, parent: state.parent, closed: false,
      type:state.type, history: (state.history || []).concat([{ from: state.holder, to: e.recipient,
        stop_ref: e.stop_ref, checkpoint_ref: e.checkpoint_ref, at: e.occurred_at }]) };
  }
  function taskKey(p, r, t) { return [p, r, t].join('\u0001'); }
  function runView(repo, r) {
    if (!r || !Number.isSafeInteger(r.id) || r.id < 1 || typeof r.name !== 'string' ||
        !['queued','in_progress','completed','waiting','pending','requested'].includes(r.status)) return null;
    var url = 'https://github.com/' + repo + '/actions/runs/' + r.id;
    if (r.html_url !== url) return null;
    var word = { queued:'Wartet', in_progress:'Läuft', completed:'Beendet', waiting:'Wartet', pending:'Wartet', requested:'Angefordert' }[r.status];
    var end = { success:'erfolgreich', failure:'fehlgeschlagen', cancelled:'abgebrochen', timed_out:'Zeitlimit', skipped:'übersprungen', action_required:'Aktion nötig', neutral:'neutral', stale:'veraltet' };
    return { id:r.id, repo:repo, url:url, text:r.name.slice(0,120) + ' · ' + word +
      (r.status === 'completed' ? ' · ' + (end[r.conclusion] || 'Ergebnis unbekannt') : ''),
      status:r.status, conclusion:r.conclusion || null, updated_at:r.updated_at || '' };
  }
  function mount(w) {
    var d=w.document, style=d.createElement('style'); style.textContent=
      '#agRunStatus{font:12px/1.5 system-ui;color:#c7d6e5;max-width:420px}#agRunStatus a{color:#b7cce4;display:block;overflow-wrap:anywhere}' +
      '.agWorkBadge{position:fixed;z-index:7;width:34px;height:34px;padding:0;border:0;border-radius:50%;background:#142334dd;color:#f1c26c;font:600 18px system-ui;transform:translate(-50%,-50%);cursor:pointer}' +
      '.agWorkBadge.blocked:before{content:"";position:absolute;inset:-5px;border:2px dashed #e7ad49;border-radius:50%;animation:agBlocked 3.5s ease-in-out infinite}' +
      '@keyframes agBlocked{50%{opacity:.4;transform:scale(1.12)}}@media(prefers-reduced-motion:reduce){.agWorkBadge.blocked:before{animation:none}}' +
      '#agWorkDetail a{color:#b7cce4;overflow-wrap:anywhere}#agWorkDetail{position:fixed;z-index:30;bottom:12px;left:12px;max-width:min(440px,calc(100vw - 48px));max-height:35vh;overflow:auto;padding:14px;background:#142334;color:#d5e0ed;border:1px solid #e7ad49;border-radius:8px;font:13px/1.5 system-ui}#agWorkDetail button{float:right;margin-left:12px}';
    d.head.appendChild(style);
    var panel=d.createElement('details');panel.id='agRunStatus'; var summary=d.createElement('summary');summary.textContent='GitHub-Läufe · noch nicht abgefragt';panel.appendChild(summary);
    var list=d.createElement('div');panel.appendChild(list);var note=d.createElement('small');note.textContent='Technischer Laufstatus; kein Nachweis eines Agentenstarts oder fachlichen Abschlusses. Maximal 5 neueste Läufe je Projekt.';panel.appendChild(note);
    var detail=d.createElement('div');detail.id='agWorkDetail';detail.hidden=true;d.body.appendChild(detail);
    var badges=Object.create(null), sources=[], last=0, generation=0, busy=false, read=null, results=[];
    var openedDetail=null;
    function fingerprint(t){return JSON.stringify([t.wer,t.zustand,t.klemmt,(t.vertretungen||[]).length]);}
    function close(){openedDetail=null;detail.hidden=true;detail.textContent='';}
    function show(task, ball){detail.textContent=''; var b=d.createElement('button');b.textContent='Schließen';b.onclick=close;detail.appendChild(b);
      var p=d.createElement('div');p.textContent=ball.aufgabe+' · '+ball.bei+' · '+(task.klemmt.length?'Blockiert':'Zugewiesen · Start noch nicht gemeldet');detail.appendChild(p);
      task.klemmt.forEach(function(k){var t=d.createElement('p');t.textContent=(task.vertretungen&&task.vertretungen.length?'Übernommene offene Blockade · ':'')+k.grund+' · Blockade '+k.id+' · Seit: '+(k.occurred_at||'Zeit unbekannt');detail.appendChild(t);
      if(/^[0-9]{1,24}$/.test(String(k.beleg||''))){var a=d.createElement('a');a.textContent='Originalmeldung';a.href='https://github.com/pahlborn/agentarium/issues/2#issuecomment-'+k.beleg;a.target='_blank';a.rel='noopener noreferrer';detail.appendChild(a);}});
      var n=d.createElement('p');n.textContent=task.klemmt.length?'Nächster Verantwortlicher: Atlas klärt Blockade oder übernimmt die belegte Vertretungsübergabe.':'Keine Ausfallbehauptung: Ein geplanter Start oder eine Empfangsmeldung kann noch ausstehen.';detail.appendChild(n);
      (task.vertretungen||[]).forEach(function(h){var t=d.createElement('p');t.textContent='Vertretung: '+h.from+' → '+h.to+' · '+h.at;detail.appendChild(t);});openedDetail={key:taskKey(ball.projekt,ball.lauf,ball.aufgabe),fingerprint:fingerprint(task)};detail.hidden=false; }
    function paint(){var host=d.getElementById('agGithub');if(!panel.parentNode&&host)host.appendChild(panel);
      var bridge=w.__agGithubBruecke, st=w.__agStand&&w.__agStand(), alive=Object.create(null);
      var archived=w.__agGithub&&w.__agGithub.stand&&w.__agGithub.stand().archiv;
      if(!st||!bridge||!bridge.istLive()||(archived&&archived.ansicht)){
        close();Object.keys(badges).forEach(function(k){badges[k].remove();delete badges[k];});return;
      }
      var tasks=Object.create(null);(st.aufgaben||[]).forEach(function(t){tasks[taskKey(t.projekt,t.lauf,t.aufgabe)]=t;});
      if(openedDetail&&(!tasks[openedDetail.key]||fingerprint(tasks[openedDetail.key])!==openedDetail.fingerprint))close();
      (st.liegend||[]).forEach(function(ball){if(!ball.ort||ball.fliegt)return;var key=taskKey(ball.projekt,ball.lauf,ball.aufgabe),t=tasks[key];
        if(!t||t.wer!==ball.bei||(!t.klemmt.length&&t.zustand!=='zugewiesen'))return;
        var id=key+'\u0001'+ball.bei, el=badges[id];alive[id]=true;
        if(!el){el=d.createElement('button');el.type='button';badges[id]=el;d.body.appendChild(el);}
        el.className='agWorkBadge'+(t.klemmt.length?' blocked':' waiting');el.textContent=t.klemmt.length?'Ⅱ':'◷';
        el.setAttribute('aria-label',ball.aufgabe+' · '+(t.klemmt.length?'blockiert':'wartet auf Startmeldung'));
        el.style.left=ball.ort[0]+'px';el.style.top=ball.ort[1]+'px';el.onclick=function(){
          var current=w.__agGithubBruecke;
          if(current&&typeof current.ballInfo==='function')current.ballInfo(ball.ort[0],ball.ort[1]);
          show(t,ball);
        };
      });Object.keys(badges).forEach(function(k){if(!alive[k]){badges[k].remove();delete badges[k];}});
    }
    function clear(){generation++;read=null;sources=[];last=0;busy=false;results=[];close();Object.keys(badges).forEach(function(k){badges[k].remove();delete badges[k];});summary.textContent='GitHub-Läufe · getrennt';list.textContent='';}
    async function refresh(){if(!read||busy||d.hidden||Date.now()-last<60000)return;busy=true;last=Date.now();var checkedAt=last,g=generation;var fn=read, out=[];
      for(var i=0;i<sources.length;i++){var repo=sources[i];try{var r=await fn(repo);if(g!==generation)return;
        if(!r||!Array.isArray(r.workflow_runs))throw Error('Antwort ungültig');
        r.workflow_runs.slice(0,5).forEach(function(x){var v=runView(repo,x);if(v)out.push(v);});
      }catch(e){if(g!==generation)return;if(e&&e.retryAt)last=Math.max(last,e.retryAt-60000);out.push({repo:repo,error:'Status unbekannt / nicht abrufbar'});}}
      if(g!==generation)return;results=out;list.textContent='';summary.textContent='GitHub-Läufe · '+new Date(checkedAt).toLocaleTimeString();
      out.forEach(function(r){var el=d.createElement(r.url?'a':'p');el.textContent=r.error?r.repo+' · '+r.error:r.repo+' · '+r.text;if(r.url){el.href=r.url;el.target='_blank';el.rel='noopener noreferrer';}list.appendChild(el);});busy=false;
    }
    w.setInterval(paint,300);
    return {connect:function(repos,fn){clear();sources=repos.filter(function(x){return /^pahlborn\/[A-Za-z0-9_.-]+$/.test(x);}).slice(0,10);read=fn;refresh();}, refresh:refresh, disconnect:clear, state:function(){return results.slice();}};
  }
  var api={transfer:transfer,githubRef:githubRef,runView:runView,mount:function(w){if(!api.ui)api.ui=mount(w);return api.ui;}};return api;
});
