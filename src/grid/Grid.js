import Base from '../core/Base.js';
import { clamp, almost } from '../lib/mumath/index.js';
import gridStyle from './gridStyle.js';
import Axis from './Axis.js';
import { Point } from '../geometry/Point.js';
import { 
  calcCoordinate, 
  getCenterCoords, 
  calculateTicksAndLabels, 
  calculateLineCoordinates,
  calculateAxisCoordinates,
  calculateLabelPosition,
  calculateTickPoints
} from './grid-calcs.js';
import {
  POINTS_PER_INCH,
  POINTS_PER_CM,
  calculateMaxZoom,
  calculateGridSpacing,
  calculateLabelDensity,
  formatValueByUnits,
  convertDistance,
  calculateMinZoomForDisplay
} from './grid-units.js';

/**
 * The Grid component uses the canvas element's 2D drawing context
 * to paint gridlines, axis, and labels. It displays a visible
 * coordinate reference without affecting Fabric.js objects.
 */
class Grid extends Base {
  // Canvas rendering context
  context = null;
  
  // State storage for x and y axes
  state = {};
  
  // Canvas dimensions
  width = 0;
  height = 0;
  
  // Device pixel ratio for high DPI displays
  pixelRatio = window.devicePixelRatio;
  
  // Grid behavior flags
  autostart = true;
  interactions = true;
  
  // Center position with zoom
  center = { x: 0, y: 0, zoom: 1 };
  
  // Axis objects for x and y dimensions
  axisX = null;
  axisY = null;
  
  // Unit conversion constants
  POINTS_PER_INCH = POINTS_PER_INCH; // Standard DTP points per inch
  POINTS_PER_CM = POINTS_PER_CM; // Points per centimeter (72/2.54)

  // Grid configuration
  type = 'linear';
  name = '';
  units = 'points'; // Default units: points, imperial, metric
  minZoom = -Infinity;
  maxZoom = Infinity;
  min = -Infinity;
  max = Infinity;
  offset = 0;
  origin = 0.5;
  zoom = 1;
  zoomEnabled = true;
  panEnabled = true;
  
  // Label settings
  labels = true;
  fontSize = '11pt';
  fontFamily = 'sans-serif';
  padding = 0;
  color = 'rgb(0,0,0,1)';
  
  // Line settings
  lines = true;
  tick = 8;
  tickAlign = 0.5;
  lineWidth = 1;
  distance = 13;
  style = 'lines';
  lineColor = 0.4;
  
  // Axis settings
  axis = true;
  axisOrigin = 0;
  axisWidth = 2;
  axisColor = 0.8;
  
  constructor(context, opts) {
    super(opts);
    this.context = context;
    
    // Immediate debug to verify grid-units.js integration
    console.log('[Grid-DEBUG] Grid class instantiated with units support');
    console.log('[Grid-DEBUG] Units module functions available:', {
      convertDistance: typeof convertDistance === 'function',
      formatValueByUnits: typeof formatValueByUnits === 'function',
      calculateGridSpacing: typeof calculateGridSpacing === 'function'
    });
    
    this.setDefaults();
    this.updateConfiguration(opts);
    
    // Force a units log
    console.log('[Grid-DEBUG] Initial units:', this.units);
  }

  render() {
    this.draw();
    return this;
  }

  getCenterCoords() {
    return getCenterCoords(this.state.x, this.state.y);
  }

  setSize(width, height) {
    this.width = width;
    this.height = height;
    this.updateConfiguration();
  }

  setWidth(width) {
    this.width = width;
    this.updateConfiguration();
  }

  setHeight(height) {
    this.height = height;
    this.updateConfiguration();
  }

  // re-evaluate lines, calc options for renderer based on configuration
  updateConfiguration(opts) {
    if (!opts) opts = {};
    const shape = [this.width, this.height];
    
    // Update grid spacing based on units and zoom level
    if (this.units && this.zoom) {
      console.log(`[Grid] Calculating optimal spacing for units: ${this.units}, zoom: ${this.zoom}`);
      const optimalSpacing = calculateGridSpacing(this.units, this.zoom, this.pixelRatio);
      console.log(`[Grid] Optimal spacing calculated: ${optimalSpacing}`);
      if (optimalSpacing > 0) {
        this.distance = optimalSpacing;
        console.log(`[Grid] Grid distance updated to: ${this.distance}`);
      }
    }

    // recalc state
    this.state.x = this.calcCoordinate(this.axisX, shape, this);
    this.state.y = this.calcCoordinate(this.axisY, shape, this);
    this.state.x.opposite = this.state.y;
    this.state.y.opposite = this.state.x;
    // emit('update') removed
    return this;
  }

  // re-evaluate lines, calc options for renderer based on viewport position
  updateViewport(center) {
    const shape = [this.width, this.height];
    Object.assign(this.center, center);
    // recalc state
    this.state.x = this.calcCoordinate(this.axisX, shape, this);
    this.state.y = this.calcCoordinate(this.axisY, shape, this);
    this.state.x.opposite = this.state.y;
    this.state.y.opposite = this.state.x;
    // emit('update') removed

    this.axisX.offset = center.x;
    this.axisX.zoom = 1 / center.zoom;

    this.axisY.offset = center.y;
    this.axisY.zoom = 1 / center.zoom;
  }

  // get state object with calculated params, ready for rendering
  calcCoordinate(coord, shape) {
    const state = calcCoordinate(coord, shape);
    state.grid = this;
    return state;
  }

  setDefaults() {
    // Create defaults object with basic axis functionality and applying grid styles
    const baseDefaults = {
      state: {},
      // Ensure a default color is present for calculations that depend on coord.color
      color: this.color || 'rgba(0,0,0,1)',
      
      // Geometry/viewport defaults expected by Axis/calculations
      zoom: 1,
      offset: 0,
      minZoom: -Infinity,
      maxZoom: Infinity,
      min: -Infinity,
      max: Infinity,
      axis: true,
      axisOrigin: 0,
      
      // Style defaults expected in grid-calcs and drawing
      padding: 0,
      tickAlign: 0.5,
      lineWidth: 1,
      axisWidth: 2,
      axisColor: 0.8,
      labels: true,
      lines: true,
      fontSize: '11pt',
      fontFamily: 'sans-serif',
      
      // Methods that will be overridden by specific axis implementations
      getCoords: () => [0, 0, 0, 0],
      getRatio: () => 0,
      format: v => v
    };
    
    // Apply grid style and user options
    this.defaults = Object.assign({}, baseDefaults, gridStyle, this._options);
    
    // Initialize axes
    this.axisX = Object.assign(new Axis('x', this.defaults), {
      orientation: 'x',
      offset: this.center.x,
      getCoords: (values, state) => {
        const coords = [];
        if (!values) return coords;
        for (let i = 0; i < values.length; i += 1) {
          const t = state.coordinate.getRatio(values[i], state);
          coords.push(t);
          coords.push(0);
          coords.push(t);
          coords.push(1);
        }
        return coords;
      },
      getRange: state => state.shape[0] * state.coordinate.zoom,
      getRatio: (value, state) => (value - state.offset) / state.range
    });
    
    this.axisY = Object.assign(new Axis('y', this.defaults), {
      orientation: 'y',
      offset: this.center.y,
      getCoords: (values, state) => {
        const coords = [];
        if (!values) return coords;
        for (let i = 0; i < values.length; i += 1) {
          const t = state.coordinate.getRatio(values[i], state);
          coords.push(0);
          coords.push(t);
          coords.push(1);
          coords.push(t);
        }
        return coords;
      },
      getRange: state => state.shape[1] * state.coordinate.zoom,
      getRatio: (value, state) => 1 - (value - state.offset) / state.range
    });
    
    // Apply any remaining options
    if (this._options) {
      Object.assign(this, this._options);
    }
    
    // Ensure center is a Point object
    this.center = new Point(this.center);
  }

  /**
   * Draw grid to the canvas using its current state
   * @return {Grid} This instance for chaining
   */
  draw() {
    // Clear canvas before drawing
    this.context.clearRect(0, 0, this.width, this.height);
    
    // Calculate minimum zoom required for proper display of the smallest increment
    const minZoomRequired = calculateMinZoomForDisplay(this.units, this.pixelRatio);
    
    // Log zoom levels for debugging
    console.log(`[Grid] Drawing grid - Current zoom: ${this.zoom}, Minimum required: ${minZoomRequired}`);
    
    // Check if zoom is below the minimum required for this unit system
    const lowZoomMode = this.zoom < minZoomRequired;
    
    if (lowZoomMode) {
      console.log(`[Grid] Current zoom (${this.zoom}) is below minimum required (${minZoomRequired}) - Using simplified grid`);
      // Draw a simplified grid
      this.drawSimplifiedGrid();
    } else {
      // Draw the normal grid when zoom is sufficient
      this.drawLines(this.state.x, this.context);
      this.drawLines(this.state.y, this.context);
    }
    
    return this;
  }
  
  /**
   * Draw simplified grid for low zoom levels that respects viewport transform
   * @private
   */
  drawSimplifiedGrid() {
    const ctx = this.context;
    const w = this.width;
    const h = this.height;
    
    // Use the same coordinate transforms as regular grid
    // This ensures simplified grid moves with objects
    
    // Save current context state
    ctx.save();
    
    // Draw simplified grid lines using the same coordinate system as the full grid
    // This ensures they move with zooming and panning
    if (this.state.x && this.state.x.coordinate && this.state.y && this.state.y.coordinate) {
      const xState = this.state.x;
      const yState = this.state.y;
      
      // Calculate world origin in screen coordinates (where 0,0 should be)
      const originScreenX = w/2 - this.center.x * this.zoom;
      const originScreenY = h/2 + this.center.y * this.zoom;
      
      // Draw basic axis lines
      ctx.beginPath();
      
      // X axis
      ctx.moveTo(0, originScreenY);
      ctx.lineTo(w, originScreenY);
      
      // Y axis
      ctx.moveTo(originScreenX, 0);
      ctx.lineTo(originScreenX, h);
      
      ctx.strokeStyle = 'rgba(120,120,200,0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Add basic grid lines that move with pan/zoom
      ctx.beginPath();
      
      // Get grid spacing in screen pixels
      const gridSpacingWorld = calculateGridSpacing(this.units, this.zoom, this.pixelRatio);
      const gridSpacingScreen = gridSpacingWorld * this.zoom;
      
      // Draw some basic grid lines based on current center and zoom
      const linesCount = 5; // A few lines in each direction
      
      for (let i = -linesCount; i <= linesCount; i++) {
        if (i === 0) continue; // Skip center lines (already drawn)
        
        // Horizontal lines
        const yPos = originScreenY - i * gridSpacingScreen;
        if (yPos >= 0 && yPos <= h) {
          ctx.moveTo(0, yPos);
          ctx.lineTo(w, yPos);
        }
        
        // Vertical lines
        const xPos = originScreenX + i * gridSpacingScreen;
        if (xPos >= 0 && xPos <= w) {
          ctx.moveTo(xPos, 0);
          ctx.lineTo(xPos, h);
        }
      }
      
      ctx.strokeStyle = 'rgba(200,200,200,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    // Display a message about zoom level - positioned in screen space
    ctx.fillStyle = 'rgba(100,100,100,0.7)';
    ctx.font = `300 ${this.fontSize}px ${this.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Calculate the required zoom percentage
    const minZoomRequired = calculateMinZoomForDisplay(this.units, this.pixelRatio);
    const percentOfRequired = Math.round((this.zoom / minZoomRequired) * 100);
    
    // Draw text overlay in screen space, not world space
    const messageY = 30; // Position at top of screen
    ctx.fillText(`Zoom in for ${this.units} grid (${percentOfRequired}% of required zoom)`, w/2, messageY);
    ctx.fillText(`Current: ${this.zoom.toFixed(2)}x | Required: ${minZoomRequired.toFixed(2)}x`, w/2, messageY + 25);
    
    ctx.restore();
  }

  // lines instance draw
  drawLines(state, ctx) {
    // draw lines and sublines
    if (!state || !state.coordinate) return;

    const [width, height] = state.shape;
    const left = 0;
    const top = 0;
    const [pt, pr, pb, pl] = state.padding;
    const dimensions = { width, height, left, top, padding: [pt, pr, pb, pl] };

    let axisRatio = state.opposite.coordinate.getRatio(state.coordinate.axisOrigin, state.opposite);
    axisRatio = clamp(axisRatio, 0, 1);
    const coords = state.coordinate.getCoords(state.lines, state);
    
    // Get line coordinates from the utility function
    const lineCoords = calculateLineCoordinates(state, coords, dimensions);
    
    // Draw the lines
    ctx.lineWidth = 1; // state.lineWidth/2.;
    for (let i = 0, j = 0; i < lineCoords.length; i++, j += 1) {
      const color = state.lineColors[j];
      if (!color) continue;
      
      const { x1, y1, x2, y2 } = lineCoords[i];
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.closePath();
    }
    // Calculate ticks and labels positions using the utility function
    const { tickCoords, labelCoords } = calculateTicksAndLabels(state, coords, axisRatio);
    state.labelCoords = labelCoords;
    
    // draw ticks
    if (state.ticks && state.ticks.length) {
      // Get tick points from the utility function
      const tickPoints = calculateTickPoints(state, tickCoords, dimensions);
      
      ctx.lineWidth = state.axisWidth / 2;
      ctx.beginPath();
      
      // Draw all the tick points
      for (const point of tickPoints) {
        const { x1, y1, x2, y2 } = point;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
      ctx.strokeStyle = state.axisColor;
      ctx.stroke();
      ctx.closePath();
    }
    // draw axis
    if (state.coordinate.axis && state.axisColor) {
      // Get axis coordinates from the utility function
      const { x1, y1, x2, y2 } = calculateAxisCoordinates(state, dimensions);
      
      ctx.lineWidth = state.axisWidth / 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = state.axisColor;
      ctx.stroke();
      ctx.closePath();
    }
    // draw state.labels
    this.drawLabels(state, ctx);
  }

  /**
   * Set the units for the grid (points, imperial, or metric)
   * @param {string} units - The units to use ('points', 'imperial', or 'metric')
   * @return {Grid} - This instance for chaining
   */
  setUnits(units) {
    if (!['points', 'imperial', 'metric'].includes(units)) {
      console.warn(`Invalid units: ${units}. Using default 'points'.`);
      units = 'points';
    }
    
    const prevUnits = this.units;
    
    // Skip if units haven't changed
    if (prevUnits === units) {
      return this;
    }
    
    // Store new units
    this.units = units;
    
    // Convert grid spacing to the new unit system
    console.log(`[Grid] Converting units from ${prevUnits} to ${units}, distance before: ${this.distance}`);
    this.distance = convertDistance(this.distance, prevUnits, units);
    console.log(`[Grid] After conversion: distance = ${this.distance}`);
    
    // No zoom clamping - remove max zoom constraints
    console.log(`[Grid] No zoom clamping for units: ${units}`);
    // Skip setting maxZoom and skip clamping current zoom value
    
    // Update configuration and render the grid
    this.updateConfiguration();
    this.render();
    
    return this;
  }

  /**
   * Get the current units setting
   * @return {string} Current units ('points', 'imperial', or 'metric')
   */
  getUnits() {
    return this.units;
  }

  drawLabels(state, ctx) {
    if (state.labels) {
      const [width, height] = state.shape;
      const [pt, pr, pb, pl] = state.padding;
      const dimensions = { width, height, padding: [pt, pr, pb, pl] };

      ctx.font = `300 ${state.fontSize}px ${state.fontFamily}`;
      ctx.fillStyle = state.labelColor;
      ctx.textBaseline = 'top';
      const textHeight = state.fontSize;
      
      const isOpp = state.coordinate.orientation === 'y' && !state.opposite.disabled;
      
      // Calculate label density based on zoom level
      console.log(`[Grid] Calculating label density for units: ${this.units}, zoom: ${this.zoom}`);
      const labelDensity = calculateLabelDensity(this.units, this.zoom);
      console.log(`[Grid] Label density calculated: ${labelDensity} (will show 1 label per ${labelDensity} grid lines)`);
      
      for (let i = 0; i < state.labels.length; i += 1) {
        let label = state.labels[i];
        if (label == null) continue;

        // Skip some labels based on density
        if (i % labelDensity !== 0 && i !== 0) continue;
        
        if (isOpp && almost(state.lines[i], state.opposite.coordinate.axisOrigin)) continue;

        const textWidth = ctx.measureText(label).width;
        
        // Get label position from the utility function
        const { textLeft, textTop, shouldNegate } = calculateLabelPosition(
          state, i, label, textWidth, textHeight, dimensions
        );
        
        // Apply negation if needed (for y-axis)
        if (shouldNegate) {
          label *= -1;
        }
        
        // Debug the label before formatting to see if metric labels are being passed correctly
        console.log(`[Grid-CRITICAL] PRE-FORMAT LABEL: value=${label}, type=${typeof label}, units=${this.units}`);
        
        // Format the label based on current units
        const formattedLabel = formatValueByUnits(label, this.units);
        
        // Debug first few labels only to avoid console spam
        if (i < 5) {
          console.log(`[Grid] Label formatting: ${label} → ${formattedLabel} (units: ${this.units})`);
        }
        
        ctx.fillText(formattedLabel, textLeft, textTop);
      }
    }
  }
}

export default Grid;
