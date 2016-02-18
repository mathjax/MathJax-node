var tape = require('tape');
var mjAPI = require("..//lib/mj-single.js");
tape('basic test: check MathJax core', function(t) {
    t.plan(2);

    var tex = '\\sin(x)';
    mjAPI.start();

    mjAPI.typeset({
        math: tex,
        format: "inline-TeX",
        png: true,
        mathoidStyle: true,
    }, function (data) {
        t.equal(data.png.indexOf("data:image/png;base64"), 0, 'PNG has header.');
        t.ok(data.png.length > 100, 'PNG has a certain length');
    });
});
