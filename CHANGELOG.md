# Changelog

All notable changes to this project will be documented in this file.

# Changelog

All notable changes to this project will be documented in this file.

## [1.1.5] - 2026-01-23
### Changed
- **Responsiveness Overhaul**: Completely removed zoom and panning interpolation animations on Desktop. The map now responds instantly to input for a snappier, tactical feel.
- **Artillery Icon Scaling**: Implemented dynamic scaling logic for artillery icons. Icons now adjust their size intelligently based on the zoom level to remain visible without cluttering the view.
- **Gun Visibility**: Removed the "dimming" effect on non-selected artillery guns. All active friendly guns now display at full opacity for better situational awareness.
- **Mobile Ruler Precision**: Enforced a **50m interval** for the distance ruler on mobile devices (previously switched to 100m), matching the precision of the desktop experience.
- **Mobile Zoom Slider**: Increased the vertical height and touch target size of the mobile zoom slider for finer control.
- **Sticky Labels**: Slightly reduced the font size of the sticky grid labels (A-J, 1-10) on mobile to maximize map visibility.

### Fixed
- **Map Switch State**: Fixed a bug where the Faction and Gun selection dropdowns retained old values when changing maps. They now correctly reset to **"Select TEAM"** and **"Select GUN"**.
- **Gun Rotation**: Corrected the rotation logic for artillery icons ensuring barrels point accurately towards the active target or their default bearing.
- **Strongpoint Rendering**: 
    - Resolved an issue causing strongpoint text labels to appear blurry on Chrome.
    - Fixed an opacity mismatch where the "arrow down" indicator did not fade out in sync with the strongpoint name label.
- **Grid Artifacts**: Eliminated white outline artifacts appearing around grid lines at certain zoom levels.
- **Projects Modal**: Fixed the mobile layout of the "Other Projects" hub to fit its content naturally instead of forcing a full-height (92vh) modal with empty space.
- **Calculator Icon**: Increased the visual size of the Manual Calculator button icon on both desktop and mobile for better accessibility.

### Added
- **Direct Gun Selection**: Users can now tap or click directly on an artillery gun icon on the map to select it as the active weapon.
- **Trajectory Safety Check**: Added a "SHOOT FIRST" visual cue and button shake animation to the Trajectory Slider if a user attempts to open it without an active target.
- **Range Verification**: Confirmed and locked the maximum ballistic calculation range to **1600m** across all factions to match current game values.

## [1.1.4] - 2026-01-21
### Added
- **Trajectory Adjustment Slider**: Implemented a new tool (toggled via the control bar) allowing precise distance modification along the established bearing vector. Users can now "walk" shots back and forth along the trajectory line without losing the angle.

### Fixed
- **Mobile Fire Offset**: Recalibrated the `fireAtCenter` coordinate logic to align the impact marker more accurately with the visual crosshair center on mobile devices.
- **Map Transition Flicker**: Resolved a rendering issue where the previous map's texture or label text would briefly flash during the loading sequence of a new map.
- **Dynamic Page Titles**: Fixed a bug where the browser tab title (`document.title`) failed to update with the active map name (e.g., "HLL Arty Calculator - Carentan").
- **Scale Bar Accuracy**: Rewrote the scale bar logic to strictly follow the 200m grid standard rather than the variable map image width (1984m vs 2016m). This ensures the "100m" label actually represents 100 meters regardless of the map's texture size.
- **Scale Bar Rendering**: Resolved a visual bug where scale labels ("0m", "50m", "100m") would clump together or stretch incorrectly on mobile screens due to CSS/JS conflicts.
- **Mobile UI Ergonomics**:
    - Relocated the mobile **Fire Button** lower on the screen to improve thumb reachability and prevent obstruction of the map view.
    - Removed unsightly drop shadows from the vertical zoom slider buttons for a cleaner, flatter aesthetic.
- **Mobile Checkerboarding**: Eliminated black "checkerboard" glitches on Chrome Mobile by replacing hardware-accelerated transforms (`translate3d`) with standard layout centering (`margin: auto`) for UI overlays like the scale bar and zoom indicator.
- **Allies Flag Logic**: Updated the faction detection to correctly display the British (GB) flag instead of the US flag for maps labeled "Allies" (e.g., El Alamein, Driel).

### Performance
- **Mobile Zoom Strategy**: Evaluated "smooth zoom" interpolation for mobile devices but reverted to standard step-zooming to preserve frame rates and prevent texture memory crashes on lower-end devices.

## [1.1.3] - 2026-01-17
### Fixed
- **Desktop Stutter**: Eliminated micro-stutter during mouse-wheel zooming on desktop browsers by re-enabling `will-change: transform` strictly for non-mobile devices.

### Performance
- **Hybrid Rendering Pipeline**: Implemented a split rendering strategy:
    - **Desktop**: Uses GPU acceleration (`will-change`) for maximum frame rate.
    - **

## [1.1.4] - 2026-01-21
### Added
- **Trajectory Adjustment Slider**: Implemented a new tool (toggled via the control bar) allowing precise distance modification along the established bearing vector. Users can now "walk" shots back and forth along the trajectory line without losing the angle.

### Fixed
- **Mobile Fire Offset**: Recalibrated the `fireAtCenter` coordinate logic to align the impact marker more accurately with the visual crosshair center on mobile devices.
- **Map Transition Flicker**: Resolved a rendering issue where the previous map's texture or label text would briefly flash during the loading sequence of a new map.
- **Dynamic Page Titles**: Fixed a bug where the browser tab title (`document.title`) failed to update with the active map name (e.g., "HLL Arty Calculator - Carentan").
- **Scale Bar Accuracy**: Rewrote the scale bar logic to strictly follow the 200m grid standard rather than the variable map image width (1984m vs 2016m). This ensures the "100m" label actually represents 100 meters regardless of the map's texture size.
- **Scale Bar Rendering**: Resolved a visual bug where scale labels ("0m", "50m", "100m") would clump together or stretch incorrectly on mobile screens due to CSS/JS conflicts.
- **Mobile UI Ergonomics**:
    - Relocated the mobile **Fire Button** lower on the screen to improve thumb reachability and prevent obstruction of the map view.
    - Removed unsightly drop shadows from the vertical zoom slider buttons for a cleaner, flatter aesthetic.
- **Mobile Checkerboarding**: Eliminated black "checkerboard" glitches on Chrome Mobile by replacing hardware-accelerated transforms (`translate3d`) with standard layout centering (`margin: auto`) for UI overlays like the scale bar and zoom indicator.
- **Allies Flag Logic**: Updated the faction detection to correctly display the British (GB) flag instead of the US flag for maps labeled "Allies" (e.g., El Alamein, Driel).

### Performance
- **Mobile Zoom Strategy**: Evaluated "smooth zoom" interpolation for mobile devices but reverted to standard step-zooming to preserve frame rates and prevent texture memory crashes on lower-end devices.

## [1.1.3] - 2026-01-17
### Fixed
- **Desktop Stutter**: Eliminated micro-stutter during mouse-wheel zooming on desktop browsers by re-enabling `will-change: transform` strictly for non-mobile devices.

### Performance
- **Hybrid Rendering Pipeline**: Implemented a split rendering strategy:
    - **Desktop**: Uses GPU acceleration (`will-change`) for maximum frame rate.
    - **Mobile**: Uses memory-safe 2D transforms to prevent "checkerboard" crashes on devices with limited video memory.
- **Label Synchronization**: Optimized the label layer to use CSS transitions instead of JavaScript loop calculations for movement, significantly reducing CPU load during zoom animations.

## [1.1.2] - 2026-01-17
### Fixed
- **Mobile GPU Checkerboarding**: Resolved a critical rendering issue on mobile Chrome where high zoom levels caused black flickering. Replaced `translate3d` with 2D `translate` to prevent exceeding GPU texture memory limits.
- **Stuck Zoom on Reload**: Fixed a race condition where the map initialized before image dimensions were decoded, causing the viewport to lock at 100% scale. Implemented a robust retry loop to ensure `naturalWidth` is available before rendering.
- **Script Initialization**: Removed a redundant code block causing a `SyntaxError: redeclaration of const imgEl`.
- **Desktop Hover Highlights**: Restored the **Tactical Yellow** hover state for map selection thumbnails on desktop devices for better interactive feedback.
- **Modal Persistence**: Fixed a bug where closing the Manual Calculator unintentionally closed the underlying Map Selector modal.
- **Mobile Interaction Cleanup**: 
    - Eliminated "sticky" highlights on mobile for the Calculator button, Project Hub links (Garrison, SPA, GitHub), and map thumbnails. Highlights now only trigger during active touch.
    - Temporarily removed Live HUD crosshairs for both mobile and desktop to prepare for a new crosshair implementation.
- **State Management**: Corrected a bug where the Ruler would default to "ON" after clearing cookies; it now correctly defaults to "OFF".
- **Pinch-to-Zoom**: Fixed a gesture conflict that occasionally prevented zooming with two fingers on mobile browsers.

### Performance
- **Firefox Mobile Optimization**: Added `will-change: transform` to the map stage to force hardware acceleration in Firefox, resolving low-framerate lag during panning and zooming.
- **Memory Management**: Reduced video memory overhead by decoupling the map stage from forced 3D hardware acceleration layers.
- **Zoom Slider Responsiveness**: Re-engineered the vertical zoom slider logic for smoother tracking and accuracy on touch screens.

### Added
- **Tab Focus Reset**: Implemented a global reset when returning to the app tab to ensure buttons do not remain in a highlighted state after clicking external links.

## [1.1.1] - 2026-01-16
### Fixed
- **Projects Hub Logic**: Resolved a `ReferenceError` where the "Other Projects" modal failed to open due to an undefined function scope.
- **Project Link Alignment**: Re-engineered the button layout within the hub to pin external link icons to the far right edge for a cleaner tactical look.
- **Visual Weight Balancing**: Unified desktop footer icon sizes to 26px to ensure consistent visual weight between solid (calculator) and stroke-based (stack) icons.
- **Mobile Hub Overflow**: Eliminated excessive vertical empty space in the Projects Hub on mobile by implementing dynamic height scaling and centering.

### Added
- **Tactical Stack Icon**: Replaced the generic external link icon for "More Projects" with a multi-layered "Tactical Stack" SVG to better represent a project library.
- **External Link Indicators**: Integrated subtle "box-and-arrow" SVG indicators within the project list to provide clear exit-intent feedback.
- **Enhanced Mobile Readability**: Increased project hub font sizes to 14px and applied maximum font weight (900) for better legibility on small screens.
- **Interactive UI Feedback**: Implemented desktop hover highlights and mobile `:active` touch states for all project hub buttons to improve responsiveness.

## [1.1.0] - 2026-01-16
### Fixed
- **Artillery Visual Persistence**: Resolved a critical event listener conflict where switching guns caused trajectory lines and dispersion circles to disappear.
- **Search Engine Normalization**: Implemented diacritic normalization for map searches, enabling support for accented characters (e.g., "Sainte-Mère-Église").
- **Map Selector Highlighting**: Fixed a UI bug where the currently active map was not highlighted in green within the selection grid.
- **Session Restoration**: Corrected a state management issue where refreshing the browser would revert to the default map instead of the last saved selection.
- **Chrome Mobile Focus**: Prevented the unintended appearance of the mobile keyboard when using the "Shoot" functionality on Android devices.
- **Z-Index Layering**: Re-aligned stacking contexts to ensure the drawer toggle tab no longer overlaps or cuts through expanded dropdown menus.

### Performance
- **Batch Marker Rendering**: Optimized the marker system to use `DocumentFragment`, reducing browser layout thrashing and improving frame rates.
- **Throttled HUD Tracking**: Implemented `requestAnimationFrame` for live cursor tracking to significantly reduce CPU overhead during movement.
- **GPU Acceleration**: Applied `will-change: transform` and `translate3d` to map layers and labels for smooth 60fps interaction.
- **Mobile Caching**: Added local variable caching for HUD values to prevent unnecessary DOM writes during map panning.

### Added
- **Haptic Feedback**: Added tactile vibration responses to the manual calculator keypad and the mobile "Fire" button.
- **Viewport Locking**: Implemented CSS overscroll locks to prevent accidental "pull-to-refresh" and page bouncing on mobile browsers.
- **Modular Architecture**: Decoupled project logic by moving map data and ballistics tables into independent .js files for better caching.

## [1.0.0] - 2026-01-10
### Added
- **Initial Release**: Launch of the HLL Artillery Calculator core engine.
- **Dynamic Targeting**: Automated calculation of MIL elevation based on interactive map coordinates.
- **Visual Impact Zones**: Scaled dispersion, deadzone, and blast radius circles.
- **Visual Map Selector**: Interactive thumbnail-based map selector.