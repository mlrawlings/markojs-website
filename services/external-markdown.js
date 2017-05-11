const https = require('https');
const ExternalMarkdownFiles = require('./external-markdown-files.json');
const MarkdownDocument = require('../routes/docs/util/MarkdownDocument');

const DEFAULT_REPO = 'marko-js/marko';

function getMarkdownDocument(doc) {
    return new Promise((resolve, reject) => {
        https.get(doc.url, (res) => {
            res.setEncoding('utf-8');

            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                doc.markdown = data;
                resolve(doc);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

let markdownDocsToFetch = ExternalMarkdownFiles.map((data) => {
    return new MarkdownDocument(data);
});

// Map of document name to MarkdownDocument. e.g. 'color-picker'
let documentNameToMarkdownDocument = {};

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

const getMarkdownDocumentByDocumentName = exports.getMarkdownDocumentByDocumentName = (documentName) => {
    return documentNameToMarkdownDocument[documentName];
};

const getRepoAndPath = exports.getRepoAndPath = (repoFilePath) => {
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
};

exports.getCompleteFileUrl = (filePath) => {
    let { repo, repoFilePath } = getRepoAndPath(filePath);
    return `https://github.com/${repo}/blob/master/${repoFilePath}`;
};

