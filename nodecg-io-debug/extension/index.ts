import { NodeCG } from "nodecg-types/types/server";
import { Result, emptySuccess, success, ServiceBundle } from "nodecg-io-core";
import { DebugHelper } from "./debugHelper";

export type DebugConfig = {
    // Nothing to configure
};

export { DebugHelper } from "./debugHelper";

module.exports = (nodecg: NodeCG) => {
    new DebugService(nodecg, "debug", __dirname, "../schema.json").register();
};

class DebugService extends ServiceBundle<DebugConfig, DebugHelper> {
    async validateConfig(_: DebugConfig): Promise<Result<void>> {
        return emptySuccess();
    }

    async createClient(_: DebugConfig): Promise<Result<DebugHelper>> {
        const client = DebugHelper.createClient(this.nodecg);
        this.nodecg.log.info("Successfully created debug helper.");
        return success(client);
    }

    stopClient(_: DebugHelper): void {
        this.nodecg.log.info("Successfully stopped debug client.");
    }

    removeHandlers(client: DebugHelper): void {
        client.removeAllListeners();
    }

    requiresNoConfig = true;
}
