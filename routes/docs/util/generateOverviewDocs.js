const structure = require("marko/docs/structure.json");
const formatSlug = require("../../../util/formatSlug");
const MarkdownDocument = require("./MarkdownDocument");
const overviewTemplate = require("../components/document-overview/index.marko");

function generateMarkdown(title, docs) {
  let markdown = overviewTemplate.renderToString({
    title,
    docs
  });

  // Removing the surrounding div and newlines from the template
  return markdown.substr(5, markdown.length - 14);
}

let docNameToMarkdownDocument = {};

function generateOverviewDoc(doc, section, subDoc) {
  let { title, docs } = doc;

  // If one of the docs is an object, it is nested and we need to create an
  // outline for it
  docs.forEach(internalDoc => {
    if (typeof internalDoc === "object") {
      generateOverviewDoc(internalDoc, section, true);
    }
  });

  const markdown = generateMarkdown(title, docs);

  let docName;
  const titleSlug = formatSlug(title);

  if (subDoc) {
    const sectionSlug = formatSlug(section.title);
    docName = `${sectionSlug}-${titleSlug}-overview`;
  } else {
    docName = `${titleSlug}-overview`;
  }

  docNameToMarkdownDocument[docName] = new MarkdownDocument({
    markdown,
    documentName: `${docName}.md`
  });
}

const generateOverviewDocs = function() {
  structure.forEach(doc => {
    generateOverviewDoc(doc, doc);
  });
  return docNameToMarkdownDocument;
};

module.exports = generateOverviewDocs;
