import { NodeCG } from "nodecg/types/server";
import { Result, emptySuccess, success, ServiceBundle } from "nodecg-io-core";
import { TwitchChatServiceClient } from "./twitchClient";

export interface TwitchServiceConfig {
    oauthKey: string;
}

export { TwitchChatServiceClient } from "./twitchClient";

module.exports = (nodecg: NodeCG) => {
    new TwitchService(nodecg, "twitch-chat", __dirname, "../twitch-schema.json").register();
};

class TwitchService extends ServiceBundle<TwitchServiceConfig, TwitchChatServiceClient> {
    async validateConfig(config: TwitchServiceConfig): Promise<Result<void>> {
        await TwitchChatServiceClient.getTokenInfo(config); // This will throw a error if the token is invalid
        return emptySuccess();
    }

    async createClient(config: TwitchServiceConfig): Promise<Result<TwitchChatServiceClient>> {
        this.nodecg.log.info("Connecting to twitch chat...");
        const client = await TwitchChatServiceClient.createClient(config);
        this.nodecg.log.info("Successfully connected to twitch.");

        return success(client);
    }

    stopClient(client: TwitchChatServiceClient): void {
        client.quit().then(() => this.nodecg.log.info("Successfully stopped twitch client."));
    }

    removeHandlers(client: TwitchChatServiceClient): void {
        client.removeListener();
    }
}
