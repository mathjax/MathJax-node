
var tape = require('tape');
var mjAPI = require("../lib/mj-single.js");
var jsdom = require('jsdom').jsdom;

tape('displayAlign:left in HTML output with mlabeledtr', function(t) {
  t.plan(1);
  mjAPI.config({MathJax: {displayIndent: '10em'}
});
  mjAPI.start();
  var tex = '\\begin{equation} x \\tag{1} \\end{equation}';
  expected = -1;

  mjAPI.typeset({
    math: tex,
    format: "TeX",
    html: true
  }, function(data) {
    console.log(data.html);
    var document = jsdom(data.html);
    var window = document.defaultView;
    var element = window.document.getElementsByClassName('mjx-table')[0];
    var result = element.getAttribute('style').indexOf('margin-left');
    console.log(result);
    t.ok(result > expected, 'style includes a margin');
  });
});
