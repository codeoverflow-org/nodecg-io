import { NodeCG } from "nodecg/types/server";
import { Result, emptySuccess, success, ServiceBundle } from "nodecg-io-core";
import { TwitchApiServiceClient } from "./twitchApiClient";

export interface TwitchApiServiceConfig {
    oauthKey: string;
}

export { TwitchApiServiceClient } from "./twitchApiClient";

module.exports = (nodecg: NodeCG) => {
    new TwitchService(nodecg, "twitch-api", __dirname, "../twitch-schema.json").register();
};

class TwitchService extends ServiceBundle<TwitchApiServiceConfig, TwitchApiServiceClient> {
    async validateConfig(config: TwitchApiServiceConfig): Promise<Result<void>> {
        await TwitchApiServiceClient.getTokenInfo(config); // This will throw a error if the token is invalid
        return emptySuccess();
    }

    async createClient(config: TwitchApiServiceConfig): Promise<Result<TwitchApiServiceClient>> {
        this.nodecg.log.info("Connecting to twitch chat...");
        const client = await TwitchApiServiceClient.createClient(config);
        this.nodecg.log.info("Successfully connected to twitch.");

        return success(client);
    }

    stopClient(_client: TwitchApiServiceClient): void {
        // can't be stopped, has no persistent connection
    }
}
