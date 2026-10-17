# -*- coding: utf-8 -*-
"""AG-GH-LIVE-001: Das Original reproduzierbar bauen -- Quelle -> Buendel.

   python3 bauen.py AUSGABE --stueck V1.json --stueck V2.json --gebaut 2026-10-17T12:00Z
   python3 bauen.py AUSGABE --stuecke-aus ../../feld/index.html --gebaut 2026-10-17T12:00Z

   Die Stuecke kommen in GENAU der angegebenen Reihenfolge auf die Buehne
   (Original: NACHTPOST V1, dann NACHTPOST V2). `--stuecke-aus` liest sie
   unveraendert aus einer schon gebauten Seite (z.B. der Fassung 47 auf
   main) -- dann ist Gleichheit mit dem Original kein Versprechen, sondern
   Abschrift. `--vergleich` prueft zusaetzlich, dass die eingebetteten
   Stuecke mit einer gebauten Seite uebereinstimmen.

   Reproduzierbar: gleicher Quellstand + gleiche Stuecke + gleiches
   --gebaut (oder SOURCE_DATE_EPOCH) -> Byte fuer Byte dieselbe Ausgabe.
   Ohne beides gilt die Uhr, und das wird gemeldet.

   Unveraendert mitgenommen: one-event.json (--one-event > im Ziel schon
   vorhanden > neben dieser Datei) und github-live.js aus der Quelle.
   Nichts wird nach aussen geholt; es entsteht nur der Ordner AUSGABE.
"""
import argparse, datetime, io, json, os, re, sys, tempfile

HIER = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HIER)
import schicht   # noqa: E402
import pages     # noqa: E402

ADAPTER = 'AG-GH-LIVE-001-v1'


def stuecke_aus(pfad):
  s = io.open(pfad, encoding='utf-8').read()
  m = re.search(r'^\s*var STUECKE = (\[.*\]);\s*$', s, re.M)
  if not m:
    raise SystemExit('Keine Zeile "var STUECKE = [...]" in ' + pfad)
  return json.loads(m.group(1))


def gebaut_wert(arg):
  if arg:
    if not re.match(r'^\d{4}-\d\d-\d\dT\d\d:\d\dZ$', arg):
      raise SystemExit('--gebaut muss JJJJ-MM-TTTHH:MMZ sein, nicht ' + arg)
    return arg, True
  sde = os.environ.get('SOURCE_DATE_EPOCH')
  if sde:
    t = datetime.datetime.fromtimestamp(int(sde), datetime.timezone.utc)
    return t.strftime('%Y-%m-%dT%H:%MZ'), True
  return None, False


def main(argv=None):
  ap = argparse.ArgumentParser(description='Agentarium-Original bauen (AG-GH-LIVE-001)')
  ap.add_argument('ausgabe', help='Zielordner (wird neu angelegt)')
  ap.add_argument('--stueck', action='append', default=[],
                  help='Stueck-JSON, wiederholbar, Reihenfolge = Buehnenreihenfolge')
  ap.add_argument('--stuecke-aus', help='Stuecke aus gebauter Seite uebernehmen')
  ap.add_argument('--vergleich', help='gebaute Seite, deren Stuecke gleich sein muessen')
  ap.add_argument('--gebaut', help='Bauzeitpunkt JJJJ-MM-TTTHH:MMZ (reproduzierbar)')
  ap.add_argument('--icons', default=HIER, help='Ordner mit icon-*.png (Vorgabe: Quelle)')
  ap.add_argument('--one-event', help='one-event.json, unveraendert mitzunehmen')
  a = ap.parse_args(argv)

  if bool(a.stueck) == bool(a.stuecke_aus):
    raise SystemExit('Genau eines angeben: --stueck (mehrfach) ODER --stuecke-aus')
  if a.stueck:
    stuecke = [json.load(io.open(p, encoding='utf-8')) for p in a.stueck]
  else:
    stuecke = stuecke_aus(a.stuecke_aus)
  if not isinstance(stuecke, list) or not stuecke or \
     not all(isinstance(x, dict) and isinstance(x.get('ereignisse'), list) for x in stuecke):
    raise SystemExit('Stuecke unbrauchbar: erwartet Liste von Objekten mit "ereignisse"')
  if a.vergleich:
    soll = stuecke_aus(a.vergleich)
    if soll != stuecke:
      raise SystemExit('Stuecke weichen von %s ab' % a.vergleich)
    print('Stuecke gleich wie in %s' % a.vergleich)

  gebaut, fest = gebaut_wert(a.gebaut)
  if not fest:
    print('WARNUNG: weder --gebaut noch SOURCE_DATE_EPOCH -- Bauzeit aus der Uhr, '
          'Ausgabe nicht reproduzierbar.')

  quelle = os.path.join(HIER, 'resonanz-maschine.html')
  fd, fertig = tempfile.mkstemp(suffix='-agentarium-fertig.html')
  os.close(fd)
  try:
    schicht.bauen(quelle, fertig, stuecke, gebaut=gebaut)
    fassung = pages.buendel(a.ausgabe, fertig=fertig, icons=a.icons,
                            one_event=a.one_event)
  finally:
    os.remove(fertig)

  index = io.open(os.path.join(a.ausgabe, 'index.html'), encoding='utf-8').read()
  nachher = stuecke_aus(os.path.join(a.ausgabe, 'index.html'))
  assert nachher == stuecke, 'eingebettete Stuecke weichen ab'
  assert "github-live.js?v=' + FASSUNG" in index, 'Adapter-Lader fehlt'
  print('Gebaut: Fassung %s, %d Stuecke (%s), Adapter %s, gebaut %s' % (
    fassung, len(stuecke),
    ' | '.join(str(x.get('projekt') or x.get('titel') or '?') for x in stuecke),
    ADAPTER, gebaut or 'Uhr'))


if __name__ == '__main__':
  main()
