import { NodeCG } from "nodecg/types/server";
import { emptySuccess, error, Result, success } from "nodecg-io-core/extension/utils/result";
import { ServiceClient } from "nodecg-io-core/extension/types";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import * as OBSWebSocket from "obs-websocket-js";

interface OBSServiceConfig {
    host: string;
    port: number;
    password: string;
}

export type OBSServiceClient = ServiceClient<OBSWebSocket>;

module.exports = (nodecg: NodeCG) => {
    new OBSService(nodecg, "obs", __dirname, "../obs-schema.json").register();
};

class OBSService extends ServiceBundle<OBSServiceConfig, OBSServiceClient> {
    async validateConfig(config: OBSServiceConfig): Promise<Result<void>> {
        const client = new OBSWebSocket();
        let failed = false;
        client.once("AuthenticationFailure", () => {
            failed = true;
        });
        await client.connect({ address: `${config.host}:${config.port}`, password: config.password });
        if (failed) {
            return error("Could not connect or authenticate.");
        }
        return emptySuccess();
    }

    async createClient(config: OBSServiceConfig): Promise<Result<OBSServiceClient>> {
        const client = new OBSWebSocket();
        await client.connect({ address: `${config.host}:${config.port}`, password: config.password });
        return success({
            getNativeClient() {
                return client;
            },
        });
    }

    stopClient(client: OBSServiceClient) {
        client.getNativeClient().disconnect();
    }
}
