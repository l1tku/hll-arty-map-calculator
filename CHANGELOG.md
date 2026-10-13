# Changelog

### Not seeing the latest version?

The app updates automatically — **refresh the page twice** and it will update. Still stuck? Force a full reload:

- **PC:** Ctrl + Shift + R
- **iPhone / iPad:** Settings → Safari → Clear History and Website Data, then reopen
- **Android Chrome:** Menu → Settings → Privacy → Clear browsing data

## [1.4.5] - 2026-10-07

### Changed
- Dispersion ring radius: 20 m → 30 m.
- Kill ring radius: 10 m → 20 m.
- Updated target map, cursor rings, mobile crosshair, and trajectory line to match.

## [1.4.4] - 2026-09-29

### Changed
- Mobile distance ruler now matches desktop: 50 m intervals, up to 32 markers.

### Fixed
- Juno Beach gun dropdown now lists all 9 guns per team.
- Gun dropdown follows the selected team's actual gun positions.
- Gun dropdown scrolls on small screens.
- Selected option now highlighted in team and gun dropdowns.
- Dropdown button no longer stays highlighted when closed.
- Mobile FIRE button no longer disappears after closing the result panel or changing gun.

## [1.4.3] - 2026-09-24

### Changed
- Reorganized and refactored `js/maps.js` structure.
- Removed the close transition from the manual calculator.

### Removed
- Obsolete comments across `index.html`, `service-worker.js`, `css/style.css`, `js/script.js`, `js/ballistics.js`, and `js/maps.js`.

## [1.4.2] - 2026-09-23

### Changed
- Removed fade animations from modal close buttons and footer buttons for instant hover feedback.

## [1.4.1] - 2026-09-23

### Changed
- Updated game version compatibility to Hell Let Loose Update 21.
- Game version link now points to the Update 21 changelog.

## [1.4.0] - 2026-09-16

### Added
- SEO meta description, Open Graph, Twitter Card, and Schema.org WebSite metadata.
- High-resolution 192×192 and 512×512 icon definitions.

## [1.3.9] - 2026-06-18

### Fixed
- Shot-pulse ring animation.

## [1.3.8] - 2026-06-14

### Added
- Ko-fi support button.

### Fixed
- Map overlay scaling issues.

## [1.3.7] - 2026-06-10

### Added
- Missing west and east side HQ guns on Juno Beach.

## [1.3.6] - 2026-06-07

### Changed
- Assigned the PWA a dedicated manifest identity, start URL, and scope so it installs separately from other projects on the same domain.
- Bumped service worker and asset cache-buster versions.

### Added
- Header `by l1tku` link now points to the correct author profile.

### Fixed
- Other Projects links now display consistently.

## [1.3.5] - 2026-06-03

### Added
- Juno Beach.

### Fixed
- Prevented accidental map history popups from rapid or duplicate input.
- Map history no longer opens unless the selector is open; invisible modal overlays no longer catch clicks.
- Restored normal vertical scrolling in the map selector.
- Centered the calculator history toggle thumb.
- Fixed Firefox mobile zoom darkening.

## [1.3.4] - 2026-04-28

### Fixed
- Service worker error handling and fetch interception.
- Map loading overlay when switching maps.
- Cache-busting on map images to prevent stale displays.

### Changed
- Service worker now only registers on HTTPS.

## [1.3.3] - 2026-04-28

### Changed
- Render loop and map-switch performance improvements.

## [1.3.2] - 2026-04-28

### Added
- Map history section (book icon on map thumbnails).

### Changed
- App is now fully offline-capable.

### Fixed
- Infinite spinner when a map image fails to load.
- Minor bugs and security hardening.

## [1.3.1] - 2026-04-25

### Added
- Haptic feedback on history buttons.

### Changed
- Target panel closes on custom artillery placement.
- CLEAR button animation matches calculator keys.

### Fixed
- Map switch flicker.
- CLEAR button animation.
- Mobile layout below 370 px (text wrapping and icon size).

## [1.3.0] - 2026-04-25

### Fixed
- Strongpoint stripes overflowing circle boundary.
- Ballistic ruler now shows full 1600 m range on desktop (was stopping at 1000 m).

### Changed
- Reduced layout thrashing for smoother panning and zooming.

## [1.2.9] - 2026-04-23

### Added
- Calculator history log with faction flag, distance, MIL value, and timestamp.
- Toggle to enable/disable history.
- History and settings persistence.

### Changed
- C button shows C/SAVE when history is enabled.
- Calculator input clears to empty on click and Enter instead of showing `0`.

### Fixed
- Firefox mobile map darkening at zoom level 4.
- Carentan map filename case mismatch for GitHub Pages compatibility.

## [1.2.8] - 2026-04-22

### Added
- In-app changelog modal.
- Clickable version links (app → GitHub, game → HLL patch notes).
- New artillery positions on Smolensk.

### Changed
- Game version display format.
- Target panel label changed from `DIST` to `DISTANCE`.

### Fixed
- Mobile alignment of distance/bearing/impact values.
- Custom artillery cursor image path on mobile.
- Service worker errors by disabling interception.
- Target data panel now closes when placing or moving custom artillery.

### Removed
- Unused thumbnail image.
- Leftover debug logging.

## [1.2.7] - 2026-04-21

### Fixed
- Manual calculator now supports keyboard input.
- Enter key clears calculator input to empty.
- Backspace allows removing all characters including the last `0`.

## [1.2.6] - 2026-04-11

### Changed
- Reverted Stalingrad strongpoint position changes.

## [1.2.5] - 2026-04-11

### Changed
- Updated all 15 Stalingrad strongpoint coordinates for precise map alignment.

## [1.2.4] - 2026-04-05

### Fixed
- Missing artillery position image.
- Mobile crosshair and place button remaining visible after switching maps.

## [1.2.3] - 2026-03-30

### Fixed
- Custom artillery can no longer be moved past the 2-sector boundary.
- Green sector highlight now shown in move mode as well as placement mode.

## [1.2.2] - 2026-03-29

### Fixed
- Mil display now recalculates correctly when switching between HQ and custom artillery.

## [1.2.1] - 2026-03-29

### Fixed
- Manual calculator `FIRING AS` label now consistently shows `UNITED STATES` for US faction.

### Added
- Desktop vibration when shooting via map click.
- Authentic Yaw rotation values for all artillery guns across 19 maps.

### Changed
- Updated all artillery icon images.

### Removed
- Leftover unused `crosshair.png` file.

## [1.2.0] - 2026-03-29

### Added
- Dynamic app version extracted from script URL cache-buster.
- Haptic feedback when selecting custom artillery guns.

### Changed
- Script cache-buster updated to semantic versioning.

### Fixed
- Desktop vibration when shooting via map click.

## [1.1.8] - 2026-03-28

### Added
- Custom artillery system: place up to 3 custom guns per team on the map, with move/delete support.
- Remagen map data updated for Hell Let Loose Update 19.1.
- Permanent range overlays showing 1600 m maximum range and 100 m minimum range.
- Target panel close button.
- Persistent green sector highlight during custom artillery placement.

### Changed
- Replaced the old red dashed 1600 m circle with dark range overlays.
- Mobile custom artillery placement now uses crosshair aim + PLACE button.
- Optimized range overlay rendering.

### Fixed
- Range overlays now appear immediately when any gun is selected.

## [1.1.7] - 2026-03-20

### Changed
- Updated game version string for Update 19.1 compatibility.

## [1.1.6] - 2026-01-26

### Added
- Match Setup Mode with Strongpoint Filter.
- Max Range Indicator.
- Shooting pulse effect.
- Target compass bearing.

### Fixed
- Bearing accuracy.
- Z-index layering.
- Zoom performance.
- Haptic feedback.
- Mobile Projects Hub alignment.

## [1.1.5] - 2026-01-23

### Changed
- Responsiveness overhaul (instant zoom/pan).
- Dynamic artillery icon scaling.
- Removed dimming on unselected guns.
- Mobile ruler precision improvements.

### Fixed
- Map switch state reset.
- Gun rotation logic.
- Strongpoint label blur.
- Scale bar accuracy.
- Mobile checkerboarding.

## [1.1.4] - 2026-01-21

### Added
- Trajectory Adjustment Slider.

### Fixed
- Mobile fire offset.
- Map transition flicker.
- Dynamic page titles.
- Scale bar rendering.
- Mobile UI ergonomics.

## [1.1.3] - 2026-01-17

### Fixed
- Desktop stutter on wheel zoom.

## [1.1.2] - 2026-01-17

### Fixed
- Mobile GPU checkerboarding.
- Stuck zoom on reload.
- Script initialization errors.
- Desktop hover highlights.
- Modal persistence.

## [1.1.1] - 2026-01-16

### Fixed
- Projects Hub logic and alignment.
- Visual weight balancing.
- Mobile overflow.

## [1.1.0] - 2026-01-16

### Added
- Core engine with dynamic targeting.
- Visual impact zones.
- Interactive map selector.
- Haptic feedback.

### Fixed
- Major rendering and state fixes.

### Changed
- GPU acceleration.
- Viewport locking.
