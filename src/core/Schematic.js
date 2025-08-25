import Base from './Base.js';
import { Map } from '../map/Map.js';

/**
 * Schematic class for handling event subscriptions and emissions
 * Extends the Base class with the same input structure as Map
 * Creates and returns a fabricjs instance using the map factory function
 */
export class Schematic extends Base {
  constructor(container, options) {
    super(options);

    this.defaults = {
      showGrid: true,
      // Control whether zoom is applied around viewport center (true) or mouse position (false)
      zoomOnCenter: false
    };

    // set defaults
    Object.assign(this, this.defaults);

    // overwrite options
    Object.assign(this, this._options);

    this.container = container || document.body;
    
    // Store event listeners
    this.listeners = {};
    
    // Create a Map instance and get its fabric instance
    const mapInstance = new Map(this.container, options);
    this.fabric = mapInstance.fabric;
    this.mapInstance = mapInstance; // Store reference to map instance
    
    // Ensure initial grid alignment matches Fabric's centered origin (use viewport center in world coords)
    if (this.mapInstance && this.mapInstance.grid && this.fabric) {
      const alignInitialGrid = () => {
        const canvas = this.fabric;
        const vpt = canvas.viewportTransform;
        if (vpt) {
          const centerX = (canvas.width / 2 - vpt[4]) / vpt[0];
          const centerY = (canvas.height / 2 - vpt[5]) / vpt[3];
          const gridCenterY = -centerY;
          this.mapInstance.grid.updateViewport({ x: centerX, y: gridCenterY, zoom: this.mapInstance.zoom });
        } else {
          this.mapInstance.grid.updateViewport({ x: 0, y: 0, zoom: this.mapInstance.zoom });
        }
        this.mapInstance.grid.render();
        if (typeof canvas.requestRenderAll === 'function') canvas.requestRenderAll();
      };
      // Run after Fabric has completed its first render (double rAF for safety)
      const raf = (fn) => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(fn) : setTimeout(fn, 0));
      raf(() => raf(alignInitialGrid));
    }
    
    // Initialize zoom debounce properties
    this.zoomDebounceTimeout = null;
    this.zoomDebounceDelay = options?.zoomDebounceDelay || 200; // ms
    // Debug flag for event logging
    this.debugEvents = options?.debugEvents ?? true;
    if (this.debugEvents) console.log('[schematic] init', { interactions: options?.interactions !== false });
    // Expose instance for manual inspection
    if (typeof window !== 'undefined') {
      window.schematic = this;
    }
    
    // Register event listeners if interactions are enabled
    if (options?.interactions !== false) {
      this.registerEventListeners();
    }
  }

  // Set the screen position of the world origin (0,0) and update grid
  setOriginScreen(x, y) {
    const canvas = this.fabric;
    if (!canvas) return;
    const vpt = canvas.viewportTransform ? canvas.viewportTransform.slice() : [1, 0, 0, 1, 0, 0];
    vpt[4] = x;
    vpt[5] = y;
    canvas.setViewportTransform(vpt);

    // Update grid state with viewport center in world coords (Y inverted for grid)
    // Do NOT render the grid here; let Fabric's 'before:render' hook draw it underneath objects
    const centerX = (canvas.width / 2 - vpt[4]) / vpt[0];
    const centerY = (canvas.height / 2 - vpt[5]) / vpt[3];
    const gridCenterY = -centerY;
    if (this.mapInstance && this.mapInstance.grid) {
      this.mapInstance.grid.updateViewport({ x: centerX, y: gridCenterY, zoom: this.mapInstance.zoom });
    }
    // Trigger Map's standard update pipeline so grid renders under objects
    if (this.mapInstance && typeof this.mapInstance.update === 'function') {
      this.mapInstance.update();
    }
    if (typeof canvas.requestRenderAll === 'function') canvas.requestRenderAll();
    if (typeof this.emit === 'function') this.emit('origin:change', { screen: { x, y } });
  }

  // Get the current screen position of world origin (0,0)
  getOriginScreen() {
    const canvas = this.fabric;
    const vpt = canvas && canvas.viewportTransform;
    return { x: vpt ? vpt[4] : (canvas ? canvas.width / 2 : 0), y: vpt ? vpt[5] : (canvas ? canvas.height / 2 : 0) };
  }

  // Pin origin to a viewport location with optional margin
  // pin: 'NONE' | 'CENTER' | 'TOP_LEFT' | 'TOP_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT'
  setOriginPin(pin = 'CENTER', margin = 0) {
    const canvas = this.fabric;
    if (!canvas) return;
    // Track active pin settings
    this.originPin = pin;
    this.originPinMargin = margin;
    // If a pan is in progress, cancel it when pinning becomes active
    if (pin && pin !== 'NONE' && this.isPanning) {
      if (this.debugEvents) console.log('[drag] cancel ongoing pan due to pin activation');
      this.isPanning = false;
      this.fabric.defaultCursor = 'default';
      if (this._prevSkipTargetFind !== undefined) {
        this.fabric.skipTargetFind = this._prevSkipTargetFind;
        this._prevSkipTargetFind = undefined;
      }
      if (this._prevSelection !== undefined) {
        this.fabric.selection = this._prevSelection;
        this._prevSelection = undefined;
      }
      this.emit('pan:completed');
    }
    const w = canvas.width, h = canvas.height;
    let x, y;
    switch (pin) {
      case 'TOP_LEFT':
        x = margin; y = margin; break;
      case 'TOP_RIGHT':
        x = w - margin; y = margin; break;
      case 'BOTTOM_LEFT':
        x = margin; y = h - margin; break;
      case 'BOTTOM_RIGHT':
        x = w - margin; y = h - margin; break;
      case 'CENTER':
        x = w / 2; y = h / 2; break;
      case 'NONE':
      default:
        return; // no change
    }
    this.setOriginScreen(x, y);
    if (typeof this.emit === 'function') this.emit('grid:change');
  }

  // Convenience to center the origin
  setOriginToCenter() {
    const canvas = this.fabric;
    if (!canvas) return;
    this.setOriginScreen(canvas.width / 2, canvas.height / 2);
  }

  /**
   * Add an event listener
   * @param {string} eventName - Name of the event to listen for
   * @param {Function} callback - Function to be called when the event is emitted
   * @param {Object} context - Context in which the callback should be executed
   * @return {Schematic} - Returns this Schematic instance for chaining
   */
  on(eventName, callback, context) {
    // Connect to fabric's event system directly if it exists
    if (this.fabric && typeof this.fabric.on === 'function') {
      this.fabric.on(eventName, callback.bind(context || this));
    }
    
    // Also store in our local event system
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    
    this.listeners[eventName].push({
      callback,
      context: context || this
    });
    
    return this;
  }

  /**
   * Remove an event listener
   * @param {string} eventName - Name of the event to remove listener from
   * @param {Function} callback - Function to be removed
   * @param {Object} context - Context of the callback to be removed
   * @return {Schematic} - Returns this Schematic instance for chaining
   */
  off(eventName, callback, context) {
    if (!this.listeners[eventName]) {
      return this;
    }
    
    // If no callback specified, remove all listeners for this event
    if (!callback) {
      delete this.listeners[eventName];
      return this;
    }
    
    // Filter out the specific callback
    this.listeners[eventName] = this.listeners[eventName].filter(listener => {
      return callback !== listener.callback || 
             (context && context !== listener.context);
    });
    
    // Remove empty event arrays
    if (this.listeners[eventName].length === 0) {
      delete this.listeners[eventName];
    }
    
    return this;
  }

  /**
   * Emit an event to all listeners
   * @param {string} eventName - Name of the event to emit
   * @param {...any} args - Arguments to pass to the listener callbacks
   * @return {Schematic} - Returns this Schematic instance for chaining
   */
  emit(eventName, ...args) {
    if (!this.listeners[eventName]) {
      return this;
    }
    
    const listeners = [...this.listeners[eventName]];
    
    for (const listener of listeners) {
      listener.callback.apply(listener.context, args);
    }
    
    return this;
  }

  /**
   * Add a one-time event listener
   * @param {string} eventName - Name of the event to listen for once
   * @param {Function} callback - Function to be called when the event is emitted
   * @param {Object} context - Context in which the callback should be executed
   * @return {Schematic} - Returns this Schematic instance for chaining
   */
  once(eventName, callback, context) {
    const onceCallback = (...args) => {
      this.off(eventName, onceCallback);
      callback.apply(context || this, args);
    };
    
    return this.on(eventName, onceCallback, this);
  }

  /**
   * Clear all event listeners
   * @return {Schematic} - Returns this Schematic instance for chaining
   */
  clearAllListeners() {
    this.listeners = {};
    return this;
  }

  /**
   * Toggle grid visibility by adding/removing the map's grid
   * Grid manages its own state; only width/height/center/zoom are needed
   */

  /**
   * Show or hide the grid
   * @param {boolean} visible - Whether the grid should be visible
   * @return {Schematic} - Returns this Schematic instance for chaining
   */
  showGrid(visible) {
    // Add grid when turning on
    if (visible && this.mapInstance && !this.mapInstance.grid) {
      this.mapInstance.addGrid();
      // Ensure grid starts with correct viewport
      this.mapInstance.update();
    }
    // Remove grid when turning off
    if (!visible && this.mapInstance && this.mapInstance.grid) {
      this.mapInstance.grid = null;
      // Trigger a render so the cleared background shows
      if (this.fabric && typeof this.fabric.requestRenderAll === 'function') {
        this.fabric.requestRenderAll();
      }
    }

    return this;
  }
  
  /**
   * Register event listeners for map interactions
   * @return {Schematic} - Returns this Schematic instance for chaining
   */
  registerEventListeners() {
    // Only register if we have a map instance
    if (!this.fabric || !this.mapInstance) return this;
    
    // Register mouse wheel event for zooming
    this.fabric.on('mouse:wheel', this.handleMouseWheel.bind(this));
    
    // Variables to track right-click panning
    this.isPanning = false;
    this.lastPosX = 0;
    this.lastPosY = 0;
    
    // Register mouse events for right-click panning
    if (this.debugEvents) console.log('[events] registering fabric mouse handlers');

    const isSecondary = (e) => e && (
      e.button === 2 || // standard right click
      e.buttons === 2 || // two-finger/right-click may report via buttons mask
      e.which === 3  || // some browsers
      (e.ctrlKey && e.button === 0) // ctrl+left on macOS
    );

    this.fabric.on('mouse:down', (opt) => {
      if (this.debugEvents) console.log('[fabric] mouse:down', {
        button: opt?.e?.button,
        buttons: opt?.e?.buttons,
        which: opt?.e?.which,
        ctrlKey: !!opt?.e?.ctrlKey,
        metaKey: !!opt?.e?.metaKey,
        altKey: !!opt?.e?.altKey,
        shiftKey: !!opt?.e?.shiftKey,
        x: opt?.e?.clientX,
        y: opt?.e?.clientY
      });
      // Check if it's a right-click / secondary click
      if (isSecondary(opt.e)) {
        // Block panning while an origin pin is active
        if (this.originPin && this.originPin !== 'NONE') {
          if (this.debugEvents) console.log('[drag] pan blocked due to pinned origin', { originPin: this.originPin });
          return;
        }
        if (this.debugEvents) console.log('[drag] mouse:down', { button: opt.e.button, x: opt.e.clientX, y: opt.e.clientY });
        this.isPanning = true;
        this.lastPosX = opt.e.clientX;
        this.lastPosY = opt.e.clientY;
        this.fabric.defaultCursor = 'grabbing';
        // Disable selection/target finding during pan
        this._prevSkipTargetFind = this.fabric.skipTargetFind;
        this.fabric.skipTargetFind = true;
        this._prevSelection = this.fabric.selection;
        this.fabric.selection = false;
        // If pan initiated by ctrl+left (macOS secondary), suppress the next contextmenu
        this._suppressNextContextMenu = !!opt.e.ctrlKey && opt.e.button === 0;
        if (this.debugEvents) console.log('[drag] start panning', { lastPosX: this.lastPosX, lastPosY: this.lastPosY });
      }
    });
    
    this.fabric.on('mouse:move', (opt) => {
      // if (this.debugEvents) console.log('[fabric] mouse:move', { x: opt.e.clientX, y: opt.e.clientY });
      if (this.isPanning) {
        const deltaX = opt.e.clientX - this.lastPosX;
        const deltaY = opt.e.clientY - this.lastPosY;
        // if (this.debugEvents) console.log('[drag] mouse:move', { deltaX, deltaY, from: { x: this.lastPosX, y: this.lastPosY }, to: { x: opt.e.clientX, y: opt.e.clientY } });
        
        // Update last position
        this.lastPosX = opt.e.clientX;
        this.lastPosY = opt.e.clientY;
        
        // Pan the fabric canvas
        this.fabric.relativePan(new fabric.Point(deltaX, deltaY));
        if (typeof this.fabric.requestRenderAll === 'function') this.fabric.requestRenderAll();
        
        // Update the map to refresh the grid position after panning
        if (this.mapInstance) {
          this.mapInstance.update();
        }
        
        // Emit a pan event
        this.emit('pan:move', { deltaX, deltaY });
      }
    });
    
    this.fabric.on('mouse:up', (opt) => {
      if (this.debugEvents) console.log('[fabric] mouse:up', {
        button: opt?.e?.button,
        buttons: opt?.e?.buttons,
        which: opt?.e?.which,
        ctrlKey: !!opt?.e?.ctrlKey,
        metaKey: !!opt?.e?.metaKey,
        altKey: !!opt?.e?.altKey,
        shiftKey: !!opt?.e?.shiftKey
      });
      if (this.isPanning) {
        if (this.debugEvents) console.log('[drag] mouse:up - end panning');
        this.isPanning = false;
        this.fabric.defaultCursor = 'default';
        // Clear any pending contextmenu suppression
        this._suppressNextContextMenu = false;
        // Restore selection/target finding
        if (this._prevSkipTargetFind !== undefined) {
          this.fabric.skipTargetFind = this._prevSkipTargetFind;
          this._prevSkipTargetFind = undefined;
        }
        if (this._prevSelection !== undefined) {
          this.fabric.selection = this._prevSelection;
          this._prevSelection = undefined;
        }
        
        // Final grid update when panning completes
        if (this.mapInstance) {
          this.mapInstance.update();
        }
        
        this.emit('pan:completed');
      }
    });
    
    // Handle cases where the mouse leaves the canvas during panning
    this.fabric.on('mouse:out', (opt) => {
      const relatedTarget = opt?.e?.relatedTarget || null;
      if (this.debugEvents) console.log('[fabric] mouse:out', {
        relatedTarget,
        button: opt?.e?.button,
        buttons: opt?.e?.buttons,
        which: opt?.e?.which,
        ctrlKey: !!opt?.e?.ctrlKey,
        metaKey: !!opt?.e?.metaKey
      });
      // Only cancel when actually leaving the canvas element (e.g., into <body> or outside)
      const domEl = this.fabric && (this.fabric.upperCanvasEl || this.fabric.lowerCanvasEl || (this.fabric.getElement && this.fabric.getElement()));
      const leavingCanvas = !!relatedTarget && (relatedTarget === document.body || (domEl && !domEl.contains(relatedTarget)));
      if (this.isPanning && leavingCanvas) {
        if (this.debugEvents) console.log('[drag] mouse:out - cancel panning');
        this.isPanning = false;
        this.fabric.defaultCursor = 'default';
        // Clear any pending contextmenu suppression
        this._suppressNextContextMenu = false;
        // Restore selection/target finding
        if (this._prevSkipTargetFind !== undefined) {
          this.fabric.skipTargetFind = this._prevSkipTargetFind;
          this._prevSkipTargetFind = undefined;
        }
        if (this._prevSelection !== undefined) {
          this.fabric.selection = this._prevSelection;
          this._prevSelection = undefined;
        }
        
        // Final grid update when mouse leaves during panning
        if (this.mapInstance) {
          this.mapInstance.update();
        }
        
        this.emit('pan:completed');
      }
    });
    
    // Prevent context menu on right-click for panning
    if (this.container) {
      this.container.addEventListener('contextmenu', (e) => {
        if (this.debugEvents) console.log('[drag] contextmenu prevented', {
          button: e.button,
          buttons: e.buttons,
          which: e.which,
          ctrlKey: !!e.ctrlKey,
          metaKey: !!e.metaKey,
          altKey: !!e.altKey,
          shiftKey: !!e.shiftKey,
          pointerType: e.pointerType,
          detail: e.detail
        });
        e.preventDefault();
        e.stopPropagation();
        // If we intentionally started pan via ctrl+click, do not cancel here; just suppress the menu
        if (this._suppressNextContextMenu) {
          return false;
        }
        return false;
      }, false);
    }

    // One-time render confirmation
    const onceAfterRender = () => {
      if (this.debugEvents) console.log('[fabric] after:render (once)');
      this.fabric.off('after:render', onceAfterRender);
    };
    this.fabric.on('after:render', onceAfterRender);

    // DOM-level fallback listeners on Fabric canvas element
    const domEl = this.fabric && (this.fabric.upperCanvasEl || this.fabric.lowerCanvasEl || this.fabric.getElement && this.fabric.getElement());
    if (domEl) {
      if (this.debugEvents) console.log('[dom] attaching mouse listeners to canvas element');
      const isDomSecondary = (e) => (
        e.button === 2 ||
        e.buttons === 2 ||
        e.which === 3 ||
        (e.ctrlKey && e.button === 0)
      );

      domEl.addEventListener('contextmenu', (e) => {
        if (this.debugEvents) console.log('[dom] contextmenu prevented on canvas', {
          button: e.button,
          buttons: e.buttons,
          which: e.which,
          ctrlKey: !!e.ctrlKey,
          metaKey: !!e.metaKey,
          altKey: !!e.altKey,
          shiftKey: !!e.shiftKey,
          pointerType: e.pointerType,
          detail: e.detail
        });
        e.preventDefault();
        e.stopPropagation();
        // If we intentionally started pan via ctrl+click, do not cancel here; just suppress the menu
        if (this._suppressNextContextMenu) {
          return false;
        }
        return false;
      });

      // Minimal prevention to keep ctrl+click and two-finger/right-click drags delivering move events
      domEl.addEventListener('mousedown', (e) => {
        const isCtrlPrimary = e.ctrlKey && e.button === 0;
        const isSecondaryBtn = e.button === 2; // two-finger/right-click
        if (this.debugEvents) console.log('[dom] mousedown', {
          button: e.button,
          buttons: e.buttons,
          which: e.which,
          ctrlKey: !!e.ctrlKey,
          metaKey: !!e.metaKey,
          altKey: !!e.altKey,
          shiftKey: !!e.shiftKey,
          isCtrlPrimary,
          isSecondaryBtn
        });
        if (isCtrlPrimary || isSecondaryBtn) {
          if (this.debugEvents) console.log('[dom] mousedown (no preventDefault) — will suppress upcoming contextmenu', { ctrlPrimary: isCtrlPrimary, secondaryBtn: isSecondaryBtn });
          // Suppress upcoming contextmenu so it doesn't cancel our pan, but let Fabric receive mousedown
          this._suppressNextContextMenu = true;
        }
      }, true); // capture to run before default handlers
      
    } else if (this.debugEvents) {
      console.warn('[dom] fabric canvas element not found for DOM listeners');
    }
    
    return this;
  }
  
  /**
   * Handle mouse wheel events for zooming
   * @param {Object} opt - Event options from Fabric.js
   * @private
   */
  handleMouseWheel(opt) {
    if (!this.mapInstance) return;
    
    // Prevent default scrolling behavior
    opt.e.preventDefault();
    opt.e.stopPropagation();
    
    // Calculate zoom change based on wheel delta
    const zoomFactor = 1.05;
    const direction = opt.e.deltaY < 0 ? 1 : -1;
    
    // Update the zoom level in the Map instance
    if (this.mapInstance) {
      // Calculate the new zoom level based on wheel direction
      const currentZoom = this.mapInstance.zoom;
      const newZoom = direction > 0 ? currentZoom * zoomFactor : currentZoom / zoomFactor;
      // Clamp the zoom level to the configured limits
      const clampedZoom = Math.max(this.mapInstance.minZoom, Math.min(newZoom, this.mapInstance.maxZoom));

      // Apply zoom
      // If Alt/Option is held, zoom around the mouse position to keep it stationary.
      // Otherwise, preserve existing behavior (anchor at screen position of world origin).
      this.mapInstance.zoom = clampedZoom;
      const canvas = this.fabric;
      const vptBefore = canvas.viewportTransform;
      let point;
      if (opt.e.altKey) {
        const el = (canvas.getElement && canvas.getElement()) || canvas.upperCanvasEl || canvas.lowerCanvasEl;
        const rect = el.getBoundingClientRect();
        const px = opt.e.clientX - rect.left;
        const py = opt.e.clientY - rect.top;
        point = new fabric.Point(px, py);
      } else {
        const originScreenX = vptBefore ? vptBefore[4] : canvas.width / 2;
        const originScreenY = vptBefore ? vptBefore[5] : canvas.height / 2;
        point = new fabric.Point(originScreenX, originScreenY);
      }
      canvas.zoomToPoint(point, clampedZoom);

      // Update grid viewport to reflect new transform (viewport center in world coords)
      const vptAfter = canvas.viewportTransform;
      if (this.mapInstance.grid) {
        if (vptAfter) {
          const centerX = (canvas.width / 2 - vptAfter[4]) / vptAfter[0];
          const centerY = (canvas.height / 2 - vptAfter[5]) / vptAfter[3];
          const gridCenterY = -centerY;
          this.mapInstance.grid.updateViewport({ x: centerX, y: gridCenterY, zoom: clampedZoom });
        } else {
          this.mapInstance.grid.updateViewport({ x: 0, y: 0, zoom: clampedZoom });
        }
        this.mapInstance.grid.render();
      }

      if (typeof canvas.requestRenderAll === 'function') canvas.requestRenderAll();

      // Emit zoom events so UIs can update immediately
      this.emit('zoom', { zoom: clampedZoom });
      this.emit('zoom:change', { zoom: clampedZoom });
    }
    
    // Clear any existing timeout to reset debounce timer
    if (this.zoomDebounceTimeout) {
      clearTimeout(this.zoomDebounceTimeout);
    }
    
    // Set a timeout for final update after zooming stops
    this.zoomDebounceTimeout = setTimeout(() => {
      if (this.mapInstance) {
        if (this.zoomOnCenter) {
          // Existing behavior: allow Map to perform its update
          this.mapInstance.update();
        } else {
          // Recompute grid alignment based on current viewport without re-centering
          const canvas = this.fabric;
          const vpt = canvas.viewportTransform;
          if (this.mapInstance.grid) {
            if (vpt) {
              const centerX = (canvas.width / 2 - vpt[4]) / vpt[0];
              const centerY = (canvas.height / 2 - vpt[5]) / vpt[3];
              const gridCenterY = -centerY;
              this.mapInstance.grid.updateViewport({ x: centerX, y: gridCenterY, zoom: this.mapInstance.zoom });
            } else {
              this.mapInstance.grid.updateViewport({ x: 0, y: 0, zoom: this.mapInstance.zoom });
            }
            this.mapInstance.grid.render();
          }
        }
        // Force a complete redraw to ensure everything is rendered properly
        this.fabric.requestRenderAll();
      }
      // Fire an event that zooming has completed
      this.emit('zoom:completed', { zoom: this.mapInstance.zoom });
    }, this.zoomDebounceDelay);
  }
  
  /**
   * Set the map's zoom level
   * @param {number} zoom - Zoom level to set
   * @return {Schematic} - Returns this Schematic instance for chaining
   */
  setZoom(zoom) {
    if (this.mapInstance) {
      this.mapInstance.setZoom(zoom);
      
      // After setting zoom, make sure grid is properly positioned based on viewport transform
      this.mapInstance.update();
      
      this.emit('zoom:change', { zoom: this.mapInstance.zoom });
    }
    return this;
  }
  
  /**
   * Set minimum and maximum zoom levels
   * @param {number} min - Minimum zoom level
   * @param {number} max - Maximum zoom level
   * @return {Schematic} - Returns this Schematic instance for chaining
   */
  setZoomLimits(min, max) {
    if (this.mapInstance) {
      // Ensure valid values
      const minZoom = Math.max(0.01, min || 0.01);
      const maxZoom = Math.max(minZoom + 0.01, max || 20);
      
      this.mapInstance.minZoom = minZoom;
      this.mapInstance.maxZoom = maxZoom;
      
      // Constrain current zoom if needed
      const currentZoom = this.mapInstance.zoom;
      if (currentZoom < minZoom || currentZoom > maxZoom) {
        this.setZoom(Math.max(minZoom, Math.min(maxZoom, currentZoom)));
      }
      
      this.mapInstance.update();
    }
    return this;
  }
  
  /**
   * Reset the view to initial state
   * @return {Schematic} - Returns this Schematic instance for chaining
   */
  resetView() {
    if (this.mapInstance && this.mapInstance.reset) {
      this.mapInstance.reset();
      this.mapInstance.update();
      this.emit('view:reset');
    }
    return this;
  }
  
  /**
   * Add an object to the map
   * @param {Object} object - Fabric.js object to add
   * @return {Object} - The added object
   */
  addObject(object) {
    if (this.mapInstance) {
      return this.mapInstance.addObject(object);
    }
    return null;
  }
  
  /**
   * Remove an object from the map
   * @param {Object} object - Fabric.js object to remove
   * @return {Object} - The removed object
   */
  removeObject(object) {
    if (this.mapInstance) {
      return this.mapInstance.removeObject(object);
    }
    return null;
  }
}

/**
 * Factory function to create a new Schematic instance and return its fabric instance
 * @param {HTMLElement} container - DOM element to associate with the schematic
 * @param {Object} options - Options for the schematic instance
 * @return {fabric.Canvas} - The fabric.js canvas instance from the schematic
 */
export const schematic = (container, options) => {
  const schematicInstance = new Schematic(container, options);
  return schematicInstance.fabric;
};
