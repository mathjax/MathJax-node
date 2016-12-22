var tape = require('tape');
var mjAPI = require("../lib/main.js");

tape('mmlNode should enable mml', function(t) {
    t.plan(1);
    mjAPI.start();
    var tex = 'x';

    mjAPI.typeset({
        math: tex,
        format: "TeX",
        mmlNode: true
    }, function(data) {
        t.ok(data.mml, 'MathML generated');
    });
});
