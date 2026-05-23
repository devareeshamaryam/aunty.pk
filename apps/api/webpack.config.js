const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = function (options) {
  return {
    ...options,
    externals: [
      nodeExternals({
        allowlist: [/^@repo\//],
        modulesDir: path.resolve(__dirname, '../../node_modules'),
      }),
      nodeExternals({
        allowlist: [/^@repo\//],
        modulesDir: path.resolve(__dirname, 'node_modules'),
      }),
    ],
    resolve: {
      ...options.resolve,
      extensions: ['.ts', '.js', '.json'],
    },
    module: {
      ...options.module,
      rules: [
        {
          test: /\.ts$/,
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
          },
          exclude: /node_modules\/(?!@repo)/,
        },
      ],
    },
  };
};
