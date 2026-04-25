# HLL Artillery Map Calculator
**v1.3.0 — Updated for Hell Let Loose Update 19.1**

An interactive tactical map and high-precision artillery calculator for Hell Let Loose. Features dynamic scaling for all maps, manual calculator, visual trajectory aids, and a mobile-optimized targeting UI.

## Installation & Local Usage
### Option 1: Live Web Access (Recommended)
No installation required. Simply visit the [Live Demo Link](https://l1tku.github.io/hll-arty-map-calculator/) from any desktop or mobile browser.

### Option 2: Local Development
1. **Clone** or download this repository.
2. Open `index.html` in any modern web browser.

## Usage
### Method 1: Map Targeting
1. **Select Map**: Choose your map from the selector
2. **Configure Faction**: Select your Faction from the control panel (bottom)
3. **Select or Place Artillery**:
   - **HQ Guns**: Select Gun 1, 2, or 3 from the dropdown
   - **Custom Guns**: Click "+" to enter placement mode, then click on map (desktop) or tap PLACE (mobile)
4. **Aim**: Click on map to place target or use Live Tracking
5. **Result**: View firing solution in the data panel

**Custom Gun Management**: Click icon to select, right-click for Move/Delete menu. Mobile: remove from dropdown menu.

### Method 2: Manual Calculator
1. Click the Calculator Icon in the sidebar or within the Map Selection footer.
2. Select your faction.
3. Enter the distance using the keypad.
4. Get instant Elevation MILs.
5. Press **Enter** (desktop) or tap **SAVE** (mobile) to save calculation to history.
6. View recent calculations in the history log below the keypad.

## Map Controls
### Desktop
- **Left Click**: Place Target / Select Artillery.
- **Click & Drag**: Pan the map.
- **Mouse Wheel**: Zoom in/out.
- **Hover**: View live distance and grid reference in the HUD.

### Mobile
- **One Finger Drag**: Pan the map.
- **Tap "Fire" Button**: Places target at the center of the screen (Live Tracking).

## Features
- **Interactive Maps**: High-resolution maps with pan/zoom, grid labels, and accurate meter scale
- **Multi-Faction**: US, Germany, Soviet Union, and Great Britain with accurate ballistics
- **Visual Targeting**: Trajectory line, distance ruler, adjustment slider, and dispersion rings
- **Strongpoint Setup**: Select 5 active strongpoints to match in-game layouts
- **Custom Artillery**: Place up to 3 custom guns per team with move/delete support
- **Gun Selection**: Select via dropdown or direct click on map icons
- **Live HUD**: Real-time distance, MILs, grid, and bearing under cursor (desktop) or screen center (mobile)
- **Manual Calculator**: Quick distance-to-MIL calculations with keypad and calculation history
- **Mobile Optimized**: Touch targets, haptic feedback, and snappy zoom
- **Map Selector**: Visual grid with search bar

## Technical Details
- **Dynamic Caching**: "Stale-While-Revalidate" – only downloads and caches maps you open, keeping storage low while ensuring instant reloads.
- **PWA Ready**: Installable to home screen on mobile for native-like experience (offline-capable once cached).
- **Performance**: GPU-accelerated on desktop, memory-safe transforms on mobile, throttled HUD updates, batch rendering.

## Supported Maps
* Carentan (CAR)
* Driel (DRI)
* El Alamein (ELA)
* Elsenborn Ridge (EBR)
* Foy (FOY)
* Hill 400 (H4)
* Hurtgen Forest (HUR)
* Kharkov (KHA)
* Kursk (KUR)
* Mortain (MOR)
* Omaha Beach (OMA)
* Purple Heart Lane (PHL)
* Remagen (REM) – updated for Update 19.1
* Sainte-Marie-du-Mont (SMM)
* Sainte-Mère-Église (SME)
* Smolensk (SMO)
* Stalingrad (STA)
* Tobruk (TOB)
* Utah Beach (UTA)

## Browser Support
- Chrome/Chromium 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Contributing
Feel free to submit issues and enhancement requests.

## Disclaimer & Copyright
This project is a community-made tool and is **not** affiliated with, endorsed by, or sponsored by Team17, Cover 6 Studios, or Black Matter.  
**Hell Let Loose** content and materials are trademarks and copyrights of their respective owners.  
* **Game Assets:** All game images (maps, icons) are the property of the Hell Let Loose developers and publishers. They are used here for non-commercial, educational, and informational purposes.

## License
The source code (HTML, CSS, JavaScript) of this project is licensed under the **MIT License**.  
> **Note:** The game assets (images located in the `/images` folder) are **excluded** from this license and remain the intellectual property of their respective owners.
