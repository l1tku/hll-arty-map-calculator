// ==========================================
// 1. DATA & CONFIGURATION
// ==========================================

const APP_VERSION = "v1.1.3"; // <--- CHANGE THIS TO UPDATE EVERYWHERE

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
let rulerEnabled = false; // Ruler toggle state 
let hudEnabled = false; // NEW: HUD toggle state
let manualCalcFaction = "us"; // <--- MOVED HERE (Fixes the crash)
let currentStrongpoints = []; 
let labelCache = [];
let isRendering = false; 
let calcInputVal = ""; // Stores the string like "1250" 

// --- MOVE THESE HERE (Top of script) ---
let _lastMobDist = null;
let _lastMobMil = null;
let _lastMobGrid = null;

// DOM Elements
const mapContainer = document.getElementById("mapContainer");
const mapStage = document.getElementById("mapStage");
const zoomIndicator = document.getElementById("zoomIndicator");

// Function to open the Projects Hub Modal
function openProjectsModal() {
    const modal = document.getElementById('projectsModal');
    if (modal) {
        modal.classList.add('active');
    }
}

// Function to close the Projects Hub Modal
function closeProjectsModal() {
    const modal = document.getElementById('projectsModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Add event listener for the close button inside the modal
document.getElementById('closeProjectsBtn')?.addEventListener('click', closeProjectsModal);

// Optional: Close modal if clicking on the dark overlay
document.getElementById('projectsModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'projectsModal') closeProjectsModal();
});

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

// --- PINCH ZOOM HELPERS ---
function getPinchDistance(e) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

function getPinchCenter(e) {
    return {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2
    };
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

function toggleTransitions(enable) {
  const labelLayer = document.getElementById("labelLayer");
  if (enable) {
    mapStage.classList.add("zoom-transition");
    labelLayer?.classList.add("zoom-transition");
    mapStage.style.transition = "";
  } else {
    mapStage.classList.remove("zoom-transition");
    labelLayer?.classList.remove("zoom-transition");
    mapStage.style.transition = "none";
  }
}

function setZoomLevel(newLevel, mouseX = null, mouseY = null) {
  const prevZoom = getEffectiveZoom();
  // Update the global state immediately
  currentZoomLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newLevel));
  state.scale = currentZoomLevel;
  
  // Make sure we DON'T remove zoom-transition if we aren't dragging/panning
  if (!state.panning) {
      mapStage.classList.add("zoom-transition");
      // NEW: Sync labels
      document.getElementById("labelLayer")?.classList.add("zoom-transition"); 
  }
  
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

// === FIX #2: Sticky Labels using 2D Transform ===
function updateStickyLabels(currentDrawScale) {
  const mapImage = document.getElementById("mapImage");
  const w = mapImage.naturalWidth;
  const h = mapImage.naturalHeight;
  const stepX = (w / 10) * currentDrawScale; 
  const stepY = (h / 10) * currentDrawScale; 

  const isMobile = window.innerWidth <= 768;
  const padding = isMobile ? 15 : 30; 
  
  const stickyTopY = Math.max(state.pointY, 0);
  const stickyLeftX = Math.max(state.pointX, 0);

  let fontScale = 0.7 + ((state.scale - 1) * 0.15);
  if (fontScale > 1.0) fontScale = 1.0;

  for (let i = 0; i < 10; i++) {
    const el = document.getElementById(`label-col-${i}`);
    if (!el) continue;
    
    const colScreenX = state.pointX + (i * stepX);
    const finalX = colScreenX + padding;
    
    let finalY;
    if (i === 0) finalY = state.pointY + padding; 
    else finalY = stickyTopY + padding;    
    
    // FIX: Using translate (2D) instead of translate3d
    el.style.transform = `translate(${Math.round(finalX)}px, ${Math.round(finalY)}px) scale(${fontScale})`;
  }

  for (let i = 1; i < 10; i++) {
    const el = document.getElementById(`label-row-${i}`);
    if (!el) continue;
    
    const finalX = stickyLeftX + padding;
    const rowScreenY = state.pointY + (i * stepY);
    const finalY = rowScreenY + padding;
    
    // FIX: Using translate (2D) instead of translate3d
    el.style.transform = `translate(${Math.round(finalX)}px, ${Math.round(finalY)}px) scale(${fontScale})`;
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
  
  // 1. Clear existing
  markersLayer.innerHTML = ""; 
  labelCache = [];
  
  // 2. Create Fragment (Off-screen DOM) - PERFORMANCE OPTIMIZATION
  const fragment = document.createDocumentFragment();
  
  const mapImage = document.getElementById("mapImage");
  const w = mapImage.naturalWidth;
  const h = mapImage.naturalHeight;
  
  if (!currentStrongpoints) return;

  // Sorting Logic
  const mapConfig = MAP_DATABASE[activeMapKey];
  const sortMode = mapConfig ? mapConfig.gunSort : "y";
  const teamArty = currentStrongpoints.filter(p => p.team === activeFaction && p.type === 'point');
  
  if (sortMode === "x") {
      teamArty.sort((a, b) => a.gameX - b.gameX);
  } else {
      teamArty.sort((a, b) => b.gameY - a.gameY);
  }

  let activeGunEl = null;

  currentStrongpoints.forEach(point => {
    if (point.type === 'point' && point.team !== activeFaction) return; 

    const el = document.createElement("div");
    el.className = `marker ${point.team} ${point.type}`;
    
    let isActiveGun = false;
    
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
           // Dynamic Rotation
           const targetPos = gameToImagePixels(activeTarget.gameX, activeTarget.gameY, w, h);
           const dy = targetPos.y - pos.y; 
           const dx = targetPos.x - pos.x;
           let angle = Math.atan2(dy, dx) * (180 / Math.PI);
           angle += 90; 
           
           // CHANGE THIS LINE: Remove translateZ(0)
           img.style.transform = `rotate(${angle}deg) scaleX(-1)`;
       } else {
           // Static Rotation
           let baseRotation = 0; 
           const teamKey = point.team.toLowerCase(); 
           const isAxis = ["ger", "axis", "afrika", "rus", "soviet"].some(x => teamKey.includes(x));
           
           if (mapConfig && mapConfig.gunRotations) {
                const rotKey = isAxis ? "ger" : "us"; 
                const finalKey = mapConfig.gunRotations[teamKey] !== undefined ? teamKey : rotKey;
                baseRotation = mapConfig.gunRotations[finalKey];
                if (baseRotation === undefined) baseRotation = 0;
           } else {
               if (sortMode === "x") {
                   if (isAxis) baseRotation = -90; else baseRotation = 90;
               } else {
                   if (isAxis) baseRotation = 180; else baseRotation = 0;
               }
           }
           
           // CHANGE THIS LINE: Remove translateZ(0)
           img.style.transform = `rotate(${baseRotation}deg) scaleX(-1)`;
       }
        el.appendChild(img);
    } 
    else if (point.type === 'strongpoint') {
       const dims = getMapDimensions();
       const pxPerMeter = (w / dims.width) * GAME_UNITS_PER_METER;
       const radiusPx = (point.radius / GAME_UNITS_PER_METER) * pxPerMeter;
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

    // Optimization: Add to fragment instead of DOM
    if (isActiveGun) {
        activeGunEl = el; 
    } else {
        fragment.appendChild(el);
    }
  });

  if (activeGunEl) {
      fragment.appendChild(activeGunEl);
  }

  // 3. Single Paint Operation
  markersLayer.appendChild(fragment);
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

// === FIX #1: Main Render Function using 2D Transform ===
function render() {
  clampPosition();
  const drawScale = state.scale * state.fitScale;
  
  mapContainer.style.setProperty('--current-scale', drawScale); 
  mapStage.style.setProperty('--effective-zoom', drawScale);
  
  // FIX: Replaced translate3d with translate to avoid Mobile GPU memory limits
  mapStage.style.transform = `translate(${state.pointX}px, ${state.pointY}px) scale(${drawScale})`;
  
  updateRealScale(drawScale);
  if (zoomIndicator) zoomIndicator.innerText = `${state.scale.toFixed(1)}x`;
  
  // --- LABEL SCALING & POSITIONING LOGIC ---
  const isMobile = window.innerWidth <= 768;
  const mobileScaleMultiplier = isMobile ? 2.5 : 1.0; 

  const TRANSITION_START_ZOOM = 1.0;
  const TRANSITION_END_ZOOM = 5.0;
  
  let progress = (state.scale - TRANSITION_START_ZOOM) / (TRANSITION_END_ZOOM - TRANSITION_START_ZOOM);
  progress = Math.max(0, Math.min(1, progress)); 

  // 1. Position
  const topVal = progress * 50; 
  // 2. Transform Y
  const transY = -100 + (progress * 50);
  // 3. Spacing Gap
  const gap = -20 + (progress * 20);
  // 4. Arrow Opacity
  const arrowOp = Math.max(0, 1 - (progress * 1.6));

  // 5. TEXT SIZE SMOOTHING
  // Use a lower exponent (0.7) on desktop to keep labels larger at high zoom
  const exponent = isMobile ? 0.85 : 0.6; 
  const smoothInverse = 1.0 / Math.pow(state.scale, exponent);
  const finalScale = smoothInverse * mobileScaleMultiplier;

  for (let i = 0; i < labelCache.length; i++) {
      const label = labelCache[i];
      label.style.setProperty('--arrow-opacity', arrowOp);
      label.style.top = `${topVal}%`; 
      // Applying the updated scale
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
  
  updateMobileHud();
  updateDesktopRingScale(); 
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
  
  // FIX: Check naturalWidth to prevent "Stuck Zoom" bug on browser restore
  if (!mapImage.complete || mapImage.naturalWidth === 0) return;
  
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
    // --- NO OPACITY CODE HERE ---
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
      closeBtn.addEventListener("click", (e) => {
          e.preventDefault(); 
          closeMapSelector();
      });
      closeBtn.addEventListener("touchstart", (e) => {
          e.preventDefault();
          closeMapSelector();
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

// ==========================================
// IMPROVED MAP GRID RENDERING WITH DATASET
// ==========================================
let isGridFull = false;

function renderMapGrid(filter = "") {
    const grid = document.getElementById("mapGrid");
    if (!grid) return;
    const cleanFilter = filter.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

    // --- QUICK HIGHLIGHT ONLY (When no filter and grid already full) ---
    if (cleanFilter === "" && isGridFull && grid.hasChildNodes()) {
        grid.querySelectorAll('.map-card').forEach((card) => {
            const cardKey = card.dataset.mapKey || "";
            card.classList.toggle('active', cardKey === activeMapKey);
        });
        return;
    }

    // --- FULL REBUILD ---
    grid.innerHTML = "";
    const sortedKeys = Object.keys(MAP_DATABASE).sort((a, b) =>
        MAP_DATABASE[a].name.localeCompare(MAP_DATABASE[b].name)
    );

    sortedKeys.forEach(key => {
        const mapData = MAP_DATABASE[key];
        const cleanName = mapData.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
       
        if (cleanFilter !== "" && !cleanName.includes(cleanFilter)) return;
       
        const card = document.createElement("div");
        card.className = "map-card";
        card.dataset.mapKey = key; // <-- RELIABLE KEY STORAGE
        if (key === activeMapKey) card.classList.add('active');
       
        card.onclick = () => selectMapFromGrid(key);
       
        const img = document.createElement("img");
        img.className = "map-card-img";
        img.alt = mapData.name;
        
        // Use a simpler loading approach to prevent "stuck" hidden images
        const imgPath = mapData.thumbnail || mapData.image;
        img.src = imgPath; 
        
        // If image fails, show a fallback background color
        img.onerror = () => {
            img.style.display = 'none';
            card.style.background = '#222';
        };
       
        const label = document.createElement("div");
        label.className = "map-card-name";
        label.innerText = mapData.name;
       
        card.appendChild(img);
        card.appendChild(label);
        grid.appendChild(card);
    });
    
    isGridFull = (cleanFilter === "");
}

// ==========================================
// OPEN MAP SELECTOR - ALWAYS REFRESH HIGHLIGHT
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
// CLOSE MAP SELECTOR
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
//    → activeMapKey is set immediately on selection and saved before switchMap()
// 2. Map selection panel green highlight now appears correctly
//    → renderMapGrid("") is called after activeMapKey is updated
// 3. Flicker/text flicker when switching maps is eliminated
//    → Current map name, faction UI, gun UI, and strongpoints are updated immediately
//    → Fade-out/fade-in is smoother with proper transition handling
//    → Loading overlay stays until fully ready

function selectMapFromGrid(key) {
    closeMapSelector();

    // --- IMMEDIATE STATE UPDATE (Fixes save-on-refresh and text flicker) ---
    const config = MAP_DATABASE[key];
    if (!config) return;

    activeMapKey = key;
    currentStrongpoints = config.strongpoints || [];

    // Update header and dropdowns instantly so no old name shows during load
    const currentMapLbl = document.getElementById("currentMapName");
    if (currentMapLbl) currentMapLbl.innerText = config.name;

    updateFactionUI(config);
    updateGunUI(config);

    // Save the new map selection immediately
    saveState();

    // Highlight the selected card
    renderMapGrid("");

    // --- NOW SWITCH THE MAP IMAGE (Smooth fade) ---
    switchMap(key);
}

function switchMap(mapKey) {
    if (!MAP_DATABASE[mapKey]) return;

    const mapStage = document.getElementById("mapStage");
    const imgElement = document.getElementById('mapImage');
    const markersLayer = document.getElementById("markers");

    // 1. Fade out old map instantly
    if (mapStage) {
        mapStage.style.transition = "opacity 0.2s ease-out";
        mapStage.style.opacity = "0";
    }

    // Clear old markers immediately
    if (markersLayer) markersLayer.innerHTML = "";

    // Show loading overlay
    showLoading();

    const config = MAP_DATABASE[mapKey];

    // 2. Load new image
    imgElement.onload = function() {
        // Ensure correct state (in case of race conditions)
        activeMapKey = mapKey;
        currentStrongpoints = config.strongpoints || [];

        // Re-build grid and markers for new map dimensions
        buildGrid();
        initMap(); // Re-centers, re-builds sticky labels, etc.

        // Final render
        renderMarkers();
        renderTargeting();
        render();

        // Fade in new map
        if (mapStage) {
            mapStage.style.opacity = "1";
            // Restore smooth transitions
            setTimeout(() => {
                mapStage.style.transition = "opacity 0.3s ease-in-out, transform 0.05s ease-out";
            }, 50);
        }

        // Hide loading
        hideLoading();

        // Clean up handler
        imgElement.onload = null;
    };

    // Trigger load (even if cached, onload fires synchronously)
    imgElement.src = config.image;
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
      // If we have an active target, we must update its distance/mil relative to the NEW gun position
      if (activeTarget) {
          const gunPos = getActiveGunCoords();
          if (gunPos) {
              const factionLabel = document.getElementById("factionLabel").innerText;
              
              // Recalculate distance from NEW gun to OLD target
              const dx = activeTarget.gameX - gunPos.x;
              const dy = activeTarget.gameY - gunPos.y;
              
              const distanceUnits = Math.sqrt(dx*dx + dy*dy);
              const rawDistanceMeters = distanceUnits / GAME_UNITS_PER_METER;
              
              const correctedDistance = Math.round(rawDistanceMeters);
              
              // Get new MILs
              const newMil = getMil(correctedDistance, factionLabel);
              
              // Update the target object
              activeTarget.distance = correctedDistance;
              activeTarget.mil = newMil;
          }
      }
      
      // 3. RENDER EVERYTHING IN ORDER
      renderMarkers();   // Draws guns (and rotates active gun to target)
      renderTargeting(); // Draws the red line and circles
      render();          // Updates scale/grid
      saveState();       // Save the new gun selection
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

  // 2. Setup Gun Dropdown (Toggle Only)
  // We do NOT use setupDropdown here because items are dynamic 
  // and handled entirely by updateGunUI(). We only need to toggle the menu.
  const gunBtn = document.getElementById('gunBtn');
  const gunMenu = document.querySelector('#gunDropdown .dropdown-menu');
  
  if (gunBtn && gunMenu) {
      gunBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const wasHidden = gunMenu.classList.contains('hidden');
          
          // 1. Close all other menus first
          document.querySelectorAll('.dropdown-menu').forEach(el => el.classList.add('hidden'));
          document.querySelectorAll('.btn-map-select').forEach(el => el.classList.remove('active'));

          // 2. Toggle this one
          if (wasHidden) {
              gunMenu.classList.remove('hidden');
              gunBtn.classList.add('active');
          }
      });
  }

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

  // 6. Setup Mobile Fire Button
  const mobileFireBtn = document.getElementById("mobileFireBtn");
  if (mobileFireBtn) {
      const handleFire = (e) => {
          e.preventDefault();
          e.stopPropagation(); // Stop zoom/pan
          
          // --- NEW: Add Heavier Vibration for Fire ---
          if (navigator.vibrate) navigator.vibrate(30); 
          // ------------------------------------------
          
          // Visual Feedback
          mobileFireBtn.classList.add("pressed");
          setTimeout(() => mobileFireBtn.classList.remove("pressed"), 150);
          
          fireAtCenter();
      };
      
      mobileFireBtn.addEventListener("touchstart", handleFire, { passive: false });
      mobileFireBtn.addEventListener("click", handleFire);
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
    rulerEnabled = loaded.rulerEnabled !== undefined ? loaded.rulerEnabled : false;
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

// --- 3. HIGH-SPEED SMOOTH WHEEL ZOOM ---
let isWheelThrottled = false;

mapContainer.addEventListener("wheel", (e) => {
  e.preventDefault();
  
  // 1. Kill transition for instant response during the scroll
  mapStage.classList.remove("zoom-transition");
  document.getElementById("labelLayer")?.classList.remove("zoom-transition");
  mapStage.style.transition = "none";

  if (!isWheelThrottled) {
    isWheelThrottled = true;
    
    requestAnimationFrame(() => {
      const direction = e.deltaY > 0 ? -1 : 1;
      
      // SPEED FIX: Increased from 0.2 to 0.8 for faster travel
      // This means 1 notch = 80% of a zoom level
      const SCROLL_SPEED = 0.8; 
      
      let newZoom = currentZoomLevel + (direction * SCROLL_SPEED);
      
      // Round to 2 decimals to keep math precise but clean
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

  // 2. The "Soft Landing" - Restores smoothness when you STOP scrolling
  clearTimeout(window.wheelStopTimeout);
  window.wheelStopTimeout = setTimeout(() => {
    mapStage.classList.add("zoom-transition");
    // NEW: Sync labels
    document.getElementById("labelLayer")?.classList.add("zoom-transition");
    mapStage.style.transition = ""; 
  }, 100); // Faster recovery time (100ms)
}, { passive: false });

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
mapContainer.addEventListener("touchstart", (e) => {
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

  function updateZoomFromEvent(e) {
    const rect = track.getBoundingClientRect();
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    // Calculate percentage from bottom of track
    let val = (rect.bottom - clientY) / rect.height;
    val = Math.max(0, Math.min(1, val));
    
    const newZoom = MIN_ZOOM + (val * (MAX_ZOOM - MIN_ZOOM));
    
    // Zoom into visual center of container
    const containerRect = mapContainer.getBoundingClientRect();
    setZoomLevel(newZoom, containerRect.width / 2, containerRect.height / 2);
  }

  // --- EVENTS ---
  const startDrag = (e) => {
    isDraggingSlider = true;
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
    mapStage.classList.add("zoom-transition");
  };

  // Track Listeners
  track.addEventListener("mousedown", startDrag);
  track.addEventListener("touchstart", startDrag, { passive: false });

  window.addEventListener("mousemove", (e) => { if(isDraggingSlider) updateZoomFromEvent(e); });
  window.addEventListener("touchmove", doDrag, { passive: false });

  window.addEventListener("mouseup", endDrag);
  window.addEventListener("touchend", endDrag);

  // --- 3. BUTTONS ---
  const handleBtn = (e, zoomDiff) => {
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();

    const btn = e.currentTarget;
    if (btn.classList.contains('pressed')) return;

    // 1. Ensure the transition class is ACTIVE
    mapStage.classList.add("zoom-transition");
    
    // 2. Feedback
    if (navigator.vibrate) navigator.vibrate(10);
    btn.classList.add("pressed");

    // 3. Calculation
    let newScale = state.scale + zoomDiff;
    newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale));

    const rect = mapContainer.getBoundingClientRect();
    
    // 4. Force the browser to process the zoom
    setZoomLevel(newScale, rect.width / 2, rect.height / 2);

    // 5. Cleanup the button state
    setTimeout(() => btn.classList.remove("pressed"), 150);
  };

  btnIn.addEventListener("touchstart", (e) => handleBtn(e, 1), { passive: false });
  btnOut.addEventListener("touchstart", (e) => handleBtn(e, -1), { passive: false });
  btnIn.addEventListener("click", (e) => handleBtn(e, 1));
  btnOut.addEventListener("click", (e) => handleBtn(e, -1));
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
  
  // Inject version number into UI elements
  const versionEl = document.getElementById('appVersion');
  if (versionEl) {
    versionEl.textContent = APP_VERSION;
  }
  
  const versionPanelEl = document.getElementById('appVersionPanel');
  if (versionPanelEl) {
    versionPanelEl.textContent = APP_VERSION;
  }
  
  // --- MANUAL CALCULATOR MODAL LOGIC ---
  
  const btnOpenManualCalc = document.getElementById('btnOpenManualCalc');
  const calcModal = document.getElementById('calcModal');
  const mapModal = document.getElementById('mapModal');

  if (btnOpenManualCalc && calcModal) {
    btnOpenManualCalc.addEventListener('click', (e) => {
      e.stopPropagation();
      calcModal.classList.add('active'); 
      
      // FORCE BLUR: Remove focus immediately so highlight doesn't stay
      btnOpenManualCalc.blur(); 
    });
  }

  // 2. Close Calculator specifically
  const closeCalcBtn = document.getElementById('closeCalcBtn');
  if (closeCalcBtn && calcModal) {
    const handleCloseCalc = (e) => {
      e.preventDefault();
      e.stopPropagation();
      calcModal.classList.remove('active');
      // Notice: We DO NOT touch mapModal here. 
      // If it was open, it stays open.
    };
    closeCalcBtn.addEventListener('click', handleCloseCalc);
    closeCalcBtn.addEventListener('touchstart', handleCloseCalc, { passive: false });
  }

  // 3. Overlay click for Calculator only
  if (calcModal) {
    calcModal.addEventListener('click', (e) => {
      if (e.target === calcModal) {
        calcModal.classList.remove('active');
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
          
          // --- NEW: Add Vibration ---
          if (navigator.vibrate) navigator.vibrate(15); 
          // --------------------------
          
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

// --- LIVE HUD MOUSE TRACKING & RINGS (OPTIMIZED) ---
let isHudUpdating = false; // Semaphore flag

document.addEventListener("mousemove", (e) => {
    if (!hudEnabled) return;
    if (window.innerWidth <= 768) return; 

    // Visuals: Move these instantly (CSS transforms are cheap)
    const hudEl = document.getElementById("liveCursorHud");
    const ringsEl = document.getElementById("desktopCursorRings");
    
    if (hudEl) {
        hudEl.style.left = (e.clientX + 20) + "px";
        hudEl.style.top = (e.clientY + 20) + "px";
    }
    if (ringsEl) {
        ringsEl.style.left = e.clientX + "px";
        ringsEl.style.top = e.clientY + "px";
    }

    // Heavy Math: Throttle this!
    if (!isHudUpdating) {
        isHudUpdating = true;
        
        requestAnimationFrame(() => {
            const rect = mapContainer.getBoundingClientRect();
            
            // Bounds Check
            if (e.clientX < rect.left || e.clientX > rect.right || 
                e.clientY < rect.top || e.clientY > rect.bottom) {
                isHudUpdating = false;
                return;
            }

            const clickX = e.clientX - rect.left - state.pointX;
            const clickY = e.clientY - rect.top - state.pointY;
            const effectiveZoom = state.scale * state.fitScale;
            
            const rawImgX = clickX / effectiveZoom;
            const rawImgY = clickY / effectiveZoom;

            const mapImage = document.getElementById("mapImage");
            if (mapImage) { // Safety check
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
            }
            
            isHudUpdating = false; // Release the lock
        });
    }
});

// --- NEW: Mobile HUD Logic ---

// Global cache vars moved to top of script to prevent initialization errors

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
  
  // Scale container to 40m Diameter
  const dispersionDiameterMeters = 40; 
  const containerSize = pixelsPerMeter * dispersionDiameterMeters;  
  const containerEl = document.getElementById("mobileRingContainer");
  if (containerEl) {
      containerEl.style.width = `${containerSize}px`;
      containerEl.style.height = `${containerSize}px`;
  }

  // --- 3. Update HUD Text (Optimized) ---
  const targetPos = imagePixelsToGame(rawImgX, rawImgY, w, h);
  const gunPos = getActiveGunCoords();

  if (gunPos) {
      const dx = targetPos.x - gunPos.x;
      const dy = targetPos.y - gunPos.y;
      const dist = Math.round(Math.sqrt(dx*dx + dy*dy) / GAME_UNITS_PER_METER);
      
      const factionLabel = document.getElementById("factionLabel").innerText;
      
      // OPTIMIZATION: Only calculate Mil if distance changed
      if (dist !== _lastMobDist) {
          const mil = getMil(dist, factionLabel);
          _lastMobMil = mil; // Update cache
          
          const hudMil = document.getElementById("hudMil");
          if (hudMil) {
              hudMil.innerText = (mil !== null) ? mil : "---";
          }

          const hudDist = document.getElementById("hudDist");
          if (hudDist) {
              hudDist.innerText = dist + "m";
          }
          _lastMobDist = dist;
      }
      
      // Handle case when no gun position is available
      if (!gunPos) {
          const hudMil = document.getElementById("hudMil");
          if (hudMil && hudMil.innerText !== "---") hudMil.innerText = "---";
      }
  }
  
  // Grid Ref optimization
  const gridRef = getGridRef(targetPos.x, targetPos.y);
  if (gridRef !== _lastMobGrid) {
      const hudGrid = document.getElementById("hudGrid");
      if (hudGrid) hudGrid.innerText = gridRef;
      _lastMobGrid = gridRef;
  }
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
// 6. EXECUTION START
// ==========================================

// Build initial UI
renderMapGrid(""); 

// Load saved data
loadState();

// 6. Load Map Image and Start Rendering
const imgEl = document.getElementById("mapImage");

const onInitLoadWithRetry = function() {
  // FIX: Loop until image has physical dimensions (Fixes "Stuck Zoom" on Reload)
  if (imgEl.naturalWidth === 0) {
      setTimeout(onInitLoadWithRetry, 50);
      return;
  }

  initMap(); 
  render();
  syncToggleUI(); 
  hideLoading();
};

// Set image source and trigger load
imgEl.src = MAP_DATABASE[activeMapKey].image;

if (imgEl.complete) {
  onInitLoadWithRetry();
} else {
  imgEl.onload = onInitLoadWithRetry;
}

// Ensure ResizeObserver doesn't trigger bad math if image isn't ready
new ResizeObserver(() => { 
    if (imgEl.naturalWidth > 0) {
        updateDimensions(); 
        render(); 
    }
}).observe(mapContainer);

// --- PROJECTS MODAL LOGIC ---

const btnOtherProjects = document.getElementById("btnOtherProjects");
const projectsModal = document.getElementById("projectsModal");
const closeProjectsBtn = document.getElementById("closeProjectsBtn");

if (btnOtherProjects && projectsModal) {
    btnOtherProjects.addEventListener("click", (e) => {
        e.preventDefault();
        projectsModal.classList.add("active");
        // Also blur the opening button immediately so it doesn't stick
        btnOtherProjects.blur(); 
    });

    const closeHub = () => {
        projectsModal.classList.remove("active");
        // THE FIX: When the modal closes, force the browser to forget 
        // focus on any button (prevents sticking grey/yellow)
        if (document.activeElement) {
            document.activeElement.blur();
        }
    };

    closeProjectsBtn.onclick = closeHub;

    // Close if clicking the dark background
    projectsModal.onclick = (e) => {
        if (e.target === projectsModal) closeHub();
    };
    
    // NEW: Target all buttons inside the hub to clear focus after clicking
    const hubButtons = projectsModal.querySelectorAll('.footer-btn');
    hubButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // We use a small timeout to ensure the link opens before we kill focus
            setTimeout(() => {
                btn.blur();
                // Safety: if the user came back and it's still focused
                if (document.activeElement === btn) btn.blur();
            }, 100);
        });
    });
}

// Add this inside your projects modal logic where you handle the button clicks
const hubButtons = projectsModal.querySelectorAll('.footer-btn');
hubButtons.forEach(btn => {
    btn.addEventListener('mousedown', () => {
        // This stops the focus from ever sticking in the first place
        setTimeout(() => btn.blur(), 0);
    });
    
    btn.addEventListener('click', () => {
        // Second safety check
        setTimeout(() => btn.blur(), 100);
    });
});

// Global reset when you switch back to the Artillery tab
window.onfocus = function() {
    document.querySelectorAll('button').forEach(b => b.blur());
};

// --- FORCE RESET ON TAB RETURN (Mobile Fix) ---
// This handles the "Back" button or switching tabs back to the app
window.addEventListener('pageshow', (event) => {
    // If the page was restored from cache (bfcache) or just shown
    if (event.persisted || document.visibilityState === 'visible') {
        // Kill focus on everything
        if (document.activeElement) {
            document.activeElement.blur();
        }
        // Double tap: Explicitly blur all footer buttons
        document.querySelectorAll('.footer-btn').forEach(btn => btn.blur());
    }
});