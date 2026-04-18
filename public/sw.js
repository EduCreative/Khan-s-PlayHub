
const CACHE_NAME = 'khans-playhub-v3.0.3';

// Core assets to cache
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          // Delete ALL caches that are not the current one
          if (name !== CACHE_NAME) {
            console.log('SW: Deleting old cache', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => {
      console.log('SW: Activated and claimed clients');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Don't cache version.json or any API calls
  if (event.request.url.includes('version.json') || event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Fallback for offline if needed
      });
    })
  );
});
