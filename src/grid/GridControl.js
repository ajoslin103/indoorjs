import Base from '../core/Base.js';
import { Point } from '../geometry/Point.js';

/**
 * GridControl class for managing grid drawing configuration
 * Used to control where and how the grid is drawn on a Map
 */
export class GridControl extends Base {
  constructor(options) {
    super(options);

    this.defaults = {
      // Visibility controls
      enabled: true,          // whether grid is visible at all
      showAxisX: true,        // show X axis
      showAxisY: true,        // show Y axis
      showLabels: true,       // show value labels on grid
      
      // Grid visual properties
      lineColor: 'rgba(0, 0, 0, 0.4)',  // color for grid lines
      lineWidth: 1,                      // width of grid lines
      axisColor: 'rgba(0, 0, 0, 0.8)',   // color for main axes
      axisWidth: 2,                      // width of main axes
      
      // Grid thresholds
      minSpacing: 20,         // minimum spacing (for auto-adjustment)
      maxSpacing: 200,        // maximum spacing (for auto-adjustment)
      
      // Style options
      fontSize: '11pt',       // font size for labels
      fontFamily: 'sans-serif',// font family for labels
      
      // Position and zoom
      center: {               // center position of grid
        x: 0,
        y: 0,
        zoom: 1
      }
    };

    // set defaults
    Object.assign(this, this.defaults);

    // overwrite options
    Object.assign(this, this._options);

    // ensure center is a Point object
    this.center = new Point(this.center);
  }

  /**
   * Updates grid settings
   * @param {Object} options - Grid control options to update
   * @return {GridControl} - This instance for chaining
   */
  update(options) {
    Object.assign(this, options);
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
    
    // Apply visibility settings
    grid.axisX.axis = this.showAxisX;
    grid.axisY.axis = this.showAxisY;
    
    // Apply style settings
    grid.axisX.lineColor = this.lineColor;
    grid.axisY.lineColor = this.lineColor;
    grid.axisX.lineWidth = this.lineWidth;
    grid.axisY.lineWidth = this.lineWidth;
    grid.axisX.axisColor = this.axisColor;
    grid.axisY.axisColor = this.axisColor;
    grid.axisX.axisWidth = this.axisWidth;
    grid.axisY.axisWidth = this.axisWidth;
    
    // Apply font settings
    grid.axisX.fontSize = this.fontSize;
    grid.axisY.fontSize = this.fontSize;
    grid.axisX.fontFamily = this.fontFamily;
    grid.axisY.fontFamily = this.fontFamily;
    
    // Apply label settings
    grid.axisX.labels = this.showLabels;
    grid.axisY.labels = this.showLabels;
    
    // Update position and zoom if needed
    if (this.center) {
      grid.center.x = this.center.x;
      grid.center.y = this.center.y;
      grid.axisX.offset = this.center.x;
      grid.axisY.offset = this.center.y;
    }
    
    // Update grid
    grid.update();
    
    return this;
  }
}

export default GridControl;
