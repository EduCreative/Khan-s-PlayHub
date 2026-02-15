
const CACHE_NAME = 'khans-playhub-v1.1.2';

// Core local assets - using absolute paths relative to origin for clarity
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/constants.tsx',
  '/manifest.json',
  '/components/Hub.tsx',
  '/components/GameCard.tsx',
  '/components/GameRunner.tsx',
  '/components/Logo.tsx',
  '/components/ParticleBackground.tsx',
  '/games/FruitVortex.tsx',
  '/games/NumberNinja.tsx',
  '/games/SumSurge.tsx',
  '/games/RiddleRift.tsx',
  '/games/BlitzRunner.tsx',
  '/games/BubbleFury.tsx',
  '/games/MemoryMatrix.tsx',
  '/games/Labyrinth.tsx',
  '/games/ColorClash.tsx',
  '/games/WordBuilder.tsx'
];

// External assets to pre-cache
const EXTERNAL_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800;900&family=Bungee&display=swap',
  'https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-no-swears.txt'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Pre-caching assets...');
      // Use Promise.allSettled to ensure that one failing asset doesn't break the whole install
      return Promise.allSettled([...STATIC_ASSETS, ...EXTERNAL_ASSETS].map(url => {
        return cache.add(url).catch(err => console.warn(`Failed to cache: ${url}`, err));
      }));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Only cache successful GET requests
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch((err) => {
        console.debug('Fetch failed, serving from cache if available', err);
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});
