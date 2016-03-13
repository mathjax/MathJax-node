var fs = require('fs');
var svgpng = require('svg2png');

exports.svg2png = function(svg, result, scale, width, height, callback) {
  var sourceBuffer = new Buffer(svg, "utf-8");
  var returnBuffer = svgpng.sync(sourceBuffer, {
    width: width,
    height: height
  });
  result.png = "data:image/png;base64," + returnBuffer.toString('base64');
  callback();
};
