var tape = require('tape');
var mjAPI = require("../lib/main.js");
var jsdom = require('jsdom').jsdom;

tape('displayAlign:left in HTML output', function(t) {
  t.plan(1);
  mjAPI.config({MathJax: {"displayAlign": "left"}});
  mjAPI.start();
  var tex = 'x';
  var expected = "text-align: left;";

  mjAPI.typeset({
    math: tex,
    format: "TeX",
    html: true
  }, function(data) {
    var document = jsdom(data.html);
    var window = document.defaultView;
    var element = window.document.getElementsByClassName("MJXc-display")[0];
    var result = element.getAttribute('style');
    t.equal(result, expected);
  });
});
