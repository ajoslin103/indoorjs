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
  
  // Grid configuration
  type = 'linear';
  name = '';
  units = '';
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
    this.setDefaults();
    this.updateConfiguration(opts);
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
    this.context.clearRect(0, 0, this.width, this.height);
    this.drawLines(this.state.x, this.context);
    this.drawLines(this.state.y, this.context);
    return this;
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
      
      for (let i = 0; i < state.labels.length; i += 1) {
        let label = state.labels[i];
        if (label == null) continue;

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
        
        ctx.fillText(label, textLeft, textTop);
      }
    }
  }
}

export default Grid;
