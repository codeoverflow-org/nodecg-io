import fetch from "node-fetch";
import { spawn } from "child_process";
import { onExit } from "@rauschma/stringio";
import { NodeCG } from "nodecg/types/server";

export class Xdotool {
    private readonly address: string | null;

    constructor(private nodecg: NodeCG, host: string, port: number) {
        if ((host.startsWith("127.0.0.") || host == "localhost") && port < 0) {
            this.address = null;
        } else {
            this.address = `http://${host}:${port}`;
        }
    }

    async testConnection(): Promise<boolean> {
        if (this.address == null) {
            const childProcess = spawn("xdotool", ["version"], {
                stdio: ["ignore", "ignore", process.stderr],
                env: process.env,
            });
            await onExit(childProcess);
            if (childProcess.exitCode === 0) {
                // Success
                return true;
            } else if (childProcess.exitCode === 127) {
                // Not found
                throw new Error(`xdotool not found`);
            } else {
                return false;
            }
        } else {
            const response = await fetch(`${this.address}/nodecg-io`, { method: "GET" });
            return response.status === 404;
        }
    }

    async sendCommand(command: string): Promise<void> {
        if (this.address == null) {
            const childProcess = spawn("xdotool", ["-"], {
                stdio: ["pipe", "ignore", process.stderr],
                env: process.env,
            });
            childProcess.stdin.end(`${command}\n`, "utf-8");
            await onExit(childProcess);
            if (childProcess.exitCode !== 0) {
                throw new Error(`xdotool returned error code ${childProcess.exitCode}`);
            }
        } else {
            try {
                await fetch(`${this.address}/send/${command}`, { method: "GET" });
            } catch (err) {
                this.nodecg.log.error(`Error while using the xdotool Connector: ${err}`);
            }
        }
    }
}
