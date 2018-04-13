MathJax.Hub.Register.StartupHook("TeX Jax Ready", function () {
  var TEX = MathJax.InputJax.TeX;
  var MML = MathJax.ElementJax.mml;
  TEX.Definitions.macros.version = "Version";
  TEX.Parse.Augment({
    Version: function (name) {
      this.Push(MML.mtext(MathJax.version));
    }
  });
});

MathJax.Ajax.loadComplete("[test]/version.js");