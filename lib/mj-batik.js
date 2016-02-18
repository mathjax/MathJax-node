var fs = require('fs');
var os = require('os');
var path = require('path');
var execFile = require('child_process').execFile;

exports.svg2png = function(svg, result, scale, width, height, callback, check) {
  var tmpfile = os.tmpdir() + "/mj-svg" +  process.pid;  // file name prefix to use for temp files
  var BatikRasterizerPath = path.resolve(__dirname,'..','batik/batik-rasterizer.jar');
  var batikCommands = ['-jar', BatikRasterizerPath, '-dpi', scale*72, tmpfile + '.svg'];
  var tmpSVG = tmpfile + ".svg",
    tmpPNG = tmpfile + ".png";
  fs.writeFile(tmpSVG, svg, function(err) {
    if (check(err)) return;
    execFile('java', batikCommands, function(err, stdout, stderr) {
      if (check(err)) {
        fs.unlinkSync(tmpSVG);
        return
      }
      fs.readFile(tmpPNG, null, function(err, buffer) {
        result.png = "data:image/png;base64," + (buffer || "").toString('base64');
        fs.unlinkSync(tmpSVG);
        fs.unlinkSync(tmpPNG);
        check(err);
        callback();
      });
    });
  });
}
