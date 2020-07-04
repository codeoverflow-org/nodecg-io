import { NodeCG } from "nodecg/types/server";
import { ServiceProvider } from "nodecg-io-core/extension/types";
import { emptySuccess, success, Result } from "nodecg-io-core/extension/utils/result";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import * as WebSocket from "ws";

interface WSClientServiceConfig {
    address: string;
}

export interface WSClientServiceClient {
    getRawClient(): WebSocket;
}

module.exports = (nodecg: NodeCG): ServiceProvider<WSClientServiceClient> | undefined => {
    const wsClientService = new WSClientService(nodecg, __dirname, "websocket-client", "../ws-schema.json");
    return wsClientService.register();
};

class WSClientService extends ServiceBundle {
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

    createClient(nodecg: NodeCG): (config: WSClientServiceConfig) => Promise<Result<WSClientServiceClient>> {
        return async (config) => {
            const client = new WebSocket(config.address); // Let Websocket connect, will throw an error if it doesn't work.
            await new Promise((resolve, reject) => {
                client.once("error", reject);
                client.on("open", () => {
                    client.off("error", reject);
                    resolve();
                });
            });
            nodecg.log.info("Successfully connected to the WebSocket server.");
            return success({
                getRawClient() {
                    return client;
                },
            });
        };
    }

    stopClient(client: WSClientServiceClient): void {
        client.getRawClient().close();
    }
}
