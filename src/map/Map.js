import { clamp } from '../lib/mumath/index.js';
import fabric from 'fabric';

import Base from '../core/Base.js';
import { MAP, Modes, initializeFabric } from '../core/Constants.js';
import Grid from '../grid/Grid.js';
import { Point } from '../geometry/Point.js';
export class Map extends Base {
  constructor(container, options) {
    super(options);

    this.defaults = Object.assign({}, MAP);

    // set defaults
    Object.assign(this, this.defaults);

    // overwrite options
    Object.assign(this, this._options);

    this.center = new Point(this.center);

    this.container = container || document.body;

    const canvas = document.createElement('canvas');
    this.container.appendChild(canvas);
    canvas.setAttribute('id', 'schematic-canvas');

    canvas.width = this.width || this.container.clientWidth;
    canvas.height = this.height || this.container.clientHeight;

    // Initialize Fabric.js settings before creating any Fabric objects
    initializeFabric();
    
    // create the fabric Canvas
    this.fabricCanvas = new fabric.Canvas(canvas, {
      preserveObjectStacking: true,
      renderOnAddRemove: true,
      fireRightClick: true, // allow right-click events to flow through Fabric
      stopContextMenu: true // prevent default context menu to keep drag uninterrupted
    });
    this.context = this.fabricCanvas.getContext('2d');

    this.originX = -this.fabricCanvas.width / 2;
    this.originY = -this.fabricCanvas.height / 2;

    this.fabricCanvas.absolutePan({
      x: this.originX,
      y: this.originY
    });


    this.x = this.center.x;
    this.y = this.center.y;
    this.dx = 0;
    this.dy = 0;

    if (this.showGrid) {
      this.addGrid();
    }

    // Enable snapping of object move/resize to integer values
    this._registerSnapping();

  }

  addGrid(gridControl) {
    // Create grid using the fabric canvas context
    this.grid = new Grid(this.context, this);
    
    // Set grid dimensions to match fabric canvas
    this.grid.width = this.fabricCanvas.width;
    this.grid.height = this.fabricCanvas.height;
    // Initialize grid state with correct dimensions
    this.grid.updateConfiguration();
    
    // Initialize grid center coordinates to match Fabric.js center
    this.grid.center.x = 0; // Center should be 0 to align with fabric's center
    this.grid.center.y = 0; // Center should be 0 to align with fabric's center
    
    // Hook into Fabric's render events to draw the grid after Fabric has rendered
    this.fabricCanvas.on('before:render', () => {
      if (this.grid) {
        this.grid.render();
      }
    });
    
    // Apply grid control settings if provided
    if (gridControl) {
      gridControl.applyToGrid(this.grid);
    }
    
    // Initial draw
    this.grid.render();
    
    return this.grid;
  }

  setZoom(zoom) {
    const { width, height } = this.fabricCanvas;
    this.zoom = clamp(zoom, this.minZoom, this.maxZoom);
    this.dx = 0;
    this.dy = 0;
    this.x = width / 2.0;
    this.y = height / 2.0;
    this.update();
    // Use setTimeout for browser compatibility
    setTimeout(() => {
      this.update();
    }, 0);
  }

  reset() {
    const { width, height } = this.fabricCanvas;
    this.zoom = this._options.zoom || 1;
    this.center = new Point();
    this.originX = -this.fabricCanvas.width / 2;
    this.originY = -this.fabricCanvas.height / 2;
    this.fabricCanvas.absolutePan({
      x: this.originX,
      y: this.originY
    });
    this.x = width / 2.0;
    this.y = height / 2.0;
    this.update();
    // Use setTimeout for browser compatibility
    setTimeout(() => {
      this.update();
    }, 0);
  }

  onResize(width, height) {
    const oldWidth = this.fabricCanvas.width;
    const oldHeight = this.fabricCanvas.height;

    // Parameters required; automatic resize behavior removed

    this.fabricCanvas.setWidth(width);
    this.fabricCanvas.setHeight(height);

    if (this.grid) {
      this.grid.width = width;
      this.grid.height = height;
      this.grid.updateConfiguration();
    }

    const dx = width / 2.0 - oldWidth / 2.0;
    const dy = height / 2.0 - oldHeight / 2.0;

    this.fabricCanvas.relativePan({
      x: dx,
      y: dy
    });

    this.update();
  }

  update() {
    const canvas = this.fabricCanvas;
    
    // Always clamp zoom to bounds, even if set directly elsewhere
    const z = clamp(this.zoom, this.minZoom, this.maxZoom);
    if (z !== this.zoom) this.zoom = z;

    // First apply the zoom to the center of the canvas
    const centerPoint = new fabric.Point(canvas.width / 2, canvas.height / 2);
    canvas.zoomToPoint(centerPoint, this.zoom);
    
    // Then update the grid based on the new viewport transform
    if (this.grid) {
      // Get current viewport transform to calculate world coordinates
      const vpt = canvas.viewportTransform;
      
      if (vpt) {
        // Calculate the viewport center in world coordinates
        const centerX = (canvas.width / 2 - vpt[4]) / vpt[0];
        const centerY = (canvas.height / 2 - vpt[5]) / vpt[3];
        const gridCenterY = -centerY;

        // Update the grid with the calculated world coordinates
        this.grid.updateViewport({
          x: centerX,
          y: gridCenterY,
          zoom: this.zoom
        });
      } else {
        // Fallback if no viewport transform is available
        this.grid.updateViewport({
          x: 0,
          y: 0,
          zoom: this.zoom
        });
      }
      
      // Render the grid with the updated position
      this.grid.render();
    }

    const now = Date.now();
    if (this.lastUpdatedTime && Math.abs(this.lastUpdatedTime - now) < 100) {
      return;
    }
    this.lastUpdatedTime = now;
  }

  // registerListeners() method removed - all event handling code removed
}

export const map = (container, options) => {
  const mapInstance = new Map(container, options);
  return mapInstance.fabricCanvas;
};

// Private helpers on the prototype to keep constructor lean
Map.prototype._registerSnapping = function _registerSnapping() {
  const canvas = this.fabricCanvas;
  if (!canvas) return;

  const round = (v) => Math.round(v);

  // Snap position while dragging
  canvas.on('object:moving', (e) => {
    const t = e?.target;
    if (!t) return;
    // Round left/top to integers
    t.set({
      left: round(t.left || 0),
      top: round(t.top || 0)
    });
    t.setCoords();
  });

  // Snap effective size while scaling
  canvas.on('object:scaling', (e) => {
    const t = e?.target;
    if (!t) return;
    const baseW = t.width || 0;
    const baseH = t.height || 0;
    if (baseW > 0 && baseH > 0) {
      const newW = Math.max(1, round(baseW * (t.scaleX || 1)));
      const newH = Math.max(1, round(baseH * (t.scaleY || 1)));
      // Convert back to scale factors so Fabric maintains control handles correctly
      t.set({
        scaleX: newW / baseW,
        scaleY: newH / baseH
      });
    }
    // Also align position to integers to avoid subpixel jitter
    t.set({
      left: round(t.left || 0),
      top: round(t.top || 0)
    });
    t.setCoords();
  });
};
