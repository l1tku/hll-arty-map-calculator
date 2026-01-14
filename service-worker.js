const CACHE_NAME = 'hll-arty-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/script.js',
  './fonts/Gotham.otf',
  './images/ui/artillery_position.webp',
  './images/ui/garrison_lining_dot_2.png',
  './images/flags/us.webp',
  './images/flags/ger.webp',
  './images/flags/rus.webp',
  './images/flags/gb.webp'
];

// Install: Cache core assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', (e) => {
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

// Fetch: Serve from cache, fallback to network
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
