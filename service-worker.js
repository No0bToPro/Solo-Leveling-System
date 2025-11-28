const STATIC_CACHE = 'solo-v1-static'
const RUNTIME_CACHE = 'solo-v1-runtime'

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  // Clean up old caches
  const currentCaches = [STATIC_CACHE, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then(names => Promise.all(
      names.map(n => currentCaches.includes(n) ? null : caches.delete(n))
    ))
  );
  self.clients.claim();
});

// Serve cached assets and handle offline fallback
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Don't try to cache analytics or external auth flows
  if (url.origin !== location.origin) {
    return;
  }

  // For navigation requests, try network then cache, fallback to offline page
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/offline.html'))
    );
    return;
  }

  // For other requests, use cache-first then network update
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return caches.open(RUNTIME_CACHE).then(cache =>
        fetch(event.request).then(response => {
          // Avoid storing opaque responses and error responses
          if (!response || response.status !== 200 || response.type === 'opaque') return response;
          cache.put(event.request, response.clone());
          return response;
        }).catch(err => {
          return cached || caches.match('/offline.html');
        })
      );
    })
  );
});

self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
