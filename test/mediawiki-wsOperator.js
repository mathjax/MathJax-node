var tape = require('tape');
var mjAPI = require("../lib/main.js");

tape('mediawiki-texvc test: check MathJax core', function(t) {
    t.plan(1);

    var tex = '\\operatorname{A\\ }';
    mjAPI.start();

    mjAPI.typeset({
        math: tex,
        format: "inline-TeX",
        mml: true
    }, function(data) {
        t.equal(data.mml.match(/<mtext>&#xA0;<\/mtext>/g).length,1,'Spaces after operators');
    });
});
