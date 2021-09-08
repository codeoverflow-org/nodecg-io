import { NodeCG } from "nodecg/types/server";
import { Result, emptySuccess, success, ServiceBundle } from "nodecg-io-core";
import { IntelliJ } from "./intellij";

interface IntelliJServiceConfig {
    address?: string;
}

export type IntelliJServiceClient = IntelliJ;

module.exports = (nodecg: NodeCG) => {
    new IntellijService(nodecg, "intellij", __dirname, "../intellij-schema.json").register();
};

class IntellijService extends ServiceBundle<IntelliJServiceConfig, IntelliJServiceClient> {
    async validateConfig(config: IntelliJServiceConfig): Promise<Result<void>> {
        const ij = new IntelliJ(config.address);
        await ij.rawRequest("available_methods", {});
        return emptySuccess();
    }

    async createClient(config: IntelliJServiceConfig): Promise<Result<IntelliJServiceClient>> {
        const ij = new IntelliJ(config.address);
        await ij.rawRequest("available_methods", {});
        this.nodecg.log.info(`Successfully connected to IntelliJ at ${ij.address}.`);
        return success(ij);
    }

    stopClient() {
        // Not needed or possible
    }
}
