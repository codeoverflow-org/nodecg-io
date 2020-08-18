const path = require('path');

const ROOT = path.resolve( __dirname);
const DESTINATION = path.resolve( __dirname, 'dist');

module.exports = {
    context: ROOT,

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
        extensions: ['.ts', '.js'],
        modules: [
            ROOT,
            'node_modules'
        ]
    },

    module: {
        rules: [
            /****************
             * PRE-LOADERS
             *****************/
            {
                enforce: 'pre',
                test: /\.js$/,
                use: 'source-map-loader'
            },


            /****************
             * LOADERS
             *****************/
            {
                test: /\.ts$/,
                exclude: [ /node_modules/ ],
                use: 'ts-loader'
            }
        ]
    },

    devtool: 'cheap-module-source-map',
    devServer: {}
};