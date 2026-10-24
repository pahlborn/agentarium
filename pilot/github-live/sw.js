/* Der Arbeiter. Fassung 51.

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
const VORRAT = 'agentarium-v77';
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
