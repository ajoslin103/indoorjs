/**
 * Grid calculation utilities
 * Pure functions for grid-related calculations
 */

import alpha from '../lib/color-alpha.js';
import {
  clamp, almost, len, parseUnit, toPx, isObj
} from '../lib/mumath/index.js';

/**
 * Calculate state object with parameters ready for rendering
 * @param {Object} coord - Coordinate object
 * @param {Array} shape - [width, height] of the grid
 * @return {Object} State object for rendering
 */
export function calcCoordinate(coord, shape) {
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
    state.fontSize = units[0] * toPx(units[1]);
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
export function getCenterCoords(stateX, stateY) {
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
export function calculateLineCoordinates(state, coords, dimensions) {
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
export function calculateAxisCoordinates(state, dimensions) {
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
export function calculateLabelPosition(state, index, label, textWidth, textHeight, dimensions) {
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

export function calculateTicksAndLabels(state, coords, axisRatio) {
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
export function calculateTickPoints(state, tickCoords, dimensions) {
  const { width, height, left = 0, top = 0, padding: [pt, pr, pb, pl] } = dimensions;
  const points = [];
  
  for (let i = 0, j = 0; i < tickCoords.length; i += 4, j += 1) {
    // Skip ticks on the axis origin
    if (almost(state.lines[j], state.opposite.coordinate.axisOrigin)) continue;
    
    const x1 = left + pl + tickCoords[i] * (width - pl - pr);
    const y1 = top + pt + tickCoords[i + 1] * (height - pt - pb);
    const x2 = left + pl + tickCoords[i + 2] * (width - pl - pr);
    const y2 = top + pt + tickCoords[i + 3] * (height - pt - pb);
    
    points.push({ x1, y1, x2, y2 });
  }
  
  return points;
}
