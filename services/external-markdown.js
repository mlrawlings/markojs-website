const https = require('https');
const ExternalMarkdownFiles = require('./external-markdown-files.json');
const getUrl = require('../util/getUrl');
const MarkdownDocument = require('../routes/docs/util/MarkdownDocument');

const DEFAULT_REPO = 'marko-js/marko';

function getMarkdownDocument(doc) {
    return getUrl(doc.url)
        .then((data) => {
            doc.markdown = data;
            return doc;
        });
}

let markdownDocsToFetch = ExternalMarkdownFiles.map((data) => {
    return new MarkdownDocument(data);
});

// Map of document name to MarkdownDocument. e.g. 'color-picker'
let documentNameToMarkdownDocument = {};

function getMarkdownDocumentByDocumentName(documentName) {
    return documentNameToMarkdownDocument[documentName];
}

function getRepoAndPath(repoFilePath) {
    const document = getMarkdownDocumentByDocumentName(repoFilePath);

    let repo;

    if (document) {
        repo = document.repo;
        repoFilePath = document.repoFilePath;
    } else {
        repo = DEFAULT_REPO;
        repoFilePath = `docs/${repoFilePath}.md`;
    }

    return { repo, repoFilePath };
}

function getCompleteFileUrl(filePath) {
    let { repo, repoFilePath } = getRepoAndPath(filePath);
    return `https://github.com/${repo}/blob/master/${repoFilePath}`;
}

exports.register = () => {
    let promises = [];

    markdownDocsToFetch.forEach((doc) => {
        let promise = getMarkdownDocument(doc)
            .then((markdownDocument) => {
                const documentName = markdownDocument.documentName.slice(0, -3);
                documentNameToMarkdownDocument[documentName] =
                    markdownDocument;
            })
            .catch((err) => {
                throw err;
            });
        promises.push(promise);
    });

    return Promise.all(promises);
};

exports.getDocuments = () => documentNameToMarkdownDocument;
exports.getMarkdownDocumentByDocumentName = getMarkdownDocumentByDocumentName;
exports.getRepoAndPath = getRepoAndPath;
exports.getCompleteFileUrl = getCompleteFileUrl;

