import Base from './Base.js';
import { Map } from '../map/Map.js';
import GridControl from '../grid/GridControl.js';

/**
 * Schematic class for handling event subscriptions and emissions
 * Extends the Base class with the same input structure as Map
 * Creates and returns a fabricjs instance using the map factory function
 */
export class Schematic extends Base {
  constructor(container, options) {
    super(options);

    this.defaults = {
      showGrid: true
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
    
    // Create a grid control instance
    this.gridControl = new GridControl(options && options.grid);
    
    // Initialize zoom debounce properties
    this.zoomDebounceTimeout = null;
    this.zoomDebounceDelay = options?.zoomDebounceDelay || 200; // ms
    
    // Register event listeners if interactions are enabled
    if (options?.interactions !== false) {
      this.registerEventListeners();
    }
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
   * Update grid control settings
   * @param {Object} gridOptions - Grid options to update
   * @return {Schematic} - Returns this Schematic instance for chaining
   */
  updateGridControl(gridOptions) {
    this.gridControl.update(gridOptions);
    
    // If the map has a grid, apply the settings immediately
    if (this.mapInstance && this.mapInstance.grid) {
      this.applyGridControl();
    }
    
    return this;
  }

  /**
   * Apply the current grid control settings to the map's grid
   * @return {Schematic} - Returns this Schematic instance for chaining
   */
  applyGridControl() {
    if (this.mapInstance && this.mapInstance.grid) {
      this.gridControl.applyToGrid(this.mapInstance.grid);
      this.mapInstance.grid.render();
    }
    return this;
  }

  /**
   * Show or hide the grid
   * @param {boolean} visible - Whether the grid should be visible
   * @return {Schematic} - Returns this Schematic instance for chaining
   */
  showGrid(visible) {
    this.gridControl.setVisible(visible);
    
    // If true and grid doesn't exist yet, create it
    if (visible && this.mapInstance && !this.mapInstance.grid) {
      this.mapInstance.addGrid();
      this.applyGridControl();
    } else if (this.mapInstance && this.mapInstance.grid) {
      // If the grid exists, just apply the visibility setting
      this.applyGridControl();
    }
    
    return this;
  }

  /**
   * Get the current grid control instance
   * @return {GridControl} - The grid control instance
   */
  getGridControl() {
    return this.gridControl;
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
    
    // Prevent context menu on right-click for panning
    if (this.container) {
      this.container.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
      }, false);
    }
    
    // Register mouse events for right-click panning
    this.fabric.on('mouse:down', (opt) => {
      // Check if it's a right-click (button 3)
      if (opt.e.button === 2) {
        this.isPanning = true;
        this.lastPosX = opt.e.clientX;
        this.lastPosY = opt.e.clientY;
        this.fabric.defaultCursor = 'grabbing';
      }
    });
    
    this.fabric.on('mouse:move', (opt) => {
      if (this.isPanning) {
        const deltaX = opt.e.clientX - this.lastPosX;
        const deltaY = opt.e.clientY - this.lastPosY;
        
        // Update last position
        this.lastPosX = opt.e.clientX;
        this.lastPosY = opt.e.clientY;
        
        // Pan the fabric canvas
        this.fabric.relativePan(new fabric.Point(deltaX, deltaY));
        
        // Update the map to refresh the grid position after panning
        if (this.mapInstance) {
          this.mapInstance.update();
        }
        
        // Emit a pan event
        this.emit('pan:move', { deltaX, deltaY });
      }
    });
    
    this.fabric.on('mouse:up', () => {
      if (this.isPanning) {
        this.isPanning = false;
        this.fabric.defaultCursor = 'default';
        
        // Final grid update when panning completes
        if (this.mapInstance) {
          this.mapInstance.update();
        }
        
        this.emit('pan:completed');
      }
    });
    
    // Handle cases where the mouse leaves the canvas during panning
    this.fabric.on('mouse:out', () => {
      if (this.isPanning) {
        this.isPanning = false;
        this.fabric.defaultCursor = 'default';
        
        // Final grid update when mouse leaves during panning
        if (this.mapInstance) {
          this.mapInstance.update();
        }
        
        this.emit('pan:completed');
      }
    });
    
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
      const newZoom = direction > 0
        ? currentZoom * zoomFactor
        : currentZoom / zoomFactor;
      
      // Clamp the zoom level to the configured limits
      const clampedZoom = Math.max(
        this.mapInstance.minZoom,
        Math.min(newZoom, this.mapInstance.maxZoom)
      );
      
      // Apply the new zoom level to the Map instance
      this.mapInstance.zoom = clampedZoom;
      
      // Update the map which will recalculate grid position based on current viewport
      this.mapInstance.update();
      
      // Emit a zoom event with the new zoom level
      this.emit('zoom', { zoom: clampedZoom });
    }
    
    // Clear any existing timeout to reset debounce timer
    if (this.zoomDebounceTimeout) {
      clearTimeout(this.zoomDebounceTimeout);
    }
    
    // Set a timeout for final update after zooming stops
    this.zoomDebounceTimeout = setTimeout(() => {
      // Ensure grid is properly aligned after zoom completed
      if (this.mapInstance) {
        // Use the map's update method which will correctly calculate the grid position
        // based on the current viewport transform
        this.mapInstance.update();
        
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
