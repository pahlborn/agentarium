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
      '#agRunStatus{font:12px/1.5 system-ui;color:#c7d6e5;max-width:420px}#agRunStatus a{color:#b7cce4;display:block;overflow-wrap:anywhere}';
    /* AG-MON-ABZEICHEN-001 (Peter, 10.11.): Hier lagen runde Abzeichen über
       liegenden Bällen -- eine Warteuhr für „zugewiesen, Start nicht
       gemeldet“ und ein pulsierender Ring für „blockiert“ -- dazu eine
       Detailtafel beim Antippen. Peter: „bitte entferne dieses hässliche
       symbol ... ein fehlender Effekt ist das gleiche.“ Wer nicht arbeitet,
       zeigt keinen Arbeitseffekt; eine Blockade zeigt der Ring am Agenten
       (er stockt), ihr Grund steht in der Liste (Peter, 21.10.: „nachsehen
       kann man dann in der liste“). Das Ballschild beim Antippen des Balls
       bleibt, wie es war. Übrig bleibt hier die technische Laufanzeige. */
    d.head.appendChild(style);
    var panel=d.createElement('details');panel.id='agRunStatus'; var summary=d.createElement('summary');summary.textContent='GitHub-Läufe · noch nicht abgefragt';panel.appendChild(summary);
    var list=d.createElement('div');panel.appendChild(list);var note=d.createElement('small');note.textContent='Technischer Laufstatus; kein Nachweis eines Agentenstarts oder fachlichen Abschlusses. Maximal 5 neueste Läufe je Projekt.';panel.appendChild(note);
    var sources=[], last=0, generation=0, busy=false, read=null, results=[];
    function paint(){var host=d.getElementById('agGithub');if(!panel.parentNode&&host)host.appendChild(panel);}
    function clear(){generation++;read=null;sources=[];last=0;busy=false;results=[];summary.textContent='GitHub-Läufe · getrennt';list.textContent='';}
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
