const fs = require('fs');
const path = require('path');
const marko = require('marko');
const marked = require('marked');
const TOC = require('./toc');

// Used for matching against sections of the markdown that should be replaced
// by a Marko component:
//
// <!-- <my-component name="John"/>() -->
// <img src="./some-img.png"/>
// <!-- </> -->
let componentCommentRegex = /<!-- ([\s\S]*?)\(\) -->[\s\S]*?<\/> -->/g;

exports.toTemplate = function renderMarkdown(markdownDocument) {
    let {
        markdown,
        documentName,
        filePath
    } = markdownDocument;

    markdown = markdown
        .replace(/\&/g, '&amp;')
        .replace(/\$/g, '&#36;')
        .replace(/https?:\/\/markojs\.com\//g, '/')
        .replace(/\.\/([\w\d-\/]+)\.md/g, (match) => {
            // Markdown documents from external sources do not have a file path
            if (filePath) {
                const linkpath = path.resolve(path.dirname(filePath), match);
                const linkmatch = /(\/docs\/.*)\.md/.exec(linkpath);
                return linkmatch && (linkmatch[1]+'/') || match;
            }
            return match;
        })
        .replace(componentCommentRegex, (match) => {
            // Find the Marko tag execution instances
            // e.g. <!-- <my-component name="Austin"/>() -->
            let component  = componentCommentRegex.exec(match);
            componentCommentRegex.lastIndex = 0;
            return component[1];
        });

    var markedRenderer = new marked.Renderer();
    var toc = TOC.create();
    var anchorCache = {};
    var title;

    markedRenderer.table = function(header, body) {
        var output = '<table class="markdown-table">';
        if (header) {
            output += '<thead>' + header + '</thead>';
        }

        if (body) {
            output += '<tbody>' + body + '</tbody>';
        }
        output += '</table>';
        return output;
    };

    markedRenderer.heading = function(text, level) {
        var anchorName = getAnchorName(text, anchorCache);
        var linkText = text.replace(/\([^\)]+\)/g, '()').replace(/\<\/?code\>/g, '').replace(/&amp;lt;/g, '&lt;');

        title = title || linkText;

        toc.addHeading(linkText, anchorName, level);

        return `<h${level} id="${anchorName}">` +
            `<a name="${anchorName}" class="anchor" href="#${anchorName}">` +
                `<span class="header-link"></span>` +
            `</a>` + text +
        `</h${level}>`;
    };

    markedRenderer.code = function(code, lang, escaped) {
        var lines = '';
        var index = lang && lang.indexOf('{');

        if (index && index !== -1) {
            lines = lang.slice(index+1, -1);
            lang = lang.slice(0, index);
        }

        return `<code-block lang="${lang}" lines="${lines}">${code}</code-block>`;
    };

    var html = '-----\n' + marked(markdown, {
        renderer: markedRenderer
    }) + '\n-----\n';

    // The path inside the markojs-website base directory
    // e.g. ~/markojs-website/webpack.md
    const templateVirtualPath = path.join(process.cwd(), documentName);

    try {
        var template = marko.load(templateVirtualPath, html, { writeToDisk:false })
    } catch(e) {
        console.log(html);
        throw e;
    }

    template.toc = toc.toHTML();
    template.title = title;

    return template;
};

function getAnchorName(title, anchorCache) {
    var anchorName = title.replace(/[ \-]+/g, '-').replace(/[^A-Z0-9\-]+/gi, '').toLowerCase();
    var repeat = anchorCache[anchorName] != null ? ++anchorCache[anchorName] : (anchorCache[anchorName] = 0);
    if(repeat) {
        anchorName += '_' + repeat;
    }
    return anchorName;
}
