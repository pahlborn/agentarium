#!/usr/bin/env python3
"""One read-only Forge architecture handback using the established Claude relay."""
import hashlib, json, os, subprocess, tempfile
from pathlib import Path
from forge_one_shot import api, API
from claude_cli_diagnostics import run_json, validate_handback, ClaudeCliFailure

TASK = 'AG-LIVE-THINK-001-FORGE-V1'
BRANCH = 'agent/mvp-ten-events-20261017'
BASE = '55bb6997503284cfb77c0a50bb4905240b3b13b4'
PROFILE = '38d9747018bd4bfc5299a2dd9aeded9659337e77'
OUT = Path('forge-live-thinking-output').resolve()
REQUEST = 'handoffs/AG-LIVE-THINK-001-forge-request-v1.json'
TEAM = 'handoffs/AG-LIVE-THINK-001-team-input-v1.md'

def post(body):
    return api(API + '/issues/2/comments', {'body': body})

def source(ref, path):
    return subprocess.check_output(['git', 'show', ref + ':' + path])

def main():
    for k, v in {'GITHUB_REPOSITORY':'pahlborn/agentarium',
        'GITHUB_REPOSITORY_OWNER_ID':'277496791', 'GITHUB_ACTOR_ID':'277496791',
        'GITHUB_EVENT_NAME':'push', 'GITHUB_REF_NAME':BRANCH}.items():
        if os.environ.get(k) != v:
            raise RuntimeError('Unauthorized context: ' + k)
    head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()
    packet = json.loads(source(head, REQUEST))
    activation = json.loads(source(head, 'handoffs/AG-LIVE-THINK-001-activate.json'))
    if activation != {'task_id':TASK, 'authorized':True, 'mode':'read-only advice'}:
        raise RuntimeError('Activation mismatch')
    if packet.get('task_id') != TASK or packet.get('mode') != 'read-only architecture/advice':
        raise RuntimeError('Wrong task/mode')
    profile = source(BASE, '.claude/agents/coding-agent.md')
    digest = hashlib.sha1(b'blob ' + str(len(profile)).encode() + b'\0' + profile).hexdigest()
    if digest != PROFILE:
        raise RuntimeError('Wrong role definition')
    for page in range(1, 101):
        comments = api(API + '/issues/2/comments?per_page=100&page=' + str(page))
        if not isinstance(comments, list):
            raise RuntimeError('Uninspectable execution history')
        if any(TASK in str(c.get('body', '')) for c in comments):
            raise RuntimeError('Execution already exists; inspect instead of retry')
        if len(comments) < 100:
            break
    else:
        raise RuntimeError('Incomplete execution history')
    if not os.environ.get('ANTHROPIC_API_KEY'):
        raise RuntimeError('API key unavailable')
    OUT.mkdir(exist_ok=True)
    run = 'https://github.com/pahlborn/agentarium/actions/runs/' + os.environ['GITHUB_RUN_ID']
    cli = subprocess.check_output(['claude','--version'], text=True).strip()
    post('## ' + TASK + ' — HOST_RECEIVED\nRead-only Forge architecture advice; requested best/xhigh as task-only override.\nRole blob: ' + PROFILE + '\nRun: ' + run + '\nCLI: ' + cli + '\nNo product edits/tests/deployment. No CLI turn/tiny-cost cap; no automatic retry.')
    cfg = {'coding-agent':{'description':'Forge read-only goal-first architecture alternatives',
        'prompt':profile.decode() + '\nTASK-ONLY OVERRIDE: Peter explicitly authorizes best available model for this critical advice task. Effective model inherits CLI best; effective effort xhigh via environment. Persistent role defaults are unchanged. Only Read, Glob, Grep are allowed.',
        'tools':['Read','Glob','Grep'], 'model':'inherit'}}
    cmd = ['claude','--bare','-p',json.dumps(packet,ensure_ascii=False),
        '--agents',json.dumps(cfg),'--agent','coding-agent',
        '--tools','Read,Glob,Grep','--allowedTools','Read,Glob,Grep',
        '--disallowedTools','Bash,Edit,Write,Agent,WebFetch,WebSearch,mcp__*',
        '--permission-mode','dontAsk','--model','best','--effort','xhigh',
        '--no-session-persistence','--output-format','json']
    env = dict(os.environ)
    for key in ('GH_TOKEN','GITHUB_TOKEN','ACTIONS_RUNTIME_TOKEN'):
        env.pop(key, None)
    env['CLAUDE_CODE_EFFORT_LEVEL'] = 'xhigh'
    result = execution = failure = None
    response = ''
    with tempfile.TemporaryDirectory(prefix='forge-live-thinking-') as tmp:
        work = Path(tmp)
        paths = list(dict.fromkeys(packet['required_reading'] + [REQUEST,
            'relay/forge_ten_live_events_once.py',
            'previews/AG-VISUAL-005-feld/schicht.py',
            '.claude/agents/coding-agent.md']))
        before = {}
        for name in paths:
            raw = source(head if name in (TEAM,REQUEST) else BASE, name)
            before[name] = raw
            dest = work / name
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(raw)
        try:
            result, execution = run_json(cmd, cwd=tmp, env=env, timeout=900)
            response = validate_handback(result, execution, max_chars=24000)
        except ClaudeCliFailure as exc:
            failure = exc.evidence
        finally:
            after = {str(p.relative_to(work)):p.read_bytes() for p in work.rglob('*') if p.is_file()}
            changes = sorted(n for n in set(before) | set(after) if before.get(n) != after.get(n))
            product_changes = [p for p in changes if not p.startswith('.claude/')]
            meta = {'task_id':TASK,'source_commit':BASE,'request_commit':head,
                'definition_blob':PROFILE,'run':run,'cli_version':cli,
                'requested_model':'best','requested_effort':'xhigh',
                'actual_reasoning':'unconfirmed',
                'session_id':result.get('session_id') if isinstance(result,dict) else None,
                'modelUsage':result.get('modelUsage') if isinstance(result,dict) else None,
                'usage':result.get('usage') if isinstance(result,dict) else None,
                'num_turns':result.get('num_turns') if isinstance(result,dict) else None,
                'total_cost_usd':result.get('total_cost_usd') if isinstance(result,dict) else None,
                'execution':execution,'failure':failure,'changed_paths':changes,
                'unexpected_product_changes':product_changes,
                'tests_run':False,'product_published':False}
            (OUT/'metadata.json').write_text(json.dumps(meta,indent=2))
            (OUT/'handback.md').write_text(response)
            post('## ' + TASK + ' — ' + ('RESULT_READY / STOPPED' if response and not failure and not product_changes else 'BLOCKED / STOPPED') + '\n```json\n' + json.dumps(meta,indent=2) + '\n```\n' + response)
            if failure or not response or product_changes:
                raise RuntimeError('Inspect preserved blocker; no automatic retry')

if __name__ == '__main__':
    main()
