// @ts-check
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
/* eslint-disable no-console */

const esbuild = require("esbuild");
const path = require("path");

const entryPoints = [
    "monaco-editor/esm/vs/language/json/json.worker.js",
    "monaco-editor/esm/vs/language/css/css.worker.js",
    "monaco-editor/esm/vs/language/html/html.worker.js",
    "monaco-editor/esm/vs/language/typescript/ts.worker.js",
    "monaco-editor/esm/vs/editor/editor.worker.js",
    "main.ts",
];

/**@type {import('esbuild').BuildOptions}*/
const BuildOptions = {
    entryPoints: entryPoints,
    bundle: true,
    format: "iife",
    minify: false,
    sourcemap: true,
    target: "ES2015",
    entryNames: "[name].bundle",
    outdir: path.join(__dirname, "dist"),
    loader: {
        ".ttf": "file",
    },
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
