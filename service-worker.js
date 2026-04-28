/**
 * Service Worker Versioning Strategy:
 * 
 * SW_VERSION controls the cache name and forces clients to get fresh JS/CSS.
 * Bump this when you update JS/CSS files and want existing users to get the changes.
 * 
 * Format: "{app-version}-{build}" (e.g., "1.3.4-2")
 * - app-version: Matches your app version for reference
 * - build: Increment when you need to force cache refresh
 * 
 * Examples:
 * - App v1.3.4, first SW release: "1.3.4-1"
 * - Same app version, JS bugfix: "1.3.4-2"  <-- bump build number
 * - App v1.3.5 released: "1.3.5-1"
 */
const SW_VERSION = "1.3.4-3";  // Change this to force cache refresh
const CACHE_NAME = `hll-arty-cache-v${SW_VERSION}`;
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
  // Add all map files here to ensure they are cached
  "./images/maps/map_carentan.webp",
  // Add other maps similarly...
];

// Install: Cache core assets + skip waiting for immediate activation
console.log(`[SW] Installing service worker v${SW_VERSION}`);

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log(`[SW] Caching assets for v${SW_VERSION}`);
      // Cache assets individually to handle partial failures gracefully
      const results = await Promise.allSettled(
        ASSETS_TO_CACHE.map((url) =>
          fetch(url, { cache: "no-store" })
            .then((response) => {
              if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
              return cache.put(url, response);
            })
            .catch((err) => {
              console.warn(`[SW] Failed to cache: ${url}`, err.message);
              return null;
            })
        )
      );
      const cached = results.filter((r) => r.status === "fulfilled" && r.value !== null).length;
      console.log(`[SW] Cached ${cached}/${ASSETS_TO_CACHE.length} assets`);
    }),
  );
});

// Activate: Clean up old caches + claim clients immediately
self.addEventListener("activate", (e) => {
  self.clients.claim();
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

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  e.respondWith(
    (async () => {
      try {
        const url = new URL(e.request.url);
        
        // Strip cache-busting query parameters for cache matching
        const cacheKey = new URL(url);
        cacheKey.search = ""; // Remove all query params
        
        // Try cache first with stripped URL
        let cachedResponse = await caches.match(cacheKey.toString(), { ignoreSearch: true });
        
        // If not found, try matching by URL path only (ignoring domain/encoding)
        if (!cachedResponse) {
          const path = url.pathname;
          const cache = await caches.open(CACHE_NAME);
          const keys = await cache.keys();
          for (const request of keys) {
            const cachedUrl = new URL(request.url);
            const cachedPath = cachedUrl.pathname;
            if (cachedPath === path || cachedPath.includes(path) || path.includes(cachedPath)) {
              cachedResponse = await cache.match(request);
              break;
            }
          }
        }

        if (cachedResponse) {
          // For map images with cache-busting (?t=), skip cache and go to network
          if (url.searchParams.has('t')) {
            const networkResponse = await fetch(e.request);
            if (networkResponse.ok) {
              const cache = await caches.open(CACHE_NAME);
              await cache.put(cacheKey.toString(), networkResponse.clone());
            }
            return networkResponse;
          }
          
          // Stale-while-revalidate: update cache in background
          fetch(e.request)
            .then((networkResponse) => {
              if (networkResponse.ok) {
                caches.open(CACHE_NAME).then((cache) => cache.put(cacheKey.toString(), networkResponse));
              }
            })
            .catch(() => {}); // Silent fail for background update
          return cachedResponse;
        }

        // No cache - try network
        const networkResponse = await fetch(e.request);
        if (networkResponse.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(cacheKey.toString(), networkResponse.clone());
        }
        return networkResponse;
      } catch (err) {
        console.error(`[SW] Fetch error for ${e.request.url}:`, err.message);
        // Always return a valid Response, never throw
        return new Response(null, { status: 404, statusText: "Not Found" });
      }
    })()
  );
});