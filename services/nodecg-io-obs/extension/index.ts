import { NodeCG } from "nodecg-types/types/server";
import { Result, emptySuccess, success, error, ServiceBundle, Logger } from "nodecg-io-core";
import OBSWebSocket from "obs-websocket-js";

interface OBSServiceConfig {
    host: string;
    port: number;
    isSecure?: boolean;
    password?: string;
}

export type OBSServiceClient = OBSWebSocket;

module.exports = (nodecg: NodeCG) => {
    new OBSService(nodecg, "obs", __dirname, "../obs-schema.json").register();
};

class OBSService extends ServiceBundle<OBSServiceConfig, OBSServiceClient> {
    async validateConfig(config: OBSServiceConfig): Promise<Result<void>> {
        const client = new OBSWebSocket();
        try {
            await this.connectClient(client, config);

            client.disconnect();
        } catch (e) {
            return error(e.error);
        }
        return emptySuccess();
    }

    async createClient(config: OBSServiceConfig, logger: Logger): Promise<Result<OBSServiceClient>> {
        const client = new OBSWebSocket();
        try {
            await this.connectClient(client, config);
            logger.info("Connected to OBS successfully.");
        } catch (e) {
            return error(e.error);
        }

        return success(client);
    }

    private async connectClient(client: OBSWebSocket, config: OBSServiceConfig): Promise<void> {
        const protocol = config.isSecure ? "wss" : "ws";
        await client.connect(`${protocol}://${config.host}:${config.port}`, config.password);
    }

    stopClient(client: OBSServiceClient) {
        client.disconnect();
    }

    removeHandlers(client: OBSServiceClient) {
        client.removeAllListeners();
    }
}
