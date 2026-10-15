#!/usr/bin/env python3
"""Gegenprobe: kann der Pruefer ueberhaupt fehlschlagen?

Ein Pruefer, der beim ersten Lauf besteht, beweist nichts -- er koennte
nichts pruefen. Diese Gegenprobe verletzt jeden Abnahmefall absichtlich
und verlangt, dass die ZUGEHOERIGE Regel anspringt. Schlaegt eine
Verletzung NICHT an, ist die Regel eine Attrappe und der Lauf rot.

Aufruf:  python3 tests/AG-VISUAL-005-vertrag-v2-gegenprobe.py
"""
import copy, importlib.util, json, os, shutil, sys, tempfile

HIER = os.path.dirname(os.path.abspath(__file__))
PRUEFER = os.path.join(HIER, 'AG-VISUAL-005-vertrag-v2-pruefen.py')


def modul(beispiele):
    spec = importlib.util.spec_from_file_location('pruefer_%d' % id(beispiele), PRUEFER)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    m.BEISPIELE = beispiele
    m.fehler.clear()
    m.geprueft['form'] = 0
    m.geprueft['regeln'] = 0
    return m


# (Datei, Pfad im JSON, neuer Wert, erwartete Regel, Beschreibung)
VERLETZUNGEN = [
    ('01-einstieg-snapshot-live.json', ['daten', 'schnappschuss', 'cursor'], 999,
     'R-05', 'Cursor passt nicht zur ersten Folge'),
    ('01-einstieg-snapshot-live.json', ['daten', 'schnappschuss', 'lauf', 'ansicht'], 'archiv',
     'R-17', 'aktiver Lauf als Archiv etikettiert'),
    ('02-heartbeat-veraltet.json', ['daten', 'lebenszeichen', 0, 'stream_sequence'], 7,
     'R-03', 'Lebenszeichen mit Sequenzwirkung'),
    ('02-heartbeat-veraltet.json', ['daten', 'veraltet_nach_sekunden'], 60,
     'R-04', 'Veraltet-Grenze zu hoch: Abriss wird nicht erkannt'),
    ('03-reconnect-replaygrenze.json', ['daten', 'ausserhalb_puffer', 'antwort_status'], 200,
     'R-06b', 'Cursor unter der Replaygrenze stillschweigend bedient'),
    ('04-zwei-projekte-laeufe.json',
     ['daten', 'arbeitsstrom_AG_ALT_R2', 'zustellungen', 0, 'umschlag', 'stream_sequence'], 2,
     'R-02', 'Sequenzraeume vermischt'),
    ('04-zwei-projekte-laeufe.json', ['daten', 'laeufe_im_katalog', 0, 'ansicht'], 'live',
     'R-17', 'abgeschlossener Lauf als Live etikettiert'),
    ('05-parallel-artefakte-review.json', ['daten', 'ereignisse', 7, 'item_revision'], None,
     'R-11', 'Done ohne Revision'),
    ('05-parallel-artefakte-review.json', ['daten', 'ereignisse', 4, 'criteria_ref'], None,
     'R-12', 'Pruefung ohne Kriterienfassung'),
    ('05-parallel-artefakte-review.json', ['daten', 'abgeleitet', 'done_aufgaben'],
     ['AG-NEU-031', 'AG-NEU-032'],
     'R-11', 'Aufgabe ohne Statuswechsel als Done behauptet'),
    ('06-kosten-sichtbar-ohne-betrag.json', ['daten', 'unvollstaendig', 'kosten', 'gesamt'],
     {'betrag': 5.09, 'waehrung': 'USD', 'belegt': True},
     'R-08', 'Gesamtsumme trotz unvollstaendiger Erfassung'),
    ('06-kosten-sichtbar-ohne-betrag.json',
     ['daten', 'unvollstaendig', 'kosten', 'status_text'], 'Kosten werden noch ermittelt',
     'R-08', 'Statussatz abgewandelt'),
    ('06-kosten-sichtbar-ohne-betrag.json',
     ['daten', 'unvollstaendig', 'einzelnachweise', 1, 'verbrauch', 'input_tokens'], 0,
     'R-09b', 'unbelegter Verbrauch als 0 gerechnet'),
    ('07-altlog-ohne-zeitpunkte.json', ['daten', 'manifest', 'zeitachse'], 'complete',
     'R-10', 'fehlende Zeitpunkte als vollstaendige Zeitachse'),
    ('07-altlog-ohne-zeitpunkte.json', ['daten', 'darstellung', 'modus'], 'zeitfluss',
     'R-18', 'Zeitfluss trotz partieller Zeitachse'),
    ('08-nurlesen-befehle.json', ['daten', 'wandansicht', 'antwort', 'nebenwirkung'], True,
     'R-13', 'abgelehnter Befehl mit Nebenwirkung'),
    ('08-nurlesen-befehle.json', ['daten', 'wandansicht', 'rechte'], ['read', 'command'],
     'R-14', 'Wandansicht mit Befehlsrecht'),
    ('08-nurlesen-befehle.json', ['daten', 'wiederholung', 'antwort', 'fehlercode'], None,
     'R-15b', 'Wiederholung derselben command_id nicht abgewiesen'),
    ('09-archiv-zeitsprung.json',
     ['daten', 'wiedergabe', 'weg_b', 'zustand_danach', 'aufgaben_done'], 0,
     'R-16b', 'Zeitsprung ergibt anderen Zustand'),
    ('09-archiv-zeitsprung.json',
     ['daten', 'wiedergabe', 'nebenwirkungen_beobachtet', 'api_aufrufe'], 3,
     'R-16c', 'Wiedergabe mit API-Aufrufen'),
    ('09-archiv-zeitsprung.json', ['daten', 'manifest', 'wiedergabe', 'nebenwirkungsfrei'], False,
     'R-16', 'Wiedergabe nicht als nebenwirkungsfrei erklaert'),
]


def setze(obj, weg, wert):
    for s in weg[:-1]:
        obj = obj[s]
    if wert is None and isinstance(weg[-1], str) and isinstance(obj, dict):
        obj.pop(weg[-1], None)
    else:
        obj[weg[-1]] = wert


def main():
    quelle = os.path.join(os.path.dirname(HIER), 'fixtures', 'AG-VISUAL-005-beispiele-v2')
    attrappen, treffer = [], 0
    print('Gegenprobe — kann der Pruefer fehlschlagen?\n')
    for datei, weg, wert, soll, was in VERLETZUNGEN:
        tmp = tempfile.mkdtemp()
        try:
            for f in os.listdir(quelle):
                shutil.copy(os.path.join(quelle, f), tmp)
            p = os.path.join(tmp, datei)
            d = json.load(open(p, encoding='utf-8'))
            setze(d, weg, wert)
            json.dump(d, open(p, 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
            m = modul(tmp)
            for fn in (m.fall01, m.fall02, m.fall03, m.fall04, m.fall05,
                       m.fall06, m.fall07, m.fall08, m.fall09):
                try:
                    fn()
                except Exception as e:
                    m.fehler.append('ABBRUCH %s: %s' % (fn.__name__, e))
            text = '\n'.join(m.fehler)
            erkannt = bool(m.fehler)
            richtig = soll in text
            if erkannt and richtig:
                treffer += 1
                print('  erkannt  %-7s %s' % (soll, was))
            elif erkannt:
                treffer += 1
                print('  erkannt* %-7s %s  (angesprungen, aber nicht durch %s)'
                      % (soll, was, soll))
            else:
                attrappen.append((soll, was))
                print('  ATTRAPPE %-7s %s  -- nichts angesprungen!' % (soll, was))
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
    print('\n%d von %d Verletzungen erkannt.' % (treffer, len(VERLETZUNGEN)))
    if attrappen:
        print('\n%d Regel(n) ohne Wirkung:' % len(attrappen))
        for soll, was in attrappen:
            print('  %-7s %s' % (soll, was))
        return 1
    print('Jede gepruefte Regel kann fehlschlagen. Der Pruefer prueft.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
