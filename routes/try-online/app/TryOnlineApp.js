'use strict';

const vfs = require('~/browser-shims/fs');
const vmodules = require('./vmodules');
const readVirtualFiles = require('./readVirtualFiles');
const path = require('path');
const EventEmitter = require('events-light');
const fileExtensions = require('~/util/file-extensions');

require('events');

const projectNameRegExp = /[/]([a-zA-Z0-9_-]+)([/]|$)/;

function getFirstFile(dir) {
    var allFiles = [];

    function handleDir(dir) {
        dir.files.forEach((child) => {
            if (child.isDirectory())  {
                handleDir(child);
            } else  {
                allFiles.push(child);
            }
        });
    }

    handleDir(dir);

    allFiles.sort(function(a, b) {
        a = a.path;
        b = b.path;
        return a < b ? -1 : (a > b ? 1 : 0);
    });
    return allFiles[0];
}

class TryOnlineApp extends EventEmitter {
    constructor() {
        super();
        if (typeof readVirtualFiles === 'function') {
            readVirtualFiles(vfs);
        }

        let rootDir = vfs.readTreeSync();

        this.state = {
            rootDir: rootDir,
            activeProject: undefined,
            focusedFile: undefined,
            openFiles: [],
            previewFile: undefined,
            demoPreviewFile: undefined,
            projectPreviewFile: undefined,
            componentPreviewFile: undefined,
            projectLookup: []
        };

        this.assignOpenFilesToPanes();

        vfs.on('file:modified', (file) => {
            vmodules.clearFileCache(file.path);

            if (file.name === 'marko-tag.json' ||
                file.name === 'marko-taglib.json') {

                vmodules.clearCache((filePath) => {
                    if (filePath.endsWith('.marko')) {
                        return true;
                    }
                });
            } else {
                vmodules.clearCache();
            }

            this.emit('file:modified', file);
        });
    }

    loadProjects() {
        let projectLookup = {};
        let projects = [];

        let rootDir = vfs.readTreeSync();

        rootDir.files.forEach((file) => {
            let packageJsonPath = path.join(file.path, 'package.json');

            var project = {
                name: file.name,
                description: file.name,
                defaultOutputMode: 'preview'
            };

            if (vfs.existsSync(packageJsonPath)) {
                let pkg = vmodules.require(packageJsonPath);
                Object.assign(project, pkg, pkg.tryOnline);
            }

            let previewFile;

            let projectPreviewFilePath = file.path + '/index.marko';
            if (vfs.existsSync(projectPreviewFilePath)) {
                previewFile = vfs.getFile(projectPreviewFilePath);
            }

            Object.assign(project, {
                rootDir: file,
                previewFile: previewFile
            });

            projectLookup[project.name] = project;
            projects.push(project);
        });

        this.state.projectLookup = projectLookup;
        this.state.projects = projects;
    }

    initialize(state) {
        function addFiles(dir) {
            dir.files.forEach((file) => {
                if (file.type === 'dir') {
                    addFiles(file);
                } else {
                    vfs.writeFileSync(file.path, file.text);
                }
            });
        }

        addFiles(state.rootDir);

        this.loadProjects();

        this.state.activeProject = this.state.projects[0];
        this.state.focusedDirectory = state.focusedDirectory;
        this.state.focusedFile = state.focusedFile;
        this.state.openFiles = state.openFiles;
    }

    getProjectForPath(filePath) {
        let projectNameMatches = projectNameRegExp.exec(filePath);
        let projectName = projectNameMatches[1];
        return this.state.projectLookup[projectName];
    }

    saveFile(filePath, text) {
        vfs.writeFileSync(filePath, text);
    }

    assignOpenFilesToPanes() {
        let state = this.state;
        let openFiles = state.openFiles;

        let panes = {
            inputTop: [],
            inputBottom: [],
            outputTop: [],
            outputBottom: [],
        };

        if (state.previewFile) {
            let project = this.getProjectForPath(state.previewFile.path);
            let previewFile = Object.create(state.previewFile);
            previewFile.output = true;
            previewFile.outputMode = project.defaultOutputMode || 'preview';
            panes.outputTop.push(previewFile);
        }

        if (state.demoPreviewFile) {
            let previewFile = Object.create(state.demoPreviewFile);
            previewFile.output = true;
            previewFile.outputMode = 'preview';
            panes.outputTop.push(previewFile);
        }

        if (state.componentPreviewFile) {
            let previewFile = Object.create(state.componentPreviewFile);
            previewFile.output = true;
            previewFile.outputMode = 'compiled';
            panes.outputBottom.push(previewFile);
        }

        if (state.projectPreviewFile) {
            let project = this.getProjectForPath(state.projectPreviewFile.path);
            let projectPreviewFile = Object.create(state.projectPreviewFile);
            projectPreviewFile.output = true;
            projectPreviewFile.outputMode = project.defaultOutputMode || 'preview';
            panes.outputTop.push(projectPreviewFile);
        }

        openFiles.forEach((openFile) => {
            let targetPane;

            if (openFile.name === 'demo.marko') {
                targetPane = 'inputTop';
            } else if (openFile.name === 'index.marko') {
                targetPane = 'inputBottom';
            } else if (openFile.name.endsWith('.marko.js')) {
                targetPane = 'outputTop';
            }

            if (!targetPane) {
                targetPane = 'inputBottom';
            }
            panes[targetPane].push(openFile);
        });

        this.state.panes = panes;
    }

    fileExists(filePath) {
        return vfs.getFile(filePath) !== undefined;
    }

    focusProject(projectName) {
        let project = this.state.projectLookup[projectName];
        this.focusFile(project.rootDir.path);
    }

    focusFile(filePath) {
        let file = vfs.getFile(filePath);
        if (!file) {
            return;
        }

        if (this.state.focusedFile === filePath) {
            return;
        }

        var project = this.state.activeProject = this.getProjectForPath(filePath);

        if (filePath === project.rootDir.path) {
            filePath += '/index.marko';
            file = vfs.getFile(filePath);

            if (!file) {
                file = getFirstFile(project.rootDir);
                if (!file) {
                    return;
                }

                filePath = file.path;
            }
        }

        this.state.focusedFile = filePath;

        let isDirectory = file.isDirectory();
        let dirPath;

        let previouslyFocusedDirectory = this.state.focusedDirectory;

        if (isDirectory) {
            dirPath = filePath;


        } else {
            dirPath = path.dirname(filePath);
        }

        this.state.focusedDirectory = dirPath;

        let dir = vfs.getFile(dirPath);

        let index = {};

        dir.files.forEach((childFile) => {
            index[childFile.name] = childFile;
        });

        let isComponent = 'demo.marko' in index;

        let addOpenFile = (file) => {
            if (this.isHiddenFile(file)) {
                return;
            }
            this.state.openFiles.push(file);
        };

        this.state.openFiles = [];
        this.state.projectPreviewFile = undefined;
        this.state.demoPreviewFile = undefined;
        this.state.previewFile = undefined;
        this.state.componentPreviewFile = undefined;

        if (isComponent) {
            if (isDirectory && previouslyFocusedDirectory === dirPath) {
                // We have already opened all of the required files in the
                // directory. Nothing else to do except adjust the focus
                this._emitStateChange();
                return;
            }

            for (let i=0; i<dir.files.length; i++) {
                let curFile = dir.files[i];
                if (curFile.isFile()) {
                    addOpenFile(curFile);

                    if (curFile.name === 'demo.marko') {
                        this.state.demoPreviewFile = index['demo.marko'];
                    } else if (curFile.name === 'index.marko') {
                        this.state.componentPreviewFile = index['index.marko'];
                    }
                }
            }

            this.state.projectPreviewFile = this.state.activeProject.previewFile;
        } else {
            dir.files.forEach((curFile) => {
                if (!curFile.isDirectory() && curFile.name !== 'package.json') {
                    addOpenFile(curFile);
                }

                if (!this.state.projectPreviewFile && path.extname(curFile.path) === '.marko') {
                    this.state.projectPreviewFile = curFile;
                }
            });

            if (!isDirectory) {
                if (path.extname(file.path) === '.marko') {
                    this.state.projectPreviewFile = file;
                }
            }
        }

        this.assignOpenFilesToPanes();

        this._emitStateChange();

        this.emit('focus:change', this.state.focusedFile);
    }

    _emitStateChange() {
        this.emit('state:change', Object.assign({}, this.state));
    }

    onStateChange(callback) {
        this.on('state:change', callback);
    }

    get focusedFile() {
        return this.state.focusedFile;
    }

    get focusedDirectory() {
        return this.state.focusedDirectory;
    }

    isHiddenFile(file) {
        if (file.isDirectory()) {
            return false;
        }

        if (file.name === 'package.json') {
            return true;
        }

        if (file.name.endsWith('.marko.js')) {
            return true;
        }

        if (file.name.charAt(0) === '.') {
            return true;
        }

        var ext = path.extname(file.name);

        return !(fileExtensions.includes(ext));
    }
}


module.exports = TryOnlineApp;
