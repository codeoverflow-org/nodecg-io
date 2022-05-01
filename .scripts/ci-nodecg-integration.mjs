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

// Spawn a process that runs NodeCG
const child = child_process.spawn("node", ["index.js"], { cwd: cwd.dir });

// Store stdout in lines and stream stderr to stderr of this process
const lines = [];
child.stdout.on("data", (data) => lines.push(data.toString()));
child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);

// Let NodeCG run for 15 seconds to load all bundles
setTimeout(() => {
    // We don't want to leave NodeCG running, if it was loaded successfully.
    // If it has errored, it will not be running anymore.
    if (child.pid) {
        child.kill();
    }
    console.log("--------------------------------------------------------------------------------");
    console.log("Stopped NodeCG\n");

    // Check exit code for failure
    const exitCode = child.exitCode;
    if (exitCode !== null && exitCode !== 0) {
        throw new Error(`NodeCG exited with code ${exitCode}`);
    }

    // Try to find each bundle in the logs.
    const missing = bundles.filter(
        // Using endsWith here to remove possible ansi styling of "[info]" caused by ModeCG's logger when run locally
        (i) =>
            !lines.some((j) =>
                j.includes("[nodecg/lib/server/extensions] Mounted " + i.packageJson.name + " extension"),
            ),
    );

    // Fail the run if there are missing bundles.
    if (missing.length > 0) {
        console.log("Missing Bundles:");
        console.log(missing.map((v) => v.packageJson.name));

        throw new Error(`NodeCG did not mount ${missing.length} bundle(s).`);
    }

    console.log("No Errors!");
}, 15000);
