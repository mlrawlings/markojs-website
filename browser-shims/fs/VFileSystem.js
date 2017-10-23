var path = require("path");
var EventEmitter = require("events-light");

class FileEntry {
  constructor(path, type, text) {
    this.path = path;
    this.type = type;
    this.text = text;
    this.files = type === "dir" ? [] : undefined;
    this._sortedFiles = undefined;
  }

  isFile() {
    return this.type === "file";
  }

  isDirectory() {
    return this.type === "dir";
  }

  get name() {
    return path.basename(this.path);
  }

  get sortedFiles() {
    if (!this._sortedFiles) {
      this._sortedFiles = [].concat(this.files);
      this._sortedFiles.sort(function(a, b) {
        if (a.isDirectory() === b.isDirectory()) {
          return a < b ? -1 : a > b ? 1 : 0;
        } else {
          if (a.isDirectory()) {
            return -1;
          } else {
            return 1;
          }
        }
      });
    }

    return this._sortedFiles;
  }
}

class VFileSystem extends EventEmitter {
  constructor() {
    super();

    this._files = {};
    this._tree = undefined;
    this._dirs = undefined;
  }

  writeFileSync(filePath, text) {
    var file = this._files[filePath];
    if (file) {
      if (file.text === text) {
        return;
      }

      file.text = text;

      this.emit("file:modified", file);
    } else {
      file = this._files[filePath] = new FileEntry(filePath, "file", text);

      this._setTreeDirty();
      this.emit("file:created", file);
    }
  }

  _setTreeDirty() {
    this._tree = undefined;
    this._dirs = undefined;
  }

  readFileSync(filePath) {
    var file = this._files[filePath];
    return file ? file.text : undefined;
  }

  readdirSync(dirPath) {
    var dir = this.getFile(dirPath);
    if (!dir) {
      var error = new Error("ENOENT: no such file or directory: " + dirPath);
      error.code = "ENOENT";
      throw error;
    }

    var childNames = dir.files.map(child => {
      return child.name;
    });

    return childNames;
  }

  readTreeSync() {
    if (this._tree) {
      return this._tree;
    }

    var tree;
    var dirs = (this._dirs = {});
    var files = this._files;
    var filePaths = Object.keys(files);

    filePaths.sort();

    function mkdirp(dir) {
      if (dirs[dir]) {
        return;
      }

      var dirEntry = (dirs[dir] = new FileEntry(dir, "dir"));

      if (dir === "/") {
        tree = dirEntry;
      } else {
        var parentDir = path.dirname(dir);
        mkdirp(parentDir);
        dirs[parentDir].files.push(dirEntry);
      }
    }

    filePaths.forEach(filePath => {
      var fileEntry = files[filePath];
      var dir = path.dirname(fileEntry.path);
      mkdirp(dir);
      dirs[dir].files.push(fileEntry);
    });

    this._tree = tree;

    return this._tree;
  }

  getFile(filePath) {
    this.readTreeSync();
    return this._files[filePath] || this._dirs[filePath];
  }

  statSync(filePath) {
    var file = this.getFile(filePath);
    if (!file) {
      var error = new Error(
        "ENOENT: no such file or directory, stat " + JSON.stringify(filePath)
      );
      error.code = "ENOENT";
      throw error;
    }
    return file;
  }

  existsSync(filePath) {
    var file = this.getFile(filePath);
    return file != null;
  }
}

module.exports = VFileSystem;
