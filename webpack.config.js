const path = require('path');
//const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    _3d: './src/3d.js',
    index: './src/index.js',
    imgs: './src/imgs.js',
  },
  devtool: 'inline-source-map',
  devServer: {
    contentBase: './dist',
    compress: true,
    port: 9000,
    hot: true,
  },
  /*plugins: [new HtmlWebpackPlugin({
    template: './src/3d.html',
    filename: '3d.html',
  })],*/
  /*module: {
    rules: [
      {
        test: /\.html$/,
        type: 'asset/resource',
        generator: {
          filename: '[name][ext]',
        },
      },
      {
        test: /\.html$/i,
        use: ['extract-loader', {
          loader: 'html-loader',
          options: {
            esModule: false
          }
        }],
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },*/
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist/lib'),
    publicPath: '/lib',
    clean: true,
    //assetModuleFilename: '[name][ext]',
  },
};
