var tape = require('tape');
var mjAPI = require("../lib/main.js");
var path = require('path');

tape('basic configuration: check fontURL', function (t) {
    t.plan(2);
    
    mjAPI.config({
        extensions: '[test]/version.js',
        paths: {test: path.join(__dirname,'assets/')}
    });
    mjAPI.typeset({
        math: '\\version',
        format: "TeX",
        mml: true,
        css: true
    }, function (result, data) {
        var mjVersion = ((result.mml || '').match(/<mtext>(.*)<\/mtext>/) || [])[1] || '';
        t.ok(result.css.indexOf('https://cdnjs.cloudflare.com/ajax/libs/mathjax/' + mjVersion + '/fonts/HTML-CSS') > -1, 'Default fontURL');
    });
    // reconfigure
    mjAPI.typeset({
        math: ''
    }, function () {
        mjAPI.config({
            extensions: '',
            fontURL: 'https://example.com'
        });
        mjAPI.start();
    })
    mjAPI.typeset({
        math: 'a',
        format: "TeX",
        css: true,
    }, function (result, data) {
        t.ok(result.css.indexOf('https://example.com') > -1, 'Configuring fontURL');
    });
});
