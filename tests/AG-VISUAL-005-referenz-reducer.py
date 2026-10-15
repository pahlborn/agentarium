#!/usr/bin/env python3
"""Referenz-Reducer: rechnet den Zustand am Cursor AUS den Ereignissen.

BEFUND B3 des Team-Reviews: R16b verglich zwei Zustaende, die beide im
Fixture eingetragen waren -- "Beide koennen identisch falsch sein". Dieser
Reducer berechnet den Zustand stattdessen, sodass ein falsch behaupteter
Zustand auffaellt.

Er ist PRUEFMITTEL, keine Produktimplementierung: rein, ohne Zustand
ausserhalb der Rueckgabe, ohne Ein- und Ausgabe, ohne Netz. Die Regeln
unten sind dieselben, die im Korrekturpapier V2.1 §B3 in Worten stehen.

REDUKTIONSREGELN, vollstaendig:

R1  Reihenfolge ist die belegte Ereignisfolge der Eingabe. Ankunftszeit und
    recorded_at ordnen NICHT.
R2  Ein Ereignis mit item_revision UND to schreibt den Aufgabenzustand:
    status = to, item_revision, letzte_transition_id = Ereignis-ID.
    Aufgaben entstehen nur so -- nie implizit aus einem Empfaenger.
R3  item_revision muss je Aufgabe streng steigen. previous_transition_id
    muss auf die vorige schreibende Transition derselben Aufgabe zeigen;
    beim ersten Mal null.
R4  kind=artifact legt (artifact_id, version) an. supersedes wird vermerkt,
    die Vorgaengerversion bleibt im Zustand stehen.
R5  kind=review_result|test_result haengt eine Pruefung an GENAU
    (artifact_id, version). Ein Pass auf v1 erreicht v2 nie.
R6  kind=block eroeffnet eine Blockade, kind=unblock schliesst sie ueber
    block_id und setzt resolving_event_id.
R7  ownership_change setzt owner der genannten Aufgabe; ohne task_id im
    ownership_change gilt task_id des Ereignisses. Aus Empfaenger oder
    Parent allein folgt KEINE Verantwortung.
R8  abdeckung = complete, wenn jedes Ereignis occurred_at hat; none, wenn
    keines; sonst partial.
"""
import sys

DONE_STATUS = {'done', 'abgenommen', 'fachlich_fertig', 'angenommen'}


def reduziere(ereignisse, bis=None):
    """Zustand nach den ersten `bis` Ereignissen (None = alle)."""
    folge = ereignisse if bis is None else ereignisse[:bis]
    aufgaben, artefakte, blockaden, verstoesse = {}, {}, {}, []

    for e in folge:
        eid = e.get('id')
        # R2/R3 Aufgabenzustand und Revisionskette
        if e.get('item_revision') is not None and e.get('to'):
            t = e.get('task_id')
            if not t:
                verstoesse.append('%s: schreibt Status ohne task_id' % eid)
            else:
                a = aufgaben.get(t)
                if a is None:
                    if e.get('previous_transition_id') is not None:
                        verstoesse.append('%s: erste Transition von %s zeigt auf %s'
                                          % (eid, t, e['previous_transition_id']))
                    aufgaben[t] = {'task_id': t,
                                   'parent_task_id': e.get('parent_task_id'),
                                   'work_item_type': e.get('work_item_type'),
                                   'status': e['to'], 'item_revision': e['item_revision'],
                                   'letzte_transition_id': eid, 'owner': None}
                else:
                    if e['item_revision'] <= a['item_revision']:
                        verstoesse.append('%s: Revision %s von %s nicht steigend (war %s)'
                                          % (eid, e['item_revision'], t, a['item_revision']))
                    if e.get('previous_transition_id') != a['letzte_transition_id']:
                        verstoesse.append('%s: previous_transition_id %r von %s, erwartet %r'
                                          % (eid, e.get('previous_transition_id'), t,
                                             a['letzte_transition_id']))
                    a.update(status=e['to'], item_revision=e['item_revision'],
                             letzte_transition_id=eid)

        # R4 Artefakte
        if e.get('kind') == 'artifact':
            k = (e.get('artifact_id'), e.get('version'))
            artefakte.setdefault(k, {'artifact_id': k[0], 'version': k[1],
                                     'supersedes': e.get('supersedes'), 'pruefungen': []})

        # R5 Pruefungen genau an (artifact_id, version)
        if e.get('kind') in ('review_result', 'test_result'):
            k = (e.get('artifact_id'), e.get('version'))
            a = artefakte.setdefault(k, {'artifact_id': k[0], 'version': k[1],
                                         'supersedes': None, 'pruefungen': []})
            a['pruefungen'].append({'kind': e['kind'], 'criteria_ref': e.get('criteria_ref'),
                                    'outcome': e.get('outcome'), 'event_id': eid})

        # R6 Blockaden
        if e.get('kind') == 'block':
            blockaden[e.get('block_id')] = {'block_id': e.get('block_id'),
                                            'task_id': e.get('task_id'),
                                            'grund': e.get('title'),
                                            'seit': e.get('occurred_at'),
                                            'resolving_event_id': None}
        if e.get('kind') == 'unblock':
            b = blockaden.get(e.get('block_id'))
            if b is None:
                verstoesse.append('%s: unblock ohne offene Blockade %s' % (eid, e.get('block_id')))
            else:
                b['resolving_event_id'] = e.get('resolving_event_id') or eid

        # R7 Verantwortung nur aus ownership_change
        oc = e.get('ownership_change')
        if oc:
            t = oc.get('task_id') or e.get('task_id')
            if t in aufgaben:
                aufgaben[t]['owner'] = oc.get('to')

    # R8 Abdeckung
    zeiten = [e.get('occurred_at') for e in folge]
    hat = [z for z in zeiten if z]
    abdeckung = 'complete' if hat and len(hat) == len(zeiten) else ('unavailable' if not hat else 'partial')

    return {'cursor': len(folge),
            'aufgaben': sorted(aufgaben.values(), key=lambda a: a['task_id']),
            'artefakte': sorted(artefakte.values(), key=lambda a: (a['artifact_id'] or '', a['version'] or '')),
            'blockaden': sorted(blockaden.values(), key=lambda b: b['block_id'] or ''),
            'abdeckung': abdeckung}, verstoesse


def done_nachweise(ereignisse):
    """BEFUND B2: Done braucht einen versionsgebundenen Erfuellungsnachweis.

    Zulaessig ist ein Statuswechsel auf Done nur, wenn
      (a) er artifact_id UND version nennt, und auf genau dieses Paar ein
          FRUEHERES review_result/test_result mit outcome=pass vorliegt, und
          danach vor dem Wechsel kein nicht-pass auf dasselbe Paar steht,
      oder
      (b) abweichung_autorisiert_durch und abweichung_grund gesetzt sind.
    """
    beanstandet = []
    ergebnisse = {}       # (artifact_id, version) -> letztes outcome
    for e in ereignisse:
        if e.get('kind') in ('review_result', 'test_result'):
            ergebnisse[(e.get('artifact_id'), e.get('version'))] = e.get('outcome')
        ist_done = (e.get('to') or '').lower() in DONE_STATUS
        if e.get('kind') == 'status_change' and ist_done:
            if e.get('abweichung_autorisiert_durch') and e.get('abweichung_grund'):
                continue
            k = (e.get('artifact_id'), e.get('version'))
            if not k[0] or not k[1]:
                beanstandet.append('%s: Done ohne genannte Artefaktversion' % e.get('id'))
            elif ergebnisse.get(k) != 'pass':
                beanstandet.append('%s: Done fuer %s@%s, letztes Ergebnis %r statt pass'
                                   % (e.get('id'), k[0], k[1], ergebnisse.get(k)))
    return beanstandet


def zeitfenster(ereignisse):
    """Belegte Zeitfenster je Aufgabe. KEINE aktive Arbeitsdauer -- nur die
    Spanne zwischen erstem und letztem belegten Zeitpunkt."""
    f = {}
    for e in ereignisse:
        t, z = e.get('task_id'), e.get('occurred_at')
        if t and z:
            a, b = f.get(t, (z, z))
            f[t] = (min(a, z), max(b, z))
    return f


def ueberlappend(ereignisse):
    """Paare von Aufgaben mit sich SCHNEIDENDEN belegten Zeitfenstern."""
    f = zeitfenster(ereignisse)
    ks = sorted(f)
    paare = []
    for i in range(len(ks)):
        for j in range(i + 1, len(ks)):
            a, b = f[ks[i]], f[ks[j]]
            if a[0] <= b[1] and b[0] <= a[1]:
                paare.append((ks[i], ks[j]))
    return paare


if __name__ == '__main__':
    import json
    for p in sys.argv[1:]:
        d = json.load(open(p, encoding='utf-8'))
        ev = d if isinstance(d, list) else d.get('ereignisse', [])
        z, v = reduziere(ev)
        print(p)
        print(json.dumps(z, indent=2, ensure_ascii=False))
        print('Verstoesse:', v or 'keine')
        print('Done-Beanstandungen:', done_nachweise(ev) or 'keine')
        print('Ueberlappende Zeitfenster:', ueberlappend(ev) or 'keine')
