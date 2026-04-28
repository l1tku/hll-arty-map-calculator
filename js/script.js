// ==========================================
// 1. DATA & CONFIGURATION
// ==========================================

const APP_VERSION = "v1.3.4";
const GAME_VERSION = "Update 19.1";

// Create a simple map of IDs and what text should go in them
const versionMap = {
  appVersion: APP_VERSION,
  appVersionPanel: APP_VERSION,
  gameVersion: GAME_VERSION,
  gameVersionPanel: GAME_VERSION,
};

// Loop through and update only the ones that exist on the current page
Object.keys(versionMap).forEach((id) => {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = versionMap[id];
  }
});

// Detect Firefox to enable specific optimizations (sub-pixel rendering)
const isFirefox = navigator.userAgent.toLowerCase().indexOf("firefox") > -1;

// Map Dimensions
const MAP_WIDTH_METERS = 2000.0;
const GAME_UNITS_PER_METER = 100.0;
const MAP_SDK_WIDTH = MAP_WIDTH_METERS * GAME_UNITS_PER_METER; // 200,000
const MAP_SDK_HEIGHT = MAP_SDK_WIDTH; // Square map

// Artillery Range Constants
const MIN_RANGE_METERS = 100; // ← Change this number if you want a different deadzone (e.g. 120 or 150)

// SDK Boundaries
const GAME_LEFT = -MAP_SDK_WIDTH / 2; // -100,000
const GAME_RIGHT = MAP_SDK_WIDTH / 2; // 100,000
const GAME_TOP = MAP_SDK_HEIGHT / 2; // 100,000
const GAME_BOTTOM = -MAP_SDK_HEIGHT / 2; // -100,000

// Map state
const MIN_ZOOM = 1;
// FIX #10: MAX_ZOOM is intentionally `let`, NOT `const`.
// updateDimensions() reassigns it at runtime: 20 on mobile, 10 on desktop.
// Do not change to const — that would break mobile zoom limits.
let MAX_ZOOM = 10;
const ZOOM_STEP = 0.5;
const MARKER_ROTATION_DEG = 0;

// Initial State
let state = {
  scale: 1,
  fitScale: 1,
  panning: false,
  pointX: 0,
  pointY: 0,
  startX: 0,
  startY: 0,
};
let currentZoomLevel = 1;
let activeFaction = null;
let activeGunIndex = -1;
let activeTarget = null;
let activeMapKey = "CAR";
let rulerEnabled = false; // Ruler toggle state
let hudEnabled = false;
let manualCalcFaction = "us";
let currentStrongpoints = [];
let labelCache = [];
let isRendering = false;
let calcInputVal = ""; // Stores the string
let calcHistory = []; // Stores calculation history
let historyCollapsed = true; // Track history visibility state (default collapsed)
let historyEnabled = false; // Track history enabled/disabled state

// Custom Artillery Variables
let customArtillery = []; // Store user-placed artillery
let placementMode = false; // Track if we're in placement mode
let nextCustomGunId = 1; // ID counter for custom guns
let moveMode = false; // Track if we're moving a custom gun
let movingGunId = null; // ID of gun being moved
let activeCustomGunId = null; // ← ADD THIS LINE

// Trajectory Slider Variables
let trajSliderEnabled = false;
let originalAngle = 0; // Locks the bearing
let trajUpdatePending = false;

// Performance optimization: Ruler label pool to avoid recreating DOM elements
let rulerLabelPool = [];

// --- PERFORMANCE CACHE ---
let stickyLabelsCache = { cols: [], rows: [] }; // Stores grid label elements
let cachedSubGrid = null; // Stores the keypad grid element
let _mapRectCache = null; // Cached getBoundingClientRect result
let _mapRectTime = 0; // Timestamp of cache

// (Top of script) ---
let _lastMobDist = null;
let _lastMobMil = null;
let _lastMobGrid = null;

// --- DIRTY-CHECK & CACHED COMPUTED VALUES ---
let _lastRingDiameter = -1; // updateDesktopRingScale: skip DOM write when unchanged
let _lastCursorMode = null; // updateMapCursor: skip all DOM writes when mode unchanged
let _cachedDPR = window.devicePixelRatio > 1; // cached at load, refreshed on resize
let _lastMobContainerSize = -1; // updateMobileHud ring container: skip write when unchanged
let _lastMajorThickness = -1; // render() grid thickness: skip setProperty when unchanged

// Match Setup Variables
let filterMode = false; // Is the setup menu open?
let confirmedPoints = new Set(); // Stores IDs of the "Chosen" points

// Performance optimization: Real Cache (Lazy Loaded)
const cached = {
  _ele: {}, // Internal storage
  getElem(id) {
    if (!this._ele[id]) this._ele[id] = document.getElementById(id);
    return this._ele[id];
  },
  get mapImage() {
    return this.getElem("mapImage");
  },
  get markersLayer() {
    return this.getElem("markers");
  },
  get mapContainer() {
    return this.getElem("mapContainer");
  },
  get mapStage() {
    return this.getElem("mapStage");
  },
  get trajCurrentMil() {
    return this.getElem("trajCurrentMil");
  },
  get trajCurrentMeter() {
    return this.getElem("trajCurrentMeter");
  },
  get factionLabel() {
    return this.getElem("factionLabel");
  },
  get targetDataPanel() {
    return this.getElem("targetDataPanel");
  },
  get panelDist() {
    return this.getElem("panelDist");
  },
  get panelMil() {
    return this.getElem("panelMil");
  },
  get panelTime() {
    return this.getElem("panelTime");
  },
  get zoomIndicator() {
    return this.getElem("zoomIndicator");
  },

  // Add scale elements to cache
  get scaleWrapper() {
    return this.getElem("scaleWrapper");
  },
  get scaleTextMid() {
    return this.getElem("scaleTextMid");
  },
  get scaleTextEnd() {
    return this.getElem("scaleTextEnd");
  },
};

// ==========================================
// MOBILE PERFORMANCE MODE
// ==========================================
let IS_MOBILE =
  /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  ) || window.innerWidth <= 768;

const MOBILE_QUALITY = {
  showRangeCircle: !IS_MOBILE, // disable big 1600m circle on phones
  rulerIntervalMeters: IS_MOBILE ? 100 : 50, // fewer ruler ticks
  maxRulerMarkers: IS_MOBILE ? 8 : 32, // Desktop: 32 markers × 50m = 1600m
};

// Update IS_MOBILE on resize to avoid repeated innerWidth checks
window.addEventListener("resize", () => {
  IS_MOBILE = window.innerWidth <= 768;
  _cachedDPR = window.devicePixelRatio > 1; // refresh cache (window may move to a different display)
  _lastCursorMode = null; // force cursor re-check (IS_MOBILE may have toggled)
});

// DOM Elements
const mapContainer = document.getElementById("mapContainer");
const mapStage = document.getElementById("mapStage");
const zoomIndicator = document.getElementById("zoomIndicator");

// Function to open the Projects Hub Modal
function openProjectsModal() {
  const modal = document.getElementById("projectsModal");
  if (modal) {
    modal.classList.add("active");
  }
}

// Function to close the Projects Hub Modal
function closeProjectsModal() {
  const modal = document.getElementById("projectsModal");
  if (modal) {
    modal.classList.remove("active");
  }
}

// Add event listener for the close button inside the modal
document
  .getElementById("closeProjectsBtn")
  ?.addEventListener("click", closeProjectsModal);

// Optional: Close modal if clicking on the dark overlay
document.getElementById("projectsModal")?.addEventListener("click", (e) => {
  if (e.target.id === "projectsModal") closeProjectsModal();
});

// ==========================================
// 2. HELPER FUNCTIONS
// ==========================================

// --- NEW: Global Helper to stop map panning ---
const stopMapInteraction = (e) => {
  e.stopPropagation();
  // NOTE: Do NOT call preventDefault() here, or sliders/inputs won't work!
};

// --- HELPER: Visual Shooting Pulse ---
function triggerFirePulse(x, y) {
  const stage = cached.mapStage; // Must be mapStage!
  if (!stage) return;

  const pulse = document.createElement("div");
  pulse.className = "shot-pulse";

  // Position exactly at target pixels
  pulse.style.left = `${Math.round(x)}px`;
  pulse.style.top = `${Math.round(y)}px`;

  stage.appendChild(pulse);

  // Cleanup slightly after animation ends (400ms animation -> 450ms cleanup)
  setTimeout(() => {
    pulse.remove();
  }, 450);
}

function showLoading() {
  const loading = document.getElementById("loadingOverlay");
  if (loading) loading.style.display = "flex";
}

function updatePageTitle(mapName) {
  // Dynamically updates the browser tab title using the original case
  document.title = `HLL Arty Calculator - ${mapName}`;
}

/**
 * FIX #8: Escapes a value for safe embedding inside an HTML attribute.
 * Without this, a string like:  She said "fire!"
 * would produce:  data-caption="She said "fire!""  — breaking the attribute.
 * Covers the two characters that matter inside double-quoted attributes: & and "
 */
function escapeAttr(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;");
}

function openMapHistory(mapKey) {
  const mapData = MAP_DATABASE[mapKey];
  if (!mapData || !mapData.history) return;

  const mapHistoryModal = document.getElementById("mapHistoryModal");
  const historyModalTitle = document.getElementById("historyModalTitle");
  const historyContent = document.getElementById("historyContent");
  const h = mapData.history;

  if (historyModalTitle) {
    historyModalTitle.textContent = mapData.name.toUpperCase();
  }

  if (historyContent) {
    historyContent.scrollTop = 0;
    let html = `<div class="history-section">`;
    html += `<h3>${h.battle}</h3>`;

    // Images
    if (h.images && h.images.length > 0) {
      html += `<div class="history-images">`;
      h.images.forEach((img, index) => {
        const imgSrc = typeof img === "object" ? img.thumbnail || img.src : img;
        const imgFull = typeof img === "object" ? img.full || img.src : img;
        const imgCaption = typeof img === "object" ? img.caption : "";
        // FIX #8: escape values placed inside HTML attribute quotes
        html += `<div class="history-image-item">`;
        html += `<img src="${imgSrc}" alt="${escapeAttr(h.battle)}" loading="lazy" onerror="this.style.display='none'" class="history-img-thumb history-image" onload="this.classList.add('loaded')" data-full-img="${escapeAttr(imgFull)}" data-caption="${escapeAttr(imgCaption)}" data-index="${index}">`;
        if (imgCaption) {
          html += `<div class="history-img-caption">${imgCaption}</div>`;
        }
        html += `</div>`;
      });
      html += `</div>`;
    }

    // Description
    html += `<p>${h.description}</p>`;

    // Tactics
    if (h.tactics) {
      html += `<h4>Tactical Situation</h4>`;

      // Tactical Situation Images
      if (
        h.tacticalSituation &&
        h.tacticalSituation.images &&
        h.tacticalSituation.images.length > 0
      ) {
        html += `<div class="history-images">`;
        h.tacticalSituation.images.forEach((img, index) => {
          const imgSrc =
            typeof img === "object" ? img.thumbnail || img.src : img;
          const imgFull = typeof img === "object" ? img.full || img.src : img;
          const imgCaption = typeof img === "object" ? img.caption : "";
          // FIX #8: escape values placed inside HTML attribute quotes
          html += `<div class="history-image-item">`;
          html += `<img src="${imgSrc}" alt="${escapeAttr(h.battle)}" loading="lazy" onerror="this.style.display='none'" class="history-img-thumb history-image" onload="this.classList.add('loaded')" data-full-img="${escapeAttr(imgFull)}" data-caption="${escapeAttr(imgCaption)}" data-index="${index}">`;
          if (imgCaption) {
            html += `<div class="history-img-caption">${imgCaption}</div>`;
          }
          html += `</div>`;
        });
        html += `</div>`;
      }

      html += `<p>${h.tactics}</p>`;
    }

    // Significance
    html += `<h4>Strategic Significance</h4>`;

    // Strategic Context Images
    if (
      h.strategicContext &&
      h.strategicContext.images &&
      h.strategicContext.images.length > 0
    ) {
      html += `<div class="history-images">`;
      h.strategicContext.images.forEach((img, index) => {
        const imgSrc = typeof img === "object" ? img.thumbnail || img.src : img;
        const imgFull = typeof img === "object" ? img.full || img.src : img;
        const imgCaption = typeof img === "object" ? img.caption : "";
        // FIX #8: escape values placed inside HTML attribute quotes
        html += `<div class="history-image-item">`;
        html += `<img src="${imgSrc}" alt="${escapeAttr(h.battle)}" loading="lazy" onerror="this.style.display='none'" class="history-img-thumb history-image" onload="this.classList.add('loaded')" data-full-img="${escapeAttr(imgFull)}" data-caption="${escapeAttr(imgCaption)}" data-index="${index}">`;
        if (imgCaption) {
          html += `<div class="history-img-caption">${imgCaption}</div>`;
        }
        html += `</div>`;
      });
      html += `</div>`;
    }

    html += `<p>${h.significance}</p>`;

    html += `</div>`;
    historyContent.innerHTML = html;

    // Add click handlers for image expansion
    const thumbImages = historyContent.querySelectorAll(".history-img-thumb");
    thumbImages.forEach((img) => {
      img.addEventListener("click", () => {
        openImageViewer(img.dataset.fullImg, h.battle, img.dataset.caption);
      });
    });
  }

  if (mapHistoryModal) {
    mapHistoryModal.classList.add("active");
  }
}

function openImageViewer(imageSrc, caption, imgCaption) {
  const displayCaption = imgCaption || caption;
  // Create overlay for full image view
  const viewer = document.createElement("div");
  viewer.className = "image-viewer-overlay";
  viewer.innerHTML = `
        <div class="image-viewer-content" style="opacity: 0; transition: opacity 0.2s ease;">
            <button class="image-viewer-close" aria-label="Close">&times;</button>
            <img src="${imageSrc}" alt="${caption}" class="image-viewer-img">
            ${displayCaption ? `<div class="image-viewer-caption">${displayCaption}</div>` : ""}
        </div>
    `;
  document.body.appendChild(viewer);

  const img = viewer.querySelector(".image-viewer-img");
  const content = viewer.querySelector(".image-viewer-content");

  if (img.complete) {
    content.style.opacity = "1";
  } else {
    img.onload = () => {
      content.style.opacity = "1";
    };
  }

  // Close on click
  viewer.addEventListener("click", (e) => {
    if (
      e.target === viewer ||
      e.target.classList.contains("image-viewer-close")
    ) {
      viewer.remove();
    }
  });

  // Close on escape key
  const closeOnEscape = (e) => {
    if (e.key === "Escape") {
      viewer.remove();
      document.removeEventListener("keydown", closeOnEscape);
    }
  };
  document.addEventListener("keydown", closeOnEscape);
}

function hideLoading() {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) {
    setTimeout(() => {
      overlay.style.display = "none";
    }, 200);
  }
}

// --- PINCH ZOOM HELPERS ---
function getPinchDistance(e) {
  const dx = e.touches[0].clientX - e.touches[1].clientX;
  const dy = e.touches[0].clientY - e.touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getPinchCenter(e) {
  return {
    x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
    y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
  };
}

function syncToggleUI() {
  const isMobile = IS_MOBILE;

  // 1. Sync Buttons
  const rulerBtn = document.getElementById("rulerToggleBtn");
  if (rulerBtn) rulerBtn.classList.toggle("active", rulerEnabled);

  const hudBtn = document.getElementById("hudToggleBtn");
  if (hudBtn) hudBtn.classList.toggle("active", hudEnabled);

  // This lets the CSS know the HUD is on to show the arrows
  document.body.classList.toggle("hud-active", hudEnabled);
  // --------------------------

  // 2. Sync Visibility
  const hudEl = document.getElementById("liveCursorHud");
  const crosshair = document.getElementById("mobileCrosshair");
  const fireBtn = document.getElementById("mobileFireBtn");

  // NEW: Get the desktop rings element
  const desktopRings = document.getElementById("desktopCursorRings");

  if (hudEnabled) {
    if (hudEl) {
      hudEl.classList.remove("hidden");
      // FIX: Hide initially on Desktop until mouse moves to prevent 0,0 jump
      if (!isMobile) hudEl.style.opacity = "0";
    }

    if (isMobile) {
      // Mobile Mode
      if (crosshair) crosshair.classList.remove("hidden");
      if (fireBtn) fireBtn.classList.remove("hidden");
      if (desktopRings) desktopRings.classList.add("hidden");
    } else {
      // Desktop Mode
      if (desktopRings) {
        desktopRings.classList.remove("hidden");
        // FIX: Hide initially until mouse moves
        desktopRings.style.opacity = "0";
      }
      if (crosshair) crosshair.classList.add("hidden");
      if (fireBtn) fireBtn.classList.add("hidden");
    }
  } else {
    // Everything Hidden
    if (hudEl) hudEl.classList.add("hidden");
    if (crosshair) crosshair.classList.add("hidden");
    if (fireBtn) fireBtn.classList.add("hidden");
    if (desktopRings) desktopRings.classList.add("hidden");
  }
}

function updateDesktopRingScale() {
  const ringsEl = cached.getElem("desktopCursorRings");
  if (!ringsEl || !hudEnabled) return;

  const mapImage = cached.mapImage; // Use cached
  if (!mapImage || mapImage.naturalWidth === 0) return;

  const dims = getMapDimensions();
  const effectiveZoom = state.scale * state.fitScale;

  const currentMapPixelWidth = mapImage.naturalWidth * effectiveZoom;
  const totalMapMeters = dims.width / GAME_UNITS_PER_METER;
  const pixelsPerMeter = currentMapPixelWidth / totalMapMeters;

  const rawDiameter = 40 * pixelsPerMeter;

  // FIX: Round to the nearest EVEN integer to prevent sub-pixel blurring
  // (e.g., 41.3 -> 42, 40.1 -> 40)
  const diameterPx = Math.round(rawDiameter / 2) * 2;

  // Skip the DOM write if the size hasn't actually changed (avoids layout recalc during panning)
  if (diameterPx !== _lastRingDiameter) {
    ringsEl.style.width = `${diameterPx}px`;
    ringsEl.style.height = `${diameterPx}px`;
    _lastRingDiameter = diameterPx;
  }
}

// Show loading immediately
showLoading();

function toggleSubGrid(currentZoom) {
  // Lazy load cache
  if (!cachedSubGrid) {
    cachedSubGrid = document.querySelector(".keypad-grid");
  }

  if (!cachedSubGrid) return;

  // Simple state check to avoid DOM writes if not needed could be added here,
  // but opacity style change is generally cheap.
  if (currentZoom >= 3.0) cachedSubGrid.style.opacity = "0.4";
  else cachedSubGrid.style.opacity = "0";
}

function getEffectiveZoom() {
  return state.scale * state.fitScale;
}

function getGridRef(gameX, gameY) {
  // 1. Get dimensions for the current active map (Handles 2016m Carentan vs 1984m Driel)
  const dims = getMapDimensions();

  // Calculate the "half" based on the actual map width, not the global 2000 default
  const halfWidth = dims.width / 2 / GAME_UNITS_PER_METER;
  const halfHeight = dims.height / 2 / GAME_UNITS_PER_METER;

  // Convert Game Coords to Meter Offset from Top-Left
  // Standard logic: X grows right, Y grows up (in game) but down (in grid)
  const xMeters = gameX / GAME_UNITS_PER_METER + halfWidth;
  const yMeters = halfHeight - gameY / GAME_UNITS_PER_METER;

  // Check bounds based on actual map size
  const totalW = dims.width / GAME_UNITS_PER_METER;
  const totalH = dims.height / GAME_UNITS_PER_METER;

  if (xMeters < 0 || xMeters > totalW || yMeters < 0 || yMeters > totalH) {
    return "---";
  }

  // Grid Squares - calculate based on actual map dimensions for 1:1 accuracy
  // Map is divided into 10 equal sections, not fixed 200m
  const sectionWidthMeters = totalW / 10;
  const sectionHeightMeters = totalH / 10;

  let colIndex = Math.floor(xMeters / sectionWidthMeters);
  let rowIndex = Math.floor(yMeters / sectionHeightMeters);

  const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

  // Safety Clamp
  if (colIndex >= letters.length) colIndex = letters.length - 1;
  if (rowIndex >= 10) rowIndex = 9;
  if (colIndex < 0) colIndex = 0;
  if (rowIndex < 0) rowIndex = 0;

  const colChar = letters[colIndex];
  const rowChar = rowIndex + 1;

  return `${colChar}${rowChar}`;
}

// --- FORCE ANIMATIONS OFF (RESPONSIVE STYLE) ---
function toggleTransitions(enable) {
  // Always remove the class, never add it.
  // This ensures instant snapping on both Desktop and Mobile.
  mapStage.classList.remove("zoom-transition");
  const labelLayer = document.getElementById("labelLayer");
  if (labelLayer) labelLayer.classList.remove("zoom-transition");
  mapStage.style.transition = "none";
}

function setZoomLevel(newLevel, mouseX = null, mouseY = null) {
  const prevZoom = getEffectiveZoom();
  // Update the global state immediately
  currentZoomLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newLevel));
  state.scale = currentZoomLevel;

  // REMOVED: The block that added 'zoom-transition'
  // This keeps the zoom instant/responsive.

  const newZoom = getEffectiveZoom();

  if (mouseX !== null && mouseY !== null) {
    // Get the current world position under the mouse
    const worldX = (mouseX - state.pointX) / prevZoom;
    const worldY = (mouseY - state.pointY) / prevZoom;

    // Calculate what the new pan position should be
    state.pointX = mouseX - worldX * newZoom;
    state.pointY = mouseY - worldY * newZoom;
  }

  clampPosition();
  toggleSubGrid(currentZoomLevel);
  render();

  // Auto-save zoom changes (debounced)
  clearTimeout(window.saveZoomTimeout);
  window.saveZoomTimeout = setTimeout(saveState, 500);
}

function clampPosition() {
  // PERFORMANCE FIX: Use cached rect if available from render loop
  const mapContainer = cached.mapContainer;
  if (!mapContainer) return;
  const rect = _mapRectCache || mapContainer.getBoundingClientRect();
  const mapImage = document.getElementById("mapImage");
  const drawScale = state.scale * state.fitScale;
  const imgW = mapImage.naturalWidth * drawScale;
  const imgH = mapImage.naturalHeight * drawScale;

  const OVERSCROLL_FACTOR = 0.8;
  const marginX = rect.width * OVERSCROLL_FACTOR;
  const marginY = rect.height * OVERSCROLL_FACTOR;

  const limitTop = marginY;
  const limitBottom = rect.height - imgH - marginY;
  const limitLeft = marginX;
  const limitRight = rect.width - imgW - marginX;

  if (state.pointX > limitLeft) state.pointX = limitLeft;
  if (state.pointX < limitRight) state.pointX = limitRight;
  if (state.pointY > limitTop) state.pointY = limitTop;
  if (state.pointY < limitBottom) state.pointY = limitBottom;
}

function createStickyLabels() {
  const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
  let labelLayer = document.getElementById("labelLayer");
  if (!labelLayer) {
    labelLayer = document.createElement("div");
    labelLayer.id = "labelLayer";
    labelLayer.className = "label-layer";
    mapContainer.appendChild(labelLayer);
  }

  labelLayer.innerHTML = "";

  // Reset Cache
  stickyLabelsCache.cols = [];
  stickyLabelsCache.rows = [];

  // Create Columns (Letters)
  for (let i = 0; i < 10; i++) {
    const el = document.createElement("div");
    el.className = "hll-grid-label";
    el.innerText = i === 0 ? "A1" : letters[i];
    labelLayer.appendChild(el);
    stickyLabelsCache.cols.push(el); // Save to cache
  }

  // Create Rows (Numbers)
  for (let i = 1; i < 10; i++) {
    const el = document.createElement("div");
    el.className = "hll-grid-label";
    el.innerText = i + 1;
    labelLayer.appendChild(el);
    stickyLabelsCache.rows.push(el); // Save to cache
  }
}

// === FIX #2: Sticky Labels using 2D Transform ===
function updateStickyLabels(currentDrawScale) {
  const mapImage = cached.mapImage;
  if (!mapImage) return;

  const w = mapImage.naturalWidth;
  const h = mapImage.naturalHeight;
  const stepX = (w / 10) * currentDrawScale;
  const stepY = (h / 10) * currentDrawScale;

  const isMobile = IS_MOBILE;
  const padding = isMobile ? 15 : 30;

  const stickyTopY = Math.max(state.pointY, 0);
  const stickyLeftX = Math.max(state.pointX, 0);

  let fontScale = 0.7 + (state.scale - 1) * 0.15;
  if (fontScale > 1.0) fontScale = 1.0;

  // FIX: Detect if we should use floats (Firefox/HighDPI) to prevent label vibration
  const isHighDPI = _cachedDPR; // use cached value — window.devicePixelRatio on every frame is wasteful
  const useFloats = isHighDPI || isFirefox;

  for (let i = 0; i < stickyLabelsCache.cols.length; i++) {
    const el = stickyLabelsCache.cols[i];
    const colScreenX = state.pointX + i * stepX;
    const finalX = colScreenX + padding;

    const finalY = stickyTopY + padding;

    // Apply rounding only if NOT Firefox/HighDPI
    const xVal = useFloats ? finalX : Math.round(finalX);
    const yVal = useFloats ? finalY : Math.round(finalY);

    el.style.transform = `translate(${xVal}px, ${yVal}px) scale(${fontScale})`;
  }

  for (let i = 0; i < stickyLabelsCache.rows.length; i++) {
    const el = stickyLabelsCache.rows[i];
    const gridIndex = i + 1;
    const finalX = stickyLeftX + padding;
    const rowScreenY = state.pointY + gridIndex * stepY;
    const finalY = rowScreenY + padding;

    // Apply rounding only if NOT Firefox/HighDPI
    const xVal = useFloats ? finalX : Math.round(finalX);
    const yVal = useFloats ? finalY : Math.round(finalY);

    el.style.transform = `translate(${xVal}px, ${yVal}px) scale(${fontScale})`;
  }
}

function buildGrid() {
  let gridLayer = document.getElementById("gridLayer");

  if (!gridLayer) {
    gridLayer = document.createElement("div");
    gridLayer.id = "gridLayer";
    gridLayer.className = "grid-layer";
    document.getElementById("mapStage").appendChild(gridLayer);
  }

  gridLayer.innerHTML = "";
  const mapImage = document.getElementById("mapImage");
  const w = mapImage.naturalWidth;
  const h = mapImage.naturalHeight;
  if (w === 0) return;

  gridLayer.style.width = `${w}px`;
  gridLayer.style.height = `${h}px`;

  const stepX = w / 10;
  const stepY = h / 10;

  const keypadLayer = document.createElement("div");
  keypadLayer.className = "keypad-grid";
  keypadLayer.style.backgroundSize = `${stepX / 3}px ${stepY / 3}px`;
  gridLayer.appendChild(keypadLayer);

  // --- VERTICAL LINES ---
  for (let i = 0; i <= 10; i++) {
    const vLine = document.createElement("div");
    vLine.className = "hll-grid-line vertical";
    vLine.style.left = `${Math.round(i * stepX)}px`;

    // FIX: Remove -50% centering for inner lines to prevent Firefox sub-pixel blur
    if (i === 0) vLine.style.transform = "translateX(0)";
    else if (i === 10) vLine.style.transform = "translateX(-100%)";
    else vLine.style.transform = "translateX(0)"; // Changed from -50% to 0

    gridLayer.appendChild(vLine);
  }

  // --- HORIZONTAL LINES ---
  for (let i = 0; i <= 10; i++) {
    const hLine = document.createElement("div");
    hLine.className = "hll-grid-line horizontal";
    hLine.style.top = `${Math.round(i * stepY)}px`;

    // FIX: Remove -50% centering for inner lines
    if (i === 0) hLine.style.transform = "translateY(0)";
    else if (i === 10) hLine.style.transform = "translateY(-100%)";
    else hLine.style.transform = "translateY(0)"; // Changed from -50% to 0

    gridLayer.appendChild(hLine);
  }
}

// --- COORDINATE CONVERSION HELPERS ---
function getMapDimensions() {
  const config = MAP_DATABASE[activeMapKey];

  // 1. If map has explicit FModel bounds, use them
  if (config.bounds) {
    return {
      width: config.bounds.maxX - config.bounds.minX,
      height: config.bounds.maxY - config.bounds.minY,
      left: config.bounds.minX,
      top: config.bounds.maxY,
    };
  }

  // 2. Fallback for other maps (Explicit Meter Values)
  const wMeters = config.widthMeters || MAP_WIDTH_METERS;
  const hMeters = config.heightMeters || MAP_WIDTH_METERS;

  const sdkW = wMeters * GAME_UNITS_PER_METER;
  const sdkH = hMeters * GAME_UNITS_PER_METER;

  return {
    width: sdkW,
    height: sdkH,
    left: -sdkW / 2,
    top: sdkH / 2,
  };
}

function gameToImagePixels(gameX, gameY, imgW, imgH) {
  const dims = getMapDimensions();

  // X is Standard (Left to Right)
  const normX = (gameX - dims.left) / dims.width;

  // Y Inversion:
  // In Game: +Y is usually North (Up).
  // In Image: 0 is North (Top).
  // So we subtract GameY from the Top Boundary.
  // Example: If Top is 100800 and Point is 50000 -> (100800 - 50000) / H = Top Half.
  const normY = (dims.top - gameY) / dims.height;

  return { x: normX * imgW, y: normY * imgH };
}

function imagePixelsToGame(imgX, imgY, imgW, imgH) {
  const dims = getMapDimensions();
  const normX = imgX / imgW;
  const normY = imgY / imgH;
  const x = normX * dims.width + dims.left;
  const y = dims.top - normY * dims.height;
  return { x: x, y: y };
}

// ==========================================
// GUN ROTATION HELPER (used by BOTH friendly + enemy)
// ==========================================
function getGunBaseRotation(team, mapConfig, individualRotation) {
  // If individual rotation is defined, use it (from game files)
  if (individualRotation !== undefined && individualRotation !== null) {
    return individualRotation;
  }

  const teamKey = team.toLowerCase();
  const isAxis = ["ger", "axis", "afrika"].some((x) => teamKey.includes(x));
  const sortMode = mapConfig ? mapConfig.gunSort : "y";

  if (mapConfig && mapConfig.gunRotations) {
    if (mapConfig.gunRotations[teamKey] !== undefined) {
      return mapConfig.gunRotations[teamKey];
    }
    if (isAxis && mapConfig.gunRotations["ger"] !== undefined) {
      return mapConfig.gunRotations["ger"];
    }
    if (mapConfig.gunRotations["us"] !== undefined) {
      return mapConfig.gunRotations["us"];
    }
  }

  // Fallback based on map orientation
  if (sortMode === "x") {
    return isAxis ? -90 : 90; // vertical maps (north-south)
  } else {
    return isAxis ? 180 : 0; // horizontal maps (west-east) like Carentan
  }
}

function renderMarkers() {
  const markersLayer = cached.markersLayer;
  if (!markersLayer) return;
  markersLayer.innerHTML = "";
  labelCache = [];
  const fragment = document.createDocumentFragment();
  const mapImage = cached.mapImage;

  if (!mapImage) return;
  const w = mapImage.naturalWidth;
  const h = mapImage.naturalHeight;
  if (!currentStrongpoints) return;

  const mapConfig = MAP_DATABASE[activeMapKey];
  const sortMode = mapConfig ? mapConfig.gunSort : "y";
  const isVerticalMap = mapConfig && mapConfig.gunSort === "x";

  const teamArty = currentStrongpoints.filter(
    (p) => p.team === activeFaction && p.type === "point",
  );

  if (sortMode === "x") teamArty.sort((a, b) => a.gameX - b.gameX);
  else teamArty.sort((a, b) => b.gameY - a.gameY);

  let activeGunEl = null;

  updateSectorVisuals();
  updateSetupGuide();

  if (placementMode && activeFaction) {
    updatePlacementSectorVisuals();
  }

  const filledSectors = new Set();
  if (filterMode) {
    confirmedPoints.forEach((id) => {
      const point = currentStrongpoints.find((p) => p.id === id);
      if (point) filledSectors.add(getPointSector(point, isVerticalMap));
    });
  }

  let targetSector = 0;
  while (filledSectors.has(targetSector) && targetSector < 5) {
    targetSector++;
  }

  const dims = getMapDimensions();
  const pxPerMeter = (w / dims.width) * GAME_UNITS_PER_METER;

  // PERF FIX: Pre-compute which sectors have a confirmed point in one O(n) pass.
  // Avoids an O(n²) currentStrongpoints.some() call inside the forEach below.
  const confirmedSectors = new Set();
  if (confirmedPoints.size > 0) {
    currentStrongpoints.forEach((p) => {
      if (p.type === "strongpoint" && confirmedPoints.has(p.id)) {
        confirmedSectors.add(getPointSector(p, isVerticalMap));
      }
    });
  }

  currentStrongpoints.forEach((point) => {
    // NEW: We now render enemy artillery too
    if (point.type === "point") {
      // Skip nothing — both friendly and enemy artillery are shown
    }

    // --- SETUP VISIBILITY LOGIC ---
    if (point.type === "strongpoint") {
      const isConfirmed = confirmedPoints.has(point.id);
      const mySector = getPointSector(point, isVerticalMap);

      // O(1) Set lookup replaces the O(n) .some() that was here
      const sectorHasConfirmation = confirmedSectors.has(mySector);

      if (!filterMode) {
        if (sectorHasConfirmation && !isConfirmed) return;
      }
    }

    const el = document.createElement("div");
    el.className = `marker ${point.team} ${point.type}`;

    let isActiveGun = false;
    let isEnemyGun = false;

    if (point.type === "point") {
      if (point.team === activeFaction) {
        // Friendly gun (existing logic)
        const idx = teamArty.findIndex((gun) => gun.id === point.id);
        el.style.cursor = "pointer";
        el.onclick = (e) => {
          if (isDragging) return;
          e.stopPropagation();
          e.preventDefault();

          if (activeGunIndex !== idx) {
            if (navigator.vibrate) navigator.vibrate(20);
            activeGunIndex = idx;
            activeCustomGunId = null;

            const gunNames = mapConfig.guns || ["Gun 1", "Gun 2", "Gun 3"];
            const gunLabel = document.getElementById("gunLabel");
            if (gunLabel) {
              gunLabel.innerText = gunNames[idx] || `Gun ${idx + 1}`;
              gunLabel.style.color = "#ffffff";
            }
            if (activeTarget) {
              const gunPos = { x: point.gameX, y: point.gameY };
              const factionLabel =
                document.getElementById("factionLabel").innerText;
              const dx = activeTarget.gameX - gunPos.x;
              const dy = activeTarget.gameY - gunPos.y;
              const distanceUnits = Math.sqrt(dx * dx + dy * dy);
              const correctedDistance = Math.floor(
                distanceUnits / GAME_UNITS_PER_METER,
              );
              const newMil = getMilFromTable(correctedDistance, factionLabel);
              activeTarget.distance = correctedDistance;
              activeTarget.mil = newMil;
              if (trajSliderEnabled) {
                originalAngle = Math.atan2(dy, dx);
                const trajInput = document.getElementById("trajectoryRange");
                if (trajInput) trajInput.value = correctedDistance;
                const milDisplay = document.getElementById("trajCurrentMil");
                const meterDisplay =
                  document.getElementById("trajCurrentMeter");
                if (milDisplay)
                  milDisplay.innerText = newMil !== null ? newMil : "OUT";
                if (meterDisplay)
                  meterDisplay.innerText = correctedDistance + "m";
              }
            }
            renderMarkers();
            renderTargeting();
            render();
            saveState();
          }
        };

        if (activeGunIndex === -1) {
          el.style.opacity = "1";
          el.style.filter = "none";
          el.style.zIndex = "100";
        } else if (idx === activeGunIndex) {
          el.classList.add("active-gun");
          isActiveGun = true;
        } else {
          el.classList.add("dimmed-gun");
        }
      } else {
        // ENEMY GUN
        isEnemyGun = true;
        el.classList.add("enemy-gun");
        el.style.cursor = "default";
      }
    }

    const pos = gameToImagePixels(point.gameX, point.gameY, w, h);

    if (point.type === "strongpoint") {
      const radiusPx = (point.radius / GAME_UNITS_PER_METER) * pxPerMeter;
      const size = radiusPx * 2;
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.left = `${Math.round(pos.x)}px`;
      el.style.top = `${Math.round(pos.y)}px`;
      el.style.marginLeft = `-${size / 2}px`;
      el.style.marginTop = `-${size / 2}px`;

      const visual = document.createElement("div");
      visual.className = "marker-visual";
      el.appendChild(visual);

      if (filterMode) {
        const mySector = getPointSector(point, isVerticalMap);
        const isConfirmed = confirmedPoints.has(point.id);

        // O(1) Set lookup — confirmedSectors was pre-computed above the forEach
        const sectorHasConfirmation = confirmedSectors.has(mySector);

        // 1. Determine Visual State
        if (isConfirmed) {
          el.classList.add("is-confirmed");
          el.classList.add("setup-active");
        } else if (sectorHasConfirmation) {
          el.classList.add("is-rejected");
          el.classList.add("setup-active");
        } else if (mySector === targetSector) {
          el.classList.add("is-open");
          el.classList.add("setup-active");
        } else if (mySector > targetSector) {
          el.classList.add("is-locked");
        } else {
          el.classList.add("is-rejected");
        }

        // 2. PAN-SAFE INTERACTION HANDLER
        if (el.classList.contains("setup-active")) {
          el.onclick = (e) => {
            if (isDragging) return;

            e.preventDefault();
            e.stopPropagation();

            if (navigator.vibrate) navigator.vibrate(20);

            if (confirmedPoints.has(point.id)) {
              confirmedPoints.delete(point.id);
            } else {
              currentStrongpoints.forEach((p) => {
                if (
                  p.type === "strongpoint" &&
                  getPointSector(p, isVerticalMap) === mySector
                ) {
                  confirmedPoints.delete(p.id);
                }
              });
              confirmedPoints.add(point.id);
            }

            if (confirmedPoints.size === 5) {
              updateSetupGuide();
              if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
            }

            renderMarkers();
            render();
            updateSetupGuide();
          };
        }
      }
    }

    // === ARTILLERY ICON RENDERING ===
    if (point.type === "point") {
      el.style.left = `${Math.round(pos.x)}px`;
      el.style.top = `${Math.round(pos.y)}px`;

      const img = document.createElement("img");
      img.className = "arty-icon";

      if (isEnemyGun) {
        // ENEMY GUN — use enemy-specific image
        img.src = "images/ui/artillery_position_enemy.webp";

        // ← NEW: Apply correct rotation using the ENEMY faction + individual rotation if available
        const baseRotation = getGunBaseRotation(
          point.team,
          mapConfig,
          point.rotation,
        );
        img.style.transform = `rotate(${baseRotation}deg) scaleX(-1)`;
      } else if (isActiveGun) {
        img.src = "images/ui/artillery_position_v2_white.webp";
      } else {
        img.src = "images/ui/artillery_position_v2.webp";
      }

      // Friendly active gun still points at target (unchanged)
      if (!isEnemyGun && isActiveGun && activeTarget) {
        const targetPos = gameToImagePixels(
          activeTarget.gameX,
          activeTarget.gameY,
          w,
          h,
        );
        const dy = targetPos.y - pos.y;
        const dx = targetPos.x - pos.x;
        let angle = Math.atan2(dy, dx) * (180 / Math.PI);
        angle -= 90;
        img.style.transform = `rotate(${angle}deg)`;
      } else if (!isEnemyGun) {
        // Friendly default rotation (use individual if available)
        const baseRotation = getGunBaseRotation(
          point.team,
          mapConfig,
          point.rotation,
        );
        img.style.transform = `rotate(${baseRotation}deg) scaleX(-1)`;
      }

      el.appendChild(img);
    }

    if (point.label) {
      const labelSpan = document.createElement("span");
      labelSpan.className = "marker-label";
      labelSpan.innerText = point.label;
      el.appendChild(labelSpan);
      labelCache.push(labelSpan);
    }

    if (isActiveGun) activeGunEl = el;
    else fragment.appendChild(el);
  });

  // --- CUSTOM ARTILLERY (no label + clickable + rotates like HQ guns) ---
  customArtillery.forEach((gun) => {
    if (gun.team !== activeFaction) return; // ← safe guard

    const el = document.createElement("div");
    el.className = `marker ${gun.team} point custom-artillery`; // ← "point" added
    el.style.cursor = "pointer";

    // Is this the currently selected custom gun?
    const isActiveGun =
      activeCustomGunId === gun.id ||
      (activeCustomGunId === null &&
        activeGunIndex === -1 &&
        customArtillery.filter((g) => g.team === activeFaction).slice(-1)[0]
          ?.id === gun.id);

    // Click icon → switch to this custom gun
    el.onclick = (e) => {
      if (isDragging) return;
      e.stopPropagation();
      e.preventDefault();

      if (navigator.vibrate) navigator.vibrate(20);

      activeGunIndex = -1;
      activeCustomGunId = gun.id;

      placementMode = false;
      moveMode = false;
      movingGunId = null;

      const gunLabel = document.getElementById("gunLabel");
      if (gunLabel) {
        gunLabel.innerText = gun.label;
        gunLabel.style.color = "#ffffff";
      }

      updateMapCursor();

      if (activeTarget) {
        const gunPos = { x: gun.gameX, y: gun.gameY };
        const factionLabel = document.getElementById("factionLabel").innerText;
        const dx = activeTarget.gameX - gunPos.x;
        const dy = activeTarget.gameY - gunPos.y;
        const distanceUnits = Math.sqrt(dx * dx + dy * dy);
        const correctedDistance = Math.floor(
          distanceUnits / GAME_UNITS_PER_METER,
        );
        const newMil = getMilFromTable(correctedDistance, factionLabel);
        activeTarget.distance = correctedDistance;
        activeTarget.mil = newMil;

        if (trajSliderEnabled) {
          originalAngle = Math.atan2(dy, dx);
          const trajInput = document.getElementById("trajectoryRange");
          if (trajInput) trajInput.value = correctedDistance;
          const milDisplay = document.getElementById("trajCurrentMil");
          const meterDisplay = document.getElementById("trajCurrentMeter");
          if (milDisplay)
            milDisplay.innerText = newMil !== null ? newMil : "OUT";
          if (meterDisplay) meterDisplay.innerText = correctedDistance + "m";
        }
      }

      renderMarkers();
      renderTargeting();
      render();
      saveState();
    };

    // Right-click still opens context menu
    el.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      showArtilleryContextMenu(gun.id, e.clientX, e.clientY);
    });

    // Visual state
    if (isActiveGun) {
      el.classList.add("active-gun");
    } else {
      el.classList.add("dimmed-gun");
    }

    const pos = gameToImagePixels(gun.gameX, gun.gameY, w, h);

    // === ROTATION LOGIC (exactly like HQ guns) ===
    const img = document.createElement("img");
    img.className = "arty-icon";

    // Use white version ONLY when the gun is selected
    if (isActiveGun) {
      img.src = "images/ui/artillery_position_v2_white.webp";
    } else {
      img.src = "images/ui/artillery_position_v2.webp";
    }
    img.style.width = "100%";
    img.style.height = "100%";

    if (isActiveGun && activeTarget) {
      // Point at target
      const targetPos = gameToImagePixels(
        activeTarget.gameX,
        activeTarget.gameY,
        w,
        h,
      );
      const dy = targetPos.y - pos.y;
      const dx = targetPos.x - pos.x;
      let angle = Math.atan2(dy, dx) * (180 / Math.PI);
      angle -= 90;
      img.style.transform = `rotate(${angle}deg)`;
    } else {
      // Default base rotation (same as HQ guns)
      let baseRotation = 0;
      const teamKey = gun.team.toLowerCase(); // ← now safe because of guard above
      const isAxis = ["ger", "axis", "afrika"].some((x) => teamKey.includes(x));
      const mapConfig = MAP_DATABASE[activeMapKey];
      if (mapConfig && mapConfig.gunRotations) {
        if (mapConfig.gunRotations[teamKey] !== undefined)
          baseRotation = mapConfig.gunRotations[teamKey];
        else if (isAxis && mapConfig.gunRotations["ger"] !== undefined)
          baseRotation = mapConfig.gunRotations["ger"];
        else if (mapConfig.gunRotations["us"] !== undefined)
          baseRotation = mapConfig.gunRotations["us"];
      } else {
        const sortMode = mapConfig ? mapConfig.gunSort : "y";
        if (sortMode === "x") baseRotation = isAxis ? -90 : 90;
        else baseRotation = isAxis ? 180 : 0;
      }
      img.style.transform = `rotate(${baseRotation}deg) scaleX(-1)`;
    }
    el.appendChild(img);

    // Position only — size is handled by .point class + CSS variable (same as HQ guns)
    el.style.left = `${Math.round(pos.x)}px`;
    el.style.top = `${Math.round(pos.y)}px`;

    if (isActiveGun) {
      activeGunEl = el;
    } else {
      fragment.appendChild(el);
    }
  });

  if (activeGunEl) fragment.appendChild(activeGunEl);
  markersLayer.appendChild(fragment);

  updateBeyondRangeOverlay();
  updateMinRangeOverlay();
}

function updateSectorVisuals() {
  let sectorLayer = document.getElementById("sectorLayer");
  if (!sectorLayer) {
    sectorLayer = document.createElement("div");
    sectorLayer.id = "sectorLayer";
    sectorLayer.className = "sector-layer";
    const mapStage = document.getElementById("mapStage");
    const gridLayer = document.getElementById("gridLayer");
    mapStage.insertBefore(sectorLayer, gridLayer);
  }

  sectorLayer.innerHTML = "";

  if (!filterMode) return;

  const mapConfig = MAP_DATABASE[activeMapKey];
  // Detect Vertical Map (Driel, PHL) based on sort mode
  // Usually 'x' sort implies Vertical layout (North/South bases)
  const isVerticalMap = mapConfig && mapConfig.gunSort === "x";

  // 1. Find filled sectors
  const filledSectors = new Set();
  confirmedPoints.forEach((id) => {
    const point = currentStrongpoints.find((p) => p.id === id);
    if (point) filledSectors.add(getPointSector(point, isVerticalMap));
  });

  // 2. Find target sector (Next Empty One)
  let targetSector = 0;
  while (filledSectors.has(targetSector) && targetSector < 5) {
    targetSector++;
  }

  if (targetSector >= 5) return;

  // 3. Draw Green Bar
  const el = document.createElement("div");
  el.className = "sector-highlight";

  const sizePct = 20; // 20% height or width
  const posPct = targetSector * 20;

  if (isVerticalMap) {
    // Vertical Map: Rows
    el.style.left = "0%";
    el.style.width = "100%";
    // Note: targetSector 0 is North (Top). CSS Top 0% is Top.
    // So we just use posPct directly for Top.
    el.style.top = `${posPct}%`;
    el.style.height = `${sizePct}%`;
  } else {
    // Horizontal Map: Columns
    el.style.top = "0%";
    el.style.height = "100%";
    el.style.left = `${posPct}%`;
    el.style.width = `${sizePct}%`;
  }

  sectorLayer.appendChild(el);
}

// ====================== GREEN HIGHLIGHT (Placement Mode) ======================
function updatePlacementSectorVisuals() {
  let sectorLayer = document.getElementById("sectorLayer");
  if (!sectorLayer) {
    sectorLayer = document.createElement("div");
    sectorLayer.id = "sectorLayer";
    sectorLayer.className = "sector-layer";
    const mapStage = document.getElementById("mapStage");
    const gridLayer = document.getElementById("gridLayer");
    mapStage.insertBefore(sectorLayer, gridLayer);
  }

  sectorLayer.innerHTML = "";
  if ((!placementMode && !moveMode) || !activeFaction) return;

  // === DYNAMIC: Find correct home sector from the faction's own guns ===
  const mapConfig = MAP_DATABASE[activeMapKey];
  const isVerticalMap = mapConfig && mapConfig.gunSort === "x";

  const friendlyGuns = currentStrongpoints.filter(
    (p) => p.team === activeFaction && p.type === "point",
  );

  if (friendlyGuns.length === 0) return;

  const allowedSector = getPointSector(friendlyGuns[0], isVerticalMap);

  // Draw GREEN highlight
  const el = document.createElement("div");
  el.className = "sector-highlight";
  const sizePct = 20;
  const posPct = allowedSector * 20;

  if (isVerticalMap) {
    el.style.left = "0%";
    el.style.width = "100%";
    el.style.top = `${posPct}%`;
    el.style.height = `${sizePct}%`;
  } else {
    el.style.top = "0%";
    el.style.height = "100%";
    el.style.left = `${posPct}%`;
    el.style.width = `${sizePct}%`;
  }
  sectorLayer.appendChild(el);
}

// --- CALCULATION LOGIC HELPERS ---
function getMilFromTable(distance, factionName) {
  if (!factionName) return 0;
  let key = "US";
  const f = factionName.toUpperCase();

  // Updated to catch both Database labels and Manual Calc short-codes
  if (f.includes("GER") || f.includes("AXIS") || f.includes("AFRIKA"))
    key = "GER";
  else if (f.includes("SOVIET") || f.includes("RUS")) key = "RUS";
  else if (f.includes("BRITISH") || f.includes("ALLIES") || f.includes("GB"))
    key = "GB";
  else key = "US";

  const data = ARTY_DATA[key];
  if (!data || distance < data.minDist || distance > data.maxDist) return null;

  for (let i = 0; i < data.table.length - 1; i++) {
    const rowA = data.table[i];
    const rowB = data.table[i + 1];

    if (distance >= rowA.dist && distance <= rowB.dist) {
      const rangeDist = rowB.dist - rowA.dist;
      const rangeMil = rowB.mil - rowA.mil;
      const ratio = (distance - rowA.dist) / rangeDist;
      const exactMil = rowA.mil + rangeMil * ratio;
      return Math.round(exactMil);
    }
  }
  return null;
}

// --- HELPER: Calculate which Sector (0-4) a point belongs to ---
function getPointSector(point, isVerticalMap) {
  const OFFSET = 100000;
  const SECTOR_SIZE = 40000;

  let idx;
  if (isVerticalMap) {
    // Vertical (North-South) Maps (e.g., Driel)
    // Y goes from +100k (North) to -100k (South).
    // Standard calc makes South=0. We want North=0.
    // So we INVERT it: 4 - index.
    const rawIdx = Math.floor((point.gameY + OFFSET) / SECTOR_SIZE);
    idx = 4 - rawIdx;
  } else {
    // Horizontal (West-East) Maps (e.g., Carentan)
    // X goes from -100k (West) to +100k (East).
    // Standard calc makes West=0. This is correct.
    idx = Math.floor((point.gameX + OFFSET) / SECTOR_SIZE);
  }

  // Safety Clamp (Just in case point is slightly off-map)
  if (idx < 0) idx = 0;
  if (idx > 4) idx = 4;

  return idx;
}

/**
 * FIX #4: Single source of truth for sector placement validation.
 * Previously this logic was copy-pasted verbatim in two places:
 *   1. placeCustomArtillery()
 *   2. The move-mode block inside the map click handler
 * Both now call this function so a change in one place applies everywhere.
 *
 * @param {number} gameX  - Game-coordinate X of the position to test
 * @param {number} gameY  - Game-coordinate Y of the position to test
 * @param {number} w      - Natural pixel width of the map image
 * @param {number} h      - Natural pixel height of the map image
 * @returns {boolean} true if the position is inside the faction's allowed sector
 */
function isPositionInAllowedSector(gameX, gameY, w, h) {
  if (!activeFaction) return false;

  const mapConfig = MAP_DATABASE[activeMapKey];
  const isVerticalMap = mapConfig && mapConfig.gunSort === "x";

  const friendlyGuns = currentStrongpoints.filter(
    (p) => p.team === activeFaction && p.type === "point",
  );
  if (friendlyGuns.length === 0) return false;

  const allowedSector = getPointSector(friendlyGuns[0], isVerticalMap);
  const clickPixels = gameToImagePixels(gameX, gameY, w, h);

  if (isVerticalMap) {
    const sectorHeight = h / 5;
    const allowedTop = allowedSector * sectorHeight;
    const allowedBottom = allowedTop + sectorHeight;
    return clickPixels.y >= allowedTop && clickPixels.y <= allowedBottom;
  } else {
    const sectorWidth = w / 5;
    const allowedLeft = allowedSector * sectorWidth;
    const allowedRight = allowedLeft + sectorWidth;
    return clickPixels.x >= allowedLeft && clickPixels.x <= allowedRight;
  }
}

function updateSetupGuide() {
  const guideEl = document.getElementById("setupGuide");
  if (!guideEl) return;

  // ─────────────────────────────────────────────────────────────
  // NEW GUARD: Never hide or change the guide while placing/moving
  // This protects the mobile placement text when closing the target panel
  // ─────────────────────────────────────────────────────────────
  if (placementMode || moveMode) return;

  if (!filterMode) {
    guideEl.classList.add("hidden");
    guideEl.classList.remove("success");
    return;
  }

  // … (rest of your original filter-mode logic stays exactly the same)
  guideEl.classList.remove("hidden");

  const mapConfig = MAP_DATABASE[activeMapKey];
  const isVerticalMap = mapConfig && mapConfig.gunSort === "x";
  const filledSectors = new Set();

  confirmedPoints.forEach((id) => {
    const point = currentStrongpoints.find((p) => p.id === id);
    if (point) filledSectors.add(getPointSector(point, isVerticalMap));
  });

  if (filledSectors.size === 5) {
    guideEl.innerHTML = `SETUP COMPLETE <button id="btnFinishSetup" class="setup-finish-btn">FINISH</button>`;
    guideEl.classList.add("success");
    const finishBtn = document.getElementById("btnFinishSetup");
    if (finishBtn) {
      finishBtn.onclick = (e) => {
        e.stopPropagation();
        filterMode = false;
        const btn = document.getElementById("spFilterBtn");
        if (btn) btn.classList.remove("active");
        updateSetupGuide();
        renderMarkers();
        renderTargeting();
        render();
        if (navigator.vibrate) navigator.vibrate(50);
      };
    }
    return;
  }

  guideEl.classList.remove("success");
  let stepIndex = 0;
  while (filledSectors.has(stepIndex) && stepIndex < 5) stepIndex++;
  const step = stepIndex + 1;

  let suffix = "TH";
  if (step === 1) suffix = "ST";
  else if (step === 2) suffix = "ND";
  else if (step === 3) suffix = "RD";

  guideEl.innerText = `CHOOSE ${step}${suffix} STRONGPOINT`;
}

function getActiveGunCoords() {
  // 1. Active CUSTOM gun (new priority)
  if (activeCustomGunId !== null) {
    const gun = customArtillery.find(
      (g) => g.id === activeCustomGunId && g.team === activeFaction,
    );
    if (gun) return { x: gun.gameX, y: gun.gameY };
  }

  // 2. Fallback: any custom gun (when just placed)
  if (activeGunIndex === -1 && customArtillery.length > 0) {
    const factionCustomGuns = customArtillery.filter(
      (g) => g.team === activeFaction,
    );
    if (factionCustomGuns.length > 0) {
      return {
        x: factionCustomGuns[factionCustomGuns.length - 1].gameX,
        y: factionCustomGuns[factionCustomGuns.length - 1].gameY,
      };
    }
  }

  // 3. HQ guns (original logic)
  if (activeGunIndex === -1 || !currentStrongpoints) return null;

  const teamArty = currentStrongpoints.filter(
    (p) => p.team === activeFaction && p.type === "point",
  );
  if (!teamArty || teamArty.length === 0) return null;

  const mapConfig = MAP_DATABASE[activeMapKey];
  const sortMode = mapConfig ? mapConfig.gunSort : "y";
  if (sortMode === "x") teamArty.sort((a, b) => a.gameX - b.gameX);
  else teamArty.sort((a, b) => b.gameY - a.gameY);

  const index = activeGunIndex % teamArty.length;
  const gun = teamArty[index];
  return { x: gun.gameX, y: gun.gameY };
}

// ====================== BEYOND RANGE OVERLAY (always visible when gun selected) ======================
function updateBeyondRangeOverlay() {
  const beyondOverlay = document.getElementById("beyondRangeOverlay");
  if (!beyondOverlay) return;

  const gunPos = getActiveGunCoords();
  const mapImage = cached.mapImage;
  if (!gunPos || !mapImage || mapImage.naturalWidth === 0) {
    beyondOverlay.style.display = "none";
    return;
  }

  const w = mapImage.naturalWidth;
  const h = mapImage.naturalHeight;
  const gunPixel = gameToImagePixels(gunPos.x, gunPos.y, w, h);
  const radiusPx =
    1600 * ((w / getMapDimensions().width) * GAME_UNITS_PER_METER); // accurate scale

  beyondOverlay.style.setProperty("--gun-x", `${gunPixel.x}px`);
  beyondOverlay.style.setProperty("--gun-y", `${gunPixel.y}px`);
  beyondOverlay.style.setProperty("--max-range-r", `${radiusPx}px`);
  beyondOverlay.style.display = "block";
}

function updateMinRangeOverlay() {
  const minOverlay = document.getElementById("minRangeOverlay");
  if (!minOverlay) return;

  const gunPos = getActiveGunCoords();
  const mapImage = cached.mapImage;
  if (!gunPos || !mapImage || mapImage.naturalWidth === 0) {
    minOverlay.style.display = "none";
    return;
  }

  const w = mapImage.naturalWidth;
  const h = mapImage.naturalHeight;
  const gunPixel = gameToImagePixels(gunPos.x, gunPos.y, w, h);
  const radiusPx =
    MIN_RANGE_METERS * ((w / getMapDimensions().width) * GAME_UNITS_PER_METER);

  minOverlay.style.setProperty("--gun-x", `${gunPixel.x}px`);
  minOverlay.style.setProperty("--gun-y", `${gunPixel.y}px`);
  minOverlay.style.setProperty("--min-range-r", `${radiusPx}px`);
  minOverlay.style.display = "block";
}

function renderTargeting() {
  const layer = cached.markersLayer;
  const panel = cached.targetDataPanel;
  const mobileFireBtn = document.getElementById("mobileFireBtn");

  // 1. ALWAYS Clear Visuals first
  layer
    .querySelectorAll(".trajectory-visual, .impact-marker, .impact-circles-svg")
    .forEach((el) => el.remove());

  // 2. SETUP MODE GUARD
  if (filterMode) {
    if (panel) panel.classList.add("hidden");
    if (mobileFireBtn) mobileFireBtn.classList.add("hidden");
    rulerLabelPool.forEach((el) => (el.style.display = "none"));
    return;
  }

  // 3. NO TARGET GUARD
  if (!activeTarget || !getActiveGunCoords()) {
    if (panel) panel.classList.add("hidden");
    if (mobileFireBtn) mobileFireBtn.classList.add("hidden");
    rulerLabelPool.forEach((el) => (el.style.display = "none"));
    return;
  }

  // 4. SHOW PANEL + ADD X BUTTON (safe absolute positioning)
  if (panel) {
    panel.classList.remove("hidden");

    // Create X only once
    let closeBtn = panel.querySelector(".panel-close-btn");
    if (!closeBtn) {
      closeBtn = document.createElement("div");
      closeBtn.className = "panel-close-btn";
      closeBtn.innerHTML = "✕";
      closeBtn.title = "Clear target (ESC also works)";
      panel.appendChild(closeBtn);

      closeBtn.addEventListener("click", (e) => {
        e.stopImmediatePropagation();
        activeTarget = null;
        renderMarkers();
        renderTargeting();
        render();
        saveState();
        if (navigator.vibrate) navigator.vibrate(20);
      });
    }
  }

  // Mobile HUD Fire Button
  if (mobileFireBtn) {
    if (hudEnabled && IS_MOBILE) {
      mobileFireBtn.classList.remove("hidden");
    } else {
      mobileFireBtn.classList.add("hidden");
    }
  }

  // === REST OF YOUR ORIGINAL CODE (unchanged) ===
  const elDist = cached.panelDist;
  const elMil = cached.panelMil;
  const elTime = cached.panelTime;
  const elBearing = document.getElementById("panelBearing");

  const gunPos = getActiveGunCoords();
  const mapImage = cached.mapImage;
  const w = mapImage.naturalWidth;
  const h = mapImage.naturalHeight;

  const end = gameToImagePixels(activeTarget.gameX, activeTarget.gameY, w, h);
  const start = gameToImagePixels(gunPos.x, gunPos.y, w, h);

  const dims = getMapDimensions();
  const pixelsPerMeter = (w / dims.width) * GAME_UNITS_PER_METER;

  // --- A. TRAJECTORY LINE WITH RULER MARKERS (SVG) ---
  const totalDistPx = Math.sqrt(
    Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2),
  );
  const dangerZoneRadiusPx = 20.0 * pixelsPerMeter;
  const lineLength = Math.max(0, totalDistPx - dangerZoneRadiusPx);
  const angleRad = Math.atan2(end.y - start.y, end.x - start.x);

  const totalDistanceMeters = totalDistPx / pixelsPerMeter;

  // Use mobile quality setting for intervals
  const intervalMeters = MOBILE_QUALITY.rulerIntervalMeters;
  const intervalPx = intervalMeters * pixelsPerMeter;
  const tenMeterPx = 10 * pixelsPerMeter;

  const lineSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  lineSvg.setAttribute(
    "class",
    `trajectory-visual ${!rulerEnabled ? "ruler-hidden" : ""}`,
  );
  lineSvg.style.position = "absolute";
  lineSvg.style.left = `${start.x}px`;
  lineSvg.style.top = `${start.y}px`;
  lineSvg.style.overflow = "visible";
  lineSvg.style.pointerEvents = "none";
  lineSvg.style.zIndex = "100";

  lineSvg.style.transformOrigin = "0 0";
  lineSvg.style.transform = `rotate(${angleRad * (180 / Math.PI)}deg)`;

  const linePath = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "line",
  );
  linePath.setAttribute("x1", "0");
  linePath.setAttribute("y1", "0");
  linePath.setAttribute("x2", lineLength);
  linePath.setAttribute("y2", "0");

  // NEW (Fixed Pixels):
  // This makes the dashes look correct relative to the dynamic thickness
  linePath.style.strokeDasharray = "8, 6";

  lineSvg.appendChild(linePath);

  // Track how many labels we use this frame
  let poolIdx = 0;

  if (rulerEnabled) {
    const numMarkers = Math.floor(lineLength / intervalPx);
    const MAX_RULER_DIST = 1600;

    const factionLabel = cached.factionLabel.innerText;
    const cosAngle = Math.cos(angleRad);
    const sinAngle = Math.sin(angleRad);

    // PERFORMANCE: Resolve faction data once outside the loop
    let factionKey = "US";
    const f = factionLabel.toUpperCase();
    if (f.includes("GER") || f.includes("AXIS") || f.includes("AFRIKA"))
      factionKey = "GER";
    else if (f.includes("SOVIET") || f.includes("RUS")) factionKey = "RUS";
    else if (f.includes("BRITISH") || f.includes("ALLIES") || f.includes("GB"))
      factionKey = "GB";

    const factionData = ARTY_DATA[factionKey];

    for (
      let i = 2;
      i <= numMarkers && i <= MOBILE_QUALITY.maxRulerMarkers;
      i++
    ) {
      const markerX = i * intervalPx;
      const distanceAtMarker = i * intervalMeters;

      if (distanceAtMarker > MAX_RULER_DIST) break;
      if (markerX > lineLength) break;

      // NEW: Hide label if it's too close to the Impact Circle (60m Buffer)
      // This prevents the text from overlapping the red dispersion visual.
      if (totalDistanceMeters - distanceAtMarker < 40) continue;

      // PERFORMANCE: Use resolved data directly instead of calling getMilFromTable
      let mils = null;
      if (
        factionData &&
        distanceAtMarker >= factionData.minDist &&
        distanceAtMarker <= factionData.maxDist
      ) {
        for (let j = 0; j < factionData.table.length - 1; j++) {
          const rowA = factionData.table[j];
          const rowB = factionData.table[j + 1];
          if (distanceAtMarker >= rowA.dist && distanceAtMarker <= rowB.dist) {
            const rangeDist = rowB.dist - rowA.dist;
            const rangeMil = rowB.mil - rowA.mil;
            const ratio = (distanceAtMarker - rowA.dist) / rangeDist;
            // --- FIX: Round the result to remove half-integers ---
            mils = Math.round(rowA.mil + rangeMil * ratio);
            break;
          }
        }
      }

      // 1. Draw the Red Ball (SVG is fast, keep creating these)
      const tick = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle",
      );
      tick.setAttribute("cx", markerX);
      tick.setAttribute("cy", "0");
      tick.setAttribute("r", "3");
      tick.setAttribute("class", "ruler-tick");
      lineSvg.appendChild(tick);

      // 2. OPTIMIZED LABEL POOLING
      const labelX = start.x + cosAngle * markerX;
      const labelY = start.y + sinAngle * markerX;

      // Recycle existing div or create new one
      let milLabel = rulerLabelPool[poolIdx];

      if (!milLabel) {
        milLabel = document.createElement("div");
        milLabel.className = "ruler-mil-label";
        // FIX: Use 0,0 and move with transform for performance
        milLabel.style.left = "0px";
        milLabel.style.top = "0px";
        rulerLabelPool.push(milLabel);
      }

      // If renderMarkers() wiped the layer, we must re-attach the pooled element
      if (milLabel.parentNode !== layer) {
        layer.appendChild(milLabel);
      }

      milLabel.style.display = "block";

      // FIX: Use 2D translate. Safer for memory, prevents checkerboarding, still fast.
      milLabel.style.transform = `translate(${labelX}px, ${labelY}px) translate(-50%, -100%)`;

      // PERF FIX: Avoid innerHTML (triggers HTML parser on every update).
      // Pre-create child elements once; after that just update textContent.
      if (!milLabel.firstChild) {
        const milDiv = document.createElement("div");
        milDiv.className = "mil-value";
        const subDiv = document.createElement("div");
        subDiv.className = "meter-subtext";
        milLabel.appendChild(milDiv);
        milLabel.appendChild(subDiv);
      }
      milLabel.firstChild.textContent = mils !== null ? String(mils) : "---";
      milLabel.lastChild.textContent = `${distanceAtMarker}m`;

      poolIdx++;
    }
  }

  // HIDE UNUSED LABELS (Don't delete them)
  for (let k = poolIdx; k < rulerLabelPool.length; k++) {
    rulerLabelPool[k].style.display = "none";
  }

  layer.prepend(lineSvg);

  // --- B. IMPACT CIRCLES (SVG) ---
  const circleSvg = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg",
  );
  circleSvg.setAttribute("class", "impact-circles-svg");

  circleSvg.style.position = "absolute";
  circleSvg.style.left = `${Math.round(end.x)}px`;
  circleSvg.style.top = `${Math.round(end.y)}px`;

  // Ensure the SVG itself has no width/height that pushes the contents
  circleSvg.style.width = "1px";
  circleSvg.style.height = "1px";
  circleSvg.style.overflow = "visible";

  function createSvgCircle(radiusMeters, className) {
    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle",
    );
    const rPx = radiusMeters * pixelsPerMeter;
    circle.setAttribute("cx", "0");
    circle.setAttribute("cy", "0");
    circle.setAttribute("r", rPx);
    circle.setAttribute("class", className);
    return circle;
  }

  circleSvg.appendChild(createSvgCircle(20.0, "dispersion-circle"));
  circleSvg.appendChild(createSvgCircle(10.0, "deadzone-circle"));
  circleSvg.appendChild(createSvgCircle(5.0, "blast-circle"));

  layer.appendChild(circleSvg);

  // --- C. CENTER CROSS (THE X) ---
  const marker = document.createElement("div");
  marker.className = "impact-marker";
  // FIX: Use Math.round here as well
  marker.style.left = `${Math.round(end.x)}px`;
  marker.style.top = `${Math.round(end.y)}px`;

  layer.appendChild(marker);

  // ====================== BEYOND MAX RANGE DARKEN OVERLAY ======================
  updateBeyondRangeOverlay();
  updateMinRangeOverlay(); // ← add this
  // ============================================================================

  // 4. UPDATE DASHBOARD
  if (elDist) elDist.innerText = `${Math.round(totalDistanceMeters)}m`;

  // --- RECALCULATE MIL FROM CURRENT GUN POSITION ---
  // This ensures the mil is always correct for the currently selected gun
  const factionLabel = cached.factionLabel.innerText;
  const currentMil = getMilFromTable(
    Math.round(totalDistanceMeters),
    factionLabel,
  );
  // Update activeTarget to keep them in sync
  activeTarget.distance = Math.round(totalDistanceMeters);
  activeTarget.mil = currentMil;
  // ------------------------------------------------

  // --- NEW: COMPASS BEARING CALCULATION ---
  if (elBearing) {
    const dx = activeTarget.gameX - gunPos.x;
    const dy = activeTarget.gameY - gunPos.y;

    // Calculate degrees (0 = North, 90 = East)
    let bearing = Math.atan2(dx, dy) * (180 / Math.PI);

    // Normalize negative angles (-90 -> 270)
    if (bearing < 0) bearing += 360;

    // Round to 1 decimal place for precision (or 0 if you prefer integers)
    elBearing.innerText = Math.floor(bearing) + "°";
  }
  // ----------------------------------------

  if (currentMil) {
    if (elMil) {
      elMil.innerText = currentMil;
      elMil.className = "data-value val-huge";
    }
    if (elTime) {
      elTime.innerText = "24s";
      // FIX: Change 'val-small' to 'val-mid' to match Distance/Bearing
      elTime.className = "data-value val-mid text-green";
    }
  } else {
    if (elMil) {
      elMil.innerText = "OUT";
      elMil.className = "data-value text-red";
    }
    if (elTime) {
      elTime.innerText = "---";
      // FIX: Change 'val-small' to 'val-mid' here too
      elTime.className = "data-value val-mid";
    }
    if (elBearing) elBearing.innerText = "---"; // Hide bearing if out of range? Optional.
  }
}

// === FIX: SYNCHRONOUS RENDER (Prevents Chrome Checkerboards) ===
function render() {
  // PERFORMANCE FIX: Use cached rect - only updated on resize
  const mapContainer = cached.mapContainer;
  if (mapContainer && !_mapRectCache) {
    // Initialize cache on first render
    _mapRectCache = mapContainer.getBoundingClientRect();
    _mapRectTime = Date.now();
  }

  clampPosition();
  const drawScale = state.scale * state.fitScale;
  const markersLayer = cached.markersLayer;

  // 1. CSS Variables
  if (mapContainer)
    mapContainer.style.setProperty("--current-scale", drawScale);
  const mapStage = cached.mapStage;
  mapStage.style.setProperty("--effective-zoom", drawScale);

  // --- FIREFOX SPECIFIC LAYER PROMOTION ---
  if (isFirefox) {
    // FIX: Only apply will-change if we are actually zoomed in or panning.
    // At 1.0 scale, we remove it to ensure crisp grid rendering.
    if (state.scale > 1.01) {
      if (mapStage.style.willChange !== "transform")
        mapStage.style.willChange = "transform";
      if (markersLayer && markersLayer.style.willChange !== "transform")
        markersLayer.style.willChange = "transform";
    } else {
      // Force removal at 1x to stop texture blurring
      mapStage.style.willChange = "auto";
      if (markersLayer) markersLayer.style.willChange = "auto";
    }
  }

  // --- MOBILE-AWARE ARTILLERY ICON SCALING ---
  const isMobileScreen = IS_MOBILE;
  const baseIconSize = isMobileScreen ? 300 : 128; // ← bigger base on mobile (20× zoom)

  const normalizedZoom = Math.max(
    0,
    Math.min(1, (state.scale - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)),
  );
  const viewScale = 1.0 / ((MAX_ZOOM - 1.0) * normalizedZoom + 1.0);
  const dynSize = baseIconSize * viewScale;
  mapContainer.style.setProperty("--dynamic-icon-size", `${dynSize}px`);

  // --- DYNAMIC STROKE SCALING ---
  const isMob = IS_MOBILE;
  const strokeBase = isMob ? 10 : 8;
  const strokeExp = isMob ? 0.5 : 0.6;
  const dynStroke = strokeBase / Math.pow(state.scale, strokeExp);
  const finalStroke = Math.max(1.5, Math.min(10, dynStroke));
  mapContainer.style.setProperty("--dynamic-stroke", `${finalStroke}px`);

  const dynCircleStroke =
    (strokeBase * 0.75) / Math.pow(state.scale, strokeExp);
  const finalCircleStroke = Math.max(1.0, Math.min(8, dynCircleStroke));
  mapContainer.style.setProperty(
    "--dynamic-circle-stroke",
    `${finalCircleStroke}px`,
  );

  // 2. Move Map (Conditional Precision)
  const isHighDPI = _cachedDPR; // use cached value — window.devicePixelRatio on every frame is wasteful

  // Use floats only if zoomed in or on HighDPI, otherwise snap to integers for 1x sharpness
  const useFloats = isHighDPI || (isFirefox && state.scale > 1.05);

  const finalX = useFloats ? state.pointX : Math.round(state.pointX);
  const finalY = useFloats ? state.pointY : Math.round(state.pointY);

  const transformString = `translate(${finalX}px, ${finalY}px) scale(${drawScale})`;

  // A. Apply to Map Image
  mapStage.style.transform = transformString;

  // B. Apply to Markers Layer
  if (markersLayer) {
    markersLayer.style.transform = transformString;
  }

  // 3. Update Text & Grid
  updateRealScale(drawScale);
  const zoomIndicator = cached.zoomIndicator;
  if (zoomIndicator) zoomIndicator.innerText = `${state.scale.toFixed(1)}x`;

  // --- FIREFOX OPTIMIZATION START: BATCH LABEL UPDATE ---
  const isMobile = IS_MOBILE;
  const mobileScaleMultiplier = isMobile ? 2.5 : 1.0;

  const TRANSITION_START_ZOOM = 1.0;
  const TRANSITION_END_ZOOM = 5.0;

  let progress =
    (state.scale - TRANSITION_START_ZOOM) /
    (TRANSITION_END_ZOOM - TRANSITION_START_ZOOM);
  progress = Math.max(0, Math.min(1, progress));

  const topVal = progress * 50;
  const transY = -100 + progress * 50;
  const gap = -20 + progress * 20;
  const arrowOp = Math.max(0, 1 - progress * 1.6);

  const exponent = isMobile ? 0.85 : 0.6;
  const smoothInverse = 1.0 / Math.pow(state.scale, exponent);
  const finalScale = smoothInverse * mobileScaleMultiplier;

  if (markersLayer) {
    markersLayer.style.setProperty("--label-arrow-op", arrowOp);
    markersLayer.style.setProperty("--label-top", `${topVal}%`);
    markersLayer.style.setProperty(
      "--label-transform",
      `translate(-50%, calc(${transY}% + ${gap}px)) scale(${finalScale})`,
    );
  }
  // --- FIREFOX OPTIMIZATION END ---

  // Update Grid Thickness
  const majorThickness = Math.max(1.0, 2.0 / drawScale);
  const gridLayer = cached.getElem("gridLayer"); // use element cache instead of getElementById each frame
  if (gridLayer) {
    // Only write the CSS variable when the value actually changes (panning doesn't change thickness)
    if (majorThickness !== _lastMajorThickness) {
      gridLayer.style.setProperty("--major-width", `${majorThickness}px`);
      _lastMajorThickness = majorThickness;
    }

    // Use the existing cachedSubGrid instead of a fresh querySelector every frame
    if (!cachedSubGrid) cachedSubGrid = gridLayer.querySelector(".keypad-grid");
    const subGrid = cachedSubGrid;
    if (subGrid) {
      subGrid.style.opacity = state.scale >= 3.0 ? "0.4" : "0";
      const minorThickness = Math.max(1.0, 1.0 / drawScale);
      gridLayer.style.setProperty("--minor-width", `${minorThickness}px`);
    }
  }

  updateStickyLabels(drawScale);
  if (window.updateZoomSliderUI) window.updateZoomSliderUI();
  updateMobileHud();
  updateDesktopRingScale();
  updateMapCursor(); // ← add this line
}

// ... (rest of the code remains the same)

let _lastScaleTextEnd = "";
let _lastScaleTextMid = "";

function updateRealScale(effectiveZoom) {
  const mapImg = cached.mapImage;
  if (!mapImg || mapImg.naturalWidth === 0) return;

  // 1. GET GRID DIMENSIONS (2000m SDK logic)
  const TOTAL_PLAYABLE_METERS = 2000;

  // 2. CALCULATE PIXELS PER METER
  const currentMapPixelWidth = mapImg.naturalWidth * effectiveZoom;
  const pixelsPerMeter = currentMapPixelWidth / TOTAL_PLAYABLE_METERS;

  // 3. Select BAR SIZE BASED ON ZOOM
  const isMobile = IS_MOBILE;
  let barMeters;

  if (isMobile) {
    barMeters = 600;
    if (state.scale > 1.5) barMeters = 400;
    if (state.scale > 2.5) barMeters = 200;
    if (state.scale > 5.0) barMeters = 100;
    if (state.scale > 10.0) barMeters = 50;
    if (state.scale > 18.0) barMeters = 20;
  } else {
    barMeters = 400;
    if (state.scale > 1.5) barMeters = 200;
    if (state.scale > 3.0) barMeters = 100;
    if (state.scale > 7.0) barMeters = 50;
    if (state.scale > 9.0) barMeters = 20;
  }

  // 4. APPLY TO UI (Using Cache)
  const barPixelsRounded = Math.round(barMeters * pixelsPerMeter);

  // Use Cached Elements
  const scaleWrapper = cached.scaleWrapper;
  const elMid = cached.scaleTextMid;
  const elEnd = cached.scaleTextEnd;

  if (scaleWrapper) scaleWrapper.style.width = `${barPixelsRounded}px`;

  // Optimization: Only write text if it changed
  const midText = `${barMeters / 2}m`;
  const endText = `${barMeters}m`;

  if (elMid && elMid.innerText !== midText) elMid.innerText = midText;
  if (elEnd && elEnd.innerText !== endText) elEnd.innerText = endText;
}

function updateDimensions() {
  const mapImage = document.getElementById("mapImage");
  const mapContainer = cached.mapContainer;

  // FIX: Check naturalWidth to prevent "Stuck Zoom" bug on browser restore
  if (!mapImage.complete || mapImage.naturalWidth === 0) return;
  if (!mapContainer) return;

  // PERFORMANCE FIX: Use cached rect if fresh (from render loop)
  const rect =
    _mapRectCache && Date.now() - _mapRectTime < 100
      ? _mapRectCache
      : mapContainer.getBoundingClientRect();

  state.fitScale = Math.min(
    rect.width / mapImage.naturalWidth,
    rect.height / mapImage.naturalHeight,
  );

  if (IS_MOBILE) {
    MAX_ZOOM = 20;
  } else {
    MAX_ZOOM = 10;
  }

  if (state.scale < MIN_ZOOM) state.scale = MIN_ZOOM;
  if (state.scale > MAX_ZOOM) state.scale = MAX_ZOOM;
}

function centerMap() {
  const mapImage = document.getElementById("mapImage");
  const mapContainer = cached.mapContainer;
  if (!mapContainer) return;
  state.scale = MIN_ZOOM;
  // PERFORMANCE FIX: Use cached rect if available
  const rect = _mapRectCache || mapContainer.getBoundingClientRect();
  state.pointX = (rect.width - mapImage.naturalWidth * state.fitScale) / 2;
  state.pointY = (rect.height - mapImage.naturalHeight * state.fitScale) / 2;

  toggleSubGrid(state.scale);
  render();
}

function initMap() {
  // --- 1. DOM RESTRUCTURING (Fix Z-Index Stacking) ---
  const markersLayer = cached.markersLayer;
  const mapContainer = cached.mapContainer;
  const mapImage = cached.mapImage;

  if (markersLayer && mapContainer && mapImage) {
    // Move markers layer if needed
    if (markersLayer.parentElement !== mapContainer) {
      mapContainer.appendChild(markersLayer);
    }

    // --- FIX: Sizing for Clipping ---
    // Force the layer to match the image size exactly.
    // This ensures 'overflow: hidden' cuts off the circle at the map edge.
    if (mapImage.naturalWidth > 0 && mapImage.naturalHeight > 0) {
      markersLayer.style.width = `${mapImage.naturalWidth}px`;
      markersLayer.style.height = `${mapImage.naturalHeight}px`;
    }

    // Visual Order & Transform Origin
    markersLayer.style.zIndex = "110";
    markersLayer.style.transformOrigin = "0 0";
  }
  // ---------------------------------------------------

  const controlsDrawer = document.getElementById("controlsDrawer");
  if (controlsDrawer) {
    if (window.savedPanelHidden) {
      controlsDrawer.classList.add("closed");
    } else {
      controlsDrawer.classList.remove("hidden-by-default");
    }
  }

  updateDimensions();
  centerMap();
  buildGrid();

  // ====================== BEYOND MAX RANGE OVERLAY (created once) ======================
  let beyondOverlay = document.getElementById("beyondRangeOverlay");
  if (!beyondOverlay) {
    beyondOverlay = document.createElement("div");
    beyondOverlay.id = "beyondRangeOverlay";
    cached.mapStage.appendChild(beyondOverlay);
  }
  // ====================================================================================

  // ====================== MIN RANGE OVERLAY (created once) ======================
  let minOverlay = document.getElementById("minRangeOverlay");
  if (!minOverlay) {
    minOverlay = document.createElement("div");
    minOverlay.id = "minRangeOverlay";
    cached.mapStage.appendChild(minOverlay);
  }
  // ====================================================================================

  renderMarkers();
  renderTargeting();
  currentZoomLevel = state.scale;

  mapContainer.style.cursor = "";

  render();

  mapContainer.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    return false;
  });
}

// ==========================================
// VISUAL MAP SelectOR (MODAL LOGIC)
// ==========================================

function initMapSelector() {
  const btn = document.getElementById("openMapBtn");
  const searchInput = document.getElementById("mapSearchInput");
  const clearBtn = document.getElementById("clearSearchBtn");

  if (btn) btn.addEventListener("click", openMapSelector);

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase();
      renderMapGrid(searchTerm);
    });
  }

  // --- ADD CLEAR BUTTON LOGIC ---
  if (clearBtn && searchInput) {
    const clearAction = (e) => {
      e.preventDefault();
      searchInput.value = "";
      searchInput.focus();
      renderMapGrid(""); // Reset grid to show all maps
    };

    clearBtn.addEventListener("click", clearAction);
    clearBtn.addEventListener("touchstart", clearAction, { passive: false });
  }

  // Close buttons
  const modal = document.getElementById("mapModal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeMapSelector();
    });
  }

  const closeBtn = document.getElementById("closeModalBtn");
  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      closeMapSelector();
    });
    closeBtn.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        closeMapSelector();
      },
      { passive: false },
    );
  }

  // --- NEW BUTTONS ---
  const btnManual = document.getElementById("btnManualCalc");
  if (btnManual) {
    btnManual.addEventListener("click", () => {
      closeMapSelector(); // Close map Selector
      openManualCalculator(); // Open new calc
    });
  }
}

// ==========================================
// IMPROVED MAP GRID RENDERING WITH DATASET
// ==========================================
let isGridFull = false;

function renderMapGrid(filter = "") {
  const grid = document.getElementById("mapGrid");
  if (!grid) return;
  const cleanFilter = filter
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  // --- QUICK HIGHLIGHT ONLY (When no filter and grid already full) ---
  if (cleanFilter === "" && isGridFull && grid.hasChildNodes()) {
    grid.querySelectorAll(".map-card").forEach((card) => {
      const cardKey = card.dataset.mapKey || "";
      card.classList.toggle("active", cardKey === activeMapKey);
    });
    return;
  }

  // --- FULL REBUILD ---
  grid.innerHTML = "";
  const sortedKeys = Object.keys(MAP_DATABASE).sort((a, b) =>
    MAP_DATABASE[a].name.localeCompare(MAP_DATABASE[b].name),
  );

  sortedKeys.forEach((key) => {
    const mapData = MAP_DATABASE[key];
    const cleanName = mapData.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    if (cleanFilter !== "" && !cleanName.includes(cleanFilter)) return;

    const card = document.createElement("div");
    card.className = "map-card";
    card.dataset.mapKey = key; // <-- RELIABLE KEY STORAGE
    if (key === activeMapKey) card.classList.add("active");

    card.onclick = () => SelectMapFromGrid(key);

    const img = document.createElement("img");
    img.className = "map-card-img";
    img.alt = mapData.name;

    // Use a simpler loading approach to prevent "stuck" hidden images
    const imgPath = mapData.thumbnail || mapData.image;
    img.src = imgPath;

    // If image fails, show a fallback background color
    img.onerror = () => {
      img.style.display = "none";
      card.style.background = "#222";
    };

    const label = document.createElement("div");
    label.className = "map-card-name";
    label.innerText = mapData.name;

    // Add info button if history data exists
    if (mapData.history) {
      const infoBtn = document.createElement("button");
      infoBtn.className = "map-info-btn";
      infoBtn.innerHTML =
        '<svg viewBox="0 0 26 26" width="26" height="26"><circle cx="13" cy="13" r="11" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2"/><path d="M18 7H8c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM8 9h4v5l-2-1.5L8 14V9z" fill="rgba(255,255,255,0.9)"/></svg>';
      infoBtn.title = "View map history";
      infoBtn.onclick = (e) => {
        e.stopPropagation();
        openMapHistory(key);
      };
      card.appendChild(infoBtn);
    }

    card.appendChild(img);
    card.appendChild(label);
    grid.appendChild(card);
  });

  isGridFull = cleanFilter === "";
}

// ==========================================
// OPEN MAP SelectOR - ALWAYS REFRESH HIGHLIGHT
// ==========================================
function openMapSelector() {
  const searchInput = document.getElementById("mapSearchInput");

  // Always clear any lingering search and refresh the grid
  if (searchInput) {
    searchInput.value = "";
  }

  // THIS IS THE KEY FIX: Always refresh the grid when opening
  // → Ensures the green highlight is always correct for the current activeMapKey
  renderMapGrid("");

  document.getElementById("mapModal").classList.add("active");
}

// ==========================================
// CLOSE MAP SelectOR
// ==========================================
function closeMapSelector() {
  const modal = document.getElementById("mapModal");
  const searchInput = document.getElementById("mapSearchInput");

  if (modal) {
    modal.classList.remove("active");
  }

  // Optional: Reset search when closing
  if (searchInput) {
    searchInput.value = "";
    renderMapGrid("");
  }
}

// ==========================================
// KEY FIXES APPLIED
// ==========================================
// 1. Map save state now works correctly on refresh
//    → activeMapKey is set immediately on Selection and saved before switchMap()
// 2. Map Selection panel green highlight now appears correctly
//    → renderMapGrid("") is called after activeMapKey is updated
// 3. Flicker/text flicker when switching maps is eliminated
//    → Current map name, faction UI, gun UI, and strongpoints are updated immediately
//    → Fade-out/fade-in is smoother with proper transition handling
//    → Loading overlay stays until fully ready

function SelectMapFromGrid(key) {
  closeMapSelector();

  // 1. Reset Global Targeting State
  activeTarget = null;

  // 2. FORCE RESET: Clear both Gun and Faction on map change
  activeGunIndex = -1;
  activeFaction = null; // <--- NEW: Force faction Selection

  // 3. Reset Slider State
  trajSliderEnabled = false;
  const trajToggleBtn = document.getElementById("trajToggleBtn");
  const trajContainer = document.getElementById("trajSliderContainer");

  if (trajToggleBtn) trajToggleBtn.classList.remove("active");
  if (trajContainer) trajContainer.classList.add("hidden");

  // 4. Reset Filters
  filterMode = false;
  confirmedPoints.clear();
  const btn = document.getElementById("spFilterBtn");
  if (btn) btn.classList.remove("active");

  // Remove old overlay if it exists
  const layer = document.getElementById("sectorLayer");
  if (layer) layer.innerHTML = "";

  // 5. Update Page Config
  const config = MAP_DATABASE[key];
  if (!config) return;

  activeMapKey = key;
  currentStrongpoints = config.strongpoints || [];

  updatePageTitle(config.name);

  const currentMapLbl = document.getElementById("currentMapName");
  if (currentMapLbl) currentMapLbl.innerText = config.name;

  updateFactionUI(config); // Will now see null and show "Select TEAM"
  updateGunUI(config); // Will now see -1 and show "Select GUN"

  // Save new map Selection immediately
  saveState();

  // Highlight Selected card in the grid
  renderMapGrid("");

  // 6. Trigger Map Transition
  switchMap(key);
}

function switchMap(mapKey) {
  if (!MAP_DATABASE[mapKey]) return;

  const mapStage = cached.mapStage;
  const imgElement = cached.mapImage;
  const markersLayer = cached.markersLayer;

  // 1. Hide old map image immediately to prevent flicker
  imgElement.style.opacity = "0";

  // Fade out map stage
  if (mapStage) {
    mapStage.style.transition = "opacity 0.2s ease-out";
    mapStage.style.opacity = "0";
  }

  // Clear old markers immediately
  if (markersLayer) markersLayer.innerHTML = "";

  // Show loading overlay
  showLoading();

  const config = MAP_DATABASE[mapKey];

  // 2. Runs once the image is both downloaded AND decoded.
  function onImageReady() {
    activeMapKey = mapKey;
    currentStrongpoints = config.strongpoints || [];

    // === CRITICAL RESET FOR CUSTOM GUNS ===
    customArtillery = [];
    nextCustomGunId = 1;

    // Clean up memory leak
    rulerLabelPool.forEach((label) => label.remove());
    rulerLabelPool = [];
    activeGunIndex = -1;
    activeCustomGunId = null;
    placementMode = false;
    moveMode = false;
    movingGunId = null;
    updateMapCursor();
    // =====================================

    // Re-build grid and markers for new map dimensions
    buildGrid();
    initMap();

    // Force gun label back to default (prevents stale "CUSTOM GUN 1")
    const label = document.getElementById("gunLabel");
    if (label) {
      label.innerText = "Select GUN";
      label.style.color = "#ffc107";
    }

    // Update UI to refresh dropdown (clear custom guns)
    updateGunUI(config);
    updateGunDropdownUI();

    // Final render
    renderMarkers();
    renderTargeting();
    render();

    // Fade in new map
    imgElement.style.opacity = "1";
    if (mapStage) {
      mapStage.style.opacity = "1";
      setTimeout(() => {
        mapStage.style.transition = "opacity 0.3s ease-in-out";
      }, 50);
    }

    hideLoading();
  }

  // 3. Trigger load, then pre-decode before the first paint.
  //    img.decode() resolves only after the browser has fully decompressed the
  //    image data into a paintable bitmap — eliminating the "Image decoding"
  //    spike that was appearing synchronously on the paint thread in the profiler.
  //    Add cache-busting to ensure fresh image is loaded (not from service worker cache)
  imgElement.src = config.image + "?t=" + Date.now();
  imgElement
    .decode()
    .then(onImageReady)
    .catch(() => {
      // decode() rejects if the fetch fails; fall back to onload so the spinner
      // eventually clears and the error overlay can handle it gracefully.
      imgElement.onload = function () {
        onImageReady();
        imgElement.onload = null;
      };
    });
}

// ==========================================
// FLAG IMAGE HELPER
// ==========================================
// ==========================================
// FLAG IMAGE HELPER (ROBUST VERSION)
// ==========================================
function getFlagImage(teamName) {
  if (!teamName) return "images/flags/us.webp";

  const lower = teamName.toLowerCase();

  // GB / British / Allies (Maps like El Alamein/Driel)
  if (
    lower === "gb" ||
    lower.includes("british") ||
    lower.includes("8th") ||
    lower.includes("allies")
  ) {
    return "images/flags/gb.webp";
  }

  // Soviet / Russian
  if (
    lower === "rus" ||
    lower === "sov" ||
    lower.includes("soviet") ||
    lower.includes("rus")
  ) {
    return "images/flags/rus.webp";
  }

  // German / Axis
  if (
    lower === "ger" ||
    lower.includes("germany") ||
    lower.includes("axis") ||
    lower.includes("afrika")
  ) {
    return "images/flags/ger.webp";
  }

  // Default to US for everything else (US, United States, Allies)
  return "images/flags/us.webp";
}

// ==========================================
// FACTION UI UPDATES
// ==========================================
function updateFactionUI(config) {
  // 1. Get current Team Names from Database
  const t1Label = config?.teams?.t1 || "UNITED STATES";
  const t2Label = config?.teams?.t2 || "GERMANY";

  // 2. Get correct flags
  const t1Flag = getFlagImage(t1Label);
  const t2Flag = getFlagImage(t2Label);

  // 3. Update Dropdown Items (The hidden list)
  const item1 = document.querySelector('.dropdown-item[data-value="us"]');
  const item2 = document.querySelector('.dropdown-item[data-value="ger"]');

  if (item1) {
    item1.querySelector(".item-text").innerText = t1Label;
    item1.querySelector(".item-flag").src = t1Flag;
  }
  if (item2) {
    item2.querySelector(".item-text").innerText = t2Label;
    item2.querySelector(".item-flag").src = t2Flag;
  }

  // 4. THE FIX: Handle "No Faction Selected" State
  const mainLabel = document.getElementById("factionLabel");
  const mainFlag = document.getElementById("currentFactionFlag");

  if (mainLabel && mainFlag) {
    if (activeFaction === null) {
      // STATE: No Selection
      mainLabel.innerText = "Select TEAM";
      mainLabel.style.color = "#ffc107"; // Tactical Yellow
      mainFlag.style.display = "none"; // Hide flag until Selected
    } else {
      // STATE: Selected
      mainLabel.style.color = "#ffffff"; // White
      mainFlag.style.display = "inline-block"; // Show flag

      if (activeFaction === "us" || activeFaction === "allies") {
        mainLabel.innerText = t1Label;
        mainFlag.src = t1Flag;
      } else {
        mainLabel.innerText = t2Label;
        mainFlag.src = t2Flag;
      }
    }
  }
}

// ==========================================
// UPDATED GUN UI - Multi custom-gun selection + max 3 limit
// ==========================================
function updateGunUI(config) {
  const gunNames = config.guns || [
    "Gun 1 (Left)",
    "Gun 2 (Mid)",
    "Gun 3 (East)",
  ];
  const gunDropdown = document.getElementById("gunDropdown");
  const menu = gunDropdown ? gunDropdown.querySelector(".dropdown-menu") : null;
  const label = document.getElementById("gunLabel");

  if (!menu || !label) return;

  menu.innerHTML = "";

  // 1. + ADD GUN (top)
  const addBtn = document.createElement("div");
  addBtn.id = "btnAddGunAction";
  addBtn.className = "dropdown-item";
  addBtn.style.color = "#ffc107";
  addBtn.style.fontWeight = "900";
  addBtn.textContent = "+ ADD GUN";

  addBtn.addEventListener("click", (e) => {
    e.stopPropagation();

    // === existing faction warning code (keep it exactly as-is) ===
    if (!activeFaction) {
      const label = document.getElementById("gunLabel");
      if (label) {
        label.innerText = "SELECT TEAM FIRST";
        label.style.color = "#ff4444"; // Red for attention
      }

      // Optional haptic feedback
      if (navigator.vibrate) navigator.vibrate([30, 20]);

      // Also show message in the guide area
      const guideEl = document.getElementById("setupGuide");
      if (guideEl) {
        guideEl.classList.remove("hidden", "success");
        guideEl.innerHTML = `<span style="color:#ff4444;font-weight:900;">CHOOSE FACTION FIRST</span>`;
        // Auto-hide after 2.2 seconds
        setTimeout(() => {
          if (!placementMode && guideEl) guideEl.classList.add("hidden");
        }, 2200);
      }

      // Close dropdown
      menu.classList.add("hidden");
      document.getElementById("gunBtn").classList.remove("active");
      return; // ← STOP HERE - do not enable placement
    }

    const teamCustomCount = customArtillery.filter(
      (g) => g.team === activeFaction,
    ).length;
    if (teamCustomCount >= 3) {
      alert("Maximum 3 custom guns allowed per team.");
      return;
    }

    menu.classList.add("hidden");
    document.getElementById("gunBtn").classList.remove("active");

    placementMode = true;
    moveMode = false;
    movingGunId = null;
    activeCustomGunId = null;

    // Close target data panel when entering placement mode
    if (cached.targetDataPanel) {
      cached.targetDataPanel.classList.add("hidden");
    }

    // === NEW: AUTO-DISABLE LIVE HUD (desktop + mobile) ===
    hudEnabled = false;
    syncToggleUI();
    updateMapCursor();
    // =====================================================

    const label = document.getElementById("gunLabel");
    if (label) {
      label.innerText = "Click map to place";
      label.style.color = "#ffc107";
    }
    updateMapCursor();
    showPlacementFeedback();
  });

  menu.appendChild(addBtn);

  // 2. Custom Guns (selectable + shows which one is active)
  const factionCustomGuns = customArtillery.filter(
    (g) => g.team === activeFaction,
  );
  factionCustomGuns.forEach((gun) => {
    const item = document.createElement("div");
    item.className = "dropdown-item";
    item.style.display = "flex";
    item.style.alignItems = "center";
    item.style.justifyContent = "space-between";

    const nameSpan = document.createElement("span");
    nameSpan.style.flexGrow = "1";
    nameSpan.style.color = "#ffc107";
    nameSpan.textContent = gun.label;

    // Highlight the currently selected custom gun (bold only)
    if (activeCustomGunId === gun.id) {
      nameSpan.style.fontWeight = "700";
    }

    item.appendChild(nameSpan);

    // Delete ×
    const deleteBtn = document.createElement("span");
    deleteBtn.textContent = "×";
    deleteBtn.style.color = "#ff4444";
    deleteBtn.style.fontSize = "22px";
    deleteBtn.style.marginLeft = "12px";
    deleteBtn.style.cursor = "pointer";

    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirm(`Delete ${gun.label}?`)) {
        customArtillery = customArtillery.filter((g) => g.id !== gun.id);
        if (activeCustomGunId === gun.id) activeCustomGunId = null;
        if (activeGunIndex === -1) activeGunIndex = 0;

        menu.classList.add("hidden");
        document.getElementById("gunBtn").classList.remove("active");

        renderMarkers();
        renderTargeting();
        render();
        saveState();
        updateGunUI(config);
      }
    });

    item.appendChild(deleteBtn);

    // Click gun name → select it + update trajectory
    item.addEventListener("click", (e) => {
      if (e.target !== deleteBtn) {
        e.stopPropagation();
        menu.classList.add("hidden");
        document.getElementById("gunBtn").classList.remove("active");

        activeGunIndex = -1;
        activeCustomGunId = gun.id; // ← this makes switching work
        placementMode = false;
        moveMode = false;
        movingGunId = null;

        label.innerText = gun.label;
        label.style.color = "#ffffff";

        renderMarkers();
        renderTargeting(); // ← trajectory now updates
        render();
        saveState();
      }
    });

    menu.appendChild(item);
  });

  // 3. Separator
  const separator = document.createElement("div");
  separator.className = "dropdown-separator";
  menu.appendChild(separator);

  // 4. HQ Guns
  gunNames.forEach((name, index) => {
    const item = document.createElement("div");
    item.className = "dropdown-item";
    item.setAttribute("data-value", index);
    item.textContent = name;

    item.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.classList.add("hidden");
      document.getElementById("gunBtn").classList.remove("active");

      activeGunIndex = index;
      activeCustomGunId = null;
      placementMode = false;
      moveMode = false;
      movingGunId = null;

      label.innerText = name;
      label.style.color = "#ffffff";

      renderMarkers();
      renderTargeting();
      render();
      saveState();
    });

    menu.appendChild(item);
  });

  // 5. Update main label (now correctly shows the selected custom gun)
  if (placementMode) {
    label.innerText = "Click map to place";
    label.style.color = "#ffc107";
  } else if (moveMode) {
    label.innerText = "Click new position";
    label.style.color = "#ffc107";
  } else if (activeGunIndex >= 0 && activeGunIndex < gunNames.length) {
    label.innerText = gunNames[activeGunIndex];
    label.style.color = "#ffffff";
  } else if (activeCustomGunId !== null) {
    const activeGun = customArtillery.find(
      (g) => g.id === activeCustomGunId && g.team === activeFaction,
    );
    if (activeGun) {
      label.innerText = activeGun.label;
      label.style.color = "#ffffff";
    } else {
      label.innerText = "Select GUN";
      label.style.color = "#ffc107";
    }
  } else {
    // Auto-select latest custom gun if none is active but some exist
    const factionCustomGuns = customArtillery.filter(
      (g) => g.team === activeFaction,
    );
    if (factionCustomGuns.length > 0) {
      activeCustomGunId = factionCustomGuns[factionCustomGuns.length - 1].id;
      label.innerText = factionCustomGuns[factionCustomGuns.length - 1].label;
      label.style.color = "#ffffff";
    } else {
      label.innerText = "Select GUN";
      label.style.color = "#ffc107";
    }
  }
}

// ==========================================
// CUSTOM ARTILLERY FUNCTIONS
// ==========================================

function updateMapCursor() {
  // PERF FIX: Encode the four inputs that control cursor state into a string.
  // If nothing changed since last call, skip all DOM reads and writes entirely.
  // This function is called on every render frame (60fps during pan/zoom) but the
  // mode almost never changes, so this early-exit saves the work on nearly every call.
  const newCursorMode = `${placementMode ? 1 : 0}|${moveMode ? 1 : 0}|${hudEnabled ? 1 : 0}|${IS_MOBILE ? 1 : 0}`;
  if (newCursorMode === _lastCursorMode) return;
  _lastCursorMode = newCursorMode;

  const mapContainer = cached.mapContainer;
  const crosshair = cached.getElem("mobileCrosshair");
  const placeBtn = cached.getElem("mobilePlaceBtn");
  const fireBtn = cached.getElem("mobileFireBtn");

  if (placementMode || moveMode) {
    mapContainer.style.cursor = "crosshair";

    if (IS_MOBILE && crosshair) {
      crosshair.classList.remove("hidden");
      crosshair.classList.add("placement-mode"); // ← ONLY this line affects placement
      crosshair.style.display = "block";
      crosshair.style.opacity = "1";
    }

    if (placeBtn) {
      if (IS_MOBILE) placeBtn.classList.remove("hidden");
      else placeBtn.classList.add("hidden");
    }
    if (fireBtn) fireBtn.classList.add("hidden");
  }
  // Live HUD part stays completely untouched
  else if (IS_MOBILE && hudEnabled) {
    mapContainer.style.cursor = "crosshair";
    if (crosshair) {
      crosshair.classList.remove("hidden", "placement-mode");
      crosshair.style.display = "block";
      crosshair.style.opacity = "1";
      const ringContainer = cached.getElem("mobileRingContainer");
      if (ringContainer) ringContainer.style.display = "block";
    }
    if (placeBtn) placeBtn.classList.add("hidden");
    if (fireBtn) fireBtn.classList.remove("hidden");
  } else {
    mapContainer.style.cursor = "default";
    if (IS_MOBILE && crosshair) {
      crosshair.classList.add("hidden");
      crosshair.classList.remove("placement-mode");
      crosshair.style.display = "none";
    }
    if (placeBtn) placeBtn.classList.add("hidden");
    if (fireBtn) fireBtn.classList.add("hidden");
  }
}

function showPlacementFeedback() {
  const guideEl = document.getElementById("setupGuide");
  if (!guideEl) return;

  guideEl.classList.remove("hidden", "success");

  if (!activeFaction) {
    guideEl.innerHTML = `<span style="color:#ff4444;font-weight:900;">CHOOSE FACTION FIRST</span>`;
    const label = document.getElementById("gunLabel");
    if (label) {
      label.innerText = "SELECT TEAM FIRST";
      label.style.color = "#ff4444";
    }
    return;
  }

  if (placementMode) {
    // ← THIS IS THE FIXED PART
    guideEl.innerText = IS_MOBILE
      ? "AIM WITH CROSSHAIR THEN TAP PLACE"
      : "CLICK MAP TO PLACE ARTILLERY";
  } else if (moveMode) {
    guideEl.innerText = "CLICK NEW POSITION FOR ARTILLERY";
  }

  if (activeFaction) updatePlacementSectorVisuals();

  // Toggle body class for placement arrows
  document.body.classList.toggle("placement-active", placementMode);

  // Auto-hide after 4 seconds only if still in placement/move mode
  setTimeout(() => {
    if (!placementMode && !moveMode && guideEl) {
      guideEl.classList.add("hidden");
    }
  }, 4000);
}

function updateGunDropdownUI() {
  const container = document.getElementById("customGunContainer");
  if (!container) return;

  // This ONLY clears the list of placed guns, NOT the "+ Add Gun" button
  container.innerHTML = "";

  customArtillery.forEach((gun) => {
    const item = document.createElement("div");
    item.className = "dropdown-item";
    item.style.color = "#ffc107";
    item.style.paddingLeft = "25px"; // Slight indent so it looks "nested" under the action
    item.innerText = gun.label;

    item.onclick = (e) => {
      e.stopPropagation();
      selectCustomGun(gun.id);
      // Close the menu
      document
        .querySelector("#gunDropdown .dropdown-menu")
        .classList.add("hidden");
    };

    container.appendChild(item);
  });
}

function selectCustomGun(id) {
  const gun = customArtillery.find((g) => g.id === id);
  if (!gun) return;

  activeGunIndex = -1; // Set to -1 to indicate we aren't using an HQ gun
  window.selectedCustomGunId = id; // Track which custom gun is active

  // Update the main button text
  document.getElementById("gunLabel").innerText = gun.label;

  renderMarkers();
  render(); // Recalculate ballistics for the new position
}

// ====================== PLACEMENT RESTRICTION ======================
function placeCustomArtillery(gameX, gameY) {
  if (!activeFaction) {
    alert("Please select a TEAM first before placing custom artillery.");
    placementMode = false;
    updateMapCursor();
    return;
  }

  const mapImage = document.getElementById("mapImage");
  const w = mapImage.naturalWidth;
  const h = mapImage.naturalHeight;

  // FIX #4: Use shared helper — no more duplicated sector logic
  if (!isPositionInAllowedSector(gameX, gameY, w, h)) {
    const guideEl = document.getElementById("setupGuide");
    if (guideEl) {
      guideEl.classList.remove("hidden", "success");
      guideEl.innerHTML = `<span style="color:#ff4444;font-weight:900;">❌ ONLY IN GREEN SECTOR</span>`;
    }
    if (navigator.vibrate) navigator.vibrate([60, 30, 60]);

    // After error message disappears, RESTORE the correct placement text
    setTimeout(() => {
      if (placementMode) {
        showPlacementFeedback(); // ← This now correctly restores mobile/desktop text
      } else if (guideEl) {
        guideEl.classList.add("hidden");
      }
    }, 2200);

    return;
  }

  // ====================== VALID PLACEMENT ======================
  // Per-faction numbering (resets to 1 when you change faction)
  const factionCustomCount =
    customArtillery.filter((g) => g.team === activeFaction).length + 1;

  const customGun = {
    id: `custom_${nextCustomGunId++}`,
    gameX: gameX,
    gameY: gameY,
    team: activeFaction,
    type: "custom",
    label: `Custom Gun ${factionCustomCount}`, // ← now resets per faction
    radius: 500,
  };

  customArtillery.push(customGun);
  activeGunIndex = -1;
  activeCustomGunId = customGun.id;
  placementMode = false;
  moveMode = false;
  movingGunId = null;
  activeTarget = null;

  updateMapCursor();
  updateGunUI(MAP_DATABASE[activeMapKey]);
  updateGunDropdownUI();

  const label = document.getElementById("gunLabel");
  label.innerText = customGun.label;
  label.style.color = "#ffffff";

  renderMarkers();
  renderTargeting();
  render();
  saveState();
}

function deleteCustomGun(gunId) {
  const index = customArtillery.findIndex((gun) => gun.id === gunId);
  if (index !== -1) {
    customArtillery.splice(index, 1);

    // Check if we were in move mode for this gun
    if (moveMode && movingGunId === gunId) {
      moveMode = false;
      movingGunId = null;

      const label = document.getElementById("gunLabel");
      if (label) {
        label.innerText = "Select GUN";
        label.style.color = "#ffc107";
      }

      // Hide the guide text
      const guideEl = document.getElementById("setupGuide");
      if (guideEl) {
        guideEl.classList.add("hidden");
      }

      updateMapCursor();
      renderMarkers(); // Re-render to remove sector highlight
    }

    // Reset active gun if it was the deleted one
    if (activeCustomGunId === gunId) {
      activeCustomGunId = null;
      activeGunIndex = -1;
      const label = document.getElementById("gunLabel");
      if (label) {
        label.innerText = "Select GUN";
        label.style.color = "#ffc107";
      }
    }

    // Update UI to refresh dropdown
    updateGunUI(MAP_DATABASE[activeMapKey]);
    updateGunDropdownUI();

    // Re-render and save
    renderMarkers();
    renderTargeting();
    render();
    saveState();
  }
}

function startMoveGun(gunId) {
  moveMode = true;
  movingGunId = gunId;
  placementMode = false;

  // Close target data panel when entering move mode
  if (cached.targetDataPanel) {
    cached.targetDataPanel.classList.add("hidden");
  }

  const label = document.getElementById("gunLabel");
  label.innerText = "Click new position";
  label.style.color = "#ffc107";

  updateMapCursor();
  showPlacementFeedback();
}

function moveCustomGun(gunId, newGameX, newGameY) {
  const gun = customArtillery.find((g) => g.id === gunId);
  if (!gun) return;

  // Update position
  gun.gameX = newGameX;
  gun.gameY = newGameY;

  // Reset modes
  moveMode = false;
  movingGunId = null;

  // Keep this gun as the ACTIVE one (critical for rotation + trajectory)
  activeGunIndex = -1;
  activeCustomGunId = gunId;

  // Update main label
  const label = document.getElementById("gunLabel");
  if (label) {
    label.innerText = gun.label;
    label.style.color = "#ffffff";
  }

  updateMapCursor();

  // If there's an active target → recalculate distance/mil from the NEW gun position
  if (activeTarget) {
    const gunPos = { x: gun.gameX, y: gun.gameY };
    const factionLabel = document.getElementById("factionLabel").innerText;
    const dx = activeTarget.gameX - gunPos.x;
    const dy = activeTarget.gameY - gunPos.y;
    const distanceUnits = Math.sqrt(dx * dx + dy * dy);
    const correctedDistance = Math.floor(distanceUnits / GAME_UNITS_PER_METER);
    const newMil = getMilFromTable(correctedDistance, factionLabel);

    activeTarget.distance = correctedDistance;
    activeTarget.mil = newMil;

    // Update trajectory slider if it's open
    if (trajSliderEnabled) {
      originalAngle = Math.atan2(dy, dx);
      const trajInput = document.getElementById("trajectoryRange");
      if (trajInput) trajInput.value = correctedDistance;
    }
  }

  // Full refresh — this updates rotation + trajectory line + numbers
  renderMarkers();
  renderTargeting();
  render();
  saveState();
}

// FIX #9: Single tracked handler so rapid right-clicks cannot stack multiple
// document-level 'click' listeners. Only one closeMenu is ever registered.
let _contextMenuCloseHandler = null;

function showArtilleryContextMenu(gunId, x, y) {
  // Remove existing context menu
  const existingMenu = document.getElementById("artilleryContextMenu");
  if (existingMenu) existingMenu.remove();

  // Remove any previously registered close handler before creating a new one
  if (_contextMenuCloseHandler) {
    document.removeEventListener("click", _contextMenuCloseHandler);
    _contextMenuCloseHandler = null;
  }

  // Create context menu
  const menu = document.createElement("div");
  menu.id = "artilleryContextMenu";
  menu.style.position = "absolute";
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
  menu.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
  menu.style.border = "1px solid rgba(255, 255, 255, 0.3)";
  menu.style.borderRadius = "4px";
  menu.style.padding = "4px 0";
  menu.style.zIndex = "5000";
  menu.style.minWidth = "120px";

  // Move option (unchanged)
  const moveItem = document.createElement("div");
  moveItem.className = "context-menu-item";
  moveItem.innerText = "MOVE";
  moveItem.style.padding = "8px 16px";
  moveItem.style.color = "#ffffff";
  moveItem.style.cursor = "pointer";
  moveItem.addEventListener("click", () => {
    startMoveGun(gunId);
    menu.remove();
  });

  // Delete option → now uses the nice styled popup
  const deleteItem = document.createElement("div");
  deleteItem.className = "context-menu-item";
  deleteItem.innerText = "DELETE";
  deleteItem.style.padding = "8px 16px";
  deleteItem.style.color = "#ff4444";
  deleteItem.style.cursor = "pointer";
  deleteItem.addEventListener("click", () => {
    menu.remove();
    showConfirmModal("Delete this custom gun?", () => {
      deleteCustomGun(gunId);
    });
  });

  // Hover effects
  moveItem.addEventListener(
    "mouseenter",
    () => (moveItem.style.backgroundColor = "rgba(255, 255, 255, 0.1)"),
  );
  moveItem.addEventListener(
    "mouseleave",
    () => (moveItem.style.backgroundColor = "transparent"),
  );
  deleteItem.addEventListener(
    "mouseenter",
    () => (deleteItem.style.backgroundColor = "rgba(255, 68, 68, 0.2)"),
  );
  deleteItem.addEventListener(
    "mouseleave",
    () => (deleteItem.style.backgroundColor = "transparent"),
  );

  menu.appendChild(moveItem);
  menu.appendChild(deleteItem);

  document.body.appendChild(menu);

  // Close when clicking elsewhere.
  // The 100ms delay prevents the right-click that opened the menu from
  // immediately firing this handler and closing it again.
  setTimeout(() => {
    _contextMenuCloseHandler = function closeMenu(e) {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener("click", _contextMenuCloseHandler);
        _contextMenuCloseHandler = null;
      }
    };
    document.addEventListener("click", _contextMenuCloseHandler);
  }, 100);
}

// Styled confirmation modal (replaces native confirm)
function showConfirmModal(message, onConfirm) {
  // Remove any old modal
  const old = document.getElementById("customConfirmModal");
  if (old) old.remove();

  const overlay = document.createElement("div");
  overlay.id = "customConfirmModal";
  overlay.className = "confirm-modal-overlay";
  overlay.style.display = "flex";

  // FIX #7: Build the modal with the DOM API instead of innerHTML.
  // The `message` parameter must never be injected as raw HTML — if this function
  // is ever called with dynamic or user-derived text it would be an XSS vector.
  const modal = document.createElement("div");
  modal.className = "confirm-modal";

  const title = document.createElement("div");
  title.className = "confirm-title";
  title.textContent = "DELETE CUSTOM GUN"; // static — safe

  const msgEl = document.createElement("div");
  msgEl.className = "confirm-message";
  msgEl.textContent = message; // textContent — safe regardless of what message contains

  const buttons = document.createElement("div");
  buttons.className = "confirm-buttons";

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "confirm-btn cancel";
  cancelBtn.textContent = "CANCEL";

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "confirm-btn delete";
  deleteBtn.textContent = "DELETE";

  buttons.appendChild(cancelBtn);
  buttons.appendChild(deleteBtn);
  modal.appendChild(title);
  modal.appendChild(msgEl);
  modal.appendChild(buttons);
  overlay.appendChild(modal);

  document.body.appendChild(overlay);

  cancelBtn.onclick = () => overlay.remove();
  deleteBtn.onclick = () => {
    overlay.remove();
    if (onConfirm) onConfirm();
  };

  // Click outside = cancel
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };
}

function setupDropdown(containerId, buttonId, labelId, onSelect) {
  const container = document.getElementById(containerId);
  const btn = document.getElementById(buttonId);

  if (!container || !btn) return;

  const menu = container.querySelector(".dropdown-menu");
  const items = container.querySelectorAll(".dropdown-item");

  // Toggle Menu on Button Click
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isCurrentlyOpen = !menu.classList.contains("hidden");

    // Reset all
    document
      .querySelectorAll(".dropdown-menu")
      .forEach((el) => el.classList.add("hidden"));
    document
      .querySelectorAll(".btn-map-Select")
      .forEach((el) => el.classList.remove("active"));

    if (!isCurrentlyOpen) {
      menu.classList.remove("hidden");
      btn.classList.add("active");
    }
  });

  // Handle Item Click
  items.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      const value = item.getAttribute("data-value");

      // Close Menu
      menu.classList.add("hidden");
      btn.classList.remove("active");

      // Trigger the Selection logic (this calls the function in initArtyControls)
      onSelect(value);
    });
  });
}

function initArtyControls() {
  // 1. Setup Faction Dropdown
  setupDropdown("factionDropdown", "factionBtn", "factionLabel", (value) => {
    if (activeFaction !== value) {
      toggleTransitions(false);
      activeFaction = value;

      // Reset placement and move modes
      placementMode = false;
      moveMode = false;
      movingGunId = null;

      // === NEW: Auto-select the LAST custom gun of the NEW faction ===
      const factionCustomGuns = customArtillery.filter(
        (g) => g.team === activeFaction,
      );

      if (factionCustomGuns.length > 0) {
        activeCustomGunId = factionCustomGuns[factionCustomGuns.length - 1].id;
        activeGunIndex = -1;
      } else {
        activeCustomGunId = null;
        activeGunIndex = -1;
      }

      activeTarget = null;

      // Disable trajectory slider
      trajSliderEnabled = false;
      const trajToggleBtn = document.getElementById("trajToggleBtn");
      const trajContainer = document.getElementById("trajSliderContainer");
      if (trajToggleBtn) trajToggleBtn.classList.remove("active");
      if (trajContainer) trajContainer.classList.add("hidden");

      // Refresh UI
      updateFactionUI(MAP_DATABASE[activeMapKey]);
      updateGunUI(MAP_DATABASE[activeMapKey]);

      renderMarkers();
      renderTargeting();
      render();
      saveState();
    }
  });

  // 2. Setup Gun Dropdown (Toggle Only)
  const gunBtn = document.getElementById("gunBtn");
  const gunMenu = document.querySelector("#gunDropdown .dropdown-menu");

  if (gunBtn && gunMenu) {
    gunBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const wasHidden = gunMenu.classList.contains("hidden");

      document
        .querySelectorAll(".dropdown-menu")
        .forEach((el) => el.classList.add("hidden"));
      document
        .querySelectorAll(".btn-map-Select")
        .forEach((el) => el.classList.remove("active"));

      if (wasHidden) {
        gunMenu.classList.remove("hidden");
        gunBtn.classList.add("active");
      }
    });
  }

  // 3. Setup Ruler Toggle
  const rulerToggleBtn = document.getElementById("rulerToggleBtn");
  if (rulerToggleBtn) {
    let rulerTouchHandled = false;
    const handleRuler = (e) => {
      if (e.type === "click" && rulerTouchHandled) return;
      e.preventDefault();
      e.stopPropagation();

      if (e.cancelable && e.type === "touchstart") {
        e.preventDefault();
        rulerTouchHandled = true;
        setTimeout(() => {
          rulerTouchHandled = false;
        }, 300);
      }

      rulerEnabled = !rulerEnabled;
      rulerToggleBtn.classList.toggle("active", rulerEnabled);
      rulerToggleBtn.blur();

      renderTargeting();
      saveState();
    };

    rulerToggleBtn.addEventListener("click", handleRuler);
    rulerToggleBtn.addEventListener("touchstart", handleRuler, {
      passive: false,
    });
    rulerToggleBtn.classList.toggle("active", rulerEnabled);
  }

  // 4. Setup HUD Toggle
  const hudToggleBtn = document.getElementById("hudToggleBtn");
  if (hudToggleBtn) {
    let hudTouchHandled = false;
    let hudTouchTimeout = null;

    const handleHud = (e) => {
      if (e.type === "click" && hudTouchHandled) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (e.type === "touchstart") {
        hudTouchHandled = true;
        if (hudTouchTimeout) clearTimeout(hudTouchTimeout);
        hudTouchTimeout = setTimeout(() => {
          hudTouchHandled = false;
        }, 500);
      }

      if (e.cancelable) e.preventDefault();
      e.stopPropagation();

      hudEnabled = !hudEnabled;
      syncToggleUI();
      hudToggleBtn.blur();
      render();
      saveState();
    };

    hudToggleBtn.addEventListener("click", handleHud);
    hudToggleBtn.addEventListener("touchstart", handleHud, { passive: false });
    hudToggleBtn.classList.toggle("active", hudEnabled);

    // Initial Sync
    const hudEl = document.getElementById("liveCursorHud");
    const crosshair = document.getElementById("mobileCrosshair");
    const fireBtn = document.getElementById("mobileFireBtn");
    if (hudEnabled) {
      if (hudEl) hudEl.classList.remove("hidden");
      if (IS_MOBILE) {
        if (crosshair) crosshair.classList.remove("hidden");
        if (fireBtn) fireBtn.classList.remove("hidden");
      }
    } else {
      if (hudEl) hudEl.classList.add("hidden");
      if (crosshair) crosshair.classList.add("hidden");
      if (fireBtn) fireBtn.classList.add("hidden");
    }
  }

  // 3. Global Click Listener
  window.addEventListener("click", () => {
    document
      .querySelectorAll(".dropdown-menu")
      .forEach((el) => el.classList.add("hidden"));
    document
      .querySelectorAll(".btn-map-Select")
      .forEach((el) => el.classList.remove("active"));
  });

  // 5. Setup Sidebar Calculator Button
  const sidebarCalcBtn = document.getElementById("sidebarCalcBtn");
  if (sidebarCalcBtn) {
    const handleOpenCalc = (e) => {
      e.preventDefault();
      e.stopPropagation();
      sidebarCalcBtn.classList.add("pressed");
      setTimeout(() => sidebarCalcBtn.classList.remove("pressed"), 150);
      openManualCalculator();
    };
    sidebarCalcBtn.addEventListener("click", handleOpenCalc);
    sidebarCalcBtn.addEventListener("touchstart", handleOpenCalc, {
      passive: false,
    });
  }

  // 6. Setup Mobile Fire Button
  const mobileFireBtn = document.getElementById("mobileFireBtn");
  if (mobileFireBtn) {
    // Timestamp to block rapid duplicate events (The "Ghost" Killer)
    let lastFireTime = 0;

    const handleFire = (e) => {
      // 1. AGGRESSIVE STOP
      // Prevent browser zooming, scrolling, or bubbling to the map
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      // Stop any other listeners on this specific element
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();

      // 2. TIME GATE (Debounce)
      // If we fired recently (< 300ms), ignore this event entirely.
      // This automatically filters out the 'click' that follows a 'touchstart'.
      const now = Date.now();
      if (now - lastFireTime < 300) {
        return;
      }
      lastFireTime = now;

      // 3. FIRE ACTION
      if (navigator.vibrate) navigator.vibrate(30);

      // Visual Feedback
      mobileFireBtn.classList.add("pressed");
      setTimeout(() => mobileFireBtn.classList.remove("pressed"), 150);

      // Execute Math
      fireAtCenter();
    };

    // Attach listeners
    // 'passive: false' is REQUIRED to allow e.preventDefault()
    mobileFireBtn.addEventListener("touchstart", handleFire, {
      passive: false,
    });
    mobileFireBtn.addEventListener("click", handleFire);
  }

  // 7. Setup Trajectory Slider Toggle (Mozilla-Proof Mobile Logic)
  const trajToggleBtn = document.getElementById("trajToggleBtn");
  const trajContainer = document.getElementById("trajSliderContainer");
  const trajInput = document.getElementById("trajectoryRange");

  if (trajToggleBtn && trajContainer && trajInput) {
    let trajTouchHandled = false;
    let trajTouchTimeout = null;

    const handleTrajToggle = (e) => {
      // Mozilla Mobile Gatekeeper
      if (e.type === "click" && trajTouchHandled) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (e.type === "touchstart") {
        trajTouchHandled = true;
        if (trajTouchTimeout) clearTimeout(trajTouchTimeout);
        trajTouchTimeout = setTimeout(() => {
          trajTouchHandled = false;
        }, 500);
      }

      if (e.cancelable) e.preventDefault();
      e.stopPropagation();

      // --- ERROR FEEDBACK LOGIC (Universal & Safe) ---
      if (!activeTarget) {
        // 1. Shake the button (Visual cue)
        trajToggleBtn.classList.add("btn-error");

        // 2. Physical Tooltip (Fixes Mobile Visibility & Clipping)
        // Remove old if exists
        const existingTip = document.getElementById("error-toast");
        if (existingTip) existingTip.remove();

        const tip = document.createElement("div");
        tip.id = "error-toast";
        tip.innerText = "SHOOT FIRST";

        // Position relative to button
        const rect = trajToggleBtn.getBoundingClientRect();

        // Apply Styles (Inline ensures it works everywhere)
        Object.assign(tip.style, {
          position: "fixed",
          top: rect.top + rect.height / 2 + "px",
          right: window.innerWidth - rect.left + 15 + "px", // 15px Left of button
          transform: "translateY(-50%)",

          backgroundColor: "#ff4444",
          color: "white",
          fontFamily: "'GothamSS', sans-serif",
          fontWeight: "900",
          fontSize: "13px",
          padding: "8px 12px",
          borderRadius: "4px",
          zIndex: "10000", // Above everything
          pointerEvents: "none",
          opacity: "0",
          transition: "opacity 0.2s ease",
          whiteSpace: "nowrap",
          boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
        });

        // Create Arrow
        const arrow = document.createElement("div");
        Object.assign(arrow.style, {
          position: "absolute",
          right: "-6px",
          top: "50%",
          transform: "translateY(-50%)",
          borderTop: "6px solid transparent",
          borderBottom: "6px solid transparent",
          borderLeft: "6px solid #ff4444",
        });
        tip.appendChild(arrow);
        document.body.appendChild(tip);

        // Trigger Fade In
        requestAnimationFrame(() => {
          tip.style.opacity = "1";
        });

        // 3. Haptic Feedback (Safe Check Fixes Console Error)
        if (navigator.vibrate) {
          // Only vibrate if the browser says the user is "active"
          // This silences the [Intervention] error
          if (
            !navigator.userActivation ||
            navigator.userActivation.hasBeenActive
          ) {
            navigator.vibrate([50, 50, 50]);
          }
        }

        // 4. Cleanup Timer
        if (window.trajErrorTimeout) clearTimeout(window.trajErrorTimeout);

        window.trajErrorTimeout = setTimeout(() => {
          trajToggleBtn.classList.remove("btn-error");
          if (tip) {
            tip.style.opacity = "0";
            setTimeout(() => tip.remove(), 200);
          }
        }, 1200);

        return; // Stop execution
      }
      // ----------------------------

      trajSliderEnabled = !trajSliderEnabled;
      trajToggleBtn.classList.toggle("active", trajSliderEnabled);
      trajContainer.classList.toggle("hidden", !trajSliderEnabled);

      if (trajSliderEnabled) {
        const gunPos = getActiveGunCoords();
        if (gunPos) {
          // 1. LOCK exact bearing from map shot
          const dx = activeTarget.gameX - gunPos.x;
          const dy = activeTarget.gameY - gunPos.y;
          originalAngle = Math.atan2(dy, dx);

          // 2. SYNC only the handle visual value
          // DO NOT call updateTrajectoryFromDistance() here - it stops the jump!
          const trajInput = document.getElementById("trajectoryRange");
          if (trajInput) trajInput.value = activeTarget.distance;
        }
      }
      trajToggleBtn.blur();
      saveState();
    };

    trajToggleBtn.addEventListener("click", handleTrajToggle);
    trajToggleBtn.addEventListener("touchstart", handleTrajToggle, {
      passive: false,
    });

    // (Keep the input event listener below as is...)
    trajInput.addEventListener("input", () => {
      /* ... math ... */
    });
  }

  // 1. Helper Function to apply distance change (Buttons)
  function adjustTrajDistance(delta) {
    if (!activeTarget || !trajSliderEnabled) return;
    const trajInput = document.getElementById("trajectoryRange");
    let newDist = parseInt(trajInput.value) + delta;
    newDist = Math.max(100, Math.min(1600, newDist));
    trajInput.value = newDist;
    updateTrajectoryFromDistance(newDist);
  }

  // 2. Logic to update position (Only runs when moving slider)
  function updateTrajectoryFromDistance(newDistMeters) {
    const gunPos = getActiveGunCoords();
    if (!gunPos) return;

    const newDistUnits = newDistMeters * GAME_UNITS_PER_METER;

    // Moves marker along the locked angle
    let newX = gunPos.x + newDistUnits * Math.cos(originalAngle);
    let newY = gunPos.y + newDistUnits * Math.sin(originalAngle);

    // --- FIX: Clamp to Map Boundaries ---
    newX = Math.max(GAME_LEFT, Math.min(GAME_RIGHT, newX));
    newY = Math.max(GAME_BOTTOM, Math.min(GAME_TOP, newY));
    // -----------------------------------

    const factionLabel = cached.factionLabel.innerText;
    const mils = getMilFromTable(newDistMeters, factionLabel);

    activeTarget = {
      gameX: newX,
      gameY: newY,
      distance: newDistMeters,
      mil: mils,
    };

    // Light immediate updates (no DOM write)
    const milDisplay = cached.trajCurrentMil;
    const meterDisplay = cached.trajCurrentMeter;

    if (milDisplay)
      milDisplay.innerText =
        activeTarget.mil !== null ? activeTarget.mil : "OUT";
    if (meterDisplay) meterDisplay.innerText = activeTarget.distance + "m";

    // Throttle heavy render operations to ~60fps max
    if (!trajUpdatePending) {
      trajUpdatePending = true;
      requestAnimationFrame(() => {
        // --- FIX START: Kill Animations (Prevent Flying Labels) ---
        toggleTransitions(false);
        // --------------------------------------------------------

        renderMarkers();
        renderTargeting();
        render();

        trajUpdatePending = false;

        // --- FIX START: Debounced Restore ---
        // We clear the previous timeout so animations stay OFF while dragging
        if (window.trajRestoreTimeout) clearTimeout(window.trajRestoreTimeout);

        // REMOVED: setTimeout hack to re-enable animations
        // ------------------------------------
      });
    }
  }

  // 3. Attach listeners to step buttons (Mozilla Mobile Double-Tap Fix)
  document.querySelectorAll(".traj-step-btn").forEach((btn) => {
    const newBtn = btn.cloneNode(true); // Clear old listeners
    btn.parentNode.replaceChild(newBtn, btn);

    let stepTouchHandled = false;
    let stepTouchTimeout = null;

    const handleStep = (e) => {
      // 1. GATEKEEPER: If we just handled a touch, strictly ignore this 'click'
      if (e.type === "click" && stepTouchHandled) {
        return;
      }

      // 2. AGGRESSIVE PREVENTION: Stop browser from generating ghost clicks, zooming, or Selecting
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();

      // 3. TOUCH HANDLER: Set the flag
      if (e.type === "touchstart") {
        stepTouchHandled = true;

        // Clear previous timer to prevent race conditions
        if (stepTouchTimeout) clearTimeout(stepTouchTimeout);

        // Set a long timeout (500ms) to ensure the ghost click window has fully passed
        stepTouchTimeout = setTimeout(() => {
          stepTouchHandled = false;
        }, 500);
      }

      // 4. VISUALS: Feedback
      newBtn.classList.add("pressed");
      setTimeout(() => newBtn.classList.remove("pressed"), 100);

      // 5. LOGIC: Execute adjustment
      const step = parseInt(newBtn.getAttribute("data-step"));
      adjustTrajDistance(step);

      // 6. HAPTICS
      if (navigator.vibrate) navigator.vibrate(10);
    };

    // Add listeners
    // 'passive: false' is REQUIRED to allow e.preventDefault() to work on touchstart
    newBtn.addEventListener("touchstart", handleStep, { passive: false });
    newBtn.addEventListener("click", handleStep);
  });

  // 4. Link slider input (Mobile Isolation Fix)
  const rangeInput = document.getElementById("trajectoryRange");
  const newRange = rangeInput.cloneNode(true); // Clear old listeners
  rangeInput.parentNode.replaceChild(newRange, rangeInput);

  // --- USE THE GLOBAL FUNCTION ---
  // Block the map from seeing these events
  newRange.addEventListener("touchstart", stopMapInteraction, {
    passive: true,
  });
  newRange.addEventListener("touchmove", stopMapInteraction, { passive: true });
  newRange.addEventListener("touchend", stopMapInteraction, { passive: true });
  newRange.addEventListener("mousedown", stopMapInteraction); // For Desktop drag-Select issues

  // Handle the actual value change
  newRange.addEventListener("input", (e) => {
    updateTrajectoryFromDistance(parseInt(e.target.value));
  });

  // 5. Setup Match Setup Filter Button
  const spFilterBtn = document.getElementById("spFilterBtn");
  if (spFilterBtn) {
    // Logic variables to prevent double-firing on mobile
    let setupTouchHandled = false;
    let setupTouchTimeout = null;

    const handleFilterToggle = (e) => {
      // --- MOZILLA MOBILE GATEKEEPER ---
      // 1. If this is a click event but we just handled a touch, STOP.
      if (e.type === "click" && setupTouchHandled) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // 2. If this is a touch event, set the flag so the following click is ignored.
      if (e.type === "touchstart") {
        setupTouchHandled = true;
        if (setupTouchTimeout) clearTimeout(setupTouchTimeout);
        // 500ms timeout covers the slow 300ms click delay on some mobile browsers
        setupTouchTimeout = setTimeout(() => {
          setupTouchHandled = false;
        }, 500);
      }
      // ----------------------------------

      if (e.cancelable) e.preventDefault();
      e.stopPropagation();

      // Actual Logic
      filterMode = !filterMode;
      spFilterBtn.classList.toggle("active", filterMode);
      spFilterBtn.blur();

      renderMarkers();

      // FIX: Ensure trajectory comes back if we exit mode
      renderTargeting();

      render();

      if (filterMode && navigator.vibrate) navigator.vibrate([10, 30, 10]);
    };

    spFilterBtn.addEventListener("click", handleFilterToggle);
    spFilterBtn.addEventListener("touchstart", handleFilterToggle, {
      passive: false,
    });
  }

  // 6. Fix Keypad Events
  fixKeypadEvents();
}

// ==========================================
// SAVE STATE FUNCTIONALITY
// ==========================================

function saveState() {
  const controlsDrawer = document.getElementById("controlsDrawer");

  // SAVE: Map, Faction, Gun, Toggle Buttons, and Custom Artillery.
  const stateToSave = {
    activeMapKey: activeMapKey,
    activeFaction: activeFaction,
    activeGunIndex: activeGunIndex,
    activeCustomGunId: activeCustomGunId,
    manualCalcFaction: manualCalcFaction,
    panelHidden: controlsDrawer
      ? controlsDrawer.classList.contains("closed")
      : false,
    rulerEnabled: rulerEnabled,
    hudEnabled: hudEnabled,
    // NEW: Save custom artillery state
    customArtillery: customArtillery,
    nextCustomGunId: nextCustomGunId,
    // NEW: Save calculator history
    calcHistory: calcHistory,
    historyCollapsed: historyCollapsed,
    historyEnabled: historyEnabled,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem("hllArtyCalculatorState", JSON.stringify(stateToSave));
  } catch (error) {
    // FIX #5: No longer silent. Log to console and show a brief on-screen toast
    // so the user knows their state is NOT being saved (e.g. private browsing,
    // storage quota exceeded, or localStorage blocked by browser policy).
    console.warn("[HLL] saveState failed — localStorage unavailable:", error);

    // Show a non-blocking toast in the top-right corner
    let toast = document.getElementById("hll-save-error-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "hll-save-error-toast";
      Object.assign(toast.style, {
        position: "fixed",
        top: "12px",
        right: "12px",
        background: "rgba(180,40,40,0.92)",
        color: "#fff",
        fontFamily: "'GothamSS', sans-serif",
        fontWeight: "700",
        fontSize: "12px",
        padding: "8px 14px",
        borderRadius: "4px",
        zIndex: "99999",
        pointerEvents: "none",
        opacity: "0",
        transition: "opacity 0.3s ease",
      });
      toast.textContent = "⚠️ State not saved — storage unavailable";
      document.body.appendChild(toast);
    }
    // Fade in, hold, fade out
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
    });
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => {
      toast.style.opacity = "0";
    }, 3500);
  }
}

function loadState() {
  try {
    const savedState = localStorage.getItem("hllArtyCalculatorState");

    // IF NO SAVE FOUND: Default both to unSelected
    if (!savedState) {
      activeGunIndex = -1;
      activeFaction = null; // Default to no faction
      activeCustomGunId = null;
      customArtillery = [];
      nextCustomGunId = 1;
      placementMode = false;
      moveMode = false;
      movingGunId = null;
      return null;
    }

    const loaded = JSON.parse(savedState);

    if (!MAP_DATABASE[loaded.activeMapKey]) return null;

    activeMapKey = loaded.activeMapKey;

    // FIX: Respect saved faction, or default to null if missing/new user
    activeFaction = loaded.activeFaction || null;

    activeGunIndex =
      loaded.activeGunIndex !== undefined ? loaded.activeGunIndex : -1;

    // NEW: Restore custom artillery state
    activeCustomGunId = loaded.activeCustomGunId || null;
    customArtillery = loaded.customArtillery || [];
    nextCustomGunId = loaded.nextCustomGunId || 1;

    manualCalcFaction = loaded.manualCalcFaction || "us";
    rulerEnabled =
      loaded.rulerEnabled !== undefined ? loaded.rulerEnabled : false;
    hudEnabled = loaded.hudEnabled !== undefined ? loaded.hudEnabled : false;

    // NEW: Restore calculator history
    calcHistory = loaded.calcHistory || [];
    historyCollapsed = loaded.historyCollapsed || false;
    historyEnabled =
      loaded.historyEnabled !== undefined ? loaded.historyEnabled : false;

    // Apply history enabled state to UI
    const historyEnabledToggle = document.getElementById(
      "historyEnabledToggle",
    );
    const historyList = document.getElementById("calcHistoryList");
    const toggleBtn = document.getElementById("toggleHistoryBtn");
    const clearBtn = document.getElementById("clearHistoryBtn");

    if (historyEnabledToggle) {
      historyEnabledToggle.checked = historyEnabled;
    }

    // Always apply collapsed state to toggle button
    if (toggleBtn) {
      // Directly set transform based on collapsed state (flipped logic)
      if (historyCollapsed) {
        toggleBtn.style.transform = "rotate(0deg)";
        toggleBtn.classList.add("collapsed");
      } else {
        toggleBtn.style.transform = "rotate(180deg)";
        toggleBtn.classList.remove("collapsed");
      }
    }

    // Apply collapsed state to history list
    if (historyList) {
      historyList.style.display = historyCollapsed ? "none" : "block";
    }

    // Apply modal height based on collapsed state using CSS class
    const modalContent = document.querySelector("#calcModal .modal-content");
    if (modalContent) {
      if (historyCollapsed) {
        modalContent.classList.remove("history-expanded");
      } else {
        modalContent.classList.add("history-expanded");
      }
    }

    // Hide CLEAR button when history is disabled
    if (clearBtn) {
      clearBtn.style.visibility = historyEnabled ? "visible" : "hidden";
    }

    // Update the calc button based on history enabled state
    updateCalcButton();

    // Render the loaded history
    renderCalcHistory();

    placementMode = false;
    moveMode = false;
    movingGunId = null;

    window.savedPanelHidden = loaded.panelHidden || false;

    return true;
  } catch (error) {
    activeGunIndex = -1;
    activeFaction = null;
    activeCustomGunId = null;
    customArtillery = [];
    nextCustomGunId = 1;
    placementMode = false;
    moveMode = false;
    movingGunId = null;
    return null;
  }
}

function clearSavedState() {
  try {
    localStorage.removeItem("hllArtyCalculatorState");
  } catch (error) {
    // Silently handle clear errors
  }
}

// ==========================================
// 5. EVENT LISTENERS
// ==========================================

// State to track if a drag occurred
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
const DRAG_THRESHOLD = 5; // Pixels to move before counting as a "Pan"

// --- 1. REMOVED DOUBLE CLICK ZOOM (To fix latency) ---
// Double click logic has been deleted to allow instant shooting.

// --- 2. CLICK (SHOOTING LOGIC) ---
mapContainer.addEventListener("click", (e) => {
  // 1. If we were dragging (panning), DO NOT SHOOT.
  if (isDragging) return;

  // --- NEW: SETUP MODE GUARD ---
  // If Setup Mode is active, strictly ignore shooting clicks.
  if (filterMode) return;
  // ----------------------------

  // --- NEW: PLACEMENT MODE HANDLING ---
  if (placementMode) {
    if (IS_MOBILE) {
      // On mobile: Do NOTHING when tapping map.
      // Only the PLACE button is allowed to place custom artillery.
      return;
    }

    // Desktop: Allow direct click to place (unchanged behavior)
    const rect = mapContainer.getBoundingClientRect();

    const currentVisualX = Math.round(state.pointX);
    const currentVisualY = Math.round(state.pointY);

    const clickX = e.clientX - rect.left - currentVisualX;
    const clickY = e.clientY - rect.top - currentVisualY;

    const effectiveZoom = state.scale * state.fitScale;
    const rawImgX = clickX / effectiveZoom;
    const rawImgY = clickY / effectiveZoom;
    const mapImage = document.getElementById("mapImage");
    const w = mapImage.naturalWidth;
    const h = mapImage.naturalHeight;

    const targetPos = imagePixelsToGame(rawImgX, rawImgY, w, h);

    if (
      targetPos.x < GAME_LEFT ||
      targetPos.x > GAME_RIGHT ||
      targetPos.y < GAME_BOTTOM ||
      targetPos.y > GAME_TOP
    ) {
      return;
    }

    placeCustomArtillery(targetPos.x, targetPos.y);
    return;
  }

  // --- NEW: MOVE MODE HANDLING ---
  if (moveMode && movingGunId) {
    const rect = mapContainer.getBoundingClientRect();

    // Calculate click position
    const currentVisualX = Math.round(state.pointX);
    const currentVisualY = Math.round(state.pointY);

    const clickX = e.clientX - rect.left - currentVisualX;
    const clickY = e.clientY - rect.top - currentVisualY;

    const effectiveZoom = state.scale * state.fitScale;
    const rawImgX = clickX / effectiveZoom;
    const rawImgY = clickY / effectiveZoom;

    const mapImage = document.getElementById("mapImage");
    const w = mapImage.naturalWidth;
    const h = mapImage.naturalHeight;

    // Convert to game coordinates
    const targetPos = imagePixelsToGame(rawImgX, rawImgY, w, h);

    // Check boundaries
    if (
      targetPos.x < GAME_LEFT ||
      targetPos.x > GAME_RIGHT ||
      targetPos.y < GAME_BOTTOM ||
      targetPos.y > GAME_TOP
    ) {
      return;
    }

    // FIX #4: Use shared helper — no more duplicated sector logic
    if (!isPositionInAllowedSector(targetPos.x, targetPos.y, w, h)) {
      const guideEl = document.getElementById("setupGuide");
      if (guideEl) {
        guideEl.classList.remove("hidden", "success");
        guideEl.innerHTML = `<span style="color:#ff4444;font-weight:900;">❌ ONLY IN GREEN SECTOR</span>`;
      }
      if (navigator.vibrate) navigator.vibrate([60, 30, 60]);

      // Restore the move mode text after error
      setTimeout(() => {
        if (moveMode && guideEl) {
          guideEl.innerText = "CLICK NEW POSITION FOR ARTILLERY";
        } else if (guideEl) {
          guideEl.classList.add("hidden");
        }
      }, 2200);

      return;
    }

    // Move custom artillery
    moveCustomGun(movingGunId, targetPos.x, targetPos.y);
    return;
  }
  // ----------------------------

  // ============================================================
  // FIX: CHECK IF CROSSHAIR IS VISIBLE
  // If the crosshair has an 'offsetParent', it means it is visible on screen.
  // In that case, we BLOCK the click so the red marker doesn't move.
  // ============================================================
  const crosshair = document.getElementById("mobileCrosshair");
  if (crosshair && crosshair.offsetParent !== null) {
    return;
  }
  // ============================================================

  const rect = mapContainer.getBoundingClientRect();

  // --- PRECISION FIX: SYNC CLICK WITH RENDER SNAP ---
  // We must subtract the map's position exactly as it was rendered.
  // If render() rounded the values to integers, we must subtract the rounded integer here,
  // otherwise, the shot will drift by up to 0.5px (multiplied by zoom, this causes errors).
  const isHighDPI = window.devicePixelRatio > 1;
  const useFloats = isHighDPI || (isFirefox && state.scale > 1.05);

  const currentVisualX = useFloats ? state.pointX : Math.round(state.pointX);
  const currentVisualY = useFloats ? state.pointY : Math.round(state.pointY);

  const clickX = e.clientX - rect.left - currentVisualX;
  const clickY = e.clientY - rect.top - currentVisualY;

  const effectiveZoom = state.scale * state.fitScale;
  const rawImgX = clickX / effectiveZoom;
  const rawImgY = clickY / effectiveZoom;

  // Only show pulse on map click if we are NOT on mobile using the HUD
  // (Because the HUD button handles the pulse for mobile users)
  if (!IS_MOBILE || !hudEnabled) {
    triggerFirePulse(rawImgX, rawImgY);
    // Haptic feedback for desktop shooting (Chrome/Android)
    if (navigator.vibrate) navigator.vibrate(30);
  }

  const mapImage = document.getElementById("mapImage");
  const w = mapImage.naturalWidth;
  const h = mapImage.naturalHeight;

  // Game Coordinates
  const targetPos = imagePixelsToGame(rawImgX, rawImgY, w, h);

  // Check Boundaries
  if (
    targetPos.x < GAME_LEFT ||
    targetPos.x > GAME_RIGHT ||
    targetPos.y < GAME_BOTTOM ||
    targetPos.y > GAME_TOP
  ) {
    return;
  }

  const gunPos = getActiveGunCoords();
  if (!gunPos) {
    return;
  }

  // --- SIMPLE MATH FIX (Center to Center) ---
  const dx = targetPos.x - gunPos.x;
  const dy = targetPos.y - gunPos.y;

  const distanceUnits = Math.sqrt(dx * dx + dy * dy);
  const rawDistanceMeters = distanceUnits / GAME_UNITS_PER_METER;
  const correctedDistance = Math.floor(rawDistanceMeters);

  const factionLabel = document.getElementById("factionLabel").innerText;
  const mil = getMilFromTable(correctedDistance, factionLabel);

  activeTarget = {
    gameX: targetPos.x,
    gameY: targetPos.y,
    distance: correctedDistance,
    mil: mil,
  };

  // --- FIX START: DISABLE ANIMATIONS MOMENTARILY ---
  // This stops the labels from "flying in" when they are redrawn
  toggleTransitions(false);

  if (trajSliderEnabled) {
    // 1. Re-calculate and "Lock" new angle
    const dx = activeTarget.gameX - gunPos.x;
    const dy = activeTarget.gameY - gunPos.y;
    originalAngle = Math.atan2(dy, dx);

    // 2. Snap slider handle
    const trajInput = document.getElementById("trajectoryRange");
    if (trajInput) trajInput.value = activeTarget.distance;

    // 3. THE FIX: Explicitly update the text labels
    const milDisplay = document.getElementById("trajCurrentMil");
    const meterDisplay = document.getElementById("trajCurrentMeter");

    if (milDisplay)
      milDisplay.innerText =
        activeTarget.mil !== null ? activeTarget.mil : "OUT";
    if (meterDisplay) meterDisplay.innerText = activeTarget.distance + "m";
  }

  renderMarkers();
  renderTargeting();
  render();

  // REMOVED: setTimeout hack to re-enable animations
});

// --- 3. HIGH-SPEED RESPONSIVE WHEEL ZOOM ---
let isWheelThrottled = false;

mapContainer.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();

    // Ensure transitions are strictly OFF
    mapStage.classList.remove("zoom-transition");
    document.getElementById("labelLayer")?.classList.remove("zoom-transition");
    mapStage.style.transition = "none";

    if (!isWheelThrottled) {
      isWheelThrottled = true;

      requestAnimationFrame(() => {
        const direction = e.deltaY > 0 ? -1 : 1;

        // Kept your faster scroll speed
        const SCROLL_SPEED = 1.0;

        let newZoom = currentZoomLevel + direction * SCROLL_SPEED;
        newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));

        const rect = mapContainer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (Math.abs(newZoom - currentZoomLevel) > 0.01) {
          setZoomLevel(newZoom, mouseX, mouseY);
        }

        isWheelThrottled = false;
      });
    }

    // REMOVED: The "Soft Landing" setTimeout block.
    // We no longer want to re-enable animations after scrolling stops.
  },
  { passive: false },
);

// --- 4. PANNING LOGIC (DESKTOP) ---
mapContainer.addEventListener("mousedown", (e) => {
  e.preventDefault();

  // FIX: Kill transitions on BOTH map and labels immediately
  toggleTransitions(false);

  state.panning = true;
  isDragging = false;

  dragStartX = e.clientX;
  dragStartY = e.clientY;

  state.startX = e.clientX - state.pointX;
  state.startY = e.clientY - state.pointY;

  // REMOVED: mapContainer.style.cursor = "grabbing";
  // We don't change the cursor yet!
});

window.addEventListener("mousemove", (e) => {
  if (!state.panning) return;
  e.preventDefault();

  const moveDist = Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY);

  // FIX: Only start the logic if we crossed the threshold
  if (!isDragging && moveDist > DRAG_THRESHOLD) {
    isDragging = true;
    mapContainer.style.cursor = "grabbing";
  }

  // FIX: Only pan the map if we are officially dragging
  if (isDragging) {
    handleMove(e.clientX, e.clientY);
  }
});

window.addEventListener("mouseup", () => {
  state.panning = false;
  mapContainer.style.cursor = ""; // Returns to the crosshair/dot cursor
});

// --- 5. PANNING LOGIC (MOBILE) ---
// Note: Double Tap is handled natively by "dblclick" event on most mobile browsers now
// provided touch-action is set to none (which it is in your CSS).

let initialPinchDistance = null;
let lastZoomScale = 1;

// --- 5. PANNING LOGIC (MOBILE) ---
mapContainer.addEventListener(
  "touchstart",
  (e) => {
    // FIX: Kill transitions immediately so drag is 1:1 instant
    toggleTransitions(false);

    if (e.touches.length === 1) {
      state.panning = true;
      isDragging = false;

      dragStartX = e.touches[0].clientX;
      dragStartY = e.touches[0].clientY;

      state.startX = e.touches[0].clientX - state.pointX;
      state.startY = e.touches[0].clientY - state.pointY;
    } else if (e.touches.length === 2) {
      state.panning = false;
      initialPinchDistance = getPinchDistance(e);
      lastZoomScale = state.scale;
    }
  },
  { passive: false },
);

mapContainer.addEventListener(
  "touchmove",
  (e) => {
    if (e.cancelable) e.preventDefault();

    if (e.touches.length === 1 && state.panning) {
      // Check Threshold
      const moveDist = Math.hypot(
        e.touches[0].clientX - dragStartX,
        e.touches[0].clientY - dragStartY,
      );

      if (!isDragging && moveDist > DRAG_THRESHOLD) {
        isDragging = true;
      }

      // FIX: Only move if confirmed dragging
      if (isDragging) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    } else if (e.touches.length === 2 && initialPinchDistance) {
      // Pinch Zoom Logic
      isDragging = true;
      const currentDistance = getPinchDistance(e);
      const zoomFactor = currentDistance / initialPinchDistance;

      // Calculate new zoom based on the scale at the start of the pinch
      let newZoom = lastZoomScale * zoomFactor;
      newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));

      const center = getPinchCenter(e);
      const rect = mapContainer.getBoundingClientRect();
      const mouseX = center.x - rect.left;
      const mouseY = center.y - rect.top;

      if (!isRendering) {
        isRendering = true;
        requestAnimationFrame(() => {
          // Update both the state and the tracking variable
          currentZoomLevel = newZoom;
          setZoomLevel(newZoom, mouseX, mouseY);
          isRendering = false;
        });
      }
    }
  },
  { passive: false },
);

mapContainer.addEventListener("touchend", (e) => {
  if (e.touches.length < 2) {
    initialPinchDistance = null;
  }
  if (e.touches.length === 0) {
    state.panning = false;
  }
});

// Shared Move Handler
function handleMove(clientX, clientY) {
  state.pointX = clientX - state.startX;
  state.pointY = clientY - state.startY;

  if (!isRendering) {
    isRendering = true;
    requestAnimationFrame(() => {
      render();
      isRendering = false;
    });
  }

  // Auto-save pan changes (debounced)
  clearTimeout(window.savePanTimeout);
  window.savePanTimeout = setTimeout(saveState, 1000);
}

// Fix for "Sticky Hover" on mobile
// (Mobile phones sometimes keep the :hover state after a tap)
document.addEventListener("touchstart", function () {}, true);

// --- 6. ESCAPE KEY TO CLEAR TARGET ---
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    // Only act if there is currently a target Selected
    if (activeTarget) {
      // --- FIX START: Kill Animations ---
      toggleTransitions(false);
      // ----------------------------------

      activeTarget = null; // Clear target data

      // Disable trajectory slider when target is cleared
      trajSliderEnabled = false;
      const trajToggleBtn = document.getElementById("trajToggleBtn");
      const trajContainer = document.getElementById("trajSliderContainer");
      if (trajToggleBtn) trajToggleBtn.classList.remove("active");
      if (trajContainer) trajContainer.classList.add("hidden");

      // Update visual states
      renderMarkers(); // Resets gun rotation (stops pointing at target)
      renderTargeting(); // Removes red line/circles AND hides the panel
      render(); // Refreshes the map

      // REMOVED: setTimeout hack to re-enable animations
      // -----------------------------------
    }
  }
});

// ZOOM SLIDER CONTROLS
// ==========================================

function initZoomControls() {
  const track = document.getElementById("zoomSliderTrack");
  const handle = document.getElementById("zoomSliderHandle");
  const fill = document.getElementById("zoomSliderFill");
  const btnIn = document.getElementById("btnZoomIn");
  const btnOut = document.getElementById("btnZoomOut");
  const mapStage = document.getElementById("mapStage");

  if (!track || !handle) return;

  // --- 1. SYNC UI FROM STATE ---
  window.updateZoomSliderUI = function () {
    const range = MAX_ZOOM - MIN_ZOOM;
    const progress = (state.scale - MIN_ZOOM) / range;
    const percentage = Math.max(0, Math.min(1, progress)) * 100;

    handle.style.bottom = `${percentage}%`;
    fill.style.height = `${percentage}%`;
  };

  // --- 2. HANDLE DRAG LOGIC ---
  let isDraggingSlider = false;

  function updateZoomFromEvent(e) {
    const rect = track.getBoundingClientRect();
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // Calculate percentage from bottom of track
    let val = (rect.bottom - clientY) / rect.height;
    val = Math.max(0, Math.min(1, val));

    const newZoom = MIN_ZOOM + val * (MAX_ZOOM - MIN_ZOOM);

    // Zoom into visual center of container
    const containerRect = mapContainer.getBoundingClientRect();
    setZoomLevel(newZoom, containerRect.width / 2, containerRect.height / 2);
  }

  // --- EVENTS ---
  const startDrag = (e) => {
    isDraggingSlider = true;

    // FORCE KILL ALL TRANSITIONS
    mapStage.style.transition = "none";
    mapStage.classList.remove("zoom-transition");

    updateZoomFromEvent(e);
    // Vibrate on interaction start
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const doDrag = (e) => {
    if (!isDraggingSlider) return;
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();

    requestAnimationFrame(() => updateZoomFromEvent(e));
  };

  const endDrag = () => {
    isDraggingSlider = false;
    // REMOVED: mapStage.classList.add("zoom-transition");
  };

  // Track Listeners
  track.addEventListener("mousedown", startDrag);
  track.addEventListener("touchstart", startDrag, { passive: false });

  window.addEventListener("mousemove", (e) => {
    if (isDraggingSlider) updateZoomFromEvent(e);
  });
  window.addEventListener("touchmove", doDrag, { passive: false });

  window.addEventListener("mouseup", endDrag);
  window.addEventListener("touchend", endDrag);

  // --- 3. BUTTONS (INSTANT SNAP) ---
  const handleBtn = (e, direction) => {
    // 1. Stop browser defaults (Zooming/Scrolling)
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();

    const btn = e.currentTarget;

    // Debounce: If already pressed, ignore
    if (btn.classList.contains("pressed")) return;

    // 2. VIBRATION FIX (Chrome Mobile)
    // Increased to 25ms so it is distinctly felt on Android
    if (navigator.vibrate) navigator.vibrate(25);

    // 3. Visual Feedback
    btn.classList.add("pressed");
    setTimeout(() => btn.classList.remove("pressed"), 150);

    // 4. FORCE KILL TRANSITIONS HERE TOO
    mapStage.style.transition = "none";
    mapStage.classList.remove("zoom-transition");

    // 5. Zoom Logic
    // CHANGE: Mobile uses 2.0 step for speed, Desktop uses 1.0 for precision
    const step = IS_MOBILE ? 2.0 : 1.0;

    let target = state.scale + direction * step;
    target = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, target));

    const rect = mapContainer.getBoundingClientRect();

    // Instant set (Safe for Mobile)
    setZoomLevel(target, rect.width / 2, rect.height / 2);
  };
  btnIn.addEventListener("touchstart", (e) => handleBtn(e, 1), {
    passive: false,
  });
  btnOut.addEventListener("touchstart", (e) => handleBtn(e, -1), {
    passive: false,
  });
  btnIn.addEventListener("click", (e) => handleBtn(e, 1));
  btnOut.addEventListener("click", (e) => handleBtn(e, -1));
}

// Initialize
initZoomControls();

// Apply panel hidden state immediately when DOM is ready (early as possible)
document.addEventListener("DOMContentLoaded", function () {
  const controlsDrawer = document.getElementById("controlsDrawer");
  const toggleBtn = document.getElementById("drawerToggleBtn");

  if (controlsDrawer) {
    if (window.savedPanelHidden) {
      // Apply hidden state immediately
      controlsDrawer.classList.add("closed");
      // NEW: If starting closed, assume user knows the UI or arrows aren't needed
      document.body.classList.add("guides-dismissed");
    }
  }

  // Set initial aria-expanded state
  if (toggleBtn && controlsDrawer) {
    const isClosed = controlsDrawer.classList.contains("closed");
    toggleBtn.setAttribute("aria-expanded", isClosed ? "false" : "true");
  }

  const drawer = document.getElementById("controlsDrawer");

  if (toggleBtn && drawer) {
    toggleBtn.addEventListener("click", () => {
      drawer.classList.toggle("closed");

      // --- NEW: PERMANENTLY HIDE ARROWS ON CLOSE ---
      // Once closed (even once), we never show arrows again this session
      if (drawer.classList.contains("closed")) {
        document.body.classList.add("guides-dismissed");
      }
      // ---------------------------------------------

      // Update aria-expanded attribute for accessibility
      const isClosed = drawer.classList.contains("closed");
      toggleBtn.setAttribute("aria-expanded", isClosed ? "false" : "true");

      // --- THE FIX: Update global state immediately ---
      // This ensures that if you switch maps later, initMap() knows
      // the panel is currently OPEN and won't force it closed.
      window.savedPanelHidden = isClosed;

      // Safety: Close dropdowns if we minimize
      if (drawer.classList.contains("closed")) {
        document
          .querySelectorAll(".dropdown-menu")
          .forEach((el) => el.classList.add("hidden"));
        document
          .querySelectorAll(".btn-map-Select")
          .forEach((el) => el.classList.remove("active"));
      }

      // Save panel state
      saveState();
    });
  }

  // Inject version number into UI elements
  const versionEl = document.getElementById("appVersion");
  if (versionEl) {
    versionEl.textContent = APP_VERSION;
  }

  const versionPanelEl = document.getElementById("appVersionPanel");
  if (versionPanelEl) {
    versionPanelEl.textContent = APP_VERSION;
  }

  // --- CHANGELOG MODAL LOGIC ---

  const changelogBtn = document.getElementById("changelogBtn");
  const changelogBtnPanel = document.getElementById("changelogBtnPanel");
  const changelogModal = document.getElementById("changelogModal");
  const closeChangelogBtn = document.getElementById("closeChangelogBtn");
  const changelogContent = document.getElementById("changelogContent");

  function openChangelog() {
    changelogModal.classList.add("active");
    loadChangelog();
  }

  function closeChangelog() {
    changelogModal.classList.remove("active");
  }

  async function loadChangelog() {
    try {
      const response = await fetch("CHANGELOG.md");
      // FIX #3: Check HTTP status before reading body.
      // Without this, a 404 would render the server's HTML error page as markdown.
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} — ${response.statusText}`);
      }
      const text = await response.text();
      changelogContent.innerHTML = parseMarkdown(text);
    } catch (error) {
      console.error("Failed to load changelog:", error);
      changelogContent.textContent =
        "Failed to load changelog. Make sure you are running this on a web server (not file://).";
    }
  }

  function parseMarkdown(text) {
    // Simple markdown parser for changelog
    let html = text;
    // Convert headers (order matters: h3 before h2 before h1)
    html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
    html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
    html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
    // Convert lists
    html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
    // Wrap lists
    html = html.replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>");
    // Convert bold
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    // Convert line breaks
    html = html.replace(/\n\n/g, "<br><br>");
    return html;
  }

  if (changelogBtn) {
    changelogBtn.addEventListener("click", openChangelog);
  }

  if (changelogBtnPanel) {
    changelogBtnPanel.addEventListener("click", openChangelog);
  }

  if (closeChangelogBtn) {
    closeChangelogBtn.addEventListener("click", closeChangelog);
  }

  if (changelogModal) {
    changelogModal.addEventListener("click", (e) => {
      if (e.target === changelogModal) {
        closeChangelog();
      }
    });
  }

  // --- MAP HISTORY MODAL LOGIC ---

  const mapHistoryModal = document.getElementById("mapHistoryModal");
  const closeHistoryBtn = document.getElementById("closeHistoryBtn");

  function closeMapHistory() {
    if (mapHistoryModal) {
      mapHistoryModal.classList.remove("active");
    }
  }

  if (closeHistoryBtn) {
    closeHistoryBtn.addEventListener("click", closeMapHistory);
  }

  if (mapHistoryModal) {
    mapHistoryModal.addEventListener("click", (e) => {
      if (e.target === mapHistoryModal) {
        closeMapHistory();
      }
    });
  }

  // --- MANUAL CALCULATOR MODAL LOGIC ---

  const btnOpenManualCalc = document.getElementById("btnOpenManualCalc");
  const calcModal = document.getElementById("calcModal");
  const mapModal = document.getElementById("mapModal");

  if (btnOpenManualCalc && calcModal) {
    btnOpenManualCalc.addEventListener("click", (e) => {
      e.stopPropagation();
      calcModal.classList.add("active");

      // FORCE BLUR: Remove focus immediately so highlight doesn't stay
      btnOpenManualCalc.blur();
    });
  }

  // 2. Close Calculator specifically
  const closeCalcBtn = document.getElementById("closeCalcBtn");
  if (closeCalcBtn && calcModal) {
    const handleCloseCalc = (e) => {
      e.preventDefault();
      e.stopPropagation();
      calcModal.classList.remove("active");
      // Notice: We DO NOT touch mapModal here.
      // If it was open, it stays open.
    };
    closeCalcBtn.addEventListener("click", handleCloseCalc);
    closeCalcBtn.addEventListener("touchstart", handleCloseCalc, {
      passive: false,
    });
  }

  // 3. Overlay click for Calculator only
  if (calcModal) {
    calcModal.addEventListener("click", (e) => {
      if (e.target === calcModal) {
        calcModal.classList.remove("active");
      }
    });
  }
});

// ==========================================
// MANUAL CALCULATOR LOGIC
// ==========================================

// Track calculator faction independently from the map
// let manualCalcFaction = "us"; // REMOVED - moved to top

function openManualCalculator() {
  document.getElementById("calcModal").classList.add("active");

  updateCalcFactionDisplay();
  clearInput();
}

function closeManualCalculator() {
  document.getElementById("calcModal").classList.remove("active");
}

// Close button listener with Touch Support
const closeCalcBtn = document.getElementById("closeCalcBtn");
if (closeCalcBtn) {
  const handleClose = (e) => {
    if (e.cancelable) e.preventDefault();
    closeManualCalculator();
  };

  closeCalcBtn.addEventListener("click", handleClose);
  closeCalcBtn.addEventListener("touchstart", handleClose, { passive: false });
}

// Clear history button listener
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
if (clearHistoryBtn) {
  const handleClearHistory = (e) => {
    if (e.cancelable) e.preventDefault();
    // Haptic feedback for Chrome/Android
    if (navigator.vibrate) navigator.vibrate(10);
    calcHistory = [];
    renderCalcHistory();
    saveState();
  };

  clearHistoryBtn.addEventListener("click", handleClearHistory);
  clearHistoryBtn.addEventListener("touchstart", handleClearHistory, {
    passive: false,
  });
}

// History enabled toggle listener
const historyEnabledToggle = document.getElementById("historyEnabledToggle");
if (historyEnabledToggle) {
  const handleHistoryEnabledToggle = (e) => {
    // Haptic feedback for Chrome/Android
    if (navigator.vibrate) navigator.vibrate(10);
    historyEnabled = e.target.checked;
    updateCalcButton();

    // Update history display based on enabled state
    if (historyEnabled) {
      renderCalcHistory();
      // Auto-expand history when enabled
      if (historyCollapsed) {
        const toggleHistoryBtn = document.getElementById("toggleHistoryBtn");
        if (toggleHistoryBtn) {
          toggleHistoryBtn.click();
        }
      }
    } else {
      renderCalcHistory(); // This will show "History disabled" since calcHistory won't save when disabled
      // Auto-collapse history when disabled
      if (!historyCollapsed) {
        const toggleHistoryBtn = document.getElementById("toggleHistoryBtn");
        if (toggleHistoryBtn) {
          toggleHistoryBtn.click();
        }
      }
    }

    // Hide CLEAR button when history is disabled
    const clearBtn = document.getElementById("clearHistoryBtn");
    if (clearBtn) {
      clearBtn.style.visibility = historyEnabled ? "visible" : "hidden";
    }

    saveState();
  };

  historyEnabledToggle.addEventListener("change", handleHistoryEnabledToggle);
}

// Function to update the C/SAVE button based on history enabled state
function updateCalcButton() {
  const saveBtn = document.getElementById("calcSaveBtn");
  if (!saveBtn) return;

  if (historyEnabled) {
    saveBtn.innerHTML =
      '<span class="red-text">C</span><hr class="button-divider"><span class="green-text">SAVE</span>';
  } else {
    saveBtn.innerHTML = '<span class="red-text">C</span>';
  }
}
const toggleHistoryBtn = document.getElementById("toggleHistoryBtn");
if (toggleHistoryBtn) {
  const handleToggleHistory = (e) => {
    if (e.cancelable) e.preventDefault();
    historyCollapsed = !historyCollapsed;
    const historyList = document.getElementById("calcHistoryList");
    if (historyList) {
      historyList.style.display = historyCollapsed ? "none" : "block";
    }

    // Update modal height based on collapsed state using CSS class
    const modalContent = document.querySelector("#calcModal .modal-content");
    if (modalContent) {
      if (historyCollapsed) {
        modalContent.classList.remove("history-expanded");
      } else {
        modalContent.classList.add("history-expanded");
      }
    }

    // Update arrow rotation (flipped logic)
    if (historyCollapsed) {
      toggleHistoryBtn.style.transform = "rotate(0deg)";
      toggleHistoryBtn.classList.add("collapsed");
    } else {
      toggleHistoryBtn.style.transform = "rotate(180deg)";
      toggleHistoryBtn.classList.remove("collapsed");
    }

    // Hide CLEAR button when history is disabled
    const clearBtn = document.getElementById("clearHistoryBtn");
    if (clearBtn) {
      clearBtn.style.visibility = historyEnabled ? "visible" : "hidden";
    }

    saveState();
  };

  toggleHistoryBtn.addEventListener("click", handleToggleHistory);
  toggleHistoryBtn.addEventListener("touchstart", handleToggleHistory, {
    passive: false,
  });
}

// UNIVERSAL FACTION TOGGLE (Strict Cycle with Debounce)
const factionToggleBtn = document.getElementById("calcFactionToggle");
let isToggleCooldown = false; // Debounce flag

if (factionToggleBtn) {
  // Helper function to handle cycle safely
  const cycleFaction = (e) => {
    // Prevent rapid-fire clicks (Debounce for 200ms)
    if (isToggleCooldown) return;
    isToggleCooldown = true;
    setTimeout(() => {
      isToggleCooldown = false;
    }, 200);

    // Prevent default browser behaviors (zoom, Selection)
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // STRICT CYCLE: US -> GER -> RUS -> GB -> US
    if (manualCalcFaction === "us") {
      manualCalcFaction = "ger";
    } else if (manualCalcFaction === "ger") {
      manualCalcFaction = "rus";
    } else if (manualCalcFaction === "rus") {
      manualCalcFaction = "gb";
    } else {
      manualCalcFaction = "us"; // Default loop back
    }

    // Update UI
    updateCalcFactionDisplay();

    // Recalculate result instantly
    calculateManual();

    // Save manual calculator faction preference
    saveState();
  };

  // Use 'click' for desktop and standard mobile behavior
  // If 'touchend' was causing double-fires, stick to 'click' or manage listeners carefully.
  // Modern browsers handle 'click' well on mobile if viewport is set correctly.
  factionToggleBtn.addEventListener("click", cycleFaction);
}

function updateCalcFactionDisplay() {
  const lbl = document.getElementById("calcFactionName");
  const img = document.getElementById("calcFlag");

  if (!lbl || !img) return;

  // 1. Get correct flag image using your helper
  const flagPath = getFlagImage(manualCalcFaction);

  // 2. Determine Display Name based on strict code
  let name = "US";
  switch (manualCalcFaction) {
    case "ger":
      name = "GERMANY";
      break;
    case "rus":
      name = "SOVIET UNION";
      break;
    case "gb":
      name = "ALLIES";
      break;
    default:
      name = "UNITED STATES";
      break;
  }

  lbl.innerText = name;
  img.src = flagPath;
}

// --- Keypad Logic (Fast & Clean) ---
window.inputDigit = function (num) {
  if (calcInputVal.length >= 4) return;
  if (calcInputVal === "0") calcInputVal = "";
  calcInputVal += num;
  updateCalcScreen();
};

window.clearInput = function () {
  calcInputVal = "0";
  updateCalcScreen();
};

window.backspaceInput = function () {
  if (calcInputVal.length > 1) {
    calcInputVal = calcInputVal.slice(0, -1);
  } else {
    calcInputVal = "0";
  }
  updateCalcScreen();
};

window.saveCalculation = function () {
  const dist = parseInt(calcInputVal);
  const mils = getMilFromTable(dist, manualCalcFaction);

  // Only save to history if enabled
  if (historyEnabled && mils !== null && !isNaN(dist)) {
    calcHistory.unshift({
      distance: dist,
      mil: mils,
      faction: manualCalcFaction,
      timestamp: new Date().toLocaleTimeString(),
    });

    if (calcHistory.length > 10) {
      calcHistory.pop();
    }

    renderCalcHistory();
    saveState();
  }
  // Clear input after saving (or just clear if history disabled)
  calcInputVal = "0";
  updateCalcScreen();
};

function fixKeypadEvents() {
  const keys = document.querySelectorAll(".calc-keypad .key");

  // GLOBAL GATEKEEPER: Tracks the last time a finger touched ANY key.
  let lastTouchTime = 0;

  keys.forEach((key) => {
    // 1. Extract the intended action from the HTML
    const rawAction = key.getAttribute("onclick");
    if (!rawAction) return;

    // 2. Kill the inline handler immediately
    key.onclick = null;
    key.removeAttribute("onclick");

    // 3. Define the logic to run
    const executeLogic = () => {
      if (rawAction.includes("inputDigit")) {
        const match = rawAction.match(/\d+/);
        if (match) window.inputDigit(match[0]);
      } else if (rawAction.includes("clearInput")) {
        window.clearInput();
      } else if (rawAction.includes("backspaceInput")) {
        window.backspaceInput();
      } else if (rawAction.includes("saveCalculation")) {
        window.saveCalculation();
      }
    };

    // 4. TOUCH LISTENER (Primary for Mobile)
    // This runs INSTANTLY. No delay. Allows fast typing.
    key.addEventListener(
      "touchstart",
      (e) => {
        // Update the global timer
        lastTouchTime = Date.now();

        // Try to stop the ghost click physically
        if (e.cancelable) e.preventDefault();

        // --- NEW: Add Vibration ---
        if (navigator.vibrate) navigator.vibrate(15);
        // --------------------------

        // Visual Feedback
        key.classList.add("pressed");
        setTimeout(() => key.classList.remove("pressed"), 100);

        executeLogic();
      },
      { passive: false },
    );

    // 5. CLICK LISTENER (Fallback for Desktop)
    key.addEventListener("click", (e) => {
      const now = Date.now();
      // Increase gap to 600ms and stop propagation
      if (now - lastTouchTime < 600) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      executeLogic();
    });
  });
}

function updateCalcScreen() {
  const display = document.getElementById("calcInput");
  if (display) display.value = calcInputVal;
  calculateManual();
}

// Add keyboard input support for calculator
const calcInputEl = document.getElementById("calcInput");
if (calcInputEl) {
  // Handle input when user types
  calcInputEl.addEventListener("input", (e) => {
    let val = e.target.value.replace(/[^0-9]/g, ""); // Only allow numbers
    if (val.length > 4) val = val.slice(0, 4); // Max 4 digits
    calcInputVal = val === "" ? "0" : val;
    e.target.value = val;
    calculateManual();
  });

  // Clear 0 on focus
  calcInputEl.addEventListener("focus", (e) => {
    if (e.target.value === "0") {
      e.target.value = "";
      calcInputVal = "";
    }
  });

  // Handle special keys
  calcInputEl.addEventListener("keydown", (e) => {
    if (e.key === "Backspace") {
      if (calcInputVal.length > 1) {
        calcInputVal = calcInputVal.slice(0, -1);
      } else {
        calcInputVal = "";
      }
      calcInputEl.value = calcInputVal;
      calculateManual();
    } else if (e.key === "Enter") {
      // Save to history before clearing (only if enabled)
      const dist = parseInt(calcInputVal);
      const mils = getMilFromTable(dist, manualCalcFaction);
      if (historyEnabled && mils !== null && !isNaN(dist)) {
        calcHistory.unshift({
          distance: dist,
          mil: mils,
          faction: manualCalcFaction,
          timestamp: new Date().toLocaleTimeString(),
        });

        if (calcHistory.length > 10) {
          calcHistory.pop();
        }

        renderCalcHistory();
        saveState();
      }
      // Clear input after saving (or just clear if history disabled)
      calcInputVal = "";
      calcInputEl.value = "";
      calculateManual();
    } else if (e.key === "Escape") {
      closeManualCalculator();
    }
  });
}

function calculateManual() {
  const dist = parseInt(calcInputVal);
  const milEl = document.getElementById("calcMil");
  if (!milEl) return;

  // 1. Get result directly (returns null if out of range)
  const mils = getMilFromTable(dist, manualCalcFaction);

  // 2. check result
  if (mils === null || isNaN(dist)) {
    milEl.innerText = "---";
    milEl.className = "res-value text-red";
  } else {
    milEl.className = "res-value text-yellow";
    milEl.innerText = mils;
  }
}

function renderCalcHistory() {
  const historyList = document.getElementById("calcHistoryList");
  if (!historyList) return;

  if (!historyEnabled) {
    historyList.innerHTML = '<div class="history-empty">History disabled</div>';
    return;
  }

  if (calcHistory.length === 0) {
    historyList.innerHTML =
      '<div class="history-empty">No calculations yet</div>';
    return;
  }

  // FIX #6: Build history items with the DOM API instead of innerHTML.
  // entry.mil / entry.distance / entry.timestamp come from localStorage and must
  // never be injected as raw HTML — a tampered storage entry could run arbitrary JS.
  historyList.innerHTML = ""; // clear only once with a trusted empty string
  const fragment = document.createDocumentFragment();

  calcHistory.forEach((entry, index) => {
    let factionName = "US";
    let flagPath = "images/flags/us.webp";
    if (entry.faction === "ger" || entry.faction === "axis") {
      factionName = "GER";
      flagPath = "images/flags/ger.webp";
    } else if (entry.faction === "us") {
      factionName = "US";
      flagPath = "images/flags/us.webp";
    } else if (entry.faction === "rus") {
      factionName = "SOV";
      flagPath = "images/flags/rus.webp";
    } else if (entry.faction === "gb") {
      factionName = "ALLIES";
      flagPath = "images/flags/gb.webp";
    }

    const item = document.createElement("div");
    item.className = "history-item";
    item.dataset.index = index;

    // Faction column
    const factionDiv = document.createElement("div");
    factionDiv.className = "history-faction";
    const flagImg = document.createElement("img");
    flagImg.src = flagPath; // controlled value — safe
    flagImg.className = "history-flag";
    flagImg.alt = factionName; // controlled value — safe
    const factionSpan = document.createElement("span");
    factionSpan.textContent = factionName; // controlled value — safe
    factionDiv.appendChild(flagImg);
    factionDiv.appendChild(factionSpan);

    // Values column
    const valuesDiv = document.createElement("div");
    valuesDiv.className = "history-values";
    const milSpan = document.createElement("span");
    milSpan.className = "history-mil text-yellow";
    milSpan.textContent = `${entry.mil} MIL`; // textContent — safe even if tampered
    const distSpan = document.createElement("span");
    distSpan.className = "history-dist";
    distSpan.textContent = `${entry.distance}m`; // textContent — safe
    valuesDiv.appendChild(milSpan);
    valuesDiv.appendChild(distSpan);

    // Timestamp
    const timeDiv = document.createElement("div");
    timeDiv.className = "history-time";
    timeDiv.textContent = entry.timestamp; // textContent — safe

    item.appendChild(factionDiv);
    item.appendChild(valuesDiv);
    item.appendChild(timeDiv);
    fragment.appendChild(item);
  });

  historyList.appendChild(fragment);
}

// --- LIVE HUD MOUSE TRACKING & RINGS (OPTIMIZED) ---
let isHudUpdating = false; // Semaphore flag

document.addEventListener("mousemove", (e) => {
  // 1. Global Checks
  if (!hudEnabled) return;
  if (IS_MOBILE) return;

  // 2. Visuals: Move these instantly (Force Override CSS)
  // PERF FIX: Use element cache — these two lookups ran on every mousemove event (pre-RAF throttle)
  const hudEl = cached.getElem("liveCursorHud");
  const ringsEl = cached.getElem("desktopCursorRings");

  if (hudEl) {
    // FIX: Use 'important' to beat any CSS centering rules
    hudEl.style.setProperty("left", e.clientX + 20 + "px", "important");
    hudEl.style.setProperty("top", e.clientY + 20 + "px", "important");
    // FIX: Reveal the element now that we have valid coordinates
    hudEl.style.opacity = "1";
  }
  if (ringsEl) {
    // FIX: Use 'important' to beat any CSS positioning
    ringsEl.style.setProperty("left", e.clientX + "px", "important");
    ringsEl.style.setProperty("top", e.clientY + "px", "important");
    // FIX: Reveal the element now that we have valid coordinates
    ringsEl.style.opacity = "1";
  }

  // 3. Heavy Math: Throttle this!
  if (!isHudUpdating) {
    isHudUpdating = true;

    requestAnimationFrame(() => {
      // Safety Check: Ensure mapContainer exists before calculating
      const mapContainer = cached.mapContainer;
      if (!mapContainer) {
        isHudUpdating = false;
        return;
      }

      // PERFORMANCE FIX: Cache getBoundingClientRect, only recalc every 100ms
      if (!_mapRectCache || Date.now() - _mapRectTime > 100) {
        _mapRectCache = mapContainer.getBoundingClientRect();
        _mapRectTime = Date.now();
      }
      const rect = _mapRectCache;

      // Bounds Check
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        isHudUpdating = false;
        return;
      }

      const clickX = e.clientX - rect.left - state.pointX;
      const clickY = e.clientY - rect.top - state.pointY;
      const effectiveZoom = state.scale * state.fitScale;

      const rawImgX = clickX / effectiveZoom;
      const rawImgY = clickY / effectiveZoom;

      // PERF FIX: Use cached element references throughout — all these getElementById
      // calls were running on every RAF tick while the mouse was moving.
      const mapImage = cached.mapImage;
      if (mapImage) {
        const w = mapImage.naturalWidth;
        const h = mapImage.naturalHeight;

        const targetPos = imagePixelsToGame(rawImgX, rawImgY, w, h);
        const gunPos = getActiveGunCoords();

        // Update Text Data
        if (gunPos) {
          const dx = targetPos.x - gunPos.x;
          const dy = targetPos.y - gunPos.y;
          const dist = Math.floor(
            Math.sqrt(dx * dx + dy * dy) / GAME_UNITS_PER_METER,
          );

          const factionLabel = cached.factionLabel.innerText;
          const mil = getMilFromTable(dist, factionLabel);

          const hudDist = cached.getElem("hudDist");
          const hudMil = cached.getElem("hudMil");

          if (hudDist) hudDist.innerText = dist + "m";
          if (hudMil) hudMil.innerText = mil !== null ? mil : "---";
        } else {
          const hudDist = cached.getElem("hudDist");
          const hudMil = cached.getElem("hudMil");
          if (hudDist) hudDist.innerText = "---";
          if (hudMil) hudMil.innerText = "---";
        }

        const hudGrid = cached.getElem("hudGrid");
        if (hudGrid) hudGrid.innerText = getGridRef(targetPos.x, targetPos.y);
      }

      isHudUpdating = false; // Release the lock
    });
  }
});

// --- NEW: Mobile HUD Logic ---

// Global cache vars moved to top of script to prevent initialization errors

function updateMobileHud() {
  // Only run if HUD is enabled and we are on mobile
  if (!hudEnabled || !IS_MOBILE) return;

  // SAFETY FORCE: Keep rings visible when Live HUD is active (even after faction change)
  const crosshair = cached.getElem("mobileCrosshair");
  const ringContainer = cached.getElem("mobileRingContainer");
  if (crosshair && !crosshair.classList.contains("placement-mode")) {
    crosshair.classList.remove("hidden");
    crosshair.style.display = "block";
    crosshair.style.opacity = "1";
    if (ringContainer) ringContainer.style.display = "block";
  }

  const mapImage = cached.mapImage; // use element cache instead of getElementById each frame
  const mapContainer = cached.mapContainer;
  if (!mapContainer) return;
  // PERFORMANCE FIX: Use cached rect if fresh (from render loop)
  const rect =
    _mapRectCache && Date.now() - _mapRectTime < 100
      ? _mapRectCache
      : mapContainer.getBoundingClientRect();

  // --- 1. Calculate Center ---
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const effectiveZoom = state.scale * state.fitScale;
  const rawImgX = (centerX - state.pointX) / effectiveZoom;
  const rawImgY = (centerY - state.pointY) / effectiveZoom;

  const w = mapImage.naturalWidth;
  const h = mapImage.naturalHeight;

  // --- 2. Scale 3-Ring Container ---
  const dims = getMapDimensions();
  const totalMapMeters = dims.width / GAME_UNITS_PER_METER;
  const currentMapPixelWidth = w * effectiveZoom;
  const pixelsPerMeter = currentMapPixelWidth / totalMapMeters;

  // Scale container to 40m Diameter
  const dispersionDiameterMeters = 40;
  const rawSize = pixelsPerMeter * dispersionDiameterMeters;

  // FIX: Force Even Integer for perfect centering
  const containerSize = Math.round(rawSize / 2) * 2;

  const containerEl = cached.getElem("mobileRingContainer");
  // Skip the DOM write when the size hasn't changed (panning at fixed zoom hits this every frame)
  if (containerEl && containerSize !== _lastMobContainerSize) {
    containerEl.style.width = `${containerSize}px`;
    containerEl.style.height = `${containerSize}px`;
    _lastMobContainerSize = containerSize;
  }

  // --- 3. Update HUD Text (Optimized) ---
  const targetPos = imagePixelsToGame(rawImgX, rawImgY, w, h);
  const gunPos = getActiveGunCoords();

  if (gunPos) {
    const dx = targetPos.x - gunPos.x;
    const dy = targetPos.y - gunPos.y;
    const dist = Math.floor(
      Math.sqrt(dx * dx + dy * dy) / GAME_UNITS_PER_METER,
    );

    const factionLabel = cached.factionLabel.innerText; // use element cache instead of getElementById each frame

    // OPTIMIZATION: Only calculate Mil if distance changed OR if we have no cached mil value
    if (dist !== _lastMobDist || _lastMobMil === null) {
      const mil = getMilFromTable(dist, factionLabel);
      _lastMobMil = mil; // Update cache

      const hudMil = cached.getElem("hudMil");
      if (hudMil) {
        hudMil.innerText = mil !== null ? mil : "---";
      }

      const hudDist = cached.getElem("hudDist");
      if (hudDist) {
        hudDist.innerText = dist + "m";
      }
      _lastMobDist = dist;
    }
  } else {
    // --- FIX: CLEAR HUD WHEN NO GUN IS SELECTED ---
    // This runs when you switch factions (activeGunIndex becomes -1)
    const hudMil = cached.getElem("hudMil");
    if (hudMil && hudMil.innerText !== "---") hudMil.innerText = "---";

    const hudDist = cached.getElem("hudDist");
    if (hudDist && hudDist.innerText !== "---") hudDist.innerText = "---";

    // Reset cache so it updates instantly when a gun IS selected later
    _lastMobDist = null;
    _lastMobMil = null;
  }

  // Grid Ref optimization
  const gridRef = getGridRef(targetPos.x, targetPos.y);
  if (gridRef !== _lastMobGrid) {
    const hudGrid = cached.getElem("hudGrid");
    if (hudGrid) hudGrid.innerText = gridRef;
    _lastMobGrid = gridRef;
  }
}

// --- NEW: Mobile Fire Logic (Optimized - No Transition Code) ---
function fireAtCenter() {
  const mapImage = cached.mapImage;
  const w = mapImage.naturalWidth;
  const h = mapImage.naturalHeight;

  // Use clientWidth/Height for more stable mobile centering
  const visualCenterX = mapContainer.clientWidth / 2;
  const visualCenterY = mapContainer.clientHeight / 2;

  const effectiveZoom = state.scale * state.fitScale;

  // rawImgX/Y are the exact pixel coordinates on the original map image
  const rawImgX = (visualCenterX - state.pointX) / effectiveZoom;
  const rawImgY = (visualCenterY - state.pointY) / effectiveZoom;

  const targetPos = imagePixelsToGame(rawImgX, rawImgY, w, h);

  const gunPos = getActiveGunCoords();
  if (!gunPos) return;

  // 2. Ballistics Math
  const dx = targetPos.x - gunPos.x;
  const dy = targetPos.y - gunPos.y;

  const distanceUnits = Math.sqrt(dx * dx + dy * dy);
  const rawDistanceMeters = distanceUnits / GAME_UNITS_PER_METER;
  const correctedDistance = Math.floor(rawDistanceMeters);

  const factionLabel = document.getElementById("factionLabel").innerText;
  const mil = getMilFromTable(correctedDistance, factionLabel);

  activeTarget = {
    gameX: targetPos.x,
    gameY: targetPos.y,
    distance: correctedDistance,
    mil: mil,
  };

  // 3. Update Trajectory Slider Data (Silent update)
  if (trajSliderEnabled) {
    originalAngle = Math.atan2(dy, dx);
    const trajInput = document.getElementById("trajectoryRange");
    if (trajInput) trajInput.value = activeTarget.distance;
    const milDisplay = document.getElementById("trajCurrentMil");
    const meterDisplay = document.getElementById("trajCurrentMeter");
    if (milDisplay)
      milDisplay.innerText =
        activeTarget.mil !== null ? activeTarget.mil : "OUT";
    if (meterDisplay) meterDisplay.innerText = activeTarget.distance + "m";
  }

  // --- FIX: VISUAL PULSE ---
  // Pass the calculated raw pixels directly. No extra math needed.
  triggerFirePulse(rawImgX, rawImgY);
  // -------------------------

  // 4. Render Instantly
  renderMarkers();
  renderTargeting();
  render();
}

function placeAtCenter() {
  const mapImage = cached.mapImage;
  const w = mapImage.naturalWidth;
  const h = mapImage.naturalHeight;

  const visualCenterX = mapContainer.clientWidth / 2;
  const visualCenterY = mapContainer.clientHeight / 2;
  const effectiveZoom = state.scale * state.fitScale;

  const rawImgX = (visualCenterX - state.pointX) / effectiveZoom;
  const rawImgY = (visualCenterY - state.pointY) / effectiveZoom;

  const targetPos = imagePixelsToGame(rawImgX, rawImgY, w, h);

  placeCustomArtillery(targetPos.x, targetPos.y);

  if (navigator.vibrate) navigator.vibrate(30);
}

// ==========================================
// FINAL INITIALIZATION
// ==========================================

// Build initial UI
createStickyLabels();
initMapSelector();
renderMapGrid("");

// Load saved data (single call)
loadState();

// Fallback / UI setup that was in the first block
if (!MAP_DATABASE[activeMapKey]) {
  activeMapKey = "CAR";
}
currentStrongpoints = MAP_DATABASE[activeMapKey].strongpoints || [];
document.getElementById("currentMapName").innerText =
  MAP_DATABASE[activeMapKey].name;
updatePageTitle(MAP_DATABASE[activeMapKey].name);
updateFactionUI(MAP_DATABASE[activeMapKey]);
updateGunUI(MAP_DATABASE[activeMapKey]);
initArtyControls();
syncToggleUI();

// Handle first-time visit (No save found)
if (localStorage.getItem("hllArtyCalculatorState") === null) {
  openMapSelector();
}

// Load the map image last
const imgEl = document.getElementById("mapImage");
imgEl.src = MAP_DATABASE[activeMapKey].image;

const MAX_INIT_RETRIES = 100; // 100 × 50ms = 5 seconds max wait
let initRetryCount = 0;

const onInitLoadWithRetry = function () {
  // Loop until image has physical dimensions (Fixes "Stuck Zoom" on Reload)
  if (imgEl.naturalWidth === 0) {
    if (initRetryCount >= MAX_INIT_RETRIES) {
      // Image failed to load within the time limit — stop looping and
      // show a user-visible error instead of spinning forever.
      hideLoading();
      const loading = document.getElementById("loadingOverlay");
      if (loading) {
        loading.style.display = "flex";
        loading.innerHTML =
          '<div style="color:#ff4444;font-size:1rem;text-align:center;padding:2rem;">⚠️ Failed to load map image.<br>Check your connection and reload.</div>';
      }
      console.error(
        "[HLL] Map image failed to load after max retries:",
        imgEl.src,
      );
      return;
    }
    initRetryCount++;
    setTimeout(onInitLoadWithRetry, 50);
    return;
  }

  initMap();
  render();
  hideLoading();
};

// Also catch hard load errors (404, network failure)
imgEl.onerror = function () {
  hideLoading();
  const loading = document.getElementById("loadingOverlay");
  if (loading) {
    loading.style.display = "flex";
    loading.innerHTML =
      '<div style="color:#ff4444;font-size:1rem;text-align:center;padding:2rem;">⚠️ Failed to load map image.<br>Check your connection and reload.</div>';
  }
  console.error("[HLL] Map image onerror fired:", imgEl.src);
};

if (imgEl.complete) {
  onInitLoadWithRetry();
} else {
  imgEl.onload = onInitLoadWithRetry;
}

// Ensure ResizeObserver doesn't trigger bad math if image isn't ready
new ResizeObserver(() => {
  if (imgEl.naturalWidth > 0) {
    clearTimeout(window._resizeTimeout);
    window._resizeTimeout = setTimeout(() => {
      // PERFORMANCE FIX: Update cache on resize
      _mapRectCache = mapContainer.getBoundingClientRect();
      _mapRectTime = Date.now();
      updateDimensions();
      render();
    }, 100); // Debounce: wait for resize to settle
  }
}).observe(mapContainer);

// --- PROJECTS MODAL LOGIC ---

const btnOtherProjects = document.getElementById("btnOtherProjects");
const projectsModal = document.getElementById("projectsModal");
const closeProjectsBtn = document.getElementById("closeProjectsBtn");

if (btnOtherProjects && projectsModal) {
  // Open Modal
  btnOtherProjects.addEventListener("click", (e) => {
    e.preventDefault();
    projectsModal.classList.add("active");
    btnOtherProjects.blur(); // Blur opening button immediately
  });

  // Close Logic
  const closeHub = () => {
    projectsModal.classList.remove("active");
    // Force browser to forget focus when closing (prevents sticking grey/yellow)
    if (document.activeElement) {
      document.activeElement.blur();
    }
  };

  if (closeProjectsBtn) closeProjectsBtn.onclick = closeHub;

  // Close if clicking the dark background
  projectsModal.onclick = (e) => {
    if (e.target === projectsModal) closeHub();
  };

  // NEW: Target all buttons inside the hub to clear focus (Mobile Sticky Fix)
  const hubButtons = projectsModal.querySelectorAll(".footer-btn");
  hubButtons.forEach((btn) => {
    // 1. Prevent focus from sticking on initial touch/click
    btn.addEventListener("mousedown", () => {
      setTimeout(() => btn.blur(), 0);
    });

    // 2. Ensure blur happens after action triggers
    btn.addEventListener("click", () => {
      setTimeout(() => {
        btn.blur();
        // Double safety: if user came back and it's still focused
        if (document.activeElement === btn) btn.blur();
      }, 100);
    });
  });
}

// Global reset when you switch back to the Artillery tab
window.onfocus = function () {
  document.querySelectorAll("button").forEach((b) => b.blur());
};

// --- FORCE RESET ON TAB RETURN (Mobile Fix) ---
window.addEventListener("pageshow", (event) => {
  // If the page was restored from cache (bfcache) or just shown
  if (event.persisted || document.visibilityState === "visible") {
    if (document.activeElement) {
      document.activeElement.blur();
    }
    document.querySelectorAll(".footer-btn").forEach((btn) => btn.blur());
  }
});

// Mobile PLACE button listener
const mobilePlaceBtn = document.getElementById("mobilePlaceBtn");
if (mobilePlaceBtn) {
  let lastPlaceTime = 0;
  const handlePlace = (e) => {
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();

    const now = Date.now();
    if (now - lastPlaceTime < 300) return;
    lastPlaceTime = now;

    mobilePlaceBtn.classList.add("pressed");
    setTimeout(() => mobilePlaceBtn.classList.remove("pressed"), 150);

    placeAtCenter();
  };

  mobilePlaceBtn.addEventListener("touchstart", handlePlace, {
    passive: false,
  });
  mobilePlaceBtn.addEventListener("click", handlePlace);
}
