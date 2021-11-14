const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const ROOT = path.resolve(__dirname);
const DESTINATION = path.resolve(__dirname, 'dashboard', 'dist');

module.exports = {
    context: ROOT,

    mode: "none",
    entry: {
        'main': 'dashboard/debug-helper.js'
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
        new CleanWebpackPlugin(),
        new MonacoWebpackPlugin({
            languages: ['json']
        })
    ],

    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
        ]
    },

    cache: {
        type: 'filesystem',
        compression: 'brotli'
    },

    devtool: 'source-map',
    devServer: {}
};