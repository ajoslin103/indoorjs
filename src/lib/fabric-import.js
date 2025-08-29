/**
 * Central import for fabric.js
 * This allows us to import fabric from a single location
 * and ensures consistent usage across the codebase
 * 
 * In browser environments, fabric is loaded from a CDN and available as a global
 * In Node.js environments, it would need to be imported differently
 */

// Use the global fabric object that's loaded via script tag in HTML
const fabric = window.fabric;

export default fabric;
