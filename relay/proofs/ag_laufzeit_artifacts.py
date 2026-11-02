"""Synthetic infrastructure proof only: no model, no Agentarium role events."""
import datetime as dt
import hashlib
import io
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile

ROOT = Path('laufzeit-proof')
REPO = 'pahlborn/agentarium'

def utc():
    return dt.datetime.now(dt.timezone.utc).isoformat()

def atomic(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix('.pending')
    temporary.write_text(json.dumps(value, sort_keys=True))
    temporary.replace(path)

def event(case, phase):
    return dict(schema='agentarium.synthetic-transport-proof.v1', synthetic=True,
                case=case, phase=phase, run_id=os.environ['GITHUB_RUN_ID'],
                run_attempt=os.environ['GITHUB_RUN_ATTEMPT'], observed_at=utc())

def worker(case):
    time.sleep(2)
    atomic(ROOT / case / 'start.json', event(case, 'synthetic_start'))
    if case == 'normal':
        time.sleep(120)
        atomic(ROOT / case / 'end.json', event(case, 'synthetic_end'))
    else:
        time.sleep(240)
        raise RuntimeError('kill case unexpectedly survived')

def launch(case):
    directory = ROOT / case
    directory.mkdir(parents=True, exist_ok=True)
    with (directory / 'worker.log').open('w') as log:
        proc = subprocess.Popen([sys.executable, __file__, 'worker', case],
                                stdin=subprocess.DEVNULL, stdout=log, stderr=log,
                                start_new_session=True)
    atomic(directory / 'launch.json', dict(pid=proc.pid, synthetic=True, at=utc()))
    print('SYNTHETIC_SUPERVISOR_LAUNCHED', case, flush=True)

def await_file(case, name, limit):
    deadline = time.monotonic() + limit
    path = ROOT / case / name
    while time.monotonic() < deadline:
        if path.is_file():
            print('SYNTHETIC_FILE_OBSERVED', case, name, utc(), flush=True)
            return
        time.sleep(.25)
    raise TimeoutError('synthetic observation missing: ' + case + '/' + name)

def kill_worker(case):
    assert case == 'killed'
    directory = ROOT / case
    pid = json.loads((directory / 'launch.json').read_text())['pid']
    os.killpg(pid, signal.SIGKILL)
    assert not (directory / 'end.json').exists()
    atomic(directory / 'kill-observed.json', dict(synthetic=True, at=utc(), pid=pid))
    print('SYNTHETIC_WORKER_KILLED_NO_END', utc(), flush=True)

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

def api(path):
    request = urllib.request.Request('https://api.github.com/repos/' + REPO + path,
              headers={'Authorization': 'Bearer ' + os.environ['GH_TOKEN'],
                       'Accept': 'application/vnd.github+json',
                       'X-GitHub-Api-Version': '2022-11-28'})
    with urllib.request.urlopen(request, timeout=20) as response:
        return json.load(response)

def download(row, expected_case, phase):
    request = urllib.request.Request(row['archive_download_url'],
              headers={'Authorization': 'Bearer ' + os.environ['GH_TOKEN']})
    opener = urllib.request.build_opener(NoRedirect)
    try:
        response = opener.open(request, timeout=20)
    except urllib.error.HTTPError as error:
        if error.code not in (301, 302, 303, 307, 308):
            raise
        location = error.headers['Location']
        parsed = urllib.parse.urlparse(location)
        assert parsed.scheme == 'https' and not parsed.username and not parsed.password
        assert parsed.hostname.endswith(('.blob.core.windows.net', '.actions.githubusercontent.com'))
        # Never forward the repository bearer token to redirected blob storage.
        response = urllib.request.urlopen(location, timeout=20)
    with response:
        data = response.read(65537)
    assert len(data) <= 65536
    assert row['digest'] == 'sha256:' + hashlib.sha256(data).hexdigest()
    assert row['workflow_run']['id'] == int(os.environ['GITHUB_RUN_ID'])
    assert row['workflow_run']['head_sha'] == os.environ['GITHUB_SHA']
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        names = archive.namelist()
        assert names == [phase + '.json'], names
        assert archive.getinfo(names[0]).file_size <= 4096
        value = json.loads(archive.read(names[0]))
    expected = set(event(expected_case, 'synthetic_' + phase))
    assert set(value) == expected
    assert value['schema'] == 'agentarium.synthetic-transport-proof.v1'
    assert value['synthetic'] is True and value['case'] == expected_case
    assert value['phase'] == 'synthetic_' + phase
    assert value['run_id'] == os.environ['GITHUB_RUN_ID']
    assert value['run_attempt'] == os.environ['GITHUB_RUN_ATTEMPT']
    dt.datetime.fromisoformat(value['observed_at'])
    return value

def reader():
    run = os.environ['GITHUB_RUN_ID']
    attempt = os.environ['GITHUB_RUN_ATTEMPT']
    deadline = time.monotonic() + 270
    seen = {}
    normal_seen_while_running = False
    rows = []
    while time.monotonic() < deadline:
        artifacts = api('/actions/runs/' + run + '/artifacts?per_page=100')['artifacts']
        assert len(artifacts) < 100, 'unhandled artifact pagination'
        rows = api('/actions/runs/' + run + '/jobs?per_page=100')['jobs']
        assert len(rows) < 100, 'unhandled jobs pagination'
        jobs = {row['name']: row for row in rows}
        for row in artifacts:
            for case in ('normal', 'killed'):
                for phase in ('start', 'end'):
                    key = case + ':' + phase
                    if row['name'] != 'ag-laufzeit-proof-' + case + '-' + phase + '-' + run + '-' + attempt:
                        continue
                    if key not in seen:
                        value = download(row, case, phase)
                        source = jobs.get('proof-' + case, {})
                        seen[key] = dict(value=value, artifact_id=row['id'],
                                         received_at=utc(), source_status=source.get('status'))
                        print('SYNTHETIC_READER_SAW', key, json.dumps(seen[key]), flush=True)
                        if key == 'normal:start':
                            normal_seen_while_running = source.get('status') == 'in_progress'
        producers = [jobs.get('proof-' + case, {}) for case in ('normal', 'killed')]
        if all(job.get('status') == 'completed' for job in producers):
            assert all(job.get('conclusion') == 'success' for job in producers)
            assert normal_seen_while_running, 'start was not read before source job ended'
            assert set(seen) == {'normal:start', 'normal:end', 'killed:start'}, seen
            start = dt.datetime.fromisoformat(seen['normal:start']['value']['observed_at'])
            received = dt.datetime.fromisoformat(seen['normal:start']['received_at'])
            end = dt.datetime.fromisoformat(seen['normal:end']['value']['observed_at'])
            assert start <= received < end, 'not a live read during synthetic work interval'
            atomic(ROOT / 'reader-proof.json', dict(synthetic=True, verdict='PASS',
                   observations=seen, jobs=producers, start_delivery_seconds=(received-start).total_seconds(),
                   limits='Infrastructure only. No role, CLI, host authenticity or monitor proof.'))
            print('SYNTHETIC_TRANSPORT_PASS', 'live-start-read; separate end; killed-start preserved without fabricated end', flush=True)
            return
        time.sleep(5)
    raise TimeoutError('synthetic transport proof deadline')

if __name__ == '__main__':
    mode = sys.argv[1]
    case = sys.argv[2] if len(sys.argv) > 2 else None
    assert case in (None, 'normal', 'killed')
    if mode == 'launch': launch(case)
    elif mode == 'worker': worker(case)
    elif mode == 'await-start': await_file(case, 'start.json', 25)
    elif mode == 'await-end': await_file(case, 'end.json', 145)
    elif mode == 'kill': kill_worker(case)
    elif mode == 'reader': reader()
    else: raise ValueError('unknown proof mode')
