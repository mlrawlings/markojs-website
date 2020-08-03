import fs from "memfs";
import { rollup } from "rollup/dist/rollup.browser.js";
import { internalModules, internalModuleGlobals } from "./internal-modules";
import memFSPlugin from "./rollup-plugins/memfs";
import babelPlugin from "./rollup-plugins/babel";
import cssPlugin from "./rollup-plugins/css";

export async function bundle({ entry, markoOptions }) {
  const bundle = await rollup({
    input: entry,
    external: internalModules,
    inlineDynamicImports: true,
    plugins: [memFSPlugin(), cssPlugin(), babelPlugin(markoOptions)],
    onwarn(warning, warn) {
      if (
        warning.code === "MISSING_NODE_BUILTINS" &&
        warning.modules.length === 1 &&
        warning.modules[0] === "events"
      ) {
        return;
      }

      return warn(warning);
    }
  });

  const result = await bundle.generate({
    name: "_",
    format: "iife",
    file: "compiled.js",
    sourcemap: true,
    globals: internalModuleGlobals
  });

  const jsOutput = result.output.find(
    output => output.fileName === "compiled.js"
  );
  const cssOutput = result.output.find(
    output => output.fileName === "compiled.css"
  );

  return {
    css: cssOutput ? cssOutput.source : "",
    js: `${jsOutput.code.slice(
      "var _ = ".length
    )}\n//# sourceMappingURL=${jsOutput.map.toUrl()}\n`
  };
}

export async function compile({ entry, markoOptions }) {
  const plugin = babelPlugin(markoOptions);
  const result = plugin.transform(fs.readFileSync(entry, "utf-8"), entry);
  plugin.buildEnd();
  return result.code;
}
