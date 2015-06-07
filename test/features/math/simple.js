'use strict';

var mjAPI = require("../../../lib/mj-single.js");
var assert = require('../../utils/assert.js');

var testData = [
        {
            query: {
                math: 'E=mc^2',
                mml: true,
                speakText: true
            },
            response: {
                "mml": "<math xmlns=\"http://www.w3.org/1998/Math/MathML\" display=\"block\" alttext=\"upper E equals m c squared\">\n  <semantics>\n    <mrow>\n      <mi>E</mi>\n      <mo>=</mo>\n      <mi>m</mi>\n      <msup>\n        <mi>c</mi>\n        <mn>2</mn>\n      </msup>\n    </mrow>\n    <annotation encoding=\"application/x-tex\">E=mc^2</annotation>\n  </semantics>\n</math>",
                "speakText": "upper E equals m c squared"
            }
        },
        {
            query: {
                math: "\\overline{A}^T",
                mml: true,
                speakText: true
            },
            response: {
                "mml": "<math xmlns=\"http://www.w3.org/1998/Math/MathML\" display=\"block\" alttext=\"upper A overbar Superscript upper T\">\n  <semantics>\n    <msup>\n      <mover>\n        <mi>A</mi>\n        <mo accent=\"false\">&#x00AF;<!-- ¯ --></mo>\n      </mover>\n      <mi>T</mi>\n    </msup>\n    <annotation encoding=\"application/x-tex\">\\overline{A}^T</annotation>\n  </semantics>\n</math>",
                "speakText": "upper A overbar Superscript upper T"
            }
        },
        {
            query: {
                type: "AsciiMath",
                math: "x^2 or a_(m n) or a_{m n} or (x+1)/y or sqrtx",
                mml: true,
                speakText: true
            },
            response: {
                "mml": "<math xmlns=\"http://www.w3.org/1998/Math/MathML\" display=\"block\" alttext=\"x squared o r a Subscript left-parenthesis Baseline m n right-parenthesis o r a Subscript m n Baseline o r left-parenthesis x plus 1 right-parenthesis slash y o r s q r t x\">\n  <semantics>\n    <mrow>\n      <msup>\n        <mi>x</mi>\n        <mn>2</mn>\n      </msup>\n      <mi>o</mi>\n      <mi>r</mi>\n      <msub>\n        <mi>a</mi>\n        <mo stretchy=\"false\">(</mo>\n      </msub>\n      <mi>m</mi>\n      <mi>n</mi>\n      <mo stretchy=\"false\">)</mo>\n      <mi>o</mi>\n      <mi>r</mi>\n      <msub>\n        <mi>a</mi>\n        <mrow class=\"MJX-TeXAtom-ORD\">\n          <mi>m</mi>\n          <mi>n</mi>\n        </mrow>\n      </msub>\n      <mi>o</mi>\n      <mi>r</mi>\n      <mo stretchy=\"false\">(</mo>\n      <mi>x</mi>\n      <mo>+</mo>\n      <mn>1</mn>\n      <mo stretchy=\"false\">)</mo>\n      <mrow class=\"MJX-TeXAtom-ORD\">\n        <mo>/</mo>\n      </mrow>\n      <mi>y</mi>\n      <mi>o</mi>\n      <mi>r</mi>\n      <mi>s</mi>\n      <mi>q</mi>\n      <mi>r</mi>\n      <mi>t</mi>\n      <mi>x</mi>\n    </mrow>\n    <annotation encoding=\"application/x-tex\">x^2 or a_(m n) or a_{m n} or (x+1)/y or sqrtx</annotation>\n  </semantics>\n</math>",
                "speakText": "x squared o r a Subscript left-parenthesis Baseline m n right-parenthesis o r a Subscript m n Baseline o r left-parenthesis x plus 1 right-parenthesis slash y o r s q r t x"
            }
        }

    ]
    ;


describe('Simple Mathoid API tests', function () {
    before(function (cb) {
        // Wait for MathJax startup, as that's somewhat async but has a sync
        // interface
        setTimeout(cb, 1000);
        mjAPI.config({
            MathJax: {
                menuSettings: {
                    semantics: true,
                    texHints: true
                }
            },
            extensions: ""
        });
        mjAPI.start();
    });

    describe('Standard input / output pairs', function () {
        testData.forEach(function (data) {
            it(data.query.math, function (done) {
                this.timeout(5000);
                mjAPI.typeset(data.query, function (res) {
                    assert.deepEqual(res, data.response);
                    done();
                });
            });
        });
    });

});

