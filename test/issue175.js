var tape = require('tape');
var mjAPI = require("../lib/main.js");
var jsdom = require('jsdom').jsdom;

tape('color extension should be reset', function(t) {
  t.plan(1);
  mjAPI.start();
  var tex = '\\colorbox{green}{x}';

  mjAPI.typeset({
    math: tex,
    format: "TeX",
     mml: true
  }, function(data) {
    t.ok(data.errors);
  });
});
