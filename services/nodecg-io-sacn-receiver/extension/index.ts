import { NodeCG } from "nodecg-types/types/server";
import { Result, emptySuccess, success, ServiceBundle, Logger } from "nodecg-io-core";
import { SacnReceiverServiceClient } from "./sacnReceiverClient";

export interface SacnReceiverServiceConfig {
    universe: number[];
    port?: number;
    iface?: string;
    reuseAddr?: boolean;
}

export { SacnReceiverServiceClient } from "./sacnReceiverClient";

module.exports = (nodecg: NodeCG) => {
    new SacnReceiverService(nodecg, "sacn-receiver", __dirname, "../sacn-receiver-schema.json").register();
};

class SacnReceiverService extends ServiceBundle<SacnReceiverServiceConfig, SacnReceiverServiceClient> {
    async validateConfig(): Promise<Result<void>> {
        return emptySuccess();
    }

    async createClient(config: SacnReceiverServiceConfig): Promise<Result<SacnReceiverServiceClient>> {
        const sacn = new SacnReceiverServiceClient(config);
        return success(sacn);
    }

    stopClient(client: SacnReceiverServiceClient, logger: Logger): void {
        client.close();
        logger.info("Successfully stopped sACN Receiver.");
    }

    removeHandlers(client: SacnReceiverServiceClient): void {
        client.removeAllListeners();
    }
}
