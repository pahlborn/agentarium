#!/usr/bin/env python3
"""AG-PILOT-001 LOCAL TEST HARNESS (loopback HTTP/SSE probe).

NOT a production service, NOT a live pilot, NOT PILOT READY. Binds only to
127.0.0.1, no auth, no TLS, no persistence, read-only (GET only). All data
served is labelled synthetic; nothing here asserts OBSERVED real work.
State is computed ONLY by the existing reference reducer
tests/AG-VISUAL-005-referenz-reducer.py (imported by path, not copied).

Usage: python3 pilot/AG-PILOT-001/local_transport.py --input FILE --port N
"""
import argparse
import copy
import importlib.util
import json
import os
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

HOST = '127.0.0.1'  # fixed; there is deliberately no way to configure it
HEARTBEAT_S = 5.0
POLL_S = 0.25
LABEL = {'data_label': 'SYNTHETIC_LOCAL_TEST_PROBE', 'observed_real_work': False,
         'production': False}

REDUCER_PATH = (Path(__file__).resolve().parents[2] / 'tests'
                / 'AG-VISUAL-005-referenz-reducer.py')


def load_reducer():
    spec = importlib.util.spec_from_file_location('ag_referenz_reducer', str(REDUCER_PATH))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


REDUCER = load_reducer()

ACTIVITY_PATH = Path(__file__).resolve().parent / 'activity.py'
MONITOR_HTML = Path(__file__).resolve().parent / 'activity.html'  # the only file /monitor serves


def load_activity():
    spec = importlib.util.spec_from_file_location('ag_activity', str(ACTIVITY_PATH))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


ACTIVITY = load_activity()


class InputError(Exception):
    pass


def parse_input(raw):
    """Return (snapshot_raw, state0, baseline, events) or raise InputError."""
    try:
        doc = json.loads(raw)
    except ValueError as exc:
        raise InputError('input is not valid JSON: %s' % exc)
    if not isinstance(doc, dict) or not isinstance(doc.get('snapshot'), dict) \
            or not isinstance(doc.get('events'), list):
        raise InputError('input must be {"snapshot": {...}, "events": [...]}')
    snap = doc['snapshot']
    lauf = snap.get('lauf')
    if not isinstance(lauf, dict):
        raise InputError('snapshot.lauf missing or not an object')
    state0 = lauf.get('zustand_am_cursor')
    if not isinstance(state0, dict):
        raise InputError('snapshot.lauf.zustand_am_cursor missing or not an object')
    base = snap.get('cursor')
    if not isinstance(base, int) or isinstance(base, bool) or base < 0:
        raise InputError('snapshot has no integer cursor >= 0')
    if state0.get('cursor') != base or isinstance(state0.get('cursor'), bool):
        raise InputError('snapshot.cursor %r and zustand_am_cursor.cursor %r disagree'
                         % (base, state0.get('cursor')))
    pid, rid = lauf.get('project_id'), lauf.get('run_id')
    if not isinstance(pid, str) or not pid or not isinstance(rid, str) or not rid:
        raise InputError('snapshot.lauf.project_id/run_id missing')
    if not isinstance(snap.get('kosten'), dict):
        raise InputError('snapshot.kosten missing or not an object')
    events = doc['events']
    for i, e in enumerate(events):
        if not isinstance(e, dict):
            raise InputError('events[%d] is not an object' % i)
        seq = e.get('stream_sequence')
        if not isinstance(seq, int) or isinstance(seq, bool):
            raise InputError('events[%d] has no integer stream_sequence' % i)
        if seq != base + 1 + i:
            raise InputError('events[%d]: stream_sequence %s, expected %s '
                             '(gap, duplicate or reorder; not skipped)'
                             % (i, seq, base + 1 + i))
        for key in ('stream', 'stream_id'):
            if e.get(key) != snap.get(key):
                raise InputError('events[%d]: %s %r differs from snapshot %r'
                                 % (i, key, e.get(key), snap.get(key)))
        pl = e.get('payload')
        if not isinstance(pl, dict):
            raise InputError('events[%d]: payload missing or not an object' % i)
        for key, want in (('project_id', pid), ('run_id', rid)):
            if pl.get(key) != want:
                raise InputError('events[%d]: payload %s %r differs from snapshot.lauf %r'
                                 % (i, key, pl.get(key), want))
    return snap, state0, base, events


def reducer_events(events):
    """COPIES of payloads with the envelope stream_sequence carried in; raw untouched."""
    out = []
    for e in events:
        p = copy.deepcopy(e['payload'])
        p['stream_sequence'] = e['stream_sequence']
        out.append(p)
    return out


def canonical_kosten():
    """Fixed incomplete-costs object; supplied amounts are never passed through."""
    return {'sichtbar': True, 'erfassung': 'unvollstaendig', 'daten': 'synthetisch',
            'status_text': 'Kosten nicht vollständig ermittelbar.'}


class Store:
    """Reads the input file with (mtime,size) caching; never writes it."""

    def __init__(self, path):
        self.path = path
        self.lock = threading.Lock()
        self.sig = None
        self.snap = self.state0 = self.base = None
        self.events = []
        self.error = None
        self.error_seq = 0  # increments on every new error

    def refresh(self):
        with self.lock:
            try:
                st = os.stat(self.path)
                sig = (st.st_mtime_ns, st.st_size)
            except OSError as exc:
                sig = None
                self._fail('input file not readable: %s' % exc.strerror)
                return
            if sig == self.sig:
                return
            self.sig = sig
            try:
                with open(self.path, 'rb') as fh:
                    raw = fh.read().decode('utf-8')
                snap, state0, base, events = parse_input(raw)
                if self.snap is not None:
                    if base != self.base or state0 != self.state0:
                        raise InputError('baseline snapshot changed; update rejected')
                    if events[:len(self.events)] != self.events:
                        raise InputError('previously accepted events changed '
                                         '(input must be append-only); update rejected')
            except (InputError, OSError, UnicodeDecodeError) as exc:
                self._fail(str(exc))
                return
            self.snap, self.state0, self.base, self.events = snap, state0, base, events
            self.error = None

    def _fail(self, msg):
        self.error = 'update rejected, prior valid input retained: ' + msg
        self.error_seq += 1

    def view(self):
        self.refresh()
        with self.lock:
            return (self.snap, self.state0, self.base, list(self.events),
                    self.error, self.error_seq)


def derive(state0, base, events, cursor):
    n = cursor - base
    state, diag = REDUCER.reduziere(reducer_events(events), bis=n,
                                    initial_state=copy.deepcopy(state0), cursor=base)
    return state, diag


def snapshot_doc(snap, state0, base, events, cursor):
    state, diag = derive(state0, base, events, cursor)
    return {'label': LABEL, 'cursor': state['cursor'], 'state': state,
            'kosten': canonical_kosten(), 'diagnostics': diag}


def jdump(obj):
    return json.dumps(obj, ensure_ascii=False, separators=(',', ':'))


class Handler(BaseHTTPRequestHandler):
    server_version = 'AgPilotLocalProbe/1'
    store = None
    activity_path = None
    activity_fresh_ms = None

    def log_message(self, fmt, *args):  # silenced; never log payloads
        pass

    def _json(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False, indent=2).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def _reject(self):
        self._json(405, {'error': 'read-only local probe, GET only'})

    do_POST = do_PUT = do_DELETE = do_PATCH = _reject

    @staticmethod
    def _int(v):
        try:
            return int(v)
        except (TypeError, ValueError):
            return None

    def do_GET(self):
        url = urlparse(self.path)
        q = parse_qs(url.query)
        snap, state0, base, events, err, _ = self.store.view()
        if url.path == '/activity':  # read-only; independent of the task reducer/heartbeat
            at = (q.get('at') or [None])[0]
            try:
                doc = ACTIVITY.build_response(self.activity_path, self.activity_fresh_ms, at=at)
            except ValueError as exc:
                return self._json(400, {'error': 'at: %s' % exc})
            return self._json(200, doc)
        if url.path == '/monitor':
            try:
                body = MONITOR_HTML.read_bytes()
            except OSError:
                return self._json(404, {'error': 'monitor page missing'})
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self.wfile.write(body)
            return
        if url.path == '/health':
            return self._json(200, {
                'mode': 'local_probe', 'supported_actions': [],
                'label': LABEL, 'input_loaded': snap is not None,
                'input_error': err, 'note': 'volatile local test harness; '
                'no auth, no persistence; not production, not pilot ready'})
        if snap is None:
            return self._json(503, {'error': 'no valid input loaded', 'input_error': err})
        latest = base + len(events)
        if url.path == '/snapshot':
            doc = snapshot_doc(snap, state0, base, events, latest)
            doc['input_error'] = err
            return self._json(200, doc)
        if url.path == '/state':
            c = self._int((q.get('cursor') or [None])[0])
            if c is None:
                return self._json(400, {'error': 'cursor=N (integer) required'})
            if not base <= c <= latest:
                return self._json(409, {'error': 'resync_required',
                                        'detail': 'cursor outside available contiguous range',
                                        'available': {'min': base, 'max': latest}})
            state, diag = derive(state0, base, events, c)
            return self._json(200, {'label': LABEL, 'cursor': state['cursor'],
                                    'state': state, 'diagnostics': diag})
        if url.path == '/archive':
            return self._json(200, {'kind': 'LOCAL_TEST_BUNDLE', 'label': LABEL,
                                    'note': 'portable test bundle only; not the final '
                                    'GitHub archive packaging',
                                    'snapshot': snap, 'events': events})
        if url.path == '/events':
            return self._sse(q, base, latest, snap, state0, events)
        self._json(404, {'error': 'not found'})

    def _sse(self, q, base, latest, snap, state0, events):
        raw = (q.get('cursor') or [None])[0]
        if raw is None:
            raw = self.headers.get('Last-Event-ID')
        cursor = None
        if raw is not None:
            cursor = self._int(raw)
            if cursor is None:
                return self._json(400, {'error': 'cursor must be an integer'})
            if not base <= cursor <= latest:
                return self._json(409, {'error': 'resync_required',
                                        'detail': 'cursor outside available range '
                                        '(future or below retained baseline)',
                                        'available': {'min': base, 'max': latest}})
        self.send_response(200)
        self.send_header('Content-Type', 'text/event-stream; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Connection', 'close')
        self.end_headers()
        self.close_connection = True
        try:
            if cursor is None:
                doc = snapshot_doc(snap, state0, base, events, latest)
                self._frame('id: %d\nevent: snapshot\ndata: %s\n\n' % (latest, jdump(doc)))
                sent = latest
            else:
                sent = cursor
            last_beat = time.monotonic()
            seen_err = self.store.view()[5]
            while True:
                snap, state0, base, events, err, eseq = self.store.view()
                if eseq != seen_err:
                    self._frame('event: resync\ndata: %s\n\n' % jdump(
                        {'error': 'resync_required', 'detail': err}))
                    return
                top = base + len(events)
                while sent < top:
                    sent += 1
                    env = events[sent - base - 1]
                    self._frame('id: %d\nevent: agentarium\ndata: %s\n\n' % (sent, jdump(env)))
                    last_beat = time.monotonic()
                if time.monotonic() - last_beat >= HEARTBEAT_S:
                    self._frame(': heartbeat\n\n')  # no id, no cursor movement
                    last_beat = time.monotonic()
                time.sleep(POLL_S)
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError, OSError):
            return  # client disconnected

    def _frame(self, text):
        self.wfile.write(text.encode('utf-8'))
        self.wfile.flush()


def main():
    ap = argparse.ArgumentParser(description='AG-PILOT-001 local loopback test probe')
    ap.add_argument('--input', required=True, help='explicit path to probe.json')
    ap.add_argument('--port', type=int, required=True, help='0 = pick free port')
    ap.add_argument('--activity-input', default=None,
                    help='optional activity observations JSON (agentarium.activity-observations.v1)')
    ap.add_argument('--activity-fresh-ms', type=int, default=None,
                    help='freshness window in ms (test configuration; required with --activity-input)')
    args = ap.parse_args()
    if not 0 <= args.port <= 65535:
        ap.error('port out of range')
    if args.activity_input is not None and (args.activity_fresh_ms is None
                                            or args.activity_fresh_ms <= 0):
        ap.error('--activity-fresh-ms (integer > 0) is required with --activity-input')
    Handler.activity_path = args.activity_input
    Handler.activity_fresh_ms = args.activity_fresh_ms
    store = Store(args.input)
    store.refresh()
    if store.snap is None:
        print('ERROR: %s' % store.error, file=sys.stderr)
        return 2
    Handler.store = store
    srv = ThreadingHTTPServer((HOST, args.port), Handler)
    srv.daemon_threads = True
    print('LOCAL TEST PROBE (not production) listening on http://%s:%d'
          % srv.server_address[:2], flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        srv.server_close()
    return 0


if __name__ == '__main__':
    sys.exit(main())
