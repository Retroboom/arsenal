// Arsenal service worker: offline app shell plus runtime caching.
// VERSION is stamped by deploy.sh on every deploy so the cache busts cleanly.
const VERSION = '__BUILD_VERSION__';
const CACHE = 'arsenal-' + VERSION;

// Everything needed to cold-boot the app with no network.
const SHELL = [
  '/',
  '/index.html',
  '/hof_arsenal.json',
  '/manifest.webmanifest',
  '/rb.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/vendor/firebase-app-compat.js',
  '/vendor/firebase-auth-compat.js',
  '/vendor/firebase-database-compat.js',
  '/vendor/marked.min.js',
  '/vendor/Sortable.min.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function staleWhileRevalidate(req) {
  return caches.open(CACHE).then(cache =>
    cache.match(req).then(cached => {
      const network = fetch(req).then(resp => {
        if (resp && resp.ok) cache.put(req, resp.clone());
        return resp;
      }).catch(() => cached);
      return cached || network;
    })
  );
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Google Fonts: cache the stylesheet and font files for offline use,
  // refreshing in the background when online.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(staleWhileRevalidate(req));
    return;
  }

  // Other cross-origin requests (Firebase RTDB and Auth): always live, never intercept.
  if (url.origin !== self.location.origin) return;

  // Page loads: network-first so a fresh deploy lands immediately; fall back to
  // the cached shell when offline.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('/index.html')));
    return;
  }

  // Same-origin assets: serve from cache, fall back to network, and cache new
  // misses (the guide and its images) the first time they are requested.
  e.respondWith(
    caches.match(req).then(cached =>
      cached || fetch(req).then(resp => {
        if (resp && resp.ok && resp.type === 'basic') {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return resp;
      }).catch(() => cached)
    )
  );
});
