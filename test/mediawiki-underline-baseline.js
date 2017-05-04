var tape = require('tape');
var mjAPI = require("../lib/main.js");

tape('mediawiki-texvc  test: check MathJax core', function (t) {
    t.plan(1);

    var tex = '\\underline{\\mathrm{Z}}'; // From https://phabricator.wikimedia.org/T135423
    mjAPI.start();

    mjAPI.typeset({
        math: tex,
        format: "inline-TeX",
        svg: true,
        mathoidStyle: true
    }, function (data) {
        t.ok(data.svg.indexOf('margin-bottom') > 0, 'There should be a margin adjustment');
    });
});
