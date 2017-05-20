var fs = require('fs');
var path = require('path');

function isValidExtension(filePath, fileExtensions) {
    const file = path.parse(filePath).base;

    if (file.endsWith('.marko.js')) {
        return false;
    }

    for (let i = 0; i < fileExtensions.length; i++) {
        if (file.endsWith(fileExtensions[i])) {
            return true;
        }
    }
    return false;
}

function readVirtualFiles(vfs, options) {
    let {
        rootDir,
        // File extensions that we should read
        fileExtensions,
        // Directories that should be ignored
        ignoreDirs
    } = options || {};

    rootDir = rootDir || path.join(__dirname, '../virtual-projects');

    function addDir(dir) {
        var files = fs.readdirSync(dir);
        files.forEach((file) => {
            file = path.join(dir, file);
            var stat = fs.statSync(file);
            if (stat.isDirectory()) {
                const basePath = path.parse(file).base;

                if (ignoreDirs) {
                    if (ignoreDirs.includes(basePath)) {
                        return;
                    }
                }

                // Ignore all dot directories.
                if (basePath.startsWith('.')) {
                    return;
                }

                addDir(file);
            } else {
                if (fileExtensions && !isValidExtension(file, fileExtensions)) {
                    return;
                }

                var relativeFile = file.substring(rootDir.length);

                // If this is an external virtual project, use the base path
                // of the project in the relative file path
                if (options) {
                    const baseProj = path.parse(rootDir).base;
                    relativeFile = `/${baseProj}${relativeFile}`;
                }

                relativeFile = relativeFile.replace(/[\\]/g, '/');
                var text = fs.readFileSync(file, { encoding: 'utf8' });
                vfs.writeFileSync(relativeFile, text);
            }
        });
    }

    if (!fs.existsSync(rootDir)) {
        console.error(`Root dir: "${rootDir}" does not exist.`);
        return;
    }

    addDir(rootDir);
}

module.exports = readVirtualFiles;
