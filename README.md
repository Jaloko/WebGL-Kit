# WebGL-Kit
A personal library to make working with WebGL easier.

There are four primary functions that are currently available:
```javascript
// Init WebGL-Kit
var webglkit = new WebGLKit(canvas);
// Set canvas clear colour
webglkit.setClearColour(red, green, blue, alpha);
// Clear the canvas
webglkit.clear();
// Draw polygon
webglkit.drawPolygon(x, y, rotation, numberOfVertices, faceSize, colour);
// Draw image
webglkit.drawImage(x, y, width, height, rotation, imageURL);

```
