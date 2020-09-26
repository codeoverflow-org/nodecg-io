import { NodeCG } from "nodecg/types/server";
import { emptySuccess, Result, success } from "nodecg-io-core/extension/utils/result";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import { SacnReceiverServiceClient } from "./sacnReceiverClient";
import { Receiver } from "sacn";

interface SacnReceiverServiceConfig {
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
        const sacn = new Receiver(config);
        return success(new SacnReceiverServiceClient(sacn));
    }

    stopClient(client: SacnReceiverServiceClient): void {
        client.getNativeClient().close();
        this.nodecg.log.info("Stopped sACN Receiver successfully.");
    }
}
