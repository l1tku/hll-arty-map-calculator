# HLL Arty Map Calculator

An interactive tactical map and high-precision artillery calculator for Hell Let Loose. Features dynamic grid scaling for all maps, visual trajectory aids, and a mobile-optimized targeting UI.

## Features

- **Interactive Tactical Maps**: High-resolution maps with smooth pan, zoom, and dynamic grid rendering.
- **Multi-Faction Support**: Full ballistics for **US**, **Germany**, **Soviet Union**, and **Great Britain**.
- **Visual Targeting Suite**:
  - **Trajectory Line**: Visualizes the flight path from gun to target.
  - **Dynamic Ruler**: Shows MILs and Distance markers every 50m along the trajectory.
  - **Impact Analysis**: Visual rings for Dispersion (40m), Shell Killzone (20m), and Blast Radius (10m).
- **Live Tracking**:
  - **Desktop**: Cursor-following HUD displaying real-time Distance, MILs, and Grid Reference.
  - **Mobile**: Docked HUD with crosshair targeting mode.
- **Manual Calculator**: Integrated keypad for quick calculations without needing to click the map.
- **Dynamic Map Scaling**: Automatically adjusts calculations for different map sizes (e.g., 2016m Carentan vs 1984m Driel) for 1:1 accuracy.
- **Mobile Optimized**:
- **Map Selector**: Visual grid selector with search functionality .

## Usage

### Method 1: Map Targeting
1.  **Select Map**: Open the map selector grid and choose your battlefield.
2.  **Configure Faction**: Select your Faction and active Gun (1, 2, or 3) from the control panel.
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
-   **Tap "Fire" Button**: Places target at the center of the screen (Live Tracking).

## Installation

1.  Clone or download this repository.
2.  Ensure map images are placed in `images/maps/` and thumbnails in `images/maps/thumbnail/`.
3.  Open `index.html` in any modern web browser.

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

Feel free to submit issues and enhancement requests.

## Disclaimer & Copyright

This project is a community-made tool and is **not** affiliated with, endorsed by, or sponsored by Team17, Cover 6 Studios, or Black Matter.

**Hell Let Loose** content and materials are trademarks and copyrights of their respective owners.
* **Game Assets:** All game images (maps, garrison icons) are the property of the Hell Let Loose developers and publishers. They are used here for non-commercial, educational, and informational purposes.

## License

The source code (HTML, CSS, JavaScript) of this project is licensed under the **MIT License**.

> **Note:** The game assets (images located in the `/images` folder) are **excluded** from this license and remain the intellectual property of their respective owners.
