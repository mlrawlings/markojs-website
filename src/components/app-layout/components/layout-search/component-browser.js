module.exports = {
  focus(e) {
    var input = this.getEl("input");
    if (e.target != input) {
      input.focus();
    }
  },
  grow() {
    this.el.classList.add("large");
    this.getEl("input").value = "";
  },
  shrink() {
    this.el.classList.remove("large");
  },
  search(e) {
    var value = this.getEl("input").value;
    value = encodeURIComponent(value.replace(/\s+/g, " ")).replace(
      /\%20/g,
      "+"
    );
    window.location.href =
      "https://google.com/search?q=" + value + "+site:markojs.com";
    e.preventDefault();
  }
};
