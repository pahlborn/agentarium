#!/usr/bin/env python3
"""One bounded Forge correction pass for Original live candidate c2."""
import difflib
import hashlib
import json
import os
import re
import subprocess
import tempfile
from pathlib import Path

from forge_one_shot import api, API
from claude_cli_diagnostics import run_json, ClaudeCliFailure

TASK = 'AG-BALL-LIVE-001-FORGE-ORIGINAL-C2-V1'
BRANCH = 'agent/ball-live-concept-20261017'
BASE = 'c7a8da04d9b06d83edcd110f210c0cf84d4aa8ba'
PROFILE = '38d9747018bd4bfc5299a2dd9aeded9659337e77'
ALLOWED = {
    'feld/index.html',
    'feld/live.js',
    'tests/AG-BALL-LIVE-001-local-live.cjs',
}
OUT = Path('forge-ball-live-original-c2-v1-output').resolve()


def source(ref, path):
    return subprocess.check_output(['git', 'show', ref + ':' + path])


def post(body):
    return api(API + '/issues/2/comments', {'body': body})


def main():
    expected = {
        'GITHUB_REPOSITORY': 'pahlborn/agentarium',
        'GITHUB_REPOSITORY_OWNER_ID': '277496791',
        'GITHUB_ACTOR_ID': '277496791',
        'GITHUB_EVENT_NAME': 'push',
        'GITHUB_REF_NAME': BRANCH,
    }
    for key, value in expected.items():
        if os.environ.get(key) != value:
            raise RuntimeError('Unauthorized context: ' + key)

    head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()
    activation = json.loads(source(head, 'handoffs/AG-BALL-LIVE-001-forge-original-c2-activate.json'))
    if activation != {
        'task_id': TASK,
        'authorized': True,
        'mode': 'bounded Original c2 presentation correction',
    }:
        raise RuntimeError('Activation mismatch')

    for page in range(1, 101):
        batch = api(API + '/issues/2/comments?per_page=100&page=' + str(page))
        if not isinstance(batch, list):
            raise RuntimeError('History unavailable')
        if any(TASK in str(comment.get('body', '')) for comment in batch):
            raise RuntimeError('Execution exists; no automatic repeat')
        if len(batch) < 100:
            break
    else:
        raise RuntimeError('History incomplete')

    profile = source(head, '.claude/agents/coding-agent.md')
    profile_sha = hashlib.sha1(b'blob ' + str(len(profile)).encode() + b'\0' + profile).hexdigest()
    if profile_sha != PROFILE:
        raise RuntimeError('Profile mismatch')
    packet = json.loads(source(head, 'handoffs/AG-BALL-LIVE-001-forge-original-c2-request-v1.json'))
    if packet.get('task_id') != TASK or packet.get('baseline') != BASE:
        raise RuntimeError('Task packet mismatch')
    if not os.environ.get('ANTHROPIC_API_KEY'):
        raise RuntimeError('No API key')

    OUT.mkdir(exist_ok=True)
    run_url = 'https://github.com/pahlborn/agentarium/actions/runs/' + os.environ['GITHUB_RUN_ID']
    post('## ' + TASK + ' — HOST_RECEIVED\n' + run_url +
         '\nForge correction against exact candidate ' + BASE +
         '. Requested opus/high; no automatic retry. No merge or publication.')

    config = {
        'coding-agent': {
            'description': 'Forge bounded Original live c2 presentation correction',
            'prompt': profile.decode() +
                '\nTASK OVERRIDE: opus/high requested under Peter\'s best-model mandate. '
                'Effective tools Read/Edit only. Edit only the three explicitly allowed files. '
                'Own the technical method; challenge a harmful instruction rather than blindly applying it.',
            'model': 'inherit',
            'tools': ['Read', 'Edit'],
        }
    }
    cmd = [
        'claude', '--bare', '-p', json.dumps(packet, ensure_ascii=False),
        '--agents', json.dumps(config), '--agent', 'coding-agent',
        '--tools', 'Read,Edit', '--allowedTools', 'Read,Edit',
        '--disallowedTools', 'Bash,Agent,WebFetch,WebSearch,mcp__*',
        '--permission-mode', 'dontAsk', '--model', 'opus', '--effort', 'high',
        '--no-session-persistence', '--output-format', 'json',
    ]
    env = dict(os.environ)
    for key in ('GH_TOKEN', 'GITHUB_TOKEN', 'ACTIONS_RUNTIME_TOKEN'):
        env.pop(key, None)

    result = execution = failure = None
    with tempfile.TemporaryDirectory(prefix='forge-ball-live-original-c2-') as tmp:
        work = Path(tmp)
        before = {}
        for name in sorted(ALLOWED):
            raw = source(BASE, name)
            before[name] = raw
            dest = work / name
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(raw)
        for name in (
            'AGENTS.md',
            'governance/agentarium-rulebook-v1.2.md',
            'governance/agentarium-process-v1.2.md',
            'governance/product-development-practice-v1.md',
            'handoffs/AG-BALL-LIVE-001-original-live-ergebnis-v1.md',
            'governance/AG-BALL-LIVE-001-original-live-sentinel-qa-v1.md',
        ):
            raw = source(head, name)
            before[name] = raw
            dest = work / name
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(raw)

        index = (work / 'feld/index.html').read_text()
        markers = re.compile(
            r'BALL_LIVE|__agLauf|__agEreignis|__agStrom|ARTEN|progress|agEcke|agWas|agListe|'
            r'agAgent|agRing|ringZeichnen|heimat|melden|stromZeile|tunZeigen|requestAnimationFrame|'
            r'serviceWorker|@media|data-ball-live'
        )
        code_map = (
            'Read-only host index of candidate c1, exact source line numbers. '
            'Use Read with offsets on feld/index.html.\n' +
            '\n'.join(
                str(i) + ': ' + line[:260]
                for i, line in enumerate(index.splitlines(), 1)
                if markers.search(line)
            ) + '\n'
        )
        (work / 'HOST_CODE_MAP.txt').write_text(code_map)
        before['HOST_CODE_MAP.txt'] = code_map.encode()

        try:
            result, execution = run_json(cmd, cwd=tmp, env=env, timeout=1800)
            (OUT / 'raw-result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2))
            (OUT / 'handback.md').write_text(str(result.get('result', '')))
        except ClaudeCliFailure as exc:
            failure = exc.evidence
        finally:
            after = {
                str(path.relative_to(work)): path.read_bytes()
                for path in work.rglob('*')
                if path.is_file() and '.claude' not in path.relative_to(work).parts
            }
            changed = sorted(name for name in set(before) | set(after)
                             if before.get(name) != after.get(name))
            unauthorized = [name for name in changed if name not in ALLOWED]
            patch = ''
            for name in changed:
                if name not in ALLOWED:
                    continue
                patch += ''.join(difflib.unified_diff(
                    before.get(name, b'').decode().splitlines(True),
                    after.get(name, b'').decode().splitlines(True),
                    fromfile='a/' + name,
                    tofile='b/' + name,
                ))
                dest = OUT / 'files' / name
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(after[name])
            (OUT / 'forge.patch').write_text(patch)
            required_changed = {'feld/index.html', 'feld/live.js'}.issubset(changed)
            ok = bool(result and not result.get('is_error') and result.get('result') and
                      not failure and not unauthorized and required_changed)
            meta = {
                'task_id': TASK,
                'request_commit': head,
                'product_baseline': BASE,
                'role_blob': PROFILE,
                'run': run_url,
                'requested_model': 'opus',
                'requested_effort': 'high',
                'actual_reasoning': 'unconfirmed',
                'session_id': result.get('session_id') if result else None,
                'modelUsage': result.get('modelUsage') if result else None,
                'usage': result.get('usage') if result else None,
                'total_cost_usd': result.get('total_cost_usd') if result else None,
                'execution': execution,
                'failure': failure,
                'changed_paths': changed,
                'unauthorized_paths': unauthorized,
                'patch_sha256': hashlib.sha256(patch.encode()).hexdigest(),
                'tests_run': False,
                'product_published': False,
            }
            (OUT / 'metadata.json').write_text(json.dumps(meta, indent=2))
            post('## ' + TASK + ' — ' + ('RESULT_READY' if ok else 'BLOCKED') +
                 ' / STOPPED\n```json\n' + json.dumps(meta, indent=2) + '\n```\n' +
                 str(result.get('result', '') if result else '')[:5000] +
                 '\nFull patch and raw handback: workflow artifact forge-ball-live-original-c2-v1-output.')
            if not ok:
                raise RuntimeError('Inspect preserved result; no automatic retry')


if __name__ == '__main__':
    main()
