var tape = require('tape');
var mjAPI = require("../lib/main.js");

tape('macros should be cleared from global state', function(t) {
  t.plan(2);
  mjAPI.start();

  mjAPI.typeset({
    math: "\\def\\mymacro{2\\pi} \\mymacro",
    format: "TeX",
    mml: true
  }, function(data) {
    t.false(data.errors, 'Defined and used macro');
  });

  mjAPI.typeset({
    math: "\\mymacro",
    format: "TeX",
    mml: true
  }, function(data) {
    t.true(data.errors, '\\mymacro should no longer be defined');
  });
});
