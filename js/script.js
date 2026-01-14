// ==========================================
// 1. DATA & CONFIGURATION
// ==========================================

const APP_VERSION = "v1.0.0"; // <--- CHANGE THIS TO UPDATE EVERYWHERE

// Map Dimensions
const MAP_WIDTH_METERS = 2000.0; 
const GAME_UNITS_PER_METER = 100.0;
const MAP_SDK_WIDTH = MAP_WIDTH_METERS * GAME_UNITS_PER_METER; // 200,000
const MAP_SDK_HEIGHT = MAP_SDK_WIDTH; // Square map

// SDK Boundaries
const GAME_LEFT = -MAP_SDK_WIDTH / 2; // -100,000
const GAME_RIGHT = MAP_SDK_WIDTH / 2; // 100,000
const GAME_TOP = MAP_SDK_HEIGHT / 2;  // 100,000
const GAME_BOTTOM = -MAP_SDK_HEIGHT / 2; // -100,000

// Map state
const MIN_ZOOM = 1;
let MAX_ZOOM = 10; 
const ZOOM_STEP = 0.5; 
const MARKER_ROTATION_DEG = 0; 

// Initial State
let state = { scale: 1, fitScale: 1, panning: false, pointX: 0, pointY: 0, startX: 0, startY: 0 };
let currentZoomLevel = 1;
let activeFaction = "us"; 
let activeGunIndex = 0;   
let activeTarget = null;
let activeMapKey = "CAR"; 
let rulerEnabled = true; // Ruler toggle state 
let hudEnabled = false; // NEW: HUD toggle state
let manualCalcFaction = "us"; // <--- MOVED HERE (Fixes the crash)
let currentStrongpoints = []; 
let labelCache = [];
let isRendering = false; 
let calcInputVal = ""; // Stores the string like "1250" 

// DOM Elements
const mapContainer = document.getElementById("mapContainer");
const mapStage = document.getElementById("mapStage");
const zoomIndicator = document.getElementById("zoomIndicator");

// ==========================================
// ARTILLERY DATA TABLES
// ==========================================
const ARTY_DATA = {
  US: {
    minDist: 100, maxDist: 1600,
    table: [
      { dist: 100, mil: 978 }, { dist: 200, mil: 954 }, { dist: 300, mil: 930 },
      { dist: 400, mil: 907 }, { dist: 500, mil: 883 }, { dist: 600, mil: 859 },
      { dist: 700, mil: 836 }, { dist: 800, mil: 812 }, { dist: 900, mil: 788 },
      { dist: 1000, mil: 764 }, { dist: 1100, mil: 741 }, { dist: 1200, mil: 717 },
      { dist: 1300, mil: 693 }, { dist: 1400, mil: 670 }, { dist: 1500, mil: 646 },
      { dist: 1600, mil: 622 }
    ]
  },
  GER: {
    minDist: 100, maxDist: 1600,
    table: [
      { dist: 100, mil: 978 }, { dist: 200, mil: 954 }, { dist: 300, mil: 930 },
      { dist: 400, mil: 907 }, { dist: 500, mil: 883 }, { dist: 600, mil: 859 },
      { dist: 700, mil: 836 }, { dist: 800, mil: 812 }, { dist: 900, mil: 788 },
      { dist: 1000, mil: 764 }, { dist: 1100, mil: 741 }, { dist: 1200, mil: 717 },
      { dist: 1300, mil: 693 }, { dist: 1400, mil: 670 }, { dist: 1500, mil: 646 },
      { dist: 1600, mil: 622 }
    ]
  },
  RUS: {
    minDist: 100, maxDist: 1600,
    table: [
      { dist: 100, mil: 1120 }, { dist: 200, mil: 1099 }, { dist: 300, mil: 1077 },
      { dist: 400, mil: 1056 }, { dist: 500, mil: 1035 }, { dist: 600, mil: 1013 },
      { dist: 700, mil: 992 }, { dist: 800, mil: 971 }, { dist: 900, mil: 949 },
      { dist: 1000, mil: 928 }, { dist: 1100, mil: 907 }, { dist: 1200, mil: 885 },
      { dist: 1300, mil: 864 }, { dist: 1400, mil: 843 }, { dist: 1500, mil: 821 },
      { dist: 1600, mil: 800 }
    ]
  },
  GB: {
    minDist: 100, maxDist: 1600,
    table: [
      { dist: 100, mil: 533 }, { dist: 200, mil: 516 }, { dist: 300, mil: 498 },
      { dist: 400, mil: 480 }, { dist: 500, mil: 462 }, { dist: 600, mil: 444 },
      { dist: 700, mil: 427 }, { dist: 800, mil: 409 }, { dist: 900, mil: 391 },
      { dist: 1000, mil: 373 }, { dist: 1100, mil: 356 }, { dist: 1200, mil: 338 },
      { dist: 1300, mil: 320 }, { dist: 1400, mil: 302 }, { dist: 1500, mil: 284 },
      { dist: 1600, mil: 267 }
    ]
  }
};

// Helper function to get mil value from artillery data table with interpolation
function getMilFromTable(distance, faction) {
  if (!faction) return 0;
  
  // 1. FACTION DETECTION (The Fix)
  let key = "US"; 
  const f = faction.toUpperCase();

  if (f.includes("GER") || f.includes("AXIS") || f.includes("AFRIKA")) key = "GER";
  else if (f.includes("SOVIET") || f.includes("RUS")) key = "RUS";
  else if (f.includes("BRITISH") || f.includes("ALLIES") || f.includes("GB")) key = "GB";
  else key = "US";

  const data = ARTY_DATA[key];
  if (!data) return 0;
  
  // 2. Exact match check
  const exactEntry = data.table.find(entry => entry.dist === distance);
  if (exactEntry) return exactEntry.mil;
  
  // 3. Interpolation logic
  let lowerEntry = null;
  let upperEntry = null;
  
  for (let i = 0; i < data.table.length - 1; i++) {
    if (data.table[i].dist < distance && data.table[i + 1].dist > distance) {
      lowerEntry = data.table[i];
      upperEntry = data.table[i + 1];
      break;
    }
  }
  
  if (!lowerEntry || !upperEntry) {
    const nearestEntry = data.table.reduce((nearest, entry) => {
      return Math.abs(entry.dist - distance) < Math.abs(nearest.dist - distance) ? entry : nearest;
    });
    return nearestEntry.mil;
  }
  
  const ratio = (distance - lowerEntry.dist) / (upperEntry.dist - lowerEntry.dist);
  const interpolatedMil = lowerEntry.mil + (upperEntry.mil - lowerEntry.mil) * ratio;
  
  return Math.round(interpolatedMil);
}

// ==========================================
// 2. HELPER FUNCTIONS
// ==========================================

// ==========================================
// BALLISTIC MATH HELPERS (MUZZLE CORRECTION)
// ==========================================


function showLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.classList.remove('hidden');
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    setTimeout(() => {
      overlay.classList.add('hidden');
    }, 200); 
  }
}

function syncToggleUI() {
  const isMobile = window.innerWidth <= 768;

  // 1. Sync Buttons
  const rulerBtn = document.getElementById('rulerToggleBtn');
  if (rulerBtn) rulerBtn.classList.toggle('active', rulerEnabled);

  const hudBtn = document.getElementById('hudToggleBtn');
  if (hudBtn) hudBtn.classList.toggle('active', hudEnabled);

  // 2. Sync Visibility
  const hudEl = document.getElementById("liveCursorHud");
  const crosshair = document.getElementById("mobileCrosshair");
  const fireBtn = document.getElementById("mobileFireBtn");
  
  // NEW: Get the desktop rings element
  const desktopRings = document.getElementById("desktopCursorRings");

  if (hudEnabled) {
    if (hudEl) hudEl.classList.remove("hidden");
    
    if (isMobile) {
      // Mobile Mode
      if (crosshair) crosshair.classList.remove("hidden");
      if (fireBtn) fireBtn.classList.remove("hidden");
      if (desktopRings) desktopRings.classList.add("hidden"); 
    } else {
      // Desktop Mode
      if (desktopRings) desktopRings.classList.remove("hidden"); 
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
  const ringsEl = document.getElementById("desktopCursorRings");
  // Optimization: Don't calculate if hidden or missing
  if (!ringsEl || !hudEnabled) return; 

  const mapImage = document.getElementById("mapImage");
  if (!mapImage || mapImage.naturalWidth === 0) return;

  const dims = getMapDimensions();
  // Effective scale = Current Zoom * Fit Scale
  const effectiveZoom = state.scale * state.fitScale; 
  
  // Pixels currently on screen for the whole map width
  const currentMapPixelWidth = mapImage.naturalWidth * effectiveZoom;
  
  // Total meters in the map
  const totalMapMeters = dims.width / GAME_UNITS_PER_METER;
  
  // How many pixels equal 1 meter?
  const pixelsPerMeter = currentMapPixelWidth / totalMapMeters;
  
  // Dispersion is 40m diameter (20m radius)
  const diameterPx = 40 * pixelsPerMeter;
  
  ringsEl.style.width = `${diameterPx}px`;
  ringsEl.style.height = `${diameterPx}px`;
}

// Show loading immediately
showLoading();

function toggleSubGrid(currentZoom) {
  const subGrid = document.querySelector('.keypad-grid');
  if (!subGrid) return;
  if (currentZoom >= 3.0) subGrid.style.opacity = "0.4"; 
  else subGrid.style.opacity = "0";   
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
  const xMeters = (gameX / GAME_UNITS_PER_METER) + halfWidth;
  const yMeters = halfHeight - (gameY / GAME_UNITS_PER_METER); 
  
  // Check bounds based on actual map size
  const totalW = dims.width / GAME_UNITS_PER_METER;
  const totalH = dims.height / GAME_UNITS_PER_METER;

  if (xMeters < 0 || xMeters > totalW || yMeters < 0 || yMeters > totalH) {
    return "---";
  }

  // 200m Grid Squares
  let colIndex = Math.floor(xMeters / 200); 
  let rowIndex = Math.floor(yMeters / 200);
  
  const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
  
  // Safety Clamp: Ensure we don't exceed the array if map is slightly larger (e.g., 2016m edge case)
  // This forces 2008m to still read as column "J" (Index 9) if it falls in the last visual block
  if (colIndex >= letters.length) colIndex = letters.length - 1;
  if (rowIndex >= 10) rowIndex = 9;
  if (colIndex < 0) colIndex = 0;
  if (rowIndex < 0) rowIndex = 0;
  
  const colChar = letters[colIndex];
  const rowChar = rowIndex + 1;
  
  return `${colChar}${rowChar}`;
}

function setZoomLevel(newLevel, mouseX = null, mouseY = null) {
  const prevZoom = getEffectiveZoom();
  currentZoomLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newLevel));
  state.scale = currentZoomLevel;
  
  const newZoom = getEffectiveZoom();
  
  if (mouseX !== null && mouseY !== null) {
    // Get the current world position under the mouse
    const worldX = (mouseX - state.pointX) / prevZoom;
    const worldY = (mouseY - state.pointY) / prevZoom;
    
    // Calculate what the new pan position should be to keep the same world point under the mouse
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
  const rect = mapContainer.getBoundingClientRect();
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
  for (let i = 0; i < 10; i++) {
    const el = document.createElement("div");
    el.className = "hll-grid-label";
    el.id = `label-col-${i}`;
    if (i === 0) el.innerText = "A1";
    else el.innerText = letters[i];
    labelLayer.appendChild(el);
  }
  for (let i = 1; i < 10; i++) {
    const el = document.createElement("div");
    el.className = "hll-grid-label";
    el.id = `label-row-${i}`;
    el.innerText = i + 1;
    labelLayer.appendChild(el);
  }
}

function updateStickyLabels(currentDrawScale) {
  const mapImage = document.getElementById("mapImage");
  const w = mapImage.naturalWidth;
  const h = mapImage.naturalHeight;
  const stepX = (w / 10) * currentDrawScale; 
  const stepY = (h / 10) * currentDrawScale; 

  // MOBILE CHECK
  const isMobile = window.innerWidth <= 768;
  const padding = isMobile ? 15 : 30; 
  
  const topOffset = 0;      
  const bottomOffset = 0;   
  
  const stickyTopY = Math.max(state.pointY, topOffset);
  const stickyLeftX = Math.max(state.pointX, 0);

  // --- CALCULATE TEXT SCALE ---
  let fontScale = 0.7 + ((state.scale - 1) * 0.15);
  if (fontScale > 1.0) fontScale = 1.0;

  // --- DRAW COLUMNS (Letters) ---
  for (let i = 0; i < 10; i++) {
    const el = document.getElementById(`label-col-${i}`);
    if (!el) continue;
    
    const colScreenX = state.pointX + (i * stepX);
    const finalX = colScreenX + padding;
    
    let finalY;
    if (i === 0) {
        finalY = state.pointY + padding; 
    } else {
        finalY = stickyTopY + padding;   
    }
    
    el.style.transform = `translate3d(${Math.round(finalX)}px, ${Math.round(finalY)}px, 0) scale(${fontScale})`;
  }

  // --- DRAW ROWS (Numbers) ---
  for (let i = 1; i < 10; i++) {
    const el = document.getElementById(`label-row-${i}`);
    if (!el) continue;
    
    const finalX = stickyLeftX + padding;
    const rowScreenY = state.pointY + (i * stepY);
    const finalY = rowScreenY + padding;
    
    el.style.transform = `translate3d(${Math.round(finalX)}px, ${Math.round(finalY)}px, 0) scale(${fontScale})`;
  }
}

function buildGrid() {
  let gridLayer = document.getElementById("gridLayer");
  if (!gridLayer) {
    gridLayer = document.createElement("div");
    gridLayer.id = "gridLayer";
    gridLayer.className = "grid-layer";
    const markers = document.getElementById("markers");
    mapStage.insertBefore(gridLayer, markers);
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
  keypadLayer.style.backgroundSize = `${stepX/3}px ${stepY/3}px`;
  gridLayer.appendChild(keypadLayer);

  for (let i = 0; i <= 10; i++) { 
    const vLine = document.createElement("div");
    vLine.className = "hll-grid-line vertical";
    vLine.style.left = `${i * stepX}px`;
    if (i === 0) vLine.style.transform = "translateX(0)"; 
    else if (i === 10) vLine.style.transform = "translateX(-100%)"; 
    else vLine.style.transform = "translateX(-50%)";
    gridLayer.appendChild(vLine);
  }

  for (let i = 0; i <= 10; i++) { 
    const hLine = document.createElement("div");
    hLine.className = "hll-grid-line horizontal";
    hLine.style.top = `${i * stepY}px`;
    if (i === 0) hLine.style.transform = "translateY(0)"; 
    else if (i === 10) hLine.style.transform = "translateY(-100%)"; 
    else hLine.style.transform = "translateY(-50%)";
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
      top: config.bounds.maxY 
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
    top: sdkH / 2
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
  const x = (normX * dims.width) + dims.left;
  const y = dims.top - (normY * dims.height);
  return { x: x, y: y };
}

function renderMarkers() {
  const markersLayer = document.getElementById("markers");
  if (!markersLayer) return;
  markersLayer.innerHTML = ""; 
  labelCache = [];
  
  const mapImage = document.getElementById("mapImage");
  const w = mapImage.naturalWidth;
  const h = mapImage.naturalHeight;
  const dims = getMapDimensions();
  
  if (!currentStrongpoints) return;

  // --- NEW SORTING LOGIC ---
  const mapConfig = MAP_DATABASE[activeMapKey];
  const sortMode = mapConfig ? mapConfig.gunSort : "y"; // Default to Y (Vertical)

  // Filter list to find friendly guns
  const teamArty = currentStrongpoints.filter(p => p.team === activeFaction && p.type === 'point');
  
  // Apply Sort based on Map Config
  if (sortMode === "x") {
      // Sort West to East (Left to Right)
      teamArty.sort((a, b) => a.gameX - b.gameX);
  } else {
      // Sort North to South (Top to Bottom) - EXISTING DEFAULT
      teamArty.sort((a, b) => b.gameY - a.gameY);
  }
  // -------------------------

  // FIX: Variable to hold the active gun element so we can append it last
  let activeGunEl = null;

  currentStrongpoints.forEach(point => {
    // Hide Enemy Guns
    if (point.type === 'point' && point.team !== activeFaction) {
        return; 
    }

    const el = document.createElement("div");
    el.className = `marker ${point.team} ${point.type}`;
    
    let isActiveGun = false;
    
    // Logic for Friendly Guns
    if (point.type === 'point' && point.team === activeFaction) {
       const idx = teamArty.findIndex(gun => gun.id === point.id);
       
       if (idx === activeGunIndex) {
           el.classList.add("active-gun");
           isActiveGun = true;
       } else {
           el.classList.add("dimmed-gun");
       }
    }

    const pos = gameToImagePixels(point.gameX, point.gameY, w, h);
    const finalX = Math.round(pos.x);
    const finalY = Math.round(pos.y);
    
    if (point.type === 'point') {
        const size = 32; 
        
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.left = `${finalX}px`; 
        el.style.top = `${finalY}px`; 
        el.style.marginLeft = `-${size/2}px`;
        el.style.marginTop = `-${size/2}px`;

        const img = document.createElement("img");
        img.src = "images/ui/artillery_position.webp"; 
        img.className = "arty-icon";
        
        if (isActiveGun && activeTarget) {
            // --- DYNAMIC ROTATION ---
            const targetPos = gameToImagePixels(activeTarget.gameX, activeTarget.gameY, w, h);
            const dy = targetPos.y - pos.y; 
            const dx = targetPos.x - pos.x;
            let angle = Math.atan2(dy, dx) * (180 / Math.PI);
            angle += 90; 
            img.style.transform = `rotate(${angle}deg) scaleX(-1) translateZ(0)`;
        } else {
            // --- STATIC ROTATION ---
            let baseRotation = 0; 
            const teamKey = point.team.toLowerCase(); 
            const isAxis = ["ger", "axis", "afrika", "rus", "soviet"].some(x => teamKey.includes(x));
            
            // Priority 1: Manual Config
            if (mapConfig && mapConfig.gunRotations) {
                 const rotKey = isAxis ? "ger" : "us"; 
                 const finalKey = mapConfig.gunRotations[teamKey] !== undefined ? teamKey : rotKey;
                 baseRotation = mapConfig.gunRotations[finalKey];
                 if (baseRotation === undefined) baseRotation = 0;
            } 
            // Priority 2: Automatic Fallback
            else {
                // If guns are sorted by X, it's likely a horizontal map
                if (sortMode === "x") {
                    if (isAxis) baseRotation = -90; else baseRotation = 90;
                } else {
                    if (isAxis) baseRotation = 180; else baseRotation = 0;
                }
            }
            img.style.transform = `rotate(${baseRotation}deg) scaleX(-1) translateZ(0)`;
        }
        el.appendChild(img);
    } 
    else if (point.type === 'strongpoint') {
       // Use the active map's actual dimensions (bounds or widthMeters/heightMeters),
       // not the global default MAP_SDK_WIDTH, so circle sizes stay correct across maps.
       const pxPerGameUnitX = w / dims.width;
       const pxPerGameUnitY = h / dims.height;
       const pxPerGameUnit = (pxPerGameUnitX + pxPerGameUnitY) / 2;
       const pxPerMeter = pxPerGameUnit * GAME_UNITS_PER_METER;
       const radiusMeters = point.radius / GAME_UNITS_PER_METER; 
       const radiusPx = radiusMeters * pxPerMeter;
       const size = radiusPx * 2;
       
       el.style.width = `${size}px`;
       el.style.height = `${size}px`;
       el.style.left = `${finalX}px`; 
       el.style.top = `${finalY}px`; 
       el.style.marginLeft = `-${size/2}px`;
       el.style.marginTop = `-${size/2}px`;

       const visual = document.createElement("div");
       visual.className = "marker-visual";
       el.appendChild(visual);
    }

    if (point.label) {
      const labelSpan = document.createElement("span");
      labelSpan.className = "marker-label";
      labelSpan.innerText = point.label;
      el.appendChild(labelSpan);
      labelCache.push(labelSpan);
    }

    // FIX: Instead of appending immediately, check if it's active
    if (isActiveGun) {
        activeGunEl = el; // Save for later
    } else {
        markersLayer.appendChild(el);
    }
  });

  // FIX: Append the active gun LAST so it sits on top of everything else (High Z-Index visual)
  if (activeGunEl) {
      markersLayer.appendChild(activeGunEl);
  }
}

// --- CALCULATION LOGIC HELPERS ---
function getMil(distance, factionName) {
  let key = "US"; 
  const f = factionName.toUpperCase();

  if (f.includes("GER") || f.includes("AXIS") || f.includes("AFRIKA")) key = "GER";
  else if (f.includes("SOVIET") || f.includes("RUS")) key = "RUS";
  else if (f.includes("BRITISH") || f.includes("ALLIES") || f.includes("GB")) key = "GB";
  else key = "US";

  const data = ARTY_DATA[key];
  if (distance < data.minDist || distance > data.maxDist) return null;

  for (let i = 0; i < data.table.length - 1; i++) {
    const rowA = data.table[i];
    const rowB = data.table[i+1];
    
    if (distance >= rowA.dist && distance <= rowB.dist) {
      const rangeDist = rowB.dist - rowA.dist;
      const rangeMil = rowB.mil - rowA.mil;
      const ratio = (distance - rowA.dist) / rangeDist;
      const exactMil = rowA.mil + (rangeMil * ratio);
      return Math.round(exactMil);
    }
  }
  return null;
}

function getActiveGunCoords() {
  if (!currentStrongpoints) return null;

  const teamArty = currentStrongpoints.filter(p => p.team === activeFaction && p.type === 'point');
  
  if (!teamArty || teamArty.length === 0) return null;
  
  // --- NEW SORTING LOGIC (Must match renderMarkers) ---
  const mapConfig = MAP_DATABASE[activeMapKey];
  const sortMode = mapConfig ? mapConfig.gunSort : "y"; 

  if (sortMode === "x") {
      teamArty.sort((a, b) => a.gameX - b.gameX);
  } else {
      teamArty.sort((a, b) => b.gameY - a.gameY);
  }
  // ----------------------------------------------------

  const index = activeGunIndex % teamArty.length;
  const gun = teamArty[index];
  
  return { x: gun.gameX, y: gun.gameY };
}

function renderTargeting() {
  const layer = document.getElementById("markers");
  
  // 1. CLEANUP
  layer.querySelectorAll('.trajectory-visual, .impact-marker, .impact-circles-svg, .ruler-mil-label').forEach(el => el.remove());

  // UI Panel References
  const panel = document.getElementById("targetDataPanel");
  const elDist = document.getElementById("panelDist");
  const elMil = document.getElementById("panelMil");
  const elTime = document.getElementById("panelTime");

  // 2. CHECK IF TARGET EXISTS
  if (!activeTarget || !getActiveGunCoords()) {
      if (panel) panel.classList.add("hidden"); 
      return;
  }
  if (panel) panel.classList.remove("hidden");

  const gunPos = getActiveGunCoords();
  const mapImage = document.getElementById("mapImage");
  const w = mapImage.naturalWidth;
  const h = mapImage.naturalHeight;
  
  const end = gameToImagePixels(activeTarget.gameX, activeTarget.gameY, w, h);
  const start = gameToImagePixels(gunPos.x, gunPos.y, w, h);
  
  // 3. DRAW VISUALS
  
  // --- FIX: Use dynamic map dimensions instead of global constant ---
  // This ensures 1984m maps (El Alamein) scale the ruler correctly vs 2000m maps (Carentan)
  const dims = getMapDimensions();
  const pixelsPerMeter = (w / dims.width) * GAME_UNITS_PER_METER; 
  // -----------------------------------------------------------------
  
  // --- A. TRAJECTORY LINE WITH RULER MARKERS (SVG) ---
  const totalDistPx = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
  const dangerZoneRadiusPx = 20.0 * pixelsPerMeter;
  const lineLength = Math.max(0, totalDistPx - dangerZoneRadiusPx);
  const angleRad = Math.atan2(end.y - start.y, end.x - start.x);
  
  // Calculate total distance in meters based on the CORRECT scale
  const totalDistanceMeters = totalDistPx / pixelsPerMeter;
  const intervalMeters = 50; 
  const intervalPx = intervalMeters * pixelsPerMeter;

  // Calculate pixel size for 10m segments
  const tenMeterPx = 10 * pixelsPerMeter;

  const lineSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  lineSvg.setAttribute("class", `trajectory-visual ${!rulerEnabled ? 'ruler-hidden' : ''}`);
  lineSvg.style.position = "absolute";
  lineSvg.style.left = `${start.x}px`;
  lineSvg.style.top = `${start.y}px`;
  lineSvg.style.overflow = "visible";
  lineSvg.style.pointerEvents = "none";
  lineSvg.style.zIndex = "100";
  
  // Rotate entire SVG container
  lineSvg.style.transformOrigin = "0 0";
  lineSvg.style.transform = `rotate(${angleRad * (180 / Math.PI)}deg)`;

  // Main trajectory line
  const linePath = document.createElementNS("http://www.w3.org/2000/svg", "line");
  linePath.setAttribute("x1", "0");
  linePath.setAttribute("y1", "0");
  linePath.setAttribute("x2", lineLength);
  linePath.setAttribute("y2", "0");

  const dashPart = tenMeterPx / 2; 
  linePath.style.strokeDasharray = `${dashPart}px ${dashPart}px`;
  
  lineSvg.appendChild(linePath);
  
  // Add ruler markers
  if (rulerEnabled) {
    const numMarkers = Math.floor(lineLength / intervalPx);
    const MAX_RULER_DIST = 1600;

    const factionLabel = document.getElementById("factionLabel").innerText;
    const cosAngle = Math.cos(angleRad);
    const sinAngle = Math.sin(angleRad);

    for (let i = 2; i <= numMarkers; i++) {
      const markerX = i * intervalPx;
      const distanceAtMarker = i * intervalMeters;

      if (distanceAtMarker > MAX_RULER_DIST) break;
      if (markerX > lineLength) break;
      
      const mils = getMilFromTable(distanceAtMarker, factionLabel);

      // 1. Draw the Red Ball
      const tick = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      tick.setAttribute("cx", markerX);
      tick.setAttribute("cy", "0");
      tick.setAttribute("r", "3");
      tick.setAttribute("class", "ruler-tick");
      lineSvg.appendChild(tick);

      // 2. Standard DIV Label
      const labelX = start.x + cosAngle * markerX;
      const labelY = start.y + sinAngle * markerX;

      const milLabel = document.createElement("div");
      milLabel.className = "ruler-mil-label";
      
      milLabel.innerHTML = `
        <div class="mil-value">${mils}</div>
        <div class="meter-subtext">${distanceAtMarker}m</div>
      `;
      
      milLabel.style.left = `${labelX}px`;
      milLabel.style.top = `${labelY}px`;
      
      layer.appendChild(milLabel);
    }
  }
  
  layer.prepend(lineSvg);

  // --- B. IMPACT CIRCLES (SVG) ---
  const circleSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  circleSvg.setAttribute("class", "impact-circles-svg");
  
  circleSvg.style.position = "absolute";
  circleSvg.style.left = `${Math.round(end.x)}px`;
  circleSvg.style.top = `${Math.round(end.y)}px`;
  
  function createSvgCircle(radiusMeters, className) {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    const rPx = radiusMeters * pixelsPerMeter;
    circle.setAttribute("cx", "0");
    circle.setAttribute("cy", "0");
    circle.setAttribute("r", rPx);
    circle.setAttribute("class", className); 
    return circle;
  }

  circleSvg.appendChild(createSvgCircle(20.0, 'dispersion-circle'));
  circleSvg.appendChild(createSvgCircle(10.0, 'deadzone-circle'));
  circleSvg.appendChild(createSvgCircle(5.0, 'blast-circle'));
  
  layer.appendChild(circleSvg);

  // --- C. CENTER CROSS ---
  // const marker = document.createElement("div");
  // marker.className = "impact-marker";
  // marker.style.left = `${Math.round(end.x)}px`;
  // marker.style.top = `${Math.round(end.y)}px`;
  
  // layer.appendChild(marker);

  // 4. UPDATE DASHBOARD
  if (elDist) elDist.innerText = `${activeTarget.distance}m`;

  if (activeTarget.mil) {
      if (elMil) {
          elMil.innerText = activeTarget.mil;
          elMil.className = "data-value val-huge"; 
      }
      if (elTime) {
          elTime.innerText = "24s";
          elTime.className = "data-value val-small text-green";
      }
  } else {
      if (elMil) {
          elMil.innerText = "OUT";
          elMil.className = "data-value text-red"; 
      }
      if (elTime) {
          elTime.innerText = "---";
          elTime.className = "data-value val-small";
      }
  }
}

function render() {
  clampPosition();
  const drawScale = state.scale * state.fitScale;
  
  mapContainer.style.setProperty('--current-scale', drawScale); 
  mapStage.style.setProperty('--effective-zoom', drawScale);
  mapStage.style.transform = `translate3d(${state.pointX}px, ${state.pointY}px, 0) scale(${drawScale})`;
  
  updateRealScale(drawScale);
  if (zoomIndicator) zoomIndicator.innerText = `${state.scale.toFixed(1)}x`;
  
  // --- LABEL SCALING & POSITIONING LOGIC ---
  const isMobile = window.innerWidth <= 768;
  // Increase mobile text slightly more for readability
  const mobileScaleMultiplier = isMobile ? 2.5 : 1.0; 

  // --- DYNAMIC INTERPOLATION ---
  // Range: Zoom 1.0 (Edge) -> Zoom 5.0 (Center)
  const TRANSITION_START_ZOOM = 1.0;
  const TRANSITION_END_ZOOM = 5.0;
  
  // Calculate movement progress from 0.0 to 1.0
  let progress = (state.scale - TRANSITION_START_ZOOM) / (TRANSITION_END_ZOOM - TRANSITION_START_ZOOM);
  progress = Math.max(0, Math.min(1, progress)); // Clamp between 0 and 1

  // 1. Position: Slide from 0% (Top) to 50% (Center)
  const topVal = progress * 50; 

  // 2. Transform Y: Slide from -100% (Above line) to -50% (Centered on line)
  const transY = -100 + (progress * 50);

  // 3. Spacing Gap: Slide from -20px (Space for the pin arrow) to 0px (No gap)
  // Matching your CSS arrow size (20px)
  const gap = -20 + (progress * 20);

  // 4. Arrow Opacity: Fade out faster (gone by 60% of the way)
  const arrowOp = Math.max(0, 1 - (progress * 1.6));

  // 5. TEXT SIZE SMOOTHING (The Fix)
  // Instead of "if scale > 2.0" check, we use a power curve.
  // inverseScale (1/scale) makes text stay the same size on screen.
  // We dampen it with pow(..., 0.85) so the text gets *slightly* larger visually 
  // as you zoom in, which feels more natural.
  const smoothInverse = 1.0 / Math.pow(state.scale, 0.85);
  
  const finalScale = smoothInverse * mobileScaleMultiplier;

  for (let i = 0; i < labelCache.length; i++) {
      const label = labelCache[i];
      
      // Apply calculated values
      label.style.setProperty('--arrow-opacity', arrowOp);
      label.style.top = `${topVal}%`; 
      label.style.transform = `translate(-50%, calc(${transY}% + ${gap}px)) scale(${finalScale})`;
  }

  // --- GRID THICKNESS FIX ---
  const majorThickness = Math.max(1.0, 2.0 / drawScale); 
  
  const gridLayer = document.getElementById("gridLayer");
  if (gridLayer) {
      gridLayer.style.setProperty('--major-width', `${majorThickness}px`);
      
      const subGrid = gridLayer.querySelector('.keypad-grid');
      if (subGrid) {
          subGrid.style.opacity = state.scale >= 3.0 ? "0.4" : "0";
          const minorThickness = Math.max(1.0, 1.0 / drawScale);
          gridLayer.style.setProperty('--minor-width', `${minorThickness}px`);
      }
  }
  updateStickyLabels(drawScale);
  
  if (window.updateZoomSliderUI) window.updateZoomSliderUI();
  
  // --- ADD THESE TWO LINES AT THE END ---
  updateMobileHud();
  updateDesktopRingScale(); // <--- This forces ring resize on scroll
}

// ... (rest of the code remains the same)

let _lastScaleTextEnd = "";
let _lastScaleTextMid = "";

function updateRealScale(effectiveZoom) {
  const mapImg = document.getElementById("mapImage");
  if (!mapImg || mapImg.naturalWidth === 0) return;

  // --- FIX: Get EXACT dimensions for the active map ---
  // This handles the difference between 2016m (Carentan) and 1984m (Driel)
  const dims = getMapDimensions();
  
  // Calculate total meters based on the map's SDK width
  // (SDK Width / 100 units per meter = Real Meters)
  const totalMeters = dims.width / GAME_UNITS_PER_METER;

  // Calculate pixels currently displayed on screen for the full map width
  const currentMapWidthPx = mapImg.naturalWidth * effectiveZoom;
  
  // Calculate precise Pixels Per Meter based on the SPECIFIC map size
  const pixelsPerMeter = currentMapWidthPx / totalMeters;
  // ----------------------------------------------------

  // Detect Mobile
  const isMobile = window.innerWidth <= 768;
  let barMeters;

  if (isMobile) {
    // --- MOBILE SCALE LOGIC ---
    barMeters = 600; 
    if (state.scale > 1.5)  barMeters = 400;
    if (state.scale > 2.5)  barMeters = 200;
    if (state.scale > 5.0)  barMeters = 100;
    if (state.scale > 10.0) barMeters = 50;
    if (state.scale > 18.0) barMeters = 20;
  } else {
    // --- DESKTOP SCALE LOGIC ---
    barMeters = 400;
    if (state.scale > 1.5) barMeters = 200;
    if (state.scale > 3.0) barMeters = 100;
    if (state.scale > 7.0) barMeters = 50;
    if (state.scale > 9.0) barMeters = 20;
  }

  const barPixels = barMeters * pixelsPerMeter;
  const barPixelsRounded = Math.round(barPixels);
  
  const scaleWrapper = document.getElementById("scaleWrapper");
  const elMid = document.getElementById("scaleTextMid");
  const elEnd = document.getElementById("scaleTextEnd");

  if (scaleWrapper) scaleWrapper.style.width = `${barPixelsRounded}px`;
  if (elMid) elMid.innerText = `${barMeters / 2}m`;
  if (elEnd) elEnd.innerText = `${barMeters}m`;
}

function updateDimensions() {
  const mapImage = document.getElementById("mapImage");
  if (!mapImage.complete) return;
  
  const rect = mapContainer.getBoundingClientRect();
  
  state.fitScale = Math.min(rect.width / mapImage.naturalWidth, rect.height / mapImage.naturalHeight);
  
  const isMobile = window.innerWidth <= 768; 

  if (isMobile) {
      MAX_ZOOM = 20; 
  } else {
      MAX_ZOOM = 10; 
  }

  if (state.scale < MIN_ZOOM) state.scale = MIN_ZOOM;
  if (state.scale > MAX_ZOOM) state.scale = MAX_ZOOM;
}

function centerMap() {
  const mapImage = document.getElementById("mapImage");
  state.scale = MIN_ZOOM;
  const rect = mapContainer.getBoundingClientRect();
  state.pointX = (rect.width - (mapImage.naturalWidth * state.fitScale)) / 2;
  state.pointY = (rect.height - (mapImage.naturalHeight * state.fitScale)) / 2;
  
  toggleSubGrid(state.scale);
  render();
}

function initMap() {
  // Apply panel hidden state immediately before any rendering
  const controlsDrawer = document.getElementById("controlsDrawer");
  if (controlsDrawer) {
    if (window.savedPanelHidden) {
      controlsDrawer.classList.add("closed");
    } else {
      // Remove hidden-by-default class if panel should be visible
      controlsDrawer.classList.remove("hidden-by-default");
    }
  }
  
  updateDimensions();
  centerMap();
  buildGrid();
  renderMarkers();
  renderTargeting();
  currentZoomLevel = state.scale;
  mapStage.classList.add("zoom-transition");
  
  // --- CLEAR CURSOR STYLE TO ALLOW CSS TO WORK ---
  mapContainer.style.cursor = ""; 
  // -------------------------------------------
  
  render();
  
  mapContainer.addEventListener("contextmenu", (e) => {
    e.preventDefault(); 
    return false;
  });
} // Added closing brace here

// ==========================================
// MAP DATABASE
// ==========================================
const MAP_DATABASE = {
  CAR: {
    name: "Carentan",
    image: "images/maps/map_Carentan.webp",
    thumbnail: "images/maps/thumbnail/CAR.webp",
    teams: { t1: "UNITED STATES", t2: "GERMANY" },
    
    // --- FIX 1: Exact Dimensions from MapMeta file ---
    // 40320 units * 5 sectors = 2016 meters
    widthMeters: 2016, 
    heightMeters: 2016, 
    // -------------------------------------------------

    gunRotations: { "us": 90, "ger": -90 },

    guns: ["Gun 1 (North)", "Gun 2 (Middle)", "Gun 3 (South)"],
    strongpoints: [
      // --- ALLIES GUNS ---
      { label: "", id: "US_A1", gameX: -97254.0, gameY: 4366.0, radius: 500, team: "us", type: "point" }, 
      { label: "", id: "US_A2", gameX: -97253.0, gameY: 5262.0, radius: 500, team: "us", type: "point" }, 
      { label: "", id: "US_A3", gameX: -97252.0, gameY: 6096.0, radius: 500, team: "us", type: "point" }, 

      // --- AXIS GUNS ---
      { label: "", id: "GERMANY_A1", gameX: 96890.0, gameY: -513.99, radius: 500, team: "ger", type: "point" }, 
      { label: "", id: "GERMANY_A2", gameX: 96890.0, gameY: 345.0, radius: 500, team: "ger", type: "point" }, 
      { label: "", id: "GERMANY_A3", gameX: 96890.0, gameY: 1234.0, radius: 500, team: "ger", type: "point" },

      // NOTE: Sectors grouped by MapMeta InitialOwner, NOT by geographic position.

      // --- ALLIES SECTORS ---
      { label: "FARM RUINS", id: "B3", gameX: -68814.41, gameY: -37720.035, radius: 5000.0, team: "us", type: "strongpoint" },
      { label: "502ND START", id: "B1", gameX: -67076.41, gameY: -4670.035, radius: 5000.0, team: "us", type: "strongpoint" },
      { label: "BLACTOT", id: "B2", gameX: -65543.41, gameY: 39731.965, radius: 5000.0, team: "us", type: "strongpoint" },
      { label: "DERAILED TRAIN", id: "B6", gameX: -39381.41, gameY: -28975.035, radius: 5000.0, team: "us", type: "strongpoint" },
      { label: "RUINS", id: "B4", gameX: -26183.41, gameY: -2343.035, radius: 3000.0, team: "us", type: "strongpoint" },
      { label: "PUMPING STATION", id: "B5", gameX: -36748.41, gameY: 29821.965, radius: 5000.0, team: "us", type: "strongpoint" },
      
      // --- NEUTRAL SECTORS ---
      { label: "TRAIN STATION", id: "B9", gameX: 246.59, gameY: -27698.035, radius: 5000.0, team: "neu", type: "strongpoint" },
      { label: "TOWN CENTER", id: "B7", gameX: 1021.59, gameY: 1021.96, radius: 5000.0, team: "neu", type: "strongpoint" },
      { label: "CANAL CROSSING", id: "B8", gameX: 5892.59, gameY: 39387.965, radius: 5000.0, team: "neu", type: "strongpoint" },
      
      // --- AXIS SECTORS ---
      { label: "MONT HALAIS", id: "B12", gameX: 33828.59, gameY: -51343.035, radius: 3973.63, team: "ger", type: "strongpoint" },
      { label: "RAIL CROSSING", id: "B10", gameX: 44171.59, gameY: 6296.965, radius: 5000.0, team: "ger", type: "strongpoint" },
      { label: "CUSTOMS", id: "B11", gameX: 40816.59, gameY: 34224.965, radius: 5000.0, team: "ger", type: "strongpoint" },
      { label: "LA MAISON DES ORMES", id: "B15", gameX: 72222.59, gameY: -38476.035, radius: 5000.0, team: "ger", type: "strongpoint" },
      { label: "RAIL CAUSEWAY", id: "B13", gameX: 75611.59, gameY: -5968.035, radius: 5495.63, team: "ger", type: "strongpoint" },
      { label: "CANAL LOCKS", id: "B14", gameX: 66826.59, gameY: 26456.965, radius: 5000.0, team: "ger", type: "strongpoint" }
    ]
  },
  DRI: { 
    name: "Driel", 
    image: "images/maps/map_driel.webp", 
    thumbnail: "images/maps/thumbnail/DRI.webp", 
    teams: { t1: "ALLIES", t2: "GERMANY" }, 

// --- SCALE FIX: 1984 METERS ---
    // Although SectorWidth indicates 2016m, the Level Settings (HLLWorldSettings)
    // define MBPBounds as -99200 to 99200 units (1984 meters).
    // The visual map texture is clipped to these playable bounds.
    widthMeters: 1984, 
    heightMeters: 1984, 

    gunRotations: { "gb": 0, "ger": 180 },
    gunSort: "x",

    guns: ["Gun 1 (West)", "Gun 2 (Middle)", "Gun 3 (East)"],
    strongpoints: [
      // Y coordinates inverted (multiplied by -1) to match map image orientation

      // --- ALLIES GUNS ---
      { label: "", id: "GB_A1", gameX: -8563.06, gameY: -87734.95, radius: 500, team: "us", type: "point" }, 
      { label: "", id: "GB_A2", gameX: -6264.19, gameY: -87408.29, radius: 500, team: "us", type: "point" }, 
      { label: "", id: "GB_A3", gameX: -4660.69, gameY: -86962.99, radius: 500, team: "us", type: "point" }, 

      // --- AXIS GUNS ---
      { label: "", id: "GERMANY_A1", gameX: -16081.69, gameY: 84361.05, radius: 500, team: "ger", type: "point" }, 
      { label: "", id: "GERMANY_A2", gameX: -14599.28, gameY: 84316.64, radius: 500, team: "ger", type: "point" }, 
      { label: "", id: "GERMANY_A3", gameX: -12759.99, gameY: 84396.84, radius: 500, team: "ger", type: "point" },

      // NOTE: Sectors grouped by MapMeta InitialOwner, NOT by geographic position.

      // --- ALLIES SECTORS ---
      { label: "ORCHARDS", id: "B15", gameX: -39533.19, gameY: -70991.98, radius: 8000.0, team: "us", type: "strongpoint" },
      { label: "SCHADUWWOLKEN FARM", id: "B14", gameX: -2113.17, gameY: -72341.06, radius: 6500.0, team: "us", type: "strongpoint" },
      { label: "FIELDS", id: "B13", gameX: 41461.46, gameY: -71828.51, radius: 6000.0, team: "us", type: "strongpoint" },
      { label: "RIETVELD", id: "B10", gameX: -40615.84, gameY: -40909.70, radius: 6000.0, team: "us", type: "strongpoint" },
      { label: "SOUTH RAILWAY", id: "B11", gameX: 3826.84, gameY: -42206.75, radius: 8000.0, team: "us", type: "strongpoint" },
      { label: "MIDDEL ROAD", id: "B12", gameX: 41461.46, gameY: -38457.82, radius: 6000.0, team: "us", type: "strongpoint" },
      
      // --- NEUTRAL SECTORS ---
      { label: "BRICK FACTORY", id: "B9", gameX: -39703.02, gameY: -6122.76, radius: 6000.0, team: "neu", type: "strongpoint" },
      { label: "RAILWAY BRIDGE", id: "B7", gameX: 2882.37, gameY: 3877.29, radius: 9000.0, team: "neu", type: "strongpoint" },
      { label: "GUN EMPLACEMENTS", id: "B8", gameX: 43301.99, gameY: 2530.00, radius: 5500.0, team: "neu", type: "strongpoint" },
      
      // --- AXIS SECTORS ---
      { label: "BOATYARD", id: "B1", gameX: -38518.71, gameY: 33980.62, radius: 7000.0, team: "ger", type: "strongpoint" },
      { label: "BRIDGEWAY", id: "B6", gameX: 3880.96, gameY: 39449.43, radius: 6000.0, team: "ger", type: "strongpoint" },
      { label: "RIJN BANKS", id: "B5", gameX: 39177.53, gameY: 42960.49, radius: 7000.0, team: "ger", type: "strongpoint" },
      { label: "OOSTERBEEK APPROACH", id: "B2", gameX: -36028.54, gameY: 73330.25, radius: 6000.0, team: "ger", type: "strongpoint" },
      { label: "ROSEANDER POLDER", id: "B3", gameX: 2809.07, gameY: 72870.87, radius: 6000.0, team: "ger", type: "strongpoint" },
      { label: "KASTEEL ROSANDE", id: "B4", gameX: 38371.14, gameY: 71836.70, radius: 7000.0, team: "ger", type: "strongpoint" }
    ]
  },
  ELA: { 
    name: "El Alamein", 
    image: "images/maps/map_elalamein.webp", 
    thumbnail: "images/maps/thumbnail/ELA.webp", 
    teams: {
        t1: "BRITISH 8TH ARMY",
        t2: "AFRIKA KORPS"
    }, 

    widthMeters: 1984, 
    heightMeters: 1984, 

    gunRotations: { "gb": -90, "ger": 90 },

    guns: ["Gun 1 (North)", "Gun 2 (Middle)", "Gun 3 (South)"],
    strongpoints: [
      // --- ALLIES GUNS ---
      { label: "", id: "GB_A1", gameX: 91592.76, gameY: 6998.52, radius: 500, team: "us", type: "point" }, 
      { label: "", id: "GB_A2", gameX: 90711.81, gameY: 9742.40, radius: 500, team: "us", type: "point" }, 
      { label: "", id: "GB_A3", gameX: 89586.62, gameY: 13349.61, radius: 500, team: "us", type: "point" }, 

      // --- AXIS GUNS ---
      { label: "", id: "GER_A1", gameX: -91964.09, gameY: 3237.91, radius: 500, team: "ger", type: "point" }, 
      { label: "", id: "GER_A2", gameX: -90921.03, gameY: 6183.05, radius: 500, team: "ger", type: "point" }, 
      { label: "", id: "GER_A3", gameX: -94109.44, gameY: 9760.08, radius: 500, team: "ger", type: "point" },

      // NOTE: Sectors grouped by MapMeta InitialOwner, NOT by geographic position.

      // --- AXIS SECTORS ---
      { label: "MITEIRIYA RIDGE", id: "B11", gameX: -79261.70, gameY: -36680.63, radius: 6000.0, team: "ger", type: "strongpoint" },
      { label: "ARTILLERY GUNS", id: "B6", gameX: -71609.83, gameY: 8175.46, radius: 6000.0, team: "ger", type: "strongpoint" },
      { label: "VEHICLE DEPOT", id: "B1", gameX: -68233.38, gameY: 37264.52, radius: 6000.0, team: "ger", type: "strongpoint" },
      { label: "WATCHTOWER", id: "B12", gameX: -40818.59, gameY: -37838.59, radius: 6000.0, team: "ger", type: "strongpoint" },
      { label: "EL MREIR", id: "B7", gameX: -37776.82, gameY: 2887.53, radius: 6000.0, team: "ger", type: "strongpoint" },
      { label: "HAMLET RUINS", id: "B2", gameX: -37466.63, gameY: 37732.38, radius: 6000.0, team: "ger", type: "strongpoint" },

      // --- NEUTRAL SECTORS ---
      { label: "VALLEY", id: "B13", gameX: 1970.44, gameY: -35186.07, radius: 8190.72, team: "neu", type: "strongpoint" },
      { label: "OASIS", id: "B8", gameX: -2900.92, gameY: 851.28, radius: 6000.0, team: "neu", type: "strongpoint" },
      { label: "DESERT RAT TRENCHES", id: "B3", gameX: 4880.01, gameY: 40988.05, radius: 6000.0, team: "neu", type: "strongpoint" },

      // --- ALLIES SECTORS ---
      { label: "AIRFIELD HANGARS", id: "B14", gameX: 41085.37, gameY: -32927.33, radius: 8000.0, team: "us", type: "strongpoint" },
      { label: "AIRFIELD COMMAND", id: "B9", gameX: 38495.92, gameY: 4155.89, radius: 6000.0, team: "us", type: "strongpoint" },
      { label: "FUEL DEPOT", id: "B4", gameX: 43333.85, gameY: 35426.48, radius: 7000.0, team: "us", type: "strongpoint" },
      { label: "QUARRY", id: "B15", gameX: 78760.73, gameY: -41540.40, radius: 6000.0, team: "us", type: "strongpoint" },
      { label: "AMBUSHED CONVOY", id: "B10", gameX: 72480.45, gameY: 2526.44, radius: 6000.0, team: "us", type: "strongpoint" },
      { label: "CLIFFSIDE VILLAGE", id: "B5", gameX: 68942.24, gameY: 39028.40, radius: 6000.0, team: "us", type: "strongpoint" }
    ],
  },
  FOY: { 
    name: "Foy", 
    image: "images/maps/map_foy.webp", 
    thumbnail: "images/maps/thumbnail/FOY.webp", 
    teams: { t1: "UNITED STATES", t2: "GERMANY" },

    // Verified standard dimensions
    widthMeters: 1984, 
    heightMeters: 1984, 

    // Sort Left-to-Right
    gunSort: "x",

    // US (South) points North (0), GER (North) points South (180)
    gunRotations: { "us": 0, "ger": 180 },

    guns: ["Gun 1 (West)", "Gun 2 (Middle)", "Gun 3 (East)"],
    strongpoints: [
      // --- ALLIES GUNS ---
      { label: "", id: "US_A1", gameX: 14095.0, gameY: -95545.0, radius: 500, team: "us", type: "point" }, 
      { label: "", id: "US_A2", gameX: 15033.0, gameY: -96042.0, radius: 500, team: "us", type: "point" }, 
      { label: "", id: "US_A3", gameX: 15846.0, gameY: -96295.0, radius: 500, team: "us", type: "point" }, 

      // --- AXIS GUNS ---
      { label: "", id: "GER_A1", gameX: 6178.13, gameY: 93955.51, radius: 500, team: "ger", type: "point" }, 
      { label: "", id: "GER_A2", gameX: 7401.13, gameY: 93871.51, radius: 500, team: "ger", type: "point" }, 
      { label: "", id: "GER_A3", gameX: 8783.13, gameY: 93871.70, radius: 500, team: "ger", type: "point" },

      // NOTE: Sectors grouped by MapMeta InitialOwner, NOT by geographic position.

      // --- AXIS SECTORS ---
      { label: "ROAD TO RECOGNE", id: "B11", gameX: -49755.0, gameY: 74340.0, radius: 2750.0, team: "ger", type: "strongpoint" }, 
      { label: "COBRU APPROACH", id: "B13", gameX: 9952.0, gameY: 74787.0, radius: 3500.0, team: "ger", type: "strongpoint" },  
      { label: "ROAD TO NOVILLE", id: "B12", gameX: 38286.18, gameY: 76947.95, radius: 5343.75, team: "ger", type: "strongpoint" }, 
      { label: "COBRU FACTORY", id: "B10", gameX: -29988.0, gameY: 44676.0, radius: 5500.0, team: "ger", type: "strongpoint" }, 
      { label: "FOY", id: "B15", gameX: -9586.0, gameY: 34052.0, radius: 3250.0, team: "ger", type: "strongpoint" }, 
      { label: "FLAK BATTERY", id: "B8", gameX: 45241.0, gameY: 39594.0, radius: 4000.0, team: "ger", type: "strongpoint" }, 

      // --- NEUTRAL SECTORS ---
      { label: "WEST BEND", id: "B9", gameX: -53153.0, gameY: 12966.0, radius: 5500.0, team: "neu", type: "strongpoint" }, 
      { label: "SOUTHERN EDGE", id: "B3", gameX: -1114.0, gameY: -589.0, radius: 4738.37, team: "neu", type: "strongpoint" }, 
      { label: "DUGOUT BARN", id: "B14", gameX: 46085.04, gameY: 4721.09, radius: 4139.88, team: "neu", type: "strongpoint" }, 

      // --- ALLIES SECTORS ---
      { label: "N30 HIGHWAY", id: "B4", gameX: -38407.0, gameY: -31775.0, radius: 6250.0, team: "us", type: "strongpoint" }, 
      { label: "BIZORY-FOY ROAD", id: "B2", gameX: 10035.0, gameY: -39390.0, radius: 3500.0, team: "us", type: "strongpoint" }, 
      { label: "EASTERN OURTHE", id: "B1", gameX: 45845.0, gameY: -27822.0, radius: 4531.25, team: "us", type: "strongpoint" }, 
      { label: "ROAD TO BASTOGNE", id: "B7", gameX: -52862.0, gameY: -63773.0, radius: 4000.0, team: "us", type: "strongpoint" }, 
      { label: "BOIS JACQUES", id: "B5", gameX: -5582.0, gameY: -68237.0, radius: 5000.0, team: "us", type: "strongpoint" }, 
      { label: "FOREST OUTSKIRTS", id: "B6", gameX: 46279.0, gameY: -67141.0, radius: 5000.0, team: "us", type: "strongpoint" }
    ],
  },
H4: { 
    name: "Hill 400", 
    image: "images/maps/map_hill400.webp", 
    thumbnail: "images/maps/thumbnail/H4.webp", 
    teams: { t1: "UNITED STATES", t2: "GERMANY" },

    widthMeters: 1984, 
    heightMeters: 1984, 
    gunSort: "y",
    gunRotations: { "us": 90, "ger": -90 },

    guns: ["Gun 1 (North)", "Gun 2 (Middle)", "Gun 3 (South)"],
    strongpoints: [
      // --- ALLIES GUNS ---
      { label: "", id: "US_A1", gameX: -92742.050, gameY: -12583.729, radius: 500, team: "us", type: "point" }, 
      { label: "", id: "US_A2", gameX: -92871.086, gameY: -11403.749, radius: 500, team: "us", type: "point" }, 
      { label: "", id: "US_A3", gameX: -93164.120, gameY: -9681.098, radius: 500, team: "us", type: "point" }, 

      // --- AXIS GUNS ---
      { label: "", id: "GER_A1", gameX: 88119.170, gameY: -7863.742, radius: 500, team: "ger", type: "point" }, 
      { label: "", id: "GER_A2", gameX: 88402.150, gameY: -6428.254, radius: 500, team: "ger", type: "point" }, 
      { label: "", id: "GER_A3", gameX: 88974.860, gameY: -5394.126, radius: 500, team: "ger", type: "point" },

      // NOTE: Sectors grouped by MapMeta InitialOwner, NOT by geographic position.

      // --- ALLIES SECTORS ---
      { label: "FEDERHECKE JUNCTION", id: "B1", gameX: -65367.926, gameY: -2874.167, radius: 4250.0, team: "us", type: "strongpoint" },
      { label: "CONVOY AMBUSH", id: "B2", gameX: -65875.18, gameY: 36966.816, radius: 3000.0, team: "us", type: "strongpoint" },
      { label: "STUCKCHEN FARM", id: "B3", gameX: -63938.484, gameY: -42413.004, radius: 3000.0, team: "us", type: "strongpoint" },
      { label: "BERGSTEIN CHURCH", id: "B4", gameX: -30580.357, gameY: -8420.501, radius: 3000.0, team: "us", type: "strongpoint" },
      { label: "ROER RIVER HOUSE", id: "B5", gameX: -38405.066, gameY: 43380.766, radius: 3000.0, team: "us", type: "strongpoint" },
      { label: "KIRCHWEG", id: "B6", gameX: -41257.29, gameY: -31282.14, radius: 3000.0, team: "us", type: "strongpoint" },

      // --- NEUTRAL SECTORS ---
      { label: "FLAK PITS", id: "B7", gameX: 1384.489, gameY: 33584.805, radius: 3000.0, team: "neu", type: "strongpoint" },
      { label: "HILL 400", id: "B8", gameX: -1408.900, gameY: -4698.044, radius: 5000.0, team: "neu", type: "strongpoint" },
      { label: "SOUTHERN APPROACH", id: "B9", gameX: 948.213, gameY: -25170.994, radius: 3000.0, team: "neu", type: "strongpoint" },

      // --- AXIS SECTORS ---
      { label: "EASTERN SLOPE", id: "B10", gameX: 29662.375, gameY: 3406.845, radius: 3000.0, team: "ger", type: "strongpoint" },
      { label: "TRAIN WRECK", id: "B11", gameX: 32129.537, gameY: -43600.098, radius: 3000.0, team: "ger", type: "strongpoint" },
      { label: "PAPER MILL", id: "B12", gameX: 69319.79, gameY: -39032.61, radius: 3000.0, team: "ger", type: "strongpoint" },
      { label: "ROER RIVER CROSSING", id: "B13", gameX: 64685.836, gameY: 33321.977, radius: 3000.0, team: "ger", type: "strongpoint" },
      { label: "ZERKALL", id: "B14", gameX: 78823.555, gameY: 9569.677, radius: 5000.0, team: "ger", type: "strongpoint" },
      { label: "ESELSWEG JUNCTION", id: "B15", gameX: 26549.63, gameY: 41028.504, radius: 3000.0, team: "ger", type: "strongpoint" }
    ],
  },
KHA: {
    name: "Kharkov",
    image: "images/maps/map_kharkov.webp",
    thumbnail: "images/maps/thumbnail/KHA.webp",
    teams: { t1: "SOVIET UNION", t2: "GERMANY" },

    widthMeters: 1984, // Confirmed
    heightMeters: 1984,

    gunSort: "x",
    gunRotations: { "us": 0, "ger": 180 },

    guns: ["Gun 1 (West)", "Gun 2 (Middle)", "Gun 3 (East)"],
    strongpoints: [
      // --- AXIS GUNS ---
      { label: "", id: "GER_A1", gameX: -3351.93, gameY: -90730.05, radius: 500, team: "ger", type: "point" },
      { label: "", id: "GER_A2", gameX: -1593.68, gameY: -90886.69, radius: 500, team: "ger", type: "point" },
      { label: "", id: "GER_A3", gameX: 206.03, gameY: -91623.68, radius: 500, team: "ger", type: "point" },

      // --- ALLIES GUNS ---
      { label: "", id: "SOV_A1", gameX: 5643.66, gameY: 94554.93, radius: 500, team: "us", type: "point" },
      { label: "", id: "SOV_A2", gameX: 6506.63, gameY: 94131.92, radius: 500, team: "us", type: "point" },
      { label: "", id: "SOV_A3", gameX: 7607.47, gameY: 93717.47, radius: 500, team: "us", type: "point" },

      // NOTE: Sectors grouped by MapMeta InitialOwner, NOT by geographic position.
      
      // --- AXIS SECTORS ---
      { label: "WEHRMACHT OUTLOOK", id: "B1", gameX: -37313.91, gameY: -72972.37, radius: 3750.0, team: "ger", type: "strongpoint" },
      { label: "HAY STORAGE", id: "B2", gameX: 4240.65, gameY: -71736.38, radius: 3750.0, team: "ger", type: "strongpoint" },
      { label: "OVERPASS", id: "B3", gameX: 41180.39, gameY: -70416.95, radius: 3750.0, team: "ger", type: "strongpoint" },
      { label: "RIVER CROSSING", id: "B4", gameX: -27116.35, gameY: -40003.02, radius: 3750.0, team: "ger", type: "strongpoint" },
      { label: "BELGOROD OUTSKIRTS", id: "B5", gameX: 8105.97, gameY: -38673.01, radius: 9000.0, team: "ger", type: "strongpoint" },
      { label: "LUMBERYARD", id: "B6", gameX: 46774.79, gameY: -37490.91, radius: 3750.0, team: "ger", type: "strongpoint" },

      // --- NEUTRAL SECTORS ---
      { label: "WATER MILL", id: "B7", gameX: -36761.05, gameY: 3563.89, radius: 3750.0, team: "neu", type: "strongpoint" },
      { label: "ST MARY", id: "B8", gameX: 6074.99, gameY: 633.23, radius: 6000.0, team: "neu", type: "strongpoint" },
      { label: "DISTILLERY", id: "B9", gameX: 44449.21, gameY: 4542.49, radius: 3750.0, team: "neu", type: "strongpoint" },

      // --- ALLIES SECTORS ---
      { label: "BITTER SPRING", id: "B10", gameX: -37433.28, gameY: 38891.41, radius: 8000.0, team: "us", type: "strongpoint" },
      { label: "LUMBER WORKS", id: "B11", gameX: 7916.14, gameY: 39814.16, radius: 3750.0, team: "us", type: "strongpoint" },
      { label: "WINDMILL HILLSIDE", id: "B12", gameX: 46877.23, gameY: 41370.87, radius: 3750.0, team: "us", type: "strongpoint" },
      { label: "MARSH TOWN", id: "B13", gameX: -36517.52, gameY: 70661.75, radius: 3750.0, team: "us", type: "strongpoint" },
      { label: "SOVIET VANTAGE POINT", id: "B14", gameX: 8032.91, gameY: 70714.63, radius: 3750.0, team: "us", type: "strongpoint" },
      { label: "GERMAN FUEL DUMP", id: "B15", gameX: 41168.31, gameY: 70231.15, radius: 3750.0, team: "us", type: "strongpoint" }
    ],
  },
KUR: { 
    name: "Kursk", 
    image: "images/maps/map_kursk.webp", 
    thumbnail: "images/maps/thumbnail/KUR.webp", 
    teams: { t1: "SOVIET UNION", t2: "GERMANY" },
    
    // Confirmed 1984m
    widthMeters: 1984, 
    heightMeters: 1984, 
    
    // Soviets (North) face South (180), Germans (South) face North (0)
    gunRotations: { "us": 180, "ger": 0 },
    gunSort: "x", 

    guns: ["Gun 1 (West)", "Gun 2 (Middle)", "Gun 3 (East)"],
    strongpoints: [
      // NOTE: Y-Coordinates Inverted (Raw Y * -1).
      // Radii = 1000 * RelativeScale3D.X
      
      // --- AXIS BASE (South / Bottom / Negative Inverted Y) ---
      // Sorted West to East
      { label: "ROAD TO KURSK", id: "B1", gameX: -31287.0, gameY: -68120.0, radius: 4500.0, team: "ger", type: "strongpoint" }, // Booster_1
      { label: "AMMO DUMP", id: "B14", gameX: -1729.0, gameY: -66294.0, radius: 5447.0, team: "ger", type: "strongpoint" }, // Booster 14
      { label: "EASTERN POSITION", id: "B13", gameX: 36100.0, gameY: -65758.0, radius: 6000.0, team: "ger", type: "strongpoint" }, // Booster 13

      // --- AXIS MID (Mid-South) ---
      { label: "RUDNO", id: "B2", gameX: -27089.0, gameY: -40069.0, radius: 6000.0, team: "ger", type: "strongpoint" }, // Booster 2
      { label: "DESTROYED BATTERY", id: "B15", gameX: -990.0, gameY: -39981.0, radius: 4500.0, team: "ger", type: "strongpoint" }, // Booster 15
      { label: "THE MUDDY CHURN", id: "B12", gameX: 41089.0, gameY: -42772.0, radius: 4500.0, team: "ger", type: "strongpoint" }, // Booster 12

      // --- NEUTRAL (Center) ---
      { label: "THE WINDMILLS", id: "B3", gameX: -26712.39, gameY: 4842.25, radius: 6000.0, team: "neu", type: "strongpoint" }, // Booster 3
      { label: "YAMKI", id: "B10", gameX: 9609.0, gameY: -3974.0, radius: 6973.0, team: "neu", type: "strongpoint" }, // Booster 10
      { label: "OLEG'S HOUSE", id: "B11", gameX: 39754.0, gameY: -7774.0, radius: 4500.0, team: "neu", type: "strongpoint" }, // Booster 11

      // --- ALLIES MID (Mid-North) ---
      { label: "PANZER'S END", id: "B4", gameX: -35117.0, gameY: 31958.0, radius: 6000.0, team: "us", type: "strongpoint" }, // Booster 4
      { label: "DEFENCE IN DEPTH", id: "B9", gameX: 1604.0, gameY: 34906.0, radius: 7022.0, team: "us", type: "strongpoint" }, // Booster 9
      { label: "LISTENING POST", id: "B8", gameX: 40413.0, gameY: 36000.0, radius: 7673.0, team: "us", type: "strongpoint" }, // Booster 8

      // --- ALLIES BASE (North / Top / Positive Inverted Y) ---
      { label: "ARTILLERY POSITION", id: "B5", gameX: -35117.0, gameY: 68921.0, radius: 6000.0, team: "us", type: "strongpoint" }, // Booster 5
      { label: "GRUSHKI", id: "B6", gameX: 7070.0, gameY: 68141.0, radius: 4961.0, team: "us", type: "strongpoint" }, // Booster 6
      { label: "GRUSHKI FLANK", id: "B7", gameX: 47151.0, gameY: 67169.0, radius: 4500.0, team: "us", type: "strongpoint" }, // Booster 7

      // --- GUN POSITIONS ---
      // GERMANS (South - Bottom of Map)
      { label: "", id: "GER_A1", gameX: -1583.09, gameY: -91085.52, radius: 500, team: "ger", type: "point" }, // West
      { label: "", id: "GER_A2", gameX: -584.95,  gameY: -91323.79, radius: 500, team: "ger", type: "point" }, // Middle
      { label: "", id: "GER_A3", gameX: 249.13,   gameY: -91934.51, radius: 500, team: "ger", type: "point" }, // East

      // SOVIETS (North - Top of Map)
      { label: "", id: "SOV_A1", gameX: 3988.0, gameY: 91604.0, radius: 500, team: "us", type: "point" }, // West
      { label: "", id: "SOV_A2", gameX: 4834.0, gameY: 91543.0, radius: 500, team: "us", type: "point" }, // Middle
      { label: "", id: "SOV_A3", gameX: 5641.0, gameY: 91341.0, radius: 500, team: "us", type: "point" }  // East
    ] 
  },
  OMA: { 
    name: "Omaha Beach", 
    image: "images/maps/map_omaha.webp", 
    thumbnail: "images/maps/thumbnail/OMA.webp", 
    teams: { t1: "UNITED STATES", t2: "GERMANY" },
    
    // --- DIMENSIONS ---
    // Using standard 1984m square (same as Driel, Kharkov)
    // MBPBounds: -99200 to 99200 units = 1984 meters
    widthMeters: 1984,
    heightMeters: 1984,
    
    // --- GUN SORTING ---
    // "x": Sort guns Left-to-Right (West->East) for horizontal gun lines
    // "y": Sort guns Top-to-Bottom (North->South) - used for Omaha since labels are North/Middle/South
    gunSort: "y",
    
    // --- GUN ROTATIONS ---
    // Germany West, US East (west<->east layout): rotate guns to face inward.
    // US guns on east side point west (-90°), GER guns on west side point east (90°)
    gunRotations: { us: -90, ger: 90 },
    
    guns: ["Gun 1 (North)", "Gun 2 (Middle)", "Gun 3 (South)"],
    strongpoints: [
      // --- STRONGPOINTS (OBJECTIVES) ---
      // Extracted from FModel JSON: SphereSectorCaptureBooster components
      // Names and team assignments from MapMeta_OmahaWarfare_C (WarfareMeta)
      // Effective radius = SphereRadius × RelativeScale3D (if present)
      // Team mapping: ETeam::Axis → "ger", ETeam::Allies → "us", ETeam::None → "neu"
      // Map orientation: RightToLeft flow per MapMeta
      // Y coordinates inverted (multiplied by -1) to match map image orientation
      // 
      // NOTE: Sectors grouped by MapMeta InitialOwner, NOT by geographic position.
      // SphereSectorCaptureBooster numbers are randomized and don't match sector order.
      // Coordinates extracted from booster components, names from MapMeta_OmahaWarfare_C.
      
      // --- AXIS SECTORS ---
      // Based on MapMeta: InitialOwner: Axis
      // Y coordinates inverted (multiplied by -1) to match map image orientation
      { label: "BEAUMONT ROAD", id: "B11", gameX: -66508.0, gameY: 34528.0, radius: 5000.0, team: "ger", type: "strongpoint" }, // SphereSectorCaptureBooster12
      { label: "CROSSROADS", id: "B12", gameX: -63975.723, gameY: -2684.23, radius: 3713.8135, team: "ger", type: "strongpoint" }, // SphereSectorCaptureBooster13
      { label: "CHURCH ROAD", id: "B9", gameX: -36692.0, gameY: 9308.0, radius: 5000.0, team: "ger", type: "strongpoint" }, // SphereSectorCaptureBooster10
      { label: "REAR BATTERY", id: "B10", gameX: -40364.508, gameY: 47019.88, radius: 5000.0, team: "ger", type: "strongpoint" }, // SphereSectorCaptureBooster11
      { label: "LES ISLES", id: "B13", gameX: -65785.0, gameY: -33673.0, radius: 5000.0, team: "ger", type: "strongpoint" }, // SphereSectorCaptureBooster14
      { label: "THE ORCHARDS", id: "B8", gameX: -44319.355, gameY: -27163.912, radius: 4000.0, team: "ger", type: "strongpoint" }, // SphereSectorCaptureBooster9
      
      // --- NEUTRAL SECTORS ---
      // Based on MapMeta: InitialOwner: None
      // Y coordinates inverted (multiplied by -1) to match map image orientation
      { label: "WEST VIERVILLE", id: "B5", gameX: 4665.0, gameY: 40540.0, radius: 5000.0, team: "neu", type: "strongpoint" }, // SphereSectorCaptureBooster6
      { label: "VIERVILLE SUR MER", id: "B6", gameX: -2661.8896, gameY: 2895.0942, radius: 5000.0, team: "neu", type: "strongpoint" }, // SphereSectorCaptureBooster7
      { label: "ARTILLERY BATTERY", id: "B7", gameX: 2342.277, gameY: -31510.633, radius: 5000.0, team: "neu", type: "strongpoint" }, // SphereSectorCaptureBooster8
      
      // --- ALLIES SECTORS ---
      // Based on MapMeta: InitialOwner: Allies
      // Y coordinates inverted (multiplied by -1) to match map image orientation
      { label: "WN73", id: "B4", gameX: 54259.0, gameY: 44498.0, radius: 5000.0, team: "us", type: "strongpoint" }, // SphereSectorCaptureBooster5
      { label: "DOG GREEN", id: "B3", gameX: 67602.0, gameY: 31262.0, radius: 6250.0, team: "us", type: "strongpoint" }, // SphereSectorCaptureBooster4, Scale: 1.25
      { label: "WN71", id: "B1", gameX: 55132.387, gameY: 5791.973, radius: 3750.0, team: "us", type: "strongpoint" }, // SphereSectorCaptureBooster2, Scale: 0.75
      { label: "THE DRAW", id: "B14", gameX: 71322.0, gameY: 7432.0, radius: 3750.0, team: "us", type: "strongpoint" }, // SphereSectorCaptureBooster15, Scale: 0.75
      { label: "WN70", id: "B2", gameX: 46516.0, gameY: -30340.0, radius: 5000.0, team: "us", type: "strongpoint" }, // SphereSectorCaptureBooster3
      { label: "DOG WHITE", id: "B15", gameX: 71817.0, gameY: -30284.0, radius: 5000.0, team: "us", type: "strongpoint" }, // SphereSectorCaptureBooster16
      
      // --- ARTILLERY GUN POSITIONS ---
      // Extracted from FModel JSON: BP_GERArtillery_Spawner and BP_USArtillery_Spawner components
      // Y coordinates inverted (multiplied by -1) to match map image orientation
      // Sorted by X coordinate (west to east) based on gunSort: "x" setting
      
      // --- GERMAN GUNS (WEST) ---
      // Sorted west to east (lowest X to highest X)
      { label: "", id: "GER_A1", gameX: -93808.164, gameY: -1728.4452, radius: 500, team: "ger", type: "point" }, // BP_GERArtillery_Spawner5 (most west)
      { label: "", id: "GER_A2", gameX: -93742.41, gameY: 662.3068, radius: 500, team: "ger", type: "point" }, // BP_GERArtillery_Spawner4
      { label: "", id: "GER_A3", gameX: -93369.984, gameY: -4131.0264, radius: 500, team: "ger", type: "point" }, // BP_GERArtillery_Spawner6 (least west)
      
      // --- US GUNS (EAST) ---
      // Sorted west to east (lowest X to highest X)
      { label: "", id: "US_A1", gameX: 77848.13, gameY: -6830.192, radius: 500, team: "us", type: "point" }, // BP_USArtillery_Spawner3 (most west of US guns)
      { label: "", id: "US_A2", gameX: 78467.6, gameY: -9514.723, radius: 500, team: "us", type: "point" }, // BP_USArtillery_Spawner4
      { label: "", id: "US_A3", gameX: 79327.93, gameY: -3703.3025, radius: 500, team: "us", type: "point" } // BP_USArtillery_Spawner_2 (most east)
    ] 
  },
PHL: { 
    name: "Purple Heart Lane", 
    image: "images/maps/map_purpleheartlane.webp", 
    thumbnail: "images/maps/thumbnail/PHL.webp", 
    teams: { t1: "UNITED STATES", t2: "GERMANY" },
    
    // Standard 1984m square map (same as Driel, Kharkov, etc.)
    widthMeters: 1984,
    heightMeters: 1984,
    
    // Sort guns by X coordinate (west to east) since they're arranged horizontally
    gunSort: "x",
    
    // US guns (north) point south (180°), German guns (south) point north (0°)
    gunRotations: { "us": 180, "ger": 0 },
    
    guns: ["Gun 1 (West)", "Gun 2 (Middle)", "Gun 3 (East)"],
    strongpoints: [
      // NOTE: Map is visually south-north, Allies north, Axis south
      // Y coordinates inverted (multiplied by -1) to match map image orientation
      // Sectors grouped by MapMeta InitialOwner, NOT by geographic position
      
      // Base Radius 1000.0 from ASphereSectorCaptureBooster.cpp (SetSphereRadius 1000.0)
      
      // --- ALLIES SECTORS (North) ---
      // Y coordinates inverted (multiplied by -1) to match map image orientation
      // Ordered north to south (highest to lowest Y)
      { label: "BLOODY BEND", id: "B12", gameX: -53699.133, gameY: 68803.984, radius: 2750.0, team: "ger", type: "strongpoint" }, // Scale 2.75
      { label: "DEAD MAN'S CORNER", id: "B8", gameX: 740.8672, gameY: 65433.984, radius: 4000.0, team: "neu", type: "strongpoint" }, // Scale 4.0
      { label: "FORWARD BATTERY", id: "B6", gameX: 33330.867, gameY: 66643.984, radius: 4000.0, team: "us", type: "strongpoint" }, // Scale 4.0
      { label: "JOURDAN CANAL", id: "B14", gameX: -41489.133, gameY: 38108.99, radius: 2750.0, team: "ger", type: "strongpoint" }, // Scale 2.75
      { label: "DOUVE BRIDGE", id: "B5", gameX: -1434.0474, gameY: 26826.268, radius: 4250.0, team: "us", type: "strongpoint" }, // Scale 4.25
      { label: "DOUVE RIVER BATTERY", id: "B15", gameX: 33572.38, gameY: 36601.72, radius: 3500.0, team: "ger", type: "strongpoint" }, // Scale 3.5
      
      // --- NEUTRAL SECTORS ---
      // Ordered north to south (highest to lowest Y)
      { label: "GROULT PILLBOX", id: "B7", gameX: -37607.4, gameY: 5672.991, radius: 5500.0, team: "neu", type: "strongpoint" }, // Scale 5.5
      { label: "CARENTAN CAUSEWAY", id: "B3", gameX: 787.74744, gameY: -1346.289, radius: 3500.0, team: "us", type: "strongpoint" }, // Scale 3.5
      { label: "FLAK POSITION", id: "B13", gameX: 45592.906, gameY: 4116.6772, radius: 4750.0, team: "ger", type: "strongpoint" }, // Scale 4.75
      
      // --- AXIS SECTORS (South) ---
      // Ordered north to south (highest to lowest Y)
      { label: "MADELEINE FARM", id: "B10", gameX: -33264.676, gameY: -30204.594, radius: 3250.0, team: "ger", type: "strongpoint" }, // Scale 3.25
      { label: "MADELEINE BRIDGE", id: "B1", gameX: 1928.2188, gameY: -39878.098, radius: 3000.0, team: "us", type: "strongpoint" }, // Scale 3.0
      { label: "AID STATION", id: "B11", gameX: 47043.207, gameY: -32172.8, radius: 3250.0, team: "ger", type: "strongpoint" }, // Scale 3.25
      { label: "INGOUF CROSSROADS", id: "B9", gameX: -36344.676, gameY: -66489.59, radius: 3250.0, team: "neu", type: "strongpoint" }, // Scale 3.25
      { label: "ROAD TO CARENTAN", id: "B2", gameX: 2953.2188, gameY: -63908.098, radius: 3000.0, team: "us", type: "strongpoint" }, // Scale 3.0
      { label: "CABBAGE PATCH", id: "B4", gameX: 46253.22, gameY: -62363.098, radius: 2500.0, team: "ger", type: "strongpoint" }, // Scale 2.5
      
      // --- ARTILLERY POSITIONS (Pure Data - Y Inverted) ---
      { label: "", id: "US_A1", gameX: -1290.70, gameY: 91683.69, radius: 500, team: "us", type: "point" }, 
      { label: "", id: "US_A3", gameX: 1351.00,  gameY: 92849.00, radius: 500, team: "us", type: "point" }, 
      { label: "", id: "US_A2", gameX: 1471.00,  gameY: 90291.00, radius: 500, team: "us", type: "point" }, 
      { label: "", id: "GER_A1", gameX: 712.84,  gameY: -90298.55, radius: 500, team: "ger", type: "point" }, 
      { label: "", id: "GER_A2", gameX: 1502.01, gameY: -92441.29, radius: 500, team: "ger", type: "point" }, 
      { label: "", id: "GER_A3", gameX: 1718.97, gameY: -90134.83, radius: 500, team: "ger", type: "point" }
    ] 
  },
REM: { 
    name: "Remagen", 
    image: "images/maps/map_remagen.webp", 
    thumbnail: "images/maps/thumbnail/REM.webp", 
    teams: { t1: "UNITED STATES", t2: "GERMANY" },
    
    // Standard 1984m dimensions
    widthMeters: 1984, 
    heightMeters: 1984, 
    
    gunSort: "x",
    
    // US (South/West) faces North (0), GER (North/East) faces South (180)
    gunRotations: { "us": 0, "ger": 180 },

    guns: ["Gun 1 (West)", "Gun 2 (Middle)", "Gun 3 (East)"],
    strongpoints: [
      // NOTE: Map is visually North-South.
      // Top of Map = Positive Y = German Lines
      // Bottom of Map = Negative Y = US Lines

      // --- AXIS SECTORS (North/Top) ---
      { label: "ALTE LIEBE BARSCH", id: "B11", gameX: -41114.0, gameY: 69583.0, radius: 4000.0, team: "ger", type: "strongpoint" }, 
      { label: "BEWALDET KREUZUNG", id: "B12", gameX: -891.0, gameY: 69550.0, radius: 4000.0, team: "ger", type: "strongpoint" }, 
      { label: "DAN RADART 512", id: "B15", gameX: 41625.0, gameY: 69063.0, radius: 4000.0, team: "ger", type: "strongpoint" }, 
      { label: "ERPEL", id: "B10", gameX: -39275.0, gameY: 40853.0, radius: 4000.0, team: "ger", type: "strongpoint" }, 
      { label: "ERPELER LEY", id: "B13", gameX: 9697.0, gameY: 42679.0, radius: 4000.0, team: "ger", type: "strongpoint" }, 
      { label: "KASBACH OUTLOOK", id: "B14", gameX: 38436.418, gameY: 41098.23, radius: 4000.0, team: "ger", type: "strongpoint" }, 

      // --- NEUTRAL SECTORS (Middle/River) ---
      { label: "ST. SEVERIN CHAPEL", id: "B9", gameX: -39275.0, gameY: 12967.0, radius: 4000.0, team: "neu", type: "strongpoint" }, 
      { label: "LUDENDORFF BRIDGE", id: "B1", gameX: 3032.2412, gameY: -7.021, radius: 8000.0, team: "neu", type: "strongpoint" }, 
      { label: "BAUERNHOF AM RHEIN", id: "B6", gameX: 38817.02, gameY: -15613.944, radius: 4000.0, team: "neu", type: "strongpoint" }, 

      // --- ALLIES SECTORS (South/Bottom) ---
      { label: "REMAGEN", id: "B7", gameX: -35925.75, gameY: -39434.0, radius: 4000.0, team: "us", type: "strongpoint" }, 
      { label: "MÖBELFABRIK", id: "B2", gameX: -1000.0, gameY: -40824.0, radius: 5000.0, team: "us", type: "strongpoint" }, 
      { label: "SCHLIEFFEN AUSWEG", id: "B5", gameX: 39053.0, gameY: -38264.0, radius: 4000.0, team: "us", type: "strongpoint" }, 
      { label: "WALDBURG", id: "B8", gameX: -40954.977, gameY: -80279.71, radius: 4000.0, team: "us", type: "strongpoint" }, 
      { label: "MÜHLENWEG", id: "B3", gameX: 3742.6152, gameY: -72094.91, radius: 4000.0, team: "us", type: "strongpoint" }, 
      { label: "HAGELKREUZ", id: "B4", gameX: 37607.746, gameY: -68933.32, radius: 4000.0, team: "us", type: "strongpoint" }, 

      // --- GUN POSITIONS ---
      // ALLIES (US) - South/Bottom (Negative Y)
      { label: "", id: "US_A1", gameX: -4446.61, gameY: -88972.766, radius: 500, team: "us", type: "point" }, 
      { label: "", id: "US_A2", gameX: -3567.6099, gameY: -89011.83, radius: 500, team: "us", type: "point" }, 
      { label: "", id: "US_A3", gameX: -2679.6123, gameY: -88972.766, radius: 500, team: "us", type: "point" }, 

      // AXIS (GER) - North/Top (Positive Y)
      { label: "", id: "GER_A1", gameX: 14294.659, gameY: 94233.6, radius: 500, team: "ger", type: "point" }, 
      { label: "", id: "GER_A2", gameX: 16394.264, gameY: 94198.32, radius: 500, team: "ger", type: "point" }, 
      { label: "", id: "GER_A3", gameX: 17936.605, gameY: 93962.43, radius: 500, team: "ger", type: "point" }
    ]
  },
SMM: { 
    name: "Sainte-Marie-du-Mont", 
    image: "images/maps/map_smdmv2.webp", 
    thumbnail: "images/maps/thumbnail/SMM.webp", 
    teams: { t1: "UNITED STATES", t2: "GERMANY" },
    
    // Standard 1984m dimensions
    widthMeters: 1984, 
    heightMeters: 1984, 
    
    // US (North) Faces South (180), GER (South) Faces North (0)
    gunRotations: { "us": 180, "ger": 0 },
    gunSort: "x", 

    guns: ["Gun 1 (West)", "Gun 2 (Middle)", "Gun 3 (East)"],
    strongpoints: [
      // NOTE: Y-Coordinates Inverted (Raw Y * -1).
      // Radii calculated: Base Radius * RelativeScale3D.X
      // Sorted North (Top) to South (Bottom).

      // --- ALLIES SECTORS (North - Positive Inverted Y) ---
      // US Base
      { label: "WINTERS LANDING", id: "B2", gameX: -39503.26, gameY: 78343.03, radius: 5755.0, team: "us", type: "strongpoint" }, // Scale 1.278
      { label: "LE GRAND CHEMIN", id: "B3", gameX: -367.0, gameY: 76667.0, radius: 4500.0, team: "us", type: "strongpoint" }, // No Scale
      { label: "THE BARN", id: "B4", gameX: 44896.0, gameY: 73822.0, radius: 5691.0, team: "us", type: "strongpoint" }, // Scale 1.264

      // US Mid
      { label: "BRECOURT BATTERY", id: "B1", gameX: -39380.0, gameY: 39702.0, radius: 6079.0, team: "us", type: "strongpoint" }, // Scale 1.35
      { label: "CATTLESHEDS", id: "B11", gameX: 2961.32, gameY: 41557.40, radius: 5401.0, team: "us", type: "strongpoint" }, // Scale 1.20
      { label: "RUE DE LA GARE", id: "B12", gameX: 35565.56, gameY: 39370.59, radius: 5893.0, team: "us", type: "strongpoint" }, // Scale 1.309

      // --- NEUTRAL SECTORS (Center) ---
      { label: "THE DUGOUT", id: "B13", gameX: -37170.91, gameY: 151.19, radius: 5815.0, team: "neu", type: "strongpoint" }, // Scale 1.292
      { label: "AA NETWORK", id: "B5", gameX: 1716.0, gameY: -2530.0, radius: 6531.0, team: "neu", type: "strongpoint" }, // Scale 1.451
      { label: "PIERRE'S FARM", id: "B6", gameX: 37508.1, gameY: -1336.70, radius: 5207.0, team: "neu", type: "strongpoint" }, // Scale 1.157

      // --- AXIS SECTORS (South - Negative Inverted Y) ---
      // GER Mid
      { label: "HUGO'S FARM", id: "B10", gameX: -38001.0, gameY: -38089.0, radius: 6046.0, team: "ger", type: "strongpoint" }, // Scale 1.343
      { label: "THE HAMLET", id: "B15", gameX: -2158.77, gameY: -42649.31, radius: 4500.0, team: "ger", type: "strongpoint" }, // No Scale
      { label: "STE MARIE DU MONT", id: "B14", gameX: 47022.13, gameY: -50258.56, radius: 6000.0, team: "ger", type: "strongpoint" }, // Base Radius 6000

      // GER Base
      { label: "THE CORNER", id: "B9", gameX: -34620.76, gameY: -69152.77, radius: 5106.0, team: "ger", type: "strongpoint" }, // Scale 1.134
      { label: "HILL 6", id: "B8", gameX: 142.14, gameY: -76822.93, radius: 4500.0, team: "ger", type: "strongpoint" }, // No Scale
      { label: "THE FIELDS", id: "B7", gameX: 39750.15, gameY: -78234.78, radius: 4500.0, team: "ger", type: "strongpoint" }, // No Scale

      // --- GUN POSITIONS ---
      // ALLIES (US) - North (Positive Y)
      { label: "", id: "US_A1", gameX: 1037.18, gameY: 95426.19, radius: 500, team: "us", type: "point" }, 
      { label: "", id: "US_A2", gameX: 1860.62, gameY: 95570.82, radius: 500, team: "us", type: "point" }, 
      { label: "", id: "US_A3", gameX: 3849.56, gameY: 95341.53, radius: 500, team: "us", type: "point" }, 

      // AXIS (GER) - South (Negative Y)
      { label: "", id: "GER_A1", gameX: -7146.81, gameY: -95880.13, radius: 500, team: "ger", type: "point" }, 
      { label: "", id: "GER_A2", gameX: -4235.60, gameY: -95027.63, radius: 500, team: "ger", type: "point" }, 
      { label: "", id: "GER_A3", gameX: -1324.40, gameY: -95453.88, radius: 500, team: "ger", type: "point" } // Estimated 3rd gun based on pattern if missing
    ] 
  },
STA: { 
    name: "Stalingrad", 
    image: "images/maps/map_stalingrad.webp", 
    thumbnail: "images/maps/thumbnail/STA.webp", 
    teams: { t1: "SOVIET UNION", t2: "GERMANY" },
    
    // Confirmed 1984m (MbPBounds -99200 to 99200)
    widthMeters: 1984, 
    heightMeters: 1984, 
    
    // Soviets (East) face West (270), Germans (West) face East (90)
    gunRotations: { "us": 270, "ger": 90 },
    gunSort: "y", 

    guns: ["Gun 1 (North)", "Gun 2 (Middle)", "Gun 3 (South)"],
    strongpoints: [
      // NOTE: IDs updated to match SphereSectorCaptureBooster numbers.
      // Coordinates: Exact Booster location (Y inverted).
      // Radii: Confirmed from STA_gameplay file (Large radii: 7000-9500).

      // --- AXIS SECTORS (West - Negative X) ---
      // GER Base (Far West)
      { label: "CITY OVERLOOK", id: "B11", gameX: -69346.0, gameY: -48417.0, radius: 8000.0, team: "ger", type: "strongpoint" }, // Booster 11 (North)
      { label: "NAIL FACTORY", id: "B10", gameX: -71016.0, gameY: -11068.0, radius: 8000.0, team: "ger", type: "strongpoint" }, // Booster 10 (Mid)
      { label: "MAMAYEV APPROACH", id: "B9", gameX: -69500.0, gameY: 47966.0, radius: 7000.0, team: "ger", type: "strongpoint" }, // Booster 9 (South)

      // GER Mid (Mid-West)
      { label: "KOMSOMOL HQ", id: "B14", gameX: -39683.0, gameY: -39676.0, radius: 8000.0, team: "ger", type: "strongpoint" }, // Booster 14 (North)
      { label: "YELLOW HOUSE", id: "B12", gameX: -39693.0, gameY: 1.5, radius: 8000.0, team: "ger", type: "strongpoint" }, // Booster 12 (Mid)
      { label: "DOLGIY RAVINE", id: "B8", gameX: -39681.0, gameY: 48845.0, radius: 7500.0, team: "ger", type: "strongpoint" }, // Booster 8 (South)

      // --- NEUTRAL SECTORS (Center - Near X=0) ---
      { label: "TRAIN STATION", id: "B15", gameX: 6.0, gameY: -39678.0, radius: 8000.0, team: "neu", type: "strongpoint" }, // Booster 15 (North)
      { label: "CARRIAGE DEPOT", id: "B13", gameX: -15.0, gameY: -13.0, radius: 8500.0, team: "neu", type: "strongpoint" }, // Booster 13 (Mid)
      { label: "RAILWAY CROSSING", id: "B7", gameX: 7.0, gameY: 39673.0, radius: 8000.0, team: "neu", type: "strongpoint" }, // Booster 7 (South)

      // --- SOVIET SECTORS (East - Positive X) ---
      // SOV Mid (Mid-East)
      { label: "THE BREWERY", id: "B3", gameX: 39674.0, gameY: -41970.0, radius: 7500.0, team: "us", type: "strongpoint" }, // Booster 3 (North)
      { label: "PAVLOV'S HOUSE", id: "B1", gameX: 48586.0, gameY: -1452.0, radius: 7000.0, team: "us", type: "strongpoint" }, // Booster 1 (Mid)
      { label: "HOUSE OF THE WORKERS", id: "B5", gameX: 36591.0, gameY: 40602.0, radius: 9500.0, team: "us", type: "strongpoint" }, // Booster 5 (South - Largest!)

      // SOV Base (Far East)
      { label: "VOLGA BANKS", id: "B4", gameX: 70121.0, gameY: -43351.0, radius: 7500.0, team: "us", type: "strongpoint" }, // Booster 4 (North)
      { label: "GRUDININ'S MILL", id: "B2", gameX: 70063.0, gameY: 32.0, radius: 7000.0, team: "us", type: "strongpoint" }, // Booster 2 (Mid)
      { label: "L-SHAPED HOUSE", id: "B6", gameX: 68875.0, gameY: 35043.0, radius: 7500.0, team: "us", type: "strongpoint" }, // Booster 6 (South)

      // --- GUN POSITIONS ---
      // SOVIETS (East - Positive X)
      { label: "", id: "SOV_A1", gameX: 78109.51, gameY: -5554.999, radius: 500, team: "us", type: "point" }, 
      { label: "", id: "SOV_A2", gameX: 78366.555, gameY: -4298.889, radius: 500, team: "us", type: "point" }, 
      { label: "", id: "SOV_A3", gameX: 78117.766, gameY: -3058.8193, radius: 500, team: "us", type: "point" }, 

      // GERMANS (West - Negative X)
      { label: "", id: "GER_A1", gameX: -93251.61, gameY: -5937.273, radius: 500, team: "ger", type: "point" }, 
      { label: "", id: "GER_A2", gameX: -93397.79, gameY: -3805.0764, radius: 500, team: "ger", type: "point" }, 
      { label: "", id: "GER_A3", gameX: -93916.195, gameY: -2579.355, radius: 500, team: "ger", type: "point" } 
    ] 
  },
SME: { 
    name: "Sainte-Mère-Église", 
    image: "images/maps/map_stmereeglise.webp", 
    thumbnail: "images/maps/thumbnail/SME.webp", 
    teams: { t1: "UNITED STATES", t2: "GERMANY" },
    
    // Standard 2000m dimensions
    widthMeters: 1984, 
    heightMeters: 1984, 
    
    // US (East) faces West (270), GER (West) faces East (90)
    gunRotations: { "us": 270, "ger": 90 },
    gunSort: "y", 

    guns: ["Gun 1 (North)", "Gun 2 (Middle)", "Gun 3 (South)"],
    strongpoints: [
      // NOTE: Y-Coordinates Inverted.
      // Map is West (Left/Ger) to East (Right/US).

      // --- ALLIES SECTORS (East - Positive X) ---
      // US Base (Far East)
      { label: "LES VIEUX VERGERS", id: "B3", gameX: 70168.0, gameY: 28861.0, radius: 4000.0, team: "us", type: "strongpoint" }, 
      { label: "CROSS ROADS", id: "B2", gameX: 72279.0, gameY: -1393.0, radius: 4000.0, team: "us", type: "strongpoint" }, 
      { label: "RUISSEAU DE FERME", id: "B1", gameX: 72138.0, gameY: -38912.0, radius: 4000.0, team: "us", type: "strongpoint" }, 

      // US Mid (Mid-East)
      { label: "ARTILLERY BATTERY", id: "B4", gameX: 39652.0, gameY: 34374.0, radius: 4000.0, team: "us", type: "strongpoint" }, 
      { label: "THE CEMETERY", id: "B5", gameX: 28858.0, gameY: -5593.0, radius: 4000.0, team: "us", type: "strongpoint" }, 
      { label: "MAISON DU CRIQUE", id: "B6", gameX: 25884.0, gameY: -30530.0, radius: 4000.0, team: "us", type: "strongpoint" }, 

      // --- NEUTRAL SECTORS (Center - Near X=0) ---
      { label: "HOSPICE", id: "B15", gameX: -1100.0, gameY: 46000.0, radius: 4000.0, team: "neu", type: "strongpoint" }, 
      { label: "SAINTE-MÈRE-ÉGLISE", id: "B7", gameX: 5949.0, gameY: 7436.0, radius: 4741.0, team: "neu", type: "strongpoint" }, 
      { label: "CHECKPOINT", id: "B10", gameX: 467.0, gameY: -32490.0, radius: 4000.0, team: "neu", type: "strongpoint" }, 

      // --- AXIS SECTORS (West - Negative X) ---
      // GER Mid (Mid-West)
      { label: "ROUTE DU HARAS", id: "B11", gameX: -40886.0, gameY: 37779.0, radius: 4000.0, team: "ger", type: "strongpoint" }, 
      { label: "WESTERN APPROACH", id: "B8", gameX: -32652.0, gameY: 14761.0, radius: 4000.0, team: "ger", type: "strongpoint" }, 
      { label: "RUE DE GAMBOSVILLE", id: "B9", gameX: -34553.0, gameY: -41733.0, radius: 4000.0, team: "ger", type: "strongpoint" }, 

      // GER Base (Far West)
      { label: "FLAK POSITION", id: "B12", gameX: -69311.0, gameY: 40772.0, radius: 4000.0, team: "ger", type: "strongpoint" }, 
      { label: "VAULAVILLE", id: "B13", gameX: -62223.0, gameY: 3146.0, radius: 2507.0, team: "ger", type: "strongpoint" }, 
      { label: "LA PRAIRIE", id: "B14", gameX: -67517.0, gameY: -35037.0, radius: 4000.0, team: "ger", type: "strongpoint" }, 

      // --- GUN POSITIONS ---
      // ALLIES (US) - East (Positive X)
      { label: "", id: "US_A1", gameX: 91952.0, gameY: -559.0, radius: 500, team: "us", type: "point" }, 
      { label: "", id: "US_A2", gameX: 91952.0, gameY: 1057.0, radius: 500, team: "us", type: "point" }, 
      { label: "", id: "US_A3", gameX: 91952.0, gameY: 2432.0, radius: 500, team: "us", type: "point" }, 

      // AXIS (GER) - West (Negative X)
      { label: "", id: "GER_A1", gameX: -95041.6, gameY: -1857.68, radius: 500, team: "ger", type: "point" }, 
      { label: "", id: "GER_A2", gameX: -95111.11, gameY: -1027.0771, radius: 500, team: "ger", type: "point" }, 
      { label: "", id: "GER_A3", gameX: -95177.37, gameY: -235.55342, radius: 500, team: "ger", type: "point" }
    ] 
  },
UTA: { 
    name: "Utah Beach", 
    image: "images/maps/map_utahbeach.webp", 
    thumbnail: "images/maps/thumbnail/UTA.webp", 
    teams: { t1: "UNITED STATES", t2: "GERMANY" },
    
    // Confirmed 1984m (Standard Warfare Map)
    widthMeters: 1984, 
    heightMeters: 1984, 
    
    // US (East) faces West (270), GER (West) faces East (90)
    gunRotations: { "us": 270, "ger": 90 },
    gunSort: "y", 

    guns: ["Gun 1 (North)", "Gun 2 (Middle)", "Gun 3 (South)"],
    strongpoints: [
      // NOTE: Y-Coordinates Inverted.
      // Sorted North (Negative Y) to South (Positive Y).
      
      // --- AXIS BASE (West - Negative X) ---
      { label: "SAINTE MARIE APPROACH", id: "B17", gameX: -64837.0, gameY: -52705.0, radius: 3000.0, team: "ger", type: "strongpoint" }, // North
      { label: "FLOODED HOUSE", id: "B16", gameX: -66464.0, gameY: 2944.0, radius: 3000.0, team: "ger", type: "strongpoint" }, // Mid
      { label: "MAMMUT RADAR", id: "B15", gameX: -65158.0, gameY: 51522.0, radius: 3000.0, team: "ger", type: "strongpoint" }, // South

      // --- AXIS MID (Mid-West) ---
      { label: "DROWNED FIELDS", id: "B13", gameX: -36400.0, gameY: -43928.0, radius: 3000.0, team: "ger", type: "strongpoint" }, // North
      { label: "LA GRANDE CRIQUE", id: "B12", gameX: -28986.0, gameY: -508.0, radius: 3294.0, team: "ger", type: "strongpoint" }, // Mid
      { label: "SUNKEN BRIDGE", id: "B14", gameX: -30810.0, gameY: 47853.0, radius: 3000.0, team: "ger", type: "strongpoint" }, // South

      // --- NEUTRAL (Center) ---
      { label: "WN7", id: "B9", gameX: 727.0, gameY: -50408.0, radius: 5000.0, team: "neu", type: "strongpoint" }, // North
      { label: "THE CHAPEL", id: "B10", gameX: 10650.0, gameY: 7786.0, radius: 3000.0, team: "neu", type: "strongpoint" }, // Mid
      { label: "WN4", id: "B11", gameX: 5359.0, gameY: 42267.0, radius: 3742.0, team: "neu", type: "strongpoint" }, // South (Note: Very tall oval shape in game)

      // --- ALLIES MID (Mid-East) ---
      { label: "WN5", id: "B8", gameX: 48763.0, gameY: -44080.0, radius: 3194.0, team: "us", type: "strongpoint" }, // North
      { label: "HILL 5", id: "B7", gameX: 36131.0, gameY: 1838.0, radius: 3000.0, team: "us", type: "strongpoint" }, // Mid
      { label: "AA BATTERY", id: "B18", gameX: 35101.0, gameY: 43589.0, radius: 3942.0, team: "us", type: "strongpoint" }, // South

      // --- ALLIES BASE (East - Positive X) ---
      { label: "UNCLE RED", id: "B5", gameX: 66675.0, gameY: -45162.0, radius: 2824.0, team: "us", type: "strongpoint" }, // North
      { label: "RED ROOF HOUSE", id: "B4", gameX: 64923.67, gameY: -3144.0, radius: 3250.0, team: "us", type: "strongpoint" }, // Mid
      { label: "TARE GREEN", id: "B3", gameX: 63845.0, gameY: 46581.0, radius: 3000.0, team: "us", type: "strongpoint" }, // South

      // --- GUN POSITIONS ---
      // SOVIETS (East - Positive X)
      { label: "", id: "US_A1", gameX: 77788.36, gameY: -6617.35, radius: 500, team: "us", type: "point" }, // North
      { label: "", id: "US_A2", gameX: 78334.16, gameY: -4627.70, radius: 500, team: "us", type: "point" }, // Mid
      { label: "", id: "US_A3", gameX: 77932.25, gameY: -2639.21, radius: 500, team: "us", type: "point" }, // South

      // GERMANS (West - Negative X)
      { label: "", id: "GER_A1", gameX: -91738.08, gameY: -221.04, radius: 500, team: "ger", type: "point" }, // North
      { label: "", id: "GER_A2", gameX: -91714.0, gameY: 752.0, radius: 500, team: "ger", type: "point" }, // Mid
      { label: "", id: "GER_A3", gameX: -91649.22, gameY: 1828.61, radius: 500, team: "ger", type: "point" } // South
    ] 
  },
EBR: { 
    name: "Elsenborn Ridge", 
    image: "images/maps/TacMap_EBR_L_1944.webp", 
    thumbnail: "images/maps/thumbnail/EBR.webp", 
    teams: { t1: "UNITED STATES", t2: "GERMANY" },

    // --- DIMENSIONS ---
    // Calculated from LayoutMeta: 5 sectors * 40000 units = 2000m.
    // 1 Game Unit = 1 cm. 100 units = 1m.
    widthMeters: 2000, 
    heightMeters: 2000, 

    // --- SORTING CONFIG ---
    // "x": Sorts guns Left-to-Right (West->East). Required for horizontal gun lines.
    // "y": (Default) Sorts Top-to-Bottom. Used for most other maps.
    gunSort: "x",

    // --- ROTATION ---
    // US is North (Top), needs to point Down (180).
    // GER is South (Bottom), needs to point Up (0).
    gunRotations: { "us": 180, "ger": 0 },

    guns: ["Gun 1 (West)", "Gun 2 (Middle)", "Gun 3 (East)"],
    strongpoints: [
      // --- METHOD: Y-INVERSION (Driel Method) ---
      // The visual map is South->North.
      // Raw Data: US is Negative Y (-91k). GER is Positive Y (+94k).
      // Adjustment: Multiply ALL Y-coordinates  by -1 to flip them.

      // --- ALLIES GUNS ---
      { label: "", id: "US_A1", gameX: 1972.95, gameY: 91307.24, radius: 500, team: "us", type: "point" }, 
      { label: "", id: "US_A2", gameX: 2864.32, gameY: 91026.45, radius: 500, team: "us", type: "point" }, 
      { label: "", id: "US_A3", gameX: 3538.50, gameY: 91394.53, radius: 500, team: "us", type: "point" }, 

      // --- AXIS GUNS ---
      { label: "", id: "GER_A1", gameX: -7994.93, gameY: -94008.09, radius: 500, team: "ger", type: "point" }, 
      { label: "", id: "GER_A2", gameX: -6399.25, gameY: -93262.29, radius: 500, team: "ger", type: "point" }, 
      { label: "", id: "GER_A3", gameX: -4866.51, gameY: -94131.34, radius: 500, team: "ger", type: "point" },

      // NOTE: Sectors grouped by MapMeta InitialOwner, NOT by geographic position.

      // --- ALLIES SECTORS ---
      { label: "99TH COMMAND CENTRE", id: "B17", gameX: -39637.50, gameY: 67610.96, radius: 7500.0, team: "us", type: "strongpoint" },
      { label: "GUN BATTERY", id: "B18", gameX: 420.0, gameY: 69376.0, radius: 8000.0, team: "us", type: "strongpoint" },
      { label: "U.S. CAMP", id: "B16", gameX: 50979.02, gameY: 67675.0, radius: 7000.0, team: "us", type: "strongpoint" },
      { label: "ELSENBORN RIDGE", id: "B19", gameX: -30950.0, gameY: 41967.96, radius: 7000.0, team: "us", type: "strongpoint" },
      { label: "FARAHILDE FARM", id: "B20", gameX: 10158.0, gameY: 30210.0, radius: 8000.0, team: "us", type: "strongpoint" },
      { label: "JENSIT PILLBOXES", id: "B21", gameX: 49674.99, gameY: 28085.95, radius: 7000.0, team: "us", type: "strongpoint" },

      // --- NEUTRAL SECTORS ---
      { label: "ROAD TO ELSENBORN RIDGE", id: "B22", gameX: -40964.0, gameY: -3317.0, radius: 8000.0, team: "neu", type: "strongpoint" },
      { label: "DUGOUT TANKS", id: "B23", gameX: -9124.0, gameY: -2404.0, radius: 6000.0, team: "neu", type: "strongpoint" },
      { label: "CHECKPOINT", id: "B25", gameX: 40444.91, gameY: -6529.14, radius: 5000.0, team: "neu", type: "strongpoint" },

      // --- AXIS SECTORS ---
      { label: "ERELSDELL FARMHOUSE", id: "B24", gameX: -41672.0, gameY: -38246.0, radius: 8000.0, team: "ger", type: "strongpoint" },
      { label: "AA BATTERY", id: "B27", gameX: 8607.68, gameY: -33127.07, radius: 7000.0, team: "ger", type: "strongpoint" },
      { label: "HINTERBERG", id: "B26", gameX: 39637.23, gameY: -39888.69, radius: 8000.0, team: "ger", type: "strongpoint" },
      { label: "SUPPLY CACHE", id: "B29", gameX: -25666.0, gameY: -66300.0, radius: 5000.0, team: "ger", type: "strongpoint" },
      { label: "FOXHOLES", id: "B28", gameX: 12223.86, gameY: -67172.27, radius: 7000.0, team: "ger", type: "strongpoint" },
      { label: "FUEL DEPOT", id: "B30", gameX: 38049.76, gameY: -70408.04, radius: 7000.0, team: "ger", type: "strongpoint" }
    ],
  },
  MOR: { 
    name: "Mortain", 
    image: "images/maps/TacMap_MOR_L_1944.webp", 
    thumbnail: "images/maps/thumbnail/MOR.webp", 
    teams: { t1: "UNITED STATES", t2: "GERMANY" },
    
    // --- DIMENSIONS FROM FModel LayoutMeta DATA ---
    // Source: MOR_L_LayoutMeta (MapLayoutMetaDataAsset)
    // SectorWidth: 40000.0 units × MapWidth: 5 sectors = 200,000 units = 2000m
    // Calculation: 2000m × 100 units/meter = 200,000 units total
    // Bounds: -100,000 to +100,000 units (centered at origin)
    // 
    // Verified: This matches Elsenborn Ridge pattern (5 sectors × 40,000 units = 2000m)
    // Game coordinate system: 1 unit = 1 cm, so 100 units = 1 meter
    // This size provides accurate distance calculations matching in-game values
    bounds: {
      minX: -100000,
      maxX: 100000,
      minY: -100000,
      maxY: 100000
    },
    
    // US guns on west point east (90°), GER guns on east point west (-90°)
    gunRotations: { "us": 90, "ger": -90 },
    
    guns: ["Gun 1 (North)", "Gun 2 (Middle)", "Gun 3 (South)"],
    strongpoints: [
      // --- STRONGPOINTS (OBJECTIVES) ---
      // Names: MOR_WarfareMeta (GameModeMetaDataAsset) -> SectorDefinitions[].Name.SourceString
      // Locations/Radii: SphereSectorCaptureBooster_01..15 -> TriggerShape (SphereComponent) -> RelativeLocation / SphereRadius
      // Y coordinates inverted from FModel (multiply by -1) to match map image orientation
      // Team mapping: ETeam::Allies → "us", ETeam::Axis → "ger", ETeam::None → "neu"

      // Booster_01
      { label: "HOTEL DE LA POSTE", id: "B1", gameX: -71664.03, gameY: 47217.445, radius: 5000.0, team: "us", type: "strongpoint" },
      // Booster_02
      { label: "FORWARD BATTERY", id: "B2", gameX: -67949.4, gameY: -6438.873, radius: 6500.0, team: "us", type: "strongpoint" },
      // Booster_03
      { label: "SOUTHERN APPROACH", id: "B3", gameX: -70344.09, gameY: -46402.33, radius: 7500.0, team: "neu", type: "strongpoint" },
      // Booster_04
      { label: "MORTAIN OUTSKIRTS", id: "B4", gameX: -49136.977, gameY: 39819.566, radius: 6000.0, team: "ger", type: "strongpoint" },
      // Booster_05
      { label: "FORWARD MEDICAL AID STATION", id: "B5", gameX: -35275.574, gameY: 2194.1567, radius: 7000.0, team: "ger", type: "strongpoint" },
      // Booster_06
      { label: "MORTAIN APPROACH", id: "B6", gameX: -42775.5, gameY: -33050.027, radius: 7000.0, team: "us", type: "strongpoint" },
      // Booster_07
      { label: "HILL 314", id: "B7", gameX: -2425.1055, gameY: 38259.5, radius: 7000.0, team: "us", type: "strongpoint" },
      // Booster_08
      { label: "LA PETITE CHAPELLE SAINT-MICHEL", id: "B8", gameX: 1725.2772, gameY: -5918.17, radius: 5000.0, team: "neu", type: "strongpoint" },
      // Booster_09
      { label: "U.S. SOUTHERN ROADBLOCK", id: "B9", gameX: -11254.05, gameY: -49076.438, radius: 7000.0, team: "ger", type: "strongpoint" },
      // Booster_10
      { label: "DESTROYED GERMAN CONVOY", id: "B10", gameX: 35469.836, gameY: 42255.99, radius: 8000.0, team: "ger", type: "strongpoint" },
      // Booster_11
      { label: "GERMAN RECON CAMP", id: "B11", gameX: 40439.145, gameY: 2510.7285, radius: 6000.0, team: "us", type: "strongpoint" },
      // Booster_12
      { label: "LES AUBRILS FARM", id: "B12", gameX: 48018.547, gameY: -26619.574, radius: 6000.0, team: "us", type: "strongpoint" },
      // Booster_13
      { label: "ABANDONED GERMAN CHECKPOINT", id: "B13", gameX: 68651.26, gameY: 40271.47, radius: 6500.0, team: "neu", type: "strongpoint" },
      // Booster_14
      { label: "GERMAN DEFENSIVE CAMP", id: "B14", gameX: 68294.46, gameY: -1986.8845, radius: 7000.0, team: "ger", type: "strongpoint" },
      // Booster_15
      { label: "LE FERME DU DESCHAMPS", id: "B15", gameX: 71327.67, gameY: -36841.695, radius: 7000.0, team: "ger", type: "strongpoint" },

      // --- US GUNS (WEST) ---
      // Y coordinates inverted from FModel (multiply by -1) to match map image orientation
      // Sorted by Y descending (North to South) after inversion
      // Spawner6 (most north), Spawner5, Spawner4 (most south)
      { label: "", id: "US_A1", gameX: -88315.72, gameY: 6495.1196, radius: 500, team: "us", type: "point" }, 
      { label: "", id: "US_A2", gameX: -88402.46, gameY: 7784.2734, radius: 500, team: "us", type: "point" }, 
      { label: "", id: "US_A3", gameX: -88551.5, gameY: 8780.766, radius: 500, team: "us", type: "point" }, 

      // --- GERMAN GUNS (EAST) ---
      // Y coordinates inverted from FModel (multiply by -1) to match map image orientation
      // Sorted by Y descending (North to South) after inversion
      // Spawner4 (most north), Spawner5, Spawner6 (most south)
      { label: "", id: "GER_A1", gameX: 90334.24, gameY: 2615.621, radius: 500, team: "ger", type: "point" }, 
      { label: "", id: "GER_A2", gameX: 90170.0, gameY: 4075.0, radius: 500, team: "ger", type: "point" }, 
      { label: "", id: "GER_A3", gameX: 90346.56, gameY: 5372.948, radius: 500, team: "ger", type: "point" }
    ]
  },
SMO: { 
    name: "Smolensk", 
    image: "images/maps/TacMap_SMO_L_1943.webp", 
    thumbnail: "images/maps/thumbnail/SMO.webp", 
    teams: { t1: "SOVIET UNION", t2: "GERMANY" },
    
    // Confirmed 2000m based on data spread
    widthMeters: 2000, 
    heightMeters: 2000, 
    
    // Soviets (East) face West (270), Germans (West) face East (90)
    gunRotations: { "us": 270, "ger": 90 },
    gunSort: "y", 

    guns: ["Gun 1 (North)", "Gun 2 (Middle)", "Gun 3 (South)"],
    strongpoints: [
      // NOTE: Y-Coordinates Inverted.
      // Map is West (Left/Ger) to East (Right/Sov).
      // North = Positive Inverted Y (Top)
      // South = Negative Inverted Y (Bottom)

      // --- AXIS SECTORS (West - Negative X) ---
      // GER Base (Far West)
      { label: "PANZER LOADING STATION", id: "SMO_GER_Base1", gameX: -68850.08, gameY: 40044.95, radius: 7000.0, team: "ger", type: "strongpoint" }, // Booster 16 (Top/North)
      { label: "TRAM DEPOT", id: "SMO_GER_Base2", gameX: -67850.08, gameY: 5084.95, radius: 7000.0, team: "ger", type: "strongpoint" }, // Booster 21 (Mid)
      { label: "SMOLENSK OUTSKIRTS", id: "SMO_GER_Base3", gameX: -68850.08, gameY: -40680.05, radius: 6500.0, team: "ger", type: "strongpoint" }, // Booster 26 (Bottom/South)

      // GER Mid (Mid-West)
      { label: "SMOLENSK HAUPTBAHNHOF", id: "SMO_GER_Mid1", gameX: -38450.08, gameY: 40044.95, radius: 7000.0, team: "ger", type: "strongpoint" }, // Booster 17 (Top/North)
      { label: "LUMBER YARD", id: "SMO_GER_Mid2", gameX: -36050.08, gameY: -8915.05, radius: 9000.0, team: "ger", type: "strongpoint" }, // Booster 22 (Mid - Large Radius)
      { label: "DNIEPER WEST CROSSING", id: "SMO_GER_Mid3", gameX: -40450.08, gameY: -39680.05, radius: 7000.0, team: "ger", type: "strongpoint" }, // Booster 27 (Bottom/South)

      // --- NEUTRAL SECTORS (Center - Near X=0) ---
      { label: "PYATNITSKII OVERPASS", id: "SMO_Mid1", gameX: 1000.0, gameY: 38544.95, radius: 6500.0, team: "neu", type: "strongpoint" }, // Booster 18 (Top/North)
      { label: "ZHELYABOVA SQUARE", id: "SMO_Mid2", gameX: 1000.0, gameY: 0.0, radius: 6500.0, team: "neu", type: "strongpoint" }, // Booster 23 (Mid)
      { label: "84TH BATTALION BRIDGE", id: "SMO_Mid3", gameX: 1000.0, gameY: -40680.05, radius: 6000.0, team: "neu", type: "strongpoint" }, // Booster 28 (Bottom/South)

      // --- SOVIET SECTORS (East - Positive X) ---
      // SOV Mid (Mid-East)
      { label: "ZADNEPROVIE DISTRICT", id: "SMO_SOV_Mid1", gameX: 39264.92, gameY: 40444.95, radius: 6500.0, team: "us", type: "strongpoint" }, // Booster 19 (Top/North)
      { label: "MOSKOVSKAYA STREET", id: "SMO_SOV_Mid2", gameX: 39764.92, gameY: 1084.95, radius: 6500.0, team: "us", type: "strongpoint" }, // Booster 24 (Mid)
      { label: "SMOLENSK CITADEL", id: "SMO_SOV_Mid3", gameX: 39264.92, gameY: -40680.05, radius: 7000.0, team: "us", type: "strongpoint" }, // Booster 29 (Bottom/South)

      // SOV Base (Far East)
      { label: "RAILYARD STORAGE", id: "SMO_SOV_Base1", gameX: 68709.92, gameY: 40044.95, radius: 7000.0, team: "us", type: "strongpoint" }, // Booster 20 (Top/North)
      { label: "APARTMENT BLOCK", id: "SMO_SOV_Base2", gameX: 69209.92, gameY: 1084.95, radius: 7000.0, team: "us", type: "strongpoint" }, // Booster 25 (Mid)
      { label: "BOMBARDED RIVERFRONT", id: "SMO_SOV_Base3", gameX: 69209.92, gameY: -40080.05, radius: 7000.0, team: "us", type: "strongpoint" }, // Booster 30 (Bottom/South)

      // --- GUN POSITIONS ---
      // SOVIETS (East - Positive X)
      { label: "", id: "SOV_A1", gameX: 98300.0, gameY: 670.0, radius: 500, team: "us", type: "point" }, 
      { label: "", id: "SOV_A2", gameX: 98300.0, gameY: 2000.0, radius: 500, team: "us", type: "point" }, 
      { label: "", id: "SOV_A3", gameX: 98300.0, gameY: 3525.0, radius: 500, team: "us", type: "point" }, 

      // GERMANS (West - Negative X)
      { label: "", id: "GER_A1", gameX: -98800.0, gameY: -1505.0, radius: 500, team: "ger", type: "point" }, 
      { label: "", id: "GER_A2", gameX: -98800.0, gameY: 570.0, radius: 500, team: "ger", type: "point" }, 
      { label: "", id: "GER_A3", gameX: -98800.0, gameY: 2695.0, radius: 500, team: "ger", type: "point" }
    ] 
  },
TOB: {
    name: "Tobruk",
    image: "images/maps/TacMap_TOB_L_1942.webp",
    thumbnail: "images/maps/thumbnail/TOB.webp",
    teams: { t1: "BRITISH 8TH ARMY", t2: "GERMANY" },

    widthMeters: 2016, // Standard HLL Map Width
    heightMeters: 2016,

    gunSort: "y",
    gunRotations: { "us": 0, "ger": 180 },

    guns: ["Gun 1 (North)", "Gun 2 (Middle)", "Gun 3 (South)"],
    strongpoints: [
      // --- AXIS GUNS (Germany) ---
      // Inverted Ys. Sorted North (Highest Y) -> South (Lowest Y)
      { label: "", id: "GER_A3", gameX: -92423.66, gameY: -5152.503, radius: 500, team: "ger", type: "point" },  // North
      { label: "", id: "GER_A2", gameX: -93282.37, gameY: -5983.347, radius: 500, team: "ger", type: "point" },  // Mid
      { label: "", id: "GER_A1", gameX: -92338.164, gameY: -7535.631, radius: 500, team: "ger", type: "point" }, // South

      // --- ALLIES GUNS (British) ---
      // Inverted Ys. Sorted North (Highest Y) -> South (Lowest Y)
      { label: "", id: "GB_A3", gameX: 93126.9, gameY: 7690.272, radius: 500, team: "us", type: "point" },    // North
      { label: "", id: "GB_A2", gameX: 92639.85, gameY: 5926.3613, radius: 500, team: "us", type: "point" },   // Mid
      { label: "", id: "GB_A1", gameX: 93045.516, gameY: 1597.4238, radius: 500, team: "us", type: "point" },  // South

      // --- AXIS SECTORS (Col 1 & 2) ---
      { label: "GUARD ROOM", id: "B1", gameX: -68855.0, gameY: 27530.0, radius: 7000.0, team: "ger", type: "strongpoint" },
      { label: "TANK GRAVEYARD", id: "B2", gameX: -69405.0, gameY: 2075.0, radius: 8000.0, team: "ger", type: "strongpoint" },
      { label: "DIVISION HEADQUARTERS", id: "B3", gameX: -69835.0, gameY: -45005.0, radius: 7000.0, team: "ger", type: "strongpoint" },
      { label: "WEST CREEK", id: "B4", gameX: -40077.0, gameY: 44015.0, radius: 8000.0, team: "ger", type: "strongpoint" },
      { label: "ALBERGO RISTORANTE MODERNO", id: "B5", gameX: -29536.5, gameY: -2241.0, radius: 7000.0, team: "ger", type: "strongpoint" },
      { label: "KING SQUARE", id: "B6", gameX: -29485.1, gameY: -39744.3, radius: 8000.0, team: "ger", type: "strongpoint" },

      // --- NEUTRAL SECTORS (Col 3) ---
      { label: "DESERT RAT CAVES", id: "B7", gameX: 31.2, gameY: 39665.2, radius: 8000.0, team: "neu", type: "strongpoint" },
      { label: "CHURCH GROUNDS", id: "B8", gameX: 59.9, gameY: -11770.0, radius: 7000.0, team: "neu", type: "strongpoint" },
      { label: "ADMIRALTY HOUSE", id: "B9", gameX: 7919.4, gameY: -48901.8, radius: 9000.0, team: "neu", type: "strongpoint" },

      // --- ALLIES SECTORS (Col 4 & 5) ---
      { label: "ABANDONED AMMO CACHE", id: "B10", gameX: 39687.5, gameY: 39659.9, radius: 8000.0, team: "us", type: "strongpoint" },
      { label: "8TH ARMY MEDICAL HOSPITAL", id: "B11", gameX: 40124.0, gameY: 2845.0, radius: 9000.0, team: "us", type: "strongpoint" },
      { label: "SUPPLY DUMP", id: "B12", gameX: 39820.5, gameY: -43918.3, radius: 9000.0, team: "us", type: "strongpoint" },
      { label: "ROAD TO SENUSSI MINE", id: "B13", gameX: 69522.8, gameY: 40790.0, radius: 7000.0, team: "us", type: "strongpoint" },
      { label: "MAKESHIFT AID STATION", id: "B14", gameX: 69380.0, gameY: -25.0, radius: 9000.0, team: "us", type: "strongpoint" },
      { label: "CARGO WAREHOUSES", id: "B15", gameX: 70047.3, gameY: -41171.9, radius: 8000.0, team: "us", type: "strongpoint" }
    ],
  },
HUR: {
    name: "Hürtgen Forest",
    image: "images/maps/map_hurtgen.webp", // Verify filename
    thumbnail: "images/maps/thumbnail/HUR.webp",
    teams: { t1: "UNITED STATES", t2: "GERMANY" },

    widthMeters: 1984,
    heightMeters: 1984,

    gunSort: "y",
    gunRotations: { us: 90, ger: -90 },

    guns: ["Gun 1 (North)", "Gun 2 (Middle)", "Gun 3 (South)"],
    strongpoints: [
      // --- AXIS GUNS (Germany) ---
      // Inverted Ys. Sorted North (Highest Y) -> South (Lowest Y)
      { label: "", id: "GER_A3", gameX: 91198.0, gameY: -10428.0, radius: 500, team: "ger", type: "point" }, // North
      { label: "", id: "GER_A2", gameX: 91198.0, gameY: -11227.0, radius: 500, team: "ger", type: "point" }, // Mid
      { label: "", id: "GER_A1", gameX: 91198.0, gameY: -11963.0, radius: 500, team: "ger", type: "point" }, // South

      // --- ALLIES GUNS (United States) ---
      // Inverted Ys. Sorted North (Highest Y) -> South (Lowest Y)
      { label: "", id: "US_A3", gameX: -92088.86, gameY: 4955.032, radius: 500, team: "us", type: "point" },  // North
      { label: "", id: "US_A2", gameX: -93577.97, gameY: 3982.9868, radius: 500, team: "us", type: "point" },  // Mid
      { label: "", id: "US_A1", gameX: -92188.766, gameY: 2897.9956, radius: 500, team: "us", type: "point" },  // South

      // --- ALLIES SECTORS (Col 1 & 2) ---
      { label: "LUMBER YARD", id: "B1", gameX: -77356.0, gameY: -36029.0, radius: 4000.0, team: "us", type: "strongpoint" }, // Booster 9 (Scale 4.0 * 1000)
      { label: "RESERVE STATION", id: "B2", gameX: -78776.0, gameY: -2238.0, radius: 4500.0, team: "us", type: "strongpoint" }, // Booster 11 (Scale 4.5 * 1000)
      { label: "MAUSBACH APPROACH", id: "B3", gameX: -74423.0, gameY: 46733.0, radius: 4625.0, team: "us", type: "strongpoint" }, // Booster 20 (Scale 4.625 * 1000)
      { label: "THE RUIN", id: "B4", gameX: -42793.0, gameY: -26141.0, radius: 4400.0, team: "us", type: "strongpoint" }, // Booster 7 (Scale 5.5 * Explicit 800)
      { label: "KALL TRAIL", id: "B5", gameX: -35755.0, gameY: -2459.0, radius: 6000.0, team: "us", type: "strongpoint" }, // Booster 13 (Scale 6.0 * 1000)
      { label: "WEHEBACH OVERLOOK", id: "B6", gameX: -38278.0, gameY: 34416.0, radius: 5031.25, team: "us", type: "strongpoint" }, // Booster 19 (Scale 5.03125 * 1000)

      // --- NEUTRAL SECTORS (Col 3) ---
      { label: "THE SIEGFRIED LINE", id: "B7", gameX: -3711.0, gameY: -42305.0, radius: 4500.0, team: "neu", type: "strongpoint" }, // Booster 31 (Scale 4.5 * 1000)
      { label: "THE SCAR", id: "B8", gameX: -6935.0, gameY: -3328.0, radius: 3015.0, team: "neu", type: "strongpoint" }, // Booster 3 (Scale 2.25 * Explicit 1340)
      { label: "NORTH PASS", id: "B9", gameX: 6540.0, gameY: 49329.0, radius: 4347.0, team: "neu", type: "strongpoint" }, // Booster 17 (Scale 3.25 * Explicit 1337)

      // --- AXIS SECTORS (Col 4 & 5) ---
      { label: "SALIENT 42", id: "B10", gameX: 40632.0, gameY: -50244.0, radius: 3250.0, team: "ger", type: "strongpoint" }, // Booster 26 (Scale 3.25 * 1000)
      { label: "JACOB'S BARN", id: "B11", gameX: 37658.0, gameY: -8531.0, radius: 3500.0, team: "ger", type: "strongpoint" }, // Booster 15 (Scale 3.5 * 1000)
      { label: "HILL 15", id: "B12", gameX: 45628.0, gameY: 34330.0, radius: 4500.0, team: "ger", type: "strongpoint" }, // Booster 22 (Scale 4.5 * 1000)
      { label: "LOGGING CAMP", id: "B13", gameX: 64477.0, gameY: -51502.0, radius: 3750.0, team: "ger", type: "strongpoint" }, // Booster 28 (Scale 3.75 * 1000)
      { label: "HURTGEN APPROACH", id: "B14", gameX: 67776.0, gameY: -6558.0, radius: 3500.0, team: "ger", type: "strongpoint" }, // Booster 1 (Scale 3.5 * 1000)
      { label: "GROSSHAU APPROACH", id: "B15", gameX: 73663.0, gameY: 38895.0, radius: 3750.0, team: "ger", type: "strongpoint" }  // Booster 24 (Scale 3.75 * 1000)
    ],
  },
};

// ==========================================
// VISUAL MAP SELECTOR (MODAL LOGIC)
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
  if(closeBtn) {
      // Handle both click and touch for responsiveness
      closeBtn.addEventListener("click", (e) => {
          e.preventDefault(); 
          closeMapSelector();
          if (searchInput) {
            searchInput.value = ""; 
            renderMapGrid(""); // Reset grid for next opening
          }
      });
      closeBtn.addEventListener("touchstart", (e) => {
          e.preventDefault(); // Prevent ghost clicks
          closeMapSelector();
          if (searchInput) {
            searchInput.value = ""; 
            renderMapGrid(""); // Reset grid for next opening
          }
      }, { passive: false });
  }

  // --- NEW BUTTONS ---
  const btnManual = document.getElementById("btnManualCalc");
  if (btnManual) {
      btnManual.addEventListener("click", () => {
          closeMapSelector(); // Close map selector
          openManualCalculator(); // Open new calc
      });
  }
}

// --- OPTIMIZED MAP SELECTOR LOGIC ---

// Helper to track if the grid is currently showing all maps
let isGridFull = false; 

function renderMapGrid(filter = "") {
  const grid = document.getElementById("mapGrid");
  if (!grid) return;
  
  // OPTIMIZATION: If we are asking for a full grid ("") and it's already full, STOP.
  // This prevents the "Double Render" that kills your thumbnails.
  if (filter === "" && isGridFull && grid.hasChildNodes()) {
    return; 
  }

  grid.innerHTML = ""; // Clear existing

  // --- 1. NORMALIZE SEARCH TERM ---
  const cleanFilter = filter
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const sortedKeys = Object.keys(MAP_DATABASE).sort((a, b) => {
    return MAP_DATABASE[a].name.localeCompare(MAP_DATABASE[b].name);
  });

  sortedKeys.forEach(key => {
    const mapData = MAP_DATABASE[key];
    
    // --- 2. NORMALIZE MAP NAME ---
    const cleanName = mapData.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    
    // Search check
    if (cleanFilter && !cleanName.includes(cleanFilter)) {
      return; 
    }
    
    // Card Construction
    const card = document.createElement("div");
    card.className = "map-card";
    if (key === activeMapKey) card.classList.add("active");
    
    card.onclick = () => selectMapFromGrid(key);

    // --- LOCATE THIS INSIDE sortedKeys.forEach block ---
    const img = document.createElement("img");
    img.className = "map-card-img";
    
    // START WITH EMPTY SRC & HIDDEN (Preloader will fill this)
    img.src = ""; 
    img.style.opacity = "0"; 
    img.style.transition = "opacity 0.2s ease-in";
    
    img.loading = "eager"; 
    img.alt = mapData.name;
    // ----------------------------------------------------

    const label = document.createElement("div");
    label.className = "map-card-name";
    label.innerText = mapData.name;

    card.appendChild(img);
    card.appendChild(label);
    grid.appendChild(card);
  });

  // Update flag: If filter was empty, we now have a full grid built.
  isGridFull = (filter === "");
}

function openMapSelector() {
  // Only render if we need to reset a search, otherwise keep the pre-loaded grid
  const searchInput = document.getElementById("mapSearchInput");
  if (searchInput && searchInput.value !== "") {
      searchInput.value = "";
      renderMapGrid(""); 
  } else {
      // If no search input, ensure grid is populated but don't wipe it if it's there
      renderMapGrid(""); 
  }
  
  document.getElementById("mapModal").classList.add("active");
}

function closeMapSelector() {
  document.getElementById("mapModal").classList.remove("active");
}

function selectMapFromGrid(key) {
  switchMap(key);
  closeMapSelector();
  saveState(); // Auto-save when map changes
  
  // Update Button Text
  const lbl = document.getElementById("currentMapName");
  if(lbl) lbl.innerText = MAP_DATABASE[key].name;
  
  // Re-render to update border
  renderMapGrid();
}

function switchMap(mapKey) {
  if (!MAP_DATABASE[mapKey]) return;

  showLoading();
  
  // --- FIX: RESET TARGET DATA HERE ---
  activeTarget = null; 
  // -----------------------------------

  activeMapKey = mapKey;
  const config = MAP_DATABASE[mapKey];
  
  // Correctly update the global variable
  currentStrongpoints = config.strongpoints;
  
  // Update faction UI with new team names
  updateFactionUI(config);
  updateGunUI(config);

  const imgElement = document.getElementById('mapImage');
  imgElement.style.opacity = 0; 

  setTimeout(() => {
    imgElement.alt = `${config.name} Map`;

    imgElement.onload = function() {
      document.title = `HLL Artillery - ${config.name}`;
      initMap(); 
      render();  
      imgElement.style.opacity = 1; 
      hideLoading(); 
    };

    imgElement.src = config.image;
  }, 100);
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
  
  // GB / British
  if (lower === "gb" || lower.includes("british") || lower.includes("8th")) {
      return "images/flags/gb.webp";
  }

  // Soviet / Russian
  if (lower === "rus" || lower === "sov" || lower.includes("soviet") || lower.includes("rus")) {
      return "images/flags/rus.webp";
  }

  // German / Axis
  if (lower === "ger" || lower.includes("germany") || lower.includes("axis") || lower.includes("afrika")) {
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
    item1.querySelector('.item-text').innerText = t1Label;
    item1.querySelector('.item-flag').src = t1Flag;
  }
  if (item2) {
    item2.querySelector('.item-text').innerText = t2Label;
    item2.querySelector('.item-flag').src = t2Flag;
  }

  // 4. THE FIX: Force the main button to show the map-specific name
  const mainLabel = document.getElementById("factionLabel");
  const mainFlag = document.getElementById("currentFactionFlag");

  if (mainLabel && mainFlag) {
    // If activeFaction is 'us' (Team 1), use Team 1's specific name for this map
    if (activeFaction === 'us' || activeFaction === 'allies') {
      mainLabel.innerText = t1Label;
      mainFlag.src = t1Flag;
    } else {
      mainLabel.innerText = t2Label;
      mainFlag.src = t2Flag;
    }
  }
}

// ==========================================
// GUN UI UPDATES
// ==========================================
function updateGunUI(config) {
  const gunNames = config.guns || ["Gun 1 (Left)", "Gun 2 (Mid)", "Gun 3 (Right)"];
  const gunDropdown = document.getElementById("gunDropdown");
  const menu = gunDropdown.querySelector('.dropdown-menu');
  const label = document.getElementById("gunLabel");
  
  // Prevent invalid gun index after map switch
  if (activeGunIndex >= gunNames.length) {
    activeGunIndex = 0;
  }
  
  menu.innerHTML = "";
  
  gunNames.forEach((name, index) => {
    const item = document.createElement("div");
    item.className = "dropdown-item";
    item.setAttribute("data-value", index);
    item.innerText = name;
    
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      label.innerText = name;
      menu.classList.add('hidden');
      document.getElementById("gunBtn").classList.remove('active');
      
      // 1. Update Active Gun
      activeGunIndex = index;
      
      // 2. RECALCULATE TARGETING (The Fix)
      if (activeTarget) {
          const gunPos = getActiveGunCoords();
          if (gunPos) {
              const factionLabel = document.getElementById("factionLabel").innerText;
              
              // --- SIMPLE MATH FIX (Center to Center) ---
              const dx = activeTarget.gameX - gunPos.x;
              const dy = activeTarget.gameY - gunPos.y;
              
              const distanceUnits = Math.sqrt(dx*dx + dy*dy);
              const rawDistanceMeters = distanceUnits / GAME_UNITS_PER_METER;
              
              const correctedDistance = Math.round(rawDistanceMeters);
              
              // Get new MILs
              const newMil = getMil(correctedDistance, factionLabel);
              
              // Update Target Data
              activeTarget.distance = correctedDistance;
              activeTarget.mil = newMil;
          }
      }
      
      // --- CORRECT ORDER IS CRITICAL ---
      renderMarkers();   // 1. Clear layer & update Gun Rotation
      renderTargeting(); // 2. Draw Targeting Data (Red line/Circles)
      render();          // 3. Refresh view
    });
    
    menu.appendChild(item);
  });

  // Ensure activeGunIndex is within bounds, but don't reset to 0 unnecessarily
  if (activeGunIndex >= gunNames.length) {
    activeGunIndex = Math.min(activeGunIndex, gunNames.length - 1);
  }
  label.innerText = gunNames[activeGunIndex];
}

function setupDropdown(containerId, buttonId, labelId, onSelect) {
  const container = document.getElementById(containerId);
  const btn = document.getElementById(buttonId);
  
  if (!container || !btn) return;

  const menu = container.querySelector('.dropdown-menu');
  const items = container.querySelectorAll('.dropdown-item');

  // Toggle Menu on Button Click
  btn.addEventListener('click', (e) => {
    e.stopPropagation(); 
    const isCurrentlyOpen = !menu.classList.contains('hidden');
    
    // Reset all
    document.querySelectorAll('.dropdown-menu').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.btn-map-select').forEach(el => el.classList.remove('active'));

    if (!isCurrentlyOpen) {
      menu.classList.remove('hidden');
      btn.classList.add('active');
    }
  });

  // Handle Item Click
  items.forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const value = item.getAttribute('data-value');
      
      // Close Menu
      menu.classList.add('hidden');
      btn.classList.remove('active');
      
      // Trigger the selection logic (this calls the function in initArtyControls)
      onSelect(value);
    });
  });
}

function initArtyControls() {
  // 1. Setup Faction Dropdown
  setupDropdown('factionDropdown', 'factionBtn', 'factionLabel', (value) => {
    if (activeFaction !== value) {
      activeFaction = value;
      activeTarget = null;
      
      // THE FIX: Refresh the UI labels so "us" becomes "British 8th Army" etc.
      updateFactionUI(MAP_DATABASE[activeMapKey]); 
      
      renderMarkers(); 
      renderTargeting(); 
      render();
      saveState();
    }
  });

  // 2. Setup Gun Dropdown
  setupDropdown('gunDropdown', 'gunBtn', 'gunLabel', (value) => {
    activeGunIndex = parseInt(value);
    renderMarkers(); 
    render(); 
    saveState(); // Auto-save when gun changes
  });

  // 3. Setup Ruler Toggle
  const rulerToggleBtn = document.getElementById('rulerToggleBtn');
  if (rulerToggleBtn) {
    // Flag to prevent double-triggering on Firefox mobile
    let rulerTouchHandled = false;

      const handleRuler = (e) => {
      // If we are currently handling a touch, ignore follow-up click
      if (e.type === 'click' && rulerTouchHandled) {
        return;
      }

      e.preventDefault(); // Stops button from firing twice or zooming
      e.stopPropagation(); // Stops click from passing through to map

      if (e.cancelable && e.type === 'touchstart') {
        e.preventDefault();
        rulerTouchHandled = true;
        // Reset flag after a short delay
        setTimeout(() => { rulerTouchHandled = false; }, 300);
      }
      
      // Toggle state
      rulerEnabled = !rulerEnabled;
      rulerToggleBtn.classList.toggle('active', rulerEnabled);
      
      // THE FIX: Remove focus so it doesn't stay in a "pseudo-active" state
      rulerToggleBtn.blur(); 
      
      renderTargeting();
      saveState();
    };

    rulerToggleBtn.addEventListener('click', handleRuler);
    rulerToggleBtn.addEventListener('touchstart', handleRuler, { passive: false });
    
    // Set initial state from loaded settings
    rulerToggleBtn.classList.toggle('active', rulerEnabled);
  }

  // 4. Setup HUD Toggle (Robust Mobile Fix)
  const hudToggleBtn = document.getElementById('hudToggleBtn');
  if (hudToggleBtn) {
      let hudTouchHandled = false;
      let hudTouchTimeout = null;

      const handleHud = (e) => {
          // --- 1. GATEKEEPER LOGIC ---
          // If this is a 'click' that happened right after a 'touchstart', IGNORE it.
          if (e.type === 'click' && hudTouchHandled) {
              e.preventDefault();
              e.stopPropagation();
              return;
          }

          // If this is 'touchstart', set the flag to block the upcoming ghost click
          if (e.type === 'touchstart') {
              hudTouchHandled = true;
              if (hudTouchTimeout) clearTimeout(hudTouchTimeout);
              // Reset flag after 500ms (enough time for the ghost click to pass)
              hudTouchTimeout = setTimeout(() => { 
                  hudTouchHandled = false; 
              }, 500);
          }
          
          // Prevent browser zooming or map panning underneath
          if (e.cancelable) e.preventDefault();
          e.stopPropagation();
          
          // --- UPDATED LOGIC START ---
          hudEnabled = !hudEnabled; // Toggle Global Variable
          
          // Use the global sync function to handle ALL visibility (Desktop Rings + Mobile HUD)
          syncToggleUI(); 
          
          // Force button focus off
          hudToggleBtn.blur(); 
          // --- UPDATED LOGIC END ---
          
          // Force render to update text values immediately
          render(); 
          saveState(); 
      };
      
      hudToggleBtn.addEventListener('click', handleHud);
      hudToggleBtn.addEventListener('touchstart', handleHud, { passive: false });

      // --- FIX: APPLY SAVED STATE ON LOAD ---
      // 1. Update Button Visual
      hudToggleBtn.classList.toggle('active', hudEnabled);

      // 2. Update UI Elements Visibility
      const hudEl = document.getElementById("liveCursorHud");
      const crosshair = document.getElementById("mobileCrosshair");
      const fireBtn = document.getElementById("mobileFireBtn");
      const isMobile = window.innerWidth <= 768;

      if (hudEnabled) {
          if (hudEl) hudEl.classList.remove("hidden");
          if (isMobile) {
              if (crosshair) crosshair.classList.remove("hidden");
              if (fireBtn) fireBtn.classList.remove("hidden");
          }
      } else {
          if (hudEl) hudEl.classList.add("hidden");
          if (crosshair) crosshair.classList.add("hidden");
          if (fireBtn) fireBtn.classList.add("hidden");
      }
  }

  // 3. Global Click Listener (Close menus when clicking outside)
  window.addEventListener('click', () => {
    // Hide all menus
    document.querySelectorAll('.dropdown-menu').forEach(el => {
      el.classList.add('hidden');
    });
    // Reset all arrows
    document.querySelectorAll('.btn-map-select').forEach(el => {
      el.classList.remove('active');
    });
  });

  // 5. Setup Sidebar Calculator Button
  const sidebarCalcBtn = document.getElementById("sidebarCalcBtn");
  if (sidebarCalcBtn) {
      const handleOpenCalc = (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Visual Feedback (Press animation)
          sidebarCalcBtn.classList.add("pressed");
          setTimeout(() => sidebarCalcBtn.classList.remove("pressed"), 150);

          openManualCalculator();
      };

      sidebarCalcBtn.addEventListener("click", handleOpenCalc);
      sidebarCalcBtn.addEventListener("touchstart", handleOpenCalc, { passive: false });
  }

  // 4. Fix Keypad Events
  fixKeypadEvents();
}

// ==========================================
// SAVE STATE FUNCTIONALITY
// ==========================================

function saveState() {
  const controlsDrawer = document.getElementById("controlsDrawer");
  
  // CLEAN SAVE: Only saves Map, Faction, Gun, and Toggle Buttons.
  // NO Pan/Zoom, NO Manual Calculator settings.
  const stateToSave = {
    activeMapKey: activeMapKey,
    activeFaction: activeFaction,
    activeGunIndex: activeGunIndex,
    manualCalcFaction: manualCalcFaction,
    panelHidden: controlsDrawer ? controlsDrawer.classList.contains("closed") : false,
    rulerEnabled: rulerEnabled,
    hudEnabled: hudEnabled,
    timestamp: Date.now()
  };
  
  try {
    localStorage.setItem('hllArtyCalculatorState', JSON.stringify(stateToSave));
  } catch (error) {
    // Silently handle save errors
  }
}

function loadState() {
  try {
    const savedState = localStorage.getItem('hllArtyCalculatorState');
    if (!savedState) return null;
    
    const loaded = JSON.parse(savedState);
    
    // FAILSAFE: If the saved map doesn't exist anymore, abort load
    if (!MAP_DATABASE[loaded.activeMapKey]) return null;
    
    // RESTORE VARIABLES
    activeMapKey = loaded.activeMapKey;
    activeFaction = loaded.activeFaction || 'us';
    activeGunIndex = loaded.activeGunIndex || 0;
    manualCalcFaction = loaded.manualCalcFaction || 'us';
    rulerEnabled = loaded.rulerEnabled !== undefined ? loaded.rulerEnabled : true;
    hudEnabled = loaded.hudEnabled !== undefined ? loaded.hudEnabled : false;
    
    // Restore Panel State
    window.savedPanelHidden = loaded.panelHidden || false;
    
    // NOTE: We do NOT restore zoom/pan. initMap() will center the map cleanly.
    
    return true; 
  } catch (error) {
    return null;
  }
}

function clearSavedState() {
  try {
    localStorage.removeItem('hllArtyCalculatorState');
  } catch (error) {
    // Silently handle clear errors
  }
}

// ==========================================
// 6. EXECUTION START
// ==========================================
createStickyLabels();
initMapSelector();

// 1. Load data from local storage
loadState();

// 2. CRITICAL FIX: DATA RESTORATION
// Ensure we actually have the map data loaded before we try to render
if (!MAP_DATABASE[activeMapKey]) {
  activeMapKey = "CAR"; // Fallback safety
}

// Set the strongpoints array so renderMarkers() has something to draw
currentStrongpoints = MAP_DATABASE[activeMapKey].strongpoints || [];

// Update the header text and dropdown menus to match the loaded map
const currentMapLbl = document.getElementById("currentMapName");
if (currentMapLbl) {
  currentMapLbl.innerText = MAP_DATABASE[activeMapKey].name;
}
updateFactionUI(MAP_DATABASE[activeMapKey]);
updateGunUI(MAP_DATABASE[activeMapKey]);

// 3. Setup listeners (Now that UI elements are ready)
initArtyControls();

// 4. Force UI to match loaded variables (Ruler/HUD buttons)
syncToggleUI(); 

// 5. Handle first-time visit (No save found)
if (localStorage.getItem('hllArtyCalculatorState') === null) {
  openMapSelector();
}

// 6. Load Map Image and Start Rendering
const imgEl = document.getElementById("mapImage");
const onInitLoad = function() {
  initMap();   // This calls renderMarkers(), which now has data!
  render();
  syncToggleUI(); 
  hideLoading();
};

// Set image source and trigger load
imgEl.src = MAP_DATABASE[activeMapKey].image;
if (imgEl.complete) {
  onInitLoad();
} else {
  imgEl.onload = onInitLoad;
}

new ResizeObserver(() => { updateDimensions(); render(); }).observe(mapContainer);
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
  const clickX = e.clientX - rect.left - state.pointX;
  const clickY = e.clientY - rect.top - state.pointY;
  
  const effectiveZoom = state.scale * state.fitScale;
  const rawImgX = clickX / effectiveZoom;
  const rawImgY = clickY / effectiveZoom;

  const mapImage = document.getElementById("mapImage");
  const w = mapImage.naturalWidth;
  const h = mapImage.naturalHeight;
  
  // Game Coordinates
  const targetPos = imagePixelsToGame(rawImgX, rawImgY, w, h);

  // Check Boundaries
  if (targetPos.x < GAME_LEFT || targetPos.x > GAME_RIGHT || 
      targetPos.y < GAME_BOTTOM || targetPos.y > GAME_TOP) {
      return; 
  }

  const gunPos = getActiveGunCoords();
  if (!gunPos) {
      return;
  }

  // --- SIMPLE MATH FIX (Center to Center) ---
  const dx = targetPos.x - gunPos.x;
  const dy = targetPos.y - gunPos.y;
  
  const distanceUnits = Math.sqrt(dx*dx + dy*dy);
  const rawDistanceMeters = distanceUnits / GAME_UNITS_PER_METER;
  
  const correctedDistance = Math.round(rawDistanceMeters);
  const factionLabel = document.getElementById("factionLabel").innerText;
  const mil = getMil(correctedDistance, factionLabel);

  activeTarget = {
    gameX: targetPos.x,
    gameY: targetPos.y,
    distance: correctedDistance, 
    mil: mil
  };

  renderMarkers();    
  renderTargeting();  
  render();           
});

// --- 3. WHEEL ZOOM ---
mapContainer.addEventListener("wheel", (e) => {
  e.preventDefault();
  mapStage.classList.remove("zoom-transition");
  mapStage.style.transition = "none";
  
  const direction = e.deltaY > 0 ? -1 : 1;
  let rawZoom = currentZoomLevel + (direction * ZOOM_STEP);
  let newZoom = Math.round(rawZoom * 10) / 10;

  if (newZoom < MIN_ZOOM) newZoom = MIN_ZOOM;
  if (newZoom > MAX_ZOOM) newZoom = MAX_ZOOM;

  if (newZoom === currentZoomLevel) return;

  const rect = mapContainer.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  
  setZoomLevel(newZoom, mouseX, mouseY);
  
  if (window.zoomTimeout) clearTimeout(window.zoomTimeout);
  window.zoomTimeout = setTimeout(() => {
    mapStage.style.transition = ""; 
    mapStage.classList.add("zoom-transition");
  }, 10);
}, { passive: false });

// --- 4. PANNING LOGIC (DESKTOP) ---
mapContainer.addEventListener("mousedown", (e) => {
  e.preventDefault();
  
  // Stop animations for instant dragging
  mapStage.classList.remove("zoom-transition");
  mapStage.style.transition = "none";
  
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

mapContainer.addEventListener("touchstart", (e) => {
  mapStage.classList.remove("zoom-transition");
  mapStage.style.transition = "none";

  if (e.touches.length === 1) {
    state.panning = true;
    isDragging = false;
    
    // Record Start for Threshold check
    dragStartX = e.touches[0].clientX;
    dragStartY = e.touches[0].clientY;

    state.startX = e.touches[0].clientX - state.pointX;
    state.startY = e.touches[0].clientY - state.pointY;
  } else if (e.touches.length === 2) {
    state.panning = false; 
    initialPinchDistance = getPinchDistance(e);
    lastZoomScale = state.scale;
  }
}, { passive: false });

mapContainer.addEventListener("touchmove", (e) => {
  if (e.cancelable) e.preventDefault(); 

  if (e.touches.length === 1 && state.panning) {
    // Check Threshold
    const moveDist = Math.hypot(e.touches[0].clientX - dragStartX, e.touches[0].clientY - dragStartY);
    
    if (!isDragging && moveDist > DRAG_THRESHOLD) {
        isDragging = true;
    }

    // FIX: Only move if confirmed dragging
    if (isDragging) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  } 
  else if (e.touches.length === 2 && initialPinchDistance) {
    // Pinch Zoom Logic
    isDragging = true; // Pinch always counts as drag
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
        setZoomLevel(newZoom, mouseX, mouseY);
        isRendering = false;
      });
    }
  }
}, { passive: false });

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
document.addEventListener("touchstart", function(){}, true);

// --- 6. ESCAPE KEY TO CLEAR TARGET ---
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    // Only act if there is currently a target selected
    if (activeTarget) {
      activeTarget = null; // Clear target data
      
      // Update visual states
      renderMarkers();     // Resets gun rotation (stops pointing at target)
      renderTargeting();   // Removes red line/circles AND hides the panel
      render();            // Refreshes the map
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
  window.updateZoomSliderUI = function() {
    const range = MAX_ZOOM - MIN_ZOOM;
    const progress = (state.scale - MIN_ZOOM) / range;
    const percentage = Math.max(0, Math.min(1, progress)) * 100;

    handle.style.bottom = `${percentage}%`;
    fill.style.height = `${percentage}%`;
  };

  // --- 2. HANDLE DRAG LOGIC ---
  let isDraggingSlider = false;
  let sliderFrame = null; 
  let trackRect = null;
  let containerRect = null;

  function startSliderDrag() {
    isDraggingSlider = true;
    trackRect = track.getBoundingClientRect();
    containerRect = mapContainer.getBoundingClientRect();
    mapStage.classList.remove("zoom-transition");
    mapStage.style.transition = "none";
  }

  function updateZoomFromSlider(clientY) {
    if (!trackRect || !containerRect) return; 
    let val = (trackRect.bottom - clientY) / trackRect.height;
    val = Math.max(0, Math.min(1, val));
    const newZoom = MIN_ZOOM + (val * (MAX_ZOOM - MIN_ZOOM));
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;
    setZoomLevel(newZoom, centerX, centerY);
  }

  // --- MOUSE EVENTS ---
  track.addEventListener("mousedown", (e) => {
    startSliderDrag();
    updateZoomFromSlider(e.clientY);
  });

  window.addEventListener("mousemove", (e) => {
    if (isDraggingSlider) {
      e.preventDefault();
      if (!sliderFrame) {
        sliderFrame = requestAnimationFrame(() => {
          updateZoomFromSlider(e.clientY);
          sliderFrame = null;
        });
      }
    }
  });

  window.addEventListener("mouseup", () => {
    isDraggingSlider = false;
    if (sliderFrame) {
        cancelAnimationFrame(sliderFrame);
        sliderFrame = null;
    }
    mapStage.style.transition = ""; 
    mapStage.classList.add("zoom-transition");
  });

  // --- TOUCH EVENTS ---
  track.addEventListener("touchstart", (e) => {
    startSliderDrag();
    updateZoomFromSlider(e.touches[0].clientY);
  }, { passive: false });

  window.addEventListener("touchmove", (e) => {
    if (isDraggingSlider) {
      if (e.cancelable) e.preventDefault(); 
      if (!sliderFrame) {
        sliderFrame = requestAnimationFrame(() => {
          updateZoomFromSlider(e.touches[0].clientY);
          sliderFrame = null;
        });
      }
    }
  }, { passive: false });

  window.addEventListener("touchend", () => {
    isDraggingSlider = false;
    if (sliderFrame) {
        cancelAnimationFrame(sliderFrame);
        sliderFrame = null;
    }
    mapStage.style.transition = ""; 
    mapStage.classList.add("zoom-transition");
  });

  // --- 3. BUTTONS (ANIMATION FIX) ---
  
  // Helper to manually trigger the CSS animation class
  function triggerAnim(btn) {
      if (!btn) return;
      btn.classList.add("pressed");
      setTimeout(() => btn.classList.remove("pressed"), 150);
  }

  // Track touch handling to prevent duplicate click events on Firefox mobile
  let touchHandled = false;
  let touchTimeout = null;

  function handleZoomIn(e) {
      // Prevent ghost clicks on touch, but trigger manual animation
      if (e.cancelable && e.type === 'touchstart') {
          e.preventDefault();
          touchHandled = true;
          
          // Clear existing timeout and set new one to reset flag
          if (touchTimeout) clearTimeout(touchTimeout);
          touchTimeout = setTimeout(() => {
              touchHandled = false;
          }, 300);
      } else if (e.type === 'click' && touchHandled) {
          // If this click follows a handled touch, prevent duplicate execution
          e.preventDefault();
          return;
      }
      
      triggerAnim(e.currentTarget); // <--- Animation Trigger
      
      const rect = mapContainer.getBoundingClientRect();
      setZoomLevel(state.scale + 1, rect.width/2, rect.height/2);
  }

  function handleZoomOut(e) {
      // Prevent ghost clicks on touch, but trigger manual animation
      if (e.cancelable && e.type === 'touchstart') {
          e.preventDefault();
          touchHandled = true;
          
          // Clear existing timeout and set new one to reset flag
          if (touchTimeout) clearTimeout(touchTimeout);
          touchTimeout = setTimeout(() => {
              touchHandled = false;
          }, 300);
      } else if (e.type === 'click' && touchHandled) {
          // If this click follows a handled touch, prevent duplicate execution
          e.preventDefault();
          return;
      }
      
      triggerAnim(e.currentTarget); // <--- Animation Trigger
      
      const rect = mapContainer.getBoundingClientRect();
      setZoomLevel(state.scale - 1, rect.width/2, rect.height/2);
  }

  if (btnIn) {
    btnIn.addEventListener("click", handleZoomIn);
    btnIn.addEventListener("touchstart", handleZoomIn, { passive: false });
  }

  if (btnOut) {
    btnOut.addEventListener("click", handleZoomOut);
    btnOut.addEventListener("touchstart", handleZoomOut, { passive: false });
  }
}

// Initialize
initZoomControls();

// Apply panel hidden state immediately when DOM is ready (early as possible)
document.addEventListener('DOMContentLoaded', function() {
  const controlsDrawer = document.getElementById("controlsDrawer");
  const toggleBtn = document.getElementById("drawerToggleBtn");
  
  if (controlsDrawer) {
    if (window.savedPanelHidden) {
      // Apply hidden state immediately
      controlsDrawer.classList.add("closed");
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
          
          // Update aria-expanded attribute for accessibility
          const isClosed = drawer.classList.contains("closed");
          toggleBtn.setAttribute("aria-expanded", isClosed ? "false" : "true");
          
          // --- THE FIX: Update global state immediately ---
          // This ensures that if you switch maps later, initMap() knows 
          // the panel is currently OPEN and won't force it closed.
          window.savedPanelHidden = isClosed;
          
          // Safety: Close dropdowns if we minimize
          if (drawer.classList.contains("closed")) {
               document.querySelectorAll('.dropdown-menu').forEach(el => el.classList.add('hidden'));
               document.querySelectorAll('.btn-map-select').forEach(el => el.classList.remove('active'));
          }
           
          // Save panel state
          saveState();
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

// UNIVERSAL FACTION TOGGLE (Strict Cycle with Debounce)
const factionToggleBtn = document.getElementById("calcFactionToggle");
let isToggleCooldown = false; // Debounce flag

if (factionToggleBtn) {
    // Helper function to handle cycle safely
    const cycleFaction = (e) => {
        // Prevent rapid-fire clicks (Debounce for 200ms)
        if (isToggleCooldown) return;
        isToggleCooldown = true;
        setTimeout(() => { isToggleCooldown = false; }, 200);

        // Prevent default browser behaviors (zoom, selection)
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
      case "ger": name = "GERMANY"; break;
      case "rus": name = "SOVIET UNION"; break;
      case "gb":  name = "ALLIES"; break;
      default:    name = "UNITED STATES"; break;
  }
  
  lbl.innerText = name;
  img.src = flagPath;
}

// --- Keypad Logic (Fast & Clean) ---
window.inputDigit = function(num) {
  if (calcInputVal.length >= 4) return; 
  if (calcInputVal === "0") calcInputVal = ""; 
  calcInputVal += num;
  updateCalcScreen();
};

window.clearInput = function() {
  calcInputVal = "0";
  updateCalcScreen();
};

window.backspaceInput = function() {
  if (calcInputVal.length > 1) {
    calcInputVal = calcInputVal.slice(0, -1);
  } else {
    calcInputVal = "0";
  }
  updateCalcScreen();
};

function fixKeypadEvents() {
  const keys = document.querySelectorAll('.calc-keypad .key');
  
  // GLOBAL GATEKEEPER: Tracks the last time a finger touched ANY key.
  let lastTouchTime = 0;

  keys.forEach(key => {
      // 1. Extract the intended action from the HTML
      const rawAction = key.getAttribute('onclick');
      if (!rawAction) return; 

      // 2. Kill the inline handler immediately
      key.onclick = null;           
      key.removeAttribute('onclick'); 

      // 3. Define the logic to run
      const executeLogic = () => {
          if (rawAction.includes('inputDigit')) {
              const match = rawAction.match(/\d+/);
              if (match) window.inputDigit(match[0]);
          } else if (rawAction.includes('clearInput')) {
              window.clearInput();
          } else if (rawAction.includes('backspaceInput')) {
              window.backspaceInput();
          }
      };

      // 4. TOUCH LISTENER (Primary for Mobile)
      // This runs INSTANTLY. No delay. Allows fast typing.
      key.addEventListener('touchstart', (e) => {
          // Update the global timer
          lastTouchTime = Date.now();

          // Try to stop the ghost click physically
          if (e.cancelable) e.preventDefault(); 
          
          // Visual Feedback
          key.classList.add('pressed'); 
          setTimeout(() => key.classList.remove('pressed'), 100);
          
          executeLogic();
      }, { passive: false });

      // 5. CLICK LISTENER (Fallback for Desktop)
      key.addEventListener('click', (e) => {
          // GATEKEEPER CHECK:
          // If a touch happened recently (< 500ms), this 'click' is a ghost. BLOCK IT.
          const now = Date.now();
          if (now - lastTouchTime < 500) {
              e.preventDefault();
              e.stopPropagation();
              return; 
          }
          executeLogic();
      });
  });
}

function updateCalcScreen() {
  const display = document.getElementById("calcInput");
  if (display) display.innerText = calcInputVal + "m";
  calculateManual();
}

function calculateManual() {
  const dist = parseInt(calcInputVal);
  const milEl = document.getElementById("calcMil");
  
  // REMOVED: const timeEl = ... 
  
  if (!milEl) return;

  // Validate Range
  if (!dist || dist < 100 || dist > 1600) {
    milEl.innerText = "---";
    milEl.className = "res-value text-red"; 
    return;
  }
  
  // Pass the strict code to getMilFromTable
  const mils = getMilFromTable(dist, manualCalcFaction);
  
  milEl.className = "res-value text-yellow";
  milEl.innerText = mils;
  
  // REMOVED: timeEl updates
}

// --- LIVE HUD MOUSE TRACKING & RINGS ---
document.addEventListener("mousemove", (e) => {
    if (!hudEnabled) return;
    if (window.innerWidth <= 768) return; 
    
    // 1. Move HUD Text Box
    const hudEl = document.getElementById("liveCursorHud");
    if (hudEl) {
        hudEl.style.left = (e.clientX + 20) + "px";
        hudEl.style.top = (e.clientY + 20) + "px";
    }

    // 2. Move Desktop Rings (Position Only)
    const ringsEl = document.getElementById("desktopCursorRings");
    if (ringsEl) {
        ringsEl.style.left = e.clientX + "px";
        ringsEl.style.top = e.clientY + "px";
        // We removed sizing calc here because render() + updateDesktopRingScale() handles it now!
    }

    // ... Rest of your existing calculation logic ...
    const rect = mapContainer.getBoundingClientRect();
    
    // Check bounds
    if (e.clientX < rect.left || e.clientX > rect.right || 
        e.clientY < rect.top || e.clientY > rect.bottom) {
        return;
    }

    const clickX = e.clientX - rect.left - state.pointX;
    const clickY = e.clientY - rect.top - state.pointY;
    
    const effectiveZoom = state.scale * state.fitScale;
    const rawImgX = clickX / effectiveZoom;
    const rawImgY = clickY / effectiveZoom;

    const mapImage = document.getElementById("mapImage");
    const w = mapImage.naturalWidth;
    const h = mapImage.naturalHeight;
    
    const targetPos = imagePixelsToGame(rawImgX, rawImgY, w, h);
    const gunPos = getActiveGunCoords();

    // Update Text Data
    if (gunPos) {
        const dx = targetPos.x - gunPos.x;
        const dy = targetPos.y - gunPos.y;
        const dist = Math.round(Math.sqrt(dx*dx + dy*dy) / GAME_UNITS_PER_METER);
        
        const factionLabel = document.getElementById("factionLabel").innerText;
        const mil = getMil(dist, factionLabel);
        
        document.getElementById("hudDist").innerText = dist + "m";
        document.getElementById("hudMil").innerText = mil !== null ? mil : "---";
    }
    
    document.getElementById("hudGrid").innerText = getGridRef(targetPos.x, targetPos.y);
});

// --- NEW: Mobile HUD Logic ---

function updateMobileHud() {
  // Only run if HUD is enabled and we are on mobile
  if (!hudEnabled || window.innerWidth > 768) return;

  const mapImage = document.getElementById("mapImage");
  const rect = mapContainer.getBoundingClientRect();
  
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
  // We scale the container to the largest circle (Dispersion: 40m Diameter)
  const dispersionDiameterMeters = 40; 
  const containerSize = pixelsPerMeter * dispersionDiameterMeters;  
  const containerEl = document.getElementById("mobileRingContainer");
  if (containerEl) {
      containerEl.style.width = `${containerSize}px`;
      containerEl.style.height = `${containerSize}px`;
  }

  // --- 3. Update HUD Text (Existing Logic) ---
  const targetPos = imagePixelsToGame(rawImgX, rawImgY, w, h);
  const gunPos = getActiveGunCoords();

  if (gunPos) {
      const dx = targetPos.x - gunPos.x;
      const dy = targetPos.y - gunPos.y;
      const dist = Math.round(Math.sqrt(dx*dx + dy*dy) / GAME_UNITS_PER_METER);
      
      const factionLabel = document.getElementById("factionLabel").innerText;
      const mil = getMil(dist, factionLabel);
      
      const hudDist = document.getElementById("hudDist");
      const hudMil = document.getElementById("hudMil");
      
      if (hudDist) hudDist.innerText = dist + "m";
      if (hudMil) hudMil.innerText = mil !== null ? mil : "---";
  }
  
  const hudGrid = document.getElementById("hudGrid");
  if (hudGrid) hudGrid.innerText = getGridRef(targetPos.x, targetPos.y);
}

// --- NEW: Mobile Fire Logic (Fixed Center Calculation) ---
function fireAtCenter() {
  const mapImage = document.getElementById("mapImage");
  const w = mapImage.naturalWidth;
  const h = mapImage.naturalHeight;
  
  // Get exact map container dimensions and position
  const rect = mapContainer.getBoundingClientRect();

  // Calculate the VISUAL center of the container (where the crosshair is)
  // This is relative to the container's top-left corner
  const visualCenterX = rect.width / 2;
  const visualCenterY = rect.height / 2;

  // Convert visual center to raw image coordinates (before zoom/pan)
  // Logic: (VisualCenter - PanOffset) / CurrentZoom
  const effectiveZoom = state.scale * state.fitScale;
  const rawImgX = (visualCenterX - state.pointX) / effectiveZoom;
  const rawImgY = (visualCenterY - state.pointY) / effectiveZoom;

  // Convert to Game Coords
  const targetPos = imagePixelsToGame(rawImgX, rawImgY, w, h);

  // --- STANDARD SHOOTING LOGIC (Copied from Click Handler) ---
  const gunPos = getActiveGunCoords();
  if (!gunPos) return; // Safety check

  const dx = targetPos.x - gunPos.x;
  const dy = targetPos.y - gunPos.y;
  
  const distanceUnits = Math.sqrt(dx*dx + dy*dy);
  const rawDistanceMeters = distanceUnits / GAME_UNITS_PER_METER;
  const correctedDistance = Math.round(rawDistanceMeters);
  
  const factionLabel = document.getElementById("factionLabel").innerText;
  const mil = getMil(correctedDistance, factionLabel);

  activeTarget = {
    gameX: targetPos.x,
    gameY: targetPos.y,
    distance: correctedDistance, 
    mil: mil
  };

  renderMarkers();    
  renderTargeting();  
  render();           
}

// ==========================================
// 6. EXECUTION START & PRELOAD
// ==========================================

// 1. Build the Grid nodes immediately (Invisible until images arrive)
renderMapGrid(""); 

// 2. Optimized Preload & Reveal Logic
(function preloadAndReveal() {
    const allThumbnails = document.querySelectorAll('.map-card-img');
    
    Object.keys(MAP_DATABASE).forEach(key => {
        const mapData = MAP_DATABASE[key];
        const img = new Image();
        img.fetchPriority = "high"; 
        
        img.onload = () => {
            // Find the specific card image in the DOM and set its src now that it's cached
            allThumbnails.forEach(domImg => {
                if (domImg.alt === mapData.name) {
                    domImg.src = img.src;
                    domImg.style.opacity = "1"; // Fade in for smoothness
                }
            });
        };
        
        img.src = mapData.thumbnail || mapData.image;
    });
})(); 

// --- PROJECTS MODAL LOGIC ---

const btnOtherProjects = document.getElementById("btnOtherProjects");
const projectsModal = document.getElementById("projectsModal");
const closeProjectsBtn = document.getElementById("closeProjectsBtn");

if (btnOtherProjects && projectsModal) {
    // This stops it from opening GitHub directly
    btnOtherProjects.addEventListener("click", (e) => {
        e.preventDefault();
        projectsModal.classList.add("active");
    });

    closeProjectsBtn.onclick = () => {
        projectsModal.classList.remove("active");
    };

    // Close if clicking the dark background
    projectsModal.onclick = (e) => {
        if (e.target === projectsModal) projectsModal.classList.remove("active");
    };
}