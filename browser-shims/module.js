const fs = require("memfs");
const path = require("path");

const EXTENSIONS = [".js", ".marko", ".json", ".css", ".less"];
module.exports = {
  _nodeModulePaths: nodeModulePaths,
  _resolveFilename: function(target, fromModule) {
    const fromFile = fromModule.filename;
    const resolved = resolveFrom(
      path.dirname(fromFile),
      target,
      fromModule.paths
    );

    if (!resolved) {
      throw new Error(
        "Module not found: " + target + " (from: " + fromFile + ")"
      );
    }

    return resolved;
  }
};

function nodeModulePaths(dir) {
  const paths = [];

  while (true) {
    const parentDir = path.dirname(dir);
    paths.push(path.join(dir, "node_modules"));

    if (!parentDir || parentDir === dir) {
      break;
    }

    dir = parentDir;
  }

  return paths;
}

function resolveFrom(fromDir, targetModule, searchPaths) {
  let resolved;
  let resolvedPath;
  let stat;

  if (path.isAbsolute(targetModule)) {
    resolved = tryExtensions(targetModule);

    if (!resolved) {
      return undefined;
    }

    [resolvedPath, stat] = resolved;
  } else if (targetModule.charAt(0) === ".") {
    resolvedPath = path.join(fromDir, targetModule);
    stat = safeStatSync(resolvedPath);

    if (!stat) {
      resolved = tryExtensions(resolvedPath);

      if (resolved) {
        [resolvedPath, stat] = resolved;
      } else {
        return undefined;
      }
    }
  } else {
    let sepIndex = targetModule.indexOf(path.sep);
    let packageName;
    let packageRelativePath;

    if (sepIndex !== -1 && targetModule.charAt(0) === "@") {
      sepIndex = targetModule.indexOf(path.sep, sepIndex + 1);
    }

    if (sepIndex === -1) {
      packageName = targetModule;
      packageRelativePath = null;
    } else {
      packageName = targetModule.slice(0, sepIndex);
      packageRelativePath = targetModule.slice(sepIndex + 1);
    }

    for (let i = 0, len = searchPaths.length; i < len; i++) {
      const searchPath = searchPaths[i];
      const packagePath = path.join(searchPath, packageName);

      stat = safeStatSync(packagePath);

      if (stat && stat.isDirectory()) {
        // The installed module has been found, but now need to find the module
        // within the package
        if (packageRelativePath) {
          return resolveFrom(packagePath, toRelative(packageRelativePath));
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


function resolveMain(dir) {
  const packagePath = path.join(dir, "package.json");
  const pkg = readPackageSync(packagePath);

  let main = pkg && pkg.main;

  if (main) {
    main = toRelative(main);
  } else {
    main = "./index";
  }

  return resolveFrom(dir, main);
}

function readPackageSync(filePath) {
  let pkg;

  if (fs.existsSync(filePath)) {
    const json = fs.readFileSync(filePath);
    try {
      pkg = JSON.parse(json);
    } catch (e) {
      throw new Error(
        'Unable to read package at path "' + filePath + '". Error: ' + e
      );
    }
  }

  return pkg;
}

function tryExtensions(targetModule) {
  const originalExt = path.extname(targetModule);
  let stat = safeStatSync(targetModule);

  if (stat && !stat.isDirectory()) {
    return [targetModule, stat];
  }

  // Try with the extensions
  for (let i = 0, len = EXTENSIONS.length; i < len; i++) {
    const ext = EXTENSIONS[i];

    if (ext !== originalExt) {
      const targetModuleWithExt = targetModule + ext;
      stat = safeStatSync(targetModuleWithExt);
      if (stat) {
        return [targetModuleWithExt, stat];
      }
    }
  }
}

function toRelative(filePath) {
  const char = filePath.charAt(0);
  return char === "." || char === "/" ? filePath : `.${path.sep + filePath}`;
}

function safeStatSync(filePath) {
  try {
    return fs.statSync(filePath);
  } catch (e) {
    return null;
  }
}

