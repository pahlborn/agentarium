# Handback: REST-ROT-01 v1 (task AG-BQ-EVAL-REST-ROT-FORGE-20261122)

Product task BQ-EVAL-01-REST-20261122. Baseline: pahlborn/bis-school-app_src@e17a46b1463b4d20a6ad5a4ecfde9ecb28467f86.
Author: Forge (Claude). Own execution of everything below: **NOT_RUN** (no shell). The earlier Sentinel run (log in the inputs) is reported evidence, not mine.
Changed by me: this handback only. The patch is not applied, not committed, not tested.

## 1. Diagnosis

Observed (Sentinel log): after recovery the origin has the event, with no outbox and no in-flight bundle. The other parent never gets it. Its stand shows logCount 0 and wartend []. Three more rounds change nothing.

Read from code, not run: the cause is a combination of two mechanisms that are each correct on their own.

1. `geraeteabgleich.gabBereich`, steps 4 and 5, plus `abgleich.vormerken` and `abgleich.senden`. The event is signed with the old author keys and `senden` seals it into `stand.unterwegs`. That bundle is bound to the old key version `kv`, and the old signature is kept. After the put fails (offline), the prepared bundle stays as it is, indefinitely.
2. `abgleich.holen`, rotation guard: `zuSpaet = wechsel.some(w => m.kv < w.version && betroffen(w) && nr > bis(w, dev))`. `betroffen` includes `w.erneuert`, so it covers a renewed author. The bundle was prepared with the old `kv` and its number `nr` is above the stand recorded in key_rotated. Once the origin uploads it after the rotation, every reader (the other parent) drops every entry in it with reason `nach-entfernung`. The reader's marker moves on, so the bundle is never read again.
3. The origin gets a confirmed put (`sent1`) and removes the entry from the outbox. The event stays in its own log. Nobody retries, so the loss is permanent.

The guard is right for foreign or forged old-key bundles. It cannot tell them apart from a legitimate bundle of the renewed person's own device that is only uploaded late.

Re-signing with the new key alone would not help. `annahme.annZuDerZeit` picks the key period by the event's `at`, and the old `at` lies in the old period. A new-key signature on an old `at` fails with `unterschrift`.

The Sentinel script computes `rejections` (the reasons) but never prints them. The exact reason on the other parent is therefore **inferred, not observed**. Atlas should print `parentRead.bericht.verworfen` on the unpatched code (see section 5) before accepting this diagnosis.

## 2. Chosen correction (smallest, in the two authorized files)

Only the origin device acts, and only with keys it holds now. Before sending, it signs again each still-unconfirmed own entry that fits these conditions:

- The author's keys are on this device.
- The admission shows exactly these keys as the author's current period.
- This device is currently registered for that author (no `device_removed`).
- The entry is not an admission event (`bereichVonEreignis` is not `'*'`) and fits this area (`passtZumBereich`).
- The author is not in the "old keys still open" phase (`offen`).
- The old signature no longer verifies against the author's current public key.

The new signature is made with the current keys. `at` is the later of now and the start of the author's current key period, so the new signature verifies against the correct period. The event id, payload (evaluation, revision, child) and author are unchanged. A prepared in-flight bundle that contains the entry is discarded, because it is sealed with the old `kv` and the old signature. `senden` rebuilds it with the current key version. If the old bundle had in fact arrived, the existing `vorhanden` / `abgFreieNummer` path takes the next free number. A reader that already holds the old variant gets the same id again, and "same id counts once" applies.

The app's own copy of the event is brought to the same `at`, so there is one time for one event id.

**Why revocation and source identity are preserved**
- No change to `holen`, `annahme` or `zulassung`. The guard stays fully active.
- Old-key bundles, forged old-key events and backdated entries are still rejected.
- Nobody re-signs for another author, because only keys in `personen` are used.
- A removed or unregistered device does not re-sign.
- Wrong-child and wrong-area entries are filtered by `passtZumBereich`.
- A removed member is not in the admission's current period, so nothing is re-signed for them.
- Entries already confirmed (not in the outbox) are never touched.
- Admission events are not re-signed.

**No material policy choice is needed:** no new confirmation, no second evaluation, same revision. The only visible effect is a later `at` on that one event, same id. No CA_QUESTION.

## 3. Patch (unified diff, apply from the product root)

Both hunk headers were counted by hand and not checked with `git apply --check`. If a header is off, Atlas should tell me the exact error. Do not edit the hunks by hand.

```diff
--- a/src/module/abgleich.mjs
+++ b/src/module/abgleich.mjs
@@ -88,6 +88,22 @@
   stand.log = abgEinordnen(stand.log, [kopie], now);
   return stand;
 }
+
+/* an own entry still in the outbox, signed anew (same event id; used when the author's keys were renewed before the
+   entry was confirmed). Not in the outbox (confirmed, or unknown) -> false, nothing changes. A prepared bundle that
+   holds the entry is dropped: it is sealed with the old key version, senden prepares it again. */
+export function ersetzen(stand, eintrag, { now = Date.now() } = {}) {
+  abgPruefeStand(stand);
+  if (!abgEintragOk(eintrag)) throw abgFehler('Eintrag ungueltig (erwartet { event, sig } aus signEvent).');
+  if (eintrag.event.device !== stand.geraet) throw abgFehler('nur Ereignisse dieses Geraets ersetzen.');
+  const i = stand.ausgang.findIndex((x) => x.event.id === eintrag.event.id);
+  if (i < 0) return false;
+  const kopie = abgClone(eintrag);
+  stand.ausgang[i] = kopie;
+  stand.log = abgEinordnen(stand.log.filter((x) => x.event.id !== kopie.event.id), [kopie], now);
+  if (stand.unterwegs && i < stand.unterwegs.anzahl) stand.unterwegs = null;
+  return true;
+}
 
 /* ---------- send ---------- */
 async function abgBuendel(bereich, eintraege, schluessel) {
--- a/src/module/geraeteabgleich.mjs
+++ b/src/module/geraeteabgleich.mjs
@@ -35,5 +35,6 @@
 import { newEvent, mergeLog, lastWins } from './ereignisse.mjs';
-import { signEvent } from './annahme.mjs';
+import { signEvent, canonicalBytes } from './annahme.mjs';
+import { verifyBytes } from './krypto.mjs';
 import { BEREICH_AUCH, bereichName, bereichVonEreignis, passtZumBereich, halter, schluesselLesen, schluesselVerteilen } from './bereiche.mjs';
-import { abgleichStand, vormerken, senden } from './abgleich.mjs';
+import { abgleichStand, vormerken, ersetzen, senden } from './abgleich.mjs';
 import { zulassungAus, aktiveMitglieder, bereichHolen } from './zulassung.mjs';
@@ -257,7 +258,19 @@
       if (!Object.prototype.hasOwnProperty.call(personen, e.author)) { bericht.ohneSchluessel++; continue; }
       vormerken(stand, await signEvent(e, area, signier(e.author)), { now });
     }
+    // 4b. an unconfirmed entry signed with keys the author has since renewed (e.g. the upload was interrupted, the key was
+    //     renewed on another device, now logged in again): readers would drop it (module abgleich: old key version after the
+    //     change) and the old signature no longer fits the period of its time. Only here, with the keys of the author
+    //     that this device holds NOW and the admission shows as current, from a device registered for him, and only the
+    //     app's own events of this area (never admission events): same event, signed again, time not before his
+    //     current keys. Nothing foreign is signed, nothing confirmed is touched, no check of the readers is loosened.
+    for (const x of stand.ausgang.slice()) {
+      const e = x.event, p = personen[e.author], m = zul.members[e.author];
+      if (!p || e.device !== geraet || bereichVonEreignis(e) === '*' || !passtZumBereich(e, area) || offen(e.author)) continue;
+      const pe = m && m.perioden[m.perioden.length - 1], gl = m && gabObj(m.geraete) && Array.isArray(m.geraete[geraet]) ? m.geraete[geraet] : null;
+      if (!pe || pe.bis !== null || !gabGleichePub(pe.pub, p.pub) || !gl || !gl.length || gl[gl.length - 1].bis !== null) continue;
+      if (await verifyBytes(p.pub, canonicalBytes(e, area), x.sig)) continue;
+      ersetzen(stand, await signEvent({ ...e, at: zeit(pe.von === null ? 0 : pe.von) }, area, p.keys), { now });
+    }
     // 5. send
     if (stand.ausgang.length || stand.unterwegs) {
       if (schreiber) bericht.gesendet += (await senden(stand, { zugang, schluessel: schreiber })).gesendet;
@@ -266,6 +279,16 @@
     //    Task "Abgleich in der App": inDieApp false (a child in the middle of a round) - nothing goes into the app now;
     //    it stays in the area's log and comes with the next sync (this step compares the whole log with the app's).
     const app = gabZiel(o.ablage, ziel);
+    // an entry of this device signed anew with a later time (step 4b): the app's copy gets that time, too
+    if (o.inDieApp) {
+      const imLog = new Map(stand.log.map((x) => [x.event.id, x.event]));
+      let geaendert = false;
+      const l = app.lesen().map((e) => { const n = gabObj(e) && e.device === geraet ? imLog.get(e.id) : null; if (!n || n.at === e.at || n.type !== e.type || n.author !== e.author || JSON.stringify(n.payload) !== JSON.stringify(e.payload)) return e; geaendert = true; return n; });
+      if (geaendert) app.schreiben(l);
+    }
     const da = new Set(app.lesen().map((e) => gabObj(e) && e.id));
     // A school replay can also restore a missing evaluation originally sent by this device.
     const neu = stand.log.map((x) => x.event).filter((e) =>
```

Notes on the patch:
- The `-258,5`-style hunk counts above were written without `git apply --check`. If Atlas's `git apply --check` rejects a hunk, tell me the exact error.
- Step 4b uses `zul`, which was rebuilt after step 3 (`neuBilden`), so it is current.
- `zeit()` is the existing time helper of `gabBereich`. It never goes below `now`.
- The app-copy reconcile only runs when `inDieApp` is true. It replaces an app event only when the id matches and type, author and payload are identical, so only `at` can differ.

## 4. Permanent regression test

Add as a new file `tests/module/evaluation-offline-rotation.test.mjs`. It is a complete file, not a diff. It reuses the product helpers exactly as the Sentinel script does, with relative imports. It runs on the simulation only.

```js
// REST-ROT-01: a confirmed school evaluation, signed and prepared for upload, then the upload is interrupted; the same
// parent renews the keys on another device and logs in again -> the original event reaches the other parent exactly once.
//   node --test tests/module/evaluation-offline-rotation.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verbindungen, kindAnlegen, elternteilEinladen, abgleichMitVerbindungen } from '../../src/module/einladung.mjs';
import { startcodeAusstellen, ersteAnmeldung, anmelden, schluesselErneuern } from '../../src/module/konto.mjs';
import { lokalerSpeicher } from '../../src/module/speicher.mjs';
import { newEvent, checkEvent } from '../../src/module/ereignisse.mjs';
import { GERAETEABGLEICH_SPEICHER } from '../../src/module/geraeteabgleich.mjs';

const R = 1000, T0 = Date.UTC(2026, 10, 4, 8), HEUTE = '2026-11-04';
const PW = { verwalter: 'Tiger-Lamp-River-4271', peter: 'Otter-Cake-Moss-1234', anna: 'Koala-Bread-Cliff-5502', kathie: 'Puffin-Jam-Lake-9876', neu: 'Walrus-Taco-Pine-1357' };
const weiter = (W, ms = 60000) => (W.uhr.t += ms);
const ablage = () => { const m = new Map(); return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); } }; };
function geraet(W, d, konto) {
  const a = ablage(); a.setItem('bq2_evDevice', JSON.stringify(d));
  const g = {
    a, d, konto,
    z: () => W.geraet(d),
    sync: () => abgleichMitVerbindungen({ ablage: a, zugang: W.geraet(d), konten: [g.konto], now: weiter(W), heute: HEUTE }),
    v: () => verbindungen({ ablage: a, konto: g.konto, now: W.uhr.t }),
    log: (kind) => JSON.parse(a.getItem('bq2_' + kind + '__events') || '[]'),
    antworten: (kind) => g.log(kind).filter((e) => e.type === 'answer').map((e) => e.id).sort(),
    ueben: (n) => {
      const k = 'bq2_' + g.konto.kennung + '__events', l = JSON.parse(a.getItem(k) || '[]');
      for (let i = 0; i < n; i++) l.push(newEvent({ type: 'answer', author: g.konto.kennung, device: d, at: new Date(weiter(W, 1000)).toISOString(), payload: { day: HEUTE, skill: 'numbers', level: 2, attempt: 1, ok: true, qid: 'q' + l.length } }));
      a.setItem(k, JSON.stringify(l));
    },
    schreibt: (kind, type, payload) => {
      const k = 'bq2_' + kind + '__events', l = JSON.parse(a.getItem(k) || '[]');
      l.push(newEvent({ type, author: g.konto.kennung, device: d, at: new Date(weiter(W, 1000)).toISOString(), payload }));
      a.setItem(k, JSON.stringify(l));
    },
    fertig: (r) => { assert.deepEqual(r.erneuerungOffen, [], 'alle Bereiche haben den neuen Schluessel'); if (g.konto.alt) { g.konto = { ...g.konto }; delete g.konto.alt; } },
  };
  return g;
}
async function einloesen(W, d, qr, passwort) {
  return geraet(W, d, await ersteAnmeldung({ zugang: W.geraet(d), code: qr.code, passwort, fingerabdruck: qr.fingerabdruck, now: W.uhr.t, runden: R }));
}
async function familie(W) {
  const sa = await startcodeAusstellen({ zugang: W.geraet('d_A1'), aussteller: null, anmeldename: 'verwalter', art: 'admin', now: W.uhr.t });
  const admin = await ersteAnmeldung({ zugang: W.geraet('d_A1'), code: sa.code, passwort: PW.verwalter, now: W.uhr.t, runden: R });
  const sp = await startcodeAusstellen({ zugang: W.geraet('d_A1'), aussteller: admin, anmeldename: 'peter', art: 'parent', now: W.uhr.t });
  const P1 = await einloesen(W, 'd_P1', sp, PW.peter);
  await P1.sync();
  const e = await elternteilEinladen({ zugang: P1.z(), ablage: P1.a, konto: P1.konto, anmeldename: 'anna', now: weiter(W) });
  const P2 = await einloesen(W, 'd_P2', e, PW.anna);
  await P2.sync(); await P1.sync(); await P2.sync();
  const qr = await kindAnlegen({ zugang: P1.z(), ablage: P1.a, konto: P1.konto, anmeldename: 'kathie', anzeigename: 'Kathie', now: weiter(W) });
  const K = await einloesen(W, 'd_K1', qr, PW.kathie);
  await K.sync(); await P1.sync(); await K.sync(); await P2.sync(); await P1.sync();
  K.ueben(3); await K.sync(); await P1.sync(); await P2.sync();
  assert.equal(P2.antworten(K.konto.kennung).length, 3, 'Ausgangslage: Anna sieht 3 Antworten');
  return { admin, P1, P2, K };
}

for (const zustand of ['prepared in-flight (signed, bundle prepared, upload interrupted)']) {
  test('REST-ROT-01: ' + zustand + ' -> the confirmed evaluation reaches the other parent once after the renewal', async () => {
    const uhr = { t: T0 }, storage = lokalerSpeicher({ now: () => uhr.t });
    let blocked = null;
    const W = { uhr, geraet(d) { const z = storage.geraet(d); return { ...z, async put(area, ...args) { if (blocked && blocked.device === d && blocked.area === area) { const e = new Error('Synthetic dropped upload'); e.code = 'offline'; throw e; } return z.put(area, ...args); } }; } };
    const { P1, P2, K } = await familie(W), child = K.konto.kennung, area = 'schule:' + child;
    const P1b = geraet(W, 'd_P1b', await anmelden({ zugang: W.geraet('d_P1b'), anmeldename: 'peter', passwort: PW.peter, runden: R }));
    await P1b.sync();
    const evaluation = '0a667a6c-8d8c-4520-a6ec-000000000001', revision = '0a667a6c-8d8c-4520-a6ec-000000000002';
    P1.schreibt(child, 'school_evaluation', { child, evaluation, revision, title: 'Synthetic REST rotation evaluation', day: HEUTE, assessment: { area: 'maths', goal: '', instructions: '', feedback: '', criteria: [{ criterion: 'Synthetic place value criterion', rating: 'C', standard: 'M-N1', evidence: '' }] } });
    const event = P1.log(child).find((e) => e.payload && e.payload.evaluation === evaluation);
    assert.deepEqual(checkEvent(event), []);
    blocked = { device: P1.d, area };
    await P1.sync();
    const st = JSON.parse(P1.a.getItem(GERAETEABGLEICH_SPEICHER.staende))[area];
    assert.ok(st.ausgang.some((x) => x.event.id === event.id && x.sig), 'signed outbox');
    assert.ok(st.unterwegs && st.unterwegs.inhalt && st.unterwegs.anzahl > 0, 'prepared in-flight');
    await P2.sync(); assert.equal(P2.log(child).filter((e) => e.id === event.id).length, 0);
    const beforePub = JSON.stringify(P1.konto.pub);
    P1b.konto = await schluesselErneuern({ zugang: P1b.z(), anmeldename: 'peter', passwort: PW.peter, neuesPasswort: PW.neu, runden: R });
    P1b.fertig(await P1b.sync());
    assert.notEqual(JSON.stringify(P1b.konto.pub), beforePub);
    P1.konto = await anmelden({ zugang: P1.z(), anmeldename: 'peter', passwort: PW.neu, runden: R });
    assert.equal(JSON.stringify(P1.konto.pub), JSON.stringify(P1b.konto.pub));
    assert.ok(P1.v().kinder.some((x) => x.id === child), 'same child, still authorized');
    blocked = null;
    await P1.sync(); await P2.sync(); await P1b.sync(); await K.sync();
    for (let n = 0; n < 3; n++) for (const g of [P1, P1b, P2, K]) await g.sync();   // stable: no duplicate, no change
    for (const g of [P1, P2]) {
      const mine = g.log(child).filter((e) => e.id === event.id);
      assert.equal(mine.length, 1, g.d + ': the evaluation exactly once');
      assert.equal(mine[0].type, 'school_evaluation');
      assert.equal(mine[0].author, event.author);
      assert.deepEqual(mine[0].payload, event.payload, g.d + ': same child, evaluation, revision');
      assert.equal(g.log(child).filter((e) => e.payload && e.payload.evaluation === evaluation && e.payload.revision === revision).length, 1, g.d + ': same revision once');
    }
    assert.equal(P2.log(child).filter((e) => e.payload && e.payload.evaluation === evaluation).length, 1, 'no second evaluation');
    const st2 = JSON.parse(P1.a.getItem(GERAETEABGLEICH_SPEICHER.staende))[area];
    assert.equal(st2.ausgang.length, 0); assert.equal(st2.unterwegs, null);
  });
}
```

Test limits:
- It is the Sentinel script as a permanent test, so it reproduces the original failure on the unpatched baseline. The decisive assertion is `P2 ... exactly once`.
- I did not write a new forged old-key test, because I cannot run it here. Protection against forgery, backdating and old keys rests on the existing suites, which cover those cases. Atlas should re-run them as a regression gate (section 5).
- It covers the prepared in-flight state, which includes a signed outbox. The unsigned offline intent (event only in the app log) is already covered by step 4: it is signed with the then-current keys at the next sync, so no new code path is involved.

## 5. Proposed checks (Atlas / Sentinel; all NOT_RUN by me)

1. **Reproduce the cause before patching.** On the unpatched candidate, run the Sentinel script with an extra `console.log(JSON.stringify(parentRead.bericht.verworfen))` and `recovered.bericht.verworfen`. Expected from my reading: an entry on the other parent with `grund: 'nach-entfernung'` and `typ: 'school_evaluation'`. If the reason is something else, stop. The patch then likely does not fix it, and I need the reason.
2. **Failure and recovery.** Apply the patch, add the test file, then run `node --test tests/module/evaluation-offline-rotation.test.mjs`. Also run the Sentinel script with imports redirected to the candidate. Expected: the other parent has 1 for event id `e_...` (same id) and 1 for evaluation/revision.
3. **Existing regression gate.** Run `node --test tests/module/erneuern.test.mjs tests/module/abgleich.test.mjs tests/module/geraeteabgleich.test.mjs`. These must stay green. They cover revocation, old-key and backdating rejection, response-loss idempotency, device removal and snapshot semantics.
4. **Normal path.** An evaluation with no rotation and no interruption: the entry is not re-signed. `at` is unchanged, because the old signature still verifies against the current key and step 4b skips it. The existing suites cover this too.

## 6. Risks and assumptions

- **Assumption:** `key_rotated.erneuert` is set for a renewed person and the other parent's rejection is `nach-entfernung` (from code reading, check 1 above).
- **Risk:** the re-signed event has a later `at` than the original. The only effect is event-order position. Events by another author written in between could sort before it. The evaluation chain works through `base` and `revision`, not through time, but `ableitung`/`deriveSchool` was not read. Sentinel should run an evaluation-conflict test if one exists.
- **Risk:** other pending non-admission own events of the same renewed author are treated the same way. That is intended.
- **Not covered (out of scope):** pending admission events (device_added) of a renewed author, because bundle rejection for them has the same cause. I did not touch them, to avoid re-signing anything related to membership. If real use needs it, send me the separate case.
- **Not covered:** a device that stays offline and still holds only the old keys cannot re-sign. It cannot send either, because it fails with "old keys". It recovers after login with the new keys, the same as in this test.
- **Hunk headers in section 3** were counted by hand and not machine-checked.

## 7. Next step

Atlas applies the patch (section 3), creates the test file (section 4), and runs checks 1 to 3 on the exact candidate through an authorized executor. Sentinel then reviews. Results are not available to me. I make no claim of PASS and no claim of a product commit.
