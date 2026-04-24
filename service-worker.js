const CACHE_NAME = 'hll-arty-cache-v14';
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

// Fetch: Disable interception - let all requests pass through network
// This prevents service worker errors with GitHub Pages
self.addEventListener('fetch', (e) => {
  // Do nothing - let browser handle all requests normally
  return;
});
