const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

const ROOT = path.resolve(__dirname);
const DESTINATION = path.resolve(__dirname, 'dist');

module.exports = {
    context: ROOT,

    mode: "none",
    entry: {
        'main': './main.ts'
    },

    output: {
        filename: '[name].bundle.js',
        path: DESTINATION,
        libraryTarget: "global",
        publicPath: "./dist/"
    },

    resolve: {
        extensions: ['.js'],
        modules: [
            ROOT,
            'node_modules'
        ]
    },


    plugins: [
        new CleanWebpackPlugin()
    ],

    devtool: 'source-map',
    devServer: {}
};