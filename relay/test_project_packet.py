"""Adversarial offline v3 checks; all model/source responses are synthetic.

These do not attest a live CLI invocation. Actual positive source/R2 proof is
an independently reviewed, separately commissioned run.
"""
import base64
import copy
import hashlib
import json
import os
from pathlib import Path
import shutil
import stat
import tempfile
import unittest
from unittest.mock import patch

import claude_public_relay_v2 as driver
import claude_runtime_events as runtime
import project_packet as pp

PARENT = 'a' * 40
HEAD = 'b' * 40
TARGET = 'c' * 40
SESSION = '12345678-1234-1234-1234-123456789abc'
PACKAGE = b'{"name":"synthetic-package","version":"0.0.0-synthetic"}\n'
BLOB = hashlib.sha1(b'blob ' + str(len(PACKAGE)).encode() + b'\0' + PACKAGE).hexdigest()
EDIT = 'relay-proof/existing.md'
NEW = 'relay-proof/new.md'


def activation(role='coding-agent', mode='forge-implementation'):
    seed = '# Synthetic proof overlay\nPending source observation.\n'
    identity = {'schema': 'agentarium.relay-runtime-identity.v1', 'project_id': 'agentarium',
                'run_id': 'AG-RELAY-MULTIREPO-001', 'task_id': 'AG-RELAY-MULTIREPO-001-04',
                'parent_id': 'AG-RELAY-MULTIREPO-001', 'subject_role': runtime.ROLE_MAP[role]}
    return {'schema': pp.SCHEMA, 'task_id': identity['task_id'], 'authorized': True,
            'source_commit': PARENT, 'role': role, 'request': 'handoffs/proof.json',
            'handback': 'handoffs/proof-result.md', 'model': 'sonnet', 'max_turns': 12,
            'max_budget_usd': 1.0, 'contract': {'schema': pp.CONTRACT,
                'repository': 'pahlborn/bis-school-app_src', 'project_id': 'big-quest',
                'target_commit': TARGET, 'mode': mode,
                'read_files': [{'path': 'package.json', 'git_blob': BLOB, 'sha256': pp.digest(PACKAGE)}],
                'edit_paths': [EDIT] if mode == 'forge-implementation' else [],
                'create_paths': [NEW] if mode == 'forge-implementation' else [],
                'synthetic_files': [{'path': EDIT, 'content': seed, 'sha256': pp.digest(seed.encode())}],
                'identity': identity, 'max_seconds': 180,
                'test_profile': 'synthetic-doc-v1' if mode == 'forge-implementation' else 'none',
                'artifact_publication': 'host-approved-exact-paths', 'journal_delivery': 'archive'}}


def request(a):
    return {'schema': 'agentarium.handoff.v1', 'task_id': a['task_id'],
            'readable_paths': ['AGENTS.md', 'CLAUDE.md', driver.ROLES[a['role']], a['request']],
            'instructions': 'Synthetic fixture, not a live assignment.',
            'rule_package': 'Synthetic test fixture; not operational governance.',
            'runtime': a['contract']['identity']}


class Fixture(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.prepared, self.result = self.root / 'prepared', self.root / 'result'
        self.patches = [patch.object(driver, 'PREPARED', self.prepared),
                        patch.object(driver, 'RESULT', self.result),
                        patch.dict(os.environ, {'GITHUB_RUN_ID': '42', 'GITHUB_RUN_ATTEMPT': '1', 'GITHUB_SHA': HEAD})]
        for item in self.patches:
            item.start()

    def tearDown(self):
        for item in reversed(self.patches):
            item.stop()
        # Tests deliberately seal paths; do not rely on privileged test users.
        for current, directories, files in os.walk(self.root):
            Path(current).chmod(0o755)
            for name in files:
                target = Path(current) / name
                if not target.is_symlink():
                    target.chmod(0o644)
        self.tmp.cleanup()

    def prepare(self, a=None):
        a = a or activation()
        driver.validate_activation(a, PARENT)
        r = request(a)
        registry = {'projekte': [{'id': 'agentarium', 'kuerzel': 'AG', 'repo': 'pahlborn/agentarium'},
                                {'id': 'big-quest', 'kuerzel': 'BQ', 'repo': 'pahlborn/bis-school-app'}]}
        def source(ref, name):
            if name == 'projekte/verzeichnis.json':
                return json.dumps(registry).encode()
            return json.dumps(r).encode() if name == a['request'] else b'synthetic trusted control\n'
        with patch.object(driver, 'source', side_effect=source), \
             patch.object(driver, 'git', return_value='100644 blob synthetic file'), \
             patch.object(pp, 'source_entry', return_value=None), \
             patch.object(pp, 'fetch_source', return_value=PACKAGE):
            pp.prepare(driver, a, PARENT, HEAD, r)
        return pp.verify_prepared(driver)

    def success(self, context, mutate=True):
        def consume(command, work, env, raw, errors, observer):
            self.assertFalse({'GH_TOKEN', 'GITHUB_TOKEN', 'ACTIONS_RUNTIME_TOKEN', 'ACTIONS_ID_TOKEN_REQUEST_TOKEN'} & set(env))
            self.assertEqual(runtime.LIMIT_SECONDS, 180)
            self.assertEqual(stat.S_IMODE(work.stat().st_mode), 0o555)
            if mutate:
                for name in context['activation']['contract']['edit_paths'] + context['activation']['contract']['create_paths']:
                    (work / 'target' / name).write_text('Synthetic proof: synthetic-package@0.0.0-synthetic\n')
            observer.feed({'type': 'assistant', 'session_id': SESSION, 'message': {'role': 'assistant',
                'id': 'msg_fixture', 'content': [{'type': 'text', 'text': 'synthetic'}]}})
            result = {'type': 'result', 'session_id': SESSION, 'subtype': 'success', 'is_error': False,
                      'result': 'Synthetic handback. Tests NOT_RUN by worker.',
                      'usage': {'input_tokens': 5, 'output_tokens': 7}, 'total_cost_usd': .01}
            observer.feed(result)
            observer.worker_state, observer.signal = 'stopped', 'process_exit'
            raw.write_text('synthetic harmless stream\n')
            errors.write_text('')
            return result, 0
        with patch.object(runtime, 'consume', side_effect=consume), \
             patch.object(runtime.Observer, '__init__', autospec=True) as init, \
             patch.dict(os.environ, {'ANTHROPIC_API_KEY': 'synthetic-model-binding', 'GH_TOKEN': 'synthetic-never-inherited'}):
            original = OBSERVER_INIT
            init.side_effect = lambda obj, ctx, exact=None: original(obj, ctx, self.root / 'runtime', exact)
            driver.run_model()
        return json.loads((self.result / 'metadata.json').read_text())


class ContractTests(Fixture):
    def test_existing_v2_does_not_accept_any_v3_right(self):
        a = activation()
        a['schema'] = 'agentarium.relay-activation.v2'
        with self.assertRaises(ValueError):
            driver.validate_activation(a, PARENT)
        del a['contract']
        driver.validate_activation(a, PARENT)
        bad = {'schema': 'agentarium.handoff.v0', 'task_id': a['task_id'],
               'allowed_paths': [a['handback'], 'target/package.json']}
        with self.assertRaisesRegex(ValueError, 'write boundary'):
            driver.validate_request(bad, a)

    def test_rejects_repo_commit_source_hash_and_unapproved_reads_before_model(self):
        for key, value in [('repository', 'pahlborn/other'), ('repository', 'https://github.com/pahlborn/bis-school-app_src'),
                           ('target_commit', 'main'), ('target_commit', ''), ('target_commit', 'c' * 39),
                           ('read_files', [{'path': 'werkzeug/konten.json', 'git_blob': BLOB, 'sha256': pp.digest(PACKAGE)}]),
                           ('read_files', [{'path': 'package.json', 'git_blob': BLOB, 'sha256': ''}])]:
            with self.subTest(key=key, value=value), patch.object(runtime, 'consume') as consume:
                a = activation(); a['contract'][key] = value
                with self.assertRaises((ValueError, TypeError)):
                    driver.validate_activation(a, PARENT)
                consume.assert_not_called()

    def test_path_link_encoding_and_control_names(self):
        bad = ['../x', '/x', 'a//b', './x', 'a/../x', 'a\\x', 'a/%2e%2e/x', 'a\n/x',
               '.git/config', '.GIT/config', 'a/AGENTS.md', '.github/workflows/a.yml',
               '.env', 'a/secrets.txt', 'a/credentials.json', 'a/token.txt', 'a/file.', 'a/é.txt', 'a/(x)']
        for name in bad:
            with self.subTest(name=name), self.assertRaises(ValueError):
                pp.project_path(name)

    def test_readonly_roles_never_acquire_project_writes(self):
        for role in ('spec-agent', 'process-agent', 'coding-agent'):
            context = self.prepare(activation(role, 'analysis'))
            command = pp.command(context, driver)
            self.assertEqual(command[command.index('--tools') + 1], 'Read')
            self.assertIn('Edit', command[command.index('--disallowedTools') + 1])
            self.assertIn('Write', command[command.index('--disallowedTools') + 1])
            self.assertFalse(pp.writable_paths(context))
            shutil.rmtree(self.prepared)
        for role in ('spec-agent', 'process-agent'):
            a = activation(role)
            with self.assertRaisesRegex(ValueError, 'only Forge'):
                driver.validate_activation(a, PARENT)

    def test_new_slots_do_not_grant_writable_directories(self):
        context = self.prepare()
        writable = {'workspace/' + p for p in pp.writable_paths(context)}
        pp.seal(self.prepared, writable)
        work = self.prepared / 'workspace/target'
        (work / NEW).write_text('synthetic allowed new slot')
        (work / EDIT).write_text('synthetic allowed edit')
        for operation in (lambda: (work / 'relay-proof/unauthorized.md').write_text('bad'),
                          lambda: (work / EDIT).unlink(),
                          lambda: (work / EDIT).rename(work / 'relay-proof/moved.md'),
                          lambda: (work / 'package.json').write_text('bad')):
            with self.assertRaises(PermissionError):
                operation()
        pp.verify_prepared(driver, changed=True, modes=True)
        command = pp.command(context, driver)
        allow = command[command.index('--allowedTools') + 1].split(',')
        self.assertIn('Write(/target/' + NEW + ')', allow)
        self.assertNotIn('Write(/target/' + EDIT + ')', allow)
        self.assertNotIn('Read', allow)

    def test_metadata_links_and_type_changes_are_rejected_even_when_bytes_match(self):
        for kind in ('symlink', 'hardlink', 'directory', 'permission', 'missing', 'extra'):
            with self.subTest(kind=kind):
                context = self.prepare()
                immutable = self.prepared / 'workspace/target/package.json'
                if kind == 'symlink':
                    twin = self.root / 'twin'; twin.write_bytes(immutable.read_bytes()); immutable.unlink(); immutable.symlink_to(twin)
                elif kind == 'hardlink':
                    os.link(immutable, self.root / 'linked')
                elif kind == 'directory':
                    immutable.unlink(); immutable.mkdir()
                elif kind == 'permission':
                    pp.seal(self.prepared, {'workspace/' + p for p in pp.writable_paths(context)})
                    immutable.chmod(0o644)
                elif kind == 'missing':
                    (self.prepared / 'workspace/target' / NEW).unlink()
                else:
                    (self.prepared / 'workspace/target/extra').write_text('synthetic')
                with self.assertRaises(ValueError):
                    pp.verify_prepared(driver, changed=True, modes=(kind == 'permission'))
                for current, dirs, files in os.walk(self.prepared):
                    Path(current).chmod(0o755)
                    for name in files:
                        if not (Path(current) / name).is_symlink(): (Path(current) / name).chmod(0o644)
                shutil.rmtree(self.prepared)
                for extra in ('linked', 'twin'):
                    (self.root / extra).unlink(missing_ok=True)

    def test_nested_manifest_and_control_tampering_are_not_ignored(self):
        context = self.prepare()
        for relative in ('control/settings.json', 'workspace/trusted/AGENTS.md', 'workspace/target/package.json'):
            original = (self.prepared / relative).read_bytes()
            (self.prepared / relative).write_bytes(original + b' ')
            with self.assertRaises(ValueError):
                pp.verify_prepared(driver, changed=True)
            (self.prepared / relative).write_bytes(original)
        (self.prepared / 'workspace/target/manifest.json').write_text('{}')
        with self.assertRaises(ValueError):
            pp.verify_prepared(driver, changed=True)

    def test_runtime_mapping_retains_technical_ag_id_and_logical_bq_ids(self):
        a = activation(); c = a['contract']
        c['identity'].update(project_id='big-quest', run_id='BQ-EVAL-01', task_id='BQ-EVAL-01-INT-01-DEV', parent_id='BQ-EVAL-01-INT-01')
        context = self.prepare(a)
        binding = runtime.identity(context)
        self.assertEqual(binding['project_id'], 'big-quest')
        self.assertEqual(binding['task_id'], 'BQ-EVAL-01-INT-01-DEV')
        self.assertEqual(context['activation']['task_id'], 'AG-RELAY-MULTIREPO-001-04')
        event = json.loads(driver.ag_host_received(context).split('```json\n')[1][:-4])
        self.assertEqual(event['task_id'], binding['task_id'])
        self.assertEqual(event['run_id'], 'BQ-EVAL-01')
        context['request']['runtime'] = dict(c['identity'], run_id='AG-FORGED-0001')
        with self.assertRaises(ValueError):
            runtime.identity(context)

    def test_replayed_workflow_attempt_and_forged_request_rights_block_before_fetch(self):
        a = activation(); r = request(a)
        with patch.dict(os.environ, {'GITHUB_RUN_ATTEMPT': '2'}), patch.object(pp, 'fetch_source') as fetch:
            with self.assertRaisesRegex(ValueError, 'reruns'):
                pp.prepare(driver, a, PARENT, HEAD, r)
            fetch.assert_not_called()
        r['allowed_paths'] = ['target/package.json']
        with patch.object(pp, 'fetch_source') as fetch:
            with self.assertRaisesRegex(ValueError, 'request fields'):
                pp.prepare(driver, a, PARENT, HEAD, r)
            fetch.assert_not_called()

    def test_platform_replay_guard_rejects_second_run_even_without_prior_receipt(self):
        a = activation()
        current = {'id': 42, 'head_sha': HEAD, 'event': 'push', 'path': '.github/workflows/claude-public-relay-v2.yml'}
        def platform(suffix):
            return {'workflow_runs': [current]} if suffix.startswith('/actions/') else []
        with patch.object(driver, 'api', side_effect=platform):
            pp.ensure_unique_dispatch(driver, a, PARENT, HEAD)
        with patch.object(driver, 'api', return_value={'workflow_runs': [current, dict(current, id=43)]}):
            with self.assertRaisesRegex(ValueError, 'another workflow'):
                pp.ensure_unique_dispatch(driver, a, PARENT, HEAD)
        receipt = {'user': {'id': 41898282}, 'body': driver.marker(a['task_id'], PARENT, 'HOST_RECEIVED', HEAD, '41')}
        def replay(suffix):
            return {'workflow_runs': [current]} if suffix.startswith('/actions/') else [receipt]
        with patch.object(driver, 'api', side_effect=replay):
            with self.assertRaisesRegex(ValueError, 'dispatch already'):
                pp.ensure_unique_dispatch(driver, a, PARENT, HEAD)

    def test_unread_existing_target_path_cannot_be_declared_new_or_synthetic(self):
        a = activation(); r = request(a)
        registry = {'projekte': [{'id': 'big-quest', 'kuerzel': 'BQ', 'repo': 'pahlborn/bis-school-app'}]}
        with patch.object(driver, 'source', return_value=json.dumps(registry).encode()), \
             patch.object(pp, 'source_entry', return_value={'path': 'existing.md', 'mode': '100644', 'type': 'blob'}), \
             patch.object(pp, 'fetch_source') as fetch:
            with self.assertRaisesRegex(ValueError, 'collides'):
                pp.prepare(driver, a, PARENT, HEAD, r)
            fetch.assert_not_called()


class SourceTests(unittest.TestCase):
    def test_exact_commit_tree_blob_chain_and_byte_integrity(self):
        c = activation()['contract']
        tree = 'd' * 40
        def http(repo, suffix):
            if suffix == '/git/commits/' + TARGET: return {'sha': TARGET, 'tree': {'sha': tree}}
            if suffix == '/git/trees/' + tree: return {'sha': tree, 'truncated': False, 'tree': [{'path': 'package.json', 'type': 'blob', 'mode': '100644', 'sha': BLOB}]}
            if suffix == '/git/blobs/' + BLOB: return {'sha': BLOB, 'encoding': 'base64', 'content': base64.b64encode(PACKAGE).decode()}
            raise AssertionError('unapproved request')
        with patch.object(pp, 'fetch_json', side_effect=http):
            self.assertEqual(pp.fetch_source(c, c['read_files'][0]), PACKAGE)
            bad = copy.deepcopy(c); bad['read_files'][0]['sha256'] = '0' * 64
            with self.assertRaisesRegex(ValueError, 'integrity'):
                pp.fetch_source(bad, bad['read_files'][0])
        for mode in ('120000', '160000', '040000'):
            def bad_http(repo, suffix):
                value = http(repo, suffix)
                if 'tree' in value and isinstance(value['tree'], list): value['tree'][0]['mode'] = mode
                return value
            with patch.object(pp, 'fetch_json', side_effect=bad_http), self.assertRaisesRegex(ValueError, 'type'):
                pp.fetch_source(c, c['read_files'][0])

    def test_wrong_full_commit_never_substitutes_current_main(self):
        c = activation()['contract']
        with patch.object(pp, 'fetch_json', return_value={'sha': '0' * 40, 'tree': {'sha': 'd' * 40}}):
            with self.assertRaisesRegex(ValueError, 'commit'):
                pp.fetch_source(c, c['read_files'][0])
        self.assertIsNone(pp.NoRedirect().redirect_request(None, None, 302, 'redirect', {}, 'https://other.example/'))


class ResultTests(Fixture):
    def test_model_result_bound_restore_and_fixed_executor_on_actual_delta(self):
        context = self.prepare()
        # Keep an untouched independent prepared artifact for reconstruction.
        original = self.root / 'original'; shutil.copytree(self.prepared, original)
        meta = self.success(context)
        self.assertEqual(meta['phase'], 'result_ready')
        self.assertEqual({p.name for p in self.result.iterdir()}, {'handback.md', 'changes.json', 'tool-observations.json', 'metadata.json'})
        self.assertFalse((self.result / 'stream.jsonl').exists())
        pp.validate_result(meta, context, self.result, driver)
        result = json.loads((self.result / 'changes.json').read_bytes())
        with patch.object(driver, 'PREPARED', original):
            restored = pp.restore(result, context, driver, self.root / 'independent-restore')
            self.assertEqual(set(restored), {'package.json', 'relay-proof', EDIT, NEW})
            report = pp.execute_proof(self.result, original, driver)
            self.assertEqual(report['status'], 'PASS')
            self.assertEqual(report['changes_sha256'], meta['changes_sha256'])
            for mutation in ('binding', 'bytes', 'extra', 'delete', 'before'):
                bad = copy.deepcopy(result)
                if mutation == 'binding': bad['packet_binding'] = '0' * 64
                elif mutation == 'bytes': bad['changes'][0]['content_base64'] = base64.b64encode(b'bad').decode()
                elif mutation == 'extra': bad['changes'][0]['path'] = 'unauthorized.md'
                elif mutation == 'delete': bad['changes'][0]['operation'] = 'delete'
                else: bad['changes'][0]['before_sha256'] = '0' * 64
                with self.subTest(mutation=mutation), self.assertRaises(ValueError):
                    pp.validate_changes(bad, context, driver)

    def test_safety_failure_preserves_usage_but_no_payload_and_has_granular_code(self):
        context = self.prepare()
        def consume(command, work, env, raw, errors, observer):
            observer.feed({'type': 'assistant', 'session_id': SESSION, 'message': {'role': 'assistant',
                'id': 'msg_fixture', 'content': [{'type': 'text', 'text': 'synthetic'}]}})
            observer.feed({'type': 'result', 'session_id': SESSION, 'usage': {'output_tokens': 7}, 'total_cost_usd': .02})
            observer.worker_state, observer.signal = 'stopped', 'process_exit'
            raw.write_text('synthetic stream'); errors.write_text('')
            return {'is_error': True, 'subtype': 'error_max_turns'}, 0
        with patch.object(runtime, 'consume', side_effect=consume), \
             patch.object(runtime.Observer, '__init__', autospec=True) as init, \
             patch.dict(os.environ, {'ANTHROPIC_API_KEY': 'synthetic-key'}):
            init.side_effect = lambda obj, ctx, exact=None: OBSERVER_INIT(obj, ctx, self.root / 'runtime', exact)
            with self.assertRaisesRegex(RuntimeError, 'withheld'):
                driver.run_model()
        meta = json.loads((self.result / 'metadata.json').read_bytes())
        self.assertEqual(meta['total_cost_usd'], .02)
        self.assertEqual(meta['failure'], 'MODEL_TURN_LIMIT')
        self.assertEqual({p.name for p in self.result.iterdir()}, {'metadata.json', 'BLOCKED.txt'})
        pp.validate_result(meta, context, self.result, driver)

    def test_readonly_handback_is_host_materialized_after_zero_worker_writes(self):
        context = self.prepare(activation('process-agent', 'analysis'))
        original = pp.snapshot(self.prepared / 'workspace')
        meta = self.success(context, mutate=False)
        self.assertEqual(pp.snapshot(self.prepared / 'workspace'), original)
        self.assertEqual(meta['changed_paths'], [])
        self.assertTrue((self.result / 'handback.md').read_text().startswith('Synthetic'))

    def test_fallback_preserves_unknown_times_and_rejects_extra_result_directory(self):
        context = self.prepare()
        pp.fallback(driver, context)
        meta = json.loads((self.result / 'metadata.json').read_text())
        self.assertIsNone(meta['elapsed_seconds'])
        self.assertIsNone(meta['started_at'])
        self.assertIsNone(meta['stopped_at'])
        pp.validate_result(meta, context, self.result, driver)
        (self.result / 'extra').mkdir()
        with self.assertRaises(ValueError):
            pp.validate_result(meta, context, self.result, driver)

    def test_tool_summary_records_cli_envelope_without_source_or_arguments(self):
        context = self.prepare()
        with patch.object(runtime.Observer, '__init__', autospec=True) as init:
            init.side_effect = lambda obj, ctx, exact=None: OBSERVER_INIT(obj, ctx, self.root / 'runtime', exact)
            observer = pp.make_observer(driver, context, None)
        observer.feed({'type': 'assistant', 'session_id': SESSION, 'message': {'role': 'assistant',
            'id': 'msg_toolfixture', 'content': [{'type': 'tool_use', 'id': 'tool_fixture', 'name': 'Read',
            'input': {'file_path': 'target/package.json', 'unused': 'SYNTHETIC_PRIVATE_ARGUMENT'}}]}})
        observer.feed({'type': 'user', 'session_id': SESSION, 'message': {'content': [{'type': 'tool_result',
            'tool_use_id': 'tool_fixture', 'content': 'SYNTHETIC_PRIVATE_SOURCE', 'is_error': False}]}})
        self.assertEqual(list(observer.tools.values()), [{'tool': 'Read', 'path': 'target/package.json', 'response': 'success'}])
        self.assertNotIn('PRIVATE', json.dumps(observer.tools))

    def test_fixed_executor_has_no_credentials_and_never_uses_model_shell_text(self):
        with patch.dict(os.environ, {'ANTHROPIC_API_KEY': 'synthetic', 'GH_TOKEN': 'synthetic',
                    'GITHUB_TOKEN': 'synthetic'}), patch.object(driver.subprocess, 'run') as run, \
             patch.object(driver, 'Path', wraps=Path), tempfile.TemporaryDirectory() as tmp:
            old = os.getcwd(); os.chdir(tmp)
            try:
                run.return_value.returncode = 0
                run.return_value.stdout = b'{"status":"NOT_RUN"}'
                driver.fixed_test()
                args, kwargs = run.call_args
                self.assertNotIn('shell', kwargs)
                self.assertEqual(args[0][-1], 'fixed-test-internal')
                self.assertEqual(set(kwargs['env']), {'PATH', 'LANG'})
            finally:
                os.chdir(old)


OBSERVER_INIT = runtime.Observer.__init__
if __name__ == '__main__':
    unittest.main()
