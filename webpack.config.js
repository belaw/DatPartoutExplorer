const path = require('path');

module.exports = {
    mode: 'development',
    watch: true,
    watchOptions: {
        ignored: /node_modules/
    },
    entry: './lib/3d.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    }
};
