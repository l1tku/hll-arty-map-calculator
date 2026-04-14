const CACHE_NAME = 'hll-arty-cache-v7';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/script.js',
  './js/maps.js',
  './js/ballistics.js',
  './fonts/Gotham.otf',
  './images/ui/artillery_position_v2.webp',
  './images/ui/garrison_lining_dot_2.png',
  './images/flags/us.webp',
  './images/flags/ger.webp',
  './images/flags/rus.webp',
  './images/flags/gb.webp'
];

// Install: Cache core assets + skip waiting for immediate activation
self.addEventListener('install', (e) => {
  self.skipWaiting(); // Activate new worker immediately
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate: Clean up old caches + claim clients immediately
self.addEventListener('activate', (e) => {
  self.clients.claim(); // Take control of all pages immediately
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
});

// Fetch: Network First -> Cache Fallback (for offline support)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        // Valid network response: cache it and return
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Network failed: try cache
        return caches.match(e.request);
      })
  );
});
