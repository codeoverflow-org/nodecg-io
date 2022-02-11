import { NodeCG } from "nodecg-types/types/server";
import { Result, emptySuccess, success, ServiceBundle, Logger } from "nodecg-io-core";
import { Tiane } from "./tiane";

interface TianeServiceConfig {
    address: string;
}

export type TianeServiceClient = Tiane;

module.exports = (nodecg: NodeCG) => {
    new TianeService(nodecg, "tiane", __dirname, "../tiane-schema.json").register();
};

class TianeService extends ServiceBundle<TianeServiceConfig, TianeServiceClient> {
    async validateConfig(config: TianeServiceConfig): Promise<Result<void>> {
        (await Tiane.connect(config.address)).close();
        return emptySuccess();
    }

    async createClient(config: TianeServiceConfig, logger: Logger): Promise<Result<TianeServiceClient>> {
        logger.info("Connecting to TIANE...");
        const client = await Tiane.connect(config.address);
        logger.info("Successfully connected to TIANE.");

        return success(client);
    }

    stopClient(client: TianeServiceClient, logger: Logger): void {
        client.close();
        logger.info("Disconnected from TIANE.");
    }

    removeHandlers(client: TianeServiceClient): void {
        client.removeAllListeners();
    }
}
