# MathJax-node

This repository contains files that provide API's to call MathJax from 
node.js programs.  There is an API for converting individual math 
expressions (in any of MathJax's input formats) into SVG images or MathML 
code, and there is an API for converting HTML snippets containing any of 
MathJax input formats into HTML snippets containing SVG or MathML.

See the comments in the individual files for more details.

The `bin` directory contains a collection of command-line programs for 
converting among MathJax's various formats.  These can be used as examples 
of calling the MathJax API's.

MathJax-node relies on the [jsdom](https://www.npmjs.org/package/jsdom)
library, so make sure you have that installed. Use

    npm install jsdom

These API's can also produce PNG images, but that requires the
[Batik](http://xmlgraphics.apache.org/batik/download.html) library.  It 
should be installed in the `batik` directory.

