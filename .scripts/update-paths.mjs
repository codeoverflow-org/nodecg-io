import * as fs from "fs";

const DIRS = ["./samples", "./services", "./utils"];

for (const dir of DIRS) {
    let tsconfig = {
        files: [],
        references: []
    }
    let contents = fs.opendirSync(dir);
    let item;
    while ((item = contents.readSync()) !== null) {
        if (item.isDirectory() && fs.readdirSync(`${dir}/${item.name}`).includes("tsconfig.json")) {
            tsconfig.references.push({
                path: "./" + item.name
            })
        }
    }

    let content = "// This file will be overwritten automatically! Do not store options here.\n" + JSON.stringify(tsconfig)
    fs.writeFileSync(dir + "/tsconfig.json", content, { encoding: "utf8" });
}
