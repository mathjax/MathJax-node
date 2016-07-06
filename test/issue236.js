var tape = require('tape');
var mjAPI = require('../lib/main.js');
var jsdom = require('jsdom').jsdom;

tape('Speech should replace alttext from source', function(t) {
  t.plan(6);

  mjAPI.start();
  var mml = '<math alttext="0"><mn>1</mn></math>';
  var expected = '100ex';

  mjAPI.typeset({
    math: mml,
    format: 'MathML',
    speakText: true,
    mml: true,
    svg: true,
    html: true
  }, function(data) {
    // test html output
    var document = jsdom(data.html);
    var window = document.defaultView;
    var labels = window.document.querySelectorAll('[aria-label]');
    t.notOk(labels[1], 'html output has only one aria-label');

    var checkLabel = (labels[0].getAttribute('aria-label') === '1');
    t.ok(checkLabel, 'html output has the correct aria-label');

    // test svg output
    var document = jsdom(data.svg);
    var window = document.defaultView;
    var labeled = window.document.querySelector('[aria-label]');
    t.notOk(labeled, 'svg output has no aria-label');

    var labelledby = window.document.querySelector('[aria-labelledby]');
    t.ok(labelledby, 'svg output has the correct aria-labelledby');

    // test mml output
    var count = data.mml.match(/alttext/g).length;
    var checkAlt = data.mml.indexOf('alttext=\'1\'') > -1;
    t.notOk( count-1, 'mml output has only one alttext');
    t.notOk( checkAlt, 'mml output has the correct alttext');
  });
});
