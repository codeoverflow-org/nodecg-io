// @ts-check
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
/* eslint-disable no-console */

const esbuild = require("esbuild");
const path = require("path");
const process = require("process");
const fs = require("fs");

const args = process.argv.slice(2);
const prod = process.env.NODE_ENV === "production";

const entryPoints = [
    "monaco-editor/esm/vs/language/json/json.worker.js",
    "monaco-editor/esm/vs/editor/editor.worker.js",
    "dashboard/debug-helper.ts",
];

if (args.includes("--clean") || args.includes("--rebuild")) {
    // remove dist folder
    try {
        fs.rmSync(path.join(__dirname, "dist"), { recursive: true, force: true });
    } catch (err) {
        console.log(err);
    }
    if (!args.includes("--rebuild")) {
        process.exit(0);
    }
}

/**@type {import('esbuild').BuildOptions}*/
const BuildOptions = {
    /**
     * By default, esbuild will not bundle the input files. Bundling must be
     * explicitly enabled.
     */
    bundle: true,
    /**
     * This option controls the file names of the output files corresponding to
     * each input entry point file.
     */
    entryNames: "[name].bundle",
    /**
     * This is an array of files that each serve as an input to the bundling
     * algorithm.
     */
    entryPoints: entryPoints,
    /**
     * This sets the output format for the generated JavaScript files. We are
     * using the `iife`, witch format stands for "immediately-invoked function
     * expression".
     */
    format: "iife",
    /**
     * This option changes how a given input file is interpreted. We use it to
     * copy assets.
     */
    loader: {
        ".ttf": "file",
    },
    /**
     * When enabled, the generated code will be minified instead of
     * pretty-printed. We enable this option on production builds.
     */
    minify: prod,
    /**
     * This option sets the output directory for the build operation.
     */
    outdir: path.join(__dirname, "dashboard", "dist"),
    /**
     * Configure esbuild's bundler to generate code intended for the browser.
     */
    platform: "browser",
    /**
     * Generate source maps, witch can make it easier to debug code.
     */
    sourcemap: true,
    /**
     * This sets the target environment for the generated JavaScript and/or CSS
     * code. The target can either be set to a JavaScript language version such
     * as es2020 or to a list of versions of individual engines ([chrome58,
     * firefox57, safari11, edge16]).
     */
    target: "ES2015",
    /**
     * Enabling watch mode on the build API tells esbuild to listen for changes
     * on the file system and to rebuild whenever a file changes that could
     * invalidate the build.
     */
    watch: args.includes("--watch")
};

esbuild
    .build(BuildOptions)
    .catch(() => process.exit(1))
    .then((result) => {
        if (result.errors.length > 0) {
            console.error(result.errors);
        }
        if (result.warnings.length > 0) {
            console.error(result.warnings);
        }
    });
