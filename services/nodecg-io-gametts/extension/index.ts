import NodeCG from "@nodecg/types";
import { Result, emptySuccess, success, ServiceBundle, Logger } from "nodecg-io-core";
import { GameTTSClient } from "./gameTtsClient";

export interface GameTTSConfig {
    host: string;
    useHttps?: boolean;
}

export { GameTTSClient } from "./gameTtsClient";

module.exports = (nodecg: NodeCG.ServerAPI) => {
    new GameTTSService(nodecg, "gametts", __dirname, "../schema.json").register();
};

class GameTTSService extends ServiceBundle<GameTTSConfig, GameTTSClient> {
    async validateConfig(_: GameTTSConfig): Promise<Result<void>> {
        // Connectivity check is done below
        return emptySuccess();
    }

    async createClient(config: GameTTSConfig, logger: Logger): Promise<Result<GameTTSClient>> {
        const client = new GameTTSClient(config);
        const connectivityCheckResult = await client.isGameTTSAvailable();
        if (connectivityCheckResult.failed) {
            return connectivityCheckResult;
        }
        logger.info("Successfully created gametts client.");
        return success(client);
    }

    stopClient(_: GameTTSClient, _logger: Logger): void {
        // Client is stateless, no need to stop anything
    }
}
