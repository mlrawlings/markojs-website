var siteHeaderEvents = require("./events");

var classNames = {
  base: "headspace",
  fixed: "headspace--fixed",
  hidden: "headspace--hidden"
};
var debounce = cb => () => window.requestAnimationFrame(cb);
var tolerance = 3;

module.exports = {
  onMount() {
    siteHeaderEvents.emit("create", this);
    var scrollLast = window.pageYOffset;
    var startOffset = this.el.offsetHeight;

    var handleScroll = debounce(() => {
      var scrollCurrent = window.pageYOffset;

      if (scrollCurrent <= 0) {
        this.reset();
      } else if (!this.paused && scrollCurrent > startOffset) {
        var toleanceReached = Math.abs(scrollCurrent - scrollLast) >= tolerance;
        var scrollingDown = scrollCurrent > scrollLast;
        var wasAtTop = scrollLast <= startOffset;
        if (toleanceReached || (scrollingDown && wasAtTop)) {
          scrollCurrent > scrollLast ? this.hide() : this.fix();
        }
      }

      scrollLast = scrollCurrent;
    });

    window.addEventListener("scroll", handleScroll);
  },
  reset() {
    this.removeClass(classNames.fixed);
    this.removeClass(classNames.hidden);
    siteHeaderEvents.emit("reset");
  },
  fix() {
    this.addClass(classNames.fixed);
    this.removeClass(classNames.hidden);
    siteHeaderEvents.emit("fix");
  },
  hide() {
    this.addClass(classNames.hidden);
    siteHeaderEvents.emit("hide");
  },
  addClass(cls) {
    this.el.classList.add(cls);
  },
  removeClass(cls) {
    this.el.classList.remove(cls);
  },
  pause() {
    this.paused = true;
  },
  resume() {
    setTimeout(() =>
      window.requestAnimationFrame(() => {
        this.paused = false;
      })
    );
  }
};
