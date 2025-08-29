'use strict';

var fabric = require('fabric');

class Base {
  constructor(options) {
    this._options = options || {};
    Object.assign(this, options);
  }
}

class Point extends fabric.fabric.Point {
  constructor(...params) {
    let x;
    let y;
    if (params.length > 1) {
      [x, y] = params;
    } else if (params.length === 0 || !params[0]) {
      [x, y] = [0, 0];
    } else if (Object.prototype.hasOwnProperty.call(params[0], 'x')) {
      x = params[0].x;
      y = params[0].y;
    } else if (params[0].length) {
      [[x, y]] = params;
    } else {
      console.error(
        'Parameter for Point is not valid. Use Point(x,y) or Point({x,y}) or Point([x,y])',
        params
      );
    }

    super(x, y);
  }

  setX(x) {
    this.x = x || 0;
  }

  setY(y) {
    this.y = y || 0;
  }

  copy(point) {
    this.x = point.x;
    this.y = point.y;
  }

  getArray() {
    return [this.x, this.y];
  }
}

const Modes = {
  SELECT: 'SELECT',
  GRAB: 'GRAB',
  MEASURE: 'MEASURE',
  DRAW: 'DRAW'
};

const MAP = {
  center: new Point(),
  zoom: 1,
  minZoom: 0,
  maxZoom: 20,
  gridEnabled: true,
  zoomEnabled: true,
  selectEnabled: true,
  mode: Modes.SELECT,
  showGrid: true
};

/**
 * Initialize Fabric.js configuration settings
 * This function should be called before using any Fabric.js objects
 */
function initializeFabric() {
  if (typeof fabric.fabric === 'undefined') {
    console.warn('Fabric.js not loaded. Cannot initialize Fabric settings.');
    return;
  }

  // // Set default origin to center for all Fabric objects
  // fabric.Object.prototype.originX = 'center';
  // fabric.Object.prototype.originY = 'center';

  // // Lock uniform scaling and prevent flipping
  // fabric.Object.prototype.lockUniScaling = true;
  // fabric.Object.prototype.lockScalingFlip = true;
  
  // // Visual settings
  // fabric.Object.prototype.transparentCorners = false;
  // fabric.Object.prototype.centeredScaling = true;
  // // fabric.Object.prototype.cornerStyle = 'circle';
  // fabric.Object.prototype.cornerColor = 'blue';
  // fabric.Object.prototype.borderColor = 'blue';
  // fabric.Object.prototype.borderOpacity = 0.7;
  // fabric.Object.prototype.cornerOpacity = 0.7;
  // fabric.Object.prototype.cornerStrokeColor = 'blue';
  
  // // Update border and corner colors
  // fabric.Object.prototype.borderColor = '#ff0099';
  // fabric.Object.prototype.cornerColor = '#00eaff';
  // fabric.Object.prototype.cornerStrokeColor = '#00bbff';
  
  // // Performance settings
  // fabric.Object.prototype.objectCaching = false;
  // fabric.Group.prototype.objectCaching = true;
  
  // // Group selection appearance
  // fabric.Group.prototype.selectionBackgroundColor = 'rgba(45,207,171,0.25)';
  
  // // Border style
  // fabric.Object.prototype.borderDashArray = [3, 3];
  
  // // Padding
  // fabric.Object.prototype.padding = 5;
  
  // Add getBounds utility method
  fabric.fabric.Object.prototype.getBounds = function getBounds() {
    const coords = [];
    coords.push(new Point(this.left - this.width / 2.0, this.top - this.height / 2.0));
    coords.push(new Point(this.left + this.width / 2.0, this.top + this.height / 2.0));
    return coords;
  };

  console.log('Fabric.js settings initialized successfully.');
}

/**
 * Clamp value.
 * Detects proper clamp min/max.
 *
 * @param {number} a Current value to cut off
 * @param {number} min One side limit
 * @param {number} max Other side limit
 *
 * @return {number} Clamped value
 */

function clamp(a, min, max) {
	return max > min ? Math.max(Math.min(a,max),min) : Math.max(Math.min(a,min),max);
}

/**
 * Return quadratic length
 *
 * @module  mumath/len
 *
 */

function len(a, b) {
	return Math.sqrt(a*a + b*b);
}

// Type definitions for almost-equal 1.1
// Project: https://github.com/mikolalysenko/almost-equal#readme
// Definitions by: Curtis Maddalozzo <https://github.com/cmaddalozzo>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

var abs = Math.abs;
var min = Math.min;

function almostEqual(a, b, absoluteError, relativeError) {
  var d = abs(a - b);
  
  if (absoluteError == null) absoluteError = almostEqual.DBL_EPSILON;
  if (relativeError == null) relativeError = absoluteError;
  
  if(d <= absoluteError) {
    return true
  }
  if(d <= relativeError * min(abs(a), abs(b))) {
    return true
  }
  return a === b
}

const FLT_EPSILON = 1.19209290e-7;
const DBL_EPSILON = 2.2204460492503131e-16;

almostEqual.FLT_EPSILON = FLT_EPSILON;
almostEqual.DBL_EPSILON = DBL_EPSILON;

// The MIT License (MIT)

// Copyright (c) 2016 angus croll

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/*
  range(0, 5); // [0, 1, 2, 3, 4]
  range(5); // [0, 1, 2, 3, 4]
  range(-5); // [0, -1, -2, -3, -4]
  range(0, 20, 5) // [0, 5, 10, 15]
  range(0, -20, -5) // [0, -5, -10, -15]
*/

function range(start, stop, step) {
  if (start != null && typeof start != 'number') {
    throw new Error('start must be a number or null');
  }
  if (stop != null && typeof stop != 'number') {
    throw new Error('stop must be a number or null');
  }
  if (step != null && typeof step != 'number') {
    throw new Error('step must be a number or null');
  }
  if (stop == null) {
    stop = start || 0;
    start = 0;
  }
  if (step == null) {
    step = stop > start ? 1 : -1;
  }
  var toReturn = [];
  var increasing = start < stop; //← here’s the change
  for (; increasing ? start < stop : start > stop; start += step) {
    toReturn.push(start);
  }
  return toReturn;
}

/**
 * Base 10 logarithm
 *
 * @module mumath/log10
 */
var lg = Math.log10 || function (a) {
	return Math.log(a) / Math.log(10);
};

/**
 * Check if one number is multiple of other
 *
 * @module  mumath/is-multiple
 */


function isMultiple(a, b, eps) {
	var remainder = a % b;

	if (!eps) eps = almostEqual.FLT_EPSILON;

	if (!remainder) return true;
	if (almostEqual(0, remainder, eps, 0) || almostEqual(Math.abs(b), Math.abs(remainder), eps, 0)) return true;

	return false;
}

/**
 * Get step out of the set
 *
 * @module mumath/step
 */

function scale (minStep, srcSteps) {
	var power = Math.floor(lg(minStep));

	var order = Math.pow(10, power);
	var steps = srcSteps.map(v => v*order);
	order = Math.pow(10, power+1);
	steps = steps.concat(srcSteps.map(v => v*order));

	//find closest scale
	var step = 0;
	for (var i = 0; i < steps.length; i++) {
		step = steps[i];
		if (step >= minStep) break;
	}

	return step;
}

var parseUnit = (str, out) => {
  if (!out)
      out = [ 0, '' ];

  str = String(str);
  var num = parseFloat(str, 10);
  out[0] = num;
  out[1] = str.match(/[\d.\-\+]*\s*(.*)/)[1] || '';
  return out
};

// (c) 2015 Mikola Lysenko. MIT License
// https://github.com/mikolalysenko/to-px


var PIXELS_PER_INCH = 96;

var defaults = {
  'ch': 8,
  'ex': 7.15625,
  'em': 16,
  'rem': 16,
  'in': PIXELS_PER_INCH,  
  'cm': PIXELS_PER_INCH / 2.54,
  'mm': PIXELS_PER_INCH / 25.4,
  'pt': PIXELS_PER_INCH / 72,
  'pc': PIXELS_PER_INCH / 6,
  'px': 1
};

function toPX(str) {
  if (!str) return null

  if (defaults[str]) return defaults[str]

  // detect number of units
  var parts = parseUnit(str);
  if (!isNaN(parts[0]) && parts[1]) {
    var px = toPX(parts[1]);
    return typeof px === 'number' ? parts[0] * px : null;
  }

  return null;
}

/**
 * MIT © Sindre Sorhus
 * https://github.com/sindresorhus/is-plain-obj/blob/master/index.js
 */
var isObj = (value) => {
	if (Object.prototype.toString.call(value) !== '[object Object]') {
		return false;
	}

	const prototype = Object.getPrototypeOf(value);
	return prototype === null || prototype === Object.getPrototypeOf({});
};

function alpha (color, value) {
	// Fallback to black if color is null/undefined
	if (color == null) {
		color = 'rgba(0,0,0,1)';
	}
	let obj = color.replace(/[^\d,]/g, '').split(',');
	if (value == null) value = obj[3] || 1;
	obj[3] = value;
	return 'rgba('+obj.join(',')+')';
}

/* eslint-disable consistent-return */

const gridStyle = {
  steps: [1, 2, 5],
  distance: 20,
  unit: 10,
  lines: (state) => {
    const coord = state.coordinate;
    // eslint-disable-next-line no-multi-assign
    const step = state.step = scale(coord.distance * coord.zoom, coord.steps);
    return range(Math.floor(state.offset / step) * step,
      Math.ceil((state.offset + state.range) / step + 1) * step, step);
  },
  lineColor: (state) => {
    if (!state.lines) return;
    const coord = state.coordinate;

    const light = alpha(coord.color, 0.1);
    const heavy = alpha(coord.color, 0.3);

    const step = state.step;
    const power = Math.ceil(lg(step));
    const tenStep = 10 ** power;
    const nextStep = 10 ** (power + 1);
    const eps = step / 10;
    const colors = state.lines.map(v => {
      if (isMultiple(v, nextStep, eps)) return heavy;
      if (isMultiple(v, tenStep, eps)) return light;
      return null;
    });
    return colors;
  },
  ticks: state => {
    if (!state.lines) return;
    const coord = state.coordinate;
    const step = scale(scale(state.step * 1.1, coord.steps) * 1.1, coord.steps);
    const eps = step / 10;
    const tickWidth = state.axisWidth * 4;
    return state.lines.map(v => {
      if (!isMultiple(v, step, eps)) return null;
      if (almostEqual(v, 0, eps)) return null;
      return tickWidth;
    });
  },
  labels: state => {
    if (!state.lines) return;
    const coord = state.coordinate;

    const step = scale(scale(state.step * 1.1, coord.steps) * 1.1, coord.steps);
    // let precision = clamp(Math.abs(Math.floor(lg(step))), 10, 20);
    const eps = step / 100;
    return state.lines.map(v => {
      if (!isMultiple(v, step, eps)) return null;
      if (almostEqual(v, 0, eps)) return coord.orientation === 'y' ? null : '0';
      // Display the actual value in Fabric.js units
      return coord.format(v);
    });
  }
};

class Axis {
  constructor(orientation, options) {
    Object.assign(this, options);
    this.orientation = orientation || 'x';
  }

  getCoords(values) {
    const coords = [];
    if (!values) return coords;
    for (let i = 0; i < values.length; i += 1) {
      const t = this.getRatio(values[i]);
      coords.push(t);
      coords.push(0);
      coords.push(t);
      coords.push(1);
    }
    return coords;
  }

  getRange() {
    let len = this.width;
    if (this.orientation === 'y') len = this.height;
    return len * this.zoom;
  }

  getRatio(value) {
    return (value - this.offset) / this.range;
  }

  setOffset(offset) {
    this.offset = offset;
  }

  update(options) {
    options = options || {};
    Object.assign(this, options);

    this.range = this.getRange();
  }
}

/**
 * Grid calculation utilities
 * Pure functions for grid-related calculations
 */


/**
 * Calculate state object with parameters ready for rendering
 * @param {Object} coord - Coordinate object
 * @param {Array} shape - [width, height] of the grid
 * @return {Object} State object for rendering
 */
function calcCoordinate(coord, shape) {
  const state = {
    coordinate: coord,
    shape,
    grid: null // Will be set by caller
  };
  
  // calculate real offset/range
  state.range = coord.getRange(state);
  state.offset = clamp(
    coord.offset - state.range * clamp(0.5, 0, 1),
    Math.max(coord.min, -Number.MAX_VALUE + 1),
    Math.min(coord.max, Number.MAX_VALUE) - state.range
  );

  state.zoom = coord.zoom;
  // ensure base color is available for styles
  state.color = coord.color || 'rgba(0,0,0,1)';
  
  // calc style
  state.axisColor = typeof coord.axisColor === 'number'
    ? alpha(coord.color, coord.axisColor)
    : coord.axisColor || coord.color;

  state.axisWidth = coord.axisWidth || coord.lineWidth;
  state.lineWidth = coord.lineWidth;
  state.tickAlign = coord.tickAlign;
  state.labelColor = state.color;
  
  // get padding (robust: always resolve to [pt, pr, pb, pl])
  if (typeof coord.padding === 'number') {
    state.padding = Array(4).fill(coord.padding);
  } else if (coord.padding instanceof Function) {
    state.padding = coord.padding(state);
  } else if (Array.isArray(coord.padding)) {
    state.padding = coord.padding;
  } else {
    // fallback when padding is undefined/null/invalid
    state.padding = [0, 0, 0, 0];
  }
  
  // calc font
  if (typeof coord.fontSize === 'number') {
    state.fontSize = coord.fontSize;
  } else {
    const units = parseUnit(coord.fontSize);
    state.fontSize = units[0] * toPX(units[1]);
  }
  state.fontFamily = coord.fontFamily || 'sans-serif';
  
  // get lines stops, including joined list of values
  let lines;
  if (coord.lines instanceof Function) {
    lines = coord.lines(state);
  } else {
    lines = coord.lines || [];
  }
  state.lines = lines;
  
  // calc colors
  if (coord.lineColor instanceof Function) {
    state.lineColors = coord.lineColor(state);
  } else if (Array.isArray(coord.lineColor)) {
    state.lineColors = coord.lineColor;
  } else {
    let color = alpha(coord.color, coord.lineColor);
    if (typeof coord.lineColor !== 'number') {
      color = coord.lineColor === false || coord.lineColor == null ? null : coord.color;
    }
    state.lineColors = Array(lines.length).fill(color);
  }
  
  // calc ticks
  let ticks;
  if (coord.ticks instanceof Function) {
    ticks = coord.ticks(state);
  } else if (Array.isArray(coord.ticks)) {
    ticks = coord.ticks;
  } else {
    const tick = coord.ticks === true || coord.ticks === true
      ? state.axisWidth * 2 : coord.ticks || 0;
    ticks = Array(lines.length).fill(tick);
  }
  state.ticks = ticks;
  
  // calc labels
  let labels;
  if (coord.labels === true) labels = state.lines;
  else if (coord.labels instanceof Function) {
    labels = coord.labels(state);
  } else if (Array.isArray(coord.labels)) {
    labels = coord.labels;
  } else if (isObj(coord.labels)) {
    labels = coord.labels;
  } else {
    labels = Array(state.lines.length).fill(null);
  }
  state.labels = labels;
  
  // convert hashmap ticks/labels to lines + colors
  if (isObj(ticks)) {
    state.ticks = Array(lines.length).fill(0);
  }
  if (isObj(labels)) {
    state.labels = Array(lines.length).fill(null);
  }
  if (isObj(ticks)) {
    // eslint-disable-next-line guard-for-in
    Object.keys(ticks).forEach((value, tick) => {
      state.ticks.push(tick);
      state.lines.push(parseFloat(value));
      state.lineColors.push(null);
      state.labels.push(null);
    });
  }

  if (isObj(labels)) {
    Object.keys(labels).forEach((label, value) => {
      state.labels.push(label);
      state.lines.push(parseFloat(value));
      state.lineColors.push(null);
      state.ticks.push(null);
    });
  }

  return state;
}

/**
 * Calculate center coordinates
 * @param {Object} stateX - X axis state
 * @param {Object} stateY - Y axis state
 * @return {Object} Center coordinates {x, y}
 */
function getCenterCoords(stateX, stateY) {
  let [width, height] = stateX.shape;
  let [pt, pr, pb, pl] = stateX.padding;
  let axisCoords = stateY.coordinate.getCoords(
    [stateX.coordinate.axisOrigin],
    stateY
  );
  const y = pt + axisCoords[1] * (height - pt - pb);
  
  [width, height] = stateY.shape;
  [pt, pr, pb, pl] = stateY.padding;
  axisCoords = stateX.coordinate.getCoords([stateY.coordinate.axisOrigin], stateX);
  const x = pl + axisCoords[0] * (width - pr - pl);
  
  return { x, y };
}

/**
 * Calculate tick coordinates and label positions
 * @param {Object} state - Axis state object
 * @param {Array} coords - Line coordinates
 * @param {Number} axisRatio - Position of the axis
 * @return {Object} Object containing tickCoords and labelCoords
 */
/**
 * Calculate line coordinates for drawing
 * @param {Object} state - State object for the current axis
 * @param {Array} coords - Coordinate array
 * @param {Object} dimensions - Object with width, height, top, left, padding info
 * @return {Array} Array of screen coordinates for lines
 */
function calculateLineCoordinates(state, coords, dimensions) {
  const { width, height, left = 0, top = 0, padding: [pt, pr, pb, pl] } = dimensions;
  const result = [];
  
  for (let i = 0; i < coords.length; i += 4) {
    const x1 = left + pl + coords[i] * (width - pr - pl);
    const y1 = top + pt + coords[i + 1] * (height - pb - pt);
    const x2 = left + pl + coords[i + 2] * (width - pr - pl);
    const y2 = top + pt + coords[i + 3] * (height - pb - pt);
    
    result.push({ x1, y1, x2, y2 });
  }
  
  return result;
}

/**
 * Calculate axis position coordinates
 * @param {Object} state - Current state
 * @param {Object} dimensions - Dimensions object
 * @return {Object} Axis coordinates
 */
function calculateAxisCoordinates(state, dimensions) {
  const { width, height, left = 0, top = 0, padding: [pt, pr, pb, pl] } = dimensions;
  
  const axisCoords = state.opposite.coordinate.getCoords(
    [state.coordinate.axisOrigin],
    state.opposite
  );
  
  const x1 = left + pl + clamp(axisCoords[0], 0, 1) * (width - pr - pl);
  const y1 = top + pt + clamp(axisCoords[1], 0, 1) * (height - pt - pb);
  const x2 = left + pl + clamp(axisCoords[2], 0, 1) * (width - pr - pl);
  const y2 = top + pt + clamp(axisCoords[3], 0, 1) * (height - pt - pb);
  
  return { x1, y1, x2, y2 };
}

/**
 * Calculate label positioning
 * @param {Object} state - Current state
 * @param {Number} index - Label index
 * @param {String} label - Label text
 * @param {Number} textWidth - Measured width of text
 * @param {Number} textHeight - Height of text
 * @param {Object} dimensions - Dimensions object
 * @return {Object} Position info for label
 */
function calculateLabelPosition(state, index, label, textWidth, textHeight, dimensions) {
  const { width, height, padding: [pt, pr, pb, pl] } = dimensions;
  const indent = state.axisWidth + 1.5;
  const textOffset = state.tickAlign < 0.5
    ? -textHeight - state.axisWidth * 2 : state.axisWidth * 2;
  
  let textLeft = state.labelCoords[index * 2] * (width - pl - pr) + indent + pl;
  let textTop = state.labelCoords[index * 2 + 1] * (height - pt - pb) + textOffset + pt;
  
  if (state.coordinate.orientation === 'y') {
    textLeft = clamp(textLeft, indent, width - textWidth - 1 - state.axisWidth);
  }
  
  if (state.coordinate.orientation === 'x') {
    textTop = clamp(textTop, 0, height - textHeight - textOffset);
  }
  
  return { textLeft, textTop, shouldNegate: state.coordinate.orientation === 'y' };
}

function calculateTicksAndLabels(state, coords, axisRatio) {
  const [width, height] = state.shape;
  const [pt, pr, pb, pl] = state.padding;
  const ticks = state.ticks;
  const normals = [];
  
  // Calculate normals for the lines
  for (let i = 0; i < coords.length; i += 4) {
    const x1 = coords[i];
    const y1 = coords[i + 1];
    const x2 = coords[i + 2];
    const y2 = coords[i + 3];
    const xDif = x2 - x1;
    const yDif = y2 - y1;
    const dist = len(xDif, yDif);
    normals.push(xDif / dist);
    normals.push(yDif / dist);
  }
  
  // calc tick and label coordinates
  const tickCoords = [];
  const labelCoords = [];
  
  for (let i = 0, j = 0, k = 0; i < normals.length; k += 1, i += 2, j += 4) {
    const x1 = coords[j];
    const y1 = coords[j + 1];
    const x2 = coords[j + 2];
    const y2 = coords[j + 3];
    const xDif = (x2 - x1) * axisRatio;
    const yDif = (y2 - y1) * axisRatio;
    const tick = [
      (normals[i] * ticks[k]) / (width - pl - pr),
      (normals[i + 1] * ticks[k]) / (height - pt - pb)
    ];
    
    tickCoords.push(normals[i] * (xDif + tick[0] * state.tickAlign) + x1);
    tickCoords.push(normals[i + 1] * (yDif + tick[1] * state.tickAlign) + y1);
    tickCoords.push(normals[i] * (xDif - tick[0] * (1 - state.tickAlign)) + x1);
    tickCoords.push(normals[i + 1] * (yDif - tick[1] * (1 - state.tickAlign)) + y1);
    
    labelCoords.push(normals[i] * xDif + x1);
    labelCoords.push(normals[i + 1] * yDif + y1);
  }
  
  return { tickCoords, labelCoords };
}

/**
 * Get tick coordinate points for drawing
 * @param {Object} state - Current state
 * @param {Array} tickCoords - Tick coordinates
 * @param {Object} dimensions - Dimensions object
 * @return {Array} Array of objects with x/y coordinates for ticks
 */
function calculateTickPoints(state, tickCoords, dimensions) {
  const { width, height, left = 0, top = 0, padding: [pt, pr, pb, pl] } = dimensions;
  const points = [];
  
  for (let i = 0, j = 0; i < tickCoords.length; i += 4, j += 1) {
    // Skip ticks on the axis origin
    if (almostEqual(state.lines[j], state.opposite.coordinate.axisOrigin)) continue;
    
    const x1 = left + pl + tickCoords[i] * (width - pl - pr);
    const y1 = top + pt + tickCoords[i + 1] * (height - pt - pb);
    const x2 = left + pl + tickCoords[i + 2] * (width - pl - pr);
    const y2 = top + pt + tickCoords[i + 3] * (height - pt - pb);
    
    points.push({ x1, y1, x2, y2 });
  }
  
  return points;
}

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

        if (isOpp && almostEqual(state.lines[i], state.opposite.coordinate.axisOrigin)) continue;

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

class Map extends Base {
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
    this.fabric = new fabric.fabric.Canvas(canvas, {
      preserveObjectStacking: true,
      renderOnAddRemove: true,
      fireRightClick: true, // allow right-click events to flow through Fabric
      stopContextMenu: true // prevent default context menu to keep drag uninterrupted
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

    // Enable snapping of object move/resize to integer values
    this._registerSnapping();

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
    
    // Always clamp zoom to bounds, even if set directly elsewhere
    const z = clamp(this.zoom, this.minZoom, this.maxZoom);
    if (z !== this.zoom) this.zoom = z;

    // First apply the zoom to the center of the canvas
    const centerPoint = new fabric.fabric.Point(canvas.width / 2, canvas.height / 2);
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

const map = (container, options) => {
  const mapInstance = new Map(container, options);
  return mapInstance.fabric;
};

// Private helpers on the prototype to keep constructor lean
Map.prototype._registerSnapping = function _registerSnapping() {
  const canvas = this.fabric;
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

/**
 * Schematic class for handling event subscriptions and emissions
 * Extends the Base class with the same input structure as Map
 * Creates and returns a fabricjs instance using the map factory function
 */
class Schematic extends Base {
  constructor(container, options) {
    super(options);

    this.defaults = {
      showGrid: true,
      // Control whether zoom is applied around viewport center (true) or mouse position (false)
      zoomOnCenter: false,
      // Persisted UI hint: whether to show native scrollbars. No behavior yet.
      showScrollbars: false
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

  // Persist a UI preference for showing native scrollbars.
  // This does not implement any behavior yet; it only logs and emits an event.
  setShowScrollbars(enabled) {
    const next = !!enabled;
    if (this.showScrollbars === next) return this;
    this.showScrollbars = next;
    try {
      console.log('[schematic] showScrollbars changed:', this.showScrollbars);
    } catch {}
    this.emit && this.emit('scrollbars:change', { enabled: this.showScrollbars });
    return this;
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
        this.fabric.relativePan(new fabric.fabric.Point(deltaX, deltaY));
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
        point = new fabric.fabric.Point(px, py);
      } else {
        const originScreenX = vptBefore ? vptBefore[4] : canvas.width / 2;
        const originScreenY = vptBefore ? vptBefore[5] : canvas.height / 2;
        point = new fabric.fabric.Point(originScreenX, originScreenY);
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
const schematic = (container, options) => {
  const schematicInstance = new Schematic(container, options);
  return schematicInstance.fabric;
};

exports.Axis = Axis;
exports.Base = Base;
exports.Grid = Grid;
exports.MAP = MAP;
exports.Map = Map;
exports.Modes = Modes;
exports.Point = Point;
exports.Schematic = Schematic;
exports.initializeFabric = initializeFabric;
exports.map = map;
exports.schematic = schematic;
