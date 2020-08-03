exports.grammar = require("./tmLanguage.json");
exports.grammarConfig = {
  embeddedLanguages: ["source.css", "source.js"]
}
exports.editorConfig = {
  wordPattern: new RegExp(
    "(-?\\d*\\.\\d\\w*)|([^`~!@$^&*()=+[{\\]}\\\\|;:'\",.<>\\/\\s]+)"
  ),
  indentationRules: {
    increaseIndentPattern: new RegExp(
      "<(?!\\?|(?:area|base|br|col|frame|hr|html|img|input|link|meta)\\b|[^>]*\\/>)([-_\\.A-Za-z0-9]+)(?=\\s|>)\\b[^>]*>(?!.*<\\/\\1>)|<!--(?!.*-->)|\\{[^}\"']*$"
    ),
    decreaseIndentPattern: new RegExp(
      "^\\s*(<\\/(?!html)[-_\\.A-Za-z0-9]+\\b[^>]*>|-->|\\})"
    )
  },
  comments: {
    blockComment: ["<!--", "-->"]
  },
  brackets: [
    ["<!--", "-->"],
    ["<", ">"],
    ["{", "}"],
    ["[", "]"],
    ["(", ")"],
    ["|", "|"]
  ],
  autoClosingPairs: [
    { open: "<", close: ">" },
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: "|", close: "|" },
    { open: '"', close: '"', notIn: ["string", "comment"] },
    { open: "'", close: "'", notIn: ["string"] },
    { open: "`", close: "`", notIn: ["string", "comment"] },
    { open: "<!--", close: "--", notIn: ["string"] }
  ],
  surroundingPairs: [
    { open: "'", close: "'" },
    { open: '"', close: '"' },
    { open: "`", close: "`" },
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: "|", close: "|" },
    { open: "<", close: ">" }
  ],
  folding: {
    markers: {
      start: new RegExp("^\\s*<!--\\s*#region\\b.*-->"),
      end: new RegExp("^\\s*<!--\\s*#endregion\\b.*-->")
    }
  }
};
