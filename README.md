# HLL Artillery Calculator

A comprehensive, high-precision artillery calculator for Hell Let Loose. This tool provides accurate firing solutions using exact map scaling, interpolated ballistic tables, and visual targeting aids.

## Features

- **Interactive Tactical Maps**: High-resolution maps with smooth pan, zoom, and dynamic grid rendering.
- **Multi-Faction Support**: Full ballistics for **US**, **Germany**, **Soviet Union**, and **Great Britain**.
- **Visual Targeting Suite**:
  - **Trajectory Line**: Visualizes the flight path from gun to target.
  - **Dynamic Ruler**: Shows MILs and Distance markers every 50m along the trajectory.
  - **Impact Analysis**: Visual rings for Dispersion (20m), Shell Killzone (10m), and Blast Radius (5m).
- **Live HUD**:
  - **Desktop**: Cursor-following HUD displaying real-time Distance, MILs, and Grid Reference.
  - **Mobile**: Docked HUD with crosshair targeting mode.
- **Manual Calculator**: Integrated keypad for quick calculations without needing to click the map.
- **Dynamic Map Scaling**: Automatically adjusts calculations for different map sizes (e.g., 2016m Carentan vs 1984m Driel) for 1:1 accuracy.
- **Mobile Optimized**:
  - Specialized "T-Shape" control layout for mobile ease-of-use.
  - Touch-friendly sizing and interaction.
  - Pinch-to-zoom and double-tap prevention.
- **Map Selector**: Visual grid selector with search functionality .

## Supported Factions & Ballistics

The calculator uses distinct ballistic tables for each faction, utilizing linear interpolation between known data points for maximum precision.

* **US Forces / Great Britain** (M114 / QF 25-pounder)
* **German Forces** (sFH 18)
* **Soviet Union** (122mm M-30)

## Usage

### Method 1: Map Targeting
1.  **Select Map**: Open the map selector grid and choose your battlefield.
2.  **Configure Squad**: Select your Faction and active Gun (1, 2, or 3) from the control panel.
3.  **Aim**: Click anywhere on the map to place a target.
4.  **Fire**: Read the firing solution from the **Target Data Panel** (Distance, Elevation MILs, Time of Flight).

### Method 2: Manual Calculator
1.  Click the **Calculator Icon** in the sidebar.
2.  Select your faction.
3.  Type the distance to target (e.g., "1250").
4.  Get instant Elevation MILs.

## Map Controls

### Desktop
-   **Left Click**: Place Target / Select Artillery.
-   **Click & Drag**: Pan the map.
-   **Mouse Wheel**: Zoom in/out.
-   **Hover**: View live distance and grid reference in the HUD.

### Mobile
-   **One Finger Drag**: Pan the map.
-   **Tap "Fire" Button**: Places target at the center of the screen (Crosshair mode).

## Installation

1.  Clone or download this repository.
2.  Ensure map images are placed in `images/maps/` and thumbnails in `images/maps/thumbnail/`.
3.  Open `index.html` in any modern web browser.

## Supported Maps

Includes logic for varying map dimensions (1984m vs 2000m+):

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
* Remagen (REM)
* Sainte-Marie-du-Mont (SMM)
* Sainte-Mère-Église (SME)
* Smolensk (SMO)
* Stalingrad (STA)
* Tobruk (TOB)
* Utah Beach (UTA)

## Browser Support

-   Chrome/Chromium 80+
-   Firefox 75+
-   Safari 13+
-   Edge 80+

## Contributing

Feel free to submit issues and enhancement requests. Special thanks to the HLL community for data verification.

## License

This project is for educational and gaming purposes.