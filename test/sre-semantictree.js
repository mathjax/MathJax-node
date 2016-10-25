var tape = require('tape');
var mjAPI = require("../lib/main.js");

tape('semanticTree: basic test', function(t) {
  t.plan(2);

  var tex = 'a+b=c';
  mjAPI.start();

  mjAPI.typeset({
    math: tex,
    format: "TeX",
    mml: true,
    speakText: true,
    semantic: true
  }, function(data) {
    t.ok(data.streeJson, 'semantic tree JSON');
    t.ok(data.streeXml, 'semantic tree XML');
  });
});
