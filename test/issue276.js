var tape = require('tape');
var mjAPI = require("../lib/main.js");
var jsdom = require('jsdom').jsdom;

tape('SVG output: physical units', function(t) {
  t.plan(1);
  mjAPI.start();
  var mml = '<math><mspace width="1cm"></mspace></math>';

  mjAPI.typeset({
    math: mml,
    format: "MathML",
    svg: true
  }, function(data) {
    var document = jsdom(data.svg);
    var doc = document.defaultView.document;
    var width =  doc.querySelector('svg').getAttribute('width');
    t.notEqual(width, '0', '');
  });
});
