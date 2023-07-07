#!/usr/bin/env node
// @ts-check
/* eslint-disable no-console */
/* eslint-disable no-undef */ // TODO: fix

import * as esbuild from "esbuild";
import * as process from "process";
import * as fs from "fs";

const args = new Set(process.argv.slice(2));
const prod = process.env.NODE_ENV === "production";

if (args.has("--help")) {
    console.log("Usage: esbuild.config.mjs [entrypoint] [options]");
    console.log("Builds a graphic or dashboard for NodeCG using esbuild.");
    console.log("If no entrypoint is specified, main.ts is used.");
    console.log("Options:");
    console.log("  --clean     Remove dist folder and exit");
    console.log("  --help      Show this help");
    console.log("  --monaco    Add monaco editor workers as entrypoints");
    console.log("  --rebuild   Remove dist folder and rebuild");
    console.log("  --watch     Watch for changes and build");
    process.exit(0);
}

const [firstArg] = args;
const mainEntryPoint = firstArg && !firstArg.startsWith("--") ? firstArg : "main.ts";
const entryPoints = [mainEntryPoint];

if (args.has("--monaco")) {
    entryPoints.push("monaco-editor/esm/vs/language/json/json.worker.js");
    entryPoints.push("monaco-editor/esm/vs/editor/editor.worker.js");
}

if (args.has("--clean") || args.has("--rebuild")) {
    // Remove dist folder
    try {
        fs.rmSync("dist", { recursive: true, force: true });
    } catch (error) {
        console.log(error);
    }

    if (!args.has("--rebuild")) {
        process.exit(0);
    }
}

/** @type {import('esbuild').BuildOptions} */
const buildOptions = {
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
    entryPoints,
    /**
     * This sets the output format for the generated JavaScript files. We are
     * using the `iife`, which format stands for "immediately-invoked function
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
    outdir: "dist",
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
};

try {
    const context = await esbuild.context(buildOptions);
    if (args.has("--watch")) {
        await context.watch();
    } else {
        const result = await context.rebuild();
        if (result.errors.length > 0) {
            console.error(result.errors);
        }

        if (result.warnings.length > 0) {
            console.error(result.warnings);
        }

        process.exit(0);
    }
} catch (error) {
    console.error(error);
    process.exit(1);
}
