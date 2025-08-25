# Non-Reactive Parameter Specification

## Core Principles
1. **Explicit State Mutation**: All state changes must be triggered by method calls
2. **No Implicit Dependencies**: No reliance on DOM events or automatic state updates
3. **Pure Draw Operations**: Rendering requires explicit `update()` calls after state changes

---

## Required Parameter Structures

### Layer Definition
```js
/**
 * @typedef {Object} Layer
 * @property {fabric.Object} shape - Must be valid Fabric.js object
 * @property {string} [class] - Optional object classification
 * @property {boolean} [keepOnZoom] - Whether to maintain size during zoom
 * @property {number} [zIndex] - Explicit rendering order index
 */
```

### Viewport Configuration
```js
/**
 * @typedef {Object} Viewport
 * @property {number} x - Center X coordinate
 * @property {number} y - Center Y coordinate
 * @property {number} zoom - Scale factor (1.0 = 100%)
 */
```

---

## Method Signatures

### `onResize(width: number, height: number)`
- **Purpose**: Update canvas dimensions
- **Requirements**:
  - `width` must be > 0
  - `height` must be > 0
- **Post-condition**: Automatic `update()` call required for rendering

### `setViewport(viewport: Viewport)`
- **Purpose**: Directly set camera position/scale
- **Behavior**:
  ```js
  map.setViewport({
    x: 500,    // World coordinate X
    y: 300,    // World coordinate Y
    zoom: 1.2   // 120% scale
  })
  map.update()  // Required after any viewport change
  ```

### `addLayer(layer: Layer)`
- **Validation**:
  - Rejects layers without `shape` property
  - Normalizes missing `class` as 'default'
- **Usage**:
  ```js
  map.addLayer({
    shape: new fabric.Rect({ width: 100, height: 100 }),
    class: 'obstacle',
    keepOnZoom: true
  })
  map.update()
  ```

### `drawGrid(config: { spacing: number })`
- **Replaces** `addGrid()`
- **Parameters**:
  - `spacing`: Distance between grid lines (world units)
- **Requirement**: Must call after any zoom change:
  ```js
  map.setZoom(1.5)
  map.drawGrid({ spacing: 50 })
  ```

---

## Critical Usage Patterns

### State Mutation Workflow
```js
// 1. Configure state
map.setViewport({ x: 100, y: 200, zoom: 1.2 })

// 2. Modify elements
map.addLayer({ shape: building })

// 3. Explicit render
map.update()
```

### Mandatory Update Rule
> **All state mutations must be followed by `update()`**
> - Violation causes visual artifacts
> - Not called automatically (non-reactive design)

---

## Migration Checklist
- [ ] Replace all `.setZoom()` with explicit `update()` calls
- [ ] Convert `floorplan` handling to direct `addLayer()`
- [ ] Remove all `.on()`/`.emit()` event patterns
- [ ] Validate layer objects against `Layer` typedef