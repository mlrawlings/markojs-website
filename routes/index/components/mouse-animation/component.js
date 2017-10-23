module.exports = {
  onCreate() {
    this.state = {
      x: 0,
      y: 0,
      big: false,
      counter: 0
    };
  },

  onInput(input) {
    this.state.x = input.x || 0;
    this.state.y = input.y || 0;
  },

  onMount() {
    let touch = navigator.maxTouchPoints > 1;
    let windowEvents = this.subscribeTo(window);
    // set mouse position state on move:
    windowEvents.on(touch ? "touchmove" : "mousemove", e => {
      this.setMouse(e.touches ? e.touches[0] : e);
    });

    // holding the mouse down enables big mode:
    windowEvents.on(touch ? "touchstart" : "mousedown", e => {
      this.setBig(true);
      e.preventDefault();
    });

    windowEvents.on(touch ? "touchend" : "mouseup", e => this.setBig(false));

    // disable dragging on mobile
    windowEvents.on("touchstart", e => (e.preventDefault(), false));
    windowEvents.on("scroll", e => (e.preventDefault(), false));

    let incrementer = () => {
      this.increment();
      window.requestAnimationFrame(incrementer);
    };

    incrementer();
  },

  // Magic: triggering setState() in onUpdate() creates an animation loop!
  onUpdate() {
    //window.setTimeout(() => this.increment(), 10000);
  },

  increment() {
    this.state.counter++;
  },

  setMouse({ clientX: x, clientY: y }) {
    this.state.x = x;
    this.state.y = y;
    return false;
  },

  setBig(big) {
    this.state.big = big;
  }
};
