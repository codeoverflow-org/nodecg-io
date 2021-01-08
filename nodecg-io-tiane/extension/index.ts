import { NodeCG } from "nodecg/types/server";
import { ServiceClient } from "nodecg-io-core/extension/types";
import { emptySuccess, Result, success } from "nodecg-io-core/extension/utils/result";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import { Tiane, connectTiane } from "./tiane";

interface TianeServiceConfig {
    address: string;
}

export type TianeServiceClient = ServiceClient<Tiane>;

module.exports = (nodecg: NodeCG) => {
    new TianeService(nodecg, "tiane", __dirname, "../tiane-schema.json").register();
};

class TianeService extends ServiceBundle<TianeServiceConfig, TianeServiceClient> {
    async validateConfig(config: TianeServiceConfig): Promise<Result<void>> {
        (await connectTiane(config.address)).close();
        return emptySuccess();
    }

    async createClient(config: TianeServiceConfig): Promise<Result<TianeServiceClient>> {
        this.nodecg.log.info("Connecting to TIANE...");
        const client = await connectTiane(config.address);
        this.nodecg.log.info("Successfully connected to TIANE.");

        return success({
            getNativeClient() {
                return client;
            },
        });
    }

    stopClient(client: TianeServiceClient): void {
        client.getNativeClient().close();
        this.nodecg.log.info("Disconnected from TIANE.");
    }

    removeHandlers(client: TianeServiceClient): void {
        client.getNativeClient().removeAllListeners();
    }
}
