//
//  Patch for CSSStyleDeclaration padding property so that it sets/clears
//  the Top, Right, Bottom, and Left properties (and also validates the 
//  padding value)
//
var PADDING = (function () {
  var parsers = require('jsdom/node_modules/cssstyle/lib/parsers.js');
  var TYPES = parsers.TYPES;

  var isValid = function (v) {
    var type = parsers.valueType(v);
    return type === TYPES.LENGTH || type === TYPES.PERCENT;
  };

  var parser = function (v) {
    return parsers.parseMeasurement(v);
  }
  
  var mySetter = parsers.implicitSetter('padding', '', isValid, parser);
  var myGlobal = parsers.implicitSetter('padding', '', function () {return true}, function (v) {return v});

  return {
    set: function (v) {
      if (typeof v === "number") v = String(v);
      if (typeof v !== "string") return;
      var V = v.toLowerCase();
      switch (V) {
       case 'inherit':
       case 'initial':
       case 'unset':
       case '':
        myGlobal.call(this, V);
        break;
        
       default:
        mySetter.call(this, v);
        break;
      }
    },
    get: function () {
      return this.getPropertyValue('padding');
    },
    enumerable: true,
    configurable: true
  };
})();

//
//  Patch for CSSStyleDeclaration margin property so that it sets/clears
//  the Top, Right, Bottom, and Left properties (and also validates the 
//  margin value)
//
var MARGIN = (function () {
  var parsers = require('jsdom/node_modules/cssstyle/lib/parsers.js');
  var TYPES = parsers.TYPES;

  var isValid = function (v) {
    if (v.toLowerCase() === "auto") return true;
    var type = parsers.valueType(v);
    return type === TYPES.LENGTH || type === TYPES.PERCENT;
  };

  var parser = function (v) {
    var V = v.toLowerCase();
    if (V === "auto") return V;
    return parsers.parseMeasurement(v);
  }

  var mySetter = parsers.implicitSetter('margin', '', isValid, parser);
  var myGlobal = parsers.implicitSetter('margin', '', function () {return true}, function (v) {return v});

  return {
    set: function (v) {
      if (typeof v === "number") v = String(v);
      if (typeof v !== "string") return;
      var V = v.toLowerCase();
      switch (V) {
       case 'inherit':
       case 'initial':
       case 'unset':
       case '':
        myGlobal.call(this, V);
        break;
        
       default:
        mySetter.call(this, v);
        break;
      }
    },
    get: function () {
      return this.getPropertyValue('margin');
    },
    enumerable: true,
    configurable: true
  };
})();


//
//  Patch jsdom functions
//
exports.patch = function (jsdom) {
  var document = jsdom('');
  var window = document.defaultView;
  //
  //  Fix setting of style attributes so shorthands work properly.
  //
  var div = document.createElement("div");
  div.style.border = "1px solid black";
  if (div.style.border !== "1px solid black") {
    var INIT = window.HTMLElement._init;
    window.HTMLElement._init = function () {
      INIT.apply(this,arguments);
      var that = this;
      this.style._onChange = function (csstext) {
        if (!that._settingCssText) {
          that._settingCssText = true;
          that.setAttribute('style', csstext);
          that._settingCssText = false;
        }
      };
    }
  }
  //
  //  Add missing nodeName to Attr (after jsdom 7.1.0, it is no longer defined)
  //  since this is used in mml2jax.
  //
  if (!("nodeName" in window.Attr.prototype)) {
    Object.defineProperties(window.Attr.prototype,{
      nodeName: {get: function() {return this.name}}
    });
  }
  //
  //  Fix CSSStyleDeclaration properties that are broken (padding, margin)
  //
  div.style.paddingTop = "10px";
  div.style.padding = "1px";
  if (div.style.paddingTop !== "1px") {
    var core = require("jsdom/lib/jsdom/level1/core");
    Object.defineProperties(core.CSSStyleDeclaration.prototype,{
      padding: PADDING,
      margin: MARGIN
    });
  }
}