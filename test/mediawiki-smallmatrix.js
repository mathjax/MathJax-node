var tape = require('tape');
var mjAPI = require("../lib/main.js");

tape('mediawiki-texvc test: check MathJax core', function(t) {
  t.plan(1);

  var tex = '\\displaystyle{\\begin{smallmatrix}a\\end{smallmatrix}}';
  mjAPI.start();

  mjAPI.typeset({
    math: tex,
    format: "inline-TeX",
    mml: true
  }, function(data) {
    t.ok(data.mml.indexOf("scriptlevel=\"0\"")>0, 'MathJax renders smallmatrix.');
  });
});
