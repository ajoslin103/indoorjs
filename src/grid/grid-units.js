/**
 * grid-units.js
 * Pure utility functions for unit-based grid calculations
 */

// Constants
export const POINTS_PER_INCH = 72; // Standard DTP points per inch
export const POINTS_PER_CM = 28.35; // Points per centimeter (72/2.54)

// Natural grid increments for each unit system
export const NATURAL_INCREMENTS = {
  'points': [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000],
  'imperial': [1/16, 1/8, 1/4, 1/2, 1, 2, 6, 12, 36, 120], // inches, feet, yards
  'metric': [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 1000] // cm scale (0.1cm = 1mm)
};

// Minimum natural increment for each unit system
export const MIN_NATURAL_INCREMENTS = {
  'points': 1,
  'imperial': 1/16, // 1/16 inch
  'metric': 0.5 // 0.5 cm (5mm)
};

// Ideal spacing between grid lines in pixels
export const IDEAL_GRID_LINE_SPACING = 50;

// Minimum pixels required for the smallest increment to be visible
export const MIN_VISIBLE_PIXELS = 5;

/**
 * Get the unit to pixel ratio for the specified units
 * @param {string} units - The current unit system ('points', 'imperial', or 'metric')
 * @param {number} pixelRatio - The device pixel ratio
 * @return {number} The conversion factor from units to pixels
 */
export function getUnitToPixelRatio(units, pixelRatio) {
  // This function should convert from units to screen pixels
  // For equal grid density at the same zoom level, we need to maintain
  // the relationship between physical dimensions
  switch(units) {
    case 'imperial':
      // 1 inch = 72 points, so at 72dpi, 1 inch = 72 pixels
      return POINTS_PER_INCH / pixelRatio;
    case 'metric':
      // 1 cm = 28.35 points = 28.35 pixels at 72dpi
      // (Fixing previous error that was dividing by 10)
      return POINTS_PER_CM / pixelRatio;
    case 'points':
    default:
      // 1 point = 1 pixel at 72dpi
      return 1 / pixelRatio;
  }
}

/**
 * Calculate maximum zoom constraint based on minimum increment visibility
 * @param {string} units - The current unit system
 * @param {number} pixelRatio - The device pixel ratio
 * @param {number} baseMaxZoom - The default maximum zoom value
 * @return {number} The maximum allowed zoom level
 */
export function calculateMaxZoom(units, pixelRatio, baseMaxZoom = 20) {
  const minIncrement = MIN_NATURAL_INCREMENTS[units];
  const unitToPixelRatio = getUnitToPixelRatio(units, pixelRatio);
  
  const unitConstrainedMaxZoom = MIN_VISIBLE_PIXELS / (minIncrement * unitToPixelRatio);
  return Math.min(baseMaxZoom, unitConstrainedMaxZoom);
}

/**
 * Calculate optimal grid spacing based on units and zoom level
 * @param {string} units - The current unit system
 * @param {number} zoom - The current zoom level
 * @param {number} pixelRatio - The device pixel ratio
 * @return {number} The optimal grid spacing in current units
 */
export function calculateGridSpacing(units, zoom, pixelRatio) {
  const idealUnitSpacing = IDEAL_GRID_LINE_SPACING / (zoom * getUnitToPixelRatio(units, pixelRatio));
  
  // DEBUG: Compare equivalent spacing in different units
  const debugEquivalentSpacing = {};
  const testZoom = zoom;
  debugEquivalentSpacing.points = IDEAL_GRID_LINE_SPACING / (testZoom * getUnitToPixelRatio('points', pixelRatio));
  debugEquivalentSpacing.imperial = IDEAL_GRID_LINE_SPACING / (testZoom * getUnitToPixelRatio('imperial', pixelRatio));
  debugEquivalentSpacing.metric = IDEAL_GRID_LINE_SPACING / (testZoom * getUnitToPixelRatio('metric', pixelRatio));
  
  // Convert to standard units for comparison (1 inch equivalent)
  const inchEquivalents = {
    points: debugEquivalentSpacing.points / 72,
    imperial: debugEquivalentSpacing.imperial,
    metric: debugEquivalentSpacing.metric / 2.54
  };
  
  console.log(`[Grid-Units] At zoom ${zoom}, ideal spacing equivalents (in inches):`); 
  console.log(`  - Points: ${debugEquivalentSpacing.points} points (${inchEquivalents.points} inches)`); 
  console.log(`  - Imperial: ${debugEquivalentSpacing.imperial} inches`); 
  console.log(`  - Metric: ${debugEquivalentSpacing.metric} cm (${inchEquivalents.metric} inches)`); 

  // Calculate grid line density per inch
  const linesPerInch = {
    points: 1 / debugEquivalentSpacing.points * 72,  // Convert to lines per inch
    imperial: 1 / debugEquivalentSpacing.imperial,   // Already in inches
    metric: 1 / debugEquivalentSpacing.metric * 2.54 // Convert cm to inches
  };
  
  console.log(`[Grid-Units] Grid line density (lines per inch):`); 
  console.log(`  - Points: ${linesPerInch.points.toFixed(2)} lines/inch`); 
  console.log(`  - Imperial: ${linesPerInch.imperial.toFixed(2)} lines/inch`); 
  console.log(`  - Metric: ${linesPerInch.metric.toFixed(2)} lines/inch`); 
  
  const increments = NATURAL_INCREMENTS[units];
  let bestIncrement = increments[0];
  
  // Find the largest increment that's smaller than the ideal spacing
  for (let i = 0; i < increments.length; i++) {
    if (increments[i] <= idealUnitSpacing) {
      bestIncrement = increments[i];
    } else {
      break;
    }
  }
  
  return bestIncrement;
}

/**
 * Calculate the density of labels to display
 * @param {string} units - The current unit system
 * @param {number} zoom - The current zoom level
 * @return {number} The number of grid lines to skip between labels
 */
export function calculateLabelDensity(units, zoom) {
  // Simple algorithm: show fewer labels when zoomed out
  if (zoom < 0.5) return 10;
  if (zoom < 1) return 5;
  if (zoom < 2) return 2;
  return 1;
}

/**
 * Format a value according to the current unit system
 * @param {number} value - The value to format
 * @param {string} units - The current unit system
 * @return {string} The formatted value as a string
 */
export function formatValueByUnits(value, units) {
  switch (units) {
    case 'imperial':
      if (value >= 12) {
        // Format as feet and inches
        const feet = Math.floor(value / 12);
        const inches = value % 12;
        return inches === 0 ? `${feet}'` : `${feet}'${inches}"`;
      } else if (value < 1 && value > 0) {
        // Format as fractions for small values
        if (Math.abs(value - 0.5) < 0.01) return `1/2"`;
        if (Math.abs(value - 0.25) < 0.01) return `1/4"`;
        if (Math.abs(value - 0.125) < 0.01) return `1/8"`;
        if (Math.abs(value - 0.0625) < 0.01) return `1/16"`;
        return `${value.toFixed(3)}"`;
      } else {
        return `${value}"`;
      }
      
    case 'metric':
      if (value >= 100) {
        // Format as meters
        return `${(value / 100).toFixed(1)}m`;
      } else if (value >= 10) {
        // Format as decimeters/centimeters with no decimal
        return `${value.toFixed(0)}cm`;
      } else {
        // Format as cm with one decimal for small values
        return `${value.toFixed(value < 1 ? 1 : 0)}cm`;
      }
      
    case 'points':
    default:
      // For points, just show the number
      return `${Math.round(value)}`;
  }
}

/**
 * Convert a distance from one unit system to another
 * @param {number} distance - The distance to convert
 * @param {string} fromUnits - The source unit system
 * @param {string} toUnits - The target unit system
 * @return {number} The converted distance
 */
export function convertDistance(distance, fromUnits, toUnits) {
  if (fromUnits === toUnits) {
    return distance;
  }
  
  if (fromUnits === 'points') {
    if (toUnits === 'imperial') {
      // Convert point measurements to inches
      return distance / POINTS_PER_INCH;
    } else if (toUnits === 'metric') {
      // Convert point measurements to centimeters
      return distance / POINTS_PER_CM;
    }
  } else if (fromUnits === 'imperial') {
    if (toUnits === 'points') {
      // Convert inch measurements to points
      return distance * POINTS_PER_INCH;
    } else if (toUnits === 'metric') {
      // Convert inch measurements to cm (1 inch = 2.54 cm)
      return distance * 2.54;
    }
  } else if (fromUnits === 'metric') {
    if (toUnits === 'points') {
      // Convert cm measurements to points
      return distance * POINTS_PER_CM;
    } else if (toUnits === 'imperial') {
      // Convert cm measurements to inches (1 cm = 0.3937 inches)
      return distance / 2.54;
    }
  }
  
  return distance;
}
