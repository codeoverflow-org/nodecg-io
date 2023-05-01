import NodeCG from "@nodecg/types";
import { Result, emptySuccess, success, ServiceBundle, Logger } from "nodecg-io-core";
import { ApiClient } from "@twurple/api";
import { createAuthProvider, getTokenInfo, TwitchServiceConfig } from "nodecg-io-twitch-auth";

export type TwitchApiServiceClient = ApiClient;

module.exports = (nodecg: NodeCG.ServerAPI) => {
    new TwitchService(nodecg, "twitch-api", __dirname, "../twitch-api-schema.json").register();
};

class TwitchService extends ServiceBundle<TwitchServiceConfig, TwitchApiServiceClient> {
    async validateConfig(config: TwitchServiceConfig): Promise<Result<void>> {
        await getTokenInfo(config); // This will throw a error if the token is invalid
        return emptySuccess();
    }

    async createClient(config: TwitchServiceConfig, logger: Logger): Promise<Result<TwitchApiServiceClient>> {
        const authProvider = await createAuthProvider(config);
        const client = new ApiClient({ authProvider });
        logger.info("Successfully created twitch-api client.");

        return success(client);
    }

    stopClient(_client: TwitchApiServiceClient): void {
        // can't be stopped, has no persistent connection
    }
}
