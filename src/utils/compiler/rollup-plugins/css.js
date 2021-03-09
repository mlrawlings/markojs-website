import path from "path";
import MagicString, { Bundle } from "magic-string";

export default () => {
  let cssContent;
  return {
    name: "css",
    buildStart(config) {
      config.cssContent = cssContent = new Set();
    },
    transform(source, id) {
      const ext = path.extname(id);

      if (ext !== ".css") {
        return null;
      }

      cssContent.add(new MagicString(source, { filename: id }));
      return "";
    },
    generateBundle(options) {
      if (!cssContent.size) {
        return;
      }

      const bundle = new Bundle();

      for (const content of cssContent) {
        bundle.addSource(content);
      }

      // Strips out css @imports (since they need to be before everything else to load)
      // We replace the existing import with whitespace to preserve source map positions.
      let imports = "";
      let bundleString = bundle.toString().replace(/@import[^;]+(?:;|$)/g, m => {
        imports += `${m}\n`;
        return m.replace(/\S/g, " ");
      });

      bundleString = `${imports}${bundleString}`;

      this.emitFile({
        type: "asset",
        fileName: path.basename(options.file, path.extname(options.file)) + ".css",
        source: `${bundleString}\n/*# sourceMappingURL=${bundle
          .generateMap()
          .toUrl()}*/`
      });
    }
  };
};
