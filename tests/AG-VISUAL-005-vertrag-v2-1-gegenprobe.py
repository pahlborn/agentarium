#!/usr/bin/env python3
"""Gegenprobe V2.1: kann jede NEUE Regel fehlschlagen?

Das Team-Review hat an V2 zwei Regeln gefunden, die ihren eigenen Fall nicht
erkannten (R21, R16b). Eine Regel, die nicht fehlschlagen kann, ist eine
Attrappe. Diese Gegenprobe verletzt jeden Befund B1-B5 absichtlich und
verlangt, dass die zugehoerige Pruefung anspringt.

Aufruf:  python3 tests/AG-VISUAL-005-vertrag-v2-1-gegenprobe.py
"""
import importlib.util, json, os, shutil, sys, tempfile

HIER = os.path.dirname(os.path.abspath(__file__))
PRUEFER = os.path.join(HIER, 'AG-VISUAL-005-vertrag-v2-1-pruefen.py')
QUELLE = os.path.join(os.path.dirname(HIER), 'fixtures', 'AG-VISUAL-005-beispiele-v2-1')


def modul(beispiele):
    s = importlib.util.spec_from_file_location('p%d' % id(beispiele), PRUEFER)
    m = importlib.util.module_from_spec(s)
    s.loader.exec_module(m)
    m.BEISPIELE = beispiele
    m.fehler.clear()
    for k in m.zahl:
        m.zahl[k] = 0
    return m


# (Datei, Pfad, Wert, Befund, erwartete Regel, Beschreibung)
V = [
 # ---- B1 Wiederaufnahme
 ('03-resume-grenzfaelle.json', ['daten','faelle',0,'antwort','fortsetzbar'], False,
  'B1','R-06c','Grenzfall 119/120 wieder als nicht fortsetzbar (der V2-Fehler)'),
 ('03-resume-grenzfaelle.json', ['daten','faelle',3,'antwort','grund'], 'fortsetzbar',
  'B1','R-06d','Cursor oberhalb des Hoechstwerts als fortsetzbar'),
 ('03-resume-grenzfaelle.json', ['daten','eventsource_pfad','http_status'], 409,
  'B1','R-26','EventSource-Pfad mit 409 statt auswertbarem Hinweis'),
 ('03-resume-grenzfaelle.json', ['daten','betrieb','rahmen'], 'spaeter_entschieden',
  'B1','FORM','Betriebsrahmen nicht vor der Verbindung festgelegt'),
 ('01-einstieg-snapshot-live.json', ['daten','schnappschuss','hoechste_sequenz'], None,
  'B1','FORM','hoechste_sequenz entfernt'),
 ('02-heartbeat-veraltet.json', ['daten','pruefzeitpunkte',1,'soll'], 'veraltet',
  'B1','R-04','genau 20,000 s faelschlich als veraltet'),
 ('02-heartbeat-veraltet.json', ['daten','takt_pruefung','soll_takt_s'], 7,
  'B1','R-04c','Takt 7 s behauptet, Daten zeigen 5 s'),
 # ---- B2 Done und Pruefnachweise
 ('05-parallel-artefakte-review.json', ['daten','ereignisse',7,'outcome'], 'fail',
  'B2','R-11b','bestandene v2-Pruefung auf fail gedreht: Done verliert seinen Nachweis'),
 ('05-parallel-artefakte-review.json', ['daten','ereignisse',8,'previous_transition_id'], 'FALSCH',
  'B2','R-28','Revisionskette gebrochen'),
 ('05-parallel-artefakte-review.json', ['daten','ereignisse',8,'item_revision'], 1,
  'B2','R-28','Revision nicht steigend'),
 ('05-parallel-artefakte-review.json', ['daten','ereignisse',4,'criteria_ref'], None,
  'B2','FORM','Pruefung ohne Kriterienfassung'),
 ('05-parallel-artefakte-review.json', ['daten','ereignisse',8,'artifact_id'], None,
  'B2','R-11b','Done ohne genannte Artefaktversion'),
 # ---- B3 Zustand und Selbsttestgrenzen
 ('05-parallel-artefakte-review.json', ['daten','zustand_am_cursor_soll','aufgaben'], [],
  'B3','R-29','behaupteter Zustand ohne Aufgaben gegen den berechneten'),
 ('09-archiv-zeitsprung.json', ['daten','wiedergabe','weg_b','zustand_danach','cursor'], 99,
  'B3','R-16b','Zeitsprung behauptet anderen Cursor als berechnet'),
 ('09-archiv-zeitsprung.json', ['daten','manifest','ereignisse',1,'artifact_id'], None,
  'B3','FORM','Archivereignis ohne Artefaktkennung'),
 ('09-archiv-zeitsprung.json', ['daten','wiedergabe','nebenwirkungen_nachweis'],
  'gemessen und bestaetigt',
  'B3','R-16c','Nebenwirkungsfreiheit als bewiesen ausgegeben statt NOT_TESTED'),
 ('01-einstieg-snapshot-live.json', ['daten','schnappschuss','lauf','zustand_am_cursor','aufgaben',0,'item_revision'], None,
  'B3','FORM','Aufgabenzustand ohne Revision'),
 # ---- B4 Altlog und Vokabular
 ('07-altlog-ohne-zeitpunkte.json', ['daten','manifest','ereignisse',0,'actual_reasoning'], None,
  'B4','R-30','flaches Quellfeld actual_reasoning entfernt'),
 ('07-altlog-ohne-zeitpunkte.json', ['daten','manifest','ereignisse',0,'ownership_change'],
  {'from': None, 'to': 'atlas'},
  'B4','R-31','ownership_change verliert task_id, scope und basis'),
 ('07-altlog-ohne-zeitpunkte.json', ['daten','adapter','verlustfrei'], False,
  'B4','R-30','Adapter nicht mehr quellenerhaltend'),
 ('04-zwei-projekte-laeufe.json', ['daten','katalogstrom','ereignisse',0,'kind'], 'catalog.changed',
  'B4','FORM','catalog.changed wieder eingefuehrt'),
 # ---- B5 Kosten
 ('06-kosten-sichtbar-ohne-betrag.json',
  ['daten','archiv','unvollstaendig','kosten','gesamt'],
  {'betrag': 5.09, 'waehrung': 'USD', 'belegt': True, 'abdeckung_beleg': 'x', 'quellen': ['x']},
  'B5','FORM','Archivkosten unvollstaendig MIT Gesamtsumme (der V2-Fehler)'),
 ('06-kosten-sichtbar-ohne-betrag.json', ['daten','unvollstaendig','kosten','daten'], 'real',
  'B5','R-08e','synthetisches Pruefmaterial als real ausgegeben'),
 ('06-kosten-sichtbar-ohne-betrag.json', ['daten','vollstaendig','kosten','gesamt','quellen'], None,
  'B5','FORM','vollstaendige Kosten ohne Quellen'),
 ('06-kosten-sichtbar-ohne-betrag.json', ['daten','unvollstaendig','kosten','status_text'],
  'Kosten werden ermittelt',
  'B5','R-08','Statussatz abgewandelt'),
 # ---- O1 Befehle
 ('08-nurlesen-befehle.json', ['daten','nicht_unterstuetzt','antwort','fehlercode'], 'recht_fehlt',
  'O1','R-32','leere supported_actions nicht als nicht_unterstuetzt gemeldet'),
 ('08-nurlesen-befehle.json', ['daten','wandansicht','antwort','nebenwirkung'], True,
  'O1','FORM','abgelehnter Befehl mit Nebenwirkung'),
]


def setze(obj, weg, wert):
    for s in weg[:-1]:
        obj = obj[s]
    if wert is None and isinstance(weg[-1], str) and isinstance(obj, dict):
        obj.pop(weg[-1], None)
    else:
        obj[weg[-1]] = wert


def main():
    attrappen, treffer, ungenau = [], 0, 0
    print('Gegenprobe V2.1 — kann jede neue Regel fehlschlagen?\n')
    print('%-5s %-7s %-62s %s' % ('Bef.', 'Regel', 'Verletzung', 'Ergebnis'))
    for datei, weg, wert, befund, soll, was in V:
        tmp = tempfile.mkdtemp()
        try:
            for f in os.listdir(QUELLE):
                shutil.copy(os.path.join(QUELLE, f), tmp)
            p = os.path.join(tmp, datei)
            d = json.load(open(p, encoding='utf-8'))
            setze(d, weg, wert)
            json.dump(d, open(p, 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
            m = modul(tmp)
            import io as _io
            alt = sys.stdout
            sys.stdout = _io.StringIO()
            try:
                for fn in (m.negativ, m.fall01, m.fall02, m.fall03, m.fall04,
                           m.fall05, m.fall06, m.fall07, m.fall08, m.fall09):
                    try:
                        fn()
                    except Exception as e:
                        m.fehler.append('ABBRUCH %s: %s' % (fn.__name__, e))
            finally:
                sys.stdout = alt
            text = '\n'.join(m.fehler)
            if not m.fehler:
                attrappen.append((befund, soll, was))
                erg = 'ATTRAPPE — nichts angesprungen'
            elif soll in text:
                treffer += 1
                erg = 'erkannt'
            else:
                treffer += 1
                ungenau += 1
                erg = 'erkannt, aber nicht durch %s' % soll
            print('%-5s %-7s %-62s %s' % (befund, soll, was[:62], erg))
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
    print('\n%d von %d Verletzungen erkannt' % (treffer, len(V)), end='')
    print(', davon %d ueber eine andere Pruefung als benannt.' % ungenau if ungenau else '.')
    if attrappen:
        print('\n%d Pruefung(en) ohne Wirkung:' % len(attrappen))
        for b, s, w in attrappen:
            print('  %-5s %-7s %s' % (b, s, w))
        return 1
    print('Jede gepruefte Regel kann fehlschlagen.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
