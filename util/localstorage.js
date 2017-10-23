function getMarkoWebsiteKey(key) {
  return `markojs-website:${key}`;
}

exports.get = key => localStorage.getItem(getMarkoWebsiteKey(key));
exports.set = (key, value) =>
  localStorage.setItem(getMarkoWebsiteKey(key), value);
exports.getMarkoWebsiteKey = getMarkoWebsiteKey;
