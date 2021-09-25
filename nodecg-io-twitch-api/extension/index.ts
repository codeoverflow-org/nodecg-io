import { NodeCG } from "nodecg-types/types/server";
import { Result, emptySuccess, success, ServiceBundle } from "nodecg-io-core";
import { ApiClient } from "twitch";
import { createAuthProvider, getTokenInfo, TwitchServiceConfig } from "nodecg-io-twitch-auth";

export type TwitchApiServiceClient = ApiClient;

module.exports = (nodecg: NodeCG) => {
    new TwitchService(nodecg, "twitch-api", __dirname, "../twitch-api-schema.json").register();
};

class TwitchService extends ServiceBundle<TwitchServiceConfig, TwitchApiServiceClient> {
    async validateConfig(config: TwitchServiceConfig): Promise<Result<void>> {
        await getTokenInfo(config); // This will throw a error if the token is invalid
        return emptySuccess();
    }

    async createClient(config: TwitchServiceConfig): Promise<Result<TwitchApiServiceClient>> {
        const authProvider = await createAuthProvider(config);
        const client = new ApiClient({ authProvider });
        this.nodecg.log.info("Successfully created twitch-api client.");

        return success(client);
    }

    stopClient(_client: TwitchApiServiceClient): void {
        // can't be stopped, has no persistent connection
    }
}
