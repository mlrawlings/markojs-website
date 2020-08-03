import fs from "memfs";
import path from "path";
import resolveFrom from "resolve-from";

export default () => {
  return {
    name: "memfs",
    resolveId(id, importer) {
      try {
        return path.resolve(resolveFrom(path.dirname(importer || "/"), id));
      } catch {
        this.error(
          `Unable to resolve "${id}"${importer ? ` from "${importer}"` : ""}.`
        );
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
