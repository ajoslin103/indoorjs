(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.IndoorMap = {}));
})(this, (function (exports) { 'use strict';

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

	class Base {
	  constructor(options) {
	    this._options = options || {};
	    Object.assign(this, options);
	  }
	}

	class Point extends fabric.Point {
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
	  SELECT: 'SELECT'};

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

	({
	  position: new Point()});

	fabric.Object.prototype.originX = 'center';
	fabric.Object.prototype.originY = 'center';

	fabric.Object.prototype.lockUniScaling = true;
	fabric.Object.prototype.lockScalingFlip = true;
	fabric.Object.prototype.transparentCorners = false;
	fabric.Object.prototype.centeredScaling = true;
	// fabric.Object.prototype.cornerStyle = 'circle';
	fabric.Object.prototype.cornerColor = 'blue';
	fabric.Object.prototype.borderColor = 'blue';
	fabric.Object.prototype.borderOpacity = 0.7;
	fabric.Object.prototype.cornerOpacity = 0.7;
	fabric.Object.prototype.cornerStrokeColor = 'blue';

	fabric.Object.prototype.borderColor = '#ff0099';
	fabric.Object.prototype.cornerColor = '#00eaff';
	fabric.Object.prototype.cornerStrokeColor = '#00bbff';

	fabric.Object.prototype.objectCaching = false;
	fabric.Group.prototype.objectCaching = true;

	fabric.Group.prototype.selectionBackgroundColor = 'rgba(45,207,171,0.25)';

	fabric.Object.prototype.borderDashArray = [3, 3];

	fabric.Object.prototype.padding = 5;

	fabric.Object.prototype.getBounds = function getBounds() {
	  const coords = [];
	  coords.push(new Point(this.left - this.width / 2.0, this.top - this.height / 2.0));
	  coords.push(new Point(this.left + this.width / 2.0, this.top + this.height / 2.0));
	  return coords;
	};

	function alpha (color, value) {
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
	      v = Number((v / 100).toFixed(2));
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

	// constructor
	class Grid extends Base {
	  constructor(canvas, opts) {
	    super(opts);
	    this.canvas = canvas;
	    this.context = this.canvas.getContext('2d');
	    this.state = {};
	    this.setDefaults();
	    this.update(opts);
	  }

	  render() {
	    this.draw();
	    return this;
	  }

	  getCenterCoords() {
	    let state = this.state.x;
	    let [width, height] = state.shape;
	    let [pt, pr, pb, pl] = state.padding;
	    let axisCoords = state.opposite.coordinate.getCoords(
	      [state.coordinate.axisOrigin],
	      state.opposite
	    );
	    const y = pt + axisCoords[1] * (height - pt - pb);
	    state = this.state.y;
	    [width, height] = state.shape;
	    [pt, pr, pb, pl] = state.padding;
	    axisCoords = state.opposite.coordinate.getCoords([state.coordinate.axisOrigin], state.opposite);
	    const x = pl + axisCoords[0] * (width - pr - pl);
	    return { x, y };
	  }

	  setSize(width, height) {
	    this.setWidth(width);
	    this.setHeight(height);
	  }

	  setWidth(width) {
	    this.canvas.width = width;
	  }

	  setHeight(height) {
	    this.canvas.height = height;
	  }

	  // re-evaluate lines, calc options for renderer
	  update(opts) {
	    const shape = [this.canvas.width, this.canvas.height];

	    // recalc state
	    this.state.x = this.calcCoordinate(this.axisX, shape, this);
	    this.state.y = this.calcCoordinate(this.axisY, shape, this);
	    this.state.x.opposite = this.state.y;
	    this.state.y.opposite = this.state.x;
	    // emit('update') removed
	    return this;
	  }

	  // re-evaluate lines, calc options for renderer
	  update2(center) {
	    const shape = [this.canvas.width, this.canvas.height];
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
	    const state = {
	      coordinate: coord,
	      shape,
	      grid: this
	    };
	    // calculate real offset/range
	    state.range = coord.getRange(state);
	    state.offset = clamp(
	      coord.offset - state.range * clamp(0.5, 0, 1),
	      Math.max(coord.min, -Number.MAX_VALUE + 1),
	      Math.min(coord.max, Number.MAX_VALUE) - state.range
	    );

	    state.zoom = coord.zoom;
	    // calc style
	    state.axisColor = typeof coord.axisColor === 'number'
	      ? alpha(coord.color, coord.axisColor)
	      : coord.axisColor || coord.color;

	    state.axisWidth = coord.axisWidth || coord.lineWidth;
	    state.lineWidth = coord.lineWidth;
	    state.tickAlign = coord.tickAlign;
	    state.labelColor = state.color;
	    // get padding
	    if (typeof coord.padding === 'number') {
	      state.padding = Array(4).fill(coord.padding);
	    } else if (coord.padding instanceof Function) {
	      state.padding = coord.padding(state);
	    } else {
	      state.padding = coord.padding;
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

	  setDefaults() {
	    this.pixelRatio = window.devicePixelRatio;
	    this.autostart = true;
	    this.interactions = true;

	    this.defaults = Object.assign(
	      {
	        type: 'linear',
	        name: '',
	        units: '',
	        state: {},

	        // visible range params
	        minZoom: -Infinity,
	        maxZoom: Infinity,
	        min: -Infinity,
	        max: Infinity,
	        offset: 0,
	        origin: 0.5,
	        center: {
	          x: 0,
	          y: 0,
	          zoom: 1
	        },
	        zoom: 1,
	        zoomEnabled: true,
	        panEnabled: true,

	        // labels
	        labels: true,
	        fontSize: '11pt',
	        fontFamily: 'sans-serif',
	        padding: 0,
	        color: 'rgb(0,0,0,1)',

	        // lines params
	        lines: true,
	        tick: 8,
	        tickAlign: 0.5,
	        lineWidth: 1,
	        distance: 13,
	        style: 'lines',
	        lineColor: 0.4,

	        // axis params
	        axis: true,
	        axisOrigin: 0,
	        axisWidth: 2,
	        axisColor: 0.8,

	        // stub methods
	        // return coords for the values, redefined by axes
	        getCoords: () => [0, 0, 0, 0],

	        // return 0..1 ratio based on value/offset/range, redefined by axes
	        getRatio: () => 0,

	        // default label formatter
	        format: v => v
	      },
	      gridStyle,
	      this._options
	    );

	    this.axisX = new Axis('x', this.defaults);
	    this.axisY = new Axis('y', this.defaults);

	    this.axisX = Object.assign({}, this.defaults, {
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
	      // FIXME: handle infinity case here
	      getRatio: (value, state) => (value - state.offset) / state.range
	    });
	    this.axisY = Object.assign({}, this.defaults, {
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

	    Object.assign(this, this.defaults);
	    Object.assign(this, this._options);

	    this.center = new Point(this.center);
	  }

	  // draw grid to the canvas
	  draw() {
	    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
	    this.drawLines(this.state.x);
	    this.drawLines(this.state.y);
	    return this;
	  }

	  // lines instance draw
	  drawLines(state) {
	    // draw lines and sublines
	    if (!state || !state.coordinate) return;

	    const ctx = this.context;
	    const [width, height] = state.shape;
	    const left = 0;
	    const top = 0;
	    const [pt, pr, pb, pl] = state.padding;

	    let axisRatio = state.opposite.coordinate.getRatio(state.coordinate.axisOrigin, state.opposite);
	    axisRatio = clamp(axisRatio, 0, 1);
	    const coords = state.coordinate.getCoords(state.lines, state);
	    // draw state.lines
	    ctx.lineWidth = 1; // state.lineWidth/2.;
	    for (let i = 0, j = 0; i < coords.length; i += 4, j += 1) {
	      const color = state.lineColors[j];
	      if (!color) continue;
	      ctx.strokeStyle = color;
	      ctx.beginPath();
	      const x1 = left + pl + coords[i] * (width - pr - pl);
	      const y1 = top + pt + coords[i + 1] * (height - pb - pt);
	      const x2 = left + pl + coords[i + 2] * (width - pr - pl);
	      const y2 = top + pt + coords[i + 3] * (height - pb - pt);
	      ctx.moveTo(x1, y1);
	      ctx.lineTo(x2, y2);
	      ctx.stroke();
	      ctx.closePath();
	    }
	    const normals = [];
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
	    // calc state.labels/tick coords
	    const tickCoords = [];
	    state.labelCoords = [];
	    const ticks = state.ticks;
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
	      state.labelCoords.push(normals[i] * xDif + x1);
	      state.labelCoords.push(normals[i + 1] * yDif + y1);
	    }
	    // draw ticks
	    if (ticks.length) {
	      ctx.lineWidth = state.axisWidth / 2;
	      ctx.beginPath();
	      for (let i = 0, j = 0; i < tickCoords.length; i += 4, j += 1) {
	        if (almostEqual(state.lines[j], state.opposite.coordinate.axisOrigin)) continue;
	        const x1 = left + pl + tickCoords[i] * (width - pl - pr);
	        const y1 = top + pt + tickCoords[i + 1] * (height - pt - pb);
	        const x2 = left + pl + tickCoords[i + 2] * (width - pl - pr);
	        const y2 = top + pt + tickCoords[i + 3] * (height - pt - pb);
	        ctx.moveTo(x1, y1);
	        ctx.lineTo(x2, y2);
	      }
	      ctx.strokeStyle = state.axisColor;
	      ctx.stroke();
	      ctx.closePath();
	    }
	    // draw axis
	    if (state.coordinate.axis && state.axisColor) {
	      const axisCoords = state.opposite.coordinate.getCoords(
	        [state.coordinate.axisOrigin],
	        state.opposite
	      );
	      ctx.lineWidth = state.axisWidth / 2;
	      const x1 = left + pl + clamp(axisCoords[0], 0, 1) * (width - pr - pl);
	      const y1 = top + pt + clamp(axisCoords[1], 0, 1) * (height - pt - pb);
	      const x2 = left + pl + clamp(axisCoords[2], 0, 1) * (width - pr - pl);
	      const y2 = top + pt + clamp(axisCoords[3], 0, 1) * (height - pt - pb);
	      ctx.beginPath();
	      ctx.moveTo(x1, y1);
	      ctx.lineTo(x2, y2);
	      ctx.strokeStyle = state.axisColor;
	      ctx.stroke();
	      ctx.closePath();
	    }
	    // draw state.labels
	    this.drawLabels(state);
	  }

	  drawLabels(state) {
	    if (state.labels) {
	      const ctx = this.context;
	      const [width, height] = state.shape;
	      const [pt, pr, pb, pl] = state.padding;

	      ctx.font = `300 ${state.fontSize}px ${state.fontFamily}`;
	      ctx.fillStyle = state.labelColor;
	      ctx.textBaseline = 'top';
	      const textHeight = state.fontSize;
	      const indent = state.axisWidth + 1.5;
	      const textOffset = state.tickAlign < 0.5
	        ? -textHeight - state.axisWidth * 2 : state.axisWidth * 2;
	      const isOpp = state.coordinate.orientation === 'y' && !state.opposite.disabled;
	      for (let i = 0; i < state.labels.length; i += 1) {
	        let label = state.labels[i];
	        if (label == null) continue;

	        if (isOpp && almostEqual(state.lines[i], state.opposite.coordinate.axisOrigin)) continue;

	        const textWidth = ctx.measureText(label).width;

	        let textLeft = state.labelCoords[i * 2] * (width - pl - pr) + indent + pl;

	        if (state.coordinate.orientation === 'y') {
	          textLeft = clamp(textLeft, indent, width - textWidth - 1 - state.axisWidth);
	          label *= -1;
	        }

	        let textTop = state.labelCoords[i * 2 + 1] * (height - pt - pb) + textOffset + pt;
	        if (state.coordinate.orientation === 'x') {
	          textTop = clamp(textTop, 0, height - textHeight - textOffset);
	        }
	        ctx.fillText(label, textLeft, textTop);
	      }
	    }
	  }
	}

	// import panzoom from '../lib/panzoom';

	// import ModesMixin from './ModesMixin';
	// import Measurement from '../measurement/Measurement';
	// import { mix } from '../lib/mix';

	// export class Map extends mix(Base).with(ModesMixin) {
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

	    try {
	      this.addFloorPlan();
	    } catch (e) {
	      console.error(e);
	    }

	    if (this.showGrid) {
	      this.addGrid();
	    }

	  }

	  addFloorPlan() {
	    if (this.floorplan) {
	      // If floorplan is already a fabric object, add it directly
	      if (this.floorplan.type && this.floorplan instanceof fabric.Object) {
	        this.addObject(this.floorplan);
	      } 
	      // If it was previously using the layer format, extract the shape
	      else if (this.floorplan.shape) {
	        this.addObject(this.floorplan.shape);
	      }
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

	const map = (container, options) => new Map(container, options);

	exports.Map = Map;
	exports.map = map;

}));
