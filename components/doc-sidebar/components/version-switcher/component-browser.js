module.exports = {
  switchVersion(e) {
    var location = e.target.value;
    if (location !== "current") {
      e.target.value = "current";
      window.location.href = location;
    }
  }
};
