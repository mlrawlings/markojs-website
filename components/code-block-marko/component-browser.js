"use strict";

const getComponentForEl = require("marko/components").getComponentForEl;
const localStorageUtil = require("~/util/localStorage");

module.exports = {
  changeSyntax: function() {
    var header = getComponentForEl(document.querySelector(".site-header"));
    var beforeScroll = document.body.scrollTop;
    var beforePosition = this.el.offsetTop;

    header.pause();

    if (localStorageUtil.get("syntax") === "concise") {
      localStorageUtil.set("syntax", "html");
      document.body.classList.remove("concise");
    } else {
      localStorageUtil.set("syntax", "concise");
      document.body.classList.add("concise");
    }

    var afterPosition = this.el.offsetTop;
    var afterScroll = beforeScroll - beforePosition + afterPosition;

    document.body.scrollTop = afterScroll;

    header.resume();
  }
};
