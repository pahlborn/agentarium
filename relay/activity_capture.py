"""Opt-in, metadata-only activity capture for one Claude CLI worker run.

Writes JSON consumable by pilot/AG-PILOT-001/activity.py
(schema 'agentarium.activity-observations.v1', data_kind 'OBSERVED').

Lifecycle (called by relay.claude_stream_diagnostics.run_stream, all guarded):

    rec = ActivityRecorder(path, agent='forge', task_id=..., evidence_ref=...,
                           sample_interval=2.0, max_observations=2000)
    rec.on_start()                              # after successful Popen
    rec.on_event(kind, relevant, session_id)    # per parsed provider event
    rec.on_tick()                               # loop tick; flushes coalesced sample
    rec.on_finish(outcome)                      # success | failed | aborted (idempotent)

Only event type labels, counters, timings and a validated provider session_id are
seen/retained. No prompt, text, thinking, tool result, secret or per-token record.
Public methods never raise; failures only increment sanitized counters.
"""
import json
import os
import threading
import time
import uuid
from datetime import datetime, timezone

SCHEMA = 'agentarium.activity-observations.v1'
OUTCOMES = ('success', 'failed', 'aborted')
COUNTERS = ('assistant', 'user', 'stream_event')
_SID_CHARS = '0123456789abcdef-'


def valid_session_id(value):
    return isinstance(value, str) and 0 < len(value) <= 80 and all(c in _SID_CHARS for c in value.lower())


def _utc_now():
    dt = datetime.now(timezone.utc)
    return dt.replace(microsecond=dt.microsecond // 1000 * 1000)


def _iso(dt):
    return dt.isoformat(timespec='milliseconds').replace('+00:00', 'Z')


def _guard(fn):
    def wrapper(self, *args, **kwargs):
        try:
            with self._lock:
                return fn(self, *args, **kwargs)
        except Exception:
            try:
                self._errors += 1
            except Exception:
                pass
            return None
    wrapper.__name__ = fn.__name__
    wrapper.__doc__ = fn.__doc__
    return wrapper


class ActivityRecorder:
    def __init__(self, path, *, agent, task_id, evidence_ref, sample_interval=2.0, max_observations=2000):
        if not isinstance(path, (str, os.PathLike)):
            raise ValueError('path must be str or PathLike')
        for name, val in (('agent', agent), ('task_id', task_id), ('evidence_ref', evidence_ref)):
            if not isinstance(val, str) or not val.strip():
                raise ValueError('%s must be non-empty text' % name)
        if isinstance(sample_interval, bool) or not isinstance(sample_interval, (int, float)) or sample_interval < 0:
            raise ValueError('sample_interval must be a number >= 0')
        if isinstance(max_observations, bool) or not isinstance(max_observations, int) or max_observations < 3:
            raise ValueError('max_observations must be an int >= 3')
        self._path = os.fspath(path)
        self._agent = agent.strip().lower()
        self._task = task_id
        self._ref = evidence_ref
        self._interval = float(sample_interval)
        self._max = max_observations
        self._lock = threading.RLock()
        self._token = uuid.uuid4().hex[:8]
        self._seq = 0
        self._obs = []
        self._dropped = 0
        self._counts = {k: 0 for k in COUNTERS}
        self._last_rel = None
        self._session = None
        self._conflicts = 0
        self._pending = False
        self._first_sent = False
        self._last_sample_mono = 0.0
        self._last_at = None
        self._t0 = None
        self._started_at = None
        self._finished_at = None
        self._outcome = None
        self._terminal = False
        self._errors = 0
        self._write_failures = 0

    @property
    def failures(self):
        """Sanitized counters only (no exception text)."""
        return {'capture_errors': self._errors, 'write_failures': self._write_failures}

    # ---- lifecycle -------------------------------------------------------
    @_guard
    def on_start(self):
        if self._t0 is not None:
            return
        self._t0 = time.monotonic()
        self._started_at = _utc_now()
        self._write()

    @_guard
    def on_event(self, kind, relevant=False, session_id=None):
        if self._terminal or self._t0 is None:
            return
        el = self._elapsed()
        relevant = relevant is True and kind in COUNTERS
        if relevant:
            self._counts[kind] += 1
            self._last_rel = el
            self._pending = True
        if kind in ('system', 'result') and valid_session_id(session_id):
            self._bind(session_id, el)
        if relevant and self._session is not None:
            if (not self._first_sent) or time.monotonic() - self._last_sample_mono >= self._interval:
                self._first_sent = True
                self._emit_sample(el)
                self._write()

    @_guard
    def on_tick(self):
        if self._terminal or self._t0 is None or self._session is None or not self._pending:
            return
        if time.monotonic() - self._last_sample_mono >= self._interval:
            self._emit_sample(self._elapsed())
            self._write()

    @_guard
    def on_finish(self, outcome='failed'):
        if self._terminal or self._t0 is None:
            return
        if outcome not in OUTCOMES:
            outcome = 'failed'
        el = self._elapsed()
        if self._session is not None:
            if self._pending:
                self._emit_sample(el)  # bounded final progress flush
            obs = self._base('execution_stopped')
            obs['outcome'] = outcome
            self._append(obs, final=True)
        self._terminal = True
        self._outcome = outcome
        self._finished_at = _utc_now()
        self._write()

    # ---- internals -------------------------------------------------------
    def _elapsed(self):
        return round(time.monotonic() - self._t0, 3)

    def _bind(self, sid, el):
        if self._session is None:
            self._session = sid
            self._emit_sample(el)  # baseline with then-current actual counters
            self._write()
        elif sid != self._session:
            self._conflicts += 1  # never switch identity; make it visible
            if self._conflicts == 1:
                self._write()

    def _base(self, signal):
        at = _utc_now()
        if self._last_at is not None and at < self._last_at:
            at = self._last_at  # keep observed_at monotone
        self._last_at = at
        self._seq += 1
        return {'id': 'obs-%s-%05d' % (self._token, self._seq), 'agent': self._agent,
                'session_id': self._session, 'task_id': self._task,
                'observed_at': _iso(at), 'evidence_ref': self._ref, 'signal': signal}

    def _emit_sample(self, el):
        obs = self._base('stream_sample')
        last = self._last_rel if self._last_rel is not None else 0.0
        obs['event_counts'] = dict(self._counts)
        obs['last_event_seconds'] = min(last, el)
        obs['elapsed_seconds'] = el
        self._append(obs)
        self._pending = False
        self._last_sample_mono = time.monotonic()

    def _append(self, obs, final=False):
        # Pin the baseline (index 0); reserve one slot for the terminal observation.
        limit = self._max if final else self._max - 1
        while len(self._obs) >= limit and len(self._obs) > 1:
            self._obs.pop(1)
            self._dropped += 1
        self._obs.append(obs)

    def _document(self):
        gaps = []
        if self._session is None:
            gaps.append('no_provider_session_established: unbound process metadata only')
        if self._conflicts:
            gaps.append('provider_session_conflict: later differing session ids ignored')
        if self._dropped:
            gaps.append('observations_pruned: history incomplete')
        if self._write_failures or self._errors:
            gaps.append('recorder_failures: file may be stale or incomplete')
        return {
            'schema': SCHEMA,
            'data_kind': 'OBSERVED',
            'capture': {
                'collector': 'relay.activity_capture',
                'mode': 'metadata_only',
                'coverage': 'partial',
                'agent': self._agent,
                'task_id': self._task,
                'session_established': self._session is not None,
                'process_started_at': _iso(self._started_at) if self._started_at else None,
                'process_finished_at': _iso(self._finished_at) if self._finished_at else None,
                'process_outcome': self._outcome,
                'sample_interval_seconds': self._interval,
                'sample_interval_note': 'local configuration, not an end-to-end latency guarantee',
                'max_observations': self._max,
                'observations_dropped': self._dropped,
                'truncated': self._dropped > 0,
                'history_complete': self._dropped == 0,
                'session_conflicts': self._conflicts,
                'coverage_gaps': gaps,
                'failure_counters': self.failures,
                'delivery': 'local file only; no automatic GitHub-to-browser live delivery',
            },
            'observations': list(self._obs),
        }

    def _write(self):
        tmp = self._path + '.tmp'
        try:
            parent = os.path.dirname(self._path)
            if parent:
                os.makedirs(parent, exist_ok=True)
            with open(tmp, 'w', encoding='utf-8') as fh:
                json.dump(self._document(), fh, separators=(',', ':'))
                fh.flush()
            os.replace(tmp, self._path)
        except Exception:
            self._write_failures += 1
            try:
                os.unlink(tmp)
            except Exception:
                pass
