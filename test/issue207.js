
var tape = require('tape');
var mjAPI = require("../lib/main.js");
var jsdom = require('jsdom').jsdom;

tape('Generate dummy speechText', function(t) {
  t.plan(7);
  mjAPI.start();
  var input1 = 'x';
  var input2 = '<math display="block" alttext="hello"><mi>x</mi></math>';
  var expected = 'hello';
  // basic text
  mjAPI.typeset({
    math: input1,
    format: "TeX",
    html: true,
    svg: true,
    mml: true
  }, function(data) {
    var document = jsdom(data.html).defaultView.document;
    var element = document.querySelector('.MJXc-display');
    var result = element.getAttribute('aria-label');
    t.equal(result, input1, 'HTML output contains dummy speechText');
    var document = jsdom(data.mml).defaultView.document;
    var element = document.querySelector('math');
    var result = element.getAttribute('alttext');
    t.equal(result, input1, 'MathML output contains dummy speechText');
    var document = jsdom(data.svg).defaultView.document;
    var title = document.querySelector('title');
    var desc = document.querySelector('desc');
    t.equal('Equation', title.innerHTML, 'SVG output contains title');
    t.equal(result, desc.innerHTML, 'SVG output contains dummy speechText');
  });

  mjAPI.typeset({
    math: input2,
    format: "MathML",
    html: true,
    svg: true,
    mml: true
  }, function(data) {
    var document = jsdom(data.html).defaultView.document;
    var element = document.querySelector('.MJXc-display');
    var result = element.getAttribute('aria-label');
    t.equal(result, expected, 'HTML output from MathML contains original speechText');
    var document = jsdom(data.mml).defaultView.document;
    var element = document.querySelector('math');
    var result = element.getAttribute('alttext');
    t.equal(result, expected, 'MathML output from MathML contains original dummy speechText');
    var document = jsdom(data.svg).defaultView.document;
    var desc = document.querySelector('desc');
    t.equal(expected, desc.innerHTML, 'SVG output from MathML contains original dummy speechText');
  });
});
