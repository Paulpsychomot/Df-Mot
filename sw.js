// Service Worker DF-MOT : met en cache le code uniquement (jamais de donnees patient).
// Incrementer CACHE a chaque nouvelle version deployee.
const CACHE = 'dfmot-v3';
const SHELL = ['./', './df-mot.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(SHELL.map(function (u) { return c.add(u).catch(function () {}); }));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

// Reseau d'abord (pour recevoir les mises a jour), cache en secours hors ligne.
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(function (r) {
      if (r && (r.status === 200 || r.type === 'opaque')) {
        var cl = r.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, cl); });
      }
      return r;
    }).catch(function () {
      return caches.match(e.request).then(function (m) { return m || caches.match('./df-mot.html'); });
    })
  );
});
