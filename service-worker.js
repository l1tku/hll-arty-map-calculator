const CACHE_NAME = "hll-arty-cache-v1.3.3";
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
//      ignoreSearch: true means ?v=1.3.3 cache-busters match the bare cached URL,
//      so versioned CSS/JS is served from cache on first load without any cold-cache gap.
//   2. Simultaneously fetch a fresh copy from the network in the background
//      and update the cache (keyed by the full versioned URL) so the next load
//      gets the latest file.
//   3. If there is no cache entry (first visit / uncached asset), wait for the
//      network. Errors propagate naturally so the browser shows a real failure
//      instead of a silent undefined response (which caused "Style sheet could
//      not be loaded" in Firefox when the network lost a race).
//   4. Only GET requests are intercepted; POST/PUT/etc pass through unchanged.
self.addEventListener("fetch", (e) => {
  // Only handle GET requests — mutations must always reach the server
  if (e.request.method !== "GET") return;

  // Only intercept same-origin requests.
  // Cross-origin requests (CDNs, analytics, etc.) pass through untouched.
  const url = new URL(e.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  if (!isSameOrigin) return;

  e.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      // ignoreSearch: true — ?v=1.3.x query strings are ignored when matching,
      // so a cached ./css/style.css satisfies a request for ./css/style.css?v=1.3.3.
      return cache.match(e.request, { ignoreSearch: true }).then((cached) => {
        // Always kick off a background network fetch to refresh the cache.
        const networkFetch = fetch(e.request).then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            // Store under the full versioned URL so future exact matches also hit cache.
            cache.put(e.request, networkResponse.clone());
          }
          return networkResponse;
        });

        if (cached) {
          // Stale-while-revalidate: return the cached copy immediately and let
          // the network update run in the background. Swallow background errors
          // (offline / flaky network) — the cached copy was already returned.
          networkFetch.catch(() => {});
          return cached;
        }

        // No cache entry — must wait for the network.
        // Do NOT swallow errors here: if the fetch fails the Promise rejects,
        // which is correct behaviour (browser shows a proper network error
        // rather than receiving an undefined response).
        return networkFetch;
      });
    }),
  );
});
