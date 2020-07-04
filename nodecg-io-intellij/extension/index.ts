import { NodeCG } from "nodecg/types/server";
import { ServiceProvider } from "nodecg-io-core/extension/types";
import { emptySuccess, success, Result } from "nodecg-io-core/extension/utils/result";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import { IntelliJ } from "./intellij";

interface IntelliJServiceConfig {
    address: string;
}

export interface IntelliJServiceClient {
    getRawClient(): IntelliJ;
}

module.exports = (nodecg: NodeCG): ServiceProvider<IntelliJServiceClient> | undefined => {
    const intellijService = new IntellijService(nodecg, __dirname, "intellij", "../intellij-schema.json");
    return intellijService.register();
};

class IntellijService extends ServiceBundle {
    async validateConfig(config: IntelliJServiceConfig): Promise<Result<void>> {
        const address = config.address;
        const ij = new IntelliJ(address);
        await ij.rawRequest("available_methods", {});
        return emptySuccess();
    }

    reateClient(nodecg: NodeCG): (config: IntelliJServiceConfig) => Promise<Result<IntelliJServiceClient>> {
        return async (config) => {
            const ij = new IntelliJ(config.address);
            await ij.rawRequest("available_methods", {});
            nodecg.log.info("Successfully connected to IntelliJ at " + config.address + ".");
            return success({
                getRawClient() {
                    return ij;
                },
            });
        };
    }
}
