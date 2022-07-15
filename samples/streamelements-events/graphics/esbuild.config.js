// @ts-check
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
/* eslint-disable no-console */

const esbuild = require("esbuild");
const esbuildAlias = require("esbuild-plugin-alias");
const path = require("path");
const process = require("process");
const fs = require("fs");

const args = new Set(process.argv.slice(2));
const prod = process.env.NODE_ENV === "production";

if (args.has("--clean") || args.has("--rebuild")) {
    // Remove dist folder
    try {
        fs.rmSync(path.join(__dirname, "index.js"));
    } catch (error) {
        console.log(error);
    }

    if (!args.has("--rebuild")) {
        process.exit(0);
    }
}

/** @type {import('esbuild').BuildOptions} */
const BuildOptions = {
    bundle: true,
    entryPoints: [path.join(__dirname, "index.ts")],
    minify: prod,
    outfile: path.join(__dirname, "index.js"),
    platform: "browser",
    sourcemap: true,
    watch: args.has("--watch"),
    plugins: [
        esbuildAlias({
            "vue": require.resolve("vue/dist/vue.esm-bundler.js"),
        })
    ]
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
