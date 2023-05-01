import NodeCG from "@nodecg/types";
import { Result, emptySuccess, success, ServiceBundle, Logger } from "nodecg-io-core";
import { SacnSenderServiceClient } from "./sacnSenderClient";

export interface SacnSenderServiceConfig {
    universe: number;
    port?: number;
    reuseAddr?: boolean;
}

export { SacnSenderServiceClient } from "./sacnSenderClient";

module.exports = (nodecg: NodeCG.ServerAPI) => {
    new SacnSenderService(nodecg, "sacn-sender", __dirname, "../sacn-sender-schema.json").register();
};

class SacnSenderService extends ServiceBundle<SacnSenderServiceConfig, SacnSenderServiceClient> {
    async validateConfig(): Promise<Result<void>> {
        return emptySuccess();
    }

    async createClient(config: SacnSenderServiceConfig): Promise<Result<SacnSenderServiceClient>> {
        const sacn = new SacnSenderServiceClient(config);
        return success(sacn);
    }

    stopClient(client: SacnSenderServiceClient, logger: Logger): void {
        client.close();
        logger.info("Successfully stopped sACN Sender.");
    }
}
