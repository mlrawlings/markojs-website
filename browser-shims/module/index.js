'use strict';

const path = require('path');
const fs = require('fs');
const extensions = require('../../util/file-extensions');

function isAbsolute(path) {
    return path.startsWith('/');
}

function nodeModulePaths(dir) {
    var paths = [];

    while(true) {
        paths.push(path.join(dir, 'node_modules'));
        var parentDir = path.dirname(dir);
        if (!parentDir || parentDir === dir) {
            break;
        }
        dir = parentDir;
    }

    return paths;
}

function readPackageSync(filePath) {
    var pkg;

    if (fs.existsSync(filePath)) {
        var json = fs.readFileSync(filePath);
        try {
            pkg = JSON.parse(json);
        } catch(e) {
            throw new Error('Unable to read package at path "' + filePath + '". Error: ' + e);
        }
    }

    return pkg;
}

function resolveMain(dir) {
    var packagePath = path.join(dir, 'package.json');
    var pkg = readPackageSync(packagePath);

    var main = pkg && pkg.main;

    if (main) {
        if (main.charAt(0) !== '.') {
            main = './' + main;
        }
    } else {
        main = './index';
    }

    var resolvedMain = resolveFrom(dir, main);
    if (!resolvedMain) {
        return undefined;
    }

    return resolvedMain;
}

function safeStatSync(filePath) {
    try {
        return fs.statSync(filePath);
    } catch(e) {
        return null;
    }
}

function tryExtensions(targetModule) {
    var originalExt = path.extname(targetModule);
    var hasExt = originalExt !== '';
    var stat = safeStatSync(targetModule);

    if (stat && !stat.isDirectory()) {
        return [targetModule, stat];
    }

    if (!hasExt) {
        // Short circuit for the most common case where it is a JS file
        var withJSExt = targetModule + '.js';
        stat = safeStatSync(withJSExt);
        if (stat) {
            return [withJSExt, stat];
        }
    }

    // Try with the extensions
    for (var i=0, len=extensions.length; i<len; i++) {
        var ext = extensions[i];
        if (ext !== originalExt) {
            var targetModuleWithExt = targetModule + ext;
            stat = safeStatSync(targetModuleWithExt);
            if (stat) {
                return [targetModuleWithExt, stat];
            }
        }
    }
}

function resolveFrom(fromDir, targetModule, searchPaths) {
    var resolved;
    var resolvedPath;
    var stat;

    if (isAbsolute(targetModule)) {
        resolved = tryExtensions(targetModule);
        if (!resolved) {
            return undefined;
        }

        resolvedPath = resolved[0];
        stat = resolved[1];
    } else if (targetModule.charAt(0) === '.') {
        // Don't go through the search paths for relative paths
        resolvedPath = path.join(fromDir, targetModule);
        resolved = tryExtensions(resolvedPath);

        if (!resolved) {
            stat = fs.statSync(resolvedPath);
            if (stat && stat.isDirectory()) {
                resolvedPath = resolvedPath;
            } else {
                return undefined;
            }
        }

        if (!stat) {
            resolvedPath = resolved[0];
            stat = resolved[1];
        }

    } else {
        var sepIndex = targetModule.indexOf('/');
        var packageName;
        var packageRelativePath;

        if (sepIndex !== -1 && targetModule.charAt(0) === '@') {
            sepIndex = targetModule.indexOf('/', sepIndex+1);
        }

        if (sepIndex === -1) {
            packageName = targetModule;
            packageRelativePath = null;
        } else {

            packageName = targetModule.substring(0, sepIndex);
            packageRelativePath = targetModule.substring(sepIndex + 1);
        }

        for (var i=0, len=searchPaths.length; i<len; i++) {
            var searchPath = searchPaths[i];

            var packagePath = path.join(searchPath, packageName);

            stat = fs.statSync(packagePath);

            if (stat.isDirectory()) {
                // The installed module has been found, but now need to find the module
                // within the package
                if (packageRelativePath) {
                    return resolveFrom(packagePath, './' + packageRelativePath);
                } else {
                    resolvedPath = packagePath;
                }
                break;
            }
        }

        if (!resolvedPath) {
            return undefined;
        }
    }

    if (stat.isDirectory()) {
        resolvedPath = resolveMain(resolvedPath);
        if (!resolvedPath) {
            return undefined;
        }
    }

    return resolvedPath;
}

var Module = {
    _nodeModulePaths: nodeModulePaths,

    _resolveFilename: function(target, fromModule) {
        var resolved;

        var fromFile = fromModule.filename;
        var paths = fromModule.paths;
        var fromDir = path.dirname(fromFile);

        resolved = resolveFrom(fromDir, target, paths);
        if (!resolved) {
            throw new Error('Module not found: ' + target + ' (from: ' + fromFile + ')');
        }

        return resolved;
    }
};

module.exports = Module;

Module.Module = Module;
