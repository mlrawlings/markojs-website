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

      this.emitFile({
        type: "asset",
        fileName: path.basename(options.file, path.extname(options.file)) + ".css",
        source: `${bundle.toString()}\n/*# sourceMappingURL=${bundle
          .generateMap()
          .toUrl()}*/`
      });
    }
  };
};
