module.exports = function(el, context) {
  el.body.array.forEach(item => {
    if (item.type === "Text" && item.argument.type === "Literal") {
      item.argument.value = item.argument.value
        .replace(/&amp;lt;/g, "&lt;")
        .replace(/&amp;#36;/g, "$");
    }
  });
};
