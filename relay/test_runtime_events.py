"""Free offline checks. Fixtures are synthetic, never runtime/CLI evidence."""
import copy
import hashlib
import io
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import urllib.error
import zipfile

import claude_public_relay_v2 as driver
import claude_runtime_events as runtime

SESSION = '12345678-1234-1234-1234-123456789abc'


def context(role='coding-agent'):
    task = 'AG-TEST-0001'
    return {'repository': driver.REPO, 'head': 'b' * 40, 'source_commit': 'a' * 40,
            'run_id': '42', 'run_attempt': '1',
            'activation': {'task_id': task, 'role': role, 'handback': 'handoffs/result.md'},
            'request': {'runtime': {'schema': 'agentarium.relay-runtime-identity.v1',
                'project_id': 'agentarium', 'run_id': 'AG-RUN-0001', 'task_id': task,
                'parent_id': 'AG-PARENT-0001', 'subject_role': runtime.ROLE_MAP[role]}}}


def activity(partial=True):
    if partial:
        return {'type': 'stream_event', 'session_id': SESSION,
                'event': {'type': 'content_block_delta', 'delta': {'type': 'text_delta', 'text': 'synthetic'}}}
    return {'type': 'assistant', 'session_id': SESSION,
            'message': {'role': 'assistant', 'id': 'msg_fixture',
                        'content': [{'type': 'text', 'text': 'synthetic'}],
                        'usage': {'input_tokens': 4, 'output_tokens': 2}}}


def observation(phase='start'):
    with tempfile.TemporaryDirectory() as tmp:
        obs = runtime.Observer(context(), Path(tmp))
        obs.feed(activity())
        if phase == 'end':
            obs.worker_state = 'stopped'
            obs.signal = 'process_exit'
            obs.finish(False, 'passed')
        return json.loads((Path(tmp) / (phase + '.json')).read_text())


def platform(phase, value=None):
    value = value or observation(phase)
    when = value['observed_at']
    data = io.BytesIO()
    with zipfile.ZipFile(data, 'w') as archive:
        archive.writestr(phase + '.json', json.dumps(value))
    raw = data.getvalue()
    row = {'id': 70 if phase == 'start' else 71, 'name': runtime.artifact_name(context(), phase),
           'size_in_bytes': len(raw), 'digest': 'sha256:' + hashlib.sha256(raw).hexdigest(),
           'created_at': when, 'expired': False, 'workflow_run': {'id': 42, 'head_sha': 'b' * 40}}
    job = {'id': 60, 'run_id': 42, 'run_attempt': 1, 'head_sha': 'b' * 40,
           'status': 'in_progress', 'started_at': '2020-01-01T00:00:00+00:00', 'completed_at': None}
    return row, job, raw


class RuntimeTests(unittest.TestCase):
    def test_normal_and_numeric_snapshots(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            obs = runtime.Observer(context(), root)
            obs.feed(activity(False))
            start = runtime.validate(json.loads((root / 'start.json').read_text()), context())
            self.assertEqual(start['usage'], {'input_tokens': 4, 'output_tokens': 2})
            obs.feed(activity(False))  # repeated blocks of the same message are not added
            self.assertEqual(obs.usage['output_tokens'], 2)
            obs.feed({'type': 'result', 'session_id': SESSION, 'usage': {'output_tokens': 7},
                      'total_cost_usd': .03})
            obs.worker_state, obs.signal = 'stopped', 'process_exit'
            obs.finish(False, 'passed')
            end = runtime.validate(json.loads((root / 'end.json').read_text()), context())
            self.assertEqual(end['start_observed_at'], start['observed_at'])
            self.assertEqual(end['total_cost_usd'], .03)
            self.assertEqual(end['usage'], {'output_tokens': 7})
            self.assertNotIn('synthetic', json.dumps(end))

    def test_no_false_start_from_init_popen_error_or_empty_response(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            obs = runtime.Observer(context(), root)
            for item in ({'type': 'system', 'subtype': 'init', 'session_id': SESSION},
                         {'type': 'result', 'session_id': SESSION, 'is_error': True},
                         dict(activity(False), error='authentication_failed'),
                         {'type': 'stream_event', 'session_id': SESSION,
                          'event': {'type': 'message_start', 'message': {'role': 'assistant'}}},
                         {'type': 'stream_event', 'session_id': SESSION,
                          'event': {'type': 'content_block_delta', 'delta': {'type': 'text_delta', 'text': ''}}}):
                obs.feed(item)
            self.assertFalse((root / 'start.json').exists())
            obs.finish(True, 'unknown')
            end = json.loads((root / 'end.json').read_text())
            self.assertEqual(end['outcome'], 'error_before_activity')
            self.assertIsNone(end['total_cost_usd'])
            false_start = observation()
            false_start['signal'] = 'system_init'
            with self.assertRaises(ValueError):
                runtime.validate(false_start, context())

    def test_error_after_activity_and_safety_preserves_observations(self):
        for safety, outcome in (('passed', 'error_after_activity'), ('blocked', 'safety_blocked')):
            with self.subTest(safety=safety), tempfile.TemporaryDirectory() as tmp:
                root = Path(tmp)
                obs = runtime.Observer(context(), root)
                obs.feed(activity(False))
                obs.feed({'type': 'result', 'session_id': SESSION, 'usage': {'input_tokens': 6},
                          'total_cost_usd': .04, 'is_error': True})
                obs.worker_state = 'stopped'
                obs.finish(True, safety)
                end = json.loads((root / 'end.json').read_text())
                self.assertEqual(end['outcome'], outcome)
                self.assertEqual(end['session_id'], SESSION)
                self.assertEqual(end['total_cost_usd'], .04)
                self.assertEqual(end['usage'], {'input_tokens': 6})
                self.assertTrue((root / 'start.json').exists())

    def test_missing_end_and_unknown_stop_are_not_success(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            obs = runtime.Observer(context(), root)
            obs.feed(activity())
            self.assertFalse((root / 'end.json').exists())
            obs.worker_state = 'unknown'
            obs.finish(True, 'unknown')
            self.assertEqual(json.loads((root / 'end.json').read_text())['outcome'], 'observation_lost')

    def test_roles_attempts_identity_and_legacy(self):
        for role, subject in runtime.ROLE_MAP.items():
            ctx = context(role)
            self.assertEqual(runtime.identity(ctx)['subject_role'], subject)
            payload = driver.ag_host_received(ctx)
            self.assertEqual(json.loads(payload.split('```json\n')[1].split('\n```')[0])['recipient'], subject)
            payload = driver.ag_terminal({'phase': 'result_ready', 'task_id': 'AG-TEST-0001', 'run_id': '42'}, role)
            self.assertEqual(json.loads(payload.split('```json\n')[1].split('\n```')[0])['actor'], subject)
        value = observation()
        for key, forged in (('subject_role', 'cadence'), ('github_run_attempt', '2'),
                            ('run_id', '42'), ('activation_commit', 'c' * 40)):
            changed = copy.deepcopy(value)
            changed[key] = forged
            with self.subTest(key=key), self.assertRaises(ValueError):
                runtime.validate(changed, context())
        ctx = context('spec-agent')
        ctx['request']['runtime']['subject_role'] = 'forge'
        with self.assertRaises(ValueError):
            runtime.identity(ctx)
        ctx = context()
        del ctx['request']['runtime']
        self.assertIsNone(runtime.identity(ctx))
        with patch.object(runtime, 'source_job') as source:
            runtime.publish(ctx, lambda body: self.fail('legacy published runtime'))
            source.assert_not_called()

    def test_tampered_suspicious_or_untyped_payload_rejected(self):
        value = observation()
        for key, bad in (('usage', {'output_tokens': True}), ('usage', {'output_tokens': float('inf')}),
                         ('usage', {'raw': 1}), ('session_id', 'sk-ant-' + 'A' * 40),
                         ('actual_start_unknown', False), ('total_cost_usd', -1)):
            changed = copy.deepcopy(value)
            changed[key] = bad
            with self.subTest(key=key), self.assertRaises((ValueError, OverflowError)):
                runtime.validate(changed, context())
        changed = copy.deepcopy(value)
        changed['raw_stream'] = 'no'
        with self.assertRaises(ValueError):
            runtime.validate(changed, context())

    def test_explicit_host_lifecycle_and_no_terminal_on_unknown_stop(self):
        start = observation()
        row, job, _ = platform('start', start)
        self.assertEqual(runtime.record(start, row, job, 'archive')['kind'], 'started')
        end = observation('end')
        row, job, _ = platform('end', end)
        self.assertEqual(runtime.record(end, row, job, 'archive')['kind'], 'delivered')
        for outcome in ('error_after_activity', 'safety_blocked', 'error_before_activity'):
            failed = dict(end, outcome=outcome)
            if outcome == 'error_before_activity':
                failed['start_observed_at'] = None
                failed['worker_state'] = 'not_launched'
                failed['signal'] = 'supervisor_error'
            runtime.validate(failed, context())
            self.assertEqual(runtime.record(failed, row, job, 'archive')['kind'], 'aborted')
        lost = dict(end, outcome='observation_lost', worker_state='unknown')
        runtime.validate(lost, context())
        self.assertEqual(runtime.record(lost, row, job, 'archive')['kind'], 'observation_lost')
        forged = runtime.record(lost, row, job, 'archive')
        forged['kind'] = 'delivered'
        body = runtime.MARKER + '\n```json\n' + runtime.serialized(forged).decode() + '\n```'
        with patch.object(runtime, 'pages', return_value=[{'body': body, 'user': {'id': 41898282}}]):
            self.assertEqual(runtime.journal(context()), set())

    def test_late_duplicate_and_terminal_prevent_live_label(self):
        self.assertEqual(runtime.select_delivery('start', False, True), 'live_observed')
        self.assertEqual(runtime.select_delivery('start', True, True), 'archive')
        self.assertEqual(runtime.select_delivery('start', False, False), 'archive')
        value = observation()
        row, job, _ = platform('start', value)
        record = runtime.record(value, row, job, 'archive')
        body = runtime.MARKER + '\n```json\n' + runtime.serialized(record).decode() + '\n```'
        rows = [{'body': body, 'user': {'id': 41898282}}] * 2
        with patch.object(runtime, 'pages', return_value=rows):
            self.assertEqual(runtime.journal(context()), {runtime.event_id(value)})
        rows[0] = {'body': body, 'user': {'id': 277496791}}
        rows.pop()
        with patch.object(runtime, 'pages', return_value=rows):
            self.assertEqual(runtime.journal(context()), set())

    def test_archive_digest_and_attempt_counterexample(self):
        value = observation()
        row, job, data = platform('start', value)
        with patch.dict(os.environ, {'GH_TOKEN': 'synthetic-token'}), patch.object(runtime.urllib.request, 'build_opener') as build:
            build.return_value.open.return_value = io.BytesIO(data)
            self.assertEqual(runtime.read_artifact(row, context(), 'start', job), value)
            wrong = dict(row, digest='sha256:' + '0' * 64)
            build.return_value.open.return_value = io.BytesIO(data)
            with self.assertRaisesRegex(ValueError, 'digest mismatch'):
                runtime.read_artifact(wrong, context(), 'start', job)
            forged = copy.deepcopy(value)
            forged['github_run_attempt'] = '2'
            forged_row, _, forged_data = platform('start', forged)
            build.return_value.open.return_value = io.BytesIO(forged_data)
            with self.assertRaisesRegex(ValueError, 'identity/schema'):
                runtime.read_artifact(forged_row, context(), 'start', job)

    def test_platform_upper_bounds_match_delivered_timestamp_precision(self):
        cases = (
            ('2020-01-01T14:38:16.947000+00:00', '2020-01-01T14:38:16Z', '2020-01-01T14:38:16Z', True),
            ('2020-01-01T14:38:17.000000+00:00', '2020-01-01T14:38:16Z', None, False),
            ('2020-01-01T14:38:17.000000+00:00', '2020-01-01T14:38:17Z', '2020-01-01T14:38:16Z', False),
            ('2020-01-01T14:38:16.947999+00:00', '2020-01-01T14:38:16.947Z', None, True),
            ('2020-01-01T14:38:16.948000+00:00', '2020-01-01T14:38:16.947Z', None, False),
        )
        for when, created, completed, accepted in cases:
            with self.subTest(when=when, created=created, completed=completed):
                value = observation()
                value.update(observed_at=when, start_observed_at=when)
                row, job, data = platform('start', value)
                row['created_at'] = created
                job['completed_at'] = completed
                with patch.dict(os.environ, {'GH_TOKEN': 'synthetic-token'}), \
                     patch.object(runtime.urllib.request, 'build_opener') as build:
                    build.return_value.open.return_value = io.BytesIO(data)
                    if accepted:
                        self.assertEqual(runtime.read_artifact(row, context(), 'start', job), value)
                    else:
                        with self.assertRaisesRegex(ValueError, 'outside platform time bounds'):
                            runtime.read_artifact(row, context(), 'start', job)

    def test_blob_redirect_never_forwards_authorization(self):
        row, job, data = platform('start')
        redirect = urllib.error.HTTPError('https://api.github.com/', 302, 'redirect',
                  {'Location': 'https://example.blob.core.windows.net/archive?sig=synthetic'}, None)
        with patch.dict(os.environ, {'GH_TOKEN': 'synthetic-token'}), patch.object(runtime.urllib.request, 'build_opener') as build:
            build.return_value.open.side_effect = [redirect, io.BytesIO(data)]
            runtime.read_artifact(row, context(), 'start', job)
            requests = [args.args[0] for args in build.return_value.open.call_args_list]
            self.assertIsNotNone(requests[0].get_header('Authorization'))
            self.assertIsNone(requests[1].get_header('Authorization'))

    def test_safety_after_activity_driver_keeps_runtime_not_raw(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            prepared, output, observations = root / 'prepared', root / 'result', root / 'runtime'
            prepared.mkdir()
            work = prepared / 'workspace'
            (work / 'handoffs').mkdir(parents=True)
            handback = work / 'handoffs/result.md'
            handback.write_text('# Handback\n')
            (prepared / 'control').mkdir()
            (prepared / 'control/context.json').write_text(json.dumps(context()))
            def fake_consume(command, cwd, environment, raw, errors, observer):
                observer.feed(activity(False))
                observer.feed({'type': 'result', 'session_id': SESSION,
                               'usage': {'output_tokens': 5}, 'total_cost_usd': .01})
                observer.worker_state, observer.signal = 'stopped', 'process_exit'
                raw.write_bytes(b'github_pat_' + b'X' * 30)
                errors.write_text('')
                handback.write_text('synthetic changed handback')
                return {'is_error': False}, 0
            with patch.object(driver, 'PREPARED', prepared), patch.object(driver, 'RESULT', output), \
                 patch.object(driver, 'verify_manifest'), patch.object(driver, 'make_read_only'), \
                 patch.object(driver, 'claude_command', return_value=['claude', '--allowedTools', 'Edit(/handoffs/result.md)']), \
                 patch.object(runtime, 'consume', side_effect=fake_consume), \
                 patch.object(runtime.Observer, '__init__', autospec=True) as init, \
                 patch.dict(os.environ, {'ANTHROPIC_API_KEY': 'synthetic-key'}):
                init.side_effect = lambda self, ctx, exact=None: OBSERVER_INIT(self, ctx, observations, exact)
                with self.assertRaisesRegex(RuntimeError, 'relay blocked'):
                    driver.run_model()
            self.assertEqual({p.name for p in output.iterdir()}, {'metadata.json', 'BLOCKED.txt'})
            driver.validate_result(json.loads((output / 'metadata.json').read_text()), context(), output)
            end = json.loads((observations / 'end.json').read_text())
            self.assertEqual(end['outcome'], 'safety_blocked')
            self.assertEqual(end['total_cost_usd'], .01)
            self.assertTrue((observations / 'start.json').is_file())
            self.assertNotIn('github_pat_', json.dumps(end))

    def test_runtime_marker_injection_is_blocked_by_final_publisher(self):
        for marker in (driver.AG_MARKER, runtime.MARKER):
            with self.subTest(marker=marker), tempfile.TemporaryDirectory() as tmp:
                root = Path(tmp)
                prepared, output = root / 'prepared', root / 'result'
                (prepared / 'control').mkdir(parents=True)
                (prepared / 'control/context.json').write_text(json.dumps(context()))
                output.mkdir()
                payload = ('synthetic example ' + marker).encode()
                (output / 'handback.md').write_bytes(payload)
                meta = driver.base_metadata(context(), 'result_ready')
                meta.update(stopped_at=driver.now(), elapsed_seconds=1, session_id=SESSION,
                            usage={'input_tokens': 1}, total_cost_usd=.01, changed_paths=['handoffs/result.md'],
                            handback_sha256=driver.sha256(payload), secret_scan='passed')
                (output / 'metadata.json').write_text(json.dumps(meta))
                with patch.object(driver, 'PREPARED', prepared), patch.object(driver, 'RESULT', output), \
                     patch.object(driver, 'verify_manifest'), patch.object(driver, 'post_issue') as post:
                    driver.publish()
                body = post.call_args.args[0]
                self.assertNotIn(runtime.MARKER, body)
                self.assertEqual(body.count(driver.AG_MARKER), 1)
                self.assertIn('CONTROL_SEQUENCE_IN_HANDBACK', body)
                self.assertEqual({p.name for p in output.iterdir()}, {'metadata.json', 'BLOCKED.txt'})

    def test_post_launch_manifest_permits_only_the_handback_edit(self):
        with tempfile.TemporaryDirectory() as tmp:
            prepared = Path(tmp)
            (prepared / 'control').mkdir()
            (prepared / 'workspace/handoffs').mkdir(parents=True)
            (prepared / 'control/context.json').write_text(json.dumps(context()))
            output = prepared / 'workspace/handoffs/result.md'
            output.write_text('initial')
            immutable = prepared / 'workspace/AGENTS.md'
            immutable.write_text('trusted')
            (prepared / 'manifest.json').write_text(json.dumps(driver.manifest(prepared)))
            output.write_text('allowed handback edit')
            with patch.object(driver, 'PREPARED', prepared), patch.dict(os.environ, {
                    'GITHUB_RUN_ID': '42', 'GITHUB_RUN_ATTEMPT': '1', 'GITHUB_SHA': 'b' * 40}):
                driver.runtime_context(worker_launched=True)
                immutable.write_text('changed')
                with self.assertRaisesRegex(RuntimeError, 'immutable bundle'):
                    driver.runtime_context(worker_launched=True)

    def test_uncertain_post_is_not_blindly_resent_and_result_owner_unchanged(self):
        start = observation()
        end = dict(start, phase='end', signal='process_exit', outcome='process_exited',
                   worker_state='stopped', safety='passed')
        start_row, job, _ = platform('start', start)
        end_row, _, _ = platform('end', end)
        job['status'] = 'completed'
        posted = []
        clock = [0]
        def post(body):
            posted.append(body)
            raise OSError('synthetic lost acknowledgement')
        def pages(path, field):
            return [start_row, end_row] if field == 'artifacts' else []
        def delay(seconds):
            clock[0] += seconds
        with patch.object(runtime, 'source_job', return_value=job), patch.object(runtime, 'pages', side_effect=pages), \
             patch.object(runtime, 'read_artifact', side_effect=lambda row, ctx, phase, job: start if phase == 'start' else end), \
             patch.object(runtime.time, 'monotonic', side_effect=lambda: clock[0]), patch.object(runtime.time, 'sleep', side_effect=delay):
            runtime.publish(context(), post)
        self.assertEqual(len(posted), 2)  # once for each phase, even with lost ACK
        self.assertTrue(all(json.loads(b.split('```json\n')[1][:-4])['delivery'] == 'archive' for b in posted))
        self.assertTrue(all(driver.AG_MARKER not in body for body in posted))


OBSERVER_INIT = runtime.Observer.__init__

if __name__ == '__main__':
    unittest.main()
