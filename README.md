# Maps

A simple, non-reactive, and extensible canvas-based library built over [Fabric.js](https://fabricjs.com/) for creating and managing 2D graphics. Its key feature is a measured grid that renders beneath Fabric.js objects without affecting them.

## Architecture
                             / -> Grid (draws lines/axes/labels)
                            /
Your Application -> The Schematic -> The Map
                                \
                                 \ -> Fabric.js canvas

### The Schematic

`Schematic` is the main entry point recommended for applications. It wraps a `Map` instance, exposes the underlying Fabric.js canvas via `schematic.fabric`, and forwards convenient methods and events for zooming, panning, and grid control.

It creates and owns the [Fabric.js](https://fabricjs.com/) canvas through the `Map`, provides event helpers (e.g. `on`, `off`, `once`, `emit`), and high-level controls like `setZoom()`, `setZoomLimits(min,max)`, `resetView()`, `setOriginPin(pin, margin)`, and `showGrid(true/false)`.

Interactions supported by default:
- Mouse wheel zoom with clamped limits; hold Alt/Option to zoom around the mouse position.
- ScrollBars, for moving about the canvas; or Right-click + drag-panning (Ctrl+Left on macOS)
- Programmatic `resetView()` to re-center and reset zoom.
- PinOrigin, which locks the grid/canvas origin to a viewport corner (disables panning)

The schematic instance also exposes `mapInstance` for lower-level access when needed.

### The Map

`Map` creates and manages the Fabric.js canvas element and coordinates grid rendering relative to Fabric’s viewport transform. It keeps the grid aligned to the viewport center so grid lines remain consistent while you pan and zoom.

It listens to Fabric canvas events (via `Schematic`) and updates the grid state when the viewport changes. It also ensures grid rendering happens in Fabric’s `before:render` phase so the grid draws beneath objects.

`Map` exposes helpers:
- `setZoom(zoom)` and `setZoomLimits(min,max)` (via `Schematic`).
- `reset()` to restore initial zoom/origin.
- `onResize(width, height)` to resize the canvas and grid.

### The Grid

The `Grid` class uses the canvas 2D context (from Fabric’s canvas) to paint grid lines, axes, ticks, and labels. It displays a visible coordinate reference for Fabric objects without affecting those objects in any way.

The grid is stateless with respect to Fabric objects. Each time the viewport changes, the `Map` updates the grid’s center and zoom (using pure calculations) and triggers a draw; the effect is responsive without the grid owning any Fabric state.

### The Fabric.js canvas

The Fabric.js canvas does what it does — see their docs for details. The Fabric instance is available as `schematic.fabric` so your application can add and manipulate Fabric objects directly. Note: grid coordinates invert the Y axis for display, while Fabric’s world coordinates remain standard.

## Installation

- Peer dependency: `fabric@^6`
- Bundles: CommonJS, ESM, UMD (`dist/`)

```bash
npm install schematic-core fabric
```

## Quick start

The package build currently exports `Map` (and a `map()` factory). `Schematic` is available when importing from source paths (as used in the demo) and may be added to the package bundle later.

### Using Schematic (source import)

```javascript
import { Schematic } from './src/core/Schematic.js';

const container = document.getElementById('canvas-container');
const schematic = new Schematic(container, {
  showGrid: true,
  zoomDebounceDelay: 200
});

// Access Fabric.js instance
const fabricCanvas = schematic.fabric;

// Controls
schematic.setZoomLimits(0.05, 20);
schematic.setZoom(1);
schematic.setOriginPin('CENTER', 0); // or 'TOP_LEFT'|'TOP_RIGHT'|'BOTTOM_LEFT'|'BOTTOM_RIGHT'|'NONE'

// Add Fabric objects normally
const circle = new window.fabric.Circle({ left: 0, top: 0, radius: 50, fill: '#eee' });
fabricCanvas.add(circle);
```

### Using the packaged Map

```javascript
import { Map } from 'schematic-core';

const container = document.getElementById('canvas-container');
const map = new Map(container, { showGrid: true });

// Access Fabric.js instance
const fabricCanvas = map.fabric;

// Controls
map.setZoom(1);
map.onResize(container.clientWidth, container.clientHeight);

// Add Fabric objects normally
const circle = new window.fabric.Circle({ left: 0, top: 0, radius: 50, fill: '#eee' });
fabricCanvas.add(circle);
```

## API overview (selected)

- **`Schematic(container, options)`**: creates a map + grid.
  - **Properties**: `fabric`, `mapInstance`.
  - **Events**: `zoom`, `zoom:change`, `zoom:completed`, `pan:move`, `pan:completed`, `grid:change`, `view:reset`.
  - **Methods**:
    - `setZoom(zoom)`
    - `setZoomLimits(min, max)`
    - `resetView()`
    - `setOriginPin(pin, margin)` and `setOriginScreen(x, y)`
    - `showGrid(visible)`
    - `addObject(obj)`, `removeObject(obj)` (delegate to `Map`)

- **`Map`** (lower-level): manages Fabric canvas and grid sync.
  - `setZoom(zoom)`, `reset()`, `onResize(w,h)`, `update()`

## Development

- Demo: `npm run dev` (serves `demo/grid-demo.html` with live-reload)
- Build: `npm run build` (outputs `dist/schematic.*.js` via Rollup)
- Entry: `src/map/Map.js`; public wrappers: `src/core/Schematic.js`

## Notes

- Right-click (or Ctrl+Left on macOS) + drag to pan. Mouse wheel to zoom (Alt/Option anchors zoom to cursor).
- Grid renders in Fabric’s `before:render` and never mutates Fabric objects.
- Coordinates shown by the grid invert Y for display; Fabric world coordinates remain standard.
