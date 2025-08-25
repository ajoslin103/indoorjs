import { clamp } from '../lib/mumath/index.js';

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
    canvas.setAttribute('id', 'indoors-map-canvas');

    canvas.width = this.width || this.container.clientWidth;
    canvas.height = this.height || this.container.clientHeight;

    // Initialize Fabric.js settings before creating any Fabric objects
    initializeFabric();
    
    // create the fabric Canvas
    this.fabric = new fabric.Canvas(canvas, {
      preserveObjectStacking: true,
      renderOnAddRemove: true
    });
    this.context = this.fabric.getContext('2d');

    this.originX = -this.fabric.width / 2;
    this.originY = -this.fabric.height / 2;

    this.fabric.absolutePan({
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

  }

  addGrid(gridControl) {
    // Create grid using the fabric canvas context
    this.grid = new Grid(this.context, this);
    
    // Set grid dimensions to match fabric canvas
    this.grid.width = this.fabric.width;
    this.grid.height = this.fabric.height;
    // Initialize grid state with correct dimensions
    this.grid.updateConfiguration();
    
    // Initialize grid center coordinates to match Fabric.js center
    this.grid.center.x = 0; // Center should be 0 to align with fabric's center
    this.grid.center.y = 0; // Center should be 0 to align with fabric's center
    
    // Hook into Fabric's render events to draw the grid after Fabric has rendered
    this.fabric.on('before:render', () => {
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
    const { width, height } = this.fabric;
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
    const { width, height } = this.fabric;
    this.zoom = this._options.zoom || 1;
    this.center = new Point();
    this.originX = -this.fabric.width / 2;
    this.originY = -this.fabric.height / 2;
    this.fabric.absolutePan({
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
    const oldWidth = this.fabric.width;
    const oldHeight = this.fabric.height;

    // Parameters required; automatic resize behavior removed

    this.fabric.setWidth(width);
    this.fabric.setHeight(height);

    if (this.grid) {
      this.grid.width = width;
      this.grid.height = height;
      this.grid.updateConfiguration();
    }

    const dx = width / 2.0 - oldWidth / 2.0;
    const dy = height / 2.0 - oldHeight / 2.0;

    this.fabric.relativePan({
      x: dx,
      y: dy
    });

    this.update();
  }

  update() {
    const canvas = this.fabric;
    
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

        // Update the grid with the calculated world coordinates
        this.grid.updateViewport({
          x: centerX,
          y: centerY,
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
    if (!this.lastUpdatedTime && Math.abs(this.lastUpdatedTime - now) < 100) {
      return;
    }
    this.lastUpdatedTime = now;
  }

  // registerListeners() method removed - all event handling code removed
}

export const map = (container, options) => {
  const mapInstance = new Map(container, options);
  return mapInstance.fabric;
};
