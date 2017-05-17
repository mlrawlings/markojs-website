const path = require('path');
const virtualProjects = require('../virtual-projects.json');
const readVirtualFiles = require('../routes/try-online/app/readVirtualFiles');
const vfs = require('../browser-shims/fs');

// Only these files should be registered in our virtual project. External
// projects may contain additional files (such as dotfiles) that we do not
// wish to register in our project
const fileExtensions = require('../util/file-extensions');
const ignoreDirs = ['node_modules'];

const virtualProjectHandlers = {
    module(virtualProject) {
        const module = virtualProject.module;
        const rootDir = path.resolve(__dirname, `../node_modules/${module}`);
        readVirtualFiles(vfs, {
            rootDir,
            fileExtensions,
            ignoreDirs
        });
    }
};

exports.register = () => {
    virtualProjects.forEach((virtualProject) => {
        const type = virtualProject.type;
        const handler = virtualProjectHandlers[type];

        if (handler) {
            handler(virtualProject);
        } else {
            throw new Error(`Unknown type "${type}" in virtual project.`);
        }
    });
    return Promise.resolve();
};
