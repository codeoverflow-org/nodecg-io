import { NodeCG } from "nodecg-types/types/server";
import { Result, emptySuccess, success, error, ServiceBundle } from "nodecg-io-core";
import { Atem } from "atem-connection";

interface AtemServiceConfig {
    address: string;
    port?: number;
    debugBuffers?: boolean;
    disableMultithreaded?: boolean;
    childProcessTimeout?: number;
}

export type AtemServiceClient = Atem;

module.exports = (nodecg: NodeCG) => {
    new AtemService(nodecg, "atem", __dirname, "../atem-schema.json").register();
};

class AtemService extends ServiceBundle<AtemServiceConfig, AtemServiceClient> {
    async validateConfig(config: AtemServiceConfig): Promise<Result<void>> {
        return new Promise((resolve, reject) => {
            const atem = new Atem(config);
            atem.connect(config.address, config.port);
            atem.on("connected", () => resolve(emptySuccess()));
            atem.on("error", (e) => reject(error(e)));
        });
    }

    async createClient(config: AtemServiceConfig): Promise<Result<AtemServiceClient>> {
        const atem = new Atem(config);
        atem.connect(config.address, config.port);
        return success(atem);
    }

    stopClient(client: AtemServiceClient) {
        client.disconnect();
    }

    removeHandlers(client: AtemServiceClient) {
        client.removeAllListeners();
    }
}
