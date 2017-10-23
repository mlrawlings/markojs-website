const libraries = {
  inferno: {
    name: "Inferno",
    logo: require.resolve("./logos/inferno.png"),
    color: "#e60022"
  },
  marko: {
    name: "Marko",
    logo: require.resolve("./logos/marko.png"),
    color: "#d04"
  },
  preact: {
    name: "Preact",
    logo: require.resolve("./logos/preact.png"),
    color: "#673ab8"
  },
  react: {
    name: "React",
    logo: require.resolve("./logos/react.jpg"),
    color: "#61dafb"
  },
  vue: {
    name: "Vue",
    logo: require.resolve("./logos/vue.png"),
    color: "#4fc08d"
  }
};

const environments = {
  node: {
    logo: require.resolve("./logos/node.jpg"),
    name: "Node.js",
    type: "server"
  },
  desktop: {
    logo: require.resolve("./logos/desktop.png"),
    name: "Desktop Browsers",
    type: "average"
  },
  mobile: {
    logo: require.resolve("./logos/mobile.png"),
    name: "Mobile Browsers",
    type: "average"
  },
  firefox: {
    logo: require.resolve("./logos/firefox.png"),
    name: "Firefox",
    type: "desktop"
  },
  safari: {
    logo: require.resolve("./logos/safari.png"),
    name: "Safari",
    type: "desktop"
  },
  chrome: {
    logo: require.resolve("./logos/chrome.png"),
    name: "Chrome",
    type: "desktop"
  },
  edge: {},
  ios: {
    logo: require.resolve("./logos/safari-ios.png"),
    name: "iOS Safari",
    type: "mobile"
  },
  android: {
    logo: require.resolve("./logos/chrome-android.png"),
    name: "Chrome for Android",
    type: "mobile"
  }
};

const benchmarks = {
  colors: {
    name: "Color picker",
    description: `
            <p>This benchmark measures the time it takes to cycle through 133 colors. The selected color index changes every cycle. When the selected color index changes three things happen:</p>
            <ul>
                <li>The new selected color is highlighted</li>
                <li>The old selected color is unhighlighted</li>
                <li>The selected color's name is shown at the end</li>
            </ul>
            <p>This benchmark measures how well a large render tree is optimized when only a few nodes actually need to be updated.</p>`,
    unit: "ops/s"
  },
  "search-results": {
    name: "Search results",
    description: `
            <p>This benchmark measures the time it takes to render pages of search results. Each page includes 100 search result items. Every iteration renders an entirely new set of search results. As a result of rendering new search results for every cycle, a significant number of DOM nodes must be updated.</p>
            <p>Because there are many DOM nodes being updated, the DOM itself tends to be the bottleneck in this type of benchmark.</p>`,
    unit: "ops/s"
  }
};

let resultsByBench = {
  colors: {
    node: {
      inferno: 1792,
      marko: 3262,
      preact: 2841,
      react: 212,
      vue: 824
    },
    safari: {
      inferno: 5080,
      marko: 9131,
      preact: 2139,
      react: 1824,
      vue: 2531
    },
    chrome: {
      inferno: 6580,
      marko: 8126,
      preact: 4214,
      react: 3105,
      vue: 4362
    },
    firefox: {
      inferno: 1966,
      marko: 2881,
      preact: 1491,
      react: 992,
      vue: 1928
    },
    ios: {
      inferno: 568,
      marko: 2308,
      preact: 274,
      react: 369,
      vue: 287
    },
    android: {
      inferno: 737,
      marko: 1283,
      preact: 327,
      react: 346,
      vue: 509
    }
  },
  "search-results": {
    node: {
      inferno: 398,
      marko: 1657,
      preact: 496,
      react: 31.49,
      vue: 172
    },
    safari: {
      inferno: 406,
      marko: 459,
      preact: 200,
      react: 211,
      vue: 176
    },
    chrome: {
      inferno: 409,
      marko: 430,
      preact: 302,
      react: 284,
      vue: 241
    },
    firefox: {
      inferno: 115,
      marko: 130,
      preact: 96.82,
      react: 79.79,
      vue: 58.65
    },
    ios: {
      inferno: 98.42,
      marko: 107,
      preact: 61.91,
      react: 50.12,
      vue: 31.32
    },
    android: {
      inferno: 16.22,
      marko: 20.08,
      preact: 13.37,
      react: 14.53,
      vue: 12.01
    }
  }
};

Object.entries =
  Object.entries ||
  function(object) {
    return Object.keys(object).map(key => [key, object[key]]);
  };

Object.entries(resultsByBench).forEach(entries => {
  const benchName = entries[0];
  const benchResultsByEnvironment = entries[1];
  const environmentEntries = Object.entries(benchResultsByEnvironment);
  const numDesktop = environmentEntries.filter(
    entry => environments[entry[0]].type === "desktop"
  ).length;
  const numMobile = environmentEntries.filter(
    entry => environments[entry[0]].type === "mobile"
  ).length;

  let desktopResults = (benchResultsByEnvironment.desktop = {});
  let mobileResults = (benchResultsByEnvironment.mobile = {});

  environmentEntries.forEach(entry => {
    const environmentName = entry[0];
    const environmentResultsByLibrary = entry[1];
    const environmentType = environments[environmentName].type;

    let results;
    let count;

    if (environmentType === "mobile") {
      results = mobileResults;
      count = numMobile;
    } else if (environmentType === "desktop") {
      results = desktopResults;
      count = numDesktop;
    }

    if (results) {
      Object.entries(environmentResultsByLibrary).forEach(entries => {
        const libraryName = entries[0];
        const libraryResult = entries[1];

        results[libraryName] = results[libraryName] || 0;
        results[libraryName] += libraryResult / count;
      });
    }
  });
});

module.exports = Object.entries(resultsByBench).map(entries => {
  const benchName = entries[0];
  const benchResultsByEnvironment = entries[1];
  const benchmark = benchmarks[benchName];

  let localMax = 0;
  let avergageResults = {};

  return Object.assign({}, benchmark, {
    results: Object.entries(benchResultsByEnvironment).map(entries => {
      const envName = entries[0];
      const envResultsByLibrary = entries[1];
      const environment = environments[envName];

      return Object.assign({}, environment, {
        results: Object.entries(envResultsByLibrary).map(entries => {
          const libName = entries[0];
          const libResult = entries[1];
          const library = libraries[libName];

          if (libResult > localMax) {
            localMax = libResult;
          }

          return Object.assign({}, library, {
            value: libResult,
            unit: benchmark.unit
          });
        })
      });
    }),
    max: localMax
  });
});
