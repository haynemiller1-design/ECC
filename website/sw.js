/* PromptForge service worker — offline cache of the app shell.
 * Cache-first for our own files; never touches user data (there are no
 * network calls for prompts — everything lives in localStorage). */
var CACHE = 'promptforge-v1';
var ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './css/promptforge.css',
  './js/config.js',
  './js/pricing.js',
  './js/workbench.js',
  './js/promptforge.js',
  './manifest.webmanifest'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () {
    return self.skipWaiting();
  }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      return hit || fetch(e.request).then(function (resp) {
        // runtime-cache same-origin GETs so subsequent loads work offline
        if (resp.ok && e.request.url.indexOf(self.location.origin) === 0) {
          var copy = resp.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return resp;
      }).catch(function () { return caches.match('./index.html'); });
    })
  );
});
