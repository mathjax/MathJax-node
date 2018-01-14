var tape = require('tape');
var mjAPI = require("../lib/main.js");

tape('macros should be cleared from global state', function(t) {
  t.plan(2);
  mjAPI.start();

  mjAPI.typeset({
    math: "\\def\\mymacro{2\\pi} \\mymacro",
    format: "TeX",
    mml: true
  }, function(data) {
    t.false(data.errors, 'Defined and used macro');
  });

  mjAPI.typeset({
    math: "\\mymacro",
    format: "TeX",
    mml: true
  }, function(data) {
    t.true(data.errors, '\\mymacro should no longer be defined');
  });
});

tape('macros can be persisted using state option', function(t) {
  t.plan(4);
  mjAPI.start();

  var state = {};

  mjAPI.typeset({
    math: "\\def\\mymacro{2\\pi} \\mymacro",
    format: "TeX",
    mml: true,
    state: state
  }, function(data) {
    t.false(data.errors, 'Defined and used macro');
    t.equal(Object.keys(state.macros).length, 1, 'Only stores the user defined macro in state');

    // Ensure state contains only serializable data
    state = JSON.parse(JSON.stringify(state));

    mjAPI.typeset({
      math: "\\mymacro",
      format: "TeX",
      mml: true,
      state: state
    }, function(data) {
      t.false(data.errors, '\\mymacro was not persisted in state');
    });

    mjAPI.typeset({
      math: "\\mymacro",
      format: "TeX",
      mml: true,
    }, function(data) {
      t.true(data.errors, '\\mymacro should no longer be defined if state is not provided');
    });
  });
});

tape('environment should be cleared from global state', function(t) {
  t.plan(2);
  mjAPI.start();

  mjAPI.typeset({
    math: "\\newenvironment{myenv}[0]{before}{after} \\begin{myenv}x\\end{myenv}",
    format: "TeX",
    mml: true
  }, function(data) {
    t.false(data.errors, 'Could not define and use environment');
  });

  mjAPI.typeset({
    math: "\\begin{myenv}x\\end{myenv}",
    format: "TeX",
    mml: true
  }, function(data) {
    t.true(data.errors, 'myenv should no longer be defined');
  });
});

tape('macros can be persisted using state option', function(t) {
  t.plan(4);
  mjAPI.start();

  var state = {};

  mjAPI.typeset({
    math: "\\newenvironment{myenv}[0]{before}{after} \\begin{myenv}x\\end{myenv}",
    format: "TeX",
    mml: true,
    state: state
  }, function(data) {
    t.false(data.errors, 'Could not define and use environment');
    t.equal(Object.keys(state.environment).length, 1, 'Only stores the user defined environments in state');

    // Ensure state contains only serializable data
    state = JSON.parse(JSON.stringify(state));

    mjAPI.typeset({
      math: "\\begin{myenv}x\\end{myenv}",
      format: "TeX",
      mml: true,
      state: state
    }, function(data) {
      t.false(data.errors, 'myenv was not persisted in state');
    });

    mjAPI.typeset({
      math: "\\begin{myenv}x\\end{myenv}",
      format: "TeX",
      mml: true,
    }, function(data) {
      t.true(data.errors, 'myenv should no longer be defined if state is not provided');
    });
  });
});
