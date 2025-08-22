# Schematics

A simple, reactive, and extensible canvas-based library, built over [Fabric.js](https://fabricjs.com/) with the intent of helping applications create and manage 2D graphics. It's glaring feature is the option to draw a measured grid on the canvas without impacting the Fabric.js objects in any way.  The library is not reactive - but the Fabric.js canvas it exposes is reactive.

## Architecture

Your Application -> The Schematic ->  The Map -> The Grid
                                            \ -> Fabric.js canvas

### The Grid

The Grid component uses the canvas element's 2D drawing context to paint the gridlines, axis, and labels. So it can display a visible coordinate reference for all the Fabric.js objects, without affecting those objects in any way. 

The Map tells the Grid where to draw and at what zoom level. The Grid decides, based on the zoom level, how to display the gridlines, axis, and labels. The Grid uses all pure calculations, emits no events, and is not reactive -- but it will appear to be reacting to the zoom level.

### The Map

The Map is responsible for creation of the [Fabric.js](https://fabricjs.com/) canvas element, and exposing that Fabric.js canvas to the Application via the Schematic.  The Map reacts to the Fabric.js canvas events, and directs the Grid to draw itself based on the zoom level and other settings.

### The Fabric.js canvas

The Fabric.js canvas does what it does - see their site docs for details. The Fabric.js canvas will be exposed by the Schematic so that the Application using the Schamatics Library can interact with it as required and desired.

### The Schematic

The Schematic is the main entry point for the library. It is responsible for creating and managing the Map and Grid, and exposing the Fabric.js canvas to the Application.
