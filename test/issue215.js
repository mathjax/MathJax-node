var tape = require('tape');
var mjAPI = require("../lib/main.js");
var jsdom = require('jsdom').jsdom;

tape('HTML output should remove automatically generated IDs', function(t) {
  t.plan(2);

  mjAPI.start();
  var tex = 'a \\\\ b';
  var expected = '100ex';

  mjAPI.typeset({
    math: tex,
    format: "TeX",
    html: true
  }, function(data) {
    var document = jsdom(data.html);
    var window = document.defaultView;
    var id = window.document.querySelector('[id^="MJXc-Node-"]');
    var frame = window.document.querySelector('[id^="MathJax-Element-"]');
    t.notOk(id, 'automatic ids successfully removed');
    t.notOk(frame, 'MathJax-Element-[n]-frame id successfully removed');
  });
});
