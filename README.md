# mathjax-node [![Build Status](https://travis-ci.org/mathjax/MathJax-node.svg?branch=develop)](https://travis-ci.org/mathjax/MathJax-node)

This repository contains a library that provides an API to call [MathJax](https://github.com/mathjax/mathjax) from
NodeJS programs.  The API converts individual math
expressions (in any of MathJax's input formats) into HTML (with CSS), SVG or MathML code.

See the comments in the individual files for more details.

The `bin` directory contains a collection of command-line programs for
converting among MathJax's various formats.  These can be used as examples
of calling the MathJax API.

Use

    npm install mathjax-node

to install mathjax-node and its dependencies.


**Note:** 

mathjax-node requires Node.js v4 or later.


**Breaking Changes in v1.0:**

mathjax-node v1.0 dropped the following features that were present in earlier pre-releases.

* `lib/mj-page.js` (API for processing HTML-fragments) and related CLI tools
* speech-rule-integration
* PNG generation

These features can easily be recreated in separate modules for greate flexibility. For some community examples, see 

* [mathjax-node-page](https://github.com/pkra/mathjax-node-page/) 
* [mathjax-node-sre](https://github.com/pkra/mathjax-node-sre)
* [mathjax-node-svg2png](https://github.com/pkra/mathjax-node-svg2png)


# Getting started

mathjax-node provides a library, `./lib/main.js`. Below is a very minimal example - be sure to check out the examples in `./bin/` for more advanced examples.

```javascript
// a simple TeX-input example
var mjAPI = require("mathjax-node");
mjAPI.config({
  MathJax: {
    // traditional MathJax configuration
  }
});
mjAPI.start();

var yourMath = 'E = mc^2';

mjAPI.typeset({
  math: yourMath,
  format: "TeX", // "inline-TeX", "MathML"
  mml:true, //  svg:true,
}, function (data) {
  if (!data.errors) {console.log(data.mml)}
  // will produce:
  // <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  //   <mi>E</mi>
  //   <mo>=</mo>
  //   <mi>m</mi>
  //   <msup>
  //     <mi>c</mi>
  //     <mn>2</mn>
  //   </msup>
  // </math>
});
```

## Examples

The examples in `./bin/` provide a starting point for more advanced integrations.

Be sure to also check out other [projects on NPM that depend on mathjax-node ](https://www.npmjs.com/browse/depended/mathjax-node).
