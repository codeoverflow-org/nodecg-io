import fetch from "node-fetch";
import { NodeCG } from "nodecg/types/server";

export class AHK {
    private readonly address: string;

    public constructor(private nodecg: NodeCG, host: string, port: number) {
        this.address = `http://${host}:${port}`;
    }

    public async testConnection(): Promise<boolean> {
        const response = await fetch(`${this.address}/nodecg-io`, { method: "GET" });
        return response.status === 404;
    }

    public async sendCommand(command: string): Promise<void> {
        try {
            await fetch(`${this.address}/send/${command}`, { method: "GET" });
        } catch (err) {
            this.nodecg.log.error(`Error while using the AHK Connector: ${err}`);
        }
    }
}
