function Node(text, anchorName, level) {
  this.text = text;
  this.anchorName = anchorName;
  this.level = level;
  this.childNodes = [];
}

Node.prototype.toHTML = function(ignoreSelf) {
  var out = "";

  if (!ignoreSelf && this.text && this.anchorName) {
    out += '<a href="#' + this.anchorName + '">' + this.text + "</a>";
  }

  if (this.childNodes.length) {
    out += '<ul class="toc toc-level' + this.level + '">';
    this.childNodes.forEach(function(childNode) {
      out += "<li>" + childNode.toHTML() + "</li>";
    });
    out += "</ul>";
  }

  return out;
};

exports.create = function() {
  var root = new Node(null, null, 0);
  var currentParent = root;

  return {
    addHeading: function(text, anchorName, level) {
      var curParentLevel = currentParent.level;

      var newNode = new Node(text, anchorName, level);
      var emptyNode;
      var i;

      if (level > curParentLevel + 1) {
        if (currentParent.childNodes.length) {
          currentParent =
            currentParent.childNodes[currentParent.childNodes.length - 1];
        } else {
          emptyNode = new Node(null, null, currentParent.level + 1);
          emptyNode.parent = currentParent;
          currentParent.childNodes.push(emptyNode);
          currentParent = emptyNode;
        }

        while (currentParent.level !== level - 1) {
          emptyNode = new Node(null, null, currentParent.level + 1);
          emptyNode.parent = currentParent;
          currentParent.childNodes.push(emptyNode);
          currentParent = emptyNode;
        }
      } else if (level < currentParent.level + 1) {
        while (currentParent.level !== level - 1) {
          currentParent = currentParent.parent;
        }
      }

      currentParent.childNodes.push(newNode);
      newNode.parent = currentParent;
    },
    toHTML: function() {
      var target = root;

      if (root.childNodes.length === 1) {
        target = root.childNodes[0];
      }

      return target.toHTML(true);
    }
  };
};
