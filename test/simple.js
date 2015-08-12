var tape = require('tape');
var mjAPI = require("..//lib/mj-single.js");
mjAPI.start();

var tex = 'f: X \\to Y';
var expected = '<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">\n  <mi>f</mi>\n  <mo>:</mo>\n  <mi>X</mi>\n  <mo stretchy="false">&#x2192;<!-- → --></mo>\n  <mi>Y</mi>\n</math>';

tape('simple comparisons', function(t) {
  t.plan(1);
  mjAPI.typeset({
    math: tex,
    format: "TeX",
    mml: true
  }, function(data) {
      t.equal(data.mml, expected);
  });
});
