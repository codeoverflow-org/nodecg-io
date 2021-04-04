import { NodeCG } from "nodecg/types/server";
import { Result, emptySuccess, success, ServiceBundle } from "nodecg-io-core";
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

    async createClient(config: TianeServiceConfig): Promise<Result<TianeServiceClient>> {
        this.nodecg.log.info("Connecting to TIANE...");
        const client = await Tiane.connect(config.address);
        this.nodecg.log.info("Successfully connected to TIANE.");

        return success(client);
    }

    stopClient(client: TianeServiceClient): void {
        client.close();
        this.nodecg.log.info("Disconnected from TIANE.");
    }

    removeHandlers(client: TianeServiceClient): void {
        client.removeAllListeners();
    }
}
