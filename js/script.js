// ==========================================
// 1. DATA & CONFIGURATION
// ==========================================

const APP_VERSION = "v1.4.3";
const GAME_VERSION = "Update 21";

const versionMap = {
  appVersion: APP_VERSION,
  appVersionPanel: APP_VERSION,
  gameVersion: GAME_VERSION,
  gameVersionPanel: GAME_VERSION,
};

Object.keys(versionMap).forEach((id) => {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = versionMap[id];
  }
});

const isFirefox = navigator.userAgent.toLowerCase().indexOf("firefox") > -1;

const MAP_WIDTH_METERS = 2000.0;
const GAME_UNITS_PER_METER = 100.0;
const MAP_SDK_WIDTH = MAP_WIDTH_METERS * GAME_UNITS_PER_METER;
const MAP_SDK_HEIGHT = MAP_SDK_WIDTH;

const MIN_RANGE_METERS = 100;

const GAME_LEFT = -MAP_SDK_WIDTH / 2;
const GAME_RIGHT = MAP_SDK_WIDTH / 2;
const GAME_TOP = MAP_SDK_HEIGHT / 2;
const GAME_BOTTOM = -MAP_SDK_HEIGHT / 2;

const MIN_ZOOM = 1;
let MAX_ZOOM = 10;
const ZOOM_STEP = 0.5;
const MARKER_ROTATION_DEG = 0;

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
let rulerEnabled = false;
let hudEnabled = false;
let manualCalcFaction = "us";
let currentStrongpoints = [];
let labelCache = [];
let isRendering = false;
let calcInputVal = "";
let calcHistory = [];
let historyCollapsed = true;
let historyEnabled = false;

let customArtillery = [];
let placementMode = false;
let nextCustomGunId = 1;
let moveMode = false;
let movingGunId = null;
let activeCustomGunId = null;

let trajSliderEnabled = false;
let originalAngle = 0;
let trajUpdatePending = false;

let rulerLabelPool = [];

let stickyLabelsCache = { cols: [], rows: [] };
let cachedSubGrid = null;
let _mapRectCache = null;
let _mapRectTime = 0;

let _lastMobDist = null;
let _lastMobMil = null;
let _lastMobGrid = null;

let _lastRingDiameter = -1;
let _lastCursorMode = null;
let _cachedDPR = window.devicePixelRatio > 1;
let _lastMobContainerSize = -1;
let _lastMajorThickness = -1;

let filterMode = false;
let confirmedPoints = new Set();

const cached = {
  _ele: {},
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
  get mapWrap() {
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
  showRangeCircle: !IS_MOBILE,
  rulerIntervalMeters: IS_MOBILE ? 100 : 50,
  maxRulerMarkers: IS_MOBILE ? 8 : 32,
};

window.addEventListener("resize", () => {
  IS_MOBILE = window.innerWidth <= 768;
  _cachedDPR = window.devicePixelRatio > 1;
  _lastCursorMode = null;
});

const mapContainer = document.getElementById("mapContainer");
const mapStage = document.getElementById("mapStage");
const zoomIndicator = document.getElementById("zoomIndicator");

function openProjectsModal() {
  const modal = document.getElementById("projectsModal");
  if (modal) {
    modal.classList.add("active");
  }
}

function closeProjectsModal() {
  const modal = document.getElementById("projectsModal");
  if (modal) {
    modal.classList.remove("active");
  }
}

document
  .getElementById("closeProjectsBtn")
  ?.addEventListener("click", closeProjectsModal);

document.getElementById("projectsModal")?.addEventListener("click", (e) => {
  if (e.target.id === "projectsModal") closeProjectsModal();
});

// ==========================================
// 2. HELPER FUNCTIONS
// ==========================================

const stopMapInteraction = (e) => {
  e.stopPropagation();
};

function triggerFirePulse(x, y) {
  const wrap = cached.mapWrap || document.getElementById("mapContainer");
  if (!wrap) return;
  if (isNaN(x) || isNaN(y)) return;

  const drawScale = state.scale * state.fitScale;
  const screenX = state.pointX + x * drawScale;
  const screenY = state.pointY + y * drawScale;

  const pulse = document.createElement("div");
  pulse.className = "shot-pulse";
  pulse.style.left = `${Math.round(screenX)}px`;
  pulse.style.top = `${Math.round(screenY)}px`;
  pulse.style.setProperty("--zoom-scale", drawScale);

  wrap.appendChild(pulse);

  void pulse.offsetWidth;
  requestAnimationFrame(() => {
    pulse.classList.add("active");
  });

  setTimeout(() => {
    pulse.remove();
  }, 450);
}

function showLoading() {
  const loading = document.getElementById("loadingOverlay");
  if (loading) loading.style.display = "flex";
}

function isStandaloneAppWindow() {
  return (
    (window.matchMedia &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        window.matchMedia("(display-mode: window-controls-overlay)").matches)) ||
    window.navigator.standalone === true
  );
}

function updatePageTitle(mapName) {
  document.title = isStandaloneAppWindow()
    ? mapName
    : `HLL Arty Map Calculator - ${mapName}`;
}

function escapeAttr(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;");
}

function openMapHistory(mapKey) {
  const mapModal = document.getElementById("mapModal");
  if (!mapModal || !mapModal.classList.contains("active")) return;

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

    if (h.images && h.images.length > 0) {
      html += `<div class="history-images">`;
      h.images.forEach((img, index) => {
        const imgSrc = typeof img === "object" ? img.thumbnail || img.src : img;
        const imgFull = typeof img === "object" ? img.full || img.src : img;
        const imgCaption = typeof img === "object" ? img.caption : "";
        html += `<div class="history-image-item">`;
        html += `<img src="${imgSrc}" alt="${escapeAttr(h.battle)}" loading="lazy" onerror="this.style.display='none'" class="history-img-thumb history-image" onload="this.classList.add('loaded')" data-full-img="${escapeAttr(imgFull)}" data-caption="${escapeAttr(imgCaption)}" data-index="${index}">`;
        if (imgCaption) {
          html += `<div class="history-img-caption">${imgCaption}</div>`;
        }
        html += `</div>`;
      });
      html += `</div>`;
    }

    html += `<p>${h.description}</p>`;

    if (h.tactics) {
      html += `<h4>Tactical Situation</h4>`;

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

    html += `<h4>Strategic Significance</h4>`;

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
  const viewer = document.createElement("div");
  viewer.className = "image-viewer-overlay";
  viewer.innerHTML = `
        <div class="image-viewer-content" style="opacity: 0; transition: opacity 0.2s ease;">
            <button class="image-viewer-close" aria-label="Close">&times;</button>
            <div class="image-viewer-loading">Loading...</div>
            <img src="${imageSrc}" alt="${caption}" class="image-viewer-img" style="display: none;">
            ${displayCaption ? `<div class="image-viewer-caption">${displayCaption}</div>` : ""}
        </div>
    `;
  document.body.appendChild(viewer);

  const img = viewer.querySelector(".image-viewer-img");
  const content = viewer.querySelector(".image-viewer-content");
  const loading = viewer.querySelector(".image-viewer-loading");

  img.onload = () => {
    loading.style.display = "none";
    img.style.display = "block";
    content.style.opacity = "1";
  };

  img.onerror = () => {
    loading.innerHTML = "Failed to load image.<br>Try refreshing the page.";
    loading.style.color = "#ff6b6b";
    console.error("Failed to load image:", imageSrc);
  };

  if (img.complete && img.naturalWidth > 0) {
    loading.style.display = "none";
    img.style.display = "block";
    content.style.opacity = "1";
  }

  viewer.addEventListener("click", (e) => {
    if (
      e.target === viewer ||
      e.target.classList.contains("image-viewer-close")
    ) {
      viewer.remove();
    }
  });

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

  const rulerBtn = document.getElementById("rulerToggleBtn");
  if (rulerBtn) rulerBtn.classList.toggle("active", rulerEnabled);

  const hudBtn = document.getElementById("hudToggleBtn");
  if (hudBtn) hudBtn.classList.toggle("active", hudEnabled);

  document.body.classList.toggle("hud-active", hudEnabled);

  const hudEl = document.getElementById("liveCursorHud");
  const crosshair = document.getElementById("mobileCrosshair");
  const fireBtn = document.getElementById("mobileFireBtn");

  const desktopRings = document.getElementById("desktopCursorRings");

  if (hudEnabled) {
    if (hudEl) {
      hudEl.classList.remove("hidden");
      if (!isMobile) hudEl.style.opacity = "0";
    }

    if (isMobile) {
      if (crosshair) crosshair.classList.remove("hidden");
      if (fireBtn) fireBtn.classList.remove("hidden");
      if (desktopRings) desktopRings.classList.add("hidden");
    } else {
      if (desktopRings) {
        desktopRings.classList.remove("hidden");
        desktopRings.style.opacity = "0";
      }
      if (crosshair) crosshair.classList.add("hidden");
      if (fireBtn) fireBtn.classList.add("hidden");
    }
  } else {
    if (hudEl) hudEl.classList.add("hidden");
    if (crosshair) crosshair.classList.add("hidden");
    if (fireBtn) fireBtn.classList.add("hidden");
    if (desktopRings) desktopRings.classList.add("hidden");
  }
}

function updateDesktopRingScale() {
  const ringsEl = cached.getElem("desktopCursorRings");
  if (!ringsEl || !hudEnabled) return;

  const mapImage = cached.mapImage;
  if (!mapImage || mapImage.naturalWidth === 0) return;

  const dims = getMapDimensions();
  const effectiveZoom = state.scale * state.fitScale;

  const currentMapPixelWidth = mapImage.naturalWidth * effectiveZoom;
  const totalMapMeters = dims.width / GAME_UNITS_PER_METER;
  const pixelsPerMeter = currentMapPixelWidth / totalMapMeters;

  const rawDiameter = 40 * pixelsPerMeter;

  const diameterPx = Math.round(rawDiameter / 2) * 2;

  if (diameterPx !== _lastRingDiameter) {
    ringsEl.style.width = `${diameterPx}px`;
    ringsEl.style.height = `${diameterPx}px`;
    _lastRingDiameter = diameterPx;
  }
}

showLoading();

function toggleSubGrid(currentZoom) {
  if (!cachedSubGrid) {
    cachedSubGrid = document.querySelector(".keypad-grid");
  }

  if (!cachedSubGrid) return;

  if (currentZoom >= 3.0) cachedSubGrid.style.opacity = "0.4";
  else cachedSubGrid.style.opacity = "0";
}

function getEffectiveZoom() {
  return state.scale * state.fitScale;
}

function getGridRef(gameX, gameY) {
  const dims = getMapDimensions();

  const halfWidth = dims.width / 2 / GAME_UNITS_PER_METER;
  const halfHeight = dims.height / 2 / GAME_UNITS_PER_METER;

  const xMeters = gameX / GAME_UNITS_PER_METER + halfWidth;
  const yMeters = halfHeight - gameY / GAME_UNITS_PER_METER;

  const totalW = dims.width / GAME_UNITS_PER_METER;
  const totalH = dims.height / GAME_UNITS_PER_METER;

  if (xMeters < 0 || xMeters > totalW || yMeters < 0 || yMeters > totalH) {
    return "---";
  }

  const sectionWidthMeters = totalW / 10;
  const sectionHeightMeters = totalH / 10;

  let colIndex = Math.floor(xMeters / sectionWidthMeters);
  let rowIndex = Math.floor(yMeters / sectionHeightMeters);

  const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

  if (colIndex >= letters.length) colIndex = letters.length - 1;
  if (rowIndex >= 10) rowIndex = 9;
  if (colIndex < 0) colIndex = 0;
  if (rowIndex < 0) rowIndex = 0;

  const colChar = letters[colIndex];
  const rowChar = rowIndex + 1;

  return `${colChar}${rowChar}`;
}

function toggleTransitions(enable) {
  mapStage.classList.remove("zoom-transition");
  const labelLayer = document.getElementById("labelLayer");
  if (labelLayer) labelLayer.classList.remove("zoom-transition");
  mapStage.style.transition = "none";
}

function setZoomLevel(newLevel, mouseX = null, mouseY = null) {
  const prevZoom = getEffectiveZoom();
  currentZoomLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newLevel));
  state.scale = currentZoomLevel;


  const newZoom = getEffectiveZoom();

  if (mouseX !== null && mouseY !== null) {
    const worldX = (mouseX - state.pointX) / prevZoom;
    const worldY = (mouseY - state.pointY) / prevZoom;

    state.pointX = mouseX - worldX * newZoom;
    state.pointY = mouseY - worldY * newZoom;
  }

  clampPosition();
  toggleSubGrid(currentZoomLevel);
  render();

  clearTimeout(window.saveZoomTimeout);
  window.saveZoomTimeout = setTimeout(saveState, 500);
}

function clampPosition() {
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

  stickyLabelsCache.cols = [];
  stickyLabelsCache.rows = [];

  for (let i = 0; i < 10; i++) {
    const el = document.createElement("div");
    el.className = "hll-grid-label";
    el.innerText = i === 0 ? "A1" : letters[i];
    labelLayer.appendChild(el);
    stickyLabelsCache.cols.push(el);
  }

  for (let i = 1; i < 10; i++) {
    const el = document.createElement("div");
    el.className = "hll-grid-label";
    el.innerText = i + 1;
    labelLayer.appendChild(el);
    stickyLabelsCache.rows.push(el);
  }
}

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

  const isHighDPI = _cachedDPR;
  const useFloats = isHighDPI || isFirefox;

  for (let i = 0; i < stickyLabelsCache.cols.length; i++) {
    const el = stickyLabelsCache.cols[i];
    const colScreenX = state.pointX + i * stepX;
    const finalX = colScreenX + padding;

    const finalY = stickyTopY + padding;

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

  for (let i = 0; i <= 10; i++) {
    const vLine = document.createElement("div");
    vLine.className = "hll-grid-line vertical";
    vLine.style.left = `${Math.round(i * stepX)}px`;

    if (i === 0) vLine.style.transform = "translateX(0)";
    else if (i === 10) vLine.style.transform = "translateX(-100%)";
    else vLine.style.transform = "translateX(0)";

    gridLayer.appendChild(vLine);
  }

  for (let i = 0; i <= 10; i++) {
    const hLine = document.createElement("div");
    hLine.className = "hll-grid-line horizontal";
    hLine.style.top = `${Math.round(i * stepY)}px`;

    if (i === 0) hLine.style.transform = "translateY(0)";
    else if (i === 10) hLine.style.transform = "translateY(-100%)";
    else hLine.style.transform = "translateY(0)";

    gridLayer.appendChild(hLine);
  }
}

function getMapDimensions() {
  const config = MAP_DATABASE[activeMapKey];

  if (config.bounds) {
    return {
      width: config.bounds.maxX - config.bounds.minX,
      height: config.bounds.maxY - config.bounds.minY,
      left: config.bounds.minX,
      top: config.bounds.maxY,
    };
  }

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

  const normX = (gameX - dims.left) / dims.width;

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
// GUN ROTATION
// ==========================================
function getGunBaseRotation(team, mapConfig, individualRotation) {
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
    if (mapConfig.gunRotations["can"] !== undefined) {
      return mapConfig.gunRotations["can"];
    }
  }

  if (sortMode === "x") {
    return isAxis ? -90 : 90;
  } else {
    return isAxis ? 180 : 0;
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

  const confirmedSectors = new Set();
  if (confirmedPoints.size > 0) {
    currentStrongpoints.forEach((p) => {
      if (p.type === "strongpoint" && confirmedPoints.has(p.id)) {
        confirmedSectors.add(getPointSector(p, isVerticalMap));
      }
    });
  }

  currentStrongpoints.forEach((point) => {
    if (point.type === "point") {
    }

    if (point.type === "strongpoint") {
      const isConfirmed = confirmedPoints.has(point.id);
      const mySector = getPointSector(point, isVerticalMap);

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

        const sectorHasConfirmation = confirmedSectors.has(mySector);

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

    if (point.type === "point") {
      el.style.left = `${Math.round(pos.x)}px`;
      el.style.top = `${Math.round(pos.y)}px`;

      const img = document.createElement("img");
      img.className = "arty-icon";

      if (isEnemyGun) {
        img.src = "images/ui/artillery_position_enemy.webp";

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

  customArtillery.forEach((gun) => {
    if (gun.team !== activeFaction) return;

    const el = document.createElement("div");
    el.className = `marker ${gun.team} point custom-artillery`;
    el.style.cursor = "pointer";

    const isActiveGun =
      activeCustomGunId === gun.id ||
      (activeCustomGunId === null &&
        activeGunIndex === -1 &&
        customArtillery.filter((g) => g.team === activeFaction).slice(-1)[0]
          ?.id === gun.id);

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

    el.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      showArtilleryContextMenu(gun.id, e.clientX, e.clientY);
    });

    if (isActiveGun) {
      el.classList.add("active-gun");
    } else {
      el.classList.add("dimmed-gun");
    }

    const pos = gameToImagePixels(gun.gameX, gun.gameY, w, h);

    const img = document.createElement("img");
    img.className = "arty-icon";

    if (isActiveGun) {
      img.src = "images/ui/artillery_position_v2_white.webp";
    } else {
      img.src = "images/ui/artillery_position_v2.webp";
    }
    img.style.width = "100%";
    img.style.height = "100%";

    if (isActiveGun && activeTarget) {
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
      let baseRotation = 0;
      const teamKey = gun.team.toLowerCase();
      const isAxis = ["ger", "axis", "afrika"].some((x) => teamKey.includes(x));
      const mapConfig = MAP_DATABASE[activeMapKey];
      if (mapConfig && mapConfig.gunRotations) {
        if (mapConfig.gunRotations[teamKey] !== undefined)
          baseRotation = mapConfig.gunRotations[teamKey];
        else if (isAxis && mapConfig.gunRotations["ger"] !== undefined)
          baseRotation = mapConfig.gunRotations["ger"];
        else if (mapConfig.gunRotations["us"] !== undefined)
          baseRotation = mapConfig.gunRotations["us"];
        else if (mapConfig.gunRotations["can"] !== undefined)
          baseRotation = mapConfig.gunRotations["can"];
      } else {
        const sortMode = mapConfig ? mapConfig.gunSort : "y";
        if (sortMode === "x") baseRotation = isAxis ? -90 : 90;
        else baseRotation = isAxis ? 180 : 0;
      }
      img.style.transform = `rotate(${baseRotation}deg) scaleX(-1)`;
    }
    el.appendChild(img);

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
  const isVerticalMap = mapConfig && mapConfig.gunSort === "x";

  const filledSectors = new Set();
  confirmedPoints.forEach((id) => {
    const point = currentStrongpoints.find((p) => p.id === id);
    if (point) filledSectors.add(getPointSector(point, isVerticalMap));
  });

  let targetSector = 0;
  while (filledSectors.has(targetSector) && targetSector < 5) {
    targetSector++;
  }

  if (targetSector >= 5) return;

  const el = document.createElement("div");
  el.className = "sector-highlight";

  const sizePct = 20;
  const posPct = targetSector * 20;

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

  const mapConfig = MAP_DATABASE[activeMapKey];
  const isVerticalMap = mapConfig && mapConfig.gunSort === "x";

  const friendlyGuns = currentStrongpoints.filter(
    (p) => p.team === activeFaction && p.type === "point",
  );

  if (friendlyGuns.length === 0) return;

  const allowedSector = getPointSector(friendlyGuns[0], isVerticalMap);

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

function getMilFromTable(distance, factionName) {
  if (!factionName) return 0;
  let key = "US";
  const f = factionName.toUpperCase();

  if (f.includes("GER") || f.includes("AXIS") || f.includes("AFRIKA"))
    key = "GER";
  else if (f.includes("SOVIET") || f.includes("RUS")) key = "RUS";
  else if (f.includes("BRITISH") || f.includes("ALLIES") || f.includes("GB"))
    key = "GB";
  else if (f.includes("CANADA") || f.includes("CAN")) key = "CAN";
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

function getPointSector(point, isVerticalMap) {
  const OFFSET = 100000;
  const SECTOR_SIZE = 40000;

  let idx;
  if (isVerticalMap) {
    const rawIdx = Math.floor((point.gameY + OFFSET) / SECTOR_SIZE);
    idx = 4 - rawIdx;
  } else {
    idx = Math.floor((point.gameX + OFFSET) / SECTOR_SIZE);
  }

  if (idx < 0) idx = 0;
  if (idx > 4) idx = 4;

  return idx;
}

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

  if (placementMode || moveMode) return;

  if (!filterMode) {
    guideEl.classList.add("hidden");
    guideEl.classList.remove("success");
    return;
  }

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
  if (activeCustomGunId !== null) {
    const gun = customArtillery.find(
      (g) => g.id === activeCustomGunId && g.team === activeFaction,
    );
    if (gun) return { x: gun.gameX, y: gun.gameY };
  }

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

function getRangeOverlayScreenState() {
  const gunPos = getActiveGunCoords();
  const mapImage = cached.mapImage;
  if (!gunPos || !mapImage || mapImage.naturalWidth === 0) return null;

  const w = mapImage.naturalWidth;
  const h = mapImage.naturalHeight;
  const gunPixel = gameToImagePixels(gunPos.x, gunPos.y, w, h);
  const drawScale = state.scale * state.fitScale;

  const useFloats = _cachedDPR || (isFirefox && state.scale > 1.05);
  const renderedX = useFloats ? state.pointX : Math.round(state.pointX);
  const renderedY = useFloats ? state.pointY : Math.round(state.pointY);
  const metersToPixels = (w / getMapDimensions().width) * GAME_UNITS_PER_METER;

  return {
    screenX: renderedX + gunPixel.x * drawScale,
    screenY: renderedY + gunPixel.y * drawScale,
    drawScale,
    metersToPixels,
  };
}

function updateBeyondRangeOverlay() {
  const beyondOverlay = cached.getElem("beyondRangeOverlay");
  if (!beyondOverlay) return;

  const overlayState = getRangeOverlayScreenState();
  if (!overlayState) {
    beyondOverlay.style.display = "none";
    return;
  }

  const radiusPx = 1600 * overlayState.metersToPixels * overlayState.drawScale;

  beyondOverlay.style.setProperty("--gun-x", `${overlayState.screenX}px`);
  beyondOverlay.style.setProperty("--gun-y", `${overlayState.screenY}px`);
  beyondOverlay.style.setProperty("--max-range-r", `${radiusPx}px`);
  beyondOverlay.style.display = "block";
}

function updateMinRangeOverlay() {
  const minOverlay = cached.getElem("minRangeOverlay");
  if (!minOverlay) return;

  const overlayState = getRangeOverlayScreenState();
  if (!overlayState) {
    minOverlay.style.display = "none";
    return;
  }

  const radiusPx =
    MIN_RANGE_METERS * overlayState.metersToPixels * overlayState.drawScale;

  minOverlay.style.setProperty("--gun-x", `${overlayState.screenX}px`);
  minOverlay.style.setProperty("--gun-y", `${overlayState.screenY}px`);
  minOverlay.style.setProperty("--min-range-r", `${radiusPx}px`);
  minOverlay.style.display = "block";
}

function renderTargeting() {
  const layer = cached.markersLayer;
  const panel = cached.targetDataPanel;
  const mobileFireBtn = document.getElementById("mobileFireBtn");

  layer
    .querySelectorAll(".trajectory-visual, .impact-marker, .impact-circles-svg")
    .forEach((el) => el.remove());

  if (filterMode) {
    if (panel) panel.classList.add("hidden");
    if (mobileFireBtn) mobileFireBtn.classList.add("hidden");
    rulerLabelPool.forEach((el) => (el.style.display = "none"));
    return;
  }

  if (!activeTarget || !getActiveGunCoords()) {
    if (panel) panel.classList.add("hidden");
    if (mobileFireBtn) mobileFireBtn.classList.add("hidden");
    rulerLabelPool.forEach((el) => (el.style.display = "none"));
    return;
  }

  if (panel) {
    panel.classList.remove("hidden");

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

  if (mobileFireBtn) {
    if (hudEnabled && IS_MOBILE) {
      mobileFireBtn.classList.remove("hidden");
    } else {
      mobileFireBtn.classList.add("hidden");
    }
  }

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

  const totalDistPx = Math.sqrt(
    Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2),
  );
  const dangerZoneRadiusPx = 20.0 * pixelsPerMeter;
  const lineLength = Math.max(0, totalDistPx - dangerZoneRadiusPx);
  const angleRad = Math.atan2(end.y - start.y, end.x - start.x);

  const totalDistanceMeters = totalDistPx / pixelsPerMeter;

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

  linePath.style.strokeDasharray = "8, 6";

  lineSvg.appendChild(linePath);

  let poolIdx = 0;

  if (rulerEnabled) {
    const numMarkers = Math.floor(lineLength / intervalPx);
    const MAX_RULER_DIST = 1600;

    const factionLabel = cached.factionLabel.innerText;
    const cosAngle = Math.cos(angleRad);
    const sinAngle = Math.sin(angleRad);

    let factionKey = "US";
    const f = factionLabel.toUpperCase();
    if (f.includes("GER") || f.includes("AXIS") || f.includes("AFRIKA"))
      factionKey = "GER";
    else if (f.includes("SOVIET") || f.includes("RUS")) factionKey = "RUS";
    else if (f.includes("BRITISH") || f.includes("ALLIES") || f.includes("GB"))
      factionKey = "GB";
    else if (f.includes("CANADA") || f.includes("CAN"))
      factionKey = "CAN";

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

      if (totalDistanceMeters - distanceAtMarker < 40) continue;

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
            mils = Math.round(rowA.mil + rangeMil * ratio);
            break;
          }
        }
      }

      const tick = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle",
      );
      tick.setAttribute("cx", markerX);
      tick.setAttribute("cy", "0");
      tick.setAttribute("r", "3");
      tick.setAttribute("class", "ruler-tick");
      lineSvg.appendChild(tick);

      const labelX = start.x + cosAngle * markerX;
      const labelY = start.y + sinAngle * markerX;

      let milLabel = rulerLabelPool[poolIdx];

      if (!milLabel) {
        milLabel = document.createElement("div");
        milLabel.className = "ruler-mil-label";
        milLabel.style.left = "0px";
        milLabel.style.top = "0px";
        rulerLabelPool.push(milLabel);
      }

      if (milLabel.parentNode !== layer) {
        layer.appendChild(milLabel);
      }

      milLabel.style.display = "block";

      milLabel.style.transform = `translate(${labelX}px, ${labelY}px) translate(-50%, -100%)`;

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

  for (let k = poolIdx; k < rulerLabelPool.length; k++) {
    rulerLabelPool[k].style.display = "none";
  }

  layer.prepend(lineSvg);

  const circleSvg = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg",
  );
  circleSvg.setAttribute("class", "impact-circles-svg");

  circleSvg.style.position = "absolute";
  circleSvg.style.left = `${Math.round(end.x)}px`;
  circleSvg.style.top = `${Math.round(end.y)}px`;

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

  const marker = document.createElement("div");
  marker.className = "impact-marker";
  marker.style.left = `${Math.round(end.x)}px`;
  marker.style.top = `${Math.round(end.y)}px`;

  layer.appendChild(marker);

  updateBeyondRangeOverlay();
  updateMinRangeOverlay();

  if (elDist) elDist.innerText = `${Math.round(totalDistanceMeters)}m`;

  const factionLabel = cached.factionLabel.innerText;
  const currentMil = getMilFromTable(
    Math.round(totalDistanceMeters),
    factionLabel,
  );
  activeTarget.distance = Math.round(totalDistanceMeters);
  activeTarget.mil = currentMil;

  if (elBearing) {
    const dx = activeTarget.gameX - gunPos.x;
    const dy = activeTarget.gameY - gunPos.y;

    let bearing = Math.atan2(dx, dy) * (180 / Math.PI);

    if (bearing < 0) bearing += 360;

    elBearing.innerText = Math.floor(bearing) + "°";
  }

  if (currentMil) {
    if (elMil) {
      elMil.innerText = currentMil;
      elMil.className = "data-value val-huge";
    }
    if (elTime) {
      elTime.innerText = "24s";
      elTime.className = "data-value val-mid text-green";
    }
  } else {
    if (elMil) {
      elMil.innerText = "OUT";
      elMil.className = "data-value text-red";
    }
    if (elTime) {
      elTime.innerText = "---";
      elTime.className = "data-value val-mid";
    }
    if (elBearing) elBearing.innerText = "---";
  }
}

function render() {
  const mapContainer = cached.mapContainer;
  if (mapContainer && !_mapRectCache) {
    _mapRectCache = mapContainer.getBoundingClientRect();
    _mapRectTime = Date.now();
  }

  clampPosition();
  const drawScale = state.scale * state.fitScale;
  const markersLayer = cached.markersLayer;

  if (mapContainer)
    mapContainer.style.setProperty("--current-scale", drawScale);
  const mapStage = cached.mapStage;
  mapStage.style.setProperty("--effective-zoom", drawScale);

  if (isFirefox) {
    if (state.scale > 1.01) {
      if (mapStage.style.willChange !== "transform")
        mapStage.style.willChange = "transform";
      if (markersLayer && markersLayer.style.willChange !== "transform")
        markersLayer.style.willChange = "transform";
    } else {
      mapStage.style.willChange = "auto";
      if (markersLayer) markersLayer.style.willChange = "auto";
    }
  }

  const isMobileScreen = IS_MOBILE;
  const baseIconSize = isMobileScreen ? 300 : 128;

  const normalizedZoom = Math.max(
    0,
    Math.min(1, (state.scale - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)),
  );
  const viewScale = 1.0 / ((MAX_ZOOM - 1.0) * normalizedZoom + 1.0);
  const dynSize = baseIconSize * viewScale;
  mapContainer.style.setProperty("--dynamic-icon-size", `${dynSize}px`);

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

  const isHighDPI = _cachedDPR;

  const useFloats = isHighDPI || (isFirefox && state.scale > 1.05);

  const finalX = useFloats ? state.pointX : Math.round(state.pointX);
  const finalY = useFloats ? state.pointY : Math.round(state.pointY);

  const transformString = `translate(${finalX}px, ${finalY}px) scale(${drawScale})`;

  mapStage.style.transform = transformString;

  if (markersLayer) {
    markersLayer.style.transform = transformString;
  }

  updateBeyondRangeOverlay();
  updateMinRangeOverlay();

  updateRealScale(drawScale);
  const zoomIndicator = cached.zoomIndicator;
  if (zoomIndicator) zoomIndicator.innerText = `${state.scale.toFixed(1)}x`;

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

  const majorThickness = Math.max(1.0, 2.0 / drawScale);
  const gridLayer = cached.getElem("gridLayer");
  if (gridLayer) {
    if (majorThickness !== _lastMajorThickness) {
      gridLayer.style.setProperty("--major-width", `${majorThickness}px`);
      _lastMajorThickness = majorThickness;
    }

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
  updateMapCursor();
}


let _lastScaleTextEnd = "";
let _lastScaleTextMid = "";

function updateRealScale(effectiveZoom) {
  const mapImg = cached.mapImage;
  if (!mapImg || mapImg.naturalWidth === 0) return;

  const TOTAL_PLAYABLE_METERS = 2000;

  const currentMapPixelWidth = mapImg.naturalWidth * effectiveZoom;
  const pixelsPerMeter = currentMapPixelWidth / TOTAL_PLAYABLE_METERS;

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

  const barPixelsRounded = Math.round(barMeters * pixelsPerMeter);

  const scaleWrapper = cached.scaleWrapper;
  const elMid = cached.scaleTextMid;
  const elEnd = cached.scaleTextEnd;

  if (scaleWrapper) scaleWrapper.style.width = `${barPixelsRounded}px`;

  const midText = `${barMeters / 2}m`;
  const endText = `${barMeters}m`;

  if (elMid && elMid.innerText !== midText) elMid.innerText = midText;
  if (elEnd && elEnd.innerText !== endText) elEnd.innerText = endText;
}

function updateDimensions() {
  const mapImage = document.getElementById("mapImage");
  const mapContainer = cached.mapContainer;

  if (!mapImage.complete || mapImage.naturalWidth === 0) return;
  if (!mapContainer) return;

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
  const rect = _mapRectCache || mapContainer.getBoundingClientRect();
  state.pointX = (rect.width - mapImage.naturalWidth * state.fitScale) / 2;
  state.pointY = (rect.height - mapImage.naturalHeight * state.fitScale) / 2;

  toggleSubGrid(state.scale);
  render();
}

function initMap() {
  const markersLayer = cached.markersLayer;
  const mapContainer = cached.mapContainer;
  const mapImage = cached.mapImage;

  if (markersLayer && mapContainer && mapImage) {
    if (markersLayer.parentElement !== mapContainer) {
      mapContainer.appendChild(markersLayer);
    }

    if (mapImage.naturalWidth > 0 && mapImage.naturalHeight > 0) {
      markersLayer.style.width = `${mapImage.naturalWidth}px`;
      markersLayer.style.height = `${mapImage.naturalHeight}px`;
    }

    markersLayer.style.zIndex = "110";
    markersLayer.style.transformOrigin = "0 0";
  }

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

  let beyondOverlay = document.getElementById("beyondRangeOverlay");
  if (!beyondOverlay) {
    beyondOverlay = document.createElement("div");
    beyondOverlay.id = "beyondRangeOverlay";
  }
  if (beyondOverlay.parentElement !== cached.mapContainer) {
    cached.mapContainer.appendChild(beyondOverlay);
  }

  let minOverlay = document.getElementById("minRangeOverlay");
  if (!minOverlay) {
    minOverlay = document.createElement("div");
    minOverlay.id = "minRangeOverlay";
  }
  if (minOverlay.parentElement !== cached.mapContainer) {
    cached.mapContainer.appendChild(minOverlay);
  }

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
// VISUAL MAP SELECTOR
// ==========================================

function bindDedupedPress(element, handler, options = {}) {
  if (!element || typeof handler !== "function") return;

  const minInterval = options.minInterval ?? 350;
  const moveThreshold = options.moveThreshold ?? 10;
  const touchClickBlockWindow = options.touchClickBlockWindow ?? 500;
  let lastPressTime = 0;
  let lastTouchHandledTime = 0;
  let touchActive = false;
  let touchMoved = false;
  let startX = 0;
  let startY = 0;

  const invokeHandler = (e) => {
    if (typeof e?.stopPropagation === "function" && options.stopPropagation) {
      e.stopPropagation();
    }

    const now = Date.now();
    if (now - lastPressTime < minInterval) return;
    lastPressTime = now;

    handler(e);
  };

  element.addEventListener("click", (e) => {
    if (Date.now() - lastTouchHandledTime < touchClickBlockWindow) return;
    invokeHandler(e);
  });

  element.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) {
        touchActive = false;
        return;
      }

      const touch = e.touches[0];
      touchActive = true;
      touchMoved = false;
      startX = touch.clientX;
      startY = touch.clientY;
    },
    { passive: true },
  );

  element.addEventListener(
    "touchmove",
    (e) => {
      if (!touchActive || e.touches.length !== 1) return;

      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - startX);
      const deltaY = Math.abs(touch.clientY - startY);

      if (deltaX > moveThreshold || deltaY > moveThreshold) {
        touchMoved = true;
      }
    },
    { passive: true },
  );

  element.addEventListener(
    "touchend",
    (e) => {
      if (!touchActive) return;
      touchActive = false;

      if (touchMoved) return;

      if (e.cancelable) {
        e.preventDefault();
      }

      lastTouchHandledTime = Date.now();
      invokeHandler(e);
    },
    { passive: false },
  );

  element.addEventListener("touchcancel", () => {
    touchActive = false;
    touchMoved = false;
  });
}

function initMapSelector() {
  const btn = document.getElementById("openMapBtn");
  const searchInput = document.getElementById("mapSearchInput");
  const clearBtn = document.getElementById("clearSearchBtn");

  bindDedupedPress(btn, () => {
    openMapSelector();
  });

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase();
      renderMapGrid(searchTerm);
    });
  }

  if (clearBtn && searchInput) {
    const clearAction = (e) => {
      e.preventDefault();
      searchInput.value = "";
      searchInput.focus();
      renderMapGrid("");
    };

    clearBtn.addEventListener("click", clearAction);
    clearBtn.addEventListener("touchstart", clearAction, { passive: false });
  }

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

  const btnManual = document.getElementById("btnManualCalc");
  if (btnManual) {
    bindDedupedPress(btnManual, () => {
      closeMapSelector();
      openManualCalculator();
    });
  }
}

// ==========================================
// MAP GRID RENDERING WITH DATASET
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

  if (cleanFilter === "" && isGridFull && grid.hasChildNodes()) {
    grid.querySelectorAll(".map-card").forEach((card) => {
      const cardKey = card.dataset.mapKey || "";
      card.classList.toggle("active", cardKey === activeMapKey);
    });
    return;
  }

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
    card.dataset.mapKey = key;
    if (key === activeMapKey) card.classList.add("active");

    bindDedupedPress(card, () => {
      SelectMapFromGrid(key);
    });

    const img = document.createElement("img");
    img.className = "map-card-img";
    img.alt = mapData.name;

    const imgPath = mapData.thumbnail || mapData.image;
    img.src = imgPath;

    img.onerror = () => {
      img.style.display = "none";
      card.style.background = "#222";
    };

    const label = document.createElement("div");
    label.className = "map-card-name";
    label.innerText = mapData.name;

    if (mapData.history) {
      const infoBtn = document.createElement("button");
      infoBtn.className = "map-info-btn";
      infoBtn.innerHTML =
        '<svg viewBox="0 0 26 26" width="26" height="26"><circle cx="13" cy="13" r="11" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2"/><path d="M18 7H8c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM8 9h4v5l-2-1.5L8 14V9z" fill="rgba(255,255,255,0.9)"/></svg>';
      infoBtn.title = "View map history";
      bindDedupedPress(
        infoBtn,
        () => {
          openMapHistory(key);
        },
        { stopPropagation: true },
      );
      card.appendChild(infoBtn);
    }

    card.appendChild(img);
    card.appendChild(label);
    grid.appendChild(card);
  });

  isGridFull = cleanFilter === "";
}

// ==========================================
// OPEN MAP SELECTOR
// ==========================================
function openMapSelector() {
  const searchInput = document.getElementById("mapSearchInput");

  if (searchInput) {
    searchInput.value = "";
  }

  renderMapGrid("");

  document.getElementById("mapModal").classList.add("active");
}

// ==========================================
// CLOSE MAP SELECTOR
// ==========================================
function closeMapSelector() {
  const modal = document.getElementById("mapModal");
  const searchInput = document.getElementById("mapSearchInput");

  if (modal) {
    modal.classList.remove("active");
  }

  if (searchInput) {
    searchInput.value = "";
    renderMapGrid("");
  }
}

// ==========================================
// KEY FIXES APPLIED
// ==========================================

function SelectMapFromGrid(key) {
  closeMapSelector();

  activeTarget = null;

  activeGunIndex = -1;
  activeFaction = null;

  trajSliderEnabled = false;
  const trajToggleBtn = document.getElementById("trajToggleBtn");
  const trajContainer = document.getElementById("trajSliderContainer");

  if (trajToggleBtn) trajToggleBtn.classList.remove("active");
  if (trajContainer) trajContainer.classList.add("hidden");

  filterMode = false;
  confirmedPoints.clear();
  const btn = document.getElementById("spFilterBtn");
  if (btn) btn.classList.remove("active");

  const layer = document.getElementById("sectorLayer");
  if (layer) layer.innerHTML = "";

  const config = MAP_DATABASE[key];
  if (!config) return;

  activeMapKey = key;
  currentStrongpoints = config.strongpoints || [];

  updatePageTitle(config.name);

  const currentMapLbl = document.getElementById("currentMapName");
  if (currentMapLbl) currentMapLbl.innerText = config.name;

  updateFactionUI(config);
  updateGunUI(config);

  saveState();

  renderMapGrid("");

  switchMap(key);
}

function switchMap(mapKey) {
  if (!MAP_DATABASE[mapKey]) return;

  const mapStage = cached.mapStage;
  const imgElement = cached.mapImage;
  const markersLayer = cached.markersLayer;

  showLoading();

  if (mapStage) {
    mapStage.style.opacity = "0";
  }

  if (markersLayer) markersLayer.innerHTML = "";

  const config = MAP_DATABASE[mapKey];

  const tempImg = new Image();
  const imageUrl = config.image + "?t=" + Date.now();
  
  function onNewImageReady() {
    activeMapKey = mapKey;
    currentStrongpoints = config.strongpoints || [];

    // === CRITICAL RESET FOR CUSTOM GUNS ===
    customArtillery = [];
    nextCustomGunId = 1;

    rulerLabelPool.forEach((label) => label.remove());
    rulerLabelPool = [];
    activeGunIndex = -1;
    activeCustomGunId = null;
    placementMode = false;
    moveMode = false;
    movingGunId = null;
    updateMapCursor();
    // =====================================

    imgElement.src = imageUrl;
    
    buildGrid();
    initMap();

    const label = document.getElementById("gunLabel");
    if (label) {
      label.innerText = "Select GUN";
      label.style.color = "#ffc107";
    }

    updateGunUI(config);
    updateGunDropdownUI();

    renderMarkers();
    renderTargeting();
    render();

    if (mapStage) {
      mapStage.style.opacity = "1";
    }

    setTimeout(() => {
      hideLoading();
    }, 100);
  }

  tempImg.onload = function() {
    onNewImageReady();
  };
  tempImg.onerror = function() {
    onNewImageReady();
  };
  tempImg.src = imageUrl;
}

// ==========================================
// FLAG IMAGE HELPER
// ==========================================
function getFlagImage(teamName) {
  if (!teamName) return "images/flags/us.webp";

  const lower = teamName.toLowerCase();

  if (
    lower === "gb" ||
    lower.includes("british") ||
    lower.includes("8th") ||
    lower.includes("allies")
  ) {
    return "images/flags/gb.webp";
  }

  if (
    lower === "rus" ||
    lower === "sov" ||
    lower.includes("soviet") ||
    lower.includes("rus")
  ) {
    return "images/flags/rus.webp";
  }

  if (
    lower === "ger" ||
    lower.includes("germany") ||
    lower.includes("axis") ||
    lower.includes("afrika")
  ) {
    return "images/flags/ger.webp";
  }

  if (
    lower === "can" ||
    lower.includes("canada")
  ) {
    return "images/flags/can.webp";
  }

  return "images/flags/us.webp";
}

// ==========================================
// FACTION UI UPDATE
// ==========================================
function updateFactionUI(config) {
  const t1Label = config?.teams?.t1 || "UNITED STATES";
  const t2Label = config?.teams?.t2 || "GERMANY";

  const t1Flag = getFlagImage(t1Label);
  const t2Flag = getFlagImage(t2Label);

  const item1 = document.querySelector('.dropdown-item[data-value="us"]');
  const itemCan = document.querySelector('.dropdown-item[data-value="can"]');
  const item2 = document.querySelector('.dropdown-item[data-value="ger"]');

  const isCanadianMap = t1Label.includes("CANADA") || t1Flag.includes("can.webp");
  if (item1) {
    if (isCanadianMap) {
      item1.style.display = "none";
    } else {
      item1.style.display = "flex";
      item1.querySelector(".item-text").innerText = t1Label;
      item1.querySelector(".item-flag").src = t1Flag;
    }
  }
  if (itemCan) {
    if (isCanadianMap) {
      itemCan.style.display = "flex";
      itemCan.querySelector(".item-text").innerText = t1Label;
      itemCan.querySelector(".item-flag").src = t1Flag;
    } else {
      itemCan.style.display = "none";
    }
  }
  if (item2) {
    item2.querySelector(".item-text").innerText = t2Label;
    item2.querySelector(".item-flag").src = t2Flag;
  }

  const mainLabel = document.getElementById("factionLabel");
  const mainFlag = document.getElementById("currentFactionFlag");

  if (mainLabel && mainFlag) {
    if (activeFaction === null) {
      mainLabel.innerText = "Select TEAM";
      mainLabel.style.color = "#ffc107";
      mainFlag.style.display = "none";
    } else {
      mainLabel.style.color = "#ffffff";
      mainFlag.style.display = "inline-block";

      if (activeFaction === "us" || activeFaction === "allies" || activeFaction === "can") {
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
// UPDATE GUN UI
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

  const addBtn = document.createElement("div");
  addBtn.id = "btnAddGunAction";
  addBtn.className = "dropdown-item";
  addBtn.style.color = "#ffc107";
  addBtn.style.fontWeight = "900";
  addBtn.textContent = "+ ADD GUN";

  addBtn.addEventListener("click", (e) => {
    e.stopPropagation();

    if (!activeFaction) {
      const label = document.getElementById("gunLabel");
      if (label) {
        label.innerText = "SELECT TEAM FIRST";
        label.style.color = "#ff4444";
      }

      if (navigator.vibrate) navigator.vibrate([30, 20]);

      const guideEl = document.getElementById("setupGuide");
      if (guideEl) {
        guideEl.classList.remove("hidden", "success");
        guideEl.innerHTML = `<span style="color:#ff4444;font-weight:900;">CHOOSE FACTION FIRST</span>`;
        setTimeout(() => {
          if (!placementMode && guideEl) guideEl.classList.add("hidden");
        }, 2200);
      }

      menu.classList.add("hidden");
      document.getElementById("gunBtn").classList.remove("active");
      return;
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

    if (cached.targetDataPanel) {
      cached.targetDataPanel.classList.add("hidden");
    }

    hudEnabled = false;
    syncToggleUI();
    updateMapCursor();

    const label = document.getElementById("gunLabel");
    if (label) {
      label.innerText = "Click map to place";
      label.style.color = "#ffc107";
    }
    updateMapCursor();
    showPlacementFeedback();
  });

  menu.appendChild(addBtn);

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

    if (activeCustomGunId === gun.id) {
      nameSpan.style.fontWeight = "700";
    }

    item.appendChild(nameSpan);

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

    item.addEventListener("click", (e) => {
      if (e.target !== deleteBtn) {
        e.stopPropagation();
        menu.classList.add("hidden");
        document.getElementById("gunBtn").classList.remove("active");

        activeGunIndex = -1;
        activeCustomGunId = gun.id;
        placementMode = false;
        moveMode = false;
        movingGunId = null;

        label.innerText = gun.label;
        label.style.color = "#ffffff";

        renderMarkers();
        renderTargeting();
        render();
        saveState();
      }
    });

    menu.appendChild(item);
  });

  const separator = document.createElement("div");
  separator.className = "dropdown-separator";
  menu.appendChild(separator);

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
      crosshair.classList.add("placement-mode");
      crosshair.style.display = "block";
      crosshair.style.opacity = "1";
    }

    if (placeBtn) {
      if (IS_MOBILE) placeBtn.classList.remove("hidden");
      else placeBtn.classList.add("hidden");
    }
    if (fireBtn) fireBtn.classList.add("hidden");
  }
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
    guideEl.innerText = IS_MOBILE
      ? "AIM WITH CROSSHAIR THEN TAP PLACE"
      : "CLICK MAP TO PLACE ARTILLERY";
  } else if (moveMode) {
    guideEl.innerText = "CLICK NEW POSITION FOR ARTILLERY";
  }

  if (activeFaction) updatePlacementSectorVisuals();

  document.body.classList.toggle("placement-active", placementMode);

  setTimeout(() => {
    if (!placementMode && !moveMode && guideEl) {
      guideEl.classList.add("hidden");
    }
  }, 4000);
}

function updateGunDropdownUI() {
  const container = document.getElementById("customGunContainer");
  if (!container) return;

  container.innerHTML = "";

  customArtillery.forEach((gun) => {
    const item = document.createElement("div");
    item.className = "dropdown-item";
    item.style.color = "#ffc107";
    item.style.paddingLeft = "25px";
    item.innerText = gun.label;

    item.onclick = (e) => {
      e.stopPropagation();
      selectCustomGun(gun.id);
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

  activeGunIndex = -1;
  window.selectedCustomGunId = id;

  document.getElementById("gunLabel").innerText = gun.label;

  renderMarkers();
  render();
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

  if (!isPositionInAllowedSector(gameX, gameY, w, h)) {
    const guideEl = document.getElementById("setupGuide");
    if (guideEl) {
      guideEl.classList.remove("hidden", "success");
      guideEl.innerHTML = `<span style="color:#ff4444;font-weight:900;">❌ ONLY IN GREEN SECTOR</span>`;
    }
    if (navigator.vibrate) navigator.vibrate([60, 30, 60]);

    setTimeout(() => {
      if (placementMode) {
        showPlacementFeedback();
      } else if (guideEl) {
        guideEl.classList.add("hidden");
      }
    }, 2200);

    return;
  }

  // ====================== VALID PLACEMENT ======================
  const factionCustomCount =
    customArtillery.filter((g) => g.team === activeFaction).length + 1;

  const customGun = {
    id: `custom_${nextCustomGunId++}`,
    gameX: gameX,
    gameY: gameY,
    team: activeFaction,
    type: "custom",
    label: `Custom Gun ${factionCustomCount}`,
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

    if (moveMode && movingGunId === gunId) {
      moveMode = false;
      movingGunId = null;

      const label = document.getElementById("gunLabel");
      if (label) {
        label.innerText = "Select GUN";
        label.style.color = "#ffc107";
      }

      const guideEl = document.getElementById("setupGuide");
      if (guideEl) {
        guideEl.classList.add("hidden");
      }

      updateMapCursor();
      renderMarkers();
    }

    if (activeCustomGunId === gunId) {
      activeCustomGunId = null;
      activeGunIndex = -1;
      const label = document.getElementById("gunLabel");
      if (label) {
        label.innerText = "Select GUN";
        label.style.color = "#ffc107";
      }
    }

    updateGunUI(MAP_DATABASE[activeMapKey]);
    updateGunDropdownUI();

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

  gun.gameX = newGameX;
  gun.gameY = newGameY;

  moveMode = false;
  movingGunId = null;

  activeGunIndex = -1;
  activeCustomGunId = gunId;

  const label = document.getElementById("gunLabel");
  if (label) {
    label.innerText = gun.label;
    label.style.color = "#ffffff";
  }

  updateMapCursor();

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

    if (trajSliderEnabled) {
      originalAngle = Math.atan2(dy, dx);
      const trajInput = document.getElementById("trajectoryRange");
      if (trajInput) trajInput.value = correctedDistance;
    }
  }

  renderMarkers();
  renderTargeting();
  render();
  saveState();
}

let _contextMenuCloseHandler = null;

function showArtilleryContextMenu(gunId, x, y) {
  const existingMenu = document.getElementById("artilleryContextMenu");
  if (existingMenu) existingMenu.remove();

  if (_contextMenuCloseHandler) {
    document.removeEventListener("click", _contextMenuCloseHandler);
    _contextMenuCloseHandler = null;
  }

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

function showConfirmModal(message, onConfirm) {
  const old = document.getElementById("customConfirmModal");
  if (old) old.remove();

  const overlay = document.createElement("div");
  overlay.id = "customConfirmModal";
  overlay.className = "confirm-modal-overlay";
  overlay.style.display = "flex";

  const modal = document.createElement("div");
  modal.className = "confirm-modal";

  const title = document.createElement("div");
  title.className = "confirm-title";
  title.textContent = "DELETE CUSTOM GUN";

  const msgEl = document.createElement("div");
  msgEl.className = "confirm-message";
  msgEl.textContent = message;

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

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isCurrentlyOpen = !menu.classList.contains("hidden");

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

  items.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      const value = item.getAttribute("data-value");

      menu.classList.add("hidden");
      btn.classList.remove("active");

      onSelect(value);
    });
  });
}

function initArtyControls() {
  setupDropdown("factionDropdown", "factionBtn", "factionLabel", (value) => {
    if (activeFaction !== value) {
      toggleTransitions(false);
      activeFaction = value;

      placementMode = false;
      moveMode = false;
      movingGunId = null;

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

      trajSliderEnabled = false;
      const trajToggleBtn = document.getElementById("trajToggleBtn");
      const trajContainer = document.getElementById("trajSliderContainer");
      if (trajToggleBtn) trajToggleBtn.classList.remove("active");
      if (trajContainer) trajContainer.classList.add("hidden");

      updateFactionUI(MAP_DATABASE[activeMapKey]);
      updateGunUI(MAP_DATABASE[activeMapKey]);

      renderMarkers();
      renderTargeting();
      render();
      saveState();
    }
  });

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

  window.addEventListener("click", () => {
    document
      .querySelectorAll(".dropdown-menu")
      .forEach((el) => el.classList.add("hidden"));
    document
      .querySelectorAll(".btn-map-Select")
      .forEach((el) => el.classList.remove("active"));
  });

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

  const mobileFireBtn = document.getElementById("mobileFireBtn");
  if (mobileFireBtn) {
    let lastFireTime = 0;

    const handleFire = (e) => {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();

      const now = Date.now();
      if (now - lastFireTime < 300) {
        return;
      }
      lastFireTime = now;

      if (navigator.vibrate) navigator.vibrate(30);

      mobileFireBtn.classList.add("pressed");
      setTimeout(() => mobileFireBtn.classList.remove("pressed"), 150);

      fireAtCenter();
    };

    mobileFireBtn.addEventListener("touchstart", handleFire, {
      passive: false,
    });
    mobileFireBtn.addEventListener("click", handleFire);
  }

  const trajToggleBtn = document.getElementById("trajToggleBtn");
  const trajContainer = document.getElementById("trajSliderContainer");
  const trajInput = document.getElementById("trajectoryRange");

  if (trajToggleBtn && trajContainer && trajInput) {
    let trajTouchHandled = false;
    let trajTouchTimeout = null;

    const handleTrajToggle = (e) => {
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

      if (!activeTarget) {
        trajToggleBtn.classList.add("btn-error");

        const existingTip = document.getElementById("error-toast");
        if (existingTip) existingTip.remove();

        const tip = document.createElement("div");
        tip.id = "error-toast";
        tip.innerText = "SHOOT FIRST";

        const rect = trajToggleBtn.getBoundingClientRect();

        Object.assign(tip.style, {
          position: "fixed",
          top: rect.top + rect.height / 2 + "px",
          right: window.innerWidth - rect.left + 15 + "px",
          transform: "translateY(-50%)",

          backgroundColor: "#ff4444",
          color: "white",
          fontFamily: "'GothamSS', sans-serif",
          fontWeight: "900",
          fontSize: "13px",
          padding: "8px 12px",
          borderRadius: "4px",
          zIndex: "10000",
          pointerEvents: "none",
          opacity: "0",
          transition: "opacity 0.2s ease",
          whiteSpace: "nowrap",
          boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
        });

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

        requestAnimationFrame(() => {
          tip.style.opacity = "1";
        });

        if (navigator.vibrate) {
          if (
            !navigator.userActivation ||
            navigator.userActivation.hasBeenActive
          ) {
            navigator.vibrate([50, 50, 50]);
          }
        }

        if (window.trajErrorTimeout) clearTimeout(window.trajErrorTimeout);

        window.trajErrorTimeout = setTimeout(() => {
          trajToggleBtn.classList.remove("btn-error");
          if (tip) {
            tip.style.opacity = "0";
            setTimeout(() => tip.remove(), 200);
          }
        }, 1200);

        return;
      }

      trajSliderEnabled = !trajSliderEnabled;
      trajToggleBtn.classList.toggle("active", trajSliderEnabled);
      trajContainer.classList.toggle("hidden", !trajSliderEnabled);

      if (trajSliderEnabled) {
        const gunPos = getActiveGunCoords();
        if (gunPos) {
          const dx = activeTarget.gameX - gunPos.x;
          const dy = activeTarget.gameY - gunPos.y;
          originalAngle = Math.atan2(dy, dx);

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

    trajInput.addEventListener("input", () => {
      /* ... math ... */
    });
  }

  function adjustTrajDistance(delta) {
    if (!activeTarget || !trajSliderEnabled) return;
    const trajInput = document.getElementById("trajectoryRange");
    let newDist = parseInt(trajInput.value) + delta;
    newDist = Math.max(100, Math.min(1600, newDist));
    trajInput.value = newDist;
    updateTrajectoryFromDistance(newDist);
  }

  function updateTrajectoryFromDistance(newDistMeters) {
    const gunPos = getActiveGunCoords();
    if (!gunPos) return;

    const newDistUnits = newDistMeters * GAME_UNITS_PER_METER;

    let newX = gunPos.x + newDistUnits * Math.cos(originalAngle);
    let newY = gunPos.y + newDistUnits * Math.sin(originalAngle);

    newX = Math.max(GAME_LEFT, Math.min(GAME_RIGHT, newX));
    newY = Math.max(GAME_BOTTOM, Math.min(GAME_TOP, newY));

    const factionLabel = cached.factionLabel.innerText;
    const mils = getMilFromTable(newDistMeters, factionLabel);

    activeTarget = {
      gameX: newX,
      gameY: newY,
      distance: newDistMeters,
      mil: mils,
    };

    const milDisplay = cached.trajCurrentMil;
    const meterDisplay = cached.trajCurrentMeter;

    if (milDisplay)
      milDisplay.innerText =
        activeTarget.mil !== null ? activeTarget.mil : "OUT";
    if (meterDisplay) meterDisplay.innerText = activeTarget.distance + "m";

    if (!trajUpdatePending) {
      trajUpdatePending = true;
      requestAnimationFrame(() => {
        toggleTransitions(false);

        renderMarkers();
        renderTargeting();
        render();

        trajUpdatePending = false;

        if (window.trajRestoreTimeout) clearTimeout(window.trajRestoreTimeout);

      });
    }
  }

  document.querySelectorAll(".traj-step-btn").forEach((btn) => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    let stepTouchHandled = false;
    let stepTouchTimeout = null;

    const handleStep = (e) => {
      if (e.type === "click" && stepTouchHandled) {
        return;
      }

      if (e.cancelable) e.preventDefault();
      e.stopPropagation();

      if (e.type === "touchstart") {
        stepTouchHandled = true;

        if (stepTouchTimeout) clearTimeout(stepTouchTimeout);

        stepTouchTimeout = setTimeout(() => {
          stepTouchHandled = false;
        }, 500);
      }

      newBtn.classList.add("pressed");
      setTimeout(() => newBtn.classList.remove("pressed"), 100);

      const step = parseInt(newBtn.getAttribute("data-step"));
      adjustTrajDistance(step);

      if (navigator.vibrate) navigator.vibrate(10);
    };

    newBtn.addEventListener("touchstart", handleStep, { passive: false });
    newBtn.addEventListener("click", handleStep);
  });

  const rangeInput = document.getElementById("trajectoryRange");
  const newRange = rangeInput.cloneNode(true);
  rangeInput.parentNode.replaceChild(newRange, rangeInput);

  newRange.addEventListener("touchstart", stopMapInteraction, {
    passive: true,
  });
  newRange.addEventListener("touchmove", stopMapInteraction, { passive: true });
  newRange.addEventListener("touchend", stopMapInteraction, { passive: true });
  newRange.addEventListener("mousedown", stopMapInteraction);

  newRange.addEventListener("input", (e) => {
    updateTrajectoryFromDistance(parseInt(e.target.value));
  });

  const spFilterBtn = document.getElementById("spFilterBtn");
  if (spFilterBtn) {
    let setupTouchHandled = false;
    let setupTouchTimeout = null;

    const handleFilterToggle = (e) => {
      if (e.type === "click" && setupTouchHandled) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (e.type === "touchstart") {
        setupTouchHandled = true;
        if (setupTouchTimeout) clearTimeout(setupTouchTimeout);
        setupTouchTimeout = setTimeout(() => {
          setupTouchHandled = false;
        }, 500);
      }

      if (e.cancelable) e.preventDefault();
      e.stopPropagation();

      filterMode = !filterMode;
      spFilterBtn.classList.toggle("active", filterMode);
      spFilterBtn.blur();

      renderMarkers();

      renderTargeting();

      render();

      if (filterMode && navigator.vibrate) navigator.vibrate([10, 30, 10]);
    };

    spFilterBtn.addEventListener("click", handleFilterToggle);
    spFilterBtn.addEventListener("touchstart", handleFilterToggle, {
      passive: false,
    });
  }

  fixKeypadEvents();
}

// ==========================================
// SAVE STATE FUNCTIONALITY
// ==========================================

function saveState() {
  const controlsDrawer = document.getElementById("controlsDrawer");

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
    customArtillery: customArtillery,
    nextCustomGunId: nextCustomGunId,
    calcHistory: calcHistory,
    historyCollapsed: historyCollapsed,
    historyEnabled: historyEnabled,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem("hllArtyCalculatorState", JSON.stringify(stateToSave));
  } catch (error) {
    console.warn("[HLL] saveState failed — localStorage unavailable:", error);

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

    if (!savedState) {
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

    const loaded = JSON.parse(savedState);

    if (!MAP_DATABASE[loaded.activeMapKey]) return null;

    activeMapKey = loaded.activeMapKey;

    activeFaction = loaded.activeFaction || null;

    activeGunIndex =
      loaded.activeGunIndex !== undefined ? loaded.activeGunIndex : -1;

    activeCustomGunId = loaded.activeCustomGunId || null;
    customArtillery = loaded.customArtillery || [];
    nextCustomGunId = loaded.nextCustomGunId || 1;

    manualCalcFaction = loaded.manualCalcFaction || "us";
    rulerEnabled =
      loaded.rulerEnabled !== undefined ? loaded.rulerEnabled : false;
    hudEnabled = loaded.hudEnabled !== undefined ? loaded.hudEnabled : false;

    calcHistory = loaded.calcHistory || [];
    historyCollapsed = loaded.historyCollapsed || false;
    historyEnabled =
      loaded.historyEnabled !== undefined ? loaded.historyEnabled : false;

    const historyEnabledToggle = document.getElementById(
      "historyEnabledToggle",
    );
    const historyList = document.getElementById("calcHistoryList");
    const toggleBtn = document.getElementById("toggleHistoryBtn");
    const clearBtn = document.getElementById("clearHistoryBtn");

    if (historyEnabledToggle) {
      historyEnabledToggle.checked = historyEnabled;
    }

    if (toggleBtn) {
      if (historyCollapsed) {
        toggleBtn.style.transform = "rotate(0deg)";
        toggleBtn.classList.add("collapsed");
      } else {
        toggleBtn.style.transform = "rotate(180deg)";
        toggleBtn.classList.remove("collapsed");
      }
    }

    if (historyList) {
      historyList.style.display = historyCollapsed ? "none" : "block";
    }

    const modalContent = document.querySelector("#calcModal .modal-content");
    if (modalContent) {
      if (historyCollapsed) {
        modalContent.classList.remove("history-expanded");
      } else {
        modalContent.classList.add("history-expanded");
      }
    }

    if (clearBtn) {
      clearBtn.style.visibility = historyEnabled ? "visible" : "hidden";
    }

    updateCalcButton();

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
  }
}

// ==========================================
// 5. EVENT LISTENERS
// ==========================================

let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
const DRAG_THRESHOLD = 5;


mapContainer.addEventListener("click", (e) => {
  if (isDragging) return;

  if (filterMode) return;

  if (placementMode) {
    if (IS_MOBILE) {
      return;
    }

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

  if (moveMode && movingGunId) {
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

    if (!isPositionInAllowedSector(targetPos.x, targetPos.y, w, h)) {
      const guideEl = document.getElementById("setupGuide");
      if (guideEl) {
        guideEl.classList.remove("hidden", "success");
        guideEl.innerHTML = `<span style="color:#ff4444;font-weight:900;">❌ ONLY IN GREEN SECTOR</span>`;
      }
      if (navigator.vibrate) navigator.vibrate([60, 30, 60]);

      setTimeout(() => {
        if (moveMode && guideEl) {
          guideEl.innerText = "CLICK NEW POSITION FOR ARTILLERY";
        } else if (guideEl) {
          guideEl.classList.add("hidden");
        }
      }, 2200);

      return;
    }

    moveCustomGun(movingGunId, targetPos.x, targetPos.y);
    return;
  }

  // ============================================================
  // FIX: CHECK IF CROSSHAIR IS VISIBLE
  // ============================================================
  const crosshair = document.getElementById("mobileCrosshair");
  if (crosshair && crosshair.offsetParent !== null) {
    return;
  }

  const rect = mapContainer.getBoundingClientRect();

  const isHighDPI = window.devicePixelRatio > 1;
  const useFloats = isHighDPI || (isFirefox && state.scale > 1.05);

  const currentVisualX = useFloats ? state.pointX : Math.round(state.pointX);
  const currentVisualY = useFloats ? state.pointY : Math.round(state.pointY);

  const clickX = e.clientX - rect.left - currentVisualX;
  const clickY = e.clientY - rect.top - currentVisualY;

  const effectiveZoom = state.scale * state.fitScale;
  const rawImgX = clickX / effectiveZoom;
  const rawImgY = clickY / effectiveZoom;

  if (!IS_MOBILE || !hudEnabled) {
    triggerFirePulse(rawImgX, rawImgY);
    if (navigator.vibrate) navigator.vibrate(30);
  }

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

  const gunPos = getActiveGunCoords();
  if (!gunPos) {
    return;
  }

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

  toggleTransitions(false);

  if (trajSliderEnabled) {
    const dx = activeTarget.gameX - gunPos.x;
    const dy = activeTarget.gameY - gunPos.y;
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

  renderMarkers();
  renderTargeting();
  render();

});

let isWheelThrottled = false;

mapContainer.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();

    mapStage.classList.remove("zoom-transition");
    document.getElementById("labelLayer")?.classList.remove("zoom-transition");
    mapStage.style.transition = "none";

    if (!isWheelThrottled) {
      isWheelThrottled = true;

      requestAnimationFrame(() => {
        const direction = e.deltaY > 0 ? -1 : 1;

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

  },
  { passive: false },
);

mapContainer.addEventListener("mousedown", (e) => {
  e.preventDefault();

  toggleTransitions(false);

  state.panning = true;
  isDragging = false;

  dragStartX = e.clientX;
  dragStartY = e.clientY;

  state.startX = e.clientX - state.pointX;
  state.startY = e.clientY - state.pointY;

});

window.addEventListener("mousemove", (e) => {
  if (!state.panning) return;
  e.preventDefault();

  const moveDist = Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY);

  if (!isDragging && moveDist > DRAG_THRESHOLD) {
    isDragging = true;
    mapContainer.style.cursor = "grabbing";
  }

  if (isDragging) {
    handleMove(e.clientX, e.clientY);
  }
});

window.addEventListener("mouseup", () => {
  state.panning = false;
  mapContainer.style.cursor = "";
});


let initialPinchDistance = null;
let lastZoomScale = 1;

mapContainer.addEventListener(
  "touchstart",
  (e) => {
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
      const moveDist = Math.hypot(
        e.touches[0].clientX - dragStartX,
        e.touches[0].clientY - dragStartY,
      );

      if (!isDragging && moveDist > DRAG_THRESHOLD) {
        isDragging = true;
      }

      if (isDragging) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    } else if (e.touches.length === 2 && initialPinchDistance) {
      isDragging = true;
      const currentDistance = getPinchDistance(e);
      const zoomFactor = currentDistance / initialPinchDistance;

      let newZoom = lastZoomScale * zoomFactor;
      newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));

      const center = getPinchCenter(e);
      const rect = mapContainer.getBoundingClientRect();
      const mouseX = center.x - rect.left;
      const mouseY = center.y - rect.top;

      if (!isRendering) {
        isRendering = true;
        requestAnimationFrame(() => {
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

  clearTimeout(window.savePanTimeout);
  window.savePanTimeout = setTimeout(saveState, 1000);
}

document.addEventListener("touchstart", function () {}, true);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (activeTarget) {
      toggleTransitions(false);

      activeTarget = null;

      trajSliderEnabled = false;
      const trajToggleBtn = document.getElementById("trajToggleBtn");
      const trajContainer = document.getElementById("trajSliderContainer");
      if (trajToggleBtn) trajToggleBtn.classList.remove("active");
      if (trajContainer) trajContainer.classList.add("hidden");

      renderMarkers();
      renderTargeting();
      render();

    }
  }
});

// ==========================================
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

  window.updateZoomSliderUI = function () {
    const range = MAX_ZOOM - MIN_ZOOM;
    const progress = (state.scale - MIN_ZOOM) / range;
    const percentage = Math.max(0, Math.min(1, progress)) * 100;

    handle.style.bottom = `${percentage}%`;
    fill.style.height = `${percentage}%`;
  };

  let isDraggingSlider = false;

  function updateZoomFromEvent(e) {
    const rect = track.getBoundingClientRect();
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    let val = (rect.bottom - clientY) / rect.height;
    val = Math.max(0, Math.min(1, val));

    const newZoom = MIN_ZOOM + val * (MAX_ZOOM - MIN_ZOOM);

    const containerRect = mapContainer.getBoundingClientRect();
    setZoomLevel(newZoom, containerRect.width / 2, containerRect.height / 2);
  }

  const startDrag = (e) => {
    isDraggingSlider = true;

    mapStage.style.transition = "none";
    mapStage.classList.remove("zoom-transition");

    updateZoomFromEvent(e);
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
  };

  track.addEventListener("mousedown", startDrag);
  track.addEventListener("touchstart", startDrag, { passive: false });

  window.addEventListener("mousemove", (e) => {
    if (isDraggingSlider) updateZoomFromEvent(e);
  });
  window.addEventListener("touchmove", doDrag, { passive: false });

  window.addEventListener("mouseup", endDrag);
  window.addEventListener("touchend", endDrag);

  const handleBtn = (e, direction) => {
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();

    const btn = e.currentTarget;

    if (btn.classList.contains("pressed")) return;

    if (navigator.vibrate) navigator.vibrate(25);

    btn.classList.add("pressed");
    setTimeout(() => btn.classList.remove("pressed"), 150);

    mapStage.style.transition = "none";
    mapStage.classList.remove("zoom-transition");

    const step = IS_MOBILE ? 2.0 : 1.0;

    let target = state.scale + direction * step;
    target = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, target));

    const rect = mapContainer.getBoundingClientRect();

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

initZoomControls();

document.addEventListener("DOMContentLoaded", function () {
  const controlsDrawer = document.getElementById("controlsDrawer");
  const toggleBtn = document.getElementById("drawerToggleBtn");

  if (controlsDrawer) {
    if (window.savedPanelHidden) {
      controlsDrawer.classList.add("closed");
      document.body.classList.add("guides-dismissed");
    }
  }

  if (toggleBtn && controlsDrawer) {
    const isClosed = controlsDrawer.classList.contains("closed");
    toggleBtn.setAttribute("aria-expanded", isClosed ? "false" : "true");
  }

  const drawer = document.getElementById("controlsDrawer");

  if (toggleBtn && drawer) {
    toggleBtn.addEventListener("click", () => {
      drawer.classList.toggle("closed");

      if (drawer.classList.contains("closed")) {
        document.body.classList.add("guides-dismissed");
      }

      const isClosed = drawer.classList.contains("closed");
      toggleBtn.setAttribute("aria-expanded", isClosed ? "false" : "true");

      window.savedPanelHidden = isClosed;

      if (drawer.classList.contains("closed")) {
        document
          .querySelectorAll(".dropdown-menu")
          .forEach((el) => el.classList.add("hidden"));
        document
          .querySelectorAll(".btn-map-Select")
          .forEach((el) => el.classList.remove("active"));
      }

      saveState();
    });
  }

  const versionEl = document.getElementById("appVersion");
  if (versionEl) {
    versionEl.textContent = APP_VERSION;
  }

  const versionPanelEl = document.getElementById("appVersionPanel");
  if (versionPanelEl) {
    versionPanelEl.textContent = APP_VERSION;
  }


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
    let html = text;
    html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
    html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
    html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
    html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>");
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
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


  const btnOpenManualCalc = document.getElementById("btnOpenManualCalc");
  const calcModal = document.getElementById("calcModal");
  const mapModal = document.getElementById("mapModal");

  if (btnOpenManualCalc && calcModal) {
    btnOpenManualCalc.addEventListener("click", (e) => {
      e.stopPropagation();
      calcModal.classList.add("active");

      btnOpenManualCalc.blur();
    });
  }

  const closeCalcBtn = document.getElementById("closeCalcBtn");
  if (closeCalcBtn && calcModal) {
    const handleCloseCalc = (e) => {
      e.preventDefault();
      e.stopPropagation();
      calcModal.classList.remove("active");
    };
    closeCalcBtn.addEventListener("click", handleCloseCalc);
    closeCalcBtn.addEventListener("touchstart", handleCloseCalc, {
      passive: false,
    });
  }

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


function openManualCalculator() {
  document.getElementById("calcModal").classList.add("active");

  updateCalcFactionDisplay();
  clearInput();
}

function closeManualCalculator() {
  document.getElementById("calcModal").classList.remove("active");
}

const closeCalcBtn = document.getElementById("closeCalcBtn");
if (closeCalcBtn) {
  const handleClose = (e) => {
    if (e.cancelable) e.preventDefault();
    closeManualCalculator();
  };

  closeCalcBtn.addEventListener("click", handleClose);
  closeCalcBtn.addEventListener("touchstart", handleClose, { passive: false });
}

const clearHistoryBtn = document.getElementById("clearHistoryBtn");
if (clearHistoryBtn) {
  const handleClearHistory = (e) => {
    if (e.cancelable) e.preventDefault();
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

const historyEnabledToggle = document.getElementById("historyEnabledToggle");
if (historyEnabledToggle) {
  const handleHistoryEnabledToggle = (e) => {
    if (navigator.vibrate) navigator.vibrate(10);
    historyEnabled = e.target.checked;
    updateCalcButton();

    if (historyEnabled) {
      renderCalcHistory();
      if (historyCollapsed) {
        const toggleHistoryBtn = document.getElementById("toggleHistoryBtn");
        if (toggleHistoryBtn) {
          toggleHistoryBtn.click();
        }
      }
    } else {
      renderCalcHistory();
      if (!historyCollapsed) {
        const toggleHistoryBtn = document.getElementById("toggleHistoryBtn");
        if (toggleHistoryBtn) {
          toggleHistoryBtn.click();
        }
      }
    }

    const clearBtn = document.getElementById("clearHistoryBtn");
    if (clearBtn) {
      clearBtn.style.visibility = historyEnabled ? "visible" : "hidden";
    }

    saveState();
  };

  historyEnabledToggle.addEventListener("change", handleHistoryEnabledToggle);
}

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

    const modalContent = document.querySelector("#calcModal .modal-content");
    if (modalContent) {
      if (historyCollapsed) {
        modalContent.classList.remove("history-expanded");
      } else {
        modalContent.classList.add("history-expanded");
      }
    }

    if (historyCollapsed) {
      toggleHistoryBtn.style.transform = "rotate(0deg)";
      toggleHistoryBtn.classList.add("collapsed");
    } else {
      toggleHistoryBtn.style.transform = "rotate(180deg)";
      toggleHistoryBtn.classList.remove("collapsed");
    }

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

const factionToggleBtn = document.getElementById("calcFactionToggle");
let isToggleCooldown = false;

if (factionToggleBtn) {
  const cycleFaction = (e) => {
    if (isToggleCooldown) return;
    isToggleCooldown = true;
    setTimeout(() => {
      isToggleCooldown = false;
    }, 200);

    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (manualCalcFaction === "us") {
      manualCalcFaction = "ger";
    } else if (manualCalcFaction === "ger") {
      manualCalcFaction = "rus";
    } else if (manualCalcFaction === "rus") {
      manualCalcFaction = "gb";
    } else if (manualCalcFaction === "gb") {
      manualCalcFaction = "can";
    } else {
      manualCalcFaction = "us";
    }

    updateCalcFactionDisplay();

    calculateManual();

    saveState();
  };

  factionToggleBtn.addEventListener("click", cycleFaction);
}

function updateCalcFactionDisplay() {
  const lbl = document.getElementById("calcFactionName");
  const img = document.getElementById("calcFlag");

  if (!lbl || !img) return;

  const flagPath = getFlagImage(manualCalcFaction);

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
    case "can":
      name = "CANADA";
      break;
    default:
      name = "UNITED STATES";
      break;
  }

  lbl.innerText = name;
  img.src = flagPath;
}

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
  calcInputVal = "0";
  updateCalcScreen();
};

function fixKeypadEvents() {
  const keys = document.querySelectorAll(".calc-keypad .key");

  let lastTouchTime = 0;

  keys.forEach((key) => {
    const rawAction = key.getAttribute("onclick");
    if (!rawAction) return;

    key.onclick = null;
    key.removeAttribute("onclick");

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

    key.addEventListener(
      "touchstart",
      (e) => {
        lastTouchTime = Date.now();

        if (e.cancelable) e.preventDefault();

        if (navigator.vibrate) navigator.vibrate(15);

        key.classList.add("pressed");
        setTimeout(() => key.classList.remove("pressed"), 100);

        executeLogic();
      },
      { passive: false },
    );

    key.addEventListener("click", (e) => {
      const now = Date.now();
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

const calcInputEl = document.getElementById("calcInput");
if (calcInputEl) {
  calcInputEl.addEventListener("input", (e) => {
    let val = e.target.value.replace(/[^0-9]/g, "");
    if (val.length > 4) val = val.slice(0, 4);
    calcInputVal = val === "" ? "0" : val;
    e.target.value = val;
    calculateManual();
  });

  calcInputEl.addEventListener("focus", (e) => {
    if (e.target.value === "0") {
      e.target.value = "";
      calcInputVal = "";
    }
  });

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

  const mils = getMilFromTable(dist, manualCalcFaction);

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

  historyList.innerHTML = "";
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
    } else if (entry.faction === "can") {
      factionName = "CAN";
      flagPath = "images/flags/can.webp";
    }

    const item = document.createElement("div");
    item.className = "history-item";
    item.dataset.index = index;

    const factionDiv = document.createElement("div");
    factionDiv.className = "history-faction";
    const flagImg = document.createElement("img");
    flagImg.src = flagPath;
    flagImg.className = "history-flag";
    flagImg.alt = factionName;
    const factionSpan = document.createElement("span");
    factionSpan.textContent = factionName;
    factionDiv.appendChild(flagImg);
    factionDiv.appendChild(factionSpan);

    const valuesDiv = document.createElement("div");
    valuesDiv.className = "history-values";
    const milSpan = document.createElement("span");
    milSpan.className = "history-mil text-yellow";
    milSpan.textContent = `${entry.mil} MIL`;
    const distSpan = document.createElement("span");
    distSpan.className = "history-dist";
    distSpan.textContent = `${entry.distance}m`;
    valuesDiv.appendChild(milSpan);
    valuesDiv.appendChild(distSpan);

    const timeDiv = document.createElement("div");
    timeDiv.className = "history-time";
    timeDiv.textContent = entry.timestamp;

    item.appendChild(factionDiv);
    item.appendChild(valuesDiv);
    item.appendChild(timeDiv);
    fragment.appendChild(item);
  });

  historyList.appendChild(fragment);
}

let isHudUpdating = false;

document.addEventListener("mousemove", (e) => {
  if (!hudEnabled) return;
  if (IS_MOBILE) return;

  const hudEl = cached.getElem("liveCursorHud");
  const ringsEl = cached.getElem("desktopCursorRings");

  if (hudEl) {
    hudEl.style.setProperty("left", e.clientX + 20 + "px", "important");
    hudEl.style.setProperty("top", e.clientY + 20 + "px", "important");
    hudEl.style.opacity = "1";
  }
  if (ringsEl) {
    ringsEl.style.setProperty("left", e.clientX + "px", "important");
    ringsEl.style.setProperty("top", e.clientY + "px", "important");
    ringsEl.style.opacity = "1";
  }

  if (!isHudUpdating) {
    isHudUpdating = true;

    requestAnimationFrame(() => {
      const mapContainer = cached.mapContainer;
      if (!mapContainer) {
        isHudUpdating = false;
        return;
      }

      if (!_mapRectCache || Date.now() - _mapRectTime > 100) {
        _mapRectCache = mapContainer.getBoundingClientRect();
        _mapRectTime = Date.now();
      }
      const rect = _mapRectCache;

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

      const mapImage = cached.mapImage;
      if (mapImage) {
        const w = mapImage.naturalWidth;
        const h = mapImage.naturalHeight;

        const targetPos = imagePixelsToGame(rawImgX, rawImgY, w, h);
        const gunPos = getActiveGunCoords();

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

      isHudUpdating = false;
    });
  }
});



function updateMobileHud() {
  if (!hudEnabled || !IS_MOBILE) return;

  const crosshair = cached.getElem("mobileCrosshair");
  const ringContainer = cached.getElem("mobileRingContainer");
  if (crosshair && !crosshair.classList.contains("placement-mode")) {
    crosshair.classList.remove("hidden");
    crosshair.style.display = "block";
    crosshair.style.opacity = "1";
    if (ringContainer) ringContainer.style.display = "block";
  }

  const mapImage = cached.mapImage;
  const mapContainer = cached.mapContainer;
  if (!mapContainer) return;
  const rect =
    _mapRectCache && Date.now() - _mapRectTime < 100
      ? _mapRectCache
      : mapContainer.getBoundingClientRect();

  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const effectiveZoom = state.scale * state.fitScale;
  const rawImgX = (centerX - state.pointX) / effectiveZoom;
  const rawImgY = (centerY - state.pointY) / effectiveZoom;

  const w = mapImage.naturalWidth;
  const h = mapImage.naturalHeight;

  const dims = getMapDimensions();
  const totalMapMeters = dims.width / GAME_UNITS_PER_METER;
  const currentMapPixelWidth = w * effectiveZoom;
  const pixelsPerMeter = currentMapPixelWidth / totalMapMeters;

  const dispersionDiameterMeters = 40;
  const rawSize = pixelsPerMeter * dispersionDiameterMeters;

  const containerSize = Math.round(rawSize / 2) * 2;

  const containerEl = cached.getElem("mobileRingContainer");
  if (containerEl && containerSize !== _lastMobContainerSize) {
    containerEl.style.width = `${containerSize}px`;
    containerEl.style.height = `${containerSize}px`;
    _lastMobContainerSize = containerSize;
  }

  const targetPos = imagePixelsToGame(rawImgX, rawImgY, w, h);
  const gunPos = getActiveGunCoords();

  if (gunPos) {
    const dx = targetPos.x - gunPos.x;
    const dy = targetPos.y - gunPos.y;
    const dist = Math.floor(
      Math.sqrt(dx * dx + dy * dy) / GAME_UNITS_PER_METER,
    );

    const factionLabel = cached.factionLabel.innerText;

    if (dist !== _lastMobDist || _lastMobMil === null) {
      const mil = getMilFromTable(dist, factionLabel);
      _lastMobMil = mil;

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
    const hudMil = cached.getElem("hudMil");
    if (hudMil && hudMil.innerText !== "---") hudMil.innerText = "---";

    const hudDist = cached.getElem("hudDist");
    if (hudDist && hudDist.innerText !== "---") hudDist.innerText = "---";

    _lastMobDist = null;
    _lastMobMil = null;
  }

  const gridRef = getGridRef(targetPos.x, targetPos.y);
  if (gridRef !== _lastMobGrid) {
    const hudGrid = cached.getElem("hudGrid");
    if (hudGrid) hudGrid.innerText = gridRef;
    _lastMobGrid = gridRef;
  }
}

function fireAtCenter() {
  const mapImage = cached.mapImage;
  const w = mapImage.naturalWidth;
  const h = mapImage.naturalHeight;

  const visualCenterX = mapContainer.clientWidth / 2;
  const visualCenterY = mapContainer.clientHeight / 2;

  const effectiveZoom = state.scale * state.fitScale;

  const rawImgX = (visualCenterX - state.pointX) / effectiveZoom;
  const rawImgY = (visualCenterY - state.pointY) / effectiveZoom;

  const targetPos = imagePixelsToGame(rawImgX, rawImgY, w, h);

  const gunPos = getActiveGunCoords();
  if (!gunPos) return;

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

  triggerFirePulse(rawImgX, rawImgY);

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

createStickyLabels();
initMapSelector();
renderMapGrid("");

loadState();

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

if (localStorage.getItem("hllArtyCalculatorState") === null) {
  openMapSelector();
}

const imgEl = document.getElementById("mapImage");
imgEl.src = MAP_DATABASE[activeMapKey].image;

const MAX_INIT_RETRIES = 100;
let initRetryCount = 0;

const onInitLoadWithRetry = function () {
  if (imgEl.naturalWidth === 0) {
    if (initRetryCount >= MAX_INIT_RETRIES) {
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

new ResizeObserver(() => {
  if (imgEl.naturalWidth > 0) {
    clearTimeout(window._resizeTimeout);
    window._resizeTimeout = setTimeout(() => {
      _mapRectCache = mapContainer.getBoundingClientRect();
      _mapRectTime = Date.now();
      updateDimensions();
      render();
    }, 100);
  }
}).observe(mapContainer);


const btnOtherProjects = document.getElementById("btnOtherProjects");
const projectsModal = document.getElementById("projectsModal");
const closeProjectsBtn = document.getElementById("closeProjectsBtn");

if (btnOtherProjects && projectsModal) {
  btnOtherProjects.addEventListener("click", (e) => {
    e.preventDefault();
    projectsModal.classList.add("active");
    btnOtherProjects.blur();
  });

  const closeHub = () => {
    projectsModal.classList.remove("active");
    if (document.activeElement) {
      document.activeElement.blur();
    }
  };

  if (closeProjectsBtn) closeProjectsBtn.onclick = closeHub;

  projectsModal.onclick = (e) => {
    if (e.target === projectsModal) closeHub();
  };

  const hubButtons = projectsModal.querySelectorAll(".footer-btn");
  hubButtons.forEach((btn) => {
    btn.addEventListener("mousedown", () => {
      setTimeout(() => btn.blur(), 0);
    });

    btn.addEventListener("click", () => {
      setTimeout(() => {
        btn.blur();
        if (document.activeElement === btn) btn.blur();
      }, 100);
    });
  });
}

window.onfocus = function () {
  document.querySelectorAll("button").forEach((b) => b.blur());
};

window.addEventListener("pageshow", (event) => {
  if (event.persisted || document.visibilityState === "visible") {
    if (document.activeElement) {
      document.activeElement.blur();
    }
    document.querySelectorAll(".footer-btn").forEach((btn) => btn.blur());
  }
});

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
