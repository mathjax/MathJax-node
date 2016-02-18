var rsvg = require('librsvg').Rsvg;
var Readable = require('stream').Readable;

exports.svg2png = function(svg, result, scale, width, height, callback, check) {
  var s = new Readable();
  var svgRenderer = new rsvg();
  s._read = function() {
    s.push(svg);
    s.push(null);
  };
  svgRenderer.on('error', function(err){
    check(err);
    return;
  });
  svgRenderer.on('finish', function() {
    // console.log(width, height, scale, svg);
    var buffer = svgRenderer.render({
      format: 'png',
      width: width * scale,
      height: height * scale
    }).data;
    result.png = "data:image/png;base64," + (buffer || "").toString('base64');
    callback();
  });
  s.pipe(svgRenderer);
};
