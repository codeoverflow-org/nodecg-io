import path from "path";
import { readdirSync } from "fs";
import { cwd } from "process";
import { getPackages } from "@manypkg/get-packages";

let projects = [];
// @ts-ignore
const { packages } = await getPackages(cwd());

/** @param pkg {import("@manypkg/get-packages").Package} */
function hasJestConfig(pkg) {
    return (
        readdirSync(pkg.dir).some(
            (file) =>
                file === "jest.config.js" ||
                file === "jest.config.ts" ||
                file === "jest.config.cjs" ||
                file === "jest.config.mjs" ||
                file === "jest.config.json",
        ) || pkg.packageJson["jest"]
    );
}

projects = packages.filter((pkg) => hasJestConfig(pkg)).map((v) => `<rootDir>/${path.relative(cwd(), v.dir)}`);

console.log(projects);

/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
    projects,
};

export default config;
