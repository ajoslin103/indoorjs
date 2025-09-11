# Grid and FabricJS Zoom Integration

## How to Get FabricJS Pixel Size for Grid Rendering

From analyzing the codebase, the integration between FabricJS and the grid system happens in `Map.js`. Here's how to properly retrieve and use FabricJS's zoom to calculate unit sizes for the grid:

### 1. FabricJS Viewport Transform

FabricJS uses a viewport transform matrix (`viewportTransform`) that contains scale and translation information:

```javascript
const vpt = canvas.viewportTransform;
// vpt[0] and vpt[3] are the scale factors (zoom)
// vpt[4] and vpt[5] are the translations (pan)
```

### 2. Getting Pixel Size of a Unit

To determine how many pixels a unit takes up based on FabricJS zoom:

```javascript
// If you have a 1-unit object
const unitInPixels = 1 * vpt[0]; // vpt[0] is the x-scale factor
```

This is already happening in `Map.js` at lines 170-171:

```javascript
const centerX = (canvas.width / 2 - vpt[4]) / vpt[0];
const centerY = (canvas.height / 2 - vpt[5]) / vpt[3];
```

Here, the code is converting from pixel coordinates to world coordinates by dividing by the scale factor.

### 3. Integration with Grid Calculation

You can create a test function that demonstrates how a 1-unit object scales with zoom:

```javascript
function getUnitToPixelSize(fabricCanvas) {
  const vpt = fabricCanvas.viewportTransform;
  if (!vpt) return 1; // Default if no transform
  
  // Create a test point at (1,0)
  const worldPoint = new fabric.Point(1, 0);
  
  // Transform to screen coordinates
  const screenPoint = fabric.util.transformPoint(worldPoint, vpt);
  const originPoint = fabric.util.transformPoint(new fabric.Point(0, 0), vpt);
  
  // Calculate distance in pixels
  const pixelDistance = Math.sqrt(
    Math.pow(screenPoint.x - originPoint.x, 2) + 
    Math.pow(screenPoint.y - originPoint.y, 2)
  );
  
  return pixelDistance; // This is how many pixels 1 unit takes up at current zoom
}
```

### 4. Using This in the Grid System

When calculating grid spacing, you should use this pixel size rather than relying on zoom alone:

```javascript
// In grid-units.js, calculateGridSpacing:
export function calculateGridSpacing(units, zoom, pixelRatio, unitToPixelSize) {
  // unitToPixelSize is how many pixels 1 unit occupies at current zoom
  const idealUnitSpacing = IDEAL_GRID_LINE_SPACING / unitToPixelSize;
  
  // Rest of the function remains the same...
}
```

### 5. Implementation in Map.js

Modify the `update()` method in Map.js to pass this pixel size information to the grid:

```javascript
// In Map.js, update method
if (this.grid && vpt) {
  // Calculate unit to pixel size
  const unitToPixelSize = vpt[0]; // FabricJS X scale
  
  // Update the grid with calculated world coordinates and unit size
  this.grid.updateViewport({
    x: centerX,
    y: gridCenterY,
    zoom: this.zoom,
    unitToPixelSize: unitToPixelSize
  });
}
```

This approach ensures that the grid directly uses FabricJS's transformation matrix to calculate how many pixels to use for rendering each unit, regardless of which unit system (Points, Imperial, Metric) is active.
