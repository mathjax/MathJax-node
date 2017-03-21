var tape = require('tape');
var mjAPI = require("../lib/main.js");

tape('mediawiki-texvc  test: check MathJax core', function(t) {
    t.plan(1);

    var tex = '{\\displaystyle \\left(\\left(\\sum_A\\right)B \\right)}';
    mjAPI.start();

    mjAPI.typeset({
        math: tex,
        format: "inline-TeX",
        svg: true
    }, function(data) {
        // console.log(data.mml);
        // note that there is no @ between \mathrm{im} and (f)
        t.equal(data.svg.match(/<\/g>/g).length,3,'Spaces between subsequent operators');
    });
});
