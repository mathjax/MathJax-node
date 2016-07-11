var tape = require('tape');
var mjAPI = require("../lib/main.js");
var jsdom = require('jsdom').jsdom;

tape('Basic Check: pass jsdom object to output', function(t) {
  t.plan(3);

  mjAPI.start();
  var tex = 'x';

  mjAPI.typeset({
    math: tex,
    format: "TeX",
    html: true,
    htmlElement: true,
    svg: true,
    svgElement: true,
    mml: true,
    mmlElement: true
  }, function(data) {
    var window = jsdom().defaultView;
    t.ok(data.htmlElement instanceof window.HTMLElement, 'htmlElement is an HTMLElement');
    t.ok(data.svgElement instanceof window.HTMLElement, 'svgElement is an HTMLElement');
    t.ok(data.mmlElement instanceof window.HTMLElement, 'mmlElement is an HTMLElement');
  });
});
