const CACHE_NAME = 'hll-arty-cache-v10';
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

// Fetch: Only cache specific assets, pass everything else through
self.addEventListener('fetch', (e) => {
  // Only handle GET requests
  if (e.request.method !== 'GET') {
    return;
  }

  // Check if this is a URL we want to cache
  const url = new URL(e.request.url);
  const shouldCache = ASSETS_TO_CACHE.some(asset => {
    try {
      const assetUrl = new URL(asset, self.location.href);
      return url.pathname === assetUrl.pathname;
    } catch {
      return false;
    }
  });

  if (!shouldCache) {
    // Pass through to network for non-cached assets
    return;
  }

  // For cached assets: Cache First -> Network Fallback
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});
