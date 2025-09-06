/**
 * grid-units.js
 * Pure utility functions for unit-based grid calculations
 */

// Constants
export const POINTS_PER_INCH = 72; // Standard DTP points per inch
export const POINTS_PER_CM = 28.35; // Points per centimeter (72/2.54)
export const POINTS_PER_MM = 2.835; // Points per millimeter (POINTS_PER_CM/10)

// Natural grid increments for each unit system
export const NATURAL_INCREMENTS = {
  'points': [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000],
  'imperial': [1/16, 1/8, 1/4, 1/2, 1, 2, 6, 12, 36, 120], // inches, feet, yards
  'metric': [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000] // mm scale
};

// Minimum natural increment for each unit system
export const MIN_NATURAL_INCREMENTS = {
  'points': 1,
  'imperial': 1/16, // 1/16 inch
  'metric': 1 // 1mm (was previously 5mm)
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
      // 1 mm = 2.835 points = 2.835 pixels at 72dpi
      // Changing from cm to mm for finer metric control
      return POINTS_PER_MM / pixelRatio;
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
    metric: debugEquivalentSpacing.metric / 25.4 // mm to inches (25.4 mm = 1 inch)
  };
  
  console.log(`[Grid-Units] At zoom ${zoom}, ideal spacing equivalents (in inches):`); 
  console.log(`  - Points: ${debugEquivalentSpacing.points} points (${inchEquivalents.points} inches)`); 
  console.log(`  - Imperial: ${debugEquivalentSpacing.imperial} inches`); 
  console.log(`  - Metric: ${debugEquivalentSpacing.metric} mm (${inchEquivalents.metric} inches)`); 

  // Calculate grid line density per inch
  const linesPerInch = {
    points: 1 / debugEquivalentSpacing.points * 72,  // Convert to lines per inch
    imperial: 1 / debugEquivalentSpacing.imperial,   // Already in inches
    metric: 1 / debugEquivalentSpacing.metric * 25.4 // Convert mm to inches (25.4 mm = 1 inch)
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
  // Updated algorithm: show more labels at lower zoom levels
  if (zoom < 0.3) return 10;
  if (zoom < 0.6) return 5;
  if (zoom < 0.9) return 2;
  return 1;
}

/**
 * Format a value according to the current unit system
 * @param {number} value - The value to format
 * @param {string} units - The current unit system
 * @return {string} The formatted value as a string
 */
export function formatValueByUnits(value, units) {
  // Add debugging to see what values are being passed
  console.log(`[Grid-DEBUG] formatValueByUnits called with: value=${value}, type=${typeof value}, units=${units}`);
  
  // Convert value to a number if it's not already
  const numValue = typeof value !== 'number' ? Number(value) : value;
  
  // If conversion failed and resulted in NaN, return a safe fallback
  if (isNaN(numValue)) {
    console.warn(`[Grid-WARNING] Invalid value passed to formatValueByUnits: ${value}`);
    return String(value || '0');
  }
  
  let result = '';
  
  switch (units) {
    case 'imperial':
      if (numValue >= 12) {
        // Format as feet and inches
        const feet = Math.floor(numValue / 12);
        const inches = numValue % 12;
        result = inches === 0 ? `${feet}'` : `${feet}'${inches}"`;
      } else if (numValue < 1 && numValue > 0) {
        // Format as fractions for small values
        if (Math.abs(numValue - 0.5) < 0.01) result = `1/2"`;
        else if (Math.abs(numValue - 0.25) < 0.01) result = `1/4"`;
        else if (Math.abs(numValue - 0.125) < 0.01) result = `1/8"`;
        else if (Math.abs(numValue - 0.0625) < 0.01) result = `1/16"`;
        else result = `${numValue.toFixed(3)}"`;
      } else {
        result = `${numValue}"`;
      }
      break;
      
    case 'metric':
      console.log(`[Grid-DEBUG] Formatting metric value: ${numValue}`);
      if (numValue >= 1000) {
        // Format as meters (1000mm = 1m)
        result = `${(numValue / 1000).toFixed(1)}m`;
      } else if (numValue >= 100) {
        // Format as cm for larger values (100mm = 10cm)
        result = `${(numValue / 10).toFixed(0)}cm`;
      } else if (numValue >= 10) {
        // Format as mm with no decimal
        result = `${numValue.toFixed(0)}mm`;
      } else {
        // Format as mm with one decimal for small values
        result = `${numValue.toFixed(numValue < 1 ? 1 : 0)}mm`;
      }
      break;
      
    case 'points':
    default:
      // For points, just show the number
      result = `${Math.round(numValue)}`;
      break;
  }
  
  console.log(`[Grid-DEBUG] formatValueByUnits returning: ${result}`);
  return result;
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
