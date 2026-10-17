#!/usr/bin/env python3
"""Prueft den Schnittstellenvertrag V2.1 gegen seine Beispieldaten.

Gezielte Korrektur der fuenf Defektgruppen B1-B5 aus
governance/AG-VISUAL-005-INTERFACE-v2-team-review-v1.md.

Drei Durchgaenge:
  1. FORM     -- gegen specifications/.../vertrag-v2-1.schema.json, EINE Datei,
                 damit die Kostendefinition nicht zweimal existiert (B5).
  2. REGELN   -- benannte Invarianten, darunter die neuen R-24..R-33.
  3. NEGATIV  -- die unabhaengigen Proben aus Sentinels Ausfuehrungsnachweis.
                 Jede MUSS abgelehnt oder erkannt werden. Fuenf davon hat V2
                 akzeptiert, zwei Regeln erkannten ihren eigenen Fall nicht.

Der Schemapruefer wird aus dem V2-Pruefer importiert; jene Datei bleibt als
Nachweis unveraendert. Er deckt nur die verwendeten Schluesselwoerter ab und
ist KEIN vollstaendiger JSON-Schema-Pruefer -- jsonschema liegt nicht im
Container, und die Projektregel verbietet das Nachladen zur Laufzeit.

NICHT geprueft, ausdruecklich: kein Server, kein SSE, kein Browser, keine
serverseitige Rechtedurchsetzung, keine Laufzeit-Nebenwirkungsfreiheit.
"""
import datetime, importlib.util, json, os, sys

HIER = os.path.dirname(os.path.abspath(__file__))
WURZEL = os.path.dirname(HIER)
SCHEMA = os.path.join(WURZEL, 'specifications', 'AG-VISUAL-005-schemas-v2',
                      'vertrag-v2-1.schema.json')
BEISPIELE = os.path.join(WURZEL, 'fixtures', 'AG-VISUAL-005-beispiele-v2-1')


def _lade_modul(datei, name):
    s = importlib.util.spec_from_file_location(name, os.path.join(HIER, datei))
    m = importlib.util.module_from_spec(s)
    s.loader.exec_module(m)
    return m


V2 = _lade_modul('AG-VISUAL-005-vertrag-v2-pruefen.py', 'v2pruefer')
RED = _lade_modul('AG-VISUAL-005-referenz-reducer.py', 'reducer')

fehler = []
zahl = {'form': 0, 'regeln': 0, 'negativ': 0}
with open(SCHEMA, encoding='utf-8') as f:
    WURZELSCHEMA = json.load(f)


def lade(n):
    with open(os.path.join(BEISPIELE, n), encoding='utf-8') as f:
        return json.load(f)


def formfehler(daten, eintritt):
    """Beanstandungen gegen einen Einstiegspunkt des Vertragsschemas."""
    return V2.pruefe(daten, WURZELSCHEMA['$defs'][eintritt], WURZELSCHEMA, eintritt)


def form(daten, eintritt, was):
    b = formfehler(daten, eintritt)
    zahl['form'] += 1
    for z in b:
        fehler.append('FORM   %-44s %s' % (was, z))
    return not b


def regel(nr, bedingung, was):
    zahl['regeln'] += 1
    if not bedingung:
        fehler.append('REGEL  %-6s %s' % (nr, was))
    return bedingung


def sek(a, b):
    f = lambda s: datetime.datetime.fromisoformat(s.replace('Z', '+00:00'))
    return (f(b) - f(a)).total_seconds()


# ----------------------------------------------------------------- B1
def fall01():
    d = lade('01-einstieg-snapshot-live.json')['daten']
    s = d['schnappschuss']
    form(s, 'schnappschuss', '01 Schnappschuss')
    for e in d['danach']:
        form(e, 'umschlag', '01 Umschlag %s' % e.get('stream_sequence'))
    folgen = [e['stream_sequence'] for e in d['danach']]
    regel('R-05', folgen[0] == s['cursor'] + 1, 'erste Folge nicht cursor+1')
    regel('R-02', folgen == list(range(folgen[0], folgen[0] + len(folgen))), 'Folgen lueckenhaft')
    regel('R-25', 'hoechste_sequenz' in s, 'hoechste_sequenz fehlt (B1)')
    L = s['lauf']
    regel('R-17', (L['ansicht'] == 'archiv') == L['terminal'], 'ansicht folgt nicht terminal')
    zc = L['zustand_am_cursor']
    regel('R-24', all(k in zc for k in ('cursor', 'aufgaben', 'artefakte', 'blockaden', 'abdeckung')),
          'zustand_am_cursor nicht vollstaendig (B3)')
    regel('R-24', all('item_revision' in a and 'letzte_transition_id' in a for a in zc['aufgaben']),
          'Aufgabenzustand ohne Revision oder Transition (B3)')
    regel('R-24', all('pruefungen' in a and 'version' in a for a in zc['artefakte']),
          'Artefaktzustand ohne Version oder Pruefungen (B3)')
    regel('R-39', zc['cursor'] == s['cursor'],
          'innerer Cursor %r weicht vom aeusseren %r ab (R3)' % (zc['cursor'], s['cursor']))


def fall02():
    d = lade('02-heartbeat-veraltet.json')['daten']
    for h in d['lebenszeichen']:
        form(h, 'umschlag', '02 Lebenszeichen')
        regel('R-03', 'stream_sequence' not in h, 'Lebenszeichen mit Sequenz')
    letzt = d['lebenszeichen'][-1]['sent_at']
    grenze = d['veraltet_nach_sekunden']
    for p in d['pruefzeitpunkte']:
        abstand = sek(letzt, p['zeit'])
        veraltet = abstand > grenze          # NACH 20 s, nicht ab 20 s
        regel('R-04', veraltet == (p['soll'] == 'veraltet'),
              'bei %.3f s soll %s sein' % (abstand, p['soll']))
    ab = [sek(d['lebenszeichen'][i]['sent_at'], d['lebenszeichen'][i + 1]['sent_at'])
          for i in range(len(d['lebenszeichen']) - 1)]
    regel('R-04c', ab == d['takt_pruefung']['abstaende_s']
          and all(x == d['takt_pruefung']['soll_takt_s'] for x in ab),
          'tatsaechlicher Takt %r statt %s s' % (ab, d['takt_pruefung']['soll_takt_s']))


def fortsetzbar(cursor, grenze, hoechste):
    """DIE korrigierte Grenzsemantik, Befund B1.
    replay_grenze ist die NIEDRIGSTE lieferbare Sequenz; fortgesetzt wird bei
    cursor+1. V2 pruefte cursor >= grenze und verwarf damit den Rand."""
    if cursor > hoechste:
        return False, 'cursor_zu_hoch'
    if cursor + 1 >= grenze:
        return True, 'fortsetzbar'
    return False, 'replay_grenze_unterschritten'


def fall03():
    d = lade('03-resume-grenzfaelle.json')['daten']
    form(d['betrieb'], 'betrieb', '03 Betriebsrahmen')
    regel('R-27', d['betrieb']['rahmen'] in ('cookie_gleicher_ursprung', 'header_fetch_streaming'),
          'Betriebsrahmen nicht vor der Verbindung festgelegt (B1)')
    regel('R-35', d['betrieb'].get('supported_actions') == [],
          'Betriebsdokument ohne maschinenlesbares supported_actions = [] (R4)')
    for f in d['faelle']:
        a = f['antwort']
        form(a, 'resume_antwort', '03 %s' % f['name'])
        if f.get('roh_last_event_id') is not None:
            regel('R-06e', a['grund'] == 'cursor_unbekannt' and not a['fortsetzbar'],
                  'ungueltige Last-Event-ID nicht als cursor_unbekannt behandelt')
            continue
        soll, grund = fortsetzbar(a['cursor'], a['replay_grenze'], a['hoechste_sequenz'])
        nr = 'R-06c' if f['name'] == 'grenzfall_fortsetzbar' else (
             'R-06d' if f['name'] == 'cursor_zu_hoch' else 'R-06')
        regel(nr, a['fortsetzbar'] == soll and a['grund'] == grund,
              '%s: cursor %d, Grenze %d, hoechste %d -> soll %s/%s, ist %s/%s'
              % (f['name'], a['cursor'], a['replay_grenze'], a['hoechste_sequenz'],
                 soll, grund, a['fortsetzbar'], a['grund']))
        if a['fortsetzbar'] and 'erste_folge' in f:
            regel('R-06', f['erste_folge'] == a['cursor'] + 1,
                  '%s: erste Folge nicht cursor+1' % f['name'])
    es = d['eventsource_pfad']
    form(es['hinweis'], 'umschlag', '03 strom.hinweis')
    regel('R-26', es['http_status'] == 200 and es['hinweis']['kind'] == 'strom.hinweis'
          and es['hinweis'].get('neuer_schnappschuss'),
          'EventSource-Pfad ohne auswertbaren Hinweis bei 200 (B1)')
    regel('R-26', d['fetch_pfad']['http_status'] == 409 and 'grund' in d['fetch_pfad']['koerper'],
          'fetch-Pfad ohne lesbaren 409-Koerper')


def fall04():
    d = lade('04-zwei-projekte-laeufe.json')['daten']
    for e in d['katalogstrom']['ereignisse']:
        form(e, 'umschlag', '04 Katalog %s' % e['stream_sequence'])
    # Vier Ereignisse, keines davon war catalog.changed: project.created,
    # run.started, run.finished, run.started. Die erste Fassung dieser Zeile
    # erwartete 1..3, weil beim Entfernen von catalog.changed voreilig ein
    # Ereignis mitgezaehlt wurde, das es hier nie gab.
    folgen = [e['stream_sequence'] for e in d['katalogstrom']['ereignisse']]
    regel('R-02', folgen == list(range(1, len(folgen) + 1)),
          'Katalogfolge nicht lueckenlos ab 1: %r' % folgen)
    regel('R-34', all(e['kind'] != 'catalog.changed' for e in d['katalogstrom']['ereignisse']),
          'catalog.changed ist entfernt und darf nicht mehr vorkommen (B4/O6)')
    anf = []
    for n in ('arbeitsstrom_AG_NEU_R1', 'arbeitsstrom_AG_ALT_R2'):
        z = d[n]['zustellungen']
        anf.append(z[0]['umschlag']['stream_sequence'])
        for s in z:
            form(s['umschlag'], 'umschlag', '04 %s' % n)
    regel('R-02', anf == [1, 1], 'Sequenzraeume nicht getrennt: %r' % anf)
    cursor, verworfen = 0, []
    for s in d['arbeitsstrom_AG_NEU_R1']['zustellungen']:
        q = s['umschlag']['stream_sequence']
        if q == cursor + 1:
            cursor = q
        else:
            verworfen.append(s['folge'])
    regel('R-07', verworfen == [3, 4] and cursor == 2,
          'Duplikat/Nachzuegler falsch behandelt: %r, Cursor %d' % (verworfen, cursor))
    for L in d['laeufe_im_katalog']:
        t = L['zustand'] in ('abgeschlossen', 'abgebrochen', 'fehlgeschlagen')
        regel('R-17', L['terminal'] == t and L['ansicht'] == ('archiv' if t else 'live'),
              '%s/%s: Ansicht folgt nicht dem Zustand' % (L['project_id'], L['run_id']))


# ----------------------------------------------------------------- B2
def fall05():
    d = lade('05-parallel-artefakte-review.json')['daten']
    ev = d['ereignisse']
    for e in ev:
        form(e, 'arbeitsereignis', '05 %s' % e['id'])
    for e in ev:
        if e['kind'] in ('review_result', 'test_result'):
            regel('R-12', all(e.get(f) for f in ('task_id', 'artifact_id', 'version',
                                                 'criteria_ref', 'outcome')),
                  '%s: Pruefung unvollstaendig' % e['id'])
    z, verst = RED.reduziere(ev)
    regel('R-28', not verst, 'Revisionskette: %s' % '; '.join(verst))
    regel('R-11b', not RED.done_nachweise(ev),
          'Done ohne versionsgebundenen Erfuellungsnachweis: %s'
          % '; '.join(RED.done_nachweise(ev)))
    soll = d['zustand_am_cursor_soll']
    regel('R-29', z == soll,
          'berechneter Zustand weicht vom behaupteten ab:\n     berechnet %s\n     behauptet %s'
          % (json.dumps(z, ensure_ascii=False, sort_keys=True),
             json.dumps(soll, ensure_ascii=False, sort_keys=True)))
    w8 = [x for x in ev if x['id'] == 'W8'][0]
    nw = [x for x in ev if x.get('kind') in ('review_result', 'test_result')
          and RED.nachweisschluessel(x) == RED.nachweisschluessel(w8)
          and x.get('outcome') == 'pass']
    regel('R-36', len(nw) == 1 and w8.get('nachweis_ref') == nw[0]['id'],
          'Done nennt nicht den Nachweis unter genau (task_id, artifact_id, version, '
          'criteria_ref): %r' % (RED.nachweisschluessel(w8),))
    regel('R-37', all(x['kind'] == 'status_change'
                      for x in ev if x.get('item_revision') is not None),
          'Zustandsfelder bei einer Art ausser status_change')
    paare = RED.ueberlappend(ev)
    regel('R-21', ('AG-NEU-031', 'AG-NEU-032') in paare,
          'kein Paar mit sich schneidenden Zeitfenstern gefunden (B3)')
    done = {e['task_id'] for e in ev if e['kind'] == 'status_change' and e.get('to') == 'done'}
    regel('R-11', done == set(d['abgeleitet']['done_aufgaben']),
          'Done %r statt %r' % (sorted(done), d['abgeleitet']['done_aufgaben']))


# ----------------------------------------------------------------- B5
def fall06():
    d = lade('06-kosten-sichtbar-ohne-betrag.json')['daten']
    for weg, k in (('Schnappschuss unvollstaendig', d['unvollstaendig']['kosten']),
                   ('Schnappschuss vollstaendig', d['vollstaendig']['kosten']),
                   ('Archiv unvollstaendig', d['archiv']['unvollstaendig']['kosten'])):
        form(k, 'kostenfeld', '06 %s' % weg)
        regel('R-08e', k.get('daten') in ('real', 'synthetisch'),
              '%s: daten real|synthetisch fehlt (B5)' % weg)
        regel('R-08e', k.get('daten') == 'synthetisch',
              '%s: Pruefmaterial muss synthetisch heissen (B5)' % weg)
    u = d['unvollstaendig']['kosten']
    regel('R-08', 'gesamt' not in u, 'unvollstaendig mit Gesamtsumme')
    regel('R-08', u['status_text'] == 'Kosten nicht vollständig ermittelbar.',
          'Statussatz abgewandelt: %r' % u.get('status_text'))
    regel('R-08b', u['sichtbar'] is True, 'Kostenfeld nicht sichtbar')
    a = d['archiv']['unvollstaendig']['kosten']
    regel('R-08d', 'gesamt' not in a and a['status_text'] == u['status_text'],
          'Archivkosten folgen nicht derselben Definition (B5)')
    v = d['vollstaendig']['kosten']
    regel('R-09c', v['gesamt'].get('abdeckung_beleg') and v['gesamt'].get('quellen')
          and v['ohne_angabe'] == 0,
          'vollstaendig ohne Abdeckungsnachweis, Quellen oder mit offenen Angaben (B5)')


# ----------------------------------------------------------------- B4
def fall07():
    d = lade('07-altlog-ohne-zeitpunkte.json')['daten']
    m = d['manifest']
    form(m, 'archivmanifest', '07 Archivmanifest')
    zeiten = [e['occurred_at'] for e in m['ereignisse']]
    hat = [z for z in zeiten if z]
    soll = 'complete' if len(hat) == len(zeiten) else ('none' if not hat else 'partial')
    regel('R-10', m['zeitachse'] == soll, 'zeitachse %r, abgeleitet %r' % (m['zeitachse'], soll))
    regel('R-18', d['darstellung']['modus'] == 'schrittfolge',
          'bei partial keine Schrittfolge')
    p = m['ereignisse'][0]
    regel('R-30', all(f in p for f in ('agent_id', 'platform', 'actual_model',
                                       'actual_reasoning', 'input_tokens',
                                       'output_tokens', 'thinking_tokens')),
          'flache Quellfelder des Altlogs fehlen (B4)')
    oc = p.get('ownership_change') or {}
    # R5 des V2.1-Reviews: KEINE pauschale Pflicht zu scope/basis. Gefordert ist,
    # dass die effektive Zielaufgabe eindeutig ist. Vorhandene Quellangaben
    # bleiben erhalten -- ihr Fehlen ist kein Datenverlust.
    regel('R-31', RED.effektive_aufgabe(p) is not None and not RED.pruefe_ereignis(p),
          'Verantwortungstransition ohne eindeutige effektive Zielaufgabe (R5)')
    regel('R-31b', all(f in oc for f in ('scope', 'basis')),
          'vorhandene Quellangaben scope/basis wurden entfernt - sie sind nicht '
          'Pflicht, aber sie bleiben erhalten (B4/R5)')
    ad = d['adapter']
    regel('R-30', ad.get('verlustfrei') is True and len(ad.get('ablageebenen', [])) == 2,
          'Adaptervertrag nicht quellenerhaltend oder ohne beide Ablageebenen (B4)')


def fall08():
    d = lade('08-nurlesen-befehle.json')['daten']
    w = d['wandansicht']
    form(w['anfrage'], 'befehl', '08 Anfrage Wand')
    form(w['antwort'], 'befehl', '08 Antwort Wand')
    regel('R-14', w['rechte'] == ['read'], 'Wandansicht nicht nur lesend')
    regel('R-13', w['antwort']['nebenwirkung'] is False
          and w['antwort']['fehlercode'] == 'recht_fehlt', 'Ablehnung fehlerhaft')
    n = d['nicht_unterstuetzt']
    form(n['anfrage'], 'befehl', '08 Anfrage nicht unterstuetzt')
    form(n['antwort'], 'befehl', '08 Antwort nicht unterstuetzt')
    regel('R-32', n['antwort']['fehlercode'] == 'nicht_unterstuetzt'
          and n['antwort']['nebenwirkung'] is False,
          'leere supported_actions fuehren nicht zu nicht_unterstuetzt (O1)')
    regel('R-35', d.get('supported_actions') == [],
          'supported_actions nicht maschinenlesbar [] (R4)')
    bsp = d['nicht_aktiviertes_beispiel']
    regel('R-38', bsp['aktiviert'] is False
          and all(a['stufe'] not in ('ausgefuehrt',) for a in bsp['nur_schemaform']),
          'Betriebsfixture enthaelt eine ausgefuehrte Aktion (R4)')
    alle = json.dumps(d)
    regel('R-38', '"ausgefuehrt"' not in alle,
          'irgendwo im Fixture steht eine ausgefuehrte Aktion (R4)')
    for a in bsp['nur_schemaform']:
        form(a, 'befehl', '08 nicht aktiviert %s' % a['stufe'])


# ----------------------------------------------------------------- B3
def fall09():
    d = lade('09-archiv-zeitsprung.json')['daten']
    m = d['manifest']
    form(m, 'archivmanifest', '09 Archivmanifest')
    regel('R-33', len(m['ereignisse']) > 0 and all(e.get('id') for e in m['ereignisse']),
          'Archivereignisse nicht kanonisch (B3)')
    z4, verst = RED.reduziere(m['ereignisse'])
    z3, _ = RED.reduziere(m['ereignisse'], 3)
    regel('R-28', not verst, 'Revisionskette im Archiv: %s' % '; '.join(verst))
    regel('R-11b', not RED.done_nachweise(m['ereignisse']),
          'Done im Archiv ohne Erfuellungsnachweis')
    regel('R-29', d['wiedergabe']['weg_a']['zustand_danach'] == z4,
          'Weg A weicht vom berechneten Zustand ab')
    regel('R-16b', d['wiedergabe']['weg_b']['zustand_danach'] == z4,
          'Zeitsprung weicht vom berechneten Zustand ab')
    regel('R-29', d['wiedergabe']['zwischenstand_cursor_3'] == z3,
          'Zwischenstand bei Cursor 3 weicht ab')
    nw = d['wiedergabe']['nebenwirkungen_behauptet']
    regel('R-16c', all(v == 0 for v in nw.values())
          and 'NOT_TESTED' in d['wiedergabe']['nebenwirkungen_nachweis'],
          'Nebenwirkungsfreiheit als bewiesen ausgegeben statt als behauptet (B3)')


# ----------------------------------------------------------------- Negativ
def negativ():
    d = lade('10-negativproben.json')['proben']
    for p in d:
        zahl['negativ'] += 1
        name, wogegen, dat = p['name'], p['wogegen'], p['daten']
        erkannt = False
        if wogegen in ('arbeitsereignis', 'archivmanifest', 'kostenfeld',
                       'umschlag', 'resume_antwort'):
            if wogegen == 'resume_antwort':
                b = formfehler(dat, wogegen)
                soll, grund = fortsetzbar(dat['cursor'], dat['replay_grenze'],
                                          dat['hoechste_sequenz'])
                erkannt = bool(b) or dat['fortsetzbar'] != soll or dat['grund'] != grund
            else:
                erkannt = bool(formfehler(dat, wogegen))
        elif wogegen == 'zeitfenster':
            erkannt = RED.ueberlappend(dat) == p['soll_ueberlappend']
        elif wogegen == 'reducer':
            if isinstance(dat, dict) and 'behauptet' in dat:
                z, _ = RED.reduziere(dat['ereignisse'])
                erkannt = z != dat['behauptet']
            else:
                _, v = RED.reduziere(dat)
                erkannt = bool(v)
        elif wogegen == 'done_nachweise':
            erkannt = bool(RED.done_nachweise(dat))
        elif wogegen == 'reducer_zustand':
            z, v = RED.reduziere(dat['ereignisse'])
            erkannt = (z['aufgaben'] == dat['soll_aufgaben']
                       and bool(v) == dat['soll_verstoss'])
        elif wogegen == 'reducer_verstoss':
            _, v = RED.reduziere(dat, cursor=p.get('cursor_start'))
            erkannt = bool(v)
        elif wogegen == 'supported_actions':
            erkannt = (dat.get('supported_actions') != []) and p['soll_leer']
        if p['muss'] == 'angenommen':
            # R5: diese Probe MUSS bestehen. V2.1 hatte sie faelschlich erzwungen.
            b = formfehler(dat, wogegen)
            v = RED.pruefe_ereignis(dat)
            erkannt = not b and not v
            if not erkannt:
                fehler.append('POSITIV %-38s wurde abgelehnt, muss aber bestehen: %s'
                              % (name, '; '.join(b + v)))
            else:
                print('  %-40s angenommen  (V2: %s)' % (name, p['v2']))
            continue
        if not erkannt:
            fehler.append('NEGATIV %-38s NICHT %s (V2: %s, Quelle %s)'
                          % (name, p['muss'], p['v2'], p['quelle']))
        else:
            print('  %-40s %s  (V2: %s)' % (name, p['muss'], p['v2']))


# ----------------------------------------------------------------- R3
def fall11():
    d = lade('11-snapshot-plus-tail.json')['daten']
    s = d['schnappschuss']
    form(s, 'schnappschuss', '11 Schnappschuss')
    zc = s['lauf']['zustand_am_cursor']
    regel('R-39', zc['cursor'] == s['cursor'] == 103,
          'innerer und aeusserer Cursor nicht gleich: %r / %r' % (zc['cursor'], s['cursor']))

    def entpacke(umschlaege):
        """stream_sequence steht im UMSCHLAG. Transportfolge und Fachidentitaet
        sind verschiedene Groessen; sie wird hier fuer den Reducer eingesetzt,
        statt im Fachereignis zu stehen. R3."""
        aus = []
        for u in umschlaege:
            e = dict(u['payload'])
            e['stream_sequence'] = u['stream_sequence']
            aus.append(e)
        return aus

    for u in d['vollhistorie_umschlaege']:
        form(u, 'umschlag', '11 Umschlag %s' % u['stream_sequence'])
    voll_ev = entpacke(d['vollhistorie_umschlaege'])
    letzte_seq = voll_ev[2]['stream_sequence']
    regel('R-39', s['cursor'] == letzte_seq,
          'Cursor %r ist keine stream_sequence (letzte im Schnappschuss: %r)'
          % (s['cursor'], letzte_seq))

    voll, v1 = RED.reduziere(voll_ev, cursor=100)
    fort, v2 = RED.reduziere(entpacke(d['tail_umschlaege']),
                             initial_state=zc, cursor=s['cursor'])
    regel('R-40', not v1 and not v2, 'Verstoesse: %s' % '; '.join(v1 + v2))
    regel('R-40', voll == fort,
          'Vollhistorie weicht von Schnappschuss+Tail ab:\n     voll %s\n     fort %s'
          % (json.dumps(voll, ensure_ascii=False, sort_keys=True),
             json.dumps(fort, ensure_ascii=False, sort_keys=True)))
    regel('R-40', voll == d['zustand_voll_soll'], 'behaupteter Vollzustand weicht ab')
    regel('R-11b', not RED.done_nachweise(voll_ev),
          'Done ohne Nachweis: %s' % '; '.join(RED.done_nachweise(voll_ev)))

    zd, vd = RED.reduziere(entpacke(d['doppelt_im_tail']['tail_umschlaege']),
                           initial_state=zc, cursor=s['cursor'])
    regel('R-41', any('doppelt' in x for x in vd) and zd == fort,
          'doppeltes Ereignis nicht erkannt oder Zustand veraendert: %s' % '; '.join(vd))
    # K2: Es genuegt NICHT, die Luecke zu melden. Geprueft wird, dass das
    # Ereignis hinter der Luecke nicht wirkt und den Cursor nicht setzt.
    lu = d['luecke_im_tail']
    zl, vl = RED.reduziere(entpacke(lu['tail_umschlaege']),
                           initial_state=zc, cursor=s['cursor'])
    regel('R-42', any('Luecke' in x for x in vl), 'Luecke nicht gemeldet')
    regel('R-42', zl['cursor'] == lu['soll_cursor'],
          'Cursor %r statt %r - eine Luecke darf die Fortschreibung sperren, '
          'nicht ueberspringen (K2)' % (zl['cursor'], lu['soll_cursor']))
    regel('R-42', zl == lu['soll_zustand'],
          'Zustand hinter der Luecke weicht ab - die Wirkung des gepufferten '
          'Ereignisses ist eingetreten (K2):\n     ist  %s\n     soll %s'
          % (json.dumps(zl, ensure_ascii=False, sort_keys=True),
             json.dumps(lu['soll_zustand'], ensure_ascii=False, sort_keys=True)))
    regel('R-42', all(a['status'] != 'done' for a in zl['aufgaben']),
          'hinter der Luecke steht done im Zustand (K2)')

    # K2: Nachlieferung schliesst die Luecke, danach geordnete Fortsetzung.
    na = d['nachlieferung']
    zn, vn = RED.reduziere(entpacke(na['tail_umschlaege']),
                           initial_state=zc, cursor=s['cursor'])
    regel('R-43', zn['cursor'] == na['soll_cursor'],
          'nach Nachlieferung Cursor %r statt %r (K2)' % (zn['cursor'], na['soll_cursor']))
    regel('R-43', zn == na['soll_zustand'] == fort,
          'nach Nachlieferung weicht der Zustand von der geordneten Zustellung ab (K2)')


# ----------------------------------------------------------------- K1, K3
def fall12():
    d = lade('12-zustandsschutz.json')['daten']
    bekannt = d['bekannter_zustand']

    for f in d['k1_faelle']:
        for e in f['ereignisse']:
            form(e, 'arbeitsereignis', '12 %s/%s' % (f['name'], e['id']))
        z, v = RED.reduziere(f['ereignisse'])
        nr = 'R-44' if f['name'] == 'ungueltige_erste_transition' else 'R-28'
        # Erst die Diagnose ...
        regel(nr, bool(v) == f['soll_verstoss'],
              '%s: Diagnose fehlt' % f['name'])
        # ... und dann, worauf es ankommt: der FACHLICHE Zustand ist unberuehrt.
        fach = {k: v for k, v in z.items() if k != 'cursor'}
        regel(nr, fach == f['soll_fachzustand'],
              '%s: FACHLICHER ZUSTAND veraendert, obwohl die Pruefung fiel (K1):\n'
              '     ist  %s\n     soll %s'
              % (f['name'],
                 json.dumps(fach, ensure_ascii=False, sort_keys=True),
                 json.dumps(f['soll_fachzustand'], ensure_ascii=False, sort_keys=True)))
        # Der Cursor ist Verbrauchsstand, nicht Wirkungsbestaetigung: er zaehlt
        # weiter, sonst stuende der Strom. Bei einer LUECKE gilt das Gegenteil
        # (Fall 11, R-42). Die Abgrenzung steht im Fixture unter abgrenzung.
        regel('R-46', z['cursor'] == f['soll_cursor_verbrauch'],
              '%s: Cursor %r statt %r' % (f['name'], z['cursor'],
                                          f['soll_cursor_verbrauch']))
        if f['soll_kein_done']:
            regel(nr, all(a['status'] != 'done' for a in z['aufgaben']),
                  '%s: done steht im Zustand (K1)' % f['name'])
        if f['name'] == 'ungueltige_erste_transition':
            regel('R-44', z['aufgaben'] == [],
                  'ungueltige erste Transition hat die Aufgabe angelegt (K1)')

    regel('R-45', RED.ABWEICHUNG_AKTIV is False,
          'der Abweichungsweg ist nicht deaktiviert (K3)')
    regel('R-45', d['k3_profil']['abweichung_aktiv'] is False,
          'das Profil weist den Abweichungsweg als aktiv aus (K3)')
    for f in d['k3_faelle']:
        b = RED.done_nachweise(f['ereignisse'])
        regel('R-45', bool(b) == f['soll_done_beanstandet'],
              '%s: freie Autorisierung schaltet Done frei (K3)' % f['name'])
        z, _ = RED.reduziere(f['ereignisse'])
        regel('R-45', any(a['status'] == 'done' for a in z['aufgaben']),
              '%s: Vorbedingung der Probe stimmt nicht - der Statuswechsel '
              'selbst ist gueltig, nur der NACHWEIS fehlt' % f['name'])


def main():
    print('Schnittstellenvertrag V2.1.2 — Prueflauf\n')
    print('Negativproben:')
    for f in (negativ, fall01, fall02, fall03, fall04, fall05, fall06, fall07,
              fall08, fall09, fall11, fall12):
        try:
            f()
        except Exception as e:
            import traceback
            fehler.append('ABBRUCH %s: %s: %s' % (f.__name__, type(e).__name__, e))
            if os.environ.get('AG_SPUR'):
                traceback.print_exc()
    print('\n  Formpruefungen:    %d' % zahl['form'])
    print('  Regelpruefungen:   %d' % zahl['regeln'])
    print('  Negativproben:     %d' % zahl['negativ'])
    if fehler:
        print('\n%d Beanstandungen:' % len(fehler))
        for z in fehler:
            print('  ' + z)
        return 1
    print('\nAlle Faelle 01-12 bestanden, alle Proben wie verlangt behandelt.')
    print('NICHT geprueft: Server, SSE, Browser, serverseitige Rechte, '
          'Laufzeit-Nebenwirkungsfreiheit.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
