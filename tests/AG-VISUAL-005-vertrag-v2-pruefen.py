#!/usr/bin/env python3
"""Prueft den Schnittstellenvertrag V2 gegen seine Beispieldaten.

Antwort auf Sentinels FAIL_TESTABILITY_ONLY: Ein Vertrag, dessen
Abnahmefaelle nur beschrieben sind, ist nicht abnehmbar. Dieser Prueflauf
rechnet sie nach.

Zwei Durchgaenge:
  1. FORM   -- jede Nachricht gegen ihr JSON Schema.
  2. REGELN -- die benannten Invarianten R-01..R-23, die die Beispiele in
               ihrem Feld "erwartung" selbst behaupten.

KEINE Fremdbibliothek: die Projektregel verlangt, dass zur Laufzeit nichts
von aussen geholt wird. Der eingebaute Schemapruefer deckt deshalb nur den
Teil von JSON Schema 2020-12 ab, den diese Schemas verwenden:
  type const enum properties required additionalProperties items minItems
  maxItems uniqueItems contains minLength maxLength minimum pattern
  oneOf anyOf allOf not if/then $ref(#/$defs/...)
Er ist KEIN vollstaendiger Pruefer. Wer mehr will, nimmt die Schemas und
einen Standardpruefer -- sie sind dafuer geschrieben.

Aufruf:  python3 tests/AG-VISUAL-005-vertrag-v2-pruefen.py
Rueckgabe: 0 wenn alles stimmt, sonst 1.
"""
import json, os, re, sys

HIER = os.path.dirname(os.path.abspath(__file__))
WURZEL = os.path.dirname(HIER)
SCHEMAS = os.path.join(WURZEL, 'specifications', 'AG-VISUAL-005-schemas-v2')
BEISPIELE = os.path.join(WURZEL, 'fixtures', 'AG-VISUAL-005-beispiele-v2')

fehler = []
geprueft = {'form': 0, 'regeln': 0}


def lade(p):
    with open(p, encoding='utf-8') as f:
        return json.load(f)


# ------------------------------------------------------------------ Schema
def pruefe(daten, schema, wurzel, weg='$'):
    """Gibt eine Liste von Beanstandungen zurueck."""
    b = []
    if '$ref' in schema:
        ref = schema['$ref']
        if not ref.startswith('#/'):
            return ['%s: $ref %s nicht aufloesbar' % (weg, ref)]
        ziel = wurzel
        for teil in ref[2:].split('/'):
            ziel = ziel[teil]
        return pruefe(daten, ziel, wurzel, weg)

    if 'const' in schema and daten != schema['const']:
        b.append('%s: muss %r sein, ist %r' % (weg, schema['const'], daten))
    if 'enum' in schema and daten not in schema['enum']:
        b.append('%s: %r nicht in %r' % (weg, daten, schema['enum']))

    if 'type' in schema:
        arten = schema['type']
        arten = arten if isinstance(arten, list) else [arten]
        passt = False
        for a in arten:
            if a == 'object' and isinstance(daten, dict): passt = True
            elif a == 'array' and isinstance(daten, list): passt = True
            elif a == 'string' and isinstance(daten, str): passt = True
            elif a == 'integer' and isinstance(daten, int) and not isinstance(daten, bool): passt = True
            elif a == 'number' and isinstance(daten, (int, float)) and not isinstance(daten, bool): passt = True
            elif a == 'boolean' and isinstance(daten, bool): passt = True
            elif a == 'null' and daten is None: passt = True
        if not passt:
            b.append('%s: Typ %r erwartet, ist %s' % (weg, arten, type(daten).__name__))
            return b

    if isinstance(daten, str):
        if 'minLength' in schema and len(daten) < schema['minLength']:
            b.append('%s: zu kurz' % weg)
        if 'maxLength' in schema and len(daten) > schema['maxLength']:
            b.append('%s: zu lang' % weg)
        if 'pattern' in schema and not re.search(schema['pattern'], daten):
            b.append('%s: %r passt nicht auf %s' % (weg, daten, schema['pattern']))
    if isinstance(daten, (int, float)) and not isinstance(daten, bool):
        if 'minimum' in schema and daten < schema['minimum']:
            b.append('%s: kleiner als %r' % (weg, schema['minimum']))

    if isinstance(daten, dict):
        for f in schema.get('required', []):
            if f not in daten:
                b.append('%s: Pflichtfeld %s fehlt' % (weg, f))
        eig = schema.get('properties', {})
        for k, v in daten.items():
            if k in eig:
                b += pruefe(v, eig[k], wurzel, '%s.%s' % (weg, k))
            elif schema.get('additionalProperties') is False:
                b.append('%s: unerlaubtes Feld %s' % (weg, k))

    if isinstance(daten, list):
        if 'items' in schema:
            for i, e in enumerate(daten):
                b += pruefe(e, schema['items'], wurzel, '%s[%d]' % (weg, i))
        if 'minItems' in schema and len(daten) < schema['minItems']:
            b.append('%s: zu wenige Elemente' % weg)
        if 'maxItems' in schema and len(daten) > schema['maxItems']:
            b.append('%s: zu viele Elemente' % weg)
        if schema.get('uniqueItems') and len(daten) != len({json.dumps(x, sort_keys=True) for x in daten}):
            b.append('%s: doppelte Elemente' % weg)
        if 'contains' in schema and not any(
                not pruefe(e, schema['contains'], wurzel, weg) for e in daten):
            b.append('%s: kein Element erfuellt contains' % weg)

    if 'oneOf' in schema:
        treffer = [i for i, s in enumerate(schema['oneOf'])
                   if not pruefe(daten, s, wurzel, weg)]
        if len(treffer) != 1:
            b.append('%s: oneOf traf %d von %d Zweigen'
                     % (weg, len(treffer), len(schema['oneOf'])))
    if 'anyOf' in schema and not any(
            not pruefe(daten, s, wurzel, weg) for s in schema['anyOf']):
        b.append('%s: anyOf traf keinen Zweig' % weg)
    for s in schema.get('allOf', []):
        b += pruefe(daten, s, wurzel, weg)
    if 'not' in schema and not pruefe(daten, schema['not'], wurzel, weg):
        b.append('%s: verbotenes Muster erfuellt (not)' % weg)
    if 'if' in schema:
        if not pruefe(daten, schema['if'], wurzel, weg):
            if 'then' in schema:
                b += pruefe(daten, schema['then'], wurzel, weg)
        elif 'else' in schema:
            b += pruefe(daten, schema['else'], wurzel, weg)
    return b


def form(daten, schemaname, was):
    s = lade(os.path.join(SCHEMAS, schemaname))
    b = pruefe(daten, s, s)
    geprueft['form'] += 1
    for z in b:
        fehler.append('FORM  %-46s %s' % (was, z))
    return not b


# ------------------------------------------------------------------ Regeln
def regel(nr, bedingung, was):
    geprueft['regeln'] += 1
    if not bedingung:
        fehler.append('REGEL %-6s %s' % (nr, was))
    return bedingung


def sek(a, b):
    """Abstand in Sekunden zwischen zwei ISO-Zeitpunkten (nur Z-Form hier)."""
    import datetime
    f = lambda s: datetime.datetime.fromisoformat(s.replace('Z', '+00:00'))
    return (f(b) - f(a)).total_seconds()


STROM = 'strom.schema.json'
SCHNAPP = 'schnappschuss.schema.json'
MANIFEST = 'archivmanifest.schema.json'
BEFEHL = 'befehl.schema.json'


def fall01():
    d = lade(os.path.join(BEISPIELE, '01-einstieg-snapshot-live.json'))['daten']
    form(d['schnappschuss'], SCHNAPP, '01 Schnappschuss')
    for e in d['danach']:
        form(e, STROM, '01 Umschlag %d' % e['stream_sequence'])
    folgen = [e['stream_sequence'] for e in d['danach']]
    regel('R-05', folgen[0] == d['schnappschuss']['cursor'] + 1,
          'erste Folge muss cursor+1 sein (%d vs %d)' % (folgen[0], d['schnappschuss']['cursor'] + 1))
    regel('R-02', folgen == list(range(folgen[0], folgen[0] + len(folgen))),
          'Folgen nicht lueckenlos: %r' % folgen)
    L = d['schnappschuss']['lauf']
    regel('R-17', (L['ansicht'] == 'archiv') == L['terminal'],
          'ansicht folgt nicht terminal')
    regel('R-17', L['terminal'] is False and L['zustand'] == 'aktiv',
          'aktiv darf nicht terminal sein')


def fall02():
    d = lade(os.path.join(BEISPIELE, '02-heartbeat-veraltet.json'))['daten']
    for h in d['lebenszeichen']:
        form(h, STROM, '02 Lebenszeichen')
        regel('R-03', 'stream_sequence' not in h, 'Lebenszeichen traegt stream_sequence')
        regel('R-03', 'id' not in h and 'payload' not in h,
              'Lebenszeichen traegt eine Fachereignis-ID oder Nutzdaten')
    letzt = d['lebenszeichen'][-1]['sent_at']
    grenze = d['veraltet_nach_sekunden']
    for p in d['pruefzeitpunkte']:
        alt = sek(letzt, p['zeit']) > grenze
        regel('R-04' if p['soll'] == 'veraltet' else 'R-04b',
              alt == (p['soll'] == 'veraltet'),
              '%s: %.0f s nach letztem Lebenszeichen, soll %s'
              % (p['zeit'], sek(letzt, p['zeit']), p['soll']))


def fall03():
    d = lade(os.path.join(BEISPIELE, '03-reconnect-replaygrenze.json'))['daten']
    i = d['im_puffer']
    regel('R-06', int(i['anfrage']['Last-Event-ID']) >= 120 and i['antwort_status'] == 200,
          'Cursor im Puffer muss nachlieferbar sein')
    for e in i['nachgeliefert']:
        form(e, STROM, '03 Nachlieferung')
    a = d['ausserhalb_puffer']
    regel('R-06b', int(a['anfrage']['Last-Event-ID']) < a['fehler']['replay_grenze']
          and a['antwort_status'] == 409 and 'neuer_schnappschuss' in a['fehler'],
          'Cursor unter der Replaygrenze muss 409 und einen neuen Schnappschuss ergeben')
    form(a['ersatz_schnappschuss'], SCHNAPP, '03 Ersatzschnappschuss')
    regel('R-05', a['danach'][0]['stream_sequence'] == a['ersatz_schnappschuss']['cursor'] + 1,
          'Ersatzschnappschuss: erste Folge nicht cursor+1')


def fall04():
    d = lade(os.path.join(BEISPIELE, '04-zwei-projekte-laeufe.json'))['daten']
    k = d['katalogstrom']
    for e in k['ereignisse']:
        form(e, STROM, '04 Katalog %d' % e['stream_sequence'])
    regel('R-02', [e['stream_sequence'] for e in k['ereignisse']] == [1, 2, 3, 4],
          'Katalogfolge nicht 1..4')
    angelegt = [e['payload']['project_id'] for e in k['ereignisse']
                if e['kind'] == 'project.created']
    # Sequenzraeume sind getrennt: beide Arbeitsstroeme beginnen bei 1
    anf = []
    for name in ('arbeitsstrom_AG_NEU_R1', 'arbeitsstrom_AG_ALT_R2'):
        z = d[name]['zustellungen']
        anf.append(z[0]['umschlag']['stream_sequence'])
        for s in z:
            form(s['umschlag'], STROM, '04 %s' % name)
    regel('R-02', anf == [1, 1], 'Sequenzraeume nicht getrennt: %r' % anf)
    # Duplikat und Nachzuegler: Cursor-Nachrechnung
    cursor, verarbeitet, verworfen = 0, [], []
    for s in d['arbeitsstrom_AG_NEU_R1']['zustellungen']:
        q = s['umschlag']['stream_sequence']
        if q == cursor + 1:
            cursor = q; verarbeitet.append(s['folge'])
        else:
            verworfen.append((s['folge'], s['soll']))
    regel('R-07', [f for f, _ in verworfen] == [3, 4],
          'Duplikat/Nachzuegler nicht verworfen: %r' % verworfen)
    regel('R-07b', cursor == 2, 'Cursor nach Verwerfen falsch: %d' % cursor)
    for L in d['laeufe_im_katalog']:
        terminal = L['zustand'] in ('abgeschlossen', 'abgebrochen', 'fehlgeschlagen')
        regel('R-17', L['terminal'] == terminal and
              L['ansicht'] == ('archiv' if terminal else 'live'),
              '%s/%s: ansicht folgt nicht dem Zustand' % (L['project_id'], L['run_id']))
    for name in ('arbeitsstrom_AG_NEU_R1', 'arbeitsstrom_AG_ALT_R2'):
        for s in d[name]['zustellungen']:
            regel('R-19', s['umschlag']['payload']['project_id'] in angelegt + ['AG-ALT'],
                  'project_id ohne project.created')


def fall05():
    d = lade(os.path.join(BEISPIELE, '05-parallel-artefakte-review.json'))['daten']
    s = lade(os.path.join(SCHEMAS, STROM))
    ae = s['$defs']['arbeitsereignis']
    for e in d['ereignisse']:
        b = pruefe(e, ae, s, e['id'])
        geprueft['form'] += 1
        for z in b:
            fehler.append('FORM  %-46s %s' % ('05 Arbeitsereignis', z))
    for e in d['ereignisse']:
        if e['kind'] in ('review_result', 'test_result'):
            regel('R-12', all(e.get(f) for f in ('artifact_id', 'version', 'criteria_ref', 'outcome')),
                  '%s: Pruefung ohne Ziel, Version, Kriterien oder Ergebnis' % e['id'])
    done = set()
    for e in d['ereignisse']:
        if e['kind'] == 'status_change' and e.get('to') == 'done':
            regel('R-11', e.get('item_revision') and e.get('task_id') and e.get('from'),
                  '%s: Statuswechsel ohne Revision/Aufgabe/Vorzustand' % e['id'])
            done.add(e['task_id'])
    regel('R-11', done == set(d['abgeleitet']['done_aufgaben']),
          'Done abgeleitet %r, behauptet %r' % (sorted(done), d['abgeleitet']['done_aufgaben']))
    for t in d['abgeleitet']['nicht_done']:
        regel('R-11', t not in done, '%s darf nicht Done sein' % t)
    # Ein Pass auf v1 gilt nicht fuer v2
    paare = {(e['artifact_id'], e['version']): e['outcome'] for e in d['ereignisse']
             if e['kind'] in ('review_result', 'test_result')}
    regel('R-20', paare.get(('ART-11', 'v1')) == 'pass' and paare.get(('ART-11', 'v2')) == 'fail',
          'Versionsgebundene Pruefung nicht belegt: %r' % paare)
    # Parallelitaet: zwei Aufgaben mit ueberlappenden Zeitfenstern
    von = {}
    for e in d['ereignisse']:
        if e.get('task_id') and e.get('occurred_at'):
            von.setdefault(e['task_id'], []).append(e['occurred_at'])
    regel('R-21', len([t for t in von if len(von[t]) >= 1]) >= 2,
          'keine zwei gleichzeitig laufenden Aufgaben')
    regel('R-22', any(e.get('supersedes') == 'ART-11@v1' for e in d['ereignisse']),
          'supersedes auf die Vorgaengerversion fehlt')


VERBOTEN = re.compile(r'(betrag|gesamt|summe|teilsumme)', re.I)


def fall06():
    d = lade(os.path.join(BEISPIELE, '06-kosten-sichtbar-ohne-betrag.json'))['daten']
    s = lade(os.path.join(SCHEMAS, SCHNAPP))
    kf = s['$defs']['kostenfeld']
    for name in ('unvollstaendig', 'vollstaendig'):
        k = d[name]['kosten']
        b = pruefe(k, kf, s, name)
        geprueft['form'] += 1
        for z in b:
            fehler.append('FORM  %-46s %s' % ('06 Kostenfeld ' + name, z))
    u = d['unvollstaendig']['kosten']
    regel('R-08', 'gesamt' not in u, 'unvollstaendig traegt eine Gesamtsumme')
    regel('R-08', u['status_text'] == 'Kosten nicht vollständig ermittelbar.',
          'Statussatz weicht ab: %r' % u.get('status_text'))
    regel('R-08', not VERBOTEN.search(json.dumps([k for k in u if k != 'erfassung'])),
          'unvollstaendig traegt ein betragsartiges Feld: %r' % sorted(u))
    regel('R-08b', u['sichtbar'] is True, 'Kostenfeld nicht sichtbar')
    regel('R-08c', isinstance(u.get('ohne_angabe'), int),
          'ohne_angabe ist keine Anzahl')
    regel('R-08c', d['unvollstaendig']['anzeige'] == u['status_text'],
          'Anzeige zeigt nicht genau den Statussatz')
    v = d['vollstaendig']['kosten']
    regel('R-09', v['erfassung'] == 'vollstaendig' and v['gesamt']['belegt'] is True
          and v['ohne_angabe'] == 0,
          'Betrag ohne vollstaendige, belegte Erfassung')
    unbelegt = [e for e in d['unvollstaendig']['einzelnachweise']
                if not e['verbrauch']['belegt']]
    regel('R-09b', unbelegt and all(
        e['verbrauch']['input_tokens'] is None for e in unbelegt),
        'unbelegter Verbrauch wurde zu einer Zahl gemacht')


def fall07():
    d = lade(os.path.join(BEISPIELE, '07-altlog-ohne-zeitpunkte.json'))['daten']
    m = d['manifest']
    form(m, MANIFEST, '07 Archivmanifest')
    zeiten = [e['occurred_at'] for e in m['ereignisse']]
    hat = [z for z in zeiten if z]
    soll = 'complete' if len(hat) == len(zeiten) else ('none' if not hat else 'partial')
    regel('R-10', m['zeitachse'] == soll,
          'zeitachse %r, abgeleitet %r (%d von %d Zeitpunkten)'
          % (m['zeitachse'], soll, len(hat), len(zeiten)))
    regel('R-18', d['darstellung']['modus'] == 'schrittfolge'
          and 'Schrittfolge' in d['darstellung']['beschriftung'],
          'bei partial keine sichtbar bezeichnete Schrittfolge')
    regel('R-18b', any('recorded_at' in v for v in d['darstellung']['verboten']),
          'recorded_at als Ereigniszeit nicht ausdruecklich verboten')
    n = d['vergleichsfall_none']
    regel('R-10b', n['zeitachse'] == 'none'
          and all(e['occurred_at'] is None for e in n['ereignisse']),
          'Vergleichsfall none nicht schluessig')


def fall08():
    d = lade(os.path.join(BEISPIELE, '08-nurlesen-befehle.json'))['daten']
    w = d['wandansicht']
    form(w['anfrage'], BEFEHL, '08 Anfrage Wand')
    form(w['antwort'], BEFEHL, '08 Antwort Wand')
    regel('R-14', w['rechte'] == ['read'], 'Wandansicht nicht nur lesend')
    regel('R-14', w['antwort']['fehlercode'] == 'recht_fehlt'
          and w['antwort']['stufe'] == 'abgelehnt',
          'Befehl ohne command-Recht nicht abgelehnt')
    regel('R-13', w['antwort']['nebenwirkung'] is False,
          'abgelehnter Befehl mit Nebenwirkung')
    b = d['berechtigte_ansicht']
    form(b['anfrage'], BEFEHL, '08 Anfrage berechtigt')
    stufen = []
    for s in b['ablauf']:
        form(s['antwort'], BEFEHL, '08 Antwort %s' % s['antwort']['stufe'])
        stufen.append(s['antwort']['stufe'])
    regel('R-23', stufen[0] == 'empfangen'
          and b['ablauf'][0]['antwort']['nebenwirkung'] is False,
          'empfangen als Ausfuehrungsnachweis missbraucht')
    letzte = b['ablauf'][-1]['antwort']
    regel('R-15', letzte['stufe'] == 'ausgefuehrt' and letzte['folge_ereignisse'],
          'ausgefuehrter Befehl ohne folge_ereignisse')
    r = d['wiederholung']
    form(r['antwort'], BEFEHL, '08 Antwort Wiederholung')
    regel('R-15b', r['anfrage_erneut']['command_id'] == b['anfrage']['command_id']
          and r['antwort']['fehlercode'] == 'doppelt_ignoriert'
          and r['antwort']['nebenwirkung'] is False,
          'dieselbe command_id fuehrt zu doppelter Ausfuehrung')
    v = d['veraltete_revision']
    form(v['antwort'], BEFEHL, '08 Antwort veraltete Revision')
    regel('R-13', v['antwort']['fehlercode'] == 'revision_veraltet'
          and v['antwort']['nebenwirkung'] is False,
          'veraltete Revision nicht nebenwirkungsfrei abgelehnt')


def fall09():
    d = lade(os.path.join(BEISPIELE, '09-archiv-zeitsprung.json'))['daten']
    m = d['manifest']
    form(m, MANIFEST, '09 Archivmanifest')
    regel('R-16', m['wiedergabe']['nebenwirkungsfrei'] is True
          and m['wiedergabe']['deterministisch'] is True,
          'Wiedergabe nicht nebenwirkungsfrei oder nicht deterministisch')
    a = d['wiedergabe']['weg_a']['zustand_danach']
    b = d['wiedergabe']['weg_b']['zustand_danach']
    regel('R-16b', a == b, 'Zeitsprung ergibt anderen Zustand als Schrittweise:\n  %r\n  %r' % (a, b))
    nw = d['wiedergabe']['nebenwirkungen_beobachtet']
    regel('R-16c', all(v == 0 for v in nw.values()),
          'Wiedergabe mit Nebenwirkungen: %r' % nw)
    terminal = m['zustand'] in ('abgeschlossen', 'abgebrochen', 'fehlgeschlagen')
    regel('R-17', terminal, 'Archivlauf nicht terminal')
    zeiten = [e['occurred_at'] for e in m['ereignisse']]
    regel('R-10', m['zeitachse'] == 'complete' and all(zeiten),
          'zeitachse complete ohne vollstaendige Zeitpunkte')


def main():
    for f in (fall01, fall02, fall03, fall04, fall05, fall06, fall07, fall08, fall09):
        try:
            f()
        except Exception as e:
            fehler.append('ABBRUCH %s: %s: %s' % (f.__name__, type(e).__name__, e))
    print('Schnittstellenvertrag V2 — Prueflauf')
    print('  Formpruefungen:  %d' % geprueft['form'])
    print('  Regelpruefungen: %d' % geprueft['regeln'])
    if fehler:
        print('\n%d Beanstandungen:' % len(fehler))
        for z in fehler:
            print('  ' + z)
        return 1
    print('\nAlle Abnahmefaelle 01-09 bestanden.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
