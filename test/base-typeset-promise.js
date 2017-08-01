var tape = require('tape');
var mjAPI = require("../lib/main.js");

tape('basic test: check typeset promise API', function (t) {
    t.plan(2);

    var tex = '';
    mjAPI.start();

    // promise resolved
    mjAPI.typeset({
        math: tex,
        format: "TeX",
        mml: true
    }).then((result) => t.ok(result.mml, 'Typset promise resolved on success'));

    mjAPI.typeset({
        math: tex,
        format: "MathML",
        mml: true
    }).catch((error) => t.ok(error, 'Typeset promise rejected on error'));
});
