// Aufgabe "Neuer Schluessel" (Vorbereitung Stufe 4, Teil a; US9.7, Konzept 8.2, 8.4): ein Erwachsener erneuert seinen
// Personenschluessel - von Hand ("Schluessel erneuern") und immer beim Wiederherstellen. Jede Pruefung laeuft gegen die
// Simulation UND den nachgebauten GitHub-Server. Geraete sind Ablagen ohne App; "ueben" = answer-Ereignisse ins Protokoll.
//   node --test tests/module/erneuern.test.mjs
//
// Erfolgskriterium: Nach dem Erneuern oeffnet weder das alte Passwort mit einer alten Speicherkopie noch ein Geraet mit
// dem alten Schluessel etwas NEUES; schon Gesehenes bleibt gesehen. Die uebrigen Geraete und die Familie arbeiten weiter.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { verbindungen, kindAnlegen, elternteilEinladen, kindPasswortNeu, abgleichMitVerbindungen } from '../../src/module/einladung.mjs';
import { KONTO_FEHLER, startcodeAusstellen, ersteAnmeldung, anmelden, wiederherstellen, schluesselErneuern, kontoLookup, kontoStand, kontoPersonen } from '../../src/module/konto.mjs';
import { lokalerSpeicher, SPEICHER_FEHLER } from '../../src/module/speicher.mjs';
import { githubSpeicher } from '../../src/module/github.mjs';
import { githubNachbau } from './github-nachbau.mjs';
import { geraetAbgleichen, GERAETEABGLEICH_SPEICHER } from '../../src/module/geraeteabgleich.mjs';
import { newEvent } from '../../src/module/ereignisse.mjs';
import { signEvent } from '../../src/module/annahme.mjs';
import { schluesselLesen, schluesselFuer } from '../../src/module/bereiche.mjs';
import { abgleichStand, vormerken, senden } from '../../src/module/abgleich.mjs';
import { newPersonKeys, publicKeysOf, lockPersonKeys, unlockPersonKeys, unwrapKey, signBytes, keyFingerprint, openEntryText, entryAad } from '../../src/module/krypto.mjs';

const R = 1000;                                       // PBKDF2-Runden in den Tests (die App: 600 000)
const T0 = Date.UTC(2026, 10, 4, 8, 0, 0), HEUTE = '2026-11-04';
const PW = { verwalter: 'Tiger-Lamp-River-4271', peter: 'Otter-Cake-Moss-1234', anna: 'Koala-Bread-Cliff-5502', kathie: 'Puffin-Jam-Lake-9876', lehrer: 'Gecko-Plum-Reef-6060', neu: 'Walrus-Taco-Pine-1357', neu2: 'Heron-Fig-Dune-2468', neu3: 'Lynx-Pear-Bay-3579' };
const REPO = 'pahlborn/bis-school-app-testdaten';
const TOKEN = 'github_pat_ERNEUERN_' + 'p3X9'.repeat(10);
let N, lauf = 0;
before(async () => { N = await githubNachbau({ token: TOKEN, repos: [REPO] }); });
after(async () => { await N.schliessen(); });

const WELTEN = {
  Simulation: () => { const uhr = { t: T0 }, s = lokalerSpeicher({ now: () => uhr.t }); return { uhr, geraet: (d) => s.geraet(d) }; },
  'GitHub (Nachbau)': () => {
    const uhr = { t: T0 }, wurzel = 'erneuern-' + (++lauf);
    return { uhr, geraet: (d) => githubSpeicher({ repo: REPO, token: TOKEN, basis: N.basis, wurzel, now: () => uhr.t }).geraet(d) };
  },
};
const jedeWelt = (name, fn) => { for (const [w, neu] of Object.entries(WELTEN)) test(`${w}: ${name}`, () => fn(neu())); };
const weiter = (W, ms = 60 * 1000) => (W.uhr.t += ms);
async function fehlt(p, code, text) {
  assert.ok(KONTO_FEHLER.includes(code) || SPEICHER_FEHLER.includes(code), 'bekannter Code ' + code);
  await assert.rejects(p, (e) => { assert.equal(e.code, code, text); return true; }, text);
}

/* ein Geraet ohne App: eigene Ablage mit Kennung; konto kann wechseln (neu anmelden, Schluessel erneuert) */
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
    name: (kind) => g.log(kind).filter((e) => e.type === 'profile_set' && e.payload.field === 'name').map((e) => e.payload.value).pop(),
    ueben: (n) => {
      const k = 'bq2_' + g.konto.kennung + '__events', l = JSON.parse(a.getItem(k) || '[]');
      for (let i = 0; i < n; i++) l.push(newEvent({ type: 'answer', author: g.konto.kennung, device: d, at: new Date(weiter(W, 1000)).toISOString(), payload: { day: HEUTE, skill: 'numbers', level: 2, attempt: 1, ok: true, qid: 'q' + l.length } }));
      a.setItem(k, JSON.stringify(l));
    },
    /* ein Elternteil schreibt in das Protokoll eines Kindes (wie die App, unsigniert) */
    schreibt: (kind, type, payload) => {
      const k = 'bq2_' + kind + '__events', l = JSON.parse(a.getItem(k) || '[]');
      l.push(newEvent({ type, author: g.konto.kennung, device: d, at: new Date(weiter(W, 1000)).toISOString(), payload }));
      a.setItem(k, JSON.stringify(l));
    },
    /* die App wirft "alt" weg, sobald nichts mehr offen ist */
    fertig: (r) => { assert.deepEqual(r.erneuerungOffen, [], 'alle Bereiche haben den neuen Schluessel'); if (g.konto.alt) { g.konto = { ...g.konto }; delete g.konto.alt; } },
  };
  return g;
}
async function einloesen(W, d, qr, passwort) {
  return geraet(W, d, await ersteAnmeldung({ zugang: W.geraet(d), code: qr.code, passwort, fingerabdruck: qr.fingerabdruck, now: W.uhr.t, runden: R }));
}
/* Admin, Peter (Gruender), Anna (zweiter Elternteil), Kathie (von Peter angelegt, uebt 3x) - alle abgeglichen */
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
const lern = (K) => 'kind:lern:' + K.konto.kennung;
const version = async (W, area) => Math.max(...Object.values(await W.geraet('d_X').keys(area)).flatMap((e) => Object.keys(e.versionen).map(Number)));
/* liest mit diesen Bereichsschluesseln (Map Version -> Schluessel) alles, was im Speicher liegt -> Ids der Antworten */
async function mitSchluesselnLesen(W, area, keys) {
  const z = W.geraet('d_X'), { kennungen } = await z.list(area, null), out = [];
  for (const k of kennungen) {
    const b = await z.get(area, k);
    if (!keys.has(b.kv)) continue;
    for (const x of b.eintraege) {
      const item = JSON.parse(await openEntryText(keys.get(b.kv), { iv: x.iv, ct: x.ct }, entryAad(area, b.kv, x.id)));
      if (item.event.type === 'answer') out.push(item.event.id);
    }
  }
  return out.sort();
}
/* eine Speicherkopie (z. B. Git-Historie): Verzeichniseintraege eines Kontos und Schluesseleintraege eines Bereichs */
async function kopieren(W, name, area) {
  const z = W.geraet('d_X'), l = await kontoLookup(name), verzeichnis = [await z.directory(l)];
  for (let n = 2; ; n++) { const e = await z.directory(l + '-' + n); if (!e) break; verzeichnis.push(e); }
  return { verzeichnis, keys: JSON.parse(JSON.stringify(await z.keys(area))) };
}
/* was jemand mit der Kopie und dem Passwort oeffnet: Personenschluessel aus dem passenden Schloss, dann die Versionen */
async function mitKopieOeffnen(kopie, kennung, passwort, area) {
  let keys = null;
  for (const e of kopie.verzeichnis) { try { keys = await unlockPersonKeys({ ...e.gesperrt, pub: e.pub }, kennung, passwort); } catch (err) { /* anderes Schloss */ } }
  assert.ok(keys, 'die Kopie oeffnet sich mit dem alten Passwort');
  const out = new Map(), mein = kopie.keys[kennung];
  for (const [v, w] of Object.entries(mein ? mein.versionen : {})) { try { out.set(Number(v), await unwrapKey(w, keys, kennung, area, Number(v))); } catch (err) { /* nicht fuer diese Schluessel */ } }
  return { keys, versionen: out };
}

/* ---------- 1 + 2: alte Speicherkopie, anderes Geraet mit altem Schluessel, Familie arbeitet weiter ---------- */
jedeWelt('Schluessel erneuern: alte Speicherkopie + altes Passwort liest Altes, nichts Neues; zweites Geraet mit altem Schluessel liest nichts Neues und schreibt nichts, was zaehlt; Familie und Lehrkraft-freie Bereiche arbeiten ohne Unterbrechung', async (W) => {
  const { P1, P2, K } = await familie(W);
  const kk = K.konto.kennung, L = lern(K), pk = P1.konto.kennung;
  // Peters zweites Geraet, noch mit dem alten Schluessel angemeldet
  const P1b = geraet(W, 'd_P1b', await anmelden({ zugang: W.geraet('d_P1b'), anmeldename: 'peter', passwort: PW.peter, runden: R }));
  await P1b.sync();
  const tP1b = W.uhr.t;
  assert.equal(P1b.antworten(kk).length, 3);
  const kopie = await kopieren(W, 'peter', L);
  const vorher = await version(W, L);

  // erneuern: aktuelles Passwort, neues Passwort; neuer Wiederherstellungscode, neuer Fingerabdruck
  await fehlt(schluesselErneuern({ zugang: P1.z(), anmeldename: 'peter', passwort: 'Falsch-Falsch-Pass-1', neuesPasswort: PW.neu, runden: R }), 'anmeldung', 'falsches Passwort');
  await fehlt(schluesselErneuern({ zugang: P1.z(), anmeldename: 'peter', passwort: PW.peter, neuesPasswort: PW.peter, runden: R }), 'passwort-gleich');
  await fehlt(schluesselErneuern({ zugang: P1.z(), anmeldename: 'peter', passwort: PW.peter, neuesPasswort: 'peter1234567', runden: R }), 'passwort-schwach');
  await fehlt(schluesselErneuern({ zugang: K.z(), anmeldename: 'kathie', passwort: PW.kathie, neuesPasswort: PW.neu, runden: R }), 'nicht-erlaubt', 'Kind: neue Schluessel nur ueber die Eltern');
  const altPub = P1.konto.pub;
  const neu = await schluesselErneuern({ zugang: P1.z(), anmeldename: 'peter', passwort: PW.peter, neuesPasswort: PW.neu, runden: R });
  assert.deepEqual([neu.kennung, neu.stand, neu.ursprung, neu.alt.pub], [pk, 2, altPub, altPub]);
  assert.notDeepEqual(neu.pub, altPub);
  assert.equal(neu.fingerabdruck, await keyFingerprint(neu.pub));
  assert.equal(neu.wiederherstellungscode.length, 24);
  assert.equal(neu.schluessel.ecdsa.privateKey.extractable, false);
  assert.deepEqual((await kontoStand({ zugang: W.geraet('d_X'), anmeldename: 'peter' })).pub, neu.pub, 'das Verzeichnis zeigt die neuen Schluessel');
  P1.konto = neu;
  const r = await P1.sync();
  P1.fertig(r);
  assert.deepEqual(r.bericht.verworfen, []);
  for (const a of [L, 'kind:privat:' + kk, 'schule:' + kk, 'eltern:allg:' + kk, 'familie:' + pk, 'person:' + pk]) {
    assert.ok((await version(W, a)) >= 2, 'neue Version in ' + a);
    assert.equal((await W.geraet('d_X').keys(a))[pk].fuer, await schluesselFuer(neu.pub), 'Peters Eintrag fuer die neuen Schluessel: ' + a);
  }
  assert.ok((await version(W, L)) > vorher);

  // die Familie arbeitet weiter: Kathie uebt, Anna und Peter sehen alles; nichts wird verworfen
  K.ueben(2);
  for (const G of [K, P2, P1, K, P2]) { const x = await G.sync(); assert.deepEqual(x.bericht.verworfen, [], G.d); assert.deepEqual(x.warnungen, [], G.d); }
  for (const G of [P1, P2, K]) assert.equal(G.antworten(kk).length, 5, G.d);
  assert.equal(P1.name(kk), 'Kathie');

  // 1. alte Speicherkopie + altes Passwort: Altes lesbar, Neues nicht
  await fehlt(anmelden({ zugang: W.geraet('d_X'), anmeldename: 'peter', passwort: PW.peter, runden: R }), 'anmeldung', 'altes Passwort oeffnet das Konto nicht mehr');
  const dieb = await mitKopieOeffnen(kopie, pk, PW.peter, L);
  const gelesen = await mitSchluesselnLesen(W, L, dieb.versionen);
  assert.equal(gelesen.length, 3, 'nur die 3 alten Antworten');
  assert.ok(Math.max(...dieb.versionen.keys()) < (await version(W, L)), 'die neue Version fehlt ihm');
  const heute = await schluesselLesen(W.geraet('d_X'), L, { ich: pk, meineSchluessel: dieb.keys, mitglieder: { [pk]: { role: 'parent', pub: neu.pub, frueher: [altPub] }, [P2.konto.kennung]: { role: 'parent', pub: P2.konto.pub } } });
  assert.equal(heute.lesbar.size, 0, 'mit dem alten Schluessel oeffnet der heutige Speicher nichts mehr');
  // ... und der Dieb kann mit dem alten Schluessel kein neues Verzeichnis-Schloss anlegen, das zaehlt (Kette ab dem neuen)
  const boese = await newPersonKeys(), bpub = await publicKeysOf(boese), l = await kontoLookup('peter');
  const kanon = (x) => (x === null || typeof x !== 'object' ? JSON.stringify(x) : Array.isArray(x) ? '[' + x.map(kanon).join(',') + ']' : '{' + Object.keys(x).sort().filter((k) => x[k] !== undefined).map((k) => JSON.stringify(k) + ':' + kanon(x[k])).join(',') + '}');
  const f = { v: 1, lookup: l + '-3', stand: 3, kennung: pk, pub: bpub, gesperrt: await lockPersonKeys(boese, pk, ['Boese-Bohne-Moos-1111', 'AAAA-BBBB-CCCC-DDDD-EEEE'], { rounds: R }) };
  f.wechsel = await signBytes(dieb.keys, 'bq-konto-wechsel|' + kanon({ lookup: f.lookup, stand: 3, kennung: pk, pub: bpub }));
  f.sig = await signBytes(boese, 'bq-konto-erneuert|' + kanon(f));
  await W.geraet('d_X').putDirectory(f);
  assert.deepEqual((await kontoStand({ zugang: W.geraet('d_X'), anmeldename: 'peter' })).pub, neu.pub, 'mit dem alten Schluessel angekuendigt: zaehlt nicht');
  await fehlt(anmelden({ zugang: W.geraet('d_X'), anmeldename: 'peter', passwort: 'Boese-Bohne-Moos-1111', runden: R }), 'anmeldung');

  // 2. Peters zweites Geraet mit dem alten Schluessel: liest nichts Neues, sein Schreiben kommt nicht an
  const rb = await P1b.sync();
  assert.equal(P1b.antworten(kk).length, 3, 'nichts Neues');
  P1b.schreibt(kk, 'profile_set', { field: 'name', value: 'Altes-Geraet' });
  await P1b.sync();
  assert.ok(Object.values(rb.bericht.bereiche).some((b) => b.fehler === 'kein-schluessel' || b.fehler === 'schluessel-ungeprueft' || b.ok), 'kein Absturz');
  // auch ein zurueckdatierter Eintrag mit dem alten Schluessel und einer alten Version zaehlt nicht (Speicherkopie + Schreibrecht)
  const st = abgleichStand(L, 'd_P1b');
  const alt = newEvent({ type: 'profile_set', author: pk, device: 'd_P1b', at: new Date(tP1b + 10 * 1000).toISOString(), payload: { field: 'name', value: 'Zurueckdatiert' } });
  vormerken(st, await signEvent(alt, L, dieb.keys), { now: W.uhr.t });
  await senden(st, { zugang: W.geraet('d_P1b'), schluessel: { aktuell: Math.max(...dieb.versionen.keys()), keys: dieb.versionen } });
  const r2 = await P2.sync();
  assert.ok(r2.bericht.verworfen.some((v) => v.grund === 'nach-entfernung' && v.bereich === L), 'verworfen: alte Version nach dem Wechsel');
  await P1.sync(); await K.sync();
  for (const G of [P1, P2, K]) assert.equal(G.name(kk), 'Kathie', 'nichts vom alten Schluessel: ' + G.d);

  // nach der Anmeldung mit dem neuen Passwort: dasselbe Geraet liest alles und schreibt wieder
  P1b.konto = await anmelden({ zugang: W.geraet('d_P1b'), anmeldename: 'peter', passwort: PW.neu, runden: R });
  assert.deepEqual([P1b.konto.pub, P1b.konto.stand, P1b.konto.ursprung], [neu.pub, 2, altPub]);
  await P1b.sync();
  assert.equal(P1b.antworten(kk).length, 5);
  assert.deepEqual(P1b.v().familie, pk, 'eigener Bereich mit Familie: ueber die Erneuerung hinweg lesbar');
  P1b.schreibt(kk, 'list_set', { list: 'unlocked', item: 'fractions', on: true });
  await P1b.sync(); await P2.sync();
  assert.ok(P2.log(kk).some((e) => e.type === 'list_set' && e.device === 'd_P1b'), 'Peters Geraet schreibt wieder');
  // ein ganz neues Geraet (neues Passwort) findet seine Familie und Kathie
  const P1c = geraet(W, 'd_P1c', await anmelden({ zugang: W.geraet('d_P1c'), anmeldename: 'peter', passwort: PW.neu, runden: R }));
  await P1c.sync();
  assert.deepEqual(P1c.v().kinder.map((c) => c.id), [kk]);
  assert.equal(P1c.antworten(kk).length, 5);
});

/* ---------- 3: der zweite Elternteil uebernimmt nur mit gueltiger Unterschrift ---------- */
jedeWelt('Zweiter Elternteil: neuer Schluessel nur mit Unterschrift des alten - Hinweis mit neuem Fingerabdruck; gefaelschte Ankuendigung -> Warnung, nichts verpackt; gefaelschter Verzeichniseintrag zaehlt nicht', async (W) => {
  const { P1, P2, K } = await familie(W);
  const kk = K.konto.kennung, L = lern(K), pk = P1.konto.kennung;
  // Faelschung 1: jemand mit einem Bereichsschluessel (hier Kathies Geraet) kuendigt fuer Peter fremde Schluessel an
  const boese = await newPersonKeys(), bpub = await publicKeysOf(boese);
  const mitglieder = { [pk]: { role: 'parent', pub: P1.konto.pub }, [P2.konto.kennung]: { role: 'parent', pub: P2.konto.pub }, [kk]: { role: 'child', pub: K.konto.pub } };
  const s = await schluesselLesen(W.geraet('d_K1'), L, { ich: kk, meineSchluessel: K.konto.schluessel, mitglieder });
  const st = abgleichStand(L, 'd_P1');
  const falsch = newEvent({ type: 'member_added', author: pk, device: 'd_P1', at: new Date(weiter(W)).toISOString(), payload: { person: pk, role: 'parent', pub: bpub, stand: 2 } });
  vormerken(st, await signEvent(falsch, L, boese), { now: W.uhr.t });
  await senden(st, { zugang: W.geraet('d_P1'), schluessel: { aktuell: s.aktuell, keys: s.keys } });
  const r = await P2.sync();
  assert.deepEqual(r.warnungen.map((w) => [w.art, w.grund, w.bereich]), [['schluessel', 'unterschrift', L]], 'Warnung');
  assert.deepEqual(r.erneuert, [], 'kein Hinweis "erneuert"');
  await P1.sync(); await P2.sync();
  const fb = await schluesselFuer(bpub);
  for (const [h, e] of Object.entries(await W.geraet('d_X').keys(L))) assert.notEqual(e.fuer, fb, 'nichts fuer den fremden Schluessel verpackt: ' + h);
  // Faelschung 2: ein Verzeichniseintrag mit neuen Schluesseln, aber ohne Peters alte Unterschrift
  const l = await kontoLookup('peter');
  const kanon = (x) => (x === null || typeof x !== 'object' ? JSON.stringify(x) : Array.isArray(x) ? '[' + x.map(kanon).join(',') + ']' : '{' + Object.keys(x).sort().filter((k) => x[k] !== undefined).map((k) => JSON.stringify(k) + ':' + kanon(x[k])).join(',') + '}');
  const f = { v: 1, lookup: l + '-2', stand: 2, kennung: pk, pub: bpub, gesperrt: await lockPersonKeys(boese, pk, ['Boese-Bohne-Moos-1111', 'AAAA-BBBB-CCCC-DDDD-EEEE'], { rounds: R }) };
  f.wechsel = await signBytes(boese, 'bq-konto-wechsel|' + kanon({ lookup: f.lookup, stand: 2, kennung: pk, pub: bpub }));
  f.sig = await signBytes(boese, 'bq-konto-erneuert|' + kanon(f));
  await W.geraet('d_X').putDirectory(f);
  assert.deepEqual((await kontoStand({ zugang: W.geraet('d_X'), anmeldename: 'peter' })).pub, P1.konto.pub, 'zaehlt nicht');
  await fehlt(anmelden({ zugang: W.geraet('d_X'), anmeldename: 'peter', passwort: 'Boese-Bohne-Moos-1111', runden: R }), 'anmeldung');

  // die echte Erneuerung (der gefaelschte Platz 2 ist belegt: Peter schreibt auf 3)
  const neu = await schluesselErneuern({ zugang: P1.z(), anmeldename: 'peter', passwort: PW.peter, neuesPasswort: PW.neu, runden: R });
  assert.equal(neu.stand, 3);
  P1.konto = neu;
  P1.fertig(await P1.sync());
  const r2 = await P2.sync();
  assert.deepEqual(r2.erneuert.map((x) => [x.person, x.fingerabdruck, x.stand]), [[pk, neu.fingerabdruck, 3]], 'Hinweis: Peter hat seinen Schluessel erneuert, mit neuem Fingerabdruck');
  assert.deepEqual(r2.warnungen, []);
  assert.deepEqual((await P2.sync()).erneuert, [], 'nur einmal');
  // Anna vermerkt die neuen Schluessel in der Familie
  const fam = JSON.parse(P2.a.getItem(GERAETEABGLEICH_SPEICHER.familien))[pk].filter((e) => e.type === 'family_set' && e.author === P2.konto.kennung && e.payload.person === pk);
  assert.deepEqual(fam.pop().payload.pub, neu.pub);
  K.ueben(1); await K.sync(); await P2.sync(); await P1.sync();
  assert.equal(P1.antworten(kk).length, 4);
});

/* ---------- 4: Lehrkraft mit laufender Freigabe ---------- */
jedeWelt('Lehrkraft mit laufender Freigabe: liest nach dem Schluesselwechsel der Eltern weiter; erneuert sie ihren eigenen Schluessel, verpacken die Eltern neu und sie liest weiter', async (W) => {
  const { admin, P1, K } = await familie(W);
  const kk = K.konto.kennung, L = lern(K), pk = P1.konto.kennung;
  const sl = await startcodeAusstellen({ zugang: W.geraet('d_A1'), aussteller: admin, anmeldename: 'lehrer', art: 'teacher', now: W.uhr.t });
  const T = await einloesen(W, 'd_T1', sl, PW.lehrer);
  const tk = T.konto.kennung;
  // Peter gibt Kathies Lernstand frei (wie die App: grant_set ins Protokoll des Kindes)
  P1.schreibt(kk, 'grant_set', { grant: 'g1', grantee: tk, scope: ['learning'], from: HEUTE, until: '2026-11-30' });
  const v = P1.v();
  await geraetAbgleichen({ ablage: P1.a, zugang: P1.z(), personen: kontoPersonen(P1.konto), kinder: v.kinder, familien: v.familien, verzeichnis: { ...v.verzeichnis, [tk]: { role: 'teacher', pub: T.konto.pub } }, now: weiter(W), heute: HEUTE });
  const anker = v.kinder.find((c) => c.id === kk).anker;
  const tSync = () => geraetAbgleichen({ ablage: T.a, zugang: T.z(), personen: kontoPersonen(T.konto), kinder: [{ id: kk, pre: 'bq2_' + kk + '__', anker, freigaben: ['g1'] }], now: weiter(W), heute: HEUTE });
  let rt = await tSync();
  assert.equal(T.antworten(kk).length, 3, 'Lehrkraft liest');
  assert.deepEqual(rt.verworfen, []);

  // Peter erneuert: die Lehrkraft bleibt Halterin der neuen Version
  P1.konto = await schluesselErneuern({ zugang: P1.z(), anmeldename: 'peter', passwort: PW.peter, neuesPasswort: PW.neu, runden: R });
  P1.fertig(await P1.sync());
  assert.ok((await W.geraet('d_X').keys(L))[tk].versionen[String(await version(W, L))], 'die Lehrkraft hat die neue Version');
  K.ueben(2); await K.sync(); await P1.sync();
  rt = await tSync();
  assert.deepEqual(rt.verworfen, []);
  assert.equal(T.antworten(kk).length, 5, 'liest nach dem Wechsel weiter');

  // die Lehrkraft erneuert ihren eigenen Schluessel: Ankuendigung in den Bereichen, die Eltern verpacken neu
  const tn = await schluesselErneuern({ zugang: T.z(), anmeldename: 'lehrer', passwort: PW.lehrer, neuesPasswort: PW.neu2, runden: R });
  T.konto = tn;
  rt = await tSync();
  assert.ok(rt.bereiche[L].erneuert, 'Ankuendigung im Lern-Bereich');
  assert.deepEqual(rt.verworfen, []);
  await P1.sync();
  assert.equal((await W.geraet('d_X').keys(L))[tk].fuer, await schluesselFuer(tn.pub), 'Peters Geraet hat fuer ihre neuen Schluessel verpackt');
  rt = await tSync();
  assert.deepEqual(rt.erneuerungOffen, []);
  delete T.konto.alt;
  K.ueben(1); await K.sync(); await P1.sync();
  rt = await tSync();
  assert.deepEqual(rt.verworfen, []);
  assert.equal(T.antworten(kk).length, 6, 'liest mit dem neuen Schluessel weiter');
  // ihr eigener Bereich (Einstellungen) bleibt lesbar - auf einem neuen Geraet mit dem neuen Passwort
  const T2 = geraet(W, 'd_T2', await anmelden({ zugang: W.geraet('d_T2'), anmeldename: 'lehrer', passwort: PW.neu2, runden: R }));
  const r2 = await geraetAbgleichen({ ablage: T2.a, zugang: T2.z(), personen: kontoPersonen(T2.konto), kinder: [{ id: kk, pre: 'bq2_' + kk + '__', anker, freigaben: ['g1'] }], now: weiter(W), heute: HEUTE });
  assert.deepEqual(r2.verworfen, []);
  assert.equal(T2.antworten(kk).length, 6);
  assert.ok(r2.bereiche['person:' + tk].ok);
});

/* ---------- 5: Kind - Passwort neu: auch die Bereichsschluessel wechseln ---------- */
jedeWelt('Kind: Passwort neu -> neue Version in den Bereichen des Kindes; das alte Geraet (alter Schluessel) liest nichts Neues, auch nicht mit seinem alten Schluesseleintrag', async (W) => {
  const { P1, P2, K } = await familie(W);
  const kk = K.konto.kennung, L = lern(K);
  const kopie = await kopieren(W, 'kathie', L), vorher = await version(W, L);
  const qr = await kindPasswortNeu({ zugang: P1.z(), ablage: P1.a, konto: P1.konto, kind: kk, now: weiter(W) });
  const K2 = await einloesen(W, 'd_K2', qr, PW.neu);
  await K2.sync(); await P1.sync(); await K2.sync(); await P2.sync();
  assert.ok((await version(W, L)) > vorher, 'neue Version im Lern-Bereich');
  assert.equal(K2.antworten(kk).length, 3, 'nichts verloren');
  K2.ueben(2); await K2.sync(); await P1.sync();
  await K.sync();
  assert.equal(K.antworten(kk).length, 3, 'altes Geraet: nichts Neues');
  const dieb = await mitKopieOeffnen(kopie, kk, PW.kathie, L);
  assert.equal((await mitSchluesselnLesen(W, L, dieb.versionen)).length, 3, 'alte Kopie + altes Passwort: nur das Alte');
  assert.equal(P1.antworten(kk).length, 5);
});

/* ---------- Anker erneuert, dann "Passwort des Kindes neu"; Wiederherstellen erneuert auch die Bereiche ---------- */
jedeWelt('Nach dem Erneuern: Peter (Anker) und Anna (Buergschaft) setzen weiter Kinderpasswoerter neu; Wiederherstellen mit Code wechselt ebenfalls alle Bereiche', async (W) => {
  const { P1, P2, K } = await familie(W);
  const kk = K.konto.kennung;
  // Peter (Anker von Kathie) erneuert - seine Ankuendigung reist als Kette mit dem Startcode
  P1.konto = await schluesselErneuern({ zugang: P1.z(), anmeldename: 'peter', passwort: PW.peter, neuesPasswort: PW.neu, runden: R });
  P1.fertig(await P1.sync());
  await P2.sync(); await P1.sync(); await P2.sync();
  const qr = await kindPasswortNeu({ zugang: P1.z(), ablage: P1.a, konto: P1.konto, kind: kk, now: weiter(W) });
  assert.equal(qr.fingerabdruck, await keyFingerprint(P1.konto.pub));
  const K2 = await einloesen(W, 'd_K2', qr, PW.neu);
  await K2.sync(); await P1.sync(); await K2.sync();
  assert.equal(K2.antworten(kk).length, 3);
  // Anna erneuert ueber den Wiederherstellungscode (immer neue Schluessel); Peter vermerkt sie neu (ihre Buergschaft)
  const wa = await wiederherstellen({ zugang: P2.z(), anmeldename: 'anna', code: P2.konto.wiederherstellungscode, neuesPasswort: PW.neu2, runden: R });
  assert.notDeepEqual(wa.pub, P2.konto.pub);
  P2.konto = { ...wa, familie: undefined, anker: undefined };
  delete P2.konto.familie; delete P2.konto.anker;
  P2.fertig(await P2.sync());
  const rp = await P1.sync();
  assert.deepEqual(rp.erneuert.map((x) => [x.person, x.fingerabdruck]), [[P2.konto.kennung, wa.fingerabdruck]]);
  await P2.sync();
  const qr2 = await kindPasswortNeu({ zugang: P2.z(), ablage: P2.a, konto: P2.konto, kind: kk, now: weiter(W) });
  const K3 = await einloesen(W, 'd_K3', qr2, PW.neu3);
  await K3.sync(); await P2.sync(); await K3.sync(); await P1.sync();
  assert.equal(K3.antworten(kk).length, 3, 'auch nach Annas Erneuerung nichts verloren');
  for (const a of ['kind:lern:' + kk, 'familie:' + P1.konto.kennung]) assert.equal((await W.geraet('d_X').keys(a))[P2.konto.kennung].fuer, await schluesselFuer(wa.pub), 'Anna: neue Schluessel in ' + a);
});
