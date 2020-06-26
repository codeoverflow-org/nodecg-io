import { NodeCG } from "nodecg/types/server";
import { NodeCGIOCore } from "nodecg-io-core/extension";
import { Service, ServiceProvider } from "nodecg-io-core/extension/types";
import { emptySuccess, success, error, Result } from "nodecg-io-core/extension/utils/result";
import * as WebSocket from "ws";

interface WSClientServiceConfig {
    address: string;
}

export interface WSClientServiceClient {
    getRawClient(): WebSocket;
}

module.exports = (nodecg: NodeCG): ServiceProvider<WSClientServiceClient> | undefined => {
    nodecg.log.info("Websocket client bundle started");
    const core: NodeCGIOCore | undefined = nodecg.extensions["nodecg-io-core"] as any;
    if (core === undefined) {
        nodecg.log.error("nodecg-io-core isn't loaded! Websocket client bundle won't function without it.");
        return undefined;
    }

    const service: Service<WSClientServiceConfig, WSClientServiceClient> = {
        schema: core.readSchema(__dirname, "../ws-schema.json"),
        serviceType: "websocket-client",
        validateConfig: validateConfig,
        createClient: createClient(nodecg),
        stopClient: stopClient,
    };

    return core.registerService(service);
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
