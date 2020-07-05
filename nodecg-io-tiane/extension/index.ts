import { NodeCG } from "nodecg/types/server";
import { ServiceProvider } from "nodecg-io-core/extension/types";
import { emptySuccess, success, error, Result } from "nodecg-io-core/extension/utils/result";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import { Tiane, connectTiane } from "./tiane";

interface TianeServiceConfig {
    address: string;
}

export interface TianeServiceClient {
    getRawClient(): Tiane;
}

module.exports = (nodecg: NodeCG): ServiceProvider<TianeServiceClient> | undefined => {
    const tianeService = new TianeServiceBundle(nodecg, "tiane", __dirname, "../tiane-schema.json");
    return tianeService.register();
};

class TianeServiceBundle extends ServiceBundle<TianeServiceConfig, TianeServiceClient> {
    async validateConfig(config: TianeServiceConfig): Promise<Result<void>> {
        try {
            (await connectTiane(config.address)).close();
            return emptySuccess();
        } catch (err) {
            return error(err.toString());
        }
    }

    async createClient(config: TianeServiceConfig): Promise<Result<TianeServiceClient>> {
        this.nodecg.log.info("Connecting to tiane...");
        const client = await connectTiane(config.address);
        this.nodecg.log.info("Successfully connected to tiane.");

        return success({
            getRawClient() {
                return client;
            },
        });
    }

    stopClient(client: TianeServiceClient): void {
        client.getRawClient().close();
    }
}
