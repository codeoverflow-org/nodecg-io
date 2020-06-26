import { NodeCG } from "nodecg/types/server";
import { NodeCGIOCore } from "nodecg-io-core/extension";
import { Service, ServiceProvider } from "nodecg-io-core/extension/types";
import { emptySuccess, success, error, Result } from "nodecg-io-core/extension/utils/result";
import * as WebSocket from "ws";

interface WSServerServiceConfig {
    port: number
}

export interface WSServerServiceClient {
    getRawClient(): WebSocket.Server
}

module.exports = (nodecg: NodeCG): ServiceProvider<WSServerServiceClient> | undefined => {
    nodecg.log.info("Websocket server bundle started");
    const core: NodeCGIOCore | undefined = nodecg.extensions["nodecg-io-core"] as any;
    if (core === undefined) {
        nodecg.log.error("nodecg-io-core isn't loaded! Websocket server bundle won't function without it.");
        return undefined;
    }

    const service: Service<WSServerServiceConfig, WSServerServiceClient> = {
        schema: core.readSchema(__dirname, "../ws-schema.json"),
        serviceType: "websocket-server",
        validateConfig: validateConfig,
        createClient: createClient(nodecg),
        stopClient: stopClient
    };

    return core.registerService(service);
};

async function getServer(config: WSServerServiceConfig): Promise<Result<WebSocket.Server>> {
    const client = new WebSocket.Server({ port: config.port });

    // The constructor doesn't block, so we either wait till the server has been started or a
    // error has been produced.
    return await new Promise<Result<WebSocket.Server>>(resolve => {
        client.once("listening", () => { // Will be called if everything went fine
            resolve(success(client));
        });
        client.once("error", err => { // Will be called if there is an error
            resolve(error(err.message));
        });
    });
}

async function validateConfig(config: WSServerServiceConfig): Promise<Result<void>> {
    try {
        const client = await getServer(config);
        if (!client.failed) {
            client.result.close(); // Close the server after testing that it can be opened
            return emptySuccess();
        } else {
            return client; // Return produced error
        }
    } catch (err) {
        console.log("catch executed")
        return error(err.toString());
    }
}

function createClient(nodecg: NodeCG): (config: WSServerServiceConfig) => Promise<Result<WSServerServiceClient>> {
    return async (config) => {
        try {
            const client = await getServer(config);
            if(client.failed) {
                return client; // Pass the error to the framework
            }

            nodecg.log.info("Successfully started WebSocket server.")
            return success({
                getRawClient() {
                    return client.result;
                }
            });
        } catch (err) {
            return error(err.toString());
        }
    }
}

function stopClient(client: WSServerServiceClient): void {
    client.getRawClient().close();
}