import { NodeCG } from "nodecg/types/server";
import { ServiceProvider } from "nodecg-io-core/extension/types";
import { emptySuccess, success, error, Result } from "nodecg-io-core/extension/utils/result";
import { serviceBundle, readSchema } from "nodecg-io-core/extension/serviceBundle";
import * as WebSocket from "ws";

interface WSServerServiceConfig {
    port: number;
}

export interface WSServerServiceClient {
    getRawClient(): WebSocket.Server;
}

module.exports = (nodecg: NodeCG): ServiceProvider<WSServerServiceClient> | undefined => {
    const wsServer = new serviceBundle(nodecg, {
        schema: readSchema(nodecg, __dirname, "../ws-schema.json"),
        serviceType: "websocket-server",
        validateConfig: validateConfig,
        createClient: createClient(nodecg),
        stopClient: stopClient,
    });

    return wsServer.register();
};

async function getServer(config: WSServerServiceConfig): Promise<Result<WebSocket.Server>> {
    const client = new WebSocket.Server({ port: config.port });

    // The constructor doesn't block, so we either wait till the server has been started or a
    // error has been produced.
    return await new Promise<Result<WebSocket.Server>>((resolve) => {
        client.once("listening", () => {
            // Will be called if everything went fine
            resolve(success(client));
        });
        client.once("error", (err) => {
            // Will be called if there is an error
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
        console.log("catch executed");
        return error(err.toString());
    }
}

function createClient(nodecg: NodeCG): (config: WSServerServiceConfig) => Promise<Result<WSServerServiceClient>> {
    return async (config) => {
        try {
            const client = await getServer(config);
            if (client.failed) {
                return client; // Pass the error to the framework
            }

            nodecg.log.info("Successfully started WebSocket server.");
            return success({
                getRawClient() {
                    return client.result;
                },
            });
        } catch (err) {
            return error(err.toString());
        }
    };
}

function stopClient(client: WSServerServiceClient): void {
    client.getRawClient().close();
}
