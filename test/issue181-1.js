var tape = require('tape');
var mjAPI = require("../lib/mj-page.js");

tape('page with no math should not add undefined styles', function(t) {
  t.plan(1);

  var html = "<html><head></head><body><p>testing</p></body>";
  var result = '<style id="MathJax_CHTML_styles"></style><p>testing</p>'
  mjAPI.start();

  mjAPI.typeset({
    html: html,
    renderer: "CommonHTML"
  }, function(data) {
    t.equal(data.html,result, 'HTML with no math has empty style element');
  });
});
