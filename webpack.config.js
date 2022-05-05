const path = require('path');
//const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    _3d: './src/3d.js',
    index: './src/index.js',
    imgs: './src/imgs.js',
  },
  externals: {
    three: 'THREE'
  },
  devtool: 'source-map',
  devServer: {
    contentBase: './dist',
    compress: true,
    port: 9000,
    hot: true,
    writeToDisk: true
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist/lib'),
    publicPath: '/lib',
    clean: true,
    //assetModuleFilename: '[name][ext]',
  },
};
