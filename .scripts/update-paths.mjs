import fs from "fs";
import path from "path";

import { getPackages } from "@manypkg/get-packages";

export const { root, packages } = await getPackages(process.cwd());

const rootTSconfig = path.join(root.dir, "tsconfig.json");
const tsconfig = {
    files: [],
    references: packages
        .filter((pkg) => fs.readdirSync(pkg.dir).includes("tsconfig.json"))
        .map((v) => ({ path: path.relative(root.dir, v.dir) })),
};

let content = "// This file will be overwritten automatically! Do not store options here.\n" + JSON.stringify(tsconfig);
fs.writeFileSync(rootTSconfig, content, { encoding: "utf8" });
