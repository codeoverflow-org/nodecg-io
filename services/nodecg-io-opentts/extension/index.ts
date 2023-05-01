import NodeCG from "@nodecg/types";
import { Result, emptySuccess, success, ServiceBundle, Logger, error } from "nodecg-io-core";
import { OpenTTSClient } from "./openTtsClient";

export interface OpenTTSConfig {
    host: string;
    useHttps?: boolean;
}

export { OpenTTSClient, OpenTTSVoice } from "./openTtsClient";

module.exports = (nodecg: NodeCG.ServerAPI) => {
    new OpenTTSService(nodecg, "opentts", __dirname, "../schema.json").register();
};

class OpenTTSService extends ServiceBundle<OpenTTSConfig, OpenTTSClient> {
    async validateConfig(config: OpenTTSConfig): Promise<Result<void>> {
        if (await OpenTTSClient.isOpenTTSAvailable(config)) return emptySuccess();
        else return error("Unable to reach OpenTTS server at the specified host address");
    }

    async createClient(config: OpenTTSConfig, logger: Logger): Promise<Result<OpenTTSClient>> {
        const client = new OpenTTSClient(config);
        logger.info("Successfully created OpenTTS client.");
        return success(client);
    }

    stopClient(_: OpenTTSClient, _logger: Logger): void {
        // Client is stateless, no need to stop anything
    }
}
