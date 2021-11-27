import * as fs from "fs";
import * as path from "path";
import * as child_process from "child_process";

const cwd = path.parse(process.cwd());
const nodecgiodir = fs.readdirSync(process.cwd()).some((v) => v === "nodecg-io-core");

// Check if we are in the nodecg-io folder because we use relative paths later on.
if (!nodecgiodir) {
    throw new Error("You will have to run this script from inside the nodecg-io folder!");
}
/**
 * expected data:
 *
 * ~~~json
 * {
 *   name: 'nodecg-io',
 *   dependencies: {
 *     'name': {
 *       version: 'version',
 *       resolved: 'optional'
 *     },
 *   }
 * }
 * ~~~
 */
const npm = JSON.parse(child_process.execSync("npm ls --json"));

// Filter out any dependencies which are not resolved locally in samples or services because the other npm packages will not be loaded by NodeCG
let bundles = Object.entries(npm.dependencies)
    .filter((i) =>
        Object.entries(i[1]).some(
            (j) =>
                j[0] === "resolved" &&
                (`${j[1]}`.startsWith("file:../samples/") ||
                    `${j[1]}`.startsWith("file:../services/" || `${j[1]}` === "file:../nodecg-io-core")),
        ),
    )
    .map((v) => v[0]);

console.log(`Found ${bundles.length} bundles in this install.`);

console.log("");
console.log("NodeCG sterr");
console.log("--------------------------------------------------------------------------------");

// expects a NodeCG folder be the parent of the cwd needs timeout
const log = child_process
    .execSync("timeout --preserve-status 15s node " + cwd.dir + path.sep + "index.js", { cwd: cwd.dir })
    .toString("utf8");

const lines = log.split("\n");


// Try to find each bundle in the logs.
const missing = bundles.filter(
    /*Using endsWith here to remove possible ansi styling of "[info]" caused by ModeCG's logger when run locally*/
    (i) => !lines.some((j) => j.endsWith("[nodecg/lib/server/extensions] Mounted " + i + " extension")),
);

// Fail the run if there are missing bundles.
if (missing.length > 0) {
    // Only log stout if the run has failed because otherwise its unimportant and everything important should be in stderr
    console.log("");
    console.log("NodeCG stout");
    console.log("--------------------------------------------------------------------------------");
    console.log(log);

    console.log("");
    console.log("Missing Bundles");
    console.log("--------------------------------------------------------------------------------");
    console.log(missing);

    throw new Error(`NodeCG did not mount ${missing.length} bundle(s).`);
}
