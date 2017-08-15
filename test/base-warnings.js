var tape = require('tape');
var mjAPI = require("../lib/main.js");
mjAPI.config({undefinedCharError: true});

tape('basic test: check warnings', function (t) {
    t.plan(2);
    mjAPI.typeset({math:'呵', html:true})
        .catch(errors => t.ok(errors, 'CommonHTML output reports error'));
    mjAPI.typeset({math:'呵', svg:true})
        .catch(errors => t.ok(errors, 'SVG output reports error'));
});
