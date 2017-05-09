const structure = require('marko/docs/structure.json');
const formatSlug = require('../../../util/formatSlug');
const MarkdownDocument = require('./MarkdownDocument');
const overviewTemplate = require('../components/document-overview/index.marko');

const generateOverviewDocs = function() {
    let docNameToMarkdownDocument = {};

    for (let i = 0; i < structure.length; i++) {
        let {
            title,
            docs
        } = structure[i];

        let  markdown = overviewTemplate.renderToString({
           title, docs
        });

        // Removing the surrounding div and newlines from the template
        markdown = markdown.substr(5, markdown.length - 14)

        const docName = `${formatSlug(title)}-overview`;
        docNameToMarkdownDocument[docName] = new MarkdownDocument({
            markdown,
            documentName: `${docName}.md`,
        });
    }

    return docNameToMarkdownDocument;
};

module.exports = generateOverviewDocs;
