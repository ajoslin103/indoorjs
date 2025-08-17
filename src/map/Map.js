// import panzoom from '../lib/panzoom';
import { clamp } from '../lib/mumath/index.js';

import Base from '../core/Base.js';
import { MAP, Modes } from '../core/Constants.js';
import Grid from '../grid/Grid.js';
import { Point } from '../geometry/Point.js';

// import ModesMixin from './ModesMixin';
// import Measurement from '../measurement/Measurement';
// import { mix } from '../lib/mix';

// export class Map extends mix(Base).with(ModesMixin) {
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

    this.canvas = new fabric.Canvas(canvas, {
      preserveObjectStacking: true,
      renderOnAddRemove: true
    });
    this.context = this.canvas.getContext('2d');

    // Removed event listener
    if (this.autostart) {
      // Auto-clear if needed (previously was in render event handler)
      this.clear();
    }

    this.originX = -this.canvas.width / 2;
    this.originY = -this.canvas.height / 2;

    this.canvas.absolutePan({
      x: this.originX,
      y: this.originY
    });

    // this.center = {
    //   x: this.canvas.width / 2.0,
    //   y: this.canvas.height / 2.0
    // };

    this.x = this.center.x;
    this.y = this.center.y;
    this.dx = 0;
    this.dy = 0;

    if (this.showGrid) {
      this.addGrid();
    }

  }


  addObject(object) {
    // this.canvas.renderOnAddRemove = false;
    if (!object) {
      console.error('object is undefined');
      return;
    }
    this.canvas.add(object);
    this.canvas._objects.sort((o1, o2) => o1.zIndex - o2.zIndex);

    this.canvas.requestRenderAll();
    return object;
  }

  removeObject(object) {
    if (!object) return;
    this.canvas.remove(object);
    return object;
  }

  addGrid() {
    this.gridCanvas = this.cloneCanvas();
    this.gridCanvas.setAttribute('id', 'indoors-grid-canvas');
    this.grid = new Grid(this.gridCanvas, this);
    this.grid.draw();
  }

  moveTo(obj, index) {
    if (!obj) return;
    
    if (index !== undefined) {
      obj.zIndex = index;
    }
    
    this.canvas.moveTo(obj, obj.zIndex);
  }

  cloneCanvas(canvas) {
    canvas = canvas || this.canvas;
    const clone = document.createElement('canvas');
    clone.width = canvas.width;
    clone.height = canvas.height;
    canvas.wrapperEl.appendChild(clone);
    return clone;
  }

  setZoom(zoom) {
    const { width, height } = this.canvas;
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

  getBounds() {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    this.canvas.forEachObject(obj => {
      const coords = obj.getBounds();

      coords.forEach(point => {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      });
    });

    return [new Point(minX, minY), new Point(maxX, maxY)];
  }

  fitBounds(padding = 100) {
    this.onResize();

    const { width, height } = this.canvas;

    this.originX = -this.canvas.width / 2;
    this.originY = -this.canvas.height / 2;

    const bounds = this.getBounds();

    this.center.x = (bounds[0].x + bounds[1].x) / 2.0;
    this.center.y = -(bounds[0].y + bounds[1].y) / 2.0;

    const boundWidth = Math.abs(bounds[0].x - bounds[1].x) + padding;
    const boundHeight = Math.abs(bounds[0].y - bounds[1].y) + padding;
    const scaleX = width / boundWidth;
    const scaleY = height / boundHeight;

    this.zoom = Math.min(scaleX, scaleY);

    this.canvas.setZoom(this.zoom);

    this.canvas.absolutePan({
      x: this.originX + this.center.x * this.zoom,
      y: this.originY - this.center.y * this.zoom
    });

    this.update();
    // Use setTimeout for browser compatibility
    setTimeout(() => {
      this.update();
    }, 0);
  }

  setCursor(cursor) {
    this.container.style.cursor = cursor;
  }

  reset() {
    const { width, height } = this.canvas;
    this.zoom = this._options.zoom || 1;
    this.center = new Point();
    this.originX = -this.canvas.width / 2;
    this.originY = -this.canvas.height / 2;
    this.canvas.absolutePan({
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
    const oldWidth = this.canvas.width;
    const oldHeight = this.canvas.height;

    // Parameters required; automatic resize behavior removed

    this.canvas.setWidth(width);
    this.canvas.setHeight(height);

    if (this.grid) {
      this.grid.setSize(width, height);
    }

    const dx = width / 2.0 - oldWidth / 2.0;
    const dy = height / 2.0 - oldHeight / 2.0;

    this.canvas.relativePan({
      x: dx,
      y: dy
    });

    this.update();
  }

  update() {
    const canvas = this.canvas;

    if (this.grid) {
      this.grid.update2({
        x: this.center.x,
        y: this.center.y,
        zoom: this.zoom
      });
    }
    // Event emission removed per non-reactive conversion
    if (this.grid) {
      this.grid.render();
    }

    canvas.zoomToPoint(new Point(this.x, this.y), this.zoom);

    if (this.isGrabMode === true || this.isRight) {
      canvas.relativePan(new Point(this.dx, this.dy));
      // Event emission removed per non-reactive conversion
      this.setCursor('grab');
    } else {
      this.setCursor('pointer');
    }

    const now = Date.now();
    if (!this.lastUpdatedTime && Math.abs(this.lastUpdatedTime - now) < 100) {
      return;
    }
    this.lastUpdatedTime = now;
  }

  // registerListeners() method removed - all event handling code removed
}

export const map = (container, options) => new Map(container, options);
