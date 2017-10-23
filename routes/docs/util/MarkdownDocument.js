class MarkdownDocument {
  constructor(options) {
    let { documentName, markdown, url, repo, filePath, repoFilePath } = options;

    this.documentName = documentName;
    this.url = url;
    this.markdown = markdown;
    this.filePath = filePath;
    this.repo = repo;
    // Used as the file path for the contributors component
    this.repoFilePath = repoFilePath;
  }
}

module.exports = MarkdownDocument;
