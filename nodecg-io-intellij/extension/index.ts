import { NodeCG } from "nodecg/types/server";
import { ServiceProvider, ServiceClient } from "nodecg-io-core/extension/types";
import { emptySuccess, success, Result } from "nodecg-io-core/extension/utils/result";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import { IntelliJ } from "./intellij";

interface IntelliJServiceConfig {
    address: string;
}

export interface IntelliJServiceClient extends ServiceClient<IntelliJ> {}

module.exports = (nodecg: NodeCG): ServiceProvider<IntelliJServiceClient> | undefined => {
    const intellijService = new IntellijService(nodecg, "intellij", __dirname, "../intellij-schema.json");
    return intellijService.register();
};

class IntellijService extends ServiceBundle<IntelliJServiceConfig, IntelliJServiceClient> {
    async validateConfig(config: IntelliJServiceConfig): Promise<Result<void>> {
        const address = config.address;
        const ij = new IntelliJ(address);
        await ij.rawRequest("available_methods", {});
        return emptySuccess();
    }

    async createClient(config: IntelliJServiceConfig): Promise<Result<IntelliJServiceClient>> {
        const ij = new IntelliJ(config.address);
        await ij.rawRequest("available_methods", {});
        this.nodecg.log.info("Successfully connected to IntelliJ at " + config.address + ".");
        return success({
            getNativeClient() {
                return ij;
            },
        });
    }

    stopClient() {
        // Not needed or possible
    }
}
