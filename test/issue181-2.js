var tape = require('tape');
var execFileSync = require('child_process').execFileSync;

tape('page with no math should not change', function(t) {
  t.plan(1);

  var html = "<!DOCTYPE html>\n<html><head></head><body><p>testing</p></body></html>\n";

  var result = execFileSync('bin/page2html',{input:html}).toString();
  t.equal(result,html, 'HTML with no math is unchanged');
});
