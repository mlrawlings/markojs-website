const path = require("path");
const webpack = require("webpack");
const { taglib } = require("@marko/compiler");
const { configBuilder } = require("@marko/build");
const nodeExternals = require("webpack-node-externals");
const { load } = require("./src/utils/language-registry");
const production = process.env.NODE_ENV === "production";
const { getServerConfig, getBrowserConfigs } = configBuilder({
  entry: path.join(__dirname, "src/pages"),
  production
});

// globally register <code-block> so it can be used by the markdown files
taglib.register(
  "code-block",
  {
    "<code-block>": {
      transformer: require.resolve("./src/components/code-block/transformer"),
      "parse-options": {
          state: "static-text",
          preserveWhitespace: true
      },
    }
  }
);

const encodedLanguageIds = new Map();
const loadingRegistry = load({
  getEncodedLanguageId(scopeName) {
    let id = encodedLanguageIds.get(scopeName);
    if (id) {
      return id;
    }

    id = encodedLanguageIds.size + 1;
    encodedLanguageIds.set(scopeName, id);
    return id;
  }
});

module.exports = [
  ...getBrowserConfigs(config => {
    shared(config);

    config.module.rules.push(
      {
        test: /\.wasm$/,
        loader: "file-loader",
        type: "javascript/auto"
      },
      {
        test: /\.worker\.js$/,
        loader: "worker-loader"
      }
    );

    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        fs: path.join(__dirname, "browser-shims/fs"),
        module: path.join(__dirname, "browser-shims/module")
      }
    };

    if (production) {
      // Needed for the tryonline page.
      config.plugins.push(new webpack.NamedModulesPlugin());
    }

    return config;
  }),
  getServerConfig(config => {
    shared(config);
    config.externals = [
      // Exclude node_modules, but ensure non js files are bundled.
      // Eg: `.marko`, `.css`, etc.
      nodeExternals({
        allowlist: [/\.(?!(?:js|json)$)[^.]+$/]
      })
    ];
    return config;
  })
];

function shared(config) {
  config.plugins.unshift(compiler => {
    // Wait for language registry to be loaded before running bundling.
    // The syntax highlighter must be loaded async, but can only be
    // used synchronously during the the compilation.
    compiler.hooks.beforeCompile.tapPromise(
      "LoadLanguageRegistry",
      () => loadingRegistry
    );

    // Hide expected warnings from webpack.
    compiler.hooks.done.tap("HideKnownWarnings", result => {
      result.compilation.warnings = result.compilation.warnings.filter(
        warning =>
          !(
            warning.message.endsWith("dependency is an expression") &&
            warning.origin.resource.includes("@babel/core")
          )
      );
    });
  });

  const fileLoader = config.module.rules.find(({ loader }) => loader && loader.includes("file-loader"));
  const originalTest = fileLoader.test;
  fileLoader.test = file => !/\.(md)$/.test(file) && originalTest(file);
  
  config.module.rules.push({
    test: /\.md$/,
    use: [
      "@marko/webpack/loader",
      require.resolve("./src/utils/markodown-loader")
    ]
  });
}
