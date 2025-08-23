# Maps

A simple, reactive, and extensible canvas-based library, built over [Fabric.js](https://fabricjs.com/) with the intent of helping applications create and manage 2D graphics. It's glaring feature is the option to draw a measured grid on the canvas without impacting the Fabric.js objects in any way.

## Architecture
                           / -> GridControl 
                          / 
Your Application -> The Map -> The Grid
                           \
                            \ -> Fabric.js canvas

### The Map

A Map is the main entry point for the library. 

It is responsible for creating and managing the [Fabric.js](https://fabricjs.com/) canvas element 

It listens to Fabric.js canvas events, in particular the pan, zoom, and resize events, and updates the Grid object based on those events.  

It listens to Fabric.js canvas events, in particular the 'before:render' event, and calls the Grid's 'render' method with the .

It exposes the GridControl object to the Application, which can use it to control the grid's appearance and behavior.

### The Grid

The Grid class uses the canvas element's 2D drawing context (provided at initialization by the Map) to paint the gridlines, axis, and labels. So it can display a visible coordinate reference for all the Fabric.js objects, without affecting those objects in any way. 

The Grid draws according to the GridControl object. Provided anew each time, the GridControl supplies the width & height, the origin and zoom level, to calculate the gridlines, axis, and labels. The Grid uses all pure calculations, emits no events, and is not reactive -- but it will appear to be reacting to the zoom level and pan events

### The Fabric.js canvas

The Fabric.js canvas does what it does - see their site docs for details. The Fabric.js canvas will be exposed by the Schematic so that the Application using the Schamatics Library can interact with it as required and desired.
