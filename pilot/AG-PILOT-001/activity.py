"""AG-PILOT-001 activity derivation (pure, evidence based, LOCAL prototype).

Partial connection only: this module derives per agent/session/task states from
explicit collector observations. It does NOT capture runtime activity, does not
call providers/LLMs/network and never infers unknown times, models or costs.

Exact signature (for independent tests):

    derive(observations, *, now, fresh_ms) -> list[dict]

* observations: list of observation dicts (see README, schema
  'agentarium.activity-observations.v1'). List order is the observation order
  within one (agent, session_id, task_id); an observation older than the previous
  accepted one of the SAME key is rejected (diagnostic), never re-sorted.
* now: timezone-aware datetime or ISO-8601 string WITH zone (explicit instant).
* fresh_ms: int > 0 (bool rejected). Test configuration, NOT a realtime/SLA claim.
* raises ValueError for malformed now / fresh_ms / non-list observations.
* returns JSON-compatible rows sorted by ROSTER order, then session_id, task_id.
  Row keys: agent, session_id, task_id, state, reason, last_evidence_at,
  evidence_ref, delta, outcome, problem, diagnostics.
  state in: working_observed | waiting | blocked | stopped | unknown.

Clock: observed_at is the collector observation time, not a guaranteed event time.
Future timestamps (> now) and backwards timestamps (same key) are rejected, so a
negative age can never occur.
"""
import json
from datetime import datetime, timezone

SCHEMA = 'agentarium.activity-observations.v1'
DATA_KINDS = ('OBSERVED', 'SYNTHETIC')
SIGNALS = ('host_received', 'stream_sample', 'source_waiting', 'source_blocked',
           'source_resumed', 'execution_stopped', 'transport_heartbeat')
OUTCOMES = ('success', 'failed', 'aborted')
# Complete eight-agent roster (canonical lowercase register keys). Known names are
# matched case-insensitively and normalized to the canonical id. Unknown names keep
# their own row and never replace a registered default row.
ROSTER = ('atlas', 'nova', 'scout', 'archibald', 'forge', 'argus', 'sentinel', 'cadence')
# Only a positive delta of these counters can prove work (never last_event_seconds
# alone, never system/progress_timer/telemetry_failure/invalid_line/other counters).
WORK_COUNTERS = ('stream_event', 'assistant', 'user')


def _canon(name):
    if isinstance(name, str):
        low = name.strip().lower()
        if low in ROSTER:
            return low
    return name


def parse_ts(value):
    """Return aware UTC datetime; ValueError if malformed or zone missing."""
    if isinstance(value, datetime):
        d = value
    elif isinstance(value, str) and value.strip():
        s = value.strip()
        if s[-1] in 'Zz':
            s = s[:-1] + '+00:00'
        try:
            d = datetime.fromisoformat(s)
        except ValueError:
            raise ValueError('Zeitstempel nicht ISO-8601: %r' % value)
        if 'T' not in s and ' ' not in s:
            raise ValueError('Zeitstempel ohne Uhrzeit: %r' % value)
    else:
        raise ValueError('Zeitstempel fehlt oder ist kein Text')
    if d.tzinfo is None or d.utcoffset() is None:
        raise ValueError('Zeitstempel ohne Zeitzone: %r' % (value,))
    return d.astimezone(timezone.utc)


def iso(d):
    return d.astimezone(timezone.utc).isoformat().replace('+00:00', 'Z') if d else None


def _text(o, k):
    v = o.get(k)
    if not isinstance(v, str) or not v.strip():
        raise ValueError('%s fehlt oder leer' % k)
    return v


def _num(v, name):
    if isinstance(v, bool) or not isinstance(v, (int, float)) or v != v or v < 0:
        raise ValueError('%s muss Zahl >= 0 sein' % name)
    return v


def _validate(o):
    if not isinstance(o, dict):
        raise ValueError('Beobachtung ist kein Objekt')
    c = {'id': _text(o, 'id'), 'agent': _canon(_text(o, 'agent')),
         'session_id': _text(o, 'session_id'), 'task_id': _text(o, 'task_id')}
    try:
        c['at'] = parse_ts(o.get('observed_at'))
    except ValueError as exc:
        raise ValueError('observed_at: %s' % exc)
    if not isinstance(o.get('evidence_ref'), str) or not o['evidence_ref'].strip():
        raise ValueError('evidence_ref fehlt oder leer (kein Zustandsnachweis)')
    c['ref'] = o['evidence_ref']
    sig = o.get('signal')
    if sig not in SIGNALS:
        raise ValueError('signal unbekannt: %r' % (sig,))
    c['signal'] = sig
    if sig == 'stream_sample':
        ec = o.get('event_counts')
        if not isinstance(ec, dict) or not ec:
            raise ValueError('event_counts fehlt')
        for k, v in ec.items():
            if not isinstance(k, str) or isinstance(v, bool) or not isinstance(v, int) or v < 0:
                raise ValueError('event_counts enthaelt ungueltigen Wert')
        c['counts'] = dict(ec)
        c['last'] = _num(o.get('last_event_seconds'), 'last_event_seconds')
        c['elapsed'] = _num(o.get('elapsed_seconds'), 'elapsed_seconds')
        if c['last'] > c['elapsed']:
            raise ValueError('last_event_seconds > elapsed_seconds')
        # event_counts are ints >= 0 (checked above, hence finite); times must be finite
        for k in ('last', 'elapsed'):
            if c[k] == float('inf'):
                raise ValueError('%s nicht endlich' % k)
    elif sig in ('source_waiting', 'source_blocked'):
        c['reason'] = _text(o, 'reason')
    elif sig == 'execution_stopped':
        if o.get('outcome') not in OUTCOMES:
            raise ValueError('outcome muss success|failed|aborted sein')
        c['outcome'] = o['outcome']
    return c


def _check_fresh(fresh_ms):
    if isinstance(fresh_ms, bool) or not isinstance(fresh_ms, int) or fresh_ms <= 0:
        raise ValueError('fresh_ms muss ganze Zahl > 0 sein')


def _new_rec():
    return {'ids': set(), 'last_at': None, 'sample': None, 'work': None, 'hold': None,
            'terminal': None, 'transport_at': None, 'diag': [],
            'evidence_at': None, 'ref': None}


def _apply(rec, c):
    sig, at = c['signal'], c['at']
    if sig in ('host_received', 'transport_heartbeat'):
        rec['transport_at'] = at  # never renews work, never a state claim
    elif sig == 'stream_sample':
        prev = rec['sample']
        cur = {'counts': c['counts'], 'last': c['last'], 'elapsed': c['elapsed']}
        delta = None
        if prev is not None:
            if c['elapsed'] < prev['elapsed'] or any(
                    c['counts'].get(k, 0) < prev['counts'].get(k, 0) for k in WORK_COUNTERS):
                rec['diag'].append('%s: Zaehler/Zeitbasis zurueckgesetzt, neue Basismessung' % c['id'])
            else:
                inc = {k: c['counts'][k] - prev['counts'].get(k, 0) for k in WORK_COUNTERS
                       if k in c['counts'] and c['counts'][k] > prev['counts'].get(k, 0)}
                lev = c['last'] > prev['last']
                # last_event_seconds alone never proves work (metadata also updates it)
                if inc:
                    delta = {'counters': inc,
                             'last_event_seconds': {'from': prev['last'], 'to': c['last']} if lev else None,
                             'elapsed_seconds': {'from': prev['elapsed'], 'to': c['elapsed']}}
        rec['sample'] = cur
        if delta:
            rec['work'] = {'at': at, 'event_age': c['elapsed'] - c['last'],
                           'delta': delta, 'ref': c['ref']}
            rec['evidence_at'], rec['ref'] = at, c['ref']
    elif sig in ('source_waiting', 'source_blocked'):
        rec['hold'] = {'kind': 'waiting' if sig == 'source_waiting' else 'blocked',
                       'reason': c['reason'], 'at': at, 'ref': c['ref']}
        rec['evidence_at'], rec['ref'] = at, c['ref']
    elif sig == 'source_resumed':
        rec['hold'] = None  # not work proof; also clears old work evidence
        rec['work'] = None  # a subsequent positive work delta is required
        rec['evidence_at'], rec['ref'] = at, c['ref']
    elif sig == 'execution_stopped':
        rec['terminal'] = {'outcome': c['outcome'], 'at': at, 'ref': c['ref']}
        rec['evidence_at'], rec['ref'] = at, c['ref']


def _row(agent, sid, tid, rec, now, fresh_ms):
    r = {'agent': agent, 'session_id': sid, 'task_id': tid, 'state': 'unknown',
         'reason': '', 'last_evidence_at': iso(rec['evidence_at']) if rec else None,
         'evidence_ref': rec['ref'] if rec else None, 'delta': None, 'outcome': None,
         'problem': False, 'diagnostics': list(rec['diag']) if rec else [],
         'remaining_valid_ms': 0}
    if rec is None:
        r['reason'] = 'Keine Quelle angebunden / keine Beobachtung'
        return r
    t, h, w = rec['terminal'], rec['hold'], rec['work']
    if t:  # terminal conclusion, distinct from any stale active/waiting evidence
        r.update(state='stopped', outcome=t['outcome'], problem=t['outcome'] != 'success',
                 last_evidence_at=iso(t['at']), evidence_ref=t['ref'],
                 reason='Ausfuehrung beendet (%s); Aufgabe nicht als erledigt gesetzt' % t['outcome'],
                 remaining_valid_ms=None)
        return r
    if h:  # explicit hold is authoritative until source_resumed or terminal
        age = (now - h['at']).total_seconds() * 1000
        if age <= fresh_ms:
            r.update(state=h['kind'], reason=h['reason'], last_evidence_at=iso(h['at']),
                     evidence_ref=h['ref'], problem=h['kind'] == 'blocked',
                     remaining_valid_ms=int(max(0, fresh_ms - age)))
            return r
        r['diagnostics'].append('%s-Signal aelter als %d ms: veraltet' % (h['kind'], fresh_ms))
        r.update(last_evidence_at=iso(h['at']), evidence_ref=h['ref'],
                 reason='Warte-/Blockiersignal veraltet: unbekannt')
        return r
    if w:
        age = (now - w['at']).total_seconds() * 1000 + w['event_age'] * 1000
        if age <= fresh_ms:
            r.update(state='working_observed', delta=w['delta'], last_evidence_at=iso(w['at']),
                     evidence_ref=w['ref'],
                     reason='Zaehlerfortschritt zwischen zwei Messungen, Quellereignis frisch',
                     remaining_valid_ms=int(max(0, fresh_ms - age)))
            return r
        r.update(delta=w['delta'], last_evidence_at=iso(w['at']), evidence_ref=w['ref'],
                 reason='Arbeitsnachweis veraltet (aelter als %d ms): unbekannt' % fresh_ms)
        return r
    if rec['sample']:
        r['reason'] = 'Nur Basismessung oder unveraenderte Messung: kein Arbeitsnachweis'
    elif rec['transport_at']:
        r['reason'] = 'Nur Empfang/Transport belegt: kein Arbeitsnachweis'
    else:
        r['reason'] = 'Kein Nachweis'
    return r


def derive(observations, *, now, fresh_ms):
    now_dt = parse_ts(now)
    _check_fresh(fresh_ms)
    if not isinstance(observations, (list, tuple)):
        raise ValueError('observations muss eine Liste sein')
    recs, agent_diag = {}, {}
    for i, o in enumerate(observations):
        try:
            c = _validate(o)
        except ValueError as exc:
            a = o.get('agent') if isinstance(o, dict) else None
            a = _canon(a) if isinstance(a, str) and a.strip() else '(unbekannt)'
            oid = o.get('id') if isinstance(o, dict) else None
            agent_diag.setdefault(a, []).append('Beobachtung #%d (%s) verworfen: %s' % (i, oid, exc))
            continue
        key = (c['agent'], c['session_id'], c['task_id'])
        if c['at'] > now_dt:
            agent_diag.setdefault(c['agent'], []).append(
                'Beobachtung %s liegt nach Bezugszeit (Zukunft), verworfen' % c['id'])
            continue
        rec = recs.setdefault(key, _new_rec())
        if c['id'] in rec['ids']:
            rec['diag'].append('%s: doppelte id, verworfen' % c['id'])
            continue
        if rec['last_at'] and c['at'] < rec['last_at']:
            rec['diag'].append('%s: Zeit rueckwaerts innerhalb Session/Task, verworfen' % c['id'])
            continue
        rec['ids'].add(c['id'])
        rec['last_at'] = c['at']
        if rec['terminal']:
            rec['diag'].append('%s: nach Abschluss ignoriert (terminal)' % c['id'])
            continue
        _apply(rec, c)
    rows = [_row(a, s, t, rec, now_dt, fresh_ms) for (a, s, t), rec in recs.items()]
    have = {r['agent'] for r in rows}
    for a in set(ROSTER) | set(agent_diag):
        if a not in have:
            rows.append(_row(a, None, None, None, now_dt, fresh_ms))
    # diagnostics of rejected observations go on the agent's first row
    for a, d in agent_diag.items():
        first = next((r for r in rows if r['agent'] == a), None)
        if first is not None:
            first['diagnostics'] += d

    def order(r):
        ai = ROSTER.index(r['agent']) if r['agent'] in ROSTER else len(ROSTER)
        return (ai, r['agent'], r['session_id'] or '', r['task_id'] or '')
    rows.sort(key=order)
    return rows


def load_observations(path):
    """Return (data_kind, observations, errors). Never raises."""
    try:
        with open(path, 'rb') as fh:
            doc = json.loads(fh.read().decode('utf-8'))
    except (OSError, ValueError) as exc:
        return None, [], ['activity-input nicht lesbar/ungueltig: %s' % exc]
    if not isinstance(doc, dict) or doc.get('schema') != SCHEMA:
        return None, [], ['schema muss %r sein' % SCHEMA]
    if doc.get('data_kind') not in DATA_KINDS:
        return None, [], ['data_kind muss OBSERVED oder SYNTHETIC sein']
    obs = doc.get('observations')
    if not isinstance(obs, list):
        return doc['data_kind'], [], ['observations muss eine Liste sein']
    return doc['data_kind'], obs, []


def build_response(path, fresh_ms, *, at=None, now=None):
    """Document for GET /activity. at=None -> LIVE vs. current UTC; else ARCHIVE replay.
    Raises ValueError if `at` is malformed (caller answers 400)."""
    errors, kind, obs = [], None, []
    if path:
        kind, obs, errors = load_observations(path)
    if at is not None:
        ref = parse_ts(at)
        mode = 'ARCHIVE'
        kept = []
        for o in obs:
            try:
                if parse_ts(o.get('observed_at')) > ref:
                    continue  # after replay instant: ignored
            except (ValueError, AttributeError):
                pass  # malformed stays and yields a diagnostic
            kept.append(o)
        obs = kept
    else:
        ref = parse_ts(now) if now is not None else datetime.now(timezone.utc)
        mode = 'LIVE'
    rows = derive(obs, now=ref, fresh_ms=fresh_ms if fresh_ms else 1)
    return {
        'mode': mode, 'replay_at': iso(ref) if mode == 'ARCHIVE' else None,
        'now': iso(ref), 'data_kind': kind,
        'provenance': {'source': 'activity-input file' if path else None,
                       'clock': 'Kollektor-Beobachtungszeit, nicht garantierte Ereigniszeit',
                       'no_aging_by_wall_clock': mode == 'ARCHIVE'},
        'source_errors': errors,
        'configured_fresh_ms': fresh_ms if path else None,
        'fresh_ms_note': 'Testkonfiguration, keine Echtzeit-/SLA-Zusage',
        'coverage': {'status': 'partial_unconnected',
                     'note': 'Teilanbindung: nur Agenten/Signale aus der Eingabedatei; '
                             'keine vollstaendige Laufzeiterfassung'},
        'kosten': {'sichtbar': True, 'status_text': 'Kosten nicht vollständig ermittelbar.'},
        'rows': rows,
    }
