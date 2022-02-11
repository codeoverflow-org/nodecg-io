import { root, packages } from "./update-paths.mjs";
import concurrently from "concurrently";

const COMMAND = process.argv[2];

/**@type {import('concurrently').CommandObj[]}*/
const commands = packages
    .filter((v) => v.packageJson["scripts"] && v.packageJson["scripts"][COMMAND])
    .map((v) => ({
        name: v.packageJson.name,
        command: "npm:" + COMMAND,
        cwd: v.dir,
    }));

const scripts = root.packageJson["scripts"];
if (scripts && scripts[COMMAND + ":root"]) {
    commands.unshift({
        name: root.packageJson.name,
        command: "npm:" + COMMAND + ":root",
        cwd: root.dir,
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
