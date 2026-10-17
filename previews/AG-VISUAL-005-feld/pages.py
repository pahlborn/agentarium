# -*- coding: utf-8 -*-
"""Aus der fertigen Seite das Buendel fuer GitHub Pages machen.

   Die gebaute Datei bleibt Zeichen fuer Zeichen dieselbe; dazu kommen nur
   die Kopfzeilen, die ein iPad braucht, um daraus eine App zu machen, und
   die Anmeldung des Arbeiters. Das Artefakt bekommt davon NICHTS -- dort
   gibt es keinen Arbeiter und kein Manifest, und beides einzubauen waere
   ein Abruf nach aussen, den es dort nicht geben darf.
"""
import io, os, re, shutil, sys

HIER = os.path.dirname(os.path.abspath(__file__))


def buendel(ZIEL, fertig='agentarium-fertig.html', icons='.', one_event=None,
            github_live=None):
  """AG-GH-LIVE-001: als Funktion aufrufbar (bauen.py). Zwei Dateien werden
     unveraendert mitgenommen:
       one-event.json  ausdruecklich angegeben > im Ziel schon vorhanden >
                       neben dieser Datei. Fehlt sie, meldet ?mvp=1 404.
       github-live.js  aus der Quelle neben dieser Datei (Pflicht)."""
  s = io.open(fertig, encoding='utf-8').read()

  m = re.search(r"var FASSUNG = '(\d+)'", s)
  assert m, 'Fassungsnummer nicht gefunden'
  FASSUNG = m.group(1)
  CACHE = 'agentarium-v' + FASSUNG

  ziel_abs = os.path.abspath(ZIEL)
  assert ziel_abs not in ('/', HIER, os.path.dirname(HIER)), 'Ziel unzulaessig: ' + ziel_abs

  # one-event.json VOR dem Leeren sichern -- Byte fuer Byte.
  ereignis = None
  kandidaten = [one_event] if one_event else [os.path.join(ZIEL, 'one-event.json'),
                                              os.path.join(HIER, 'one-event.json')]
  for k in kandidaten:
    if k and os.path.isfile(k):
      ereignis = io.open(k, 'rb').read()
      break
  if one_event and ereignis is None:
    raise SystemExit('one-event.json nicht gefunden: ' + one_event)

  gl = github_live or os.path.join(HIER, 'github-live.js')
  adapter = io.open(gl, 'rb').read()
  assert b'AG-GH-LIVE-001-v1' in adapter, 'github-live.js ohne Adapterversion'

  os.path.isdir(ZIEL) and shutil.rmtree(ZIEL)
  os.makedirs(ZIEL)
  _schreiben(ZIEL, s, FASSUNG, CACHE, icons)
  io.open(os.path.join(ZIEL, 'github-live.js'), 'wb').write(adapter)
  if ereignis is not None:
    io.open(os.path.join(ZIEL, 'one-event.json'), 'wb').write(ereignis)
  else:
    print('Hinweis: kein one-event.json mitgenommen (?mvp=1 meldet dann HTTP 404).')

  print('Buendel %s: Fassung %s, Vorrat %s' % (ZIEL, FASSUNG, CACHE))
  for f in sorted(os.listdir(ZIEL)):
    print('  %-24s %7d' % (f, os.path.getsize(os.path.join(ZIEL, f))))
  return FASSUNG


kopf = (
 '<link rel="manifest" href="manifest.webmanifest">\n'
 '<link rel="apple-touch-icon" sizes="180x180" href="icon-180.png">\n'
 '<link rel="apple-touch-icon" sizes="152x152" href="icon-152.png">\n'
 '<link rel="apple-touch-icon" sizes="120x120" href="icon-120.png">\n'
 '<link rel="icon" type="image/png" sizes="192x192" href="icon-192.png">\n')

# Die Anmeldung steht GANZ UNTEN und stoert nichts, wenn sie fehlschlaegt.
# `updateViaCache: 'none'` ist die Lehre aus dem Mandala-Atelier: Sonst
# bekommt der Arbeiter seine eigene Datei zehn Minuten lang aus dem
# HTTP-Vorrat des Browsers zurueck und erneuert sich nie.
anmeldung = """<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
      .catch(function () { /* ohne Arbeiter laeuft es online weiter */ });
  });
}
</script>
"""

manifest = """{
  "name": "Agentarium",
  "short_name": "Agentarium",
  "description": "See intelligence move.",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#05070C",
  "theme_color": "#05070C",
  "lang": "de",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png",
      "purpose": "maskable" }
  ]
}
"""

SW_VORLAGE = """/* Der Arbeiter. Fassung %(F)s.

   Zwei Dinge sind hier mit Absicht so und nicht anders:

   1. Beim Aufraeumen werden NUR eigene aeltere Vorraete geloescht, die
      mit "agentarium-v" anfangen. Der Arbeiter von Malstudio loeschte
      seinerzeit JEDEN fremden Vorrat -- auf derselben Adresse haette das
      die Bilder der Kinder mitgenommen. Hier liegt zwar nichts anderes,
      aber die Regel kostet nichts und die Ausnahme kostet alles.

   2. Geholt wird mit `cache: 'reload'`. GitHub Pages liefert mit
      `Cache-Control: max-age=600`; ohne das bekaeme der Arbeiter zehn
      Minuten lang die alte Datei aus dem HTTP-Vorrat des Browsers.

   Die Seite wird aus dem Vorrat bedient und im Hintergrund erneuert. Ein
   Neuladen mitten im Lauf gibt es nicht: Was gerade zu sehen ist, soll
   zu Ende laufen duerfen.
*/
const VORRAT = '%(C)s';
const STUECKE = ['./', 'index.html', 'manifest.webmanifest', 'github-live.js',
                 'icon-120.png', 'icon-152.png', 'icon-180.png',
                 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const v = await caches.open(VORRAT);
    await Promise.all(STUECKE.map(async p => {
      try { await v.put(p, await fetch(p, { cache: 'reload' })); } catch (x) {}
    }));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const k = await caches.keys();
    await Promise.all(k.filter(n => n.startsWith('agentarium-v') && n !== VORRAT)
                       .map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.origin !== self.location.origin) return;
  e.respondWith((async () => {
    const v = await caches.open(VORRAT);
    const da = await v.match(e.request, { ignoreSearch: true });
    const holen = fetch(e.request, { cache: 'reload' }).then(a => {
      if (a && a.ok) v.put(e.request, a.clone());
      return a;
    }).catch(() => null);
    return da || (await holen) || new Response('', { status: 504 });
  })());
});
"""


def _schreiben(ZIEL, s, FASSUNG, CACHE, icons):
  assert '</head>' in s
  s = s.replace('</head>', kopf + '</head>', 1)
  assert '</body>' in s
  s = s.replace('</body>', anmeldung + '</body>', 1)
  io.open(os.path.join(ZIEL, 'index.html'), 'w', encoding='utf-8', newline='\n').write(s)
  io.open(os.path.join(ZIEL, 'manifest.webmanifest'), 'w', encoding='utf-8',
          newline='\n').write(manifest)
  sw = SW_VORLAGE % {'F': FASSUNG, 'C': CACHE}
  io.open(os.path.join(ZIEL, 'sw.js'), 'w', encoding='utf-8', newline='\n').write(sw)
  for n in (120, 152, 180, 192, 512):
    shutil.copy(os.path.join(icons, 'icon-%d.png' % n), os.path.join(ZIEL, 'icon-%d.png' % n))


if __name__ == '__main__':
  # Unveraenderter Aufruf: python3 pages.py ZIEL  (im Quellordner, mit
  # agentarium-fertig.html und den Icons im aktuellen Verzeichnis).
  buendel(sys.argv[1] if len(sys.argv) > 1 else 'pages')
