var tape = require('tape');
var mjAPI = require("../lib/main.js");
const path = require('path');

tape('Configuring third party extensions', function(t) {
    t.plan(1);
    var tex = '\\test';
    mjAPI.config( {
        extensions: '[test]/test.js',
        paths: {
            'test': path.join(__dirname,'assets/')
        }
    });
    mjAPI.start();
    mjAPI.typeset({
        math: tex,
        format: "TeX",
        mmlNode: true
    }, function(data) {
        t.notOk(data.errors, 'No error loading the extension');
    });
});
