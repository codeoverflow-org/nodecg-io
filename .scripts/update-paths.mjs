import * as fs from "fs";

const DIRS = ["./samples", "./services", "./utils"];

for (const dir of DIRS) {
    let tsconfig = `// This file will be overwritten automatically! Do not store options here.
{
    "files": [],
    "references": [
        `;
    let contents = fs.opendirSync(dir);
    let item;
    while ((item = contents.readSync()) !== null) {
        if (item.isDirectory() && fs.readdirSync(`${dir}/${item.name}`).includes("tsconfig.json")) {
            tsconfig += `{"path": "./${item.name}"},`;
        }
    }
    tsconfig += `
    ]
}`;
    fs.writeFileSync(dir + "/tsconfig.json", tsconfig, { encoding: "utf8" });
}
