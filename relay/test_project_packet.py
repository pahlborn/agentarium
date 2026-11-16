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
import subprocess
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
# Synthetic stand-ins for the BigQuest module/test; the real files are fetched by hash.
RUNDE_JS = b'export function runde(value) {\n  return Math.round(value);\n}\n'
RUNDE_TEST_JS = b"import test from 'node:test';\nimport assert from 'node:assert';\nimport { runde } from '../../src/module/runde.mjs';\ntest('runde', () => assert.equal(runde(1.4), 1));\n"
SOURCES = {'package.json': PACKAGE, 'src/module/runde.mjs': RUNDE_JS, 'tests/module/runde.test.mjs': RUNDE_TEST_JS}


def activation(role='coding-agent', mode='forge-implementation'):
    seed = '# Synthetic proof overlay\nPending source observation.\n'
    identity = {'schema': 'agentarium.relay-runtime-identity.v1', 'project_id': 'agentarium',
                'run_id': 'AG-RELAY-MULTIREPO-001', 'task_id': 'AG-RELAY-MULTIREPO-001-04',
                'parent_id': 'AG-RELAY-MULTIREPO-001', 'subject_role': runtime.ROLE_MAP[role]}
    return {'schema': pp.SCHEMA, 'task_id': identity['task_id'], 'authorized': True,
            'source_commit': PARENT, 'role': role, 'request': 'handoffs/proof.json',
            'handback': 'handoffs/proof-result.md', 'model': 'sonnet', 'max_turns': 8,
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



def bq_creation(relative):
    a = activation()
    c = a['contract']
    c.update(edit_paths=[], create_paths=[relative], synthetic_files=[], test_profile='none')
    c['identity'].update(project_id='big-quest', run_id='BQ-EVAL-01',
                         task_id='BQ-EVAL-01-INT-01-DEV', parent_id='BQ-EVAL-01-INT-01')
    return a


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
             patch.object(pp, 'fetch_source', side_effect=lambda c, item: SOURCES[item['path']]):
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


def make_zip(entries):
    import io
    import zipfile
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w') as z:
        for name, data, attr in entries:
            info = zipfile.ZipInfo(name)
            info.external_attr = attr << 16
            z.writestr(info, data)
    return buf.getvalue()


LITERAL = b'gh' + b'p_' + b'A' * 24  # synthetic decoy, not a credential
VIEW_KEYS = ('path', 'archive', 'member', 'bytes', 'git_blob', 'sha256')
REGULAR, FOLDER, LINK = 0o100644, 0o40755, 0o120777
BASE_SOURCE = [('src/', b'', FOLDER), ('tests/', b'', FOLDER), ('package.json', PACKAGE, REGULAR),
               ('src/a.mjs', b'export const a = 1;\n', REGULAR),
               ('tests/testinstanz.test.mjs', b"import 'node:test';\n", REGULAR)]


BASE_IMPLICIT = [e for e in BASE_SOURCE if not e[0].endswith('/')]  # ORIGINAL ZIP SHAPE: files only


def parent_count(names):
    return len({'/'.join(n.split('/')[:i]) for n in names for i in range(1, len(n.split('/')))})


def synthetic_originals(source_entries=None, manifest_drop=None):
    """Self-consistent SYNTHETIC archives/spec; none of these hashes are the real originals."""
    entries = source_entries or BASE_SOURCE
    files = {n: d for n, d, _ in entries if not n.endswith('/')}
    source_zip = make_zip(entries)
    tree = pp.git_tree_id({n: ('100644', pp.git_blob_id(d)) for n, d in files.items()})
    listed = [{'path': n, 'mode': '100644', 'bytes': len(d), 'sha256': pp.digest(d)}
              for n, d in sorted(files.items()) if n != manifest_drop]
    manifest = json.dumps({'candidate_commit': 'd' * 40, 'candidate_tree': tree, 'files': len(listed),
                           'sha256': pp.digest(source_zip), 'bytes': len(source_zip), 'manifest': listed}).encode()
    restore_note = b'synthetic restore note\n'
    evidence_zip = make_zip([('source-manifest.json', manifest, REGULAR), ('RESTORE.md', restore_note, REGULAR)])
    rows = [('package.json', 'source', 'package.json', PACKAGE),
            ('tests/testinstanz.test.mjs', 'source', 'tests/testinstanz.test.mjs', files['tests/testinstanz.test.mjs']),
            ('access-evidence/RESTORE.md', 'evidence', 'RESTORE.md', restore_note),
            ('access-evidence/source-manifest.json', 'evidence', 'source-manifest.json', manifest)]
    views = [dict(zip(VIEW_KEYS, (p, a, m, len(d), pp.git_blob_id(d), pp.digest(d)))) for p, a, m, d in rows]
    spec = {'origin': 'https://example.invalid/', 'commit': 'd' * 40, 'tree': tree, 'views': views,
            'archives': {'source': {'name': 'source.zip', 'sha256': pp.digest(source_zip), 'bytes': len(source_zip),
                                    'files': len(files), 'dirs': sum(n.endswith('/') for n, _, _ in entries), 'parents': parent_count(files),
                                    'max_total': 4096, 'max_member': 4096},
                         'evidence': {'name': 'evidence.zip', 'sha256': pp.digest(evidence_zip),
                                      'bytes': len(evidence_zip), 'files': 2, 'dirs': 0, 'parents': 0,
                                      'max_total': 4096, 'max_member': 4096}}}
    return spec, {'source.zip': source_zip, 'evidence.zip': evidence_zip}


class AccessImportTests(Fixture):
    def importer(self, **kwargs):
        spec, blobs = synthetic_originals(**kwargs)
        return spec, lambda archive: blobs[archive['name']]

    def use_spec(self, spec, fetch):
        for item in (patch.object(pp, 'ACCESS_SPEC', spec),
                     patch.object(pp, 'fetch_original', side_effect=fetch)):
            item.start()
            self.addCleanup(item.stop)

    def access_activation(self, spec, role='coding-agent', mode='forge-implementation'):
        a = activation(role, mode)
        c = a['contract']
        a['task_id'] = 'AG-BQ-ACCESS-20261116-INTAKE-R3'
        c['identity'].update(project_id='big-quest', run_id='BQ-ACCESS-01', task_id='BQ-ACCESS-01-DEV',
                             parent_id='BQ-ACCESS-01')
        c.update(read_files=pp.access_read_files(spec), target_commit=spec['commit'],
                 edit_paths=[pp.ACCESS_PROOF] if mode == 'forge-implementation' else [], create_paths=[],
                 synthetic_files=[], test_profile=pp.ACCESS_PROFILE)
        return a

    def test_exact_import_extracts_only_after_full_verification(self):
        spec, fetch = self.importer()
        result = pp.import_originals(spec, fetch, self.root / 'imported')
        self.assertEqual(set(result['views']), {x['path'] for x in spec['views']})
        self.assertEqual((self.root / 'imported/source/package.json').read_bytes(), PACKAGE)
        self.assertTrue((self.root / 'imported/evidence/RESTORE.md').is_file())
        with self.assertRaises(ValueError):
            pp.import_originals(spec, fetch, self.root / 'imported')

    def test_unsafe_archives_are_rejected_before_any_extraction(self):
        cases = {
            'traversal': BASE_SOURCE + [('../x', b'z', REGULAR)],
            'absolute': BASE_SOURCE + [('/x', b'z', REGULAR)],
            'backslash': BASE_SOURCE + [('src\\b.mjs', b'z', REGULAR)],
            'symlink': BASE_SOURCE[:3] + [('src/a.mjs', b'x', LINK)] + BASE_SOURCE[4:],
            'case collision': BASE_SOURCE + [('SRC/a.mjs', b'z', REGULAR)],
            'file directory collision': BASE_SOURCE + [('package.json/x', b'z', REGULAR)],
            'extra undeclared file': BASE_SOURCE + [('src/b.mjs', b'z', REGULAR)],
        }
        for label, entries in cases.items():
            with self.subTest(label):
                drop = 'src/b.mjs' if label == 'extra undeclared file' else None
                spec, fetch = self.importer(source_entries=entries, manifest_drop=drop)
                destination = self.root / label.replace(' ', '-')
                with self.assertRaises(ValueError):
                    pp.import_originals(spec, fetch, destination)
                self.assertFalse(destination.exists())

    def test_hash_tree_view_manifest_and_bound_mismatches_are_rejected(self):
        spec, fetch = self.importer()
        mutations = {
            'archive hash': lambda s: s['archives']['source'].update(sha256='0' * 64),
            'archive size': lambda s: s['archives']['evidence'].update(bytes=1),
            'tree': lambda s: s.update(tree='0' * 40),
            'view hash': lambda s: s['views'][0].update(sha256='0' * 64),
            'view blob': lambda s: s['views'][0].update(git_blob='0' * 40),
            'size bound': lambda s: s['archives']['source'].update(max_total=3),
        }
        for label, mutate in mutations.items():
            changed = copy.deepcopy(spec)
            mutate(changed)
            with self.subTest(label), self.assertRaises(ValueError):
                pp.import_originals(changed, fetch)
        spec, fetch = self.importer(manifest_drop='src/a.mjs')
        with self.assertRaises(ValueError):
            pp.import_originals(spec, fetch)

    def test_prepare_exposes_only_the_exact_views_and_one_edit_slot(self):
        spec, fetch = self.importer()
        self.use_spec(spec, fetch)
        context = self.prepare(self.access_activation(spec))
        views = {x['path'] for x in spec['views']}
        inventory = pp.snapshot(self.prepared)
        target = {k[len('workspace/target/'):] for k, v in inventory.items()
                  if k.startswith('workspace/target/') and v['type'] == 'file'}
        self.assertEqual(target, views)
        self.assertFalse([k for k in inventory if k.endswith('.zip')])
        self.assertEqual(pp.writable_paths(context), ['target/' + pp.ACCESS_PROOF])
        allow = json.loads((self.prepared / 'control/settings.json').read_text())['permissions']['allow']
        self.assertEqual({x for x in allow if x.startswith('Read(/target/')},
                         {'Read(/target/' + v + ')' for v in views})
        self.assertEqual({x for x in allow if x.startswith('Edit(')}, {'Edit(/target/' + pp.ACCESS_PROOF + ')'})
        self.assertFalse([x for x in allow if x.startswith('Write(')])

    def test_evidence_metadata_is_never_an_edit_or_create_target(self):
        spec, fetch = self.importer()
        self.use_spec(spec, fetch)
        names = ('access-evidence/source-manifest.json', 'access-evidence/RESTORE.md',
                 'access-evidence/new.md', 'Access-Evidence/x.md')
        for name in names:
            with self.subTest(name=name):
                # Rejected-patch counterexample: only package.json is read, metadata path is created.
                with self.assertRaisesRegex(ValueError, 'evidence metadata'):
                    driver.validate_activation(bq_creation(name), PARENT)
                for field in ('create_paths', 'edit_paths'):
                    a = self.access_activation(spec)
                    a['contract'][field] = [name]
                    with self.assertRaisesRegex(ValueError, 'evidence metadata'):
                        driver.validate_activation(a, PARENT)
        other = self.access_activation(spec)
        other['contract']['edit_paths'] = ['package.json']
        with self.assertRaises(ValueError):
            driver.validate_activation(other, PARENT)
        other = self.access_activation(spec)
        other['contract']['read_files'] = other['contract']['read_files'][:-1]
        with self.assertRaises(ValueError):
            driver.validate_activation(other, PARENT)

    def test_result_may_only_prepend_fixed_comment_and_restores_into_fresh_tree(self):
        spec, fetch = self.importer()
        self.use_spec(spec, fetch)
        context = self.prepare(self.access_activation(spec))
        original = (self.prepared / 'workspace/target' / pp.ACCESS_PROOF).read_bytes()
        contract = context['activation']['contract']

        def result(data, binding=None):
            return {'schema': 'agentarium.project-result.v1', 'packet_binding': binding or context['packet_binding'],
                    'repository': contract['repository'], 'target_commit': contract['target_commit'],
                    'synthetic_overlay': [], 'changes': [{
                        'path': pp.ACCESS_PROOF, 'operation': 'edit', 'before_sha256': pp.digest(original),
                        'sha256': pp.digest(data), 'content_base64': base64.b64encode(data).decode()}]}
        good = result(pp.ACCESS_PREFIX + original)
        restored = pp.restore(good, context, driver, self.root / 'restored')
        self.assertEqual({k for k, v in restored.items() if v['type'] == 'file'}, {x['path'] for x in spec['views']})
        self.assertEqual((self.root / 'restored' / pp.ACCESS_PROOF).read_bytes(), pp.ACCESS_PREFIX + original)
        self.assertEqual((self.root / 'restored/package.json').read_bytes(), PACKAGE)
        with self.assertRaises(ValueError):
            pp.restore(good, context, driver, self.root / 'restored')
        for data in (original + b'// extra\n', b'// other\n' + original, pp.ACCESS_PREFIX + original[1:]):
            with self.subTest(data=data[:12]), self.assertRaises(ValueError):
                pp.validate_changes(result(data), context, driver)
        with self.assertRaises(ValueError):
            pp.validate_changes(result(pp.ACCESS_PREFIX + original, '0' * 64), context, driver)

    def test_original_zip_shape_has_only_implicit_parents(self):
        spec, fetch = self.importer(source_entries=BASE_IMPLICIT)
        own = spec['archives']['source']
        self.assertEqual((own['dirs'], own['parents']), (0, 2))
        self.assertEqual(len(pp.import_originals(spec, fetch, self.root / 'imp')['views']), 4)
        for label, mutate in {'dirs': lambda s: s['archives']['source'].update(dirs=2),
                              'parents': lambda s: s['archives']['source'].update(parents=3),
                              'files': lambda s: s['archives']['source'].update(files=4)}.items():
            changed = copy.deepcopy(spec)
            mutate(changed)
            with self.subTest(label), self.assertRaises(ValueError):
                pp.import_originals(changed, fetch)

    def test_explicit_directory_conflicts_and_case_colliding_parents_are_rejected(self):
        cases = {'unrelated explicit directory': BASE_IMPLICIT + [('docs/', b'', FOLDER)],
                 'explicit directory over a file': BASE_IMPLICIT + [('package.json/', b'', FOLDER)],
                 'directory with data': [('src/', b'data', FOLDER)] + BASE_IMPLICIT,
                 'case-colliding implicit parents': BASE_IMPLICIT + [('SRC/b.mjs', b'z', REGULAR)]}
        for label, entries in cases.items():
            spec, fetch = self.importer(source_entries=entries)
            with self.subTest(label), self.assertRaises(ValueError):
                pp.import_originals(spec, fetch)

    def test_declared_commit_must_equal_the_fixed_snapshot(self):
        spec, fetch = self.importer()
        self.use_spec(spec, fetch)
        driver.validate_activation(self.access_activation(spec), PARENT)
        for wrong in ('0' * 40, 'f' * 40, TARGET):
            bad = self.access_activation(spec)
            bad['contract']['target_commit'] = wrong
            with self.subTest(wrong=wrong):
                with self.assertRaises(ValueError):
                    driver.validate_activation(bad, PARENT)
                with self.assertRaises(ValueError):
                    pp.access_views(bad['contract'])

    def test_readonly_analysis_reads_the_same_views_without_write_rights(self):
        spec, fetch = self.importer()
        self.use_spec(spec, fetch)
        for role in ('spec-agent', 'coding-agent'):
            context = self.prepare(self.access_activation(spec, role, 'analysis'))
            command = pp.command(context, driver)
            self.assertEqual(command[command.index('--tools') + 1], 'Read')
            self.assertFalse(pp.writable_paths(context))
            perms = json.loads((self.prepared / 'control/settings.json').read_text())['permissions']
            self.assertFalse([x for x in perms['allow'] if x.startswith(('Edit(', 'Write('))])
            self.assertTrue({'Edit', 'Write', 'Bash'} <= set(perms['deny']))
            target = {k[len('workspace/target/'):] for k, v in pp.snapshot(self.prepared).items()
                      if k.startswith('workspace/target/') and v['type'] == 'file'}
            self.assertEqual(target, {x['path'] for x in spec['views']})
            shutil.rmtree(self.prepared)
        seed = '# synthetic\n'
        bad = {'process role': lambda a: a.update(role='process-agent'),
               'edit': lambda a: a['contract'].update(edit_paths=[pp.ACCESS_PROOF]),
               'create': lambda a: a['contract'].update(create_paths=['x/new.md']),
               'seed': lambda a: a['contract'].update(synthetic_files=[{'path': 'relay-proof/s.md', 'content': seed,
                                                      'sha256': pp.digest(seed.encode())}]),
               'agentarium identity': lambda a: a['contract']['identity'].update(
                   project_id='agentarium', run_id='AG-BQ-ACCESS-20261116', task_id=a['task_id'],
                   parent_id='AG-BQ-ACCESS-20261116'),
               'fewer views': lambda a: a['contract'].update(read_files=a['contract']['read_files'][:-1])}
        for label, mutate in bad.items():
            a = self.access_activation(spec, 'spec-agent', 'analysis')
            mutate(a)
            with self.subTest(label), self.assertRaises((ValueError, TypeError)):
                driver.validate_activation(a, PARENT)
        forge = self.access_activation(spec)
        forge['contract']['identity'].update(project_id='agentarium', run_id='AG-BQ-ACCESS-20261116',
                                             task_id=forge['task_id'], parent_id='AG-BQ-ACCESS-20261116')
        with self.assertRaises(ValueError):
            driver.validate_activation(forge, PARENT)

    def decoy_spec(self):
        original = b"import 'node:test';\n// fixture " + LITERAL + b'\n'
        entries = [(n, original, k) if n == pp.ACCESS_PROOF else (n, d, k) for n, d, k in BASE_SOURCE]
        spec, fetch = self.importer(source_entries=entries)
        decoy = {'path': pp.ACCESS_PROOF, 'file_sha256': pp.digest(original),
                 'match_sha256': pp.digest(LITERAL), 'count': 1}
        patcher = patch.object(pp, 'ACCESS_DECOY', decoy)
        patcher.start()
        self.addCleanup(patcher.stop)
        self.use_spec(spec, fetch)
        return spec, original

    def test_synthetic_decoy_is_exempt_only_for_exact_bound_input(self):
        spec, original = self.decoy_spec()
        self.assertTrue(driver.secret_hit(original))

        def scan(data, **kw):
            return pp.scan_hit(driver, data, **kw)
        for data in (original, pp.ACCESS_PREFIX + original):
            self.assertFalse(scan(data, access=True, source=True))
            self.assertTrue(scan(data, access=False, source=True))   # other profile
        other = b'gh' + b'p_' + b'B' * 24
        key = b'synthetic-model-binding'
        for data in (original + b'// ' + other, original + b'// ' + LITERAL, original.replace(b'AAAA', b'AAAB'),
                     b'x\n' + LITERAL, original + b'sk-' + b'ant-' + b'C' * 24, original + key):
            self.assertTrue(scan(data, access=True, source=True, exact=key))
        stream = b'{"text":"' + LITERAL + b'"}'
        self.assertFalse(scan(stream, access=True))
        self.assertTrue(scan(stream, access=False))
        self.assertTrue(scan(stream + b' ' + key, access=True, exact=key))
        self.assertTrue(scan(stream + b' ' + other, access=True))
        self.assertTrue(scan(stream + b' sk-' + b'ant-' + b'C' * 24, access=True))
        self.assertTrue(scan(LITERAL + b'X', access=True))                   # longer, different match
        self.assertFalse(scan((LITERAL + b' ') * pp.STREAM_DECOY_LIMIT, access=True))
        self.assertTrue(scan((LITERAL + b' ') * (pp.STREAM_DECOY_LIMIT + 1), access=True))

    def test_decoy_original_prepares_and_restores_but_wrong_digest_blocks(self):
        spec, original = self.decoy_spec()
        with patch.object(pp, 'ACCESS_DECOY', dict(pp.ACCESS_DECOY, match_sha256='0' * 64)):
            with self.assertRaisesRegex(ValueError, 'secret scan'):
                self.prepare(self.access_activation(spec))
        context = self.prepare(self.access_activation(spec))
        contract = context['activation']['contract']
        data = pp.ACCESS_PREFIX + original
        good = {'schema': 'agentarium.project-result.v1', 'packet_binding': context['packet_binding'],
                'repository': contract['repository'], 'target_commit': contract['target_commit'],
                'synthetic_overlay': [], 'changes': [{'path': pp.ACCESS_PROOF, 'operation': 'edit',
                    'before_sha256': pp.digest(original), 'sha256': pp.digest(data),
                    'content_base64': base64.b64encode(data).decode()}]}
        pp.validate_changes(good, context, driver)
        pp.restore(good, context, driver, self.root / 'restored-decoy')
        with patch.object(pp, 'ACCESS_DECOY', dict(pp.ACCESS_DECOY, match_sha256='0' * 64)):
            with self.assertRaises(ValueError):
                pp.validate_changes(good, context, driver)


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

    def test_dotenv_variants_are_rejected_at_activation(self):
        variants = ['.env.production', 'config/.env.local', 'relay-proof/.env.production',
                    'CONFIG/.ENV.Production', '.envrc', 'config/.envrc.local',
                    'config/application.env', 'config/application.env.production', '.env-backup']
        for name in variants:
            with self.subTest(path=name), self.assertRaisesRegex(ValueError, 'protected'):
                driver.validate_activation(bq_creation(name), PARENT)
        # Ordinary documentation names retain their existing rights.
        for name in ('relay-proof/new.md', 'relay-proof/environment.md', 'relay-proof/env-notes.md'):
            driver.validate_activation(bq_creation(name), PARENT)

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

    def test_result_validation_rejects_dotenv_even_if_upstream_guard_was_bypassed(self):
        # Simulate a contract accepted by the old permissive guard. Downstream
        # result validation must independently reject these credential paths.
        for name in ('.env.production', 'config/.env.local', 'relay-proof/.ENV.production'):
            with self.subTest(path=name):
                with patch.object(pp, 'project_path', side_effect=lambda value: pp.path(value)):
                    context = self.prepare(bq_creation(name))
                (self.prepared / 'workspace/target' / name).write_text('synthetic harmless fixture')
                result = pp.changes_from_work(context, driver)
                with self.assertRaisesRegex(ValueError, 'protected'):
                    pp.validate_changes(result, context, driver)
                shutil.rmtree(self.prepared)

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

    def run_wrapper(self, stdout, code=0):
        with patch.object(driver.subprocess, 'run') as run, tempfile.TemporaryDirectory() as tmp:
            old = os.getcwd(); os.chdir(tmp)
            try:
                run.return_value.returncode = code
                run.return_value.stdout = stdout
                raised = None
                try:
                    driver.fixed_test()
                except RuntimeError as error:
                    raised = error
                saved = json.loads(Path('relay-tests/test-report.json').read_text())
            finally:
                os.chdir(old)
        return saved, raised

    def test_fixed_executor_exits_nonzero_when_internal_process_reports_fail(self):
        # Inner process exits 0 but prints status FAIL (ARG-ENV-001).
        saved, raised = self.run_wrapper(b'{"status":"FAIL","exit_code":1}')
        self.assertIsInstance(raised, RuntimeError)
        self.assertEqual((saved['status'], saved['exit_code']), ('FAIL', 1))

    def test_fixed_executor_keeps_nonzero_internal_exit_as_fail(self):
        saved, raised = self.run_wrapper(b'', code=1)
        self.assertIsInstance(raised, RuntimeError)
        self.assertEqual(saved['failure'], 'FIXED_EXECUTOR_FAILED')

    def test_fixed_executor_pass_and_not_run_do_not_raise(self):
        for status in ('PASS', 'NOT_RUN'):
            with self.subTest(status=status):
                saved, raised = self.run_wrapper(json.dumps({'status': status}).encode())
                self.assertIsNone(raised)
                self.assertEqual(saved['status'], status)


def runde_activation():
    a = activation()
    c = a['contract']
    c.update(read_files=[{'path': n, 'git_blob': hashlib.sha1(b'blob ' + str(len(d)).encode() + b'\0' + d).hexdigest(),
                          'sha256': pp.digest(d)} for n, d in SOURCES.items()],
             edit_paths=[pp.RUNDE_MODULE], create_paths=[], synthetic_files=[], test_profile='bq-runde-v1')
    c['identity'].update(project_id='big-quest', run_id='BQ-EVAL-01',
                         task_id='BQ-EVAL-01-INT-01-DEV', parent_id='BQ-EVAL-01-INT-01')
    return a


class RundeTests(Fixture):
    def run_profile(self, run, which='/usr/bin/node'):
        context = self.prepare(runde_activation())
        original = self.root / 'original'
        shutil.copytree(self.prepared, original)
        meta = self.success(context)
        environment = {'ANTHROPIC_API_KEY': 'synthetic', 'GH_TOKEN': 'synthetic', 'GITHUB_TOKEN': 'synthetic',
                       'PATH': '/usr/bin', 'LANG': 'C'}
        with patch.object(driver, 'PREPARED', original), patch.object(pp.shutil, 'which', return_value=which), \
             patch.object(pp.subprocess, 'run', side_effect=run), patch.dict(os.environ, environment):
            return pp.execute_proof(self.result, original, driver), meta, context

    def fake_node(self, calls, code=0, version=b'v22.5.0\n'):
        def run(argv, **kwargs):
            calls.append((argv, kwargs))
            if argv[1:] == ['--version']:
                return subprocess.CompletedProcess(argv, 0, version, b'')
            out = b'# tests 1\n# pass 1\n' if code == 0 else b'# tests 1\n# fail 1\n'
            return subprocess.CompletedProcess(argv, code, out, b'')
        return run

    def test_runde_profile_runs_existing_test_with_host_command_and_clean_environment(self):
        calls = []
        report, meta, context = self.run_profile(self.fake_node(calls))
        self.assertEqual((report['status'], report['exit_code'], report['profile']), ('PASS', 0, 'bq-runde-v1'))
        self.assertEqual(report['node_version'], 'v22.5.0')
        self.assertEqual(len(calls), 2)
        argv, kwargs = calls[1]
        self.assertEqual(argv[0], '/usr/bin/node')
        self.assertEqual(argv[1], '--experimental-permission')
        self.assertTrue(argv[2].startswith('--allow-fs-read=') and 'relay-runde-test-' in argv[2])
        self.assertEqual(argv[3:], [pp.RUNDE_TEST])
        self.assertNotIn('shell', kwargs)
        self.assertEqual(set(kwargs['env']), {'PATH', 'LANG'})
        self.assertEqual(kwargs['cwd'].name, 'restored')
        self.assertNotIn('Synthetic', ' '.join(argv))
        self.assertNotIn('relay-runde-test-', ' '.join(report['command']))
        self.assertEqual(report['changes_sha256'], meta['changes_sha256'])
        inventory = report['restored_inventory']
        for name, data in SOURCES.items():
            if name != pp.RUNDE_MODULE:
                self.assertEqual(inventory[name]['sha256'], pp.digest(data))
        self.assertNotEqual(inventory[pp.RUNDE_MODULE]['sha256'], pp.digest(RUNDE_JS))
        result = json.loads((self.result / 'changes.json').read_bytes())
        self.assertEqual(inventory[pp.RUNDE_MODULE]['sha256'], result['changes'][0]['sha256'])
        bad = copy.deepcopy(result)
        bad['changes'][0]['path'] = pp.RUNDE_TEST
        with self.assertRaises(ValueError):
            pp.validate_changes(bad, context, driver)

    def test_runde_profile_reports_nonzero_node_exit_as_fail(self):
        report, _, _ = self.run_profile(self.fake_node([], code=1))
        self.assertEqual((report['status'], report['exit_code']), ('FAIL', 1))
        self.assertIn('fail 1', report['stdout_tail'])

    def test_runde_profile_fails_closed_without_node(self):
        calls = []
        with self.assertRaisesRegex(ValueError, 'unavailable'):
            self.run_profile(self.fake_node(calls), which=None)
        self.assertEqual(calls, [])

    def test_runde_profile_fails_closed_on_node_without_permission_model(self):
        calls = []
        with self.assertRaisesRegex(ValueError, 'permission model'):
            self.run_profile(self.fake_node(calls, version=b'v18.19.0\n'))
        self.assertEqual(len(calls), 1)

    def test_runde_profile_contract_rejects_other_sources_edits_creates_roles_and_commands(self):
        driver.validate_activation(runde_activation(), PARENT)
        seed = '# Synthetic overlay\n'
        mutations = {
            'no test source': lambda a: a['contract'].update(read_files=a['contract']['read_files'][:2]),
            'no module source': lambda a: a['contract'].update(read_files=a['contract']['read_files'][::2]),
            'edit package': lambda a: a['contract'].update(edit_paths=['package.json']),
            'edit test': lambda a: a['contract'].update(edit_paths=[pp.RUNDE_TEST]),
            'edit none': lambda a: a['contract'].update(edit_paths=[]),
            'create': lambda a: a['contract'].update(create_paths=['src/module/extra.mjs']),
            'seed': lambda a: a['contract'].update(synthetic_files=[{'path': NEW, 'content': seed, 'sha256': pp.digest(seed.encode())}]),
            'role': lambda a: a.update(role='spec-agent'),
            'analysis': lambda a: a['contract'].update(mode='analysis', edit_paths=[]),
            'command': lambda a: a['contract'].update(test_command='node evil.mjs'),
            'other profile': lambda a: a['contract'].update(test_profile='bq-runde-v2'),
            'other repo': lambda a: a['contract'].update(repository='pahlborn/agentarium'),
            'agentarium identity': lambda a: a['contract']['identity'].update(project_id='agentarium'),
        }
        for name, mutate in mutations.items():
            a = runde_activation()
            mutate(a)
            with self.subTest(case=name), self.assertRaises((ValueError, TypeError)):
                driver.validate_activation(a, PARENT)

    def test_runde_sources_are_readable_in_analysis_without_write_rights(self):
        a = runde_activation()
        a['contract'].update(mode='analysis', edit_paths=[], test_profile='none')
        context = self.prepare(a)
        command = pp.command(context, driver)
        self.assertEqual(command[command.index('--tools') + 1], 'Read')
        self.assertFalse(pp.writable_paths(context))


OBSERVER_INIT = runtime.Observer.__init__
if __name__ == '__main__':
    unittest.main()
