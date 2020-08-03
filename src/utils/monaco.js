require("monaco-editor/esm/vs/editor/browser/controller/coreCommands");
require("monaco-editor/esm/vs/editor/contrib/bracketMatching/bracketMatching");
require("monaco-editor/esm/vs/editor/contrib/caretOperations/caretOperations");
require("monaco-editor/esm/vs/editor/contrib/clipboard/clipboard");
require("monaco-editor/esm/vs/editor/contrib/comment/comment");
require("monaco-editor/esm/vs/editor/contrib/contextmenu/contextmenu");
require("monaco-editor/esm/vs/editor/contrib/cursorUndo/cursorUndo");
require("monaco-editor/esm/vs/editor/contrib/find/findController");
require("monaco-editor/esm/vs/editor/contrib/folding/folding");
require("monaco-editor/esm/vs/editor/contrib/inPlaceReplace/inPlaceReplace");
require("monaco-editor/esm/vs/editor/contrib/links/links");
require("monaco-editor/esm/vs/editor/contrib/multicursor/multicursor");
require("monaco-editor/esm/vs/editor/contrib/smartSelect/smartSelect");
require("monaco-editor/esm/vs/editor/contrib/wordHighlighter/wordHighlighter");
require("monaco-editor/esm/vs/editor/contrib/wordOperations/wordOperations");
require("monaco-editor/esm/vs/editor/contrib/hover/hover");

const { languages, editor } = require("monaco-editor/esm/vs/editor/editor.api");
const EditorWorker = require("monaco-editor/esm/vs/editor/editor.worker");
const { load, getColorMap, getTokenizer, tmTheme, syntaxes } = require("./language-registry");
const langToScope = require("./lang-to-scope");
let loaded = false;

exports.setModelMarkers = editor.setModelMarkers;

exports.createEditor = el => {
  if (!loaded) {
    throw new Error("You must call load() before using the editor.");
  }

  return editor.create(el, {
    autoIndent: "full",
    renderControlCharacters: true,
    renderIndentGuides: true,
    matchBrackets: true,
    minimap: {
      enabled: false
    }
  });
}

exports.createModel = (value, lang) => {
  return editor.createModel(value, langToScope(lang));
}

exports.load = async () => {
  global.MonacoEnvironment = {
    async getWorker() {
      return new EditorWorker();
    }
  };

  // Register all languages first, in order to be able to get it's encoded ID later.
  for (const syntax of syntaxes) {
    languages.register({
      id: syntax.grammar.scopeName,
      extensions: syntax.grammar.fileTypes && syntax.grammar.fileTypes.map(type => `.${type}`)
    });
  }

  await load({
    getEncodedLanguageId: languages.getEncodedLanguageId
  });

  const themeName = tmTheme.name.replace(/[^a-z0-9\-]+/gi, "-");
  const themeColorMap = [null, ...getColorMap().slice(1)]; // Monaco doesn't like the colorMap starting with undefined.

  editor.defineTheme(themeName, {
    rules: [],
    base: "vs-dark",
    inherit: false,
    encodedTokensColors: themeColorMap,
    colors: {
      "editor.foreground": themeColorMap[1] /* Default foreground color */,
      "editor.background": themeColorMap[2] /* Default background color */
    }
  });

  editor.setTheme(themeName);

  for (const syntax of syntaxes) {
    const { scopeName } = syntax.grammar;
    languages.setLanguageConfiguration(scopeName, syntax.editorConfig);
    languages.setTokensProvider(scopeName, getTokenizer(scopeName));
  }

  loaded = true;
}
