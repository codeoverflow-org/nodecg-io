import NodeCG from "@nodecg/types";
import { Result, emptySuccess, success, ServiceBundle, Logger } from "nodecg-io-core";
import { DebugHelper } from "./debugHelper";

export { DebugHelper } from "./debugHelper";

module.exports = (nodecg: NodeCG.ServerAPI) => {
    new DebugService(nodecg, "debug").register();
};

class DebugService extends ServiceBundle<never, DebugHelper> {
    async validateConfig(): Promise<Result<void>> {
        return emptySuccess();
    }

    async createClient(_: never, logger: Logger): Promise<Result<DebugHelper>> {
        const client = DebugHelper.createClient(this.nodecg, logger);
        logger.info("Successfully created debug helper.");
        return success(client);
    }

    stopClient(_: DebugHelper, logger: Logger): void {
        logger.info("Successfully stopped debug client.");
    }

    removeHandlers(client: DebugHelper): void {
        client.removeAllListeners();
    }

    requiresNoConfig = true;
}
