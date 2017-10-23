const fs = require("fs");
const path = require("path");
const marko = require("marko");
const markoCompiler = require("marko/compiler");
const marked = require("marked");
const md5 = require("md5");
const TOC = require("./toc");

// Used for matching against sections of the markdown that should be replaced
// by a Marko component:
//
// <!-- <my-component name="John"/>() -->
// <img src="./some-img.png"/>
// <!-- </> -->
let componentCommentRegex = /<!-- (.*?)\(\) -->[\s\S]*?<\/> -->/g;

const generatedComponentsDir = path.resolve(
  __dirname,
  "../../../components-generated"
);

/**
 * Map of element to hash. Used for avoiding hashing that has already been
 * done for repeat elements
 *
 * e.g.
 *
 * {
 *   "<color-picker colors=['#333745','#E63462','#FE5F55','#C7EFCF','#EEF5DB','#00B4A6','#007DB6','#FFE972','#9C7671','#0C192B']/>": "4eecf8ab5cc984070edc41d7c93dbd14"
 * }
 */
let generatedComponentMap = {};

function createGeneratedComponent(componentDef) {
  let elementEndIndex = componentDef.indexOf(" ");

  if (elementEndIndex === -1) {
    elementEndIndex = componentDef.indexOf("/");
  }

  const componentName = componentDef.substr(1, elementEndIndex - 1);

  let hash;
  let foundHash;

  if (generatedComponentMap[componentDef]) {
    hash = generatedComponentMap[componentDef];
    foundHash = true;
  } else {
    hash = md5(componentDef);
    generatedComponentMap[componentDef] = hash;
  }

  const generatedComponentName = `external-component-${componentName}-${hash}`;

  // If the hash was not found in the `generatedComponentMap`, we will go
  // ahead and create or overwrite the existing file.
  if (!foundHash) {
    if (!fs.existsSync(generatedComponentsDir)) {
      fs.mkdirSync(generatedComponentsDir);
    }

    const componentPath = path.resolve(
      generatedComponentsDir,
      generatedComponentName + ".marko"
    );
    const code = `<external-component>${componentDef}</external-component>`;

    fs.writeFileSync(componentPath, code);

    // We need to rediscover custom tags because we just generated a new
    // component on the fly.
    markoCompiler.clearCaches();
  }

  return `<${generatedComponentName}/>`;
}

exports.toTemplate = function renderMarkdown(markdownDocument) {
  let { markdown, documentName, filePath } = markdownDocument;

  markdown = markdown
    .replace(/\&/g, "&amp;")
    .replace(/\$/g, "&#36;")
    .replace(/https?:\/\/markojs\.com\//g, "/")
    .replace(/\.\/([\w\d-\/]+)\.md/g, match => {
      // Markdown documents from external sources do not have a file path
      if (filePath) {
        const linkpath = path.resolve(path.dirname(filePath), match);
        const linkmatch = /(\/docs\/.*)\.md/.exec(linkpath);
        return (linkmatch && linkmatch[1] + "/") || match;
      }
      return match;
    })
    .replace(componentCommentRegex, match => {
      // Find the Marko tag execution instance
      // e.g. <!-- <my-component name="Austin"/>() -->
      let component = componentCommentRegex.exec(match);
      componentCommentRegex.lastIndex = 0;
      return createGeneratedComponent(component[1]);
    });

  var markedRenderer = new marked.Renderer();
  var toc = TOC.create();
  var anchorCache = {};
  var title;

  markedRenderer.table = function(header, body) {
    var output = '<table class="markdown-table">';
    if (header) {
      output += "<thead>" + header + "</thead>";
    }

    if (body) {
      output += "<tbody>" + body + "</tbody>";
    }
    output += "</table>";
    return output;
  };

  markedRenderer.heading = function(text, level) {
    var anchorName = getAnchorName(text, anchorCache);
    var linkText = text
      .replace(/\([^\)]+\)/g, "()")
      .replace(/<\/?code\>/g, "")
      .replace(/&amp;lt;/g, "&lt;");

    title = title || linkText;

    toc.addHeading(linkText, anchorName, level);

    return (
      `<h${level} id="${anchorName}">` +
      `<a name="${anchorName}" class="anchor" href="#${anchorName}">` +
      `<span class="header-link"></span>` +
      `</a>` +
      text +
      `</h${level}>`
    );
  };

  markedRenderer.code = function(code, lang, escaped) {
    var lines = "";
    var index = lang && lang.indexOf("{");

    if (index && index !== -1) {
      lines = lang.slice(index + 1, -1);
      lang = lang.slice(0, index);
    }

    return `<code-block lang="${lang}" lines="${lines}">${code}</code-block>`;
  };

  markedRenderer.image = function(href, title, text) {
    let imageCode = `<lasso-img src=${JSON.stringify(
      path.resolve(path.dirname(filePath), href)
    )} alt=${JSON.stringify(text || "")} />`;
    return imageCode;
  };

  var html =
    "-----\n" +
    marked(markdown, {
      renderer: markedRenderer
    }) +
    "\n-----\n";

  // The path inside the markojs-website base directory
  // e.g. ~/markojs-website/webpack.md
  const templateVirtualPath = path.join(process.cwd(), documentName);

  var template;

  try {
    template = marko.load(templateVirtualPath, html, { writeToDisk: false });
  } catch (e) {
    console.log(html);
    throw e;
  }

  template.toc = toc.toHTML();
  template.title = title;

  return template;
};

function getAnchorName(title, anchorCache) {
  var anchorName = title
    .replace(/[ \-]+/g, "-")
    .replace(/[^A-Z0-9\-]+/gi, "")
    .toLowerCase();
  var repeat =
    anchorCache[anchorName] != null
      ? ++anchorCache[anchorName]
      : (anchorCache[anchorName] = 0);
  if (repeat) {
    anchorName += "_" + repeat;
  }
  return anchorName;
}
