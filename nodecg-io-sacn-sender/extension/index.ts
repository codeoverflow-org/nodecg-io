import { NodeCG } from "nodecg-types/types/server";
import { Result, emptySuccess, success, ServiceBundle } from "nodecg-io-core";
import { SacnSenderServiceClient } from "./sacnSenderClient";

export interface SacnSenderServiceConfig {
    universe: number;
    port?: number;
    reuseAddr?: boolean;
}

export { SacnSenderServiceClient } from "./sacnSenderClient";

module.exports = (nodecg: NodeCG) => {
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

    stopClient(client: SacnSenderServiceClient): void {
        client.close();
        this.nodecg.log.info("Successfully stopped sACN Sender.");
    }
}
