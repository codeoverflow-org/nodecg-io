import { NodeCG } from "nodecg/types/server";
import { ServiceProvider } from "nodecg-io-core/extension/types";
import { emptySuccess, success, error, Result } from "nodecg-io-core/extension/utils/result";
import { serviceBundle, readSchema } from "nodecg-io-core/extension/serviceBundle";
import * as WebSocket from "ws";

interface WSClientServiceConfig {
    address: string;
}

export interface WSClientServiceClient {
    getRawClient(): WebSocket;
}

module.exports = (nodecg: NodeCG): ServiceProvider<WSClientServiceClient> | undefined => {
    const wsClient = new serviceBundle(nodecg, {
        schema: readSchema(nodecg, __dirname, "../ws-schema.json"),
        serviceType: "websocket-client",
        validateConfig: validateConfig,
        createClient: createClient(nodecg),
        stopClient: stopClient,
    });

    return wsClient.register();
};

async function validateConfig(config: WSClientServiceConfig): Promise<Result<void>> {
    try {
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
    } catch (err) {
        return error(err.toString());
    }
}

function createClient(nodecg: NodeCG): (config: WSClientServiceConfig) => Promise<Result<WSClientServiceClient>> {
    return async (config) => {
        try {
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
        } catch (err) {
            return error(err.toString());
        }
    };
}

function stopClient(client: WSClientServiceClient): void {
    client.getRawClient().close();
}
