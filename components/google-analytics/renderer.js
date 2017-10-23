var template = require("./template.marko");

module.exports = function render(input, context) {
  if (input.trackingId && input.domain) {
    template.render(input, context);
  }
};
