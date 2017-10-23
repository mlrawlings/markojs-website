const fs = require("fs");
const path = require("path");
const template = require("./index.marko");
const MarkdownDocument = require("./util/MarkdownDocument");
const getContributors = require("./util/contributors");
const generateOverviewDocs = require("./util/generateOverviewDocs");
const markdownToTemplate = require("./util/markdown").toTemplate;

const docsDir = path.join(process.cwd(), "node_modules", "marko", "docs");
const docFileNames = fs
  .readdirSync(docsDir)
  .filter(doc => /\.md$/.test(doc))
  .map(doc => doc.slice(0, -3));

const documents = require("../../services/external-markdown").getDocuments();
let docNameToMarkdownDocument = Object.assign({}, documents);

docFileNames.forEach(docFileName => {
  const filePath = path.join(docsDir, docFileName + ".md");
  const markdown = fs.readFileSync(filePath, "utf-8");

  docNameToMarkdownDocument[docFileName] = new MarkdownDocument({
    filePath,
    markdown,
    documentName: path.basename(filePath)
  });
});

docNameToMarkdownDocument = Object.assign(
  docNameToMarkdownDocument,
  generateOverviewDocs()
);

exports.path = "/docs/:name/";
exports.params = Object.keys(docNameToMarkdownDocument).map(docName => ({
  name: docName
}));

exports.handler = (input, out) => {
  let name = input.params.name;

  const markdownDocument = docNameToMarkdownDocument[name];

  let doc = markdownToTemplate(markdownDocument);
  let toc = doc.toc;
  let contributors = getContributors(name);

  let $global = { dependencies: doc.getDependencies() };

  template.render({ $global, name, doc, toc, contributors }, out);
};
