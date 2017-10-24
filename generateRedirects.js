const fs = require("fs");
const path = require("path");
const util = require("util");
const writeFile = util.promisify(fs.writeFile);
const mkdirp = util.promisify(require("mkdirp"));

var redirects = {
  docs: "/docs/getting-started"
};

async function generateRedirectFile(from, to) {
  const outFile = path.join(__dirname, "dist", from, "index.html");
  await mkdirp(path.dirname(outFile));

  const html = `<html><head><meta http-equiv="refresh" content="0; url=${to}">
<link rel="canonical" href="${to}"></head></html`;
  await writeFile(outFile, html, { encoding: "utf8" });
}

async function generateRedirects() {
  for (let from in redirects) {
    let to = redirects[from];
    await generateRedirectFile(from, to);
  }
}

module.exports = generateRedirects;
