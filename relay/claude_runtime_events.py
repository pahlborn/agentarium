#!/usr/bin/env python3
"""Bounded host observations and the separate runtime-only publisher (stdlib).

Not a worker tool. Files live outside the editable model workspace. Same UID is
not isolation. No stream content is copied into observations or issue comments.
"""
from __future__ import annotations

import datetime as dt
import hashlib
import io
import json
import math
import os
from pathlib import Path
import re
import selectors
import signal
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile

REPO = 'pahlborn/agentarium'
API = 'https://api.github.com/repos/' + REPO
ROOT = Path('relay-runtime').resolve()
SCHEMA = 'agentarium.runtime-observation.v1'
JOURNAL_SCHEMA = 'agentarium.runtime-record.v1'
MARKER = '<!-- AGENTARIUM_RUNTIME_V1 -->'
ROLE_MAP = {'coding-agent': 'forge', 'spec-agent': 'archibald', 'process-agent': 'cadence'}
LIMIT_SECONDS = 23 * 60
WAIT_SECONDS = 25 * 60
PUBLISH_SECONDS = 34 * 60
MAX_OBSERVATION = 16384
MAX_ARCHIVE = 65536
MAX_STREAM = 64 * 1024 * 1024
MAX_LINE = 2 * 1024 * 1024
USAGE_KEYS = {'input_tokens', 'output_tokens', 'cache_read_input_tokens', 'cache_creation_input_tokens'}
FIELDS = {'schema', 'project_id', 'run_id', 'task_id', 'parent_id', 'subject_role',
          'actor', 'execution_attempt', 'github_run_id', 'github_run_attempt',
          'source_commit', 'activation_commit', 'phase', 'observed_at',
          'start_observed_at', 'actual_start_unknown', 'session_id', 'usage',
          'total_cost_usd', 'signal', 'outcome', 'worker_state', 'safety'}
SUSPICIOUS = re.compile(rb'(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-ant-[A-Za-z0-9_-]{20,})')
ID = re.compile(r'AG-[A-Z0-9-]{4,80}')
SESSION = re.compile(r'[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}')


def utc():
    return dt.datetime.now(dt.timezone.utc).isoformat()


def timestamp(value):
    if not isinstance(value, str) or len(value) > 50:
        raise ValueError('invalid runtime timestamp')
    parsed = dt.datetime.fromisoformat(value)
    if parsed.tzinfo is None:
        raise ValueError('runtime timestamp lacks timezone')
    return parsed


def timestamp_upper_exclusive(value):
    """End of the platform timestamp's representable interval, no clock slack."""
    parsed = timestamp(value)
    precision = re.search(r'T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.([0-9]{1,6}))?(?:Z|[+-][0-9]{2}:[0-9]{2})$', value)
    if precision is None:
        raise ValueError('unsupported platform timestamp precision')
    digits = len(precision.group(1) or '')
    return parsed + dt.timedelta(microseconds=10 ** (6 - digits))


def number(value):
    return type(value) in (int, float) and 0 <= value <= 1e15 and math.isfinite(value)


def serialized(value):
    return json.dumps(value, sort_keys=True, allow_nan=False, separators=(',', ':')).encode()


def clean(data, exact=None):
    return not (SUSPICIOUS.search(data) or (exact and exact in data))


def atomic(path, value, exact=None):
    data = serialized(value)
    if len(data) > MAX_OBSERVATION or not clean(data, exact):
        raise ValueError('unsafe or oversized runtime observation')
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix('.pending')
    temporary.write_bytes(data)
    temporary.replace(path)


def identity(context):
    """Only explicit validated task identity; never infer a logical run."""
    value = context['request'].get('runtime')
    if value is None:
        return None
    expected = {'schema', 'project_id', 'run_id', 'task_id', 'parent_id', 'subject_role'}
    if (not isinstance(value, dict) or set(value) != expected or
            value['schema'] != 'agentarium.relay-runtime-identity.v1' or
            value['project_id'] != 'agentarium' or
            value['task_id'] != context['activation']['task_id'] or
            value['subject_role'] != ROLE_MAP[context['activation']['role']]):
        raise ValueError('runtime identity mismatch')
    for key in ('run_id', 'task_id', 'parent_id'):
        if not isinstance(value[key], str) or not ID.fullmatch(value[key]):
            raise ValueError('invalid logical runtime identity')
    for key in ('run_id', 'run_attempt'):
        if not re.fullmatch(r'[1-9][0-9]{0,19}', str(context.get(key, ''))):
            raise ValueError('missing workflow run/attempt')
    for key in ('source_commit', 'head'):
        if not isinstance(context.get(key), str) or not re.fullmatch(r'[0-9a-f]{40}', context[key]):
            raise ValueError('missing runtime source binding')
    attempt = hashlib.sha256(serialized([REPO, context['head'], str(context['run_id']),
                                        str(context['run_attempt']), value])).hexdigest()
    return {key: value[key] for key in ('project_id', 'run_id', 'task_id', 'parent_id', 'subject_role')} | {
        'actor': 'relay-host', 'execution_attempt': attempt,
        'github_run_id': str(context['run_id']), 'github_run_attempt': str(context['run_attempt']),
        'source_commit': context['source_commit'], 'activation_commit': context['head']}


def validate(value, context, phase=None):
    expected = identity(context)
    if (expected is None or not isinstance(value, dict) or set(value) != FIELDS or
            value.get('schema') != SCHEMA or any(value.get(k) != v for k, v in expected.items())):
        raise ValueError('runtime observation identity/schema mismatch')
    if not clean(serialized(value)) or len(serialized(value)) > MAX_OBSERVATION:
        raise ValueError('runtime observation secret/size rejection')
    if value['phase'] not in ('start', 'end') or (phase and phase != value['phase']):
        raise ValueError('runtime phase mismatch')
    when = timestamp(value['observed_at'])
    started = value['start_observed_at']
    if started is not None and timestamp(started) > when:
        raise ValueError('runtime timestamps reversed')
    if value['actual_start_unknown'] is not True:
        raise ValueError('exact computation start is never known')
    if value['session_id'] is not None and (
            not isinstance(value['session_id'], str) or not SESSION.fullmatch(value['session_id'])):
        raise ValueError('invalid runtime session')
    usage = value['usage']
    if usage is not None and (not isinstance(usage, dict) or not usage or
            set(usage) - USAGE_KEYS or not all(number(v) for v in usage.values())):
        raise ValueError('invalid runtime usage')
    if value['total_cost_usd'] is not None and not number(value['total_cost_usd']):
        raise ValueError('invalid runtime cost')
    if value['phase'] == 'start':
        if (started != value['observed_at'] or value['session_id'] is None or
                value['signal'] not in ('content_delta', 'assistant_content') or
                value['outcome'] != 'activity_observed' or value['worker_state'] != 'observed_active' or
                value['safety'] != 'pending'):
            raise ValueError('false runtime start')
    elif (value['signal'] not in ('process_exit', 'supervisor_error', 'timeout') or
          value['outcome'] not in ('process_exited', 'unknown_no_activity_observed',
                                   'error_before_activity', 'error_after_activity', 'safety_blocked', 'observation_lost') or
          value['worker_state'] not in ('stopped', 'not_launched', 'unknown') or
          value['safety'] not in ('passed', 'blocked', 'unknown')):
        raise ValueError('invalid runtime terminal')
    if value['phase'] == 'end':
        if started is not None and value['outcome'] == 'error_before_activity':
            raise ValueError('pre-activity error contradicts start')
        if started is None and value['outcome'] in ('process_exited', 'error_after_activity'):
            raise ValueError('terminal falsely asserts observed activity')
        if value['worker_state'] == 'unknown' and value['outcome'] != 'observation_lost':
            raise ValueError('unproved worker stop')
    return value


class Observer:
    def __init__(self, context, root=ROOT, exact=None):
        self.context, self.root, self.exact = context, root, exact
        self.binding = identity(context)
        self.started = self.ended = self.session = self.cost = None
        self.usage = None
        self.messages = {}
        self.worker_state = 'not_launched'
        self.signal = 'supervisor_error'
        self.failed = False

    def record(self, phase, signal_name, outcome, safety='pending'):
        if self.binding is None:
            return
        value = dict(self.binding, schema=SCHEMA, phase=phase, observed_at=utc(),
                     start_observed_at=self.started, actual_start_unknown=True,
                     session_id=self.session, usage=self.usage, total_cost_usd=self.cost,
                     signal=signal_name, outcome=outcome, worker_state=self.worker_state, safety=safety)
        if phase == 'start':
            value['observed_at'] = self.started
        elif self.ended is not None:
            value['observed_at'] = self.ended
        validate(value, self.context, phase)
        atomic(self.root / (phase + '.json'), value, self.exact)

    def feed(self, item):
        """The host inspects CLI event structure; model-written text is not parsed."""
        if not isinstance(item, dict) or item.get('parent_tool_use_id') is not None:
            return
        session = item.get('session_id')
        if not isinstance(session, str) or not SESSION.fullmatch(session):
            return
        if self.session is not None and session != self.session:
            return
        self.session = session
        signal_name = None
        if item.get('type') == 'stream_event':
            event = item.get('event')
            delta = event.get('delta') if isinstance(event, dict) else None
            if isinstance(delta, dict) and event.get('type') == 'content_block_delta':
                field = {'text_delta': 'text', 'thinking_delta': 'thinking',
                         'input_json_delta': 'partial_json'}.get(delta.get('type'))
                if field and isinstance(delta.get(field), str) and delta[field]:
                    signal_name = 'content_delta'
        elif item.get('type') == 'assistant' and not item.get('error'):
            message = item.get('message')
            if (isinstance(message, dict) and message.get('role') == 'assistant' and
                    isinstance(message.get('id'), str) and re.fullmatch(r'msg_[A-Za-z0-9_-]{1,160}', message['id'])):
                blocks = message.get('content')
                if isinstance(blocks, list):
                    for block in blocks:
                        if not isinstance(block, dict):
                            continue
                        field = {'text': 'text', 'thinking': 'thinking', 'tool_use': 'name'}.get(block.get('type'))
                        if field and isinstance(block.get(field), str) and block[field]:
                            signal_name = 'assistant_content'
                usage = self.safe_usage(message.get('usage'))
                if usage:
                    prior = self.messages.get(message['id'], {})
                    self.messages[message['id']] = {k: max(v, prior.get(k, 0)) for k, v in usage.items()} | {
                        k: v for k, v in prior.items() if k not in usage}
                    self.usage = {k: sum(m.get(k, 0) for m in self.messages.values())
                                  for k in USAGE_KEYS if any(k in m for m in self.messages.values())}
        elif item.get('type') == 'result':
            usage = self.safe_usage(item.get('usage'))
            if usage:
                self.usage = usage
            if number(item.get('total_cost_usd')):
                self.cost = item['total_cost_usd']
        if signal_name and self.started is None:
            self.started = utc()
            self.worker_state = 'observed_active'
            self.record('start', signal_name, 'activity_observed')

    @staticmethod
    def safe_usage(value):
        if not isinstance(value, dict):
            return None
        result = {k: v for k, v in value.items() if k in USAGE_KEYS and number(v)}
        return result or None

    def safely_feed(self, item):
        try:
            self.feed(item)
        except Exception:
            # Observation loss must never discard the paid result or raw scan.
            self.failed = True

    def finish(self, blocked, safety):
        if self.worker_state == 'unknown':
            outcome = 'observation_lost'
        elif safety == 'blocked':
            outcome = 'safety_blocked'
        elif self.started is None:
            outcome = 'error_before_activity' if blocked else 'unknown_no_activity_observed'
        else:
            outcome = 'error_after_activity' if blocked else 'process_exited'
        try:
            self.record('end', self.signal, outcome, safety)
        except Exception:
            self.failed = True


def stop_child(proc):
    """Always reap the owned child; kill only its newly created process group."""
    for sig, grace in ((signal.SIGTERM, 5), (signal.SIGKILL, 5)):
        try:
            os.killpg(proc.pid, sig)
        except ProcessLookupError:
            pass
        try:
            proc.wait(timeout=grace)
            # Kill any remaining descendants in this group, including after exit.
            try:
                os.killpg(proc.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            return
        except subprocess.TimeoutExpired:
            continue
    raise RuntimeError('owned child termination unknown')


def consume(command, work, environment, raw_path, err_path, observer):
    """Nonblocking bounded drain: EOF/init alone never call a start."""
    result = None
    proc = None
    deadline = time.monotonic() + LIMIT_SECONDS
    pending = b''
    total = 0
    try:
        with raw_path.open('wb') as raw, err_path.open('wb') as errors, selectors.DefaultSelector() as selector:
            proc = subprocess.Popen(command, cwd=work, env=environment, stdin=subprocess.DEVNULL,
                                    stdout=subprocess.PIPE, stderr=subprocess.PIPE, start_new_session=True)
            observer.worker_state = 'unknown'
            for stream, tag in ((proc.stdout, 'out'), (proc.stderr, 'err')):
                os.set_blocking(stream.fileno(), False)
                selector.register(stream, selectors.EVENT_READ, tag)
            while selector.get_map() or proc.poll() is None:
                if time.monotonic() >= deadline:
                    observer.signal = 'timeout'
                    raise TimeoutError('bounded worker deadline')
                for key, _ in selector.select(.25):
                    data = os.read(key.fileobj.fileno(), 65536)
                    if not data:
                        selector.unregister(key.fileobj)
                        continue
                    total += len(data)
                    if total > MAX_STREAM:
                        raise RuntimeError('bounded worker stream limit')
                    (raw if key.data == 'out' else errors).write(data)
                    if key.data != 'out':
                        continue
                    pending += data
                    while b'\n' in pending:
                        line, pending = pending.split(b'\n', 1)
                        if len(line) > MAX_LINE:
                            raise RuntimeError('bounded worker line limit')
                        try:
                            item = json.loads(line)
                        except (ValueError, UnicodeError):
                            continue
                        observer.safely_feed(item)
                        if isinstance(item, dict) and item.get('type') == 'result':
                            result = item
                    if len(pending) > MAX_LINE:
                        raise RuntimeError('bounded worker line limit')
            if pending:
                try:
                    item = json.loads(pending)
                    observer.safely_feed(item)
                    if isinstance(item, dict) and item.get('type') == 'result':
                        result = item
                except (ValueError, UnicodeError):
                    pass
            proc.wait(timeout=5)
            observer.signal = 'process_exit'
            observer.ended = utc()
            return result, proc.returncode
    finally:
        if proc is not None:
            try:
                stop_child(proc)
                observer.worker_state = 'stopped'
                observer.ended = observer.ended or utc()
            finally:
                for stream in (proc.stdout, proc.stderr):
                    if stream is not None:
                        stream.close()


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def get_json(path):
    req = urllib.request.Request(API + path, headers={
        'Authorization': 'Bearer ' + os.environ['GH_TOKEN'], 'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'})
    with urllib.request.build_opener(NoRedirect).open(req, timeout=20) as response:
        data = response.read(2 * 1024 * 1024 + 1)
    if len(data) > 2 * 1024 * 1024:
        raise ValueError('runtime platform response too large')
    return json.loads(data)


def pages(path, field):
    result = []
    for page in range(1, 101):
        value = get_json(path + ('&' if '?' in path else '?') + f'per_page=100&page={page}')
        rows = value[field] if field else value
        if not isinstance(rows, list):
            raise ValueError('invalid runtime platform list')
        result.extend(rows)
        if len(rows) < 100:
            return result
    raise ValueError('runtime platform history end not proven')


def artifact_name(context, phase):
    return f"relay-runtime-{phase}-{context['run_id']}-{context['run_attempt']}"


def source_job(context):
    run = get_json(f"/actions/runs/{context['run_id']}")
    if (type(run.get('id')) is not int or type(run.get('run_attempt')) is not int or
            run.get('id') != int(context['run_id']) or run.get('run_attempt') != int(context['run_attempt']) or
            run.get('head_sha') != context['head'] or run.get('event') != 'push' or
            (run.get('repository') or {}).get('full_name') != REPO or
            run.get('path', '').split('@')[0] != '.github/workflows/claude-public-relay-v2.yml'):
        raise ValueError('runtime workflow origin mismatch')
    jobs = pages(f"/actions/runs/{context['run_id']}/attempts/{context['run_attempt']}/jobs", 'jobs')
    matches = [j for j in jobs if j.get('name') == 'run']
    if not matches:
        return None
    if len(matches) != 1:
        raise ValueError('ambiguous runtime source job')
    job = matches[0]
    if (type(job.get('id')) is not int or job['id'] <= 0 or
            type(job.get('run_id')) is not int or type(job.get('run_attempt')) is not int or
            job.get('run_id') != int(context['run_id']) or job.get('head_sha') != context['head'] or
            job.get('run_attempt') != int(context['run_attempt'])):
        raise ValueError('runtime job origin mismatch')
    return job


def read_artifact(row, context, phase, job):
    if (not isinstance(row, dict) or row.get('name') != artifact_name(context, phase) or
            type(row.get('id')) is not int or row['id'] <= 0 or row.get('expired') is not False or
            type(row.get('size_in_bytes')) is not int or not 0 < row['size_in_bytes'] <= MAX_ARCHIVE or
            type((row.get('workflow_run') or {}).get('id')) is not int or
            (row.get('workflow_run') or {}).get('id') != int(context['run_id']) or
            (row.get('workflow_run') or {}).get('head_sha') != context['head'] or
            not re.fullmatch(r'sha256:[0-9a-f]{64}', str(row.get('digest', '')))):
        raise ValueError('runtime artifact origin/size mismatch')
    request = urllib.request.Request(API + f"/actions/artifacts/{row['id']}/zip", headers={
        'Authorization': 'Bearer ' + os.environ['GH_TOKEN']})
    opener = urllib.request.build_opener(NoRedirect)
    try:
        response = opener.open(request, timeout=20)
    except urllib.error.HTTPError as error:
        if error.code not in (301, 302, 303, 307, 308):
            raise
        location = error.headers.get('Location', '')
        parsed = urllib.parse.urlparse(location)
        if (parsed.scheme != 'https' or parsed.username or parsed.password or parsed.port not in (None, 443) or
                not parsed.hostname or not parsed.hostname.endswith(('.blob.core.windows.net', '.actions.githubusercontent.com'))):
            raise ValueError('runtime artifact redirect rejected') from None
        # A fresh request AND redirect-blocking opener: never forward Authorization.
        response = opener.open(urllib.request.Request(location), timeout=20)
    with response:
        data = response.read(MAX_ARCHIVE + 1)
    if len(data) > MAX_ARCHIVE or 'sha256:' + hashlib.sha256(data).hexdigest() != row['digest']:
        raise ValueError('runtime artifact digest mismatch')
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        entries = archive.infolist()
        if (len(entries) != 1 or entries[0].filename != phase + '.json' or
                entries[0].file_size > MAX_OBSERVATION or entries[0].flag_bits & 1 or
                (entries[0].external_attr >> 16) & 0o170000 == 0o120000):
            raise ValueError('runtime archive shape mismatch')
        content = archive.read(entries[0])
    if not clean(content):
        raise ValueError('runtime artifact secret rejected')
    value = validate(json.loads(content), context, phase)
    when = timestamp(value['observed_at'])
    if (timestamp(job['started_at']) > when or when >= timestamp_upper_exclusive(row['created_at']) or
            (job.get('completed_at') and when >= timestamp_upper_exclusive(job['completed_at'])) or
            timestamp(row['created_at']) > dt.datetime.now(dt.timezone.utc) + dt.timedelta(seconds=5)):
        raise ValueError('runtime observation outside platform time bounds')
    return value


def event_id(value):
    return value['execution_attempt'] + ':' + value['phase']


def lifecycle_kind(value):
    """Explicit host lifecycle, independent of subject-role or V1 events."""
    if value['phase'] == 'start':
        return 'started'
    if value['worker_state'] == 'unknown':
        return 'observation_lost'
    if value['worker_state'] in ('stopped', 'not_launched') and value['outcome'] in (
            'error_before_activity', 'error_after_activity', 'safety_blocked'):
        return 'aborted'
    if (value['worker_state'] == 'stopped' and value['signal'] == 'process_exit' and
            value['outcome'] == 'process_exited' and value['safety'] == 'passed'):
        return 'delivered'
    return 'observation_lost'


def record(value, row, job, delivery):
    return dict(schema=JOURNAL_SCHEMA, id=event_id(value), kind=lifecycle_kind(value), reporter='relay-host', publisher='github-actions',
                received_at=utc(), delivery=delivery, observation=value,
                evidence={'repository': REPO, 'artifact_id': row['id'], 'artifact_name': row['name'],
                          'artifact_digest': row['digest'], 'artifact_created_at': row['created_at'],
                          'job_id': job['id'], 'job_url': f"https://github.com/{REPO}/actions/runs/{value['github_run_id']}/job/{job['id']}",
                          'run_url': f"https://github.com/{REPO}/actions/runs/{value['github_run_id']}/attempts/{value['github_run_attempt']}",
                          'source_url': f"https://github.com/{REPO}/tree/{value['source_commit']}",
                          'activation_url': f"https://github.com/{REPO}/tree/{value['activation_commit']}"})


def journal(context):
    found = set()
    for row in pages('/issues/2/comments', None):
        if str((row.get('user') or {}).get('id')) != '41898282':
            continue
        body = row.get('body')
        prefix = MARKER + '\n```json\n'
        if (not isinstance(body, str) or len(body) > 30000 or not body.startswith(prefix) or
                not body.endswith('\n```') or body.count(MARKER) != 1):
            continue
        try:
            value = json.loads(body[len(prefix):-4])
            if (set(value) != {'schema', 'id', 'kind', 'reporter', 'publisher', 'received_at', 'delivery', 'observation', 'evidence'} or
                    value['schema'] != JOURNAL_SCHEMA or value['reporter'] != 'relay-host' or
                    value['publisher'] != 'github-actions' or value['delivery'] not in ('live_observed', 'archive') or
                    not clean(serialized(value))):
                continue
            observation = validate(value['observation'], context)
            if value['kind'] != lifecycle_kind(observation):
                continue
            timestamp(value['received_at'])
            evidence = value['evidence']
            expected = record(observation, {'id': evidence['artifact_id'],
                'name': artifact_name(context, observation['phase']), 'digest': evidence['artifact_digest'],
                'created_at': evidence['artifact_created_at']}, {'id': evidence['job_id']}, value['delivery'])['evidence']
            if (evidence != expected or type(evidence['artifact_id']) is not int or evidence['artifact_id'] <= 0 or
                    type(evidence['job_id']) is not int or evidence['job_id'] <= 0 or
                    not re.fullmatch(r'sha256:[0-9a-f]{64}', evidence['artifact_digest']) or
                    value['id'] != event_id(observation)):
                continue
            found.add(value['id'])
        except (KeyError, TypeError, ValueError):
            continue
    return found


def select_delivery(phase, end_known, job_running):
    return 'live_observed' if phase == 'start' and not end_known and job_running else 'archive'


def publish(context, post):
    if identity(context) is None:
        print('RUNTIME_UNSUPPORTED_LEGACY: no explicit logical identity')
        return
    deadline = time.monotonic() + PUBLISH_SECONDS
    loaded = {}
    uncertain = set()
    completed_seen = None
    while time.monotonic() < deadline:
        try:
            job = source_job(context)
            rows = pages(f"/actions/runs/{context['run_id']}/artifacts", 'artifacts')
            artifacts = {}
            for phase in ('start', 'end'):
                matches = [r for r in rows if r.get('name') == artifact_name(context, phase)]
                if len(matches) > 1:
                    raise ValueError('ambiguous runtime artifact')
                if matches:
                    artifacts[phase] = matches[0]
            seen = journal(context)
            terminal_id = identity(context)['execution_attempt'] + ':end'
            if job:
                # Read end first; a late start is archived and never reactivates.
                for phase in ('end', 'start'):
                    if phase in artifacts and phase not in loaded:
                        loaded[phase] = read_artifact(artifacts[phase], context, phase, job)
                if 'start' in loaded and 'end' in loaded and loaded['end']['start_observed_at'] != loaded['start']['observed_at']:
                    raise ValueError('runtime start/end pairing mismatch')
                for phase in ('start', 'end'):
                    if phase not in loaded:
                        continue
                    value = loaded[phase]
                    key = event_id(value)
                    if key in seen or key in uncertain:
                        continue
                    # Refresh both source status and artifact list before a live label.
                    latest_job = source_job(context)
                    latest_rows = pages(f"/actions/runs/{context['run_id']}/artifacts", 'artifacts')
                    end_known = ('end' in artifacts or terminal_id in seen or
                                 any(r.get('name') == artifact_name(context, 'end') for r in latest_rows))
                    delivery = select_delivery(phase, end_known,
                        bool(latest_job and latest_job.get('status') == 'in_progress'))
                    payload = record(value, artifacts[phase], job, delivery)
                    body = MARKER + '\n```json\n' + serialized(payload).decode() + '\n```'
                    if not clean(body.encode()) or body.count(MARKER) != 1:
                        raise ValueError('runtime final comment rejected')
                    # POST once. A lost acknowledgement is reconciled by bot history;
                    # never blindly resend a possibly committed comment.
                    uncertain.add(key)
                    post(body)
                    seen.add(key)
                if job.get('status') == 'completed':
                    completed_seen = completed_seen or time.monotonic()
                    if 'end' in loaded and event_id(loaded['end']) in seen:
                        if 'start' not in loaded or event_id(loaded['start']) in seen:
                            return
                    if time.monotonic() - completed_seen >= 60:
                        print('RUNTIME_EVIDENCE_UNKNOWN: missing end or publication acknowledgement')
                        return
        except (ValueError, KeyError, TypeError, zipfile.BadZipFile):
            # Do not echo downloaded content, IDs, stream or request errors.
            raise RuntimeError('runtime provenance/integrity validation blocked') from None
        except (OSError, urllib.error.URLError):
            print('RUNTIME_TRANSPORT_UNKNOWN: bounded read retry; no blind POST retry')
        time.sleep(15)
    print('RUNTIME_EVIDENCE_UNKNOWN: publisher deadline; no terminal invented')
