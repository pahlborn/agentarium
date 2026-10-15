#!/usr/bin/env python3
"""Referenz-Reducer: rechnet den Zustand am Cursor AUS den Ereignissen.

PRUEFMITTEL, keine Produktimplementierung: rein, ohne Zustand ausserhalb der
Rueckgabe, ohne Netz, ohne Ein- und Ausgabe. Keine Betriebs- oder
Architekturentscheidung leitet sich daraus ab.

Fassung 2 nach dem V2.1-Team-Review (R1, R2, R3, R5). Die Luecke, die
Sentinels Probe original_noop_with_required_shell gefunden hat:
Fassung 1 schrieb den Status bei JEDEM Ereignis mit item_revision und to,
waehrend done_nachweise nur kind=status_change pruefte. Ein formal
vollstaendiges Ereignis unbekannter Art kam dadurch an der Done-Pruefung
vorbei und erzeugte Done ohne Nachweis.

REDUKTIONSREGELN, vollstaendig:

R1  Reihenfolge ist die belegte Ereignisfolge der Eingabe. Ankunftszeit und
    recorded_at ordnen NICHT.
R2  **Nur kind=status_change schreibt den Aufgabenzustand.** Keine andere
    Art, auch keine unbekannte, auch nicht mit vollstaendiger formaler
    Huelle. Traegt ein Ereignis fremder Art Zustandsfelder
    (item_revision, from, to, previous_transition_id), ist das ein
    Verstoss und das Ereignis bleibt ohne Wirkung.
R3  Jedes Ereignis geht durch EINE vorgelagerte Pruefung (pruefe_ereignis).
    Ein ungueltiges Ereignis veraendert den Zustand nicht -- normale
    Statuswechsel und Done nehmen denselben Weg.
R4  item_revision muss je Aufgabe streng steigen. previous_transition_id
    muss auf die vorige schreibende Transition derselben Aufgabe zeigen;
    beim ersten Mal null.
R5  kind=artifact legt (artifact_id, version) an. supersedes wird vermerkt,
    die Vorgaengerversion bleibt stehen.
R6  kind=review_result|test_result haengt eine Pruefung an GENAU
    (task_id, artifact_id, version, criteria_ref). Ein Pass einer anderen
    Aufgabe oder Kriterienfassung zaehlt nicht.
R7  kind=block eroeffnet eine Blockade, kind=unblock schliesst sie ueber
    block_id und setzt resolving_event_id.
R8  Verantwortung folgt NUR aus ownership_change. Die effektive Zielaufgabe
    ist ownership_change.task_id oder, falls dort nicht genannt, task_id des
    Ereignisses. Widersprechen sich beide, ist das ein Verstoss. Aus
    recipient oder parent_task_id allein folgt niemals Verantwortung.
    scope und basis bleiben erhalten, sind aber NICHT Pflicht.
R9  abdeckung = complete, wenn jedes Ereignis occurred_at hat; unavailable,
    wenn keines; sonst partial.
R10 Der Zustand kann auf einem initial_state mit echtem Stromcursor
    FORTGESCHRIEBEN werden. Der Cursor ist die stream_sequence des letzten
    verarbeiteten Ereignisses, nicht die Anzahl der Eingaben.
"""
import sys

DONE_STATUS = {'done', 'abgenommen', 'fachlich_fertig', 'angenommen'}
ZUSTANDSFELDER = ('item_revision', 'from', 'to', 'previous_transition_id')
PRUEFARTEN = ('review_result', 'test_result')


def leerer_zustand(cursor=0):
    return {'cursor': cursor, 'aufgaben': [], 'artefakte': [], 'blockaden': [],
            'abdeckung': 'unavailable'}


def nachweisschluessel(e):
    """R6/R2 des Reviews: der Nachweis haengt an der VOLLEN Referenz."""
    return (e.get('task_id'), e.get('artifact_id'), e.get('version'), e.get('criteria_ref'))


def pruefe_ereignis(e):
    """Vorgelagerte Pruefung. Gibt Beanstandungen zurueck; eine nichtleere
    Liste heisst: dieses Ereignis veraendert den Zustand nicht."""
    b = []
    eid = e.get('id') or '<ohne id>'
    if not e.get('kind'):
        b.append('%s: ohne kind' % eid)
    if not (e.get('title') or '').strip():
        b.append('%s: fachlicher Titel leer' % eid)
    art = e.get('kind')

    if art == 'status_change':
        for f in ('task_id', 'to'):
            if not e.get(f):
                b.append('%s: status_change ohne %s' % (eid, f))
        # from fehlt nur beim ERSTEN Uebergang, und der hat keinen Vorgaenger.
        if 'from' not in e:
            b.append('%s: status_change ohne from' % eid)
        elif not e.get('from') and e.get('previous_transition_id') is not None:
            b.append('%s: status_change mit from null, aber Vorgaenger %r'
                     % (eid, e['previous_transition_id']))
        if not isinstance(e.get('item_revision'), int) or e.get('item_revision') is True:
            b.append('%s: status_change ohne item_revision' % eid)
        if 'previous_transition_id' not in e:
            b.append('%s: status_change ohne previous_transition_id' % eid)
    else:
        # R1 des Reviews: Zustandsfelder bei fremden Arten nicht durchlassen.
        getragen = [f for f in ZUSTANDSFELDER if e.get(f) is not None]
        if getragen:
            b.append('%s: Art %r traegt Zustandsfelder %s - nur status_change '
                     'schreibt Status' % (eid, art, ', '.join(getragen)))

    if art in PRUEFARTEN:
        for f in ('task_id', 'artifact_id', 'version', 'criteria_ref', 'outcome'):
            if not e.get(f):
                b.append('%s: %s ohne %s' % (eid, art, f))

    oc = e.get('ownership_change')
    if oc:
        # R5 des Reviews: effektive Zielaufgabe eindeutig, scope/basis optional.
        innen, aussen = oc.get('task_id'), e.get('task_id')
        if innen and aussen and innen != aussen:
            b.append('%s: ownership_change.task_id %r widerspricht task_id %r'
                     % (eid, innen, aussen))
        if not (innen or aussen):
            b.append('%s: Verantwortungstransition ohne effektive Zielaufgabe' % eid)
        if not oc.get('to'):
            b.append('%s: ownership_change ohne to' % eid)
    return b


def effektive_aufgabe(e):
    oc = e.get('ownership_change') or {}
    return oc.get('task_id') or e.get('task_id')


def reduziere(ereignisse, bis=None, initial_state=None, cursor=None):
    """Zustand nach den ersten `bis` Ereignissen.

    initial_state: Zustand, auf dem fortgeschrieben wird (R10).
    cursor:        Stromcursor des initial_state. Ohne Angabe wird der
                   Cursor aus stream_sequence der Ereignisse genommen und
                   nur hilfsweise aus deren Anzahl.
    """
    folge = ereignisse if bis is None else ereignisse[:bis]
    verstoesse = []

    aufgaben, artefakte, blockaden = {}, {}, {}
    if initial_state:
        for a in initial_state.get('aufgaben', []):
            aufgaben[a['task_id']] = dict(a)
        for a in initial_state.get('artefakte', []):
            artefakte[(a['artifact_id'], a['version'])] = {
                'artifact_id': a['artifact_id'], 'version': a['version'],
                'supersedes': a.get('supersedes'),
                'pruefungen': [dict(p) for p in a.get('pruefungen', [])]}
        for b_ in initial_state.get('blockaden', []):
            blockaden[b_['block_id']] = dict(b_)
    stand = cursor if cursor is not None else (
        initial_state.get('cursor') if initial_state else 0)

    gesehen = set()
    for e in folge:
        eid = e.get('id')
        seq = e.get('stream_sequence')

        # R10/R3 des Reviews: Doppeltes und Luecken fallen auf, bevor sie wirken.
        if seq is not None:
            if seq in gesehen or seq <= stand:
                verstoesse.append('%s: stream_sequence %s doppelt oder veraltet '
                                  '(Cursor %s)' % (eid, seq, stand))
                continue
            if seq != stand + 1:
                verstoesse.append('%s: Luecke - stream_sequence %s nach Cursor %s'
                                  % (eid, seq, stand))
            gesehen.add(seq)
            stand = seq
        else:
            stand += 1

        b = pruefe_ereignis(e)
        if b:
            verstoesse.extend(b)
            continue                      # ungueltig: keine Zustandswirkung

        art = e.get('kind')

        if art == 'status_change':        # R2: nur hier
            t = e['task_id']
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

        if art == 'artifact':             # R5
            k = (e.get('artifact_id'), e.get('version'))
            artefakte.setdefault(k, {'artifact_id': k[0], 'version': k[1],
                                     'supersedes': e.get('supersedes'),
                                     'pruefungen': []})

        if art in PRUEFARTEN:             # R6
            k = (e.get('artifact_id'), e.get('version'))
            a = artefakte.setdefault(k, {'artifact_id': k[0], 'version': k[1],
                                         'supersedes': None, 'pruefungen': []})
            a['pruefungen'].append({'kind': art, 'task_id': e.get('task_id'),
                                    'criteria_ref': e.get('criteria_ref'),
                                    'outcome': e.get('outcome'), 'event_id': eid})

        if art == 'block':                # R7
            blockaden[e.get('block_id')] = {'block_id': e.get('block_id'),
                                            'task_id': e.get('task_id'),
                                            'grund': e.get('title'),
                                            'seit': e.get('occurred_at'),
                                            'resolving_event_id': None}
        if art == 'unblock':
            bl = blockaden.get(e.get('block_id'))
            if bl is None:
                verstoesse.append('%s: unblock ohne offene Blockade %s'
                                  % (eid, e.get('block_id')))
            else:
                bl['resolving_event_id'] = e.get('resolving_event_id') or eid

        oc = e.get('ownership_change')    # R8
        if oc:
            t = effektive_aufgabe(e)
            if t in aufgaben:
                aufgaben[t]['owner'] = oc.get('to')
            else:
                verstoesse.append('%s: Verantwortung fuer unbekannte Aufgabe %r'
                                  % (eid, t))

    zeiten = [e.get('occurred_at') for e in folge]
    hat = [z for z in zeiten if z]
    if initial_state and not folge:
        abdeckung = initial_state.get('abdeckung', 'unavailable')
    else:
        abdeckung = ('complete' if hat and len(hat) == len(zeiten)
                     else ('unavailable' if not hat else 'partial'))

    return {'cursor': stand,
            'aufgaben': sorted(aufgaben.values(), key=lambda a: a['task_id']),
            'artefakte': sorted(artefakte.values(),
                                key=lambda a: (a['artifact_id'] or '', a['version'] or '')),
            'blockaden': sorted(blockaden.values(), key=lambda b: b['block_id'] or ''),
            'abdeckung': abdeckung}, verstoesse


def done_nachweise(ereignisse):
    """Done braucht einen Nachweis an der VOLLEN Referenz.

    R1 des Reviews: geprueft wird jeder Statuswechsel auf Done -- und weil
    nur kind=status_change ueberhaupt Status schreibt, kann keine fremde Art
    daran vorbei.
    R2 des Reviews: der Schluessel ist
    (task_id, artifact_id, version, criteria_ref). Ein Pass einer anderen
    Aufgabe oder Kriterienfassung erlaubt Done nicht. Ein spaeteres Fail auf
    dieselbe Referenz sperrt Done, bis ein neuer gueltiger Nachweis vorliegt.
    """
    beanstandet, ergebnisse = [], {}
    for e in ereignisse:
        if pruefe_ereignis(e):
            continue                      # ungueltig: zaehlt nicht als Nachweis
        if e.get('kind') in PRUEFARTEN:
            ergebnisse[nachweisschluessel(e)] = (e.get('outcome'), e.get('id'))
        if e.get('kind') != 'status_change':
            continue
        if (e.get('to') or '').lower() not in DONE_STATUS:
            continue
        if e.get('abweichung_autorisiert_durch') and e.get('abweichung_grund'):
            continue                      # eigener belegter Weg
        k = nachweisschluessel(e)
        if not all(k):
            beanstandet.append('%s: Done ohne vollstaendige Nachweisreferenz '
                               '(task_id, artifact_id, version, criteria_ref): %r'
                               % (e.get('id'), k))
            continue
        erg = ergebnisse.get(k)
        if erg is None:
            beanstandet.append('%s: Done fuer %s ohne Nachweis unter genau dieser '
                               'Referenz' % (e.get('id'), k))
        elif erg[0] != 'pass':
            beanstandet.append('%s: Done fuer %s, letztes Ergebnis %r (%s) statt pass'
                               % (e.get('id'), k, erg[0], erg[1]))
        elif e.get('nachweis_ref') and e['nachweis_ref'] != erg[1]:
            beanstandet.append('%s: nennt Nachweis %r, maßgeblich ist aber %r'
                               % (e.get('id'), e['nachweis_ref'], erg[1]))
    return beanstandet


def zeitfenster(ereignisse):
    f = {}
    for e in ereignisse:
        t, z = e.get('task_id'), e.get('occurred_at')
        if t and z:
            a, b = f.get(t, (z, z))
            f[t] = (min(a, z), max(b, z))
    return f


def ueberlappend(ereignisse):
    f = zeitfenster(ereignisse)
    ks = sorted(f)
    return [(ks[i], ks[j]) for i in range(len(ks)) for j in range(i + 1, len(ks))
            if f[ks[i]][0] <= f[ks[j]][1] and f[ks[j]][0] <= f[ks[i]][1]]


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
