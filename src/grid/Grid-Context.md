Let's calculate the zoom levels required to represent the minimum measurement with 10 pixels for each unit system:

Based on the code in [calculateMaxZoom](cci:1://file:///Users/ajoslin/Development/schematic/src/grid/grid-units.js:55:0-68:1), let me calculate the zoom levels required to represent each minimum measurement with 10 pixels instead of the current 5 pixels:

To represent the minimum measurement with 10 pixels for each unit system, I'll calculate the required zoom levels using the formula:

```javascript
zoom = DESIRED_PIXELS / (minIncrement * unitToPixelRatio)
```

Using 10 pixels (instead of the current 5) and assuming a standard pixelRatio of 1:

### Points Units
- Minimum increment: 1 point
- unitToPixelRatio: 1 / 1 = 1
- Required zoom: 10 / (1 * 1) = **10.0**
- At this zoom level, 1 point = 10 pixels

### Imperial Units
- Minimum increment: 1/16 inch = 0.0625 inches
- unitToPixelRatio: 72 / 1 = 72
- Required zoom: 10 / (0.0625 * 72) = 10 / 4.5 = **2.22**
- At this zoom level, 1/16 inch = 10 pixels

### Metric Units
- Minimum increment: 1 mm
- unitToPixelRatio: 2.835 / 1 = 2.835
- Required zoom: 10 / (1 * 2.835) = **3.53**
- At this zoom level, 1 mm = 10 pixels

These zoom levels would ensure that the minimum measurement for each unit system is rendered with exactly 10 pixels on screen, making them clearly visible and usable.
