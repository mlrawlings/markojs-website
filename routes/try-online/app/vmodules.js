'use strict';

const fs = require('~/browser-shims/fs');
const path = require('path');
const resolveFrom = require('resolve-from');
const nativeRequire = require;
const markoCompiler = require('marko/compiler');
const stripJsonComments = require('strip-json-comments');

function virtualRequire(target) {
    // First see if it is a native module
    let resolved;

    try {
        resolved = nativeRequire.resolve(target);
    } catch(e) {}

    if (resolved) {
        return nativeRequire(resolved);
    }

    let module = loadFile(target);
    return module.exports;
}

function virtualResolveFrom(from, target) {
    if (target.startsWith('.') || target.startsWith('/')) {
        return path.resolve(from, target);
    } else {
        return target;
    }

}

if (typeof window !== 'undefined') {
    let markoModules = markoCompiler.modules;

    markoModules.require = virtualRequire;

    markoModules.resolveFrom = virtualResolveFrom;

    markoModules.resolve = function(absolutePath) {
        // First try a native resolve
        let resolved;

        try {
            resolved = nativeRequire.resolve(absolutePath);
        } catch(e) {}

        if (resolved) {
            return resolved;
        }

        // Then try our virtual resolve...
        return resolveFrom(path.dirname(absolutePath), absolutePath);
    };

    markoModules.deresolve = function(targetFilename, from) {
        const ext = path.extname(targetFilename);
        if (ext === '.js') {
            targetFilename = targetFilename.slice(0, 0 - ext.length);
        }
        return targetFilename;
    };
}


let READ_OPTIONS = { encoding: 'utf8' };

let extensions = {
    '.marko': function(src, filePath) {
        let outputFile = filePath + '.js';

        let compiled;

        try {
            compiled = markoCompiler.compileForBrowser(
                src,
                filePath,
                {
                    meta: true
                });
        } catch(err) {
            if (err.errors) {
                err.templateFile = filePath;
                err.templateErrors = err.errors;
            }
            return {
                error: err,
                exports: {}
            };
        }

        let compiledSrc = compiled.code;

        let templateModule = loadSource(compiledSrc, outputFile);
        templateModule.exports.path = filePath;
        return templateModule;
    },
    '.js': function(src, filePath) {
        return loadSource(src, filePath);
    },
    '.json': function(src, filePath) {

        let parsed;

        try {
            parsed = JSON.parse(stripJsonComments(src));
        } catch(err) {
            err.friendlyMessage = err.toString();
            return {
                error: err
            };
        }

        return {
            exports: parsed
        };
    },
    '.css': function(src, filePath) {
        return {
            exports: {}
        };
    },
    '.less': function(src, filePath) {
        return {
            exports: {}
        };
    }
};

let cache = {};

function loadFile(filePath) {
    let cached = cache[filePath];
    if (cached) {
        if (cached.error) {
            throw cached.error;
        }
        return cached;
    }

    let src = fs.readFileSync(filePath, READ_OPTIONS);
    let ext = path.extname(filePath);
    let compiler = extensions[ext];

    let loadedModule;


    try {
        loadedModule = compiler(src, filePath);
    } catch(error) {
        let finalError = error;
        if (!finalError.friendlyLabel) {
            finalError = Object.create(finalError);
            finalError.friendlyLabel = `Unable to load "${filePath}"`;
        }
        loadedModule = {
            error: finalError
        };
    }

    loadedModule.id = filePath;

    cache[filePath] = loadedModule;

    if (loadedModule.error) {
        setTimeout(() => {
            if (cache[filePath] === loadedModule) {
                delete cache[filePath];
            }
        }, 10);
        throw loadedModule.error;
    }

    return loadedModule;
}

function loadSource(src, filePath) {
    let dir = path.dirname(filePath);
    let wrappedSource = '(function(require, exports, module, __filename, __dirname) { ' + src + ' })';
    let factoryFunc;

    let exports = {};
    let loadedModule = {
        require: function(target) {
            let loaded;

            try {
                loaded = require(target);
            } catch(e) {}

            let resolved = resolveFrom(dir, target);
            if (resolved) {
                let importedModule;

                try {
                    importedModule = loadFile(resolved);
                } catch(error) {
                    let finalError = error;
                    if (!finalError.friendlyLabel) {
                        finalError = Object.create(error);
                        finalError.friendlyLabel = `Unable to import "${target}" from "${filePath}"`;
                    }
                    throw finalError;
                }

                return importedModule.exports;
            } else {
                try {
                    return nativeRequire(target);
                } catch(error) {
                    let finalError = error;
                    if (!finalError.friendlyLabel) {
                        finalError = Object.create(error);
                        finalError.friendlyLabel = `Unable to import "${target}" from "${filePath}"`;
                    }
                    throw finalError;
                }
            }
        },
        exports: exports,
        id: filePath
    };

    try {
        factoryFunc = eval(wrappedSource);
    } catch(error) {
        let finalError = error;
        if (!finalError.friendlyLabel) {
            finalError = Object.create(error);
            finalError.friendlyLabel =  `Unable to load "${filePath}": ${error.toString()}`;
        }
        throw finalError;
    }

    if (!loadedModule.error) {
        try {
            factoryFunc(loadedModule.require, exports, loadedModule, filePath, dir);
        } catch(error) {
            let finalError = error;
            if (!finalError.friendlyLabel) {
                finalError = Object.create(error);
                finalError.friendlyLabel =  `Unable to load "${filePath}"`;
            }
            throw finalError;
        }
    }

    loadedModule.source = src;
    return loadedModule;
}

function clearCache(filter) {
    Object.keys(cache).forEach((cacheKey) => {
        let module = cache[cacheKey];
        if (!filter || filter(module.id)) {
            delete cache[cacheKey];
        }
    });
}

function clearFileCache(filePath) {
    delete cache[filePath];
}

exports.loadFile = loadFile;
exports.cache = cache;
exports.clearCache = clearCache;
exports.clearFileCache = clearFileCache;
exports.require = virtualRequire;
exports.resolveFrom = virtualResolveFrom;
