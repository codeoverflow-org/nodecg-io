import { NodeCG } from "nodecg/types/server";
import { ServiceClient } from "nodecg-io-core/extension/types";
import { emptySuccess, Result, success } from "nodecg-io-core/extension/utils/result";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import * as WebSocket from "ws";

interface WSClientServiceConfig {
    address: string;
}

export interface WSClientServiceClient extends ServiceClient<WebSocket> {
    send(message: string): void;
    onMessage(func: (message: WebSocket.Data) => void): void;
    onClose(func: () => void): void;
    onError(func: (error: Error) => void): void;
}

module.exports = (nodecg: NodeCG) => {
    new WSClientService(nodecg, "websocket-client", __dirname, "../ws-schema.json").register();
};

class WSClientService extends ServiceBundle<WSClientServiceConfig, WSClientServiceClient> {
    async validateConfig(config: WSClientServiceConfig): Promise<Result<void>> {
        const client = new WebSocket(config.address); // Let Websocket connect, will throw an error if it doesn't work.
        await new Promise((resolve, reject) => {
            client.once("error", reject);
            client.on("open", () => {
                client.off("error", reject);
                resolve();
            });
        });
        client.close();
        return emptySuccess();
    }

    async createClient(config: WSClientServiceConfig): Promise<Result<WSClientServiceClient>> {
        const client = new WebSocket(config.address); // Let Websocket connect, will throw an error if it doesn't work.
        await new Promise((resolve, reject) => {
            client.once("error", reject);
            client.on("open", () => {
                client.off("error", reject);
                resolve();
            });
        });
        this.nodecg.log.info("Successfully connected to the WebSocket server.");
        return success({
            getNativeClient() {
                return client;
            },
            send(message: string) {
                client.send(message);
            },
            onClose(func: () => void) {
                client.on("close", func);
            },
            onMessage(func: (message: WebSocket.Data) => void) {
                client.on("message", func);
            },
            onError(func: (error: Error) => void) {
                client.on("error", func);
            },
        });
    }

    stopClient(client: WSClientServiceClient): void {
        client.getNativeClient().close();
    }
}
