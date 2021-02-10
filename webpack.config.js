const path = require('path');
const nodeExternals = require('webpack-node-externals');
const { DefinePlugin } = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const config = {
  target: 'node',
  externals: [nodeExternals()],
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@src': path.resolve(__dirname, 'src'),
      '@core': path.resolve(__dirname, 'src/core'),
      '@modules': path.resolve(__dirname, 'src/modules'),
      '@common': path.resolve(__dirname, 'src/common'),
    },
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
  },
  watchOptions: {
    aggregateTimeout: 600,
    ignored: /node_modules/,
  },
  plugins: [
    new CleanWebpackPlugin({
      cleanStaleWebpackAssets: false,
      cleanOnceBeforeBuildPatterns: [path.resolve(__dirname, './dist')],
    }),
    new DefinePlugin({
      __VERSION__: JSON.stringify(require('./package.json').version),
    }),
  ],
};

module.exports = (env, argv) => {
  if (argv.mode === 'development') {
    // * add some development rules here
    config.devtool = 'cheap-module-source-map';
  } else if (argv.mode === 'production') {
    // * add some prod rules here
  } else {
    throw new Error('Specify env');
  }

  return config;
};
