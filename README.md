# MathJax-node

This repository contains files that provide APIs to call MathJax from 
node.js programs.  There is an API for converting individual math 
expressions (in any of MathJax's input formats) into SVG images or MathML 
code, and there is an API for converting HTML snippets containing any of 
MathJax input formats into HTML snippets containing SVG or MathML.

See the comments in the individual files for more details.

The `bin` directory contains a collection of command-line programs for 
converting among MathJax's various formats.  These can be used as examples 
of calling the MathJax API's.

Use

    npm install https://github.com/mathjax/MathJax-node/tarball/master

to install MathJax-node and its dependencies.

You will need to use a local copy of MathJax, and it needs to be the
[develop](https://github.com/mathjax/MathJax/tree/develop) branch (which
has some modifications that will go into the core version of MathJax
after the v2.4 release).  Put your copy of MathJax in the `mathjax`
directory.

    git clone https://github.com/mathjax/MathJax mathjax
    cd mathjax
    git checkout develop

These API's can produce PNG images, but that requires the
[Batik](http://xmlgraphics.apache.org/batik/download.html) library.  It 
should be installed in the `batik` directory.  See the README file in that 
directory for more details.

