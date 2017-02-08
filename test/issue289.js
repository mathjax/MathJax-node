var tape = require('tape');
var mjAPI = require("../lib/main.js");

tape('mmlNode should not produce mml', function(t) {
    t.plan(1);
    mjAPI.start();
    var mml = '<math alttext="0"><mn>1</mn></math>';

    mjAPI.typeset({
        math: mml,
        format: "MathML",
        htmlNode: true
    }, function(data) {
        t.equal(data.htmlNode.parentNode.querySelectorAll('[aria-label]').length, 1, 'Aria-label is unique');
    });
});
