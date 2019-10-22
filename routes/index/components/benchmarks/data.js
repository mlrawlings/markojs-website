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
      inferno: 21453,
      marko: 24540,
      preact: 4587,
      react: 4300,
      vue: 9120
    },
    safari: {
      inferno: 11046,
      marko: 5516,
      preact: 3432,
      react: 6675,
      vue: 2063
    },
    chrome: {
      inferno: 17078,
      marko: 6008,
      preact: 6435,
      react: 7358,
      vue: 4291
    },
    firefox: {
      inferno: 8213,
      marko: 3057,
      preact: 2930,
      react: 4062,
      vue: 2852
    },
    ios: {
      inferno: 7895,
      marko: 4128,
      preact: 2607,
      react: 4487,
      vue: 1741
    },
    android: {
      inferno: 6348,
      marko: 1897,
      preact: 2215,
      react: 2289,
      vue: 1363
    }
  },
  "search-results": {
    node: {
      inferno: 3014,
      marko: 6399,
      preact: 746,
      react: 765,
      vue: 2657
    },
    safari: {
      inferno: 513,
      marko: 363,
      preact: 245,
      react: 454,
      vue: 186
    },
    chrome: {
      inferno: 239,
      marko: 175,
      preact: 132,
      react: 210,
      vue: 142
    },
    firefox: {
      inferno: 121,
      marko: 96.63,
      preact: 89.21,
      react: 122,
      vue: 59.06
    },
    ios: {
      inferno: 345,
      marko: 240,
      preact: 181,
      react: 317,
      vue: 140
    },
    android: {
      inferno: 66.54,
      marko: 50.36,
      preact: 35.17,
      react: 62.13,
      vue: 41.21
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
