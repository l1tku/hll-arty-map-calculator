# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-01-16
### Fixed
- **Artillery Visual Persistence**: Resolved a critical event listener conflict where switching guns caused trajectory lines and dispersion circles to disappear.
- **Search Engine Normalization**: Implemented diacritic normalization for map searches, enabling support for accented characters (e.g., "Sainte-Mère-Église").
- **Map Selector Highlighting**: Fixed a UI bug where the currently active map was not highlighted in green within the selection grid.
- **Session Restoration**: Corrected a state management issue where refreshing the browser would revert to the default map instead of the last saved selection.
- **Chrome Mobile Focus**: Prevented the unintended appearance of the mobile keyboard when using the "Shoot" functionality on Android devices.
- **Z-Index Layering**: Re-aligned stacking contexts to ensure the drawer toggle tab no longer overlaps or cuts through expanded dropdown menus.

### Performance
- **Batch Marker Rendering**: Optimized the marker system to use DocumentFragment, reducing browser layout thrashing and improving frame rates.
- **Throttled HUD Tracking**: Implemented requestAnimationFrame for live cursor tracking to significantly reduce CPU overhead during movement.
- **GPU Acceleration**: Applied will-change: transform and translate3d to map layers and labels for smooth 60fps interaction.
- **Mobile Caching**: Added local variable caching for HUD values to prevent unnecessary DOM writes during map panning.

### Added
- **Haptic Feedback**: Added tactile vibration responses to the manual calculator keypad and the mobile "Fire" button.
- **Viewport Locking**: Implemented CSS overscroll locks to prevent accidental "pull-to-refresh" and page bouncing on mobile browsers.
- **Modular Architecture**: Decoupled the project logic by moving map data and ballistics tables into independent .js files for better caching.

## [1.0.0] - 2026-01-10
### Added
- **Initial Release**: Launch of the HLL Artillery Calculator core engine.
- **Dynamic Targeting**: Automated calculation of MIL elevation based on interactive map coordinates.
- **Visual Impact Zones**: Scaled dispersion, deadzone, and blast radius circles.
- **Visual Map Selector**: Interactive thumbnail-based map selection system.