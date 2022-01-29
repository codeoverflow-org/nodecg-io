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
const npm = JSON.parse(child_process.execSync("npm ls --json").toString());

// Filter out any dependencies which are not resolved locally in samples or services because the other npm packages will not be loaded by NodeCG
let bundles = Object.entries(npm.dependencies)
    .filter((i) =>
        Object.entries(i[1]).some(
            (j) =>
                j[0] === "resolved" &&
                (`${j[1]}`.startsWith("file:../samples/") ||
                    `${j[1]}`.startsWith("file:../services/") ||
                    `${j[1]}` === "file:../nodecg-io-core"),
        ),
    )
    .map((v) => v[0]);

console.log(`Found ${bundles.length} bundles in this install.`);

console.log("");
console.log("NodeCG sterr");
console.log("--------------------------------------------------------------------------------");

// Spawn a process that runs NodeCG
const child = child_process.spawn("node", ["index.js"], { cwd: cwd.dir });

// Store stdout in lines and stream stderr to stderr of this process
const lines = [];
child.stdout.on("data", (data) => lines.push(data.toString()));
child.stderr.on("data", (data) => console.error(data.toString()));

// Let NodeCG run for 15 seconds to load all bundles
setTimeout(() => {
    // We don't want to leave NodeCG running, if it was loaded successfully.
    // If it has errored, it will not be running anymore.
    if (child.pid) {
        child.kill();
    }

    // Check exit code for failure
    const exitCode = child.exitCode;
    if (exitCode !== null && exitCode !== 0) {
        throw new Error(`NodeCG exited with code ${exitCode}`);
    }

    // Try to find each bundle in the logs.
    const missing = bundles.filter(
        /*Using endsWith here to remove possible ansi styling of "[info]" caused by ModeCG's logger when run locally*/
        (i) => !lines.some((j) => j.includes("[nodecg/lib/server/extensions] Mounted " + i + " extension")),
    );

    // Fail the run if there are missing bundles.
    if (missing.length > 0) {
        // Only log stout if the run has failed because otherwise its unimportant and everything important should be in stderr
        console.log("");
        console.log("NodeCG stout");
        console.log("--------------------------------------------------------------------------------");
        console.log(lines.join(""));

        console.log("");
        console.log("Missing Bundles");
        console.log("--------------------------------------------------------------------------------");
        console.log(missing);

        throw new Error(`NodeCG did not mount ${missing.length} bundle(s).`);
    }
}, 15000);
