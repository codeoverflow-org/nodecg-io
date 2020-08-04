import { NodeCG } from "nodecg/types/server";
import { emptySuccess, error, Result, success } from "nodecg-io-core/extension/utils/result";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import * as WebSocket from "ws";

interface WSServerServiceConfig {
    port: number;
}

export interface WSServerServiceClient {
    getRawClient(): WebSocket.Server;
}

module.exports = (nodecg: NodeCG) => {
    new WSServerService(nodecg, "websocket-server", __dirname, "../ws-schema.json").register();
};

class WSServerService extends ServiceBundle<WSServerServiceConfig, WSServerServiceClient> {
    async getServer(config: WSServerServiceConfig): Promise<Result<WebSocket.Server>> {
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

    async validateConfig(config: WSServerServiceConfig): Promise<Result<void>> {
        const client = await this.getServer(config);
        if (!client.failed) {
            client.result.close(); // Close the server after testing that it can be opened
            return emptySuccess();
        } else {
            return client; // Return produced error
        }
    }

    async createClient(config: WSServerServiceConfig): Promise<Result<WSServerServiceClient>> {
        const client = await this.getServer(config);
        if (client.failed) {
            return client; // Pass the error to the framework
        }
        this.nodecg.log.info("Successfully started WebSocket server.");
        return success({
            getRawClient() {
                return client.result;
            },
        });
    }

    stopClient(client: WSServerServiceClient): void {
        client.getRawClient().close();
    }
}
