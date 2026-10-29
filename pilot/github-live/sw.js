/* Der Arbeiter. Fassung 91.

   Zwei Dinge sind hier mit Absicht so und nicht anders:

   1. Beim Aufraeumen werden NUR eigene aeltere Vorraete geloescht. Der
      Arbeiter von Malstudio loeschte seinerzeit JEDEN fremden Vorrat --
      auf derselben Adresse haette das die Bilder der Kinder mitgenommen.

      AG-SW-CACHE-001 (28.10.): "Eigen" hiess bis Fassung 89 "faengt mit
      agentarium-v an". Das war zu weit: `feld/` und `pilot/github-live/`
      liegen auf DERSELBEN Herkunft und teilen sich den Vorratsspeicher.
      Jede der beiden loeschte beim Aktivieren den aktuellen Vorrat der
      anderen. Jetzt hat jede Variante ihren eigenen Namensraum
      (`agentarium-pilot-v`), und nur der wird aufgeraeumt.

   2. Geholt wird mit `cache: 'reload'`. GitHub Pages liefert mit
      `Cache-Control: max-age=600`; ohne das bekaeme der Arbeiter zehn
      Minuten lang die alte Datei aus dem HTTP-Vorrat des Browsers.

   Die Seite wird aus dem Vorrat bedient und im Hintergrund erneuert. Ein
   Neuladen mitten im Lauf gibt es nicht: Was gerade zu sehen ist, soll
   zu Ende laufen duerfen.
*/
const EIGEN = 'agentarium-pilot-v';
const VORRAT = EIGEN + '92';
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
    const raum = self.registration.scope;
    await Promise.all(k.map(async n => {
      if (n === VORRAT) return;
      if (n.startsWith(EIGEN)) return caches.delete(n);
      /* DIE ALTEN GEMEINSAMEN NAMEN (`agentarium-vNN`, bis Fassung 89).
         Am Namen ist nicht zu erkennen, wem sie gehoeren. Am Inhalt schon:
         Ein Eintrag ist eine Adresse, und die liegt im Geltungsbereich
         genau einer Variante. Geloescht wird nur, was VOLLSTAENDIG im
         eigenen Bereich liegt. Leer oder gemischt bleibt er stehen -- ein
         liegengebliebener Vorrat kostet Platz, ein falsch geloeschter
         kostet die geladene Fassung der anderen Variante. */
      if (/^agentarium-v\d+$/.test(n)) {
        const r = await (await caches.open(n)).keys();
        if (r.length && r.every(q => q.url.startsWith(raum))) return caches.delete(n);
      }
    }));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.origin !== self.location.origin) return;
  /* AG-PROJEKTE-002: Das Projektverzeichnis geht immer ans Netz. Aus dem
     Vorrat bedient, erschiene ein neues Projekt erst beim uebernaechsten
     Oeffnen -- und ein entferntes stuende weiter da. */
  if (u.pathname.endsWith('/projekte/verzeichnis.json')) return;
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
