import fs from "fs";
import path from "path";

import { getPackages } from "@manypkg/get-packages";

export const { rootDir, packages, rootPackage } = await getPackages(process.cwd());

const rootTSconfig = path.join(rootDir, "tsconfig.json");
const tsconfig = {
    files: [],
    references: packages
        .filter((pkg) => fs.readdirSync(pkg.dir).includes("tsconfig.json"))
        .map((v) => ({ path: path.relative(rootDir, v.dir) })),
};

let content = "// This file will be overwritten automatically! Do not store options here.\n" + JSON.stringify(tsconfig);
console.log("Update root tsconfig.json…");
fs.writeFileSync(rootTSconfig, content, { encoding: "utf8" });
