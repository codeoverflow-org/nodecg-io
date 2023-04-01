import * as fs from "fs";
import * as path from "path";
import * as child_process from "child_process";
import { getPackages } from "@manypkg/get-packages";

const cwd = path.parse(process.cwd());
const nodecgiodir = fs.readdirSync(process.cwd()).some((v) => v === "nodecg-io-core");

// Check if we are in the nodecg-io folder because we use relative paths later on.
if (!nodecgiodir) {
    throw new Error("You will have to run this script from inside the nodecg-io folder!");
}

const { packages } = await getPackages(process.cwd());

// Filter out packages other than core, samples and services, because they should not be NodeCG-bundles (dashboard, utils)
const bundles = packages.filter(
    (v) =>
        v.packageJson.name === "nodecg-io-core" ||
        path.parse(v.dir).dir.endsWith("samples") ||
        path.parse(v.dir).dir.endsWith("services"),
);

console.log(`Found ${bundles.length} bundles in this install.`);
console.log("\nStarted NodeCG");
console.log("--------------------------------------------------------------------------------");

// Spawn a process that runs NodeCG and let it run for 15 seconds to load all bundles
const child = child_process.spawn("node", ["index.js"], { cwd: cwd.dir, timeout: 20000 });

// Store stdout and pipe the output of the child process to the output of this process
const buffer = [];
child.stdout.on("data", (data) => buffer.push(data));
child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);

child.once("exit", (exitCode, signal) => {
    console.log("--------------------------------------------------------------------------------");
    console.log("Stopped NodeCG\n");

    // Check exit code for failure
    // 143 is the exit code when the process is killed by the timeout (SIGTERM)
    if (exitCode !== null && exitCode !== 143) {
        throw new Error(`NodeCG exited with code ${exitCode} ${signal}`);
    }

    const log = Buffer.concat(buffer).toString();

    // Try to find each bundle in the logs.
    const missing = bundles.filter(
        (bundle) => !log.includes(` [extensions] Mounted ${bundle.packageJson.name} extension`),
    );

    // Fail the run if there are missing bundles.
    if (missing.length > 0) {
        console.log("Missing Bundles:");
        console.log(missing.map((v) => v.packageJson.name));

        throw new Error(`NodeCG did not mount ${missing.length} bundle(s).`);
    }

    console.log("No Errors!");
});
