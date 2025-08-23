import Base from '../core/Base.js';
import { Point } from '../geometry/Point.js';
import gridStyle from './gridStyle.js';
import { clamp } from '../lib/mumath/index.js';

/**
 * GridControl class for managing grid drawing configuration
 * Used to control where and how the grid is drawn on a Map
 * Contains all grid state, defaults, and styling information
 */
export class GridControl extends Base {
  constructor(options) {
    super(options);

    // Initialize state object
    this.state = {};
    
    // Set defaults and apply options
    this.setDefaults();
    
    // Apply any provided options
    this.update(options);
  }

  /**
   * Sets all default values for the grid control
   * Incorporates all settings from Grid class
   */
  setDefaults() {
    this.pixelRatio = window.devicePixelRatio;
    this.enabled = true;
    this.autostart = true;
    this.interactions = true;
    
    this.defaults = Object.assign(
      {
        // Base visibility controls
        enabled: true,           // whether grid is visible at all
        showAxisX: true,         // show X axis
        showAxisY: true,         // show Y axis
        showLabels: true,        // show value labels on grid
        
        // Core type settings
        type: 'linear',
        name: '',
        units: '',
        
        // Coordinate system settings
        state: {},

        // Visible range params
        minZoom: -Infinity,
        maxZoom: Infinity,
        min: -Infinity,
        max: Infinity,
        offset: 0,
        origin: 0.5,
        
        // Center and zoom controls
        center: {
          x: 0,
          y: 0,
          zoom: 1
        },
        zoom: 1,
        zoomEnabled: true,
        panEnabled: true,

        // Labels configuration
        labels: true,
        fontSize: '11pt',
        fontFamily: 'sans-serif',
        padding: 0,
        color: 'rgb(0,0,0,1)',
        labelColor: 'rgba(0, 0, 0, 0.6)',

        // Grid lines parameters
        lines: true,
        tick: 8,
        tickAlign: 0.5,
        lineWidth: 1,
        distance: 13,
        style: 'lines',
        lineColor: 'rgba(0, 0, 0, 0.4)',

        // Axis parameters
        axis: true,
        axisOrigin: 0,           // Point where axis crosses
        axisWidth: 2,
        axisColor: 'rgba(0, 0, 0, 0.8)',
        
        // Grid dimensions
        width: 0,
        height: 0,
        
        // Drawing multiplier - how many widths and heights to draw
        // from the origin, helps when panning
        multiplier: 4,           // 4x width and height by zoom level
        
        // Grid thresholds
        minSpacing: 20,          // minimum spacing (for auto-adjustment)
        maxSpacing: 200,         // maximum spacing (for auto-adjustment)
        
        // Format function for labels
        format: v => v
      },
      gridStyle,
      this._options
    );

    // Set all default properties on this object
    Object.assign(this, this.defaults);
    
    // Ensure center is a Point object
    this.center = new Point(this.center);
  }

  /**
   * Updates grid settings and recalculates state if needed
   * @param {Object} options - Grid control options to update
   * @return {GridControl} - This instance for chaining
   */
  update(options) {
    if (!options) options = {};
    
    // Apply new options
    Object.assign(this, options);
    
    // Update state if dimensions are available
    if (this.width && this.height) {
      this.updateState();
    }
    
    return this;
  }
  
  /**
   * Updates the internal state of the grid based on current settings
   * @return {GridControl} - This instance for chaining
   */
  updateState() {
    const shape = [this.width, this.height];
    
    // Initialize axis state if needed
    if (!this.state.x) {
      this.state.x = { 
        coordinate: {
          orientation: 'x',
          offset: this.center.x,
          zoom: 1 / this.center.zoom,
          axis: this.showAxisX,
          axisOrigin: this.axisOrigin,
          getRatio: (value, state) => (value - state.offset) / state.range
        },
        shape,
        lineWidth: this.lineWidth,
        axisWidth: this.axisWidth,
        lineColor: this.lineColor,
        axisColor: this.axisColor,
        fontSize: this.fontSize,
        fontFamily: this.fontFamily,
        labelColor: this.labelColor,
        labels: this.showLabels ? [] : null,
        lines: [],
        lineColors: [],
        padding: [0, 0, 0, 0]
      };
    }
    
    if (!this.state.y) {
      this.state.y = { 
        coordinate: {
          orientation: 'y',
          offset: this.center.y,
          zoom: 1 / this.center.zoom,
          axis: this.showAxisY,
          axisOrigin: this.axisOrigin,
          getRatio: (value, state) => 1 - (value - state.offset) / state.range
        },
        shape,
        lineWidth: this.lineWidth,
        axisWidth: this.axisWidth,
        lineColor: this.lineColor,
        axisColor: this.axisColor,
        fontSize: this.fontSize,
        fontFamily: this.fontFamily,
        labelColor: this.labelColor,
        labels: this.showLabels ? [] : null,
        lines: [],
        lineColors: [],
        padding: [0, 0, 0, 0]
      };
    }
    
    // Update existing state properties
    this.state.x.shape = shape;
    this.state.y.shape = shape;
    
    // Update coordinate system properties
    this.state.x.coordinate.offset = this.center.x;
    this.state.x.coordinate.zoom = 1 / this.center.zoom;
    this.state.x.coordinate.axis = this.showAxisX;
    
    this.state.y.coordinate.offset = this.center.y;
    this.state.y.coordinate.zoom = 1 / this.center.zoom;
    this.state.y.coordinate.axis = this.showAxisY;
    
    // Update style properties
    this.state.x.lineWidth = this.lineWidth;
    this.state.y.lineWidth = this.lineWidth;
    this.state.x.axisWidth = this.axisWidth;
    this.state.y.axisWidth = this.axisWidth;
    this.state.x.lineColor = this.lineColor;
    this.state.y.lineColor = this.lineColor;
    this.state.x.axisColor = this.axisColor;
    this.state.y.axisColor = this.axisColor;
    
    // Update font properties
    this.state.x.fontSize = this.fontSize;
    this.state.y.fontSize = this.fontSize;
    this.state.x.fontFamily = this.fontFamily;
    this.state.y.fontFamily = this.fontFamily;
    this.state.x.labelColor = this.labelColor;
    this.state.y.labelColor = this.labelColor;
    
    // Update label visibility
    this.state.x.labels = this.showLabels ? this.state.x.labels : null;
    this.state.y.labels = this.showLabels ? this.state.y.labels : null;
    
    // Link the axes to each other
    this.state.x.opposite = this.state.y;
    this.state.y.opposite = this.state.x;
    
    return this;
  }

  /**
   * Sets the visibility of the grid
   * @param {boolean} visible - Whether the grid should be visible
   * @return {GridControl} - This instance for chaining
   */
  setVisible(visible) {
    this.enabled = visible;
    return this;
  }
  

  /**
   * Apply this grid control's settings to a grid instance
   * @param {Grid} grid - The grid instance to apply settings to
   * @return {GridControl} - This instance for chaining
   */
  applyToGrid(grid) {
    if (!grid) return this;
    
    // Apply core settings
    grid.pixelRatio = this.pixelRatio;
    grid.autostart = this.autostart;
    grid.interactions = this.interactions;
    grid.width = this.width;
    grid.height = this.height;
    
    // Apply type settings
    grid.type = this.type;
    grid.name = this.name;
    grid.units = this.units;
    
    // Apply range settings
    grid.minZoom = this.minZoom;
    grid.maxZoom = this.maxZoom;
    grid.min = this.min;
    grid.max = this.max;
    grid.offset = this.offset;
    grid.origin = this.origin;
    grid.zoom = this.zoom;
    grid.zoomEnabled = this.zoomEnabled;
    grid.panEnabled = this.panEnabled;
    
    // Apply center position and zoom
    if (this.center) {
      grid.center.x = this.center.x;
      grid.center.y = this.center.y;
    }
    
    // Apply X axis settings
    grid.axisX.type = this.type;
    grid.axisX.axis = this.showAxisX;
    grid.axisX.lines = this.lines;
    grid.axisX.labels = this.showLabels;
    grid.axisX.tick = this.tick;
    grid.axisX.tickAlign = this.tickAlign;
    grid.axisX.lineWidth = this.lineWidth;
    grid.axisX.distance = this.distance;
    grid.axisX.style = this.style;
    grid.axisX.lineColor = this.lineColor;
    grid.axisX.axisOrigin = this.axisOrigin;
    grid.axisX.axisWidth = this.axisWidth;
    grid.axisX.axisColor = this.axisColor;
    grid.axisX.offset = this.center.x;
    grid.axisX.zoom = 1 / this.center.zoom;
    grid.axisX.fontSize = this.fontSize;
    grid.axisX.fontFamily = this.fontFamily;
    grid.axisX.color = this.color;
    
    // Apply Y axis settings
    grid.axisY.type = this.type;
    grid.axisY.axis = this.showAxisY;
    grid.axisY.lines = this.lines;
    grid.axisY.labels = this.showLabels;
    grid.axisY.tick = this.tick;
    grid.axisY.tickAlign = this.tickAlign;
    grid.axisY.lineWidth = this.lineWidth;
    grid.axisY.distance = this.distance;
    grid.axisY.style = this.style;
    grid.axisY.lineColor = this.lineColor;
    grid.axisY.axisOrigin = this.axisOrigin;
    grid.axisY.axisWidth = this.axisWidth;
    grid.axisY.axisColor = this.axisColor;
    grid.axisY.offset = this.center.y;
    grid.axisY.zoom = 1 / this.center.zoom;
    grid.axisY.fontSize = this.fontSize;
    grid.axisY.fontFamily = this.fontFamily;
    grid.axisY.color = this.color;
    
    // Update grid
    grid.update();
    
    return this;
  }
  
}

export default GridControl;
