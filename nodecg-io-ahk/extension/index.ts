import { NodeCG } from "nodecg/types/server";
import { ServiceProvider, ServiceClient } from "nodecg-io-core/extension/types";
import { emptySuccess, success, Result } from "nodecg-io-core/extension/utils/result";
import { ServiceBundle } from "nodecg-io-core/extension/serviceBundle";
import { AHK } from "./AHK";

interface AHKServiceConfig {
    host: string;
    port: number;
}

export interface AHKServiceClient extends ServiceClient<AHK> {}

module.exports = (nodecg: NodeCG): ServiceProvider<AHKServiceClient> | undefined => {
    const ahkService = new AhkService(nodecg, "ahk", __dirname, "../ahk-schema.json");
    return ahkService.register();
};
class AhkService extends ServiceBundle<AHKServiceConfig, AHKServiceClient> {
    async validateConfig(config: AHKServiceConfig): Promise<Result<void>> {
        const ahk = new AHK(config.host, config.port);
        await ahk.testConnection(); // Will throw an error if server doesn't exist.
        return emptySuccess();
    }

    async createClient(config: AHKServiceConfig): Promise<Result<AHKServiceClient>> {
        const ahk = new AHK(config.host, config.port);
        return success({
            getNativeClient() {
                return ahk;
            },
        });
    }

    stopClient() {
        // Not needed or possible
    }
}
