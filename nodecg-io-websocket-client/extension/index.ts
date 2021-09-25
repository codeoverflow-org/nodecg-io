import { NodeCG } from "nodecg-types/types/server";
import { Result, emptySuccess, success, ServiceBundle } from "nodecg-io-core";
import * as WebSocket from "ws";

interface WSClientServiceConfig {
    address: string;
}

export class WSClientServiceClient extends WebSocket {
    constructor(address: string) {
        super(address);
    }

    onClose(func: () => void): this {
        return this.on("close", func);
    }

    onMessage(func: (message: WebSocket.Data) => void): this {
        return this.on("message", func);
    }

    onError(func: (error: Error) => void): this {
        return this.on("error", func);
    }
}

module.exports = (nodecg: NodeCG) => {
    new WSClientService(nodecg, "websocket-client", __dirname, "../ws-schema.json").register();
};

class WSClientService extends ServiceBundle<WSClientServiceConfig, WSClientServiceClient> {
    async validateConfig(config: WSClientServiceConfig): Promise<Result<void>> {
        const client = new WSClientServiceClient(config.address); // Let Websocket connect, will throw an error if it doesn't work.
        await new Promise((resolve, reject) => {
            client.once("error", reject);
            client.on("open", () => {
                client.off("error", reject);
                resolve(undefined);
            });
        });
        client.close();
        return emptySuccess();
    }

    async createClient(config: WSClientServiceConfig): Promise<Result<WSClientServiceClient>> {
        const client = new WSClientServiceClient(config.address); // Let Websocket connect, will throw an error if it doesn't work.
        await new Promise((resolve, reject) => {
            client.once("error", reject);
            client.on("open", () => {
                client.off("error", reject);
                resolve(undefined);
            });
        });
        this.nodecg.log.info("Successfully connected to the WebSocket server.");
        return success(client);
    }

    stopClient(client: WSClientServiceClient): void {
        client.close();
    }

    removeHandlers(client: WSClientServiceClient): void {
        client.removeAllListeners();
    }
}
