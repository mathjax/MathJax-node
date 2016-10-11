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
    htmlNode: true,
    svg: true,
    svgNode: true,
    mml: true,
    mmlNode: true
  }, function(data) {
    var window = jsdom().defaultView;
    t.ok(data.htmlNode instanceof window.HTMLElement, 'htmlNode is an HTMLElement');
    t.ok(data.svgNode instanceof window.HTMLElement, 'svgNode is an HTMLElement');
    t.ok(data.mmlNode instanceof window.HTMLElement, 'mmlNode is an HTMLElement');
  });
});
