var tape = require('tape');
var mjAPI = require("../lib/main.js");

tape('basic configuration: check fontURL', function (t) {
    t.plan(2);

    var tex = 'a';
    mjAPI.typeset({
        math: tex,
        format: "TeX",
        css: true
    }, function (result, data) {
        t.ok(result.css.indexOf('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.0/fonts/HTML-CSS') > -1, 'Default fontURL');
    });
    // reconfigure
    mjAPI.typeset({
        math: ''
    }, function(){
        mjAPI.config({
            fontURL: 'https://example.com'
        });
    })
    mjAPI.typeset({
        math: tex,
        format: "TeX",
        css: true,
    }, function (result, data) {
        t.ok(result.css.indexOf('https://example.com') > -1, 'Configuring fontURL');
    });
});