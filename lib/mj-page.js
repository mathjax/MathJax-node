/*********************************************************************
 *
 *  mj-page-svg.js
 *  
 *  Implements an API to MathJax in node.js so that MathJax can be
 *  used server-side to generate SVG, MathML, or images (the latter
 *  requires an external library, batik, to do the svg to png
 *  conversion).  This API accepts HTML snippets that have their 
 *  math content converted to SVG's.
 *
 * ----------------------------------------------------------------------
 *
 *  Copyright (c) 2014 The MathJax Consortium
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

var http = require('http');
var fs = require('fs');
var dirname = require('path').dirname;
var jsdom = require("jsdom").jsdom;

var displayMessages = false;      // don't log Message.Set() calls
var displayErrors = true;         // show error messages on the console

var defaults = {
  ex: 6,                          // ex-size in pixels
  width: 100,                     // width of container (in ex) for linebreaking and tags
  useFontCache: true,             // use <defs> and <use> in svg output?
  useGlobalCache: true,           // use common <defs> for all equations?
  linebreaks: false,              // do linebreaking?
  equationNumbers: "none",        // or "AMS" or "all"
  singleDollars: true,            // allow single-dollar delimiter for inline TeX?

  html: "",                       // the HTML snippet to process

  inputs: ["AsciiMath","TeX","MathML"],  // the inputs formats to support
  renderer: "SVG",                // the output format ("SVG", "NativeMML", or "None")

  imgSVG: false,                  // use external SVG's via <img> tags?
  removeJax: true,                // remove MathJax <script> tags?
  speakText: false,               // add spoken annotations to svg output?

  timeout: 60 * 1000,             // 60 second timeout before restarting MathJax
};

var MathJaxPath = "file://"+dirname(dirname(require.resolve("./mj-page.js")))+"/mathjax/unpacked";
var MathJax;   // filled in once MathJax is loaded
var serverReady = false; // true when MathJax has done its initial typeset (loaded all components)
var timer;     // used to reset MathJax if it runs too long
var tmpfile = "/tmp/mj-single-svg";  // file name prefix to use for temp files

var document, window, content; // the DOM elements

var queue = [];       // queue of typesetting requests of the form [data,callback]
var data, callback;   // the current queue item
var errors = [];      // errors collected durring the typesetting

var SELECTOR = {
  TeX: ["math/tex","math/tex; mode=display"],
  MathML: ["math/mml"],
  AsciiMath: ["math/asciimath"]
};

var STYLES;           // filled in when SVG is loaded

/********************************************************************/

//
//  Create the DOM window and set up the console wtihin it
//  Add an error handler to trap unexpected errors (requires
//    modifying jsdom)
//  Add a <div> where we can put the math to be typeset
//    and typeset math in the three formats we use (to force
//    the jax to be loaded completely)
//
function GetWindow() {
  document = jsdom();
  window = document.parentWindow;
  window.console = console;
  window.onerror = function (err,url,line) {AddError("Error: "+err)}
  content = document.body.appendChild(document.createElement("div"));
  content.id = "MathJax_Content";
  content.innerHTML = "$x$ `x` <math><mi>x</mi></math>";
}

//
//  Set up a Mathjax configuration within the window
//  
function ConfigureMathJax() {
  window.MathJax = {
    //
    //  Load all input jax and preprocessors
    //  Load AMS extensions and the autoload extension for TeX
    //  Allow $...$ delimiters and don't create previews for any preprocessor,
    //  Create stand-alone SVG elements with font caches by default
    //    (users can override that)
    //
    jax: ["input/TeX", "input/MathML", "input/AsciiMath", "output/SVG", "output/NativeMML"],
    extensions: ["tex2jax.js","mml2jax.js","asciimath2jax.js","toMathML.js"],
    TeX: {extensions: window.Array("AMSmath.js","AMSsymbols.js","autoload-all.js")},
    tex2jax: {inlineMath: [['$','$'],['\\(','\\)']], preview:"none"},
    mml2jax: {preview:"none"},
    asciimath2jax: {preview:"none"},
    SVG: {useFontCache: true, useGlobalCache: false},

    //
    //  This gets run before MathJax queues any actions
    //
    AuthorInit: function () {
      MathJax = window.MathJax;

      delete MathJax.Hub.config.styles;               // don't need any styles
      MathJax.Hub.Startup.MenuZoom = function () {};  // don't load menu or zoom code
      
      //
      //  When creating stylesheets, no need to wait for them
      //  to become active, so just do the callback
      //  
      MathJax.Ajax.timer.create = function (callback,node) {
        callback = MathJax.Callback(callback);
        callback(this.STATUS.OK);
        return callback;
      };

      //
      //  Use the console for messages, if we are requesting them
      //
      MathJax.Message.Set = function (text,n,delay) {
        if (displayMessages && n !== 0) {
          if (text instanceof window.Array)
            {text = MathJax.Localization._.apply(MathJax.Localization,text)}
          console.error(text);
        }
      };
      MathJax.Message.Clear = function () {};
      MathJax.Message.Remove = function () {};
      MathJax.Message.Init = function () {};
      
      //
      //  Trap Math Processing Errors
      //
      MathJax.Hub.Register.MessageHook("Math Processing Error",function (message) {
        AddError("Math Processing Error",message[2].message);
      });
      MathJax.Hub.Register.MessageHook("SVG Jax - unknown char",function (message) {
        AddError("Unknown character","U+"+message[1].toString(16).toUpperCase()+
                    " in "+(message[2].fonts||["unknown"]).join(","));
      });
      MathJax.Hub.Register.MessageHook("MathML Jax - unknown node type",function (message) {
        AddError("MathML unknown node type",message[1]);
      });
      MathJax.Hub.Register.MessageHook("MathML Jax - parse error",function (message) {
        AddError("MathML",message[1]);
      });
      MathJax.Hub.Register.MessageHook("AsciiMath Jax - parse error",function (message) {
        AddError("AsciiMath parse error",message[1]);
      });
      MathJax.Hub.Register.MessageHook("TeX Jax - parse error",function (message) {
        AddError("TeX parse error",message[1]);
      });
      
      //
      //  Adjust the SVG output jax
      //
      MathJax.Hub.Register.StartupHook("SVG Jax Config",function () {
        var SVG = MathJax.OutputJax.SVG, HTML = MathJax.HTML;

        //
        //  Don't need the styles
        //
        STYLES = SVG.config.styles;
        delete STYLES["#MathJax_SVG_Tooltip"];
        delete STYLES[".MathJax_SVG_Processing"];
        delete STYLES[".MathJax_SVG_Processed"];
        delete STYLES[".MathJax_SVG_ExBox"];
        STYLES = MathJax.Ajax.StyleString(STYLES);
        delete SVG.config.styles

        SVG.Augment({
          //
          //  Set up the default ex-size and width
          //
          InitializeSVG: function () {
            this.defaultEx    = 6;
            this.defaultWidth = 100;
          },
          //
          //  Adjust preTranslate() to not try to find the ex-size or
          //  the container widths.
          //
          preTranslate: function (state) {
            var scripts = state.jax[this.id], i, m = scripts.length,
                script, prev, span, div, jax, ex, em,
                maxwidth = 100000, relwidth = false, cwidth,
                linebreak = this.config.linebreaks.automatic,
                width = this.config.linebreaks.width;
            //
            //  Loop through the scripts
            //
            for (i = 0; i < m; i++) {
              script = scripts[i]; if (!script.parentNode) continue;
              //
              //  Remove any existing output
              //
              prev = script.previousSibling;
              if (prev && String(prev.className).match(/^MathJax(_SVG)?(_Display)?( MathJax(_SVG)?_Processing)?$/))
                {prev.parentNode.removeChild(prev)}
              //
              //  Add the span, and a div if in display mode,
              //  then set the role and mark it as being processed
              //
              jax = script.MathJax.elementJax; if (!jax) continue;
              jax.SVG = {display: (jax.root.Get("display") === "block")}
              span = div = HTML.Element("span",{
                style: {"font-size": this.config.scale+"%", display:"inline-block"},
                className:"MathJax_SVG", id:jax.inputID+"-Frame", isMathJax:true, jaxID:this.id
              });
              if (jax.SVG.display) {
                div = HTML.Element("div",{className:"MathJax_SVG_Display"});
                div.appendChild(span);
              }
              //
              //  Mark math for screen readers
              //    (screen readers don't know about role="math" yet, so use "textbox" instead)
              //
              div.setAttribute("role","textbox"); div.setAttribute("aria-readonly","true");
              div.className += " MathJax_SVG_Processing";
              script.parentNode.insertBefore(div,script);
              //
              //  Set SVG data for jax
              //
              jax.SVG.ex = ex = (data||defaults).ex; jax.SVG.cwidth = width;
              jax.SVG.em = em = ex / SVG.TeX.x_height * 1000; // scale ex to x_height
              jax.SVG.lineWidth = (linebreak ? width / em : 1000000);
            }
            //
            //  Set state variables used for displaying equations in chunks
            //
            state.SVGeqn = state.SVGlast = 0; state.SVGi = -1;
            state.SVGchunk = this.config.EqnChunk;
            state.SVGdelay = false;
          }
        });
        
        //
        //  TEXT boxes use getBBox, which isn't implemented, so
        //  use a monspace font and fake the size.  Since these
        //  are used only for error messages and undefined characters,
        //  this should be good enough for now.
        //
        SVG.BBOX.TEXT.Augment({
          Init: function (scale,text,def) {
            if (!def) {def = {}}; def.stroke = "none";
            this.SUPER(arguments).Init.call(this,def);
            SVG.addText(this.element,text);
            var bbox = {width: text.length * 8.5, height: 18, y: -12};
            scale *= 1000/SVG.em;
            this.element.setAttribute("style","font-family: monospace");
            this.element.setAttribute("transform","scale("+scale+") matrix(1 0 0 -1 0 0)");
            this.w = this.r = bbox.width*scale; this.l = 0;
            this.h = this.H = -bbox.y*scale;
            this.d = this.D = (bbox.height + bbox.y)*scale;
          }
        });

      });

      //
      //  A dummy output jax that does nothing (no output).
      //
      MathJax.OutputJax.None = MathJax.OutputJax({
        id: "None",
        version: "1.0",
        
        preProcess: function () {},
        Process: function () {},
        postProcess: function () {}
      });

      //
      //  Start the typesetting queue when MathJax is ready
      //    (reseting the counters so that the initial math doesn't affect them)
      //
      MathJax.Hub.Register.StartupHook("End",function () {
        MathJax.OutputJax.None.Register("jax/mml")
        serverReady = true;
        MathJax.Hub.Queue(StartQueue);
      });
      
    }
  };

}

//
//  Load MathJax into the DOM
//
function StartMathJax() {
  var script = document.createElement("script");
  script.src = MathJaxPath+"/MathJax.js";
  document.head.appendChild(script);
}

/********************************************************************/

//
//  Return an error value (and report it to console)
//
function ReportError(message) {
  AddError("",message);
  if (callback) {callback({errors: errors})}
}

//
//  Add an error to the error list and display it on the console
//
function AddError(prefix,message) {
  var n = MathJax.ElementJax.ID + 1;
  if (prefix !== "") {prefix += " ("+n+"): "}
  message = prefix+message;
  if (displayErrors) console.error(message);
  errors.push(message);
}


/********************************************************************/

//
//  Add the speach text and mark the SVG appropriately
//
function GetSpeach() {
  var nodes = document.querySelectorAll(".MathJax_SVG svg");
  for (var i = nodes.length-1; i >= 0; i--) {
    var svg = nodes[i];
    var id = svg.id;
    svg.setAttribute("role","math");
    svg.setAttribute("aria-labelledby",id+"-Title "+id+"-Desc");
    for (var i=0, m=svg.childNodes.length; i < m; i++)
      {svg.childNodes[i].setAttribute("aria-hidden",true)}
    var node = MathJax.HTML.Element("desc",{id:id+"-Desc"},["This will be the ChromeVox output"]);
    svg.insertBefore(node,svg.firstChild);
    node = MathJax.HTML.Element("title",{id:id+"-Title"},["Equation"]);
    svg.insertBefore(node,svg.firstChild);
  }
}

//
//  Create IMG node and the associated data URL for the svg image
//
function GetIMG() {
  var n = 0, nodes = document.getElementsByClassName("MathJax_SVG");
  for (var i = nodes.length-1; i >= 0;i--) {
    var svg = nodes[i].getElementsByTagName("svg")[0];
    var css = svg.style.cssText + 
         " width:"+svg.getAttribute("width") + "; height:"+svg.getAttribute("height");
    svg.style.cssText = ""; // this will be handled by the <img> tag instead
    svg.setAttribute("xmlns","http://www.w3.org/2000/svg");
    svg = svg.outerHTML.replace(/><([^/])/g,">\n<$1").replace(/(<\/[a-z]*>)(?=<\/)/g,"$1\n");
    svg = new Buffer(svg).toString("base64");  // encode svg as base64
    var img = MathJax.HTML.Element("img",{
      src:"data:image/svg+xml;base64,"+svg, style:{cssText:css},
      className: "MathJax_SVG_IMG"
    });
    nodes[i].parentNode.replaceChild(img,nodes[i]);
  }
}

//
//  When the expression is typeset,
//    clear the timeout timer, if any,
//    modify the page to suit the data parameters,
//    return the result object, and
//    do the next queued expression
//  
function TypesetDone(result,selector) {
  if (timer) {clearTimeout(timer); timer = null}
  if (errors.length) {result.errors = errors}
  if (data.renderer === "None") {content.innerHTML = "<p></p>"}
  var i, nodes;
  //
  //  Adjust SVG output
  //
  if (data.renderer === "SVG") {
    //
    //  Copy global SVG glyph defs into content
    //
    if (data.useGlobalCache && !data.imgSVG) {
      var defs = document.getElementById("MathJax_SVG_glyphs").parentNode.cloneNode(true);
      defs.style.display = "none";
      content.insertBefore(defs,content.firstChild);
    }
    //
    //  Add styles
    //
    var styles = document.createElement("style");
    styles.innerHTML = STYLES;
    styles.id="MathJax_SVG_styles";
    content.insertBefore(styles,content.firstChild);
    //
    //  Fix missing xlink namespace on href's
    //
    nodes = document.querySelectorAll(".MathJax_SVG use[href]");
    for (i = nodes.length-1; i >= 0; i--) {
      nodes[i].setAttribute("xlink:href",nodes[i].getAttribute("href"));
      nodes[i].removeAttribute("href");
    }
    //
    //  Fix a problem with jsdom not setting width and height
    //  CSS properties.  So do this by hand here.
    //  WARNING: this relies on the internals of jsdom, so may
    //  need to be adjusted in the future.
    //
    nodes = document.querySelectorAll(".MathJax_SVG > span > span");
    for (i = nodes.length-1; i >= 0; i--) {
      if (!nodes[i].style.width) {
        var style = nodes[i].style;
        style[style._length] = "width"; style._length++;
        style._values.width = nodes[i].firstChild.getAttribute("width");
        style[style._length] = "height"; style._length++;
        style._values.height = nodes[i].firstChild.getAttribute("height");
      }
    }
    //
    //  Add speach text, if needed
    //
    if (data.speakText) {GetSpeach()}
    //
    //  Create <img> tags for SVG output
    //
    if (data.imgSVG) {GetIMG()}
  }
  //
  //  Adjust NativeMML output
  //
  if (data.renderer === "NativeMML") {
    //
    //  Remove NativeMML spans
    //
    nodes = document.getElementsByClassName("MathJax_MathML");
    for (i = nodes.length-1; i >= 0; i--)
      {nodes[i].parentNode.replaceChild(nodes[i].getElementsByTagName("math")[0],nodes[i])}
  }
  //
  //  Remove the MathJax <script> tags
  //
  if (data.removeJax && selector) {
    nodes = document.querySelectorAll(selector);
    for (i = nodes.length-1; i >= 0; i--) {nodes[i].parentNode.removeChild(nodes[i])}
  }
  //
  //  Get the resulting HTML and return it
  //
  result.html = content.innerHTML;
  callback(result);
  StartQueue();
}

//
//  Start typesetting the queued expressions
//  
function StartQueue() {
  data = callback = null;       //  clear existing equation, if any
  errors = [];                  //  clear any errors
  if (!queue.length) return;    //  return if nothing to do

  var result = {}, $$ = window.Array;

  //
  //  Get the math data and callback
  //  and set the content with the proper delimiters
  //
  var item = queue.shift();
  data = item[0]; callback = item[1];
  content.innerHTML = data.html;  //  %%% disable <script> tags?

  //
  //  Set the SVG and TeX parameters
  //  according to the requested data
  //
  var SVG = MathJax.OutputJax.SVG,
      TEX = MathJax.InputJax.TeX,
      MML = MathJax.ElementJax.mml,
      HUB = MathJax.Hub,
      EXT = MathJax.Extension;

  SVG.defaultEx = data.ex;
  SVG.defaultWidth = data.width;
  SVG.config.linebreaks.automatic = data.linebreaks;
  SVG.config.linebreaks.width = data.width * data.ex;
  SVG.config.useFontCache = data.useFontCache;
  SVG.config.useGlobalCache = data.useGlobalCache && !data.imgSVG;
  TEX.config.equationNumbers.autoNumber = data.equationNumbers;
  
  //
  //  Set the TeX delimiters
  //
  var delimiters = $$($$('$','$'),$$('\\(','\\)'));
  if (!data.singleDollars) {delimiters.shift()}
  HUB.Config({tex2jax: delimiters});
  
  //
  //  Register the preprocessors and get the jax selector
  //
  var selectors = [];
  var INPUT = {
    TeX: [$$("PreProcess",EXT.tex2jax)],
    AsciiMath: [$$("PreProcess",EXT.asciimath2jax)],
    MathML: [$$("PreProcess",EXT.mml2jax),5]
  };
  HUB.preProcessors.hooks = [];
  for (var i = 0, m = data.inputs.length; i < m; i++) {
    if (INPUT[data.inputs[i]]) {
      HUB.Register.PreProcessor.apply(null,INPUT[data.inputs[i]]);
      var selector = SELECTOR[data.inputs[i]];
      for (var j = 0; j < selector.length; j++)
        {selectors.push("script[type='"+selector[j]+"']")}
    }
  }

  //
  //  Reset the MathJax counters for things
  //
  SVG.resetGlyphs(true);
  TEX.resetEquationNumbers();
  MML.SUPER.ID = 0;

  //
  //  Set up a timeout timer to restart MathJax if it runs too long,
  //  Then push the Typeset call, the MathML and SVG calls, and our
  //  TypesetDone routine
  //
  timer = setTimeout(RestartMathJax,data.timeout);
  HUB.Queue(
    $$("setRenderer",HUB,data.renderer),
    $$("Typeset",HUB),
    $$(TypesetDone,result,selectors.join(","))
  );
}

/********************************************************************/

//
//  If MathJax times out, discard the DOM
//  and load a new one (get a fresh MathJax)
//  
function RestartMathJax() {
  if (timer) {
    MathJax.Hub.queue.queue = [];  // clear MathJax queue, so pending operations won't fire
    MathJax = timer = null;
    ReportError("Timeout waiting for MathJax:  restarting");
  }
  GetWindow();
  ConfigureMathJax();
  StartMathJax();
}

/********************************************************************/

//
//  The API call to typeset a page
//  
//     %%% check data for correctness
//
exports.typeset = function (data,callback) {
  if (!callback || typeof(callback) !== "function") {
    if (displayErrors) console.error("Missing callback");
    return;
  }
  var options = {};
  for (var id in defaults) {if (defaults.hasOwnProperty(id)) {
    options[id] = (data.hasOwnProperty(id) ? data[id]: defaults[id]);
  }}
  queue.push([options,callback]);
  if (serverReady) StartQueue();
}

//
//  Start up MathJax in a new DOM
//
RestartMathJax();
