var tape = require('tape');
var mjAPI = require("../lib/main.js");

tape('mediawiki-texvc  test: check MathJax core', function(t) {
    t.plan(1);

    var tex = '\\sin\\arcsin x-\\dim\\ker V+\\dim \\mathrm{im}(f)';
    mjAPI.start();

    mjAPI.typeset({
        math: tex,
        format: "inline-TeX",
        mml: true
    }, function(data) {
        // console.log(data.mml);
        // note that there is no @ between \mathrm{im} and (f)
        t.equal(data.mml.match(/x2061/g).length,5,'Spaces between subsequent operators');
    });
});
