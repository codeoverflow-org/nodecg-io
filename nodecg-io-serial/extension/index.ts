import { NodeCG } from "nodecg/types/server";
import { emptySuccess, success, Result } from "nodecg-io-core/extension/utils/result";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import { SerialServiceClient, SerialServiceConfig } from "./SerialClient";

module.exports = (nodecg: NodeCG) => {
    new SerialService(nodecg, "serial", __dirname, "../serial-schema.json").register();
};

export { SerialServiceClient } from "./SerialClient";

class SerialService extends ServiceBundle<SerialServiceConfig, SerialServiceClient> {
    async validateConfig(config: SerialServiceConfig): Promise<Result<void>> {
        const result = await SerialServiceClient.inferPort(config.device);
        this.nodecg.log.info(result);
        return emptySuccess();
    }

    async createClient(config: SerialServiceConfig): Promise<Result<SerialServiceClient>> {
        return success(new SerialServiceClient(config));
    }

    stopClient(client: SerialServiceClient): void {
        client.close();
    }
}
