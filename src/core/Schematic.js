import Base from './Base.js';
import { map } from '../map/Map.js';

/**
 * Schematic class for handling event subscriptions and emissions
 * Extends the Base class with the same input structure as Map
 * Creates and returns a fabricjs instance using the map factory function
 */
export class Schematic extends Base {
  constructor(container, options) {
    super(options);

    this.defaults = {};

    // set defaults
    Object.assign(this, this.defaults);

    // overwrite options
    Object.assign(this, this._options);

    this.container = container || document.body;
    
    // Store event listeners
    this.listeners = {};
    
    // Create fabric instance using map factory function
    this.fabric = map(this.container, options);
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
