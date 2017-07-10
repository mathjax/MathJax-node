var tape = require('tape');
var mjAPI = require("../lib/main.js");
var jsdom = require('jsdom').jsdom;

tape('MathJax configuration: strip config block', function (t) {
    t.plan(1);
    mjAPI.config({
        MathJax: {
            config: ["TeX-AMS_SVG.js"]
        }
    });
    mjAPI.typeset({
        math: 'E = mc^2',
        format: "TeX",
        mml: true,
    }, function (data) {
        t.ok(data, 'Config block did not cause errors');
    });

});
