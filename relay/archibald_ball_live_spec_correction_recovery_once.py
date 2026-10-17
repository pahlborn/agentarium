#!/usr/bin/env python3
"""One paid recovery run for the lost Archibald AG-BALL-LIVE-001 V3 handback.

The raw Claude result is persisted before validation. No automatic retry exists.
"""
import hashlib, json, os, subprocess, tempfile
from pathlib import Path
from forge_one_shot import api, API
from claude_cli_diagnostics import run_json, validate_handback, ClaudeCliFailure

TASK = 'AG-BALL-LIVE-001-ARCHIBALD-SPEC-V3-RECOVERY-V1'
BRANCH = 'agent/ball-live-concept-20261017'
PROFILE = 'ee21df45884c9f4fef3d493fca739e0e87c3cb55'
OUT = Path('archibald-ball-live-spec-correction-recovery-output').resolve()
REQUEST = 'handoffs/AG-BALL-LIVE-001-archibald-correction-request-v2.json'

def post(body):
    return api(API + '/issues/2/comments', {'body': body})

def source(ref, path):
    return subprocess.check_output(['git', 'show', ref + ':' + path])

def main():
    for key, expected in {
        'GITHUB_REPOSITORY': 'pahlborn/agentarium',
        'GITHUB_REPOSITORY_OWNER_ID': '277496791',
        'GITHUB_ACTOR_ID': '277496791',
        'GITHUB_EVENT_NAME': 'push',
        'GITHUB_REF_NAME': BRANCH
    }.items():
        if os.environ.get(key) != expected:
            raise RuntimeError('Unauthorized context: ' + key)
    head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()
    packet = json.loads(source(head, REQUEST))
    activation = json.loads(source(head, 'handoffs/AG-BALL-LIVE-001-archibald-correction-recovery-activate.json'))
    if activation != {'task_id': TASK, 'authorized': True, 'mode': 'one paid recovery; persist raw before validation'}:
        raise RuntimeError('Activation mismatch')
    if packet.get('task_id') != TASK or packet.get('mode') != 'read-only bounded specification correction recovery':
        raise RuntimeError('Wrong task/mode')
    profile = source(head, '.claude/agents/spec-agent.md')
    digest = hashlib.sha1(b'blob ' + str(len(profile)).encode() + b'\0' + profile).hexdigest()
    if digest != PROFILE or b'model: opus\n' not in profile or b'effort: high\n' not in profile:
        raise RuntimeError('Wrong role definition/default')
    for page in range(1, 101):
        comments = api(API + '/issues/2/comments?per_page=100&page=' + str(page))
        if not isinstance(comments, list):
            raise RuntimeError('Uninspectable execution history')
        if any(TASK in str(c.get('body', '')) for c in comments):
            raise RuntimeError('Recovery already exists; no repeat permitted')
        if len(comments) < 100:
            break
    else:
        raise RuntimeError('Incomplete execution history')
    if not os.environ.get('ANTHROPIC_API_KEY'):
        raise RuntimeError('API key unavailable')

    OUT.mkdir(exist_ok=True)
    run = 'https://github.com/pahlborn/agentarium/actions/runs/' + os.environ['GITHUB_RUN_ID']
    cli = subprocess.check_output(['claude', '--version'], text=True).strip()
    post('## ' + TASK + ' — HOST_RECEIVED\nOne authorized paid recovery after relay data loss. Raw output will be saved before validation. Role default opus/high retained.\nRole blob: ' + PROFILE + '\nRun: ' + run + '\nCLI: ' + cli + '\nNo implementation, infrastructure, test, deployment or publication. No automatic retry.')

    cfg = {'spec-agent': {
        'description': 'Archibald bounded recovery of BALL live MVP V3 specification',
        'prompt': profile.decode(),
        'tools': ['Read', 'Glob', 'Grep'],
        'model': 'opus'
    }}
    cmd = ['claude', '--bare', '-p', json.dumps(packet, ensure_ascii=False),
        '--agents', json.dumps(cfg), '--agent', 'spec-agent',
        '--tools', 'Read,Glob,Grep', '--allowedTools', 'Read,Glob,Grep',
        '--disallowedTools', 'Bash,Edit,Write,Agent,WebFetch,WebSearch,mcp__*',
        '--permission-mode', 'dontAsk', '--model', 'opus', '--effort', 'high',
        '--no-session-persistence', '--output-format', 'json']
    env = dict(os.environ)
    for key in ('GH_TOKEN', 'GITHUB_TOKEN', 'ACTIONS_RUNTIME_TOKEN'):
        env.pop(key, None)

    result = execution = failure = None
    response = raw_response = ''
    with tempfile.TemporaryDirectory(prefix='archibald-ball-live-spec-correction-recovery-') as tmp:
        work = Path(tmp)
        before = {}
        for name in packet['required_reading']:
            raw = source(head, name)
            before[name] = raw
            dest = work / name
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(raw)
        for item in packet.get('external_reading', []):
            raw = source(item['ref'], item['path'])
            name = item['as']
            before[name] = raw
            dest = work / name
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(raw)
        try:
            result, execution = run_json(cmd, cwd=tmp, env=env, timeout=1800)
            # Critical recovery invariant: preserve the complete raw result first.
            (OUT / 'raw-result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2))
            raw_response = result.get('result', '') if isinstance(result, dict) else ''
            (OUT / 'handback-raw.md').write_text(raw_response)
            response = validate_handback(result, execution, max_chars=120000)
        except ClaudeCliFailure as exc:
            failure = exc.evidence
        finally:
            after = {str(p.relative_to(work)): p.read_bytes() for p in work.rglob('*') if p.is_file()}
            changes = sorted(name for name in set(before) | set(after) if before.get(name) != after.get(name))
            product_changes = [p for p in changes if not p.startswith('.claude/')]
            meta = {
                'task_id': TASK, 'request_commit': head, 'definition_blob': PROFILE,
                'run': run, 'cli_version': cli, 'requested_model': 'opus',
                'requested_effort': 'high', 'actual_reasoning': 'unconfirmed',
                'session_id': result.get('session_id') if isinstance(result, dict) else None,
                'modelUsage': result.get('modelUsage') if isinstance(result, dict) else None,
                'usage': result.get('usage') if isinstance(result, dict) else None,
                'num_turns': result.get('num_turns') if isinstance(result, dict) else None,
                'total_cost_usd': result.get('total_cost_usd') if isinstance(result, dict) else None,
                'execution': execution, 'failure': failure, 'raw_response_chars': len(raw_response),
                'raw_saved_before_validation': bool(raw_response), 'changed_paths': changes,
                'unexpected_product_changes': product_changes, 'tests_run': False,
                'product_published': False
            }
            (OUT / 'metadata.json').write_text(json.dumps(meta, indent=2))
            (OUT / 'handback.md').write_text(response)
            ok = bool(response) and not failure and not product_changes
            status = 'RESULT_READY / STOPPED' if ok else 'BLOCKED / STOPPED'
            if ok:
                preview = response[:3500]
                note = '\n\nFull validated handback is preserved in the workflow artifact (`handback.md` and `handback-raw.md`).' if len(response) > len(preview) else ''
                post('## ' + TASK + ' — ' + status + '\n```json\n' + json.dumps(meta, indent=2) + '\n```\n' + preview + note)
            else:
                post('## ' + TASK + ' — ' + status + '\n```json\n' + json.dumps(meta, indent=2) + '\n```\nRaw output, if any, was preserved before validation in the workflow artifact.')
            if not ok:
                raise RuntimeError('Inspect preserved blocker; no automatic retry')

if __name__ == '__main__':
    main()

