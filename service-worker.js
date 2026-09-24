const SW_VERSION = "1.4.3-2";
const CACHE_NAME = `hll-arty-cache-v${SW_VERSION}`;

const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./js/script.js",
  "./js/maps.js",
  "./js/ballistics.js",
  "./fonts/Gotham.otf",
  "./fonts/Roboto-Black.ttf",
  "./fonts/SpecialElite.ttf",
  "./images/favicon.webp",
  "./images/favicon.png",
  "./images/icon-180.png",
  "./images/icon-192.png",
  "./images/icon-512.png",
  "./images/ui/artillery_position_enemy.webp",
  "./images/ui/artillery_position_v2.webp",
  "./images/ui/artillery_position_v2_white.webp",
  "./images/ui/garrison_lining_dot_2.png",
  "./images/flags/can.webp",
  "./images/flags/us.webp",
  "./images/flags/ger.webp",
  "./images/flags/rus.webp",
  "./images/flags/gb.webp",
  "./images/maps/map_carentan.webp",
  "./images/maps/map_driel.webp",
  "./images/maps/map_elalamein.webp",
  "./images/maps/map_elsenborn.webp",
  "./images/maps/map_foy.webp",
  "./images/maps/map_hill400.webp",
  "./images/maps/map_hurtgen.webp",
  "./images/maps/map_juno_beach.webp",
  "./images/maps/map_kharkov.webp",
  "./images/maps/map_kursk.webp",
  "./images/maps/map_mortain.webp",
  "./images/maps/map_omaha.webp",
  "./images/maps/map_purpleheartlane.webp",
  "./images/maps/map_remagen.webp",
  "./images/maps/map_smdmv2.webp",
  "./images/maps/map_smolensk.webp",
  "./images/maps/map_stalingrad.webp",
  "./images/maps/map_stmereeglise.webp",
  "./images/maps/map_tobruk.webp",
  "./images/maps/map_utahbeach.webp",
  "./images/maps/thumbnail/CAR.webp",
  "./images/maps/thumbnail/DRI.webp",
  "./images/maps/thumbnail/EBR.webp",
  "./images/maps/thumbnail/ELA.webp",
  "./images/maps/thumbnail/FOY.webp",
  "./images/maps/thumbnail/H4.webp",
  "./images/maps/thumbnail/HUR.webp",
  "./images/maps/thumbnail/JUN.webp",
  "./images/maps/thumbnail/KHA.webp",
  "./images/maps/thumbnail/KUR.webp",
  "./images/maps/thumbnail/MOR.webp",
  "./images/maps/thumbnail/OMA.webp",
  "./images/maps/thumbnail/PHL.webp",
  "./images/maps/thumbnail/REM.webp",
  "./images/maps/thumbnail/SME.webp",
  "./images/maps/thumbnail/SMM.webp",
  "./images/maps/thumbnail/SMO.webp",
  "./images/maps/thumbnail/STA.webp",
  "./images/maps/thumbnail/TOB.webp",
  "./images/maps/thumbnail/UTA.webp",
];

const APP_SHELL_FALLBACK = "./index.html";

function toCacheKey(input) {
  const url = new URL(
    typeof input === "string" ? input : input.url,
    self.location.href,
  );
  url.search = "";
  url.hash = "";
  return url.toString();
}

async function putInCache(request, response) {
  if (!response || !response.ok) return;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(toCacheKey(request), response.clone());
}

async function matchFromCache(request) {
  const cache = await caches.open(CACHE_NAME);
  return cache.match(toCacheKey(request));
}

console.log(`[SW] Installing service worker v${SW_VERSION}`);

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log(`[SW] Caching assets for v${SW_VERSION}`);
      return Promise.all(
        ASSETS_TO_CACHE.map((url) => {
          const absoluteUrl = new URL(url, self.location.href).toString();
          return fetch(absoluteUrl, { cache: "no-store" })
            .then((response) => {
              if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
              return cache.put(toCacheKey(absoluteUrl), response);
            })
            .catch((err) => {
              console.warn(`[SW] Failed to cache: ${url}`, err.message);
              return null;
            });
        })
      ).then((results) => {
        const cached = results.filter((r) => r !== null).length;
        console.log(`[SW] Cached ${cached}/${ASSETS_TO_CACHE.length} assets`);
      });
    }).catch((err) => {
      console.error('[SW] Install failed:', err);
    })
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return Promise.resolve(false);
        }),
      ).then(() => self.clients.claim()),
    ),
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const requestUrl = new URL(e.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then(async (response) => {
        await putInCache(e.request, response);
        return response;
      })
      .catch(async (err) => {
        console.warn("[SW] Network fetch failed, falling back to cache:", e.request.url, err);

        const cachedResponse = await matchFromCache(e.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        if (e.request.mode === "navigate") {
          const appShell = await matchFromCache(APP_SHELL_FALLBACK);
          if (appShell) {
            return appShell;
          }
        }

        return new Response(null, { status: 404, statusText: "Not Found" });
      }),
  );
});
