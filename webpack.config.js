const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserJSPlugin = require('terser-webpack-plugin');
const HtmlMinifierPlugin = require('html-minifier-webpack-plugin');

const currentMode = process.env.NODE_ENV || 'development';
const isDev = currentMode === 'development';


module.exports = {
  mode: currentMode,
  devtool: isDev ? 'source-map' : '',
  optimization: {
    minimizer: [
      new TerserJSPlugin(),
      new OptimizeCSSAssetsPlugin(),
      new HtmlMinifierPlugin({ collapseWhitespace: true }),
    ],
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          'babel-loader', // isDev ? ['babel-loader', 'eslint-loader'] : 'babel-loader',
          {
            loader: 'eslint-loader',
            options: {
              emitWarning: true,
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'template.html',
    }),
    new MiniCssExtractPlugin(),
  ],
};
