/*********************************************************************
 *
 *  mj-single-svg.js
 *  
 *  Implements an API to MathJax in node.js so that MathJax can be
 *  used server-side to generate SVG, MathML, or images (the latter
 *  requires an external library, batik, to do the svg to png
 *  conversion).  This API converts single math expressions to SVG,
 *  will giving control over the input format, the font caching, and
 *  a number of other features.
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
var jsdom = require("jsdom").jsdom;
var exec = require('child_process').exec;

var displayMessages = false;      // don't log Message.Set() calls
var displayErrors = true;         // show error messages on the console

var defaults = {
  ex: 6,                          // ex-size in pixels
  width: 100,                     // width of container (in ex) for linebreaking and tags
  useFontCache: true,             // use <defs> and <use> in svg output?
  useGlobalCache: false,          // use common <defs> for all equations?
  linebreaks: false,              // do linebreaking?
  equationNumbers: "none",        // or "AMS" or "all"

  math: "",                       // the math to typeset
  format: "TeX",                  // the input format (TeX, inline-TeX, AsciiMath, or MathML)

  mml: false,                     // return mml output?
  svg: false,                     // return svg output?
  img: false,                     // return img tag for remote image?
  png: false,                     // return png image (as data: URL)?

  speakText: false,               // add spoken annotations to svg output?

  timeout: 5 * 1000,              // 5 second timeout before restarting MathJax
};

var MathJaxPath = "file:///Data/Code/JavaScript/MathJax/Code/MathJax/unpacked";
var MathJax;   // filled in once MathJax is loaded
var serverReady = false; // true when MathJax has done its initial typeset (loaded all components)
var timer;     // used to reset MathJax if it runs too long
var tmpfile = "/tmp/mj-single-svg";  // file name prefix to use for temp files

var document, window, content; // the DOM elements

var queue = [];       // queue of typesetting requests of the form [data,callback]
var data, callback;   // the current queue item
var errors = [];      // errors collected durring the typesetting
var ID = 0;           // id for this SVG element

//
//  The delimiters used for each of the input formats
//
var delimiters = {
  TeX: ["$$","$$"],
  "inline-TeX": ["$","$"],
  AsciiMath: ["`","`"],
  MathML: ["",""]
};

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
    jax: ["input/TeX", "input/MathML", "input/AsciiMath", "output/SVG"],
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
        AddError("Math Processing Error: "+message[2].message);
      });
      MathJax.Hub.Register.MessageHook("SVG Jax - unknown char",function (message) {
        AddError("SVG - Unknown character: U+"+message[1].toString(16).toUpperCase()+
                    " in "+(message[2].fonts||["unknown"]).join(","));
      });
      MathJax.Hub.Register.MessageHook("MathML Jax - unknown node type",function (message) {
        AddError("MathML - Unknown node type: "+message[1]);
      });
      MathJax.Hub.Register.MessageHook("MathML Jax - parse error",function (message) {
        AddError("MathML - "+message[1]);
      });
      MathJax.Hub.Register.MessageHook("AsciiMath Jax - parse error",function (message) {
        AddError("AsciiMath parse error: "+message[1]);
      });
      MathJax.Hub.Register.MessageHook("TeX Jax - parse error",function (message) {
        AddError("TeX parse error: "+message[1]);
      });
      
      //
      //  Adjust the SVG output jax
      //
      MathJax.Hub.Register.StartupHook("SVG Jax Config",function () {
        var SVG = MathJax.OutputJax.SVG, HTML = MathJax.HTML;

        //
        //  Don't need the styles
        //
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
      //  Start the typesetting queue when MathJax is ready
      //    (reseting the counters so that the initial math doesn't affect them)
      //
      MathJax.Hub.Register.StartupHook("End",function () {
        MathJax.OutputJax.SVG.resetGlyphs(true);
        MathJax.ElementJax.mml.ID = 0;
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
  AddError(message);
  if (callback) {callback({errors: errors})}
}

//
//  Add an error to the error list and display it on the console
//
function AddError(message) {
  if (displayErrors) console.error(message);
  errors.push(message);
}


/********************************************************************/

//
//  Creates the MathML output (taking MathJax resets
//  into account)
//
function GetMML(result) {
  if (!data.mml) return;
  var mml, jax = MathJax.Hub.getAllJax()[0];
  try {result.mml = jax.root.toMathML('')} catch(err) {
    if (!err.restart) {throw err;} // an actual error
    return MathJax.Callback.After(window.Array(GetMML,result),err.restart);
  }
}

//
//  Create SVG output and PNG output, if requested
//
function GetSVG(result) {
  var jax = MathJax.Hub.getAllJax()[0];
  if (!jax) return;
  var script = jax.SourceElement(),
      svg = script.previousSibling.getElementsByTagName("svg")[0];
  svg.setAttribute("xmlns","http://www.w3.org/2000/svg");

  //
  //  Add the speach elements, if needed
  //
  if (data.speakText) {GetSpeach(svg)}

  //
  //  SVG data is modified to add linebreaks for readability,
  //  and to put back the xlink namespace that is removed in HTML5
  //
  var svgdata = svg.outerHTML.replace(/><([^/])/g,">\n<$1")
                             .replace(/(<\/[a-z]*>)(?=<\/)/g,"$1\n")
                             .replace(/(<use [^>]*)(href=)/g,' $1xlink:$2');
  //
  //  The file version includes the xml and DOCTYPE comments
  //
  var svgfile = [
    '<?xml version="1.0" standalone="no"?>',
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
    svgdata
  ].join("\n");

  //
  //  Add the requested data to the results
  //
  if (data.svg) {result.svg = svgdata}
  if (data.img) {
    if (data.svg) result.svg = svgfile;
    result.img = '<img src="file.svg" style="'+svg.style.cssText+
       " width:"+svg.getAttribute("width")+"; height:"+svg.getAttribute("height")+';">';
  }
  if (data.png) {
    var callback = MathJax.Callback(function () {}); // for synchronization with MathJax
    fs.writeFileSync(tmpfile+".svg",svgfile);
    exec("java -jar batik/batik-rasterizer.jar "+tmpfile+".svg",function (err,stdout,stderr) {
      if (err) {AddError(err)} else {
        var buffer = fs.readFileSync(tmpfile+".png");
        result.png = "data:image/png;base64," + buffer.toString('base64');
        fs.unlinkSync(tmpfile+".svg"); fs.unlinkSync(tmpfile+".png");
        callback();
      }
    });
    return callback;  //  This keeps the queue from continuing until the exec() is complete
  }
}

//
//  Add the speach text and mark the SVG appropriately
//
function GetSpeach(svg) {
  ID++; var id = "MathJax-SVG-"+ID;
  svg.setAttribute("role","math");
  svg.setAttribute("aria-labelledby",id+"-Title "+id+"-Desc");
  for (var i=0, m=svg.childNodes.length; i < m; i++)
    {svg.childNodes[i].setAttribute("aria-hidden",true)}
  var node = MathJax.HTML.Element("desc",{id:id+"-Desc"},["This will be the ChromeVox output"]);
  svg.insertBefore(node,svg.firstChild);
  node = MathJax.HTML.Element("title",{id:id+"-Title"},["Equation"]);
  svg.insertBefore(node,svg.firstChild);
}

//
//  When the expression is typeset,
//    clear the timeout timer, if any,
//    update the MathJax state,
//    return the result object, and
//    do the next queued expression
//  
function TypesetDone(result) {
  if (timer) {clearTimeout(timer); timer = null}
  var state = data.state;
  if (state) {
    var AMS = MathJax.Extension["TeX/AMSmath"];
    var GLYPH = MathJax.OutputJax.SVG.BBOX.GLYPH;
    state.AMS.startNumber = AMS.startNumber;
    state.AMS.labels = AMS.labels;
    state.AMS.IDs = AMS.IDs;
    state.mmlID = MathJax.ElementJax.mml.SUPER.ID;
    state.glyphs = GLYPH.glyphs;
    state.defs = GLYPH.defs;
    state.n = GLYPH.n;
    state.ID = ID;
  }
  if (errors.length) {result.errors = errors}
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

  //
  //  Get the math data and callback
  //  and set the content with the proper delimiters
  //
  var item = queue.shift();
  data = item[0]; callback = item[1];
  var delim = delimiters[data.format];
  var math = data.math;
  if (data.format !== "MathML") {
    math = math.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }
  content.innerHTML = delim[0]+math+delim[1];

  //
  //  Set the SVG and TeX parameters
  //  according to the requested data
  //
  var SVG = MathJax.OutputJax.SVG,
      TEX = MathJax.InputJax.TeX,
      MML = MathJax.ElementJax.mml,
      AMS = MathJax.Extension["TeX/AMSmath"],
      HUB = MathJax.Hub, HTML = MathJax.HTML,
      GLYPH = SVG.BBOX.GLYPH;

  SVG.defaultEx = data.ex;
  SVG.defaultWidth = data.width;
  SVG.config.linebreaks.automatic = data.linebreaks;
  SVG.config.linebreaks.width = data.width * data.ex;
  SVG.config.useFontCache = data.useFontCache;
  SVG.config.useGlobalCache = data.useGlobalCache;
  TEX.config.equationNumbers.autoNumber = data.equationNumbers;

  //
  //  Update the MathJax values from the state,
  //  or clear them if there is no state.
  //  
  var state = data.state;
  if (state && state.AMS) {
    AMS.startNumber = state.AMS.startNumber;
    AMS.labels = state.AMS.labels;
    AMS.IDs = state.AMS.IDs;
    MML.SUPER.ID = state.mmlID;
    GLYPH.glyphs = state.glyphs;
    GLYPH.defs = state.defs;
    GLYPH.n = state.n;
    ID = state.ID;
  } else {
    if (state) {state.AMS = {}}
    SVG.resetGlyphs(true);
    if (data.useGlobalCache) {
      state.glyphs = {};
      state.defs = HTML.Element("defs");
      state.n = 0;
    }
    TEX.resetEquationNumbers();
    MML.SUPER.ID = ID = 0;
  }

  //
  //  Set up a timeout timer to restart MathJax if it runs too long,
  //  Then push the Typeset call, the MathML and SVG calls, and our
  //  TypesetDone routine
  //
  timer = setTimeout(RestartMathJax,data.timeout);
  var result = {}, $$ = window.Array;
  HUB.Queue(
    $$("Typeset",HUB),
    $$(GetMML,result),
    $$(GetSVG,result),
    $$(TypesetDone,result)
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
//  The API call to typeset an equation
//  
//     %%% cache results?
//     %%% check types and values of parameters
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
  if (data.state) {options.state = data.state}
  if (!delimiters[options.format]) {ReportError("Unknown format: "+options.format); return}
  queue.push([options,callback]);
  if (serverReady) StartQueue();
}

//
//  Start up MathJax in a new DOM
//
RestartMathJax();
