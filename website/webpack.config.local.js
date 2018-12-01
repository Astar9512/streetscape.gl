// Copyright (c) 2019 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

// This file contains webpack configuration settings that allow
// examples to be built against the deck.gl source code in this repo instead
// of building against their installed version of deck.gl.
//
// This enables using the examples to debug the main deck.gl library source
// without publishing or npm linking, with conveniences such hot reloading etc.

// avoid destructuring for older Node version support
const {resolve} = require('path');

const ROOT_DIR = resolve(__dirname, '..');

const ALIASES = require('../aliases');

// Support for hot reloading changes to the deck.gl library:
function makeLocalDevConfig() {
  return {
    // TODO - Uncomment when all examples use webpack 4 for faster bundling
    // mode: 'development',

    // suppress warnings about bundle size
    devServer: {
      stats: {
        warnings: false
      },
      contentBase: [
        resolve(__dirname, './src/static'),
        // data directory for demo app
        resolve(__dirname, '../data/generated')
      ]
    },

    devtool: 'source-map',

    resolve: {
      // https://github.com/ReactTraining/react-router/issues/6201
      modules: [resolve('./node_modules'), resolve(ROOT_DIR, './node_modules')],
      alias: ALIASES
    },
    module: {
      rules: [
        {
          // Unfortunately, webpack doesn't import library sourcemaps on its own...
          test: /\.js$/,
          use: ['source-map-loader'],
          enforce: 'pre'
        }
      ]
    }
  };
}

function addLocalDevSettings(config, exampleDir) {
  const LOCAL_DEV_CONFIG = makeLocalDevConfig(exampleDir);
  config = Object.assign({}, LOCAL_DEV_CONFIG, config);
  config.resolve = Object.assign({}, LOCAL_DEV_CONFIG.resolve, config.resolve || {});
  config.resolve.alias = config.resolve.alias || {};
  Object.assign(config.resolve.alias, LOCAL_DEV_CONFIG.resolve.alias);

  config.module = config.module || {};
  Object.assign(config.module, {
    rules: (config.module.rules || []).concat(LOCAL_DEV_CONFIG.module.rules)
  });

  config.devServer = config.devServer || {};
  config.devServer.contentBase = (config.devServer.contentBase || []).concat(
    LOCAL_DEV_CONFIG.devServer.contentBase
  );

  return config;
}

module.exports = (config, exampleDir) => env => {
  // npm run start-local now transpiles the lib
  if (env && env.local) {
    config = addLocalDevSettings(config, exampleDir);
  }

  // npm run start-es6 does not transpile the lib
  if (env && env.es6) {
    config = addLocalDevSettings(config, exampleDir);
  }

  // console.warn(JSON.stringify(config, null, 2)); // uncomment to debug config
  return config;
};