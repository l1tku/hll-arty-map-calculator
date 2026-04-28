const CACHE_NAME = "hll-arty-cache-v1.3.2";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/script.js",
  "./js/maps.js",
  "./js/ballistics.js",
  "./fonts/Gotham.otf",
  "./images/ui/artillery_position_v2.webp",
  "./images/ui/garrison_lining_dot_2.png",
  "./images/flags/us.webp",
  "./images/flags/ger.webp",
  "./images/flags/rus.webp",
  "./images/flags/gb.webp",
];

// Install: Cache core assets + skip waiting for immediate activation
self.addEventListener("install", (e) => {
  self.skipWaiting(); // Activate new worker immediately
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }),
  );
});

// Activate: Clean up old caches + claim clients immediately
self.addEventListener("activate", (e) => {
  self.clients.claim(); // Take control of all pages immediately
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        }),
      );
    }),
  );
});

// Fetch: Stale-while-revalidate strategy for cached assets.
//
// How it works:
//   1. If the request is in the cache, serve it IMMEDIATELY (fast / offline).
//   2. Simultaneously fetch a fresh copy from the network in the background
//      and update the cache so the next load gets the latest version.
//   3. If there is no cache entry (first visit / uncached asset),
//      go straight to the network.
//   4. Only GET requests are intercepted; POST/PUT/etc pass through unchanged.
//
// This replaces the previous no-op handler that cached assets on install
// but never served them, making offline use impossible.
self.addEventListener("fetch", (e) => {
  // Only handle GET requests — mutations must always reach the server
  if (e.request.method !== "GET") return;

  // Only intercept same-origin or explicitly listed requests.
  // Cross-origin requests (CDNs, analytics, etc.) pass through untouched.
  const url = new URL(e.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  if (!isSameOrigin) return;

  e.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(e.request).then((cached) => {
        // Always kick off a background network fetch to refresh the cache
        const networkFetch = fetch(e.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              cache.put(e.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => {
            // Network failed — if we have a cached copy it was already returned;
            // if not, there is nothing we can do (caller gets a network error).
          });

        // Return the cached version immediately if available,
        // otherwise wait for the network response.
        return cached || networkFetch;
      });
    }),
  );
});
