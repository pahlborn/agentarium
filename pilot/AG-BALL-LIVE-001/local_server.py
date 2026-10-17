#!/usr/bin/env python3
"""AG-BALL-LIVE-001 local live server, candidate AG-BALL-LIVE-001-c1.

LOCAL EXPERIMENT ONLY. Python 3.8+ stdlib, ThreadingHTTPServer, bound to
127.0.0.1. Serves the pinned ORIGINAL feld/ files plus live.js, a same-origin
SSE stream (/events), token-protected ingest (/ingest) and /health.

The event log is an in-memory bounded ring that lives only as long as this
process does. It makes NO claim of durability or archiving.

stdout: JSON lines. The first line is READY (or ERROR). Later lines are
INGEST/SSE log lines unless --log-file is given. The host must keep draining
stdout (or use --log-file), otherwise a full pipe blocks the server.

Usage (see README.md):
  BALL_INGEST_TOKEN=<>=16 chars> python3 pilot/AG-BALL-LIVE-001/local_server.py --port 0
"""
import argparse
import hmac
import json
import os
import re
import secrets
import signal
import sys
import threading
import time
import unicodedata
from collections import deque
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, unquote, urlsplit

VERSION = 'AG-BALL-LIVE-001-c1'
AGENTS = frozenset(['peter', 'nova', 'atlas', 'cadence', 'scout', 'forge',
                    'sentinel', 'archibald', 'argus'])
KINDS = frozenset(['progress'])            # this slice: progress only
EVIDENCE = frozenset(['runtime_stream', 'synthetic_test_fixture'])
REQUIRED = ('id', 'run_id', 'actor', 'kind', 'title', 'source_evidence')
OPTIONAL = ('recipient', 'source_tool_id')
ID_RE = re.compile(r'[A-Za-z0-9._:-]{1,80}')
TOOL_RE = re.compile(r'[A-Za-z0-9_.:-]{1,128}')
MAX_BODY = 8192
MAX_TITLE = 160
HEARTBEAT_S = 5.0
RETRY_MS = 1000
ID_MEMORY = 10000
TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json',
    '.webmanifest': 'application/manifest+json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.css': 'text/css; charset=utf-8',
    '.ico': 'image/x-icon',
}
# The ORIGINAL service worker intercepts every same-origin GET and would
# cache the stream and old assets. The local server never serves it.
BLOCKED = frozenset(['sw.js'])

_out_lock = threading.Lock()
_log_file = None


def _write(obj, force_stdout=False):
    line = json.dumps(obj, ensure_ascii=True, separators=(',', ':')) + '\n'
    with _out_lock:
        if _log_file is not None and not force_stdout:
            _log_file.write(line)
            _log_file.flush()
        else:
            sys.stdout.write(line)
            sys.stdout.flush()


def emit(obj):
    obj.setdefault('monotonic_ns', str(time.monotonic_ns()))
    _write(obj)


class State(object):
    def __init__(self, ring_max):
        self.cond = threading.Condition()
        self.seq = 0
        self.ring = deque(maxlen=ring_max)
        self.ids = {}
        self.id_order = deque()
        self.drop_gen = 0
        self.clients = 0
        self.instance = secrets.token_hex(8)
        self.ring_max = ring_max


def validate(obj):
    """Return (event, None) or (None, error). Unknown fields are rejected so
    raw tool arguments, thinking or text cannot ride along."""
    if not isinstance(obj, dict):
        return None, 'body must be a JSON object'
    extra = set(obj) - set(REQUIRED) - set(OPTIONAL)
    if extra:
        return None, 'unknown field(s) not allowed'
    for k in REQUIRED:
        if k not in obj:
            return None, 'missing field: ' + k
    for k in ('id', 'run_id'):
        v = obj[k]
        if not isinstance(v, str) or not ID_RE.fullmatch(v):
            return None, k + ' must match [A-Za-z0-9._:-]{1,80}'
    actor = obj['actor']
    if not isinstance(actor, str) or actor not in AGENTS:
        return None, 'actor unknown'
    kind = obj['kind']
    if not isinstance(kind, str) or kind not in KINDS:
        return None, 'kind not allowed (this slice accepts: progress)'
    title = obj['title']
    if not isinstance(title, str):
        return None, 'title must be a string'
    title = title.strip()
    if not title or len(title) > MAX_TITLE:
        return None, 'title must be 1..%d characters' % MAX_TITLE
    for ch in title:
        if unicodedata.category(ch) in ('Cc', 'Cf', 'Zl', 'Zp', 'Cs', 'Co', 'Cn'):
            return None, 'title contains control/format characters'
    rec = obj.get('recipient')
    if rec == '':
        rec = None
    if rec is not None and (not isinstance(rec, str) or rec not in AGENTS):
        return None, 'recipient unknown'
    ev = obj['source_evidence']
    if not isinstance(ev, str) or ev not in EVIDENCE:
        return None, 'source_evidence must be runtime_stream or synthetic_test_fixture'
    tid = obj.get('source_tool_id')
    if tid is not None and (not isinstance(tid, str) or not TOOL_RE.fullmatch(tid)):
        return None, 'source_tool_id must match [A-Za-z0-9_.:-]{1,128}'
    return {'id': obj['id'], 'run_id': obj['run_id'], 'actor': actor,
            'kind': kind, 'title': title, 'recipient': rec,
            'source_evidence': ev, 'source_tool_id': tid}, None


def make_handler(state, root, token, port_holder):
    token_b = token.encode('utf-8')

    class Handler(BaseHTTPRequestHandler):
        server_version = 'AgBallLive/' + VERSION
        sys_version = ''
        protocol_version = 'HTTP/1.0'

        def log_message(self, fmt, *args):  # quiet; we log JSON ourselves
            pass

        # ---------------------------------------------------------- helpers
        def _host_ok(self):
            p = port_holder[0]
            return self.headers.get('Host', '') in ('127.0.0.1:%d' % p, 'localhost:%d' % p)

        def _common(self):
            self.send_header('Cache-Control', 'no-store')
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.send_header('Referrer-Policy', 'no-referrer')
            self.send_header('X-Ball-Live-Version', VERSION)

        def _json(self, code, obj):
            body = json.dumps(obj, ensure_ascii=True).encode('utf-8')
            self.send_response(code)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self._common()
            self.end_headers()
            if self.command != 'HEAD':
                self.wfile.write(body)

        def _read_body(self):
            try:
                n = int(self.headers.get('Content-Length', '0') or '0')
            except ValueError:
                return None, (411, 'invalid content-length')
            if n < 0 or n > MAX_BODY:
                return None, (413, 'body too large')
            return (self.rfile.read(n) if n else b''), None

        def _auth(self):
            given = self.headers.get('X-Ball-Ingest-Token', '')
            if not given:
                a = self.headers.get('Authorization', '')
                if a.startswith('Bearer '):
                    given = a[7:]
            return bool(given) and hmac.compare_digest(
                given.encode('utf-8', 'replace'), token_b)

        # ------------------------------------------------------------- GET
        def do_GET(self):
            self._get(True)

        def do_HEAD(self):
            self._get(False)

        def _get(self, with_body):
            if not self._host_ok():
                return self._json(421, {'ok': False, 'error': 'host not allowed'})
            u = urlsplit(self.path)
            if u.path == '/health':
                with state.cond:
                    oldest = state.ring[0]['seq'] if state.ring else None
                    h = {'ok': True, 'version': VERSION, 'instance': state.instance,
                         'seq': state.seq, 'oldest_seq': oldest,
                         'ring_max': state.ring_max, 'clients': state.clients,
                         'monotonic_ns': str(time.monotonic_ns()),
                         'durable': False}
                return self._json(200, h)
            if u.path == '/events':
                if not with_body:
                    return self._json(405, {'ok': False, 'error': 'use GET'})
                return self._events(u)
            return self._static(u.path, with_body)

        def _static(self, path, with_body):
            p = unquote(path)
            if p in ('', '/'):
                p = '/index.html'
            rel = p.lstrip('/')
            parts = rel.split('/')
            if any(x in ('', '.', '..') or x.startswith('.') or '\\' in x for x in parts):
                return self._json(404, {'ok': False, 'error': 'not found'})
            if rel in BLOCKED:
                return self._json(404, {'ok': False,
                                        'error': 'service worker disabled on local ball_live server'})
            full = os.path.realpath(os.path.join(root, *parts))
            if os.path.commonpath([full, root]) != root or not os.path.isfile(full):
                return self._json(404, {'ok': False, 'error': 'not found'})
            ctype = TYPES.get(os.path.splitext(full)[1].lower())
            if ctype is None:
                return self._json(404, {'ok': False, 'error': 'not found'})
            with open(full, 'rb') as f:
                data = f.read()
            self.send_response(200)
            self.send_header('Content-Type', ctype)
            self.send_header('Content-Length', str(len(data)))
            self._common()
            self.end_headers()
            if with_body:
                self.wfile.write(data)

        # ------------------------------------------------------------- SSE
        def _events(self, u):
            raw = self.headers.get('Last-Event-ID')
            if raw is None:
                q = parse_qs(u.query).get('cursor')
                raw = q[0] if q else None
            cursor, bad_cursor = None, False
            if raw is not None:
                try:
                    cursor = int(raw)
                    if cursor < 0:
                        raise ValueError
                except ValueError:
                    cursor, bad_cursor = None, True

            with state.cond:
                S = state.seq
                gen = state.drop_gen
                replay, gap = [], None
                if bad_cursor:
                    gap = {'from': None, 'to': None, 'reason': 'invalid_cursor'}
                elif cursor is not None:
                    if cursor > S:
                        gap = {'from': None, 'to': None, 'reason': 'cursor_ahead_server_restarted'}
                    else:
                        oldest = state.ring[0]['seq'] if state.ring else S + 1
                        if cursor < oldest - 1:
                            gap = {'from': cursor + 1, 'to': oldest - 1, 'reason': 'ring_evicted'}
                        replay = [r for r in state.ring if r['seq'] > cursor]
                state.clients += 1
                clients = state.clients
            emit({'event': 'SSE_OPEN', 'cursor': cursor, 'replay': len(replay),
                  'gap': gap, 'clients': clients})

            def send(text):
                self.wfile.write(text.encode('utf-8'))
                self.wfile.flush()

            def msg(name, data, eid=None):
                s = ('id: %d\n' % eid) if eid is not None else ''
                s += 'event: %s\ndata: %s\n\n' % (
                    name, json.dumps(data, ensure_ascii=True, separators=(',', ':')))
                send(s)

            reason = 'client_gone'
            try:
                self.send_response(200)
                self.send_header('Content-Type', 'text/event-stream; charset=utf-8')
                self.send_header('X-Accel-Buffering', 'no')
                self._common()
                self.end_headers()
                send('retry: %d\n\n' % RETRY_MS)
                if gap:
                    msg('gap', gap)
                for r in replay:
                    msg('ag', r, r['seq'])
                msg('hello', {'version': VERSION, 'instance': state.instance, 'seq': S,
                              'replayed': len(replay), 'heartbeat_s': HEARTBEAT_S,
                              'durable': False,
                              'monotonic_ns': str(time.monotonic_ns())}, S)
                last = S
                while True:
                    with state.cond:
                        state.cond.wait_for(
                            lambda: state.seq > last or state.drop_gen != gen,
                            timeout=HEARTBEAT_S)
                        if state.drop_gen != gen:
                            reason = 'dropped_by_debug_endpoint'
                            break
                        cur = state.seq
                        new = [r for r in state.ring if r['seq'] > last]
                    if cur > last:
                        if not new or new[0]['seq'] > last + 1:
                            msg('gap', {'from': last + 1,
                                        'to': (new[0]['seq'] - 1) if new else cur,
                                        'reason': 'ring_evicted_slow_viewer'})
                        for r in new:
                            msg('ag', r, r['seq'])
                        last = cur
                    else:
                        msg('heartbeat', {'seq': cur, 'monotonic_ns': str(time.monotonic_ns())})
            except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError, OSError):
                pass
            finally:
                with state.cond:
                    state.clients -= 1
                    clients = state.clients
                emit({'event': 'SSE_CLOSE', 'reason': reason, 'clients': clients})

        # ------------------------------------------------------------ POST
        def do_POST(self):
            if not self._host_ok():
                return self._json(421, {'ok': False, 'error': 'host not allowed'})
            path = urlsplit(self.path).path
            if path == '/ingest':
                return self._ingest()
            if path == '/debug/drop-streams':
                return self._drop()
            return self._json(404, {'ok': False, 'error': 'not found'})

        def _ingest(self):
            # Read the bounded body first so an early 401 is not turned into
            # a connection reset by unread request bytes.
            raw, err = self._read_body()
            if err:
                return self._json(err[0], {'ok': False, 'error': err[1]})
            if not self._auth():
                emit({'event': 'INGEST_REJECTED', 'reason': 'auth'})
                return self._json(401, {'ok': False, 'error': 'invalid or missing ingest token'})
            ctype = self.headers.get('Content-Type', '').split(';')[0].strip().lower()
            if ctype != 'application/json':
                return self._json(415, {'ok': False, 'error': 'content-type must be application/json'})
            try:
                obj = json.loads(raw.decode('utf-8'))
            except (UnicodeDecodeError, ValueError):
                emit({'event': 'INGEST_REJECTED', 'reason': 'invalid JSON'})
                return self._json(400, {'ok': False, 'error': 'invalid JSON'})
            ev, verr = validate(obj)
            if verr:
                emit({'event': 'INGEST_REJECTED', 'reason': verr})
                return self._json(400, {'ok': False, 'error': verr})
            now_ns = time.monotonic_ns()
            wall_ms = int(time.time() * 1000)
            with state.cond:
                if ev['id'] in state.ids:
                    seq, dup = state.ids[ev['id']], True
                else:
                    state.seq += 1
                    seq, dup = state.seq, False
                    rec = dict(ev)
                    rec.update(seq=seq, version=VERSION, server_instance=state.instance,
                               server_received_monotonic_ns=str(now_ns),
                               server_received_wall_ms=wall_ms)
                    state.ring.append(rec)
                    state.ids[ev['id']] = seq
                    state.id_order.append(ev['id'])
                    while len(state.id_order) > ID_MEMORY:
                        state.ids.pop(state.id_order.popleft(), None)
                    state.cond.notify_all()
                clients = state.clients
            emit({'event': 'INGEST', 'id': ev['id'], 'seq': seq, 'duplicate': dup,
                  'run_id': ev['run_id'], 'kind': ev['kind'], 'actor': ev['actor'],
                  'source_evidence': ev['source_evidence'],
                  'source_tool_id': ev['source_tool_id'], 'clients': clients,
                  'monotonic_ns': str(now_ns)})
            return self._json(200 if dup else 201, {
                'ok': True, 'duplicate': dup, 'id': ev['id'], 'seq': seq,
                'clients': clients, 'server_received_monotonic_ns': str(now_ns)})

        def _drop(self):
            """TEST-ONLY: close all open SSE streams so viewers must reconnect."""
            _, err = self._read_body()
            if err:
                return self._json(err[0], {'ok': False, 'error': err[1]})
            if not self._auth():
                return self._json(401, {'ok': False, 'error': 'invalid or missing ingest token'})
            with state.cond:
                state.drop_gen += 1
                n = state.clients
                state.cond.notify_all()
            emit({'event': 'DEBUG_DROP_STREAMS', 'clients': n})
            return self._json(200, {'ok': True, 'dropped_streams': n})

    return Handler


def _raise_interrupt(signum, frame):
    raise KeyboardInterrupt()


def main(argv=None):
    global _log_file
    here = os.path.dirname(os.path.abspath(__file__))
    ap = argparse.ArgumentParser(description='AG-BALL-LIVE-001 local live server (' + VERSION + ')')
    ap.add_argument('--port', type=int, default=0, help='0 = pick a free port (default)')
    ap.add_argument('--root', default=os.path.join(here, '..', '..', 'feld'),
                    help='directory with the pinned ORIGINAL feld files')
    ap.add_argument('--log-file', default=None,
                    help='write log lines after READY to this file instead of stdout')
    args = ap.parse_args(argv)

    def fail(msg):
        _write({'event': 'ERROR', 'version': VERSION, 'error': msg}, force_stdout=True)
        return 2

    if not 0 <= args.port <= 65535:
        return fail('port out of range')
    token = os.environ.get('BALL_INGEST_TOKEN', '')
    if len(token) < 16:
        return fail('BALL_INGEST_TOKEN missing or shorter than 16 characters')
    try:
        ring_max = int(os.environ.get('BALL_RING_MAX', '1000'))
    except ValueError:
        return fail('BALL_RING_MAX must be an integer')
    if not 1 <= ring_max <= 100000:
        return fail('BALL_RING_MAX must be 1..100000')

    root = os.path.realpath(args.root)
    for name in ('index.html', 'live.js'):
        p = os.path.join(root, name)
        try:
            with open(p, 'rb') as f:
                data = f.read()
        except OSError as e:
            return fail('cannot read %s: %s' % (p, e))
        if VERSION.encode('ascii') not in data:
            return fail('version marker %s missing in %s: refusing mixed versions' % (VERSION, p))

    if args.log_file:
        _log_file = open(args.log_file, 'a', encoding='utf-8')

    state = State(ring_max)
    port_holder = [0]
    srv = ThreadingHTTPServer(('127.0.0.1', args.port),
                              make_handler(state, root, token, port_holder))
    srv.daemon_threads = True
    port = srv.server_address[1]
    port_holder[0] = port
    base = 'http://127.0.0.1:%d' % port
    _write({'event': 'READY', 'version': VERSION, 'base': base,
            'url': base + '/index.html?ball_live=1', 'port': port,
            'pid': os.getpid(), 'instance': state.instance, 'ring_max': ring_max,
            'durable': False, 'root': root,
            'monotonic_ns': str(time.monotonic_ns()),
            'wall_ms': int(time.time() * 1000)}, force_stdout=True)
    signal.signal(signal.SIGTERM, _raise_interrupt)
    try:
        srv.serve_forever(poll_interval=0.25)
    except KeyboardInterrupt:
        pass
    finally:
        srv.server_close()
        emit({'event': 'STOPPED'})
    return 0


if __name__ == '__main__':
    sys.exit(main())
