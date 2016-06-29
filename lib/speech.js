/*********************************************************************
 *
 *  speech.js
 *
 *  Some utility functions to embed speech strings into MathJax-node output.
 *
 * ----------------------------------------------------------------------
 *
 *  Copyright (c) 2014--2016 The MathJax Consortium
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

// Speech helper functions.

var speechGen = {};

speechGen.sre = require('speech-rule-engine');


/**
 * An id counter.
 * @type {number}
 */
speechGen.id = 0;


speechGen.call = function() {
  return speechGen.sre ?
    function(x) {return speechGen.sre.toSpeech(x);} :
  function(x) {return '';};
};


speechGen.injectInSVG_ = function(svg, speech, counter) {
  //TODO: What if desc element does not exist?
  var descr = svg.querySelector('desc');
  descr.textContent = speech;
};


speechGen.inject = function(element, speech, opt_counter) {
  if (!speech) return;
  var tagName = element.tagName.toUpperCase();
  var id = opt_counter || speechGen.id++;
  switch (tagName) {
    // SVG
    case 'SVG':
    speechGen.injectInSVG_(element, speech, id);
    return;
    // MML
    case 'MATH':
    speechGen.injectInMML_(element, speech);
    return;
    // HTML
    default:
    speechGen.injectInHTML_(element, speech);
  }
};


speechGen.injectInMML_ = function(mml, speech) {
  mml.setAttribute('alttext', speech);
};


speechGen.injectInHTML_ = function(html, speech) {
  var label = html.querySelector('[aria-label]');
  if (label) {
    label.removeAttribute('aria-label');
  }
  html.setAttribute('aria-label', speech);
  for (var i = 0, m = html.childNodes.length; i < m; i++) {
    html.childNodes[i].setAttribute('aria-hidden', true);
  }
};


speechGen.string = function(element) {
  var str = element.outerHTML;
  return speechGen.sre ? speechGen.sre.pprintXML(str).replace(/\W$/, '') : str;
};


/**
 * Generate speech output and inject it into a DOM element.
 * @param {Element} element A DOM element.
 * @param {string} mml The MathML string.
 * @param {string} domain Speech rule set for sre.
 * @param {string} style Speech style for sre.
 * @return {string} The serialised element.
 */
speechGen.generate = function(element, mml, domain, style) {
  speechGen.sre.setupEngine(
    {
      domain: domain.replace(/^chromevox$/i,"default"),
      style: style,
      semantics: true
    }
  );
  var text = speechGen.call()(mml);
  speechGen.inject(element, text);
  return speechGen.string(element);
};


exports.generate = speechGen.generate;
exports.sre = speechGen.sre;

