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
                format: "AsciiMath",
                math: "x^2 or a_(m n) or a_{m n} or (x+1)/y or sqrtx",
                mml: true,
                speakText: true
            },
            response: {
                "mml": "<math xmlns=\"http://www.w3.org/1998/Math/MathML\" alttext=\"x squared or a Subscript m n Baseline or a Subscript m n Baseline or StartFraction x plus 1 Over y EndFraction or StartRoot x EndRoot\">\n  <semantics>\n    <mstyle displaystyle=\"true\">\n      <msup>\n        <mi>x</mi>\n        <mn>2</mn>\n      </msup>\n      <mrow>\n        <mspace width=\"1ex\" />\n        <mtext>or</mtext>\n        <mspace width=\"1ex\" />\n      </mrow>\n      <msub>\n        <mi>a</mi>\n        <mrow>\n          <mi>m</mi>\n          <mi>n</mi>\n        </mrow>\n      </msub>\n      <mrow>\n        <mspace width=\"1ex\" />\n        <mtext>or</mtext>\n        <mspace width=\"1ex\" />\n      </mrow>\n      <msub>\n        <mi>a</mi>\n        <mrow>\n          <mi>m</mi>\n          <mi>n</mi>\n        </mrow>\n      </msub>\n      <mrow>\n        <mspace width=\"1ex\" />\n        <mtext>or</mtext>\n        <mspace width=\"1ex\" />\n      </mrow>\n      <mfrac>\n        <mrow>\n          <mi>x</mi>\n          <mo>+</mo>\n          <mn>1</mn>\n        </mrow>\n        <mi>y</mi>\n      </mfrac>\n      <mrow>\n        <mspace width=\"1ex\" />\n        <mtext>or</mtext>\n        <mspace width=\"1ex\" />\n      </mrow>\n      <msqrt>\n        <mi>x</mi>\n      </msqrt>\n    </mstyle>\n    <annotation encoding=\"text/x-asciimath\">x^2 or a_(m n) or a_{m n} or (x+1)/y or sqrtx</annotation>\n  </semantics>\n</math>",
                "speakText": "x squared or a Subscript m n Baseline or a Subscript m n Baseline or StartFraction x plus 1 Over y EndFraction or StartRoot x EndRoot"
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
                this.timeout(8000);
                mjAPI.typeset(data.query, function (res) {
                    assert.deepEqual(res, data.response);
                    done();
                });
            });
        });
    });

});

