var tape = require('tape');
var mjAPI = require("../lib/main.js");

tape('mediawiki-texvc test: check MathJax core', function(t) {
    t.plan(1);

    var tex = '\\mathrm{\\AA}';
    mjAPI.config( {
        extensions: 'TeX/mediawiki-texvc', // a convenience option to add MathJax extensions
    });
    mjAPI.start();

    mjAPI.typeset({
        math: tex,
        format: "inline-TeX",
        mml: true
    }, function(data) {
        t.ok(data.mml.indexOf("&#xC5;")>0, 'MathJax renders Angström (10^{-10}m) sign.');
    });
});
