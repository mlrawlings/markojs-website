var modify = require("modify-babel-preset");

var LOOSE = { loose: true };

module.exports = modify("es2015", {
  "transform-es2015-template-literals": LOOSE,
  "transform-es2015-function-name": false,
  "transform-es2015-arrow-functions": {},
  "transform-es2015-block-scoped-functions": {},
  "transform-es2015-classes": LOOSE,
  "transform-es2015-object-super": {},
  "transform-es2015-shorthand-properties": {},
  "transform-es2015-duplicate-keys": {},
  "transform-es2015-computed-properties": LOOSE,
  "transform-es2015-for-of": LOOSE,
  "transform-es2015-sticky-regex": false,
  "transform-es2015-unicode-regex": false,
  "check-es2015-constants": false,
  "transform-es2015-spread": LOOSE,
  "transform-es2015-parameters": {},
  "transform-es2015-destructuring": LOOSE,
  "transform-es2015-block-scoping": {},
  "transform-es2015-typeof-symbol": {},
  "transform-es2015-modules-commonjs": false,
  "transform-regenerator": { async: false, asyncGenerators: false },
  "transform-strict-mode": false
});
