import { rootDir, packages, rootPackage } from "./update-paths.mjs";
import concurrently from "concurrently";

const COMMAND = process.argv[2];

/**@type {import('concurrently').ConcurrentlyCommandInput[]}*/
const commands = packages
    .filter((v) => v.packageJson["scripts"] && v.packageJson["scripts"][COMMAND])
    .map((v) => ({
        name: v.packageJson.name,
        command: "npm:" + COMMAND,
        cwd: v.dir,
    }));

const scripts = rootPackage?.packageJson["scripts"];
if (scripts && scripts[COMMAND + ":root"]) {
    commands.unshift({
        name: rootPackage?.packageJson.name,
        command: "npm:" + COMMAND + ":root",
        cwd: rootDir,
    });
}

const colors = [
    "blue",
    "green",
    "cyan",
    "magenta",
    "red",
    "yellow",
    "white",
    "gray",
    "blackBright",
    "redBright",
    "greenBright",
    "yellowBright",
    "blueBright",
    "magentaBright",
    "cyanBright",
    "whiteBright",
];

if (commands.length > 0) {
    concurrently(commands, {
        prefixColors: colors,
    }).result.catch(() => {
        console.log("At least one build task has failed");
        process.exit(1);
    });
}
