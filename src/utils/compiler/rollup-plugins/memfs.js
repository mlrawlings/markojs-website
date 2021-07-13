import fs from "memfs";
import path from "path";
import Module from "module";
import resolveFrom from "resolve-from";

export default (isBrowser) => {
  return {
    name: "memfs",
    resolveId(id, importer) {
      const wasBrowser = Module._resolveExportsOptions.browser;
      try {
        Module._resolveExportsOptions.browser = isBrowser;
        return path.resolve(resolveFrom(path.dirname(importer || "/"), id));
      } catch {
        this.error(
          `Unable to resolve "${id}"${importer ? ` from "${importer}"` : ""}.`
        );
      } finally {
        Module._resolveExportsOptions.browser = wasBrowser;
      }
    },
    load(id) {
      if (fs.existsSync(id)) {
        return fs.readFileSync(id, "utf-8");
      }

      return null;
    }
  };
};
