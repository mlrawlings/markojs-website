var marked = require('marked');
var Highlights = require('highlights');

var highlighter = new Highlights();

highlighter.requireGrammarsSync({
    modulePath: require.resolve('language-css/package.json')
});

highlighter.requireGrammarsSync({
    modulePath: require.resolve('language-javascript/package.json')
});

highlighter.requireGrammarsSync({
    modulePath: require.resolve('language-html/package.json')
});

highlighter.requireGrammarsSync({
    modulePath: require.resolve('language-marko/package.json')
});

highlighter.requireGrammarsSync({
    modulePath: require.resolve('react/package.json')
});

highlighter.requireGrammarsSync({
    modulePath: require.resolve('language-shellscript/package.json')
});

function renderMarkdown(markdown) {
    var markedRenderer = new marked.Renderer();

    markedRenderer.code = function(code, lang, escaped) {
        var scopeName;

        if (lang === 'js' || lang === 'javascript' || lang === 'json') {
            scopeName = 'source.js';
        } else if (lang === 'css') {
            scopeName = 'source.css';
        } else if (lang === 'html') {
            scopeName = 'text.html.basic';
        } else if (lang === 'xml' || lang === 'marko') {
            scopeName = 'text.marko';
        } else if (lang === 'jsx') {
            scopeName = 'source.js.jsx';
        } else if (lang === 'bash') {
            scopeName = 'source.shell';
        }

        return highlighter.highlightSync({
            fileContents: code,
            scopeName: scopeName
        });
    };

    return marked(markdown, {
        renderer: markedRenderer
    });
}


function removeIndentation(str) {
    var indentMatches = /\s*\n(\s+)/.exec(str);
    if (indentMatches) {
        var indent = indentMatches[1];
        str = str.replace(new RegExp('^' + indent, 'mg'), '');
    }
    return str;
}
function generateCode(el, codegen) {
    codegen.context.addDependency(require.resolve('~/global-style/syntax.css'));

    var bodyText = removeIndentation(el.bodyText);
    var builder = codegen.builder;
    var html = renderMarkdown(bodyText);
    return builder.html(builder.literal(html));
}

module.exports = generateCode;
