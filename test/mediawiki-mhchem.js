var tape = require('tape');
var mjAPI = require("../lib/main.js");

tape('mediawiki-texvc test: check MathJax mhchem', function(t) {
    t.plan(1);

    var tex = '\\ce{H2O}';
    mjAPI.start();

    mjAPI.typeset({
        math: tex,
        format: "inline-TeX",
        mml: true
    }, function(data) {
        t.ok(data.mml.indexOf("msubsup")>0, 'MathJax uses subscript for chemistry.');
    });
});
