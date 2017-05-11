const externalMarkdown = require('../../services/external-markdown');

module.exports = {
    name: 'register-external-markdown',
    start() {
        return externalMarkdown.register();
    }
};
