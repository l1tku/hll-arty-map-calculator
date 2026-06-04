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
const SW_VERSION = "1.3.5-5";  // Change this to force cache refresh
const CACHE_NAME = `hll-arty-cache-v${SW_VERSION}`;

// Detect base path for GitHub Pages subdirectory support
const BASE_PATH = self.location.pathname.replace(/\/service-worker\.js$/, "") || "";
const normalizePath = (path) => {
  // Remove leading ./ and ensure proper base path
  let cleanPath = path.replace(/^\.\//, "");
  if (BASE_PATH && !cleanPath.startsWith(BASE_PATH)) {
    // If path doesn't already include base path, add it
    cleanPath = BASE_PATH + "/" + cleanPath;
  }
  return cleanPath.replace(/\/+/g, "/");
};

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
  // Core map files
  "./images/maps/map_carentan.webp",
  "./images/maps/thumbnail/CAR.webp",
];

// Install: Cache core assets + skip waiting for immediate activation
console.log(`[SW] Installing service worker v${SW_VERSION}`);

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log(`[SW] Caching assets for v${SW_VERSION}`);
      // Cache assets individually to handle partial failures gracefully
      return Promise.all(
        ASSETS_TO_CACHE.map((url) => {
          // Convert relative URL to absolute for consistent cache keys
          const absoluteUrl = new URL(url, self.location.href).toString();
          return fetch(url, { cache: "no-store" })
            .then((response) => {
              if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
              return cache.put(absoluteUrl, response);
            })
            .catch((err) => {
              console.warn(`[SW] Failed to cache: ${url}`, err.message);
              // Don't let one failure stop the install
              return null;
            });
        })
      ).then((results) => {
        const cached = results.filter((r) => r !== null).length;
        console.log(`[SW] Cached ${cached}/${ASSETS_TO_CACHE.length} assets`);
      });
    }).catch((err) => {
      console.error('[SW] Install failed:', err);
      // Don't fail install - continue with empty cache
    })
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

  // Always start with the network request immediately
  const networkFetch = fetch(e.request);

  // Set up caching in the background (don't await, don't block)
  networkFetch.then((response) => {
    if (!response.ok) return;

    try {
      const url = new URL(e.request.url);
      const cacheKey = url.origin + url.pathname;

      caches.open(CACHE_NAME).then((cache) => {
        cache.put(cacheKey, response.clone());
      }).catch(() => {});
    } catch (err) {}
  }).catch(() => {});

  // Return the network response immediately with fallback
  e.respondWith(
    networkFetch.catch((err) => {
      console.error('[SW] Network fetch failed:', err);
      return new Response(null, { status: 404, statusText: "Not Found" });
    })
  );
});
