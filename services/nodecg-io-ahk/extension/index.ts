import { NodeCG } from "nodecg-types/types/server";
import { Result, emptySuccess, success, ServiceBundle, Logger } from "nodecg-io-core";
import { AHK } from "./AHK";

interface AHKServiceConfig {
    host: string;
    port: number;
}

export type AHKServiceClient = AHK;

module.exports = (nodecg: NodeCG) => {
    new AhkService(nodecg, "ahk", __dirname, "../ahk-schema.json").register();
};

class AhkService extends ServiceBundle<AHKServiceConfig, AHKServiceClient> {
    async validateConfig(config: AHKServiceConfig, logger: Logger): Promise<Result<void>> {
        const ahk = new AHK(logger, config.host, config.port);
        await ahk.testConnection(); // Will throw an error if server doesn't exist.
        return emptySuccess();
    }

    async createClient(config: AHKServiceConfig, logger: Logger): Promise<Result<AHKServiceClient>> {
        const ahk = new AHK(logger, config.host, config.port);
        return success(ahk);
    }

    stopClient() {
        // Not needed or possible
    }
}
